/**
 * Rankupz — main script
 * Handles: smooth scroll, mobile nav, scroll animations, stats count-up, form UX, footer year
 * No build step required — open index.html in a browser or use Live Server
 */

(function () {
  "use strict";

  var THEME_KEY = "theme";

  function getStoredTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") return t;
    } catch (e) {}
    return "dark";
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    var btn = document.getElementById("theme-toggle");
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      if (btn) {
        btn.setAttribute("aria-label", "Switch to dark mode");
        btn.setAttribute("title", "Switch to dark mode");
        btn.setAttribute("aria-pressed", "false");
      }
    } else {
      root.removeAttribute("data-theme");
      if (btn) {
        btn.setAttribute("aria-label", "Switch to light mode");
        btn.setAttribute("title", "Switch to light mode");
        btn.setAttribute("aria-pressed", "true");
      }
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  }

  applyTheme(getStoredTheme());

  var themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isLight = document.documentElement.getAttribute("data-theme") === "light";
      applyTheme(isLight ? "dark" : "light");
    });
  }

  // --- Current year in footer (auto-updates) ---
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // --- Sticky header: subtle shadow when user scrolls ---
  var header = document.querySelector(".site-header");
  function updateHeaderShadow() {
    if (!header) return;
    if (window.scrollY > 8) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  window.addEventListener("scroll", updateHeaderShadow, { passive: true });
  updateHeaderShadow();

  // --- Smooth scrolling for same-page anchor links ---
  // Uses native smooth scroll where supported; falls back to instant jump
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var id = this.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();

      var headerOffset = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - headerOffset - 12;

      window.scrollTo({
        top: top,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });

      // Close mobile menu after navigation
      closeMobileNav();
    });
  });

  // --- Mobile navigation toggle ---
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("nav-menu");

  function closeMobileNav() {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function openMobileNav() {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute("aria-expanded", "true");
    navMenu.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      if (open) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    // Close menu on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileNav();
    });

    // Close when resizing to desktop
    window.addEventListener(
      "resize",
      function () {
        if (window.innerWidth > 768) closeMobileNav();
      },
      { passive: true }
    );
  }

  // --- Scroll reveal: fade + slide-up on sections/cards (see .reveal in CSS) ---
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    // Stagger: premium feel (slightly tighter)
    var staggerMs = 90;

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = el.getAttribute("data-delay");
          var ms = delay !== null ? parseInt(delay, 10) * staggerMs : 0;
          if (isNaN(ms)) ms = 0;

          window.setTimeout(function () {
            el.classList.add("is-visible");
          }, ms);

          obs.unobserve(el);
        });
      },
      {
        root: null,
        // Trigger slightly before the element is fully in view (feels smoother)
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });

    // Reveal elements already in the viewport on first paint. IntersectionObserver
    // can miss the initial frame in some cases, leaving .reveal at opacity: 0.
    function revealIfInView() {
      revealEls.forEach(function (el) {
        if (el.classList.contains("is-visible")) return;
        var rect = el.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var bottomShrink = vh * 0.08;
        if (rect.top < vh - bottomShrink && rect.bottom > 0) {
          var delay = el.getAttribute("data-delay");
          var ms = delay !== null ? parseInt(delay, 10) * staggerMs : 0;
          if (isNaN(ms)) ms = 0;
          window.setTimeout(function () {
            el.classList.add("is-visible");
          }, ms);
        }
      });
    }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(revealIfInView);
    });
  } else {
    // No IntersectionObserver (very old browsers): show everything
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // --- Stats strip: count up when section scrolls into view (2s) ---
  var statsStrip = document.getElementById("stats-strip");
  if (statsStrip && "IntersectionObserver" in window) {
    var statsReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var statCards = statsStrip.querySelectorAll(".strip-card[data-counter-target]");
    if (statCards.length && !statsReducedMotion) {
      var countDuration = 2000;
      var statsAnimated = false;

      function easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
      }

      function formatStat(card, value) {
        var max = parseFloat(card.getAttribute("data-counter-target"), 10);
        var prefix = card.getAttribute("data-counter-prefix") || "";
        var suffix = card.getAttribute("data-counter-suffix") || "";
        var n = Math.round(value);
        if (n < 0) n = 0;
        if (n > max) n = max;
        return prefix + n + suffix;
      }

      var statsObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting || statsAnimated) return;
            statsAnimated = true;
            obs.unobserve(entry.target);

            var items = [];
            statCards.forEach(function (card) {
              var target = parseFloat(card.getAttribute("data-counter-target"), 10);
              var numEl = card.querySelector(".strip-num");
              if (!numEl || isNaN(target)) return;
              items.push({ el: numEl, card: card, target: target });
              numEl.textContent = formatStat(card, 0);
            });

            var startTime = performance.now();
            function tick(now) {
              var elapsed = now - startTime;
              var t = Math.min(1, elapsed / countDuration);
              var eased = easeOutQuad(t);
              items.forEach(function (item) {
                item.el.textContent = formatStat(item.card, item.target * eased);
              });
              if (t < 1) {
                window.requestAnimationFrame(tick);
              } else {
                items.forEach(function (item) {
                  item.el.textContent = formatStat(item.card, item.target);
                });
              }
            }
            window.requestAnimationFrame(tick);
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -8% 0px",
          threshold: 0.15,
        }
      );
      statsObserver.observe(statsStrip);
    }
  }

  // --- Portfolio modal: case studies (no page reload) ---
  var caseModal = document.getElementById("case-modal");
  var caseModalDialog = caseModal ? caseModal.querySelector(".case-modal-dialog") : null;
  var caseModalTitle = document.getElementById("case-modal-title");
  var caseModalLive = document.getElementById("case-modal-live");
  var caseModalLive2 = document.getElementById("case-modal-live2");
  var caseModalCategory = document.getElementById("case-modal-category");
  var caseModalProblem = document.getElementById("case-modal-problem");
  var caseModalSolution = document.getElementById("case-modal-solution");
  var caseModalResults = document.getElementById("case-modal-results");
  var caseTabsText = document.getElementById("case-tabs-text");
  var caseTabsPanel = caseModal ? caseModal.querySelector(".case-tabs-panel") : null;
  var lastActiveEl = null;

  var portfolioData = {
    restaurant: {
      title: "Restaurant Website Design (Birmingham)",
      category: "Web Development + UI/UX",
      liveLink: "https://decorumbirmingham.co.uk/",
      liveLinkLabel: "Visit Decorum Birmingham →",
      problem:
        "A popular Birmingham restaurant had zero online presence. No website, no online booking, losing customers to competitors daily.",
      solution:
        "We built a fully custom restaurant website with online menu, table booking system, photo gallery, and Google Maps integration. Mobile-first design optimised for local SEO.",
      results: [
        "+200% increase in online bookings within 60 days",
        "+150% organic website traffic from Google",
        "Page 1 ranking for 'best restaurant Birmingham'",
        "4.9★ Google review integration added",
      ],
      beforeAfter: {
        before: "0 online bookings, no website, invisible on Google",
        after: "200+ monthly bookings online, #1 local search result",
      },
    },
    ecommerce: {
      title: "E-commerce Store Optimization (Birmingham)",
      category: "SEO + Performance",
      liveLink: "https://fashiontrack.co.uk/",
      liveLinkLabel: "Visit Fashion Track →",
      problem:
        "Birmingham-based online clothing store had slow page speed (score 28/100), poor mobile UX, and was ranking on page 4+ for all target keywords.",
      solution:
        "Full technical SEO audit and fix. Compressed images, implemented lazy loading, rewrote meta tags, built 40+ local backlinks, restructured product categories for SEO.",
      results: [
        "+180% increase in organic traffic in 90 days",
        "Page speed improved from 28 to 94 out of 100",
        "+3x conversion rate on product pages",
        "Top 3 Google ranking for 12 target keywords",
      ],
      beforeAfter: {
        before: "Page speed: 28/100, Page 4 on Google, 0.8% conversion rate",
        after: "Page speed: 94/100, Page 1 on Google, 3.1% conversion rate",
      },
    },
    doctor: {
      title: "Birmingham Doctor Appointment Website",
      category: "Web Development + Healthcare",
      liveLink: "https://drderme.com/our-clinics/edgbaston-fillers-clinic/",
      liveLinkLabel: "Visit Edgbaston Fillers Clinic →",
      liveLink2: "https://rodericksdentalpartners.co.uk/",
      liveLinkLabel2: "Visit Rodericks Dental →",
      problem:
        "A private GP clinic in Birmingham had an outdated HTML website with no booking system. Patients were calling by phone only, causing staff overload and missed appointments.",
      solution:
        "Built a modern healthcare website with online appointment booking, patient intake forms, doctor profiles, service pages, and CQC compliance. Integrated with Google Calendar.",
      results: [
        "+250% increase in appointment bookings online",
        "Phone call volume reduced by 60% (staff relief)",
        "Website load time under 1.8 seconds",
        "#1 Google ranking for 'private GP Birmingham'",
      ],
      beforeAfter: {
        before: "100% phone bookings, outdated site, 6s load time",
        after: "80% online bookings, modern site, 1.8s load time",
      },
    },
    clinic: {
      title: "Birmingham Medical Clinic Website",
      category: "Web Design + UI/UX",
      liveLink: "https://www.privateharleystreet.com",
      liveLinkLabel: "View Design Reference",
      problem:
        "A multi-service medical clinic had a confusing website that caused patients to leave without booking. High bounce rate of 84% and poor mobile experience.",
      solution:
        "Complete redesign with clean patient-friendly UI. Added services pages, contact forms, clinic location map, team profiles, and FAQ section. Fully mobile responsive.",
      results: [
        "Bounce rate reduced from 84% to 31%",
        "+300% increase in contact form submissions",
        "Mobile traffic increased by +170%",
        "Average session duration up by 3.2 minutes",
      ],
      beforeAfter: {
        before: "84% bounce rate, 0 online enquiries, poor mobile layout",
        after: "31% bounce rate, 150+ monthly enquiries, perfect mobile UX",
      },
    },
  };

  function setActiveCaseTab(tabName) {
    if (!caseModal) return;
    var beforeBtn = caseModal.querySelector('.case-tab[data-tab="before"]');
    var afterBtn = caseModal.querySelector('.case-tab[data-tab="after"]');
    var isBefore = tabName !== "after";

    if (beforeBtn) {
      beforeBtn.classList.toggle("is-active", isBefore);
      beforeBtn.setAttribute("aria-selected", isBefore ? "true" : "false");
    }
    if (afterBtn) {
      afterBtn.classList.toggle("is-active", !isBefore);
      afterBtn.setAttribute("aria-selected", !isBefore ? "true" : "false");
    }
  }

  function openCaseModal(projectKey) {
    if (!caseModal || !caseModalDialog) return;
    var data = portfolioData[projectKey];
    if (!data) return;

    lastActiveEl = document.activeElement;

    if (caseModalTitle) caseModalTitle.textContent = data.title;
    if (caseModalCategory) caseModalCategory.textContent = data.category;
    if (caseModalProblem) caseModalProblem.textContent = data.problem;
    if (caseModalSolution) caseModalSolution.textContent = data.solution;
    if (caseModalLive) {
      caseModalLive.href = data.liveLink || "#";
      caseModalLive.textContent = data.liveLinkLabel || "View Live Reference →";
    }
    if (caseModalLive2) {
      if (data.liveLink2) {
        caseModalLive2.href = data.liveLink2;
        caseModalLive2.textContent = data.liveLinkLabel2 || "View Live Reference →";
        caseModalLive2.style.display = "";
      } else {
        caseModalLive2.style.display = "none";
      }
    }
    if (caseModalResults) {
      caseModalResults.innerHTML = "";
      data.results.forEach(function (r) {
        var li = document.createElement("li");
        li.textContent = r;
        caseModalResults.appendChild(li);
      });
    }
    if (caseTabsText) {
      var beforeText = data.beforeAfter && data.beforeAfter.before ? data.beforeAfter.before : "";
      caseTabsText.textContent = beforeText;
    }
    setActiveCaseTab("before");

    caseModal.classList.add("is-open");
    caseModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    var closeBtn = caseModal.querySelector(".case-modal-close");
    if (closeBtn) closeBtn.focus();
  }

  function closeCaseModal() {
    if (!caseModal) return;
    caseModal.classList.remove("is-open");
    caseModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastActiveEl && typeof lastActiveEl.focus === "function") lastActiveEl.focus();
    lastActiveEl = null;
  }

  // Click handlers for cards
  document.querySelectorAll(".portfolio-card[data-project]").forEach(function (card) {
    card.addEventListener("click", function () {
      openCaseModal(card.getAttribute("data-project"));
    });
  });

  // Modal close (overlay + button)
  if (caseModal) {
    caseModal.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.getAttribute && t.getAttribute("data-close") === "true") closeCaseModal();
    });
  }

  // Before/After tabs
  if (caseModal) {
    caseModal.querySelectorAll(".case-tab[data-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.getAttribute("data-tab");
        var title = caseModalTitle ? caseModalTitle.textContent : "";
        var key = null;
        Object.keys(portfolioData).some(function (k) {
          if (portfolioData[k].title === title) {
            key = k;
            return true;
          }
          return false;
        });
        var data = key ? portfolioData[key] : null;
        if (!data || !caseTabsText) return;

        if (caseTabsPanel) caseTabsPanel.classList.add("is-switching");
        window.setTimeout(function () {
          var text = data.beforeAfter && tab === "after" ? data.beforeAfter.after : data.beforeAfter.before;
          caseTabsText.textContent = text || "";
          setActiveCaseTab(tab);
          if (caseTabsPanel) caseTabsPanel.classList.remove("is-switching");
        }, 120);
      });
    });
  }

  // ESC to close
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && caseModal && caseModal.classList.contains("is-open")) closeCaseModal();
  });

  // --- Contact form: client-side only (no backend) ---
  var form = document.getElementById("contact-form");
  var formStatus = document.getElementById("form-status");

  if (form && formStatus) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var message = form.querySelector("#message");

      if (!name || !email || !message) return;

      // Basic validation
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        formStatus.textContent = "Please fill in all fields.";
        formStatus.className = "form-note";
        return;
      }

      // Simple email pattern check (not exhaustive)
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      if (!emailOk) {
        formStatus.textContent = "Please enter a valid email address.";
        formStatus.className = "form-note";
        return;
      }

      // Success state - replace with fetch() to your API or Formspree when ready
      formStatus.textContent = "Thanks! We will be in touch soon. (Demo form - no backend connected yet.)";
      formStatus.className = "form-note success";
      form.reset();
    });
  }
})();
