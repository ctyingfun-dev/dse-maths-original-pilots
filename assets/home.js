const entry = document.querySelector("#enter-paper");
const requestedYear = new URLSearchParams(location.search).get("year");
const year = ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"].includes(requestedYear) ? requestedYear : "2026";
entry.href = `./paper1/?year=${year}#papers`;
entry.setAttribute("aria-label", `進入 ${year} 年數學卷一`);

const canvas = document.querySelector("#math-canvas");
const status = document.querySelector("#scene-status");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

async function start() {
  const THREE = await import("three");
  const { mobius } = await import("./vendor/three/ParametricFunctions.js");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x03050b, 1);
  renderer.autoClear = false;
  const background = new THREE.Scene();
  const backgroundCamera = new THREE.Camera();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 80);
  const ribbon = new THREE.Group();
  scene.add(ribbon);
  const colors = [0xf4f7ff, 0x93c9f4, 0xefd3a4, 0xbca5ec].map(hex => new THREE.Color(hex));
  let seed = 171026;
  function random() {
    seed = Math.imul(seed ^ seed >>> 15, 1 | seed);
    seed ^= seed + Math.imul(seed ^ seed >>> 7, 61 | seed);
    return ((seed ^ seed >>> 14) >>> 0) / 4294967296;
  }
  const fragmentShader = `
    varying vec3 vColor;
    varying float vLight;
    void main() {
      float radius = length(gl_PointCoord * 2.0 - 1.0);
      if (radius > 1.0) discard;
      float light = 1.0 - smoothstep(0.08, 1.0, radius);
      gl_FragColor = vec4(vColor, light * vLight);
      #include <colorspace_fragment>
    }`;
  const uniforms = { uTime: { value: 0 }, uDpr: { value: renderer.getPixelRatio() }, uStarScale: { value: 12 } };
  function pointsMaterial(distant) {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aLight;
        attribute float aPhase;
        uniform float uTime;
        uniform float uDpr;
        uniform float uStarScale;
        varying vec3 vColor;
        varying float vLight;
        void main() {
          vColor = aColor;
          vLight = aLight * (0.90 + 0.10 * sin(uTime * 0.65 + aPhase));
          ${distant ? `
            gl_Position = vec4(position, 1.0);
            gl_PointSize = aSize * uDpr;
          ` : `
            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * viewPosition;
            gl_PointSize = clamp(aSize * uDpr * uStarScale / -viewPosition.z, 0.65 * uDpr, 4.5 * uDpr);
          `}
        }`,
      fragmentShader, transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending
    });
  }
  function geometryFor(count, distant) {
    const geometry = new THREE.BufferGeometry();
    const position = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const light = new Float32Array(count);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const tone = random();
      const chosen = colors[tone < .64 ? 0 : tone < .84 ? 1 : tone < .95 ? 2 : 3];
      chosen.toArray(color, i * 3);
      phase[i] = random() * Math.PI * 2;
      size[i] = distant ? .7 + Math.pow(random(), 4) * 2.1 : 1.05 + Math.pow(random(), 3) * 2.05;
      light[i] = distant ? .18 + random() * .47 : .40 + random() * .58;
      if (distant) {
        position[i * 3] = random() * 2 - 1;
        position[i * 3 + 1] = random() * 2 - 1;
      }
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geometry.setAttribute("aLight", new THREE.BufferAttribute(light, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    return geometry;
  }
  const field = new THREE.Points(geometryFor(1700, true), pointsMaterial(true));
  field.frustumCulled = false;
  background.add(field);
  const count = innerWidth <= 600 ? 4400 : 7600;
  const geometry = geometryFor(count, false);
  geometry.getAttribute("position").setUsage(THREE.DynamicDrawUsage);
  const stars = new THREE.Points(geometry, pointsMaterial(false));
  stars.frustumCulled = false;
  ribbon.add(stars);
  const phases = new Float32Array(count);
  const lanes = new Float32Array(count);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phases[i] = random() * 2;
    lanes[i] = (random() * 2 - 1) * 1.1;
    speeds[i] = .018 + random() * .012;
  }
  const tailCount = Math.floor(count / 9);
  const tails = new Float32Array(tailCount * 6);
  const tailColors = new Float32Array(tailCount * 6);
  const starColors = geometry.getAttribute("aColor");
  for (let i = 0; i < tailCount; i++) {
    const index = i * 9;
    for (let j = 0; j < 2; j++) tailColors.set([starColors.getX(index), starColors.getY(index), starColors.getZ(index)], i * 6 + j * 3);
  }
  const tailGeometry = new THREE.BufferGeometry();
  tailGeometry.setAttribute("position", new THREE.BufferAttribute(tails, 3).setUsage(THREE.DynamicDrawUsage));
  tailGeometry.setAttribute("color", new THREE.BufferAttribute(tailColors, 3));
  const trails = new THREE.LineSegments(tailGeometry, new THREE.LineBasicMaterial({
    vertexColors: true, opacity: .16, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
  }));
  trails.frustumCulled = false;
  ribbon.add(trails);
  const point = new THREE.Vector3();
  let elapsed = 0;
  let lastTime = 0;
  let frame = 0;
  let playing = !reduced.matches;
  let lost = false;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pickGeometry = new THREE.PlaneGeometry(1, 1, 128, 12);
  const pickUV = pickGeometry.getAttribute("uv");
  const pickPositions = pickGeometry.getAttribute("position");
  const pickMesh = new THREE.Mesh(pickGeometry, new THREE.MeshBasicMaterial({side: THREE.DoubleSide}));
  // This mesh is used only for hit testing; the visible ribbon remains entirely stars.
  pickMesh.matrixAutoUpdate = false;
  pickGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  const waveSamples = 256;
  const waveField = new Float32Array(waveSamples + 1);
  const plucks = [];
  const hoverPointer = matchMedia("(hover: hover) and (pointer: fine)");
  let pendingPointer = null;
  let overRibbon = false;
  let lastPluck = -10;
  let pluckCount = 0;
  canvas.dataset.plucks = "0";
  canvas.dataset.pluckEnergy = "0";
  canvas.dataset.pluckOffset = "0";

  function updateWaves() {
    while (plucks.length && elapsed - plucks[0].time > 4.4) plucks.shift();
    let energy = 0;
    for (let i = 0; i <= waveSamples; i++) {
      let displacement = 0;
      for (const pluck of plucks) {
        const age = elapsed - pluck.time;
        const angle = (i / waveSamples - pluck.phase) * Math.PI * 2;
        const release = 1 - THREE.MathUtils.smoothstep(age, 3.4, 4.4);
        // One slow fundamental carries the recoil; faint overtones fade earlier.
        for (let mode = 1; mode <= 3; mode++) {
          const weight = mode === 1 ? 1 : mode === 2 ? .16 : .02;
          displacement += pluck.strength * weight * release * Math.exp(-age * (1.15 + (mode - 1) * .45))
            * Math.cos(mode * angle) * Math.sin(mode * age * 3.8);
        }
      }
      waveField[i] = Math.max(-.16, Math.min(.16, displacement));
      energy = Math.max(energy, Math.abs(waveField[i]));
    }
    canvas.dataset.pluckEnergy = energy.toFixed(4);
    canvas.dataset.pluckOffset = plucks.length ? waveAt(plucks[plucks.length - 1].phase).toFixed(4) : "0";
  }
  function waveAt(phase) {
    const index = ((phase % 1 + 1) % 1) * waveSamples;
    const lower = Math.floor(index);
    return THREE.MathUtils.lerp(waveField[lower], waveField[lower + 1], index - lower);
  }
  function positionOnRibbon(lane, phase) {
    mobius(lane + .5, phase, point);
    // A fixed local direction keeps the wave continuous through the ribbon's half twist.
    point.z += waveAt(phase);
  }
  function pickRibbon() {
    if (!pendingPointer) return;
    const current = pendingPointer;
    pendingPointer = null;
    if (!playing || reduced.matches || lost || document.hidden) return;
    for (let i = 0; i < pickPositions.count; i++) {
      positionOnRibbon((pickUV.getX(i) * 2 - 1) * 1.1, pickUV.getY(i));
      pickPositions.setXYZ(i, point.x, point.y, point.z);
    }
    pickPositions.needsUpdate = true;
    ribbon.updateMatrixWorld(true);
    pickMesh.matrixWorld.copy(ribbon.matrixWorld);
    camera.updateMatrixWorld();
    const bounds = canvas.getBoundingClientRect();
    pointer.set((current.x - bounds.left) / bounds.width * 2 - 1, -(current.y - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(pickMesh, false)[0];
    if (!hit) {
      overRibbon = false;
      return;
    }
    if (!overRibbon && elapsed - lastPluck > 1.1) {
      if (plucks.length >= 2) plucks.shift();
      plucks.push({phase: hit.uv.y, time: elapsed, strength: .12});
      canvas.dataset.plucks = String(++pluckCount);
      lastPluck = elapsed;
    }
    overRibbon = true;
  }
  function clearPointer() {
    pendingPointer = null;
    overRibbon = false;
  }
  entry.addEventListener("pointermove", event => {
    if (event.pointerType === "mouse" && hoverPointer.matches && !reduced.matches && playing) {
      pendingPointer = {x: event.clientX, y: event.clientY};
    }
  }, {passive: true});
  entry.addEventListener("pointerleave", clearPointer);
  entry.addEventListener("pointercancel", clearPointer);
  addEventListener("blur", clearPointer);

  function updateOrbits() {
    const positions = geometry.getAttribute("position");
    for (let i = 0; i < count; i++) {
      // A star completes two turns (4 pi) before returning to its original side and lane.
      const phase = (phases[i] + elapsed * speeds[i]) % 2;
      positionOnRibbon(lanes[i], phase);
      positions.setXYZ(i, point.x, point.y, point.z);
      if (i % 9 === 0 && i / 9 < tailCount) {
        const offset = i / 9 * 6;
        point.toArray(tails, offset);
        positionOnRibbon(lanes[i], phase - .006);
        point.toArray(tails, offset + 3);
      }
    }
    positions.needsUpdate = true;
    tailGeometry.getAttribute("position").needsUpdate = true;
    uniforms.uTime.value = elapsed;
  }
  function render() {
    if (lost) return;
    renderer.clear();
    renderer.render(background, backgroundCamera);
    renderer.clearDepth();
    renderer.render(scene, camera);
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    ribbon.rotation.set(.96, .25, width <= 600 ? .72 : -.28);
    ribbon.position.set(0, 0, 0);
    ribbon.updateMatrixWorld(true);
    const samples = [];
    const box = new THREE.Box3();
    for (let i = 0; i <= 96; i++) for (const lane of [-1.1, 1.1]) {
      mobius(lane + .5, i / 96, point);
      const sample = point.clone().applyMatrix4(ribbon.matrixWorld);
      samples.push(sample);
      box.expandByPoint(sample);
    }
    const center = box.getCenter(new THREE.Vector3());
    ribbon.position.copy(center).negate();
    const halfY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfX = halfY * camera.aspect;
    const fitY = height < 500 ? .64 : .73;
    let distance = 0;
    for (const sample of samples) {
      sample.sub(center);
      distance = Math.max(distance, sample.z + Math.abs(sample.x) / (halfX * .89), sample.z + Math.abs(sample.y) / (halfY * fitY));
    }
    camera.position.set(0, 0, distance);
    uniforms.uStarScale.value = Math.max(12, distance * .95);
    camera.setViewOffset(width, height, 0, height * .065, width, height);
    camera.lookAt(0, 0, 0);
    clearPointer();
    render();
  }
  function animate(now) {
    frame = 0;
    if (!playing || document.hidden || lost) return;
    elapsed += lastTime ? Math.min((now - lastTime) / 1000, .05) : 0;
    lastTime = now;
    updateWaves();
    pickRibbon();
    updateOrbits();
    render();
    frame = requestAnimationFrame(animate);
  }
  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    clearPointer();
    canvas.dataset.motion = playing ? "running" : "paused";
    if (playing && !document.hidden && !lost) frame = requestAnimationFrame(animate);
  }
  document.addEventListener("visibilitychange", schedule);
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    playing = !playing;
    schedule();
  });
  reduced.addEventListener("change", () => {
    plucks.length = 0;
    waveField.fill(0);
    canvas.dataset.pluckEnergy = "0";
    canvas.dataset.pluckOffset = "0";
    playing = !reduced.matches;
    updateOrbits();
    render();
    schedule();
  });
  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    lost = true;
    schedule();
    status.textContent = "星空動畫暫時中斷，卷一連結仍可使用。";
  });
  canvas.addEventListener("webglcontextrestored", () => {
    lost = false;
    status.textContent = "";
    render();
    schedule();
  });
  updateOrbits();
  new ResizeObserver(resize).observe(canvas);
  resize();
  canvas.dataset.ready = "true";
  schedule();
}
start().catch(error => {
  console.error("Star scene could not start:", error);
  status.textContent = "此瀏覽器未能顯示星空動畫，卷一連結仍可使用。";
});
