var subjectDiv = {};
var itemLabelDiv = {};
var tempQuestionnaireJson = {};

/**
 * 分解问卷
 * @public
 * @param  tempQuestionnaire 问卷表样JSON字符串
 * @param  {Function} cb     回调函数
 * @return
 */
function decomposeQuestionnaire(tempQuestionnaire, cb) {
    console.log("正在分解表样JSON");
    tempQuestionnaireJson = eval('(' + tempQuestionnaire + ')');
    traverse($("#target").eq(0), tempQuestionnaireJson, 0);
}

/**
 * 深度遍历 写入题目的html
 * @private
 * @param  $td  父题
 * @param  node 节点
 * @param  i    第几个
 * @return
 */
function traverse($td, node, i) {
    var children = node.questions;
    if (children != null && children[i] != null) {
        $("#emptyBox").remove();
        setSubjectHtml($td, children[i]);

        if (children[i].questions != null && children[i].questions[0] != null) {
            // console.log("进入孩子节点");
            traverse($td.children().children().children(".mergeItem"), children[i], 0);
        }
        if (children[i + 1] != null) {
            // console.log("进入兄弟节点");
            traverse($td, node, i + 1);
        }
    }
}

/**
 * 设置某题目的HTML
 * @private
 * @param $td
 * @param subjectJson
 */
function setSubjectHtml($td, subjectJson) {
    var connection = ++subjectTotal;
    type = subjectJson.type;
    /*添加大框架*/
    $td.append(subjectDiv[type]);
    /*确定子层*/
    $tdSon = $td.children().last();
    $tdSonLength = $td.children(".subject, .unSubject").length;
    /*添加level和father属性*/
    if ($td.attr("id") == "target") {
        $tdSon.attr("father", "0");
        $tdSon.attr("level", "1");
        $tdSon.attr("num", $tdSonLength.toString());
    } else {
        $tdSon.attr("father", $td.parent().parent(".subject").eq(0).attr("num"));
        $tdSon.attr("level", (parseInt($td.parent().parent(".subject").eq(0).attr("level")) + 1).toString());
        $tdSon.attr("num", $tdSonLength.toString());
    }
    /*确定各层级的题号类型*/
    var flag = new Array(true, true, true, true, true);
    if (flag[0] == true && $tdSon.attr("level") == 1) {
        if (subjectJson.levelNum == "一、") {

        }
    }
    switch (subjectJson.levelNum) {
        case "一、":
            {
                flag[parseInt($tdSon.attr("level")) - 1] = false;
                quesNoArr[parseInt($tdSon.attr("level")) - 1] = 0;
                break;
            }
        case "(一)":
            {
                flag[parseInt($tdSon.attr("level")) - 1] = false;
                quesNoArr[parseInt($tdSon.attr("level")) - 1] = 1;
                break;
            }
        case "1.":
            {
                flag[parseInt($tdSon.attr("level")) - 1] = false;
                quesNoArr[parseInt($tdSon.attr("level")) - 1] = 2;
                break;
            }
        case "1)":
            {
                flag[parseInt($tdSon.attr("level")) - 1] = false;
                quesNoArr[parseInt($tdSon.attr("level")) - 1] = 3;
                break;
            }
        case "Q1":
            {
                flag[parseInt($tdSon.attr("level")) - 1] = false;
                quesNoArr[parseInt($tdSon.attr("level")) - 1] = 4;
                break;
            }
        default:
            {

            }
    }
    /*添加guid属性*/
    $tdSon.attr("guid", subjectJson.question);
    /*添加connection属性*/
    $tdSon.attr("connection", (connection).toString());
    /*添加其他属性*/
    addSubjectJson(connection, type, subjectJson);

    /*添加题号*/
    $tdSon.children().children("h4").html(subjectJson.levelNum);
    /*添加题干*/
    $tdSon.children().children(".stemText").html(subjectJson.title);
    /*添加描述*/
    if (subjectJson.description) {
        /*将文本放入描述*/
        $tdSon.children().children(".descriptionText").html(subjectJson.description);
        subject[(connection).toString()].showDescription = true;
    } else {
        /*没有描述 去掉描述*/
        $tdSon.children().children(".descriptionText").remove();
        subject[(connection).toString()].showDescription = false;
    }
    /*添加选项*/
    if (subjectJson.options) {
        /*选项存在 逐一添加*/
        for (var i = 0; i < subjectJson.options.length; i++) {
            $tdSon.children(".subjectMain").children("ul").append(itemLabelDiv[type]);
            $tdSonOptions = $tdSon.children(".subjectMain").children("ul").children().last();
            $tdSonOptions.children(".ItemText").html(subjectJson.options[i].title);
            $tdSonOptions.children(".initials").html(subjectJson.options[i].optionNum);
        }
    }
    /*设置简答题的行数*/
    if (subjectJson.hight) {
        $tdSon.children(".subjectMain").children("ul").children("li").children("textarea").attr("rows", subjectJson.hight / 30);
    }
}

