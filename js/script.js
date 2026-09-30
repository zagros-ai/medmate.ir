/* ==========================================================
   مِد استور — منطق اصلی
   رویدادها با event delegation روی document مدیریت می‌شوند
   تا در WebView اندروید پایدار بمانند (بدون onclick درون‌خطی).
   ========================================================== */

(function () {
  "use strict";

  const appsGrid = document.getElementById("appsGrid");
  const searchInput = document.getElementById("searchInput");
  const noResult = document.getElementById("noResult");
  const modal = document.getElementById("appModal");

  let activeCategory = "all";

  /* ---------- ساخت کارت برنامه‌ها از داده ---------- */
  function renderApps() {
    const apps = window.APPS || [];
    appsGrid.innerHTML = apps.map(appCardHTML).join("");
  }

  function appCardHTML(app) {
    return `
      <article class="app-card" data-category="${app.category}" data-name="${escapeAttr(app.name)}" data-id="${app.id}">
        <div>
          <a class="app-info app-info-link" href="${app.page || '#'}">
            <img src="${app.icon}" alt="آیکون ${escapeAttr(app.nameFa)}" class="app-icon" loading="lazy" width="64" height="64">
            <div class="app-details">
              <h3 class="app-name">${escapeHTML(app.name)}</h3>
              <div class="app-category">${escapeHTML(app.categoryFa)}</div>
            </div>
          </a>
          <div class="app-meta">
            <span>حجم: ${escapeHTML(app.size)}</span>
            <div class="app-rating">★ ${escapeHTML(app.rating)}</div>
          </div>
        </div>
        <button class="download-btn" data-action="open-modal" data-id="${app.id}">دانلود برنامه</button>
      </article>`;
  }

  /* ---------- جستجو و فیلتر ---------- */
  function applyFilters() {
    const query = (searchInput.value || "").trim().toLowerCase();
    const cards = document.querySelectorAll(".app-card");
    let visible = 0;

    cards.forEach((card) => {
      const name = (card.getAttribute("data-name") || "").toLowerCase();
      const category = card.getAttribute("data-category");
      const matchesSearch = name.includes(query);
      const matchesCategory = activeCategory === "all" || category === activeCategory;

      if (matchesSearch && matchesCategory) {
        card.style.display = "flex";
        visible++;
      } else {
        card.style.display = "none";
      }
    });

    noResult.hidden = visible !== 0;
  }

  /* ---------- مدال ---------- */
  function openModal(app) {
    document.getElementById("modalTitle").textContent = app.nameFa;
    document.getElementById("modalCategory").textContent = app.categoryFa;
    document.getElementById("modalDesc").textContent = app.desc;
    document.getElementById("modalSize").textContent = "حجم: " + app.size;
    document.getElementById("modalVersion").textContent = "نسخه: " + app.version;
    document.getElementById("modalIcon").src = app.icon;
    document.getElementById("modalIcon").alt = "آیکون " + app.nameFa;
    document.getElementById("modalDownloadBtn").href = app.link;
    modal.classList.add("active");
  }

  function closeModal() {
    modal.classList.remove("active");
  }

  function findApp(id) {
    return (window.APPS || []).find((a) => a.id === id);
  }

  /* ---------- Event delegation روی document ---------- */
  document.addEventListener("click", function (event) {
    const target = event.target;

    // باز کردن مدال
    const openBtn = target.closest('[data-action="open-modal"]');
    if (openBtn) {
      const app = findApp(openBtn.getAttribute("data-id"));
      if (app) openModal(app);
      return;
    }

    // فیلتر دسته‌بندی
    const catBtn = target.closest(".category-btn");
    if (catBtn) {
      document.querySelectorAll(".category-btn").forEach((b) => b.classList.remove("active"));
      catBtn.classList.add("active");
      activeCategory = catBtn.getAttribute("data-filter");
      applyFilters();
      return;
    }

    // بستن مدال (دکمه بستن یا کلیک روی فضای بیرونی)
    if (target.closest("#modalClose") || target === modal) {
      closeModal();
    }
  });

  document.addEventListener("input", function (event) {
    if (event.target === searchInput) applyFilters();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeModal();
  });

  /* ---------- کمک‌تابع‌های امنیتی ---------- */
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }
  function escapeAttr(str) {
    return escapeHTML(str).replace(/"/g, "&quot;");
  }

  /* ---------- راه‌اندازی اولیه ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderApps();
    applyFilters();
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

  /* ==========================================================
     مدیریت Service Worker و آپدیت خودکار
     ========================================================== */
  if ("serviceWorker" in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage("skipWaiting");
            }
          });
        });
      }).catch((error) => console.log("Service Worker registration failed:", error));
    });
  }
})();
