/* Движок психологических тестов drbaskov.ru */
(function () {
  const T = window.TEST_CONFIG;
  if (!T) return;
  const VS = T.valueStart == null ? 1 : T.valueStart;           // первое значение шкалы
  const VMAX = VS + T.scaleLabels.length - 1;                   // последнее значение шкалы
  const SUM = T.scoring === 'sum';                              // подсчёт суммой (PHQ-9) или средним
  const root = document.getElementById('test-root');
  const LS_PROG = 'test_' + T.id + '_progress';
  const LS_HIST = 'test_' + T.id + '_history';

  let answers = [];
  let idx = 0;

  function loadProgress() {
    try {
      const p = JSON.parse(localStorage.getItem(LS_PROG));
      if (p && Array.isArray(p.answers)) { answers = p.answers; idx = p.idx || 0; return true; }
    } catch (e) {}
    return false;
  }
  function saveProgress() {
    try { localStorage.setItem(LS_PROG, JSON.stringify({ answers, idx })); } catch (e) {}
  }
  function clearProgress() { try { localStorage.removeItem(LS_PROG); } catch (e) {} }
  function history() {
    try { return JSON.parse(localStorage.getItem(LS_HIST)) || []; } catch (e) { return []; }
  }
  function pushHistory(rec) {
    try {
      const h = history(); h.unshift(rec);
      localStorage.setItem(LS_HIST, JSON.stringify(h.slice(0, 10)));
    } catch (e) {}
  }

  function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function startScreen() {
    const hasProg = answers.some(a => a != null) && idx < T.items.length;
    const h = history();
    root.innerHTML = '';
    root.appendChild(el(
      '<div class="t-card">' +
      '<h2>' + T.title + '</h2>' +
      '<p class="t-desc">' + T.description + '</p>' +
      '<p class="t-meta">' + T.items.length + ' утверждений · примерно ' + T.minutes + ' минут · результат сохраняется в вашем браузере</p>' +
      '<div class="t-disclaimer">Это скрининговый опросник для самонаблюдения, а не медицинская диагностика. Результат — повод для размышления и разговора со специалистом, а не диагноз.</div>' +
      '<div class="t-actions">' +
      (hasProg ? '<button class="t-btn solid" id="t-continue">Продолжить (вопрос ' + (idx + 1) + ')</button>' : '') +
      '<button class="t-btn ' + (hasProg ? '' : 'solid') + '" id="t-start">' + (hasProg ? 'Начать заново' : 'Начать тест') + '</button>' +
      '</div>' +
      (h.length ? '<div class="t-history"><h3>Прошлые результаты</h3>' + h.map(function (r, i) {
        return '<a href="#" class="t-hist-item" data-i="' + i + '">' + r.date + ' — открыть результат</a>';
      }).join('') + '</div>' : '') +
      '</div>'
    ));
    const btnS = document.getElementById('t-start');
    if (btnS) btnS.onclick = function () { answers = []; idx = 0; clearProgress(); question(); };
    const btnC = document.getElementById('t-continue');
    if (btnC) btnC.onclick = function () { question(); };
    root.querySelectorAll('.t-hist-item').forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); results(history()[+a.dataset.i], true); };
    });
  }

  function question() {
    if (idx >= T.items.length) { finish(); return; }
    const item = T.items[idx];
    const pct = Math.round(idx / T.items.length * 100);
    root.innerHTML = '';
    root.appendChild(el(
      '<div class="t-card">' +
      '<div class="t-progress"><div class="t-progress-bar" style="width:' + pct + '%"></div></div>' +
      '<div class="t-count">' + (idx + 1) + ' / ' + T.items.length + '</div>' +
      '<p class="t-question">' + esc(item.text) + '</p>' +
      '<div class="t-scale">' + T.scaleLabels.map(function (lab, i) {
        const v = VS + i;
        const sel = answers[idx] === v ? ' selected' : '';
        return '<button class="t-opt' + sel + '" data-v="' + v + '"><b>' + v + '</b><span>' + lab + '</span></button>';
      }).join('') + '</div>' +
      '<div class="t-nav">' +
      (idx > 0 ? '<button class="t-btn small" id="t-back">← Назад</button>' : '<span></span>') +
      '<button class="t-btn small" id="t-exit">Сохранить и выйти</button>' +
      '</div></div>'
    ));
    root.querySelectorAll('.t-opt').forEach(function (b) {
      b.onclick = function () {
        answers[idx] = +b.dataset.v; idx++;
        saveProgress(); question();
        window.scrollTo({ top: root.offsetTop - 90, behavior: 'instant' });
      };
    });
    const back = document.getElementById('t-back');
    if (back) back.onclick = function () { idx--; question(); };
    document.getElementById('t-exit').onclick = function () { saveProgress(); startScreen(); };
  }

  function computeScales() {
    return Object.keys(T.scales).map(function (key) {
      const sc = T.scales[key];
      let sum = 0;
      const rev = T.reverse || [];
      const map = T.valueMap || null;          // нелинейный подсчёт (например, EAT-26)
      sc.items.forEach(function (n) {
        const raw = answers[n - 1];
        if (raw == null) return;
        let a;
        if (map) {
          const idx = raw - VS;
          a = (rev.indexOf(n) !== -1 && T.reverseMap) ? T.reverseMap[idx] : map[idx];
        } else {
          a = (rev.indexOf(n) !== -1) ? VMAX + VS - raw : raw;
        }
        sum += a;
      });
      const unitMax = map ? Math.max.apply(null, map) : VMAX;
      const unitMin = map ? Math.min.apply(null, map) : VS;
      const val = SUM ? sum : sum / sc.items.length;
      const min = SUM ? unitMin * sc.items.length : unitMin;
      const max = SUM ? unitMax * sc.items.length : unitMax;
      return { key: key, name: sc.name, group: sc.group || '', positive: !!sc.positive,
        mean: Math.round(val * 100) / 100, min: min, max: max, bands: sc.bands || null };
    });
  }

  function finish() {
    clearProgress();
    const rec = {
      date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      scales: computeScales(),
      answers: answers.slice()
    };
    pushHistory(rec);
    results(rec, false);
  }

  function band(mean, positive, custom) {
    const bands = custom || T.bands;
    for (const b of bands) { if (mean < b.max) return positive ? (b.pos || b) : b; }
    const last = bands[bands.length - 1];
    return positive ? (last.pos || last) : last;
  }

  function results(rec, fromHistory) {
    const groups = {};
    rec.scales.forEach(function (s) { (groups[s.group] = groups[s.group] || []).push(s); });
    let html = '<div class="t-card"><h2>Результат · ' + rec.date + '</h2>';
    Object.keys(groups).forEach(function (g) {
      if (g) html += '<h3 class="t-group">' + g + '</h3>';
      groups[g].sort(function (a, b) { return b.mean - a.mean; });
      groups[g].forEach(function (s) {
        const bd = band(s.mean, s.positive, s.bands);
        const w = Math.round((s.mean - s.min) / (s.max - s.min) * 100);
        const valTxt = SUM ? (s.mean + ' из ' + s.max) : s.mean.toFixed(2);
        html += '<div class="t-res-row"><div class="t-res-head"><span>' + s.name + '</span>' +
          '<span class="t-res-val" style="color:' + bd.color + '">' + valTxt + ' · ' + bd.label + '</span></div>' +
          '<div class="t-res-bar"><div style="width:' + Math.max(w, 2) + '%;background:' + bd.color + '"></div></div></div>';
      });
    });
    if (T.flags) T.flags.forEach(function (f) {
      const a = rec.answers[f.item - 1];
      if (a != null && a >= f.min) html += '<div class="t-alert">' + f.html + '</div>';
    });
    html += '<div class="t-disclaimer" style="margin-top:28px">' + T.resultNote + '</div>';
    html += '<div class="t-actions">' +
      '<a class="t-btn solid" href="/#contact">Обсудить результат на консультации</a>' +
      '<button class="t-btn" id="t-download">Скачать результат</button>' +
      '<button class="t-btn" id="t-again">Пройти заново</button></div></div>';
    root.innerHTML = html;
    document.getElementById('t-again').onclick = function () { answers = []; idx = 0; startScreen(); };
    document.getElementById('t-download').onclick = function () {
      let txt = T.title + '\r\nДата: ' + rec.date + '\r\nСайт: https://drbaskov.ru\r\n\r\n';
      rec.scales.forEach(function (s) {
        const v = SUM ? (s.mean + ' из ' + s.max) : s.mean.toFixed(2);
        txt += (s.group ? '[' + s.group + '] ' : '') + s.name + ': ' + v + ' (' + band(s.mean, s.positive, s.bands).label + ')\r\n';
      });
      txt += '\r\nЭто скрининговая самодиагностика, не медицинский диагноз.\r\n';
      const blob = new Blob(['﻿' + txt], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = T.id + '-результат.txt';
      a.click();
    };
  }

  loadProgress();
  startScreen();
})();
