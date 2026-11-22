"""Проверка текстов уроков на нечитаемые символы перед озвучкой.

Что ищем:
  - иероглифы и экзотические письменности (CJK, кана, хангыль, арабский, иврит);
  - replacement-символы (U+FFFD) и управляющие символы;
  - невидимые/zero-width символы (U+200B..U+200F, U+FEFF);
  - латиницу: в режиме strict (озвучка) — любую, в soft — кроме технических токенов.

Режимы:
  strict — для script.txt (то, что уходит в озвучку): латиница нежелательна совсем.
  soft   — для card.md / outline.md / scenes.js: латиница в именах файлов и формулах допустима.

Запуск из harness:
  python tools/check_lesson_text.py courses/ai-excel                 # отчёт по всем файлам
  python tools/check_lesson_text.py <файл> --mode strict
  python tools/check_lesson_text.py courses/ai-excel --fix           # вычистить мусор (CJK/невидимые)
"""
import argparse
import re
import sys
import unicodedata
from pathlib import Path

CJK = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]")
EXOTIC = re.compile(r"[\u0600-\u06ff\u0590-\u05ff\u0e00-\u0e7f\u0900-\u097f]")
REPLACEMENT = re.compile(r"[\ufffd\ufffe\uffff]")
INVISIBLE = re.compile(r"[\u200b-\u200f\u2028\u2029\u202a-\u202e\ufeff\u00ad]")
CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
LATIN_WORD = re.compile(r"[A-Za-z][A-Za-z0-9_.'\-]*")

# технические токены, допустимые в soft-режиме (имена файлов, формулы, единицы)
TECH_OK = re.compile(
    r"(?i)^("
    r"[a-z0-9_\-]+\.(xlsx|xls|csv|md|txt|html|json|mp3|mp4|png|pdf|zip|js|py|xml|ya?ml)"
    r"|xlsx|csv|md|txt|html|json|mp3|mp4|png|pdf|zip|xml|api|ai|it|ok|id|url"
    r"|[A-Z]{1,6}[0-9]*"                      # аббревиатуры: SKU, XML, КЗФП-латиница
    r"|=?[A-Z]{1,3}[0-9]{1,4}(\:[A-Z]{1,3}[0-9]{1,4})?"   # ссылки на ячейки B2, B2:C9
    r"|[A-Za-z0-9_]{2,}"                      # идентификаторы файлов/переменных
    r")$"
)

TEXT_EXT = {".md", ".txt", ".js", ".html", ".json"}


def scan_line(line: str, mode: str):
    """Возвращает список (тип, найденное) для одной строки."""
    found = []
    for rx, kind in [(CJK, "иероглиф"), (EXOTIC, "экзотическая письменность"),
                     (REPLACEMENT, "replacement"), (INVISIBLE, "невидимый"),
                     (CONTROL, "управляющий")]:
        for m in rx.finditer(line):
            s = m.group(0)
            name = unicodedata.name(s, f"U+{ord(s):04X}")
            found.append((kind, f"{s!r} ({name})"))
    if mode == "trash":
        return found                      # код/вёрстка: латиница легальна, ищем только мусор
    for m in LATIN_WORD.finditer(line):
        w = m.group(0).rstrip(".,;:!?)»\"'")   # отрезаем прилипшую пунктуацию
        if mode == "strict":
            found.append(("латиница", m.group(0)))
        elif not TECH_OK.match(w):
            found.append(("латиница", m.group(0)))
    return found


def clean_line(line: str) -> str:
    """Удаляет однозначный мусор: CJK, экзотику, replacement, невидимые, управляющие."""
    for rx in (CJK, EXOTIC, REPLACEMENT, INVISIBLE, CONTROL):
        line = rx.sub("", line)
    return line


def strip_markup(line: str) -> str:
    """Для script.txt: проверяем только произносимый текст, без префиксов ролей и маркеров сцен."""
    s = line.strip()
    if s.startswith("@scene"):
        return ""
    m = re.match(r"^([AB]):\s*(.*)$", s)
    return m.group(2) if m else line


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--mode", choices=["strict", "soft", "trash", "auto"], default="auto",
                    help="auto: script.txt -> strict, .md -> soft, код -> trash")
    ap.add_argument("--fix", action="store_true",
                    help="удалить однозначный мусор (иероглифы/невидимые/управляющие)")
    args = ap.parse_args()

    files = []
    for p in args.paths:
        path = Path(p)
        if path.is_file():
            files.append(path)
        else:
            files += sorted(f for f in path.rglob("*")
                            if f.suffix.lower() in TEXT_EXT and "_tts_parts" not in str(f))
    total = 0
    fixed = []
    for f in files:
        try:
            text = f.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError) as e:
            print(f"{f}: НЕ ПРОЧИТАЛСЯ ({e})")
            total += 1
            continue
        mode = args.mode
        if mode == "auto":
            if f.name == "script.txt":
                mode = "strict"          # уходит в озвучку — латиницы быть не должно
            elif f.suffix.lower() == ".md":
                mode = "soft"            # текст на экране: имена файлов допустимы
            else:
                mode = "trash"           # код/вёрстка: только иероглифы и мусор
        hits = []
        for ln, line in enumerate(text.splitlines(), 1):
            probe = strip_markup(line) if mode == "strict" else line
            for kind, what in scan_line(probe, mode):
                hits.append((ln, kind, what, line.strip()[:90]))
        if hits:
            print(f"\n=== {f}  [{mode}] — найдено {len(hits)}")
            for ln, kind, what, ctx in hits[:40]:
                print(f"  строка {ln}: {kind}: {what}\n      {ctx}")
            if len(hits) > 40:
                print(f"  ... и ещё {len(hits) - 40}")
            total += len(hits)
        if args.fix:
            cleaned = "\n".join(clean_line(x) for x in text.splitlines())
            if text.endswith("\n"):
                cleaned += "\n"
            if cleaned != text:
                f.write_text(cleaned, encoding="utf-8")
                fixed.append(f)
    print(f"\nИТОГО: файлов проверено {len(files)}, находок {total}")
    if args.fix:
        print("очищены:", [str(x) for x in fixed] or "ничего (мусора не было)")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
