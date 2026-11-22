#!/usr/bin/env python3
"""Вставляет строку «Время» с честными таймингами в карточки уроков (4а).

Строка ставится сразу после H1, если её ещё нет. Окончания строк сохраняются как были
(читаем и пишем байтами), чтобы не ломать .gitattributes.

Запуск из корня harness: python tools/add_card_timings.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LESSONS = ROOT / "courses" / "ai-excel" / "lessons"

# практика ≈ мин, квиз мин — по карточкам и блупринту
TIMING = {
    1: (20, 9),
    2: (30, 14),
    3: (30, 16),
    4: (30, 16),
    5: (30, 15),
    6: (30, 15),
    7: (35, 17),
    8: (35, 17),
    9: (40, 21),
}


def main():
    for d in sorted(p for p in LESSONS.iterdir() if (p / "card.md").exists()):
        num = int(d.name.split("-")[0])
        practice, quiz = TIMING[num]
        total = 3 + practice + quiz
        card = d / "card.md"
        data = card.read_bytes()
        nl = b"\r\n" if b"\r\n" in data[:200] else b"\n"
        text = data.decode("utf-8")
        if "**Время:**" in text:
            print("  %-32s уже есть" % d.name)
            continue
        lines = text.split("\n")
        # найти H1 и вставить после пустой строки за ним
        idx = next(i for i, l in enumerate(lines) if l.startswith("# "))
        ins = idx + 1
        while ins < len(lines) and lines[ins].strip() == "":
            ins += 1
        line = (f"**Время:** озвучка ~3 мин · практика ≈ {practice} мин · квиз {quiz} мин — "
                f"итого ≈ {total} мин.")
        lines.insert(ins, "")
        lines.insert(ins + 1, line)
        out = "\n".join(lines).encode("utf-8")
        if nl == b"\r\n":
            out = out.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")
        card.write_bytes(out)
        print("  %-32s + практика {practice} / квиз {quiz} -> ≈{total} мин".format(
            practice=practice, quiz=quiz, total=total) .replace("%-32s", d.name))


if __name__ == "__main__":
    main()
