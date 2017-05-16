/*引用JS文件*/
const restfulUtil = require('./js/restfulUtil.js');
const quesSqlite = require('./js/quesSqlite.js');
const save = require('./js/save.js');
/*与主进程通信的模块*/
const ipcRenderer = require('electron').ipcRenderer;
const querystring = require('querystring');
const fs = require('fs');
/*用户基础数据*/
var GlobalData = null;
/*是否在线*/
var onlineStatus = null;
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
/*当前选中的业务方案*/
var activeSolution = -1;
/*记录排序的类型*/
var sortType = false;

$(function() {

    document.getElementById('selectFile').addEventListener('click', function(event) {
        ipcRenderer.send('open-file-dialog');
    });

    /*搜索框的实时变化监听*/
    $("#searchinput").bind('input propertychange', function() {
        var txt = $(this).val();
        if (txt && activeSolution >= 0) {
            var row = -1;
            var syncTd;
            var editTd;
            var tempItem;
            $(".listBody").remove();
            for (var i = 0; i < questionnairesInfo.length; i++) {
                if (questionnairesInfo[i].solutionName == solutionsInfo[activeSolution].name) {
                    if (questionnairesInfo[i].title.toLowerCase().indexOf(txt.toLowerCase()) >= 0 || questionnairesInfo[i].name.toLowerCase().indexOf(txt.toLowerCase()) >= 0) {
                        questionnairesInfo[i].row = ++row;
                        addListQuestionnaireItem(i, row);
                    }
                }
            }
        } else if (activeSolution >= 0) {
            /*输入为空 将列表恢复显示*/
            showQuestionnaires(activeSolution);
        }
    });

    /*排序图标点击事件*/
    $(".editTd").on("click", ".icon-move-down, .icon-move-up", function() {
        $(this).attr("class") == "icon-move-down" ? $(this).attr("class", "icon-move-up") : $(this).attr("class", "icon-move-down");
        sortType = !sortType;
        questionnairesInfo.sort(sortBy("editTime", sortType, parseInt));
        showQuestionnaires(activeSolution);
    });

    /*刷新树图标鼠标移入移出事件*/
    $("#tree").on("mouseover", "#fresh", function() {
        $(this).css({
            "background": "url('./images/tree_00_refresh_on.png') no-repeat 0 0"
        });
    }).on("mouseout", "#fresh", function() {
        $(this).css({
            "background": "url('./images/tree_00_refresh_off.png') no-repeat 0 0"
        });
    });

    /*刷新树图标点击事件 重新获取业务方案和调查问卷 更新树*/
    $("#tree").on("click", "#fresh", function() {
        // showShielder();
        if (onlineStatus == true) {
            fresh.changeClassToOn(this);
            initQuestionnaire(function(res) {
                if (res.success == true) {
                    initTree(function(res) {});
                    activeSolution = null;
                    if ($(".listBody").length && $(".listBody").length > 0)
                        $(".listBody").remove();
                }
            });
        } else {
            txt = "当前为离线模式，无法刷新";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        }
    });

    $("#listTable").on("mouseover", ".listBody", function() {
        $(this).css({
            "background-color": "#c9f8f0",
            "border-left": "3px solid #1ABC9C"
        });
    }).on("mouseout", ".listBody", function() {
        $(this).css({
            "background-color": "#fff",
            "border-left": "3px solid #fff"
        });
    });

    /*新建问卷监听事件start===========================*/
    /*新建问卷弹出框 点击关闭和取消事件*/
    $("#popBoxNew").on("click", ".popBoxClose, .popBoxButtonCancel", function() {
        hideCreateQuestionnaire();
    });

    /*新建问卷弹出框 点击确认事件*/
    $("#popBoxNew").on("click", ".popBoxButtonConfirm", function() {
        /*判断是否有数据为空*/
        var popBoxName = $("#popBoxNew .popBoxName input").val();
        var popBoxNo = $("#popBoxNew .popBoxNo input").val();
        var popBoxReportGroupCode = $("#popBoxNew .popBoxReportGroupCode input").val();
        var popBoxTitle = $("#popBoxNew .popBoxTitle input").val();
        var popBoxSubtitle = $("#popBoxNew .popBoxSubtitle input").val();
        if (popBoxName == "") {
            txt = "问卷标识不可为空，请重新填写";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
            return;
        }

        if (popBoxTitle == "") {
            txt = "主标题不可为空，请重新填写";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
            return;
        }

        /*获取信息并存入数据库*/
        questionnaireJson = {
            "solutionName": activeSolution.name,
            "name": popBoxName,
            "no": popBoxNo,
            "reportGroupCode": popBoxReportGroupCode,
            "title": popBoxTitle,
            "subtitle": popBoxSubtitle,
            "recid": newGuid()
        };
        quesSqlite.checkQuestionnaireByName(GlobalData, popBoxName, function(res) {
            if (res.success == true) {
                console.log(res.data["count(1)"]);
                if (res.data["count(1)"] == 0) {
                    /*该标识唯一*/
                    quesSqlite.createTempQuestionnaire(GlobalData, solutionsInfo[activeSolution].name, questionnaireJson, function(res) {
                        if (res.success == true) {
                            console.log("创建临时调查问卷成功");
                            __setTempQuestionnaireName(questionnaireJson.name, function(res) {
                                hideCreateQuestionnaire();
                                window.location.href = "./design.html";
                            });

                        } else {
                            txt = "创建问卷失败，请重新创建";
                            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
                            return;
                        }
                    });
                } else {
                    /*该标志不唯一 不予新建*/
                    txt = "该标识已经存在！";
                    window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
                    return;
                }
            }
        });


    });
    /*新建问卷监听事件end===========================*/

    /*导入问卷监听事件start===========================*/
    /*导入问卷弹出框 点击关闭和取消事件*/
    $("#popBoxImport").on("click", ".popBoxClose, .popBoxButtonCancel", function() {
        document.getElementById("hidebg").style.display = "none";
        document.getElementById("popBoxImport").style.display = "none";
    });

    /*导入问卷弹出框 点击确认事件*/
    $("#popBoxImport").on("click", ".popBoxButtonConfirm", function() {
        /*判断是否有数据为空*/
        var popBoxName = $("#popBoxImport .popBoxName input").val();
        var popBoxNo = $("#popBoxImport .popBoxNo input").val();
        var popBoxReportGroupCode = $("#popBoxImport .popBoxReportGroupCode input").val();
        var popBoxTitle = $("#popBoxImport .popBoxTitle input").val();
        var popBoxSubtitle = $("#popBoxImport .popBoxSubtitle input").val();
        var popBoxFile = $("#popBoxImport .popBoxFile input").val();
        var popBoxData = {};

        if (popBoxName == "") {
            txt = "问卷标识不可为空，请重新填写";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
            return;
        }
        if (popBoxTitle == "") {
            txt = "主标题不可为空，请重新填写";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
            return;
        }
        if (popBoxFile == "") {
            txt = "问卷路径不可为空，请重新选择";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
            return;
        }

        quesSqlite.checkQuestionnaireByName(GlobalData, popBoxName, function(res) {
            if (res.success == true) {
                if (res.data["count(1)"] == 0) {
                    /*该标识唯一*/
                    $.getJSON(popBoxFile, function(data) {
                        popBoxData = data;
                        popBoxData.name = popBoxName;
                        popBoxData.title = popBoxTitle;
                        /*获取信息并存入数据库*/
                        questionnaireJson = {
                            "name": popBoxName,
                            "no": popBoxNo,
                            "reportGroupCode": popBoxReportGroupCode,
                            "title": popBoxTitle,
                            "subtitle": popBoxSubtitle,
                            "recid": newGuid(),
                            "data": JSON.stringify(popBoxData)
                        };

                        quesSqlite.createTempQuestionnaire(GlobalData, solutionsInfo[activeSolution].name, questionnaireJson, function(res) {
                            if (res.success == true) {
                                console.log("创建临时调查问卷成功");
                                /*导入成功*/
                                document.getElementById("hidebg").style.display = "none";
                                document.getElementById("popBoxImport").style.display = "none";
                                var txt = "导入问卷成功";
                                window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.confirm, function(res) {
                                    if (res.data == true) {
                                        /*刷新树 显示列表*/
                                        initTree(function(res2) {
                                            if (res2.success == true) {
                                                $(".listBody").remove();
                                                showQuestionnaires(activeSolution);
                                            }
                                        });
                                    }
                                });
                            } else {
                                txt = "创建问卷失败，请重新创建";
                                window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
                                return;
                            }
                        });
                    });
                } else {
                    /*该标志不唯一 不予新建*/
                    txt = "该标识已经存在！";
                    window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
                    return;
                }
            }
        });
    });
    /*导入问卷监听事件end===========================*/
});

