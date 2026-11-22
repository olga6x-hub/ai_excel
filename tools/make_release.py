#!/usr/bin/env python3
"""Сборка версии курса для передачи менеджеру Moodle.

Берёт готовый `courses/ai-excel/dist/` (его собирает tools/build_excel_delivery.py),
добавляет HANDOVER_MOODLE.md и кладёт архив с версией в `courses/ai-excel/releases/`.
Старые версии не удаляются: по ним уже могли собрать курс.

  python tools/make_release.py 1.0
  python tools/make_release.py 1.1 --note "правки после пилота"

Создаёт:
  courses/ai-excel/releases/ai-excel-v<версия>-moodle-delivery.zip
  courses/ai-excel/releases/SHA256SUMS.txt   (пересчитывается по всем архивам)
"""
import argparse
import hashlib
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COURSE = ROOT / "courses" / "ai-excel"
DIST = COURSE / "dist"
REL = COURSE / "releases"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser(description="Собрать версию курса для передачи")
    ap.add_argument("version", help="версия, например 1.0")
    ap.add_argument("--note", default="", help="строка в имени версии (необязательно)")
    args = ap.parse_args()

    if not DIST.exists():
        raise SystemExit("нет dist/ — сначала: python tools/build_excel_delivery.py")

    REL.mkdir(parents=True, exist_ok=True)
    out = REL / ("ai-excel-v%s-moodle-delivery.zip" % args.version)
    handover = COURSE / "HANDOVER_MOODLE.md"

    # исключаем только сводный архив доставки; SCORM-пакеты (scorm/*.zip) обязательны
    files = [p for p in sorted(DIST.rglob("*"))
             if p.is_file() and not (p.parent == DIST and p.suffix == ".zip")]
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in files:
            zf.write(p, p.relative_to(DIST).as_posix())
        if handover.exists():
            zf.write(handover, "HANDOVER_MOODLE.md")
    digest = sha256(out)
    (REL / (out.stem + ".sha256")).write_text("%s  %s\n" % (digest, out.name), encoding="utf-8")

    lines = []
    for z in sorted(REL.glob("*.zip")):
        lines.append("%s  %s" % (sha256(z), z.name))
    (REL / "SHA256SUMS.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("релиз: %s" % out.relative_to(ROOT))
    print("  файлов внутри: %d" % (len(files) + (1 if handover.exists() else 0)))
    print("  размер: %.1f МБ" % (out.stat().st_size / 1e6))
    print("  sha256: %s" % digest)
    if args.note:
        print("  пометка: %s" % args.note)


if __name__ == "__main__":
    main()
