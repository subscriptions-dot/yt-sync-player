// ==UserScript==
// @name         YouTube Audio Delay (SyncPlay)
// @namespace    syncplay
// @version      1.0
// @description  Delay YouTube audio by 0-60s when sound runs ahead of the picture. Panel inside the player.
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(function () {
  'use strict';
  let ctx = null, delayNode = null, hooked = new WeakSet(), delay = 0;
  try { delay = parseFloat(localStorage.getItem('sp_yt_delay') || '0') || 0; } catch (e) {}

  function el(tag, css, text) { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; return e; }

  function hook(video) {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      delayNode = ctx.createDelay(60);
      delayNode.connect(ctx.destination);
    }
    if (!hooked.has(video)) {
      const src = ctx.createMediaElementSource(video);
      src.connect(delayNode);
      hooked.add(video);
    }
    if (ctx.state === 'suspended') ctx.resume();
    delayNode.delayTime.setTargetAtTime(delay, ctx.currentTime, 0.05);
  }

  function setDelay(v) {
    delay = Math.max(0, Math.min(60, Math.round(v * 10) / 10));
    try { localStorage.setItem('sp_yt_delay', delay); } catch (e) {}
    val.textContent = '+' + delay.toFixed(1) + 's';
    const v2 = document.querySelector('video'); if (v2 && delay > 0) hook(v2);
    else if (delayNode) delayNode.delayTime.setTargetAtTime(0, ctx.currentTime, 0.05);
  }

  // UI
  const box = el('div', 'position:fixed;right:12px;bottom:80px;z-index:999999;display:flex;align-items:center;gap:4px;' +
    'background:rgba(13,15,20,.88);backdrop-filter:blur(8px);border:1px solid #2a3040;border-radius:999px;padding:5px 6px;' +
    'font:600 13px system-ui,sans-serif;color:#eef1f7;box-shadow:0 4px 18px rgba(0,0,0,.4);user-select:none');
  const lab = el('span', 'padding:0 6px;color:#8b93a7;cursor:pointer', 'Audio');
  const val = el('span', 'min-width:56px;text-align:center;color:#4fd1c5;font-variant-numeric:tabular-nums', '+0.0s');
  const mk = (t, d) => { const b = el('button', 'border:0;background:#1e2330;color:#eef1f7;font:700 13px system-ui;border-radius:999px;padding:6px 9px;cursor:pointer', t); b.onclick = (e) => { e.stopPropagation(); setDelay(d === 0 ? 0 : delay + d); }; return b; };
  const parts = [mk('−1', -1), mk('−.1', -0.1), val, mk('+.1', 0.1), mk('+1', 1), mk('0', 0)];
  let open = true;
  lab.onclick = () => { open = !open; parts.forEach(p => p.style.display = open ? '' : 'none'); };
  box.append(lab, ...parts);
  (document.body || document.documentElement).appendChild(box);
  setDelay(delay);

  // re-apply on new videos / page changes
  document.addEventListener('play', (e) => { if (e.target.tagName === 'VIDEO' && delay > 0) hook(e.target); }, true);
  document.addEventListener('yt-navigate-finish', () => { const v = document.querySelector('video'); if (v && delay > 0 && !v.paused) hook(v); });
})();
