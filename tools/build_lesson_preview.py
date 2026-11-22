"""Превью-страница урока ai-excel: озвучка + стик-сцены + карточка практики.

Панель сцен: видна только текущая сцена, смена по тайм-кодам озвучки
(timings.json + маркеры "@scene <id>" в script.txt). Фон панели — живая
таблица с тикающими значениями и формулами (canvas).

Запуск из harness:
  python tools/build_lesson_preview.py courses/ai-excel/lessons/01-srochnyj-otchet
"""
import base64
import json
import re
import sys
from html import escape
from pathlib import Path

HARNESS = Path(r"C:/Users/Olga/harness")
STICK_JS = HARNESS / "tools/stick-scene/runtime/stick.js"


def load_meta(lesson: Path) -> dict:
    """meta.json урока: заголовок, подписи сцен, слова для подсветки фона.

    Формат:
      {"title": "Урок 1. Срочный отчёт и первый запрос",
       "tts": "Яндекс, голоса jane и filipp",
       "scenes": {"ax1-chat": "Чат советует — агент делает", ...},
       "words":  {"ax1-cells": ["контекст", "задача", "формат", "проверка"]}}
    """
    p = lesson / "meta.json"
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return {}


def gecko_b64(lesson: Path) -> str:
    """Геккон-оверлей курса в правом верхнем углу панели (инлайн, чтобы архив был самодостаточным).

    Ищем assets/gecko-overlay.png вверх от папки урока (курс может лежать на разной глубине).
    """
    p = None
    for parent in [lesson] + list(lesson.parents)[:4]:
        cand = parent / "assets" / "gecko-overlay.png"
        if cand.exists():
            p = cand
            break
    if not p:
        print("  [!] геккон не найден (assets/gecko-overlay.png) — превью без оверлея")
        return ""
    return base64.b64encode(p.read_bytes()).decode("ascii")


def md_to_html(md: str) -> str:
    out, table, ul = [], False, False
    for line in md.splitlines():
        s = line.rstrip()
        if s.startswith("|"):
            cells = [c.strip() for c in s.strip("|").split("|")]
            if all(re.fullmatch(r":?-+:?", c) for c in cells):
                continue
            if not table:
                out.append('<div class="tw"><table>'); table = True
            tag = "th" if not any("<tr>" in o for o in out[-1:]) else "td"
            out.append("<tr>" + "".join(f"<{tag}>{inline(c)}</{tag}>" for c in cells) + "</tr>")
            continue
        if table:
            out.append("</table></div>"); table = False
        # продолжение пункта списка (перенос строки внутри li): приклеиваем к предыдущему <li>,
        # иначе список рвётся и нумерация начинается заново с 1
        if (ul and out and out[-1].endswith("</li>") and s.strip()
                and not re.match(r"^(\d+\.\s|[-*]\s|#{1,3}\s)", s)):
            out[-1] = out[-1][:-5] + " " + inline(s.strip()) + "</li>"
            continue
        if s.startswith("### "):
            out.append(f"<h3>{inline(s[4:])}</h3>"); continue
        if s.startswith("## "):
            out.append(f"<h2>{inline(s[2:])}</h2>"); continue
        if s.startswith("# "):
            out.append(f"<h2>{inline(s[2:])}</h2>"); continue
        m = re.match(r"^(\d+)\.\s+(.*)", s)
        if m:
            if not ul:
                out.append("<ol>"); ul = "ol"
            out.append(f"<li>{inline(m.group(2))}</li>"); continue
        if s.startswith("- "):
            if not ul:
                out.append("<ul>"); ul = "ul"
            out.append(f"<li>{inline(s[2:])}</li>"); continue
        if ul:
            out.append(f"</{ul}>"); ul = False
        if s.strip():
            out.append(f"<p>{inline(s)}</p>")
    if table:
        out.append("</table></div>")
    if ul:
        out.append(f"</{ul}>")
    return "\n".join(out)


