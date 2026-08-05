"use strict";

/**
 * ASCEND Headquarters
 * Public read-only operational controller.
 *
 * No wallet access.
 * No database writes.
 * No live trading. 
 */

const ASCEND_STATE = Object.freeze({
  completion: 95,
  executionMode: "Paper only",
  liveTradingEnabled: false,
});

let refreshTimer = null;

const numberFormatter = new Intl.NumberFormat("en-US");

const utcFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
});

function formatNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? numberFormatter.format(number)
    : "—";
}

function formatUtc(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown"
    : `${utcFormatter.format(date)} UTC`;
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

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
    throw new Error(
      "[ASCEND SECURITY] Live trading must remain disabled.",
    );
  }
}

function getConfig() {
  const config = window.ASCEND_CONFIG;

  if (!config?.supabaseUrl) {
    throw new Error("Supabase project URL is missing.");
  }

  if (!config?.supabaseAnonKey) {
    throw new Error("Supabase publishable key is missing.");
  }

  if (!config.paperOnly || config.liveTradingEnabled) {
    throw new Error("Unsafe frontend configuration detected.");
  }

  return config;
}

function installLivePanelStyles() {
  if (document.getElementById("ascend-live-panel-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "ascend-live-panel-styles";

  style.textContent = `
    #ascend-live-panel {
      margin: 24px 0;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(10,12,14,0.88);
      padding: 20px;
    }

    .ascend-live-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .ascend-live-title {
      margin: 0;
      font-size: 14px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .ascend-live-state {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #9aa2a8;
    }

    .ascend-live-state.online {
      color: #8fb99d;
    }

    .ascend-live-state.error {
      color: #c98e8e;
    }

    .ascend-live-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.1);
    }

    .ascend-live-item {
      min-width: 0;
      background: #0d1012;
      padding: 16px;
    }

    .ascend-live-label {
      display: block;
      margin-bottom: 8px;
      color: #8d959b;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .ascend-live-value {
      display: block;
      overflow: hidden;
      font-size: 21px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ascend-live-meta {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 16px;
      color: #8d959b;
      font-size: 11px;
    }

    .ascend-live-meta strong {
      display: block;
      margin-top: 5px;
      color: #d7dcdf;
      font-weight: 500;
    }

    @media (max-width: 900px) {
      .ascend-live-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .ascend-live-meta {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 520px) {
      .ascend-live-grid {
        grid-template-columns: 1fr;
      }

      .ascend-live-header {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `;

  document.head.appendChild(style);
}

function createLivePanel() {
  if (document.getElementById("ascend-live-panel")) {
    return;
  }

  installLivePanelStyles();

  const panel = document.createElement("section");
  panel.id = "ascend-live-panel";

  panel.innerHTML = `
    <div class="ascend-live-header">
      <h2 class="ascend-live-title">Live Operations</h2>
      <span
        id="ascend-data-state"
        class="ascend-live-state"
      >
        Connecting
      </span>
    </div>

    <div class="ascend-live-grid">
      <div class="ascend-live-item">
        <span class="ascend-live-label">Total Tokens</span>
        <strong
          id="ascend-total-tokens"
          class="ascend-live-value"
        >—</strong>
      </div>

      <div class="ascend-live-item">
        <span class="ascend-live-label">Solana Tokens</span>
        <strong
          id="ascend-solana-tokens"
          class="ascend-live-value"
        >—</strong>
      </div>

      <div class="ascend-live-item">
        <span class="ascend-live-label">EVM Tokens</span>
        <strong
          id="ascend-evm-tokens"
          class="ascend-live-value"
        >—</strong>
      </div>

      <div class="ascend-live-item">
        <span class="ascend-live-label">DB-Active Chains</span>
        <strong
          id="ascend-active-chains"
          class="ascend-live-value"
        >—</strong>
      </div>

      <div class="ascend-live-item">
        <span class="ascend-live-label">Snapshots / Hour</span>
        <strong
          id="ascend-snapshots-hour"
          class="ascend-live-value"
        >—</strong>
      </div>

      <div class="ascend-live-item">
        <span class="ascend-live-label">Pending Jobs</span>
        <strong
          id="ascend-pending-jobs"
          class="ascend-live-value"
        >—</strong>
      </div>

      <div class="ascend-live-item">
        <span class="ascend-live-label">Failed Jobs</span>
        <strong
          id="ascend-failed-jobs"
          class="ascend-live-value"
        >—</strong>
      </div>

      <div class="ascend-live-item">
        <span class="ascend-live-label">Expired Jobs</span>
        <strong
          id="ascend-expired-jobs"
          class="ascend-live-value"
        >—</strong>
      </div>
    </div>

    <div class="ascend-live-meta">
      <div>
        Newest Solana token
        <strong id="ascend-newest-token">—</strong>
      </div>

      <div>
        Latest Solana snapshot
        <strong id="ascend-latest-snapshot">—</strong>
      </div>

      <div>
        Data generated
        <strong id="ascend-generated-at">—</strong>
      </div>
    </div>
  `;

  const target =
    document.querySelector(".command-center") ||
    document.querySelector(".main-content") ||
    document.querySelector("main") ||
    document.body;

  target.appendChild(panel);
}

async function fetchAscendStatus() {
  const config = getConfig();

  const baseUrl = config.supabaseUrl.replace(/\/+$/, "");

  const endpoint = new URL(
    `${baseUrl}/rest/v1/ascend_ui_status`,
  );

  endpoint.searchParams.set("select", "*");

  const controller = new AbortController();

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, 10000);

  try {
    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        apikey: config.supabaseAnonKey,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `Supabase returned ${response.status}: ${body}`,
      );
    }

    const rows = await response.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("Status view returned no rows.");
    }

    return rows[0];
  } finally {
    window.clearTimeout(timeout);
  }
}

