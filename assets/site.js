(() => {
  "use strict";

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const contactEmail = ["le", "on", "@", "orte", "ma.co.uk"].join("");
  document.querySelectorAll("[data-contact]").forEach((link) => {
    link.href = `mailto:${contactEmail}`;
  });

  const menu = document.getElementById("menu-overlay");
  const openButton = document.getElementById("menu-button");
  const closeButton = document.getElementById("menu-close");

  function setMenu(open) {
    if (!menu || !openButton) return;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    openButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  }

  openButton?.addEventListener("click", () => setMenu(true));
  closeButton?.addEventListener("click", () => setMenu(false));

  menu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  const slides = [
    ["USEFUL", "TECHNOLOGY"],
    ["IDEAS", "MADE REAL"],
    ["BUILT", "TO WORK"]
  ];

  const heroLine = document.getElementById("hero-line");
  const dots = Array.from(document.querySelectorAll("[data-slide]"));
  const indexCurrent = document.getElementById("hero-index-current");
  const dotsWrap = document.getElementById("hero-dots");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let slideIndex = 0;
  let slideTimer = null;

  function showSlide(nextIndex, userTriggered = false) {
    if (!heroLine) return;

    const safeIndex =
      ((nextIndex % slides.length) + slides.length) % slides.length;

    const apply = () => {
      slideIndex = safeIndex;
      const [strong, light] = slides[slideIndex];

      heroLine.innerHTML =
        `<strong>${strong}</strong><span>${light}</span>`;

      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === slideIndex);
      });

      if (indexCurrent) {
        indexCurrent.textContent =
          String(slideIndex + 1).padStart(2, "0");
      }

      if (dotsWrap) {
        dotsWrap.setAttribute(
          "aria-label",
          `Message ${slideIndex + 1} of ${slides.length}`
        );
      }

      requestAnimationFrame(() => {
        heroLine.classList.remove("is-changing");
      });
    };

    if (reduceMotion) {
      apply();
    } else {
      heroLine.classList.add("is-changing");
      window.setTimeout(apply, 270);
    }

    if (userTriggered) restartRotation();
  }

  function restartRotation() {
    if (slideTimer) window.clearInterval(slideTimer);

    if (!reduceMotion) {
      slideTimer = window.setInterval(() => {
        showSlide(slideIndex + 1);
      }, 5200);
    }
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => showSlide(i, true));
  });

  restartRotation();

  const hero = document.querySelector(".hero");

  if (hero) {
    let targetNearX = 0;
    let targetNearY = 0;
    let targetFarX = 0;
    let targetFarY = 0;
    let targetShiftX = 0;
    let targetShiftY = 0;

    let nearX = 0;
    let nearY = 0;
    let farX = 0;
    let farY = 0;
    let shiftX = 0;
    let shiftY = 0;

    let shadowRaf = 0;

    function animateShadows() {
      // Shadows have a tiny amount of inertia; the light itself does not.
      nearX += (targetNearX - nearX) * .18;
      nearY += (targetNearY - nearY) * .18;
      farX += (targetFarX - farX) * .12;
      farY += (targetFarY - farY) * .12;
      shiftX += (targetShiftX - shiftX) * .12;
      shiftY += (targetShiftY - shiftY) * .12;

      hero.style.setProperty("--shadow-near-x", `${nearX.toFixed(2)}px`);
      hero.style.setProperty("--shadow-near-y", `${nearY.toFixed(2)}px`);
      hero.style.setProperty("--shadow-far-x", `${farX.toFixed(2)}px`);
      hero.style.setProperty("--shadow-far-y", `${farY.toFixed(2)}px`);
      hero.style.setProperty("--emblem-shift-x", `${shiftX.toFixed(2)}px`);
      hero.style.setProperty("--emblem-shift-y", `${shiftY.toFixed(2)}px`);

      shadowRaf = requestAnimationFrame(animateShadows);
    }

    function updateLight(event) {
      const rect = hero.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Light is locked exactly to the pointer.
      hero.style.setProperty("--torch-x", `${x}px`);
      hero.style.setProperty("--torch-y", `${y}px`);
      hero.style.setProperty("--torch-opacity", "1");
      hero.classList.add("is-lit");

      const cx = rect.width * .5;
      const cy = rect.height * .5;

      // Shadow direction is from the light through the raised emblem.
      const dx = cx - x;
      const dy = cy - y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / distance;
      const ny = dy / distance;

      const span = Math.max(1, Math.min(rect.width, rect.height));
      const strength = Math.min(1, distance / (span * .62));

      const nearLength = 18 + 42 * strength;
      const farLength = 38 + 96 * strength;

      targetNearX = nx * nearLength;
      targetNearY = ny * nearLength;
      targetFarX = nx * farLength;
      targetFarY = ny * farLength;

      // Barely perceptible depth/parallax in the opposite direction.
      targetShiftX = -nx * (1.5 + 2.5 * strength);
      targetShiftY = -ny * (1.5 + 2.5 * strength);
    }

    hero.addEventListener("pointerenter", updateLight, { passive: true });
    hero.addEventListener("pointermove", updateLight, { passive: true });

    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--torch-opacity", "0");
      hero.classList.remove("is-lit");
      targetNearX = 0;
      targetNearY = 0;
      targetFarX = 0;
      targetFarY = 0;
      targetShiftX = 0;
      targetShiftY = 0;
    }, { passive: true });

    if (!reduceMotion) {
      shadowRaf = requestAnimationFrame(animateShadows);
    }

    window.addEventListener("pagehide", () => {
      if (shadowRaf) cancelAnimationFrame(shadowRaf);
      if (slideTimer) clearInterval(slideTimer);
    }, { once: true });
  }
})();
