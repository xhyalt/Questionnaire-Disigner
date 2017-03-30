/**
* 为对象添加或覆写属性
* @param o {Object} 待覆写的对象
* @param overrides {Object} 要覆写的属性
* @param exceptions {JsonObject} (可选)排除的属性 eg {attribute:true}
* @static
*/
Object.override = function(o,overrides,exceptions){
    for(var p in overrides){
        if(exceptions&&exceptions[p]) continue;
        o[p] = overrides[p];
    }
};
Object.override(Object,{
/**
* 克隆某个对象
* @param o {Object} 待克隆的对象
* @static
*/
    clone : function(o){
        var obj = {};
        this.override(obj,o);
        return obj;
    }
});/**
* 实现一个js类继承另一个js类 单继承
* @param superClass {function} 父类
* @param override {Object} (可选) 覆盖的属性或方法
* @eg ： function super(){};function child(){};child.extend(super)
*/
Function.prototype.extend = function(superClass,override) {
    var f = new Function();
    f.prototype = superClass.prototype;
    var p = this.prototype = new f();
    p.constructor = this;
    this.superclass = superClass.prototype;
    if(override) Object.override(this.prototype,override);
};
/**
* 空方法
* @static
*/
Function.emptyFunction = function(){};
Function.needOverride = function(){ throw new Error('方法需要被重写')};
COM = {};
COM.NameSpace = {
    createNew : function() {
    var a = arguments,o = null,d,rt;
    for(var i = 0,l1 = a.length; i < l1; i++){ //可一次创建多个命名空间(数组)。
        d = a[i].split('.'); //将传入的参数用符号'.' 进行分割，并放入d数组中。
        rt = d[0];
        //判断数组中的第一个值是否未定义，如果未定义，便定义为空对象{},并赋值给变量o
        eval('if (typeof ' + rt + ' == "undefined"){' + rt + ' = {};} o = ' + rt + ';');
        for(var j = 1,l2 = d.length; j < l2; j++){
            //循环遍历数组d每个值作为key，加入到对象o中，如果key在o中存在，则取o中值，若不存在，则赋值为空对象{} 　　
            o[d[j]] = o[d[j]] || {};
            o = o[d[j]];
        }
        }
    }
}
COM.NameSpace.createNew('COM.Util','COM.widget','COM.draw2d','COM.gef','COM.engine');
/**
* 返回COM运行域
* @return {}
*/
function getCOMDomain(){
    return window;
}

COM.engine.PropertyMap = function(){
    this._map = {};
};
COM.engine.PropertyMap.extend(Object,{
    isEmpty : function(){
        for(var i in this._map){
            if(this._map.hasOwnProperty(i))
                return false;
        }
        return true;
    },
    /**
     * 检查Map是否存在某键名
     * @param key {String} 键名
     * @return {Boolean}
     */
    hasKey : function(key){
        return this._map.hasOwnProperty(key);
    },
    /**
     * 设置键值对
     * @param key {String} 键名
     * @param value {Object} 键值
     */
    put : function(key,value){
        this._map[key]=value;
    },
    /**
     * 获取指定键对应的值
     * @param key {String} 键名
     * @return {Object}
     */
    get : function(key){
        return this._map[key];
    },
    /**
     * 获取所有键名
     * @return {Array}
     */
    getKeys : function(){
        var keys = [];
        for(var i in this._map){
            if(this._map.hasOwnProperty(i))
                keys.push(i);
        }
        return keys;
    },
    /**
     * 获取所有值
     * @return {Array}
     */
    getValues : function(){
        var v = [];
        for(var i in this._map){
            if(this._map.hasOwnProperty(i))
                v.push(this._map[i]);
        }
        return v;
    },
    /**
     * 根据键名删除键值对
     */
    remove : function(key){
        delete this._map[key];
    },
    /**
     * 清空Map集合
     */
    clear : function(){
        for(var i in this._map){
            if(this._map.hasOwnProperty(i))
                delete this._map[i];
        }
    },
    /**
     * 遍历map，同时执行指定方法，数组值、索引、数组本身作为函数的参数
     * @param fn {function} 函数体
     * @param obj {Object} fn 的执行对象
     */
    each : function(fn,obj){
        var keys = this.getKeys();
        for(var i=0,len=keys.length;i<len;i++){
            var key = keys[i];
            fn.call(obj,this.get(key),key,this);
        }   
    },
    /**
     * 过滤数组，将符合要求（执行指定函数返回true的）的值重新放入一个新的数组并返回
     * @param fn {function} 函数体
     * @param Obj {Object} fn的执行对象
     */
    filter : function(fn,obj){
        var res = [];
        var keys = this.getKeys();
        for(var i=0,len=keys.length;i<len;i++){
            var key = keys[i];
            if(fn.call(obj,this.get(key),key,this))
                res.push(this.get(key));
        }
        return res;
    }
});//Array
(function(domain){
	if (domain.Array) {
		return;
	}
	function isArray(array){
		return typeof array == 'object' && typeof array.length === 'number' && !(array.propertyIsEnumerable('length'));
	}
	function contains(array, value) {
		if (!isArray(array)) {
			return false;
		}
		var i;
		for (i = 0; i < array.length; i++) {
			if (array[i] === value) {
				return true;
			}
		}
		return false;
	}
	function indexOf(array, value) {
		if (!isArray(array)) {
			return -1;
		}
		var i;
		for (i=0; i<array.length; i++) {
			if(array[i] === value){
				return i;
			}
		}
		return -1;
	}
	
	function remove(array, value) {
		var index = indexOf(array, value);
		if (index > -1) {
			array.splice(index,1);
		}
	}
	
	function copy(array) {
	    if(!isArray(array)){
	        return [];
	    }
	    var result = [];
	    for(var i = 0; i<array.length; i++){
	        result.push(array[i]);
	    }
	    return result;
	}
	
	function add(array, item, index) {
	    if(array != null && index != null && item != null){
            array.splice(index,0,item);
        }else if(item != null && index == null){
            this.push(index);
        }
	}
	function each(array, fn, obj) {
		for(var i = 0,len = array.length; i<len; i++){
            fn.call(obj,array[i],i,this);
        }
	}
	
	var Array = {};
	
	Array.isArray = isArray;
	Array.contains = contains;
	Array.indexOf = indexOf;
	Array.remove = remove;
	Array.copy = copy;
	Array.add = add;
	Array.each = each;
	
	domain.Array = Array;
})(COM.Util);

//EventRegister
(function(domain) {
	if (domain.EventRegister) {
		return;
	}
	function addEvent(el, type, fn) {
		(el.attachEvent) ? (el.attachEvent("on" + type, fn)) : (el.addEventListener(type, fn, false));
	}
	domain.EventRegister = {
		"addEvent": addEvent
	
	};
	
})(COM.Util);

//COMMON
(function(domain) {
	if (domain.Common) {
		return;
	}
	function to26Str(num) {
		if (num) {
			num--;
			var result = [];
			while (num >= 0)
			{
				result.unshift(String.fromCharCode((num % 26 + 65)));
				num = Math.floor(num / 26) - 1;
			}
			return result.join("");
		} else {
			return "";
		}
		
		/*
		var t = new String(num.toString(26));
        var c;
        var result = "";
        var a = "A";
        var code = a.charCodeAt(0);
        for (var i = 0; i < t.length; i++) {
           c = t[i];
            var n = parseInt(c, 26);
            var charcode = n + code;
            if (i == 0) {
            	charcode--;
            }
            result += String.fromCharCode(charcode);
        }
        return result;
        */
	}
	domain.Common = {
		"to26Str": to26Str
	
	};
	
})(COM.Util);

//browser
(function(domain) {
	if (domain.browser) {
		return;
	}
	domain.browser = Util.browser;
})(COM.Util);

Mouse = {
    BUTTON1: 1 << 19,
    BUTTON2: 1 << 20,
    BUTTON3: 1 << 21,
    BUTTON4: 1 << 22,
    BUTTON5: 1 << 23,
    BUTTON_ANY: this.BUTTON1 | this.BUTTON2 | this.BUTTON3 | this.BUTTON4 | this.BUTTON5,
    DOUBLE: 1 << 28,
    getStatemark: function (me) {
        if(me.buttonDown) {
            return Mouse.BUTTON1;
        } else {
            return 0;
        }
    },
    getMouseNumber: function (me) {
        return me.button;
    }
};

SharedCursors = {
    CURSOR_TREE_ADD: ''
};
/**
 * @author jiangqifan
 * @since 2013-5-9
 */
function KeyStroke(character,keyCode,stateMask,onPressed) {
    this.stateMask = stateMask;
    this.character = character;
    this.onPressed = onPressed;
    this.keyCode = keyCode;
}
KeyStroke.prototype.equals = function (stroke) {
    if(stroke == null) return;
    if(stroke instanceof KeyStroke) {
        return stroke.character == this.character && stroke.keyCode == this.keyCode && stroke.onPressed == this.onPressed && stroke.stateMask == this.stateMask;
    }
    return false;
}
KeyStroke.prototype.hashCode = function (obj) {
    return (this.stateMask + 1)* ((this.character ^ this.keyCode) + 1)+ (this.onPressed ? 0 : 32);
}
KeyStroke.prototype.toString = function (obj) {
    return "<" + this.character + "," + this.keyCode + "," + this.onPressed + "," + this.stateMask + ">";
}
KeyStroke.KEYCODE_BIT = 1 << 24; 
KeyStroke.ARROW_UP = KeyStroke.KEYCODE_BIT + 1;
KeyStroke.ARROW_DOWN = KeyStroke.KEYCODE_BIT + 2;
KeyStroke.ARROW_LEFT = KeyStroke.KEYCODE_BIT + 3;
KeyStroke.ARROW_RIGHT = KeyStroke.KEYCODE_BIT + 4;
KeyStroke.DEL = 0x7F;
KeyStroke.ESC =  0x1B;
KeyStroke.ALT = 1 << 16;
KeyStroke.CTRL = 1 << 18;
KeyStroke.SHIFT = 1 << 17;
KeyStroke.getStatemark = function(alt,ctrl,shift){
	var mark = 0;
	if(alt) mark |= KeyStroke.ALT;
	if(ctrl) mark |= KeyStroke.CTRL;
	if(shift) mark |= KeyStroke.SHIFT;
	return mark;
}
KeyStroke.get = function(event,pressed){
		return new KeyStroke(event.charCode, event.keyCode, getStatemark(event.altKey,event.ctrlKey,event.shiftKey), true);
}
KeyStroke.getPressedByCharacter = function(character,stateMask){
	return new KeyStroke(character, 0, stateMask, true);
}
KeyStroke.getPressedByKeyCode = function(keyCode,stateMask){
	return new KeyStroke(0, keyCode, stateMask, true);
}
KeyStroke.getPressed = function(character,keyCode,stateMask){
	return new KeyStroke(character, keyCode, stateMask, true);
}
KeyStroke.getReleasedByCharacter = function(character,stateMask){
	return new KeyStroke(character, 0, stateMask, false);
}
KeyStroke.getReleasedByKeyCode = function(keyCode,stateMask){
	return new KeyStroke(0, keyCode, stateMask, false);
}
KeyStroke.getReleased = function(character,keyCode,stateMask){
	return new KeyStroke(character, keyCode, stateMask, false);
}
/**
 * @author jiangqifan
 * @since 2013-4-16
 */
COM.gef.ConditionalTreeSearch = function ConditionalTreeSearch(coll,viewer,condition) {
    COM.gef.ConditionalTreeSearch.superclass.constructor.call(this,coll);
    this._viewer = viewer;
    this._condition = condition;
}

COM.gef.ConditionalTreeSearch.extend(ExclusionSearch,{    //ExclusionSearch
    accept: function (figure) {
        var editpart = null;
        while (editpart == null && figure != null) {
            editpart = this._viewer.getVisualPartMap().get(figure);
            figure = figure.getParent();
        }
        return editpart != null && (this._condition == null || this._condition.evaluate(editpart));
    }
});

/**
 * @author jiangqifan
 * @since 2013-4-12
 * @interface
 */
COM.gef.EditPart = function EditPart() {}
//method
COM.gef.EditPart.prototype.activate = Function.needOverride;
COM.gef.EditPart.prototype.addEditPartListener = Function.needOverride;
COM.gef.EditPart.prototype.addNotify = Function.needOverride;
COM.gef.EditPart.prototype.deactivate = Function.needOverride;
COM.gef.EditPart.prototype.eraseSourceFeedback = Function.needOverride;
COM.gef.EditPart.prototype.eraseTargetFeedback = Function.needOverride;
COM.gef.EditPart.prototype.getChildren = Function.needOverride;
COM.gef.EditPart.prototype.getCommand = Function.needOverride;
COM.gef.EditPart.prototype.getDragTracker = Function.needOverride;
COM.gef.EditPart.prototype.getEditPolicy = Function.needOverride;
COM.gef.EditPart.prototype.getModel = Function.needOverride;
COM.gef.EditPart.prototype.getParent = Function.needOverride;
COM.gef.EditPart.prototype.getRoot = Function.needOverride;
COM.gef.EditPart.prototype.getSelected = Function.needOverride;
COM.gef.EditPart.prototype.getTargetEditPart = Function.needOverride;
COM.gef.EditPart.prototype.getViewer = Function.needOverride;
COM.gef.EditPart.prototype.hasFocus = Function.needOverride;
COM.gef.EditPart.prototype.installEditPolicy = Function.needOverride;
COM.gef.EditPart.prototype.isActive = Function.needOverride;
COM.gef.EditPart.prototype.isSelectable = Function.needOverride;
COM.gef.EditPart.prototype.performRequest = Function.needOverride;
COM.gef.EditPart.prototype.refresh = Function.needOverride;
COM.gef.EditPart.prototype.removeEditPartListener = Function.needOverride;
COM.gef.EditPart.prototype.removeEditPolicy = Function.needOverride;
COM.gef.EditPart.prototype.removeNotify = Function.needOverride;
COM.gef.EditPart.prototype.setFocus = Function.needOverride;
COM.gef.EditPart.prototype.setModel = Function.needOverride;
COM.gef.EditPart.prototype.setParent = Function.needOverride;
COM.gef.EditPart.prototype.setSelected = Function.needOverride;
COM.gef.EditPart.prototype.showSourceFeedback = Function.needOverride;
COM.gef.EditPart.prototype.showTargetFeedback = Function.needOverride;
COM.gef.EditPart.prototype.understandsRequest = Function.needOverride;
COM.gef.EditPart.prototype.getId = Function.needOverride;

//constants
COM.gef.EditPart.SELECTED_NONE = 0;
COM.gef.EditPart.SELECTED = 1;
COM.gef.EditPart.SELECTED_PRIMARY = 2;
/**
 * @author jiangqifan
 * @since 2013-4-22
 * @interface
 */
COM.gef.LayerConstants = {};

COM.gef.LayerConstants.PRIMARY_LAYER = "Primary Layer";
COM.gef.LayerConstants.CONNECTION_LAYER = "Connection Layer";
COM.gef.LayerConstants.GRID_LAYER = "Grid Layer";
COM.gef.LayerConstants.GUIDE_LAYER = "Guide Layer";
COM.gef.LayerConstants.HANDLE_LAYER = "Handle Layer";
COM.gef.LayerConstants.FEEDBACK_LAYER = "Feedback Layer";
COM.gef.LayerConstants.SCALED_FEEDBACK_LAYER = "Scaled Feedback Layer";
COM.gef.LayerConstants.PRINTABLE_LAYERS = "Printable Layers";
COM.gef.LayerConstants.SCALABLE_LAYERS = "Scalable Layers";
/**
 * @author jiangqifan
 * @since 2013-4-12
 */
COM.gef.LayerManager = function LayerManager() {
};

COM.gef.LayerManager.ID= {};
COM.gef.LayerManager.Helper = {
    find: function (part) {
        return part.getViewer().getEditPartRegistry().get(COM.gef.LayerManager.ID);
    }
}
/**
 * @author jiangqifan
 * @since 2013-4-12
 * @interface
 */
COM.gef.EditPolicy = function EditPolicy() {

}
//method
COM.gef.EditPolicy.prototype.activate = Function.needOverride;
COM.gef.EditPolicy.prototype.deactivate = Function.needOverride;
COM.gef.EditPolicy.prototype.eraseSourceFeedback = Function.needOverride;
COM.gef.EditPolicy.prototype.eraseTargetFeedback = Function.needOverride;
COM.gef.EditPolicy.prototype.getCommand = Function.needOverride;
COM.gef.EditPolicy.prototype.getHost = Function.needOverride;
COM.gef.EditPolicy.prototype.getTargetEditPart = Function.needOverride;
COM.gef.EditPolicy.prototype.setHost = Function.needOverride;
COM.gef.EditPolicy.prototype.showSourceFeedback = Function.needOverride;
COM.gef.EditPolicy.prototype.showTargetFeedback = Function.needOverride;
COM.gef.EditPolicy.prototype.understandsRequest = Function.needOverride;


COM.gef.EditPolicy.COMPONENT_ROLE = 'ComponentEditPolicy';
COM.gef.EditPolicy.CONNECTION_ENDPOINTS_ROLE = 'Connection Endpoint Policy';
COM.gef.EditPolicy.CONNECTION_BENDPOINTS_ROLE = 'Connection Bendpoint Policy';
COM.gef.EditPolicy.CONNECTION_ROLE = 'ConnectionEditPolicy';
COM.gef.EditPolicy.CONTAINER_ROLE = 'ContainerEditPolicy';
COM.gef.EditPolicy.DIRECT_EDIT_ROLE = 'DirectEditPolicy';
COM.gef.EditPolicy.GRAPHICAL_NODE_ROLE = 'GraphicalNodeEditPolicy';
COM.gef.EditPolicy.LAYOUT_ROLE = 'LayoutEditPolicy';
COM.gef.EditPolicy.NODE_ROLE = 'NodeEditPolicy';
COM.gef.EditPolicy.PRIMARY_DRAG_ROLE = 'PrimaryDrag Policy';
COM.gef.EditPolicy.SELECTION_FEEDBACK_ROLE = 'Selection Feedback';
COM.gef.EditPolicy.TREE_CONTAINER_ROLE = 'TreeContainerEditPolicy';
/**
 * @author jiangqifan
 * @since 2013-4-22
 * @interface
 */
COM.gef.EditPartFactory = function EditPartFactory() {

}
//method
COM.gef.EditPartFactory.prototype.createEditPart = Function.needOverride;

/**
 * @author jiangqifan
 * @since 2013-4-12
 * @interface
 */