/**
 * 获取JSON文件 填写路径
 * @return
 */
function selectFile() {
    ipcRenderer.on('selected-directory', function(event, path) {
        /*从文件路径获取JSON*/
        $.getJSON(path, function(data) {
            $("#popBoxImport .popBoxFile input").val(path);
            if (data.name) {
                $("#popBoxImport .popBoxName input").val(data.name);
            }
            if (data.title) {
                $("#popBoxImport .popBoxTitle input").val(data.title);
            }
        }).error(function(jqXhr, textStatus, error) {
            txt = "JSON格式有误，请重新选择文件";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        });
    });
}

/**
 * 刷新按钮的旋转操作
 * @type {Object}
 */
var fresh = {
    changeClassToOn: function(target) {
        $(target).removeClass('off').addClass('on');
    },
    changeClassToOff: function(target) {
        $(target).removeClass('on').addClass('off');
    }
}

/**
 * 获取数据 更新树
 * @return
 */
function init() {
    __getGlobalData(function(res) {
        if (res.success == true) {
            __getOnlineStatus(function(res2) {
                if (res2.success == true) {
                    initTree(function(res) {});
                }
            });
        }
    });
}

/**
 * 初始化树
 * @return
 */
function initTree(cb) {
    d = null;
    dTreeItemNum = 0;
    /*处理树*/
    d = new dTree('d');
    /*设置根节点*/
    d.add(0, -1, '业务方案组', "", "", "", "./images/tree_01_opg.png", "./images/tree_01_opg.png");
    /*获取所有业务方案 quesSqlite.js*/
    quesSqlite.getSolutions(GlobalData, function(res) {
        if (res.success == true) {
            console.log("获取所有业务方案成功");
            solutionsLength = res.data.length;
            solutionsInfo = res.data;
            /*添加业务方案的树结点*/
            __addSolutionTreeItem(function(res) {
                if (res.success == true) {
                    console.log("添加业务方案树节点成功");
                    /*获取所有调查问卷 quesSqlite.js*/
                    quesSqlite.getQuestionnaires(GlobalData, function(res2) {
                        if (res2.success == true) {
                            console.log("获取所有调查问卷成功");
                            // console.log(JSON.stringify(res2.data));
                            questionnairesLength = res2.data.length;
                            questionnairesInfo = res2.data;
                            questionnairesInfo.sort(sortBy("editTime", sortType, parseInt));
                            console.log(questionnairesInfo);
                            /*添加调查问卷的树结点*/
                            __addQuestionnaireTreeItem(function(res) {
                                if (res.success == true) {
                                    console.log("添加调查问卷树节点成功");
                                    fresh.changeClassToOff($("#fresh"));
                                    document.getElementById('treeDemo').innerHTML = d;
                                    cb({
                                        success: true
                                    });
                                }
                            });
                        } else {
                            console.log("获取所有调查问卷失败");
                            fresh.changeClassToOff($("#fresh"));
                        }
                    });
                } else {
                    console.log("添加业务方案节点失败");
                    fresh.changeClassToOff($("#fresh"));
                }
            });
        } else {
            console.log("获取所有业务方案失败");
            fresh.changeClassToOff($("#fresh"));
        }
    });
}

