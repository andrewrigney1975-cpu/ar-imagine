// Renders the app icons for the desktop and Android builds:
//   build/icon.png (512x512) for electron-builder
//   android/app/src/main/res/mipmap-*/ic_launcher*.png for Capacitor
// The artwork matches icons/icon.svg -- update both together.
// Run with: npm run icon
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RES = path.join(ROOT, "android", "app", "src", "main", "res");

// Launcher icons are 48dp; adaptive icon layers are 108dp.
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

// Runs in the renderer. shape: "square" (rounded rect), "round" (circle) or
// "foreground" (a full-bleed adaptive icon layer, with the star kept inside
// the 66dp safe zone of its 108dp canvas).
function draw(size, shape) {
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  ctx.scale(size / 512, size / 512);

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, "#7b8bff"); grad.addColorStop(1, "#4f5fd6");
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (shape === "round") ctx.arc(256, 256, 256, 0, Math.PI * 2);
  else if (shape === "foreground") ctx.rect(0, 0, 512, 512);
  else ctx.roundRect(0, 0, 512, 512, 138);
  ctx.fill();

  // The star spans 72..440 of 512; shrink it to fit the adaptive safe zone.
  if (shape === "foreground") {
    ctx.translate(256, 256); ctx.scale(0.62, 0.62); ctx.translate(-256, -256);
  }
  ctx.fillStyle = "#ffffff";
  ctx.fill(new Path2D("M256 72 L296.7 215.3 L440 256 L296.7 296.7 L256 440 L215.3 296.7 L72 256 L215.3 215.3 Z"));

  return c.toDataURL("image/png");
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false });
  await win.loadURL("about:blank");

  async function render(file, size, shape) {
    const dataUrl = await win.webContents.executeJavaScript(
      "(" + draw.toString() + ")(" + size + ", " + JSON.stringify(shape) + ")");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
    console.log("Wrote " + path.relative(ROOT, file));
  }

  await render(path.join(ROOT, "build", "icon.png"), 512, "square");

  if (fs.existsSync(RES)) {
    for (const [name, scale] of Object.entries(DENSITIES)) {
      const dir = path.join(RES, "mipmap-" + name);
      await render(path.join(dir, "ic_launcher.png"), 48 * scale, "square");
      await render(path.join(dir, "ic_launcher_round.png"), 48 * scale, "round");
      await render(path.join(dir, "ic_launcher_foreground.png"), 108 * scale, "foreground");
    }
  }

  app.quit();
});