COM.gef.EditPartViewer = function EditPartViewer() {};
COM.gef.EditPartViewer.prototype.addSelectionChangedListener = Function.needOverride;
COM.gef.EditPartViewer.prototype.getSelection = Function.needOverride;
COM.gef.EditPartViewer.prototype.removeSelectionChangedListener = Function.needOverride;
COM.gef.EditPartViewer.prototype.setSelection = Function.needOverride;
COM.gef.EditPartViewer.prototype.addDragSourceListener = Function.needOverride;
COM.gef.EditPartViewer.prototype.addDropTargetListener = Function.needOverride;
COM.gef.EditPartViewer.prototype.addPropertyChangeListener = Function.needOverride;
COM.gef.EditPartViewer.prototype.appendSelection = Function.needOverride;
COM.gef.EditPartViewer.prototype.createControl = Function.needOverride;
COM.gef.EditPartViewer.prototype.deselect = Function.needOverride;
COM.gef.EditPartViewer.prototype.deselectAll = Function.needOverride;
COM.gef.EditPartViewer.prototype.findObjectAt = Function.needOverride;
COM.gef.EditPartViewer.prototype.findObjectAtExcluding = Function.needOverride;
COM.gef.EditPartViewer.prototype.flush = Function.needOverride;
COM.gef.EditPartViewer.prototype.getContents = Function.needOverride;
COM.gef.EditPartViewer.prototype.getContextMenu = Function.needOverride;
COM.gef.EditPartViewer.prototype.getControl = Function.needOverride;
COM.gef.EditPartViewer.prototype.getEditDomain = Function.needOverride;
COM.gef.EditPartViewer.prototype.getEditPartFactory = Function.needOverride;
COM.gef.EditPartViewer.prototype.getEditPartRegistry = Function.needOverride;
COM.gef.EditPartViewer.prototype.getFocusEditPart = Function.needOverride;
COM.gef.EditPartViewer.prototype.getKeyHandler = Function.needOverride;
COM.gef.EditPartViewer.prototype.getProperty = Function.needOverride;
COM.gef.EditPartViewer.prototype.getResourceManager = Function.needOverride;
COM.gef.EditPartViewer.prototype.getRootEditPart = Function.needOverride;
COM.gef.EditPartViewer.prototype.getSelectedEditParts = Function.needOverride;
COM.gef.EditPartViewer.prototype.getSelection = Function.needOverride;
COM.gef.EditPartViewer.prototype.getSelectionManager = Function.needOverride;
COM.gef.EditPartViewer.prototype.getVisualPartMap = Function.needOverride;
COM.gef.EditPartViewer.prototype.removePropertyChangeListener = Function.needOverride;
COM.gef.EditPartViewer.prototype.reveal = Function.needOverride;
COM.gef.EditPartViewer.prototype.select = Function.needOverride;
COM.gef.EditPartViewer.prototype.setContents = Function.needOverride;
COM.gef.EditPartViewer.prototype.setContextMenu = Function.needOverride;
COM.gef.EditPartViewer.prototype.setControl = Function.needOverride;
COM.gef.EditPartViewer.prototype.setCursor = Function.needOverride;
COM.gef.EditPartViewer.prototype.setEditDomain = Function.needOverride;
COM.gef.EditPartViewer.prototype.setEditPartFactory = Function.needOverride;
COM.gef.EditPartViewer.prototype.setFocus = Function.needOverride;
COM.gef.EditPartViewer.prototype.setKeyHandler = Function.needOverride;
COM.gef.EditPartViewer.prototype.setProperty = Function.needOverride;
COM.gef.EditPartViewer.prototype.setRootEditPart = Function.needOverride;
COM.gef.EditPartViewer.prototype.setRouteEventsToEditDomain = Function.needOverride;
COM.gef.EditPartViewer.prototype.setSelectionManager = Function.needOverride;
COM.gef.EditPartViewer.prototype.setSelectionManager = Function.needOverride;

COM.gef.EditPartViewer.Conditional = function () {
}
COM.gef.EditPartViewer.Conditional.prototype.evaluate = Function.needOverride;
/**
 * @author jiangqifan
 * @since 2013-4-18
 */
COM.gef.Command = function Command(label) {
    
    COM.gef.Command.superclass.constructor.call(this);
    this.label = null;
    this.debugLabel = null;
    
    if (label != null) {
        this.setLabel(label);
    }
}

COM.gef.Command.extend(Object,{
    canExecute: function () {
        return true;
    },
    
    canUndo: function () {
        return true;
    },
    
    chain: function (command) {
        if (command == null) {
            return this;
        }
        var compound = new COM.gef.CompoundCommand();       //COM.gef.CompoundCommand
        compound.chain = function (c) {
            this.add(c);
            return this;
        }
        compound.setDebugLabel('Chained Commands'); //$NON-NLS-1$
        result.add(this);
        result.add(command);
        return result;
    },
    
    dispose: function () {
        
    },
    
    execute: function () {
        
    },
    
    getDebugLabel: function () {
        return this.debugLabel + ' ' + this.getLabel();
    },
    
    getLabel: function () {
        return this.label;
    },
    
    redo: function () {
        this.execute();
    },
    
    setDebugLabel: function (label) {
        this.debugLabel = label;
    },
    
    setLabel: function (label) {
        this.label = label;
    },
    
    undo: function () {
        
    }
    
});
/**
 * @author jiangqifan
 * @since 2013-4-18
 */
COM.gef.UnexecutableCommand = function UnexecutableCommand(label) {
    COM.gef.UnexecutableCommand.superclass.constructor.call(this);
}

COM.gef.UnexecutableCommand.extend(COM.gef.Command,{
    canExecute: function () {
        return false;  
    },
    canUndo: function () {
        return false;
    }
});
COM.gef.UnexecutableCommand.INSTANCE = new COM.gef.UnexecutableCommand();
/**
 * @author jiangqifan
 * @since 2013-4-18
 */
COM.gef.CommandStack = function CommandStack(label) {
    
    COM.gef.CommandStack.superclass.constructor.call(this);
    this.eventListeners = [];
    this.redoable = [];                     //stack
    this.saveLocation = 0;
    this.undoable = [];                     //stack
    this.undoLimit = 0;
    this.listeners = [];
}

COM.gef.CommandStack.extend(Object,{
    addCommandStackEventListener: function (listener) {
        this.eventListeners.push(listener);
    },
    canRedo: function () {
        return this.redoable.length != 0;
    },
    canUndo: function () {
        if (this.undoable.length == 0) {
            return false;
        }
        return this.undoable[this.undoable.length-1].canUndo();
    },
    dispose: function () {
        this.flushUndo();
        this.flushRedo();
    },
    execute: function (command) {
        if (command == null || !command.canExecute()) {
            return;
        }
        this.flushRedo();
        this.notifyListeners(command, COM.gef.CommandStack.PRE_EXECUTE);
        try {
            command.execute();
            if (this.getUndoLimit() > 0) {
                while (this.undoable.length >= this.getUndoLimit()) {
                    this.undoable.shift().dispose();
                    if (this.saveLocation > -1) {
                        this.saveLocation--;
                    }
                }
            }
            if (this.saveLocation > this.undoable.length) {
                this.saveLocation = -1;
            }
            this.undoable.push(command);
        } finally {
            this.notifyListeners(command, COM.gef.CommandStack.POST_EXECUTE);
        }
    },
    flush: function () {
        this.flushRedo();
        this.flushUndo();
        this.saveLocation = 0;
    },
    flushRedo: function () {
        while (this.redoable.length > 0) {
            this.redoable.pop().dispose();
        }
    },
    flushUndo: function () {
        while (this.undoable.length > 0) {
            this.undoable.pop().dispose();
        }
    },
    getCommands: function () {
        var commands = COM.Util.Array.copy(this.undoable);
        for (var i = this.redoable.length - 1; i >= 0; i--) {
            commands.push(this.redoable[i]);
        }
        return commands;
    },
    getRedoCommand: function () {
        return this.redoable.length ? this.redoable[this.redoable.length-1] : null;
    },
    getUndoCommand: function () {
        return this.undoable.length? this.undoable[this.undoable.length-1] : null;
    },
    getUndoLimit: function () {
        return this.undoLimit;
    },
    isDirty: function () {
        return this.undoable.length != this.saveLocation;
    },
    markSaveLocation: function () {
        this.saveLocation = this.undoable.length;
    },
    notifyListeners: function (command, state) {
        var event = new COM.gef.CommandStackEvent(this, command, state);
        for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i].stackChanged(event);
        }
    },
   redo: function () {
       if (!this.canRedo()) {
           return;
       }
       var command = this.redoable.pop();
       this.notifyListeners(command, COM.gef.CommandStack.PRE_REDO);
       try {
           command.redo();
           this.undoable.push(command);
       } finally {
            this.notifyListeners(command, COM.gef.CommandStack.POST_REDO);
       }
   },
   removeCommandStackEventListener: function (listener) {
       COM.Util.Array.remove(this.eventListeners,listener);
   },
   setUndoLimit: function (undoLimit) {
       this.undoLimit = undoLimit;
   },
   undo: function () {
       var command = this.undoable.pop();
       this.notifyListeners(command, COM.gef.CommandStack.PRE_UNDO);
       try {
            command.undo();
            this.redoable.push(command);
       } finally {
           this.notifyListeners(command, COM.gef.CommandStack.POST_UNDO);
       }
   }
   
    
});

COM.gef.CommandStack.POST_EXECUTE = 8;
COM.gef.CommandStack.POST_REDO = 16;
COM.gef.CommandStack.POST_UNDO = 32;
COM.gef.CommandStack.POST_MASK = (COM.gef.CommandStack.POST_EXECUTE | COM.gef.CommandStack.POST_UNDO | COM.gef.CommandStack.POST_REDO);
COM.gef.CommandStack.PRE_EXECUTE = 1;
COM.gef.CommandStack.PRE_REDO = 2;
COM.gef.CommandStack.PRE_UNDO = 4;
COM.gef.CommandStack.PRE_MASK = (COM.gef.CommandStack.PRE_EXECUTE | COM.gef.CommandStack.PRE_UNDO | COM.gef.CommandStack.PRE_REDO);
/**
 * @author jiangqifan
 * @since 2013-4-19
 */
COM.gef.EventObject = function EventObject(source) {
    if (source == null) {
        throw {'type':'空值','message':'source为空'};
    }
    this.source = source;
    
}
COM.gef.EventObject.extend(Object,{
    getSource: function () {
         return this.source;
    },
    toString: function () {
         return 'COM.gef.EventObject' + '[source=' + source + ']';
    }
});
/**
 * @author jiangqifan
 * @since 2013-4-19
 */
COM.gef.CommandStackEvent = function CommandStackEvent(stack, c, detail) {
    COM.gef.CommandStackEvent.superclass.constructor.call(this, stack);
    this.command = c;
    this.detail = detail;
}
COM.gef.CommandStackEvent.extend(COM.gef.EventObject,{
    getCommand: function () {
         return this.command;
    },
    isPreChangeEvent: function () {
        return 0 != (this.getDetail() & COM.gef.CommandStack.PRE_MASK);
    },
    isPostChangeEvent: function () {
        return 0 != (this.getDetail() & COM.gef.CommandStack.POST_MASK);
    },
    getDetail: function () {
         return this.detail;
    }
});
/**
 * @author jiangqifan
 * @since 2013-5-8
 */
COM.gef.DomainEventDispatcher = function DomainEventDispatcher(domain, viewer) {
    COM.gef.DomainEventDispatcher.superclass.constructor.call(this, domain, viewer);
    this.domain = domain;
    this.viewer = viewer;
    this.editorCaptured = false;
    this.setEnableKeyTraversal(false);
    this.overrideCursor = null;
}
COM.gef.DomainEventDispatcher.extend(Html5EventDispatcher,{    //Html5EventDispatcher
    dispatchFocusGained: function (event) {
        COM.gef.DomainEventDispatcher.superclass.dispatchFocusGained.call(this,event);
        this.domain.focusGained(event, this.viewer);
    },
    dispatchFocusLost: function (event) {
        COM.gef.DomainEventDispatcher.superclass.dispatchFocusLost.call(this,event);
        this.domain.focusLost(event, this.viewer);
        this.setRouteEventsToEditor(false);
    },
    _superDispatch: function (type,e) {
        if (!this.editorCaptured) {
             COM.gef.DomainEventDispatcher.superclass[type].call(this,e);
             if (this.draw2dBusy()) {
                 return true;
             }
        }
    },
    _internalDispatch: function (type,domainType,e) {
        if (this._superDispatch(type,e)) {
            return;
        }
        if (this.okToDispatch()) {
            this.domain[domainType](e, this.viewer);
        }
        
    },
    dispatchKeyPressed: function(e) {
        this._internalDispatch('dispatchKeyPressed','keyPressed',e);
    },
    dispatchKeyReleased: function (e){
        this._internalDispatch('dispatchKeyReleased','keyUp',e);
    },
    dispatchKeyDown: function (e) {
         this._internalDispatch('dispatchKeyDown','keyDown',e);
    },
    dispatchMouseWheelScrolled: function (e) {
         this._internalDispatch('dispatchMouseWheelScrolled','mouseWheelScrolled',e);
    },
    dispatchMouseHover: function (me) {
        this._internalDispatch('dispatchMouseHover','mouseHover',me);
    },
    dispatchMouseDoubleClicked: function (me) {
         this._internalDispatch('dispatchMouseDoubleClicked','mouseDoubleClick',me);
    },
    dispatchMouseClicked: function (me) {
        this._internalDispatch('dispatchMouseClicked','mouseClick',me);
    },
    dispatchMouseEntered: function (me) {
        this._internalDispatch('dispatchMouseEntered','viewerEntered',me);
    },
    dispatchMouseExited: function (me) {
        //Do nothing now.
    },
    dispatchMousePressed: function (me) {
    	//避免有时mouseup丢失引起的问题.---------------
        this.setCapture(null);
        this.setRouteEventsToEditor(false);
        //-----------------------------------------
        
        if (this._superDispatch('dispatchMousePressed',me)) {
            return;
        }
        
        if (this.okToDispatch()) {
            this.setFocus(null);
            //canvas cannot get focus in html5.
            //this.control.forceFocus();
            this.setRouteEventsToEditor(true);
            this.domain.mouseDown(me, this.viewer);
        }
    },
    dispatchMouseMoved: function (me) {
        if (this._superDispatch('dispatchMouseMoved',me)) {
            return;
        }
        if (this.okToDispatch()) {
            //drag or move
            if (me.button == Canvas.BUTTON_LEFT){       //Canvas
                this.domain.mouseDrag(me, this.viewer);
            } else {
                this.domain.mouseMove(me, this.viewer);
            }
        }
    },
    dispatchMouseReleased: function (me) {
        if (this._superDispatch('dispatchMouseReleased',me)) {
            return;
        }
        if (this.okToDispatch()) {
            this.setRouteEventsToEditor(false);
            this.domain.mouseUp(me, this.viewer);
            this.updateFigureUnderCursor(me);
        }
    },
    /**
	 * 触摸开始
	 */
	dispatchTouchStart: function(te){
		 this._internalDispatch('dispatchTouchStart','touchStart',te);
	},
	/**
	 * 触摸移动
	 */
	dispatchTouchMove: function(te){
		 this._internalDispatch('dispatchTouchMove','touchMove',te);
	},
	/**
	 * 触摸结束
	 */
	dispatchTouchEnd: function(te){
		 this._internalDispatch('dispatchTouchEnd','touchEnd',te);
	},
    dispatchNativeDragFinished: function (event,viewer) {
        this.domain.nativeDragFinished(event, viewer);
    },
    dispatchNativeDragStarted: function (event,viewer) {
        this.setRouteEventsToEditor(false);
        this.bedomainnch.nativeDragStarted(event, viewer);
    },
    draw2dBusy: function () {
        if (this.getCurrentEvent() != null) {
            if (this.getCurrentEvent().isConsumed()){
                return true;
            }
        }
        if(this.isCaptured()) {
            return true;
        }
        return false;
    },
    getViewer: function () {
        return this.viewer;
    },
    okToDispatch: function () {
        return this.domain != null;
    },
    setCapture: function (figure) {
         COM.gef.DomainEventDispatcher.superclass.setCapture.call(this,figure);
         if (figure == null) {
            this.releaseCapture();
            this.setRouteEventsToEditor(true);
         }
    },
    setCursor: function (newCursor) {
        var cursor = this.overrideCursor || newCursor;
        COM.gef.DomainEventDispatcher.superclass.setCursor.call(this,cursor);
    },
    setRouteEventsToEditor: function (value) {
        this.editorCaptured = value;
    },
    setOverrideCursor: function (newCursor) {
        if (this.overrideCursor == newCursor) {
            return;
        }
        this.overrideCursor = newCursor;
        if (this.overrideCursor == null){
            this.updateCursor();
        } else {
            this.setCursor(this.overrideCursor);
        }
    }
    
});
/**
 * @author jiangqifan
 * @since 2013-4-22
 * @interface
 */
COM.gef.RequestConstants = {};
//constants
COM.gef.RequestConstants.REQ_CONNECTION_START = "connection start";
COM.gef.RequestConstants.REQ_CONNECTION_END = "connection end";
COM.gef.RequestConstants.REQ_RECONNECT_SOURCE = "Reconnection source";
COM.gef.RequestConstants.REQ_RECONNECT_TARGET = "Reconnection target";
COM.gef.RequestConstants.REQ_MOVE_BENDPOINT = "move bendpoint";
COM.gef.RequestConstants.REQ_CREATE_BENDPOINT = "create bendpoint";
COM.gef.RequestConstants.REQ_RESIZE = "resize";
COM.gef.RequestConstants.REQ_RESIZE_CHILDREN = "resize children";
COM.gef.RequestConstants.REQ_MOVE = "move";
COM.gef.RequestConstants.REQ_MOVE_CHILDREN = "move children";
COM.gef.RequestConstants.REQ_OPEN = "open";
COM.gef.RequestConstants.REQ_ORPHAN = "orphan";
COM.gef.RequestConstants.REQ_ORPHAN_CHILDREN = "orphan children";
COM.gef.RequestConstants.REQ_CREATE = "create child";
COM.gef.RequestConstants.REQ_ADD = "add children";
COM.gef.RequestConstants.REQ_CLONE = "clone";
COM.gef.RequestConstants.REQ_DELETE = "delete";
COM.gef.RequestConstants.REQ_DELETE_DEPENDANT = "delete dependant";
COM.gef.RequestConstants.REQ_ALIGN = "align";
COM.gef.RequestConstants.REQ_ALIGN_CHILDREN = "align children";
COM.gef.RequestConstants.REQ_DIRECT_EDIT = "direct edit";
COM.gef.RequestConstants.REQ_SELECTION = "selection";
COM.gef.RequestConstants.REQ_SELECTION_HOVER = "selection hover";
/**
 * @author jiangqifan
 * @since 2013-4-16
 */
COM.gef.Request = function Request(type) {
    
    COM.gef.Request.superclass.constructor.call(this);
    this.type = null;
    this.extendedData = null;
    
    if (type != null) {
        this.setType(type);
    }
}

