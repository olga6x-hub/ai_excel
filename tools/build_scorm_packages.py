#!/usr/bin/env python3
"""Упаковка уроков курса «ai-excel» в SCORM 1.2 (по одному пакету на урок).

Что делает:
  1. Берёт готовые `lessons/<slug>/preview.html` (+ mp3 и любые локальные файлы, на которые
     страница ссылается) — то есть ровно то, что уже проверено в браузере.
  2. Кладёт в пакет `index.html` с внедрённым `scorm12.js`: поиск API LMS, LMSInitialize,
     статус `incomplete` на старте, `completed` когда озвучка прослушана на 95%/до конца,
     LMSCommit + LMSFinish на выгрузке. Без этого Moodle не увидит завершение урока.
  3. Пишет `imsmanifest.xml` (SCORM 1.2, один SCO на пакет).
  4. Собирает zip: `ai-excel-lesson-01.zip` … `ai-excel-lesson-09.zip`.

Квизы в SCORM НЕ уходят намеренно: в Moodle они импортируются как банк вопросов (Moodle XML)
и оцениваются нативно, с порогами и группами вариантов. Портфельные задания — элемент
«Задание» Moodle. Датасеты — файловый ресурс. SCORM здесь только для уроков-страниц.

Запуск из корня harness:
  python tools/build_scorm_packages.py                    # -> courses/ai-excel/dist/scorm/
  python tools/build_scorm_packages.py --no-zip
"""
import argparse
import html
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COURSE = ROOT / "courses" / "ai-excel"

SCORM_JS = r"""/* SCORM 1.2 для урока-страницы: поиск API, инициализация, завершение по прослушиванию. */
(function () {
  var api = null, initialized = false, finished = false, completed = false;

  function scan(win) {
    var depth = 0;
    while (win && depth < 10) {
      try { if (win.API) return win.API; } catch (e) { return null; }
      if (win.parent && win.parent !== win) { win = win.parent; depth += 1; }
      else break;
    }
    return null;
  }

  function findAPI() {
    var a = scan(window);
    if (!a && window.opener) a = scan(window.opener);
    return a;
  }

  function call(fn) {
    if (!api || typeof api[fn] !== 'function') return null;
    try { return api[fn].apply(api, Array.prototype.slice.call(arguments, 1)); }
    catch (e) { return null; }
  }

  function hhmmss(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    function p(x) { return (x < 10 ? '0' : '') + x; }
    return p(h) + ':' + p(m) + ':' + p(s);
  }

  function init() {
    api = findAPI();
    if (!api) return false;
    var ok = call('LMSInitialize', '');
    if (ok === 'true' || ok === true) {
      initialized = true;
      var st = call('LMSGetValue', 'cmi.core.lesson_status');
      if (!st || st === 'not attempted' || st === '') {
        call('LMSSetValue', 'cmi.core.lesson_status', 'incomplete');
      }
      call('LMSCommit', '');
      return true;
    }
    return false;
  }

  function complete() {
    if (!initialized || completed) return;
    completed = true;
    var a = document.getElementById('vo');
    if (a && a.currentTime) call('LMSSetValue', 'cmi.core.session_time', hhmmss(a.currentTime));
    call('LMSSetValue', 'cmi.core.lesson_status', 'completed');
    call('LMSCommit', '');
  }

  function finish() {
    if (!initialized || finished) return;
    finished = true;
    call('LMSCommit', '');
    call('LMSFinish', '');
  }

  function wire() {
    init();
    var a = document.getElementById('vo');
    if (a) {
      a.addEventListener('timeupdate', function () {
        if (a.duration && a.currentTime / a.duration >= 0.95) complete();
      });
      a.addEventListener('ended', complete);
    }
    window.addEventListener('beforeunload', finish);
    window.addEventListener('pagehide', finish);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else { wire(); }
})();
"""

MANIFEST = """<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="{mid}" version="1.2"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="AI-EXCEL-ORG">
    <organization identifier="AI-EXCEL-ORG">
      <title>{course_title}</title>
      <item identifier="ITEM-{slug_uc}" identifierref="RES-{slug_uc}" isvisible="true">
        <title>{title}</title>
        <adlcp:maxtimeallowed>01:00:00</adlcp:maxtimeallowed>
        <adlcp:timelimitaction>continue,no message</adlcp:timelimitaction>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-{slug_uc}" type="webcontent" adlcp:scormtype="sco" href="index.html">
{files}    </resource>
  </resources>
</manifest>
"""


