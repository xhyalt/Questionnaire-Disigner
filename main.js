const electron = require('electron');
/*控制应用生命周期的模块*/
const app = electron.app;
/*创建原生浏览器窗口的模块*/
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const glob = require('glob');
/*与渲染进程通信的模块*/
const ipcMain = require('electron').ipcMain;
/*保持其全局引用，不然JS被GC，windows自动关闭*/
var mainWindow = null;
var previewWindow = null;
/*用户基本数据的全局引用*/
var GlobalData = null;
var tempQuestionnaireName = null;
var onlineStatus = null;

/*监听渲染进程里发出的message，获取GlobalData*/
ipcMain.on('asynchronous-set-GlobalData-message', (event, arg) => {
    GlobalData = arg;
    event.sender.send('asynchronous-set-GlobalData-reply', true);
});

/*监听渲染进程里发出的message，发送GlobalData*/
ipcMain.on('asynchronous-get-GlobalData-message', (event) => {
    event.sender.send('asynchronous-get-GlobalData-reply', GlobalData);
});

/*监听渲染进程里发出的message，获取tempQuestionnaireName*/
ipcMain.on('asynchronous-set-tempQuestionnaireName-message', (event, arg) => {
    tempQuestionnaireName = arg;
    event.sender.send('asynchronous-set-tempQuestionnaireName-reply', true);
});

/*监听渲染进程里发出的message，发送tempQuestionnaireName*/
ipcMain.on('asynchronous-get-tempQuestionnaireName-message', (event) => {
    event.sender.send('asynchronous-get-tempQuestionnaireName-reply', tempQuestionnaireName);
});

/*监听渲染进程里发出的message，获取onlineStatus*/
ipcMain.on('asynchronous-set-onlineStatus-message', (event, arg) => {
    onlineStatus = arg;
    event.sender.send('asynchronous-set-onlineStatus-reply', true);
});

/*监听渲染进程里发出的message，发送onlineStatus*/
ipcMain.on('asynchronous-get-onlineStatus-message', (event) => {
    event.sender.send('asynchronous-get-onlineStatus-reply', onlineStatus);
});

/*监听渲染进程里发出的message，发送当前应用目录*/
ipcMain.on('asynchronous-get-DirName-message', (event, arg) => {
    event.sender.send('asynchronous-get-DirName-reply', `file://${__dirname}`);
});

/*在主进程里向渲染进程发出message，发送GlobalData*/
ipcMain.on('synchronous-GlobalData-message', (event, arg) => {
    console.log("主进程发送GlobalData");
    event.returnValue = 'pong';
});

ipcMain.on('get-app-path', function(event) {
    event.sender.send('got-app-path', app.getAppPath())
});

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
        // show: false,
        backgroundColor: '#f3f3f3'
    });

    /*加载进入页*/
    mainWindow.loadURL(`file://${__dirname}/app/login.html`);

    /*当关闭该window时，这个事件被发出*/
    mainWindow.on('closed', function() {
        mainWindow = null;
    });

    /*在所有都加载完成后，再显示窗口并聚焦提醒用户*/
    // mainWindow.on('ready-to-show', function() {
    //     mainWindow.show();
    //     mainWindow.focus();
    //     /*打开窗口后再最大化*/
    //     mainWindow.maximize();
    // });
});
