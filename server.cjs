const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT) || 4284;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf"
};

http.createServer((req, res) => {
  let filename;
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    filename = path.resolve(root, `.${pathname}`);
    if (filename !== root && !filename.startsWith(root + path.sep)) throw Error("Outside preview");
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }
  fs.stat(filename, (error, info) => {
    if (error) {
      res.writeHead(404).end("Not found");
      return;
    }
    if (info.isDirectory()) filename = path.join(filename, "index.html");
    fs.stat(filename, (fileError, fileInfo) => {
      if (fileError || !fileInfo.isFile()) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(filename)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      fs.createReadStream(filename).pipe(res);
    });
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`Preview: http://127.0.0.1:${port}/paper1/ and /paper2/`);
});
