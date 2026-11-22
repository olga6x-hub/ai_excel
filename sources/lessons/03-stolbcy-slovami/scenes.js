// Урок 3 «Столбцы словами»: 17 сцен.
// Аня (чёрная фигура) объясняет, слушатель-робот (оранжевый #d97757) спрашивает и кивает.
// Load after stick.js: <stick-scene scene="ax3-intro" play="view"></stick-scene>
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, mix, fig, inkFill, rr, ln, text, seg, clamp, breathe, pulse, bubble, words, tickBadge, sparks, arrow, circle } = R;

  const ORG = '#d97757', ORG_FAR = '#e8b7a3';          // агент-робот
  const INK = C.ink, INK_FAR = C.far;                   // Аня (герой)

  // маленькая таблица-файл: строки + подсвеченный «новый столбец» (k = 0..1)
  function fileCard(g, x, y, k, done) {
    if (k <= 0) { return; }
    const w = 64, h = 50;
    g.save();
    g.globalAlpha = Math.min(1, k);
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    for (let i = 0; i < 4; i++) ln(g, x + 6, y + 12 + i * 10, x + w - 24, y + 12 + i * 10, 1.1);
    const colH = (h - 12) * E.soft(k);
    if (colH > 0.5) {
      g.fillStyle = C.butter;
      g.fillRect(x + w - 16, y + h - 6 - colH, 10, colH);
      g.strokeStyle = C.ink; g.lineWidth = 1.2;
      g.strokeRect(x + w - 16, y + h - 6 - colH, 10, colH);
    }
    g.restore();
    tickBadge(g, x + w - 4, y + 4, done);
  }

  // табличка-слово в карточке
  function signCard(g, cx, cy, w, h, s, k, size) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const x = cx - w / 2, y = cy - h / 2;
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.6);
    text(g, s, cx, cy + (size || 9) * 0.35, size || 9, C.ink);
    g.restore();
  }

  // слот-колонка с короткой подписью сверху (для ax3-intro)
  function slot(g, x, y, k, label) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    rr(g, x, y, 32, 13, 2); inkFill(g, C.paper, 1.2, C.soft);
    if (label) text(g, label, x + 16, y + 6.5 + 5.5 * 0.35, 5.5, C.soft);
    g.restore();
  }

  // карточка с числом (для ax3-claim)
  function numCard(g, x, y, s, k, title) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const w = 100, h = 30;
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    text(g, title, x + w / 2, y + 10, 6, C.muted);
    text(g, s, x + w / 2, y + 23, 7.5, C.ink);
    g.restore();
  }

  // лёгкое «говорение» — кивок головы в окне [a, b]
  function talk(p, T, a, b) {
    const w = seg(T, a, a + 0.3) * (1 - seg(T, b - 0.3, b));
    const m = Math.abs(Math.sin(T * 10)) * 1.4 * w;
    return Object.assign({}, p, { head: [p.head[0] + m * 0.4, p.head[1] - m] });
  }

  // кивок робота в окне [a, d] (разгон b, возврат c..d)
  function nod(bot, T, a, b, c, d) {
    return mix(bot, P({ head: [-4, -112], chest: [-1, -90] }, bot), E.soft(seg(T, a, b)) * (1 - E.soft(seg(T, c, d))));
  }

  // 1. Чистый файл и восемь пустых колонок-слотов
  SC['ax3-intro'] = {
    dur: 6.5,
    width: 380,
    label: 'Чистый файл с галочкой, сверху проявляются восемь колонок-слотов с названиями.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -105, RX = 88;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let fK = 0, dK = 0;
      let slots = [];
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        fK = 0.9; dK = 0.9; slots = [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9];
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        for (let i = 0; i < 8; i++) slots[i] = E.back(seg(T, 0.4 + i * 0.2, 0.7 + i * 0.2)) * fade;
        fK = E.back(seg(T, 1.2, 1.7)) * fade;
        dK = seg(T, 2.0, 2.4) * fade;
        anya = talk(anya, T, 0.4, 2.8);
        bot = nod(bot, T, 2.4, 2.9, 4.6, 5.1);
      }
      const slotNames = ['выручка', 'прибыль', 'крупная', 'поставщик', 'месяц', 'квартал', 'маржа', 'бонус'];
      for (let i = 0; i < 8; i++) slot(g, -158 + i * 36, -136, slots[i], slotNames[i]);
      fileCard(g, -64, -122, fK, dK);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: dK, blink: true, happy: dK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      text(g, 'восемь новых столбцов', -20, -40, 7.5, C.muted);
      sparks(g, RX + 12, -120, seg(T, 2.0, 2.6), 12, 5);
    },
  };

  // 2. Восемь столбцов текстом?
  SC['ax3-eight'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня удивляется: восемь столбцов текстом? Крупная цифра 8 в кружке, робот кивает.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -88, RX = 80;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, eK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; eK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.6)) * (1 - seg(T, 2.6, 2.9)) * fade;
        eK = E.back(seg(T, 1.0, 1.4)) * fade;
        anya = talk(anya, T, 0.3, 2.6);
        bot = nod(bot, T, 1.2, 1.7, 3.6, 4.1);
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      if (eK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, eK);
        circle(g, 0, -98, 16);
        inkFill(g, C.butterSoft, 2, C.umber);
        text(g, '8', 0, -92, 15, C.umber);
        g.restore();
      }
      bubble(g, -30, -114, 'восемь столбцов?', qK, { tail: -28, size: 8 });
    },
  };

  // 3. Восемь карточек-слов по очереди
  SC['ax3-list'] = {
    dur: 6.5,
    width: 380,
    label: 'Восемь карточек в два ряда: выручка, прибыль, крупная, поставщик, месяц, квартал, маржа, бонус.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -150;
      const labels = ['выручка', 'прибыль', 'крупная', 'поставщик', 'месяц', 'квартал', 'маржа', 'бонус'];
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let ks = [];
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        ks = labels.map(() => 0.9);
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        for (let i = 0; i < 8; i++) ks[i] = E.back(seg(T, 0.3 + i * 0.32, 0.62 + i * 0.32)) * fade;
        anya = talk(anya, T, 0.4, 3.2);
      }
      for (let i = 0; i < 8; i++) {
        const col = i % 4, row = Math.floor(i / 4);
        signCard(g, -108 + col * 72, -122 + row * 44, 62, 22, labels[i], ks[i], 7);
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      text(g, 'всё это агент посчитает по словам', 10, -38, 7.5, C.muted);
    },
  };

  // 4. Как правильно попросить?
  SC['ax3-how'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает «как попросить?», робот указывает на пустую карточку-шаблон.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -95, RX = 85;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      // рука робота поднята к шаблону и в покое, и в действии — без рывка на старте
      let bot = breathe(P({ hF: [22, -84], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.6)) * (1 - seg(T, 2.4, 2.7)) * fade;
        cK = E.back(seg(T, 1.0, 1.4)) * fade;
        anya = talk(anya, T, 0.3, 2.4);
        bot = nod(bot, T, 1.4, 1.9, 3.6, 4.1);
      }
      if (cK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, cK);
        rr(g, 30, -126, 44, 54, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 4; i++) words(g, 36, -116 + i * 11, 32, i + 2, C.faint);
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -41, -114, 'как попросить?', qK, { tail: -28, size: 8 });
      text(g, 'шаблон', 52, -62, 7, C.muted);
    },
  };

  // 5. Шаблон запроса из четырёх частей (ключевая сцена)
  SC['ax3-template'] = {
    dur: 7,
    width: 380,
    label: 'Шаблон из четырёх частей: файл и лист, логика словами, формат, проверка — блоки загораются по очереди.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -125, RX = 125;
      const rows = ['файл и лист', 'логика словами', 'формат', 'проверка'];
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let cardK = 0, doneK = 0;
      let lit = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        cardK = 0.9; lit = 4; doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cardK = E.back(seg(T, 0.2, 0.6)) * fade;
        lit = clamp((T - 0.9) / 0.6, 0, 4);
        doneK = seg(T, 4.2, 4.7) * fade;
        anya = talk(anya, T, 0.8, 4.4);
        bot = nod(bot, T, 1.0, 1.5, 4.6, 5.1);
      }
      // рука Ани отсчитывает четыре части
      if (T >= 0) {
        let lift = 0;
        for (let i = 0; i < 4; i++) {
          const p = (T - (1.0 + i * 0.6)) / 0.6;
          if (p > 0 && p < 1) { lift = Math.max(lift, Math.pow(Math.sin(Math.PI * p), 2)); }
        }
        anya = mix(anya, P({ hF: [24, -112], head: [6, -115] }, anya), lift * 0.9);
      }
      if (cardK > 0) {
        const x = -62, y = -132, w = 124, h = 76;
        g.save();
        g.globalAlpha = Math.min(1, cardK);
        rr(g, x, y, w, h, 5); inkFill(g, C.paper, 1.6);
        for (let i = 0; i < 4; i++) {
          const yy = y + 14 + i * 17;
          const on = clamp(lit - i, 0, 1);
          if (on > 0) {
            g.save();
            g.globalAlpha *= on * 0.9;
            g.fillStyle = C.butterSoft;
            g.fillRect(x + 4, yy - 4, w - 8, 14);
            g.restore();
          }
          circle(g, x + 15, yy + 3, 5.5);
          inkFill(g, on > 0.5 ? C.butter : C.paper, 1.2);
          text(g, String(i + 1), x + 15, yy + 5.5, 7, on > 0.5 ? C.umber : C.muted);
          text(g, rows[i], x + 28, yy + 5.5, 7.5, on > 0.4 ? C.ink : C.soft, 'left');
          if (on > 0.6) {
            g.save(); g.globalAlpha *= (on - 0.6) / 0.4;
            g.strokeStyle = C.greenInk; g.lineWidth = 1.7;
            g.beginPath();
            g.moveTo(x + w - 14, yy + 3); g.lineTo(x + w - 11, yy + 6); g.lineTo(x + w - 5, yy - 1);
            g.stroke(); g.restore();
          }
        }
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      tickBadge(g, 0, -42, doneK, 9);
      sparks(g, 0, -46, seg(T, 4.2, 4.8), 12, 6);
    },
  };

  // 6. Например? Робот ждёт, мигает курсор
  SC['ax3-example'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня просит пример, робот в ожидании, рядом мигает курсор-палочка.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -88, RX = 84;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.6)) * (1 - seg(T, 2.2, 2.5)) * fade;
        cK = seg(T, 0.9, 1.3) * fade;
        anya = talk(anya, T, 0.3, 2.2);
        bot = mix(bot, P({ head: [-5, -114], chest: [-2, -90] }, bot),
          E.soft(seg(T, 0.6, 1.1)) * (1 - E.soft(seg(T, 3.8, 4.2))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: Math.sin(T * 4) > 0.7 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      // курсор-палочка мигает
      if (cK > 0) {
        const on = T < 0 || Math.floor(T * 2.2) % 2 === 0;
        if (on) {
          g.save();
          g.globalAlpha = Math.min(1, cK);
          ln(g, 128, -104, 128, -86, 2.4, C.umber);
          g.restore();
        }
      }
      bubble(g, -40, -114, 'например?', qK, { tail: -20, size: 8 });
    },
  };

  // 7. Условие «крупная сделка»: Да / Нет
  SC['ax3-bigdeal'] = {
    dur: 6.5,
    width: 380,
    label: 'В таблице вырастает столбец «Да/Нет» по условию «выручка больше 100 000», галочка.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -105;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      let tblK = 0, condK = 0, dK = 0, cellK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        tblK = 0.9; condK = 0.9; dK = 0.9; cellK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        condK = E.back(seg(T, 0.3, 0.6)) * fade;
        tblK = E.back(seg(T, 0.7, 1.1)) * fade;
        cellK = seg(T, 1.4, 2.2) * fade;
        dK = seg(T, 2.6, 3.0) * fade;
        anya = talk(anya, T, 0.4, 3.2);
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      if (tblK > 0) {
        const x = 44, y = -124, w = 100, h = 62;
        g.save();
        g.globalAlpha = Math.min(1, tblK);
        rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
        for (let i = 1; i < 3; i++) ln(g, x, y + i * 20.6, x + w, y + i * 20.6, 1);
        ln(g, x + 62, y, x + 62, y + h, 1);
        for (let i = 0; i < 3; i++) words(g, x + 6, y + 13 + i * 20.6, 50, i + 1, C.soft, 1.6);
        const vals = ['Да', 'Да', 'Нет'];
        for (let i = 0; i < 3; i++) {
          const on = clamp(cellK * 3 - i, 0, 1);
          if (on > 0) {
            g.save(); g.globalAlpha *= on;
            g.fillStyle = i < 2 ? C.green : C.red;
            g.fillRect(x + 66, y + 3 + i * 20.6, 30, 14.6);
            g.strokeStyle = C.ink; g.lineWidth = 1;
            g.strokeRect(x + 66, y + 3 + i * 20.6, 30, 14.6);
            text(g, vals[i], x + 81, y + 14 + i * 20.6, 7, C.ink);
            g.restore();
          }
        }
        g.restore();
      }
      if (condK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, condK);
        text(g, 'выручка больше 100 000', 84, -131, 7, C.umber);
        g.restore();
      }
      tickBadge(g, 134, -52, dK, 8);
      sparks(g, 134, -56, seg(T, 2.6, 3.2), 10, 5);
    },
  };

  // 8. А если условие сложнее? Вложенные условия ступенькой
  SC['ax3-harder'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает про сложное условие; две вложенные карточки-условия ступенькой.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -105, RX = 105;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, aK = 0, bK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; aK = 0.9; bK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.6)) * (1 - seg(T, 2.4, 2.7)) * fade;
        aK = E.back(seg(T, 0.9, 1.3)) * fade;
        bK = E.back(seg(T, 1.6, 2.0)) * fade;
        anya = talk(anya, T, 0.3, 2.4);
        bot = nod(bot, T, 1.0, 1.5, 3.4, 3.8);
      }
      if (aK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, aK);
        rr(g, 2, -130, 82, 24, 4); inkFill(g, C.paper, 1.5);
        text(g, 'если', 16, -114, 7, C.umber);
        words(g, 28, -118, 50, 3, C.soft, 1.6);
        g.restore();
      }
      if (bK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, bK);
        rr(g, 36, -100, 64, 22, 4); inkFill(g, C.butterSoft, 1.5);
        text(g, 'а если', 56, -85, 7, C.umber);
        words(g, 74, -89, 20, 5, C.soft, 1.6);
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -46, -114, 'а если сложнее?', qK, { tail: -26, size: 8 });
    },
  };

  // 9. Бонус 5% и 3% + ценовой сегмент
  SC['ax3-bonus'] = {
    dur: 6.5,
    width: 380,
    label: 'Слева карточка «бонус: 5% и 3%», справа три полосы ценового сегмента: низкий, средний, высокий.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      // робот-агент показывает расчёт бонуса и сегмента (слева, не перекрывает карточки)
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let lK = 0, rK = 0, bar2 = 0, bar3 = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        lK = 0.9; rK = 0.9; bar2 = 0.9; bar3 = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.7)) * fade;
        rK = E.back(seg(T, 1.0, 1.4)) * fade;
        bar2 = seg(T, 1.8, 2.2) * fade;
        bar3 = seg(T, 2.4, 2.8) * fade;
        anya = talk(anya, T, 0.4, 3.4);
        bot = nod(bot, T, 1.8, 2.3, 3.4, 3.8);
      }
      if (lK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, lK);
        rr(g, -117, -120, 84, 48, 5); inkFill(g, C.paper, 1.5);
        text(g, 'бонус', -75, -106, 8, C.muted);
        text(g, '5% и 3%', -75, -90, 10, C.ink);
        g.restore();
      }
      if (rK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, rK);
        rr(g, 33, -120, 84, 48, 5); inkFill(g, C.paper, 1.5);
        const bars = [['низкий', 16, 1], ['средний', 26, bar2], ['высокий', 32, bar3]];
        for (let i = 0; i < 3; i++) {
          const [nm, wl, kk] = bars[i];
          const on = i === 0 ? 1 : kk;
          if (on > 0) {
            g.save(); g.globalAlpha *= Math.min(1, on);
            text(g, nm, 52, -105 + i * 14, 6.5, C.ink, 'left');
            ln(g, 78, -108 + i * 14, 78 + wl, -108 + i * 14, 4, i === 2 ? C.butterHi : C.butter);
            g.restore();
          }
        }
        g.restore();
      }
      fig(g, bot, -148, 0, { sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, 0, 0, { sx: 1, ink: INK, far: INK_FAR });
      text(g, 'добавляем деталей', -75, -40, 7.5, C.muted);
    },
  };

  // 10. Почему коды? В таблице М1 М2 М3
  SC['ax3-codes'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает «почему коды?», робот держит таблицу с кодами М1, М2, М3 вместо имён.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -95, RX = 80;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      // рука робота держит таблицу и в покое, и в действии
      let bot = breathe(P({ hF: [26, -90], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, tblK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; tblK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.6)) * (1 - seg(T, 2.4, 2.7)) * fade;
        tblK = E.back(seg(T, 0.9, 1.3)) * fade;
        anya = talk(anya, T, 0.3, 2.4);
        bot = nod(bot, T, 1.2, 1.7, 3.4, 3.8);
      }
      fig(g, bot, RX, 0, {
        sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true },
        held: (g2, J) => R.held(g2, J, (hF) => {
          if (tblK <= 0) { return; }
          g2.save(); g2.globalAlpha = Math.min(1, tblK);
          const w = 44, h = 34, x = hF[0] - w / 2, y = hF[1] - h / 2;
          rr(g2, x, y, w, h, 3); inkFill(g2, C.paper, 1.4);
          ln(g2, x, y + 10, x + w, y + 10, 1);
          ln(g2, x + 22, y + 10, x + 22, y + h, 1);
          words(g2, x + 4, y + 6, 14, 1, C.soft, 1.4);
          const codes = ['М1', 'М2', 'М3'];
          for (let i = 0; i < 3; i++) {
            words(g2, x + 4, y + 18 + i * 8, 14, i + 3, C.soft, 1.4);
            text(g2, codes[i], x + 32, y + 17 + i * 8, 6, C.ink, 'center');
          }
          g2.restore();
        }),
      });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -46, -114, 'почему коды?', qK, { tail: -24, size: 8 });
      text(g, 'имена не подставляй', 30, -40, 7, C.muted);
    },
  };

  // 11. Ключ у вас, расшифровка локально
  SC['ax3-keylocal'] = {
    dur: 6.5,
    width: 380,
    label: 'Аня держит ключ, рядом сейф с галочкой; за пунктиром робот — ключ к нему не уходит.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -110, RX = 78;
      // рука Ани с ключом поднята в обеих фазах
      let anya = breathe(P({ hF: [14, -70], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let keyK = 0, safeK = 0, dK = 0, lineK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        keyK = 0.9; safeK = 0.9; dK = 0.9; lineK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        keyK = E.back(seg(T, 0.3, 0.7)) * fade;
        safeK = E.back(seg(T, 0.9, 1.3)) * fade;
        dK = seg(T, 1.7, 2.1) * fade;
        lineK = E.soft(seg(T, 2.2, 2.8)) * fade;
        capK = E.back(seg(T, 3.0, 3.3)) * (1 - seg(T, 5.4, 5.7)) * fade;
        anya = talk(anya, T, 2.8, 5.2);
      }
      // сейф с галочкой
      if (safeK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, safeK);
        rr(g, -58, -116, 38, 46, 4); inkFill(g, C.steel, 1.5);
        circle(g, -39, -97, 6);
        inkFill(g, C.paper, 1.2);
        ln(g, -39, -97, -39, -93, 1.4);
        g.restore();
      }
      tickBadge(g, -26, -110, dK, 8);
      // пунктирная граница: ключ не перелетает к роботу
      if (lineK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, lineK);
        for (let yy = -128; yy < -6; yy += 9) ln(g, 8, yy, 8, yy + 4.5, 1.4, C.soft);
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      // ключ в руке Ани
      if (keyK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, keyK);
        circle(g, -95, -64, 4);
        inkFill(g, C.butter, 1.4, C.umber);
        ln(g, -91, -64, -79, -64, 2, C.umber);
        ln(g, -86, -64, -86, -60, 1.8, C.umber);
        ln(g, -82, -64, -82, -60, 1.8, C.umber);
        g.restore();
      }
      text(g, 'ключ у вас', -95, -44, 6.5, C.muted);
      if (capK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, capK);
        text(g, 'расшифровка локально', 40, -36, 7.5, C.umber);
        g.restore();
      }
    },
  };

  // 12. Как проверить? Лупа над столбцом
  SC['ax3-verify'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня с лупой над столбцом таблицы спрашивает «как проверить?».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -75;
      // рука Ани поднята к лупе в обеих фазах
      let anya = breathe(P({ hF: [16, -84], hB: [-4, -52], head: [3, -114] }), t);
      let qK = 0, tblK = 0, magK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; tblK = 0.9; magK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.6)) * (1 - seg(T, 2.4, 2.7)) * fade;
        tblK = E.back(seg(T, 0.8, 1.2)) * fade;
        magK = E.back(seg(T, 1.3, 1.7)) * fade;
        anya = talk(anya, T, 0.3, 2.4);
      }
      if (tblK > 0) {
        const x = 75, y = -128, w = 66, h = 58;
        g.save();
        g.globalAlpha = Math.min(1, tblK);
        rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
        for (let i = 1; i < 4; i++) ln(g, x, y + i * 14.5, x + w, y + i * 14.5, 1);
        ln(g, x + 40, y, x + 40, y + h, 1);
        for (let i = 0; i < 4; i++) words(g, x + 5, y + 9 + i * 14.5, 30, i + 1, C.soft, 1.5);
        g.fillStyle = C.butter;
        g.fillRect(x + 44, y + 3, 18, h - 6);
        g.strokeStyle = C.ink; g.lineWidth = 1;
        g.strokeRect(x + 44, y + 3, 18, h - 6);
        g.restore();
      }
      // лупа над столбцом
      if (magK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, magK);
        circle(g, 100, -92, 11);
        inkFill(g, 'rgba(255,255,255,0.35)', 2.2);
        ln(g, 92, -84, 84, -74, 2.6);
        g.restore();
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -18, -114, 'как проверить?', qK, { tail: -30, size: 8 });
    },
  };

  // 13. Две проверки: сумма столбца = 3 строки вручную
  SC['ax3-twochecks'] = {
    dur: 6,
    width: 380,
    label: 'Две карточки: «сумма столбца» и «3 строки вручную», между ними знак равенства и галочка «сошлось».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -140;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let aK = 0, bK = 0, eqK = 0, doneK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        aK = 0.9; bK = 0.9; eqK = 0.9; doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        aK = E.back(seg(T, 0.3, 0.65)) * fade;
        bK = E.back(seg(T, 1.0, 1.35)) * fade;
        eqK = E.back(seg(T, 1.8, 2.2)) * fade;
        doneK = seg(T, 2.6, 3.0) * fade;
        anya = talk(anya, T, 0.4, 3.4);
      }
      signCard(g, -50, -112, 84, 26, 'сумма столбца', aK, 7.5);
      signCard(g, 55, -112, 84, 26, '3 строки вручную', bK, 7.5);
      if (eqK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, eqK);
        text(g, '=', 2, -104, 14, C.umber);
        g.restore();
      }
      tickBadge(g, 2, -72, doneK, 9);
      text(g, 'сошлось', 2, -52, 7.5, C.greenInk);
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      sparks(g, 2, -66, seg(T, 2.6, 3.2), 12, 5);
    },
  };

  // 14. Суммы не сошлись
  SC['ax3-claim'] = {
    dur: 5.5,
    width: 380,
    label: 'Две карточки с разными числами и знаком неравенства, сверху тревожный восклицательный знак.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -145;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let aK = 0, bK = 0, neK = 0, exK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        aK = 0.9; bK = 0.9; neK = 0.9; exK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        aK = E.back(seg(T, 0.3, 0.65)) * fade;
        bK = E.back(seg(T, 0.9, 1.25)) * fade;
        neK = E.back(seg(T, 1.6, 2.0)) * fade;
        exK = E.back(seg(T, 2.3, 2.7)) * fade;
        anya = talk(anya, T, 0.3, 2.6);
      }
      numCard(g, -130, -134, '866 107,90', aK, 'ожидали');
      numCard(g, 30, -134, '861 000,00', bK, 'получилось');
      if (neK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, neK);
        text(g, '≠', 0, -103, 15, C.redInk);
        g.restore();
      }
      if (exK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, exK);
        circle(g, 0, -128, 6.5);
        inkFill(g, C.red, 1.4, C.redInk);
        text(g, '!', 0, -124.5, 9, C.redInk);
        g.restore();
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
    },
  };

  // 15. Рекламация: исправь и покажи
  SC['ax3-claimfix'] = {
    dur: 6,
    width: 380,
    label: 'Облачко «исправь и покажи» с хвостом к роботу, искры, стрелка «до — после» и галочка.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -85, RX = 85;
      let anya = breathe(P({ hF: [22, -100], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [10, -70], hB: [-4, -50], head: [2, -116] }), t);
      let cK = 0, fixK = 0, doneK = 0, arK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        cK = 0.9; arK = 0.9; doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.4, 2.7)) * fade;
        fixK = seg(T, 1.6, 2.1) * fade;
        arK = E.back(seg(T, 2.2, 2.6)) * fade;
        doneK = seg(T, 2.8, 3.2) * fade;
        anya = talk(anya, T, 0.3, 2.4);
        bot = nod(bot, T, 1.8, 2.3, 3.6, 4.0);
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, 0, -114, 'исправь и покажи', cK, { tail: 30, size: 8, fill: C.butterSoft });
      sparks(g, RX - 16, -98, fixK, 14, 6);
      if (arK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, arK);
        text(g, 'до', -46, -56, 7.5, C.muted);
        arrow(g, [[-30, -59], [24, -59]], { k: Math.min(1, arK * 1.4), col: C.umber, lw: 1.8 });
        text(g, 'после', 46, -56, 7.5, C.muted);
        g.restore();
      }
      tickBadge(g, 0, -38, doneK, 8);
    },
  };

  // 16. Журнал проверок и версии файла
  SC['ax3-journal'] = {
    dur: 6.5,
    width: 380,
    label: 'Карточка-журнал с колонками и галочками «сошлось», рядом версии файла v1 и v2.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -120;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let jK = 0, ticks = 0, v1K = 0, v2K = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        jK = 0.9; ticks = 3; v1K = 0.9; v2K = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        jK = E.back(seg(T, 0.3, 0.7)) * fade;
        ticks = clamp((T - 1.0) / 0.5, 0, 3);
        v1K = E.back(seg(T, 2.4, 2.8)) * fade;
        v2K = E.back(seg(T, 3.0, 3.4)) * fade;
        anya = talk(anya, T, 0.4, 4.0);
      }
      if (jK > 0) {
        const x = -55, y = -132, w = 110, h = 58;
        g.save();
        g.globalAlpha = Math.min(1, jK);
        rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
        ln(g, x, y + 12, x + w, y + 12, 1);
        // три колонки псевдотекста + колонка «сошлось»
        for (let c = 0; c < 3; c++) {
          for (let r = 0; r < 3; r++) words(g, x + 5 + c * 26, y + 19 + r * 13, 20, c * 3 + r + 1, C.soft, 1.5);
        }
        for (let r = 0; r < 3; r++) {
          const on = clamp(ticks - r, 0, 1);
          if (on > 0) {
            g.save(); g.globalAlpha *= on;
            g.strokeStyle = C.greenInk; g.lineWidth = 1.6;
            g.beginPath();
            g.moveTo(x + 86, y + 21 + r * 13); g.lineTo(x + 89, y + 24 + r * 13); g.lineTo(x + 95, y + 17 + r * 13);
            g.stroke(); g.restore();
          }
        }
        text(g, 'сошлось', x + 90, y + 55, 5.5, C.greenInk);
        g.restore();
      }
      signCard(g, 105, -124, 30, 20, 'v1', v1K, 8);
      signCard(g, 105, -94, 30, 20, 'v2', v2K, 8);
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      text(g, 'журнал проверок', 0, -60, 7.5, C.muted);
    },
  };

  // 17. Мост: формула по-русски
  SC['ax3-bridge'] = {
    dur: 6.5,
    width: 380,
    label: 'Слева зачёркнутая громоздкая формула, справа облачко с русской фразой и готовый столбец с галочкой.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let anya = breathe(P({ hF: [16, -74], hB: [-6, -54], head: [3, -114] }), t);
      let lK = 0, crossK = 0, rK = 0, bK = 0, doneK = 0, arK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        lK = 0.9; crossK = 0.9; rK = 0.9; bK = 0.9; doneK = 0.9; arK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.7)) * fade;
        crossK = seg(T, 1.1, 1.5) * fade;
        rK = E.back(seg(T, 1.8, 2.2)) * fade;
        bK = E.back(seg(T, 2.5, 2.9)) * fade;
        arK = E.soft(seg(T, 3.2, 3.8)) * fade;
        doneK = seg(T, 3.8, 4.2) * fade;
        capK = E.back(seg(T, 4.0, 4.3)) * (1 - seg(T, 5.8, 6.1)) * fade;
        anya = talk(anya, T, 4.0, 5.6);
      }
      // громоздкая «формула» — несколько этажей псевдотекста
      if (lK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, lK);
        const x = -132, y = -130, w = 54, h = 62;
        rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 4; i++) words(g, x + 6, y + 12 + i * 13, w - 12, i + 1, C.soft, 1.6);
        text(g, '= f( … )', x + w / 2, y + h - 4, 6.5, C.muted);
        g.restore();
      }
      if (crossK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, crossK);
        g.strokeStyle = '#b91c1c';
        ln(g, -136, -134, -74, -64, 2.4, '#b91c1c');
        ln(g, -74, -134, -136, -64, 2.4, '#b91c1c');
        g.restore();
      }
      // готовый столбец с галочкой
      if (rK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, rK);
        const x = 80, y = -130, w = 32, h = 52;
        rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
        g.fillStyle = C.butter;
        g.fillRect(x + 4, y + 4, w - 8, h - 8);
        g.strokeStyle = C.ink; g.lineWidth = 1;
        g.strokeRect(x + 4, y + 4, w - 8, h - 8);
        g.restore();
      }
      tickBadge(g, 96, -68, doneK, 8);
      arrow(g, [[-66, -98], [50, -98]], { k: arK, col: C.umber, lw: 2 });   // за фигурой: не наезжает на голову
      fig(g, anya, 0, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, 78, -50, 'выручка категории за месяц', bK, { tail: 8, size: 7.5 });
      if (capK > 0) {
        g.save();
        g.globalAlpha = Math.min(1, capK);
        text(g, 'по-русски', 0, -44, 8, C.umber);
        g.restore();
      }
    },
  };
})();
