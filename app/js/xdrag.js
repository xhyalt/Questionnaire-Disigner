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
});

$(document).ready(function() {

    /*题型鼠标点击事件*/
    $(".menuItemBox").delegate(".subType, .unSubject", "click", function(md) {
        md.preventDefault();

        $this = $(this);
        var type = getSubjectType($this);

        $("#emptyBox").remove();
        if (type == "radio") {
            $("#target").append(radioDiv);
        } else if (type == "multiple") {
            $("#target").append(multipleDiv);
        } else if (type == "completion") {
            $("#target").append(completionDiv);
        } else if (type == "multitermCompletion") {
            $("#target").append(multitermCompletionDiv);
        } else if (type == "shortAnswer") {
            $("#target").append(shortAnswerDiv);
        } else if (type == "sort") {
            $("#target").append(sortDiv);
        } else if (type == "description") {
            $("#target").append(descriptionDiv);
        } else if (type == "dividingLine") {
            $("#target").append(dividingLineDiv);
        }

        setOrder();

        $("#target .subject, #target .unSubject").css({
            "border-top": "none",
            "border-bottom": "none"
        });

        tops = [];
        $(document).undelegate("body", "mousemove");
        $("body").undelegate(".subject, .unSubject", "mouseup");
        $("#target .subType").popover({
            trigger: "manual"
        });
    });

    /*题型鼠标落下事件*/
    $(".menuItemBox").delegate(".subType", "mousedown", function(md) {
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
        var type = getSubjectType($this);

        var delayed = setTimeout(function() {

            /*判断盒子类型*/
            if (type == "radio") {
                $temp = $(`<div class="cloth"></div>`).append(radioDiv);
            } else if (type == "multiple") {
                $temp = $(`<div class="cloth"></div>`).append(multipleDiv);
            } else if (type == "completion") {
                $temp = $(`<div class="cloth"></div>`).append(completionDiv);
            } else if (type == "multitermCompletion") {
                $temp = $(`<div class="cloth"></div>`).append(multitermCompletionDiv);
            } else if (type == "shortAnswer") {
                $temp = $(`<div class="cloth"></div>`).append(shortAnswerDiv);
            } else if (type == "sort") {
                $temp = $(`<div class="cloth"></div>`).append(sortDiv);
            } else if (type == "description") {
                $temp = $(`<div class="cloth"></div>`).append(descriptionDiv);
            } else if (type == "dividingLine") {
                $temp = $(`<div class="cloth"></div>`).append(dividingLineDiv);
            }

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

            /*题型 鼠标移动触发事件*/
            $(document).delegate("body", "mousemove", function(mm) {

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
                    tops = $.grep($target_subType, function(e) {
                        return (mm_mouseY - $(e).position().top < $(e).height() / 2 && mm_mouseY - $(e).position().top > 0 && $(e).attr("id") !== "target");
                    });
                    bottoms = $.grep($target_subType, function(e) {
                        return (mm_mouseY - $(e).position().top < 2 * $(e).height() / 2 && mm_mouseY - $(e).position().top > $(e).height() / 2 && $(e).attr("id") !== "target");
                    });
                    // console.log("tops = " + tops);
                    if (tops.length > 0) {
                        /*识别位置在上半部分*/
                        $(tops[0]).css("border-top", "5px solid #1ABC9C");
                    } else if (bottoms.length > 0) {
                        /*识别位置在下半部分*/
                        $(bottoms[0]).css("border-bottom", "5px solid #1ABC9C");
                    } else {
                        /*设计区没有题目 空盒上加边界*/
                        $("#emptyBox").css({
                            "border-top": "5px solid #1ABC9C",
                            "border-bottom": "none"
                        });
                    }
                } else {
                    $target_subType.css({
                        "border-top": "none",
                        "border-bottom": "none"
                    });
                }
            });

            /*在middle松开鼠标触发事件*/
            $("body").delegate(".subject, .unSubject", "mouseup", function(mu) {
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
                        console.log("===tops===");
                        level = tops[0].attributes["level"].nodeValue
                        father = tops[0].attributes["father"].nodeValue
                        $temp.html($($temp.html()).attr("level", level));
                        $temp.html($($temp.html()).attr("father", father));
                        console.log($temp.html());
                        $($temp.html()).insertBefore(tops[0]);
                        setOrder();
                    } else if (bottoms.length > 0) {
                        console.log("===bottoms===");
                        level = bottoms[0].attributes["level"].nodeValue
                        father = bottoms[0].attributes["father"].nodeValue
                        $temp.html($($temp.html()).attr("level", level));
                        $temp.html($($temp.html()).attr("father", father));
                        console.log($temp.html());
                        $($temp.html()).insertAfter(bottoms[0]);
                        setOrder();
                    } else {
                        $("#target").append($temp.html());
                        setOrder();
                        $("#emptyBox").remove();
                    }
                } else {
                    $("#target .subject, #target .unSubject").css({
                        "border-top": "none",
                        "border-bottom": "none"
                    });
                    tops = [];
                }

                $(document).undelegate("body", "mousemove");
                $("body").undelegate(".subject, .unSubject", "mouseup");
                $("#target .subType").popover({
                    trigger: "manual"
                });
                $temp.remove();
                LPB.genSource();
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
            switch (quesNoArr[level - 1]) {
                case 0:
                    $td.eq(i).find("h4").html("一、");
                    break;
                case 1:
                    $td.eq(i).find("h4").html("(一)");
                    break;
                case 2:
                    $td.eq(i).find("h4").html("1.");
                    break;
                case 3:
                    $td.eq(i).find("h4").html("1)");
                    break;
                case 4:
                    $td.eq(i).find("h4").html("Q1");
                    break;
            }
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
                switch (quesNoArr[level - 1]) {
                    case 0:
                        $td.eq(i).find("h4").html("一、");
                        break;
                    case 1:
                        $td.eq(i).find("h4").html("(一)");
                        break;
                    case 2:
                        $td.eq(i).find("h4").html("1.");
                        break;
                    case 3:
                        $td.eq(i).find("h4").html("1)");
                        break;
                    case 4:
                        $td.eq(i).find("h4").html("Q1");
                        break;
                }
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

/**
 * 拖拽或点击时 获取题目类型
 * @public
 * @param  $this [当前拖拽的题型html题型]
 * @return type  [判断出该html段的题型]
 */
function getSubjectType($this) {
    var type;
    if ($this.attr("id") === "MenuItemRadio") {
        type = "radio";
    } else if ($this.attr("id") === "MenuItemMultiple") {
        type = "multiple";
    } else if ($this.attr("id") === "MenuItemCompletion") {
        type = "completion";
    } else if ($this.attr("id") === "MenuItemMultitermCompletion") {
        type = "multitermCompletion";
    } else if ($this.attr("id") === "MenuItemShortAnswer") {
        type = "shortAnswer";
    } else if ($this.attr("id") === "MenuItemSort") {
        type = "sort";
    } else if ($this.attr("id") === "MenuItemDescription") {
        type = "description";
    } else if ($this.attr("id") === "MenuItemDividingLine") {
        type = "dividingLine";
    }
    return type;
}

const emptyBox = `
<div id="emptyBox">
    可单击或拖拽左侧题型，以添加题目到此处区域
</div>`;

const radioDiv = `
<div class="radioDiv subject" level="1" father="0">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="radioMain">
        <div class="radioStemText textBox stemText" id="radioStemTextID" placeholder="单选题"></div>
        <div class="radioDescriptionText textBox descriptionText" placeholder="单选题描述"></div>
        <ul class="radioItem optionItem">
            <li>
                <input type="radio" name="radio1" id="Num1" />
                <label class="textBox radioItemText ItemText" placeholder="选项1"></label>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
            </li>
            <li>
                <input type="radio" name="radio1" id="Num2" />
                <label class="textBox radioItemText ItemText" placeholder="选项2"></label>
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

const radioItemLabel = `
<li>
    <input type="radio" name="radio1" id="Num1" />
    <label class="textBox radioItemText ItemText" placeholder="选项1"></label>
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
</li>`;

const multipleDiv = `
<div class="multipleDiv subject"  level="1" father="0">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="multipleMain">
        <div class="multipleStemText textBox stemText" id="multipleStemTextID" placeholder="多选题"></div>
        <div class="multipleDescriptionText textBox descriptionText" placeholder="多选题描述"></div>
        <ul class="multipleItem optionItem">
            <li>
                <input type="checkbox" name="checkbox1" id="Num1" />
                <label class="textBox multipleItemText ItemText" placeholder="选项1"></label>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
            </li>
            <li>
                <input type="checkbox" name="checkbox1" id="Num2" />
                <label class="textBox multipleItemText ItemText" placeholder="选项2"></label>
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

const multipleItemLabel = `
<li>
    <input type="checkbox" name="checkbox1" id="Num2" />
    <label class="textBox multipleItemText ItemText" placeholder="选项"></label>
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
</li>`;

const completionDiv = `
<div class="completionDiv subject" level="1" father="0">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="completionMain">
        <div class="completionStemText textBox stemText" id="completionStemTextID" placeholder="填空题"></div>
        <div class="completionDescriptionText textBox descriptionText" placeholder="填空题描述"></div>
        <ul class="completionItem">
            <li>
                <input type="text" name="completion1" id="Num1" />
            </li>
        </ul>
    </div>
</div>`;

const multitermCompletionDiv = `
<div class="multitermCompletionDiv subject" level="1" father="0">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="multitermCompletionMain">
        <div class="multitermCompletionStemText textBox stemText" id="multitermCompletionStemTextID" placeholder="多项填空题"></div>
        <div class="multitermCompletionDescriptionText textBox descriptionText" placeholder="多项填空题描述"></div>
        <ul class="multitermCompletionItem  optionItem">
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

const multitermCompletionItemLabel = `
<li>
    <label class="textBox multitermCompletionItemText ItemText" placeholder="选项"></label>
    <input type="text" name="multitermCompletion1" id="Num2" />
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
</li>`;

const shortAnswerDiv = `
<div class="shortAnswerDiv subject" level="1" father="0">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="shortAnswerMain">
        <div class="shortAnswerStemText textBox stemText" id="shortAnswerStemTextID" placeholder="简答题"></div>
        <div class="shortAnswerDescriptionText textBox descriptionText" placeholder="简答题描述"></div>
        <ul class="shortAnswerItem">
            <li>
                <textarea name="shortAnswer1" id="Num1" ></textarea>
            </li>
        </ul>
    </div>
</div>`;

const sortDiv = `
<div class="sortDiv subject" level="1" father="0">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="sortMain">
        <div class="sortStemText textBox stemText" id="sortStemTextID" placeholder="排序题"></div>
        <div class="sortDescriptionText textBox descriptionText" placeholder="排序题描述"></div>
        <ul class="sortItem optionItem">
            <li>
                <label class="textBox sortItemText ItemText" placeholder="选项1"></label>
                <input type="text" name="sort1" id="Num1" />
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
            </li>
            <li>
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

const sortItemLabel = `
<li>
    <label class="textBox sortItemText ItemText" placeholder="选项"></label>
    <input type="text" name="sort1" id="Num2" />
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
</li>`;

const descriptionDiv = `
<div class="descriptionDiv unSubject" level="1" father="0">
    <div class="leftSetup">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="descriptionMain">
        <div class="descriptionStemText textBox stemText" id="descriptionStemTextID" placeholder="描述说明"></div>
    </div>
</div>`;

const dividingLineDiv = `
<div class="dividingLineDiv unSubject" level="1" father="0">
    <div class="leftSetup">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="dividingLineMain">
        <hr width="650" color="#f3f3f3" noshade="noshade" align="left" border="none"/>
    </div>
</div>`;

const mergeDiv = `
<div class="mergeDiv subject" level="1" father="0">
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
        <div class="mergeDescriptionText textBox descriptionText" placeholder="合并题描述"></div>
        <ul class="mergeItem  optionItem">
        </ul>
    </div>
</div>`;

const itemMenuDiv = `
<div class="itemMenu">
    <img class="up" src="./images/main_01_up_off.png" alt="">
    <img class="down" src="./images/main_02_down_off.png" alt="">
    <img class="delete" src="./images/main_03_delete_off.png" alt="">
</div>`;
