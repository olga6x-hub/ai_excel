# Курс «Табличный редактор текстом» — передача менеджеру Moodle

Версия **v1.0** от 2026-11-22. Курс: 9 уроков, 6 квизов × 3 варианта, 9 портфельных заданий,
нулевой раздел, шаблоны студента, SCORM-пакеты, обложка.

## Что читать первым

1. **[HANDOVER_MOODLE.md](HANDOVER_MOODLE.md)** — что внутри, порядок сборки, приёмка,
   известные ограничения версии.
2. **`releases/ai-excel-v1.0-moodle-delivery.zip`** — готовый архив курса (27,9 МБ).
   Контрольная сумма — `releases/SHA256SUMS.txt`.

## Как забрать

```bash
git clone <адрес-репозитория>
cd ai-excel-delivery
# распаковать архив
unzip releases/ai-excel-v1.0-moodle-delivery.zip -d /tmp/ai-excel
```

Дальше — по разделу 3 `HANDOVER_MOODLE.md` (нулевой раздел → банк вопросов → три объекта →
группы → SCORM-уроки → квизы → задания → датасеты → проверка ролью student).

## Состав репозитория

| Папка | Что внутри |
|---|---|
| `releases/` | Архивы версий + `SHA256SUMS.txt` (старые версии не удаляются) |
| `sources/` | Исходники курса: сценарии, сцены, карточки, банк вопросов, датасеты, шаблоны, нулевой раздел, объекты Moodle, комплект пилота. Без mp3 и `dist/` — они в архиве |
| `tools/` | Скрипты пересборки (Python 3.10: openpyxl, python-docx) |

## Пересборка (если нужны правки)

```bash
cd sources            # или из корня, если положить рядом
python tools/build_excel_datasets.py all && python tools/build_excel_datasets.py verify
python tools/build_lesson_preview.py sources/lessons/<урок>
python tools/build_excel_delivery.py
python tools/make_release.py 1.1
```

Озвучка пересобирается только при правках текста: `python tools/gen_ya_tts.py sources/lessons/<урок>`
(нужны ключи Yandex Cloud, голоса jane/filipp).

## Правила

- Правки содержания — через репозиторий, а не правкой в Moodle: иначе версии разойдутся.
- Нейтральность: без названий продуктов и брендов, рабочее слово — «табличный редактор».
- Персональные данные: в курсе только синтетические данные; `datasets/passports.json` студентам
  не выдаётся.
- `pilot/` — внутренний комплект, студентам не раздаётся.