COM.gef.Request.extend(Object,{
    getExtendedData: function () {
        if (this.extendedData == null) {
            this.extendedData = new COM.engine.PropertyMap();          //COM.engine.PropertyMap
        }
        return this.extendedData;
    },
    
    getType: function () {
        return this.type;
    },
    
    setExtendedData: function (map) {
        this.extendedData = map;
    },
    
    setType: function (type) {
        this.type = type;
    }
});
 /**
  * @author jiangqifan
  * @since 2013-4-9
  * 
  */
 COM.gef.SelectionManager = function SelectionManager() {
	COM.gef.SelectionManager.superclass.constructor.call(this);
	this.focusPart = null;
	this.selection = null;
	this.viewer = null;
	
 }
 //method
 COM.gef.SelectionManager.extend(Object,{
 /**
  * 将一个editPart加入到选择列表中。
  * @param {COM.gef.EditPart} editpart
  */
	appendSelection: function (editpart) { 
	    var primary;   //当前选中的editPart
		if (editpart != this.getFocus()) {
			this.viewer.setFocus(null);
		}
		if (this.selection.length > 0) {
		    primary = this.selection[selection.length - 1];
		    primary.setSelected(COM.gef.EditPart.SELECTED);       //COM.gef.EditPart.SELECTED
		}
		COM.Util.Array.remove(this.selection, editpart);         //COM.Util.Array.remove
		this.selection.push(editpart);
		editpart.setSelected(COM.gef.EditPart.SELECTED_PRIMARY);  //COM.gef.EditPart.SELECTED_PRIMARY
		
		this.fireSelectionChanged();
	},
/**
 * 取消对某个editPart的选择
 * @param {COM.gef.EditPart} editpart
 */
	deselect: function (editpart) {
	    var primaryCandidate;  //候选的可以作为选中元素的editpart
		editpart.setSelected(COM.gef.EditPart.SELECTED_NONE);     //COM.gef.EditPart.SELECTED_NONE
		COM.Util.Array.remove(this.selection, editpart);         //COM.Util.Array.remove
		if (this.selection.length > 0) {
		  for (var i = this.selection.length - 1; i >= 0; i--) {
		      primaryCandidate = this.selection[i];
		      if (primaryCandidate.isSelectable()) {
		          primaryCandidate.setSelected(COM.gef.EditPart.SELECTED_PRIMARY); //COM.gef.EditPart.SELECTED_PRIMARY
		          break;
		      }
		  }
		}
		this.fireSelectionChanged();
	},
	
	deselectAll: function () {
		var part;
		this.setFocus(null);
		for (var i = 0; i < this.selection.length; i++) {
            part = this.selection[i];
            part.setSelected(COM.gef.EditPart.SELECTED_NONE);       //COM.gef.EditPart.SELECTED_NONE
        }
        //清除数组所有元素，但不重新创建数组对象
        this.selection.length = 0;
        this.fireSelectionChanged();
	},
	
	fireSelectionChanged: function () {
	   //TODO
	},
	
	getFocus: function () {
       return this.focusPart;
    },
/**
 * 获取当前选中元素，如果没有当前选中元素，则返回viewer的contents.
 * @type {Array}
 */
    getSelection: function () {
        if (this.selection.length === 0 && this.viewer.getContents() != null) {
            return [this.viewer.getContents()];
        }
        return this.selection;
    },
    
    getViewer: function () {
        return this.viewer;
    },
    
    internalHookControl: Function.emptyFunction,
    
    internalUninstall: Function.emptyFunction,
    
    hookViewer: Function.emptyFunction,
    
    internalInitialize: function (viewer, selection) {
        this.viewer = viewer;
        this.selection = selection;
        this.hookViewer(viewer);
    },
    
    setFocus: function (part) {
        if (this.focusPart === part) {
            return;
        }
        if (this.focusPart != null) {
            this.focusPart.setFocus(false);
        }
        this.focusPart = part;
        if (this.focusPart != null) {
            this.focusPart.setFocus(true);
        }
    },
/**
 * 
 * @param {Array} newSelection
 */    
    setSelection: function (newSelection) {
        if (newSelection == null || !COM.Util.Array.isArray(newSelection)) {    //COM.Util.Array.isArray
           return; 
        }
        var part;
        var i;
        for (i = 0; i < this.selection.length; i++) {
            part = this.selection[i];
            if (!COM.Util.Array.contains(newSelection,part)) {
                part.setSelected(COM.gef.EditPart.SELECTED_NONE);               //COM.gef.EditPart.SELECTED_NONE
            }   
        }
        this.selection.length = 0;
        if (newSelection.length > 0) {
            for (i = 0; i < newSelection.length; i++) {
                part = newSelection[i];
                this.selection.push(part);
                if (i === newSelection.length - 1) {
                    part.setSelected(COM.gef.EditPart.SELECTED_PRIMARY);        //COM.gef.EditPart.SELECTED_PRIMARY
                    break;
                }
                part.setSelected(COM.gef.EditPart.SELECTED);                    //COM.gef.EditPart.SELECTED
            }
        }
        this.fireSelectionChanged();
    }
    
 });
 
//static
 COM.gef.SelectionManager.createDefault = function () {
     return new COM.gef.SelectionManager();
 }
/**
 * @author jiangqifan
 * @since 2013-4-16
 * @interface
 */
COM.gef.Tool = function Tool() {

}
//method
COM.gef.Tool.prototype.activate = Function.needOverride;
COM.gef.Tool.prototype.deactivate = Function.needOverride;
COM.gef.Tool.prototype.focusGained = Function.needOverride;
COM.gef.Tool.prototype.focusLost = Function.needOverride;
COM.gef.Tool.prototype.keyDown = Function.needOverride;
COM.gef.Tool.prototype.keyTraversed = Function.needOverride;
COM.gef.Tool.prototype.keyPressed = Function.needOverride;
COM.gef.Tool.prototype.keyUp = Function.needOverride;
COM.gef.Tool.prototype.mouseDoubleClick = Function.needOverride;
COM.gef.Tool.prototype.mouseDown = Function.needOverride;
COM.gef.Tool.prototype.mouseDrag = Function.needOverride;
COM.gef.Tool.prototype.mouseHover = Function.needOverride;
COM.gef.Tool.prototype.mouseMove = Function.needOverride;
COM.gef.Tool.prototype.mouseUp = Function.needOverride;
COM.gef.Tool.prototype.mouseWheelScrolled = Function.needOverride;
COM.gef.Tool.prototype.nativeDragFinished = Function.needOverride;
COM.gef.Tool.prototype.nativeDragStarted = Function.needOverride;
COM.gef.Tool.prototype.setEditDomain = Function.needOverride;
COM.gef.Tool.prototype.setViewer = Function.needOverride;
COM.gef.Tool.prototype.viewerEntered = Function.needOverride;
COM.gef.Tool.prototype.viewerExited = Function.needOverride;
COM.gef.Tool.prototype.setProperties = Function.needOverride;
/**
 * @author jiangqifan
 * @since 2013-4-22
 */
COM.gef.EditDomain = function EditDomain(shell) {
    
    COM.gef.EditDomain.superclass.constructor.call(this);
    this.shell = shell;
    this.defaultTool = null;                   
    this.activeTool = null;
    this.viewers = [];                     
    this.commandStack = new COM.gef.CommandStack();
    
    this.loadDefaultTool();
}

COM.gef.EditDomain.extend(Object,{
	dispose: function () {
		this.shell = null;
		if (this.defaultTool && this.defaultTool.dispose) {
			this.defaultTool.dispose();
		}
		this.defaultTool = null;
		this.viewers = null;
		this.commandStack = null;
	},
    addViewer: function (viewer) {
        viewer.setEditDomain(this);
        //if (!viewers.contains(viewer))
            // viewers.add(viewer);
        this.getControl().appendChild(viewer.getElement());
        this.viewers[0] = viewer;  
    },
    getControl: function () {
        return this.shell;
    },
    focusGained: function (event, viewer) {
        var tool = this.getActiveTool();
        if (tool != null) {
            tool.focusGained(event, viewer);
        }
    },
    focusLost: function (event, viewer) {
        var tool = this.getActiveTool();
        if (tool != null) {
            tool.focusLost(event, viewer);
        }
    },
    getActiveTool: function () {
        return this.activeTool;
    },
    getCommandStack: function () {
        return this.commandStack;
    },
    getDefaultTool: function () {
        if (this.defaultTool == null) {
            this.defaultTool = new COM.gef.SelectionTool();  //COM.gef.SelectionTool
        }
        return this.defaultTool;
    },
    
    // getPaletteViewer
    // handlePaletteToolChanged
    
    _internalDispatch: function (type,e,viewer) {
        var tool = this.getActiveTool();
         if (tool != null && tool[type]) {
            tool[type](e, viewer);
         }
    },
    keyDown: function (keyEvent, viewer) {
        this._internalDispatch('keyDown',keyEvent,viewer);
    },
    keyPressed: function (keyEvent, viewer) {
    	this._internalDispatch('keyPressed',keyEvent,viewer);
    },
    // keyTraversed
    
    keyUp: function (keyEvent, viewer) {
        this._internalDispatch('keyUp',keyEvent,viewer);
    },
    loadDefaultTool: function () {
        this.setActiveTool(null);
        // var paletteViewer = this.getPaletteViewer();
        // if (this.paletteRoot != null && paletteViewer != null) {
           // if (this.paletteRoot.getDefaultEntry() != null) {
                // paletteViewer.setActiveTool(this.paletteRoot.getDefaultEntry());
                // return;
           // } else {
               // paletteViewer.setActiveTool(null);
           // }
        // }
        this.setActiveTool(this.getDefaultTool());
    },
    mouseDoubleClick: function (mouseEvent, viewer) {
        this._internalDispatch('mouseDoubleClick',mouseEvent,viewer);
    },
    mouseClick: function (mouseEvent, viewer) {
        this._internalDispatch('mouseClick',mouseEvent,viewer);
    },
    mouseDown: function (mouseEvent, viewer) {
        this._internalDispatch('mouseDown',mouseEvent,viewer);
    },
    mouseDrag: function (mouseEvent, viewer) {
        this._internalDispatch('mouseDrag',mouseEvent,viewer);
    },
    mouseHover: function (mouseEvent, viewer) {
        this._internalDispatch('mouseHover',mouseEvent,viewer);
    },
    mouseMove: function (mouseEvent, viewer) {
        this._internalDispatch('mouseMove',mouseEvent,viewer);
    },
    mouseUp: function (mouseEvent, viewer) {
        this._internalDispatch('mouseUp',mouseEvent,viewer);
    },
    mouseWheelScrolled: function (event, viewer) {
        this._internalDispatch('mouseWheelScrolled',event,viewer);
    },
    nativeDragFinished: function (event, viewer) {
        this._internalDispatch('nativeDragFinished',event,viewer);
    },
    nativeDragStarted: function (event, viewer) {
        this._internalDispatch('nativeDragStarted',event,viewer);
    },
    touchStart: function (touchEvent, viewer) {
        this._internalDispatch('touchStart',touchEvent,viewer);
    },
    touchMove: function (touchEvent, viewer) {
        this._internalDispatch('touchMove',touchEvent,viewer);
    },
    touchEnd: function (touchEvent, viewer) {
        this._internalDispatch('touchEnd',touchEvent,viewer);
    },
    removeViewer: function (viewer) {
        if (this.viewers.remove(viewer)) {
            viewer.setEditDomain(null);
        }
    },
    setCommandStack: function (stack) {
        this.commandStack = stack;
    },
    setDefaultTool: function (tool) {
        this.defaultTool = tool;
    },
    setPaletteRoot: function (root) {
        if (this.paletteRoot == root) {
            return;
        }
        this.paletteRoot = root;
        if (this.getPaletteViewer() != null) {
            this.getPaletteViewer().setPaletteRoot(this.paletteRoot);
            this.loadDefaultTool();
        }
    },
    setPaletteViewer: function (palette) {
        if (palette == this.paletteViewer) {
            return;
        }
        if (this.paletteViewer != null) {
            this.paletteViewer.removePaletteListener(this.paletteListener);
        }
        this.paletteViewer = palette;
        if (this.paletteViewer != null) {
            palette.addPaletteListener(this.paletteListener);
            if (this.paletteRoot != null) {
                this.paletteViewer.setPaletteRoot(this.paletteRoot);
                this.loadDefaultTool();
            }
        }
    },
    setActiveTool: function (tool) {
        if (this.activeTool != null) {
            this.activeTool.deactivate();
        }
        this.activeTool = tool;
        if (this.activeTool != null) {
            this.activeTool.setEditDomain(this);
            this.activeTool.activate();
        }
    },
    viewerEntered: function (mouseEvent, viewer) {
        this._internalDispatch('viewerEntered',mouseEvent,viewer);
    },
    viewerExited: function (mouseEvent, viewer) {
        this._internalDispatch('viewerExited',mouseEvent,viewer);
    }
    
});
/**
 * @author jiangqifan
 * @since 2013-4-9
 */
COM.gef.AbstractEditPartViewer = function AbstractEditPartViewer() {
    COM.gef.AbstractEditPartViewer.superclass.constructor.call(this);
    this.disposeListener = null;
	this.selectionModel = COM.gef.SelectionManager.createDefault();
	this.selection = [];
	this.selectionListeners = [];
	this.factory = null;
	this.mapIDToEditPart = new Map();         //Map
	this.mapVisualToEditPart = new Map();      //Map
	this.properties = {};
	this.control = null;
	this.resources = null;
	this.domain = null;
	this.rootEditPart = null;
	this.contextMenu = null;
	
	this.keyHandler = null;
	this.changeSupport = null;
	
	this.init();
	function createId() {
		var id = "editPartViewer_"+COM.gef.AbstractEditPartViewer.count;
		COM.gef.AbstractEditPartViewer.count ++;
		
		return id;
	};
	this.id = createId();
	this.disposed = false;
 }
COM.gef.AbstractEditPartViewer.count = 0;
COM.gef.AbstractEditPartViewer.extend(COM.gef.EditPartViewer,{
	dispose: function () {
		if (this.disposed) {
			return;
		}
		this.disposed = true;
		this.selectionModel = null;
		this.selection  = null;
		this.mapIDToEditPart = null;
		this.mapVisualToEditPart = null;
		this.properties = null;
		this.contextMenu = null;
		this.keyHandler = null;
		this.changeSupport = null;
		if (this.rootEditPart && this.rootEditPart.dispose) {
			this.rootEditPart.dispose();
		}
		this.rootEditPart = null;
		return true;
	},
	getId: function () {
		return this.id;
	},
    setSelectionManager: function (model) {
        if(model == null) {
            throw {'type':'空值','message':'setSelectionManager的参数为空.'};
        }
        if (this.selectionModel != null) {
            this.selectionModel.internalUninstall();
        }
        this.selectionModel = model;
        model.internalInitialize(this, this.selection);
        if (this.getControl() != null) {
            model.internalHookControl(this.getControl());
        }
    },
    
	addPropertyChangeListener: function (listener) {
	   if (this.changeSupport == null) {
	       this.changeSupport = new PropertyChangeSupport(this);			//PropertyChangeSupport
        }
	},
	
	addSelectionChangedListener: function (listener) {
		this.selectionListeners.push(listener);
	},
	
	appendSelection: function (editpart) {
		this.selectionModel.appendSelection(editpart);
	},
	
	createControl: Function.needOverride,
	
	deselect: function (editpart) {
	    this.selectionModel.deselect(editpart);
	},
	
	deselectAll: function () {
	    this.selectionModel.deselectAll();
	},
	
	handleDispose: function () {
	    if (this.resources != null) {
	        this.resources.dispose();
	    }
	    this.setControl(null);
	},
	
	findObjectAt: function (pt) {
	    return this.findObjectAtExcluding(pt, []);
	},
	
	findObjectAtExcluding: function (pt, exclude) {
	    return this.findObjectAtExcluding(pt, exclude, null);
	},
	
	fireSelectionChanged: function () {
	    for (var i = 0; i < this.selectionListeners.length; i++) {
            this.selectionListeners[i].selectionChanged(this,this.getSelection());     //修改
        }
	},
	
	flush: Function.emptyFunction,
	
	getContextMenu: function () {
	    return this.contextMenu;
	},
	
	getContents: function () {
	    return this.getRootEditPart().getContents();
	},
	
	getControl: function () {
	    return this.control;
	},
	
	getEditDomain: function () {
	    return this.domain;
	},
	
	getEditPartFactory: function () {
	    return this.factory;
	},
	
	getEditPartRegistry: function () {
	    return this.mapIDToEditPart;
	},
	
	getFocusEditPart: function () {
	    if (this.selectionModel.getFocus() != null) {
	        return this.selectionModel.getFocus();
	    }
	    if (this.getSelectedEditParts().length === 0) {
	        if (this.getContents() != null) {
	            return this.getContents();
	        } else {
	            return this.getRootEditPart();
	        }
	    }
	    var selection = this.getSelectedEditParts();
	    return selection[selection.length - 1];
	},
	
	getKeyHandler: function () {
	    return this.keyHandler;
	},
	
	getProperty: function (key) {
	    if (this.properties != null) {
	        return this.properties.get(key);              //Map
	    }
	    return null;
	},
	
	getResourceManager: function () {
	    if (this.resources != null) {
	        return this.resources;
	    }
	    if (this.getControl() == null) {
	        Debugger.error('control is null.');
	    }
	    //this.resources = new LocalResourceManager(JFaceResources.getResources());
	    return this.resources;
	},
	
	getRootEditPart: function () {
	    return this.rootEditPart;
	},
	
	getSelectedEditParts: function () {
	    return this.selection;
	},
	
	getSelection: function() {
	    return this.selectionModel.getSelection();
	},
	
	getSelectionManager: function() {
	    return this.selectionModel;
	},
	
	getVisualPartMap: function () {
	   return this.mapVisualToEditPart;    
	},
	
	hookControl: function() {
	    var control = this.getControl();
	    var that = this;
	    if(control == null) {
	        throw {'type':'空值','message':'control为空!'};
	    }
	    this.getSelectionManager().internalHookControl(control);
	    this.disposeListener = {widgetDisposed: function(e){that.handleDispose(e);}};
	    control.addDisposeListener(this.disposeListener);
	    if (this.getRootEditPart() != null) {
	        this.getRootEditPart().activate();
	    }
	    if (this.contextMenu != null){
	       control.setMenu(this.contextMenu.createContextMenu(this.getControl()));
	    }
	    
	},
	
	init: Function.emptyFunction,
	
	primDeselectAll: function () {
	    var part;
	    var list = this.primGetSelectedEditParts();
	    for (var i = 0; i < list.length; i++) {
	        part = list[i];
	        part.setSelected(COM.gef.EditPart.SELECTED_NONE);          //COM.gef.EditPart.SELECTED_NONE
	    }
	    list.length = 0;
	},
	
	primGetSelectedEditParts: function () {
	    return this.selection;
	},
	
	removePropertyChangeListener: function (listener) {
	    if (this.changeSupport != null) {
	       this.changeSupport.removePropertyChangeListener(listener);
	       if (this.changeSupport.getPropertyChangeListeners().length === 0) {
	           this.changeSupport = null;
	       }
	    }
	},
	
	removeSelectionChangedListener: function (l) {
	    this.selectionListeners.remove(l);
	},
	
	reveal: Function.emptyFunction,
	
	select: function (editpart) {
	    if ((this.getSelectedEditParts().length == 1) && (this.getSelectedEditParts()[0] == editpart)) {
	        return;
	    }
	    this.primDeselectAll();
	    this.appendSelection(editpart);
	},
	
	setContextMenu: function (manager) {
	    if (this.contextMenu != null) {
	        this.contextMenu.dispose();
	    }
	    this.contextMenu = manager;
	    if (this.getControl() != null && !this.getControl().isDisposed()) {
	       this.getControl().setMenu(this.contextMenu.createContextMenu(this.getControl()));
	    }
	},
	
	setContents: function (editpart) {
	    this.getRootEditPart().setContents(editpart);
	},
	
	setContents: function (contents) {
	    if (contents instanceof COM.gef.EditPart) {
	         this.getRootEditPart().setContents(contents);
	    } else {
	        if (this.getEditPartFactory() == null) {
                throw {'type':'空值','message':'editPartFacotry为空'};
            }
            this.setContents(this.getEditPartFactory().createEditPart(null, contents));
	    }
	},
	
	setControl: function (control) {
	    if (this.control != null) {
	        this.unhookControl();
	    }
	    this.control = control;
	    if (control != null) {
	        this.hookControl();
	    }
	},
	
	setCursor: function (cursor) {
	    if (this.getControl() == null || this.getControl().isDisposed()) {
	        return;
	    }
	    this.getControl().setCursor(cursor);
	},
	
	setEditDomain: function (editdomain) {
	    this.domain = editdomain;
	},
	
	setEditPartFactory: function (factory) {
	    this.factory = factory;
	},
	
	setFocus: function (part) {
	    this.getSelectionManager().setFocus(part);
	},
	
	setKeyHandler: function (handler) {
	    this.keyHandler = handler;
	},
	
	setProperty: function (key,value) {
	    if (this.properties == null) {
	        this.properties = new HashMap();                           //HashMap
	    }
	    var old;
	    if (value == null) {
	        old = this.properties.remove(key);
	    } else {
	        old = this.properties.put(key, value);
	    }
	    
	    if (this.changeSupport != null) {
	        this.changeSupport.firePropertyChange(key, old, value);
	    }
	},
	
	setRootEditPart: function (editpart) {
	    if (this.rootEditPart != null) {
	       if (this.rootEditPart.isActive()) {
	           this.rootEditPart.deactivate();
	       }
	       this.rootEditPart.setViewer(null);
	    }
	    this.rootEditPart = editpart;
	    this.rootEditPart.setViewer(this);
	    if (this.getControl() != null) {
	        this.rootEditPart.activate();
	    }
	    
	},
	
	setRouteEventsToEditDomain: Function.emptyFunction,
	
	setSelection: function (newSelection) {
	    this.selectionModel.setSelection(newSelection);
	},
	
	unhookControl: function () {
	    if (this.getControl() == null) {
	        throw {'type':'空值','mesage':'viewer的control为空'};
	    }
	    if (this.disposeListener != null) {
	       this.getControl().removeDisposeListener(this.disposeListener);
            this.disposeListener = null;
	    }
	    if (this.getContextMenu() != null) {
	        this.getContextMenu().dispose();
	    }
	    if (this.getRootEditPart() != null) {
	        this.getRootEditPart().deactivate();
	    }
	    
	}
	
	
 });
