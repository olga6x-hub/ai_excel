#!/usr/bin/env python3
"""Сборка доставки курса «ai-excel» (courses/ai-excel) для ручной загрузки в Moodle.

Образец: tools/build_office_course.py (курс ai-office). Уроки упаковываются в SCORM 1.2
(tools/build_scorm_packages.py), квизы остаются нативными (Moodle XML), задания — элементом
«Задание», датасеты — файловым ресурсом.

Что делает:
  1. Пересоздаёт courses/ai-excel/dist/ с нуля (старое сносит).
  2. dist/preview/lessons/<slug>/: preview.html каждого из 9 уроков + mp3 + card.md + все
     локальные файлы, на которые preview.html ссылается src=/href= (пути сохраняются).
  2b. dist/scorm/ai-excel-lesson-NN.zip: те же уроки как пакеты SCORM 1.2 (build_scorm_packages.py).
  3. dist/questions/: копия всех XML из assessments/moodle/.
  4. dist/datasets/: полная копия datasets/ (variant_A/B/C + passports.json) + README.md.
  5. dist/import-table.csv по схеме образца: 9 страниц уроков, 18 строк квизов
     (6 блоков × 3 варианта), 9 элементов «Задание» под портфельные артефакты.
  6. dist/README_delivery.md — что где лежит и порядок импорта в Moodle.
  7. dist/ai-excel-moodle-delivery.zip — весь dist, кроме самого zip.

Запуск из корня harness:  python tools/build_excel_delivery.py
Повторный запуск пересобирает всё заново (идемпотентно).
"""
import argparse, csv, html, io, os, re, shutil, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # harness
COURSE = ROOT / 'courses' / 'ai-excel'
LESSONS = COURSE / 'lessons'
MOODLE = COURSE / 'assessments' / 'moodle'
DATASETS = COURSE / 'datasets'
DIST = COURSE / 'dist'
ZIP_NAME = 'ai-excel-moodle-delivery.zip'

CSV_HEADER = ['Порядок', 'Тема курса', 'Тип элемента', 'Название', 'Файл',
              'Длительность', 'Условие выполнения', 'Ограничение доступа', 'Группа', 'Баллы']

# 6 квизов: (название блока, уроки блока, порог, баллы, числовых, ситуационных, минут)
# числа — из assessments/blueprint_quizzes.md (подтверждён Ольгой 20.11): 42 числовых + 28 ситуационных.
BLOCKS = [
    ('Блок 1 (урок 1)', [1], '70%', 10, 3, 4, 9),
    ('Блок 2 (урок 2) — допусковый', [2], '80%', 16, 4, 8, 16),
    ('Блок 3 (уроки 3–4)', [3, 4], '70%', 20, 8, 4, 20),
    ('Блок 4 (уроки 5–6)', [5, 6], '70%', 19, 8, 3, 19),
    ('Блок 5 (уроки 7–8)', [7, 8], '70%', 21, 9, 3, 21),
    ('Блок 6 (урок 9) — итоговый', [9], '70%', 28, 10, 6, 28),
]
VARIANTS = ['A', 'B', 'C']

# Названия портфельных артефактов по урокам (короткие, из card.md/сцен уроков)
PORTFOLIO = {
    1: 'Настроенный агент и столбец «Крупная сделка» по чек-листу урока',
    2: 'Регламент очистки, паспорт данных и чистый файл выгрузки',
    3: 'Файл с восемью расчётными столбцами и журналом проверок',
    4: 'Файл со справочником, месяцем/кварталом и разбором ошибок',
    5: 'Две сводные таблицы текстом с проверкой итогов',
    6: 'Живой отчёт: графики, оформление, срез, проверка обновлением',
    7: 'Бюджет на драйверах с листом «Проверки»',
    8: 'Три сценария, кассовый разрыв и подбор кредита',
    9: 'Полная цепочка: чистый файл, отчёт, мини-бюджет, инструкция и видео 90 с',
}


def parse_args():
    p = argparse.ArgumentParser(description='Сборка Moodle-доставки курса ai-excel')
    p.add_argument('--course-root', default=str(COURSE),
                   help='корень курса (по умолчанию courses/ai-excel)')
    p.add_argument('--no-zip', action='store_true', help='не собирать zip')
    return p.parse_args()


