const { BrowserWindow, shell } = require('electron');
const path = require('path');
const url = require('url');
const { getAppVersion } = require('../util');

let mainWindow;

/**
 * 創建主窗口
 * @param {boolean} isDev 是否為開發環境
 * @param {number} port 服務埠
 * @returns {BrowserWindow} 創建的主窗口
 */
function createWindow(isDev, port) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.js')
    },
    icon: path.join(__dirname, '../../public/imgs/logo.ico')
  });

  // 設置窗口標題
  mainWindow.setTitle(`Easy Dataset v${getAppVersion()}`);
  const loadingPath = url.format({
    pathname: path.join(__dirname, '..', 'loading.html'),
    protocol: 'file:',
    slashes: true
  });

  // 載入 loading 頁面時使用專門的 preload 腳本
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
  });

  mainWindow.loadURL(loadingPath);

  // 處理窗口導航事件，將外部連結在瀏覽器中打開
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    // 解析當前 URL 和導航 URL
    const parsedUrl = new URL(navigationUrl);
    const currentHostname = isDev ? 'localhost' : 'localhost';
    const currentPort = port.toString();

    // 檢查是否是外部連結
    if (parsedUrl.hostname !== currentHostname || (parsedUrl.port !== currentPort && parsedUrl.port !== '')) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // 處理新窗口打開請求，將外部連結在瀏覽器中打開
  mainWindow.webContents.setWindowOpenHandler(({ url: navigationUrl }) => {
    // 解析導航 URL
    const parsedUrl = new URL(navigationUrl);
    const currentHostname = isDev ? 'localhost' : 'localhost';
    const currentPort = port.toString();

    // 檢查是否是外部連結
    if (parsedUrl.hostname !== currentHostname || (parsedUrl.port !== currentPort && parsedUrl.port !== '')) {
      shell.openExternal(navigationUrl);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.maximize();

  return mainWindow;
}

/**
 * 載入應用URL
 * @param {string} appUrl 應用URL
 */
function loadAppUrl(appUrl) {
  if (mainWindow) {
    mainWindow.loadURL(appUrl);
  }
}

/**
 * 在開發環境中打開開發者工具
 */
function openDevTools() {
  if (mainWindow) {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * 獲取主窗口
 * @returns {BrowserWindow} 主窗口
 */
function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createWindow,
  loadAppUrl,
  openDevTools,
  getMainWindow
};
