/*© Zero - Código libre no comercial
   script.js unificado: carga SVG, dedicatoria, cuenta regresiva, objetos flotantes y control de audio.
*/
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  function getURLParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  function parseLocalDate(param) {
    if (!param) return null;
    const ymd = param.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), 0, 0, 0);
    const md = param.match(/^(\d{2})-(\d{2})$/);
    if (md) {
      const now = new Date();
      return new Date(now.getFullYear(), Number(md[1]) - 1, Number(md[2]), 0, 0, 0);
    }
    const d = new Date(param);
    return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  }

  /* ---------- Cargar SVG del árbol y marcar corazones ---------- */
  async function loadTreeSvg() {
    const container = document.getElementById('tree-container');
    if (!container) return;
    try {
      const res = await fetch('Img/treelove.svg');
      if (!res.ok) throw new Error('SVG no encontrado');
      const svgText = await res.text();
      container.innerHTML = svgText;
      // ANIMACIÓN DE ENTRADA PARA EL ÁRBOL
      container.classList.add("tree-enter");


      const svg = container.querySelector('svg');
      if (!svg) return;

      const candidates = new Set();
      svg.querySelectorAll('.heart, [data-heart]').forEach(el => candidates.add(el));

      svg.querySelectorAll('*').forEach(el => {
        const id = (el.id || '').toLowerCase();
        const cls = (el.getAttribute('class') || '').toLowerCase();
        const aria = (el.getAttribute('aria-label') || '').toLowerCase();
        const titleEl = el.querySelector && el.querySelector('title');
        const title = titleEl ? (titleEl.textContent || '').toLowerCase() : '';
        const fill = (el.getAttribute('fill') || '').toLowerCase();
        if (
          id.includes('heart') || id.includes('corazón') ||
          cls.includes('heart') || cls.includes('corazón') ||
          aria.includes('heart') || aria.includes('corazón') ||
          title.includes('heart') || title.includes('corazón') ||
          /#ff|#f\d|pink|red|ros|rosa/.test(fill)
        ) candidates.add(el);
      });

      candidates.forEach(el => {
        el.classList.add('animated-heart');
        void el.getBoundingClientRect(); // forzar reflow si la animación depende de ello
      });
    } catch (err) {
      console.warn('No se pudo cargar el SVG:', err);
      container.innerHTML = '<div style="text-align:center;padding:2rem;color:#900">Árbol no disponible</div>';
    }
  }

  /* ---------- Máquina de escribir (dedicatoria + firma) ---------- */
  function showDedicationText() {
    const container = document.getElementById('dedication-text');
    if (!container) return;
    const textParam = getURLParam('text');
    const firmaParam = getURLParam('firma');

    const defaultText = "Para el amor de mi vida:\n\nno fue desde un inicio. pero fue suficiente para darme cuenta que el amor en vida propia eras tu. con cada parte de ti, tu voz, tu sonrisa, esos ojitos... estuviste en cada paso, en cada desgracia, incluso en cada risa, sonrisa. y siempre desee que estuvieras a mi lado.quizas este mundo no fue hecho para nosotros. pero si para demostrarnos que lo haremos nuestro.";
    const text = textParam ? decodeURIComponent(textParam).slice(0, 400) : defaultText;
    const firma = firmaParam ? decodeURIComponent(firmaParam).slice(0, 100) : "Con amor, el amor de tu vida";

    container.textContent = '';
    let i = 0;
    const full = text;
    const speed = 30;
    (function step() {
      if (i <= full.length) {
        container.textContent = full.slice(0, i);
        i++;
        setTimeout(step, speed);
      } else {
        const sig = document.createElement('div');
        sig.className = 'signature';
        sig.textContent = firma;
        container.appendChild(sig);
        requestAnimationFrame(() => { sig.style.opacity = '1'; });
      }
    })();
  }

  /* ---------- Objetos flotantes (fallback ligero) ---------- */
  function startFloatingObjects() {
    const holder = document.getElementById('floating-objects');
    if (!holder) return;
    if (holder.dataset.init) return;
    holder.dataset.init = '1';
    for (let i = 0; i < 6; i++) {
      const el = document.createElement('div');
      el.className = 'floating-petal';
      el.style.position = 'absolute';
      el.style.left = `${10 + i * 12}%`;
      el.style.top = `${10 + (i % 3) * 6}%`;
      el.style.opacity = '0.6';
      holder.appendChild(el);
    }
  }

  /* ---------- Cuenta regresiva / días juntos ---------- */
  function showCountdown() {
    const container = document.getElementById('countdown');
    if (!container) return;

    const startParam = getURLParam('start');
    const eventParam = getURLParam('event');

    const defaultStart = new Date(2025, 8, 10);   // 2025-03-04
    const defaultEvent = new Date(2025, 8, 10);  // 2025-09-10

    let startDate = parseLocalDate(startParam) || defaultStart;
    let eventDate = parseLocalDate(eventParam) || defaultEvent;

    function advanceEventToFuture() {
      const now = new Date();
      while (eventDate <= now) {
        eventDate = new Date(eventDate.getFullYear() + 1, eventDate.getMonth(), eventDate.getDate(), 0, 0, 0);
      }
    }
    advanceEventToFuture();

    const MS = { sec: 1000, min: 60000, hour: 3600000, day: 86400000 };
    let intervalId = null;

    function pad2(n) { return String(n).padStart(2, '0'); }

    function update() {
      const now = new Date();
      const diffSinceStart = Math.max(0, now - startDate);
      const daysTogether = Math.floor(diffSinceStart / MS.day);

      let diff = eventDate - now;
      if (diff <= 0) {
        advanceEventToFuture();
        diff = eventDate - now;
      }

      const days = Math.floor(diff / MS.day);
      const hours = Math.floor((diff % MS.day) / MS.hour);
      const mins = Math.floor((diff % MS.hour) / MS.min);
      const secs = Math.floor((diff % MS.min) / MS.sec);

      // Usamos innerHTML con contenido controlado (números y fechas generadas internamente)
      container.innerHTML =
        `Llevamos juntos: <b>${daysTogether}</b> días<br>` +
        `Próximo aniversario: <b>${days}d ${pad2(hours)}h ${pad2(mins)}m ${pad2(secs)}s</b>`;
      container.classList.add('visible');
    }

    update();
    intervalId = setInterval(update, 1000);

    // devolver función de limpieza
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }

  /* ---------- Control de audio robusto ---------- */
  function initAudioControl() {
    let audio = document.getElementById('bg-music');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'bg-music';
      audio.src = 'music1.mp3';
      audio.preload = 'auto';
      document.body.appendChild(audio);
    }
    audio.loop = true;
    audio.volume = 0.7;

    let btn = document.getElementById('audio-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'audio-toggle';
      btn.className = 'audio-toggle';
      btn.setAttribute('aria-pressed', 'false');
      btn.title = 'Reproducir / Pausar música';
      btn.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path id="icon-play" d="M6 4v16l12-8z" fill="#fff"></path>
          <g id="icon-pause" style="display:none">
            <rect x="6" y="5" width="4" height="14" fill="#fff"></rect>
            <rect x="14" y="5" width="4" height="14" fill="#fff"></rect>
          </g>
        </svg>`;
      document.body.appendChild(btn);
    }

    const playIcon = btn.querySelector('#icon-play');
    const pauseGroup = btn.querySelector('#icon-pause');

    function updateButton() {
      const playing = !audio.paused && !audio.muted;
      btn.setAttribute('aria-pressed', String(playing));
      if (playIcon && pauseGroup) {
        playIcon.style.display = playing ? 'none' : 'inline';
        pauseGroup.style.display = playing ? 'inline' : 'none';
      }
    }

    btn.addEventListener('click', async () => {
      try {
        if (audio.paused) {
          audio.muted = false;
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (err) {
        console.warn('No se pudo reproducir automáticamente:', err);
        try { audio.muted = true; await audio.play(); } catch (e) { /* fallback */ }
      } finally {
        updateButton();
      }
    });

    /* AUTOPLAY GARANTIZADO CON ICONO SINCRONIZADO */
audio.muted = true;  // Garantiza autoplay incluso en móviles

audio.play().then(() => {
  // Actualiza iconos (se está reproduciendo, aunque esté muteado)
  updateButton();

  // Desmutear cuando el usuario interactúe
  function enableSoundOnInteraction() {
    audio.muted = false;
    audio.volume = 0.7;

    audio.play().catch(()=>{});  
    updateButton();

    // Remover listeners
    window.removeEventListener('pointerdown', enableSoundOnInteraction);
    window.removeEventListener('click', enableSoundOnInteraction);
    window.removeEventListener('keydown', enableSoundOnInteraction);
  }

  // Eventos que cuentan como interacción de usuario
  window.addEventListener('pointerdown', enableSoundOnInteraction, { once: true });
  window.addEventListener('click', enableSoundOnInteraction, { once: true });
  window.addEventListener('keydown', enableSoundOnInteraction, { once: true });

}).catch(() => {
  console.warn("El navegador bloqueó autoplay incluso en mute.");
  updateButton();
});

    function enableSoundOnInteraction() {
      try { if (audio.muted) audio.muted = false; audio.play().catch(()=>{}); }
      finally {
        updateButton();
        window.removeEventListener('pointerdown', enableSoundOnInteraction);
        window.removeEventListener('keydown', enableSoundOnInteraction);
      }
    }
    window.addEventListener('pointerdown', enableSoundOnInteraction, { once: true });
    window.addEventListener('keydown', enableSoundOnInteraction, { once: true });

    audio.addEventListener('play', updateButton);
    audio.addEventListener('pause', updateButton);
    audio.addEventListener('volumechange', updateButton);

    updateButton();
  }

  /* ---------- Inicialización general ---------- */
  function init() {
    loadTreeSvg();
    showDedicationText();
    startFloatingObjects();
    const cleanupCountdown = showCountdown();
    initAudioControl();

    // limpiar intervalos/handlers al descargar la página
    window.addEventListener('beforeunload', () => {
      if (typeof cleanupCountdown === 'function') cleanupCountdown();
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
