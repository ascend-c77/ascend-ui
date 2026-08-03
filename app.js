"use strict";

/**
 * ASCEND Headquarters UI
 * Read-only frontend controller.
 *
 * No wallet access.
 * No live trading.
 * No database writes.
 */

const ASCEND_STATE = {
  completion: 95,
  executionMode: "Paper only",
  liveTradingEnabled: false,
};

function updateClock() {
  const clock = document.getElementById("clock");

  if (!clock) {
    return;
  }

  clock.textContent = new Date().toLocaleTimeString("en-GB", {
    hour12: false,
  });
}

function initializeRoomSelection() {
  const rooms = document.querySelectorAll(".room");

  rooms.forEach((room) => {
    room.addEventListener("click", () => {
      rooms.forEach((item) => {
        item.classList.remove("active");
      });

      room.classList.add("active");
    });
  });
}

function enforcePaperOnlyMode() {
  document.documentElement.dataset.executionMode =
    ASCEND_STATE.executionMode;

  if (ASCEND_STATE.liveTradingEnabled) {
    console.error(
      "[ASCEND SECURITY] Live trading must remain disabled in the UI.",
    );
  }
}

function initializeHeadquarters() {
  updateClock();
  initializeRoomSelection();
  enforcePaperOnlyMode();

  window.setInterval(updateClock, 1000);

  console.log(
    `[ASCEND] Headquarters initialized — completion ${ASCEND_STATE.completion}% — paper only`,
  );
}

document.addEventListener("DOMContentLoaded", initializeHeadquarters);
