/**
 * Fullscreen & Landscape Enforcement for Phones & Tablets
 * Shows a full-screen pop-up on mobile/tablet devices prompting them
 * to enter fullscreen landscape mode (on Android/supported devices)
 * or landscape mode (on iPhones/iOS where element fullscreen is unavailable).
 * Desktops and laptops never see this popup.
 */

export function isMobileOrTablet() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
      ua,
    );
  const isIPad =
    (navigator.platform === "MacIntel" || ua.includes("Macintosh")) &&
    navigator.maxTouchPoints > 1;
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const hasCoarsePointer =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const hasFinePointerWithHover =
    window.matchMedia &&
    window.matchMedia("(pointer: fine) and (hover: hover)").matches;

  // Direct mobile/tablet matching
  if (isMobileUA || isIPad) {
    return true;
  }

  // Pure touch screen device without mouse/hover capability
  if (isTouchDevice && hasCoarsePointer && !hasFinePointerWithHover) {
    return true;
  }

  return false;
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOSDevice = /iPhone|iPad|iPod/i.test(ua);
  const isIPadOS =
    (navigator.platform === "MacIntel" || ua.includes("Macintosh")) &&
    navigator.maxTouchPoints > 1;
  return isIOSDevice || isIPadOS;
}

export function isFullscreen() {
  return Boolean(
    document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement,
  );
}

export function supportsFullscreen() {
  if (typeof document === "undefined") return false;
  // iOS (especially iPhones) does NOT support element-level Fullscreen API in Safari
  if (isIOS()) {
    const el = document.documentElement;
    return Boolean(
      (document.fullscreenEnabled && el?.requestFullscreen) ||
        (document.webkitFullscreenEnabled && el?.webkitRequestFullscreen),
    );
  }
  return Boolean(
    document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled ||
      document.documentElement?.requestFullscreen ||
      document.documentElement?.webkitRequestFullscreen,
  );
}

export function isLandscape() {
  if (typeof window === "undefined") return true;
  if (
    window.matchMedia &&
    window.matchMedia("(orientation: landscape)").matches
  ) {
    return true;
  }
  if (
    typeof screen !== "undefined" &&
    screen.orientation &&
    screen.orientation.type
  ) {
    return screen.orientation.type.startsWith("landscape");
  }
  if (typeof window.orientation !== "undefined") {
    return Math.abs(window.orientation) === 90;
  }
  return window.innerWidth > window.innerHeight;
}

export async function requestFullscreen(element = document.documentElement) {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    }
  } catch (_) {}

  // Attempt forceful orientation lock to landscape (supported on Android/Chrome)
  if (screen.orientation && typeof screen.orientation.lock === "function") {
    screen.orientation.lock("landscape").catch(() => {});
  }
}

export function updatePopupVisibility() {
  const popup = document.getElementById("fullscreen-popup");
  if (!popup) return;

  // Rule 1: PC, Windows, and Laptops NEVER see this popup
  if (!isMobileOrTablet()) {
    popup.hidden = true;
    popup.style.display = "none";
    document.body.classList.remove("has-fullscreen-popup");
    return;
  }

  const inLandscape = isLandscape();
  const canFullscreen = supportsFullscreen();
  const inFullscreen = isFullscreen();

  // Rule 2: Devices without Fullscreen API support (such as iPhone):
  // When in landscape mode, they can immediately view and play without fullscreen blocking!
  if (!canFullscreen) {
    if (inLandscape) {
      popup.hidden = true;
      popup.style.display = "none";
      document.body.classList.remove("has-fullscreen-popup");
    } else {
      // In portrait on iPhone, guide user to rotate sideways
      const title = document.getElementById("popup-title");
      const desc = popup.querySelector(".popup-desc");
      const btnSpan = popup.querySelector(".popup-action-btn span");
      if (title) title.textContent = "ROTATE TO LANDSCAPE";
      if (desc) {
        desc.innerHTML =
          "This handheld console requires <strong>Landscape</strong> mode for proper display and controls. Rotate your iPhone sideways to enter.";
      }
      if (btnSpan) btnSpan.textContent = "ROTATE SCREEN";

      popup.hidden = false;
      popup.style.display = "flex";
      document.body.classList.add("has-fullscreen-popup");
    }
    return;
  }

  // Rule 3: Devices that DO support Fullscreen (Android, etc.):
  // If already in fullscreen AND in landscape: hide popup!
  if (inFullscreen && inLandscape) {
    popup.hidden = true;
    popup.style.display = "none";
    document.body.classList.remove("has-fullscreen-popup");
  } else {
    // Show popup to force/guide them into fullscreen landscape
    popup.hidden = false;
    popup.style.display = "flex";
    document.body.classList.add("has-fullscreen-popup");
  }
}

export function initFullscreen() {
  const actionBtn = document.getElementById("popup-fullscreen-btn");

  const handleAction = async (e) => {
    e?.stopPropagation?.();
    if (supportsFullscreen()) {
      await requestFullscreen();
    } else {
      // iPhone / iOS: cannot enter element fullscreen;
      // scroll to minimize Safari bars and check landscape
      window.scrollTo(0, 1);
      if (isLandscape()) {
        const popup = document.getElementById("fullscreen-popup");
        if (popup) {
          popup.hidden = true;
          popup.style.display = "none";
          document.body.classList.remove("has-fullscreen-popup");
        }
      } else {
        const icon = document.querySelector(".popup-rotate-svg");
        if (icon) {
          icon.classList.remove("shake-hint");
          void icon.offsetWidth;
          icon.classList.add("shake-hint");
        }
      }
    }
    // After entering fullscreen or rotating, update visibility
    setTimeout(updatePopupVisibility, 150);
    setTimeout(updatePopupVisibility, 400);
  };

  actionBtn?.addEventListener("click", handleAction);
  actionBtn?.addEventListener("touchend", handleAction);

  // Fullscreen change events across all vendor prefixes
  [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
  ].forEach((evt) => {
    document.addEventListener(evt, updatePopupVisibility);
  });

  // Orientation & resize changes
  if (screen.orientation) {
    screen.orientation.addEventListener("change", updatePopupVisibility);
  }
  window.addEventListener("orientationchange", updatePopupVisibility);
  window
    .matchMedia("(orientation: landscape)")
    .addEventListener("change", updatePopupVisibility);
  window.addEventListener("resize", updatePopupVisibility);
  window.addEventListener("pageshow", updatePopupVisibility);
  window.addEventListener("load", updatePopupVisibility);

  // Initial check
  updatePopupVisibility();
  setTimeout(updatePopupVisibility, 200);
}