def local_refs(html_path):
    """Локальные относительные пути из src=/href= в preview.html (без data:, http#, якорей)."""
    text = html_path.read_text(encoding='utf-8')
    refs = set()
    for m in re.finditer(r'\b(?:src|href)\s*=\s*["\']([^"\']+)["\']', text, re.IGNORECASE):
        u = m.group(1).strip()
        if (not u or u.startswith(('data:', 'http://', 'https://', '//', '#', 'mailto:'))
                or u.startswith('{{')):
            continue
        u = u.split('#')[0].split('?')[0]
        if u:
            refs.add(u)
    return refs


def lesson_dirs():
    out = []
    for d in sorted(LESSONS.iterdir()):
        if d.is_dir() and (d / 'preview.html').exists():
            num = int(d.name.split('-')[0])
            out.append((num, d))
    out.sort()
    return out


COVER_SRC = 'variant_1_robot_i_gotovyj_fajl.png'   # выбран Ольгой 22.11


def build_cover_assets(dist, course):
    """Обложка курса в трёх размерах: 16:9 для лендинга, квадрат для карточки курса, лёгкий jpg для веба."""
    src = course / 'cover' / COVER_SRC
    out = dist / 'cover'
    out.mkdir(parents=True, exist_ok=True)
    if not src.exists():
        print('cover: нет исходника %s — пропуск' % src.name)
        return
    try:
        from PIL import Image
    except ImportError:
        shutil.copy2(src, out / 'ai-excel-cover-1920x1080.png')
        print('cover: PIL нет, скопирован исходник')
        return
    im = Image.open(src).convert('RGB')
    im.save(out / 'ai-excel-cover-1920x1080.png', optimize=True)
    im.resize((1280, 720), Image.LANCZOS).save(
        out / 'ai-excel-cover-1280x720.jpg', quality=88, optimize=True)
    # квадрат — отдельным кадром той же сцены (кроп 16:9 обрезал бы файл с галочкой)
    sq = course / 'cover' / 'variant_1_robot_i_gotovyj_fajl_square.png'
    if sq.exists():
        Image.open(sq).convert('RGB').resize((1080, 1080), Image.LANCZOS).save(
            out / 'ai-excel-cover-square-1080.jpg', quality=90, optimize=True)
    else:
        w, h = im.size
        side = min(w, h)
        left, top = (w - side) // 2, (h - side) // 2
        im.crop((left, top, left + side, top + side)).resize(
            (1080, 1080), Image.LANCZOS).save(
            out / 'ai-excel-cover-square-1080.jpg', quality=90, optimize=True)
    (out / 'README.md').write_text(
        '# Обложка курса «Табличный редактор текстом»\n\n'
        'Утверждён вариант 1 (Ольга, 22.11.2026): робот отдаёт готовый файл с галочкой,\n'
        'подпись «Чат советует — агент делает».\n\n'
        '| Файл | Где использовать |\n|---|---|\n'
        '| `ai-excel-cover-1920x1080.png` | лендинг, обложка курса, презентация |\n'
        '| `ai-excel-cover-1280x720.jpg` | карточка курса на сайте, письмо, соцсети |\n'
        '| `ai-excel-cover-square-1080.jpg` | квадратное превью (Moodle-карточка, аватар, Telegram) — снято '
        'отдельным квадратным кадром той же сцены, файл с галочкой целиком |\n\n'
        'Исходный кадр для других форматов — `courses/ai-excel/cover/%s`;\n'
        'два невыбранных варианта лежат там же (2 и 3).\n' % COVER_SRC,
        encoding='utf-8')
    print('cover: 3 размера (1920x1080, 1280x720, 1080 квадрат) + README')


