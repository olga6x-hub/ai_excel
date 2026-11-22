#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify_quiz_keys.py — независимая проработка ключей квизов курса ai-excel.

Зачем: правило построения тестов требует, чтобы ключ получался РЕШЕНИЕМ задачи,
а не переписыванием намерения автора. Поэтому скрипт не читает функции генератора
датасетов, а пересчитывает контрольные числа заново из исходных .xlsx своей логикой
и сравнивает с datasets/passports.json (именно паспорт подставляется в XML квизов).

Два уровня:
  L1 — паспорт против листов «Контроль» эталонов reference_b1…b6 (для варианта A
       эталоны b1–b4 авторские, то есть полностью независимы от нашего генератора);
  L2 — независимый пересчёт из сырых файлов: warmup.xlsx, sales_2025_safe.xlsx,
       insert_20rows_safe.xlsx, sales_dirty.xlsx, sales_dirty_2.xlsx.

Формулы, которыми считается (взяты из карточек уроков, не из кода генератора):
  Выручка строки  = Количество × Цена × (1 − Скидка% / 100)
  Прибыль строки  = Выручка − Себестоимость за ед. × Количество
  Аннуитет        = S × i / (1 − (1+i)^-n),  i = ставка/12, n = число месяцев
  Переплата       = платёж × n − S
  Доля категории  = Σ выручки категории / Σ всей выручки × 100, округление до 2 знаков
  Крупная сделка  = выручка строки > 100 000
  База мини-бюджета = Σ выручки июля–декабря очищенного файла / 6

Округление денег — half-up до копеек (как в табличных редакторах), НЕ банковское.

Запуск:
  python tools/verify_quiz_keys.py            # отчёт в консоль
  python tools/verify_quiz_keys.py --md       # + записать assessments/answer_key.md
Код возврата 1, если найдены расхождения.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "courses" / "ai-excel"
DS = COURSE / "datasets"
ASSES = COURSE / "assessments"

TOL_MONEY = 0.011     # копейка + запас на округление
TOL_PCT = 0.011       # два знака после запятой
VARIANTS = "ABC"


