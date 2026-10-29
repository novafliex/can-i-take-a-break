// 今天能摆吗？展示页 —— 极少 JS：移动端菜单 + 滚动浮现 + 年份
(function () {
  "use strict";

  // 移动端导航
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "打开菜单");
      }
    });
  }

  // 滚动浮现（尊重减少动画偏好：CSS 已兜底，这里再避免无谓观察）
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(
    ".feature-card, .timeline li, .tech-item, .arch-figure, .phone, .video-frame, .shot-grid figure"
  );
  if (!reduce && "IntersectionObserver" in window) {
    targets.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  // 同一主题的所有页面保持在同一个网格里。
  var themeButtons = document.querySelectorAll("[data-theme]");
  var names = { all: "三种主题真机首页并排对比 · 1170×2532 原图", clean: "清爽极简 · 8 张真机原图", retro: "温柔复古 · 8 张真机原图", fun: "趣味涂鸦 · 13 张真机原图" };
  function selectTheme(theme) {
    if (!Object.prototype.hasOwnProperty.call(names, theme)) return;
    themeButtons.forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.theme === theme)); });
    document.querySelectorAll("[data-gallery]").forEach(function (panel) { panel.hidden = panel.dataset.gallery !== theme; });
    document.getElementById("theme-status").textContent = names[theme];
  }
  themeButtons.forEach(function (button) { button.addEventListener("click", function () { selectTheme(button.dataset.theme); }); });
  selectTheme(new URLSearchParams(window.location.search).get("theme") || "all");

  // 原生 dialog 提供焦点约束、Escape 关闭，并返回到打开它的图片。
  var viewer = document.getElementById("image-viewer");
  var viewerImage = document.getElementById("viewer-image");
  var zoom = document.getElementById("viewer-zoom");
  if (viewer && typeof viewer.showModal === "function") {
    var group = [];
    var current = 0;
    var opener;
    var previous = document.getElementById("viewer-prev");
    var next = document.getElementById("viewer-next");
    function showImage(index) {
      current = index;
      var link = group[current];
      var image = link.querySelector("img");
      viewerImage.src = link.href;
      viewerImage.alt = image.alt;
      document.getElementById("viewer-title").textContent = image.alt;
      document.getElementById("viewer-original").href = link.href;
      document.getElementById("viewer-count").textContent = (current + 1) + " / " + group.length;
      previous.disabled = current === 0;
      next.disabled = current === group.length - 1;
      viewer.classList.remove("native-size");
      zoom.setAttribute("aria-pressed", "false");
      zoom.textContent = "原始尺寸";
      viewer.querySelector(".viewer-stage").scrollTo(0, 0);
    }
    previous.addEventListener("click", function () { if (current > 0) showImage(current - 1); });
    next.addEventListener("click", function () { if (current < group.length - 1) showImage(current + 1); });
    viewer.addEventListener("keydown", function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (event.key === "ArrowLeft" && current > 0) { event.preventDefault(); showImage(current - 1); }
      if (event.key === "ArrowRight" && current < group.length - 1) { event.preventDefault(); showImage(current + 1); }
    });
    viewer.addEventListener("close", function () {
      document.documentElement.classList.remove("viewer-open");
      if (opener) opener.focus({ preventScroll: true });
    });
    document.querySelectorAll(".screenshot-link, .admin-shots a").forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = link;
        group = Array.from(link.closest(".shot-grid").querySelectorAll(".screenshot-link, .admin-shots a"));
        showImage(group.indexOf(link));
        viewer.showModal();
        document.documentElement.classList.add("viewer-open");
        viewer.querySelector(".viewer-stage").scrollTo(0, 0);
      });
    });
    document.getElementById("viewer-close").addEventListener("click", function () { viewer.close(); });
    zoom.addEventListener("click", function () {
      var native = viewer.classList.toggle("native-size");
      zoom.setAttribute("aria-pressed", String(native));
      zoom.textContent = native ? "适合窗口" : "原始尺寸";
    });
    viewer.addEventListener("click", function (event) { if (event.target === viewer) viewer.close(); });
  }

  // 年份
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
