"use strict";

/**
 * ASCEND Neural Core
 * Original cinematic holographic visualization.
 *
 * Visual only:
 * - No wallet access
 * - No trading
 * - No database writes
 * - Uses the existing read-only UI values
 */

(() => {
  const CORE_ID = "ascend-neural-core";
  const STYLE_ID = "ascend-neural-core-styles";

  let animationFrameId = null;
  let resizeObserver = null;
  let intersectionObserver = null;
  let isVisible = true;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${CORE_ID} {
        position: relative;
        min-height: 620px;
        margin: 0 0 28px;
        overflow: hidden;
        border: 1px solid rgba(79, 224, 255, 0.24);
        background:
          radial-gradient(
            circle at 50% 48%,
            rgba(22, 146, 190, 0.2),
            transparent 18%
          ),
          radial-gradient(
            circle at 50% 50%,
            rgba(3, 40, 58, 0.96),
            rgba(2, 10, 16, 0.98) 58%,
            #010508 100%
          );
        isolation: isolate;
      }

      #${CORE_ID}::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image:
          linear-gradient(
            rgba(83, 225, 255, 0.035) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(83, 225, 255, 0.035) 1px,
            transparent 1px
          );
        background-size: 34px 34px;
        mask-image:
          radial-gradient(circle, black 0%, transparent 82%);
      }

      #${CORE_ID}::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 5;
        pointer-events: none;
        background:
          linear-gradient(
            180deg,
            transparent 0%,
            rgba(103, 232, 255, 0.04) 48%,
            rgba(103, 232, 255, 0.14) 50%,
            rgba(103, 232, 255, 0.04) 52%,
            transparent 100%
          );
        background-size: 100% 180px;
        animation: ascend-core-scan 7s linear infinite;
        opacity: 0.65;
      }

      .ascend-core-canvas {
        position: absolute;
        inset: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
      }

      .ascend-core-interface {
        position: relative;
        z-index: 3;
        min-height: 620px;
        pointer-events: none;
      }

      .ascend-core-topline {
        position: absolute;
        top: 22px;
        right: 26px;
        left: 26px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
      }

      .ascend-core-title {
        margin: 0;
        color: #dffbff;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        text-shadow:
          0 0 10px rgba(83, 225, 255, 0.42);
      }

      .ascend-core-subtitle {
        display: block;
        margin-top: 7px;
        color: rgba(145, 202, 215, 0.72);
        font-size: 10px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .ascend-core-status {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #7ff0bd;
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .ascend-core-status::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #70edb5;
        box-shadow:
          0 0 7px #70edb5,
          0 0 18px rgba(112, 237, 181, 0.55);
        animation: ascend-core-pulse 1.8s ease-in-out infinite;
      }

      .ascend-core-reticle {
        position: absolute;
        top: 50%;
        left: 50%;
        width: min(46vw, 430px);
        aspect-ratio: 1;
        transform: translate(-50%, -50%);
        border-radius: 50%;
      }

      .ascend-core-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 1px solid rgba(85, 228, 255, 0.28);
        box-shadow:
          inset 0 0 24px rgba(70, 214, 255, 0.035),
          0 0 18px rgba(70, 214, 255, 0.08);
      }

      .ascend-core-ring::before,
      .ascend-core-ring::after {
        content: "";
        position: absolute;
        inset: 8%;
        border-radius: 50%;
        border:
          1px dashed rgba(91, 231, 255, 0.2);
      }

      .ascend-core-ring::after {
        inset: 19%;
        border-style: solid;
        border-color:
          rgba(91, 231, 255, 0.12);
      }

      .ascend-core-ring-a {
        animation: ascend-core-rotate 24s linear infinite;
      }

      .ascend-core-ring-b {
        inset: 10%;
        border-color: rgba(91, 231, 255, 0.17);
        animation: ascend-core-rotate-reverse 17s linear infinite;
      }

      .ascend-core-ring-c {
        inset: 26%;
        border:
          2px solid rgba(124, 239, 255, 0.38);
        box-shadow:
          0 0 17px rgba(82, 223, 255, 0.16),
          inset 0 0 19px rgba(82, 223, 255, 0.08);
        animation: ascend-core-breathe 3.8s ease-in-out infinite;
      }

      .ascend-core-axis {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 112%;
        height: 1px;
        background:
          linear-gradient(
            90deg,
            transparent,
            rgba(91, 231, 255, 0.38),
            transparent
          );
        transform: translate(-50%, -50%);
      }

      .ascend-core-axis-y {
        transform:
          translate(-50%, -50%)
          rotate(90deg);
      }

      .ascend-core-center-label {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 140px;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .ascend-core-center-label strong {
        display: block;
        color: #e7fcff;
        font-size: 23px;
        letter-spacing: 0.14em;
        text-shadow:
          0 0 9px rgba(103, 232, 255, 0.65),
          0 0 25px rgba(103, 232, 255, 0.25);
      }

      .ascend-core-center-label span {
        display: block;
        margin-top: 8px;
        color: rgba(133, 205, 220, 0.75);
        font-size: 9px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      .ascend-core-panel {
        position: absolute;
        width: 220px;
        padding: 13px 14px 14px;
        border:
          1px solid rgba(91, 231, 255, 0.25);
        background:
          linear-gradient(
            135deg,
            rgba(5, 34, 45, 0.76),
            rgba(2, 13, 19, 0.86)
          );
        box-shadow:
          inset 0 0 20px rgba(68, 216, 255, 0.04),
          0 0 18px rgba(68, 216, 255, 0.05);
        backdrop-filter: blur(7px);
      }

      .ascend-core-panel::before {
        content: "";
        position: absolute;
        top: -1px;
        left: -1px;
        width: 24px;
        height: 24px;
        border-top:
          1px solid rgba(116, 239, 255, 0.84);
        border-left:
          1px solid rgba(116, 239, 255, 0.84);
      }

      .ascend-core-panel::after {
        content: "";
        position: absolute;
        right: -1px;
        bottom: -1px;
        width: 24px;
        height: 24px;
        border-right:
          1px solid rgba(116, 239, 255, 0.52);
        border-bottom:
          1px solid rgba(116, 239, 255, 0.52);
      }

      .ascend-core-panel-left {
        top: 25%;
        left: 3.5%;
      }

      .ascend-core-panel-right {
        top: 27%;
        right: 3.5%;
      }

      .ascend-core-panel-bottom-left {
        bottom: 8%;
        left: 8%;
      }

      .ascend-core-panel-bottom-right {
        right: 8%;
        bottom: 8%;
      }

      .ascend-core-panel-label {
        display: block;
        color: rgba(119, 212, 229, 0.75);
        font-size: 9px;
        letter-spacing: 0.17em;
        text-transform: uppercase;
      }

      .ascend-core-panel-value {
        display: block;
        margin-top: 9px;
        color: #e6fcff;
        font-size: 22px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-shadow:
          0 0 10px rgba(91, 231, 255, 0.25);
      }

      .ascend-core-panel-meta {
        display: block;
        margin-top: 6px;
        color: rgba(126, 174, 187, 0.72);
        font-size: 10px;
      }

      .ascend-core-signal {
        display: grid;
        grid-template-columns: repeat(14, 1fr);
        gap: 3px;
        height: 28px;
        margin-top: 12px;
        align-items: end;
      }

      .ascend-core-signal span {
        display: block;
        min-height: 3px;
        background:
          linear-gradient(
            180deg,
            #a7f7ff,
            #39badb
          );
        box-shadow:
          0 0 6px rgba(79, 224, 255, 0.35);
        animation:
          ascend-core-signal 1.5s ease-in-out infinite alternate;
      }

      .ascend-core-orbit-label {
        position: absolute;
        padding: 5px 8px;
        border:
          1px solid rgba(91, 231, 255, 0.17);
        background: rgba(2, 15, 21, 0.72);
        color: rgba(162, 231, 242, 0.76);
        font-size: 8px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      }

      .ascend-core-orbit-label-a {
        top: 18%;
        left: 43%;
      }

      .ascend-core-orbit-label-b {
        top: 48%;
        right: 19%;
      }

      .ascend-core-orbit-label-c {
        bottom: 22%;
        left: 21%;
      }

      .ascend-core-footer {
        position: absolute;
        right: 24px;
        bottom: 18px;
        left: 24px;
        display: flex;
        justify-content: space-between;
        gap: 18px;
        color: rgba(127, 183, 196, 0.65);
        font-size: 8px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      }

      @keyframes ascend-core-scan {
        from {
          background-position: 0 -180px;
        }

        to {
          background-position: 0 calc(100% + 180px);
        }
      }

      @keyframes ascend-core-rotate {
        from {
          transform: rotate(0deg);
        }

        to {
          transform: rotate(360deg);
        }
      }

      @keyframes ascend-core-rotate-reverse {
        from {
          transform: rotate(360deg);
        }

        to {
          transform: rotate(0deg);
        }
      }

      @keyframes ascend-core-breathe {
        0%,
        100% {
          opacity: 0.58;
          transform: scale(0.96);
        }

        50% {
          opacity: 1;
          transform: scale(1.04);
        }
      }

      @keyframes ascend-core-pulse {
        0%,
        100% {
          opacity: 0.5;
          transform: scale(0.8);
        }

        50% {
          opacity: 1;
          transform: scale(1.22);
        }
      }

      @keyframes ascend-core-signal {
        from {
          opacity: 0.42;
          transform: scaleY(0.5);
        }

        to {
          opacity: 1;
          transform: scaleY(1);
        }
      }

      @media (max-width: 1050px) {
        #${CORE_ID},
        .ascend-core-interface {
          min-height: 700px;
        }

        .ascend-core-panel {
          width: 190px;
        }

        .ascend-core-panel-left {
          top: auto;
          bottom: 18%;
          left: 3%;
        }

        .ascend-core-panel-right {
          top: auto;
          right: 3%;
          bottom: 18%;
        }

        .ascend-core-panel-bottom-left,
        .ascend-core-panel-bottom-right {
          display: none;
        }
      }

      @media (max-width: 680px) {
        #${CORE_ID},
        .ascend-core-interface {
          min-height: 760px;
        }

        .ascend-core-topline {
          right: 16px;
          left: 16px;
        }

        .ascend-core-reticle {
          top: 39%;
          width: 84vw;
        }

        .ascend-core-panel {
          width: auto;
        }

        .ascend-core-panel-left {
          right: 51%;
          bottom: 13%;
          left: 16px;
        }

        .ascend-core-panel-right {
          right: 16px;
          bottom: 13%;
          left: 51%;
        }

        .ascend-core-orbit-label {
          display: none;
        }

        .ascend-core-footer {
          flex-direction: column;
          gap: 5px;
        }
      }

      @media (max-width: 460px) {
        .ascend-core-panel-left,
        .ascend-core-panel-right {
          right: 16px;
          left: 16px;
        }

        .ascend-core-panel-left {
          bottom: 23%;
        }

        .ascend-core-panel-right {
          bottom: 8%;
        }

        .ascend-core-footer {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #${CORE_ID} *,
        #${CORE_ID}::after {
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function readText(id, fallback = "—") {
    const element = document.getElementById(id);
    const value = element?.textContent?.trim();

    return value || fallback;
  }

  function createSignalBars() {
    return Array.from({ length: 14 }, (_, index) => {
      const height = 5 + ((index * 17) % 23);
      const delay = (index * 0.08).toFixed(2);

      return `
        <span
          style="
            height: ${height}px;
            animation-delay: ${delay}s;
          "
        ></span>
      `;
    }).join("");
  }

  function createMarkup() {
    return `
      <canvas
        class="ascend-core-canvas"
        aria-hidden="true"
      ></canvas>

      <div class="ascend-core-interface">
        <div class="ascend-core-topline">
          <div>
            <h2 class="ascend-core-title">
              ASCEND Neural Intelligence Core
            </h2>

            <span class="ascend-core-subtitle">
              Autonomous memecoin research matrix
            </span>
          </div>

          <span class="ascend-core-status">
            Core synchronized
          </span>
        </div>

        <div class="ascend-core-reticle">
          <div class="ascend-core-ring ascend-core-ring-a"></div>
          <div class="ascend-core-ring ascend-core-ring-b"></div>
          <div class="ascend-core-ring ascend-core-ring-c"></div>

          <div class="ascend-core-axis"></div>
          <div class="ascend-core-axis ascend-core-axis-y"></div>

          <div class="ascend-core-center-label">
            <strong>ASCEND</strong>
            <span>Neural core online</span>
          </div>
        </div>

        <div class="ascend-core-panel ascend-core-panel-left">
          <span class="ascend-core-panel-label">
            Solana intelligence
          </span>

          <strong
            id="core-solana-tokens"
            class="ascend-core-panel-value"
          >
            ${readText("ascend-solana-tokens")}
          </strong>

          <span class="ascend-core-panel-meta">
            PumpPortal ingestion stream
          </span>

          <div class="ascend-core-signal">
            ${createSignalBars()}
          </div>
        </div>

        <div class="ascend-core-panel ascend-core-panel-right">
          <span class="ascend-core-panel-label">
            Snapshot activity
          </span>

          <strong
            id="core-snapshots-hour"
            class="ascend-core-panel-value"
          >
            ${readText("ascend-snapshots-hour")}
          </strong>

          <span class="ascend-core-panel-meta">
            Resolved snapshots per hour
          </span>

          <div class="ascend-core-signal">
            ${createSignalBars()}
          </div>
        </div>

        <div class="
          ascend-core-panel
          ascend-core-panel-bottom-left
        ">
          <span class="ascend-core-panel-label">
            Total observations
          </span>

          <strong
            id="core-total-tokens"
            class="ascend-core-panel-value"
          >
            ${readText("ascend-total-tokens")}
          </strong>

          <span class="ascend-core-panel-meta">
            Cross-chain research inventory
          </span>
        </div>

        <div class="
          ascend-core-panel
          ascend-core-panel-bottom-right
        ">
          <span class="ascend-core-panel-label">
            Research queue
          </span>

          <strong
            id="core-pending-jobs"
            class="ascend-core-panel-value"
          >
            ${readText("ascend-pending-jobs")}
          </strong>

          <span class="ascend-core-panel-meta">
            Pending snapshot jobs
          </span>
        </div>

        <span class="
          ascend-core-orbit-label
          ascend-core-orbit-label-a
        ">
          Narrative matrix
        </span>

        <span class="
          ascend-core-orbit-label
          ascend-core-orbit-label-b
        ">
          Creator intelligence
        </span>

        <span class="
          ascend-core-orbit-label
          ascend-core-orbit-label-c
        ">
          Momentum V3
        </span>

        <div class="ascend-core-footer">
          <span>Execution lock: paper only</span>
          <span>No wallet connection</span>
          <span>Read-only telemetry</span>
        </div>
      </div>
    `;
  }

  function findMountTarget() {
    return (
      document.querySelector(".command-center") ||
      document.querySelector(".main-content") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function mountCore() {
    if (document.getElementById(CORE_ID)) {
      return document.getElementById(CORE_ID);
    }

    injectStyles();

    const core = document.createElement("section");
    core.id = CORE_ID;
    core.setAttribute(
      "aria-label",
      "ASCEND animated neural intelligence core",
    );

    core.innerHTML = createMarkup();

    const target = findMountTarget();
    const firstMajorPanel =
      target.querySelector(".metrics") ||
      target.querySelector(".metric-grid") ||
      target.firstElementChild;

    if (firstMajorPanel?.nextSibling) {
      target.insertBefore(core, firstMajorPanel.nextSibling);
    } else {
      target.prepend(core);
    }

    return core;
  }

  function synchronizeCoreValues() {
    const mappings = [
      ["ascend-solana-tokens", "core-solana-tokens"],
      ["ascend-snapshots-hour", "core-snapshots-hour"],
      ["ascend-total-tokens", "core-total-tokens"],
      ["ascend-pending-jobs", "core-pending-jobs"],
    ];

    mappings.forEach(([sourceId, destinationId]) => {
      const source = document.getElementById(sourceId);
      const destination = document.getElementById(destinationId);

      if (source && destination) {
        destination.textContent =
          source.textContent.trim() || "—";
      }
    });
  }

  function observeLiveValues() {
    const livePanel =
      document.getElementById("ascend-live-panel");

    if (!livePanel) {
      return;
    }

    const observer = new MutationObserver(
      synchronizeCoreValues,
    );

    observer.observe(livePanel, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }

  function initializeCanvas(core) {
    const canvas = core.querySelector(".ascend-core-canvas");
    const context = canvas.getContext("2d", {
      alpha: true,
    });

    const particles = [];
    const connections = [];

    const state = {
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
      pixelRatio: Math.min(
        window.devicePixelRatio || 1,
        2,
      ),
      pointerX: 0,
      pointerY: 0,
      pointerActive: false,
      time: 0,
    };

    function resize() {
      const bounds = core.getBoundingClientRect();

      state.width = Math.max(1, bounds.width);
      state.height = Math.max(1, bounds.height);
      state.centerX = state.width / 2;
      state.centerY = state.height / 2;

      canvas.width =
        Math.floor(state.width * state.pixelRatio);

      canvas.height =
        Math.floor(state.height * state.pixelRatio);

      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;

      context.setTransform(
        state.pixelRatio,
        0,
        0,
        state.pixelRatio,
        0,
        0,
      );

      buildParticles();
    }

    function buildParticles() {
      particles.length = 0;
      connections.length = 0;

      const compact = state.width < 680;
      const count = compact ? 85 : 145;
      const radius =
        Math.min(state.width, state.height) *
        (compact ? 0.22 : 0.26);

      for (let index = 0; index < count; index += 1) {
        const angle =
          Math.random() * Math.PI * 2;

        const vertical =
          Math.acos(2 * Math.random() - 1);

        const distribution =
          Math.pow(Math.random(), 0.55);

        const localRadius =
          radius *
          (0.25 + distribution * 0.75);

        particles.push({
          angle,
          vertical,
          radius: localRadius,
          speed:
            (0.0004 + Math.random() * 0.0011) *
            (Math.random() > 0.5 ? 1 : -1),
          size: 0.7 + Math.random() * 1.9,
          phase: Math.random() * Math.PI * 2,
          orbit: 0.8 + Math.random() * 0.45,
          brightness: 0.35 + Math.random() * 0.65,
        });
      }

      for (let index = 0; index < count; index += 1) {
        const targets = 1 + Math.floor(Math.random() * 3);

        for (
          let targetIndex = 0;
          targetIndex < targets;
          targetIndex += 1
        ) {
          const destination =
            Math.floor(Math.random() * count);

          if (destination !== index) {
            connections.push([index, destination]);
          }
        }
      }
    }

    function projectParticle(particle, elapsed) {
      const rotation =
        particle.angle +
        elapsed * particle.speed;

      const pulse =
        1 +
        Math.sin(
          elapsed * 0.0014 + particle.phase,
        ) *
          0.08;

      const x3 =
        Math.sin(particle.vertical) *
        Math.cos(rotation) *
        particle.radius *
        particle.orbit *
        pulse;

      const y3 =
        Math.cos(particle.vertical) *
        particle.radius *
        pulse;

      const z3 =
        Math.sin(particle.vertical) *
        Math.sin(rotation) *
        particle.radius;

      const depthScale =
        0.72 +
        (z3 / (particle.radius * 2) + 0.5) *
          0.55;

      let x =
        state.centerX + x3 * depthScale;

      let y =
        state.centerY + y3 * depthScale;

      if (state.pointerActive) {
        const offsetX =
          (state.pointerX - state.centerX) /
          state.width;

        const offsetY =
          (state.pointerY - state.centerY) /
          state.height;

        x += offsetX * 24 * depthScale;
        y += offsetY * 16 * depthScale;
      }

      return {
        x,
        y,
        z: z3,
        scale: depthScale,
        alpha:
          particle.brightness *
          (0.42 + depthScale * 0.58),
      };
    }

    function drawBackgroundGlow() {
      const radius =
        Math.min(state.width, state.height) * 0.3;

      const gradient =
        context.createRadialGradient(
          state.centerX,
          state.centerY,
          0,
          state.centerX,
          state.centerY,
          radius,
        );

      gradient.addColorStop(
        0,
        "rgba(105, 237, 255, 0.18)",
      );

      gradient.addColorStop(
        0.18,
        "rgba(38, 183, 220, 0.12)",
      );

      gradient.addColorStop(
        0.55,
        "rgba(19, 102, 134, 0.035)",
      );

      gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0)",
      );

      context.fillStyle = gradient;
      context.beginPath();

      context.arc(
        state.centerX,
        state.centerY,
        radius,
        0,
        Math.PI * 2,
      );

      context.fill();
    }

    function drawCore(elapsed) {
      const coreRadius =
        34 +
        Math.sin(elapsed * 0.002) * 5;

      const glow =
        context.createRadialGradient(
          state.centerX,
          state.centerY,
          0,
          state.centerX,
          state.centerY,
          coreRadius * 3.4,
        );

      glow.addColorStop(
        0,
        "rgba(225, 253, 255, 0.95)",
      );

      glow.addColorStop(
        0.08,
        "rgba(105, 238, 255, 0.78)",
      );

      glow.addColorStop(
        0.28,
        "rgba(42, 188, 228, 0.34)",
      );

      glow.addColorStop(
        1,
        "rgba(12, 88, 118, 0)",
      );

      context.fillStyle = glow;
      context.beginPath();

      context.arc(
        state.centerX,
        state.centerY,
        coreRadius * 3.4,
        0,
        Math.PI * 2,
      );

      context.fill();
    }

    function render(elapsed) {
      state.time = elapsed;

      context.clearRect(
        0,
        0,
        state.width,
        state.height,
      );

      drawBackgroundGlow();

      const projected = particles.map((particle) =>
        projectParticle(particle, elapsed),
      );

      context.lineWidth = 0.55;

      connections.forEach(([fromIndex, toIndex]) => {
        const from = projected[fromIndex];
        const to = projected[toIndex];

        const distance = Math.hypot(
          from.x - to.x,
          from.y - to.y,
        );

        const threshold =
          Math.min(state.width, state.height) *
          0.22;

        if (distance > threshold) {
          return;
        }

        const opacity =
          (1 - distance / threshold) *
          Math.min(from.alpha, to.alpha) *
          0.25;

        context.strokeStyle =
          `rgba(78, 216, 247, ${opacity})`;

        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      });

      projected
        .map((point, index) => ({
          ...point,
          particle: particles[index],
        }))
        .sort((first, second) => first.z - second.z)
        .forEach((point) => {
          const radius =
            point.particle.size *
            point.scale;

          context.fillStyle =
            `rgba(139, 241, 255, ${point.alpha})`;

          context.shadowColor =
            "rgba(76, 222, 255, 0.9)";

          context.shadowBlur =
            4 + radius * 3;

          context.beginPath();

          context.arc(
            point.x,
            point.y,
            radius,
            0,
            Math.PI * 2,
          );

          context.fill();
        });

      context.shadowBlur = 0;

      drawCore(elapsed);

      if (
        !prefersReducedMotion &&
        isVisible
      ) {
        animationFrameId =
          window.requestAnimationFrame(render);
      }
    }

    function handlePointerMove(event) {
      const bounds =
        canvas.getBoundingClientRect();

      state.pointerX =
        event.clientX - bounds.left;

      state.pointerY =
        event.clientY - bounds.top;

      state.pointerActive = true;
    }

    function handlePointerLeave() {
      state.pointerActive = false;
    }

    canvas.addEventListener(
      "pointermove",
      handlePointerMove,
    );

    canvas.addEventListener(
      "pointerleave",
      handlePointerLeave,
    );

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(core);

    intersectionObserver =
      new IntersectionObserver((entries) => {
        isVisible =
          entries[0]?.isIntersecting ?? true;

        if (
          isVisible &&
          !prefersReducedMotion &&
          !animationFrameId
        ) {
          animationFrameId =
            window.requestAnimationFrame(render);
        }

        if (!isVisible && animationFrameId) {
          window.cancelAnimationFrame(
            animationFrameId,
          );

          animationFrameId = null;
        }
      });

    intersectionObserver.observe(core);

    resize();

    if (prefersReducedMotion) {
      render(0);
    } else {
      animationFrameId =
        window.requestAnimationFrame(render);
    }
  }

  function initializeNeuralCore() {
    const core = mountCore();

    synchronizeCoreValues();
    observeLiveValues();
    initializeCanvas(core);

    console.log(
      "[ASCEND] Neural intelligence core initialized",
    );
  }

  document.addEventListener(
    "DOMContentLoaded",
    initializeNeuralCore,
  );

  window.addEventListener("beforeunload", () => {
    if (animationFrameId) {
      window.cancelAnimationFrame(
        animationFrameId,
      );
    }

    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
  });
})();
