/*引用JS文件*/
const restfulUtil = require('./js/restfulUtil.js');
const quesSqlite = require('./js/quesSqlite.js');
/*与主进程通信的模块*/
const ipcRenderer = require('electron').ipcRenderer;
/*用户基础数据*/
var GlobalData = {
    "urlRoot": "",
    "host": "",
    "post": "",
    "user": "",
    "pwd": "",
    "userName": "",
    "token": "",
    // "urlRoot": urlValue,
    // "admin": adminValue,
    // "pwd": passwordValue,
    "devid": "CE2E-2A7C-3F8C-C6F5",
    "src": "000001399FCE11FEA057EFDF592FE408",
    "loginContext": "1"
};
var onlineStatus = function() {
    // window.alert(navigator.onLine ? 'online' : 'offline');
    return navigator.onLine ? true : false;
};

/**
 * 登录按钮点击事件，处理登录逻辑
 * @public
 * @return
 */
function signIn() {
    showShielder();
    if (true) {
        var urlValue = document.forms["login"]["url"].value;
        var adminValue = document.forms["login"]["username"].value;
        var passwordValue = document.forms["login"]["password"].value;
        urlValue = doWithRootURL(urlValue);

        // var i = urlValue.lastIndexOf(':');
        // GlobalData.host = urlValue.substring(0, i);
        // GlobalData.post = urlValue.substr(i);
        GlobalData.urlRoot = "10.2.20.74:9797";
        GlobalData.host = "10.2.20.74";
        GlobalData.post = 9797;
        GlobalData.user = "heyedong";
        GlobalData.pwd = "1";

        // if (onlineStatus() == true) {
        //     console.log("有网");
        //     return;
        // } else {
        //     console.log("没网");
        //     return;
        // }

        /*get请求token restfulUtil.js*/
        restfulUtil.getToken(GlobalData, function(statusCode, chunk) {
            if (statusCode == false) {
                alert("无法登录，请检查URL，重新登录！", "提示");
                hideShielder();
                return;
            }
            var body = eval('(' + chunk + ')');
            if (statusCode == 200) {
                console.log("登录成功");
                // alert(body.token);
                GlobalData.username = body.username;
                GlobalData.token = body.token;
                /*与主进程通信，发送GlobalData*/
                __setGlobalData();
                console.log("给主进程发送用户信息");
                /*初始化数据库 quesSqlite.js*/
                quesSqlite.initDB(GlobalData, function(res) {
                    if (res.success == true) {
                        console.log("数据库用户部分更新成功");
                        /*获取数据*/
                        initQuestionnaire();
                    } else {
                        alert("后台处理出错，error：" + res.data, "提示");
                        hideShielder();
                    }
                });
            } else if (statusCode == 401) {
                alert(body.error_msg, "提示");
                hideShielder();
            } else {
                console.log("是否出现");
                alert("无法登录，请检查URL，重新登录！", "提示");
                hideShielder();
            }
        });
    }
}

