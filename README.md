![Version](https://img.shields.io/github/package-json/v/SaaShup/tfit)
![Node](https://img.shields.io/badge/js-vanilla-green)
![License](https://img.shields.io/github/license/lvenier/tfit)
![Last Commit](https://img.shields.io/github/last-commit/lvenier/tfit)
![Repo Size](https://img.shields.io/github/repo-size/lvenier/tfit)
![Top Language](https://img.shields.io/github/languages/top/lvenier/tfit)
![CI](https://github.com/lvenier/tfit/actions/workflows/ci.yml/badge.svg)

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
