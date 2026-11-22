#!/usr/bin/env python3
"""Учебные шаблоны студента для курса «ai-excel» (план V2, блок 2 и не только).

Создаёт `courses/ai-excel/templates/`:
  pasport_dannyh.xlsx    — паспорт данных (по колонкам выгрузки) + инструкция
  zhurnal_proverok.xlsx  — журнал проверок + журнал безопасности
  list_klyuch.xlsx       — лист-ключ «код ↔ ФИО» (хранится только локально)
  reglament_vygruzki.docx— регламент безопасной выгрузки на одну страницу
  README.md              — что к какому уроку, как заполнять

Нейтральность: без названий продуктов; «табличный редактор», «книга таблиц».
Имена учебных файлов (sales_2025.xlsx и т.п.) допустимы — студенту нужен точный адрес.

Запуск из корня harness:
  python tools/build_student_templates.py
"""
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "courses" / "ai-excel" / "templates"

ORANGE = "D97757"
INK = "1F1F1F"
SOFT = "FDF0EB"
GREY = "F4F4F2"
RED = "F6DCD6"

th = Side(style="thin", color="DCDCDC")
BORDER = Border(left=th, right=th, top=th, bottom=th)
HDR_FONT = Font(bold=True, color="FFFFFF", size=10, name="Segoe UI")
HDR_FILL = PatternFill("solid", fgColor=ORANGE)
TITLE_FONT = Font(bold=True, size=14, color=INK, name="Segoe UI")
NOTE_FONT = Font(italic=True, size=9, color="6B6B6B", name="Segoe UI")
BODY = Font(size=10, name="Segoe UI")
WRAP = Alignment(wrap_text=True, vertical="top")
CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)


def sheet_with_table(ws, title, note, header, rows, widths, extra_blank=25, warn=None):
    """Заголовок, примечание, шапка таблицы, примеры и пустые строки под заполнение."""
    ws["A1"] = title
    ws["A1"].font = TITLE_FONT
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(header))
    r = 2
    if note:
        ws.cell(row=r, column=1, value=note).font = NOTE_FONT
        ws.cell(row=r, column=1).alignment = WRAP
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=len(header))
        ws.row_dimensions[r].height = 30
        r += 1
    if warn:
        c = ws.cell(row=r, column=1, value=warn)
        c.font = Font(bold=True, size=10, color="8A2B1E", name="Segoe UI")
        c.fill = PatternFill("solid", fgColor=RED)
        c.alignment = WRAP
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=len(header))
        ws.row_dimensions[r].height = 30
        r += 1
    head_row = r
    for j, h in enumerate(header, 1):
        c = ws.cell(row=head_row, column=j, value=h)
        c.font, c.fill, c.border, c.alignment = HDR_FONT, HDR_FILL, BORDER, CENTER
    ws.row_dimensions[head_row].height = 34
    for i, row in enumerate(rows, head_row + 1):
        for j, v in enumerate(row, 1):
            c = ws.cell(row=i, column=j, value=v)
            c.font, c.border, c.alignment = BODY, BORDER, WRAP
    # пустые строки под заполнение
    last = head_row + len(rows) + extra_blank
    for i in range(head_row + len(rows) + 1, last + 1):
        for j in range(1, len(header) + 1):
            c = ws.cell(row=i, column=j, value=None)
            c.border, c.alignment = BORDER, WRAP
    for j, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(j)].width = w
    ws.freeze_panes = "A%d" % (head_row + 1)
    ws.auto_filter.ref = "A%d:%s%d" % (head_row, get_column_letter(len(header)),
                                       head_row + len(rows) + extra_blank)
    return last


def new_wb():
    wb = Workbook()
    wb.remove(wb.active)
    return wb


