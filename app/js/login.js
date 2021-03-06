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
/*是否在线*/
var onlineStatus = true;
/*所有用户数据*/
var users = null;
/*是否弹出用户框*/
var popUserBox = false;

$(function() {

    $("#popUserBox").on("click", ".detail", function() {
        var $td = $(this);
        $(".url").attr("value", users[$td.attr("num")].URL);
        $(".user").attr("value", users[$td.attr("num")].user);
        $(".password").attr("value", users[$td.attr("num")].pwd);
    });

    $("#popUserBox").on("click", "img.delete", function() {
        var $td = $(this);
        window.wxc.xcConfirm("是否删除该账户的所有数据？", window.wxc.xcConfirm.typeEnum.confirm, function(res) {
            if (res.data == true) {
                var tempUser = {
                    urlRoot: users[$td.parent().attr("num")].URL,
                    user: users[$td.parent().attr("num")].user
                };
                quesSqlite.deleteUser(tempUser, function(res2) {
                    if (res2.success == true) {
                        console.log("删除成功");
                        quesSqlite.selectUsers(function(res3) {
                            if (res3.success == true) {
                                users = res3.data;
                                $td.parent().remove();
                                if ($(".detail").length == 0) {
                                    var detail = `<div class="detail">
                                      <li>没有其他账户</li>
                                  </div>`;
                                    $("#popUserDetail").append(detail);
                                }
                            }
                        });
                    } else {
                        console.log("删除失败");
                    }
                });
            }
        });
    });

    $("#popUserBox").on('click', "#popUserClose", function() {
        var X = $('#popUserBox').offset().top - 100;
        $("#trianglePop").css({
            opacity: "0"
        });
        $("#popUserBox").animate({
            top: `${X}px`,
            opacity: '0'
        }, 200, function() {
            popUserBox = false;
        });
    });
})

function showUsers() {
    if (popUserBox == false) {
        quesSqlite.selectUsers(function(res) {
            popUserBox = true;
            if (res.success == true) {
                users = res.data;
                console.log(users);
                var X = $('#more').offset().top - 115;
                var Y = $('#more').offset().left - $("#popUserBox").width() - 15;
                var XT = $('#more').offset().top;
                var YT = $('#more').offset().left - 15;

                $("#popUserDetail").empty();
                if (users && users.length > 0) {
                    for (var i = 0; i < res.data.length; i++) {
                        var detail = `<div class="detail" num=${i}>
                        <li>URL&nbsp;&nbsp;&nbsp;${res.data[i].URL}</li>
                        <li>账户&nbsp;&nbsp;${res.data[i].user}</li>
                        <img class="delete" src="./images/main_03_delete_off.png" alt="">
                    </div>`;
                        $("#popUserDetail").append(detail);
                    }
                } else {
                    var detail = `<div class="detail">
                    <li>没有其他账户</li>
                </div>`;
                    $("#popUserDetail").append(detail);
                }

                $("#popUserBox").css({
                    top: `${X}px`,
                    left: `${Y}px`,
                    opacity: 0
                });

                $("#popUserBox").animate({
                    top: `${X+100}px`,
                    opacity: '1'
                }, 200, function() {
                    $("#trianglePop").css({
                        top: `${XT}px`,
                        left: `${YT}px`,
                        opacity: 1
                    });
                });
            }
        });
    }
}

/**
 * 登录按钮点击事件，处理登录逻辑
 * @public
 * @return
 */
