#!/usr/bin/env python3
"""Проверка, что озвучка курса соответствует текущим script.txt.

SpeechKit отдаёт побайтово РАЗНЫЙ mp3 на один и тот же текст (недетерминированный энкодер),
поэтому сравниваем не md5, а ДЛИТЕЛЬНОСТЬ: часть кэша `_tts_parts` против свежего синтеза
текущей строки. Для реплик с разметкой ударения ("+") печатается ещё дельта со «спокойным»
вариантом без плюса — она показывает, что разметка действительно изменила речь.

Запуск: python tools/verify_tts_parts.py courses/ai-excel/lessons
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

YA_TTS = Path(r"C:/Users/Olga/hermes-tools/yandex_tts.py")
YA_PY = Path(r"C:/Users/Olga/AppData/Local/Programs/Python/Python314/python.exe")
FFPROBE = Path(r"C:/Users/Olga/AppData/Local/hermes/tools/ffmpeg-9.0.1-win32-x64/bin/ffprobe.exe")
VOICES = {"A": "jane", "B": "filipp"}
TOL = 0.15  # секунды: SpeechKit даёт разные по длине дубли одного текста (±0,03 с),
#            плюс изредка другой «дубль» озвучки — берём запас


def dur(path: Path) -> float:
    r = subprocess.run([str(FFPROBE), "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True)
    return float(r.stdout.strip())


def synth(text: str, voice: str) -> Path:
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(text)
        tmp = Path(f.name)
    out = tmp.with_suffix(".mp3")
    r = subprocess.run([str(YA_PY), "-X", "utf8", str(YA_TTS), "--text-file", str(tmp),
                        "--output", str(out), "--voice", voice, "--format", "mp3"],
                       capture_output=True, text=True)
    tmp.unlink(missing_ok=True)
    if r.returncode != 0 or not out.exists():
        raise RuntimeError(f"синтез не удался: {(r.stderr or r.stdout).strip()[:150]}")
    return out


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "courses/ai-excel/lessons")
    lessons = [root] if (root / "script.txt").exists() else sorted(
        d for d in root.iterdir() if (d / "script.txt").exists())
    bad = 0
    for lesson in lessons:
        lines = []
        for raw in (lesson / "script.txt").read_text(encoding="utf-8").splitlines():
            m = re.match(r"^([AB]):\s*(.+)$", raw.strip())
            if m:
                lines.append((m.group(1), m.group(2).strip()))
        marked = [(i, w, t) for i, (w, t) in enumerate(lines) if "+" in t]
        if not marked:
            continue
        print(f"{lesson.name}: реплик с ударением {len(marked)}")
        for i, who, text in marked:
            part = lesson / "_tts_parts" / f"{i:03d}_{who}.mp3"
            if not part.exists():
                print(f"  {i:03d} {who}: НЕТ файла кэша")
                bad += 1
                continue
            fresh = synth(text, VOICES[who])
            plain = synth(text.replace("+", ""), VOICES[who])
            d, d_fresh, d_plain = dur(part), dur(fresh), dur(plain)
            ok = abs(d - d_fresh) <= TOL
            print(f"  {i:03d} {who}: {'OK' if ok else 'РАСХОЖДЕНИЕ'}  кэш {d:.3f} / свежий "
                  f"{d_fresh:.3f} с; без ударения {d_plain:.3f} с "
                  f"(дельта {d_fresh - d_plain:+.3f})  …{text[-45:]}")
            bad += 0 if ok else 1
            fresh.unlink(missing_ok=True)
            plain.unlink(missing_ok=True)
    print("итог:", "кэш озвучки соответствует script.txt" if not bad else f"проблем {bad}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