/**
 * 添加题目的属性
 * @param connection  第几个
 * @param type        类型
 * @param subjectJson 题目JSON
 */
function addSubjectJson(connection, type, subjectJson) {
    if (type == "single") {
        subject[(connection).toString()] = {
            forced: subjectJson.nullable,
            questionNo: true,
            showDescription: true,
            sameLine: 0,
            showEveryLine: 1
        };
    } else if (type == "multiple") {
        subject[(connection).toString()] = {
            forced: subjectJson.nullable,
            questionNo: true,
            showDescription: true,
            minSelectItem: subjectJson.minnum,
            maxSelectItem: subjectJson.maxnum,
            sameLine: 0,
            showEveryLine: 1
        };
    } else if (type == "fillblanks") {
        subject[(connection).toString()] = {
            forced: subjectJson.nullable,
            questionNo: true,
            showDescription: true
        };
    } else if (type == "shortanswer") {
        subject[(connection).toString()] = {
            forced: subjectJson.nullable,
            questionNo: true,
            showDescription: true,
            showLine: subjectJson.hight / 30,
            minLength: subjectJson.minnum,
            maxLength: subjectJson.maxnum,
        };
    } else if (type == "order") {
        subject[(connection).toString()] = {
            forced: subjectJson.nullable,
            questionNo: true,
            showDescription: true
        };
    } else {
        subject[(connection).toString()] = {};
    }
}

/**
 * 保存问卷
 * @public
 * @param  {Function} cb 回调函数
 * @return
 */
function saveQuestionnaire(tempQuestionnaire, cb) {
    console.log("正在保存");
    /*显示遮蔽层*/
    showShielder();

    /*获取问卷的JSON*/
    getQuestionnaireJson(tempQuestionnaire, function(res) {
        if (res.success == true) {
            console.log(res.data);
            /*去掉遮蔽层*/
            hideShielder();
            cb({
                success: true,
                data: res.data
            });
        }
    });
}

/**
 * 获取问卷的JSON
 * @public
 * @param  {Function} cb 回调函数
 * @return
 */
function getQuestionnaireJson(tempQuestionnaire, cb) {
    console.log(tempQuestionnaire);
    var mainData = {
        title: tempQuestionnaire.title,
        readonly: false,
        subtitle: tempQuestionnaire.subtitle,
        subno: tempQuestionnaire.no,
        reportGroupCode: tempQuestionnaire.reportGroupCode,
        solutionName: tempQuestionnaire.solutionName,
        description: "",
        name: tempQuestionnaire.name,
        float: false,
        dataInfo: {}
    };
    mainData.dataInfo = eval('(' + tempQuestionnaire.data + ')');
    cb({
        success: true,
        data: mainData
    });
}

/**
 * 获取表样的JSON
 * @public
 * @param  {Function} cb 回调函数
 * @return
 */
