/*引用JS文件*/
const restfulUtil = require('./js/restfulUtil.js');
const quesSqlite = require('./js/quesSqlite.js');
/*与主进程通信的模块*/
const ipcRenderer = require('electron').ipcRenderer;
/*用户基础数据*/
var GlobalData = null;
/*业务方案数据*/
var solutionsInfo = null;
/*调查问卷数据*/
var questionnairesInfo = null;
/*业务方案的个数*/
var solutionsLength = 0;
/*调查问卷的个数*/
var questionnairesLength = 0;
/*树节点个数*/
var dTreeItemNum = 0;
/*树*/
var d = null;
/*被选中的业务方案下的所有调查问卷*/
var questionnairesBySolutionsRecid = null;

/**
 * 初始化树
 * @return
 */
function initTree() {
    /*处理树*/
    d = new dTree('d');
    /*设置根节点*/
    d.add(0, -1, '业务方案组');

    /*获取用户基础数据*/
    __getGlobalData(function(res0) {
        /*获取所有业务方案 quesSqlite.js*/
        quesSqlite.getSolutions(GlobalData, function(res) {
            if (res.success == true) {
                console.log("获取所有业务方案成功");
                // console.log(JSON.stringify(res.data));
                solutionsLength = res.data.length;
                solutionsInfo = res.data;
                __addSolutionTreeItem(function(res) {
                    if (res.success == true) {
                        console.log("添加业务方案树节点成功");
                        document.getElementById('treeDemo').innerHTML = d;
                        /*获取所有调查问卷 quesSqlite.js*/
                        quesSqlite.getQuestionnaires(GlobalData, function(res2) {
                            if (res2.success == true) {
                                console.log("获取所有调查问卷成功");
                                // console.log(JSON.stringify(res2.data));
                                questionnairesLength = res2.data.length;
                                questionnairesInfo = res2.data;
                                __addQuestionnaireTreeItem(function(res) {
                                    if (res.success == true) {
                                        console.log("添加调查问卷树节点成功");
                                        d.s = (function(questionnairesInfo,questionnairesLength){
                                          return function(nodeId) {
                                              //添加节点点击事件
                                              var solutionRecidIndex = this.aNodes[nodeId].target;
                                              var quesNum = 0;
                                              console.log(solutionRecidIndex);
                                              for (var i = 0; i < questionnairesLength; i++) {
                                                  if (questionnairesInfo[i].solutionRecid == solutionRecidIndex) {
                                                      console.log(questionnairesInfo[i].title);
                                                      /*在右边显示出点击的业务方案所包含的所有调查问卷*/
                                                  }
                                              }
                                          };
                                        }(questionnairesInfo,questionnairesLength));

                                        document.getElementById('treeDemo').innerHTML = d;
                                    }
                                });
                            } else {
                                console.log("获取所有调查问卷失败");
                            }
                        });
                    } else {
                        console.log("添加业务方案节点失败");
                    }
                });
            } else {
                console.log("获取所有业务方案失败");
            }
        });
    });
    document.write(d);

}

/**
 * 在页面载入时获取服务器数据并更新数据库
 * @public
 * @return
 */
function initQuestionnaire() {
    var solutionsLength = null;
    var questionnairesLength = null;

    /*向服务器请求获取业务方案 restfulUtil.js*/
    restfulUtil.getSolutions(GlobalData, function(res) {
        console.log(JSON.stringify(res.resJson.solutionInfo));
        if (res.success == true) {
            console.log("业务方案列表请求成功");
            solutionsInfo = res.resJson.solutionInfo;
            solutionsLength = __getJsonLength(res.resJson.solutionInfo);
            console.log("业务方案的长度 " + solutionsLength);
            for (var i = 0; i < solutionsLength; i++) {
                /*更新某业务方案 quesSqlite.js*/
                quesSqlite.initSolutions(GlobalData, solutionsInfo[i], (function(index) {
                    return function(res) {
                        /*处理业务方案*/
                        if (res.success == true) {
                            console.log("业务方案列表写入数据库成功");
                            /*向服务器请求获取调查问卷 restfulUtil.js*/
                            restfulUtil.getQuestionnaires(GlobalData, solutionsInfo[index].recid, function(res2) {
                                if (res2.success == true) {
                                    console.log("调查问卷列表请求成功");
                                    questionnairesInfo = res2.resJson.questionnairelist;
                                    var questionnairesLength = __getJsonLength(questionnairesInfo);
                                    // console.log("该方案包含的问卷个数为" + questionnairesLength);
                                    for (var j = 0; j < questionnairesLength; j++) {
                                        /*更新某业务方案的调查问卷 quesSqlite.js*/
                                        quesSqlite.initQuestionnairesList(GlobalData, solutionsInfo[index].recid, questionnairesInfo[j], function(res3) {
                                            if (res3.success == true) {
                                                console.log("调查问卷列表写入数据库成功");
                                            } else {
                                                console.log("调查问卷列表写入数据库失败")
                                            }
                                        });
                                    }
                                } else {
                                    console.log("调查问卷列表请求失败");
                                }
                            });
                        } else {
                            console.log("业务方案列表写入数据库失败");
                        }
                    }
                })(i));
            }
        } else {
            console.log("业务方案列表请求失败");
        }

    });
}

function clickQ() {
    alert("qqq");
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
            GlobalData = arg;
            console.log("渲染进程收到GlobalData");
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
 * 添加业务方案界定啊
 * @private
 * @param {Function} cb            [回调函数]
 */
function __addSolutionTreeItem(cb) {
    console.log("正在添加业务方案树节点");
    for (var i = 0; i < solutionsLength; i++) {
        d.add(++dTreeItemNum, 0, solutionsInfo[i].title, 'javascript: ', '', solutionsInfo[i].recid);
        solutionsInfo[i].rowID = dTreeItemNum;
    }
    cb({
        success: true
    });
}
/**
 * 添加调查问卷节点
 * @private
 * @param {Function} cb                 [回调函数]
 */
function __addQuestionnaireTreeItem(cb) {
    console.log("正在添加调查问卷树节点");
    console.log("miaolegemi" + JSON.stringify(questionnairesInfo));
    for (var i = 0; i < questionnairesLength; i++) {
        /*遍历业务方案找到父节点*/
        for (var j = 0; j < solutionsLength; j++) {
            if (questionnairesInfo[i].solutionRecid == solutionsInfo[j].recid) {
                questionnairesInfo[i].parentID = solutionsInfo[j].rowID;
                d.add(++dTreeItemNum, questionnairesInfo[i].parentID, questionnairesInfo[i].title, "javascript: clickQ();");
                questionnairesInfo[i].rowID = dTreeItemNum;
                break;
            }
        }
    }
    cb({
        success: true
    });
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
