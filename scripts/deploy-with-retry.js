const { spawnSync } = require("child_process");
const path = require("path");

const maxAttempts = 6;
const delaySeconds = 10;
const deployDir = path.join(__dirname, "..", "frontend", "dist-deploy");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async function () {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log("\n--- Deploy attempt " + attempt + "/" + maxAttempts + " ---\n");
    const result = spawnSync(
      "npx",
      ["wrangler", "pages", "deploy", deployDir, "--project-name=room-ai"],
      { stdio: "inherit", shell: true }
    );
    if (result.status === 0) {
      console.log("\nDeploy succeeded.");
      process.exit(0);
    }
    if (attempt < maxAttempts) {
      console.log("\nAttempt failed. Waiting " + delaySeconds + "s before retry...");
      await sleep(delaySeconds * 1000);
    }
  }
  console.error("\nDeploy failed after all attempts.");
  process.exit(1);
})();