function getPatternJson(cb) {
    var flag = 1;
    var Subjects = null;
    var map = {};

    var questionnaireData = {
        guid: tempQuestionnaire.recid,
        title: tempQuestionnaire.title,
        autoNo: true,
        name: tempQuestionnaire.name,
        questions: [],
        float: false,
        mainBodyGuid: "",
        css: ""
    };
    Subjects = $("#target .subject, #target .unSubject");

    /*遍历题目 为map赋值*/
    for (var i = 0; i < Subjects.length; i++) {
        var type = getType(Subjects.eq(i));
        var tempSubject = getSubjectJson(Subjects.eq(i), type);

        map[Subjects.eq(i).attr("guid")] = tempSubject;
    }

    /*遍历题目 为map接父引用*/
    for (var i = 0; i < Subjects.length; i++) {
        var tempParent = Subjects.eq(i).parent().parent().parent(".mergeDiv").eq(0);
        var tempGUID = Subjects.eq(i).attr("guid");
        if (typeof(tempParent.attr("class")) == "string") {
            /*非最外层题目*/
            map[tempParent.attr("guid")].questions.push(map[tempGUID]);
        } else {
            /*最外层题目*/
            questionnaireData.questions.push(map[tempGUID]);
        }
    }

    cb({
        success: true,
        data: questionnaireData
    });
}

/**
 * 获取单个题目的JSON
 * @private
 * @param  $td  单个题目
 * @param  type 类型
 * @return
 */
function getSubjectJson($td, type) {
    var connection = $td.attr("connection");
    var tempGUID = $td.attr("guid");
    if (tempGUID == "" || tempGUID == null || tempGUID == undefined) {
        tempGUID = newGuid();
        $td.attr("guid", tempGUID);
    }

    if (type == "merge") {
        tempSubject = {
            title: $td.children().children(".stemText").html(),
            type: "group",
            level: "level" + $td.attr("level"),
            hidden: false,
            description: "",
            questions: [],
            question: tempGUID,
            levelNum: $td.children().children("h4").html()
        };
    } else if (type == "radio") {
        tempSubject = {
            title: $td.children().children(".stemText").html(),
            level: "level" + $td.attr("level"),
            zb: "",
            zbName: "",
            hidden: false,
            description: $td.children().children(".descriptionText").html(),
            nullable: !subject[connection].forced,
            optionlayout: 1,
            question: tempGUID,
            type: "single",
            levelNum: $td.children().children("h4").html(),
            options: [],
        };
        var options = $td.children().children(".itemBox").children("li");
        for (var j = 0; j < options.length; j++) {
            var tempOption = {
                title: options.eq(j).children(".ItemText").html(),
                zbName: "",
                optionNum: options.eq(j).children(".initials").html(),
                selected: false,
                relquestion: [],
                inputable: false,
            }
            tempSubject.options.push(tempOption);
        }
    } else if (type == "multiple") {
        tempSubject = {
            title: $td.children().children(".stemText").html(),
            level: "level" + $td.attr("level"),
            zb: "",
            zbName: "",
            hidden: false,
            description: $td.children().children(".descriptionText").html(),
            nullable: !subject[connection].forced,
            type: "multiple",
            levelNum: $td.children().children("h4").html(),
            maxnum: subject[connection].maxSelectItem,
            minnum: subject[connection].minSelectItem,
            question: tempGUID,
            optionlayout: 1,
            options: []
        };
        var options = $td.children().children(".itemBox").children("li");
        for (var j = 0; j < options.length; j++) {
            var tempOption = {
                selected: false,
                title: options.eq(j).children(".ItemText").html(),
                relquestion: [],
                zbName: "",
                inputable: false,
                optionNum: options.eq(j).children(".initials").html()
            };
            tempSubject.options.push(tempOption);
        }
    } else if (type == "completion") {
        tempSubject = {
            title: $td.children().children(".stemText").html(),
            level: "level" + $td.attr("level"),
            hidden: false,
            description: $td.children().children(".descriptionText").html(),
            nullable: !subject[connection].forced,
            question: tempGUID,
            type: "fillblanks",
            levelNum: $td.children().children("h4").html(),
            blanks: [],
            score: ""
        };
    } else if (type == "shortAnswer") {
        tempSubject = {
            title: $td.children().children(".stemText").html(),
            level: "level" + $td.attr("level"),
            hidden: false,
            zb: "",
            zbName: "",
            description: $td.children().children(".descriptionText").html(),
            nullable: !subject[connection].forced,
            question: tempGUID,
            type: "shortanswer",
            levelNum: $td.children().children("h4").html(),
            width: 800,
            hight: subject[connection].showLine * 30,
            maxnum: subject[connection].maxLength,
            minnum: subject[connection].minLength
        };
    } else if (type == "sort") {
        tempSubject = {
            title: $td.children().children(".stemText").html(),
            level: "level" + $td.attr("level"),
            hidden: false,
            description: $td.children().children(".descriptionText").html(),
            nullable: !subject[connection].forced,
            question: tempGUID,
            type: "order",
            levelNum: $td.children().children("h4").html(),
            optionlayout: 1,
            options: []
        };
        var options = $td.children().children(".itemBox").children("li");
        for (var j = 0; j < options.length; j++) {
            var tempOption = {
                selected: false,
                title: options.eq(j).children(".ItemText").html(),
                relquestion: [],
                zbName: "",
                inputable: false,
                optionNum: options.eq(j).children(".initials").html()
            };
            tempSubject.options.push(tempOption);
        }
    } else if (type == "description") {
        tempSubject = {
            title: $td.children().children(".stemText").html(),
            level: "level" + $td.attr("level"),
            description: "",
            nullable: true,
            hidden: false,
            question: tempGUID,
            type: "static",
            levelNum: ""
        };
    } else if (type == "dividingLine") {
        tempSubject = {
            title: "<hr/>",
            level: "level" + $td.attr("level"),
            description: "",
            nullable: true,
            hidden: false,
            question: tempGUID,
            type: "static",
            levelNum: ""
        };
    }
    return tempSubject;
}

