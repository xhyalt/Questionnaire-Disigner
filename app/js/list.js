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
/*当前选中的业务方案*/
var solutionTemp = null;

$(function() {

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
        fresh.changeClassToOn(this);
        initQuestionnaire(function(res) {
            if (res.success == true) {
                initTree();
                solutionTemp = null;
                if ($(".listBody").length && $(".listBody").length > 0)
                    $(".listBody").remove();
            }
        });
    });

    $("#listTable").on("mouseover", ".listBody", function() {
        $(this).css({
            "background-color": "#f8fefd",
            "border-left": "3px solid #1ABC9C"
        });
    }).on("mouseout", ".listBody", function() {
        $(this).css({
            "background-color": "#fff",
            "border-left": "3px solid #fff"
        });
    });

    /*新建问卷监听事件start===========================*/
    var $dropBox1 = $('#popBox #popBoxSolution .dropBox'),
        $tri1 = $('.dropBox_tri', $dropBox1),
        $drop1 = $('div.dropBox_drop', $dropBox1),
        $inp1 = $('div.dropBox_inp', $dropBox1);

    var $dropBox2 = $('#popBox #popBoxSecret .dropBox'),
        $tri2 = $('.dropBox_tri', $dropBox2),
        $drop2 = $('div.dropBox_drop', $dropBox2),
        $inp2 = $('div.dropBox_inp', $dropBox2);

    /*下拉框点击事件*/
    $tri1.on('click', function(event) {
        var $el = $(this);
        if ($el.data('active') !== 'on') {
            $drop1[0].style.display = 'block';
            $el.data('active', 'on');
        } else {
            $drop1[0].style.display = 'none';
            $el.data('active', 'off');
        }
    });

    /*下拉框点击事件*/
    $tri2.on('click', function(event) {
        var $el = $(this);
        if ($el.data('active') !== 'on') {
            $drop2[0].style.display = 'block';
            $el.data('active', 'on');
        } else {
            $drop2[0].style.display = 'none';
            $el.data('active', 'off');
        }
    });

    /*下拉框列表点击事件*/
    $drop1.on("click", "li", function(event) {
        $td = $(this);
        $inp1[0].innerHTML = this.innerHTML;
        quesNoTemp[quesActiveNo] = parseInt($td.attr("queNoType"));
        $drop1[0].style.display = 'none';
        $tri1.data('active', 'off');

        /*刷新预览*/
        $("#quesNoPreview ul").empty();
        for (var i = 0; i < quesNoTemp.length; i++) {
            $("#quesNoPreview ul").append(`<li>` + quesNoPattern[quesNoTemp[i]] + `</li>`);
        }
    });

    $drop2.on("click", "li", function(event) {
        $td = $(this);
        $inp2[0].innerHTML = this.innerHTML;
        $drop2[0].style.display = 'none';
        $tri1.data('active', 'off');

        /*刷新预览*/
        $("#quesNoPreview ul").empty();
        for (var i = 0; i < quesNoTemp.length; i++) {
            $("#quesNoPreview ul").append(`<li>` + quesNoPattern[quesNoTemp[i]] + `</li>`);
        }
    });

    /*新建问卷弹出框 点击关闭和取消事件*/
    $("#popBox").on("click", "#popBoxClose, #popBoxButtonCancel", function() {
        hideCreateQuestionnaire();
    });

    /*新建问卷弹出框 点击确认事件*/
    $("#popBox").on("click", "#popBoxButtonConfirm", function() {
        console.log("hehe");



        hideCreateQuestionnaire();
        window.location.href = "./design.html";
    });
    /*新建问卷监听事件end===========================*/
});

var fresh = {
    changeClassToOn: function(target) {
        $(target).removeClass('off').addClass('on');
    },
    changeClassToOff: function(target) {
        $(target).removeClass('on').addClass('off');
    }
}

function init() {
    __getGlobalData(function(res0) {
        if (res0.success == true) {
            initTree();
        }
    });
}

/**
 * 初始化树
 * @return
 */