function renderStatus(status) {
  setText(
    "ascend-total-tokens",
    formatNumber(status.total_tokens),
  );

  setText(
    "ascend-solana-tokens",
    formatNumber(status.solana_tokens),
  );

  setText(
    "ascend-evm-tokens",
    formatNumber(status.evm_tokens),
  );

  setText(
    "ascend-active-chains",
    `${formatNumber(status.active_chains)}/${formatNumber(
      status.configured_chains,
    )}`,
  );

  setText(
    "ascend-snapshots-hour",
    formatNumber(status.solana_snapshots_last_hour),
  );

  setText(
    "ascend-pending-jobs",
    formatNumber(status.pending_snapshot_jobs),
  );

  setText(
    "ascend-failed-jobs",
    formatNumber(status.failed_snapshot_jobs),
  );

  setText(
    "ascend-expired-jobs",
    formatNumber(status.expired_snapshot_jobs),
  );

  setText(
    "ascend-newest-token",
    formatUtc(status.newest_solana_token),
  );

  setText(
    "ascend-latest-snapshot",
    formatUtc(status.latest_solana_snapshot),
  );

  setText(
    "ascend-generated-at",
    formatUtc(status.generated_at),
  );

  const originalTokenCount =
    document.getElementById("solana-token-count");

  if (originalTokenCount) {
    originalTokenCount.textContent =
      formatNumber(status.solana_tokens);
  }

  const state = document.getElementById("ascend-data-state");

  if (state) {
    state.textContent = status.paper_only
      ? "Live · Paper Only"
      : "Unsafe Execution State";

    state.className = "ascend-live-state online";
  }

  const modeBadge = document.querySelector(".mode-badge");

  if (modeBadge) {
    modeBadge.textContent = status.paper_only
      ? "Paper Research Mode"
      : "Unsafe Execution State";
  }

  const completion =
    document.querySelector(".sidebar-footer strong");

  if (
    completion &&
    status.completion_percent !== undefined
  ) {
    completion.textContent =
      `${formatNumber(status.completion_percent)}%`;
  }

  document.documentElement.dataset.dataState = "online";
  document.documentElement.dataset.lastRefresh =
    new Date().toISOString();

  console.log("[ASCEND] Live operations synchronized", status);
}

function renderConnectionError(error) {
  const state = document.getElementById("ascend-data-state");

  if (state) {
    state.textContent = "Connection Error";
    state.className = "ascend-live-state error";
  }

  document.documentElement.dataset.dataState = "error";

  console.error(
    "[ASCEND] Live operations synchronization failed:",
    error,
  );
}

async function loadAscendStatus() {
  try {
    const status = await fetchAscendStatus();
    renderStatus(status);
  } catch (error) {
    renderConnectionError(error);
  }
}

function scheduleRefresh() {
  window.clearTimeout(refreshTimer);

  const interval =
    window.ASCEND_CONFIG?.refreshIntervalMs ?? 60000;

  refreshTimer = window.setTimeout(async () => {
    await loadAscendStatus();
    scheduleRefresh();
  }, interval);
}

async function initializeHeadquarters() {
  updateClock();
  initializeRoomSelection();
  enforcePaperOnlyMode();
  createLivePanel();

  window.setInterval(updateClock, 1000);

  await loadAscendStatus();
  scheduleRefresh();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadAscendStatus();
    }
  });

  window.addEventListener("online", loadAscendStatus);

  console.log(
    `[ASCEND] Headquarters initialized — completion ${ASCEND_STATE.completion}% — paper only`,
  );
}

document.addEventListener(
  "DOMContentLoaded",
  initializeHeadquarters,
);