def write_import_xlsx(path, rows, lessons, titles):
    """Читаемая версия таблицы импорта: план курса + квизы + пороги + датасеты + инструкция."""
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter

    ORANGE = 'D97757'
    th = Side(style='thin', color='E4E4E4')
    border = Border(left=th, right=th, top=th, bottom=th)
    hdr_font = Font(bold=True, color='FFFFFF', size=10, name='Segoe UI')
    hdr_fill = PatternFill('solid', fgColor=ORANGE)
    body = Font(size=10, name='Segoe UI')
    wrap = Alignment(wrap_text=True, vertical='top')
    center = Alignment(horizontal='center', vertical='center', wrap_text=True)

    def put_table(ws, header, data, widths, autofilter=True, first_row=1):
        ws.append([]) if first_row == 1 else None
        for j, h in enumerate(header, 1):
            c = ws.cell(row=first_row, column=j, value=h)
            c.font, c.fill, c.border = hdr_font, hdr_fill, border
            c.alignment = center
        for i, row in enumerate(data, first_row + 1):
            for j, val in enumerate(row, 1):
                c = ws.cell(row=i, column=j, value=val)
                c.font, c.border = body, border
                c.alignment = wrap
        for j, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(j)].width = w
        ws.freeze_panes = 'A%d' % (first_row + 1)
        if autofilter and data:
            ws.auto_filter.ref = 'A%d:%s%d' % (first_row,
                                               get_column_letter(len(header)),
                                               first_row + len(data))
        ws.row_dimensions[first_row].height = 28

    wb = Workbook()

    # 1. План курса
    ws = wb.active
    ws.title = 'План курса'
    put_table(ws, CSV_HEADER, rows[1:], [8, 14, 26, 46, 44, 10, 30, 34, 12, 12])
    # подсветка типов
    fills = {'SCORM': PatternFill('solid', fgColor='FDF0EB'),
             'Тест': PatternFill('solid', fgColor='EEF4FB'),
             'Задание': PatternFill('solid', fgColor='F4F4F2'),
             'Файл': PatternFill('solid', fgColor='F7F7F7')}
    for i in range(2, len(rows)):
        t = str(ws.cell(row=i, column=3).value or '')
        for key, f in fills.items():
            if key in t:
                for j in range(1, len(CSV_HEADER) + 1):
                    ws.cell(row=i, column=j).fill = f
                break
        ws.cell(row=i, column=1).alignment = center

    # 2. Квизы
    ws = wb.create_sheet('Квизы')
    quiz_rows = []
    for bi, (bname, bnums, thr, pts, n_num, n_sit, minutes) in enumerate(BLOCKS, 1):
        for v in VARIANTS:
            quiz_rows.append([bi, 'Блок %d' % bi, 'Вариант %s' % v, bname,
                              'Блок %d/Общие' % bi, 'Блок %d/Вариант %s' % (bi, v),
                              n_num, n_sit, n_num + n_sit, minutes, thr, pts,
                              'questions/ai-excel_bank_variant_%s.xml' % v])
    put_table(ws, ['№', 'Раздел', 'Группа', 'Квиз', 'Слот 1 (категория)',
                   'Слот 2 (категория)', 'Числовых', 'Ситуационных', 'Всего',
                   'Минут', 'Порог', 'Баллы', 'Файл банка'],
              quiz_rows, [5, 10, 12, 34, 20, 24, 11, 14, 9, 9, 9, 9, 40])

    # 3. Пороги и допуски
    ws = wb.create_sheet('Пороги и допуски')
    rules = [
        ['Квиз блока 2 — допуск', 'Порог 80%', 'Без него не открываются блоки 3–6 (условие на каждый элемент блоков 3–6: «оценка квиза блока 2 ≥ 80%»)'],
        ['Остальные квизы', 'Порог 70%', 'Блоки 1, 3, 4, 5, 6'],
        ['Итоговая оценка курса', '70%', 'Средневзвешенная по 6 квизам (10/16/20/19/21/28 = 114 баллов)'],
        ['Попытки', 'Не ограничены', 'Зачитывается высшая оценка'],
        ['Время на квиз', '9–21 мин', 'Суммарно 92 мин на 6 квизов; таймер включать на всё время квиза'],
        ['Вариант датасета', 'A / B / C', 'Группа студента; числовые вопросы у каждого варианта свои, ситуационные — общие (28 шт.)'],
        ['Задание (портфель)', 'Рубрика 5×3', '9 работ: критерии в карточке урока; проверка выборочная, автобаллов нет'],
        ['Завершение урока', 'SCORM: Пройден', 'В настройках SCORM-пакета: Completion tracking → Require status «completed»; Grade → None'],
    ]
    put_table(ws, ['Что', 'Значение', 'Как настроить в Moodle'], rules, [34, 18, 96], autofilter=False)

    # 4. Датасеты
    ws = wb.create_sheet('Датасеты')
    ds = [
        ['variant_A', 'warmup.xlsx, sales_2025.xlsx, sales_2025_safe.xlsx, sales_dirty.xlsx, sales_dirty_2.xlsx, insert_20rows_safe.xlsx, reference_b1–b6.xlsx', 'Вариант A: выручка 27 915 616,50 (sales), прибыль 8 911 072,29, бонус 866 107,90'],
        ['variant_B', 'тот же набор', 'Вариант B: выручка 27 095 366,50 — числа в passports.json'],
        ['variant_C', 'тот же набор', 'Вариант C: выручка 29 264 735,50 — числа в passports.json'],
        ['passports.json', 'контрольные числа по всем вариантам', 'Проверяющему, студенту НЕ выдаётся'],
    ]
    put_table(ws, ['Папка/файл', 'Состав', 'Что внутри'], ds, [18, 70, 70], autofilter=False)

    # 5. Инструкция
    ws = wb.create_sheet('Инструкция')
    steps = [
        ['1', 'Банк вопросов', 'Управление курсом → Банк вопросов → Импорт → Moodle XML. Импортировать все 4 файла из questions/ (общий + A/B/C). Категории создаются автоматически.'],
        ['2', 'Группы', 'Создать группы «Вариант A», «Вариант B», «Вариант C»; запись студента — через «Выбор группы» в нулевом разделе.'],
        ['3', 'Уроки (SCORM)', 'Добавить элемент «Пакет SCORM» → загрузить scorm/ai-excel-lesson-01.zip … 09.zip (по одному на урок). В настройках: Completion → Require status = completed, Grade → None, «Показывать структуру» → нет (в пакете один SCO).'],
        ['4', 'Квизы', 'По листу «Квизы»: 6 квизов × 3 варианта, каждый — два слота по категориям (Общие + Вариант X), ограничение по группе. Пороги — лист «Пороги и допуски».'],
        ['5', 'Задания', '9 элементов «Задание» — приём портфельных артефактов; тип сдачи — файл; ограничение — по завершении урока.'],
        ['6', 'Датасеты', 'Папку datasets/variant_X опубликовать как «Папка»/«Файл» с ограничением по группе варианта. passports.json студентам не публиковать.'],
        ['7', 'Проверка', 'Пройдите курс ролью student по одному варианту: все 9 уроков открываются, квизы дают ≥ порога при верных ответах, задания принимают файл.'],
    ]
    put_table(ws, ['Шаг', 'Что делать', 'Как именно'], steps, [6, 22, 110], autofilter=False)

    wb.save(path)


