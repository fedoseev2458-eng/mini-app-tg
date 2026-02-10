const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "frontend", "dist");
const deployDir = path.join(__dirname, "..", "frontend", "dist-deploy");

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(deployDir)) fs.rmSync(deployDir, { recursive: true });
copyRecursive(distDir, deployDir);

const toRemove = ["chair.glb", "chair.usdz"];
for (const file of toRemove) {
  const p = path.join(deployDir, file);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log("Excluded from deploy (to avoid upload timeout):", file);
  }
}

console.log("Deploy bundle ready in frontend/dist-deploy (~200 KB without 3D models)");
