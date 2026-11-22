// Урок 9 «Цепочка одним сообщением»: 17 стик-сцен финального спринта.
// Load after stick.js: <stick-scene scene="ax9-intro" play="view"></stick-scene>
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, L2, mix, fig, inkFill, rr, ln, poly, circle, text, seg, clamp, lerp, breathe, pulse, bubble, words, tickBadge, sparks, arrow, arcPt, strokePath } = R;

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

  // карточка-файл с тёмными кляксами (грязный файл)
  function dirtyCard(g, x, y, k, w, h) {
    if (k <= 0) { return; }
    const W = w || 52, H = h || 38;
    g.save(); g.globalAlpha = Math.min(1, k);
    rr(g, x, y, W, H, 4); inkFill(g, C.paper, 1.5);
    for (let i = 0; i < 3; i++) ln(g, x + 6, y + 11 + i * 10, x + W - 8, y + 11 + i * 10, 1.1);
    // кляксы-пятна
    g.fillStyle = C.ink;
    circle(g, x + 12, y + 8, 3.2); g.fill();
    circle(g, x + 34, y + 20, 2.6); g.fill();
    circle(g, x + 22, y + 31, 3.6); g.fill();
    circle(g, x + 43, y + 9, 2.2); g.fill();
    circle(g, x + 8, y + 27, 2); g.fill();
    g.restore();
  }

  // чистая карточка-файл (без клякс)
  function cleanCard(g, x, y, k, w, h) {
    if (k <= 0) { return; }
    const W = w || 46, H = h || 34;
    g.save(); g.globalAlpha = Math.min(1, k);
    rr(g, x, y, W, H, 4); inkFill(g, C.paper, 1.6);
    for (let i = 0; i < 3; i++) ln(g, x + 6, y + 10 + i * 9, x + W - 8, y + 10 + i * 9, 1.1);
    g.restore();
  }

  // звено цепочки: кружок с номером, загорается при k
  function chainLink(g, x, y, n, k) {
    if (k <= 0) { return; }
    const s = E.back(clamp(k, 0, 1));
    g.save(); g.globalAlpha = Math.min(1, k + 0.15);
    circle(g, x, y, 11 * Math.max(0.2, s));
    inkFill(g, k > 0.45 ? C.butter : C.paper, 1.6);
    text(g, '' + n, x, y + 3, 8, C.ink);
    g.restore();
  }

  // флажок финиша
  function flagFin(g, x, y, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    ln(g, x, y, x, y - 44, 2.4, C.ink);
    poly(g, [[x, y - 44], [x + 22, y - 37.5], [x, y - 31]], true);
    inkFill(g, C.butter, 1.4);
    g.restore();
  }

  // значок-дефект: маленькая плашка с подписью
  function defectChip(g, cx, cy, s, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    const w = 50, h = 24;
    rr(g, cx - w / 2, cy - h / 2, w, h, 3); inkFill(g, C.butterSoft || C.paper, 1.3);
    text(g, s, cx, cy + 2.5, 6.5, C.ink);
    g.restore();
  }

  // свиток-инструкция: лист с закрутками сверху и снизу
  function scrollCard(g, x, y, w, h, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    rr(g, x, y, w, h, 3); inkFill(g, C.paper, 1.6);
    // закрутки
    for (const ry of [y, y + h]) {
      g.save();
      g.translate(x + w / 2, ry);
      g.scale(1, 0.35);
      circle(g, 0, 0, w / 2 - 4);
      inkFill(g, C.chip, 1.4);
      g.restore();
    }
    g.restore();
  }

  // мини-сетка сводной
  function miniGrid(g, x, y, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    const w = 44, h = 34;
    rr(g, x, y, w, h, 2); inkFill(g, C.paper, 1.3);
    ln(g, x, y + 12, x + w, y + 12, 1);
    ln(g, x + w * 0.55, y, x + w * 0.55, y + h, 1);
    ln(g, x + w * 0.55, y + 20, x + w - 3, y + 20, 1);
    ln(g, x + 3, y + 26, x + w * 0.55 - 3, y + 26, 1);
    g.restore();
  }

  // мини-график: ломаная
  function miniLine(g, x, y, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    const w = 44, h = 34;
    rr(g, x, y, w, h, 2); inkFill(g, C.paper, 1.3);
    ln(g, x + 5, y + 5, x + 5, y + h - 5, 1.1, C.muted);
    ln(g, x + 5, y + h - 5, x + w - 5, y + h - 5, 1.1, C.muted);
    const pts = [[x + 8, y + 24], [x + 16, y + 14], [x + 24, y + 19], [x + 32, y + 9], [x + 39, y + 13]];
    strokePath(g, pts, 1.6, C.umber);
    g.restore();
  }

  // мини-график: столбики
  function miniBars(g, x, y, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    const w = 44, h = 34;
    rr(g, x, y, w, h, 2); inkFill(g, C.paper, 1.3);
    ln(g, x + 5, y + 5, x + 5, y + h - 5, 1.1, C.muted);
    ln(g, x + 5, y + h - 5, x + w - 5, y + h - 5, 1.1, C.muted);
    const hs = [12, 20, 9, 16];
    for (let i = 0; i < 4; i++) {
      const bx = x + 9 + i * 8;
      g.fillStyle = C.butter;
      g.fillRect(bx, y + h - 5 - hs[i], 5, hs[i]);
      g.strokeStyle = C.ink; g.lineWidth = 1;
      g.strokeRect(bx, y + h - 5 - hs[i], 5, hs[i]);
    }
    g.restore();
  }

  // маленькая фигурка человека (не робота): голова-кружок + тельце
  function tinyHuman(g, cx, cy, k) {
    if (k <= 0) { return; }
    const s = E.back(clamp(k, 0, 1));
    g.save(); g.globalAlpha = Math.min(1, k);
    g.translate(cx, cy); g.scale(s, s);
    circle(g, 0, -14, 5);
    g.fillStyle = C.ink; g.fill();
    ln(g, 0, -9, 0, 4, 2.2);                 // тельце
    ln(g, 0, -5, -7, 1, 2);                  // руки
    ln(g, 0, -5, 7, 1, 2);
    ln(g, 0, 4, -5, 14, 2.2);                // ноги
    ln(g, 0, 4, 5, 14, 2.2);
    g.restore();
  }

  // лупа
  function loupe(g, cx, cy, k) {
    if (k <= 0) { return; }
    g.save(); g.globalAlpha = Math.min(1, k);
    circle(g, cx, cy, 9);
    inkFill(g, C.paper, 1.8);
    ln(g, cx + 6.5, cy + 6.5, cx + 13, cy + 13, 2.4);
    g.restore();
  }

  // ================= сцены =================

  SC['ax9-intro'] = {
    dur: 6.5,
    width: 380,
    label: 'Финальный урок: между Аней и агентом цепочка из пяти звеньев 0–4, звенья загораются по очереди, у финиша флаг.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -122, RX = 112;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let aK = 0, linkK = [0, 0, 0, 0, 0], connK = 0, flagK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        aK = 0.9; linkK = [0.9, 0.9, 0.9, 0.9, 0.9]; connK = 0.9; flagK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        aK = fade;
        connK = seg(T, 0.3, 0.8) * fade;
        for (let i = 0; i < 5; i++) linkK[i] = E.back(seg(T, 0.7 + i * 0.55, 1.05 + i * 0.55)) * fade;
        flagK = E.back(seg(T, 3.6, 4.1)) * fade;
        capK = E.back(seg(T, 4.2, 4.6)) * (1 - seg(T, 5.6, 5.9)) * fade;
        bot = mix(bot, P({ head: [-4, -112], chest: [-1, -90] }, bot),
          E.soft(seg(T, 1.0, 1.4)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { glow: Math.min(1, linkK[4]), blink: true, happy: linkK[4] > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR, alpha: aK > 0 ? 1 : 0 });
      // соединительная линия цепи
      if (connK > 0) {
        g.save(); g.globalAlpha = Math.min(1, connK);
        ln(g, -84, -64, 56, -64, 1.6, C.muted);
        g.restore();
      }
      const xs = [-84, -49, -14, 21, 56];
      for (let i = 0; i < 5; i++) chainLink(g, xs[i], -64, i, linkK[i]);
      flagFin(g, 84, 0, flagK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'весь цикл сами', -14, -32, 8, C.umber);
        g.restore();
      }
    },
  };

  SC['ax9-dirty'] = {
    dur: 5.5,
    width: 380,
    label: 'Аня спрашивает «снова грязный?» — робот держит файл с тёмными кляксами.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -90, RX = 78;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [26, -92], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.2, 3.5)) * fade;
        cK = E.back(seg(T, 0.9, 1.35)) * fade;
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.6, 1.9));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
        bot = mix(bot, P({ head: [-4, -113] }, bot),
          E.soft(seg(T, 0.7, 1.1)) * (1 - E.soft(seg(T, 3.2, 3.6))));
      }
      dirtyCard(g, RX + 22, -124, cK);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -26, -114, 'снова грязный?', qK, { tail: -26, size: 8 });
    },
  };

  SC['ax9-defects'] = {
    dur: 6.5,
    width: 380,
    label: 'Новый файл: 408 строк, внутри шесть типов дефектов — значки появляются по очереди.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let cK = 0, chips = [0, 0, 0, 0, 0, 0], nK = 0;
      const labels = ['дубли', 'даты', 'числа', 'регионы', 'пробелы', 'контакты'];
      const pos = [[-64, -102], [0, -102], [64, -102], [-64, -74], [0, -74], [64, -74]];
      if (T < 0) {
        cK = 0.9; chips = [0.9, 0.9, 0.9, 0.9, 0.9, 0.9]; nK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = E.back(seg(T, 0.3, 0.8)) * fade;
        nK = E.back(seg(T, 0.5, 0.9)) * fade;
        for (let i = 0; i < 6; i++) chips[i] = E.back(seg(T, 1.1 + i * 0.5, 1.45 + i * 0.5)) * fade;
      }
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, -104, -124, 208, 92, 5); inkFill(g, C.paper, 1.6);
        ln(g, -104, -110, 104, -110, 1.1);
        for (let i = 0; i < 3; i++) ln(g, -96, -100 + i * 12, 96, -100 + i * 12, 1.1);
        g.restore();
      }
      if (nK > 0) {
        g.save(); g.globalAlpha = Math.min(1, nK);
        text(g, '408 строк', 0, -130, 9, C.ink);
        g.restore();
      }
      for (let i = 0; i < 6; i++) defectChip(g, pos[i][0], pos[i][1], labels[i], chips[i]);
      if (T >= 0 && seg(T, this.dur - 0.45, this.dur) < 1) {
        sparks(g, 88, -118, seg(T, 4.2, 4.8), 12, 5);
      }
    },
  };

  SC['ax9-start'] = {
    dur: 5.5,
    width: 380,
    label: 'С чего начать: робот указывает на первую ступеньку с номером 0.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -98, RX = 52;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [26, -70], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, stK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; stK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        stK = E.back(seg(T, 0.9, 1.35)) * fade;
        anya = mix(anya, P({ head: [8, -113] }, anya), seg(T, 0.3, 0.7) * (1 - seg(T, 1.8, 2.1)));
        bot = mix(bot, P({ head: [5, -114] }, bot),
          E.soft(seg(T, 0.7, 1.1)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      // ступенька с номером 0
      if (stK > 0) {
        g.save(); g.globalAlpha = Math.min(1, stK);
        rr(g, 84, -30, 64, 30, 3); inkFill(g, C.chip, 1.5);
        text(g, '0', 100, -9, 13, C.ink);
        text(g, 'шаг', 128, -11, 7, C.muted);
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: 1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -34, -114, 'с чего начать?', qK, { tail: -26, size: 8 });
    },
  };

  SC['ax9-zerostep'] = {
    dur: 7,
    width: 380,
    label: 'Ключевая сцена: нулевой шаг делается локально внутри контура, без агента; телефоны, конверты и примечания вычеркнуты; рядом журнал безопасности.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -110, RX = 110;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let cK = 0, fK = 0, i1 = 0, i2 = 0, i3 = 0, xK = 0, jK = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [6, -113] }, anya), pulse(t, 6, 2, 2));
        cK = fK = i1 = i2 = i3 = xK = jK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        cK = seg(T, 0.3, 0.7) * fade;
        fK = E.back(seg(T, 0.5, 0.9)) * fade;
        i1 = E.back(seg(T, 1.0, 1.35)) * fade;
        i2 = E.back(seg(T, 1.3, 1.65)) * fade;
        i3 = E.back(seg(T, 1.6, 1.95)) * fade;
        xK = seg(T, 2.2, 2.7) * fade;
        jK = E.back(seg(T, 3.0, 3.45)) * fade;
        capK = E.back(seg(T, 4.0, 4.4)) * (1 - seg(T, 5.8, 6.1)) * fade;
        anya = mix(anya, P({ hF: [20, -80], head: [5, -113] }, anya),
          E.soft(seg(T, 1.0, 1.5)) * (1 - E.soft(seg(T, 4.6, 5.0))));
      }
      dashRect(g, -158, -130, 172, 126, cK);
      // файл внутри контура
      if (fK > 0) {
        g.save(); g.globalAlpha = Math.min(1, fK);
        rr(g, -84, -118, 40, 30, 3); inkFill(g, C.paper, 1.4);
        for (let i = 0; i < 2; i++) ln(g, -77, -108 + i * 9, -51, -108 + i * 9, 1);
        g.restore();
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      // три значка внутри контура: телефон, конверт, примечание
      iconPhone(g, -38, -114, i1);
      iconMail(g, -14, -113, i2);
      iconNote(g, -40, -88, i3);
      // все три перечёркнуты красным
      bigCross(g, -33, -107, 14, 12, xK);
      bigCross(g, -7, -108, 13, 10, xK);
      bigCross(g, -33, -81, 13, 10, xK);
      // журнал безопасности рядом
      signCard(g, 58, -34, 84, 24, 'журнал безопасности', jK, 6.5);
      // робот снаружи, не участвует
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        text(g, 'локально', -72, -14, 7.5, C.muted);
        g.restore();
      }
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'шаг 0 делает человек', 86, -128, 7, C.umber);
        g.restore();
      }
    },
  };

  SC['ax9-upload'] = {
    dur: 6,
    width: 380,
    label: 'Потом загружаем: из контура «локально» к агенту идёт стрелка, летит только чистая карточка без клякс.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -100, RX = 88;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [8, -56], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0, arrK = 0, fly = 0, capK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [7, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9; arrK = 0.9; fly = 1; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 2.6, 2.9)) * fade;
        cK = seg(T, 0.3, 0.7) * fade;
        arrK = seg(T, 1.1, 1.7) * fade;
        fly = E.soft(seg(T, 1.4, 2.4)) * fade;
        capK = E.back(seg(T, 2.6, 3.0)) * (1 - seg(T, 4.8, 5.1)) * fade;
        const talkA = seg(T, 0.3, 0.65) * (1 - seg(T, 1.4, 1.7));
        const mA = Math.abs(Math.sin(T * 10)) * 1.4 * talkA;
        anya = Object.assign({}, anya, { head: [anya.head[0] + mA * 0.4, anya.head[1] - mA] });
        bot = mix(bot, P({ hF: [26, -92], head: [-4, -113] }, bot),
          E.soft(seg(T, 1.6, 2.1)) * (1 - E.soft(seg(T, 4.2, 4.6))));
      }
      dashRect(g, -160, -126, 120, 118, cK);
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        text(g, 'локально', -100, -14, 7, C.muted);
        g.restore();
      }
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -104, -112, 'потом загружаем?', qK, { tail: -20, size: 7.5 });
      arrow(g, [[-34, -84], [48, -84]], { k: arrK, col: C.umber, head: 6 });
      const p = arcPt([-30, -96], [46, -96], 26, fly);
      cleanCard(g, p[0] - 23, p[1] - 17, Math.min(1, 0.2 + fly) * (fly < 1 ? 1 : 1), 46, 34);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true, happy: fly > 0.8 } });
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'только чистое', 8, -60, 8, C.umber);
        g.restore();
      }
    },
  };

  SC['ax9-clean'] = {
    dur: 6.5,
    width: 380,
    label: 'Первый запрос агенту: слева карточка из пяти строк, справа журнал очистки с пятью галочками.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const RX = 6;
      let bot = breathe(P({ hF: [10, -60], hB: [-4, -50], head: [2, -116] }), t);
      let lK = 0, arrK = 0, jK = 0, lit = 0, capK = 0;
      if (T < 0) {
        bot = mix(bot, P({ head: [-4, -114] }, bot), pulse(t, 6, 2, 2));
        lK = 0.9; jK = 0.9; lit = 5;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        lK = E.back(seg(T, 0.3, 0.75)) * fade;
        arrK = seg(T, 1.0, 1.5) * fade;
        jK = E.back(seg(T, 1.6, 2.05)) * fade;
        lit = Math.max(0, Math.min(5, (T - 2.1) / 0.5)) * (fade > 0 ? 1 : 0);
        capK = E.back(seg(T, 4.8, 5.2)) * (1 - seg(T, 5.6, 5.9)) * fade;
        bot = mix(bot, P({ head: [-4, -112], chest: [-1, -90] }, bot),
          E.soft(seg(T, 1.2, 1.6)) * (1 - E.soft(seg(T, 4.4, 4.8))));
      }
      // карточка запроса из пяти строк
      if (lK > 0) {
        g.save(); g.globalAlpha = Math.min(1, lK);
        rr(g, -158, -112, 104, 64, 4); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 5; i++) words(g, -150, -100 + i * 11, 88, i + 2);
        g.restore();
      }
      arrow(g, [[-48, -80], [-24, -80]], { k: arrK, col: C.umber, head: 6 });
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true, happy: lit > 4 } });
      // журнал очистки: пять строк с галочками
      if (jK > 0) {
        g.save(); g.globalAlpha = Math.min(1, jK);
        rr(g, 64, -112, 90, 68, 4); inkFill(g, C.paper, 1.5);
        text(g, 'журнал очистки', 109, -101, 6.5, C.muted);
        for (let i = 0; i < 5; i++) {
          const yy = -90 + i * 11;
          words(g, 72, yy, 52, i + 1);
          const on = Math.max(0, Math.min(1, lit - i));
          if (on > 0) {
            g.save(); g.globalAlpha = on;
            g.strokeStyle = C.greenInk; g.lineWidth = 1.8; g.lineCap = 'round';
            g.beginPath();
            g.moveTo(134, yy - 2); g.lineTo(137, yy + 1.5); g.lineTo(143, yy - 5);
            g.stroke(); g.restore();
          }
        }
        g.restore();
      }
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'запрос одному агенту', -40, -34, 7, C.umber);
        g.restore();
      }
    },
  };

  SC['ax9-checkq'] = {
    dur: 5.5,
    width: 380,
    label: 'Что проверить после очистки: робот с лупой над карточкой данных.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -92, RX = 70;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [24, -96], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0, luK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9; luK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.2, 3.5)) * fade;
        cK = E.back(seg(T, 0.9, 1.3)) * fade;
        luK = E.back(seg(T, 1.4, 1.85)) * fade;
        anya = mix(anya, P({ head: [8, -113] }, anya), seg(T, 0.3, 0.7) * (1 - seg(T, 1.8, 2.1)));
        bot = mix(bot, P({ head: [-4, -113] }, bot),
          E.soft(seg(T, 1.2, 1.6)) * (1 - E.soft(seg(T, 3.6, 4.0))));
      }
      if (cK > 0) {
        g.save(); g.globalAlpha = Math.min(1, cK);
        rr(g, 94, -110, 46, 34, 3); inkFill(g, C.paper, 1.5);
        for (let i = 0; i < 2; i++) ln(g, 101, -100 + i * 10, 131, -100 + i * 10, 1.1);
        g.restore();
      }
      loupe(g, 112, -128, luK);
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -28, -114, 'что проверить?', qK, { tail: -26, size: 8 });
    },
  };

  SC['ax9-control'] = {
    dur: 6,
    width: 380,
    label: 'Контроль: 408 строк до, 400 после, восемь полосок-дублей перечёркнуты, галочка.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let aK = 0, bK = 0, arrK = 0, barsK = 0, okK = 0;
      if (T < 0) {
        aK = bK = arrK = barsK = okK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        aK = E.back(seg(T, 0.3, 0.7)) * fade;
        arrK = seg(T, 1.0, 1.5) * fade;
        bK = E.back(seg(T, 1.4, 1.85)) * fade;
        barsK = seg(T, 2.2, 2.8) * fade;
        okK = seg(T, 3.2, 3.6) * fade;
      }
      if (aK > 0) {
        g.save(); g.globalAlpha = Math.min(1, aK);
        rr(g, -138, -126, 76, 34, 4); inkFill(g, C.paper, 1.5);
        text(g, 'до', -100, -115, 6.5, C.muted);
        text(g, '408', -100, -99, 11, C.ink);
        g.restore();
      }
      arrow(g, [[-52, -108], [46, -108]], { k: arrK, col: C.umber, head: 6 });
      if (bK > 0) {
        g.save(); g.globalAlpha = Math.min(1, bK);
        rr(g, 56, -126, 72, 34, 4); inkFill(g, C.paper, 1.5);
        text(g, 'после', 92, -115, 6.5, C.muted);
        text(g, '400', 92, -99, 11, C.ink);
        g.restore();
      }
      // восемь перечёркнутых полосок — дубли
      if (barsK > 0) {
        g.save(); g.globalAlpha = Math.min(1, barsK);
        for (let i = 0; i < 8; i++) {
          const bx = -112 + i * 32;
          ln(g, bx - 11, -64, bx + 11, -64, 2.4, C.muted);
        }
        g.restore();
        for (let i = 0; i < 8; i++) {
          const bx = -112 + i * 32;
          bigCross(g, bx, -64, 9, 4, barsK);
        }
        g.save(); g.globalAlpha = Math.min(1, barsK);
        text(g, 'дубли', 0, -46, 7.5, C.muted);
        g.restore();
      }
      tickBadge(g, 0, -26, okK, 10);
    },
  };

  SC['ax9-report'] = {
    dur: 5.5,
    width: 380,
    label: 'Дальше отчёт: робот показывает на пустую рамку листа с подписью «Отчёт».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -104, RX = 118;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [30, -90], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, fK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; fK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        fK = E.back(seg(T, 0.9, 1.4)) * fade;
        anya = mix(anya, P({ head: [8, -113] }, anya), seg(T, 0.3, 0.7) * (1 - seg(T, 1.8, 2.1)));
        bot = mix(bot, P({ head: [-6, -114] }, bot),
          E.soft(seg(T, 1.0, 1.4)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      if (fK > 0) {
        g.save(); g.globalAlpha = Math.min(1, fK);
        rr(g, -30, -132, 104, 88, 5); inkFill(g, C.paper, 1.6);
        text(g, 'Отчёт', 22, -116, 9, C.ink);
        ln(g, -30, -106, 74, -106, 1.1, C.line);
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -44, -114, 'дальше отчёт?', qK, { tail: -26, size: 8 });
    },
  };

  SC['ax9-layer'] = {
    dur: 7,
    width: 380,
    label: 'Лист «Отчёт»: две мини-сетки сводных и два мини-графика, четыре галочки загораются по очереди.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let fK = 0, g1 = 0, g2 = 0, ch1 = 0, ch2 = 0;
      let t1 = 0, t2 = 0, t3 = 0, t4 = 0;
      if (T < 0) {
        fK = 0.9; g1 = g2 = ch1 = ch2 = 0.9; t1 = t2 = t3 = t4 = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        fK = E.back(seg(T, 0.3, 0.8)) * fade;
        g1 = E.back(seg(T, 0.9, 1.35)) * fade;
        g2 = E.back(seg(T, 1.5, 1.95)) * fade;
        ch1 = E.back(seg(T, 2.1, 2.55)) * fade;
        ch2 = E.back(seg(T, 2.7, 3.15)) * fade;
        t1 = seg(T, 1.3, 1.7) * fade;
        t2 = seg(T, 1.9, 2.3) * fade;
        t3 = seg(T, 2.5, 2.9) * fade;
        t4 = seg(T, 3.1, 3.5) * fade;
      }
      if (fK > 0) {
        g.save(); g.globalAlpha = Math.min(1, fK);
        rr(g, -76, -132, 164, 102, 5); inkFill(g, C.paper, 1.6);
        text(g, 'Отчёт', 6, -118, 9, C.ink);
        ln(g, -76, -110, 88, -110, 1.1, C.line);
        g.restore();
      }
      miniGrid(g, -62, -104, g1);
      miniGrid(g, 2, -104, g2);
      miniLine(g, -62, -58, ch1);
      miniBars(g, 2, -58, ch2);
      tickBadge(g, -12, -110, t1, 5.5);
      tickBadge(g, 52, -110, t2, 5.5);
      tickBadge(g, -12, -64, t3, 5.5);
      tickBadge(g, 52, -64, t4, 5.5);
    },
  };

  SC['ax9-budget'] = {
    dur: 5.5,
    width: 380,
    label: 'И бюджет: робот держит карточку «6 месяцев».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -98, RX = 76;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [30, -88], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, cK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; cK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        cK = E.back(seg(T, 0.9, 1.35)) * fade;
        anya = mix(anya, P({ head: [8, -113] }, anya), seg(T, 0.3, 0.7) * (1 - seg(T, 1.8, 2.1)));
        bot = mix(bot, P({ head: [-4, -113] }, bot),
          E.soft(seg(T, 0.8, 1.2)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true, happy: cK > 0.3 } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      signCard(g, RX - 34, -88, 72, 24, '6 месяцев', cK, 8);
      bubble(g, -34, -114, 'и бюджет?', qK, { tail: -26, size: 8 });
    },
  };

  SC['ax9-mini'] = {
    dur: 7,
    width: 380,
    label: 'Мини-бюджет: шесть колонок-месяцев и две линии-сценария, слева карточка «Драйверы» со стрелкой.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let dK = 0, arrK = 0, bK = 0, cols = 0, l1 = 0, l2 = 0;
      if (T < 0) {
        dK = bK = 0.9; cols = 6; l1 = l2 = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        dK = E.back(seg(T, 0.3, 0.8)) * fade;
        arrK = seg(T, 1.0, 1.5) * fade;
        bK = E.back(seg(T, 1.4, 1.9)) * fade;
        cols = Math.max(0, Math.min(6, (T - 1.8) / 0.4)) * (fade > 0 ? 1 : 0);
        l1 = seg(T, 3.6, 4.2) * fade;
        l2 = seg(T, 4.2, 4.8) * fade;
      }
      // карточка драйверов
      if (dK > 0) {
        g.save(); g.globalAlpha = Math.min(1, dK);
        rr(g, -150, -100, 84, 60, 4); inkFill(g, C.paper, 1.5);
        text(g, 'Драйверы', -108, -86, 7.5, C.ink);
        for (let i = 0; i < 3; i++) words(g, -142, -74 + i * 11, 68, i + 3);
        g.restore();
      }
      arrow(g, [[-58, -70], [-18, -70]], { k: arrK, col: C.umber, head: 6 });
      // карточка бюджета
      if (bK > 0) {
        g.save(); g.globalAlpha = Math.min(1, bK);
        rr(g, -6, -110, 132, 80, 5); inkFill(g, C.paper, 1.6);
        ln(g, -6, -96, 126, -96, 1.1, C.line);
        g.restore();
      }
      // шесть узких колонок-месяцев
      for (let i = 0; i < 6; i++) {
        const on = Math.max(0, Math.min(1, cols - i));
        if (on <= 0) { continue; }
        const cx = 11 + i * 19;
        g.save(); g.globalAlpha = Math.min(1, on);
        g.fillStyle = C.chip; g.strokeStyle = C.ink; g.lineWidth = 1.1;
        g.fillRect(cx - 6, -90, 12, 52);
        g.strokeRect(cx - 6, -90, 12, 52);
        g.restore();
      }
      // две линии-сценария: верхняя и нижняя
      if (l1 > 0) {
        g.save(); g.globalAlpha = Math.min(1, l1);
        strokePath(g, [[5, -64], [24, -58], [43, -62], [62, -54], [81, -58], [112, -50]], 1.8, C.umber);
        g.restore();
      }
      if (l2 > 0) {
        g.save(); g.globalAlpha = Math.min(1, l2);
        strokePath(g, [[5, -78], [24, -80], [43, -76], [62, -82], [81, -78], [112, -84]], 1.8, C.redInk);
        g.restore();
      }
    },
  };

  SC['ax9-whyplay'] = {
    dur: 5.5,
    width: 380,
    label: 'Зачем сохранять цепочку: робот держит свиток со списком шагов.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      const AX = -98, RX = 80;
      let anya = breathe(P({ hF: [10, -58], hB: [-4, -52], head: [3, -114] }), t);
      let bot = breathe(P({ hF: [30, -88], hB: [-4, -50], head: [2, -116] }), t);
      let qK = 0, sK = 0;
      if (T < 0) {
        anya = mix(anya, P({ head: [8, -113] }, anya), pulse(t, 6, 2, 2));
        qK = 0.9; sK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        qK = E.back(seg(T, 0.3, 0.65)) * (1 - seg(T, 3.0, 3.3)) * fade;
        sK = E.back(seg(T, 0.9, 1.4)) * fade;
        anya = mix(anya, P({ head: [8, -113] }, anya), seg(T, 0.3, 0.7) * (1 - seg(T, 1.8, 2.1)));
        bot = mix(bot, P({ head: [-4, -113] }, bot),
          E.soft(seg(T, 0.8, 1.2)) * (1 - E.soft(seg(T, 3.4, 3.8))));
      }
      // свиток со списком
      if (sK > 0) {
        g.save(); g.globalAlpha = Math.min(1, sK);
        scrollCard(g, 22, -128, 60, 80, 1);
        for (let i = 0; i < 5; i++) words(g, 30, -114 + i * 12, 44, i + 1);
        g.restore();
      }
      fig(g, bot, RX, 0, { sx: -1, ink: ORG, far: ORG_FAR, bot: { blink: true } });
      fig(g, anya, AX, 0, { sx: 1, ink: INK, far: INK_FAR });
      bubble(g, -32, -114, 'зачем сохранять?', qK, { tail: -28, size: 8 });
    },
  };

  SC['ax9-playbook'] = {
    dur: 7,
    width: 380,
    label: 'Инструкция для агента: пять пунктов, шаг 0 выделен рамкой — его делает человек, не агент.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let sK = 0, rows = [0, 0, 0, 0, 0], hK = 0, humK = 0, capK = 0;
      if (T < 0) {
        sK = 0.9; rows = [0.9, 0.9, 0.9, 0.9, 0.9]; hK = 0.9; humK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        sK = E.back(seg(T, 0.3, 0.85)) * fade;
        for (let i = 0; i < 5; i++) rows[i] = E.back(seg(T, 1.0 + i * 0.45, 1.35 + i * 0.45)) * fade;
        hK = seg(T, 2.9, 3.4) * fade;
        humK = E.back(seg(T, 3.4, 3.85)) * fade;
        capK = E.back(seg(T, 4.0, 4.4)) * (1 - seg(T, 5.8, 6.1)) * fade;
      }
      scrollCard(g, -92, -132, 184, 108, sK);
      if (sK > 0) {
        g.save(); g.globalAlpha = Math.min(1, sK);
        text(g, 'Инструкция для агента', 0, -118, 8.5, C.ink);
        g.restore();
      }
      // пять пунктов: номера + строки
      const rowY = [-102, -87, -72, -57, -42];
      for (let i = 0; i < 5; i++) {
        if (rows[i] <= 0) { continue; }
        g.save(); g.globalAlpha = Math.min(1, rows[i]);
        text(g, '' + i, -78, rowY[i] + 2.5, 8, i === 0 ? C.umber : C.ink);
        words(g, -66, rowY[i], 130, i + 2);
        g.restore();
      }
      // рамка вокруг пункта 0
      if (hK > 0) {
        g.save(); g.globalAlpha = Math.min(1, hK);
        g.setLineDash([4, 3]);
        g.strokeStyle = C.umber; g.lineWidth = 1.8;
        g.strokeRect(-88, -112, 176, 18);
        g.setLineDash([]);
        g.restore();
      }
      // маленький человек рядом
      tinyHuman(g, 120, -76, humK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'делает человек', 120, -48, 6.5, C.umber);
        g.restore();
      }
    },
  };

  SC['ax9-test'] = {
    dur: 6.5,
    width: 380,
    label: 'Проверка переносимости: файл 1 с галочкой и файл 2 со знаком вопроса ведут к одной инструкции.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let f1 = 0, f2 = 0, sK = 0, a1 = 0, a2 = 0, capK = 0, okK = 0;
      if (T < 0) {
        f1 = f2 = sK = a1 = a2 = capK = okK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        f1 = E.back(seg(T, 0.3, 0.75)) * fade;
        f2 = E.back(seg(T, 0.8, 1.25)) * fade;
        sK = E.back(seg(T, 1.5, 2.0)) * fade;
        a1 = seg(T, 2.2, 2.7) * fade;
        a2 = seg(T, 2.6, 3.1) * fade;
        okK = seg(T, 3.4, 3.8) * fade;
        capK = E.back(seg(T, 3.8, 4.2)) * (1 - seg(T, 5.4, 5.7)) * fade;
      }
      // файл 1 с галочкой
      if (f1 > 0) {
        g.save(); g.globalAlpha = Math.min(1, f1);
        rr(g, -158, -112, 56, 36, 4); inkFill(g, C.paper, 1.5);
        text(g, 'файл 1', -130, -95, 7.5, C.ink);
        g.restore();
        tickBadge(g, -158, -112, f1, 7);
      }
      // файл 2 со знаком вопроса
      if (f2 > 0) {
        g.save(); g.globalAlpha = Math.min(1, f2);
        rr(g, 102, -112, 56, 36, 4); inkFill(g, C.paper, 1.5);
        text(g, 'файл 2', 130, -101, 7.5, C.ink);
        text(g, '?', 130, -84, 11, C.umber);
        g.restore();
      }
      // свиток-инструкция в центре
      if (sK > 0) {
        g.save(); g.globalAlpha = Math.min(1, sK);
        scrollCard(g, -40, -128, 80, 56, 1);
        for (let i = 0; i < 3; i++) words(g, -32, -114 + i * 11, 64, i + 1);
        g.restore();
      }
      arrow(g, [[-96, -94], [-48, -94]], { k: a1, col: C.umber, head: 6 });
      arrow(g, [[96, -94], [48, -94]], { k: a2, col: C.umber, head: 6 });
      tickBadge(g, 0, -56, okK, 9);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'переносимо', 0, -36, 8.5, C.umber);
        g.restore();
      }
    },
  };

  SC['ax9-portfolio'] = {
    dur: 7,
    width: 380,
    label: 'Портфель: файл, инструкция, журналы, лог и видео 90 с появляются по очереди, большая галочка и флаг «курс пройден».',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let cards = [0, 0, 0, 0, 0], okK = 0, flagK = 0, capK = 0;
      const items = [
        { cx: -132, w: 46, s: 'файл' },
        { cx: -66, w: 60, s: 'инструкция' },
        { cx: 0, w: 54, s: 'журналы' },
        { cx: 66, w: 44, s: 'лог' },
        { cx: 130, w: 52, s: 'видео 90 с' },
      ];
      if (T < 0) {
        cards = [0.9, 0.9, 0.9, 0.9, 0.9]; okK = 0.9; flagK = 0.9; capK = 0.9;
      } else {
        const fade = 1 - seg(T, this.dur - 0.45, this.dur);
        for (let i = 0; i < 5; i++) cards[i] = E.back(seg(T, 0.4 + i * 0.5, 0.75 + i * 0.5)) * fade;
        okK = seg(T, 3.2, 3.7) * fade;
        flagK = E.back(seg(T, 3.8, 4.3)) * fade;
        capK = E.back(seg(T, 4.4, 4.8)) * (1 - seg(T, 6.0, 6.3)) * fade;
      }
      for (let i = 0; i < 5; i++) signCard(g, items[i].cx, -96, items[i].w, 26, items[i].s, cards[i], 6.5);
      tickBadge(g, 0, -54, okK, 13);
      flagFin(g, 70, -14, flagK);
      if (capK > 0) {
        g.save(); g.globalAlpha = Math.min(1, capK);
        text(g, 'курс пройден', 102, -28, 8, C.umber);
        g.restore();
      }
      sparks(g, 0, -54, seg(T, 3.2, 3.9), 16, 7);
    },
  };
})();