/**
 * @author jiangqifan
 * @since 2013-4-12
 */
COM.gef.GraphicalViewerImpl = function GraphicalViewerImpl() {
    
    COM.gef.GraphicalViewerImpl.superclass.constructor.call(this);
    
    this.lws = this.createLightweightSystem();
    this.createControl();
	// this.lws = this.createLightweightSystem(this.getControl());
	this.rootFigure = null;
	this.eventDispatcher = null;
	this.lFocus = null;
	
	this.createDefaultRoot();
	this.initScrollHelper();
	//this.setProperty(MouseWheelHandler.KeyGenerator.getKey(SWT.NONE),MouseWheelDelegateHandler.SINGLETON);
}
COM.gef.GraphicalViewerImpl.extend(COM.gef.AbstractEditPartViewer,{
	dispose: function () {
		if (COM.gef.GraphicalViewerImpl.superclass.dispose.call(this)) {
			if (this.scrollHelper && this.scrollHelper.dispose) {
	    		this.scrollHelper.dispose();
	    	}
	    	if (this.control && this.control.dispose) {
	    		this.control.dispose();
	    	}
	    	if (this.lws && this.lws.dispose) {
	    		this.lws.dispose();
	    	}
	    	if (this.rootFigure && this.rootFigure.dispose) {
	    		this.rootFigure.dispose();
	    	}
	    	if (this.eventDispatcher && this.eventDispatcher.dispose) {
	    		this.eventDispatcher.dispose();
	    	}
	    	delete this.element;
	    	delete this.scrollHelper;
	    	delete this.eventDispatcher;
	    	delete this.control;
	    	delete this.lws;
	    	delete this.rootFigure;
	    	delete this.lFocus;
		}
	},
    getScrollHelper: function () {
        return this.scrollHelper;
    },
    initScrollHelper: function () {
        this.scrollBar = document.createElement("div");
        this.scrollBar.style.position = 'absolute';
        //this.scrollBar.style.border="1px solid black";
        this.scrollBar.style.overflow = "auto";
        this.scrollBar.style.height = 800 +"px";
        this.scrollBar.style.width = 1600 +"px";
        this.placeHolder = document.createElement("div");
        this.scrollBar.appendChild(this.placeHolder);
        this.scrollHelper = {scrollBar:this.scrollBar,placeHolder:this.placeHolder};
    },
    setSize: function (width,height) {
    	var ele = this.getElement();
    	ele.style.width = width + 'px';
    	ele.style.height = height + 'px';
    	
        this.getControl().resize(width,height);
        this.width = width;
        this.height = height;
        this.setScrollBarSize(width, height);
    },
    setScrollBarSize: function (width,height) {
    	this.scrollBar.style.width = width + 'px';
        this.scrollBar.style.height = height + 'px';
    },
    getSize: function () {
      return new Dimension(this.width,this.height);  
    },
    getElement: function () {
    	if (null == this.element) {
    		this.element = document.createElement("div");
    		this.element.className = "viewer";
        	this.element.style.position = 'absolute';
    	}
      return this.element;
    },
    createControl: function () {
    	
        
        
        var canvasElement = document.createElement("canvas");
        canvasElement.style.position="absolute";
        canvasElement.style.top="0px";
        canvasElement.style.left="0px";
        canvasElement.id = this.getId();
        // canvasElement.style.border="1px solid";
        this.getElement().appendChild(canvasElement);
        var canvas = new Canvas(this.canvasElement);          //Canvas
        this.setControl(canvas);
    },
    // createControl: function (composite) {
        // this.setControl(new Canvas(composite));  //Canvas
        // return this.getControl();
    // },
    
    createDefaultRoot: function () {
        // this.setRootEditPart(new COM.gef.ScalableRootEditPart());  //COM.gef.ScalableRootEditPart
        this.setRootEditPart(new COM.gef.ScalableRootEditPart());     //COM.gef.SimpleRootEditPart
    },

    createLightweightSystem: function () {
        var lws = new LightweightSystem();  //LightweightSystem
        return lws;
    },

    handleDispose: function (e) {
        //super.handleDispose(e);
        //getLightweightSystem().getUpdateManager().dispose();
    },

    handleFocusGained: function (fe) {
        if (this.getFocusEditPart() != null) {
            this.getFocusEditPart().setFocus(true);
        }
    },

    handleFocusLost: function (fe) {
        if (this.getFocusEditPart() != null) {
            this.getFocusEditPart().setFocus(false);
        }
    },

    findHandleAt: function (p) {
        var layermanager = this.getEditPartRegistry().get(COM.gef.LayerManager.ID); //COM.gef.LayerManager
        if (layermanager == null) {
            return null;
        }
        var list = [];
        list.push(layermanager.getLayer(COM.gef.LayerConstants.PRIMARY_LAYER)); //LayerConstants
        list.push(layermanager.getLayer(COM.gef.LayerConstants.CONNECTION_LAYER));
        list.push(layermanager.getLayer(COM.gef.LayerConstants.FEEDBACK_LAYER));
        var handle = this.getLightweightSystem().getRootFigure().findFigureAtExcluding(p.x, p.y, list);
    
        //if (handle instanceof Handle) {  //Handle
        if (handle == null) {
            return null;
        }
        if (handle.getDragTracker) {
            return handle;
        }
        return null;
    },

    findObjectAtExcluding: function (pt, exclude, condition) {
        var figure = this.getLightweightSystem().getRootFigure().findFigureAt(pt.x, pt.y, new COM.gef.ConditionalTreeSearch(exclude,this,condition)); //ConditionalTreeSearch
        var part = null;
        while (part == null && figure != null) {
            part = this.getVisualPartMap().get(figure);
            figure = figure.getParent();
        }
        if (part == null){
            return this.getContents();
        }
        return part;
    },

    flush: function () {
        this.getLightweightSystem().getUpdateManager().performUpdate();
    },

    getLayerManager: function () {
        return this.getEditPartRegistry().get(COM.gef.LayerManager.ID); //COM.gef.LayerManager
    },

    getLightweightSystem: function () {
        return this.lws;
    },
    
    hookControl: function() {
        COM.gef.GraphicalViewerImpl.superclass.hookControl.call(this);
        this.getLightweightSystem().setControl(this.getControl());
    },
    
    reveal: function (part) {
            //TODO
    },
    
    setContextMenu: function(contextMenu) {
        COM.gef.GraphicalViewerImpl.superclass.setContextMenu.call(this, contextMenu);
    },
    setCursor: function (newCursor) {
        if (this.eventDispatcher != null) {
            this.eventDispatcher.setOverrideCursor(newCursor);
        }
    },

    setEditDomain: function (domain) {
        COM.gef.GraphicalViewerImpl.superclass.setEditDomain.call(this, domain);
        this.eventDispatcher = this.createEventDispatcher(domain, this);
        this.getLightweightSystem().setEventDispatcher(this.eventDispatcher);
        this.appendScrollBar(domain.getControl());
    },
    createEventDispatcher: function (domain, viewer) {
        return new COM.gef.DomainEventDispatcher(domain, viewer);   //COM.gef.DomainEventDispatcher
    },
    appendScrollBar: function (parent) {
    	parent.appendChild(this.scrollBar);
    },

    setRootEditPart: function (editpart) {
        COM.gef.GraphicalViewerImpl.superclass.setRootEditPart.call(this, editpart);
        this.setRootFigure(editpart.getFigure());
    },

    setRootFigure: function (figure) {
        this.rootFigure = figure;
        this.hookRootFigure();
    },

    hookRootFigure: function () {
        this.getLightweightSystem().setContents(this.rootFigure);
    },

    setRouteEventsToEditDomain: function (value) {
        this.eventDispatcher.setRouteEventsToEditor(value);
    },
    
    unhookControl: function () {
        COM.gef.GraphicalViewerImpl.superclass.unhookControl.call(this);
        if (this.lFocus != null) {
            this.etControl().removeFocusListener(this.lFocus);
            this.lFocus = null;
        }
    }
    
});

/*
private static class MouseWheelDelegateHandler implements MouseWheelHandler {
	private static final MouseWheelHandler SINGLETON = new MouseWheelDelegateHandler();
	private MouseWheelDelegateHandler() {
	}

		//
		// Delegates handling to the selected editpart's MouseWheelHelper.
		// 
		// @see org.eclipse.gef.MouseWheelHandler#handleMouseWheel(org.eclipse.swt.widgets.Event,
		//      org.eclipse.gef.EditPartViewer)
		//
		 public void handleMouseWheel(Event event, EditPartViewer viewer) {
			var part = viewer.getFocusEditPart();
			do {
				MouseWheelHelper helper = (MouseWheelHelper) part
						.getAdapter(MouseWheelHelper.class);
				if (helper != null)
					helper.handleMouseWheelScrolled(event);
				part = part.getParent();
			} while (event.doit && part != null);
		}
	}
*/


/**
 * @author jiangqifan
 * @since 2013-4-16
 */
COM.gef.FeedbackLayer = function FeedbackLayer(type) {
    
    COM.gef.FeedbackLayer.superclass.constructor.call(this);
    this.setEnabled(false);
}

COM.gef.FeedbackLayer.extend(Layer,{
    getPreferredSize: function (wHint,hHint) {
        var rect = new Rectangle();
        for (var i = 0; i < this.getChildren().length; i++)
                rect.union((this.getChildren()[i]).getBounds());
        return rect.getSize();
    }
});

/**
 * @author jiangqifan
 * @since 2013-4-19
 * @abstract
 */
COM.gef.AbstractEditPart = function AbstractEditPart(id) {
    
    COM.gef.AbstractEditPart.superclass.constructor.call(this);
    this.model = null;
    this.flags = 0;
    this.parent = null;
    this.selected = 0;
    this.policies = [];
    this.children = [];
    this.eventListeners = new EventListenerList(); //COM.draw2d.EventListenerList;
}

COM.gef.AbstractEditPart.extend(COM.gef.EditPart,{
    activate: function () {
        this.setFlag(COM.gef.AbstractEditPart.FLAG_ACTIVE, true); //COM.gef.AbstractEditPart
        this.activateEditPolicies();
        var c = this.getChildren();
        for (var i = 0; i < c.length; i++) {
            c[i].activate();
        }
        this.fireActivated();
    },
    activateEditPolicies: function () {
        for (var i = 1; i< this.policies.length; i += 2) {
            this.policies[i].activate();
        }
    },
    addChild: function (child, index) {
        if (!child) {
            throw {'type':'空值','message':'child为空.'};
        }
        if (index >= 0) {
            this.getChildren().splice(index,0,child);
        } else {
            index = this.children.length;
            this.getChildren().push(child);
        }
        child.setParent(this);
        this.addChildVisual(child, index);
        child.addNotify();
        if (this.isActive()) {
            child.activate();
        }
        this.fireChildAdded(child, index);
    },
    addChildVisual: Function.needOverride,
    
    addEditPartListener: function (listener) {
        this.eventListeners.addListener('EditPartListener', listener);      //EditPartListener
    },
    
    addNotify: function () {
        this.register();
        this.createEditPolicies();
        var children = this.getChildren();
        for (var i = 0; i< children.length; i++) {
            children[i].addNotify();
        }
        this.refresh();
    },
    
    createChild: function (model) {
        return this.getViewer().getEditPartFactory().createEditPart(this, model);
    },
    
    createEditPolicies: Function.needOverride,
    
    deactivate: function () {
        var c = this.getChildren();
        for (var i = 0; i < c.length; i++) {
            c[i].deactivate();
        }
        this.deactivateEditPolicies();
        this.setFlag(COM.gef.AbstractEditPart.FLAG_ACTIVE, false);          //COM.gef.AbstractEditPart
        this.fireDeactivated();
    },
    
    deactivateEditPolicies: function () {
        for (var i = 1; i< this.policies.length; i += 2) {
            this.policies[i].deactivate();
        }
    },
    
    eraseSourceFeedback: function (request) {
        if (this.isActive()) {
            for (var i = 1; i< this.policies.length; i += 2) {
                this.policies[i].eraseSourceFeedback(request);
            } 
        }
    },
    
    eraseTargetFeedback: function (request) {
        if (this.isActive()) {
            for (var i = 1; i< this.policies.length; i += 2) {
                this.policies[i].eraseTargetFeedback(request);
            } 
        }
    },
    
    fireActivated: function () {
        var listeners = this.getEventListeners('EditPartListener');  //EditPartListener
        while (listeners.hasNext()) {
             listeners.next().partActivated(this);
        }
    },
    
    fireChildAdded: function (child, index) {
        var listeners = this.getEventListeners('EditPartListener');     //EditPartListener
        while (listeners.hasNext()) {
             listeners.next().childAdded(child,index);
        }
    },
    
    fireDeactivated: function () {
        var listeners = this.getEventListeners('EditPartListener');     //EditPartListener
        while (listeners.hasNext()) {
             listeners.next().partDeactivated(this);
        }
    },
    
    fireRemovingChild: function (child, index) {
        var listeners = this.getEventListeners('EditPartListener');     //EditPartListener
        while (listeners.hasNext()) {
             listeners.next().removingChild(child,index);
        }
    },
    
    fireSelectionChanged: function () {
        var listeners = this.getEventListeners('EditPartListener');     //EditPartListener
        while (listeners.hasNext()) {
             listeners.next().selectedStateChanged(this);
        }
    },
    
    getChildren: function () {
        if (this.children == null) {
            this.children = [];
        }
        return this.children;
    },
    
    getCommand: function (request) {
        var command = null;
        
        for (var i = 1; i< this.policies.length; i += 2) {
            if (command != null) {
                command = command.chain(this.policies[i].getCommand(request));
            } else {
                command = this.policies[i].getCommand(request);
            }
        } 
        return command;
    },
    
    getEventListeners: function (clazz) {
        return this.eventListeners.getListeners(clazz);
    },
    
    getEditPolicy: function (key) {
        if (this.policies != null) {
            for (var i = 0; i < this.policies.length; i += 2) {
                if (this.policies[i] === key) {
                    return this.policies[i + 1];
                }
            }
        }
        return null;
    },
    
    getFlag: function (flag) {
        return (this.flags & flag) != 0;
    },
    
    getModel: function () {
        return this.model;
    },
    
    getModelChildren: function () {
        return [];
    },
    
    getParent: function () {
        return this.parent;
    },
    
    getRoot: function () {
        if (this.getParent() == null) {
            return null;
        }
        return this.getParent().getRoot();
    },
    
    getSelected: function () {
        return this.selected;
    },
    
    getTargetEditPart: function (request) {
        var editPart;
        for (var i = 1; i < this.policies.length; i += 2) {
           editPart = this.policies[i].getTargetEditPart(request);
           if (editPart != null) {
               return editPart;
           }
        }
        
        if (COM.gef.RequestConstants.REQ_SELECTION == request.getType()) { //COM.gef.RequestConstants
            if (this.isSelectable()) {
                return this;
            }
        }
        return null;
    },
    
    getViewer: function () {
        var root = this.getRoot();
        if (root == null) {
            return null;
        }
        return root.getViewer();
    },
    
    hasFocus: function () {
        return this.getFlag(COM.gef.AbstractEditPart.FLAG_FOCUS);   //COM.gef.AbstractEditPart
    },
    
    installEditPolicy: function (key, editPolicy) {
        if (key == null) {
            throw {'type':'空值','message':'key为空'};
        }
        if (this.policies == null) {
            this.policies = [];
            this.policies.push(key);
            this.policies.push(editPolicy);
        } else {
            var index = 0;
            while (index < this.policies.length && key !== this.policies[index]) {
                index += 2;
            }
            if (index < this.policies.length) {
                index ++;
                var old = this.policies[index];
                if (old != null && this.isActive()) {
                    old.deactivate();
                }
               this.policies[index] = editPolicy;
            } else {
                this.policies.push(key);
                this.policies.push(editPolicy);
            }
        }
        
        if (editPolicy != null) {
            editPolicy.setHost(this);
            if (this.isActive()) {
                editPolicy.activate();
            }
        }
    },
    
    isActive: function () {
        return this.getFlag(COM.gef.AbstractEditPart.FLAG_ACTIVE);  //COM.gef.AbstractEditPart
    },
    
    isSelectable: function () {
        return true;
    },
    
    performRequest: Function.emptyFunction,
    
    refresh: function () {
        this.refreshVisuals();
        this.refreshChildren();
    },
    
    refreshChildren: function () {
        var i;
        var editPart;
        var model;
        var children = this.getChildren();
        var size = children.length;
        var trash;
        var ep;
        
        var modelToEditPart = new Map();
        
        if (size > 0) {
            for (i = 0; i < size; i++) {
                editPart = children[i];
                modelToEditPart.put(editPart.getModel(), editPart);
            }
        }
        
        var modelObjects = this.getModelChildren();
        for (i = 0; i < modelObjects.length; i++) {
            model = modelObjects[i];
            //model与editPart位置相同
            if (i < children.length && children[i].getModel() === model) {
                continue;
            }
            editPart = modelToEditPart.get(model);
            
            if (editPart != null) {
                //位置不同，调整位置
                this.reorderChild(editPart, i);
            } else {
                //没有editPart,创建并加入
                editPart = this.createChild(model);
                this.addChild(editPart, i);
            }
        }
        
        //移出多余的editPart
        size = children.length;
        if (i < size) {
            trash = [];
            for (; i < size; i++) {
                trash.push(children[i]);
            }
            for (i = 0; i < trash.length; i ++) {
                ep = trash[i];
                this.removeChild(ep);
            }
        }
    },
    
    refreshVisuals: Function.emptyFunction,
    
    register: function () {
        this.registerModel();
        this.registerVisuals();
    },
    
    registerModel: function () {
        this.getViewer().getEditPartRegistry().put(this.getModel(), this);
    },
    
    registerVisuals: Function.emptyFunction,
    
    removeChild: function (child) {
        if (child == null) {
            throw {'type':'空值','messag':'child为空'};
        }
        var index = COM.Util.Array.indexOf(this.getChildren(),child);
        if (index < 0) {
            return;
        }
        
        this.fireRemovingChild(child, index);
        if (this.isActive()) {
            child.deactivate();
        }
        child.removeNotify();
        this.removeChildVisual(child);
        child.setParent(null);
        this.getChildren().remove(child);
    },
    
    removeChildVisual: Function.needOverride,
    
    removeEditPartListener: function (listener) {
        this.eventListeners.removeListener('EditPartListener', listener);       //EditPartListener
    },
    
    removeEditPolicy: function (key) {
        if (this.policies == null) {
            return;
        }
        for (var i = 0; i < this.policies.length; i += 2) {
            if (key === this.policies[i]) {
                i++;
                var policy = this.policies[i];
                this.policies[i] = null;
                if (this.isActive() && policy != null) {
                    policy.deactivate();
                }
            }
        }
    },
    
    removeNotify: function () {
        if (this.getSelected() != COM.gef.EditPart.SELECTED_NONE) { //COM.gef.EditPart
            this.getViewer().deselect(this);
        }
        if (this.hasFocus()) {
            this.getViewer().setFocus(null);
        }
        var children = this.getChildren();
        for (var i = 0; i < children.length; i++) {
            children[i].removeNotify();
        }
        this.unregister();
    },
    
    reorderChild: function (editpart, index) {
        this.removeChildVisual(editpart);
        var children = this.getChildren();
        COM.Util.Array.remove(children, editpart);
        COM.Util.Array.add(children,editpart,index);
        this.addChildVisual(editpart, index);
    },
    
    setFlag: function (flag, value) {
        if (value) {
            this.flags |= flag;
        } else {
            this.flags &= ~flag;
        }
    },
    
    setFocus: function (value) {
        if ( !this.isSelectable() && value) {
            throw {'type':'非法操作','message':'不能将一个不可选的editPart设为焦点'};
        }
        if (this.hasFocus() === value) {
            return;
        }
        this.setFlag(COM.gef.AbstractEditPart.FLAG_FOCUS, value);       //COM.gef.AbstractEditPart
        this.fireSelectionChanged();
    },
    
    setModel: function (model) {
        this.model = model;
    },
    
    setParent: function (parent) {
        this.parent = parent;
    },
    
    setSelected: function (value) {
        if ( !isSelectable() && value != SELECTED_NONE) {
            throw {'type':'非法操作','message':'不能选中一个不可选的editPart'};
        }
        if (this.selected === value) {
            return ;
        }
        this.selected = value;
        this.fireSelectionChanged();
    },
    
    showSourceFeedback: function (request) {
        if (!this.isActive()) {
            return;
        }
        for (var i = 1; i< this.policies.length; i += 2) {
            this.policies[i].showSourceFeedback(request);
            
        }
    },
    
    showTargetFeedback: function (request) {
        if (!this.isActive()) {
            return;
        }
        for (var i = 1; i< this.policies.length; i += 2) {
            this.policies[i].showTargetFeedback(request);
            
        }
    },
    
    toString: function () {
        var c = 'COM.gef.AbstractEditPart'+'('+this.getModel()+')';     //$NON-NLS-2$//$NON-NLS-1$
        return c;
    },
    
    understandsRequest: function (req) {
        for (var i = 1; i< this.policies.length; i += 2) {
            if (this.policies[i].understandsRequest(req)) {
                return true;
            }
        }
        return false;
    },
    
    unregister: function () {
        this.unregisterVisuals();
        this.unregisterModel();
    },
    
    unregisterModel: function () {
        var registry = this.getViewer().getEditPartRegistry();
        if (registry.get(this.getModel()) === this) {
            registry.remove(this.getModel());
        }
    },
    
    unregisterVisuals: Function.emptyFunction
});

