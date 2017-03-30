var _questionnaire;

//是否需要通知服务器问卷调查已修改
var _notify = true;

//设置问卷调查表样
function setQuestionnaireData(questionnaireData){
	$('#eachList').empty();
	_questionnaire = undefined;
	_notify = true;
	_questionnaire =new Questionnaire($('#eachList'),questionnaireData,function(answer){
		if(_notify && _questionnaire !== undefined){
			var obj = new Object();
			obj.ischange = true;
			_getAnswer(JSON.stringify(obj));
			_notify = false;
		}
	});
	_questionnaire.setEditable(questionnaireData.isEditable);
}

//设置问卷调查答案
function setQuestionnaireAnswer(questionnaireAnswer){
	_questionnaire.setAnswer(questionnaireAnswer);
}

//定位
function locates(infos){
	_questionnaire.locates(infos);
}

//获取问卷调查答案   每次问卷答案修改时都会触发
function getQuestionnaireAnswer(){
	_getAnswer(JSON.stringify(_questionnaire.getAnswer()));
	_notify = true;
}

//获取滚动条位置
function getScrollPosition(){
	var obj = new Object();
	obj.scrollPosition = true;
	obj.scrollTop = document.documentElement.scrollTop;
	obj.scrollLeft = document.documentElement.scrollLeft;
	_getAnswer(JSON.stringify(obj));
}

//--------------------------------------滚动条同步----------------------------------------------------------

//鼠标滚轮事件
var isFirefox = navigator.userAgent.indexOf("Firefox") != -1;
//Firefox事件：DOMMouseScroll、IE/Opera/Chrome事件：mousewheel
var mousewheel = isFirefox ? "DOMMouseScroll" : "mousewheel";
 
//鼠标滚动事件
var scrollFunc = function(e) {
	var obj = new Object();
	obj.isScrollChange = true;
	_getAnswer(JSON.stringify(obj));
};

try{
    document.addEventListener(mousewheel, scrollFunc, false);
 }catch(err){
    window.onmousewheel=document.onmousewheel=scrollFunc;
 }        