# ---------------------------------------------------------------- паспорт данных
def pasport(path):
    wb = new_wb()
    ws = wb.create_sheet("Паспорт данных")
    ws.sheet_properties.tabColor = ORANGE
    header = ["№", "Колонка в файле", "Пример значения", "Тип данных",
              "Чувствительность", "Что делаем до загрузки агенту",
              "Метка после очистки", "Комментарий"]
    rows = [
        [1, "Сделка", "SD-000123", "номер", "рабочая", "оставить", "SD-000123",
         "уникальный ключ строки, проверять на дубли"],
        [2, "Клиент", "ООО «Ромашка»", "текст", "коммерческая тайна",
         "обобщить: оставить тип клиента", "Юрлицо", "название клиента агенту не нужно"],
        [3, "Телефон", "+7 900 000-00-00", "контакт", "персональные данные",
         "удалить колонку целиком", "—", "поиск после очистки должен дать 0"],
        [4, "Менеджер", "Иванова Анна", "ФИО", "персональные данные",
         "заменить кодом по локальному ключу", "М1", "расшифровка — только в листе-ключе"],
        [5, "Выручка", "128 400,00", "число", "рабочая", "оставить", "128 400,00",
         "контрольная сумма до и после очистки должна совпасть"],
    ]
    last = sheet_with_table(
        ws, "Паспорт данных выгрузки",
        "Заполняется ДО загрузки файла агенту. Одна колонка — одна строка. Если не знаете, "
        "что внутри колонки, считайте её чувствительной, пока не доказано обратное.",
        header, rows, [5, 22, 26, 14, 22, 30, 18, 40])
    ws.cell(row=last + 2, column=1,
            value="Контроль: число строк в файле ______ · сумма выручки до ______ · после ______ · "
                  "найдено телефонов/почт ______ (должно быть 0)").font = NOTE_FONT
    ws.merge_cells(start_row=last + 2, start_column=1, end_row=last + 2,
                   end_column=len(header))

    ws2 = wb.create_sheet("Как заполнять")
    ws2.sheet_properties.tabColor = "6B8E9B"
    steps = [
        ["1", "Откройте файл целиком", "Все листы, включая скрытые; шапки, примечания, выпадающие списки."],
        ["2", "Перечислите колонки", "По одной строке на колонку, в том порядке, как в файле."],
        ["3", "Определите чувствительность", "Персональные данные / коммерческая тайна / рабочая информация."],
        ["4", "Решите судьбу колонки", "Оставить · обезличить · обобщить · удалить. Правило: агенту уходит минимум."],
        ["5", "Запишите метку", "То, что будет в очищенном файле: код М1, «Юрлицо», «—» (удалено)."],
        ["6", "Сверьте суммы", "Число строк и контрольные суммы до и после очистки не должны измениться."],
        ["7", "Проверьте поиском", "Поиск по телефонам, почтам, ФИО в очищенном файле должен дать 0."],
    ]
    sheet_with_table(ws2, "Порядок заполнения (нулевой шаг)", None,
                     ["Шаг", "Что сделать", "Как именно"], steps, [6, 30, 90], extra_blank=0)
    wb.save(path)


# ---------------------------------------------------------------- журналы
def zhurnaly(path):
    wb = new_wb()
    ws = wb.create_sheet("Журнал проверок")
    ws.sheet_properties.tabColor = ORANGE
    header = ["№", "Дата", "Файл / лист", "Столбец", "Запрос агенту (КЗФП, коротко)",
              "Сумма от агента", "Моя проверка", "Расхождение", "Сошлось?",
              "Что исправил", "Рекламация отправлена", "Статус"]
    rows = [
        [1, "12.01.2026", "sales_2025_safe_v2.xlsx / Сделки", "Выручка",
         "Выручка = Количество × Цена × (1 − Скидка/100), покажи сумму",
         "27 915 616,50", "калькулятор, 3 строки + сумма столбца", "0", "да",
         "—", "—", "принято"],
        [2, "12.01.2026", "sales_2025_safe_v2.xlsx / Сделки", "Бонус",
         "Бонус = Выручка × ставка менеджера, округление до копеек",
         "866 106,94", "пересчёт другим способом", "0,96", "нет",
         "округление до суммирования вместо после", "да", "исправлено"],
        [3, "", "", "", "", "", "", "", "", "", "", ""],
    ]
    sheet_with_table(
        ws, "Журнал проверок",
        "Одна строка — одна проверка. «Сошлось? = нет» — обязательный повод для рекламации: "
        "«В столбце X строки N–M ожидалось …, получилось …. Исправь и покажи, что изменил».",
        header, rows, [5, 12, 30, 16, 40, 16, 28, 12, 10, 30, 18, 12])

    ws2 = wb.create_sheet("Журнал безопасности")
    ws2.sheet_properties.tabColor = "B08968"
    header2 = ["№", "Дата", "Файл", "Что нашли (тип данных)", "Где (лист / колонка)",
               "Что сделали", "Строк затронуто", "Выручка ДО", "Выручка ПОСЛЕ",
               "Расхождение", "Проверил"]
    rows2 = [
        [1, "10.01.2026", "sales_2025.xlsx", "телефоны клиентов", "Лист «Сделки», колонка «Телефон»",
         "колонка удалена", 731, "27 915 616,50", "27 915 616,50", "0", "самопроверка"],
        [2, "10.01.2026", "sales_2025.xlsx", "ФИО менеджеров", "Лист «Сделки», колонка «Менеджер»",
         "заменено кодами М1–М6 по локальному ключу", 1800, "27 915 616,50", "27 915 616,50",
         "0", "самопроверка"],
        [3, "", "", "", "", "", "", "", "", "", ""],
    ]
    sheet_with_table(
        ws2, "Журнал безопасности (нулевой шаг)",
        "Заполняется ПЕРЕД загрузкой файла агенту. Сумма «до» и «после» должна совпасть: "
        "очистка не имеет права менять цифры, только персональные данные.",
        header2, rows2, [5, 12, 26, 26, 30, 34, 14, 16, 16, 12, 14])
    wb.save(path)