COM.gef.AbstractEditPart.FLAG_ACTIVE = 1;
COM.gef.AbstractEditPart.FLAG_FOCUS = 2;
COM.gef.AbstractEditPart.MAX_FLAG = COM.gef.AbstractEditPart.FLAG_FOCUS;


/**
 * @author jiangqifan
 * @since 2013-4-22
 * @abstract
 */
COM.gef.AbstractGraphicalEditPart = function AbstractGraphicalEditPart() {
    COM.gef.AbstractGraphicalEditPart.superclass.constructor.call(this);
    this.figure = null;
    this.sourceConnections = null;
    this.targetConnections = null;
}

COM.gef.AbstractGraphicalEditPart.extend(COM.gef.AbstractEditPart,{
    activate: function () {
        COM.gef.AbstractGraphicalEditPart.superclass.activate.call(this);
        var l = this.getSourceConnections();
        for (var i = 0; i < l.length; i++) {
            l[i].activate();
        }
    },
    addChildVisual: function (childEditPart, index) {
        var child = childEditPart.getFigure();
        this.getContentPane().add(child, index);
    },
    addNodeListener: function (listener) {
        this.eventListeners.addListener('NodeListener', listener);      //NodeListener
    },
    addNotify: function () {
        COM.gef.AbstractGraphicalEditPart.superclass.addNotify.call(this);
        var conns;
        var i;
        conns = this.getSourceConnections();
        for (i = 0; i < conns.length; i ++) {
            conns[i].setSource(this);
        }
        conns = this.getTargetConnections();
        for (i = 0; i < conns.length; i ++) {
            conns[i].setTarget(this);
        }
    },
    addSourceConnection: function (connection, index) {
        this.primAddSourceConnection(connection, index);
        var source = connection.getSource();
        if (source != null) {
            COM.Util.Array.remove(source.getSourceConnections(),connection);
        }
        connection.setSource(this);
        if (this.isActive()) {
            connection.activate();
        }
        this.fireSourceConnectionAdded(connection, index);
    },
    addTargetConnection: function (connection, index) {
        this.primAddTargetConnection(connection, index);
        var target = connection.getTarget();
        if (target != null) {
            COM.Util.Array.remove(target.getTargetConnections(),connection);
        }
        connection.setTarget(this);
        this.fireTargetConnectionAdded(connection, index);
    },
    createConnection: function (model) {
        return this.getViewer().getEditPartFactory().createEditPart(this, model);
    },
    createFigure: Function.needOverride,
    createOrFindConnection: function (model) {
        var conx = this.getViewer().getEditPartRegistry().get(model);
        if (conx != null) {
            return conx;
        }
        return this.createConnection(model);
    },
    deactivate: function () {
        var l = this.getSourceConnections();
        for (var i = 0; i < l.length; i++) {
            l[i].deactivate();
        }
        COM.gef.AbstractGraphicalEditPart.superclass.deactivate.call(this);
    },
    fireRemovingSourceConnection: function (connection, index) {
        if (this.eventListeners == null) {
            return;
        }
        var listeners = this.eventListeners.getListeners('NodeListener');   //NodeListener
        var listener = null;
        while (listeners.hasNext()) {
            listener = listeners.next();
            listener.removingSourceConnection(connection, index);
        }
    },
    fireRemovingTargetConnection: function (connection, index) {
        if (this.eventListeners == null) {
            return;
        }
        var listeners = this.eventListeners.getListeners('NodeListener');   //NodeListener
        var listener = null;
        while (listeners.hasNext()) {
            listener = listeners.next();
            listener.removingTargetConnection(connection, index);
        }
    },
    fireSourceConnectionAdded: function (connection, index) {
         if (this.eventListeners == null) {
            return;
        }
        var listeners = this.eventListeners.getListeners('NodeListener');   //NodeListener
        var listener = null;
        while (listeners.hasNext()) {
            listener = listeners.next();
            listener.sourceConnectionAdded(connection, index);
        }
    },
    fireTargetConnectionAdded: function (connection, index) {
         if (this.eventListeners == null) {
            return;
        }
        var listeners = this.eventListeners.getListeners('NodeListener');   //NodeListener
        var listener = null;
        while (listeners.hasNext()) {
            listener = listeners.next();
            listener.targetConnectionAdded(connection, index);
        }
    },
    getContentPane: function () {
        return this.getFigure();
    },
    getDragTracker: function (request) {
        return new COM.gef.DragEditPartsTracker(this);          //COM.gef.DragEditPartsTracker
    },
    getFigure: function () {
        if (this.figure == null) {
            this.setFigure(this.createFigure());
        }
        return this.figure;
    },
    getLayer: function (layer) {
        var manager = this.getViewer().getEditPartRegistry().get(COM.gef.LayerManager.ID); // COM.gef.LayerManager
        return manager.getLayer(layer);  
    },
    getModelSourceConnections: function () {
        return [];
    },
    getModelTargetConnections: function () {
        return [];
    },
    getSourceConnections: function () {
        if (this.sourceConnections == null) {
            return [];
        }
        return this.sourceConnections;
    },
    getTargetConnections: function () {
        if (this.targetConnections == null) {
            return [];
        }
        return this.targetConnections;
    },
    isSelectable: function () {
        var superSelectable = COM.gef.AbstractGraphicalEditPart.superclass.isSelectable.call(this);
        return superSelectable && this.getFigure() != null && this.getFigure().isShowing();
    },
    primAddSourceConnection: function (connection, index) {
        if (this.sourceConnections == null) {
            this.sourceConnections = [];
        }
        COM.Util.Array.add(this.sourceConnections, connection, index);
    },
    primAddTargetConnection: function (connection , index) {
        if (this.targetConnections == null) {
            this.targetConnections = [];
        }
        COM.Util.Array.add(this.targetConnections, connection, index);
    },
    primRemoveSourceConnection: function (connection) {
        COM.Util.Array.remove(this.sourceConnections, connection);
    },
    primRemoveTargetConnection: function (connection) {
         COM.Util.Array.remove(this.targetConnections, connection);
    },
    refresh: function () {
        COM.gef.AbstractGraphicalEditPart.superclass.refresh.call(this);
        this.refreshSourceConnections();
        this.refreshTargetConnections();
    },
    refreshSourceConnections: function () {
        var i;
        var editPart;
        var model;
        var sourceConnections = this.getSourceConnections();
        var size = sourceConnections.length;
        var modelToEditPart = new Map();                                //Map
        if (size > 0) {
            for (i = 0; i < size; i++) {
                editPart = sourceConnections[i];
                modelToEditPart.put(editPart.getModel(), editPart);
            }
        }
        var  modelObjects = this.getModelSourceConnections();
        if (modelObjects == null) {
            modelObjects = [];
        }
        for (i = 0; i < modelObjects.length; i++) {
            model = modelObjects[i];
            if (i < sourceConnections.length && sourceConnections[i].getModel() === model) {
                continue;
            }
            editPart = modelToEditPart.get(model);
            if (editPart != null) {
                this.reorderSourceConnection(editPart, i);
            } else {
                editPart = this.createOrFindConnection(model);
                this.addSourceConnection(editPart, i);
            }
            
        }
        size = sourceConnections.length;
        if (i < size) {
            var trash = [];
            for (; i < size; i++) {
                trash.push(sourceConnections[i]);
            }
            for (i = 0; i < trash.length; i++) {
                this.removeSourceConnection(trash[i]);
            }
        }
    },
    refreshTargetConnections: function () {
        var i;
        var editPart;
        var model;
        var targetConnections = this.getTargetConnections();
        var size = targetConnections.length;
        var modelToEditPart = new Map();                                //Map
        if (size > 0) {
            for (i = 0; i < size; i++) {
                editPart = this.targetConnections.get(i);
                modelToEditPart.put(editPart.getModel(), editPart);
            }
        }
        var modelObjects = this.getModelTargetConnections();
        if (modelObjects == null) {
            modelObjects = [];
        }
        for (i = 0; i < modelObjects.length; i++) {
            model = modelObjects[i];
            if (i < targetConnections.length && targetConnections[i].getModel() === model)  {
                continue;
            }
            editPart = modelToEditPart.get(model);
            if (editPart != null) {
                this.reorderTargetConnection(editPart, i);
            } else {
                editPart = this.createOrFindConnection(model);
                this.addTargetConnection(editPart, i);
            }
        }
        
        size = targetConnections.length;
        if (i < size) {
            var trash = [];
            for (; i < size; i++) {
                trash.push(targetConnections[i]);
            }
            for (i = 0; i < trash.length; i++) {
                this.removeTargetConnection(trash[i]);
            }
        }
    },
    registerVisuals: function () {
        this.getViewer().getVisualPartMap().put(this.getFigure(), this);
    },
    removeChildVisual: function (childEditPart) {
        var child = childEditPart.getFigure();
        this.getContentPane().remove(child);
    },
    removeNodeListener: function (listener) {
        this.eventListeners.removeListener('NodeListener', listener);           //NodeListener
    },
    removeNotify: function () {
        var conns;
        var cep;
        conns = this.getSourceConnections();
        for (var i = 0; i < conns.length; i++) {
            cep = [i];
            if (cep.getSource() === this) {
                cep.setSource(null);
            }
        }
        conns = this.getTargetConnections();
        for (var i = 0; i < conns.length; i++) {
            cep = conns[i];
            if (cep.getTarget() === this) {
                cep.setTarget(null);
            }
        }
        COM.gef.AbstractGraphicalEditPart.superclass.removeNotify.call(this);
    },
    removeSourceConnection: function (connection) {
        this.fireRemovingSourceConnection(connection, COM.Util.Array.indexOf(this.getSourceConnections(),connection));
        if (connection.getSource() === this) {
            connection.deactivate();
            connection.setSource(null);
        }
        this.primRemoveSourceConnection(connection);
    },
    removeTargetConnection: function (connection) {
        this.fireRemovingTargetConnection(connection, COM.Util.Array.indexOf(this.getTargetConnections(),connection));
        if (connection.getTarget() === this) {
            connection.setTarget(null);
        }
        this.primRemoveTargetConnection(connection);
    },
    reorderChild: function (child, index) {
        var childFigure = child.getFigure();
        var layout = this.getContentPane().getLayoutManager();
        var constraint = null;
        if (layout != null) {
                constraint = layout.getConstraint(childFigure);
        }
        COM.gef.AbstractGraphicalEditPart.superclass.reorderChild.call(this,child, index);
        this.setLayoutConstraint(child, childFigure, constraint);
    },
    reorderSourceConnection: function (connection, index) {
        this.primRemoveSourceConnection(connection);
        this.primAddSourceConnection(connection, index);
    },
    reorderTargetConnection: function (connection, index) {
        this.primRemoveTargetConnection(connection);
        this.primAddTargetConnection(connection, index);
    },
    setFigure: function (figure) {
        this.figure = figure;
    },
    setLayoutConstraint: function (child, childFigure, constraint) {
        childFigure.getParent().setConstraint(childFigure, constraint);
    },
    unregisterVisuals: function () {
        this.getViewer().getVisualPartMap().remove(this.getFigure());
    }
});
/**
 * @author jiangqifan
 * @since 2013-4-22
 */
COM.gef.SimpleRootEditPart = function SimpleRootEditPart() {
    COM.gef.SimpleRootEditPart.superclass.constructor.call(this);
    this.contents = null;
    this.viewer = null;
}

COM.gef.SimpleRootEditPart.extend(COM.gef.AbstractGraphicalEditPart,{
    createEditPolicies: Function.emptyFunction,
    createFigure: function () {
        var figure = new Figure('simpleRootEditPart-figure');                      //Figure
        figure.setBackgroundColor(new Color(10,200,10)); //Color
        figure.setOpaque(true);
        figure.setLayoutManager(new StackLayout());     //StackLayout
        return figure;
    },
    getCommand: function (req) {
        var command = new Command();
        command.canExecute = function () {
            return false;
        };
        command.canUndo = function () {
            return false;
        };
        return command;
    },
    getContents: function () {
        return this.contents;
    },
    getRoot: function () {
        return this;
    },
    getViewer: function () {
        return this.viewer;
    },
    refreshChildren: Function.emptyFunction,
    setContents: function (editpart) {
        if (this.contents === editpart) {
            return;
        }
        if (this.contents != null) {
            this.removeChild(this.contents);
        }
        this.contents = editpart;
        if (this.contents != null) {
            this.addChild(this.contents, 0);
        }
    },
    setViewer: function (newViewer) {
        if (this.viewer === newViewer) {
            return;
        }
        if (this.viewer != null) {
            this.unregister();
        }
        this.viewer = newViewer;
        if (this.viewer != null) {
            this.register();
        }
    }
});
/**
 * @author jiangqifan
 * @since 2013-4-23
 */
COM.gef.ScalableRootEditPart = function ScalableRootEditPart() {
    COM.gef.ScalableRootEditPart.superclass.constructor.call(this);
    this.innerLayers = null;
    this.printableLayers = null;
    this.scaledLayers = null;
    // this.gridListener = {propertyChange: function (evt) {
//         
    // }};
}

COM.gef.ScalableRootEditPart.extend(COM.gef.SimpleRootEditPart,{
     createFigure: function () {
         var viewport = this.createViewport();
         this.innerLayers = new LayeredPane();          //LayeredPane
         this.createLayers(this.innerLayers);
         viewport.setContents(this.innerLayers);
         return viewport;
     },
     createGridLayer: function () {
       return new COM.gef.GridLayer();              //COM.gef.GridLayer
     },
     createLayers: function (layeredPane) {
         layeredPane.add(this.getScaledLayers(), COM.gef.LayerConstants.SCALABLE_LAYERS);           //COM.gef.LayerConstants.SCALABLE_LAYERS
         layeredPane.add((function (){
             var l = new Layer();
             l.getPreferredSize = function (wHint, hHint) {
                 return new Dimension();
             }
             return l;
         })(),COM.gef.LayerConstants.HANDLE_LAYER);
         layeredPane.add(new COM.gef.FeedbackLayer(), COM.gef.LayerConstants.FEEDBACK_LAYER);
         // layeredPane.add(new GuideLayer(), COM.gef.LayerConstants.GUIDE_LAYER);
     },
     createPrintableLayers: function () {
         var pane = new LayeredPane();                                          //LayeredPane
         var layer = new Layer();                                               //Layer
         layer.setLayoutManager(new StackLayout());                             //StackLayout
         pane.add(layer, COM.gef.LayerConstants.PRIMARY_LAYER);
         layer = new ConnectionLayer();                                         //ConnectionLayer
         layer.setPreferredSize(new Dimension(5, 5));                           //Dimension
         pane.add(layer, COM.gef.LayerConstants.CONNECTION_LAYER);
         
         return pane;
     },
     createScaledLayers: function () {
         function FeedbackLayer() {
             COM.gef.FeedbackLayer.superclass.constructor.call(this);
             this.setEnabled(false);
         }
         FeedbackLayer.extend(Layer,{
             getPreferredSize: function (wHint, hHint) {
                 var rect = new Rectangle();
                 var children = this.getChildren();
                 for (var i = 0; i < children.length; i++) {
                     rect.union(children[i].getBounds());
                 }
                 return rect.getSize();
             }
         });
         var layers = new ScalableLayeredPane();                                    //ScalableLayeredPane
         // layers.add(this.createGridLayer(), COM.gef.LayerConstants.GRID_LAYER);      //COM.gef.LayerConstants.GRID_LAYER
         layers.add(this.getPrintableLayers(), COM.gef.LayerConstants.PRINTABLE_LAYERS);            //COM.gef.LayerConstants.PRINTABLE_LAYERS
         layers.add(new FeedbackLayer(), COM.gef.LayerConstants.SCALED_FEEDBACK_LAYER);            //FeedbackLayer  COM.gef.LayerConstants.SCALED_FEEDBACK_LAYER
         return layers;
     },
     createViewport: function () {
         return new Viewport(true);                                               //Viewport
     },
     getContentPane: function () {
         return this.getLayer(COM.gef.LayerConstants.PRIMARY_LAYER);              //COM.gef.LayerConstants.PRIMARY_LAYER
     },
     getDragTracker: function (req) {
         return new MarqueeDragTracker();                                         //MarqueeDragTracker
     },
     getLayer: function (key) {
         if (this.innerLayers == null) {
             return null;
         }
         var layer = this.scaledLayers.getLayer(key);
         if (layer != null) {
             return layer;
         }
         layer = this.printableLayers.getLayer(key);
         if (layer != null) {
             return layer;
         }
         return this.innerLayers.getLayer(key);
     },
     getModel: function () {
         return COM.gef.LayerManager.ID;                                           //COM.gef.LayerManager
     },
     getPrintableLayers: function () {
         if (this.printableLayers == null) {
             this.printableLayers = this.createPrintableLayers();
         }
         return this.printableLayers;
     },
     getScaledLayers: function () {
         if (this.scaledLayers == null) {
             this.scaledLayers = this.createScaledLayers();
         }
         return this.scaledLayers;
     },
     getZoomManager: function () {
         return this.zoomManager;
     },
     refreshGridLayer: function () {
         //TODO
     },
     register: function () {
         COM.gef.ScalableRootEditPart.superclass.register.call(this);
        // this.getViewer().setProperty('ZoomManager', this.getZoomManager());
        if (this.getLayer(COM.gef.LayerConstants.GRID_LAYER) != null) {             //COM.gef.LayerConstants.GRID_LAYER
            this.getViewer().addPropertyChangeListener(this.gridListener);
            this.refreshGridLayer();
        }
     },
     unregister: function () {
        this.getViewer().removePropertyChangeListener(this.gridListener);
        COM.gef.ScalableRootEditPart.superclass.unregister.call(this);
        // this.getViewer().setProperty('ZoomManager', null);
    }
});
/**
 * @author jiangqifan
 * @since 2013-4-22
 */
