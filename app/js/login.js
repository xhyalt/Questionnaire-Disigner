var restfulUtil = require("./restfulUtil.js");

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
      alert("miaolegemi");
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
        alert("miaolegemi2");
        //restFul请求
        //处理url
        var url = restfulUtil.getUrl(GlobalData);
        alert("miaolegemi3");
        restfulUtil.getToken(url);
        alert("miaolegemi4");
        alert("hehe");
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