def local_refs(html_path: Path):
    """Локальные относительные пути из src=/href= (как в build_excel_delivery.py)."""
    text = html_path.read_text(encoding="utf-8")
    refs = set()
    for m in re.finditer(r"\b(?:src|href)\s*=\s*[\"']([^\"']+)[\"']", text, re.IGNORECASE):
        u = m.group(1).strip()
        if (not u or u.startswith(("data:", "http://", "https://", "//", "#", "mailto:"))
                or u.startswith("{{")):
            continue
        u = u.split("#")[0].split("?")[0]
        if u:
            refs.add(u)
    return refs


def inject_scorm(html_text: str) -> str:
    tag = '<script src="scorm12.js"></script>\n</body>'
    idx = html_text.rfind("</body>")
    if idx == -1:
        return html_text + tag
    return html_text[:idx] + tag + html_text[idx + len("</body>"):]


def lesson_dirs(lessons_dir: Path):
    out = []
    for d in sorted(lessons_dir.iterdir()):
        if d.is_dir() and (d / "preview.html").exists():
            out.append((int(d.name.split("-")[0]), d))
    out.sort()
    return out


def build_one(num: int, d: Path, out_dir: Path, make_zip=True):
    slug = d.name
    meta = {}
    if (d / "meta.json").exists():
        meta = json.loads((d / "meta.json").read_text(encoding="utf-8"))
    title = meta.get("title") or slug

    pkg = out_dir / "_build" / slug
    if pkg.exists():
        shutil.rmtree(pkg)
    pkg.mkdir(parents=True)

    refs = sorted(local_refs(d / "preview.html"))
    files = ["index.html", "scorm12.js"]
    (pkg / "index.html").write_text(
        inject_scorm((d / "preview.html").read_text(encoding="utf-8")), encoding="utf-8")
    (pkg / "scorm12.js").write_text(SCORM_JS, encoding="utf-8")
    for ref in refs:
        src = d / ref
        if not src.exists():
            sys.exit(f"{slug}: битая ссылка {ref}")
        dst = pkg / ref
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        files.append(ref)

    (pkg / "imsmanifest.xml").write_text(MANIFEST.format(
        mid="AI-EXCEL-L%02d" % num,
        slug_uc="L%02d" % num,
        course_title=html.escape("Курс «Табличный редактор текстом»"),
        title=html.escape(title),
        files="".join('      <file href="%s"/>\n' % html.escape(f) for f in files),
    ), encoding="utf-8")

    zip_path = out_dir / ("ai-excel-lesson-%02d.zip" % num)
    if make_zip:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for p in sorted(pkg.rglob("*")):
                if p.is_file():
                    zf.write(p, p.relative_to(pkg).as_posix())
    return slug, title, zip_path, files


def main():
    ap = argparse.ArgumentParser(description="SCORM 1.2 пакеты уроков ai-excel")
    ap.add_argument("--course-root", default=str(COURSE))
    ap.add_argument("--out", default=None, help="папка вывода (по умолчанию <курс>/dist/scorm)")
    ap.add_argument("--no-zip", action="store_true")
    ap.add_argument("--keep-build", action="store_true",
                    help="оставить распакованные пакеты в _build/ (для проверки)")
    args = ap.parse_args()

    course = Path(args.course_root).resolve()
    out_dir = Path(args.out) if args.out else course / "dist" / "scorm"
    out_dir.mkdir(parents=True, exist_ok=True)

    lessons = lesson_dirs(course / "lessons")
    if len(lessons) != 9:
        sys.exit("ожидалось 9 уроков, найдено %d" % len(lessons))
    total = 0
    for num, d in lessons:
        slug, title, zip_path, files = build_one(num, d, out_dir, not args.no_zip)
        size = zip_path.stat().st_size / 1e6 if zip_path.exists() else 0
        total += size
        print("  L%02d %s: %d файлов%s" % (num, slug, len(files),
                                          ", %.1f МБ" % size if size else ""))
    if not args.keep_build:
        shutil.rmtree(out_dir / "_build", ignore_errors=True)
    print("SCORM: 9 пакетов в %s (итого %.1f МБ)" % (out_dir, total))


if __name__ == "__main__":
    main()
