(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const SHOT = new URLSearchParams(location.search).has("shot");
  if (SHOT) {
    const s = document.createElement("style");
    s.textContent = "html{scroll-behavior:auto!important}*,*::before,*::after{animation:none!important;transition:none!important}.mv-rev,.hero-copy .lead,.hero-copy .role,.hero-cta,.hero-meta{opacity:1!important;translate:0 0!important}.hero-name .mask span,.mask-w i{translate:0 0!important;opacity:1!important}.lens{display:none!important}html.shot .hero,html.shot .hero-stage{min-height:880px!important;height:880px!important}";
    document.head.appendChild(s);
    document.documentElement.classList.add("shot");
  }

  const loader = $("#loader");
  const ready = () => document.body.classList.add("ready");
  if (loader) {
    const seen = SHOT || sessionStorage.getItem("pd-done");
    const done = () => {
      if (loader.classList.contains("out")) return;
      loader.classList.add("out");
      ready();
      document.removeEventListener("keydown", skip);
      setTimeout(() => loader.remove(), 1000);
    };
    const skip = () => done();
    if (seen) {
      loader.remove();
      ready();
    } else {
      const counter = $(".count", loader);
      const t0 = performance.now();
      const DUR = 2200;
      const tick = (t) => {
        if (!counter.isConnected) return;
        const p = Math.min(1, (t - t0) / DUR);
        counter.textContent = String(3 - Math.floor(p * 3));
        if (p < 1) requestAnimationFrame(tick);
        else done();
      };
      requestAnimationFrame(tick);
      loader.addEventListener("click", skip);
      document.addEventListener("keydown", skip);
      setTimeout(done, 3800);
      sessionStorage.setItem("pd-done", "1");
    }
  } else ready();

  const root = document.documentElement;
  const header = $("#head");
  let lastY = scrollY;
  const themeBoxes = () => $$(".paper, .dark, .hero, footer.wide-foot");
  let boxes = themeBoxes();
  addEventListener("resize", () => (boxes = themeBoxes()));
  const setTheme = () => {
    if (!header) return;
    let theme = root.dataset.mode === "night" ? "dark" : "light";
    if (root.dataset.mode !== "night") {
      for (const b of boxes) {
        const r = b.getBoundingClientRect();
        if (r.bottom > 96 && r.top <= 96) {
          theme = b.classList.contains("paper") || b.id === "hero" ? "light" : "dark";
          break;
        }
      }
    }
    if (header.dataset.theme !== theme) header.dataset.theme = theme;
  };
  document.addEventListener("scroll", () => {
    const y = scrollY;
    if (header) header.classList.toggle("hide", y > 140 && y > lastY);
    lastY = y;
    requestAnimationFrame(setTheme);
  }, { passive: true });
  setTheme();

  // --- Thème jour / nuit choisi par le visiteur ---
  const THEME_KEY = "pd-theme";
  const themeBtn = $("#themeToggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  const swatches = $$(".swatch");
  const savedTheme = () => {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  };
  const saveTheme = (value) => {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {}
  };
  const paintHero = (night) => {
    const heroEl = $("#hero");
    if (!heroEl) return;
    const backdrop = night ? "#171311" : "#e6ded1";
    heroEl.style.setProperty("--bd", backdrop);
    heroEl.style.setProperty("--n1", night ? "#f1ece4" : "#141210");
    heroEl.style.setProperty("--n2", night ? "#ff5a3c" : "#ff5b2e");
    heroEl.classList.toggle("dark", night);
    swatches.forEach((swatch) => {
      swatch.setAttribute("aria-pressed", String(swatch.dataset.backdrop === backdrop));
    });
  };
  const applyMode = (next, persist) => {
    const night = next === "night";
    root.dataset.mode = night ? "night" : "day";
    if (persist) saveTheme(root.dataset.mode);
    if (themeMeta) themeMeta.setAttribute("content", night ? "#171311" : "#f1ece4");
    if (themeBtn) {
      const label = night ? "Passer en mode jour" : "Passer en mode nuit";
      themeBtn.setAttribute("aria-pressed", String(night));
      themeBtn.setAttribute("aria-label", label);
      themeBtn.setAttribute("title", label);
    }
    paintHero(night);
    setTheme();
  };
  let mode = root.dataset.mode === "night" ? "night" : "day";
  applyMode(mode, false);
  themeBtn?.addEventListener("click", () => {
    mode = mode === "night" ? "day" : "night";
    applyMode(mode, true);
  });
  scheme.addEventListener?.("change", (e) => {
    if (savedTheme()) return;
    mode = e.matches ? "night" : "day";
    applyMode(mode, false);
  });
  addEventListener("storage", (e) => {
    if (e.key !== THEME_KEY) return;
    mode = e.newValue === "night" ? "night" : "day";
    applyMode(mode, false);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.16 });
  $$(".mv-rev").forEach((el) => io.observe(el));

  const splitWords = (el) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    const accents = (el.dataset.accent || "").split(",").filter(Boolean).map(Number);
    text.split(/\s+/).forEach((w, i) => {
      const mask = document.createElement("span");
      mask.className = "mask-w";
      const inner = document.createElement("i");
      inner.textContent = w;
      if (accents.includes(i)) {
        inner.classList.add("hl");
        inner.style.setProperty("--wd", `calc(${i * 0.05}s + .15s)`);
      } else {
        inner.style.setProperty("--wd", i * 0.05 + "s");
      }
      mask.appendChild(inner);
      el.appendChild(mask);
      el.appendChild(document.createTextNode(" "));
    });
    const last = el.lastChild;
    if (last && last.nodeType === 3 && last.textContent.trim() === "") last.remove();
  };
  $$("h2[data-words]").forEach(splitWords);
  const hdIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        hdIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.35 });
  $$("h2[data-words]").forEach((el) => hdIO.observe(el));
  if (SHOT) {
    $$(".mv-rev, h2[data-words]").forEach((el) => el.classList.add("in"));
    if (location.hash) setTimeout(() => $(location.hash)?.scrollIntoView({ block: "start" }), 120);
    setTimeout(() => {
      const about = $("#about");
      document.title = `shot scrollY=${Math.round(scrollY)} aboutTop=${about ? Math.round(about.offsetTop) : -1} heroH=${Math.round($("#hero").offsetHeight)} bodyH=${document.body.scrollHeight}`;
    }, 1500);
  }

  const hero = $("#hero");
  const heroName = $("#heroName");
  const heroFig = $(".hero-fig");
  if (hero) {
    hero.addEventListener("pointerenter", () => hero.classList.add("lit"));
    hero.addEventListener("pointerleave", () => hero.classList.remove("lit"));
    hero.addEventListener("pointermove", (e) => {
      hero.style.setProperty("--mx", e.clientX + "px");
      hero.style.setProperty("--my", e.clientY + "px");
    });
    let nx = 0;
    if (heroName) {
      hero.addEventListener("pointermove", (e) => {
        nx = (e.clientX / innerWidth - 0.5) * 2;
        applyPar();
      });
      const applyPar = () => {
        heroName.style.translate = `calc(-50% + ${nx * -14}px) ${Math.max(0, scrollY) * 0.22}px`;
        if (heroFig) heroFig.style.setProperty("--wpy", `${Math.max(0, scrollY) * 0.05}px`);
      };
      applyPar();
      addEventListener("scroll", applyPar, { passive: true });
    }
  }

  $$(".swatch").forEach((sw) => {
    sw.addEventListener("click", () => {
      $$(".swatch").forEach((s) => s.setAttribute("aria-pressed", "false"));
      sw.setAttribute("aria-pressed", "true");
      hero.style.setProperty("--bd", sw.dataset.backdrop);
      if (sw.dataset.n1) hero.style.setProperty("--n1", sw.dataset.n1);
      if (sw.dataset.n2) hero.style.setProperty("--n2", sw.dataset.n2);
      hero.classList.toggle("dark", sw.dataset.invert === "1");
      flash();
    });
  });

  const lightbox = $("#lightbox");
  function flash() {
    if (!lightbox) return;
    const fx = document.createElement("div");
    fx.style.cssText = "position:fixed;inset:0;background:#fff;z-index:190;opacity:0;transition:opacity .18s;pointer-events:none";
    document.body.appendChild(fx);
    requestAnimationFrame(() => {
      fx.style.opacity = "0.6";
      setTimeout(() => {
        fx.style.opacity = "0";
        setTimeout(() => fx.remove(), 260);
      }, 60);
    });
  }

  const strip = $("#filmstrip");
  const shot = $("#workShot");
  const shotImg = $("#shotImg");
  const projects = [
    {
      frame: "01A",
      title: "Northline Commercial",
      kind: "Web · Commercial",
      role: "Front-end",
      client: "Northline",
      year: "2026",
      tags: ["React", "Tailwind", "Vite", "Responsive"],
      shot: "public/northline-shot.webp",
      thumb: "public/northline-thumb.webp",
      alt: "Aperçu du site Northline Commercial",
      seed: "northline",
      url: "https://northline-commercial-umber.vercel.app/"
    },
    {
      frame: "02A",
      title: "ZeroRang",
      kind: "Web · Application",
      role: "Front-end",
      client: "ZeroRang",
      year: "2026",
      tags: ["React", "UI", "API", "Git"],
      shot: "public/zerorang-shot.webp",
      thumb: "public/zerorang-thumb.webp",
      alt: "Aperçu de l'application ZeroRang",
      seed: "zerorang",
      url: "https://zerorang.online/"
    }
  ];

  let current = -1;
  if (strip && shot && projects.length) {
    strip.innerHTML = projects.map((p, i) => `
      <div class="strip-row${i === 0 ? " active" : ""}" role="button" aria-label="Sélectionner le projet ${p.title}" tabindex="0" data-i="${i}">
        <span class="lbl l">${p.frame}</span>
        <div class="strip-frame">
          <img src="${p.thumb}" alt="${p.title}" loading="lazy"
               onerror="this.onerror=null;this.src='https://picsum.photos/seed/${p.seed}/560/700.jpg?grayscale'">
        </div>
        <span class="lbl r">PD 400TX ${i + 2}</span>
        <svg class="ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <ellipse cx="50" cy="50" rx="45" ry="42" pathLength="100" />
        </svg>
      </div>`).join("");

    const rows = $$(".strip-row", strip);
    const updateTags = (p) => {
      const box = $("#metaTags");
      if (box) box.innerHTML = p.tags.map((t) => `<span class="pill">${t}</span>`).join("");
    };
    const select = (i) => {
      if (i === current) return;
      current = i;
      const p = projects[i];
      rows.forEach((r, k) => r.classList.toggle("active", k === i));
      const img = new Image();
      img.onerror = () => swap(`https://picsum.photos/seed/${p.seed}/1600/900.jpg?grayscale`);
      img.onload = () => swap(p.shot);
      img.src = p.shot;
      function swap(src) {
        shotImg.classList.add("leaving");
        setTimeout(() => {
          shotImg.src = src;
          shotImg.alt = p.alt;
          shotImg.classList.remove("leaving");
          flash();
        }, 240);
      }
      $("#frameTag").textContent = p.frame;
      $("#tagInside").textContent = p.frame;
      $("#frameKind").textContent = p.kind;
      $("#metaRole").textContent = p.role;
      $("#metaClient").textContent = p.client;
      $("#metaYear").textContent = p.year;
      const workLink = $("#workLink");
      if (workLink) {
        workLink.href = p.url;
        workLink.setAttribute("aria-label", `Ouvrir le site ${p.title} dans un nouvel onglet`);
      }
      updateTags(p);
      const counter = $("#sheetNum");
      counter.innerHTML = `${String(i + 1).padStart(2, "0")}<span class="counter-o"> / ${String(projects.length).padStart(2, "0")}</span>`;
      counter.style.animation = "none";
      requestAnimationFrame(() => {
        counter.style.animation = "mvnum .6s var(--ease-spring)";
      });
    };
    rows.forEach((r) => {
      const go = () => select(+r.dataset.i);
      r.addEventListener("click", go);
      r.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      });
    });
    current = -1;
    const style = document.createElement("style");
    style.textContent = "@keyframes mvnum{0%{translate:0 40%;opacity:.0}100%{translate:0 0;opacity:1}}";
    document.head.appendChild(style);

    let fallbackTried = false;
    shotImg.addEventListener("error", () => {
      if (fallbackTried) return;
      fallbackTried = true;
      const p = projects[Math.max(0, current)];
      shotImg.src = `https://picsum.photos/seed/${p.seed}/1600/900.jpg?grayscale`;
      setTimeout(() => (fallbackTried = false), 800);
    });
  }

  const lens = $("#lens");
  if (lens && strip) {
    const hideLens = () => lens.classList.remove("on");
    strip.addEventListener("pointermove", (e) => {
      const img = e.target.closest(".strip-frame img");
      if (!img) return hideLens();
      const r = img.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return hideLens();
      const size = lens.offsetWidth || 160;
      const zoom = 2.35;
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
      lens.style.backgroundSize = `${r.width * zoom}px ${r.height * zoom}px`;
      lens.style.backgroundPosition = `${-(x * zoom - size / 2)}px ${-(y * zoom - size / 2)}px`;
      lens.style.left = `${e.clientX}px`;
      lens.style.top = `${e.clientY}px`;
      lens.classList.add("on");
    });
    strip.addEventListener("pointerleave", hideLens);
    strip.addEventListener("scroll", hideLens, { passive: true });
  }

  if (shot && lightbox) {
    const openLB = () => {
      const p = projects[Math.max(0, current)];
      const probe = new Image();
      probe.onload = () => $("#lbImg").src = p.shot;
      probe.onerror = () => $("#lbImg").src = `https://picsum.photos/seed/${p.seed}/1600/900.jpg?grayscale`;
      probe.src = p.shot;
      $("#lbTitle").textContent = p.title;
      $("#lbKind").textContent = `${p.kind} · ${p.year}`;
      const lbLink = $("#lbLink");
      if (lbLink) lbLink.href = p.url;
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const closeLB = () => {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    shot.addEventListener("click", openLB);
    shot.addEventListener("keydown", (e) => {
      if (e.key === "Enter") openLB();
    });
    $(".close", lightbox).addEventListener("click", closeLB);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLB();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLB();
    });
  }

  const magnetize = (el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      el.style.translate = `${x * 7}px ${y * 10}px`;
    });
    el.addEventListener("pointerleave", () => (el.style.translate = "0 0"));
    el.addEventListener("pointerdown", () => (el.style.scale = "0.96"));
    el.addEventListener("pointerup", () => (el.style.scale = "1"));
  };
  $$(".btn, .head-cta, .totop").forEach(magnetize);

  const copyBtn = $(".copy");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const txt = copyBtn.dataset.value;
      try {
        await navigator.clipboard.writeText(txt);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      const old = copyBtn.textContent;
      copyBtn.textContent = "Copié";
      copyBtn.style.color = "var(--green)";
      setTimeout(() => {
        copyBtn.textContent = old;
        copyBtn.style.color = "";
      }, 1600);
    });
  }

  const clock = $$(".clock");
  if (clock.length) {
    const fmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Abidjan", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const tickClock = () => (clock.forEach((c) => (c.textContent = fmt.format(new Date()).replace(",", ""))));
    tickClock();
    setInterval(tickClock, 1000);
  }

  const slate = $(".slate");
  const take = $("#take");
  if (slate && take) {
    let n = 1;
    const clapFn = () => {
      slate.classList.add("clap");
      setTimeout(() => slate.classList.remove("clap"), 280);
      n += 1;
      take.textContent = n;
    };
    slate.addEventListener("click", clapFn);
    slate.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        clapFn();
      }
    });
  }

  const menuBtn = $("#menuToggle");
  const nav = $("#mainNav");
  if (menuBtn && nav) {
    const setMenu = (open) => {
      nav.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    };
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMenu(!nav.classList.contains("open"));
    });
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("click", (e) => {
      if (nav.classList.contains("open") && !nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
    addEventListener("resize", () => {
      if (innerWidth > 1099) setMenu(false);
    });
  }

  $("#totop")?.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
})();