# ---------------------------------------------------------------- лист-ключ
def klyuch(path):
    wb = new_wb()
    ws = wb.create_sheet("Ключ")
    ws.sheet_properties.tabColor = "8A9A5B"
    header = ["Код", "ФИО", "Должность / роль", "Категория", "Дата присвоения", "Примечание"]
    rows = [
        ["М1", "Иванова Анна", "менеджер по продажам", "ключевой", "10.01.2026", "пример заполнения"],
        ["М2", "", "", "", "", ""],
        ["М3", "", "", "", "", ""],
        ["М4", "", "", "", "", ""],
        ["М5", "", "", "", "", ""],
        ["М6", "", "", "", "", ""],
    ]
    last = sheet_with_table(
        ws, "Лист-ключ «код ↔ ФИО»",
        "Единственное место, где хранится расшифровка кодов. Работает только локально: файл "
        "не загружается агенту, не сдаётся в портфель и не попадает на скриншоты.",
        header, rows, [10, 30, 26, 18, 16, 36], extra_blank=4,
        warn="НЕ ЗАГРУЖАТЬ АГЕНТУ · НЕ СДАВАТЬ В ПОРТФЕЛЬ · НЕ ПОКАЗЫВАТЬ В КАДРЕ")
    ws.cell(row=last + 2, column=1,
            value="Если ключ попал к агенту или в портфель — обезличивание обнулено: "
                  "сдайте работу заново с новым ключом.").font = NOTE_FONT
    ws.merge_cells(start_row=last + 2, start_column=1, end_row=last + 2, end_column=len(header))
    wb.save(path)


