import { app, BrowserWindow, ipcMain, shell } from "electron";
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
  app.quit();
}

const activeWindows: BrowserWindow[] = [];

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
  });

  activeWindows.push(mainWindow);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Force electron to open clicked links in the browser, instead of navigating to them
  // within the electron window
  const localUrl = (url: string) =>
    url.endsWith("main_window") || url.startsWith("file://");
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!localUrl(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!localUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("minimize-windows", () => {
  activeWindows.forEach((window) => window.minimize());
});
