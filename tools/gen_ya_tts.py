"""Озвучка уроков курса через Yandex SpeechKit (IAM + v1 REST).

Голоса (утверждены Ольгой, амплуа «дружелюбный»):
  A = jane    (Аня, ведущая)
  B = filipp  (собеседник)

Бэкенд: C:/Users/Olga/hermes-tools/yandex_tts.py (IAM-токен через yc, кэш 11 ч).
Каждая реплика -> отдельный mp3 в _tts_parts/ (кэш: перезапуск догоняет, не начинает заново),
затем склейка ffmpeg в <имя урока>.mp3 и запись timings.json (границы реплик) —
тайминги нужны для синхронизации стик-сцен.

Запуск из harness:
  python tools/gen_ya_tts.py courses/ai-excel/lessons/01-srochnyj-otchet
  python tools/gen_ya_tts.py courses/ai-excel            # все уроки
  python tools/gen_ya_tts.py --voices jane filipp <папка>   # другие голоса
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

YA_TTS = Path(r"C:/Users/Olga/hermes-tools/yandex_tts.py")
YA_PY = Path(r"C:/Users/Olga/AppData/Local/Programs/Python/Python314/python.exe")
FFMPEG = Path(r"C:/Users/Olga/AppData/Local/hermes/tools/ffmpeg-9.0.1-win32-x64/bin/ffmpeg.exe")
FFPROBE = FFMPEG.parent / "ffprobe.exe"
VOICES = {"A": "jane", "B": "filipp"}
PAUSE = 0.4


def parse_script(path: Path):
    lines = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^([AB]):\s*(.+)$", raw.strip())
        if m:
            lines.append((m.group(1), m.group(2).strip()))
    if not lines:
        sys.exit(f"нет реплик A:/B: в {path}")
    return lines


def spoken(text: str) -> str:
    """Текст без разметки: знак "+" перед ударной гласной (разметка SpeechKit) в вывод не идёт."""
    return text.replace("+", "")


def invalidate_changed(tmp: Path, lines) -> int:
    """Кэш частей: удаляет mp3 тех реплик, чей текст разошёлся с script.txt (правки ударений
    и формулировок), чтобы переозвучились только изменённые строки."""
    tl = tmp.parent / "timings.json"
    if not tl.exists():
        return 0
    try:
        # src — исходная строка с разметкой ("+"); у старых timings её нет, берём чистый текст
        old = {e.get("i"): e.get("src", e.get("text", ""))
               for e in json.loads(tl.read_text(encoding="utf-8"))}
    except ValueError:
        return 0
    removed = 0
    for i, (who, text) in enumerate(lines):
        part = tmp / f"{i:03d}_{who}.mp3"
        if part.exists() and old.get(i) != text:
            part.unlink()
            removed += 1
    return removed


def synth_one(text: str, voice: str, out: Path):
    """Одна реплика через yandex_tts.py. Возвращает True при успехе."""
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(text)
        tmp = Path(f.name)
    try:
        for attempt in range(3):
            r = subprocess.run([str(YA_PY), "-X", "utf8", str(YA_TTS),
                                "--text-file", str(tmp), "--output", str(out),
                                "--voice", voice, "--format", "mp3"],
                               capture_output=True, text=True)
            if r.returncode == 0 and out.exists() and out.stat().st_size > 500:
                return True
            out.unlink(missing_ok=True)
            err = (r.stderr or r.stdout).strip()[:200]
            print(f"    попытка {attempt + 1} не удалась: {err}")
        return False
    finally:
        tmp.unlink(missing_ok=True)


def concat(parts, out_mp3):
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        for p in parts:
            f.write(f"file '{Path(p).resolve().as_posix()}'\n")
        lst = Path(f.name)
    subprocess.run([str(FFMPEG), "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                    "-i", str(lst), "-c:a", "libmp3lame", "-q:a", "4",
                    str(Path(out_mp3).resolve())], check=True)
    lst.unlink()


def make_silence(path: Path, sec: float):
    subprocess.run([str(FFMPEG), "-y", "-loglevel", "error", "-f", "lavfi",
                    "-i", "anullsrc=r=24000:cl=mono", "-t", str(sec),
                    "-c:a", "libmp3lame", "-q:a", "4", str(path)], check=True)


def duration(path: Path) -> float:
    r = subprocess.run([str(FFPROBE), "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True)
    return float(r.stdout.strip())


def voice_lesson(lesson_dir: Path):
    script = lesson_dir / "script.txt"
    if not script.exists():
        print(f"пропуск {lesson_dir.name}: нет script.txt")
        return
    lines = parse_script(script)
    tmp = lesson_dir / "_tts_parts"
    tmp.mkdir(exist_ok=True)
    changed = invalidate_changed(tmp, lines)
    if changed:
        print(f"  обновлён текст {changed} реплик — они будут переозвучены")
    silence = tmp / "silence.mp3"
    make_silence(silence, PAUSE)
    parts = []
    for i, (who, text) in enumerate(lines):
        part = tmp / f"{i:03d}_{who}.mp3"
        if part.exists() and part.stat().st_size > 500:
            parts += [part, silence]
            continue
        if not synth_one(text, VOICES[who], part):
            raise RuntimeError(f"не озвучивается {i:03d} ({who}): {text[:60]}")
        print(f"  {i:03d} {who} ({VOICES[who]}) ok")
        parts += [part, silence]
    out = lesson_dir / f"{lesson_dir.name}.mp3"
    concat(parts, out)
    timings, t = [], 0.0
    for i, (who, text) in enumerate(lines):
        d = duration(tmp / f"{i:03d}_{who}.mp3")
        timings.append({"i": i, "who": who, "src": text, "text": spoken(text),
                        "start": round(t, 3), "end": round(t + d, 3)})
        t += d + PAUSE
    (lesson_dir / "timings.json").write_text(
        json.dumps(timings, ensure_ascii=False, indent=1), encoding="utf-8")
    words = sum(len(x["text"].split()) for x in timings)
    print(f"{lesson_dir.name}: {len(lines)} реплик, {words} слов -> {out.name}, "
          f"{int(t) // 60}:{int(t) % 60:02d}, timings.json")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("targets", nargs="+")
    ap.add_argument("--voices", nargs=2, metavar=("A", "B"), default=None,
                    help="голоса Яндекса для A и B (по умолчанию jane filipp)")
    args = ap.parse_args()
    if args.voices:
        VOICES["A"], VOICES["B"] = args.voices
    if not YA_TTS.exists():
        sys.exit(f"нет бэкенда озвучки: {YA_TTS}")
    targets = []
    for a in args.targets:
        p = Path(a)
        if (p / "script.txt").exists():
            targets.append(p)
        else:
            targets += sorted(d for d in p.glob("*/") if (d / "script.txt").exists())
    if not targets:
        sys.exit("укажите папку урока или папку курса")
    print(f"голоса: A={VOICES['A']} B={VOICES['B']}")
    for lesson in targets:
        voice_lesson(lesson)


if __name__ == "__main__":
    main()
