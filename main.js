const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const events = require("./events");

try {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  });
} catch (e) {}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    minWidth: 600,
    height: 600,
    icon: __dirname + "/icon.icns",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  events.attachEvents(win);

  win.loadFile("view/home/index.html");

  win.setMenu(null);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
