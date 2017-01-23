const restfulUtil = require('./js/restfulUtil.js');
const quesSqlite = require('./js/quesSqlite.js');

/**
 * 表单验证函数
 */
function validateForm() {
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
 * 登录按钮点击事件
 */
function signIn() {
    // if (validateForm()) {
    if (true) {
        var urlValue = document.forms["login"]["url"].value;
        var adminValue = document.forms["login"]["username"].value;
        var passwordValue = document.forms["login"]["password"].value;
        urlValue = doWithRootURL(urlValue);
        var GlobalData = {
            "urlRoot": "10.2.20.74:9797",
            "user": "xuheyao",
            "pwd": "xuheyao",
            "userName": "",
            "token": "",
            // "urlRoot": urlValue,
            // "admin": adminValue,
            // "pwd": passwordValue,
            "devid": "CE2E-2A7C-3F8C-C6F5",
            "src": "000001399FCE11FEA057EFDF592FE408"
        };

        /*处理url，获得完成GET请求URL*/
        var url = restfulUtil.getUrl(GlobalData);
        var body;
        /*获得choken，其中包含token*/
        var info = restfulUtil.getToken(url, function(statusCode, chunk) {
            body = eval('(' + chunk + ')');
            if (statusCode == 200) {
                alert("登陆成功啦");
                GlobalData.username = body.username;
                GlobalData.token = body.token;
                /*初始化数据库*/
                quesSqlite.initDB(GlobalData, function(res) {
                    alert("login.js = " + res.success);
                });
                alert("token = " + body.token);
                window.location.href = "./list.html";
            } else if (statusCode == 401) {
                alert(body.error_msg, "提示");
            } else {
                alert("无法登录，请重新登录！", "提示");
            }
        });
    }
}

/**
 * 回车自动登录
 */
function keySignIn() {
    if (event.keyCode == 13)
        signIn();
}

/**
 * 规范urlRoot格式
 */
function doWithRootURL(urlValue) {
    var patt = /(localhost|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})):\d{4,5}/g;
    //urlValue = urlValue.trim().match(patt);
    if (urlValue.lastIndexOf("/") == urlValue.length - 1)
        urlValue = urlValue.substring(0, urlValue.length - 1);
    return urlValue;
}