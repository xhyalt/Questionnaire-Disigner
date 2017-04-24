var mainData = null;

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
    getPattern(function(res) {
        if (res.success == true) {
            main Data.data = res.data;
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
        "question": "",
        "float": false,
        "mainBodyGuid": "",
        "css": ""
    }
    var Subjects = $("#target .subject, #target .unSubject");
    for (var i = 0; i < Subjects.length; i++) {
        var type = getType(Subjects.eq(i));
        var tempSubject = getSubjectJson(Subjects.eq(i), type);
        questionnaireData.grouplist.push(tempSubject);
    }

    console.log(questionnaireData);
    cb({
        success: true,
        data: questionnaireData
    });
}

function getSubjectJson($td, type) {
    var connection = $td.attr("connection");
    var tempSubject = null;
    if (type == "group") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "hidden": false,
            "description": "",
            "questions": [],
            "question": newGuid(),
            "type": "group",
            "levelNum": $td.children().children("h4").html()
        }
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
            "question": newGuid(),
            "type": "single",
            "levelNum": "",
            "options": [],
        }
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
            tempSubject.datailInfo.options.push(tempOption);
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
            "question": newGuid(),
            "optionlayout": 1,
            "options": []
        }
        var options = $td.children().children(".itemBox").children("li");
        for (var j = 0; j < options.length; j++) {
            var tempOption = {
                "selected": false,
                "title": options.eq(j).children(".ItemText").html(),
                "relquestion": [],
                "zbName": "",
                "inputable": false,
                "optionNum": options.eq(j).children(".initials").html()
            }
            tempSubject.options.push(tempOption);
        }
    } else if (type == "completion") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "hidden": false,
            "description": $td.children().children(".descriptionText").html(),
            "nullable": !subject[connection].forced,
            "question": newGuid(),
            "type": "fillblanks",
            "levelNum": $td.children().children("h4").html(),
            "blanks": [],
            "score": ""
        }
    } else if (type == "shortAnswer") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "hidden": false,
            "zb": "",
            "zbName": "",
            "description": $td.children().children(".descriptionText").html(),
            "nullable": !subject[connection].forced,
            "question": newGuid(),
            "type": "shortanswer",
            "levelNum": $td.children().children("h4").html(),
            "width": 800,
            "hight": 30 * subject[connection].showLine,
            "maxnum": subject[connection].maxLength,
            "minnum": subject[connection].minLength
        }
    } else if (type == "sort") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "hidden": false,
            "description": $td.children().children(".descriptionText").html(),
            "nullable": !subject[connection].forced,
            "question": newGuid(),
            "type": "order",
            "levelNum": $td.children().children("h4").html(),
            "optionlayout": 1,
            "options": []
        }
        var options = $td.children().children(".itemBox").children("li");
        for (var j = 0; j < options.length; j++) {
            var tempOption = {
                "selected": false,
                "title": options.eq(j).children(".ItemText").html(),
                "relquestion": [],
                "zbName": "",
                "inputable": false,
                "optionNum": options.eq(j).children(".initials").html()
            }
            tempSubject.options.push(tempOption);
        }
    } else if (type == "description") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "level": "level" + $td.attr("level"),
            "description": "",
            "nullable": true,
            "hidden": false,
            "question": newGuid(),
            "type": "static",
            "levelNum": ""
        }
    } else if (type == "dividingLine") {
        tempSubject = {
            "title": "<hr/>",
            "level": "level" + $td.attr("level"),
            "description": "",
            "nullable": true,
            "hidden": false,
            "question": newGuid(),
            "type": "static",
            "levelNum": ""
        }
    }
    return tempSubject;
}