# ---------------------------------------------------------------- регламент
def reglament(path):
    from docx import Document
    from docx.shared import Pt, Cm

    doc = Document()
    st = doc.styles["Normal"]
    st.font.name = "Segoe UI"
    st.font.size = Pt(10)

    doc.add_heading("Регламент безопасной выгрузки", level=1)
    p = doc.add_paragraph("Одна страница. Заполните поля и держите рядом, когда работаете с агентом.")
    p.runs[0].italic = True

    doc.add_heading("1. Что я выгружаю агенту", level=2)
    t = doc.add_table(rows=4, cols=3)
    t.style = "Table Grid"
    hdr = ["Файл", "Зачем агенту", "Что удалено до загрузки"]
    for j, h in enumerate(hdr):
        t.cell(0, j).text = h
    for i in range(1, 4):
        t.cell(i, 0).text = ""

    doc.add_heading("2. Правило нулевого шага (до загрузки)", level=2)
    steps = [
        "Осмотрел файл целиком: все листы, скрытые листы, шапки, примечания.",
        "Заполнил паспорт данных: одна колонка — одна метка чувствительности.",
        "Удалил персональные данные: ФИО, телефоны, почты, адреса, паспортные примечания.",
        "Заменил имена кодами по локальному листу-ключу (ключ остаётся у меня).",
        "Убрал лишние колонки: агенту уходит минимум, нужный для задачи.",
        "Сверил число строк и контрольные суммы: цифры не изменились.",
        "Проверил поиском: телефонов, почт и ФИО в файле нет (0 находок).",
    ]
    for s in steps:
        doc.add_paragraph("☐  " + s)

    doc.add_heading("3. Что не уходит агенту никогда", level=2)
    for s in ["Лист-ключ «код ↔ ФИО» и любая расшифровка кодов.",
              "Персональные данные клиентов и сотрудников в любом виде.",
              "Файлы с пометкой «коммерческая тайна», если это не согласовано с руководителем.",
              "Скриншоты, где видны имена, телефоны или суммы по конкретным клиентам."]:
        doc.add_paragraph(s, style="List Bullet")

    doc.add_heading("4. Настройки платформы, которые я проверил", level=2)
    for s in ["Режим «агент» (исполнитель делает действия, а не только отвечает текстом).",
              "Доступ к папке: чтение и запись, только моя рабочая папка.",
              "Хранение и обучение на моих файлах отключено (или согласовано).",
              "История диалога очищается по завершении работы."]:
        doc.add_paragraph("☐  " + s)

    doc.add_heading("5. Ответственный", level=2)
    doc.add_paragraph("Регламент составил: ______________________   Дата: ____________")
    doc.add_paragraph("Проверил руководитель: ______________________   Дата: ____________")

    sec = doc.sections[0]
    sec.top_margin = sec.bottom_margin = Cm(1.6)
    sec.left_margin = sec.right_margin = Cm(1.8)
    doc.save(path)


README = """# Шаблоны студента (курс «Табличный редактор текстом»)

Раздаются вместе с датасетами; студент заполняет свои копии. Все шаблоны — учебные:
примеры внутри уже заполнены по варианту A, их нужно заменить своими данными.

| Файл | Когда нужен | Что внутри |
|---|---|---|
| `pasport_dannyh.xlsx` | урок 2, повторяется в уроках 6 и 8 | паспорт данных по колонкам выгрузки: тип, чувствительность, что делаем до загрузки агенту, метка после очистки; лист «Как заполнять» |
| `zhurnal_proverok.xlsx` | уроки 3–9 | «Журнал проверок» (столбец → сумма агента → своя проверка → рекламация) и «Журнал безопасности» (что нашли, что удалили, суммы до и после) |
| `list_klyuch.xlsx` | урок 2 | лист-ключ «код ↔ ФИО». Хранится только локально: агенту не загружается, в портфель не сдаётся |
| `reglament_vygruzki.docx` | урок 2, сдаётся в портфель | регламент безопасной выгрузки на одну страницу: что выгружаю, нулевой шаг, что не уходит агенту, настройки платформы, подписи |

## Правила работы с шаблонами

1. Копируйте шаблон в свою рабочую папку, исходник не меняйте.
2. Заполняйте по ходу урока, а не после: журнал проверок — это доказательство работы.
3. Числа в примерах — варианта A. Свои контрольные числа берите из `datasets/passports.json`.
4. Лист-ключ не покидает ваш компьютер: ни агенту, ни в чат, ни в портфель.
5. Портфельные артефакты курса: регламент выгрузки + паспорт данных + чистый файл (урок 2),
   журнал проверок с рекламацией (урок 3), живой отчёт (урок 6), бюджет (урок 7),
   сценарии (урок 8), итоговая цепочка + журнал безопасности (урок 9).
"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    pasport(OUT / "pasport_dannyh.xlsx")
    zhurnaly(OUT / "zhurnal_proverok.xlsx")
    klyuch(OUT / "list_klyuch.xlsx")
    reglament(OUT / "reglament_vygruzki.docx")
    (OUT / "README.md").write_text(README, encoding="utf-8")
    for f in sorted(OUT.iterdir()):
        print("  %-26s %7.1f КБ" % (f.name, f.stat().st_size / 1024))
    print("шаблоны: %s" % OUT)


if __name__ == "__main__":
    try:
        main()
    except ImportError as e:
        sys.exit("нет зависимости: %s (нужен системный Python 3.10 с openpyxl и python-docx)" % e)
