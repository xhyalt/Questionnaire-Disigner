$(document).ready(function() {

    /*题型鼠标点击事件*/
    $(".menuItemBox").on("click", ".subType, .unSubject", function(md) {
        md.preventDefault();

        $this = $(this);
        var type = getType($this);

        $("#emptyBox").remove();
        $("#target").append(subjectDiv[type]);
        var current = $("#target").children(".subject, .unSubject").last();
        setOrder();
        addSubjectJson(current, type);

        $(document).off("mousemove", "body");
        $("body").off("mouseup", ".subject, .unSubject");
    });

    /*题型鼠标落下事件*/
    $(".menuItemBox").on("mousedown", ".subType", function(md) {
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
        var type = getType($this);

        var delayed = setTimeout(function() {

            /*判断盒子类型*/
            $temp = $(`<div class="cloth"></div>`).append(subjectDiv[type]);

            $("body").append($temp);

            $temp.css({
                "position": "absolute",
                "top": mouseY - ($temp.height() / 2) + "px",
                "left": mouseX - ($temp.width() / 2) + "px",
                "opacity": "0.9"
            }).hide();

            var half_box_height = ($temp.height() / 2);
            var half_box_width = ($temp.width() / 2);
            var $target = $("#target");
            var tar_pos = $target.position();
            var $target_subType = $("#target .subject, #target .unSubject");
            var $mergeTarget_subType = $(".mergeDiv .mergeStemText, .mergeDiv .mergeDescriptionText");

            /*题型 鼠标移动触发事件*/
            $(document).on("mousemove", "body", function(mm) {

                $temp.show();
                var mm_mouseX = mm.pageX;
                var mm_mouseY = mm.pageY;

                /*将盒子位置与鼠标位置关联*/
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
                    tops = $.grep($target_subType.not(".mergeDiv"), function(e) {
                        return (mm_mouseY - $(e).position().top < $(e).height() / 2 && mm_mouseY - $(e).position().top > 0 && $(e).attr("id") !== "target");
                    });
                    bottoms = $.grep($target_subType.not(".mergeDiv"), function(e) {
                        return (mm_mouseY - $(e).position().top < 2 * $(e).height() / 2 && mm_mouseY - $(e).position().top > $(e).height() / 2 && $(e).attr("id") !== "target");
                    });
                    mergesTop = $.grep($mergeTarget_subType, function(e) {
                        return (mm_mouseY - $(e).position().top < $(e).height() && mm_mouseY - $(e).position().top > 0 && $(e).attr("id") !== "target");
                    });
                    // console.log("tops = " + tops);
                    if (tops.length > 0) {
                        /*识别位置在上半部分*/
                        $(tops[0]).css("border-top", "5px solid #1ABC9C");
                    } else if (bottoms.length > 0) {
                        /*识别位置在下半部分*/
                        $(bottoms[0]).css("border-bottom", "5px solid #1ABC9C");
                    } else if (mergesTop.length > 0) {
                        $(mergesTop[0]).parent().parent().css("border-top", "5px solid #1ABC9C");
                    } else {
                        /*设计区没有题目 空盒上加边界*/
                        if ($("#emptyBox").length != 0) {
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

            /*在middle松开鼠标触发事件*/
            $("body").on("mouseup", ".subject, .unSubject", function(mu) {
                mu.preventDefault();

                var mu_mouseX = mu.pageX;
                var mu_mouseY = mu.pageY;
                var tar_pos = $target.position();

                $("#target .subject, #target .unSubject").css({
                    "border-top": "none",
                    "border-bottom": "none"
                });

                /*鼠标是否进入target范围*/
                if (mu_mouseX > tar_pos.left &&
                    mu_mouseX < tar_pos.left + $target.width() &&
                    mu_mouseY > tar_pos.top &&
                    mu_mouseY < tar_pos.top + $target.height()
                ) {
                    console.log("进入target范围");
                    $temp.attr("style", null);

                    if (tops.length > 0) {
                        level = tops[0].attributes["level"].nodeValue;
                        father = tops[0].attributes["father"].nodeValue;
                        $temp.html($($temp.html()).attr("level", level));
                        $temp.html($($temp.html()).attr("father", father));
                        var current = $($temp.html()).insertBefore(tops[0]);

                        setOrder();
                        addSubjectJson(current, type);

                    } else if (bottoms.length > 0) {
                        level = bottoms[0].attributes["level"].nodeValue;
                        father = bottoms[0].attributes["father"].nodeValue;
                        $temp.html($($temp.html()).attr("level", level));
                        $temp.html($($temp.html()).attr("father", father));
                        var current = $($temp.html()).insertAfter(bottoms[0]);

                        setOrder();
                        addSubjectJson(current, type);

                    } else if (mergesTop.length > 0) {
                        level = $(mergesTop[0]).parent().parent().attr["level"];
                        father = $(mergesTop[0]).parent().parent().attr["father"];
                        $temp.html($($temp.html()).attr("level", level));
                        $temp.html($($temp.html()).attr("father", father));
                        var current = $($temp.html()).insertBefore($(mergesTop[0]).parent().parent());

                        setOrder();
                        addSubjectJson(current[0], type);
                    } else {
                        $("#target").append($temp.html());
                        setOrder();
                        $("#emptyBox").remove();
                        addSubjectJson($("#target").children(".subject, .unSubject"), type);
                    }
                } else {
                    $("#target .subject, #target .unSubject").css({
                        "border-top": "none",
                        "border-bottom": "none"
                    });
                    tops = [];
                    bottoms = [];
                    mergesTop = [];
                }

                $(document).off("mousemove", "body");
                $("body").off("mouseup", ".subject, .unSubject");
                $temp.remove();
            });
        }, delays[type]);

        $(document).mouseup(function() {
            $(".cloth").remove();
            clearInterval(delayed);
            return false;
        });
        $(this).mouseout(function() {
            clearInterval(delayed);
            return false;
        });
    });
});

/**
 * 添加connection属性 与题目JSON对象配对
 * @param {[type]} current [description]
 * @param {[type]} type    [description]
 */
function addSubjectJson(current, type) {
    if (type == "radio") {
        subject[(++subjectTotal).toString()] = {
            forced: false,
            questionNo: true,
            showDescription: true,
            sameLine: 0,
            showEveryLine: 1
        };
        current.attr("connection", subjectTotal);
    } else if (type == "multiple") {
        subject[(++subjectTotal).toString()] = {
            forced: false,
            questionNo: true,
            showDescription: true,
            minSelectItem: 0,
            maxSelectItem: 0,
            sameLine: 0,
            showEveryLine: 1
        };
        current.attr("connection", subjectTotal);
    } else if (type == "multitermCompletion") {
        subject[(++subjectTotal).toString()] = {
            forced: false,
            questionNo: true,
            showDescription: true
        };
        current.attr("connection", subjectTotal);
    } else if (type == "Completion") {
        subject[(++subjectTotal).toString()] = {
            forced: false,
            questionNo: true,
            showDescription: true
        };
        current.attr("connection", subjectTotal);
    } else if (type == "shortAnswer") {
        subject[(++subjectTotal).toString()] = {
            forced: false,
            questionNo: true,
            showDescription: true,
            showLine: 5,
            minLength: 0,
            maxLength: 1000
        };
        current.attr("connection", subjectTotal);
    } else if (type == "sort") {
        subject[(++subjectTotal).toString()] = {
            forced: false,
            questionNo: true,
            showDescription: true
        };
        current.attr("connection", subjectTotal);
    } else {
        subject[(++subjectTotal).toString()] = {};
        current.attr("connection", subjectTotal);
    }
}

/**
 * 每次修改target时重置题目的题号
 * @public
 */
function setOrder() {
    var index = 1;
    var flag = 1;
    var $td = $("#target .subject");
    var $prevTd;
    for (var i = 0; i < $td.length; i++) {
        /*其它题型正常设置题号*/
        if (flag) {
            /*第一题，只走一遍*/
            console.log("老子是第一节点");
            $td.eq(i).attr("num", "1");
            var level = parseInt($td.eq(i).attr("level"));
            flag = 0;
            $td.eq(i).find("h4").html(quesNoFirst[quesNoArr[level - 1]]);
        } else {
            /*非第一题*/
            var $prevTd = $td.eq(i - 1);

            if ($td.eq(i).attr("father") == $prevTd.attr("father") && $td.eq(i).attr("level") == $prevTd.attr("level")) {
                /*非第一个 同胞节点 前节点存在 父节点相同 层数相同*/
                console.log("非第一个同胞节点");
                $td.eq(i).attr("num", parseInt($prevTd.attr("num")) + 1);
                var level = parseInt($td.eq(i).attr("level"));
                switch (quesNoArr[level - 1]) {
                    case 0:
                        $td.eq(i).find("h4").html(intToChinese($td.eq(i).attr("num")));
                        break;
                    case 1:
                        $td.eq(i).find("h4").html("(" + intToChinese($td.eq(i).attr("num")) + ")");
                        break;
                    case 2:
                        $td.eq(i).find("h4").html($td.eq(i).attr("num") + ".");
                        break;
                    case 3:
                        $td.eq(i).find("h4").html($td.eq(i).attr("num") + ")");
                        break;
                    case 4:
                        $td.eq(i).find("h4").html("Q" + $td.eq(i).attr("num"));
                        break;
                }
            } else if ($td.eq(i).attr("father") - 1 == $prevTd.attr("father") && $td.eq(i).attr("level") - 1 == $prevTd.attr("level")) {
                /*该组第一个节点*/
                console.log("该层第一个节点");
                $td.eq(i).attr("num", "1");
                var level = parseInt($td.eq(i).attr("level"));
                $td.eq(i).find("h4").html(quesNoFirst[quesNoArr[level - 1]]);
            } else if (parseInt($td.eq(i).attr("father")) < parseInt($prevTd.attr("father")) && parseInt($td.eq(i).attr("level")) < parseInt($prevTd.attr("level"))) {
                /*非第一个节点 同层上一题为合并节点*/
                console.log("非第一个节点 同层上一题为合并节点");
                $td.eq(i).attr("num", parseInt($td.eq(i).prev().attr("num")) + 1);
                var level = parseInt($td.eq(i).attr("level"));
                switch (quesNoArr[level - 1]) {
                    case 0:
                        $td.eq(i).find("h4").html(intToChinese($td.eq(i).attr("num")));
                        break;
                    case 1:
                        $td.eq(i).find("h4").html("(" + intToChinese($td.eq(i).attr("num")) + ")");
                        break;
                    case 2:
                        $td.eq(i).find("h4").html($td.eq(i).attr("num") + ".");
                        break;
                    case 3:
                        $td.eq(i).find("h4").html($td.eq(i).attr("num") + ")");
                        break;
                    case 4:
                        $td.eq(i).find("h4").html("Q" + $td.eq(i).attr("num"));
                        break;
                }
            } else {
                console.log("这是漏掉的题目");
            }
        }
    }

    $td = $("#target .unSubject");
    for (var i = 0; i < $td.length; i++) {
        $td.children(".leftSetup").children("h4").empty();
    }
}

/**
 * 输入阿拉伯数字输出汉字的函数
 * @public
 * @param  str [阿拉伯数字字符串]
 * @return [汉字字符串]
 */
function intToChinese(str) {
    str = str + '';
    var len = str.length - 1;
    var idxs = ['', '十', '百', '千', '万', '十', '百', '千', '亿', '十', '百', '千', '万', '十', '百', '千', '亿'];
    var num = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return str.replace(/([1-9]|0+)/g, function($, $1, idx, full) {
        var pos = 0;
        if ($1[0] != '0') {
            pos = len - idx;
            if (idx == 0 && $1[0] == 1 && idxs[len - idx] == '十') {
                return idxs[len - idx];
            }
            return num[$1[0]] + idxs[len - idx];
        } else {
            var left = len - idx;
            var right = len - idx + $1.length;
            if (Math.floor(right / 4) - Math.floor(left / 4) > 0) {
                pos = left - left % 4;
            }
            if (pos) {
                return idxs[pos] + num[$1[0]];
            } else if (idx + $1.length >= len) {
                return '';
            } else {
                return num[$1[0]];
            }
        }
    });
}

/**
 * 获取所有题目的数量 包括合并题型
 * @public
 * @return [题目数量]
 */
function getSubjectNum() {
    $td = $(".subject, .unSubject");
    return $td.length;
}

/**
 * 获取与某题目同等级同父亲的题目数量
 * @public
 * @param  $tdP [某题目]
 * @return [符合条件的题目数量]
 */
function getLevelSubjectNum($td) {
    var index = 0;
    var father = $td.attr("father");
    var level = $td.attr("level");
    $tdTemp = $('div').filter(`[level=${level}]`).filter(`[father=${father}]`);
    console.log($tdTemp.length);
    return $tdTemp.length;
}

var subjectDiv = {};
var descriptionDiv = {};
var itemLabelDiv = {};
var menuPopDiv = {};

const emptyBox = `
<div id="emptyBox">
    可单击或拖拽左侧题型，以添加题目到此处区域
</div>`;

subjectDiv["radio"] = `
<div class="radioDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="radioMain subjectMain">
        <div class="radioStemText textBox stemText" id="radioStemTextID" placeholder="单选题"></div>
        <div class="radioDescriptionText textBox descriptionText" placeholder="单选题描述"></div>
        <ul class="radioItem itemBox">
            <li>
                <input type="radio" name="radio1"/>
                <div class="initials">A.</div>
                <div class="textBox radioItemText ItemText" placeholder="选项1"></div>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
            <li>
                <input type="radio" name="radio1" />
                <div class="initials">B.</div>
                <label class="textBox radioItemText ItemText" placeholder="选项2"></label>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

descriptionDiv["radio"] = `
<div class="radioDescriptionText textBox descriptionText" placeholder="单选题描述"></div>`;

itemLabelDiv["radio"] = `
<li>
    <input type="radio" name="radio1"/>
    <div class="initials">A.</div>
    <div class="textBox radioItemText ItemText" placeholder="选项1"></div>
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="clear"></div>
</li>`;

subjectDiv["multiple"] = `
<div class="multipleDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="multipleMain subjectMain">
        <div class="multipleStemText textBox stemText" id="multipleStemTextID" placeholder="多选题"></div>
        <div class="multipleDescriptionText textBox descriptionText" placeholder="多选题描述"></div>
        <ul class="multipleItem itemBox">
            <li>
                <input type="checkbox" name="checkbox1" />
                <div class="initials">A.</div>
                <div class="textBox multipleItemText ItemText" placeholder="选项1"></div>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
            <li>
                <input type="checkbox" name="checkbox1"/>
                <div class="initials">B.</div>
                <div class="textBox multipleItemText ItemText" placeholder="选项2"></div>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

descriptionDiv["multiple"] = `
<div class="multipleDescriptionText textBox descriptionText" placeholder="多选题描述"></div>`;

itemLabelDiv["multiple"] = `
<li>
    <input type="checkbox" name="checkbox1"/>
    <div class="initials">B.</div>
    <div class="textBox multipleItemText ItemText" placeholder="选项2"></div>
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="clear"></div>
</li>`;

subjectDiv["completion"] = `
<div class="completionDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="completionMain subjectMain">
        <div class="completionStemText textBox stemText" id="completionStemTextID" placeholder="填空题"></div>
        <div class="completionDescriptionText textBox descriptionText" placeholder="填空题描述"></div>
        <ul class="completionItem itemBox">
            <li>
                <input type="text" name="completion1" id="Num1" />
            </li>
        </ul>
    </div>
</div>`;

descriptionDiv["completion"] = `
<div class="completionDescriptionText textBox descriptionText" placeholder="填空题描述"></div>`;

subjectDiv["multitermCompletion"] = `
<div class="multitermCompletionDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="multitermCompletionMain subjectMain">
        <div class="multitermCompletionStemText textBox stemText" id="multitermCompletionStemTextID" placeholder="多项填空题"></div>
        <div class="multitermCompletionDescriptionText textBox descriptionText" placeholder="多项填空题描述"></div>
        <ul class="multitermCompletionItem itemBox">
            <li>
              <label class="textBox multitermCompletionItemText ItemText" placeholder="选项1"></label>
              <input type="text" name="multitermCompletion1" id="Num1" />
              <div class="itemMenu">
                  <img class="up" src="./images/main_01_up_off.png" alt="">
                  <img class="down" src="./images/main_02_down_off.png" alt="">
                  <img class="delete" src="./images/main_03_delete_off.png" alt="">
              </div>
            </li>
            <li>
              <label class="textBox multitermCompletionItemText ItemText" placeholder="选项2"></label>
              <input type="text" name="multitermCompletion1" id="Num2" />
              <div class="itemMenu">
                  <img class="up" src="./images/main_01_up_off.png" alt="">
                  <img class="down" src="./images/main_02_down_off.png" alt="">
                  <img class="delete" src="./images/main_03_delete_off.png" alt="">
              </div>
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

descriptionDiv["multitermCompletion"] = `
<div class="multitermCompletionDescriptionText textBox descriptionText" placeholder="多项填空题描述"></div>`;

itemLabelDiv["multitermCompletion"] = `
<li>
    <label class="textBox multitermCompletionItemText ItemText" placeholder="选项"></label>
    <input type="text" name="multitermCompletion1" id="Num2" />
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
</li>`;

subjectDiv["shortAnswer"] = `
<div class="shortAnswerDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="shortAnswerMain subjectMain">
        <div class="shortAnswerStemText textBox stemText" id="shortAnswerStemTextID" placeholder="简答题"></div>
        <div class="shortAnswerDescriptionText textBox descriptionText" placeholder="简答题描述"></div>
        <ul class="shortAnswerItem itemBox">
            <li>
                <textarea rows="5"></textarea>
            </li>
        </ul>
    </div>
</div>`;

descriptionDiv["shortAnswer"] = `
<div class="shortAnswerDescriptionText textBox descriptionText" placeholder="简答题描述"></div>`;

subjectDiv["sort"] = `
<div class="sortDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="sortMain subjectMain">
        <div class="sortStemText textBox stemText" id="sortStemTextID" placeholder="排序题"></div>
        <div class="sortDescriptionText textBox descriptionText" placeholder="排序题描述"></div>
        <ul class="sortItem itemBox">
            <li>
                <label class="initials">A.</label>
                <label class="textBox sortItemText ItemText" placeholder="选项1"></label>
                <input type="text" name="sort1" id="Num1" />
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
            </li>
            <li>
                <label class="initials">B.</label>
                <label class="textBox sortItemText ItemText" placeholder="选项2"></label>
                <input type="text" name="sort1" id="Num2" />
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

descriptionDiv["sort"] = `
<div class="sortDescriptionText textBox descriptionText" placeholder="排序题描述"></div>`;

itemLabelDiv["sort"] = `
<li>
    <label class="initials"></label>
    <label class="textBox sortItemText ItemText" placeholder="选项"></label>
    <input type="text" name="sort1" id="Num2" />
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
</li>`;

subjectDiv["description"] = `
<div class="descriptionDiv unSubject" level="1" father="0" num="">
    <div class="leftSetup">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="descriptionMain subjectMain">
        <div class="descriptionStemText textBox stemText" id="descriptionStemTextID" placeholder="描述说明"></div>
    </div>
</div>`;

subjectDiv["dividingLine"] = `
<div class="dividingLineDiv unSubject" level="1" father="0" num="">
    <div class="leftSetup">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="dividingLineMain subjectMain">
        <hr width="650" color="#f3f3f3" noshade="noshade" align="left" border="none"/>
    </div>
</div>`;

subjectDiv["merge"] = `
<div class="mergeDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="mergeMain">
        <div class="mergeStemText textBox stemText" id="sortStemTextID" placeholder="合并题"></div>
        <ul class="mergeItem itemBox">
        </ul>
    </div>
</div>`;

descriptionDiv["merge"] = `
<div class="mergeDescriptionText textBox descriptionText" placeholder="合并题描述"></div>`;

const itemMenuDiv = `
<div class="itemMenu">
    <img class="up" src="./images/main_01_up_off.png" alt="">
    <img class="down" src="./images/main_02_down_off.png" alt="">
    <img class="delete" src="./images/main_03_delete_off.png" alt="">
</div>`;

const trianglePop = `
<div class="trianglePop"></div>`;

menuPopDiv["radio"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="showForced(checked)"/>
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)"/>
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
            </ul>
        </div>
        <div class="detail">
            <div class="title">选项显示模式</div>
            <ul>
                <li>
                    <input class="sameLine" type="radio" name="setSameLine" onchange="sameLine(checked)"/>
                    <label>与题目同行</label>
                </li>
                <li>
                    <input class="sameLine2" type="radio" name="setSameLine" checked="true" onchange="sameLine2(checked)" />
                    <label>每行显示</label>
                    <input class="showEveryLine" type="number" value="1" defaultValue="1" placeholder="1" min="1" onchange="setShowEveryLine(value)"/>
                    <label>个</label>
                </li>
            </ul>
        </div>
    </div>
</div>`;

menuPopDiv["multiple"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="showForced(checked)"/>
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)" />
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
                <li>
                    <label>最少选择项数</label>
                    <input class="minSelectItem" type="number" value="0" defaultValue="0" placeholder="0" min="0" />
                    <label>个</label>
                </li>
                <li>
                    <label>最多选择项数</label>
                    <input class="maxSelectItem" type="number" value="0" defaultValue="0" placeholder="0" min="0" />
                    <label>个</label>
                </li>
            </ul>
        </div>
        <div class="detail">
            <div class="title">选项显示模式</div>
            <ul>
                <li>
                    <input class="sameLine" type="radio" />
                    <label>与题目同行</label>
                </li>
                <li>
                    <input class="sameLine2" type="radio" checked="true" />
                    <label>每行显示</label>
                    <input class="showEveryLine" type="number" value="1" defaultValue="1" placeholder="1" min="1" />
                    <label>个</label>
                </li>
            </ul>
        </div>
    </div>
</div>`;

menuPopDiv["completion"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="showForced(checked)"/>
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)"/>
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
            </ul>
        </div>
    </div>
</div>`;

menuPopDiv["multitermCompletion"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="showForced(checked)" />
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)" />
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
            </ul>
        </div>
    </div>
</div>`;

menuPopDiv["shortAnswer"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="show" />
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)" />
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
            </ul>
        </div>
        <div class="detail">
            <div class="title">答题区</div>
            <ul>
                <li>
                    <label>显示行数</label>
                    <input class="showLine" type="number" value="5" defaultValue="5" placeholder="5" min="1" onchange="setLine(value)"/>
                </li>
                <li>
                    <label>最少字数</label>
                    <input class="minLength" type="number" value="0" placeholder="0" min="0" onchange="setMinLength(value)"/>
                </li>
                <li>
                    <label>最多字数</label>
                    <input class="maxLength" type="number" value="1000" placeholder="1000" min="0" onchange="setMaxLength(value)"/>
                </li>
            </ul>
        </div>
    </div>
</div>`;

menuPopDiv["sort"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="showForced(checked)"/>
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)" />
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
            </ul>
        </div>
    </div>
</div>`;