def main():
    args = parse_args()
    course = Path(args.course_root).resolve()
    global LESSONS, MOODLE, DATASETS
    LESSONS = course / 'lessons'
    MOODLE = course / 'assessments' / 'moodle'
    DATASETS = course / 'datasets'
    dist = course / 'dist'

    lessons = lesson_dirs()
    if len(lessons) != 9:
        print('Ожидалось 9 уроков, найдено %d' % len(lessons))
        sys.exit(1)
    titles = {}
    for num, d in lessons:
        meta = d / 'meta.json'
        if meta.exists():
            import json
            t = json.loads(meta.read_text(encoding='utf-8')).get('title', '')
            titles[num] = t or d.name
        else:
            titles[num] = d.name

    # --- пересоздаём dist с нуля ---
    if dist.exists():
        shutil.rmtree(dist)
    (dist / 'preview' / 'lessons').mkdir(parents=True)
    (dist / 'questions').mkdir()
    (dist / 'datasets').mkdir()

    # --- preview: preview.html + всё, на что он ссылается, + card.md ---
    total_broken = 0
    for num, d in lessons:
        dst = dist / 'preview' / 'lessons' / d.name
        dst.mkdir(parents=True)
        shutil.copy2(d / 'preview.html', dst / 'preview.html')
        if (d / 'card.md').exists():
            shutil.copy2(d / 'card.md', dst / 'card.md')
        for ref in sorted(local_refs(d / 'preview.html')):
            src = d / ref
            if not src.exists():
                print('БИТАЯ ССЫЛКА в %s: %s' % (d.name, ref))
                total_broken += 1
                continue
            target = dst / ref
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, target)
    mp3s = list((dist / 'preview' / 'lessons').glob('*/*.mp3'))
    print('preview: %d уроков, %d mp3' % (len(lessons), len(mp3s)))

    # --- questions: копия всех файлов assessments/moodle ---
    qfiles = sorted(f for f in MOODLE.iterdir() if f.is_file())
    for f in qfiles:
        shutil.copy2(f, dist / 'questions' / f.name)
    xml_q = [f for f in qfiles if f.suffix == '.xml']
    print('questions: %d файлов (%d XML)' % (len(qfiles), len(xml_q)))

    # --- datasets: полная копия + README ---
    for item in DATASETS.iterdir():
        if item.is_dir():
            shutil.copytree(item, dist / 'datasets' / item.name)
        else:
            shutil.copy2(item, dist / 'datasets' / item.name)
    (dist / 'datasets' / 'README.md').write_text(
        '# Датасеты курса «ai-excel»\n\n'
        'Вариант датасета **закрепляется за студентом** (A, B или C) и не меняется '
        'до конца курса: числа в квизах и эталоны паспортов соответствуют варианту.\n\n'
        '- `variant_A/`, `variant_B/`, `variant_C/` — учебные файлы соответствующего варианта\n'
        '  (грязная выгрузка, файлы для разминки, эталонные файлы проверок);\n'
        '- `passports.json` — паспорт данных и контрольные числа по всем трём вариантам '
        '(для проверяющего, студенту не выдаётся).\n\n'
        'Студент работает только с файлами своего варианта: `datasets/variant_<X>/`.\n',
        encoding='utf-8')

    # --- start: нулевой раздел (ориентация) ---
    start_src = course / 'start'
    if start_src.exists():
        shutil.copytree(start_src, dist / 'start')
        print('start: нулевой раздел (%d файла)' % len(list((dist / 'start').iterdir())))

    # --- pilot: комплект для проведения пилота (внутренний, студентам не выдаётся) ---
    pilot_src = course / 'pilot'
    if pilot_src.exists():
        shutil.copytree(pilot_src, dist / 'pilot')
        print('pilot: %d файлов' % len(list((dist / 'pilot').iterdir())))

    # --- обложка курса (выбран вариант 1) ---
    build_cover_assets(dist, course)

    # --- объекты Moodle: библиотека запросов, глоссарий, карта ошибок ---
    mo_src = course / 'moodle-objects'
    if mo_src.exists():
        shutil.copytree(mo_src, dist / 'moodle-objects')
        print('moodle-objects: %d файлов' % len(list((dist / 'moodle-objects').iterdir())))

    # --- templates: учебные шаблоны студента ---
    tpl_src = course / 'templates'
    if tpl_src.exists():
        shutil.copytree(tpl_src, dist / 'templates')
        print('templates: %d файлов' % len(list((dist / 'templates').iterdir())))

    # --- SCORM 1.2: каждый урок — отдельный пакет ---
    scorm_dir = dist / 'scorm'
    scorm_script = ROOT / 'tools' / 'build_scorm_packages.py'
    r = subprocess.run([sys.executable, '-X', 'utf8', str(scorm_script),
                        '--course-root', str(course), '--out', str(scorm_dir)],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout)
        print(r.stderr)
        sys.exit('SCORM не собрался')
    scorm_zips = sorted(scorm_dir.glob('*.zip'))
    print('scorm: %d пакетов, %.1f МБ' % (
        len(scorm_zips), sum(z.stat().st_size for z in scorm_zips) / 1e6))

    # --- import-table.csv + import-table.xlsx ---
    rows: list = [CSV_HEADER]
    n = 1
    block_of = {}
    for bi, blk in enumerate(BLOCKS, 1):
        for num in blk[1]:
            block_of[num] = bi

    # Нулевой раздел — первым элементом курса, до уроков.
    rows.append([n, 'Раздел 0', 'Страница (Page)', 'Нулевой раздел: с чего начать',
                 'start/index.html', '15 мин', 'Просмотр', 'нет', 'все', '—'])
    n += 1

    # Ресурсы датасетов: студент получает только свою папку (группа «Вариант X»).
    for v in VARIANTS:
        rows.append([n, 'Ресурс', 'Файл/папка Moodle', 'Датасеты варианта %s' % v,
                     'datasets/variant_%s/' % v, '—', 'Просмотр и скачивание', 'нет',
                     'Вариант %s' % v, '—'])
        n += 1

    # Учебные шаблоны студента — файлы-заготовки, которые он заполняет сам.
    for fname, for_lesson in (('pasport_dannyh.xlsx', 'урок 2 и повтор в 6, 8'),
                              ('zhurnal_proverok.xlsx', 'уроки 3–9'),
                              ('list_klyuch.xlsx', 'урок 2, только локально'),
                              ('reglament_vygruzki.docx', 'урок 2, сдаётся в портфель')):
        rows.append([n, 'Ресурс', 'Файл шаблона', 'Шаблон: %s (%s)' % (fname, for_lesson),
                     'templates/%s' % fname, '—', 'Скачивание', 'нет',
                     'Вариант A / B / C', '—'])
        n += 1

    prev_name = None
    for num, d in lessons:
        name = titles[num]
        section = 'Блок %d' % block_of[num]
        page = 'preview/lessons/%s/preview.html' % d.name
        pack = 'scorm/ai-excel-lesson-%02d.zip' % num
        rows.append([n, section, 'SCORM 1.2 (урок)', name, pack, '30–40 мин',
                     'Завершение SCORM: статус «Пройден»',
                     'нет' if prev_name is None else 'завершён «%s»' % prev_name,
                     '—', '—'])
        prev_name = name
        n += 1
        # квиз(ы) после последнего урока блока
        last = max(x for x, _ in lessons if block_of[x] == block_of[num])
        if num == last:
            bi = block_of[num]
            bname, bnums, thr, pts, n_num, n_sit, minutes = BLOCKS[bi - 1]
            for v in VARIANTS:
                rows.append([n, 'Блок %d' % bi, 'Тест (банк вопросов, Moodle XML)',
                             'Квиз %s — вариант %s' % (bname, v),
                             'questions/ai-excel_bank_variant_%s.xml' % v,
                             '%d мин' % minutes, 'Оценка ≥ %s' % thr,
                             'завершён «%s» + группа «Вариант %s»' % (prev_name, v),
                             'Вариант %s' % v, str(pts)])
                n += 1
        # Задание под портфельный артефакт урока
        rows.append([n, 'Блок %d' % block_of[num], 'Задание (портфель)',
                     'Портфель: урок %d — %s' % (num, PORTFOLIO[num]), '—', '—',
                     'Загружен файл артефакта (сдано / не сдано)', 'завершён «%s»' % name,
                     '—', '—'])
        n += 1

    buf = io.StringIO()
    csv.writer(buf, delimiter=';', lineterminator='\r\n').writerows(rows)
    (dist / 'import-table.csv').write_text(buf.getvalue(), encoding='utf-8-sig', newline='')
    n_quiz = sum(1 for r in rows[1:] if r[2].startswith('Тест'))
    n_task = sum(1 for r in rows[1:] if r[2].startswith('Задание'))
    print('import-table.csv: %d строк (нулевой раздел 1 + датасеты 3 + шаблоны 4 + '
          'уроки %d + квизы %d + задания %d)' % (len(rows) - 1, len(lessons), n_quiz, n_task))
    write_import_xlsx(dist / 'import-table.xlsx', rows, lessons, titles)
    print('import-table.xlsx: 5 листов (план, квизы, пороги, датасеты, инструкция)')

    # --- README_delivery.md ---
    def lt(num):
        return html.unescape(titles[num])

    readme = f'''# Доставка курса «ai-excel» в Moodle

Курс: «Табличный редактор текстом» — 9 уроков, 6 квизов (3 варианта), 9 портфельных заданий.
Собрано скриптом `tools/build_excel_delivery.py` (образец: `tools/build_office_course.py`).

## Состав dist

| Папка/файл | Что внутри |
|---|---|
| `scorm/ai-excel-lesson-01…09.zip` | **9 SCORM 1.2-пакетов** — по одному на урок. Внутри `index.html` (та же страница, что в preview, + обвязка SCORM), `imsmanifest.xml`, `scorm12.js`, озвучка. Загружаются элементом «Пакет SCORM»; статус «Пройден» ставится, когда озвучка прослушана. |
| `preview/lessons/<slug>/` | 9 уроков для просмотра вне Moodle: `preview.html`, озвучка `*.mp3`, шпаргалка `card.md` и все файлы, на которые страница ссылается. Открывается офлайн двойным кликом по preview.html. |
| `questions/` | 4 XML банка вопросов Moodle: `ai-excel_bank_common.xml` (28 общих) и по варианту `ai-excel_bank_variant_A/B/C.xml` (42 вопроса каждый). |
| `moodle-objects/` | Три объекта Moodle: `biblioteka-zaprosov.csv` + `.html` (12 запросов, 2 на блок, дословно из карточек), `glossarij.csv` (30 терминов для импорта), `karta-oshibok.html` + `.md` (15 ошибок: симптом → причина → что делать) + `README.md` с пошаговой сборкой. |
| `start/` | **Нулевой раздел** (ориентация, 15 мин): `index.html` для Moodle-Page + `orientaciya.md` текстом. Обещание курса, карта артефактов, требования к рабочему месту, среда практики с проверкой, правила безопасности, выбор варианта, первые 15 минут, входная самодиагностика (5 вопросов без оценки), честные тайминги, что делать при сбое. |
| `cover/` | Обложка курса (утверждён вариант 1): 1920×1080 PNG для лендинга, 1280×720 JPG для карточки курса и писем, 1080 квадрат для превью + `README.md`. Кадр снят со сцены урока 1, без персональных данных и логотипов. |
| `pilot/` | Комплект пилота (внутренний, студентам не выдаётся): `plan-pilota.md`, `anketa-pilota.docx`, `tracker-pilota.xlsx`, `README.md`. |
| `templates/` | Учебные шаблоны студента: `pasport_dannyh.xlsx` (паспорт данных), `zhurnal_proverok.xlsx` (журнал проверок + журнал безопасности), `list_klyuch.xlsx` (лист-ключ, только локально), `reglament_vygruzki.docx` (регламент выгрузки на одну страницу) + `README.md`. |
| `datasets/` | Датасеты: `variant_A/`, `variant_B/`, `variant_C/` + `passports.json` (контрольные числа, для проверяющего) + `README.md`. |
| `import-table.csv` + `import-table.xlsx` | Таблица импорта: 3 ресурса датасетов, 9 SCORM-уроков, 18 квизов (6 блоков × 3 варианта), 9 заданий. CSV — для импорта/скриптов ( ; utf-8 BOM), XLSX — читаемая версия: план курса, квизы, пороги, датасеты, инструкция. |
| `{ZIP_NAME}` | Весь dist одним архивом. |

## Порядок импорта в Moodle

Подробная инструкция по квизам — `assessments/README_moodle.md` (копия требований учтена ниже).

0. **Нулевой раздел.** Отдельный раздел курса (перед блоком 1), элемент «Страница» с содержимым
   `start/index.html` (или текстом из `orientaciya.md`). Обязателен: в нём требования к среде
   практики, выбор варианта датасета и входная самодиагностика.
1. **Банк вопросов.** `Управление курсом → Банк вопросов → Импорт → формат «Moodle XML»`.
   Импортировать **все 4 файла** из `questions/` (`common` + три варианта). Порядок не важен,
   категории `$course$/top/…` создаются автоматически.
1a. **Три объекта.** По `moodle-objects/README.md`: Database «Библиотека запросов» (12 записей),
   Глоссарий (импорт `glossarij.csv`, автосвязывание включить), Страница «Карта типичных ошибок».
   Все три — в нулевом разделе.
2. **Группы.** Создать три группы курса: `Вариант A`, `Вариант B`, `Вариант C`;
   запись студента в свою группу через элемент «Выбор группы» в нулевом разделе.
3. **Уроки — SCORM.** 9 разделов курса (Блок 1…Блок 6): в каждый — элемент
   «Пакет SCORM», файл `scorm/ai-excel-lesson-NN.zip`. Настройки пакета: тип пакета — SCORM 1.2,
   Completion tracking → «Требуется статус: completed», Grade → «Нет», «Показывать структуру» —
   нет (в пакете один SCO). Статус «completed» ставится автоматически, когда студент дослушал
   озвучку урока (95% и больше), — это и есть условие открытия следующего урока.
   Если пакет нужно проверить вне Moodle — откройте `preview/lessons/<slug>/preview.html`.
4. **Квизы.** По `import-table.csv`: 6 блоков × 3 варианта = 18 тестов. Каждый квиз блока N
   собирается **слотами по категориям** (`Блок N/Общие` + `Блок N/Вариант X`) и ограничивается
   группой соответствующего варианта. Пороги: блок 2 — **80 %** (допуск к блокам 3–6,
   поставить условие «оценка ≥ 80 %» на квизе блока 2 для последующих), остальные — 70 %.
5. **Задания.** 9 элементов «Задание» — приём портфельных артефактов уроков.
   Режим — **без оценивания**: фиксируется факт сдачи (сдано / не сдано), баллы не начисляются.
   Оценка курса складывается только из квизов; рубрика 5×3 в уроке 9 — самооценка для студента.
   Файл артефакта студент прикладывает из своего варианта датасета.
6. **Датасеты и шаблоны.** Папку `datasets/variant_X` опубликовать как ресурс с ограничением
   по группе варианта; `templates/` — общим ресурсом для всех (пустой лист-ключ студент
   заполняет сам). Копию `passports.json` передать проверяющему отдельно, студентам не публиковать.
7. **Таблица импорта.** `import-table.xlsx` — рабочая шпаргалка менеджеру (5 листов: план курса
   с подсветкой типов, квизы со слотами, пороги и допуски, датасеты, пошаговая инструкция);
   `import-table.csv` — тот же план машинно-читаемо (порядок, файл, условие, ограничение, группа, баллы).
   В Moodle условия и ограничения проставляются вручную по колонкам.

Менеджер Moodle: ответственный за курс **Ольга** (владелец репозитория harness);
вопросы по настройке квизов — см. `README_moodle.md`, по проверке артефактов — `passports.json`.
'''
    (dist / 'README_delivery.md').write_text(readme, encoding='utf-8')

    # --- zip ---
    if not args.no_zip:
        zpath = dist / ZIP_NAME
        with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as zf:
            for p in sorted(dist.rglob('*')):
                if p.is_file() and p != zpath:
                    zf.write(p, p.relative_to(dist).as_posix())
        print('zip: %s (%d файлов, %.1f МБ)' % (
            ZIP_NAME, len(zipfile.ZipFile(zpath).namelist()), zpath.stat().st_size / 1e6))

    # --- финальная проверка ссылок в собранном dist ---
    broken = []
    for p in (dist / 'preview').rglob('*.html'):
        for ref in local_refs(p):
            if not (p.parent / ref).exists():
                broken.append('%s -> %s' % (p.relative_to(dist), ref))
    if total_broken or broken:
        print('QA: битых ссылок %d' % (total_broken + len(broken)))
        for b in broken:
            print('  -', b)
        sys.exit(1)
    missing = [row[4] for row in rows[1:]
               if row[4] and row[4] not in ('—', '-') and not row[4].endswith('/')
               and not (dist / row[4]).exists()]
    if missing:
        print('QA: в dist нет файлов из import-table: %s' % missing)
        sys.exit(1)
    print('QA: 0 битых ссылок, 0 потерянных файлов. Уроков: %d, mp3: %d, XML: %d, SCORM: %d' % (
        len(lessons), len(mp3s), len(xml_q), len(scorm_zips)))


if __name__ == '__main__':
    main()
