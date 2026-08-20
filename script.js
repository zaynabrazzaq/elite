document.addEventListener("DOMContentLoaded", function () {
  /* ---------- helpers ---------- */
  function on(el, ev, fn) {
    if (el) el.addEventListener(ev, fn);
  }

  /* ---------- Preloader ----------
     Fixed: removed the artificial 1500ms minimum wait. Now the file is
     hidden as soon as the page actually finishes loading (or after a
     much shorter 900ms safety cap if 'load' is slow to fire because of
     a font/CDN hiccup) instead of always forcing a multi-second wait. */
  var preloader = document.getElementById("preloader");
  var body = document.body;
  var loadFinished = false;
  function finishLoad() {
    if (loadFinished) return;
    loadFinished = true;
    body.classList.remove("locked");
    if (preloader) preloader.classList.add("hide");
  }
  if (document.readyState === "complete") {
    setTimeout(finishLoad, 150);
  } else {
    window.addEventListener("load", function () {
      setTimeout(finishLoad, 150);
    });
  }
  // safety net in case 'load' is delayed by slow external fonts/CDNs — much shorter than before
  setTimeout(finishLoad, 1000);

  /* ---------- AOS (guarded so a CDN hiccup never breaks the rest of the page) ---------- */
  try {
    if (typeof AOS !== "undefined") {
      AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });
    }
  } catch (e) {
    /* fail silently, page still works without AOS */
  }

  /* ---------- NAV scroll state + scroll progress + back-to-top ---------- */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("scrollProgress");
  var toTop = document.getElementById("toTop");
  window.addEventListener(
    "scroll",
    function () {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (nav) nav.classList.toggle("scrolled", y > 40);
      if (toTop) toTop.classList.toggle("show", y > 500);
      var h =
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
  var burger = document.getElementById("burgerBtn");
  var panel = document.getElementById("mobilePanel");
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
  var themeToggle = document.getElementById("themeToggle");
  var themeIcon = document.getElementById("themeIcon");
  var root = document.documentElement;
  var sunPath =
    "M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4";
  var moonPath = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z";

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
    var cur = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(cur);
  });
  var savedTheme = "dark";
  try {
    savedTheme = localStorage.getItem("elite-theme") || "dark";
  } catch (e) {}
  setTheme(savedTheme);

  /* ---------- Language toggle ---------- */
  var langToggle = document.getElementById("langToggle");
  var currentLang = "ar";
  function applyLang(lang) {
    document.querySelectorAll("[data-ar][data-en]").forEach(function (el) {
      el.textContent =
        lang === "ar" ? el.getAttribute("data-ar") : el.getAttribute("data-en");
    });
    document
      .querySelectorAll("[data-static-ar][data-static-en]")
      .forEach(function (el) {
        el.textContent =
          lang === "ar"
            ? el.getAttribute("data-static-ar")
            : el.getAttribute("data-static-en");
      });
    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    if (langToggle) langToggle.textContent = lang === "ar" ? "EN" : "AR";
    currentLang = lang;
    // keep the currently-shown video's caption synced with the toggle
    if (videoTitleEl && typeof videoData !== "undefined" && videoData[vIndex]) {
      videoTitleEl.textContent =
        lang === "ar" ? videoData[vIndex].ar : videoData[vIndex].en;
    }
  }
  on(langToggle, "click", function () {
    applyLang(currentLang === "ar" ? "en" : "ar");
  });

  /* ---------- Hero spotlight ---------- */
  var hero = document.getElementById("hero");
  var spot = document.getElementById("heroSpot");
  on(hero, "mousemove", function (e) {
    var r = hero.getBoundingClientRect();
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
  var heroGrid = document.getElementById("heroGrid");
  window.addEventListener(
    "scroll",
    function () {
      if (!heroGrid) return;
      var y = window.scrollY || 0;
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
  var revealEls = document.querySelectorAll(".reveal, .reveal-clip");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var el = entry.target;
          if (entry.isIntersecting) {
            var delay = el.getAttribute("data-reveal-delay");
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
  var counters = document.querySelectorAll(".counter");
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-value"));
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var isDecimal = String(target).indexOf(".") !== -1;
    var duration = 900;
    var startTime = null;
    function easeOutExpo(x) {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }
    function step(ts) {
      if (!startTime) startTime = ts;
      var progressRatio = Math.min((ts - startTime) / duration, 1);
      var eased = easeOutExpo(progressRatio);
      var current = target * eased;
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
  // if ("IntersectionObserver" in window && counters.length) {
  //   var cio = new IntersectionObserver(
  //     function (entries) {
  //       entries.forEach(function (entry) {
  //         if (entry.isIntersecting) {
  //           animateCounter(entry.target);
  //         }
  //       });
  //     },
  //     { threshold: 0.5 },
  //   );
  if ("IntersectionObserver" in window && counters.length) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var card = entry.target.closest("[data-reveal-delay]");
            var delay = card
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

  /* ---------- Tilt effect on case cards (mouse only, skipped on touch) ---------- */
  var hasFineHover =
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (hasFineHover) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (py - 0.5) * -8;
        var ry = (px - 0.5) * 8;
        card.style.transform =
          "perspective(700px) rotateX(" +
          rx +
          "deg) rotateY(" +
          ry +
          "deg) translateY(-4px)";
        card.style.setProperty("--px", px * 100 + "%");
        card.style.setProperty("--py", py * 100 + "%");
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform =
          "perspective(700px) rotateX(0) rotateY(0) translateY(0)";
      });
    });
  }
  /* ---------- Video showcase carousel ---------- */
  var videoData = [
    {
      youtubeId: "RPNn7k0-WdY",
      instagram:
        "https://www.instagram.com/reel/DbJA-AQsMgl/?igsh=MXU1b2Vkc3hwdTMxaw==",
      caseNo: "CASE / 01",
      ar: "دكتورة جلدية ",
      en: "Dermatologist ",
    },
    {
      youtubeId: "E6G8huH4ToQ",
      instagram:
        "https://www.instagram.com/reel/Da27ctTNDjI/?igsh=bzEzb2R1cmlhbmIw",
      caseNo: "CASE / 02",
      ar: "دكتور أسنان — يحجي عن تقدم الفك",
      en: "Dentist — on jaw advancement treatment",
    },
    {
      youtubeId: "ueyp1GrGbKA",
      instagram:
        "https://www.instagram.com/reel/Da-wxsZtRhC/?igsh=OTFvejZ3Mzd2cHox",
      caseNo: "CASE / 03",
      ar: "ليزر",
      en: "Laser Treatment",
    },
    {
      youtubeId: "7xGo0Z8vj-s",
      instagram:
        "https://www.instagram.com/reel/DYIA09qsQxN/?igsh=bzk4YzJ2M2ZhMjdp",
      caseNo: "CASE / 04",
      ar: "عيون",
      en: "Ophthalmology",
    },
    {
      youtubeId: "SlSiygvH758",
      instagram: "https://www.instagram.com/noorhan_na_?igsh=ejZ5ZW11dTJvaWdx",
      caseNo: "CASE / 05",
      ar: "صيدلانية — تحجي عن البشرة",
      en: "Pharmacist — on skincare",
    },
    {
      youtubeId: "qVVzyTfwr_g",
      instagram:
        "https://www.instagram.com/reel/DbTdcetsjmq/?igsh=MW5reWY3bXU4b21uNw==",
      caseNo: "CASE / 06",
      ar: "دكتورة — تحجي عن غرفة العمليات",
      en: "Doctor — inside the operating room",
    },
    {
      youtubeId: "KUKzG2mAQ7o",
      instagram:
        "https://www.instagram.com/reel/DUQ5EAMjBiU/?igsh=MTVmNGV6Mml1MXFuNA==",
      caseNo: "CASE / 07",
      ar: "دكتور أسنان — يحجي عن التبييض",
      en: "Dentist — on teeth whitening",
    },
    {
      youtubeId: "-9Z5BY1xNX8",
      instagram: "https://www.instagram.com/reel/DSX0NTrjrfL/",
      caseNo: "CASE / 08",
      ar: "دكتورة — تحجي عن تحديد جنس الجنين",
      en: "Doctor — on determining the baby's gender",
    },
  ];

  var videoEl = document.getElementById("showcaseVideo");
  var videoTitleEl = document.getElementById("videoTitle");
  var videoCaseNoEl = document.getElementById("videoCaseNo");
  var dotsWrap = document.getElementById("videoDots");
  var videoInstaEl = document.getElementById("videoInstaBtn");
  var vIndex = 0;

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    videoData.forEach(function (item, i) {
      var dot = document.createElement("button");
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
    var item = videoData[vIndex];

    // تحديث الفيديو
    if (videoEl) {
      videoEl.src =
        "https://www.youtube.com/embed/" +
        item.youtubeId +
        "?rel=0&modestbranding=1&playsinline=1";
    }

    // --- هذه هي الأسطر التي كانت مفقودة وتسبب عدم تغير النص ---
    var lang = document.documentElement.getAttribute("lang") || "ar";
    if (videoTitleEl)
      videoTitleEl.textContent = lang === "ar" ? item.ar : item.en;
    if (videoCaseNoEl) videoCaseNoEl.textContent = item.caseNo;
    // --------------------------------------------------------

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
