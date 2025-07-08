const http = require('http');
const path = require('path');
const fs = require('fs');
const { dialog } = require('electron');

/**
 * 檢查埠是否被占用
 * @param {number} port 埠號
 * @returns {Promise<boolean>} 埠是否被占用
 */
function checkPort(port) {
  return new Promise(resolve => {
    const server = http.createServer();
    server.once('error', () => {
      resolve(true); // 埠被占用
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // 埠未被占用
    });
    server.listen(port);
  });
}

/**
 * 啟動 Next.js 服務
 * @param {number} port 埠號
 * @param {Object} app Electron app 對象
 * @returns {Promise<string>} 服務URL
 */
async function startNextServer(port, app) {
  console.log(`AI Dataset 用戶端啟動中，當前版本: ${require('../util').getAppVersion()}`);

  // 設置日誌檔案路徑
  const logDir = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, `nextjs-${new Date().toISOString().replace(/:/g, '-')}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  // 重定向 console.log 和 console.error
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  console.log = function () {
    const args = Array.from(arguments);
    const logMessage = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)).join(' ');

    logStream.write(`[${new Date().toISOString()}] [LOG] ${logMessage}\n`);
    originalConsoleLog.apply(console, args);
  };

  console.error = function () {
    const args = Array.from(arguments);
    const logMessage = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)).join(' ');

    logStream.write(`[${new Date().toISOString()}] [ERROR] ${logMessage}\n`);
    originalConsoleError.apply(console, args);
  };

  // 檢查埠是否被占用
  const isPortBusy = await checkPort(port);
  if (isPortBusy) {
    console.log(`埠 ${port} 已被占用，嘗試直接連接...`);
    return `http://localhost:${port}`;
  }

  console.log(`啟動 Next.js 服務，埠: ${port}`);

  try {
    // 動態導入 Next.js
    const next = require('next');
    const nextApp = next({
      dev: false,
      dir: path.join(__dirname, '../..'),
      conf: {
        // 配置 Next.js 的日誌輸出
        onInfo: info => {
          console.log(`[Next.js Info] ${info}`);
        },
        onError: error => {
          console.error(`[Next.js Error] ${error}`);
        },
        onWarn: warn => {
          console.log(`[Next.js Warning] ${warn}`);
        }
      }
    });
    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();

    const server = http.createServer((req, res) => {
      // 記錄請求日誌
      console.log(`[Request] ${req.method} ${req.url}`);
      handle(req, res);
    });

    return new Promise(resolve => {
      server.listen(port, err => {
        if (err) throw err;
        console.log(`服務已啟動，正在打開應用...`);
        resolve(`http://localhost:${port}`);
      });
    });
  } catch (error) {
    console.error('啟動服務失敗:', error);
    dialog.showErrorBox('啟動失敗', `無法啟動 Next.js 服務: ${error.message}`);
    app.quit();
    return '';
  }
}

module.exports = {
  checkPort,
  startNextServer
};
