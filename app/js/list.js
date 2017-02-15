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
/*树节点个数*/
var dTreeItemNum = 0;

/**
 * 初始化树
 * @return
 */
function initTree() {
    /*处理树*/
    console.log(GlobalData);
    var d = new dTree('d');
    /*设置根节点*/
    d.add(0, -1, '业务方案');
    /*获取用户基础数据*/
    __getGlobalData(function(res0) {
        // quesSqlite.getSolutions(GlobalData, function(res) {
        //     console.log("获取业务方案完毕");
        //     if (res.success == true) {
        //         /*获取业务方案成功*/
        //         console.log(res.row);
        //     //     quesSqlite.getQuestionnaires(GlobalData, function(res2) {
        //     //         __addSolutionItem(solutionsInfo, d, function(res3) {
        //     //             /*添加第一层业务方案节点*/
        //     //         });
        //     //         console.log("获取调查问卷完毕");
        //     //         if (res2.success == true) {
        //     //             __addQuestionnaireItem(d, solutionsInfo, questionnairesInfo, function(res3) {
        //     //
        //     //             });
        //     //         }
        //     //     })
        //     }
        // });
    });
    /*获取所有业务方案，并设置为1层节点*/

    d.add(1, 0, 'Node 1', 'example01.html');
    d.add(2, 0, 'Node 2', 'example01.html');
    d.add(3, 1, 'Node 1.1', 'example01.html');
    d.add(4, 0, 'Node 3', 'example01.html');
    d.add(5, 3, 'Node 1.1.1', 'example01.html');
    d.add(6, 5, 'Node 1.1.1.1', 'example01.html');
    d.add(7, 0, 'Node 4', 'example01.html');
    d.add(8, 1, 'Node 1.2', 'example01.html');
    d.add(9, 0, 'My Pictures', 'example01.html', 'Pictures I\'ve taken over the years', '', '', 'img/imgfolder.gif');
    d.add(10, 9, 'The trip to Iceland', 'example01.html', 'Pictures of Gullfoss and Geysir');
    d.add(11, 9, 'Mom\'s birthday', 'example01.html');
    d.add(12, 0, 'Recycle Bin', 'example01.html', '', '', 'img/trash.gif');

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
    __getGlobalData(function(res0) {
        /*向服务器请求获取业务方案 restfulUtil.js*/
        restfulUtil.getSolutions(GlobalData, function(res) {
            console.log(JSON.stringify(res));
            if(res.success == false){
                console.log("请求失败");
            }
            // var solutionsInfo = res.resJson.solutionInfo;
            // var solutionsLength = __getJsonLength(res.resJson.solutionInfo);
            // console.log("业务方案的长度 " + solutionsLength);
            // for (var i = 0; i < solutionsLength; i++) {
            //     /*更新某业务方案 quesSqlite.js*/
            //     quesSqlite.initSolutions(GlobalData, solutionsInfo[i], (function(index) {
            //         return function(res) {
            //             /*处理业务方案*/
            //             if (res.success == true) {
            //                 /*向服务器请求获取调查问卷 restfulUtil.js*/
            //                 console.log("向服务器请求获取调查问卷");
            //                 restfulUtil.getQuestionnaires(GlobalData, solutionsInfo[index].recid, function(res2) {
            //                     var questionnairesInfo;
            //                     var questionnairesLength = __getJsonLength(res2.resJson.questionnairelist);
            //                     if (questionnairesLength > 0)
            //                         questionnairesInfo = res2.resJson.questionnairelist;
            //                     console.log("该方案包含的问卷个数为" + questionnairesLength);
            //                     for (var j = 0; j < questionnairesLength; j++) {
            //                         /*更新某业务方案的调查问卷 quesSqlite.js*/
            //                         quesSqlite.initQuestionnairesList(GlobalData, solutionsInfo[index].recid, questionnairesInfo[j], function(res3) {
            //                             if (res3.success == true) {
            //                                 console.log("调查问卷逻辑已跳出  ");
            //                             } else {
            //                                 console.log("此调查问卷失败")
            //                             }
            //                         });
            //                     }
            //                 });
            //             }
            //         }
            //     })(i));
            // }
        });
        // restfulUtil.getQuestionnaires(GlobalData, "0B2F04FCF96E119BAD227FC275BA7F97", function(res) {
        //     if (res.success == true)
        //         console.log("node-fetch没问题");
        // });
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
 * @param solutionsInfo [业务方案数据]
 * @param d             [树对象]
 * @param {Function} cb            [回调函数]
 */
function __addSolutionItem(solutionsInfo, d, cb) {
    console.log("正在添加业务方案节点");
}
/**
 * 添加调查问卷节点
 * @private
 * @param questionnairesInfo [问卷调查数据]
 * @param d                  [树对象]
 * @param {Function} cb                 [回调函数]
 */
function __addQuestionnaireItem(questionnairesInfo, d, cb) {
    console.log("正在添加调查问卷节点");
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