function signIn() {
    showShielder();
    onlineStatus = true;
    if (true) {
        var urlValue = document.forms["login"]["url"].value;
        var adminValue = document.forms["login"]["username"].value;
        var passwordValue = document.forms["login"]["password"].value;

        console.log(urlValue + " " + adminValue + " " + passwordValue);

        if (!urlValue || !adminValue) {
            txt = "请填入完整登录信息";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res2) {});
            hideShielder();
            return;
        }
        // urlValue = doWithRootURL(urlValue);

        // var i = urlValue.lastIndexOf(':');
        // GlobalData.host = urlValue.substring(0, i);
        // GlobalData.post = urlValue.substr(i);
        // GlobalData.urlRoot = "10.2.20.61:9797";
        // GlobalData.host = "10.2.20.61";
        // GlobalData.post = 9797;
        // GlobalData.user = "ci";
        // GlobalData.pwd = "";
        GlobalData.urlRoot = urlValue;
        GlobalData.user = adminValue;
        GlobalData.pwd = passwordValue;

        /*get请求token restfulUtil.js*/
        restfulUtil.getToken(GlobalData, function(statusCode, chunk) {
            if (statusCode == false) {
                quesSqlite.checkTable(function(res0) {
                    if (res0.success == false) {
                        txt = "登录失败，请检查信息是否输入正确";
                        window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res2) {});
                        hideShielder();
                        return;
                    } else {
                        quesSqlite.checkUser(GlobalData, function(res) {
                            if (res.success == true) {
                                if (res.data["count(1)"] == 0) {
                                    /*用户表中不存在该条数据*/
                                    txt = "登录失败，请检查信息是否输入正确";
                                    window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res2) {});
                                    hideShielder();
                                    return;
                                } else if (res.data["count(1)"] == 1) {
                                    /*用户表中存在该条数据 询问是否离线*/
                                    window.wxc.xcConfirm("无法连接服务器，是否进入离线模式？", window.wxc.xcConfirm.typeEnum.confirm, function(res2) {
                                        if (res2.success == true) {
                                            onlineStatus = false;
                                            /*点击确定*/
                                            __setGlobalData(function(res3) {
                                                if (res3.success == true) {
                                                    __setOnlineStatus(function(res4) {
                                                        if (res4.success == true) {
                                                            window.location.href = "./list.html";
                                                            hideShielder();
                                                            return;
                                                        }
                                                    });
                                                }
                                            });
                                        } else {
                                            hideShielder();
                                            return;
                                        }
                                    });
                                }
                            } else {
                                console.log("用户查询失败");
                                hideShielder();
                                return;
                            }
                        });
                    }
                });


            } else if (statusCode == 200) {
                console.log("登录成功");
                var body = eval('(' + chunk + ')');

                GlobalData.username = body.username;
                GlobalData.token = body.token;
                /*与主进程通信，发送GlobalData*/
                __setGlobalData(function(res0) {
                    if (res0.success == true) {
                        console.log("给主进程发送用户信息成功");
                        __setOnlineStatus(function(res00) {
                            if (res00.success == true) {
                                /*初始化数据库 quesSqlite.js*/
                                quesSqlite.initDB(GlobalData, function(res) {
                                    if (res.success == true) {
                                        console.log("数据库用户部分更新成功");
                                        /*获取数据*/
                                        initQuestionnaire(function(res2) {
                                            if (res2.success == true) {
                                                console.log("更新数据成功");
                                                hideShielder();
                                                window.location.href = "./list.html";
                                            } else {
                                                console.log("更新数据失败");
                                                console.log(res2.data);
                                            }
                                        });
                                    } else {
                                        alert("后台处理出错，error：" + res.data, "提示");
                                        hideShielder();
                                    }
                                });
                            }
                        });

                    }
                });

            } else if (statusCode == 401) {
                alert("无法登录，请检查账户信息，重新登录！", "提示");
                hideShielder();
            } else {
                // console.log("是否出现");
                // alert("无法登录，请检查URL，重新登录！", "提示");
                // hideShielder();
                quesSqlite.checkUser(GlobalData, function(res) {
                    if (res.success == true) {
                        if (res.data["count(1)"] == 0) {
                            /*用户表中不存在该条数据*/
                            txt = "登录失败，无法离线登录，请检查网络";
                            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res2) {});
                            hideShielder();
                            return;
                        } else {
                            /*用户表中存在该条数据 询问是否离线*/
                            window.wxc.xcConfirm("无法连接服务器，是否进入离线模式？", window.wxc.xcConfirm.typeEnum.confirm, function(res2) {
                                if (res2.success == true) {
                                    onlineStatus = false;
                                    /*点击确定*/
                                    __setGlobalData(function(res3) {
                                        if (res3.success == true) {
                                            __setOnlineStatus(function(res4) {
                                                if (res4.success == true) {
                                                    window.location.href = "./list.html";
                                                    hideShielder();
                                                    return;
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    hideShielder();
                                    return;
                                }
                            });
                        }

                    } else {
                        console.log("用户查询失败");
                        hideShielder();
                        return;
                    }
                });
            }
        });
    }
}

