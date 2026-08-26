document.addEventListener("DOMContentLoaded", function () {
  /* ---------- helpers ---------- */
  function on(el, ev, fn) {
    if (el) el.addEventListener(ev, fn);
  }

  /* ---------- Preloader ----------*/

  const preloader = document.getElementById("preloader");
  const body = document.body;
  /*a switch, starts as false ("not done yet")*/
  let loadFinished = false;
  function finishLoad() {
    if (loadFinished) return;
    loadFinished = true;
    body.classList.remove("locked"); // unlock scrolling
    if (preloader) preloader.classList.add("hide"); // hide the loading screen
  }
  if (document.readyState === "complete") {
    setTimeout(finishLoad, 150);
  } else {
    window.addEventListener("load", function () {
      setTimeout(finishLoad, 150);
    });
  }
  /*If the page is already fully loaded by the time this code runs → 
  just call finishLoad() after a tiny 150ms pause.
If it's not loaded yet → wait for the "load" event (page fully ready),
 then call finishLoad() after that same 150ms pause.*/

  // safety net in case 'load' is delayed by slow external fonts/CDNs — much shorter than before
  setTimeout(finishLoad, 1000);

  /* ---------- NAV scroll state + scroll progress + back-to-top ---------- */
  const nav = document.getElementById("nav");
  const progress = document.getElementById("scrollProgress");
  const toTop = document.getElementById("toTop");
  window.addEventListener(
    "scroll",
    function () {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (nav) nav.classList.toggle("scrolled", y > 40);
      if (toTop) toTop.classList.toggle("show", y > 500);
      const h =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (progress)
        progress.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    },
    { passive: true },
  );
  on(toTop, "click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById("burgerBtn");
  const panel = document.getElementById("mobilePanel");
  on(burger, "click", function () {
    burger.classList.toggle("open");
    panel.classList.toggle("open");
  });
  if (panel) {
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        panel.classList.remove("open");
        burger.classList.remove("open");
      });
    });
  }

  /* ---------- Theme toggle ---------- */
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const root = document.documentElement;
  const sunPath =
    "M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4";
  const moonPath = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z";

  function setTheme(t) {
    root.setAttribute("data-theme", t);
    if (themeIcon) {
      themeIcon.innerHTML =
        t === "dark"
          ? '<path d="' + moonPath + '"></path>'
          : '<circle cx="12" cy="12" r="4"></circle><path d="' +
            sunPath +
            '"></path>';
    }
    try {
      localStorage.setItem("elite-theme", t);
    } catch (e) {}
  }
  on(themeToggle, "click", function () {
    const cur = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(cur);
  });
  let savedTheme = "dark";
  try {
    savedTheme = localStorage.getItem("elite-theme") || "dark";
  } catch (e) {}
  setTheme(savedTheme);

  /* ---------- Language toggle ---------- */
  const langToggle = document.getElementById("langToggle");
  let currentLang = "ar";
  function applyLang(lang) {
    document.querySelectorAll("[data-ar][data-en]").forEach(function (el) {
      el.textContent =
        lang === "ar" ? el.getAttribute("data-ar") : el.getAttribute("data-en");
    });

    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    if (langToggle) langToggle.textContent = lang === "ar" ? "EN" : "AR";
    currentLang = lang;
  }
  on(langToggle, "click", function () {
    applyLang(currentLang === "ar" ? "en" : "ar");
  });

  /* ---------- Hero spotlight ---------- */
  const hero = document.getElementById("hero");
  const spot = document.getElementById("heroSpot");
  on(hero, "mousemove", function (e) {
    const r = hero.getBoundingClientRect();
    spot.style.setProperty(
      "--mx",
      ((e.clientX - r.left) / r.width) * 100 + "%",
    );
    spot.style.setProperty(
      "--my",
      ((e.clientY - r.top) / r.height) * 100 + "%",
    );
  });

  /* ---------- Parallax grid on scroll ---------- */
  const heroGrid = document.getElementById("heroGrid");
  window.addEventListener(
    "scroll",
    function () {
      if (!heroGrid) return;
      const y = window.scrollY || 0;
      if (y < window.innerHeight) {
        heroGrid.style.transform = "translateY(" + y * 0.15 + "px)";
      }
    },
    { passive: true },
  );

  /* ---------- Scroll reveal (IntersectionObserver) ----------
     Fixed: the class now toggles both ways (added on enter, removed on
     exit) instead of unobserving after the first run, so every element
     replays its reveal animation every time it re-enters the viewport —
     not just the first time. Work-grid cards use a slightly longer,
     evenly-spaced per-card delay (via data-reveal-delay, 0/120/240/360ms)
     so the six case cards fan in one after another instead of popping
     in almost together. */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          const el = entry.target;
          if (entry.isIntersecting) {
            const delay = el.getAttribute("data-reveal-delay");
            clearTimeout(el._revealTimer);
            if (delay) {
              el._revealTimer = setTimeout(
                function () {
                  el.classList.add("in");
                },
                parseInt(delay, 10),
              );
            } else {
              el.classList.add("in");
            }
          } else {
            clearTimeout(el._revealTimer);
            el.classList.remove("in");
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 15% 0px" },
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* ---------- Counting number animation (replays with each reveal) ---------- */
  const counters = document.querySelectorAll(".counter");
  function animateCounter(el) {
    const target = parseFloat(el.getAttribute("data-value"));
    const prefix = el.getAttribute("data-prefix") || "";
    const suffix = el.getAttribute("data-suffix") || "";
    const isDecimal = String(target).indexOf(".") !== -1;
    const duration = 900;
    let startTime = null;
    function easeOutExpo(x) {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }
    function step(ts) {
      if (!startTime) startTime = ts;
      const progressRatio = Math.min((ts - startTime) / duration, 1);
      const eased = easeOutExpo(progressRatio);
      const current = target * eased;
      el.textContent =
        prefix +
        (isDecimal ? current.toFixed(1) : Math.round(current)) +
        suffix;
      if (progressRatio < 1) {
        el._counterFrame = requestAnimationFrame(step);
      } else {
        el.textContent =
          prefix + (isDecimal ? target.toFixed(1) : target) + suffix;
      }
    }
    cancelAnimationFrame(el._counterFrame);
    el.textContent = prefix + (isDecimal ? (0).toFixed(1) : 0) + suffix;
    el._counterFrame = requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const card = entry.target.closest("[data-reveal-delay]");
            const delay = card
              ? parseInt(card.getAttribute("data-reveal-delay"), 10)
              : 0;
            clearTimeout(entry.target._counterTimer);
            entry.target._counterTimer = setTimeout(function () {
              animateCounter(entry.target);
            }, delay);
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 15% 0px" },
    );
    counters.forEach(function (el) {
      cio.observe(el);
    });
  } else {
    counters.forEach(function (el) {
      animateCounter(el);
    });
  }

  /* ---------- Video showcase carousel ---------- */
  const videoData = [
    {
      youtubeId: "RPNn7k0-WdY",
      instagram:
        "https://www.instagram.com/reel/DbJA-AQsMgl/?igsh=MXU1b2Vkc3hwdTMxaw==",
    },
    {
      youtubeId: "E6G8huH4ToQ",
      instagram:
        "https://www.instagram.com/reel/Da27ctTNDjI/?igsh=bzEzb2R1cmlhbmIw",
    },
    {
      youtubeId: "ueyp1GrGbKA",
      instagram:
        "https://www.instagram.com/reel/Da-wxsZtRhC/?igsh=OTFvejZ3Mzd2cHox",
    },
    {
      youtubeId: "7xGo0Z8vj-s",
      instagram:
        "https://www.instagram.com/reel/DYIA09qsQxN/?igsh=bzk4YzJ2M2ZhMjdp",
    },
    {
      youtubeId: "SlSiygvH758",
      instagram: "https://www.instagram.com/noorhan_na_?igsh=ejZ5ZW11dTJvaWdx",
    },
    {
      youtubeId: "qVVzyTfwr_g",
      instagram:
        "https://www.instagram.com/reel/DbTdcetsjmq/?igsh=MW5reWY3bXU4b21uNw==",
    },
    {
      youtubeId: "KUKzG2mAQ7o",
      instagram:
        "https://www.instagram.com/reel/DUQ5EAMjBiU/?igsh=MTVmNGV6Mml1MXFuNA==",
    },
    {
      youtubeId: "-9Z5BY1xNX8",
      instagram: "https://www.instagram.com/reel/DSX0NTrjrfL/",
    },
  ];

  const videoEl = document.getElementById("showcaseVideo");
  const dotsWrap = document.getElementById("videoDots");
  const videoInstaEl = document.getElementById("videoInstaBtn");
  let vIndex = 0;

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    videoData.forEach(function (item, i) {
      const dot = document.createElement("button");
      dot.className = "video-dot" + (i === vIndex ? " active" : "");
      dot.type = "button";
      dot.setAttribute("aria-label", "Video " + (i + 1));
      dot.addEventListener("click", function () {
        goToVideo(i);
      });
      dotsWrap.appendChild(dot);
    });
  }

  function goToVideo(i) {
    vIndex = (i + videoData.length) % videoData.length;
    const item = videoData[vIndex];

    // تحديث الفيديو
    if (videoEl) {
      videoEl.src =
        "https://www.youtube.com/embed/" +
        item.youtubeId +
        "?rel=0&modestbranding=1&playsinline=1";
    }

    // تحديث الزر
    if (videoInstaEl) {
      videoInstaEl.classList.remove("show");
      void videoInstaEl.offsetWidth;
      if (item.instagram) {
        videoInstaEl.href = item.instagram;
        videoInstaEl.classList.add("show");
      }
    }
    buildDots();
  }

  on(document.getElementById("videoPrev"), "click", function () {
    goToVideo(vIndex - 1);
  });
  on(document.getElementById("videoNext"), "click", function () {
    goToVideo(vIndex + 1);
  });

  if (videoEl) goToVideo(0);
});
