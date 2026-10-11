import { state } from "./state.js";
import { homeVideo, screen } from "./dom.js";

import themeMusicUrl from "../../assets/01-among-us-theme_hlItXaiw.mp3";

import hoverSoundUrl from "../../assets/ui-hover.mp3";

import selectSoundUrl from "../../assets/ui-select.mp3";

export const BG_VOLUME = 0.22;

export const BG_DUCK_VOLUME = 0.08;

export const HOVER_VOLUME = 0.38;

export const SELECT_VOLUME = 0.6;

export const bgMusic = new Audio(themeMusicUrl);

export const hoverSound = new Audio(hoverSoundUrl);

export const selectSound = new Audio(selectSoundUrl);

export function updateMuteUI() {
  const muteBtn = document.getElementById("mute-button");
  if (!muteBtn) return;
  muteBtn.classList.toggle("is-muted", state.isMuted);
  muteBtn.setAttribute("aria-pressed", String(state.isMuted));
  muteBtn.setAttribute(
    "aria-label",
    state.isMuted ? "Unmute all audio" : "Mute all audio",
  );
  muteBtn.setAttribute(
    "title",
    state.isMuted ? "Unmute Audio (M)" : "Mute Audio (M)",
  );
}

export function toggleMute() {
  state.isMuted = !state.isMuted;
  updateMuteUI();
  if (homeVideo) homeVideo.muted = state.isMuted;
  if (state.isMuted) {
    fadeMusic(0, 180, () => {
      try {
        bgMusic.pause();
      } catch (_) {}
    });
  } else {
    if (!state.isHomeVideoPlaying) {
      syncMusicState();
      triggerSelect();
    }
  }
}

export function isSiteActive() {
  return (
    !state.isPreloaderActive &&
    !screen.classList.contains("sleeping") &&
    document.visibilityState !== "hidden"
  );
}

export function fadeMusic(targetVol, duration = 300, onComplete) {
  if (state.fadeTimer) {
    clearInterval(state.fadeTimer);
    state.fadeTimer = null;
  }
  const startVol = bgMusic.volume;
  const clampedTarget = Math.max(0, Math.min(1, targetVol));
  if (Math.abs(clampedTarget - startVol) < 0.01) {
    bgMusic.volume = clampedTarget;
    if (onComplete) onComplete();
    return;
  }
  const steps = 12;
  const intervalTime = Math.max(10, Math.floor(duration / steps));
  let step = 0;
  state.fadeTimer = setInterval(() => {
    step++;
    const progress = step / steps;
    bgMusic.volume = Math.max(
      0,
      Math.min(1, startVol + (clampedTarget - startVol) * progress),
    );
    if (step >= steps) {
      clearInterval(state.fadeTimer);
      state.fadeTimer = null;
      bgMusic.volume = clampedTarget;
      if (onComplete) onComplete();
    }
  }, intervalTime);
}

export function playBgMusic() {
  if (state.isMuted || !isSiteActive()) return;
  if (bgMusic.paused) {
    bgMusic.volume = 0;
    const playPromise = bgMusic.play();
    if (playPromise) {
      playPromise
        .then(() => {
          fadeMusic(BG_VOLUME, 400);
        })
        .catch(() => {
          // Autoplay blocked by browser policy; armed on window gesture
        });
    }
  } else if (Math.abs(bgMusic.volume - BG_VOLUME) > 0.02 && !state.duckTimer) {
    fadeMusic(BG_VOLUME, 300);
  }
}

export function pauseBgMusic() {
  fadeMusic(0, 250, () => {
    if (state.isMuted || !isSiteActive()) {
      try {
        bgMusic.pause();
      } catch (_) {}
    }
  });
}

export function syncMusicState() {
  if (state.isHomeVideoPlaying) {
    pauseBgMusic();
    return;
  }
  if (!state.isMuted && isSiteActive()) {
    playBgMusic();
  } else {
    pauseBgMusic();
  }
}

export function duckMusic() {
  if (state.isMuted || bgMusic.paused || !isSiteActive()) return;
  if (state.duckTimer) clearTimeout(state.duckTimer);
  if (state.fadeTimer) {
    clearInterval(state.fadeTimer);
    state.fadeTimer = null;
  }
  bgMusic.volume = BG_DUCK_VOLUME;
  state.duckTimer = setTimeout(() => {
    state.duckTimer = null;
    if (!state.isMuted && isSiteActive() && !bgMusic.paused) {
      fadeMusic(BG_VOLUME, 250);
    }
  }, 220);
}

export function playSfx(audio) {
  if (state.isMuted) return;
  try {
    audio.pause();
    audio.currentTime = 0;
    const p = audio.play();
    if (p) p.catch(() => {});
  } catch (_) {}
}

export function triggerHover() {
  const now = performance.now();
  if (now - state.lastHover < 70) return;
  state.lastHover = now;
  playSfx(hoverSound);
}

export function triggerSelect() {
  try {
    hoverSound.pause();
    hoverSound.currentTime = 0;
  } catch (_) {}
  duckMusic();
  playSfx(selectSound);
}

export function buttonAt(target) {
  const button =
    target instanceof Element
      ? target.closest("button, a.ps-download-btn, a.level-dl-btn")
      : null;
  return button &&
    screen.contains(button) &&
    !button.disabled &&
    button.getAttribute("aria-disabled") !== "true"
    ? button
    : null;
}

export function unlockAudio() {
  ["pointerdown", "keydown", "click", "touchstart"].forEach((type) => {
    window.removeEventListener(type, unlockAudio, true);
  });
  if (!state.isMuted && isSiteActive()) {
    playBgMusic();
  }
}
