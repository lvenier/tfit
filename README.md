![Version](https://img.shields.io/github/package-json/v/lvenier/tfit)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Last Commit](https://img.shields.io/github/last-commit/lvenier/tfit)
![Repo Size](https://img.shields.io/github/repo-size/lvenier/tfit)
![Issues](https://img.shields.io/github/issues/lvenier/tfit)
![CI](https://img.shields.io/github/actions/workflow/status/lvenier/tfit/tests.yml?branch=main&label=tests)

# Box4Fit / tfit

Box4Fit is a webcam-controlled boxing fitness game built with vanilla JavaScript, p5.js, ml5.js BodyPose, and optional local ONNX face recognition. It runs as a static browser app, a PWA-style app shell, or a fullscreen Electron desktop app.

The game ships local runtime, model, sprite, background, and sound assets so normal gameplay does not depend on remote CDN files.

## Features

- Webcam pose detection for punches, dodges, guard position, and calibration.
- Three training modes: Shadow, Train Pad, and Fight.
- Adjustable round length, series count, difficulty, frame rate, and shadow focus.
- Local player profiles with calories, game counts, score summaries, and daily stats.
- Optional local-only face recognition.
- Unit tests with Vitest and browser tests with Playwright.

## Requirements

- Node.js and npm
- A browser with webcam support
- A webcam
- Camera permission enabled for the app

Camera access works on `localhost` over HTTP. Browsers usually require HTTPS for webcam access from another device or a non-local hostname.

## Install

```bash
npm install
```

## Run

Start the static browser app:

```bash
npm run serve
```

Open:

```text
http://localhost:8000
```

Start the fullscreen Electron app:

```bash
npm start
```

## How To Play

Allow camera access, stand where your nose and both wrists are visible, then choose a mode from the main menu:

- `Shadow`: follow generated punch, dodge, and guard-switch prompts.
- `Train Pad`: hit moving pad targets and duck under dodge prompts.
- `Fight`: defeat a ladder of opponents by landing prompts before your stamina runs out.

Keyboard shortcuts include `S` for Shadow, `T` for Train Pad, `F` or `I` for Fight, `C` for settings/configuration, `P` for Profile, `B` to go back, and `F` to start a round inside a game mode.

The full game rules, move list, settings, stored configuration keys, calibration behavior, and profile storage are documented in [doc/rules-and-configuration.md](doc/rules-and-configuration.md). Face recognition setup and tuning are documented in [doc/face-recognition.md](doc/face-recognition.md).

## Project Structure

- `index.html`: app shell, script loading, metadata, and PWA manifest link.
- `style.css`: loading screen, orientation overlay, and shared page styles.
- `js/`: game modules for config, input, rendering, flow, scoring, camera, profiles, and modes.
- `assets/`: local models, vendor runtime files, and sounds.
- `tests/unit/`: Vitest unit tests.
- `tests/e2e/`: Playwright browser tests.
- `service-worker.js`: app shell cache for PWA/offline behavior.
- `main.js`: Electron entry point.
- `doc/`: gameplay and configuration reference.

## Useful Commands

```bash
npm run serve
npm start
npm run test:unit
npm run test:e2e
npm run test:e2e:headed
npm test
npm run build-linux
npm run build-win
```

Playwright starts a local static server automatically. The browser tests use fake camera flags, so CI-style runs can verify startup and layout without a physical webcam.

## Face Recognition

Box4Fit can recognize a registered player locally before a workout starts. It uses SCRFD ONNX for face detection, ONNX Runtime Web for local inference, an ONNX embedding model, and `localStorage` for averaged embeddings.

No face images are stored, and no backend or cloud API is used.

Place the model files here:

```text
assets/models/face-recognition/500m.onnx
assets/models/face-recognition/w600k_mbf.onnx
```

See [doc/face-recognition.md](doc/face-recognition.md) for setup, tuning thresholds, sample counts, startup timing, profile behavior, and disable flags.

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

The app is static, so it can be hosted by any static file server as long as all `js/`, `assets/`, model, vendor, and service-worker files are served with the project.

Docker example:

```bash
sudo docker run -d -p 8000:8000 --name tfit tfit
```

For webcam access in production, serve the app over HTTPS.
