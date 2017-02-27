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
    $(".menuItemBox").delegate(".subType", "click", function(md) {
        md.preventDefault();

        $this = $(this);
        var type;
        if ($this.attr("id") === "MenuItemRadio") {
            type = "radio";
        } else if ($this.attr("id") === "MenuItemMultiple") {
            type = "multiple";
        } else if ($this.attr("id") === "MenuItemCompletion") {
            type = "completion";
        } else if ($this.attr("id") === "MenuItemMultitermCompletion") {
            type = "multitermCompletion";
        }

        $("#emptyBox").remove();
        if (type == "radio") {
            $("#target").append(radioDiv);
        } else if (type == "multiple") {
            $("#target").append(multipleDiv);
        } else if (type == "completion") {
            $("#target").append(completionDiv);
        } else if (type == "multitermCompletion") {
            $("#target").append(multitermCompletionDiv);
        }

        setOrder();

        $("#target .subject").css({
            "border-top": "none",
            "border-bottom": "none"
        });

        tops = [];
        $(document).undelegate("body", "mousemove");
        $("body").undelegate(".subject", "mouseup");
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
        var type;

        if ($this.attr("id") === "MenuItemRadio") {
            type = "radio";
        } else if ($this.attr("id") === "MenuItemMultiple") {
            type = "multiple";
        } else if ($this.attr("id") === "MenuItemCompletion") {
            type = "completion";
        } else if ($this.attr("id") === "MenuItemMultitermCompletion") {
            type = "multitermCompletion";
        }

        var delayed = setTimeout(function() {
            console.log("var delayed = setTimeout");
            if (type == "radio") {
                $temp = $(`<div class="cloth"></div>`).append(radioDiv);
            } else if (type == "multiple") {
                $temp = $(`<div class="cloth"></div>`).append(multipleDiv);
            } else if (type == "completion") {
                $temp = $(`<div class="cloth"></div>`).append(completionDiv);
            } else if (type == "multitermCompletion") {
                $temp = $(`<div class="cloth"></div>`).append(multitermCompletionDiv);
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
            var $target_subType = $("#target .subject");

            /*题型 鼠标移动触发事件*/
            $(document).delegate("body", "mousemove", function(mm) {

                $temp.show();
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
                        } else {
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

                    if (tops.length > 0) {
                        $($temp.html()).insertBefore(tops[0]);
                        setOrder();
                    } else {
                        $("#target").append($temp.html());
                        setOrder();
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

/**
 * 每次修改target时重置题目的题号
 */
function setOrder() {
    var index = 1;
    $td = $("#target h4");
    for (var i = 0; i < $td.length; i++) {
        $td[i].innerHTML = "Q" + (index++).toString();
    }
    index = 1;
    $('.subject').each(function(i) {
        $(this).attr("num", index++);
    });
}

function getSubjectNum() {
    $td = $("#target h4");
    return $td.length;
}

const emptyBox = `
<div id="emptyBox">
    可单击或拖拽左侧题型，以添加题目到此处区域
</div>`;

const radioDiv = `
<div class="radioDiv subject">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_more_off.png" alt="">
        <img class="delete" src="./images/main_03_garbage_off.png" alt="">
    </div>
    <div class="radioMain">
        <div class="radioStemText textBox stemText" id="radioStemTextID">单选题</div>
        <div class="radioDescriptionText textBox descriptionText">单选题描述</div>
        <ul class="radioItem">
            <li>
                <input type="radio" name="radio1" id="Num1" />
                <label class="textBox radioItemText ItemText">选项1</label>
            </li>
            <li>
                <input type="radio" name="radio1" id="Num2" />
                <label class="textBox radioItemText ItemText">选项2</label>
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

const radioItemLabel = `
<li>
    <input type="radio" name="radio1" id="Num1" />
    <label class="textBox radioItemText ItemText">选项</label>
</li>`;

const multipleDiv = `
<div class="multipleDiv subject">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_more_off.png" alt="">
        <img class="delete" src="./images/main_03_garbage_off.png" alt="">
    </div>
    <div class="multipleMain">
        <div class="multipleStemText textBox stemText" id="multipleStemTextID">多选题</div>
        <div class="multipleDescriptionText textBox descriptionText">多选题描述</div>
        <ul class="multipleItem">
            <li>
                <input type="checkbox" name="checkbox1" id="Num1" />
                <label class="textBox multipleItemText ItemText">选项1</label>
            </li>
            <li>
                <input type="checkbox" name="checkbox1" id="Num2" />
                <label class="textBox multipleItemText ItemText">选项2</label>
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

const multipleItemLabel = `
<li>
    <input type="checkbox" name="radio1" id="Num1" />
    <label class="textBox multipleItemText ItemText">选项</label>
</li>`;

const completionDiv = `
<div class="completionDiv subject">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_more_off.png" alt="">
        <img class="delete" src="./images/main_03_garbage_off.png" alt="">
    </div>
    <div class="completionMain">
        <div class="completionStemText textBox stemText" id="completionStemTextID">填空题</div>
        <div class="completionDescriptionText textBox descriptionText">填空题描述</div>
        <ul class="completionItem">
            <li>
                <input type="text" name="completion1" id="Num1" />
            </li>
        </ul>
    </div>
</div>`;

const multitermCompletionDiv = `
<div class="multitermCompletionDiv subject">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_more_off.png" alt="">
        <img class="delete" src="./images/main_03_garbage_off.png" alt="">
    </div>
    <div class="multitermCompletionMain">
        <div class="multitermCompletionStemText textBox stemText" id="multitermCompletionStemTextID">多项填空题</div>
        <div class="multitermCompletionDescriptionText textBox descriptionText">多项填空题描述</div>
        <ul class="multitermCompletionItem">
            <li>
              <label class="textBox multitermCompletionItemText ItemText">选项1</label>
              <input type="text" name="multitermCompletion1" id="Num1" />
            </li>
            <li>
              <label class="textBox multitermCompletionItemText ItemText">选项2</label>
              <input type="text" name="multitermCompletion1" id="Num2" />
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

const multitermCompletionItemLabel = `
<li>
  <label class="textBox multitermCompletionItemText ItemText">选项</label>
  <input type="text" name="multitermCompletion1" id="Num1" />
</li>`;
