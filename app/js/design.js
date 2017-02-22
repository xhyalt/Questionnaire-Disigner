/*引用JS文件*/
// const restfulUtil = require('./js/restfulUtil.js');
// const quesSqlite = require('./js/quesSqlite.js');
/*与主进程通信的模块*/
// const ipcRenderer = require('electron').ipcRenderer;
/*用户基础数据*/
var GlobalData = null;

$(function() {
    var LPB = window.LPB = window.LPB || {
        plugins: [],
        genSource: function() {
            var $temptxt = $("<div>").html($("#build").html());
            $($temptxt).find(".subType").attr({
                "title": null,
                "data-original-title": null,
                "data-type": null,
                "data-content": null,
                "rel": null,
                "trigger": null,
                "style": null
            });
            $($temptxt).find(".subType").removeClass("subType");
            $($temptxt).find("form").attr({
                "id": null,
                "style": null
            });
        }
    };
    /*获取用户基本信息*/
    __getGlobalData(function(res) {
        if (res.success == true) {
            console.log("获取用户基本信息成功");
        } else {
            console.log("获取用户基本信息失败");
        }
    });



    /*鼠标移入题目显示小图标 移出题目隐藏小图标*/
    $(".subject").mouseover(function() {
        var td = $(this);
        // td.$("#up").show();
    }).mouseout(function() {
        var td = $(this);
        // td.$("#up").hide();
    });

    /*鼠标移入移出详述 变化颜色*/
    $("#target").on("mouseover", ".textBox", function() {
        var td = $(this);
        td.css("background-color", "#b4fbef");
    }).on("mouseout", ".textBox", function() {
        var td = $(this);
        td.css("background-color", "#fff");
    });

    /*题头详述 点击编辑*/
    $("#headDetailID").click(function() {
        var td = $(this);
        var txt = td.text();
        var input = $(`<input id='detailTextInput' type='text' value='` + txt + `'/>`);
        td.html(input);
        input.select();
        input.click(function() {
            $(this).select();
            return false;
        });
        /*回车自动保存*/
        input.keydown(function() {
            if (event.keyCode == "13") {
                input.blur();
            }
        });
        input.trigger("focus");
        /*文本框失去焦点后提交内容 重新变为文本*/
        input.blur(function() {
            var newtxt = $(this).val();
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

    /*单选题题干 点击编辑*/
    $(".radioStemText").click(function() {
        var td = $(this);
        var txt = td.text();
        var input = $(`<input class='radioStemTextInput' type='text' value='` + txt + `'/>`);
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
                td.html("单选题");
            } else if (newtxt != txt) {
                /*数据库操作*/
                td.html(newtxt);
            } else {
                td.html(newtxt);
            }
        });
    });

    /*单选题选项 点击编辑*/
    $(".radioItemText").click(function() {
        var td = $(this);
        var txt = td.text();
        var input = $(`<input class='radioItemTextInput' type='text' value='` + txt + `'/>`);
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

$(document).ready(function() {

    /*题型点击事件*/
    $(".menuItemBox").delegate(".subType", "mousedown", function(md) {
        $(".popover").remove();
        md.preventDefault();
        var tops = [];
        var mouseX = md.pageX;
        var mouseY = md.pageY;
        var $temp;
        var timeout;
        var $this = $(this);
        var delays = {
            main: 0,
            form: 120
        };
        var type;

        if ($this.parent().parent().parent().attr("class") === "menuItemBox") {
            type = "main";
        } else {
            type = "form";
        }

        var delayed = setTimeout(function() {
            console.log("var delayed = setTimeout");
            // if (type === "main") {
            $temp = $(`<div class="cloth"></div>`).append(radioDiv);
            // } else {
            //     if ($this.attr("id") !== "legend") {
            //         $temp = $($this).append(radioDiv);
            //     }
            // }

            $("body").append($temp);

            $temp.css({
                "position": "absolute",
                "top": mouseY - ($temp.height() / 2) + "px",
                "left": mouseX - ($temp.width() / 2) + "px",
                "opacity": "0.9"
            }).show()

            var half_box_height = ($temp.height() / 2);
            var half_box_width = ($temp.width() / 2);
            var $target = $("#target");
            var tar_pos = $target.position();
            var $target_subType = $("#target .subject");

            /*题型 鼠标移动触发事件*/
            $(document).delegate("body", "mousemove", function(mm) {

                var mm_mouseX = mm.pageX;
                var mm_mouseY = mm.pageY;
                $temp.css({
                    "top": mm_mouseY - half_box_height + "px",
                    "left": mm_mouseX - half_box_width + "px"
                });

                /*鼠标在target范围之内*/
                if (mm_mouseX > tar_pos.left &&
                    mm_mouseX < tar_pos.left + $target.width() &&
                    mm_mouseY > tar_pos.top &&
                    mm_mouseY < tar_pos.top + $target.height()) {
                    $target_subType.css({
                        "border-top": "none",
                        "border-bottom": "none"
                    });
                    tops = $.grep($target_subType, function(e) {
                        return ($(e).position().top - mm_mouseY + half_box_height > 0 && $(e).attr("id") !== "target");
                    });
                    if (tops.length > 0) {
                        /*识别位置在上半部分*/
                        console.log("tops.length = " + tops.length);
                        $(tops[0]).css("border-top", "5px solid #1ABC9C");
                    } else {
                        if ($target_subType.length > 0) {
                            /*识别位置在下半部分*/
                            console.log("$target_subType.length = " + $target_subType.length);
                            $($target_subType[$target_subType.length - 1]).css("border-bottom", "5px solid #1ABC9C");
                        }
                        else{
                          $("#emptyBox").css({
                              "border-top": "5px solid #1ABC9C",
                              "border-bottom": "none"
                          });
                        }
                    }
                } else {
                    $target_subType.css({
                        "border-top": "none",
                        "border-bottom": "none"
                    });
                }
            });

            /*松开鼠标触发事件*/
            $("body").delegate(".subject", "mouseup", function(mu) {
                mu.preventDefault();

                var mu_mouseX = mu.pageX;
                var mu_mouseY = mu.pageY;
                var tar_pos = $target.position();

                $("#target .subject").css({
                    "border-top": "none",
                    "border-bottom": "none"
                });

                /*鼠标是否进入target范围*/
                if (mu_mouseX > tar_pos.left &&
                    mu_mouseX < tar_pos.left + $target.width() &&
                    mu_mouseY > tar_pos.top &&
                    mu_mouseY < tar_pos.top + $target.height()
                ) {
                    $temp.attr("style", null);
                    // where to add
                    console.log("top.length = "+tops.length);
                    if (tops.length > 0) {
                        $($temp.html()).insertBefore(tops[0]);
                    } else {
                        $("#target").append($temp.html());
                        $("#emptyBox").remove();
                    }
                } else {
                    $("#target .subject").css({
                        "border-top": "none",
                        "border-bottom": "none"
                    });
                    tops = [];
                }

                $(document).undelegate("body", "mousemove");
                $("body").undelegate(".subject", "mouseup");
                $("#target .subType").popover({
                    trigger: "manual"
                });
                $temp.remove();
                LPB.genSource();
            });
        }, delays[type]);


        $(document).mouseup(function() {
            console.log("$(document).mouseup");
            clearInterval(delayed);
            return false;
        });
        $(this).mouseout(function() {
            console.log("$(this).mouseout");
            clearInterval(delayed);
            return false;
        });
    });
});

function getSubjectNum() {
    var oDiv = document.getElementsByClassName("subject");
    console.log(oDiv.length);
    for (var i = 0; i < oDiv.length; i++) {
        (function(i) {
            oDiv[i].attr('id', 'subject_' + i);
            oDiv[i]
            // oDiv[i].onclick = function() {
            //     alert(i);
            // }
        })(i)
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

function setEmptyBox() {
    /*如果设计器中一道题也没有 放置空盒*/
}

function getQuestionnairesData() {
    restfulUtil.getQuestionnairesData(GlobalData, "383FBE73B8F84999F93E5ECC6C45D42A", function(res) {
        console.log(JSON.stringify(res));
    });
}

const radioDiv = `
<div class="radioDiv subject">
    <div class="leftSetup">
        <h4>Q</h4>
        <img id="up" src="./images/main_01_up_off.png" alt="" onMouseOut="MM_swapImgRestore()" onMouseOver="MM_swapImage('up','','./images/main_01_up_on.png',1)">
        <img id="down" src="./images/main_02_down_off.png" alt="">
        <img id="copy" src="./images/main_06_more_off.png" alt="">
        <img id="delete" src="./images/main_03_garbage_off.png" alt="">
    </div>
    <div class="radioSubject">
        <div class="radioStemText textBox" id="radioStemTextID">单选题</div>
        <ul class="radioItem">
            <li>
                <input type="radio" name="radio1" id="Num1" />
                <label class="textBox radioItemText">选项1</label>
            </li>
            <li>
                <input type="radio" name="radio1" id="Num2" />
                <label class="textBox radioItemText">选项2</label>
            </li>
        </ul>
        <img id="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;
