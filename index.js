// IMPORT
const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const url = require('url');

// WINDOW
let win;
const winWidth = 425;
const winHeight = 600;

function createWindow () {
  win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    backgroundColor: 'black',
    center: true,
    icon: getPlatformIcon('logo'),
    frame: false,
    //resizable: false,
    webPreferences: {nodeIntegration: true}
  });

  win.loadURL(url.format({
      pathname: path.join(__dirname, 'app', 'launcher.html'),
      protocol: 'file:',
      slashes: true
  }));

  win.setMenu(null);

  win.on('restore', (e) => {
      win.setSize(winWidth, winHeight);
  });

  win.on('closed', function () {
    win = null;
  });
}

// IPC

ipcMain.on('logged-in', function () {
  win.loadURL(url.format({
      pathname: path.join(__dirname, 'app', 'loading.html'),
      protocol: 'file:',
      slashes: true
  }));
})

ipcMain.on('main', function () {
  win.loadURL(url.format({
      pathname: path.join(__dirname, 'app', 'launcher.html'),
      protocol: 'file:',
      slashes: true
  }));
})

ipcMain.on('options', function () {
  win.loadURL(url.format({
      pathname: path.join(__dirname, 'app', 'options.html'),
      protocol: 'file:',
      slashes: true
  }));
})

//ICON
function getPlatformIcon(name) {
    const os = process.platform;
    let icon = null;
    if(os === 'darwin') {
        icon = name + '.icns';
    }
    else if(os === 'win32') {
        icon = name + '.ico';
    }
    else {
        icon = name + '.png';
    }
    return path.join(__dirname, 'app', 'assets', 'img', icon);
}

app.setName('Falazia BK');

app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    win.webContents.openDevTools();
  })
})

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (win === null) {
    createWindow();
  }
});