COM.gef.FreeformGraphicalRootEditPart = function FreeformGraphicalRootEditPart() {
    COM.gef.FreeformGraphicalRootEditPart.superclass.constructor.call(this);
    this.innerLayers = null;
    this.printableLayers = null;
    this.gridListener = {};
    // var that = this;
    // this.gridListener.propertyChange = function (evt) {
        // var property = evt.getPropertyName();
        // if (property === SnapToGrid.PROPERTY_GRID_ORIGIN || property === SnapToGrid.PROPERTY_GRID_SPACING || property === SnapToGrid.PROPERTY_GRID_VISIBLE) {
            // that.refreshGridLayer();
        // }
    // }
}

COM.gef.FreeformGraphicalRootEditPart.extend(COM.gef.SimpleRootEditPart,{
    createFigure: function () {
        var viewport = new FreeformViewport();          //      FreeformViewport
        this.innerLayers = new FreeformLayeredPane();        //      FreeformLayeredPane
        this.createLayers(this.innerLayers);                
        viewport.setContents(this.innerLayers);
        return viewport;
    },
    createGridLayer: function () {
        return new GridLayer();                 //GridLayer
    },
    createLayers: function (layeredPane) {
        // layeredPane.add(this.createGridLayer(), COM.gef.LayerConstants.GRID_LAYER);
        layeredPane.add(this.getPrintableLayers(), COM.gef.LayerConstants.PRINTABLE_LAYERS);
        layeredPane.add(new FreeformLayer(), COM.gef.LayerConstants.HANDLE_LAYER);         //FreeformLayer
        layeredPane.add(new COM.gef.FeedbackLayer(), COM.gef.LayerConstants.FEEDBACK_LAYER);        //COM.gef.FeedbackLayer
        // layeredPane.add(new GuideLayer(), COM.gef.LayerConstants.GUIDE_LAYER);             //GuideLayer
    },
    createPrintableLayers: function () {
        var layeredPane = new FreeformLayeredPane();        //FreeformLayeredPane
        layeredPane.add(new FreeformLayer(), COM.gef.LayerConstants.PRIMARY_LAYER);     //FreeformLayeredPane
        layeredPane.add(new ConnectionLayer(), COM.gef.LayerConstants.CONNECTION_LAYER);       //ConnectionLayer
        return layeredPane;
    },
    getContentPane: function () {
        return this.getLayer(COM.gef.LayerConstants.PRIMARY_LAYER);
    },
    getDragTracker: function (req) {
        return new COM.gef.MarqueeDragTracker();            //COM.gef.MarqueeDragTracker
    },
    getLayer: function (key) {
        if (this.innerLayers == null) {
            return null;
        }
        var layer = this.innerLayers.getLayer(key);
        if (layer != null) {
            return layer;
        }
        if (this.printableLayers == null) {
            return null;
        }
        return this.printableLayers.getLayer(key);
    },
    getModel: function () {
        return COM.gef.LayerManager.ID;         //COM.gef.LayerManager
    },
    getPrintableLayers: function () {
        if (this.printableLayers == null) {
            this.printableLayers = this.createPrintableLayers();
        }
        return this.printableLayers;
    },
    refreshGridLayer: function () {
        // var visible = false;
        // var grid = this.getLayer(COM.gef.LayerConstants.GRID_LAYER);
        // var val = this.getViewer().getProperty(COM.gef.SnapToGrid.PROPERTY_GRID_VISIBLE);
        // if (val != null) {
            // visible = val;
        // }
        // grid.setOrigin(this.getViewer().getProperty(COM.gef.SnapToGrid.PROPERTY_GRID_ORIGIN));
        // grid.setSpacing(this.getViewer().getProperty(COM.gef.SnapToGrid.PROPERTY_GRID_SPACING));
        // grid.setVisible(visible);
    },
    register: function () {
        COM.gef.FreeformGraphicalRootEditPart.superclass.register.call(this);
        if (this.getLayer(COM.gef.LayerConstants.GRID_LAYER) != null) {
            this.getViewer().addPropertyChangeListener(this.gridListener);
            this.refreshGridLayer();
        }
    },
    unregister: function () {
        this.getViewer().removePropertyChangeListener(this.gridListener);
        COM.gef.FreeformGraphicalRootEditPart.superclass.unregister.call(this);
    }
});


COM.gef.FeedbackLayer = function (id) {
    COM.gef.FeedbackLayer.superclass.constructor.call(this);
    // var rect = new RectangleFigure();
    // rect.setBackgroundColor(new Color(10,200,10)); //Color
    // rect.setOpaque(true);
    // this.add(rect,new Rectangle(10,10,50,50));
    this.setEnabled(false);
}
COM.gef.FeedbackLayer.extend(FreeformLayer,{});      //FreeformLayer
/**
 * @author jiangqifan
 * @since 2013-4-23
 * @abstract
 */
COM.gef.AbstractTool = function AbstractTool() {
    
    COM.gef.AbstractTool.superclass.constructor.call(this);
    this.flags = 0;
    this.accessibleBegin = null;
    this.accessibleStep = null;
    this.command = null;
    var that = this;
    this.commandStackListener = { stackChanged: function(event){
        if (event.isPreChangeEvent()) {
            that.handleCommandStackChanged();
        }
    }};
    this.current = null;
    this.currentViewer = null;
    this.defaultCursor = null;
    this.disabledCursor = null;
    this.domain = null;
    this.operationSet = null;
    this.startX = null;
    this.startY = null;
    this.state = null;
    this.property = {};
   
    this.setFlag(COM.gef.AbstractTool.FLAG_UNLOAD, true);       //COM.gef.AbstractTool.FLAG_UNLOAD
}

