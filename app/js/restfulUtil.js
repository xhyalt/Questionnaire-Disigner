var fetch = require("node-fetch");
// var util = require("./util.js");
var http = require('http');
var url = require('url');
const quesSqlite = require("./quesSqlite.js");

/**
 * 登录验证函数
 * 登录成功则choken的JSON对象
 * 登录不成功则根据error信息判断错误
 */
function getToken(url, cb) {
    var http = require('http');

    http.get(url, (res) => {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            cb(res.statusCode, chunk);
        });
        res.resume();
    }).on('error', (e) => {
        alert(`Got error: ${e.message}`);
    });
}

exports.getToken = getToken;
