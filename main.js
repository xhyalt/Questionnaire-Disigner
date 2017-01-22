const electron = require('electron');
/*控制应用生命周期的模块*/
const app = electron.app;
/*创建原生浏览器窗口的模块*/
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const glob = require('glob');
const ipc = require('electron').ipcMain;
/*保持其全局引用，不然JS被GC，windows自动关闭*/
var mainWindow = null;

// const quesSqlite = require('./app/js/quesSqlite.js');

ipc.on('get-app-path', function(event) {
    event.sender.send('got-app-path', app.getAppPath())
})

/*当所有窗口关闭了，退出*/
app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

/**
 * 当Electron初始化完毕并准备创建浏览器窗口时
 * 这个方法就被调用
 */
app.on('ready', function() {

    /*获取屏幕大小*/
    var electronScreen = electron.screen;
    var size = electronScreen.getPrimaryDisplay().workAreaSize;

    /*创建客户端窗口*/
    mainWindow = new BrowserWindow({
        title: "问卷设计器",
        width: size.width,
        height: size.height,
        minWidth: 1200,
        minHeight: 800,
        show: false
    });

    /*加载进入页*/
    mainWindow.loadURL(`file://${__dirname}/app/login.html`);

    /*当关闭该window时，这个事件被发出*/
    mainWindow.on('closed', function() {
        mainWindow = null;
    });

    /*在所有都加载完成后，再显示窗口并聚焦提醒用户*/
    mainWindow.on('ready-to-show', function() {
        mainWindow.show();
        mainWindow.focus();
        /*打开窗口后再最大化*/
        mainWindow.maximize();
    });
});