function initQuestionnaire(cb) {
    var solutionsLength = 0;
    var questionnairesLength = 0;
    var countI = 0;
    var countJ = 0;
    var questionnairesAllLength = 0;

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
                    // console.log(solutionsInfo);
                    solutionsLength = __getJsonLength(solutionsInfo);
                    console.log("业务方案的长度 " + solutionsLength);
                    for (let i = 0; i < solutionsLength; i++) {

                        /*更新某业务方案 quesSqlite.js*/
                        quesSqlite.initSolutions(GlobalData, solutionsInfo[i], function(res2) {
                            /*处理业务方案*/
                            if (res2.success == true) {
                                console.log("业务方案列表写入数据库成功");
                                if (++countI == solutionsLength) {

                                    /*删除isNew字段为0的数据*/
                                    /*quesSqlite.deleteSolutionIsNew(GlobalData, function(res3) {
                                        if (res3.success == true) {
                                            console.log("删除isNew字段为0的数据成功");
                                        } else {
                                            console.log("删除isNew字段为0的字段失败");
                                        }
                                    });*/
                                }
                                countJ[i] = 0;

                                /*向服务器发送请求获取调查问卷 restfulUtil.js*/
                                restfulUtil.getQuestionnaires(GlobalData, solutionsInfo[i].recid, function(res3) {
                                    if (res3.success == true) {
                                        console.log("调查问卷列表请求成功");
                                        questionnairesInfo = res3.resJson.questionnairelist;
                                        // console.log(questionnairesInfo);
                                        var questionnairesLength = __getJsonLength(questionnairesInfo);
                                        questionnairesAllLength += questionnairesLength;
                                        // console.log("该方案包含的问卷个数为" + questionnairesLength);
                                        for (let j = 0; j < questionnairesLength; j++) {

                                            /*更新某业务方案的调查问卷 quesSqlite.js*/
                                            quesSqlite.initQuestionnairesList(GlobalData, solutionsInfo[i].name, questionnairesInfo[j], function(res4) {
                                                if (res4.success == true) {
                                                    console.log("调查问卷列表写入数据库成功");
                                                    if (++countJ == questionnairesAllLength) {
                                                        cb({
                                                            success: true
                                                        });
                                                        /*判断是否为最后一次 最后一次删除其余*/
                                                        /*quesSqlite.deleteQuestionnaireIsNew(GlobalData, solutionsInfo[i].recid, function(res5) {
                                                            if (res5.success == true) {
                                                                console.log("删除isNew字段为0的数据成功");
                                                                cb({
                                                                    success: true
                                                                });
                                                            } else {
                                                                console.log("删除isNew字段为0的数据失败");
                                                                cb({
                                                                    success: false,
                                                                    data: "删除isNew字段为0的数据失败"
                                                                });
                                                            }
                                                        });*/
                                                    }
                                                } else {
                                                    console.log("调查问卷列表写入数据库失败");
                                                    cb({
                                                        success: false,
                                                        data: "调查问卷列表写入数据库失败"
                                                    });
                                                }
                                            });
                                        }
                                    } else {
                                        console.log("调查问卷列表请求失败");
                                        cb({
                                            success: false,
                                            data: "调查问卷列表请求失败"
                                        });
                                    }
                                });
                            } else {
                                console.log("业务方案列表写入数据库失败");
                                cb({
                                    success: false,
                                    data: "业务方案列表写入数据库失败"
                                });
                            }
                        });
                    }
                } else {
                    console.log("业务方案列表请求失败");
                    cb({
                        success: false,
                        data: "业务方案列表请求失败"
                    });
                }
            });
        } else {
            console.log("数据库修改isNew字段失败");
            cb({
                success: false,
                data: "数据库修改isNew字段失败"
            });
        }
    });
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
 * @param {Function} cb 回调函数
 */
function __setGlobalData(cb) {
    ipcRenderer.on('asynchronous-set-GlobalData-reply', (event, arg) => {
        console.log("主进程收到GlobalData是否成功 " + arg);
        cb({
            success: true
        });
    });
    ipcRenderer.send('asynchronous-set-GlobalData-message', GlobalData);
}

/**
 * 发送是否在线给主进程
 * @private
 * @param {Function} cb 回调函数
 */
function __setOnlineStatus(cb) {
    ipcRenderer.on('asynchronous-set-onlineStatus-reply', (event, arg) => {
        console.log("主进程收到onlineStatus是否成功 " + arg);
        cb({
            success: true
        });
    });
    ipcRenderer.send('asynchronous-set-onlineStatus-message', onlineStatus);
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
