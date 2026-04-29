const { app, BrowserWindow, Menu } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  });

  Menu.setApplicationMenu(null);

  win.maximize(); // 🔥 abre em ecrã cheio

  win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
  createWindow();
});