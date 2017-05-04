const quesSqlite = require('./js/quesSqlite.js');

const ipcRenderer = require('electron').ipcRenderer;

var GlobalData = null;
var name = null;
var questionnaireDataJson = null;

$(function() {
    init();
})

function init() {
    __getGlobalData(function(res) {
        if (res.success == true) {
            __getTempQuestionnaireName(function(res2) {
                if (res2.success == true) {
                    console.log(GlobalData);
                    console.log(name);
                    /*根据标识获取问卷表样*/
                    quesSqlite.getQuestionnaireByName(GlobalData, name, function(res3) {
                        if (res3.success == true) {
                            /*显示预览效果*/
                            questionnaireDataJson = JSON.parse(res3.data[0].data);
                            /*把没有description的补全*/
                            traverse(questionnaireDataJson, 0);
                            new Questionnaire($('#main'), questionnaireDataJson, function() {});
                        }
                    })
                } else {
                    console.log("从主进程获取标识失败");
                    console.log(res2.data);
                }
            });
        } else {
            console.log("从主进程获取用户数据失败");
            console.log(res.data);
        }
    });

}

/**
 * 深度遍历 写入题目的html
 * @private
 * @param  $td  父题
 * @param  node 节点
 * @param  i    第几个
 * @return
 */
function traverse(node, i) {
    var children = node.questions;
    if (children != null && children[i] != null) {
        if (!children[i].description) {
            children[i].description = "";
        }

        if (children[i].questions != null && children[i].questions[0] != null) {
            // console.log("进入孩子节点");
            traverse(children[i], 0);
        }
        if (children[i + 1] != null) {
            // console.log("进入兄弟节点");
            traverse(node, i + 1);
        }
    }
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
            success: false,
            data: err.message
        });
    }
}

/**
 * 与主进程通信获取标识
 * @private
 * @return
 */
function __getTempQuestionnaireName(cb) {
    try {
        ipcRenderer.send('asynchronous-get-tempQuestionnaireName-message');
        ipcRenderer.on('asynchronous-get-tempQuestionnaireName-reply', (event, arg) => {
            name = arg;
            console.log("渲染进程收到tempQuestionnaireName");
            cb({
                success: true
            });
        });
    } catch (err) {
        cb({
            success: false,
            data: err.message
        });
    }
}
