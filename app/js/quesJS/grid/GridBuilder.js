/**
 *问卷表格控件
 *@author zenglizhi
 */
var GridCellEditorProvider = function(gridbuild) {
	var CellTypes = ['STRING', 'INTEGER', 'FLOAT', 'DATE', 'LIST'];
	var EditorTypes = ['text', 'number', 'datetime'];
	this.gridbuilder = gridbuild;
	this.resources = gridbuild._tableDefine.tableData;
	this.t_Bind = gridbuild._tableDefine.bindData;
	this.editors = {};
	this.initEditorFactory();
};
GridCellEditorProvider.extend(Object, {

	initEditorFactory : function() {
		for (var i = 0; i < this.t_Bind.binds.length; i++) {
			var mc = this.t_Bind.binds[i];
			var key = '_' + mc.type + mc.table;
			this.editors[key] = {
				value : mc.value,
				type : mc.type,
				table : mc.table,
				control : mc.control
				// editor
			};
		}
	},
	_editorKey : function(cd) {
		var key = '_';
		if (cd) {
			if (cd.type) {
				key += cd.type;
			}
			if (cd.table) {
				key += cd.table;
			}
		}
		return key;
	},
	getCellEditor : function(grid, cell) {
		var key = cell.getEditorId();
		var editorObj = this.editors[key];
		if(!editorObj){
			editorObj = {};
		}
		if (!editorObj.editor) {
			editorObj.editor = this.createCellEditor(grid, cell, editorObj);
		}
		return editorObj.editor;
	},
	createCellEditor : function(grid, cell, obj) {
		var editor;
		if (obj.type) {
			switch(obj.type) {
				case 3:
					//date
					editor = this._createDateEditor();
					break;
				case 4:
					//list
					editor = this._createListEditor(grid, cell, obj);
					break;
				case 0:
					//string
					editor = this._createInputEditor('text');
					break;
				case 1:
					//integer
					editor = this._createInputEditor('number', '[0,9]+');
					break;
				case 2:
					//float
					editor = this._createInputEditor('number', '[0,9]+');
					break;
			}
		}
		if (!editor)
			editor = this._createInputEditor('text');		
		return editor;
	},
	_createListEditor : function(grid, cell, obj) {
		var res = this.resources[obj.table];
		if (res && 0 < res.length) {
			var c = document.createElement("select");
			for (var i = 0; i < res.length; i++) {
				$(c).append('<option value=' + res[i][0] + '>' + res[i][1] + '</option>');
			}
			var that = this;
			var fn_input = this.gridbuilder._eventListenerTable['dataChange'];
			$(c).change(function(e) {//method				
				if(obj.control.script){
					var _event = {
						select:that.resources[obj.table][this.selectedIndex],
						source:that.gridbuilder.getCurrentCell()
					};
					that.gridbuilder._doScript(obj.control.script,_event);
				}
				if(fn_input) {
					if (!that.gridbuilder.isDataChanged) {
						fn_input.call(this);
						that.gridbuilder.isDataChanged = true;
					}
				}
			});		
			c.style.position = 'absolute';
			return c;
		}
	},
	_createDateEditor : function() {

	},
	_createInputEditor : function(type, pattern) {
		var c = document.createElement('input');
		$(c).attr('type', type);
		if (pattern) {
			$(c).attr('pattern', pattern);
		}
		var fn_input = this.gridbuilder._eventListenerTable['dataChange'];
		if (fn_input) {
			var that = this;
			$(c).on('input', function(e) {
				if (!that.gridbuilder.isDataChanged) {
					fn_input.call(this);
					that.gridbuilder.isDataChanged = true;
				}
			});
		}
		c.style.position = 'absolute';
		return c;
	}
});

