// Урок 8 «Сценарии и кассовый разрыв»: 17 стик-сцен по репликам сценария.
// Load after stick.js: <stick-scene scene="ax8-intro" play="view"></stick-scene>
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, mix, fig, inkFill, rr, ln, poly, circle, text, seg, clamp, lerp, breathe, pulse, bubble, words, tickBadge, sparks, arrow, arrowHead, partial, strokePath, held } = R;

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

  // карточка с подписью-заголовком и числом
  function numCard(g, cx, cy, w, title, value, k, size) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const h = 34, x = cx - w / 2, y = cy - h / 2;
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    text(g, title, cx, y + 11, 6, C.muted);
    text(g, value, cx, y + 26, size || 8, C.ink);
    g.restore();
  }

  // ломаная-график, рисуется постепенно (k = 0..1)
  function chartLine(g, pts, k, col, lw) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    strokePath(g, partial(pts, E.soft(clamp(k, 0, 1))), lw || 2.2, col || C.ink);
    g.restore();
  }

  // столбик диаграммы, растёт снизу вверх (k = 0..1)
  function bar(g, cx, w, h, yBase, k, fill) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const hh = h * E.out(clamp(k, 0, 1));
    g.fillStyle = fill || C.butter;
    g.fillRect(cx - w / 2, yBase - hh, w, hh);
    g.strokeStyle = C.ink; g.lineWidth = 1.2;
    g.strokeRect(cx - w / 2, yBase - hh, w, hh);
    g.restore();
  }

  // лупа: круг-стекло и ручка
  function lens(g, x, y, r, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    circle(g, x, y, r);
    inkFill(g, C.sky, 1.8);
    ln(g, x - 3, y - 3, x + 3, y + 3, 1, C.paper);
    ln(g, x + r * 0.72, y + r * 0.72, x + r * 1.5, y + r * 1.5, 3, C.ink);
    g.restore();
  }

  // мишень: концентрические круги
  function target(g, cx, cy, r, k) {
    if (k <= 0) { return; }
    const s = E.back(clamp(k, 0, 1));
    g.save();
    g.translate(cx, cy);
    g.scale(s, s);
    for (let i = 0; i < 3; i++) {
      circle(g, 0, 0, r - i * (r / 3));
      inkFill(g, i === 1 ? C.red : C.paper, 1.6);
    }
    g.restore();
  }

  // крутилка-ручка драйвера: круг, риска-указатель и штрихи
  function knob(g, cx, cy, r, k, ang) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    circle(g, cx, cy, r);
    inkFill(g, C.paper, 2);
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI * 0.75 + (i / 7) * Math.PI * 1.5;
      ln(g, cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4), cx + Math.cos(a) * (r - 1.5), cy + Math.sin(a) * (r - 1.5), 1, C.soft);
    }
    ln(g, cx, cy, cx + Math.cos(ang) * (r - 4), cy + Math.sin(ang) * (r - 4), 2.4, C.umber);
    g.restore();
  }

  // звено цепи: вытянутый скруглённый прямоугольник
  function chainLink(g, cx, cy, k, vert) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    if (vert) {
      rr(g, cx - 4, cy - 8, 8, 16, 4);
    } else {
      rr(g, cx - 8, cy - 4, 16, 8, 4);
    }
    inkFill(g, C.paper, 1.6);
    g.restore();
  }

  // пустая таблица в руке робота
  function handTable(g, p, k) {
    if (!p || k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const w = 44, h = 32;
    g.translate(p[0] - w / 2, p[1] - h / 2);
    rr(g, 0, 0, w, h, 3); inkFill(g, C.paper, 1.4);
    ln(g, 0, 10, w, 10, 1);
    ln(g, 14, 10, 14, h, 1);
    for (let i = 0; i < 2; i++) { ln(g, 19, 17 + i * 9, w - 5, 17 + i * 9, 1); }
    g.restore();
  }

  // ================= сцены =================

  SC['ax8-intro'] = {
    dur: 6,
    width: 380,
    label: 'Аня и робот: одна дорожка раздваивается в три сценария.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -95, RX = 85;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let roadK = 0, forkK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        roadK = forkK = capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        roadK = seg(T, 0.3, 0.9) * fade;
        forkK = seg(T, 1.0, 1.6) * fade;
        capK = E.back(seg(T, 1.8, 2.2)) * fade;
        anya = mix(anya, P({ head: [7, -113] }, anya),
          E.soft(seg(T, 0.6, 1.0)) * (1 - E.soft(seg(T, 3.6, 4.0))));
        bot = mix(bot, P({ head: [-4, -114], chest: [-1, -90] }, bot),
          E.soft(seg(T, 0.9, 1.3)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      arrow(g, [[-58, -78], [6, -78]], { k: roadK, head: 5 });
      arrow(g, [[6, -78], [56, -94]], { k: forkK, head: 5 });
      arrow(g, [[6, -78], [56, -78]], { k: forkK, head: 5 });
      arrow(g, [[6, -78], [56, -62]], { k: forkK, head: 5 });
      if (forkK > 0.9) {
        g.save();
        g.globalAlpha = forkK;
        circle(g, 6, -78, 2.4);
        g.fillStyle = C.ink;
        g.fill();
        g.restore();
      }
      signCard(g, 98, -100, 62, 20, 'три сценария', capK, 7.5);
    },
  };

  SC['ax8-why3'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает «зачем три?», робот пожимает плечами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 82;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, shrugK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; shrugK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        shrugK = E.soft(seg(T, 1.0, 1.5)) * (1 - E.soft(seg(T, 3.8, 4.2))) * fade;
        bot = mix(bot, P({ hF: [24, -98], hB: [-18, -94], head: [2, -118] }, bot), shrugK);
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.4, 1.7));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -44, -114, 'зачем три?', qK, { tail: -26, size: 8 });
    },
  };

  SC['ax8-scenarios'] = {
    dur: 6.5,
    width: 380,
    label: 'Три дорожки из одной точки: базовая ровная, оптимистичная вверх, пессимистичная вниз.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let baseK = 0, upK = 0, dnK = 0, capK = 0;
      if (T < 0) {
        baseK = upK = dnK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        baseK = seg(T, 0.3, 0.9) * fade;
        upK = seg(T, 1.2, 1.8) * fade;
        dnK = seg(T, 2.1, 2.7) * fade;
        capK = E.back(seg(T, 3.0, 3.4)) * (1 - seg(T, 5.4, 5.7)) * fade;
      }
      // общая точка старта
      g.save();
      g.globalAlpha = Math.max(baseK, upK, dnK);
      circle(g, -124, -62, 3);
      g.fillStyle = C.ink;
      g.fill();
      g.restore();
      arrow(g, [[-124, -62], [64, -62]], { k: baseK, head: 6 });
      arrow(g, [[-124, -62], [10, -100], [64, -112]], { k: upK, head: 6, col: C.greenInk });
      arrow(g, [[-124, -62], [10, -24], [64, -12]], { k: dnK, head: 6, col: C.redInk });
      text(g, 'оптимистичный', 78, -110, 7, C.greenInk, 'left');
      text(g, 'база', 78, -59, 7, C.ink, 'left');
      text(g, 'пессимистичный', 78, -10, 7, C.redInk, 'left');
      if (capK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, capK);
        text(g, 'вилка сценариев', -60, -128, 7.5, C.muted);
        g.restore();
      }
    },
  };

  SC['ax8-how'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает «как задать?», робот показывает на карточку «Драйверы».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -88, RX = 72;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cardK = 0, pointK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cardK = 0.9; pointK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        cardK = E.back(seg(T, 1.0, 1.4)) * fade;
        pointK = E.soft(seg(T, 1.2, 1.6)) * (1 - E.soft(seg(T, 3.6, 4.0))) * fade;
        bot = mix(bot, P({ hF: [28, -84], head: [6, -113] }, bot), pointK);
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.4, 1.7));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -46, -114, 'как задать?', qK, { tail: -26, size: 8 });
      signCard(g, 126, -92, 60, 24, 'Драйверы', cardK, 8);
    },
  };

  SC['ax8-values'] = {
    dur: 6.5,
    width: 380,
    label: 'Три карточки сценариев: база, оптимистичный и пессимистичный с арендой плюс двадцать.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let k1 = 0, k2 = 0, k3 = 0, noteK = 0;
      if (T < 0) {
        k1 = k2 = k3 = 0.9; noteK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        k1 = E.back(seg(T, 0.3, 0.75)) * fade;
        k2 = E.back(seg(T, 1.1, 1.55)) * fade;
        k3 = E.back(seg(T, 1.9, 2.35)) * fade;
        noteK = E.back(seg(T, 2.6, 3.0)) * fade;
      }
      signCard(g, -102, -98, 94, 26, 'база: 5% и 62%', k1, 7.5);
      signCard(g, 0, -98, 98, 26, 'оптим.: 8% и 58%', k2, 7.5);
      signCard(g, 102, -98, 98, 26, 'пессим.: 0% и 68%', k3, 7.5);
      if (noteK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, noteK);
        text(g, 'аренда +20%', 102, -76, 6.5, C.umber);
        g.restore();
      }
      text(g, 'значения драйверов', 0, -60, 7.5, C.muted);
    },
  };

  SC['ax8-output'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает «что просить на выходе?», робот держит пустую таблицу.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 40;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [32, -72], hB: [4, -58], head: [0, -116] }), t);
      let qK = 0, tblK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; tblK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        tblK = E.back(seg(T, 1.0, 1.4)) * fade;
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.4, 1.7));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      fig(g, bot, RX, 0, {
        sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true },
        held: (g2, J) => R.held(g2, J, (hF) => handTable(g2, [hF[0] + 34, hF[1] - 4], tblK)),
      });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -50, -114, 'что просить на выходе?', qK, { tail: -26, size: 7.5 });
    },
  };

  SC['ax8-ask'] = {
    dur: 7,
    width: 380,
    label: 'Таблица по трём сценариям и рядом график чувствительности.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let tblK = 0, row1 = 0, row2 = 0, row3 = 0, gK = 0, capK = 0;
      if (T < 0) {
        tblK = row1 = row2 = row3 = gK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        tblK = E.back(seg(T, 0.3, 0.8)) * fade;
        row1 = seg(T, 1.0, 1.3) * fade;
        row2 = seg(T, 1.4, 1.7) * fade;
        row3 = seg(T, 1.8, 2.1) * fade;
        gK = seg(T, 2.6, 3.4) * fade;
        capK = E.back(seg(T, 3.8, 4.2)) * (1 - seg(T, 5.8, 6.1)) * fade;
      }
      // таблица 4×4: колонка названий + три колонки показателей
      if (tblK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, tblK);
        const x = -152, y = -126, w = 142, h = 66;
        rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.6);
        ln(g, x, y + 16, x + w, y + 16, 1.1);
        ln(g, x + 40, y + 16, x + 40, y + h, 1.1);
        text(g, 'прибыль', x + 61, y + 11, 5.5, C.muted);
        text(g, 'мин. денег', x + 92, y + 11, 5.5, C.muted);
        text(g, 'месяц в плюс', x + 122, y + 11, 5.5, C.muted);
        const rows = [['база', row1], ['оптим.', row2], ['пессим.', row3]];
        for (let i = 0; i < 3; i++) {
          const yy = y + 28 + i * 14;
          if (rows[i][1] > 0) {
            g.globalAlpha = Math.min(1, tblK) * Math.min(1, rows[i][1]);
            text(g, rows[i][0], x + 21, yy + 2, 6.5, C.ink);
            for (let c = 0; c < 3; c++) words(g, x + 46 + c * 30, yy, 22, i + c * 2);
            g.globalAlpha = Math.min(1, tblK);
          }
        }
        g.restore();
      }
      // график чувствительности справа
      chartLine(g, [[30, -76], [52, -82], [74, -92], [96, -108], [118, -116]], gK, C.umber);
      g.save();
      g.globalAlpha = Math.min(1, gK);
      ln(g, 30, -66, 124, -66, 1.2, C.soft);
      circle(g, 118, -116, 2.2);
      g.fillStyle = C.umber;
      g.fill();
      g.restore();
      if (capK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, capK);
        text(g, 'чувствительность', 80, -54, 7, C.umber);
        g.restore();
      }
    },
  };

  SC['ax8-order'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает «зачем проверка?», робот смотрит в лупу.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 76;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [26, -84], hB: [-4, -50], head: [6, -114] }), t);
      let qK = 0, lensK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; lensK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        lensK = E.back(seg(T, 1.0, 1.4)) * fade;
        bot = mix(bot, P({ hF: [26, -84], head: [6, -114] }, bot),
          E.soft(seg(T, 0.9, 1.3)) * (1 - E.soft(seg(T, 3.6, 4.0))) * fade);
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.4, 1.7));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      lens(g, RX - 36, -86, 10, lensK);
      bubble(g, -46, -114, 'зачем проверка?', qK, { tail: -26, size: 8 });
    },
  };

  SC['ax8-signs'] = {
    dur: 6.5,
    width: 380,
    label: 'Слева верный порядок столбиков с галочкой, справа перепутанный — с красным крестом.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let l1 = 0, l2 = 0, l3 = 0, okK = 0, r1 = 0, r2 = 0, r3 = 0, xK = 0;
      if (T < 0) {
        l1 = l2 = l3 = r1 = r2 = r3 = 0.9; okK = xK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        l1 = seg(T, 0.3, 0.7) * fade;
        l2 = seg(T, 0.6, 1.0) * fade;
        l3 = seg(T, 0.9, 1.3) * fade;
        okK = seg(T, 1.6, 2.0) * fade;
        r1 = seg(T, 2.4, 2.8) * fade;
        r2 = seg(T, 2.7, 3.1) * fade;
        r3 = seg(T, 3.0, 3.4) * fade;
        xK = seg(T, 3.7, 4.1) * fade;
      }
      // левая группа: пессим. < база < оптим.
      ln(g, -142, -44, -58, -44, 1.6, C.ink);
      bar(g, -128, 18, 20, -44, l1, C.red);
      bar(g, -100, 18, 36, -44, l2, C.butter);
      bar(g, -72, 18, 52, -44, l3, C.green);
      text(g, 'пессим.', -128, -34, 5.5, C.muted);
      text(g, 'база', -100, -34, 5.5, C.muted);
      text(g, 'оптим.', -72, -34, 5.5, C.muted);
      text(g, '−0,8', -128, -25, 5.5, C.muted);
      text(g, '3,9', -100, -25, 5.5, C.muted);
      text(g, '7,7', -72, -25, 5.5, C.muted);
      text(g, 'млн', -100, -16, 5, C.muted);
      tickBadge(g, -100, -108, okK, 9);
      // правая группа: перепутано — пессим. выше базы
      ln(g, 22, -44, 106, -44, 1.6, C.ink);
      bar(g, 36, 18, 52, -44, r1, C.red);
      bar(g, 64, 18, 36, -44, r2, C.butter);
      bar(g, 92, 18, 20, -44, r3, C.green);
      text(g, 'пессим.', 36, -34, 5.5, C.muted);
      text(g, 'база', 64, -34, 5.5, C.muted);
      text(g, 'оптим.', 92, -34, 5.5, C.muted);
      g.save();
      g.globalAlpha = Math.min(1, xK);
      ln(g, 40, -108, 88, -56, 2.4, C.redInk);
      ln(g, 88, -108, 40, -56, 2.4, C.redInk);
      g.restore();
      text(g, 'порядок верный', -100, -122, 6.5, C.greenInk);
      text(g, 'ошибка знаков', 64, -122, 6.5, C.redInk);
    },
  };

  SC['ax8-money'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает: прибыль и деньги — это одно и то же?',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -80, RX = 76;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.4, 3.7)) * fade;
        bot = mix(bot, P({ head: [-5, -113], chest: [-2, -90] }, bot),
          E.soft(seg(T, 0.9, 1.3)) * (1 - E.soft(seg(T, 3.6, 4.0))) * fade);
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.8, 2.1));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -34, -114, 'прибыль и деньги — одно?', qK, { tail: -26, size: 7.5 });
    },
  };

  SC['ax8-diff'] = {
    dur: 7,
    width: 380,
    label: 'Ключевая сцена: прибыль появляется раньше, деньги запаздывают — между ними кассовый разрыв.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let pK = 0, mK = 0, gapK = 0, capK = 0;
      if (T < 0) {
        pK = mK = gapK = capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        pK = seg(T, 0.3, 1.1) * fade;
        mK = seg(T, 1.3, 2.1) * fade;
        gapK = seg(T, 2.6, 3.2) * fade;
        capK = E.back(seg(T, 3.6, 4.0)) * (1 - seg(T, 5.8, 6.1)) * fade;
      }
      // ось времени
      ln(g, -138, -28, 100, -28, 1.2, C.soft);
      // прибыль: начинается раньше и выше
      chartLine(g, [[-130, -112], [-92, -108], [-54, -102], [-16, -96], [22, -92], [60, -88]], pK, C.greenInk);
      // деньги: запаздывают, идут ниже
      chartLine(g, [[-70, -58], [-32, -55], [6, -52], [44, -49], [82, -46]], mK, C.umber);
      g.save();
      g.globalAlpha = Math.min(1, pK);
      text(g, 'прибыль', -104, -122, 7, C.greenInk);
      g.restore();
      g.save();
      g.globalAlpha = Math.min(1, mK);
      text(g, 'деньги', -56, -44, 7, C.umber);
      g.restore();
      // двунаправленная стрелка между линиями
      if (gapK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, gapK);
        ln(g, -4, -97, -4, -57, 1.8, C.redInk);
        arrowHead(g, [-4, -97], -Math.PI / 2, 5, 1.8, C.redInk);
        arrowHead(g, [-4, -57], Math.PI / 2, 5, 1.8, C.redInk);
        g.restore();
      }
      if (capK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, capK);
        text(g, 'кассовый разрыв', 46, -80, 7, C.redInk);
        g.restore();
      }
    },
  };

  SC['ax8-find'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает «как найти?», робот с лупой над графиком остатка.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -100, RX = 40;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [26, -84], hB: [-4, -50], head: [6, -114] }), t);
      let qK = 0, gK = 0, lensK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; gK = 0.9; lensK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        gK = seg(T, 0.9, 1.5) * fade;
        lensK = E.back(seg(T, 1.3, 1.7)) * fade;
        bot = mix(bot, P({ hF: [26, -84], head: [6, -114] }, bot),
          E.soft(seg(T, 1.1, 1.5)) * (1 - E.soft(seg(T, 3.6, 4.0))) * fade);
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.4, 1.7));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      // график накопительного остатка
      chartLine(g, [[10, -58], [40, -64], [70, -74], [100, -88], [130, -100]], gK, C.ink);
      g.save();
      g.globalAlpha = Math.min(1, gK);
      ln(g, 10, -52, 134, -52, 1.2, C.soft);
      g.restore();
      fig(g, bot, RX, 0, { sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      lens(g, RX + 34, -84, 11, lensK);
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -60, -114, 'как найти?', qK, { tail: -26, size: 8 });
    },
  };

  SC['ax8-july'] = {
    dur: 7,
    width: 380,
    label: 'График накопительных денег уходит ниже нуля: июль, минус 479 408 рублей.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let axK = 0, lnK = 0, dotK = 0, jK = 0, cardK = 0;
      if (T < 0) {
        axK = lnK = dotK = jK = cardK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        axK = seg(T, 0.3, 0.8) * fade;
        lnK = seg(T, 0.9, 2.1) * fade;
        dotK = seg(T, 2.3, 2.7) * fade;
        jK = E.back(seg(T, 2.8, 3.15)) * fade;
        cardK = E.back(seg(T, 3.4, 3.8)) * fade;
      }
      // нулевая линия пунктиром
      g.save();
      g.globalAlpha = Math.min(1, axK);
      g.setLineDash([5, 4]);
      g.strokeStyle = C.muted; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(-142, -64); g.lineTo(40, -64); g.stroke();
      g.setLineDash([]);
      text(g, '0', -150, -61, 7, C.muted);
      g.restore();
      // накопительный остаток уходит вниз
      chartLine(g, [[-138, -40], [-110, -47], [-82, -56], [-60, -64], [-36, -80], [-12, -96], [14, -108]], lnK, C.ink);
      // точка пересечения
      g.save();
      g.globalAlpha = Math.min(1, dotK);
      circle(g, -60, -64, 3.4);
      inkFill(g, C.red, 1.6, C.redInk);
      g.restore();
      g.save();
      g.globalAlpha = Math.min(1, jK);
      text(g, 'июль', -88, -84, 8, C.redInk);
      g.restore();
      numCard(g, 96, -100, 108, 'минимум денег', 'минус 479 408 р.', cardK, 8);
      if (cardK > 0.5) {
        g.save();
        g.globalAlpha = Math.min(1, cardK);
        text(g, 'кассовый разрыв', 96, -76, 6.5, C.umber);
        g.restore();
      }
    },
  };

  SC['ax8-what'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает «что делать?», робот показывает на карточку «кредит».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -88, RX = 72;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cardK = 0, pointK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cardK = 0.9; pointK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        cardK = E.back(seg(T, 1.0, 1.4)) * fade;
        pointK = E.soft(seg(T, 1.2, 1.6)) * (1 - E.soft(seg(T, 3.6, 4.0))) * fade;
        bot = mix(bot, P({ hF: [28, -84], head: [6, -113] }, bot), pointK);
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.4, 1.7));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -46, -114, 'что делать?', qK, { tail: -26, size: 8 });
      signCard(g, 126, -92, 56, 24, 'кредит', cardK, 8);
    },
  };

  SC['ax8-credit'] = {
    dur: 6.5,
    width: 380,
    label: 'Карточка кредита: миллион под восемнадцать на год — платёж и переплата, всё сходится.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let topK = 0, a1 = 0, a2 = 0, payK = 0, overK = 0, okK = 0;
      if (T < 0) {
        topK = payK = overK = okK = 0.9; a1 = a2 = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        topK = E.back(seg(T, 0.3, 0.75)) * fade;
        a1 = seg(T, 1.1, 1.6) * fade;
        a2 = seg(T, 1.1, 1.6) * fade;
        payK = E.back(seg(T, 1.7, 2.1)) * fade;
        overK = E.back(seg(T, 2.3, 2.7)) * fade;
        okK = seg(T, 3.3, 3.7) * fade;
      }
      signCard(g, 0, -120, 128, 24, '1 000 000 р., 18%, 12 мес.', topK, 7.5);
      arrow(g, [[-30, -104], [-70, -80]], { k: a1, head: 5, col: C.umber });
      arrow(g, [[30, -104], [70, -80]], { k: a2, head: 5, col: C.umber });
      numCard(g, -82, -62, 96, 'платёж в месяц', '91 680 р.', payK, 8);
      numCard(g, 82, -62, 100, 'переплата', '100 160 р.', overK, 8);
      tickBadge(g, 0, -40, okK, 9);
      sparks(g, 0, -46, seg(T, 3.3, 3.9), 12, 5);
    },
  };

  SC['ax8-goal'] = {
    dur: 6,
    width: 380,
    label: 'Аня спрашивает про подбор под цель, справа мишень с целью три миллиона.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -84, RX = -8;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, tK = 0, cardK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; tK = 0.9; cardK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        tK = E.back(seg(T, 1.0, 1.5)) * fade;
        cardK = E.back(seg(T, 1.8, 2.2)) * fade;
        bot = mix(bot, P({ head: [5, -113] }, bot),
          E.soft(seg(T, 1.4, 1.8)) * (1 - E.soft(seg(T, 4.2, 4.6))) * fade);
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.4, 1.7));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -50, -114, 'подобрать под цель?', qK, { tail: -26, size: 7.5 });
      target(g, 92, -76, 30, tK);
      signCard(g, 92, -76, 74, 18, 'цель 3 000 000 р.', cardK, 6.5);
    },
  };

  SC['ax8-bridge'] = {
    dur: 6.5,
    width: 380,
    label: 'Крутилка драйвера даёт три и сорок восемь сотых процента, прибыль попадает в цель.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let knK = 0, valK = 0, arrK = 0, cardK = 0, okK = 0, chK = 0, capK = 0;
      let ang = -Math.PI * 0.62;
      if (T < 0) {
        knK = valK = cardK = okK = chK = 0.9; arrK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        knK = E.back(seg(T, 0.3, 0.75)) * fade;
        // ручка крутится, потом останавливается
        const spin = E.soft(seg(T, 0.8, 2.0)) * (1 - E.soft(seg(T, 2.4, 2.8)));
        ang = -Math.PI * 0.75 + E.soft(seg(T, 0.8, 2.6)) * Math.PI * 0.9 + spin * Math.sin(T * 9) * 0.12;
        valK = E.back(seg(T, 2.5, 2.9)) * fade;
        arrK = seg(T, 3.0, 3.5) * fade;
        cardK = E.back(seg(T, 3.4, 3.8)) * fade;
        okK = seg(T, 4.1, 4.5) * fade;
        chK = seg(T, 4.6, 5.0) * fade;
        capK = E.back(seg(T, 5.0, 5.3)) * (1 - seg(T, 5.9, 6.2)) * fade;
      }
      knob(g, -122, -70, 15, knK, ang);
      if (valK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, valK);
        text(g, '3,48%', -122, -44, 9, C.umber);
        g.restore();
      }
      arrow(g, [[-96, -70], [-34, -70]], { k: arrK, head: 6, col: C.umber });
      numCard(g, 18, -70, 96, 'прибыль', '2 999 980 р.', cardK, 7.5);
      tickBadge(g, 74, -94, okK, 8);
      // цепочка из четырёх звеньев
      chainLink(g, 100, -70, chK, true);
      chainLink(g, 114, -70, chK, false);
      chainLink(g, 128, -70, chK, true);
      chainLink(g, 142, -70, chK, false);
      if (capK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, capK);
        text(g, 'дальше: вся цепочка', 118, -46, 6.5, C.umber);
        text(g, 'одним сообщением', 118, -36, 6.5, C.umber);
        g.restore();
      }
    },
  };
})();
