/*引用JS文件*/
const restfulUtil = require('./js/restfulUtil.js');
const quesSqlite = require('./js/quesSqlite.js');

/*与主进程通信的模块*/
const ipcRenderer = require('electron').ipcRenderer;

/*用户基础数据*/
var GlobalData = null;
var tempQuestionnaire = null;

/*弹出框*/
var popMenu = false;
var activeSubject = null;
var activeInput;
var activeDiv;
var activeTxt;

/*各种监听事件*/
$(function() {

    /*获取用户基本信息*/
    __getGlobalData(function(res) {
        if (res.success == true) {
            console.log("获取用户基本信息成功");
        } else {
            console.log("获取用户基本信息失败");
        }
    });

    __getTempQuestionnaire(function(res) {
        if (res.success == true) {
            console.log("获取临时调查问卷信息成功");
            $("#titleNameTextID").empty().append(tempQuestionnaire.title);
        } else {
            console.log("获取临时调查问卷信息失败");
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
    $("#target").on("mouseover", ".subject, .unSubject", function() {
        var td = $(this);
        $(this).children().children("img").css({
            "visibility": "visible"
        });
    }).on("mouseout", ".subject, .unSubject", function() {
        var td = $(this);
        $(this).children().children("img").css({
            "visibility": "hidden"
        });
    });

    /*上移小图 鼠标移入替换为高亮*/
    $("#target").on("mouseover", ".up", function() {
        var td = $(this);
        td.attr('src', "./images/main_01_up_on.png");
    }).on("mouseout", ".up", function() {
        var td = $(this);
        td.attr('src', "./images/main_01_up_off.png");
    });

    /*下移小图 鼠标移入替换为高亮*/
    $("#target").on("mouseover", ".down", function() {
        var td = $(this);
        td.attr('src', "./images/main_02_down_on.png");
    }).on("mouseout", ".down", function() {
        var td = $(this);
        td.attr('src', "./images/main_02_down_off.png");
    });

    /*复制小图 鼠标移入替换为高亮*/
    $("#target").on("mouseover", ".copy", function() {
        var td = $(this);
        td.attr('src', "./images/main_06_copy_on.png");
    }).on("mouseout", ".copy", function() {
        var td = $(this);
        td.attr('src', "./images/main_06_copy_off.png");
    });

    /*删除小图 鼠标移入替换为高亮*/
    $("#target").on("mouseover", ".delete", function() {
        var td = $(this);
        td.attr('src', "./images/main_03_delete_on.png");
    }).on("mouseout", ".delete", function() {
        var td = $(this);
        td.attr('src', "./images/main_03_delete_off.png");
    });

    /*合并小图 鼠标移入替换为高亮*/
    $("#target").on("mouseover", ".merge", function() {
        var td = $(this);
        td.attr('src', "./images/main_07_merge_on.png");
    }).on("mouseout", ".merge", function() {
        var td = $(this);
        td.attr('src', "./images/main_07_merge_off.png");
    });

    /*拆解小图 鼠标移入替换为高亮*/
    $("#target").on("mouseover", ".unmerge", function() {
        var td = $(this);
        td.attr('src', "./images/main_08_unmerge_on.png");
    }).on("mouseout", ".unmerge", function() {
        var td = $(this);
        td.attr('src', "./images/main_08_unmerge_off.png");
    });

    /*添加选项小图 鼠标移入替换为高亮*/
    $("#target").on("mouseover", ".addItem", function() {
        var td = $(this);
        td.attr('src', "./images/main_04_add_on.png");
    }).on("mouseout", ".addItem", function() {
        var td = $(this);
        td.attr('src', "./images/main_04_add_off.png");
    });

    /*上移题目按钮点击事件*/
    $("#target").on("click", ".leftSetup .up", function() {
        $tdP = $(this).parent().parent();
        /*初始化左侧的图标效果*/
        $tdP.children().children("img.up").attr('src', "./images/main_01_up_off.png");
        $tdP.children().children("img").css({
            "visibility": "hidden"
        });
        $prevTdP = $tdP.prev();
        console.log($prevTdP.length);
        if ($prevTdP.length == 0) {
            txt = "已是第一个题目，无法再向上移动";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else {
            /*非第一题，向上移动*/
            $preTempSubject = $prevTdP.prop("outerHTML");
            $tempSubject = $tdP.prop("outerHTML");
            $tdP.after($preTempSubject);
            $tdP.after($tempSubject);
            $tdP.remove();
            $prevTdP.remove();
            setOrder();
        }
    });

    /*下移题目按钮点击事件*/
    $("#target").on("click", ".leftSetup .down", function() {
        $tdP = $(this).parent().parent();
        /*初始化左侧的图标效果*/
        $tdP.children().children("img.down").attr('src', "./images/main_02_down_off.png");
        $tdP.children().children("img").css({
            "visibility": "hidden"
        });
        $nextTdP = $tdP.next();
        if ($nextTdP.length == 0) {
            txt = "已是最后一个题目，无法再向下移动";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else {
            /*非第一题，向上移动*/
            $nextTempSubject = $nextTdP.prop("outerHTML");
            $tempSubject = $tdP.prop("outerHTML");

            $tdP.after($tempSubject);
            $tdP.after($nextTempSubject);

            $tdP.remove();
            $nextTdP.remove();
            setOrder();
        }
    });

    /*复制题目按钮点击事件*/
    $("#target").on("click", ".leftSetup .copy", function() {
        /*复制题目*/
        $tdP = $(this).parent().parent();
        $tdP.after($tdP.prop("outerHTML"));
        addSubjectJson($tdP.next(), getType($tdP));
        /*初始化左侧的图标效果*/
        $tdP.next().children().children("img.copy").attr('src', "./images/main_06_copy_off.png");
        $tdP.next().children().children("img").css({
            "visibility": "hidden"
        });
        setOrder();
    });

    /*删除题目按钮点击事件*/
    $("#target").on("click", ".leftSetup .delete", function() {
        $td = $(this).parent().parent();
        var $tdP;
        var flag = 1;
        /*弹出提示框*/
        window.wxc.xcConfirm("确定删除？", window.wxc.xcConfirm.typeEnum.confirm, function(res) {
            if (res.data == true) {
                var subjectNum = getLevelSubjectNum($td);
                $tdP = $td.parent().parent().parent();
                if ($td.parent().attr("id") == "target") {
                    /*只有一道题*/
                    flag = 0;
                }
                delete subject[$td.attr("connection")];
                $td.remove();
                while (subjectNum == 1 && flag) {
                    /*连锁删除*/
                    $td = $tdP;
                    $tdP = $td.parent().parent().parent();
                    subjectNum = getLevelSubjectNum($td);
                    if (subjectNum == 0) {
                        flag = 0;
                        break;
                    }
                    delete subject[$td.attr("connection")];
                    $td.remove();
                }
                setOrder();
                if (getSubjectNum() == 0) {
                    $("#target").append(emptyBox);
                }
            }
        });
    });

    /*合并题目按钮点击事件*/
    $("#target").on("click", ".leftSetup .merge", function() {
        $tdP = $(this).parent().parent();
        $prevTdP = $tdP.prev();
        if ($tdP.attr("num") == 1) {
            /*第一个题无法合并*/
            txt = "第一个题无法合并";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else if (getLevelSubjectNum($tdP) < 3 && $tdP.attr("level") > 1) {
            /*分组内至少三题才允许合并*/
            txt = "分组内至少三题才允许合并";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else if ($tdP.attr("level") == $prevTdP.attr("level") && $tdP.attr("father") == $prevTdP.attr("father")) {
            /*两题同级*/
            /*初始化左侧的图标效果*/
            $tdP.children().children("img.merge").attr('src', "./images/main_07_merge_off.png");
            $tdP.children().children("img").css({
                "visibility": "hidden"
            });
            mergeDiv = subjectDiv["merge"];
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

            addSubjectJson($mergeDiv, "merge");
        }
        setOrder();
    });

    /*拆解题目按钮点击事件*/
    $("#target").on("click", ".leftSetup .unmerge", function() {
        $tdP = $(this).parent().parent();
        if ($tdP.attr("level") == 1) {
            /*最高层级不能拆解*/
            txt = "只能拆解分组内的题目";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else if (getLevelSubjectNum($tdP) > 2) {
            /*不弹窗 保留分组 直接拆解*/
            $mergeTdP = $tdP.parent().parent().parent();
            level = $mergeDiv.attr("level");
            father = $mergeDiv.attr("father");
            $tdP.attr("level", level);
            $tdP.attr("father", father);
            $mergeTdP.after($tdP.prop("outerHTML"));
            $tdP.remove();
            setOrder();
        } else if (getLevelSubjectNum($tdP) == 2) {
            /*弹窗询问是否保留分组信息*/
            txt = "是否保留分组信息？";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.confirm, function(res) {
                if (res.data == true) {
                    /*保留*/
                    $mergeTdP = $tdP.parent().parent().parent();
                    level = $mergeDiv.attr("level");
                    father = $mergeDiv.attr("father");
                    $tdP.attr("level", level);
                    $tdP.attr("father", father);
                    $mergeTdP.after($tdP.prop("outerHTML"));
                    $tdP.remove();
                    setOrder();
                } else if (res.success == true) {
                    /*不保留*/
                    $mergeTdP = $tdP.parent().parent().parent();
                    level = $mergeDiv.attr("level");
                    father = $mergeDiv.attr("father");
                    if ($tdP.prev()[0]) {
                        /*正在拆解后题*/
                        $tdP.attr("level", level);
                        $tdP.attr("father", father);
                        $tdP.prev().attr("level", level);
                        $tdP.prev().attr("father", father);
                        $mergeTdP.after($tdP.prop("outerHTML"));
                        $mergeTdP.after($tdP.prev().prop("outerHTML"));
                        $mergeDiv.remove();
                    } else if ($tdP.next()[0]) {
                        /*正在拆解前题*/
                        $tdP.attr("level", level);
                        $tdP.attr("father", father);
                        $tdP.next().attr("level", level);
                        $tdP.next().attr("father", father);
                        $mergeTdP.after($tdP.next().prop("outerHTML"));
                        $mergeTdP.after($tdP.prop("outerHTML"));
                        $mergeDiv.remove();
                    }
                    setOrder();
                } else {
                    /*关闭 没有动作*/
                    console.log("直接关闭 没有动作");
                }
            });
        } else if (getLevelSubjectNum($tdP) == 1) {
            /*不弹窗 不保留分组*/
            $mergeTdP = $tdP.parent().parent().parent();
            level = $mergeDiv.attr("level");
            father = $mergeDiv.attr("father");
            $tdP.attr("level", level);
            $tdP.attr("father", father);
            $mergeTdP.after($tdP.prop("outerHTML"));
            $mergeDiv.remove();
        }
    });

    /*添加选项按钮点击事件*/
    $("#target").on("click", ".addItem", function() {
        $tdP = $(this).parent().parent();
        $tdPP = $tdP.children().children(".itemBox");
        var type = getType($tdP);
        $tdP.children().children(".itemBox").append(itemLabelDiv[type]);
        /*重置题目选项的字母*/
        setInitials($tdPP);
    });

    /*删除选项按钮点击事件*/
    $("#target").on("click", ".subjectMain .delete", function() {
        $tdP = $(this).parent().parent();
        $tdPP = $tdP.parent();
        if (getItemNum($tdP.parent()) > 1) {
            $tdP.remove();
            /*重置题目选项的字母*/
            console.log($tdPP);
            setInitials($tdPP);
        } else {
            txt = "只有一个选项，不能继续删除";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        }
    });

    /*上移选项按钮点击事件*/
    $("#target").on("click", ".subjectMain .up", function() {
        $tdP = $(this).parent().parent();
        $tdPP = $(this).parent().parent().parent();
        /*初始化左侧的图标效果*/
        $tdP.children().children("img.up").attr('src', "./images/main_01_up_off.png");
        $tdP.children().children("img").css({
            "visibility": "hidden"
        });
        $prevTdP = $tdP.prev();
        if ($prevTdP.length == 0) {
            txt = "已是第一个选项，无法再向上移动";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else {
            /*非第一个选项，向上移动*/
            $preTempSubject = $prevTdP.prop("outerHTML");
            $tempSubject = $tdP.prop("outerHTML");
            $tdP.after($preTempSubject);
            $tdP.after($tempSubject);
            $tdP.remove();
            $prevTdP.remove();
            /*重置题目选项的字母*/
            setInitials($tdPP);
        }
    });

    /*下移选项按钮点击事件*/
    $("#target").on("click", ".subjectMain .down", function() {
        $tdP = $(this).parent().parent();
        $tdPP = $(this).parent().parent().parent();
        /*初始化左侧的图标效果*/
        $tdP.children().children("img.down").attr('src', "./images/main_02_down_off.png");
        $tdP.children().children("img").css({
            "visibility": "hidden"
        });
        $nextTdP = $tdP.next();
        if ($nextTdP.length == 0) {
            txt = "已是最后一个选项，无法再向下移动";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.warning, function(res) {});
        } else {
            /*非第一选项，向上移动*/
            $nextTempSubject = $nextTdP.prop("outerHTML");
            $tempSubject = $tdP.prop("outerHTML");
            $tdP.after($tempSubject);
            $tdP.after($nextTempSubject);
            $tdP.remove();
            $nextTdP.remove();
            /*重置题目选项的字母*/
            setInitials($tdPP);
        }
    });

    /*选项菜单中的小图 鼠标移入题目显示 移出隐藏*/
    $("#target").on("mouseover", ".subjectMain li", function() {
        var $td = $(this);
        $td.find("img").css({
            "visibility": "visible"
        });
    }).on("mouseout", ".subjectMain li", function() {
        var $td = $(this);
        $td.find("img").css({
            "visibility": "hidden"
        });
    });

    /*当前活动题目点击高亮*/
    $("#target").on("click", ".radioDiv, .multipleDiv, .completionDiv, .multitermCompletionDiv, .shortAnswerDiv, .sortDiv, .descriptionDiv, .dividingLineDiv", function() {
        /*当前活动题目高亮*/
        $(".subject, .unSubject").css({
            "border-right": "#fff solid 5px"
        });
        $(this).css({
            "border-right": "#1ABC9C solid 5px"
        });
    });

    /*问卷设置监听事件start====================*/
    var $dropBox = $('#dropBox'),
        $tri = $('.dropBox_tri', $dropBox),
        $drop = $('div.dropBox_drop', $dropBox),
        $inp = $('div.dropBox_inp', $dropBox);

    /*级别鼠标移入移出事件*/
    $("#popBox #quesNoGrade").on("mouseover", "li", function() {
        $td = $(this);
        $td.css({
            "border": "2px solid #1ABC9C"
        });
    }).on("mouseout", "li", function() {
        $td = $(this);
        if ($td.css("background-color") != "rgb(26, 188, 156)") {
            $td.css({
                "border": "2px solid #f3f3f3"
            });
        }
    });

    /*级别点击事件*/
    $("#popBox #quesNoGrade").on("click", "li", function() {
        $td = $(this);
        $tdP = $td.parent();
        $tdP.find("li").css({
            "background-color": "#fff",
            "color": "#666666",
            "border-color": "#f3f3f3"
        });
        $td.css({
            "background-color": "#1ABC9C",
            "color": "#fff",
            "border-color": "#1ABC9C"
        });
        quesActiveNo = parseInt($td.html()) - 1;
        /*下拉框显示该层级的题号格式*/
        $inp[0].innerHTML = quesNoPattern[quesNoTemp[quesActiveNo]];
    });

    /*下拉框点击事件*/
    $tri.on('click', function(event) {
        var $el = $(this);
        if ($el.data('active') !== 'on') {
            $drop[0].style.display = 'block';
            $el.data('active', 'on');
        } else {
            $drop[0].style.display = 'none';
            $el.data('active', 'off');
        }
    });

    /*下拉框列表点击事件*/
    $drop.on("click", "li", function(event) {
        $td = $(this);
        $inp[0].innerHTML = this.innerHTML;
        quesNoTemp[quesActiveNo] = parseInt($td.attr("queNoType"));
        $drop[0].style.display = 'none';
        $tri.data('active', 'off');

        /*刷新预览*/
        $("#quesNoPreview ul").empty();
        for (var i = 0; i < quesNoTemp.length; i++) {
            $("#quesNoPreview ul").append(`<li>` + quesNoPattern[quesNoTemp[i]] + `</li>`);
        }
    });

    /*问卷设置弹出框 点击关闭和取消事件*/
    $("#popBox").on("click", "#popBoxClose, #popBoxButtonCancel", function() {
        hideSetup();
    });

    /*问卷设置弹出框 点击确认事件*/
    $("#popBox").on("click", "#popBoxButtonConfirm", function() {
        console.log("hehe");

        for (var i = 0; i < quesNoArr.length; i++) {
            quesNoArr[i] = quesNoTemp[i];
        }
        setOrder();
        hideSetup();
    });

    /*问卷设置监听事件end==================*/

    /*题目设置监听事件start================*/
    /*关闭按钮 监听事件*/
    $("#right").on('click', ".popMenuClose", function() {
        $(".trianglePop").remove();
        $(".popMenu").animate({
            left: '-200px',
            opacity: '0'
        }, 300, function() {
            popMenu = false;
            activeSubject = null;
            $("#right").empty();
        });
    });

    /*body 点击事件*/
    $(document).on('click', function(event) {
        var target = $(event.target);
        if (popMenu == true && !target.hasClass('popMenu') &&
            target[0] != activeSubject.children().children(".stemText")[0] &&
            target.parents('.popMenu').length == 0
        ) {
            /*处理输入框*/
            var newtxt = $(".stemTextInput").html();
            if (newtxt != activeTxt) {
                /*数据库操作*/
                activeDiv.html(newtxt);
            } else if (newtxt == activeTxt) {
                activeDiv.html(newtxt);
            }
            activeInput.blur();

            /*处理侧向弹出框*/
            $(".trianglePop").remove();
            $(".popMenu").animate({
                left: '-200px',
                opacity: '0'
            }, 300, function() {
                popMenu = false;
                activeSubject = null;
                $("#right").empty();
            });
        }
    });
    /*题目设置监听事件end================*/

    /*返回按钮 监听事件*/
    $("#back").on('click', function() {
        /*如果没有保存题型保存*/
        if (isSave == false) {
            txt = "您还没有保存问卷，是否保存？";
            window.wxc.xcConfirm(txt, window.wxc.xcConfirm.typeEnum.confirm, function(res) {
                if (res.data == true) {
                    /*调用保存函数*/
                } else {
                    /*删除库 直接返回*/
                    quesSqlite.deleteTempQuestionnaire(GlobalData, "tempRecid", function(res) {
                        if (res.success == true) {
                            window.location.href = "./list.html";
                        } else {
                            console.log("删除失败");
                        }
                    });
                }
            });
        } else {
            if (popMenu == true) {
                setTimeout(function() {
                    window.location.href = "./list.html";
                }, 300);
            } else {
                window.location.href = "./list.html";
            }
        }
    });

    /*标题 点击编辑*/
    $("#titleBox").on("click", "#titleNameTextID", function() {
        var $td = $(this);
        var txt = $td.html();
        var input = $(`<div id="titleNameTextInput" contenteditable="true">` + txt + `</div>`);
        $td.html(input);

        input.click(function() {
            /*防止二次嵌套临时div*/
            return false;
        });

        input.trigger("focus");
        /*文本框失去焦点后提交内容 重新变为文本*/
        input.blur(function() {
            var newtxt = $("#titleNameTextInput").html();
            /*判断文本有没有修改*/
            if (newtxt == "") {
                /*文本为空*/
                $td.html("空问卷");
            } else if (newtxt == txt) {
                /*文本与原来相同*/
                $td.html(newtxt);
            } else {
                /*文本与原来不同*/
                /*数据库操作*/
                $td.html(newtxt);
            }
        });
    });

    /*题头详述 点击编辑*/
    $("#titleBox").on("click", "#headDetailTextID", function() {
        var $td = $(this);
        var txt = $td.html();
        var input = $(`<div id="headDetailTextInput" contenteditable="true">` + txt + `</div>`);
        $td.html(input);

        input.click(function() {
            return false;
        });

        input.trigger("focus");
        /*文本框失去焦点后提交内容 重新变为文本*/
        input.blur(function() {
            var newtxt = $("#headDetailTextInput").html();
            /*判断文本有没有修改*/
            if (newtxt == "") {
                $td.html("欢迎参加本次答题");
            } else if (newtxt != txt) {
                /*数据库操作*/
                $td.html(newtxt);
            } else {
                $td.html(newtxt);
            }
        });
    });

    /*题尾详述 点击编辑*/
    $("#tailBox").on("click", "#tailDetailTextID", function() {
        var $td = $(this);
        var txt = $td.html();
        var input = $(`<div id="tailDetailTextInput" contenteditable="true">` + txt + `</div>`);
        $td.html(input);

        input.click(function() {
            return false;
        });

        input.trigger("focus");
        /*文本框失去焦点后提交内容 重新变为文本*/
        input.blur(function() {
            var newtxt = $("#tailDetailTextInput").html();
            /*判断文本有没有修改*/
            if (newtxt == "") {
                $td.html("您已完成本次问卷，感谢您的帮助与支持");
            } else if (newtxt != txt) {
                /*数据库操作*/
                $td.html(newtxt);
            } else {
                $td.html(newtxt);
            }
        });
    });

    /*所有题干 点击编辑*/
    $("#target").on("click", ".stemText", function() {
        if (popMenu == false) {
            activeDiv = $(this);
            activeSubject = activeDiv.parent().parent(".subject, .unSubject");
            /*确定题目类别*/
            var type = getType(activeDiv);

            activeTxt = activeDiv.html();
            activeInput = $(`<div class="stemTextInput" contenteditable="true">` + activeTxt + `</div>`);
            activeDiv.html(activeInput);

            activeInput.click(function() {
                return false;
            });
            activeInput.trigger("focus");

            /*题目设置弹出框*/
            __showPopMenu(activeDiv, type);
        }
    });

    /*所有题目描述 点击编辑*/
    $("#target").on("click", ".descriptionText", function() {

        var $td = $(this);
        /*确定题目种类*/
        var type = getType($td);

        var txt = $td.html();
        var input = $(`<div class="descriptionTextInput" contenteditable="true">` + txt + `</div>`);
        $td.html(input);

        input.click(function() {
            return false;
        });

        input.trigger("focus");
        input.blur(function() {
            var newtxt = $(".descriptionTextInput").html();
            if (newtxt != txt) {
                /*数据库操作*/
                $td.html(newtxt);
            } else if (newtxt == txt) {
                $td.html(newtxt);
            }
        });
    });

    /*所以题目选项 点击编辑*/
    $("#target").on("click", ".ItemText", function() {
        var $td = $(this);
        /*确定题目种类*/
        var type = getType($td);

        var txt = $td.html();
        var input = $(`<div class="itemTextInput" contenteditable="true">` + txt + `</div>`);
        $td.html(input);

        input.click(function() {
            return false;
        });

        input.trigger("focus");
        input.blur(function() {
            var newtxt = $(".itemTextInput").html();
            if (newtxt != txt) {
                /*数据库操作*/
                $td.html(newtxt);
            } else if (newtxt == txt) {
                $td.html(newtxt);
            }
        });
    });
});

function testArr() {
    console.log(subject);
}

/**
 * 显示描述的执行函数
 * @public
 * @param  {Boolean} checked [input中的checked属性]
 */
function showDesc(checked) {
    var connection = activeSubject.attr("connection");
    if (checked == true) {
        var type = getType(activeSubject);
        activeSubject.children().children(".stemText").after(descriptionDiv[type]);
        subject[connection].showDescription = true;
    } else {
        activeSubject.children().children(".descriptionText").remove();
        subject[connection].showDescription = false;
    }
}

/**
 * 显示必答的执行函数
 * @public
 * @param  {Boolean} checked input中的checked属性
 */
function showForced(checked) {
    var connection = activeSubject.attr("connection");
    if (checked == true) {
        subject[connection].forced = true;
    } else {
        subject[connection].forced = false;
    }
}

/**
 * 显示题号的执行函数
 * @public
 * @param  {Boolean} checked input中的checked属性
 */
function showQuestionNo(checked) {
    var connection = activeSubject.attr("connection");
    var classTemp = activeSubject.attr("class");
    if (checked == true) {
        subject[connection].questionNo = true;
        classTemp = classTemp.replace("unSubject", "subject");
        activeSubject.attr("class", classTemp);
    } else {
        subject[connection].questionNo = false;
        classTemp = classTemp.replace("subject", "unSubject");
        activeSubject.attr("class", classTemp);
    }
    setOrder();
}

/**
 * 与题目同行的执行函数
 * @public
 * @param  {Boolean} checked input中的checked属性
 */
function sameLine(checked) {
    var connection = activeSubject.attr("connection");
    subject[connection].sameLine = true;
    /*显示同行*/
    // setSameLine();
}

function setSameLine() {
    var stemText = activeSubject.children(".subjectMain").children(".stemText");
    var descriptionText = activeSubject.children(".subjectMain").children(".descriptionText");
    var itemBox = activeSubject.children(".subjectMain").children(".itemBox");
    var li = itemBox.children("li");
    stemText.css({
        "width": "40%",
        "float": "left"
    });
    descriptionText.css({
        "width": "40%",
        "float": "left"
    });
    stemText.after(itemBox);
    itemBox.css({
        "width": "60%",
        "float": "right"
    });
    var everyItem = 0.6 / getItemNum(itemBox);
    for (var i = 0; i < li.length; i++) {
        li.eq(i).css({
            "display": "inline",
            "width": everyItem
        });
        li.eq(i).children(".clear").remove();
    }
}

/**
 * 每行显示的执行函数
 * @public
 * @param  {Boolean} checked input中的checked属性
 */
function sameLine2(checked) {
    var connection = activeSubject.attr("connection");
    subject[connection].sameLine = false;
    subject[connection].showEveryLine = parseInt($(".showEveryLine").val());
    /*显示每行显示几个*/
    // setSameLine2(subject[connection].showEveryLine);
}

function setSameLine2(showEveryLine) {
    console.log(showEveryLine);
    var itemBox = activeSubject.children(".subjectMain").children(".itemBox");
    var li = itemBox.children("li");
    var everyItem = 100 / getItemNum(itemBox);
    console.log(everyItem);
    for (var i = 0; i < li.length; i++) {
        li.eq(i).css({
            "display": "inline",
            "width": everyItem + "%"
        });
        li.eq(i).children(".clear").remove();
    }
}

/**
 * 每行显示input变动执行函数
 * @public
 * @param {Boolean} value input中的checked属性
 */
function setShowEveryLine(value) {
    var connection = activeSubject.attr("connection");
    subject[connection].showEveryLine = parseInt(value);
    /*显示每行显示几个*/
}

/**
 * 设置简答题行数的执行函数
 * @public
 * @param value input值
 */
function setLine(value) {
    var connection = activeSubject.attr("connection");
    activeSubject.children().children().children().children("textarea").attr("rows", value);
    subject[connection].showLine = parseInt(value);
}

/**
 * 最少字数的执行函数
 * @public
 * @param value input值
 */
function setMinLength(value) {
    console.log(value);
    var connection = activeSubject.attr("connection");
    subject[connection].minLength = parseInt(value);
}

/**
 * 最多字数的执行函数
 * @public
 * @param value input值
 */
function setMaxLength(value) {
    var connection = activeSubject.attr("connection");
    subject[connection].maxLength = parseInt(value);
}

/**
 * 显示题目设置的菜单
 * @private
 * @param  $td 当前弹出题目设置的盒子
 * @return
 */
function __showPopMenu($td, type) {
    /*如果是非弹出框题型 直接跳出*/
    if (type == "merge" || type == "description") {
        activeSubject == null;
        popMenu == false;
        return;
    }

    var position = $td[0].offsetHeight / 2 + $td[0].offsetTop - $("#headTop")[0].offsetHeight - 25;
    $("#right").append(menuPopDiv[type]);

    var connection = activeSubject.attr("connection");

    $(".forced").attr("checked", subject[connection].forced);
    $(".questionNo").attr("checked", subject[connection].questionNo);
    $(".showDescription").attr("checked", subject[connection].showDescription);

    $(".minSelectItem").attr("checked", subject[connection].minSelectItem);
    $(".maxSelectItem").attr("checked", subject[connection].maxSelectItem);

    if (subject[connection].sameLine == true) {
        $(".sameLine").attr("checked", true);
    } else {
        $(".sameLine2").attr("checked", true);
    }
    $(".showEveryLine").attr("value", subject[connection].showEveryLine);

    $(".showLine").attr("value", subject[connection].showLine);
    $(".minLength").attr("value", subject[connection].minLength);
    $(".maxLength").attr("value", subject[connection].maxLength);

    popMenu = true;

    $(".popMenu").animate({
        left: '0px',
        opacity: '1'
    }, 300, function() {
        $("#right").append(trianglePop);
        $(".trianglePop").css({
            "top": `${position}px`
        });
    });
}

function setInitials($tdPP) {
    $tdP = $tdPP.children("li").children(".initials");
    for (var i = 0; i < $tdP.length; i++) {
        $tdP.eq(i).empty();
        $tdP.eq(i).append(String.fromCharCode((65 + i)) + ".");
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
            success: true,
            data: err.message
        });
    }
}

/**
 * 与主进程通信获取用户基础数据GlobalData
 * @private
 * @return
 */
function __getTempQuestionnaire(cb) {
    try {
        ipcRenderer.send('asynchronous-get-tempQuestionnaire-message');
        ipcRenderer.on('asynchronous-get-tempQuestionnaire-reply', (event, arg) => {
            tempQuestionnaire = arg;
            console.log("tempQuestionnaire");
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
function getType($td) {
    var type;
    if ($td.attr("class").indexOf("radio") >= 0) {
        type = "radio";
    } else if ($td.attr("class").indexOf("multiple") >= 0) {
        type = "multiple";
    } else if ($td.attr("class").indexOf("multitermCompletion") >= 0) {
        type = "multitermCompletion";
    } else if ($td.attr("class").indexOf("completion") >= 0) {
        type = "completion";
    } else if ($td.attr("class").indexOf("shortAnswer") >= 0) {
        type = "shortAnswer";
    } else if ($td.attr("class").indexOf("sort") >= 0) {
        type = "sort";
    } else if ($td.attr("class").indexOf("description") >= 0) {
        type = "description";
    } else if ($td.attr("class").indexOf("dividingLine") >= 0) {
        type = "dividingLine";
    } else if ($td.attr("class").indexOf("merge") >= 0) {
        type = "merge";
    } else {
        type = "unKnown Type";
    }
    return type;
}

/**
 * 获取选项个数
 * @param  $tdP 某题型
 * @return 选项个数
 */
function getItemNum($tdP) {
    $tdTemp = $tdP.find("li");
    return $tdTemp.length;
}

/**
 * 显示隐藏层和弹出层 弹窗问卷设置
 * @public
 * @return
 */
function showSetup() {
    var $dropBox = $('#dropBox'),
        $tri = $('.dropBox_tri', $dropBox),
        $drop = $('div.dropBox_drop', $dropBox),
        $inp = $('div.dropBox_inp', $dropBox);
    var hideobj = document.getElementById("hidebg");

    for (var i = 0; i < quesNoArr.length; i++) {
        quesNoTemp[i] = quesNoArr[i];
    }

    /*初始化级别*/
    $("#quesNoGrade").find("li").css({
        "background-color": "#fff",
        "color": "#666666",
        "border-color": "#f3f3f3"
    });
    $("#activeQuesNo").css({
        "background-color": "#1ABC9C",
        "color": "#fff",
        "border-color": "#1ABC9C"
    });

    /*初始化下拉框*/
    $drop[0].style.display = 'none';
    $tri.data('active', 'off');
    $inp[0].innerHTML = quesNoPattern[quesNoArr[0]];
    $(".dropBox_drop ul").empty();
    for (var i = 0; i < quesNoPattern.length; i++) {
        $(".dropBox_drop ul").append(`<li queNoType=` + i + `>` + quesNoPattern[i] + `</li>`);
    }

    /*初始化预览*/
    $("#quesNoPreview ul").empty();
    for (var i = 0; i < quesNoArr.length; i++) {
        $("#quesNoPreview ul").append(`<li>` + quesNoPattern[quesNoArr[i]] + `</li>`);
    }

    hidebg.style.display = "block"; //显示隐藏层
    document.getElementById("popBox").style.display = "block"; //显示弹出层
}

/**
 * 去除隐藏层和弹出层
 * @public
 * @return
 */
function hideSetup() {
    document.getElementById("hidebg").style.display = "none";
    document.getElementById("popBox").style.display = "none";
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
