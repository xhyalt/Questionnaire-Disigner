/*
 * $Id: xbObjects.js,v 1.8 2003/09/14 21:22:26 bc Exp $
 *
 */

/* ***** BEGIN LICENSE BLOCK *****
 * The contents of this file are subject to the Mozilla Public License Version 
 * 1.1 (the "License"); you may not use this file except in compliance with 
 * the License. You may obtain a copy of the License at 
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bob Clary code.
 *
 * The Initial Developer of the Original Code is
 * Bob Clary.
 * Portions created by the Initial Developer are Copyright (C) 2000
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): Bob Clary <http://bclary.com/>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 ***** END LICENSE BLOCK ***** */

function _Classes()
{
  if (typeof(_classes) != 'undefined')
    throw('Only one instance of _Classes() can be created');
    
  function registerClass(className, parentClassName)
  {
    if (!className)
      throw('xbObjects.js:_Classes::registerClass: className missing');
      
    if (className in _classes)
      return;
      
    if (className != 'xbObject' && !parentClassName)
      parentClassName = 'xbObject';
      
    if (!parentClassName)
      parentClassName = null;
    else if ( !(parentClassName in _classes))
      throw('xbObjects.js:_Classes::registerClass: parentClassName ' + parentClassName + ' not defined');

    // evaluating and caching the prototype object in registerClass
    // works so long as we are dealing with 'normal' source files
    // where functions are created in the global context and then 
    // statements executed. when evaling code blocks as in xbCOM,
    // this no longer works and we need to defer the prototype caching
    // to the defineClass method

    _classes[className] = { 'classConstructor': null, 'parentClassName': parentClassName };
  }
  _Classes.prototype.registerClass = registerClass;

  function defineClass(className, prototype_func)
  {
    var p;

    if (!className)
      throw('xbObjects.js:_Classes::defineClass: className not given');
      
    var classRef = _classes[className];
    if (!classRef)
      throw('xbObjects.js:_Classes::defineClass: className ' + className + ' not registered');
    
    if (classRef.classConstructor)
      return;
      
    classRef.classConstructor = eval( className );
    var childPrototype  = classRef.classConstructor.prototype;
    var parentClassName = classRef.parentClassName;
      
    if (parentClassName)
    {
      var parentClassRef = _classes[parentClassName];
      if (!parentClassRef)
        throw('xbObjects.js:_Classes::defineClass: parentClassName ' + parentClassName + ' not registered');

      if (!parentClassRef.classConstructor)
      {
        // force parent's prototype to be created by creating a dummy instance
        // note constructor must handle 'default' constructor case
        var dummy;
        eval('dummy = new ' + parentClassName + '();');
      }
        
      var parentPrototype = parentClassRef.classConstructor.prototype;
    
      for (p in parentPrototype)
      {
        switch (p)
        {
        case 'isa':
        case 'classRef':
        case 'parentPrototype':
        case 'parentConstructor':
        case 'inheritedFrom':
          break;
        default:
          childPrototype[p] = parentPrototype[p];
          break;
        }
      }
    }

    prototype_func();
    
    childPrototype.isa        = className;
    childPrototype.classRef   = classRef;

    // cache method implementor info
    childPrototype.inheritedFrom = new Object();
    if (parentClassName)
    {
      for (p in parentPrototype)
      {
        switch (p)
        {
        case 'isa':
        case 'classRef':
        case 'parentPrototype':
        case 'parentConstructor':
        case 'inheritedFrom':
          break;
        default:
          if (childPrototype[p] == parentPrototype[p] && parentPrototype.inheritedFrom[p])
          {
            childPrototype.inheritedFrom[p] = parentPrototype.inheritedFrom[p];
          }
          else
          {
            childPrototype.inheritedFrom[p] = parentClassName;
          }
          break;
        }
      }
    }
  }
  _Classes.prototype.defineClass = defineClass;
}

// create global instance
var _classes = new _Classes();

// register root class xbObject
_classes.registerClass('xbObject');

function xbObject()
{
  _classes.defineClass('xbObject', _prototype_func);

  this.init();
  
  function _prototype_func()
  {
    // isa is set by defineClass() to the className
    // Note that this can change dynamically as the class is cast
    // into it's ancestors...
    xbObject.prototype.isa        = null;  
    
    // classref is set by defineClass() to point to the 
    // _classes entry for this class. This allows access 
    // the original _class's entry no matter how it has 
    // been recast. 
    // *** This will never change!!!! ***
    xbObject.prototype.classRef      = null;
    
    xbObject.prototype.inheritedFrom = new Object();

    function init() { }
    xbObject.prototype.init        = init;
    
    function destroy() {}
    xbObject.prototype.destroy      = destroy;

    function parentMethod(method, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10)
    {
		
      // find who implemented this method
      var className       = this.isa;
      var parentClassName = _classes[className].classConstructor.prototype.inheritedFrom[method];
      var tempMethod      = _classes[parentClassName].classConstructor.prototype[method];
      // 'cast' this into the implementor of the method
      // so that if parentMethod is called by the parent's method, 
      // the search for it's implementor will start there and not
      // cause infinite recursion
      this.isa   = parentClassName;
      var retVal = tempMethod.call(this, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
      this.isa   = className;
      return retVal;
    }
    xbObject.prototype.parentMethod    = parentMethod;

    function isInstanceOf(otherClassConstructor)
    {
      var className = this.isa;
      var otherClassName = otherClassConstructor.prototype.isa;

      while (className)
      {
        if (className == otherClassName)
          return true;

        className = _classes[className].parentClassName;
      }

      return false;
    }
    xbObject.prototype.isInstanceOf    = isInstanceOf;
  }
}

Util = {};
//browser
(function(domain) {
	if (domain.browser) {
		return;
	}
	var ua = navigator.userAgent;
	domain.browser = {
		version : (ua.match(/.+(?:rv|it|ra|ie|me)[\/: ]([\d.]+)/i) || [])[1],
		ie : /msie/i.test(ua) && !/opera/i.test(ua),
		op : /opera/i.test(ua),
		sa : /version.*safari/i.test(ua),
		ch : /chrome/.test(ua),
		ff : /gecko/i.test(ua) && !/webkit/i.test(ua),
		wk : /webkit/i.test(ua),
		mz : /mozilla/i.test(ua) && !/(compatible|webkit)/i.test(ua)
	};
	
	function isMobile() {
		return navigator.userAgent.match(/iP(ad|hone)/i) || navigator.userAgent.match(/ndroid/i);
	}
	domain.browser.isMobile = isMobile();
	//���IE11��У��
    //IE11Ϊ��
    //ie��false
   	//ff:true
    //mz:true
    //ch:false
    
    function isIE() { //ie?
        if (!!window.ActiveXObject || "ActiveXObject" in window)
            return true;
        else
            return false;
    }
    if(!domain.browser.ie) {
    	domain.browser.ie = isIE();
    }
    
})(Util);

Util.isInstanceOf = function (obj, clazz) {
	if (obj.isInstanceOf) {
		return obj.isInstanceOf(clazz);
	}
}
Util.Array = Util.Array || {};
Util.Array.add = function(array, item, index){
	if(index != null && item != null){
		array.splice(index,0,item);
	}else if(item != null && index == null){
		array.push(item);
	}
}
Util.Array.contains = function(array, item){
	for(var i=0;i<array.length;i++){
		if(array[i] == item){
			return true;
		}
	}
	return false;
}
Util.Array.isEmpty = function(array){
	return array == null || array.length == 0;
}
Util.Array.indexOf = function(array, item){
	for(var i=0;i<array.length;i++){
		if(array[i] == item){
			return i;
		}
	}
	return -1;
}
Util.Array.removeItem = function(array, item){
	var temp;
	for (var i = 0, max = array.length; i < max; i++) {
		if (array[i] == item) {
			temp = array[i];
			array.splice(i,1);
			return temp;
		}
	}
}
Util.Array.remove = function(array, index){
	array.splice(index,1);
}
Util.Array.addAll = function(dest, array){
	for(var i = 0;i<array.length;i++){
		dest.push(array[i]);
	}
}


var Debugger=function(){
	function empty(){};
	var de = {
		error: empty,
		log: empty
	};
	function unlock() {
		if (console && console.error) {
			de.error = function(msg) {
				console.error(msg);
			}
		}
		if (console && console.log) {
			de.log = function(msg) {
				console.log(msg);
			}
		}
	}
	function lock() {
		de.error = empty;
		de.log = empty;
	}
	if (Util.browser.ie) {
		
	} else {
		unlock();
	}
	de.lock = lock;
	de.unlock = unlock;
	return de;
}();/**
Canvas
Html5Event
*/
//-------------------------------------------Class Canvas-----------------------
_classes.registerClass("Canvas");
/**
 * @class canvas�ؼ�
 * @constructor
 * @param element
 * @returns
 */
function Canvas(element){

	if(typeof Canvas._initialized == "undefined"){
		function prototypeFunction () {
		
			/**
			 * ��ӿؼ�������
			 */
			Canvas.prototype.addControllListener=function(listener){
				if(listener == null){
					return;
				}
				this.controllListeners.push(listener);
			}
			/**
			 * �����������
			 */
			Canvas.prototype.addMouseListener = function(listener){
				if(listener == null){
					return;
				}
				this.mouseListeners.push(listener);
			}
			/**
			 * ��Ӱ���������
			 */
			Canvas.prototype.addKeyListener = function(listener){
				if(listener == null){
					return;
				}
				this.keyListeners.push(listener);
			}
			/**
			 * ������ټ�����
			 */
			Canvas.prototype.addDisposeListener = function(listener){
				if(listener == null){
					return;
				}
				this.disposeListeners.push(listener);
			}
			/**
			 * �õ�2d��ͼ������
			 */
			Canvas.prototype.get2dContext=function(){
				return this.canvasElement.getContext("2d");
			}
			/**
			 * �õ��ؼ��Ŀͻ���
			 */
			Canvas.prototype.getClientArea = function(){
				return new Rectangle(0,0,this.canvasElement.width,this.canvasElement.height);
			}
			/**
			 * �õ��߶�
			 */
			Canvas.prototype.getHeight = function(){
				return this.canvasElement.height;
			}
			/**
			 * �õ���С
			 */
			Canvas.prototype.getSize = function(){
				return new Dimension(this.canvasElement.width,this.canvasElement.height);
			}
			/**
			 * �õ����
			 */
			Canvas.prototype.getWidth = function(){
				return this.canvasElement.width;
			}
			Canvas.prototype.getClipping = function(){
				return new Rectangle(0,0,this.canvasElement.width,this.canvasElement.height);
			}
		
			Canvas.prototype.open=function(){
				var i;
				for(i=0;i<this.controllListeners.length;i++){
				this.controllListeners[i].controlResized();
				}
			}
			Canvas.prototype.dispose = function(){
				//dispose self
				//fire dispose
				var i;
				for(i=0;i<this.disposeListeners.length;i++){
					this.disposeListeners[i].widgetDisposed();
				}
			}
			Canvas.prototype.registerEvent = function(){
			
				var canvas = this;
				function addEvent(el, type, fn) {
            		(el.attachEvent) ? (el.attachEvent("on" + type, fn)) : (el.addEventListener(type, fn, false));
        		}
				//��������¼�
        		addEvent(document, "keypress",function(e){//���²��ͷ�ĳ����
					canvas.keyPressed(e);
				});
				addEvent(document, "keyup",function(e){//�ͷ�ĳ����
					canvas.keyReleased(e);
				});
				addEvent(document, "keydown",function(e){//����ĳ����
					canvas.keyDown(e);
				});
				
				addEvent(this.canvasElement, "dblclick", function(e){ //˫�� ÿ��˫��ǰ��������԰��º��ͷ�
					if(canvas.clickTimer!=null){
						for(var i=0;i<canvas.clickTimer.length;i++){
							clearTimeout(canvas.clickTimer[i]);
						}
						canvas.clickTimer = [];
					}
					canvas.mouseDoubleClick(e);
				});
				
				addEvent(this.canvasElement, "click", function(e){ //����
					//�ӳٴ����Խ��ÿ��˫�������ĵ����¼�
					if(canvas.clickTimer == null){
						canvas.clickTimer = [];
					}
					var event = canvas.parse(e);
					canvas.clickTimer.push(setTimeout(function (){
						canvas._fireMouseEvent("click", event);
					},250));
				});
				
				addEvent(this.canvasElement, "selectstart", function(e){ //��ֹ��chrome����קʱ�������ʽ������Ч
					if(e.preventDefault) {
						e.preventDefault();
					} else {
						e.returnValue = false;
					}
					if (e.stopPropagation) {
						e.stopPropagation();
					}
				});
				addEvent(this.canvasElement, "mousedown", function(e){ //��갴��
					canvas._clearMouseHover(e);
					canvas.mouseDown(e);
				});
				
				addEvent(this.canvasElement, "mouseout", function(e){ //����Ƴ�canvas
					canvas._clearMouseHover(e);
					canvas.mouseExit(e);
				});
				
				addEvent(this.canvasElement, "mouseover", function(e){ //������canvas
					//canvas.mouseHover(e);
				});
				
				addEvent(this.canvasElement, "mousemove", function(e){ //�����canvas���ƶ�	
					canvas._resetMouseHover(e);
					canvas.mouseMove(e);
				});
				
				addEvent(this.canvasElement, "mouseup", function(e){ //����ͷ�
					canvas._resetMouseHover(e);
					canvas.mouseUp(e);
				});
			}
			
			/**
			 * ������ͣ�¼�
			 * @private
			 * 
			 */
			Canvas.prototype._resetMouseHover = function(e){
				this._clearMouseHover();
				this._beginMouseHover(e);
			}
			Canvas.prototype._beginMouseHover = function(e){
				var that = this;
        		var event= this.parse(e);
				this.hoverTimer = setTimeout(function(){
						that._fireMouseEvent('mouseHover',event);
					},
					Canvas.HOVER_TIME);
			}
			Canvas.prototype._clearMouseHover = function(){
				if(this.hoverTimer){
					clearTimeout(this.hoverTimer);
				}
			}
			
			//key
			Canvas.prototype.keyPressed = function(event){
				for(var i = 0 ;i <this.keyListeners.length;i++){
					this.keyListeners[i].keyPressed(event);
				}
			}
			Canvas.prototype.keyDown = function(event){
				for(var i = 0 ;i <this.keyListeners.length;i++){
					this.keyListeners[i].keyDown(event);
				}
			}
			Canvas.prototype.keyReleased = function(event){
				for(var i = 0 ;i <this.keyListeners.length;i++){
					this.keyListeners[i].keyReleased(event);
				}
			}
			//mouse
			/*
			Canvas.prototype.getEvLocation = function(ev){
				var mx,my;
				if(ev.layerX || ev.layerX==0){
					mx = ev.layerX;
					my = ev.layerY;
				}else if(ev.offsetX || ev.offsetY ==0){
					mx = ev.offsetX;
					my = ev.offsetY;
				}
				return new Point(mx,my);
			}
			*/
			Canvas.prototype.getEvLocation = function(e){
				var x=0;
				var y=0;
				var target = e.target || e.srcElement;
				if (Util.browser.ie/*IE*/ || Util.browser.wk /*webkit*/) {
        			//offsetX��offsetY���¼�����ڵ�ǰԪ�ص�λ��
            		x = e.offsetX;
            		y = e.offsetY;
        		} else {	//FF
        			//layerX��layerY���¼�����ڵ�ǰ����ϵ��λ��
            		x = e.layerX;
            		y = e.layerY;
            		while (target.offsetParent && target.style.position != 'absolute' && target.style.position != 'relative') {
            			target = target.offsetParent;
            		}
        		}
        		x += target.offsetLeft;
       			y += target.offsetTop;
        
        		var current = target.offsetParent;
				while (current != null && current != this.element){
					x += current.offsetLeft;
					y += current.offsetTop;
					current = current.offsetParent;
				}
//				if(ev.pageX || ev.pageY){ 
//					x=ev.pageX;
//					y=ev.pageY; 
//				} else{
//					x = ev.clientX + document.body.scrollLeft - document.body.clientLeft;
//					y = ev.clientY + document.body.scrollTop - document.body.clientTop;
//				}
//				var actualLeft = this.canvasElement.offsetLeft;
//				var actualTop = this.canvasElement.offsetTop;
//				var current = this.canvasElement.offsetParent;
//				while (current != null){
//					actualLeft += current.offsetLeft;
//					actualTop += current.offsetTop;
//					current = current.offsetParent;
//				}
//				x -= actualLeft;
//				y -= actualTop;
				return new Point(x,y);
			}
			Canvas.prototype.parse = function(e) {
				var p = this.getEvLocation(e);
				var event = new Html5Event(this);
				event.setLocation(p);
				event.stateMask = this.stateMask;
				event.localX = p.x;
				event.localY = p.y;
				event.type = e.type;
				event.button = this.getMouseButton(e);
				event.altKey = e.altKey;
				event.ctrlKey = e.ctrlKey;
				event.shiftKey = e.shiftKey;
				return event;
			}
			//����chrome25,ff18,ie10
			Canvas.prototype.getMouseButton = function(e) {
				if (Util.browser.ff) { //firefox
					return e.buttons;
				} else if (Util.browser.ie) { //ie
					return e.button;
				} else if (Util.browser.wk) { //chrome
					if(e.which === 1){
						return Canvas.BUTTON_LEFT;
					} else if (e.which === 2) {
						return Canvas.BUTTON_CENTER;
					} else if (e.which === 3) {
						return Canvas.BUTTON_RIGHT;
					}
				}
				return Canvas.BUTTON_NONE;
			}
			Canvas.prototype.mouseDoubleClick = function(e){
				var event=this.parse(e);
				for(var i = 0 ;i <this.mouseListeners.length;i++){
					this.mouseListeners[i].mouseDoubleClick(event);
				}
			}
			Canvas.prototype.mouseDown = function(e){
				var event=this.parse(e);
				for(var i = 0 ;i <this.mouseListeners.length;i++){
					
					this.mouseListeners[i].mouseDown(event);
				}
			}
			Canvas.prototype.click = function(e){
				var event =this.parse(e);
				this._fireMouseEvent("click", event);
			}
			Canvas.prototype._fireMouseEvent = function (type,event) {
        		try {
        			var listener;
            		for(var i = 0 ;i <this.mouseListeners.length;i++){
            			listener = this.mouseListeners[i];
            			if (listener[type]) {
            				listener[type](event);
            			}
            		}
        		} catch (e) {
            		Debugger.error(e);
        		}
    		},
			Canvas.prototype.mouseHover = function(){
				var event=this.parse(e);
				for(var i = 0 ;i <this.mouseListeners.length;i++){
					
					this.mouseListeners[i].mouseHover(event);
				}
			}
			
			Canvas.prototype.mouseExit = function(e){
				//do nothing
				return;
//				��Ϊ������Ƴ�֮�����ƽ�ȥʱ���Ѿ��޷��жϳ�����ǰ��»��ǵ������Դ˴��ܽ�״̬��Ϊ����
//				this.button = Canvas.BUTTON_NONE;
				var event=this.parse(e);
				for(var i = 0 ;i <this.mouseListeners.length;i++){
					this.mouseListeners[i].mouseExit(event);
				}
			}
			Canvas.prototype.mouseHover = function(e){
				var event=this.parse(e);
				for(var i = 0 ;i <this.mouseListeners.length;i++){
					this.mouseListeners[i].mouseHover(event);
				}
			}
			Canvas.prototype.mouseMove = function(e){
				var event=this.parse(e);
				
				for(var i = 0 ;i <this.mouseListeners.length;i++){
					this.mouseListeners[i].mouseMove(event);
				}
			}
			Canvas.prototype.mouseUp = function(e){
//				return;
				
				var event=this.parse(e);
				event.button = Canvas.BUTTON_LEFT;
				for(var i = 0 ;i <this.mouseListeners.length;i++){
					this.mouseListeners[i].mouseUp(event);
				}
			}
			Canvas.prototype.toDisplay = function(arg1,arg2){
				//�˴�ֱ�ӷ���ԭ����
				if(arg1 == null){
					return;
				}
				if(Util.isInstanceOf(arg1,Point)){
					return arg1;
				}else{
					return new Point(arg1,arg2);
				}
			}

			/**
			 * �����С
			 */
			Canvas.prototype.resize = function(w,h){
				this.canvasElement.width = w;
				this.canvasElement.height = h;
				for(var i = 0 ;i <this.controllListeners.length;i++){
					this.controllListeners[i].controlResized();
				}
			}
			/**
			 * �Ƿ�������
			 */
			Canvas.prototype.isDisposed = function(){
				return this.canvasElement == null;
			}
			/**
			 * ���������ʽ
			 * <a href="Cursor.html">Cursor</a>
			 */
			Canvas.prototype.setCursor = function(cursor){
				this.canvasElement.style.cursor = cursor;
			}
			//�õ�������
			Canvas.prototype.getParent = function(){
				return this.canvasElement.parentNode;
			}
			Canvas.prototype.init = function(element){
				this.parentMethod("init");
				this.canvasElement = element;
				this.context = this.canvasElement.getContext("2d");
				this.controllListeners = [];
				this.mouseListeners = [];
				this.keyListeners = [];
				this.disposeListeners = [];
				this.registerEvent();
				this.button = Canvas.BUTTON_NONE;
				this.stateMask = 0;
			}
			
		}
		Canvas._initialized = true;
		_classes.defineClass("Canvas",prototypeFunction);  
	}
	
	
	this.init(element);
}
Canvas.BUTTON_NONE = 0;
Canvas.BUTTON_LEFT = 1;
Canvas.BUTTON_CENTER = 4;
Canvas.BUTTON_RIGHT = 2;
Canvas.HOVER_TIME = 800;

//-----------------------------Class Html5Event-------
_classes.registerClass("Html5Event");
function Html5Event(source){
	if(typeof Html5Event._initialized == "undefined"){
		function prototypeFunction () {
			
			Html5Event.prototype.getSource = function(){
				return this.source;
			}
			Html5Event.prototype.setLocation = function(arg1,arg2){
				if(arg1 == null){
					return;
				}
				if(Util.isInstanceOf(arg1, Point)){
					this.x = arg1.x;
					this.y = arg1.y;
				}else{
					this.x = arg1;
					this.y = arg2;
				}
			}
			Html5Event.prototype.getLocation = function(){
				return new Point(this.x,this.y);
			}
			Html5Event.prototype.init = function(source){
				this.parentMethod("init");
				this.source = source;
				this.button = null; //1Ϊ���
				this.stateMask = null; //???
				this.x = null;
				this.y = null;
				this.keyCode = null;
				this.character = null;
				
			}
		}
		Html5Event._initialized = true;
		_classes.defineClass("Html5Event",prototypeFunction); 
	}

	this.init(source);
}/**
Map
MapIterator
*/
//-------------------------------------------Class Map-----------------------
_classes.registerClass("Map");
function Map(){
	

	if(typeof Map._initialized == "undefined"){
	
		function prototypeFunction () {
			Map.prototype.size = function(){
				return this.length;
			}
  
			Map.prototype.put = function(key, value){
				var index = this.containsKey(key);
				if(index >= 0)
				{
//					this.map.splice(index+1,1,value);
					this.map[index+1] = value;
				}else{
					++this.length;	 
					this.map.push(key);
					this.map.push(value);
				}
			}
  
			Map.prototype.remove = function(key){
				var index = this.containsKey(key);
				if(index >= 0)
				{
					--this.length;
					var result = this.map[index+1];
					this.map.splice(index,2);
					return result;
				}else
				{
					return false;
				}
			}
  
			Map.prototype.containsKey = function(key){
				var i;
				for( i=0;i<this.map.length;i+=2){
					if(this.map[i] == key){
					return i;
					}
				}
				return -1;
  
			}
   
			Map.prototype.get = function(key){   
				var index = this.containsKey(key);
				if(index >= 0){
					return this.map[index+1];
				}
			}  
			Map.prototype.isEmpty = function(){
				return this.length == 0;
			}
			Map.prototype.keySetIterator = function(){
				return new MapIterator(this.map,"key");
			}
			
			Map.prototype.valueSetIterator = function(){
				return new MapIterator(this.map,"value");
			}
			
			Map.prototype.init = function(){
				this.map = [];
				this.length = 0;
			}
		}
		
		Map._initialized = true;
		_classes.defineClass("Map",prototypeFunction);  
	}
	
	this.init();
}


  _classes.registerClass("MapIterator");
function MapIterator(items,which){
	


	if(typeof MapIterator._initialized == "undefined"){
		function prototypeFunction () {
			MapIterator.prototype.next = function(){
				var result = this._items[this._index];
				this._index += 2;
				return result;
			}
			MapIterator.prototype.hasNext = function(){
				if(!this._items){
					return false;
				}
				if(this._index + 2 <= this._items.length){
					return true;
				}else{
					return false;
				}
			}
			MapIterator.prototype.init = function(items,which){
				
				this._items = items;
				if(which == "key"){
					this._index = 0;
				}else{
					this._index = 1;
				}
				
			}
		}
		MapIterator._initialized = true;
		_classes.defineClass("MapIterator",prototypeFunction); 
	}
	
	this.init(items,which);
}/**
Rectangle
Dimension
Point
AbsoluteBendpoint
Insets
Geometry
PointList
Transform
PositionConstants
*/

/**
* @fileoverview �����ļ�
* @author jiangqifan
* @version 0.1
*/
//-------------------------------------------Class Rectangle-----------------------
 _classes.registerClass("Rectangle");
/**
* ����
* @class ����
* @constructor
* @return һ������
*/
function Rectangle(x,y,width,height){

	if(typeof Rectangle._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ���εĵ�
			 * @public
			 * @return ���εĵ�
			 * @type Number
			 */
			Rectangle.prototype.bottom = function(){
				return this.y + this.height;
			}
			/**
			 * ������һ�������һ�������Ƿ񱻱����ΰ���
			 * contains(point);
			 * contains(rectangle);
			 * contains(x,y);
			 * @param {Number|Point|Rectangle|} arg1 �����Եĵ�ĺ�����|�����Եĵ�|�����Եľ���
			 * @param {Number|null} arg2 �����Եĵ��������
			 */
			Rectangle.prototype.contains = function(arg1,arg2){
				if(arg1 != null){
					if(Util.isInstanceOf(arg1, Point)){
						return this.contains(arg1.x,arg1.y);
					}else if(Util.isInstanceOf(arg1, Rectangle)){
						return this.x <= arg1.x && this.y <= arg1.y && this.right() >= arg1.right() && this.bottom() >= arg1.bottom(); 
					}else if(arg2 != null){
						return arg2 >= this.y && arg2 <= this.y + this.height && arg1 >= this.x && arg1 <= this.x + this.width;
					}
				}	
			}
			Rectangle.prototype.copy = function (){
				return new Rectangle(this.x,this.y,this.width,this.height);
			}
			/**
			 * ����insets����
			 * @param {Insets} insets ������������
			 */
			Rectangle.prototype.crop = function(insets){
				if(!insets){
					return this;
				}
				this.x += insets.left;
				this.y += insets.top;
				this.width -= (insets.getWidth());
				this.height -= (insets.getHeight());
				return this;
			}
			/**
			 * �Ƿ�����һ���������
			 * @param {Rectangle} o ��һ������
			 * @returns �Ƿ����
			 * @type boolean
			 */
			Rectangle.prototype.equals = function(o){
				if(o == null) return false;
				if(this == o) return true;
				if(Util.isInstanceOf(o, Rectangle)){
					return this.x == o.x && this.y == o.y && this.width == o.width && this.height == o.height;
				}
				return false;
			}
			
			/**
			 * ������������չ
			 * expaned(insets);
			 * expand(expand_width,expaned_height);
			 * @param {Number|Insets} arg1 ������չֵ|��Ҫ��չ��Insets
			 * @param {Number|null} arg2 ������չֵ
			 * @returns ��չ֮��ı�����
			 * @type Rectangle
			 */
			Rectangle.prototype.expand = function(arg1,arg2){
				if(arg1 != null){
					if(Util.isInstanceOf(arg1, Insets)){
						this.x -= arg1.left;
						this.y -= arg1.top;
						this.height += arg1.getHeight();
						this.width += arg1.getWidth();
						return this;
					}else if(arg2 != null){
						return this.shrink(-arg1,-arg2);
					}
					return this;
				}			
				return this;
			}
			/**
			 * �õ��ײ��м��λ��
			 * @returns ���εײ��м�λ�õ�����
			 * @type Point
			 */
			Rectangle.prototype.getBottom = function(){
				return new Point(this.x + this.width/2,this.bottom());
			}
			/**
			 * �õ����½ǵ�λ��
			 * @returns �������½ǵ�����
			 * @type Point
			 */
			Rectangle.prototype.getBottomLeft = function(){
				return new Point(this.x,this.y+this.height);
			}
			/**
			 * �õ����½ǵ�λ��
			 * @returns �������½ǵ�����
			 * @type Point
			 */
			Rectangle.prototype.getBottomRight = function(){
				return new Point(this.x+this.width,this.y+this.height);
			}
			/**
			 * �õ��������ĵ�λ��
			 * @returns �������ĵ�����
			 * @type Point
			 */
			Rectangle.prototype.getCenter = function(){
				return new Point(this.x + this.width/2,this.y + this.height/2);
			}
			/**
			 * �õ������εĿ���
			 * @returns �����εĿ���
			 * @type Rectangle
			 */
			Rectangle.prototype.getCopy = function(){
				return new Rectangle(this);
			}
			
			/**
			 * �õ�һ���µ��޼����ľ���
			 * @param {Insets} �޼�ֵ
			 * @returns �µ��޼����ľ���
			 * @type Rectangle
			 */
			Rectangle.prototype.getCropped = function(insets){
				var rect = new Rectangle(this);
				rect.crop(insets);
				return rect;
			}
			/**
			 * �õ�һ���µ���չ���ľ���
			 * @param {Number|Insets} arg1 ������չ��ֵ|��Ҫ��չ��ֵ
			 * @param {Number|null} arg2 ������չ��ֵ
			 * @returns �µ��޼����ľ���
			 * @type Rectangle
			 */
			Rectangle.prototype.getExpanded = function(arg1,arg2){
				if(arguments.length == 1){
					return new Rectangle(this).expand(arg1);
				}else if(arguments.length == 2){
					return new Rectangle(this).expand(arg1, arg2);
				}
			}
			
			/**
			 * �õ����������þ��ε��ཻ���򣬽����Ϊһ���µľ��η��أ�������ཻ�����򷵻ؿվ���
			 * @param {Rectangle} rect ��������
			 * @returns �����ε��ཻ����
			 * @type Rectangle
			 */
			Rectangle.prototype.getIntersection = function(rect){
				var x1 = Math.max(this.x,rect.x);
				var x2 = Math.min(this.x + this.width,rect.x + rect.width);
				var y1 = Math.max(this.y,rect.y);
				var y2 = Math.min(this.y + this.height,rect,y + rect.height);
				if((x2 - x1) < 0 || (y2 - y1) < 0){
					return new Rectangle(0,0,0,0);
				}else{
					return new Rectangle(x1,y1,x2-x1,y2-y1);
				}
			}
			/**
			 * �õ���������м��λ��
			 * @returns ��������м������
			 * @type Point
			 */
			Rectangle.prototype.getLeft = function(){
				return new Point(this.x,this.y + this.height/2);
			}
			
			Rectangle.prototype.getInsets = function(){
				if(this.getBorder()){
					//return this.getBorder().getInsets(this);
				}
				//return 
			}
			/**
			 * �õ����ε�λ��
			 * @returns �������Ͻǵ�����
			 * @type Point
			 */
			Rectangle.prototype.getLocation = function(){
				return new Point(this.x,this.y);
			}
			
			/**
			 * �õ�һ���������������ε�λ��
			 * @param {Point} pt һ����
			 * @return ������ڴ˾��ε�λ�ã�EAST|WEST|SOUTH|NORTH|NONE������ȡֵ�ο�<a href="PositionConstants.html">PositionConstants</a>
			 * @see PositionConstants
			 * @type Int
			 */
			Rectangle.prototype.getPosition = function(pt){
				var result = PositionConstants.NONE;
				if(this.contains(pt)){
					return result;
				}
				if(pt.x < this.x){
					result = PositionConstants.WEST;
				}else if(pt.x >= this.x + this.width){
					result = PositionConstants.EAST;
				}
				
				if(pt.y < this.y){
					result = result | PositionConstants.NORTH;
				}else if(pt.y >= this.y + this.height){
					result = result | PositionConstants.SOUTH;
				}
				
				return result;
			}
			/**
			 * �õ�һ���µľ��Σ����������Ĵ�С
			 * @param {Number|Dimension} arg2 �´�С�Ŀ��|�´�С
			 * @param {Number|null} �´�С�ĸ߶�
			 * @returns �µľ���
			 * @type Rectangle
			 */
			Rectangle.prototype.getResized = function(arg1,arg2){
				if(arguments.length == 1){
					return new Rectangle(this).resize(arg1);
				}else if(arguments.length == 2){
					return new Rectangle(this).resize(arg1,arg2);
				}
			}
			/**
			 * �õ������ұ߾��е�λ��
			 * @returns �����ұ߾��е�λ��
			 * @type Point
			 */
			Rectangle.prototype.getRight = function(){
				return new Point(this.right(),this.y + this.height/2);
			}
			/**
			 * �õ����εĴ�С
			 * @returns ���εĴ�С
			 * @type Point
			 */
			Rectangle.prototype.getSize = function(){
				return new Dimension(this.width,this.height);
			}
			/**
			 * �õ����ζ����м��λ��
			 * @returns ���ζ���������
			 * @type Point
			 */
			Rectangle.prototype.getTop = function(){
				return new Point(this.x + this.width/2,this.y);
			}
			/**
			 * �õ��������Ͻǵ�λ��
			 * @returns �������Ͻǵ�����
			 * @type Point
			 */
			Rectangle.prototype.getTopLeft = function(){
				return new Point(this.x,this.y);
			}
			/**
			 * �õ��������Ͻǵ�λ��
			 * @returns �������Ͻǵ�����
			 * @type Point
			 */
			Rectangle.prototype.getTopRight = function(){
				return new Point(this.x + this.width, this.y);
			}
			
			/**
			 * �õ�һ���µľ��Σ����ƶ�����λ��
			 * @param {Number|Point} arg2 �����ƶ�ֵ|�ƶ�ֵ
			 * @param {Number|null} �����ƶ�ֵ
			 * @returns �µľ���
			 * @type Rectangle
			 */
			Rectangle.prototype.getTranslated = function(arg1,arg2){
				if(arguments.length == 1){
					return new Rectangle(this).translate(arg1);
				}else if(arguments.length == 2){
					return new Rectangle(this).translate(arg1,arg2);
				}
			}
			
			/**
			 * �õ��µľ��Σ���������б任(x��y���껥������߻���)
			 * @returns �µľ���
			 * @type Rectangle
			 */
			Rectangle.prototype.getTransposed = function(){
				var r = new Rectangle(this);
				r.transpose();
				return r;
			}
			/**
			 * �õ������ɱ��������������ε���С����
			 * @returns �µľ���
			 * @type Rectangle
			 */
			Rectangle.prototype.getUnion = function(rect){
				if(!rect || rect.isEmpty()){
					return new Rectangle(this);
				}
				var union = new Rectangle(Math.min(this.x,rect.x),Math.min(this.y,rect.y),0,0);
				union.width = Math.max(this.x + this.width, rect.x + rect.width) - union.x;
				union.height = Math.max(this.y + this.height, rect.y + rect.height) - union.y;
				return union;
			}
			
			/**
			 * �����������������ཻ
			 * @returns ������
			 * @type Rectangle
			 */
			Rectangle.prototype.intersect = function(rect){
				var x;
				var y;
				var width;
				var height;
				if(arguments.length ==1){
					x = rect.x;
					y = rect.y;
					width = rect.width;
					height = rect.height;
				}else if(arguments.length == 4){
					x = arguments[0];
					y = arguments[1];
					width = arguments[2];
					height = arguments[3];
				}
				var x1 = Math.max(this.x, x);
				var x2 = Math.min(this.x + this.width, x + width);
				var y1 = Math.max(this.y, y);
				var y2 = Math.min(this.y + this.height, y + height);
				if (((x2 - x1) < 0) || ((y2 - y1) < 0))
					this.x = this.y = this.width = this.height = 0;	// No intersection
				else {
					this.x = x1;
					this.y = y1;
					this.width = x2 - x1;
					this.height = y2 - y1;
				}
				return this;
			}
			
			/**
			 * �жϱ����������������Ƿ��ཻ
			 * @returns �Ƿ��ཻ
			 * @type boolean
			 */
			Rectangle.prototype.intersects = function(rect){
				return rect.x < this.x + this.width && rect.y< this.y + this.height && rect.x + rect.width > this.x && rect.y + rect.height > this.y;
			}
			/**
			 * �жϱ������Ƿ�Ϊ��
			 * @returns �Ƿ�Ϊ��
			 * @type boolean
			 */
			Rectangle.prototype.isEmpty = function(){
				return this.width <= 0 || this.height <= 0;
				//return !(this.width > 0 && this.height > 0 && !isNaN(this.x) && !isNaN(this.y));
			}
			/**
			 * �Ա����ν�������
			 * @param ���ű���
			 */
			Rectangle.prototype.performScale = function(factor){
				this.scale(factor);
			}
			/**
			 * �Ա�����ִ���ƶ�
			 * @param {Number|Point} dx �����ƶ�ֵ|�ƶ�ֵ
			 * @param {Number|null} dy �����ƶ�ֵ
			 */
			Rectangle.prototype.performTranslate = function(dx,dy){
				this.translate(dx, dy);
			}
			/**
			 * �޸ı����εĴ�С
			 * @param {Number|Dimension} arg1 �µĿ��|�µĴ�С
			 * @param {Number|null} arg2 �µĸ߶�
			 */
			Rectangle.prototype.resize = function(arg1,arg2){
				if(typeof arg1 == "undefined"){
					return this;
				}
				if(arguments.length ==1 ){
					if(Util.isInstanceOf(arg1, Dimension)){
						this.width += arg1.width;
						this.height += arg1.height;
					}
				}else if(arguments.length ==2){
					this.width += arg1;
					this.height += arg2;
				}
				return this;
				
			}
			/**
			 * �õ��������ұߵĺ�����
			 * @returns ���ұߵĺ�����
			 * @type Number
			 */
			Rectangle.prototype.right = function(){
				return this.x + this.width;
			}
			/**
			 *  ���š����ֻ����������ű�����������Ҳ������ͬ�����ű���
			 *  @param {Number} x �������ű���
			 *  @param {Number} y �������ű���
			 *  @returns ���ź�ı�����
			 *  @type Rectangle
			 */
			Rectangle.prototype.scale = function(arg1,arg2){
				var scaleX;
				var scaleY;
				if(arg1 == null){
					return;
				}
				if(arg2 == null){
					scaleX = arg1;
					scaleY = arg1;
				}else{
					scaleX = arg1;
					scaleY = arg2;
				}
				var oldX = this.x;
				var oldY = this.y;
				this.x = Math.floor(this.x * scaleX);
				this.y = Math.floor(this.y * scaleY);
				this.width = Math.ceil((oldX + this.width) * scaleX) - this.x;
				this.height = Math.ceil((oldY + this.height) * scaleY) - this.y;
				return this;
			}
			/**
			 * ���ñ߽�
			 * @param {Rectangle} rect �µı߽�ֵ
			 * @returns �������±߽�ı�����
			 * @type Rectangle
			 */
			Rectangle.prototype.setBounds = function(rect){
				this.x = rect.x;
				this.y = rect.y;
				this.width = rect.width;
				this.height = rect.height;
				return this;
			}
			/**
			 * ����X����
			 * @param {Number} x �µ�x����
			 */
			Rectangle.prototype.setX = function (x){
				this.x = x;
			}
			/**
			 * ����Y����
			 * @param {Number} y �µ�Y����
			 */
			Rectangle.prototype.setY = function (y){
				this.y = y;
			}
			/**
			 * ���ÿ��
			 * @param {Number} width �µĿ��
			 */
			Rectangle.prototype.setWidth = function (width){
				this.width = width;
			}
			/**
			 * ���ø߶�
			 * @param {Number} height �µĸ߶�
			 */
			Rectangle.prototype.setHeight = function (height){
				this.height = height;
			}
			/**
			 * ����λ��
			 * setLocation(point);
			 * setLocation(x,y);
			 * @param {Number|Point} arg1 ��λ�õĺ�����|��λ��
			 * @param {Number|null} arg2 ��λ�õ�������
			 */
			Rectangle.prototype.setLocation = function(arg1,arg2){
				if( arg1 == null) return;
				if(Util.isInstanceOf(arg1, Point)){
					this.x = arg1.x;
					this.y = arg1.y;
				}else if(arguments.length == 2){
					this.x = arg1;
					this.y = arg2;
				}
			}
			/**
			 * ���ô�С
			 * setSize(dimension);
			 * setSize(width,height);
			 * @param {Number|Dimension} arg1 �´�С�Ŀ��|�´�С
			 * @param {Number|null} arg2 �´�С�ĸ߶�
			 */
			Rectangle.prototype.setSize = function(arg1,arg2){
				if(arg1 == null) return;
				if(Util.isInstanceOf(arg1, Dimension)){
					this.width = arg1.width;
					this.height = arg1.height;
				}else if(arg2 != null){
					this.width = arg1;
					this.height = arg2;
				}
			}
			/**
			 * �������Σ����ε���ߺ��ұ߶����м��ƶ�h���ϱߺ��±߸����м��ƶ�v
			 * @param {Number} h ��������ֵ
			 * @param {Number} v ��������ֵ
			 * @returns ������ı�����
			 * @type Rectangle
			 */
			Rectangle.prototype.shrink = function(h,v){
				this.x += h;
				this.width -= (h+h);
				this.y += v;
				this.height -= (v+v);
				return this;
			}
			/**
			 * �ж��������Ƿ��нӴ�
			 * @param {Rectangle} rect ��һ������
			 * @returns �������Ƿ��нӴ�
			 * @type boolean
			 */
			Rectangle.prototype.touches = function(rect){
				return rect.x <= this.x + this.width && rect.y <= this.y + this.height && rect.x + rect.width >= this.x && rect.y + rect.height >= this.y;
			}
			/**
			 * �ƶ�����
			 * translate(deltaPoint);
			 * translate(x,y);
			 * @param {Number|Point} x �����ƶ��ľ���|�ƶ��ĺ��ݾ���
			 * @param (Number|null) y �����ƶ��ľ���
			 * @returns �ƶ���ı�����
			 * @type Rectangle
			 */
			Rectangle.prototype.translate = function(x,y){
				if( x == null) return this;
				if(Util.isInstanceOf(x, Point)){
					this.x += x.x;
					this.y += x.y;
				}else if(y != null){
					this.x += x;
					this.y += y;
				}
				return this;
			}
			/**
			 * ������ת�����������껥�����߿���
			 * @returns ת����ı�����
			 * @type Rectangle
			 */
			Rectangle.prototype.transpose = function(){
				var temp = 	this.x;
				this.x = this.y;
				this.y = temp;
				temp = this.width;
				this.width = this.height;
				this.height = temp;
				return this;
			}
			/**
			 * ��չ�Լ���������һ���λ���һ����
			 * union(x, y);
			 * union(x, y, width, height);
			 * union(rectangle);
			 * @param {Number|Rectangle} �����ɵĵ�ĺ�����|�����ɵľ���
			 * @param {Number|null} 
			 * @param {Number|null} 
			 * @param {Number|null} 
			 * @returns ��չ��ı�����
			 * @type Rectangle
			 */
			Rectangle.prototype.union = function(arg1, arg2, arg3, arg4){
				var x;
				var y;
				var width;
				var height;
				if(arg1 == null){
					return this;
				}
				if(typeof arg1 === "number" && typeof arg2 === "number"){
					x = arg1;
					y = arg2;
					width = arg3;
					height = arg4;
				} else {
					x = arg1.x;
					y = arg1.y;
					width = arg1.width;
					height = arg1.height;
				}
				if(width == null){
					width =0;
				}
				if(height == null){
					height =0;
				}
				
				
				var right = Math.max(this.x+this.width,x+width);
				var bottom = Math.max(this.y+this.height,y+height);
				this.x = Math.min(this.x,x);
				this.y = Math.min(this.y,y);
				this.width = right - this.x;
				this.height = bottom - this.y;
				return this;
				
			}
			Rectangle.prototype.init = function(x,y,width,height){
				if( x == null){
					this.x = 0;
					this.y = 0;
					this.width = 0;
					this.height = 0;
				}else if(Util.isInstanceOf(x, Rectangle)){
					this.x = x.x;
					this.y = x.y;
					this.width = x.width;
					this.height = x.height;
				}else if(Util.isInstanceOf(x, Point) && Util.isInstanceOf(y, Point)){
					this.x = Math.min(x.x,y.x);
					this.y = Math.min(x.y,y.y);
					this.width = Math.abs(y.x - x.x)+1;
					this.height = Math.abs(y.y - x.y)+1;
				}else if(Util.isInstanceOf(x, Point) && Util.isInstanceOf(y, Dimension)){
					this.x = x.x;
					this.y = x.y;
					this.width = y.width;
					this.height = y.height;
				}else{
						/**
						 * @type Number
						 * @field
						*/
						this.x=x;
						/**
						 * @type Number
						 * @field
						 */
						this.y=y;
						/**
						 * @type Number
						 * @field
						 */
						this.width = width;
						/**
						 * @type Number
						 * @field
						 */
						this.height = height;
				}
			}
		}
		Rectangle._initialized = true;
		_classes.defineClass("Rectangle",prototypeFunction); 
	}
	this.init(x,y,width,height);
}
/**
 * ����
 * @static
 * @type Rectangle
 */
Rectangle.SINGLETON = new Rectangle();




 _classes.registerClass("Dimension");
 /**
 * ��С
 * @class ��С
 * @constructor
 * @return һ����С����
 */
 function Dimension(width,height){
	if(typeof Dimension._initialized == "undefined"){
		function prototypeFunction () {
			
			/**
			 * �Ƿ������һ����С��������С������ȣ�
			 * @param {Dimension} d ��һ����С
			 * @returns �Ƿ����
			 * @type boolean
			 */
			Dimension.prototype.contains = function(d){
				return this.width >= d.width && this.height >= d.height;
			}
			/**
			 * �Ƿ������һ����С(���������)
			 * @param {Dimension} d ��һ����С
			 * @returns �Ƿ����
			 * @type boolean
			 */
			Dimension.prototype.containsProper = function(d){
				return this.width > d.width && this.height > d.height;
			}
			/**
			 * ������С�Ƿ����
			 * @param {Dimension} d ��һ����С
			 * @returns �Ƿ����
			 * @type boolean
			 */
			Dimension.prototype.equals = function(d){
				if(d == null){
					return false;
				}
				if(arguments.length == 1){
					var d = arguments[0];
					return d.width == this.width && d.height == this.height;
				}else if(arguments.length ==2 ){
					return arguments[0] == this.width && arguments[1] == this.height;
				}
			}
			/**
			 * �Ա���С������չ
			 * @param {Number|Dimension} arg2 ������չֵ|��չ�Ĵ�С
			 * @param {Number|null} arg2 ������չֵ
			 * @returns �Ƿ����
			 * @type boolean
			 */
			Dimension.prototype.expand = function(arg1,arg2){
				if(typeof arg1 == "undefined") return this;
				if(Util.isInstanceOf(arg1, Dimension)){
					this.width += arg1.width;
					this.height += arg1.height;
				}else if(Util.isInstanceOf(arg1, Point)){
					this.width += arg1.x;
					this.height += arg1.y;
				}else if(arguments.length == 2){
					this.width += arg1;
					this.height += arg2;
				}
				return this;
			}
			/**
			 * ����С�����
			 * @returns ��������
			 * @type Number
			 */
			Dimension.prototype.getArea = function() {
				return this.width * this.height;
			}
			/**
			 * �õ�����С��һ������
			 * @returns ����С��һ������
			 * @type Dimension
			 */
			Dimension.prototype.getCopy = function() {
				return new Dimension(this);
			}
			/**
			 * ������С�Ĳ�ֵ
			 * @param {Dimension} d ��һ����С
			 * @returns ������С�Ĳ�ֵ
			 * @type Dimension
			 */
			Dimension.prototype.getDifference = function(d){
				return new Dimension(this.width - d.width, this.height - d.height);
			}
			/**
			 * �õ�һ���µĴ�С�������ڱ���С�Ļ������������չ
			 * @param {Number|Dimension} d ����չ�Ŀ��|����չ�Ĵ�С
			 * @param {Number} height ����չ�ĸ߶�
			 * @returns �µĴ�С
			 * @type Dimension
			 */
			Dimension.prototype.getExpanded = function(d,height){
				var width;
				var height;
				if(arguments.length==1){
					width = d.width;
					height = d.height;
				}else if(arguments.length == 2){
					width = d;
					hwight = height;
				}
				return new Dimension(this.width + width, this.height + height);
			}
			/**
			 * ������С�Ľ���(���Ϊ������С����С��ȣ��߶�Ϊ������С����С�߶�)
			 * @param {Dimension} d ��һ����С
			 * @returns ������С�Ľ���
			 * @type Dimension
			 */
			Dimension.prototype.getIntersected = function(d){
				return new Dimension(this).intersect(d);
			}
			/**
			 * ��С���෴ֵ
			 * @returns �µĴ�С��Ϊ����С���෴ֵ��
			 * @type Dimension
			 */
			Dimension.prototype.getNegated = function(){
				return new Dimension(0 - this.width, 0 - this.height);
			}
			/**
			 * �õ�һ���µĴ�С���������ڱ���С�Ļ����Ͻ�������
			 * @param {Number} amount ���ű���
			 * @returns �µĴ�С
			 * @type Dimension
			 */
			Dimension.prototype.getScaled = function(amount){
				return new Dimension(this).scale(amount);
			}
			/**
			 * 
			 */
			Dimension.prototype.getShrinked = function (arg1, arg2) {
				if (arg1 == null) {
					return;
				}
				if (Util.isInstanceOf(arg1, Dimension)) {
					return this.getCopy().shrink(arg1.width,arg1.height);
				} else {
					return this.getCopy().shrink(arg1, arg2);
				}
			}
			/**
			 * �õ�һ���µĴ�С���������ڱ���С�Ļ����Ͻ��б任(�߿���);
			 * @returns �µĴ�С
			 * @type Dimension
			 */
			Dimension.prototype.getTransposed = function(){
				return new Dimension(this).transpose();
			}
			/**
			 * �õ�������С�Ĳ�������Ϊ������С���֮����Ϊ������С���֮��
			 * @returns �µĴ�С
			 * @type Dimension
			 */
			Dimension.prototype.getUnioned = function(d){
				return new Dimension(this).union(d);
			}
			/**
			 * ����С����һ����С�󽻼�
			 * @returns ����С
			 * @type Dimension
			 */
			Dimension.prototype.intersect = function(d){
				this.width = Math.min(d.width, this.width);
				this.height = Math.min(d.height, this.height);
				return this;
			}
			/**
			 * ����С�Ƿ�Ϊ��(�߿�Ϊ����)
			 * @returns �Ƿ�Ϊ��
			 * @type boolean
			 */
			Dimension.prototype.isEmpty = function(){
				return (this.width <= 0) || (this.height <= 0);
				//return !((this.width > 0) && (this.height > 0));
			}
			/**
			 * �Ա���С��
			 * @returns �󷴺�ı���С
			 * @type Dimension
			 */
			Dimension.prototype.negate = function(){
				this.width = 0 - this.width;
				this.height = 0 - this.height;
				return this;
			}
			/**
			 * �Ա���С��������
			 * @returns ���ź�ı���С
			 * @type Dimension
			 */
			Dimension.prototype.performScale = function(factor){
				return this.scale(factor);
			}
			Dimension.prototype.performTranslate = function(){
				//do nothing.
			}
			/**
			 * �Ա���С�������ţ���ֻ�ṩ�������ű���ʱ������Ҳ������ͬ�����������ţ�
			 * @param {Number} h �������ű���
			 * @param {Number|null} v �������ű���
			 * @returns ���ź�ı���С
			 * @type Dimension
			 */
			Dimension.prototype.scale = function(){
				var w;
				var h;
				if(arguments.length == 1){
					w = arguments[0];
					h = w;
				}else if(arguments.length == 2){
					w = arguments[0];
					h = arguments[1];
				}
				this.width  = Math.floor(this.width * w);
				this.height = Math.floor(this.height * h);
				return this;
			}
			/**
			 * ���ñ���С��ֵ
			 * @param {Dimension} d �µ�ֵ
			 * @returns �ı�֮��ı���С
			 * @type Dimension
			 */
			Dimension.prototype.setSize = function(d){
				this.width = d.width;
				this.height = d.height;
			}
			/**
			 * �Ա���С��������
			 * @param {Number} w �������ֵ
			 * @param {Number} h �߶�����ֵ
			 * @returns �ı�֮��ı���С
			 * @type Dimension
			 */
			Dimension.prototype.shrink = function(w,h){
				return this.expand(-w, -h);
			}
			/**
			 * �������±任(��߻���)
			 * @returns �任֮��ı���С
			 * @type Dimension
			 */
			Dimension.prototype.transpose = function(){
				var temp = this.width;
				this.width = this.height;
				this.height = temp;
				return this;
			}
			/**
			 * �Ա���С����һ����С�Ĳ�������Ϊ������С���֮����Ϊ������С���֮��
			 * @param {Dimension} d ��һ����С
			 * @returns �ı�֮��ı���С
			 * @type Dimension
			 */
			Dimension.prototype.union = function(d){
				this.width = Math.max(this.width,d.width);
				this.height = Math.max(this.height,d.height);
				return this;
			}
			Dimension.prototype.init = function(arg1,arg2){
				if(arg1 == null){
					this.width = 0;
					this.height = 0;
					return;
				}
				if(Util.isInstanceOf(arg1, Dimension)){
					this.width = arg1.width;
					this.height = arg1.height;
				}else if(Util.isInstanceOf(arg1, Point)){
					this.width = arg1.x;
					this.height = arg1.y;
				}else{
					/**
					 * @type Number
					 */
					this.width = arg1;
					/**
					 * @type Number
					 */
					this.height = arg2;
				}
			}
		}
		Dimension._initialized = true;
		_classes.defineClass("Dimension",prototypeFunction); 
	}
	this.init(width,height);
 }
 /**
  * ����
  * @static
  * @type Dimension
  */
 Dimension.SINGLETON = new Dimension();
 Dimension.max = function (d1, d2) {
	 return new Dimension(Math.max(d1.width, d2.width), Math.max(d1.height, d2.height));
 };
 Dimension.min = function (d1, d2) {
	 return new Dimension(Math.min(d1.width, d2.width), Math.min(d1.height, d2.height));
 };
 
 
 _classes.registerClass("Point");
 /**
  * ��
  * @class ��
  * @constructor
  * @return һ����
  */
 function Point(x,y){
	if(typeof Point._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �ж�����һ�����Ƿ����
			 * @param {Point} o ��һ����
			 * @returns �Ƿ����
			 * @type boolean
			 */
			Point.prototype.equals = function(o){
				if(o == null) return false;
				if(Util.isInstanceOf(o, Point)){
					return o.x == this.x && o.y == this.y;
				}
				return false;
			}
			/**
			 * �õ�����Ŀ���
			 * @returns һ���µĵ�
			 * @type Point
			 */
			Point.prototype.getCopy = function(){
				return new Point(this);
			}
			/**
			 * �õ�����һ����֮���ʸ������
			 * @param {Point} pt ��һ����
			 * @returns ʸ������
			 * @type Dimension
			 */
			Point.prototype.getDifference = function(pt){
				return new Dimension(this.x - pt.x,this.y - pt.y);
			}
			/**
			 * �õ�����һ����֮��ľ���ֵ
			 * @param {Point} ��һ����
			 * @returns ����֮��ľ���ֵ
			 * @type Number
			 */
			Point.prototype.getDistance = function(pt){
				return Math.sqrt(this.getPreciseDistance2(pt));
			}
			/**
			 * ���ٵõ�����һ����֮��ľ���ֵ��ƽ������ȡ���ټ��㣩
			 * @param {Point} ��һ����
			 * @returns ����֮��ľ���ֵ��ƽ��
			 * @type Number
			 */
			Point.prototype.getDistance2 = function(pt){
				var i = Math.floor(pt.x - this.x);
				var j = Math.floor(pt.y - this.y);
				var result = i*i + j*j;
				
				return result;
			}
			/**
			 * �õ�����һ����֮��ľ���ֵ��ƽ������ȷ��
			 * @private
			 * @param {Point} ��һ����
			 * @returns ����֮��ľ���ֵ��ƽ��
			 * @type Number
			 */
			Point.prototype.getPreciseDistance2 = function(pt){
				var i = pt.x - this.x;
				var j = pt.y - this.y;
				var result = i*i + j*j;
				
				return result;
			}
			/**
			 * �õ�����һ����֮��ľ���ֵ��ƽ������ȷ��
			 * @param {Point} ��һ����
			 * @returns ����֮��ľ���ֵ��ƽ��
			 * @type Number
			 */
			Point.prototype.getDistanceOrthogonal = function(pt){
				return Math.abs(this.y - pt.y) + Math.abs(this.x - pt.x);
			}
			/**
			 * �õ�������෴ֵ���뱾�������ԭ��Գƣ�
			 * @returns ������෴ֵ
			 * @type Point
			 */
			Point.prototype.getNegated = function(){
				return this.getCopy().negate();
			}
			/**
			 * �õ���һ��������ڱ����λ��
			 * @returns WEST|EAST|NORTH|SOUTH ����ȡֵ�μ�<a href="PositionConstants">PositionConstants</a>
			 * @type Int
			 */
			Point.prototype.getPosition = function(p){
				var dx = p.x - this.x;
				var dy = p.y - this.y;
				if(Math.abs(dx) > Math.abs(dy)){
					if(dx < 0){
						return PositionConstants.WEST;
					}
					return PositionConstants.EAST;
				}
				if(dy < 0){
					return PositionConstants.NORTH;
				}
				return PositionConstants.SOUTH;
			}
			/**
			 * �õ�һ���µĵ㣬���ڱ���Ļ����Ͻ�������
			 * @param {Number} amout ���ű���
			 * @returns ���ź���µ�
			 * @type Point
			 */
			Point.prototype.getScaled = function(amount){
				return this.getCopy().scale(amount);
			}
			/**
			 * �õ�һ���µĵ㣬���ڱ���Ļ����Ͻ����ƶ�
			 * @param {Number|Point|Dimension} arg1 �����ƶ�ֵ|�ƶ�ֵ|�ƶ�ֵ
			 * @param {Number|null} arg2 �����ƶ�ֵ
			 * @returns �ƶ�����µ�
			 * @type Point
			 */
			Point.prototype.getTranslated = function(arg1,arg2){
				if(arguments.length == 1){
					return this.getCopy().translate(arg1);
				}else if(arguments.length == 2){
					return this.getCopy().translate(arg1,arg2);
				}
			}
			/**
			 * �õ�һ���µĵ㣬���ڱ���Ļ����Ͻ��б任(�������껥��)
			 * @returns �任����µ�
			 * @type Point
			 */
			Point.prototype.getTransposed = function(){
				return this.getCopy().transpose();
			}
			/**
			 * �Ա���ȡ��
			 * @returns ȡ����ı���
			 * @type Point
			 */
			Point.prototype.negate = function(){
				this.x = -this.x;
				this.y = -this.y;
				return this;
			}
			/**
			 * �Ա����������
			 * @param {Number} factor ���ű���
			 * @returns ���ź�ı���
			 * @type Point
			 */
			Point.prototype.performScale = function(factor){
				return this.scale(factor);
			}
			/**
			 * �Ա�������ƶ�
			 * @param {Number|Point|Dimension} dx �����ƶ�ֵ|�ƶ�ֵ|�ƶ�ֵ
			 * @param {Number|null} dy �����ƶ�ֵ
			 * @returns �ƶ���ı���
			 * @type Point
			 */
			Point.prototype.performTranslate = function(dx,dy){
				return this.translate(dx, dy);
			}
			/**
			 * �Ա��������ֵ��������
			 * @param {Number} factor ���ű���
			 * @returns ���ź�ı���
			 * @type Point
			 */
			Point.prototype.scale = function(arg1,arg2){
				var amountX;
				var amountY;
				amountX = arg1;
				if(typeof arg2 == "undefined"){
					amountY = arg1;
				}else{
					amountY = arg2;
				}
				this.x = Math.floor(this.x * amountX);
				this.y = Math.floor(this.y * amountY);
				return this;
			}
			/**
			 * ����λ��
			 * @param {Number|Point} arg1 ��λ�õ�X����|��λ��
			 * @param {Number|null} arg2 ��λ�õ�Y����
			 * @returns ����λ��֮��ı���
			 * @type Point
			 */
			Point.prototype.setLocation = function(arg1,arg2){
				if( arg1 == null) return;
				if(Util.isInstanceOf(arg1, Point)){
					this.x = arg1.x;
					this.y = arg1.y;
				}else if(arg2!=null){
					this.x = arg1;
					this.y = arg2;
				}
				return this;
			}
			/**
			 * �ƶ�����
			 * @param {Number|Point|Dimension} arg1 �����ƶ�ֵ|�ƶ�ֵ|�ƶ�ֵ
			 * @param {Number|null} arg2 �����ƶ�ֵ
			 * @returns �ƶ�֮��ı���
			 * @type Point
			 */
			Point.prototype.translate = function(arg1,arg2){
				if(arg1 ==  null) return;
				if(Util.isInstanceOf(arg1, Point)){
					this.x += arg1.x;
					this.y += arg1.y;
				}else if(Util.isInstanceOf(arg1, Dimension)){
					this.x += arg1.width;
					this.y += arg1.height;
				}else if(arg2 != null){
					this.x += arg1;
					this.y += arg2;
				}
				return this;
			}
			/**
			 * �任���������껥����
			 * @returns �任֮��ı���
			 * @type Point
			 */
			Point.prototype.transpose = function(){
				var temp = this.x;
				this.x = this.y;
				this.y = temp;
				return this;
			}
			Point.prototype.init = function(arg1,arg2){
				this.parentMethod("init");
				if(arg1 == null){
					this.x = 0;
					this.y = 0
					return;
				}
				if(Util.isInstanceOf(arg1, Point)){
					this.x = arg1.x;
					this.y = arg1.y;
				}else if(arg1 != null && arg2 != null){
					/**
					 * @type Number
					 */
					this.x = arg1;
					/**
					 * @type Number
					 */
					this.y = arg2;
				}
			}
		}
		Point._initialized = true;
		_classes.defineClass("Point",prototypeFunction); 
	}
	this.init(x,y);
 }
 /**
  * �õ�����ϴ��һ����
  * @static
  * @param {Point} p1 ���Ƚϵĵ�һ����
  * @param {Point} p2 ���Ƚϵĵڶ�����
  * @returns ����ϴ��һ����
  * @type Point
  */
 Point.max = function(p1,p2){
	return new Rectangle(p1,p2).getBottomRight().translate(-1,-1);
 }
 /**
  * �õ������С��һ����
  * @static
  * @param {Point} p1 ���Ƚϵĵ�һ����
  * @param {Point} p2 ���Ƚϵĵڶ�����
  * @returns �����С��һ����
  * @type Point
  */
 Point.min = function(p1,p2){
	return new Rectangle(p1,p2).getTopLeft();
 }
 /**
  * ����
  * @static
  * @type Point
  */
 Point.SINGLETON = new Point(0,0);
 

 /**
  * @class AbsoluteBendpoint
  * @constructor
  * @extend Point
  */
 _classes.registerClass("AbsoluteBendpoint","Point");

 function AbsoluteBendpoint(arg1,arg2){
	if(typeof AbsoluteBendpoint._initialized == "undefined"){
		function prototypeFunction () {
			AbsoluteBendpoint.prototype.getLocation = function(){
				return this;
			}
			AbsoluteBendpoint.prototype.init = function(arg1,arg2){
				this.parentMethod("init",arg1,arg2);
			}
		}
		AbsoluteBendpoint._initialized = true;
		_classes.defineClass("AbsoluteBendpoint",prototypeFunction); 
	}
	this.init(arg1,arg2);
 }
 
  _classes.registerClass("Insets");
  /**
   * @class ����ֵ
   * @constructor
   */
 function Insets(top,left,bottom,right){
	if(typeof Insets._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ��Ӳ���ֵ
			 * @param {Insets} insets ����ӵĲ���ֵ
			 * @returns ���֮��ı�����ֵ
			 * @type Insets
			 */
			Insets.prototype.add = function(insets){
				this.top += insets.top;
				this.left += insets.left;
				this.bottom += insets.bottom;
				this.right += insets.right;
				return this;
			}
			/**
			 * �Ƿ����
			 * @param {Insets} o ��һ������ֵ
			 * @returns �Ƿ����
			 * @type boolean
			 */
			Insets.prototype.equals = function(o){
				if( o == null) return false;
				if(Util.isInstanceOf(o, Insets)){
					return o.top == this.top && o.left == this.left && o.bottom == this.bottom && o.right == this.right;
				}
				return false;
			}
			/**
			 * �õ�һ��������ֵ�ÿ�����������������
			 * @param {Insets} insets ����ӵĲ���ֵ
			 * @returns ���֮����²���ֵ
			 * @type Insets
			 */
			Insets.prototype.getAdded = function(insets){
				return new Insets(this).add(insets);
			}
			/**
			 * �õ�����ֵ�ĸ߶�
			 * @returns ������ֵ�ø߶�
			 * @type Number
			 */
			Insets.prototype.getHeight = function(){
				return this.top + this.bottom;
			}
			/**
			 * ����һ��������ֵ�Ŀ��������������ת����top��left������right��bottom������
			 * @returns ת��֮����²���ֵ
			 * @type Insets
			 */
			Insets.prototype.getTransposed = function(){
				return new Insets(this).transpose();
			}
			/**
			 * �õ����
			 * @returns ������ֵ�Ŀ��
			 * @type Number
			 */
			Insets.prototype.getWidth = function(){
				return this.left + this.right;
			}
			/**
			 * �Ƿ�Ϊ�գ��ĸ������ֵ��Ϊ0��
			 * @returns �Ƿ�Ϊ��
			 * @type boolean
			 */
			Insets.prototype.isEmpty = function(){
				return (this.left == 0 && this.right == 0 && this.top == 0 && this.bottom == 0);
			}
			/**
			 * �Ա��������ת����top��left������right��bottom������
			 * @returns ת��֮��ı�����
			 * @type Insets
			 */
			Insets.prototype.transpose = function(){
				var temp = this.top;
				this.top = this.left;
				this.left = temp;
				temp = this.right;
				this.right = this.bottom;
				this.bottom = temp;
				return this;
			}
			Insets.prototype.init = function(arg1,arg2,arg3,arg4){
				if( arg1 == null) {
					this.top = 0;
					this.left = 0;
					this.bottom = 0;
					this.right = 0;
					return;
				}
				if(Util.isInstanceOf(arg1, Insets)){
					this.top = arg1.top;
					this.left = arg1.left;
					this.bottom = arg1.bottom;
					this.right = arg1.right;
				}else if(arg2 != null && arg3 != null && arg4 != null){
					this.top = arg1;
					this.left = arg2;
					this.bottom = arg3;
					this.right = arg4;
				}else{
					this.top = arg1;
					this.left = arg1;
					this.bottom = arg1;
					this.right = arg1;
				}
				
			}
		}
		Insets._initialized = true;
		_classes.defineClass("Insets",prototypeFunction); 
	}
	
	
	this.init(top,left,bottom,right);
 }
 
 /**
  * @class ������ �ṩһЩ����������ľ�̬����
  * @constructor
  */
 function Geometry(){
 }
/**
 * �ж��������Ƿ��ཻ
 * @param {Number} ux ��һ���ߵ�����x����
 * @param {Number} uy ��һ���ߵ�����y����
 * @param {Number} vx ��һ���ߵ��յ��x����
 * @param {Number} vy ��һ���ߵ��յ��y����
 * @param {Number} sx �ڶ����ߵ�����x����
 * @param {Number} sy �ڶ����ߵ�����y����
 * @param {Number} tx �ڶ����ߵ��յ��x����
 * @param {Number} ty �ڶ����ߵ��յ��y����
 * @returns �Ƿ��ཻ
 * @type boolean
 */
 Geometry.linesIntersect = function(ux,uy,vx,xy,sx,sy,tx,ty){
	var usX = ux - sx;
	var usY = uy - sy;
	var vsX = vx - sx;
	var vsY = vy - sy;
	var stX = sx - tx;
	var stY = sy - ty;
	if (Geometry.productSign(Geometry.cross(vsX, vsY, stX, stY), Geometry.cross(stX, stY, usX, usY)) >= 0) {
		var vuX = vx - ux;
		var vuY = vy - uy;
		var utX = ux - tx;
		var utY = uy - ty;
		return productSign(Geometry.cross(-usX, -usY, vuX, vuY), Geometry.cross(vuX, vuY, utX, utY)) <= 0;
	}
	return false;
 }
 /**
  * @private
  */
 Geometry.productSign = function(x,y){
	if (x == 0 || y == 0) {
		return 0;
	} else if (x < 0 ^ y < 0) {
		return -1;
	}
	return 1;
 }
 /**
  * @private
  */
 Geometry.cross = function(x1, y1, x2, y2) {
	return x1 * y2 - x2 * y1;
}
 /**
  * ��һ����Χ�������Ƿ����ĳ����
  * @param {PointList} points ���ߵĵ�
  * @param {Number} x ���жϵĵ��x����
  * @param {Number} y ���жϵĵ��y����
  * @param {Number} tolerance ��Χ
  * @returns �Ƿ����
  * @type boolean
  */
 Geometry.polylineContainsPoint = function(points,x,y,tolerance){
	//???????????????????????????????????????????????????????????????????????????????TO INT ARRAY?
	var coordinates = points.toIntArray();
		/*
		 * For each segment of PolyLine calling isSegmentPoint
		 */
		 var index;
		for (index = 0; index < coordinates.length - 3; index  += 2) {
			if (Geometry.segmentContainsPoint(coordinates[index], coordinates[index + 1], coordinates[index + 2], coordinates[index + 3], x, y, tolerance)) {
				return true;
			}
		}
		return false;
 }
 /**
  * ��һ����Χ���߶��Ƿ����ĳ����
  * @param {Number} x1 �߶����x����
  * @param {Number} y1 �߶����y����
  * @param {Number} x2 �߶��յ�x����
  * @param {Number} y2 �߶��յ�y����
  * @param {Number} px ���жϵĵ��x����
  * @param {Number} py ���жϵĵ��y����
  * @param {Number} tolerance ��Χ
  * @returns �Ƿ����
  * @type boolean
  */
 Geometry.segmentContainsPoint = function(x1,y1,x2,y2,px,py,tolerance){
	var lineBounds = Rectangle.SINGLETON;
	lineBounds.setSize(0, 0);
	lineBounds.setLocation(x1, y1);
	lineBounds.union(x2, y2);
	lineBounds.expand(tolerance, tolerance);
	if (!lineBounds.contains(px, py)) {
		return false;
	}
	if (x1 == x2 || y1 == y2) {
		return true;
	}
	var v1x = x2 - x1;
	var v1y = y2 - y1;
	var v2x = px - x1;
	var v2y = py - y1;
	var numerator = v2x * v1y - v1x * v2y;
	var denominator = v1x * v1x + v1y * v1y;
	var squareDistance = (numerator * numerator / denominator);
	return squareDistance <= tolerance * tolerance;
 }
 /**
  * ������Ƿ����ĳ����
  * @param {PointList} points ����εĵ�
  * @param {Number} x ���жϵĵ��x����
  * @param {Number} y ���жϵĵ��y����
  * @returns �Ƿ����
  * @type boolean
  */
 Geometry.polygonContainsPoint = function(points,x,y){
  var isOdd = false;
  var coordinates = points.toIntArray();
  var n = coordinates.length;
  if (n > 3) {
	 var x1; var y1;
	 var x0 = coordinates[n - 2];
	 var y0 = coordinates[n - 1];
	 var i;
	 for (i = 0; i < n; x0 = x1, y0 = y1) {
		x1 = coordinates[i++];
		y1 = coordinates[i++];
		if (!Geometry.segmentContaintPoint(y0, y1, y)) {
			continue;
		}
		var crossProduct = Geometry.crossProduct(x1, y1, x0, y0, x, y);
		if (crossProduct == 0) {
			if (Geometry.segmentContaintPoint(x0, x1, x)) {
				return true;
			}
		}else if((y0 <= y && y < y1 && crossProduct > 0) || (y1 <= y && y < y0 && crossProduct < 0)){
			isOdd = !isOdd;
		}
	 }
	 return isOdd;
	}
	return false;
 }
/**
 * @private
 */
 Geometry.segmentContaintPoint = function(x0,x1,x){
	return !((x < x0 && x < x1) || (x > x0 && x > x1));
 }
 /**
  * @private
  */
 Geometry.crossProduct = function(ax,ay,bx,by,cx,cy){
	return (ax - cx) * (by - cy) - (ay - cy) * (bx - cx);
  }
  Geometry.crossLine = function(rect1,rect2){
	return Math.abs((rect1.x+rect1.right())/2-(rect2.x+rect2.right())/2)<((rect1.right()+rect2.right()-rect1.x-rect2.x)/2) && Math.abs((rect1.y+rect1.bottom())/2-(rect2.y+rect2.bottom())/2)<((rect1.bottom()+rect2.bottom()-rect1.y-rect2.y)/2);
  }
 
 //----------------------------------------------class PointList-------------------------------
   _classes.registerClass("PointList");
   /**
    * @class ���б�
    * @constructor
    */
 function PointList(arg){
 if(typeof PointList._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ������һ�����б��е����е�
			 */
			PointList.prototype.addAll = function(source){
				if(source){
					for(var i=0;i<source.points.length;i++){
						this.points.push(source.points[i]);
					}
					this.size += source.size;
				}
			}
			/**
			 * ����һ����
			 */
			PointList.prototype.addPoint = function(arg1,arg2){
				if(arg1!=null){
					var x;
					var y;
					if(Util.isInstanceOf(arg1, Point)){
						x = arg1.x;
						y = arg1.y;
					}else{
						x = arg1;
						y = arg2;
					}
					this.bounds = null;
					if(this.points.length > this.size*2){
						this.points[this.size*2] = x;
						this.points[this.size*2 + 1] =y;
					}else{
						this.points.push(x);
						this.points.push(y);
					}
					this.size ++;
				}
			}
			/**
			 * �õ��˵��б�ı߽�
			 * @type Rectangle
			 * @returns �������еĵ���м���ı߽�
			 */
			PointList.prototype.getBounds = function(){
				if(this.bounds != null) return this.bounds;
				this.bounds = new Rectangle(0,0,0,0);
				if(this.size > 0){
					this.bounds.setLocation(this.getPoint(0));
					for(var i=0;i<this.size;i++){
						this.bounds.union(this.getPoint(i));
					}
				}
				return this.bounds;
				
			}
			/**
			 * �õ������б��һ������
			 * @type PointList
			 */
			PointList.prototype.getCopy = function(){
				return new PointList(this);
			}
			/**
			 * �õ���һ����
			 * @type Point
			 */
			PointList.prototype.getFirstPoint = function(){
				return this.getPoint(0);
			}
			/**
			 * �õ����һ����
			 * @type Point
			 */
			PointList.prototype.getLastPoint = function(){
				return this.getPoint(this.size - 1);
			}
			/**
			 * �õ��м�λ�õĵ�
			 * @returns ��������������򷵻ص�(n-1)/2�ĵ㣬�����ż�������򷵻�(n-1)/2������(n+1)/2������е�
			 * @type Point
			 */
			PointList.prototype.getMidpoint = function(){
				if(this.size %2 ==0){
					return this.getPoint(this.size/2-1).getTranslated(this.getPoint(this.size/2)).scale(0.5);
				}
				return this.getPoint(this.size /2);
			}
			//���ǲ���˳���ܷ��޸�
			/**
			 * �õ���
			 * getPoint(index);
			 * getPoint(point,index);
			 * @returns ���ֻ����λ�ã��򷵻�λ�����λ�õĵ�ģ����ͬʱ����һ���㣬�����������������ݣ�Ȼ�󷵻ش˵�
			 * @type Point
			 * @throws IndexOutofBounds
			 */
			PointList.prototype.getPoint = function(arg1,arg2){
				if(arg1 != null){
					var index;
					
					if(Util.isInstanceOf(arg1, Point)){
						if(arg2 < 0 || arg2 >= this.size){
							throw("PointList--getPoint()-IndexOutofBounds size="+this.size+",index="+arg2);
						}
						index = arg2*2;
						arg1.x = this.points[index];
						arg1.y = this.points[index+1];
						
						return arg1;
					}else{
						if(arg1 < 0 || arg1 >= this.size){
							throw("PointList--getPoint()-IndexOutofBounds size="+this.size+",index="+arg1);
						}
						//���⴫��С��ȡ�������ݴ���
						index = (arg1<<0) *2;
						return new Point(this.points[index],this.points[index+1]);
					}
				}
			}
			/**
			 * ����һ����
			 * @param {Point} p ������ĵ�
			 * @param {int} index ����λ��
			 * @throws IndexOutofBounds
			 */
			PointList.prototype.insertPoint = function(p,index){
				if(this.bounds !=null && !this.bounds.contains(p)){
					this.bounds = null;
				}
				if(index >this.size || index <0){
					throw("PointList--insertPoint()-IndexOutofBounds");
				}
				index *= 2;
				this.points.spliec(index,0,p.x,p.y);
				this.size ++;
			}
			/**
			 * �ж��е��б���ɵ������Ƿ�������ཻ
			 * @param {Rectangle} r ���жϵľ���
			 * @returns �Ƿ��ཻ
			 * @type boolean
			 */
			PointList.prototype.intersects = function(r){
				if(r.isEmpty()){
					return false;
				}
				for(var i=0;i<this.size *2;i+=2){
					if(r.contains(this.points[i],this.points[i+1])){
						return true;
					}
				}
				var diagonal1x1 = r.x;
				var diagonal1y1 = r.y;
				var diagonal1x2 = r.x + r.width - 1;
				var diagonal1y2 = r.y + r.height - 1;
				var diagonal2x1 = r.x + r.width - 1;
				var diagonal2y1 = r.y;
				var diagonal2x2 = r.x;
				var diagonal2y2 = r.y + r.height - 1;
				for(var i = 0; i < (this.size - 1) * 2; i += 2){
					if(Geometry.linesIntersect(diagonal1x1, diagonal1y1, diagonal1x2,diagonal1y2, this.points[i], this.points[i + 1], this.points[i + 2], this.points[i + 3]) || Geometry.linesIntersect(diagonal2x1, diagonal2y1, diagonal2x2,diagonal2y2, this.points[i], this.points[i + 1], this.points[i + 2], this.points[i + 3])){
						return true;
					}
				}
				return false;
			}
			/**
			 * ����
			 * @param {Number} factor ����ֵ
			 */
			PointList.prototype.performScale = function(factor){
				for(var i=0;i<this.points.lenght;i++){
					this.points[i] = Math.floor(this.points[i]*factor);
				}
				this.bounds = null;
			}
			/**
			 * �ƶ�
			 * @param {Number} dx �����ƶ�ֵ
			 * @param {Number} dy �����ƶ�ֵ
			 */
			PointList.prototype.performTranslate = function(dx,dy){
				for(var i=0;i<this.size *2;i+=2){
					this.points[i] += dx;
					this.points[i+1] == dy;
				}
				if(this.bounds != null){
					this.bounds.translate(dx,dy);
				}
			}
			/**
			 * �Ƴ����еĵ�
			 */
			PointList.prototype.removeAllPoints = function(){
				//this.points = [];
				this.bounds = null;
				this.size = 0;
			}
			/**
			 * �Ƴ�һ����
			 * @param {int} index ���Ƴ����λ��
			 * @returns �Ƴ��ĵ�
			 * @type Point
			 */
			PointList.prototype.removePoint = function(index){
				this.bounds = null;
				if(index < 0 || index >= this.size){
					throw("PointList--removePoint()-IndexOutofBounds");
				}
				index *= 2;
				var pt = new Point(this.points[index],this.points[index+1]);
				this.points.splice(index,2);
				this.size --;
				return pt;
			}
			/**
			 * �����˳����з�ת
			 */
			PointList.prototype.reverse = function(){
				this.points.reverse();
				var temp;
				for(var i=0;i<this.size *2;i+=2){
					temp = this.points[i];
					this.points[i] = this.points[i+1];
					this.points[i+1] = temp;
				}
			}
			/**
			 * ����һ����
			 * @param {Point} pt �����õ�
			 * @param {int} index ������λ��
			 */
			PointList.prototype.setPoint = function(pt,index){
				if(index < 0 || index >= this.size){
					throw("PointList--setPoint()-IndexOutofBounds");
				}
				if(this.bounds != null && !this.bounds.contains(pt)){
					this.bounds = null;
				}
				index *= 2;
				this.points[index] = pt.x;
				this.points[index+1] = pt.y;
			}
			/**
			 * �����б��С
			 * @param {int} newSize �µĴ�С
			 */
			PointList.prototype.setSize = function(newSize){
				if(this.points.length > newSize *2){
					this.size  = newSize;
					return;
				}
			}
			/**
			 * �õ��б��С
			 * @type int
			 */
			PointList.prototype.getSize = function(){
				return this.size;
			}
			/**
			 * �õ����е�����顣a[2n]Ϊ���x���꣬a[2n+1]Ϊ���������
			 */
			PointList.prototype.toIntArray = function(){
				if(this.points.length  == this.size *2){
					return this.points;
				}
				var old = this.points;
				this.points = [];
				for(var i=0;i<this.size*2;i++){
					this.points.push(old[i]);
				}
				return this.points;
			}
			/**
			 * �ƶ�
			 * @see Point#translate
			 */
			PointList.prototype.translate = function(arg1,arg2){
				if(arg1 != null){
					var x=0;
					var y=0;
					if(Util.isInstanceOf(arg1, Point)){
						x=arg1.x;
						y=arg1.y;
					}else if(arguments.length ==2){
						x = arg1;
						y = arg2;
					}
					if(this.bounds != null){
						this.bounds.translate(x,y);
					}
					for(var i=0;i<this.size *2;i+=2){
						this.points[i] += x;
						this.points[i+1] += y;
					}
				}
			}
			/**
			 * ת��
			 * @see Point#transpose
			 */
			PointList.prototype.transpose = function(){
				var temp;
				if(this.bounds !=null){
					this.bounds.transpose();
				}
				for(var i=0;i<this.size*2;i+=2){
					temp = this.points[i];
					this.points[i]=this.points[i+1];
					this.points[i+1] = temp;
				}
			}
			/**
			 * @see Geometry#polygonContainsPoint
			 */
			PointList.prototype.polygonContainsPoint = function(x,y){
				return Geometry.polygonContainsPoint(this, x, y);
			}
			/**
			 * @see Geometry#polylineContainsPoint
			 */
			PointList.prototype.polylineContainsPoint = function(x,ytolerance){
				return Geometry.polylineContainsPoint(this, x, y, tolerance);
			}
			PointList.prototype.init = function(arg){
				this.points = [];
				this.bounds = null;
				this.size = 0;
				if(arg != null){
					if(arg instanceof Array){
						this.points = arg;
						this.size = arg.length/2;
					}else if(Util.isInstanceOf(arg, PointList)){
						for(var i=0;i<arg.points.length;i++){
							this.points[i] = arg.points[i];
						}
						this.size = arg.size;
					}
				}
				
			}
		}
		PointList._initialized = true;
		_classes.defineClass("PointList",prototypeFunction); 
	}
	this.init(arg);
 }
 
 
 //-----------------------------Class Transform-------
_classes.registerClass("Transform");
/**
 * @class �任
 * @constructor
 */
function Transform(){
	if(typeof Transform._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ��������ֵ
			 * @param {Number} x ��������ֵ
			 * @param {Number} x ��������ֵ
			 */
			Transform.prototype.setScale = function(x,y){
				if(x != null){
					this.scaleX = x;
					if(y!=null){
						this.scaleY = y;
					}else{
						this.scaleY = x;
					}
				}
			}
			/**
			 * ������ת�Ƕ�
			 * @param {Number} angle ��ת�Ƕ�
			 */
			Transform.prototype.setRotation = function(angle){
				this.cos = Math.cos(angle);
				this.sin = Math.sin(angle);
			}
			/**
			 * �����ƶ�ֵ
			 * @param {Number} x �����ƶ�ֵ
			 * @param {Number} y �����ƶ�ֵ
			 */
			Transform.prototype.setTranslation = function(x,y){
				this.dx = x;
				this.dy = y;
			}
			/**
			 * ��һ������б任
			 * @param {Point} p ���任�ĵ�
			 */
			Transform.prototype.getTransformed = function(p){
				var  x = p.x;
				var  y = p.y;
				var  temp;
				x *= this.scaleX;
				y *= this.scaleY;
				temp = x * this.cos - y * this.sin;
				y    = x * this.sin + y * this.cos;
				x = temp;
				return new Point(Math.round(x + this.dx), Math.round(y + this.dy));
			}
			Transform.prototype.init = function(){
				this.parentMethod("init");
				this.scaleX = 1;
				this.scaleY = 1;
				this.dx = 0;
				this.dy = 0;
				this.cos = 1;
				this.sin = 0;
			}
		}
		Transform._initialized = true;
		_classes.defineClass("Transform",prototypeFunction); 
	}

	this.init();
}

 //Transposer
  //-----------------------------Class Transposer-------
_classes.registerClass("Transposer");
/**
 * @class �任��
 * @constructor
 */
function Transposer(){
	if(typeof Transposer._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ����Ϊ������
			 */
			Transposer.prototype.disable = function(){
				this.enabled = false;
			}
			/**
			 * ����Ϊ����
			 */
			Transposer.prototype.enable = function(){
				this.enabled = true;
			}/**
			 * �Ƿ����
			 * @type boolean
			 */
			Transposer.prototype.isEnabled = function(){
				return this.enabled;
			}
			/**
			 * ���ÿ�����
			 * @param {boolean} value �Ƿ����
			 */
			Transposer.prototype.setEnabled = function(value){
				this.enabled = value;
			}
			/**
			 * ����ת��
			 * @param {Dimension|Insets|Point|Rectangle} arg ת����
			 */
			Transposer.prototype.t = function(arg){
				if (this.isEnabled()){
					return arg.getTransposed();
				}
				return arg;
			}
			Transposer.prototype.init = function(){
				this.parentMethod("init");
				this.enabled = false;
			}
		}
		Transposer._initialized = true;
		_classes.defineClass("Transposer",prototypeFunction); 
	}

	this.init();
}
 //-----------------------------Class PositionConstants-------
/**
 * @class �ṩһЩ���õ�λ��ֵ
 * @constructor
 */
 function PositionConstants(){
 }
 /**
  * @static
  * @type Int
  */
 PositionConstants.NONE = 0;
 /**
  * @static
  * @type Int
  */
 PositionConstants.LEFT = 1;
 /**
  * @static
  * @type Int
  */
 PositionConstants.CENTER = 2;
 /**
  * @static
  * @type Int
  */
 PositionConstants.RIGHT = 4;
 /**
  * @static
  * @type Int
  */
 PositionConstants.LEFT_CENTER_RIGHT =  PositionConstants.LEFT |  PositionConstants.CENTER |  PositionConstants.RIGHT;
 /**
  * @static
  * @type Int
  */
 PositionConstants.ALWAYS_LEFT = 64;
 /**
  * @static
  * @type Int
  */
 PositionConstants.ALWAYS_RIGHT = 128;
 /**
  * @static
  * @type Int
  */
 PositionConstants.TOP = 8;
 /**
  * @static
  * @type Int
  */
 PositionConstants.MIDDLE = 16;
 /**
  * @static
  * @type Int
  */
 PositionConstants.BOTTOM = 32;
 /**
  * @static
  * @type Int
  */
 PositionConstants.TOP_MIDDLE_BOTTOM =  PositionConstants.TOP |  PositionConstants.MIDDLE |  PositionConstants.BOTTOM;
 /**
  * @static
  * @type Int
  */
 PositionConstants.NORTH = 1;
 /**
  * @static
  * @type Int
  */
 PositionConstants.SOUTH = 4;
 /**
  * @static
  * @type Int
  */
 PositionConstants.WEST = 8;
 /**
  * @static
  * @type Int
  */
 PositionConstants.EAST = 16;
 /**
  * @static
  * @type Int
  */
 PositionConstants.HORIZONTAL = 64;
 /**
  * @static
  * @type Int
  */
 PositionConstants.VERTICAL = 128;
 /**
  * @static
  * @type Int
  */
 PositionConstants.NORTH_EAST = PositionConstants.NORTH | PositionConstants.EAST;
 /**
  * @static
  * @type Int
  */
 PositionConstants.NORTH_WEST = PositionConstants.NORTH | PositionConstants.WEST;
 /**
  * @static
  * @type Int
  */
 PositionConstants.SOUTH_EAST = PositionConstants.SOUTH | PositionConstants.EAST;
 /**
  * @static
  * @type Int
  */
 PositionConstants.SOUTH_WEST = PositionConstants.SOUTH | PositionConstants.WEST;
 /**
  * @static
  * @type Int
  */
 PositionConstants.NORTH_SOUTH = PositionConstants.NORTH | PositionConstants.SOUTH;
 /**
  * @static
  * @type Int
  */
 PositionConstants.EAST_WEST = PositionConstants.EAST | PositionConstants.WEST;
 /**
  * @static
  * @type Int
  */
 PositionConstants.NSEW = PositionConstants.NORTH_SOUTH | PositionConstants.EAST_WEST;

 //PositionConstants.HORIZONTAL = 0;

 //PositionConstants.VERTICAL = 1;
 /**
FigureUtilities
Color
ColorConstants
*/
 function FigureUtilities(){
 }
 FigureUtilities.RGB_VALUE_MULTIPLIER = 0.6;
 FigureUtilities.ghostFillColor = "#1F1F1F";
 
 //color
 FigureUtilities.darker = function(){
	//TODO
 }
 FigureUtilities.lighter = function(){
	//TODO
 }
 
 //figure
  FigureUtilities.getRoot = function(figure){
	while(figure.getParent() != null){
		figure  = figure.getParent();
	}
	return figure;
}
 //text
 FigureUtilities.getFontMetrics = function(s,f){
	FigureUtilities.setFont(f);
	FigureUtilities.setText(s);
	if(FigureUtilities.metrics == null){
		FigureUtilities.metrics = FigureUtilities.getGraphics().measureText(FigureUtilities.text);
	}
	return FigureUtilities.metrics;
 }
 FigureUtilities.getGraphics = function(){
	if(FigureUtilities.graphics == null){
	var canvasElement =  document.createElement("canvas");
	var context = canvasElement.getContext("2d");
	FigureUtilities.graphics = new Html5Graphics(context);
	FigureUtilities.font = FigureUtilities.graphics.getFont();
	}
	return FigureUtilities.graphics;
}

//html5-canvasֻ�ܵõ�width��heightΪundefined
 FigureUtilities.getTextExtents = function(s,f,result){
	var extents = new Dimension(FigureUtilities.getFontMetrics(s,f).width,FigureUtilities.getFontMetrics(s,f).height);
	if(result != null){
		result.width = extents.width;
		result.height = extents.height;
		return result;
	}else{
		return extents;
	}
}
 FigureUtilities.getTextWidth = function(s,f){
	return FigureUtilities.getFontMetrics(s,f).width;
}
 FigureUtilities.setFont = function(f){
	if(FigureUtilities.font == f){
		return;
	}
	if(f == null){
		f = "12px sans-serif";
	}
	FigureUtilities.getGraphics().setFont(f);
	FigureUtilities.font = f;
	FigureUtilities.metric = null;
}
FigureUtilities.setText = function(text){
	if(FigureUtilities.text == text){
		return;
	}
	FigureUtilities.text = text;
	FigureUtilities.metrics = null;
}
//shape
 FigureUtilities.makeGhostShape = function(shape){
	shape.setBackgroundColor(FigureUtilities.ghostFillColor);
	shape.setFillXOR(true);
	shape.setOutlineXOR(true);
	return shape;
}


 _classes.registerClass("Color");
 /**
  * @class ��ɫ
  * @constructor
  * @param {int} red ��ɫֵ��0-255��
  * @param {int} green ��ɫֵ��0-255��
  * @param {int} blue ��ɫֵ��0-255��
  * @param {Number} alpha ͸���ȣ�0-1��
  * @returns
  */
function Color(red,green,blue,alpha){
	if(typeof Color._initialized == "undefined"){
		function prototypeFunction () {
			
			Color.prototype.isOpaque = function(){
				return false;
			}
			/**
			 * �ж�����ɫ�Ƿ����
			 * @param {Object} o ��һ����ɫ
			 * @returns �������������ɫֵ�򷵻�false��������������ж���������Ƿ����
			 * @type boolean
			 */
			Color.prototype.equals = function(o){
				if(o == this) return true;
				if(o == null) return false;
				if(!Util.isInstanceOf(o, Color)) return false;
				return o.red == this.red && o.green == this.green && o.blue == this.blue && o.alpha == this.alpha;
			}
			/**
			 * ת����"#000000"����ʽ
			 * @returns CSS��ʽ����ɫֵ
			 * @type String
			 */
			Color.prototype.toCSS = function(){
				return new String("#"+this.toHexaString(this.red)+this.toHexaString(this.green)+this.toHexaString(this.blue)).toUpperCase();
			}
			/**
			 * ת����"rgb(255,255,255)"����ʽ
			 * @returns rgb��ʽ����ɫֵ
			 * @type String
			 */
			Color.prototype.toRGB = function(){
				return "rgb("+this.red+","+this.green+","+this.blue+")";
			}
			/**
			 * ת����"rgba(255,255,255,1)"����ʽ
			 * @returns rgba��ʽ����ɫֵ
			 * @type String
			 */
			Color.prototype.toRGBA = function(){
				return "rgba("+this.red+","+this.green+","+this.blue+","+this.alpha+")";
			}
			Color.prototype.toHexaString = function(num){
				var string;
				if(num >15){
					string= num.toString(16);
				}else{
					string ="0"+num.toString(16);
				}
				return string;
			}
			Color.prototype.init = function(red,green,blue,alpha){
				if(red != null){
					this.red = red;
				}else{
					this.red = 0;
				}
				if(green != null){
					this.green = green;
				}else{
					this.green = 0;
				}
				if(blue != null){
					this.blue = blue;
				}else{
					this.blue = 0;
				}
				if(alpha != null){
					this.alpha = alpha;
				}else{
					this.alpha = 1;
				}
			}
		}
		Color._initialized = true;
		_classes.defineClass("Color",prototypeFunction); 
	}
	this.init(red,green,blue,alpha);
}
/**
 * ����ɫ�ַ���������Color����
 * @static
 * @param {String|int} style ��ɫֵ�����������ֻ��ַ��� ֧�ָ�ʽ����:"#000000";"rgb(255,255,255)";"rgba(255,255,255,1)";12632256
 * @returns ������������ɫ����
 * @type Color
 */
Color.parse = function(style){
	if(style == null){
		return ;
	}
	if(!isNaN(style)){
		return Color.parseNumber(style);
	}
	var reg_rgba=/rgba/;
	if(reg_rgba.exec(style) != null){
		return Color.parseRGBA(style);
	}
	var reg_css = /#/;
	if(reg_css.exec(style) != null){
		return Color.parseCSS(style);
	}
}
Color.parseCSS = function(style){
	if(style == null){
		return ;
	}
	style = new String(style);
	var index = style.indexOf("#")+1;
	var red_string = style.substring(index,index+2);
	var green_string = style.substring(index+2,index+4);
	var blue_string = style.substring(index+4,index+6);
	return new Color(parseInt(red_string,16),parseInt(green_string,16),parseInt(blue_string,16));
}
Color.parseRGBA = function(style){
	if(style == null){
		return;
	}
	style = new String(style);
	var index = style.indexOf("rgba(");
	var red_index = index + 5;
	var green_index = style.indexOf(",",red_index) +1;
	var blue_index = style.indexOf(",",green_index) +1;
	var alpha_index = style.indexOf(",",blue_index) +1;
	var end_index = style.indexOf(")");
	var red_string = style.substring(red_index,green_index-1);
	var green_string = style.substring(green_index,blue_index-1);
	var blue_string = style.substring(blue_index,alpha_index-1);
	var alpha_string = style.substring(alpha_index,end_index);
	return new Color(parseInt(red_string),parseInt(green_string),parseInt(blue_string),parseFloat(alpha_string));
}
Color.parseNumber = function(color){
	if(color < 0 ){
		color = color>>>0;
	}
	var red = (color>>16);
	var green_blue = color-(red<<16);
	var green = green_blue>>8;
	var blue = green_blue - (green<<8);
	return new Color(red,green,blue);
}


/**
 * @class ��ɫֵ����
 * @constructor
 */
var ColorConstants = {};
/**
 * @static
 * @type 
 */
 ColorConstants.white      = new Color(255, 255, 255);
 /**
  * @static
  * @type 
  */
 ColorConstants.lightGray  = new Color(192, 192, 192);
 /**
  * @static
  * @type 
  */
 ColorConstants.gray       = new Color(128, 128, 128);
 /**
  * @static
  * @type 
  */
 ColorConstants.darkGray   = new Color( 64,  64,  64);
 /**
  * @static
  * @type 
  */
 ColorConstants.black      = new Color(  0,   0,   0);
 /**
  * @static
  * @type 
  */
 ColorConstants.red        = new Color(255,   0,   0);
 /**
  * @static
  * @type 
  */
 ColorConstants.orange     = new Color(255, 196,   0);
 /**
  * @static
  * @type 
  */
 ColorConstants.yellow     = new Color(255, 255,   0);
 /**
  * @static
  * @type 
  */
 ColorConstants.green      = new Color(  0, 255,   0);
 /**
  * @static
  * @type 
  */
 ColorConstants.lightGreen = new Color( 96, 255,  96);
 /**
  * @static
  * @type 
  */
 ColorConstants.darkGreen  = new Color(  0, 127,   0);
 /**
  * @static
  * @type 
  */
 ColorConstants.cyan       = new Color(  0, 255, 255);
 /**
  * @static
  * @type 
  */
 ColorConstants.lightBlue  = new Color(127, 127, 255);
 /**
  * @static
  * @type 
  */
 ColorConstants.blue       = new Color(  0,   0, 255);
 /**
  * @static
  * @type 
  */
 ColorConstants.darkBlue   = new Color(  0,   0, 127);
 
 ColorConstants.buttonLightest     = new Color(255, 255, 255);
 ColorConstants.button    	 = new Color(240, 240, 240);
 ColorConstants.buttonDarker     = new Color(160, 160, 160);
 ColorConstants.buttonDarkest     = new Color(105, 105, 105);
 ColorConstants.listBackground     = new Color(255, 255, 255);
 ColorConstants.listForeground     = new Color(0, 0, 0);
 ColorConstants.menuBackground     = new Color(240, 240, 240);
 ColorConstants.menuForeground     = new Color(0, 0, 0);
 ColorConstants.menuBackgroundSelected     = new Color(51, 153, 255);
 ColorConstants.menuForegroundSelected     = new Color(255, 255, 255);
 ColorConstants.titleBackground     = new Color(153, 180, 209);
 ColorConstants.titleGradient     = new Color(185, 209, 234);
 ColorConstants.titleForeground     = new Color(0, 0, 0);
 ColorConstants.titleInactiveForeground     = new Color(67, 78, 84);
 ColorConstants.titleInactiveBackground     = new Color(191, 205, 219);
 ColorConstants.titleInactiveGradient     = new Color(215, 228, 242);
 ColorConstants.tooltipForeground     = new Color(0, 0, 0);
 ColorConstants.tooltipBackground     = new Color(255, 255, 225);/**
load-dependencies:Geometry.js
**************
AbstractBorder
---AbstractBackground
---AbstractLabeledBorder
---CompoundBorder
---FocusBorder (paint��δʵ��)
---LineBorder
---MarginBorder

*/



//-----------------------------Class AbstractBorder-------
 _classes.registerClass("AbstractBorder");
 /**
  * @class ����߿�
  * @constructor 
  * @returns
  */
 function AbstractBorder(){
	if(typeof AbstractBorder._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ���ͼ��
			 */
			AbstractBorder.prototype.getPaintRectangle = function(figure,insets){
				AbstractBorder.tempRect.setBounds(figure.getBounds());
				return AbstractBorder.tempRect.crop(insets);
			}
			/**
			 * �õ���ѡ��С
			 */
			AbstractBorder.prototype.getPreferredSize = function(f){
				return  AbstractBorder.EMPTY;
			}
			/**
			 * �Ƿ�͸��
			 * @returns false
			 */
			AbstractBorder.prototype.isOpaque = function(){
				return false;
			}
			AbstractBorder.prototype.init = function(){
				
			}
		}
		AbstractBorder._initialized = true;
		_classes.defineClass("AbstractBorder",prototypeFunction); 
	}
	
	
	this.init();
 }
 AbstractBorder.EMPTY = new Dimension(0,0);
 AbstractBorder.tempRect =  new Rectangle(0,0,0,0);
 
 
 //-----------------------------Class AbstractBackground-------
 _classes.registerClass("AbstractBackground","AbstractBorder");
 function AbstractBackground(){
	if(typeof AbstractBackground._initialized == "undefined"){
		function prototypeFunction () {
			AbstractBackground.prototype.getInsets = function(figure){
				return Figure.NO_INSETES;
			}
			AbstractBackground.prototype.paint = function(figure,graphics,insets){
			}
			AbstractBackground.prototype.paintBackground = function(figure,graphics,insets){
			}
			AbstractBackground.prototype.init = function(){
			}
		}
		AbstractBackground._initialized = true;
		_classes.defineClass("AbstractBackground",prototypeFunction); 
	}
	this.init();
 }
 
  //-----------------------------Class AbstractLabeledBorder-------
 _classes.registerClass("AbstractLabeledBorder","AbstractBorder");
 /**
  * @class ����ı�ǩ��
  * @constructor
  * @extends AbstractBorder
  * @param {String} s ��ǩ����
  */
 function AbstractLabeledBorder(s){
	if(typeof AbstractLabeledBorder._initialized == "undefined"){
		function prototypeFunction () {
			AbstractLabeledBorder.prototype.calculateInsets = function(figure){
			}
			/**
			 * �õ�����
			 * @type String
			 */
			AbstractLabeledBorder.prototype.getFont = function(figure){
				if(this.font == null){
					return f.getFont();
				}
				return this.font;
			}
			/**
			 * �õ�����ֵ
			 * @type Insets
			 */
			AbstractLabeledBorder.prototype.getInsets = function(figure){
				if (this.insets == null){
					this.insets = this.calculateInsets(figure);
				}
				return this.insets;
			}
			/**
			 * �õ�����ʾ������
			 * @type String
			 */
			AbstractLabeledBorder.prototype.getLabel = function(){
				return this.label;
			}
			/**
			 * �õ���ѡ��С
			 * @type Dimension
			 */
			AbstractLabeledBorder.prototype.getPreferredSize = function(fig){
				return new Dimension(this.getTextExtents(fig));
			}
			/**
			 * �õ��ı���ɫ
			 * @type Color
			 */
			AbstractLabeledBorder.prototype.getTextColor = function(){
				return this.textColor;
			}
			/**
			 * �õ��ı���С
			 * @type Dimension
			 */
			AbstractLabeledBorder.prototype.getTextExtents = function(f){
				if (this.textExtents == null){
					this.textExtents = FigureUtilities.getTextExtents(this.label, this.getFont(f));
				}
				return this.textExtents;
			}
			/**
			 * ʹ�߿���Ч
			 */
			AbstractLabeledBorder.prototype.invalidate = function(){
				this.insets = null;
				this.textExtents = null;
			}
			/**
			 * ��������
			 * @param {String} font �µ�����
			 */
			AbstractLabeledBorder.prototype.setFont = function(font){
				this.font = font;
				this.invalidate();
			}
			/**
			 * �����ı�
			 * @param {String} s
			 */
			AbstractLabeledBorder.prototype.setLabel = function(s){
				this.label = ((s == null) ? "" : s);
				this.invalidate();
			}
			/**
			 * �����ı���ɫ
			 * @param {Color} color �µ��ı���ɫ
			 */
			AbstractLabeledBorder.prototype.setTextColor = function(color){
				this.textColor = color;
			}
			AbstractLabeledBorder.prototype.init = function(s){
				this.textExtents = null;
				this.label = null;
				this.insets = null;
				this.textColor = ColorConstants.black;
				this.font = null;
				this.setLabel(s);
			}
		}
		AbstractLabeledBorder._initialized = true;
		_classes.defineClass("AbstractLabeledBorder",prototypeFunction); 
	}
	this.init(s);
 }
 
 
 
  //-----------------------------Class CompoundBorder-------
 _classes.registerClass("CompoundBorder","AbstractBorder");
 /**
  * @class
  * @constructor
  * @extends AbstractBorder
  * @param outer
  * @param inner
  * @returns
  */
 function CompoundBorder(outer,inner){
	if(typeof CompoundBorder._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ��ڲ��ı߿�
			 */
			CompoundBorder.prototype.getInnerBorder = function(){
				return this.inner;
			}
			/**
			 * �õ�����ֵ
			 * @param {Figure} figure ��Ҫ���Ʊ߿��ͼ��
			 */
			CompoundBorder.prototype.getInsets = function(figure){
				var insets = null;
				if (this.inner != null){
					insets = this.inner.getInsets(figure);
				}else{
					insets = new Insets();
				}
				if(this.outer != null){
					var moreInsets = this.outer.getInsets(figure);
					insets = insets.getAdded(moreInsets);
				}
				return insets;
			}
			CompoundBorder.prototype.getPreferredSize = function(fig){
				var prefSize = new Dimension(this.inner.getPreferredSize(fig));
				var outerInsets = this.outer.getInsets(fig);
				prefSize.expand(outerInsets.getWidth(), outerInsets.getHeight());
				prefSize.union(this.outer.getPreferredSize(fig));
				return prefSize;
			}
			/**
			 * �õ��ⲿ�ı߿�
			 */
			CompoundBorder.prototype.getOuterBorder = function(){
				return this.outer;
			}
			CompoundBorder.prototype.isOpaque = function(){
				return ((this.inner != null) ? this.inner.isOpaque() : false) && ((this.outer != null) ? this.outer.isOpaque() : false);
			}

			/**
			 * @param {Figure} figure ��Ҫ���Ʊ߿��ͼ��
			 * @param {Html5Graphics} graphics ��ͼ��
			 * @param {Insets} insets ���Ʊ߿�ʱʹ�õĲ���ֵ
			 */
			CompoundBorder.prototype.paint = function(figure,graphics,insets){
				if (this.outer != null) {
					graphics.saveState();
					this.outer.paint(figure,graphics,insets);
					graphics.restoreState();
					insets = insets.getAdded(this.outer.getInsets(figure));
				}
				if(this.inner != null){
					this.inner.paint(figure, graphics, insets);
				}
			}
			CompoundBorder.prototype.init = function(outer,inner){
				this.inner = inner;
				this.outer = outer;
			}
		}
		CompoundBorder._initialized = true;
		_classes.defineClass("CompoundBorder",prototypeFunction); 
	}
	this.init(outer,inner);
 }
 
  //-----------------------------Class FocusBorder-------
 _classes.registerClass("FocusBorder","AbstractBorder");
 function FocusBorder(){
	if(typeof FocusBorder._initialized == "undefined"){
		function prototypeFunction () {
			FocusBorder.prototype.getInsets = function(figure){
				return new Insets(1);
			}
			FocusBorder.prototype.paint = function(figure,graphics,insets){
				AbstractBorder.tempRect.setBounds(this.getPaintRectangle(figure, insets));
				AbstractBorder.tempRect.width--;
				AbstractBorder.tempRect.height--;
				graphics.setStrokeColor(ColorConstants.black);
				graphics.setFillColor(ColorConstants.black);
				graphics.drawFocus(AbstractBorder.tempRect); //TODO
			}
			FocusBorder.prototype.isOpaque = function(){
				return true;
			}
			FocusBorder.prototype.init = function(){
			}
		}
		FocusBorder._initialized = true;
		_classes.defineClass("FocusBorder",prototypeFunction); 
	}
	this.init();
 }
 
 
 //-----------------------------Class LineBorder-------
 //���ڱ߿򣬿��Կ���ʹ����Ԫģʽ���иĽ�
 _classes.registerClass("LineBorder","AbstractBorder");
 /**
  * @class ���Ա߿�
  * @constructor
  * @extends AbstractBorder
  * @param {Number} width  �߿�Ŀ��
  * @param {Color} color �߿����ɫ
  * @returns
  */
 function LineBorder(width,color){
	if(typeof LineBorder._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * @type Color
			 */
			LineBorder.prototype.getColor = function(){
				return this.color;
			}
			/**
			 * @param {Figure} figure ��Ҫ���Ʊ߿��ͼ��
			 * @type Insets
			 */
			LineBorder.prototype.getInsets = function(figure){
				return new Insets(this.getWidth());
			}
			/**
			 * @type Number
			 */
			LineBorder.prototype.getWidth = function(){
				return this.width;
			}
			/**
			 * ���Ʊ߿�
			 * @param {Figure} figure
			 * @param {Html5Graphics} graphics
			 * @param {Insets} insets
			 */
			LineBorder.prototype.paint = function(figure,graphics,insets){
				AbstractBorder.tempRect.setBounds(this.getPaintRectangle(figure, insets));
				if(this.getWidth() %2 == 1){
					AbstractBorder.tempRect.width--;
					AbstractBorder.tempRect.height--;
				}
				AbstractBorder.tempRect.shrink(this.getWidth() / 2, this.getWidth() / 2);
				graphics.setLineWidth(this.getWidth());
				if(this.getColor()!=null){
					graphics.setStrokeColor(this.getColor());
				}
				var temp = AbstractBorder.tempRect;
				graphics.strokeRect(temp.x,temp.y,temp.width,temp.height);
			}
			/**
			 * ���ñ߿���ɫ
			 */
			LineBorder.prototype.setColor = function(color){
				this.color = color;
			}
			/**
			 * ���ñ߿���
			 */
			LineBorder.prototype.setWidth = function(width){
				if(width > 0){
					this.width = width;
				}
			}
			LineBorder.prototype.isOpaque = function(){
				return true;
			}
			LineBorder.prototype.init = function(width,color){
				this.parentMethod("init");
				this.width = 1;
				this.setWidth(width);
				this.setColor(color);
				
			}
		}
		LineBorder._initialized = true;
		_classes.defineClass("LineBorder",prototypeFunction); 
	}
	this.init(width,color);
 }
 
   //-----------------------------Class MarginBorder-------
 _classes.registerClass("MarginBorder","AbstractBorder");
 /**
  * maginBorderֻ������ռλ����������κζ���
  *
  */
 function MarginBorder(arg1,arg2,arg3,arg4){
	if(typeof MarginBorder._initialized == "undefined"){
		function prototypeFunction () {
			MarginBorder.prototype.getInsets = function(figure){
				return this.insets;
			}
			MarginBorder.prototype.paint = function(figure,graphics,insets){
			}
			MarginBorder.prototype.init = function(arg1,arg2,arg3,arg4){
				if(arg1 != null){
					if(Util.isInstanceOf(arg1, Insets)){
						this.insets = arg1;
					}else if(arg2!=null && arg3!=null && arg4 != null){
						this.insets = new Insets(arg1,arg2,arg3,arg4);
					}else{
						this.insets = new Insets(arg1);
					}
				}
			}
		}
		MarginBorder._initialized = true;
		_classes.defineClass("MarginBorder",prototypeFunction); 
	}
	this.init(arg1,arg2,arg3,arg4);
 }
 
 

 //-----------------------------Class Scheme-------
 _classes.registerClass("Scheme");
 function Scheme(highlight,shadow){
	if(typeof Scheme._initialized == "undefined"){
		function prototypeFunction () {
			Scheme.prototype.calculateInsets = function(){
				var tl = this.highlight.length;
				var br = this.shadow.length;
				return new Insets(tl, tl, br, br);
			}
			Scheme.prototype.calculateOpaque = function(){
				var colors = this.highlight;
				for (var i = 0; i < colors.length; i++)
						if (colors[i] == null)
							return false;
				colors = this.shadow;
				for (i = 0; i < colors.length; i++)
					if (colors[i] == null)
						return false;
				return true;
			}
			Scheme.prototype.initialize = function(){
				this.insets = this.calculateInsets();
				this.isOpaque = this.calculateOpaque();
			}
			Scheme.prototype.init = function(highlight,shadow){
				this.insets = null;
				this.isOpaque = false;
				this.highlight = highlight||[];
				this.shadow = shadow||highlight||[];
				this.initialize();
			}
		}
		Scheme._initialized = true;
		_classes.defineClass("Scheme",prototypeFunction); 
	}
	this.init(highlight,shadow);
 }
	
	
    //-----------------------------Class SchemeBorder-------
 _classes.registerClass("SchemeBorder","AbstractBorder");
 function SchemeBorder(scheme){
	if(typeof SchemeBorder._initialized == "undefined"){
		function prototypeFunction () {
			SchemeBorder.prototype.getInsets = function(figure){
				return this.scheme.insets;
			}
			SchemeBorder.prototype.isOpaque = function(){
				return true;
			}
			SchemeBorder.prototype.paint = function(figure,graphics,insets){
				this.internal_paint(graphics, figure, insets, this.scheme.highlight, this.scheme.shadow);
			}
			SchemeBorder.prototype.internal_paint = function(graphics,fig,insets,tl,br){
				graphics.setLineWidth(1);
				//graphics.setLineStyle(Graphics.LINE_SOLID);
				var rect = this.getPaintRectangle(fig, insets);
				
				var top = rect.y;
				var left = rect.x;
				var bottom = rect.bottom() - 1;
				var right = rect.right() - 1;
				var color;
				var i = 0;
				graphics.beginPath();
				for (; i < br.length; i++) {
					color = br[i];
					graphics.setStrokeColor(color);
					graphics.moveTo(right - i, bottom - i);
					graphics.lineTo(right - i, top + i);
					graphics.moveTo(right - i, bottom - i);
					graphics.lineTo(left + i, bottom - i);
				}
				graphics.stroke();
				right--;
				bottom--;
				graphics.beginPath();
				for ( i = 0; i < tl.length; i++) {
					color = tl[i];
					graphics.setStrokeColor(color);
					graphics.moveTo(left + i, top + i);
					graphics.lineTo(right - i, top + i);
					graphics.moveTo(left + i, top + i);
					graphics.lineTo(left + i, bottom - i);
				}
				graphics.stroke();
			}
			SchemeBorder.prototype.init = function(scheme){
				this.scheme = scheme;
			}
		}
		SchemeBorder._initialized = true;
		_classes.defineClass("SchemeBorder",prototypeFunction); 
	}
	this.init(scheme);
 }
 SchemeBorder.DARKEST_DARKER = [ColorConstants.buttonDarkest, ColorConstants.buttonDarker];
 SchemeBorder.LIGHTER_DARKER = [ColorConstants.buttonLightest, ColorConstants.buttonDarker];
 SchemeBorder.DARKER_LIGHTER = [ColorConstants.buttonDarker, ColorConstants.buttonLightest];
 
 SchemeBorder.SCHEMES = {
	BUTTON_CONTRAST: new Scheme([ColorConstants.button, ColorConstants.buttonLightest], SchemeBorder.DARKEST_DARKER), 
	BUTTON_RAISED : new Scheme([ColorConstants.buttonLightest], SchemeBorder.DARKEST_DARKER),
	BUTTON_PRESSED : new Scheme(SchemeBorder.DARKEST_DARKER,[ColorConstants.buttonLightest]), 
	RAISED : new Scheme([ColorConstants.buttonLightest],[ColorConstants.buttonDarkest]), 
	LOWERED : new Scheme([ColorConstants.buttonDarkest],[ColorConstants.buttonLightest]), 
	RIDGED : new Scheme(SchemeBorder.LIGHTER_DARKER, SchemeBorder.DARKER_LIGHTER), 
	ETCHED : new Scheme(SchemeBorder.DARKER_LIGHTER, SchemeBorder.LIGHTER_DARKER)
	};

	
	
     //-----------------------------Class ButtonScheme-------
 _classes.registerClass("ButtonScheme","Scheme");
 function ButtonScheme(highlight,shadow,highlightPressed,shadowPressed){
	if(typeof ButtonScheme._initialized == "undefined"){
		function prototypeFunction () {
			ButtonScheme.prototype.calculateInsets = function(){
				var tl = Math.max(this.highlight.length, this.shadowPressed.length);
				var br = 1 + Math.max(this.shadow.length,
					this.highlightPressed.length);
				return new Insets(tl, tl, br, br);
			}
			ButtonScheme.prototype.calculateOpaque = function(){
				this.isa = "ButtonScheme";
				if (!this.parentMethod('calculateOpaque'))
					return false;
				if (this.highlight.length != this.shadowPressed.length)
					return false;
				if (this.shadow.length != this.highlightPressed.length)
					return false;
				var colors = this.highlightPressed;
				for (var i = 0; i < colors.length; i++)
				if (colors[i] == null)
					return false;
				colors = this.shadowPressed;
				for ( i = 0; i < colors.length; i++)
					if (colors[i] == null)
						return false;
				return true;
			}
			ButtonScheme.prototype.initialize = function(){
				this.insets = this.calculateInsets();
				this.isOpaque = this.calculateOpaque();
			}
			ButtonScheme.prototype.init = function(highlight,shadow,highlightPressed,shadowPressed){
				this.highlight = highlight;
				this.shadow = shadow;
				this.highlightPressed = highlightPressed || highlight;
				this.shadowPressed = highlightPressed || shadow;
				this.initialize();
			}
		}
		ButtonScheme._initialized = true;
		_classes.defineClass("ButtonScheme",prototypeFunction); 
	}
	this.init(highlight,shadow,highlightPressed,shadowPressed);
 }
 
	
     //-----------------------------Class ButtonBorder-------
 _classes.registerClass("ButtonBorder","SchemeBorder");
 function ButtonBorder(scheme){
	if(typeof ButtonBorder._initialized == "undefined"){
		function prototypeFunction () {
			ButtonBorder.prototype.paint = function(figure,graphics,insets){
				var clickable = figure;
				var model = clickable.getModel();
				var colorScheme = this.scheme;
				if (clickable.isRolloverEnabled() && !model.isMouseOver()
					&& !model.isSelected())
					return;
				var tl,br;
				if (model.isSelected() || model.isArmed()) {
					tl = colorScheme.shadowPressed;
					br = colorScheme.highlightPressed;
				} else {
					tl = colorScheme.highlight;
					br = colorScheme.shadow;
				}
				this.internal_paint(graphics, figure, insets, tl, br);
			}
			ButtonBorder.prototype.init = function(scheme){
				this.scheme = scheme || ButtonBorder.SCHEMES.BUTTON;
			}
		}
		ButtonBorder._initialized = true;
		_classes.defineClass("ButtonBorder",prototypeFunction); 
	}
	this.init(scheme);
 }
 ButtonBorder.SCHEMES = {
	BUTTON_CONTRAST : new ButtonScheme([ColorConstants.button,ColorConstants.buttonLightest], SchemeBorder.DARKEST_DARKER),
	BUTTON : new ButtonScheme([ ColorConstants.buttonLightest ],SchemeBorder.DARKEST_DARKER),
	TOOLBAR : new ButtonScheme([ColorConstants.buttonLightest],[ColorConstants.buttonDarker]),
	BUTTON_SCROLLBAR : new ButtonScheme([ColorConstants.button,ColorConstants.buttonLightest], SchemeBorder.DARKEST_DARKER, [ColorConstants.buttonDarker],[ColorConstants.buttonDarker ])
 }
/**
* @fileoverview ���ļ��д����html5Graphics��
* @author jiangqifan
* @version 0.1
*/


_classes.registerClass("Html5Graphics");
/**
* ����һ���µ�Html5Graphics.
* @class ����html5 canvas��ͼ��.
* @constructor
* @return һ���µ�Html5Graphics����
* @param (2dContext) ��Ҫ��canvas��2d��ͼ������
* @param (Rectangle) ���ڳ�ʼ���ü��ľ��Σ�����Ϊ�ա�
*/
function Html5Graphics (context,rect){
	
	
	if(typeof Html5Graphics._initialized == "undefined"){
		function prototypeFunction () {
			Html5Graphics.prototype.setAntialias = function(antialias){
			}
			/**
			* ����״̬
			*/
			Html5Graphics.prototype.saveState = function(){
				this.context.save();
				this.stack.push(new Rectangle(this.currentClip));
				this.stackPointer++;
				this.scaleStack.push({x:this.currentScale.x,y:this.currentScale.y});
				
			}
			/**
			* ����״̬
			*/
			Html5Graphics.prototype.pushState = function(){
				this.context.save();
				this.stack.push(new Rectangle(this.currentClip));
				this.stackPointer++;
				this.scaleStack.push({x:this.currentScale.x,y:this.currentScale.y});
			}
			/**
			* �ָ�״̬
			*/
			Html5Graphics.prototype.restoreState = function(){
				this.currentClip= this.stack.pop();
				this.stackPointer--;
				this.currentScale = this.scaleStack.pop();
				this.context.restore();
			}
			/**
			* ��ת
			* @param {Number} angle ��ת�Ƕ�
			*/
			Html5Graphics.prototype.rotate = function(angle){
				this.context.rotate(angle);
			}
			/**
			* ����
			* @param {Number} x �������ű���
			* @param {Number} y �������ű���
			*/
			Html5Graphics.prototype.scale = function(x,y){
				this.context.scale(x,y);
				
				if(x != 0 && x != 1){
					this.currentScale.x *= x;
				}
				if(y != 0 && y != 1){
					this.currentScale.y *= y;
				}
				//this.currentClip.scale(x,y);
			}
			
			Html5Graphics.prototype.setTransform = function(m11, m12,m21, m22,dx,dy){
				this.context.setTransform(m11, m12,m21, m22,dx,dy);
			}
			Html5Graphics.prototype.transform = function(m11, m12,m21,m22,dx,dy){
				this.context.transform(m11, m12,m21,m22,dx,dy);
			}
			/**
			* �ƶ�����ϵ
			* @param {Number} dx �����ƶ�ֵ
			* @param {Number} dy �����ƶ�ֵ
			*/
			Html5Graphics.prototype.translate = function(dx,dy){
				if(dx ==0 && dy == 0){
					return;
				}
				this.context.translate(dx,dy);
				if(this.currentClip){
					this.currentClip.translate(-dx*this.currentScale.x,-dy*this.currentScale.y);
				}
				
			}
			
			
			// compositing
			
			/**
			* ��ȡȫ��͸����,Ĭ��״̬��Ϊ1.0
			* @returns ��ǰ��ȫ��͸����
			* @type Number
			*/
			Html5Graphics.prototype.getGlobalAlpha = function(){
				return this.context.globalAlpha;
			}
			/**
			* ����ȫ��͸����
			* @param {Number} globalAlpha �µ�ȫ��͸����
			*/
			Html5Graphics.prototype.setGlobalAlpha = function(globalAlpha){
				this.context.globalAlpha = globalAlpha;
			}
			/**
			* ��ȡ���Ƿ�ʽ,Ĭ��״̬��Ϊsource-over
			* @returns ��ǰ�ĸ��Ƿ�ʽ
			* @type String
			*/
			Html5Graphics.prototype.getGlobalCompositeOperation = function(){
				return this.context.globalCompositeOperation;
			}
			/**
			* ���ø��Ƿ�ʽ
			* @param {String} globalCompositeOperation �µĸ��Ƿ�ʽ�����õ�ֵΪ��source-over;destination-over;source-atop;destination-atop;source-in;destination-in;source-out;destination-out;lighter;darker;copy;xor
			*/
			Html5Graphics.prototype.setGlobalCompositeOperation = function(globalCompositeOperation){
				this.context.globalCompositeOperation = globalCompositeOperation;
			}
			
			
			// colors and styles
			
			//fillStyle (default black)
			/**
			* ��ȡ��ǰ����䷽ʽ,Ĭ��״̬��Ϊ#000000
			* @returns ��ǰ����䷽ʽ
			* @type String|Object
			*/
			Html5Graphics.prototype.getFillStyle = function(){
				return this.context.fillStyle;
			}
			/**
			 * ������䷽ʽ
			 * @see #getFillStyle
			 * @param {String|Object} �µ���䷽ʽ
			 */
			Html5Graphics.prototype.setFillStyle = function(fillStyle){
				this.context.fillStyle = fillStyle;
			}
			//strokeStyle  (default black)

			/**
			 * �õ��ʻ����
			 * @returns ��ǰ�Ļ��ʷ��
			 * @type String|Object
			 */
			Html5Graphics.prototype.getStrokeStyle = function(){
				return this.context.strokeStyle;
			}
			/**
			 * ���û��ʷ��
			 * @see #getStrokeStyle
			 * @param {String|Object} �µĻ��ʷ��
			 */
			Html5Graphics.prototype.setStrokeStyle = function(strokeStyle){
				this.context.strokeStyle = strokeStyle;
			}
			/**
			 * �������Խ���
			 */
			Html5Graphics.prototype.createLinearGradient = function( x0, y0, x1, y1){
				return this.context.createLinearGradient( x0, y0, x1, y1);
			}
			/**
			 * �������佥��
			 */
			Html5Graphics.prototype.createRadialGradient = function(x0, y0, r0, x1, y1, r1){
				return this.context.createRadialGradient(x0, y0, r0, x1, y1, r1);
			}
			Html5Graphics.prototype.createPattern = function(image,repetition){
				return this.context.createPattern(image,repetition);
			}
			Html5Graphics.prototype.addColorsToGrad = function(grad,colors){
				for(var i = 0;i<colors.length;i++){
					grad.addColorStop(i/colors.length,colors[i].toRGB());
				}
				return grad;
			}
			/**
			 * ���������ɫ
			 * @param {Color} color
			 */
			Html5Graphics.prototype.setFillColor = function(color){
				if(color == null){
					return;
				}
				var fillStyle = color.toRGBA();
				this.context.fillStyle = fillStyle;
			}
			/**
			 * �õ���ǰ�������ɫ
			 * @type Color
			 */
			Html5Graphics.prototype.getFillColor = function(){
				var fillStyle = this.context.fillStyle;
				return Color.parse(fillStyle);
			}
			/**
			 * ���û�����ɫ
			 * @param {Color} color
			 */
			Html5Graphics.prototype.setStrokeColor = function(color){
				if(color == null){
					return;
				}
				var strokeStyle = color.toCSS();
				this.context.strokeStyle = strokeStyle;
			}
			/**
			 * �õ���ǰ������ɫ
			 * @type Color
			 */
			Html5Graphics.prototype.getStrokeColor = function(){
				var strokeStyle = context.strokeStyle;
				return Color.parseCSS(strokeStyle);
			}
			// line styles

			//lineCap "butt", "round", "square" (default "butt")
			/**
			 * 
			 */
			Html5Graphics.prototype.getLineCap = function(){
				return this.context.lineCap;
			}
			/**
			 * 
			 */
			Html5Graphics.prototype.setLineCap = function(lineCap){
				this.context.lineCap = lineCap;
			}
			//lineJoin  "miter", "round", "bevel" (default "miter")
			/**
			 * 
			 */
			Html5Graphics.prototype.getLineJoin = function(){
				return this.context.lineJoin;
			}
			/**
			 * 
			 */
			Html5Graphics.prototype.setLineJoin = function(lineJoin){
				this.context.lineJoin = lineJoin;
			}
			//lineWidth  (default 1)
			/**
			 * 
			 */
			Html5Graphics.prototype.getLineWidth = function(){
				return this.context.lineWidth;
			}
			/**
			 * 
			 */
			Html5Graphics.prototype.setLineWidth = function(lineWidth){
				this.context.lineWidth = lineWidth;
			}
			//miterLimit  (default 10)
			/**
			 * 
			 */
			Html5Graphics.prototype.getMiterLimit = function(){
				return this.context.miterLimit;
			}
			/**
			 * 
			 */
			Html5Graphics.prototype.setMiterLimit = function(miterLimit){
				this.context.miterLimit = miterLimit;
			}
			/**
			 * ������������
			 * @param {LineAtrributes} lineAttributes
			 */
			Html5Graphics.prototype.setLineAttributes = function(lineAttributes){
				if(lineAttributes == null){
					return;
				}
				var lineCap = lineAttributes.lineCap.toLowerCase();
				if(lineCap == "butt"|| lineCap == "round" || lineCap == "square"){
					this.context.lineCap = lineAttributes.lineCap;
				}
				var lineJoin = lineAttributes.lineJoin.toLowerCase();
				if(lineJoin == "miter" || lineJoin == "round" ||lineJoin == "bevel"){
					this.context.lineJoin = lineAttributes.lineJoin;
				}
				if(lineAttributes.lineWidth > 0){
					this.context.lineWidth = lineAttributes.lineWidth;
				}
				if(lineAttributes.miterLimit > 0){
					this.context.miterLimit = lineAttributes.miterLimit;
				}
				this.setStrokeColor(lineAttributes.lineColor);
			}
			
			// shadows
			
			//shadowBlur  (default 0)
			/**
			 * �õ���Ӱģ���� Ĭ��Ϊ0
			 */
			Html5Graphics.prototype.getShadowBlur = function(){
				return this.context.shadowBlur;
			}
			/**
			 * ������Ӱģ����
			 * @param {int} shadowBlur
			 */
			Html5Graphics.prototype.setShadowBlur = function(shadowBlur){
				this.context.shadowBlur = shadowBlur;
			}
			//shadowColor  (default transparent black)
			/**
			 * �õ���Ӱ��ɫ
			 * @type String
			 */
			Html5Graphics.prototype.getShadowColor = function(){
				return this.context.shadowColor;
			}
			/**
			 * ������Ӱ��ɫ
			 * @param {String} shadowColor
			 */
			Html5Graphics.prototype.setShadowColor = function(shadowColor){
				this.context.shadowColor = shadowColor;
			}
			//shadowOffsetX  (default 0)
			/**
			 * �õ���Ӱ����ƫ��ֵ
			 */
			Html5Graphics.prototype.getShadowOffsetX = function(){
				return this.context.shadowOffsetX;
			}
			/**
			 * ������Ӱ����ƫ��ֵ
			 * @param {int} shadowOffsetX
			 */
			Html5Graphics.prototype.setShadowOffsetX = function(shadowOffsetX){
				this.context.shadowOffsetX = shadowOffsetX;
			}
			//shadowOffsetY  (default 0)
			/**
			 * �õ���Ӱ����ƫ��ֵ
			 */
			Html5Graphics.prototype.getShadowOffsetY = function(){
				return this.context.shadowOffsetY;
			}
			/**
			 * ������Ӱ����ƫ��ֵ
			 * @param {int} shadowOffsetY
			 */
			Html5Graphics.prototype.setShadowOffsetY = function(shadowOffsetY){
				this.context.shadowOffsetY = shadowOffsetY;
			}
			
			// rects
			/**
			 * ���һ���������
			 */
			Html5Graphics.prototype.clearRect = function(x, y, w, h){
				this.context.clearRect(x, y, w, h);
			}
			/**
			 * ���һ���������
			 */
			Html5Graphics.prototype.fillRect = function(x, y, w, h){
				this.context.fillRect(x, y, w, h);
			}
			/**
			 * �û��ʹ��ճ�һ���������
			 */
			Html5Graphics.prototype.strokeRect = function(x, y, w, h){
				this.context.strokeRect(x, y, w, h);
			}
			
			
			// Complex shapes (paths) API
			/**
			 * ��Բ��
			 */
			Html5Graphics.prototype.arc = function(x,y,radius,startAngle,endAngle,anticlockwise){
				this.context.arc(x,y,radius,startAngle,endAngle,anticlockwise);
			}
			/**
			 * 
			 */
			Html5Graphics.prototype.arcTo = function(x1,y1,x2,y2,radius){
				this.context.arcTo(x1,y1,x2,y2,radius);
			}
			/**
			 * 
			 */
			Html5Graphics.prototype.beginPath = function(){
				this.context.beginPath();
			}
			Html5Graphics.prototype.bezierCurveTo = function(cp1x,cp1y,cp2x,cp2y,x,y){
				this.context.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x,y);
			}
			/*
			Html5Graphics.prototype._clip = function(){
				this.context.clip();
			}
			*/
			/**
			 * 
			 */
			Html5Graphics.prototype.closePath = function(){
				this.context.closePath();
			}
			/**
			 * ���
			 */
			Html5Graphics.prototype.fill = function(){
				this.context.fill();
			}
			/**
			 * ��������
			 */
			Html5Graphics.prototype.lineTo = function(x,y){
				this.context.lineTo(x,y);
			}
			/**
			 * �ƶ���
			 */
			Html5Graphics.prototype.moveTo = function(x,y){
				this.context.moveTo(x,y);
			}
			Html5Graphics.prototype.quadraticCurveTo = function(cpx,cpy,x,y){
				this.context.quadraticCurveTo(cpx,cpy,x,y);
			}
			/**
			 * �ڻ�ͼ·�������һ������
			 */
			Html5Graphics.prototype.rect = function(x,y,w,h){
				this.context.rect(x,y,w,h);
			}
			/**
			 * ����
			 */
			Html5Graphics.prototype.stroke = function(){
				this.context.stroke();
			}
			/**
			 * һ�����Ƿ���·����
			 */
			Html5Graphics.prototype.isPointInPath = function(x,y){
				return this.context.isPointInPath(x,y);
			}
			/**
			 * ������Բ
			 */
			Html5Graphics.prototype.ellipse = function(x,y,horiRadius,vertRadius,startAngle,endAngle,anticlockwise){
				this.context.moveTo(x+horiRadius*Math.cos(startAngle * Math.PI/180),y-vertRadius*Math.sin(startAngle * Math.PI/180));
				this.lineToEllipse(x,y,horiRadius,vertRadius,startAngle,endAngle,anticlockwise);
			}
			Html5Graphics.prototype.lineToEllipse = function(x,y,horiRadius,vertRadius,startAngle,endAngle,anticlockwise){
				for(var i =startAngle;i<=endAngle;i++){
					var ii = i * Math.PI/180;
					var x1 = x+horiRadius*Math.cos(ii);
					var y1 = y-vertRadius*Math.sin(ii);
					this.context.lineTo(x1,y1);
				}
			}
			/**
			 * Բ�Ǿ���
			 */
			Html5Graphics.prototype.roundRect = function(x,y,width,height,horiRadius,vertRadius){
				this.context.moveTo(x+0.5,y+vertRadius);
				//this.context.lineTo(x+1,y+height-vertRadius);
				this.lineToEllipse(x+horiRadius+0.5,y+height-vertRadius,horiRadius,vertRadius-0.5,180,270,true);
				//this.context.lineTo(x+width-horiRadius,y+height-1);
				this.lineToEllipse(x+width-horiRadius,y+height-vertRadius-0.5,horiRadius,vertRadius-0.5,270,360,true);
				//this.context.lineTo(x+width,y+vertRadius);
				this.lineToEllipse(x+width-horiRadius,y+vertRadius,horiRadius,vertRadius,0,90,true);
				//this.context.lineTo(x+1+horiRadius,y+1);
				this.lineToEllipse(x+horiRadius+0.5,y+vertRadius,horiRadius,vertRadius,90,180,true);
			}
			/**
			 * �����
			 * @param {PointList} pointList
			 */
			Html5Graphics.prototype.polygon= function(pointList){
				var start = pointList.getFirstPoint();
				if(start == null){
					return;
				}
				this.context.moveTo(start.x,start.y);
				for(var i=1;i<pointList.size;i++){
					var temp = pointList.getPoint(i);
					this.context.lineTo(temp.x,temp.y);
				}
				this.context.lineTo(start.x,start.y);
			}
			/**
			 * ����
			 * @param {PointList} pointList
			 * @param {boolean} sharpen �Ƿ���
			 */
			Html5Graphics.prototype.polyline = function(pointList,sharpen){
				var start = pointList.getFirstPoint();
				if(start == null){
					return;
				}
				if(sharpen){
					this.context.moveTo((start.x>>0)+0.5,(start.y>>0)+0.5);
				}else{
					this.context.moveTo(start.x,start.y);
				}
				
				for(var i=1;i<pointList.size;i++){
					var temp = pointList.getPoint(i);
					if(sharpen){
						this.context.lineTo((temp.x>>0)+0.5,(temp.y>>0)+0.5);
					}else{
						this.context.lineTo(temp.x,temp.y);
					}
				}
				return start;
			}
			/**
			 * ��������
			 * @param {PointList} points ���ߵĵ��б�
			 * @param {int} dashlen ���ߵ�ÿ�γ���
			 * @param {int} gaplen �������
			 * @param {Array} ����ģʽ
			 */
			Html5Graphics.prototype.dashedPolyline = function(points,dashlen,gaplen,dashPattern){
				var start = points.getFirstPoint();
				if(start == null){
					return;
				}
				//this.context.moveTo(start.x,start.y);
				var begin = start;
				var end;
				for(var i = 1;i<points.size;i++){
					var end = points.getPoint(i);
					this.dashedLine(begin.x,begin.y,end.x,end.y,dashlen,gaplen,dashPattern);
					begin = end;
				}
			}
			/**
			 * ����
			 * @param {int} x ���x����
			 * @param {int} y ���y����
			 * @param {int} x2 �յ�x����
			 * @param {int} y2 �յ�y����
			 * @param {int} dashlen ���ߵ�ÿ�γ���
			 * @param {int} gaplen �������
			 * @param {Array} ����ģʽ
			 */
			Html5Graphics.prototype.dashedLine = function (x, y, x2, y2, dashlen,gaplen,dashArray) {
				if (!dashArray) dashArray = [dashlen,gaplen];
				var dashCount = dashArray.length;
				this.context.moveTo(x, y);
				var dx = (x2 - x), dy = (y2 - y);
				var slope = dy / dx;
				var distRemaining = Math.sqrt(dx * dx + dy * dy);
				var dashIndex = 0, draw = true;
				var signal = dx == 0 ? ( y2 > y ? 1: -1):(x2 > x ? 1 : -1);
				
				while (distRemaining >= 0.1) {
					var dashLength = dashArray[dashIndex++ % dashCount];
					if (dashLength > distRemaining) dashLength = distRemaining;
					var xStep = dx == 0 ? 0 : Math.sqrt(dashLength * dashLength / (1 + slope * slope));
					
					x += xStep * signal;
					y += dx==0 ? dashLength * signal : slope * xStep * signal;
					this[draw ? 'lineTo' : 'moveTo'](x, y);
					distRemaining -= dashLength;
					draw = !draw;
				}
			}
			Html5Graphics.prototype.drawFocus = function(x,y,width,height){
				this.beginPath();
				this.dashedPolyline(new PointList([x+0.5,y+0.5,x+width-0.5,y+0.5,x+width-0.5,y+height-0.5,x+0.5,y+height-0.5,x+0.5,y+0.5]),4,4,Html5Graphics.FOCUS_PATTERN);
				this.stroke();
			}
			//font: (default 10px sans-serif)
			/**
			 * �õ�����
			 * @type String
			 */
			Html5Graphics.prototype.getFont = function(){
				return this.context.font;
			}
			/**
			 * ��������
			 * @param {String} font
			 */
			Html5Graphics.prototype.setFont = function(font){
				if(font == null){
					return;
				}
				this.context.font = font;
			}
			//textAlign: "start", "end", "left", "right", "center" (default: "start")
			/**
			 * �õ����ֶ��뷽ʽ
			 * @type String
			 */
			Html5Graphics.prototype.getTextAlign = function(){
				return this.context.textAlign;
			}
			/**
			 * �������ֶ��뷽ʽ
			 * @param {String} textAlign
			 */
			Html5Graphics.prototype.setTextAlign = function(textAlign){
				this.context.textAlign = textAlign;
			}
			//textBaseline: "top", "hanging", "middle", "alphabetic", "ideographic", "bottom" (default: "alphabetic")
			/**
			 * �õ����ֻ���λ��
			 * @type String
			 */
			Html5Graphics.prototype.getTextBaseline = function(){
				return this.context.textBaseline;
			}
			/**
			 * �õ����ֻ���λ��
			 * @param {String} textBaseline
			 */
			Html5Graphics.prototype.setTextBaseline = function(textBaseline){
				this.context.textBaseline = textBaseline
			}
			/**
			 * �������
			 * @param {String} string ����������
			 * @param {int} x ��ʼλ��x����
			 * @param {int} y ��ʼλ��y����
			 * @param {int|null} maxWidth �����
			 */
			Html5Graphics.prototype.fillText = function(string,x,y,maxWidth){
				if(Util.browser.ie && 11==Util.browser.version) {
					y -= 2;
				}
				if(string != null && !isNaN(x) && !isNaN(y) && !isNaN(maxWidth)){
					this.context.fillText(string,x,y,maxWidth);
				}else if(string != null && !isNaN(x) && !isNaN(y)){
					this.context.fillText(string,x,y);
				}
				
			}
			Html5Graphics.prototype.measureText = function(text){
				return this.context.measureText(text);
			}
			/**
			 * ��������
			 * @param {String} string �蹴�յ�����
			 * @param {int} x ��ʼλ��x����
			 * @param {int} y ��ʼλ��y����
			 * @param {int|null} maxWidth �����
			 */
			Html5Graphics.prototype.strokeText = function(string,x,y,maxWidth){
				if(Util.browser.ie && 11==Util.browser.version) {
					y -= 2;
				}
				if(string != null && !isNaN(x) && !isNaN(y) && !isNaN(maxWidth)){
					this.context.strokeText(string,x,y,maxWidth);
				}else if(string != null && !isNaN(x) && !isNaN(y)){
					this.context.strokeText(string,x,y);
				}
				
			}
			
			
			// drawing images
			/**
			 * ����ͼƬ
			 * @param {Image} image
			 * @param {int} x1
			 * @param {int} y1
			 * @param {int} w1
			 * @param {int} h1
			 * @param {int} x2
			 * @param {int} y2
			 * @param {int} w2
			 * @param {int} h2
			 */
			Html5Graphics.prototype.drawImage = function(image,x1,y1,w1,h1,x2,y2,w2,h2){
				if(image == null){
					return;
				}
				if( !isNaN(x1) &&  !isNaN(y1)){
					if( !isNaN(w1) &&  !isNaN(h1)){
							if( !isNaN(w2) &&  !isNaN(h2)){
								this.context.drawImage(image,x1,y1,w1,h1,x2,y2,w2,h2);
							}else{
								this.context.drawImage(image,x1,y1,w1,h1);
							}
					}else{
						this.context.drawImage(image,x1,y1);
					}
				}
			}
			
			
			// pixel manipulation
			Html5Graphics.prototype.createImageData = function(arg1,arg2){
				if(arg1 != null && arg2 !=null){
					return this.context.createImageData(arg1,arg2);
				}else if(arg1 != null){
					return this.context.createImageData(arg1);
				}
				
			}
			Html5Graphics.prototype.getImageData = function(sx,sy,sw,sh){
				return this.context.getImageData(sx,sy,sw,sh);
			}
			Html5Graphics.prototype.putImageData = function(imagedata,dx,dy,dirtyX,dirtyY,dirtyWidth,dirtyHeight){
				if(imagedata == null){
					return;
				}
				if(!isNaN(dx) && !isNaN(dy) && !isNaN(dirtyX) && !isNaN(dirtyY) && !isNaN(dirtyWidth) && !isNaN(dirtyHeight)){
					this.context.putImageData(imagedata,dx,dy,dirtyX,dirtyY,dirtyWidth,dirtyHeight);
				}else if(!isNaN(dx) && !isNaN(dy)){
					this.context.putImageData(imagedata,dx,dy);
				}
			}
			
			

			
			Html5Graphics.prototype.fillRectangle = function(x,y,width,height){
				if( !isNaN(x) && !isNaN(y) && !isNaN(width) && !isNaN(height)){
					this.context.fillRect(x,y,width,height);
				}else if(x != null && Util.isInstanceOf(x, Rectangle)){
					this.context.fillRect(x.x,x.y,x.width,x.height);
				}
				//TODO
			}
			//clip
			Html5Graphics.prototype.clipRect = function(rect){
				//????clip
				this.currentClip.intersect(rect.x*this.currentScale.x, rect.y*this.currentScale.y, rect.width*this.currentScale.x,rect.height*this.currentScale.y)
				//????��clip
				this.context.beginPath();
				this.context.rect(rect.x,rect.y,rect.width,rect.height);
				this.context.closePath();
				this.context.clip();
				//
			}
			Html5Graphics.prototype.clipPath = function(path){
				//TODO ??��?????
				//?????��?????��???context???��?��?��?????????context. ????????`?clip stack????rectangle????��c(??????)
			}
			Html5Graphics.prototype.getClip = function(rect){
				
				rect.x = this.currentClip.x/this.currentScale.x;
				rect.y = this.currentClip.y/this.currentScale.y;
				rect.width = this.currentClip.width/this.currentScale.x;
				rect.height = this.currentClip.height/this.currentScale.y;
				/*
				rect.x = this.currentClip.x;
				rect.y = this.currentClip.y;
				rect.width = this.currentClip.width;
				rect.height = this.currentClip.height;
				*/
				return rect;
			}
			//dispose
			Html5Graphics.prototype.dispose = function(){
				while(this.stackPointer > 0){
					this.restoreState();
				}
				delete this.context;
			}
			//init
			Html5Graphics.prototype.init = function(context,rect){
				this.context=context;
				this.stack = [];
				this.stackPointer = 0;
				
				this.scaleStack = [];
				this.currentScale = {x:1,y:1};
				
				this.pushState();
				
				if(rect == null){
					rect = new Rectangle(0,0,context.canvas.width,context.canvas.height);
				}
				this.currentClip = rect;
				this.clipRect(rect);
				
				
				//?????��???c
				this.setTextBaseline("top");
				this.setFont("12px sans-serif");
			}
		}
		Html5Graphics._initialized = true;
		_classes.defineClass("Html5Graphics",prototypeFunction); 
	}

	this.init(context,rect);
}
Html5Graphics.FOCUS_PATTERN = [1,2,1,2];/**
TreeSearch
---ExclusionSearch
*/
//-----------------------------Class TreeSearch-------
_classes.registerClass("TreeSearch");
function TreeSearch(){
	if(typeof TreeSearch._initialized == "undefined"){
		function prototypeFunction () {
			TreeSearch.prototype.accept = function(figure){
			}
			TreeSearch.prototype.prune = function(figure){
			}
			TreeSearch.prototype.init = function(){
				this.parentMethod("init");
			}
		}
		TreeSearch._initialized = true;
		_classes.defineClass("TreeSearch",prototypeFunction); 
	}
	this.init();
}

//-----------------------------Class ExclusionSearch-------
_classes.registerClass("ExclusionSearch","TreeSearch");
function ExclusionSearch(c){
	if(typeof ExclusionSearch._initialized == "undefined"){
		function prototypeFunction () {
			ExclusionSearch.prototype.accept = function(figure){
				return true;
			}
			ExclusionSearch.prototype.prune = function(figure){
				if(this.c != null && this.c.length > 0){
					return Util.Array.contains(this.c, figure);
				}
				return false;
			}
			ExclusionSearch.prototype.init = function(c){
				this.parentMethod("init");
				this.c = c;
			}
		}
		ExclusionSearch._initialized = true;
		_classes.defineClass("ExclusionSearch",prototypeFunction); 
	}
	this.init(c);
}/*
load-dependencies:geometry.js;TreeSearch.js
*****************
NoInsets
EmptyList
IdentitySearch
LayoutNotifier
FigureIterator
Figure
---Label
---Panel
---Shape
------Ellipse
------AbstractPointListShape
---------PolygonShape
---------Polyline
------------Polygon
---------------PolygonDecoration
------------PolylineDecoration
---------PolylineShape
---------ScalablePolygonShape
------RectangleFigure
------RoundedRectangle
------Triangle
---RootFigure
---Panel
FigureConstants
*/
/**
* @fileoverview ͼ���ļ�
* @author jiangqifan
* @version 0.1
*/
//----------------------------------Class NoInsets---------------------

 _classes.registerClass("NoInsets","Insets");

 function NoInsets(){
	if(typeof NoInsets._initialized == "undefined"){
		function prototypeFunction () {
			NoInsets.prototype.isEmpty = function(){
				return true;
			}
			NoInsets.prototype.init = function(){
				this.parentMethod("init",0,0,0,0);
			}
		}
		NoInsets._initialized = true;
		_classes.defineClass("NoInsets",prototypeFunction); 
	}
	this.init();
 }


//----------------------------------Class EmptyList---------------------TODO
 _classes.registerClass("EmptyList","Insets");
 function EmptyList(){
	if(typeof EmptyList._initialized == "undefined"){
		function prototypeFunction () {
		
			EmptyList.prototype.isEmpty = function(){
				return true;
			}
			EmptyList.prototype.init = function(){
				this.parentMethod("init",0,0,0,0);
			}
		}
		EmptyList._initialized = true;
		_classes.defineClass("EmptyList",prototypeFunction); 
	}
	this.init();
 }
 
 //-----------------------------Class IdentitySearch-------
_classes.registerClass("IdentitySearch","TreeSearch");
function IdentitySearch(figure){
	if(typeof IdentitySearch._initialized == "undefined"){
		function prototypeFunction () {
			IdentitySearch.prototype.accept = function(f){
				return true;
			}
			IdentitySearch.prototype.prune = function(f){
				return false;
			}
			IdentitySearch.prototype.init = function(figure){
				this.parentMethod("init");
				this.host = figure;
			}
		}
		IdentitySearch._initialized = true;
		_classes.defineClass("IdentitySearch",prototypeFunction); 
	}

	this.init(figure);
}
IdentitySearch.INSTANCE = new IdentitySearch();


//-----------------------------Class LayoutNotifier-------
_classes.registerClass("LayoutNotifier");
function LayoutNotifier(layout,listener,host){
	if(typeof LayoutNotifier._initialized == "undefined"){
		function prototypeFunction () {
			LayoutNotifier.prototype.getConstraint = function(child){
				if (this.realLayout != null){
					return this.realLayout.getConstraint(child);
				}
				return null;
			}
			LayoutNotifier.prototype.getMinimumSize = function(container,wHint,hHint){
				if (this.realLayout != null){
					return this.realLayout.getMinimumSize(container, wHint, hHint);
				}
				return null;
			}
			LayoutNotifier.prototype.getPreferredSize = function(container,wHint,hHint){
				if (this.realLayout != null){
					return realLayout.getPreferredSize(container, wHint, hHint);
				}
				return null;
			}
			LayoutNotifier.prototype.invalidate = function(){
				for (var i = 0; i < this.listeners.length; i++){
					this.listeners[i].invalidate(host);
				}
				if (this.realLayout != null){
					this.realLayout.invalidate();
				}
			}
			LayoutNotifier.prototype.layout = function(container){
				var  consumed = false;
				for (var i = 0; i < this.listeners.length; i++){
					consumed |= this.listeners[i].layout(container);
				}
				if (this.realLayout != null && !consumed){
					this.realLayout.layout(container);
				}
				for (var i = 0; i < this.listeners.length; i++){
					this.listeners[i].postLayout(container);
				}
			}
			LayoutNotifier.prototype.remove = function(child){
				for (var i = 0; i < this.listeners.length; i++){
					this.listeners[i].remove(child);
				}
				if (this.realLayout != null){
					this.realLayout.remove(child);
				}
			}
			LayoutNotifier.prototype.setConstraint = function(child,constraint){
				for (var i = 0; i < listeners.length; i++){
					listeners[i].setConstraint(child, constraint);
				}
				if (this.realLayout != null){
					this.realLayout.setConstraint(child, constraint);
				}
			}
			LayoutNotifier.prototype.init = function(layout,listener,host){
				this.parentMethod("init");
				this.host = host;
				this.realLayout = layout;
				this.listeners = [];
				this.listeners.push(listener);
			}
		}
		LayoutNotifier._initialized = true;
		_classes.defineClass("LayoutNotifier",prototypeFunction); 
	}

	this.init(layout,listener,host);
}
//-----------------------------Class FigureIterator-------
_classes.registerClass("FigureIterator");
function FigureIterator(figure){
	if(typeof FigureIterator._initialized == "undefined"){
		function prototypeFunction () {
			FigureIterator.prototype.nextFigure = function(){
				return this.list[--this.index];
			}
			FigureIterator.prototype.hasNext = function(){
				return this.index > 0;
			}
			FigureIterator.prototype.init = function(figure){
				this.parentMethod("init");
				this.list =  figure.children;
				this.index = this.list.length;
			}
		}
		FigureIterator._initialized = true;
		_classes.defineClass("FigureIterator",prototypeFunction); 
	}

	this.init(figure);
}
//-------------------------------class Figure----------------------
 _classes.registerClass("Figure");
/**
* ������ͼ���࣬����ͼ����Ļ��࣬������һ��ͼ��Ԫ�ر���Ҫʵ�ֵĻ������ܣ�ͨ���Զ��������չ����Ϊͼ��Ԫ���ṩ����Ĺ���
* @class �������ͼ����
* @constructor
* @return һ���������ͼ�ζ���
*/
function Figure(id){
	
	if(typeof Figure._initialized == "undefined"){
		
		function prototypeFunction () {
			/**
			 *������ͼ��
			 * @param {Figure} child Ҫ���ӵ���ͼ��
			 * @param {Object} constraint Լ��,��ѡ
			 * @param {Int} index λ��,��ѡ
			 */
			Figure.prototype.add = function(child,constraint,index){
				(this.id+" => Figure-add()");
				//check for cycle in hierarchy
				var figure;
				for(figure = this;figure;figure=figure.getParent()){
					if(figure == child){
						Debugger.log(this.id+" => "+"Figure-add-Figure being added introduces cycle");
					}
				}
				//Detach the child from previous parent
				if(child.getParent()){
					child.getParent().remove(child);
				}
			
				index = (index==null)?-1:index;
				
				if(index == -1){
					this.children.push(child);
				}else{
					this.children.splice(index,0,child);
				}
				
				
				child.setParent(this);
				
				if(this.layoutManager && constraint){
					this.layoutManager.setConstraint(child,constraint);
				}
				
				this.revalidate();
				
				if (this.getFlag(FigureConstants.FLAG_REALIZED))
				{
					child.addNotify();
				}
				child.repaint();
			}
			/**
			 *�������ȼ�����
			 * @param {Object} ancestorListener ������
			 */
			Figure.prototype.addAncestorListener = function(ancestorListener){
				if (this.ancestorHelper == null){
					this.ancestorHelper = new AncestorHelper(this);
				}
				this.ancestorHelper.addAncestorListener(ancestorListener);
			}
			Figure.prototype.addCoordinateListener = function(listener){
				this.eventListeners.addListener("CoordinateListener", listener);
			}
			Figure.prototype.addFigureListener = function(listener){
				this.eventListeners.addListener("FigureListener", listener);
			}
			Figure.prototype.addFocusListener = function(listener){
				this.eventListeners.addListener("FocusListener", listener);
			}
			Figure.prototype.addKeyListener = function(listener){
				this.eventListeners.addListener("KeyListener", listener);
			}
			Figure.prototype.addLayoutListener = function(listener){
				if (this.layoutManager!=null && Util.isInstanceOf(this.layoutManager, LayoutNotifier)) {
					this.layoutManager.listeners.push(listener);
				}else{
					this.layoutManager = new LayoutNotifier(this.layoutManager, listener,this);
				}
			}
			Figure.prototype.addListener = function(clazz,listener){
				this.eventListeners.addListener(clazz, listener);
			}
			Figure.prototype.addMouseListener = function(listener){
				this.eventListeners.addListener("MouseListener", listener);
			}
			Figure.prototype.addMouseMotionListener = function(listener){
				this.eventListeners.addListener("MouseMotionListener", listener);
			}
			
			//add notify for this figure and it's children
			Figure.prototype.addNotify = function(){
				if(this.getFlag(FigureConstants.FLAG_REALIZED)){
					Debugger.log(this.id+" => "+"addNotify() should not be called multiple times");
				}
				this.setFlag(FigureConstants.FLAG_REALIZED,true);
				for(var i=0;i<this.children.length;i++){
					this.children[i].addNotify();
				}
			}
			Figure.prototype.addPropertyChangeListener = function(property,listener){
				if (this.propertyListeners == null){
					this.propertyListeners = new PropertyChangeSupport(this);
				}
				if(arguments.length ==2 && property != null){
					this.propertyListeners.addPropertyChangeListener(property, listener);
				}else{
					var temp=(property!=null?property:listener);
					this.propertyListeners.addPropertyChangeListener(listener);
				}
			}
			/**
			 *�Ƿ����ĳ����
			 * @param {Point/Number} arg1 �����x����
			 * @param {Number} arg2 y���꣬����һ������Ϊx����ʱʹ��
			 */
			Figure.prototype.containsPoint = function(arg1,arg2){
				if(arg1 == null){
					return;
				}
				var x;
				var y;
				if(Util.isInstanceOf(arg1, Point)){
					x = arg1.x;
					y = arg1.y;
				}else if(arg2 != null){
					x = arg1;
					y = arg2;
				}
				return this.getBounds().contains(x, y);
			}
			Figure.prototype.dispose = function () {
				if (null != this.children) {
					for (var i = 0; i < this.children.length; i++) {
						var child = this.children[i];
						this.children[i] = null;
						if (child && child.dispose) {
							child.dispose();
						}
					}
					this.children = null;
				}
				
				if (this.layoutManager &&this.layoutManager.dispose) {
					this.layoutManager.dispose()
				}
				this.layoutManager = null;
				if (null != this.ancestorHelper && this.ancestorHelper.dispose) {
					this.ancestorHelper.dispose();
				}
				this.ancestorHelper = null;
				
				if (null != this.eventListeners) {
					for (var i = 0; i< this.eventListeners.length; i++) {
						this.eventListeners[i] = null;
					}
					this.eventListeners = null;
				}
				
				this.parent = null;
				
				this.bounds = null;
				
				this.maxSize = null;
				
				this.minSize = null;
				
				this.bgColor = null;
				
				this.border = null;
			}
			//call the parent to repaint this figure's rectangle
			/**
			 * ������ͨ������ʽΪ����ͼ���ػ����ͼ�ε�����
			 */
			Figure.prototype.erase = function(){
				if(!this.getParent()||!this.isVisible()){
					return;
				}
				var r = new Rectangle(this.getBounds());
				this.getParent().translateToParent(r);
				this.getParent().repaint(r.x, r.y, r.width, r.height);
			}
			Figure.prototype.findDescendantAtExcluding = function(x,y,search){
				Figure.PRIVATE_POINT.setLocation(x, y);
				this.translateFromParent(Figure.PRIVATE_POINT);
				if (!this.getClientArea(Rectangle.SINGLETON).contains(Figure.PRIVATE_POINT)){
					return null;
				}
				x = Figure.PRIVATE_POINT.x;
				y = Figure.PRIVATE_POINT.y;
				var fig;
				for (var i = this.children.length; i > 0;) {
					i--;
					fig = this.children[i];
					if (fig.isVisible()) {
						fig = fig.findFigureAt(x, y, search);
						if (fig != null){
							return fig;
						}
					}
				}
				return null;
			}
			/**
			 * ���������ҵ��ô���ͼ��
			 * @param {Point/Number} arg1
			 * @param {Number} arg2
			 * @param {TreeSearch} arg3
			 */
			Figure.prototype.findFigureAt = function(arg1,arg2,arg3){
				if(arg1 == null){
					return;
				}
				if(arg3 != null && Util.isInstanceOf(arg3, TreeSearch)){
					
					if (!this.containsPoint(arg1, arg2)){
						return null;
					}
					if(arg3.prune(this)){
						return null;
					}
					var child = this.findDescendantAtExcluding(arg1, arg2, arg3);
					
					if(child != null){
						return child;
					}
					if(arg3.accept(this)){
						return this;
					}
					return null;
				}
				if(Util.isInstanceOf(arg1, Point)){
					return this.findFigureAtExcluding(arg1.x,arg1.y,Figure.EMPTY_LIST);
				}else if(arg2!=null){
					return this.findFigureAt(arg1, arg2, IdentitySearch.INSTANCE);
				}
				
			}
			
			Figure.prototype.findFigureAtExcluding = function(x,y,c){
				return this.findFigureAt(x, y, new ExclusionSearch(c));
			}
			Figure.prototype.findMouseEventTargetAt = function(x,y){
				
				if (!this.containsPoint(x, y)){
					return null;
				}
				var f = this.findMouseEventTargetInDescendantsAt(x, y);
				if (f != null){
					return f;
				}
				if (this.isMouseEventTarget()){
					return this;
				}
				return null;
			}
			Figure.prototype.findMouseEventTargetInDescendantsAt = function(x,y){
				Figure.PRIVATE_POINT.setLocation(x, y);
				this.translateFromParent(Figure.PRIVATE_POINT);
				if (!this.getClientArea(Rectangle.SINGLETON).contains(Figure.PRIVATE_POINT)){
					return null;
				}
				var fig;
				for (var i = this.children.length; i > 0;) {
					i--;
					fig = this.children[i];
					
					
					if(fig.isVisible() && fig.isEnabled()) {
						if (fig.containsPoint(Figure.PRIVATE_POINT.x, Figure.PRIVATE_POINT.y)) {
							fig = fig.findMouseEventTargetAt(Figure.PRIVATE_POINT.x, Figure.PRIVATE_POINT.y);
							return fig;
						}
					}
					
				}
				
				
				return null;
			}
			Figure.prototype.fireCoordinateSystemChanged = function(){
				if (!this.eventListeners.containsListener("CoordinateListener")){
					return;
				}
				var figureListeners = this.eventListeners.getListeners("CoordinateListener");
				while (figureListeners.hasNext()){
					figureListeners.next().coordinateSystemChanged(this);
				}
			}
			
			Figure.prototype.fireFigureMoved = function(){
				if(!this.eventListeners.containsListener("FigureListener")){
					return;
				}
				var figureListeners = this.eventListeners.getListeners("FigureListener");
				while(figureListeners.hasNext()){
					figureListeners.next().figureMoved(this);
				}
			}
			Figure.prototype.fireMoved = function(){
				this.fireFigureMoved();
				this.fireCoordinateSystemChanged();
			}
			Figure.prototype.firePropertyChange = function(property,old,current){
				if(this.propertyListeners == null){
					return;
				}
				this.propertyListeners.firePropertyChange(property, old, current);
			}
			/**
			 * �õ�������ɫ
			 * @returns ��ͼ�εı�����ɫ
			 * @type Color
			 */
			Figure.prototype.getBackgroundColor = function(){
				if (this.bgColor == null && this.getParent() != null){
					return this.getParent().getBackgroundColor();
				}
				return this.bgColor;
			}
			/**
			 * �õ�Border
			 * @returns ��ͼ�ε�border
			 * @type AbstractBorder
			 */
			Figure.prototype.getBorder = function(){
				return this.border;
			}
			/**
			 * �õ��߽�
			 * @returns ��ͼ�εı߽�
			 * @type Rectangle
			 */
			Figure.prototype.getBounds = function(){
				return this.bounds;
			}
			/**
			 * �õ�������ͼ��
			 * @returns ������ͼ��
			 * @type Array
			 */
			Figure.prototype.getChildren = function(){
				return this.children;
			}
			/**
			 * �õ��ͻ���
			 * @returns ��ͼ�εĿͻ���
			 * @type Rectangle
			 */
			Figure.prototype.getClientArea = function(rect){
				if(rect == null){
					rect = new Rectangle(0,0,0,0);
				}
				rect.setBounds(this.getBounds());
				rect.crop(this.getInsets());
				if(this.useLocalCoordinates()){
					rect.setLocation(0,0);
				}
				return rect;
			}
			/**
			 * �õ���ͼ�ε������ʽ
			 * @returns ��ͼ�ε������ʽ
			 * @type String
			 */
			Figure.prototype.getCursor = function(){
				if (this.cursor == null && this.getParent() != null){
					return this.getParent().getCursor();
				}
				return this.cursor;
			}
			
			Figure.prototype.getFlag = function(flag){
				return (this.flags & flag) != 0;
			}
			/**
			 * �õ���ͼ�ε�����
			 * @returns ��ͼ�ε�����
			 * @type String
			 */
			Figure.prototype.getFont = function(){
				if(this.font != null){
					return this.font;
				}
				if(this.getParent() != null){
					return this.getParent().getFont();
				}
				return null;
			}
			Figure.prototype.getForegroundColor = function(){
				if (this.fgColor == null && this.getParent() != null){
					return this.getParent().getForegroundColor();
				}
				return this.fgColor;
			}
			/**
			 * �õ���ͼ�ε�Insets
			 * @returns ��ͼ�ε�Insets
			 * @type Insets
			 */
			Figure.prototype.getInsets = function(){
				if(this.border != null){
					return this.border.getInsets(this);
				}
				return Figure.NO_INSETS;
			}
			/**
			 * �õ���ͼ�εĲ��ֹ�����
			 * @returns ��ͼ�εĲ��ֹ�����
			 * @type LayoutManager
			 */
			Figure.prototype.getLayoutManager = function(){
				if (this.layoutManager!= null && Util.isInstanceOf(this.layoutManager, LayoutNotifier)){
					return this.layoutManager.realLayout;
				}
				return this.layoutManager;
			}
			/**
			 * �õ���ͼ����ĳһ�������
			 * @param {String} clazz ���
			 * @returns ������һ������м�����
			 * @type TypeIterator
			 */
			Figure.prototype.getListeners = function(clazz){
				if(this.eventListeners == null){
					return new EMPTY_IERATOR();
				}
				return this.eventListeners.getListeners(clazz);
			}
			Figure.prototype.getLocalBackgroundColor = function(){
				return this.bgColor;
			}
			Figure.prototype.getLocalFont = function(){
				return this.font;
			}
			Figure.prototype.getLocalForegroundColor = function(){
				return this.fgColor;
			}
			/**
			 * �õ���ͼ�ε�λ��
			 * @returns ��ͼ�ε�λ��
			 * @type Point
			 */
			Figure.prototype.getLocation = function(){
				return new Point(this.getBounds().x,this.getBounds().y);
			}
			/**
			 * �õ���ͼ�ε�����С
			 * @returns ��ͼ�ε�����С
			 * @type Dimension
			 */
			Figure.prototype.getMaximumSize = function(){
				if (this.maxSize != null){
					return maxSize;
				}
				return	Figure.MAX_DIMENSION;
			}
			/**
			 * �õ���ͼ�ε���С��С
			 * @param {Number} arg1 �����ʾֵ
			 * @param {Number} arg2 �߶���ʾֵ
			 * @returns ��ͼ�ε���С��С
			 * @type Dimension
			 */
			Figure.prototype.getMinimumSize = function(arg1,arg2){
				var wHint = arg1;
				var hHint = arg2;
				if(arg1 == null || arg2 == null){
					wHint = -1;
					hHint = -1;
				}
				if (this.minSize != null){
					return this.minSize;
				}
				if (this.getLayoutManager() != null) {
					var d = this.getLayoutManager().getMinimumSize(this, wHint, hHint);
					if (d != null){
						return d;
					}
				}
				return this.getPreferredSize(wHint, hHint);
				
			}
			/**
			 * �õ���ͼ��
			 * @returns ��ͼ�εĸ�ͼ��
			 * @type Figure
			 */
			Figure.prototype.getParent = function(){
				return this.parent;
			}
			/**
			 * �õ���ѡ��С
			 * @param {Number} width �����ʾֵ
			 * @param {Number} height �߶���ʾֵ
			 * @returns ��ͼ�ε����ȴ�С
			 * @type Dimension
			 */
			Figure.prototype.getPreferredSize = function(width,height){
				var wHint = width;
				var hHint = height;
				if(width == null || height == null){
					wHint = -1;
					hHint = -1;
				}
				if(this.prefSize){
					return this.prefSize;
				}
				if(this.layoutManager){
					var d = this.layoutManager.getPreferredSize(this,wHint,hHint);
					if(d){
						return d;
					}
				}
				return this.getSize();
			}
			/**
			 * �õ���С
			 * @returns ��ͼ�εĴ�С
			 * @type Dimension
			 */
			Figure.prototype.getSize = function(){
				return this.getBounds().getSize();
			}
			Figure.prototype.getToolTip = function(){
				return this.toolTip;
			}
			Figure.prototype.getUpdateManager = function(){
				if(this.getParent())
				{
					return this.getParent().getUpdateManager();
				}else{
					return new UpdateManager();
				}
			}
			Figure.prototype.handleFocusGained = function(event){
				var iter = this.eventListeners.getListeners("FocusListener");
				var temp;
				while (iter.hasNext()){
					temp = iter.next();
					if(temp.focusGained != null){
						temp.focusGained(event,this);
					}
				}
			}
			Figure.prototype.handleFocusLost = function(event){
				var iter = this.eventListeners.getListeners("FocusListener");
				var temp;
				while (iter.hasNext()){
					temp = iter.next();
					if(temp.focusLost != null){
						temp.focusLost(event,this);
					}
				}
			}
			Figure.prototype.handleKeyPressed = function(event){
				var iter = this.eventListeners.getListeners("KeyListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.keyPressed != null){
						temp.keyPressed(event,this);
					}
				}
			}
			Figure.prototype.handleKeyReleased = function(event){
				var iter = this.eventListeners.getListeners("KeyListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.keyReleased != null){
						temp.keyReleased(event,this);
					}
				}
			}
			Figure.prototype.handleMouseDoubleClicked = function(event){
				var iter = this.eventListeners.getListeners("MouseListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.mouseDoubleClicked != null){
						temp.mouseDoubleClicked(event,this);
					}
				}
			}
			Figure.prototype.handleMouseClicked = function(event){
				var iter = this.eventListeners.getListeners("MouseListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.mouseClicked != null){
						temp.mouseClicked(event,this);
					}
				}
			}
			Figure.prototype.handleMouseDragged = function(event){
				var iter = this.eventListeners.getListeners("MouseMotionListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.mouseDragged != null){
						temp.mouseDragged(event,this);
					}
				}
			}
			Figure.prototype.handleMouseEntered = function(event){
				var iter = this.eventListeners.getListeners("MouseMotionListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.mouseEntered != null){
						temp.mouseEntered(event,this);
					}
				}
			}
			Figure.prototype.handleMouseExited = function(event){
				var iter = this.eventListeners.getListeners("MouseMotionListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.mouseExited != null){
						temp.mouseExited(event,this);
					}
				}
			}
			Figure.prototype.handleMouseHover = function(event){
				var iter = this.eventListeners.getListeners("MouseMotionListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.mouseHover != null){
						temp.mouseHover(event,this);
					}
				}
			}
			Figure.prototype.handleMouseMoved = function(event){
				var iter = this.eventListeners.getListeners("MouseMotionListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.mouseMoved != null){
						temp.mouseMoved(event,this);
					}
				}
			}
			Figure.prototype.handleMousePressed = function(event){
				var iter = this.eventListeners.getListeners("MouseListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.mousePressed != null){
						temp.mousePressed(event,this);
					}
				}
			}
			Figure.prototype.handleMouseReleased = function(event){
				var iter = this.eventListeners.getListeners("MouseListener");
				var temp;
				while (!event.isConsumed() && iter.hasNext()) {
					temp = iter.next();
					if(temp.mouseReleased != null){
						temp.mouseReleased(event,this);
					}
				}
			}
			Figure.prototype.hasFocus = function(){
				var dispatcher = this.internalGetEventDispatcher();
				if (dispatcher == null){
					return false;
				}
				return dispatcher.getFocusOwner() == this;
			}
			Figure.prototype.internalGetEventDispatcher = function(){
				if (this.getParent() != null){
					return this.getParent().internalGetEventDispatcher();
				}
				return null;
			}
			Figure.prototype.intersects = function(rect){
				return this.getBounds().intersects(rect);
			}
			//invalidate this figure and it's layoutManager
			/**
			 * ʹ�ñ�ͼ����Ч
			 */
			Figure.prototype.invalidate = function(){
				if (this.layoutManager)
					this.layoutManager.invalidate();
				this.setValid(false);
			}
			/**
			 * ʹ�ñ�ͼ���Լ�����ͼ�����ϵ�����ͼ����Ч
			 */
			Figure.prototype.invalidateTree = function(){
				this.invalidate();
				for (var i=0; i<this.children.length;i++) {
					this.children[i].invalidateTree();
				}
			}
			/**
			 * �Ƿ�ʹ���������ϵ
			 * @returns �Ƿ�ʹ���������ϵ
			 * @type boolean
			 */
			Figure.prototype.isCoordinateSystem = function(){
				return this.useLocalCoordinates();
			}
			/**
			 * �Ƿ����
			 * @returns �Ƿ����
			 * @type boolean
			 */
			Figure.prototype.isEnabled = function(){
				return this.getFlag(FigureConstants.FLAG_ENABLED);
			}
			Figure.prototype.isFocusTraversable = function(){
				return this.getFlag(FigureConstants.FLAG_FOCUS_TRAVERSABLE);
			}
			/**
			 * �Ƿ��������¼�
			 * @returns �Ƿ��������¼�
			 * @type boolean
			 */
			Figure.prototype.isMouseEventTarget = function(){
				return (this.eventListeners.containsListener("MouseListener") || this.eventListeners.containsListener("MouseMotionListener"));
			}
			Figure.prototype.isMirrored = function(){
//				if (this.getParent() != null){
//					return this.getParent().isMirrored();
//				}
				return false;
			}
			/**
			 * �Ƿ�͸��
			 * @returns �Ƿ�͸��
			 * @type boolean
			 */
			Figure.prototype.isOpaque = function(){
				return this.getFlag(FigureConstants.FLAG_OPAQUE);
			}
			Figure.prototype.isRequestFocusEnabled = function(){
				return this.getFlag(FigureConstants.FLAG_FOCUSABLE);
			}
			/**
			 * �Ƿ���ʾ
			 * @returns �Ƿ���ʾ
			 * @type boolean
			 */
			Figure.prototype.isShowing = function(){
				return this.isVisible() && (this.getParent() == null|| this.getParent().isShowing());
			}
			/**
			 * �Ƿ���Ч
			 * @returns �Ƿ���Ч
			 * @type boolean
			 */
			Figure.prototype.isValid = function(){
				return this.getFlag(FigureConstants.FLAG_VALID);
			}
			/**
			 * �Ƿ�Ϊ��Ч���ĸ�
			 * @returns �Ƿ�Ϊ��Ч���ĸ�
			 * @type boolean
			 */
			Figure.prototype.isValidationRoot = function(){
				return false;
			}
			/**
			 * �Ƿ�ɼ�
			 * @returns �Ƿ�ɼ�
			 * @type boolean
			 */
			Figure.prototype.isVisible = function(){
				return this.getFlag(FigureConstants.FLAG_VISIBLE);
			}
			/**
			 * Ϊ��ͼ�β���
			 */
			Figure.prototype.layout = function(){
				if(this.layoutManager){
					this.layoutManager.layout(this);
				}
			}
			/**
			 * ���Ʊ�ͼ��
			 * @param {Html5Graphics} graphics ��ͼ����
			 */
			Figure.prototype.paint = function(graphics){
				graphics.pushState(); 
				
				//����ǰ��ɫ
				if (this.getLocalForegroundColor() != null){
					graphics.setFillColor(this.getLocalForegroundColor());
					graphics.setStrokeColor(this.getLocalForegroundColor());
				}
				if(this.font != null){
					graphics.setFont(this.font);
				}
				
				graphics.pushState(); 
				this.paintFigure(graphics);
				graphics.restoreState();  
				graphics.pushState();
				this.paintClientArea(graphics);
				graphics.restoreState();
				graphics.pushState();
				this.paintBorder(graphics);
				graphics.restoreState();
				
				graphics.restoreState();
			}
			Figure.prototype.paintBorder = function(graphics){
				if (this.getBorder() != null){
					this.getBorder().paint(this, graphics, Figure.NO_INSETS);
				}
			}
			Figure.prototype.paintChildren = function(graphics){
				var child;
				var clip  = Rectangle.SINGLETON;
				for(var i=0;i<this.children.length;i++){
					child = this.children[i];
					if(child.isVisible() && child.intersects(graphics.getClip(clip))){
						graphics.pushState();
						graphics.clipRect(child.getBounds());
						child.paint(graphics);
						graphics.restoreState();
					}
				}
			}
			Figure.prototype.paintClientArea = function(graphics){
				if(this.children.length ==0){
					return;
				}
				
				var optimizeClip = this.getBorder() == null || this.getBorder().isOpaque();
				
				if(this.useLocalCoordinates()){
					graphics.translate(this.getBounds().x + this.getInsets().left,this.getBounds().y + this.getInsets().top);
					if(optimizeClip){
						graphics.clipRect(this.getClientArea(Figure.PRIVATE_RECT));
					}
					graphics.pushState();
					this.paintChildren(graphics);
					graphics.restoreState();
				}else{
					if(optimizeClip){
						this.paintChildren(graphics);
					}else{
						graphics.clipRect(this.getClientArea(Figure.PRIVATE_RECT)); //??
						graphics.pushState();
						
						this.paintChildren(graphics);
						graphics.restoreState();
					}
				}
				
			}
			Figure.prototype.paintFigure = function(graphics){
				if(this.isOpaque()){
					//���Ʊ�����ɫ
					if(this.getLocalBackgroundColor() != null){
						graphics.pushState();
						graphics.setFillColor(this.getLocalBackgroundColor());
						graphics.fillRect(this.getBounds().x,this.getBounds().y,this.getBounds().width,this.getBounds().height);
						graphics.restoreState();
					}
					
				}
				if(this.getBorder() != null && Util.isInstanceOf(this.getBorder(), AbstractBackground)){
					this.getBorder().paintBackground(this, graphics, Figure.NO_INSETS);
				}
			}
			Figure.prototype.primTranslate = function(dx,dy){
				
				this.getBounds().x += dx;
				this.getBounds().y += dy;
				if(this.useLocalCoordinates()){
					this.fireCoordinateSystemChanged();
					return;
				}
				for(var i = 0; i <this.children.length; i++){
					this.children[i].translate(dx,dy);
				}
				
			}
			/**
			 * �Ƴ���ͼ��
			 * @param {Figure} figure ��Ҫ�Ƴ�����ͼ��
			 */
			Figure.prototype.remove = function(figure){
				if ((figure.getParent() != this)){
					Debugger.log(this.id+"=>remove()--Figure is not a child");
				}
				if (this.getFlag(FigureConstants.FLAG_REALIZED)){
					figure.removeNotify();
				}
				if (this.layoutManager != null){
					this.layoutManager.remove(figure);
				}
				figure.erase();
				figure.setParent(null);
				Util.Array.removeItem(this.children, figure);
				this.revalidate();
			}
			/**
			 * �Ƴ�������ͼ��
			 */
			Figure.prototype.removeAll = function(){
				while(this.children.length >0){
					this.remove(this.children[0]);
				}
			}
			Figure.prototype.removeAncestorListener = function(listener){
				if (this.ancestorHelper != null) {
					this.ancestorHelper.removeAncestorListener(listener);
					if (this.ancestorHelper.isEmpty()) {
						this.ancestorHelper.dispose();
						ancestorHelper = null;
					}
				}
			}
			Figure.prototype.removeCoordinateListener = function(listener){
				this.eventListeners.removeListener("CoordinateListener", listener);
			}
			Figure.prototype.removeFigureListener = function(listener){
				this.eventListeners.removeListener("FigureListener", listener);
			}
			Figure.prototype.removeFocusListener = function(listener){
				this.eventListeners.removeListener("FocusListener", listener);
			}
			Figure.prototype.removeKeyListener = function(listener){
				this.eventListeners.removeListener("KeyListener", listener);
			}
			Figure.prototype.removeLayoutListener = function(listener){
				if (Util.isInstanceOf(this.layoutManager, LayoutNotifier)) {
					Util.Array.removeItem(this.layoutManager.listeners, listener);
					if (this.layoutManager.listeners.length == 0){
						layoutManager = this.layoutManager.realLayout;
					}
				}
			}
			/**
			 * �Ƴ�������
			 * @param {Stirng} clazz ���������
			 * @param {Object} listener ��Ҫ�Ƴ��ļ�����
			 */
			Figure.prototype.removeListener = function(clazz,listener){	
				if (this.eventListeners == null){
					return;
				}
				this.eventListeners.removeListener(clazz, listener);
			}
			/**
			 * �Ƴ���������
			 * @param {Object} listener ��Ҫ�Ƴ��ļ�����
			 */
			Figure.prototype.removeMouseListener = function(listener){
				this.eventListeners.removeListener("MouseListener", listener);
			}
			/**
			 * �Ƴ�����ƶ�������
			 * @param {Object} listener ��Ҫ�Ƴ��ļ�����
			 */
			Figure.prototype.removeMouseMotionListener = function(listener){
				this.eventListeners.removeListener("MouseMotionListener", listener);
			}
			Figure.prototype.removeNotify = function(){
				for (var i = 0; i < this.children.length; i++){
					this.children[i].removeNotify();
				}
				if (this.internalGetEventDispatcher() != null){
					this.internalGetEventDispatcher().requestRemoveFocus(this);
				}
				this.setFlag(FigureConstants.FLAG_REALIZED, false);
			}
			Figure.prototype.removePropertyChangeListener = function(property,listener){
				if (this.propertyListeners == null) return;
				if(property != null && listener != null){
					this.propertyListeners.removePropertyChangeListener(property, listener);
				}else{
					var temp = (property!=null?property:listener)
					this.propertyListeners.removePropertyChangeListener(temp);
				}
			}
			/**
			 * �ػ� 
			 * repaint();
			 * repaint(Rectangle);
			 * repaint(Number,Number,Number,Number)
			 * @param {Rectangle/Number} arg1 ��Ҫ�ػ�ķ�Χ/x����
			 * @param {Number} arg2 y����
			 * @param {Number} arg3 width
			 * @param {Number} arg4 height
			 */
			Figure.prototype.repaint = function(arg1,arg2,arg3,arg4){
				var x;
				var y;
				var width;
				var height;
				if(arg1 == null){
					x = this.getBounds().x;
					y = this.getBounds().y;
					width = this.getBounds().width;
					height = this.getBounds().height;
				}else if(arg1 != null && Util.isInstanceOf(arg1, Rectangle)){
					var rect = arguments[0];
					x = rect.x;
					y = rect.y;
					width = rect.width;
					height = rect.height;
				}else if(arg1 != null && arg2 != null && arg3 != null && arg4!=null){
					x = arguments[0];
					y = arguments[1];
					width = arguments[2];
					height = arguments[3];
				}
				if (this.isVisible() && width > 0 && height > 0){
					this.getUpdateManager().addDirtyRegion(this,x-1, y-1,width+2,height+2);//�������������Է�ֹ�������ա�
				}
			}
			Figure.prototype.requestFocus = function(){	
				if (!this.isRequestFocusEnabled() || this.hasFocus()){
					return;
				}
				var dispatcher = this.internalGetEventDispatcher();
				if (dispatcher == null){
					return;
				}
				dispatcher.requestFocus(this);
			}
			/**
			 * ʹ��ͼ����Ч�������ø�ͼ�ε�revalidate���� 
			 */
			Figure.prototype.revalidate = function(){
				this.invalidate();
				if( (!this.parent) || this.isValidationRoot())
				{	
					this.getUpdateManager().addInvalidFigure(this);
				}else{
					this.getParent().revalidate();
				}
			}
			/**
			 * ���ñ�����ɫ 
			 * @param {Color} bg �µı�����ɫ
			 */
			Figure.prototype.setBackgroundColor = function(bg){
				this.bgColor = bg;
				this.repaint();
			}
			/**
			 * ����Border
			 * @param {AbstarctBorder} border �µ�Border
			 */
			Figure.prototype.setBorder = function(border){
				this.border = border;
				this.revalidate();
				this.repaint();
			}
			/**
			 * ���ñ߽�
			 * @param {Rectangle} rect �µı߽�
			 */
			Figure.prototype.setBounds = function (rect){
				var x = this.getBounds().x;
				var	y = this.getBounds().y;
				
				var resize = (rect.width != this.getBounds().width) || (rect.height != this.getBounds().height);
				var	translate = (rect.x != x) || (rect.y != y);

				if ((resize || translate) && this.isVisible())
					this.erase();
				if (translate) {
					var dx = rect.x - x;
					var dy = rect.y - y;
					
					this.primTranslate(dx, dy);
				}
	
				this.getBounds().width = rect.width;
				this.getBounds().height = rect.height;
				if (translate || resize) {
					if (resize)
						this.invalidate();
					this.fireFigureMoved();
					this.repaint();
				}
			}
			/**
			 * Ϊ��������Direction����ͼ������Direction
			 * @param {Int} direction
			 */
			Figure.prototype.setChildrenDirection = function(direction){
				var iterator = new FigureIterator(this);
				var child;
				while (iterator.hasNext()) {
					child = iterator.nextFigure();
					if (child.setDirection != null){
						child.setDirection(direction);
					}
				}
			}
			/**
			 * Ϊ������ͼ�����ÿ�����
			 * @param {boolean} value �Ƿ����
			 */
			Figure.prototype.setChildrenEnabled = function(value){
				var iterator = new FigureIterator(this);
				while (iterator.hasNext()){
					iterator.nextFigure().setEnabled(value);
				}
			}
			/**
			 * Ϊ��������Orientation����ͼ������Orientation
			 * @param {Int} orientation
			 */
			Figure.prototype.setChildrenOrientation = function(orientation){
				var iterator = new FigureIterator(this);
				var child;
				while (iterator.hasNext()) {
					child = iterator.nextFigure();
					if (child.setOrientation != null){
						child.setOrientation(orientation);
					}
				}
			}
			/**
			 * Ϊ��ͼ������Լ��
			 * @param {Figure} child ��ͼ��
			 * @param {Object} constraint Լ��
			 */
			Figure.prototype.setConstraint = function(child,constraint){
				if (child.getParent() != this){
					Debugger.log(this.id+"=>Figure--setConstraint()--Figure must be a child");
				}
				if (this.layoutManager != null){
					this.layoutManager.setConstraint(child, constraint);
				}
				this.revalidate();
			}
			/**
			 * Ϊͼ�����������ʽ
			 * @param {String} cursor �����ʽ
			 */
			Figure.prototype.setCursor = function(cursor){
				if (this.cursor == cursor){
					return;
				}
				this.cursor = cursor;
				var  dispatcher = this.internalGetEventDispatcher();
				if (dispatcher != null){
					dispatcher.updateCursor();
				}
			}
			/**
			 * ����ͼ���Ƿ����
			 * @param {boolean} value �Ƿ����
			 */
			Figure.prototype.setEnabled = function(value){
				if (this.isEnabled() == value) {
					return;
				}
				this.setFlag(FigureConstants.FLAG_ENABLED, value);
			}
			Figure.prototype.setFlag = function(flag,value){
				if (value) 
					this.flags |= flag;
				else 
					this.flags &= ~flag;
			}
			Figure.prototype.setFocusTraversable = function(focusTraversable){
				if (this.isFocusTraversable() == focusTraversable){
					return;
				}
				this.setFlag(FigureConstants.FLAG_FOCUS_TRAVERSABLE, focusTraversable);	
			}
			/**
			 * ����ͼ������
			 * @param {String} f ����
			 */
			Figure.prototype.setFont = function(f){
				if(this.font != f){
					this.font = f;
					this.revalidate();
					this.repaint();
				}
			}
			Figure.prototype.setForegroundColor = function(fg){
				if (this.fgColor != null && this.fgColor.equals(fg)) {
					return;
				}
				this.fgColor = fg;
				this.repaint();
			}
			/**
			 * ���ò��ֹ�����
			 * @param {LayoutManager} layoutManager ���ֹ�����
			 */
			Figure.prototype.setLayoutManager = function(layoutManager){
				if(this.layoutManager != null && Util.isInstanceOf(this.layoutManager, LayoutNotifier)){
					layoutManager.realLayout = manager;
				}else{
					this.layoutManager = layoutManager;
				}
				this.revalidate();
			}
			/**
			 * ���ñ�ͼ�ε�λ��
			 * @param {Point} p ��ͼ�ε���λ��
			 */
			Figure.prototype.setLocation = function(p){
				if (this.getLocation().equals(p)) {
					return;
				}
				var r = new Rectangle(this.getBounds());
				r.setLocation(p);
				this.setBounds(r);
			}
			/**
			 * ���ñ�ͼ�ε�����С
			 * @param {Dimension} d ��ͼ�ε��µ�����С
			 */
			Figure.prototype.setMaximumSize = function(d){
				if (this.maxSize != null && this.maxSize.equals(d)) {
					return;
				}
				this.maxSize = d;
				this.revalidate();
			}
			/**
			 * ���ñ�ͼ�ε���С��С
			 * @param {Dimension} d ��ͼ�ε��µ���С��С
			 */
			Figure.prototype.setMinimumSize = function(d){
				if (this.minSize != null && this.minSize.equals(d)) {
					return;
				}
				this.minSize = d;
				this.revalidate();
			}
			/**
			 * �����Ƿ�͸��
			 * @param {boolean} value �Ƿ�͸��
			 */
			Figure.prototype.setOpaque = function(value){
				this.setFlag(FigureConstants.FLAG_OPAQUE,value);
			}
			/**
			 * ���ø�ͼ��
			 * @param {Figure} parent ���ø�ͼ��
			 */
			Figure.prototype.setParent = function(p){
				var oldParent = this.parent;
				this.parent = p;
				this.firePropertyChange("parent", oldParent, p);
			}
			/**
			 * ������ѡ��С
			 * setPreferredSize(Dimension)����setPreferredSize(Number,Number);
			 * @param {Dimension/Number} arg1 �µ���ѡ��С/�µ���ѡ���
			 * @param {Dimension/Number} arg2 �µ���ѡ�߶�
			 */
			Figure.prototype.setPreferredSize = function(arg1,arg2){
				if(arg1 == null){
					return;
				}
				var size;
				if(Util.isInstanceOf(arg1, Dimension)){
					size = arg1;
				}else{
					size = new Dimension(arg1,arg2);
				}
				if (this.prefSize != null && this.prefSize.equals(size)){
					return;
				}
				this.prefSize = size;
				this.revalidate();
			}
			Figure.prototype.setRequestFocusEnabled = function(requestFocusEnabled){
				if (this.isRequestFocusEnabled() == requestFocusEnabled){
					return;
				}
				this.setFlag(FigureConstants.FLAG_FOCUSABLE, requestFocusEnabled);
			}
			/**
			 * ���ô�С
			 * setSize(Dimension)����setSize(Number,Number);
			 * @param {Dimension/Number} arg1 �µĴ�С/�µĿ��
			 * @param {Number} arg2 �µĸ߶�
			 */
			Figure.prototype.setSize = function(arg1,arg2){
				if(arg1 == null){
					return;
				}
				var w;
				var h;
				if(Util.isInstanceOf(arg1, Dimension)){
					w = arg1.width;
					h = arg1.height;
				}else{
					w = arg1;
					h = arg2;
				}
				var bounds = this.getBounds();
				if (bounds.width == w && bounds.height == h){
					return;
				}
				var r = new Rectangle(this.getBounds());
				r.setSize(w, h);
				this.setBounds(r);
			}
			Figure.prototype.setToolTip = function(f){
				if (this.toolTip == f){
					return;
				}
				this.toolTip = f;
			}
			/**
			 * ������Ч��
			 * @param {boolean} value �Ƿ���Ч
			 */
			Figure.prototype.setValid = function(value){
				this.setFlag(FigureConstants.FLAG_VALID,value);
			}
			/**
			 * ���ÿɼ���
			 * @param {boolean} visible �Ƿ�ɼ�
			 */
			Figure.prototype.setVisible = function(visible){
				var currentVisibility = this.isVisible();
				if (visible == currentVisibility) {
					return;
				}
				if (currentVisibility) {
					this.erase();
				}
				this.setFlag(FigureConstants.FLAG_VISIBLE, visible);
				if (visible) {
					this.repaint();
				}
				this.revalidate();
			}
			/**
			 * �ƶ�ͼ��
			 * @param {Number} x �����ƶ�ֵ
			 * @param {Number} y �����ƶ�ֵ
			 */
			Figure.prototype.translate = function(x,y){
				this.primTranslate(x, y);
				this.fireFigureMoved();
			}
			Figure.prototype.translateFromParent = function(rect){
				if (this.useLocalCoordinates()){
						rect.performTranslate(-this.getBounds().x - this.getInsets().left,-this.getBounds().y - this.getInsets().top);
				}
			}
			Figure.prototype.translateToAbsolute = function(rect){
				if (this.getParent() != null) {
					this.getParent().translateToParent(rect);
					this.getParent().translateToAbsolute(rect);
				}
			}
			Figure.prototype.translateToParent = function(rect){
				if(this.useLocalCoordinates()){
					rect.performTranslate(this.getBounds().x + this.getInsets().left,this.getBounds().y + this.getInsets().top);
				}
			}
			Figure.prototype.translateToRelative = function(rect){
				if (this.getParent() != null) {
					this.getParent().translateToRelative(rect);
					this.getParent().translateFromParent(rect);
				}
			}
			/**
			 * �Ƿ�ʹ���������
			 * @returns �Ƿ�ʹ���������
			 * @type boolean
			 */
			Figure.prototype.useLocalCoordinates = function(){
				return false;
			}
			//validate this figure and it's children
			/**
			 * ʹ��ͼ����Ч
			 */
			Figure.prototype.validate = function(){
				if(this.isValid()){
					return;
				}
				this.setValid(true);	
				this.layout();
				var i;
				for(i=0;i<this.children.length;i++){
					this.children[i].validate();
				}
			}
			Figure.prototype.init = function(id){
				this.flags = FigureConstants.FLAG_VISIBLE | FigureConstants.FLAG_ENABLED;
				this.children = [];
				this.bounds = new Rectangle(0, 0, 0, 0);
				this.eventListeners = new EventListenerList();
				this.id = id;
				this.propertyListeners = null;
				this.prefSize = null;
				this.minSize = null;
				this.maxSize = null;
				this.font = null;
				this.bgColor = null;
				this.fgColor = null;
				this.border = null;
				this.toolTip = null;
				this.ancestorHelper = null;
			}
		}
			Figure._initialized = true;
			_classes.defineClass("Figure",prototypeFunction); 
	}
	
	
	
	this.init(id);
}
Figure.NO_INSETS = new NoInsets();
Figure.PRIVATE_RECT = new Rectangle(0,0,0,0);
Figure.PRIVATE_POINT = new Point(0,0);
Figure.EMPTY_LIST = null;
Figure.MAX_DIMENSION = new Dimension(Number.MAX_VALUE, Number.MAX_VALUE);
Figure.MIN_DIMENSION = new Dimension(5, 5);

Figure.FLAG_VALID = 1,
Figure.FLAG_OPAQUE = 1 << 1;
Figure.FLAG_VISIBLE = 1 << 2 ;
Figure.FLAG_FOCUSABLE = 1 << 3;
Figure.FLAG_ENABLED = 1 << 4 ;
Figure.FLAG_FOCUS_TRAVERSABLE = 1 << 5;
Figure.FLAG_REALIZED = 1 << 31;
Figure.MAX_FLAG = Figure.FLAG_FOCUS_TRAVERSABLE;



//------------------------------Class Label-----------------
 _classes.registerClass("Label","Figure");
 /**
* ��ǩ
* @extends Figure
* @class Label
* @constructor hh
* @return һ���µı�ǩ����
*/
function Label(id,text,icon){
	
	if(typeof Label._initialized == "undefined"){
		function prototypeFunction () {
		
			//����ֱ�����϶���
			Label.prototype.alignOnHeight = function(loc,size,alignment){
				var insets = this.getInsets();
				switch(alignment){
					case PositionConstants.TOP:
						loc.y = insets.top;
						break;
					case PositionConstants.BOTTOM:
						loc.y = this.getBounds().height - size.height - insets.bottom;
						break;
					default:
						loc.y = (this.getBounds().height - size.height) / 2;
				}
			}
			
			//�ں����϶���
			Label.prototype.alignOnWidth = function(loc,size,alignment){
				var insets = this.getInsets();
				switch(alignment){
					case PositionConstants.LEFT:
						loc.x = insets.left;
						break;
					case PositionConstants.RIGHT:
						loc.x = this.getBounds().width - size.width - insets.right;
						break;
					default:
						loc.x = (this.getBounds().width - size.width) / 2;
				}
			}
			
			Label.prototype.calculateAlignment = function(){
				switch(this.textPlacement){
					case PositionConstants.EAST:
					case PositionConstants.WEST:
						this.alignOnHeight(this.textLocation, this.getTextSize(), this.textAlignment);
						this.alignOnHeight(this.iconLocation, this.getIconSize(), this.iconAlignment);
						break;
					case PositionConstants.NORTH:
					case PositionConstants.SOUTH:
						this.alignOnWidth(this.textLocation, this.getSubStringTextSize(), this.textAlignment);
						this.alignOnWidth(this.iconLocation, this.getIconSize(), this.iconAlignment);
						break;
				}
			}
			Label.prototype.clearLocation = function(){
				this.iconLocation = null;
				this.textLocation = null;
			}
			Label.prototype.calculateLabelSize = function(textSize){
				//return new Dimension(200,100);
				var gap = this.getIconTextGap();
				if(this.icon == null || this.text==""){
					gap = 0;
				}
				var dimension = new Dimension(0,0);
				if(this.textPlacement == PositionConstants.WEST || this.textPlacement == PositionConstants.EAST){
					dimension.width = this.getIconSize().width + gap + textSize.width;
					dimension.height = Math.max(this.getIconSize().height,textSize.height);
				}else{
					dimension.width = Math.max(this.getIconSize().width,textSize.width);
					dimension.height = this.getIconSize().height + gap + textSize.height;
				}
				return dimension;
			}
			Label.prototype.calculateLocations = function(){
				this.textLocation = new Point();
				this.iconLocation = new Point();
				
				this.calculatePlacement();
				this.calculateAlignment();
				var offset = this.getSize().getDifference(this.getPreferredSize());
				offset.width += this.getTextSize().width - this.getSubStringTextSize().width;
				switch (this.labelAlignment){
					case PositionConstants.CENTER:
						offset.scale(0.5); 
						break;
					case PositionConstants.LEFT: 
						offset.scale(0);
						break;
					case PositionConstants.RIGHT: 
						offset.scale(1);
						break;
					case PositionConstants.TOP: 
						offset.height = 0;
						offset.scale(0.5);
						break;
					case PositionConstants.BOTTOM: 
						offset.height = offset.height * 2;
						offset.scale(0.5);
						break;
					default: 
						offset.scale(0.5); 
						break;
				}
				switch (this.textPlacement){
					case PositionConstants.EAST:
					case PositionConstants.WEST: 
						offset.height = 0;
						break;
					case PositionConstants.NORTH:
					case PositionConstants.SOUTH: 
						offset.width = 0; 
						break;
				}
				
				this.textLocation.translate(offset);
				this.iconLocation.translate(offset);
			}
			Label.prototype.calculatePlacement = function(){
				var  gap = this.getIconTextGap();
				if (this.icon == null || this.text == ""){
					gap = 0;
				}
				var insets = this.getInsets();
				switch(this.textPlacement){
					case PositionConstants.EAST:
						this.iconLocation.x = insets.left;
						this.textLocation.x = this.getIconSize().width + gap + insets.left;
						break;
					case PositionConstants.WEST:
						this.textLocation.x = insets.left;
						this.iconLocation.x = this.getSubStringTextSize().width + gap + insets.left;
						break;
					case PositionConstants.NORTH:
						this.textLocation.y = insets.top;
						this.iconLocation.y = this.getTextSize().height + gap + insets.top;
						break;
					case PositionConstants.SOUTH:
						this.textLocation.y = this.getIconSize().height + gap + insets.top;
						this.iconLocation.y = insets.top;
						break;
				}
			}
			Label.prototype.calculateSubStringTextSize = function(){
				var text = this.getSubStringText();
				if (text==null || text === '') {
					return new Dimension(0,0);
				}
				return this.getTextUtilities().getTextExtents(text, this.getFont());
			}
			Label.prototype.calculateTextSize = function(){
				var text = this.getText();
				if (text==null || text === '') {
					return new Dimension(0,0);
				}
				return this.getTextUtilities().getTextExtents(this.getText(), this.getFont());
			}
			Label.prototype.clearLocations = function(){
				this.iconLocation = null;
				this.textLocation = null;
			}
			/**
			 * ��ȡͼƬ
			 * @returns ����ǩ��ͼƬ
			 * @type Image
			 */
			Label.prototype.getIcon = function(){
				return this.icon;
			}
			//bounds�������Label��parent�ģ���iconLocation�������Label��.
			Label.prototype.getIconBounds = function(){
				return new Rectangle(this.getBounds().getLocation().translate(this.getIconLocation()),this.getIconSize());
			}
			Label.prototype.getIconLocation = function(){
				if( this.iconLocation == null){
					this.calculateLocations();
				}
				return this.iconLocation;
			}
			Label.prototype.getIconSize = function(){
				if(this.iconSize == null){
					if(this.icon != null){
						this.iconSize = new Dimension(this.icon.width,this.icon.height);
					}else{
						return new Dimension(0,0);
					}
					
				}
				return this.iconSize;
			}
			/**
			 * ��ȡͼƬ���ı�֮��ļ��
			 * @returns ͼƬ���ı�֮��ļ��
			 * @type Number
			 */
			Label.prototype.getIconTextGap = function(){
				return this.iconTextGap;
			}
			Label.prototype.getMinimumSize = function(w,h){
				if(this.minSize){
					return this.minSize;
				}
				this.minSize = new Dimension();
				if(this.layoutManager){
					this.minSize.setSize(this.layoutManager.getMinimumSize(this, w, h));
				}
				
				var labelSize = this.calculateLabelSize(this.getTextUtilities().getTextExtents(this.getTruncationString(), this.getFont()).intersect(this.getTextUtilities().getTextExtents(this.getText(),this.getFont())));
				var insets = this.getInsets();
				labelSize.expand(insets.getWidth(), insets.getHeight());
				this.minSize.union(labelSize);
				return this.minSize;
			}
			Label.prototype.getPreferredSize = function(wHint,hHint){
				if(this.prefSize == null){
					this.prefSize = this.calculateLabelSize(this.getTextSize());
					var insets = this.getInsets();
					if(!insets.isEmpty()){
						this.prefSize.expand(insets.getWidth(), insets.getHeight());
					}
					if(this.layoutManager){
						this.prefSize.union(this.layoutManager.getPreferredSize(this, wHint, hHint));
					}
					
				}
				
				if(wHint >= 0 && wHint < this.prefSize.width){
					var minSize = this.getMinimumSize(wHint, hHint);
					var result = this.prefSize.getCopy();
					result.width = Math.min(result.width,wHint);
					result.width = Math.max(minSize.width,result.width);
					return result;
				}
				
				return this.prefSize;
			}
			/**
			 * ��ȡ�Ӵ�
			 * @private 
			 * @returns �Ӵ�
			 * @type String
			 */
			Label.prototype.getSubStringText = function(){
				if(this.subStringText != null){
					return this.subStringText;
				}
				this.subStringText = this.text;
				var widthShrink = this.getPreferredSize().width - this.getSize().width;
				if(widthShrink <= 0){
					return this.subStringText;
				}
				var effectiveSize = this.getTextSize().getExpanded(-widthShrink, 0);
				var currentFont = this.getFont();
				var dotsWidth = this.getTextUtilities().getTextExtents(this.getTruncationString(), currentFont).width;
				if(effectiveSize.width < dotsWidth){
					effectiveSize.width = dotsWidth;
				}
				var subStringLength = this.getTextUtilities().getLargestSubstringConfinedTo(this.text,currentFont,effectiveSize.width - dotsWidth);
				this.subStringText = new String(this.text.substring(0, subStringLength) + this.getTruncationString());
				return this.subStringText;
			}
			Label.prototype.getSubStringTextSize = function(){
				if (this.subStringTextSize == null){
					this.subStringTextSize = this.calculateSubStringTextSize();
				}
				return this.subStringTextSize;
			}
			/**
			 * ��ȡ�ı�
			 * @returns �ı�
			 * @type String
			 */
			Label.prototype.getText = function(){
				return this.text;
			}
			Label.prototype.getTextBounds = function(){
				return new Rectangle(this.getBounds().getLocation().translate(this.getTextLocation()), this.textSize);
			}
			Label.prototype.getTextLocation = function(){
				if(this.textLocation != null){
					return this.textLocation;
				}
				this.calculateLocations();
				return this.textLocation;	
			}
			Label.prototype.getTextSize = function(){
				if(this.textSize != null){
					return this.textSize;
				}
				this.textSize = this.calculateTextSize();
				return this.textSize;
			}
			Label.prototype.getTextUtilities = function(){
				return TextUtilities.INSTANCE;
			}
			Label.prototype.getTruncationString = function(){
				return Label.ELLIPSIS;
			}
			Label.prototype.invalidate = function(){
				this.prefSize = null;
				this.minSize = null;
				this.clearLocations();
				this.textSize = null;
				this.subStringTextSize = null;
				this.subStringText = null;
				//this.iconSize = null;
				this.isa = "Label";
				this.parentMethod("invalidate");
			}
			Label.prototype.isTextTruncated = function(){
				return !this.getSubStringText().equals(this.getText());
			}
			Label.prototype.paintFigure = function(graphics){
				if(this.isOpaque()){
					this.isa = "Label";
					this.parentMethod("paintFigure",graphics);
				}
				var bounds = this.getBounds();
				graphics.translate(bounds.x, bounds.y);
				
				if(this.icon){
					graphics.drawImage(this.icon,this.getIconLocation().x,this.getIconLocation().y);
				}
				if(!this.isEnabled()){
					graphics.translate(1, 1);
					//graphics.setForegroundColor(ColorConstants.buttonLightest);
					
					graphics.fillText(this.getSubStringText(), this.getTextLocation().x,this.getTextLocation().y);
					graphics.translate(-1, -1);
					//graphics.setForegroundColor(ColorConstants.buttonDarker);
				}
				
				graphics.fillText(this.getSubStringText(), this.getTextLocation().x,this.getTextLocation().y);
				graphics.translate(-bounds.x, -bounds.y);
				
			}
			/**
			 * ͼƬ���سɹ�
			 */
			Label.prototype.pictureLoaded = function(){
				this.iconSize = null;
				this.revalidate();
				this.repaint();
//				var parent = this;
//				while(parent.parent != null){
//					parent = parent.parent;
//				}
//				if(parent.lws != null){
//					setTimeout(function(){parent.lws.performUpdate()}); //????��???????
					//parent.lws.performUpdate();
//				}
			}
			/**
			 * Ϊ��ǩ����ͼƬ
			 * @param {Image} icon ��ǩ��Ҫ��ʾ��ͼƬ
			 */
			Label.prototype.setIcon = function(icon){
				if(icon == this.icon){
					return;
				}
				if (this.icon && this.icon.removeLoadListener) {
					this.icon.removeLoadListener(this);
				}
				this.icon = icon;
				icon.addLoadListener(this);
				this.repaint();
				if(this.icon == null){
					this.setIconDimension(new Dimension());
				}else{
					this.setIconDimension(new Dimension(icon.width,icon.height));
				}
			}
			Label.prototype.dispose = function () {
				this.isa = "Label";
		    	this.parentMethod("dispose");
		    	if (this.icon && this.icon.removeLoadListener) {
		    		this.icon.removeLoadListener(this);
		    	}
		    	this.icon = null;
		    },
			/**
			 * Ϊ��ǩ����ͼƬ�Ķ��뷽ʽ
			 * @param {Int} align ͼƬ�Ķ��뷽ʽ
			 */
			Label.prototype.setIconAlignment = function(align){
				if(this.iconAlignment == align){
					return;
				}
				this.iconAlignment = align;
				this.clearLocations();
				this.repaint();
			}
			/**
			 * Ϊ��ǩ����ͼƬ�Ĵ�С
			 * @param {Dimension} d ͼƬ�Ĵ�С
			 */
			Label.prototype.setIconDimension = function(d){
				if(d.equals(this.iconSize)){
					return;
				}
				this.iconSize = d;
				this.revalidate();
			}
			/**
			 * ����ͼƬ���ı��ļ��
			 * @param {Number} gap ͼƬ���ı��ļ��
			 */
			Label.prototype.setIconTextGap = function(gap){
				if(this.iconTextGap == gap){
					return;
				}
				this.iconTextGap = gap;
				this.repaint();
				this.revalidate();
			}
			/**
			 * ���ñ�ǩ�Ķ��뷽ʽ
			 * @param {Int} align ��ǩ�Ķ��뷽ʽ
			 */
			Label.prototype.setLabelAlignment = function(align){
				if(this.labelAlignment == align){
					return;
				}
				this.labelAlignment = align;
				this.clearLocation();
				this.repaint();
			}
			/**
			 * ���ñ�ǩ��ʾ���ı�
			 * @param {String} string ��ǩ��ʾ���ı�
			 */
			Label.prototype.setText = function(string){
				if(string == null){
					string="";
				}
				if(string == this.text){
					return;
				}
				this.text = string;
				this.revalidate();
				this.repaint();
			}
			/**
			 * �����ı��Ķ��뷽ʽ
			 * @param {Int} align �����ı��Ķ��뷽ʽ
			 */
			Label.prototype.setTextAlignment = function(align){
				if(this.textAlignment == align){
					return;
				}
				this.textAlignment = align;
				this.clearLocation();
				this.repaint();
			}
			/**
			 * �����ı���λ��
			 * @param {Int} where �����ı���λ��
			 */
			Label.prototype.setTextPlacement = function(where){
				if (this.textPlacement == where){
					return;
				}
				this.textPlacement = where;
				this.revalidate();
				this.repaint();
			}
			Label.prototype.init = function(id,arg1,arg2){
				this.parentMethod("init",id);
				this.iconSize = new Dimension(0,0);
				this.textAlignment = PositionConstants.CENTER;
				this.iconAlignment = PositionConstants.CENTER;
				this.labelAlignment = PositionConstants.CENTER;
				this.textPlacement = PositionConstants.EAST;
				this.iconTextGap = 3;
				
				if(typeof arg1 == "string" || arg1 instanceof String){
					this.setText(arg1);
				}else if( arg1 instanceof Image){
					this.setIcon(arg1)
				}
				
				if(typeof arg2 == "string" || arg2 instanceof String){
					this.setText(arg2);
				}else if( arg2 instanceof Image){
					this.setIcon(arg2)
				}	
			}
		}
		Label._initialized = true;
		_classes.defineClass("Label",prototypeFunction); 
	}
	
	this.init(id,text,icon);
}
Label.ELLIPSIS = "...";


//-----------------------------Class Panel---------------
 _classes.registerClass("Panel","Figure");
/**
* Panel����͸����Figure
* @extends Figure
* @class Panel
* @constructor
* @return һ���µ�Panel����
*/
function Panel(id){
	if(typeof Panel._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 *�Ƿ�͸��
			 * @return true
			 * @type boolean
			 */
			Panel.prototype.isOpaque = function(){
				return true;
			}
			Panel.prototype.init = function(id){
				this.parentMethod("init",id);
			}
		}
		Panel._initialized = true;
		_classes.defineClass("Panel",prototypeFunction); 
	}
	this.init(id);
}
//-----------------------------Class Shape---------------
 _classes.registerClass("Shape","Figure");
/**
* ��״
* @extends Figure
* @class ��״
* @constructor
* @return һ���µ�Panel����
*/
function Shape(id){
	if(typeof Shape._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ��߿�
			 * @returns �߿�
			 * @type Number
			 */
			Shape.prototype.getLineWidth = function(){
				return this.lineWidth;
			}
			Shape.prototype.outlineShape = function(graphics){
				Debugger.error("please implement the function outlineShape()");
			}
			Shape.prototype.paintFill = function(graphics){
				graphics.setFillColor(this.fillColor);
				graphics.fill();
			}
			Shape.prototype.paintFigure = function(graphics){
				graphics.beginPath();
				if(!this.isEnabled()){
					graphics.translate(1,1);
					//graphics.setBackgroundColor(ColorConstants.buttonLightest);
					//graphics.setForegroundColor(ColorConstants.buttonLightest);
					this.outlineShape(graphics);
					if(this.fill){
						this.paintFill(graphics);
					}
					if(this.outline){
						this.paintOutline(graphics);
					}
					//graphics.setBackgroundColor(ColorConstants.buttonDarker);
					//graphics.setForegroundColor(ColorConstants.buttonDarker);
					graphics.translate(-1, -1);
				}
				this.outlineShape(graphics);
				if(this.fill){
					this.paintFill(graphics);
				}
				if(this.outline){
					this.paintOutline(graphics);
				}
			}
			Shape.prototype.paintOutline = function(graphics){
				graphics.setLineAttributes(this.lineAttributes);
				graphics.stroke();
			}
			
			/**
			 * ������������
			 * @param {LineAttributes} lineAttributes ����������
			 */
			Shape.prototype.setLineAttributes = function(lineAttributes){
				if(!this.lineAttributes.equals(lineAttributes)){
					this.lineAttributes = lineAttributes;
					this.repaint();
				}
			}
			/**
			 * ���������ɫ
			 * @param {Color} color �����ɫ
			 */
			Shape.prototype.setFillColor = function(color){
				if(color != null && !(color.equals(this.fillColor))){
					this.fillColor = color;
					this.repaint();
				}
				
			}
			/**
			 * ����������ɫ
			 * @param {Color} color ������ɫ
			 */
			Shape.prototype.setOutlineColor = function(color){
				if(this.lineAttributes != null ){
					if(this.lineAttributes.lineColor != null && !(this.lineAttributes.lineColor.equals(color))){
						this.lineAttributes.lineColor = color
					}
					this.repaint();
				}
				
			}
			/**
			 * �����Ƿ����
			 * @param {boolean} fill �Ƿ����
			 */
			Shape.prototype.setFill = function(fill){
				if(this.fill != fill){
					this.fill = fill;
					this.repaint();
				}
			}
			/**
			 * �����Ƿ���ʾ����
			 * @param {boolean} outline �Ƿ���ʾ����
			 */
			Shape.prototype.setOutline = function(outline){
				if(this.outline != outline){
					this.outline = outline;
					this.repaint();
				}
			}
			/**
			 * �����������
			 * @param {Number} lineWidth �µ��������
			 */
			Shape.prototype.setLineWidth = function(lineWidth){
				if(this.lineAttributes.lineWidth != lineWidth){
					this.lastLineWidth = lineWidth;
					this.lineWidth = lineWidth;
					this.lineAttributes.lineWidth = lineWidth;
					this.repaint();
				}
			}
			Shape.prototype.init = function(id){
				this.parentMethod("init",id);
				this.lineAttributes = new LineAttributes();
				this.fillColor = new Color();
				this.fill= true;
				this.outline = true;
				this.lineWidth = this.lineAttributes.lineWidth;
				this.lastLineWidth = this.lineWidth;
				//line Width �� lastLineWidth ��ʲô�ô��������Ѿ�����lineAttribute.lineWidth��ô��
			}
		}
		Shape._initialized = true;
		_classes.defineClass("Shape",prototypeFunction); 
	}

	this.init(id);
}

_classes.registerClass("Ellipse","Shape");
/**
* ��Բ
* @extends Shape
* @class ��Բ
* @constructor
* @return һ���µ���Բ
*/
function Ellipse(id){
	if(typeof Ellipse._initialized == "undefined"){
		function prototypeFunction () {
			Ellipse.prototype.containsPoint = function(x,y){
				this.isa = "Ellipse";
				if(!this.parentMethod("containsPoint",x,y)){
					return false;
				}else{
					var r = this.getBounds();
					var ux =  x - r.x - r.width / 2;
					var uy = y - r.y - r.height / 2;
					return ((ux * ux) << 10) / (r.width * r.width) + ((uy * uy) << 10) / (r.height * r.height) <= 256;
				}
			}
			Ellipse.prototype.outlineShape = function(graphics){
				graphics.beginPath();
				var bounds = this.getBounds();
				graphics.ellipse(bounds.x+bounds.width/2,(bounds.y+bounds.height/2),bounds.width/2-1,bounds.height/2-1,0,360,true);
				
			}
			Ellipse.prototype.init = function(id){
				this.parentMethod("init",id);
			}
		}
		Ellipse._initialized = true;
		_classes.defineClass("Ellipse",prototypeFunction); 
	}

	this.init(id);
}

//-----------------------------Class AbstractPointListShape-------
_classes.registerClass("AbstractPointListShape","Shape");
/**
* ����Ķ��ͼ��
* @extends Shape
* @class ����Ķ��ͼ��
* @constructor
* @return һ���µĳ���Ķ��ͼ��
*/
function AbstractPointListShape(id){
	if(typeof AbstractPointListShape._initialized == "undefined"){
		function prototypeFunction () {
			
			AbstractPointListShape.prototype.containsPoint = function(x,y){
				this.isa = "AbstractPointListShape";
				if(!this.parentMethod("containsPoint",x,y)){
					return false;
				}
				return this.shapeContainsPoint(x, y) || this.childrenContainsPoint(x, y);
			}
			AbstractPointListShape.prototype.childrenContainsPoint = function(x,y){
				for(var i=0;i<this.children.length;i++){
					if(this.children[i].containsPoint(x,y)) return true;
				}
				return false;
			}
			AbstractPointListShape.prototype.shapeContainsPoint = function(){
				//abstract
			}
			/**
			 * ����һ����
			 * @param {Point} pt �����ӵĵ�
			 */
			AbstractPointListShape.prototype.addPoint = function(pt){
				this.erase();
				this.points.addPoint(pt);
				this.repaint();
			}
			/**
			 * �õ���ʼ��
			 * @returns ��ʼ��
			 * @type Point
			 */
			AbstractPointListShape.prototype.getStart = function(){
				return this.points.getFirstPoint();
			}
			/**
			 * �õ��յ�
			 * @returns �յ�
			 * @type Point
			 */
			AbstractPointListShape.prototype.getEnd = function(){
				return this.points.getLastPoint();
			}
			/**
			 * �õ����еĵ�
			 * @returns ���еĵ�
			 * @type PointList
			 */
			AbstractPointListShape.prototype.getPoints = function(){
				return this.points;
			}
			/**
			 * ����һ����
			 * @param {Point} pt ������ĵ�
			 * @param {Int} index ����λ��
			 */
			AbstractPointListShape.prototype.insertPoint = function(pt,index){
				this.erase();
				this.points.insertPoint(pt,index);
				this.repaint();
			}
			/**
			 * �Ƴ����еĵ�
			 */
			AbstractPointListShape.prototype.removeAllPoints = function(){
				this.erase();
				this.points.removeAllPoints();
			}
			/**
			 * �Ƴ�ĳһ����
			 * @param {Int} index ���Ƴ��ĵ�λ��
			 */
			AbstractPointListShape.prototype.removePoint = function(index){
				this.erase();
				this.points.removePoint(index);
				this.repaint();
			}
			/**
			 * �������
			 * @param {Point} pt �µ����
			 */
			AbstractPointListShape.prototype.setStart = function(start){
				if(this.points.size == 0){
					this.addPoint(start);
				}else{
					this.setPoint(start,0);
				}
			}
			/**
			 * �����յ�
			 * @param {Point} pt �µ��յ�
			 */
			AbstractPointListShape.prototype.setEnd = function(end){
				if(this.points.size < 2){
					this.addPoint(end);
				}else{
					this.setPoint(end,this.points.size -1);
				}
			}
			/**
			 * ���������յ�
			 * @param {Point} start �µ����
			 * @param {Point} end �µ��յ�
			 */
			AbstractPointListShape.prototype.setEndpoints = function(start,end){
				this.setStart(start);
				this.setEnd(end);
			}
			/**
			 * ���õ�
			 * @param {Point} pt �µĵ�
			 * @param {Int} index �����õ��λ��
			 */
			AbstractPointListShape.prototype.setPoint = function(pt,index){
				this.erase();
				this.points.setPoint(pt,index);
				this.repaint();
			}
			/**
			 * �������еĵ�
			 * @param {Points} pt �µĵ�
			 * @param {Int} index �����õ��λ��
			 */
			AbstractPointListShape.prototype.setPoints = function(points){
				this.erase();
				this.points = points;
				this.repaint();
			}
			
			AbstractPointListShape.prototype.init = function(id){
				this.parentMethod("init",id);
				this.points = new PointList();
			}
		}
		AbstractPointListShape._initialized = true;
		_classes.defineClass("AbstractPointListShape",prototypeFunction); 
	}

	this.init(id);
}

//-----------------------------Class RectangleFigure-------
_classes.registerClass("RectangleFigure","Shape");
/**
* ����ͼ��
* @extends Shape
* @class ����ͼ��
* @constructor
* @return һ���µľ���ͼ��
*/
function RectangleFigure(id){
	if(typeof RectangleFigure._initialized == "undefined"){
		function prototypeFunction () {
		RectangleFigure.prototype.outlineShape = function(graphics){
			var lineInset = Math.max(1,this.getLineWidth())/2;
			var inset1 = Math.floor(lineInset);
			var inset2 = Math.ceil(lineInset);
			var x = this.getBounds().x + inset1;
			var y = this.getBounds().y + inset2;
			var width = this.getBounds().width - (inset1 + inset2);
			var height = this.getBounds().height - (inset1 + inset2);
			graphics.rect(x,y,width,height);
		}
		RectangleFigure.prototype.init = function(id){
				this.parentMethod("init",id);
			}
		}
		RectangleFigure._initialized = true;
		_classes.defineClass("RectangleFigure",prototypeFunction); 
	}

	this.init(id);
}


//-----------------------------Class RoundedRectangle-------
_classes.registerClass("RoundedRectangle","Shape");
/**
* Բ�Ǿ���
* @extends Shape
* @class Բ�Ǿ���
* @constructor
* @return һ���µ�Բ�Ǿ���
*/
function RoundedRectangle(id){
	if(typeof RoundedRectangle._initialized == "undefined"){
		function prototypeFunction () {
			RoundedRectangle.prototype.outlineShape = function(graphics){
				var lineInset = Math.max(1,this.getLineWidth())/2;
				var inset1 = Math.floor(lineInset);
				var inset2 = Math.ceil(lineInset);
				var x = this.getBounds().x + inset1;
				var y = this.getBounds().y + inset2;
				var width = this.getBounds().width - (inset1 + inset2);
				var height = this.getBounds().height - (inset1 + inset2);
				graphics.roundRect(x,y,width,height,this.corner.width,this.corner.height);
			}
			/**
			 * ����Բ�ǵĴ�С
			 * @param {Demension} d Բ�ǵĴ�С
			 */
			RoundedRectangle.prototype.setCornerDimensions = function(d){
				this.corner.width = d.width;
				this.corner.height = d.height;
			}
			RoundedRectangle.prototype.init = function(id){
				this.parentMethod("init",id);
				this.corner = new Dimension(18,18);
			}
		}
		RoundedRectangle._initialized = true;
		_classes.defineClass("RoundedRectangle",prototypeFunction); 
	}

	this.init(id);
}

//-----------------------------Class Triangle-------
_classes.registerClass("Triangle","Shape");
/**
* ������
* @extends Shape
* @class ������
* @constructor
* @return һ���µ�������
*/
function Triangle(id){
	if(typeof Triangle._initialized == "undefined"){
		function prototypeFunction () {
		Triangle.prototype.outlineShape = function(graphics){
			graphics.polygon(this.triangle);
		}
		Triangle.prototype.primTranslate = function(dx,dy){
			this.isa = "Triangle";
			this.parentMethod("primTranslate",dx,dy);
			this.triangle.translate(dx, dy);
		}
		Triangle.prototype.setDirection = function(value){
			if(value == null){
				return;
			}
			if((value&(PositionConstants.NORTH|PositionConstants.SOUTH))!=0){
				this.orientation = PositionConstants.VERTICAL;
			}else{
				this.orientation = PositionConstants.HORIZONTAL;
			}
			this.direction = value;
			this.revalidate();
			this.repaint();
		}
		Triangle.prototype.setOrientation = function(value){
			if(this.orientation == PositionConstants.VERTICAL && value == PositionConstants.HORIZONTAL){
				if(this.direction == PositionConstants.NORTH){
					this.setDirection(PositionConstants.WEST);
				}else{
					this.setDirection(PositionConstants.EAST);
				}
				if(this.orientation == PositionConstants.HORIZONTAL && value == PositionConstants.VERTICAL){
					if (this.direction == PositionConstants.WEST) {
						this.setDirection(PositionConstants.NORTH);
					}else{
						this.setDirection(PositionConstants.SOUTH);
					}
				}
			}
		}
		Triangle.prototype.validate = function(){
			this.isa = "Triangle";
			this.parentMethod("validate");
			var r = new Rectangle(0,0,0,0);
			r.setBounds(this.getBounds());
			r.crop(this.getInsets());
			r.resize(-1, -1);
			var size=0;
			switch (this.direction & (PositionConstants.NORTH | PositionConstants.SOUTH)) {
				case 0: //East or west.
					size = Math.min(r.height / 2, r.width);
					r.x += (r.width - size) / 2;
					break;
				default: //North or south
					size = Math.min(r.height, r.width / 2);
					r.y += (r.height - size) / 2;
					break;
			}
			size = Math.max(size, 1); //Size cannot be negative
			var head, p2, p3;
			switch (this.direction) {
				case PositionConstants.NORTH:
					head = new Point(r.x + r.width / 2, r.y);
					p2   = new Point (head.x - size, head.y + size);
					p3   = new Point (head.x + size, head.y + size);
					break;
				case PositionConstants.SOUTH:
					head = new Point (r.x + r.width / 2, r.y + size);
					p2   = new Point (head.x - size, head.y - size);
					p3   = new Point (head.x + size, head.y - size);
					break;
				case PositionConstants.WEST:
					head = new Point (r.x, r.y + r.height / 2);
					p2   = new Point (head.x + size, head.y - size);
					p3   = new Point (head.x + size, head.y + size);
					break;
				default:
					head = new Point(r.x + size, r.y + r.height / 2);
					p2   = new Point(head.x - size, head.y - size);
					p3   = new Point(head.x - size, head.y + size);
			}
			this.triangle.removeAllPoints();
			this.triangle.addPoint(head);
			this.triangle.addPoint(p2);
			this.triangle.addPoint(p3);
		}
		Triangle.prototype.init = function(id){
				this.parentMethod("init",id);
				this.direction = PositionConstants.NORTH;
				//this.direction = PositionConstants.EAST;
				//orientation���ô�����
				this.orientation = PositionConstants.VERTICAL;
				//this.orientation = PositionConstants.HORIZONTAL;
				this.triangle = new PointList();
			}
		}
		Triangle._initialized = true;
		_classes.defineClass("Triangle",prototypeFunction); 
	}

	this.init(id);
}

//-----------------------------Class PolygonShape-------
//polygonShape��ÿ�����λ�ö������λ�ã����Խ�����shape��Ϊһ�����壬Ȼ����в���
_classes.registerClass("PolygonShape","AbstractPointListShape");
/**
* �������״
* @extends AbstractPointListShape
* @class �������״
* @constructor
* @return һ���µĶ������״
*/
function PolygonShape(id){
	if(typeof PolygonShape._initialized == "undefined"){
		function prototypeFunction () {
		PolygonShape.prototype.shapeContainsPoint = function(x,y){
			var location = this.getLocation();
			return Geometry.polygonContainsPoint(this.points, x - location.x, y - location.y);
		}
		PolygonShape.prototype.outlineShape = function(graphics){
			var location = this.getLocation();
			graphics.pushState();
			graphics.translate(location.x,location.y);
			graphics.polygon(this.points);
			graphics.restoreState();
		}
		PolygonShape.prototype.init = function(id){
				this.parentMethod("init",id);
			}
		}
		PolygonShape._initialized = true;
		_classes.defineClass("PolygonShape",prototypeFunction); 
	}

	this.init(id);
}



//-----------------------------Class Polyline-------
_classes.registerClass("Polyline","AbstractPointListShape");
/**
* ����
* @extends AbstractPointListShape
* @class ����
* @constructor
* @return һ���µ�����
*/
function Polyline(id){
	if(typeof Polyline._initialized == "undefined"){
		function prototypeFunction () {
			Polyline.prototype.containsPoint = function(x,y){
				var tolerance = Math.max(this.getLineWidth() / 2, this.tolerance);
				Polyline.LINEBOUNDS.setBounds(this.getBounds());
				Polyline.LINEBOUNDS.expand(tolerance, tolerance);
				if(!Polyline.LINEBOUNDS.contains(x, y)){
					return false;
				}
				return this.shapeContainsPoint(x, y) || this.childrenContainsPoint(x, y);
			}
			Polyline.prototype.shapeContainsPoint = function(x,y){
				return Geometry.polylineContainsPoint(this.points, x, y, this.tolerance);
			}
			Polyline.prototype.getBounds = function(){
				
				if(this.bounds == null){
					var expand = this.getLineWidth() / 2.0;
					this.bounds = this.getPoints().getBounds();
					if(this.bounds != null){
						this.bounds = this.bounds.getExpanded(expand, expand);
						/* 
						ȡ�����㣬����canvas��clearRect��Rect��������⡣�������£�
						���context.fillRect(0,0,50,50);context.clearRect(5.5,5.5,10,10);
						������context.fillRect(5.5,5.5,10,10)ȥ���,�����Ͽ�����ȫ�ָ�����ʵ������ǻ���һ�����±�����һȦϸ�졣							
						�������õ���context.fillRect(0,0,50,50);context.clearRect(5.5,5.5,10,10);
						context.rect(5.5,5.5,10,10);context.clip();context.fillRect(0,0,50,50);������������������ϸ�졣
						�ܵ���˵����canvas��clearRect��Rectʱ����С�����ֵ�ȡ�᲻ͬ��
						*/
						this.bounds.x = this.bounds.x>>0; 
						this.bounds.y = this.bounds.y >>0
					}
				}
				
				return this.bounds;
			}
			Polyline.prototype.isOpaque = function(){
				return false;
			}
			Polyline.prototype.outlineShape = function(graphics){
				
				graphics.polyline(this.points);
			}
			//�˷���Ϊ�գ����ǵ�������Figure����ͬ������ʹ�����ߵ�λ�ò��򲼾ֶ��ı䣬ֻ����ÿ���۵�����������Ϊ����λ�á�
			Polyline.prototype.primTranslate = function(){
			}
			Polyline.prototype.removeAllPoints = function(){
				this.isa = "Polyline";
				this.parentMethod("removeAllPoints");
				this.bounds = null;
			}
			Polyline.prototype.setLineWidth = function(w){
				if (this.getLineWidth() == w) {
					return;
				}
				if(w < this.getLineWidth()){
					this.erase();
				}
				this.bounds = null;
				this.isa = "Polyline";
				this.parentMethod("setLineWidth",w);
			}
			Polyline.prototype.setPoints = function(points){
				this.isa = "Polyline";
				this.parentMethod("setPoints",points);
				this.firePropertyChange(Connection.PROPERTY_POINTS, null, points);
			}
			/**
			 * �������ж�һ�����Ƿ��ڴ�Figure��ʱ�������Χ
			 * @param {Number} tolerance �������Χ
			 */
			Polyline.prototype.setTolerance = function(tolerance){
				 this.tolerance = tolerance;
			}
			Polyline.prototype.repaint = function(){
				this.bounds = null;
				this.isa = "Polyline";
				this.parentMethod("repaint");
			}
			Polyline.prototype.init = function(id){
				this.parentMethod("init",id);
				this.tolerance = 2;
				this.setFill(false);
				this.bounds  = null;
			}
		}
		Polyline._initialized = true;
		_classes.defineClass("Polyline",prototypeFunction); 
	}

	this.init(id);
}
Polyline.LINEBOUNDS = Rectangle.SINGLETON;



//-----------------------------Class Polygon-------
//polygon��ÿ�����λ�ö��Ǿ���λ�ã����ֶ�����Ч
_classes.registerClass("Polygon","Polyline");
/**
* �����
* @extends Polyline
* @class �����
* @constructor
* @return һ���µĶ����
*/
function Polygon(id){
	if(typeof Polygon._initialized == "undefined"){
		function prototypeFunction () {
			Polygon.prototype.containsPoint = function(x,y){
				if (!this.getBounds().contains(x, y)){
					return false;
				}
				return this.shapeContainsPoint(x, y) || this.childrenContainsPoint(x, y);
			}
			Polygon.prototype.shapeContainsPoint = function(x,y){
				return Geometry.polygonContainsPoint(this.points, x, y);
			}
			Polygon.prototype.outlineShape = function(graphics){
				graphics.polygon(this.getPoints());
			}
			Polygon.prototype.init = function(id){
				this.parentMethod("init",id);
			}
		}
		Polygon._initialized = true;
		_classes.defineClass("Polygon",prototypeFunction); 
	}

	this.init(id);
}



//-----------------------------Class PolylineShape-------
//��λΪ���λ��
_classes.registerClass("PolylineShape","AbstractPointListShape");
function PolylineShape(id){
	if(typeof PolylineShape._initialized == "undefined"){
		function prototypeFunction () {
			PolylineShape.prototype.shapeContainsPoint = function(x,y){
				var location = this.getLocation();
				return Geometry.polylineContainsPoint(this.points, x - location.x, y - location.y, this.tolerance);
			}
			PolylineShape.prototype.outlineShape = function(graphics){
				graphics.pushState();
				graphics.translate(this.getLocation());
				graphics.polyline(this.points);
				graphics.restoreState();
			}
			PolylineShape.prototype.setTolerance = function(tolerance){
				this.tolerance = tolerance;
			}
			PolylineShape.prototype.init = function(id){
				this.parentMethod("init",id);
				this.tolerance = 2;
			}
		}
		PolylineShape._initialized = true;
		_classes.defineClass("PolylineShape",prototypeFunction); 
	}

	this.init(id);
}

//-----------------------------Class ScalablePolygonShape-------
_classes.registerClass("ScalablePolygonShape","AbstractPointListShape");
function ScalablePolygonShape(id){
	if(typeof ScalablePolygonShape._initialized == "undefined"){
		function prototypeFunction () {
			ScalablePolygonShape.prototype.shapeContainsPoint = function(x,y){
				var location = this.getLocation();
				return Geometry.polygonContainsPoint(this.getScaledPoints(), x - location.x, y - location.y);
			}
			ScalablePolygonShape.prototype.outlineShape = function(graphics){
				graphics.pushState();
				graphics.translate(this.getLocation());
				graphics.polygon(this.getScaledPoints());
				graphics.restoreState();
			}
			ScalablePolygonShape.prototype.getTemplateBounds = function(){
				ScalablePolygonShape.TEMPLATEBOUNDS.setLocation(0, 0);
				ScalablePolygonShape.TEMPLATEBOUNDS.setSize(0, 0);
				var intArray = this.points.toIntArray();
				for(var i=0;i<intArray.length;){
					var x= intArray[i++];
					if(x > ScalablePolygonShape.TEMPLATEBOUNDS.width){
						ScalablePolygonShape.TEMPLATEBOUNDS.width = x;
					}
					var y = intArray[i++];
					if(y >ScalablePolygonShape.TEMPLATEBOUNDS.height){
						ScalablePolygonShape.TEMPLATEBOUNDS.height = y;
					}
				}
				return ScalablePolygonShape.TEMPLATEBOUNDS;
				
			}
			ScalablePolygonShape.prototype.getScaledPoints = function(){
				if(this.scaledPoints != null){
					return this.scaledPoints;
				}
				var pointsBounds = this.getTemplateBounds();
				var actualBounds = this.getBounds();
				var  xScale = actualBounds.width > this.lineWidth ? (actualBounds.width - this.lineWidth) / pointsBounds.width : 0;
				var yScale = actualBounds.height > this.lineWidth ? (actualBounds.height - this.lineWidth) / pointsBounds.height : 0;
				var halfLineWidth = (this.lineWidth) / 2;
				this.scaledPoints = new PointList(this.points);
				var intArray = this.scaledPoints.toIntArray();
				for(var i=0;i<intArray.length;i += 2){
					intArray[i] = Math.floor(intArray[i] * xScale) + halfLineWidth;
					intArray[i + 1] = Math.floor(intArray[i + 1] * yScale) + halfLineWidth;	
				}
				return scaledPoints;
			}
			ScalablePolygonShape.prototype.addPoint = function(pt){
				this.scaledPoints = null;
				this.isa = "ScalablePolygonShape";
				this.parentMethod("addPoint",pt);
			}
			ScalablePolygonShape.prototype.insertPoint = function(pt,index){
				this.scaledPoints = null;
				this.isa = "ScalablePolygonShape";
				this.parentMethod("insertPoint",pt);
			}
			ScalablePolygonShape.prototype.removeAllPoints = function(){
				this.scaledPoints = null;
				this.isa = "ScalablePolygonShape";
				this.parentMethod("removeAllPoints");
			}
			ScalablePolygonShape.prototype.removePoint = function(index){
				this.scaledPoints = null;
				this.isa = "ScalablePolygonShape";
				this.parentMethod("removePoint",index);
			}
			ScalablePolygonShape.prototype.setStart = function(start){
				this.scaledPoints = null;
				this.isa = "ScalablePolygonShape";
				this.parentMethod("setStart",start);
			}
			ScalablePolygonShape.prototype.setEnd = function(end){
				this.scaledPoints = null;
				this.isa = "ScalablePolygonShape";
				this.parentMethod("setEnd",end);
			}
			ScalablePolygonShape.prototype.setPoint = function(pt,index){
				this.scaledPoints = null;
				this.isa = "ScalablePolygonShape";
				this.parentMethod("setPoint",pt,index);
			}
			ScalablePolygonShape.prototype.setPoints = function(points){
				this.scaledPoints = null;
				this.isa = "ScalablePolygonShape";
				this.parentMethod("setPoints",points);
			}
			ScalablePolygonShape.prototype.setBounds = function(rect){
				this.scaledPoints = null;
				this.isa = "ScalablePolygonShape";
				this.parentMethod("setBounds",rect);
			}
			ScalablePolygonShape.prototype.setLineWidth = function(w){
				this.scaledPoints = null;
				this.isa = "ScalablePolygonShape";
				this.parentMethod("setLineWidth",w);
			}
			ScalablePolygonShape.prototype.init = function(id){
				this.parentMethod("init",id);
				var scaledPoints = null;
			}
		}
		ScalablePolygonShape._initialized = true;
		_classes.defineClass("ScalablePolygonShape",prototypeFunction); 
	}
	this.init(id);
}
ScalablePolygonShape.TEMPLATEBOUNDS = Rectangle.SINGLETON;


//-----------------------------Class PolylineDecoration-------
_classes.registerClass("PolylineDecoration","Polyline");
/**
* ��������
* @extends Polyline
* @class ��������
* @constructor
* @return һ���µ���������
*/
function PolylineDecoration(id){
	if(typeof PolylineDecoration._initialized == "undefined"){
		function prototypeFunction () {
			PolylineDecoration.prototype.getPoints = function(){
				if (this.points == null) {
					this.points = new PointList();
					for (var i = 0; i < this.template.size; i++){
						this.points.addPoint(this.transform.getTransformed(this.template.getPoint(i)));
					}
				}
				return this.points;
			}
			PolylineDecoration.prototype.setLocation = function(p){
				this.points = null;
				this.bounds = null;
				this.location.setLocation(p);
				this.transform.setTranslation(p.x, p.y);
			}
			/**
			 * ����ģ��
			 * @param {PointList} pl ģ��
			 */
			PolylineDecoration.prototype.setTemplate = function(pl){
				this.erase();
				this.template = pl;
				this.points = null;
				this.bounds = null;
				this.repaint();
			}
			/**
			 * �������ű���
			 * @param {Number} x �������ű���
			 * @param {Number} y �������ű���
			 */
			PolylineDecoration.prototype.setScale = function(x,y){
				this.points = null;
				this.bounds = null;
				this.transform.setScale(x, y);
			}
			/**
			 * �������õĵ�
			 * @param {Point} ref ���õ�
			 */
			PolylineDecoration.prototype.setReferencePoint = function(ref){
				var pt = Point.SINGLETON;
				pt.setLocation(ref);
				pt.negate().translate(this.location);
				this.setRotation(Math.atan2(pt.y, pt.x));
			}
			/**
			 * ������ת�Ƕ�
			 * @param {Number} angle ��ת�ĽǶ�
			 */
			PolylineDecoration.prototype.setRotation = function(angle){
				this.points = null;
				this.bounds = null;
				this.transform.setRotation(angle);
			}
			PolylineDecoration.prototype.init = function(id){
				this.parentMethod("init",id);
				this.location = new Point(0,0);
				this.template = PolylineDecoration.TRIANGLE_TIP;
				this.transform = new Transform();
				this.setBackgroundColor(ColorConstants.black);
				this.setScale(7, 3);
			}
		}
		PolylineDecoration._initialized = true;
		_classes.defineClass("PolylineDecoration",prototypeFunction); 
	}

	this.init(id);
}
PolylineDecoration.TRIANGLE_TIP =  new PointList();
PolylineDecoration.TRIANGLE_TIP.addPoint(-1, 1);
PolylineDecoration.TRIANGLE_TIP.addPoint( 0, 0);
PolylineDecoration.TRIANGLE_TIP.addPoint(-1, -1);



//-----------------------------Class PolygonDecoration-------
_classes.registerClass("PolygonDecoration","Polygon");
/**
* ���������
* @extends Polygon
* @class ���������
* @constructor
* @return һ���µĶ��������
*/
function PolygonDecoration(id){
	if(typeof PolygonDecoration._initialized == "undefined"){
		function prototypeFunction () {
			PolygonDecoration.prototype.getLocalBackgroundColor = function(){
				this.isa = "PolygonDecoration";
				var parentBackGroundColor = this.parentMethod("getLocalBackgroundColor");
				if( parentBackGroundColor == null){
					return this.getForegroundColor();
				}else{
					return parentBackGroundColor;
				}
			}
			PolygonDecoration.prototype.getPoints = function(){
				if (this.points == null) {
					this.points = new PointList();
					for (var i = 0; i < this.template.size; i++){
						this.points.addPoint(this.transform.getTransformed(this.template.getPoint(i)));
					}
				}
				return this.points;
			}
			PolygonDecoration.prototype.setLocation = function(p){
				this.points = null;
				this.bounds = null;
				this.location.setLocation(p);
				this.transform.setTranslation(p.x, p.y);
			}
			/**
			 * ����ģ��
			 * @param {PointList} pl ģ��
			 */
			PolygonDecoration.prototype.setTemplate = function(pl){
				this.erase();
				this.template = pl;
				this.points = null;
				this.bounds = null;
				this.repaint();
			}
			/**
			 * �������ű���
			 * @param {Number} x �������ű���
			 * @param {Number} y �������ű���
			 */
			PolygonDecoration.prototype.setScale = function(x,y){
				this.points = null;
				this.bounds = null;
				this.transform.setScale(x, y);
			}
			/**
			 * �������õĵ�
			 * @param {Point} ref ���õ�
			 */
			PolygonDecoration.prototype.setReferencePoint = function(ref){
				var pt = Point.SINGLETON;
				pt.setLocation(ref);
				pt.negate().translate(this.location);
				this.setRotation(Math.atan2(pt.y, pt.x));
			}
			/**
			 * ������ת�Ƕ�
			 * @param {Number} angle ��ת�ĽǶ�
			 */
			PolygonDecoration.prototype.setRotation = function(angle){
				this.points = null;
				this.bounds = null;
				this.transform.setRotation(angle);
			}
			PolygonDecoration.prototype.init = function(id){
				this.parentMethod("init",id);
				this.location = new Point();
				this.template = PolygonDecoration.TRIANGLE_TIP;
				this.transform = new Transform();
				this.setFill(true);
				this.setScale(7, 3);
			}
		}
		PolygonDecoration._initialized = true;
		_classes.defineClass("PolygonDecoration",prototypeFunction); 
	}

	this.init(id);
}
PolygonDecoration.TRIANGLE_TIP = new PointList();
PolygonDecoration.INVERTED_TRIANGLE_TIP = new PointList();
PolygonDecoration.TRIANGLE_TIP.addPoint(0, 0);
PolygonDecoration.TRIANGLE_TIP.addPoint(-1, 1);
PolygonDecoration.TRIANGLE_TIP.addPoint(-1, -1);
PolygonDecoration.INVERTED_TRIANGLE_TIP.addPoint(0, 1);
PolygonDecoration.INVERTED_TRIANGLE_TIP.addPoint(0, -1);
PolygonDecoration.INVERTED_TRIANGLE_TIP.addPoint(-1, 0);

//-----------------------------Class FigureConstants-------
/**
 * ͼ��ʹ�õ�һЩ����ֵ
 */
function FigureConstants(){
}
/**
 * @static
 * @field
 */
	FigureConstants.FLAG_VALID = 1,
	/**
	 * @static
	 * @field
	 */
	FigureConstants.FLAG_OPAQUE = 1 << 1;
	/**
	 * @static
	 * @field
	 */
	FigureConstants.FLAG_VISIBLE = 1 << 2 ;
	/**
	 * @static
	 * @field
	 */
	FigureConstants.FLAG_FOCUSABLE = 1 << 3;
	/**
	 * @static
	 * @field
	 */
	FigureConstants.FLAG_ENABLED = 1 << 4 ;
	/**
	 * @static
	 * @field
	 */
	FigureConstants.FLAG_FOCUS_TRAVERSABLE = 1 << 5;
	/**
	 * @static
	 * @field
	 */
	FigureConstants.FLAG_REALIZED = 1 << 31;
	/**
	 * @static
	 * @field
	 */
	FigureConstants.MAX_FLAG = FigureConstants.FLAG_FOCUS_TRAVERSABLE;


//-----------------------------Class RootFigure---------------

 _classes.registerClass("RootFigure","Figure");
function RootFigure(lws){
	
	if(typeof RootFigure._initialized == "undefined"){
		function prototypeFunction () {
		
			RootFigure.prototype.getUpdateManager = function(){
				return this.lws.getUpdateManager();
			}
			RootFigure.prototype.internalGetEventDispatcher = function(){
				return this.lws.getEventDispatcher();
			}
			RootFigure.prototype.isShowing = function(){
				return true;
			}
			RootFigure.prototype.init = function(lws){
				this.parentMethod("init","rootFigure");
				this.lws = lws;
			}
		}
		RootFigure._initialized = true;
		_classes.defineClass("RootFigure",prototypeFunction); 
	}

	this.init(lws);

}/**
load-dependancies:Figure
*******************
Layer
---LayeredPane
------ScalableLayeredPane
------FreeformLayeredPane
---------ScalableFreeformLayeredPane
---FreeformLayer
------ConnectionLayer
*/
//-----------------------------Class Layer-------
_classes.registerClass("Layer","Figure");
/**
 * @class ͼ��
 * @constructor
 * @extends Figure
 * @param {String} id ͼ��id
 * @returns
 */
function Layer(id){
	if(typeof Layer._initialized == "undefined"){
		function prototypeFunction () {
			Layer.prototype.containsPoint = function(x,y){
				if (this.isOpaque()){
					this.isa = "Layer";
					return this.parentMethod("containsPoint",x, y);
				}
				var pt = Point.SINGLETON;
				pt.setLocation(x, y);
				this.translateFromParent(pt);
				x = pt.x;
				y = pt.y;
				for (var i = 0; i < this.children.length; i++) {
					var child = this.children[i];
					if (child.containsPoint(x, y)){
						return true;
					}
				}
				return false;
			}
			Layer.prototype.findFigureAt = function(x,y,search){
				this.isa = "Layer";
				if (!this.isEnabled()){
					return null;
				}
				if (this.isOpaque()){
					return this.parentMethod("findFigureAt",x, y, search);
				}
				var f = this.parentMethod("findFigureAt",x, y, search);
				if (f == this){
					return null;
				}
				return f;
			}
			Layer.prototype.init = function(id){
				this.parentMethod("init",id);
			}
		}
		Layer._initialized = true;
		_classes.defineClass("Layer",prototypeFunction); 
	}

	this.init(id);
}
 
//-----------------------------Class LayeredPane-------
_classes.registerClass("LayeredPane","Layer");
/**
 * @class ͼ�㴰��
 * @constructor
 * @extends Layer
 * @param {String} id ͼ��id
 * @returns
 */
function LayeredPane(id){
	if(typeof LayeredPane._initialized == "undefined"){
		function prototypeFunction () {
			LayeredPane.prototype.add = function(figure,layerKey,index){
				if (index == -1) {
					index = this.layerKeys.length;
				}
				this.isa = "LayeredPane";
				this.parentMethod("add",figure, null, index);
				Util.Array.add(this.layerKeys,layerKey,index);
				//this.layerKeys.add(layerKey,index);
			}
			/**
			 * ��ĳͼ��֮�����ͼ��
			 * @param {Layer} layer ������ͼ��
			 * @param {Object} key  ������ͼ����ͼ�㴰����ʹ�õ�key
			 * @param {Layer} after ���ڶ�λ��ͼ��
			 */
			LayeredPane.prototype.addLayerAfter = function(layer,key,after){
				var index = Util.Array.indexOf(this.layerKeys, after);
				this.add(layer, key, ++index);
				
			}
			/**
			 * ��ĳͼ��֮ǰ����ͼ��
			 * @param {Layer} layer ������ͼ��
			 * @param {Object} key  ������ͼ����ͼ�㴰����ʹ�õ�key
			 * @param {Layer} after ���ڶ�λ��ͼ��
			 */
			LayeredPane.prototype.addLayerBefore = function(layer,key,before){
				var index =  Util.Array.indexOf(this.layerKeys, before);
				this.add(layer, key, index);
			}
			/**
			 * @private
			 */
			LayeredPane.prototype.getLayerbyKey = function(key){
				var index =  Util.Array.indexOf(this.layerKeys, key);
				if (index == -1){
					return null;
				}
				return this.children[index];
			}
			/**
			 * �õ�ĳͼ��
			 * @param {int|Object} arg ͼ���λ�û���Key
			 */
			LayeredPane.prototype.getLayer = function(arg){
				if(arg>0){
					return this.children[index];
				}else{
					return this.getLayerbyKey(arg);
				}
				
			}
			LayeredPane.prototype.remove = function(figure){
				var index =  Util.Array.indexOf(this.children, figure);
				if (index != -1){
					Util.Array.remove(this.layerKeys, index);
				}
				this.isa = "LayeredPane";
				this.parentMethod("remove",figure);
			}
			/**
			 * �Ƴ�ͼ��
			 * @param {int|Figure} arg ͼ���λ�û���Key
			 */
			LayeredPane.prototype.removeLayer = function(arg){
				if(arg == null){
					return;
				}
				var removeLayer;
				if(arg >= 0){
					removeLayer = this.getLayer(index);
				}else if(Util.isInstanceOf(arg, Figure)){
					removeLayer = arg;
				}else{
					removeLayer= this.getLayer( Util.Array.indexOf(this.layerKeys, key));
				}
				this.remove(removeLayer);
			}
			LayeredPane.prototype.init = function(id){
				this.parentMethod("init",id);
				this.layerKeys = [];
				this.setLayoutManager(new StackLayout());
			}
		}
		LayeredPane._initialized = true;
		_classes.defineClass("LayeredPane",prototypeFunction); 
	}

	this.init(id);
}

//-----------------------------Class ScalableLayeredPane-------
_classes.registerClass("ScalableLayeredPane","LayeredPane");
/**
 * @class �����ŵ�ͼ�㴰��
 * @constructor
 * @extends LayeredPane
 * @param {String} id
 * @returns
 */
function ScalableLayeredPane(id){
	if(typeof ScalableLayeredPane._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ��ͻ���
			 * @param {Rectangle} rect ���ڴ�Ž���ľ��Σ����Ϊ�մ˷������½�һ������
			 */
			ScalableLayeredPane.prototype.getClientArea = function(rect){
				if(rect == null){
					rect = new Rectangle(0,0,0,0);
				}
				this.isa = "ScalableLayeredPane";
				this.parentMethod("getClientArea",rect);
				rect.width /= this.scale;
				rect.height /= this.scale;
				rect.x /= this.scale;
				rect.y /= this.scale;
				return rect;
			}
			ScalableLayeredPane.prototype.getMinimumSize = function(wHint,hHint){
				this.isa = "ScalableLayeredPane";
				var d = this.parentMethod("getMinimumSize",wHint / this.getScale(), hHint / this.getScale());
				var w = this.getInsets().getWidth();
				var h = this.getInsets().getHeight();
				return d.getExpanded(-w, -h).scale(this.scale).expand(w, h);
			}
			ScalableLayeredPane.prototype.getPreferredSize = function(wHint,hHint){
				this.isa = "ScalableLayeredPane";
				var d = this.parentMethod("getPreferredSize",wHint / this.getScale(), hHint / this.getScale());
				var w = this.getInsets().getWidth();
				var h = this.getInsets().getHeight();
				return d.getExpanded(-w, -h).scale(this.scale).expand(w, h);
			}
			/**
			 * �õ�����ֵ
			 * @type Number
			 */
			ScalableLayeredPane.prototype.getScale = function(){
				return this.scale;
			}
			ScalableLayeredPane.prototype.isCoordinateSystem = function(){
				return true;
			}
			ScalableLayeredPane.prototype.paintClientArea = function(graphics){
				if (this.children.length == 0){
					return;
				}
				if(this.scale == 1){
					this.isa = "ScalableLayeredPane";
					this.parentMethod("paintClientArea",graphics);
				}else{
					/*
					var g = new ScaledGraphics(graphics);
					var optimizeClip = (this.getBorder() == null || this.getBorder().isOpaque());
					if (!optimizeClip){
						g.clipRect(getBounds().getCropped(getInsets()));
					}
					g.scale(this.scale);
					g.pushState();
					paintChildren(g);
					g.dispose();
					graphics.restoreState();
					*/
					var optimizeClip = (this.getBorder() == null || this.getBorder().isOpaque());
					if (!optimizeClip){
						graphics.clipRect(getBounds().getCropped(getInsets()));
					}
					/*
					var scaledGraphics = this.scale>1?new VectorScaledGraphics(graphics):graphics;
					scaledGraphics.scale(this.scale,this.scale);
					scaledGraphics.pushState();
					this.paintChildren(scaledGraphics);
					scaledGraphics.restoreState();
					if(this.scale>1){
						scaledGraphics.dispose();
					}
					*/
					
					graphics.scale(this.scale,this.scale);
					graphics.pushState();
					this.paintChildren(graphics);
					graphics.restoreState();
				}
			}
			/**
			 * ��������ֵ
			 * @param {Number} newZoom �µ�����ֵ
			 */
			ScalableLayeredPane.prototype.setScale = function(newZoom){
				if (this.scale == newZoom){
					return;
				}
				this.scale = newZoom;
				this.revalidate();
				this.repaint();
			}
			ScalableLayeredPane.prototype.translateFromParent = function(t){
				t.performScale(1 / this.scale);
			}
			ScalableLayeredPane.prototype.translateToParent = function(t){
				t.performScale(this.scale);
			}
			ScalableLayeredPane.prototype.init = function(id){
				this.parentMethod("init",id);
				this.scale = 1;
			}
		}
		ScalableLayeredPane._initialized = true;
		_classes.defineClass("ScalableLayeredPane",prototypeFunction); 
	}

	this.init(id);
}

//-----------------------------Class FreeformLayeredPane-------
_classes.registerClass("FreeformLayeredPane","LayeredPane");
/**
 * 
 * @class ����ͼ�㴰��
 * @constructor
 * @extends LayeredPane
 * @param {String} id ͼ��id
 * @returns
 */
function FreeformLayeredPane(id){
	if(typeof FreeformLayeredPane._initialized == "undefined"){
		function prototypeFunction () {
			FreeformLayeredPane.prototype.add = function(child,constraint,index){
				this.isa = "FreeformLayeredPane";
				this.parentMethod("add",child,constraint,index);
				this.helper.hookChild(child);
			}
			/**
			 * ����freeform������,���ڼ���freeform��С�ı仯
			 */
			FreeformLayeredPane.prototype.addFreeformListener = function(listener){
				this.addListener("FreeformListener", listener);
			}
			/**
			 * ֪ͨ��С�ı�
			 */
			FreeformLayeredPane.prototype.fireExtentChanged = function(){
				var  iter = this.getListeners("FreeformListener");
				while (iter.hasNext()){
					iter.next().notifyFreeformExtentChanged();
				}
			}
			FreeformLayeredPane.prototype.fireMoved = function(){
			}
			FreeformLayeredPane.prototype.getFreeformHelper = function(){
				return this.helper;
			}
			/**
			 * �õ�freeform��С
			 */
			FreeformLayeredPane.prototype.getFreeformExtent = function(){
				return this.helper.getFreeformExtent();
			}
			FreeformLayeredPane.prototype.primTranslate = function(dx,dy) {
				this.bounds.x += dx;
				this.bounds.y += dy;
			}
			FreeformLayeredPane.prototype.remove = function(child){
				this.helper.unhookChild(child);
				this.isa = "FreeformLayeredPane";
				this.parentMethod("remove",child);
			}
			/**
			 * �Ƴ�freeform������
			 * @see #addFreeformListener
			 */
			FreeformLayeredPane.prototype.removeFreeformListener = function(listener){
				this.removeListener("FreeformListener", listener);
			}
			/**
			 * ����freeform�߽�
			 * @param {Rectangle} bounds
			 */
			FreeformLayeredPane.prototype.setFreeformBounds = function(bounds){
				this.helper.setFreeformBounds(bounds);
			}
			FreeformLayeredPane.prototype.superFireMoved = function(){
				this.isa = "FreeformLayeredPane";
				this.parentMethod("fireMoved");
			}
			FreeformLayeredPane.prototype.init = function(id){
				this.parentMethod("init",id);
				this.helper = new FreeformHelper(this);
				this.setLayoutManager(null);
			}
		}
		FreeformLayeredPane._initialized = true;
		_classes.defineClass("FreeformLayeredPane",prototypeFunction); 
	}

	this.init(id);
}

//-----------------------------Class ScalableFreeformLayeredPane-------
_classes.registerClass("ScalableFreeformLayeredPane","FreeformLayeredPane");
function ScalableFreeformLayeredPane(id){
	if(typeof ScalableFreeformLayeredPane._initialized == "undefined"){
		function prototypeFunction () {
			ScalableFreeformLayeredPane.prototype.getClientArea = function(rect){
				if(rect == null){
					rect = new Rectangle(0,0,0,0);
				}
				this.isa = "ScalableFreeformLayeredPane";
				this.parentMethod("getClientArea",rect);
				rect.width /= this.scale;
				rect.height /= this.scale;
				rect.x /= this.scale;
				rect.y /= this.scale;
				return rect;
			}
			ScalableFreeformLayeredPane.prototype.getScale = function(){
				return this.scale;
			}
			ScalableFreeformLayeredPane.prototype.isCoordinateSystem = function(){
				return true;
			}
			ScalableFreeformLayeredPane.prototype.paintClientArea = function(graphics){
				if (this.children.length == 0){
					return;
				}
				if (this.scale == 1) {
					this.isa = "ScalableFreeformLayeredPane";
					this.parentMethod("paintClientArea",graphics);
				}else{
				/*
					g = new ScaledGraphics(graphics);
					var optimizeClip = this.getBorder() == null || this.getBorder().isOpaque();
					if (!optimizeClip){
						g.clipRect(this.getBounds().getCropped(this.getInsets()));
					}
					g.scale(this.scale);
					g.pushState();
					this.paintChildren(g);
					g.dispose();
					graphics.restoreState();
					*/
					var optimizeClip = this.getBorder() == null || this.getBorder().isOpaque();
					if (!optimizeClip){
						graphics.clipRect(this.getBounds().getCropped(this.getInsets()));
					}
					graphics.scale(this.scale,this.scale);
					graphics.pushState();
					this.paintChildren(graphics);
					graphics.restoreState();
				}
			}
			ScalableFreeformLayeredPane.prototype.setScale = function(newZoom){
				if (this.scale == newZoom){
					return;
				}
				this.scale = newZoom;
				this.superFireMoved();
				this.getFreeformHelper().invalidate();
				this.repaint();
			}
			ScalableFreeformLayeredPane.prototype.translateToParent = function(t){
				t.performScale(this.scale);
			}
			ScalableFreeformLayeredPane.prototype.translateFromParent = function(t){
				t.performScale(1 / this.scale);
			}
			ScalableFreeformLayeredPane.prototype.useLocalCoordinates = function(){
				return false;
			}
			ScalableFreeformLayeredPane.prototype.init = function(id){
				this.parentMethod("init",id);
				this.scale = 1;
			}
		}
		ScalableFreeformLayeredPane._initialized = true;
		_classes.defineClass("ScalableFreeformLayeredPane",prototypeFunction); 
	}

	this.init(id);
}
//-----------------------------Class FreeformLayer-------
_classes.registerClass("FreeformLayer","Layer");
/**
 * 
 * @class ����ͼ��
 * @constructor
 * @extends Layer
 * @param {String} id
 * @returns
 */
function FreeformLayer(id){
	if(typeof FreeformLayer._initialized == "undefined"){
		function prototypeFunction () {
			FreeformLayer.prototype.add = function(child,constraint,index){
				this.isa = "FreeformLayer";
				this.parentMethod("add",child, constraint, index);
				this.helper.hookChild(child);
			}
			/**
			 * ����freeform������,���ڼ���freeform��С�ı仯
			 */
			FreeformLayer.prototype.addFreeformListener = function(listener){
					this.addListener("FreeformListener", listener);
			}
			/**
			 * ֪ͨ��С�ı�
			 */
			FreeformLayer.prototype.fireExtentChanged = function(){
				var iter = this.getListeners("FreeformListener");
				while (iter.hasNext()){
					iter.next().notifyFreeformExtentChanged();
				}
			}
			FreeformLayer.prototype.fireMoved = function(){
			}
			/**
			 * �õ�freeform��С
			 * @type Dimension
			 */
			FreeformLayer.prototype.getFreeformExtent = function(){
				return this.helper.getFreeformExtent();
			}
			FreeformLayer.prototype.primTranslate = function(dx,dy){
				this.bounds.x += dx;
				this.bounds.y += dy;
			}
			FreeformLayer.prototype.remove = function(child){
				this.helper.unhookChild(child);
				this.isa = "FreeformLayer";
				this.parentMethod("remove",child);
			}
			/**
			 * �Ƴ�freeform������
			 * @see #addFreeformListener
			 */
			FreeformLayer.prototype.removeFreeformListener = function(listener){
				this.removeListener("FreeformListener", listener);
			}
			/**
			 * ����freeform�߽�
			 * @param {Rectangle} bounds
			 */
			FreeformLayer.prototype.setFreeformBounds = function(bounds){
				this.helper.setFreeformBounds(bounds);
			}
			FreeformLayer.prototype.init = function(id){
				this.parentMethod("init",id);
				this.helper = new FreeformHelper(this);
			}
		}
		FreeformLayer._initialized = true;
		_classes.defineClass("FreeformLayer",prototypeFunction); 
	}

	this.init(id);
}


//-----------------------------Class ConnectionLayer-------
_classes.registerClass("ConnectionLayer","FreeformLayer");
/**
 * 
 * @class �����߲�
 * @constructor
 * @extends FreeformLayer
 * @param {String} id ͼ��id
 * @returns
 */
function ConnectionLayer(id){
	if(typeof ConnectionLayer._initialized == "undefined"){
		function prototypeFunction () {
			ConnectionLayer.prototype.add = function(figure,constraint,index){
				this.isa = "ConnectionLayer";
				this.parentMethod("add",figure, constraint, index);
				if (figure.getConnectionRouter != null && this.getConnectionRouter() != null){
					figure.setConnectionRouter(this.getConnectionRouter());
				}
			}
			/**
			 * �õ�������·��
			 */
			ConnectionLayer.prototype.getConnectionRouter = function(){
				return this.connectionRouter;
			}
			ConnectionLayer.prototype.paint = function(graphics){
				if (this.antialias != -1){
					graphics.setAntialias(this.antialias);
				}
				this.isa = "ConnectionLayer";
				this.parentMethod("paint",graphics);
			}
			ConnectionLayer.prototype.remove = function(figure){
				if (figure.setConnectionRouter != null){
					figure.setConnectionRouter(null);
				}
				this.isa = "ConnectionLayer";
				this.parentMethod("remove",figure);
			}
			/**
			 * ����������·��
			 */
			ConnectionLayer.prototype.setConnectionRouter = function(router){
				this.connectionRouter = router;
				var iter = new FigureIterator(this);
				var figure;
				while (iter.hasNext()) {
					figure = iter.nextFigure();
					if (Util.isInstanceOf(figure, Connection)){
						figure.setConnectionRouter(router);
					}
				}
			}
			ConnectionLayer.prototype.setAntialias = function(antialias){
				this.antialias = antialias;
			}
			ConnectionLayer.prototype.init = function(id){
				this.parentMethod("init",id);
				this.antialias = -1;
				this.connectionRouter = null;
			}
		}
		ConnectionLayer._initialized = true;
		_classes.defineClass("ConnectionLayer",prototypeFunction); 
	}

	this.init(id);
}
/**
AbstractLayout
---XYLayout
---StackLayout
---DelegatingLayout
---AbstractHintLayout
------ViewportLayout
------FreeformViewportLayout

FreeformHelper
ChildTracker
*/



//-------------------------------------------Class AbstractLayout-----------------------
 _classes.registerClass("AbstractLayout");
 /**
  * 
  * @class ����Ĳ�����
  * @constructor
  * @returns
  */
function AbstractLayout (){
	if(typeof AbstractLayout._initialized == "undefined"){
		function prototypeFunction () {
			AbstractLayout.prototype.calculatePreferredSize = function(){
			}
			AbstractLayout.prototype.getBorderPreferredSize = function(container){
				if (container.getBorder() == null)
					return new Dimension();
				return container.getBorder().getPreferredSize(container);
			}
			/**
			 * �õ�ĳ����ͼ�ε�Լ��
			 * @param {Figure} child
			 */
			AbstractLayout.prototype.getConstraint = function(child){
				return null;
			}
			/**
			 * �õ���С��С
			 * @param {Figure} container ��ͼ��
			 * @param {int} wHint ���
			 * @param {int} hHint �߶�
			 */
			AbstractLayout.prototype.getMinimumSize = function(container,wHint,hHint){
				if(wHint != null && hHint != null){
					return this.getPreferredSize(container, wHint, hHint);
				}
			}
			/**
			 * �õ���ѡ��С
			 * @param {Figure} container ��ͼ��
			 * @param {int} wHint ���
			 * @param {int} hHint �߶�
			 */
			AbstractLayout.prototype.getPreferredSize = function(container, wHint, hHint){
				if(wHint == null || hHint == null){
					return;
				}
				if(!this.preferredSize){
					this.preferredSize = this.calculatePreferredSize(container, wHint, hHint);
				}
				return this.preferredSize;
			}
			/**
			 * ʹ������Ч
			 */
			AbstractLayout.prototype.invalidate = function(){
				this.preferredSize = null;
			}
			/**
			 * 
			 */
			AbstractLayout.prototype.isObservingVisibility = function(){
				return this.isObservingVisibility;
			}
			/**
			 * �Ƴ�ĳ����ͼ��
			 * @param {Figure} child ��ͼ��
			 */
			AbstractLayout.prototype.remove = function(child) {
				this.invalidate();
			}
			/**
			 * Ϊ��ͼ������Լ��
			 * @param {Figure} child ��ͼ��
			 * @param {Object} constraint Լ��
			 */
			AbstractLayout.prototype.setConstraint = function(child,constraint){
				this.invalidate(child);
			}
			/**
			 * 
			 */
			AbstractLayout.prototype.setObserveVisibility = function(newValue) {
				if (this.isObservingVisibility == newValue)
					return;
				this.isObservingVisibility = newValue;
			}
			
			AbstractLayout.prototype.init = function(){
				this.preferredSize;
				this.isObservingVisibility = false;
			}
		}
		AbstractLayout._initialized = true;
		_classes.defineClass("AbstractLayout",prototypeFunction); 
	}
	

	this.init();
}



//-------------------------------------------Class XYLayout-----------------------
 _classes.registerClass("XYLayout","AbstractLayout");
 /**
  * 
  * @class ���겼��
  * @constructor
  * @extends AbstractLayout
  * @returns
  */
function XYLayout (){
	
	if(typeof XYLayout._initialized == "undefined"){
		function prototypeFunction () {
			XYLayout.prototype.calculatePreferredSize = function(f,wHint,hHint){
				var rect = new Rectangle();
				var children = f.getChildren();
				for(var i = 0;i<children.length;i++){
					var child = children[i];
					var r = this.constraints.get(child);
					if (r == null){
						continue;
					}
					if (r.width == -1 || r.height == -1) {
						var preferredSize = child.getPreferredSize(r.width, r.height);
						r = r.getCopy();
						if (r.width == -1){
							r.width = preferredSize.width;
						}
						if (r.height == -1){
							r.height = preferredSize.height;
						}
					}
					rect.union(r);
				}
				var d = rect.getSize();
				var insets = f.getInsets();
				return new Dimension(d.width + insets.getWidth(), d.height + insets.getHeight()).union(this.getBorderPreferredSize(f));
				
			}
			XYLayout.prototype.getConstraint = function(figure){
				return this.constraints.get(figure);
			}
			/**
			 * �õ���ʼλ�ã�����ͼ�ε�λ��
			 * @param {Figure} parent ��ͼ�� 
			 */
			XYLayout.prototype.getOrigin = function(parent){
				return parent.getClientArea().getLocation();
			}
			/**
			 * ���в���
			 * @param {Figure} parent ��ͼ��
			 */
			XYLayout.prototype.layout = function(parent){
				var children = parent.children;
				var offset = this.getOrigin(parent);
				var figure;
				var i;
				
				for(i=0;i<children.length;i++){
					figure = children[i];
					var bounds = this.getConstraint(figure);
					if(!bounds) continue;
					if(bounds.width == -1 || bounds.height == -1){
						var preferredSize = figure.getPreferredSize(bounds.width, bounds.height);
						bounds = bounds.getCopy();
						if(bounds.width == -1){
							bounds.width = preferredSize.width;
						}
						if(bounds.height == -1){
							bounds.height = preferredSize.height;
						}
					}
					bounds = bounds.getTranslated(offset);
					figure.setBounds(bounds);
				}
			}
			XYLayout.prototype.remove = function(figure){
				this.isa = "XYLayout";
				this.parentMethod("remove",figure);
				this.constraints.remove(figure);
			}
			XYLayout.prototype.setConstraint = function(figure,newConstraint){
				this.isa = "XYLayout";
				this.parentMethod("setConstraint",figure,newConstraint);
				if(newConstraint){
					this.constraints.put(figure, newConstraint);
				}
			}
			XYLayout.prototype.init = function(){
				this.parentMethod("init");
				this.constraints = new Map();
			}
		}
		XYLayout._initialized = true;
		_classes.defineClass("XYLayout",prototypeFunction); 
	}
	
	this.init();
}

//-------------------------------------------Class FreeformLayout-----------------------
 _classes.registerClass("FreeformLayout","XYLayout");
 /**
  * 
  * @class ���ɲ��֣�freeformFigureר��
  * @constructor
  * @extends XYLayout
  * @returns
  */
function FreeformLayout (){
	
	if(typeof FreeformLayout._initialized == "undefined"){
		function prototypeFunction () {
			FreeformLayout.prototype.getOrigin = function(figure){
				if (this.origin == null) {
					this.origin = new Point();
					if (this.isPositiveCoordinates()) {
						var children = figure.getChildren();
						var f;
						var constraint;
						for (var i = 0, max = children.length; i < max; i++) {
							f = children[i];
							constraint = this.getConstraint(f);
							if (constraint != null) {
								this.origin.x = Math.min(this.origin.x, this.constraint.x);
								this.origin.y = Math.min(this.origin.y, this.constraint.y);
							}
						}
						this.origin.negate();
					}
				}
				return this.origin;
			}
			FreeformLayout.prototype.isPositiveCoordinates = function () {
				return (this.flags & FreeformLayout.FLAG__POSITIVE_COORDINATES) != 0;
			}
			FreeformLayout.prototype.setPositiveCoordinates = function (positiveCoordinates) {
				if (positiveCoordinates != this.isPositiveCoordinates()) {
					if (positiveCoordinates) {
						this.flags |= FreeformLayout.FLAG__POSITIVE_COORDINATES;
					} else {
						this.flags &= ~FreeformLayout.FLAG__POSITIVE_COORDINATES;
					}
					this.invalidate();
				}
			}
			FreeformLayout.prototype.invalidate = function () {
				this.origin = null;
				this.isa = "FreeformLayout";
				this.parentMethod("invalidate");
			}
			FreeformLayout.prototype.init = function(){
				this.parentMethod("init");
				this.flags = 0;
				this.origin = null;
			}
		}
		FreeformLayout._initialized = true;
		_classes.defineClass("FreeformLayout",prototypeFunction); 
	}
	
	this.init();
}
FreeformLayout.FLAG__POSITIVE_COORDINATES = 1;


//-------------------------------------------Class StackLayout-----------------------
 _classes.registerClass("StackLayout","AbstractLayout");
 /**
  * 
  * @class ջ����
  * @constructor
 * @extends AbstractLayout
  */
function StackLayout (){
	
	
	if(typeof StackLayout._initialized == "undefined"){
		function prototypeFunction () {
			
			StackLayout.prototype.calculatePreferredSize = function(figure,wHint,hHint){
				if(wHint > -1){
					wHint  = Math.max(0,wHint - figure.getInsets().getWidth());
				}
				if(hHint > -1){
					hHint = Math.max(0,hHint - figure.getInsets().getWidth());
				}
				var d = new Dimension();
				var children = figure.getChildren();
				var child;
				for(var i = 0;i<children.length;i++){
					child = children[i];
					if(!this.isObservingVisibility || child.isVisible()){
						d.union(child.getPreferredSize(wHint,hHint));
					}
				}
				
				d.expand(figure.getInsets().getWidth(),figure.getInsets().getHeight());
				d.union(this.getBorderPreferredSize(figure));
				
				return d;
				//////////////////////////////////!!!!!!!!!!!!!!!!!!!!!!!HERE HERE   HERE HERE READ ME!!!!!!!!!!!!!!!!!!
			}
			/**
			 * 
			 */
			StackLayout.prototype.layout = function(figure){
				var rect = figure.getClientArea();
				var children = figure.getChildren();
				var i;
				for( i=0;i<children.length;i++){
					children[i].setBounds(rect);
				}
				
			}
			StackLayout.prototype.setConstraint = function(){
			
			}
			StackLayout.prototype.init = function(){
				this.parentMethod("init");
			}
		}
		StackLayout._initialized = true;
		_classes.defineClass("StackLayout",prototypeFunction); 
	}
	
	this.init();
}

//-----------------------------Class DelegatingLayout-------
_classes.registerClass("DelegatingLayout","AbstractLayout");
/**
 * 
 * @class ί�в���
 * @constructor
 * @extends AbstractLayout
 * @returns
 */
function DelegatingLayout(){
	if(typeof DelegatingLayout._initialized == "undefined"){
		function prototypeFunction () {
			DelegatingLayout.prototype.calculatePreferredSize = function(parent,wHint,hHint){
				var children = parent.getChildren();
				var d = new Dimension();
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					d.union(child.getPreferredSize());
				}
				return d;
			}
			DelegatingLayout.prototype.getConstraint = function(child){
				return this.constraints.get(child);
			}
			/**
			 * ���в���
			 * @param {Figure} paren ��ͼ��
			 */
			DelegatingLayout.prototype.layout = function(parent){
				var children = parent.getChildren();
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					var locator = this.constraints.get(child);
					if (locator != null) {
						locator.relocate(child);
					}
				}
			}
			DelegatingLayout.prototype.remove = function(child){
				this.constraints.remove(child);
			}
			DelegatingLayout.prototype.setConstraint = function(figure,constraint){
				this.isa = "DelegatingLayout";
				this.parentMethod("setConstraint",figure, constraint);
				if (constraint != null){
					this.constraints.put(figure, constraint);
				}
			}
			DelegatingLayout.prototype.init = function(){
				this.parentMethod("init");
				this.constraints = new Map();
			}
		}
		DelegatingLayout._initialized = true;
		_classes.defineClass("DelegatingLayout",prototypeFunction); 
	}

	this.init();
}

//-----------------------------Class AbstractHintLayout-------
_classes.registerClass("AbstractHintLayout","AbstractLayout");
/**
 * 
 * @class �������ʾ����
 * @constructor
 * @extends AbstractLayout
 * @returns
 */
function AbstractHintLayout(){
	if(typeof AbstractHintLayout._initialized == "undefined"){
		function prototypeFunction () {
			AbstractHintLayout.prototype.calculateMinimumSize = function(container,wHint,hHint){
				return this.getPreferredSize(container, wHint, hHint);
			}
			AbstractHintLayout.prototype.getMinimumSize = function(container,w,h){
				var  flush = this.cachedMinimumHint.width != w && this.isSensitiveHorizontally(container);
				flush |=this.cachedMinimumHint.height != h && this.isSensitiveVertically(container);
				if (flush) {
					this.minimumSize = null;
					this.cachedMinimumHint.width = w;
					this.cachedMinimumHint.height = h;
				}
				if (this.minimumSize == null){
					this.minimumSize = this.calculateMinimumSize(container, w, h);
				}
				return this.minimumSize;
			}
			AbstractHintLayout.prototype.getPreferredSize = function(container,w,h){
				var flush = this.cachedPreferredHint.width != w && this.isSensitiveHorizontally(container);
				flush |= this.cachedPreferredHint.height != h && this.isSensitiveVertically(container);
				if (flush) {
					this.preferredSize = null;
					this.cachedPreferredHint.width = w;
					this.cachedPreferredHint.height = h;
				}
				this.isa = "AbstractHintLayout";
				return this.parentMethod("getPreferredSize",container, w, h);
			}
			AbstractHintLayout.prototype.invalidate = function(){
				this.minimumSize = null;
				this.isa = "AbstractHintLayout";
				this.parentMethod("invalidate");
			}
			/**
			 * �Ƿ��������
			 * @type boolean
			 */
			AbstractHintLayout.prototype.isSensitiveHorizontally = function(){
				return true;
			}
			/**
			 * �Ƿ���������
			 * @type boolean
			 */
			AbstractHintLayout.prototype.isSensitiveVertically = function(){
				return true;
			}
			AbstractHintLayout.prototype.init = function(){
				this.parentMethod("init");
				this.minimumSize = null;
				this.cachedPreferredHint =  new Dimension(-1, -1);
				this.cachedMinimumHint = new Dimension(-1, -1);
			}
		}
		AbstractHintLayout._initialized = true;
		_classes.defineClass("AbstractHintLayout",prototypeFunction); 
	}

	this.init();
}


//-----------------------------Class ViewportLayout-------
_classes.registerClass("ViewportLayout","AbstractHintLayout");
/**
 * 
 * @class �ӿڲ���
 * @constructor
 * @extend AbstractHintLayout
 * @returns
 */
function ViewportLayout(){
	if(typeof ViewportLayout._initialized == "undefined"){
		function prototypeFunction () {
			ViewportLayout.prototype.calculateMinimumSize = function(figure,wHint,hHint){
				var viewport = figure;
				var min = new Dimension();
				var insets = viewport.getInsets();
				return min.getExpanded(insets.getWidth(), insets.getHeight());
			}
			ViewportLayout.prototype.calculatePreferredSize = function(parent,wHint,hHint){
				var viewport = parent;
				var insets = viewport.getInsets();
				var contents = viewport.getContents();
				if (viewport.getContentsTracksWidth() && wHint > -1){
					wHint = Math.max(0, wHint - insets.getWidth());
				}else{
					wHint = -1;
				}
				if (viewport.getContentsTracksHeight() && hHint > -1){
					hHint = Math.max(0, hHint - insets.getHeight());
				}else{
					hHint = -1;
				}
				if (contents == null) {
					return new Dimension(insets.getWidth(), insets.getHeight());
				}else{
					var minSize = contents.getMinimumSize(wHint, hHint);
					if (wHint > -1){
						wHint = Math.max(wHint, minSize.width);
					}
					if (hHint > -1){
						hHint = Math.max(hHint, minSize.height);
					}
					return contents.getPreferredSize(wHint, hHint).getExpanded(insets.getWidth(), insets.getHeight());
				}
			}
			ViewportLayout.prototype.isSensitiveHorizontally = function(parent){
				return parent.getContentsTracksWidth();
			}
			ViewportLayout.prototype.isSensitiveVertically = function(parent){
				return parent.getContentsTracksHeight();
			}
			/**
			 * ���в���
			 * @param {Figure} figure ��ͼ��
			 */
			ViewportLayout.prototype.layout = function(figure){
				var viewport = figure;
				var contents = viewport.getContents();
				if (contents == null) return;
				
				var  p = viewport.getClientArea().getLocation();
				p.translate(viewport.getViewLocation().getNegated());
				var hints = viewport.getClientArea();
				var wHint = viewport.getContentsTracksWidth() ? hints.width : -1;
				var hHint = viewport.getContentsTracksHeight() ? hints.height : -1;
				
				var newSize = viewport.getClientArea().getSize();
				var  min = contents.getMinimumSize(wHint, hHint);
				var pref = contents.getPreferredSize(wHint, hHint);
				
				if (viewport.getContentsTracksHeight()){
					newSize.height = Math.max(newSize.height, min.height);
				}else{
					newSize.height = Math.max(newSize.height, pref.height);
				}
				
				if (viewport.getContentsTracksWidth()){
					newSize.width = Math.max(newSize.width, min.width);
				}else{
					newSize.width = Math.max(newSize.width, pref.width);
				}
				contents.setBounds(new Rectangle(p, newSize));
			}
			ViewportLayout.prototype.init = function(){
				this.parentMethod("init");
			}
		}
		ViewportLayout._initialized = true;
		_classes.defineClass("ViewportLayout",prototypeFunction); 
	}

	this.init();
}


//-----------------------------Class FreeformViewportLayout-------
_classes.registerClass("FreeformViewportLayout","ViewportLayout");
/**
 * 
 * @class �����ӿڲ���
 * @constructor
 * @extends ViewportLayout
 * @returns
 */
function FreeformViewportLayout(){
	if(typeof FreeformViewportLayout._initialized == "undefined"){
		function prototypeFunction () {
			FreeformViewportLayout.prototype.calculatePreferredSize = function(parent,wHint,hHint){
				var viewport = parent;
				viewport.getContents().validate();
				wHint = Math.max(0, wHint);
				hHint = Math.max(0, hHint);
				var size = viewport.getContents().getFreeformExtent().getExpanded(viewport.getInsets()).union(0, 0).union(wHint - 1, hHint - 1).getSize();
				return size;
				
			}
			FreeformViewportLayout.prototype.isSensitiveHorizontally = function(parent){
				return true;
			}
			FreeformViewportLayout.prototype.isSensitiveVertically = function(parent){
				return true;
			}
			FreeformViewportLayout.prototype.layout = function(){
				//do nothing , contents updates itself.
			}
			FreeformViewportLayout.prototype.init = function(){
				this.parentMethod("init");
			}
		}
		FreeformViewportLayout._initialized = true;
		_classes.defineClass("FreeformViewportLayout",prototypeFunction); 
	}

	this.init();
}



//-----------------------------Class FreeformHelper-------
_classes.registerClass("FreeformHelper");
function FreeformHelper(host){
	if(typeof FreeformHelper._initialized == "undefined"){
		function prototypeFunction () {
			FreeformHelper.prototype.getFreeformExtent = function(){
				if (this.freeformExtent != null){
					return this.freeformExtent;
				}
				var r;
				var children = this.host.getChildren();
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (child.getFreeformExtent != null){
						r = child.getFreeformExtent();
					}else{
						r = child.getBounds();
					}
					if (this.freeformExtent == null){
						this.freeformExtent = r.getCopy();
					}else{
						this.freeformExtent.union(r);
					}
				}
				var insets = this.host.getInsets();
				if (this.freeformExtent == null){
					this.freeformExtent = new Rectangle(0, 0, insets.getWidth(), insets.getHeight());
				}else{
					this.host.translateToParent(this.freeformExtent);
					this.freeformExtent.expand(insets);
				}
				return this.freeformExtent;
			}
			FreeformHelper.prototype.hookChild = function(child){
				this.invalidate();
				if (child.addFreeformListener != null){
					child.addFreeformListener(this);
				}else{
					child.addFigureListener(this.figureListener);
				}
			}
			FreeformHelper.prototype.invalidate = function(){
				this.freeformExtent = null;
				this.host.fireExtentChanged();
				if (this.host.getParent() != null){
					this.host.getParent().revalidate();
				}else{
					this.host.revalidate();
				}
			}
			FreeformHelper.prototype.notifyFreeformExtentChanged = function(){
				this.invalidate();
			}
			FreeformHelper.prototype.setFreeformBounds = function(bounds){
				this.host.setBounds(bounds);
				bounds = bounds.getCopy();
				this.host.translateFromParent(bounds);
				var  children = this.host.getChildren();
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (child.setFreeformBounds != null){
						child.setFreeformBounds(bounds);
					}
				}
			}
			FreeformHelper.prototype.unhookChild = function(child){
				this.invalidate();
				if (child.removeFreeformListener != null){
					child.removeFreeformListener(this);
				}else{
					child.removeFigureListener(this.figureListener);
				}
			}
			FreeformHelper.prototype.init = function(host){
				this.parentMethod("init");
				this.host = host;
				this.freeformExtent = null;
				this.figureListener = new ChildTracker(this);
			}
		}
		FreeformHelper._initialized = true;
		_classes.defineClass("FreeformHelper",prototypeFunction); 
	}

	this.init(host);
}


//-----------------------------Class ChildTracker-------
_classes.registerClass("ChildTracker");
function ChildTracker(freeformHelper){
	if(typeof ChildTracker._initialized == "undefined"){
		function prototypeFunction () {
			ChildTracker.prototype.figureMoved = function(source){
				this.freeformHelper.invalidate();
			}
			ChildTracker.prototype.init = function(freeformHelper){
				this.parentMethod("init");
				this.freeformHelper = freeformHelper;
			}
		}
		ChildTracker._initialized = true;
		_classes.defineClass("ChildTracker",prototypeFunction); 
	}

	this.init(freeformHelper);
}/**
AbstractLocator
---ConnectionLocator
------ArrowLocator
------MidpointLocator
------BendpointLocator
RelativeLocator
*/
//-----------------------------Class AbstractLocator-------
_classes.registerClass("AbstractLocator");
/**
 * 
 * @class ����λ��
 * @constructor
 */
function AbstractLocator(){
	if(typeof AbstractLocator._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ����
			 * @type Number
			 */
			AbstractLocator.prototype.getGap = function(){
				return this.gap;
			}
			/**
			 * �õ����ڶ�λ�ĵ�
			 * @type Point
			 */
			AbstractLocator.prototype.getReferencePoint = function(){
			}
			/**
			 * �õ��µı߽�
			 * @param {Dimension} size ��С
			 * @param {Point} center λ��
			 */
			AbstractLocator.prototype.getNewBounds = function(size,center){
				var bounds = new Rectangle(center, size);
				bounds.x -= bounds.width / 2;
				bounds.y -= bounds.height / 2;
				var xFactor = 0, yFactor = 0;
				var position = this.getRelativePosition();
				
				if ((position & PositionConstants.NORTH) != 0) {
					yFactor = -1;
				}else if((position & PositionConstants.SOUTH) != 0) {
					yFactor = 1;
				}
				
				if ((position & PositionConstants.WEST) != 0) {
					xFactor = -1;
				}else if ((position & PositionConstants.EAST) != 0) {
					xFactor = 1;
				}
				
				bounds.x += xFactor * (bounds.width / 2 + this.getGap());
				bounds.y += yFactor * (bounds.height / 2 + this.getGap());
				return bounds;
			}
			/**
			 * �õ����λ��
			 * @type Point
			 */
			AbstractLocator.prototype.getRelativePosition = function(){
				return this.relativePosition;
			}
			/**
			 * ���¶�λ
			 * @param {Figure} target ��Ҫ��λ��ͼ��
			 */
			AbstractLocator.prototype.relocate = function(target){	
				var prefSize = target.getPreferredSize();
				var center = this.getReferencePoint();
				target.translateToRelative(center);
				target.setBounds(this.getNewBounds(prefSize, center));
			}
			/**
			 * ���ü��
			 * @param {Number} gap
			 */
			AbstractLocator.prototype.setGap = function(gap){
				this.gap = gap;
			}
			/**
			 * �������λ��
			 * @param {Point} pos
			 */
			AbstractLocator.prototype.setRelativePosition = function(pos){
				this.relativePosition = pos;
			}
			AbstractLocator.prototype.init = function(){
				this.parentMethod("init");
				this.relativePosition =  PositionConstants.CENTER;
				this.gap = 0;
			}
		}
		AbstractLocator._initialized = true;
		_classes.defineClass("AbstractLocator",prototypeFunction); 
	}

	this.init();
}


//-----------------------------Class ConnectionLocator-------
_classes.registerClass("ConnectionLocator","AbstractLocator");
/**
 * 
 * @class �����߶�λ��
 * @constructor
 * @extends AbstractLocator
 * @param {PolylineConnection} connection
 * @param {int} align ����ֵΪConnectionLocator.SOURCE��ConnectionLocator.TARGET��ConnectionLocator.MIDDLE
 * @returns
 */
function ConnectionLocator(connection,align){
	if(typeof ConnectionLocator._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ�����ֵ(SOURCE;TARGET;MIDDLE)
			 * @type int
			 */
			ConnectionLocator.prototype.getAlignment = function(){
				return this.alignment;
			}
			/**
			 * �õ�������
			 * @type PolylineConnection
			 */
			ConnectionLocator.prototype.getConnection = function(){
				return this.connection;
			}
			ConnectionLocator.prototype.getReferencePoint = function(){
				var p = this.getLocation(this.getConnection().getPoints());
				this.getConnection().translateToAbsolute(p);
				return p;
			}
			/**
			 * �õ�λ��
			 * @param {PointList} points ���б�
			 * @type Point
			 */
			ConnectionLocator.prototype.getLocation = function(points){
				switch (this.getAlignment()) {
					case ConnectionLocator.SOURCE:
						return points.getPoint(Point.SINGLETON, 0);
					case ConnectionLocator.TARGET:
						return points.getPoint(Point.SINGLETON, points.size - 1);
					case ConnectionLocator.MIDDLE:
						if (points.size % 2 == 0) {
							var i = points.size / 2;
							var j = i - 1;
							var p1 = points.getPoint(j);
							var p2 = points.getPoint(i);
							var d = p2.getDifference(p1);
							return Point.SINGLETON.setLocation(p1.x + d.width / 2, p1.y + d.height / 2);
						}
						var i = (points.size - 1) / 2;
						return points.getPoint(Point.SINGLETON, i);
					default:
						return new Point(0,0);
				}
			}
			/**
			 * ���ò���ֵ
			 * @param {int} align
			 * @see #getAlignment
			 */
			ConnectionLocator.prototype.setAlignment = function(align){
				this.alignment = align;
			}
			/**
			 * ����������
			 * @param {PolylineConnection} connection
			 */
			ConnectionLocator.prototype.setConnection = function(connection){
				this.connection = connection;
			}
			
			ConnectionLocator.prototype.init = function(connection,align){
				this.parentMethod("init");
				this.setConnection(connection);
				if(align != null){
					this.setAlignment(align);
				}else{
					this.setAlignment(ConnectionLocator.MIDDLE);
				}
			}
		}
		ConnectionLocator._initialized = true;
		_classes.defineClass("ConnectionLocator",prototypeFunction); 
	}

	this.init(connection,align);
}
ConnectionLocator.SOURCE = 2;
ConnectionLocator.TARGET = 3;
ConnectionLocator.MIDDLE = 4;


//-----------------------------Class ArrowLocator-------
_classes.registerClass("ArrowLocator","ConnectionLocator");
/**
 * 
 * @class ��ͷ��λ��
 * @constructor
 * @extends ConnectionLocator
 * @see <a hefr="ConnectionLocator.html">ConnectionLocator</a>
 */
function ArrowLocator(connection,location){
	if(typeof ArrowLocator._initialized == "undefined"){
		function prototypeFunction () {
			ArrowLocator.prototype.relocate = function(target){
				var points = this.getConnection().getPoints();
				var arrow = target;
				arrow.setLocation(this.getLocation(points));
				if (this.getAlignment() == ConnectionLocator.SOURCE){
					arrow.setReferencePoint(points.getPoint(1));
				}else if(this.getAlignment() == ConnectionLocator.TARGET){
					arrow.setReferencePoint(points.getPoint(points.size - 2));
				}
			}
			ArrowLocator.prototype.init = function(connection,location){
				this.parentMethod("init",connection,location);
			}
		}
		ArrowLocator._initialized = true;
		_classes.defineClass("ArrowLocator",prototypeFunction); 
	}

	this.init(connection,location);
}


_classes.registerClass("MidpointLocator","ConnectionLocator");
/**
 * 
 * @class �е㶨λ��
 * @constructor
 * @extends ConnectionLocator
 * @see <a hefr="ConnectionLocator.html">ConnectionLocator</a>
 */
function MidpointLocator(connection,index){
	if(typeof MidpointLocator._initialized == "undefined"){
		function prototypeFunction () {
			MidpointLocator.prototype.getReferencePoint = function(){
				var conn = this.getConnection();
				var p = Point.SINGLETON;
				var p1 = conn.getPoints().getPoint(this.getIndex());
				var p2 = conn.getPoints().getPoint(this.getIndex() + 1);
				conn.translateToAbsolute(p1);
				conn.translateToAbsolute(p2);
				p.x = (p2.x - p1.x) / 2 + p1.x;
				p.y = (p2.y - p1.y) / 2 + p1.y;
				return p;
			}
			MidpointLocator.prototype.getIndex = function(){
				return this.index;
			}
			MidpointLocator.prototype.init = function(connection,index){
				this.parentMethod("init",connection);
				this.index = index;
			}
		}
		MidpointLocator._initialized = true;
		_classes.defineClass("MidpointLocator",prototypeFunction); 
	}

	this.init(connection,index);
}


_classes.registerClass("BendpointLocator","ConnectionLocator");
/**
 * @class BendpointLocator
 * @@constructor
 * @extends ConnectionLocator
 */
function BendpointLocator(connection,index){
	if(typeof BendpointLocator._initialized == "undefined"){
		function prototypeFunction () {
			BendpointLocator.prototype.getReferencePoint = function(){
				var p = this.getConnection().getPoints().getPoint(Point.SINGLETON, this.getIndex());
				this.getConnection().translateToAbsolute(p);
				return p;
			}
			BendpointLocator.prototype.getIndex = function(){
				return this.index;
			}
			BendpointLocator.prototype.init = function(connection,index){
				this.parentMethod("init",connection);
				this.index = index;
			}
		}
		BendpointLocator._initialized = true;
		_classes.defineClass("BendpointLocator",prototypeFunction); 
	}

	this.init(connection,index);
}


//-----------------------------Class RelativeLocator-------
_classes.registerClass("RelativeLocator");
/**
 * 
 * @class ��Զ�λ��
 * @constructor
 * @param arg1
 * @param arg2
 * @param arg3
 */
function RelativeLocator(arg1,arg2,arg3){
	if(typeof RelativeLocator._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ���¶�λ
			 * @param {Figure} ��Ҫ��λ��ͼ��
			 */
			RelativeLocator.prototype.relocate = function(target){
				var reference = this.getReferenceFigure();
				var targetBounds = new Rectangle(this.getReferenceBox().getResized(-1, -1));
				reference.translateToAbsolute(targetBounds);
				target.translateToRelative(targetBounds);
				targetBounds.resize(1, 1);
				
				var targetSize = target.getPreferredSize();
				targetBounds.x += Math.floor(targetBounds.width * this.relativeX - ((targetSize.width + 1) / 2));
				targetBounds.y += Math.floor(targetBounds.height * this.relativeY - ((targetSize.height + 1) / 2));
				
				targetBounds.setSize(targetSize);
				target.setBounds(targetBounds);
			}
			/**
			 * 
			 */
			RelativeLocator.prototype.getReferenceBox = function(){
				return this.getReferenceFigure().getBounds();
			}
			/**
			 * �õ���ص�ͼ��
			 * @type Figure
			 */
			RelativeLocator.prototype.getReferenceFigure = function(){
				return this.reference;
			}
			/**
			 * ������ص�ͼ��
			 * @param {Figure} reference
			 */
			RelativeLocator.prototype.setReferenceFigure = function(reference){
				this.reference = reference;
			}
			RelativeLocator.prototype.init = function(arg1,arg2,arg3){
				this.parentMethod("init");
				if(arg1 == null){
					this.relativeX = 0;
					this.relativeY = 0;
				}else{
					this.setReferenceFigure(arg1);
					if(arg3 == null){
						var location = arg2;
						switch (location & PositionConstants.NORTH_SOUTH) {
							case PositionConstants.NORTH: this.relativeY = 0; break;
							case PositionConstants.SOUTH: this.relativeY = 1; break;
							default: this.relativeY = 0.5;
						}
						switch (location & PositionConstants.EAST_WEST) {
							case PositionConstants.WEST: this.relativeX = 0; break;
							case PositionConstants.EAST: this.relativeX = 1; break;
							default: this.relativeX = 0.5;
						}
					}else{
						this.relativeX = arg2;
						this.relativeY = arg3;
					}
				}
			}
		}
		RelativeLocator._initialized = true;
		_classes.defineClass("RelativeLocator",prototypeFunction); 
	}

	this.init(arg1,arg2,arg3);
}/**
load-dependencies:Geometry.js;Figure.js
**************
Connection
ConnectionAnchorBase
---XYAnchor
---AbstractConnectionAnchor
------BottomAnchor
------TopAnchor
------EllipseAnchor
------ChopboxAnchor
---------LabelAnchor
RoutingNotifier
AbstractRouter
---NullConnectionRouter
---BendpointConnectionRouter
PolylineConnection
*/

/**
 * Connection
 * ������������Ҫ�õ���һЩ���Գ���
 */
Connection = {};
Connection.PROPERTY_CONNECTION_ROUTER = "connectionRouter";
Connection.PROPERTY_POINTS = "points";

//-----------------------------Class ConnectionAnchorBase-------
_classes.registerClass("ConnectionAnchorBase");
/**
 * @class ������ê����
 * @constructor
 * @returns
 */
function ConnectionAnchorBase(){
	if(typeof ConnectionAnchorBase._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ����ê������
			 */
			ConnectionAnchorBase.prototype.addAnchorListener = function(listener){
				this.listeners.push(listener);
			}
			/**
			 * �Ƴ�ê������
			 */
			ConnectionAnchorBase.prototype.removeAnchorListener = function(listener){
				Util.Array.removeItem(this.listeners, listener);
			}
			ConnectionAnchorBase.prototype.fireAnchorMoved = function(){
				for(var i=0;i<this.listeners.length;i++){
					this.listeners[i].anchorMoved(this);
				}
			}
			ConnectionAnchorBase.prototype.init = function(){
				this.parentMethod("init");
				this.listeners = [];
			}
		}
		ConnectionAnchorBase._initialized = true;
		_classes.defineClass("ConnectionAnchorBase",prototypeFunction); 
	}

	this.init();
}


//-----------------------------Class XYAnchor-------
_classes.registerClass("XYAnchor","ConnectionAnchorBase");
/**
 * @class ����ê
 * @extends ConnectionAnchorBase
 * @constructor
 * @param {Point} p ê������
 * @returns
 */
function XYAnchor(p){
	if(typeof XYAnchor._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ�ê�����ĳ�����λ��
			 * @param {Point} reference ��Եĵ�
			 * @type Point
			 */
			XYAnchor.prototype.getLocation = function(reference){
				return this.location;
			}
			/**
			 * �õ�ӵ����
			 */
			XYAnchor.prototype.getOwner = function(){
				return null;
			}
			/**
			 * �õ���صĵ�
			 */
			XYAnchor.prototype.getReferencePoint = function(){
				return this.location;
			}
			/**
			 * ����λ��
			 */
			XYAnchor.prototype.setLocation = function(p){
				this.location.setLocation(p);
				this.fireAnchorMoved();
			}
			XYAnchor.prototype.init = function(p){
				this.parentMethod("init");
				this.location = new Point(p);
			}
		}
		XYAnchor._initialized = true;
		_classes.defineClass("XYAnchor",prototypeFunction); 
	}
	this.init(p);
}


//-----------------------------Class AbstractConnectionAnchor-------
_classes.registerClass("AbstractConnectionAnchor","ConnectionAnchorBase");
/**
 * @class
 * @constructor
 * @extends ConnectionAnchorBase
 * @param {Figure} owner ê��ӵ����(ê��ӵ���ߵ�λ����ͬ)
 * @returns
 */
function AbstractConnectionAnchor(owner){
	if(typeof AbstractConnectionAnchor._initialized == "undefined"){
		function prototypeFunction () {
			AbstractConnectionAnchor.prototype.addAnchorListener = function(listener){
				if (listener == null){
					return;
				}
				if (this.listeners.length == 0){
					this.getOwner().addAncestorListener(this);
				}
				this.parentMethod("addAnchorListener",listener);
			}
			AbstractConnectionAnchor.prototype.ancestorMoved = function(figure){
				this.fireAnchorMoved();
			}
			AbstractConnectionAnchor.prototype.ancestorAdded = function(ancestor){
			}
			AbstractConnectionAnchor.prototype.ancestorRemoved = function(ancestor){
			}
			/**
			 * �õ�ӵ����
			 */
			AbstractConnectionAnchor.prototype.getOwner = function(){
				return this.owner;
			}
			/**
			 * �õ���صĵ�
			 */
			AbstractConnectionAnchor.prototype.getReferencePoint = function(){
				if(this.getOwner() == null){
					return;
				}else{
					var ref = this.getOwner().getBounds().getCenter();
					this.getOwner().translateToAbsolute(ref);
					return ref;
				}
			}
			AbstractConnectionAnchor.prototype.removeAnchorListener = function(listener){
				this.parentMethod("removeAnchorListener",listener);
				if (this.listeners.length == 0){
					this.getOwner().removeAncestorListener(this);
				}
			}
			/**
			 * ����ӵ����
			 */
			AbstractConnectionAnchor.prototype.setOwner = function(owner){
				this.owner = owner;
			}
			AbstractConnectionAnchor.prototype.init = function(owner){
				this.parentMethod("init");
				this.setOwner(owner);
			}
		}
		AbstractConnectionAnchor._initialized = true;
		_classes.defineClass("AbstractConnectionAnchor",prototypeFunction); 
	}
	this.init(owner);
}

//-----------------------------Class BottomAnchor-------
_classes.registerClass("BottomAnchor","AbstractConnectionAnchor");
/**
 * @class λ�ڵײ���������ê
 * @constructor
 * @extends AbstractConnectionAnchor
 * @param {Figure} source ê��ӵ����
 * @param {Number} offset ƫ��ֵ
 * @returns
 */
function BottomAnchor(source,offset){
	if(typeof BottomAnchor._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ�λ��
			 * @param {Point} reference ��صĵ�
			 */
			BottomAnchor.prototype.getLocation = function(reference){
				var r = this.getOwner().getBounds().getCopy();
				this.getOwner().translateToAbsolute(r);
				var off = this.offset;
				if (off == -1){
					off = r.width / 2;
				}
				if(r.contains(reference) || r.bottom() > reference.y){
					return r.getTopLeft().translate(off,0);
				}else{
					return r.getBottomLeft().translate(off,-1);
				}
			}
			BottomAnchor.prototype.init = function(source,offset){
				this.parentMethod("init",source);
				this.offset = offset;
			}
		}
		BottomAnchor._initialized = true;
		_classes.defineClass("BottomAnchor",prototypeFunction); 
	}
	this.init(source,offset);
}

//-----------------------------Class TopAnchor-------
_classes.registerClass("TopAnchor","AbstractConnectionAnchor");
/**
 * @class λ�ڶ�����������ê
 * @constructor
 * @extends AbstractConnectionAnchor
 * @param {Figure} source ê��ӵ����
 * @param {Number} offset
 * @returns
 */
function TopAnchor(source,offset){
	if(typeof TopAnchor._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ�λ��
			 * @param {Point} reference ��صĵ�
			 */
			TopAnchor.prototype.getLocation = function(reference){
				var r = this.getOwner().getBounds().getCopy();
				this.getOwner().translateToAbsolute(r);
				var off = this.offset;
				if (off == -1){
					off = r.width / 2;
				}
				if(r.contains(reference) || r.y < reference.y){
					return r.getBottomLeft().translate(off,-1);
				}else{
					return r.getTopLeft().translate(off,0);
				}
			}
			TopAnchor.prototype.init = function(source,offset){
				this.parentMethod("init",source);
				this.offset = offset;
			}
		}
		TopAnchor._initialized = true;
		_classes.defineClass("TopAnchor",prototypeFunction); 
	}
	this.init(source,offset);
}

//-----------------------------Class EllipseAnchor-------
_classes.registerClass("EllipseAnchor","AbstractConnectionAnchor");
/**
 * @class ��Բê
 * @constructor 
 * @extends AbstractConnectionAnchor
 * @param {Figure} owner ӵ����
 * @returns
 */
function EllipseAnchor(owner){
	if(typeof EllipseAnchor._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ�λ��
			 * @param {Point} reference ��صĵ�
			 */
			EllipseAnchor.prototype.getLocation = function(reference){
				var r = Rectangle.SINGLETON;
				r.setBounds(this.getOwner().getBounds());
				r.translate(-1, -1);
				r.resize(1, 1);
				this.getOwner().translateToAbsolute(r);
				var ref = r.getCenter().negate().translate(reference);
				if (ref.x == 0){
					return new Point(reference.x, (ref.y > 0) ? r.bottom() : r.y);
				}
				if (ref.y == 0){
					return new Point((ref.x > 0) ? r.right() : r.x, reference.y);
				}
				var dx = (ref.x > 0) ? 0.5 : -0.5;
				var dy = (ref.y > 0) ? 0.5 : -0.5;
				var  k = (ref.y * r.width) / (ref.x * r.height);
				k = k * k;
				return r.getCenter().translate(r.width * dx / Math.sqrt(1 + k),r.height * dy / Math.sqrt(1 + 1 / k));
			}
			EllipseAnchor.prototype.init = function(owner){
				this.parentMethod("init",owner);
			}
		}
		EllipseAnchor._initialized = true;
		_classes.defineClass("EllipseAnchor",prototypeFunction); 
	}
	this.init(owner);
}


//-----------------------------Class ChopboxAnchor-------
_classes.registerClass("ChopboxAnchor","AbstractConnectionAnchor");
/**
 * @class ChopboxAnchor
 * @constructor
 * @extends AbstractConnectionAnchor
 * @param {Figure} owner ӵ����
 * @returns
 */
function ChopboxAnchor(owner){
	if(typeof ChopboxAnchor._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ�λ��
			 * @param {Point} reference ��صĵ�
			 */
			ChopboxAnchor.prototype.getLocation = function(reference){
				var r = Rectangle.SINGLETON;
				r.setBounds(this.getBox());
				r.translate(-1, -1);
				r.resize(1, 1);
				this.getOwner().translateToAbsolute(r);
				var centerX = r.x + 0.5 * r.width;
				var centerY = r.y + 0.5 * r.height;
				if (r.isEmpty() || (reference.x == Math.floor(centerX) && reference.y == Math.floor(centerY))){
					return new Point(Math.floor(centerX), Math.floor(centerY));
				}
				var dx = reference.x - centerX;
				var dy = reference.y - centerY;
				var scale = 0.5 / Math.max(Math.abs(dx) / r.width, Math.abs(dy) / r.height);
				dx *= scale;
				dy *= scale;
				centerX += dx;
				centerY += dy;
				return new Point(Math.round(centerX), Math.round(centerY));
				
			}
			/**
			 * �õ�ӵ���ߵı߽�
			 */
			ChopboxAnchor.prototype.getBox = function(){
				return this.getOwner().getBounds();
			}
			ChopboxAnchor.prototype.getReferencePoint = function(){
				var ref = this.getBox().getCenter();
				this.getOwner().translateToAbsolute(ref);
				return ref;
			}
			/**
			 * ʱ�����
			 * @param {Object} obj
			 */
			ChopboxAnchor.prototype.equals = function(obj){
				if(obj == null){
					return false;
				}
				if (Util.isInstanceOf(obj, ChopboxAnchor)) {
					var other = obj;
					return other.getOwner() == this.getOwner() && other.getBox().equals(this.getBox());
				}
				return false;
			}
			
			ChopboxAnchor.prototype.init = function(owner){
				this.parentMethod("init",owner);
			}
		}
		ChopboxAnchor._initialized = true;
		_classes.defineClass("ChopboxAnchor",prototypeFunction); 
	}
	this.init(owner);
}

//-----------------------------Class LabelAnchor-------
_classes.registerClass("LabelAnchor","ChopboxAnchor");
function LabelAnchor(label){
	if(typeof LabelAnchor._initialized == "undefined"){
		function prototypeFunction () {
			LabelAnchor.prototype.getBox = function(){
				return this.getOwner().getIconBounds();
			}
			LabelAnchor.prototype.init = function(label){
				this.parentMethod("init",label);
			}
		}
		LabelAnchor._initialized = true;
		_classes.defineClass("LabelAnchor",prototypeFunction); 
	}
	this.init(label);
}
//-----------------------------Class RoutingNotifier-------
_classes.registerClass("RoutingNotifier");
function RoutingNotifier(id,router,listener){
	if(typeof RoutingNotifier._initialized == "undefined"){
		function prototypeFunction () {
			RoutingNotifier.prototype.getConstraint = function(connection){
				return this.realRouter.getConstraint(connection);
			}
			RoutingNotifier.prototype.invalidate = function(connection){
				for (var i = 0; i < this.listeners.length; i++){
					this.listeners[i].invalidate(connection);
				}
				this.realRouter.invalidate(connection);
			}
			RoutingNotifier.prototype.route	 = function(connection){
				var consumed = false;
				for (var i = 0; i < this.listeners.length; i++){
					consumed |= this.listeners[i].route(connection);
				}
				if (!consumed){
					this.realRouter.route(connection);
				}
				for (var i = 0; i < this.listeners.length; i++){
					this.listeners[i].postRoute(connection);
				}
			}
			RoutingNotifier.prototype.remove= function(connection){
				for (var i = 0; i < this.listeners.length; i++){
					this.listeners[i].remove(connection);
				}
				this.realRouter.remove(connection);
			}
			RoutingNotifier.prototype.setConstraint = function(connection,constraint){
				for (var i = 0; i < this.listeners.length; i++){
					this.listeners[i].setConstraint(connection, constraint);
				}
				this.realRouter.setConstraint(connection, constraint);
			}
			RoutingNotifier.prototype.init = function(id,router,listener){
				this.parentMethod("init",id);
				this.realRouter = router;
				this.listeners = [];
				if(listener != null){
					this.listeners.push(listener);
				}
			}
		}
		RoutingNotifier._initialized = true;
		_classes.defineClass("RoutingNotifier",prototypeFunction); 
	}

	this.init(id,router,listener);
}


//-----------------------------Class AbstractRouter-------
_classes.registerClass("AbstractRouter");
/**
 * @class �����·����
 * @constructor
 * @returns
 */
function AbstractRouter(){
	if(typeof AbstractRouter._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ������ߵ�Լ��
			 * @param {PolylineConnection} connection
			 */
			AbstractRouter.prototype.getConstraint = function(connection){
				return null;
			}
			/**
			 * �õ������ߵ��յ�
			 * @param {PolylineConnection} connection
			 */
			AbstractRouter.prototype.getEndPoint = function(connection){
				var ref = connection.getSourceAnchor().getReferencePoint();
				return AbstractRouter.END.setLocation(connection.getTargetAnchor().getLocation(ref));
			}
			/**
			 * �õ������ߵ����
			 * @param {PolylineConnection} conn
			 */
			AbstractRouter.prototype.getStartPoint = function(conn){
				var ref = conn.getTargetAnchor().getReferencePoint();
				return AbstractRouter.START.setLocation(conn.getSourceAnchor().getLocation(ref));
			}
			/**
			 * ʹ��������Ч
			 * @param {PolylineConnection} connection
			 */
			AbstractRouter.prototype.invalidate = function(connection){
			}
			/**
			 * �Ƴ�������
			 * @param {PolylineConnection} connection
			 */
			AbstractRouter.prototype.remove = function(connection){
			}
			/**
			 * Ϊ����������Լ��
			 * @param {PolylineConnection} connection
			 * @param {Object} constraint
			 */
			AbstractRouter.prototype.setConstraint = function(connection,constraint){
			}
			AbstractRouter.prototype.init = function(){
				this.parentMethod("init");
			}
		}
		AbstractRouter._initialized = true;
		_classes.defineClass("AbstractRouter",prototypeFunction); 
	}
	this.init();
}
AbstractRouter.START=new Point(0,0);
AbstractRouter.END=new Point(0,0);

//-----------------------------Class NullConnectionRouter-------
_classes.registerClass("NullConnectionRouter","AbstractRouter");
/**
 * @class Ĭ�ϵ�������·��
 * @constructor
 * @extends AbstractRouter
 * 
 */
function NullConnectionRouter(){
	if(typeof NullConnectionRouter._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ·�ɣ�Ϊ���������ø������λ��
			 * @param {Connection} conn
			 */
			NullConnectionRouter.prototype.route = function(conn){
				var points = conn.getPoints();
				points.removeAllPoints();
				var p;
				p = this.getStartPoint(conn);
				conn.translateToRelative(p);
				points.addPoint(p);
				p = this.getEndPoint(conn);
				conn.translateToRelative(p);
				points.addPoint(p);
				conn.setPoints(points);
			}
			NullConnectionRouter.prototype.init = function(){
				this.parentMethod("init");
			}
		}
		NullConnectionRouter._initialized = true;
		_classes.defineClass("NullConnectionRouter",prototypeFunction); 
	}

	this.init();
}
AbstractRouter.NULL = new NullConnectionRouter();



/**
 * BendpointConnectionRouter
 */
_classes.registerClass("BendpointConnectionRouter","AbstractRouter");
function BendpointConnectionRouter(){
	if(typeof BendpointConnectionRouter._initialized == "undefined"){
		function prototypeFunction () {
			BendpointConnectionRouter.prototype.getConstraint = function(connection){
				return this.constraints.get(connection);
			}
			BendpointConnectionRouter.prototype.remove = function(connection){
				this.constraints.remove(connection);
			}
			BendpointConnectionRouter.prototype.route = function(conn){
				var points = conn.getPoints();
				points.removeAllPoints();
				var bendpoints = this.getConstraint(conn);
				if (bendpoints == null){
					bendpoints = [];
				}
				var ref1, ref2;
				
				if (bendpoints.length == 0) {
					ref1 = conn.getTargetAnchor().getReferencePoint();
					ref2 = conn.getSourceAnchor().getReferencePoint();
				}else{
					ref1 = new Point(bendpoints[0].getLocation());
					conn.translateToAbsolute(ref1);
					ref2 = new Point(bendpoints[bendpoints.length - 1].getLocation());
					conn.translateToAbsolute(ref2);
				}
				BendpointConnectionRouter.A_POINT.setLocation(conn.getSourceAnchor().getLocation(ref1));
				conn.translateToRelative(BendpointConnectionRouter.A_POINT);
				points.addPoint(BendpointConnectionRouter.A_POINT);
				
				for (var i = 0; i < bendpoints.length; i++) {
					var bp = bendpoints[i];
					points.addPoint(bp.getLocation());
				}
				
				BendpointConnectionRouter.A_POINT.setLocation(conn.getTargetAnchor().getLocation(ref2));
				conn.translateToRelative(BendpointConnectionRouter.A_POINT);
				points.addPoint(BendpointConnectionRouter.A_POINT);
				conn.setPoints(points);
			}
			BendpointConnectionRouter.prototype.setConstraint = function(connection,constraint){
				this.constraints.put(connection, constraint);
			}
			BendpointConnectionRouter.prototype.init = function(){
				this.parentMethod("init");
				this.constraints = new Map();
			}
		}
		BendpointConnectionRouter._initialized = true;
		_classes.defineClass("BendpointConnectionRouter",prototypeFunction); 
	}
	this.init();
}
BendpointConnectionRouter.A_POINT = new Point();

//-----------------------------Class PolylineConnection-------
_classes.registerClass("PolylineConnection","Polyline");
/**
 * @class ����������
 * @constructor
 * @extends Polyline
 * @param {String} id ͼ��id
 * @returns
 */
function PolylineConnection(id){
	if(typeof PolylineConnection._initialized == "undefined"){
		function prototypeFunction () {
			PolylineConnection.prototype.addNotify = function(){
				this.parentMethod("addNotify");
				this.hookSourceAnchor();
				this.hookTargetAnchor();
			}
			/**
			 * ����·�ɼ�����
			 */
			PolylineConnection.prototype.addRoutingListener = function(listener){
				if(this.connectionRouter != null){
					if(Util.isInstanceOf(this.connectionRouter, RoutingNotifier)){
						this.connectionRouter.listeners.push(listener);
					}else{
						this.connectionRouter = new RoutingNotifier(this.connectionRouter, listener);
					}
				}
			}
			PolylineConnection.prototype.anchorMoved = function(anchor){
				this.revalidate();
			}
			PolylineConnection.prototype.getBounds = function(){
				if(this.bounds == null){
					this.isa = "PolylineConnection"; //������bug
					this.parentMethod("getBounds");
					for(var i=0;i<this.children.length;i++){
						var child = this.children[i];
						this.bounds.union(child.getBounds());
					}
				}
				return this.bounds;
			}
			/**
			 * �õ�·��
			 */
			PolylineConnection.prototype.getConnectionRouter = function(){
				if(this.connectionRouter != null){
					if(Util.isInstanceOf(this.connectionRouter, RoutingNotifier)){
						return this.connectionRouter.realRouter;
					}
					return this.connectionRouter;
				}
			}
			/**
			 * �õ�·��Լ��
			 */
			PolylineConnection.prototype.getRoutingConstraint = function(){
				if(this.getConnectionRouter() != null){
					return this.getConnectionRouter().getConstraint(this);
				}else{
					return null;
				}
			}
			/**
			 * �õ����ê
			 */
			PolylineConnection.prototype.getSourceAnchor = function(){
				return this.startAnchor;
			}
			/**
			 * �õ��������
			 */
			PolylineConnection.prototype.getSourceDecoration = function(){
				return this.startArrow;
			}
			/**
			 * �õ��յ�ê
			 */
			PolylineConnection.prototype.getTargetAnchor = function(){
				return this.endAnchor;
			}
			/**
			 * �õ��յ�����
			 */
			PolylineConnection.prototype.getTargetDecoration = function(){
				return this.endArrow;
			}
			PolylineConnection.prototype.hookSourceAnchor = function(){
				if (this.getSourceAnchor() != null){
					this.getSourceAnchor().addAnchorListener(this);
				}
			}
			PolylineConnection.prototype.hookTargetAnchor = function(){
				if (this.getTargetAnchor() != null){
					this.getTargetAnchor().addAnchorListener(this);
				}
			}
			PolylineConnection.prototype.layout = function(){
				if (this.getSourceAnchor() != null && this.getTargetAnchor() != null){
					this.connectionRouter.route(this);
				}
				var  oldBounds = this.bounds;
				this.parentMethod("layout");
				this.bounds = null;
				if (!this.getBounds().contains(oldBounds)) {
					if(oldBounds != null){
						this.getParent().translateToParent(oldBounds);
						this.getUpdateManager().addDirtyRegion(this.getParent(), oldBounds);
					}
				}
				this.repaint();
				this.fireFigureMoved();
			}
			PolylineConnection.prototype.removeNotify = function(){
				this.unhookSourceAnchor();
				this.unhookTargetAnchor();
				this.connectionRouter.remove(this);
				this.parentMethod("removeNotify");
			}
			/**
			 * �Ƴ�·�ɼ�����
			 */
			PolylineConnection.prototype.removeRoutingListener = function(listener){
				if(this.connectionRouter != null){
					if (Util.isInstanceOf(this.connectionRouter, RoutingNotifier)) {
						this.connectionRouter.listeners.remove(listener);
						if(this.connectionRouter.listeners.length == 0){
							this.connectionRouter = this.connectionRouter.realRouter;
						}
					}
				}
			}
			PolylineConnection.prototype.revalidate = function(){
				this.parentMethod("revalidate");
				this.connectionRouter.invalidate(this);
			}
			/**
			 * ����������·��
			 * @param {AbstractRouter} cr ·��
			 */
			PolylineConnection.prototype.setConnectionRouter = function(cr){
				if (cr == null) cr = AbstractRouter.NULL;
				var oldRouter = this.getConnectionRouter();
				if (oldRouter != cr) {
					this.connectionRouter.remove(this);
					if(this.connectionRouter!= null && Util.isInstanceOf(this.connectionRouter, RoutingNotifier)){
						this.connectionRouter.realRouter = cr;
					}else{
						this.connectionRouter = cr;
					}
					this.firePropertyChange(Connection.PROPERTY_CONNECTION_ROUTER, oldRouter, cr);
					this.revalidate();
				}
			}
			/**
			 * ����·��Լ��
			 */
			PolylineConnection.prototype.setRoutingConstraint = function(cons){
				if (this.connectionRouter != null){
					this.connectionRouter.setConstraint(this, cons);
				}
				this.revalidate();
			}
			/**
			 * �������ê
			 */
			PolylineConnection.prototype.setSourceAnchor = function(anchor){
				if (anchor == this.startAnchor){
					return;
				}
				this.unhookSourceAnchor();
				this.startAnchor = anchor;
				if (this.getParent() != null){
					this.hookSourceAnchor();
				}
				this.revalidate(); 
			}
			/**
			 * �����������
			 */
			PolylineConnection.prototype.setSourceDecoration = function(dec){
				if (this.startArrow == dec){
					return;
				}
				if (this.startArrow != null){
					this.remove(this.startArrow);
				}
				this.startArrow = dec;
				if (this.startArrow != null){
					this.add(this.startArrow, new ArrowLocator(this, ConnectionLocator.SOURCE));
				}	
			}
			/**
			 * �����յ�ê
			 */
			PolylineConnection.prototype.setTargetAnchor = function(anchor){
				if (anchor == this.endAnchor){
					return;
				}
				this.unhookTargetAnchor();
				this.endAnchor = anchor;
				if (this.getParent() != null){
					this.hookTargetAnchor();
				}
				this.revalidate();
			}
			/**
			 * �����յ�����
			 */
			PolylineConnection.prototype.setTargetDecoration = function(dec){
				if (this.endArrow == dec){
					return;
				}
				if (this.endArrow != null){
					this.remove(this.endArrow);
				}
				this.endArrow = dec;
				if (this.endArrow != null){
					this.add(this.endArrow, new ArrowLocator(this, ConnectionLocator.TARGET));
				}
				
			}
			PolylineConnection.prototype.unhookSourceAnchor = function(){
				if (this.getSourceAnchor() != null){
					this.getSourceAnchor().removeAnchorListener(this);
				}
			}
			PolylineConnection.prototype.unhookTargetAnchor = function(){
				if (this.getTargetAnchor() != null){
					this.getTargetAnchor().removeAnchorListener(this);
				}
			}
			
			PolylineConnection.prototype.init = function(id){
				this.parentMethod("init",id);
				this.startAnchor = null;
				this.endAnchor = null;
				this.connectionRouter = AbstractRouter.NULL;
				this.startArrow = null;
				this.endArrow = null;
				this.setLayoutManager(new DelegatingLayout());
				this.addPoint(new Point(0, 0));
				this.addPoint(new Point(100, 100));
			}
		}
		PolylineConnection._initialized = true;
		_classes.defineClass("PolylineConnection",prototypeFunction); 
	}

	this.init(id);
}
/**
TextUtilities
*/
 //-----------------------------Class TextUtilities-------
 _classes.registerClass("TextUtilities");
 /**
  * @class �ı�������
  * @constructor
  * @returns
  */
 function TextUtilities(){
	if(typeof TextUtilities._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ��ı���С
			 * @param {String} s �ı�
			 * @param {String} f ����
			 * @returns �ı��Ĵ�С
			 * @type Dimension
			 */
			TextUtilities.prototype.getTextExtents = function(s,f){
				var extents = FigureUtilities.getTextExtents(s, f);
				
				if(extents.height == null){
					var fontSize = this.getFontSize(f);
					extents.height = fontSize;
				}
				
				 return extents;
			}
			
			TextUtilities.prototype.getAscent = function(font){
				Debugger.log("TextUtilities -getAscent- TODO");
				//var fm = FigureUtilities.getFontMetrics(font);
				 //return fm.getHeight() - fm.getDescent();
			}
			/**
			 * �õ�ƽ���ַ����
			 * @param {String} f ����
			 * @returns ƽ���ַ����
			 * @type Number
			 */
			TextUtilities.prototype.getAverageCharWidth = function(f){
				var  s="text";
				var width = this.getTextExtents(s,f).width;
				return width/4;
			}
			TextUtilities.prototype.getDescent = function(font){
				Debugger.log("TextUtilities -getDescent- TODO");
				//return FigureUtilities.getFontMetrics(font).getDescent();
			}
			TextUtilities.prototype.getFontSize = function(font){
				if(font == null){
					font = "12px sans-serif";
				}
				var sizeString = new String(new  RegExp("(?:\\d+|\\d+\\.\\d+)px").exec(font));
				var size=new Number(sizeString.substring(0,sizeString.length-2));
				return size;
			}
			/**
			 * �õ������޿���µ���Ӵ�
			 * @param {String} s ԭʼ�ַ���
			 * @param {String} f ����
			 * @param {Number} availableWidth ���ÿ��
			 * @returns ���õ���Ӵ�
			 * @type String
			 */
			TextUtilities.prototype.getLargestSubstringConfinedTo = function(s,f,availableWidth){
				var string = new String(s);
				var metrics = FigureUtilities.getFontMetrics(f);
				var min;
				var max;
				var avg = this.getAverageCharWidth(f);
				min = 0 ;
				max = string.length + 1;
				
				var guess = 0 ;
				var guessSize = 0;
				while((max - min)>1){
					guess = guess + Math.floor((availableWidth - guessSize)/avg);
					if(guess >= max){
						guess = max -1;
					}
					if(guess  <= min){
						guess = min + 1;
					}
					guessSize = this.getTextExtents(string.substring(0,guess),f).width;
					if(guessSize < availableWidth){
						min = guess;
					}else{
						max = guess;
					}
				}
				return min;
			}
			TextUtilities.prototype.init = function(){
				//this.graphics = new Html5Graphics();
			}
		}
		TextUtilities._initialized = true;
		_classes.defineClass("TextUtilities",prototypeFunction); 
	}
	
	this.init();

 }
 /**
  * @static
  * @field TextUtilities
  */
 TextUtilities.INSTANCE = new TextUtilities(); /**
LineAttributes
*/
 //-------------------------------------------Class LineAttributes-----------------------
 _classes.registerClass("LineAttributes");
 /**
  * 
  * @class ��������
  * @constructor
  * @param {Number} width
  * @param {Number} miterLimit
  * @param {Number} cap
  * @param {Number} join
  * @param {Number} color
  * @returns
  */
 function LineAttributes(width,miterLimit,cap,join,color){
	if(typeof LineAttributes._initialized == "undefined"){
		function prototypeFunction () {
			LineAttributes.prototype.init = function(width,miterLimit,cap,join,color){
				/**
				 * @field
				 * @type Number
				 */
				this.lineWidth = 1; //(default 1)
				/**
				 * @field
				 * @type Number
				 */
				this.miterLimit =10; //// (default 10)
				/**
				 * @field
				 * @type String
				 */
				this.lineCap = "butt"; // "butt", "round", "square" (default "butt")
				/**
				 * @field
				 * @type String
				 */
				this.lineJoin = "miter"; //"miter", "round", "bevel" (default "miter")
				/**
				 * @field
				 * @type Color
				 */
				this.lineColor = new Color(0,0,0);
				if(width !=null && width >0){
					this.lineWidth = width;
				}
				if(miterLimit != null && miterLimit >0){
					this.miterLimit = this.miterLimit;
				}
				if(cap != null){
					this.lineCap = cap;
				}
				if(join != null){
					this.lineJoin = join;
				}
				if( color != null){
					this.lineColor = color;
				}
			}
		}
		LineAttributes._initialized = true;
		_classes.defineClass("LineAttributes",prototypeFunction); 
	}
	this.init(width,miterLimit,cap,join,color);
 }/**
UpdateManager
DeferredUpdateManager
*/
var showPerformUpdateTime = false;
var DEBUG_DRAWDAMAGE = false;
var DEBUG_SHOWDAMAGE = false;

//-------------------------------------------Class UpdateManager-----------------------
 _classes.registerClass("UpdateManager");
 /**
  * 
  * @class ���¹�����
  * @constructor
  * @returns
  */
 function UpdateManager (){
	
	if(typeof UpdateManager._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ����������addDirtyRegion(figure,rect);addDirtyRegion(figure,x,y,width,height);
			 */
			UpdateManager.prototype.addDirtyRegion = function(arg1,arg2,arg3,arg4,arg5){
			 }
			/**
			 * ������Чͼ��
			 * @param {Figure} f
			 */
			 UpdateManager.prototype.addInvalidFigure = function(f){
			 }
			 /**
			  * ִ�и���
			  */
			 UpdateManager.prototype.performUpdate = function(){
			 }
			 /**
			  * ���ø�ͼ��
			  * @param {Figure} root
			  */
			 UpdateManager.prototype.setRoot = function(root){
			 }
			 /**
			  * ���û�ͼԴ
			  */
			 UpdateManager.prototype.setGraphicsSource = function(gs){
			 }
			 UpdateManager.prototype.init = function(){
			 }
		}
		UpdateManager._initialized = true;
		_classes.defineClass("UpdateManager",prototypeFunction); 
	}
	
	this.init();
	
}

//-------------------------------------------Class DeferredUpdateManager-----------------------
 _classes.registerClass("DeferredUpdateManager","UpdateManager");
 /**
  * 
  * @class Ĭ�ϵĸ��¹�����
  * @constructor
  * @extends UpdateManager
  * @returns
  */
function DeferredUpdateManager (){
	
	
	if(typeof DeferredUpdateManager._initialized == "undefined"){
		function prototypeFunction () {
			DeferredUpdateManager.prototype.addDirtyRegion = function(arg1,arg2,arg3,arg4,arg5){
				var figure;
				var rect;
				if(arg1 == null || arg2 == null){
					return;
				}
				if(Util.isInstanceOf(arg2, Rectangle)){
					figure = arg1;
					rect = arg2;
				}else if(arguments.length == 5){
					figure = arguments[0];
					rect = new Rectangle(arguments[1],arguments[2],arguments[3],arguments[4]);
				}
				if(rect.isEmpty()){
					return;
				}
				var oldRect = this.dirtyRegions.get(figure);

				if(!oldRect){
					this.dirtyRegions.put(figure,rect);
				}else{
					oldRect.union(rect);
				}
				this.fireAddDirty();
				this.queueWork();
			}
			
			DeferredUpdateManager.prototype.addInvalidFigure = function(f){
				if(Util.Array.contains(this.invalidFigures,f)){
					return;
				}
				this.queueWork();
				this.invalidFigures.push(f);
			}
			DeferredUpdateManager.prototype.fireAddDirty = function(){
				if(this.dirtyListener != null){
					this.dirtyListener();
				}
			}
			//�����ػ�
			DeferredUpdateManager.prototype.queueWork = function(){
				var  updater = this;
				if(!this.updateTimeout){
					this.updateTimeout = setTimeout(function(){updater.performUpdate();updater.updateTimeout = null;},0);
				}
			}
			/**
			 * ���������������,����������ʱ��֪ͨ�˼�����
			 */
			DeferredUpdateManager.prototype.setDirtyListener = function(listener){
				this.dirtyListener = listener;
			}
			/**
			 * �Ƴ������������ 
			 * @see #setDirtyListener
			 */
			DeferredUpdateManager.prototype.removeDirtyListener = function(){
				this.dirtyListener = null;
			}
			DeferredUpdateManager.prototype.fireValidating = function(){
				//TODO
			}
			DeferredUpdateManager.prototype.getGraphics = function(rect){
				if(this.graphicsSource){
					return this.graphicsSource.getGraphics(rect);
				}
			}
			DeferredUpdateManager.prototype.releaseGraphics = function(graphics){
				this.graphicsSource.flushGraphics(this.damage);
				
			}
			DeferredUpdateManager.prototype.repairDamage = function(){
				var map = this.dirtyRegions.map;
				if(map.length == 0 ){
					return;
				}
				//---------------debug-------------
				//var rect;
				//var i;
				//for(i=0;i<map.length -1;i += 2){
				//	Debugger.log("figure:["+map[i].id+"]");
				//	rect = map[i+1];
				//	Debugger.log("dirty:["+rect.x+","+rect.y+","+rect.width+","+rect.height+"]");
				//}
				//---------------debug------------
				var keys = this.dirtyRegions.keySetIterator();
				var contribution;
				var figure;
				var walker;
				
				while(keys.hasNext()){
					figure = keys.next();
					walker = figure.getParent();
					contribution = this.dirtyRegions.get(figure);
					contribution.intersect(figure.getBounds());
					while(!contribution.isEmpty() && walker){
						walker.translateToParent(contribution);
						contribution.intersect(walker.getBounds());
						walker = walker.getParent();
					}
					if(!this.damage){
						this.damage = new Rectangle(contribution);
					}else{
						this.damage.union(contribution);
					}
				}
				
				if(!this.dirtyRegions.isEmpty()){
					var oldRegions = this.dirtyRegions;
					this.dirtyRegions = new Map();
					//this.firePainting(this.damage,oldRegions);
				}
				if(this.damage && !this.damage.isEmpty()){
					
					//����С��������ػ�������С��������ְ�ɫ�ı߿�
					//���߼�������
//					this.damage.x = (this.damage.x << 0);
//					this.damage.y = (this.damage.y << 0);
//					this.damage.width = (this.damage.width << 0);
//					this.damage.height = (this.damage.height << 0);
					//����С��
					try {
						var graphics = this.getGraphics(this.damage);
					} catch (e) {
						if (console && console.error) {
							console.error(e);
						}
					
					}
					if(graphics){
						try {
							var clip = graphics.getClip(new Rectangle(0,0,0,0));
							this.root.paint(graphics);
						} catch (e) {
							if (console && console.error) {
								console.error(e);
							}
						}
						try {
							this.releaseGraphics(graphics);
						} catch (e) {
							if (console && console.error) {
								console.error(e);
							}
						}
					}
					//---------------debug-------------
					//ֱ���ڽ�������ʾ�ػ�����
					if(DEBUG_SHOWDAMAGE){
						this.graphicsSource.control.context.clearRect(0,0,200,50);
						this.graphicsSource.control.context.fillText("damage:["+this.damage.x+","+this.damage.y+","+this.damage.width+","+this.damage.height+"]",0,22);
						
						if(clip != null){
							this.graphicsSource.control.context.fillText("clip:["+clip.x+","+clip.y+","+clip.width+","+clip.height+"]",0,40);
						}
					}
					if(DEBUG_DRAWDAMAGE){
						this.graphicsSource.control.context.beginPath();
						this.graphicsSource.control.context.rect(this.damage.x,this.damage.y,this.damage.width,this.damage.height);
						this.graphicsSource.control.context.stroke();
					}
					//---------------debug-------------
				}
				this.damage = null;
			}
			DeferredUpdateManager.prototype.setGraphicsSource = function(gs){
				this.graphicsSource = gs;
			}
			DeferredUpdateManager.prototype.setRoot = function(root){
				this.root = root;
			}
			DeferredUpdateManager.prototype.paint = function(canvas){
				
				/*
				if(!this.validating){
					var graphicsSource = new Html5GraphicsSource(canvas);
					var graphics = graphicsSource.getGraphics(canvas.getClipping());
					if(graphics){
						this.root.paint(graphics);
						alert("xx");
						graphicsSource.flushGraphics(canvas.getClipping());
					}
				}else{
				*/	
					this.root.invalidateTree();
					this.root.validate();
					this.root.repaint();
					//this.addDirtyRegion(this.root, canvas.getClipping());
					
					//alert("xx");
					this.performUpdate();
				//}
				
			}
			DeferredUpdateManager.prototype.performUpdate = function(){
				//-----------------debug-----------------
				//��¼��ʼʱ��
				var startDate;
				if(showPerformUpdateTime){
					startDate = new Date().getTime();
				}
				//-----------------debug-----------------
				if (this.disposed || this.updating){
					return;
				}
				this.performValidation();
				this.updating = true;
				
				this.repairDamage();
					// runnableChain ....
				this.updating = false;
				
				//-----------------debug-----------------
				if(showPerformUpdateTime){
					var endDate = new Date().getTime();
//					function getDeltaSenconds(start,end){
//						var ss = start.getSeconds();
//						var sm = start.getMilliseconds();
//						var es = endDate.getSeconds();
//						var em = endDate.getMilliseconds();	
//						delta = es*1000 + em -(ss*1000+sm);
//						return delta;
//					}
					Debugger.log("performUpdate: "+(endDate - startDate)+"ms");
				}
				//-----------------debug-----------------
			}
			
			//validate all the figure in this.invalidFigures array and clear the array.
			DeferredUpdateManager.prototype.performValidation = function(){
				if(this.invalidFigures.length == 0 || this.validating){
					return;
				}
				this.validating = true;
				this.fireValidating();
				var figure;
				while(this.invalidFigures.length>0){
					figure = this.invalidFigures.shift();
					figure.validate();
				}
				this.validating = false;
			}
			DeferredUpdateManager.prototype.dispose = function(){
				if (this.disposed) {
					return;
				}
				this.disposed = true;
				if (this.invalidFigures) {
					for (var i = 0; i< this.invalidFigures.length; i++) {
						this.invalidFigures[i] = null;
					}
					this.invalidFigures = null;
				}
				
				if (this.root && this.root.dispose) {
					this.root.dispose();
				}
				this.root = null;
				
				if (this.graphicsSource && this.graphicsSource.dispose) {
					this.graphicsSource.dispose();
				}
				this.graphicsSource = null;
				
			}
			DeferredUpdateManager.prototype.init = function(){
				
				this.parentMethod("init");
				this.dirtyRegions = new Map();
				this.updateQueued;
				this.invalidFigures = [];
				this.disposed = false;
			}
		}
		DeferredUpdateManager._initialized = true;
		_classes.defineClass("DeferredUpdateManager",prototypeFunction); 
	}
	
	this.init();
}


/**
EventListenerList
TypeIterator
AncestorHelper
*/

//-------------------------------------------Class EventListenerList-----------------------
/**
 * EventListenerList��,���Խ������������ţ����Եõ�ָ��������е�������Ҳ����ɾ��ָ�����ָ����������
 *
 */
 _classes.registerClass("EventListenerList");
 /**
  * @class �¼��������б�
  * @constructor
  * @returns
  */
function EventListenerList(){
	

	if(typeof EventListenerList._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ��Ӽ�����
			 * @param {String} type ����������
			 * @param {Object} listener ������
			 */
			EventListenerList.prototype.addListener = function(type,listener){
				if(!(this.array&&listener)){
					throw("EventListener-addListener-IllegalArgumentException");
					return;
				}
				this.array.push(type);
				this.array.push(listener);
			}
			/**
			 * �Ƿ����ĳ�������
			 * @param {String} type ����������
			 * @type boolean
			 */
			EventListenerList.prototype.containsListener = function(type){
				var i;
				for(i=0 ; i <this.array.length; i += 2){
					if(this.array[i] == type){
						return true;
					}
				}
					return false;
			}
			/**
			 * �õ�ĳ�����͵ļ�����
			 * @param {String} type ����������
			 * @returns һ��������
			 * @type TypeIterator
			 */
			EventListenerList.prototype.getListeners = function(type){
				return new TypeIterator(this.array, type);
			}
			/**
			 * �Ƴ�������
			 * @param {String} type ����������
			 * @param {Object} listener Ҫ�Ƴ��ļ�����
			 */
			EventListenerList.prototype.removeListener = function(type,listener){
				if(this.array.length == 0){
					return;
				}
				if(!(type && listener)){
					throw("EventListenerList-removeListener-IllegalArgumentException");
					return;
				}
				var i;
				for(i=0;i<this.array.length;i += 2){
					if(this.array[i] == type && this.array[i+1] == listener){
						break;
					}
				}
				if(i == this.array.length ){
					return;
				}
				this.array.splice(i,2);
			}
			
			EventListenerList.prototype.init = function(){
				this.array = [];
			}
		
		}
		EventListenerList._initialized = true;
		_classes.defineClass("EventListenerList",prototypeFunction); 
	}
	
	this.init();
}


//-------------------------------------------Class TypeIterator-----------------------

  _classes.registerClass("TypeIterator");
/**
  * 
  * @class ���໮�ֵĵ�����
  * @constructor
  */
function TypeIterator(items,type){
	


	if(typeof TypeIterator._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * �õ���һ��ֵ
			 */
			TypeIterator.prototype.next = function(){
				var result = this._items[this._index+1];
				this._index += 2;
				return result;
			}
			/**
			 * �Ƿ�����һ��ֵ
			 */
			TypeIterator.prototype.hasNext = function(){
				if(!this._items){
					return false;
				}
				while(this._index < this._items.length && (this._items[this._index] != this._type)){
					this._index += 2;
				}
				return this._index < this._items.length;
			}
			TypeIterator.prototype.init = function(items,type){
				this._items = items;
				this._type = type;
				this._index = 0;
			}
		}
		TypeIterator._initialized = true;
		_classes.defineClass("TypeIterator",prototypeFunction); 
	}

	this.init(items,type);
}

//-------------------------------------Class EMPTY_IERATOR------------------------------
  _classes.registerClass("EMPTY_IERATOR");
  /**
   * 
   * @class �յĵ�����
   * @constructor
   */
function EMPTY_IERATOR(){
	if(typeof EMPTY_IERATOR._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ��һ��ֵ
			 * @return null
			 */
			EMPTY_IERATOR.prototype.next = function(){
				return null;
			}
			/**
			 * �Ƿ�����һ��ֵ
			 * @return false
			 */
			EMPTY_IERATOR.prototype.hasNext = function(){
				return false;
			}
			EMPTY_IERATOR.prototype.init = function(){
			}
		}
		EMPTY_IERATOR._initialized = true;
		_classes.defineClass("EMPTY_IERATOR",prototypeFunction); 
	}

	this.init();
}



//-------------------------------------Class AncestorHelper------------------------------
  _classes.registerClass("AncestorHelper");
function AncestorHelper(baseFigure){
	if(typeof AncestorHelper._initialized == "undefined"){
		function prototypeFunction () {
			AncestorHelper.prototype.addAncestorListener = function(listener){
				 if (this.listeners == null) {
					this.listeners = [];
					this.listeners.push(listener);
				 }else{
					this.listeners.push(listener);
				 }
			}
			AncestorHelper.prototype.addAncestors = function(rootFigure){
				for (var ancestor = rootFigure;ancestor != null;ancestor = ancestor.getParent()) {
					ancestor.addFigureListener(this);
					ancestor.addPropertyChangeListener("parent", this);
				}
			}
			AncestorHelper.prototype.dispose = function(){
				this.removeAncestors(this.base);
				this.listeners = null;
			}
			AncestorHelper.prototype.figureMoved = function(ancestor){
				this.fireAncestorMoved(ancestor);
			}
			AncestorHelper.prototype.fireAncestorMoved = function(ancestor){
				if (this.listeners == null){
					return;
				}
				for (var i = 0; i < this.listeners.length; i++){
					this.listeners[i].ancestorMoved(ancestor);
				}
			}
			AncestorHelper.prototype.fireAncestorAdded = function(ancestor){
				if (this.listeners == null){
					return;
				}
				for (var i = 0; i < this.listeners.length; i++){
					this.listeners[i].ancestorAdded(ancestor);
				}
			}
			AncestorHelper.prototype.fireAncestorRemoved = function(ancestor){
				if (this.listeners == null){
					return;
				}
				for (var i = 0; i < this.listeners.length; i++){
					this.listeners[i].ancestorRemoved(ancestor);
				}
			}
			AncestorHelper.prototype.isEmpty = function(){
				return this.listeners == null;
			}
			AncestorHelper.prototype.propertyChange = function(event){
				if (event.getPropertyName() == "parent") {
					var oldParent = event.getOldValue();
					var newParent = event.getNewValue();
					if (oldParent != null) {
						this.removeAncestors(oldParent);
						this.fireAncestorRemoved(oldParent);
					}
					if (newParent != null) {
						this.addAncestors(newParent);
						this.fireAncestorAdded(newParent);
					}
				}
			}
			AncestorHelper.prototype.removeAncestorListener = function(listener){
				if (this.listeners == null){
					return;
				}
				for (var index = 0; index < this.listeners.length; index++){
					if (this.listeners[index] == listener) {
						this.listeners.splice(index,1);
						return;
					}
				}
			}
			AncestorHelper.prototype.removeAncestors = function(rootFigure){
				for (var ancestor = rootFigure; ancestor != null; ancestor = ancestor.getParent()) {
					ancestor.removeFigureListener(this);
					ancestor.removePropertyChangeListener("parent", this);
				}
			}
			
			AncestorHelper.prototype.init = function(baseFigure){
				this.base = baseFigure;
				this.listeners = [];
				this.addAncestors(baseFigure);
			}
		}
		AncestorHelper._initialized = true;
		_classes.defineClass("AncestorHelper",prototypeFunction); 
	}

	this.init(baseFigure);
}/**
Html5GraphicsSource
*/
 //-------------------------------------------Class Html5GraphicsSource-----------------------
 _classes.registerClass("Html5GraphicsSource");
 /**
  * @class
  * @param canvas
  * @returns
  */
 function Html5GraphicsSource(canvas){
	if(typeof Html5GraphicsSource._initialized == "undefined"){
		function prototypeFunction () {
			
			Html5GraphicsSource.prototype.flushGraphics = function(){
				//this.control.context.clearRect(this.inUse.x,this.inUse.y,this.inUse.width,this.inUse.height);
				//this.control.context.drawImage(this.canvasElement,0,0);
				//this.control.context.strokeRect(this.inUse.x,this.inUse.y,this.inUse.width,this.inUse.height);
				//this.control.context.strokeRect(this.inUse.x,this.inUse.y,this.inUse.width,this.inUse.height);
				this.graphics.dispose();
			}
			
			Html5GraphicsSource.prototype.getGraphics = function(rect){
				if(!this.control){
					return;
				}
				
				var controlSize = this.control.getSize();
				this.inUse = new Rectangle(0,0,controlSize.width,controlSize.height);
				this.inUse.intersect(rect);
				
				if (this.inUse.isEmpty()){
					return null;
				}
				/*
				var canvasElement =  document.createElement("canvas");
				this.canvasElement = canvasElement;
				canvasElement.width = this.control.getWidth();
				canvasElement.height = this.control.getHeight();
				this.context = canvasElement.getContext("2d");
				var graphics = new Html5Graphics(this.context,new Rectangle(this.inUse.x,this.inUse.y,this.inUse.width,this.inUse.height));
				*/
				this.control.context.clearRect(this.inUse.x,this.inUse.y,this.inUse.width,this.inUse.height);
				this.graphics = new Html5Graphics(this.control.context,new Rectangle(this.inUse.x,this.inUse.y,this.inUse.width,this.inUse.height));
				return this.graphics;
			}
			Html5GraphicsSource.prototype.init = function(canvas){
				this.control = canvas;
				
			}
		}
		Html5GraphicsSource._initialized = true;
		_classes.defineClass("Html5GraphicsSource",prototypeFunction); 
	}
	this.init(canvas);
 }
 /**
LightweightSystem
EventHandler
*/
//-------------------------------------------Class LightweightSystem-----------------------
 _classes.registerClass("LightweightSystem");
 /**
  * 
  * @class ������ϵͳ
  * @constructor
  * @param canvas
  * @returns
  */
function LightweightSystem (canvas){
	
	if(typeof LightweightSystem._initialized == "undefined"){
		function prototypeFunction () {
			//�¼�����
			
			//
			LightweightSystem.prototype.addListeners = function(){
				this.canvas.addControllListener(this);
				this.canvas.addMouseListener(this.handler);
				if (this.canvas.addTouchListener) {
					this.canvas.addTouchListener(this.handler);					
				}
				this.canvas.addKeyListener(this.handler);
			}
			LightweightSystem.prototype.controlResized = function(){
				var r = this.canvas.getClientArea();
				
				r.setLocation(0, 0);
				//canvas��С�����仯��ʱ�����ݻᱻ�Զ���������ʱroot��boundsҲ�����仯���ͻᴥ��ȫ���ػ棬�����������.
				//���canvas������Ĵ�С��֮ǰ�Ĵ�С��ͬ����ôroot��bounds���ᷢ���仯�������޷��ػ棬��������⡣��Ҫע�⡣
				//һ��Ҫ��С��ı��˵�ʱ�����ȥ�ı�canvas�ؼ���width��height���ԡ�
				this.root.setBounds(r);
				this.root.revalidate();
				this.manager.performUpdate();
			}
			
			LightweightSystem.prototype.createRootFigure = function(){
				var f = new RootFigure(this);
				f.addNotify();
				f.setOpaque(true);
				f.setLayoutManager(new StackLayout());
				return f;
			}
			LightweightSystem.prototype.getEventDispatcher = function(){
				if (this.dispatcher == null){
					this.setEventDispatcher(new Html5EventDispatcher());
				}
				return this.dispatcher;
			}
			/**
			 * 
			 */
			LightweightSystem.prototype.getUpdateManager = function(){
				return this.manager;
			}
			LightweightSystem.prototype.paint = function(){
				this.manager.paint(this.canvas);
			}
			/**
			 * 
			 */
			LightweightSystem.prototype.performUpdate = function(){
				this.manager.performUpdate();
			}
			/**
			 * 
			 */
			LightweightSystem.prototype.setControl = function(canvas){
				this.canvas = canvas;
				
				this.manager.setGraphicsSource(this.createGraphicsSource(this.canvas));
				this.getEventDispatcher().setControl(canvas);
				this.addListeners();
				
				var r = new Rectangle(canvas.getClientArea());
				r.setLocation(0, 0);
				this.root.setBounds(r);
				this.root.revalidate();
			}
			/**
			 * 
			 */
			LightweightSystem.prototype.setContents = function(contents){
				if(this.contents){
					this.root.remove(this.contents);
				}
				this.contents = contents;
				this.root.add(this.contents);
				
			}
			/**
			 * 
			 */
			LightweightSystem.prototype.setEventDispatcher = function(dispatcher){
				this.dispatcher = dispatcher;
				this.dispatcher.setRoot(this.root);
				this.dispatcher.setControl(this.canvas);
			}
			/**
			 * 
			 */
			LightweightSystem.prototype.setRootPaneFigure = function(root){
				this.manager.setRoot(root);
				this.root = root;
			}
			/**
			 * 
			 */
			LightweightSystem.prototype.getRootFigure = function(){
				return this.root;
			}
			LightweightSystem.prototype.createUpdateManager = function(){
				return new DeferredUpdateManager();
			}
			LightweightSystem.prototype.createGraphicsSource = function(canvas){
				return new Html5GraphicsSource(canvas);
			}
			LightweightSystem.prototype.dispose = function(){
				if (this.dispatcher && this.dispatcher.dispose) {
					this.dispatcher.dispose();
				}
				this.dispatcher = null;
				if (this.canvas && this.canvas.dispose) {
					this.canvas.dispose();
				}
				this.canvas = null;
				if (this.manager && this.manager.dispose) {
					this.manager.dispose();
				}
				this.manager = null;
				
			}
			LightweightSystem.prototype.init = function(canvas){
				this.manager = this.createUpdateManager();
				this.ignoreResize = false;
				this.setRootPaneFigure(this.createRootFigure());
				this.handler = new EventHandler(this);
				if(canvas){
					this.setControl(canvas);
				}
			}	
		}
		LightweightSystem._initialized = true;
		_classes.defineClass("LightweightSystem",prototypeFunction); 
	}
	this.init(canvas);
	
}


//-----------------------------Class EventHandler-------
_classes.registerClass("EventHandler");
function EventHandler(host){
	if(typeof EventHandler._initialized == "undefined"){
		function prototypeFunction () {
			
			EventHandler.prototype.keyPressed = function(e){
				this.host.getEventDispatcher().dispatchKeyPressed(e);
			}
			EventHandler.prototype.keyDown = function(e){
				this.host.getEventDispatcher().dispatchKeyDown(e);
			}
			EventHandler.prototype.keyReleased = function(e){
				this.host.getEventDispatcher().dispatchKeyReleased(e);
			}
			EventHandler.prototype.mouseDoubleClick = function(e){
				this.host.getEventDispatcher().dispatchMouseDoubleClicked(e);
			}
			EventHandler.prototype.click = function(e){
				this.host.getEventDispatcher().dispatchMouseClicked(e);
			}
			EventHandler.prototype.mouseDown = function(e){
				this.host.getEventDispatcher().dispatchMousePressed(e);
			}
			EventHandler.prototype.mouseExit = function(e){
				this.host.getEventDispatcher().dispatchMouseExited(e);
			}
			EventHandler.prototype.mouseHover = function(e){
				this.host.getEventDispatcher().dispatchMouseHover(e);
			}
			EventHandler.prototype.mouseMove = function(e){
				this.host.getEventDispatcher().dispatchMouseMoved(e);
			}
			EventHandler.prototype.mouseUp = function(e){
				this.host.getEventDispatcher().dispatchMouseReleased(e);
			}
			EventHandler.prototype.mouseWheel = function (e) {
				this.host.getEventDispatcher().dispatchMouseWheelScrolled(e);
			}
			EventHandler.prototype.touchStart = function(e){
				this.host.getEventDispatcher().dispatchTouchStart(e);
			}
			EventHandler.prototype.touchMove = function(e){
				this.host.getEventDispatcher().dispatchTouchMove(e);
			}
			EventHandler.prototype.touchEnd = function (e) {
				this.host.getEventDispatcher().dispatchTouchEnd(e);
			}
			EventHandler.prototype.init = function(host){
				this.parentMethod("init");
				this.host = host;
			}
		}
		EventHandler._initialized = true;
		_classes.defineClass("EventHandler",prototypeFunction); 
	}

	this.init(host);
}
/**
PropertyChangeListenerProxy
PropertyChangeSupport
PropertyChangeEvent
IndexedPropertyChangeEvent
*/
//-----------------------------Class PropertyChangeListenerProxy-------
_classes.registerClass("PropertyChangeListenerProxy");
function PropertyChangeListenerProxy(propertyName,listener){
	if(typeof PropertyChangeListenerProxy._initialized == "undefined"){
		function prototypeFunction () {
			PropertyChangeListenerProxy.prototype.getListener = function(){
				return this.listener;
			}
			PropertyChangeListenerProxy.prototype.getPropertyName = function(){
				return this.propertyName;
			}
			PropertyChangeListenerProxy.prototype.propertyChange = function(evt){
				this.getListener().propertyChange(evt);
			}
			PropertyChangeListenerProxy.prototype.init = function(propertyName,listener){
				this.parentMethod("init");
				this.propertyName = propertyName;
				this.listener = listener;
			}
		}
		PropertyChangeListenerProxy._initialized = true;
		_classes.defineClass("PropertyChangeListenerProxy",prototypeFunction); 
	}

	this.init(propertyName,listener);
}

//-----------------------------Class PropertyChangeSupport-------
_classes.registerClass("PropertyChangeSupport");
function PropertyChangeSupport(sourceBean){
	
		
		function prototypeFunction () {
			PropertyChangeSupport.prototype.addPropertyChangeListener = function(arg1,arg2){
				if (arg1 == null) {
					return;
				}
				if(arg2 == null){
					if(Util.isInstanceOf(arg1, PropertyChangeListenerProxy)){
						this.addPropertyChangeListener(arg1.getPropertyName(),arg1.getListener());
					}else{
						if(this.listeners == null){
							this.listeners = [];
						}
						this.listeners.push(arg1);
					}
				}else{
					var propertyName = arg1;
					var listener = arg2;
					if (this.children == null) {
						this.children = new Map();
					}
					var  child = this.children.get(propertyName);
					if (child == null) {
						child = new PropertyChangeSupport(this.source);
						this.children.put(propertyName, child);
					}
					child.addPropertyChangeListener(listener);
				}
			}
			PropertyChangeSupport.prototype.removePropertyChangeListener = function(arg1,arg2){
				if (arg1 == null) {
					return;
				}
				if(arg2 == null){
					if(Util.isInstanceOf(arg1, PropertyChangeListenerProxy)){
						this.removePropertyChangeListener(arg1.getPropertyName(),arg1.getListener());
					}else{
						if (this.listeners == null) {
							return;
						}
						Util.Array.removeItem(this.listeners, arg1);
					}
				}else{
					var propertyName = arg1;
					var listener = arg2;
					if (this.children == null) {
						return;
					}
					var child = this.children.get(propertyName);
					if (child == null) {
						 return;
					}
					child.removePropertyChangeListener(listener);
				}
			}
			
			PropertyChangeSupport.prototype.getPropertyChangeListeners = function(propertyName){
				var returnList = null;
				
				if(propertyName == null){
				
					if(this.listeners != null){
						returnList = this.listeners;
					}else{
						returnList = [];
					}
				
					if (this.children != null) {
						var iterator = this.children.keySetIterator();
						while (iterator.hasNext()) {
							var key = iterator.next();
							var child = this.children.get(key);
							var childListeners = child.getPropertyChangeListeners();
							for (var index = childListeners.length - 1; index >= 0;index--) {
								returnList.push(new PropertyChangeListenerProxy(key, childListeners[index]));
							}
						}
					}
				}else{
					returnList = [];
					if(this.children != null){
						var support = this.children.get(propertyName);
						if (support != null) {
							Util.Array.addAll(returnList, support.getPropertyChangeListeners());
						}
					}
				}
				return returnList;
				
			}
			PropertyChangeSupport.prototype.firePropertyChange = function(arg1,arg2,arg3){
				if(arguments.length == 3){
					var propertyName = arg1;
					var oldValue = arg2;
					var newValue = arg3;
					if (oldValue != null && newValue != null && oldValue == newValue) {
						return;
					}
					this.firePropertyChange(new PropertyChangeEvent(this.source, propertyName,oldValue, newValue));
				}else{
					var evt = arg1;
					var oldValue = evt.getOldValue();
					var newValue = evt.getNewValue();
					var propertyName = evt.getPropertyName();
					if (oldValue != null && newValue != null && oldValue == newValue) {
						return;
					}
					if (this.listeners != null) {
						for (var i = 0; i < this.listeners.length; i++) {
							this.listeners[i].propertyChange(evt);
						}
					}
					if (this.children != null && propertyName != null) {
						var child = this.children.get(propertyName);
						if (child != null) {
							child.firePropertyChange(evt);
						}
					}
				}
			}
			PropertyChangeSupport.prototype.fireIndexedPropertyChange = function(propertyName,index,oldValue,newValue){
				if(oldValue == newValue){
					return;
				}
				this.firePropertyChange(new IndexedPropertyChangeEvent(this.source, propertyName, oldValue, newValue, index));
			}
			PropertyChangeSupport.prototype.hasListeners = function(propertyName){
				if (this.listeners != null && this.listeners.length != 0) {
					 return true;
				}
				if (this.children != null && propertyName != null) {
					var child = this.children.get(propertyName);
					if (child != null && child.listeners != null) {
						return child.listeners.length > 0;
					}
				}
				return false;
			}
			PropertyChangeSupport.prototype.init = function(sourceBean){
				this.parentMethod("init");
				this.listeners;
				this.source = sourceBean;
			}
		}
	_classes.defineClass("PropertyChangeSupport",prototypeFunction); 
	this.init(sourceBean);
}




//-----------------------------Class PropertyChangeEvent-------
_classes.registerClass("PropertyChangeEvent");
function PropertyChangeEvent(source,propertyName,oldValue,newValue){
	if(typeof PropertyChangeEvent._initialized == "undefined"){
		function prototypeFunction () {
			PropertyChangeEvent.prototype.getPropertyName = function(){
				return this.propertyName;
			}
			PropertyChangeEvent.prototype.getNewValue = function(){
				return this.newValue;
			}
			PropertyChangeEvent.prototype.getOldValue = function(){
				return this.oldValue;
			}
			PropertyChangeEvent.prototype.setPropagationId = function(propagationId){
				this.propagationId = propagationId;
			}
			PropertyChangeEvent.prototype.getPropagationId = function(){
				return this.propagationId;
			}
			PropertyChangeEvent.prototype.getSource = function(){
				return this.source;
			}
			PropertyChangeEvent.prototype.init = function(source,propertyName,oldValue,newValue){
				this.parentMethod("init");
				this.source = source;
				this.propertyName = propertyName;
				this.newValue = newValue;
				this.oldValue = oldValue;
			}
		}
		PropertyChangeEvent._initialized = true;
		_classes.defineClass("PropertyChangeEvent",prototypeFunction); 
	}

	this.init(source,propertyName,oldValue,newValue);
}


//-----------------------------Class IndexedPropertyChangeEvent-------
_classes.registerClass("IndexedPropertyChangeEvent","PropertyChangeEvent");
function IndexedPropertyChangeEvent(source,propertyName,oldValue,newValue,index){
	if(typeof IndexedPropertyChangeEvent._initialized == "undefined"){
		function prototypeFunction () {
			IndexedPropertyChangeEvent.prototype.getIndex = function(){
				return this.index;
			}
			IndexedPropertyChangeEvent.prototype.init = function(source,propertyName,oldValue,newValue,index){
				this.parentMethod("init",source,propertyName,oldValue,newValue);
				this.index = index;
			}
		}
		IndexedPropertyChangeEvent._initialized = true;
		_classes.defineClass("IndexedPropertyChangeEvent",prototypeFunction); 
	}

	this.init(source,propertyName,oldValue,newValue,index);
}/**
Html5EventDispatcher
FocusTraverseManager
ToolTipHelper
*/

//-------------------------------------------Class Html5EventDispatcher-----------------------
_classes.registerClass("Html5EventDispatcher");
/**
 * 
 * @class �¼�������
 * @constructor
 */
function Html5EventDispatcher(){
		function prototypeFunction () {
			/**
			 * ��ý���
			 */
			Html5EventDispatcher.prototype.dispatchFocusGained = function(e){
				var currentFocusOwner = this.getFocusTraverseManager().getCurrentFocusOwner();
				if (currentFocusOwner == null){
					currentFocusOwner = this.getFocusTraverseManager().getNextFocusableFigure(this.root, this.focusOwner);
				}
				this.setFocus(currentFocusOwner);
			}
			/**
			 * ʧȥ����
			 */
			Html5EventDispatcher.prototype.dispatchFocusLost = function(e){
				this.setFocus(null);
			}
			/**
			 * ����һ����
			 */
			Html5EventDispatcher.prototype.dispatchKeyPressed = function(e){
				if (this.focusOwner != null) {
					//draw2d.KeyEvent
					var event = new KeyEvent(this, this.focusOwner, e);
					this.focusOwner.handleKeyPressed(event);
				}
			}
			/**
			 * �ſ�һ����
			 */
			Html5EventDispatcher.prototype.dispatchKeyReleased = function(e){
				if (this.focusOwner != null) {
				//draw2d.KeyEvent
					var event = new KeyEvent(this, this.focusOwner, e);
					this.focusOwner.handleKeyReleased(event);
				}
			}
			/**
			 * 
			 */
			Html5EventDispatcher.prototype.dispatchKeyDown = function(e){
				if (this.focusOwner != null) {
				//draw2d.KeyEvent
					var event = new KeyEvent(this, this.focusOwner, e);
					this.focusOwner.handleKeyPressed(event);
				}
			}
			Html5EventDispatcher.prototype.dispatchMouseWheelScrolled = function (e) {
				
			}
			//�����¼�����tab��shift+tab
			Html5EventDispatcher.prototype.dispatchKeyTraversed = function(e){
				
			}
			Html5EventDispatcher.prototype.dispatchMouseHover = function(me){
				this.receive(me);
				if (this.mouseTarget != null){
					this.mouseTarget.handleMouseHover(this.currentEvent);	
				}
				if (this.hoverSource != null) {
					this.toolTipHelper = this.getToolTipHelper();
					var tip = this.hoverSource.getToolTip();
					var control = me.getSource();
					var absolute= control.toDisplay(new Point(me.x, me.y));
					this.toolTipHelper.displayToolTipNear(this.hoverSource, tip, absolute.x, absolute.y);
				}
			}
			/**
			 * ���˫��
			 */
			Html5EventDispatcher.prototype.dispatchMouseDoubleClicked = function(me){
				this.receive(me);
				if (this.mouseTarget != null){
					
					this.mouseTarget.handleMouseDoubleClicked(this.currentEvent);
				}
			}
			/**
			 * ��굥��
			 */
			Html5EventDispatcher.prototype.dispatchMouseClicked = function(me){
				this.receive(me);
				if (this.mouseTarget != null){
					
					this.mouseTarget.handleMouseClicked(this.currentEvent);
				}
			}
			/**
			 * ������
			 */
			Html5EventDispatcher.prototype.dispatchMouseEntered = function(me){
				this.receive(me);
			}
			/**
			 * ����Ƴ�
			 */
			Html5EventDispatcher.prototype.dispatchMouseExited = function(me){
				this.setHoverSource(null, me);
				if (this.mouseTarget != null) {
					this.currentEvent = new MouseEvent(me.x, me.y, this, this.mouseTarget, me.button, me.stateMask, me);
					this.mouseTarget.handleMouseExited(this.currentEvent);
					this.releaseCapture();
					this.mouseTarget = null;
				}
			}
			/**
			 * ��갴��
			 */
			Html5EventDispatcher.prototype.dispatchMousePressed = function(me){
				this.receive(me);
				if (this.mouseTarget != null) {
					this.mouseTarget.handleMousePressed(this.currentEvent);
					if (this.currentEvent.isConsumed()){
						this.setCapture(this.mouseTarget);
					}
				}
			}
			/**
			 * ����ƶ�
			 */
			Html5EventDispatcher.prototype.dispatchMouseMoved = function(me){
				this.receive(me);
				if (this.mouseTarget != null) {
					if (me.button == Canvas.BUTTON_LEFT){
						this.mouseTarget.handleMouseDragged(this.currentEvent);
						//ǿ��ˢ��
//						var parent = this.mouseTarget;
//						while(parent.parent != null){
//							parent = parent.parent;
//						}
//						if(parent.lws != null){
//							//setTimeout(function(){parent.lws.performUpdate()}); //�ӳ��ػ棬�Լ����ػ����
//							//parent.lws.performUpdate();
//						}
						//ǿ��ˢ��
					}else{
						this.mouseTarget.handleMouseMoved(this.currentEvent);
					}
					
				}
			}
			/**
			 * ����ɿ�
			 */
			Html5EventDispatcher.prototype.dispatchMouseReleased = function(me){
				this.receive(me);
				if (this.mouseTarget != null) {
					this.mouseTarget.handleMouseReleased(this.currentEvent);
				}
				this.releaseCapture();
				this.receive(me);
			}
			/**
			 * ������ʼ
			 */
			Html5EventDispatcher.prototype.dispatchTouchStart = function(me){
				//todo
			}
			/**
			 * �����ƶ�
			 */
			Html5EventDispatcher.prototype.dispatchTouchMove = function(me){
				//todo
			}
			/**
			 * ��������
			 */
			Html5EventDispatcher.prototype.dispatchTouchEnd = function(me){
				//todo
			}
			/**
			 * �õ���ǰ�¼�
			 */
			Html5EventDispatcher.prototype.getCurrentEvent = function(){
				return this.currentEvent;
			}
			Html5EventDispatcher.prototype.getCurrentToolTip = function(){
				if (this.hoverSource != null){
					return this.hoverSource.getToolTip();
				}else{
					return null;
				}
			}
			/**
			 * �õ���ǰ���Ŀ��
			 */
			Html5EventDispatcher.prototype.getCursorTarget = function(){
				return this.cursorTarget;
			}
			Html5EventDispatcher.prototype.getToolTipHelper = function(){
				if (this.toolTipHelper == null){
					this.toolTipHelper = new ToolTipHelper(this.control);
				}
				return this.toolTipHelper;
			}
			Html5EventDispatcher.prototype.getFocusTraverseManager = function(){
				if (this.focusManager == null) {
					this.focusManager = new FocusTraverseManager();
				}
				return this.focusManager;
			}
			/**
			 * �õ�����ӵ����
			 */
			Html5EventDispatcher.prototype.getFocusOwner = function(){
				return this.focusOwner;
			}
			/**
			 * �õ���ǰ���Ŀ��
			 * @type Figure
			 */
			Html5EventDispatcher.prototype.getMouseTarget = function(){
				return this.mouseTarget;
			}
			/**
			 * �õ���ͼ��
			 * @type Figure
			 */
			Html5EventDispatcher.prototype.getRoot = function(){
				return this.root;
			}
			/**
			 * 
			 */
			Html5EventDispatcher.prototype.isCaptured = function(){
				return this.captured;
			}
			Html5EventDispatcher.prototype.receive = function(me){
				this.currentEvent = null;
				this.updateFigureUnderCursor(me);
				var state = me.stateMask;
				if (this.captured) {
					if (this.mouseTarget != null){
						//draw2d.MouseEvent
						this.currentEvent = new MouseEvent(me.x, me.y, this, this.mouseTarget, me.button, state, me);
					}
				}else{
					var f= this.mouseTarget;
					//if(!(me.button == Canvas.BUTTON_LEFT && me.type == "mousemove")){ //����ק״̬�²�����Ŀ����л�
						f = this.root.findMouseEventTargetAt(me.x, me.y);
					//}
					if (f == this.mouseTarget) {
						if (this.mouseTarget != null){
							this.currentEvent = new MouseEvent(me.x, me.y, this, this.mouseTarget, me.button, state, me);
						}
						return;
					}
					if (this.mouseTarget != null) {
						this.currentEvent = new MouseEvent(me.x, me.y, this, this.mouseTarget, me.button, state,  me);
						this.mouseTarget.handleMouseExited(this.currentEvent);
					}
					this.setMouseTarget(f);
					if (this.mouseTarget != null) {
						this.currentEvent = new MouseEvent(me.x, me.y, this, this.mouseTarget, me.button, state, me);
						this.mouseTarget.handleMouseEntered(this.currentEvent);
					}
				}
			}
			Html5EventDispatcher.prototype.releaseCapture = function(){
				this.captured = false;
			}
			/**
			 * 
			 */
			Html5EventDispatcher.prototype.requestFocus = function(fig){
				this.setFocus(fig);
			}
			/**
			 * 
			 */
			Html5EventDispatcher.prototype.requestRemoveFocus = function(fig){
				if (this.getFocusOwner() == fig){
					this.setFocus(null);
				}
				if (this.mouseTarget == fig){
					this.mouseTarget = null;
				}
				if (this.cursorTarget == fig){
					this.cursorTarget = null;
				}
				if (this.hoverSource == fig){
					this.hoverSource = null;
				}
				this.getFocusTraverseManager().setCurrentFocusOwner(null);
			}
			Html5EventDispatcher.prototype.setCapture = function(figure){
				this.captured = true;
				this.mouseTarget = figure;
			}
			/**
			 * ���ÿؼ�
			 */
			Html5EventDispatcher.prototype.setControl = function(c){
				if (c == this.control){
					return;
				}
				if (this.control != null && !this.control.isDisposed()){
					throw("Html5EventDispatcher--setControl--Can not set control again once it has been set");
				}
				var that = this;
				if (c != null){
					c.addDisposeListener({
						widgetDisposed: function(){
							if (that.toolTipHelper != null){
								that.toolTipHelper.dispose();
							}
						}
					});
				}
				this.control = c;
			}
			Html5EventDispatcher.prototype.setCursor = function(c){
				if (c == null && this.cursor == null) {
					return;
				}else if(c != this.cursor){
					this.cursor = c;
					if (this.control != null && !this.control.isDisposed()){
						this.control.setCursor(c);
					}
				}
			}
			/**
			 * 
			 */
			Html5EventDispatcher.prototype.setEnableKeyTraversal = function(traverse){
				this.figureTraverse = traverse;
			}
			Html5EventDispatcher.prototype.setFigureUnderCursor = function(f){
				if (this.cursorTarget == f){
					return;
				}
				this.cursorTarget = f;
				this.updateCursor();
			}
			Html5EventDispatcher.prototype.setFocus = function(fig){
				if (fig == this.focusOwner){
					return;
				}
				//draw2d.FocusEvent
				var fe = new FocusEvent(this.focusOwner, fig);
				var  oldOwner = this.focusOwner;
				this.focusOwner = fig;
				if (oldOwner != null){
					oldOwner.handleFocusLost(fe);
				}
				if (fig != null){
					this.getFocusTraverseManager().setCurrentFocusOwner(fig);
				}
				if (this.focusOwner != null){
					this.focusOwner.handleFocusGained(fe);
				}
			}
			Html5EventDispatcher.prototype.setHoverSource = function(figure,me){
				this.hoverSource = figure;
				if (figure != null) {
					var control = me.getSource();
					var absolute = control.toDisplay(new Point(me.x, me.y));
					this.toolTipHelper = this.getToolTipHelper();
					this.toolTipHelper.updateToolTip(this.hoverSource, this.getCurrentToolTip(), absolute.x, absolute.y);	
				}else if (this.toolTipHelper != null) {
					this.toolTipHelper.updateToolTip(this.hoverSource, this.getCurrentToolTip(), me.x, me.y);
				}
			}
			Html5EventDispatcher.prototype.setMouseTarget = function(figure){
				this.mouseTarget = figure;
			}
			/**
			 * ���ø�
			 * @param {Figure} figure
			 */
			Html5EventDispatcher.prototype.setRoot = function(figure){
				this.root = figure;
			}
			Html5EventDispatcher.prototype.updateCursor = function(){
				var  newCursor = null;
				if (this.cursorTarget != null){
					newCursor = this.cursorTarget.getCursor();
				}
				if(newCursor == null){
					newCursor = Cursor.DEFAULT;
				}
				this.setCursor(newCursor);
			}
			Html5EventDispatcher.prototype.updateFigureUnderCursor = function(me){
				if (!this.captured) {
					var f = this.root.findFigureAt(me.x, me.y);
					this.setFigureUnderCursor(f);
					if (this.cursorTarget != this.hoverSource){
						this.updateHoverSource(me);
					}
				}
			}
			Html5EventDispatcher.prototype.updateHoverSource = function(me){
				if (this.cursorTarget != null) {
					var  sourceFound = false;
					var source = this.cursorTarget;
					while (!sourceFound && source.getParent() != null) {
						if (source.getToolTip() != null){
							sourceFound = true;
						}else{
							source = source.getParent();		
						}
					}
					this.setHoverSource(source, me);
				}else{
					this.setHoverSource(null, me);
				}
			}
			Html5EventDispatcher.prototype.init = function(){
				this.parentMethod("init");
				this.figureTraverse = true;
				this.captured = false;
				this.root = null;
				this.mouseTarget = null;
				this.cursorTarget = null;
				this.focusOwner =  null;
				this.hoverSource = null;
				this.currentEvent = null;
				this.cursor = null;
				this.control = null;
				this.toolTipHelper = null;
				this.focusManager = new FocusTraverseManager();
				
			}
		}
	_classes.defineClass("Html5EventDispatcher",prototypeFunction); 
	this.init();
}




//-----------------------------Class FocusTraverseManager-------
_classes.registerClass("FocusTraverseManager");
function FocusTraverseManager(){
	if(typeof FocusTraverseManager._initialized == "undefined"){
		function prototypeFunction () {
			FocusTraverseManager.prototype.findDeepestRightmostChildOf = function(fig){	
				while (fig.getChildren().length != 0){
					fig = fig.getChildren().get(fig.getChildren().length - 1);
				}
				return fig;
			}
			FocusTraverseManager.prototype.getNextFocusableFigure = function(root,prevFocus){
				var found = false;
				var nextFocus = prevFocus;
				if (prevFocus == null) {
					if (root.getChildren().length != 0) {
						nextFocus =(root.getChildren())[0];
						if (this.isFocusEligible(nextFocus)){
							return nextFocus;
						}
					}else{
						return null;
					}
				}
				var siblingPos = Util.Array.indexOf(nextFocus.getParent().getChildren(), nextFocus);
				while (!found) {
					var  parent = nextFocus.getParent();
					var siblings = parent.getChildren();
					if (nextFocus.getChildren().length != 0) {
						nextFocus = nextFocus.getChildren().get(0);
						siblingPos = 0;
						if (this.isFocusEligible(nextFocus)){
							found = true;	
						}
					}else if(siblingPos < siblings.length - 1){
						nextFocus = siblings.get(++siblingPos);
						if(this.isFocusEligible(nextFocus)){
							found = true;
						}
					}else{
						var untraversedSiblingFound = false;
						while (!untraversedSiblingFound) {
							var p = nextFocus.getParent();	
							var gp = p.getParent();
							if (gp != null) {
								var parentSiblingCount = gp.getChildren().length;
								var parentIndex = Util.Array.indexOf(gp.getChildren(), p);
								if (parentIndex < parentSiblingCount - 1) {
									nextFocus = p.getParent().getChildren().get(parentIndex + 1);
									siblingPos = parentIndex + 1;
									untraversedSiblingFound = true;
									if (this.isFocusEligible(nextFocus))	{
										found = true;
									}
								}else{
									nextFocus = p;
								}
							}else{
								nextFocus = null;
								untraversedSiblingFound = true;
								found = true;
							}
						}
					}
				}
				return nextFocus;
			}
			FocusTraverseManager.prototype.getPreviousFocusableFigure = function(root,prevFocus){
				if (prevFocus == null){
					return null;
				}
				var found = false;
				var nextFocus = prevFocus;
				while (!found) {
					var parent = nextFocus.getParent();
					if (parent == null){
						return null;
					}
					var siblings = parent.getChildren();
					var siblingPos = Util.Array.indexOf(siblings, nextFocus);
					if (siblingPos != 0) {
						var child = this.findDeepestRightmostChildOf(siblings.get(siblingPos - 1));
						if (this.isFocusEligible(child)) {
							found = true;
							nextFocus = child;
						}else if (child.equals(nextFocus)) {
							if (this.isFocusEligible(nextFocus)){
								found = true;
							}
						}else{
							nextFocus = child;
						}
					}else{
						nextFocus = parent;
						if (this.isFocusEligible(nextFocus)){
							found = true;	
						}
					}
				}
				return nextFocus;
			}
			FocusTraverseManager.prototype.getCurrentFocusOwner = function(){
				return currentFocusOwner;
			}
			FocusTraverseManager.prototype.isFocusEligible = function(fig){
				return (fig != null && fig.isFocusTraversable() && fig.isShowing());
			}
			FocusTraverseManager.prototype.setCurrentFocusOwner = function(fig){
				this.currentFocusOwner = fig;
			}
			FocusTraverseManager.prototype.init = function(){
				this.parentMethod("init");
			}
		}
		FocusTraverseManager._initialized = true;
		_classes.defineClass("FocusTraverseManager",prototypeFunction); 
	}

	this.init();
}


//-----------------------------Class ToolTipHelper-------
_classes.registerClass("ToolTipHelper");
function ToolTipHelper(c){
	if(typeof ToolTipHelper._initialized == "undefined"){
		function prototypeFunction () {
			ToolTipHelper.prototype.isShowing = function(){
				return this.tipShowing;
			}
			ToolTipHelper.prototype.hide = function(){
				this.control.style.display = 'none';
				this.control.style.opacity = 0;
				this.tipShowing = false;
			}
			ToolTipHelper.prototype.show = function(){
				this.control.style.display = 'block';
				this.tipShowing = true;
				var helper = this;
				var step = ToolTipHelper.ANIMATION/10;
				var delta=step;
				
				var timer = setInterval(function(){
					if(delta < ToolTipHelper.ANIMATION){
						if(helper.directionY == PositionConstants.NORTH){
							helper.control.style.top = (helper.originTop - delta)+'px';
						}else{
							helper.control.style.top = (helper.originTop + delta)+'px';
						}
						delta += step;
						//����
						helper.control.style.opacity=(delta/ToolTipHelper.ANIMATION);
					}else{
						clearInterval(timer);
					}
				},50);
			}
			/**
			 * ����ToolTip
			 */
			ToolTipHelper.prototype.updateToolTip = function(figureUnderMouse,tip,x,y){
				if(figureUnderMouse == null){
					if(this.isShowing()){
						this.hide();
					}	
				}
				if(this.isShowing() && figureUnderMouse != this.currentTipSource){
					this.hide();
					//this.displayToolTipNear(figureUnderMouse, tip, x, y);
				}else if(!this.isShowing() && figureUnderMouse != this.currentTipSource){
					this.currentTipSource = null;
				}
			}
			/**
			 * ��ʾToolTip
			 */
			ToolTipHelper.prototype.displayToolTipNear = function(hoverSource,tip,x,y){
				if (tip != null && hoverSource != this.currentTipSource) {
					//���toolTipֻ��һ���ַ��������½�һ��Label
					if(typeof tip === 'string'){
						tip = new Label('toolTip',tip);
					}
					if(this.tip != null){
						this.panel.remove(this.tip);
					}
					if(this.control == null){
						this.createControl();
					}
					this.panel.add(tip,new Rectangle(0,0,-1,-1));
					var size = this.panel.getPreferredSize(-1,-1);
					//������ʾ���λ��
					if(x+size.width>parseInt(this.originCanvas.getWidth())){
						x = x - size.width+ToolTipBorder.WEIGHT/2;
						this.directionX = PositionConstants.EAST;
					}else{
						this.directionX = PositionConstants.WEST;
					}
					if(y+size.height>parseInt(this.originCanvas.getHeight())){
						y = y - size.height - ToolTipHelper.ANIMATION;
						this.directionY = PositionConstants.SOUTH;
					}else{
						this.directionY = PositionConstants.NORTH;
						y = (y+26+ToolTipHelper.SHADOW_Y+ToolTipHelper.ANIMATION);
					}
					//�������̫�������ʾ���С����ʾ��������⣬���ԶԹ�С��ʾ����е���
					if(size.width < ToolTipBorder.WEIGHT*4){
						size.width = ToolTipBorder.WEIGHT*4;
					}
					//����ToolTipBorder�ļ�ͷ����
					this.panel.getBorder().setDirection(this.directionX,this.directionY);
					this.panel.repaint();
					//��¼yֵ��������Ҫʹ��
					this.originTop = y;
					this.resizeToolTip(x,y,size.width,size.height);
					
					this.tip = tip;
					this.currentTipSource = hoverSource;
					this.show();
				}
			}
			ToolTipHelper.prototype.resizeToolTip = function(x,y,width,height){
				this.control.style.left = x+'px';
				this.control.style.top = y+'px';
				if(this.control.width != width || this.control.height != height){
					this.control.width = width;
					this.control.height = height;
				}
				//�˴�ֻ�������������²��ֵ��ػ�
				this.lightweightSystem.controlResized();
			}
			ToolTipHelper.prototype.createControl = function(){
					this.control = document.createElement('canvas');
					this.control.style.display = 'none';
					this.control.style.position = 'absolute';
					this.control.style.zIndex = 99;
					//��ʼ͸����Ϊ0
					this.control.style.opacity = 0;
					//this.control.style.boxShadow='10px 10px 25px #ccc';

					var canvas = new Canvas(this.control);
					//��ʼ��������ϵͳ
					this.lightweightSystem = new LightweightSystem(canvas);
					//Ϊ������ϵͳ��������
					this.panel = new Figure("panel");
					this.panel.setBorder(new ToolTipBorder());
					this.panel.setLayoutManager(new XYLayout());
					this.lightweightSystem.setContents(this.panel);
					this.originCanvas.getParent().appendChild(this.control);
			}
			ToolTipHelper.prototype.init = function(originCanvas){
				if(originCanvas == null){
					Debugger.error('no control for toopTipHelper');
				}else{
					this.originCanvas = originCanvas;
					
				}
			}
		}
		ToolTipHelper._initialized = true;
		_classes.defineClass("ToolTipHelper",prototypeFunction); 
	}

	this.init(c);
}
ToolTipHelper.SHADOW_X = 4;
ToolTipHelper.SHADOW_Y = 4;
ToolTipHelper.ANIMATION = 50;


_classes.registerClass("ToolTipBorder",'AbstractBackground');
function ToolTipBorder(color,fillColor){
	if(typeof ToolTipBorder._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ��ȡ�߿�
			 * @type Number
			 */
			ToolTipBorder.prototype.getWidth = function(){
				return 1;
			}
			/**
			 * ����������ɫ
			 * @param {Color} color ������ɫ
			 */
			ToolTipBorder.prototype.setColor = function(color){
				this.color  = color;
			}
			/**
			 * ��ȡ������ɫ
			 * @type Color
			 */
			ToolTipBorder.prototype.getColor = function(){
				return this.color;
			}
			/**
			 * ���������ɫ
			 * @param {Color} color �����ɫ
			 */
			ToolTipBorder.prototype.setFillColor = function(fillColor){
				this.fillColor  = fillColor;
			}
			/**
			 * ��ȡ�����ɫ
			 * @type Color
			 */
			ToolTipBorder.prototype.getFillColor = function(){
				return this.fillColor;
			}
			/**
			 * ���ü�ͷ�ķ���,directionX��ʾ��ͷ�ھ��εĶ���������directionY��ʾ��ͷ�ھ��ε��ϻ��Ǳ�
			 */
			ToolTipBorder.prototype.setDirection = function(directionX,directionY){
				this.directionX  = directionX;
				this.directionY = directionY;
			}
			ToolTipBorder.prototype.paintBackground = function(figure,graphics,insets){
				
				AbstractBorder.tempRect.setBounds(this.getPaintRectangle(figure, insets));
				if(this.getWidth() %2 == 1){
					AbstractBorder.tempRect.width--;
					AbstractBorder.tempRect.height--;
				}
				AbstractBorder.tempRect.shrink(this.getWidth() / 2, this.getWidth() / 2);
				var insets = this.getInsets();
				insets = new Insets(insets.top/2,insets.left/2,insets.bottom/2,insets.right/2);
				AbstractBorder.tempRect.crop(insets);

				var temp = AbstractBorder.tempRect;
				
				var x = temp.x,y=temp.y,width=temp.width,height=temp.height,horiRadius=4,vertRadius=4;
				//������Ӱ
				graphics.setShadowOffsetX(4);
				graphics.setShadowOffsetY(4);
				graphics.setShadowBlur(4);
				graphics.setShadowColor("rgba(0, 0, 0, 0.5)");
				//����ʼ����·��
				graphics.beginPath();
				graphics.moveTo(x+0.5,y+vertRadius);
				//���+���»�
				graphics.lineToEllipse(x+horiRadius+0.5,y+height-vertRadius,horiRadius,vertRadius-0.5,180,270,true);
				//�±�+���»�
				//�����ͷ���±�
				if(this.directionY == PositionConstants.SOUTH){
					if(this.directionX == PositionConstants.WEST){
					//���
						graphics.lineTo(x+horiRadius+ToolTipBorder.WEIGHT+insets.bottom,y+height);
						graphics.lineTo(x+horiRadius+ToolTipBorder.WEIGHT+(-insets.bottom/2),y+height+insets.bottom);
						graphics.lineTo(x+horiRadius+ToolTipBorder.WEIGHT,y+height);
					}else{
					//�ұ�
						graphics.lineTo(x+width-horiRadius-ToolTipBorder.WEIGHT-insets.bottom,y+height);
						graphics.lineTo(x+width-horiRadius-ToolTipBorder.WEIGHT-(-insets.bottom/2),y+height+insets.bottom);
						graphics.lineTo(x+width-horiRadius-ToolTipBorder.WEIGHT,y+height);
					}
				}
				graphics.lineToEllipse(x+width-horiRadius,y+height-vertRadius-0.5,horiRadius,vertRadius-0.5,270,360,true);
				//���+���ϻ�
				graphics.lineToEllipse(x+width-horiRadius,y+vertRadius,horiRadius,vertRadius,0,90,true);
				
				//�����ͷ���ϱ�
				if(this.directionY == PositionConstants.NORTH){
					if(this.directionX == PositionConstants.WEST){
					//���
						graphics.lineTo(x+horiRadius+ToolTipBorder.WEIGHT+insets.top,y);
						graphics.lineTo(x+horiRadius+ToolTipBorder.WEIGHT+(-insets.top/2),y-insets.top);
						graphics.lineTo(x+horiRadius+ToolTipBorder.WEIGHT,y);
					}else{
					//�ұ�
						graphics.lineTo(x+width-horiRadius-ToolTipBorder.WEIGHT-insets.top,y);
						graphics.lineTo(x+width-horiRadius-ToolTipBorder.WEIGHT-(-insets.top/2),y-insets.top);
						graphics.lineTo(x+width-horiRadius-ToolTipBorder.WEIGHT,y);
					}
				}
				//�ϱ߼Ӽ����ϻ�
				graphics.lineToEllipse(x+horiRadius+0.5,y+vertRadius,horiRadius,vertRadius,90,180,true);
				graphics.closePath();
				//��·����������
				//���
				if(this.getColor()!=null){
					graphics.setStrokeColor(this.getColor());
					graphics.stroke();
				}
				//���
				if(this.getFillColor()!=null){
					graphics.setFillColor(this.getFillColor());
					graphics.fill();
				}
				
				
			}
			ToolTipBorder.prototype.getInsets = function(){
				return new Insets(ToolTipBorder.WEIGHT,ToolTipBorder.WEIGHT,ToolTipBorder.WEIGHT,ToolTipBorder.WEIGHT);
			}
			ToolTipBorder.prototype.init = function(color,fillColor){
				if(color){
					this.color = color;
				}else{
					this.color = ToolTipBorder.BG_BORDER_COLOR;
				}
				if(fillColor){
					this.fillColor = fillColor;
				}else{
					this.fillColor = ToolTipBorder.BG_FILL_COLOR;
				}
			}
		}
		ToolTipBorder._initialized = true;
		_classes.defineClass("ToolTipBorder",prototypeFunction); 
	}
	this.init(color);
}
ToolTipBorder.WEIGHT = 20;
ToolTipBorder.MinWidth = 20;
ToolTipBorder.BG_BORDER_COLOR = Color.parse('#662266');
ToolTipBorder.BG_FILL_COLOR = new Color(255,200,0);/**
InputEvent
---MouseEvent
---KeyEvent
Cursor
*/
//-----------------------------Class InputEvent-------
_classes.registerClass("InputEvent");
function InputEvent(dispatcher,source,state){
		function prototypeFunction () {
			InputEvent.prototype.consume = function(){
				this.consumed = true;
			}
			InputEvent.prototype.getSource = function(){
				return this.source;
			}
			InputEvent.prototype.getState = function(){
				return this.state;
			}
			InputEvent.prototype.isConsumed = function(){
				return this.consumed;
			}
			InputEvent.prototype.init = function(dispatcher,source,state){
				this.parentMethod("init");
				this.source = source;
				this.state = state;
				this.consumed = false;
			}
		}
	_classes.defineClass("InputEvent",prototypeFunction); 
	this.init(dispatcher,source,state);
}
InputEvent.ALT = 1 << 16;
InputEvent.SHIFT = 1 << 17;
InputEvent.CTRL = 1 << 18;
InputEvent.BUTTON1 = 1 << 19;
InputEvent.BUTTON2 = 1 << 20;
InputEvent.BUTTON3 = 1 << 21;
InputEvent.BUTTON4 = 1 << 23;
InputEvent.BUTTON5 = 1 << 25;
InputEvent.BUTTON_MASK = InputEvent.BUTTON1 | InputEvent.BUTTON2 | InputEvent.BUTTON3 | InputEvent.BUTTON4 | InputEvent.BUTTON5;


//-----------------------------Class MouseEvent-------
_classes.registerClass("MouseEvent","InputEvent");
function MouseEvent(x,y,dispatcher,f,button,stateMask,me){
		function prototypeFunction () {
			MouseEvent.prototype.getLocation = function(){
				return new Point(this.x, this.y);
			}
			MouseEvent.prototype.init = function(x,y,dispatcher,f,button,stateMask,me){
				this.parentMethod("init",dispatcher, f, stateMask);
				var  pt = Point.SINGLETON;
				pt.setLocation(x, y);
				f.translateToRelative(pt);
				this.button = button;
				this.x = pt.x;
				this.y = pt.y;
				if (me) {
					this.e = me.e;
				}
			}
		}
	_classes.defineClass("MouseEvent",prototypeFunction); 
	this.init(x,y,dispatcher,f,button,stateMask,me);
}

//-----------------------------Class TouchEvent-------
_classes.registerClass("TouchEvent","InputEvent");
function TouchEvent(x,y,dispatcher,f,button,stateMask,me){
		function prototypeFunction () {
			MouseEvent.prototype.getLocation = function(){
				return new Point(this.x, this.y);
			}
			MouseEvent.prototype.init = function(x,y,dispatcher,f,button,stateMask,me){
				this.parentMethod("init",dispatcher, f, stateMask);
				var  pt = Point.SINGLETON;
				pt.setLocation(x, y);
				f.translateToRelative(pt);
				this.button = button;
				this.x = pt.x;
				this.y = pt.y;
				if (me) {
					this.e = me.e;
				}
			}
		}
	_classes.defineClass("TouchEvent",prototypeFunction); 
	this.init(x,y,dispatcher,f,button,stateMask,me);
}

//-----------------------------Class KeyEvent-------
_classes.registerClass("KeyEvent","InputEvent");
function KeyEvent(dispatcher,source,ke){
		function prototypeFunction () {
			KeyEvent.prototype.init = function(dispatcher,source,ke){
				this.parentMethod("init",dispatcher, source, ke.stateMask);
				//û��character
				this.character = ke.character;
				this.keyCode = ke.keyCode;
				this.e = ke.e;
			}
		}
	_classes.defineClass("KeyEvent",prototypeFunction); 
	this.init(dispatcher,source,ke);
}



//ChangeEvent
//-----------------------------Class ChangeEvent-------
_classes.registerClass("ChangeEvent");
function ChangeEvent(source,property){
		function prototypeFunction () {
			
			ChangeEvent.prototype.getSource = function(){
				return this.source;
			}
			ChangeEvent.prototype.getPropertyName = function(){
				return this.property;
			}
			ChangeEvent.prototype.setPropertyName = function(string){
				this.property = string;
			}
			ChangeEvent.prototype.init = function(source,property){
				this.parentMethod("init");
				this.source = source;
				this.property = property;
			}
		}
	_classes.defineClass("ChangeEvent",prototypeFunction); 
	this.init(source,property);
}

//ActionEvent
//-----------------------------Class ActionEvent-------
_classes.registerClass("ActionEvent");
function ActionEvent(source,actionName){
		function prototypeFunction () {
			
			ActionEvent.prototype.getSource = function(){
				return this.source;
			}
			ActionEvent.prototype.getActionName = function(){
				return this.actionName;
			}
			ActionEvent.prototype.init = function(source,actionName){
				this.parentMethod("init");
				this.source = source;
				this.actionName = actionName;
			}
		}
	_classes.defineClass("ActionEvent",prototypeFunction); 
	this.init(source,actionName);
}



//FocusEvent
//-----------------------------Class FocusEvent-------
_classes.registerClass("FocusEvent");
function FocusEvent(loser,gainer){
		function prototypeFunction () {
			FocusEvent.prototype.init = function(loser,gainer){
				this.loser = loser;
				this.gainer = gainer;
			}
		}
	_classes.defineClass("FocusEvent",prototypeFunction); 
	this.init(loser,gainer);
}
/**
 * @class �����ʽ
 */
Cursor = {};
/**
 * @static
 * @field
 */
Cursor.POINTER = "pointer";
/**
 * @static
 * @field
 */
Cursor.CROSS_HAIR = "crosshair";
/**
 * @static
 * @field
 */
Cursor.TEXT = "text";
/**
 * @static
 * @field
 */
Cursor.WAIT = "wait";
/**
 * @static
 * @field
 */
Cursor.DEFAULT = "default";
/**
 * @static
 * @field
 */
Cursor.HELP = "help";
/**
 * @static
 * @field
 */
Cursor.E_RESIZE = "e-resize";
/**
 * @static
 * @field
 */
Cursor.NE_RESIZE = "ne-resize";
/**
 * @static
 * @field
 */
Cursor.N_RESIZE = "n-resize";
/**
 * @static
 * @field
 */
Cursor.NW_RESIZE = "nw-resize";
/**
 * @static
 * @field
 */
Cursor.W_RESIZE = "w-resize";
/**
 * @static
 * @field
 */
Cursor.SW_RESIZE = "sw-resize";
/**
 * @static
 * @field
 */
Cursor.S_RESIZE = "s-resize";
/**
 * @static
 * @field
 */
Cursor.SE_RESIZE = "se-resize";
/**
 * @static
 * @field
 */
Cursor.AUTO = "auto";
/**
 * @static
 * @field
 */
Cursor.DISABLE = "no-drop";
/**
 * @static
 * @field
 */
Cursor.NO = "";
/**
 * @static
 * @field
 */
Cursor.MOVE = "move";
/**
 * @static
 * @field
 */
Cursor.PROGRESS = "progress";
/**
 * @static
 * @field
 */
Cursor.VERTICAL_TEXT = "vertical-text";
/**
 * @static
 * @field
 */
Cursor.COL_RESIZE = "col-resize";
/**
 * @static
 * @field
 */
Cursor.ROW_RESIZE = "row-resize";
/**
 * ���ݷ���õ������ʽ
 * @static
 * @param {int} direction ���� �ο�<a href="PositionConstants.html">PositionConstants</a>
 * @param {boolean} isMirrored �˲����ɺ���
 */
Cursor.getDirectionalCursor = function(direction, isMirrored){
	if (isMirrored && (direction & PositionConstants.EAST_WEST) != 0)
		direction = direction ^ PositionConstants.EAST_WEST; 
	switch (direction) {
		case PositionConstants.NORTH :
			return Cursor.N_RESIZE;
		case PositionConstants.SOUTH:
			return Cursor.S_RESIZE;
		case PositionConstants.EAST :
			return Cursor.E_RESIZE;
		case PositionConstants.WEST:
			return Cursor.W_RESIZE;
		case PositionConstants.SOUTH_EAST:
			return Cursor.SE_RESIZE;
		case PositionConstants.SOUTH_WEST:
			return Cursor.SW_RESIZE;
		case PositionConstants.NORTH_EAST:
			return Cursor.NE_RESIZE;
		case PositionConstants.NORTH_WEST:
			return Cursor.NW_RESIZE;
		default:
		 	break;
	}
	return null;
}/*
 * $Id: ImageResourceManager.js,v 1.0 2013/03/30 14:42:26$
 * 
 */
/* ***** BEGIN LICENSE BLOCK *****
 *	Contributor(s): jiangqifan@jiuqi.com.cn
 ***** END LICENSE BLOCK ***** */
 
/* ***** BEGIN GUIDE BLOCK *****
 * use 
 * var img = ImageResourceManager.getImage(url);
 * to get the iamge which you want.
 * use 
 * img.addLoadListener(figure[,figure[,figure...]]);
 * to blind your figure on the image.
 * when the image loaded, it will call figure.pictureLoaded(),
 * so please do want you want if pictureLoaded(), such 
 * as repaint your figure.
 ***** END GUIDE BLOCK ***** */
/**
 * @class ImageResourceManager
 * 
 */
var ImageResourceManager = (function() {

	var manager = {'imgs': {}}; // the manager instance
	
	function addLoadListener(listener) {
		if (this.loaded) {
			return;
		}
		var i = 0; 			  // loop counter
		if (this.loadListeners == null) {
			this.loadListeners = [];
		}
		for (i = 0; i<arguments.length; i++) {
			if(arguments[i] != null) {
				if(!Util.Array.contains(this.loadListeners, arguments[i])) {
					this.loadListeners.push(arguments[i]);
				}
			}
		}
	}
	function removeLoadListener(listener) {
		if (this.loadListeners != null) {
			Util.Array.removeItem(this.loadListeners, listener);
		}
	}
	function addImage(url) {
		var img = new Image();
		img.src = url;
		manager.imgs[url] = img;
		img.loadListeners = [];
		img.loaded = false;
		img.onload = function () {
			img.loaded = true;
			var listener; // the listener for this iamge
			var i = 0;    // loop counter
			for (; i < img.loadListeners.length;i++) {
				listener = img.loadListeners[i];
				if(typeof listener.pictureLoaded == 'function'){
					listener.pictureLoaded();
				}
				//img.loadListeners[i] = null;
			}
			//img.loadListeners = [];
		}
		
		img.addLoadListener = addLoadListener;
		img.removeLoadListener = removeLoadListener;
//		img.removeLoadListeners = function() {
//			for (; i < img.loadListeners.length;i++) {
//				delete img.loadListeners[i];
//			}
//			img.loadListeners = null;
//		}
		return img;
	}
	manager.getImage = function (url) {
		return this.imgs[url] || addImage(url);
	}
	//@Deprecated
	manager.addListener4Img = function (url) {
		var img = manager.imgs[url];		//the iamge of the given url keep by manager 
		var i;								// loop counter
		if (img != null){
			if (!img.loadListeners) {
				return;
			}
			for (i = 1; i<arguments.length; i++) {
				if(arguments[i] != null){
					img.loadListeners.push(arguments[i]);
				}
			}
		}
	}
	return manager;
})();

/*
ImageResourceManager.imgs = [];
ImageResourceManager.addImage = function(url){
	var img = new Image();
	img.src = url;
	ImageResourceManager.imgs[url] = img;
	img.loadListeners = [];
	img.onload = function(){
		var  listener;
		for(var i = 0 ; i < img.loadListeners.length;i++){
			listener = img.loadListeners[i];
			if(listener.pictureLoaded != null){
				listener.pictureLoaded();
			}
		}
	}
	img.addLoadListener = addLoadListener;
}
ImageResourceManager.contains = function(url){
	if(ImageResourceManager.imgs[url] != null){
		return true;
	}
	return false;
}
*/
/**
 * ΪͼƬ��Ӽ�����
 * @static
 * @param {String} url ͼƬURL
 * @param {Object} listener ������ͼƬ�ļ�����,���Զ��
 * @Deprecated
 */
 /*
ImageResourceManager.addListener4Img = function(url){
	var img = ImageResourceManager.imgs[url];
	if(img != null){
		for(var i = 1;i<arguments.length;i++){
			if(arguments[i] != null){
				img.loadListeners.push(arguments[i]);
			}
		}
		
	}
}
*/
/**
 * ��ȡͼƬ
 * @static
 * @param {String} url ͼƬ��URL
 */
 /*
ImageResourceManager.getImage = function(url){
	var img = ImageResourceManager.imgs[url];
	if(img == null){
		ImageResourceManager.addImage(url);
	}
	img = ImageResourceManager.imgs[url];
	return img;
}
*/
/**
 * ΪͼƬ��Ӽ�����
 * @static
 * @param {String} url ͼƬURL
 * @param {Object} listener ������ͼƬ�ļ�����
 * @Deprecated
 */
 /*
ImageResourceManager.removeListener4Img = function(url,listener){
	var img = ImageResourceManager.imgs[url];
	if(img != null){
		img.loadListeners.remove(listener);
	}
}
*//**
DefaultRangeModel
Viewport
---FreeformViewport
*/
//-----------------------------Class DefaultRangeModel-------
_classes.registerClass("DefaultRangeModel");
function DefaultRangeModel(){
	if(typeof DefaultRangeModel._initialized == "undefined"){
		function prototypeFunction () {
			DefaultRangeModel.prototype.addPropertyChangeListener = function(listener){
				this.propertyListeners.addPropertyChangeListener(listener);
			}
			DefaultRangeModel.prototype.firePropertyChange = function(string,oldValue,newValue){
				this.propertyListeners.firePropertyChange(string, oldValue, newValue);
			}
			DefaultRangeModel.prototype.getExtent = function(){
				return this.extent;
			}
			DefaultRangeModel.prototype.getMaximum = function(){
				return this.maximum;
			}
			DefaultRangeModel.prototype.getMinimum = function(){
				return this.minimum;
			}
			DefaultRangeModel.prototype.getValue = function(){
				return this.value;
			}
			DefaultRangeModel.prototype.isEnabled = function(){
				return (this.getMaximum() - this.getMinimum()) > this.getExtent();
			}
			DefaultRangeModel.prototype.removePropertyChangeListener = function(listener){
				this.propertyListeners.removePropertyChangeListener(listener);
			}
			DefaultRangeModel.prototype.setAll = function(min,ext,max){
				var oldMin = this.minimum;
				var oldExtent = this.extent;
				var oldMax = this.maximum;
				
				this.maximum = max;
				this.minimum = min;
				this.extent = ext;
				
				if (oldMax != max){
					this.firePropertyChange(DefaultRangeModel.PROPERTY_MAXIMUM, oldMax, max);
				}
				if (oldExtent != ext){
					this.firePropertyChange(DefaultRangeModel.PROPERTY_EXTENT, oldExtent, ext);
				}
				if (oldMin != min){
					this.firePropertyChange(DefaultRangeModel.PROPERTY_MINIMUM, oldMin, min);
				}
				this.setValue(this.getValue());
			}
			DefaultRangeModel.prototype.setExtent = function(extent){
				if (this.extent == extent){
					return;
				}
				var oldValue = this.extent;
				this.extent = extent;
				this.firePropertyChange(DefaultRangeModel.PROPERTY_EXTENT, oldValue, extent);
				this.setValue(this.getValue());
			}
			DefaultRangeModel.prototype.setMaximum = function(maximum){
				if (this.maximum == maximum){
					return;
				}
				var oldValue = this.maximum;
				this.maximum = maximum;
				this.firePropertyChange(DefaultRangeModel.PROPERTY_MAXIMUM, oldValue, maximum);
				this.setValue(this.getValue());
			}
			DefaultRangeModel.prototype.setMinimum = function(minimum){
				if (this.minimum == minimum){
					return;
				}
				var oldValue = this.minimum;
				this.minimum = minimum;
				this.firePropertyChange(DefaultRangeModel.PROPERTY_MINIMUM, oldValue, minimum);
				this.setValue(this.getValue());
			}
			DefaultRangeModel.prototype.setValue = function(value){
				value = Math.max(this.getMinimum(), Math.min(this.getMaximum() - this.getExtent(), value));
				if (this.value == value){
					return;
				}
				var oldValue = this.value;
				this.value = value;
				this.firePropertyChange(DefaultRangeModel.PROPERTY_VALUE, oldValue, value);
			}
			DefaultRangeModel.prototype.init = function(){
				this.parentMethod("init");
				this.minimum = 0;
				this.maximum = 100;
				this.extent =  20;
				this.value = 0;
				this.propertyListeners = new PropertyChangeSupport(this);
			}
		}
		DefaultRangeModel._initialized = true;
		_classes.defineClass("DefaultRangeModel",prototypeFunction); 
	}

	this.init();
}
 DefaultRangeModel.PROPERTY_VALUE = "value";
 DefaultRangeModel.PROPERTY_EXTENT = "extent";
 DefaultRangeModel.PROPERTY_MINIMUM = "minimum";
 DefaultRangeModel.PROPERTY_MAXIMUM = "maximum";
//-----------------------------Class Viewport-------
_classes.registerClass("Viewport","Figure");
/**
 * 
 * @class �ӿ���
 * @constructor
 * @extends Figure
 * @param {String} id ͼ��id
 * @param {boolean} setting 
 * @returns
 */
function Viewport(id,setting){
	if(typeof Viewport._initialized == "undefined"){
		function prototypeFunction () {
			Viewport.prototype.getClientArea = function(rect){
				this.isa = "Viewport";
				rect = this.parentMethod("getClientArea",rect);
				if (this.useGraphicsTranslate()){
					rect.translate(this.getViewLocation());
				}
				return rect;
			}
			/**
			 * �õ�����
			 * @type Figure
			 */
			Viewport.prototype.getContents = function(){
				return this.view;
			}
			/**
			 * �õ�����ķ�Χģ��
			 */
			Viewport.prototype.getHorizontalRangeModel = function(){
				return this.horiztonalRangeModel;
			}
			/**
			 * �õ�����ķ�Χģ��
			 */
			Viewport.prototype.getContentsTracksHeight = function(){
				return this.trackHeight;
			}
			/**
			 * 
			 */
			Viewport.prototype.getContentsTracksWidth = function(){
				return this.trackWidth;
			}
			/**
			 * �õ�����ķ�Χģ��
			 */
			Viewport.prototype.getVerticalRangeModel = function(){
				return this.verticalRangeModel;
			}
			/**
			 * �õ���ǰ�ɼ��ķ�Χ
			 * @type Rectangle
			 */
			Viewport.prototype.getViewableRect = function(){
				var bounds = this.getBounds();
				var location = this.getViewLocation();
				return new Rectangle(location.x, location.y,bounds.width, bounds.height);
			}
			/**
			 * �õ���ǰ�ɼ���λ�þ����ӿ����Ͻ�������������ݵ�λ��
			 */
			Viewport.prototype.getViewLocation = function(){
				return new Point(this.getHorizontalRangeModel().getValue(),this.getVerticalRangeModel().getValue());
			}
			Viewport.prototype.localRevalidate = function(){
				this.invalidate();
				if (this.getLayoutManager() != null){
					this.getLayoutManager().invalidate();
				}
				this.getUpdateManager().addInvalidFigure(this);
			}
			Viewport.prototype.paintClientArea = function(g){
				this.isa = "Viewport";
				if (this.useGraphicsTranslate()) {
					var p = this.getViewLocation();
					g.translate(-p.x, -p.y);
					g.pushState();
					this.parentMethod("paintClientArea",g);
					g.restoreState();
					g.translate(p.x, p.y);
				}else{
					this.parentMethod("paintClientArea",g);
				}
			}
			Viewport.prototype.isCoordinateSystem = function(){
				this.isa = "Viewport";
				return this.useGraphicsTranslate() || this.parentMethod("isCoordinateSystem");
			}
			/**
			 * ���Ըı�
			 */
			Viewport.prototype.propertyChange = function(event){
				var source = event.getSource();
				if(source != null && Util.isInstanceOf(source, DefaultRangeModel)){
					if (DefaultRangeModel.PROPERTY_VALUE == (event.getPropertyName())) {
						if (!this.ignoreScroll) {
							this.localRevalidate();
							if (this.useGraphicsTranslate()) {
								this.repaint();
								this.fireMoved(); 
							}
						}
						this.firePropertyChange(Viewport.PROPERTY_VIEW_LOCATION, event.getOldValue(), event.getNewValue());
					}else if(DefaultRangeModel.PROPERTY_MAXIMUM  == (event.getPropertyName())){
						this.firePropertyChange(Viewport.PROPERTY_CONTENT_SIZE, event.getOldValue(), event.getNewValue());
					}
				}
			}
			Viewport.prototype.readjustScrollBars = function(){
				if (this.getContents() == null){
					return;
				}
				this.getVerticalRangeModel().setAll(0, this.getClientArea(new Rectangle()).height, this.getContents().getBounds().height);
				this.getHorizontalRangeModel().setAll(0, this.getClientArea(new Rectangle()).width, this.getContents().getBounds().width);
			}
			/**
			 * ��������
			 * @param {Figure} figure
			 */
			Viewport.prototype.setContents = function(figure){
				if (this.view == figure){
					return;
				}
				if (this.view != null){
					this.remove(view);
				}
				this.view = figure;
				if (this.view != null){
					this.add(figure);
				}
			}
			/**
			 * 
			 */
			Viewport.prototype.setContentsTracksHeight = function(track){
				this.trackHeight = track;
			}
			/**
			 * 
			 */
			Viewport.prototype.setContentsTracksWidth = function(track){
				this.trackWidth = track;
			}
			/**
			 * ���ú���λ��
			 */
			Viewport.prototype.setHorizontalLocation = function(value){
				this.setViewLocation(value, this.getVerticalRangeModel().getValue());
			}
			/**
			 * ���ú���Χģ��
			 */
			Viewport.prototype.setHorizontalRangeModel = function(rangeModel){
				if (this.horiztonalRangeModel != null){
					this.horiztonalRangeModel.removePropertyChangeListener(this);
				}
				this.horiztonalRangeModel = rangeModel;
				this.horiztonalRangeModel.addPropertyChangeListener(this);
			}
			/**
			 * ���ú��Թ���
			 */
			Viewport.prototype.setIgnoreScroll = function(value){
				this.ignoreScroll = value;
			}
			/**
			 * ��������λ��
			 */
			Viewport.prototype.setVerticalLocation = function(value){
				this.setViewLocation(this.getHorizontalRangeModel().getValue(), value);
			}
			/**
			 * ��������Χģ��
			 */
			Viewport.prototype.setVerticalRangeModel = function(rangeModel){
				if (this.verticalRangeModel != null){
					this.verticalRangeModel.removePropertyChangeListener(this);
				}
				this.verticalRangeModel = rangeModel;
				this.verticalRangeModel.addPropertyChangeListener(this);
			}
			/**
			 * ���ÿɼ�λ��
			 * setViewLocation(point);setViewLocation(x,y);
			 */
			Viewport.prototype.setViewLocation = function(arg1,arg2){
				if(arg1 == null){
					return;
				}
				var x;
				var y;
				if(Util.isInstanceOf(arg1, Point)){
					x = arg1.x;
					y = arg1.y;
				}else if(arg2 != null){
					x = arg1;
					y = arg2;
				}
				if (this.getHorizontalRangeModel().getValue() != x){
					this.getHorizontalRangeModel().setValue(x);
				}
				if (this.getVerticalRangeModel().getValue() != y){
					this.getVerticalRangeModel().setValue(y);
				}
			}
			Viewport.prototype.translateFromParent = function(t){
				if (this.useTranslate){
					t.performTranslate(this.getHorizontalRangeModel().getValue(),this.getVerticalRangeModel().getValue());
				}
				this.isa = "Viewport";
				this.parentMethod("translateFromParent",t);
			}
			Viewport.prototype.translateToParent = function(t){
				if (this.useTranslate){
					t.performTranslate(-this.getHorizontalRangeModel().getValue(),-this.getVerticalRangeModel().getValue());
				}
				this.isa = "Viewport";
				this.parentMethod("translateToParent",t);
			}
			/**
			 * 
			 */
			Viewport.prototype.useGraphicsTranslate = function(){
				return this.useTranslate;
			}
			Viewport.prototype.validate = function(){
				this.isa = "Viewport";
				this.parentMethod("validate");
				this.readjustScrollBars();
			}
			Viewport.prototype.init = function(id,setting){
				this.parentMethod("init",id);
				this.view = null;
				this.useTranslate = false;
				this.trackWidth = false;
				this.trackHeight = false;
				this.ignoreScroll = false;
				this.horiztonalRangeModel = null;
				this.verticalRangeModel = null;
				this.setLayoutManager(new ViewportLayout());
				this.setHorizontalRangeModel(new DefaultRangeModel());
				this.setVerticalRangeModel(new DefaultRangeModel());
				this.useTranslate = setting;
			}
		}
		Viewport._initialized = true;
		_classes.defineClass("Viewport",prototypeFunction); 
	}

	this.init(id,setting);
}
Viewport.PROPERTY_VIEW_LOCATION = "viewLocation";
Viewport.PROPERTY_CONTENT_SIZE = "contentSize"





//-----------------------------Class FreeformViewport-------
_classes.registerClass("FreeformViewport","Viewport");
/**
 * 
 * @class �����ӿ�
 * @constructor
 * @extends Viewport
 */
function FreeformViewport(id){
	if(typeof FreeformViewport._initialized == "undefined"){
		function prototypeFunction () {
			FreeformViewport.prototype.readjustScrollBars = function(){
				if (this.getContents() == null){
					return;
				}
				if (!(this.getContents().getFreeformExtent != null)){
					return;
				}
				var ff = this.getContents();
				var clientArea = this.getClientArea();
				var bounds = ff.getFreeformExtent().getCopy();
				bounds.union(0, 0, clientArea.width, clientArea.height);
				ff.setFreeformBounds(bounds);
				
				this.getVerticalRangeModel().setAll(bounds.y, clientArea.height, bounds.bottom());
				this.getHorizontalRangeModel().setAll(bounds.x, clientArea.width, bounds.right());
			}
			FreeformViewport.prototype.useLocalCoordinates = function(){
				return true;
			}
			FreeformViewport.prototype.init = function(id){
				this.parentMethod("init",id,true);
				this.setLayoutManager(new FreeformViewportLayout());
			}
		}
		FreeformViewport._initialized = true;
		_classes.defineClass("FreeformViewport",prototypeFunction); 
	}

	this.init(id);
}//Clickable
//----------------------------------Class Clickable---------------------
 _classes.registerClass("Clickable","Figure");
 /**
  * @class �ɵ����ͼ��
  * @constructor
  * @extends Figure
  * @param id
  * @param contents
  * @param style
  * @returns
  */
 function Clickable(id,contents,style){
	if(typeof Clickable._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ���ӵ��������
			 */
			Clickable.prototype.addActionListener = function(listener){
				this.addListener("ActionListener", listener);
			}
			/**
			 * ���Ӹı������
			 */
			Clickable.prototype.addChangeListener = function(listener){
				this.addListener("ChangeListener", listener);
			}
			Clickable.prototype.createDefaultModel = function(){
				if (this.isStyle(Clickable.STYLE_TOGGLE)){
					return new ToggleModel();
				}else{
					return new ButtonModel();
				}
			}
			Clickable.prototype.createEventHandler = function(){
				return new ClickableEventHandler();
			}
			Clickable.prototype.createModelObserver = function(){
				var modelObserver = new Object();
				var host = this;
				modelObserver.actionPerformed = function(action){
					host.fireActionPerformed();
				}
				modelObserver.handleStateChanged = function(change){
					host.fireStateChanged(change);
				}
				return modelObserver;
			}
			/**
			 * ִ�е��
			 */
			Clickable.prototype.doClick = function(){
				this.fireActionPerformed();
			}
			Clickable.prototype.fireActionPerformed = function(){
				var action = new ActionEvent(this);
				var listeners = this.getListeners("ActionListener");
				while (listeners.hasNext()){
					listeners.next().actionPerformed(action); 
				}
			}
			Clickable.prototype.fireStateChanged = function(modelChange){
				var change = new ChangeEvent(this, modelChange.getPropertyName());
				var listeners = this.getListeners("ChangeListener");
				while (listeners.hasNext()){
					listeners.next().handleStateChanged(change);
				}
			}
			/**
			 * ��ȡģ��
			 * @type ButtonModel
			 */
			Clickable.prototype.getModel = function(){
				return this.model;
			}
			Clickable.prototype.hookEventHandler = function(handler){
				if (handler == null)  return;
				this.addMouseListener(handler);
				this.addMouseMotionListener(handler);
				this.addChangeListener(handler);
				this.addKeyListener(handler);
				this.addFocusListener(handler);
			}
			/**
			 * �Ƿ�ɷ�ת
			 * @type boolean
			 */
			Clickable.prototype.isRolloverEnabled = function(){
				return (this.flags & Clickable.ROLLOVER_ENABLED_FLAG) != 0;
			}
			/**
			 * �Ƿ���ѡ��
			 * @type boolean
			 */
			Clickable.prototype.isSelected = function(){
				return this.getModel().isSelected();
			}
			/**
			 * �жϿؼ��Ƿ�Ϊĳ�ַ��
			 * @param {int} style
			 * @type boolean
			 */
			Clickable.prototype.isStyle = function(style){
				return ((style & this.flags) == style);
			}
			Clickable.prototype.paintBorder = function(graphics){
				this.isa = "Clickable";
				this.parentMethod("paintBorder",graphics);
				if (this.hasFocus()) {
					graphics.setStrokeColor(ColorConstants.black);
					//graphics.setBackgroundColor(ColorConstants.white);
					
					var area = this.getClientArea();
					if (this.isStyle(Clickable.STYLE_BUTTON)){
						graphics.drawFocus(area.x, area.y, area.width, area.height);
					}else{
						graphics.drawFocus(area.x, area.y, area.width - 1, area.height - 1);
					}
				}
			}
			Clickable.prototype.paintClientArea = function(graphics){
				if (this.isStyle(Clickable.STYLE_BUTTON) && (this.getModel().isArmed() || this.getModel().isSelected())) {
					graphics.translate(1, 1);
					graphics.pushState();
					this.isa = "Clickable";
					this.parentMethod("paintClientArea",graphics);
					graphics.restoreState();
					graphics.translate(-1, -1);
				}else{
					this.isa = "Clickable";
					this.parentMethod("paintClientArea",graphics);
				}
			}
			/**
			 * �Ƴ����������
			 */
			Clickable.prototype.removeActionListener = function(listener){
				this.removeListener("ActionListener", listener);
			}
			/**
			 * �Ƴ��ı������
			 */
			Clickable.prototype.removeChangeListener = function(listener){
				this.removeListener("ChangeListener", listener);
			}
			/**
			 * ������ʾ����
			 * @param {Figure} contents ��ʾ����
			 */
			Clickable.prototype.setContents = function(contents){
				this.setLayoutManager(new StackLayout());
				if (this.getChildren().length > 0){
					this.remove(this.getChildren()[0]);
				}
				this.add(contents);
			}
			/**
			 * @see Figure#setEnabled
			 */
			Clickable.prototype.setEnabled = function(value){
				if (this.isEnabled() == value) return;
				this.isa = "Clickable";
				this.parentMethod("setEnabled",value);
				this.getModel().setEnabled(value);
				this.setChildrenEnabled(value);
			}
			/**
			 * �����¼�������
			 * @param {Object} h �µ��¼�������
			 */
			Clickable.prototype.setEventHandler = function(h){
				if (this.eventHandler != null) {
					this.unhookEventHandler(this.eventHandler);
				}
				this.eventHandler = h;
				if (this.eventHandler != null) {
					this.hookEventHandler(this.eventHandler);
				}
			}
			/**
			 * 
			 */
			Clickable.prototype.setFiringMethod = function(type){
				this.getModel().setFiringBehavior(type);
			}
			/**
			 * ����ģ��
			 */
			Clickable.prototype.setModel = function(model){
				if (this.model != null) {
					this.model.removeChangeListener(this.modelObserver);
					this.model.removeActionListener(this.modelObserver);
					this.modelObserver = null;
				}
				this.model = model;
				if (model != null) {
					this.modelObserver = this.createModelObserver();
					model.addActionListener(this.modelObserver);
					model.addChangeListener(this.modelObserver);
				}
			}
			/**
			 * ���ÿɷ�ת
			 * @param {boolean} value
			 */
			Clickable.prototype.setRolloverEnabled = function(value){
				if (this.isRolloverEnabled() == value) return;
				this.setFlag(Clickable.ROLLOVER_ENABLED_FLAG, value);
				this.repaint();
			}
			/**
			 * �����Ƿ�ѡ��
			 * @param {boolean} value
			 */
			Clickable.prototype.setSelected = function(value){
				this.getModel().setSelected(value);
			}
			/**
			 * ���÷��
			 * @param {int} style �µķ��
			 */
			Clickable.prototype.setStyle = function(style){
				if ((style & Clickable.STYLE_BUTTON) != 0) {
					this.setFlag(Clickable.STYLE_BUTTON_FLAG, true);
					if (!(this.getBorder()!=null && Util.isInstanceOf(this.getBorder(), ButtonBorder))){
						this.setBorder(new ButtonBorder());
					}
					this.setOpaque(true);
				}else{
					this.setFlag(Clickable.STYLE_BUTTON_FLAG, false);
					this.setOpaque(false);
				}
				
				if ((style & Clickable.STYLE_TOGGLE) != 0) {
					this.setFlag(Clickable.STYLE_TOGGLE_FLAG, true);
					this.setModel(this.createDefaultModel());
				}
			}
			Clickable.prototype.unhookEventHandler = function(handler){
				if (handler == null)  return;
				this.removeMouseListener(handler);
				this.removeMouseMotionListener(handler);
				this.removeChangeListener(handler);
			}
			Clickable.prototype.initialize = function(){
				this.setModel(this.createDefaultModel());
				this.setEventHandler(this.createEventHandler());
			}
			Clickable.prototype.init = function(id,contents,style){
				this.isa = "Clickable";
				this.parentMethod("init",id);
				this.ClickableEventHandler = null;
				this.model = null;
				this.modelObserver = null;
				
				this.initialize();
				
				this.setRequestFocusEnabled(true);
				this.setFocusTraversable(true);
				if(contents != null){
					this.setContents(contents);
					if(style == null){
						style = 0;
					}
					this.setStyle(style);
				}
			}
		}
		Clickable._initialized = true;
		_classes.defineClass("Clickable",prototypeFunction); 
	}
	this.init(id,contents,style);
 }
Clickable.ROLLOVER_ENABLED_FLAG = Figure.MAX_FLAG << 1;
Clickable.STYLE_BUTTON_FLAG = Figure.MAX_FLAG << 2;
Clickable.STYLE_TOGGLE_FLAG = Figure.MAX_FLAG << 3;
Clickable.MAX_FLAG = Clickable.STYLE_TOGGLE_FLAG;
/**
 * @static
 * @field
 */
Clickable.STYLE_BUTTON = Clickable.STYLE_BUTTON_FLAG;
/**
 * @static
 * @field
 */
Clickable.STYLE_TOGGLE = Clickable.STYLE_TOGGLE_FLAG;
/**
 * @static
 * @field
 */
Clickable.DEFAULT_FIRING = 0;
/**
 * @static
 * @field
 */
Clickable.REPEAT_FIRING = 1;





//-----------------------------Class ClickableEventHandler-------
_classes.registerClass("ClickableEventHandler");
/**
 * @class �ɵ����ͼ�ε��¼�������
 * @constructor
 */
function ClickableEventHandler(){
		function prototypeFunction () {
			/**
			 * ʧȥ����
			 */
			ClickableEventHandler.prototype.focusLost = function(fe){
				var loser = fe.loser;
				loser.repaint();
				loser.getModel().setArmed(false);
				loser.getModel().setPressed(false);
			}
			/**
			 * �õ�����
			 */
			ClickableEventHandler.prototype.focusGained = function(fe){
				var clickable = fe.gainer;
				clickable.repaint();
			}
			/**
			 * ͼ���ƶ�
			 */
			ClickableEventHandler.prototype.figureMoved = function(source){
				if (this.lastEvent == null){
					return;
				}
				this.mouseDragged(this.lastEvent);
			}
			/**
			 * ����״̬�ı�
			 */
			ClickableEventHandler.prototype.handleStateChanged = function(change){
				var clickable = change.getSource();
				if (change.getPropertyName() == ButtonModel.MOUSEOVER_PROPERTY&& !clickable.isRolloverEnabled()){
					return;
				}
				clickable.repaint();
			}
			/**
			 * ����϶�
			 */
			ClickableEventHandler.prototype.mouseDragged = function(me){
				this.lastEvent = me;
				var click = me.getSource();
				var model = click.getModel();
				if (model.isPressed()) {
					var over = click.containsPoint(me.getLocation());
					model.setArmed(over);
					model.setMouseOver(over);
				}
			}
			/**
			 * ������
			 */
			ClickableEventHandler.prototype.mouseEntered = function(me){
				var click = me.getSource();
				click.getModel().setMouseOver(true);
				click.addFigureListener(this);
			}
			/**
			 * ����˳�
			 */
			ClickableEventHandler.prototype.mouseExited = function(me){
				var click = me.getSource();
				click.getModel().setMouseOver(false);
				click.removeFigureListener(this);
			}
			/**
			 * ����ƶ�
			 */
			ClickableEventHandler.prototype.mouseMoved = function(me){
				
			}
			/**
			 * ��갴��
			 */
			ClickableEventHandler.prototype.mousePressed = function(me){
				if (me.button != 1) return;
				this.lastEvent = me;
				var click = me.getSource();
				var model = click.getModel();
				click.requestFocus();
				model.setArmed(true);
				model.setPressed(true);
				me.consume();
				
			}
			/**
			 * ����ɿ�
			 */
			ClickableEventHandler.prototype.mouseReleased = function(me){
				if (me.button != 1) return;
				var model = me.getSource().getModel();
				if (!model.isPressed()) return;
				model.setPressed(false);
				model.setArmed(false);
				me.consume();
			}
			/**
			 * ���̰���
			 */
			ClickableEventHandler.prototype.keyPressed = function(ke){
				var model = ke.getSource().getModel();
				//���»س�
				if (ke.keyCode == 13) {
					model.setPressed(true);
					model.setArmed(true);
				}
			}
			/**
			 * �����ɿ�
			 */
			ClickableEventHandler.prototype.keyReleased = function(ke){
				var model = ke.getSource().getModel();
				//���»س�
				if (ke.keyCode == 13) {
					model.setPressed(false);
					model.setArmed(false);
				}
			}
			ClickableEventHandler.prototype.init = function(){
				this.parentMethod("init");
				this.lastEvent = null;
			}
		}
	_classes.defineClass("ClickableEventHandler",prototypeFunction); 
	this.init();
}//Button
//-----------------------------Class Button-------
_classes.registerClass("Button","Clickable");
/**
 * @class ��ť
 * @constructor
 * @extends Clickable
 * @param {String} id ͼ��id 
 * @param {String} arg1 �ı�
 * @param {Image} arg2 ͼ��
 * @returns
 */
function Button(id,arg1,arg2){
		function prototypeFunction () {
			
			Button.prototype.initialize = function(string){
				this.isa = "Button";
				this.parentMethod("initialize");
				this.setBackgroundColor(ColorConstants.button);
			}
			Button.prototype.init = function(id,arg1,arg2){
				//this.parentMethod("init",id);
				if(arg1==null){
					this.isa = "Button";
					this.parentMethod("init",id);
					this.setStyle(Clickable.STYLE_BUTTON);
				}else{
					this.isa = "Button";
					this.parentMethod("init",id,new Label(id+"-label",arg1,arg2), Clickable.STYLE_BUTTON);
				}
				
			}
		}
	_classes.defineClass("Button",prototypeFunction); 
	this.init(id,arg1,arg2);
}


//ArrowButton
//-----------------------------Class ArrowButton-------
_classes.registerClass("ArrowButton","Button");
/**
 * @class ��ʾ��ͷ�İ�ť
 * @constructor
 * @extends Button
 * @param {String} id ͼ��id
 * @param {int} direction ��ͷ���� <a href="PositionConstants.html">PositionConstants.html</a>
 * @returns
 */
function ArrowButton(id,direction){
		function prototypeFunction () {
			
			ArrowButton.prototype.createTriangle = function(){
				var tri = new Triangle(this.id+"-triangle");
				tri.setOutline(true);
				//tri.setFill(false);
				tri.setFillColor(ColorConstants.listForeground);
				tri.setOutlineColor(ColorConstants.listForeground);
				//tri.setBackgroundColor(ColorConstants.listForeground);
				//tri.setForegroundColor(ColorConstants.listForeground);
				tri.setBorder(new MarginBorder(new Insets(2)));
				this.setContents(tri);
			}
			ArrowButton.prototype.setDirection = function(value){
				this.setChildrenDirection(value);
			}
			ArrowButton.prototype.setOrientation = function(value){
				this.setChildrenOrientation(value);
			}
			ArrowButton.prototype.init = function(id,direction){
				this.parentMethod("init",id);
				this.createTriangle();
				this.setRequestFocusEnabled(false);
				this.setFocusTraversable(false);
				this.setDirection(direction);
			}
		}
	_classes.defineClass("ArrowButton",prototypeFunction); 
	this.init(id,direction);
}


//Toggle
//-----------------------------Class Toggle-------
_classes.registerClass("Toggle","Clickable");
/**
 * @class ���л�״̬�Ŀؼ�
 * @constructor
 * @extends Toggle
 * @param {String} id ͼ��id
 * Toggle(id); Toggle(id,text,icon);Toggle(id,content);Toggle(id,contet,style);
 * @returns
 */
function Toggle(id,arg1,arg2){
		function prototypeFunction () {
			Toggle.prototype.init = function(id,arg1,arg2){
				if(arg1 == null){
					this.isa = "Toggle";
					this.parentMethod("init",id);
					this.setStyle(Clickable.STYLE_TOGGLE);
				}else{
					if(typeof arg1 == 'string' || arg1 instanceof String){
						this.isa = "Toggle";
						this.parentMethod("init",id,new Label(id+'label',arg1,arg2),Clickable.STYLE_TOGGLE);
					}else if(Util.isInstanceOf(arg1, Figure)){
						this.isa = "Toggle";
						this.parentMethod("init",id,arg1,arg2==null?Clickable.STYLE_TOGGLE:arg2);
					}
				}
			}
		}
	_classes.defineClass("Toggle",prototypeFunction); 
	this.init(id,arg1,arg2);
}

//ToggleButton
//-----------------------------Class ToggleButton-------
_classes.registerClass("ToggleButton","Clickable");
/**
 * @class ���л�״̬�İ�ť
 * @constructor
 * @extends ToggleButton
 * @param {String} id ͼ��id
 * ToggleButton(id); ToggleButton(id,text,icon);ToggleButton(id,content);
 * @returns
 */
function ToggleButton(id,arg1,arg2){
		function prototypeFunction () {
			/**
			 * ��䱳����Ӱ
			 */
			ToggleButton.prototype.fillCheckeredRectangle = function(graphics){
				graphics.setFillColor(ColorConstants.button);
				graphics.setStrokeColor(ColorConstants.buttonLightest);
				var rect = this.getClientArea(Rectangle.SINGLETON).crop(new Insets(1, 1, 0, 0));
				graphics.fillRectangle(rect.x, rect.y, rect.width, rect.height);

				graphics.clipRect(rect);
				graphics.translate(rect.x, rect.y);
				var n = rect.width + rect.height;
				graphics.beginPath();
				for (var i = 1; i < n; i += 2) {
					graphics.moveTo(0,i);
					graphics.lineTo(i,0);
				}
				graphics.stroke();
				graphics.restoreState();
			}
			ToggleButton.prototype.paintFigure = function(graphics){
				if (this.isSelected() && this.isOpaque()) {
					this.fillCheckeredRectangle(graphics);
				} else {
					this.isa = "ToggleButton";
					this.parentMethod("paintFigure",graphics);
				}
			}
			ToggleButton.prototype.init = function(id,arg1,arg2){
				if(arg1 == null){
					this.isa = "ToggleButton";
					this.parentMethod("init",id);
					this.setStyle(Clickable.STYLE_BUTTON | Clickable.STYLE_TOGGLE);
				}else{
					if(typeof arg1 == 'string' || arg1 instanceof String){
						this.isa = "ToggleButton";
						this.parentMethod("init",id,new Label(id+'label',arg1,arg2),Clickable.STYLE_BUTTON | Clickable.STYLE_TOGGLE);
					}else if(Util.isInstanceOf(arg1, Figure)){
						this.isa = "ToggleButton";
						this.parentMethod("init",id,arg1,Clickable.STYLE_BUTTON | Clickable.STYLE_TOGGLE);
					}
				}
			}
		}
	_classes.defineClass("ToggleButton",prototypeFunction); 
	this.init(id,arg1,arg2);
}


//CheckBox
//-----------------------------Class CheckBox-------
_classes.registerClass("CheckBox","Toggle");
/**
 * @class ��ѡ��
 * @constructor
 * @extends CheckBox
 * @param {String} id ͼ��id
 * CheckBox(id); CheckBox(id,text,icon);CheckBox(id,content);CheckBox(id,contet,style);
 * @returns
 */
function CheckBox(id,text){
		function prototypeFunction () {
			CheckBox.prototype.initialize = function(){
				this.isa = "CheckBox";
				this.parentMethod("initialize");
				var that = this;
				this.addChangeListener({
					handleStateChanged: function(changeEvent) {
						if (changeEvent.getPropertyName() == ButtonModel.SELECTED_PROPERTY)
							that.handleSelectionChanged();
					}
				});
			}
			CheckBox.prototype.handleSelectionChanged = function(){
				if (this.isSelected())
					this.label.setIcon(CheckBox.CHECKED);
				else
					this.label.setIcon(CheckBox.UNCHECKED);
			}
			CheckBox.prototype.init = function(id,text){
				this.label = new Label(id+'label',text,CheckBox.UNCHECKED);
				this.isa = "CheckBox";
				this.parentMethod("init",id,this.label);
			}
		}
	_classes.defineClass("CheckBox",prototypeFunction); 
	this.init(id,text);
}
CheckBox.UNCHECKED = ImageResourceManager.getImage("data:image/gif;base64,R0lGODlhDQANAPcAAEJCQrW1tc7OztbWzv///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ywAAAAADQANAAAIPQAFBBhIsGAAAgEAKFzIUABCAAQiSpToMOHEixUhXqT4cCNHix4JZAwpsmPIkSdNeqwooOUAlwJeDiB5MSAAOw==");
CheckBox.CHECKED =  ImageResourceManager.getImage("data:image/gif;base64,R0lGODlhDQANAPcAAAAAAEJCQrW1tc7OztbWzv///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ywAAAAADQANAAAITwAHCBhIsKCAAgICKFzIcADCAAUiSpToMOFEiQAKVIR4EUBGAg8LZIzoMeNGkRlLRgRpsaRHiiFRjlwZU+TFkxdhChjAk8AAnz9/5hxaICAAOw==");//ButtonModel
//----------------------------------Class ButtonModel---------------------
 _classes.registerClass("ButtonModel");
 /**
  * @class ��ťģ��
  * @constructor
  * @returns
  */
 function ButtonModel(){
	if(typeof ButtonModel._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * ���ӵ��������
			 */
			ButtonModel.prototype.addActionListener = function(listener){
				if (listener != null){
					this.listeners.addListener("ActionListener", listener);
				}
			}
			/**
			 * ���Ӹı������
			 */
			ButtonModel.prototype.addChangeListener = function(listener){
				if (listener != null){
					this.listeners.addListener("ChangeListener", listener);
				}
			}
			/**
			 * ����״̬ת�Ƽ�����
			 */
			ButtonModel.prototype.addStateTransitionListener = function(listener){
				if (listener != null){
					this.listeners.addListener("ButtonStateTransitionListener", listener);
				}
			}
			ButtonModel.prototype.fireActionPerformed = function(){
				var iter = this.listeners.getListeners("ActionListener");
				var action = new ActionEvent(this);
				while (iter.hasNext()){
					iter.next().actionPerformed(action);
				}
			}
			ButtonModel.prototype.fireCanceled = function(){
				var iter = this.listeners.getListeners("ButtonStateTransitionListener");
				while (iter.hasNext()){
					iter.next().canceled();
				}
			}
			ButtonModel.prototype.firePressed = function(){
				var iter = this.listeners.getListeners("ButtonStateTransitionListener");
				while (iter.hasNext()){
					iter.next().pressed();
				}
			}
			ButtonModel.prototype.fireReleased = function(){
				var iter = this.listeners.getListeners("ButtonStateTransitionListener");
				while (iter.hasNext()){
					iter.next().released();
				}
			}
			ButtonModel.prototype.fireResume = function(){
				var iter = this.listeners.getListeners("ButtonStateTransitionListener");
				while (iter.hasNext()){
					iter.next().resume();
				}
			}
			ButtonModel.prototype.fireStateChanged = function(property){
				var iter = this.listeners.getListeners("ChangeListener");
				var change = new ChangeEvent(this, property);
				while (iter.hasNext()){
					iter.next().handleStateChanged(change);
				}
			}
			ButtonModel.prototype.fireSuspend = function(){
				var iter = this.listeners.getListeners("ButtonStateTransitionListener");
				while (iter.hasNext()){
					iter.next().suspend();
				}
			}
			ButtonModel.prototype.getFlag = function(which){
				return (this.state & which) != 0;
			}
			/**
			 * �õ����ڵ���
			 */
			ButtonModel.prototype.getGroup = function(){
				return this.group;
			}
			/**
			 * �õ��û�����
			 */
			ButtonModel.prototype.getUserData = function(){
				return this.data;
			}
			ButtonModel.prototype.installFiringBehavior = function(){
				this.setFiringBehavior(ButtonModel.DEFAULT_FIRING_BEHAVIOR);
			}
			/**
			 * 
			 */
			ButtonModel.prototype.isArmed = function(){
				return (this.state & ButtonModel.ARMED_FLAG) != 0;
			}
			/**
			 * �Ƿ����
			 */
			ButtonModel.prototype.isEnabled = function(){
				return (this.state & ButtonModel.ENABLED_FLAG) != 0;
			}
			/**
			 * �Ƿ�����ڰ�ť֮��
			 */
			ButtonModel.prototype.isMouseOver = function(){
				return (this.state & ButtonModel.MOUSEOVER_FLAG) != 0;
			}
			/**
			 * �Ƿ���
			 */
			ButtonModel.prototype.isPressed = function(){
				return (this.state & ButtonModel.PRESSED_FLAG) != 0;
			}
			/**
			 * �Ƿ�ѡ��
			 */
			ButtonModel.prototype.isSelected = function(){
				if (this.group == null) {
					return (this.state & ButtonModel.SELECTED_FLAG) != 0;
				}else{
					return this.group.isSelected(this);
				}
			}
			/**
			 * �Ƴ����������
			 */
			ButtonModel.prototype.removeActionListener = function(listener){
				this.listeners.removeListener("ActionListener", listener);
			}
			/**
			 * �Ƴ��ı������
			 */
			ButtonModel.prototype.removeChangeListener = function(listener){
				this.listeners.removeListener("ChangeListener", listener);
			}
			/**
			 * �Ƴ�״̬�仯������
			 */
			ButtonModel.prototype.removeStateTransitionListener = function(listener){
				this.listeners.removeListener("ButtonStateTransitionListener", listener);
			}
			/**
			 * 
			 */
			ButtonModel.prototype.setArmed = function(value){
				if (this.isArmed() == value) return;
				if (!this.isEnabled()) return;
				this.setFlag(ButtonModel.ARMED_FLAG, value);
				this.fireStateChanged(ButtonModel.ARMED_PROPERTY);
			}
			/**
			 * �����Ƿ����
			 * @param {boolean} value
			 */
			ButtonModel.prototype.setEnabled = function(value){
				if (this.isEnabled() == value) return;
				if (!value) {
					this.setMouseOver(false);
					this.setArmed(false);
					this.setPressed(false);
				}
				this.setFlag(ButtonModel.ENABLED_FLAG, value);
				this.fireStateChanged(ButtonModel.ENABLED_PROPERTY);
			}
			/**
			 * 
			 */
			ButtonModel.prototype.setFiringBehavior = function(type){
				if (this.firingBehavior != null){
					this.removeStateTransitionListener(this.firingBehavior);
				}
				switch (type) {
					case ButtonModel.REPEAT_FIRING_BEHAVIOR:
						this.firingBehavior = new RepeatFiringBehavior(this);
						break;
					default:
						this.firingBehavior = new DefaultFiringBehavior(this);
				}
				this.addStateTransitionListener(this.firingBehavior);
			}
			/**
			 * 
			 */
			ButtonModel.prototype.setFlag = function(flag,value){
				if (value){
					this.state |= flag;
				}else{
					this.state &= ~flag;
				}
			}
			/**
			 * ������
			 * 
			 */
			ButtonModel.prototype.setGroup = function(bg){
				if (this.group == bg) return;
				if (this.group != null) this.group.remove(this);
				this.group = bg;
				if (this.group != null) this.group.add(this);
			}
			/**
			 * ����ڰ�����
			 * @param {boolean} value
			 */
			ButtonModel.prototype.setMouseOver = function(value){
				if (this.isMouseOver() == value) return;
				if (this.isPressed()){
					if (value){
						this.fireResume();
					}else{
						this.fireSuspend();
					}
				}
				this.setFlag(ButtonModel.MOUSEOVER_FLAG, value);
				this.fireStateChanged(ButtonModel.MOUSEOVER_PROPERTY);
			}
			/**
			 * ��갴��
			 * @param {boolean} value
			 */
			ButtonModel.prototype.setPressed = function(value){
				if (this.isPressed() == value) return;
				this.setFlag(ButtonModel.PRESSED_FLAG, value);
				if (value) {
					this.firePressed();
				}else{
					if (this.isArmed()){
						this.fireReleased();
					}else{
						this.fireCanceled();
					}
				}
				this.fireStateChanged(ButtonModel.PRESSED_PROPERTY);
			}
			/**
			 * ѡ��
			 * @param {boolean} value
			 */
			ButtonModel.prototype.setSelected = function(value){
				if (this.group == null) {
					if (this.isSelected() == value) return;
				}else{
					this.group.setSelected(this, value);
					if (this.getFlag(ButtonModel.SELECTED_FLAG) == this.isSelected()) return;
				}
				this.setFlag(ButtonModel.SELECTED_FLAG, value);
				this.fireStateChanged(ButtonModel.SELECTED_PROPERTY);
			}
			/**
			 * �����û�����
			 */
			ButtonModel.prototype.setUserData = function(data){
				this.data = data;
			}
			ButtonModel.prototype.init = function(){
				this.parentMethod("init");
				this.state = ButtonModel.ENABLED_FLAG;
				this.data = new Object();
				this.actionName = null;
				this.group = null;
				this.listeners = new EventListenerList();
				this.firingBehavior = null;
				this.installFiringBehavior();
			}
		}
		ButtonModel._initialized = true;
		_classes.defineClass("ButtonModel",prototypeFunction); 
	}
	this.init();
 }


/**
 * @static
 * @field String
 */
ButtonModel.ENABLED_PROPERTY = "enabled";
/**
 * @static
 * @field String
 */
ButtonModel.PRESSED_PROPERTY = "pressed";
/**
 * @static
 * @field String
 */
ButtonModel.SELECTED_PROPERTY = "selected";
/**
 * @static
 * @field String
 */
ButtonModel.ROLLOVER_ENABLED_PROPERTY = "rollover enabled";
/**
 * @static
 * @field String
 */
ButtonModel.MOUSEOVER_PROPERTY = "mouseover";
/**
 * @static
 * @field String
 */
ButtonModel.ARMED_PROPERTY = "armed";

ButtonModel.ARMED_FLAG = 1;
ButtonModel.PRESSED_FLAG = 2;
ButtonModel.MOUSEOVER_FLAG = 4;
ButtonModel.SELECTED_FLAG = 8;
ButtonModel.ENABLED_FLAG = 16;
ButtonModel.ROLLOVER_ENABLED_FLAG = 32;
ButtonModel.MAX_FLAG = ButtonModel.ROLLOVER_ENABLED_FLAG;


/**
 * @static
 * @field String
 */
ButtonModel.DEFAULT_FIRING_BEHAVIOR = 0;
/**
 * @static
 * @field String
 */
ButtonModel.REPEAT_FIRING_BEHAVIOR = 1;



//----------------------------------Class ButtonStateTransitionListener---------------------
 _classes.registerClass("ButtonStateTransitionListener");
 function ButtonStateTransitionListener(){
	if(typeof ButtonStateTransitionListener._initialized == "undefined"){
		function prototypeFunction () {
		
			ButtonStateTransitionListener.prototype.cancel = function(){
			}
			ButtonStateTransitionListener.prototype.canceled = function(){
			}
			ButtonStateTransitionListener.prototype.press = function(){
			}
			ButtonStateTransitionListener.prototype.pressed = function(){
			}
			ButtonStateTransitionListener.prototype.release = function(){
			}
			ButtonStateTransitionListener.prototype.released = function(){
			}
			ButtonStateTransitionListener.prototype.resume = function(){
			}
			ButtonStateTransitionListener.prototype.suspend = function(){
			}
			ButtonStateTransitionListener.prototype.init = function(){
				this.parentMethod("init");
			}
		}
		ButtonStateTransitionListener._initialized = true;
		_classes.defineClass("ButtonStateTransitionListener",prototypeFunction); 
	}
	this.init();
 }
 
 //DefaultFiringBehavior
//----------------------------------Class DefaultFiringBehavior---------------------
 _classes.registerClass("DefaultFiringBehavior","ButtonStateTransitionListener");
 function DefaultFiringBehavior(host){
	if(typeof DefaultFiringBehavior._initialized == "undefined"){
		function prototypeFunction () {
			DefaultFiringBehavior.prototype.released = function(){
				this.host.fireActionPerformed();
			}
			DefaultFiringBehavior.prototype.init = function(host){
				this.parentMethod("init");
				this.host = host;
			}
		}
		DefaultFiringBehavior._initialized = true;
		_classes.defineClass("DefaultFiringBehavior",prototypeFunction); 
	}
	this.init(host);
 }
 
  //RepeatFiringBehavior
//----------------------------------Class RepeatFiringBehavior---------------------
 _classes.registerClass("RepeatFiringBehavior","ButtonStateTransitionListener");
 function RepeatFiringBehavior(host){
	if(typeof RepeatFiringBehavior._initialized == "undefined"){
		function prototypeFunction () {
			RepeatFiringBehavior.prototype.pressed = function(){
				this.host.fireActionPerformed();
				if (!host.isEnabled()){
					return;
				}
				this.resume();
			}
			RepeatFiringBehavior.prototype.canceled = function(){
				this.suspend();
			}
			RepeatFiringBehavior.prototype.released = function(){
				this.suspend();
			}
			RepeatFiringBehavior.prototype.resume = function(){
				var host = this.host;
				var timer = this.timer;
				var parent = this;
				var timer_fun = function(){
					if (!host.isEnabled()){
						clearTimeout(timer);
					}
					parent.timer = setTimeout(timer_fun,parent.INITIAL_DELAY);
					host.fireActionPerformed();
				};
				
				this.timer = setTimeout(timer_fun,this.initialDelay);
			}
			RepeatFiringBehavior.prototype.suspend = function(){
				if (this.timer == null) return;
				clearTimeout(this.timer);
				this.timer = null;
			}
			RepeatFiringBehavior.prototype.init = function(host){
				this.parentMethod("init");
				this.host = host;
				this.stepDelay = RepeatFiringBehavior.STEP_DELAY;
				this.initialDelay = RepeatFiringBehavior.INITIAL_DELAY;
				this.timer = null;
			}
		}
		RepeatFiringBehavior._initialized = true;
		_classes.defineClass("RepeatFiringBehavior",prototypeFunction); 
	}
	this.init(host);
 }
 RepeatFiringBehavior.INITIAL_DELAY = 250;
 RepeatFiringBehavior.STEP_DELAY = 40;
 
 
 //ToggleModel
 //----------------------------------Class ToggleModel---------------------
 _classes.registerClass("ToggleModel","ButtonModel");
 function ToggleModel(){
	if(typeof ToggleModel._initialized == "undefined"){
		function prototypeFunction () {
			ToggleModel.prototype.fireActionPerformed = function(){
				this.setSelected(!this.isSelected());
				this.isa = "ToggleModel";
				this.parentMethod("fireActionPerformed");
			}
			ToggleModel.prototype.init = function(){
				this.parentMethod("init");
			}
		}
		ToggleModel._initialized = true;
		_classes.defineClass("ToggleModel",prototypeFunction); 
	}
	this.init();
 }//ScrollPane
//-----------------------------Class ScrollPane-------
_classes.registerClass("ScrollPane","Figure");
/**
 * ��������
 * @class ��������
 * @constructor
 * @param {String} id ͼ��ID
 */
function ScrollPane(id){
	if(typeof ScrollPane._initialized == "undefined"){
		function prototypeFunction () {
			/**
			 * @private
			 * �������������
			 */
			ScrollPane.prototype.createHorizontalScrollBar = function(){
				var bar = new ScrollBar(this.id+"-scrollBar-H");
				bar.setHorizontal(true);
				this.setHorizontalScrollBar(bar);
			}
			/**
			 * @private
			 * �����ӿ�
			 */
			ScrollPane.prototype.createViewport = function(){
				this.setViewport(new Viewport(this.id+"-viewPort"));
			}
			/**
			 * @private
			 * �������������
			 */
			ScrollPane.prototype.createVerticalScrollBar = function(){
				var bar = new ScrollBar(this.id+"-scrollBar-V");
				this.setVerticalScrollBar(bar);
			}
			/**
			 * �õ����������
			 * @type ScrollBar
			 */
			ScrollPane.prototype.getHorizontalScrollBar = function(){
				if (this.hBar == null){
					this.createHorizontalScrollBar();
				}
				return this.hBar;
			}
			/**
			 * ����������Ƿ�ɼ�
			 * @type boolean
			 */
			ScrollPane.prototype.getHorizontalScrollBarVisibility = function(){
				return this.hVisibility;
			}
			/**
			 * �õ����������
			 * @type ScrollBar
			 */
			ScrollPane.prototype.getVerticalScrollBar = function(){
				if (this.vBar == null){
					this.createVerticalScrollBar();
				}
				return this.vBar;
			}
			/**
			 * ����������Ƿ�ɼ�
			 * @type boolean
			 */
			ScrollPane.prototype.getVerticalScrollBarVisibility = function(){
				return this.vVisibility;
			}
			/**
			 * �õ���ʾ����
			 * @type Figure
			 */
			ScrollPane.prototype.getContents = function(){
				return this.getView();
			}
			ScrollPane.prototype.getView = function(){
				return this.getViewport().getContents();
			}
			/**
			 * �õ��ӿ�
			 * @type Viewport
			 */
			ScrollPane.prototype.getViewport = function(){
				if (this.viewport == null){
					this.createViewport();
				}
				return this.viewport;
			}
			/**
			 * �Ƿ�͸��
			 * @returns true
			 * @type boolean
			 */
			ScrollPane.prototype.isOpaque = function(){
				return true;
			}
			/**
			 * �������
			 * @param {Number} x Ҫ�����������λ��
			 */
			ScrollPane.prototype.scrollHorizontalTo = function(x){
				this.getViewport().setHorizontalLocation(x);
			}/**
			 * ������
			 * @param {Point} location Ҫ��������λ��
			 */
			ScrollPane.prototype.scrollTo = function(location){
				this.scrollHorizontalTo(location.x);
				this.scrollVerticalTo(location.y);
			}
			/**
			 * ���������
			 * @param {Number} y Ҫ�����������ֵ
			 */
			ScrollPane.prototype.scrollVerticalTo = function(y){
				this.getViewport().setVerticalLocation(y);
			}
			/**
			 * ��������
			 * @param {Figure} figure ����
			 */
			ScrollPane.prototype.setContents = function(figure){
				this.setView(figure);
			}
			/**
			 * ���ú��������
			 * @param {ScrollBar} bar ���������
			 */
			ScrollPane.prototype.setHorizontalScrollBar = function(bar){
				if (this.hBar != null) {
					this.remove(this.hBar);
					this.hBar.getRangeModel().removePropertyChangeListener(this.hBar);
				}
				this.hBar = bar;
				if (this.hBar != null) {
					this.add(this.hBar);
					this.hBar.setRangeModel(this.getViewport().getHorizontalRangeModel());
				}
			}
			/**
			 * ���ú���������Ƿ�ɼ�
			 * @param {boolean} v �Ƿ�ɼ�
			 */
			ScrollPane.prototype.setHorizontalScrollBarVisibility = function(v){
				if (this.hVisibility == v){
					return;
				}
				this.hVisibility = v;
				this.revalidate();
			}
			/**
			 * ���ù������Ƿ�ɼ�
			 * @param {boolean} v �Ƿ�ɼ�
			 */
			ScrollPane.prototype.setScrollBarVisibility = function(v){
				this.setHorizontalScrollBarVisibility(v);
				this.setVerticalScrollBarVisibility(v);
			}
			/**
			 * �������������
			 * @param {ScrollBar} bar ���������
			 */
			ScrollPane.prototype.setVerticalScrollBar = function(bar){
				if (this.vBar != null) {
					this.remove(this.vBar);
					this.vBar.getRangeModel().removePropertyChangeListener(this.vBar);
				}
				this.vBar = bar;
				if (this.vBar != null) {
					this.add(this.vBar);
					this.vBar.setRangeModel(this.getViewport().getVerticalRangeModel());
				}
			}
			/**
			 * ��������������Ƿ�ɼ�
			 * @param {boolean} v �Ƿ�ɼ�
			 */
			ScrollPane.prototype.setVerticalScrollBarVisibility = function(v){
				if (this.vVisibility == v) {
					return;
				}
				this.vVisibility = v;
				this.revalidate();
			}
			ScrollPane.prototype.setView = function(figure){
				this.getViewport().setContents(figure);
			}
			/**
			 * �����ӿ�
			 * @param {Viewport} vp �µ��ӿ�
			 */
			ScrollPane.prototype.setViewport = function(vp){
				if (this.viewport != null){
					this.remove(this.viewport);
				}
				this.viewport = vp;
				if (vp != null){
					this.add(vp, 0);
				}
			}
			ScrollPane.prototype.validate = function(){
				this.isa = "ScrollPane";
				this.parentMethod("validate");
				this.getHorizontalScrollBar().validate();
				this.getVerticalScrollBar().validate();
			}
			ScrollPane.prototype.init = function(id){
				this.parentMethod("init",id);
				this.viewport = null;
				this.hBar = null;
				this.vBar = null;
				this.hVisibility = ScrollPane.AUTOMATIC;
				this.vVisibility = ScrollPane.AUTOMATIC;
				this.setLayoutManager(new ScrollPaneLayout());
			}
		}
		ScrollPane._initialized = true;
		_classes.defineClass("ScrollPane",prototypeFunction); 
	}

	this.init(id);
}
/**
 * ��ʹ�ù�����
 * @static
 * @type int
 */
ScrollPane.NEVER = 0;
/**
 * �Զ������Ƿ�ʹ�ù�����
 * @static
 * @type int
 */
ScrollPane.AUTOMATIC = 1;
/**
 * ����ʹ�ù�����
 * @static
 * @type int
 */
ScrollPane.ALWAYS = 2;



//-----------------------------Class ScrollPaneLayout-------
_classes.registerClass("ScrollPaneLayout","AbstractHintLayout");
/**
 * @class ��������
 * @extends AbstractLayout
 * @constructor
 */
function ScrollPaneLayout(){
	if(typeof ScrollPaneLayout._initialized == "undefined"){
		function prototypeFunction () {
			ScrollPaneLayout.prototype.calculateMinimumSize = function(figure,w,h){
				var scrollpane = figure;
				var insets = scrollpane.getInsets();
				var d = scrollpane.getViewport().getMinimumSize(w, h);
				return d.getExpanded(insets.getWidth(), insets.getHeight());
			}
			ScrollPaneLayout.prototype.calculatePreferredSize = function(container,wHint,hHint){
				var scrollpane = container;
				var hBar = scrollpane.getHorizontalScrollBar();
				var vBar = scrollpane.getVerticalScrollBar();
				var insets = scrollpane.getInsets();
				
				var reservedWidth = insets.getWidth();
				var reservedHeight = insets.getHeight();
				
				if (scrollpane.getVerticalScrollBarVisibility() != ScrollPane.NEVER){
					reservedWidth += vBar.getPreferredSize().width;
				}
				if (scrollpane.getHorizontalScrollBarVisibility() != ScrollPane.NEVER){
					reservedHeight += hBar.getPreferredSize().height;
				}
				if (wHint > -1){
					wHint = Math.max(0, wHint - reservedWidth);
				}
				if (hHint > -1){
					hHint = Math.max(0, hHint - reservedHeight);
				}
				return scrollpane.getViewport().getPreferredSize(wHint, hHint).getExpanded(reservedWidth, reservedHeight);
			}
			ScrollPaneLayout.prototype.layout = function(parent){
				var scrollpane = parent;
				var viewport = scrollpane.getViewport();
				var hBar = scrollpane.getHorizontalScrollBar();
				var vBar = scrollpane.getVerticalScrollBar();
				var result = ScrollPaneSolver.solve(parent.getClientArea(), viewport, scrollpane.getHorizontalScrollBarVisibility(),scrollpane.getVerticalScrollBarVisibility(), vBar.getPreferredSize().width, hBar.getPreferredSize().height);
				if (result.showV) {
					vBar.setBounds(new Rectangle(result.viewportArea.right(),result.viewportArea.y,result.insets.right,result.viewportArea.height));
				}
				if (result.showH) {
					hBar.setBounds(new Rectangle(result.viewportArea.x,result.viewportArea.bottom(),result.viewportArea.width,result.insets.bottom));
				}
				vBar.setVisible(result.showV);
				hBar.setVisible(result.showH);
				
				var vStepInc = vBar.getStepIncrement();
				var vPageInc = vBar.getRangeModel().getExtent() - vStepInc;
				if (vPageInc < vStepInc){
					vPageInc = vStepInc;
				}
				vBar.setPageIncrement(vPageInc);
				
				var hStepInc = hBar.getStepIncrement();
				var hPageInc = hBar.getRangeModel().getExtent() - hStepInc;
				if (hPageInc < hStepInc){
					hPageInc = hStepInc;
				}
				hBar.setPageIncrement(hPageInc);
				
			}
			ScrollPaneLayout.prototype.init = function(){
				this.parentMethod("init");
			}
		}
		ScrollPaneLayout._initialized = true;
		_classes.defineClass("ScrollPaneLayout",prototypeFunction); 
	}

	this.init();
}
ScrollPaneLayout.NEVER = ScrollPane.NEVER;
ScrollPaneLayout.AUTO = ScrollPane.AUTOMATIC;
ScrollPaneLayout.ALWAYS = ScrollPane.ALWAYS;

//--------------------------------------ScrollPaneSolver-------------------
ScrollPaneSolver = new Object();
ScrollPaneSolver.NEVER = 0;
ScrollPaneSolver.AUTOMATIC = 1;
ScrollPaneSolver.ALWAYS = 2;
ScrollPaneSolver.solve = function(clientArea,viewport,hVis,vVis,vBarWidth,hBarHeight){
	var result = new Object();
	result.insets = new Insets();
	result.insets.bottom = hBarHeight;
	result.insets.right  = vBarWidth;
	
	var available  = clientArea.getSize();
	var guaranteed = new Dimension(available).shrink((vVis == ScrollPaneSolver.NEVER ? 0 : result.insets.right),(hVis == ScrollPaneSolver.NEVER ? 0 : result.insets.bottom));
	guaranteed.width = Math.max(guaranteed.width, 0);
	guaranteed.height = Math.max(guaranteed.height, 0);
	var wHint = guaranteed.width;
	var hHint = guaranteed.height;
	
	var preferred  = viewport.getPreferredSize(wHint, hHint).getCopy();
	var viewportInsets = viewport.getInsets();
	
	viewportMinSize = new Dimension(viewportInsets.getWidth(), viewportInsets.getHeight());
	if (viewport.getContents() != null) {
		if (viewport.getContentsTracksHeight() && hHint > -1){
			hHint = Math.max(0, hHint - viewportInsets.getHeight());
		}
		if (viewport.getContentsTracksWidth() && wHint > -1){
			wHint = Math.max(0, wHint - viewportInsets.getWidth());
		}
		viewportMinSize.expand(viewport.getContents().getMinimumSize(wHint, hHint));
	}
	
	if (viewport.getContentsTracksHeight()){
		preferred.height = viewportMinSize.height;
	}
	if (viewport.getContentsTracksWidth()){
		preferred.width = viewportMinSize.width;
	}
	
	var none = available.contains(preferred);
	var both = !none && preferred.containsProper(guaranteed);
	var showV = both || preferred.height > available.height;
	var showH = both || preferred.width  > available.width;
	
	result.showV = vVis != ScrollPaneSolver.NEVER && (showV || vVis == ScrollPaneSolver.ALWAYS);
	result.showH = hVis != ScrollPaneSolver.NEVER && (showH || hVis == ScrollPaneSolver.ALWAYS);
	
	if (!result.showV){
		result.insets.right = 0;
	}
	if (!result.showH){
		result.insets.bottom = 0;
	}
	result.viewportArea = clientArea.getCropped(result.insets);
	viewport.setBounds(result.viewportArea);
	return result;
}

//ScrollBarLayout
//-----------------------------Class ScrollBarLayout-------
_classes.registerClass("ScrollBarLayout","AbstractLayout");
/**
 * @class ����������
 * @extends AbstractLayout
 * @constructor
 */
function ScrollBarLayout(t){
		function prototypeFunction () {
			
			ScrollBarLayout.prototype.setConstraint = function(figure,constraint){
				if (constraint == ScrollBarLayout.UP_ARROW){
					this.up = figure;
				}else if(constraint == ScrollBarLayout.DOWN_ARROW){
					this.down = figure;
				}
				else if(constraint == ScrollBarLayout.THUMB){
					this.thumb = figure;
				}
				else if(constraint == ScrollBarLayout.PAGE_UP){
					this.pageUp = figure;
				}
				else if(constraint == ScrollBarLayout.PAGE_DOWN){
					this.pageDown = figure;
				}
			}
			ScrollBarLayout.prototype.calculatePreferredSize = function(parent,w,h){
				var insets = this.transposer.t(parent.getInsets());
				var d = new Dimension(16, 16 * 4);
				d.expand(insets.getWidth(), insets.getHeight());
				return this.transposer.t(d);
			}
			ScrollBarLayout.prototype.layout = function(parent){
				var scrollBar = parent;
				var trackBounds = this.layoutButtons(scrollBar);
				
				var extent = scrollBar.getExtent();
				var max = scrollBar.getMaximum();
				var min = scrollBar.getMinimum();
				var totalRange =  max - min;
				var valueRange = totalRange - extent;
				if ((valueRange < 1) || (!scrollBar.isEnabled())) {
					var boundsUpper = new Rectangle(trackBounds);
					var boundsLower = new Rectangle(trackBounds);
					
					boundsUpper.height /= 2;
					boundsLower.y += boundsUpper.height;
					boundsLower.height = trackBounds.height - boundsUpper.height;
					
					if (this.pageUp != null){
						this.pageUp.setBounds(this.transposer.t(boundsUpper));
					}
					if (this.pageDown != null){
						this.pageDown.setBounds(this.transposer.t(boundsLower));
					}
					return;
				}
				
				if (totalRange == 0){
					return;
				}
				
				var thumbHeight = Math.max(this.thumb == null ? 0 : this.thumb.getMinimumSize().height,trackBounds.height * extent / totalRange);
				if (this.thumb != null){
					this.thumb.setVisible(trackBounds.height > thumbHeight);
				}
				var thumbY = trackBounds.y + (trackBounds.height - thumbHeight) * (scrollBar.getValue() - min) / valueRange;
				var thumbBounds =  new Rectangle(trackBounds.x,thumbY,trackBounds.width,thumbHeight);
				
				if (this.thumb != null){
					this.thumb.setBounds(this.transposer.t(thumbBounds));
				}
				if (this.pageUp != null){
					this.pageUp.setBounds(this.transposer.t(new Rectangle(trackBounds.x,trackBounds.y,trackBounds.width,thumbBounds.y - trackBounds.y)));
				}
				if (this.pageDown != null){
					this.pageDown.setBounds(this.transposer.t(new Rectangle(trackBounds.x ,thumbBounds.y + thumbHeight,trackBounds.width,trackBounds.bottom() - thumbBounds.bottom())));
				}
			}
			ScrollBarLayout.prototype.layoutButtons = function(scrollBar){
				var bounds = this.transposer.t(scrollBar.getClientArea());
				var buttonSize = new Dimension(bounds.width,Math.min(bounds.width, bounds.height / 2));
				
				if (this.up != null){
					this.up.setBounds(this.transposer.t(new Rectangle(bounds.getTopLeft(), buttonSize)));
				}
				if (this.down != null) {
					var r = new Rectangle (bounds.x, bounds.bottom() - buttonSize.height,buttonSize.width, buttonSize.height);
					this.down.setBounds(this.transposer.t(r));
				}
				var trackBounds = bounds.getCropped(new Insets((this.up   == null) ? 0 : buttonSize.height, 0,(this.down == null) ? 0 : buttonSize.height, 0));
				return trackBounds;
			}
			ScrollBarLayout.prototype.remove = function(child){
				if (child == this.up) {
					this.up = null;
				}else if (child == this.down) {
					this.down = null;
				}
				else if (child == this.thumb) {
					this.thumb = null;
				}
				else if (child == this.pageUp) {
					this.pageUp = null;
				}
				else if (child == this.pageDown) {
					this.pageDown = null;
				}
				
			}
			ScrollBarLayout.prototype.init = function(t){
				this.parentMethod("init");
				this.up = null;
				this.down = null;
				this.thumb = null;
				this.pageUp = null;
				this.pageDown = null;
				this.transposer = t;
			}
		}
	_classes.defineClass("ScrollBarLayout",prototypeFunction); 
	this.init(t);
}
ScrollBarLayout.UP_ARROW = "up arrow";
ScrollBarLayout.DOWN_ARROW = "down arrow";
ScrollBarLayout.THUMB = "thumb";
ScrollBarLayout.PAGE_UP = "page_up";
ScrollBarLayout.PAGE_DOWN = "page_down";

//==ScrollBarLayout ==Transposer  ThumbDragger ==Clickable  ==ArrowButton ==ToggleModel ==ButtonModel ==ActionEvent ==ChangeEvent
//-----------------------------Class ScrollBar-------  TODO
_classes.registerClass("ScrollBar","Figure");
/**
 * @class ������
 * @constructor
 * @param {String} id ͼ��ID
 */
function ScrollBar(id){
	if(typeof ScrollBar._initialized == "undefined"){
		function prototypeFunction () {
			ScrollBar.prototype.createDefaultUpButton = function(){
				var buttonUp = new ArrowButton(this.id+"-ArrowButton-up");
				//buttonUp.setBorder(new ButtonBorder(ButtonBorder.SCHEMES.BUTTON_SCROLLBAR));
				return buttonUp;
			}
			ScrollBar.prototype.createDefaultDownButton = function(){
				var buttonDown = new ArrowButton(this.id+"-ArrowButton-down");
				//buttonDown.setBorder(new ButtonBorder(ButtonBorder.SCHEMES.BUTTON_SCROLLBAR));
				return buttonDown;
			}
			ScrollBar.prototype.createPageDown = function(){
				return this.createPageUp();
			}
			ScrollBar.prototype.createPageUp = function(){
				var clickable = new Clickable(this.id+"-Clickable-pageup");
				clickable.setOpaque(true);
				clickable.setBackgroundColor(ScrollBar.COLOR_TRACK);
				clickable.setRequestFocusEnabled(false);
				clickable.setFocusTraversable(false);
				var changeListener = new Object();
				changeListener.handleStateChanged = function(evt){
					if (clickable.getModel().isArmed()){
						clickable.setBackgroundColor(ColorConstants.black);
					}else{
						clickable.setBackgroundColor(ScrollBar.COLOR_TRACK);
					}
				};
				
				clickable.addChangeListener(changeListener);
				return clickable;
			}
			ScrollBar.prototype.createDefaultThumb = function(){
				var thumb = new Panel(this.id+"-thumb");
				thumb.setMinimumSize(new Dimension(6, 6));
				thumb.setBackgroundColor(ScrollBar.COLOR_THUMB);//ColorConstants.black);
				//thumb.setBorder(new SchemeBorder(SchemeBorder.SCHEMES.BUTTON_CONTRAST));
				var border = new LineBorder();
				border.setColor(new Color(151,151,151));
				thumb.setBorder(border);
				return thumb;
			}
			ScrollBar.prototype.getButtonUp = function(){
				return this.buttonUp;
			}
			ScrollBar.prototype.getButtonDown = function(){
				return this.buttonDown;
			}
			/**
			 * 
			 */
			ScrollBar.prototype.getExtent = function(){
				return this.getRangeModel().getExtent();
			}
			/**
			 * 
			 */
			ScrollBar.prototype.getMinimum = function(){
				return this.getRangeModel().getMinimum();
			}
			/**
			 * 
			 */
			ScrollBar.prototype.getMaximum = function(){
				return this.getRangeModel().getMaximum();
			}
			ScrollBar.prototype.getPageDown = function(){
				return this.pageDown;
			}
			/**
			 * 
			 */
			ScrollBar.prototype.getPageIncrement = function(){
				return this.pageIncrement;
			}
			ScrollBar.prototype.getPageUp = function(){
				return this.pageUp;
			}
			/**
			 * 
			 */
			ScrollBar.prototype.getRangeModel = function(){
				return this.rangeModel;
			}
			/**
			 * 
			 */
			ScrollBar.prototype.getStepIncrement = function(){
				return this.stepIncrement;
			}
			ScrollBar.prototype.getThumb = function(){
				return this.thumb;
			}
			/**
			 * 
			 */
			ScrollBar.prototype.getValue = function(){
				return this.getRangeModel().getValue();
			}
			ScrollBar.prototype.getValueRange = function(){
				return this.getMaximum() - this.getExtent() - this.getMinimum();
			}
			/**
			 * 
			 */
			ScrollBar.prototype.isHorizontal = function(){
				return this._isHorizontal;
			}
			ScrollBar.prototype.pageDown = function(){
				this.setValue(this.getValue() + this.getPageIncrement()); 
			}
			ScrollBar.prototype.pageUp = function(){
				this.setValue(this.getValue() - this.getPageIncrement()); 
			}
			/**
			 * 
			 */
			ScrollBar.prototype.propertyChange = function(event){
				if (event.getSource()!= null && Util.isInstanceOf(event.getSource(), DefaultRangeModel)) {
					this.setEnabled(this.getRangeModel().isEnabled());
					if (DefaultRangeModel.PROPERTY_VALUE == event.getPropertyName()) {
						this.firePropertyChange("value", event.getOldValue(),event.getNewValue());
						this.revalidate();
					}
					if (DefaultRangeModel.PROPERTY_MINIMUM == event.getPropertyName()) {
						this.firePropertyChange("value", event.getOldValue(),event.getNewValue());
						this.revalidate();
					}
					if (DefaultRangeModel.PROPERTY_MAXIMUM == event.getPropertyName()) {
						this.firePropertyChange("value", event.getOldValue(),event.getNewValue());
						this.revalidate();
					}
					if (DefaultRangeModel.PROPERTY_EXTENT == event.getPropertyName()) {
						this.firePropertyChange("value", event.getOldValue(),event.getNewValue());
						this.revalidate();
					}
				}
			}
			ScrollBar.prototype.revalidate = function(){
				this.invalidate();
				this.getUpdateManager().addInvalidFigure(this);
			}
			ScrollBar.prototype.setDirection = function(direction){
				//Doesn't make sense for Scrollbar.
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setDownClickable = function(down){
				if (this.buttonDown != null) {
					this.remove(this.buttonDown);
				}
				this.buttonDown = down;
				if (this.buttonDown != null) {
					if (this.buttonDown.setDirection != null){
						this.buttonDown.setDirection(this.isHorizontal()?  PositionConstants.EAST: PositionConstants.SOUTH);
					}
					this.buttonDown.setFiringMethod(Clickable.REPEAT_FIRING);
					var host = this;
					var actionListener = new Object();
					actionListener.actionPerformed = function(e){
						host.stepDown();
					};
					this.buttonDown.addActionListener(actionListener);
					this.add(this.buttonDown, ScrollBarLayout.DOWN_ARROW);
				}
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setUpClickable = function(up){
				if (this.buttonUp != null) {
					this.remove(this.buttonUp);
				}
				this.buttonUp = up;
				if (up != null) {
					if (up.setDirection != null){
						up.setDirection(this.isHorizontal()? PositionConstants.WEST : PositionConstants.NORTH);
					}
					this.buttonUp.setFiringMethod(Clickable.REPEAT_FIRING);
					var host = this;
					var actionListener = new Object();
					actionListener.actionPerformed = function(e){
						host.stepUp();
					}
					this.buttonUp.addActionListener(actionListener);
					this.add(this.buttonUp, ScrollBarLayout.UP_ARROW);
				}
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setEnabled = function(value){
				if (this.isEnabled() == value) return;
				this.isa = "ScrollBar";
				this.parentMethod("setEnabled",value);
				this.setChildrenEnabled(value);
				if (this.getThumb() != null) {
					this.getThumb().setVisible(value);
					this.revalidate();
				}
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setExtent = function(ext){
				if (this.getExtent() == ext) {
					return;
				}
				this.getRangeModel().setExtent(ext);
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setHorizontal = function(value){
				this.setOrientation(value ? PositionConstants.HORIZONTAL : PositionConstants.VERTICAL);
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setMaximum = function(max){
				if (this.getMaximum() == max)  return;
				this.getRangeModel().setMaximum(max);
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setMinimum = function(min){
				if (this.getMinimum() == min)  return;
				this.getRangeModel().setMinimum(min);
			}
			ScrollBar.prototype.setOrientation = function(value){
				if ((value == PositionConstants.HORIZONTAL) == this.isHorizontal()) return;
				this._isHorizontal = (value == PositionConstants.HORIZONTAL);
				this.transposer.setEnabled(this._isHorizontal);
				this.setChildrenOrientation(value);
				
				this.isa = "ScrollBar";
				this.parentMethod("revalidate");
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setPageIncrement = function(increment){
				var pageIncrement = increment;
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setPageDown = function(down){
				if (this.pageDown != null) this.remove(this.pageDown);
				this.pageDown = down;
				if (this.pageDown != null) {
					this.pageDown.setFiringMethod(Clickable.REPEAT_FIRING);
					var host = this;
					var actionListener = new Object();
					actionListener.actionPerformed = function(event){
						host.pageDown();
					}
					this.pageDown.addActionListener(actionListener);
					this.add(down, ScrollBarLayout.PAGE_DOWN);
				}
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setPageUp = function(up){
				if (this.pageUp != null){
					this.remove(this.pageUp);
				}
				this.pageUp = up;
				if (this.pageUp != null) {
					this.pageUp.setFiringMethod(Clickable.REPEAT_FIRING);
					var host = this;
					var actionListener = new Object();
					actionListener.actionPerformed = function(event){
						host.pageUp();
					}
					this.pageUp.addActionListener(actionListener);
					this.add(this.pageUp, ScrollBarLayout.PAGE_UP);
				}
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setRangeModel = function(rangeModel){
				if (this.rangeModel != null){
					this.rangeModel.removePropertyChangeListener(this);
				}
				this.rangeModel = rangeModel;
				rangeModel.addPropertyChangeListener(this);
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setStepIncrement = function(increment){
				this.stepIncrement = increment;
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setThumb = function(figure){
				if (this.thumb != null) {
					this.thumb.removeMouseListener(this.thumbDragger);
					this.thumb.removeMouseMotionListener(this.thumbDragger);
					this.remove(this.thumb);
				}
				this.thumb = figure;
				if (this.thumb != null) {
					this.thumb.addMouseListener(this.thumbDragger);
					this.thumb.addMouseMotionListener(this.thumbDragger);
					this.add(this.thumb, ScrollBarLayout.THUMB);
				}
			}
			/**
			 * 
			 */
			ScrollBar.prototype.setValue = function(v){
				this.getRangeModel().setValue(v);
			}
			ScrollBar.prototype.stepDown = function(){
				this.setValue(this.getValue() + this.getStepIncrement());
			}
			ScrollBar.prototype.stepUp = function(){
				this.setValue(this.getValue() - this.getStepIncrement());
			}
			ScrollBar.prototype.initialize = function(){
				this.setLayoutManager(new ScrollBarLayout(this.transposer));
				this.setUpClickable(this.createDefaultUpButton());
				this.setDownClickable(this.createDefaultDownButton());
				this.setPageUp(this.createPageUp());
				this.setPageDown(this.createPageDown());
				this.setThumb(this.createDefaultThumb());
			}
			ScrollBar.prototype.init = function(id){
				this.parentMethod("init",id);
				this.rangeModel = null;
				this.thumb = null;
				this.pageUp = null;
				this.pageDown = null;
				this.buttonUp = null;
				this.buttonDown = null;
				
				this.thumbDragger = new ThumbDragger(this);
				this._isHorizontal = false;
				this.pageIncrement = 50;
				this.stepIncrement = 10;
				this.transposer = new Transposer();
				this.setRangeModel(new DefaultRangeModel());
				this.initialize();
				var border = new LineBorder();
				border.setColor(new Color(227,227,227));
				this.setBorder(border);
			}
		}
		ScrollBar._initialized = true;
		_classes.defineClass("ScrollBar",prototypeFunction); 
	}

	this.init(id);
}
ScrollBar.ORIENTATION_FLAG = Figure.MAX_FLAG << 1;
ScrollBar.MAX_FLAG = ScrollBar.ORIENTATION_FLAG;
ScrollBar.COLOR_TRACK = new Color(237,237,237);//ColorConstants.gray;
ScrollBar.COLOR_THUMB = new Color(241,241,241);
ScrollBar.COLOR_BUTTON = new Color(12,38,52);
//ThumbDragger
//-----------------------------Class ThumbDragger-------
_classes.registerClass("ThumbDragger");
function ThumbDragger(host){
		function prototypeFunction () {
			
			ThumbDragger.prototype.mousePressed = function(me){
				this.armed = true;
				this.start = me.getLocation();
				var area = new Rectangle(this.host.transposer.t(this.host.getClientArea()));
				var thumbSize = this.host.transposer.t(this.host.getThumb().getSize());
				if (this.host.getButtonUp() != null){
					area.height -= this.host.transposer.t(this.host.getButtonUp().getSize()).height;
				}
				if (this.host.getButtonDown() != null){
					area.height -= this.host.transposer.t(this.host.getButtonDown().getSize()).height;
				}
				var sizeDifference = new Dimension(area.width, area.height - thumbSize.height);
				this.dragRange = sizeDifference.height;
				this.revertValue = this.host.getValue();
				//me.consume();
			}
			ThumbDragger.prototype.mouseDragged = function(me){
				if (!this.armed) return;
				var difference = this.host.transposer.t(me.getLocation().getDifference(this.start));
				var change = this.host.getValueRange() * difference.height / this.dragRange;
				this.host.setValue(this.revertValue + change);
				//me.consume();
			}
			ThumbDragger.prototype.mouseReleased = function(me){
				if (!this.armed) return;
				this.armed = false;
				//me.consume();
			}
			ThumbDragger.prototype.init = function(host){
				this.parentMethod("init");
				this.host = host;
				this.start = null;
				this.dragRange = null;
				this.revertValue = null;
				this.armed = null;
			}
		}
	_classes.defineClass("ThumbDragger",prototypeFunction); 
	this.init(host);
}