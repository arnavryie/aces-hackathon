import { domainList } from "./data.js";
import { missionCharacters } from "./characters/index.js";
import { renderProblemSections } from "./render-content.js";
import { state } from "../../shared/state.js";
import {
  aboutOverlay,
  buttons,
  faqOverlay,
  guide,
  notice,
  problemDetail,
  psCards,
  psPage,
  levelSelectModal,
  levelButtons,
} from "../../shared/dom.js";
import { choose, setHomeInert } from "../../shared/navigation.js";
import { syncMusicState } from "../../shared/audio.js";

export function getProblemDocxInfo(domainIndex, choiceIndex) {
  const domain = domainList[domainIndex];
  if (!domain) return null;
  const problem = domain.problems?.[choiceIndex];
  if (problem?.docxFile && problem?.docxPath) {
    return { filename: problem.docxFile, path: problem.docxPath };
  }
  const domainNameMap = {
    fintech: "PS Fintech",
    legal: "PS Legal",
    healthcare: "PS Healthcare",
    spacetech: "PS SpaceTech",
    agritech: "PS AgriTech",
  };
  const key = (domain.name || domain.code || "").toLowerCase();
  const prefix = domainNameMap[key] || `PS ${domain.name}`;
  const filename = `${prefix} - Problem Statement ${choiceIndex + 1}.docx`;
  return {
    filename,
    path: `/assets/ps-docs/${encodeURIComponent(filename)}`,
  };
}

export function openLevelSelect(domainIndex) {
  const domain = domainList[domainIndex];
  if (!domain) return;
  state.activeDomain = domainIndex;

  const domainTag = document.getElementById("level-domain-tag");
  if (domainTag) domainTag.textContent = `DOMAIN ${domainIndex + 1} // ${domain.name.toUpperCase()}`;

  const ps0Name = document.getElementById("level-ps-0-name");
  if (ps0Name) ps0Name.textContent = domain.problems[0]?.name || "";

  const ps1Name = document.getElementById("level-ps-1-name");
  if (ps1Name) ps1Name.textContent = domain.problems[1]?.name || "";

  const dl0 = getProblemDocxInfo(domainIndex, 0);
  const dl1 = getProblemDocxInfo(domainIndex, 1);
  const dlBtn0 = document.getElementById("level-ps-0-download");
  const dlBtn1 = document.getElementById("level-ps-1-download");
  if (dlBtn0 && dl0) {
    dlBtn0.href = dl0.path;
    dlBtn0.setAttribute("download", dl0.filename);
  }
  if (dlBtn1 && dl1) {
    dlBtn1.href = dl1.path;
    dlBtn1.setAttribute("download", dl1.filename);
  }

  levelSelectModal.hidden = false;
  const firstLevelBtn = levelSelectModal.querySelector(".level-btn");
  if (firstLevelBtn) firstLevelBtn.focus({ preventScroll: true });
}

export function closeLevelSelect() {
  levelSelectModal.hidden = true;
  if (psCards[state.activeDomain]) {
    psCards[state.activeDomain].focus({ preventScroll: true });
  }
}

export function openProblemDetail(choiceIndex) {
  state.activeChoice = choiceIndex;
  const domain = domainList[state.activeDomain];
  if (!domain) return;
  const problem = domain.problems[choiceIndex];
  if (!problem) return;

  document.getElementById("problem-detail-title").textContent =
    "Problem Statement " + problem.problemNum + ":";
  document.getElementById("problem-domain-label").textContent = domain.name;
  document.getElementById("problem-name").textContent = problem.name;
  renderProblemSections(
    document.getElementById("problem-sections"),
    problem.sections,
  );

  const downloadInfo = getProblemDocxInfo(state.activeDomain, choiceIndex);
  const downloadBtn = document.getElementById("problem-download-btn");
  if (downloadBtn && downloadInfo) {
    downloadBtn.href = downloadInfo.path;
    downloadBtn.setAttribute("download", downloadInfo.filename);
  }

  const character = missionCharacters[state.activeDomain * 2 + choiceIndex];
  const characterImage = document.getElementById("problem-character-image");
  characterImage.src = character.src;
  characterImage.alt = character.alt;
  document.getElementById("problem-character-label").textContent = character.name;
  document.getElementById("problem-character-domain").textContent =
    `${domain.name} / ${problem.problemNum}`;

  levelSelectModal.hidden = true;
  psPage.inert = true;
  setHomeInert(true);
  problemDetail.hidden = false;
  problemDetail.querySelector(".problem-description").scrollTop = 0;
  problemDetail.querySelector(".ps-close").focus({ preventScroll: true });
}

export function closeProblemDetail() {
  problemDetail.hidden = true;
  psPage.inert = false;
  setHomeInert(false);
  levelSelectModal.hidden = false;
  const activeLevelBtn = levelButtons[state.activeChoice] || levelButtons[0];
  if (activeLevelBtn) {
    activeLevelBtn.focus({ preventScroll: true });
  }
}

export function closeProblems() {
  levelSelectModal.hidden = true;
  problemDetail.hidden = true;
  psPage.hidden = true;
  choose(0);
  buttons[0].focus({ preventScroll: true });
  syncMusicState();
}

export function openProblems() {
  notice.hidden = true;
  guide.hidden = true;
  if (aboutOverlay) aboutOverlay.hidden = true;
  faqOverlay.hidden = true;
  levelSelectModal.hidden = true;
  problemDetail.hidden = true;
  psPage.hidden = false;
  state.activeDomain = 0;
  psCards.forEach((card) => card.setAttribute("aria-pressed", "false"));
  psPage.querySelector(".ps-scroll").scrollTop = 0;
  psPage.querySelector(".ps-close").focus({ preventScroll: true });
  syncMusicState();
}
