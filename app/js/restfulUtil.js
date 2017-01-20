var fetch = require("node-fetch");
// var util = require("./util.js");
var http = require('http');
var url = require('url');
var quesSqlite = require("./quesSqlite.js");

/**
 * 规范登录URL
 */
function getUrl(GlobalData) {
    var url = `http://` + GlobalData.urlRoot + `/jqrapi/auth/login/${GlobalData.user}?pwd=${GlobalData.pwd}&src=${GlobalData.src}&devid=${GlobalData.devid}`;
    return url;
}

/**
 * 登录验证函数
 * 登录成功则查询本地是否有该用户
 *    如果没有则加入数据，进入list
 *    如果有则更新数据，进入list
 * 登录不成功则根据error信息判断错误
 */
function getToken(url, GlobalData) {
    var http = require('http');
    var resJSON;

    http.get(url, (res) => {
        //alert('STATUS: ' + res.statusCode);
        //alert('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            resJSON = eval('(' + chunk + ')');
            GlobalData.username = resJSON.username;
            GlobalData.token = resJSON.token;
            alert('token: ' + resJSON.token);
        });
        /*登录成功*/
        if (res.statusCode == 200) {
            quesSqlite.createUserTable();
            // alert(createUserTable().data);
            alert("登录成功1");
            /*查询本地是否存在该用户的记录*/
            if (checkUser(GlobalData).success == true) {
                alert("登陆成功2");
                /*存在该记录 更新记录*/
                updateUser(GlobalData);
            } else {
                alert("登录不成功");
                /*不存在该记录 添加记录*/
                insertUser(GlobalData);
            }
            /*跳转进入list页面*/
            window.location.href = "./list.html";
        }
        // res.write(data.toString());
        // consume response body
        res.resume();
        return GlobalData;
    }).on('error', (e) => {
        alert(`Got error: ${e.message}`);
    });

}

function _questionUrl(service, GlobalData) {
    return GlobalData.root + `questionnaire/${service}?src=${GlobalData.src}&devid=${GlobalData.devid}&token=${GlobalData.token}&loginContext=${GlobalData.loginContext}`;
}
exports.getUrl = getUrl;
exports.getToken = getToken;