/**
 * 为调查问卷JSON排序的函数
 * @param  filed  排序的基准字段
 * @param  rev    排序的顺序
 * @param  primer 类型
 * @return
 */
var sortBy = function(filed, rev, primer) {
    rev = (rev) ? -1 : 1;
    return function(a, b) {
        a = a[filed];
        b = b[filed];
        if (typeof(primer) != 'undefined') {
            a = primer(a);
            b = primer(b);
        }
        if (a < b) {
            return rev * -1;
        }
        if (a > b) {
            return rev * 1;
        }
        return 1;
    }
};

/**
 * 树节点业务方案的点击事件
 * @param  solutionNameIndex 该业务方案节点的标识
 * @return
 */
function showQuestionnaires(j) {
    //添加节点点击事件
    var row = -1;

    activeSolution = j;
    var solutionNameIndex = solutionsInfo[j].name;
    if ($(".listBody").length && $(".listBody").length > 0)
        $(".listBody").remove();
    for (let i = 0; i < questionnairesLength; i++) {
        if (questionnairesInfo[i].solutionName == solutionNameIndex) {
            questionnairesInfo[i].row = ++row;
            addListQuestionnaireItem(i, row);
        }
    }
}

/**
 * 根据问卷信息添加列表item
 * @param i   问卷总列表中的第i个
 * @param row 行数
 */
