/*引用JS文件*/
// const restfulUtil = require('./js/restfulUtil.js');
// const quesSqlite = require('./js/quesSqlite.js');
/*与主进程通信的模块*/
// const ipcRenderer = require('electron').ipcRenderer;
/*用户基础数据*/
var GlobalData = null;

$(function() {
    /*鼠标移入题目显示小图标 移出题目隐藏小图标*/

    /*鼠标移入移出详述 变化颜色*/
    $(".textBox").mouseover(function() {
        var td = $(this);
        td.css("background-color", "#b4fbef");
    }).mouseout(function() {
        var td = $(this);
        td.css("background-color", "#fff");
    });

    /*点击详述 变为编辑框 默认全选*/
    $(".textBox").click(function() {
        var td = $(this);
        var txt = td.text();
        var input = $("<input class='detailText' type='text'value='" + txt + "'/>");
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
            //判断文本有没有修改
            if (newtxt != txt) {
                /*数据库操作*/
                td.html(newtxt);
            } else {
                td.html(newtxt);
            }
        });
    });
});
