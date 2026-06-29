/* =============================================================
   HOUSEWARMING INVITATION — script.js
============================================================= */

const EVENT_CONFIG = {
  /* July = month index 6 (months are 0-based in JavaScript Date) */
  year: 2026,
  month: 6,
  day: 23,
  hour: 12,
  minute: 0,
  mapsUrl: 'https://maps.app.goo.gl/c5ddMde3hYB7X6Fq5?g_st=ic',
  endedMessage: 'The Housewarming Ceremony Has Begun',
};

/**
 * Event moment in the visitor's local timezone.
 * @returns {Date}
 */
function getEventDate() {
  return new Date(
    EVENT_CONFIG.year,
    EVENT_CONFIG.month,
    EVENT_CONFIG.day,
    EVENT_CONFIG.hour,
    EVENT_CONFIG.minute,
    0,
    0
  );
}

const pad = n => String(n).padStart(2, '0');
const rand = (a, b) => Math.random() * (b - a) + a;

const idle = window.requestIdleCallback
  ? (fn, opts) => requestIdleCallback(fn, opts)
  : (fn) => setTimeout(fn, 1);

/* -------------------------------------------------------------
   OPENING TRANSITION — lightweight fade & slide
------------------------------------------------------------- */
(function initTransition() {
  const cover      = document.getElementById('cover');
  const invitation = document.getElementById('invitation');
  const openBtn    = document.getElementById('openBtn');
  const backBtn    = document.getElementById('backBtn');
  const wrapper    = document.getElementById('wrapper');

  if (!cover || !invitation || !openBtn || !backBtn || !wrapper) return;

  const STATE = { CLOSED: 'closed', OPENING: 'opening', OPEN: 'open', CLOSING: 'closing' };
  let state = STATE.CLOSED;

  function onCoverTransitionEnd(handler) {
    const listener = (e) => {
      if (e.target !== cover || e.propertyName !== 'transform') return;
      cover.removeEventListener('transitionend', listener);
      handler();
    };
    cover.addEventListener('transitionend', listener);
  }

  function openInvitation() {
    if (state !== STATE.CLOSED) return;
    openBtn.classList.add('is-active');
    state = STATE.OPENING;

    document.body.classList.add('is-transitioning');
    wrapper.dataset.state = 'opening';

    invitation.classList.remove('hidden');
    invitation.classList.add('revealing');
    cover.classList.remove('closed');
    cover.classList.add('leaving');

    onCoverTransitionEnd(finishOpen);
  }

  function finishOpen() {
    cover.classList.remove('leaving');
    cover.classList.add('away');
    invitation.classList.replace('revealing', 'visible');
    wrapper.dataset.state = 'open';
    document.body.classList.add('invitation-open');
    document.body.classList.remove('is-transitioning');
    backBtn.classList.add('visible');
    openBtn.classList.remove('is-active');
    state = STATE.OPEN;
    invitation.scrollTop = 0;
    window.dispatchEvent(new CustomEvent('invitation:opened'));
  }

  function closeInvitation() {
    if (state !== STATE.OPEN) return;
    state = STATE.CLOSING;

    backBtn.classList.remove('visible');
    invitation.classList.replace('visible', 'hiding');
    wrapper.dataset.state = 'closing';
    document.body.classList.add('is-transitioning');
    document.body.classList.remove('invitation-open');

    cover.classList.replace('away', 'returning');

    onCoverTransitionEnd(finishClose);
  }

  function finishClose() {
    cover.classList.remove('returning');
    cover.classList.add('closed');
    invitation.classList.remove('hiding');
    invitation.classList.add('hidden');
    wrapper.dataset.state = 'closed';
    document.body.classList.remove('is-transitioning');
    state = STATE.CLOSED;
  }

  wrapper.dataset.state = 'closed';
  openBtn.addEventListener('click', openInvitation, { passive: true });
  backBtn.addEventListener('click', closeInvitation, { passive: true });

  requestAnimationFrame(() => {
    invitation.classList.add('prewarm');
    requestAnimationFrame(() => invitation.classList.remove('prewarm'));
  });
})();