COM.gef.AbstractTool.extend(COM.gef.Tool,{
     //判断是否接收该键盘事件
     acceptAbort: function (e) {
         return e.charCode == KeyStroke.ESC;
     },
     acceptArrowKey: function (e) {
         var key = e.keyCode;
         //COM.gef.AbstractTool.STATE_INITIAL  COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS
         if (!(this.isInState(COM.gef.AbstractTool.STATE_INITIAL | COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG | COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS))) {
             return false;
         }
         // KeyStroke.ARROW_UP KeyStroke.ARROW_RIGHT KeyStroke.ARROW_DOWN KeyStroke.ARROW_LEFT
         return (key == KeyStroke.ARROW_UP) || (key == KeyStroke.ARROW_RIGHT) || (key == KeyStroke.ARROW_DOWN) || (key == KeyStroke.ARROW_LEFT);
     },
     acceptDragCommit: function (e) {
         //COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS
         return this.isInState(COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS) && e.character == 13;
     },
     accGetStep: function () {
         return this.accessibleStep;
     },
     accStepIncrement: function () {
         if (this.accessibleBegin == -1) {
            this.accessibleBegin = new Date().getTime();
            this.accessibleStep = 1;
         } else {
             this.accessibleStep = 4;
             var elapsed = new Date().getTime() - accessibleBegin;
             if (elapsed > 1000) {
                 this.accessibleStep = Math.min(16, (elapsed / 150) << 0);
             }
         }
         
     },
     accStepReset: function () {
         this.accessibleBegin = -1;
     },
     activate: function () {
         this.resetFlags();
         this.accessibleBegin = -1;
         this.getCurrentInput().verifyMouseButtons = true;
         this.setState(COM.gef.AbstractTool.STATE_INITIAL);         //COM.gef.AbstractTool.STATE_INITIAL
         this.setFlag(COM.gef.AbstractTool.FLAG_ACTIVE, true);         //COM.gef.AbstractTool.FLAG_ACTIVE
         this.getDomain().getCommandStack().addCommandStackEventListener(this.commandStackListener);
     },
     addFeedback: function (figure) {
        var lm = this.getCurrentViewer().getEditPartRegistry().get(COM.gef.LayerManager.ID);       //COM.gef.LayerManager.ID
        if (lm == null) {
            return;
        }
        lm.getLayer(COM.gef.LayerConstants.FEEDBACK_LAYER).add(figure);     //COM.gef.LayerConstants.FEEDBACK_LAYER
     },
     applyProperty: function (key, value) {
         if (COM.gef.AbstractTool.PROPERTY_UNLOAD_WHEN_FINISHED === key) {
            if (typeof value === "boolean") {
                this.setUnloadWhenFinished(value);
            }
            return;
         }
         if(typeof key !== "string"){
            return;
         }
         this.property[key] = value;
     },
     calculateCursor: function () {
         if (this.isInState(COM.gef.AbstractTool.STATE_TERMINAL)) { //COM.gef.AbstractTool.STATE_TERMINAL
             return null;
         }
         var command = this.getCurrentCommand();
         if (command == null || !command.canExecute()) {
             return this.getDisabledCursor();
         }
         return this.getDefaultCursor();
     },
     commitDrag: Function.emptyFunction,
     
     createOperationSet: function () {
         return this.getCurrentViewer().getSelectedEditParts();
     },
     deactivate: function () {
         this.setFlag(COM.gef.AbstractTool.FLAG_ACTIVE, false);     //COM.gef.AbstractTool.FLAG_ACTIVE
         this.setViewer(null);
         this.setCurrentCommand(null);
         this.setState(COM.gef.AbstractTool.STATE_TERMINAL);        //COM.gef.AbstractTool.STATE_TERMINAL
         this.operationSet = null;
         this.current = null;
         this.getDomain().getCommandStack().removeCommandStackEventListener(this.commandStackListener);
     },
     executeCommand: function (command) {
         this.getDomain().getCommandStack().removeCommandStackEventListener(this.commandStackListener);
         try {
            this.getDomain().getCommandStack().execute(command);
         } finally {
            this.getDomain().getCommandStack().addCommandStackEventListener(this.commandStackListener);
         }
     },
     executeCurrentCommand: function () {
         var curCommand = this.getCurrentCommand();
         if (curCommand != null && curCommand.canExecute()) {
             this.executeCommand(curCommand);
         }
         this.setCurrentCommand(null);
     },
     focusGained: function (event, viewer) {
         this.setViewer(viewer);
         this.handleFocusGained();
     },
     focusLost: function (event, viewer) {
         this.setViewer(viewer);
         this.handleFocusLost();
     },
     getCommand: function () {
         return COM.gef.UnexecutableCommand.INSTANCE;
     },
     getCommandName: Function.needOverride,
     getCurrentCommand: function () {
         return this.command;
     },
     getCurrentInput: function () {
         if (this.current == null) {
             this.current = new COM.gef.Input4Tool();
         }
         return this.current;
     },
     getCurrentViewer: function () {
         return this.currentViewer;
     },
     getDefaultCursor: function () {
         return this.defaultCursor;
     },
     getDisabledCursor: function () {
         if (this.disabledCursor != null) {
             return this.disabledCursor;
         }
         return this.getDefaultCursor();
     },
     getDomain: function () {
         return this.domain;
     },
     getDragMoveDelta: function () {
         return this.getLocation().getDifference(this.getStartLocation());
     },
     getLocation: function () {
         return new Point(this.getCurrentInput().getMouseLocation());            //Point
     },
     getOperationSet: function () {
         if (this.operationSet == null) {
             this.operationSet = this.createOperationSet();
         }
         return this.operationSet;
     },
     getStartLocation: function () {
         return new Point(this.startX, this.startY);                          //Point
     },
     getState: function () {
         return this.state;
     },
     handleButtonDown: function (button) {
         return false;
     },
     handleButtonUp: function (button) {
         return false;
     },
     handleCommandStackChanged: function () {
         //COM.gef.AbstractTool.STATE_INITIAL  COM.gef.AbstractTool.STATE_INVALID
         if (!this.isInState(COM.gef.AbstractTool.STATE_INITIAL | COM.gef.AbstractTool.STATE_INVALID)) {
            //COM.gef.AbstractTool.STATE_INVALID
            this.setState(COM.gef.AbstractTool.STATE_INVALID);
            this.handleInvalidInput();
            return true;
         }
         return false;
     },
     handleDoubleClick: function (button) {
         return false;
     },
     handleClick: function (button) {
         return false;
     },
     handleDrag: function () {
         return false;
     },
     handleDragInProgress: function () {
         return false;
     },
     handleDragStarted: function () {
         return false;
     },
     handleFinished: function () {
         if (this.unloadWhenFinished()){
             this.getDomain().loadDefaultTool();
         } else {
             this.reactivate();
         }
     },
     handleFocusGained: function () {
         return false;
     },
     handleFocusLost: function () {
         return false;
     },
     handleHover: function () {
         return false;
     },
     handleInvalidInput: function () {
         return false;
     },
     handleKeyDown: function (e) {
         if (this.acceptAbort(e)) {
            this.getDomain().loadDefaultTool();
            return true;
         }
         return false;
     },
     handleKeyPressed: function () {
          return false;
     },
     handleKeyTraversed: Function.emptyFunction,
     
     handleKeyUp: function (e) {
        return false;
     },
     
     handleMove: function () {
        return false;
     },
     
     handleNativeDragFinished: function (event) {
        return false;
     },
     
     handleNativeDragStarted: function (event) {
        return false;
     },
     handleViewerEntered: function () {
        return false;
     },
     handleViewerExited: function () {
         return false;
     },
     isActive: function () {
         return this.getFlag(COM.gef.AbstractTool.FLAG_ACTIVE);     //COM.gef.AbstractTool.FLAG_ACTIVE
     },
     isCurrentViewerMirrored: function () {
        return false;
     },
     isHoverActive: function () {
        return this.getFlag(COM.gef.AbstractTool.FLAG_HOVER);       //OM.gef.AbstractTool.FLAG_HOVER
     },
     isInDragInProgress: function () {
         //COM.gef.AbstractTool.STATE_DRAG_IN_PROGRESS      COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS
        return this.isInState(COM.gef.AbstractTool.STATE_DRAG_IN_PROGRESS | COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS);
     },
     isInputSynched: function (event) {
        var input = this.getCurrentInput();
        var mask = Mouse.getStatemark(event);               //Mouse
        return input.isMouseButtonDown(1) == ((mask & Mouse.BUTTON1) != 0) && input.isMouseButtonDown(2) == ((mask & Mouse.BUTTON2) != 0) && input.isMouseButtonDown(3) == ((mask & Mouse.BUTTON3) != 0) && input.isMouseButtonDown(4) == ((mask & Mouse.BUTTON4) != 0) && input.isMouseButtonDown(5) == ((mask & Mouse.BUTTON5) != 0);
     },
     isInState: function (state) {
        return ((this.getState() & state) != 0);
     },
     isViewerImportant: function (viewer){
        return true;
     },
     keyDown: function (evt, viewer) {
        if (!this.isViewerImportant(viewer)) {
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByKeyboard(evt);
        this.handleKeyDown(evt);
     },
     keyPressed: function (evt, viewer) {
    	 if (!this.isViewerImportant(viewer)) {
             return;
         }
         this.setViewer(viewer);
         this.getCurrentInput().setInputByKeyboard(evt);
         this.handleKeyPressed(evt);
     },
     keyTraversed: function (evt, viewer) {
        if (!this.isViewerImportant(viewer)) {
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByKeyboard(evt);
        this.handleKeyTraversed(evt);
     },
     keyUp: function (evt, viewer) {
        if (!this.isViewerImportant(viewer)) {
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByKeyboard(evt);
        this.handleKeyUp(evt);
     },
     mouseClick: function (me, viewer) {
        if (me.button > 5 || !this.isViewerImportant(viewer)) {
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByMouse(me,false);
        this.handleClick(Mouse.getMouseNumber(me));
     },
     mouseDoubleClick: function (me, viewer) {
        if (me.button > 5 || !this.isViewerImportant(viewer)) {
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByMouse(me,true);
        this.handleDoubleClick(Mouse.getMouseNumber(me));
     },
     mouseDown: function (me, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByMouse(me);
        this.getCurrentInput().setMouseButton(Mouse.getMouseNumber(me), true);      //Mouse
                
        this.startX = me.localX;
        this.startY = me.localY;
        
        this.handleButtonDown(Mouse.getMouseNumber(me));                //Mouse
     },
     
     mouseDrag: function (me, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.setViewer(viewer);
        var wasDragging = this.movedPastThreshold();
        this.getCurrentInput().setInputByMouse(me);
        this.handleDrag();
        if (this.movedPastThreshold()) {
            if (!wasDragging) {
                this.handleDragStarted();
            }
            this.handleDragInProgress();
        }
     },
     
    mouseHover: function (me, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByMouse(me);
        this.handleHover();
    },
    mouseMove: function (me, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.setViewer(viewer);
        if (!this.isInputSynched(me)) {
            var b1 = this.getCurrentInput().isMouseButtonDown(1);
            var b2 = this.getCurrentInput().isMouseButtonDown(2);
            var b3 = this.getCurrentInput().isMouseButtonDown(3);
            var b4 = this.getCurrentInput().isMouseButtonDown(4);
            var b5 = this.getCurrentInput().isMouseButtonDown(5);
            this.getCurrentInput().verifyMouseButtons = true;
            this.getCurrentInput().setInputByMouse(me);
            if (b1) this.handleButtonUp(1);
            if (b2) this.handleButtonUp(2);
            if (b3) this.handleButtonUp(3);
            if (b4) this.handleButtonUp(4);
            if (b5) this.handleButtonUp(5);
            if (this.getDomain().getActiveTool() != this){
                return;
            }
            this.setViewer(viewer);
        }else{
            this.getCurrentInput().setInputByMouse(me);
        }
        if (this.isInState(COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS)){    //COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS
             this.handleDragInProgress();
        }else{
            this.handleMove();
        }
    },
    mouseUp: function (me, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByMouse(me);
        this.getCurrentInput().setMouseButton(Mouse.getMouseNumber(me), false);
        this.handleButtonUp(Mouse.getMouseNumber(me));
    },
    touchStart: function (me, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByMouse(me);
        this.getCurrentInput().setMouseButton(Mouse.getMouseNumber(me), true);
                
        this.startX = me.localX;
        this.startY = me.localY;
        if (this.handleTouchStart) {
        	this.handleTouchStart();        	
        }
     },
     
     touchMove: function (me, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByMouse(me);
        if(this.handleTouchMove) {
        	this.handleTouchMove();
        }
     },
    touchEnd: function (me, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.setViewer(viewer);
        this.getCurrentInput().setInputByMouse(me);
        this.getCurrentInput().setMouseButton(Mouse.getMouseNumber(me), false);
        if (this.handleTouchEnd) {
        	this.handleTouchEnd();
        }
    },
    mouseWheelScrolled: function (event, viewer) {
        if (this.isInState(COM.gef.AbstractTool.STATE_INITIAL)) {       //COM.gef.AbstractTool.STATE_INITIAL
            this.performViewerMouseWheel(event, viewer);
        }
    },
    movedPastThreshold: function () {
        if (this.getFlag(COM.gef.AbstractTool.FLAG_PAST_THRESHOLD)) {       //COM.gef.AbstractTool.FLAG_PAST_THRESHOLD
            return true;
        }
        var start = this.getStartLocation(), end = this.getLocation();
        //COM.gef.AbstractTool.DRAG_THRESHOLD
        if (Math.abs(start.x - end.x) > COM.gef.AbstractTool.DRAG_THRESHOLD || Math.abs(start.y - end.y) > COM.gef.AbstractTool.DRAG_THRESHOLD) {
           //COM.gef.AbstractTool.FLAG_PAST_THRESHOLD
           this.setFlag(COM.gef.AbstractTool.FLAG_PAST_THRESHOLD, true);
           return true;
        }
        return false;
    },
    nativeDragFinished: function (event, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.setViewer(viewer);
        this.handleNativeDragFinished(event);
    },
    nativeDragStarted: function (event, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.setViewer(viewer);
        this.handleNativeDragStarted(event);
    },
    performViewerMouseWheel: function (event, viewer) {
        //TODO
    },
    placeMouseInViewer: function (p) {
        // if (this.getCurrentViewer() == null) {
            // return;
        // }
        // var c = this.getCurrentViewer().getControl();
        // var rect;
        // if (c instanceof Scrollable) {
            // rect = c..getClientArea();
        // }
        //TODO
    },
    reactivate: function () {
        var viewer = this.getCurrentViewer();
        this.deactivate();
        this.activate();
        if (viewer != null) {
            var c = viewer.getControl();
            if (c != null && !c.isDisposed() && c.isFocusControl()) {
                this.setViewer(viewer);
            }
        }
    },
    refreshCursor: function () {
        if (this.isActive()) {
            this.setCursor(this.calculateCursor());
        }
    },
    releaseToolCapture: function () {
        this.getCurrentViewer().setRouteEventsToEditDomain(false);
    },
    removeFeedback: function (figure) {
        var lm = this.getCurrentViewer().getEditPartRegistry().get(COM.gef.LayerManager.ID);    //COM.gef.LayerManager.ID
        if (lm == null) {
            return;
        }
        //COM.gef.LayerConstants.FEEDBACK_LAYER
        lm.getLayer(COM.gef.LayerConstants.FEEDBACK_LAYER).remove(figure);
    },
    resetFlags: function () {
        this.setFlag(COM.gef.AbstractTool.FLAG_PAST_THRESHOLD, false);
        this.setFlag(COM.gef.AbstractTool.FLAG_HOVER, false);
    },
    setCurrentCommand: function (c) {
        this.command = c;
        this.refreshCursor();
    },
    setCursor: function (cursor) {
        if (this.getCurrentViewer() != null) {
            this.getCurrentViewer().setCursor(cursor);
        }
    },
    setDefaultCursor: function (cursor) {
        if (this.defaultCursor == cursor) {
            return;
        }
        this.defaultCursor = cursor;
        this.refreshCursor();
    },
    setDisabledCursor: function (cursor) {
        if (this.disabledCursor == cursor) {
            return;
        }
        this.disabledCursor = cursor;
        this.refreshCursor();
    },
    setEditDomain: function (domain) {
        this.domain = domain;
    },
    setHoverActive: function (value) {
        //COM.gef.AbstractTool.FLAG_HOVER
        this.setFlag(COM.gef.AbstractTool.FLAG_HOVER, value);
    },
    setMouseCapture: function (value) {
        if (this.getCurrentViewer() != null && this.getCurrentViewer().getControl() != null && !this.getCurrentViewer().getControl().isDisposed()) {
            this.getCurrentViewer().getControl().setCapture(value);
        }
    },
    setProperties: function (properties) {
        if (properties == null) {
            return;
        }
        for (var i in properties) {
            this.applyProperty(i, properties[i]);
        }
    },
    setStartLocation: function (p) {
        this.startX = p.x;
        this.startY = p.y;
    },
    setState: function (state) {
       // this.debug_printState(state);
        this.state = state;
    },
    setToolCapture: function () {
        this.getCurrentViewer().setRouteEventsToEditDomain(true);
    },
    setUnloadWhenFinished: function (value) {
        //COM.gef.AbstractTool.FLAG_UNLOAD
        this.setFlag(COM.gef.AbstractTool.FLAG_UNLOAD, value);
    },
    setViewer: function (viewer) {
        if (viewer == this.currentViewer) {
            return;
        }
        this.setCursor(null);
        this.currentViewer = viewer;
        if (this.currentViewer != null) {
            //改变viewer之后，设置当前input的位置，本因通过鼠标捕获当前位置。此处直接使用开始位置。
            this.getCurrentInput().setMouseLocation(this.startX, this.startY);
        }
        this.refreshCursor();
    },
    stateTransition: function (start, end) {
        if ((this.getState() & start) != 0) {
            this.setState(end);
            return true;
        }else{
            return false;
        }
    },
    unloadWhenFinished: function () {
        //COM.gef.AbstractTool.FLAG_UNLOAD
        return this.getFlag(COM.gef.AbstractTool.FLAG_UNLOAD);
    },
    viewerEntered: function (me, viewer) {
        if (!this.isViewerImportant(viewer)){
            return;
        }
        this.getCurrentInput().setInputByMouse(me);
        if (this.getCurrentViewer() != null && this.getCurrentViewer() != viewer){
            this.handleViewerExited();
        }
        this.setViewer(viewer);
        this.handleViewerEntered();
    },
    viewerExited: function (me, viewer) {
        if (viewer === this.getCurrentViewer()) {
            this.getCurrentInput().setInputByMouse(me);
            this.handleViewerExited();
            this.setViewer(null);
        }
    },
    setFlag: function (flag,value) {
        if (value) {
            this.flags |= flag;
        } else {
            this.flags &= ~flag;
        }
    },
    getFlag: function (flag) {
        return (this.flags & flag) != 0;
    },
    debug_printState: function (state) {
        var name;
        switch (state) {
            case 1:
                name = 'STATE_INITIAL';
                break;
            case 2:
                name = 'STATE_DRAG';
                break;
            case 4:
                name = 'STATE_DRAG_IN_PROGRESS';
                break;
            case 8:
                name = 'STATE_INVALID';
                break;
            case 16:
                name = 'STATE_ACCESSIBLE_DRAG';
                break;
            case 32:
                name = 'STATE_ACCESSIBLE_DRAG_IN_PROGRESS';
                break;
            case 1 << 30:
                name = 'STATE_TERMINAL';
                break;
        }
    }
    
});

COM.gef.AbstractTool.PROPERTY_UNLOAD_WHEN_FINISHED = "unloadWhenFinished";
COM.gef.AbstractTool.DRAG_THRESHOLD = 5;
COM.gef.AbstractTool.FLAG_ACTIVE = 8;
COM.gef.AbstractTool.FLAG_PAST_THRESHOLD = 1;
COM.gef.AbstractTool.FLAG_UNLOAD = 4;
COM.gef.AbstractTool.MAX_FLAG = 8;
COM.gef.AbstractTool.MAX_STATE = 32;
COM.gef.AbstractTool.MOUSE_BUTTON1 = 524288;
COM.gef.AbstractTool.MOUSE_BUTTON2 = 1048576;
COM.gef.AbstractTool.MOUSE_BUTTON3 = 2097152;
COM.gef.AbstractTool.MOUSE_BUTTON_ANY = 1;
COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG = 16;
COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS = 32;
COM.gef.AbstractTool.STATE_DRAG = 2;
COM.gef.AbstractTool.STATE_DRAG_IN_PROGRESS = 4;
COM.gef.AbstractTool.STATE_INITIAL = 1;
COM.gef.AbstractTool.STATE_INVALID = 8;
COM.gef.AbstractTool.STATE_TERMINAL = 1 << 30;
COM.gef.AbstractTool.MODIFIER_NO_SNAPPING = 1;


COM.gef.FlagSupport = function () {
    this.flags = 0;
}
COM.gef.FlagSupport.extend(Object,{
    getFlag: function (flag) {
        return (this.flags & flag) != 0;
    },
    setFlag: function (flag,value) {
        if (value){
            this.flags |= flag;
        } else {
            this.flags &= ~flag;
        }
    }
    
});
COM.gef.Input4Tool = function () {
    COM.gef.Input4Tool.superclass.constructor.call(this);
    this.modifiers = null;
    this.mouse = new Point();
    this.verifyMouseButtons = null;
}
//FlagSupport
COM.gef.Input4Tool.extend(COM.gef.FlagSupport,{
    getModifiers: function () {
        return this.modifiers;
    },
    getMouseLocation: function () {
        return this.mouse;
    },
    isAltKeyDown: function () {
        return (this.modifiers & KeyStroke.ALT) != 0;
    },
    isAnyButtonDown: function () {
        return this.getFlag(2 | 4 | 8 | 16 | 32);
    },
    isControlKeyDown: function () {
        return (this.modifiers & KeyStroke.CTRL) != 0;
    },
    isModKeyDown: function (mod) {
        return (this.modifiers & mod) != 0;
    },
    isMouseButtonDown: function (which) {
        return this.getFlag(1 << which);
    },
    isShiftKeyDown: function () {
        return (this.modifiers & KeyStroke.SHIFT) != 0;
    },
    setInputByKeyboard: function (ke) {
        this.modifiers = KeyStroke.getStatemark(ke.altKey, ke.ctrlKey, ke.shiftKey);
        //浏览器原始事件
        this.e = ke.e;
    },
    setInputByMouse: function (me,doubleClick) {
        this.setMouseLocation(me.localX, me.localY);
        //浏览器原始事件
        this.e = me.e;
        this.modifiers = Mouse.getStatemark(me) | KeyStroke.getStatemark(me.altKey, me.ctrlKey, me.shiftKey);
        if (this.verifyMouseButtons) {
            this.setMouseButton(1, (this.modifiers & Mouse.BUTTON1) != 0);
            this.setMouseButton(2, (this.modifiers & Mouse.BUTTON2) != 0);
            this.setMouseButton(3, (this.modifiers & Mouse.BUTTON3) != 0);
            this.setMouseButton(4, (this.modifiers & Mouse.BUTTON4) != 0);
            this.setMouseButton(5, (this.modifiers & Mouse.BUTTON5) != 0);
            this.verifyMouseButtons = false;
        }
    },
    getBrowserEvent: function () {
    	return this.e;
    },
    setMouseButton: function (which,state) {
        this.setFlag(1 << which, state);
    },
    setMouseLocation: function (x,y) {
        this.mouse.x=x;
        this.mouse.y=y;
    }
});
/**
 * @author jiangqifan
 * @since 2013-5-8
 */
COM.gef.TargetingTool = function TargetingTool() {
    COM.gef.TargetingTool.superclass.constructor.call(this);
    this.targetRequest = null;
    this.targetEditPart = null;
}

COM.gef.TargetingTool.extend(COM.gef.AbstractTool,{
    createTargetRequest: function () {
        var request = new Request();
        request.setType(this.getCommandName());
        return request;
    },
    deactivate: function () {
        if (this.isHoverActive()) {
            this.resetHover();
        }
        this.eraseTargetFeedback();
        this.targetEditPart = null;
        this.targetRequest = null;
        COM.gef.TargetingTool.superclass.deactivate.call(this);
    },
    eraseTargetFeedback: function () {
        if (!this.isShowingTargetFeedback()) {
            return;
        }
        this.setFlag(COM.gef.TargetingTool.FLAG_TARGET_FEEDBACK, false);
    },
    getCommand: function () {
        if (this.getTargetEditPart() == null){
            return null;
        }
        return this.getTargetEditPart().getCommand(this.getTargetRequest());
    },
    getExclusionSet: function () {
        return [];   
    },
    getTargetingConditional: function () {
        var that = this;
        return {
            evaluate: function (editpart) {
                return editpart.getTargetEditPart(that.getTargetRequest()) != null;
            }
        }
    },
    getTargetEditPart: function () {
      return this.targetEditPart;  
    },
    getTargetRequest: function () {
        if (this.targetRequest == null) {
            this.setTargetRequest(this.createTargetRequest());
        }
        return this.targetRequest;
    },
    handleEnteredEditPart: function () {
        this.updateTargetRequest();
        this.showTargetFeedback();
        return true;
    },
    handleExitingEditPart: function () {
        this.resetHover();
        this.eraseTargetFeedback();
        return true;
    },
    handleHoverStop: function () {
        return false;
    },
    handleInvalidInput: function () {
        this.eraseTargetFeedback();
        this.setCurrentCommand(COM.gef.UnexecutableCommand.INSTANCE);
        return true;
    },
    handleLeavingEditPart: Function.emptyFunction,
    
    handleViewerExited: function () {
        this.setTargetEditPart(null);
        return true;
    },
    
    isShowingTargetFeedback: function () {
        return this.getFlag(COM.gef.TargetingTool.FLAG_TARGET_FEEDBACK);
    },
    
    isTargetLocked: function () {
        return this.getFlag(COM.gef.TargetingTool.FLAG_LOCK_TARGET);
    },
    
    lockTargetEditPart: function (editpart) {
        if (editpart == null)  {
            this.unlockTargetEditPart();
            return;
        }
        this.setFlag(COM.gef.TargetingTool.FLAG_LOCK_TARGET, true);
        this.setTargetEditPart(editpart);
    },
    resetFlags: function () {
        this.setFlag(COM.gef.TargetingTool.FLAG_LOCK_TARGET, false);
        COM.gef.TargetingTool.superclass.resetFlags.call(this);
    },
    resetHover: function () {
        if (this.isHoverActive()) {
            this.handleHoverStop();
        }
        this.setHoverActive(false);
    },
    setTargetEditPart: function (editpart) {
        if (editpart != this.targetEditPart) {
            if (this.targetEditPart != null) {
                this.handleExitingEditPart();
            }
            this.targetEditPart = editpart;
            if (this.getTargetRequest()!=null && this.getTargetRequest().setTargetEditPart != null) {
                this.getTargetRequest().setTargetEditPart(this.targetEditPart);
            }
            this.handleEnteredEditPart();
        }
    },
    setTargetRequest: function (req) {
        this.targetRequest = req;
    },
    showTargetFeedback: function () {
        if (this.getTargetEditPart() != null) {
            this.getTargetEditPart().showTargetFeedback(this.getTargetRequest());
        }
        this.setFlag(COM.gef.TargetingTool.FLAG_TARGET_FEEDBACK, true);
    },
    unlockTargetEditPart: function () {
        this.setFlag(COM.gef.TargetingTool.FLAG_LOCK_TARGET, false);
        this.updateTargetUnderMouse();
    },
    
    updateTargetRequest: Function.emptyFunction,
    
    updateTargetUnderMouse: function () {
        if (!this.isTargetLocked()) {
            var editPart = this.getCurrentViewer().findObjectAtExcluding(this.getLocation(),this.getExclusionSet(),this.getTargetingConditional());
            if (editPart != null) {
                editPart = editPart.getTargetEditPart(this.getTargetRequest());
            }
            var changed = this.getTargetEditPart() != editPart;
            this.setTargetEditPart(editPart);
            return changed;
        } else {
            return false;
        }
    }
});
COM.gef.TargetingTool.FLAG_LOCK_TARGET = COM.gef.AbstractTool.MAX_FLAG << 1;
COM.gef.TargetingTool.FLAG_TARGET_FEEDBACK = COM.gef.AbstractTool.MAX_FLAG << 2;
COM.gef.TargetingTool.MAX_FLAG = COM.gef.TargetingTool.FLAG_TARGET_FEEDBACK;
/**
 * @author jiangqifan
 * @since 2013-5-8
 */
COM.gef.SelectionTool = function SelectionTool() {
    COM.gef.SelectionTool.superclass.constructor.call(this);
    this.handleIndex = null;
    this.dragTracker = null;
    this.hoverRequest = null;
}

COM.gef.SelectionTool.extend(COM.gef.TargetingTool,{
    acceptTraverseHandle: function (e) {
        return (e.charCode == '.'.charCodeAt(0) || e.charCode == '>'.charCodeAt(0)) && isInState(STATE_INITIAL | STATE_ACCESSIBLE_DRAG | STATE_ACCESSIBLE_DRAG_IN_PROGRESS) && !e.altKey && !e.ctrlKey;
    },
    createHoverRequest: function () {
        this.hoverRequest = new COM.gef.LocationRequest();
        this.hoverRequest.setType(COM.gef.RequestConstants.REQ_SELECTION_HOVER);
    },
    createTargetRequest: function () {
        var request = new COM.gef.SelectionRequest();
        request.setType(this.getCommandName());
        return request;
    },
    deactivate: function () {
        this.setDragTracker(null);
        COM.gef.SelectionTool.superclass.deactivate.call(this);
    },
    eraseHoverFeedback: function () {
        if (this.getTargetEditPart() == null) {
            return;
        }
        if (this.getTargetHoverRequest() == null) {
            return;
        }
        this.getTargetEditPart().eraseTargetFeedback(this.getTargetHoverRequest());
    },
    getCommandName: function () {
        return COM.gef.RequestConstants.REQ_SELECTION;
    },
    getDragTracker: function () {
        return this.dragTracker;
    },
    getTargetHoverRequest: function () {
        if (this.hoverRequest == null) {
            this.createHoverRequest();
        }
        return this.hoverRequest;
    },
    handleDoubleClick: function (button) {
        var viewer = this.getCurrentViewer();
        var p = this.getLocation();
        if (this.getDragTracker() != null) {
            this.getDragTracker().deactivate();
        }
        var handle = viewer.findHandleAt(p);
        if (handle != null) {
            this.setDragTracker(handle.getDragTracker());
            return true;
        }
        this.updateTargetRequest();
        this.getTargetRequest().setLastButtonPressed(button);
        this.updateTargetUnderMouse();
        var editpart = this.getTargetEditPart();
        if (editpart != null) {
            this.setDragTracker(editpart.getDragTracker(this.getTargetRequest()));
            this.lockTargetEditPart(editpart);
            return true;
        }
        return false;
    },
    handleButtonDown: function (button) {
        if (!this.stateTransition(COM.gef.AbstractTool.STATE_INITIAL, COM.gef.AbstractTool.STATE_DRAG)) {
            this.resetHover();
            return true;
        }
        this.resetHover();
        var viewer = this.getCurrentViewer();
        var p = this.getLocation();
        if (this.getDragTracker() != null) {
            this.getDragTracker().deactivate();
        }
        var handle = viewer.findHandleAt(p);
        if (handle != null) {
            this.setDragTracker(handle.getDragTracker());
            return true;
        }
        this.updateTargetRequest();
        this.getTargetRequest().setLastButtonPressed(button);
        this.updateTargetUnderMouse();
        var editpart = this.getTargetEditPart();
        if (editpart != null) {
            this.setDragTracker(editpart.getDragTracker(this.getTargetRequest()));
            this.lockTargetEditPart(editpart);
            return true;
        }
        return false;
    },
    touchStart: function (e,viewer) {
    	COM.gef.SelectionTool.superclass.touchStart.call(this,e,viewer);
        if (this.getDragTracker() != null && this.getDragTracker().touchStart) {
            this.getDragTracker().touchStart(e, viewer);
        }
    },
    touchMove: function (e,viewer) {
        if (this.getDragTracker() != null && this.getDragTracker().touchMove) {
            this.getDragTracker().touchMove(e, viewer);
        }
    	COM.gef.SelectionTool.superclass.touchMove.call(this,e,viewer);
    },
    touchEnd: function (e,viewer) {
        if (this.getDragTracker() != null && this.getDragTracker().touchEnd) {
            this.getDragTracker().touchEnd(e, viewer);
        }
    	COM.gef.SelectionTool.superclass.touchEnd.call(this,e,viewer);
    },
    handleTouchStart: function () {
    	 var viewer = this.getCurrentViewer();
         var p = this.getLocation();
         if (this.getDragTracker() != null) {
             this.getDragTracker().deactivate();
         }
         var handle = viewer.findHandleAt(p);
         if (handle != null) {
             this.setDragTracker(handle.getDragTracker());
             return true;
         }
         this.updateTargetRequest();
         this.updateTargetUnderMouse();
         var editpart = this.getTargetEditPart();
         if (editpart != null) {
             this.setDragTracker(editpart.getDragTracker(this.getTargetRequest()));
             return true;
         }
         return false;
    },
    handleTouchEnd: function () {
        this.getTargetRequest().setLastButtonPressed(0);
        this.setDragTracker(null);
        this.unlockTargetEditPart();
        return true;
    },
    handleButtonUp: function (button) {
        if (this.getCurrentInput().isAnyButtonDown()) {
            return false;
        }
        this.getTargetRequest().setLastButtonPressed(0);
        this.setDragTracker(null);
        this.setState(COM.gef.AbstractTool.STATE_INITIAL);
        this.unlockTargetEditPart();
        return true;
    },
    handleCommandStackChanged: function () {
        if (this.getDragTracker() == null) {
            COM.gef.SelectionTool.superclass.handleCommandStackChanged.call(this);
        }
        return false;
    },
    handleFocusLost: function () {
        if (this.isInState(COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG | COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS | COM.gef.AbstractTool.STATE_DRAG | COM.gef.AbstractTool.STATE_DRAG_IN_PROGRESS)) {
            if (this.getDragTracker() != null) {
                this.setState(COM.gef.AbstractTool.STATE_INITIAL);
            }
            return true;
        }
        return false;
    },
    //handleHover
    //handleHoverStop
    handleKeyDown: function (e) {
        this.resetHover();
        if (this.acceptArrowKey(e)) {
            if (this.stateTransition(COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG,COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS)) {
                return true;
            }
        }
        if (this.acceptAbort(e)) {
            if (this.getDragTracker() != null) {
                this.setDragTracker(null);
            }
            if (this.isInState(COM.gef.AbstractTool.STATE_TRAVERSE_HANDLE | COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG| COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS)) {
                this.placeMouseInViewer(this.getStartLocation().getTranslated(6, 6));
            }
            this.setState(COM.gef.AbstractTool.STATE_INITIAL);
            this.setLastHandleProvider(null);
            return true;
        }
        if (this.acceptTraverseHandle(e)) {
            if (this.isInState(COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS)) {
                if (this.getDragTracker() != null) {
                    this.getDragTracker().commitDrag();
                }
            }
            if (this.isInState(COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG| COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS)) {
                this.setDragTracker(null);
                this.getCurrentViewer().flush();
            }
            if (!this.handleTraverseHandle(e)) {
                this.setState(COM.gef.AbstractTool.STATE_INITIAL);
            }
            return true;
        }
        if (this.acceptDragCommit(e)) {
            if (this.getDragTracker() != null) {
                this.getDragTracker().commitDrag();
            }
            this.setDragTracker(null);
            this.setState(COM.gef.AbstractTool.STATE_INITIAL);
            this.handleIndex--;
            this.placeMouseInViewer(this.getLocation().getTranslated(6, 6));
            return true;
        }
        if (this.isInState(COM.gef.AbstractTool.STATE_INITIAL)) {
        	this._performHandleKey('keyDown',e);
        }
        return false;
    },
    handleKeyPressed: function (e) {
    	if (this.isInState(COM.gef.AbstractTool.STATE_INITIAL)) {
            this._performHandleKey('keyPressed',e);
        }
        return false;
    },
    handleKeyUp: function (e) {
        if (this.isInState(COM.gef.AbstractTool.STATE_INITIAL)){
        	this._performHandleKey('keyReleased',e);
        }
        return false;
    },
    _performHandleKey: function (method, e) {
    	var handler = this.getCurrentViewer().getKeyHandler();
    	if (handler && handler[method]) {
    		handler[method](e);
    	}
    },
    handleMove: function () {
        if (this.stateTransition(COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG, COM.gef.AbstractTool.STATE_INITIAL)) {
            this.setDragTracker(null);
        }
        if (this.isInState(COM.gef.AbstractTool.STATE_INITIAL)) {
            this.updateTargetRequest();
            this.updateTargetUnderMouse();
            this.showTargetFeedback();
            return true;
        } else if (this.isInState(COM.gef.AbstractTool.STATE_TRAVERSE_HANDLE)) {
            var viewer = this.getCurrentViewer();
            handle = viewer.findHandleAt(this.getLocation());
            if (handle != null) {
                this.setState(COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG);
                this.setStartLocation(this.getLocation());
                this.setDragTracker(handle.getDragTracker());
                return true;
            } else {
                this.setState(COM.gef.AbstractTool.STATE_INITIAL);
            }
            
        }
        return false;
    },
    //handleNativeDragFinished
    //handleNativeDragStarted
    keyDown: function (evt,viewer) {
        if (this.getDragTracker() != null) {
            this.getDragTracker().keyDown(evt, viewer);
        }
        COM.gef.SelectionTool.superclass.keyDown.call(this,evt,viewer);
    },
    keyUp: function (evt,viewer) {
        if (this.getDragTracker() != null) {
            this.getDragTracker().keyUp(evt, viewer);
        }
        COM.gef.SelectionTool.superclass.keyUp.call(this,evt,viewer);
    },
    mouseDown: function (e,viewer) {
        COM.gef.SelectionTool.superclass.mouseDown.call(this,e,viewer);
        if (this.getDragTracker() != null) {
            this.getDragTracker().mouseDown(e, viewer);
        }
    },
    mouseDoubleClick: function (e,viewer) {
        COM.gef.SelectionTool.superclass.mouseDoubleClick.call(this,e,viewer);
        
        if (this.getDragTracker() != null) {
            this.getDragTracker().mouseDoubleClick(e, viewer);
        }
        
        this.handleButtonUp(Mouse.getMouseNumber(e));
    },
    mouseDrag: function (e,viewer) {
        if (this.getDragTracker() != null) {
            this.getDragTracker().mouseDrag(e, viewer);
        }
        COM.gef.SelectionTool.superclass.mouseDrag.call(this,e,viewer);
    },
    mouseHover: function (e,viewer) {
        if (this.getDragTracker() != null) {
            this.getDragTracker().mouseHover(e, viewer);
        }
        COM.gef.SelectionTool.superclass.mouseHover.call(this,e,viewer);
    },
    mouseMove: function (e,viewer) {
        if (this.getDragTracker() != null) {
            this.getDragTracker().mouseMove(e, viewer);
        }
        COM.gef.SelectionTool.superclass.mouseMove.call(this,e,viewer);
    },
    mouseUp: function (e,viewer) {
        if (this.getDragTracker() != null) {
            this.getDragTracker().mouseUp(e, viewer);
        }
        COM.gef.SelectionTool.superclass.mouseUp.call(this,e,viewer);
    },
    mouseWheelScrolled: function (e,viewer) {
        if (this.getDragTracker() != null) {
            this.getDragTracker().mouseWheelScrolled(event, viewer);
            event.doit = false;
        } else {
            COM.gef.SelectionTool.superclass.mouseWheelScrolled.call(this,e,viewer);
        }
    },
    refreshCursor: function () {
        if (this.getDragTracker() == null) {
            COM.gef.SelectionTool.superclass.refreshCursor.call(this);
        }
    },
    setDragTracker: function (newDragTracker) {
        if(newDragTracker == this.dragTracker) {
            return;
        }
        if (this.dragTracker != null) {
            this.dragTracker.deactivate();
        }
        this.dragTracker = newDragTracker;
        if (newDragTracker != null) {
            newDragTracker.setEditDomain(this.getDomain());
            newDragTracker.activate();
            newDragTracker.setViewer(this.getCurrentViewer());
        }
        this.refreshCursor();
    },
    //showHoverFeedback
    updateHoverRequest: function () {
        var request = this.getTargetHoverRequest();
        request.setLocation(this.getLocation());
    },
    updateTargetRequest: function () {
        var request = this.getTargetRequest();
        request.setModifiers(this.getCurrentInput().getModifiers());
        request.setType(this.getCommandName());
        request.setLocation(this.getLocation());
        this.updateHoverRequest();
    }
    
});
COM.gef.SelectionTool.FLAG_HOVER_FEEDBACK = COM.gef.TargetingTool.MAX_FLAG << 1;
COM.gef.SelectionTool.MAX_FLAG = COM.gef.SelectionTool.FLAG_HOVER_FEEDBACK;
COM.gef.SelectionTool.STATE_TRAVERSE_HANDLE = COM.gef.AbstractTool.MAX_STATE << 1;
COM.gef.SelectionTool.MAX_STATE = COM.gef.SelectionTool.STATE_TRAVERSE_HANDLE;

/**
 * @author jiangqifan
 * @since 2013-4-23
 * @abstract
 */
COM.gef.SimpleDragTracker = function SimpleDragTracker() {
    
    COM.gef.SimpleDragTracker.superclass.constructor.call(this);
    this.sourceRequest = null;
}

COM.gef.SimpleDragTracker.extend(COM.gef.AbstractTool,{
    calculateCursor: function () {
        if (this.isInState(COM.gef.AbstractTool.STATE_INITIAL | COM.gef.AbstractTool.STATE_DRAG | COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG)) {
            return this.getDefaultCursor();
        }
        return  COM.gef.SimpleDragTracker.superclass.calculateCursor.call(this);
    },
    commitDrag: function () {
        this.eraseSourceFeedback();
        this.performDrag();
        this.setState(COM.gef.AbstractTool.STATE_TERMINAL);
    },
    createSourceRequest: function () {
        return new COM.gef.Request();
    },
    deactivate: function () {
        this.eraseSourceFeedback();
        this.sourceRequest = null;
        COM.gef.SimpleDragTracker.superclass.deactivate.call(this);
    },
    eraseSourceFeedback: function () {
        if (!this.isShowingFeedback()) {
            return;
        }
        this.setFlag(COM.gef.SimpleDragTracker.FLAG_SOURCE_FEEDBACK, false);
        var  editParts = this.getOperationSet();
        for (var i = 0; i < editParts.length; i++) {
            var editPart = editParts[i];
            editPart.eraseSourceFeedback(this.getSourceRequest());
        }
    },
    getSourceRequest: function () {
        if (this.sourceRequest == null) {
            this.sourceRequest = this.createSourceRequest();
        }
        return this.sourceRequest;
    },
    handleButtonDown: function (button) {
        if (button != 1) {
            this.setState(COM.gef.AbstractTool.STATE_INVALID);
            this.handleInvalidInput();
        } else {
            this.stateTransition(COM.gef.AbstractTool.STATE_INITIAL, COM.gef.AbstractTool.STATE_DRAG);
        }
        return true;
    },
    handleButtonUp: function (button) {
        if (this.stateTransition(COM.gef.AbstractTool.STATE_DRAG_IN_PROGRESS, COM.gef.AbstractTool.STATE_TERMINAL)) {
            this.eraseSourceFeedback();
            this.performDrag();
        }
        return true;
    },
    handleDragInProgress: function () {
        
        if (this.isInDragInProgress()) {
            this.updateSourceRequest();
            this.showSourceFeedback();
            this.setCurrentCommand(this.getCommand());
        }
        return true;
    },
    handleDragStarted: function () {
        return this.stateTransition(COM.gef.AbstractTool.STATE_DRAG, COM.gef.AbstractTool.STATE_DRAG_IN_PROGRESS);
    },
    handleInvalidInput: function () {
        this.eraseSourceFeedback();
        this.setCurrentCommand(null);
        return true;
    },
    handleKeyDown: function (e) {
        if (this.acceptArrowKey(e)) {
            this.accStepIncrement();
            if (this.stateTransition(COM.gef.AbstractTool.STATE_INITIAL,COM.gef.AbstractTool.STATE_ACCESSIBLE_DRAG_IN_PROGRESS)) {
                this.setStartLocation(this.getLocation());
            }
            // switch (e.keyCode) {
                // case
                // case
                // case
                // case
            // }
            return true;
        }
        return false;
    },
    handleKeyUp: function (e) {
        if (this.acceptArrowKey(e)) {
            this.accStepReset();
            return true;
        }
        return false;
    },
    isShowingFeedback: function () {
        return this.getFlag(COM.gef.SimpleDragTracker.FLAG_SOURCE_FEEDBACK);
    },
    performDrag: function () {
        this.executeCurrentCommand();
    },
    showSourceFeedback: function () {
        var editParts = this.getOperationSet();
        for (var i = 0; i < editParts.length; i++) {
            var editPart =  editParts[i];
            editPart.showSourceFeedback(this.getSourceRequest());
        }
        this.setFlag(COM.gef.SimpleDragTracker.FLAG_SOURCE_FEEDBACK, true);
    },
    updateSourceRequest: function () {
        this.getSourceRequest().setType(this.getCommandName());
    }
});
COM.gef.SimpleDragTracker.FLAG_SOURCE_FEEDBACK = COM.gef.AbstractTool.MAX_FLAG << 1;
COM.gef.SimpleDragTracker.MAX_FLAG = COM.gef.SimpleDragTracker.FLAG_SOURCE_FEEDBACK;

/**
 * @author jiangqifan
 * @since 2013-5-9
 */
COM.gef.LocationRequest = function LocationRequest(type) {
    COM.gef.LocationRequest.superclass.constructor.call(type);
    this.location = null;
}

COM.gef.LocationRequest.extend(COM.gef.Request,{
    getLocation: function () {
        return this.location;  
    },
    setLocation: function (p) {
        this.location = p;
    }
});

/**
 * @author jiangqifan
 * @since 2013-5-9
 */
COM.gef.SelectionRequest = function SelectionRequest(type) {
    COM.gef.LocationRequest.superclass.constructor.call(type);
    this.statemask = null;
    this.lastButtonPressed = null;
}
COM.gef.SelectionRequest.extend(COM.gef.LocationRequest,{
    getLastButtonPressed: function () {
        return this.lastButtonPressed;  
    },
    getModifiers: function () {
        return this.statemask;
    },
    isAltKeyPressed: function () {
        return ((this.statemask & KeyStroke.ALT) != 0);
    },
    isAnyMouseButtonPressed: function () {
        return ((this.statemask & Mouse.BUTTON_ANY) != 0);
    },
    isControlKeyPressed: function () {
        return ((this.statemask & KeyStroke.CTRL) != 0);
    },
    isLeftMouseButtonPressed: function () {
        return ((this.statemask & Mouse.BUTTON1) != 0);
    },
    isRightMouseButtonPressed: function () {
        return ((this.statemask & Mouse.BUTTON3) != 0);
    },
    isShiftKeyPressed: function () {
        return ((this.statemask & KeyStroke.SHIFT) != 0);
    },
    setModifiers: function (mask) {
        this.statemask = mask;
    },
    setLastButtonPressed: function (button) {
        this.lastButtonPressed = button;
    }
});
/**
 * @author jiangqifan
 * @since 2013-5-13
 * @abstract
 */
COM.gef.AbstractHandle = function AbstractHandle(owner,locator,cursor) {
    COM.gef.AbstractHandle.superclass.constructor.call(this);
    this.isHandle = true;
    this.editpart = null;
    this.dragTracker = null;
    this.locator = null;
    this.setOwner(owner);
    this.setLocator(locator);
    this.setCursor(cursor);
}

COM.gef.AbstractHandle.extend(Figure,{
    addNotify: function () {
        COM.gef.AbstractHandle.superclass.addNotify.call(this);
        this.getOwnerFigure().addAncestorListener(this);
    },
    ancestorMoved: function (ancestor) {
        this.revalidate();
    },
    ancestorAdded: Function.emptyFunction,
    ancestorRemoved: Function.emptyFunction,
    createDragTracker: Function.emptyFunction,
    
    getAccessibleLocation: function () {
        var p = this.etBounds().getCenter();
        this.translateToAbsolute(p);
        return p;
    },
    getDragTracker: function () {
        if (this.dragTracker == null) {
            this.dragTracker = this.createDragTracker();
        }
        return this.dragTracker;
    },
    getLocator: function () {
        return this.locator;
    },
    getOwner: function () {
      return this.editpart;  
    },
    getOwnerFigure: function () {
        return this.getOwner().getFigure();
    },
    removeNotify: function () {
        this.getOwnerFigure().removeAncestorListener(this);
        COM.gef.AbstractHandle.superclass.removeAncestorListener.call(this);
    },
    setDragTracker: function (dragTracker) {
        this.dragTracker = dragTracker;
    },
    setLocator: function (locator) {
        this.locator = locator;
    },
    setOwner: function (editpart) {
        this.editpart = editpart;
    },
    validate: function () {
        if (this.isValid()) {
            return;
        }
        this.getLocator().relocate(this);
        COM.gef.AbstractHandle.superclass.validate.call(this);
    }
    
});
/**
 * @author jiangqifan
 * @since 2013-5-13
 * @abstract
 */
COM.gef.MoveHandle = function MoveHandle(owner,locator) {
    if (locator == null && owner != null){
        locator = new MoveHandleLocator(owner.getFigure());
    }
    COM.gef.MoveHandle.superclass.constructor.call(this,owner,locator);
    this.innerPad = 2;
    this.initialize();
}

COM.gef.MoveHandle.extend(COM.gef.AbstractHandle,{
    createDragTracker: function () {
        //DragEditPartsTracker鏆傛湭瀹炵幇
        //var tracker = new COM.gef.DragEditPartsTracker(this.getOwner());
        //tracker.setDefaultCursor(this.getCursor());
        //return tracker;
        return new COM.gef.SimpleDragTracker();
    },
    containsPoint: function (x,y) {
        if (!COM.gef.MoveHandle.superclass.containsPoint.call(this,x,y)) {
            return false;
        }
       
        return !Rectangle.SINGLETON.setBounds(this.getBounds()).shrink(this.innerPad*2, this.innerPad*2).contains(x, y);
    },
    getInnerPad: function () {
        return   this.innerPad;
    },
    setInnerPad: function (innerPad) {
        this.innerPad = innerPad;
    },
    getAccessibleLocation: function () {
        var p = this.getBounds().getTopRight().translate(-1,this.getBounds().height / 4);
        this.translateToAbsolute(p);
        return p;
    },
    initialize: function () {
        this.setOpaque(false);
        this.setBorder(new LineBorder(this.innerPad));
        this.setCursor(Cursor.MOVE);
    }
});
/**
 * @author jiangqifan
 * @since 2013-5-13
 * @abstract
 */
COM.gef.MoveHandleLocator = function MoveHandleLocator(reference) {
    COM.gef.MoveHandleLocator.superclass.constructor.call(this);
    this.setReference(reference);
}

COM.gef.MoveHandleLocator.extend(Object,{
    getReference: function () {
        return this.reference;
    },
    relocate: function (target) {
        //TODO
    },
    setReference: function (follow) {
        this.reference = follow;
    }
});

/**
 * @author jiangqifan
 * @since 2013-5-13
 * @abstract
 */
COM.gef.AbstractEditPolicy = function AbstractEditPolicy() {
    
    COM.gef.AbstractEditPolicy.superclass.constructor.call(this);
    this.host = null;
}

COM.gef.AbstractEditPolicy.extend(COM.gef.EditPolicy,{
    activate:Function.emptyFunction,
    deactivate: Function.emptyFunction,
    eraseSourceFeedback: Function.emptyFunction,
    eraseTargetFeedback: Function.emptyFunction,
    getCommand: Function.emptyFunction,
    getHost: function () {
        return this.host;
    },
    getTargetEditPart: Function.emptyFunction,
    setHost: function (host) {
        this.host = host;
    },
    showSourceFeedback: Function.emptyFunction,
    showTargetFeedback: Function.emptyFunction,
    understandsRequest: Function.emptyFunction
});

/**
 * @author jiangqifan
 * @since 2013-5-13
 * @abstract
 */
COM.gef.GraphicalEditPolicy = function GraphicalEditPolicy() {
    COM.gef.GraphicalEditPolicy.superclass.constructor.call(this);
}

COM.gef.GraphicalEditPolicy.extend(COM.gef.AbstractEditPolicy,{
    addFeedback: function (figure) {
        this.getFeedbackLayer().add(figure);
    },
    getFeedbackLayer: function () {
        return this.getLayer(COM.gef.LayerConstants.FEEDBACK_LAYER);  
    },
    getHostFigure: function () {
        this. getHost().getFigure();
    },
    getLayer: function (layer) {
        return COM.gef.LayerManager.Helper.find(this.getHost()).getLayer(layer);
    },
    removeFeedback: function (figure) {
        this.getFeedbackLayer().remove(figure);
    }
    
});
