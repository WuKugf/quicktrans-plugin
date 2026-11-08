/* ============================================================
   快译译 · QuickTrans 官网交互
   纯原生 JS，无依赖、无构建，所有状态保存在 localStorage
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var root = document.documentElement;

  /* ---------------- 载入进度 ---------------- */
  var loader = document.getElementById("loader");
  var lbar = document.getElementById("lbar");
  var lnum = document.getElementById("lnum");
  var val = 0;

  function tick() {
    val += Math.max(1, Math.round((100 - val) * 0.12));
    if (val > 100) val = 100;
    lbar.style.transform = "scaleX(" + val / 100 + ")";
    lnum.textContent = String(val).padStart(3, "0") + " / 100";
    if (val < 100) {
      setTimeout(tick, 42);
    } else {
      setTimeout(function () {
        loader.classList.add("done");
        document.body.style.overflow = "";
      }, 260);
    }
  }

  document.body.style.overflow = "hidden";
  if (reduce) {
    loader.classList.add("done");
    document.body.style.overflow = "";
  } else {
    setTimeout(tick, 220);
  }

  /* ---------------- 导航 / 进度条 / 侧边高亮 ---------------- */
  var nav = document.getElementById("nav");
  var pbar = document.getElementById("pbar");
  var sideLinks = [].slice.call(document.querySelectorAll(".side a"));
  var sections = sideLinks.map(function (a) {
    return document.querySelector(a.getAttribute("href"));
  });

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle("stuck", y > 40);

    var h = document.documentElement.scrollHeight - window.innerHeight;
    pbar.style.width = (h > 0 ? Math.min(1, y / h) : 0) * 100 + "%";

    var probe = y + 150;
    var current = null;
    var bestTop = -1;
    sections.forEach(function (sec) {
      // 按页面实际纵向位置取最靠下的一节（导航顺序与 DOM 顺序不同）
      if (sec && sec.offsetTop <= probe && sec.offsetTop >= bestTop) {
        current = sec;
        bestTop = sec.offsetTop;
      }
    });
    if (!current) current = sections[0];
    sideLinks.forEach(function (a) {
      a.classList.toggle("on", current && a.getAttribute("href") === "#" + current.id);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- 跑马灯内容 ---------------- */
  var marqueeWords = [
    "整页翻译", "划词气泡", "双语对照", "AI 引擎", "自定义请求模板",
    "站点规则", "19 种目标语言", "MV3", "0 统计脚本", "v1.1.0", "只有 75 KB"
  ];
  var track = document.getElementById("mtrack");
  var marqueeHTML = "";
  for (var r = 0; r < 2; r++) {
    marqueeWords.forEach(function (word) {
      marqueeHTML += "<span><b>" + word + "</b><em></em></span>";
    });
  }
  track.innerHTML = marqueeHTML;

  /* ---------------- 滚动进场 ---------------- */
  var revealEls = [].slice.call(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------- 宣言逐行点亮 ---------------- */
  var lines = [].slice.call(document.querySelectorAll(".manifesto .line"));
  if ("IntersectionObserver" in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("on", entry.isIntersecting);
      });
    }, { threshold: 0.55 });
    lines.forEach(function (el) { io2.observe(el); });
  } else {
    lines.forEach(function (el) { el.classList.add("on"); });
  }

  /* ---------------- 数字滚动 ---------------- */
  var counted = false;
  var statEls = [].slice.call(document.querySelectorAll("[data-count]"));

  function runCount() {
    if (counted) return;
    counted = true;
    statEls.forEach(function (el) {
      var to = parseInt(el.getAttribute("data-count"), 10) || 0;
      if (reduce || to === 0) { el.textContent = to; return; }
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / 1400);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  if ("IntersectionObserver" in window) {
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCount(); io3.disconnect(); }
      });
    }, { threshold: 0.4 });
    var statsBox = document.querySelector(".stats");
    if (statsBox) io3.observe(statsBox);
  } else {
    runCount();
  }

  /* ---------------- Hero 3D 跟随 ---------------- */
  var tilt = document.getElementById("tilt");
  var stage = document.getElementById("stage");
  var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

  if (tilt && stage && fine && !reduce) {
    stage.addEventListener("pointermove", function (ev) {
      var rect = stage.getBoundingClientRect();
      tx = ((ev.clientX - rect.left) / rect.width - 0.5) * 2;
      ty = ((ev.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    stage.addEventListener("pointerleave", function () {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      tilt.style.setProperty("--ry", (-9 - cx * 7).toFixed(2));
      tilt.style.setProperty("--rx", (4 + cy * 5).toFixed(2));
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }
    raf = requestAnimationFrame(loop);
  } else if (tilt) {
    tilt.style.setProperty("--ry", "-9");
    tilt.style.setProperty("--rx", "4");
  }

  /* ---------------- 截图卡倾斜 ---------------- */
  if (fine && !reduce) {
    [].slice.call(document.querySelectorAll(".tilt-s")).forEach(function (el) {
      var box = el.closest(".shot");
      el.style.setProperty("--ry", "-6");
      el.style.setProperty("--rx", "3");
      box.addEventListener("pointermove", function (ev) {
        var rect = box.getBoundingClientRect();
        var px = (ev.clientX - rect.left) / rect.width - 0.5;
        var py = (ev.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--ry", (-6 - px * 8).toFixed(2));
        el.style.setProperty("--rx", (3 + py * 6).toFixed(2));
      });
      box.addEventListener("pointerleave", function () {
        el.style.setProperty("--ry", "-6");
        el.style.setProperty("--rx", "3");
      });
    });
  }

  /* ---------------- 卡片光斑 ---------------- */
  [].slice.call(document.querySelectorAll(".card")).forEach(function (card) {
    card.addEventListener("pointermove", function (ev) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", ev.clientX - rect.left + "px");
      card.style.setProperty("--my", ev.clientY - rect.top + "px");
    });
  });

  /* ---------------- 磁吸按钮 ---------------- */
  if (fine && !reduce) {
    [].slice.call(document.querySelectorAll(".magnetic")).forEach(function (btn) {
      btn.addEventListener("pointermove", function (ev) {
        var rect = btn.getBoundingClientRect();
        var dx = (ev.clientX - rect.left - rect.width / 2) * 0.1;
        var dy = (ev.clientY - rect.top - rect.height / 2) * 0.16;
        btn.style.transform = "translate(" + dx + "px," + dy + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ---------------- 自定义光标 ---------------- */
  if (fine) {
    var ring = document.getElementById("ring");
    var mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener("pointermove", function (ev) {
      mx = ev.clientX; my = ev.clientY;
    });
    (function follow() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(follow);
    })();
    document.addEventListener("pointerover", function (ev) {
      var hit = ev.target.closest("a,button,.card,.shot,.dlcard,.doc-card");
      ring.classList.toggle("big", !!hit);
    });
  }

  /* ---------------- 主题系统 ---------------- */
  var THEME_KEY = "qt-theme";
  var ACCENT_KEY = "qt-accent";
  var meta = document.getElementById("themeColor");
  var themeBtns = [].slice.call(document.querySelectorAll("[data-theme-set]"));
  var themePop = document.getElementById("themePop");
  var accentPick = document.getElementById("accentPick");
  var accentBtns = [].slice.call(document.querySelectorAll("[data-accent]"));
  var inlineProps = ["--accent", "--accent-2", "--deep", "--bg", "--bg-2", "--bg-3", "--nav-bg"];

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* 隐私模式下忽略 */ }
  }
  function read(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
  }

  function hexToRgb(hex) {
    hex = String(hex || "").replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16)
    ];
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    var d = max - min;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }

  function hsl(h, s, l) {
    return "hsl(" + h.toFixed(1) + " " + s.toFixed(1) + "% " + l.toFixed(1) + "%)";
  }

  function applyTheme(theme, accent) {
    theme = theme || "dark";
    root.setAttribute("data-theme", theme);
    inlineProps.forEach(function (p) { root.style.removeProperty(p); });

    if (theme === "custom") {
      var rgb = hexToRgb(accent);
      var base = rgbToHsl(rgb[0], rgb[1], rgb[2]);
      var h = base[0];
      var s = Math.max(48, base[1]);
      var l = Math.min(78, Math.max(60, base[2]));
      var bg = hsl(h, 14, 3.6);
      root.style.setProperty("--accent", hsl(h, s, l));
      root.style.setProperty("--accent-2", hsl(h, Math.max(40, s - 8), l - 12));
      root.style.setProperty("--deep", hsl(h, Math.max(30, s * 0.8), 22));
      root.style.setProperty("--bg", bg);
      root.style.setProperty("--bg-2", hsl(h, 13, 5.4));
      root.style.setProperty("--bg-3", hsl(h, 12, 7.8));
      root.style.setProperty("--nav-bg", bg.replace(")", " / .72)"));
      meta.setAttribute("content", bg);
    } else {
      meta.setAttribute("content", theme === "light" ? "#f5f2e9" : "#060807");
    }

    themeBtns.forEach(function (btn) {
      btn.classList.toggle("on", btn.getAttribute("data-theme-set") === theme);
    });
    accentBtns.forEach(function (btn) {
      btn.classList.toggle("on", theme === "custom" &&
        btn.getAttribute("data-accent").toLowerCase() === String(accent).toLowerCase());
    });
    if (accentPick) accentPick.value = accent || "#5ad0a8";
  }

  var savedTheme = read(THEME_KEY, "dark");
  var savedAccent = read(ACCENT_KEY, "#5ad0a8");
  applyTheme(savedTheme, savedAccent);

  themeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var theme = btn.getAttribute("data-theme-set");
      var accent = read(ACCENT_KEY, "#5ad0a8");
      applyTheme(theme, accent);
      store(THEME_KEY, theme);
      themePop.classList.toggle("on", theme === "custom");
    });
  });

  accentBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var accent = btn.getAttribute("data-accent");
      applyTheme("custom", accent);
      store(THEME_KEY, "custom");
      store(ACCENT_KEY, accent);
    });
  });

  if (accentPick) {
    accentPick.addEventListener("input", function () {
      applyTheme("custom", accentPick.value);
      store(THEME_KEY, "custom");
      store(ACCENT_KEY, accentPick.value);
    });
  }

  document.addEventListener("click", function (ev) {
    if (!themePop.contains(ev.target) && !ev.target.closest("[data-theme-set]")) {
      themePop.classList.remove("on");
    }
  });

  /* ---------------- 浏览器识别与下载 ---------------- */
  var PKG = {
    chrome: { name: "Chrome", file: "download/wuku-translate.zip", note: "Chrome 110+" },
    edge: { name: "Edge", file: "download/wuku-translate.zip", note: "同一份 MV3 包" }
  };

  function detectBrowser() {
    var ua = navigator.userAgent;
    if (/EdgiOS|CriOS|FxiOS/.test(ua)) return null;          // 移动端浏览器不支持扩展
    if (/Edg\//.test(ua)) return "edge";
    if (/Firefox\//.test(ua)) return "firefox";             // 识别到但暂未提供
    if (/Chrome\//.test(ua) || /Chromium\//.test(ua)) return "chrome";
    return null;
  }

  var detected = detectBrowser();
  var dlBtn = document.getElementById("dlBtn");
  var dlMeta = document.getElementById("dlMeta");
  var dlDetect = document.getElementById("dlDetect");
  var dlManual = document.getElementById("dlManual");
  var cards = [].slice.call(document.querySelectorAll(".dlcard[data-browser]"));

  function refreshDownloadUI() {
    cards.forEach(function (card) {
      card.classList.toggle("on", card.getAttribute("data-browser") === detected);
    });

    if (detected === "chrome" || detected === "edge") {
      var pkg = PKG[detected];
      dlMeta.textContent = "v1.1.0 · " + pkg.name + " 版 · 75 KB";
      dlDetect.innerHTML = "已识别：<b>" + pkg.name + "</b> · 将下载 Chrome / Edge 通用安装包";
    } else if (detected === "firefox") {
      dlMeta.textContent = "v1.1.0 · Firefox 暂未提供";
      dlDetect.innerHTML = "已识别：<b>Firefox</b> · 暂未提供安装包，可选择 Chrome / Edge 版";
    } else {
      dlMeta.textContent = "v1.1.0 · 请选择浏览器";
      dlDetect.textContent = "未能识别浏览器 · 点击下载可手动选择安装包";
    }
  }

  function startDownload(key) {
    var pkg = PKG[key];
    if (!pkg) return;
    var a = document.createElement("a");
    a.href = pkg.file;
    a.download = "wuku-translate.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* 弹窗 */
  var modal = document.getElementById("modal");
  var lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.classList.add("on");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var first = modal.querySelector(".modal__list button:not(:disabled)");
    if (first) first.focus();
  }

  function closeModal() {
    modal.classList.remove("on");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  dlBtn.addEventListener("click", function () {
    if (detected === "chrome" || detected === "edge") {
      startDownload(detected);
    } else {
      openModal();
    }
  });

  dlManual.addEventListener("click", openModal);

  [].slice.call(modal.querySelectorAll("[data-close]")).forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  [].slice.call(modal.querySelectorAll("[data-browser]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-browser");
      if (!PKG[key]) return;
      detected = key;
      refreshDownloadUI();
      closeModal();
      startDownload(key);
    });
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && modal.classList.contains("on")) closeModal();
  });

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      var key = card.getAttribute("data-browser");
      if (PKG[key]) {
        detected = key;
        refreshDownloadUI();
      }
    });
  });

  refreshDownloadUI();

  /* ---------------- 锚点平滑滚动（避开固定导航） ---------------- */
  [].slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      ev.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 58;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
      if (id === "#top") window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  });
})();
