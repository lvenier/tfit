(function(root) {
  const DEFAULT_CONFIG = {
    autoRegisterWhenEmpty: true,
    autoRegisterUnknown: false,
    detectorModelPath: "assets/models/face-recognition/500m.onnx",
    detectorInputSize: 640,
    embeddingInputSize: 112,
    embeddingModelPath: "assets/models/face-recognition/w600k_mbf.onnx",
    faceConfidenceThreshold: 0.5,
    maxProfiles: 12,
    minSamples: 5,
    mainMenuPollMs: 250,
    nmsThreshold: 0.4,
    recognitionRetryDelayMs: 250,
    recognitionSampleCount: 3,
    recognitionSampleDelayMs: 120,
    recognitionTimeoutMs: 5000,
    sampleCount: 8,
    sampleDelayMs: 260,
    scoreThreshold: 0.72,
    storageKey: "box4fit_face_profiles"
  };

  let config = { ...DEFAULT_CONFIG };
  let detectorSession = null;
  let embeddingSession = null;
  let ortRuntime = null;
  let ui = {};
  let initPromise = null;
  let mainMenuRecognitionDone = false;
  let mainMenuRecognitionInFlight = false;
  let mainMenuWatchTimer = null;
  let wasMainMenuReady = false;

  function now() {
    return root.performance && typeof root.performance.now === "function" ? root.performance.now() : Date.now();
  }

  function delay(ms) {
    return new Promise(resolve => root.setTimeout(resolve, ms));
  }

  function getStorage(storage = root.localStorage) {
    return storage && typeof storage.getItem === "function" ? storage : null;
  }

  function readProfiles(storage = root.localStorage) {
    const appStorage = getStorage(storage);
    if (!appStorage) {
      return [];
    }

    try {
      const profiles = JSON.parse(appStorage.getItem(config.storageKey) || "[]");
      return Array.isArray(profiles) ? profiles.filter(profile => Array.isArray(profile.embedding)) : [];
    } catch {
      appStorage.removeItem(config.storageKey);
      return [];
    }
  }

  function writeProfiles(profiles, storage = root.localStorage) {
    const appStorage = getStorage(storage);
    if (!appStorage) {
      return false;
    }
    appStorage.setItem(config.storageKey, JSON.stringify(profiles.slice(-config.maxProfiles)));
    return true;
  }

  function selectedProfile(storage = root.localStorage) {
    const appStorage = getStorage(storage);
    const profileKey = appStorage?.getItem("selected_player") || "player";

    try {
      const profile = JSON.parse(appStorage?.getItem(profileKey) || "{}");
      return {
        key: profileKey,
        name: typeof profile.name === "string" && profile.name.trim() ? profile.name.trim() : profileKey
      };
    } catch {
      return { key: profileKey, name: profileKey };
    }
  }

  function selectedProfileStats(storage = root.localStorage) {
    const appStorage = getStorage(storage);
    const profile = selectedProfile(storage);
    let stored = {};

    try {
      stored = JSON.parse(appStorage?.getItem(profile.key) || "{}") || {};
    } catch {
      stored = {};
    }

    return {
      caloriesBurned: Number(stored.caloriesBurned) || 0,
      gameCounts: {
        fight: Number(stored.gameCounts?.fight) || 0,
        shadow: Number(stored.gameCounts?.shadow) || 0,
        trainPad: Number(stored.gameCounts?.trainPad) || 0
      },
      lastCaloriesBurned: Number(stored.lastCaloriesBurned) || 0
    };
  }

  function updateSelectedPlayerName(name, storage = root.localStorage) {
    const newName = String(name || "").trim();
    const appStorage = getStorage(storage);
    if (!appStorage || !newName) {
      return null;
    }

    const profileKey = appStorage.getItem("selected_player") || "player";
    let profile = {};
    try {
      profile = JSON.parse(appStorage.getItem(profileKey) || "{}") || {};
    } catch {
      profile = {};
    }

    profile.name = newName;
    appStorage.setItem(profileKey, JSON.stringify(profile));

    const profiles = readProfiles(storage);
    const updatedProfiles = profiles.map(faceProfile => (
      faceProfile.profileKey === profileKey ? { ...faceProfile, name: newName } : faceProfile
    ));
    writeProfiles(updatedProfiles, storage);

    return {
      key: profileKey,
      name: newName
    };
  }

  function nextAutoPlayerName(profiles = readProfiles()) {
    const used = new Set(profiles.map(profile => profile.name));
    let index = profiles.length + 1;
    let name = `Player ${index}`;
    while (used.has(name)) {
      index += 1;
      name = `Player ${index}`;
    }
    return name;
  }

  function createAutoPlayerProfile(storage = root.localStorage, profiles = readProfiles(storage)) {
    const appStorage = getStorage(storage);
    if (!appStorage) {
      return null;
    }

    const key = `player-${Date.now().toString(36)}`;
    const name = nextAutoPlayerName(profiles);
    appStorage.setItem(key, JSON.stringify({ name, score: 0, scores: {} }));
    appStorage.setItem("selected_player", key);
    return { key, name };
  }

  function getVideoElement(candidate = root.video) {
    if (!candidate) {
      return null;
    }
    if (typeof HTMLVideoElement !== "undefined" && candidate instanceof HTMLVideoElement) {
      return candidate;
    }
    if (typeof HTMLVideoElement !== "undefined" && candidate.elt instanceof HTMLVideoElement) {
      return candidate.elt;
    }
    return null;
  }

  async function waitForVideo(videoElement, timeoutMs = 5000) {
    const started = now();
    while (videoElement && now() - started < timeoutMs) {
      if (videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        return true;
      }
      await delay(50);
    }
    return false;
  }

  function isMainMenuReady(state = root.gameState) {
    return Boolean(state) &&
      state.gameReady === true &&
      state.menu === 0 &&
      !state.gameStarted &&
      !state.gameCalibration &&
      !state.menuButtonAnimation?.active;
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function updatePanel({
    status,
    matched = null
  } = {}) {
    const fallback = status === "unknown" ? "Unknown player" : null;
    const value = matched || fallback;
    if (value) {
      setText(ui.matched, value);
    }
  }

  function bindPanel(document = root.document) {
    ui = {
      matched: document.getElementById("face-recognition-match")
    };
  }

  function resolveAppAssetUrl(path) {
    const url = new URL(path, root.document?.baseURI || root.location?.href || "http://localhost/");
    return url.href.replace("/app.asar/", "/app.asar.unpacked/");
  }

  async function loadOrtRuntime() {
    if (ortRuntime) {
      return ortRuntime;
    }
    const ort = await import("../assets/vendor/onnxruntime-web/ort.wasm.min.mjs");
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = {
      wasm: resolveAppAssetUrl("assets/vendor/onnxruntime-web/ort-wasm-simd-threaded.wasm")
    };
    ort.env.wasm.proxy = false;
    ortRuntime = ort;
    return ortRuntime;
  }

  async function loadOnnxSession(modelPath, label) {
    const ort = await loadOrtRuntime();
    try {
      return await ort.InferenceSession.create(resolveAppAssetUrl(modelPath), {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
        interOpNumThreads: 1,
        intraOpNumThreads: 1
      });
    } catch (error) {
      throw new Error(`Could not load ${label} ONNX model at ${modelPath}: ${error.message}`);
    }
  }

  async function ensureModels() {
    if (!initPromise) {
      updatePanel({ status: "loading" });
      initPromise = Promise.all([
        loadOnnxSession(config.detectorModelPath, "SCRFD"),
        loadOnnxSession(config.embeddingModelPath, "face embedding")
      ]).then(([detector, embedding]) => {
        detectorSession = detector;
        embeddingSession = embedding;
        updatePanel({ status: "ready" });
        return true;
      }).catch(error => {
        initPromise = null;
        updatePanel({ status: "unavailable", matched: "Local model missing" });
        throw error;
      });
    }
    return initPromise;
  }

  function sessionInputSize(session, fallback) {
    const inputName = session?.inputNames?.[0];
    const dimensions = inputName ? session.inputMetadata?.[inputName]?.dimensions : null;
    const width = Number(dimensions?.[3]);
    const height = Number(dimensions?.[2]);

    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && width === height) {
      return width;
    }
    return fallback;
  }

  function createScrfdInputTensor(videoElement) {
    const inputSize = sessionInputSize(detectorSession, config.detectorInputSize);
    const canvas = createScrfdInputTensor.canvas || (createScrfdInputTensor.canvas = root.document.createElement("canvas"));
    canvas.width = inputSize;
    canvas.height = inputSize;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const scale = Math.min(inputSize / videoElement.videoWidth, inputSize / videoElement.videoHeight);
    const width = Math.round(videoElement.videoWidth * scale);
    const height = Math.round(videoElement.videoHeight * scale);
    const padX = Math.floor((inputSize - width) / 2);
    const padY = Math.floor((inputSize - height) / 2);

    context.fillStyle = "rgb(0, 0, 0)";
    context.fillRect(0, 0, inputSize, inputSize);
    context.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight, padX, padY, width, height);

    const pixels = context.getImageData(0, 0, inputSize, inputSize).data;
    const data = new Float32Array(1 * 3 * inputSize * inputSize);
    const plane = inputSize * inputSize;

    // SCRFD browser exports commonly use NCHW RGB input normalized with mean 127.5 and std 128.
    for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
      data[p] = (pixels[i] - 127.5) / 128;
      data[plane + p] = (pixels[i + 1] - 127.5) / 128;
      data[plane * 2 + p] = (pixels[i + 2] - 127.5) / 128;
    }

    return {
      meta: { height, inputSize, padX, padY, scale, width },
      tensor: new ortRuntime.Tensor("float32", data, [1, 3, inputSize, inputSize])
    };
  }

  function tensorData(tensor) {
    return tensor && tensor.data ? tensor.data : [];
  }

  function splitScrfdOutputs(results) {
    const outputs = detectorSession.outputNames.map(name => ({
      data: tensorData(results[name]),
      name,
      tensor: results[name]
    }));
    const scores = outputs.filter(output => /score|cls|conf/i.test(output.name));
    const boxes = outputs.filter(output => /bbox|box/i.test(output.name));

    if (scores.length >= 3 && boxes.length >= 3) {
      return { boxes: boxes.slice(0, 3), scores: scores.slice(0, 3) };
    }

    if (outputs.length >= 6) {
      return {
        scores: outputs.slice(0, 3),
        boxes: outputs.slice(3, 6)
      };
    }

    return { boxes: [], scores: [] };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function mapBoxToVideo(box, meta, videoElement) {
    return {
      height: clamp((box.y2 - box.y1) / meta.scale, 0, videoElement.videoHeight),
      width: clamp((box.x2 - box.x1) / meta.scale, 0, videoElement.videoWidth),
      x: clamp((box.x1 - meta.padX) / meta.scale, 0, videoElement.videoWidth),
      y: clamp((box.y1 - meta.padY) / meta.scale, 0, videoElement.videoHeight)
    };
  }

  function decodeScrfdStride(scoreOutput, boxOutput, stride, meta, videoElement) {
    const scores = scoreOutput.data;
    const boxes = boxOutput.data;
    const featureSize = meta.inputSize / stride;
    const cellCount = featureSize * featureSize;
    const anchorCount = Math.max(1, Math.round(scores.length / cellCount));
    const detections = [];

    for (let i = 0; i < scores.length; i += 1) {
      const score = scores[i];
      if (score < config.faceConfidenceThreshold) {
        continue;
      }

      const anchorIndex = Math.floor(i / anchorCount);
      const gridX = anchorIndex % featureSize;
      const gridY = Math.floor(anchorIndex / featureSize);
      const centerX = gridX * stride;
      const centerY = gridY * stride;
      const boxOffset = i * 4;
      const x1 = centerX - boxes[boxOffset] * stride;
      const y1 = centerY - boxes[boxOffset + 1] * stride;
      const x2 = centerX + boxes[boxOffset + 2] * stride;
      const y2 = centerY + boxes[boxOffset + 3] * stride;
      const boundingBox = mapBoxToVideo({ x1, y1, x2, y2 }, meta, videoElement);

      if (boundingBox.width > 0 && boundingBox.height > 0) {
        detections.push({ boundingBox, score });
      }
    }

    return detections;
  }

  function intersectionOverUnion(a, b) {
    const ax2 = a.x + a.width;
    const ay2 = a.y + a.height;
    const bx2 = b.x + b.width;
    const by2 = b.y + b.height;
    const width = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
    const height = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
    const intersection = width * height;
    const union = a.width * a.height + b.width * b.height - intersection;
    return union > 0 ? intersection / union : 0;
  }

  function nonMaxSuppression(detections) {
    const sorted = detections.slice().sort((a, b) => b.score - a.score);
    const selected = [];

    for (const detection of sorted) {
      if (selected.every(candidate => intersectionOverUnion(candidate.boundingBox, detection.boundingBox) < config.nmsThreshold)) {
        selected.push(detection);
      }
    }

    return selected;
  }

  function bestDetection(detections) {
    return detections.reduce((best, detection) => {
      const box = detection.boundingBox;
      const area = (box?.width || 0) * (box?.height || 0);
      const rank = detection.score * 1000000 + area;
      if (!best || rank > best.rank) {
        return { detection, rank };
      }
      return best;
    }, null)?.detection || null;
  }

  function decodeScrfdDetections(results, meta, videoElement) {
    const strides = [8, 16, 32];
    const { boxes, scores } = splitScrfdOutputs(results);
    if (boxes.length < strides.length || scores.length < strides.length) {
      return [];
    }

    const detections = strides.flatMap((stride, index) => decodeScrfdStride(
      scores[index],
      boxes[index],
      stride,
      meta,
      videoElement
    ));

    return nonMaxSuppression(detections);
  }

  async function detectFace(videoElement) {
    await ensureModels();
    const inputName = detectorSession.inputNames[0];
    const { meta, tensor } = createScrfdInputTensor(videoElement);
    const results = await detectorSession.run({ [inputName]: tensor });
    return bestDetection(decodeScrfdDetections(results, meta, videoElement));
  }

  async function detectFaceWithRetry(videoElement, timeoutMs = config.recognitionTimeoutMs) {
    const started = now();
    let detection = null;

    while (!detection && now() - started < timeoutMs) {
      detection = await detectFace(videoElement);
      if (!detection) {
        await delay(config.recognitionRetryDelayMs);
      }
    }

    return detection;
  }

  async function collectRecognitionEmbedding(videoElement, firstDetection) {
    const embeddings = [await computeEmbedding(videoElement, firstDetection)];
    const sampleCount = Math.max(1, Number(config.recognitionSampleCount) || 1);

    for (let sample = 1; sample < sampleCount; sample += 1) {
      await delay(config.recognitionSampleDelayMs);
      const detection = await detectFace(videoElement);
      if (detection) {
        embeddings.push(await computeEmbedding(videoElement, detection));
      }
    }

    return averageEmbeddings(embeddings);
  }

  function detectionToCropBox(detection, videoElement) {
    const box = detection.boundingBox;
    const margin = Math.max(box.width, box.height) * 0.24;
    const size = Math.max(box.width, box.height) + margin * 2;
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const x = Math.max(0, Math.min(videoElement.videoWidth - size, centerX - size / 2));
    const y = Math.max(0, Math.min(videoElement.videoHeight - size, centerY - size / 2));
    return {
      height: Math.min(size, videoElement.videoHeight - y),
      width: Math.min(size, videoElement.videoWidth - x),
      x,
      y
    };
  }

  function createInputTensor(videoElement, detection) {
    const size = sessionInputSize(embeddingSession, config.embeddingInputSize);
    const canvas = createInputTensor.canvas || (createInputTensor.canvas = root.document.createElement("canvas"));
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const crop = detectionToCropBox(detection, videoElement);
    context.drawImage(videoElement, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, size, size).data;
    const data = new Float32Array(1 * 3 * size * size);
    const plane = size * size;

    // w600k_mbf-style embedding exports commonly use 112x112 NCHW RGB input normalized around zero.
    for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
      data[p] = (pixels[i] - 127.5) / 128;
      data[plane + p] = (pixels[i + 1] - 127.5) / 128;
      data[plane * 2 + p] = (pixels[i + 2] - 127.5) / 128;
    }

    return new ortRuntime.Tensor("float32", data, [1, 3, size, size]);
  }

  function l2Normalize(values) {
    let sum = 0;
    for (const value of values) {
      sum += value * value;
    }
    const length = Math.sqrt(sum) || 1;
    return Array.from(values, value => value / length);
  }

  async function computeEmbedding(videoElement, detection) {
    await ensureModels();
    const inputName = embeddingSession.inputNames[0];
    const outputName = embeddingSession.outputNames[0];
    const results = await embeddingSession.run({
      [inputName]: createInputTensor(videoElement, detection)
    });
    return l2Normalize(results[outputName].data);
  }

  function averageEmbeddings(embeddings) {
    const width = embeddings[0]?.length || 0;
    const averaged = new Float32Array(width);
    for (const embedding of embeddings) {
      for (let i = 0; i < width; i += 1) {
        averaged[i] += embedding[i] / embeddings.length;
      }
    }
    return l2Normalize(averaged);
  }

  function cosineSimilarity(a, b) {
    const length = Math.min(a?.length || 0, b?.length || 0);
    let dot = 0;
    for (let i = 0; i < length; i += 1) {
      dot += a[i] * b[i];
    }
    return dot;
  }

  function matchEmbedding(embedding, profiles = readProfiles()) {
    return profiles.reduce((best, profile) => {
      const score = cosineSimilarity(embedding, profile.embedding);
      if (!best || score > best.score) {
        return { profile, score };
      }
      return best;
    }, null);
  }

  function recognitionDisplayName({ accepted, match, storage = root.localStorage } = {}) {
    if (accepted && match?.profile?.name) {
      return match.profile.name;
    }
    return selectedProfile(storage).name || "Unknown player";
  }

  async function recognizeCurrentFace({
    videoElement = getVideoElement(),
    storage = root.localStorage
  } = {}) {
    const started = now();
    bindPanel();
    updatePanel({ matched: "Recognizing..." });

    if (!videoElement || !(await waitForVideo(videoElement))) {
      updatePanel({ status: "unavailable", detected: false, elapsedMs: now() - started, matched: "Camera unavailable" });
      return null;
    }

    try {
      const profiles = readProfiles(storage);
      if (config.autoRegisterWhenEmpty && profiles.length === 0) {
        updatePanel({ status: "registering", matched: "Registering face..." });
        return await registerCurrentFace({ videoElement, storage });
      }

      const detection = await detectFaceWithRetry(videoElement);
      if (!detection) {
        updatePanel({ status: "unknown", detected: false, elapsedMs: now() - started });
        return null;
      }

      const embedding = await collectRecognitionEmbedding(videoElement, detection);
      const match = matchEmbedding(embedding, profiles);
      const accepted = match && match.score >= config.scoreThreshold;
      const matchedName = recognitionDisplayName({ accepted, match, storage });

      if (accepted) {
        getStorage(storage)?.setItem("selected_player", match.profile.profileKey || "player");
      } else if (config.autoRegisterUnknown) {
        createAutoPlayerProfile(storage, profiles);
        updatePanel({ status: "registering", matched: `0/${config.sampleCount} samples` });
        return await registerCurrentFace({ videoElement, storage });
      }

      updatePanel({
        status: accepted ? "recognized" : "unknown",
        detected: true,
        elapsedMs: now() - started,
        matched: matchedName,
        score: match?.score
      });

      return accepted ? match : null;
    } catch (error) {
      console.warn("Face recognition unavailable:", error);
      updatePanel({ status: "unavailable", detected: false, elapsedMs: now() - started, matched: error.message || "Local model unavailable" });
      return null;
    }
  }

  async function recognizeOnMainMenu(options = {}) {
    if (!isMainMenuReady() || mainMenuRecognitionDone || mainMenuRecognitionInFlight) {
      return null;
    }

    mainMenuRecognitionDone = true;
    mainMenuRecognitionInFlight = true;
    try {
      return await recognizeCurrentFace(options);
    } finally {
      mainMenuRecognitionInFlight = false;
    }
  }

  function watchMainMenuRecognition(options = {}) {
    if (mainMenuWatchTimer) {
      return false;
    }

    const tick = () => {
      const ready = isMainMenuReady();
      if (!ready) {
        wasMainMenuReady = false;
        mainMenuRecognitionDone = false;
        return;
      }

      if (!wasMainMenuReady) {
        mainMenuRecognitionDone = false;
      }
      wasMainMenuReady = true;

      void recognizeOnMainMenu(options);
    };

    tick();
    mainMenuWatchTimer = root.setInterval(tick, config.mainMenuPollMs);
    return true;
  }

  async function registerCurrentFace({
    videoElement = getVideoElement(),
    storage = root.localStorage
  } = {}) {
    const started = now();
    bindPanel();
    updatePanel({ status: "registering", matched: `0/${config.sampleCount} samples` });

    if (!videoElement || !(await waitForVideo(videoElement))) {
      throw new Error("Camera is not ready.");
    }

    const embeddings = [];
    for (let attempt = 0; attempt < config.sampleCount; attempt += 1) {
      const detection = await detectFace(videoElement);
      updatePanel({
        status: "registering",
        detected: Boolean(detection),
        elapsedMs: now() - started,
        matched: `${embeddings.length}/${config.sampleCount} samples`
      });

      if (detection) {
        embeddings.push(await computeEmbedding(videoElement, detection));
        updatePanel({
          status: "registering",
          detected: true,
          elapsedMs: now() - started,
          matched: `${embeddings.length}/${config.sampleCount} samples`
        });
      }
      await delay(config.sampleDelayMs);
    }

    if (embeddings.length < config.minSamples) {
      throw new Error(`Only captured ${embeddings.length} face samples.`);
    }

    const player = selectedProfile(storage);
    const profile = {
      createdAt: new Date().toISOString(),
      embedding: averageEmbeddings(embeddings),
      name: player.name,
      profileKey: player.key
    };
    const profiles = readProfiles(storage).filter(existing => existing.profileKey !== player.key);
    profiles.push(profile);
    writeProfiles(profiles, storage);

    updatePanel({
      status: "ready",
      detected: true,
      elapsedMs: now() - started,
      matched: profile.name,
      score: 1
    });

    return profile;
  }

  async function initFaceRecognitionPoc(options = {}) {
    config = { ...config, ...(root.__TFIT_FACE_RECOGNITION_CONFIG__ || {}), ...options };
    bindPanel();

    if (root.__TFIT_DISABLE_FACE_RECOGNITION_FOR_E2E) {
      updatePanel({ status: "unavailable", matched: "Disabled for tests" });
      return null;
    }

    watchMainMenuRecognition(options);
    return null;
  }

  const api = {
    DEFAULT_CONFIG,
    averageEmbeddings,
    cosineSimilarity,
    createAutoPlayerProfile,
    initFaceRecognitionPoc,
    intersectionOverUnion,
    isMainMenuReady,
    matchEmbedding,
    nonMaxSuppression,
    readProfiles,
    recognizeCurrentFace,
    recognitionDisplayName,
    recognizeOnMainMenu,
    registerCurrentFace,
    resolveAppAssetUrl,
    selectedProfile,
    selectedProfileStats,
    sessionInputSize,
    updatePanel,
    updateSelectedPlayerName,
    watchMainMenuRecognition,
    writeProfiles
  };

  root.TfitFaceRecognition = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
