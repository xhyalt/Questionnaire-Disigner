var fetch = require("node-fetch");
// var util = require("./util.js");
var http = require('http');
var url = require('url');
var fetch = require("node-fetch");

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
 * 业务方案请求
 * @public
 * @param  GlobalData 用户基础数据
 * @param  cb callback
 * @return 请求成功返回chunk的JSON对象
 * @return 请求不成功返回error信息
 */
function getSolutions(GlobalData, cb) {
    console.log("__getSolutions");
    __getData(1, {
        url: __getSolutionsURL(GlobalData),
        body: {
            method: "POST",
            timeout: 3000
        }
    }, cb);
}

/**
 * 调查问卷请求
 * @param  GlobalData [用户基础数据]
 * @param  obj        [业务方案的recid]
 * @param  {Function} cb         [回调函数]
 * @return
 */
function getQuestionnaires(GlobalData, obj, cb) {
    __getData(2, {
        url: __getQuestionnairesURL(GlobalData),
        body: {
            method: "POST",
            timeout: 3000,
            body: `data={solutionId:${obj}}`
        }
    }, cb);
}

/**
 * restful请求核心方法
 * @private
 * @param type 请求type和请求的内容对应
 * @param obj 请求参数
 * @param cb 回调函数
 */
function __getData(type, obj, cb) {
    console.log("__getData " + JSON.stringify(obj));
    /**
     * type 1 业务方案 2 调查问卷 3 ques 4 save
     */
    console.log("obj.url " + obj.url);
    console.log("obj.body " + JSON.stringify(obj.body));
    fetch(obj.url, obj.body).then(function(res) {
        console.log("res.json() " + JSON.stringify(res.json()));
        return res.json();
    }).then(function(resJson) {
        if (cb) {
            // 请求成功调用回调函数将数据传回
            cb({
                success: true,
                type: type,
                resJson: resJson,
                data: obj.data
            });
        }
    }).catch(function(err) {
        // 异常返回
        console.log("err " + err);
        cb({
            success: false,
            type: type,
            data: err.message
        });
    });
}

/**
 * 合成获取方案的URL的函数
 * @private
 * @param  GlobalData 用户基础数据
 * @return 获取方案的URL
 */
function __getSolutionsURL(GlobalData) {
    console.log("loginContext = " + GlobalData.loginContext);
    var url = `http://${GlobalData.urlRoot}/jqrapi/questionnaire/getSolutions?user=${GlobalData.user}&src=${GlobalData.src}&devid=${GlobalData.devid}&token=${GlobalData.token}&loginContext=${GlobalData.loginContext}`;
    return url;
}

/**
 * 合成获取问卷的URL函数
 * @private
 * @param  GlobalData [用户基础数据]
 * @return 获取问卷的URL
 */
function __getQuestionnairesURL(GlobalData) {
    var url = `http://${GlobalData.urlRoot}/jqrapi/questionnaire/getQuestionnaires?user=${GlobalData.user}&src=${GlobalData.src}&devid=${GlobalData.devid}&token=${GlobalData.token}&loginContext=${GlobalData.loginContext}`;
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
exports.getQuestionnaires = getQuestionnaires;
