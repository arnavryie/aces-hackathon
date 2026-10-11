import {
  HOVER_VOLUME,
  SELECT_VOLUME,
  bgMusic,
  buttonAt,
  fadeMusic,
  hoverSound,
  selectSound,
  syncMusicState,
  toggleMute,
  triggerHover,
  triggerSelect,
  unlockAudio,
  updateMuteUI,
} from "./shared/audio.js";
import {
  aboutOverlay,
  buttons,
  creditsPanel,
  faqOverlay,
  levelButtons,
  levelSelectModal,
  problemDetail,
  psCards,
  psPage,
} from "./shared/dom.js";
import { startCreditsRoll } from "./sections/credits/controller.js";
import { action, choose } from "./shared/navigation.js";
import {
  closeLevelSelect,
  closeProblemDetail,
  closeProblems,
  openLevelSelect,
  openProblemDetail,
} from "./sections/problem-statements/controller.js";
import { closeFaqs } from "./sections/faqs/controller.js";
import { closeAbout } from "./sections/about/controller.js";
import { state } from "./shared/state.js";
import { initHomeVideo, stopHomeVideo } from "./sections/home/controller.js";
import { initFullscreen } from "./shared/fullscreen.js";
import { initPreloader } from "./sections/preloader/controller.js";

initPreloader();

bgMusic.loop = true;

bgMusic.preload = "auto";

bgMusic.volume = 0;

hoverSound.preload = "auto";

hoverSound.volume = HOVER_VOLUME;

selectSound.preload = "auto";

selectSound.volume = SELECT_VOLUME;

["pointerdown", "keydown", "click", "touchstart"].forEach((type) => {
  window.addEventListener(type, unlockAudio, { capture: true, once: true });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    fadeMusic(0, 200, () => {
      try {
        bgMusic.pause();
      } catch (_) {}
    });
  } else {
    syncMusicState();
  }
});

window.addEventListener("resize", () => {
  if (!creditsPanel.hidden) startCreditsRoll();
});

buttons.forEach((button, i) =>
  button.addEventListener("click", () => choose(i, true)),
);

document
  .querySelectorAll("[data-action]")
  .forEach((button) =>
    button.addEventListener("click", () => action(button.dataset.action)),
  );

document.querySelectorAll("[data-social][data-url]").forEach((button) =>
  button.addEventListener("click", () => {
    window.open(button.dataset.url, "_blank", "noopener,noreferrer");
  }),
);

document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (
    (event.key === "m" || event.key === "M") &&
    !event.target.closest("input,textarea")
  ) {
    event.preventDefault();
    toggleMute();
    return;
  }
  if (!problemDetail.hidden) {
    if (event.key === "Escape" || event.key === "Home") {
      event.preventDefault();
      closeProblemDetail();
      if (event.key === "Home") closeProblems();
    } else if (event.key === "Tab") {
      event.preventDefault();
      const focusables = Array.from(
        problemDetail.querySelectorAll(".ps-close, .ps-download-btn, .problem-description"),
      );
      const idx = focusables.indexOf(document.activeElement);
      const next = event.shiftKey
        ? focusables[(idx - 1 + focusables.length) % focusables.length]
        : focusables[(idx + 1) % focusables.length];
      next?.focus();
    }
    return;
  }
  if (!levelSelectModal.hidden) {
    if (event.key === "Escape" || event.key === "Home") {
      event.preventDefault();
      closeLevelSelect();
      if (event.key === "Home") closeProblems();
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      state.activeChoice = 0;
      levelButtons[0]?.focus({ preventScroll: true });
    } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      state.activeChoice = 1;
      levelButtons[1]?.focus({ preventScroll: true });
    } else if (event.key === "Enter") {
      event.preventDefault();
      openProblemDetail(state.activeChoice);
    }
    return;
  }
  if (!faqOverlay.hidden) {
    if (event.key === "Escape" || event.key === "Home") {
      event.preventDefault();
      closeFaqs();
    } else if (event.key === "Tab") {
      event.preventDefault();
      const close = faqOverlay.querySelector(".faq-close");
      const content = faqOverlay.querySelector(".faq-scroll");
      (document.activeElement === close ? content : close).focus();
    }
    return;
  }
  if (aboutOverlay && !aboutOverlay.hidden) {
    if (event.key === "Escape" || event.key === "Home") {
      event.preventDefault();
      closeAbout();
    } else if (event.key === "Tab") {
      event.preventDefault();
      const close = aboutOverlay.querySelector(".faq-close");
      const content = aboutOverlay.querySelector(".faq-scroll");
      (document.activeElement === close ? content : close).focus();
    }
    return;
  }
  if (
    !psPage.hidden &&
    event.key === "Enter" &&
    !event.target.closest("button")
  ) {
    event.preventDefault();
    psCards[0].focus();
    return;
  }
  const keyActions = {
    ArrowUp: "prev",
    ArrowLeft: "prev",
    ArrowDown: "next",
    ArrowRight: "next",
    Escape: "back",
    Home: "home",
    "-": "sleep",
  };
  if (event.key === "Enter" && !event.target.closest("button,a")) {
    event.preventDefault();
    action("select");
    return;
  }
  if (keyActions[event.key]) {
    event.preventDefault();
    action(keyActions[event.key]);
  }
});

document.getElementById("help-button").setAttribute("aria-expanded", "false");

psCards.forEach((card) =>
  card.addEventListener("click", () => {
    psCards.forEach((other) =>
      other.setAttribute("aria-pressed", String(other === card)),
    );
    openLevelSelect(Number(card.dataset.problem));
  }),
);

levelButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    openProblemDetail(Number(btn.dataset.psChoice));
  }),
);

document.querySelectorAll(".level-dl-btn").forEach((btn) =>
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
  }),
);

document.addEventListener(
  "pointerdown",
  () => {
    state.keyboardNavigation = false;
  },
  true,
);

document.addEventListener("pointerover", (event) => {
  if (event.pointerType === "touch") return;
  const button = buttonAt(event.target);
  if (
    !button ||
    (event.relatedTarget instanceof Node &&
      button.contains(event.relatedTarget))
  )
    return;
  state.keyboardNavigation = false;
  triggerHover();
});

document.addEventListener("focusin", (event) => {
  if (state.keyboardNavigation && buttonAt(event.target)) triggerHover();
});

document.addEventListener(
  "click",
  (event) => {
    state.keyboardNavigation = false;
    if (buttonAt(event.target)) triggerSelect();
  },
  true,
);

document.addEventListener(
  "keydown",
  (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape" && state.isHomeVideoPlaying) {
      event.preventDefault();
      stopHomeVideo();
      return;
    }
    state.keyboardNavigation = true;
    if (event.repeat || event.target.closest(".controller")) return;
  },
  true,
);

updateMuteUI();

syncMusicState();

initHomeVideo();

initFullscreen();
