// Урок 7 «Бюджет на драйверах»: 17 стик-сцен по репликам сценария.
// Load after stick.js: <stick-scene scene="ax7-intro" play="view"></stick-scene>
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, mix, fig, inkFill, rr, ln, poly, circle, text, seg, clamp, lerp, breathe, pulse, bubble, words, tickBadge, sparks, arrow, held } = R;

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

  // карточка-лист с заголовком и строками-подписями; rowsK[i] = 0..1 появления строки
  function sheetCard(g, x, y, w, h, title, rows, rowsK, cardK, hiK) {
    if (cardK <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, cardK);
    rr(g, x, y, w, h, 4);
    inkFill(g, hiK > 0.02 ? C.butterSoft : C.paper, 1.5);
    if (title) {
      ln(g, x, y + 13, x + w, y + 13, 1.1);
      text(g, title, x + w / 2, y + 9.5, 8, C.ink);
    }
    const n = rows.length, top = y + (title ? 21 : 9), step = (h - (title ? 26 : 14)) / Math.max(1, n - 0.4);
    for (let i = 0; i < n; i++) {
      const kk = rowsK == null ? 1 : rowsK[i];
      if (kk <= 0) { continue; }
      g.save(); g.globalAlpha *= Math.min(1, kk);
      const yy = top + i * step;
      circle(g, x + 9, yy - 2, 1.5);
      g.fillStyle = C.muted; g.fill();
      text(g, rows[i], x + 15, yy, 7, C.ink, 'left');
      g.restore();
    }
    g.restore();
  }

  // крутилка-ручка: круг со стрелкой-указателем под углом ang (рад)
  function knob(g, cx, cy, ang, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    circle(g, cx, cy, 11);
    inkFill(g, C.paper, 1.8);
    ln(g, cx, cy, cx + Math.cos(ang) * 8.5, cy + Math.sin(ang) * 8.5, 2.4, C.umber);
    circle(g, cx, cy, 1.8);
    g.fillStyle = C.umber; g.fill();
    g.restore();
  }

  // красный крест в габаритах w × h вокруг центра
  function bigCross(g, cx, cy, w, h, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    ln(g, cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, 2.2, C.redInk);
    ln(g, cx + w / 2, cy - h / 2, cx - w / 2, cy + h / 2, 2.2, C.redInk);
    g.restore();
  }

  // калькулятор: корпус + кнопки
  function calcIcon(g, cx, cy, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const x = cx - 15, y = cy - 21;
    rr(g, x, y, 30, 42, 4); inkFill(g, C.paper, 1.6);
    rr(g, x + 4, y + 4, 22, 8, 1.5); inkFill(g, C.butterSoft || C.paper, 1);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        rr(g, x + 4 + c * 8, y + 16 + r * 6.4, 5.5, 4.6, 1);
        inkFill(g, C.paper, 0.9);
      }
    }
    g.restore();
  }

  // лупа: круг + ручка (рисуется в мировых координатах вокруг точки)
  function magnifier(g, x, y, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    circle(g, x, y - 4, 9);
    inkFill(g, null, 2, C.ink);
    ln(g, x + 6.4, y + 2.4, x + 13, y + 9, 2.6, C.ink);
    g.restore();
  }

  // стопка из трёх листов (для ax7-rule)
  function sheetStack(g, cx, cy, k, hiK) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const w = 46, h = 30;
    for (let i = 2; i >= 0; i--) {
      const x = cx - w / 2 + i * 5, y = cy - h / 2 - i * 7;
      rr(g, x, y, w, h, 3);
      inkFill(g, i === 0 && hiK > 0.02 ? C.butter : C.paper, 1.4);
      ln(g, x + 5, y + 9, x + w - 8, y + 9, 1);
      ln(g, x + 5, y + 16, x + w - 8, y + 16, 1);
      ln(g, x + 5, y + 23, x + w - 14, y + 23, 1);
    }
    g.restore();
  }

  // ================= 1. ax7-intro =================
  SC['ax7-intro'] = {
    dur: 6.5,
    width: 380,
    label: 'Знакомство: Аня и робот, между ними модель с шестерёнками и календарь на 12 месяцев.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -96, RX = 96;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let mK = 0, calK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        mK = 0.9; calK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        mK = E.back(seg(T, 0.4, 0.8)) * fade;
        calK = E.back(seg(T, 1.4, 1.8)) * fade;
        capK = E.back(seg(T, 2.4, 2.8)) * (1 - seg(T, 5.4, 5.7)) * fade;
        bot = mix(bot, P({ head: [-4, -112] }, bot), E.soft(seg(T, 1.0, 1.4)) * (1 - E.soft(seg(T, 2.6, 3.0))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      // карточка «модель» с шестерёнками
      if (mK > 0) {
        g.save(); g.globalAlpha = Math.min(1, mK);
        rr(g, -30, -122, 60, 40, 4); inkFill(g, C.paper, 1.6);
        const a = T < 0 ? t * 0.8 : T * 0.8;
        for (const [gx, gy, r] of [[-10, -106, 6.5], [4, -102, 5]]) {
          g.save(); g.translate(gx, gy); g.rotate(a);
          circle(g, 0, 0, r); inkFill(g, null, 1.3, C.muted);
          for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2;
            ln(g, Math.cos(ang) * r, Math.sin(ang) * r, Math.cos(ang) * (r + 2.6), Math.sin(ang) * (r + 2.6), 1.3, C.muted);
          }
          g.restore();
        }
        text(g, 'модель', 15, -96, 7, C.ink);
        g.restore();
      }
      // календарик «12 месяцев»
      if (calK > 0) {
        g.save(); g.globalAlpha = Math.min(1, calK);
        rr(g, 22, -74, 44, 30, 3); inkFill(g, C.paper, 1.5);
        ln(g, 22, -64, 66, -64, 1.1);
        ln(g, 32, -70, 32, -76, 1.4); ln(g, 56, -70, 56, -76, 1.4);
        text(g, '12 месяцев', 44, -54, 7, C.ink);
        g.restore();
      }
      bubble(g, -20, -114, 'строим модель', capK, { tail: -24, size: 8 });
    },
  };

  // ================= 2. ax7-start =================
  SC['ax7-start'] = {
    dur: 5.5,
    width: 380,
    label: 'С чего начинается модель? Робот показывает на пустой лист.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 60;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [24, -78], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, shK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        shK = 0.9; qK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        shK = E.back(seg(T, 1.0, 1.4)) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 1.6, 1.9));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      // пустой лист справа
      if (shK > 0) {
        g.save(); g.globalAlpha = Math.min(1, shK);
        rr(g, 96, -108, 58, 44, 4); inkFill(g, C.paper, 1.5);
        g.setLineDash([4, 4]);
        g.strokeStyle = C.soft; g.lineWidth = 1.2;
        g.strokeRect(102, -102, 46, 32);
        g.setLineDash([]);
        g.restore();
        text(g, 'пусто', 125, -56, 7, C.muted);
      }
      fig(g, bot, RX, 0, { sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -40, -114, 'с чего начинается?', qK, { tail: -26, size: 8 });
    },
  };

  // ================= 3. ax7-drivers =================
  SC['ax7-drivers'] = {
    dur: 7,
    width: 380,
    label: 'Лист драйверов: семь параметров модели появляются по очереди.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const rows = ['рост', 'себестоимость', 'аренда', 'ФОТ', 'маркетинг', 'налог', 'деньги'];
      let cardK = 0;
      const rowsK = rows.map(() => 0);
      let doneK = 0;
      if (T < 0) {
        cardK = 0.9;
        for (let i = 0; i < rows.length; i++) { rowsK[i] = 0.9; }
        doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cardK = E.back(seg(T, 0.25, 0.6)) * fade;
        for (let i = 0; i < rows.length; i++) {
          rowsK[i] = E.back(seg(T, 0.6 + i * 0.45, 0.9 + i * 0.45)) * fade;
        }
        doneK = seg(T, 4.1, 4.5) * fade;
      }
      sheetCard(g, -150, -128, 158, 108, 'Драйверы', rows, rowsK, cardK);
      tickBadge(g, -8, -30, doneK, 9);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [-2, -116] }), t);
      if (T >= 0) {
        bot = mix(bot, P({ head: [-6, -114] }, bot), E.soft(seg(T, 0.5, 1.0)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      fig(g, bot, 110, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      text(g, 'все параметры здесь', 110, -34, 7, C.muted);
    },
  };

  // ================= 4. ax7-why =================
  SC['ax7-why'] = {
    dur: 5.5,
    width: 380,
    label: 'Почему отдельный лист? Робот пожимает плечами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 84;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, shrugK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.4, 2.7)) * fade;
        shrugK = E.soft(seg(T, 1.2, 1.6)) * (1 - E.soft(seg(T, 4.2, 4.6)));
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 1.8, 2.1));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      // пожатие плечами: обе руки в стороны, голова чуть наклонена
      bot = mix(bot, P({ hF: [20, -84], hB: [-16, -78], head: [4, -113] }, bot), shrugK);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -40, -114, 'почему отдельный лист?', qK, { tail: -26, size: 8 });
    },
  };

  // ================= 5. ax7-rule (ключевая) =================
  SC['ax7-rule'] = {
    dur: 7,
    width: 380,
    label: 'Железное правило: крутишь параметр на листе драйверов — пересчитываются все листы бюджета.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let cardK = 0, knK = 0, a1 = 0, a2 = 0, a3 = 0, stK = 0, hiK = 0, capK = 0;
      if (T < 0) {
        cardK = 0.9; knK = 0.9; a1 = a2 = a3 = 0.9; stK = 0.9; hiK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cardK = E.back(seg(T, 0.25, 0.6)) * fade;
        knK = E.back(seg(T, 0.6, 0.9)) * fade;
        a1 = E.soft(seg(T, 1.0, 1.5)) * fade;
        a2 = E.soft(seg(T, 1.4, 1.9)) * fade;
        a3 = E.soft(seg(T, 1.8, 2.3)) * fade;
        stK = E.back(seg(T, 1.2, 1.6)) * fade;
        hiK = E.soft(seg(T, 2.6, 3.0)) * fade;
        capK = E.back(seg(T, 3.2, 3.6)) * (1 - seg(T, 5.9, 6.2)) * fade;
      }
      // левая карточка «Драйверы» с крутилкой
      sheetCard(g, -158, -122, 92, 56, 'Драйверы', ['рост', 'налог'], null, cardK, hiK * 0.5);
      const ang = -2.2 + 3.4 * E.soft(seg(T, 2.0, 2.6)) + (T < 0 ? 0.5 : 0);
      knob(g, -112, -52, ang, knK);
      // три стрелки к стопке листов
      arrow(g, [[-66, -104], [56, -112]], { k: a1, lw: 1.6 });
      arrow(g, [[-66, -94], [56, -94]], { k: a2, lw: 1.6 });
      arrow(g, [[-66, -84], [56, -76]], { k: a3, lw: 1.6 });
      // стопка «Бюджет» из трёх листов
      sheetStack(g, 100, -96, stK, hiK);
      text(g, 'Бюджет', 100, -60, 8, C.ink);
      // подпись
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'одна правка — весь пересчёт', 0, -30, 9, C.umber);
        g.restore();
      }
      sparks(g, 100, -124, hiK > 0 && hiK < 1 ? seg(T, 2.6, 3.2) : 0, 14, 6);
    },
  };

  // ================= 6. ax7-params =================
  SC['ax7-params'] = {
    dur: 5.5,
    width: 380,
    label: 'Какие параметры берём? Робот держит карточку со знаком вопроса.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -96, RX = 40;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [30, -88], hB: [-4, -50], head: [0, -116] }), t);
      let qK = 0, cK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.4, 2.7)) * fade;
        cK = E.back(seg(T, 1.0, 1.4)) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 1.8, 2.1));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      fig(g, bot, RX, 0, {
        sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true },
        held: (g2, J) => held(g2, J, (hF) => {
          if (cK <= 0) { return; }
          g2.save(); g2.globalAlpha = Math.min(1, cK);
          const w = 44, h = 34, x = hF[0] + 8 - w / 2, y = hF[1] - 4 - h / 2;
          rr(g2, x, y, w, h, 4); inkFill(g2, C.paper, 1.5);
          text(g2, '?', x + w / 2, y + h / 2 + 7, 18, C.umber);
          g2.restore();
        }),
      });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -50, -114, 'какие параметры?', qK, { tail: -26, size: 8 });
      text(g, 'параметры', 96, -34, 7, C.muted);
    },
  };

  // ================= 7. ax7-values =================
  SC['ax7-values'] = {
    dur: 7,
    width: 380,
    label: 'Семь значений драйверов появляются по очереди: рост, себестоимость, аренда, ФОТ, маркетинг, налог, деньги.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const vals = ['5%', '62%', '150 000 р.', '400 000 р.', '3%', '6%', '300 000 р.'];
      const names = ['рост', 'доля с/с', 'аренда', 'ФОТ', 'маркетинг', 'налог', 'деньги'];
      const wOf = (s) => s.length * 4.6 + 16;
      // ряд 1: четыре карточки, ряд 2: три
      const row1 = [0, 1, 2, 3], row2 = [4, 5, 6];
      const layout = (idx) => {
        const row = idx < 4 ? row1 : row2;
        const pos = row.indexOf(idx);
        const ws = row.map(wOf);
        const total = ws.reduce((a, b) => a + b, 0) + (row.length - 1) * 14;
        let x = -total / 2;
        for (let i = 0; i <= pos; i++) { x += ws[i] / 2 + (i > 0 ? 14 : 0); if (i < pos) x += ws[i] / 2 - ws[i] / 2; }
        // пересчёт аккуратно: пройдёмся заново
        x = -total / 2;
        for (let i = 0; i < pos; i++) { x += ws[i] + 14; }
        x += ws[pos] / 2;
        return { x, y: idx < 4 ? -114 : -78, w: ws[pos] };
      };
      let doneK = 0;
      const ks = vals.map(() => 0);
      if (T < 0) {
        for (let i = 0; i < vals.length; i++) { ks[i] = 0.9; }
        doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        for (let i = 0; i < vals.length; i++) {
          ks[i] = E.back(seg(T, 0.4 + i * 0.4, 0.7 + i * 0.4)) * fade;
        }
        doneK = seg(T, 3.6, 4.0) * fade;
      }
      for (let i = 0; i < vals.length; i++) {
        const p = layout(i);
        if (ks[i] <= 0) { continue; }
        g.save(); g.globalAlpha = Math.min(1, ks[i]);
        rr(g, p.x - p.w / 2, p.y - 14, p.w, 28, 4); inkFill(g, C.paper, 1.5);
        text(g, vals[i], p.x, p.y - 1, 8.5, C.ink);
        text(g, names[i], p.x, p.y + 10, 5.5, C.muted);
        g.restore();
      }
      tickBadge(g, 0, -40, doneK, 9);
      text(g, 'значения драйверов', 0, -22, 8, C.muted);
    },
  };

  // ================= 8. ax7-base =================
  SC['ax7-base'] = {
    dur: 5.5,
    width: 380,
    label: 'А база выручки? Робот показывает на стопку строк прошлого года.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -96, RX = 30;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [26, -84], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, stK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; stK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.4, 2.7)) * fade;
        stK = E.back(seg(T, 1.0, 1.4)) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 1.8, 2.1));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      // стопка строк прошлого года
      if (stK > 0) {
        g.save(); g.globalAlpha = Math.min(1, stK);
        rr(g, 70, -112, 84, 62, 4); inkFill(g, C.paper, 1.5);
        ln(g, 70, -101, 154, -101, 1.1);
        text(g, '2025', 112, -105, 7, C.muted);
        for (let i = 0; i < 4; i++) {
          words(g, 78, -92 + i * 12, 68, i + 3);
        }
        g.restore();
        text(g, 'выручка прошлого года', 112, -40, 7, C.muted);
      }
      fig(g, bot, RX, 0, { sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -52, -114, 'а база выручки?', qK, { tail: -26, size: 8 });
    },
  };

  // ================= 9. ax7-basecalc =================
  SC['ax7-basecalc'] = {
    dur: 6,
    width: 380,
    label: 'Расчёт базы: двенадцать месяцев 2025 года дают средний месяц 2 326 301,38 р.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let lK = 0, aK = 0, rK = 0, doneK = 0;
      if (T < 0) {
        lK = 0.9; rK = 0.9; doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.7)) * fade;
        aK = E.soft(seg(T, 1.0, 1.5)) * fade;
        rK = E.back(seg(T, 1.5, 1.9)) * fade;
        doneK = seg(T, 2.4, 2.8) * fade;
      }
      // слева: 12 месяцев 2025
      if (lK > 0) {
        g.save(); g.globalAlpha = Math.min(1, lK);
        rr(g, -156, -110, 96, 48, 4); inkFill(g, C.paper, 1.5);
        text(g, '2025', -108, -97, 8, C.ink);
        text(g, '12 месяцев', -108, -84, 7, C.muted);
        for (let i = 0; i < 12; i++) {
          ln(g, -150 + i * 7.4, -74, -150 + i * 7.4, -68, 1.6, C.ink);
        }
        g.restore();
      }
      arrow(g, [[-52, -86], [-16, -86]], { k: aK, lw: 1.8 });
      // справа: средний месяц
      if (rK > 0) {
        g.save(); g.globalAlpha = Math.min(1, rK);
        rr(g, -8, -111, 156, 52, 4); inkFill(g, C.paper, 1.6);
        text(g, 'средний месяц', 70, -97, 7, C.muted);
        text(g, '2 326 301,38 р.', 70, -79, 10.5, C.ink);
        g.restore();
      }
      tickBadge(g, 70, -48, doneK, 9);
      text(g, 'база выручки', 0, -30, 8, C.muted);
      let anya = breathe(P({ hF: [14, -66], hB: [-4, -52], head: [3, -114] }), t);
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
      }
      fig(g, anya, -144, 0, { sx: 1, ink: INK, far: INK_FAR });
      sparks(g, 90, -60, seg(T, 2.4, 3.0), 12, 5);
    },
  };

  // ================= 10. ax7-fot =================
  SC['ax7-fot'] = {
    dur: 5.5,
    width: 380,
    label: 'ФОТ одной суммой? Робот держит крупную карточку 400 000 р.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -96, RX = 40;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [30, -92], hB: [-4, -50], head: [0, -116] }), t);
      let qK = 0, cK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        cK = E.back(seg(T, 1.0, 1.4)) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 1.8, 2.1));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      fig(g, bot, RX, 0, {
        sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true },
        held: (g2, J) => held(g2, J, (hF) => {
          if (cK <= 0) { return; }
          g2.save(); g2.globalAlpha = Math.min(1, cK);
          const w = 78, h = 34, x = hF[0] + 10 - w / 2, y = hF[1] - 6 - h / 2;
          rr(g2, x, y, w, h, 4); inkFill(g2, C.paper, 1.6);
          text(g2, '400 000 р.', x + w / 2, y + h / 2 + 3.5, 10, C.ink);
          g2.restore();
        }),
      });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -52, -114, 'ФОТ одной суммой?', qK, { tail: -26, size: 8 });
      text(g, 'одна сумма', 104, -34, 7, C.muted);
    },
  };

  // ================= 11. ax7-aggregate =================
  SC['ax7-aggregate'] = {
    dur: 6.5,
    width: 380,
    label: 'Только агрегированно: одна сумма с галочкой, список по людям перечёркнут, щит «персональное не уходит».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let lK = 0, doneK = 0, rK = 0, xK = 0, shK = 0;
      if (T < 0) {
        lK = 0.9; doneK = 0.9; rK = 0.9; xK = 0.9; shK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.7)) * fade;
        doneK = seg(T, 0.9, 1.3) * fade;
        rK = E.back(seg(T, 1.5, 1.9)) * fade;
        xK = seg(T, 2.2, 2.6) * fade;
        shK = E.back(seg(T, 3.0, 3.4)) * fade;
      }
      // слева: ФОТ одной суммой
      if (lK > 0) {
        g.save(); g.globalAlpha = Math.min(1, lK);
        rr(g, -158, -110, 100, 44, 4); inkFill(g, C.paper, 1.6);
        text(g, 'ФОТ', -108, -97, 8, C.muted);
        text(g, '400 000 р.', -108, -80, 9.5, C.ink);
        g.restore();
      }
      tickBadge(g, -50, -124, doneK, 8);
      // щит между ними
      if (shK > 0) {
        g.save(); g.globalAlpha = Math.min(1, shK);
        poly(g, [[-18, -116], [18, -116], [18, -96], [0, -76], [-18, -96]], true);
        inkFill(g, C.butterSoft || C.paper, 1.7);
        g.strokeStyle = C.ink; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(-8, -98); g.lineTo(-2, -91); g.lineTo(9, -106); g.stroke();
        g.restore();
        text(g, 'персональное не уходит', 0, -30, 8, C.muted);
      }
      // справа: перечёркнутый список по людям
      if (rK > 0) {
        g.save(); g.globalAlpha = Math.min(1, rK);
        rr(g, 60, -112, 94, 66, 4); inkFill(g, C.paper, 1.5);
        ln(g, 60, -101, 154, -101, 1.1);
        text(g, 'по людям', 107, -105, 7, C.muted);
        for (let i = 0; i < 3; i++) {
          words(g, 68, -90 + i * 14, 78, i + 11);
          circle(g, 143, -92 + i * 14, 4.5);
          g.strokeStyle = C.soft; g.lineWidth = 0.9; g.stroke();
          circle(g, 138, -91 + i * 14, 1.3);
          g.fillStyle = C.soft; g.fill();
        }
        g.restore();
      }
      bigCross(g, 107, -80, 86, 56, xK);
    },
  };

  // ================= 12. ax7-budget =================
  SC['ax7-budget'] = {
    dur: 5.5,
    width: 380,
    label: 'Как попросить сам бюджет? Робот показывает карточку-запрос из трёх строк.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -96, RX = 20;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [26, -84], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        cK = E.back(seg(T, 1.0, 1.4)) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 1.8, 2.1));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      // карточка-запрос из трёх строк
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, 62, -112, 96, 62, 4); inkFill(g, C.paper, 1.5);
        ln(g, 62, -101, 158, -101, 1.1);
        text(g, 'запрос', 110, -105, 7, C.muted);
        const rows3 = [['помесячно', '12'], ['статьи', '11'], ['с драйверов', 'да']];
        for (let i = 0; i < 3; i++) {
          const kk = T < 0 ? 0.9 : E.back(seg(T, 1.4 + i * 0.35, 1.7 + i * 0.35)) * fade0(this, T);
          if (kk <= 0) { continue; }
          g.save(); g.globalAlpha *= Math.min(1, kk);
          text(g, rows3[i][0], 70, -90 + i * 15, 7, C.ink, 'left');
          text(g, rows3[i][1], 150, -90 + i * 15, 7, C.umber, 'right');
          g.restore();
        }
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -52, -114, 'как попросить бюджет?', qK, { tail: -26, size: 8 });
      function fade0(sc, TT) { return 1 - seg(TT, sc.dur - 0.45, sc.dur); }
    },
  };

  // ================= 13. ax7-rows =================
  SC['ax7-rows'] = {
    dur: 7,
    width: 380,
    label: 'Сетка бюджета: 11 статей слева и 12 колонок-месяцев, строки проявляются сверху вниз.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const N = 11, MC = 12;
      let gridK = 0, doneK = 0;
      const rowK = [];
      for (let i = 0; i < N; i++) { rowK[i] = 0; }
      const labels = ['выручка', 'себестоимость', 'валовая', 'аренда', 'ФОТ', 'маркетинг', 'операционная', 'налог', 'чистая', 'поток', 'остаток'];
      if (T < 0) {
        gridK = 0.9; doneK = 0.9;
        for (let i = 0; i < N; i++) { rowK[i] = 0.9; }
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        gridK = E.back(seg(T, 0.25, 0.7)) * fade;
        for (let i = 0; i < N; i++) {
          rowK[i] = E.soft(seg(T, 0.7 + i * 0.3, 1.0 + i * 0.3)) * fade;
        }
        doneK = seg(T, 4.3, 4.7) * fade;
      }
      if (gridK <= 0) { return; }
      g.save();
      g.globalAlpha = Math.min(1, gridK);
      const x0 = -156, yHdr = -130, hdrH = 12, rowH = 9.6;
      const lblW = 62, colW = (300 - lblW - 6) / MC;
      // заголовок месяцев
      rr(g, x0, yHdr, 300, hdrH + N * rowH + 4, 3); inkFill(g, C.paper, 1.5);
      ln(g, x0, yHdr + hdrH, x0 + 300, yHdr + hdrH, 1.1);
      const mon = ['я', 'ф', 'м', 'а', 'м', 'и', 'и', 'а', 'с', 'о', 'н', 'д'];
      for (let c = 0; c < MC; c++) {
        const cx = x0 + lblW + 6 + c * colW;
        if (c > 0) { ln(g, cx, yHdr + 2, cx, yHdr + hdrH + N * rowH, 0.7, C.line); }
        text(g, mon[c], cx + colW / 2, yHdr + 9, 5.5, C.muted);
      }
      ln(g, x0 + lblW + 6, yHdr, x0 + lblW + 6, yHdr + hdrH + N * rowH, 1.1);
      g.restore();
      // строки статей
      for (let i = 0; i < N; i++) {
        if (rowK[i] <= 0) { continue; }
        g.save();
        g.globalAlpha = Math.min(1, rowK[i]);
        const yy = yHdr + hdrH + 5 + i * rowH;
        text(g, labels[i], x0 + 3, yy + 5, 5.5, C.ink, 'left');
        words(g, x0 + lblW + 10, yy + 3, 200, i + 21, '#d9d9d9', 1.4);
        if (i < N - 1) { ln(g, x0 + 2, yy + rowH, x0 + 298, yy + rowH, 0.7, C.line); }
        g.restore();
      }
      tickBadge(g, 140, -10, doneK, 8);
      text(g, 'бюджет на 12 месяцев', 0, -14, 8, C.muted);
    },
  };

  // ================= 14. ax7-check =================
  SC['ax7-check'] = {
    dur: 5.5,
    width: 380,
    label: 'Как проверить большую таблицу? Робот с лупой.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 84;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [26, -90], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, mK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; mK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.4, 2.7)) * fade;
        mK = E.back(seg(T, 1.0, 1.4)) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 1.8, 2.1));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      fig(g, bot, RX, 0, {
        sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true },
        held: (g2, J) => held(g2, J, (hF) => {
          magnifier(g2, hF[0] + 4, hF[1] + 2, mK);
        }),
      });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -40, -114, 'как проверить большую таблицу?', qK, { tail: -26, size: 7.5 });
    },
  };

  // ================= 15. ax7-january =================
  SC['ax7-january'] = {
    dur: 6,
    width: 380,
    label: 'Проверка с января: калькулятор = число января, и просьба объяснить февраль словами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let cK = 0, jK = 0, eqK = 0, doneK = 0, bK = 0;
      if (T < 0) {
        cK = 0.9; jK = 0.9; eqK = 0.9; doneK = 0.9; bK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.3, 0.7)) * fade;
        jK = E.back(seg(T, 1.0, 1.4)) * fade;
        eqK = E.back(seg(T, 1.7, 2.1)) * fade;
        doneK = seg(T, 2.4, 2.8) * fade;
        bK = E.back(seg(T, 3.2, 3.6)) * (1 - seg(T, 5.4, 5.7)) * fade;
      }
      calcIcon(g, -120, -80, cK);
      if (eqK > 0) {
        g.save(); g.globalAlpha = Math.min(1, eqK);
        text(g, '=', -70, -84, 13, C.umber);
        g.restore();
      }
      // карточка «январь» с числом
      if (jK > 0) {
        g.save(); g.globalAlpha = Math.min(1, jK);
        rr(g, -64, -106, 104, 46, 4); inkFill(g, C.paper, 1.6);
        text(g, 'январь', -12, -93, 7, C.muted);
        text(g, '2 326 301,38 р.', -12, -76, 8.5, C.ink);
        g.restore();
      }
      tickBadge(g, -12, -48, doneK, 9);
      // облачко справа
      bubble(g, 88, -93, 'объясни февраль словами', bK, { tail: 0, size: 7, fill: C.butterSoft });
      text(g, 'начните с января', -12, -30, 8, C.muted);
      sparks(g, -12, -56, seg(T, 2.4, 3.0), 12, 5);
    },
  };

  // ================= 16. ax7-checks =================
  SC['ax7-checks'] = {
    dur: 6.5,
    width: 380,
    label: 'Лист проверок: четыре галочки загораются одна за другой.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const rows = ['суммы статей', 'знаки', 'ссылки на драйверы', 'нет персональных'];
      let cardK = 0, lit = 0, doneK = 0;
      if (T < 0) {
        cardK = 0.9; lit = 4; doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cardK = E.back(seg(T, 0.3, 0.7)) * fade;
        lit = clamp((T - 0.9) / 0.7, 0, 4) * fade;
        doneK = seg(T, 3.9, 4.3) * fade;
      }
      let anya = breathe(P({ hF: [14, -66], hB: [-4, -52], head: [3, -114] }), t);
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
      }
      fig(g, anya, 118, 0, { sx: -1, ink: INK, far: INK_FAR });
      if (cardK <= 0) { return; }
      g.save();
      g.globalAlpha = Math.min(1, cardK);
      const w = 150, h = 96, x = -75, y = -128;
      rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.6);
      ln(g, x, y + 15, x + w, y + 15, 1.1);
      text(g, 'Проверки', x + w / 2, y + 11, 8.5, C.ink);
      for (let i = 0; i < 4; i++) {
        const yy = y + 29 + i * 17;
        const on = clamp(lit - i, 0, 1);
        rr(g, x + 10, yy - 7, 9, 9, 2);
        inkFill(g, on > 0.5 ? C.green : C.paper, 1.2, on > 0.5 ? C.greenInk : C.ink);
        if (on > 0) {
          g.save(); g.globalAlpha *= on;
          g.strokeStyle = C.greenInk; g.lineWidth = 1.9;
          g.beginPath();
          g.moveTo(x + 12, yy - 3); g.lineTo(x + 14.4, yy - 0.4); g.lineTo(x + 18, yy - 6.6);
          g.stroke(); g.restore();
        }
        text(g, rows[i], x + 26, yy, 7.5, on > 0.5 ? C.ink : C.soft, 'left');
      }
      g.restore();
      tickBadge(g, 94, -110, doneK, 9);
      sparks(g, 94, -94, seg(T, 3.9, 4.5), 12, 5);
    },
  };

  // ================= 17. ax7-bridge =================
  SC['ax7-bridge'] = {
    dur: 6.5,
    width: 380,
    label: 'Мост: налог — от выручки, не от прибыли; дальше — сценарии.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let nK = 0, a1 = 0, okK = 0, doneK = 0, a2 = 0, badK = 0, pathsK = 0, capK = 0;
      if (T < 0) {
        nK = 0.9; a1 = 0.9; okK = 0.9; doneK = 0.9; a2 = 0.9; badK = 0.9; pathsK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        nK = E.back(seg(T, 0.3, 0.7)) * fade;
        a1 = E.soft(seg(T, 0.8, 1.3)) * fade;
        okK = E.back(seg(T, 1.2, 1.6)) * fade;
        doneK = seg(T, 1.7, 2.1) * fade;
        a2 = E.soft(seg(T, 2.1, 2.6)) * fade;
        badK = seg(T, 2.6, 3.0) * fade;
        pathsK = E.soft(seg(T, 3.4, 4.0)) * fade;
        capK = E.back(seg(T, 4.1, 4.5)) * (1 - seg(T, 5.9, 6.2)) * fade;
      }
      // карточка «налог»
      signCard(g, -124, -96, 66, 28, 'налог', nK, 10);
      // стрелка к «от выручки» + галочка
      arrow(g, [[-88, -104], [-18, -110]], { k: a1, lw: 1.6 });
      if (okK > 0) {
        g.save(); g.globalAlpha = Math.min(1, okK);
        rr(g, -14, -122, 66, 24, 4); inkFill(g, C.paper, 1.5);
        text(g, 'от выручки', 19, -105, 8, C.ink);
        g.restore();
      }
      tickBadge(g, 62, -110, doneK, 8);
      // стрелка к «от прибыли» + крест
      arrow(g, [[-88, -88], [-18, -82]], { k: a2, lw: 1.6 });
      if (badK > 0) {
        g.save(); g.globalAlpha = Math.min(1, badK);
        rr(g, -14, -76, 66, 24, 4); inkFill(g, C.paper, 1.5);
        text(g, 'от прибыли', 19, -59, 8, C.redInk);
        g.restore();
      }
      bigCross(g, 19, -64, 58, 22, badK * 0.9);
      // три расходящиеся дорожки справа
      if (pathsK > 0) {
        arrow(g, [[86, -70], [142, -44]], { k: pathsK, lw: 1.5, col: C.umber });
        arrow(g, [[86, -78], [150, -78]], { k: pathsK, lw: 1.5, col: C.umber });
        arrow(g, [[86, -86], [142, -112]], { k: pathsK, lw: 1.5, col: C.umber });
      }
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'дальше: сценарии', 118, -30, 8, C.umber);
        g.restore();
      }
      let anya = breathe(P({ hF: [14, -66], hB: [-4, -52], head: [3, -114] }), t);
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
      }
      fig(g, anya, -150, 0, { sx: 1, ink: INK, far: INK_FAR });
    },
  };
})();
