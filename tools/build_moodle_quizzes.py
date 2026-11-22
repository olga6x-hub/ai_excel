#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_moodle_quizzes.py — сборка банка вопросов курса ai-excel в формате Moodle XML.

Что делает:
  1) читает courses/ai-excel/datasets/passports.json (контрольные числа вариантов A/B/C);
  2) читает courses/ai-excel/assessments/numeric_items.json (вариант-специфичные вопросы:
     числовые, короткий ответ, calculated с рандомизацией);
  3) читает courses/ai-excel/assessments/items_situational_b*.json (общие ситуационные);
  4) выдаёт XML-файлы банка вопросов в courses/ai-excel/assessments/moodle/:
       ai-excel_bank_variant_A.xml / _B / _C  — числовые по вариантам (категории «Блок N / Вариант X»)
       ai-excel_bank_common.xml               — ситуационные (категории «Блок N / Общие»)
  5) проверяет: сумма баллов по блокам, точность ключей, well-formedness XML,
     отсутствие запрещённых слов («Excel», бренды).

Допуск числового ответа: ±0,5% (план V2, строка 33) — НО для счётчиков
(строки, коды, колонки) допуск 0: количество строк либо точное, либо нет.

Calculated-вопросы (блок 6) используют относительный допуск 0,5% и 10 наборов
значений переменных, сгенерированных детерминированно (seed от id вопроса).

Запуск:
  python tools/build_moodle_quizzes.py            # собрать всё
  python tools/build_moodle_quizzes.py --check    # только проверки, без записи
