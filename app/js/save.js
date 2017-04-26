var mainData = null;
var tempGUID = null;

function saveQuestionnaire() {
    console.log("正在保存");
    /*显示遮蔽层*/
    showShielder();

    /*获取问卷的JSON*/
    getQuestionnaireJson(function(res) {
        if (res.success == true) {
            console.log(res.data);
            /*去掉遮蔽层*/
            hideShielder();
        }
    });
}

function showShielder() {
    var hideobj = document.getElementById("hidebg");
    hidebg.style.display = "block";
}

function hideShielder() {
    var hideobj = document.getElementById("hidebg");
    hidebg.style.display = "none";
}

function getQuestionnaireJson(cb) {
    mainData = {
        "title": tempQuestionnaire.title,
        "readonly": false,
        "subtitle": "",
        "subno": "1",
        "reportGroupGuid": tempQuestionnaire.solutionRecid,
        "solutionName": "",
        "description": "",
        "name": tempQuestionnaire.name,
        "float": "",
        "dataInfo": {}
    };
    getPatternJson(function(res) {
        if (res.success == true) {
            mainData.data = res.data;
            console.log(mainData);
            cb({
                success: true,
                data: mainData
            })
        }
    });
}

function getPatternJson(cb) {
    var flag = 1;

    var questionnaireData = {
        "guid": tempQuestionnaire.recid,
        "title": tempQuestionnaire.title,
        "autoNo": true,
        "name": tempQuestionnaire.name,
        "questions": [],
        "float": false,
        "mainBodyGuid": "",
        "css": ""
    }
    var Subjects = $("#target .subject, #target .unSubject");
    for (var i = 0; i < Subjects.length; i++) {
        var type = getType(Subjects.eq(i));
        var tempSubject = getSubjectJson(Subjects.eq(i), type);
        console.log(type);
        console.log(tempSubject);
        // console.log(Subjects.eq(i).parent().parent().parent(".mergeDiv").eq(0).attr("class"));

        if (typeof(Subjects.eq(i).parent().parent().parent(".mergeDiv").eq(0).attr("class")) == "string") {
            /*父节点为合并题 深度遍历*/
            tempLength = questionnaireData.questions.length;
            tempJson = questionnaireData.questions[tempLength - 1];
            var flag = 1;

            while (tempJson.type == "group" && flag == 1) {
                console.log("这是一道合并题");
                tempLength2 = tempJson.questions.length;
                if (tempLength2 > 0) {
                    tempJson2 = tempJson.questions[tempLength2 - 1];
                    if (tempJson2.type != "group") {
                        console.log("添加到该层");
                        tempJson.questions.push(tempSubject);
                        flag = 0;
                    } else {
                        /*继续向下深度遍历*/
                        console.log("继续向下深度遍历");
                        tempLength = tempLength2;
                        tempJson = tempJson2;
                    }
                } else {
                    /*该合并题中没有题目 直接添加到该合并题下*/
                    console.log("该合并题中还没有题 直接添加");
                    tempJson.questions.push(tempSubject);
                    flag = 0;
                }
            }
        } else {
            questionnaireData.questions.push(tempSubject);
        }
    }

    console.log(JSON.stringify(questionnaireData));
    cb({
        success: true,
        data: questionnaireData
    });
}

function getSubjectJson($td, type) {
    var connection = $td.attr("connection");
    var tempGUID = $td.attr("guid");
    if (tempGUID == "" || tempGUID == null || tempGUID == undefined) {
        tempGUID = newGuid();
        $td.attr("guid", tempGUID);
        console.log("hehe");
    }

    if (type == "merge") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "hidden": false,
            "description": "",
            "questions": [],
            "question": tempGUID,
            "type": "group",
            "levelNum": $td.children().children("h4").html()
        };
    } else if (type == "radio") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "zb": "",
            "zbName": "",
            "hidden": false,
            "description": $td.children().children(".descriptionText").html(),
            "nullable": !subject[connection].forced,
            "optionlayout": 1,
            "question": tempGUID,
            "type": "single",
            "levelNum": "",
            "options": [],
        };
        var options = $td.children().children(".itemBox").children("li");
        for (var j = 0; j < options.length; j++) {
            var tempOption = {
                "title": options.eq(j).children(".ItemText").html(),
                "zbName": "",
                "optionNum": options.eq(j).children(".initials").html(),
                "selected": false,
                "relquestion": [],
                "inputable": false,
            }
            tempSubject.options.push(tempOption);
        }
    } else if (type == "multiple") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "zb": "",
            "zbName": "",
            "hidden": false,
            "description": $td.children().children(".descriptionText").html(),
            "nullable": !subject[connection].forced,
            "type": "multiple",
            "levelNum": $td.children().children("h4").html(),
            "maxnum": subject[connection].maxSelectItem,
            "minnum": subject[connection].minSelectItem,
            "question": tempGUID,
            "optionlayout": 1,
            "options": []
        };
        var options = $td.children().children(".itemBox").children("li");
        for (var j = 0; j < options.length; j++) {
            var tempOption = {
                "selected": false,
                "title": options.eq(j).children(".ItemText").html(),
                "relquestion": [],
                "zbName": "",
                "inputable": false,
                "optionNum": options.eq(j).children(".initials").html()
            };
            tempSubject.options.push(tempOption);
        }
    } else if (type == "completion") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "hidden": false,
            "description": $td.children().children(".descriptionText").html(),
            "nullable": !subject[connection].forced,
            "question": tempGUID,
            "type": "fillblanks",
            "levelNum": $td.children().children("h4").html(),
            "blanks": [],
            "score": ""
        };
    } else if (type == "shortAnswer") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "hidden": false,
            "zb": "",
            "zbName": "",
            "description": $td.children().children(".descriptionText").html(),
            "nullable": !subject[connection].forced,
            "question": tempGUID,
            "type": "shortanswer",
            "levelNum": $td.children().children("h4").html(),
            "width": 800,
            "hight": 30 * subject[connection].showLine,
            "maxnum": subject[connection].maxLength,
            "minnum": subject[connection].minLength
        };
    } else if (type == "sort") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "hidden": false,
            "description": $td.children().children(".descriptionText").html(),
            "nullable": !subject[connection].forced,
            "question": tempGUID,
            "type": "order",
            "levelNum": $td.children().children("h4").html(),
            "optionlayout": 1,
            "options": []
        };
        var options = $td.children().children(".itemBox").children("li");
        for (var j = 0; j < options.length; j++) {
            var tempOption = {
                "selected": false,
                "title": options.eq(j).children(".ItemText").html(),
                "relquestion": [],
                "zbName": "",
                "inputable": false,
                "optionNum": options.eq(j).children(".initials").html()
            };
            tempSubject.options.push(tempOption);
        }
    } else if (type == "description") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "description": "",
            "nullable": true,
            "hidden": false,
            "question": tempGUID,
            "type": "static",
            "levelNum": ""
        };
    } else if (type == "dividingLine") {
        tempSubject = {
            "title": "<hr/>",
            "level": "level" + $td.attr("level"),
            "description": "",
            "nullable": true,
            "hidden": false,
            "question": tempGUID,
            "type": "static",
            "levelNum": ""
        };
    }
    return tempSubject;
}
