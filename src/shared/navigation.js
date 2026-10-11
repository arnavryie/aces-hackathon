import {
  aboutOverlay,
  buttons,
  creditsPanel,
  faqOverlay,
  guide,
  notice,
  prizePage,
  problemDetail,
  levelSelectModal,
  levelButtons,
  psCards,
  psPage,
  screen,
} from "./dom.js";
import {
  closeCredits,
  creditsPlayback,
  openCredits,
} from "../sections/credits/controller.js";
import { state } from "./state.js";
import { playHomeVideo, stopHomeVideo } from "../sections/home/controller.js";
import { closeAbout, openAbout } from "../sections/about/controller.js";
import { closeFaqs, openFaqs } from "../sections/faqs/controller.js";
import { closePrizes, openPrizes } from "../sections/prize-pool/controller.js";
import {
  closeLevelSelect,
  closeProblemDetail,
  closeProblems,
  openLevelSelect,
  openProblemDetail,
  openProblems,
} from "../sections/problem-statements/controller.js";
import { syncMusicState, toggleMute } from "./audio.js";

export function setHomeInert(value) {
  document.querySelector(".game-topbar").inert = value;
  document.querySelector(".game-layout").inert = value;
}

export function showNotice(text) {
  document.getElementById("notice-text").textContent = text;
  notice.hidden = false;
}

export function choose(index, activate = false) {
  if (activate) closeCredits();
  state.selected = (index + buttons.length) % buttons.length;
  buttons.forEach((button, i) => {
    button.classList.toggle("selected", i === state.selected);
    if (i === state.selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  notice.hidden = true;
  if (activate && state.selected === 0) {
    playHomeVideo();
  } else if (activate && state.selected !== 0) {
    stopHomeVideo();
  }
  if (activate && state.selected === 4) {
    openAbout();
    return;
  }
  if (activate && state.selected === 3) {
    openFaqs();
    return;
  }
  if (activate && state.selected === 2) {
    openPrizes();
    return;
  }
  if (activate && state.selected === 1) {
    openProblems();
    return;
  }
  if (activate && state.selected !== 0)
    showNotice(buttons[state.selected].textContent + " — page coming next.");
  if (!state.isHomeVideoPlaying) syncMusicState();
}

export function action(name) {
  if (name === "close-prize") {
    closePrizes();
    return;
  }
  if (!prizePage.hidden && !["mute", "sleep", "quit"].includes(name)) {
    if (name === "home" || name === "back") closePrizes();
    return;
  }
  if (name === "close-detail") {
    closeProblemDetail();
    return;
  }
  if (!problemDetail.hidden) {
    if (name === "back") closeProblemDetail();
    else if (name === "home") {
      closeProblemDetail();
      closeProblems();
    } else if (name === "next" || name === "prev")
      problemDetail
        .querySelector(".problem-description")
        .scrollBy({ top: name === "next" ? 150 : -150, behavior: "smooth" });
    return;
  }
  if (name === "close-credits") {
    closeCredits();
    choose(0);
    buttons[0].focus({ preventScroll: true });
    return;
  }
  if (name === "credits-playback") {
    creditsPlayback();
    return;
  }
  if (!creditsPanel.hidden && (name === "home" || name === "back")) {
    closeCredits();
    choose(0);
    return;
  }
  if (!creditsPanel.hidden && (name === "next" || name === "prev")) {
    if (state.creditsAnimation) {
      const duration = state.creditsAnimation.effect.getTiming().duration;
      state.creditsAnimation.currentTime = Math.max(
        0,
        Math.min(
          duration,
          Number(state.creditsAnimation.currentTime) +
            (name === "next" ? 3000 : -3000),
        ),
      );
    } else
      creditsPanel
        .querySelector(".credits-viewport")
        .scrollBy({ top: name === "next" ? 150 : -150, behavior: "smooth" });
    return;
  }
  if (name === "close-faq") {
    closeFaqs();
    return;
  }
  if (!faqOverlay.hidden) {
    if (name === "home" || name === "back") closeFaqs();
    else if (name === "next" || name === "prev")
      faqOverlay
        .querySelector(".faq-scroll")
        .scrollBy({ top: name === "next" ? 150 : -150, behavior: "smooth" });
    return;
  }
  if (name === "close-about") {
    closeAbout();
    return;
  }
  if (aboutOverlay && !aboutOverlay.hidden) {
    if (name === "home" || name === "back") closeAbout();
    else if (name === "next" || name === "prev")
      aboutOverlay
        .querySelector(".faq-scroll")
        .scrollBy({ top: name === "next" ? 150 : -150, behavior: "smooth" });
    return;
  }
  if (name === "close-ps") {
    closeProblems();
    return;
  }
  if (name === "close-level-select") {
    closeLevelSelect();
    return;
  }
  if (!levelSelectModal.hidden) {
    if (name === "home" || name === "back") {
      closeLevelSelect();
      return;
    }
    if (name === "next" || name === "prev") {
      state.activeChoice = state.activeChoice === 0 ? 1 : 0;
      levelButtons[state.activeChoice]?.focus({ preventScroll: true });
      return;
    }
    if (name === "select") {
      openProblemDetail(state.activeChoice);
      return;
    }
    return;
  }
  if (!psPage.hidden && (name === "home" || name === "back")) {
    closeProblems();
    return;
  }
  if (!psPage.hidden && name === "select") {
    openLevelSelect(state.activeProblem);
    return;
  }
  if (!psPage.hidden && (name === "next" || name === "prev")) {
    state.activeProblem =
      (state.activeProblem + (name === "next" ? 1 : -1) + psCards.length) %
      psCards.length;
    psCards.forEach((card, index) =>
      card.setAttribute("aria-pressed", String(index === state.activeProblem)),
    );
    psCards[state.activeProblem].focus({ preventScroll: true });
    psCards[state.activeProblem].scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
    return;
  }
  if (name === "sleep" || name === "quit") {
    screen.classList.toggle("sleeping");
    syncMusicState();
    return;
  }
  if (screen.classList.contains("sleeping")) {
    screen.classList.remove("sleeping");
    syncMusicState();
  }
  if (name === "prev") {
    choose(state.selected - 1);
    buttons[state.selected].focus({ preventScroll: true });
  }
  if (name === "next") {
    choose(state.selected + 1);
    buttons[state.selected].focus({ preventScroll: true });
  }
  if (name === "select") {
    choose(state.selected, true);
  }
  if (name === "home") {
    choose(0, true);
    guide.hidden = true;
    return;
  }
  if (name === "back") {
    if (state.isHomeVideoPlaying) {
      stopHomeVideo();
      return;
    }
    choose(0);
    guide.hidden = true;
    syncMusicState();
    return;
  }
  if (name === "dismiss") notice.hidden = true;
  if (name === "help") {
    guide.hidden = !guide.hidden;
    document
      .getElementById("help-button")
      .setAttribute("aria-expanded", String(!guide.hidden));
  }
  if (name === "register")
    window.open(
      "https://campusmeet.in/user/user_event-details.php?id=175",
      "_blank",
      "noopener,noreferrer",
    );
  if (name === "credits") openCredits();
  if (name === "mute" || name === "animation") {
    toggleMute();
    return;
  }
}
