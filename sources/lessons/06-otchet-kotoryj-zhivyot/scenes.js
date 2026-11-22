// Урок 6 «Отчёт, который живёт»: 17 стик-сцен по репликам сценария.
// Load after stick.js: <stick-scene scene="ax6-intro" play="view"></stick-scene>
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, L2, mix, fig, inkFill, rr, ln, poly, circle, text, seg, clamp, lerp, breathe, pulse, bubble, words, tickBadge, sparks, arrow, arcPt, partial } = R;

  const ORG = '#d97757', ORG_FAR = '#e8b7a3';          // агент-робот
  const INK = C.ink, INK_FAR = C.far;                   // Аня (герой)

  // ---------- локальные хелперы ----------

  // табличка-слово
  function signCard(g, cx, cy, w, h, s, k, size, col) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    const x = cx - w / 2, y = cy - h / 2;
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.6);
    text(g, s, cx, cy + (size || 9) * 0.35, size || 9, col || C.ink);
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

  // мини-ломаная в прямоугольнике (x,y,w,h); k = 0..1 прорисовка
  function lineMini(g, x, y, w, h, k, vals, col, lw) {
    if (k <= 0) { return; }
    const pts = vals.map((v, i) => [x + (w * i) / (vals.length - 1), y + h - v * h]);
    strokePath2(g, partial(pts, k), lw || 1.8, col || C.ink);
    // точки
    const drawn = partial(pts, k);
    for (const p of drawn) {
      circle(g, p[0], p[1], 1.6);
      g.fillStyle = col || C.ink; g.fill();
    }
  }

  function strokePath2(g, pts, w, col) {
    if (!pts || pts.length < 2) { return; }
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { g.lineTo(pts[i][0], pts[i][1]); }
    g.stroke();
  }

  // мини-столбики (вертикальные) в прямоугольнике; k = 0..1 вырастают
  function barsMini(g, x, y, w, h, k, vals, colFill) {
    if (k <= 0) { return; }
    const bw = w / vals.length - 2;
    vals.forEach((v, i) => {
      const hh = h * v * E.out(clamp(k * vals.length - i, 0, 1));
      if (hh < 0.5) { return; }
      rr(g, x + i * (w / vals.length) + 1, y + h - hh, bw, hh, 1);
      inkFill(g, colFill || C.butter, 1.1);
    });
  }

  // мини-круговая: n сегментов, k = 0..1 прорисовка по сегментам
  function pieMini(g, cx, cy, r, k, n, fills) {
    if (k <= 0) { return; }
    const total = clamp(k * n, 0, n);
    for (let i = 0; i < Math.ceil(total); i++) {
      const kk = clamp(total - i, 0, 1);
      const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const a1 = -Math.PI / 2 + ((i + kk) / n) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, r, a0, a1);
      g.closePath();
      g.fillStyle = fills[i % fills.length];
      g.fill();
      g.strokeStyle = C.ink; g.lineWidth = n > 10 ? 0.6 : 1.1;
      g.stroke();
    }
    if (k >= 1) {
      circle(g, cx, cy, r);
      g.strokeStyle = C.ink; g.lineWidth = 1.4; g.stroke();
    }
  }

  // значок линейного графика (для мелких иконок)
  function chartIcon(g, cx, cy, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    rr(g, cx - 11, cy - 9, 22, 18, 2); inkFill(g, C.paper, 1.2);
    lineMini(g, cx - 8, cy + 6, 16, 11, 1, [0.2, 0.7, 0.4, 0.9], ORG, 1.4);
    g.restore();
  }

  // курсор-стрелка
  function cursor(g, x, y, k, s) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    g.translate(x, y);
    g.scale(s || 1, s || 1);
    poly(g, [[0, 0], [0, 13], [3.6, 9.6], [6.2, 15], [8.8, 13.8], [6.2, 8.6], [11, 8.4]], true);
    inkFill(g, C.paper, 1.3);
    g.restore();
  }

  // стопка монет
  function coinStack(g, cx, cy, k, n) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    const N = n || 3;
    for (let i = 0; i < N; i++) {
      g.beginPath();
      g.ellipse(cx, cy - i * 5, 9, 3.4, 0, 0, Math.PI * 2);
      inkFill(g, i === N - 1 ? C.butterHi : C.butter, 1.2);
    }
    g.restore();
  }

  // ================= сцены =================

  SC['ax6-intro'] = {
    dur: 6.5,
    width: 380,
    label: 'Лист «Отчёт»: три графика, аккуратное оформление — и отчёт, который обновляется сам.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -102, RX = 102;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let fK = 0, k1 = 0, k2 = 0, k3 = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        fK = k1 = k2 = k3 = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        fK = E.back(seg(T, 0.3, 0.8)) * fade;
        k1 = seg(T, 1.0, 1.7) * fade;
        k2 = seg(T, 1.7, 2.4) * fade;
        k3 = seg(T, 2.4, 3.1) * fade;
        capK = E.back(seg(T, 3.4, 3.8)) * (1 - seg(T, 5.6, 5.9)) * fade;
        anya = mix(anya, P({ hF: [20, -80], head: [5, -113] }, anya),
          E.soft(seg(T, 0.8, 1.3)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      // рамка листа «Отчёт» с тремя мини-графиками
      if (fK > 0) {
        g.save(); g.globalAlpha = Math.min(1, fK);
        rr(g, -44, -126, 88, 70, 5); inkFill(g, C.paper, 1.6);
        text(g, 'Отчёт', 0, -116, 7, C.muted);
        ln(g, -36, -110, 36, -110, 1);
        g.restore();
      }
      lineMini(g, -34, -106, 24, 16, k1, [0.3, 0.8, 0.5, 0.9], ORG, 1.6);
      barsMini(g, -6, -106, 22, 16, k2, [0.5, 0.9, 0.65], C.butter);
      pieMini(g, 25, -98, 8.5, k3, 4, [C.butter, C.sky, C.green, C.chip]);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'лист «Отчёт»', 0, -46, 7.5, C.muted);
        g.restore();
      }
    },
  };

  SC['ax6-start'] = {
    dur: 5.5,
    width: 380,
    label: 'Начинаем с графиков: Аня предлагает, робот кивает и показывает значок графика.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -90, RX = 84;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, icK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; icK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.6, 2.9)) * fade;
        icK = E.back(seg(T, 1.1, 1.5)) * fade;
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.4, 1.7));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
        // робот кивает
        bot = mix(bot, P({ head: [2, -112] }, bot),
          Math.abs(Math.sin(T * 6)) * seg(T, 0.9, 1.2) * (1 - seg(T, 2.4, 2.7)) * fade);
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true, happy: icK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -44, -112, 'начнём с графиков?', qK, { tail: -24, size: 8 });
      chartIcon(g, RX + 40, -100, icK);
    },
  };

  SC['ax6-pick'] = {
    dur: 7,
    width: 380,
    label: 'Правило выбора графика: динамика — линия, сравнение — столбцы, структура — круг.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let k1 = 0, k2 = 0, k3 = 0, capK = 0;
      if (T < 0) {
        k1 = k2 = k3 = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        k1 = E.back(seg(T, 0.4, 0.9)) * fade;
        k2 = E.back(seg(T, 1.1, 1.6)) * fade;
        k3 = E.back(seg(T, 1.8, 2.3)) * fade;
        capK = E.back(seg(T, 2.7, 3.1)) * (1 - seg(T, 6.0, 6.3)) * fade;
      }
      // три карточки-правила
      // карточка 1 — линия
      if (k1 > 0) {
        g.save(); g.globalAlpha = Math.min(1, k1);
        rr(g, -152, -128, 92, 60, 5); inkFill(g, C.paper, 1.6);
        lineMini(g, -140, -118, 68, 20, seg(T, 0.6, 1.3), [0.25, 0.75, 0.45, 0.9], ORG, 1.8);
        text(g, 'динамика', -106, -86, 6.5, C.ink);
        text(g, 'линия', -106, -76, 6.5, C.umber);
        g.restore();
      }
      if (k2 > 0) {
        g.save(); g.globalAlpha = Math.min(1, k2);
        rr(g, -46, -128, 92, 60, 5); inkFill(g, C.paper, 1.6);
        barsMini(g, -36, -120, 72, 22, seg(T, 1.3, 2.0), [0.5, 0.95, 0.7], C.butter);
        text(g, 'сравнение', 0, -86, 6.5, C.ink);
        text(g, 'столбцы', 0, -76, 6.5, C.umber);
        g.restore();
      }
      if (k3 > 0) {
        g.save(); g.globalAlpha = Math.min(1, k3);
        rr(g, 60, -110, 92, 60, 5); inkFill(g, C.paper, 1.6);
        pieMini(g, 106, -91, 11, seg(T, 2.0, 2.7), 4, [C.butter, C.sky, C.green, C.chip]);
        text(g, 'структура', 106, -68, 6.5, C.ink);
        text(g, 'круг', 106, -58, 6.5, C.umber);
        g.restore();
      }
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'правило выбора графика', 0, -46, 8, C.umber);
        g.restore();
      }
    },
  };

  SC['ax6-whypie'] = {
    dur: 5.5,
    width: 380,
    label: 'Слушатель спрашивает, почему круговую ограничиваем, — робот пожимает плечами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 82;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, shrugK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        shrugK = E.soft(seg(T, 1.0, 1.5)) * (1 - E.soft(seg(T, 3.8, 4.2)));
        bot = mix(bot, P({ hF: [12, -80], hB: [-7, -76], head: [0, -117], eb: 0.2 }, bot), shrugK);
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -44, -112, 'почему ограничиваем?', qK, { tail: -24, size: 8 });
    },
  };

  SC['ax6-pie'] = {
    dur: 6.5,
    width: 380,
    label: 'Четыре доли читаются, двадцать — каша: глаз перестаёт различать, график врёт.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let lK = 0, rK = 0, okK = 0, xK = 0, capK = 0;
      if (T < 0) {
        lK = rK = okK = xK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.8)) * fade;
        rK = E.back(seg(T, 1.2, 1.7)) * fade;
        okK = seg(T, 2.1, 2.5) * fade;
        xK = seg(T, 2.6, 3.0) * fade;
        capK = E.back(seg(T, 3.4, 3.8)) * (1 - seg(T, 5.6, 5.9)) * fade;
      }
      // левый круг: 4 крупных сегмента
      if (lK > 0) {
        g.save(); g.globalAlpha = Math.min(1, lK);
        pieMini(g, -72, -86, 26, seg(T, 0.4, 1.5), 4, [C.butter, C.sky, C.green, C.chip]);
        text(g, '4 доли', -72, -44, 7.5, C.ink);
        g.restore();
      }
      tickBadge(g, -38, -108, okK, 9);
      // правый круг: ~20 тонких сегментов
      if (rK > 0) {
        g.save(); g.globalAlpha = Math.min(1, rK);
        pieMini(g, 72, -86, 26, seg(T, 1.3, 2.4), 20,
          [C.faint, C.soft, C.chip, C.line, C.muted]);
        text(g, '20 долей', 72, -44, 7.5, C.ink);
        g.restore();
      }
      bigCross(g, 72, -86, 24, 24, xK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'каша не читается', 0, -22, 7.5, C.umber);
        g.restore();
      }
    },
  };

  SC['ax6-how'] = {
    dur: 5.5,
    width: 380,
    label: 'Как попросить график: робот показывает карточку-шаблон просьбы.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -96, RX = 66;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0, arrK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        cK = E.back(seg(T, 1.0, 1.45)) * fade;
        arrK = seg(T, 1.5, 1.9) * fade;
        bot = mix(bot, P({ hF: [26, -86], head: [5, -114] }, bot),
          E.soft(seg(T, 1.1, 1.6)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -52, -112, 'как попросить график?', qK, { tail: -22, size: 8 });
      // карточка-шаблон просьбы
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, 88, -110, 56, 44, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 3; i++) words(g, 95, -99 + i * 11, 42, i + 1);
        g.restore();
      }
      arrow(g, [[RX + 12, -88], [84, -90]], { k: arrK, col: C.umber, head: 5 });
      text(g, 'шаблон просьбы', 116, -52, 6.5, C.muted);
    },
  };

  SC['ax6-line'] = {
    dur: 7,
    width: 380,
    label: 'Просьба из трёх строк летит к роботу — и вырастает график выручки по месяцам.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -116, RX = -6;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let cardK = 0, chK = 0, lineK = 0, lblK = 0, doneK = 0;
      let cx = -104, cy = -100;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        cardK = 0.9; cy = -104;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        const fly = E.soft(seg(T, 0.5, 1.5));
        cx = -104 + (-6 - (-104)) * fly;
        cy = -104 - 20 * Math.sin(Math.PI * fly);
        cardK = (1 - seg(T, 1.5, 1.9)) * fade;
        chK = seg(T, 2.0, 2.6) * fade;
        lineK = seg(T, 2.6, 3.8) * fade;
        doneK = seg(T, 4.0, 4.4) * fade;
        lblK = E.back(seg(T, 4.2, 4.5)) * (1 - seg(T, 6.0, 6.3)) * fade;
        bot = mix(bot, P({ head: [-4, -112] }, bot), E.soft(seg(T, 1.6, 2.0)) * (1 - E.soft(seg(T, 2.8, 3.1))));
      }
      // карточка просьбы из трёх строк
      if (cardK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cardK);
        rr(g, cx, cy, 56, 36, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 3; i++) words(g, cx + 7, cy + 9 + i * 10, 42, i + 1);
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      // график выручки справа
      if (chK > 0) {
        g.save(); g.globalAlpha = Math.min(1, chK);
        const x = 44, y = -130, w = 108, h = 68;
        rr(g, x, y, w, h, 5); inkFill(g, C.paper, 1.6);
        ln(g, x + 10, y + 10, x + 10, y + h - 10, 1.2);        // ось Y
        ln(g, x + 10, y + h - 10, x + w - 8, y + h - 10, 1.2); // ось X
        for (let i = 0; i < 4; i++) ln(g, x + 8, y + 14 + i * 12, x + 12, y + 14 + i * 12, 1);
        g.restore();
        lineMini(g, x + 16, y + h - 14, w - 30, h - 24, lineK,
          [0.3, 0.55, 0.45, 0.75, 0.6, 0.9], ORG, 1.9);
      }
      tickBadge(g, 138, -72, doneK, 8);
      if (lblK > 0) {
        g.save(); g.globalAlpha = Math.min(1, lblK);
        text(g, 'выручка по месяцам', 98, -50, 7, C.umber);
        g.restore();
      }
    },
  };

  SC['ax6-second'] = {
    dur: 5.5,
    width: 380,
    label: 'Второй график: робот показывает новую пустую рамку диаграммы.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -92, RX = 74;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, fK = 0, arrK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; fK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.0, 2.3)) * fade;
        fK = E.back(seg(T, 1.0, 1.45)) * fade;
        arrK = seg(T, 1.5, 1.9) * fade;
        bot = mix(bot, P({ hF: [24, -88], head: [5, -114] }, bot),
          E.soft(seg(T, 1.0, 1.5)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -50, -112, 'и второй?', qK, { tail: -22, size: 8 });
      // вторая пустая рамка графика
      if (fK > 0) {
        g.save(); g.globalAlpha = Math.min(1, fK);
        rr(g, 88, -102, 50, 42, 4); inkFill(g, C.paper, 1.5);
        ln(g, 96, -94, 96, -68, 1);
        ln(g, 96, -68, 130, -68, 1);
        for (let i = 0; i < 3; i++) ln(g, 94, -90 + i * 8, 98, -90 + i * 8, 1);
        g.restore();
      }
      arrow(g, [[RX + 10, -86], [84, -88]], { k: arrK, col: C.umber, head: 5 });
      text(g, 'график 2', 113, -56, 6.5, C.muted);
    },
  };

  SC['ax6-bars'] = {
    dur: 6.5,
    width: 380,
    label: 'Пять лучших товаров по выручке: горизонтальные столбцы от большего к меньшему.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let cK = 0, rows = 0, arrK = 0, capK = 0;
      const vals = [110, 88, 70, 54, 40];
      const names = ['пылесос', 'кастрюли', 'смарт-часы', 'микроволн.', 'колонка'];
      const nums = ['8,1 млн', '6,7 млн', '5,2 млн', '4,0 млн', '2,9 млн'];
      if (T < 0) {
        cK = 0.9; rows = 5; arrK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.3, 0.8)) * fade;
        rows = clamp((T - 0.9) / 0.9, 0, 5);
        arrK = seg(T, 3.0, 3.5) * fade;
        capK = E.back(seg(T, 3.6, 4.0)) * (1 - seg(T, 5.6, 5.9)) * fade;
      }
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, -150, -132, 190, 92, 5); inkFill(g, C.paper, 1.6);
        text(g, 'топ-5 товаров', -55, -120, 7, C.muted);
        g.restore();
        for (let i = 0; i < 5; i++) {
          const kk = clamp(rows * 5 - i * 5, 0, 5) / 5;
          const rw = vals[i] * E.out(kk);
          if (rw < 1) { continue; }
          g.save(); g.globalAlpha = Math.min(1, cK);
          rr(g, -100, -112 + i * 15, rw, 10, 2);
          inkFill(g, i === 0 ? C.butterHi : C.butter, 1.1);
          text(g, names[i], -104, -104 + i * 15, 5.5, C.ink, 'right');
          if (kk >= 1) text(g, nums[i], -100 + rw + 6, -104 + i * 15, 6, C.ink, 'left');
          g.restore();
        }
      }
      // стрелка вниз «по убыванию»
      if (arrK > 0) {
        g.save(); g.globalAlpha = Math.min(1, arrK);
        arrow(g, [[118, -110], [118, -60]], { k: arrK, col: C.umber, head: 6 });
        text(g, 'по убыванию', 118, -44, 7, C.umber);
        g.restore();
      }
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'подписи значений — обязательно', -55, -28, 7, C.umber);
        g.restore();
      }
    },
  };

  SC['ax6-formatq'] = {
    dur: 5.5,
    width: 380,
    label: 'Дальше оформление: робот берётся за кисть — привести лист к презентационному виду.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 82;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, brK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; brK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.4, 2.7)) * fade;
        brK = E.back(seg(T, 1.0, 1.4)) * fade;
        bot = mix(bot, P({ hF: [24, -84], head: [4, -114] }, bot),
          E.soft(seg(T, 1.0, 1.5)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      fig(g, bot, RX, 0, {
        sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true },
        held: (g2, J) => R.held(g2, J, (hF) => {
          if (brK <= 0) { return; }
          g2.save(); g2.globalAlpha = Math.min(1, brK);
          // карандаш в руке робота
          ln(g2, hF[0] - 3, hF[1] + 3, hF[0] + 8, hF[1] - 8, 2.6, ORG);
          ln(g2, hF[0] + 8, hF[1] - 8, hF[0] + 6, hF[1] - 10, 2.2, C.ink);
          g2.restore();
        }),
      });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -44, -112, 'дальше оформление?', qK, { tail: -24, size: 8 });
    },
  };

  SC['ax6-format'] = {
    dur: 6.5,
    width: 380,
    label: 'До и после: кривые строки наехали друг на друга — стали ровными блоками с числами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let aK = 0, bK = 0, okK = 0, capK = 0;
      if (T < 0) {
        aK = bK = okK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        aK = E.back(seg(T, 0.3, 0.8)) * fade;
        bK = E.back(seg(T, 1.4, 1.9)) * fade;
        okK = seg(T, 2.5, 2.9) * fade;
        capK = E.back(seg(T, 3.2, 3.6)) * (1 - seg(T, 5.6, 5.9)) * fade;
      }
      // «до»: кривые строки разной длины, внахлёст
      if (aK > 0) {
        g.save(); g.globalAlpha = Math.min(1, aK);
        rr(g, -156, -126, 88, 76, 5); inkFill(g, C.paper, 1.6);
        text(g, 'до', -112, -114, 7.5, C.muted);
        const lens = [58, 74, 40, 66, 30];
        for (let i = 0; i < 5; i++) {
          const y0 = -104 + i * 12 + (i % 2 ? 2 : 0);
          ln(g, -148, y0, -148 + lens[i], y0 + (i % 2 ? 2 : -1), 2, C.soft);
        }
        g.restore();
      }
      // «после»: ровные блоки с заголовками и числами
      if (bK > 0) {
        g.save(); g.globalAlpha = Math.min(1, bK);
        rr(g, 8, -126, 88, 76, 5); inkFill(g, C.paper, 1.6);
        text(g, 'после', 52, -114, 7.5, C.muted);
        const heads = ['товар', 'регион', 'менеджер'];
        const nums = ['8 100', '6 700', '5 200'];
        for (let i = 0; i < 3; i++) {
          const y0 = -102 + i * 16;
          const kk = seg(T, 1.9 + i * 0.3, 2.2 + i * 0.3);
          g.save(); g.globalAlpha = Math.min(1, bK) * kk;
          rr(g, 15, y0, 34, 11, 2); inkFill(g, C.chip, 1);
          text(g, heads[i], 32, y0 + 8, 5.5, C.ink);
          text(g, nums[i] + ' р.', 84, y0 + 8, 6, C.ink, 'right');
          g.restore();
        }
        g.restore();
      }
      tickBadge(g, 104, -122, okK, 9);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'ничего не наезжает, числа читаются', -34, -36, 7, C.umber);
        g.restore();
      }
    },
  };

  SC['ax6-slicerq'] = {
    dur: 5.5,
    width: 380,
    label: 'А если руководителю нужен срез по региону? Робот показывает карточку с кнопками.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -94, RX = 70;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0, arrK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.7)) * (1 - seg(T, 2.6, 2.9)) * fade;
        cK = E.back(seg(T, 1.2, 1.65)) * fade;
        arrK = seg(T, 1.7, 2.1) * fade;
        bot = mix(bot, P({ hF: [24, -88], head: [5, -114] }, bot),
          E.soft(seg(T, 1.2, 1.7)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -46, -112, 'срез по региону?', qK, { tail: -24, size: 8 });
      // карточка с кнопками-регионами
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, 88, -102, 48, 56, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 3; i++) {
          rr(g, 94, -94 + i * 16, 36, 12, 3);
          inkFill(g, i === 0 ? C.butter : C.chip, 1.1);
        }
        g.restore();
      }
      arrow(g, [[RX + 10, -90], [84, -92]], { k: arrK, col: C.umber, head: 5 });
      text(g, 'фильтр-срез', 112, -40, 6.5, C.muted);
    },
  };

  SC['ax6-slicer'] = {
    dur: 6.5,
    width: 380,
    label: 'Срез по региону: кнопка «Москва» нажата — оба графика перестраиваются сами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let cK = 0, pressK = 0, a1 = 0, a2 = 0, rebuild = 0, capK = 0;
      const regs = ['Москва', 'Юг', 'Урал'];
      if (T < 0) {
        cK = 0.9; pressK = 1; a1 = a2 = 0.9; rebuild = 1;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.3, 0.8)) * fade;
        pressK = seg(T, 1.2, 1.6) * fade;
        a1 = seg(T, 1.8, 2.3) * fade;
        a2 = seg(T, 2.0, 2.5) * fade;
        rebuild = E.soft(seg(T, 2.3, 3.3)) * fade;
        capK = E.back(seg(T, 3.6, 4.0)) * (1 - seg(T, 5.6, 5.9)) * fade;
      }
      // карточка-срез
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, -150, -118, 64, 74, 5); inkFill(g, C.paper, 1.6);
        text(g, 'регион', -118, -106, 6.5, C.muted);
        for (let i = 0; i < 3; i++) {
          const on = i === 0 ? pressK : 0.35;
          rr(g, -144, -98 + i * 18, 52, 14, 3);
          inkFill(g, i === 0 ? C.butter : C.chip, 1.1);
          g.save(); g.globalAlpha = Math.min(1, cK) * (i === 0 ? 1 : 0.6);
          text(g, regs[i], -118, -88 + i * 18, 7, i === 0 ? C.umber : C.ink);
          g.restore();
          if (i === 0 && on > 0.6) circle(g, -138, -91, 2.4), g.fillStyle = C.umber, g.fill();
        }
        g.restore();
      }
      // стрелки к двум графикам
      arrow(g, [[-84, -100], [-24, -100]], { k: a1, col: C.umber, head: 5 });
      arrow(g, [[-84, -100], [64, -100]], { k: a2, col: C.umber, head: 5 });
      // график 1: столбики перестраиваются
      if (a1 > 0) {
        g.save(); g.globalAlpha = Math.min(1, a1);
        rr(g, -20, -130, 64, 56, 4); inkFill(g, C.paper, 1.5);
        const v0 = [0.9, 0.6, 0.75], v1 = [0.5, 0.85, 0.4];
        barsMini(g, -12, -122, 48, 40, 1, v0.map((v, i) => lerp(v, v1[i], rebuild)), C.butter);
        g.restore();
      }
      // график 2: линия перестраивается
      if (a2 > 0) {
        g.save(); g.globalAlpha = Math.min(1, a2);
        rr(g, 60, -130, 64, 56, 4); inkFill(g, C.paper, 1.5);
        const p0 = [0.3, 0.6, 0.5, 0.8], p1 = [0.6, 0.35, 0.8, 0.5];
        lineMini(g, 68, -122, 48, 40, 1, p0.map((v, i) => lerp(v, p1[i], rebuild)), ORG, 1.8);
        g.restore();
      }
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'одна кнопка — всё перестроилось', -30, -50, 7, C.umber);
        g.restore();
      }
    },
  };

  SC['ax6-liveq'] = {
    dur: 5.5,
    width: 380,
    label: 'Что значит живой отчёт? Робот показывает курсор: сейчас проверим кликом.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 82;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, curK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; curK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.4, 2.7)) * fade;
        curK = E.back(seg(T, 1.1, 1.5)) * fade;
        bot = mix(bot, P({ hF: [22, -86], head: [4, -114] }, bot),
          E.soft(seg(T, 1.1, 1.6)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -44, -112, 'что значит живой?', qK, { tail: -24, size: 8 });
      cursor(g, RX + 34, -96, curK, 1.1);
    },
  };

  SC['ax6-live'] = {
    dur: 6.5,
    width: 380,
    label: 'Картинка перечёркнута — живая сводная разворачивается кликом: плюсик и галочка.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let aK = 0, bK = 0, xK = 0, okK = 0, curK = 0, plusK = 0;
      let curX = 0, curY = 0, clickK = 0;
      if (T < 0) {
        aK = bK = 0.9; xK = okK = 0.9; curK = 0.9; plusK = 1;
        curX = 60; curY = -66;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        aK = E.back(seg(T, 0.3, 0.8)) * fade;
        bK = E.back(seg(T, 1.1, 1.6)) * fade;
        xK = seg(T, 1.8, 2.2) * fade;
        const fly = E.soft(seg(T, 2.4, 3.2));
        curX = -150 + (60 - (-150)) * fly;
        curY = -76 - 14 * Math.sin(Math.PI * fly);
        curK = E.back(seg(T, 2.3, 2.6)) * fade;
        clickK = seg(T, 3.2, 3.5) * fade;
        plusK = seg(T, 3.4, 3.9) * fade;
        okK = seg(T, 4.0, 4.4) * fade;
      }
      // левая карточка: «картинка»
      if (aK > 0) {
        g.save(); g.globalAlpha = Math.min(1, aK);
        rr(g, -148, -126, 76, 62, 5); inkFill(g, C.paper, 1.6);
        text(g, 'картинка', -110, -112, 7, C.muted);
        words(g, -140, -100, 60, 2, C.soft, 1.8);
        words(g, -140, -90, 52, 4, C.soft, 1.8);
        words(g, -140, -80, 44, 6, C.soft, 1.8);
        g.restore();
      }
      bigCross(g, -110, -95, 32, 26, xK);
      // правая карточка: живая сводная
      if (bK > 0) {
        g.save(); g.globalAlpha = Math.min(1, bK);
        rr(g, 22, -126, 76, 62, 5); inkFill(g, C.paper, 1.6);
        text(g, 'сводная', 60, -112, 7, C.muted);
        ln(g, 30, -104, 90, -104, 1);
        for (let i = 0; i < 3; i++) {
          const on = i === 0 ? 1 : plusK;
          g.save(); g.globalAlpha = Math.min(1, bK) * (i === 0 ? 1 : plusK);
          ln(g, 34, -96 + i * 10, 40, -96 + i * 10, 1.8, i === 0 ? C.umber : C.ink);
          words(g, 46, -96 + i * 10, 40, i + 2, C.soft, 1.6);
          g.restore();
        }
        // плюсик-разворот
        if (plusK > 0) {
          g.save(); g.globalAlpha = Math.min(1, plusK);
          rr(g, 84, -122, 10, 10, 2); inkFill(g, C.butterSoft, 1);
          ln(g, 86.5, -117, 91.5, -117, 1.5, C.umber);
          ln(g, 89, -119.5, 89, -114.5, 1.5, C.umber);
          g.restore();
        }
        g.restore();
      }
      tickBadge(g, 108, -122, okK, 8);
      // курсор кликает по правой карточке (лёгкий «клик»-сдвиг)
      cursor(g, curX, curY, curK, 1.1);
      if (clickK > 0 && clickK < 1) circle(g, 60, -80, 4 + clickK * 8), g.strokeStyle = C.umber, g.lineWidth = 1.4, g.stroke();
    },
  };

  SC['ax6-update'] = {
    dur: 6.5,
    width: 380,
    label: 'Проверка обновления: 20 новых строк влетают в таблицу сделок, лист подсвечен.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -128, RX = 118;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let tblK = 0, n = 0, hiK = 0, qK = 0, doneK = 0;
      let stackX = 40;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        tblK = 0.9; n = 20; doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 1.8, 2.1)) * fade;
        tblK = E.back(seg(T, 0.4, 0.9)) * fade;
        n = clamp((T - 1.2) / 2.0, 0, 1) * 20 * fade;
        stackX = 40 - 76 * E.soft(seg(T, 1.2, 3.2));
        hiK = seg(T, 3.4, 3.8) * fade;
        doneK = seg(T, 3.8, 4.2) * fade;
      }
      // таблица сделок
      if (tblK > 0) {
        g.save(); g.globalAlpha = Math.min(1, tblK);
        rr(g, -58, -132, 92, 80, 5);
        inkFill(g, hiK > 0.3 ? C.butterSoft : C.paper, 1.6);
        text(g, 'сделки', -12, -120, 6.5, C.muted);
        ln(g, -58, -114, 34, -114, 1.1);
        // строки: старые 8 + новые тонкие по очереди
        for (let i = 0; i < 8; i++) ln(g, -50, -107 + i * 7, 26, -107 + i * 7, 1, C.soft);
        const nn = Math.floor(n);
        for (let i = 0; i < nn; i++) {
          const kk = clamp(n - i, 0, 1);
          g.save(); g.globalAlpha = kk * 0.9;
          ln(g, -50, -51 + i * 3.2, 26, -51 + i * 3.2, 1.2, ORG);
          g.restore();
        }
        g.restore();
      }
      // летящая стопка тонких строк
      if (T >= 0 && n < 20) {
        g.save(); g.globalAlpha = 0.85;
        for (let i = 0; i < 6; i++) ln(g, stackX, -108 + i * 3.4, stackX + 36, -108 + i * 3.4, 1.4, ORG);
        text(g, '20 строк', stackX + 18, -114, 6.5, C.umber);
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -96, -112, 'как проверить?', qK, { tail: -22, size: 8 });
      sparks(g, -12, -128, seg(T, 3.8, 4.4), 10, 6);
      if (doneK > 0) text(g, 'обновлено', 34, -44, 7, C.umber);
    },
  };

  SC['ax6-bridge'] = {
    dur: 6.5,
    width: 380,
    label: 'Контроль: итог сводной равен сумме столбца, расхождение 0. Дальше — бюджет.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let aK = 0, eqK = 0, bK = 0, badgeK = 0, coinK = 0, capK = 0;
      if (T < 0) {
        aK = eqK = bK = badgeK = coinK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        aK = E.back(seg(T, 0.3, 0.75)) * fade;
        eqK = E.back(seg(T, 1.1, 1.5)) * fade;
        bK = E.back(seg(T, 1.7, 2.15)) * fade;
        badgeK = E.back(seg(T, 2.6, 3.0)) * fade;
        coinK = E.back(seg(T, 3.4, 3.8)) * fade;
        capK = E.back(seg(T, 4.0, 4.4)) * (1 - seg(T, 5.8, 6.1)) * fade;
      }
      function numCard(g, x, y, title, k) {
        if (k <= 0) { return; }
        g.save(); g.globalAlpha = Math.min(1, k);
        rr(g, x, y, 110, 40, 5); inkFill(g, C.paper, 1.6);
        text(g, title, x + 55, y + 12, 6.5, C.muted);
        text(g, '28 534 230,50', x + 55, y + 28, 8, C.ink);
        g.restore();
      }
      numCard(g, -158, -128, 'итог сводной', aK);
      numCard(g, 48, -128, 'сумма столбца', bK);
      if (eqK > 0) {
        g.save(); g.globalAlpha = Math.min(1, eqK);
        text(g, '=', 0, -100, 15, C.umber);
        g.restore();
      }
      signCard(g, 0, -70, 84, 20, 'расхождение 0', badgeK, 7.5, C.greenInk);
      coinStack(g, -30, -30, coinK, 4);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'дальше: бюджет', 22, -26, 8, C.umber, 'left');
        g.restore();
      }
    },
  };
})();
