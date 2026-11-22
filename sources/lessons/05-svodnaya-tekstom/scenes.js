// Урок 5 «Сводная текстом»: 17 стик-сцен по репликам сценария.
// Load after stick.js: <stick-scene scene="ax5-intro" play="view"></stick-scene>
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, mix, fig, inkFill, rr, ln, circle, text, seg, clamp, lerp, breathe, pulse, bubble, words, tickBadge, sparks, arrow, partial, strokePath, pill } = R;

  const ORG = '#d97757', ORG_FAR = '#e8b7a3';          // агент-робот
  const INK = C.ink, INK_FAR = C.far;                   // Аня (герой)

  // ---------- локальные хелперы ----------

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

  // карточка с числом и подписью
  function numCard(g, x, y, s, k, title, w) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const W = w || 96, h = 32;
    rr(g, x, y, W, h, 4); inkFill(g, C.paper, 1.5);
    text(g, title, x + W / 2, y + 9, 6, C.muted);
    text(g, s, x + W / 2, y + 22, 7.5, C.ink);
    g.restore();
  }

  // стопка «много строк»: карточка с тонкими полосками
  function stripCard(g, x, y, k, n) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const w = 52, h = 62, m = n || 9;
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    for (let i = 0; i < m; i++) { ln(g, x + 6, y + 8 + i * 6, x + w - 6, y + 8 + i * 6, 1); }
    g.restore();
  }

  // сетка-сводная: шапка + nrow строк + жирная итоговая строка (totK)
  function pivotGrid(g, x, y, cw, ch, ncol, nrow, k, totK) {
    if (k <= 0) { return; }
    const w = cw * ncol, h = ch * (nrow + 2);
    g.save();
    g.globalAlpha = Math.min(1, k);
    rr(g, x, y, w, h, 3); inkFill(g, C.paper, 1.4);
    g.fillStyle = C.sky;
    g.fillRect(x + 1, y + 1, w - 2, ch - 2);
    for (let c = 1; c < ncol; c++) { ln(g, x + c * cw, y + 1, x + c * cw, y + h - 1, 0.8, C.faint); }
    for (let r = 1; r < nrow + 2; r++) { ln(g, x + 1, y + r * ch, x + w - 1, y + r * ch, 0.8, C.faint); }
    // псевдозначения в ячейках
    for (let r = 0; r < nrow; r++) {
      for (let c = 0; c < ncol; c++) {
        ln(g, x + c * cw + 4, y + (r + 1) * ch + ch / 2, x + c * cw + cw - 5, y + (r + 1) * ch + ch / 2, 1.4, C.soft);
      }
    }
    g.restore();
    if (totK > 0) {
      g.save();
      g.globalAlpha = Math.min(1, totK);
      g.fillStyle = C.butter;
      g.fillRect(x + 1, y + h - ch + 1, w - 2, ch - 2);
      ln(g, x + 1, y + h - ch, x + w - 1, y + h - ch, 1.6);
      g.restore();
    }
    return { w, h };
  }

  // кубик-сводная 3×3 с итоговой строкой
  function cubeGrid(g, x, y, k, totK) {
    if (k <= 0) { return; }
    const s = 17, w = s * 3;
    g.save();
    g.globalAlpha = Math.min(1, k);
    rr(g, x, y, w, w, 3); inkFill(g, C.paper, 1.4);
    for (let i = 1; i < 3; i++) {
      ln(g, x + i * s, y + 1, x + i * s, y + w - 1, 0.8, C.faint);
      ln(g, x + 1, y + i * s, x + w - 1, y + i * s, 0.8, C.faint);
    }
    // псевдозначения в ячейках: куб-сводная не должен выглядеть пустым
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        ln(g, x + c * s + 4, y + r * s + s / 2, x + c * s + s - 5, y + r * s + s / 2, 1.3, C.soft);
      }
    }
    g.restore();
    if (totK > 0) {
      g.save();
      g.globalAlpha = Math.min(1, totK);
      g.fillStyle = C.butter;
      g.fillRect(x + 1, y + 2 * s + 1, w - 2, s - 2);
      ln(g, x + 1, y + 2 * s, x + w - 1, y + 2 * s, 1.5);
      g.restore();
    }
  }

  // маленькая табличка (2 строки псевдотекста)
  function miniTable(g, cx, cy, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const w = 44, h = 26, x = cx - w / 2, y = cy - h / 2;
    rr(g, x, y, w, h, 3); inkFill(g, C.paper, 1.3);
    ln(g, x + 1, y + 9, x + w - 1, y + 9, 0.8, C.faint);
    ln(g, x + w / 2, y + 1, x + w / 2, y + h - 1, 0.8, C.faint);
    ln(g, x + 4, y + 16, x + w / 2 - 4, y + 16, 1.3, C.soft);
    ln(g, x + w / 2 + 4, y + 16, x + w - 4, y + 16, 1.3, C.soft);
    g.restore();
  }

  // календарик: шапка + сетка 4×3
  function calCard(g, x, y, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const w = 42, h = 36;
    rr(g, x, y, w, h, 3); inkFill(g, C.paper, 1.4);
    g.fillStyle = C.sky;
    g.fillRect(x + 1, y + 1, w - 2, 8);
    for (let c = 1; c < 4; c++) { ln(g, x + c * (w / 4), y + 9, x + c * (w / 4), y + h - 1, 0.8, C.faint); }
    for (let r = 1; r < 3; r++) { ln(g, x + 1, y + 9 + r * ((h - 9) / 3), x + w - 1, y + 9 + r * ((h - 9) / 3), 0.8, C.faint); }
    g.restore();
  }

  // лупа
  function magGlass(g, x, y, r, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    circle(g, x, y, r);
    inkFill(g, 'rgba(255,255,255,0.4)', 1.8);
    ln(g, x + r * 0.7, y + r * 0.7, x + r * 1.6, y + r * 1.6, 2.4);
    g.restore();
  }

  // большой красный крест
  function bigCross(g, cx, cy, w, h, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    g.strokeStyle = '#b91c1c';
    ln(g, cx - w, cy - h, cx + w, cy + h, 2.4, '#b91c1c');
    ln(g, cx + w, cy - h, cx - w, cy + h, 2.4, '#b91c1c');
    g.restore();
  }

  // линейный график-ломаная в карточке (x, y — левый-верх, w×h)
  function chartCard(g, x, y, w, h, k, lineK) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    g.restore();
    if (lineK <= 0) { return; }
    const x0 = x + 10, y0 = y + h - 10, x1 = x + w - 10, y1 = y + 10;
    ln(g, x0, y1, x0, y0, 1.3, C.muted);
    ln(g, x0, y0, x1, y0, 1.3, C.muted);
    const pts = [
      [x0 + 6, y0 - (y0 - y1) * 0.45],
      [x0 + 20, y0 - (y0 - y1) * 0.62],
      [x0 + 34, y0 - (y0 - y1) * 0.3],
      [x0 + 46, y0 - (y0 - y1) * 0.75],
      [x0 + 58, y0 - (y0 - y1) * 0.68],
      [x1 - 4, y0 - (y0 - y1) * 0.9],
    ];
    strokePath(g, partial(pts, lineK), 1.8, C.umber);
    for (const p of pts) {
      if (p[0] <= x0 + 6 + (x1 - 4 - x0 - 6) * lineK) {
        circle(g, p[0], p[1], 1.6);
        g.fillStyle = C.umber;
        g.fill();
      }
    }
  }

  // ================= сцены =================

  SC['ax5-intro'] = {
    dur: 6.5,
    width: 380,
    label: 'Тысяча строк выгрузки превращается в компактный кубик-сводную с итогом.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -132, RX = 132;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let sK = 0, aK = 0, cK = 0, totK = 0, lblK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        sK = aK = cK = 0.9; totK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        sK = E.back(seg(T, 0.3, 0.8)) * fade;
        aK = seg(T, 1.2, 1.7) * fade;
        cK = E.back(seg(T, 1.7, 2.2)) * fade;
        totK = seg(T, 2.4, 2.8) * fade;
        lblK = seg(T, 2.8, 3.2) * fade;
        anya = mix(anya, P({ hF: [26, -96], head: [7, -113] }, anya),
          E.soft(seg(T, 0.8, 1.3)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      stripCard(g, -76, -112, sK, 10);
      text(g, '1800 строк', -50, -42, 7, C.muted);
      arrow(g, [[-16, -84], [24, -84]], { k: aK, col: C.umber, head: 6 });
      cubeGrid(g, 36, -104, cK, totK);
      text(g, 'месяцы', 62, -112, 6.5, C.muted);
      text(g, 'итог', 62, -42, 8, C.ink);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: totK, blink: true, happy: totK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      if (lblK > 0) {
        g.save(); g.globalAlpha = Math.min(1, lblK);
        text(g, 'сводная текстом', 0, -130, 8, C.umber);
        g.restore();
      }
      sparks(g, 62, -110, seg(T, 2.4, 3.0), 12, 5);
    },
  };

  SC['ax5-hard'] = {
    dur: 6,
    width: 380,
    label: 'Сложно ли? Робот пожимает плечами и показывает простую схему из трёх блоков.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -104, RX = 96;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, s1 = 0, s2 = 0, s3 = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; s1 = s2 = s3 = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.6)) * (1 - seg(T, 1.9, 2.2)) * fade;
        s1 = E.back(seg(T, 1.4, 1.8)) * fade;
        s2 = E.back(seg(T, 1.8, 2.2)) * fade;
        s3 = E.back(seg(T, 2.2, 2.6)) * fade;
        // робот пожимает плечами (наклон головы), потом показывает на схему
        bot = mix(bot, P({ head: [-6, -112], hF: [20, -88] }, bot),
          E.soft(seg(T, 0.5, 0.9)) * (1 - E.soft(seg(T, 1.6, 2.0))));
        bot = mix(bot, P({ hF: [30, -78], head: [4, -114] }, bot),
          E.soft(seg(T, 1.6, 2.0)) * (1 - E.soft(seg(T, 4.6, 5.0))));
        const talkA = seg(T, 0.3, 0.6) * (1 - seg(T, 1.9, 2.2));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -50, -114, 'сложно?', qK, { tail: -26, size: 8 });
      // три блока-шага
      if (s1 > 0) {
        g.save(); g.globalAlpha = Math.min(1, s1);
        rr(g, -56, -100, 30, 16, 3); inkFill(g, C.chip, 1.3);
        text(g, '1', -41, -89, 7, C.ink);
        g.restore();
      }
      if (s2 > 0) {
        g.save(); g.globalAlpha = Math.min(1, s2);
        rr(g, -20, -100, 30, 16, 3); inkFill(g, C.chip, 1.3);
        text(g, '2', -5, -89, 7, C.ink);
        g.restore();
      }
      if (s3 > 0) {
        g.save(); g.globalAlpha = Math.min(1, s3);
        rr(g, 16, -100, 30, 16, 3); inkFill(g, C.chip, 1.3);
        text(g, '3', 31, -89, 7, C.ink);
        g.restore();
      }
      text(g, 'просто', -5, -70, 7, C.muted);
    },
  };

  SC['ax5-easy'] = {
    dur: 6,
    width: 380,
    label: 'Раньше — кнопки и меню, сейчас — фраза словами, и агент сам собирает таблицу.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -150;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      let cK = 0, xK = 0, bK = 0, aK = 0, gK = 0, totK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        cK = xK = 0.9; bK = 0.9; aK = 0.9; gK = totK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.3, 0.8)) * fade;
        xK = seg(T, 1.1, 1.5) * fade;
        bK = E.back(seg(T, 1.6, 2.0)) * (1 - seg(T, 3.8, 4.1)) * fade;
        aK = seg(T, 2.4, 2.9) * fade;
        gK = E.back(seg(T, 2.9, 3.4)) * fade;
        totK = seg(T, 3.7, 4.1) * fade;
        anya = mix(anya, P({ hF: [34, -104], head: [6, -113] }, anya),
          E.soft(seg(T, 1.6, 2.1)) * (1 - E.soft(seg(T, 4.2, 4.6))));
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      // перечёркнутая карточка с кнопками и меню
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, -128, -116, 48, 54, 4); inkFill(g, C.paper, 1.5);
        words(g, -121, -106, 34, 1);
        words(g, -121, -96, 34, 2);
        rr(g, -121, -84, 10, 8, 1.5); inkFill(g, C.chip, 1);
        rr(g, -107, -84, 10, 8, 1.5); inkFill(g, C.chip, 1);
        g.restore();
      }
      bigCross(g, -104, -89, 26, 30, xK);
      bubble(g, -14, -114, 'опиши словами', bK, { tail: -22, size: 8 });
      arrow(g, [[18, -96], [46, -96]], { k: aK, col: C.umber, head: 6 });
      pivotGrid(g, 52, -122, 16, 10, 3, 2, gK, totK);
      text(g, 'было', -104, -54, 7, C.muted);
      text(g, 'стало', 76, -54, 7, C.muted);
    },
  };

  SC['ax5-what'] = {
    dur: 5.5,
    width: 380,
    label: 'Что описывать? Робот показывает четыре пустых блока будущего запроса.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -104, RX = 92;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, b = [0, 0, 0, 0];
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; b = [0.9, 0.9, 0.9, 0.9];
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.0, 2.3)) * fade;
        for (let i = 0; i < 4; i++) { b[i] = E.back(seg(T, 1.0 + i * 0.4, 1.4 + i * 0.4)) * fade; }
        bot = mix(bot, P({ hF: [30, -78], head: [4, -114] }, bot),
          E.soft(seg(T, 0.9, 1.3)) * (1 - E.soft(seg(T, 3.8, 4.2))));
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 2.0, 2.3));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -52, -114, 'что описывать?', qK, { tail: -26, size: 8 });
      for (let i = 0; i < 4; i++) {
        if (b[i] <= 0) { continue; }
        g.save(); g.globalAlpha = Math.min(1, b[i]);
        rr(g, -46 + i * 32, -108, 26, 20, 3); inkFill(g, C.paper, 1.3);
        g.setLineDash([3, 3]);
        g.strokeStyle = C.muted; g.lineWidth = 1.1;
        g.strokeRect(-43 + i * 32, -105, 20, 14);
        g.setLineDash([]);
        g.restore();
      }
      text(g, 'четыре пустых блока', 3, -78, 7, C.muted);
    },
  };

  SC['ax5-anatomy'] = {
    dur: 7,
    width: 380,
    label: 'Ключевая схема сводной: строки, столбцы, значения, итоги, проверка — загораются по очереди.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -140;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      let cardK = 0, lblK = 0, capK = 0;
      let lit = 0;
      const names = ['строки', 'столбцы', 'значения', 'итоги', 'проверка'];
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        cardK = 0.9; lit = 5; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cardK = E.back(seg(T, 0.3, 0.7)) * fade;
        lblK = seg(T, 0.6, 0.9) * fade;
        lit = clamp((T - 1.2) / 0.6, 0, 5);
        capK = E.back(seg(T, 4.6, 5.0)) * (1 - seg(T, 6.2, 6.5)) * fade;
        // рука Ани отсчитывает блоки
        const at = [1.2, 1.8, 2.4, 3.0, 3.6];
        let lift = 0;
        for (let i = 0; i < 5; i++) {
          const p = (T - at[i]) / 0.6;
          if (p > 0 && p < 1) { lift = Math.max(lift, Math.pow(Math.sin(Math.PI * p), 2)); }
        }
        anya = mix(anya, P({ hF: [24, -116], head: [6, -115] }, anya), lift * 0.9);
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      if (cardK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cardK);
        rr(g, -124, -122, 246, 30, 5); inkFill(g, C.paper, 1.6);
        g.restore();
      }
      for (let i = 0; i < 5; i++) {
        const on = clamp(lit - i, 0, 1);
        if (lblK <= 0) { continue; }
        g.save();
        g.globalAlpha = Math.min(1, lblK);
        const x = -118 + i * 49;
        rr(g, x, -118, 44, 22, 3);
        inkFill(g, on > 0.5 ? C.butter : C.chip, 1.3);
        text(g, names[i], x + 22, -104, 6.5, on > 0.5 ? C.ink : C.muted);
        g.restore();
      }
      text(g, 'пять частей сводной', 0, -70, 8, C.umber);
    },
  };

  SC['ax5-example'] = {
    dur: 5.5,
    width: 380,
    label: '«Например?» — робот в ожидании, впереди полный пример запроса.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -84, RX = 84;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, dotsK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; dotsK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.35, 0.7)) * (1 - seg(T, 2.4, 2.7)) * fade;
        dotsK = E.back(seg(T, 1.4, 1.9)) * fade;
        bot = mix(bot, P({ head: [-5, -113], chest: [-2, -90] }, bot),
          E.soft(seg(T, 0.6, 1.0)) * (1 - E.soft(seg(T, 3.6, 4.0))));
        const talk = seg(T, 0.35, 0.7) * (1 - seg(T, 1.6, 1.9));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -40, -114, 'например?', qK, { tail: -26, size: 8 });
      if (dotsK > 0) {
        g.save(); g.globalAlpha = Math.min(1, dotsK);
        for (let i = 0; i < 3; i++) {
          circle(g, -6 + i * 7, -92, 1.6);
          g.fillStyle = C.muted; g.fill();
        }
        g.restore();
      }
    },
  };

  SC['ax5-request'] = {
    dur: 7,
    width: 380,
    label: 'Запрос из трёх строк летит к роботу — и вырастает сводная «регион × месяц» с итогом.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -128, RX = 56;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let cardK = 0, tblK = 0, totK = 0, capK = 0;
      let cx = -108, cy = -108;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        cardK = 0.9; tblK = totK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        const fly = E.soft(seg(T, 0.5, 1.6));
        cx = -108 + (44 - (-108)) * fly;
        cy = -108 - 22 * Math.sin(Math.PI * fly);
        cardK = (1 - seg(T, 1.6, 2.0)) * fade;
        tblK = seg(T, 2.2, 3.0) * fade;
        totK = seg(T, 3.3, 3.7) * fade;
        capK = E.back(seg(T, 3.8, 4.1)) * (1 - seg(T, 5.8, 6.1)) * fade;
        bot = mix(bot, P({ head: [-4, -112] }, bot),
          E.soft(seg(T, 1.7, 2.1)) * (1 - E.soft(seg(T, 2.8, 3.2))));
      }
      // карточка запроса из трёх строк
      if (cardK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cardK);
        rr(g, cx, cy, 56, 34, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 3; i++) { words(g, cx + 6, cy + 9 + i * 10, 44, i + 1); }
        g.restore();
      }
      pivotGrid(g, 94, -110, 16, 9, 4, 4, tblK, totK);
      text(g, 'регион × месяц', 126, -48, 7, C.muted);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: totK, blink: true, happy: totK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      text(g, 'запрос', -108, -66, 8, C.muted);
      sparks(g, 112, -96, seg(T, 3.3, 3.9), 12, 5);
      bubble(g, -30, -114, 'построй сводную', capK, { tail: -26, size: 8 });
      tickBadge(g, 126, -30, totK, 8);
    },
  };

  SC['ax5-order'] = {
    dur: 6,
    width: 380,
    label: 'Почему порядок оговариваем отдельно? Робот показывает на календарик.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -104, RX = 96;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, calK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; calK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        calK = E.back(seg(T, 1.2, 1.7)) * fade;
        bot = mix(bot, P({ hF: [30, -78], head: [4, -114] }, bot),
          E.soft(seg(T, 1.1, 1.5)) * (1 - E.soft(seg(T, 4.2, 4.6))));
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 2.2, 2.5));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -52, -114, 'почему порядок?', qK, { tail: -26, size: 8 });
      calCard(g, -21, -116, calK);
      text(g, 'янв → дек', 0, -68, 7, C.muted);
    },
  };

  SC['ax5-alpha'] = {
    dur: 6.5,
    width: 380,
    label: 'По алфавиту апрель встанет раньше января: алфавит ломает порядок.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -142;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let lK = 0, okK = 0, rK = 0, xK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        lK = rK = 0.9; okK = xK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.8)) * fade;
        okK = seg(T, 1.1, 1.5) * fade;
        rK = E.back(seg(T, 1.7, 2.2)) * fade;
        xK = seg(T, 2.5, 2.9) * fade;
        capK = E.back(seg(T, 3.2, 3.6)) * (1 - seg(T, 5.4, 5.7)) * fade;
        anya = mix(anya, P({ hF: [26, -96], head: [7, -113] }, anya),
          E.soft(seg(T, 2.3, 2.8)) * (1 - E.soft(seg(T, 4.6, 5.0))));
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      signCard(g, -66, -102, 84, 24, 'янв фев мар', lK, 7.5);
      tickBadge(g, -18, -116, okK, 8);
      signCard(g, 54, -102, 92, 24, 'апр авг дек янв', rK, 7.5);
      bigCross(g, 54, -102, 46, 15, xK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'алфавит ломает порядок', 0, -56, 8, C.umber);
        g.restore();
      }
      text(g, 'как надо', -66, -84, 6.5, C.muted);
      text(g, 'по алфавиту', 54, -84, 6.5, C.muted);
    },
  };

  SC['ax5-check'] = {
    dur: 6,
    width: 380,
    label: 'Как проверить сводную? Аня с лупой над сеткой сводной.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -112, RX = 108;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, gK = 0, mK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; gK = 0.9; mK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        gK = E.back(seg(T, 1.1, 1.6)) * fade;
        mK = E.soft(seg(T, 1.8, 2.3)) * (1 - E.soft(seg(T, 4.2, 4.6))) * fade;
        anya = mix(anya, P({ hF: [30, -78], head: [5, -113] }, anya), mK * 0.9);
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 2.2, 2.5));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      pivotGrid(g, 22, -124, 15, 9, 3, 3, gK, gK);
      magGlass(g, 60, -96, 9, mK);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -58, -114, 'как проверить?', qK, { tail: -24, size: 8 });
    },
  };

  SC['ax5-total'] = {
    dur: 6.5,
    width: 380,
    label: 'Итог сводной равен сумме столбца: расхождение ноль.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -48, RX = 48;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let nA = 0, nB = 0, eqK = 0, doneK = 0, sayK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        nA = nB = eqK = doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        nA = E.back(seg(T, 0.3, 0.6)) * fade;
        nB = E.back(seg(T, 1.1, 1.4)) * fade;
        eqK = E.back(seg(T, 2.0, 2.4)) * fade;
        doneK = seg(T, 2.8, 3.3) * fade;
        sayK = E.back(seg(T, 3.1, 3.4)) * (1 - seg(T, 4.6, 4.9)) * fade;
        const talkA = seg(T, 0.3, 0.6) * (1 - seg(T, 1.1, 1.4));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      numCard(g, -160, -114, '27 915 616,50', nA, 'итог сводной');
      numCard(g, 64, -114, '27 915 616,50', nB, 'сумма столбца');
      if (eqK > 0) {
        g.save(); g.globalAlpha = Math.min(1, eqK);
        text(g, '=', 0, -108, 13, C.umber);
        g.restore();
      }
      pill(g, 0, -78, 'расхождение 0', doneK > 0 ? C.green : C.paper, C.greenInk, 9);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, 0, -60, 'совпало до копейки', sayK, { tail: 0, size: 8 });
      sparks(g, 0, -90, seg(T, 2.8, 3.4), 12, 6);
    },
  };

  SC['ax5-second'] = {
    dur: 6,
    width: 380,
    label: '«Что ещё можно собрать?» Робот показывает вторую сводную.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -110, RX = 40;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, gK = 0, totK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; gK = totK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        gK = E.back(seg(T, 1.2, 1.8)) * fade;
        totK = seg(T, 2.1, 2.5) * fade;
        capK = E.back(seg(T, 2.6, 3.0)) * (1 - seg(T, 4.8, 5.1)) * fade;
        bot = mix(bot, P({ hF: [30, -78], head: [4, -114] }, bot),
          E.soft(seg(T, 1.2, 1.6)) * (1 - E.soft(seg(T, 4.2, 4.6))));
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 2.2, 2.5));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      pivotGrid(g, 80, -110, 16, 9, 3, 3, gK, totK);
      text(g, 'вторая сводная', 104, -48, 7, C.muted);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: totK, blink: true, happy: totK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -56, -114, 'что ещё?', qK, { tail: -26, size: 8 });
      bubble(g, 40, -114, 'вот такая', capK, { tail: 20, size: 8, fill: C.butterSoft });
    },
  };

  SC['ax5-manager'] = {
    dur: 6.5,
    width: 380,
    label: 'Вторая сводная: менеджеры в кодах, категории, сортировка по убыванию.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let gK = 0, codeK = 0, totK = 0, aK = 0, capK = 0;
      if (T < 0) {
        gK = codeK = totK = aK = capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        gK = E.back(seg(T, 0.3, 0.9)) * fade;
        codeK = seg(T, 1.0, 1.5) * fade;
        totK = seg(T, 1.7, 2.1) * fade;
        aK = seg(T, 2.4, 3.0) * fade;
        capK = E.back(seg(T, 3.1, 3.5)) * (1 - seg(T, 5.4, 5.7)) * fade;
      }
      pivotGrid(g, -76, -122, 26, 10, 4, 4, gK, totK);
      // коды менеджеров в первой колонке
      if (codeK > 0) {
        g.save(); g.globalAlpha = Math.min(1, codeK);
        for (let i = 0; i < 4; i++) {
          text(g, 'М' + (i + 1), -65, -104 + i * 10, 6.5, C.ink);
        }
        g.restore();
      }
      // заголовки категорий (из карточки урока; не персональные данные — названия открыты)
      if (gK > 0) {
        g.save(); g.globalAlpha = Math.min(1, gK);
        const cats = ['Электр.', 'Быт.тех.', 'Тов.дома', 'Посуда'];
        for (let c = 0; c < 4; c++) {
          text(g, cats[c], -76 + 26 * c + 13, -115, 5, C.ink);
        }
        g.restore();
      }
      arrow(g, [[36, -112], [36, -66]], { k: aK, col: C.umber, head: 7 });
      text(g, 'по убыванию', 36, -52, 7.5, C.umber);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'имена не подставляем — только коды', 20, -36, 7, C.muted);
        g.restore();
      }
    },
  };

  SC['ax5-why-two'] = {
    dur: 6,
    width: 380,
    label: 'Зачем руководителю две сводные? Робот разводит руками: одна таблица — один вопрос.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -110, RX = 110;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, g1 = 0, g2 = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; g1 = g2 = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        g1 = E.back(seg(T, 1.2, 1.7)) * fade;
        g2 = E.back(seg(T, 1.7, 2.2)) * fade;
        capK = E.back(seg(T, 2.6, 3.0)) * (1 - seg(T, 4.8, 5.1)) * fade;
        // робот разводит руками
        bot = mix(bot, P({ hF: [40, -100], head: [0, -116] }, bot),
          E.soft(seg(T, 1.0, 1.5)) * (1 - E.soft(seg(T, 4.2, 4.6))));
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 2.2, 2.5));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      pivotGrid(g, -34, -104, 14, 8, 2, 2, g1, 0);
      pivotGrid(g, 12, -104, 14, 8, 2, 2, g2, 0);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -56, -114, 'зачем две?', qK, { tail: -26, size: 8 });
      text(g, 'одна таблица — один вопрос', 0, -78, 7.5, C.umber);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, '«где растёт» и «кто тянет»', 0, -62, 7, C.muted);
        g.restore();
      }
    },
  };

  SC['ax5-questions'] = {
    dur: 7,
    width: 380,
    label: 'Три вопроса руководителя — три сводные; дальше просим выводы с числами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let b1 = 0, b2 = 0, b3 = 0, t1 = 0, t2 = 0, t3 = 0, cK = 0;
      if (T < 0) {
        b1 = b2 = b3 = t1 = t2 = t3 = cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        b1 = E.back(seg(T, 0.3, 0.6)) * fade;
        t1 = E.back(seg(T, 0.8, 1.2)) * fade;
        b2 = E.back(seg(T, 1.5, 1.8)) * fade;
        t2 = E.back(seg(T, 2.0, 2.4)) * fade;
        b3 = E.back(seg(T, 2.7, 3.0)) * fade;
        t3 = E.back(seg(T, 3.2, 3.6)) * fade;
        cK = E.back(seg(T, 4.3, 4.7)) * fade;
      }
      bubble(g, -104, -119, 'где растёт?', b1, { tail: 0, size: 7.5 });
      bubble(g, -4, -119, 'кто тянет', b2, { tail: 0, size: 7.5 });
      bubble(g, 92, -119, 'доля категорий', b3, { tail: 0, size: 7.5 });
      miniTable(g, -108, -88, t1);
      miniTable(g, 0, -88, t2);
      miniTable(g, 108, -88, t3);
      signCard(g, 120, -46, 64, 20, '3 вывода', cK, 8);
      arrow(g, [[54, -46], [82, -46]], { k: cK, col: C.umber, head: 6 });
      text(g, 'подкрепи числами', 0, -52, 7.5, C.muted);
    },
  };

  SC['ax5-trust'] = {
    dur: 6.5,
    width: 380,
    label: 'Красивому выводу агента не верим на слово — проверяем по цифрам.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let cK = 0, xK = 0, nK = 0, mK = 0, capK = 0;
      if (T < 0) {
        cK = xK = nK = mK = capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.3, 0.8)) * fade;
        xK = seg(T, 1.3, 1.7) * fade;
        nK = E.back(seg(T, 2.1, 2.6)) * fade;
        mK = E.soft(seg(T, 2.8, 3.3)) * (1 - E.soft(seg(T, 5.6, 5.9))) * fade;
        capK = E.back(seg(T, 3.4, 3.8)) * (1 - seg(T, 5.4, 5.7)) * fade;
      }
      // карточка «красивого вывода»
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, -132, -122, 72, 46, 4); inkFill(g, C.paper, 1.5);
        // читаемая фраза-вывод: доля «Бытовой техники» наибольшая во всех трёх вариантах
        // (passports.json → report.cat_share: A 36,15 / B 29,41 / C 33,29 %)
        text(g, 'Бытовая техника', -96, -104, 6.5, C.ink);
        text(g, 'тянет выручку', -96, -92, 6.5, C.ink);
        g.restore();
      }
      text(g, 'вывод агента', -96, -66, 7, C.muted);
      bigCross(g, -96, -99, 38, 24, xK);
      numCard(g, 44, -122, '27 915 616,50', nK, 'число из таблицы', 84);
      magGlass(g, 24, -78, 8, mK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'проверь по цифрам', 70, -52, 8, C.umber);
        g.restore();
      }
    },
  };

  SC['ax5-bridge'] = {
    dur: 6.5,
    width: 380,
    label: 'Мост к следующему уроку: от сводной — к графикам и самообновлению отчёта.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let gK = 0, aK = 0, cK = 0, lK = 0, doneK = 0, capK = 0;
      if (T < 0) {
        gK = aK = cK = lK = doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        gK = E.back(seg(T, 0.3, 0.8)) * fade;
        aK = seg(T, 1.2, 1.7) * fade;
        cK = E.back(seg(T, 1.7, 2.2)) * fade;
        lK = seg(T, 2.4, 3.4) * fade;
        doneK = seg(T, 3.7, 4.1) * fade;
        capK = E.back(seg(T, 4.2, 4.6)) * (1 - seg(T, 5.8, 6.1)) * fade;
      }
      pivotGrid(g, -140, -112, 15, 9, 3, 3, gK, gK);
      arrow(g, [[-84, -90], [-46, -90]], { k: aK, col: C.umber, head: 7 });
      chartCard(g, -36, -118, 100, 56, cK, lK);
      text(g, 'дальше: графики', 14, -48, 8, C.umber);
      tickBadge(g, 84, -126, doneK, 9);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'отчёт обновится сам', 60, -40, 7, C.muted);
        g.restore();
      }
    },
  };
})();
