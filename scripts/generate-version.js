const fs = require("node:fs");
const pkg = require("../package.json");

function readIndexAssetPaths() {
  const indexHtml = fs.readFileSync("index.html", "utf8");
  const scriptPaths = [...indexHtml.matchAll(/<script\s+[^>]*src="([^"]+)"/g)]
    .map(match => match[1]);
  const stylesheetPaths = [...indexHtml.matchAll(/<link\s+[^>]*href="([^"]+\.css)"[^>]*>/g)]
    .map(match => match[1]);
  const manifestPaths = [...indexHtml.matchAll(/<link\s+[^>]*rel="manifest"[^>]*href="([^"]+)"/g)]
    .map(match => match[1]);

  return [
    ...manifestPaths,
    ...stylesheetPaths,
    ...scriptPaths
  ];
}

function toCachePath(path) {
  return path.startsWith("./") ? path : `./${path}`;
}

function unique(paths) {
  return [...new Set(paths)];
}

const content = `
globalThis.APP_VERSION = "Box4Fit © 2026 (v${pkg.version})";
document.getElementById("loading-version").textContent = globalThis.APP_VERSION;
`;

fs.writeFileSync("js/version.js", content);

fs.writeFileSync(
  "service-worker-version.js",
  `self.APP_VERSION="${pkg.version}";\n`
);

const coreAssets = unique([
  "./",
  "./index.html",
  ...readIndexAssetPaths().map(toCachePath),
  "./js/p5js/p5.js",
  "./js/p5js/p5.sound.js",
  "./js/ml5js/ml5.min.js",
  "./js/ml5js/model.json",
  "./js/ml5js/group1-shard1of3.bin",
  "./js/ml5js/group1-shard2of3.bin",
  "./js/ml5js/group1-shard3of3.bin",
  "./assets/logos/logo.256.png",
  "./assets/logos/logo.512.rounded.png"
]);

fs.writeFileSync(
  "service-worker-assets.js",
  `self.CORE_ASSETS=${JSON.stringify(coreAssets, null, 2)};\n`
);

console.log("Generated version.js:", pkg.version);