"""
from __future__ import annotations

import argparse
import html as html_mod
import json
import random
import re
import sys
import xml.dom.minidom
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "courses" / "ai-excel"
ASSES = COURSE / "assessments"
OUT = ASSES / "moodle"

COURSE_TITLE = "Табличный редактор текстом: агент вместо формул"
PASS_PCT = {1: 70, 2: 80, 3: 70, 4: 70, 5: 70, 6: 70}
# единицы, где допуск должен быть нулевым (счётчики)
EXACT_UNITS = {"строк", "кодов", "колонок", "месяц"}
TOLERANCE_PCT = 0.005
FORBIDDEN = re.compile(r"\bExcel\b|ChatGPT|OpenAI|Google Sheets|Яндекс|Microsoft", re.I)

# ожидаемые баллы по блупринту (вариант-специфичная часть: numerical + shortanswer + calculated)
EXPECTED_POINTS = {1: 6, 2: 8, 3: 16, 4: 16, 5: 18, 6: 20}


# --------------------------------------------------------------- утилиты XML
def esc(s: str) -> str:
    return html_mod.escape(str(s), quote=True)


# ------------------------------------------------------- форматирование чисел
# E-1: ответы и feedback — полными десятичными числами без экспоненты.
# Значения passports.json не трогаем, форматируем только при выводе.
from decimal import Decimal, ROUND_HALF_UP  # noqa: E402


def _q2(value) -> Decimal:
    """Округление до копейки half-up (как в табличных редакторах)."""
    return Decimal(repr(float(value))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def fmt_decimal(value) -> str:
    """Полное десятичное число без экспоненты: 5742912.5; целое — без дробной части."""
    s = format(_q2(value), "f")
    if s.endswith(".00"):
        return s[:-3]
    intpart, _, frac = s.partition(".")
    return intpart + "." + frac.rstrip("0")


def fmt_ru(value) -> str:
    """Русский формат: разряды-пробелы, запятая; есть копейки — 2 знака, нет — без."""
    s = format(_q2(value), "f")
    if s.endswith(".00"):
        s = s[:-3]
    intpart, _, frac = s.partition(".")
    out = "{:,}".format(int(intpart)).replace(",", " ")
    if intpart.startswith("-") and int(intpart) == 0:
        out = "-" + out  # не терять минус у -0,x
    return out + ("," + frac if frac else "")


# E-2: единая честная формулировка допуска для денежных числовых вопросов
# (у процентных — своя корректная формулировка «два знака после запятой», её не трогаем).
_PHRASES = [
    (r"Введите число в рублях с точностью до копеек(\s*\(разделитель — точка\))?",
     "Введите сумму в рублях (разделитель — точка). Ответ принимается с допуском ±0,5% от эталона."),
    (r"Ответ введите в рублях с точностью до копеек",
     "Ответ введите в рублях (разделитель — точка); принимается с допуском ±0,5% от эталона."),
    (r"в рублях с точностью до копеек",
     "в рублях (разделитель — точка); ответ принимается с допуском ±0,5% от эталона."),
]


def fix_prompt(prompt: str) -> str:
    for pat, rep in _PHRASES:
        prompt = re.sub(pat, rep, prompt)
    return prompt.replace("..", ".")


def cdata(s: str) -> str:
    return "<![CDATA[%s]]>" % s


def para(s: str) -> str:
    return "<p>%s</p>" % html_mod.escape(str(s))


def dig(path: str, node):
    """Доступ по пути 'a.b.c'; суффикс '@0' — первое значение словаря/списка."""
    cur = node
    for part in path.split("."):
        idx = None
        if "@" in part:
            part, _, n = part.partition("@")
            idx = int(n)
        if not isinstance(cur, dict) or part not in cur:
            raise KeyError(f"в паспорте нет пути '{path}' (остановился на '{part}')")
        cur = cur[part]
        if idx is not None:
            if isinstance(cur, dict):
                cur = list(cur.values())[idx]
            elif isinstance(cur, list):
                cur = cur[idx]
            else:
                raise TypeError(f"'{path}': нельзя взять элемент @{idx} из {type(cur).__name__}")
    return cur


# --------------------------------------------------------------- типы вопросов
def q_category(text: str, info: str, idnumber: str) -> List[str]:
    return ['  <question type="category">',
            "    <category><text>%s</text></category>" % esc(text),
            '    <info format="html"><text>%s</text></info>' % cdata(para(info)),
            "    <idnumber>%s</idnumber>" % esc(idnumber),
            "  </question>"]


def _head(qtype: str, name: str, stem_html: str, gen_html: str, points: float,
          idnumber: str) -> List[str]:
    return ['  <question type="%s">' % qtype,
            "    <name><text>%s</text></name>" % esc(name),
            '    <questiontext format="html"><text>%s</text></questiontext>' % cdata(stem_html),
            '    <generalfeedback format="html"><text>%s</text></generalfeedback>' % cdata(gen_html),
            "    <defaultgrade>%s</defaultgrade>" % ("%.7f" % points),
            "    <penalty>0</penalty>",
            "    <hidden>0</hidden>",
            "    <idnumber>%s</idnumber>" % esc(idnumber)]


def q_numerical(item: Dict, value, unit: str, variant: str) -> List[str]:
    exact = unit in EXACT_UNITS
    tol = 0.0 if exact else round(abs(float(value)) * TOLERANCE_PCT, 6)
    prompt = item["prompt"] if exact else fix_prompt(item["prompt"])
    stem = para(prompt)
    gen = para("Подсказка: " + item["hint"]) if item.get("hint") else ""
    out = _head("numerical", f'{item["id"]}-{variant}. {item["prompt"][:60]}',
                stem, gen, item["points"], f'ax-{variant.lower()}-{item["id"]}')
    txt = fmt_decimal(value) if not exact else str(int(value))
    ref = txt if exact else fmt_ru(value)
    out += ['    <answer fraction="100" format="plain_text">',
            "      <text>%s</text>" % esc(txt),
            "      <tolerance>%s</tolerance>" % ("%g" % tol),
            '      <feedback format="html"><text>%s</text></feedback>' % cdata(
                para("Верно. Эталонное значение — %s %s; допуск %s."
                     % (ref, unit, "±0,5%" if not exact else "точное совпадение"))),
            "    </answer>",
            '    <units/>',
            "  </question>"]
    return out


def q_shortanswer(item: Dict, value, variant: str) -> List[str]:
    stem = para(item["prompt"])
    gen = para("Подсказка: " + item["hint"]) if item.get("hint") else ""
    out = _head("shortanswer", f'{item["id"]}-{variant}. {item["prompt"][:60]}',
                stem, gen, item["points"], f'ax-{variant.lower()}-{item["id"]}')
    out += ["    <usecase>0</usecase>",
            '    <answer fraction="100" format="plain_text">',
            "      <text>%s</text>" % esc(str(value)),
            '      <feedback format="html"><text>%s</text></feedback>' % cdata(
                para("Верно: точка кассового разрыва — %s." % value)),
            "    </answer>",
            "  </question>"]
    return out


def q_calculated(item: Dict, variant: str) -> List[str]:
    """Calculated-вопрос Moodle: переменные {x} в тексте, формула ответа, датасет."""
    rnd = random.Random("ax-" + item["id"])
    names = list(item["vars"].keys())
    count = int(item["vars"][names[0]].get("count", 10))
    stems = [para(fix_prompt(item["prompt"]))]
    gen = para("Подсказка: " + item["hint"]) if item.get("hint") else ""
    out = _head("calculated", f'{item["id"]}-{variant}. Расчётный вопрос (числа у каждого свои)',
                "".join(stems), gen, item["points"], f'ax-{variant.lower()}-{item["id"]}')
    out += ["    <unitgradingtype>0</unitgradingtype>",
            "    <unitpenalty>0.1000000</unitpenalty>",
            "    <showunits>0</showunits>",
            "    <unitsleft>0</unitsleft>",
            '    <answer fraction="100">',
            "      <text>%s</text>" % esc(item["formula"]),
            "      <tolerance>%s</tolerance>" % ("%g" % TOLERANCE_PCT),
            "      <tolerancetype>1</tolerancetype>",
            "      <correctanswerformat>1</correctanswerformat>",
            "      <correctanswerlength>2</correctanswerlength>",
            '      <feedback format="html"><text>%s</text></feedback>' % cdata(
                para("Верно. Формула: %s. Допуск ±0,5%% — как во всех числовых вопросах курса."
                     % item["formula"])),
            "    </answer>"]
    for name in names:
        cfg = item["vars"][name]
        lo, hi = float(cfg["min"]), float(cfg["max"])
        dec = int(cfg.get("decimals", 0))
        out += ["    <dataset_definition>",
                '      <status><text>private</text></status>',
                "      <name><text>%s</text></name>" % esc(name),
                "      <type>calculated</type>",
                '      <distribution><text>uniform</text></distribution>',
                "      <minimum><text>%s</text></minimum>" % fmt_decimal(lo),
                "      <maximum><text>%s</text></maximum>" % fmt_decimal(hi),
                "      <decimals><text>%d</text></decimals>" % dec,
                "      <itemcount>%d</itemcount>" % count,
                "      <dataset_items>"]
        for n in range(1, count + 1):
            if dec == 0:
                val = str(rnd.randint(int(lo), int(hi)))
            else:
                val = "%.*f" % (dec, rnd.uniform(lo, hi))
            out += ["        <dataset_item>",
                    "          <number>%d</number>" % n,
                    "          <value>%s</value>" % val,
                    "        </dataset_item>"]
        out += ["      </dataset_items>",
                "    </dataset_definition>"]
    out.append("  </question>")
    return out


def q_multichoice(item: Dict) -> List[str]:
    opts = item["options"]
    right = [o for o in opts if o.get("correct")]
    multi = item.get("type") == "multianswer" or not item.get("single", True)
    if not right:
        raise ValueError(f'{item["id"]}: нет правильного ответа')
    if not multi and len(right) != 1:
        raise ValueError(f'{item["id"]}: multichoice single=true, но верных {len(right)}')
    n_ok, n_bad = len(right), len(opts) - len(right)
    why_all = " ".join("«%s» — %s" % (o["text"], o.get("feedback", "")) for o in right)
    stem = para(item["prompt"])
    if multi and item.get("select_count"):
        stem += para("Отметьте все подходящие варианты (верных: %d)." % item["select_count"])
    out = _head("multichoice", f'{item["id"]}. {item["prompt"][:60]}', stem, "",
                item.get("points", 1), f'ax-common-{item["id"]}')
    out += ["    <single>%s</single>" % ("false" if multi else "true"),
            "    <shuffleanswers>%s</shuffleanswers>" % ("true" if item.get("shuffle", True) else "false"),
            "    <answernumbering>abc</answernumbering>",
            "    <showstandardinstruction>%d</showstandardinstruction>" % (1 if multi else 0),
            '    <correctfeedback format="html"><text>%s</text></correctfeedback>' % cdata(
                para("Верно." if not multi else "Верно: отмечены все подходящие варианты и ничего лишнего.")),
            '    <partiallycorrectfeedback format="html"><text>%s</text></partiallycorrectfeedback>' % cdata(
                para("Частично верно. " + why_all) if multi else ""),
            '    <incorrectfeedback format="html"><text>%s</text></incorrectfeedback>' % cdata(
                para(("Подходят такие варианты: " if len(right) > 1 else "Верный ответ: ") + why_all)),
            "    <shownumcorrect/>"]
    for o in opts:
        if o.get("correct"):
            fr = 100.0 if not multi else round(100.0 / n_ok, 5)
        else:
            fr = 0.0 if not multi else (-round(100.0 / n_ok, 5) if n_bad else 0.0)
        fr_s = ("%.5f" % fr).rstrip("0").rstrip(".")
        out += ['    <answer fraction="%s" format="html">' % fr_s,
                "      <text>%s</text>" % cdata(para(o["text"])),
                '      <feedback format="html"><text>%s</text></feedback>' % cdata(
                    para(o.get("feedback", ""))),
                "    </answer>"]
    out.append("  </question>")
    return out


def q_truefalse(item: Dict) -> List[str]:
    opts = item["options"]
    right = [o for o in opts if o.get("correct")]
    if len(right) != 1 or len(opts) != 2:
        raise ValueError(f'{item["id"]}: truefalse требует ровно 2 варианта и 1 верный')
    ans_true = right[0]["text"].strip().lower().startswith("верн")
    out = _head("truefalse", f'{item["id"]}. {item["prompt"][:60]}',
                para(item["prompt"]), "", item.get("points", 1), f'ax-common-{item["id"]}')
    out += ['    <answer fraction="%s" format="plain_text">' % ("100" if ans_true else "0"),
            "      <text>true</text>",
            '      <feedback format="html"><text>%s</text></feedback>' % cdata(
                para(_tf_feedback(opts, True))),
            "    </answer>",
            '    <answer fraction="%s" format="plain_text">' % ("0" if ans_true else "100"),
            "      <text>false</text>",
            '      <feedback format="html"><text>%s</text></feedback>' % cdata(
                para(_tf_feedback(opts, False))),
            "    </answer>",
            "  </question>"]
    return out


def _tf_feedback(opts, is_true: bool) -> str:
    want = "верн" if is_true else "неверн"
    for o in opts:
        if o["text"].strip().lower().startswith(want):
            return o.get("feedback", "")
    return ""


# ------------------------------------------------------------------ сборка
def build_variant_xml(variant: str, items: List[Dict], passports: Dict) -> str:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', "<quiz>"]
    p = passports[variant]
    by_block: Dict[int, List[Dict]] = {}
    for it in items:
        by_block.setdefault(int(it["block"]), []).append(it)
    for block in sorted(by_block):
        lines += q_category(
            "$course$/top/%s/Блок %d/Вариант %s" % (COURSE_TITLE, block, variant),
            "Квиз блока %d, вариант %s. Числовые вопросы по контрольным суммам датасета. "
            "Проходной балл %d%%. Попытки не ограничены, берётся высшая оценка. "
            "Источник чисел: datasets/passports.json." % (block, variant, PASS_PCT.get(block, 70)),
            "ax-b%d-%s" % (block, variant.lower()))
        for it in by_block[block]:
            t = it["type"]
            if t == "numerical":
                val = dig(it["key_path"], p)
                lines += q_numerical(it, val, it.get("unit", ""), variant)
            elif t == "shortanswer":
                lines += q_shortanswer(it, dig(it["key_path"], p), variant)
            elif t == "calculated":
                lines += q_calculated(it, variant)
            else:
                raise ValueError(f'{it["id"]}: неизвестный тип {t}')
    lines.append("</quiz>")
    return "\n".join(lines) + "\n"


def build_common_xml(groups: List[Dict]) -> str:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', "<quiz>"]
    for grp in groups:
        block = int(grp["block"])
        lines += q_category(
            "$course$/top/%s/Блок %d/Общие" % (COURSE_TITLE, block),
            "Ситуационные вопросы блока %d — общие для всех трёх вариантов датасета. "
            "Порядок вопросов и вариантов ответа перемешивается. Проходной балл %d%%."
            % (block, PASS_PCT.get(block, 70)),
            "ax-b%d-common" % block)
        for it in grp.get("items", []):
            t = it.get("type")
            if t == "truefalse":
                lines += q_truefalse(it)
            elif t in ("multichoice", "multianswer"):
                lines += q_multichoice(it)
            else:
                raise ValueError(f'{it.get("id")}: неизвестный тип {t}')
    lines.append("</quiz>")
    return "\n".join(lines) + "\n"


# ------------------------------------------------------------------ проверки
def check_forbidden(text: str, where: str, problems: List[str]):
    for m in FORBIDDEN.finditer(text):
        problems.append(f"{where}: запрещённое слово «{m.group(0)}»")


def validate(xml_text: str, label: str, problems: List[str]):
    try:
        xml.dom.minidom.parseString(xml_text)
    except Exception as e:  # noqa: BLE001
        problems.append(f"{label}: XML невалиден — {e}")
    check_forbidden(xml_text, label, problems)


def points_report(items: List[Dict], situ: List[Dict]) -> Dict[int, Dict[str, float]]:
    rep: Dict[int, Dict[str, float]] = {}
    for it in items:
        b = int(it["block"])
        d = rep.setdefault(b, {"variant": 0.0, "count": 0})
        d["variant"] += float(it["points"])
        d["count"] += 1
    for grp in situ:
        b = int(grp["block"])
        d = rep.setdefault(b, {"variant": 0.0, "count": 0})
        d["common"] = d.get("common", 0.0)
        for it in grp.get("items", []):
            d["common"] += float(it.get("points", 1))
            d["count"] += 1
    return rep


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="только проверки, файлы не писать")
    args = ap.parse_args(argv)

    passports = json.loads((COURSE / "datasets" / "passports.json").read_text(encoding="utf-8"))
    numeric = json.loads((ASSES / "numeric_items.json").read_text(encoding="utf-8"))["items"]

    situ: List[Dict] = []
    for f in sorted(ASSES.glob("items_situational_*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        situ.extend(data if isinstance(data, list) else [data])
    situ.sort(key=lambda g: int(g["block"]))

    problems: List[str] = []

    # ключи должны находиться во ВСЕХ вариантах
    for it in numeric:
        if it["type"] in ("numerical", "shortanswer"):
            for v in "ABC":
                try:
                    val = dig(it["key_path"], passports[v])
                    if val is None or val == "":
                        problems.append(f'{it["id"]}/{v}: пустое значение')
                except Exception as e:  # noqa: BLE001
                    problems.append(f'{it["id"]}/{v}: {e}')

    # баллы вариант-специфичной части против блупринта
    rep = points_report(numeric, situ)
    for b, exp in EXPECTED_POINTS.items():
        got = rep.get(b, {}).get("variant", 0)
        if abs(got - exp) > 1e-6:
            problems.append(f"блок {b}: вариант-специфичных баллов {got:g}, по блупринту {exp:g}")

    # ситуационные: структура
    n_situ = sum(len(g.get("items", [])) for g in situ)
    for grp in situ:
        for it in grp.get("items", []):
            if not it.get("prompt") or not it.get("options"):
                problems.append(f'{it.get("id")}: нет prompt/options')
            if not it.get("source"):
                problems.append(f'{it.get("id")}: нет поля source (требуется проверяемость)')
            if not any(o.get("correct") for o in it.get("options", [])):
                problems.append(f'{it.get("id")}: нет правильного ответа')
            for o in it.get("options", []):
                if not o.get("feedback"):
                    problems.append(f'{it.get("id")}: вариант без feedback')
                if not o.get("correct") and not o.get("misconception"):
                    problems.append(f'{it.get("id")}: неверный вариант без misconception')

    # сборка XML
    OUT.mkdir(parents=True, exist_ok=True)
    written = []
    for v in "ABC":
        xml_text = build_variant_xml(v, numeric, passports)
        label = f"вариант {v}"
        validate(xml_text, label, problems)
        if not args.check:
            path = OUT / f"ai-excel_bank_variant_{v}.xml"
            path.write_text(xml_text, encoding="utf-8")
            written.append(path)
    if situ:
        common = build_common_xml(situ)
        validate(common, "общие ситуационные", problems)
        if not args.check:
            path = OUT / "ai-excel_bank_common.xml"
            path.write_text(common, encoding="utf-8")
            written.append(path)

    print("=== состав банка ===")
    print(f"вариант-специфичных вопросов: {len(numeric)} "
          f"(numerical {sum(1 for i in numeric if i['type']=='numerical')}, "
          f"shortanswer {sum(1 for i in numeric if i['type']=='shortanswer')}, "
          f"calculated {sum(1 for i in numeric if i['type']=='calculated')})")
    print(f"ситуационных (общих): {n_situ}")
    for b in sorted(rep):
        d = rep[b]
        print(f"  блок {b}: вариант {d.get('variant',0):g} балл(ов), "
              f"общие {d.get('common',0):g}, вопросов {int(d['count'])}, "
              f"итого на вариант {d.get('variant',0)+d.get('common',0):g}")
    tot = sum(d.get("variant", 0) + d.get("common", 0) for d in rep.values())
    print(f"ИТОГО баллов на один вариант: {tot:g} (блупринт: 114)")
    if abs(tot - 114) > 1e-6:
        problems.append(f"сумма баллов на вариант {tot:g} ≠ 114 по блупринту")

    if written:
        print("\nзаписано файлов:")
        for p in written:
            print(f"  {p} ({p.stat().st_size:,} байт)")
    if problems:
        print(f"\nПРОБЛЕМ ({len(problems)}):")
        for x in problems[:40]:
            print("  -", x)
        return 1
    print("\nпроверки: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
