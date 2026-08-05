"use strict";

(() => {
  const canvas = document.getElementById("neural-canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d", { alpha: true });
  const host = canvas.closest(".core-stage");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    width: 0,
    height: 0,
    ratio: Math.min(window.devicePixelRatio || 1, 2),
    centerX: 0,
    centerY: 0,
    pointerX: 0,
    pointerY: 0,
    pointerActive: false,
    visible: true,
    frame: null,
  };

  const particles = [];
  const links = [];

  function resize() {
    const bounds = host.getBoundingClientRect();

    state.width = Math.max(1, bounds.width);
    state.height = Math.max(1, bounds.height);
    state.centerX = state.width / 2;
    state.centerY = state.height / 2;

    canvas.width = Math.floor(state.width * state.ratio);
    canvas.height = Math.floor(state.height * state.ratio);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;

    context.setTransform(state.ratio, 0, 0, state.ratio, 0, 0);

    buildNetwork();
  }

  function buildNetwork() {
    particles.length = 0;
    links.length = 0;

    const compact = state.width < 700;
    const count = compact ? 95 : 175;
    const radius = Math.min(state.width, state.height) * (compact ? 0.23 : 0.28);

    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const vertical = Math.acos(2 * Math.random() - 1);
      const distribution = Math.pow(Math.random(), 0.56);

      particles.push({
        angle,
        vertical,
        radius: radius * (0.24 + distribution * 0.76),
        speed: (0.00035 + Math.random() * 0.00115) * (Math.random() > 0.5 ? 1 : -1),
        size: 0.7 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        orbit: 0.8 + Math.random() * 0.48,
        brightness: 0.35 + Math.random() * 0.65,
      });
    }

    for (let index = 0; index < count; index += 1) {
      const targets = 1 + Math.floor(Math.random() * 3);
      for (let n = 0; n < targets; n += 1) {
        const destination = Math.floor(Math.random() * count);
        if (destination !== index) links.push([index, destination]);
      }
    }
  }

  function project(particle, elapsed) {
    const rotation = particle.angle + elapsed * particle.speed;
    const pulse = 1 + Math.sin(elapsed * 0.0014 + particle.phase) * 0.08;

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

    const depth = 0.72 + (z3 / (particle.radius * 2) + 0.5) * 0.55;

    let x = state.centerX + x3 * depth;
    let y = state.centerY + y3 * depth;

    if (state.pointerActive) {
      x += ((state.pointerX - state.centerX) / state.width) * 28 * depth;
      y += ((state.pointerY - state.centerY) / state.height) * 18 * depth;
    }

    return {
      x,
      y,
      z: z3,
      scale: depth,
      alpha: particle.brightness * (0.42 + depth * 0.58),
    };
  }

  function drawGlow() {
    const radius = Math.min(state.width, state.height) * 0.34;
    const gradient = context.createRadialGradient(
      state.centerX,
      state.centerY,
      0,
      state.centerX,
      state.centerY,
      radius,
    );

    gradient.addColorStop(0, "rgba(117, 241, 255, 0.2)");
    gradient.addColorStop(0.18, "rgba(42, 185, 222, 0.13)");
    gradient.addColorStop(0.55, "rgba(19, 102, 134, 0.035)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(state.centerX, state.centerY, radius, 0, Math.PI * 2);
    context.fill();
  }

  function drawCore(elapsed) {
    const radius = 36 + Math.sin(elapsed * 0.002) * 5;

    const gradient = context.createRadialGradient(
      state.centerX,
      state.centerY,
      0,
      state.centerX,
      state.centerY,
      radius * 3.5,
    );

    gradient.addColorStop(0, "rgba(235, 255, 255, 0.98)");
    gradient.addColorStop(0.08, "rgba(128, 241, 255, 0.86)");
    gradient.addColorStop(0.28, "rgba(44, 189, 229, 0.36)");
    gradient.addColorStop(1, "rgba(12, 88, 118, 0)");

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(state.centerX, state.centerY, radius * 3.5, 0, Math.PI * 2);
    context.fill();
  }

  function render(elapsed) {
    context.clearRect(0, 0, state.width, state.height);
    drawGlow();

    const projected = particles.map((particle) => project(particle, elapsed));

    context.lineWidth = 0.55;

    links.forEach(([fromIndex, toIndex]) => {
      const from = projected[fromIndex];
      const to = projected[toIndex];
      const distance = Math.hypot(from.x - to.x, from.y - to.y);
      const threshold = Math.min(state.width, state.height) * 0.22;

      if (distance > threshold) return;

      const opacity =
        (1 - distance / threshold) *
        Math.min(from.alpha, to.alpha) *
        0.26;

      context.strokeStyle = `rgba(78, 216, 247, ${opacity})`;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    });

    projected
      .map((point, index) => ({ ...point, particle: particles[index] }))
      .sort((a, b) => a.z - b.z)
      .forEach((point) => {
        const radius = point.particle.size * point.scale;

        context.fillStyle = `rgba(145, 242, 255, ${point.alpha})`;
        context.shadowColor = "rgba(76, 222, 255, 0.9)";
        context.shadowBlur = 4 + radius * 3;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
      });

    context.shadowBlur = 0;
    drawCore(elapsed);

    if (!reducedMotion && state.visible) {
      state.frame = window.requestAnimationFrame(render);
    }
  }

  canvas.addEventListener("pointermove", (event) => {
    const bounds = canvas.getBoundingClientRect();
    state.pointerX = event.clientX - bounds.left;
    state.pointerY = event.clientY - bounds.top;
    state.pointerActive = true;
  });

  canvas.addEventListener("pointerleave", () => {
    state.pointerActive = false;
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  const intersectionObserver = new IntersectionObserver((entries) => {
    state.visible = entries[0]?.isIntersecting ?? true;

    if (state.visible && !reducedMotion && !state.frame) {
      state.frame = window.requestAnimationFrame(render);
    }

    if (!state.visible && state.frame) {
      window.cancelAnimationFrame(state.frame);
      state.frame = null;
    }
  });

  intersectionObserver.observe(host);

  resize();

  if (reducedMotion) {
    render(0);
  } else {
    state.frame = window.requestAnimationFrame(render);
  }

  window.addEventListener("beforeunload", () => {
    if (state.frame) window.cancelAnimationFrame(state.frame);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
  });
})();