var GridBuilder = function(div, tableDefine) {
	this._tableDefine = tableDefine;
	this._eid = '';
	this.el = div;
	this.isDataChanged = false;
	this._doInit();
};
GridBuilder.extend(Object, {
	autoRender : true,

	_doInit : function() {
		this.editorProvider = null;
		this.controlProvider = null;
		this._eventListenerTable = {};
		var that = this;
		this._tableDefine.findTableItem = function(name,code){
			var res = that._tableDefine.tableData[name];
			if(res){
				for(var i=0;i<res.length;i++){
					if(code == res[i][0]){
						return res[i];
					}				
				}
			}
		};
		this._gridData = this._parseData();
		this._initSize();
	},

	init : function() {
		if (this.autoRender) {
			this._doBuildElements();
		}
	},
	/**
	 * 执行一段 js
	 * @param {} script
	 * @param {} event {source:cell,select}
	 */ 
	_doScript:function(script,event){
/*
			(function(Grid,Event){
						var curr = Event.source;
						var target = Grid.getCell(curr.x -1, curr.y);
						if (target) 
						{
						target.setShowText(Event.select[1]);
						}				
					})(this,event);		
		*/
		try{
			eval("(function(Grid,Event){"+script+"})(this,event);");	
		}catch(e){}
	

	},
	_setDoit : function(e, val) {
		e.result.doit = val ? this.GridCom.RESULT_TRUE : this.GridCom.RESULT_FALSE;
	},
	_registEvents : function() {
	},
	_registGCListener : function() {
		this.gc.addListener("editorOpen", this._gcEditorOpenListener, this);
	},
	_initFormatter : function() {
	},
	getBody : function() {
		return this.tDiv;
	},
	_initSize : function() {
		var height = 5;
		for (var i = 0; i < this._gridData.rows.length; i++) {
			height += this._gridData.rows[i].size;
		}
		this.el.style.height = height + "px";
	},
	_parseData : function() {
		var t_gd = this._tableDefine.gridData;
		var t_Bind = this._tableDefine.bindData;
		var gd = {
			options : {
				loadMode : COM.widget.Grid.LOAD_MODE_NORMAL,
				loadByRow : true,
				selectionMode : COM.widget.Grid.SELECTION_MODE_MULTI,
				editMode : COM.widget.Grid.EDIT_MODE_INPUT,
				enterNext : COM.widget.Grid.ENTER_NEXT_RIGHT,
				rowSelectable : true,
				colSelectable : false,
				ignoreHidden : true,
				colResizeable : true,
				rowResizeable : false,
				colFreeResizeable : true,
				rowFreeResizeable : true,
				colGrabable : true,
				showSelectionBorder : true,
				currentCellBorderHidden : true,
				colExchangeable : false,
				passReadOnly : true,
				showSelectionChange : false,
				selectionColor : 'rgba(10,10,10,0.2)',
				selectionBorderColor : 'rgba(15,15,0,1)',
				selectionBorderWidth : 3,
				currentCellColor : 'rgba(255,255,0,0.1)',
				currentCellBorderColor : null
			},
			defaultEditorId : null,
			colHeaderCount : 0,
			rowHeaderCount : 0,
			colFooterCount : 0,
			rowFooterCount : 0,
			rowCount : t_gd.rowCount,
			colCount : t_gd.colCount,
			rows : [{
				size : 0,
				auto : false,
				hidden : true,
				clientSize : 0
			}].concat(t_gd.rows), //行属性
			cols : [{
				size : 0,
				auto : false,
				hidden : true,
				clientSize : 0
			}].concat(t_gd.cols), //列属性
			cells : {
				rowList : []
			}, //所有单元格
			mergeCells : [],
			formulas : [],//公式
			defalutFont : {
				fontName : 'Times New Roman',
				fontSize : '20px',
				fontStyle : 'italic',
				foregroundColor : '#f00',
				textStroke : true,
				textShadow : {
					offsetX : 4,
					offsetY : 4,
					blur : 2,
					color : '#020'
				}
			}
		};

		for (var i = 0; i < t_gd.merges.length; i++) {
			var m = t_gd.merges[i];
			gd.mergeCells.push({
				col : m[0],
				row : m[1],
				width : m[2],
				height : m[3]
			});
		}
		
		//公式
		if(t_gd.formulas){
			for (var i = 0; i < t_gd.formulas.length; i++) {
				gd.formulas.push(t_gd.formulas[i]);
			}
		}
		
		/////////
		this.floatSet = {
			type : t_Bind.type, //0:行浮动; 1:列浮动，
			index : 0,
			expandField:t_Bind.expandField,
			defaultSize : t_Bind.defaultSize,
			allowAddDel:t_Bind.allowAddDel,
			showQequenceIndex:t_Bind.showQequenceIndex,
			fieldIndexs : []
		};

		for (var i = 0; i < gd.rowCount; i++) {
			var cellList = [];
			for (var j = 0; j < gd.colCount; j++) {
				if (0 == i * j) {
					cellList.push({});
				} else {
					var celldata = t_gd.cells[i * gd.colCount - gd.colCount + j - i];
					var cell = this.createCellModel(j, i, celldata);
					cellList.push(cell);
				}
			}
			gd.cells.rowList.push(cellList);
		}
		for (var i = 0; i < t_Bind.binds.length; i++) {
			var mc = t_Bind.binds[i];
			if (i == 0) {
				if (1 == this.floatSet.type) {
					this.floatSet.index = mc.col;				
				} else {
					this.floatSet.index = mc.row;		
				}
			}
			if (1 == this.floatSet.type) {
				this.floatSet.fieldIndexs[i] = mc.row;
				for(var c = mc.col;c < gd.colCount;c ++){
					var gmc = gd.cells.rowList[mc.row][c];
					gmc.editorId = '_' + mc.type + mc.table;
				}
				
			} else {
				this.floatSet.fieldIndexs[i] = mc.col;
				for (var r = mc.row; r < gd.rowCount; r++) {
					var gmc = gd.cells.rowList[r][mc.col];
					gmc.editorId = '_' + mc.type + mc.table;
				}
				
			}
		}
		return gd;
	},

	createCellModel : function(x, y, cd) {
		if (x == 0 || y == 0)
			return {};
		return {
			colIndex : x,
			rowIndex : y,
			editorId : 'default', //  _+typle+table
			title : cd.text,
			showText : cd.text,
			editText : cd.editText,
			editable : cd.editable,
			selectable : true,
			cellMode : COM.widget.Grid.Cell.Cell_MODE_NORMAL,
			expandable : true,
			clientData : {},
			rowSpan : 1,
			colSpan : 1,
			isMerged : false,
			backStyle : 1,
			backColor : '#' + cd.backColor,
			border : [1, 1],
			borderColor : ['#87C4D6', '#87C4D6', '#87C4D6', '#87C4D6'],
			fontName : '宋体',
			//fontStyle
			fontSize : 12,
			wrapLine : false,
			indent : 0,
			horzAlign : cd.hAlign, //1:left,2:right,3:center
			vertAlign : 0,
			vertText : false,
			fitFontSize : false,
			multiLine : true
		};
	},

	_doBuildElements : function() {
		this.tDiv = this.el;
		$(this.el).append("<div>");
		this.gcDiv = this.tDiv.firstChild;
		this.GridCom = COM.widget.Grid;
		var size = this._getClientSize(this.tDiv);
		var config = {
			// 'eventSource' : {
			// 'mousedown' : this,
			// 'keydown' : this
			// }
		};
		this.gc = new COM.widget.Grid(this.gcDiv, this._gridData, config);
		if (this.gc.setVisible) {
			this.gc.setVisible(this.isVisible());
		}
		this._registGCListener();
		this.gc.setSize(size.width, size.height);
		var adapter = new this.GridCom.Grid2Adapter();
		adapter.init(this.gc);
		//编辑器提供器
		this.setCellEditorProvider(new GridCellEditorProvider(this));
		this._initFormatter();
		if (!this.isEnabled()) {
			this._disableGrid(this);
		}
	},

	/***/
	getCell : function(colIndex, rowIndex) {
		return this.gc.getCell(colIndex, rowIndex);
	},
	merge : function(left, top, right, bottom) {
		return this.gc.mergeCell(left, top, right, bottom);
	},
	unmerge : function(colIndex, rowIndex) {
		this.gc.unMergeCell(colIndex, rowIndex);
	},
	insertRows : function(index, count, copyIndex, expending, expandCol, layer) {
		this.currentCellChangedOnlyFireClient = true;
		this.gc.insertRows(index, count, copyIndex);
		this.currentCellChangedOnlyFireClient = false;
		if (expending) {
			this._doExpendIndentation(index, count, expandCol, layer);
		}
		this._layoutRow('insert',index,count,copyIndex);
	},
	_layoutRow:function(operate,index,count,copyIndex){
		if(!copyIndex){
			copyIndex = index;
		}
		var append = this.gc.getRowHeight(copyIndex);
		var height = this.gc.getHeight();
		if('insert'== operate){
			height +=append*count;
		}else if('delete' == operate){
			height -=append*count;
		}
		this.gc.setSize(this.gc.getWidth(),height);
		this.el.style.height = height + "px";
	},
	deleteRows : function(beg, count) {
		this.gc.deleteRows(beg, count);
		this._layoutRow('delete',beg,count);
	},
	insertColumns : function(index, count, copyIndex) {
		this.currentCellChangedOnlyFireClient = true;
		this.gc.insertCols(index, count, copyIndex);
		this.currentCellChangedOnlyFireClient = false;
	},
	deleteColumns : function(beg, count) {
		this.gc.deleteCols(beg, count);
	},
	_doExpendIndentation : function(rowIndex, count, expandCol, layer){
		
	},
	
	/**
	 * 设置grid列数
	 */
	setColumnCount : function(columns) {
		this.gc.setColCount(columns);
	},

	/**
	 * 设置grid的行数
	 */
	setRowCount : function(rows) {
		this.gc.setRowCount(rows);
	},

	/**
	 * 得到grid的列数
	 */
	getColumnCount : function() {
		return this.gc.getColCount();
	},

	/**
	 * 得到grid的行数
	 */
	getRowCount : function() {
		return this.gc.getRowCount();
	},

	/**
	 * 设置列表格头的数目
	 */
	setHeaderColumnCount : function(columns) {
		this.gc.setColHeaderCount(columns);
	},

	/**
	 * 设置行表格头的数目
	 */
	setHeaderRowCount : function(rows) {
		this.gc.setRowHeaderCount(rows);
	},

	/**
	 * 获取列表格头的数目
	 */
	getHeaderColumnCount : function() {
		return this.gc.getColHeaderCount();
	},

	/**
	 * 获取行表格头的数目
	 */
	getHeaderRowCount : function() {
		return this.gc.getRowHeaderCount();
	},
	/**
	 * 设置使用模式
	 * @param mode  1 查看 2 录入 3 设计（默认值）
	 */
	setEditMode : function(mode) {
		this.gc.setEditMode(mode);
	},
	getEditMode : function() {
		return this.gc.getEditMode();
	},

	// 打开当前单元格的编辑器
	openCurrentEditor : function() {
		var p = this.getCurrentCell();
		if (!p) {
			return;
		}
		this.gc.openEditor(p.x, p.y);
	},
	
	/**
	 * 设置一个单元格作为当前单元格，并设置该单元格的颜色。颜色是设置在编辑器上，当前编辑器隐藏是，样式会自动清空。
	 */
	locate:function(col,row,color){
		var c = this.getCell(col,row);
		if(c){
			this.setCurrentCell({x:col,y:row});
			this.setSelection({x:col,y:row,width:1,height:1});
			var e = c.getEditor();
			if(e && color){
				$(e).css('background',color);
			}
		}
	},
	setCurrentCell : function(point, cause) {
		if (point) {
			this.gc.focus();
			this.gc.setCurrentCell(point.x, point.y, cause);
		} else {
			this.gc.setCurrentCell(-1, -1);
		}
	},
	getCurrentCell : function() {
		return this.gc.getCurrentCell();		
	},
	/**
	 *	设置单元格值 
	 */
	setCellValue:function(col,row,st,et){
		var c = this.getCell(col,row);
		c.setShowText(st);
		if(!et){
			et = st;
		}
		c.setEditText(et);		
		this._cellScriptCall(c);
	},
	
	_cellScriptCall:function(c){
		var eObj = this.editorProvider.editors[c.getEditorId()];
		if(eObj && eObj.control && eObj.control.script){			
			var res = this._tableDefine.findTableItem(eObj.table,c.getEditText());
			this._doScript(eObj.control.script,{select:res,source:c});			
		}
	},
	
	setCurrentCellColor : function(currentCellColorFocused, currentCellColorUnFocused) {
		// this.gc.setCurrentCellColor(this.getRGBAColor(currentCellColorFocused));
		// this.gc.setBlurCurrentCellColor(this.getRGBAColor(currentCellColorUnFocused));
	},
	getRGBAColor : function(color) {

	},
	getSelections : function() {
		return this.gc.getSelections();
	},

	getSelection : function() {
		return this.gc.getSelection();
	},	
	setSelection : function(rect) {
		this.setSelections([rect]);
	},
	setSelections:function(rects){
		this.gc.setSelections(rects);
	},
	clearSelection : function() {
		this.gc.clearSelection();
	},
	/**
	 * 设置单元格编辑器提供器
	 */
	setCellEditorProvider : function(provider) {
		this.editorProvider = provider;
	},

	setCellControlProvider : function(provider) {
		this.controlProvider = provider;
	},

	loadData : function(data) {
		this.gc.loadData(eval("(" + data + ")"));
	},
	/**
	 *dataChange
	 */
	addEventListener : function(name, fn) {
		this._eventListenerTable[name] = fn;
	},
	doDispose : function() {
		delete this.gc.dispose();
		delete this.gcDiv;
		delete this.GridCom;
		delete this.gc;
		delete this._eventListenerTable;
	},
	_disableGrid : function(c) {
		if (c.isAncestorOf(this)) {
			// 设置不可用
			this.gc.setEnabled(false);
		}
	},
	_focus : function(e) {
		this._focusDom(e);
	},
	_focusDom : function(event) {
		if (this.gc.getActiveEditor()) {
			return;
		}
		//GCWaitRequest gc是否需要focus方法
		if (this.gc && this.gc.focus) {
			this.gc.focus(event);
		}
	},

	_gcEditorOpenListener : function(e) {
		var cell = e.cell;
		var editor = cell.getEditor();
		if (editor == null) {
			editor = this.editorProvider.getCellEditor(e.grid, cell);
			$(editor).show();
			cell.setEditor(editor);
			editor.focus();
		//	editor.select();
		}
		editor.value = cell.getShowText();
		this._setDoit(e, true);
	},
	_gcEditorShowListener : function(e) {
		var cell = e.cell;
		var editor = cell.getEditor();
		if (editor == null) {
			return;
		}
		// editor.style.display = '';
		$(editor).show();
		editor.focus();
		editor.select();
		this._setDoit(e, false);
	},
	_gcCurrentCellChangedListener : function(e) {
		// this.gc.openEditor(e);
		// this._setDoit(e,f);
	},
	_gcDataChangeListener : function(e) {
		var rect = e.rect;

	},
	_gcCurrentCellChangingListener : function(e) {
		var event = {
			widget : this,
			//row col 为-1,-1表示null
			target : (e.col == -1 && e.row == -1) ? null : {
				"x" : e.col,
				"y" : e.row
			},
			lastCurrent : this.getCurrentCell(),
			doit : true
		};
		this._setDoit(e, event.doit);
	},
	closeEditor : function() {
		this.gc.closeActiveEditor();
	},

	/********common*********/
	getEl : function() {
		return this.el;
	},
	getEid : function() {
		return this._eid;
	},
	getVisible : function() {
		return this._checkState(2097152);
	},
	isVisible : function() {
		var el = this.getEl();
		if (el) {
			var s = this._getClientSize(el);
			return s.width > 0 && s.height > 0 && this.getPageXY(this.el).x < 10000;
		}
		return false;
	},
	isEnabled : function() {
		return true;
		// DNA.widget.WidgetRegistry.isEnabled(DNA.widget.WidgetRegistry.getNode(this.getEid()));
	},
	/********util****/
	_getClientSize : function(dom) {
		var w = dom.clientWidth || 0;
		var h = dom.clientHeight || 0;
		return {
			width : w,
			height : h
		};
	},
	getPageXY : function(dom, owner) {
		var doc = dom.ownerDocument || dom;
		var result;
		if (dom.getBoundingClientRect) {
			var b = dom.getBoundingClientRect();
			result = {
				x : Math.round(b.left),
				y : Math.round(b.top)
			};
		} else if (dom == doc.body || dom == doc || dom == doc.documentElement) {
			result = {
				x : 0,
				y : 0
			};
		} else {
			var x = 0, y = 0;
			var p = dom;
			while (p) {
				var offX = p.offsetLeft;
				var offY = p.offsetTop;
				var style = p.style;
				if (!this.isIE()) {
					if (offX < 0 && (parseInt(style.left, 10) || 0) >= 0)
						offX = 0;
					if (offY < 0 && (parseInt(style.top, 10) || 0) >= 0)
						offY = 0;
				}
				x += offX;
				y += offY;
				if (p != dom) {
					x += parseInt(style.borderLeftWidth, 10) || 0;
					y += parseInt(style.borderTopWidth, 10) || 0;
					var s = this.getScroll(p);
					x -= s.x;
					y -= s.y;
				}
				p = p.offsetParent;
			}
			result = {
				x : x,
				y : y
			};
		}
		// may be the dom is in an iframe
		if (doc.ownerIframe && !owner) {
			var iPos = this.getPageXY(doc.ownerIframe, owner);
			result.x += iPos.x;
			result.y += iPos.y;
		}
		return result;
	},
	isIE : function() {
		return false;
		//TODO :
	},
	getScroll : function(dom) {
		var doc = dom.ownerDocument;
		if (doc)
			return {
				x : dom.scrollLeft,
				y : dom.scrollTop
			};
		// dom为当前页面的document
		// else TODO
		// return this.getDocumentScroll(dom);
	},
	_checkState : function(node, mask) {
		return (node.state & mask) != 0;
	}
});