function addListQuestionnaireItem(i, row) {
    var syncTd;
    var editTd;
    var tempItem;
    if (!questionnairesInfo[i].data) {
        /*data为空表示未下载*/
        syncTd = "未下载";
        if (onlineStatus == true) {
            tempItem = `<a href="javascript: decomposeQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">编辑</a>
            <a href="javascript: previewQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">预览</a>
            <a href="javascript: outputQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">导出</a>
            <a href="javascript: getQuestionnaireData('${questionnairesInfo[i].name}', ${row});">下载</a>`;
        } else {
            tempItem = `<span>编辑</span><span>预览</span><span>导出</span><span>下载</span>`;
        }
    } else if (questionnairesInfo[i].isChanged == "0" && questionnairesInfo[i].data) {
        /*data不为空 且 没有修改 表示已同步*/
        syncTd = "已同步";
        tempItem = `<a href="javascript: decomposeQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">编辑</a>
        <a href="javascript: previewQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">预览</a>
        <a href="javascript: deleteQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">删除</a>
        <a href="javascript: outputQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">导出</a>`;
    } else {
        /*data不为空 且 已经修改 表示未同步*/
        syncTd = "未同步";
        if (onlineStatus == true) {
            tempItem = `<a href="javascript: decomposeQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">编辑</a>
            <a href="javascript: previewQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">预览</a>
            <a href="javascript: deleteQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">删除</a>
            <a href="javascript: outputQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">导出</a>
            <a href="javascript: uploadQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">上传</a>`;
        } else {
            tempItem = `<a href="javascript: decomposeQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">编辑</a>
            <a href="javascript: previewQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">预览</a>
            <a href="javascript: deleteQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">删除</a>
            <a href="javascript: outputQuestionnaire('${questionnairesInfo[i].name}', ${row}, function(res){});">导出</a>
            <span>上传</span>`;
        }
    }

    if (questionnairesInfo[i].editTime) {
        var second = Date.parse(new Date()) / 1000 - questionnairesInfo[i].editTime;
        editTd = questionnairesInfo[i].editTime == "9999999999" ? "" : getTime(second);
    } else {
        editTd = "";
    }

    /*在右边显示出点击的业务方案所包含的所有调查问卷*/
    $("#listTable").find("tr").last().after(`
      <tr class="listBody">
          <td class="titleTd">${questionnairesInfo[i].title}</td>
          <td class="codeTd">${questionnairesInfo[i].name}</td>
          <td class="syncTd">${syncTd}</td>
          <td class="editTd">${editTd}</td>
          <td class="operTd">
              <div style="display:inline">${tempItem}</div>
          </td>
      </tr>`);
}

/**
 * 导出问卷
 * @param  name 问卷标识
 * @param  row  行数
 * @param  {Function} cb   回调函数
 * @return
 */
function outputQuestionnaire(name, row, cb) {
    showShielder();
    if ($(".listBody").eq(row).find(".syncTd").html() == "未下载") {
        /*未下载 下载问卷表样*/
        getQuestionnaireInfo(GlobalData, name, function(res) {
            if (res.success == true) {
                changeSyn(name, row, 1);
                quesSqlite.getQuestionnaireByName(GlobalData, name, function(res2) {
                    console.log(res2.data[0]);
                    ipcRenderer.once('saved-file', function(event, path) {
                        if (path) {
                            console.log(path);
                            writeFile(path, res2.data[0].data, function(res3) {
                                if (res3.success == true) {
                                    hideShielder();
                                    console.log("导出完毕");
                                } else {
                                    hideShielder();
                                    console.log("导出失败");
                                }
                            });
                        }
                    });
                    ipcRenderer.send('save-dialog');
                });
            }
        });
    } else {
        console.log("hehe");
        /*未同步或已同步 直接显示*/
        quesSqlite.getQuestionnaireByName(GlobalData, name, function(res2) {
            console.log(res2.data[0]);
            ipcRenderer.once('saved-file', function(event, path) {
                if (path) {
                    console.log(path);
                    writeFile(path, res2.data[0].data, function(res3) {
                        if (res3.success == true) {
                            hideShielder();
                            console.log("导出完毕");
                        } else {
                            hideShielder();
                            console.log("导出失败");
                        }
                    });
                }
            });
            ipcRenderer.send('save-dialog');
        });
    }
}

