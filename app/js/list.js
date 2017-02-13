/*引用JS文件*/
const restfulUtil = require('./js/restfulUtil.js');
const quesSqlite = require('./js/quesSqlite.js');
/*与主进程通信的模块*/
const ipcRenderer = require('electron').ipcRenderer;
/*用户基础数据*/
var GlobalData = null;

function initQuestionnaire() {
    var solutionsLength = null;
    var questionnairesLength = null;
    /*获取用户基础数据*/
    __getGlobalData(function(res) {
        if (res.success == true) {
            console.log("GlobalData传输成功");
            /*向服务器请求获取业务方案 restfulUtil.js*/
            restfulUtil.getSolutions(GlobalData, function(res) {
                var solutionsInfo = res.resJson.solutionInfo;
                var solutionsLength = __getJsonLength(res.resJson.solutionInfo);
                console.log("业务方案的长度 " + solutionsLength);
                for (var i = 0; i < solutionsLength; i++) {
                    /*更新某业务方案 quesSqlite.js*/
                    quesSqlite.initSolutions(GlobalData, solutionsInfo[i], (function(index) {
                        return function(res) {
                            /*处理业务方案*/
                            if (res.success == true) {
                                /*向服务器请求获取调查问卷 restfulUtil.js*/
                                console.log("向服务器请求获取调查问卷");
                                restfulUtil.getQuestionnaires(GlobalData, solutionsInfo[index].recid, function(res2) {
                                    var questionnairesInfo;
                                    var questionnairesLength = __getJsonLength(res2.resJson.questionnairelist);
                                    if (questionnairesLength > 0)
                                        questionnairesInfo = res2.resJson.questionnairelist;
                                    console.log("该方案包含的问卷个数为" + questionnairesLength);
                                    for (var j = 0; j < questionnairesLength; j++) {
                                        /*更新某业务方案的调查问卷 quesSqlite.js*/
                                        quesSqlite.initQuestionnairesList(GlobalData, solutionsInfo[index].recid, questionnairesInfo[j], function(res3) {
                                            if(res3.success == true){
                                                console.log("调查问卷逻辑已跳出  ");
                                            }
                                            else{
                                              console.log("此调查问卷失败")
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    })(i));
                }
            });
        } else {
            console.log("GlobalData传输错误");
        }
    });
}

/**
 * 与主进程通信获取用户基础数据GlobalData
 * @private
 * @return
 */
function __getGlobalData(cb) {
    try {
        ipcRenderer.send('asynchronous-get-GlobalData-message');
        ipcRenderer.on('asynchronous-get-GlobalData-reply', (event, arg) => {
            console.log("渲染进程收到GlobalData");
            GlobalData = arg;
            cb({
                success: true
            });
        });
    } catch (err) {
        cb({
            success: true,
            data: err.message
        });
    }
}

/**
 * 获取JSON某元素的长度
 * @private
 * @param  jsonData 某JSON
 * @return 返回该JSON的长度
 */
function __getJsonLength(jsonData) {
    var jsonLength = 0;
    for (var item in jsonData) {
        jsonLength++;
    }
    return jsonLength;
}
