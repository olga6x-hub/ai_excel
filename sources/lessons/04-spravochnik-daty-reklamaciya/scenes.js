// Урок 4 «Справочник, даты и рекламация»: 17 сцен.
// Load after stick.js: <stick-scene scene="ax4-intro" play="view"></stick-scene>
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, mix, fig, inkFill, rr, ln, circle, text, seg, breathe, pulse, bubble, words, tickBadge, sparks, pill, arrow } = R;

  const ORG = '#d97757', ORG_FAR = '#e8b7a3';          // агент-робот
  const INK = C.ink, INK_FAR = C.far;                   // Аня (герой)

  // лист-карточка с заголовком и строками-словами
  function sheetCard(g, x, y, w, h, title, rows, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    if (title) { text(g, title, x + w / 2, y + 9, 7, C.muted); }
    for (let i = 0; i < rows; i++) { words(g, x + 6, y + (title ? 18 : 8) + i * 9, w - 12, i + 1); }
    g.restore();
  }

  // табличка-надпись в рамке
  function signCard(g, cx, cy, w, h, s, k, size, col) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    rr(g, cx - w / 2, cy - h / 2, w, h, 4); inkFill(g, C.paper, 1.6);
    text(g, s, cx, cy + (size || 9) * 0.35, size || 9, col || C.ink);
    g.restore();
  }

  // пунктирная рамка (пустое место, шаблон)
  function dashBox(g, x, y, w, h, k, col) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    g.setLineDash([4, 4]);
    g.strokeStyle = col || C.muted;
    g.lineWidth = 1.5;
    rr(g, x, y, w, h, 4);
    g.stroke();
    g.setLineDash([]);
    g.restore();
  }

  // пунктирная линия-связь, рисуется постепенно
  function dashLine(g, x0, y0, x1, y1, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    g.setLineDash([5, 4]);
    g.strokeStyle = C.ink;
    g.lineWidth = 1.6;
    g.beginPath();
    const n = Math.floor(14 * Math.min(1, k));
    for (let i = 0; i <= n; i++) {
      const kk = i / 14;
      const px = x0 + (x1 - x0) * kk, py = y0 + (y1 - y0) * kk;
      if (i === 0) { g.moveTo(px, py); } else { g.lineTo(px, py); }
    }
    g.stroke();
    g.setLineDash([]);
    g.restore();
  }

  // лупа: круг + ручка
  function mag(g, x, y, r, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    inkFill(g, 'rgba(255,255,255,0.35)', 2);
    ln(g, x + r * 0.7, y + r * 0.7, x + r * 1.7, y + r * 1.7, 3, C.ink);
    g.restore();
  }

  // мусорная корзина
  function bin(g, x, y, k) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    ln(g, x - 8, y - 22, x + 8, y - 22, 2, C.ink);          // крышка
    ln(g, x - 4, y - 25, x + 4, y - 25, 2, C.ink);          // ручка
    g.beginPath();
    g.moveTo(x - 7, y - 22); g.lineTo(x - 5, y); g.lineTo(x + 5, y); g.lineTo(x + 7, y - 22);
    g.closePath();
    inkFill(g, C.paper, 1.6);
    g.restore();
  }

  // ================= 1. ax4-intro =================
  SC['ax4-intro'] = {
    dur: 6.5,
    width: 380,
    label: 'Четыре задачи урока: справочник, даты, маржа, дубли — карточки загораются по очереди.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -104, RX = 96;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      const labels = ['справочник', 'даты', 'маржа', 'дубли'];
      const xs = [-102, -34, 34, 102];
      const ws = [62, 40, 48, 42];
      let ks = [0, 0, 0, 0];
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        ks = [0.9, 0.9, 0.9, 0.9];
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        const at = [0.4, 1.0, 1.6, 2.2];
        for (let i = 0; i < 4; i++) { ks[i] = E.back(seg(T, at[i], at[i] + 0.35)) * fade; }
        // Аня отсчитывает задачи по пальцам
        let lift = 0;
        for (let i = 0; i < 4; i++) {
          const p = (T - at[i]) / 0.7;
          if (p > 0 && p < 1) { lift = Math.max(lift, Math.sin(Math.PI * p)); }
        }
        anya = mix(anya, P({ hF: [24, -112], head: [6, -115] }, anya), lift * 0.9);
        bot = mix(bot, P({ head: [-4, -112], chest: [-1, -90] }, bot),
          E.soft(seg(T, 0.5, 1.0)) * (1 - E.soft(seg(T, 3.2, 3.6))));
      }
      for (let i = 0; i < 4; i++) { signCard(g, xs[i], -122, ws[i], 22, labels[i], ks[i], 7.5); }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      if (T >= 0) text(g, 'четыре задачи', 0, -46, 8, C.muted);
    },
  };

  // ================= 2. ax4-two-sheets =================
  SC['ax4-two-sheets'] = {
    dur: 6,
    width: 380,
    label: 'Два листа в файле: длинный «Сделки» и короткий «Справочник»; вопрос — отдельный лист?',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -132;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let lK = 0, rK = 0, qK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        lK = 0.9; rK = 0.9; qK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.75)) * fade;
        rK = E.back(seg(T, 0.9, 1.35)) * fade;
        qK = E.back(seg(T, 1.8, 2.15)) * (1 - seg(T, 4.6, 4.9)) * fade;
        const talk = seg(T, 1.8, 2.15) * (1 - seg(T, 4.4, 4.7));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      sheetCard(g, -58, -104, 74, 76, 'Сделки', 6, lK);
      sheetCard(g, 42, -78, 74, 44, 'Справочник', 3, rK);
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -46, -114, 'отдельный лист?', qK, { tail: -30, size: 8 });
    },
  };

  // ================= 3. ax4-link =================
  SC['ax4-link'] = {
    dur: 6.5,
    width: 380,
    label: 'Связка двух листов по артикулу: в «Сделках» вырастает колонка «поставщик».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let lK = 0, rK = 0, lnK = 0, keyK = 0, colK = 0, lblK = 0;
      if (T < 0) {
        lK = 0.9; rK = 0.9; lnK = 0.9; keyK = 0.9; colK = 0.9; lblK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.25, 0.6)) * fade;
        rK = E.back(seg(T, 0.6, 0.95)) * fade;
        lnK = seg(T, 1.3, 2.0) * fade;
        keyK = E.back(seg(T, 1.9, 2.2)) * fade;
        colK = E.soft(seg(T, 2.7, 3.6)) * fade;
        lblK = E.back(seg(T, 3.7, 4.0)) * fade;
      }
      sheetCard(g, -130, -110, 74, 76, 'Сделки', 6, lK);
      sheetCard(g, 34, -84, 74, 44, 'Справочник', 3, rK);
      dashLine(g, -52, -80, 30, -80, lnK);
      if (keyK > 0) pill(g, -11, -92, 'артикул', C.butterSoft, C.umber, 7.5);
      // новая колонка в левом листе
      if (lK > 0 && colK > 0.01) {
        const x = -66, yB = -38, hT = 62 * E.soft(colK);
        g.save();
        g.globalAlpha = Math.min(1, lK);
        g.fillStyle = C.butter;
        g.fillRect(x, yB - hT, 8, hT);
        g.strokeStyle = C.ink; g.lineWidth = 1.2;
        g.strokeRect(x, yB - hT, 8, hT);
        g.restore();
      }
      if (lblK > 0) {
        g.save(); g.globalAlpha = Math.min(1, lblK);
        text(g, 'поставщик', -62, -24, 7.5, C.muted);
        g.restore();
      }
    },
  };

  // ================= 4. ax4-notfound =================
  SC['ax4-notfound'] = {
    dur: 6,
    width: 380,
    label: 'Артикула нет в справочнике: строка с вопросом, пустое место в рамке.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let rK = 0, qK = 0, refK = 0, gapK = 0, capK = 0;
      if (T < 0) {
        rK = 0.9; qK = 0.9; refK = 0.9; gapK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        rK = E.back(seg(T, 0.3, 0.7)) * fade;
        qK = E.back(seg(T, 0.9, 1.25)) * fade;
        refK = E.back(seg(T, 1.5, 1.9)) * fade;
        gapK = seg(T, 2.1, 2.5) * fade;
        capK = E.back(seg(T, 2.7, 3.0)) * fade;
      }
      // крупная строка таблицы
      if (rK > 0) {
        g.save(); g.globalAlpha = Math.min(1, rK);
        rr(g, -150, -112, 128, 30, 4); inkFill(g, C.paper, 1.6);
        words(g, -142, -97, 70, 3);
        g.restore();
      }
      if (qK > 0) {
        g.save(); g.globalAlpha = Math.min(1, qK);
        text(g, '?', -40, -90, 22, C.umber);
        g.restore();
      }
      // карточка справочника с пустым местом
      if (refK > 0) {
        g.save(); g.globalAlpha = Math.min(1, refK);
        rr(g, 34, -124, 96, 70, 4); inkFill(g, C.paper, 1.5);
        text(g, 'Справочник', 82, -112, 7, C.muted);
        words(g, 42, -100, 60, 1);
        words(g, 42, -89, 60, 2);
        g.restore();
      }
      dashBox(g, 42, -78, 80, 16, gapK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'нет такого артикула', 82, -40, 7, C.redInk);
        g.restore();
      }
    },
  };

  // ================= 5. ax4-honest =================
  SC['ax4-honest'] = {
    dur: 6,
    width: 380,
    label: 'Честный ответ «не найдено» вместо выдумки: счётчик 24 строки, галочка.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let cK = 0, nK = 0, dK = 0, capK = 0;
      if (T < 0) {
        cK = 0.9; nK = 0.9; dK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.3, 0.7)) * fade;
        nK = E.back(seg(T, 1.1, 1.5)) * fade;
        dK = seg(T, 2.1, 2.5) * fade;
        capK = E.back(seg(T, 2.8, 3.1)) * (1 - seg(T, 4.8, 5.1)) * fade;
      }
      signCard(g, -96, -104, 76, 26, 'не найдено', cK, 9, C.redInk);
      if (nK > 0) {
        g.save(); g.globalAlpha = Math.min(1, nK);
        rr(g, 4, -118, 66, 30, 4); inkFill(g, C.paper, 1.5);
        text(g, '24', 37, -100, 13, C.ink);
        text(g, 'строки', 37, -92, 6.5, C.muted);
        g.restore();
      }
      tickBadge(g, 110, -104, dK, 10);
      text(g, 'это ценная находка', 0, -50, 7.5, C.muted);
      bubble(g, 0, -66, 'не выдумываем', capK, { tail: 0, size: 8, fill: C.butterSoft });
      sparks(g, 110, -118, dK > 0 && T >= 0 ? seg(T, 2.1, 2.7) : 0, 12, 5);
    },
  };

  // ================= 6. ax4-howto =================
  SC['ax4-howto'] = {
    dur: 6,
    width: 380,
    label: 'Как сформулировать запрос: робот указывает на пустую карточку-шаблон.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -104, RX = 24;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [30, -92], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, tK = 0, aK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; tK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.4, 2.7)) * fade;
        tK = E.back(seg(T, 1.2, 1.6)) * fade;
        aK = seg(T, 1.2, 1.7) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 2.2, 2.5));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
        bot = mix(bot, P({ hF: [34, -96], head: [4, -114] }, bot),
          E.soft(seg(T, 1.0, 1.5)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      fig(g, bot, RX, 0, { sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      bubble(g, -58, -114, 'как сформулировать?', qK, { tail: -28, size: 8 });
      // пустая карточка-шаблон
      if (tK > 0) {
        g.save(); g.globalAlpha = Math.min(1, tK) * 0.9;
        rr(g, 68, -128, 52, 50, 4); inkFill(g, C.paper, 1.5);
        g.restore();
      }
      dashBox(g, 74, -122, 40, 38, tK, C.soft);
      if (tK > 0.3) {
        g.save(); g.globalAlpha = Math.min(1, (tK - 0.3) / 0.7) * 0.7;
        words(g, 80, -110, 30, 4);
        words(g, 80, -98, 30, 5);
        g.restore();
      }
      if (aK > 0) arrow(g, [[52, -88], [64, -104]], { k: aK, col: C.umber });
      text(g, 'шаблон запроса', 94, -66, 6.5, C.muted);
    },
  };

  // ================= 7. ax4-request =================
  SC['ax4-request'] = {
    dur: 7,
    width: 380,
    label: 'Запрос из трёх строк летит к роботу, в таблице вырастает колонка поставщика.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -112, RX = 72;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let cardK = 0, tblK = 0, colK = 0, doneK = 0, lblK = 0;
      let cx = -96, cy = -104;
      // карточка запроса: три строки-слова
      function reqCard(g, x, y, k) {
        if (k <= 0) { return; }
        g.save(); g.globalAlpha = Math.min(1, k);
        rr(g, x, y, 62, 42, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 3; i++) { words(g, x + 6, y + 9 + i * 11, 50, i + 2); }
        g.restore();
      }
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        cardK = 0.9; cy = -104;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        const fly = E.soft(seg(T, 0.7, 1.8));
        cx = -96 + (72 - 10 + 96) * fly;
        cy = -104 - 22 * Math.sin(Math.PI * fly);
        cardK = (1 - seg(T, 1.7, 2.1)) * fade;
        tblK = seg(T, 2.3, 2.9) * fade;
        colK = E.soft(seg(T, 3.0, 3.8)) * fade;
        doneK = seg(T, 4.0, 4.4) * fade;
        lblK = E.back(seg(T, 4.2, 4.5)) * fade;
        bot = mix(bot, P({ head: [-4, -112] }, bot), E.soft(seg(T, 1.9, 2.3)) * (1 - E.soft(seg(T, 2.9, 3.2))));
      }
      // таблица с растущей колонкой
      if (tblK > 0) {
        g.save(); g.globalAlpha = Math.min(1, tblK);
        rr(g, 88, -107, 60, 52, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 4; i++) { words(g, 94, -96 + i * 10, 30, i + 1); }
        g.restore();
        if (colK > 0.01) {
          const hT = 40 * E.soft(colK);
          g.fillStyle = C.butter;
          g.fillRect(132, -55 - hT, 10, hT);
          g.strokeStyle = C.ink; g.lineWidth = 1.2;
          g.strokeRect(132, -55 - hT, 10, hT);
        }
      }
      reqCard(g, cx, cy, cardK);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      if (cardK > 0.5) text(g, 'запрос', cx + 31, cy - 6, 7, C.muted);
      if (lblK > 0) text(g, 'поставщик', 137, -24, 7, C.muted);
      sparks(g, 130, -92, T >= 0 ? seg(T, 4.0, 4.6) : 0, 12, 5);
    },
  };

  // ================= 8. ax4-next =================
  SC['ax4-next'] = {
    dur: 5.5,
    width: 380,
    label: 'Что дальше: стрелка к календарю — впереди работа с датами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -92, RX = 42;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [28, -92], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, aK = 0, calK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; aK = 0.9; calK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        aK = seg(T, 1.0, 1.6) * fade;
        calK = E.back(seg(T, 1.5, 1.9)) * fade;
        bot = mix(bot, P({ hF: [32, -96], head: [4, -114] }, bot),
          E.soft(seg(T, 1.3, 1.8)) * (1 - E.soft(seg(T, 3.4, 3.8))));
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 2.0, 2.3));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      fig(g, bot, RX, 0, { sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      bubble(g, -50, -114, 'что дальше?', qK, { tail: -26, size: 8 });
      arrow(g, [[-16, -124], [34, -124]], { k: aK, col: C.umber, lw: 2 });
      // календарик
      if (calK > 0) {
        g.save(); g.globalAlpha = Math.min(1, calK);
        rr(g, 76, -132, 48, 56, 4); inkFill(g, C.paper, 1.5);
        g.fillStyle = C.butter;
        g.fillRect(78, -128, 44, 10);
        g.strokeStyle = C.ink; g.lineWidth = 1;
        g.strokeRect(78, -128, 44, 10);
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 4; c++) { circle(g, 86 + c * 10, -110 + r * 10, 2.4); g.fillStyle = C.soft; g.fill(); }
        }
        ln(g, 84, -138, 84, -132, 2);
        ln(g, 116, -138, 116, -132, 2);
        g.restore();
      }
      text(g, 'даты', 100, -66, 7, C.muted);
    },
  };

  // ================= 9. ax4-dates =================
  SC['ax4-dates'] = {
    dur: 6.5,
    width: 380,
    label: 'Из даты 14.03.2025 получаются столбцы «март» и «1 квартал»; проверка — 12 месяцев.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let dK = 0, aK = 0, mK = 0, qK = 0, okK = 0, lblK = 0;
      if (T < 0) {
        dK = 0.9; aK = 0.9; mK = 0.9; qK = 0.9; okK = 0.9; lblK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        dK = E.back(seg(T, 0.3, 0.7)) * fade;
        aK = seg(T, 1.1, 1.7) * fade;
        mK = E.back(seg(T, 1.8, 2.2)) * fade;
        qK = E.back(seg(T, 2.3, 2.7)) * fade;
        okK = seg(T, 3.3, 3.7) * fade;
        lblK = E.back(seg(T, 3.8, 4.1)) * (1 - seg(T, 5.4, 5.7)) * fade;
      }
      signCard(g, -118, -110, 72, 26, '14.03.2025', dK, 9);
      arrow(g, [[-76, -110], [-40, -110]], { k: aK, col: C.umber });
      signCard(g, -6, -122, 52, 24, 'март', mK, 8.5);
      signCard(g, 62, -122, 60, 24, '1 квартал', qK, 8.5);
      tickBadge(g, 28, -70, okK, 10);
      bubble(g, 28, -46, '12 месяцев на месте', lblK, { tail: 0, size: 8, fill: C.butterSoft });
    },
  };

  // ================= 10. ax4-margin =================
  SC['ax4-margin'] = {
    dur: 6,
    width: 380,
    label: 'Маржа: прибыль делённая на выручка, значок процента.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -100;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let qK = 0, cK = 0, pK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9; pK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        cK = E.back(seg(T, 1.1, 1.5)) * fade;
        pK = E.back(seg(T, 2.0, 2.4)) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 2.0, 2.3));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -58, -114, 'а маржа?', qK, { tail: -26, size: 8 });
      // карточка с формулой словами
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, 6, -122, 104, 36, 4); inkFill(g, C.paper, 1.6);
        text(g, 'прибыль / выручка', 58, -102, 9, C.ink);
        g.restore();
      }
      // значок процента
      if (pK > 0) {
        g.save(); g.globalAlpha = Math.min(1, pK);
        circle(g, 136, -92, 15);
        inkFill(g, C.butterSoft, 1.8, C.umber);
        text(g, '%', 136, -87, 14, C.umber);
        g.restore();
      }
    },
  };

  // ================= 11. ax4-divzero =================
  SC['ax4-divzero'] = {
    dur: 6,
    width: 380,
    label: 'Деление на ноль запрещено: щит «защита» и метка «проверить».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let zK = 0, xK = 0, shK = 0, pK = 0;
      if (T < 0) {
        zK = 0.9; xK = 0.9; shK = 0.9; pK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        zK = E.back(seg(T, 0.3, 0.7)) * fade;
        xK = seg(T, 1.0, 1.5) * fade;
        shK = E.back(seg(T, 1.8, 2.2)) * fade;
        pK = E.back(seg(T, 2.8, 3.1)) * fade;
      }
      // «/ 0»
      if (zK > 0) {
        g.save(); g.globalAlpha = Math.min(1, zK);
        text(g, '/ 0', -104, -92, 24, C.ink);
        g.restore();
      }
      if (xK > 0) {
        g.save(); g.globalAlpha = Math.min(1, xK);
        const p = E.soft(xK);
        ln(g, -132, -101 - 3 * p, -132 + 58 * p, -101 + 3 * p, 2.6, C.redInk);
        g.restore();
      }
      // щит «защита»
      if (shK > 0) {
        g.save(); g.globalAlpha = Math.min(1, shK);
        g.beginPath();
        g.moveTo(14, -132); g.lineTo(60, -132); g.lineTo(60, -96);
        g.lineTo(37, -76); g.lineTo(14, -96); g.closePath();
        inkFill(g, C.butterSoft, 1.8);
        g.restore();
        if (shK > 0.4) {
          g.save(); g.globalAlpha = Math.min(1, (shK - 0.4) / 0.6);
          g.strokeStyle = C.ink; g.lineWidth = 2;
          g.beginPath(); g.moveTo(25, -110); g.lineTo(33, -101); g.lineTo(50, -120); g.stroke();
          g.restore();
        }
        text(g, 'защита', 37, -62, 8, C.ink);
      }
      if (pK > 0) pill(g, 112, -104, 'проверить', C.paper, C.redInk, 8);
    },
  };

  // ================= 12. ax4-diagnose =================
  SC['ax4-diagnose'] = {
    dur: 6,
    width: 380,
    label: 'Робот держит карточку «#ДЕЛ/0!» и лупу: диагноз ошибки деления.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -122, RX = -6;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [30, -92], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0, mK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9; mK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        cK = E.back(seg(T, 1.1, 1.5)) * fade;
        mK = E.back(seg(T, 1.9, 2.3)) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 2.0, 2.3));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
        bot = mix(bot, P({ hF: [32, -96], head: [4, -114] }, bot),
          E.soft(seg(T, 1.0, 1.5)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      fig(g, bot, RX, 0, {
        sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true },
        held: (g2, J) => R.held(g2, J, (hF) => {
          if (cK > 0) {
            g2.save(); g2.globalAlpha = Math.min(1, cK);
            rr(g, hF[0] - 10, hF[1] - 16, 60, 26, 4); inkFill(g2, C.paper, 1.5);
            text(g2, '#ДЕЛ/0!', hF[0] + 20, hF[1] + 1, 9, C.redInk);
            g2.restore();
          }
        }),
      });
      bubble(g, -82, -114, 'ошибку деления?', qK, { tail: -26, size: 8 });
      mag(g, 84, -100, 12, mK);
      text(g, 'диагноз', 84, -70, 7, C.muted);
    },
  };

  // ================= 13. ax4-readerrors =================
  SC['ax4-readerrors'] = {
    dur: 6,
    width: 380,
    label: 'Два диагноза: «не нашёл ключ» — проблема в справочнике, «поделил на пустое» — пропуск.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let c1 = 0, c2 = 0;
      function diagCard(g, x, y, w, h, top, bottom, k) {
        if (k <= 0) { return; }
        g.save(); g.globalAlpha = Math.min(1, k);
        rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
        if (k > 0.6) {
          g.save();
          g.globalAlpha = Math.min(1, (k - 0.6) / 0.4) * 0.5;
          g.fillStyle = C.butter;
          g.fillRect(x + 2, y + 2, w - 4, h - 4);
          g.restore();
          rr(g, x, y, w, h, 4); inkFill(g, C.paper, 0.001);
        }
        text(g, top, x + w / 2, y + 16, 8, C.ink);
        text(g, bottom, x + w / 2, y + 32, 7.5, C.redInk);
        g.restore();
      }
      if (T < 0) {
        c1 = 0.9; c2 = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        c1 = E.back(seg(T, 0.4, 0.85)) * fade;
        c2 = E.back(seg(T, 2.0, 2.45)) * fade;
      }
      diagCard(g, -148, -122, 128, 44, 'не нашёл ключ', '→ справочник', c1);
      diagCard(g, 20, -122, 128, 44, 'поделил на пустое', '→ пропуск', c2);
      text(g, 'читаем как диагност', 0, -52, 8, C.muted);
    },
  };

  // ================= 14. ax4-dups =================
  SC['ax4-dups'] = {
    dur: 6,
    width: 380,
    label: 'Дубликаты ищет агент: робот с лупой над таблицей сделок.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -102, RX = 34;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [28, -88], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, tK = 0, mK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; tK = 0.9; mK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.4, 2.7)) * fade;
        tK = E.back(seg(T, 1.2, 1.6)) * fade;
        mK = E.back(seg(T, 2.0, 2.4)) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 2.2, 2.5));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
        bot = mix(bot, P({ hF: [32, -92], head: [4, -114] }, bot),
          E.soft(seg(T, 1.8, 2.3)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -56, -114, 'дубли ищет агент?', qK, { tail: -26, size: 8 });
      // таблица под лупой
      if (tK > 0) {
        g.save(); g.globalAlpha = Math.min(1, tK);
        rr(g, 62, -64, 90, 46, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 4; i++) { ln(g, 70, -54 + i * 10, 128, -54 + i * 10, 1.1); }
        // две одинаковые строки — кандидаты в дубли
        ln(g, 70, -44, 128, -44, 2.2, C.umber);
        ln(g, 70, -34, 128, -34, 2.2, C.umber);
        g.restore();
      }
      fig(g, bot, RX, 0, {
        sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true },
        held: (g2, J) => R.held(g2, J, (hF) => { mag(g2, hF[0] + 14, hF[1] - 6, 10, mK); }),
      });
      text(g, 'номера сделок', 107, -8, 7, C.muted);
    },
  };

  // ================= 15. ax4-dups-safe =================
  SC['ax4-dups-safe'] = {
    dur: 6.5,
    width: 380,
    label: 'Вторая строка помечена «дубль», корзина перечёркнута: строки не удаляем.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let r1 = 0, r2 = 0, tagK = 0, binK = 0, xK = 0, capK = 0;
      function row(g, x, y, k) {
        if (k <= 0) { return; }
        g.save(); g.globalAlpha = Math.min(1, k);
        rr(g, x, y, 108, 18, 3); inkFill(g, C.paper, 1.4);
        ln(g, x + 8, y + 9, x + 62, y + 9, 1.1);
        words(g, x + 70, y + 9.5, 30, 7);
        g.restore();
      }
      if (T < 0) {
        r1 = 0.9; r2 = 0.9; tagK = 0.9; binK = 0.9; xK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        r1 = E.back(seg(T, 0.3, 0.7)) * fade;
        r2 = E.back(seg(T, 0.9, 1.3)) * fade;
        tagK = E.back(seg(T, 1.7, 2.05)) * fade;
        binK = E.back(seg(T, 2.6, 3.0)) * fade;
        xK = seg(T, 3.4, 3.9) * fade;
        capK = E.back(seg(T, 4.3, 4.6)) * (1 - seg(T, 5.6, 5.9)) * fade;
      }
      row(g, -150, -124, r1);
      row(g, -150, -98, r2);
      if (tagK > 0) {
        g.save(); g.globalAlpha = Math.min(1, tagK);
        pill(g, -24, -89, 'дубль', C.butterSoft, C.umber, 7.5);
        g.restore();
      }
      bin(g, 60, -74, binK); // корзина: низ на y=-74
      if (xK > 0) {
        g.save(); g.globalAlpha = Math.min(1, xK);
        g.strokeStyle = C.redInk; g.lineWidth = 2.4;
        ln(g, 46, -102, 76, -72, 2.4, C.redInk);
        ln(g, 76, -102, 46, -72, 2.4, C.redInk);
        g.restore();
      }
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'строки не удаляем', 110, -66, 7.5, C.redInk);
        text(g, 'сначала смотрим', 110, -54, 7, C.muted);
        g.restore();
      }
    },
  };

  // ================= 16. ax4-claim =================
  SC['ax4-claim'] = {
    dur: 6,
    width: 380,
    label: 'Рекламация: ожидалось 4200, получилось 4020 — знак неравенства между числами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -108;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let qK = 0, cK = 0, eqK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9; eqK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.2, 2.5)) * fade;
        cK = E.back(seg(T, 1.1, 1.5)) * fade;
        eqK = E.back(seg(T, 2.0, 2.4)) * fade;
        const talk = seg(T, 0.3, 0.65) * (1 - seg(T, 2.0, 2.3));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -62, -114, 'а если ошибся?', qK, { tail: -26, size: 8 });
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, -24, -128, 128, 46, 4); inkFill(g, C.paper, 1.6);
        text(g, 'ожидалось', 8, -118, 6.5, C.muted);
        text(g, '4 200', 8, -100, 11, C.ink);
        text(g, 'получилось', 92, -118, 6.5, C.muted);
        text(g, '4 020', 92, -100, 11, C.redInk);
        g.restore();
      }
      if (eqK > 0) {
        g.save(); g.globalAlpha = Math.min(1, eqK);
        text(g, '≠', 50, -98, 15, C.redInk);
        g.restore();
      }
      text(g, 'рекламация', 40, -64, 7.5, C.muted);
    },
  };

  // ================= 17. ax4-bridge =================
  SC['ax4-bridge'] = {
    dur: 7,
    width: 380,
    label: 'Мост к проверкам: «исправь и покажи», три способа — словами, 3 строки, другим способом.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const RX = 62;
      let bot = breathe(P({ hF: [10, -60], hB: [-4, -50], head: [2, -116] }), t);
      let bK = 0, spK = 0, k1 = 0, k2 = 0, k3 = 0, doneK = 0;
      if (T < 0) {
        bK = 0.9; k1 = k2 = k3 = 0.9; doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        bK = E.back(seg(T, 0.4, 0.75)) * (1 - seg(T, 2.6, 2.9)) * fade;
        spK = seg(T, 2.2, 2.8) * fade;
        k1 = E.back(seg(T, 3.0, 3.35)) * fade;
        k2 = E.back(seg(T, 3.5, 3.85)) * fade;
        k3 = E.back(seg(T, 4.0, 4.35)) * fade;
        doneK = seg(T, 4.9, 5.3) * fade;
        bot = mix(bot, P({ head: [-6, -113], chest: [-2, -90] }, bot),
          E.soft(seg(T, 1.6, 2.0)) * (1 - E.soft(seg(T, 3.0, 3.4))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      bubble(g, 6, -114, 'исправь и покажи', bK, { tail: 30, size: 8 });
      sparks(g, RX - 20, -110, spK, 13, 6);
      signCard(g, -96, -64, 62, 22, 'словами', k1, 8);
      signCard(g, 0, -64, 62, 22, '3 строки', k2, 8);
      signCard(g, 96, -64, 78, 22, 'другим способом', k3, 7.5);
      text(g, 'три способа проверки', 0, -34, 7.5, C.muted);
      tickBadge(g, 148, -34, doneK, 9);
    },
  };
})();
