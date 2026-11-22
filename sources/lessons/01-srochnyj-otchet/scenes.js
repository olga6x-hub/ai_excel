// Урок 1 «Срочный отчёт и первый запрос»: три сцены.
// ax1-chat  — чат советует, агент делает и сохраняет файл;
// ax1-kzfp  — запрос из четырёх частей (К З Ф П) превращается в столбец таблицы;
// ax1-checks — две проверки: сумма студента = сумме агента, галочка.
// Load after stick.js: <stick-scene scene="ax1-chat" play="view"></stick-scene>
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, mix, fig, inkFill, rr, ln, text, seg, breathe, pulse, bubble, words, tickBadge, sparks } = R;

  const ORG = '#d97757', ORG_FAR = '#e8b7a3';          // агент-робот
  const INK = C.ink, INK_FAR = C.far;                   // Аня (герой)

  // маленькая таблица-файл: строки + подсвеченный «новый столбец» (k = 0..1)
  function fileCard(g, x, y, k, done) {
    const w = 64, h = 50;
    g.save();
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    for (let i = 0; i < 4; i++) ln(g, x + 6, y + 12 + i * 10, x + w - 24, y + 12 + i * 10, 1.1);
    // новый столбец вырастает справа
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

  // карточка запроса КЗФП: 4 строки-слова
  function kzfpCard(g, x, y, k) {
    const w = 58, h = 44;
    g.globalAlpha = k < 0 ? 0 : Math.min(1, k);
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    for (let i = 0; i < 4; i++) words(g, x + 6, y + 8 + i * 10, w - 12, i + 1);
    g.globalAlpha = 1;
  }

  SC['ax1-chat'] = {
    dur: 6.5,
    width: 380,
    label: 'Аня просит посчитать выручку, агент не советует, а сам добавляет столбец и сохраняет файл.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -90, RX = 80;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cardK = 0, doneK = 0, sayK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.6)) * (1 - seg(T, 1.9, 2.2)) * fade;
        cardK = seg(T, 2.5, 3.1) * fade;
        doneK = seg(T, 3.1, 3.5) * fade;
        sayK = E.back(seg(T, 3.3, 3.6)) * (1 - seg(T, 4.8, 5.1)) * fade;
        // Аня спрашивает (кивок только головой)
        const talkA = seg(T, 0.3, 0.6) * (1 - seg(T, 1.9, 2.2));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
        // робот думает перед действием (пауза — не отвечает мгновенно)
        bot = mix(bot, P({ head: [-4, -112], chest: [-1, -90] }, bot), E.soft(seg(T, 0.8, 1.2)) * (1 - E.soft(seg(T, 2.2, 2.5))));
      }
      fileCard(g, RX + 16, -112, cardK, doneK);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      // пузырь рисуется ВВЕРХ от y: держим y >= -118, чтобы верх (-138) не срезался панелью
      bubble(g, -10, -114, 'посчитай выручку', qK, { tail: -32, size: 8 });
      sparks(g, RX + 52, -118, seg(T, 3.1, 3.7), 12, 5);
    },
  };

  SC['ax1-kzfp'] = {
    dur: 7,
    width: 380,
    label: 'Запрос из четырёх частей: контекст, задача, формат, проверка. Агент превращает его в новый столбец таблицы.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -112, RX = 80;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let cardK = 0, tblK = 0, doneK = 0, lblK = 0;
      let cx = -96, cy = -100;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        cardK = 0.9; cy = -104;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cardK = (1 - seg(T, 0.0, 0.3)) * 0.9 + 0.1;           // карточка чуть бледнеет в полёте
        const fly = E.soft(seg(T, 0.5, 1.6));                  // полёт к роботу
        cx = -96 + (80 - 8 - (-96)) * fly;
        cy = -104 - 24 * Math.sin(Math.PI * fly);
        cardK = (1 - seg(T, 1.5, 1.9)) * fade;                 // робот взял — карточка тает
        tblK = seg(T, 2.2, 2.9) * fade;                        // таблица
        doneK = seg(T, 3.4, 3.8) * fade;
        lblK = E.back(seg(T, 3.6, 3.9)) * (1 - seg(T, 5.2, 5.5)) * fade;
        bot = mix(bot, P({ head: [-4, -112] }, bot), E.soft(seg(T, 1.7, 2.1)) * (1 - E.soft(seg(T, 2.6, 2.9))));
      }
      // таблица с «вырастающим» столбцом — правее робота
      if (tblK > 0) fileCard(g, 96, -110, tblK, doneK);
      kzfpCard(g, cx, cy, cardK);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      text(g, 'запрос', -96, -112, 8, C.muted);
      sparks(g, 140, -96, seg(T, 3.4, 4.0), 12, 5);
    },
  };

  SC['ax1-checks'] = {
    dur: 6.5,
    width: 380,
    label: 'Две проверки: сумма на калькуляторе совпала с суммой агента, контрольная сумма сошлась.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -48, RX = 48;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let nA = 0, nB = 0, eqK = 0, doneK = 0, sayK = 0;
      // табличка с числом (заголовок и число внутри карточки)
      function numCard(g, x, y, s, k, title) {
        if (k <= 0) return;
        g.globalAlpha = Math.min(1, k);
        const w = 96, h = 32;
        rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
        text(g, title, x + w / 2, y + 9, 6, C.muted);
        text(g, s, x + w / 2, y + 22, 7.5, C.ink);
        g.globalAlpha = 1;
      }
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
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
      numCard(g, -152, -112, '5 742 912,50', nA, 'калькулятор');
      numCard(g, 56, -112, '5 742 912,50', nB, 'файл агента');
      const demoK = Math.min(nA, nB);
      if (demoK > 0) {
        g.globalAlpha = Math.min(1, demoK) * 0.85;
        text(g, 'числа из примера', 0, -60, 5, C.muted);
        g.globalAlpha = 1;
      }
      if (eqK > 0) {
        g.globalAlpha = Math.min(1, eqK);
        text(g, '=', 0, -97, 13, C.umber);
        g.globalAlpha = 1;
      }
      tickBadge(g, 0, -76, doneK, 9);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, 0, -114, 'сумма сошлась', sayK, { tail: 0, size: 8 });
      sparks(g, 0, -78, seg(T, 2.8, 3.4), 12, 6);
    },
  };

  // ================= новые сцены =================

  // таблица в руке робота (для ax1-feed)
  function handTable(g, p) {
    if (!p) { return; }
    const w = 40, h = 30;
    g.save();
    g.translate(p[0] - w / 2, p[1] - h / 2);
    rr(g, 0, 0, w, h, 3); inkFill(g, C.paper, 1.4);
    for (let i = 0; i < 3; i++) { ln(g, 5, 9 + i * 9, w - 15, 9 + i * 9, 1); }
    g.fillStyle = C.butter;
    g.fillRect(w - 12, 5, 7, h - 10);
    g.strokeStyle = C.ink; g.lineWidth = 1;
    g.strokeRect(w - 12, 5, 7, h - 10);
    g.restore();
  }

  // чек-лист из 6 шагов в руке робота; lit = сколько галочек зажжено (0..6)
  function checklistSheet(g, p, lit) {
    if (!p) { return; }
    const w = 68, h = 78;
    const x = p[0] - w / 2, y = p[1] - h / 2;
    g.save();
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.5);
    const steps = ['папка', 'файл', 'режим', 'доступ', 'видимость', 'сохранение'];
    for (let i = 0; i < 6; i++) {
      const yy = y + 13 + i * 11;
      const on = Math.max(0, Math.min(1, lit - i));
      g.strokeStyle = C.ink; g.lineWidth = 1.1;
      g.strokeRect(x + 7, yy - 5, 7, 7);
      if (on > 0) {
        g.save(); g.globalAlpha = on;
        g.strokeStyle = C.amber || '#b45309'; g.lineWidth = 1.9;
        g.beginPath();
        g.moveTo(x + 8.4, yy - 1.4); g.lineTo(x + 10.4, yy + 0.8); g.lineTo(x + 13.2, yy - 3.6);
        g.stroke(); g.restore();
      }
      text(g, steps[i], x + 19, yy + 1.5, 6.5, on > 0.5 ? C.ink : C.soft, 'left');
    }
    g.restore();
  }

  // табличка-слово в руках (для ax1-hands)
  function signCard(g, cx, cy, w, h, s, k, size) {
    if (k <= 0) { return; }
    g.save();
    g.globalAlpha = Math.min(1, k);
    const x = cx - w / 2, y = cy - h / 2;
    rr(g, x, y, w, h, 4); inkFill(g, C.paper, 1.6);
    text(g, s, cx, cy + (size || 9) * 0.35, size || 9, C.ink);
    g.restore();
  }

  SC['ax1-feed'] = {
    dur: 6.5,
    width: 380,
    label: 'Слева переписка в чате с советами, справа агент держит готовую таблицу.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const RX = 118;
      let bot = breathe(P({ hF: [26, -90], hB: [-4, -50], head: [2, -116] }), t);
      let b1 = 0, b2 = 0, b3 = 0, tblK = 0, doneK = 0;
      if (T < 0) {
        bot = mix(bot, P({ head: [-4, -114] }, bot), pulse(t, 6, 2, 2));
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        b1 = E.back(seg(T, 0.3, 0.6)) * fade;
        b2 = E.back(seg(T, 1.0, 1.3)) * fade;
        b3 = E.back(seg(T, 1.7, 2.0)) * fade;
        tblK = E.back(seg(T, 2.4, 2.8)) * fade;
        doneK = seg(T, 3.0, 3.4) * fade;
      }
      bubble(g, -100, -112, 'как посчитать выручку?', b1, { tail: -24, size: 8, fill: '#f4f4f4' });
      bubble(g, -100, -82, 'формула: =B2*C2*(1-C2)', b2, { tail: -24, size: 8, fill: '#f4f4f4' });
      bubble(g, -100, -52, 'скопируйте в файл', b3, { tail: -24, size: 8, fill: '#f4f4f4' });
      fig(g, bot, RX, 0, {
        sx: -1, ink: ORG, far: ORG_FAR,
        bot: { glow: doneK, blink: true, happy: doneK > 0.3 },
        held: (g2, J) => R.held(g2, J, (hF) => {
          if (tblK <= 0) { return; }
          g2.save(); g2.globalAlpha = Math.min(1, tblK);
          handTable(g2, hF);
          g2.restore();
        }),
      });
      tickBadge(g, RX + 28, -118, doneK, 8);
      sparks(g, RX + 8, -104, seg(T, 3.0, 3.6), 12, 5);
    },
  };

  SC['ax1-checklist'] = {
    dur: 7,
    width: 380,
    label: 'Робот держит чек-лист из шести шагов настройки, галочки загораются одна за другой.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -104;
      let bot = breathe(P({ hF: [34, -68], hB: [6, -60], head: [0, -116] }), t);
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [4, -114] }), t);
      let sheetK = 0, lit = 0, doneK = 0;
      if (T < 0) {
        sheetK = 0.9; lit = 6;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        sheetK = E.back(seg(T, 0.3, 0.65)) * fade;
        lit = Math.max(0, Math.min(6, (T - 0.9) / 0.55));
        doneK = seg(T, 4.3, 4.7) * fade;
        anya = mix(anya, P({ head: [8, -113] }, anya), E.soft(seg(T, 0.6, 1.0)) * (1 - E.soft(seg(T, 4.0, 4.4))));
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      fig(g, bot, 14, 0, {
        sx: 1, ink: ORG, far: ORG_FAR,
        bot: { glow: doneK, blink: true, happy: doneK > 0.3 },
        held: (g2, J) => R.held(g2, J, (hF) => {
          if (sheetK <= 0) { return; }
          g2.save(); g2.globalAlpha = Math.min(1, sheetK);
          checklistSheet(g2, [hF[0] + 26, hF[1] - 10], lit);
          g2.restore();
        }),
      });
      text(g, 'чек-лист настройки', -100, -128, 8, C.muted);
      sparks(g, 20, -126, seg(T, 4.3, 4.9), 14, 6);
    },
  };

  SC['ax1-cells'] = {
    dur: 6.5,
    width: 380,
    label: 'Аня перечисляет четыре части запроса; слова загораются в ячейках фоновой таблицы.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -90, RX = 90;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
      } else {
        // рука Ани отсчитывает четыре части запроса (синхронно со словами в фоне)
        const at = [0.5, 1.3, 2.1, 2.9];
        let lift = 0;
        for (let i = 0; i < 4; i++) {
          const p = (T - at[i]) / 0.6;
          if (p > 0 && p < 1) { lift = Math.max(lift, Math.sin(Math.PI * p)); }
        }
        anya = mix(anya, P({ hF: [24, -116], head: [6, -115] }, anya), lift * 0.9);
        // робот слушает: лёгкий наклон, потом кивок
        bot = mix(bot, P({ head: [-5, -114], chest: [-2, -90] }, bot),
          E.soft(seg(T, 0.4, 0.9)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      text(g, 'четыре части запроса', 0, -126, 8, C.muted);
    },
  };

  SC['ax1-hands'] = {
    dur: 6,
    width: 380,
    label: 'Робот держит табличку КОПИЯ, девушка держит табличку 2 ПРОВЕРКИ.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -85, RX = 85;
      let anya = breathe(P({ hF: [20, -88], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [30, -88], hB: [-4, -50], head: [2, -116] }), t);
      let kA = 0, kB = 0, doneK = 0;
      if (T >= 0) {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        kB = E.back(seg(T, 0.4, 0.75)) * fade;
        kA = E.back(seg(T, 1.6, 1.95)) * fade;
        doneK = seg(T, 2.6, 3.0) * fade;
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      signCard(g, RX - 30, -88, 46, 24, 'КОПИЯ', kB, 9);
      signCard(g, AX + 20, -80, 74, 24, '2 ПРОВЕРКИ', kA, 8.5);
      tickBadge(g, 0, -66, doneK, 9);
      sparks(g, 0, -70, seg(T, 2.6, 3.2), 12, 6);
    },
  };

  SC['ax1-fix'] = {
    dur: 6,
    width: 380,
    label: 'Девушка отправляет рекламацию: облако со словом «исправь», робот чинит и показывает галочку.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -85, RX = 85;
      let anya = breathe(P({ hF: [22, -100], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [10, -70], hB: [-4, -50], head: [2, -116] }), t);
      let cK = 0, fixK = 0, doneK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.4, 0.75)) * fade;
        bot = mix(bot, P({ head: [-6, -113], chest: [-2, -90] }, bot),
          E.soft(seg(T, 1.2, 1.6)) * (1 - E.soft(seg(T, 2.4, 2.7))));
        fixK = seg(T, 2.0, 2.5) * fade;
        doneK = seg(T, 2.8, 3.2) * fade;
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, 0, -104, 'исправь', cK, { tail: 34, size: 14, fill: C.butterSoft });
      sparks(g, RX - 18, -96, fixK, 14, 6);
      tickBadge(g, RX - 36, -120, doneK, 9);
    },
  };
  // ================= сцены 9–17: по сцене на реплику (динамика ~10 с) =================

  SC['ax1-intro'] = {
    dur: 6.5,
    width: 380,
    label: 'Знакомство: Аня, выгрузка продаж и срок «отчёт к пятнице».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -78;
      let anya = breathe(P({ hF: [14, -66], hB: [-4, -52], head: [3, -114] }), t);
      let fK = 0, dK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        fK = 0.9; dK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        fK = E.back(seg(T, 0.4, 0.9)) * fade;
        dK = E.back(seg(T, 1.4, 1.8)) * fade;
        capK = E.back(seg(T, 2.2, 2.6)) * (1 - seg(T, 5.4, 5.7)) * fade;
        anya = mix(anya, P({ hF: [26, -96], head: [7, -113] }, anya),
          E.soft(seg(T, 0.8, 1.3)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      fileCard(g, 56, -126, fK, 0);
      signCard(g, 124, -86, 62, 22, 'к пятнице', dK, 8);
      text(g, 'выгрузка продаж', 56, -66, 7, C.muted);
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -20, -114, 'отчёт к пятнице', capK, { tail: -26, size: 8 });
    },
  };

  SC['ax1-question'] = {
    dur: 5.5,
    width: 380,
    label: 'Слушатель спрашивает, причём тут искусственный интеллект; робот оживает.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 84;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, glowK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.35, 0.7)) * (1 - seg(T, 3.6, 3.9)) * fade;
        glowK = seg(T, 1.1, 1.6) * fade;
        bot = mix(bot, P({ head: [-5, -113], chest: [-2, -90] }, bot),
          E.soft(seg(T, 1.1, 1.6)) * (1 - E.soft(seg(T, 4.3, 4.7))));
        const talk = seg(T, 0.35, 0.7) * (1 - seg(T, 1.6, 1.9));
        const m = Math.abs(Math.sin(T * 10)) * 1.4 * talk;
        anya = Object.assign({}, anya, { head: [anya.head[0] + m * 0.4, anya.head[1] - m] });
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: glowK, blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -30, -114, 'причём тут интеллект?', qK, { tail: -26, size: 8 });
      sparks(g, RX + 30, -118, glowK, 10, 5);
    },
  };

  SC['ax1-vs'] = {
    dur: 6.5,
    width: 380,
    label: 'Сравнение: обычный чат даёт текст-советы, режим агента — готовый файл.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let anya = breathe(P({ hF: [16, -74], hB: [-6, -54], head: [3, -114] }), t);
      let lK = 0, rK = 0, doneK = 0, capK = 0;
      if (T < 0) {
        lK = 0.9; rK = 0.9; doneK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.7)) * fade;
        rK = E.back(seg(T, 1.3, 1.7)) * fade;
        doneK = seg(T, 2.1, 2.5) * fade;
        capK = E.back(seg(T, 2.7, 3.0)) * (1 - seg(T, 5.6, 5.9)) * fade;
        anya = mix(anya, P({ hF: [40, -100], head: [8, -113] }, anya),
          E.soft(seg(T, 1.6, 2.1)) * (1 - E.soft(seg(T, 4.6, 5.0))));
      }
      bubble(g, -104, -70, 'советы текстом', lK, { tail: 20, size: 7.5, fill: '#f4f4f4' });
      text(g, 'обычный чат', -104, -118, 7, C.muted);
      fileCard(g, 74, -108, rK, doneK);
      text(g, 'режим агента', 106, -52, 7, C.muted);
      fig(g, anya, 0, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, 0, -114, 'а не рецепт', capK, { tail: 0, size: 8, fill: C.butterSoft });
    },
  };

  SC['ax1-start'] = {
    dur: 5.5,
    width: 380,
    label: 'С чего начать: робот показывает чек-лист настройки из шести шагов.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -96, RX = 26;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [30, -74], hB: [4, -58], head: [0, -116] }), t);
      let qK = 0, shK = 0;
      if (T < 0) {
        shK = 0.9; qK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.0, 2.3)) * fade;
        shK = E.back(seg(T, 0.9, 1.3)) * fade;
        anya = mix(anya, P({ head: [8, -113] }, anya), seg(T, 0.3, 0.7) * (1 - seg(T, 1.8, 2.1)));
      }
      fig(g, bot, RX, 0, {
        sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true },
        held: (g2, J) => R.held(g2, J, (hF) => {
          if (shK <= 0) { return; }
          g2.save(); g2.globalAlpha = Math.min(1, shK);
          checklistSheet(g2, [hF[0] + 34, hF[1] - 6], 0);
          g2.restore();
        }),
      });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -50, -114, 'с чего начать?', qK, { tail: -26, size: 8 });
      text(g, 'чек-лист настройки', 64, -130, 7, C.muted);
    },
  };

  SC['ax1-next'] = {
    dur: 5.5,
    width: 380,
    label: 'Настройка готова: шесть галочек, впереди первый запрос.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -84, RX = 40;
      let anya = breathe(P({ hF: [14, -68], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [32, -72], hB: [4, -58], head: [0, -116] }), t);
      let shK = 0, doneK = 0, aK = 0;
      if (T < 0) {
        shK = 0.9; doneK = 0.9; aK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        shK = E.back(seg(T, 0.25, 0.6)) * fade;
        doneK = seg(T, 0.9, 1.3) * fade;
        aK = E.back(seg(T, 1.8, 2.2)) * (1 - seg(T, 4.8, 5.1)) * fade;
      }
      fig(g, bot, RX, 0, {
        sx: 1, ink: ORG, far: ORG_FAR, bot: { glow: doneK, blink: true, happy: doneK > 0.3 },
        held: (g2, J) => R.held(g2, J, (hF) => {
          if (shK <= 0) { return; }
          g2.save(); g2.globalAlpha = Math.min(1, shK);
          checklistSheet(g2, [hF[0] + 34, hF[1] - 6], 6);
          g2.restore();
        }),
      });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      tickBadge(g, RX + 78, -118, doneK, 9);
      if (aK > 0) {
        g.save(); g.globalAlpha = Math.min(1, aK);
        g.strokeStyle = C.umber; g.fillStyle = C.umber;
        ln(g, -34, -126, 22, -126, 1.6);
        g.beginPath(); g.moveTo(22, -131); g.lineTo(32, -126); g.lineTo(22, -121); g.closePath(); g.fill();
        text(g, 'дальше: запрос', -34, -130, 7.5, C.umber, 'left');
        g.restore();
      }
    },
  };

  SC['ax1-example'] = {
    dur: 5,
    width: 380,
    label: 'Слушатель просит пример: появляется карточка запроса из четырёх частей.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -80, RX = 80;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0;
      if (T < 0) {
        qK = 0.9; cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.6)) * (1 - seg(T, 1.8, 2.1)) * fade;
        cK = E.back(seg(T, 1.2, 1.6)) * fade;
        bot = mix(bot, P({ head: [-5, -113] }, bot),
          E.soft(seg(T, 0.5, 0.9)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -40, -114, 'например?', qK, { tail: -26, size: 8 });
      kzfpCard(g, -10, -104, cK);
      text(g, 'пример запроса', 19, -54, 7, C.muted);
    },
  };

  SC['ax1-doubt'] = {
    dur: 6,
    width: 380,
    label: 'Сомнение слушателя: агент уже выполняет три шага — открыть, посчитать, сохранить.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -86, RX = 70;
      let anya = breathe(P({ hF: [12, -70], hB: [-4, -52], head: [4, -114] }), t);
      let bot = breathe(P({ hF: [10, -60], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, s1 = 0, s2 = 0, s3 = 0;
      if (T < 0) {
        qK = 0.9; s1 = s2 = s3 = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.6)) * (1 - seg(T, 2.2, 2.5)) * fade;
        s1 = seg(T, 0.9, 1.2) * fade;
        s2 = seg(T, 1.5, 1.8) * fade;
        s3 = seg(T, 2.1, 2.4) * fade;
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: s3, blink: true, happy: s3 > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -44, -114, 'просто сделает?', qK, { tail: -26, size: 8 });
      tickBadge(g, 96, -114, s1, 8);
      tickBadge(g, 120, -112, s2, 8);
      tickBadge(g, 144, -100, s3, 8);
      text(g, 'открыть', 96, -124, 6, C.muted);
      text(g, 'посчитать', 122, -88, 6, C.muted);
      text(g, 'сохранить', 144, -76, 6, C.muted);
    },
  };

  SC['ax1-takeaway'] = {
    dur: 6.5,
    width: 380,
    label: 'Итог урока: настроенная среда, первый столбец текстом, привычка проверять сумму.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let anya = breathe(P({ hF: [16, -74], hB: [-6, -54], head: [3, -114] }), t);
      let k1 = 0, k2 = 0, k3 = 0;
      if (T < 0) {
        k1 = k2 = k3 = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        k1 = E.back(seg(T, 0.4, 0.75)) * fade;
        k2 = E.back(seg(T, 1.2, 1.55)) * fade;
        k3 = E.back(seg(T, 2.0, 2.35)) * fade;
        anya = mix(anya, P({ hF: [34, -104], head: [6, -113] }, anya),
          E.soft(seg(T, 0.6, 1.1)) * (1 - E.soft(seg(T, 4.4, 4.8))));
      }
      fig(g, anya, 0, 0, { sx: 1, ink: INK, far: INK_FAR });
      signCard(g, -104, -126, 68, 20, 'среда', k1, 8.5);
      signCard(g, 0, -126, 68, 20, 'столбец', k2, 8.5);
      signCard(g, 94, -126, 68, 20, 'привычка', k3, 8.5);
      text(g, 'итог урока', -100, -40, 8, C.muted);
      text(g, 'проверять сумму', 100, -40, 7, C.soft);
    },
  };

  SC['ax1-bridge'] = {
    dur: 6.5,
    width: 380,
    label: 'Мост ко второму уроку: чистим выгрузки сами, чужие контакты агенту не уходят.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -84, RX = 84;
      let anya = breathe(P({ hF: [14, -68], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [10, -58], hB: [-4, -50], head: [2, -116] }), t);
      let shK = 0, phK = 0, crossK = 0, capK = 0;
      if (T < 0) {
        shK = 0.9; phK = 0.9; crossK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        phK = E.back(seg(T, 0.4, 0.8)) * fade;
        crossK = seg(T, 1.4, 1.8) * fade;
        shK = E.back(seg(T, 2.2, 2.6)) * fade;
        capK = E.back(seg(T, 3.0, 3.3)) * (1 - seg(T, 5.8, 6.1)) * fade;
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: shK, blink: true, happy: shK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      // выгрузка с чужими контактами, перечёркнута
      if (phK > 0) {
        g.save(); g.globalAlpha = Math.min(1, phK);
        rr(g, -18, -112, 36, 48, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 3; i++) { ln(g, -11, -101 + i * 12, 11, -101 + i * 12, 1.1); }
        g.restore();
      }
      if (crossK > 0) {
        g.save(); g.globalAlpha = Math.min(1, crossK);
        g.strokeStyle = '#b91c1c';
        ln(g, -22, -116, 22, -60, 2.4, '#b91c1c');
        ln(g, 22, -116, -22, -60, 2.4, '#b91c1c');
        g.restore();
      }
      // щит с галочкой: данные под защитой
      if (shK > 0) {
        g.save(); g.globalAlpha = Math.min(1, shK);
        g.beginPath();
        g.moveTo(112, -126); g.lineTo(142, -126); g.lineTo(142, -100);
        g.lineTo(127, -84); g.lineTo(112, -100); g.closePath();
        inkFill(g, C.butterSoft || C.paper, 1.6);
        g.strokeStyle = C.ink; g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(119, -107); g.lineTo(125, -100); g.lineTo(136, -116); g.stroke();
        g.restore();
      }
      bubble(g, -46, -114, 'чистим сами', capK, { tail: -26, size: 8 });
      text(g, 'чужие контакты агенту не уходят', 0, -44, 7, C.muted);
    },
  };
})();
