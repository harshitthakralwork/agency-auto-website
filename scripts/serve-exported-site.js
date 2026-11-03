const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 8080;

// Find the latest generated build directory in storage/generated
const generatedRoot = path.resolve(__dirname, "..", "storage", "generated");

function findLatestBuildDir(root) {
  if (!fs.existsSync(root)) return null;
  const projectDirs = fs.readdirSync(root);
  let latestDir = null;
  let latestMtime = 0;

  for (const pDir of projectDirs) {
    const fullP = path.join(root, pDir);
    if (!fs.statSync(fullP).isDirectory()) continue;
    const subDirs = fs.readdirSync(fullP);
    for (const sDir of subDirs) {
      const fullS = path.join(fullP, sDir);
      if (fs.statSync(fullS).isDirectory() && sDir.startsWith("build_")) {
        const mtime = fs.statSync(fullS).mtimeMs;
        if (mtime > latestMtime) {
          latestMtime = mtime;
          latestDir = fullS;
        }
      }
    }
  }
  return latestDir;
}

const serveDir = findLatestBuildDir(generatedRoot);

if (!serveDir) {
  console.error("No generated website found in storage/generated.");
  process.exit(1);
}

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split("?")[0];
  let filePath = path.join(serveDir, reqUrl);

  // Clean URLs: /solutions -> /solutions.html
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    if (fs.existsSync(filePath + ".html")) {
      filePath = filePath + ".html";
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

server.listen(port, () => {
  console.log(`Standalone Website live at: http://localhost:${port}`);
  console.log(`Serving directory: ${serveDir}`);
});