(function(){
  const card = document.getElementById('orbitCard');
  if(!card) return;

  // petit générateur pseudo-aléatoire fixe (les points ne bougent pas au rechargement)
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function dots(id, n, rMin, rMax, sMin, sMax, color, cyan){
    const ring = document.getElementById(id);
    for(let i = 0; i < n; i++){
      const d = document.createElement('i');
      d.className = 'orbit-dot' + (cyan ? ' orbit-dot--cyan' : '');
      d.style.setProperty('--a', (i / n * 360 + rnd() * 6) + 'deg');
      d.style.setProperty('--r', rMin + rnd() * (rMax - rMin));
      d.style.setProperty('--s', sMin + rnd() * (sMax - sMin));
      d.style.setProperty('--c', color);
      ring.appendChild(d);
    }
  }
  dots('ringGray1', 96, 47,   47.5, .5, .8,  'rgba(255,255,255,.22)');
  dots('ringGray2', 72, 43,   43.5, .5, .8,  'rgba(255,255,255,.16)');
  dots('ringCyan1', 12, 40,   47,   1.6, 2.4, '#22d3ee', true);
  dots('ringCyan2', 10, 41,   46,   1.4, 2.2, '#22d3ee', true);

  const probe = document.createElement('i');
  probe.className = 'orbit-probe';
  probe.style.setProperty('--a', '200deg');
  probe.style.setProperty('--r', '42');
  document.getElementById('ringProbe').appendChild(probe);

  document.querySelectorAll('.orbit-ring').forEach(r => {
    r.style.animationDuration = r.dataset.spin + 's';
  });

  // parallaxe léger au survol
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    card.addEventListener('mousemove', e => {
      const b = card.getBoundingClientRect();
      card.style.setProperty('--px', ((e.clientX - b.left) / b.width - .5).toFixed(3));
      card.style.setProperty('--py', ((e.clientY - b.top) / b.height - .5).toFixed(3));
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--px', 0);
      card.style.setProperty('--py', 0);
    });
  }
})();
