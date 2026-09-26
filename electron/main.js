const { app, BrowserWindow, shell, session } = require("electron");
const fs = require("fs");
const path = require("path");

// Imagine needs no device permissions; deny everything the page asks for.
const ALLOWED_PERMISSIONS = new Set(["fullscreen"]);

function isExternal(url) {
  return /^https?:/i.test(url);
}

// "photo.png" -> "photo (1).png", "photo (2).png", ... until the name is free.
function uniquePath(dir, filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = path.join(dir, filename);
  for (let i = 1; fs.existsSync(candidate); i++) {
    candidate = path.join(dir, `${base} (${i})${ext}`);
  }
  return candidate;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 360,
    minHeight: 500,
    title: "Imagine",
    backgroundColor: "#15171c",
    icon: path.join(__dirname, "..", "icons", "icon-512.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.once("ready-to-show", () => win.show());

  // Links with target="_blank" open in the user's default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternal(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  // Never navigate the app window itself away from the bundled page.
  win.webContents.on("will-navigate", (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault();
      if (isExternal(url)) shell.openExternal(url);
    }
  });

  win.loadFile(path.join(__dirname, "..", "imagine.html"));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => ALLOWED_PERMISSIONS.has(permission));

  // Exports and batch output save straight to Downloads, as they do in a
  // browser, rather than opening a Save dialog for every image in a batch.
  session.defaultSession.on("will-download", (_event, item) => {
    item.setSavePath(uniquePath(app.getPath("downloads"), item.getFilename()));
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
