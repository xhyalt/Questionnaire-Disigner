const electron = require('electron');
//控制应用生命周期的模块
const app = electron.app;
//创建原生浏览器窗口的模块
const BrowserWindow = electron.BrowserWindow;
//保持其全局引用，不然JS被GC，windows自动关闭
var mainWindow = null;

//当所有窗口关闭了，退出
app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

//当Electron初始化完毕并准备创建浏览器窗口时
//这个方法就被调用
app.on('ready', function() {
    //创建浏览器窗口
    mainWindow = new BrowserWindow({
        title: "问卷设计器",
        width: 12000,
        height: 8000,
        minWidth: 1200,
        minHeight: 800,
        // autoHideMenuBar: true
    });

    //加载index.html
    mainWindow.loadURL('file://' + __dirname + './app/index.html');

    //当关闭该window时，这个事件被发出
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});