function showShielder() {
    var hideobj = document.getElementById("hidebg");
    hidebg.style.display = "block";
}

function hideShielder() {
    var hideobj = document.getElementById("hidebg");
    hidebg.style.display = "none";
}

subjectDiv["single"] = `
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
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

itemLabelDiv["single"] = `
<li>
    <input type="radio" name="radio1"/>
    <div class="initials">A.</div>
    <div class="textBox radioItemText ItemText" placeholder="选项"></div>
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
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

itemLabelDiv["multiple"] = `
<li>
    <input type="checkbox" name="checkbox1"/>
    <div class="initials">B.</div>
    <div class="textBox multipleItemText ItemText" placeholder="选项"></div>
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="clear"></div>
</li>`;

subjectDiv["fillblanks"] = `
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
                <input type="text" />
            </li>
        </ul>
    </div>
</div>`;

subjectDiv["shortanswer"] = `
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

subjectDiv["order"] = `
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
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

itemLabelDiv["order"] = `
<li>
    <div class="initials"></div>
    <div class="textBox sortItemText ItemText" placeholder="选项"></div>
    <input type="text" />
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="clear"></div>
</li>`;

subjectDiv["static"] = `
<div class="descriptionDiv unSubject" level="1" father="0" num="">
    <div class="leftSetup">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="descriptionMain subjectMain">
        <div class="descriptionStemText textBox stemText" id="descriptionStemTextID" placeholder="描述说明"></div>
    </div>
</div>`;

subjectDiv["group"] = `
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

exports.saveQuestionnaire = saveQuestionnaire;
exports.getPatternJson = getPatternJson;
exports.getQuestionnaireJson = getQuestionnaireJson;
exports.decomposeQuestionnaire = decomposeQuestionnaire;
