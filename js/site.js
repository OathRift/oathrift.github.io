// Oath Rift Online website. One small script for every page; each block
// only runs when its markup is present, and every page still reads fine
// without JavaScript.
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Images that fail to load (art still being rendered) hide instead of
  // showing a broken icon; containers keep their styled fallback.
  function hideBroken(img) { img.classList.add("missing"); img.style.display = "none"; }
  document.addEventListener("error", function (e) {
    if (e.target.tagName === "IMG") hideBroken(e.target);
  }, true);
  Array.prototype.forEach.call(document.images, function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) hideBroken(img);
  });

  // Active nav link.
  var page = location.pathname.split("/").pop() || "index.html";
  var inNews = /\/news(\.html|\/)/.test(location.pathname);
  document.querySelectorAll(".nav a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === page || (inNews && /news\.html$/.test(href))) a.setAttribute("aria-current", "page");
  });

  // The next release: the banner counts down to it, and until then <html> carries
  // data-upcoming so css/site.css shows that version's pills (hidden otherwise).
  var RELEASE = {
    version: "0.1.6",
    at: Date.parse("2026-11-06T07:00:00+08:00"),
    when: "6 November, 7am AWST",
    announcement: "/news/announcement-0.1.6.html",
    released: "/news/patch-notes.html"
  };
  if (Date.now() < RELEASE.at) doc.setAttribute("data-upcoming", RELEASE.version);
  var siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    var banner = document.createElement("aside");
    banner.className = "release-banner";
    banner.setAttribute("aria-label", "Version " + RELEASE.version + " release");
    banner.innerHTML = '<a class="container" href="' + RELEASE.announcement + '">' +
      '<span class="release-title">Version ' + RELEASE.version + ' arrives in</span>' +
      '<span class="release-count" role="timer">' +
      '<span><b data-unit="d">00</b>d</span><span><b data-unit="h">00</b>h</span>' +
      '<span><b data-unit="m">00</b>m</span><span><b data-unit="s">00</b>s</span></span>' +
      '<span class="release-when">' + RELEASE.when + '</span></a>';
    siteHeader.parentNode.insertBefore(banner, siteHeader);
    var units = {};
    banner.querySelectorAll("[data-unit]").forEach(function (b) { units[b.getAttribute("data-unit")] = b; });
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var countdown;
    var tickRelease = function () {
      var left = Math.ceil((RELEASE.at - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(countdown);
        doc.removeAttribute("data-upcoming");
        banner.classList.add("released");
        banner.querySelector("a").setAttribute("href", RELEASE.released);
        banner.querySelector(".release-title").textContent = "Current Version: " + RELEASE.version;
        banner.querySelector(".release-when").textContent = "Read the patch notes";
        return;
      }
      units.d.textContent = pad(Math.floor(left / 86400));
      units.h.textContent = pad(Math.floor(left / 3600) % 24);
      units.m.textContent = pad(Math.floor(left / 60) % 60);
      units.s.textContent = pad(left % 60);
    };
    countdown = setInterval(tickRelease, 1000);
    tickRelease();
  }

  // Mobile nav.
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Tabs. A tab's aria-controls names its panel; #panel-id in the URL opens it.
  function selectTab(tab, updateHash) {
    var list = tab.closest("[role=tablist]");
    list.querySelectorAll("[role=tab]").forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (updateHash && history.replaceState) history.replaceState(null, "", "#" + tab.getAttribute("aria-controls"));
    drawTrees();
  }
  document.querySelectorAll("[role=tablist]").forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role=tab]"));
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { selectTab(tab, true); });
      tab.addEventListener("keydown", function (e) {
        var step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        var next = tabs[(i + step + tabs.length) % tabs.length];
        next.focus();
        selectTab(next, true);
      });
    });
    var fromHash = location.hash && list.querySelector('[aria-controls="' + location.hash.slice(1) + '"]');
    selectTab(fromHash || tabs[0], false);
  });

  // Skill tree connectors: a line from each node to its data-parent.
  function drawTrees() {
    document.querySelectorAll(".tree-map").forEach(function (map) {
      if (!map.offsetParent) return;
      var svg = map.querySelector("svg");
      if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        map.insertBefore(svg, map.firstChild);
      }
      var box = map.getBoundingClientRect();
      var lines = "";
      map.querySelectorAll(".node[data-parent]").forEach(function (node) {
        var parent = map.querySelector('.node[data-id="' + node.getAttribute("data-parent") + '"]');
        if (!parent) return;
        var a = parent.querySelector("img, .glyph").getBoundingClientRect();
        var b = node.querySelector("img, .glyph").getBoundingClientRect();
        lines += '<line x1="' + (a.left + a.width / 2 - box.left) + '" y1="' + (a.top + a.height / 2 - box.top) +
          '" x2="' + (b.left + b.width / 2 - box.left) + '" y2="' + (b.top + b.height / 2 - box.top) + '"/>';
      });
      svg.innerHTML = lines;
    });
  }
  var resizeTimer;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawTrees, 120); });
  window.addEventListener("load", drawTrees);
  drawTrees();

  // Clicking a tree node jumps to and highlights its card.
  document.querySelectorAll(".node[data-card]").forEach(function (node) {
    node.addEventListener("click", function () {
      var card = document.getElementById(node.getAttribute("data-card"));
      if (!card) return;
      card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      card.classList.remove("flash");
      void card.offsetWidth;
      card.classList.add("flash");
      setTimeout(function () { card.classList.remove("flash"); }, 1800);
    });
  });

  // Bestiary filters: one active chip per group, cards match every group.
  var grid = document.querySelector("[data-filter-target]");
  if (grid) {
    var active = {};
    var empty = document.querySelector(".empty-note");
    document.querySelectorAll(".chip[data-group]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var group = chip.getAttribute("data-group");
        document.querySelectorAll('.chip[data-group="' + group + '"]').forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        active[group] = chip.getAttribute("data-value");
        var shown = 0;
        grid.querySelectorAll("[data-zone]").forEach(function (card) {
          var ok = Object.keys(active).every(function (g) {
            return active[g] === "all" || (card.getAttribute("data-" + g) || "").split(" ").indexOf(active[g]) >= 0;
          });
          card.hidden = !ok;
          if (ok) shown++;
        });
        if (empty) empty.classList.toggle("show", shown === 0);
      });
    });
  }

  // World map: a continent's outline, pin or picker link shows its profile
  // and hides the others. Without JavaScript every profile shows and the
  // links jump to it.
  var atlas = document.querySelector(".atlas");
  if (atlas) {
    var profiles = atlas.querySelectorAll(".continent");
    var triggers = atlas.querySelectorAll('a[href^="#continent-"]');
    var showContinent = function (id) {
      profiles.forEach(function (p) { p.hidden = p.id !== id; });
      triggers.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        a.classList.toggle("active", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    };
    triggers.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var id = a.getAttribute("href").slice(1);
        showContinent(id);
        if (history.replaceState) history.replaceState(null, "", "#" + id);
        var profile = document.getElementById(id);
        if (profile.getBoundingClientRect().top > window.innerHeight * 0.75) {
          profile.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
        }
      });
    });
    var start = document.getElementById(location.hash.slice(1));
    showContinent(start && start.classList.contains("continent") ? start.id : profiles[0].id);
  }

  // Lightbox for manga panels, storyboards and anything marked .zoomable.
  var zoomables = document.querySelectorAll(".manga img, img.zoomable, .set-card .pieces img");
  if (zoomables.length) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.innerHTML = '<figure style="margin:0"><img alt=""><p></p></figure>';
    document.body.appendChild(box);
    var big = box.querySelector("img"), caption = box.querySelector("p");
    var close = function () { box.classList.remove("open"); };
    box.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    zoomables.forEach(function (img) {
      img.tabIndex = 0;
      var open = function () {
        big.src = img.getAttribute("data-full") || img.currentSrc || img.src;
        big.alt = img.alt;
        caption.textContent = img.getAttribute("title") || img.alt || "";
        box.classList.add("open");
      };
      img.addEventListener("click", open);
      img.addEventListener("keydown", function (e) { if (e.key === "Enter") open(); });
    });
  }

  // Reveal on scroll.
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // Hero motes: gold (celestial) and violet (rift) sparks drifting upward.
  var canvas = document.getElementById("motes");
  if (canvas && !reduceMotion && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var motes = [], w = 0, h = 0, running = true;
    var resize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    var spawn = function (anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 10,
        r: 0.6 + Math.random() * 2.2,
        vy: 0.15 + Math.random() * 0.5,
        sway: Math.random() * Math.PI * 2,
        violet: Math.random() < 0.4,
        life: 0.4 + Math.random() * 0.6
      };
    };
    resize();
    for (var i = 0; i < 70; i++) motes.push(spawn(true));
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(tick);
    });
    var tick = function (t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var j = 0; j < motes.length; j++) {
        var m = motes[j];
        m.y -= m.vy;
        m.x += Math.sin(t / 1600 + m.sway) * 0.25;
        if (m.y < -10) motes[j] = m = spawn(false);
        var a = m.life * (0.5 + 0.5 * Math.sin(t / 700 + m.sway));
        ctx.beginPath();
        ctx.fillStyle = m.violet ? "rgba(190,130,255," + a + ")" : "rgba(255,226,150," + a + ")";
        ctx.shadowColor = m.violet ? "#b067ff" : "#f6e3a6";
        ctx.shadowBlur = 8;
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
