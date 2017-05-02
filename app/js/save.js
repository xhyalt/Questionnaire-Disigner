var subjectDiv = {};
var itemLabelDiv = {};

function decomposeQuestionnaire(tempQuestionnaireJson, cb) {
    console.log("正在分解表样JSON");
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
            hight: 30 * subject[connection].showLine,
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

exports.saveQuestionnaire = saveQuestionnaire;
exports.getPatternJson = getPatternJson;
exports.decomposeQuestionnaire = decomposeQuestionnaire;
exports.getQuestionnaireJson = getQuestionnaireJson;
