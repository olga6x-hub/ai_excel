#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check_scene_bounds.py — статическая проверка координат в scenes.js (стик-сцены).

Панель сцены: мир по X от -164 до +164, по Y от 0 (земля) до -139 (верх).

ЗОНА ГЕККОНА. Оверлей задан в CSS как top:10px; right:12px; width/height:56px
при панели 705×422 px и canvas сцены 705×380 px. Пересчёт в мировые координаты:
  x = -164 + px_x * 328/705,   y = -139 + px_y * 139/380
  bbox геккона на canvas: px_x 637…693, px_y 20…132 → мир x +132…+158, y −135…−115.
Проверяем с запасом: x +130…+160, y −137…−113.

Скрипт парсит числовые литералы в вызовах рисующих хелперов и считает их габарит:
  rr(g, x, y, w, h, r)            — прямоугольник от (x,y), размер w×h
  signCard(g, cx, cy, w, h, s,..) — карточка ЦЕНТРИРОВАННАЯ по (cx,cy)
  fileCard(g, x, y, ...)          — карточка 64×50 от (x,y)
  numCard/numberCard(g, x, y, w, h, ...) — от (x,y), w×h
  text(g, 'строка', x, y, size)   — ширина ≈ len(str)*size*0.55, центрирование по x
  tickBadge(g, x, y, k, size)     — кружок радиусом size/2 (по умолчанию 9)
  circle(g, x, y, r)              — круг радиусом r
  bubble(g, x, y, 'строка', k)    — рисуется ВВЕРХ от y: y-size-12 .. y; ширина как у text

Координаты-выражения (переменные) пропускаются — их не вычислить статически.

Запуск:
  python tools/check_scene_bounds.py courses/ai-excel/lessons
  python tools/check_scene_bounds.py --gk 130 160 -137 -113 <путь>
Код возврата: 1, если есть находки.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Iterator, List, Optional, Tuple

# пределы панели
X_MIN, X_MAX = -164.0, 160.7  # правый предел ужесточён: канвас рисует содержимое
                              # со сдвигом +3,4 юнита вправо (замерено 2026-11-21),
                              # поэтому кодовый x +160 фактически у края 164,1
Y_TOP = -139.0
# зона геккона (с запасом)
GK = dict(x0=130.0, x1=160.0, y0=-137.0, y1=-113.0)

NUM = r"-?\d+(?:\.\d+)?"
STR = r"(?:'([^']*)'|\"([^\"]*)\")"

Box = Tuple[int, str, float, float, float, float]
Finding = Tuple[str, int, str, str, str]


def _nums(*vals: Optional[str]) -> Optional[List[float]]:
    """Строгая распаковка: None, если хотя бы одно значение не число."""
    out: List[float] = []
    for v in vals:
        if v is None:
            return None
        try:
            out.append(float(v))
        except ValueError:
            return None
    return out


