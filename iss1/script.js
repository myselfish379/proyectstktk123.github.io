/*© Zero - Código libre no comercial
   script.js unificado y mejorado:
   - carga SVG y anima el árbol al entrar
   - máquina de escribir que convierte \n en <br>
   - cuenta regresiva
   - partículas eficientes (pétalos/corazones)
   - control de audio con autoplay muted + desmute por interacción y sincronización de icono
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

      // ANIMACIÓN DE ENTRADA: añadir clase cuando el SVG ya esté en el DOM
      container.classList.add('tree-enter');
      // forzar reflow para asegurar que la animación se ejecute
      void container.offsetWidth;

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

  /* ---------- Máquina de escribir (dedicatoria + firma) con \n -> <br> ---------- */
  function showDedicationText() {
    const container = document.getElementById('dedication-text');
    if (!container) return;
    const textParam = getURLParam('text');
    const firmaParam = getURLParam('firma');

    const defaultText = "Para el amor de mi vida:\n\nno tuvo que ser una eternidad. pero fue suficiente tiempo para darme cuenta que el amor en vida propia eras tu. con cada parte de ti, tu voz, tu sonrisa, y esos ojos que reflejan deseo... estuviste en cada momento, en cada desgracia, en cada risa, en cada sonrisa. y no hizo mas que avivar mi deseo por estar a tu lado. quizas parezca que este mundo no fue hecho para nosotros. pero a mi lado te demostrare que esta hecho para que lo hagamos nuestro. isabella";
    const text = textParam ? decodeURIComponent(textParam).slice(0, 400) : defaultText;
    const firma = firmaParam ? decodeURIComponent(firmaParam).slice(0, 100) : "Con amor, el amor de tu vida";

    // escapador simple para evitar inyección accidental
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    container.innerHTML = '';
    let i = 0;
    const full = text;
    const speed = 70;

    (function step() {
      if (i <= full.length) {
        const slice = escapeHtml(full.slice(0, i));
        // convertir saltos de línea en <br> (preserva párrafos)
        container.innerHTML = slice.replace(/\r\n|\r|\n/g, '<br>');
        i++;
        setTimeout(step, speed);
      } else {
        const sig = document.createElement('div');
        sig.className = 'signature visible';
        sig.textContent = firma;
        container.appendChild(sig);
        // signature tiene su propia animación CSS
      }
    })();
  }

  /* ---------- Objetos flotantes (fallback ligero) - se mantiene por compatibilidad ---------- */
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

    const defaultStart = new Date(2025, 2, 4);   // 2025-03-04
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

      container.innerHTML =
        `Llevamos juntos: <b>${daysTogether}</b> días<br>` +
        `Próximo aniversario: <b>${days}d ${pad2(hours)}h ${pad2(mins)}m ${pad2(secs)}s</b>`;
      container.classList.add('visible');
    }

    update();
    intervalId = setInterval(update, 1000);

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

        window.removeEventListener('pointerdown', enableSoundOnInteraction);
        window.removeEventListener('click', enableSoundOnInteraction);
        window.removeEventListener('keydown', enableSoundOnInteraction);
      }

      window.addEventListener('pointerdown', enableSoundOnInteraction, { once: true });
      window.addEventListener('click', enableSoundOnInteraction, { once: true });
      window.addEventListener('keydown', enableSoundOnInteraction, { once: true });

    }).catch(() => {
      console.warn("El navegador bloqueó autoplay incluso en mute.");
      updateButton();
    });

    // Fallback para habilitar sonido en la primer interacción si algo quedó pendiente
    function fallbackEnable() {
      try { if (audio.muted) audio.muted = false; audio.play().catch(()=>{}); }
      finally {
        updateButton();
        window.removeEventListener('pointerdown', fallbackEnable);
        window.removeEventListener('keydown', fallbackEnable);
      }
    }
    window.addEventListener('pointerdown', fallbackEnable, { once: true });
    window.addEventListener('keydown', fallbackEnable, { once: true });

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

    // iniciar partículas después de que el SVG haya cargado/animado
    if (window.__particles) {
      setTimeout(() => {
        try { window.__particles.spawnFromTreeBurst(); } catch (e) {}
        try { window.__particles.startContinuousSpawn(); } catch (e) {}
      }, 420);
    }

    // limpiar intervalos/handlers al descargar la página
    window.addEventListener('beforeunload', () => {
      if (typeof cleanupCountdown === 'function') cleanupCountdown();
      if (window.__particles && window.__particles.stopContinuousSpawn) window.__particles.stopContinuousSpawn();
      // cancelar RAF si existe
      try { if (window.__particles && window.__particles._cancelRAF) window.__particles._cancelRAF(); } catch (e) {}
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------------- PARTICULAS (pétalos/corazones) usando RAF ---------------- */
  (function(){
    // si el usuario prefiere reducir movimiento, no iniciar partículas
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      window.__particles = {
        spawnFromTreeBurst: function(){},
        startContinuousSpawn: function(){},
        stopContinuousSpawn: function(){},
        startParticleLoop: function(){}
      };
      return;
    }

    let particles = [];
    let rafId = null;
    const MAX_PARTICLES = 28;
    const FPS_INTERVAL = 1000 / 60;

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function makeParticle(x, y) {
      const el = document.createElement('div');
      const isHeart = Math.random() < 0.35; // 35% corazones, resto pétalos
      el.className = 'particle' + (isHeart ? ' heart' : '');
      el.style.position = 'absolute';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.opacity = String(rand(0.7, 1));
      const vx = rand(-0.15, 0.15) * (Math.random() < 0.5 ? -1 : 1);
      const vy = rand(0.4, 1.2);
      const spin = rand(-0.08, 0.08);
      const scale = rand(0.8, 1.25);
      el.style.transform = `translate3d(0,0,0) rotate(${rand(-200,200)}deg) scale(${scale})`;

      const p = { el, x, y, vx, vy, spin, alpha: parseFloat(el.style.opacity) || 1, life: 0, maxLife: rand(2200, 5200) };
      particles.push(p);

      const holder = document.getElementById('floating-objects') || document.body;
      holder.appendChild(el);

      // limitar cantidad
      if (particles.length > MAX_PARTICLES) {
        const removed = particles.shift();
        if (removed && removed.el && removed.el.parentNode) removed.el.parentNode.removeChild(removed.el);
      }
    }

    function stepParticles() {
      // simple loop, actualizamos transform con translate3d (GPU)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += FPS_INTERVAL;
        p.x += p.vx * (FPS_INTERVAL / 16.67);
        p.y += p.vy * (FPS_INTERVAL / 16.67);
        p.vy += 0.002 * (FPS_INTERVAL / 16.67); // pequeña aceleración por "gravedad"
        const rotation = (p.spin * p.life) || 0;
        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${rotation}deg)`;
        if (p.life > p.maxLife) {
          p.alpha -= 0.03;
          p.el.style.opacity = String(Math.max(0, p.alpha));
        }
        const rect = p.el.getBoundingClientRect();
        if (p.alpha <= 0 || rect.top > window.innerHeight + 50 || rect.left < -100 || rect.left > window.innerWidth + 100) {
          if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
          particles.splice(i,1);
        }
      }
      rafId = window.requestAnimationFrame(stepParticles);
    }

    function startParticleLoop() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(stepParticles);
    }

    function spawnFromTreeBurst() {
      const holder = document.getElementById('tree-container');
      if (!holder) return;
      const rect = holder.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.15;
      const count = Math.floor(rand(6, 12));
      for (let i = 0; i < count; i++) {
        makeParticle(cx + rand(-rect.width*0.35, rect.width*0.35), cy + rand(-rect.height*0.05, rect.height*0.08));
      }
      startParticleLoop();
    }

    let continuousTimer = null;
    function startContinuousSpawn() {
      if (continuousTimer) return;
      continuousTimer = setInterval(() => {
        const x = rand(0, window.innerWidth);
        const y = -20;
        makeParticle(x, y);
        startParticleLoop();
      }, 420);
    }

    function stopContinuousSpawn() {
      if (continuousTimer) { clearInterval(continuousTimer); continuousTimer = null; }
    }

    function cancelRAF() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    // Exponer funciones globalmente para que init() las llame y para limpieza
    window.__particles = {
      spawnFromTreeBurst,
      startContinuousSpawn,
      stopContinuousSpawn,
      startParticleLoop,
      _cancelRAF: cancelRAF
    };

  })();

})();
