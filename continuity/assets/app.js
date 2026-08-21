(() => {
  "use strict";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const formatMoney = (value, currency = "GBP") => {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(value);
  };

  const daysUntil = (dateString) => {
    if (!dateString) return null;
    const target = new Date(`${dateString}T12:00:00`);
    const now = new Date();
    const ms = target.getTime() - now.getTime();
    return Math.ceil(ms / 86400000);
  };

  const formatEnteredDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  };

  const impactState = {
    calculated: false,
    oldCost: null,
    newCost: null,
    delta: null,
    pct: null,
    renewalDate: "",
    days: null
  };

  const checkRows = qsa("[data-continuity-check]");
  const checkSummary = qs("#check-summary");

  const getCheckState = () => {
    const verified = checkRows.filter((item) => item.checked);
    const unresolved = checkRows.filter((item) => !item.checked);
    return { verified, unresolved };
  };

  const getCheckLabel = (item) => {
    const label = item.closest(".check-row");
    return qs("strong", label)?.textContent.trim() || "Unresolved item";
  };

  const updateEvidenceBrief = () => {
    const quote = qs("#brief-quote-change");
    const renewal = qs("#brief-renewal");
    const checks = qs("#brief-checks");
    const unresolvedCount = qs("#brief-unresolved");
    const unresolvedList = qs("#brief-unresolved-list");

    if (quote) {
      if (impactState.calculated) {
        const pctText = impactState.pct === null
          ? "percentage N/A"
          : `${impactState.pct >= 0 ? "+" : ""}${impactState.pct.toFixed(0)}%`;
        const deltaText = `${impactState.delta >= 0 ? "+" : "−"}${formatMoney(Math.abs(impactState.delta))} per year`;
        quote.textContent = `${formatMoney(impactState.oldCost)} → ${formatMoney(impactState.newCost)} (${pctText}; ${deltaText})`;
      } else {
        quote.textContent = "Not calculated";
      }
    }

    if (renewal) {
      if (!impactState.renewalDate) {
        renewal.textContent = "Not entered";
      } else {
        const dateText = formatEnteredDate(impactState.renewalDate);
        const timing = impactState.days < 0
          ? `${Math.abs(impactState.days)} days ago`
          : impactState.days === 0
            ? "today"
            : `${impactState.days} days away`;
        renewal.textContent = `${dateText} (${timing})`;
      }
    }

    if (checkRows.length) {
      const state = getCheckState();
      if (checks) checks.textContent = `${state.verified.length} of ${checkRows.length}`;
      if (unresolvedCount) unresolvedCount.textContent = String(state.unresolved.length);
      if (unresolvedList) {
        unresolvedList.innerHTML = "";
        if (!state.unresolved.length) {
          const li = document.createElement("li");
          li.textContent = "No checklist items are currently marked unresolved.";
          unresolvedList.appendChild(li);
        } else {
          state.unresolved.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = getCheckLabel(item);
            unresolvedList.appendChild(li);
          });
        }
      }
    }
  };

  const impactForm = qs("#impact-form");
  if (impactForm) {
    impactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const oldCost = Number(qs("#old-cost").value);
      const newCost = Number(qs("#new-cost").value);
      const renewalDate = qs("#renewal-date").value;
      const result = qs("#impact-result");

      if (!(oldCost >= 0) || !(newCost > 0)) return;

      const delta = newCost - oldCost;
      const pct = oldCost > 0 ? (delta / oldCost) * 100 : null;
      const threeYear = delta * 3;
      const days = daysUntil(renewalDate);

      impactState.calculated = true;
      impactState.oldCost = oldCost;
      impactState.newCost = newCost;
      impactState.delta = delta;
      impactState.pct = pct;
      impactState.renewalDate = renewalDate;
      impactState.days = days;

      qs("#metric-change").textContent = pct === null ? "N/A" : `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
      qs("#metric-one-year").textContent = `${delta >= 0 ? "+" : "−"}${formatMoney(Math.abs(delta))}`;
      qs("#metric-three-year").textContent = `${threeYear >= 0 ? "+" : "−"}${formatMoney(Math.abs(threeYear))}`;
      qs("#metric-renewal").textContent = days === null ? "Not entered" : days < 0 ? `${Math.abs(days)} days ago` : `${days} days`;

      updateEvidenceBrief();
      result.classList.add("visible");
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const updateChecks = () => {
    if (!checkRows.length) return;
    const state = getCheckState();
    if (checkSummary) {
      checkSummary.textContent = `${state.verified.length} of ${checkRows.length} questions marked as verified. ${state.unresolved.length} remain unresolved.`;
    }
    updateEvidenceBrief();
  };
  checkRows.forEach((item) => item.addEventListener("change", updateChecks));
  updateChecks();

  const copyBrief = qs("#copy-brief");
  if (copyBrief) {
    copyBrief.addEventListener("click", async () => {
      const title = document.title.replace(" | Ortema Continuity", "");
      const status = qs("[data-incident-status]")?.textContent.trim() || "";
      const updated = qs("[data-last-verified]")?.textContent.trim() || "";
      const summary = qs("[data-incident-summary]")?.textContent.trim() || "";
      const text = `${title}\n${status}\n${updated}\n\n${summary}\n\nSource dossier: ${location.href}`;
      try {
        await navigator.clipboard.writeText(text);
        copyBrief.textContent = "Copied";
        setTimeout(() => (copyBrief.textContent = "Copy incident brief"), 1800);
      } catch (_) {
        copyBrief.textContent = "Copy unavailable";
      }
    });
  }

  const printBrief = qs("#print-brief");
  if (printBrief) {
    printBrief.addEventListener("click", () => {
      updateEvidenceBrief();
      document.body.classList.add("print-evidence-mode");
      window.print();
    });
    window.addEventListener("afterprint", () => {
      document.body.classList.remove("print-evidence-mode");
    });
  }

  const printPage = qs("#print-page");
  if (printPage) {
    printPage.addEventListener("click", () => window.print());
  }

  const copyEvidenceBrief = qs("#copy-evidence-brief");
  if (copyEvidenceBrief) {
    copyEvidenceBrief.addEventListener("click", async () => {
      updateEvidenceBrief();
      const brief = qs("#evidence-brief");
      if (!brief) return;
      const text = brief.innerText.replace(/\n{3,}/g, "\n\n").trim();
      try {
        await navigator.clipboard.writeText(text);
        copyEvidenceBrief.textContent = "Copied";
        setTimeout(() => (copyEvidenceBrief.textContent = "Copy text brief"), 1800);
      } catch (_) {
        copyEvidenceBrief.textContent = "Copy unavailable";
      }
    });
  }
})();

// Shared ORTEMA star field: restrained, decorative, local-only.
(() => {
  const host = document.querySelector('.hero');
  if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'starfield-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, raf = 0, pointerX = .5, pointerY = .5;
  const stars = Array.from({ length: 48 }, (_, i) => ({
    x: (i * 0.61803398875 + .07) % 1,
    y: (i * 0.41421356237 + .19) % 1,
    r: .5 + (i % 4) * .24,
    a: .16 + (i % 5) * .07,
    depth: .24 + (i % 6) * .11
  }));
  const resize = () => {
    const rect = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, rect.width); h = Math.max(1, rect.height);
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  const draw = () => {
    ctx.clearRect(0,0,w,h);
    const ox=(pointerX-.5)*16, oy=(pointerY-.5)*10;
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x*w + ox*s.depth, s.y*h + oy*s.depth, s.r, 0, Math.PI*2);
      ctx.fillStyle=`rgba(236,242,232,${s.a})`;
      ctx.fill();
    }
    raf=requestAnimationFrame(draw);
  };
  host.addEventListener('pointermove', e => {
    const r=host.getBoundingClientRect();
    pointerX=(e.clientX-r.left)/Math.max(1,r.width);
    pointerY=(e.clientY-r.top)/Math.max(1,r.height);
  }, {passive:true});
  host.addEventListener('pointerleave', () => { pointerX=.5; pointerY=.5; }, {passive:true});
  window.addEventListener('resize', resize, {passive:true});
  resize(); draw();
  window.addEventListener('pagehide', () => cancelAnimationFrame(raf), {once:true});
})();