function initTree() {
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
            // console.log(JSON.stringify(res.data));
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
                            console.log("res2.data.length = " + questionnairesLength);
                            console.log("questionnairesInfo = " + questionnairesInfo);
                            /*添加调查问卷的树结点*/
                            __addQuestionnaireTreeItem(function(res) {
                                if (res.success == true) {
                                    console.log("添加调查问卷树节点成功");
                                    fresh.changeClassToOff($("#fresh"));
                                    document.getElementById('treeDemo').innerHTML = d;
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
 * [树节点业务方案的点击事件]
 * @param  solutionRecidIndex [该业务方案节点的recid]
 * @return
 */
function showQuestionnaires(solutionRecidIndex, i) {
    //添加节点点击事件
    var quesNum = 0;
    solutionTemp = i;
    console.log($(".listBody"));
    console.log("长度" + $(".listBody").length);
    if ($(".listBody").length && $(".listBody").length > 0)
        $(".listBody").remove();
    for (let i = 0; i < questionnairesLength; i++) {
        if (questionnairesInfo[i].solutionRecid == solutionRecidIndex) {
            console.log(questionnairesInfo[i].title);
            /*在右边显示出点击的业务方案所包含的所有调查问卷*/
            $("#listHead").after(`
                <tr class="listBody">
                    <td class="titleTd">${questionnairesInfo[i].title}</td>
                    <td class="codeTd">${questionnairesInfo[i].recid}</td>
                    <td class="syncTd"></td>
                    <td class="editTd"></td>
                    <td class="operTd">
                        <a href="javascript: ;">编辑</a>
                        <a href="javascript: ;">预览</a>
                        <a href="javascript: ;">删除</a>
                    </td>
                </tr>`);
        }
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

                                if (++countI == solutionsLength) {
                                    /*删除isNew字段为0的数据*/
                                    quesSqlite.deleteSolutionIsNew(GlobalData, function(res3) {
                                        if (res3.success == true) {
                                            console.log("删除isNew字段为0的数据成功");
                                        } else {
                                            console.log("删除isNew字段为0的字段失败");
                                        }
                                    });
                                }
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
                                            quesSqlite.initQuestionnairesList(GlobalData, solutionsInfo[i].recid, questionnairesInfo[j], function(res4) {
                                                if (res4.success == true) {
                                                    console.log("调查问卷列表写入数据库成功");
                                                    if (++countJ == questionnairesAllLength) {
                                                        quesSqlite.deleteQustionnaireIsNew(GlobalData, solutionsInfo[i].recid, function(res5) {
                                                            if (res5.success == true) {
                                                                console.log("删除isNew字段为0的数据成功");
                                                                fresh.changeClassToOff($("#fresh"));
                                                                cb({
                                                                    success: true
                                                                });
                                                            } else {
                                                                console.log("删除isNew字段为0的数据失败");
                                                                fresh.changeClassToOff($("#fresh"));
                                                                cb({
                                                                    success: false,
                                                                    data: "删除isNew字段为0的数据失败"
                                                                });
                                                            }
                                                        });
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

function clickQ() {
    alert("qqq");
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
        let temp = solutionsInfo[i].recid;
        d.add(++dTreeItemNum, 0, solutionsInfo[i].title, `javascript:showQuestionnaires('${temp}', ${i});`, '', solutionsInfo[i].recid, "./images/tree_02_op.png", "./images/tree_02_op.png");
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
            if (questionnairesInfo[i].solutionRecid == solutionsInfo[j].recid) {
                questionnairesInfo[i].parentID = solutionsInfo[j].rowID;
                d.add(++dTreeItemNum, questionnairesInfo[i].parentID, questionnairesInfo[i].title, "javascript: clickQ();", "", "", "./images/tree_04_q.png", "./images/tree_04_q.png");
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
    if (solutionTemp == null) {
        txt = "请选择一个业务方案";
        window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        return;
    }
    var hideobj = document.getElementById("hidebg");

    var $dropBox = $('#popBox #popBoxSolution .dropBox'),
        $tri = $('.dropBox_tri', $dropBox),
        $drop = $('div.dropBox_drop', $dropBox),
        $inp = $('div.dropBox_inp', $dropBox);

    /*将选中的业务方案填入*/
    $(".solution").empty();
    $(".solution").append(solutionsInfo[solutionTemp].title);

    hidebg.style.display = "block"; //显示隐藏层
    document.getElementById("popBox").style.display = "block"; //显示弹出层
}

/**
 * 去除隐藏层和弹出层
 * @public
 * @return
 */
function hideCreateQuestionnaire() {
    document.getElementById("hidebg").style.display = "none";
    document.getElementById("popBox").style.display = "none";
}
