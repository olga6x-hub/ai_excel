"""Генератор датасетов курса ai-excel («Табличный редактор текстом»).

Вариант A = существующие эталоны в courses/ai-excel (authoritative). Генератор:
  1) калибрует правила расчётных колонок по reference_b3 (построчно);
  2) достраивает вариант A: грязный sales_2025, студенческие warmup/safe;
  3) генерирует варианты B и C целиком (та же структура, другие числа);
  4) строит эталоны b5 (бюджет) и b6 (грязный финал) для всех вариантов;
  5) пишет паспорта контрольных чисел (datasets/passports.json) для квизов;
  6) verify: перечитывает всё и сверяет; в safe-файлах ищет утечки ПДн.

Запуск (python = системный 3.10 с openpyxl), из C:/Users/Olga/harness:
  python tools/build_excel_datasets.py A|BC|b56|verify|all
"""
import argparse
import json
import random
import re
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

COURSE = Path(r"C:/Users/Olga/harness/courses/ai-excel")
DS = COURSE / "datasets"

MONTHS_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
             "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
REGIONS = ["Москва", "Санкт-Петербург", "Казань", "Новосибирск", "Екатеринбург"]
CATEGORIES = ["Электроника", "Бытовая техника", "Товары для дома", "Посуда"]
PHANTOM_SKUS = ["ВК-901", "ВК-902", "ВК-903"]
N_OUT, N_DUP = 24, 6
N_PHONE, N_EMAIL, N_NOTES, N_PASSPORT = 731, 640, 62, 2
SEEDS = {"A": 20251116, "B": 20251117, "C": 20251118}

NOTES_PLAIN = ["Опт", "Самовывоз", "Доставка ТК", "Звонили дважды", "Постоянный клиент",
               "Срочно", "Без звонка", "Отдел закупок", "Отгрузка со склада", "Повторный заказ",
               "Согласовано с руководителем", "Оплата по счёту", "Звонить после 18:00",
               "Приоритетная отгрузка", "Спецусловия по цене"]
REGIONS_DIRTY = {"Москв": "Москва", "Москва ": "Москва", "СПб": "Санкт-Петербург",
                 "спб": "Санкт-Петербург", "казань": "Казань", "Екб": "Екатеринбург",
                 "Новосиб": "Новосибирск", "екатеринбург": "Екатеринбург"}

REGRESSION_A = {  # регрессия варианта A по листам «Контроль» b1–b4
    "warmup_rows": 300, "warmup_rev": 5742912.50, "warmup_prof": 1947619.94,
    "sales_rows": 1800, "qty_sum": 6780, "rev_sum": 27915616.50,
    "prof_sum": 8911072.29, "bonus_sum": 866107.90, "big_deals": 12,
    "not_found": 24, "dup_rows": 6, "seg_low": 1248, "seg_mid": 552, "seg_high": 0,
    "margin_min": 15.57, "margin_max": 44.68, "total_after20": 28534230.50,
    "insert_rows": 20, "insert_rev": 618614.00,
    "leader_region": "Москва", "leader_region_rev": 8521673,
    "top_mgr_prof": 1961867.71,
    "cat_share": {"Электроника": 27.35, "Бытовая техника": 36.15,
                  "Товары для дома": 22.58, "Посуда": 13.93},
    # топ-5 товаров по выручке — из листа «Контроль» авторского reference_b4.xlsx
    "top5": {"Пылесос вертикальный": 4804986.0, "Смарт-часы": 3159993.0,
             "Микроволновая печь": 2799764.0, "Набор кастрюль 5 пр.": 2032074.0,
             "Обогреватель масляный": 1731670.5},
}


