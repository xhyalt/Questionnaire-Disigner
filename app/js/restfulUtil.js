var fetch = require("node-fetch");
// var util = require("./util.js");
var http = require('http');
var url = require('url');
var fetch = require("node-fetch");
// const quesSqlite = require("./quesSqlite.js");

/**
 * 登录token请求
 * @public
 * @param  GlobalData 用户基础数据
 * @param  cb callback
 * @return 请求成功返回chunk的JSON对象
 * @return 请求不成功返回error信息
 */
function getToken(GlobalData, cb) {
    var http = require('http');
    var url = __getTokenUrl(GlobalData);

    http.get(url, (res) => {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            cb(res.statusCode, chunk);
        });
        res.resume();
    }).on('error', (e) => {
        alert(`无法登录: ${e.message}`);
    });
}

/**
 * restful请求核心方法
 * @param type 请求type和请求的内容对应
 * @param obj 请求参数
 * @param cb 回调函数
 */
function getData(type, obj, cb) {
    console.log("getData " + JSON.stringify(obj));
    /**
     * type 1方案 2 yewu 3 ques 4 save
     */
    fetch(obj.url, obj.body)
        .then(function(res) {
            // console.log(res.json());
            return res.json();
        })
        .then(function(resJson) {
            if (cb) {
                // 请求成功调用回调函数将数据传回
                // console.log("resJson " + JSON.stringify(resJson));
                cb({
                    success: true,
                    type: type,
                    resJson: resJson,
                    data: obj.data
                });
            }
        })
        .catch(function(err) {
            // 异常返回
            console.log(err);
            cb({
                success: false,
                type: type,
                data: err
            });
        });
}

/**
 * 方案请求
 * @public
 * @param  GlobalData 用户基础数据
 * @param  cb callback
 * @return 请求成功返回chunk的JSON对象
 * @return 请求不成功返回error信息
 */
function getSolutions(GlobalData, cb) {
    getData(1, {
        url: __getSolutionsURL(GlobalData),
        body: {
            method: "POST",
            timeout: 3000
        }
    }, cb);
}

/**
 * 合成获取方案的URL的函数
 * @private
 * @param  GlobalData 用户基础数据
 * @return 获取方案的URL
 */
function __getSolutionsURL(GlobalData) {
    var url = `http://${GlobalData.urlRoot}/jqrapi/questionnaire/getSolutions?user=${GlobalData.user}src=${GlobalData.src}&devid=${GlobalData.devid}&token=${GlobalData.token}&loginContext=${GlobalData.loginContext}`;
    return url;
}

/**
 * 获取Token的URL
 * @private
 * @param GlobalData
 * @return 获取token的URL
 */
function __getTokenUrl(GlobalData) {
    var url = `http://${GlobalData.urlRoot}/jqrapi/auth/login/${GlobalData.user}?pwd=${GlobalData.pwd}&src=${GlobalData.src}&devid=${GlobalData.devid}`;
    return url;
}

exports.getToken = getToken;
exports.getSolutions = getSolutions;
