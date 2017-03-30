var _questionnaire;

//�Ƿ���Ҫ֪ͨ�������ʾ�������޸�
var _notify = true;

//�����ʾ�������
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

//�����ʾ�����
function setQuestionnaireAnswer(questionnaireAnswer){
	_questionnaire.setAnswer(questionnaireAnswer);
}

//��λ
function locates(infos){
	_questionnaire.locates(infos);
}

//��ȡ�ʾ�����   ÿ���ʾ���޸�ʱ���ᴥ��
function getQuestionnaireAnswer(){
	_getAnswer(JSON.stringify(_questionnaire.getAnswer()));
	_notify = true;
}

//��ȡ������λ��
function getScrollPosition(){
	var obj = new Object();
	obj.scrollPosition = true;
	obj.scrollTop = document.documentElement.scrollTop;
	obj.scrollLeft = document.documentElement.scrollLeft;
	_getAnswer(JSON.stringify(obj));
}

//--------------------------------------������ͬ��----------------------------------------------------------

//�������¼�
var isFirefox = navigator.userAgent.indexOf("Firefox") != -1;
//Firefox�¼���DOMMouseScroll��IE/Opera/Chrome�¼���mousewheel
var mousewheel = isFirefox ? "DOMMouseScroll" : "mousewheel";
 
//�������¼�
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
