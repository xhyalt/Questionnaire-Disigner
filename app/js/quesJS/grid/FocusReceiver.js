function FocusReceiver() {
	this.input = this.createControl();
	this.inputing = false;
	this.bindListener(this.input);
}

FocusReceiver.prototype.createControl = function(){
	var input = document.createElement('input');
	input.style.zIndex = -5;
	input.style.position = 'absolute';
	input.style.left = '0px';
	input.style.top = '0px';
	input.style.width = '0px';
	//chrome中input必须大于2px才能接受焦点
	if (COM.Util.browser.wk) {
    	input.style.height = '2px';
	} else {
		input.style.height = '0px';
	}
	return input;
}
FocusReceiver.prototype.bindListener = function(input){
	var self = this;
	COM.Util.EventRegister.addEvent(input, 'keydown', function(e) {
			self.keydown(e);
		}
	);
	COM.Util.EventRegister.addEvent(input, 'keyup', function(e) {
			self.keyup(e);
		}
	);
	
}
FocusReceiver.prototype.keydown = function(event){
	if (this.needTimeout()) {
		if (null != this.keyupwaiter) {
			clearTimeout(this.keyupwaiter);
		}
		var self = this;
		this.keyupwaiter = setTimeout(function(){
			self.tryCommitInput();
		}, 500);     
//		console.log('set:'+this.keyupwaiter);
	}
	
	var keycode = event.keyCode;
//	console.log('keydown:'+keycode);
	
	if (this.isInputing()) {
		return;
	}
	
	if (this.isInputBegin(keycode)) {
		this.setInputing(true);        			
	}
	
}
FocusReceiver.prototype.isInputBegin = function(keycode){
	if (Util.browser.ie || Util.browser.ch || Util.browser.wk) {
		if (229 == keycode) {
			return true;
		}
	} else if (Util.browser.ff) {
		if (0 == keycode) {
			return true;
		}
	}
}
FocusReceiver.prototype.setInputing = function(value){
	this.inputing = value;

//	console.log("inputing:"+this.isInputing());
}
FocusReceiver.prototype.isInputing = function(){
	return this.inputing;
}
FocusReceiver.prototype.getValue = function(){
	return this.input.value;
}
FocusReceiver.prototype.keyup = function(event){
	if (this.needTimeout()) {
		if (null != this.keyupwaiter) {
			clearTimeout(this.keyupwaiter);
//			console.log('clear:'+this.keyupwaiter);
			this.keyupwaiter = null;
		}
	}
	
	var keycode = event.keyCode;
//	console.log('keyup:'+keycode);
	if (this.isInputing()) {
		if (13 == keycode || 32 == keycode) {
			this.commitInput();
		}
		//微软输入法 ie ch
		if (229 == keycode) {
			this.setInputing(false);
		}
		//微软输入法ff
		if (0 == keycode) {
			this.setInputing(false);
		}
	} else {
		this.tryCommitInput();
	}
}
//是否在输入过程中没有keyup
FocusReceiver.prototype.needTimeout = function(){
	return !(!Util.browser.ie && Util.browser.ff);
}
//是否在输入过程中有keyup，但是回车没有keyup


FocusReceiver.prototype.tryCommitInput = function(){
	var value = this.getValue();
	if ("" != value) {
		this.commitInput();
	}
}
FocusReceiver.prototype.focus = function(e){
	if (null != this.input) {
		this.input.focus(); 
	}
}
FocusReceiver.prototype.blur = function(e){
	if (null != this.input) {
		this.input.blur();    			
	}
}
FocusReceiver.prototype.getControl = function(e){
	return this.input;
}
FocusReceiver.prototype.clearValue = function(e){
	if (null != this.input) {
		this.input.value = "";        			
	}
}
FocusReceiver.prototype.locate = function(x, y){
	if (null != this.input) {
		this.input.style.left = x +"px";
		this.input.style.top = y + "px";
	}
}
FocusReceiver.prototype.commitInput = function(){
	this.setInputing(false);
	if (this.listener) {
		this.listener(this.getValue());
		this.clearValue();
	}
}
FocusReceiver.prototype.onInputCommint = function(listener){
	this.listener = listener;
}