def inline(s: str) -> str:
    s = escape(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    return s


def build_cues(lesson: Path):
    """@scene-маркеры в script.txt + timings.json -> [{scene, start}]."""
    timings = json.loads((lesson / "timings.json").read_text(encoding="utf-8"))
    cues, rep = [], -1
    pending = None
    for line in (lesson / "script.txt").read_text(encoding="utf-8").splitlines():
        m = re.match(r"^@scene\s+([\w-]+)", line.strip())
        if m:
            pending = m.group(1)
            continue
        if re.match(r"^[AB]:\s", line.strip()):
            rep += 1
            if pending and rep < len(timings):
                cues.append({"scene": pending, "start": timings[rep]["start"]})
                pending = None
    cues.sort(key=lambda c: c["start"])
    return cues


BG_JS = r"""
// Живой фон панели: таблица с тикающими значениями и формулами.
(function(){
  const cv = document.getElementById('bg-grid');
  if(!cv) return;
  const g = cv.getContext('2d');
  const COLS = 7, ROWS = 5;
  let W = 0, H = 0, cw = 0, ch = 0;
  function resize(){
    const r = cv.parentElement.getBoundingClientRect();
    W = cv.width = Math.max(320, r.width * devicePixelRatio);
    H = cv.height = Math.max(200, r.height * devicePixelRatio);
    cw = W / COLS; ch = H / ROWS;
    g.setTransform(1,0,0,1,0,0);
  }
  resize(); addEventListener('resize', resize);
  const rnd = (a,b)=>a+Math.random()*(b-a);
  function mkVal(c, r){
    const t = Math.random();
    if(t < 0.18) return '=B'+(r+2)+'*C'+(r+2);
    if(t < 0.30) return '=SUM('+(c+2)+':'+(c+8)+')';
    if(t < 0.42) return (rnd(5,40)).toFixed(1)+'%';
    if(t < 0.52) return '0'+Math.floor(rnd(1,9))+'.0'+Math.floor(rnd(10,99));
    return Math.floor(rnd(1200, 486000)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  const cells = [];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
    cells.push({r, c, v: mkVal(c,r), flash: 0});
  function tick(){
    const n = 1 + Math.floor(Math.random()*2);
    for(let i=0;i<n;i++){
      const cell = cells[Math.floor(Math.random()*cells.length)];
      cell.v = mkVal(cell.c, cell.r); cell.flash = 1;
    }
  }
  setInterval(tick, 900);

  // --- подсветка слов в ячейках фона (включается по cue озвучки) ---
  const WORD_CELLS = [[1,1],[1,4],[3,2],[3,5]];
  let wordState = null;
  window.bgSetWords = function(words, start, audio){
    wordState = { words: words, start: start, audio: audio || null, t0: performance.now() };
  };
  window.bgClearWords = function(){ wordState = null; };

  function draw(){
    g.clearRect(0,0,W,H);
    g.lineWidth = 1;
    // сетка
    g.strokeStyle = '#ededed';
    for(let c=0;c<=COLS;c++){ g.beginPath(); g.moveTo(c*cw,0); g.lineTo(c*cw,H); g.stroke(); }
    for(let r=0;r<=ROWS;r++){ g.beginPath(); g.moveTo(0,r*ch); g.lineTo(W,r*ch); g.stroke(); }
    // шапка-строка
    g.fillStyle = '#f7f7f7';
    g.fillRect(0,0,W,ch*0.8);
    const busy = {};
    if(wordState){ WORD_CELLS.forEach(p => { busy[p[0]+':'+p[1]] = true; }); }
    for(const cell of cells){
      if(busy[cell.r+':'+cell.c]){ continue; }
      const x = cell.c*cw, y = cell.r*ch;
      if(cell.flash > 0){
        g.fillStyle = 'rgba(253,230,138,'+(cell.flash*0.55)+')';
        g.fillRect(x+1, y+1, cw-2, ch-2);
        cell.flash = Math.max(0, cell.flash - 0.018);
      }
      g.fillStyle = cell.flash > 0.4 ? '#78350f' : (cell.v.startsWith('=') ? '#9aa7b4' : '#c4c4c4');
      g.font = (11*devicePixelRatio)+'px "Segoe UI", system-ui, sans-serif';
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(cell.v, x + 8*devicePixelRatio, y + ch/2);
    }
    if(wordState){
      const t = wordState.audio ? wordState.audio.currentTime
                                : (performance.now() - wordState.t0) / 1000;
      const el = t - wordState.start;
      for(let i=0; i<WORD_CELLS.length && i<wordState.words.length; i++){
        const k = Math.max(0, Math.min(1, (el - i*0.8) / 0.45));
        if(k <= 0) continue;
        const r = WORD_CELLS[i][0], c = WORD_CELLS[i][1];
        const x = c*cw, y = r*ch, cx = x + cw/2, cy = y + ch/2;
        g.save();
        g.globalAlpha = k;
        g.translate(cx, cy); g.scale(0.86 + 0.14*k, 0.86 + 0.14*k); g.translate(-cx, -cy);
        g.fillStyle = 'rgba(254,243,199,0.96)';
        g.fillRect(x+2, y+2, cw-4, ch-4);
        g.strokeStyle = '#fcd34d'; g.lineWidth = 2*devicePixelRatio;
        g.strokeRect(x+2, y+2, cw-4, ch-4);
        g.fillStyle = '#78350f';
        g.font = 'bold '+(15*devicePixelRatio)+'px "Segoe UI", system-ui, sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(wordState.words[i], cx, cy);
        g.restore();
      }
    }
    requestAnimationFrame(draw);
  }
  window.__bgDraw = draw;   // отладочный хук: принудительный кадр
  draw();
})();
"""

SYNC_JS_TPL = r"""
(function(){
  const cues = __CUES__;
  const order = __ORDER__;
  const vo = document.getElementById('vo');
  const figs = {};
  document.querySelectorAll('figure[data-scene]').forEach(f => figs[f.dataset.scene] = f);
  const dots = [...document.querySelectorAll('.dot')];
  let current = null, fired = {};

  function show(scene){
    if(current === scene) return;
    Object.entries(figs).forEach(([k,f]) => {
      f.classList.toggle('current', k === scene);
    });
    dots.forEach((d,i) => d.classList.toggle('on', order[i] === scene));
    current = scene;
  }
  function launch(scene){
    show(scene);
    const el = figs[scene] && figs[scene].querySelector('stick-scene');
    if(el) setTimeout(()=>el.dispatchEvent(new MouseEvent('click', {bubbles:true})), 350);
  }
  // первая сцена видна сразу (в покое), сыграет по своему тайм-коду
  show(order[0]);
  const wordCues = cues.filter(c => c.words);
  let wordActive = null;
  function syncWords(t){
    if(!window.bgSetWords) return;
    let act = null;
    for(const c of wordCues){ if(t >= c.start && t < c.start + 14){ act = c; break; } }
    if(act && wordActive !== act){ wordActive = act; bgSetWords(act.words, act.start, vo); }
    if(!act && wordActive){ wordActive = null; bgClearWords(); }
  }
  vo.addEventListener('timeupdate', ()=>{
    const t = vo.currentTime;
    for(const c of cues){
      const key = c.scene + ':' + c.start;
      if(t >= c.start && t < c.start + 10 && !fired[key]){ fired[key] = true; launch(c.scene); }
      if(t < c.start) fired[key] = false;
    }
    // сцена после последнего cue остаётся; до первого cue — первая
    if(t < cues[0].start) show(order[0]);
    syncWords(t);
    // подсветка текущей реплики в сценарии
    const ps = document.querySelectorAll('#dlg p');
    let best = null;
    ps.forEach(p=>{ if(parseFloat(p.dataset.start) <= t) best = p; });
    ps.forEach(p=>p.classList.toggle('now', p === best));
  });
  dots.forEach((d,i)=>d.addEventListener('click', ()=>{
    const c = cues[i];
    vo.currentTime = c ? c.start + 0.01 : 0;
    launch(order[i]);
    if(c && c.words && window.bgSetWords){ wordActive = c; bgSetWords(c.words, c.start, vo); }
  }));
})();
"""


def main():
    lesson = Path(sys.argv[1]).resolve()
    scenes_js = (lesson / "scenes.js").read_text(encoding="utf-8")
    stick_js = STICK_JS.read_text(encoding="utf-8")
    for blob, name in [(stick_js, "stick.js"), (scenes_js, "scenes.js")]:
        if "</script" in blob.lower():
            sys.exit(f"в {name} есть </script — инлайн сломается")
    card = md_to_html((lesson / "card.md").read_text(encoding="utf-8"))
    timings = json.loads((lesson / "timings.json").read_text(encoding="utf-8"))
    cues = build_cues(lesson)
    meta = load_meta(lesson)
    # слова, которые загораются в ячейках ФОНОВОЙ таблицы во время cue
    SCENE_WORDS = meta.get("words", {})
    for c in cues:
        if c["scene"] in SCENE_WORDS:
            c["words"] = SCENE_WORDS[c["scene"]]
    mp3 = next(lesson.glob("*.mp3"), None)
    mp3_name = mp3.name if mp3 else ""
    ids = re.findall(r"SC\['([a-z0-9-]+)'\]", scenes_js)
    # порядок показа = порядок cue; сцены без cue — в конец
    order = [c["scene"] for c in cues] + [i for i in ids if i not in [c["scene"] for c in cues]]
    titles = dict(meta.get("scenes", {}))
    title = meta.get("title") or f"Урок — {lesson.name}"
    tts_line = meta.get("tts", "озвучка Яндекс")
    scenes_html = "\n".join(
        f'<figure data-scene="{i}">'
        f'<stick-scene scene="{i}" play="hover" no-font zoom="1.3" '
        f'style="height:380px;width:100%"></stick-scene>'
        f'<figcaption>{escape(titles.get(i) or i)}</figcaption></figure>' for i in ids)
    dots = "".join(f'<span class="dot" title="{escape(titles.get(s) or s)}"></span>' for s in order)
    dlg = "\n".join(
        f'<p class="{"a" if x["who"] == "A" else "b"}" data-start="{x["start"]}">'
        f'<span>{x["who"]}</span>{escape(x["text"])}</p>' for x in timings)
    dur = timings[-1]["end"] if timings else 0
    n_words = sum(len(x["text"].split()) for x in timings)
    gk = gecko_b64(lesson)
    gecko_img = (f'<img class="gecko" alt="геккон курса" '
                 f'src="data:image/png;base64,{gk}">' if gk else "")
    sync_js = (SYNC_JS_TPL.replace("__CUES__", json.dumps(cues))
                          .replace("__ORDER__", json.dumps(order)))
    html = f"""<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<title>{escape(title)}</title>
<style>
 body{{font-family:'Segoe UI',system-ui,sans-serif;margin:0;background:#fafafa;color:#141414}}
 .wrap{{max-width:860px;margin:0 auto;padding:28px 20px 60px}}
 h1{{font-size:22px}} h2{{font-size:17px;margin-top:28px;border-bottom:1px solid #ededed;padding-bottom:6px}}
 audio{{width:100%;margin:10px 0 4px}}
 .meta{{color:#737373;font-size:13px}}
 .stage{{position:relative;height:420px;margin-top:10px;background:#fff;border:1px solid #ededed;border-radius:12px;overflow:hidden}}
 .stage canvas#bg-grid{{position:absolute;inset:0;width:100%;height:100%;opacity:.42;-webkit-mask-image:radial-gradient(ellipse 75% 85% at 50% 45%,#000 55%,transparent 100%);mask-image:radial-gradient(ellipse 75% 85% at 50% 45%,#000 55%,transparent 100%)}}
 .stage .sc{{position:absolute;inset:0}}
 .stage .gecko{{position:absolute;top:10px;right:12px;width:56px;height:56px;object-fit:contain;opacity:.88;pointer-events:none;z-index:6;filter:drop-shadow(0 1px 2px rgba(0,0,0,.12))}}
 figure{{position:absolute;inset:0;margin:0;opacity:0;pointer-events:none;transition:opacity .45s;display:flex;flex-direction:column;align-items:center;justify-content:center}}
 figure.current{{opacity:1;pointer-events:auto}}
 figcaption{{font-size:12px;color:#737373;max-width:460px;margin-top:2px}}
 .dots{{display:flex;gap:8px;justify-content:center;margin-top:8px}}
 .dot{{width:10px;height:10px;border-radius:50%;background:#e0e0e0;cursor:pointer;transition:background .3s}}
 .dot.on{{background:#d97757}}
 .tw{{overflow-x:auto;margin:10px 0}}
 .tw table{{border-collapse:collapse;width:100%;font-size:12.5px;margin:0}}
 th,td{{border:1px solid #e8e8e8;padding:7px 9px;text-align:left;vertical-align:top;line-height:1.35}}
 th{{background:#f7f2ef;font-weight:600;border-bottom:2px solid #e6d6cf;white-space:nowrap}}
 tbody tr:nth-child(even) td{{background:#fbfaf9}}
 td code{{white-space:normal;word-break:break-word}}
 code{{background:#f5f5f5;padding:1px 4px;border-radius:4px;font-size:12px}}
 details{{margin-top:18px}} summary{{cursor:pointer;color:#737373;font-size:13px}}
 .a span,.b span{{display:inline-block;width:18px;font-weight:700;color:#a3a3a3}}
 .a,.b{{margin:6px 0}} .b{{margin-left:18px;color:#404040}}
 .a.now,.b.now{{background:#fef3c7;border-radius:4px}}
 .hint{{font-size:12px;color:#a3a3a3}}
</style></head><body><div class="wrap">
<h1>{escape(title)}</h1>
<p class="meta">Курс «Табличный редактор текстом» · {escape(tts_line)} · {n_words} слов · {int(dur)//60}:{int(dur)%60:02d} · сцен: {len(order)}</p>
<h2>Озвучка</h2>
<audio id="vo" controls src="{mp3_name}"></audio>
<p class="hint">Нажмите Play — панель показывает только текущую сцену; сцены сменяются в те моменты, когда о них идёт речь. Точки под панелью: переход к нужной сцене кликом.</p>
<h2>Сцена урока</h2>
<div class="stage">
  <canvas id="bg-grid"></canvas>
  <div class="sc">{scenes_html}</div>
  {gecko_img}
</div>
<div class="dots">{dots}</div>
<h2>Карточка практики</h2>
{card}
<details><summary>Текст сценария (подсвечивается по ходу озвучки)</summary><div id="dlg">{dlg}</div></details>
</div>
<script>{stick_js}</script>
<script>{scenes_js}</script>
<script>{BG_JS}</script>
<script>{sync_js}</script>
</body></html>"""
    out = lesson / "preview.html"
    out.write_text(html, encoding="utf-8")
    print("готово:", out, f"({len(html)//1024} KB), сцен: {len(ids)}, порядок: {order}")


if __name__ == "__main__":
    main()
