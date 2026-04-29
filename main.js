const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: "orcamentos_ia_icon.ico",
  });

  win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
  createWindow();
});