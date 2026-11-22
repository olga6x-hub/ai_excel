// Урок 2 «Сначала очистка, потом агент»: 17 стик-сцен по репликам сценария.
// Load after stick.js: <stick-scene scene="ax2-intro" play="view"></stick-scene>
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, L2, mix, fig, inkFill, rr, ln, poly, circle, text, seg, clamp, lerp, breathe, pulse, bubble, words, tickBadge, sparks, arrow, arcPt, held } = R;

  const ORG = '#d97757', ORG_FAR = '#e8b7a3';          // агент-робот
  const INK = C.ink, INK_FAR = C.far;                   // Аня (герой)

  // ---------- локальные хелперы ----------

  // маленькая таблица-файл (как в уроке 1); k = 0..1 растит подсвеченный столбец
  function fileCard(g, x, y, k, done, plain) {
    const w = 64, h = 50;
    g.save();
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    for (let i = 0; i < 4; i++) ln(g, x + 6, y + 12 + i * 10, x + w - (plain ? 12 : 24), y + 12 + i * 10, 1.1);
    if (!plain) {
      const colH = (h - 12) * E.soft(k);
      if (colH > 0.5) {
        g.fillStyle = C.butter;
        g.fillRect(x + w - 16, y + h - 6 - colH, 10, colH);
        g.strokeStyle = C.ink; g.lineWidth = 1.2;
        g.strokeRect(x + w - 16, y + h - 6 - colH, 10, colH);
      }
    }
    g.restore();
    tickBadge(g, x + w - 4, y + 4, done);
  }

  // табличка-слово
  function signCard(g, cx, cy, w, h, s, k, size) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const x = cx - w / 2, y = cy - h / 2;
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.6);
    text(g, s, cx, cy + (size || 9) * 0.35, size || 9, C.ink);
    g.restore();
  }

  // чек-лист из N строк в руке робота; lit = сколько галочек зажжено
  function checklistSheet(g, p, lit, steps) {
    if (!p) { return; }
    const n = steps.length, w = 68, h = 13 + (n - 1) * 11 + 9;
    const x = p[0] - w / 2, y = p[1] - h / 2;
    g.save();
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    for (let i = 0; i < n; i++) {
      const yy = y + 13 + i * 11;
      const on = Math.max(0, Math.min(1, lit - i));
      g.strokeStyle = C.ink; g.lineWidth = 1.1;
      g.strokeRect(x + 7, yy - 5, 7, 7);
      if (on > 0) {
        g.save(); g.globalAlpha = on;
        g.strokeStyle = C.amber; g.lineWidth = 1.9;
        g.beginPath();
        g.moveTo(x + 8.4, yy - 1.4); g.lineTo(x + 10.4, yy + 0.8); g.lineTo(x + 13.2, yy - 3.6);
        g.stroke(); g.restore();
      }
      text(g, steps[i], x + 19, yy + 1.5, 6.5, on > 0.5 ? C.ink : C.soft, 'left');
    }
    g.restore();
  }

  // пунктирный прямоугольник (контур)
  function dashRect(g, x, y, w, h, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    g.setLineDash([5, 4]);
    g.strokeStyle = C.muted; g.lineWidth = 1.5;
    g.strokeRect(x, y, w, h);
    g.setLineDash([]);
    g.restore();
  }

  // круг-стоп: круг + горизонтальная черта
  function stopSign(g, x, y, k) {
    if (k <= 0) { return; }
    const s = E.back(clamp(k, 0, 1));
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    circle(g, 0, 0, 13);
    inkFill(g, C.paper, 2.2, C.redInk);
    ln(g, -7, 0, 7, 0, 2.6, C.redInk);
    g.restore();
  }

  // значок телефона
  function iconPhone(g, x, y, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    rr(g, x, y, 9, 14, 2); inkFill(g, C.paper, 1.3);
    ln(g, x + 3.5, y + 11, x + 5.5, y + 11, 1.4);
    g.restore();
  }

  // значок конверта
  function iconMail(g, x, y, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    rr(g, x, y, 14, 10, 1.5); inkFill(g, C.paper, 1.3);
    poly(g, [[x + 1, y + 1], [x + 7, y + 6], [x + 13, y + 1]]);
    g.strokeStyle = C.ink; g.lineWidth = 1.1; g.stroke();
    g.restore();
  }

  // значок примечания-стикера
  function iconNote(g, x, y, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    rr(g, x, y, 13, 13, 1.5); inkFill(g, C.butterSoft || C.paper, 1.3);
    ln(g, x + 3, y + 5, x + 10, y + 5, 1);
    ln(g, x + 3, y + 8, x + 10, y + 8, 1);
    g.restore();
  }

  // мусорная корзина
  function binIcon(g, x, y, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    poly(g, [[x, y], [x + 26, y], [x + 22, y + 30], [x + 4, y + 30]], true);
    inkFill(g, C.paper, 1.5);
    ln(g, x - 3, y, x + 29, y, 2, C.ink);
    ln(g, x + 9, y + 6, x + 11, y + 24, 1.1);
    ln(g, x + 17, y + 6, x + 15, y + 24, 1.1);
    g.restore();
  }

  // щит с замком
  function shieldLock(g, cx, cy, k) {
    if (k <= 0) { return; }
    const s = E.back(clamp(k, 0, 1));
    g.save();
    g.translate(cx, cy);
    g.scale(s, s);
    poly(g, [[-15, -19], [15, -19], [15, 2], [0, 18], [-15, 2]], true);
    inkFill(g, C.butterSoft || C.paper, 1.7);
    rr(g, -5, -4, 10, 9, 1.5); inkFill(g, C.paper, 1.3);
    g.strokeStyle = C.ink; g.lineWidth = 1.5;
    g.beginPath(); g.arc(0, -4, 4, Math.PI, 0); g.stroke();
    g.restore();
  }

  // большой красный крест в габаритах (w × h) вокруг центра
  function bigCross(g, cx, cy, w, h, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    const e = E.out(clamp(k * 1.4, 0, 1)) * 0.5 + 0.5;
    g.strokeStyle = '#b91c1c'; g.lineCap = 'round';
    ln(g, cx - w * e, cy - h * e, cx + w * e, cy + h * e, 2.6, '#b91c1c');
    ln(g, cx + w * e, cy - h * e, cx - w * e, cy + h * e, 2.6, '#b91c1c');
    g.restore();
  }

  // цветная метка-тег (паспорт данных)
  function tag(g, x, y, s, k, fill, ink) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    const w = s.length * 5 * 0.62 + 8, h = 11;
    rr(g, x, y - h + 3, w, h, 3);
    inkFill(g, fill, 1.1, ink);
    text(g, s, x + w / 2, y + 0.5, 5, ink);
    g.restore();
    return w;
  }

  // ================= сцены =================

  SC['ax2-intro'] = {
    dur: 6.5,
    width: 380,
    label: 'Настоящая выгрузка от руководителя: в ней торчат телефоны, почты и примечания.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -80;
      let anya = breathe(P({ hF: [14, -66], hB: [-4, -52], head: [3, -114] }), t);
      let fK = 0, i1 = 0, i2 = 0, i3 = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        fK = i1 = i2 = i3 = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        fK = E.back(seg(T, 0.3, 0.8)) * fade;
        i1 = E.back(seg(T, 1.1, 1.5)) * fade;
        i2 = E.back(seg(T, 1.5, 1.9)) * fade;
        i3 = E.back(seg(T, 1.9, 2.3)) * fade;
        capK = E.back(seg(T, 2.6, 3.0)) * (1 - seg(T, 5.6, 5.9)) * fade;
        anya = mix(anya, P({ hF: [26, -96], head: [7, -113] }, anya),
          E.soft(seg(T, 0.8, 1.3)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      // большая карточка-таблица
      if (fK > 0) {
        g.save(); g.globalAlpha = Math.min(1, fK);
        rr(g, 0, -120, 108, 78, 5); inkFill(g, C.paper, 1.6);
        ln(g, 0, -104, 108, -104, 1.1);
        // подписи колонок: какие именно данные проблемные (без реальных значений)
        text(g, 'имя', 6, -111, 5, C.muted, 'left');
        text(g, 'тел.', 32, -111, 5, C.muted, 'left');
        text(g, 'почта', 54, -111, 5, C.muted, 'left');
        text(g, 'примеч.', 78, -111, 5, C.muted, 'left');
        for (let i = 0; i < 4; i++) ln(g, 7, -95 + i * 12, 101, -95 + i * 12, 1.1);
        g.restore();
      }
      iconPhone(g, 112, -114, i1);
      iconMail(g, 112, -90, i2);
      iconNote(g, 112, -66, i3);
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'выгрузка от руководителя', -30, -36, 7, C.muted);
        g.restore();
      }
    },
  };

  SC['ax2-stop'] = {
    dur: 6,
    width: 380,
    label: 'Файл с чужими контактами агенту отдавать нельзя: Аня выставляет ладонь «стоп».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -78, RX = 82;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let stopK = 0, palmK = 0, capK = 0, fK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        stopK = 0.9; palmK = 0.9; fK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        fK = E.back(seg(T, 0.3, 0.7)) * fade;
        palmK = E.soft(seg(T, 0.7, 1.1)) * (1 - E.soft(seg(T, 4.4, 4.8))) * fade;
        stopK = E.back(seg(T, 1.2, 1.6)) * fade;
        capK = E.back(seg(T, 2.2, 2.6)) * (1 - seg(T, 5.1, 5.4)) * fade;
        anya = mix(anya, P({ hF: [26, -88], head: [5, -113] }, anya), palmK);
        bot = mix(bot, P({ hF: [30, -78], head: [6, -114] }, bot),
          E.soft(seg(T, 0.4, 0.9)) * (1 - E.soft(seg(T, 2.2, 2.7))));
      }
      // файл, к которому тянется робот
      if (fK > 0) {
        g.save(); g.globalAlpha = Math.min(1, fK);
        rr(g, RX - 4, -120, 44, 34, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 2; i++) ln(g, RX + 3, -110 + i * 10, RX + 33, -110 + i * 10, 1.1);
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      stopSign(g, 6, -96, stopK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'сначала очистка', 0, -52, 8, C.umber);
        g.restore();
      }
    },
  };

  SC['ax2-rule'] = {
    dur: 6,
    width: 380,
    label: 'Первое правило курса — нулевой шаг: сначала очистка (ступень 1), потом агент (ступень 2).',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let bot = breathe(P({ hF: [10, -60], hB: [-4, -52], head: [2, -116] }), t);
      let s1 = 0, s2 = 0, arrK = 0;
      if (T < 0) {
        bot = mix(bot, P({ head: [-4, -114] }, bot), pulse(t, 6, 2, 2));
        s1 = s2 = 0.9; arrK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        s1 = E.back(seg(T, 0.3, 0.75)) * fade;
        arrK = seg(T, 1.1, 1.6) * fade;
        s2 = E.back(seg(T, 1.6, 2.05)) * fade;
      }
      // ступеньки-блоки
      if (s1 > 0) {
        g.save(); g.globalAlpha = Math.min(1, s1);
        rr(g, -140, -22, 78, 22, 3); inkFill(g, C.chip, 1.5);
        text(g, '1 очистка', -101, -8, 6.5, C.ink);
        g.restore();
      }
      if (s2 > 0) {
        g.save(); g.globalAlpha = Math.min(1, s2);
        rr(g, 28, -42, 92, 42, 3); inkFill(g, C.sky, 1.5);
        text(g, '2 агент', 74, -8, 6.5, C.ink);
        g.restore();
      }
      arrow(g, [[-56, -30], [20, -50]], { k: arrK, col: C.umber, head: 6 });
      fig(g, bot, 74, -42, { s: 0.75, sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true, happy: s2 > 0.3 } });
    },
  };

  SC['ax2-why'] = {
    dur: 5.5,
    width: 380,
    label: 'Слушатель спрашивает «почему так строго?» — робот держит щит с замком.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -84, RX = 76;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [10, -60], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, shK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; shK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.4, 3.7)) * fade;
        shK = E.back(seg(T, 1.1, 1.55)) * fade;
        bot = mix(bot, P({ hF: [22, -84], head: [5, -114] }, bot),
          E.soft(seg(T, 0.8, 1.3)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      shieldLock(g, RX + 44, -100, shK);
      bubble(g, -46, -112, 'почему так строго?', qK, { tail: -26, size: 8 });
    },
  };

  SC['ax2-contour'] = {
    dur: 7,
    width: 380,
    label: 'Файл ушёл — данные покинули ваш контур: история переписки, логи, обучение модели.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -88;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let cK = 0, arrK = 0, clK = 0, fK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        cK = clK = fK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = seg(T, 0.3, 0.7) * fade;
        fK = E.back(seg(T, 0.5, 0.9)) * fade;
        arrK = seg(T, 1.4, 2.0) * fade;
        clK = E.back(seg(T, 2.0, 2.5)) * fade;
        anya = mix(anya, P({ hF: [20, -80], head: [5, -113] }, anya),
          E.soft(seg(T, 1.2, 1.7)) * (1 - E.soft(seg(T, 4.6, 5.0))));
      }
      dashRect(g, -158, -130, 148, 124, cK);
      if (fK > 0) {
        g.save(); g.globalAlpha = Math.min(1, fK);
        rr(g, -58, -116, 40, 30, 3); inkFill(g, C.paper, 1.4);
        for (let i = 0; i < 2; i++) ln(g, -51, -106 + i * 9, -9, -106 + i * 9, 1);
        g.restore();
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      arrow(g, [[-6, -102], [58, -102]], { k: arrK, col: C.redInk, head: 6 });
      // карточка-облако справа
      if (clK > 0) {
        g.save(); g.globalAlpha = Math.min(1, clK);
        rr(g, 62, -110, 96, 66, 8); inkFill(g, C.sky, 1.6);
        text(g, 'облако', 110, -99, 7, C.muted);
        text(g, 'история', 110, -84, 6.5, C.ink);
        text(g, 'логи', 110, -70, 6.5, C.ink);
        text(g, 'обучение', 110, -56, 6.5, C.ink);
        g.restore();
      }
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        text(g, 'ваш контур', -84, -14, 7, C.muted);
        g.restore();
      }
    },
  };

  SC['ax2-late'] = {
    dur: 5.5,
    width: 380,
    label: 'Попросить агента обезличить? Файл уже улетел за контур — поздно.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -92;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let cK = 0, qK = 0, fK = 0, arrK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        cK = qK = fK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = seg(T, 0.3, 0.7) * fade;
        qK = E.back(seg(T, 0.4, 0.75)) * (1 - seg(T, 4.6, 4.9)) * fade;
        const fly = E.soft(seg(T, 1.3, 2.1));
        fK = (0.55 + 0.45 * fly) * fade;
        arrK = fly * fade;
        anya = mix(anya, P({ hF: [18, -78], head: [5, -113] }, anya),
          E.soft(seg(T, 0.9, 1.3)) * (1 - E.soft(seg(T, 3.2, 3.6))));
        // файл вылетает за контур (стартует сбоку от Ани, не поверх головы)
        var fx = -28 + 100 * fly, fy = -88 - 20 * Math.sin(Math.PI * fly);
      }
      dashRect(g, -150, -128, 128, 122, cK);
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -92, -112, 'обезличить?', qK, { tail: -20, size: 8 });
      if (fK > 0) {
        const x = T < 0 ? -28 : (fx - 20), y = T < 0 ? -88 : (fy - 15);
        g.save(); g.globalAlpha = Math.min(1, fK);
        rr(g, x, y, 44, 34, 3); inkFill(g, C.butterSoft || C.paper, 1.8);
        for (let i = 0; i < 3; i++) ln(g, x + 7, y + 10 + i * 9, x + 35, y + 10 + i * 9, 1.2);
        g.restore();
        if (arrK > 0.05) {
          g.save(); g.globalAlpha = 0.7 * Math.min(1, arrK);
          g.setLineDash([4, 4]);
          g.strokeStyle = C.redInk; g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(-72, -82); g.quadraticCurveTo(20, -130, x - 2, y + 17);
          g.stroke();
          g.setLineDash([]);
          // наконечник у файла
          const ex = x - 2, ey = y + 17;
          const ang = Math.atan2(ey + 130, ex - 20);
          g.fillStyle = C.redInk;
          g.beginPath();
          g.moveTo(ex, ey);
          g.lineTo(ex - 8 * Math.cos(ang - 0.4), ey - 8 * Math.sin(ang - 0.4));
          g.lineTo(ex - 8 * Math.cos(ang + 0.4), ey - 8 * Math.sin(ang + 0.4));
          g.closePath(); g.fill();
          g.restore();
        }
      }
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        text(g, 'ваш контур', -86, -14, 6.5, C.muted);
        g.restore();
      }
    },
  };

  SC['ax2-toolate'] = {
    dur: 6,
    width: 380,
    label: 'Просьба «обезличь» уходит туда же, куда и файл. Очистка делается локально, до отправки.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const RX = 96;
      let bot = breathe(P({ hF: [10, -60], hB: [-4, -50], head: [2, -116] }), t);
      let cK = 0, bK = 0, xK = 0, monK = 0, capK = 0;
      if (T < 0) {
        bot = mix(bot, P({ head: [-4, -114] }, bot), pulse(t, 6, 2, 2));
        cK = bK = xK = monK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = seg(T, 0.3, 0.7) * fade;
        bK = E.back(seg(T, 0.4, 0.75)) * fade;
        xK = seg(T, 1.2, 1.6) * fade;
        monK = E.back(seg(T, 1.8, 2.2)) * fade;
        capK = E.back(seg(T, 2.6, 3.0)) * (1 - seg(T, 5.1, 5.4)) * fade;
        bot = mix(bot, P({ hF: [30, -86], head: [-4, -113] }, bot),
          E.soft(seg(T, 1.6, 2.1)) * (1 - E.soft(seg(T, 4.4, 4.8))));
      }
      dashRect(g, -158, -128, 128, 122, cK);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      // монитор внутри контура
      if (monK > 0) {
        g.save(); g.globalAlpha = Math.min(1, monK);
        rr(g, -142, -104, 86, 56, 4); inkFill(g, C.paper, 1.5);
        ln(g, -142, -90, -56, -90, 1.1);
        for (let i = 0; i < 2; i++) ln(g, -134, -80 + i * 9, -64, -80 + i * 9, 1);
        ln(g, -99, -48, -99, -40, 2.2);
        ln(g, -110, -40, -88, -40, 2.2);
        g.restore();
      }
      // облачко «обезличь» и крест
      bubble(g, 22, -88, 'обезличь', bK, { tail: 22, size: 8 });
      bigCross(g, 22, -98, 24, 14, xK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'очистка локально', 40, -34, 8, C.umber);
        g.restore();
      }
    },
  };

  SC['ax2-start'] = {
    dur: 6.5,
    width: 380,
    label: 'С чего начать: робот показывает чек-лист очистки из семи пунктов.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -104;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [30, -74], hB: [4, -58], head: [0, -116] }), t);
      let qK = 0, shK = 0, lit = 0;
      const steps = ['осмотр', 'паспорт', 'ключ', 'коды', 'контакты', 'минимум', 'контроль'];
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        shK = 0.9; qK = 0.9; lit = 7;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.0, 2.3)) * fade;
        shK = E.back(seg(T, 0.8, 1.2)) * fade;
        lit = Math.max(0, Math.min(7, (T - 1.1) / 0.5)) * (fade > 0 ? 1 : 0);
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      fig(g, bot, 14, 0, {
        sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true },
        held: (g2, J) => R.held(g2, J, (hF) => {
          if (shK <= 0) { return; }
          g2.save(); g2.globalAlpha = Math.min(1, shK);
          checklistSheet(g2, [hF[0] + 6, hF[1] + 2], lit, steps);
          g2.restore();
        }),
      });
      bubble(g, -58, -112, 'с чего начать?', qK, { tail: -22, size: 8 });
      text(g, 'чек-лист очистки', 76, -130, 7, C.muted);
    },
  };

  SC['ax2-passport'] = {
    dur: 6.5,
    width: 380,
    label: 'Паспорт данных: напротив каждой колонки загорается метка — ПДн, тайна или рабочая.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let cK = 0, capK = 0;
      const tags = [
        { row: 0, s: 'ПДн', fill: C.red, ink: C.redInk, at: 1.0 },
        { row: 1, s: 'тайна', fill: C.butter, ink: C.umber, at: 1.5 },
        { row: 2, s: 'рабочая', fill: C.green, ink: C.greenInk, at: 2.0 },
        { row: 3, s: 'ПДн', fill: C.red, ink: C.redInk, at: 2.5 },
        { row: 4, s: 'рабочая', fill: C.green, ink: C.greenInk, at: 3.0 },
      ];
      let lit = tags.map(() => 0);
      if (T < 0) {
        cK = 0.9; lit = tags.map(() => 0.9); capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.3, 0.8)) * fade;
        lit = tags.map((tg, i) => E.back(seg(T, tg.at, tg.at + 0.35)) * fade);
        capK = E.back(seg(T, 3.6, 4.0)) * (1 - seg(T, 5.6, 5.9)) * fade;
      }
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, -110, -130, 118, 86, 5); inkFill(g, C.paper, 1.6);
        ln(g, -110, -116, -32, -116, 1.1);
        for (let i = 0; i < 5; i++) words(g, -102, -105 + i * 13, 78, i + 2);
        g.restore();
      }
      for (let i = 0; i < tags.length; i++) {
        tag(g, -26, -102 + tags[i].row * 13, tags[i].s, lit[i], tags[i].fill, tags[i].ink);
      }
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'паспорт данных', 30, -34, 8, C.umber);
        g.restore();
      }
    },
  };

  SC['ax2-names'] = {
    dur: 6,
    width: 380,
    label: 'Шесть имён менеджеров заменяются на коды: М1, М2 и так далее.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let lK = 0, arrK = 0, rK = 0, n = 0;
      const rows = [-112, -93, -74, -55, -36, -17];
      if (T < 0) {
        lK = 0.9; rK = 0.9; n = 6;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.75)) * fade;
        arrK = seg(T, 1.0, 1.5) * fade;
        rK = E.back(seg(T, 1.5, 1.95)) * fade;
        n = Math.max(0, Math.min(6, (T - 1.7) / 0.35)) * (fade > 0 ? 1 : 0);
      }
      // слева: карточки с именами (псевдотекст)
      for (let i = 0; i < 6; i++) {
        if (lK <= 0) { continue; }
        g.save(); g.globalAlpha = Math.min(1, lK);
        rr(g, -158, rows[i], 50, 16, 3); inkFill(g, C.paper, 1.3);
        words(g, -151, rows[i] + 8, 36, i + 1, C.muted, 1.6);
        g.restore();
      }
      arrow(g, [[-96, -70], [96, -70]], { k: arrK, col: C.umber, head: 7 });
      // справа: карточки с кодами М1..М6
      for (let i = 0; i < 6; i++) {
        if (rK <= 0 || n < i + 0.02) { continue; }
        g.save(); g.globalAlpha = Math.min(1, rK, Math.min(1, n - i));
        rr(g, 108, rows[i], 50, 16, 3); inkFill(g, C.butterSoft || C.paper, 1.3);
        text(g, 'М' + (i + 1), 133, rows[i] + 10.5, 8, C.ink);
        g.restore();
      }
      text(g, 'имена', -133, -124, 6.5, C.muted);
      text(g, 'коды', 119, -124, 6.5, C.muted);
    },
  };

  SC['ax2-keys'] = {
    dur: 6.5,
    width: 380,
    label: 'Ключ с расшифровкой лежит локально в сейфе и агенту не уходит никогда.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -108, RX = 92;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let keyK = 0, safeK = 0, okK = 0, lineK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        keyK = safeK = okK = lineK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        keyK = E.back(seg(T, 0.3, 0.75)) * fade;
        safeK = E.back(seg(T, 1.0, 1.45)) * fade;
        okK = seg(T, 1.7, 2.1) * fade;
        lineK = seg(T, 2.3, 2.7) * fade;
        capK = E.back(seg(T, 2.9, 3.3)) * (1 - seg(T, 5.6, 5.9)) * fade;
        anya = mix(anya, P({ hF: [22, -82], head: [5, -113] }, anya),
          E.soft(seg(T, 0.6, 1.1)) * (1 - E.soft(seg(T, 4.4, 4.8))));
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      // карточка-ключ в руке Ани
      if (keyK > 0) {
        g.save(); g.globalAlpha = Math.min(1, keyK);
        rr(g, -78, -108, 48, 26, 4); inkFill(g, C.butter, 1.8);
        text(g, 'ключ', -54, -91, 8.5, C.ink);
        g.restore();
      }
      // сейф с галочкой
      if (safeK > 0) {
        g.save(); g.globalAlpha = Math.min(1, safeK);
        rr(g, -26, -76, 44, 46, 4); inkFill(g, C.steel, 1.6);
        circle(g, -4, -53, 8);
        inkFill(g, C.paper, 1.2);
        ln(g, -4, -53, -4, -48, 1.8);
        g.restore();
        tickBadge(g, -4, -53, okK, 6);
      }
      // пунктирная граница: ключ не летит
      if (lineK > 0) {
        g.save(); g.globalAlpha = Math.min(1, lineK);
        g.setLineDash([4, 5]);
        g.strokeStyle = C.muted; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(38, -124); g.lineTo(38, -4); g.stroke();
        g.setLineDash([]);
        g.restore();
        bigCross(g, 38, -104, 8, 20, lineK * 0.9);
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'ключ локально', -56, -20, 6.5, C.umber);
        text(g, 'агенту не уходит', 92, -20, 6.5, C.umber);
        g.restore();
      }
    },
  };

  SC['ax2-contacts'] = {
    dur: 6,
    width: 380,
    label: 'Телефоны и почты удаляем: значки вылетают из таблицы прямо в корзину.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let tblK = 0, binK = 0, fly1 = 0, fly2 = 0, okK = 0;
      if (T < 0) {
        tblK = binK = 0.9; okK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        tblK = E.back(seg(T, 0.3, 0.8)) * fade;
        binK = E.back(seg(T, 0.7, 1.15)) * fade;
        fly1 = seg(T, 1.3, 2.1) * fade;
        fly2 = seg(T, 1.9, 2.7) * fade;
        okK = seg(T, 2.9, 3.3) * fade;
      }
      // таблица слева
      if (tblK > 0) {
        g.save(); g.globalAlpha = Math.min(1, tblK);
        rr(g, -150, -122, 84, 58, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 3; i++) ln(g, -142, -108 + i * 12, -74, -108 + i * 12, 1.1);
        g.restore();
      }
      // полёт телефона и конверта в корзину
      const p1 = arcPt([-80, -104], [92, -56], 34, fly1);
      const p2 = arcPt([-80, -104], [92, -56], 44, fly2);
      if (fly1 > 0 && fly1 < 1) iconPhone(g, p1[0] - 4, p1[1] - 7, 1);
      if (fly2 > 0 && fly2 < 1) iconMail(g, p2[0] - 7, p2[1] - 5, 1);
      binIcon(g, 79, -56, binK);
      tickBadge(g, 128, -84, okK, 9);
      sparks(g, 92, -70, seg(T, 2.9, 3.5), 12, 5);
      text(g, 'телефоны и почты — вон', -20, -30, 7, C.muted);
    },
  };

  SC['ax2-notes'] = {
    dur: 5.5,
    width: 380,
    label: 'Примечания опасны: в них попадаются адреса и даже паспортные данные.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -104;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let nK = 0, xK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        nK = xK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        nK = E.back(seg(T, 0.3, 0.75)) * fade;
        xK = seg(T, 1.4, 1.8) * fade;
        capK = E.back(seg(T, 2.2, 2.6)) * (1 - seg(T, 4.6, 4.9)) * fade;
        anya = mix(anya, P({ hF: [24, -92], head: [6, -113] }, anya),
          E.soft(seg(T, 1.0, 1.5)) * (1 - E.soft(seg(T, 3.8, 4.2))));
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      if (nK > 0) {
        g.save(); g.globalAlpha = Math.min(1, nK);
        const x = -26, y = -122, w = 96, h = 64;
        rr(g, x, y, w, h, 4); inkFill(g, C.butterSoft || C.paper, 1.6);
        text(g, '!', x + 10, y + 16, 13, C.redInk);
        text(g, 'адрес', x + 22, y + 22, 6.5, C.ink, 'left');
        words(g, x + 22, y + 30, 60, 3, C.soft, 1.6);
        text(g, 'паспорт', x + 22, y + 44, 6.5, C.ink, 'left');
        words(g, x + 22, y + 52, 60, 5, C.soft, 1.6);
        g.restore();
      }
      bigCross(g, 22, -90, 44, 26, xK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'примечания опасны', 30, -34, 8, C.umber);
        g.restore();
      }
    },
  };

  SC['ax2-minimize'] = {
    dur: 6,
    width: 380,
    label: 'Минимизация колонок: было 11 полос, три лишние гаснут — остаётся 8.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let cK = 0, dimK = 0, okK = 0, capK = 0;
      const drop = [2, 5, 9];
      if (T < 0) {
        cK = 0.9; okK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.3, 0.8)) * fade;
        dimK = seg(T, 1.4, 2.2) * fade;
        okK = seg(T, 2.6, 3.0) * fade;
        capK = E.back(seg(T, 3.2, 3.6)) * (1 - seg(T, 5.1, 5.4)) * fade;
      }
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, -88, -128, 176, 82, 5); inkFill(g, C.paper, 1.6);
        for (let i = 0; i < 11; i++) {
          const sx = -80 + i * 14.5;
          const isDrop = drop.indexOf(i) >= 0;
          const a = isDrop ? 1 - dimK : 1;
          if (a <= 0.02) { continue; }
          g.globalAlpha = Math.min(1, cK) * a;
          g.fillStyle = isDrop ? C.red : C.chip;
          g.strokeStyle = C.ink; g.lineWidth = 1.1;
          g.fillRect(sx, -118, 10, 62);
          g.strokeRect(sx, -118, 10, 62);
        }
        g.globalAlpha = 1;
        g.restore();
      }
      text(g, 'было 11', -116, -70, 6.5, C.muted);
      text(g, 'осталось 8', 116, -70, 6.5, C.muted);
      tickBadge(g, 116, -104, okK, 9);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'минимум колонок', 0, -28, 8, C.umber);
        g.restore();
      }
    },
  };

  SC['ax2-control'] = {
    dur: 6.5,
    width: 380,
    label: 'Контроль: строк и суммы до и после одинаковы, поиск чувствительного даёт ноль.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let aK = 0, bK = 0, eqK = 0, okK = 0, lupK = 0, capK = 0;
      if (T < 0) {
        aK = bK = 0.9; eqK = okK = lupK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        aK = E.back(seg(T, 0.3, 0.7)) * fade;
        bK = E.back(seg(T, 1.1, 1.5)) * fade;
        eqK = E.back(seg(T, 1.9, 2.3)) * fade;
        okK = seg(T, 2.7, 3.1) * fade;
        lupK = E.back(seg(T, 3.3, 3.7)) * fade;
        capK = E.back(seg(T, 4.1, 4.5)) * (1 - seg(T, 5.6, 5.9)) * fade;
      }
      function numCard(g, x, y, title, k) {
        if (k <= 0) { return; }
        g.save(); g.globalAlpha = Math.min(1, k);
        rr(g, x, y, 88, 36, 4); inkFill(g, C.paper, 1.5);
        text(g, title, x + 44, y + 11, 6.5, C.muted);
        text(g, '6 780', x + 44, y + 26, 9, C.ink);
        g.restore();
      }
      numCard(g, -148, -112, 'до', aK);
      numCard(g, 60, -112, 'после', bK);
      if (eqK > 0) {
        g.save(); g.globalAlpha = Math.min(1, eqK);
        text(g, '=', 0, -94, 14, C.umber);
        g.restore();
      }
      tickBadge(g, 0, -66, okK, 9);
      // лупа с нулём
      if (lupK > 0) {
        g.save(); g.globalAlpha = Math.min(1, lupK);
        circle(g, -62, -52, 11);
        inkFill(g, C.paper, 1.5);
        text(g, '0', -62, -48.5, 9, C.ink);
        ln(g, -54, -44, -46, -36, 2.4);
        g.restore();
      }
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'строки и суммы те же', 44, -38, 8, C.umber);
        g.restore();
      }
    },
  };

  SC['ax2-artifacts'] = {
    dur: 6,
    width: 380,
    label: 'Сдаём три вещи: регламент, паспорт, чистый файл. Ключ остаётся у вас.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let k1 = 0, k2 = 0, k3 = 0, keyK = 0, xK = 0, capK = 0;
      if (T < 0) {
        k1 = k2 = k3 = keyK = xK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        k1 = E.back(seg(T, 0.3, 0.7)) * fade;
        k2 = E.back(seg(T, 1.0, 1.4)) * fade;
        k3 = E.back(seg(T, 1.7, 2.1)) * fade;
        keyK = E.back(seg(T, 2.5, 2.9)) * fade;
        xK = seg(T, 3.1, 3.5) * fade;
        capK = E.back(seg(T, 3.8, 4.2)) * (1 - seg(T, 5.1, 5.4)) * fade;
      }
      signCard(g, -108, -100, 76, 26, 'регламент', k1, 8);
      signCard(g, 0, -100, 68, 26, 'паспорт', k2, 8);
      signCard(g, 106, -100, 84, 26, 'чистый файл', k3, 8);
      // ключ: перечёркнут и отложен в сторону
      signCard(g, 128, -44, 48, 22, 'ключ', keyK, 8);
      bigCross(g, 128, -44, 22, 10, xK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'портфель урока', 0, -74, 7.5, C.muted);
        text(g, 'ключ не сдаём', 40, -16, 6.5, C.umber);
        g.restore();
      }
    },
  };

  SC['ax2-bridge'] = {
    dur: 6,
    width: 380,
    label: 'Мост дальше: по чистым данным будем считать столбцы словами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = 118;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let lK = 0, arrK = 0, rK = 0, doneK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        lK = rK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.75)) * fade;
        arrK = seg(T, 1.2, 1.8) * fade;
        rK = E.back(seg(T, 1.6, 2.05)) * fade;
        doneK = seg(T, 3.0, 3.4) * fade;
        capK = E.back(seg(T, 3.6, 4.0)) * (1 - seg(T, 5.1, 5.4)) * fade;
        anya = mix(anya, P({ head: [-5, -112] }, anya),
          E.soft(seg(T, 2.0, 2.5)) * (1 - E.soft(seg(T, 4.4, 4.8))));
      }
      if (lK > 0) {
        g.save(); g.globalAlpha = Math.min(1, lK);
        fileCard(g, -148, -118, 0, 0, true);
        g.restore();
      }
      fig(g, anya, AX, 0, { sx: -1, ink: INK, far: INK_FAR });
      if (rK > 0) {
        g.save(); g.globalAlpha = Math.min(1, rK);
        fileCard(g, 46, -118, seg(T, 2.4, 3.2) * (T >= 0 ? 1 : 0), doneK);
        g.restore();
      }
      arrow(g, [[-70, -92], [36, -92]], { k: arrK, col: C.umber, head: 7 });
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'дальше: столбцы словами', -20, -34, 8, C.umber);
        g.restore();
      }
    },
  };
})();
