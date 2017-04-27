var mainData = null;
// var tempParentGUID = null;
// var tempParent = null;

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
    var map = {};
    var Subjects = null;

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
    Subjects = $("#target .subject, #target .unSubject");
    // var map = {};
    //
    // for (var i = 0; i < Subjects.length; i++) {
    //     var type = getType(Subjects.eq(i));
    //     var tempSubject = getSubjectJson(Subjects.eq(i), type);
    //     map[Subjects.eq(i).attr("guid")] = Subjects[i];
    // }
    //
    // for(var i = 0; i < Subjects.length; i++){
    //     var guid = Subjects.eq(i).parent().parent().parent(".mergeDiv").eq(0).attr("guid");
    //     if(guid !== undefined){
    //         if(!map[guid].questions){
    //             map[guid].questions = [];
    //         }
    //         console.log(guid);console.log(map[guid]);
    //         map[guid].questions.push(map[Subjects.eq(i).attr("guid")]);
    //     }else{
    //         questionnaireData.questions.push(Subjects[i]);
    //     }
    // }
    //
    // console.log("***********************************************************");
    // console.log(questionnaireData);

    // for (var i = 0; i < Subjects.length; i++) {
    //     console.log(Subjects.eq(i));
    //
    //     var type = getType(Subjects.eq(i));
    //     var tempSubject = getSubjectJson(Subjects.eq(i), type);
    //
    //     if (typeof(Subjects.eq(i).parent().parent().parent(".mergeDiv").eq(0).attr("class")) == "string") {
    //         /*父节点为合并题 深度遍历*/
    //         var tempParentGUID = Subjects.eq(i).parent().parent().parent(".mergeDiv").eq(0).attr("guid");
    //
    //         traverse(tempParentGUID, questionnaireData, 0, function(res) {
    //             if (res.success == true) {
    //                 res.data.questions.push(tempSubject);
    //                 if (i == Subjects.length - 1) {
    //                     console.log(JSON.stringify(questionnaireData));
    //                 }
    //             }
    //         })
    //     } else {
    //         questionnaireData.questions.push(tempSubject);
    //         if (i == Subjects.length - 1) {
    //             console.log(JSON.stringify(questionnaireData));
    //         }
    //     }
    //
    // }
    console.log("============================================");


    for (var i = 0; i < Subjects.length; i++) {
        var type = getType(Subjects.eq(i));
        var tempSubject = getSubjectJson(Subjects.eq(i), type);

        tempSubject["i"] = i;
        map[Subjects.eq(i).attr("guid")] = tempSubject;
    }

    for (var i = 0; i < Subjects.length; i++) {
        var tempParent = Subjects.eq(i).parent().parent().parent(".mergeDiv").eq(0);
        var tempGUID = Subjects.eq(i).attr("guid");
        if (typeof(tempParent.attr("class")) == "string") {
            console.log("该题的爹为合并题");
            map[tempParent.attr("guid")].questions.push(map[tempGUID]);
        } else {
            console.log("该题为最外层题目");
            questionnaireData.questions.push(map[tempGUID]);
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
    }

    if (type == "merge") {
        tempSubject = {
            "title": $td.children().children(".stemText").html(),
            "type": "group",
            "level": "level" + $td.attr("level"),
            "hidden": false,
            "description": "",
            "questions": [],
            "question": tempGUID,
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
            "levelNum": $td.children().children("h4").html(),
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

function traverse(tempParentGUID, node, i, cb) {
    var children = node.questions;
    if (children != null && children[i] != null) {

        if (children[i].question == tempParentGUID) {
            // tempParent = children[i];
            console.log("parent:" + node.levelNum + ", child:" + children[i].levelNum);
            console.log("parent:" + node.question + ", child:" + children[i].question);
            cb({
                success: true,
                data: children[i]
            });
        }
        if (i == children.length - 1) {
            console.log("进入孩子节点 " + node.levelNum + children[i].levelNum);
            traverse(tempParentGUID, children[0], 0, cb);
        } else {
            console.log("进入兄弟节点 " + node.levelNum);
            traverse(tempParentGUID, node, i + 1, cb);
        }
    }
}
