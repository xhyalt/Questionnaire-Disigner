/*引用JS文件*/
const restfulUtil = require('./js/restfulUtil.js');
const quesSqlite = require('./js/quesSqlite.js');
/*与主进程通信的模块*/
const ipcRenderer = require('electron').ipcRenderer;
/*用户基础数据*/
var GlobalData = null;

function initQuestionnaire() {
    /*获取用户基础数据*/
    __getGlobalData(function(res) {
        if (res.success == true) {
            console.log("GlobalData传输成功");
            /*向服务器请求获取业务方案 restfulUtil.js*/
            restfulUtil.getSolutions(GlobalData, function(res) {
                console.log(JSON.stringify(res.resJson));
                /*更新数据库里的业务方案 quesSqlite.js*/
                quesSqlite.initSolutions(GlobalData, res.resJson.solutionInfo, function(){
                    alert("业务方案逻辑完成");
                });
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
