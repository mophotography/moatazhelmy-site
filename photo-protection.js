/* Photo protection: deter casual image saving without interrupting gallery clicks.
   Note: this cannot prevent screenshots, screen recording, or direct asset access. */
(function () {
  "use strict";

  function isElement(node) {
    return !!node && node.nodeType === 1;
  }

  function protectImage(img) {
    img.setAttribute("draggable", "false");
    img.draggable = false;
    img.style.userSelect = "none";
    img.style.webkitUserSelect = "none";
    img.style.webkitUserDrag = "none";
    img.style.webkitTouchCallout = "none";
  }

  document.querySelectorAll("img").forEach(protectImage);

  document.addEventListener("contextmenu", function (event) {
    if (!isElement(event.target)) return;
    if (event.target.closest("img, picture, .ph, .client-card-image")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  document.addEventListener("dragstart", function (event) {
    if (!isElement(event.target)) return;
    if (event.target.closest("img, picture")) {
      event.preventDefault();
    }
  }, true);

  document.addEventListener("selectstart", function (event) {
    if (!isElement(event.target)) return;
    if (event.target.closest("img, picture")) {
      event.preventDefault();
    }
  }, true);

  if ("MutationObserver" in window && document.documentElement) {
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (!isElement(node)) return;
          if (node.matches("img")) protectImage(node);
          if (node.querySelectorAll) {
            node.querySelectorAll("img").forEach(protectImage);
          }
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();