function initQuestionnaire() {
    var solutionsLength = null;
    var questionnairesLength = null;
    // var countI = 0;
    // var countJ = new Array();

    /*更新isNew字段为0*/
    quesSqlite.updateIsNew(GlobalData, function(res0) {
        if (res0.success == true) {
            console.log("isNew字段更新成功");
            /*向服务器发送请求获取业务方案 restfulUtil.js*/
            restfulUtil.getSolutions(GlobalData, function(res) {
                // console.log(JSON.stringify(res.resJson.solutionInfo));
                if (res.success == true) {
                    console.log("业务方案列表请求成功");
                    solutionsInfo = res.resJson.solutionInfo;
                    solutionsLength = __getJsonLength(solutionsInfo);
                    console.log("业务方案的长度 " + solutionsLength);
                    for (let i = 0; i < solutionsLength; i++) {

                        /*更新某业务方案 quesSqlite.js*/
                        quesSqlite.initSolutions(GlobalData, solutionsInfo[i], function(res2) {
                            /*处理业务方案*/
                            if (res2.success == true) {
                                console.log("业务方案列表写入数据库成功");
                                // console.log("i = " + i);

                                // if (++countI == solutionsLength) {
                                //     /*删除isNew字段为0的数据*/
                                //     quesSqlite.deleteSolutionIsNew(GlobalData, function(res3) {
                                //         if (res3.success == true) {
                                //             console.log("删除isNew字段为0的数据成功");
                                //         } else {
                                //             console.log("删除isNew字段为0的字段失败");
                                //         }
                                //     });
                                // }
                                // countJ[i] = 0;

                                /*向服务器发送请求获取调查问卷 restfulUtil.js*/
                                restfulUtil.getQuestionnaires(GlobalData, solutionsInfo[i].recid, function(res3) {
                                    if (res3.success == true) {
                                        console.log("调查问卷列表请求成功");
                                        questionnairesInfo = res3.resJson.questionnairelist;
                                        var questionnairesLength = __getJsonLength(questionnairesInfo);
                                        // console.log("该方案包含的问卷个数为" + questionnairesLength);
                                        for (let j = 0; j < questionnairesLength; j++) {
                                            /*更新某业务方案的调查问卷 quesSqlite.js*/
                                            quesSqlite.initQuestionnairesList(GlobalData, solutionsInfo[i].recid, questionnairesInfo[j], function(res4) {
                                                // if (++countJ[i] == questionnairesLength) {
                                                //     quesSqlite.deleteQustionnaireIsNew(GlobalData, solutionsInfo[i].recid, function(res5) {
                                                //         if (res5.success == true) {
                                                //             console.log("删除isNew字段为0的数据成功");
                                                //         } else {
                                                //             console.log("删除isNew字段为0的数据失败");
                                                //         }
                                                //     });
                                                // }
                                                // console.log("j = " + j);
                                                if (res4.success == true) {
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
                        });
                    }
                } else {
                    console.log("业务方案列表请求失败");
                }
            });
        } else {
            console.log("数据库修改isNew字段失败");
        }
    });

    setTimeout(function() {
        window.location.href = "./list.html";
        hideShielder();
    }, 5000);
}

function showShielder() {
    var hideobj = document.getElementById("hidebg");
    hidebg.style.display = "block";
}

function hideShielder() {
    var hideobj = document.getElementById("hidebg");
    hidebg.style.display = "none";
}

/**
 * 发送用户基础数据JSON给主进程
 * @private
 * @return
 */
function __setGlobalData() {
    ipcRenderer.once('asynchronous-set-GlobalData-reply', (event, arg) => {
        console.log("主进程收到GlobalData是否成功 " + arg);
    });
    ipcRenderer.send('asynchronous-set-GlobalData-message', GlobalData);
}

/**
 * 回车自动登录
 * @public
 * @return
 */
function keySignIn() {
    if (event.keyCode == 13) {
        signIn();
    }
}

/**
 * 表单验证函数
 * @private
 * @return 返回表单是否符合格式要求
 */
function __validateForm() {
    var urlValue = document.forms["login"]["url"].value;
    var patt = /(localhost|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})):\d{4,5}/g;
    // var patt = /^(localhost|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})):\d{4,5}$/g;
    var adminValue = document.forms["login"]["username"].value;
    var passwordValue = document.forms["login"]["password"].value;
    if (urlValue == null || urlValue == "") {
        window.alert("请填写URL！", "提示");
        return false;
    } else if (adminValue == null || adminValue == "") {
        window.alert("请填写账户名！", "提示");
        return false;
    } else if (passwordValue == null || passwordValue == "") {
        window.alert("请填写密码！", "提示");
        return false;
    } else if (urlValue.trim().match(patt) == null) {
        window.alert("不是一个有效的 url 地址！", "提示");
        return false;
    }
    return true;
}

/**
 * 规范登录请求URL格式
 * @private
 * @param  urlValue 未规范的URL
 * @return 规范后的urlValue
 */
function doWithRootURL(urlValue) {
    var patt = /(localhost|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})):\d{4,5}/g;
    //urlValue = urlValue.trim().match(patt);
    if (urlValue.lastIndexOf("/") == urlValue.length - 1)
        urlValue = urlValue.substring(0, urlValue.length - 1);
    return urlValue;
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
