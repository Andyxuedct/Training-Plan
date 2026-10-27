(function () {
  'use strict';

  var T = {
    zh: {
      tabs: { detailed: 'HYROX 详细计划', v3: '赛季计划 v3' },
      today: '今天', todayK: '今天的训练', view: '查看', loading: '加载中…', offline: '离线，无法加载这份计划',
      raceIn: '距离比赛还有 {n} 天', raceToday: '今天比赛', raceDone: '比赛已结束',
      done: '完成', markDone: '标记完成', log: '记录', hide: '收起',
      fTime: '用时', fDist: '距离 (km)', fPace: '配速 / 分段', fHr: '平均心率', fRpe: '主观强度 RPE (1–10)', fNote: '重量、组数、感受',
      phTime: '例：52:30', phDist: '例：8', phPace: '例：4:38 4:36 4:40 4:35', phHr: '例：168', phRpe: '例：7',
      phNoteGym: '例：上斜哑铃 2x26kg 4x8；划船 60kg 4x8；引体 5x8',
      phNote: '例：腿有点沉，最后一组掉速',
      saved: '已保存 {t}', recTitle: '我的记录', recSub: '只存在这台手机里。想让我根据记录调整计划，点“复制给 Claude”，然后粘贴到对话里。',
      copy: '复制给 Claude', exportJ: '导出备份', importJ: '导入备份', close: '关闭', copied: '已复制', imported: '已导入 {n} 条记录',
      none: '还没有记录。在每天的课下面点“标记完成”或“记录”。', nDone: '已完成', nWeek: '本周完成', nLogged: '有记录',
      updated: '计划已更新'
    },
    en: {
      tabs: { detailed: 'HYROX plan', v3: 'Season plan v3' },
      today: 'Today', todayK: "Today's session", view: 'View', loading: 'Loading…', offline: 'Offline, could not load this plan',
      raceIn: 'Race in {n} days', raceToday: 'Race day', raceDone: 'Race done',
      done: 'Done', markDone: 'Mark done', log: 'Log', hide: 'Hide',
      fTime: 'Time', fDist: 'Distance (km)', fPace: 'Pace / splits', fHr: 'Avg HR', fRpe: 'RPE (1–10)', fNote: 'Weights, sets, notes',
      phTime: 'e.g. 52:30', phDist: 'e.g. 8', phPace: 'e.g. 4:38 4:36 4:40 4:35', phHr: 'e.g. 168', phRpe: 'e.g. 7',
      phNoteGym: 'e.g. incline DB 2x26kg 4x8; row 60kg 4x8; pull-ups 5x8',
      phNote: 'e.g. legs heavy, last rep slowed',
      saved: 'Saved {t}', recTitle: 'My log', recSub: 'Stored on this phone only. To have me adjust the plan, tap "Copy for Claude" and paste it into our chat.',
      copy: 'Copy for Claude', exportJ: 'Export backup', importJ: 'Import backup', close: 'Close', copied: 'Copied', imported: 'Imported {n} entries',
      none: 'No entries yet. Tap "Mark done" or "Log" under any day.', nDone: 'Done', nWeek: 'Done this week', nLogged: 'Logged',
      updated: 'Plan updated'
    }
  };
  var FIELDS = ['time', 'dist', 'pace', 'hr', 'rpe', 'note'];
  var DOCS = ['detailed', 'v3'];
  var RACE = new Date(2026, 11, 11);

  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function loadLogs() { try { return JSON.parse(get('tp.logs', '{}')) || {}; } catch (e) { return {}; } }
  function saveLogs() { set('tp.logs', JSON.stringify(logs)); }
  function iso(d) { var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }

  var lang = get('tp.lang', 'zh') === 'en' ? 'en' : 'zh';
  var doc = get('tp.doc', 'detailed') === 'v3' ? 'v3' : 'detailed';
  var logs = loadLogs();
  var today = iso(new Date());
  var pager = document.getElementById('pager');
  var seg = document.getElementById('seg');
  var panes = { detailed: document.getElementById('pane-detailed'), v3: document.getElementById('pane-v3') };
  var tabs = { detailed: document.getElementById('tab-detailed'), v3: document.getElementById('tab-v3') };

  function t(k) { return T[lang][k]; }

  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }

  /* ---------- language + chrome ---------- */
  function paintChrome() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    DOCS.forEach(function (d) { tabs[d].textContent = T[lang].tabs[d]; });
    [].forEach.call(document.querySelectorAll('#lang [data-l]'), function (s) { s.className = s.dataset.l === lang ? '' : 'dim'; });
    document.title = lang === 'zh' ? 'Andy 训练计划' : "Andy's training plan";
  }

  /* ---------- pager ---------- */
  function showDoc(d, smooth) {
    doc = d; set('tp.doc', d);
    var i = DOCS.indexOf(d);
    pager.scrollTo({ left: i * pager.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    paintTabs(i);
  }
  function paintTabs(p) {
    seg.style.setProperty('--p', p);
    var i = Math.round(p);
    DOCS.forEach(function (d, j) { tabs[d].classList.toggle('on', j === i); tabs[d].setAttribute('aria-selected', j === i); });
  }
  pager.addEventListener('scroll', function () {
    var p = pager.scrollLeft / Math.max(1, pager.clientWidth);
    paintTabs(p);
    var d = DOCS[Math.round(p)];
    if (d !== doc) { doc = d; set('tp.doc', d); }
  }, { passive: true });
  DOCS.forEach(function (d) { tabs[d].addEventListener('click', function () { showDoc(d, true); }); });
  window.addEventListener('resize', function () { showDoc(doc, false); });

  /* ---------- content ---------- */
  function load(d) {
    var pane = panes[d];
    var url = 'content/' + d + '-' + lang + '.html';
    pane.innerHTML = '<div class="loading">' + t('loading') + '</div>';
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) { pane.innerHTML = html; pane.scrollTop = 0; enhance(pane, d); })
      .catch(function (err) { console.error(err); pane.innerHTML = '<div class="loading">' + t('offline') + '</div>'; });
  }
  function loadAll() { return Promise.all(DOCS.map(load)); }

  function scrollToEl(pane, el) {
    var bar = pane.querySelector('.bar');
    var off = (bar ? bar.offsetHeight : 0) + 16;
    var top = el.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop - off;
    pane.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function enhance(pane, d) {
    // in-pane anchors and links between the plans
    pane.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var h = decodeURIComponent(a.getAttribute('href').slice(1));
      e.preventDefault();
      if (h.indexOf('app:') === 0) {
        var p = h.split(':'), nd = p[1], nl = p[2];
        if (nl && nl !== lang) { lang = nl; set('tp.lang', lang); paintChrome(); loadAll().then(function () { showDoc(nd, false); }); }
        else showDoc(nd, true);
        return;
      }
      var el = h ? pane.querySelector('[id="' + h.replace(/"/g, '') + '"]') : null;
      if (el) scrollToEl(pane, el);
    });

    // section pills follow the scroll
    var links = [].slice.call(pane.querySelectorAll('.pills a[href^="#"]'));
    var map = {};
    links.forEach(function (a) { map[decodeURIComponent(a.getAttribute('href').slice(1))] = a; });
    if ('IntersectionObserver' in window && links.length) {
      var cur = null;
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var a = map[e.target.id]; if (!a || a === cur) return;
          if (cur) cur.classList.remove('on'); a.classList.add('on'); cur = a;
          var p = a.parentNode, l = a.offsetLeft - p.offsetLeft;
          if (l < p.scrollLeft || l + a.offsetWidth > p.scrollLeft + p.clientWidth) p.scrollTo({ left: l - 16, behavior: 'smooth' });
        });
      }, { root: pane, rootMargin: '-20% 0px -70% 0px' });
      pane.querySelectorAll('section.sec').forEach(function (s) { io.observe(s); });
    }

    // race countdown
    var c = pane.querySelector('#count');
    if (c) {
      var t0 = new Date(); t0 = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate());
      var n = Math.round((RACE - t0) / 86400000);
      c.textContent = n > 0 ? fmt(t('raceIn'), { n: n }) : (n === 0 ? t('raceToday') : t('raceDone'));
      c.hidden = false;
    }

    // day rows: today highlight + logging
    var rows = pane.querySelectorAll('tr.row[data-date]');
    [].forEach.call(rows, function (row) { addLog(row); });
    var row = pane.querySelector('tr.row[data-date="' + today + '"]');
    if (row) {
      row.classList.add('is-today');
      var day = row.querySelector('.c-day');
      if (day) { var b = document.createElement('span'); b.className = 'today-badge'; b.textContent = t('today'); day.appendChild(b); }
      var pills = pane.querySelector('.pills');
      if (pills) { var a = document.createElement('a'); a.href = '#' + row.id; a.className = 'pill pill-today'; a.textContent = t('today'); pills.insertBefore(a, pills.firstChild); }
      todayCard(pane, row);
    }
  }

  function sessionTitle(row) {
    var s = row.querySelector('.c-session');
    if (!s) return '';
    var c = s.cloneNode(true); var chip = c.querySelector('.chip'); if (chip) chip.remove();
    return c.textContent.trim();
  }

  function todayCard(pane, row) {
    var s = row.querySelector('.c-session');
    var card = document.createElement('div');
    card.className = 'todaycard';
    card.innerHTML = '<div class="wrap"><div class="tc-main"><div class="tc-k">' + t('todayK') + ' · ' + esc(row.querySelector('.c-day').firstChild.textContent) +
      '</div><div class="tc-t">' + (s ? s.innerHTML : '') + '</div></div><button class="go">' + t('view') + '</button></div>';
    card.querySelector('.go').addEventListener('click', function () { scrollToEl(pane, row); });
    var bar = pane.querySelector('.bar'); bar.parentNode.insertBefore(card, bar);
    row._card = card;
    paintRow(row);
  }

  /* ---------- logging ---------- */
  function entry(date) { return logs[date] || (logs[date] = {}); }
  function hasData(e) { return e && (e.done || FIELDS.some(function (f) { return e[f]; })); }

  function summary(e) {
    var bits = [];
    if (e.time) bits.push(t('fTime') + ' ' + e.time);
    if (e.dist) bits.push(e.dist + ' km');
    if (e.pace) bits.push(e.pace);
    if (e.hr) bits.push('HR ' + e.hr);
    if (e.rpe) bits.push('RPE ' + e.rpe);
    var s = bits.join(' · ');
    if (e.note) s += (s ? '\n' : '') + e.note;
    return s;
  }

  function paintRow(row) {
    var e = logs[row.dataset.date] || {};
    row.classList.toggle('is-done', !!e.done);
    var btn = row.querySelector('.done-btn');
    if (btn) { btn.setAttribute('aria-pressed', !!e.done); btn.textContent = e.done ? '✓ ' + t('done') : t('markDone'); }
    var sum = row.querySelector('.log-sum'); if (sum) sum.textContent = summary(e);
    if (row._card) row._card.classList.toggle('done', !!e.done);
  }

  function addLog(row) {
    var cell = row.querySelector('.c-details');
    if (!cell || row.classList.contains('t-rest') && !cell.textContent.trim()) return;
    var date = row.dataset.date;
    var gym = row.classList.contains('t-gym') || row.classList.contains('t-hyrox');
    var e = logs[date] || {};
    var box = document.createElement('div');
    box.className = 'log';
    function field(k, ph, cls, area) {
      var v = esc(e[k] || '');
      var input = area ? '<textarea data-f="' + k + '" placeholder="' + esc(ph) + '">' + v + '</textarea>'
        : '<input data-f="' + k + '" value="' + v + '" placeholder="' + esc(ph) + '"' + (k === 'hr' || k === 'rpe' || k === 'dist' ? ' inputmode="decimal"' : '') + '>';
      return '<label class="' + (cls || '') + '">' + t('f' + k.charAt(0).toUpperCase() + k.slice(1)) + input + '</label>';
    }
    box.innerHTML = '<div class="log-top"><button class="done-btn" type="button"></button><button class="log-toggle" type="button">' + t('log') +
      '</button><div class="log-sum"></div></div><div class="log-form">' +
      field('time', t('phTime')) + field('dist', t('phDist')) + field('pace', t('phPace'), 'full') + field('hr', t('phHr')) + field('rpe', t('phRpe')) +
      field('note', gym ? t('phNoteGym') : t('phNote'), 'full', true) + '<div class="log-saved"></div></div>';
    cell.appendChild(box);

    box.querySelector('.done-btn').addEventListener('click', function () {
      var en = entry(date); en.done = !en.done; en.title = sessionTitle(row); en.updated = Date.now();
      saveLogs(); paintRow(row);
    });
    var tog = box.querySelector('.log-toggle');
    tog.addEventListener('click', function () {
      var open = box.classList.toggle('open');
      tog.textContent = open ? t('hide') : t('log');
      if (open) { var f = box.querySelector('input'); if (f) f.focus({ preventScroll: true }); }
    });
    var savedEl = box.querySelector('.log-saved');
    box.querySelector('.log-form').addEventListener('input', function (ev) {
      var f = ev.target.dataset.f; if (!f) return;
      var en = entry(date); en[f] = ev.target.value.trim() ? ev.target.value : ''; en.title = sessionTitle(row); en.updated = Date.now();
      saveLogs(); paintRow(row);
      savedEl.textContent = fmt(t('saved'), { t: new Date().toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) });
    });
    paintRow(row);
  }

  /* ---------- records sheet ---------- */
  var sheet = document.getElementById('sheet');
  function weekStart(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x); }
  function entries() {
    return Object.keys(logs).filter(function (k) { return hasData(logs[k]); }).sort().reverse()
      .map(function (k) { return { date: k, e: logs[k] }; });
  }
  function textForClaude() {
    var list = entries().slice().reverse();
    return (lang === 'zh' ? '我的训练记录：\n' : 'My training log:\n') + list.map(function (x) {
      return x.date + (x.e.done ? ' ✓' : '') + ' ' + (x.e.title || '') + (summary(x.e) ? '\n  ' + summary(x.e).replace(/\n/g, '\n  ') : '');
    }).join('\n');
  }
  function openSheet() {
    var list = entries();
    var ws = weekStart(new Date());
    var nDone = list.filter(function (x) { return x.e.done; }).length;
    var nWeek = list.filter(function (x) { return x.e.done && x.date >= ws && x.date <= today; }).length;
    var html = '<h2 id="sheet-h">' + t('recTitle') + '</h2><p class="sub">' + t('recSub') + '</p>' +
      '<div class="stats"><div class="stat"><div class="n">' + nWeek + '</div><div class="l">' + t('nWeek') + '</div></div>' +
      '<div class="stat"><div class="n">' + nDone + '</div><div class="l">' + t('nDone') + '</div></div>' +
      '<div class="stat"><div class="n">' + list.length + '</div><div class="l">' + t('nLogged') + '</div></div></div>' +
      '<div class="sheet-actions"><button class="primary" data-a="copy">' + t('copy') + '</button><button data-a="export">' + t('exportJ') +
      '</button><label>' + t('importJ') + '<input type="file" accept="application/json,.json" hidden></label><button data-close>' + t('close') + '</button></div>';
    html += list.length ? list.map(function (x) {
      return '<div class="rec"><b>' + x.date + (x.e.done ? ' ✓' : '') + '</b> ' + esc(x.e.title || '') + '<div class="rec-t">' + esc(summary(x.e)) + '</div></div>';
    }).join('') : '<p class="sub">' + t('none') + '</p>';
    document.getElementById('sheet-body').innerHTML = html;
    sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false');
  }
  function closeSheet() { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); }
  document.getElementById('records').addEventListener('click', openSheet);
  sheet.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-close]')) return closeSheet();
    var a = ev.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'copy') {
      var txt = textForClaude();
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast(t('copied')); }, function () {
        var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); toast(t('copied')); } catch (e) { } ta.remove();
      });
    } else if (a.dataset.a === 'export') {
      var blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      var u = URL.createObjectURL(blob), l = document.createElement('a');
      l.href = u; l.download = 'training-log-' + today + '.json'; document.body.appendChild(l); l.click(); l.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
    }
  });
  sheet.addEventListener('change', function (ev) {
    var f = ev.target.files && ev.target.files[0]; if (!f) return;
    f.text().then(function (s) {
      var data = JSON.parse(s), n = 0;
      Object.keys(data).forEach(function (k) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
        var cur = logs[k];
        if (!cur || (data[k].updated || 0) > (cur.updated || 0)) { logs[k] = data[k]; n++; }
      });
      saveLogs(); closeSheet(); loadAll(); toast(fmt(t('imported'), { n: n }));
    }).catch(function () { });
  });

  /* ---------- language toggle ---------- */
  document.getElementById('lang').addEventListener('click', function () {
    lang = lang === 'zh' ? 'en' : 'zh'; set('tp.lang', lang);
    paintChrome(); loadAll();
  });

  /* ---------- service worker ---------- */
  if ('serviceWorker' in navigator) {
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      document.addEventListener('visibilitychange', function () { if (!document.hidden) reg.update(); });
    }).catch(function () { });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController) { hadController = true; return; }
      loadAll().then(function () { toast(t('updated')); });
    });
  }

  paintChrome();
  loadAll().then(function () { showDoc(doc, false); });
  showDoc(doc, false);
})();
