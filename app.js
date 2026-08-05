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

async function loadAscendStatus() {
  const config = window.ASCEND_CONFIG;
  const tokenCount = document.getElementById("solana-token-count");

  if (!config?.supabaseUrl || !config?.supabaseAnonKey || !tokenCount) {
    return;
  }

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/ascend_ui_status?select=solana_tokens`,
    {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`ASCEND status request failed: ${response.status}`);
  }

  const [status] = await response.json();

  if (status?.solana_tokens !== undefined) {
    tokenCount.textContent = Number(status.solana_tokens).toLocaleString(
      "en-US",
    );
  }
}

function initializeHeadquarters() {
  updateClock();
  initializeRoomSelection();
  enforcePaperOnlyMode();

  loadAscendStatus().catch((error) => {
    console.error("[ASCEND] Failed to load live status:", error);
  });

  window.setInterval(updateClock, 1000);

  window.setInterval(() => {
    loadAscendStatus().catch((error) => {
      console.error("[ASCEND] Failed to refresh live status:", error);
    });
  }, window.ASCEND_CONFIG?.refreshIntervalMs ?? 60_000);

  console.log(
    `[ASCEND] Headquarters initialized — completion ${ASCEND_STATE.completion}% — paper only`,
  );
}

document.addEventListener("DOMContentLoaded", initializeHeadquarters);