/**
 * 写JSON文件函数
 * @param  path 保存文件路径
 * @param  data 保存内容
 * @param  {Function} cb   回调函数
 * @return
 */
function writeFile(path, data, cb) {
    fs.writeFile(path, data, function(err) {
        if (err) {
            throw err;
            cb({
                success: false
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 计算时间戳差值的最后显示结果
 * @param  second 时间戳差
 * @return 显示效果
 */
function getTime(second) {
    if (second < 60 && second >= 0) {
        return "刚刚";
    } else if (second < 60 * 60) {
        return parseInt(second / 60).toString() + "分钟前";
    } else if (second < 60 * 60 * 24) {
        return parseInt(second / 60 / 60).toString() + "小时前";
    } else if (second > 0) {
        return parseInt(second / 60 / 60 / 24).toString() + "天前";
    } else if (seccond == 9999999999) {
        return "";
    }
}

/**
 * 上传问卷表样
 * @param  name 问卷标识
 * @param  row  行数
 * @param  {Function} cb   回调函数
 * @return
 */
function uploadQuestionnaire(name, row, cb) {
    quesSqlite.getQuestionnaireByName(GlobalData, name, function(res) {
        if (res.success == true) {
            // console.log("获取调查问卷数据成功");
            tempQuestionnaire = res.data[0];
            save.getQuestionnaireJson(tempQuestionnaire, function(res2) {
                if (res2.success == true) {
                    restfulUtil.setQuestionnaire(GlobalData, res2.data, function(res3) {
                        if (res3.success == true && !res3.resJson.error_code) {
                            console.log("上传问卷成功");
                            /*将该问卷的isChanged改为0*/
                            quesSqlite.updateQuestionnaireIsChanged(GlobalData, name, "0", function(res4) {
                                if (res4.success == true) {
                                    console.log("更新isChanged成功");
                                    /*将未同步改为已同步*/
                                    changeSyn(name, row, 1);
                                }
                            });
                        } else {
                            console.log("保存问卷失败");
                        }
                    });
                }
            })
        }
    });
}

/**
 * 编辑问卷
 * @param  name 问卷标识
 * @param  row  行数
 * @param  {Function} cb   回调函数
 * @return
 */
function decomposeQuestionnaire(name, row, cb) {
    /*判断问卷是否已经下载*/
    if ($(".listBody").eq(row).find(".syncTd").html() == "未下载") {
        /*未下载 下载问卷表样*/
        showShielder();
        getQuestionnaireInfo(GlobalData, name, function(res) {
            if (res.success == true) {
                /*将下载更换为删除 将未下载改为已同步*/
                changeSyn(name, row, 1);
                /*将标识传给主进程*/
                __setTempQuestionnaireName(name, function(res2) {
                    if (res2.success == true) {
                        console.log("给主进程传递参数成功");
                        /*打开预览界面*/
                        window.location.href = "./design.html";
                        hideShielder();
                    }
                });
            }
        });
    } else {
        /*未同步或已同步 直接显示*/
        __setTempQuestionnaireName(name, function(res2) {
            if (res2.success == true) {
                console.log("给主进程传递参数成功");
                /*打开预览界面*/
                window.location.href = "./design.html";
                hideShielder();
            }
        });
    }
}

/**
 * 删除调查问卷点击事件
 * 判断问卷是否远程和是否已同步
 * 远程且已同步 提示不能删除所有 删除本地表样
 * 远程且未同步 提示还为同步 删除本地表样
 * 本地且未同步 提示将直接删除所有
 * @param  name 问卷标识
 * @param  row  行数
 * @param  {Function} cb   回调函数
 * @return
 */
function deleteQuestionnaire(name, row, cb) {
    if ($(".listBody").eq(row).find(".syncTd").html() == "已同步") {
        /*已同步*/
        var txt = "该调查问卷已经同步，只能删除表样";
        window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.confirm, function(res) {
            if (res.data == true) {
                /*点击了确定，删除表样*/
                quesSqlite.updateQuestionnaireData(GlobalData, name, "", "0", "", function(res2) {
                    if (res2.success == true) {
                        console.log("更新表样成功");
                        changeSyn(name, row, 2);
                        cb({
                            success: true
                        });
                    } else {
                        console.log("更新表样失败");
                        cb({
                            success: false,
                            data: res.data
                        });
                    }
                });
            }
        });
    } else {
        /*未同步 判断是否远程*/
        quesSqlite.getQuestionnaireByName(GlobalData, name, function(res) {
            if (res.success == true) {
                console.log("修改isRemote字段成功");
                console.log(res.data);
                if (res.data[0].isRemote == "1") {
                    /*该调查问卷已存在于服务器上 提示现在还未同步*/
                    var txt = "该问卷尚未同步，是否仍旧删除表样？";
                    window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.confirm, function(res) {
                        if (res.data == true) {
                            /*点击确定 删除表样*/
                            quesSqlite.updateQuestionnaireData(GlobalData, name, "", "0", "", function(res2) {
                                if (res2.success == true) {
                                    console.log("更新表样成功");
                                    changeSyn(name, row, 2);
                                    cb({
                                        success: true
                                    });
                                } else {
                                    console.log("更新表样失败");
                                    cb({
                                        success: false,
                                        data: res.data
                                    });
                                }
                            });
                        }
                    });
                } else {
                    /*该调查问卷不存在服务器上*/
                    var txt = "该问卷尚未同步，是否删除所有信息？";
                    window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.confirm, function(res) {
                        if (res.data == true) {
                            /*点击确定 删除问卷所有信息*/
                            quesSqlite.deleteQuestionnaireByName(GlobalData, name, function(res2) {
                                if (res2.success == true) {
                                    /*刷新树 显示列表*/
                                    initTree(function(res2) {
                                        if (res2.success == true) {
                                            $(".listBody").remove();
                                            showQuestionnaires(activeSolution);
                                            cb({
                                                success: true
                                            });
                                        }
                                    });

                                } else {
                                    cb({
                                        success: true,
                                        data: "删除问卷失败"
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    }
}

/**
 * 预览问卷的点击事件
 * @param  name 标识
 * @param  row  行数
 * @param  {Function} cb   回调函数
 * @return
 */
function previewQuestionnaire(name, row, cb) {
    /*判断问卷是否已经下载*/
    if ($(".listBody").eq(row).find(".syncTd").html() == "未下载") {
        /*未下载 下载问卷表样*/
        showShielder();
        getQuestionnaireInfo(GlobalData, name, function(res) {
            if (res.success == true) {
                /*将下载更换为删除 将未下载改为已同步*/
                changeSyn(name, row, 1);
                /*将标识传给主进程*/
                __setTempQuestionnaireName(name, function(res2) {
                    if (res2.success == true) {
                        console.log("给主进程传递参数成功");
                        /*打开预览界面*/
                        window.open("./preview.html", "预览", "height=800, width=1200");
                        hideShielder();
                    }
                });
            }
        });
    } else if ($(".listBody").eq(row).find(".syncTd").html() == "已同步") {
        /*已同步 直接显示*/
        __setTempQuestionnaireName(name, function(res2) {
            if (res2.success == true) {
                console.log("给主进程传递参数成功");
                /*打开预览界面*/
                window.open("./preview.html", "预览", "height=800, width=1200");
                hideShielder();
            }
        });
    } else {
        /*未同步 直接显示*/
        __setTempQuestionnaireName(name, function(res2) {
            if (res2.success == true) {
                console.log("给主进程传递参数成功");
                /*打开预览界面*/
                window.open("./preview.html", "预览", "height=800, width=1200");
                hideShielder();
            }
        });
    }
}

/**
 * 下载问卷的点击事件
 * @param  name 标识
 * @param  row  行数
 * @param  {Function} cb   回调函数
 * @return
 */
function getQuestionnaireData(name, row, cb) {
    showShielder();
    /*发送获取单个问卷表样的请求*/
    getQuestionnaireInfo(GlobalData, name, function(res) {
        if (res.success == true) {
            /*将下载更换为删除 将未下载改为已同步*/
            changeSyn(name, row, 1);
            hideShielder();
        }
    });
}

/**
 * 发送获取某问卷表样的请求
 * 单独封装 便于其他函数调用
 * @param  GlobalData 用户基础数据
 * @param  name       标识
 * @param  {Function} cb         回调函数
 * @return
 */
function getQuestionnaireInfo(GlobalData, name, cb) {
    restfulUtil.getQuestionnaireInfo(GlobalData, name, function(res) {
        if (res.success == true) {
            data = JSON.stringify(res.resJson.dataInfo);
            /*将获取的表样存入数据库*/
            quesSqlite.updateQuestionnaireData(GlobalData, name, data, "0", "9999999999", function(res) {
                if (res.success == true) {
                    console.log("更新表样成功");
                    cb({
                        success: true
                    });
                } else {
                    console.log("更新表样失败");
                    cb({
                        success: false,
                        data: res.data
                    });
                }
            });
        }
    });
}

function changeSyn(name, row, method) {
    /*1.已同步 2.未下载 3.未同步*/
    switch (method) {
        case 1:
            {
                $(".listBody").eq(row).find(".syncTd").empty().append("已同步");
                $(".listBody").eq(row).find(".operTd").find("div").empty().append(`<a href="javascript: decomposeQuestionnaire('${name}', ${row}, function(res){});">编辑</a>
                <a href="javascript: previewQuestionnaire('${name}', ${row}, function(res){});">预览</a>
                <a href="javascript: deleteQuestionnaire('${name}', ${row}, function(res){});">删除</a>
                <a href="javascript: outputQuestionnaire('${name}', ${row}, function(res){});">导出</a>`);
            }
            break;
        case 2:
            {
                $(".listBody").eq(row).find(".syncTd").empty().append("未下载");
                $(".listBody").eq(row).find(".operTd").find("div").empty().append(`<a href="javascript: decomposeQuestionnaire('${name}', ${row}, function(res){});">编辑</a>
                <a href="javascript: previewQuestionnaire('${name}', ${row}, function(res){});">预览</a>
                <a href="javascript: outputQuestionnaire('${name}', ${row}, function(res){});">导出</a>
                <a href="javascript: getQuestionnaireData(${name}, ${row});">下载</a>`);
            }
            break;
        case 3:
            {

            }
            break;
    }
}

/**
 * 在页面载入时获取服务器数据并更新数据库
 * @public
 * @return
 */
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
                console.log(GlobalData.token);
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
                                countJ[i] = 0;

                                /*向服务器发送请求获取调查问卷 restfulUtil.js*/
                                restfulUtil.getQuestionnaires(GlobalData, solutionsInfo[i].recid, function(res3) {
                                    if (res3.success == true) {
                                        console.log("调查问卷列表请求成功");
                                        questionnairesInfo = res3.resJson.questionnairelist;
                                        var questionnairesLength = __getJsonLength(questionnairesInfo);
                                        questionnairesAllLength += questionnairesLength;
                                        // console.log("该方案包含的问卷个数为" + questionnairesLength);
                                        for (let j = 0; j < questionnairesLength; j++) {
                                            /*更新某业务方案的调查问卷 quesSqlite.js*/
                                            quesSqlite.initQuestionnairesList(GlobalData, solutionsInfo[i].name, questionnairesInfo[j], function(res4) {
                                                if (res4.success == true) {
                                                    console.log("调查问卷列表写入数据库成功");
                                                    if (++countJ == questionnairesAllLength) {
                                                        fresh.changeClassToOff($("#fresh"));
                                                        cb({
                                                            success: true
                                                        });
                                                        // quesSqlite.deleteQuestionnaireIsNew(GlobalData, solutionsInfo[i].recid, function(res5) {
                                                        //     if (res5.success == true) {
                                                        //         console.log("删除isNew字段为0的数据成功");
                                                        //         fresh.changeClassToOff($("#fresh"));
                                                        //         cb({
                                                        //             success: true
                                                        //         });
                                                        //     } else {
                                                        //         console.log("删除isNew字段为0的数据失败");
                                                        //         fresh.changeClassToOff($("#fresh"));
                                                        //         cb({
                                                        //             success: false,
                                                        //             data: "删除isNew字段为0的数据失败"
                                                        //         });
                                                        //     }
                                                        // });
                                                    }
                                                } else {
                                                    console.log("调查问卷列表写入数据库失败");
                                                    fresh.changeClassToOff($("#fresh"));
                                                    cb({
                                                        success: false,
                                                        data: "调查问卷列表写入数据库失败"
                                                    });
                                                }
                                            });
                                        }
                                    } else {
                                        console.log("调查问卷列表请求失败");
                                        fresh.changeClassToOff($("#fresh"));
                                        cb({
                                            success: false,
                                            data: "调查问卷列表请求失败"
                                        });
                                    }
                                });
                            } else {
                                console.log("业务方案列表写入数据库失败");
                                fresh.changeClassToOff($("#fresh"));
                                cb({
                                    success: false,
                                    data: "业务方案列表写入数据库失败"
                                });
                            }
                        });
                    }
                } else {
                    console.log("业务方案列表请求失败");
                    fresh.changeClassToOff($("#fresh"));
                    cb({
                        success: false,
                        data: "业务方案列表请求失败"
                    });
                }
            });
        } else {
            console.log("数据库修改isNew字段失败");
            fresh.changeClassToOff($("#fresh"));
            cb({
                success: false,
                data: "数据库修改isNew字段失败"
            });
        }
    });
}

/**
 * 显示遮蔽层
 * @return
 */
function showShielder() {
    var hideobj = document.getElementById("hidebg");
    hidebg.style.display = "block";
}

/**
 * 去掉遮蔽层
 * @return
 */
function hideShielder() {
    var hideobj = document.getElementById("hidebg");
    hidebg.style.display = "none";
}

/**
 * 与主进程通信获取用户基础数据GlobalData
 * @private
 * @param {Function} cb         回调函数
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
 * 与主进程通信获取用户基础数据onlineStatus
 * @private
 * @param {Function} cb         回调函数
 */
function __getOnlineStatus(cb) {
    try {
        ipcRenderer.send('asynchronous-get-onlineStatus-message');
        ipcRenderer.on('asynchronous-get-onlineStatus-reply', (event, arg) => {
            onlineStatus = arg;
            console.log("渲染进程收到onlineStatus");
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
 * 给主进程发送临时问卷的标识
 * @param tempQuestionnaireName 临时问卷的标识
 * @param {Function} cb         回调函数
 */
function __setTempQuestionnaireName(tempQuestionnaireName, cb) {
    ipcRenderer.once('asynchronous-set-tempQuestionnaireName-reply', (event, arg) => {
        console.log("主进程收到tempQuestionnaireName是否成功 " + arg);
        cb({
            success: true
        });
    });
    ipcRenderer.send('asynchronous-set-tempQuestionnaireName-message', tempQuestionnaireName);
}

/**
 * 添加业务方案界定啊
 * @private
 * @param {Function} cb            [回调函数]
 */
function __addSolutionTreeItem(cb) {
    console.log("正在添加业务方案树节点");
    for (var i = 0; i < solutionsLength; i++) {
        d.add(++dTreeItemNum, 0, solutionsInfo[i].title, `javascript:showQuestionnaires(${i});`, '', solutionsInfo[i].name, "./images/tree_02_op.png", "./images/tree_02_op.png");
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
    for (var i = 0; i < questionnairesLength; i++) {
        /*遍历业务方案找到父节点*/
        for (var j = 0; j < solutionsLength; j++) {
            if (questionnairesInfo[i].solutionName == solutionsInfo[j].name) {
                questionnairesInfo[i].parentID = solutionsInfo[j].rowID;
                d.add(++dTreeItemNum, questionnairesInfo[i].parentID, questionnairesInfo[i].title, "javascript: ;", "", "", "./images/tree_04_q.png", "./images/tree_04_q.png");
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

/**
 * 显示隐藏层和弹出层 弹窗问卷设置
 * @public
 * @return
 */
function showCreateQuestionnaire() {
    if (activeSolution == -1) {
        txt = "请选择一个业务方案";
        window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        return;
    }
    var hideobj = document.getElementById("hidebg");

    /*将选中的业务方案填入*/
    $(".solution").empty();
    $(".solution").append(solutionsInfo[activeSolution].title);
    $(".popBoxItem input").val("");

    hidebg.style.display = "block"; //显示隐藏层
    document.getElementById("popBoxNew").style.display = "block"; //显示弹出层
}

function importQuestionnaire() {
    if (activeSolution == -1) {
        txt = "请选择一个业务方案";
        window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        return;
    }
    var hideobj = document.getElementById("hidebg");

    /*将选中的业务方案填入*/
    $(".solution").empty();
    $(".solution").append(solutionsInfo[activeSolution].title);
    $(".popBoxItem input").val("");

    hidebg.style.display = "block"; //显示隐藏层
    document.getElementById("popBoxImport").style.display = "block"; //显示弹出层
}

/**
 * 去除隐藏层和弹出层
 * @public
 * @return
 */
function hideCreateQuestionnaire() {
    document.getElementById("hidebg").style.display = "none";
    document.getElementById("popBoxNew").style.display = "none";
}
