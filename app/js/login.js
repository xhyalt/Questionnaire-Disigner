/*引用JS文件*/
const restfulUtil = require('./js/restfulUtil.js');
const quesSqlite = require('./js/quesSqlite.js');
/*与主进程通信的模块*/
const ipcRenderer = require('electron').ipcRenderer;
/*用户基础数据*/
var GlobalData = {
    "urlRoot": "",
    "host": "",
    "post": "",
    "user": "",
    "pwd": "",
    "userName": "",
    "token": "",
    // "urlRoot": urlValue,
    // "admin": adminValue,
    // "pwd": passwordValue,
    "devid": "CE2E-2A7C-3F8C-C6F5",
    "src": "000001399FCE11FEA057EFDF592FE408",
    "loginContext": "1"
};

/**
 * 登录按钮点击事件，处理登录逻辑
 * @public
 * @return
 */
function signIn() {
    // if (__validateForm()) {
    if (true) {
        var urlValue = document.forms["login"]["url"].value;
        var adminValue = document.forms["login"]["username"].value;
        var passwordValue = document.forms["login"]["password"].value;
        urlValue = doWithRootURL(urlValue);

        // var i = urlValue.lastIndexOf(':');
        // GlobalData.host = urlValue.substring(0, i);
        // GlobalData.post = urlValue.substr(i);
        GlobalData.urlRoot = "10.2.20.74:9797";
        GlobalData.host = "10.2.20.74";
        GlobalData.post = 9797;
        GlobalData.user = "heyedong";
        GlobalData.pwd = "1";

        /*get请求token restfulUtil.js*/
        restfulUtil.getToken(GlobalData, function(statusCode, chunk) {
            var body = eval('(' + chunk + ')');
            if (statusCode == 200) {
                console.log("登录成功");
                // alert(body.token);
                GlobalData.username = body.username;
                GlobalData.token = body.token;
                /*与主进程通信，发送GlobalData*/
                __setGlobalData();
                /*初始化数据库 quesSqlite.js*/
                quesSqlite.initDB(GlobalData, function(res) {
                    console.log("login.js = " + res.success);
                    if (res.success == true) {
                        window.location.href = "./list.html";
                    } else {
                        alert("后台处理有错，error：" + res.data, "提示");
                    }
                });
            } else if (statusCode == 401) {
                alert(body.error_msg, "提示");
            } else {
                alert("无法登录，请重新登录！", "提示");
            }
        });
    }
}

/**
 * 发送用户基础数据JSON给主进程
 * @private
 * @return
 */
function __setGlobalData() {
    ipcRenderer.send('asynchronous-set-GlobalData-message', GlobalData);
    ipcRenderer.on('asynchronous-set-GlobalData-reply', (event, arg) => {
        console.log("主进程收到GlobalData是否成功 " + arg);
    });
}

/**
 * 回车自动登录
 * @public
 * @return
 */
function keySignIn() {
    if (event.keyCode == 13)
        signIn();
}

/**
 * 表单验证函数
 * @private
 * @return 返回表单是否符合格式要求
 */
function __validateForm() {
    var urlValue = document.forms["login"]["url"].value;
    var patt = /(localhost|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})):\d{4,5}/g;
    // var patt = /^(localhost|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})):\d{4,5}$/g;
    var adminValue = document.forms["login"]["username"].value;
    var passwordValue = document.forms["login"]["password"].value;
    if (urlValue == null || urlValue == "") {
        window.alert("请填写URL！", "提示");
        return false;
    } else if (adminValue == null || adminValue == "") {
        window.alert("请填写账户名！", "提示");
        return false;
    } else if (passwordValue == null || passwordValue == "") {
        window.alert("请填写密码！", "提示");
        return false;
    } else if (urlValue.trim().match(patt) == null) {
        window.alert("不是一个有效的 url 地址！", "提示");
        return false;
    }
    return true;
}

/**
 * 规范登录请求URL格式
 * @private
 * @param  urlValue 未规范的URL
 * @return 规范后的urlValue
 */
function doWithRootURL(urlValue) {
    var patt = /(localhost|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})):\d{4,5}/g;
    //urlValue = urlValue.trim().match(patt);
    if (urlValue.lastIndexOf("/") == urlValue.length - 1)
        urlValue = urlValue.substring(0, urlValue.length - 1);
    return urlValue;
}