def money(x):
    """Округление до копеек как в табличных редакторах: half-up (не банковское)."""
    from decimal import Decimal, ROUND_HALF_UP
    return float(Decimal(str(float(x))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


# ---------------------------------------------------------------- чтение A
def load_variant_A():
    wb = openpyxl.load_workbook(COURSE / "reference_b2.xlsx", read_only=True, data_only=True)
    rows = list(wb["Сделки"].iter_rows(values_only=True))
    sales_hdr, sales = rows[0], rows[1:]
    srows = list(wb["Справочник товаров"].iter_rows(values_only=True))
    ref_hdr, ref = srows[0], srows[1:]
    wb.close()
    wb = openpyxl.load_workbook(COURSE / "reference_b1.xlsx", read_only=True, data_only=True)
    w = list(wb["Сделки"].iter_rows(values_only=True))
    warm_hdr, warm = w[0], w[1:]
    wb.close()
    return dict(sales_hdr=sales_hdr, sales=sales, ref_hdr=ref_hdr, ref=ref,
                warm_hdr=warm_hdr, warm=warm)


def load_keys():
    keys = {}
    for v in "ABC":
        kwb = openpyxl.load_workbook(COURSE / f"keys_variant_{v}.xlsx", read_only=True, data_only=True)
        keys[v] = [(r[0], r[1]) for r in kwb["Ключ"].iter_rows(values_only=True)
                   if r[0] and str(r[0]).startswith("М")]
        kwb.close()
    return keys


# --------------------------------------------------- калибровка правил b3
def calibrate(A):
    wb = openpyxl.load_workbook(COURSE / "reference_b3.xlsx", read_only=True, data_only=True)
    rows = list(wb["Сделки"].iter_rows(values_only=True))
    hdr, data = rows[0], rows[1:]
    wb.close()
    ix = {n: i for i, n in enumerate(hdr)}
    mism = Counter()
    catmon = defaultdict(float)
    for r in data:
        q, price, disc, cost = (float(r[ix["Количество"]]), float(r[ix["Цена"]]),
                                float(r[ix["Скидка %"]]), float(r[ix["Себестоимость за ед."]]))
        rev, prof = float(r[ix["Выручка"]]), float(r[ix["Прибыль"]])
        if abs(money(q * price * (1 - disc / 100)) - rev) > 0.011:
            mism["rev"] += 1
        if abs(money(rev - q * cost) - prof) > 0.011:
            mism["prof"] += 1
        bonus = money(0.05 * rev if r[ix["Крупная сделка"]] == "Да" else 0.03 * rev)
        if abs(bonus - float(r[ix["Бонус"]])) > 0.011:
            mism["bonus"] += 1
        if abs((rev - q * cost) / rev - float(r[ix["Маржа %"]])) > 0.0005:
            mism["margin"] += 1
        catmon[(r[ix["Категория"]], r[ix["Месяц"]])] += rev
    seen_cm = set()
    for r in data:
        key = (r[ix["Категория"]], r[ix["Месяц"]])
        if key in seen_cm:
            continue
        seen_cm.add(key)
        if abs(round(catmon[key]) - float(r[ix["Выручка категории за месяц"]])) > 0.51:
            mism["catmon"] += 1
    return dict(mism)


# ------------------------------------------------------------ дефекты ПДн
def gen_contacts(rng, n_rows):
    phones, emails, notes = {}, {}, {}
    for i in rng.sample(range(n_rows), N_PHONE):
        phones[i] = f"+7 9{rng.randint(10, 99)} {rng.randint(100, 999)}-{rng.randint(10, 99)}-{rng.randint(10, 99)}"
    doms = ["mail.ru", "gmail.com", "yandex.ru", "bk.ru", "list.ru"]
    names = ["a.ivanov", "s.petrov", "elena.s", "kuznetzov.o", "masha88", "sergey.p",
             "olga.k", "d.orlov", "n.smirnova", "v.popov"]
    for i in rng.sample(range(n_rows), N_EMAIL):
        emails[i] = f"{rng.choice(names)}{rng.randint(1, 99)}@{rng.choice(doms)}"
    plain = rng.sample(range(n_rows), N_NOTES)
    passport_rows, plain = plain[:N_PASSPORT], plain[N_PASSPORT:]
    for i in plain:
        notes[i] = rng.choice(NOTES_PLAIN)
    for j, i in enumerate(passport_rows):
        notes[i] = (f"Паспорт клиента: 45 0{7 - j} №{rng.randint(100000, 999999)}, "
                    f"выдан {rng.randint(1, 28):02d}.{rng.randint(1, 12):02d}.2019, "
                    f"{'ОУФМС' if j == 0 else 'МФЦ'} {rng.choice(REGIONS)}")
    return phones, emails, notes


def make_dirty(rng, safe_rows, names_by_code, ref_rows, sku_cost):
    hdr = list(safe_rows[0]) + ["Телефон клиента", "Email клиента", "Примечание"]
    phones, emails, notes = gen_contacts(rng, len(safe_rows) - 1)
    out = [tuple(hdr)]
    for i, r in enumerate(safe_rows[1:]):
        out.append(tuple(list(r[:11]) + [phones.get(i, ""), emails.get(i, ""), notes.get(i, "")]))
    dref = [("Артикул", "Товар", "Категория", "Поставщик", "Закупочная цена")]
    for r0 in ref_rows:
        cost = float(sku_cost.get(r0[0], 1000.0))
        dref.append(tuple(list(r0[:4]) + [money(cost * rng.uniform(0.85, 0.95))]))
    return out, dref


# --------------------------------------------------------- генерация B/C
def gen_sales(rng, A, variant):
    month_rows = {"B": [118, 102, 136, 130, 129, 124, 143, 140, 188, 174, 205],
                  "C": [125, 95, 142, 124, 135, 118, 145, 135, 190, 168, 207]}[variant]
    month_rows = month_rows + [1800 - sum(month_rows)]
    sku, sku_cost = {}, {}
    for r in A["ref"]:
        prices = sorted({float(x[8]) for x in A["sales"] if x[4] == r[0]})
        costs = sorted({float(x[10]) for x in A["sales"] if x[4] == r[0]})
        if prices and costs:
            sku[r[0]] = (r[1], r[2], r[3], int(prices[0]), money(costs[0]))
            sku_cost[r[0]] = money(costs[0])
    mgr_w = {"B": [20, 22, 15, 20, 17, 6], "C": [11, 19, 15, 22, 18, 15]}[variant]
    reg_w = {"B": [29, 21, 19, 16, 15], "C": [25, 23, 20, 16, 16]}[variant]
    qty_w = [1] * 23 + [2] * 21 + [3] * 16 + [4] * 8 + [5] * 7 + [6] * 7 + [8] * 8 + [10] * 10
    disc_pool = [0, 0, 0, 0, 0, 5, 5, 5, 10, 10, 15]
    codes = [f"М{i}" for i in range(1, 7)]
    sku_keys = sorted(sku)
    rows, num = [], 1
    for m, n in enumerate(month_rows, start=1):
        dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
        for _ in range(n):
            if rng.random() < 0.018:
                art = rng.choice(PHANTOM_SKUS)
                goods, cat = "Позиция без карточки", rng.choice(CATEGORIES)
                price = rng.choice([990, 1490, 2190])
                cost = money(price * rng.uniform(0.60, 0.70))
                sku_cost.setdefault(art, cost)
            else:
                art = rng.choice(sku_keys)
                goods, cat, _, price, cost = sku[art]
            rows.append([date(2025, m, rng.randint(1, dim)), f"С-2025-{num:04d}",
                         rng.choices(codes, weights=mgr_w)[0], rng.choices(REGIONS, weights=reg_w)[0],
                         art, goods, cat, rng.choice(qty_w), price, rng.choice(disc_pool), cost])
            num += 1
    # нормируем фантомные артикулы ровно к N_OUT строкам
    ph = [i for i, r in enumerate(rows) if r[4] in PHANTOM_SKUS]
    normal = [i for i, r in enumerate(rows) if r[4] not in PHANTOM_SKUS]
    rng.shuffle(normal)
    while len(ph) > N_OUT:
        i = ph.pop()
        art = rng.choice(sku_keys)
        rows[i][4], rows[i][5], rows[i][6], rows[i][8], rows[i][10] = (
            art, sku[art][0], sku[art][1], sku[art][3], sku[art][4])
    while len(ph) < N_OUT and normal:
        i = normal.pop()
        art = rng.choice(PHANTOM_SKUS)
        price = rng.choice([990, 1490, 2190])
        rows[i][4], rows[i][5], rows[i][6] = art, "Позиция без карточки", rng.choice(CATEGORIES)
        rows[i][8], rows[i][10] = price, money(price * rng.uniform(0.60, 0.70))
        ph.append(i)
    # ровно N_DUB дублей номеров
    idxs = rng.sample(range(len(rows)), N_DUP * 2)
    for k in range(N_DUP):
        rows[idxs[2 * k + 1]][1] = rows[idxs[2 * k]][1]
    rng.shuffle(rows)
    rows.sort(key=lambda r: (r[0], r[1]))
    return [tuple(A["sales_hdr"])] + [tuple(r) for r in rows], sku, sku_cost


def gen_warmup(rng, A):
    goods = sorted({(r[1], float(r[3]), float(r[5])) for r in A["warm"]})
    qty_w = [1] * 23 + [2] * 21 + [3] * 16 + [4] * 8 + [5] * 7 + [6] * 7 + [8] * 8 + [10] * 10
    disc_pool = [0, 0, 0, 0, 0, 5, 5, 5, 10, 10, 15]
    rows = [tuple(A["warm_hdr"][:6])]
    days = [(10, 31), (11, 30), (12, 31)]
    for _ in range(300):
        m, dm = days[rng.choices([0, 1, 2], weights=[1, 1, 1.1])[0]]
        g, price, cost = rng.choice(goods)
        rows.append((date(2025, m, rng.randint(1, dm)), g, rng.choice(qty_w),
                     int(price), rng.choice(disc_pool), money(cost)))
    return rows


def gen_insert20(rng, A, sales):
    arts = {r[4]: (r[5], r[6], float(r[8]), float(r[10])) for r in sales[1:]
            if r[4] not in PHANTOM_SKUS}
    keys = sorted(arts)
    rows = [tuple(A["sales_hdr"][:11])]
    for i in range(20):
        art = rng.choice(keys)
        goods, cat, price, cost = arts[art]
        q = rng.randint(1, 6)
        disc = rng.choice([0, 5, 10])
        rows.append((date(2025, 12, rng.randint(1, 28)), f"С-2025-9{i + 10:03d}",
                     f"М{i % 6 + 1}", rng.choice(REGIONS), art, goods, cat,
                     q, int(price), disc, cost))
    return rows


# ---------------------------------------------------------- расчётный слой
from decimal import Decimal as _D, ROUND_HALF_UP as _HU


def _mu(x):
    """Decimal half-up до копеек (как табличные редакторы)."""
    return x.quantize(_D("0.01"), rounding=_HU)


def calc_layer(sales_rows, ref_rows):
    hdr = list(sales_rows[0]) + ["Выручка", "Прибыль", "Крупная сделка", "Поставщик",
                                 "Месяц", "Квартал", "Маржа %", "Бонус", "Ценовой сегмент",
                                 "Дубль", "Выручка категории за месяц"]
    ix = {n: i for i, n in enumerate(hdr)}
    sup = {r[0]: r[3] for r in ref_rows}
    cat_month, pre = defaultdict(_D), []
    for r in sales_rows[1:]:
        q, price, disc, cost = (_D(str(r[7])), _D(str(r[8])), _D(str(r[9])), _D(str(r[10])))
        rev_raw = q * price * (1 - disc / 100)
        rev = _mu(rev_raw)
        prof = _mu(rev - q * cost)
        rate = _D("0.05") if rev > 100000 else _D("0.03")
        bonus = _mu(rev_raw * rate)
        pre.append((r, rev, prof, bonus, rev_raw))
        cat_month[(r[6], r[0].month)] += rev
    rows, seen = [], Counter()
    for r, rev, prof, bonus, rev_raw in pre:
        d = r[0]
        seen[r[1]] += 1
        margin = float(prof / rev) if rev else 0
        rows.append(list(r[:11]) + [
            float(rev), float(prof), "Да" if rev > 100000 else "Нет",
            sup.get(r[4], "не найдено"),
            MONTHS_RU[d.month - 1], (d.month - 1) // 3 + 1,
            margin, float(bonus),
            "низкий" if r[8] < 5000 else ("средний" if r[8] <= 15000 else "высокий"),
            "Да" if seen[r[1]] > 1 else "Нет",
            int(cat_month[(r[6], d.month)].to_integral_value(rounding=_HU))])
    c = Counter()
    for row in rows:
        c["big"] += row[ix["Крупная сделка"]] == "Да"
        c["nf"] += row[ix["Поставщик"]] == "не найдено"
        c["dup"] += row[ix["Дубль"]] == "Да"
        c["low"] += row[ix["Ценовой сегмент"]] == "низкий"
        c["mid"] += row[ix["Ценовой сегмент"]] == "средний"
        c["high"] += row[ix["Ценовой сегмент"]] == "высокий"
    ctrl = {
        "rev": money(sum(r[ix["Выручка"]] for r in rows)),
        "prof": money(sum(r[ix["Прибыль"]] for r in rows)),
        "bonus": money(sum(r[ix["Бонус"]] for r in rows)),
        "big": c["big"], "not_found": c["nf"], "dup": c["dup"],
        "seg_low": c["low"], "seg_mid": c["mid"], "seg_high": c["high"],
        "margin_min": round(min(r[ix["Маржа %"]] for r in rows) * 100, 2),
        "margin_max": round(max(r[ix["Маржа %"]] for r in rows) * 100, 2),
        "catmon_sum": sum(r[ix["Выручка категории за месяц"]] for r in rows),
        "month_rows": {MONTHS_RU[m - 1]: sum(1 for r in rows if r[0].month == m) for m in range(1, 13)},
    }
    return [tuple(hdr)] + [tuple(r) for r in rows], ctrl


# ------------------------------------------------------------- сводные b4
def build_pivots(layer, insert_rows):
    ix = {n: i for i, n in enumerate(layer[0])}
    rev, prof = ix["Выручка"], ix["Прибыль"]
    s1 = [("Регион \\ Месяц", *MONTHS_RU, "Итог")]
    reg_rev = defaultdict(lambda: [0.0] * 12)
    for r in layer[1:]:
        reg_rev[r[3]][r[0].month - 1] += r[rev]
    for reg in REGIONS:
        vals = [money(x) for x in reg_rev[reg]]
        s1.append((reg, *vals, money(sum(vals))))
    col_tot = [money(sum(row[m + 1] for row in s1[1:])) for m in range(12)]
    s1.append(("Итог", *col_tot, money(sum(col_tot))))
    s2 = [("Менеджер \\ Категория", *CATEGORIES, "Итог")]
    mgr = defaultdict(lambda: [0.0] * 4)
    for r in layer[1:]:
        mgr[r[2]][CATEGORIES.index(r[6])] += r[prof]
    order = sorted(mgr, key=lambda m: -sum(mgr[m]))
    for m in order:
        vals = [money(x) for x in mgr[m]]
        s2.append((m, *vals, money(sum(vals))))
    cat_rev = Counter()
    for r in layer[1:]:
        cat_rev[r[6]] += r[rev]
    total = sum(cat_rev.values())
    shares = [("Категория", "Выручка", "Доля, %")] + [
        (c, money(cat_rev[c]), round(cat_rev[c] / total * 100, 2)) for c in CATEGORIES]
    g1 = [("Месяц", "Выручка")] + [(MONTHS_RU[m], col_tot[m]) for m in range(12)]
    goods_rev = Counter()
    for r in layer[1:]:
        goods_rev[r[5]] += r[rev]
    top5 = goods_rev.most_common(5)
    g2 = [("Товар", "Выручка")] + [(t, money(v)) for t, v in top5]
    ins_rev = money(sum(float(r[7]) * float(r[8]) * (1 - float(r[9]) / 100) for r in insert_rows[1:]))
    ins_dec = money(sum(float(r[7]) * float(r[8]) * (1 - float(r[9]) / 100)
                        for r in insert_rows[1:] if r[0].month == 12))
    s1b = [tuple(row) for row in s1[:6]] + [
        ("Итог", *col_tot, money(sum(col_tot) + ins_rev))]
    ctrl = {
        "total": money(sum(col_tot)), "leader_region": max(REGIONS, key=lambda g: sum(reg_rev[g])),
        "leader_region_rev": money(max(sum(reg_rev[g]) for g in REGIONS)),
        "top_mgr_prof": money(sum(mgr[order[0]])), "top_mgr_code": order[0],
        "top5": [(t, money(v)) for t, v in top5],
        "cat_share": {c: round(cat_rev[c] / total * 100, 2) for c in CATEGORIES},
        "total_after20": money(sum(col_tot) + ins_rev), "dec_after20": money(col_tot[11] + ins_dec),
    }
    return {"Сводная (эталон)": s1, "Сводная 2 (эталон)": s2, "Доли категорий": shares,
            "Данные для графиков": g1 + [("", "")] + g2, "Сводная после +20 (эталон)": s1b,
            "ctrl": ctrl}


# ------------------------------------------------------------------ бюджет
def budget_model(base, growth, cost_share, rent, fot_jan, fot_jul, mkt, tax, start_cash):
    """12 мес. 2026. Январь = base (как закончили 2025), далее ×(1+growth)."""
    rows, cash, r_m = [], start_cash, base
    for m in range(1, 13):
        if m > 1:
            r_m = r_m * (1 + growth)
        revenue = r_m
        cogs = revenue * cost_share
        gross = revenue - cogs
        fot = fot_jan if m < 7 else fot_jul
        marketing = revenue * mkt
        oper = gross - rent - fot - marketing
        tax_v = revenue * tax
        net = oper - tax_v
        cash += net
        rows.append((MONTHS_RU[m - 1], money(revenue), money(cogs), money(gross), rent, fot,
                     money(marketing), money(oper), money(tax_v), money(net), money(net), money(cash)))
    hdr = ("Статья", *MONTHS_RU)
    names = ["Выручка", "Себестоимость", "Валовая прибыль", "Аренда", "ФОТ",
             "Маркетинг", "Опер. прибыль", "Налог", "Чистая прибыль",
             "Ден. поток месяца", "Накопительный остаток"]
    out = [(name, *[rows[m][j + 1] for m in range(12)]) for j, name in enumerate(names)]
    net_year = money(sum(r[9] for r in rows))
    min_cash = money(min(r[11] for r in rows))
    gap_month = next((rows[m][0] for m in range(12) if rows[m][11] < 0), None)
    return [hdr] + out, net_year, min_cash, gap_month


def build_b5(base_m):
    drv = [("Параметр", "Значение", "Единица"),
           ("Темп роста выручки в месяц", 0.05, "доля"),
           ("Доля себестоимости", 0.62, "доля"),
           ("Аренда", 150000, "р./мес"),
           ("ФОТ январь–июнь", 400000, "р./мес"),
           ("ФОТ июль–декабрь (+10%)", 440000, "р./мес"),
           ("Маркетинг", 0.03, "доля от выручки"),
           ("Налог", 0.06, "доля от выручки"),
           ("Стартовый остаток денег", 300000, "р."),
           ("База: среднемесячная выручка 2025", money(base_m), "р.")]

    def args(g, cs, rent):
        return (base_m, g, cs, rent, 400000, 440000, 0.03, 0.06, 300000)

    budget, net_b, cash_b, gap_b = budget_model(*args(0.05, 0.62, 150000))
    _, net_o, cash_o, gap_o = budget_model(*args(0.08, 0.58, 150000))
    _, net_p, cash_p, gap_p = budget_model(*args(0.0, 0.68, 180000))
    scen = [("Сценарий", "Рост/мес", "Себест.", "Чистая прибыль за год", "Мин. остаток", "Месяц разрыва"),
            ("Базовый", 0.05, 0.62, net_b, cash_b, gap_b or "—"),
            ("Оптимистичный", 0.08, 0.58, net_o, cash_o, gap_o or "—"),
            ("Пессимистичный", 0.0, 0.68, net_p, cash_p, gap_p or "—")]
    lo, hi = 0.0, 0.15
    for _ in range(60):
        mid = (lo + hi) / 2
        _, net_x, _, _ = budget_model(*args(mid, 0.62, 150000))
        if net_x < 3000000:
            lo = mid
        else:
            hi = mid
    growth_fit = round((lo + hi) / 2, 6)
    _, net_fit, _, _ = budget_model(*args(growth_fit, 0.62, 150000))
    i, P, n = 0.18 / 12, 1000000, 12
    pay = money(P * i / (1 - (1 + i) ** -n))
    overpay = money(pay * n - P)
    sens = [("Доля себестоимости, %", "Чистая прибыль за год")]
    for share100 in range(55, 71, 3):
        _, net_s, _, _ = budget_model(*args(0.05, round(share100 / 100 + 1e-9, 4), 150000))
        sens.append((share100, net_s))
    ctrl_rows = [
        ("Среднемесячная выручка 2025 (база)", money(base_m), "расчёт из файла продаж"),
        ("Выручка января 2026", money(base_m), "январь = база, рост с февраля"),
        ("Чистая прибыль года: базовый", net_b, ""),
        ("Чистая прибыль года: оптимистичный", net_o, ""),
        ("Чистая прибыль года: пессимистичный", net_p, ""),
        ("Мин. остаток денег: пессимистичный", cash_p, ""),
        ("Месяц кассового разрыва: пессимистичный", gap_p or "нет разрыва", ""),
        ("Темп роста под ЧП = 3 000 000", growth_fit, "проверка: ЧП = %s" % net_fit),
        ("Аннуитетный платёж (кредит 1 млн, 18%)", pay, "12 мес"),
        ("Переплата по процентам", overpay, "платежи − тело"),
    ]
    passport = {"base": money(base_m), "jan_rev": money(base_m), "net_base": net_b,
                "net_opt": net_o, "net_pess": net_p, "min_cash_pess": cash_p,
                "gap_pess": gap_p, "growth_fit": growth_fit, "net_fit": net_fit,
                "annuity": pay, "overpay": overpay}
    sheets = [("Драйверы", drv), ("Бюджет", budget), ("Сценарии", scen),
              ("Чувствительность", sens)]
    return sheets, ctrl_rows, passport


# ------------------------------------------------------------- грязный b6
def gen_dirty_final(rng, safe_rows, names_by_code):
    """Файл блока 6: дефекты качества + вбросы ПДн."""
    pool = list(safe_rows[1:])
    rng.shuffle(pool)
    picked = pool[:400]
    hdr = tuple(list(safe_rows[0]) + ["Телефон клиента", "Примечание"])
    rows = [hdr]
    defects = Counter()
    for k, r in enumerate(picked):
        d, num, code, reg, art, goods, cat, q, price, disc, cost = list(r[:11])
        if k % 17 == 0:
            reg = rng.choice(list(REGIONS_DIRTY))
            defects["region_typo"] += 1
        if k % 23 == 0:
            d = "%02d.%02d.%d" % (d.day, d.month, d.year)
            defects["date_text"] += 1
        if k % 41 == 0:
            q = None
            defects["qty_missing"] += 1
        phone = ""
        if k % 6 == 0:
            phone = f"+7 9{rng.randint(10, 99)} {rng.randint(100, 999)}-{rng.randint(10, 99)}-{rng.randint(10, 99)}"
            defects["phones"] += 1
        note = ""
        if k % 29 == 0:
            note = rng.choice(NOTES_PLAIN)
            defects["notes"] += 1
        if k in (100, 260):
            note = f"Паспорт клиента: 45 09 №{rng.randint(100000, 999999)}, оплата наличными"
            defects["passport_notes"] += 1
        rows.append((d, num, names_by_code.get(code, code), reg, art, goods, cat, q,
                     price, disc, cost, phone, note))
    dups = rng.sample(range(1, len(rows)), 8)
    for i in dups:
        rows.append(tuple(rows[i]))
        defects["full_dup"] += 1
    rng.shuffle(rows[1:])
    return rows, dict(defects)


def clean_dirty_final(rows):
    """Эталонная очистка З6.2 (после локального удаления ПДн)."""
    hdr = rows[0]
    uniq, seen_full, stats = [], set(), Counter()
    for r in rows[1:]:
        key = tuple("" if c is None else c for c in r)
        if key in seen_full:
            stats["dup_removed"] += 1
            continue
        seen_full.add(key)
        uniq.append(list(r))
    out = []
    for r in uniq:
        d = r[0]
        if isinstance(d, str):
            dd, mm, yy = d.split(".")
            r[0] = date(int(yy), int(mm), int(dd))
            stats["dates_fixed"] += 1
        if r[3] in REGIONS_DIRTY:
            stats["regions_fixed"] += 1
            r[3] = REGIONS_DIRTY[r[3]]
        if r[7] is None:
            stats["qty_flagged"] += 1
            r[7] = 0
        stats["phones"] += bool(r[11])
        stats["notes"] += bool(r[12])
        r[11], r[12] = "", ""
        out.append(r)
    rev = money(sum((r[7] or 0) * r[8] * (1 - r[9] / 100) for r in out))
    stats["rows_after"] = len(out)
    stats["rev_after"] = rev
    return [hdr] + [tuple(r) for r in out], dict(stats)


# ------------------------------------------------------------------ запись
def style_ctrl(ws):
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.fill = PatternFill("solid", fgColor="F0F0F0")
    for col, w in zip("ABC", (46, 20, 56)):
        ws.column_dimensions[col].width = w
    ws.freeze_panes = "A2"


MONEY_HINT = ("выручк", "прибыл", "цена", "себестоим", "бонус", "сумм", "зарплат",
              "аренд", "фот", "маркет", "налог", "остат", "поток", "платёж", "платеж",
              "кредит", "затрат", "расход", "доход", "бюджет", "наличн", "деньг", "маржа")


def fmt_sheet(ws, header, n_rows):
    """Оформление листа данных: шапка, автофильтр, ширины по содержимому, форматы чисел.

    Только оформление — значения не меняются (регрессия варианта A остаётся в силе).
    """
    for j, h in enumerate(header, 1):
        c = ws.cell(row=1, column=j)
        c.font = Font(bold=True, color="1F1F1F")
        c.fill = PatternFill("solid", fgColor="F4E6E1")
        c.alignment = Alignment(wrap_text=True, vertical="center")
    ws.row_dimensions[1].height = 26
    if n_rows > 1:
        ws.auto_filter.ref = "A1:%s%d" % (get_column_letter(len(header)), n_rows)

    for j, h in enumerate(header, 1):
        name = str(h).lower()
        if "дата" in name:
            numfmt = "DD.MM.YYYY"
        elif any(k in name for k in MONEY_HINT):
            numfmt = "#,##0.00"
        else:
            numfmt = "#,##0"
        width = max(len(str(h)) + 2, 8)
        for i in range(2, n_rows + 1):
            v = ws.cell(row=i, column=j).value
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                ws.cell(row=i, column=j).number_format = numfmt
                txt = str(round(v, 2)) if isinstance(v, float) else str(v)
            else:
                txt = "" if v is None else str(v)
            width = max(width, min(len(txt) + 2, 42))
        ws.column_dimensions[get_column_letter(j)].width = width


def save_workbook(path, sheets, ctrl_title=None, ctrl_rows=None):
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    tabs = ["D97757", "6B8E9B", "8A9A5B", "B08968", "7D6B8A", "9B7E6B"]
    for k, (name, rows) in enumerate(sheets):
        ws = wb.create_sheet(name)
        for r in rows:
            ws.append(list(r))
        if name != "Контроль" and rows:
            ws.freeze_panes = "A2"
            ws.sheet_properties.tabColor = tabs[k % len(tabs)]
            fmt_sheet(ws, rows[0], len(rows))
    if ctrl_title:
        ws = wb.create_sheet("Контроль")
        ws.append((ctrl_title, "Значение", "Пояснение"))
        for r in ctrl_rows:
            ws.append(r)
        style_ctrl(ws)
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)
    return path


# ------------------------------------------------------------------ фазы
def check_regression(ctrl):
    pairs = [("rev", "rev_sum"), ("prof", "prof_sum"), ("bonus", "bonus_sum"), ("big", "big_deals"),
             ("not_found", "not_found"), ("dup", "dup_rows"), ("seg_low", "seg_low"),
             ("seg_mid", "seg_mid"), ("seg_high", "seg_high")]
    bad = [(k, ctrl[c], REGRESSION_A[k]) for c, k in pairs
           if abs(float(ctrl[c]) - float(REGRESSION_A[k])) > 0.01]
    if abs(ctrl["margin_min"] - REGRESSION_A["margin_min"]) > 0.02 or \
       abs(ctrl["margin_max"] - REGRESSION_A["margin_max"]) > 0.02:
        bad.append(("margin", (ctrl["margin_min"], ctrl["margin_max"]),
                    (REGRESSION_A["margin_min"], REGRESSION_A["margin_max"])))
    return bad


def phase_A(A, keys, passports):
    rng = random.Random(SEEDS["A"])
    names = {c: f for c, f in keys["A"]}
    sku_cost = {r[4]: float(r[10]) for r in A["sales"]}
    out = DS / "variant_A"
    warm6 = [tuple(A["warm_hdr"][:6])] + [tuple(r[:6]) for r in A["warm"]]
    save_workbook(out / "warmup.xlsx", [("Сделки", warm6)])
    safe_rows = [tuple(A["sales_hdr"])] + [tuple(r) for r in A["sales"]]
    save_workbook(out / "sales_2025_safe.xlsx",
                  [("Сделки", safe_rows),
                   ("Справочник товаров", [tuple(A["ref_hdr"])] + [tuple(r) for r in A["ref"]])])
    dirty_rows, dirty_ref = make_dirty(rng, safe_rows, names, A["ref"], sku_cost)
    save_workbook(out / "sales_2025.xlsx",
                  [("Сделки", dirty_rows), ("Справочник товаров", dirty_ref)])
    # авторский insert_20rows_safe для A — копия существующего эталонного файла
    src_ins = COURSE / "insert_20rows_safe.xlsx"
    if src_ins.exists():
        import shutil
        out.mkdir(parents=True, exist_ok=True)
        shutil.copy(src_ins, out / "insert_20rows_safe.xlsx")
    layer, ctrl = calc_layer(safe_rows, A["ref"])
    reg = check_regression(ctrl)
    passports["A"] = {
        "warmup": {"rows": 300, "rev": REGRESSION_A["warmup_rev"], "prof": REGRESSION_A["warmup_prof"]},
        "sales": {"rows": 1800, "qty_sum": REGRESSION_A["qty_sum"], "codes": 6},
        "dirty": {"phones": N_PHONE, "emails": N_EMAIL, "notes": N_NOTES, "passport": N_PASSPORT,
                  "cols_removed": 3, "rows_out_of_ref": N_OUT},
        "layer": {k: REGRESSION_A[k] for k in
                  ("rev_sum", "prof_sum", "bonus_sum", "big_deals", "not_found", "dup_rows",
                   "seg_low", "seg_mid", "seg_high", "margin_min", "margin_max")},
        "report": {"total": REGRESSION_A["rev_sum"], "leader_region": REGRESSION_A["leader_region"],
                   "leader_region_rev": REGRESSION_A["leader_region_rev"],
                   "top_mgr_prof": REGRESSION_A["top_mgr_prof"],
                   "top5": REGRESSION_A["top5"],
                   "cat_share": REGRESSION_A["cat_share"],
                   "total_after20": REGRESSION_A["total_after20"]},
        "insert": {"rows": 20, "rev": REGRESSION_A["insert_rev"]},
    }
    return reg


def phase_BC(A, keys, passports):
    for v in "BC":
        rng = random.Random(SEEDS[v])
        names = {c: f for c, f in keys[v]}
        out = DS / f"variant_{v}"
        sales, sku, sku_cost = gen_sales(rng, A, v)
        warm = gen_warmup(rng, A)
        ins = gen_insert20(rng, A, sales)
        dirty_rows, dirty_ref = make_dirty(rng, sales, names, A["ref"], sku_cost)
        layer, lctrl = calc_layer(sales, A["ref"])
        piv = build_pivots(layer, ins)
        wr = [tuple(A["warm_hdr"])]
        for r in warm[1:]:
            rev = money(float(r[2]) * float(r[3]) * (1 - float(r[4]) / 100))
            wr.append(tuple(r) + (rev, money(rev - float(r[2]) * float(r[5]))))
        wr_ctrl = [("Строк", len(warm) - 1, ""),
                   ("Сумма «Выручка»", money(sum(x[6] for x in wr[1:])), ""),
                   ("Сумма «Прибыль»", money(sum(x[7] for x in wr[1:])), ""),
                   ("Правило", "Выручка = Кол-во × Цена × (1 − Скидка/100), округление до копеек", "")]
        save_workbook(out / "reference_b1.xlsx", [("Сделки", wr)],
                      "Блок 1 — контрольные числа", wr_ctrl)
        d_ctrl = [("Строк (не изменилось)", len(sales) - 1, ""),
                  ("Уникальных кодов менеджеров", 6, ""),
                  ("Удалено колонок", 3, "Телефон, Email, Примечание"),
                  ("Найдено и удалено телефонов", N_PHONE, ""),
                  ("Найдено и удалено email", N_EMAIL, ""),
                  ("Найдено и удалено примечаний", N_NOTES, "в т.ч. %d с паспортными" % N_PASSPORT),
                  ("Паспортных примечаний", N_PASSPORT, ""),
                  ("Сумма «Количество» (не изменилась)", sum(int(r[7]) for r in sales[1:]), ""),
                  ("Сумма выручки (расчётная)", lctrl["rev"], ""),
                  ("Строк с артикулом вне справочника", lctrl["not_found"], "")]
        save_workbook(out / "reference_b2.xlsx",
                      [("Сделки", sales),
                       ("Справочник товаров", [tuple(A["ref_hdr"])] + [tuple(r) for r in A["ref"]])],
                      "Блок 2 — контрольные числа очистки", d_ctrl)
        l_rows = [("Сумма «Выручка»", lctrl["rev"], ""), ("Сумма «Прибыль»", lctrl["prof"], ""),
                  ("Крупная сделка = «Да»", lctrl["big"], ""),
                  ("Поставщик = «не найдено»", lctrl["not_found"], ""),
                  ("Сумма «Бонус»", lctrl["bonus"], ""), ("Маржа %, минимум", lctrl["margin_min"], "п.п."),
                  ("Маржа %, максимум", lctrl["margin_max"], "п.п."),
                  ("Сегмент «низкий», строк", lctrl["seg_low"], ""),
                  ("Сегмент «средний», строк", lctrl["seg_mid"], ""),
                  ("Сегмент «высокий», строк", lctrl["seg_high"], ""),
                  ("Дубль = «Да», строк", lctrl["dup"], ""),
                  ("Сумма «Выручка категории за месяц»", lctrl["catmon_sum"], "")]
        l_rows += [("Строк в месяце «%s»" % m, n, "") for m, n in lctrl["month_rows"].items()]
        save_workbook(out / "reference_b3.xlsx", [("Сделки", layer)],
                      "Блок 3 — контрольные числа расчётного слоя", l_rows)
        pc = piv["ctrl"]
        p_rows = [("Общий итог выручки (до обновления)", pc["total"], ""),
                  ("Регион-лидер", pc["leader_region"], ""),
                  ("Выручка региона-лидера", pc["leader_region_rev"], ""),
                  ("Прибыль топ-менеджера (значение)", pc["top_mgr_prof"], "код %s" % pc["top_mgr_code"])]
        p_rows += [("Топ-%d товар" % (k + 1), t, "") for k, (t, _) in enumerate(pc["top5"])]
        p_rows += [("Топ-%d товар: выручка" % (k + 1), val, "") for k, (_, val) in enumerate(pc["top5"])]
        p_rows += [("Доля категории «%s», %%" % c, s, "") for c, s in pc["cat_share"].items()]
        p_rows += [("Общий итог после +20 строк", pc["total_after20"], ""),
                   ("Выручка декабря после +20 строк", pc["dec_after20"], "")]
        save_workbook(out / "reference_b4.xlsx",
                      [(k, val) for k, val in piv.items() if k != "ctrl"],
                      "Блок 4 — контрольные числа отчёта", p_rows)
        save_workbook(out / "warmup.xlsx", [("Сделки", warm)])
        save_workbook(out / "sales_2025.xlsx",
                      [("Сделки", dirty_rows), ("Справочник товаров", dirty_ref)])
        save_workbook(out / "sales_2025_safe.xlsx",
                      [("Сделки", sales),
                       ("Справочник товаров", [tuple(A["ref_hdr"])] + [tuple(r) for r in A["ref"]])])
        save_workbook(out / "insert_20rows_safe.xlsx", [("Сделки", ins)])
        passports[v] = {
            "warmup": {"rows": len(warm) - 1, "rev": wr_ctrl[1][1], "prof": wr_ctrl[2][1]},
            "sales": {"rows": len(sales) - 1, "qty_sum": d_ctrl[7][1], "codes": 6},
            "dirty": {"phones": N_PHONE, "emails": N_EMAIL, "notes": N_NOTES,
                      "passport": N_PASSPORT, "cols_removed": 3, "rows_out_of_ref": lctrl["not_found"]},
            "layer": {"rev_sum": lctrl["rev"], "prof_sum": lctrl["prof"], "bonus_sum": lctrl["bonus"],
                      "big_deals": lctrl["big"], "not_found": lctrl["not_found"], "dup_rows": lctrl["dup"],
                      "seg_low": lctrl["seg_low"], "seg_mid": lctrl["seg_mid"], "seg_high": lctrl["seg_high"],
                      "margin_min": lctrl["margin_min"], "margin_max": lctrl["margin_max"]},
            "report": {"total": pc["total"], "leader_region": pc["leader_region"],
                       "leader_region_rev": pc["leader_region_rev"],
                       "top_mgr_prof": pc["top_mgr_prof"],
                       "top5": {t: val for t, val in pc["top5"]},
                       "cat_share": pc["cat_share"], "total_after20": pc["total_after20"]},
            "insert": {"rows": len(ins) - 1,
                       "rev": money(sum(float(r[7]) * float(r[8]) * (1 - float(r[9]) / 100) for r in ins[1:]))},
        }


def phase_b56(A, keys, passports):
    for v, base in [("A", REGRESSION_A["rev_sum"]),
                    ("B", passports["B"]["layer"]["rev_sum"]),
                    ("C", passports["C"]["layer"]["rev_sum"])]:
        out = DS / f"variant_{v}"
        rng = random.Random(SEEDS[v] + 700)
        sheets, ctrl_rows, b5pass = build_b5(base / 12)
        save_workbook(out / "reference_b5.xlsx", sheets,
                      "Блок 5 — контрольные числа бюджета", ctrl_rows)
        if v == "A":
            safe_rows = [tuple(A["sales_hdr"])] + [tuple(r) for r in A["sales"]]
        else:
            wb = openpyxl.load_workbook(out / "sales_2025_safe.xlsx", read_only=True, data_only=True)
            safe_rows = [tuple(r) for r in wb["Сделки"].iter_rows(values_only=True)]
            wb.close()
        names = {c: f for c, f in keys[v]}
        d1, def1 = gen_dirty_final(rng, safe_rows, names)
        clean1, cl1 = clean_dirty_final(d1)
        h2 = [r for r in clean1[1:] if isinstance(r[0], date) and r[0].month >= 7]
        rev_h2 = sum((r[7] or 0) * r[8] * (1 - r[9] / 100) for r in h2)
        base6 = money(rev_h2 / 6)
        cost_fact = 1 - (passports[v]["layer"]["prof_sum"] / passports[v]["layer"]["rev_sum"])
        b6rows, net6b, cash6b, gap6b = budget_model(base6, 0.03, round(cost_fact, 4),
                                                    120000, 350000, 350000, 0.02, 0.06, 200000)
        _, net6c, cash6c, gap6c = budget_model(base6, 0.0, round(cost_fact + 0.03, 4),
                                               120000, 350000, 350000, 0.02, 0.06, 200000)
        scen6 = [("Сценарий", "Чистая прибыль за 6 мес", "Мин. остаток", "Месяц разрыва"),
                 ("Базовый (+3%/мес)", money(net6b), money(cash6b), gap6b or "—"),
                 ("Осторожный (0%)", money(net6c), money(cash6c), gap6c or "—")]
        # второй грязный файл: проверка переносимости плейбука — те же правила очистки,
        # но свои контрольные числа (иначе итоговый квиз не построить по обоим файлам)
        d2, _ = gen_dirty_final(random.Random(SEEDS[v] + 701), safe_rows, names)
        clean2, cl2 = clean_dirty_final(d2)
        h2b = [r for r in clean2[1:] if isinstance(r[0], date) and r[0].month >= 7]
        base6b = money(sum((r[7] or 0) * r[8] * (1 - r[9] / 100) for r in h2b) / 6)
        b6rows2, net6b2, cash6b2, gap6b2 = budget_model(base6b, 0.03, round(cost_fact, 4),
                                                        120000, 350000, 350000, 0.02, 0.06, 200000)
        _, net6c2, cash6c2, gap6c2 = budget_model(base6b, 0.0, round(cost_fact + 0.03, 4),
                                                  120000, 350000, 350000, 0.02, 0.06, 200000)
        scen6b = [("Сценарий", "Чистая прибыль за 6 мес", "Мин. остаток", "Месяц разрыва"),
                  ("Базовый (+3%/мес)", money(net6b2), money(cash6b2), gap6b2 or "—"),
                  ("Осторожный (0%)", money(net6c2), money(cash6c2), gap6c2 or "—")]
        b6_ctrl = [("Строк в sales_dirty до очистки", len(d1) - 1, ""),
                   ("Полных дублей удалено", cl1["dup_removed"], ""),
                   ("Дат исправлено (текст → дата)", cl1["dates_fixed"], ""),
                   ("Регионов нормализовано", cl1["regions_fixed"], ""),
                   ("Пропусков в «Количество» помечено", cl1["qty_flagged"], "нулями"),
                   ("Телефонов удалено (нулевой шаг)", cl1["phones"], ""),
                   ("Примечаний удалено", cl1["notes"], ""),
                   ("Строк после очистки", cl1["rows_after"], ""),
                   ("Сумма выручки после очистки", cl1["rev_after"], ""),
                   ("База мини-бюджета (ср. выручка H2)", base6, ""),
                   ("Доля себестоимости фактическая", round(cost_fact, 4), ""),
                   ("ЧП 6 мес: базовый", money(net6b), ""),
                   ("ЧП 6 мес: осторожный", money(net6c), ""),
                   ("", "", ""),
                   ("ФАЙЛ sales_dirty_2.xlsx", "", ""),
                   ("Строк в sales_dirty_2 до очистки", len(d2) - 1, ""),
                   ("Полных дублей удалено (файл 2)", cl2["dup_removed"], ""),
                   ("Дат исправлено (файл 2)", cl2["dates_fixed"], ""),
                   ("Регионов нормализовано (файл 2)", cl2["regions_fixed"], ""),
                   ("Пропусков в «Количество» помечено (файл 2)", cl2["qty_flagged"], "нулями"),
                   ("Телефонов удалено (файл 2)", cl2["phones"], ""),
                   ("Примечаний удалено (файл 2)", cl2["notes"], ""),
                   ("Строк после очистки (файл 2)", cl2["rows_after"], ""),
                   ("Сумма выручки после очистки (файл 2)", cl2["rev_after"], ""),
                   ("База мини-бюджета (файл 2)", base6b, ""),
                   ("ЧП 6 мес: базовый (файл 2)", money(net6b2), ""),
                   ("ЧП 6 мес: осторожный (файл 2)", money(net6c2), "")]
        save_workbook(out / "reference_b6.xlsx",
                      [("Очистка (эталон)", clean1), ("Мини-бюджет", b6rows), ("Сценарии", scen6),
                       ("Очистка 2 (эталон)", clean2), ("Мини-бюджет 2", b6rows2),
                       ("Сценарии 2", scen6b)],
                      "Блок 6 — контрольные числа финала", b6_ctrl)
        save_workbook(out / "sales_dirty.xlsx", [("Сделки", d1)])
        save_workbook(out / "sales_dirty_2.xlsx", [("Сделки", d2)])
        passports[v]["b5"] = b5pass
        passports[v]["b6"] = {"rows_before": len(d1) - 1, "dup_removed": cl1["dup_removed"],
                              "dates_fixed": cl1["dates_fixed"], "regions_fixed": cl1["regions_fixed"],
                              "rows_after": cl1["rows_after"], "rev_after": cl1["rev_after"],
                              "base6": base6, "net6_base": money(net6b), "net6_careful": money(net6c)}
        passports[v]["b6_2"] = {"rows_before": len(d2) - 1, "dup_removed": cl2["dup_removed"],
                                "dates_fixed": cl2["dates_fixed"],
                                "regions_fixed": cl2["regions_fixed"],
                                "rows_after": cl2["rows_after"], "rev_after": cl2["rev_after"],
                                "base6": base6b, "net6_base": money(net6b2),
                                "net6_careful": money(net6c2)}


# ------------------------------------------------------------------ verify
PHONE_RE = re.compile(r"\+7\s?\d{3}|8[\s(-]9\d{2}")
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.\w+")
PASSPORT_RE = re.compile(r"[Пп]аспорт")


def leaks(rows):
    p = e = n = 0
    for r in rows[1:]:
        for c in r:
            if isinstance(c, str):
                p += bool(PHONE_RE.search(c))
                e += bool(EMAIL_RE.search(c))
                n += bool(PASSPORT_RE.search(c))
    return p, e, n


def phase_verify(passports):
    problems = []
    for v in "ABC":
        out = DS / f"variant_{v}"
        for fname, expect in [("sales_2025_safe.xlsx", "clean"), ("insert_20rows_safe.xlsx", "clean"),
                              ("warmup.xlsx", "clean"), ("sales_2025.xlsx", "dirty"),
                              ("sales_dirty.xlsx", "dirty"), ("sales_dirty_2.xlsx", "dirty")]:
            f = out / fname
            if not f.exists():
                problems.append(f"{v}/{fname}: отсутствует")
                continue
            wb = openpyxl.load_workbook(f, read_only=True, data_only=True)
            rows = [tuple(r) for r in wb["Сделки"].iter_rows(values_only=True)]
            wb.close()
            p, e, n = leaks(rows)
            if expect == "clean" and (p or e or n):
                problems.append(f"{v}/{fname}: УТЕЧКА тел={p} почт={e} паспорт={n}")
            if expect == "dirty" and p < 50:
                problems.append(f"{v}/{fname}: телефонов {p} — вбросов нет?")
        if v != "A":
            for b in "b1", "b2", "b3", "b4", "b5", "b6":
                if not (out / f"reference_{b}.xlsx").exists():
                    problems.append(f"{v}/reference_{b}.xlsx: отсутствует")
        else:
            for b in "b5", "b6":
                if not (out / f"reference_{b}.xlsx").exists():
                    problems.append(f"A/reference_{b}.xlsx: отсутствует")
            for b, key_map in [("b1", {"Сумма «Выручка»": ("warmup", "rev"),
                                       "Сумма «Прибыль»": ("warmup", "prof")}),
                               ("b2", {"Сумма выручки (расчётная, не изменилась)": ("layer", "rev_sum")}),
                               ("b3", {"Сумма «Выручка»": ("layer", "rev_sum"),
                                       "Сумма «Прибыль»": ("layer", "prof_sum"),
                                       "Сумма «Бонус»": ("layer", "bonus_sum")})]:
                wb = openpyxl.load_workbook(COURSE / f"reference_{b}.xlsx", read_only=True, data_only=True)
                ctrl = {r[0]: r[1] for r in wb["Контроль"].iter_rows(values_only=True) if r[0]}
                wb.close()
                for label, (node_k, node_f) in key_map.items():
                    node = passports["A"][node_k][node_f]
                    if label in ctrl and abs(float(ctrl[label]) - float(node)) > 0.01:
                        problems.append(f"A/{b}: {label}: {ctrl[label]} ≠ {node}")
    return problems


# ------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("phase", choices=["A", "BC", "b56", "verify", "all"])
    args = ap.parse_args()
    A = load_variant_A()
    keys = load_keys()
    DS.mkdir(parents=True, exist_ok=True)
    passports_file = DS / "passports.json"
    passports = json.loads(passports_file.read_text(encoding="utf-8")) if passports_file.exists() else {}
    if args.phase in ("A", "all"):
        mism = calibrate(A)
        print("калибровка b3, несоответствий:", dict(mism) or "0 — правила верны")
        reg = phase_A(A, keys, passports)
        print("регрессия A:", reg or "OK — контрольные числа воспроизведены")
    if args.phase in ("BC", "all"):
        phase_BC(A, keys, passports)
        print("варианты B и C сгенерированы")
    if args.phase in ("b56", "all"):
        phase_b56(A, keys, passports)
        print("эталоны b5/b6 и грязные финалы готовы")
    if args.phase in ("verify", "all"):
        problems = phase_verify(passports)
        print("verify:", problems if problems else "OK — 0 проблем")
    passports_file.write_text(json.dumps(passports, ensure_ascii=False, indent=1, default=str),
                              encoding="utf-8")
    print("паспорт:", passports_file)


if __name__ == "__main__":
    main()
