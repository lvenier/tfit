const fs = require("node:fs");
const pkg = require("../package.json");

const content = `
globalThis.APP_VERSION = "Box4Fit © 2026 (v${pkg.version})";
document.getElementById("loading-version").textContent = globalThis.APP_VERSION;
`;

fs.writeFileSync("js/version.js", content);

fs.writeFileSync(
  "service-worker-version.js",
  `self.APP_VERSION="${pkg.version}";\n`
);

console.log("Generated version.js:", pkg.version);