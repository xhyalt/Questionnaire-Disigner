/*引用JS文件*/
// const restfulUtil = require('./js/restfulUtil.js');
// const quesSqlite = require('./js/quesSqlite.js');
/*与主进程通信的模块*/
// const ipcRenderer = require('electron').ipcRenderer;
/*用户基础数据*/
var GlobalData = null;

$(function() {

    /*获取用户基本信息*/
    __getGlobalData(function(res) {
        if (res.success == true) {
            console.log("获取用户基本信息成功");
        } else {
            console.log("获取用户基本信息失败");
        }
    });

    /*鼠标移入移出可编辑条目 变化颜色*/
    $("#middle").on("mouseover", ".textBox", function() {
        var td = $(this);
        td.css("background-color", "#b4fbef");
    }).on("mouseout", ".textBox", function() {
        var td = $(this);
        td.css("background-color", "#fff");
    });

    /*题目中的小图 鼠标移入题目显示 移出隐藏*/
    $("#target").on("mouseover", ".subject", function() {
        var td = $(this);
        $(this).children().children("img").css({
            "visibility": "visible"
        });
    }).on("mouseout", ".subject", function() {
        var td = $(this);
        $(this).find("img").css({
            "visibility": "hidden"
        });
    });
    /*题目中的小图 鼠标移入小图替换为高亮图*/
    $("#target").on("mouseover", ".up", function() {
        var td = $(this);
        td.attr('src', "./images/main_01_up_on.png");
    }).on("mouseout", ".up", function() {
        var td = $(this);
        td.attr('src', "./images/main_01_up_off.png");
    });
    $("#target").on("mouseover", ".down", function() {
        var td = $(this);
        td.attr('src', "./images/main_02_down_on.png");
    }).on("mouseout", ".down", function() {
        var td = $(this);
        td.attr('src', "./images/main_02_down_off.png");
    });
    $("#target").on("mouseover", ".copy", function() {
        var td = $(this);
        td.attr('src', "./images/main_06_copy_on.png");
    }).on("mouseout", ".copy", function() {
        var td = $(this);
        td.attr('src', "./images/main_06_copy_off.png");
    });
    $("#target").on("mouseover", ".delete", function() {
        var td = $(this);
        td.attr('src', "./images/main_03_delete_on.png");
    }).on("mouseout", ".delete", function() {
        var td = $(this);
        td.attr('src', "./images/main_03_delete_off.png");
    });
    $("#target").on("mouseover", ".addItem", function() {
        var td = $(this);
        td.attr('src', "./images/main_04_add_on.png");
    }).on("mouseout", ".addItem", function() {
        var td = $(this);
        td.attr('src', "./images/main_04_add_off.png");
    });

    /*上移题目按钮点击事件*/
    $("#target").on("click", ".up", function() {
        $tdP = $(this).parent().parent();
        $prevTdP = $tdP.prev();
        if ($tdP.attr("num") == 1) {
            txt = "已是第一个题目，无法再向上移动";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else {
            /*非第一题，向上移动*/
            $preTempSubject = $prevTdP.html();
            $tempSubject = $tdP.html();
            $tdP.empty();
            $tdP.append($preTempSubject);
            $prevTdP.empty();
            $prevTdP.append($tempSubject);
            setOrder();
        }
    });

    /*下移题目按钮点击事件*/
    $("#target").on("click", ".down", function() {
        $tdP = $(this).parent().parent();
        $nextTdP = $tdP.next();
        // console.log($tdP.attr("num"));
        if ($tdP.attr("num") == getLevelSubjectNum($tdP)) {
            txt = "已是最后一个题目，无法再向下移动";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else {
            /*非第一题，向上移动*/
            $nextTempSubject = $nextTdP.html();
            $tempSubject = $tdP.html();
            $tdP.empty();
            $tdP.append($nextTempSubject);
            $nextTdP.empty();
            $nextTdP.append($tempSubject);
            setOrder();
        }
    });

    /*复制题目按钮点击事件*/
    $("#target").on("click", ".copy", function() {
        /*复制题目*/
        $tdP = $(this).parent().parent();
        $tdP.after($tdP.prop("outerHTML"));
        setOrder();
    });

    /*删除题目按钮点击事件*/
    $("#target").on("click", ".delete", function() {
        $tdP = $(this).parent().parent();
        /*弹出提示框*/
        window.wxc.xcConfirm("确定删除？", window.wxc.xcConfirm.typeEnum.confirm, function(res) {
            if (res.data == true) {
                $tdP.remove();
                setOrder();
                if (getSubjectNum() == 0) {
                    $("#target").append(emptyBox);
                }
            }
        });
    });

    /*合并题目按钮点击事件*/
    $("#target").on("click", ".merge", function() {
        $tdP = $(this).parent().parent();
        $prevTdP = $tdP.prev();

        if ($tdP.attr("num") == 1) {
            /*第一题不能合并*/
            txt = "第一个题无法合并";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else if (getLevelSubjectNum($tdP) < 3 && $tdP.attr("level") > 1) {
            /*分组内至少三题才允许合并*/
            txt = "分组内至少三题才允许合并";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else if ($tdP.attr("level") == $prevTdP.attr("level") && $tdP.attr("father") == $prevTdP.attr("father")) {
            /*两题同级*/
            $tdP.after(mergeDiv);
            $mergeDiv = $tdP.next();
            $mergeDiv.attr("level", parseInt($tdP.attr("level")));
            $mergeDiv.attr("father", parseInt($tdP.attr("father")));
            $tdP.attr("level", parseInt($mergeDiv.attr("level")) + 1);
            $prevTdP.attr("level", parseInt($mergeDiv.attr("level")) + 1);
            $tdP.attr("father", parseInt($mergeDiv.attr("father")) + 1);
            $prevTdP.attr("father", parseInt($mergeDiv.attr("father")) + 1);
            $mergeDiv.find(".mergeItem").append($prevTdP.prop("outerHTML") + $tdP.prop("outerHTML"));
            $tdP.remove();
            $prevTdP.remove();
        }
        setOrder();
    });

    /*添加选项按钮点击事件*/
    $("#target").on("click", ".addItem", function() {
        $tdP = $(this).parent().parent();
        var type = getType($tdP);
        if (type == "radio") {
            $tdP.find(".radioItem").append(radioItemLabel);
        } else if (type == "multiple") {
            $tdP.find(".multipleItem").append(multipleItemLabel);
        } else if (type == "multitermCompletion") {
            $tdP.find(".multitermCompletionItem").append(multitermCompletionItemLabel);
        } else if (type == "sort") {
            $tdP.find(".sortItem").append(sortItemLabel);
        }
    });

    /*标题 点击编辑*/
    $("#titleBox").on("click", "#titleNameTextID", function() {
        var td = $(this);
        var txt = td.html();
        var input = $(`<div id="titleNameTextInput" contenteditable="true">` + txt + `</div>`);
        td.html(input);

        input.click(function() {
            /*防止二次嵌套临时idv*/
            return false;
        });

        input.trigger("focus");
        /*文本框失去焦点后提交内容 重新变为文本*/
        input.blur(function() {
            var newtxt = $("#titleNameTextInput").html();
            /*判断文本有没有修改*/
            if (newtxt == "") {
                /*文本为空*/
                td.html("空问卷");
            } else if (newtxt == txt) {
                /*文本与原来相同*/
                td.html(newtxt);
            } else {
                /*文本与原来不同*/
                /*数据库操作*/
                td.html(newtxt);
            }
        });
    });

    /*题头详述 点击编辑*/
    $("#titleBox").on("click", "#headDetailTextID", function() {
        var td = $(this);
        var txt = td.html();
        var input = $(`<div id="headDetailTextInput" contenteditable="true">` + txt + `</div>`);
        td.html(input);

        input.click(function() {
            return false;
        });

        input.trigger("focus");
        /*文本框失去焦点后提交内容 重新变为文本*/
        input.blur(function() {
            var newtxt = $("#headDetailTextInput").html();
            /*判断文本有没有修改*/
            if (newtxt == "") {
                td.html("欢迎参加本次答题");
            } else if (newtxt != txt) {
                /*数据库操作*/
                td.html(newtxt);
            } else {
                td.html(newtxt);
            }
        });
    });

    /*题尾详述 点击编辑*/
    $("#tailBox").on("click", "#tailDetailTextID", function() {
        var td = $(this);
        var txt = td.html();
        var input = $(`<div id="tailDetailTextInput" contenteditable="true">` + txt + `</div>`);
        td.html(input);

        input.click(function() {
            return false;
        });

        input.trigger("focus");
        /*文本框失去焦点后提交内容 重新变为文本*/
        input.blur(function() {
            var newtxt = $("#tailDetailTextInput").html();
            /*判断文本有没有修改*/
            if (newtxt == "") {
                td.html("您已完成本次问卷，感谢您的帮助与支持");
            } else if (newtxt != txt) {
                /*数据库操作*/
                td.html(newtxt);
            } else {
                td.html(newtxt);
            }
        });
    });

    /*所有题干 点击编辑*/
    $("#target").on("click", ".stemText", function() {

        var td = $(this);
        var type = getType(td);
        /*确定题目种类*/

        var txt = td.text();
        var input = $(`<div class="stemTextInput" contenteditable="true">` + txt + `</div>`);
        td.html(input);

        input.click(function() {
            return false;
        });

        input.trigger("focus");
        input.blur(function() {
            var newtxt = $(".stemTextInput").html();
            if (newtxt == "") {
                if (type == "radio") {
                    td.html("单选题");
                } else if (type == "multiple") {
                    td.html("多选题");
                } else if (type == "completion") {
                    td.html("填空题");
                } else if (type == "multitermCompletion") {
                    td.html("多项填空题");
                } else if (type == "shortAnswer") {
                    td.html("简答题");
                } else if (type == "sort") {
                    td.html("排序题");
                } else if (type == "description") {
                    td.html("描述说明");
                }
            } else if (newtxt != txt) {
                /*数据库操作*/
                td.html(newtxt);
            } else {
                td.html(newtxt);
            }
        });
    });

    /*所有题目描述 点击编辑*/
    $("#target").on("click", ".descriptionText", function() {

        var td = $(this);
        var type = getType(td);
        /*确定题目种类*/

        var txt = td.text();
        var input = $(`<input class='descriptionTextInput' type='text' value='` + txt + `'/>`);
        td.html(input);
        input.select();
        input.click(function() {
            $(this).select();
            return false;
        });
        input.keydown(function() {
            if (event.keyCode == "13") {
                input.blur();
            }
        });
        input.trigger("focus");
        input.blur(function() {
            var newtxt = $(this).val();
            if (newtxt == "") {
                if (type == "radio") {
                    td.html("单选题描述");
                } else if (type == "multiple") {
                    td.html("多选题描述");
                } else if (type == "completion") {
                    td.html("填空题描述");
                } else if (type == "multitermCompletion") {
                    td.html("多项填空题描述");
                } else if (type == "shortAnswer") {
                    td.html("简答题描述");
                } else if (type == "sort") {
                    td.html("排序题描述");
                }
            } else if (newtxt != txt) {
                /*数据库操作*/
                td.html(newtxt);
            } else {
                td.html(newtxt);
            }
        });
    });

    /*所以题目选项 点击编辑*/
    $("#target").on("click", ".ItemText", function() {
        var td = $(this);
        var txt = td.text();
        var input = $(`<input class='itemTextInput' type='text' value='` + txt + `'/>`);
        td.html(input);
        input.select();
        input.click(function() {
            $(this).select();
            return false;
        });
        input.keydown(function() {
            if (event.keyCode == "13") {
                input.blur();
            }
        });
        input.trigger("focus");
        input.blur(function() {
            var newtxt = $(this).val();
            if (newtxt == "") {
                td.html("选项");
            } else if (newtxt != txt) {
                /*数据库操作*/
                td.html(newtxt);
            } else {
                td.html(newtxt);
            }
        });
    });
});

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
 * 获取题目类型
 * @param  td [div]
 * @return [题目类型]
 */
function getType(td) {
    var type;
    if (td.attr("class").indexOf("radio") >= 0) {
        type = "radio";
    } else if (td.attr("class").indexOf("multiple") >= 0) {
        type = "multiple";
    } else if (td.attr("class").indexOf("multitermCompletion") >= 0) {
        type = "multitermCompletion";
    } else if (td.attr("class").indexOf("completion") >= 0) {
        type = "completion";
    } else if (td.attr("class").indexOf("shortAnswer") >= 0) {
        type = "shortAnswer";
    } else if (td.attr("class").indexOf("sort") >= 0) {
        type = "sort";
    } else if (td.attr("class").indexOf("description") >= 0) {
        type = "description";
    }
    return type;
}

function MM_swapImgRestore() {
    var i, x, a = document.MM_sr;
    for (i = 0; a && i < a.length && (x = a[i]) && x.oSrc; i++) x.src = x.oSrc;
}

function MM_preloadImages() {
    var d = document;
    if (d.images) {
        if (!d.MM_p) d.MM_p = new Array();
        var i, j = d.MM_p.length,
            a = MM_preloadImages.arguments;
        for (i = 0; i < a.length; i++) {
            if (a[i].indexOf("#") != 0) {
                d.MM_p[j] = new Image;
                d.MM_p[j++].src = a[i];
            }
        }
    }
}

function MM_findObj(n, d) {
    var p, i, x;
    if (!d) d = document;
    if ((p = n.indexOf("?")) > 0 && parent.frames.length) {
        d = parent.frames[n.substring(p + 1)].document;
        n = n.substring(0, p);
    }
    if (!(x = d[n]) && d.all) x = d.all[n];
    for (i = 0; !x && i < d.forms.length; i++) x = d.forms[i][n];
    for (i = 0; !x && d.layers && i < d.layers.length; i++) x = MM_findObj(n, d.layers[i].document);
    if (!x && d.getElementById) x = d.getElementById(n);
    return x;
}

function MM_swapImage() {
    var i, j = 0,
        x, a = MM_swapImage.arguments;
    document.MM_sr = new Array;
    for (i = 0; i < (a.length - 2); i += 3)
        if ((x = MM_findObj(a[i])) != null) {
            document.MM_sr[j++] = x;
            if (!x.oSrc) x.oSrc = x.src;
            x.src = a[i + 2];
        }
}

function getQuestionnairesData() {
    restfulUtil.getQuestionnairesData(GlobalData, "383FBE73B8F84999F93E5ECC6C45D42A", function(res) {
        console.log(JSON.stringify(res));
    });
}
