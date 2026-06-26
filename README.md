![Version](https://img.shields.io/github/package-json/v/lvenier/tfit)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Last Commit](https://img.shields.io/github/last-commit/lvenier/tfit)
![Repo Size](https://img.shields.io/github/repo-size/lvenier/tfit)
![Issues](https://img.shields.io/github/issues/lvenier/tfit)
![CI](https://img.shields.io/github/actions/workflow/status/lvenier/tfit/tests.yml?branch=main&label=tests)

# Box4Fit / tfit

Box4Fit is a webcam-controlled boxing fitness game built with p5.js and ml5.js pose detection. The game runs as a static web app in the browser and can also be launched as a fullscreen Electron desktop app.

The app uses local assets for the p5.js runtime, ml5.js runtime, pose model files, boxer sprites, backgrounds, and sounds, so normal gameplay does not depend on remote CDN assets.

## Requirements

- Node.js and npm
- A browser with webcam support
- A webcam
- Camera permission enabled for the app

Camera access works on `localhost` over HTTP. If you open the app from another device or a non-local hostname, browsers usually require HTTPS.

## Install

Install project dependencies:

```bash
npm install
```

## Run In The Browser

Start the static development server:

```bash
npm run serve
```

Open:

```text
http://localhost:8000
```

The server is powered by `http-server` and serves the current project directory on port `8000`.

## Run As Desktop App

Start the Electron app:

```bash
npm start
```

This launches `main.js`, opens `index.html`, and runs the game fullscreen.

## Development

Main files:

- `index.html`: app shell, script loading, metadata, PWA manifest
- `style.css`: loading screen, orientation overlay, shared page styles
- `js/app.js`: p5/ml5 game loop, pose detection, game state, rendering
- `js/game-utils.js`: small shared helpers covered by unit tests
- `service-worker.js`: app shell cache for PWA/offline behavior
- `main.js`: Electron entry point
- `assets/`: sprites, backgrounds, logos, and sounds

## Local Face Recognition POC

Box4Fit includes a local-only proof of concept that can recognize a registered player before a workout starts. It complements the existing ml5.js BodyPose flow: pose detection still owns punch detection, while face recognition runs once after the webcam starts and then stops.

The POC uses:

- SCRFD ONNX for face detection
- ONNX Runtime Web for local inference
- A local ONNX face embedding model
- `localStorage` for averaged face embeddings

No face images are stored. No backend or cloud API is used.

Before testing, place the model files in:

```text
assets/models/face-recognition/500m.onnx
assets/models/face-recognition/w600k_mbf.onnx
```

Use `500m.onnx` as the SCRFD detector with `1x3x640x640` RGB input and `w600k_mbf.onnx` as the embedding model with `1x3x112x112` RGB input. The app reads ONNX input metadata when available, so compatible square input sizes can be used with config fallbacks. The default recognition threshold is `0.72`; override it with `window.__TFIT_FACE_RECOGNITION_CONFIG__ = { scoreThreshold: 0.68 }` before app startup when tuning the POC.

To register a player:

1. Start Box4Fit with `npm run serve` or `npm start`.
2. Allow camera access.
3. Select or create the player profile you want associated with this face.
4. Keep your face visible for a few seconds while 5-8 samples are captured.

When no face profiles are stored yet, Box4Fit automatically registers the currently selected player at startup. Use `Register Face` to re-register or replace the current player's stored embedding. To disable first-run auto-registration, set `window.__TFIT_FACE_RECOGNITION_CONFIG__ = { autoRegisterWhenEmpty: false }` before app startup.

To test recognition, reload the app and stay on the main menu. Recognition only starts while Box4Fit is idle on the main menu. The panel shows `Recognizing...` while Box4Fit looks for a face for up to 5 seconds, then shows the matched player. A successful match sets `selected_player` to the stored profile key and shows `Welcome back, <player name> 👋`; otherwise it shows `Unknown player`. Tune the startup detection window with `window.__TFIT_FACE_RECOGNITION_CONFIG__ = { recognitionTimeoutMs: 8000 }`.

Useful commands:

```bash
npm run serve
npm start
npm run test:unit
npm run test:e2e
npm test
```

## Testing

Run all tests:

```bash
npm test
```

Run only unit tests:

```bash
npm run test:unit
```

Run only Playwright browser tests:

```bash
npm run test:e2e
```

Run Playwright in headed mode:

```bash
npm run test:e2e:headed
```

Playwright starts a local static server automatically. The browser tests use fake camera flags, so they verify the app shell, canvas startup, and responsive/orientation behavior without requiring a real webcam during CI-style runs.

## Build

Build Linux desktop packages:

```bash
npm run build-linux
```

Build Windows desktop packages:

```bash
npm run build-win
```

Build outputs are created by `electron-builder` and ignored by git via `dist`.

## Deployment

The app is static, so it can be hosted by any static file server as long as the ml5 model files and assets are served with the project.

Existing Docker example:

```bash
sudo docker run -d -p 8000:8000 \
--label traefik.http.routers.box4fit.rule=Host\(\`app.box4.fit\`\) \
--name tfit tfit
```

For webcam access in production, serve the app over HTTPS.