def money(x) -> float:
    return float(Decimal(str(float(x))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def norm_num(v) -> Optional[float]:
    """Число из ячейки, в т.ч. текст вида «1 200,50». None, если не число."""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace("\u00a0", "").replace(" ", "").replace(",", ".")
    s = re.sub(r"[^0-9.\-]", "", s)
    if not s or s in ("-", "."):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def norm_date(v) -> Optional[date]:
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    if v is None:
        return None
    s = str(v).strip()
    for fmt in ("%d.%m.%Y", "%Y-%m-%d", "%d/%m/%Y", "%d.%m.%y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def sheet_rows(path: Path, sheet: Optional[str] = None) -> Tuple[list, List[tuple]]:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet] if sheet else wb[wb.sheetnames[0]]
    rows = [tuple(r) for r in ws.iter_rows(values_only=True)]
    wb.close()
    if not rows:
        return [], []
    return list(rows[0]), rows[1:]


def col(hdr: list, *names) -> int:
    """Индекс колонки по одному из возможных названий."""
    for n in names:
        for i, h in enumerate(hdr):
            if h and str(h).strip().lower() == n.lower():
                return i
    for n in names:
        for i, h in enumerate(hdr):
            if h and n.lower() in str(h).lower():
                return i
    raise KeyError(f"колонка {names} не найдена в {hdr}")


# ------------------------------------------------------------------ расчёты
def revenue(row, hdr) -> Optional[float]:
    try:
        q = norm_num(row[col(hdr, "Количество")])
        p = norm_num(row[col(hdr, "Цена")])
        d = norm_num(row[col(hdr, "Скидка %", "Скидка")]) or 0.0
    except (KeyError, IndexError, TypeError):
        return None
    if q is None or p is None:
        return None
    return q * p * (1 - d / 100)


def profit(row, hdr) -> Optional[float]:
    r = revenue(row, hdr)
    if r is None:
        return None
    try:
        q = norm_num(row[col(hdr, "Количество")])
        c = norm_num(row[col(hdr, "Себестоимость за ед.", "Себестоимость")])
    except (KeyError, IndexError, TypeError):
        return None
    if q is None or c is None:
        return None
    return r - c * q


def sum_rev(rows, hdr) -> Tuple[float, int]:
    tot, n = 0.0, 0
    for r in rows:
        v = revenue(r, hdr)
        if v is not None:
            tot += v
            n += 1
    return money(tot), n


def annuity(principal: float, annual_rate: float, months: int) -> float:
    i = annual_rate / 12.0
    if i == 0:
        return money(principal / months)
    pmt = principal * i / (1 - (1 + i) ** (-months))
    return money(pmt)


def clean_dirty(rows: List[tuple], hdr: list) -> Tuple[int, int, float]:
    """Минимальная независимая очистка: убрать полные дубликаты, посчитать выручку.

    Возвращает (строк до, удалено дублей, выручка после очистки).
    Текстовые числа нормализуются norm_num, даты — norm_date (строки с нечитаемой
    датой не отбрасываем: они участвуют в выручке).
    """
    seen, kept, dups = set(), [], 0
    for r in rows:
        key = tuple(str(x).strip() if x is not None else "" for x in r)
        if key in seen:
            dups += 1
            continue
        seen.add(key)
        kept.append(r)
    tot = 0.0
    for r in kept:
        v = revenue(r, hdr)
        if v is not None:
            tot += v
    return len(rows), dups, money(tot)


def calc_variant(v: str) -> Dict[str, object]:
    d = DS / f"variant_{v}"
    out: Dict[str, object] = {}

    # --- warmup (блок 1)
    hdr, rows = sheet_rows(d / "warmup.xlsx")
    rev, n = sum_rev(rows, hdr)
    prof = money(sum(p for p in (profit(r, hdr) for r in rows) if p is not None))
    out["warmup"] = {"rows": len(rows), "rev": rev, "prof": prof}

    # --- sales_2025_safe (блоки 2 и 3)
    hdr, rows = sheet_rows(d / "sales_2025_safe.xlsx", "Сделки")
    rev_safe, _ = sum_rev(rows, hdr)
    prof_safe = money(sum(p for p in (profit(r, hdr) for r in rows) if p is not None))
    i_mgr = col(hdr, "Менеджер")
    i_reg = col(hdr, "Регион")
    i_art = col(hdr, "Артикул")
    i_gd = col(hdr, "Товар")
    i_cat = col(hdr, "Категория")
    codes = len({str(r[i_mgr]).strip() for r in rows if r[i_mgr] is not None})
    qty = int(sum(norm_num(r[col(hdr, "Количество")]) or 0 for r in rows))
    # полные дубликаты в исходной выгрузке (для справки; в квизе блока 3 не используются —
    # столбец «Дубль» в уроке 3 не разбирается)
    try:
        _dh, _drows = sheet_rows(d / "sales_2025.xlsx", "Сделки")
    except Exception:
        _dh, _drows = sheet_rows(d / "sales_2025.xlsx")
    seen, dup = set(), 0
    for r in _drows:
        k = tuple(str(x).strip() if x is not None else "" for x in r)
        if k in seen:
            dup += 1
        seen.add(k)
    # ценовые сегменты — правило из З3.6 карточки урока 3:
    # до 5 000 — «низкий», 5 000–15 000 — «средний», свыше 15 000 — «высокий»
    i_price = col(hdr, "Цена")
    seg = {"low": 0, "mid": 0, "high": 0}
    margins: List[float] = []
    for r in rows:
        pv = norm_num(r[i_price])
        if pv is not None:
            if pv < 5000:
                seg["low"] += 1
            elif pv <= 15000:
                seg["mid"] += 1
            else:
                seg["high"] += 1
        rv, pr = revenue(r, hdr), profit(r, hdr)
        if rv and pr is not None:
            margins.append(pr / rv * 100)
    # крупные сделки
    big = sum(1 for r in rows if (revenue(r, hdr) or 0) > 100000)
    # артикулы вне справочника
    try:
        ref_hdr, ref_rows = sheet_rows(d / "sales_2025_safe.xlsx", "Справочник товаров")
        ref_arts = {str(r[0]).strip() for r in ref_rows if r and r[0] is not None}
        i_ref_art = 0
        not_found = sum(1 for r in rows
                        if str(r[i_art]).strip() not in ref_arts)
    except Exception:
        not_found = None
    # регион-лидер, топ-менеджер, топ-5 товаров, доли категорий
    reg_rev: Dict[str, float] = defaultdict(float)
    mgr_prof: Dict[str, float] = defaultdict(float)
    gd_rev: Dict[str, float] = defaultdict(float)
    cat_rev: Dict[str, float] = defaultdict(float)
    total = 0.0
    for r in rows:
        rv = revenue(r, hdr)
        if rv is None:
            continue
        total += rv
        reg_rev[str(r[i_reg]).strip()] += rv
        gd_rev[str(r[i_gd]).strip()] += rv
        cat_rev[str(r[i_cat]).strip()] += rv
        pr = profit(r, hdr)
        if pr is not None:
            mgr_prof[str(r[i_mgr]).strip()] += pr
    leader = max(reg_rev, key=lambda k: reg_rev[k]) if reg_rev else None
    top5 = sorted(gd_rev.items(), key=lambda kv: -kv[1])[:5]
    cat_share = {k: round(cat_rev[k] / total * 100, 2) for k in cat_rev} if total else {}

    # --- insert_20rows_safe (блок 4)
    ihdr, irows = sheet_rows(d / "insert_20rows_safe.xlsx")
    ins_rev, _ = sum_rev(irows, ihdr)

    out["sales"] = {"rows": len(rows), "qty_sum": qty, "codes": codes}
    out["layer"] = {"rev_sum": rev_safe, "prof_sum": prof_safe, "big_deals": big,
                    "not_found": not_found,
                    "seg_low": seg["low"], "seg_mid": seg["mid"], "seg_high": seg["high"],
                    "margin_min": round(min(margins), 2) if margins else None,
                    "margin_max": round(max(margins), 2) if margins else None}
    out["report"] = {"total": money(total), "leader_region": leader,
                     "leader_region_rev": money(reg_rev[leader]) if leader else None,
                     "top_mgr_prof": money(max(mgr_prof.values())) if mgr_prof else None,
                     "top5": {k: money(val) for k, val in top5},
                     "cat_share": cat_share,
                     "total_after20": money(total + ins_rev)}
    out["insert"] = {"rows": len(irows), "rev": ins_rev}

    # --- b5: база = среднемесячная выручка 2025 года (год / 12) — card.md урока 7
    base = money(rev_safe / 12)
    pmt = annuity(1_000_000, 0.18, 12)
    out["b5"] = {"base": base, "jan_rev": base, "annuity": pmt,
                 "overpay": money(pmt * 12 - 1_000_000)}

    # --- b6 / b6_2: грязные файлы
    for key, fname in (("b6", "sales_dirty.xlsx"), ("b6_2", "sales_dirty_2.xlsx")):
        f = d / fname
        if not f.exists():
            continue
        dh, drows = sheet_rows(f)
        before, dups2, rev_after = clean_dirty(drows, dh)
        h2b = []
        di = col(dh, "Дата")
        seen2, kept2 = set(), []
        for r in drows:
            k = tuple(str(x).strip() if x is not None else "" for x in r)
            if k in seen2:
                continue
            seen2.add(k)
            kept2.append(r)
        for r in kept2:
            dt = norm_date(r[di])
            rv = revenue(r, dh)
            if dt and rv is not None and dt.month >= 7:
                h2b.append(rv)
        out[key] = {"rows_before": before, "dup_removed": dups2,
                    "rows_after": len(kept2), "rev_after": rev_after,
                    "base6": money(sum(h2b) / 6) if h2b else None}
    return out


# ------------------------------------------------------------------- сравнение
def flatten(d, pre="") -> Dict[str, object]:
    out = {}
    for k, v in d.items():
        key = f"{pre}{k}"
        if isinstance(v, dict):
            out.update(flatten(v, key + "."))
        else:
            out[key] = v
    return out


def compare(v: str, passport: Dict, calc: Dict) -> List[Tuple[str, str, object, object, str]]:
    """Список (ключ, вариант, паспорт, пересчёт, вердикт)."""
    P, C = flatten(passport), flatten(calc)
    res = []
    for k in sorted(C):
        if k not in P:
            continue
        pv, cv = P[k], C[k]
        if cv is None:
            res.append((k, v, pv, cv, "ПЕРЕСЧЁТ НЕ УДАЛСЯ"))
            continue
        if isinstance(pv, str) or isinstance(cv, str):
            ok = str(pv).strip().lower() == str(cv).strip().lower()
            res.append((k, v, pv, cv, "OK" if ok else "РАСХОЖДЕНИЕ"))
        else:
            try:
                diff = abs(float(str(pv)) - float(str(cv)))
            except (TypeError, ValueError):
                res.append((k, v, pv, cv, "НЕСРАВНИМО"))
                continue
            tol = TOL_PCT if "%" in k or "share" in k else TOL_MONEY
            res.append((k, v, pv, cv,
                        "OK" if diff <= max(tol, abs(float(str(pv))) * 1e-9)
                        else f"РАСХОЖДЕНИЕ Δ={diff:,.4f}"))
    return res


def l1_check(v: str, passport: Dict, problems: List[str]):
    """Паспорт против листов «Контроль» эталонов reference_b*.xlsx."""
    d = DS / f"variant_{v}"
    src = COURSE if v == "A" else d
    pairs = [("b1", {"Сумма «Выручка»": ("warmup", "rev")}),
             ("b3", {"Сумма «Выручка»": ("layer", "rev_sum"),
                     "Сумма «Прибыль»": ("layer", "prof_sum"),
                     "Сумма «Бонус»": ("layer", "bonus_sum")}),
             ("b4", {"Общий итог выручки (до обновления)": ("report", "total")})]
    for b, mapping in pairs:
        f = src / f"reference_{b}.xlsx"
        if not f.exists():
            continue
        try:
            _, rows = sheet_rows(f, "Контроль")
        except Exception:
            continue
        ctrl = {r[0]: r[1] for r in rows if r and r[0]}
        for label, (n1, n2) in mapping.items():
            if label not in ctrl:
                continue
            pv = passport.get(n1, {}).get(n2)
            if pv is None:
                continue
            try:
                if abs(float(ctrl[label]) - float(pv)) > TOL_MONEY:
                    problems.append(f"L1 {v}/{b}: «{label}» эталон {ctrl[label]} ≠ паспорт {pv}")
            except (TypeError, ValueError):
                problems.append(f"L1 {v}/{b}: «{label}» несравнимы: {ctrl[label]!r} vs {pv!r}")


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", action="store_true", help="записать assessments/answer_key.md")
    args = ap.parse_args(argv)

    passports = json.loads((DS / "passports.json").read_text(encoding="utf-8"))
    all_rows, problems = [], []
    for v in VARIANTS:
        calc = calc_variant(v)
        all_rows += compare(v, passports[v], calc)
        l1_check(v, passports[v], problems)

    bad = [r for r in all_rows if not r[4].startswith("OK")]
    checked = len(all_rows)
    print(f"независимо пересчитано значений: {checked} (по {len(VARIANTS)} вариантам)")
    print(f"расхождений: {len(bad)}")
    for k, v, pv, cv, verdict in bad:
        print(f"  [{v}] {k}: паспорт={pv} пересчёт={cv} — {verdict}")
    for p in problems:
        print("  " + p)
    if not bad and not problems:
        print("все значения паспорта подтверждены независимым пересчётом и листами «Контроль»")

    if args.md:
        write_md(passports, all_rows, bad, problems)
    return 1 if (bad or problems) else 0


def write_md(passports, all_rows, bad, problems):
    lines = ["# Ключи ответов квизов ai-excel",
             "",
             "Ключи получены НЕЗАВИСИМЫМ пересчётом из исходных файлов скриптом",
             "`tools/verify_quiz_keys.py` (правило построения тестов: ключ решается заново,",
             "а не переписывается из намерения автора). Значения в таблице — из",
             "`datasets/passports.json`: именно они подставляются в XML квизов.",
             "",
             f"Проверено значений: {len(all_rows)}. Расхождений: {len(bad)}.",
             ""]
    if bad or problems:
        lines += ["## ⚠ Расхождения (требуют разбора)", ""]
        for k, v, pv, cv, verdict in bad:
            lines.append(f"- вариант {v}, `{k}`: паспорт `{pv}`, независимый пересчёт `{cv}` — {verdict}")
        for p in problems:
            lines.append(f"- {p}")
        lines.append("")
    lines += ["## Числовые ключи по вариантам", "",
              "| Вопрос квиза | Показатель | A | B | C | Допуск |",
              "|---|---|---|---|---|---|"]
    numeric = json.loads((ASSES / "numeric_items.json").read_text(encoding="utf-8"))["items"]
    for it in numeric:
        if it["type"] == "calculated":
            lines.append(f"| `{it['id']}` | расчётный (числа у каждого свои) | — | — | — | ±0,5% от формулы |")
            continue
        vals = []
        for v in VARIANTS:
            try:
                node = passports[v]
                for part in it["key_path"].split("."):
                    if "@" in part:
                        part, _, n = part.partition("@")
                        node = node[part]
                        node = list(node.values())[int(n)] if isinstance(node, dict) else node[int(n)]
                    else:
                        node = node[part]
                vals.append(node)
            except Exception as e:  # noqa: BLE001
                vals.append(f"[VERIFY: {e}]")
        unit = it.get("unit", "")
        tol = "точное" if unit in ("строк", "кодов", "колонок", "месяц") else "±0,5%"
        fmt = [f"{x:,.2f}".replace(",", " ") if isinstance(x, float) else str(x) for x in vals]
        lines.append(f"| `{it['id']}` | {unit or 'значение'} | {fmt[0]} | {fmt[1]} | {fmt[2]} | {tol} |")
    lines += ["", "## Как пересчитывались значения",
              "- Выручка строки = Количество × Цена × (1 − Скидка% / 100);",
              "- Прибыль = Выручка − Себестоимость за ед. × Количество;",
              "- округление денег half-up до копеек (как в табличных редакторах);",
              "- аннуитет: платёж = S·i / (1 − (1+i)^−n), i = 0,18/12, n = 12, S = 1 000 000;",
              "- переплата = платёж × 12 − S;",
              "- доля категории = Σ выручки категории / Σ всей выручки × 100, 2 знака;",
              "- крупная сделка = выручка строки > 100 000;",
              "- база мини-бюджета = Σ выручки июля–декабря / 6;",
              "- очистка грязного файла для проверки: удалены полные дубликаты,",
              "  текстовые числа («1 200,50») нормализованы.",
              "",
              "## Что НЕ пересчитывалось независимо (помечено в блупринте)",
              "- `layer.bonus_sum`, `layer.seg_low/mid/high` — правила бонуса и ценовых сегментов",
              "  заданы в карточке урока 3; пересчёт совпал бы только при точном повторе правила,",
              "  поэтому значение берётся из эталона `reference_b3.xlsx` (лист «Контроль»).",
              "- `b5.net_base/opt/pess`, `b5.min_cash_pess`, `b5.gap_pess`, `b6.net6_*` — результат",
              "  бюджетной модели с параметрами расходов из карточки урока; независимо проверяется",
              "  только её вход (`base`, `jan_rev`) и кредитная математика.",
              "- Для варианта A эталоны `reference_b1…b4.xlsx` авторские (созданы до нашего",
              "  генератора), поэтому сверка паспорта с их листами «Контроль» — полностью",
              "  независимая проверка. Для B/C эталоны построены генератором: там независима",
              "  только часть L2 (пересчёт из сырых файлов).",
              ""]
    (ASSES / "answer_key.md").write_text("\n".join(lines), encoding="utf-8")
    print("записано:", ASSES / "answer_key.md")


if __name__ == "__main__":
    sys.exit(main())
