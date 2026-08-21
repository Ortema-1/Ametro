(() => {
  "use strict";

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Kept out of visible page copy and assembled at runtime to deter basic address scrapers.
  // This is not secrecy: the address is necessarily available to the visitor's browser.
  const CONTACT_EMAIL = ["le", "on", "@", "orte", "ma.co.uk"].join("");

  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = encodeURIComponent(`ORTEMA enquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nProject / question:\n${message}\n\nSent from ortema.co.uk`
    );

    if (status) status.textContent = "Opening your email app…";
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });
})();

// Small decorative star field. It is visual only and makes no network requests.
(() => {
  const host = document.querySelector('.hero');
  if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'starfield-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, raf = 0;
  let pointerX = .5, pointerY = .5;
  const stars = Array.from({ length: 54 }, (_, i) => ({
    x: (i * 0.61803398875) % 1,
    y: (i * 0.41421356237 + .13) % 1,
    r: .55 + (i % 4) * .25,
    a: .18 + (i % 5) * .075,
    depth: .25 + (i % 6) * .12
  }));
  const resize = () => {
    const rect = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, rect.width); h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const ox = (pointerX - .5) * 18;
    const oy = (pointerY - .5) * 12;
    for (const s of stars) {
      const x = s.x * w + ox * s.depth;
      const y = s.y * h + oy * s.depth;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(236,242,232,${s.a})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  };
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    pointerX = (e.clientX - r.left) / Math.max(1, r.width);
    pointerY = (e.clientY - r.top) / Math.max(1, r.height);
  }, { passive: true });
  host.addEventListener('pointerleave', () => { pointerX = .5; pointerY = .5; }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  resize(); draw();
  window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
})();