/* -------------------------------------------------------------
   COUNTDOWN — real-time, local timezone
------------------------------------------------------------- */
(function initCountdown() {
  const countdownEl = document.getElementById('countdown');
  const endedEl     = document.getElementById('countdownEnded');
  const els = {
    days:  document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins:  document.getElementById('cd-mins'),
    secs:  document.getElementById('cd-secs'),
  };

  if (!els.days || !countdownEl || !endedEl) return;

  const eventTime = getEventDate().getTime();
  if (Number.isNaN(eventTime)) {
    console.error('Countdown: invalid event date in EVENT_CONFIG');
    return;
  }

  let timerId = null;

  function showEndedState() {
    countdownEl.hidden = true;
    endedEl.hidden = false;
    endedEl.textContent = EVENT_CONFIG.endedMessage;
    endedEl.classList.add('visible');
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function showCountdownState() {
    countdownEl.hidden = false;
    endedEl.hidden = true;
    endedEl.classList.remove('visible');
  }

  function tick() {
    const diff = eventTime - Date.now();

    if (diff <= 0) {
      showEndedState();
      return;
    }

    showCountdownState();

    const totalSecs = Math.floor(diff / 1000);
    const days  = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins  = Math.floor((totalSecs % 3600) / 60);
    const secs  = totalSecs % 60;

    els.days.textContent  = pad(days);
    els.hours.textContent = pad(hours);
    els.mins.textContent  = pad(mins);
    els.secs.textContent  = pad(secs);
  }

  tick();
  timerId = setInterval(tick, 1000);

  /* Refresh when invitation opens so values are current after hidden phase */
  window.addEventListener('invitation:opened', tick, { passive: true });
})();

/* -------------------------------------------------------------
   PETALS
------------------------------------------------------------- */
(function initPetals() {
  const container = document.getElementById('petals');
  if (!container) return;

  const POOL_SIZE = window.matchMedia('(max-width: 768px)').matches ? 10 : 14;
  const hues = ['petal--a', 'petal--b', 'petal--c', 'petal--d'];

  function resetPetal(petal) {
    const size = Math.round(rand(9, 16));
    petal.style.setProperty('--petal-x', rand(0, 100).toFixed(1) + '%');
    petal.style.setProperty('--petal-size', size + 'px');
    petal.style.setProperty('--petal-dur', rand(9, 15).toFixed(1) + 's');
    petal.style.setProperty('--petal-delay', rand(0, 12).toFixed(1) + 's');
    petal.style.setProperty('--petal-spin', Math.round(rand(0, 360)) + 'deg');
    petal.className = 'petal ' + hues[(Math.random() * hues.length) | 0];
  }

  for (let i = 0; i < POOL_SIZE; i++) {
    const petal = document.createElement('span');
    resetPetal(petal);
    container.appendChild(petal);
    petal.addEventListener('animationiteration', () => resetPetal(petal), { passive: true });
  }
})();

/* -------------------------------------------------------------
   QR CODE
------------------------------------------------------------- */
(function initQRCode() {
  const el = document.getElementById('qrcode');
  if (!el) return;

  function build() {
    if (typeof QRCode === 'undefined') return;
    el.innerHTML = '';
    new QRCode(el, {
      text: EVENT_CONFIG.mapsUrl,
      width: 148,
      height: 148,
      colorDark: '#3d1a0a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  }

  idle(build, { timeout: 2500 });
})();

/* -------------------------------------------------------------
   SCROLL REVEAL
------------------------------------------------------------- */
(function initScrollReveal() {
  const invitation = document.getElementById('invitation');
  if (!invitation) return;

  const targets = [
    '.arabic-bismillah-inv', '.mughal-arch', '.host-name', '.location-city',
    '.invite-text', '.home-name', '.event-day', '.event-date',
    '.event-reception-label', '.event-time', '.countdown', '.countdown-ended',
    '.dua', '.location-btn', '.qr-label', '#qrcode', '.inv-footer',
  ];

  const nodes = document.querySelectorAll(targets.join(', '));
  nodes.forEach(el => el.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    nodes.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (let i = 0, len = entries.length; i < len; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('visible');
          observer.unobserve(entries[i].target);
        }
      }
    },
    { threshold: 0.12, root: invitation }
  );

  window.addEventListener('invitation:opened', () => {
    nodes.forEach(el => observer.observe(el));
  }, { once: true, passive: true });
})();