def boxes(src: str) -> Iterator[Box]:
    """Генератор (номер_строки, вызов, x0, y0, x1, y1)."""
    for i, line in enumerate(src.splitlines(), 1):
        if line.strip().startswith("//"):
            continue

        # rr(g, x, y, w, h, r?)
        for m in re.finditer(rf"\brr\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})", line):
            v = _nums(*m.groups())
            if v:
                x, y, w, h = v
                yield i, "rr", x, y, x + w, y + h

        # signCard(g, cx, cy, w, h, ...) — центрированная
        for m in re.finditer(rf"\bsignCard\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})", line):
            v = _nums(*m.groups())
            if v:
                cx, cy, w, h = v
                yield i, "signCard", cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2

        # fileCard(g, x, y, ...) — 64×50
        for m in re.finditer(rf"\bfileCard\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})", line):
            v = _nums(*m.groups())
            if v:
                x, y = v
                yield i, "fileCard", x, y, x + 64, y + 50

        # pivotGrid(g, x, y, cw, ch, ncol, nrow, ...) — локальный хелпер сетки:
        # ширина = cw*ncol, высота = ch*(nrow+2) — шапка и строка итога
        for m in re.finditer(rf"\bpivotGrid\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})", line):
            v = _nums(*m.groups())
            if v:
                x, y, cw, ch, ncol, nrow = v
                yield i, "pivotGrid", x, y, x + cw * ncol, y + ch * (nrow + 2)

        # cubeGrid(g, x, y, ...) — куб-сводная 3×3 по 17 юнитов
        for m in re.finditer(rf"\bcubeGrid\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})", line):
            v = _nums(*m.groups())
            if v:
                x, y = v
                yield i, "cubeGrid", x, y, x + 51, y + 51

        # numCard / numberCard(g, x, y, w, h)
        for m in re.finditer(rf"\b(?:numCard|numberCard)\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})", line):
            v = _nums(*m.groups())
            if v:
                x, y, w, h = v
                yield i, "numCard", x, y, x + w, y + h

        # circle(g, x, y, r)
        for m in re.finditer(rf"\bcircle\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})", line):
            v = _nums(*m.groups())
            if v:
                x, y, r = v
                yield i, "circle", x - r, y - r, x + r, y + r

        # tickBadge(g, x, y, k, size=9)
        for m in re.finditer(rf"\btickBadge\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})(?:\s*,\s*[^,)]+\s*,\s*({NUM}))?", line):
            v = _nums(m.group(1), m.group(2))
            if v:
                x, y = v
                rs = _nums(m.group(3))
                rad = (rs[0] if rs else 9.0) / 2 + 1
                yield i, "tickBadge", x - rad, y - rad, x + rad, y + rad

        # text(g, 'строка', x, y, size)
        for m in re.finditer(rf"\btext\(\s*g\d?\s*,\s*{STR}\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})", line):
            label = m.group(1) or m.group(2) or ""
            v = _nums(m.group(3), m.group(4), m.group(5))
            if v and label:
                x, y, size = v
                half = len(label) * size * 0.55 / 2
                yield i, f"text «{label[:24]}»", x - half, y - size, x + half, y

        # bubble(g, x, y, 'строка', ...) — вверх от y
        for m in re.finditer(rf"\bbubble\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*{STR}", line):
            v = _nums(m.group(1), m.group(2))
            if v:
                x, y = v
                label = m.group(3) or m.group(4) or ""
                size = 8.0
                ms = re.search(r"size\s*:\s*(\d+(?:\.\d+)?)", line)
                if ms:
                    sv = _nums(ms.group(1))
                    size = sv[0] if sv else 8.0
                half = (len(label) * size * 0.55 + 18) / 2
                yield i, f"bubble «{label[:24]}»", x - half, y - size - 12, x + half, y

        # ln(g, x0, y0, x1, y1, ...) — отрезок: bbox по концам
        for m in re.finditer(rf"\bln\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})", line):
            v = _nums(*m.groups())
            if v:
                x0, y0, x1, y1 = v
                yield i, "ln", min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)

        # sparks(g, x, y, k, r, n) — вспышки радиусом r вокруг (x,y).
        # ВАЖНО: k обычно содержит запятые (seg(T, 3.4, 4.0)), поэтому r и n берём
        # как последние два числа перед закрывающей скобкой.
        for m in re.finditer(rf"\bsparks\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})\s*,.*?,\s*({NUM})\s*,\s*({NUM})\s*\)", line):
            v = _nums(m.group(1), m.group(2), m.group(3))
            if v:
                x, y, r = v
                yield i, "sparks", x - r, y - r, x + r, y + r

        # words(g, x, y, w, n) — n полосок псевдотекста высотой ~6 каждая
        for m in re.finditer(rf"\bwords\(\s*g\d?\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})", line):
            v = _nums(*m.groups())
            if v:
                x, y, w, n = v
                yield i, "words", x, y - 4, x + w, y + n * 6


def scene_of(src: str, pos_line: int):
    """Определяет id сцены по номеру строки."""
    marks = [(src[:m.start()].count("\n") + 1, m.group(1))
             for m in re.finditer(r"SC\['([a-z0-9\-]+)'\]", src)]
    cur = "?"
    for ln, sid in marks:
        if ln <= pos_line:
            cur = sid
        else:
            break
    return cur


def check_file(path: Path):
    src = path.read_text(encoding="utf-8")
    out = []
    for line, kind, x0, y0, x1, y1 in boxes(src):
        sid = scene_of(src, line)
        # 1) выход за пределы панели
        if x0 < X_MIN - 0.5 or x1 > X_MAX + 0.5:
            out.append((sid, line, kind, "ВЫХОД ЗА КРАЙ ПО X", f"x {x0:.0f}…{x1:.0f} (предел ±164)"))
        if y0 < Y_TOP - 0.5:
            out.append((sid, line, kind, "ВЫХОД ЗА ВЕРХ", f"y {y0:.0f} (предел −139)"))
        # 2) наезд на зону геккона
        if x1 > GK["x0"] and x0 < GK["x1"] and y0 < GK["y1"] and y1 > GK["y0"]:
            out.append((sid, line, kind, "НАЕЗД НА ГЕККОНА",
                        f"x {x0:.0f}…{x1:.0f}, y {y0:.0f}…{y1:.0f}"))
    return out


def main(argv: List[str]) -> int:
    args: List[str] = []
    i = 1
    while i < len(argv):
        if argv[i] == "--gk":
            v = _nums(*argv[i + 1:i + 5])
            if v:
                GK.update(x0=v[0], x1=v[1], y0=v[2], y1=v[3])
            i += 5
            continue
        args.append(argv[i])
        i += 1

    targets = args or ["courses/ai-excel/lessons"]
    files = []
    for t in targets:
        p = Path(t)
        if p.is_dir():
            files.extend(sorted(p.rglob("scenes.js")))
        elif p.exists():
            files.append(p)

    total = 0
    for f in files:
        res = check_file(f)
        if res:
            print(f"\n=== {f} — найдено {len(res)}")
            for sid, line, kind, what, det in res:
                print(f"  [{sid}] стр.{line} {kind}: {what} — {det}")
            total += len(res)
        else:
            print(f"=== {f}: чисто")
    print(f"\nИТОГО находок: {total} (файлов проверено {len(files)})")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
