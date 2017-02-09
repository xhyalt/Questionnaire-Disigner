var fetch = require("node-fetch");
// var util = require("./util.js");
var http = require('http');
var url = require('url');
const quesSqlite = require("./quesSqlite.js");

/**
 * 登录验证函数
 * @public
 * @param  GlobalData 用户基础数据
 * @param  cb callback
 * @return 登录成功返回chunk的JSON对象
 * @return 登录不成功返回error信息
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
        alert(`Got error: ${e.message}`);
    });
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

/**
 * 获取某用户的问卷列表的URL
 * @private
 * @param  GlobalData 用户基本信息
 * @return 返回某用户的问卷列表的URL
 */
function __getQuestionnairesListURL(GlobalData) {
    return __getQuestionnairesURL(GlobalData, "getQuestionnaires");
}

function __getQuestionnaireInfoURL(GlobalData) {
    return __getQuestionnairesURL(GlobalData, "getQuestionnaireDataInfo");
}

function __getDeleteQuestionnaireInfoURL(GlobalData) {
    return __getQuestionnairesURL(GlobalData, "deleteQuestionnaireData");
}

function __getSaveQuestionnaireInfoURL(GlobalData) {
    return __getQuestionnairesURL(GlobalData, "saveQuestionnaireData");
}

/**
 * 获取除了token以外的URL
 * @private
 * @param  GlobalData 用户基本信息
 * @param  service API接口的差别信息
 * @return 根据传参返回URL
 */
function __getQuestionnairesURL(GlobalData, service) {
    var url = `http://${GlobalData.urlRoot}/jqrapi/questionnaire/${service}?src=${GlobalData.src}&devid=${GlobalData.devid}&token=${GlobalData.token}&loginContext=${GlobalData.loginContext}`;

    return url;
}

exports.getToken = getToken;
