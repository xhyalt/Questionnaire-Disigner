Debugger.lock();
COM.widget.Grid = function Grid(shell, data, config) {
	// 默认设置一个id，以方便调试的时候区分
	if (COM.widget.Grid.idCount) {
		this.id = "_grid_" + (COM.widget.Grid.idCount++);
	} else {
		COM.widget.Grid.idCount = 1;
		this.id = "_grid_1";
	}
	/**
	 * 事件监听器
	 */
	this.listeners = {};

	var editPart = null;
	var viewer = null;
	var domain = null;
	/**
	 * grid组件的父控件
	 */
	var parent = null;
	/**
	 * 整个grid组件控件
	 */
	var container = null;
	/**
	 * 一些个性化的配置信息 config: {
	 * ***************************************************************
	 * 事件源，修改控件的事件来源，可为不同事件指定各自的事件源 事件源需要实现类似于dom元素的addEventListener方法
	 * ***************************************************************
	 * eventSource: { mousedown:obj, mouseup:obj }
	 * 
	 * ***************************************************************
	 * 图形工厂，需要有两个方法：
	 * init(colorProvider,imageProivder,headStyle,rowsProvider);初始化工厂，用于给工厂提供一些创建图形时会用到的信息
	 * create(model);返回创建好的图形
	 * ***************************************************************
	 * cellFigureFactory: obj; }
	 */
	var localConfig = config;
	/**
	 * 用于在不可见的状态下设置大小的延迟响应
	 * 在上级iframe不可见的状态下，firefox中给canvasContext设置字体会报错，所以不能再不可见的状态下重绘。
	 * 而不可见状态下会触发重绘的动作基本上就是setSize方法.
	 * 以后可考虑在editpart的onVisiblechange方法中给updateManager加锁来避免在不可见状态下的重绘，但是目前会导致显示错误，
	 * 后面如果没有显示错误了就可以像那样用.
	 */
	var lazySize = null;

	var disposed = false;

	function createContainer() {
		var div = document.createElement('div');
		div.className = 'gridHtml5';
		div.style.position = 'relative';
		div.style.overflow = "hidden";
		return div;
	}
	function getEditPart() {
		return editPart;
	}

	this.reload = function(data) {
		var originVisible = getEditPart().isVisible();
		if (container) {
			parent.removeChild(container);
			doInit.call(this);
			if (data) {
				loadData.call(this, data);
			}
			this.fireEvent('reload', {});
		}
		getEditPart().onVisibleChanged(originVisible);
	};
	this.dispose = function() {
		if (this.isDisposed()) {
			return;
		}
		disposed = true;
		if (container) {
			parent.removeChild(container);
		}
		container = null;
		localConfig = null;
		parent = null;
		lazySize = null;

		if (this.gridModel && this.gridModel.dispose) {
			this.gridModel.dispose();
			this.gridModel = null;
		}

		if (viewer && viewer.dispose) {
			viewer.dispose();
			viewer = null;
		}
		if (editPart && editPart.dispose) {
			editPart.dispose();
			editPart = null;
		}
		if (domain && domain.dispose) {
			domain.dispose();
			domain = null;
		}
		this.listeners = null;
		createContainer = null;
		getEditPart = null;
		checkDispose = null;
		loadData = null;
		doInit = null;
		init = null;
		isVisible = null;
		onVisibleChanged = null;
		for (var key in this) {
			delete this[key];
		}

	}
	this.isDisposed = function() {
		return disposed;
	}

	// 用来存储需要在多个gridModel之间共享的数据,
	// reload的时候，会有新的gridmodel产生，但是他有一些数据需要继续
	// 使用之前的gridmodel相同的数据,比如说copyFunc等。
	var shareManager = {};

	function checkDispose() {
		if (this.isDisposed()) {
			throw "grid has disposed!";
		}
	}

	function loadData(data) {

		this.gridModel = new COM.widget.Grid.GridModel(this, data, localConfig
						? localConfig.cellFigureFactory
						: null);
		this.gridModel.shareManager = shareManager;
		this.gridModel.defaultHelper = new COM.widget.Grid.DefaultHelper();
		viewer.setContents(this.gridModel);
		this.gridModel.onSizeChanged();
		editPart = this.gridModel.editPart;
		editPart.onDataSizeChanged();
		editPart.refreshVisuals_scroll();
	}
	function doInit() {
		container = createContainer();
		parent.appendChild(container);
		domain = new COM.gef.EditDomain(container);
		viewer = new COM.widget.Grid.GridViewer(localConfig
						? localConfig.eventSource
						: null, localConfig ? localConfig.scrollHelper : null);
		var width = this.width || parent.clientWidth;
		var height = this.height || parent.clientHeight;
		viewer.setSize(width, height);
		container.style.width = width + "px";
		container.style.height = height + "px";
		this.width = width;
		this.height = height;
		viewer.setEditPartFactory(new COM.widget.Grid.PartFactory());
		domain.addViewer(viewer);
	}
	function init(shell, data) {
		try {
			parent = shell;
			doInit.call(this);
			if (data) {
				loadData.call(this, data);
			}
		} catch (e) {
			Debugger.error(e);
		}
	}
	this.addListener = function(type, listener, object) {
		var listeners = this.listeners[type];
		if (listeners == null) {
			this.listeners[type] = [];
			listeners = this.listeners[type];
		}
		for (var i = 0, max = listeners.length - 1; i < max; i += 2) {
			if (listeners[i] === listener && listeners[i + 1] === object) {
				return;
			}
		}
		listeners.push(listener);
		listeners.push(object);
	}
	this.removeListener = function(type, listener, object) {
		var listeners = this.listeners[type];
		if (listeners == null) {
			return;
		}
		for (var i = 0, max = listeners.length - 1; i < max; i += 2) {
			if (listeners[i] === listener
					&& (object == null || listeners[i + 1] === object)) {
				listeners.splice(i, 2);
				max -= 2;
				i -= 2;
			}
		}
	}
	this.fireEvent = function(type, e) {
		// if (type != 'cellMouseMove' && type != 'cellMouseIn' && type !=
		// 'cellMouseOut') {
		// Debugger.log('----------------fire: '+type+'-----------------');
		// Debugger.log(e);
		// }
		// if (type == 'gridClick' || type == 'celldbClick') {
		// Debugger.log('----------------fire: '+type+'-----------------');
		// Debugger.log(e);
		// }
		var listeners = this.listeners[type];
		if (listeners == null) {
			return;
		}
		if (e)
			e.grid = this;
		try {
			for (var i = 0, max = listeners.length - 1; i < max; i += 2) {
				if (listeners[i]) {
					if (listeners[i + 1]) {
						listeners[i].call(listeners[i + 1], e);
					} else {
						listeners[i].call(window, e);
					}
				}
			}
		} catch (error) {
			Debugger.error(error);
		}
	}
	// 焦点相关
	this.focus = function() {
		getEditPart().focus();
	}
	this.blur = function() {
		getEditPart().blur();
	}
	this.setId = function(id) {
		this.id = id;
	}
	this.getId = function() {
		return this.id;
	}
	this.setBlurCurrentCellColor = function(color) {
		this.gridModel.data.options.blurCurrentCellColor = color;
	}
	// 用于接收外部主动触发键盘事件
	/**
	 * 外部可主动调用这三个方法以触发键盘事件
	 * 
	 * @param {BrowserEvent}
	 *            e
	 */
	this.keyEnter = function() {
		getEditPart().performKeyEnter();
	}
	/**
	 * COM.widget.Grid.ENTER_NEXT_NONE COM.widget.Grid.ENTER_NEXT_LEFT
	 * COM.widget.Grid.ENTER_NEXT_UP COM.widget.Grid.ENTER_NEXT_RIGHT
	 * COM.widget.Grid.ENTER_NEXT_DOWN
	 * 
	 * @param {}
	 *            direction
	 */
	this.keyDirection = function(direction) {
		getEditPart().performKeyDirection(direction);
	}
	/**
	 * 设置grid控件大小
	 * 
	 * @param {Number}
	 *            width
	 * @param {Number}
	 *            height
	 */
	this.setSize = function(width, height) {

		if (!isVisible()) {
			lazySize = {
				'width' : width,
				'height' : height
			};
			return;
		}
		if (width == this.width && height == this.height) {
			return;
		}
		this.width = width;
		this.height = height;
		container.style.width = width + "px";
		container.style.height = height + "px";

		if (viewer) {
			viewer.setSize(width, height);
		}
		this.gridModel.onSizeChanged(width, height);
		// getEditPart().onDataSizeChanged();
		getEditPart().onSizeChanged();
		getEditPart().refreshVisuals_scroll();
	}
	/**
	 * 获取grid控件数据大小
	 * 
	 * @return {Dimension}
	 */
	this.getDataSize = function() {
		return this.gridModel.getDataSize();
	}
	// 首选项

	// 数据加载模式
	this.getDataLoadMode = function() {
		return this.gridModel.data.options.loadMode;
	}
	// 选择模式
	this.setSelectionMode = function(mode) {
		this.gridModel.data.options.selectionMode = mode;
	}
	this.getSelectionMode = function() {
		return this.gridModel.data.options.selectionMode;
	}
	// 编辑模式
	this.setEditMode = function(mode) {
		if (this.gridModel.data.options.editMode == mode) {
			return;
		}
		this.gridModel.data.options.editMode = mode;
		if (mode == COM.widget.Grid.EDIT_MODE_READ_ONLY) {
			this.closeActiveEditor();
		} else if (mode == COM.widget.Grid.EDIT_MODE_INPUT
				&& !this.getCurrentCell().isEditable()) {
			this.closeActiveEditor();
		}
		// 清空在不可编辑时输入的值
		getEditPart().clearInputCache();

		var cell = getEditPart().getCurrentCellColRow();

		this.fireEvent(COM.widget.Grid.Event.EDIT_MODE_CHANGED, {
					col : cell.col,
					row : cell.row
				});
	}
	this.getEditMode = function() {
		return this.gridModel.data.options.editMode;
	}
	// 按下回车键的移动方向
	this.setEnterNext = function(dire) {
		this.gridModel.setEnterNext(dire);
	}
	this.getEnterNext = function() {
		return this.gridModel.getEnterNext();
	}
	// 可否行选
	this.setRowSelectable = function(selectable) {
		this.gridModel.data.options.rowSelectable = selectable;
	}
	this.isRowSelectable = function() {
		return this.gridModel.data.options.rowSelectable;
	}
	// 行高列宽是否可修改的细粒度控制
	// 初始化之后不允许再修改
	/**
	 * 支持设置某一行是否可改变列宽和某一列是否可改变行高
	 */
	this.setAdvancedResize = function(value) {
		// this.gridModel.data.options.advancedResize = value;
	}
	this.isAdvancedResize = function() {
		return this.gridModel.isAdvancedResize();
	}
	// @unsupported
	// this.setRowRowResizeable = function (row,value) {
	// this.gridModel.setRowRowResizeable(row,value);
	// }
	this.setRowColResizeable = function(row, value) {
		this.gridModel.setRowColResizeable(row, value);
	}
	// @unsupported
	// this.setColColResizeable = function (col,value) {
	// this.gridModel.setColColResizeable(col,value);
	// }
	this.setColRowResizeable = function(col, value) {
		this.gridModel.setColRowResizeable(col, value);
	}
	// @unsupported
	// this.isRowRowResizeable = function (row) {
	// return this.gridModel.isRowRowResizeable(row);
	// }
	this.isRowColResizeable = function(row) {
		return this.gridModel.isRowColResizeable(row);
	}
	// @unsupported
	// this.isColColResizeable = function (col) {
	// return this.gridModel.isColColResizeable(col);
	// }
	this.isColRowResizeable = function(col) {
		return this.gridModel.isColRowResizeable(col);
	}
	// 可否列选
	this.setColSelectable = function(selectable) {
		this.gridModel.data.options.colSelectable = selectable;
	}
	this.isColSelectable = function() {
		return this.gridModel.data.options.colSelectable;
	}
	// 是否忽略隐藏
	this.setIgnoreHidden = function(ignore) {
		// TODO
		this.gridModel.data.options.ignoreHidden = ignore;
	}
	this.isIgnoreHidden = function() {
		return this.gridModel.data.options.ignoreHidden;
	}
	// 可否改变列宽
	this.setColResizeable = function(resizeable) {
		this.gridModel.data.options.colResizeable = resizeable;
	}
	this.isColResizeable = function() {
		return this.gridModel.data.options.colResizeable;
	}
	// 可否改变行高
	this.setRowResizeable = function(resizeable) {
		this.gridModel.data.options.rowResizeable = resizeable;
	}
	this.isRowResizeable = function() {
		return this.gridModel.data.options.rowResizeable;
	}
	// 可否在任意地方改变列宽
	this.setColFreeResizeable = function(resizeable) {
		this.gridModel.data.options.colFreeResizeable = resizeable;
	}
	this.isColFreeResizeable = function() {
		return this.gridModel.data.options.colFreeResizeable;
	}
	// 可否在任意地方改变行高
	this.setRowFreeResizeable = function(resizeable) {
		this.gridModel.data.options.rowFreeResizeable = resizeable;
	}
	this.isRowFreeResizeable = function() {
		return this.gridModel.data.options.rowFreeResizeable;
	}
	// 设置列抢占
	this.setColGrabable = function(grabable) {
		if (this.gridModel.data.options.colGrabable != grabable) {
			this.gridModel.data.options.colGrabable = grabable;
			this.gridModel.freshColGrab(grabable);
		}
	}
	this.isColGrabable = function() {
		return this.gridModel.data.options.colGrabable;
	}
	// 是否显示选择框
	this.setShowSelectionBorder = function(show) {
		this.gridModel.data.options.showSelectionBorder = show;
	}
	this.isShowSelectionBorder = function() {
		return this.gridModel.data.options.showSelectionBorder;
	}
	// 是否突出显示当前单元格
	this.setCurrenCellBorderHidden = function(hidden) {
		this.gridModel.data.options.currentCellBorderHidden = hidden;
	}
	this.isCurrenCellBorderHidden = function() {
		return this.gridModel.data.options.currentCellBorderHidden;
	}
	// 是否允许列交换
	this.setColExchangeable = function(exchangeable) {
		this.gridModel.data.options.colExchangeable = exchangeable;
	}
	this.isColExchangeable = function() {
		return this.gridModel.data.options.colExchangeable;
	}
	// 是否跳过只读
	this.setPassReadonly = function(pass) {
		this.gridModel.data.options.passReadOnly = pass;
	}
	this.isPassReadOnly = function() {
		return this.gridModel.data.options.passReadOnly;
	}
	// 是否显示选择改变选择区域的按钮
	this.setShowSelectionChange = function(isshow) {
		// TODO
		this.gridModel.data.options.showSelectionChange = isshow;
	}
	this.isShowSelectionChange = function() {
		return this.gridModel.data.options.showSelectionChange;
	}
	// 选中颜色
	this.setSelectionColor = function(color) {
		this.gridModel.data.options.slectionColor = color;
	}
	this.getSelectionColor = function() {
		return this.gridModel.data.options.slectionColor;
	}
	// 选择框颜色
	this.setSelectionBorderColor = function(color) {
		this.gridModel.data.options.selectionBorderColor = color;
	}
	this.getSelectionBorderColor = function() {
		return this.gridModel.data.options.selectionBorderColor;
	}
	// 当前单元格颜色
	this.setCurrentCellColor = function(color) {
		this.gridModel.data.options.currentCellColor = color;
	}
	this.getCurrentCellColor = function() {
		return this.gridModel.data.options.currentCellColor;
	}
	// 默认边框颜色
	this.setDefaultBorderColor = function(color) {
		this.gridModel.data.options.defaultBorderColor = color;
	}
	this.getDefaultBorderColor = function() {
		return this.gridModel.data.options.defaultBorderColor;
	}
	// 默认边框样式
	this.setDefaultBorderStyle = function(style) {
		this.gridModel.data.options.defaultBorderStyle = style;
	}
	this.getDefaultBorderStyle = function() {
		return this.gridModel.data.options.defaultBorderStyle;
	}
	// 当前单元格边框颜色
	this.setCurrentCellBorderColor = function(color) {
		this.gridModel.data.options.currentCellBorderColor = color;
	}
	this.getCurrentCellBorderColor = function() {
		return this.gridModel.data.options.currentCellBorderColor;
	}
	// 合并单元格显示模式
	this.setMergeCellShowMode = function(mode) {
		this.gridModel.data.options.mergeCellShowMode = mode;
	}
	this.getCellShowMode = function() {
		return this.gridModel.data.options.mergeCellShowMode;
	}

	// 当前单元格
	this.getCurrentCell = function() {
		return getEditPart().getCurrentCell();
	}
	this.setCurrentCell = function(col, row, cause) {
		var c = cause ? cause : {
			'type' : COM.widget.Grid.CAUSE_CALL
		};
		if (this.getDataLoadMode() != COM.widget.Grid.LOAD_MODE_NORMAL) {
			getEditPart().setCurrentCellWidthDataCheck(col, row, c);
		} else {
			getEditPart().setCurrentCell(col, row, c);
		}
	}

	// 滚动条
	this.setScrollLeft = function(value) {
		getEditPart().setScrollLeft(value);
	}
	this.setScrollTop = function(value) {
		getEditPart().setScrollTop(value);
	}
	this.getScrollLeft = function() {
		return getEditPart().getFixedScrollLeft();
	}
	this.getScrollTop = function() {
		return getEditPart().getFixedScrollTop();
	}
	this.getAbsoluteScrollLeft = function() {
		return getEditPart().getScrollLeft();
	}
	this.getAbsoluteScrollTop = function() {
		return getEditPart().getScrollTop();
	}
	this.getScrollHeight = function() {
		return getEditPart().getScrollHeight();
	}
	this.getScrollWidth = function() {
		return getEditPart().getScrollWidth();
	}

	// 选择
	this.addSelection = function(col, row, width, height, notAdjust) {
		getEditPart().addSelection(new Rectangle(col, row, width, height),
				notAdjust);
	}
	this.getSelections = function() {
		var selections = getEditPart().getSelections();
		var result = [];
		var rect;
		if (selections != null && selections.length > 0) {
			for (var i = 0, max = selections.length; i < max; i++) {
				rect = selections[i];
				result[i] = {
					'x' : rect.x,
					'y' : rect.y,
					'width' : rect.width,
					'height' : rect.height
				};
			}
		}
		return result;
	}
	this.getSelection = function() {
		var selection = getEditPart().getSelection();
		var result = null;
		if (selection != null) {
			result = {
				'x' : selection.x,
				'y' : selection.y,
				'width' : selection.width,
				'height' : selection.height
			};
		}
		return result;
	}
	this.select = function(rect, notAdjust) {
		var selection;
		if (rect != null) {
			selection = new Rectangle(rect.x, rect.y, rect.width, rect.height);
		}
		if (selection && !selection.isEmpty()) {
			return getEditPart().select(selection, notAdjust);
		} else {
			return this.clearSelection();
		}

	}
	this.setSelections = function(selections, notAdjust) {
		var array = [];
		var rect;
		var i;
		var selection;
		if (selections) {
			for (i = 0; i < selections.length; i++) {
				var selection = selections[i];
				rect = new Rectangle(selection.x, selection.y, selection.width,
						selection.height);
				if (!rect.isEmpty()) {
					array.push(rect);
				}
			}
		}
		if (array.length > 0) {
			if (this.getDataLoadMode() != COM.widget.Grid.LOAD_MODE_NORMAL) {
				getEditPart().setSelectionsWidthDataCheck(array, notAdjust);
			} else {
				getEditPart().setSelections(array, notAdjust);
			}
		} else {
			this.clearSelection();
		}

	}
	this.clearSelection = function() {
		getEditPart().clearSelection();
	}

	// 总体大小
	this.setColCount = function(cols) {
		this.gridModel.setColCount(cols);
	}
	this.setRowCount = function(rows) {
		this.gridModel.setRowCount(rows);
	}
	this.getRowCount = function() {
		return this.gridModel.getRowCount();
	}
	this.getColCount = function() {
		return this.gridModel.getColCount();
	}

	// 表头表尾
	this.setColHeaderCount = function(cols) {
		return this.gridModel.setColHeaderCount(cols);
	}
	this.setRowHeaderCount = function(rows) {
		return this.gridModel.setRowHeaderCount(rows);
	}
	this.setColFooterCount = function(cols) {
		return this.gridModel.setColFooterCount(cols);
	}
	this.setRowFooterCount = function(rows) {
		return this.gridModel.setRowFooterCount(rows);
	}
	this.getRowHeaderCount = function() {
		return this.gridModel.getRowHeaderCount();
	}
	this.getColHeaderCount = function() {
		return this.gridModel.getColHeaderCount();
	}
	this.getRowFooterCount = function() {
		return this.gridModel.getRowFooterCount();
	}
	this.getColFooterCount = function() {
		return this.gridModel.getColFooterCount();
	}

	// 行列
	this.setRowHeight = function(row, height) {
		this.gridModel.setRowSize(row, height);
	}
	this.setColWidth = function(col, width) {
		this.gridModel.setColSize(col, width);
	}
	this.getRowHeight = function(row) {
		return this.gridModel.getRowSize(row);
	}
	this.getColWidth = function(col) {
		return this.gridModel.getColSize(col);
	}
	this.insertCols = function(index, count, copyIndex, copyWay) {
		if (copyWay == null) {
			copyWay = COM.widget.Grid.COPY_STYLE;
		}
		var command = new COM.widget.Grid.InsertColsCommand();
		command.setGridModel(this.gridModel).setIndex(index).setCount(count)
				.setCopyIndex(copyIndex).setCopyWay(copyWay);
		domain.getCommandStack().execute(command);
	}
	this.insertRows = function(index, count, copyIndex, copyWay) {
		if (copyWay == null) {
			copyWay = COM.widget.Grid.COPY_STYLE;
		}
		var command = new COM.widget.Grid.InsertRowsCommand();
		command.setGridModel(this.gridModel).setIndex(index).setCount(count)
				.setCopyIndex(copyIndex).setCopyWay(copyWay);
		domain.getCommandStack().execute(command);
	}
	this.deleteCols = function(index, count) {
		var command = new COM.widget.Grid.DeleteColsCommand();
		command.setGridModel(this.gridModel).setIndex(index).setCount(count);
		domain.getCommandStack().execute(command);
	}
	this.deleteRows = function(index, count) {
		var command = new COM.widget.Grid.DeleteRowsCommand();
		command.setGridModel(this.gridModel).setIndex(index).setCount(count);
		domain.getCommandStack().execute(command);
	}
	this.setColVisible = function(col, visible) {
		this.gridModel.setColVisible(col, visible);
	}
	this.setRowVisible = function(row, visible) {
		this.gridModel.setRowVisible(row, visible);
	}
	this.isColHidden = function(col) {
		return this.gridModel.isColHidden(col);
	}
	this.isRowHidden = function(row) {
		return this.gridModel.isRowHidden(row);
	}
	this.setRowBackgroundColor = function(row, color) {
		this.gridModel.setRowBackgroundColor(row, color);
	}
	this.setColGrab = function(col, grab) {
		this.gridModel.setColGrab(col, grab);
	}
	this.isColGrab = function(col) {
		return this.gridModel.getColGrab(col);
	}
	this.setRowAutoHeight = function(row, auto) {
		this.gridModel.setRowAutoHeight(row, auto);
	}
	this.isRowAutoHeight = function(row) {
		return this.gridModel.isRowAutoHeight(row);
	}
	this.setColAutoWidth = function(col, auto) {
		this.gridModel.setRowAutoHeight(row, auto);
	}
	this.isColAutoWidth = function(col) {
		return this.gridModel.isRowAutoHeight(row);
	}

	// 合并单元格
	this.mergeCell = function(col, row, width, height) {
		this.gridModel.mergeCell(col, row, width, height);
	}
	this.unMergeCell = function(col, row, force) {
		this.gridModel.unMergeCell(col, row, force);
	}

	// 复制粘贴
	this.paste = function(rect, deal) {
		this.gridModel.paste(rect.x, rect.y);
	}
	this.cut = function(rect, style) {
		return this.gridModel.cut(rect);
	}
	this.copy = function(rect, style) {
		return this.gridModel.copy(rect);
	}
	this.setCopyFunction = function(fn, obj) {
		shareManager.copyFunction = fn;
		shareManager.copyObj = obj;
	}
	this.setPasteFunction = function(fn, obj) {
		shareManager.pasteFunction = fn;
		shareManager.pasteObj = obj;
	}

	// 树形相关
	/**
	 * 这两个关于属性的方法将取消，请勿使用。如需展开和收起树，请使用insertRows，deletRows,setDepth,MergeCell进行组装。
	 * 
	 * @param {}
	 *            col
	 * @param {}
	 *            row
	 * @param {}
	 *            data
	 */
	this.expandTree = function(col, row, data) {
		// TODO 取消
	}
	this.collapseTree = function(col, row) {
		// TODO 取消
	}

	// 编辑器
	this.setDefaultEditor = function(editor) {
		this.gridModel.setDefaultEditor(editor);
	}
	this.setDefaultEditorId = function(editorid) {
		this.gridModel.setDefaultEditorId(editorid);
	}
	this.getDefaultEditorId = function() {
		return this.gridModel.getDefaultEditorId();
	}
	this.getDefaultEditor = function() {
		return this.gridModel.getDefaultEditor();
	}
	this.getActiveEditorId = function() {
		return getEditPart().getActiveEditorId();
	}
	this.getActiveEditor = function() {
		return getEditPart().getActiveEditor();
	}
	/**
	 * 外部主动调用打开编辑器。 此方法可能会触发当前单元格的移动。
	 * 
	 * @param {Number}
	 *            col
	 * @param {Number}
	 *            row
	 */
	this.openEditor = function(col, row) {
		getEditPart().setCurrentCell(col, row, {
					'type' : COM.widget.Grid.CAUSE_CALL
				});
		getEditPart().editCurrentCell({
					'type' : COM.widget.Grid.CAUSE_CALL
				});
	}
	this.editCurrentCell = function(cause) {
		getEditPart().editCurrentCell(cause || {
			'type' : COM.widget.Grid.CAUSE_CALL
		});
	}
	this.closeActiveEditor = function() {
		getEditPart().commitEdit(COM.widget.Grid.CAUSE_CALL);
	}

	// 其他
	this.clearText = function(rect) {
		this.gridModel.clearText(rect, COM.widget.Grid.CAUSE_CALL);
	}
	/**
	 * 获取指定坐标所在的单元格，返回json格式{col:Number,row:Number}，如果查无此单元格返回{col:-1,row:-1}
	 * 
	 * @param {}
	 *            x
	 * @param {}
	 *            y
	 * @return {}
	 */
	this.getCellByPoint = function(x, y) {
		var colRow = getEditPart().getColRow(x, y);
		if (colRow == null) {
			return {
				'col' : -1,
				'row' : -1
			};
		}
		return colRow;
	}
	// 加载数据，unkown表示在初始化时是否只奥该数据，就是colCount、rowCount和widht,height中是否有此
	this.loadData = function(data) {
		this.gridModel.loadData(data.byRow, data.list, data.unknown);

	}
	this.setColHeadCursor = function(cursor) {
		this.gridModel.setColHeadCursor(cursor);

	}
	this.setRowHeadCursor = function(cursor) {
		this.gridModel.setRowHeadCursor(cursor);
	}
	this.getCell = function(col, row) {
		var cell = this.gridModel.getCellController(col, row);
		return cell;
	}

	/**
	 * 清除区域中单元格的内容和样式
	 * 
	 * @param force
	 *            是否强制清除，为false时不会清除不可编辑的单元格
	 */
	this.clearRect = function(rect, force) {
		this.gridModel.clearRect(rect, COM.widget.Grid.CAUSE_CLEAR, force);
	}
	/**
	 * 删除区域中的单元格
	 * 
	 * @param deal
	 *            右侧单元格左移或者下侧单元格上移
	 * 
	 */
	this.deleteRect = function(rect, deal) {
		this.gridModel.deleteRect(rect, deal);
	}
	this.isEditing = function() {
		return getEditPart().isEditing();
	}
	this.setCellDefaultBorderStyle = function(right, bottom, diagonal,
			inverseDiagonal) {
	}
	this.getCellDefaultBorderStyle = function() {
	}
	// ********************************获取高宽信息相关-开始****************************************
	/**
	 * 获取控件高度
	 * 
	 * @return {}
	 */
	this.getHeight = function() {
		return this.height;
	}
	/**
	 * 获取控件宽度
	 * 
	 * @return {}
	 */
	this.getWidth = function() {
		return this.width;
	}
	/**
	 * 获取数据客户端高度
	 * 
	 * @return {}
	 */
	this.getDataClientHeight = function() {
		return this.gridModel.getDataClientHeight();
	}
	/**
	 * 获取数据客户端宽度
	 * 
	 * @return {}
	 */
	this.getDataClientWidth = function() {
		return this.gridModel.getDataClientWidth();
	}
	/**
	 * 获取数据高度
	 * 
	 * @return {}
	 */
	this.getDataHeight = function() {
		return this.gridModel.getDataHeight();
	}
	/**
	 * 获取数据宽度
	 * 
	 * @return {}
	 */
	this.getDataWidth = function() {
		return this.gridModel.getDataWidth();
	}
	// *******************************获取高宽信息相关-结束**************************************

	this.beginUpdate = function() {
		getEditPart().getFigure().getUpdateManager().lock();
	}
	this.endUpdate = function() {
		getEditPart().getFigure().getUpdateManager().unlock();
		getEditPart().getFigure().getUpdateManager().queueWork();
	}

	this.getImageUrlById = function(id) {
		return id;
	}
	this.setEnabled = function(enbaled) {
		this.gridModel.setEnabled(enbaled);
	}
	this.setShowInsDelAnimation = function(show) {
		this.gridModel.setShowInsDelAnimation(show);
	}
	this.isShowInsDelAnimation = function() {
		return this.gridModel.isShowInsDelAnimation();
	}
	this.canCellEdit = function(col, row) {
		var cell = getEditPart().getCell(col, row);
		return getEditPart().canEdit(cell);
	}
	this.appendChild = function(obj) {
		var parent = viewer.getElement();
		parent.appendChild(obj);
	}
	this.removeChild = function(obj) {
		var parent = viewer.getElement();
		parent.removeChild(obj);
	}
	// 此属性不会影响表格的可见性，只作为一个标识
	this.setVisible = function(value) {
		if (isVisible() == value) {
			return;
		}
		getEditPart().onVisibleChanged(value);
		onVisibleChanged.call(this, value);

	}
	var onVisibleChanged = function(value) {
		if (value) {
			if (lazySize) {
				this.setSize(lazySize.width, lazySize.height);
				lazySize = null;
			}
		}
	}
	var isVisible = function() {
		return getEditPart().isVisible();
	}
	this.isVisible = isVisible;
	/**
	 * 获取绘图区域信息 obj.startRow obj.startCol obj.endRow obj.endCol
	 */
	this.getDrawAreaInfo = function() {
		var obj = {};
		obj.startRow = getEditPart().drawStartRow;
		obj.startCol = getEditPart().drawStartCol;
		obj.endRow = getEditPart().drawEndRow;
		obj.endCol = getEditPart().drawEndCol;
		return obj;
	}

	init.call(this, shell, data);

}

COM.widget.Grid.ThemeProvider = {
	UNCHECKED_IMAGE : ImageResourceManager
			.getImage("data:image/gif;base64,R0lGODlhDQANAPcAAEJCQrW1tc7OztbWzv///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ywAAAAADQANAAAIPQAFBBhIsGAAAgEAKFzIUABCAAQiSpToMOHEixUhXqT4cCNHix4JZAwpsmPIkSdNeqwooOUAlwJeDiB5MSAAOw=="),
	CHECKED_IMAGE : ImageResourceManager
			.getImage("data:image/gif;base64,R0lGODlhDQANAPcAAAAAAEJCQrW1tc7OztbWzv///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ywAAAAADQANAAAITwAHCBhIsKCAAgICKFzIcADCAAUiSpToMOFEiQAKVIR4EUBGAg8LZIzoMeNGkRlLRgRpsaRHiiFRjlwZU+TFkxdhChjAk8AAnz9/5hxaICAAOw=="),
	getUnCheckedImage : function() {
		return this.UNCHECKED_IMAGE;
	},
	getCheckedImage : function() {
		return this.CHECKED_IMAGE;
	},
	getDefaultHeadColor : function() {
		return '#f0f';
	}
}
COM.widget.Grid.deserialize = function(data) {
	function replaceDefaultStyle(rowList, style) {
		if (rowList == null || style == null) {
			return;
		}
		var rowCells;
		var cell;

		var i, j, k, soruce, target, key;
		for (i = 0; i < rowList.length; i++) {

			rowCells = rowList[i];

			if (rowCells == null) {
				continue;
			}
			for (j = 0; j < rowCells.length; j++) {
				cell = rowCells[j];
				if (cell == null) {
					continue;
				}
				// 恢复传输过程中省略的样式属性（标题栏没有省略，所以不用恢复）
				if (i > 0 && j > 0) {
					for (key in style) {
						if (key == 'borderColor' || key == 'border'
								|| key == 'padding'
								|| key == 'gradientBackground') {
							continue;
						}
						if (typeof cell[key] == 'undefined'
								&& typeof style[key] != 'undefined') {
							cell[key] = style[key];
						}
					}
					// borderColor
					if (typeof cell['borderColor'] == 'undefined'
							&& typeof style['borderColor'] != 'undefined') {
						var source = style['borderColor'];
						var target = [];
						cell['borderColor'] = target;
						for (k = 0; k < source.length; k++) {
							target[k] = source[k];
						}
					}
					// border
					if (typeof cell['border'] == 'undefined'
							&& typeof style['border'] != 'undefined') {
						var source = style['border'];
						var target = [];
						cell['border'] = target;
						for (k = 0; k < source.length; k++) {
							target[k] = source[k];
						}
					}
					// padding
					if (typeof cell['padding'] == 'undefined'
							&& typeof style['padding'] != 'undefined') {
						source = style['padding'];
						target = [];
						cell['padding'] = target;
						for (k = 0; k < source.length; k++) {
							target[k] = source[k];
						}
					}
					// gradientColor1
					if (typeof cell['gradientBackground'] == 'undefined'
							&& typeof style['gradientBackground'] != 'undefined') {
						source = style['gradientBackground'];
						target = {};
						cell['gradientBackground'] = target;
						for (key in source) {
							target[key] = source[key];
						}
					}

				}
				// cellMode
				if (cell.cellMode == null) {
					cell.cellMode = COM.widget.Grid.Cell.Cell_MODE_NORMAL;
				}
				// 恢复简写的属性名
				// key
				cell['showText'] = cell['1'];
				cell['editText'] = cell['2'];
				cell['colIndex'] = cell['3'];
				cell['rowIndex'] = cell['4'];

				delete cell['1'];
				delete cell['2'];
				delete cell['3'];
				delete cell['4'];
			}
		}
	}

	var cells = data.cells;
	if (cells) {
		var rowList = cells.rowList;
	}
	if (rowList) {
		replaceDefaultStyle(rowList, data.defaultStyle);
	}

}
// 常量
COM.widget.Grid.LOAD_MODE_NORMAL = 1;
COM.widget.Grid.LOAD_MODE_LAZY = 2;
COM.widget.Grid.LOAD_MODE_STREAM = 3;

COM.widget.Grid.SELECTION_MODE_ROW = 1;
COM.widget.Grid.SELECTION_MODE_COL = 2;
COM.widget.Grid.SELECTION_MODE_MULTI = 3;
COM.widget.Grid.SELECTION_MODE_SINGLE = 4;

COM.widget.Grid.EDIT_MODE_READ_ONLY = 1;
COM.widget.Grid.EDIT_MODE_INPUT = 2;
COM.widget.Grid.EDIT_MODE_EDIT = 3;

COM.widget.Grid.DELETE_DEAL_VERTI = 1;
COM.widget.Grid.DELETE_DEAL_HORIZ = 2;

COM.widget.Grid.ENTER_NEXT_NONE = 0;
COM.widget.Grid.ENTER_NEXT_UP = 1;
COM.widget.Grid.ENTER_NEXT_LEFT = 2;
COM.widget.Grid.ENTER_NEXT_DOWN = 3;
COM.widget.Grid.ENTER_NEXT_RIGHT = 4;

COM.widget.Grid.MERGE_SHOW_MODE_NORMAL = 1;
COM.widget.Grid.MERGE_SHOW_MODE_CONTRACT = 2;

COM.widget.Grid.RESULT_FALSE = 0;
COM.widget.Grid.RESULT_TRUE = 1;

COM.widget.Grid.COPY_CONTENT = 1;
COM.widget.Grid.COPY_STYLE = 2;
COM.widget.Grid.COPY_BOTH = COM.widget.Grid.COPY_CONTENT
		| COM.widget.Grid.COPY_STYLE;

COM.widget.Grid.PASTE_TEXT = 1;
COM.widget.Grid.PASTE_STYLE = 2;
COM.widget.Grid.PASTE_BOTH = COM.widget.Grid.PASTE_TEXT
		| COM.widget.Grid.PASTE_STYLE;

COM.widget.Grid.CAUSE_MOUSE = 1;
COM.widget.Grid.CAUSE_KEY = 2;
COM.widget.Grid.CAUSE_CALL = 3;
COM.widget.Grid.CAUSE_CLEAR = 4;
COM.widget.Grid.CAUSE_CUT = 5;
COM.widget.Grid.CAUSE_PASTE = 6;
COM.widget.Grid.CAUSE_INPUT = 7;
COM.widget.Grid.CAUSE_DELETE = 8;
COM.widget.Grid.CAUSE_CLICKFACE = 9;

COM.widget.Grid.BUTTON_LEFT = 1;
COM.widget.Grid.BUTTON_RIGHT = 2;
COM.widget.Grid.BUTTON_CENTER = 4;

COM.widget.Grid.CURRENT_CELL_SHOW_TYPE = {
	BORDER : true,
	BACK : false
}

COM.widget.Grid.Cell = function(cell, gridModel) {
	this.cell = cell;
	this.gridModel = gridModel;
}
// 内容
COM.widget.Grid.Cell.prototype.setEditorId = function(id) {
	this.gridModel.setCellEditorId(this.cell.colIndex, this.cell.rowIndex, id);
	// this.cell.editorId = id;
	// this.cell.editor = null;
}
COM.widget.Grid.Cell.prototype.getEditorId = function() {
	return this.cell.editorId;
}
COM.widget.Grid.Cell.prototype.setEditor = function(editor) {
	this.cell.editor = editor;
}
COM.widget.Grid.Cell.prototype.getEditor = function() {
	return this.cell.editor;
}
COM.widget.Grid.Cell.prototype.setTitle = function(title) {
	this.cell.title = title;
	if (this.cell.figure) {
		this.cell.figure.setToolTip(title);
	}
}
COM.widget.Grid.Cell.prototype.getTitle = function() {
	return this.cell.title;
}
COM.widget.Grid.Cell.prototype.getShowText = function() {
	return this.cell.showText;
}
COM.widget.Grid.Cell.prototype.setShowText = function(showText, silence) {
	if (this.cell.figure) {
		this.cell.figure.setText(showText);
		this.cell.figure.repaint();
	}
	if (this.getCellMode() == COM.widget.Grid.Cell.Cell_MODE_HTML) {
		this.setCellMode(COM.widget.Grid.Cell.Cell_MODE_NORMAL);
	}
	if (showText == this.cell.showText) {
		return;
	}
	this.cell.showText = showText;
	if (silence !== true) {
		this.gridModel.fireEvent(COM.widget.Grid.Event.DATA_CHANGE, {
					'rect' : {
						'x' : this.getCol(),
						'y' : this.getRow(),
						'width' : 1,
						'height' : 1
					},
					'cause' : COM.widget.Grid.CAUSE_CALL
				});
	}
}
COM.widget.Grid.Cell.prototype.getEditText = function() {
	return this.cell.editText;
}
COM.widget.Grid.Cell.prototype.setEditText = function(editText, silence) {
	if (editText == this.cell.editText) {
		return;
	}
	this.cell.editText = editText;
	if (silence !== true) {
		this.gridModel.fireEvent(COM.widget.Grid.Event.DATA_CHANGE, {
					'rect' : {
						'x' : this.getCol(),
						'y' : this.getRow(),
						'width' : 1,
						'height' : 1
					},
					'cause' : COM.widget.Grid.CAUSE_CALL
				});
	}
}
COM.widget.Grid.Cell.prototype.setHtml = function(html) {
	this.setCellMode(COM.widget.Grid.Cell.Cell_MODE_HTML);

	this.cell.html = html;
	var child = this.cell.figure;

	if (child) {
		child.setText("");
		child.setHtml(html);
		var parent = child.getParent();
		if (parent) {
			child.appendControl(parent.getZindex(child), parent.controlParent);
		}
	}

	// this.gridModel.fireEvent('dataChange',
	// {'rect':{'x':this.getCol(),'y':this.getRow(),'width':1,'height':1},'cause':COM.widget.Grid.CAUSE_CALL});
}
COM.widget.Grid.Cell.prototype.getHtml = function() {
	return this.cell.html;
}
COM.widget.Grid.Cell.prototype.getCol = function() {
	return this.cell.colIndex;
}
COM.widget.Grid.Cell.prototype.getRow = function() {
	return this.cell.rowIndex;
}
// 合并信息
COM.widget.Grid.Cell.prototype.getColSpan = function() {
	return this.cell.colSpan;
}
COM.widget.Grid.Cell.prototype.getRowSpan = function() {
	return this.cell.rowSpan;
}
COM.widget.Grid.Cell.prototype.getMergedInfo = function() {
	// 如果在不是合并单元格时，返回空
	/*
	 * if (!this.cell.mergeInfo) { this.cell.mergeInfo = { 'col': this.getCol(),
	 * 'row': this.getRow() }; }
	 */
	if (this.cell.merged) {
		return this.cell.mergeInfo;
	}
}

// 自定义单元格
COM.widget.Grid.Cell.prototype.setControl = function(control) {
	this.setCellMode(COM.widget.Grid.Cell.Cell_MODE_CONTROL);

	this.cell.control = control;
	var figure = this.cell.figure;

	if (figure) {
		figure.setControl(control);
		var parent = figure.getParent();
		if (parent) {
			figure
					.appendControl(parent.getZindex(figure),
							parent.controlParent);
		}

	}
	// this.gridModel.fireEvent('dataChange',
	// {'rect':{'x':this.getCol(),'y':this.getRow(),'width':1,'height':1},'cause':COM.widget.Grid.CAUSE_CALL});
}
COM.widget.Grid.Cell.prototype.getControl = function() {
	return this.cell.control;
}
COM.widget.Grid.Cell.prototype.reomveControl = function() {
	this.cell.control = null;
	this.cell.cellMode = COM.widget.Grid.Cell.Cell_MODE_NORMAL;
	if (this.cell.figure) {
		this.cell.figure.setCellMode(COM.widget.Grid.Cell.Cell_MODE_NORMAL);
	}
}
COM.widget.Grid.Cell.prototype.romoveHtml = function() {
	this.cell.html = null;
	this.cell.cellMode = COM.widget.Grid.Cell.Cell_MODE_NORMAL;
	if (this.cell.figure) {
		this.cell.figure.setCellMode(COM.widget.Grid.Cell.Cell_MODE_NORMAL);
	}
}

// 操作性
COM.widget.Grid.Cell.prototype.setSelectable = function(selectable) {
	this.cell.selectable = selectable;
}
COM.widget.Grid.Cell.prototype.isSelectable = function() {
	return this.cell.selectable;
}
COM.widget.Grid.Cell.prototype.setEditable = function(editable) {
	if (this.cell.editable == editable) {
		return;
	}
	this.cell.editable = editable;
	this.gridModel.freshEditable(this.getCol(), this.getRow(), editable);
}
COM.widget.Grid.Cell.prototype.isEditable = function() {
	return this.cell.editable;
}

// 树形
COM.widget.Grid.Cell.prototype.setTreeImage = function(image) {
	this.setCellMode(COM.widget.Grid.Cell.Cell_MODE_TREE);
	this.cell.treeImage = image;
	if (this.cell.figure) {
		if (image) {
			this.cell.figure.setTreeImage(ImageResourceManager
					.getImage(this.gridModel.grid.getImageUrlById(image)));
		} else {
			this.cell.figure.setTreeImage(null);
		}
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getTreeImage = function() {
	return this.cell.treeImage;
}
COM.widget.Grid.Cell.prototype.setChecked = function(value) {
	this.setCellMode(COM.widget.Grid.Cell.Cell_MODE_TREE);
	this.cell.checked = value;
	if (this.cell.figure) {
		this.cell.figure.setChecked(value);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.isChecked = function(value) {
	return this.cell.checked;
}
COM.widget.Grid.Cell.prototype.isExpanded = function() {
	return this.cell.expanded;
}
COM.widget.Grid.Cell.prototype.setExpanded = function(value) {
	this.setCellMode(COM.widget.Grid.Cell.Cell_MODE_TREE);
	this.cell.expanded = value;
	if (this.cell.figure) {
		this.cell.figure.setExpanded(value);
		this.cell.figure.repaint();
	}
	return this;
}
COM.widget.Grid.Cell.prototype.setExpandable = function(expandable) {
	this.setCellMode(COM.widget.Grid.Cell.Cell_MODE_TREE);
	this.cell.expandable = expandable;
	if (this.cell.figure) {
		this.cell.figure.setExpandable(expandable);
	}
	return this;
}
COM.widget.Grid.Cell.prototype.getExpandable = function() {
	return this.cell.expandable;
}
COM.widget.Grid.Cell.prototype.clearExpandable = function() {
	this.cell.expandable = null;
	this.cell.cellMode = COM.widget.Grid.Cell.Cell_MODE_NORMAL;
	if (this.cell.figure) {
		this.cell.figure.setCellMode(COM.widget.Grid.Cell.Cell_MODE_NORMAL);
	}
}
COM.widget.Grid.Cell.prototype.setCheckable = function(checkable) {
	this.setCellMode(COM.widget.Grid.Cell.Cell_MODE_TREE);
	this.cell.checkable = checkable;
	if (this.cell.figure) {
		this.cell.figure.setCheckable(checkable);
		this.cell.figure.repaint();
	}
	return this;
}
COM.widget.Grid.Cell.prototype.getCheckable = function() {
	return this.cell.checkable;
}
COM.widget.Grid.Cell.prototype.setDepth = function(depth) {
	this.setCellMode(COM.widget.Grid.Cell.Cell_MODE_TREE);
	if (depth == this.cell.depth) {
		return;
	}
	this.cell.depth = depth;
	if (this.cell.figure) {
		this.cell.figure.setDepth(depth);
		this.cell.figure.repaint();
	}
	return this;
}
COM.widget.Grid.Cell.prototype.getDepth = function() {
	return this.cell.depth;
}
COM.widget.Grid.Cell.prototype.setTreeStyle = function(expandable, checkable) {
	this.setExpandable(expandable);
	this.setCheckable(checkable);
}
COM.widget.Grid.Cell.prototype.getTreeStyle = function() {
	return {
		'expandable' : this.getExpandable(),
		'checkable' : this.getCheckable()
	}
}

// 背景
COM.widget.Grid.Cell.prototype.setBackImage = function(image) {
	if (image == this.cell.backImage) {
		return;
	}
	this.cell.backImage = image;
	if (this.cell.figure) {

		if (image == null || "" == image) {
			this.cell.figure.setBackImage(null);
		} else {
			var backimage = ImageResourceManager.getImage(this.gridModel.grid
					.getImageUrlById(image));
			this.cell.figure.setBackImage(backimage);
		}
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getBackImage = function() {
	return this.cell.backImage;
}
COM.widget.Grid.Cell.prototype.setBackImageStyle = function(style) {
	if (style == this.cell.backImageStyle) {
		return;
	}
	this.cell.backImageStyle = style;
	if (this.cell.figure) {
		this.cell.figure.setBackImageStyle(style);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getBackImageStyle = function(style) {
	return this.cell.backImageStyle;
}
COM.widget.Grid.Cell.prototype.setBackImagePosition = function(h, v, holdStyle) {
	if (!holdStyle) {
		this.setBackImageStyle(COM.widget.Grid.Cell.BACK_IMAGE_STYLE_POSITION);
	}

	this.cell.backImageHorizion = h;
	this.cell.backImageVertical = v;

	if (this.cell.figure) {
		this.cell.figure.setBackImageHorizion(h);
		this.cell.figure.setBackImageVertical(v);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getBackImageHorizon = function() {
	return this.cell.backImageHorizion
}
COM.widget.Grid.Cell.prototype.getBackImageVectical = function() {
	return this.cell.backImageVertical
}
COM.widget.Grid.Cell.prototype.setBackImageBounds = function(x, y, width,
		height) {
	var rect = {
		'x' : x,
		'y' : y,
		'width' : width,
		'height' : height
	};
	this.cell.backImageBounds = rect;
	if (this.cell.figure) {
		this.cell.figure.setBackImageBounds(rect);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getBackImageBounds = function() {
	return this.cell.backImageBounds;
}
COM.widget.Grid.Cell.prototype.setBackStyle = function(style) {
	if (this.cell.backStyle == style) {
		return;
	}
	this.cell.backStyle = style;
	if (this.cell.figure) {
		this.cell.figure.setBackStyle(style);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getBackStyle = function() {
	return this.cell.backStyle;
}
COM.widget.Grid.Cell.prototype.setBackColor = function(color) {

	// if (this.cell.backColor == color) {
	// return;
	// }

	this.cell.backColor = color;

	if (color == null) {
		var rowData = this.gridModel.data.rows[this.getRow()];
		if (rowData.color) {
			color = rowData.color;
		}
	}

	if (this.cell.figure) {
		if (color != this.cell.figure.getBackColor()) {
			this.cell.figure.setBackColor(color);
			this.cell.figure.repaint();
		}
	}
}
COM.widget.Grid.Cell.prototype.getBackColor = function() {
	return this.cell.backColor;
}
COM.widget.Grid.Cell.prototype.setGradientBackground = function(colorBegin,
		colorEnd, direction) {
	var gradirent = {
		'begin' : colorBegin,
		'end' : colorEnd,
		'direction' : direction
	};
	this.cell.gradientBacground = gradirent;
	if (this.cell.figure) {
		this.cell.figure.setGradientBackground(gradirent);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getGradientBackground = function() {
	return this.cell.gradientBacground;
}

// 字体
COM.widget.Grid.Cell.prototype.setFontName = function(name) {
	if (this.cell.fontName == name) {
		return;
	}
	this.cell.fontName = name;
	if (this.cell.figure) {
		this.cell.figure.setFontName(name);
		this.cell.figure.repaint();
	}

}
COM.widget.Grid.Cell.prototype.getFontName = function() {
	return this.cell.fontName;

}
COM.widget.Grid.Cell.prototype.setFontSize = function(size) {
	if (this.cell.fontSize == size) {
		return;
	}
	this.cell.fontSize = size;
	if (this.cell.figure) {
		this.cell.figure.setFontSize(size);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getFontSize = function() {
	return this.cell.fontSize;
}
COM.widget.Grid.Cell.prototype.setFontBold = function(bold) {
	if (this.cell.fontBold == bold) {
		return;
	}
	this.cell.fontBold = bold;
	if (this.cell.figure) {
		this.cell.figure.setFontBold(bold);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.setFontItalic = function(italic) {
	if (this.cell.fontItalic == italic) {
		return;
	}
	this.cell.fontItalic = italic;
	if (this.cell.figure) {
		this.cell.figure.setFontItalic(italic);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.setDecoration = function(decoration) {
	if (this.cell.decoration == decoration) {
		return;
	}
	this.cell.decoration = decoration;
	if (this.cell.figure) {
		this.cell.figure.setDecoration(decoration);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getDecoration = function() {
	return this.cell.decoration;
}
COM.widget.Grid.Cell.prototype.isFontBold = function() {
	return this.cell.fontBold;
}
COM.widget.Grid.Cell.prototype.isFontItalic = function() {
	return this.cell.fontItalic;
}
COM.widget.Grid.Cell.prototype.setFontColor = function(color) {
	if (this.cell.fontColor == color) {
		return;
	}
	this.cell.fontColor = color;
	if (this.cell.figure) {
		this.cell.figure.setFontColor(color);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getFontColor = function() {
	return this.cell.fontColor;
}
COM.widget.Grid.Cell.prototype.setTextShadow = function(offsetX, offsetY, blur,
		color) {
	var shadow = {
		'offsetX' : offsetX,
		'offsetY' : offsetY,
		'blur' : blur,
		'color' : color
	}
	this.cell.textShadow = shadow;
	if (this.cell.figure) {
		this.cell.figure.setTextShadow(shadow);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getTextShadow = function() {
	return this.cell.textShadow;
}
COM.widget.Grid.Cell.prototype.setTextStroke = function(stroke) {
	if (this.cell.textStroke == stroke) {
		return;
	}
	this.cell.textStroke = stroke;
	if (this.cell.figure) {
		this.cell.figure.setTextStroke(stroke);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.isTextStroke = function() {
	return this.cell.textStroke;
}

// 边框
COM.widget.Grid.Cell.prototype.setLeftBorderColor = function(color) {
	// do nothing
}
COM.widget.Grid.Cell.prototype.getLeftBorderColor = function() {
	// do nothing
}
COM.widget.Grid.Cell.prototype.setTopBorderColor = function(color) {
	// do nothing
}
COM.widget.Grid.Cell.prototype.getTopBorderColor = function() {
	// do nothing
}
COM.widget.Grid.Cell.prototype._doSetBorderColor = function(i, color) {
	if (this.cell.borderColor) {
		if (this.cell.borderColor[i] == color) {
			return;
		}
	} else {
		this.cell.borderColor = [];
	}
	this.cell.borderColor[i] = color;

	if (this.cell.figure) {
		var borderColor = this.cell.figure.getBorderColor();
		if (!borderColor) {
			borderColor = [];
			this.cell.figure.setBorderColor(borderColor);
		}
		borderColor[i] = color;
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype._doGetBorderColor = function(i) {
	if (this.cell.borderColor) {
		return this.cell.borderColor[i];
	}
}
COM.widget.Grid.Cell.prototype._doSetBorderStyle = function(i, style) {
	if (isNaN(style)) {
		throw "set invalidate border style [" + style + '] for cell('
				+ this.getCol() + ',' + this.getRow() + ').';
	}
	if (this.cell.border) {
		if (this.cell.border[i] == style) {
			return;
		}
	} else {
		this.cell.border = [];
	}
	this.cell.border[i] = style;

	if (this.cell.figure) {
		var border = this.cell.figure.getBorder();
		if (!border) {
			border = [];
		}
		border[i] = style;
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype._doGetBorderStyle = function(i) {
	if (this.cell.border) {
		return this.cell.border[i];
	}
}
COM.widget.Grid.Cell.prototype.setRightBorderColor = function(color) {
	this._doSetBorderColor(0, color);
}
COM.widget.Grid.Cell.prototype.getRightBorderColor = function() {
	return this._doGetBorderColor(0);
}
COM.widget.Grid.Cell.prototype.setBottomBorderColor = function(color) {
	this._doSetBorderColor(1, color);
}
COM.widget.Grid.Cell.prototype.getBottomBorderColor = function() {
	return this._doGetBorderColor(1);
}
COM.widget.Grid.Cell.prototype.setDiagonalBorderColor = function(color) {
	this._doSetBorderColor(2, color);
}
COM.widget.Grid.Cell.prototype.getDiagonalBorderColor = function() {
	return this._doGetBorderColor(2);
}
COM.widget.Grid.Cell.prototype.setInverseDiagonalBorderColor = function(color) {
	this._doSetBorderColor(3, color);
}
COM.widget.Grid.Cell.prototype.getInverseDiagonalBorderColor = function() {
	return this._doGetBorderColor(3);
}
COM.widget.Grid.Cell.prototype.setRightBorderStyle = function(style) {
	this._doSetBorderStyle(0, style);
}
COM.widget.Grid.Cell.prototype.getRightBorderStyle = function() {
	return this._doGetBorderStyle(0);
}
COM.widget.Grid.Cell.prototype.setBottomBorderStyle = function(style) {
	this._doSetBorderStyle(1, style);
}
COM.widget.Grid.Cell.prototype.getBottomBorderStyle = function() {
	return this._doGetBorderStyle(1);
}
COM.widget.Grid.Cell.prototype.setLeftBorderStyle = function(style) {
	// do nothing
}
COM.widget.Grid.Cell.prototype.getLeftBorderStyle = function() {
	// do nothing
}
COM.widget.Grid.Cell.prototype.setUpBorderStyle = function(style) {
	// do nothing
}
COM.widget.Grid.Cell.prototype.getUpBorderStyle = function() {
	// do nothing
}
COM.widget.Grid.Cell.prototype.setDiagonalBorderStyle = function(style) {
	this._doSetBorderStyle(2, style);
}
COM.widget.Grid.Cell.prototype.getDiagonalBorderStyle = function() {
	return this._doGetBorderStyle(2);
}
COM.widget.Grid.Cell.prototype.setInverseDiagonalBorderStyle = function(style) {
	this._doSetBorderStyle(3, style);
}
COM.widget.Grid.Cell.prototype.getInverseDiagonalBorderStyle = function() {
	return this._doGetBorderStyle(3);
}

// 文本显示
COM.widget.Grid.Cell.prototype.setMultiLine = function(multi) {
	if (this.cell.multiLine == multi) {
		return;
	}
	this.cell.multiLine = multi;
	if (this.cell.figure) {
		this.cell.figure.setMultiLine(multi);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.isMultiLine = function() {
	return this.cell.multiLine;
}
COM.widget.Grid.Cell.prototype.setWrapLine = function(wrap) {
	if (this.cell.wrapLine == wrap) {
		return;
	}
	this.cell.wrapLine = wrap;
	if (this.cell.figure) {
		this.cell.figure.setWrapLine(wrap);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.isWrapLine = function() {
	return this.cell.wrapLine;
}
COM.widget.Grid.Cell.prototype.setIndent = function(indent) {
	if (this.cell.indent == indent) {
		return;
	}
	this.cell.indent = indent;
	if (this.cell.figure) {
		this.cell.figure.setIndent(indent);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getIndent = function() {
	return this.cell.indent;
}
COM.widget.Grid.Cell.prototype.setIndentPx = function(indentPx) { // TODO
	if (this.cell.indentPx == indentPx) {
		return;
	}
	this.cell.indentPx = indentPx;
	if (this.cell.figure) {
		this.cell.figure.setIndentPx(indentPx);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getIndentPx = function() {
	return this.cell.indentPx;
}
COM.widget.Grid.Cell.prototype.setPadding = function(top, left, bottom, right) {
	if (typeof top == 'undifined') {
		this.cell.padding = null;
		if (this.cell.figure) {
			this.cell.figure.setPadding(null);
			this.cell.figure.repaint();
		}
		return;
	}
	this.cell.padding = [top, left, bottom, right];
	if (this.cell.figure) {
		this.cell.figure.setPadding(new Insets(top, left, bottom, right));
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getPadding = function() {
	return this.cell.indentPx;
}
COM.widget.Grid.Cell.prototype.setHorzAlign = function(align) {
	if (this.cell.horzAlign == align) {
		return;
	}
	this.cell.horzAlign = align;
	if (this.cell.figure) {
		this.cell.figure.setHorzAlign(align);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getHorzAlign = function() {
	return this.cell.horzAlign;
}
COM.widget.Grid.Cell.prototype.setVertAlign = function(align) {
	if (this.cell.vertAlign == align) {
		return;
	}
	this.cell.vertAlign = align;
	if (this.cell.figure) {
		this.cell.figure.setVertAlign(align);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.getVertAlign = function() {
	return this.cell.vertAlign;
}
COM.widget.Grid.Cell.prototype.setVertText = function(value) {
	if (this.cell.vertText == value) {
		return;
	}
	this.cell.vertText = value;
	if (this.cell.figure) {
		this.cell.figure.setVertText(value);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.isVertText = function() {
	return this.cell.vertText;
}
COM.widget.Grid.Cell.prototype.setFitFontSize = function(fitable) {
	if (this.cell.fitFontSize == fitable) {
		return;
	}
	this.cell.fitFontSize = fitable;
	if (this.cell.figure) {
		this.cell.figure.setFitFontSize(fitable);
		this.cell.figure.repaint();
	}
}
COM.widget.Grid.Cell.prototype.isFitFontSize = function() {
	return this.cell.fitFontSize;
}

// 其他
COM.widget.Grid.Cell.prototype.setClientData = function(data) {
	this.cell.clientData = data;
}
/**
 * getClientData永远不返回null
 */
COM.widget.Grid.Cell.prototype.getClientData = function() {
	if (!this.cell.clientData) {
		this.cell.clientData = {};
	}
	return this.cell.clientData;
}
COM.widget.Grid.Cell.prototype.translateToAbsolute = function(point) {
	if (this.cell.figure) {
		this.cell.figure.translateToAbsolute(point);
	}
}
COM.widget.Grid.Cell.prototype.translateToRealative = function(point) {
	if (this.cell.figure) {
		this.cell.figure.translateToRealative(point);
	}
}
COM.widget.Grid.Cell.prototype.getCellMode = function() {
	return this.cell.cellMode;
}
COM.widget.Grid.Cell.prototype.setCellMode = function(mode) {
	if (this.cell.cellMode == mode) {
		return;
	}
	this.cell.cellMode = mode;
	if (this.cell.figure) {
		this.cell.figure.setCellMode(mode);
	}
	return this;
}
COM.widget.Grid.Cell.prototype.getModel = function() {
	return this.cell;
}
COM.widget.Grid.Cell.prototype.getFigure = function() {
	return this.cell.figure;
}
COM.widget.Grid.Cell.prototype.getRelativeLocation = function() {
	var figure = this.cell.figure;
	var loc;
	if (figure) {
		var bounds = figure.getBounds();
		if (bounds) {
			loc = {};
			loc.x = bounds.x;
			loc.y = bounds.y;
		}
	}
	return loc;
}
COM.widget.Grid.Cell.prototype.getShowSize = function() {
	if (this.cell.figure) {
		var bounds = this.cell.figure.getBounds();
		if (bounds) {
			return {
				'width' : bounds.width,
				'height' : bounds.height
			};
		}
	}
}
COM.widget.Grid.Cell.getNoneCell = function(col, row) {
	var cell = new COM.widget.Grid.Cell();
	var fn;
	for (fn in cell) {
		if (typeof cell[fn] === 'function') {
			cell[fn] = Function.emptyFunction;
		}
	}
	cell.getRow = function() {
		return row;
	}
	cell.getCol = function() {
		return col;
	}
	/**
	 * getClientData永远不返回null
	 */
	cell.getClientData = function() {
		if (null == this.clientData) {
			this.clientData = {};
		}
		return this.clientData;
	}
	return cell;
}

// COM.widget.Grid.Cell.synchToFigure = function () {
// var cell = this.cell;
// var figure = this.figure;
// if (figure != null) {
// if (figure.getCellMode() != cell.cellMode) {
// figure.setCellMode(cell.cellMode);
// }
// figure.setRowSpan(model.rowSpan);
// figure.setColSpan(model.colSpan);
//        
//        
//		
// }
// }

COM.widget.Grid.Cell.FONT_SIZE_UNIT_PX = 0;
COM.widget.Grid.Cell.FONT_SIZE_UNIT_PT = 1;

COM.widget.Grid.Cell.Cell_MODE_NORMAL = 1;
COM.widget.Grid.Cell.Cell_MODE_TREE = 2;
COM.widget.Grid.Cell.Cell_MODE_CONTROL = 3;
COM.widget.Grid.Cell.Cell_MODE_HTML = 4;

COM.widget.Grid.Cell.BACK_MODE_STYLE = 1;
COM.widget.Grid.Cell.BACK_MODE_COLOR = 2;
COM.widget.Grid.Cell.BACK_MODE_GRADIRENT = 3;
COM.widget.Grid.Cell.DIRECTION_VERTI = 1;
COM.widget.Grid.Cell.DIRECTION_HORIZ = 0;

COM.widget.Grid.Cell.BACK_IMAGE_STYLE_REPEAT = 1;
COM.widget.Grid.Cell.BACK_IMAGE_STYLE_REPEAT_X = 2;
COM.widget.Grid.Cell.BACK_IMAGE_STYLE_REPEAT_Y = 3;
COM.widget.Grid.Cell.BACK_IMAGE_STYLE_STRETCH = 4;
COM.widget.Grid.Cell.BACK_IMAGE_STYLE_POSITION = 5;
COM.widget.Grid.Cell.BACK_IMAGE_STYLE_BOUNDS = 6;

COM.widget.Grid.Cell.BORDER = {
	AUTO : -1,
	NONE : 0,
	SOLID : 1,
	DASH : 2,
	BOLD : 4,
	DOUBLE : 9
};

COM.widget.Grid.Cell.BORDER_AUTO = -1;
COM.widget.Grid.Cell.BORDER_NONE = 0;
COM.widget.Grid.Cell.BORDER_SOLID = 1;
COM.widget.Grid.Cell.BORDER_DASH = 2;
COM.widget.Grid.Cell.BORDER_BOLD = 4;
COM.widget.Grid.Cell.BORDER_DOUBLE = 8;
COM.widget.Grid.Cell.BORDER_DOTTED = 16;

/**
 * @deprecated
 */
COM.widget.Grid.Cell.BACK_STYLE_NONE = 0;
/**
 * @deprecated
 */
COM.widget.Grid.Cell.BACK_STYLE_FILL = 1;

COM.widget.Grid.Cell.BACK_STYLE = {
	NONE : 0,
	FILL : 1,
	DIAG_CROSS_LINE : 2,
	DIAG_CROSS_BLOCK : 3,
	CRUX_BLOCK : 4,
	CROSS_DOT : 5,
	DIAG_CROSS_DOT : 6,
	HORZ_LINE : 7,
	VERT_LINE : 8,
	BDIAG_LINE : 9,
	FDIAG_LINE : 10,
	HORZ_LINE_SPARSE : 11,
	VERT_LINE_SPARSE : 12,
	HORZ_DASH_DOT : 13,
	VERT_DASH_DOT : 14,
	WALL : 15,
	TREES : 16,
	GRASS : 17,
	FLOWERS : 18,
	ROUNDS : 19,
	LOZENGES : 20,
	DIAG_CRUX : 21,
	HILLS : 22,
	GRID_LINE : 23,
	DIAG_BLOCK : 24,
	HORIZ_DIAG_BLOCK : 25,
	VERT_DIAG_BLOCK : 26
};

COM.widget.Grid.Cell.BACK_POSITION = {
	FORE : 0,
	CENTER : 1,
	BACK : 2
}
COM.widget.Grid.Cell.DECORATION = {
	NONE : 0,
	UNDERLINE : 1,
	STRIKEOUT : 2,
	BOTH : 3,
	getCssStr : function(value) {
		if (0 == value) {
			return 'none';
		} else if (1 == value) {
			return 'underline';
		} else if (2 == value) {
			return 'line-through';
		} else if (3 == value) {
			return 'underline,line-through';
		}
		return '';
	}
}

COM.widget.Grid.Cell.ALIGN = {
	AUTO : 0,
	FORE : 1,
	BACK : 2,
	CENTER : 3,
	SPARSE : 4,
	EXTEND : 5,
	MIGHT_BACK : 6
}
COM.widget.Grid.Cell.ALIGN.getCssStr = function(align, verti) {
	if (verti) {
		switch (align) {
			case 1 :
				return "top";
			case 2 :
				return "bottom";
			case 3 :
				return "middle";
		}
	} else {
		switch (align) {
			case 1 :
				return "left";
			case 2 :
				return "right";
			case 3 :
				return "center";
		}
	}

}

COM.widget.Grid.GridHelper = {
	copyCol : function(col) {
		return {
			size : col.size,
			auto : col.auto,
			hidden : false,
			clientSize : col.size,
			rowResizeable : col.rowResizeable
		}
	},
	copyRow : function(row) {
		return {
			size : row.size,
			auto : row.auto,
			hidden : false,
			clientSize : row.size,
			colResizeable : row.colResizeable
		}
	}
};
COM.widget.Grid.Event = {};
COM.widget.Grid.Event.RELOAD = 'reload';
COM.widget.Grid.Event.EDIT_MODE_CHANGED = 'editModeChanged';
COM.widget.Grid.Event.DATA_CHANGE = 'dataChange';
COM.widget.Grid.Event.DATA_LOADED = 'dataLoaded';
COM.widget.Grid.Event.DATA_LOAD_EVENT = 'dataLoadEvent';
COM.widget.Grid.Event.SELECTION = 'selection';
COM.widget.Grid.Event.SELECTION_CHANGE = 'selectionChange';
COM.widget.Grid.Event.COL_RESIZE = 'colResize';
COM.widget.Grid.Event.ROW_RESIZE = 'rowResize';
COM.widget.Grid.Event.EXCHANGE_COLS = 'exchangeCols';
COM.widget.Grid.Event.DELETING_RECT = 'deletingRect';
COM.widget.Grid.Event.COPY = 'copy';
COM.widget.Grid.Event.PASTE = 'paste';
COM.widget.Grid.Event.PASTED = 'pasted';
COM.widget.Grid.Event.PAGING = 'paging';
COM.widget.Grid.Event.SCROLLED = 'scrolled';
COM.widget.Grid.Event.GRID_CLICK = 'gridClick';
COM.widget.Grid.Event.GRID_DOUBLE_CLICK = 'griddbClick';
COM.widget.Grid.Event.CELL_MOUSE_IN = 'cellMouseIn';
COM.widget.Grid.Event.CELL_MOUSE_OUT = 'cellMouseOut';
COM.widget.Grid.Event.CELL_MOUSE_MOVE = 'cellMouseMove';
COM.widget.Grid.Event.CELL_MOUSE_CLICK = 'cellMouseClick';
COM.widget.Grid.Event.CELL_DOUBLE_CLICK = 'celldbClick';
COM.widget.Grid.Event.CONTROL_ARRIVED = 'controlArrived';
COM.widget.Grid.Event.CONTROL_RESIZE = 'controlResize';
COM.widget.Grid.Event.CURRENT_CELL_CHANGING = 'currentCellChanging';
COM.widget.Grid.Event.CURRENT_CELL_CHANGED = 'currentCellChanged';
COM.widget.Grid.Event.EDITOR_OPEN = 'editorOpen';
COM.widget.Grid.Event.EDITOR_LOCATE = 'editorLocate';
COM.widget.Grid.Event.EDITOR_RESIZE = 'editorResize';
COM.widget.Grid.Event.EDITOR_CLOSE = 'editorClose';
COM.widget.Grid.Event.EDITOR_HIDE = 'editorHide';
COM.widget.Grid.Event.EDITOR_SHOW = 'editorShow';
COM.widget.Grid.Event.CELL_COLLAPSE = 'cellCollapse';
COM.widget.Grid.Event.CELL_EXPAND = 'cellExpand';
COM.widget.Grid.Event.CELL_CHECKED = 'cellChecked';
COM.widget.Grid.Event.KEY_DOWN_EVENT = 'KeyDownEvent';
COM.widget.Grid.Event.KEY_PRESS_EVENT = 'KeyPressEvent';
COM.widget.Grid.Event.LAYOUT = 'layout';
COM.widget.Grid.Event.CELL_MOUSE_DOWN = 'cellMouseDown';
COM.widget.Grid.Event.CELL_MOUSE_UP = 'cellMouseUp';
COM.widget.Grid.Event.CELL_DRAG = 'cellDrag';
COM.widget.Grid.Event.CELL_DRAG_START = 'cellDragStart';
/**
 * @author jiangqifan
 * @since 2013-5-3
 */
COM.widget.Grid.GridGraphicsSource = function GridGraphicsSource(canvas) {
	this.control = canvas;
}
COM.widget.Grid.GridGraphicsSource.extend(Object, {
	getGraphics : function(rect) {
		if (!this.control) {
			return;
		}
		var controlSize = this.control.getSize();
		this.inUse = new Rectangle(0, 0, controlSize.width, controlSize.height);
		this.inUse.intersect(rect);
		if (this.inUse.isEmpty()) {
			return null;
		}

		this.control.context.clearRect(this.inUse.x, this.inUse.y,
				this.inUse.width, this.inUse.height);
		// 此处不要加第二个参数，相见下面的说明
		this.graphics = new Html5Graphics(this.control.context);
		return this.graphics;
	},
	flushGraphics : function() {
		this.graphics.dispose();
		this.control.flush(this.inUse);
	},
	dispose : function() {
		if (this.control && this.control.dispose) {
			this.control.dispose();
		}
		if (this.graphics && this.graphics.dispose()) {
			this.graphics.dispose();
		}
		delete this.control;
		delete this.graphics;
	}
});
/**
 * 说明： 针对firefox中，画图的的时候界面上出现莫名其妙的白色区域的问题的一些说明：
 * 
 * 总结：在firefox里，如果new Html5Graphics的时候传入第二个参数的大小不是整数时会引起问题。
 * 
 * COM.widget.Grid.GridGraphicsSource = function GridGraphicsSource(canvas) {
 * this.control = canvas; this.canvasElement = document.createElement("canvas"); }
 * COM.widget.Grid.GridGraphicsSource.extend(Object,{ getGraphics: function
 * (rect) { if ( !this.control ) { return; } var controlSize =
 * this.control.getSize(); this.inUse = new
 * Rectangle(0,0,controlSize.width,controlSize.height);
 * this.inUse.intersect(rect); if (this.inUse.isEmpty()){ return null; }
 * 
 * if ((this.inUse.x << 0) - this.inUse.x) { this.inUse.x = this.inUse.x << 0; }
 * if ((this.inUse.y << 0) - this.inUse.y) { this.inUse.y = this.inUse.y << 0; }
 * 
 * this.canvasElement.width = this.inUse.width + 1; this.canvasElement.height =
 * this.inUse.height + 1;
 * 
 * //1.在inUse的x或y有小数时(width和height有小数的情况没有验证过)，此处的第二个参数会引起界面上出现莫名白色区域（画图片时概率较大）
 * //2.这个例子代码是用了整体缓存，就算不使用缓存，此情况也会发生。
 * //3.使用了缓存的话，不加第二个参数，inUse的x或y有小数就会引起界面重绘区域的内容变得模糊 //4.所以最优方案: // a.不使用缓存，new
 * HtmlGraphics时不加第二个参数，其构造函数内会自动使用控件大小作为剪切区，这样不会出问题。 // b.使用缓存,直接用本例子，new
 * HtmlGraphics时不加第二个参数(下面一行需要稍作修改)。(本例已经做了inUse的小数校正) this.graphics = new
 * Html5Graphics( this.canvasElement.getContext('2d'),new
 * Rectangle(0,0,this.inUse.width,this.inUse.height));
 * this.graphics.translate(-this.inUse.x, -this.inUse.y );
 * 
 * //this.control.context.clearRect(this.inUse.x,this.inUse.y,this.inUse.width,this.inUse.height);
 * 
 * 
 * //this.graphics = new Html5Graphics(this.control.context,new
 * Rectangle(this.inUse.x,this.inUse.y,this.inUse.width,this.inUse.height));
 * return this.graphics; }, flushGraphics: function () {
 * 
 * this.control.context.clearRect(this.inUse.x,this.inUse.y,this.inUse.width,this.inUse.height);
 * //inUse.x或inUse.y为小数时，主要是在此处引起界面重绘区域模糊,但如果直接在此处修改inUse.x和inUse.y为整数的话，会引起重绘区域移位
 * this.control.context.drawImage(this.canvasElement,this.inUse.x,this.inUse.y); //
 * this.control.context.strokeRect(this.inUse.x + 2,this.inUse.y +
 * 2,this.inUse.width,this.inUse.height);
 * 
 * 
 * this.graphics.dispose();
 * 
 * this.control.flush(this.inUse); } });
 */
/**
 * @author jiangqifan
 * @since 2013-5-3
 */
COM.widget.Grid.GridCanvas = function GridCanvas(eventSource) {
	// debugger;
	this.initBrowerVer();
	this.canvasList = [[], [], []];
	this.contextList = [[], [], []];
	this.inintElement();
	this.controllListeners = [];
	this.mouseListeners = [];
	this.keyListeners = [];
	this.disposeListeners = [];
	this.eventSource = eventSource;
	this.registerEvent(eventSource);
	this.button = Canvas.BUTTON_NONE;
	this.stateMask = 0;
	// 初始化浏览器信息
	this.context = this.center.getContext("2d");
	this.lefts = [];
	this.tops = [];
	this.disposed = false;
}
COM.widget.Grid.GridCanvas.extend(Object, {
	flush : function(rect) {
		this.overPaint(0, 0);
		this.overPaint(0, 1);
		this.overPaint(0, 2);
		this.overPaint(1, 0);
		this.overPaint(1, 2);
		this.overPaint(2, 0);
		this.overPaint(2, 1);
		this.overPaint(2, 2);
	},
	dispose : function() {
		if (this.disposed) {
			return;
		}
		this.disposed = true;
		if (this.disposeListeners) {
			for (var i = 0; i < this.disposeListeners.length; i++) {
				this.disposeListeners[i].widgetDisposed();
				this.disposeListeners[i] = null;
			}
		}
		this.unRegisterEvent(this.eventSource);
		delete this.eventSource;
		delete this.disposeListeners;
		delete this.element;
		delete this.context;
		delete this.canvasList;
		delete this.contextList;
		delete this.controllListeners;
		delete this.mouseListeners;
		delete this.keyListeners;
		delete this.lefts;
		delete this.tops;
		delete this.center;
	},
	overPaint : function(i, j) {
		var context = this.contextList[i][j];
		var width = this.canvasList[i][j].width;
		var height = this.canvasList[i][j].height;
		var offsetX = -this.lefts[j];
		var offsetY = -this.tops[i];
		context.fillStyle = '#fff';
		context.fillRect(0, 0, width, height);
		context.drawImage(this.center, offsetX, offsetY);
	},
	onLayouted : function(widths, heights) {
		var widths = widths;
		var heights = heights;
		var lefts = [];
		var tops = [];
		var temp = 0;
		var i = 0;
		for (i = 0; i < 3; i++) {
			lefts[i] = temp;
			temp += widths[i];
		}
		temp = 0;
		for (i = 0; i < 3; i++) {
			tops[i] = temp;
			temp += heights[i];
		}

		// 修改大小
		if (widths[0] != this.canvasList[0][0].width) {
			this.canvasList[0][0].width = widths[0];
			this.canvasList[1][0].width = widths[0];
			this.canvasList[2][0].width = widths[0];
		}
		if (widths[1] != this.canvasList[0][1].width) {
			this.canvasList[0][1].width = widths[1];
			this.canvasList[2][1].width = widths[1];
		}
		if (widths[2] != this.canvasList[0][2].width) {
			this.canvasList[0][2].width = widths[2];
			this.canvasList[1][2].width = widths[2];
			this.canvasList[2][2].width = widths[2];
		}

		if (heights[0] != this.canvasList[0][0].height) {
			this.canvasList[0][0].height = heights[0];
			this.canvasList[0][1].height = heights[0];
			this.canvasList[0][2].height = heights[0];
		}
		if (heights[1] != this.canvasList[1][0].height) {
			this.canvasList[1][0].height = heights[1];
			this.canvasList[1][2].height = heights[1];
		}

		if (heights[2] != this.canvasList[2][0].height) {
			this.canvasList[2][0].height = heights[2];
			this.canvasList[2][1].height = heights[2];
			this.canvasList[2][2].height = heights[2];
		}

		// 调整位置
		if (lefts[1] != this.lefts[1]) {
			this.canvasList[0][1].style.left = lefts[1] + 'px';
			this.canvasList[2][1].style.left = lefts[1] + 'px';
		}
		if (lefts[2] != this.lefts[2]) {
			this.canvasList[0][2].style.left = lefts[2] + 'px';
			this.canvasList[1][2].style.left = lefts[2] + 'px';
			this.canvasList[2][2].style.left = lefts[2] + 'px';
		}

		if (tops[1] != this.tops[1]) {
			this.canvasList[1][0].style.top = tops[1] + 'px';
			this.canvasList[1][2].style.top = tops[1] + 'px';
		}
		if (tops[2] != this.tops[2]) {
			this.canvasList[2][0].style.top = tops[2] + 'px';
			this.canvasList[2][1].style.top = tops[2] + 'px';
			this.canvasList[2][2].style.top = tops[2] + 'px';
		}

		// 缓存位置
		this.lefts = lefts;
		this.tops = tops;

		// canvas都使用从左至右的计算，可以不在每次布局时同步中间canvas的大小
	},
	inintElement : function() {
		this.element = document.createElement('div');
		this.element.className = "gridCanvas";
		this.element.style.position = 'relative';

		// 为了能获取焦点，如果不加此属性，在ff和chrome下无法监听到键盘事件
		this.element.tabIndex = 0;

		// 去掉div获取焦点时周围显示的虚线边框
		this.element.hideFocus = "true"; // for ie
		this.element.outline = "none"; // for ff&chrome

		this.initCanvasList(this.element);

		this.center = this.canvasList[1][1];

	},
	getElement : function() {
		return this.element;
	},
	initCanvasList : function(parent) {
		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				var canvas = this
						.createCavansElement(COM.widget.Grid.GridCanvas
								.getIndex(i, j));
				canvas.style.left = '0px';
				canvas.style.top = '0px';
				this.canvasList[i][j] = canvas;
				parent.appendChild(canvas);
				this.contextList[i][j] = canvas.getContext("2d");
			}
		}
	},
	createCavansElement : function(zIndex) {
		var canvas = document.createElement('canvas');
		canvas.style.position = 'absolute';
		// canvas.style.border = '1px solid gray';
		canvas.style.zIndex = zIndex;
		canvas.widht = 0;
		canvas.height = 0;
		return canvas;
	},
	initBrowerVer : function() {
		var ua = navigator.userAgent;
		this.browerVer = {
			version : (ua.match(/.+(?:rv|it|ra|ie|me)[\/: ]([\d.]+)/i) || [])[1],
			ie : /msie/i.test(ua) && !/opera/i.test(ua),
			op : /opera/i.test(ua),
			sa : /version.*safari/i.test(ua),
			ch : /chrome/.test(ua),
			ff : /gecko/i.test(ua) && !/webkit/i.test(ua),
			wk : /webkit/i.test(ua),
			mz : /mozilla/i.test(ua) && !/(compatible|webkit)/i.test(ua)
		};
		// 针对IE11的校正
		// IE11为：
		// ie：false
		// ff:true
		// mz:true
		// ch:false

		function isIE() { // ie?
			if (!!window.ActiveXObject || "ActiveXObject" in window)
				return true;
			else
				return false;
		}
		if (!this.browerVer.ie) {
			this.browerVer.ie = isIE();
		}
	},
	addControllListener : function(listener) {
		if (listener == null) {
			return;
		}
		this.controllListeners.push(listener);
	},
	addMouseListener : function(listener) {
		if (listener == null) {
			return;
		}
		this.mouseListeners.push(listener);
	},
	addKeyListener : function(listener) {
		if (listener == null) {
			return;
		}
		this.keyListeners.push(listener);
	},
	addDisposeListener : function(listener) {
		if (listener == null) {
			return;
		}
		this.disposeListeners.push(listener);
	},
	getClientArea : function() {
		return new Rectangle(0, 0, this.center.width, this.center.height);
	},
	getHeight : function() {
		return this.center.height;
	},
	getSize : function() {
		return new Dimension(this.center.width, this.center.height);
	},
	getWidth : function() {
		return this.center.width;
	},
	getClipping : function() {
		return new Rectangle(0, 0, this.center.width, this.center.height);
	},
	open : function() {
		var i;
		for (i = 0; i < this.controllListeners.length; i++) {
			this.controllListeners[i].controlResized();
		}
	},

	registerEvent : function(eventSource) {
		var that = this;
		function fixMouseWheel(elem, fn) {
			var mousewheel = (that.browerVer.ff && !that.browerVer.ie/* 屏蔽ie11 */)
					? "DOMMouseScroll"
					: "mousewheel";
			if ((elem == null || elem == window) && (elem = document)) {
				return null;
			}
			return {
				type : mousewheel,
				elem : elem,
				fn : function(e) {
					var delta = 0;
					e = e || window.event;
					if (e.wheelDelta) {
						delta = e.wheelDelta / 120;
						if (that.browerVer.op && that.browerVer.version < 10)
							delta = -delta;
					} else if (e.detail) {
						delta = -e.detail / 3;
					}
					e.delta = Math.round(delta);
					fn.call(elem, e);
				}
			}
		}
		function mousewheel(e) {
			for (var i = 0; i < that.mouseListeners.length; i++) {
				that.mouseListeners[i].mouseWheel(e);
			}
		}
		function addEvent(el, type, fn, useCapture) {
			if (eventSource && eventSource[type]) {
				el = eventSource[type];
			}
			(el.attachEvent) ? (el.attachEvent("on" + type, fn)) : (el
					.addEventListener(type, fn, useCapture));
		}
		function stopPropagation(e) {
			e = e || window.event;
			if (e.stopPropagation) { // W3C阻止冒泡方法
				e.stopPropagation();
			} else {
				e.cancelBubble = true; // IE阻止冒泡方法
			}
		}
		var evt = fixMouseWheel(this.element, mousewheel);

		this.controlEventListeners = {};
		this.controlEventListeners.event = evt;
		this.controlEventListeners.keypress = function(e) {
			that._clearMouseHover();
			that.keyPressed(e);
		};
		this.controlEventListeners.keyup = function(e) {
			that._clearMouseHover();
			that.keyReleased(e);
		};
		this.controlEventListeners.keydown = function(e) {
			that._clearMouseHover();
			that.keydown(e);
		}
		this.controlEventListeners.dblclick = function(e) {
			that.mouseDoubleClick(e);
		};
		this.controlEventListeners.click = function(e) {
			that.click(e);
			// 延迟处理以解决每次双击触发的单击事件
			/*
			 * if(that.clickTimer == null){ that.clickTimer = []; }
			 * 
			 * var event= that.parse(e);
			 * that.clickTimer.push(setTimeout(function (){
			 * that._fireMouseEvent('click',event); },250));
			 */
		};
		this.controlEventListeners.mousedown = function(e) {
			that._clearMouseHover(e);
			that.mouseDown(e);
		};

		this.controlEventListeners.mouseout = function(e) {
			that._clearMouseHover(e);
		};

		this.controlEventListeners.mousemove = function(e) {
			that._resetMouseHover(e);
			that.mouseMove(e);
		};
		this.controlEventListeners.mouseup = function(e) {
			that._resetMouseHover(e);
			that.mouseUp(e)
		};

		// 监听鼠标滚动事件
		addEvent(evt.elem, evt.type, evt.fn);
		// 监听键盘事件
		// 键盘事件触发顺序: keydown -> keypress -> keyup
		addEvent(this.element, 'keypress', this.controlEventListeners.keypress);
		addEvent(this.element, 'keyup', this.controlEventListeners.keyup);
		addEvent(this.element, 'keydown', this.controlEventListeners.keydown);
		// 监听鼠标事件
		addEvent(this.element, 'dblclick', this.controlEventListeners.dblclick);
		addEvent(this.element, 'click', this.controlEventListeners.click);
		addEvent(this.element, 'mousedown',
				this.controlEventListeners.mousedown, true);
		addEvent(this.element, 'mouseout', this.controlEventListeners.mouseout);
		addEvent(this.element, 'mousemove',
				this.controlEventListeners.mousemove);
		addEvent(this.element, 'mouseup', this.controlEventListeners.mouseup);

	},
	/**
	 * TODO 需要卸载事件监听
	 * 
	 * @param {}
	 *            eventSource
	 */
	unRegisterEvent : function(eventSource) {
		if (this.controlEventListeners) {
			function removeEvent(el, type, fn, useCapture) {
				if (eventSource && eventSource[type]) {
					el = eventSource[type];
				}
				(el.detachEvent)
						? (el.detachEvent("on" + type, fn))
						: (el.removeEventListener ? el.removeEventListener(
								type, fn, useCapture) : true);
			}

			var evt = this.controlEventListeners.event;
			// 监听鼠标滚动事件
			removeEvent(evt.elem, evt.type, evt.fn);
			// 监听键盘事件
			// 键盘事件触发顺序: keydown -> keypress -> keyup
			removeEvent(this.element, 'keypress',
					this.controlEventListeners.keypress);
			removeEvent(this.element, 'keyup', this.controlEventListeners.keyup);
			removeEvent(this.element, 'keydown',
					this.controlEventListeners.keydown);
			// 监听鼠标事件
			removeEvent(this.element, 'dblclick',
					this.controlEventListeners.dblclick);
			removeEvent(this.element, 'click', this.controlEventListeners.click);
			removeEvent(this.element, 'mousedown',
					this.controlEventListeners.mousedown, true);
			removeEvent(this.element, 'mouseout',
					this.controlEventListeners.mouseout);
			removeEvent(this.element, 'mousemove',
					this.controlEventListeners.mousemove);
			removeEvent(this.element, 'mouseup',
					this.controlEventListeners.mouseup);

			this.controlEventListeners.event = null;
			this.controlEventListeners.keypress = null;
			this.controlEventListeners.keyup = null;
			this.controlEventListeners.keydown = null;
			this.controlEventListeners.dblclick = null;
			this.controlEventListeners.click = null;
			this.controlEventListeners.mousedown = null;
			this.controlEventListeners.mouseout = null;
			this.controlEventListeners.mousemove = null;
			this.controlEventListeners.mouseup = null;
			this.controlEventListeners = null;
		}

	},
	_resetMouseHover : function(e) {
		this._clearMouseHover();
		this._beginMouseHover(e);
	},
	_beginMouseHover : function(e) {
		var that = this;
		var event = this.parse(e);
		this.hoverTimer = setTimeout(function() {
					that._fireMouseEvent('mouseHover', event);
				}, Canvas.HOVER_TIME);
	},
	_clearMouseHover : function() {
		if (this.hoverTimer) {
			clearTimeout(this.hoverTimer);
		}
	},
	isValid : function(e) {
		var target = e.target || e.srcElement;

		do {
			if (target == this.element) {
				return true;
			}
		} while (target = target.parentNode)

		return false;
	},
	getEvLocation : function(e) {
		var x, y;
		var target = e.target || e.srcElement;
		if (this.browerVer.ie/* IE */|| this.browerVer.wk /* webkit */) {
			// offsetX和offsetY是事件相对于当前元素的位置
			x = e.offsetX;
			y = e.offsetY;
		} else { // FF
			// layerX和layerY是事件相对于当前坐标系的位置
			x = e.layerX;
			y = e.layerY;
			while (target.offsetParent && target.style.position != 'absolute'
					&& target.style.position != 'relative') {
				target = target.offsetParent;
			}
		}

		x += target.offsetLeft;
		y += target.offsetTop;

		var current = target.offsetParent;
		while (current != null && current != this.element
				&& current != this.element.parentNode) {
			x += current.offsetLeft;
			y += current.offsetTop;
			current = current.offsetParent;
		}

		return new Point(x, y);
	},
	parse : function(e) {
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
		event.e = e;
		return event;
	},
	getMouseButton : function(e) {
		if (this.browerVer.ff) { // firefox
			return e.buttons;
		} else if (this.browerVer.ie) {
			return e.button;
		} else if (this.browerVer.wk) { // chrome
			if (e.which === 1) {
				return Canvas.BUTTON_LEFT;
			} else if (e.which === 2) {
				return Canvas.BUTTON_CENTER;
			} else if (e.which === 3) {
				return Canvas.BUTTON_RIGHT;
			}
		}
		return Canvas.BUTTON_NONE;
	},

	_fireMouseEvent : function(type, event) {
		try {
			if (this.mouseListeners) {
				for (var i = 0; i < this.mouseListeners.length; i++) {
					this.mouseListeners[i][type](event);
				}
			}

		} catch (e) {
			Debugger.error(e);
		}
	},
	keyPressed : function(event) {
		if (this.browerVer.ff && event.charCode == 0) {
			return;
		}
		for (var i = 0; i < this.keyListeners.length; i++) {
			this.keyListeners[i].keyPressed(event);
		}
	},
	keydown : function(event) {
		for (var i = 0; i < this.keyListeners.length; i++) {
			this.keyListeners[i].keyDown(event);
		}
	},
	keyReleased : function(event) {
		for (var i = 0; i < this.keyListeners.length; i++) {
			this.keyListeners[i].keyReleased(event);
		}
	},
	mouseDoubleClick : function(e) {
		// e.defaultPrevented = true;
		var event = this.parse(e);
		this._fireMouseEvent('mouseDoubleClick', event);
	},
	click : function(e) {
		var event = this.parse(e);
		this._fireMouseEvent('click', event);
	},
	mouseDown : function(e) {
		if (!this.isValid(e)) {
			return;
		}
		var event = this.parse(e);
		this.button = event.button;
		this._fireMouseEvent('mouseDown', event);
	},
	mouseExit : function(e) {
		var event = this.parse(e);
		this._fireMouseEvent('mouseExit', event);
	},
	mouseMove : function(e) {
		var event = this.parse(e);
		this._fireMouseEvent('mouseMove', event);
	},
	/**
	 * 此处的button值需与上一次的mousedown事件的button值相同，否则tool中的currentInput的flag不能正确清除。
	 */
	mouseUp : function(e) {
		var event = this.parse(e);
		event.button = this.button;
		this._fireMouseEvent('mouseUp', event);
	},
	mouseHover : function(e) {
		var event = this.parse(e);
		this._fireMouseEvent('mouseHover', event);
	},
	toDisplay : function(arg1, arg2) {
		// 此处直接返回原坐标
		if (arg1 == null) {
			return;
		}
		if (Util.isInstanceOf(arg1, Point)) {
			return arg1;
		} else {
			return new Point(arg1, arg2);
		}
	},
	layout : function() {

	},
	resize : function(w, h) {
		// TODO
		this.element.style.width = w + 'px';
		this.element.style.height = h + 'px';

		this.center.width = w;
		this.center.height = h;
		for (var i = 0; i < this.controllListeners.length; i++) {
			this.controllListeners[i].controlResized();
		}
	},
	isDisposed : function() {
		return this.element == null;
	},
	getParent : function() {
		return this.element.parentNode;
	},
	setCursor : function(cursor) {
		this.element.style.cursor = cursor;
	},
	focus : function() {
		if (this.element) {
			this.element.focus();
		}
	},
	blur : function() {
		if (this.element) {
			this.element.blur();
		}
	}
});
COM.widget.Grid.GridCanvas.BUTTON_NONE = 0;
COM.widget.Grid.GridCanvas.BUTTON_LEFT = 1;
COM.widget.Grid.GridCanvas.BUTTON_CENTER = 4;
COM.widget.Grid.GridCanvas.BUTTON_RIGHT = 2;
COM.widget.Grid.GridCanvas.HOVER_TIME = 800;
COM.widget.Grid.GridCanvas.getIndex = function(row, col) {
	return (Math.pow(row - 1, 2) + Math.pow(col - 1, 2)) * 4;
};
/**
 * @author jiangqifan
 * @since 2013-7-18
 */
COM.widget.Grid.GridUpdateManager = function GridUpdateManager() {
	COM.widget.Grid.GridUpdateManager.superclass.constructor.call(this);
	this.capture = false;
}
COM.widget.Grid.GridUpdateManager.extend(DeferredUpdateManager, {
			queueWork : function() {
				if (!this.capture) {
					COM.widget.Grid.GridUpdateManager.superclass.queueWork
							.call(this);
				}
			},
			lock : function() {
				this.capture = true;
			},
			unlock : function() {
				this.capture = false;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-7-29
 */
COM.widget.Grid.GridSelectionManager = function GridSelectionManager(editPart) {
	this.editPart = editPart;
	this.selections = [];

	this.selectionCols = new COM.engine.PropertyMap();
	this.selectionRows = new COM.engine.PropertyMap();

}
COM.widget.Grid.GridSelectionManager.extend(Object, {
	clearSelection : function() {
		// console.log("[clear]-begin");
		this.eraseSelectionHandle();
		// this.getSelectionFigure().getUpdateManager().performUpdate();

		// console.log("[clear]- handle - complete");
		this.clearSelectionCellVisuals();
		// this.getSelectionFigure().getUpdateManager().performUpdate();
		// console.log("[clear] - complete");
	},
	select : function(rect, notAdjust) {
		if (notAdjust || this.adjustSelection(rect)) {
			this.clearSelection();
			this.selections = [rect];
			this.addSelectionColRow(rect);
			this.showSelectionCellVisual(rect);
			this.showSelectionHandle();
		}
	},
	showSelectionHandle : function() {
		this.editPart.showSelectionHandle();
	},
	eraseSelectionHandle : function() {
		this.editPart.eraseSelectionHandle();
	},
	commitSelect : function() {
		this.editPart.fireEvent(COM.widget.Grid.Event.SELECTION);
	},
	clearSelectionCellVisuals : function() {
		var selections = this.selections;
		var rect;
		for (var i = 0, max = this.selections.length; i < max; i++) {
			rect = selections[i];
			this.removeSelectionColRow(rect);
			this.removeSelectionCellVisual(rect);
		}
		this.selections = [];
	},
	showSelectionCellVisual : function(rect) {
		var selectionFigure = this.getSelectionFigure();
		var cellFeildFigure = this.createCellFieldFigure(rect);
		selectionFigure.addSelection(cellFeildFigure);
	},
	createCellFieldFigure : function(rect) {
		var figure = new COM.widget.Grid.CellFieldFigure(this.getHost());
		rect.figure = figure;
		var locator = new COM.widget.Grid.CellFieldLocator();
		locator.setEditPart(this.getHost());
		figure.setLocator(locator);
		figure.setField(rect.x, rect.y, rect.width, rect.height);
		// 是否为单个区域
		figure.single = this.isFieldSingle(rect);
		return figure;
	},
	isFieldSingle : function(rect) {
		var cell = this.editPart.getModel().getCell(rect.x, rect.y);
		if (cell && cell.colSpan == rect.width && cell.rowSpan == rect.height) {
			return true;
		}
	},
	getSelectionFigure : function() {
		if (this.selectionFigure == null) {
			this.selectionFigure = this.createSlectionFigure();
			this.getLayer().add(this.selectionFigure);
		}
		return this.selectionFigure;
	},
	createSlectionFigure : function() {
		var figure = new COM.widget.Grid.SelectionFigure();
		figure.colorProvider = this.editPart.getColorProvider();
		return figure;
	},
	removeSelectionCellVisual : function(rect) {
		if (rect && rect.figure) {
			if (this.selectionFigure) {
				this.selectionFigure.removeSelection(rect.figure);
			}
		}
	},
	addSelection : function(rect, notAdjust) {
		// 调整选择区
		if (notAdjust || this.adjustSelection(rect)) {
			this.eraseSelectionHandle();
			this.selections.push(rect);
			this.addSelectionColRow(rect);
			this.showSelectionCellVisual(rect);
		}
	},
	setSelection : function(selection, notAdjust) {
		if (notAdjust || this.adjustSelection(selection)) {
			var selections = this.selections;
			var lastSelection;
			if (selections == null && selections.length == 0) {
				return;
			}
			this.removeSelectionColRow(selections[selections.length - 1]);
			this.removeSelectionCellVisual(selections[selections.length - 1]);

			selections[selections.length - 1] = selection;

			this.addSelectionColRow(selections[selections.length - 1]);
			this.showSelectionCellVisual(selections[selections.length - 1]);

			if (selections.length === 1) {
				this.showSelectionHandle();
			}
		}
	},
	// 重新设置所有的选择区域
	setSelections : function(rectArray, notAdjust) {
		this.clearSelection();
		if (rectArray) {
			if (rectArray[0]) {
				this.select(rectArray[0], notAdjust);
			}
			for (var i = 1; i < rectArray.length; i++) {
				this.addSelection(rectArray[i], notAdjust);
			}
		}
	},
	freshSelectionColRow : function() {

	},
	getHost : function() {
		return this.editPart;
	},
	getLayer : function() {
		return COM.gef.LayerManager.Helper
				.find(this.getHost())
				.getLayer(COM.widget.Grid.GridSelectionManager.SELECTION_FEEDBACK_LAYER);
	},
	refreshCurrentFigureField : function(col, row) {
		if (this.currentFigure) {
			var field = this.currentFigure.getField();
			if (field.x == col && field.y == row) {

				var cell = this.editPart.getCell(field.x, field.y);
				field.width = cell.colSpan || 1;
				field.height = cell.rowSpan || 1;
				this.currentFigure.revalidate();
			}
		}
	},
	freshFeedbacksLocation : function() {
		var rect;
		for (var i = 0, max = this.selections.length; i < max; i++) {
			rect = this.selections[i];
			if (rect && rect.figure) {
				rect.figure.revalidate();
			}
		}
		if (this.currentFigure) {
			this.currentFigure.revalidate();
		}
	},
	adjustSelection : function(selection) {
		var colCount = this.editPart.getModel().getColCount();
		var rowCount = this.editPart.getModel().getRowCount();
		// 如果起始位置超出
		if (selection.x >= colCount) {
			return false;
		}
		if (selection.y >= rowCount) {
			return false;
		}
		if (selection.x + selection.width > colCount) {
			selection.width = colCount - selection.x;
		}
		if (selection.y + selection.height > rowCount) {
			selection.height = rowCount - selection.y;
		}

		switch (this.editPart.getSelectionMode()) {
			case COM.widget.Grid.SELECTION_MODE_ROW :
				selection.x = 1;
				selection.width = colCount - 1;
				this.adjustMergeCell(selection, true, true);
				// 检查是否包含不可选
				break;
			case COM.widget.Grid.SELECTION_MODE_COL :
				selection.y = 1;
				selection.height = rowCount - 1;
				this.adjustMergeCell(selection, false, false, true, true);
				// 检查是否包含不可选
				break;

			case COM.widget.Grid.SELECTION_MODE_SINGLE :
				selection.width = 1
				selection.height = 1;
				break;
			case COM.widget.Grid.SELECTION_MODE_MULTI :
				this.adjustMergeCell(selection, true, true, true, true);
				// 检查是否包含不可选
				break;
		}
		if (selection.width === 1 && selection.height === 1) {
			var cell = this.editPart.data.cells.rowList[selection.y][selection.x];
			selection.height = cell.rowSpan;
			selection.width = cell.colSpan;
		}
		/*
		 * if (this.getEditMode() !== COM.widget.Grid.EDIT_MODE_EDIT) { for (var
		 * row = selection.y;row < selection.y+selection.height;row++) { for
		 * (var col = selection.x;col < selection.x + selection.width;col++) {
		 * var cell = this.getCell(col,row); if (cell) { if (!cell.selectable) {
		 * return false; } } } } }
		 */
		return true;
	},
	// 如果选择区域内有合并单元格
	adjustMergeCell : function(selection, chekup, checkdown, checkleft,
			checkright) {
		var col;
		var row;
		var right;
		var bottom;
		var cell;
		var changed = true;
		// 处理合并单元格
		while (changed) {
			changed = false;
			col = selection.x;
			row = selection.y;
			bottom = row + selection.height - 1;
			// 上下边界
			if (chekup) {
				for (var i = 0; i < selection.width; i++) {
					// 上
					cell = this.editPart.getCell(col + i, row);
					if (cell == null) {
						break;
					}
					if (cell.merged) {
						changed = this.performAdjust(selection, cell.mergeInfo)
								|| changed;

					}
				}
			}

			if (bottom >= row && checkdown) {
				for (var i = 0; i < selection.width; i++) {
					// 下
					cell = this.editPart.getCell(col + i, bottom);
					if (cell == null) {
						break;
					}
					if (cell.merged) {
						changed = this.performAdjust(selection, cell.mergeInfo)
								|| changed;
					} else if (cell.rowSpan > 1) {
						changed = true;
						selection.height = cell.rowIndex + cell.rowSpan
								- selection.y;
					}
				}
			}

			// 左右边界
			col = selection.x;
			row = selection.y;
			right = col + selection.width - 1;
			if (checkleft) {
				for (i = 0; i < selection.height; i++) {
					// 左
					cell = this.editPart.getCell(col, row + i);
					if (cell == null) {
						break;
					}
					if (cell.merged) {
						changed = this.performAdjust(selection, cell.mergeInfo)
								|| changed;
					}
				}
			}

			if (right >= col && checkright) {
				for (i = 0; i < selection.height; i++) {
					// 右
					cell = this.editPart.getCell(right, row + i);
					if (cell == null) {
						break;
					}
					if (cell.merged) {
						changed = this.performAdjust(selection, cell.mergeInfo)
								|| changed;
					} else if (cell.colSpan > 1) {
						changed = true;
						selection.width = cell.colIndex + cell.colSpan
								- selection.x;
					}
				}
			}

		}
		return true;
	},
	performAdjust : function(selection, mergeInfo) {
		var head = this.editPart.getCell(mergeInfo.col, mergeInfo.row);
		var mergeRectangle = new Rectangle(mergeInfo.col, mergeInfo.row,
				head.colSpan, head.rowSpan);
		if (!selection.contains(mergeRectangle)) {
			selection.union(mergeRectangle);
			return true;
		}
		return false;
	},
	getSelection : function() {
		if (this.selections == null || this.selections.length < 1) {
			return null;
		}
		return this.selections[this.selections.length - 1];
	},
	getSelections : function() {
		if (this.selections == null) {
			this.selections = [];
		}
		return this.selections;
	},

	// ********************************************************行列高亮相关**********************************
	addSelectionColRow : function(rect) {
		for (var i = rect.x, max = rect.right(); i < max; i++) {
			this.addSelectionCol(i);
		}
		// this.getSelectionFigure().getUpdateManager().performUpdate();
		for (var j = rect.y, max = rect.bottom(); j < max; j++) {
			this.addSelectionRow(j);
		}
		// this.getSelectionFigure().getUpdateManager().performUpdate();
	},
	removeSelectionColRow : function(rect) {
		for (var i = rect.x, max = rect.right(); i < max; i++) {
			this.removeSelectionCol(i);
		}
		// this.getSelectionFigure().getUpdateManager().performUpdate();
		for (var j = rect.y, max = rect.bottom(); j < max; j++) {
			this.removeSelectionRow(j);
		}
		// this.getSelectionFigure().getUpdateManager().performUpdate();

	},

	// 增加一个选中列
	addSelectionCol : function(col) {
		var colData = this.editPart.getCol(col);
		// 显示效果变为选中
		this.setSelectionColVisual(col, true);
		// 此选中行存起来
		this.selectionCols.put(col, col);
	},
	// 增加一个选中行
	addSelectionRow : function(row) {
		var rowData = this.editPart.getRow(row);
		this.setSelectionRowVisual(row, true);
		this.selectionRows.put(row, row);
	},
	removeSelectionCol : function(col) {
		var colData = this.editPart.getCol(col);
		this.setSelectionColVisual(col, false);
		this.selectionCols.remove(col);
	},
	removeSelectionRow : function(row) {
		var rowData = this.editPart.getRow(row);
		this.setSelectionRowVisual(row, false);
		this.selectionRows.remove(row);
	},
	setSelectionColVisual : function(col, value) {
		var colData = this.editPart.getCol(col);
		var cell = this.editPart.getCell(col, 0);
		if (cell && cell.figure) {
			cell.figure.setSelected(value);
			cell.figure.repaint();
		}
	},
	setSelectionRowVisual : function(row, value) {
		var rowData = this.editPart.getRow(row);
		var cell = this.editPart.getCell(0, row);
		if (cell && cell.figure) {
			cell.figure.setSelected(value);
			cell.figure.repaint();
		}
	},
	getSelectionCols : function() {
		return this.selectionCols;
	},
	getSelectionRows : function() {
		return this.selectionRows;
	},
	hasSelectionInRow : function(row) {
		return this.selectionRows.get(row) != null;
	},
	hasSelectionInCol : function(col) {
		return this.selectionCols.get(col) != null;
	},
	//
	setCurrentCell : function(col, row, width, height) {
		var selectionFigure = this.getSelectionFigure();
		if (col < 0 || row < 0) {
			if (selectionFigure.currentFigure) {
				selectionFigure.remove(selectionFigure.currentFigure);
				selectionFigure.currentFigure = null;
				this.currentFigure = null;
			}
		} else {

			if (!selectionFigure.currentFigure) {
				selectionFigure.currentFigure = this
						.createCurentCellFigure(new Rectangle(col, row, width,
								height));
				selectionFigure.currentFigure.focus = true;
				selectionFigure.add(selectionFigure.currentFigure);
				this.currentFigure = selectionFigure.currentFigure;
			} else {
				selectionFigure.currentFigure.setField(col, row, width, height);
			}
			this.currentFigure.revalidate();
		}

	},
	createCurentCellFigure : function(rect) {
		var figure = new COM.widget.Grid.CellFieldFigure(this.getHost());
		rect.figure = figure;
		var locator = new COM.widget.Grid.CellFieldLocator();
		locator.relocate = function(target) {
			var rect = target.getField();
			var innerBounds = new Rectangle();
			var bounds = this.getEditPart()
					.getCellAreaBounds(rect, innerBounds);

			bounds.x = (bounds.x >> 0) - 0.5;
			bounds.y = (bounds.y >> 0) - 0.5;
			// 此处的innerBounds应该没有用到
			innerBounds.x = (bounds.x >> 0) - 0.5;
			innerBounds.y = (bounds.y >> 0) - 0.5;

			target.setBounds(bounds);
			target.setInnerBounds(innerBounds);
		}
		locator.setEditPart(this.getHost());
		figure.setLocator(locator);
		figure.setField(rect.x, rect.y, rect.width, rect.height);
		figure.addFigureListener(this.editPart.getEditCurrentMoveListener());
		return figure;
	}
});
COM.widget.Grid.GridSelectionManager.SELECTION_FEEDBACK_LAYER = "selection_feedback";

/**
 * @author jiangqifan
 * @since 2013-7-18
 */
COM.widget.Grid.GridLightwightSystem = function GridLightwightSystem() {
	COM.widget.Grid.GridLightwightSystem.superclass.constructor.call(this);
}
COM.widget.Grid.GridLightwightSystem.extend(LightweightSystem, {
	createUpdateManager : function() {
		return new COM.widget.Grid.GridUpdateManager();
	},
	createGraphicsSource : function(canvas) {
		return new COM.widget.Grid.GridGraphicsSource(canvas);
	}
		// dispose: function () {
		//		
		// }
	});
/**
 * @author jiangqifan
 * @since 2013-5-3
 */
COM.widget.Grid.GridViewer = function GridViewer(eventSource, scrollHelper) {
	this.eventSource = eventSource;
	this.scrollHelper = scrollHelper;
	COM.widget.Grid.GridViewer.superclass.constructor.call(this);
}
COM.widget.Grid.GridViewer.extend(COM.gef.GraphicalViewerImpl, {
	// getElement : function() {
	// return this._canvas.element;
	// },
	createControl : function() {
		var ele = this.getElement();
		var canvas = new COM.widget.Grid.GridCanvas(this.eventSource);
		ele.appendChild(canvas.getElement());
		this.setControl(canvas);
	},
	createLightweightSystem : function() {
		var lws = new COM.widget.Grid.GridLightwightSystem();
		return lws;
	},
	createEventDispatcher : function(domain, viewer) {
		var dispatcher = new COM.gef.DomainEventDispatcher(domain, viewer);
		dispatcher.getToolTipHelper = function() {
			if (this.toolTipHelper == null) {
				this.toolTipHelper = new COM.widget.Grid.ToolTipHelper(this.control);
			}
			return this.toolTipHelper;
		}
		return dispatcher;
	},
	createDefaultRoot : function() {
		this.setRootEditPart(new COM.widget.Grid.GridRootEditPart());
	},
	initScrollHelper : function() {
		if (null == this.scrollHelper) {
			this.scrollHelper = new COM.widget.Grid.ScrollHelper();
		}
	},
	setScrollBarSize : function(width, height) {
		this.scrollHelper.setSize(width, height);
	},
	appendScrollBar : function(parent) {
		this.scrollHelper.appendTo(parent);
	},
	dispose : function() {
		if (COM.widget.Grid.GridViewer.superclass.dispose
				&& COM.widget.Grid.GridViewer.superclass.dispose.call(this)) {
			delete this.element;
			delete this.toolTipHelper;
			delete this.eventSource;
		}
	}

});

/**
 * @author jiangqifan
 * @since 2013-8-26
 */
COM.widget.Grid.ToolTipHelper = function ToolTipHelper(originControl) {
	COM.widget.Grid.ToolTipHelper.superclass.constructor.call(this);
	this.originControl = originControl;
	this.createControl();
}
COM.widget.Grid.ToolTipHelper.extend(Object, {
			show : function() {
				this.control.innerHTML = this.tip;
				this.control.style.display = "";
				this.tipShowing = true;
			},
			hide : function() {
				this.control.style.display = "none";
				this.tipShowing = false;
			},
			isShowing : function() {
				return this.tipShowing;
			},
			updateToolTip : function(figureUnderMouse, tip, x, y) {
				if (figureUnderMouse == null) {
					if (this.isShowing()) {
						this.hide();
					}
				}
				if (this.isShowing()
						&& figureUnderMouse != this.currentTipSource) {
					this.hide();
					// this.displayToolTipNear(figureUnderMouse, tip, x, y);
				} else if (!this.isShowing()
						&& figureUnderMouse != this.currentTipSource) {
					this.currentTipSource = null;
				}
			},
			dispose : function() {
				this.control = null;
			},
			displayToolTipNear : function(hoverSource, tip, x, y) {
				if (null == tip || "" == tip) {
					return;
				}
				tip = tip.split("\n").join("<br/>");
				if (tip != null && hoverSource != this.currentTipSource) {
					this.locateToolTip(x, y + 20);
					this.tip = tip;
					this.currentTipSource = hoverSource;
					this.show();
				}
			},
			locateToolTip : function(x, y) {
				this.control.style.left = x + 'px';
				this.control.style.top = y + 'px';
			},
			createControl : function() {
				this.control = document.createElement('div');
				this.control.style.display = 'none';
				this.control.style.position = 'absolute';
				this.control.style.zIndex = 99;
				this.control.style.boxShadow = '5px 5px 5px #000';
				this.control.style.backgroundColor = '#ddd';
				// this.control.style.border='1px solid';
				this.control.style.padding = '4px';
				this.control.style.borderRadius = '4px';
				this.originControl.getParent().appendChild(this.control);
			}

		});
/**
 * @author jiangqifan
 * @since 2013-4-23
 */
COM.widget.Grid.GridRootEditPart = function GridRootEditPart() {
	COM.widget.Grid.GridRootEditPart.superclass.constructor.call(this);
	this.innerLayers = null;
}

COM.widget.Grid.GridRootEditPart.extend(COM.gef.SimpleRootEditPart, {
			createFigure : function() {
				this.innerLayers = new LayeredPane();
				this.createLayers(this.innerLayers);
				return this.innerLayers;
			},
			createLayers : function(layeredPane) {
				function FeedbackLayer() {
					FeedbackLayer.superclass.constructor.call(this);
					this.setEnabled(false);
				}
				FeedbackLayer.extend(Layer, {
							getPreferredSize : function(wHint, hHint) {
								var rect = new Rectangle();
								var children = this.getChildren();
								for (var i = 0; i < children.length; i++) {
									rect.union(children[i].getBounds());
								}
								return rect.getSize();
							}
						});
				var layer = new Layer();
				layer.setLayoutManager(new StackLayout());
				layeredPane.add(layer, COM.gef.LayerConstants.PRIMARY_LAYER); // PRIMARY_LAYER

				layer = new Layer();
				layer.setLayoutManager(new StackLayout());
				layer.setEnabled(false);
				layeredPane
						.add(
								layer,
								COM.widget.Grid.GridSelectionManager.SELECTION_FEEDBACK_LAYER); // SELECTION_FEED_BACK_FEEDBACK_LAYER

				layeredPane.add((function() {
							var l = new Layer();
							l.getPreferredSize = function(wHint, hHint) {
								return new Dimension();
							}
							return l;
						})(), COM.gef.LayerConstants.HANDLE_LAYER); // HANDLE_LAYER

				layeredPane.add(new FeedbackLayer(),
						COM.gef.LayerConstants.FEEDBACK_LAYER); // FEEDBACK_LAYER
			},
			getContentPane : function() {
				return this.getLayer(COM.gef.LayerConstants.PRIMARY_LAYER);
			},
			getDragTracker : function(req) {
				return new MarqueeDragTracker(); // MarqueeDragTracker
			},
			getLayer : function(key) {
				if (this.innerLayers == null) {
					return null;
				}
				return this.innerLayers.getLayer(key);
			},
			getModel : function() {
				return COM.gef.LayerManager.ID;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-4-22
 */

window.requestAnimFrame = window.requestAnimationFrame
		|| window.webkitRequestAnimationFrame
		|| window.mozRequestAnimationFrame || window.oRequestAnimationFrame
		|| window.msRequestAnimationFrame || function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};

var Element = function() {
	Element.superclass.constructor.call(this);
	this.listeners = new PropertyChangeSupport(this);

};
Element.extend(Object, {
			addPropertyChangeListener : function(l) {
				this.listeners.addPropertyChangeListener(l);
			},
			firePropertyChange : function(prop, old, newValue) {
				this.listeners.firePropertyChange(prop, old, newValue);
			},
			fireStructureChange : function(prop, child) {
				this.listeners.firePropertyChange(prop, null, child);
			},
			removePropertyChangeListener : function(l) {
				this.listeners.removePropertyChangeListener(l);
			}
		});
/**
 * @author jiangqifan
 * @since 2013-4-24
 */
COM.widget.Grid.GridModel = function GridModel(grid, data, cellFigureFactory) {
	COM.widget.Grid.GridModel.superclass.constructor.call(this);
	// 回车的移动方向
	this.enterNext = COM.widget.Grid.ENTER_NEXT_UP;
	// 表格控件
	this.grid = grid;
	this.data = data;
	this.firstRow = 1;
	this.firstCol = 1;
	this.editPart;
	this.dataHeight = this.getDataHeight();
	this.dataWidth = this.getDataWidth();
	this.defaultEditorId = data.defaultEditorId;
	this.defaultEditor = data.defaultEditor;
	if (data.rowHeaderCount == 0) {
		data.rowHeaderCount = 1;
	}
	if (data.colHeaderCount == 0) {
		data.colHeaderCount = 1;
	}
	this.grabCols = null; // 记录当前有哪些列需要抢占，元素为列数据
	this.enabled = true;

	this.rowHeaderResizeable = false; // 是否允许改变行表头高度
	this.colHeaderResizeable = false; // 是否允许改变列表头宽度

	// 是否显示插入和删除行列的动画
	this.showInsDelAnimation = false;

	/**
	 * 每次发生数据加载之后需要做的事情,value为方法，返回值为是否需要清除该事项
	 */
	this.afterLoadToDo = new COM.engine.PropertyMap();

	// 用作在插入删除行列之后对选择区域、当前单元格、选中行列的位置调整
	this.selectionMover = null;
	/**
	 * optionProvider 配置选项提供器
	 */
	// 颜色值提供器
	this.colorProvider = null;
	this.cellFigureFactory = cellFigureFactory;
	this.init();
};
COM.widget.Grid.GridModel.extend(Element, {
	// *********************************************初始化开始***************************************
	init : function() {
		this.calculateMergeCells();
		this.freshDataClientWidth();
		this.initSelectionMover();
		this.initColorProvider(this.data.options);
		this.initCellFigureFactory();
	},
	/**
	 * 如果已有图形工厂，就初始化他，如果没有，就创建默认的图形工厂
	 * 初始化图形工厂时会调用init方法，并传递四个参数：colorProvider,imageProivder,headStyle,rowsProvider
	 */
	initCellFigureFactory : function() {
		// this.cellFigureFactory = {
		// createNormalFigure: function (model){
		// return new COM.widget.Grid.CellFigure();
		// },
		// createHeadFigure: function (model) {
		// var figure = new COM.widget.Grid.HeadCellFigure();
		// if (model.rowIndex == 0) {
		// figure.setUpBorderStyle(model.upBorderStyle);
		// figure.setUpBorderColor(model.upBorderColor);
		// }
		// if (model.colIndex == 0) {
		// figure.setLeftBorderStyle(model.leftBorderStyle);
		// figure.setLeftBorderColor(model.leftBorderColor);
		// }
		// return figure;
		// }
		//    		
		// }

		var colorProvider = this.getColorProvider();
		var iamgeProvider = this.grid;
		var headStyle = this.getHeadStyle();

		if (this.cellFigureFactory && this.cellFigureFactory.init) {
			this.cellFigureFactory.init(colorProvider, iamgeProvider,
					headStyle, this);
		} else {
			function CellFigureFactory(colorProvider, imageProvider, headStyle,
					rowsProvider) {
				this.create = function(model) {
					if (null == model) {
						return this.normalCreator.create(null);
					}
					if (0 == model.rowIndex || 0 == model.colIndex) {
						return this.headCreator.create(model);
					} else {
						return this.normalCreator.create(model);
					}
				}

				this.init = function(colorProvider, imageProvider, headStyle,
						rowsProvider) {
					this.normalCreator = new COM.widget.Grid.NormalFigureCreator(
							colorProvider, imageProvider, rowsProvider);
					this.headCreator = new COM.widget.Grid.HeadFigureCreator(
							colorProvider, imageProvider, headStyle);
				}

				this
						.init(colorProvider, imageProvider, headStyle,
								rowsProvider);
			}
			this.cellFigureFactory = new CellFigureFactory(colorProvider,
					iamgeProvider, headStyle, this);
		}
	},
	initSelectionMover : function() {
		this.selectionMover = (function() {
			var arrayEach = COM.Util.Array.each;
			var index = 0;
			var filterFn = function(value, key) {
				if (value >= index) {
					return true;
				}
			};
			var moveCol = function(editPart, count, isAdd, fixCurrentCell) {
				// 移动选择区
				var selections = editPart.getSelections();
				var selection;
				if (selections) {
					for (var i = 0, max = selections.length; i < max; i++) {
						selection = selections[i];
						if (selection.x >= index) {
							selection.x = isAdd
									? selection.x + count
									: selection.x - count;
						}
					}
				}
				// 移动当前单元格
				if (fixCurrentCell) {
					if (editPart.currentCellCol >= index) {
						editPart.currentCellCol = isAdd
								? editPart.currentCellCol + count
								: editPart.currentCellCol - count;
					}
				}

				// 移动选中行列
				var selectionCols = editPart.getSelectionCols();
				var cols = selectionCols.filter(filterFn);
				arrayEach(cols, function(value, index) {
							selectionCols.remove(value);
							var result = isAdd ? value + count : value - count;
							selectionCols.put(result, result);
						});
			};
			var moveRow = function(editPart, count, isAdd, fixCurrentCell) {
				// 移动选择区
				var selections = editPart.getSelections();
				var selection;
				if (selections) {
					for (var i = 0, max = selections.length; i < max; i++) {
						selection = selections[i];
						if (selection.y >= index) {
							selection.y = isAdd
									? selection.y + count
									: selection.y - count;
						}
					}
				}
				// 移动当前单元格
				if (fixCurrentCell) {
					if (editPart.currentCellRow >= index) {
						editPart.currentCellRow = isAdd
								? editPart.currentCellRow + count
								: editPart.currentCellRow - count;
					}
				}

				// 移动选中行列
				var selectionRows = editPart.getSelectionRows();
				var rows = selectionRows.filter(filterFn);
				arrayEach(rows, function(value, index) {
							selectionRows.remove(value);
							var result = isAdd ? value + count : value - count;
							selectionRows.put(result, result);
						});

			};
			return {
				moveRight : function(editPart, begin, count, fixCurrentCell) {
					index = begin;
					moveCol(editPart, count, true, fixCurrentCell);
				},
				moveLeft : function(editPart, begin, count, fixCurrentCell) {
					index = begin;
					moveCol(editPart, count, false, fixCurrentCell);
				},
				moveDown : function(editPart, begin, count, fixCurrentCell) {
					index = begin;
					moveRow(editPart, count, true, fixCurrentCell);
				},
				moveUp : function(editPart, begin, count, fixCurrentCell) {
					index = begin;
					moveRow(editPart, count, false, fixCurrentCell);
				}
			}
		})();
	},
	initColorProvider : function(options) {
		/**
		 * 用与提供颜色值
		 */
		this.colorProvider = function(options) {
			var innerOptions = options;
			return {
				// 选择区域的颜色
				getSelectionColor : function() {
					return innerOptions.selectionColor || "rgba(0,0,255,0.2)";
				},
				// 选中区域的行列表头的颜色
				getSelectionHeadColor : function() {
					return innerOptions.selectionHeadColor
							|| "rgba(255,229,160,1)";
				},
				// 当前单元格的颜色
				getCurrentCellColor : function() {
					return innerOptions.currentCellColor
							|| "rgba(0,255,255,0.2)";
				},
				getBlurCurrentCellColor : function() {
					return innerOptions.blurCurrentCellColor
							|| "rgba(255,0,0,0.2)";
				},
				// 选择框的颜色
				getSelectionBorderColor : function() {
					return innerOptions.selectionBorderColor || "#0f0";
				},
				// 选择框的宽度
				getSelectionBorderWidth : function() {
					return innerOptions.selectionBorderWidth || 2;
				},
				// 默认边框颜色
				getDefaultBorderColor : function() {
					return innerOptions.defaultBorderColor || "#000";
				},
				getDefaultBorderStyle : function() {
					return innerOptions.defaultBorderStyle
							|| COM.widget.Grid.Cell.BORDER_SOLID;
				},
				getDefaultBackColor : function() {
					return innerOptions.defaultBackColor || "#fff";
				},
				getDefaultHeadColor : function() {
					return innerOptions.defaultHeadColor || "#fff";
				},
				isHideSingleSelect : function() {
					return innerOptions.hideSingleSelect || false;
				},
				getCurrentCellShowType : function() {
					return innerOptions.currentCellShowType
							|| COM.widget.Grid.CURRENT_CELL_SHOW_TYPE.BACK;
				},
				isCurrenCellBorderHidden : function() {
					return innerOptions.currentCellBorderHidden || false;
				},
				isSimpleInsert : function() {
					return innerOptions.simpleInsert || false;
				},
				isTableCell : function() {
					return innerOptions.tableCell || false;
				},
				/**
				 * 显示合并单元格的右边框和下边框时是否按照每个被合并的子单元格显示
				 */
				isShowMergeChildBorder : function() {
					return innerOptions.showMergeChildBorder || false;
				},
				isHideSelectionChangeable : function() {
					return !!innerOptions.hideSelectionChangeable;
				},
				setOptions : function(op) {
					innerOptions = op;
				}
			}
		}(options);

	},

	// *********************************************初始化结束***************************************
	/**
	 * 加载数据
	 * 
	 * @param isRow{boolean}
	 *            是否按行加载
	 * @param loadList
	 *            需加载的数据
	 * @param unkown{boolean}
	 *            是否为未知行列
	 */
	loadData : function(byRow, loadList, unkown) {
		var load;
		if (byRow) {
			for (var i = 0; i < loadList.length; i++) {
				load = loadList[i];
				for (var j = 0; j < load.data.length; j++) {
					rowData = load.data[j];
					if (rowData != null) {
						for (var k = 0; k < rowData.length; k++) {
							if (rowData[k].cellMode == null) {
								rowData[k].cellMode = COM.widget.Grid.Cell.Cell_MODE_NORMAL;
							}
						}
					}
					this.data.cells.rowList[j + load.begin] = rowData;
				}
			}
		} else {
			var rowCount = this.getRowCount();
			var colData;
			var rowData;
			for (var i = 0; i < loadList.length; i++) {
				load = loadList[i];
				for (var j = 0; j < load.data.length; j++) {
					colData = load.data[j];
					for (var k = 0; k < rowCount; k++) {
						if (!this.data.cells.rowList[k]) {
							this.data.cells.rowList[k] = [];
						}
						rowData = this.data.cells.rowList[k];
						rowData[j + load.begin] = colData[k];
					}
				}
			}
		}
		if (unkown) {
			var size = 0;
			var rows;
			var count = 0;
			if (byRow) {
				for (var i = 0; i < loadList.length; i++) {
					rows = loadList[i].rows;
					for (var j = 0; j < rows.length; j++) {
						this.data.rows[j + load.begin] = rows[j];
						size += rows[j].size;
					}
					count += loadList[i].end - loadList[i].begin + 1;
				}
				this.data.rowCount += count;
				this.data.height += size;
			}
			// this.freshDataHeight();
			this.dataHeight += size;
			this.freshDataClientHeight();
			this.firePropertyChange(COM.widget.Grid.GridModel.PROP_LOAD_DATA,
					this.data.rowCount - count, this.data.rowCount);
		}

		this.fireEvent(COM.widget.Grid.Event.DATA_LOADED, {
					'byRow' : byRow,
					'list' : loadList
				});
		this.doThingsAfterLoad();
		// 检查看是否需要重绘,如果需要
		this.editPart.refreshVisuals_scroll();
	},
	// ***********************维护一些需要在每次数据加载完之后执行的方法******************************
	doThingsAfterLoad : function() {
		if (this.afterLoadToDo) {
			this.afterLoadToDo.each(this.doOneThingAfterLoad, this);
		}
	},
	doOneThingAfterLoad : function(value, key, map) {
		if (value && typeof value === 'function') {
			if (value()) {
				map.remove(key);
			}
		} else {
			map.remove(key);
		}
	},
	addTingsToDoAtferLoad : function(key, fn) {
		if (this.afterLoadToDo == null) {
			this.afterLoadToDo = new COM.engine.PropertyMap();
		}
		this.afterLoadToDo.put(key, fn);
	},
	// *******************************************************************************************

	getRowHeaderCount : function() {
		return this.data.rowHeaderCount;
	},
	getColHeaderCount : function() {
		return this.data.colHeaderCount;
	},
	getRowFooterCount : function() {
		return this.data.rowFooterCount;
	},
	getColFooterCount : function() {
		return this.data.colFooterCount;
	},
	//
	setRowHeaderCount : function(value) {
		if (!(value > 1)) {
			value = 1;
		}
		if (value > this.getRowCount()) {
			return false;
		}
		// cehck
		// if (value > 0 && value < this.getRowCount()) {
		// var cols = this.getColCount();
		// var cell;
		// for (var i = 0;i<cols; i++) {
		// cell = this.getCell(i,value);
		// if (cell && cell.merged) {
		// if (cell.mergeInfo.row < value) {
		// return false;
		// }
		// }
		// }
		// }
		this.data.rowHeaderCount = value;
		var update = this.editPart.doOnScroll(null, true);
		if (!update) {
			this.editPart.refreshVisuals_scroll();
		}
		return true;
	},
	setColHeaderCount : function(value) {
		if (!(value > 1)) {
			value = 1;
		}
		if (value > this.getColCount()) {
			return false;
		}
		// if (value > 0 && value < this.getColCount()) {
		// var rows = this.getRowCount();
		// var cell;
		// for (var i = 0;i<rows; i++) {
		// cell = this.getCell(value,i);
		// if (cell && cell.mergeInfo) {
		// if (cell.mergeInfo.col < value) {
		// return false;
		// }
		// }
		// }
		// }
		//        
		this.data.colHeaderCount = value;
		var update = this.editPart.doOnScroll(null, true);
		if (!update) {
			this.editPart.refreshVisuals_scroll();
		}
		return true;
	},
	setRowFooterCount : function(value) {
		// cehck
		if (value < 0 || value > this.getRowCount()) {
			return false;
		}
		if (value > 0 && value < this.getRowCount()) {
			var cols = this.getColCount();
			var cell;
			var start = this.getRowCount() - value;
			for (var i = 0; i < cols; i++) {
				cell = this.getCell(i, start);
				if (cell && cell.mergeInfo) {
					if (cell.mergeInfo.row < start) {
						return false;
					}
				}
			}
		}

		this.data.rowFooterCount = value;
		var update = this.editPart.doOnScroll(null, true);
		if (!update) {
			this.editPart.refreshVisuals_scroll();
		}
	},
	setColFooterCount : function(value) {
		// cehck
		if (value < 0 || value > this.getColCount()) {
			return false;
		}
		if (value > 0 && value < this.getColCount()) {
			var rows = this.getRowCount();
			var cell;
			var start = this.getColCount() - value;
			for (var i = 0; i < rows; i++) {
				cell = this.getCell(start, i);
				if (cell && cell.mergeInfo) {
					if (cell.mergeInfo.col < start) {
						return false;
					}
				}
			}
		}
		this.data.colFooterCount = value;
		var update = this.editPart.doOnScroll(null, true);
		if (!update) {
			this.editPart.refreshVisuals_scroll();
		}
	},
	//
	setEditPart : function(editPart) {
		this.editPart = editPart;
	},
	getRowCount : function() {
		return this.data.rowCount;
	},
	getColCount : function() {
		return this.data.colCount;
	},
	getCell : function(col, row) {
		var list = this.data.cells.rowList[row];
		if (list) {
			return list[col];
		}
	},
	getEditPart : function() {
		return this.editPart;
	},
	getCol : function(col) {
		return this.data.cols[col];
	},
	getRow : function(row) {
		return this.data.rows[row];
	},
	setColCount : function(cols) {
		var old = this.getColCount();
		var delta;
		if (cols > old) {
			delta = cols - old;
			this.insertCols(null, delta);
		} else {
			delta = old - cols;
			this.deleteCols(cols, delta);
		}
	},
	setRowCount : function(rows) {
		var old = this.getRowCount();
		var delta;
		if (rows > old) {
			delta = rows - old;
			this.insertRows(null, delta);
		} else {
			delta = old - rows;
			this.deleteRows(rows, delta);
		}
	},
	setColSize : function(col, size) {
		var oldSize = this.data.cols[col].size;
		this.data.cols[col].size = size;
		this.data.cols[col].clientSize = size;

		this.freshDataWidth();
		// 进行抢占
		if (this.grabCols) {
			COM.Util.Array.remove(this.grabCols, this.data.cols[col]);
		}
		this.performColGrab(col);
		this.freshDataClientWidth();
		this.freshGrabCols();
		this.freshDataWidth();
		this.firePropertyChange(COM.widget.Grid.GridModel.PROP_COL_SIZE,
				oldSize, size);
		if (this.editPart.isEditing()
				&& this.editPart.getCurrentCellColRow().col == col) {
			this.editPart.resizeEditor();
		}
		this.fireEvent(COM.widget.Grid.Event.COL_RESIZE, {
					'col' : col,
					'width' : size
				});
	},
	getColSize : function(col) {
		return this.data.cols[col].clientSize;
	},
	setRowSize : function(row, size) {
		var oldSize = this.data.rows[row].size;
		this.data.rows[row].size = size;
		this.data.rows[row].clientSize = size;
		this.dataHeight += size - oldSize;
		this.freshDataClientHeight();
		this.freshDataHeight();

		this.firePropertyChange(COM.widget.Grid.GridModel.PROP_ROW_SIZE,
				oldSize, size);
		if (this.editPart.isEditing()
				&& this.editPart.getCurrentCellColRow().row == row) {
			this.editPart.resizeEditor();
		}
		this.fireEvent(COM.widget.Grid.Event.ROW_RESIZE, {
					'row' : row,
					'height' : size
				});
	},
	getRowSize : function(row) {
		return this.data.rows[row].clientSize;
	},
	setColVisible : function(col, value) {
		this.data.cols[col].hidden = !value;

		this.freshDataWidth();
		this.performColGrab();
		this.freshDataClientWidth();

		this.editPart.onDataSizeChanged();
		this.editPart.refreshVisuals_scroll();
	},
	setRowVisible : function(row, value) {
		this.data.rows[row].hidden = !value;

		this.freshDataHeight();
		this.freshDataClientHeight();

		this.editPart.onDataSizeChanged();
		this.editPart.refreshVisuals_scroll();
	},
	isColHidden : function(col) {
		return this.data.cols[col].hidden;
	},
	isRowHidden : function(row) {
		return this.data.rows[row].hidden;
	},
	setRowBackgroundColor : function(row, color) {
		// 修改模型中的行背景颜色
		var rowData = this.getRow(row);
		if (rowData != null) {
			rowData.color = color;
		}

		// 修改每个单元格图形的颜色
		var cols = this.getColCount();
		var cell;
		var cellList = this.data.cells.rowList[row];
		for (var i = 1; i < cellList.length; i++) {
			cell = cellList[i];
			// 如果单元格本身没有颜色，才修改为行背景色
			if (!cell.backColor) {
				// cell.backColor = color;
				if (cell.figure) {
					cell.figure.setBackColor(color);
					cell.figure.repaint();
				}
			}
		}
	},
	setColGrab : function(col, grab) {
		if (this.data.cols[col]) {
			if (this.data.cols[col].grab == grab) {
				return;
			}
			this.data.cols[col].grab = grab;
			if (!this.grabCols) {
				this.grabCols = [];
			}
			if (grab) {
				this.grabCols.push(this.data.cols[col]);
			} else {
				this.data.cols[col].clientSize = this.data.cols[col].size;
				COM.Util.Array.remove(this.grabCols, this.data.cols[col]);
				// this.grabCols.remove(this.data.cols[col]);
			}
			this.freshDataWidth();
			this.performColGrab();
			this.freshDataClientWidth();
			this.editPart.onDataSizeChanged();
			this.editPart.refreshVisuals_scroll();
		}
	},
	getColGrab : function(col) {
		return this.data.cols[col].grab;
	},
	setRowAutoHeight : function(row, auto) {
		this.data.rows[row].auto = auto;
		if (this.calculateRowSize(row)) {
			this.freshDataClientHeight();
			this.firePropertyChange(COM.widget.Grid.GridModel.PROP_ROW_SIZE,
					oldSize, size);
		}

	},
	isRowAutoHeight : function() {
		return this.data.rows[row].auto;
	},
	setColAutoWidth : function(col, auto) {
		this.data.cols[col].auto = auto;
		if (this.calculateColSize(col)) {
			this.freshDataClientWidth();
			this.firePropertyChange(COM.widget.Grid.GridModel.PROP_ROW_SIZE,
					oldSize, size);
		}
	},
	isColAutoWidth : function(col) {
		return this.data.cols[col].auto;
	},
	mergeCell : function(col, row, width, height) {
		// 检查
		if (col < 0 || row < 0 || col + width > this.getColCount()
				|| row + height > this.getRowCount()) {
			return false;
		}

		// 后面对合并区域进行了合并，这里就不需要拆分了

		// 待合并区域内如果包含合并，先进行拆分
		// for (var i = 0; i < height ; i++) {
		// for (var j = 0; j < width; j++) {
		// this.unMergeCell(j+col, i+row);
		// }
		// }

		// 合并相交的合并区域
		var rect = new Rectangle(col, row, width, height);
		var merges = this.data.mergeCells;
		var i;
		var merge;
		var mergeRect;
		for (i = 0; i < merges.length; i++) {
			merge = merges[i];
			mergeRect = new Rectangle(merges[i].col, merges[i].row,
					merges[i].width, merges[i].height);
			if (rect.intersects(mergeRect)) {
				rect.union(mergeRect);
				merges.splice(i, 1);
				i--;
			}
		}
		//
		this.data.mergeCells.push({
					'col' : rect.x,
					'row' : rect.y,
					'width' : rect.width,
					'height' : rect.height
				});

		var cell;
		// 修改被合并单元格属性
		for (var i = row; i < row + height; i++) {
			for (var j = col; j < col + width; j++) {
				cell = this.getCell(j, i);
				if (cell) {
					cell.merged = true;
					cell.mergeInfo = {
						'col' : col,
						'row' : row
					};
					if (cell.figure) {
						cell.figure.setVisible(false);
					}
				}
			}
		}
		// 修改左上角单元格属性
		cell = this.getCell(col, row);
		if (cell) {
			cell.rowSpan = height;
			cell.colSpan = width;
			cell.merged = false;
			cell.mergeInfo = null;
			if (cell.figure) {
				cell.figure.setRowSpan(height);
				cell.figure.setColSpan(width);
				cell.figure.setVisible(true);
			}

		}

		this.editPart.refreshCurrentFigureField(col, row);
		this.editPart.refreshVisuals_scroll();
	},
	/**
	 * 
	 * @param {}
	 *            col
	 * @param {}
	 *            row
	 * @param {}
	 *            force 强制拆分，为true时如果传入的单元格是被合并单元格，也进行拆分
	 */
	unMergeCell : function(col, row, force) {
		var merges = this.data.mergeCells;
		var i;
		var merge;
		var reuslt;
		// 寻找合并信息
		for (i = 0; i < merges.length; i++) {
			merge = merges[i];
			if ((merge.col == col && merge.row == row)
					|| (force && ((col >= merge.col && col < merge.col
							+ merge.width) && (row >= merge.row && row < merge.row
							+ merge.height)))) {
				reuslt = merge;
				break;
			}
		}

		if (reuslt) {
			// 删除合并信息
			merges.splice(i, 1);

			var j = 0;
			var k = 0;
			var cell;
			// 修改相关单元格的属性
			for (j = 0; j < reuslt.width; j++) {
				for (k = 0; k < reuslt.height; k++) {
					cell = this.getCell(reuslt.col + j, reuslt.row + k);
					if (!cell)
						break;
					cell.rowSpan = 1;
					cell.colSpan = 1;
					cell.merged = false;
					cell.mergeInfo = null;
					if (cell.figure) {
						cell.figure.setRowSpan(1);
						cell.figure.setColSpan(1);
						cell.figure.setVisible(true);
					}
				}
			}
		}
		this.editPart.refreshVisuals_scroll();
	},
	setDefaultEditor : function(editor) {
		this.defaultEditor = editor;
	},
	setDefaultEditorId : function(editorid) {
		this.defaultEditorId = editorid;
	},
	getDefaultEditorId : function() {
		return this.defaultEditorId;
	},
	getDefaultEditor : function() {
		return this.defaultEditor;
	},
	mergedBySameCell : function(cell1, cell2) {
		if (cell1 == null || cell2 == null) {
			return false;
		}
		var p1 = cell1.mergeInfo || {
			'col' : cell1.colIndex,
			'row' : cell1.rowIndex
		};
		var p2 = cell2.mergeInfo || {
			'col' : cell2.colIndex,
			'row' : cell2.rowIndex
		};
		return (p1 != null && p2 != null && ((p1.col == p2.col && p1.row == p2.row)));
	},

	insertRows : function(index, count, copyIndex, copyWay) {
		this.editPart.tryCommitEdit();

		// 初始化相关数据
		index = (index == null || index > this.getRowCount()) ? this
				.getRowCount() : index;
		count = count || 1;
		if (!(copyIndex >= 0)) {
			if (index > 0) {
				copyIndex = index - 1;
			}
		}
		// 表头行数
		if (index < this.data.rowHeaderCount) {
			this.data.rowHeaderCount += count;
		}

		// ------判断是否需要修正当前单元格----
		var fixCurrent = false;
		var colRow = this.editPart.getCurrentCellColRow();
		if (index <= colRow.row) {
			fixCurrent = true;
		}
		// ------------------------------------------------------------------------

		// 合并单元格数据
		var merges = this.data.mergeCells;
		var merge;
		var cell;
		var rowList = this.data.cells.rowList;
		for (var i = 0; i < merges.length; i++) {
			merge = merges[i];
			if (merge.row >= index) {
				merge.row += count;
			} else if (merge.row + merge.height > index) {
				merge.height += count;
				cell = this.getCell(merge.col, merge.row);
				if (cell) {
					cell.rowSpan += count;
					if (cell.figure) {
						cell.figure.setRowSpan(cell.rowSpan);
					}
				}
			}
		}
		// 更新后面行的的位置和合并信息
		var cell;
		var rowCells;
		for (var i = index; i < rowList.length; i++) {
			rowCells = rowList[i];
			if (rowCells) {
				for (var j = 0; j < rowCells.length; j++) {
					cell = rowCells[j];
					if (cell) {
						cell.rowIndex = i + count;
						if (cell.mergeInfo && cell.mergeInfo.row >= index) {
							cell.mergeInfo.row += count;
						}
					}
				}
			}

		}

		var row;
		var counter;
		var optionProvider = this.getColorProvider();
		if (copyIndex > 0 && this.getRow(copyIndex) != null
				&& !optionProvider.isSimpleInsert()) {
			row = COM.widget.Grid.GridHelper.copyRow(this.getRow(copyIndex));
		}
		if (row == null) {
			row = this.defaultHelper.createDefaultRow();
		}

		var upperRow; // 上一行
		var lowerRow; // 下一行
		if (index > 0) {
			upperRow = rowList[index - 1];

		}
		if (index < this.getRowCount()) {
			lowerRow = rowList[index];
		}

		var copyFunc;
		if (copyWay == null) {
			copyWay = COM.widget.Grid.COPY_STYLE;
		}
		if (typeof copyWay === 'number') {
			copyFunc = function(cell) {
				return COM.widget.Grid.GridModel.copyCell(cell, copyWay);
			}
		} else {
			copyFunc = copyWay;
		}

		if (typeof copyFunc !== 'function') {
			throw 'wrong copy way';
		}

		var rowCell;
		if (upperRow == null && lowerRow == null) {
			// 如果上下都没有数据，就直接插入空数据,等待延迟加载再从服务器加载真正的数据
			rowList.splice(index, count, null);
		} else {
			for (var i = 0; i < count; i++) {
				rowCell = [];
				for (var j = 0; j < this.getColCount(); j++) {
					if (copyIndex >= 0 && !optionProvider.isSimpleInsert()) {
						cell = copyFunc(this.getCell(j, copyIndex));
						// if (copyIndex === 0 && j > 0) {
						// 如果第0行或者第0列的边框颜色有值，说明是设置过的，需要复制，如果没有设置，用的默认颜色，才不需要复制.
						// cell.borderColor = [];
						// cell.selectable = true;
						// }
					} else {
						cell = this.defaultHelper.createDefaultCell();
					}
					cell.rowIndex = index + count - i - 1;
					cell.colIndex = j;

					if (index < this.getRowCount()) {
						if (index > 0
								&& index < this.getRowCount()
								&& this.mergedBySameCell(upperRow[j],
										lowerRow[j])) {
							cell.merged = true;
							cell.mergeInfo = {
								'col' : lowerRow[j].mergeInfo.col,
								'row' : lowerRow[j].mergeInfo.row
							};
						}
					}
					rowCell.push(cell);
				}
				rowList.splice(index, 0, rowCell);
			}
		}

		// 插入行数据
		var heightCount = 0;
		for (counter = 0; counter < count; counter++) {
			this.data.rows.splice(index, 0, row);
			row = COM.widget.Grid.GridHelper.copyRow(row);
		}
		this.data.rowCount += count;
		heightCount = row.size * count;

		// 更新表头上的数字
		for (i = index + count; i < this.data.rowCount; i++) {
			cell = this.getCell(0, i);
			if (cell && cell.showText == null && cell.figure) {
				cell.figure.setText(i);
			}
		}

		this.selectionMover.moveDown(this.editPart, index, count, true,
				fixCurrent);
		//
		/*
		 * var i = 0; var rowList = this.data.cells.rowList; var rowCell; var
		 * cellModel; var originCellModel; var cols = rowList[0].length; for
		 * (counter = 0; counter < count; counter++) { rowCell = []; for (i = 0;
		 * i < cols; i++) { cellModel = this.grid.createDefaultCell();
		 * rowCell.push(cellModel); } rowList.splice(target+counter,0,rowCell);
		 *  } if (index != null) { //如果在合并单元格内插入 var orignRowCell; if (index >
		 * 0) { orignRowCell = rowList[index -1]; for (i = 0; i< cols; i++) {
		 * originCellModel = orignRowCell[i]; if (originCellModel &&
		 * originCellModel.mergeInfo) { originCellModel.mergeInfo.height +=
		 * count; this.updateMergeInfo(originCellModel.mergeInfo); } } }
		 * this.updateMergeInfoAfterInsertRow(index,count); }
		 * 
		 * this.data.rowCount += count; this.data.height += (row.clientSize *
		 * count);
		 */
		this.dataHeight += heightCount;
		this.freshDataClientHeight();
		this.firePropertyChange(COM.widget.Grid.GridModel.PROP_INSERT_ROW,
				index, row);
		if (this.isShowInsDelAnimation()) {
			this.playInsertRowsAnimation(index, count);
		}
	},
	getControlSize : function() {
		return {
			'width' : this.grid.width,
			'height' : this.grid.height
		};
	},
	moveRows : function(fromTop, fromBottom, target) {
		// //check
		// var i,
		// max,
		// cell,
		// j;
		// for (i = 0, max = this.getColCount(); i < max; i++) {
		// cell = this.getCell(i, fromTop);
		// if (cell.merged && cell.mergeInfo.row < fromTop) {
		// throw "move wrong area.";
		// }
		// }
		// if (fromBottom < this.getRowCount() - 1) {
		// for (i = 0,max = this.getColCount(); i < max; i++) {
		// cell = this.getCell(i, fromBottom + 1);
		// if (cell.merged && cell.mergeInfo.row < fromBottom + 1) {
		// throw "move wrong area.";
		// }
		// }
		// }
		// //perform
		//    	
		// //处理整体的合并信息
		// var mergeCells = this.data.mergeCells;
		// var merge;
		// for (i = 0, max = mergeCells.length; i < max; i++) {
		// merge = mergeCells[i];
		// if (merge.row >= fromTop && merge.row <= fromBottom) {
		// merge.row += target - fromTop;
		// }
		// }
		//    	
		// var orginRowList = this.data.cells.rowList;
		// var rowList = [];
		// for (i = fromTop; i <= fromBottom; i++) {
		// rowList.push(orginRowList[i]);
		// }
		//    	
		// //处理
		// for (i = fromTop; i <= fromBottom; i++) {
		// for (j = 0, max = this.getColCount(); j < max; j ++) {
		// cell = this.getCell();
		// }
		// }
		// var bottom;
		// for (i = fromBottom - fromTop; i >= 0; i--) {
		// orginRowList.splice(target,0,rowList[i]);
		// }
	},
	playDeleteRowsAnimation : function(index, insertHeight, count) {
		// 更新界面
		var figure = this.editPart.getFigure();
		var updateManager = figure.getUpdateManager();

		// 获取动画区域
		var widths = this.editPart.areaWidths;
		var heights = this.editPart.areaHeights;
		var width = widths[0] + widths[1] + widths[2];
		var height = heights[0] + heights[1] + heights[2];
		var insertTop = this.editPart.getRealRowBegin(index);
		// var insertHeight = 0;
		var rows = this.data.rows;
		/*
		 * for (var i = index,max = index + count; i < max; i++) { insertHeight +=
		 * rows[i].clientSize; }
		 */
		// 获取动画图像数据
		var graphicSource = updateManager.graphicsSource;
		var context = graphicSource.control.context;
		var insertImageData = context.getImageData(0, insertTop, width,
				insertHeight);

		// 擦除动画区域
		context.clearRect(0, insertTop, width, insertHeight);
		graphicSource.flushGraphics();

		// 启动动画
		var duration = 1000;
		var repaint = this.createDeleteRowsAnimationCallback(0, insertTop,
				width, insertHeight, context, insertImageData, graphicSource);
		var after = this.createDeleteRowsAnimationCompleteCallback(index,
				updateManager);
		updateManager.updating = true;
		this.beginAnimation(repaint, duration, after);
	},
	/**
	 * @private
	 */
	createDeleteRowsAnimationCallback : function(x, y, width, height, context,
			imageData, graphicSource) {
		return function(progress) {
			context.clearRect(x, y, width, height);
			context.putImageData(imageData, -progress * width, y);
			graphicSource.flushGraphics();
		}
	},
	createDeleteRowsAnimationCompleteCallback : function(index, updateManager) {
		var self = this;
		return function() {
			updateManager.updating = false;
			self.firePropertyChange(COM.widget.Grid.GridModel.PROP_DELETE_ROW,
					index, {});
		}
	},
	playInsertRowsAnimation : function(index, count) {
		// 更新界面
		var figure = this.editPart.getFigure();
		var updateManager = figure.getUpdateManager();
		updateManager.performUpdate();

		// 获取插入区域
		var widths = this.editPart.areaWidths;
		var heights = this.editPart.areaHeights;
		var width = widths[0] + widths[1] + widths[2];
		var height = heights[0] + heights[1] + heights[2];

		var insertTop = this.editPart.getRealRowBegin(index);
		var insertHeight = 0;
		var rows = this.data.rows;
		for (var i = index, max = index + count; i < max; i++) {
			insertHeight += rows[i].clientSize;
		}

		// 获取动画图像数据
		var graphicSource = updateManager.graphicsSource;
		var context = graphicSource.control.context;
		var insertImageData = context.getImageData(0, insertTop, width,
				insertHeight);

		// 擦除动画区域
		context.clearRect(0, insertTop, width, insertHeight);
		graphicSource.flushGraphics();

		// 启动动画
		var duration = 1000;
		var repaint = this.createInsertRowsAnimationCallback(insertTop,
				insertHeight, width, context, insertImageData, graphicSource);
		var after = this.createAnimationCompleteCallback(updateManager);
		updateManager.updating = true;
		this.beginAnimation(repaint, duration, after);
	},
	createInsertRowsAnimationCallback : function(y, height, width, context,
			imageData, graphicSource) {
		return function(progress) {
			context.clearRect(0, y, width, height);
			context.putImageData(imageData, progress * width - width, y);
			graphicSource.flushGraphics();
		}
	},
	/**
	 * 插入列时可以选择复制方式，包括(CONTENT/STYLE/BOTH)。如论选择何种复制方式，都不会复制合并信息。
	 * 合并信息时在插入时根据左列和右列的情况自动生成的。
	 * 
	 * @param {number}
	 *            index
	 * @param {number}
	 *            count
	 * @param {number}
	 *            copyIndex
	 * @param {number}
	 *            copyWay
	 */
	insertCols : function(index, count, copyIndex, copyWay) {
		this.editPart.tryCommitEdit();

		// 初始化相关数据
		count = count || 1;
		index = (index == null || index > this.getColCount()) ? this
				.getColCount() : index;
		if (!(copyIndex > 0)) {
			if (index > 0) {
				copyIndex = index - 1;
			}
		}
		// 处理表头列数
		if (index < this.data.colHeaderCount) {
			this.data.colHeaderCount += count;
		}
		// ------判断是否需要修正当前单元格----
		var fixCurrent = false;
		var colRow = this.editPart.getCurrentCellColRow();
		if (index <= colRow.col) {
			fixCurrent = true;
		}
		// ------------------------------------------------------------------------

		// 处理合并信息
		var merges = this.data.mergeCells;
		var merge;
		var cell;
		var rowList = this.data.cells.rowList;
		for (var i = 0; i < merges.length; i++) {
			merge = merges[i];
			if (merge.col >= index) {
				merge.col += count;
			} else if (merge.col + merge.width > index) {
				merge.width += count;
				cell = this.getCell(merge.col, merge.row);
				cell.colSpan += count;
				if (cell.figure) {
					cell.figure.setColSpan(cell.colSpan);
				}
			}
		}
		var optionProvider = this.getColorProvider();
		var col;
		var counter;
		if (copyIndex > 0 && this.getCol(copyIndex) != null
				&& !optionProvider.isSimpleInsert()) {
			col = COM.widget.Grid.GridHelper.copyCol(this.getCol(copyIndex));
		}
		if (col == null) {
			col = this.defaultHelper.createDefaultCol();
		}
		// 插入多列列数据
		var width = 0;
		var clientWidth = 0;
		for (counter = 0; counter < count; counter++) {
			this.data.cols.splice(index, 0, col);
			col = COM.widget.Grid.GridHelper.copyCol(col);
			width += col.size;
			clientWidth += col.clientSize;
		}

		var copyFunc;
		if (copyWay == null) {
			copyWay = COM.widget.Grid.COPY_STYLE;
		}
		if (copyWay == null) {
			copyWay = COM.widget.Grid.COPY_STYLE;
		}
		if (typeof copyWay === 'number') {
			copyFunc = function(cell) {
				return COM.widget.Grid.GridModel.copyCell(cell, copyWay);
			}
		} else {
			copyFunc = copyWay;
		}

		if (typeof copyFunc !== 'function') {
			throw ('wrong copy way');
		}

		var rowCell;
		var cell;
		var cell;
		var leftCell;
		var rightCell;
		var colCount = this.getColCount();
		for (var i = 0; i < rowList.length; i++) {
			rowCell = rowList[i];
			if (rowCell) {
				// 修改本行后面的单元格的位置和合并信息
				for (var k = index; k < rowCell.length; k++) {
					cell = rowCell[k];
					cell.colIndex = k + count;
					if (cell.mergeInfo && cell.mergeInfo.col >= index) {
						cell.mergeInfo.col += count;
					}
				}
				// 获取左右单元格，用于辅助快速处理单元格的合并信息
				if (index > 0) {
					leftCell = rowCell[index - 1];
				}
				if (index < colCount - 1) {
					rightCell = rowCell[index];
				}
				for (var j = 0; j < count; j++) {
					if (copyIndex >= 0 && !optionProvider.isSimpleInsert()) {
						cell = copyFunc(this.getCell(copyIndex, i));
						// if (copyIndex === 0 && i > 0) {
						// 如果第0行或者第0列的边框颜色有值，说明是设置过的，需要复制，如果没有设置，用的默认颜色，才不需要复制.
						// cell.borderColor = [];
						// cell.selectable = true;
						// }
					} else {
						cell = this.defaultHelper.createDefaultCell();
					}
					cell.colIndex = index + count - j - 1;
					cell.rowIndex = i;
					if (this.mergedBySameCell(leftCell, rightCell)) {
						cell.merged = true;
						cell.mergeInfo = {
							'col' : rightCell.mergeInfo.col,
							'row' : rightCell.mergeInfo.row
						};
					}
					rowCell.splice(index, 0, cell);
				}
			}
		}
		this.data.colCount += count;

		this.dataWidth += width;
		// this.freshDataWidth();
		this.performColGrab();
		this.freshDataClientWidth();
		// 更新选择区的位置

		// 更新表头上的数字
		for (i = index + count; i < this.data.colCount; i++) {
			cell = this.getCell(i, 0);
			if (cell && cell.showText == null && cell.figure) {
				cell.figure.setText(COM.Util.Common.to26Str(i));
			}
		}

		this.selectionMover.moveRight(this.editPart, index, count, true);

		//
		this.firePropertyChange(COM.widget.Grid.GridModel.PROP_INSERT_COL,
				index, col);
		if (this.isShowInsDelAnimation()) {
			this.playInsertColsAnimation(index, count);
		}
	},
	playDeleteColsAnimation : function(index, count) {
		// 更新界面
		var figure = this.editPart.getFigure();
		var updateManager = figure.getUpdateManager();

		// 获取动画区域
		var widths = this.editPart.areaWidths;
		var heights = this.editPart.areaHeights;
		var width = widths[0] + widths[1] + widths[2];
		var height = heights[0] + heights[1] + heights[2];
		var insertLeft = this.editPart.getRealColBegin(index);
		var insertWidth = 0;
		var cols = this.data.cols;
		for (var i = index, max = index + count; i < max; i++) {
			insertWidth += cols[i].clientSize;
		}

		// 获取动画图像数据
		var graphicSource = updateManager.graphicsSource;
		var context = graphicSource.control.context;
		var insertImageData = context.getImageData(insertLeft, 0, insertWidth,
				height);

		// 擦除动画区域
		context.clearRect(insertLeft, 0, insertWidth, height);
		graphicSource.flushGraphics();

		// 启动动画
		var duration = 1000;
		var repaint = this.createDeleteColsAnimationCallback(insertLeft,
				insertWidth, height, context, insertImageData, graphicSource);
		var after = this.createDeleteColsAnimationCompleteCallback(index,
				updateManager);
		updateManager.updating = true;
		this.beginAnimation(repaint, duration, after);
	},
	/**
	 * @private
	 */
	createDeleteColsAnimationCallback : function(x, width, height, context,
			imageData, graphicSource) {
		return function(progress) {
			context.clearRect(x, 0, width, height);
			context.putImageData(imageData, x, -progress * height);
			graphicSource.flushGraphics();
		}
	},
	createDeleteColsAnimationCompleteCallback : function(index, updateManager) {
		var self = this;
		return function() {
			updateManager.updating = false;
			self.firePropertyChange(COM.widget.Grid.GridModel.PROP_DELETE_COL,
					index, {});
		}
	},
	playInsertColsAnimation : function(index, count) {
		// 更新界面
		var figure = this.editPart.getFigure();
		var updateManager = figure.getUpdateManager();
		updateManager.performUpdate();

		// 获取插入区域
		var widths = this.editPart.areaWidths;
		var heights = this.editPart.areaHeights;
		var width = widths[0] + widths[1] + widths[2];
		var height = heights[0] + heights[1] + heights[2];

		var insertLeft = this.editPart.getRealColBegin(index);
		var insertWidth = 0;
		var cols = this.data.cols;
		for (var i = index, max = index + count; i < max; i++) {
			insertWidth += cols[i].clientSize;
		}

		// 获取动画图像数据
		var graphicSource = updateManager.graphicsSource;
		var context = graphicSource.control.context;
		var insertImageData = context.getImageData(insertLeft, 0, insertWidth,
				height);

		// 擦除动画区域
		context.clearRect(insertLeft, 0, insertWidth, height);
		graphicSource.flushGraphics();

		// 启动动画
		var duration = 1000;
		var repaint = this.createInsertColsAnimationCallback(insertLeft,
				insertWidth, height, context, insertImageData, graphicSource);
		var after = this.createAnimationCompleteCallback(updateManager);
		updateManager.updating = true;
		this.beginAnimation(repaint, duration, after);
	},
	/**
	 * @private
	 */
	createInsertColsAnimationCallback : function(x, width, height, context,
			imageData, graphicSource) {
		return function(progress) {
			context.clearRect(x, 0, width, height);
			context.putImageData(imageData, x, progress * height - height);
			graphicSource.flushGraphics();
		}
	},
	/**
	 * @private
	 */
	createAnimationCompleteCallback : function(updateManager) {
		if (this.completeCallback == null) {
			this.completeCallback = function() {
				updateManager.updating = false;
			}
		}
		return this.completeCallback;
	},
	beginAnimation : function(callback, duration, onComplete) {
		var beginTime = new Date().getTime();
		function update() {
			var currentTime = new Date().getTime();
			var progress = (currentTime - beginTime) / duration;
			progress = Math.min(progress, 1);
			callback(progress);
			if (progress < 1) {
				requestAnimFrame(update);
			} else {
				onComplete();
			}
		}
		requestAnimFrame(update);
	},
	updateMergeInfo : function(mergeInfo) {
		var merges = this.data.mergeCells;
		var i;
		var merge;
		for (i = 0; i < merges.length; i++) {
			merge = merges[i];
			if (merge.col == mergeInfo.col && merge.row == mergeInfo.row) {
				// TODO
				// 可以考虑先清除合并单元格中的其他单元格的合并信息，但目前不做也没问题，只是需要editPart中重新calculate一次
				merge.width = mergeInfo.width;
				merge.height = mergeInfo.height;
			}
		}
	},
	updateMergeInfoAfterInsertCol : function(index, count) {
		var merges = this.data.mergeCells;
		var i;
		var merge;
		for (i = 0; i < merges.length; i++) {
			merge = merges[i];
			if (merge.col >= index) {
				merge.col += count;
			}
		}
	},
	updateMergeInfoAfterDeleteCol : function(index, count) {
		var merges = this.data.mergeCells;
		var i;
		var merge;
		// 对可能影响到得合并单元格进行更新
		for (i = 0; i < merges.length; i++) {
			merge = merges[i];
			if (merge.col > index) { // 如果合并单元个的头在index之后

				if (merge.col < index + count) {// 如果合并单元格的头在删除区域之内

					if (merge.col + merge.width < index + count) {// 头尾都在删除区域内,删除该合并信息

						merges.splice(i, 1);
						i--;
					} else { // 头在删除区域内，尾不在
						merge.width = merge.width - (index + count - merge.col);
						merge.col = index;
					}
				} else {
					// 如果合并单元格的头在删除区域之后
					merge.col -= count;
				}

			} else if (merge.col + merge.width > index) {
				// 如果合并单元格的头在删除区域之前，但是与删除区域有交集
				merge.width -= Math.min(merge.col + merge.width - index, count);
			}
			/*
			 * merge.col -= Math.min(Math.max(merge.col - index,0),count);
			 * merge.width -=
			 * Math.max(Math.min(merge.col+merge.width,index+count) -
			 * Math.max(index,count),0);
			 */
		}
	},
	updateMergeInfoAfterInsertRow : function(index, count) {
		var merges = this.data.mergeCells;
		var i;
		var merge;
		for (i = 0; i < merges.length; i++) {
			merge = merges[i];
			if (merge.row >= index) {
				merge.row += count;
			}
		}

	},
	/**
	 * @see #updateMergeInfoAfterDeleteCol
	 */
	updateMergeInfoAfterDeleteRow : function(index, count) {
		var merges = this.data.mergeCells;
		var i;
		var merge;
		for (i = 0; i < merges.length; i++) {
			merge = merges[i];
			if (merge.row > index) {
				if (merge.row < index + count) {
					if (merge.row + merge.height < index + count) {
						merges.splice(i, 1);
						i--;
					} else {
						merge.height = merge.height
								- (index + count - merge.row);
						merge.row = index;
					}
				} else {
					merge.row -= count;
				}
			} else if (merge.row + merge.height > index) {
				merge.height -= Math.min(merge.row + merge.height - index,
						count);
			}
		}
	},
	deleteMergeInfo : function(mergeInfo) {
		var merges = this.data.mergeCells;
		var i;
		var merge;
		for (i = 0; i < merges.length; i++) {
			merge = merges[i];
			if (merge.row == mergeInfo.row && merge.col == mergeInfo.col) {
				merges.splice(i, 1);
				i--;
			}
		}
	},
	deleteRows : function(index, count) {
		// this.editPart.setSelections([]);
		this.editPart.tryCommitEdit();

		count = count || 1;
		count = Math.min(count, this.data.rowCount - index);
		var merges = this.data.mergeCells;
		var merge;
		var cell;
		var rowCells;
		var rowList = this.data.cells.rowList;

		if (index < this.data.rowHeaderCount) {
			this.data.rowHeaderCount -= Math.min(count,
					this.data.rowHeaderCount - index);
		}

		// ------修正当前单元格，如果当前单元格会被删除，则设置当前单元格为(-1,-1)----
		var fixCurrent = true;
		var colRow = this.editPart.getCurrentCellColRow();
		if (index <= colRow.row && index + count > colRow.row) {
			this.editPart.setCurrentCell(-1, -1, {
						'type' : COM.widget.Grid.CAUSE_CALL
					});
			fixCurrent = false;
		}
		// ------------------------------------------------------------------------

		for (var i = 0; i < merges.length; i++) {
			merge = merges[i];
			if (merge.row >= index) {
				if (merge.row > index + count - 1) {
					merge.row -= count;
				} else {
					if (merge.row + merge.height > index + count) {
						// 更新合并头
						merge.height = merge.height
								- (index + count - merge.row);
						merge.row = index;

						rowCells = rowList[index + count];

						if (rowCells) {
							cell = rowCells[merge.col];
							if (cell) {
								cell.rowSpan = merge.height;
								cell.colSpan = merge.width;
								cell.merged = false;
								if (cell.figure) {
									cell.figure.setVisible(true);
								}
							}
						}
					} else {
						merges.splice(i, 1);
						i--;
					}
				}
			} else {
				if (merge.row + merge.height > index + count - 1) {
					merge.height -= count;
					rowCells = rowList[merge.row];
					if (rowCells) {
						cell = rowCells[merge.col];
						if (cell) {
							cell.rowSpan = merge.height;
						}
					}
				} else if (merge.row + merge.height >= index) {
					merge.height = index - merge.row;
					rowCells = rowList[merge.row];
					if (rowCells) {
						cell = rowCells[merge.col];
						if (cell) {
							cell.rowSpan = merge.height;
						}
					}
				}
			}
		}

		// 更新其它cell 的位置和合并信息
		for (var j = index + count; j < rowList.length; j++) {
			rowCells = rowList[j];
			if (rowCells) {
				for (var i = 0; i < rowCells.length; i++) {
					cell = rowCells[i];
					if (cell) {
						cell.rowIndex = j - count;
						// 更新mergeInfo
						if (cell.merged) {

							if (cell.mergeInfo.row >= index /*
															 * &&
															 * cell.mergeInfo.row <
															 * index + count
															 */) {
								if (cell.mergeInfo.row < index + count) {
									cell.mergeInfo.row = index;
								} else {
									cell.mergeInfo.row -= count;
								}

							}
						}
					}

				}
			}
		}

		// 删除数据
		rowList.splice(index, count);

		// 删除行数据
		var height = 0;
		for (var counter = 0; counter < count; counter++) {
			var row = this.getRow(index + counter);
			height += row.clientSize;
		}
		this.data.rows.splice(index, count);

		this.data.rowCount -= count;

		this.dataHeight -= height;
		this.freshDataClientHeight();

		// 更新表头上的数字
		for (i = index; i < this.data.rowCount; i++) {
			cell = this.getCell(0, i);
			if (cell && cell.showText == null && cell.figure) {
				cell.figure.setText(i);
			}
		}

		this.selectionMover.moveUp(this.editPart, index + count, count,
				fixCurrent);
		this.editPart.setSelections(this.editPart.getSelections());

		/*
		 * var rowList = this.data.cells.rowList; var height = 0; var counter
		 * =0; var row; //删除行数据 for (counter = 0;counter < count; counter++) {
		 * row = this.getRow(index + counter); height += row.size; }
		 * this.data.rows.splice(index,count);
		 * 
		 * //删除单元格数据 rowList.splice(index,counter);
		 * 
		 * //更新可能影响到得合并单元格数据 this.updateMergeInfoAfterDeleteRow(index,count);
		 * 
		 * //修改整体数据 this.data.rowCount -= count; this.data.height -= height;
		 */
		// 在动画完成之后执行
		// this.firePropertyChange(COM.widget.Grid.GridModel.PROP_DELETE_ROW,index,{});
		if (this.isShowInsDelAnimation()) {
			this.playDeleteRowsAnimation(index, height, count);
		} else {
			this.firePropertyChange(COM.widget.Grid.GridModel.PROP_DELETE_ROW,
					index, {});
		}
	},
	deleteCols : function(index, count) {
		this.editPart.tryCommitEdit();
		// 初始化相关数据
		count = count || 1;
		count = Math.min(count, this.data.colCount - index);
		// 表头列数
		if (index < this.data.colHeaderCount) {

			this.data.colHeaderCount -= Math.min(count,
					(this.data.colHeaderCount - index));
		}

		// ------修正当前单元格，如果当前单元格会被删除，则设置当前单元格为(-1,-1)----
		var fixCurrent = true;
		var colRow = this.editPart.getCurrentCellColRow();
		if (index <= colRow.col && index + count > colRow.col) {
			this.editPart.setCurrentCell(-1, -1, {
						'type' : COM.widget.Grid.CAUSE_CALL
					});
			fixCurrent = false;
		}
		// ------------------------------------------------------------------------

		var rowList = this.data.cells.rowList;
		var width = 0;
		var counter = 0;
		var i = 0;
		var col;
		// 更新合并区域信息
		var merges = this.data.mergeCells;
		var merge;
		var rowCells;
		var cell;
		for (var i = 0; i < merges.length; i++) {
			merge = merges[i];
			if (merge.col >= index) {
				// 合并区域整体在删除区域右侧
				if (merge.col > index + count - 1) {
					merge.col -= count;
				} else {
					// 合并区域横跨删除区域右侧
					if (merge.col + merge.width > index + count) {
						// 更新合并头

						merge.width = merge.width - (index + count - merge.col);
						merge.col = index;

						rowCells = rowList[merge.row];
						if (rowCells) {
							cell = rowCells[index + count];
							if (cell) {
								cell.rowSpan = merge.height;
								cell.colSpan = merge.width;
								cell.merged = false;
								if (cell.figure) {
									cell.figure.setVisible(true);
								}
							}
						}
					} else {
						// 合并区域被删除区域包含
						merges.splice(i, 1);
						i--;
					}
				}
			} else {

				if (merge.col + merge.width > index + count - 1) {
					// 合并区域包含删除区域
					merge.width -= count;
					rowCells = rowList[merge.row];
					if (rowCells) {
						cell = rowCells[merge.col];
						if (cell) {
							cell.rowSpan = merge.height;
							cell.colSpan = merge.width;
						}
					}
				} else if (merge.col + merge.width >= index) {
					// 合并区域横跨删除区域左侧
					merge.width = index - merge.col;
					rowCells = rowList[merge.row];
					if (rowCells) {
						cell = rowCells[merge.col];
						if (cell) {
							cell.rowSpan = merge.height;
							cell.colSpan = merge.width;
						}
					}
				}
			}
		}
		// 删除列数据
		for (counter = 0; counter < count; counter++) {
			col = this.getCol(index + counter);
			width += col.size;
		}
		this.data.cols.splice(index, count);
		// 处理合并单元格不能只处理删除的第一列 TODO

		// 删除单元格数据
		for (i = 0; i < rowList.length; i++) {
			rowCells = rowList[i];
			if (rowCells) {
				rowCells.splice(index, count);
				// 更新后面列单元格的位置信息和合并信息
				for (var j = index, max = rowCells.length; j < max; j++) {
					cell = rowCells[j];
					cell.colIndex -= count;
					if (cell.merged) {
						if (cell.mergeInfo.col > index) {
							// 合并区域横跨删除区域右侧
							if (cell.mergeInfo.col >= index + count) {
								cell.mergeInfo.col -= count;
							} else {
								// 合并区域在删除区域右侧
								cell.mergeInfo.col = index;
							}
						}
					}
				}
			}

		}
		this.data.colCount -= count;
		// 处理合并单元格信息 TODO

		/*
		 * //更新可能影响到得合并单元格数据 this.updateMergeInfoAfterDeleteCol(index,count);
		 */

		// 更新表头上的数字
		for (i = index; i < this.data.rowCount; i++) {
			cell = this.getCell(i, 0);
			if (cell && cell.showText == null && cell.figure) {
				cell.figure.setText(COM.Util.Common.to26Str(i - 1));
			}
		}

		// 更新选择区的位置
		this.selectionMover.moveLeft(this.editPart, index + count, count,
				fixCurrent);
		this.editPart.setSelections(this.editPart.getSelections());

		//

		// 放在动画结束之后再fire
		// this.firePropertyChange(COM.widget.Grid.GridModel.PROP_DELETE_COL,index,{});
		this.dataWidth -= width;
		this.freshDataClientWidth();
		if (this.isShowInsDelAnimation()) {
			this.playDeleteColsAnimation(index, count);
		} else {
			this.firePropertyChange(COM.widget.Grid.GridModel.PROP_DELETE_COL,
					index, {});
		}
	},

	// 行列操作
	// 本行被上一行合并的单元格，在计算本行行高时不应计入。
	// 标题行是否要当做有文字来计算？
	calculateRowSize : function(row) {
		var rowData = this.data.rows[row];
		var rowCells = this.data.cells.rowList[row];
		var orginSize = rowData.clientSize;
		if (!rowCells) {
			return;
		}
		var cell;
		var emptyPadding = [];
		var padding;
		var max = rowData.minSize || rowData.size || 0;
		for (var i = 0; i < rowCells.length; i++) {
			cell = rowCells[i];
			if (!cell) {
				continue;
			}
			if (!this.isColVisible(i)) {
				continue;
			}
			padding = cell.padding || emptyPadding;
			max = Math.max(TextHelper.calculateHeight(cell, this
									.getCellWidth(cell))
							+ (padding[0] || 0) + (padding[2] || 0), max);
		}
		rowData.dirty = false;
		rowData.clientSize = max;
		if (null != this.data.height) {
			this.data.height += max - orginSize;
		}
		if (null != this.dataClientHeight) {
			this.dataClientHeight += max - orginSize;
		}
		return orginSize != max;
	},
	getCellHeight : function(cell) {
		var height = 0;
		if (cell.rowSpan > 1) {
			for (index = cell.rowIndex, end = cell.rowIndex + cell.rowSpan; index < end; index++) {
				if (this.isRowVisible(index)) {
					height += this.data.rows[index].clientSize;
				}
			}
		} else {
			height = this.data.rows[cell.rowIndex].clientSize;
		}
		return height;
	},
	getCellWidth : function(cell) {
		var width = 0;
		if (cell.colSpan > 1) {
			for (index = cell.colIndex, end = cell.colIndex + cell.colSpan; index < end; index++) {
				if (this.isColVisible(index)) {
					width += this.data.cols[index].clientSize;
				}
			}
		} else {
			width = this.data.cols[cell.colIndex].clientSize;
		}
		return width;
	},
	// 本列被上一列合并的单元格，在计算本列列宽时不应计入。
	// 标题列是否要当做有文字来计算？
	calculateColSize : function(col) {
		var colData = this.data.cols[col];
		var rowList = this.data.cells.rowList;
		var orginSize = colData.clientSize;
		var cell;
		var emptyPadding = [];
		var padding;
		var max = colData.minSize || colData.size || 0;
		for (var i = 0; i < rowList.length; i++) {
			cell = rowList[i][col];
			if (!cell) {
				continue;
			}
			if (!this.isRowVisible(i)) {
				continue;
			}
			padding = cell.padding || emptyPadding;
			max = Math.max(TextHelper.calculateWidth(cell, this
									.getCellHeight(cell))
							+ (padding[1] || 0) + (padding[3] || 0), max);
		}
		colData.dirty = false;
		colData.clientSize = max;
		if (null != this.data.width) {
			this.data.width += max - orginSize;
		}
		if (null != this.dataClientWidth) {
			this.dataClientWidth += max - orginSize;
		}
		return orginSize != max;
	},
	exchangeCols : function(source, target) {
		var result = {};
		result.doit = COM.widget.Grid.RESULT_TRUE;
		this.fireEvent(COM.widget.Grid.Event.EXCHANGE_COLS, {
					'col1' : source,
					'col2' : target,
					'result' : result
				});
		if (result.doit != COM.widget.Grid.RESULT_TRUE) {
			return;
		}
		if (this.editPart.currentCellCol == source) {
			this.editPart.currentCellCol = target;
		} else if (this.editPart.currentCellCol == target) {
			this.editPart.currentCellCol = source;
		}
		// this.editPart.clearSelection();
		var rowList = this.data.cells.rowList;
		var rowCells;
		var cell1;
		var cell2;
		for (var i = 0; i < rowList.length; i++) {
			rowCells = rowList[i];
			if (rowCells) {
				cell1 = rowCells[source];
				cell2 = rowCells[target];
				if (cell1.merged || cell2.merged) {
					var cell1Merged = cell1.merged;
					var cell1MergeInfo = cell1.mergeInfo;
					cell1.merged = cell2.merged;
					cell1.mergeInfo = cell2.mergeInfo;
					cell2.merged = cell1Merged;
					cell2.mergeInfo = cell1MergeInfo;
					if (cell1.figure) {
						cell1.figure.setVisible(cell1.merged);
					}
					if (cell2.figure) {
						cell2.figure.setVisible(cell2.merged);
					}
				}
				if (cell1.colSpan > 1 || cell2.colSpan > 1) {
					var cell1ColSpan = cell1.colSpan;
					var cell1RowSpan = cell1.rowSpan;
					cell1.colSpan = cell2.colSpan;
					cell1.rowSpan = cell2.rowSpan;
					cell2.colSpan = cell1ColSpan;
					cell2.rowSpan = cell1RowSpan;
					if (cell1.figure) {
						cell1.figure.setRowSpan(cell1.rowSpan);
						cell1.figure.setColSpan(cell1.colSpan);
					}
					if (cell2.figure) {
						cell2.figure.setRowSpan(cell2.rowSpan);
						cell2.figure.setColSpan(cell2.colSpan);
					}
				}
				cell1.colIndex = target;
				cell2.colIndex = source;
				rowCells[source] = cell2;
				rowCells[target] = cell1;
			}
		}
		this.editPart.refreshVisuals_scroll();
	},

	// 区域操作
	deleteRect : function(rect, deal) {
		var col = rect.x;
		var row = rect.y;
		var width = rect.width;
		var height = rect.height;
		var right = col + width - 1;
		var bottom = row + height - 1;
		var rowList = this.data.cells.rowList;
		var mergeCells = this.data.mergeCells;
		var rowCells;
		var cell;
		var colCount = this.data.colCount;
		var rowCount = this.data.rowCount;
		var unMergeList = [];
		var needUnMerge;
		function addToMergeList(col, row, cell) {
			needUnMerge = true;
			unMergeList.push({
						'col' : col,
						'row' : row
					});
		}
		// check
		if (deal == COM.widget.Grid.DELETE_DEAL_HORIZ) {
			for (var i = row; i <= bottom; i++) {
				rowCells = rowList[i];
				for (var j = col; j < colCount; j++) {
					cell = rowCells[j];
					if (cell) {
						if (cell.merged) {
							if (cell.mergeInfo.row < row
									|| cell.mergeInfo.col < col) {
								addToMergeList(cell.mergeInfo.col,
										cell.mergeInfo.row, cell);
							}
						} else if (cell.rowIndex + cell.rowSpan - 1 > bottom) {
							addToMergeList(j, i, cell);
						}
					}
				}
			}

			// 确认是否删除
			var result = {};
			result.doit = COM.widget.Grid.RESULT_TRUE;
			if (needUnMerge) {
				this.fireEvent(COM.widget.Grid.Event.DELETING_RECT, {
							'rect' : {
								'x' : col,
								'y' : row,
								'width' : width,
								'height' : height
							},
							'result' : result,
							'unMergeList' : unMergeList
						});
			}
			if (result.doit !== COM.widget.Grid.RESULT_TRUE) {
				return;
			}
			// 拆分单元格
			var unMerge;
			for (var i = 0, max = unMergeList.length; i < max; i++) {
				unMerge = unMergeList[i];
				this.unMergeCell(unMerge.col, unMerge.row);
			}

			// 修改合并单元格信息
			var merge;
			for (var i = 0, max = mergeCells.length; i < max; i++) {
				var merge = mergeCells[i];
				if (merge.row < row || merge.row > bottom) {
					break;
				}
				if (merge.col > col) {
					if (merge.col > right) {
						merge.col -= width;
					} else {
						if (merge.col + merge.width - 1 > right) {
							merge.col = col;
						} else {
							mergeCells.splice(i, 1);
							max--;
						}
					}
				}
			}
			// 删除
			for (var i = row; i <= bottom; i++) {
				rowCells = rowList[i];
				for (var j = right + 1; j <= colCount; j++) {
					cell = rowCells[j];
					if (cell) {
						if (cell.merged) {
							if (cell.mergeInfo.col > right) {
								cell.mergeInfo.col -= width;
							}
						}
						cell.colIndex -= width;
						rowCells[j - width] = cell;
					}
				}
			}
			for (var i = row; i <= bottom; i++) {
				rowCells = rowList[i];
				for (var j = colCount - width; j < colCount; j++) {
					cell = this.defaultHelper.createDefaultCell();
					cell.rowIndex = i;
					cell.colIndex = j;
					rowCells[j] = cell;
				}
			}

		} else {
			// check
			for (var i = row; i < rowCount; i++) {
				rowCells = rowList[i];
				for (var j = col; j <= right; j++) {
					cell = rowCells[j];
					if (cell) {
						if (cell.merged) {
							if (cell.mergeInfo.col < col
									|| cell.mergeInfo.row < row) {
								addToMergeList(cell.mergeInfo.col,
										cell.mergeInfo.row, cell);
							}
						} else if (cell.colIndex + cell.colSpan - 1 > right) {
							addToMergeList(j, i, cell);
						}
					}
				}
			}

			// 确认是否删除
			var result = {};
			result.doit = COM.widget.Grid.RESULT_TRUE;
			if (needUnMerge) {
				this.fireEvent(COM.widget.Grid.Event.DELETING_RECT, {
							'rect' : {
								'x' : col,
								'y' : row,
								'width' : width,
								'height' : height
							},
							'result' : result,
							'unMergeList' : unMergeList
						});
			}
			if (result.doit !== COM.widget.Grid.RESULT_TRUE) {
				return;
			}
			// 拆分单元格
			var unMerge;
			for (var i = 0, max = unMergeList.length; i < max; i++) {
				unMerge = unMergeList[i];
				this.unMergeCell(unMerge.col, unMerge.row);
			}

			// 修改合并单元格信息
			var merge;
			for (var i = 0, max = mergeCells.length; i < max; i++) {
				var merge = mergeCells[i];
				if (merge.col < col || merge.col > right) {
					break;
				}
				if (merge.row > row) {
					if (merge.row > bottom) {
						merge.row -= height;
					} else {
						if (merge.row + merge.height - 1 > bottom) {
							merge.row = row;
						} else {
							mergeCells.splice(i, 1);
							max--;
						}
					}
				}
			}
			// 删除
			for (var i = bottom + 1; i < rowCount; i++) {
				rowCells = rowList[i];
				for (var j = col; j <= right; j++) {
					cell = rowCells[j];
					if (cell) {
						if (cell.merged) {
							if (cell.mergeInfo.row > bottom) {
								cell.mergeInfo.row -= height;
							}
						}
						cell.rowIndex -= height;
						rowList[i - height][j] = cell;
					}
				}
			}
			for (var i = rowCount - height; i < rowCount; i++) {
				for (var j = col; j <= right; j++) {
					cell = this.defaultHelper.createDefaultCell();
					cell.rowIndex = i;
					cell.colIndex = j;
					rowList[i][j] = cell;
				}
			}
		}
		this.editPart.refreshVisuals_scroll();
	},
	calculateMergeCells : function() {
		var data = this.data;
		var mergeCells = data.mergeCells;
		var rowLists = data.cells.rowList;
		var mergeCell;
		var cell;
		var row;
		var mergeHead;
		var rowCell;
		if (mergeCells != null) {
			for (var i = 0; i < mergeCells.length; i++) {
				mergeCell = mergeCells[i];
				rowCell = rowLists[mergeCell.row];
				if (rowCell == null) {
					continue;
				}
				mergeHead = rowLists[mergeCell.row][mergeCell.col];
				if (mergeHead == null) {
					continue;
				}
				if (mergeHead.merged) {
					mergeCells.splice(i, 1);
					i--;
					continue;
				}
				mergeHead.rowSpan = mergeCell.height;
				mergeHead.colSpan = mergeCell.width;
				for (var rowDelta = 0; rowDelta < mergeCell.height; rowDelta++) {
					for (var colDelta = 0; colDelta < mergeCell.width; colDelta++) {
						row = rowLists[mergeCell.row + rowDelta];
						if (row) {
							cell = row[mergeCell.col + colDelta];
							if (cell) {
								cell.merged = true;
								cell.mergeInfo = {
									'col' : mergeCell.col,
									'row' : mergeCell.row
								};
							}
						}

					}
				}
				mergeHead.merged = false;
				mergeHead.mergeInfo = null;
			}
		}
	},
	getEditMode : function() {
		return this.data.options.editMode;
	},
	clearText : function(rect, cause, force) {

		var rowList = this.data.cells.rowList;
		var rowCells;
		var cell;
		for (var i = 0; i < rect.height; i++) {
			rowCells = rowList[rect.y + i];
			if (rowCells) {
				for (var j = 0; j < rect.width; j++) {
					cell = rowCells[rect.x + j];
					if (cell) {
						if (force || cell.editable) {
							cell.showText = '';
							cell.editText = '';
							if (cell.figure) {
								cell.figure.setText('');
								cell.figure.repaint();
							}
						}
					}
				}
			}
		}
		this.fireEvent(COM.widget.Grid.Event.DATA_CHANGE, {
					'rect' : {
						'x' : rect.x,
						'y' : rect.y,
						'width' : rect.width,
						'height' : rect.height
					},
					'cause' : cause
				});
	},
	// 清除一块区域
	clearRect : function(rect, cause, force) {
		var rowList = this.data.cells.rowList;
		var rowCells;
		var cell;
		for (var i = 0; i < rect.height; i++) {
			rowCells = rowList[rect.y + i];
			if (rowCells) {
				for (var j = 0; j < rect.width; j++) {
					cell = rowCells[rect.x + j];
					if (cell) {
						if (force || cell.editable) {
							this.clearCell(cell);
						}
					}
				}
			}
		}
		this.fireEvent(COM.widget.Grid.Event.DATA_CHANGE, {
					'rect' : {
						'x' : rect.x,
						'y' : rect.y,
						'width' : rect.width,
						'height' : rect.height
					},
					'cause' : cause
				});
	},
	// 单元格操作
	copyCell : function(cell, style) {
		var result = {};
		if (style & COM.widget.Grid.COPY_CONTENT) {

			result.editorId = cell.editorId;
			result.title = cell.title;
			result.showText = cell.showText;
			result.editText = cell.editText;
			result.cellMode = cell.cellMode;
			result.html = cell.html;
			result.treeImage = cell.treeImage;
			result.control = cell.control;
			result.checked = cell.checked;
			result.checkable = cell.checkable;
			result.expandable = cell.expandable;
			result.expanded = cell.expanded;
			result.depth = cell.depth;
			result.clientData = cell.clientData;
			result.isTreeEnd = cell.isTreeEnd;
			result.rowSpan = 1;
			result.colSpan = 1;
			result.merged = cell.merged;
		}

		if (style & COM.widget.Grid.COPY_STYLE) {
			result.selectable = cell.selectable;
			result.editable = cell.editable;
			result.rowSpan = cell.rowSpan;
			result.colSpan = cell.colSpan;
			result.backStyle = cell.backStyle;
			result.backColor = cell.backColor;
			if (cell.gradientBackground) {
				result.gradientBackground = {
					'begin' : cell.gradientBackground.begin,
					'end' : cell.gradientBackground.end,
					'direction' : cell.gradientBackground.direction
				};
			}
			result.border = [cell.border[0], cell.border[1], cell.border[2],
					cell.border[3]];
			result.borderColor = [cell.borderColor[0], cell.borderColor[1],
					cell.borderColor[2], cell.borderColor[3]];
			result.fontName = cell.fontName;
			result.fontSize = cell.fontSize;
			result.fontBold = cell.fontBold;
			result.fontItalic = cell.fontItalic;
			result.fontColor = cell.fontColor;
			result.textStroke = cell.textStroke;
			if (cell.textShadow) {
				result.textShadow = {
					'offsetX' : cell.offsetX,
					'offsetY' : cell.offsetY,
					'blur' : cell.blur,
					'color' : cell.color
				};
			}
			result.wrapLine = cell.wrapLine;
			result.indent = cell.indent;
			result.horzAlign = cell.horzAlign;
			result.vertAlign = cell.vertAlign;
			result.vertText = cell.vertText;
			result.fitFontSize = cell.fitFontSize;
			result.multiLine = cell.multiLine;
			result.decoration = cell.decoration;
			result.fontSizeUnit = cell.fontSizeUnit;
			result.cellMode = COM.widget.Grid.Cell.Cell_MODE_NORMAL;
			result.clientData = {};
		}
		return result;
	},
	// pasteCell: function (source,dest,style) {
	// var controller = this.getCellController(dest.colIndex,dest.rowIndex);
	// this.fireEvent('dataChange',{
	// 'cell':controller,
	// 'cause':COM.widget.Grid.CAUSE_PASTE,
	// 'style':style
	// });
	// if (style & COM.widget.Grid.PASTE_TEXT) {
	// dest.showText = source.showText;
	// dest.editText = source.editText;
	// dest.editorId = source.editorId;
	// dest.title = source.title;
	// dest.showText = source.showText;
	// dest.editText = source.editText;
	// dest.selectable = source.selectable;
	// dest.editable = source.editable;
	// dest.cellMode = source.cellMode;
	// dest.html = source.html;
	// dest.treeImage = source.treeImage;
	// dest.control = source.control;
	// dest.checked = source.checked;
	// dest.checkable = source.checkable;
	// dest.expandable = source.expandable;
	// dest.expanded = source.expanded;
	// dest.depth = source.depth;
	// dest.clientData = source.clientData;
	// dest.isTreeEnd = source.isTreeEnd;
	// if(dest.figure) {
	// dest.figure.setText(dest.showText);
	// dest.figure.setCellMode(dest.cellMode);
	// dest.figure.setHtml(dest.html);
	// }
	// }
	//        
	//        
	//        
	// if (style & COM.widget.Grid.PASTE_STYLE) {
	// dest.backStyle = source.backStyle;
	// dest.backColor = source.backColor;
	// if (cell.gradientBackground) {
	// dest.gradientBackground = {
	// 'begin':source.gradientBackground.begin,
	// 'end':source.gradientBackground.end,
	// 'direction':source.gradientBackground.direction
	// };
	// }
	// dest.border =
	// [source.border[0],cell.border[1],cell.border[2],cell.border[3]];
	// dest.borderColor =
	// [source.borderColor[0],cell.borderColor[1],cell.borderColor[2],cell.borderColor[3]];
	// dest.fontName = source.fontName;
	// dest.fontSize = source.fontSize;
	// dest.fontBold = source.fontBold;
	// dest.fontItalic = source.fontItalic;
	// dest.fontColor = source.fontColor;
	// dest.textStroke = source.textStroke;
	// dest.rowSpan = source.rowSpan;
	// dest.colSpan = source.colSpan;
	// dest.merged = source.merged;
	// if (source.textShadow) {
	// dest.textShadow = {
	// 'offsetX':source.offsetX,
	// 'offsetY':source.offsetY,
	// 'blur':source.blur,
	// 'color':source.color
	// };
	// }
	// dest.wrapLine = source.wrapLine;
	// dest.indent = source.indent;
	// dest.horzAlign = source.horzAlign;
	// dest.vertAlign = source.vertAlign;
	// dest.vertText = source.vertText;
	// dest.fitFontSize = source.fitFontSize;
	// dest.multiLine = source.multiLine;
	// dest.decoration = source.decoration;
	// if (dest.figure) {
	// dest.figure.setBackStyle(dest.backStyle);
	// dest.figure.setBackColor(dest.backColor);
	// if (dest.gradientBackground) {
	// dest.figure.setGradientBackground(dest.gradientBackground);
	// }
	// dest.figure.setBorderStyle(dest.border);
	// dest.figure.setBorderColor(dest.borderColor);
	// dest.figure.setFontName(dest.fontName);
	// dest.figure.setFontSize(dest.fontSize);
	// dest.figure.setFontBold(dest.fontBold);
	// dest.figure.setFontItalic(dest.fontItalic);
	// dest.figure.setFontColor(dest.fontColor);
	// dest.figure.setTextStroke(dest.textStroke);
	// dest.figure.setTextShadow(dest.textShadow);
	// dest.figure.setWrapLine(dest.wrapLine);
	// dest.figure.setIndent(dest.indent);
	// dest.figure.setHorzAlign(dest.horzAlign);
	// dest.figure.setVertAlign(dest.vertAlign);
	// dest.figure.setVertText(dest.vertText);
	// dest.figure.setFitFontSize(dest.fitFontSize);
	// dest.figure.setMultiLine(dest.multiLine);
	// dest.figure.setDecoration(dest.decoration);
	// dest.figure.setRowSpan(dest.rowSpan);
	// dest.figure.setColSpan(dest.colSpan);
	// if (dest.merged) {
	// dest.figure.setVisible(false);
	// } else {
	// dest.figure.setVisible(true);
	// }
	// dest.figure.repaint();
	// }
	// }
	// },
	clearCell : function(cell) {
		cell.showText = '';
		cell.editText = '';
		cell.title = '';
		cell.selectable = true;
		cell.editable = true;
		cell.cellMode = COM.widget.Grid.Cell.Cell_MODE_NORMAL;
		cell.backStyle = 1;
		cell.backColor = '#fff';
		cell.gradientBackground = null;
		cell.border = this.defaultHelper.createDefaultBorder();
		cell.borderColor = this.defaultHelper.createDefaultBorderColor();
		cell.fontName = '宋体';
		cell.fontSize = 12;

		if (cell.figure) {
			cell.figure.setText('');
			cell.figure.setCellMode(COM.widget.Grid.Cell.Cell_MODE_NORMAL);
			cell.figure.setBackStyle(1);
			cell.figure.setBackColor('#fff');
			cell.figure.setGradientBackground(null);
			cell.figure.setBackStyle(cell.border);
			cell.figure.setBorderColor(cell.borderColor);
			cell.figure.setFontName(cell.fontName);
			cell.figure.setFontSize(cell.fontSize);
		}
	},
	// 选项

	isPassReadOnly : function() {
		return this.data.options.passReadOnly;
	},
	getEnterNext : function() {
		return this.data.options.enterNext;
	},
	setEnterNext : function(dire) {
		this.data.options.enterNext = dire;
	},
	isRowSelectable : function() {
		return this.data.options.rowSelectable;
	},
	isColSelectable : function() {
		return this.data.options.colSelectable;
	},
	isShowSelectionBorder : function() {
		return this.data.options.showSelectionBorder;
	},
	setShowSlectionBorder : function(show) {
		this.data.options.showSelectionBorder = show;
	},
	isCurrenCellBorderHidden : function() {
		return this.data.options.currentCellBorderHidden;
	},
	isColExchangeable : function() {
		return this.data.options.colExchangeable;
	},
	isColResizeable : function() {
		return this.data.options.colResizeable;
	},
	isRowResizeable : function() {
		return this.data.options.rowResizeable;
	},
	isColFreeResizeable : function() {
		return this.data.options.colFreeResizeable;
	},
	isRowFreeResizeable : function() {
		return this.data.options.rowFreeResizeable;
	},
	// ***************************************Color
	// Provider*********************************

	// *******************************************************************************************
	// 当前单元格
	setCurrentCell : function(col, row, cause) {
		this.editPart.setCurrentCell(col, row, cause);
	},
	getCurrentCell : function() {
		var col = this.editPart.currentCellCol;
		var row = this.editPart.currentCellRow;
		return this.getCellController(col, row);
	},
	// 初始化
	getCellFigureFactory : function() {
		return this.cellFigureFactory;
	},
	// 其他
	onSizeChanged : function() {
		this.performColGrab();
		this.freshDataClientWidth();

		// this.editPart.onDataSizeChanged();
		// this.editPart.refreshVisuals_scroll();
	},
	getColorProvider : function() {
		return this.colorProvider;
	},
	freshColGrab : function(grabable) {
		if (grabable) {
			this.performColGrab();
			this.freshDataClientWidth();
		} else {
			var grabCols = this.getGrabCols();
			for (var i = 0, max = grabCols.length; i < max; i++) {
				grabCols[i].clientSize = grabCols[i].size;
			}
		}
		this.editPart.refreshVisuals_scroll();
	},
	freshGrabCols : function() {
		this.grabCols = null;
	},
	/**
	 * 
	 * 进行抢占， 抢占之前，如果dataWidth有变化，需要fresh 抢占之后需要freshDataClientWidth
	 */
	performColGrab : function() {
		Debugger.log('perform grab');
		if (this.data.options.colGrabable) {
			if (this.data.options.loadMode != COM.widget.Grid.LOAD_MODE_NORMAL
					&& !this.data.options.loadByRow) {
				return;
			}
			var dataChildWidth = this.getDataWidth();
			var viewerWidth = this.editPart.getViewer().getSize().width;
			Debugger.log('total width:' + viewerWidth);
			if (dataChildWidth >= viewerWidth) {
				return;
			}
			var grabCols = this.getGrabCols();
			if (grabCols.length > 0) {
				var gift = ((viewerWidth - dataChildWidth) / grabCols.length) << 0;
				for (var i = 0; i < grabCols.length; i++) {
					grabCols[i].clientSize = grabCols[i].size + gift;
				}
			}
		}
	},
	freshDataClientWidth : function() {
		this.dataClientWidth = null;
	},
	freshDataClientHeight : function() {
		this.dataClientHeight = null;
	},
	freshDataWidth : function() {
		this.dataWidth = null;
	},
	freshDataHeight : function() {
		this.dataHeight = null;
	},
	getDataWidth : function() {
		if (this.dataWidth == null) {
			this.dataWidth = 0;
			for (var i = 0; i < this.data.cols.length; i++) {
				if (!this.data.cols[i].hidden) {
					this.dataWidth += this.data.cols[i].size;
				}
			}
		}
		return this.dataWidth;
	},
	getDataSize : function() {
		var width = this.getDataWidth();
		var height = this.getDataHeight();
		return new Dimension(width, height);
	},
	getDataHeight : function() {
		if (this.dataHeight == null) {
			this.dataHeight = 0;
			for (var i = 0; i < this.data.rows.length; i++) {
				if (!this.data.rows[i].hidden) {
					this.dataHeight += this.data.rows[i].size;
				}
			}
		}
		return this.dataHeight;
	},
	getDataClientSize : function() {
		var widht = this.getDataClientWidth();
		var height = this.getDataClientHeight();
		return new Dimension(width, height);
	},
	getDataClientWidth : function() {
		if (this.dataClientWidth == null) {
			this.dataClientWidth = 0;
			for (var i = 0; i < this.data.cols.length; i++) {
				if (!this.data.cols[i].hidden) {
					this.dataClientWidth += this.data.cols[i].clientSize
							|| this.data.cols[i].size;
				}
			}
		}
		return this.dataClientWidth;
	},
	getDataClientHeight : function() {
		if (this.dataClientHeight == null) {
			this.dataClientHeight = 0;
			for (var i = 0; i < this.data.rows.length; i++) {
				if (!this.data.rows[i].hidden) {
					this.dataClientHeight += this.data.rows[i].clientSize
							|| this.data.rows[i].size;
				}
			}
		}
		return this.dataClientHeight;
	},
	getGrabCols : function() {
		if (!this.grabCols) {
			this.grabCols = [];
			var col;
			for (var i = 0; i < this.data.cols.length; i++) {
				col = this.data.cols[i];
				if (!col.hidden && col.grab) {
					this.grabCols.push(col);
				}
			}
		}
		return this.grabCols;
	},
	getCellController : function(col, row) {
		var cell = this.getCell(col, row);
		if (!cell) {
			return COM.widget.Grid.Cell.getNoneCell(col, row);
		}
		if (!cell.controller) {
			cell.controller = new COM.widget.Grid.Cell(cell, this);
		}
		return cell.controller;
	},
	isRowHeaderResizeable : function() {
		return this.rowHeaderResizeable;
	},
	isColHeaderResizeable : function() {
		return this.colHeaderResizeable;
	},
	// 复制粘贴剪切

	cut : function(rect, style) {
		var content = this.copy(rect, style);
		this.clearText(rect, COM.widget.Grid.CAUSE_CUT);
		return content;
	},
	copy : function(rect, style) {

		var result = {};
		result.doit = COM.widget.Grid.RESULT_TRUE;
		this.fireEvent(COM.widget.Grid.Event.COPY, {
					'col' : rect.x,
					'row' : rect.y,
					'width' : rect.width,
					'height' : rect.height,
					'result' : result,
					'style' : style
				});

		if (result.doit != COM.widget.Grid.RESULT_TRUE) {
			return;
		}
		var clipText = this.getCopyText(rect, false);
		if (this.shareManager.copyFunction) {
			this.shareManager.copyFunction.call(this.shareManager.copyObj,
					clipText);
		}
		return clipText;
	},
	getCopyText : function(rect) {
		var text = "";
		var p = /\r\n/g;
		for (var i = rect.y, bottom = rect.y + rect.height - 1; i <= bottom; ++i) {
			if (this.isIgnoreHidden() && !this.isRowVisible(i)) {
				continue;
			}
			for (var j = rect.x, right = rect.x + rect.width - 1; j <= right; ++j) {
				if (this.isIgnoreHidden() && !this.isColVisible(j)) {
					continue;
				}
				var cell = this.getCell(j, i);
				var showText = cell.showText;
				if (!showText) {
					showText = "";
				}
				showText = showText.replace(p, "\n");
				text += showText;
				// if("image://" == showText){
				// var et = cell.getEditText();
				// if(et){
				// text += et;
				// }
				// }
				if (j != right) {
					text += "\t";
				}
				// if(clear && cell.editable){
				// this.clearCell(j, i);
				// }
			}
			// if(i != bottom){
			text += "\r\n";
			// }
		}
		return text;
	},
	freshEditable : function(col, row, editable) {
		if (!this.editPart.isEditing()) {
			return;
		}
		var colRow = this.editPart.getCurrentCellColRow();
		if (colRow.col == col && colRow.row == row) {

			if (!this.editPart.canEdit(this.getCell(col, row))) {
				this.editPart.commitEdit(COM.widget.Grid.CAUSE_CALL);
			}
		}
	},
	isIgnoreHidden : function() {
		return this.data.options.ignoreHidden;
	},
	isRowVisible : function(row) {
		return !this.data.rows[row].hidden;
	},
	isColVisible : function(col) {
		return !this.data.cols[col].hidden;
	},
	// commitCopy: function (content) {
	// if (typeof this.shareManager.copyFunction == 'function') {
	// this.shareManager.copyFunction(content);
	// }
	// this.copyContent = content;
	// },
	// getCopy: function () {
	// return this.copyContent;
	// },
	// TODO 是否忽略隐藏
	paste : function(col, row, style) {

		var self = this;
		function doPaste(cbText) {
			var result = {};
			result.doit = COM.widget.Grid.RESULT_TRUE;
			self.fireEvent(COM.widget.Grid.Event.PASTE, {
				'col' : col,
				'row' : row,
				'result' : result,
				'cbText' : cbText
/*
 * , 'style' : style
 */
				});
			if (result.doit != COM.widget.Grid.RESULT_TRUE) {
				return;
			}
			self.doPaste(cbText, col, row);
			/*
			 * for (var i = 0; i < content.rowCount && row <
			 * data.rowCount;i++,row++) { col = destcol; for (var j = 0; j <
			 * content.colCount && col < data.colCount; j++,col++) { cell =
			 * data.cells.rowList[row][col]; source = content.rowList[i][j];
			 * this.pasteCell(source,cell,style); if (cell.figure) {
			 * cell.figure.repaint(); } } }
			 */
			// paste
			/*
			 * col = destcol; row = destrow; var cell; var source; for (var i =
			 * 0; i < content.rowCount && row < data.rowCount; i++, row++) { col =
			 * destcol; for (var j = 0; j < content.colCount && col <
			 * data.colCount; j++, col++) { cell = data.cells.rowList[row][col];
			 * source = content.rowList[i][j]; this.pasteCell(source, cell,
			 * style); if (cell.figure) { cell.figure.repaint(); } } }
			 */
		}

		if (typeof this.shareManager.pasteFunction == 'function') {
			this.shareManager.pasteFunction.call(this.shareManager.pasteObj,
					doPaste);
		} else {
			doPaste();
		}
	},
	doPaste : function(clipText, col, row) {
		if (clipText == null) {
			return;
		}
		var rows = [];
		var lineFeed = "\r\n";
		if (COM.Util.browser.ff) {
			lineFeed = "\n";
		}
		rows = clipText.split(lineFeed);
		if (rows.length > 0) {
			var last = rows[rows.length - 1];
			if (!last) {
				rows.splice(rows.length - 1, 1);
			}
		}

		var height = rows.length;
		var width = 0;
		var temp;
		for (var i = 0, max = rows.length; i < max; i++) {
			temp = rows[i];
			rows[i] = temp.split('\t');
			width = Math.max(width, rows[i].length);
		}
		var rowCount = this.getRowCount();
		var colCount = this.getColCount();
		var cell;
		var controller;
		for (var i = 0, max = rows.length; i < max && i + row < rowCount; i++) {
			if (this.isIgnoreHidden() && !this.isRowVisible(i)) {
				continue;
			}
			temp = rows[i];
			for (var j = 0, j_max = temp.length; j < j_max
					&& j + col < colCount; j++) {
				if (this.isIgnoreHidden() && !this.isColVisible(i)) {
					continue;
				}
				cell = this.getCell(j + col, i + row);
				if (cell) {
					if (this.editPart.canEdit(cell)) {
						cell.editText = temp[j];
						cell.showText = temp[j];
						controller = this.getCellController(j + col, i + row);
						if (cell.figure) {
							cell.figure.setText(cell.showText);
							cell.figure.repaint();
						}
					}
				}
			}

		}
		this.fireEvent(COM.widget.Grid.Event.DATA_CHANGE, {
					'rect' : {
						'x' : col,
						'y' : row,
						'width' : j,
						'height' : i
					},
					'cause' : COM.widget.Grid.CAUSE_PASTE
				});
		this.fireEvent(COM.widget.Grid.Event.PASTED, {
					'rect' : {
						'x' : col,
						'y' : row,
						'width' : j,
						'height' : i
					}
				});
	},
	changeSelection : function(oldSelection, newSelection, button) {
		var result = {
			'doit' : 1
		};
		this.fireEvent(COM.widget.Grid.Event.SELECTION_CHANGE, {
					'oldSelection' : oldSelection.getCopy(),
					'newSelection' : newSelection.getCopy(),
					'result' : result
				});
		if (result.doit) {

		}
		this.editPart.setSelection(newSelection);
		this.editPart.showSelectionHandle();
		this.editPart.setCurrentCell(newSelection.x, newSelection.y, {
					'type' : COM.widget.Grid.CAUSE_MOUSE,
					'value' : button
				});
	},
	fireEvent : function(type, e) {
		if (this.grid) {
			this.grid.fireEvent(type, e);
		}

	},
	/**
	 * 设置某个单元格的鼠标样式
	 */
	setCellCursor : function(col, row, cursor) {
		var cell = this.getCell(col, row);
		if (!cell || cell.cursor == cursor) {
			return;
		}
		cell.cursor = cursor;
		if (cell.figure) {
			cell.figure.setCursor(cursor);
		}
	},
	setColHeadCursor : function(cursor) {
		var max = this.getRowCount();
		for (var i = 0; i < max; i++) {
			this.setCellCursor(0, i, cursor);
		}
		this.colHeadCursor = cursor;
	},
	setRowHeadCursor : function(cursor) {
		var max = this.getColCount();
		for (var i = 0; i < max; i++) {
			this.setCellCursor(i, 0, cursor);
		}
		this.rowHeadCursor = cursor;
	},
	getColHeadCursor : function() {
		return this.colHeadCursor;
	},
	getRowHeadCursor : function() {
		return this.rowHeadCursor;
	},
	getCursorProvider : function() {
		return this;
	},
	setEnabled : function(enabled) {
		if (this.enabled == enabled) {
			return;
		}
		this.enabled = enabled;
		this.editPart.onEnabledChanged(this.enabled);
	},
	isEnabled : function() {
		return this.enabled;
	},
	// 动画
	setShowInsDelAnimation : function(show) {
		this.showInsDelAnimation = show;
	},
	isShowInsDelAnimation : function() {
		return this.showInsDelAnimation;
	},
	getHeadStyle : function() {
		return this.data.headStyle;
	},
	// 是否可修改行列高宽
	isAdvancedResize : function() {
		return this.data.options.advancedResize;
	},
	setRowRowResizeable : function(row, value) {
		var rowData = this.getRow(row);
		if (null != rowData) {
			rowData.rowResizeable = value;
		}
	},
	setRowColResizeable : function(row, value) {
		var rowData = this.getRow(row);
		if (null != rowData) {
			rowData.colResizeable = value;
		}
	},
	setColColResizeable : function(col, value) {
		var colData = this.getCol(col);
		if (null != colData) {
			colData.colResizeable = value;
		}
	},
	setColRowResizeable : function(col, value) {
		var colData = this.getCol(col);
		if (null != colData) {
			colData.rowResizeable = value;
		}
	},
	isRowRowResizeable : function(row) {
		var rowData = this.getRow(row);
		if (null != rowData) {
			return rowData.rowResizeable;
		}
	},
	isRowColResizeable : function(row) {
		var rowData = this.getRow(row);
		if (null != rowData) {
			return rowData.colResizeable;
		}
	},
	isColColResizeable : function(col) {
		var colData = this.getCol(col);
		if (null != colData) {
			return colData.colResizeable;
		}
	},
	isColRowResizeable : function(col) {
		var colData = this.getCol(col);
		if (null != colData) {
			return colData.rowResizeable;
		}
	},
	setCellEditorId : function(col, row, id) {
		var cell = this.getCell(col, row);
		if (null == cell) {
			return;
		}
		if (this.editPart.isEditing()) {
			var colRow = this.editPart.getCurrentCellColRow();
			if (null != colRow && colRow.col == col && colRow.row == row
					&& id != cell.editorId) {
				this.editPart.commitEdit();
			}
		}
		cell.editorId = id;
		cell.editor = null;
	},
	dispose : function() {
		delete this.grid;
		delete this.editPart;
		delete this.defaultEditor;
		delete this.afterLoadToDo;
		delete this.selectionMover;
		delete this.colorProvider;
		delete this.cellFigureFactory;
		// dispose data
		var rows = this.data.rows;
		var cols = this.data.cols;
		try {
			for (var row = 0; row < rows.length; row++) {
				var list = this.data.cells.rowList[row];
				if (list) {
					for (var col = 0; col < cols.rows; col++) {
						var cell = list[col];
						if (cell) {
							delete cell.editor;
							delete cell.control;
							if (cell.figure && cell.figure.doDispose) {
								cell.figure.doDispose();
							}
							delete list[col];
						}
					}
					delete this.data.cells.rowList[row];
				}
			}
		} catch (e) {
			Debugger.error("dispose data faild.");
		}
		delete this.data.cells.rowList;
		delete this.data.rows;
		delete this.data.cols;
		delete this.data;
	}
});

COM.widget.Grid.GridModel.PROP_CELL = "CELL";
COM.widget.Grid.GridModel.PROP_COL_SIZE = 'col size';
COM.widget.Grid.GridModel.PROP_ROW_SIZE = 'row size';
COM.widget.Grid.GridModel.PROP_INSERT_ROW = 'insert row';
COM.widget.Grid.GridModel.PROP_INSERT_COL = 'insert col';
COM.widget.Grid.GridModel.PROP_DELETE_ROW = 'delete row';
COM.widget.Grid.GridModel.PROP_DELETE_COL = 'delete col';
COM.widget.Grid.GridModel.PROP_CELL_SHOWTEXT = 'showText';
COM.widget.Grid.GridModel.PROP_CELL_EDITTEXT = 'editText';
COM.widget.Grid.GridModel.PROP_LOAD_DATA = 'load data';
COM.widget.Grid.GridModel.copyCell = function(cell, style) {
	var result = {};

	if (style & COM.widget.Grid.COPY_CONTENT) {

		result.title = cell.title;
		result.showText = cell.showText;
		result.editText = cell.editText;
		result.cellMode = cell.cellMode;
		result.html = cell.html;
		result.treeImage = cell.treeImage;
		// result.control = cell.control;
		result.checked = cell.checked;
		result.checkable = cell.checkable;
		result.expandable = cell.expandable;
		result.expanded = cell.expanded;
		result.depth = cell.depth;
		result.isTreeEnd = cell.isTreeEnd;
	}

	if (style & COM.widget.Grid.COPY_STYLE) {
		result.editorId = cell.editorId;
		result.selectable = cell.selectable;
		result.editable = cell.editable;
		result.rowSpan = 1;
		result.colSpan = 1;
		result.backStyle = cell.backStyle;
		result.backColor = cell.backColor;
		if (cell.gradientBackground) {
			result.gradientBackground = {
				'begin' : cell.gradientBackground.begin,
				'end' : cell.gradientBackground.end,
				'direction' : cell.gradientBackground.direction
			};
		}
		if (cell.border) {
			result.border = [cell.border[0], cell.border[1], cell.border[2],
					cell.border[3]];
		} else {
			result.border = [];
		}
		if (cell.borderColor) {
			result.borderColor = [cell.borderColor[0], cell.borderColor[1],
					cell.borderColor[2], cell.borderColor[3]];
		} else {
			result.borderColor = [];
		}
		result.fontName = cell.fontName;
		result.fontSize = cell.fontSize;
		result.fontBold = cell.fontBold;
		result.fontItalic = cell.fontItalic;
		result.fontColor = cell.fontColor;
		result.textStroke = cell.textStroke;
		if (cell.textShadow) {
			result.textShadow = {
				'offsetX' : cell.offsetX,
				'offsetY' : cell.offsetY,
				'blur' : cell.blur,
				'color' : cell.color
			};
		}
		if (cell.padding != null) {
			result.padding = [];
			result.padding[0] = cell.padding[0];
			result.padding[1] = cell.padding[1];
			result.padding[2] = cell.padding[2];
			result.padding[3] = cell.padding[3];
		}
		result.wrapLine = cell.wrapLine;
		result.indent = cell.indent;
		result.horzAlign = cell.horzAlign;
		result.vertAlign = cell.vertAlign;
		result.vertText = cell.vertText;
		result.fitFontSize = cell.fitFontSize;
		result.multiLine = cell.multiLine;
		result.decoration = cell.decoration;
		result.fontSizeUnit = cell.fontSizeUnit;
		result.cellMode = COM.widget.Grid.Cell.Cell_MODE_NORMAL;
		var clientData = cell.clientData;
		result.clientData = {};
		for (var key in clientData) {
			result.clientData[key] = clientData[key];
		}

	}
	result.rowSpan = 1;
	result.colSpan = 1;
	result.merged = false;
	result.mergeInfo = null;
	return result;
}
COM.widget.Grid.GridModel.ModelReader = function() {
	this.isRowResizeable = function(colRowData) {
		if (null != colRowData) {
			return colRowData.rowResizeable;
		}
	}
	this.isColResizeable = function(colRowData) {
		if (null != colRowData) {
			return colRowData.colResizeable;
		}
	}
	return this;
}();
/**
 * @author jiangqifan
 * @since 2013-4-24
 */
COM.widget.Grid.GridEditPart = function GridEditPart() {
	COM.widget.Grid.GridEditPart.superclass.constructor.call(this);
	// 以单元格为单位
	this.scrollTopCell = 0;
	this.scrollLeftCell = 0;

	this.scrollTop = 0;
	this.scrollLeft = 0;
	this.fixedScrollTop = 0;
	this.fixedScrollLeft = 0;
	this.blankX = 0;
	this.blankY = 0;

	this.drawStartRow = 0;
	this.drawEndRow = 0;
	this.drawStartCol = 0;
	this.drawEndCol = 0;

	// this.drawCacheStartRow = 0;
	// this.drawCacheStartCol = 0;
	// this.drawCacheEndRow = 0;
	// this.drawCacheEndCol = 0;

	this.selectionHandleShowing = true;
	/**
	 * next的位置记忆 当连续按下时，遇到合并单元格，如果之前是(4,3),下方有个合并单元格(2,4,5,2),按下当前单元格变成(2,4)
	 * 再一次按下时，需要回到原来的列上去，所以下一个当前单元格应该是(4,6),而不是(2,6);
	 */
	this.goNextMemery = {};

	this.areas = [[], [], []];

	this.currentCellCol = -1;
	this.currentCellRow = -1;

	this.initCellMouseMotionListener();
	this.initCellMouseListener();
	this.initGridMouseListener();

	/**
	 * 滚动到最后一行时，如果最后一行后面留有空白，则需在前面多显示一行， 但是前面多显示的一行无法显示完整，有一部分需要被表头遮住，offsetY
	 * 就是被表头遮住的部分的高度。
	 */
	this.offsetX = 0;
	this.offsetY = 0;

	this.visible = true;
	this.disposed = false;
	// 暂时用不上
	// this.focusable = true;
};

COM.widget.Grid.GridEditPart.extend(COM.gef.AbstractGraphicalEditPart, {
	isEnabled : function() {
		return this.model.isEnabled();
	},
	onVisibleChanged : function(value) {
		if (this.visible === value) {
			return;
		}
		this.visible = value;
		// 这样做会引起画的图有问题。
		// if (value) {
		// this.getFigure().getUpdateManager().unlock();
		// this.getFigure().getUpdateManager().performUpdate();
		// } else {
		// this.getFigure().getUpdateManager().lock();
		// }
	},
	isVisible : function() {
		return this.visible;
	},
	canVisible : function() {
		return this.getViewer().width > 0 || this.getViewer().height > 0;
	},
	canFocus : function() {
		return /* this.focusable && */this.isVisible();
	},
	onEnabledChanged : function(enabled) {
		if (enabled) {
			this.hideMask();
		} else {
			this.showMask();
		}

	},
	showMask : function() {
		this.resizeMask().style.display = '';
	},
	resizeMask : function() {
		var mask = this.getMask();
		var size = this.getViewer().getSize();
		mask.style.width = size.width + 16 + 'px';
		mask.style.height = size.height + 16 + 'px';
		return mask;
	},
	hideMask : function() {
		var mask = this.getMask();
		mask.style.display = 'none';
	},
	getMask : function() {
		if (this.mask == null) {
			this.mask = document.createElement('div');
			this.mask.style.position = "absolute";
			this.mask.id = 'mask';
			this.mask.style.left = '0px';
			this.mask.style.top = '0px';
			this.mask.style.display = 'none';
			this.mask.style.backgroundColor = 'rgba(255,255,255,0.2)';
			this.mask.style.zIndex = 100;
			this.getViewer().getEditDomain().getControl()
					.appendChild(this.mask);
		}
		return this.mask;
	},
	getDragTracker : function() {
		if (this.dragTracker == null) {
			this.dragTracker = new COM.widget.Grid.GridDragTracker(this);
		}
		return this.dragTracker;
	},
	getRowCount : function() {
		return this.getModel().data.rowCount;
	},
	getColCount : function() {
		return this.getModel().data.colCount;
	},
	propertyChange : function(evt) {
		// 如果在编辑状态，先提交

		var prop = evt.getPropertyName();

		if (prop != COM.widget.Grid.GridModel.PROP_CELL_SHOWTEXT
				&& prop != COM.widget.Grid.GridModel.PROP_CELL_EDITTEXT
				&& this.isEditing()) {
			// do nothing.
		}

		this.onDataSizeChanged();

		if (prop == COM.widget.Grid.GridModel.PROP_INSERT_COL) {
			var update = this.doOnScroll(null, true);
			if (!update) {
				this.refreshVisuals_scroll();
			}
		} else if (prop == COM.widget.Grid.GridModel.PROP_INSERT_ROW) {
			var update = this.doOnScroll(null, true);
			if (!update) {
				this.refreshVisuals_scroll();
			}
		} else if (prop == COM.widget.Grid.GridModel.PROP_DELETE_COL) {
			var update = this.doOnScroll(null, true);
			if (!update) {
				this.refreshVisuals_scroll();
			}
		} else if (prop == COM.widget.Grid.GridModel.PROP_DELETE_ROW) {
			var update = this.doOnScroll(null, true);
			if (!update) {
				this.refreshVisuals_scroll();
			}
		}

		if (prop == COM.widget.Grid.GridModel.PROP_COL_SIZE) {
			this.refreshVisuals_scroll();
		} else if (prop == COM.widget.Grid.GridModel.PROP_ROW_SIZE) {
			this.refreshVisuals_scroll();
		} else if (prop == COM.widget.Grid.GridModel.PROP_LOAD_DATA) {
			this.refreshVisuals_scroll();
		}

	},
	onDataSizeChanged : function() {
		/*
		 * var width = this.getModel().getDataClientWidth(); var height =
		 * this.getModel().getDataClientHeight(); var size =
		 * this.getViewer().getSize(); this.getViewer().setSize(width, height);
		 */
		/*
		 * if (width > this.getModel().grid.width) {
		 * this.getViewer().setSize(size.width,this.getModel().grid.height -
		 * 16); } if (height > this.getModel().grid.height) {
		 * this.getViewer().setSize(this.getModel().grid.width -
		 * 16,size.height); this.getModel().performColGrab();
		 * this.freshDataClientWidth(); } var height =
		 * this.getModel().getDataClientHeight();
		 * this.freshScrollPlaceHolderSize();
		 */
		this.freshScrollPlaceHolderSize();
	},
	onSizeChanged : function() {

		this.resizeMask();
		this.freshScrollPlaceHolderSize();

	},
	freshScrollPlaceHolderSize : function() {
		if (!(this.vertiScroller && this.horizScroller)) {
			return;
		}
		var height = this.getModel().getDataClientHeight();
		var width = this.getModel().getDataClientWidth();

		var controlSize = this.getModel().getControlSize();
		var viewerSize = this.getViewer().getSize();
		var newSize = new Dimension();

		if (height <= this.vertiScroller.getSize()) {
			height = 1;
			newSize.width = controlSize.width;
			this.vertiScroller.hide();
		} else {
			height += 0/* 16 */;
			// 大小减小一个像素，避免滚动条遮住表格外面的div的边框。
			newSize.width = controlSize.width - 16 - 2;
			this.vertiScroller.show();
		}

		if (width <= this.horizScroller.getSize()) {
			width = 1;
			newSize.height = controlSize.height;
			this.horizScroller.hide();
		} else {
			width += 0/* 16 */;
			// 大小减小一个像素，避免滚动条遮住表格外面的div的边框。
			newSize.height = controlSize.height - 16 - 2;
			this.horizScroller.show();
		}

		this.horizScroller.setContentSize(width);
		this.vertiScroller.setContentSize(height);

		var viewerSizeChanged = false;
		var grabAgain = false;
		if (newSize.height != viewerSize.height) {
			viewerSizeChanged = true;
		}
		if (newSize.width != viewerSize.width) {
			viewerSizeChanged = true;
			grabAgain = true;
		}
		if (viewerSizeChanged) {
			this.getViewer().setSize(newSize.width, newSize.height);
		}
		if (grabAgain) {
			// 执行抢占
			this.getModel().performColGrab();
			// 刷新显示宽度
			this.getModel().freshDataClientWidth();
		}

	},
	// freshScrollBarSize: function () {
	// this.horizScroller.scrollBar.style.width =
	// this.getViewer().getSize().width + 16 + 'px';
	// this.vertiScroller.scrollBar.style.height =
	// this.getViewer().getSize().height + 16 + 'px';
	// },
	activate : function() {
		COM.widget.Grid.GridEditPart.superclass.activate.call(this);
		// 将model与本editpart进行关联
		this.getModel().addPropertyChangeListener(this);
		this.getModel().setEditPart(this);
		// 绑定滚动
		this.vertiScroller = this.getViewer().getScrollHelper().getVerti();
		this.horizScroller = this.getViewer().getScrollHelper().getHoriz();

		this.freshScrollPlaceHolderSize();
		// this.freshScrollBarSize();
		var that = this;
		this.vertiScroller.bindScrollListener(function(e) {
					that.onScroll(e);
				});
		this.horizScroller.bindScrollListener(function(e) {
					that.onScroll(e);
				});
		// 监听viewer的键盘事件
		this.getViewer().setKeyHandler(this);

		this.setCursorProvider(this.getModel().getCursorProvider());
		// 增加焦点收集器
		this.addFocusReceiver(this.getViewer().getControl().getElement());
		// 绑定input事件
		this.bindKeyListenerForFocusReceiver();

		// 选择管理器
		this.selectionManager = new COM.widget.Grid.GridSelectionManager(this);

		// 修改，不应使用此方式
		// TODO 考虑
		this.getViewer().getEditDomain().mouseWheelScrolled = function(e,
				viewer) {
			that.onMouseWheelScrolled(e);
		}

		// 加入resizeHandle
		// 虚拟的resizehandle来显示鼠标样式和提供resize的dragTracker
		this.addResizeHandle();
	},
	deactivate : function() {
		COM.widget.Grid.GridEditPart.superclass.deactivate.call(this);
		// 移出resizehandle
		// 移出mouseWheel
		// 移出焦点收集器
		// this.removeFocusReceiver(this.getViewer().getElement());
		// 移出viewer的键盘事件监听

		// 移出model与editpart的联系
		this.getModel().removePropertyChangeListener(this);
	},
	addResizeHandle : function() {
		if (this.isActive()) {
			for (var i = 1; i < this.policies.length; i += 2) {
				if (this.policies[i].addResizeHandle) {
					this.policies[i].addResizeHandle();
				}
			}
		}
	},
	firePaging : function(e) {
		var result = {
			doit : 1
		};
		this.fireEvent(COM.widget.Grid.Event.PAGING, {
					'origin' : e,
					'result' : result
				});
		return result.doit == COM.widget.Grid.RESULT_TRUE;
	},
	pageDown : function(e) {
		if (!this.firePaging(e)) {
			return;
		}
		var height = this.areaHeights[1];
		this.vertiScroller.setScrollTop(this.vertiScroller.getScrollTop()
				+ height);

	},
	pageUp : function(e) {
		if (!this.firePaging(e)) {
			return;
		}
		var height = this.areaHeights[1];
		this.vertiScroller.setScrollTop(this.vertiScroller.getScrollTop()
				- height);
	},
	onMouseWheelScrolled : function(e) {

		var reuslt = this.scrollVerti(e.delta < 0, 1, this.canRowVisible, this);

		/**
		 * 流加载模式
		 */
		if (this.getModel().data.options.loadMode == COM.widget.Grid.LOAD_MODE_STREAM) {
			if (this.vertiScroller.getScrollTop() == this.vertiScroller
					.getScrollTopMax()) {
				if (!this.loadCompeleted_v) {
					// this.getFigure().setLocation(new Point(0,-20));
					var result = {};
					this.lazyfireEvent(COM.widget.Grid.Event.DATA_LOAD_EVENT, {
								'byRow' : true,
								'result' : result
							});
					if (result.vdone) {
						this.loadCompeleted_v = true;
					}
				}
			}
		}
		return true;
	},
	/**
	 * 纵向滚动
	 * 
	 * @param {}
	 *            scrollDown
	 * @param {}
	 *            scrollLine
	 * @param {}
	 *            filter
	 * @param {}
	 *            filtObj
	 * @return {Boolean}
	 */
	scrollVerti : function(scrollDown, scrollLine, filter, filtObj) {
		var h = 0; // 总滚动高度
		var th; // 当行高度
		var row;
		var rowadd = 0; // 有效行（可见，对h有贡献）
		scrollLine = scrollLine || 1;
		var self = this;

		for (var i = 1; rowadd < scrollLine; i++) {
			if (scrollDown) {
				row = this.drawEndRow + i;
				if (row >= this.getRowCount()) {
					h = this.vertiScroller.getScrollHeight()
							- this.vertiScroller.getScrollTop();
					break;
				}
				/*
				 * else if (row == this.getRowCount()) { th =
				 * this.scrollHelper.scrollBar.scrollHeight -
				 * this.scrollHelper.scrollBar.scrollTop; }
				 */else
					th = this.getRowHeight(row);
			} else {
				row = this.drawStartRow - i;
				if (row < 0) {
					break;
				} else
					th = -this.getRowHeight(row);
			}
			if (this.isRowVisible(row)) {
				h += th;
			}
			if (!(filter && filtObj && !filter.call(filtObj, row))) {
				rowadd++;
			}

		}
		this.vertiScroller.setScrollTop(this.vertiScroller.getScrollTop() + h);

		return true;
	},
	/**
	 * 横向滚动
	 * 
	 * @param {}
	 *            scrollRight是否为向右滚动
	 * @param {}
	 *            scrollLine 滚动行数
	 * @param {}
	 *            filter 行过滤器，根据其返回值决定是否计入滚动行数,默认为都有效
	 */
	scrollHoriz : function(scrollRight, scrollLine, filter, filtObj) {
		var w = 0;
		var tw;
		var col;
		var coladd = 0;
		scrollLine = scrollLine || 1;

		filter = filter || this.isColVisible;
		filtObj = filtObj || this;

		for (var i = 0; coladd < scrollLine; i++) {
			if (scrollRight) {
				col = this.drawEndCol + i;
				if (col >= this.getColCount()) {
					w = this.horizScroller.getScrollWidth()
							- this.horizScroller.getScrollLeft();
					break;
				} else
					tw = this.getColWidth(col);
			} else {
				col = this.drawStartCol - i;
				if (col < 0)
					break;
				else
					tw = -this.getColWidth(col);
			}
			if (this.isColVisible(col)) {
				w += tw;
			}
			if (filter.call(filtObj, col)) {
				coladd++;
			}
		}
		this.horizScroller
				.setScrollLeft(this.horizScroller.getScrollLeft() + w);
	},
	setScrollLeft : function(value) {
		this.horizScroller.setScrollLeft(value);
	},
	getScrollLeft : function() {
		return this.horizScroller.getScrollLeft();
	},
	setScrollTop : function(value) {
		this.vertiScroller.setScrollTop(value);
	},
	getScrollTop : function() {
		return this.vertiScroller.getScrollTop();
	},
	getScrollHeight : function() {
		return this.vertiScroller.getScrollHeight();
	},
	getScrollWidth : function() {
		return this.horizScroller.getScrollWidth();
	},
	isRowVisible : function(row) {
		return !this.getModel().data.rows[row].hidden;
	},
	canRowVisible : function(row) {
		var rowData = this.getModel().data.rows[row];
		return !rowData.hidden && rowData.clientSize > 0;
	},
	isColVisible : function(col) {
		return !this.getModel().data.cols[col].hidden;
	},
	getRowHeight : function(row) {
		return this.getModel().data.rows[row].clientSize;
	},
	getColWidth : function(col) {
		return this.getModel().data.cols[col].clientSize;
	},
	getFixedScrollTop : function() {
		return this.fixedScrollTop - this.blankY;
	},
	getFixedScrollLeft : function() {
		return this.fixedScrollLeft - this.blankX;
	},
	onScroll : function(e) {
		this.defalutDoOnScroll(e);
	},
	defalutDoOnScroll : function(e) {
		var self = this;
		if (this.scrollTimer == null) {
			this.scrollTimer = setTimeout(function() {
						self.doOnScroll(e);
						self.scrollTimer = null;
					}, 10);
		} else {
			// clearTimeout(this.scrollTimer);
			// this.scrollTimer = setTimeout(function(){
			// self.doOnScroll();
			// self.scrollTimer = null;
			// },20);
		}
	},
	doOnScroll : function(e, force) {
		// console.log('begin');
		// var begin = new Date().getTime();
		// console.log(this.getModel().getDataClientHeight()+"---"+this.scrollHelper.scrollBar.scrollTopMax);
		var scrollTop = this.getScrollTop();
		var scrollLeft = this.getScrollLeft();
		var data = this.getModel().data;
		var h = 0, w = 0;
		var scrollTopCell = this.scrollTopCell;
		var scrollLeftCell = this.scrollLeftCell;
		if (scrollTop != this.scrollTop || force) {
			if (scrollTop == 0) {
				scrollTopCell = 0;
				this.fixedScrollTop = 0;
			} else {
				scrollTopCell = 0;
				// i的最大值是否为data.rowCount?
				for (var i = data.rowHeaderCount; i < data.rowCount
						- data.rowFooterCount; i++) {
					if (!data.rows[i].hidden) {
						h += data.rows[i].clientSize;
					}
					if (h >= scrollTop) {
						this.fixedScrollTop = h;
						i++;
						break;
					}
				}
				scrollTopCell = i - data.rowHeaderCount;
				scrollTopCell = Math
						.min(scrollTopCell, data.rowCount - data.rowHeaderCount
										- data.rowFooterCount - 1);
			}
			this.scrollTop = scrollTop;
		}

		if (scrollLeft != this.scrollLeft || force) {
			if (scrollLeft == 0) {
				scrollLeftCell = 0;
				this.fixedScrollLeft = 0;
			} else {
				scrollLeftCell = 0;
				for (var i = data.colHeaderCount; i < data.colCount
						- data.colFooterCount; i++) {
					if (!data.cols[i].hidden) {
						w += data.cols[i].clientSize;
					}
					if (w >= scrollLeft) {
						this.fixedScrollLeft = w;
						i++;
						break;
					}
				}
				scrollLeftCell = i - data.colHeaderCount;

				scrollLeftCell = Math
						.min(scrollLeftCell, data.colCount
										- data.colHeaderCount
										- data.colFooterCount - 1);
			}
			this.scrollLeft = scrollLeft;
		}

		var increase = false;
		var update = false;
		if (scrollTopCell != this.scrollTopCell) {
			increase = scrollTopCell > this.scrollTopCell;
			// this.fireEvent('currentCellOffsetChanged');
			update = true;
			this.scrollTopCell = scrollTopCell;
		}
		if (scrollLeftCell != this.scrollLeftCell) {
			increase = scrollLeftCell > this.scrollLeftCell;
			// this.fireEvent('currentCellOffsetChanged');
			update = true;
			this.scrollLeftCell = scrollLeftCell;
		}
		if (update) {
			this.refreshVisuals_scroll(true, increase);

		}
		if (null != e) {
			this.fireEvent(COM.widget.Grid.Event.SCROLLED, {
						'origin' : e
					});
		}

		return update;
		// this.getFigure().getUpdateManager().performUpdate();
		// var end = new Date().getTime();
		// console.log('end-total:'+(end - begin));
	},
	refreshVisuals_scroll : function(isVerti, increase) {

		// 在不可见的状态下，就直接不处理了
		// 这样做会引起画的图有问题。
		// if (!this.isVisible()) {
		// return;
		// }
		// this.eraseSelectionHandle();

		var f = this.getFigure();
		this.createFigureContent(f);
		this.refreshHandlesLocation();
		this.refreshSelectionFeedbacksLocation();

		// 如果不这样，会出现有时候被编辑的滚动条不可显示了，编辑器还在显示着。
		if (this.isEditing()) {
			if (this.currentCellCol > 0 && this.currentCellRow > 0) {
				if (this.isColCanDraw(this.currentCellCol)
						&& this.isRowCanDraw(this.currentCellRow)) {
					if (this.editorHide) {
						this
								.setEditorVisible(true,
										COM.widget.Grid.CAUSE_MOUSE);
					}
				} else {
					if (!this.editorHide) {
						this.setEditorVisible(false,
								COM.widget.Grid.CAUSE_MOUSE);
					}
				}
			}
		}
	},
	refreshHandlesLocation : function() {
		if (this.isActive()) {
			for (var i = 1; i < this.policies.length; i += 2) {
				if (this.policies[i].refreshHandlesLocation) {
					this.policies[i].refreshHandlesLocation();
				}

			}
		}
	},
	refreshSelectionFeedbacksLocation : function() {
		if (this.selectionManager) {
			this.selectionManager.freshFeedbacksLocation();
		}
	},
	refreshCurrentFigureField : function(col, row) {
		if (this.selectionManager) {
			this.selectionManager.refreshCurrentFigureField(col, row);
		}
	},
	initGridMouseListener : function() {
		var self = this;
		this.gridMouseListener = {
			mouseClicked : function(event, figure) {
				self.fireEvent(COM.widget.Grid.Event.GRID_CLICK, {
							'x' : event.x,
							'y' : event.y,
							'origin' : event.e
						});
			},
			mouseDoubleClicked : function(event, figure) {
				self.fireEvent(COM.widget.Grid.Event.GRID_DOUBLE_CLICK, {
							'x' : event.x,
							'y' : event.y,
							'origin' : event.e
						});
			}
		};

	},
	/**
	 * 初始化单元格的鼠标事件监听器
	 */
	initCellMouseMotionListener : function() {
		var self = this;
		this.cellMouseMotionListener = {
			mouseEntered : function(e, figure) {
				self.fireEvent(COM.widget.Grid.Event.CELL_MOUSE_IN, {
							'cell' : self.getCellController(figure.getCol(),
									figure.getRow()),
							'x' : e.x,
							'y' : e.y
						});
			},
			mouseExited : function(e, figure) {
				self.fireEvent(COM.widget.Grid.Event.CELL_MOUSE_OUT, {
							'cell' : self.getCellController(figure.getCol(),
									figure.getRow()),
							'x' : e.x,
							'y' : e.y
						});
			},
			mouseMoved : function(e, figure) {
				self.fireEvent(COM.widget.Grid.Event.CELL_MOUSE_MOVE, {
							'cell' : self.getCellController(figure.getCol(),
									figure.getRow()),
							'x' : e.x,
							'y' : e.y
						});
			}
		};
	},
	initCellMouseListener : function() {
		var self = this;
		this.cellMouseListener = {
			mouseClicked : function(e, figure) {
				self.fireEvent(COM.widget.Grid.Event.CELL_MOUSE_CLICK, {
							'cell' : self.getCellController(figure.getCol(),
									figure.getRow()),
							'x' : e.x,
							'y' : e.y
						});
				self.fireEvent(COM.widget.Grid.Event.GRID_CLICK, {
							'x' : e.x,
							'y' : e.y,
							'origin' : e.e
						});
			},
			mouseDoubleClicked : function(e, figure) {
				self.fireEvent(COM.widget.Grid.Event.CELL_DOUBLE_CLICK, {
							'cell' : self.getCellController(figure.getCol(),
									figure.getRow()),
							'x' : e.x,
							'y' : e.y,
							'origin' : e.e
						});
				self.fireEvent(COM.widget.Grid.Event.GRID_DOUBLE_CLICK, {
							'x' : e.x,
							'y' : e.y,
							'origin' : e.e
						});
			}
		};
	},
	createFigure : function() {
		var f = new COM.widget.Grid.GridFigure();
		// f.setBorder(new LineBorder(1));
		var self = this;
		f.addMouseListener(this.gridMouseListener);
		// f.addLayoutListener(this.getViewer().getControl());
		f
				.setControlParent(this.getViewer().getControl().getElement()/* .getEditDomain().getControl() */);
		f.setAreaSizeProvider(this);
		f.setZIndexCalculator(this);
		f.cellFigureFinder = this;
		// f.setLayoutManager(new XYLayout());
		this.createFigureContent(f);
		return f;
	},
	isLoadByRow : function() {
		return true;
	},
	/**
	 * 已支持首行、首列部分显示
	 * 
	 * 计算需要绘制的单元格范围
	 * 
	 * @param {}
	 *            layoutData
	 * @param {}
	 *            data
	 */
	calculateCanDrawArea : function(layoutData, data) {
		var h_count = 0;
		var v_count = 0;
		var temp = 0;
		var max = this.getViewer().width;
		var col = 0;
		var row = 0;
		var colData;
		var rowData;
		this.areaWidths = [];
		this.areaHeights = [];
		var self = this;
		var model = this.getModel();
		var resize = false;
		function addWidth() {
			var colData = layoutData.cols[col];
			if (self.isColVisible(col)) {
				if (data.options.loadMode != COM.widget.Grid.LOAD_MODE_NORMAL
						&& data.options.loadByRow) {
					// do nothing
				} else {
					// colData.dirty没有的时候当成true处理
					// 计算自适应行高
					if (colData.auto) {
						if (colData.dirty == null || colData.dirty) {
							if (model.calculateColSize(col)) {
								resize = true;
							}
						}
					}
				}
				temp += layoutData.cols[col].clientSize;
			}
		}
		function addHeight() {
			rowData = layoutData.rows[row];
			if (self.isRowVisible(row)) {
				if (data.options.loadMode != COM.widget.Grid.LOAD_MODE_NORMAL
						&& !data.options.loadByRow) {
					// do nothing.
				} else {
					// 计算自适应行高
					if (rowData.auto) {
						if (rowData.dirty == null || rowData.dirty) {
							if (model.calculateRowSize(row)) {
								resize = true;
							}
						}
					}
				}
				temp += rowData.clientSize;
			}
		}
		// 表头宽度
		temp = 0;
		max = this.getViewer().width;
		var count = 0;
		for (var i = 0; i < data.colHeaderCount && temp < max; i++) {
			col = i;
			count++;
			addWidth();
		}
		// 表头需要绘制的列（包括）
		this.drawHeaderColCount = count;

		this.areaWidths[0] = temp;
		temp = 0;
		// 表尾宽度
		max = this.getViewer().width - this.areaWidths[0];
		count = 0;
		for (i = data.colCount - 1; i > data.colCount - data.colFooterCount - 1
				&& temp < max; i--) {
			col = i;
			count++;
			addWidth();
		}
		// 表尾需要绘制的列（包括）
		this.drawFooterColCount = count;

		this.areaWidths[2] = temp;
		// ------------
		temp = 0;
		max = this.getViewer().width - this.areaWidths[0] - this.areaWidths[2];
		count = 0;
		// center宽度
		for (h_count = 0; h_count < data.colCount - data.colFooterCount
				- data.colHeaderCount - this.scrollLeftCell
				&& temp < max; h_count++) {
			col = h_count + data.colHeaderCount + this.scrollLeftCell;
			count++;
			addWidth();
		}
		this.drawCenterColCount = count;

		this.areaWidths[1] = Math.min(max, temp);
		// ---------------------
		temp = 0;
		count = 0;
		max = this.getViewer().height;
		// 表头高度
		for (var i = 0; i < data.rowHeaderCount && temp < max; i++) {
			row = i;
			count++;
			addHeight();
		}
		this.drawHeaderRowCount = count;
		this.areaHeights[0] = temp;
		temp = 0;
		count = 0;
		max = this.getViewer().height - this.areaHeights[0];
		// 表尾高度
		for (i = data.rowCount - 1; i > data.rowCount - data.rowFooterCount - 1
				&& temp < max; i--) {
			row = i;
			count++;
			addHeight();
		}
		this.drawFooterRowCount = count;
		this.areaHeights[2] = temp;
		//
		temp = 0;
		count = 0;
		max = this.getViewer().height - this.areaHeights[0]
				- this.areaHeights[2];
		// center高度
		for (v_count = 0; v_count < data.rowCount - data.rowFooterCount
				- data.rowHeaderCount - this.scrollTopCell
				&& temp < max; v_count++) {
			row = v_count + data.rowHeaderCount + this.scrollTopCell;
			count++;
			addHeight();
		}
		this.drawCenterRowCount = count;

		this.areaHeights[1] = Math.min(temp, max);

		if (resize) {
			this.onDataSizeChanged();
		}
		// 绘图区域(包括)
		this.drawStartRow = data.rowHeaderCount + this.scrollTopCell;
		this.drawEndRow = data.rowHeaderCount + this.scrollTopCell + v_count
				- 1;
		this.drawStartCol = data.colHeaderCount + this.scrollLeftCell;
		this.drawEndCol = data.colHeaderCount + this.scrollLeftCell + h_count
				- 1;
		// TODO
		this.footerStartCol = data.colCount - this.drawFooterColCount;
		this.footerStartRow = data.rowCount - this.drawFooterRowCount;
		// 对于滚动到最后一行的处理

		// 是否为最后一行
		// 考虑最后一行虽然已经画出来了，但是没有画完的情况
		var controlSize = this.getViewer().getSize();
		var totalHeight = this.areaHeights[0] + this.areaHeights[1]
				+ this.areaHeights[2];
		var totalWidth = this.areaWidths[0] + this.areaWidths[1]
				+ this.areaWidths[2];

		var blankY = controlSize.height - totalHeight;
		var blankX = controlSize.width - totalWidth;

		// 发生了滚动 && 当前显示了最后一行 && 最后一行显示完了还有部分空余
		if (this.drawStartRow > data.rowHeaderCount
				&& this.drawEndRow + 1 >= this.footerStartRow && blankY > 0) {

			this.areaHeights[1] += blankY;
			var upperRow = this.getUpperRow(layoutData);
			var upperRowSize = layoutData.rows[upperRow].clientSize;
			this.drawStartRow = upperRow;
			this.offsetY = upperRowSize - blankY;
			this.blankY = blankY;

		} else {
			this.offsetY = 0;
			this.blankY = 0;
		}

		if (this.drawStartCol > data.colHeaderCount
				&& this.drawEndCol + 1 >= this.footerStartCol && blankX > 0) {

			this.areaWidths[1] += blankX;
			var upperCol = this.getUpperCol(layoutData);
			this.drawStartCol = upperCol;
			var upperColSize = layoutData.cols[upperCol].clientSize;
			this.offsetX = upperColSize - blankX;
			this.blankX = blankX;

		} else {
			this.offsetX = 0;
			this.blankX = 0;
		}
	},
	/**
	 * 检查绘制范围内的数据完整性
	 * 
	 * @param {}
	 *            rowList
	 * @param {}
	 *            data
	 * @return {}
	 */
	checkDrawAreaData : function(rowList, data) {
		var list = [];
		// 检查需要显示的部分数据是否存在
		// 如果影响显示，则返回空白图形，发起timeout延时加载，加载时显示加载动画
		if (this.isLoadByRow()) {
			// 检查表头
			this.checkDataByRow(rowList, 0, data.rowHeaderCount - 1, list);
			// 检查中间
			this.checkDataByRow(rowList, this.drawStartRow, this.drawEndRow,
					list);
			// 检查表尾
			this.checkDataByRow(rowList, this.footerStartRow,
					data.rowCount - 1, list);
		} else {
			// 检查表头
			this.checkDataByCol(rowList, 0, data.colHeaderCount - 1, list);
			// 检查中间
			this.checkDataByCol(rowList, this.drawStartCol, this.drawEndCol,
					list);
			// 检查表尾
			this.checkDataByCol(rowList, this.footerStartCol,
					data.colCount - 1, list);
		}
		if (list.length > 0) {
			return list;
		}
	},
	fireAreaSizeChanged : function() {
		this.getViewer().getControl().onLayouted(this.areaWidths,
				this.areaHeights);
	},
	checkDataBeforeCreateContent : function(rowList, data) {
		var wait = false;
		var list;
		if (this.getModel().data.options.loadMode == COM.widget.Grid.LOAD_MODE_LAZY) {
			list = this.checkDrawAreaData(rowList, data);

			// 有需要加载的数据
			if (list && list.length > 0) {
				// 需要显示的部分数据不足，显示空白图形
				// this.showLoadAnimation();
				wait = true;
				this.lazyfireEvent(COM.widget.Grid.Event.DATA_LOAD_EVENT, {
							'byRow' : this.isLoadByRow(),
							'list' : list
						});
			}

		}
		return wait;
	},
	/**
	 * 已支持首行、首列部分显示
	 */

	/**
	 * 与首行部分显示相关
	 */
	getUpperRow : function(layoutData) {
		var row = this.drawStartRow;
		var rowData;
		do {
			row = row - 1;
			rowData = layoutData.rows[row];

		} while (rowData.hidden && row > 0)

		return row;
	},
	/**
	 * 与首列部分显示相关
	 */
	getUpperCol : function(layoutData) {
		var col = this.drawStartCol;
		var colData;
		do {
			col = col - 1;
			colData = layoutData.cols[col];

		} while (colData.hidden && col > 0)

		return col;
	},
	preLoad : function(data, rowList) {

		var list = [];
		var drawCacheStartRow = Math.max(this.drawStartRow - 10,
				data.rowHeaderCount);
		var drawCacheEndRow = Math.min(this.drawEndRow + 10,
				this.footerStartRow - 1);
		var drawCacheStartCol = Math.max(this.drawStartCol - 10,
				data.colHeaderCount);
		var drawCacheEndCol = Math.min(this.drawEndCol + 10,
				this.footerStartCol - 1);

		if (this.isLoadByRow()) {
			// 如果drawStartRow比drawEndRow大，就不需要预加载了
			if (this.drawStartRow <= this.drawEndRow) {
				this.checkDataByRow(rowList, drawCacheStartRow,
						this.drawStartRow, list);
				this.checkDataByRow(rowList, this.drawEndRow, drawCacheEndRow,
						list);
			}
		} else {
			// 如果drawStartCol比drawEndCol大，就不需要预加载了
			if (this.drawStartCol <= this.drawEndCol) {
				this.checkDataByCol(rowList, drawCacheStartCol,
						this.drawStartCol, list);
				this.checkDataByCol(rowList, this.drawEndCol, drawCacheEndCol,
						list);
			}
		}
		if (list && list.length > 0) {
			this.lazyfireEvent(COM.widget.Grid.Event.DATA_LOAD_EVENT, {
						'byRow' : this.isLoadByRow(),
						'list' : list
					});
		};

	},
	/**
	 * 计算单元格的大小
	 * 
	 * @param {}
	 *            cell 单元格model
	 * @param {}
	 *            layoutData 布局数据
	 * @param {Number}
	 *            col 基准列（用于计算offset）
	 * @param {Number}
	 *            row 基准行（用于计算offset）
	 * @param {}
	 *            offset
	 *            如果合并单元格有一部分被上面或左面挡住不能显示，offset.x和offset.y分别表示被挡住的部分的宽度和高度
	 * @return {}
	 */
	calculateCellSize : function(cell, layoutData, col, row, offset) {
		var width = 0;
		var height = 0;
		var i = 1;
		var index = 0;
		var end = 0;
		if (offset) {
			offset.x = 0;
			offset.y = 0;
		}
		if (cell) {
			if (cell.rowSpan > 1) {
				end = cell.rowIndex + cell.rowSpan;
				for (index = cell.rowIndex; index < end; index++) {
					if (offset) {
						if (index == row) {
							offset.y = height;
						}
						if (this.isRowVisible(index)) {
							height += layoutData.rows[index].clientSize;
						}
					} else {
						if (this.isRowCanDraw(index)) {
							height += layoutData.rows[index].clientSize;

						}
					}

				}
			} else {
				height = layoutData.rows[row].clientSize;
			}
			if (cell.colSpan > 1) {
				end = cell.colIndex + cell.colSpan;
				for (index = cell.colIndex; index < end; index++) {
					if (offset) {
						if (index == col) {
							offset.x = width;
						}
						if (this.isColVisible(index)) {
							width += layoutData.cols[index].clientSize;
						}
					} else {
						if (this.isColCanDraw(index)) {
							width += layoutData.cols[index].clientSize;
						}
					}
				}
			} else {
				width = layoutData.cols[col].clientSize;
			}
		} else {
			width = layoutData.cols[col].clientSize;
			height = layoutData.rows[row].clientSize;
		}
		return {
			'width' : width,
			'height' : height
		};
	},

	isRowCanDraw : function(row) {
		return this.isRowVisible(row) && this.isRowInDraw(row);
	},
	isRowInDraw : function(row, layoutData, data) {
		return (row > 0 && row < this.data.rowHeaderCount)
				|| (row >= this.drawStartRow && row <= this.drawEndRow)
				|| (row >= this.data.rowCount - this.data.rowFooterCount && row < this.data.rowCount);
	},
	isColCanDraw : function(col) {
		return this.isColVisible(col) && this.isColInDraw(col);
	},
	isColInDraw : function(col) {
		return (col > 0 && col < this.data.colHeaderCount)
				|| (col >= this.drawStartCol && col <= this.drawEndCol)
				|| (col >= this.data.colCount - this.data.colFooterCount && col < this.data.colCount);

	},
	// 按行来检查数据的完整性
	checkDataByRow : function(rowList, begin, end, rects) {
		var beginLoad = begin;
		var endLoad = null;
		for (var i = begin; i <= end; i++) {
			if (rowList[i] != null && rowList[i + 1] == null) {
				beginLoad = i + 1;
			}
			if (rowList[i] == null && (rowList[i + 1] != null || i == end)) {
				endLoad = i;
				rects.push({
							'begin' : beginLoad,
							'end' : endLoad
						});
			}
		}

	},
	// 按列来检查数据的完整性
	checkDataByCol : function(rowList, begin, end, rects) {
		var beginLoad = begin;
		var endLoad = null;
		var row = rowList[0];
		if (!row) {
			rects.push({
						'begin' : begin,
						'end' : end
					});
			return;
		}
		for (var i = begin; i < end; i++) {
			if (row[i] != null && row[i + 1] == null) {
				beginLoad = i + 1;
			}
			if (row[i] == null && (row[i + 1] != null || i == end - 1)) {
				endLoad = i;
				rects.push({
							'begin' : beginLoad,
							'end' : endLoad
						});
			}
		}

	},

	createFigureByModel : function(model, col, row) {
		if (model == null) {
			// 没有找到数据的话，就构造一个空白图形
			var cellFigure = this.getCellFigurFactory().create(null);// new
			// COM.widget.Grid.CellFigure(col,row);
			cellFigure.setBorderStyle([1, 1]);
			cellFigure.setBorderColor(['#D0D7E5', '#D0D7E5']);
			// cellFigure.setText('loading');
			cellFigure.setColorProvider(this.getColorProvider());
			cellFigure.setFontSize(12);
			return cellFigure;
		}
		if (model.figure) {
			model.figure.setVisible(!model.merged);
			return model.figure;
		}
		var figure = this.getCellFigurFactory().create(model);

		figure.treeListener = this;
		// 合并的子元素提供器，为合并单元格的图形提供子单元格信息
		// 接口包括：
		// getCell(col,row);
		// getRow(row);
		// getCol(col);

		figure.mergeChildProvider = this.getModel();

		// 标题栏是否被选中以及标题栏的鼠标样式
		if (col == 0 || row == 0) {
			if (this.selectionManager) {
				if (col == 0) {
					if (this.selectionManager.hasSelectionInRow(row)) {
						figure.setSelected(true);
					}
				} else {
					if (this.selectionManager.hasSelectionInCol(col)) {
						figure.setSelected(true);
					}
				}
			}
			if (this.cursorProvider && figure) {
				if (col == 0) {
					figure.setCursor(this.cursorProvider.getRowHeadCursor());
				} else if (row == 0) {
					figure.setCursor(this.cursorProvider.getColHeadCursor());
				}
			}
		}
		/*
		 * var figure; if (col == 0 || row == 0) { figure =
		 * this.getCellFigurFactory().createHeadFigure(model); if
		 * (this.selectionManager) { if (col == 0) { if
		 * (this.selectionManager.hasSelectionInRow(row)) {
		 * figure.setSelected(true); } } else { if
		 * (this.selectionManager.hasSelectionInCol(col)) {
		 * figure.setSelected(true); } } } if (this.cursorProvider && figure) {
		 * if (col == 0) {
		 * figure.setCursor(this.cursorProvider.getRowHeadCursor()); } else if
		 * (row == 0) {
		 * figure.setCursor(this.cursorProvider.getColHeadCursor()); } } } else {
		 * figure = this.getCellFigurFactory().createNormalFigure(model); }
		 * figure.treeListener = this;
		 * 
		 * figure.setColorProvider(this.getColorProvider());
		 * figure.setRowSpan(model.rowSpan); figure.setColSpan(model.colSpan); //
		 * mode figure.setCellMode(model.cellMode);
		 * 
		 * switch (model.cellMode) { case COM.widget.Grid.Cell.Cell_MODE_CONTROL :
		 * if (model.control) { figure.setControl(model.control); } break; case
		 * COM.widget.Grid.Cell.Cell_MODE_HTML : if (model.html) {
		 * figure.setHtml(model.html); } break; case
		 * COM.widget.Grid.Cell.Cell_MODE_TREE :
		 * figure.setExpandable(model.expandable)
		 * .setCheckable(model.checkable).setDepth(model.depth || 0); if
		 * (model.expandable) { figure.setExpanded(model.expanded); } if
		 * (model.checkable) { figure.setChecked(model.checked); } if
		 * (model.treeImage) { var treeImage =
		 * ImageResourceManager.getImage(this
		 * .getModel().grid.getImageUrlById(model.treeImage))
		 * figure.setTreeImage(treeImage); } case
		 * COM.widget.Grid.Cell.Cell_MODE_NORMAL : // backImage if
		 * (model.backImage) { var backimage =
		 * ImageResourceManager.getImage(this
		 * .getModel().grid.getImageUrlById(model.backImage));
		 * figure.setBackImage(backimage);
		 * figure.setBackImageStyle(model.backImageStyle);
		 * figure.setBackImageHorizion(model.backImageHorizion);
		 * figure.setBackImageVertical(model.backImageVertical); var bounds =
		 * model.backImageBounds; if (bounds) { figure.setBackImageBounds({ x :
		 * bounds.x, y : bounds.y, width : bounds.width, height : bounds.height
		 * }); } }
		 *  // content
		 * 
		 * if (model.colIndex == 0 && model.rowIndex != 0 && model.showText ==
		 * null) { figure.setText(model.rowIndex + ''); } else if
		 * (model.rowIndex == 0 && model.colIndex != 0 && model.showText ==
		 * null) { figure.setText(COM.Util.Common.to26Str(model.colIndex - 1)); }
		 * else { figure.setText(model.showText); }
		 *  } //align if (model.colIndex == 0 && model.rowIndex != 0 &&
		 * model.showText == null) { figure.setHorzAlign(model.horzAlign ||
		 * COM.widget.Grid.Cell.ALIGN.CENTER) .setVertAlign(model.vertAlign ||
		 * COM.widget.Grid.Cell.ALIGN.CENTER) } else if (model.rowIndex == 0 &&
		 * model.colIndex != 0 && model.showText == null) {
		 * figure.setHorzAlign(model.horzAlign ||
		 * COM.widget.Grid.Cell.ALIGN.CENTER) .setVertAlign(model.vertAlign ||
		 * COM.widget.Grid.Cell.ALIGN.CENTER) } else {
		 * figure.setHorzAlign(model.horzAlign) .setVertAlign(model.vertAlign); } //
		 * font figure.setFontName(model.fontName).setFontSize(model.fontSize)
		 * .setFontColor(model.fontColor) .setFontBold(model.fontBold)
		 * .setFontItalic(model.fontItalic)
		 * .setWrapLine(model.wrapLine).setIndent(model.indent)
		 * .setIndentPx(model.indentPx) .setVertText(model.vertText)
		 * .setFitFontSize(model.fitFontSize) .setMultiLine(model.multiLine)
		 * .setTextShadow(model.textShadow) .setTextStroke(model.textStroke)
		 * .setFontSizeUnit(model.fontSizeUnit)
		 * .setDecoration(model.decoration); // 背景颜色和边框，所有模式的单元格都需要显示
		 *  // back var rowData = this.data.rows[model.rowIndex]; //行背景色不影响表头 if
		 * (rowData.color && model.rowIndex > 0 && model.colIndex > 0) {
		 * figure.setBackColor(rowData.color);
		 * figure.setBackStyle(COM.widget.Grid.Cell.BACK_STYLE.FILL); } if
		 * (model.backStyle) { figure.setBackStyle(model.backStyle); } if
		 * (model.backColor && model.backColor.length > 0) {
		 * figure.setBackColor(model.backColor); } if (model.gradientBackground) {
		 * figure.setGradientBackground(model.gradientBackground); }
		 *  // border figure.setBorderStyle(model.border);
		 * figure.setBorderColor(model.borderColor); if (model.padding) {
		 * figure.setPadding(new Insets(model.padding[0], model.padding[1],
		 * model.padding[2], model.padding[3])); }
		 * 
		 * if (model.title) { figure.setToolTip(model.title); }
		 */

		figure.setVisible(!model.merged);
		model.figure = figure;
		figure.model = model;
		figure.addMouseMotionListener(this.cellMouseMotionListener);
		var self = this;
		figure.addMouseListener(this.cellMouseListener);
		figure.addListener('ControlResizeListener', this);
		figure.addListener('ControlArrivedListener', this);
		return figure;

	},
	controlArrived : function(figure) {

		var cellController = this.getCellController(figure.getCol(), figure
						.getRow());
		this.fireControlArrived(cellController);

	},

	fireControlArrived : function(cellController) {

		this.fireEvent(COM.widget.Grid.Event.CONTROL_ARRIVED, {
					'cell' : cellController
				});

	},
	controlResized : function(figure, width, height) {
		var cellController = this.getCellController(figure.getCol(), figure
						.getRow());
		var result = {
			doit : 1
		};
		this.fireEvent(COM.widget.Grid.Event.CONTROL_RESIZE, {
					'cell' : cellController,
					'size' : {
						'width' : width,
						'height' : height
					},
					'result' : result
				});
		if (result.doit) {
			figure.setControlSize(width, height);
		}
	},
	getCellFigurFactory : function() {
		return this.getModel().getCellFigureFactory();
	},
	createEditPolicies : function() {
		this.installEditPolicy('resize', new COM.widget.Grid.GridPolicy());
		this.installEditPolicy('colExchange',
				new COM.widget.Grid.ColExchangePolicy());
		this.installEditPolicy('selection',
				new COM.widget.Grid.SelectionPolicy());
		this.installEditPolicy('selectionChange',
				new COM.widget.Grid.SelectionChangePolicy());
	},

	getCellFigureByLocation : function(x, y) {
		return this.getFigure().getCellFigureByLocation(x, y);
	},

	getColRow : function(x, y) {
		return this.getFigure().getColRow(x, y);
	},
	getCellFigure : function(x, y) {
		var colRow = this.getRealColRow(x, y);
		var cell = this.getCell(colRow.col, colRow.row);
		if (cell != null && cell.merge) {
			cell = this.getCell(cell.mergeInfo.col, cell.mergeInfo.row);
		}
		return cell.figure;
	},
	/**
	 * 已支持首行、首列部分显示
	 * 
	 * 根据位置获取行列值
	 * 
	 * @param {}
	 *            x
	 * @param {}
	 *            y
	 * @return {}
	 */
	getRealColRow : function(x, y) {
		var col;
		var row;
		var i = -1;
		var cos = this.data.cols;
		var rows = this.data.rows;
		var temp = 0;
		var widths = this.areaWidths;
		var heights = this.areaHeights;
		if (x < widths[0]) {

			while (temp < x && i < this.data.colHeaderCount) {
				if (!cos[++i].hidden) {
					temp += cos[i].clientSize;
				}
			}
			col = i;
		} else if (x < widths[0] + widths[1]) {
			// 处理滚动到最后一列时的修正
			temp = this.getStartX();
			i = this.drawStartCol - 1;
			while (temp < x && i < this.drawEndCol) {
				if (!cos[++i].hidden) {
					temp += cos[i].clientSize;
				}
			}
			col = i;
		} else if (temp < widths[0] + widths[1] + widths[2]) {
			// widths[0] + widths[1]是表尾第一列的开始位置
			temp = widths[0] + widths[1];
			i = this.footerStartCol - 1;
			while (temp < x && i < this.data.colCount) {
				if (!cos[++i].hidden) {
					temp += cos[i].clientSize;
				}
			}
			col = i;
		}

		temp = 0;
		i = -1;
		if (y < heights[0]) {

			while (temp < y && i < this.data.rowHeaderCount) {
				if (!rows[++i].hidden) {
					temp += rows[i].clientSize;
				}
			}
			row = i;
		} else if (y < heights[0] + heights[1]) {
			// 处理滚动至最后一行时的修正
			temp = this.getStartY();
			i = this.drawStartRow - 1;
			while (temp < y && i < this.drawEndRow) {
				if (!rows[++i].hidden) {
					temp += rows[i].clientSize;
				}
			}
			row = i;
		} else if (temp < heights[0] + heights[1] + heights[2]) {
			// heights[0] + heights[1]为表尾行的其实Y坐标
			temp = heights[0] + heights[1];
			i = this.footerStartRow - 1;
			while (temp < y && i < this.data.rowCount) {
				if (!rows[++i].hidden) {
					temp += rows[i].clientSize;
				}
			}
			row = i;
		}
		return {
			'col' : col,
			'row' : row
		};
	},
	/**
	 * 已支持首列、首行部分显示
	 * 
	 * 获取单元格的边界
	 * 
	 * @param {}
	 *            col
	 * @param {}
	 *            row
	 * @return {}
	 */
	getRealCellBounds : function(col, row) {
		var x;
		var y;
		var cols = this.data.cols;
		var rows = this.data.rows;

		var width = cols[col].clientSize;
		var height = rows[row].clientSize;
		if (!this.isColVisible(col)) {
			width = 0;
		}
		if (!this.isRowVisible(row)) {
			height = 0;
		}
		x = this.getRealColBegin(col);
		y = this.getRealRowBegin(row);
		return new Rectangle(x, y, width, height);
	},
	getStartX : function() {
		return this.areaWidths[0] - this.offsetX;
	},
	getStartY : function() {
		return this.areaHeights[0] - this.offsetY;
	},
	/**
	 * 已支持首列部分显示
	 */
	getRealColBegin : function(col) {
		var i = 0;
		var x = 0;
		var cols = this.data.cols;
		var width = cols[col].clientSize;
		var widths = this.areaWidths;
		var temp = 0;
		if (col < this.data.colHeaderCount) {
			i = 0;
			while (i < col) {
				if (!cols[i].hidden) {
					temp += cols[i].clientSize;
				}
				i++;
			}
			x = temp;
		} else if (col < this.drawStartCol) {
			temp = this.getStartX();
			i = this.drawStartCol - 1;
			while (i >= col) {
				if (!cols[i].hidden) {
					temp -= cols[i].clientSize;
				}
				i--;
			}
			x = temp;
		} else if (col < this.footerStartCol) {
			temp = this.getStartX();
			i = this.drawStartCol;
			while (i < col) {
				if (!cols[i].hidden) {
					temp += cols[i].clientSize;
				}
				i++;
			}
			x = temp;
		} else if (col < this.data.colCount) {
			temp = widths[0] + widths[1];
			i = this.footerStartCol;
			while (i < col) {
				if (!cols[i].hidden) {
					temp += cols[i].clientSize;
				}
				i++;
			}
			x = temp;
		} else {
			x = 0;
		}
		return x;
	},
	/**
	 * 已支持首行部分显示
	 */
	getRealRowBegin : function(row) {
		var i = 0;
		var y = 0;
		var temp = 0;
		var rows = this.data.rows;
		var height = rows[row].clientSize;
		var heights = this.areaHeights;
		if (row < this.data.rowHeaderCount) {
			i = 0;
			while (i < row) {
				if (!rows[i].hidden) {
					temp += rows[i].clientSize;
				}
				i++;
			}
			y = temp;
		} else if (row < this.drawStartRow) {
			temp = this.getStartY();
			i = this.drawStartRow - 1;
			while (i >= row) {
				if (!rows[i].hidden) {
					temp -= rows[i].clientSize;
				}
				i--;
			}
			y = temp;
		} else if (row < this.footerStartRow) {
			temp = this.getStartY();
			i = this.drawStartRow;
			while (i < row) {
				if (!rows[i].hidden) {
					temp += rows[i].clientSize;
				}
				i++;
			}
			y = temp;
		} else if (row < this.data.rowCount) {
			temp = heights[0] + heights[1];
			i = this.footerStartRow;
			while (i < row) {
				if (!rows[i].hidden) {
					temp += rows[i].clientSize;
				}
				i++;
			}
			y = temp;
		} else {
			y = 0;
		}
		return y;
	},

	// ************************************当 前 单 元 格 相 关 开
	// 始*******************************
	getCurrentCell : function() {
		var cellController = this.getCellController(this.currentCellCol,
				this.currentCellRow);
		return cellController;
	},
	getCurrentCellColRow : function() {
		var c = {
			'col' : this.currentCellCol,
			'row' : this.currentCellRow
		};
		return c;
	},

	/**
	 * 设置成功返回true, 新的当前单元格与之前的当前单元格相同，返回null 设置失败，返回false
	 * 
	 * @lazyReval 延迟进行reval操作，避免双击显示了一般的单元格引起的问题(双击的单元格与当前单元格不同)。
	 */

	setCurrentCell : function(col, row, cause, memery, lazyReval,
			noFireChanging) {
		// 检查数据
		if (col == null || col >= this.data.colCount) {
			col = -1;
		}
		if (row == null || row >= this.data.rowCount) {
			row = -1;
		}

		if (this.currentCellCol === col && this.currentCellRow === row) {
			// 滚动
			if (col >= 0 && row >= 0) {
				if (!lazyReval) {

					this.reval(col, row);
				} else {
					// 可能在点击时的currentCellChanged事件里面去setCurrent
					this.revalTimeout = setTimeout(this.getLazyReval(), 400);
				}
			}
			// 设置相同的当前单元格，视为成功，但不视为当前单元格改变
			// 因为需要取消默认事件，不然input会获取不到焦点,导致两次点击相同单元格后无法通过直接输入来编辑
			// 例外：如果这个单元格里放了一个text控件，那个如果取消了默认事件会导致控件里的文本无法选择
			if (isNormalCell(this.currentCellCol, this.currentCellRow, this
							.getModel())) {
				return true;
			} else {
				return;
			}
		}
		function isNormalCell(col, row, provider) {
			if (col > -1 && row > -1) {
				var cell = provider.getCell(col, row);
				if (null != cell) {
					return cell.cellMode == COM.widget.Grid.Cell.Cell_MODE_NORMAL;
				}
			}
		}

		// 当前单元格改变之前发送事件
		if (!cause.noFireChanging) {
			var result = {};
			result.doit = COM.widget.Grid.RESULT_TRUE;
			this.fireEvent(COM.widget.Grid.Event.CURRENT_CELL_CHANGING, {
						'col' : col,
						'row' : row,
						'result' : result,
						'cause' : cause
					});
			if (result.doit != COM.widget.Grid.RESULT_TRUE) {
				return false;
			}
		}
		cause.noFireChanging = null;

		// 在设置当前单元格之前先提交编辑状态下的单元格
		if (this.isEditing()) {
			this.commitEdit(cause ? cause.type : null);
		}

		Debugger.log("set Current Cell: " + col + ',' + row);
		// 修改当前单元格
		this.goNextMemery = memery;
		// 滚动
		if (col >= 0 && row >= 0) {
			if (!lazyReval) {

				this.reval(col, row);
			} else {
				// 可能在点击时的currentCellChanged事件里面去setCurrent
				this.revalTimeout = setTimeout(this.getLazyReval(), 400);
			}
		}
		this.performSetCurrentCell(col, row);

		// 避免先选择一个不可编辑的单元格输入了值在选择可编辑的单元格进行输入时出现的问题
		this.clearInputCache();

		// 当前单元格改变之后发送事件
		this.fireEvent(COM.widget.Grid.Event.CURRENT_CELL_CHANGED, {
					'col' : (col == null ? -1 : col),
					'row' : (row == null ? -1 : row),
					'cause' : cause
				});

		this.focus();

		return true;
	},
	/**
	 * 清空input中之前输入的值
	 */
	clearInputCache : function() {
		var foucsReceiver = this.getFocusReceiver();
		foucsReceiver.clearValue();
	},
	getLazyReval : function() {
		var self = this;
		return function() {
			self.reval(self.currentCellCol, self.currentCellRow);
			self.revalTimeout = null;
		}
	},
	/**
	 * 设置当前单元格（ 包含数据检查） 在延迟加载的情况下使用，可延迟当前单元格的设置
	 * 
	 * @param {}
	 *            col
	 * @param {}
	 *            row
	 * @param {}
	 *            cause
	 */
	setCurrentCellWidthDataCheck : function(col, row, cause) {
		var cell = this.getCell(col, row);
		var self = this;
		if (cell) {
			this.setCurrentCell(col, row, cause);
		} else {
			if (col > 0 && row > 0 && col < this.getModel().getColCount()
					&& row < this.getModel().getRowCount()) {
				this.getModel().addTingsToDoAtferLoad('setCurrentCell',
						function() {
							var cell = self.getCell(col, row);
							if (cell) {
								self.setCurrentCell(col, row, cause);
								return true;
							}
							return false;
						});
			}
		}
	},
	performSetCurrentCell : function(col, row) {
		this.clearCurrentCell();
		var cell = this.getCell(col, row);
		var width = 1;
		var height = 1;
		if (cell) {
			width = cell.colSpan || 1;
			height = cell.rowSpan || 1;
		}
		// if (cell && cell.selectable ){
		// //此句不可删除，否在在异步加载的情况下，设置还未加载的单元格为当前单元格会失效
		// cell.current = true;
		// if (cell.figure) {
		// cell.figure.setCurrent(true);
		// cell.figure.repaint();
		// if (this.getModel().isCurrenCellBorderHidden()) {
		// cell.figure.setBorderHidden(true);
		// }
		// }
		// }
		this.currentCellCol = col;
		this.currentCellRow = row;
		this.selectionManager.setCurrentCell(col, row, width, height);
	},
	clearCurrentCell : function() {
		// if (this.currentCellCol != null && this.currentCellRow != null) {
		// var oldCell = this.getCell(this.currentCellCol,this.currentCellRow);
		// if (oldCell && oldCell.figure) {
		// oldCell.figure.setCurrent(false);
		// oldCell.figure.repaint();
		// oldCell.figure.setBorderHidden(false);
		// }
		// }
	},
	// ************************************当 前 单 元 格 相 关 结
	// 束*******************************

	// ************************************选 择 相 关 开
	// 始****************************************
	select : function(rect, notAdjust) {
		this.selectionManager.select(rect, notAdjust);
	},
	clearSelection : function() {
		this.selectionManager.clearSelection();
	},
	setSelections : function(rectArray, notAdjust) {
		this.selectionManager.setSelections(rectArray, notAdjust);
	},
	setSelectionsWidthDataCheck : function(rectArray, notAdjust) {
		var rowList = this.data.cells.rowList;
		var self = this;
		if (rowList.length > 0) {
			this.selectionManager.setSelections(rectArray, notAdjust);
		} else {
			this.getModel().addTingsToDoAtferLoad('setSelections', function() {
						self.selectionManager.setSelections(rectArray,
								notAdjust);
						return true;
					});
		}
	},
	setSelection : function(selection, notAdjust) {
		this.selectionManager.setSelection(selection, notAdjust);
	},
	addSelection : function(rect, notAdjust) {
		this.selectionManager.addSelection(rect, notAdjust);
	},
	getSelections : function() {
		return this.selectionManager.getSelections();
	},
	getSelection : function() {
		return this.selectionManager.getSelection();
	},
	getSelectionCols : function() {
		return this.selectionManager.getSelectionCols();
	},
	getSelectionRows : function() {
		return this.selectionManager.getSelectionRows();
	},

	// ********************选择区域的行列高亮相关开始************************************

	getSelectionCols : function() {
		return this.selectionManager.getSelectionCols();
	},
	getSelectionRows : function() {
		return this.selectionManager.getSelectionRows();
	},

	// ********************选择区域的行列高亮相关结束************************************
	focus : function() {
		if (!this.canFocus()) {
			return;
		}
		if (this.selectionManager.currentFigure) {
			if (!this.selectionManager.currentFigure.focus) {
				this.selectionManager.currentFigure.focus = true;
				this.selectionManager.currentFigure.repaint();
			}
		}
		// this.getViewer().getControl().focus();
		this.focusReceiver.focus();
	},
	blur : function() {
		if (this.selectionManager.currentFigure) {
			if (this.selectionManager.currentFigure.focus) {
				this.selectionManager.currentFigure.focus = false;
				this.selectionManager.currentFigure.repaint();
			}
		}
		// this.getViewer().getControl().blur();
		this.focusReceiver.blur();
	},
	getSelectionColor : function() {
		return this.getModel().getSelectionColor();
	},
	getCol : function(col) {
		return this.getModel().data.cols[col];
	},
	getRow : function(row) {
		return this.getModel().data.rows[row];
	},
	getCell : function(col, row) {
		return this.getModel().getCell(col, row);
	},
	getCellController : function(col, row) {
		return this.getModel().getCellController(col, row);
	},
	showSelectionHandle : function() {
		// TODO 是否显示选择框，选择框颜色
		if (this.isActive()) {
			for (var i = 1; i < this.policies.length; i += 2) {
				if (this.policies[i].showSelection) {
					this.policies[i].showSelection();
				}

			}
		}
		this.selectionHandleShowing = true;
	},
	eraseSelectionHandle : function() {
		if (this.isActive()) {
			for (var i = 1; i < this.policies.length; i += 2) {
				if (this.policies[i].hideSelection) {
					this.policies[i].hideSelection();
				}

			}
		}
		this.selectionHandleShowing = false;
	},
	/**
	 * 已支持首行、首列部分显示
	 * 
	 * 根据行列的高度和宽度信息来计算某个区域的位置和显示位置，返回值为这个区域的显示位置，innerBounds为这个区域的逻辑位置
	 * 
	 * @param {}
	 *            rect
	 * @param {}
	 *            innerBounds
	 * @return {}
	 */
	getCellAreaBounds : function(rect, innerBounds) {
		if (this.isDisposed()) {
			throw 'you cant call adiposed editpart!';
		}
		var data = this.getModel().data;
		var figure = this.getFigure();
		var area = rect;
		var startCol = area.x;
		var startRow = area.y;
		var endCol = area.right() - 1;
		var endRow = area.bottom() - 1;
		if (endCol < 0) {
			endCol == data.colCount;
		}
		if (endRow < 0) {
			endRow == data.rowCount;
		}

		var top = 0;
		var left = 0;
		var right = 0;
		var bottom = 0;
		var outer_top = 0;
		var outer_left = 0;
		var outer_right = 0;
		var outer_bottom = 0;

		var bounds = null;
		var endPoint = null;
		var viewportEndCol = data.colCount - data.colFooterCount;
		var viewportEndRow = data.rowCount - data.rowFooterCount;

		var widths = this.areaWidths;
		var heights = this.areaHeights;

		bounds = this.getRealCellBounds(startCol, startRow);
		// figure.translateToAbsolute(bounds);
		// left
		if (startCol >= data.colHeaderCount && startCol < this.drawStartCol) {
			left = widths[0] - 10;
			outer_left = widths[0];
		} else if (startCol == this.drawStartCol) {
			left = bounds.x;
			outer_left = widths[0];
		} else if (startCol > this.drawEndCol && startCol < this.footerStartCol) {
			left = widths[0] + widths[1] - 10;
			outer_left = widths[0] + widths[1];
		} else {
			left = bounds.x;
			outer_left = bounds.x;
		}
		// top
		if (startRow >= data.rowHeaderCount && startRow < this.drawStartRow) {
			top = heights[0] - 10;
			outer_top = heights[0];
		} else if (startRow == this.drawStartRow) {
			top = bounds.y;
			outer_top = heights[0];
		} else if (startRow > this.drawEndRow && startRow < this.footerStartRow) {
			top = heights[0] + heights[1] - 10;
			outer_top = heights[0] + heights[1];
		} else {
			top = bounds.y;
			outer_top = bounds.y;
		}

		/*
		 * var cell = this.getCell(endCol,endRow); if (cell.merged) { cell =
		 * this.getCell(cell.mergeInfo.col,cell.mergeInfo.row); } figure =
		 * cell.figure; bounds = figure.getBounds().getCopy();
		 * figure.translateToAbsolute(bounds);
		 */
		bounds = this.getRealCellBounds(endCol, endRow);

		// right
		if (endCol >= data.colHeaderCount && endCol < this.drawStartCol) {
			right = widths[0] + 10;
			outer_right = widths[0];
		} else if (endCol > this.drawEndCol && endCol < this.footerStartCol) {
			right = widths[0] + widths[1] + 10;
			outer_right = widths[0] + widths[1];
		} else {
			right = bounds.right();
			if (endCol < this.footerStartCol) {
				outer_right = Math.min(right, widths[0] + widths[1])
			} else {
				outer_right = right;
			}
		}

		// bottom
		if (endRow >= data.rowHeaderCount && endRow < this.drawStartRow) {
			bottom = heights[0] + 10;
			outer_bottom = heights[0];
		} else if (endRow > this.drawEndRow && endRow < this.footerStartRow) {
			bottom = heights[0] + heights[1] + 10;
			outer_bottom = heights[0] + heights[1];
		} else {
			bottom = bounds.bottom();
			if (endRow < this.footerStartRow) {
				outer_bottom = Math.min(bottom, heights[0] + heights[1]);
			} else {
				outer_bottom = bottom;
			}
		}

		innerBounds.x = left;
		innerBounds.y = top;
		innerBounds.width = right - left;
		innerBounds.height = bottom - top;

		bounds = new Rectangle();
		bounds.x = outer_left;
		bounds.y = outer_top;
		bounds.width = outer_right - outer_left;
		bounds.height = outer_bottom - outer_top;
		return bounds;
	},
	/**
	 * 根据cell figure的位置计算某个区域的位置和显示位置，返回值为这个区域的显示位置，innerBounds为这个区域的逻辑位置 未使用
	 * 
	 * @param {}
	 *            rect
	 * @param {}
	 *            innerBounds
	 * @return {}
	 */
	getSelectionBounds : function(innerBounds, rect) {
		var data = this.getModel().data;
		var figure = this.getFigure();
		var area = rect || this.getSelections()[0];
		var startCol = area.x;
		var startRow = area.y;
		var endCol = area.right() - 1;
		var endRow = area.bottom() - 1;
		if (endCol < 0) {
			endCol == data.colCount;
		}
		if (endRow < 0) {
			endRow == data.rowCount;
		}

		var top = 0;
		var left = 0;
		var right = 0;
		var bottom = 0;
		var outer_top = 0;
		var outer_left = 0;
		var outer_right = 0;
		var outer_bottom = 0;

		var bounds = null;
		var endPoint = null;
		var viewportEndCol = data.colCount - data.colFooterCount;
		var viewportEndRow = data.rowCount - data.rowFooterCount;

		var widths = this.areaWidths;
		var heights = this.areaHeights;

		var cell = this.getCell(startCol, startRow);
		if (cell != null) {
			figure = cell.figure;
		}
		if (figure == null) {
			bounds = new Rectangle();
		} else {
			bounds = figure.getBounds().getCopy();
			figure.translateToAbsolute(bounds);
		}
		// left
		if (startCol >= data.colHeaderCount && startCol <= this.drawStartCol) {
			left = widths[0] - 10;
			outer_left = widths[0];
		} else if (startCol > this.drawEndCol && startCol < this.footerStartCol) {
			left = widths[0] + widths[1] - 10;
			outer_left = widths[0] + widths[1];
		} else {
			left = bounds.x;
			outer_left = bounds.x;
		}
		// top
		if (startRow >= data.rowHeaderCount && startRow <= this.drawStartRow) {
			top = heights[0] - 10;
			outer_top = heights[0];
		} else if (startRow > this.drawEndRow && startRow < this.footerStartRow) {
			top = heights[0] + heights[1] - 10;
			outer_top = heights[0] + heights[1];
		} else {
			top = bounds.y;
			outer_top = bounds.y;
		}

		cell = this.getCell(endCol, endRow);
		figure = null;

		if (cell && cell.merged) {
			cell = this.getCell(cell.mergeInfo.col, cell.mergeInfo.row);
		}
		if (cell) {
			figure = cell.figure;
			bounds = figure.getBounds().getCopy();
			figure.translateToAbsolute(bounds);
		}

		// right
		if (endCol >= data.colHeaderCount && endCol < this.drawStartCol) {
			right = widths[0] + 10;
			outer_right = widths[0];
		} else if (endCol > this.drawEndCol && endCol < this.footerStartCol) {
			right = widths[0] + widths[1] + 10;
			outer_right = widths[0] + widths[1];
		} else {
			right = bounds.right();
			if (endCol < this.footerStartCol) {
				outer_right = Math.min(right, widths[0] + widths[1])
			} else {
				outer_right = right;
			}
		}

		// bottom
		if (endRow >= data.rowHeaderCount && endRow < this.drawStartRow) {
			bottom = heights[0] + 10;
			outer_bottom = heights[0];
		} else if (endRow > this.drawEndRow && endRow < this.footerStartRow) {
			bottom = heights[0] + heights[1] + 10;
			outer_bottom = heights[0] + heights[1];
		} else {
			bottom = bounds.bottom();
			if (endRow < this.footerStartRow) {
				outer_bottom = Math.min(bottom, heights[0] + heights[1]);
			} else {
				outer_bottom = bottom;
			}
		}

		innerBounds.x = left;
		innerBounds.y = top;
		innerBounds.width = right - left;
		innerBounds.height = bottom - top;

		bounds = new Rectangle();
		bounds.x = outer_left;
		bounds.y = outer_top;
		bounds.width = outer_right - outer_left;
		bounds.height = outer_bottom - outer_top;
		return bounds;

	},
	// *******************************************选 择 相 关 结
	// 束************************************

	// **********************************************编 辑 相 关 开
	// 始*****************************
	editCurrentCell : function(cause) {
		// 如果为只读模式，则不能编辑
		if (this.getEditMode() == COM.widget.Grid.EDIT_MODE_READ_ONLY) {
			return;
		}
		if (this.isEditing()) {
			return;
		}
		if (this.currentCellCol > 0 && this.currentCellRow > 0) {
			this.reval(this.currentCellCol, this.currentCellRow);
			var cell = this.getCell(this.currentCellCol, this.currentCellRow);
			var cellController = this.getCellController(this.currentCellCol,
					this.currentCellRow);
			if (!cell
					|| (!cell.editable && this.getEditMode() != COM.widget.Grid.EDIT_MODE_EDIT)
					|| cell.cellMode == COM.widget.Grid.Cell.Cell_MODE_CONTROL
					|| cell.cellMode == COM.widget.Grid.Cell.Cell_MODE_HTML) {
				return;
			}
			var editorId;
			var editor;
			var bounds;
			var result = {
				'doit' : 1,
				'add' : 1
			};
			if ((cell.editorId == null || "" == cell.editorId)
					&& cell.editor == null) {
				cell.editorId = this.getModel().getDefaultEditorId();
				cell.editor = this.getModel().getDefaultEditor();
			}
			var zIndex = this.getZIndex(this.currentCellCol,
					this.currentCellRow);
			var editorParent = this.getViewer().getEditDomain().getControl();
			// 发送打开编辑器事件，可以在此时根据单元格的编辑器id设置编辑器，并设置编辑器的值
			this.fireEvent(COM.widget.Grid.Event.EDITOR_OPEN, {
						'cell' : cellController,
						'cause' : cause,
						'result' : result,
						'zIndex' : zIndex,
						'editorParent' : editorParent
					});
			// 清空input
			this.clearInputCache();
			//
			editor = cell.editor;
			if (!editor) {
				editor = this.getDefaultEditor();
			}

			if (result.add) {
				// 为当前编辑器设置层级
				editor.style.zIndex = zIndex;
				// 将当前编辑器加入到DOM结构中
				editorParent.appendChild(editor);
				this.fireControlArrived(cellController);

			}
			if (result.doit) {
				if (cell.editText != null) {
					editor.value = cell.editText;
				} else {
					editor.value = null;
				}
			}
			// 记录当前编辑器
			this.activeEditorId = cell.editorId;
			this.activeEditor = editor;
			this.editCol = this.currentCellCol;
			this.editRow = this.currentCellRow;

			// 将编辑状态设置true
			this.editing = true;

			// 获取单元格边界
			bounds = cell.figure.getBounds().getCopy();
			cell.figure.translateToAbsolute(bounds);

			// 定位
			result = {
				doit : 1
			};
			this.fireEvent(COM.widget.Grid.Event.EDITOR_LOCATE, {
						'cell' : cellController,
						'result' : result,
						'location' : {
							'x' : bounds.x,
							'y' : bounds.y
						}
					});
			if (result.doit) {
				editor.style.top = bounds.y + 'px';
				editor.style.left = bounds.x + 'px';
			}

			// figureMoved，在图形位置发生变化时通知当前编辑器
			cell.figure.addFigureListener(this);

			// 改变大小
			result = {
				doit : 1
			};
			this.fireEvent(COM.widget.Grid.Event.EDITOR_RESIZE, {
						'cell' : cellController,
						'result' : result,
						'size' : {
							'width' : bounds.width,
							'height' : bounds.height
						}
					});
			if (result.doit) {
				editor.style.width = bounds.width - 1 + 'px';
				editor.style.height = bounds.height - 3 + 'px';
			}

			this.eraseSelectionHandle();

			// 显示
			var clearShow = this.showEditor(cellController, editor, cause);

			// 清空文本，放置关闭编辑器之前又显示出编辑前的文本
			if (clearShow == true) {
				cell.figure.setText("");
			}
		}

	},
	resizeEditor : function() {
		if (this.isEditing()) {
			var cellController = this.getCurrentCell();
			var result = {
				doit : 1
			};
			var cell = this.getCell(this.currentCellCol, this.currentCellRow);
			var bounds = cell.figure.getBounds().getCopy();
			this.fireEvent(COM.widget.Grid.Event.EDITOR_RESIZE, {
						'cell' : cellController,
						'result' : result,
						'size' : {
							'width' : bounds.width,
							'height' : bounds.height
						}
					});
			if (result.doit) {
				var editor = this.activeEditor;
				editor.style.width = bounds.width - 1 + 'px';
				editor.style.height = bounds.height - 3 + 'px';
			}
		}
	},
	canEdit : function(cell) {
		if (!cell
				|| (this.getEditMode() === COM.widget.Grid.EDIT_MODE_READ_ONLY)
				|| (!cell.editable && this.getEditMode() != COM.widget.Grid.EDIT_MODE_EDIT)
				|| cell.cellMode == COM.widget.Grid.Cell.Cell_MODE_CONTROL
				|| cell.cellMode == COM.widget.Grid.Cell.Cell_MODE_HTML) {
			return false;
		}
		return true;
	},
	/**
	 * 当前单元格发生了移动，需要移动编辑器
	 * 
	 * @param {}
	 *            figure
	 */
	figureMoved : function(figure) {

		if (this.currentCellCol != null && this.currentCellRow != null) {
			// 获取当前单元格
			var data = this.getModel().data;
			var cell = this.getCell(this.currentCellCol, this.currentCellRow);
			var cellController = this.getCellController(this.currentCellCol,
					this.currentCellRow);
			// 获取位置
			var location = figure.getLocation();
			figure.translateToAbsolute(location);
			// 发送事件
			var result = {
				'doit' : 1
			}
			this.fireEvent(COM.widget.Grid.Event.EDITOR_LOCATE, {
						'cell' : cellController,
						'result' : result,
						'location' : {
							'x' : location.x,
							'y' : location.y
						}
					});
			// 执行默认操作
			if (result.doit) {
				this.getActiveEditor().style.top = location.y + 'px';
				this.getActiveEditor().style.left = location.x + 'px';
			}
		}
	},
	getActiveEditorId : function() {
		return this.activeEditorId;
	},
	getActiveEditor : function() {
		return this.activeEditor;
	},
	/*
	 * clearText: function (rect) { debugger; var cell; for (var i = rect.y; i<rect.height;
	 * i++) { for (var j = rect.x; j < rect.width; j++) { cell =
	 * this.getCell(j,i); cell.editText = ''; cell.showText = ''; if
	 * (cell.figure) { cell.figure.setText(''); cell.figure.repaint(); } } } },
	 */
	tryCommitEdit : function(cause) {
		if (this.isEditing()) {
			this.commitEdit(cause);
		}
	},
	// 关闭编辑状态、保存编辑数据
	/**
	 * 考虑是否在一个时机把编辑器移除掉。
	 * 
	 * @param {}
	 *            cause
	 */
	commitEdit : function(cause) {
		if (this.editCol > 0 && this.editRow > 0 && this.activeEditor) {
			// 获取当前单元格
			var cell = this.getCell(this.editCol, this.editRow);
			var cellController = this.getCellController(this.editCol,
					this.editRow);
			var editorId;
			var bounds;
			var result = {
				doit : 1
			};
			// 移出监听器，不再监听图形位置变化
			cell.figure.removeFigureListener(this);

			// 隐藏编辑器
			this.hideEditor(cellController, this.activeEditor, cause);

			// 关闭编辑器
			result = {
				doit : 1
			};
			this.fireEvent(COM.widget.Grid.Event.EDITOR_CLOSE, {
						'cell' : cellController,
						'result' : result,
						'cause' : cause
					});
			if (result.doit) {
				cellController.setEditText(this.activeEditor.value);
				cellController.setShowText(this.activeEditor.value);
			}

			// 清除当前编辑器的记录
			this.activeEditorId = null;
			this.activeEditor = null;

			// 判断是否引起高或列宽发生变化
			var rowData = this.getRow(this.editRow);
			var rowChanged = false;
			var colChanged = false;
			if (rowData.auto) {
				rowChanged = this.getModel().calculateRowSize(this.editRow);
			}
			var colData = this.getCol(this.editCol);
			if (colData.auto) {
				colChanged = this.getModel().calculateColSize(this.editCol);
			}
			// 如果有行高或列宽发生变化，需要重新布局绘制整个表格
			if (rowChanged || colChanged) {
				this.freshScrollPlaceHolderSize();
				this.refreshVisuals_scroll();
			}
			// 发送单元格数据发生变化
			// 所有关闭编辑器引起的dataChange都认为是INPUT导致的
			var cause = COM.widget.Grid.CAUSE_INPUT;
			this.fireEvent(COM.widget.Grid.Event.DATA_CHANGE, {
						'rect' : {
							'x' : this.editCol,
							'y' : this.editRow,
							'width' : 1,
							'height' : 1
						},
						'cause' : cause
					});
		}
		this.editing = false;
	},
	isEditing : function() {
		return this.editing;
	},
	getDefaultEditor : function() {
		if (this.defaultEditor == null) {
			var ele = document.createElement('input');
			ele.id = "gridtexteditor";
			ele.style.overflow = "hidden";
			// ele.style.display = "none";
			// 使用display时，会引起comboPanle编辑器无法打开的问题
			ele.style.visibility = "hidden";
			ele.style.textAlign = "left";
			ele.style.position = "absolute";
			ele.style.borderStyle = "none";
			ele.style.zIndex = 10;
			var self = this;
			COM.Util.EventRegister.addEvent(ele, 'keydown', function(event) {
						var currKey = event.keyCode || event.which
								|| event.charCode;
						if (currKey == 13) {
							self.performKeyEnter();
						}
					});
			this.defaultEditor = ele;
		}
		return this.defaultEditor;
	},
	setEditorVisible : function(visible, cause) {

		var editor = this.getActiveEditor();

		if (!editor) {
			return;
		}
		var cell = this.getCell(this.currentCellCol, this.currentCellRow);
		if (!visible) {

			editor.style.left = '-10000px';
			this.editorHide = true;
		} else {
			if (cell.figure) {
				var bounds = cell.figure.getBounds();
				cell.figure.translateToAbsolute(bounds);
				editor.style.left = bounds.x + 'px';
			}
			this.editorHide = false;
		}

		// var cellController =
		// this.getCellController(this.currentCellCol,this.currentCellRow);
		// if (visible) {
		// this.showEditor(cellController, editor, cause);
		// } else {
		// this.hideEditor(cellController, editor , cause);
		// }

	},
	hideEditor : function(cellController, editor, cause) {
		var result = {
			doit : 1
		};
		this.fireEvent(COM.widget.Grid.Event.EDITOR_HIDE, {
					'cell' : cellController,
					'result' : result,
					'cause' : cause
				});
		if (result.doit) {
			editor.style.visibility = 'hidden';
			// editor.style.display = "none";
			editor.style.background = "";//编辑器隐藏将将样式设为默认
		}
		this.editorHide = true;
	},
	showEditor : function(cellController, editor, cause) {
		// clearShow控制是否需要在显示编辑器之后擦除显示在界面上的原来的文本.
		var result = {
			doit : 1,
			clearShow : 1
		};
		this.fireEvent(COM.widget.Grid.Event.EDITOR_SHOW, {
					'cell' : cellController,
					'result' : result,
					'cause' : cause
				});
		if (result.doit) {
			editor.style.visibility = 'visible';
			// editor.style.display = "";
			editor.focus();
			// editor.select();
		}
		this.editorHide = false;

		return result.clearShow;
	},
	fireEvent : function(type, e) {
		if (this.getModel().grid) {
			this.getModel().grid.fireEvent(type, e);
		}
	},
	lazyfireEvent : function(type, e) {
		if (this.timer) {
			clearTimeout(this.timer);
		}
		var grid = this.getModel().grid;
		this.timer = setTimeout(function() {
					grid.fireEvent(type, e);
				}, 100);
	},
	onExpandClicked : function(col, row, me) {
		this.setCurrentCell(col, row, {
					'type' : COM.widget.Grid.CAUSE_MOUSE,
					'value' : me.button
				});
		this.select(new Rectangle(col, row, 1, 1));
		var cell = this.getCell(col, row);
		var controller = this.getCellController(col, row);
		var origin = me ? me.e : null;
		if (cell.expanded) {
			this.fireEvent(COM.widget.Grid.Event.CELL_COLLAPSE, {
						'cell' : controller,
						'origin' : origin
					});
		} else {
			this.fireEvent(COM.widget.Grid.Event.CELL_EXPAND, {
						'cell' : controller,
						'origin' : origin
					});
		}
	},
	onCheckStateChanged : function(col, row, checked, e) {
		this.setCurrentCell(col, row, {
					'type' : COM.widget.Grid.CAUSE_MOUSE
				});
		this.select(new Rectangle(col, row, 1, 1));
		var cell = this.getCell(col, row);
		cell.checked = checked;
		var controller = this.getCellController(col, row);
		this.fireEvent(COM.widget.Grid.Event.CELL_CHECKED, {
					'cell' : controller,
					'checked' : checked,
					'origin' : e
				});
	},

	// isVisible: function (col,row) {
	// if (col > data.colHeaderCount && col < this.drawStartCol || col >
	// this.drawEndCol && col < data.colCount - data.colFooterCount) {
	// return false;
	// }
	// if (row > data.rowHeaderCount && row < this.drawStartRow || row >
	// this.drawEndRow && row < data.rowCount - data.rowFooterCount) {
	// return false;
	// }
	// return true;
	// },

	isHeader : function(col, row) {
		var data = this.getModel().data;
		return col < data.colHeaderCount || row < data.rowHeaderCount;
	},

	isFooter : function(col, row) {
		var data = this.getModel().data;
		return col > data.colCount - data.colFooterCount
				|| row > data.rowCount - data.rowFooterCount;
	},

	showColExchangeFeedBack : function(source, target, delta) {
		if (this.isActive()) {
			for (var i = 1; i < this.policies.length; i += 2) {
				if (this.policies[i].showColExchangeFeedBack) {
					this.policies[i].showColExchangeFeedBack(source, target,
							delta);
				}

			}
		}
	},

	goNext : function(dire, passReadOnly) {
		var localPassReadOnly = passReadOnly;
		if (null == localPassReadOnly) {
			localPassReadOnly = this.getModel().isPassReadOnly();
		}

		var colRow = this.calculateNext(dire, this.currentCellCol,
				this.currentCellRow, localPassReadOnly);
		if (colRow == null) {
			return;
		}
		var col = colRow.col;
		var row = colRow.row;

		// ajustMergeCell
		cell = this.getCell(col, row);

		if (cell.merged) {
			var memery = {};
			memery.col = col;
			memery.row = row;
			col = cell.mergeInfo.col;
			row = cell.mergeInfo.row;
		}

		this.setCurrentCell(col, row, {
					'type' : COM.widget.Grid.CAUSE_KEY
				}, memery);
		this.select(new Rectangle(col, row, 1, 1));
		this.fireEvent(COM.widget.Grid.Event.SELECTION);
	},
	calculateNext : function(dire, oldcol, oldrow, passReadOnly) {

		var col = oldcol;
		var row = oldrow;

		var cell = this.getCell(col, row);

		if (dire == null) {
			dire = this.getModel().getEnterNext();
		}

		switch (dire) {
			case COM.widget.Grid.ENTER_NEXT_UP :
				// 记忆校正
				if (this.goNextMemery) {
					col = this.goNextMemery.col;
				}

				// 寻找下一个可选择的单元格
				do {
					if (row <= 1) {

						// 如果到第一行，则焦点移到前一列最后一行的单元格

						if (col <= 1) {
							return;
						}
						this.setScrollTop(this.getScrollHeight());
						row = this.data.rowCount - 1;
						do {
							col--;
						} while (col > 1 && !this.isColVisible(col));

						this._scrollAfterGoLeft(col, row);
					} else {
						row--;
					}
					cell = this.getCell(col, row);
					if (cell.merged) {
						row = cell.mergeInfo.row;
						cell = this.getCell(cell.mergeInfo.col,
								cell.mergeInfo.row);
					}
				} while (!cell.selectable || (!cell.editable && passReadOnly)
						|| !this.isRowVisible(row))

				// 界面滚动
				this._scrollAfterGoUp(col, row);
				break;
			case COM.widget.Grid.ENTER_NEXT_LEFT :
				if (this.goNextMemery) {
					row = this.goNextMemery.row;
				}
				do {
					if (col <= 1) {

						if (row <= 1) {
							return;
						}
						this.setScrollLeft(this.getScrollWidth());

						col = this.data.colCount - 1;
						do {
							row--;
						} while (row > 1 && !this.isRowVisible(row));

						this._scrollAfterGoUp(col, row);
					} else {
						col--;
					}
					cell = this.getCell(col, row);
					if (cell.merged) {
						col = cell.mergeInfo.col;
						cell = this.getCell(cell.mergeInfo.col,
								cell.mergeInfo.row);
					}
				} while (!cell.selectable || (!cell.editable && passReadOnly)
						|| !this.isColVisible(col))

				this._scrollAfterGoLeft(col, row);

				break;
			case COM.widget.Grid.ENTER_NEXT_DOWN :
				if (this.goNextMemery) {
					col = this.goNextMemery.col;
				}
				do {
					row = row + (cell.rowSpan || 1);
					if (row >= this.data.rowCount) {
						row = 1;
						do {
							col++;
						} while (col < this.data.colCount
								&& !this.isColVisible(col));

						if (col >= this.data.colCount) {
							return;
						}
						this.setScrollTop(0);
						this._scrollAfterGoRight(col, row);
					}
					cell = this.getCell(col, row);
					if (cell.merged) {
						cell = this.getCell(cell.mergeInfo.col,
								cell.mergeInfo.row);
					}
				} while (!cell.selectable || (!cell.editable && passReadOnly)
						|| !this.isRowVisible(row))

				this._scrollAfterGoDown(col, row);

				break;
			case COM.widget.Grid.ENTER_NEXT_RIGHT :
				if (this.goNextMemery) {
					row = this.goNextMemery.row;
				}
				do {
					col = col + (cell.colSpan || 1);
					if (col >= this.data.colCount) {
						col = 1;
						do {
							row++;
						} while (row < this.data.rowCount
								&& !this.isRowVisible(row));

						if (row >= this.data.rowCount) {
							return;
						}
						this.setScrollLeft(0);
						this._scrollAfterGoDown(col, row);
					}
					cell = this.getCell(col, row);
					if (cell.merged) {
						cell = this.getCell(cell.mergeInfo.col,
								cell.mergeInfo.row);
					}
				} while (!cell.selectable || (!cell.editable && passReadOnly)
						|| !this.isColVisible(col))

				this._scrollAfterGoRight(col, row);

				break;

			case COM.widget.Grid.ENTER_NEXT_NONE :
			default :
				return null;
		}

		return {
			'col' : col,
			'row' : row
		};

	},

	_scrollAfterGoUp : function(col, row) {

		if (row < this.drawStartRow && row >= this.data.rowHeaderCount) {
			this.scrollVerti(false, this.drawStartRow - row);
		} else if (row < this.footerStartRow && row >= this.drawEndRow) {
			this.setScrollTop(this.getScrollHeight());
		}

	},
	_scrollAfterGoDown : function(col, row) {

		if (row < this.footerStartRow && row >= this.drawEndRow) {
			this.scrollVerti(true, row - this.drawEndRow + 1);
		} else if (row < this.drawStartRow && row >= this.data.rowHeaderCount) {
			this.setScrollTop(0);
		}
	},
	_scrollAfterGoLeft : function(col, row) {

		if (col < this.drawStartCol && col >= this.data.colHeaderCount) {
			this.scrollHoriz(false, this.drawStartCol - col);
		} else if (col < this.footerStartCol && col >= this.drawEndCol) {
			this.setScrollLeft(this.getScrollWidth());
		}
	},
	_scrollAfterGoRight : function(col, row) {

		if (col <= this.footerStartCol && col >= this.drawEndCol) {
			this.scrollHoriz(true, col - this.drawEndCol + 1);
		} else if (col < this.drawStartCol && col >= this.data.colHeaderCount) {
			this.setScrollLeft(0);
		}
	},
	/**
	 * 目前在setCurrentCell成功和editCurrentCell里面会调用reval.
	 */
	reval : function(col, row) {
		// 取消滚动事件的默认处理
		var defalutDoOnScroll = this.defalutDoOnScroll;

		this.defalutDoOnScroll = function() {
		};

		//
		var cell = this.getCell(col, row);
		var span;
		var i;
		// 合并单元格矫正
		if (cell) {
			if (cell.merged) {
				col = cell.mergeInfo.col;
				row = cell.mergeInfo.row;
				cell = this.getCell(col, row);
				span = {
					'rowSpan' : cell.rowSpan,
					'colSpan' : cell.colSpan
				};
			}
		} else {
			var mergeCells = this.data.mergeCells;
			var merge;
			var result;
			for (i = 0; i < mergeCells.length; i++) {
				merge = mergeCells[i];
				if ((merge.col == col && merge.row == row)
						|| ((col >= merge.col && col < merge.col + merge.width) && (row >= merge.row && row < merge.row
								+ merge.height))) {
					result = merge;
					break;
				}
			}
			if (result) {
				col = result.col;
				row = result.row;
				span = {
					'rowSpan' : result.height,
					'colSpan' : result.width
				};
			} else {
				span = {
					'rowSpan' : 1,
					'colSpan' : 1
				};
			}
		}

		// 计算单元格bounds
		var bounds;
		if (cell && cell.figure && cell.figure.getParent() == this.getFigure()) {
			// 正在显示的单元格
			bounds = cell.figure.getBounds();

		} else {
			var x = this.getRealColBegin(col);
			var y = this.getRealRowBegin(row);
			var size = null;
			var layoutData = {
				'cols' : this.data.cols,
				'rows' : this.data.rows
			};
			if (cell) {
				size = this.calculateCellSize(cell, layoutData, col, row);
			} else {
				size = {
					'width' : 0,
					'height' : 0
				};
				for (i = col, max = col + span.colSpan; i < max; i++) {
					if (this.isColVisible(col)) {
						size.width += layoutData.cols[i].clientSize;
					}
				}
				for (i = row, max = row + span.rowSpan; i < max; i++) {
					if (this.isRowVisible(row)) {
						size.height += layoutData.rows[i].clientSize;
					}
				}
			}
			bounds = new Rectangle(x, y, size.width, size.height);
		}

		// 进行凸显

		// 显示区大小数据
		var widths = this.areaWidths;
		var heights = this.areaHeights;
		var rightLimit = widths[0] + widths[1];
		var bottomLimit = heights[0] + heights[1];
		var newCol = -1;
		var newRow = -1;
		if (bounds.x < widths[0] && col >= this.data.colHeaderCount) {
			// 左边未显示全
			newCol = col;

		} else if (bounds.right() > rightLimit && col < this.footerStartCol) {
			// 右边未显示全

			// 只有在需要聚焦的单元格不是当前显示的第一列时，才执行聚焦
			if (this.drawStartCol < col) {
				var width = this.areaWidths[1];
				var w = 0;
				for (var first = col; first >= this.data.colHeaderCount; first--) {
					if (!this.data.cols[first].hidden) {
						w += this.data.cols[first].clientSize;
					}
					if (w > width) {
						first++;
						break;
					}
					if (first == col) {
						break;
					}
				}
				newCol = first;
			}

		}
		if (bounds.y < heights[0] && row >= this.data.rowHeaderCount) {
			// 上边未显示全
			newRow = row;
		} else if (bounds.bottom() > bottomLimit && row < this.footerStartRow) {
			// 下边未显示全

			// 只有在需要聚焦的单元格不是当前显示的第一行时，才执行聚焦
			if (this.drawStartRow < row) {
				var height = this.areaHeights[1];
				var h = 0;
				for (var first = row; first >= this.data.rowHeaderCount; first--) {
					if (!this.data.rows[first].hidden) {
						h += this.data.rows[first].clientSize;
					}
					if (h > height) {
						first++;
						break;
					}
				}
				newRow = first;
			}

		}
		if (newCol > 0) {
			var w = 0;
			for (var i = this.data.colHeaderCount; i < newCol
					&& i < this.data.colCount; i++) {
				if (!this.data.cols[i].hidden) {
					w += this.data.cols[i].clientSize;
				}
			}
			this.horizScroller.setScrollLeft(w);
		}
		if (newRow > 0) {
			var h = 0;
			for (var i = this.data.rowHeaderCount; i < newRow
					&& i < this.data.rowCount; i++) {
				if (!this.data.rows[i].hidden) {
					h += this.data.rows[i].clientSize;
				}
			}
			this.vertiScroller.setScrollTop(h);
		}
		// 立即处理滚动
		this.doOnScroll();

		// 恢复滚动事件默认处理
		this.defalutDoOnScroll = defalutDoOnScroll;
	},
	onDeletePressed : function() {
		if (this.getEditMode() == COM.widget.Grid.EDIT_MODE_READ_ONLY) {
			return;
		}
		var force = (this.getEditMode() == COM.widget.Grid.EDIT_MODE_EDIT);
		var selections = this.getSelections();
		if (selections) {
			for (var i = 0; i < selections.length; i++) {
				this.getModel().clearText(selections[i],
						COM.widget.Grid.CAUSE_DELETE, force);
			}
		}
	},
	// key
	keyDown : function(e) {
		if (!this.isEnabled()) {
			return;
		}
		var currKey = e.keyCode || e.which || e.charCode;

		// if (e.target != document.body && currKey != 13) {
		// return;
		// }

		var result = {
			'doit' : COM.widget.Grid.RESULT_TRUE
		};
		this.fireEvent(COM.widget.Grid.Event.KEY_DOWN_EVENT, {
					'origin' : e,
					'result' : result
				});

		if (result.doit != COM.widget.Grid.RESULT_TRUE) {
			return;
		}

		if (e.ctrlKey) {
			if (currKey == 67) {
				this.copy();
				this.preventDefault(e);
			} else if (currKey == 86) {
				this.paste(this.currentCellCol, this.currentCellRow);
				this.preventDefault(e);
			} else if (currKey == 88) {
				this.cut();
				this.preventDefault(e);
			}
		} else {

			switch (currKey) {
				case 13 : // enter
					this.performKeyEnter();
					break;
				case 37 : // left
					this.performKeyDirection(COM.widget.Grid.ENTER_NEXT_LEFT);
					break;
				case 38 : // up
					this.performKeyDirection(COM.widget.Grid.ENTER_NEXT_UP);
					break;
				case 39 : // right
					this.performKeyDirection(COM.widget.Grid.ENTER_NEXT_RIGHT);
					break;
				case 40 : // down
					this.performKeyDirection(COM.widget.Grid.ENTER_NEXT_DOWN);
					break;
				case 46 : // delete
					this.onDeletePressed();
					break;
				case 33 : // page up
					this.pageUp(e);
					break;
				case 34 : // page down
					this.pageDown(e);
					break;
				default :
					// if (this.allowInput(e)) {
					// if (!this.isEditing()) {
					// this.editCurrentCell({'type':COM.widget.Grid.CAUSE_KEY,'value':currKey});
					// }
					// }
			}
		}

	},
	preventDefault : function(e) {
		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
	},
	keyPressed : function(e) {
		return;
		if (!this.isEnabled()) {
			return;
		}
		var currKey = e.keyCode || e.which || e.charCode;

		Debugger.log('keypress:' + String.fromCharCode(currKey));
		// if (e.target != document.body && currKey != 13) {
		// return;
		// }
		var result = {
			'doit' : COM.widget.Grid.RESULT_TRUE
		};
		this.fireEvent(COM.widget.Grid.Event.KEY_PRESS_EVENT, {
					'origin' : e,
					'result' : result
				});
		if (result.doit != COM.widget.Grid.RESULT_TRUE) {
			return;
		}

		if (this.allowInput(e)) {
			if (!this.isEditing()) {
				var cell = this.getCell(this.currentCellCol,
						this.currentCellRow);
				if (cell && this.canEdit(cell)) {
					if (e.preventDefault) {
						e.preventDefault();
					} else {
						e.returnValue = false;
					}
					this.editCurrentCell({
								'type' : COM.widget.Grid.CAUSE_KEY,
								'value' : currKey
							});
				}
			}
		}
	},
	/**
	 * 键盘输入值为正常的可输入值
	 * 
	 * @param {}
	 *            e
	 * @return {Boolean}
	 */
	allowInput : function(e) {
		if (e.ctrlKey || e.shiftKey || e.altKey) {
			return false;
		}
		var currKey = e.keyCode || e.which || e.charCode;
		switch (currKey) {
			case 13 :
			case 37 :
			case 38 :
			case 39 :
			case 40 :
				return false;
			default :
				;
		}
		return true;
	},
	keyReleased : function() {
		if (!this.isEnabled()) {
			return;
		}
	},
	performKeyEnter : function() {
		// if (this.isEditing()) {
		// this.commitEdit(COM.widget.Grid.CAUSE_KEY);
		// }
		if (this.currentCellCol > -1 && this.currentCellRow > -1) {
			this.goNext();
		}
	},
	performKeyDirection : function(direction) {
		// if (this.isEditing()) {
		// this.commitEdit(COM.widget.Grid.CAUSE_KEY);
		// }
		if (this.currentCellCol > -1 && this.currentCellRow > -1) {
			this.goNext(direction, false);
		}
	},
	copy : function() {
		if (this.getSelections() && this.getSelections().length > 0) {
			this.getModel().copy(this.getSelections()[0].getCopy(),
					this.getDefaultCopyWay());
		}
	},
	paste : function(col, row) {
		this.getModel().paste(col, row, this.getDefaultCopyWay());
	},
	cut : function() {
		if (this.getSelections() && this.getSelections().length > 0) {
			this.getModel().cut(this.getSelections()[0].getCopy(),
					this.getDefaultCopyWay());
		}
	},
	addLoadAnimation : function() {
		// var canvas = document.createElement('canvas');
		// var size = this.get
	},
	getSelectionMode : function() {
		return this.getModel().data.options.selectionMode;
	},
	getEditMode : function() {
		return this.getModel().getEditMode();
	},
	getColorProvider : function() {
		return this.getModel().getColorProvider();
	},
	getDefaultCopyWay : function() {
		return COM.widget.Grid.COPY_CONTENT;
	},
	getZIndex : function(col, row) {
		var areaRow = 0;
		var areaCol = 0;
		if (row >= this.data.rowHeaderCount) {
			if (row >= this.data.rowCount - this.data.rowFooterCount) {
				areaRow = 2;
			} else {
				areaRow = 1;
			}
		}
		if (col >= this.data.colHeaderCount) {
			if (col >= this.data.colCount - this.data.colFooterCount) {
				areaCol = 2;
			} else {
				areaCol = 1;
			}
		}
		return COM.widget.Grid.GridCanvas.getIndex(areaRow, areaCol) + 1;
	},

	/**
	 * 获取第一个可以有当前单元格的列 通过界面鼠标操作来来触发的当前单元格改变，当前单元格必须是在可视区域内。
	 */
	getFirstCurrentCol : function() {
		return Math.max((this.data.colHeaderCount > 1 ? 1 : this.drawStartCol),
				1);
	},
	/**
	 * 获取第一个可以有当前单元格的列
	 */
	getFirstCurrentRow : function() {
		return Math.max((this.data.rowHeaderCount > 1 ? 1 : this.drawStartRow),
				1);
	},
	/**
	 * 获取内容的高度
	 */
	getContentHeight : function() {
		var heights = this.areaHeights;
		var total = 0;
		for (var i = 0; i < heights.length; i++) {
			total += heights[i];
		}
		return total;
	},
	/**
	 * 获取内容的宽度
	 */
	getContentWidth : function() {
		var widths = this.areaWidths;
		var total = 0;
		for (var i = 0; i < widths.length; i++) {
			total += widths[i];
		}
		return total;
	},

	// ---------------------------焦点相关开始--------------------------- 未使用
	/*
	 * 以一个隐藏的input捕获键盘事件来触发打开编辑器的事件，其他键盘事件还是从body上面监听。 注意事项：
	 * 1.在表格被点击之后，需要将浏览器聚焦在该input上。 2.一次编辑结束后需要将浏览器聚焦在该input上。
	 * 
	 * PS：使用此方式的主要原因：
	 * 如果使用通常的方式监听body上的键盘事件然后打开编辑器，适配者会根据按键值为编辑器设置内容，但是浏览器会在后续的type事件中将输入的字符放入编辑器，导致编辑器内容混乱。
	 * 
	 */
	addFocusReceiver : function(parent) {
		var input = this.getFocusReceiver().getControl();
		parent.appendChild(input);
	},
	removeFocusReceiver : function(parent) {
		var input = this.getFocusReceiver().getControl();
		if (input) {
			parent.removeChild(input);
		}
	},
	getFocusReceiver : function() {
		if (!this.focusReceiver) {
			this.focusReceiver = new FocusReceiver();
		}
		return this.focusReceiver;
	},

	bindKeyListenerForFocusReceiver : function() {
		var self = this;
		this.getFocusReceiver().onInputCommint(function(value) {
					// 兼容IE9，IE9下如果不timeout，用搜狗输入法就会导致之后编辑器中的文本变成两份
					setTimeout(function() {
								self.editCurrentCell({
											'type' : COM.widget.Grid.CAUSE_KEY,
											'value' : value
										});
							}, 0);
				});
	},
	getEditCurrentMoveListener : function() {
		if (this.focusReciverLocater == null) {
			this.focusReciverLocater = this.createEditCurrentMoveListener();
		}
		return this.focusReciverLocater;
	},
	createEditCurrentMoveListener : function() {
		var self = this;
		var focusReciverLocater = {
			figureMoved : function(figure) {
				var bounds = figure.getBounds();
				figure.translateToAbsolute(bounds);
				// 减2个像素避免最后一行时input显示出来
				self.locateFocusReciver(bounds.x, bounds.y + bounds.height - 2);
			}
		}
		return focusReciverLocater;
	},
	locateFocusReciver : function(x, y) {
		this.getFocusReceiver().locate(x, y);
	},

	// ---------------------------焦点相关结束----------------------
	setCursorProvider : function(provider) {
		this.cursorProvider = provider;
	},
	createFigureContent : function(figure) {

		var data = this.getModel().data;
		if (data != null) {
			var rowList = data.cells.rowList;
			var layoutData = {
				'rows' : data.rows,
				'cols' : data.cols
			};
			this.data = data;

			// 计算区域高宽
			this.calculateCanDrawArea(layoutData, data);

			if (!this.canVisible()) {
				return;
			}

			this.fireAreaSizeChanged();

			// 检查数据完整性

			var needLoad = this.checkDataBeforeCreateContent(rowList, data); // 是否需要加载数据

			// 更新图形

			var fullArea = !(data.options.mergeCellShowMode === COM.widget.Grid.MERGE_SHOW_MODE_CONTRACT); // 合并单元格是否按照全部大小显示

			figure.unshowAll();

			// var self = this;
			// var col = 0; // col
			// var row = 0; // row
			// var x = 0; // 横坐标
			// var y = 0; // 纵坐标
			// var offsetX = this.offsetX;
			// var offsetY = this.offsetY;

			var envirement = {};
			envirement.col = 0;
			envirement.row = 0;
			envirement.x = 0;
			envirement.y = 0;
			envirement.offsetX = this.offsetX;
			envirement.offsetY = this.offsetY;
			envirement.editPart = this;
			envirement.fullArea = fullArea;
			envirement.areaHeights = this.areaHeights;
			envirement.areaWidths = this.areaWidths;
			envirement.rowList = rowList;
			envirement.layoutData = layoutData;
			envirement.figure = figure;

			envirement.colRanges = [0, this.drawHeaderColCount - 1,
					this.drawStartCol, this.drawEndCol, this.footerStartCol,
					data.colCount - 1];
			envirement.rowRanges = [0, this.drawHeaderRowCount - 1,
					this.drawStartRow, this.drawEndRow, this.footerStartRow,
					data.rowCount - 1];
			// envirement.colRanges = [0, data.colHeaderCount - 1,
			// this.drawStartCol,
			// this.drawEndCol, data.colCount - data.colFooterCount,
			// data.colCount - 1];
			// envirement.rowRanges = [0, data.rowHeaderCount - 1,
			// this.drawStartRow,
			// this.drawEndRow, data.rowCount - data.rowFooterCount,
			// data.rowCount - 1];

			// var colRanges = [0, data.colHeaderCount - 1, this.drawStartCol,
			// this.drawEndCol, data.colCount - data.colFooterCount,
			// data.colCount - 1];
			// var rowRanges = [0, data.rowHeaderCount - 1, this.drawStartRow,
			// this.drawEndRow, data.rowCount - data.rowFooterCount,
			// data.rowCount - 1];

			var beginDate = new Date().getTime();
			COM.widget.Grid.GridEditPart.figureBuilder.buildFigures(envirement);
			// // 普通行
			// y = this.areaHeights[0];
			// if (offsetY > 0) {
			// y -= offsetY;
			// }
			// addRowsToGridFigure(rowRanges[2], rowRanges[3]);
			// // 表头行
			// y = 0;
			// addRowsToGridFigure(rowRanges[0], rowRanges[1]);
			// // 表尾行
			// y = this.areaHeights[0] + this.areaHeights[1];
			// addRowsToGridFigure(rowRanges[4], rowRanges[5]);

			var endDate = new Date().getTime();
			var delta = endDate - beginDate;
			Debugger.log('create Figure: [ ' + delta + ' ]');

			figure.removeUnShow();

			// 重绘整个表格
			figure.repaint();
			this.fireEvent(COM.widget.Grid.Event.LAYOUT, {});

			// 如果此次显示需要加载数据，则不进行预加载
			if (needLoad) {
				return;
			} else {
				// 预加载
				if (this.getModel().data.options.loadMode == COM.widget.Grid.LOAD_MODE_LAZY) {
					this.preLoad(data, rowList);
				}
			}

		}
	},
	isDisposed : function() {
		return this.disposed;
	},
	dispose : function() {
		this.disposed = true;
		try {
			var figure = this.figure;
			if (figure && figure.dispose) {
				figure.dispose();
			}
			this.figure = null;
		} catch (e) {
			Debugger.error('grid editpart dispose figure failed.');
		}
		if (this.policies && this.policies.length > 0) {
			for (var i = 1; i < this.policies.length; i += 2) {
				var pl = this.policies[i];
				if (pl && this.policies.dispose) {
					pl.dispose();
				}
				this.policies[i] = 0;
			}
			this.policies = null;
		}
		delete this.mask;
		delete this.focusReceiver;
		delete this.initCellMouseMotionListener
		delete this.createFigure
		delete this.calculateCanDrawArea
		delete this.areaWidths
		delete this.areaHeights
		delete this.model
		delete this.data
		delete this.createFigureByModel
		delete this.selectionManager
		delete this.horizScroller
		delete this.vertiScroller
		delete this.createFigureContent
		delete this.parent;
		delete this.viewer;
	}
});

COM.widget.Grid.GridEditPart.figureBuilder = function() {
	function allColsToGridFigure(begin, end, ev, forceOffset) {
		for (var col = begin; col <= end; col++) {
			allCellToGridFigure(col, ev.row, ev, forceOffset);
		}
	};
	function addRowsToGridFigure(begin, end, ev, forceOffset) {
		for (var row = begin; row <= end; row++) {
			addRowToGridFigure(row, ev, forceOffset);

		}
	};
	/*
	 * forceOffset用于处理x或y方向上滚动到最后时的特殊显示方式.
	 */
	function addRowToGridFigure(row, ev, forceOffsetY) {
		// 记录当前正在处理的行
		ev.row = row;
		var rowData = ev.layoutData.rows[row];
		if (!rowData || rowData.hidden) {
			return;
		}
		// 普通列第一列
		ev.x = ev.areaWidths[0];
		// 如果在y或x方向上需要forceOffset
		var forceOffset;
		if (forceOffsetY || ev.offsetX) {
			forceOffset = {
				'y' : forceOffsetY,
				'x' : ev.offsetX
			};
		}

		allCellToGridFigure(ev.colRanges[2], row, ev, forceOffset);

		// 后面的只处理y方向上的forceOffset
		if (!forceOffsetY) {
			forceOffset = null;
		} else if (forceOffset) {
			forceOffset.x = 0;
		}
		if (ev.offsetX > 0) {
			ev.x -= ev.offsetX;
		}
		allColsToGridFigure(ev.colRanges[2] + 1, ev.colRanges[3], ev,
				forceOffset);

		// 表头列
		ev.x = 0;
		allColsToGridFigure(ev.colRanges[0], ev.colRanges[1], ev, forceOffset);

		// 表尾列
		ev.x = ev.areaWidths[0] + ev.areaWidths[1];
		allColsToGridFigure(ev.colRanges[4], ev.colRanges[5], ev, forceOffset);

		ev.y += rowData.clientSize;
	}
	function allCellToGridFigure(col, row, ev, forceOffset) {
		// 获取当前列数据
		var colData = ev.layoutData.cols[col];
		if (!colData || colData.hidden) {
			return;
		}
		// 获取当前单元格数据
		var rowCells = ev.rowList[row];
		var model;
		var cellFigure;
		var offset;
		var size;

		if (rowCells) {
			model = rowCells[col];
		} else {
			model = null;
		}
		// 将单元格的图形加到gridFigure中
		if (model) {
			if (model.merged) {

				rowCells = ev.rowList[model.mergeInfo.row];
				if (rowCells) {
					model = rowCells[model.mergeInfo.col];
				} else {
					model = null;
				};

				cellFigure = ev.editPart.createFigureByModel(model, col, row);
				if (!cellFigure.show || cellFigure.getParent() != ev.figure) {
					cellFigure.gridOffset = null;

					if (ev.fullArea) {
						offset = {
							'x' : 0,
							'y' : 0
						}
					} else {
						offset = null;
					}
					size = ev.editPart.calculateCellSize(model, ev.layoutData,
							col, row, offset);
					if (forceOffset && (forceOffset.x || forceOffset.y)) {
						if (!offset) {
							offset = {
								'x' : 0,
								'y' : 0
							};
						}
						if (forceOffset.x) {
							offset.x += forceOffset.x;
						}
						if (forceOffset.y) {
							offset.y += forceOffset.y;
						}
					}
					if (offset && (offset.x + offset.y)) {
						cellFigure.setBounds(new Rectangle(ev.x - offset.x,
								ev.y - offset.y, size.width, size.height));
						cellFigure.gridOffset = offset;
					} else {
						cellFigure.setBounds(new Rectangle(ev.x, ev.y,
								size.width, size.height));
					}

					cellFigure.show = true;

					// 如果加上此判断可以较少一些时间，但是会出现一些问题
					// if (cellFigure.getParent() != figure) {
					ev.figure.add(cellFigure);
					// }
				}

			} else {
				cellFigure = ev.editPart.createFigureByModel(model, col, row);
				cellFigure.gridOffset = null;

				if (!cellFigure.show || cellFigure.getParent() != ev.figure) {
					size = ev.editPart.calculateCellSize(model, ev.layoutData,
							col, row);
					if (forceOffset && (forceOffset.x || forceOffset.y)) {
						if (!offset) {
							offset = {
								'x' : 0,
								'y' : 0
							};
						}
						if (forceOffset.x) {
							offset.x = forceOffset.x;
						}
						if (forceOffset.y) {
							offset.y = forceOffset.y;
						}
						cellFigure.setBounds(new Rectangle(ev.x - offset.x,
								ev.y - offset.y, size.width, size.height));
						cellFigure.gridOffset = offset;
					} else {
						cellFigure.setBounds(new Rectangle(ev.x, ev.y,
								size.width, size.height));
					}

					cellFigure.show = true;
					// if (cellFigure.getParent() != figure) {
					ev.figure.add(cellFigure);
					// }
				}
			}
		}
		ev.x += colData.clientSize;
	};
	this.buildFigures = function(ev) {

		ev.y = ev.areaHeights[0];
		addRowToGridFigure(ev.rowRanges[2], ev, ev.offsetY);
		if (ev.offsetY > 0) {
			ev.y -= ev.offsetY;
		}
		addRowsToGridFigure(ev.rowRanges[2] + 1, ev.rowRanges[3], ev);
		// 表头行
		ev.y = 0;
		addRowsToGridFigure(ev.rowRanges[0], ev.rowRanges[1], ev);
		// 表尾行
		ev.y = ev.areaHeights[0] + ev.areaHeights[1];
		addRowsToGridFigure(ev.rowRanges[4], ev.rowRanges[5], ev);
	}

	return this;
}();
/**
 * @author jiangqifan
 * @since 2013-4-24
 */
COM.widget.Grid.PartFactory = function PartFactory() {
	COM.widget.Grid.PartFactory.superclass.constructor.call(this);
};
COM.widget.Grid.PartFactory.extend(COM.gef.EditPartFactory, {
			createEditPart : function(context, model) {
				var part = null;
				if (model instanceof COM.widget.Grid.GridModel) {
					part = new COM.widget.Grid.GridEditPart();
				}
				part.setModel(model);
				return part;
			}
		});
COM.widget.Grid.RequestConstants = {};
COM.widget.Grid.RequestConstants.CHANGE_COL_SIZE = 'change col size';
COM.widget.Grid.RequestConstants.CHANGE_ROW_SIZE = 'change row size';
COM.widget.Grid.RequestConstants.COL_EXCHANGE = 'col exchange';
COM.widget.Grid.RequestConstants.SELECTION_MOVE = 'selection move';
/**
 * @author jiangqifan
 * @since 2013-6-28
 */
COM.widget.Grid.DefaultHelper = function() {
};
COM.widget.Grid.DefaultHelper.prototype = {
	createDefaultCol : function() {
		return {
			size : 100,
			auto : false,
			hidden : false,
			clientSize : 100
		};
	},
	createDefaultRow : function() {
		return {
			size : 20,
			auto : false,
			hidden : false,
			clientSize : 20
		};
	},
	createDefaultCell : function() {
		return {
			editorId : '',
			title : null,
			showText : null,
			editText : '',
			selectable : true,
			editable : true,
			cellMode : COM.widget.Grid.Cell.Cell_MODE_NORMAL,
			clientData : {},

			rowSpan : 1,
			colSpan : 1,
			merged : false,

			fontName : '宋体',
			// fontStyle
			fontSize : 12,
			fontSizeUnit : 0,
			fontColor : '#000',
			indent : 0,
			horzAlign : 3,
			vertAlign : 0
		};
	},
	// 默认属性
	getDefaultBorderColor : function() {
		return "gray";
	},
	createDefaultBorder : function() {
		return [1, 1];
	},
	createDefaultBorderColor : function() {
		return ['gray', 'gray'];
	}
}
/**
 * @author jiangqifan
 * @since 2013-7-5
 */
COM.widget.Grid.CellFieldLocator = function CellFieldLocator() {
	COM.widget.Grid.CellFieldLocator.superclass.constructor.call(this);
};
COM.widget.Grid.CellFieldLocator.extend(Object, {
			getEditPart : function() {
				return this.editPart;
			},
			relocate : function(target) {
				var rect = target.getField();
				var innerBounds = new Rectangle();
				var bounds = this.getEditPart().getCellAreaBounds(rect,
						innerBounds);
				bounds.crop(new Insets(1, 1, 2, 2));
				target.setBounds(bounds);
				target.setInnerBounds(innerBounds);
			},
			setEditPart : function(editPart) {
				this.editPart = editPart;
			}

		});
/**
 * @author jiangqifan
 * @since 2013-7-5
 */
COM.widget.Grid.CellFieldFigure = function CellFieldFigure(owner, locator) {
	COM.widget.Grid.CellFieldFigure.superclass.constructor.call(this);
	this.setOpaque(true);
	this.field = new Rectangle();
	this.setOwner(owner);
	this.setLocator(locator);
};
COM.widget.Grid.CellFieldFigure.extend(Figure, {
			validate : function() {
				if (this.isValid()) {
					return;
				}
				this.getLocator().relocate(this);
				COM.widget.Grid.CellFieldFigure.superclass.validate.call(this);
			},
			setInnerBounds : function(innerBounds) {
				this.innerBounds = innerBounds;
			},
			getInnerBounds : function() {
				return this.innerBounds;
			},
			getField : function() {
				return this.field;
			},
			setField : function(x, y, width, height) {
				this.field.x = x;
				this.field.y = y;
				this.field.width = width;
				this.field.height = height;
			},
			getLocator : function() {
				return this.locator;
			},
			setLocator : function(locator) {
				this.locator = locator;
			},
			getOwner : function() {
				return this.editpart;
			},
			setOwner : function(editpart) {
				this.editpart = editpart;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-7-5
 */
COM.widget.Grid.FloatBorderFigure = function FloatBorderFigure(owner, locator) {
	COM.widget.Grid.FloatBorderFigure.superclass.constructor.call(this);
	this.setOpaque(false);
	this.setBorder(new COM.widget.Grid.SelectionBorder(1, "#f00"));
	this.field = new Rectangle();
	this.setOwner(owner);
	this.setLocator(locator);
};
COM.widget.Grid.FloatBorderFigure.extend(Figure, {
			ancestorMoved : function(ancestor) {
				this.revalidate();
			},
			validate : function() {
				if (this.isValid()) {
					return;
				}
				this.getLocator().relocate(this);
				COM.widget.Grid.FloatBorderFigure.superclass.validate
						.call(this);
			},
			addNotify : function() {
				COM.widget.Grid.FloatBorderFigure.superclass.addNotify
						.call(this);
				this.getOwnerFigure().addAncestorListener(this);
			},
			removeNotify : function() {
				this.getOwnerFigure().removeAncestorListener(this);
				COM.widget.Grid.FloatBorderFigure.superclass.removeAncestorListener
						.call(this);
			},
			setInnerBounds : function(innerBounds) {
				this.innerBounds = innerBounds;
			},
			getInnerBounds : function() {
				return this.innerBounds;
			},
			getField : function() {
				return this.field;
			},
			setField : function(x, y, width, height) {
				this.field.x = x;
				this.field.y = y;
				this.field.width = width;
				this.field.height = height;
			},
			getLocator : function() {
				return this.locator;
			},
			getOwner : function() {
				return this.editpart;
			},
			getOwnerFigure : function() {
				return this.getOwner().getFigure();
			},
			setLocator : function(locator) {
				this.locator = locator;
			},
			setOwner : function(editpart) {
				this.editpart = editpart;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-8-14
 * 
 * getVerti(); getHoriz(); appendTo(parent); removeFrom(parent); setSize(width,
 * height); dispose();
 * 
 * 
 * 
 * verti: show(); hide(); getSize(); setContentSize(); bindScrollListener();
 * getScrollTop(); setScrollTop(); getScrollHeight(); getScrollTopMax();
 * 
 * horiz: show(); hide(); getSize(); setContentSize(); bindScrollListener();
 * getScrollLeft(); setScrollLeft(); getScrollWidth(); getScrollLeftMax();
 */

COM.widget.Grid.ScrollHelper = function ScrollHelper() {
	this.init();
}
// method
COM.widget.Grid.ScrollHelper.extend(Object, {
			init : function() {
				var verti = {};
				var scrollBar = document.createElement("div");
				scrollBar.style.position = 'absolute';
				scrollBar.style.visibility = "hidden";
				scrollBar.style.overflow = "auto";
				scrollBar.style.height = "1px";
				// ie10下至少要18px,滚动条才能正常使用
				scrollBar.style.width = "18px";
				scrollBar.className = "verti-scroll-bar";
				scrollBar.style.zIndex = 99;
				verti.scrollBar = scrollBar;
				verti.show = this.showFunc;
				verti.hide = this.hideFunc;

				var placeHolder = document.createElement("div");
				placeHolder.style.height = "1px";
				placeHolder.style.width = "1px";
				verti.placeHolder = placeHolder;

				scrollBar.appendChild(placeHolder);
				this.verti = verti;
				verti.getSize = function() {
					return parseInt(this.scrollBar.style.height);
				}
				verti.setContentSize = function(size) {
					return this.placeHolder.style.height = size + 'px';
				}
				verti.bindScrollListener = function(listen) {
					this.scrollBar.onscroll = listen;
				}
				verti.getScrollTop = function() {
					return this.scrollBar.scrollTop;
				}
				verti.setScrollTop = function(top) {
					this.scrollBar.scrollTop = top;
				}
				verti.getScrollTopMax = function() {
					return this.scrollBar.scrollTopMax;
				}
				verti.getScrollHeight = function() {
					return this.scrollBar.scrollHeight;
				}

				var horiz = {};
				scrollBar = document.createElement("div");
				scrollBar.style.position = 'absolute';
				scrollBar.style.visibility = "hidden";
				scrollBar.style.overflow = "auto";
				scrollBar.className = "horiz-scroll-bar";
				// ie10下至少要18px,滚动条才能正常使用
				scrollBar.style.height = "18px";
				scrollBar.style.width = "1px";
				scrollBar.style.zIndex = 99;
				horiz.scrollBar = scrollBar;
				horiz.show = this.showFunc;
				horiz.hide = this.hideFunc;

				placeHolder = document.createElement("div");
				horiz.placeHolder = placeHolder;
				placeHolder.style.height = "1px";
				placeHolder.style.width = "1px";
				scrollBar.appendChild(placeHolder);
				this.horiz = horiz;
				horiz.getSize = function() {
					return parseInt(this.scrollBar.style.width);
				}
				horiz.setContentSize = function(size) {
					return this.placeHolder.style.width = size + 'px';
				}
				horiz.bindScrollListener = function(listen) {
					this.scrollBar.onscroll = listen;
				}
				horiz.getScrollLeft = function() {
					return this.scrollBar.scrollLeft;
				}
				horiz.setScrollLeft = function(left) {
					this.scrollBar.scrollLeft = left;
				}
				horiz.getScrollWidth = function() {
					return this.scrollBar.scrollWidth;
				}

			},
			showFunc : function() {
				this.scrollBar.style.visibility = "visible";
			},
			hideFunc : function() {
				this.scrollBar.style.visibility = "hidden";
			},
			getVerti : function() {
				return this.verti;
			},
			getHoriz : function() {
				return this.horiz;
			},
			getVertiScrollBar : function() {
				return this.verti.scrollBar;
			},
			getHorizScrollBar : function() {
				return this.horiz.scrollBar;
			},
			getVertiPlaceHolder : function() {
				return this.verti.placeHolder;

			},
			getHorizPlaceHolder : function() {
				return this.horiz.placeHolder;
			},
			appendTo : function(parent) {
				parent.appendChild(this.verti.scrollBar);
				parent.appendChild(this.horiz.scrollBar);
			},
			removeFrom : function(parent) {

			},
			setSize : function(width, height) {

				this.getVertiScrollBar().style.height = (height) + 'px';
				this.getHorizScrollBar().style.top = (height) + 'px';
				this.getHorizScrollBar().style.width = (width) + 'px';
				this.getVertiScrollBar().style.left = (width) + 'px';

			},
			dispose : function() {
				if (this.verti) {
					delete this.verti.scrollBar;
				}
				if (this.horiz) {
					delete this.horiz.scrollBar;
				}
				delete this.verti;
				delete this.horiz;
			}
		});
/**
 * @author jiangqifan
 * @since 2014-1-7
 */
COM.widget.Grid.GridPolicy = function GridPolicy(host) {
	COM.widget.Grid.GridPolicy.superclass.constructor.call(this);
	this.handles = [];
	this.setHost(host);
	this.selectionHandleShowing = false;
}
COM.widget.Grid.GridPolicy.extend(COM.gef.GraphicalEditPolicy, {
	addResizeHandle : function() {
		// this.removeResizeHandle();
		var layer = this.getLayer(COM.gef.LayerConstants.HANDLE_LAYER,
				Cursor.E_RESIZE);
		var handle = this.createResizeHandle();
		layer.add(this.resizeHandle);
	},
	createResizeHandle : function() {
		if (this.resizeHandle == null) {
			if (this.getHost().getModel().isAdvancedResize()) {
				this.resizeHandle = new COM.widget.Grid.AdvancedResizeHandle(this
						.getHost());
			} else {
				this.resizeHandle = new COM.widget.Grid.ResizeHandle(this
						.getHost());
			}
		}
		return this.resizeHandle;
	},
	getBeginLine : function(p1, p2) {
		if (this.beginLine == null) {
			this.beginLine = new Polyline();
			this.beginLine.setOutlineColor(ColorConstants.red);
		}
		return this.beginLine;
	},
	getEndLine : function() {
		if (this.endLine == null) {
			this.endLine = new Polyline();
			this.endLine.setOutlineColor(ColorConstants.red);
		}
		return this.endLine;
	},
	showColSizeChangeFeedback : function(request) {
		var part = this.getHost();
		var figure = part.getFigure();
		var bounds = figure.getBounds().getCopy();
		figure.translateToAbsolute(bounds);

		var height = part.getContentHeight();
		var p1 = new Point(request.begin, bounds.y);
		var p2 = new Point(request.begin, bounds.y + height);
		var p3 = new Point(request.end + request.delta, bounds.y);
		var p4 = new Point(request.end + request.delta, bounds.y + height);

		this.updateLines(p1, p2, p3, p4);

	},
	showRowSizeChangeFeedback : function(request) {
		var part = this.getHost();
		var figure = part.getFigure();
		var bounds = figure.getBounds().getCopy();
		figure.translateToAbsolute(bounds);

		var width = part.getContentWidth();
		var p1 = new Point(bounds.x, request.begin);
		var p2 = new Point(bounds.x + width, request.begin);
		var p3 = new Point(bounds.x, request.end + request.delta);
		var p4 = new Point(bounds.x + width, request.end + request.delta);

		this.updateLines(p1, p2, p3, p4);
	},
	getCommand : function(request) {
		var colRow = request.colRow;
		var delta = request.delta;
		var command = null;
		if (COM.widget.Grid.RequestConstants.CHANGE_COL_SIZE == request
				.getType()) {
			command = new COM.widget.Grid.ChangeColSizeCommand();
			command.setGridModel(this.getHost().getModel());
			command.setCol(colRow);
			command.setDelta(delta);
		} else if (COM.widget.Grid.RequestConstants.CHANGE_ROW_SIZE == request
				.getType()) {
			command = new COM.widget.Grid.ChangeRowSizeCommand();
			command.setGridModel(this.getHost().getModel());
			command.setRow(colRow);
			command.setDelta(delta);
		}

		return command;
	},
	showSourceFeedback : function(request) {
		if (COM.widget.Grid.RequestConstants.CHANGE_COL_SIZE == request
				.getType()) {
			this.showColSizeChangeFeedback(request);
		} else if (COM.widget.Grid.RequestConstants.CHANGE_ROW_SIZE == request
				.getType()) {
			this.showRowSizeChangeFeedback(request);
		}
	},
	eraseSourceFeedback : function(request) {

		var layer = this.getLayer(COM.gef.LayerConstants.FEEDBACK_LAYER);
		if (COM.widget.Grid.RequestConstants.CHANGE_COL_SIZE == request
				.getType()
				|| COM.widget.Grid.RequestConstants.CHANGE_ROW_SIZE == request
						.getType()) {
			var beginLine = this.getBeginLine();
			var endLine = this.getEndLine();
			if (layer != null && beginLine != null) {
				layer.remove(beginLine);
			}
			if (layer != null && endLine != null) {
				layer.remove(endLine);
			}
		}

	},
	updateLines : function(p1, p2, p3, p4) {
		var beginLine = this.getBeginLine();
		var endLine = this.getEndLine();
		beginLine.setEndpoints(p1, p2);
		endLine.setEndpoints(p3, p4);
		var layer = this.getLayer(COM.gef.LayerConstants.FEEDBACK_LAYER);
		layer.add(beginLine);
		layer.add(endLine);
	}
});
/**
 * @author jiangqifan
 * @since 2013-5-3
 */
COM.widget.Grid.SelectionPolicy = function SelectionPolicy(host) {
	COM.widget.Grid.SelectionPolicy.superclass.constructor.call(this);
	this.handles = [];
	this.setHost(host);
	this.selectionHandleShowing = false;
}
COM.widget.Grid.SelectionPolicy.extend(COM.gef.GraphicalEditPolicy, {
			showSelection : function() {
				this.addSelectionHandles();
			},
			hideSelection : function() {
				this.removeSelectionHandles();
			},
			addSelectionHandles : function() {
				if (this.getHost().getModel().isShowSelectionBorder()) {
					this.removeSelectionHandles();
					var layer = this
							.getLayer(COM.gef.LayerConstants.HANDLE_LAYER);
					this.handles = this.createSelectionHandles();
					for (var i = 0; i < this.handles.length; i++) {
						layer.add(this.handles[i]);
					}
					this.selectionHandleShowing = true;
				}
			},
			removeSelectionHandles : function() {
				if (this.handles == null || this.handles.length == 0
						|| !this.selectionHandleShowing) {
					return;
				}
				var layer = this.getLayer(COM.gef.LayerConstants.HANDLE_LAYER);
				for (var i = 0; i < this.handles.length; i++) {
					layer.remove(this.handles[i]);
				}
				this.handles = null;
			},
			createSelectionHandles : function() {
				var list = [];
				var locator = new COM.widget.Grid.GridSelectionHandleLocator(this
						.getHost());
				var provider = this.getHost().getColorProvider();
				var handle = new COM.widget.Grid.SelectionHandle(
						this.getHost(), locator);
				var color = provider.getSelectionBorderColor();
				var width = provider.getSelectionBorderWidth();
				handle.getBorder().setColor(color);
				handle.getBorder().setWidth(width);
				handle.setInnerPad(width);
				list.push(handle);
				if (!provider.isHideSelectionChangeable()) {
					var locator = new COM.widget.Grid.GridSelectionHandleLocator(this
							.getHost());
					handle = new COM.widget.Grid.SelectionChangeHandle(
							this.getHost(),
							new COM.widget.Grid.SelectionChangeHandleLocator(handle),
							null);
					handle.setBackgroundColor(color);
					list.push(handle);
				}
				return list;
			},
			refreshHandlesLocation : function() {
				if (this.handles == null || this.handles.length == 0) {
					return;
				}
				for (var i = 0; i < this.handles.length; i++) {
					this.handles[i].revalidate();
				}
			}
		});
/**
 * @author jiangqifan
 * @since 2013-5-3
 */
COM.widget.Grid.SelectionChangePolicy = function SelectionChangePolicy(host) {
	COM.widget.Grid.SelectionChangePolicy.superclass.constructor.call(this);
	this.handles = [];
	this.setHost(host);
	this.selectionHandleShowing = false;
}
COM.widget.Grid.SelectionChangePolicy.extend(COM.gef.GraphicalEditPolicy, {
	getCommand : function(request) {
		var command = null;
		if (COM.widget.Grid.RequestConstants.SELECTION_MOVE == request
				.getType()) {
			command = new COM.widget.Grid.SelectionChangeCommand();
			command.setGridModel(this.getHost().getModel());
			command.setOldSelection(this.getHost().getSelection().getCopy());
			command.setNewSelection(request.rect);
			command.setButton(request.button);
		}
		return command;
	},
	showSourceFeedback : function(request) {
		if (COM.widget.Grid.RequestConstants.SELECTION_MOVE == request
				.getType()) {
			var layer = this.getLayer(COM.gef.LayerConstants.FEEDBACK_LAYER);
			var feedBack = this.getSelectionChangeFeedBack();
			var innerBounds = new Rectangle();
			var bounds = this.getHost().getCellAreaBounds(request.rect,
					innerBounds);
			feedBack.setBounds(bounds);
			feedBack.setInnerBounds(innerBounds);
			layer.add(feedBack);
			// 如果新的选择区比之前的小，则显示阴影
			// if () {
			//            	
			// }
			this.selectionHandleShowing = true;
		}
	},
	getSelectionChangeFeedBack : function() {
		if (!this.selectionFeedBack) {
			this.selectionFeedBack = this.createSelectionChangeFeedBack();
		}
		return this.selectionFeedBack;
	},
	createSelectionChangeFeedBack : function() {
		var figure = new Figure();
		figure.setBorder(new COM.widget.Grid.SelectionBorder(this.getHost()
						.getColorProvider().getSelectionBorderWidth(), Color
						.parse(this.getHost().getColorProvider()
								.getSelectionBorderColor()), true));
		figure.getInnerBounds = COM.widget.Grid.SelectionHandle.prototype.getInnerBounds;
		figure.setInnerBounds = COM.widget.Grid.SelectionHandle.prototype.setInnerBounds;
		return figure;
	},
	eraseSourceFeedback : function(request) {
		var layer = this.getLayer(COM.gef.LayerConstants.FEEDBACK_LAYER);
		if (COM.widget.Grid.RequestConstants.SELECTION_MOVE == request
				.getType()) {
			var feedBack = this.selectionFeedBack;
			if (layer != null && feedBack != null) {
				layer.remove(feedBack);
				this.selectionFeedBack = null;
			}
		}

	}
});
/**
 * @author jiangqifan
 * @since 2013-5-3
 */
COM.widget.Grid.ColExchangePolicy = function ColExchangePolicy(host) {
	COM.widget.Grid.ColExchangePolicy.superclass.constructor.call(this);
	this.setHost(host);
	this.changeColFeedBack = null;
	this.sourceFeedBack = null;
	this.targetFeedBack = null;
}
COM.widget.Grid.ColExchangePolicy.extend(COM.gef.GraphicalEditPolicy, {
	getCommand : function(request) {
		var command = null;
		if (COM.widget.Grid.RequestConstants.COL_EXCHANGE == request.getType()) {
			command = new COM.widget.Grid.ColExchangeCommand();
			command.setGridModel(this.getHost().getModel());
			command.setSource(request.source);
			command.setTarget(request.target);
		}

		return command;
	},
	showSourceFeedback : function(request) {
		if (COM.widget.Grid.RequestConstants.COL_EXCHANGE == request.getType()) {
			this.showColExchangeFeedBack(request);
		}
	},
	eraseSourceFeedback : function(request) {

		var layer = this.getLayer(COM.gef.LayerConstants.FEEDBACK_LAYER);
		if (COM.widget.Grid.RequestConstants.COL_EXCHANGE == request.getType()) {
			var feedBack = this.changeColFeedBack;
			if (layer != null && feedBack != null) {
				layer.remove(feedBack);
				this.changeColFeedBack = null;
			}
			if (this.sourceFeedBack) {
				layer.remove(this.sourceFeedBack);
				this.sourceFeedBack = null;
			}
			if (this.targetFeedBack) {
				layer.remove(this.targetFeedBack);
				this.targetFeedBack = null;
			}
			/*
			 * if (this.colFigure) { this.colFigure.setOpaque(true);
			 * this.colFigure.repaint(); this.colFigure = null; }
			 */
		}
	},
	showColExchangeFeedBack : function(request) {
		var source = request.source;
		var target = request.target;
		var deltaX = request.deltaX;
		var deltaY = request.deltaY;
		var figure = this.getColExchangeFeedBack(source);
		figure
				.setLocation(new Point(this.startX + deltaX, this.startY
								+ deltaY));
		var layer = this.getLayer(COM.gef.LayerConstants.FEEDBACK_LAYER);
		layer.add(figure);

		var provider = this.getHost().getColorProvider();
		var handle = new COM.widget.Grid.SelectionHandle(this.getHost(),
				locator);
		var color = provider.getSelectionBorderColor();
		var width = provider.getSelectionBorderWidth();
		if (this.sourceFeedBack == null) {
			this.sourceFeedBack = new COM.widget.Grid.FloatBorderFigure(this
					.getHost());
			this.sourceFeedBack.getBorder().setColor(color);
			this.sourceFeedBack.getBorder().setWidth(width);
			var locator = new COM.widget.Grid.CellFieldLocator();
			locator.setEditPart(this.getHost());
			this.sourceFeedBack.setLocator(locator);
			this.sourceFeedBack.setField(source, 0, 1, 1);
			layer.add(this.sourceFeedBack);
		} else {
			this.sourceFeedBack.setField(source, 0, 1, 1);
			this.targetFeedBack.revalidate();
		}

		if (this.targetFeedBack == null) {
			this.targetFeedBack = new COM.widget.Grid.FloatBorderFigure(this
					.getHost());
			var locator = new COM.widget.Grid.CellFieldLocator();
			this.targetFeedBack.getBorder().setColor(color);
			this.targetFeedBack.getBorder().setWidth(width);
			locator.setEditPart(this.getHost());
			this.targetFeedBack.setLocator(locator);
			this.targetFeedBack.setField(target, 0, 1, 1);
			layer.add(this.targetFeedBack);
		} else {
			this.targetFeedBack.setField(target, 0, 1, 1);
			this.targetFeedBack.revalidate();
		}
	},
	getColExchangeFeedBack : function(col) {
		if (!this.changeColFeedBack) {
			this.changeColFeedBack = this.createColFeedBack(col);
		}
		return this.changeColFeedBack;
	},
	createColFeedBack : function(col) {
		var figure = new Figure();
		var hostFigure = this.getHost().getFigure();
		var colFigure = this.getHost().getModel().getCell(col, 0).figure;
		// colFigure.setOpaque(false);
		colFigure.erase();
		var bounds = colFigure.getBounds().getCopy();
		colFigure.translateToAbsolute(bounds);
		this.colFigure = colFigure;
		this.startX = bounds.x;
		this.startY = bounds.y;
		figure.cacheData = hostFigure.getUpdateManager().graphicsSource.control.context
				.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
		figure.paintFigure = function(graphics) {
			var bounds = this.getBounds();
			graphics.putImageData(this.cacheData, bounds.x + 5, bounds.y + 5);

		}
		// figure.setBorder(new LineBorder(1,ColorConstants.red));
		figure.setBounds(new Rectangle(0, 0, bounds.width + 10, bounds.height
						+ 10));
		return figure;
	}
});
/**
 * @author jiangqifan
 * @since 2013-4-18
 */
COM.widget.Grid.ChangeColSizeCommand = function ChangeColSizeCommand(label) {

	COM.widget.Grid.ChangeColSizeCommand.superclass.constructor.call(this,
			label);
	this.gridModel = null;
	this.col = 0;
	this.delta = 0;

	this.orginSize = 0;
}

COM.widget.Grid.ChangeColSizeCommand.extend(COM.gef.Command, {
			execute : function() {
				var col = this.gridModel.getCol(this.col);
				var newSize = col.clientSize + this.delta;
				if (newSize < 0) {
					newSize = 0;
				}
				this.orginSize = col.size;
				this.gridModel.setColSize(this.col, newSize);
			},
			redo : function() {
				this.execute();
			},
			undo : function() {
				this.gridModel.setColSize(this.col, this.orginSize);
			},
			setGridModel : function(gridModel) {
				this.gridModel = gridModel;
			},
			getGirdModel : function() {
				return this.gridModel;
			},
			setCol : function(col) {
				this.col = col;
			},
			getCol : function() {
				return this.col;
			},
			setDelta : function(delta) {
				return this.delta = delta;
			},
			getDelta : function() {
				return this.delta;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-4-18
 */
COM.widget.Grid.ChangeRowSizeCommand = function ChangeRowSizeCommand(label) {

	COM.widget.Grid.ChangeRowSizeCommand.superclass.constructor.call(this,
			label);
	this.gridModel = null;
	this.row = 0;
	this.delta = 0;

	this.orginSize = 0;
}

COM.widget.Grid.ChangeRowSizeCommand.extend(COM.gef.Command, {
			execute : function() {
				var row = this.gridModel.getRow(this.row);
				var newSize = row.clientSize + this.delta;
				if (newSize < 0) {
					newSize = 0;
				}
				this.orginSize = row.size;
				this.gridModel.setRowSize(this.row, newSize);
			},
			redo : function() {
				this.execute();
			},
			undo : function() {
				this.gridModel.setRowSize(this.row, this.orginSize);
			},
			setGridModel : function(gridModel) {
				this.gridModel = gridModel;
			},
			getGirdModel : function() {
				return this.gridModel;
			},
			setRow : function(row) {
				this.row = row;
			},
			getRow : function() {
				return this.row;
			},
			setDelta : function(delta) {
				return this.delta = delta;
			},
			getDelta : function() {
				return this.delta;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-5-16
 */
COM.widget.Grid.InsertColsCommand = function InsertColsCommand(label) {

	COM.widget.Grid.InsertColsCommand.superclass.constructor.call(this, label);
	this.gridModel = null;
	this.index = 0;
	this.count = 0;
	this.copyIndex = 0;
	this.copyWay = null;
}

COM.widget.Grid.InsertColsCommand.extend(COM.gef.Command, {
			execute : function() {
				this.gridModel.insertCols(this.index, this.count,
						this.copyIndex, this.copyWay);
			},
			redo : function() {
				this.execute();
			},
			undo : function() {
				this.grid.deleteCols(this.index, this.count);
			},
			setGridModel : function(gridModel) {
				this.gridModel = gridModel;
				return this;
			},
			getGirdModel : function() {
				return this.gridModel;
			},
			setIndex : function(index) {
				this.index = index;
				return this;
			},
			getIndex : function() {
				return this.index;
			},
			setCount : function(count) {
				this.count = count;
				return this;
			},
			getCount : function() {
				return this.count;
			},
			setCopyIndex : function(copyIndex) {
				this.copyIndex = copyIndex;
				return this;
			},
			getCopyIndex : function() {
				return this.copyIndex;
			},
			setCopyWay : function(copyWay) {
				this.copyWay = copyWay;
				return this;
			},
			getCopyWay : function() {
				return this.copyWay;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-5-18
 */
COM.widget.Grid.InsertRowsCommand = function InsertRowsCommand(label) {

	COM.widget.Grid.InsertRowsCommand.superclass.constructor.call(this, label);
}

COM.widget.Grid.InsertRowsCommand.extend(COM.widget.Grid.InsertColsCommand, {
			execute : function() {
				this.gridModel.insertRows(this.index, this.count,
						this.copyIndex, this.copyWay);
			},
			undo : function() {
				this.grid.deleteRows(this.index, this.count);
			}
		});
/**
 * @author jiangqifan
 * @since 2013-5-18
 */
COM.widget.Grid.DeleteColsCommand = function DeleteColsCommand(label) {

	COM.widget.Grid.DeleteColsCommand.superclass.constructor.call(this, label);
}

COM.widget.Grid.DeleteColsCommand.extend(COM.widget.Grid.InsertColsCommand, {
			execute : function() {
				this.gridModel.deleteCols(this.index, this.count);
			},
			undo : function() {
				// TODO
			}
		});
/**
 * @author jiangqifan
 * @since 2013-5-18
 */
COM.widget.Grid.DeleteRowsCommand = function DeleteRowsCommand(label) {

	COM.widget.Grid.DeleteRowsCommand.superclass.constructor.call(this, label);
}

COM.widget.Grid.DeleteRowsCommand.extend(COM.widget.Grid.InsertColsCommand, {
			execute : function() {
				this.gridModel.deleteRows(this.index, this.count);
			},
			undo : function() {
				// TODO
			}
		});
/**
 * @author jiangqifan
 * @since 2013-5-16
 */
COM.widget.Grid.ColExchangeCommand = function ColExchangeCommand(label) {

	COM.widget.Grid.ColExchangeCommand.superclass.constructor.call(this, label);
	this.gridModel = null;
	this.source = 0;
	this.target = 0;
}

COM.widget.Grid.ColExchangeCommand.extend(COM.gef.Command, {
			execute : function() {
				this.success = this.gridModel.exchangeCols(this.source,
						this.target);
			},
			redo : function() {
				this.execute();
			},
			undo : function() {
				if (this.success) {
					this.grid.exchangeCols(this.target, this.source);
				}
			},
			setGridModel : function(gridModel) {
				this.gridModel = gridModel;
				return this;
			},
			getGirdModel : function() {
				return this.gridModel;
			},
			setSource : function(source) {
				this.source = source;
				return this;
			},
			getSource : function() {
				return this.source;
			},
			setTarget : function(target) {
				this.target = target;
				return this;
			},
			getTarget : function() {
				return this.target;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-6-24
 */
COM.widget.Grid.SelectionChangeCommand = function SelectionChangeCommand(label) {

	COM.widget.Grid.SelectionChangeCommand.superclass.constructor.call(this,
			label);
}

COM.widget.Grid.SelectionChangeCommand.extend(COM.gef.Command, {
			execute : function() {
				this.gridModel.changeSelection(this.oldRect, this.newRect);
			},
			undo : function() {
				this.grid.deleteRows(this.index, this.count);
			},
			redo : function() {
				this.execute();
			},
			setGridModel : function(gridModel) {
				this.gridModel = gridModel;
				return this;
			},
			getGirdModel : function() {
				return this.gridModel;
			},
			setOldSelection : function(rect) {
				this.oldRect = rect;
				return this;
			},
			getOldSelection : function() {
				return this.oldRect;
			},
			setNewSelection : function(rect) {
				this.newRect = rect;
				return this;
			},
			getNewSelection : function() {
				return this.newRect;
			},
			setButton : function(button) {
				this.button = button;
			},
			getButton : function() {
				return this.button;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-5-24
 */
/*
 * function TextHelper.cellTextAlign() { this.ctaAuto = 0; //@@ 对齐00，自动判断
 * this.FORE = 1; //@@ 对齐01，前端对齐（上对齐或左对齐） this.BACK = 2; //@@ 对齐02，后端对齐（下对齐或右对齐）
 * this.CENTER = 3; //@@ 对齐03，居中对齐 this.SPARSE = 4; //@@ 对齐04，均匀分散对齐 this.EXTEND =
 * 5; //@@ 对齐05，拉伸对齐 //TODO this.MIGHT_BACK = 6; //@@ 对齐06，自动判断的后端对齐 }
 * 
 * var TextHelper.cellTextAlign = new TextHelper.cellTextAlign();
 */
TextHelper = {};
TextHelper.getPxPerPt = function() {
	var a = document.createElement('div');
	a.style.width = '1in';
	a.style.visible = false;
	a.style.padding = '0px';
	var parent = document.body;
	parent.appendChild(a);
	TextHelper.pxPerPt = a.clientWidth;
};
TextHelper.cellTextAlign = COM.widget.Grid.Cell.ALIGN;
TextHelper.drawText = function(graphics, text, font, rect) {
	if ((text == "") || (text == null))
		return;

	var textLineSpace = 1;
	var textRect = {
		x : rect.x,
		y : rect.y,
		right : rect.x + rect.width,
		bottom : rect.y + rect.height
	}

	var dw;
	var dh;
	var fh;
	var showProportion = 1;
	var fontSize;
	if (font.fontSizeUnit === COM.widget.Grid.Cell.FONT_SIZE_UNIT_PT) {
		if (TextHelper.pxPerPt == null) {
			TextHelper.getPxPerPt();
		}
		fontSize = Math.floor(font.fontSize * TextHelper.pxPerPt / 72);
	} else {
		fontSize = font.fontSize;
	}

	/*
	 * 逻辑简化了，看后面的代码 if (showProportion == 1) { if (!font.vertText) { if
	 * (font.indentPx > 0) { textRect.x += font.indentPx; } else if
	 * (font.indentPx < 0) { textRect.right -= font.indentPx; } else if
	 * (font.indent > 0) { textRect.x += font.indent * Math.abs(fontSize); } }
	 * dw = textRect.right - textRect.x; dh = textRect.bottom - textRect.y; }
	 * else { if (!font.vertText) { if (font.indentPx > 0) { textRect.x +=
	 * font.indentPx; } else if (font.indentPx < 0) { textRect.right -=
	 * font.indentPx; } else if (font.indent > 0) { textRect.x +=
	 * Math.round((font.indent * Math.abs(fontSize) / showProportion)); } } dw =
	 * Math.round((textRect.right - textRect.x) / showProportion); dh =
	 * Math.round((textRect.bottom - textRect.y) / showProportion); }
	 */

	if (font.indentPx > 0) {
		textRect.x += font.indentPx;
	} else if (font.indentPx < 0) {
		textRect.right -= font.indentPx;
	} else if (font.indent > 0) {
		textRect.x += Math
				.round((font.indent * Math.abs(fontSize) / showProportion));
	}

	dw = Math.round((textRect.right - textRect.x) / showProportion);
	dh = Math.round((textRect.bottom - textRect.y) / showProportion);

	var drawBuffer = [];
	var lineCount;
	if (!font.vertText) {
		if (!font.fitFontSize)
			fh = fontSize;
		else
			fh = TextHelper.calcFontAutoHeight(text, fontSize, dw, dh,
					font.multiLine, font.wrapLine);
		lineCount = TextHelper.wrapCellText(text, fh, dw, drawBuffer,
				(font.horzAlign == TextHelper.cellTextAlign.CENTER)
						|| (font.horzAlign == TextHelper.cellTextAlign.SPARSE)
						|| (font.horzAlign == TextHelper.cellTextAlign.EXTEND),
				font.multiLine, font.wrapLine);
	} else {
		if (!font.fitFontSize)
			fh = fontSize;
		else
			fh = TextHelper.calcFontAutoHeight(text, fontSize, dh, dw,
					font.multiLine, font.wrapLine);
		lineCount = TextHelper.wrapCellText(text, fh, dh, drawBuffer,
				(font.vertAlign == TextHelper.cellTextAlign.CENTER)
						|| (font.vertAlign == TextHelper.cellTextAlign.SPARSE)
						|| (font.vertAlign == TextHelper.cellTextAlign.EXTEND),
				font.multiLine, font.wrapLine);
	}

	fh = Math.round(fh * showProportion);
	fh = Math.abs(fh);
	graphics.beginPath();
	var cssfont = "";
	if (font.fontBold)
		cssfont = "bold ";
	if (font.fontItalic)
		cssfont += "italic ";
	if (font.fontUnderLine)
		cssfont += " ";

	// graphics
	if (font.fontColor) {
		graphics.setFillStyle(font.fontColor);
		graphics.setStrokeStyle(font.fontColor);
	}
	if (font.textShadow) {
		graphics.setShadowOffsetX(font.textShadow.offsetX);
		graphics.setShadowOffsetY(font.textShadow.offsetY);
		graphics.setShadowBlur(font.textShadow.blur);
		graphics.setShadowColor(font.textShadow.color);
	}
	cssfont += fh + "px " + font.fontName;
	// graphics
	graphics.setFont(cssfont);

	var aRect = {
		x : textRect.x,
		y : textRect.y,
		right : textRect.right,
		bottom : textRect.bottom
	};

	var hAlign = font.horzAlign;
	var vAlign = font.vertAlign;
	if (!font.vertText) {

		var dsp; // 为行间距
		var lh; // 行高(文本高度+行间距)
		if (vAlign == TextHelper.cellTextAlign.EXTEND) {
			if (lineCount == 1)
				dsp = 0;
			else
				dsp = Math.floor((aRect.bottom - aRect.y - fh * lineCount)
						/ (lineCount - 1));
		} else
			dsp = Math.floor((aRect.bottom - aRect.y - fh * lineCount)
					/ (lineCount + 1));
		if (dsp < 0)
			dsp = 0;
		if (dsp <= textLineSpace) {
			lh = dsp + fh;
			if ((vAlign == TextHelper.cellTextAlign.SPARSE)
					|| (vAlign == TextHelper.cellTextAlign.EXTEND))
				vAlign = TextHelper.cellTextAlign.CENTER;
		} else if ((vAlign != TextHelper.cellTextAlign.SPARSE)
				&& (vAlign != TextHelper.cellTextAlign.EXTEND)) {
			lh = fh + textLineSpace;
			dsp = textLineSpace;
		} else
			lh = fh + dsp;
		dh = lh * lineCount - dsp;
		if ((vAlign == TextHelper.cellTextAlign.FORE)
				|| (vAlign == TextHelper.cellTextAlign.EXTEND))
			aRect.y = aRect.y;
		else if ((vAlign == TextHelper.cellTextAlign.MIGHT_BACK)
				|| (vAlign == TextHelper.cellTextAlign.BACK)) {
			// 特殊处理
			// 在居下显示时，尽量为底部留出3个像素的空隙.后面这个值可以尝试提供配置.
			// 后面需要考虑用户自己是否设置底部padding值，如果设值了，就不再提供这个空隙.
			aRect.y = aRect.bottom - dh
					- Math.min(3, aRect.bottom - aRect.y - dh);
		} else
			aRect.y = Math.floor((aRect.bottom + aRect.y - dh) / 2);
		for (var i = 0; i <= lineCount - 1; i++) {
			if (aRect.y + fh >= textRect.y)
				TextHelper.horzDrawLine(graphics, fh, drawBuffer[i], aRect,
						hAlign, vAlign, font.textStroke, font.decoration, font);
			aRect.y = aRect.y + lh;
			if (aRect.y >= textRect.bottom)
				break;
		}
	} else {

		if (hAlign == TextHelper.cellTextAlign.EXTEND) {
			if (lineCount == 1) {
				dsp = 0;
			} else {
				dsp = Math.floor((aRect.right - aRect.x - fh * lineCount)
						/ (lineCount - 1));
			}
		} else {
			dsp = Math.floor((aRect.right - aRect.x - fh * lineCount)
					/ (lineCount + 1));
		}
		if (dsp < 0) {
			dsp = 0;
		}
		if (dsp <= 0) {
			lh = dsp + fh;
			if (hAlign == TextHelper.cellTextAlign.SPARSE
					|| hAlign == TextHelper.cellTextAlign.EXTEND) {
				hAlign = TextHelper.cellTextAlign.CENTER;
			}
		} else if (hAlign != TextHelper.cellTextAlign.SPARSE
				&& hAlign != TextHelper.cellTextAlign.EXTEND) {
			lh = fh + 0;
			dsp = 0;
		} else {
			lh = fh + dsp;
		}
		dh = lh * lineCount - dsp;

		if (hAlign == TextHelper.cellTextAlign.FORE
				|| hAlign == TextHelper.cellTextAlign.EXTEND) {

		} else if (hAlign == TextHelper.cellTextAlign.MIGHT_BACK
				|| hAlign == TextHelper.cellTextAlign.BACK) {
			aRect.x = aRect.right - dh;
		} else {
			aRect.x = (aRect.right + aRect.x - dh) / 2;
		}

		for (var i = 0; i < lineCount; i++) {
			if (aRect.x + fh >= textRect.x) {
				TextHelper.vertDrawLine(graphics, drawBuffer[i], aRect, vAlign,
						fh/* ,LnFmt */);
				aRect.x += lh;
				if (aRect.x >= textRect.right) {
					break;
				}
			}
		}
	}
}

TextHelper.calcFontFitCell = function(drawHeight, lineLengths, fontHeight,
		lineCount, drawWidth, awrapLine) {
	var textLineSpace = 1;
	var charInLine;
	var ml = 0;
	var lc = 0;
	charInLine = Math.floor(drawWidth / Math.abs(fontHeight) * 2);
	if (charInLine < 2)
		charInLine = 2;
	for (var i = 0; i < lineCount; i++) {
		if (!awrapLine) {
			lc++;
			if (lineLengths[i] > ml)
				ml = lineLengths[i];
		} else
			lc += TextHelper.calcLineOccupy(lineLengths[i], charInLine);
	}
	var result = lc - Math.floor(drawHeight / (fontHeight + textLineSpace));
	if (ml - charInLine > result)
		result = ml - charInLine;
	return result;
}
TextHelper.calcLineOccupy = function(lineLength, charInLine) {
	var result = Math.floor((lineLength + charInLine - 1) / charInLine);
	if (result == 0)
		result = 1;
	return result;
}
TextHelper.wrapLine = function(lineString, charInLine, lines, equalLineLength) {

	var charCount = TextHelper.calcAnsiCharCount(lineString);
	var lineLength = lineString.length;
	var result = TextHelper.calcLineOccupy(charCount, charInLine);
	var p = 0;
	// 当前行的总字符数
	var lineCount;
	// 当前行的字符
	var line;
	var s;
	for (var i = 0; i <= result - 2; i++) {
		if (equalLineLength)
			lineCount = Math.round((charCount) / (result - i) / 2) * 2;
		else
			lineCount = charInLine;
		if (lineCount <= 0)
			lineCount = 1;
		// if(lineCount>=2047)
		// lineCount=Line.length-1;//assert not
		var li = 0;
		var bt;
		line = [];
		while ((lineCount > 0) && (p < lineLength)) {
			bt = lineString.charCodeAt(p);
			if (bt < 255) {
				line[li] = lineString[p];
				li++;
				p++;
				lineCount--;
				charCount--;
			} else if ((li == 0) || (lineCount > 1)) {
				line[li] = lineString[p];
				li++;
				p++;
				lineCount--;
				lineCount--;
				charCount--;
				charCount--;
			} else
				break;
		}
		if (lines != null) {
			s = "";
			for (var k = 0; k < line.length; k++)
				s += line[k];
			lines.push(s);
		}
	}
	if (lines != null) {
		s = lineString.substr(p, lineLength - p + 1);
		lines.push(s);
	}
	return result;
}

/*
 * 计算字符串相当于多少个字符(一个中文宽度为两个字符)
 */
TextHelper.calcAnsiCharCount = function(cellText) {
	var result = 0;
	for (var i = 0; i < cellText.length; i++) {
		var ch = cellText.charCodeAt(i);
		result++;
		if (ch > 255)
			result++;
	}
	return result;
}

TextHelper.wrapCellText = function(cellText, fontHeight, drawWidth, lines,
		equalLineLength, checkMultiLine, lineWrap) {
	var ch;
	// CC: Double;
	var lineString;
	var charInLine;
	var charCount;
	var p;
	var sLen;
	var result;
	var text = new String(cellText);
	charInLine = Math.floor(drawWidth / Math.abs(fontHeight) * 2);
	if (charInLine < 2)
		charInLine = 2;
	charCount = TextHelper.calcAnsiCharCount(cellText);
	if ((charCount == 0) || (!checkMultiLine) && (charCount <= charInLine)
			|| (!checkMultiLine) && (!lineWrap)) {
		result = 1;
		if (lines != null)
			lines.push(cellText);
	} else if (!checkMultiLine) {
		result = TextHelper.wrapLine(cellText, charInLine, lines,
				equalLineLength);
	} else {
		sLen = text.length;
		result = 0;
		p = 0;
		var i = 0;
		while (i < sLen) {
			ch = text.charCodeAt(i);
			if ((ch == 13) || (ch == 10)) {
				lineString = text.substr(p, i - p);
				if (lineWrap)
					result += TextHelper.wrapLine(lineString, charInLine,
							lines, equalLineLength);
				else {
					result++;
					if (lines != null)
						lines.push(lineString);
				}
				p = i + 1;
				if ((p <= sLen) && (text.charCodeAt(p) == 10)) {
					i++;
					p++;
				}
			}
			i++;
		}
		lineString = text.substr(p, sLen + 1 - p);
		if (lineWrap)
			result += TextHelper.wrapLine(lineString, charInLine, lines,
					equalLineLength);
		else {
			result++;
			if (lines != null)
				lines.push(lineString);
		}
	}
	return result;
}

TextHelper.calcFontAutoHeight = function(cellText, fontHeight, drawWidth,
		drawHeight, checkMultiLine, awrapLine) {
	var charCount;
	var fh;
	var minimalFontHeight = 6;
	fontHeight = Math.abs(fontHeight);
	if (cellText == "")
		return fontHeight;
	if (!checkMultiLine) {
		charCount = TextHelper.calcAnsiCharCount(cellText);
		if (!awrapLine)
			fh = Math.floor(drawWidth / charCount * 2);
		else {
			// cx*cy>=sLen
			// DrawWidth/fh*DrawHeigth/fh>=sLen
			/**
			 * Math.LN10不是一个方法，无法理解这一句的意图，直接改用开方来实现.
			 * 
			 * @author jiangqifan
			 * @since 2014-6-20
			 */
			// fh = Math.floor(Math.exp(0.5 * Math.LN10(2 * drawWidth *
			// drawHeight / charCount)));
			fh = Math.floor(Math.sqrt(2 * drawWidth * drawHeight / charCount));
			while (fh > minimalFontHeight) {
				if (floor(drawWidth / fh) * Math.floor(drawHeight / fh) >= Math
						.floor(charCount / 2 + 1))
					break;
				fh--;
			}
		}
	} else {
		var lineLengths = new Array();
		var lc = TextHelper.calcLineLengths(cellText, lineLengths);
		fh = minimalFontHeight;
		var sb = fh;
		var se = fontHeight;
		var sm;
		var flag;
		while (sb <= se) {
			sm = Math.floor((sb + se + 1) / 2);
			flag = TextHelper.calcFontFitCell(drawHeight, lineLengths, sm, lc,
					drawWidth, awrapLine);
			if (flag > 0)
				se = sm - 1;
			else {
				sb = sm + 1;
				fh = sm;
			}
		}
	}
	if (drawHeight < fh)
		fh = drawHeight;
	if (minimalFontHeight > fh)
		fh = minimalFontHeight;
	if (fh > fontHeight)
		fh = fontHeight;
	return fh;
}

TextHelper.calcLineLengths = function(cellText, lineLengths) {
	var ignore10 = false;
	var i;
	var lineLen = 0;
	var textLength;

	textLength = cellText.length;
	var result = 0;
	for (i = 0; i < textLength; i++) {
		var ch = cellText.charCodeAt(i);
		if (ignore10) {
			ignore10 = false;
			if (ch == 10)
				continue;
		}
		lineLen++;
		if (ch > 255)
			lineLen++;
		else if ((ch == 10) || (ch == 13)) {
			lineLen--;
			lineLengths[result] = lineLen;
			result++;
			if (result >= lineLengths.length) {
				if (result < 3000) {
					if (i != 0)
						lineLengths.length = Math.floor(result * textLength / i
								+ 100);
					// else {
					// lineLengths.length = 100;
					// }
				} else
					break;
			}
			lineLen = 0;
			ignore10 = ch == 13;
		}
	}
	if (lineLen > 0) {
		lineLengths[result] = lineLen;
		result++;
	}
	return result;
}

TextHelper.horzDrawLine = function(graphics, size, cellText, aRect, hAlign,
		vAlign, textStroke, decoration, font) {
	// Canvas.fillStyle = "blue";
	// Canvas.fillRect(aRect.left, aRect.top, aRect.right ,aRect.bottom);

	// graphics
	// graphics.setTextAlign("left");
	graphics.setTextAlign("left");
	graphics.setTextBaseline("top");
	var left = aRect.x;
	var len;
	var s;
	/*
	 * if (textWidth(cellText) > aRect.right - aRect.x) { len = 0; s = ""; while
	 * (len < cellText.length) { s += cellText[len]; if
	 * (graphics.measureText(s).width >= aRect.right - aRect.x) break; len++; }
	 * cellText = cellText.substr(0, len); }
	 */
	var width = TextHelper.textWidth(graphics, cellText);
	Decoration = COM.widget.Grid.Cell.DECORATION;
	if (hAlign == TextHelper.cellTextAlign.CENTER) {
		len = Math.floor((aRect.right - aRect.x - width) / 2);
		if (len > 0)
			left += len;
	} else if (hAlign == TextHelper.cellTextAlign.BACK) {
		len = aRect.right - aRect.x - width;
		if (len > 0)
			left += len;
	} else if (hAlign == TextHelper.cellTextAlign.SPARSE) {
		len = Math.floor((aRect.right - aRect.x - width)
				/ (cellText.length + 1));
		var h = aRect.x;
		var left = h + len;
		for (var i = 0; i < cellText.length; i++) {
			s = cellText[i];
			h += len;
			graphics[textStroke ? 'strokeText' : 'fillText'](s, h, aRect.y/*
																			 * ,aRect.right -
																			 * aRect.x
																			 */);
			h += TextHelper.textWidth(graphics, s);
		}
		var right = h;
		TextHelper.drawDecoration(graphics, left, right, aRect.y, size,
				decoration, Decoration);

		/*
		 * if (decoration | Decoration.UNDERLINE) { y = aRect.y + size;
		 * TextHelper.drawLine(graphics, left, right ,y); } if (decoration |
		 * Decoration.STRIKEOUT) { y = aRect.y + size/2;
		 * TextHelper.drawLine(graphics, left, right ,y); }
		 */
		return;
	}
	var maxLengh = aRect.right - aRect.x;
	TextHelper.putText(graphics, cellText, left, aRect.y, textStroke, font,
			size);
	// graphics[textStroke?'strokeText':'fillText'](cellText, left, aRect.y);
	var right = left + width;
	TextHelper.drawDecoration(graphics, left, right, aRect.y, size, decoration,
			Decoration);
	/*
	 * if (decoration | /Decoration.UNDERLINE) { y = aRect.y + size;
	 * TextHelper.drawLine(graphics, left, right ,y); } if (decoration |
	 * /Decoration.STRIKEOUT) { y = aRect.y + size/2;
	 * TextHelper.drawLine(graphics, left, right ,y); }
	 */
	// graphics.stroke();
	// Canvas.drawImage(TextCanvas.canvas, aRect.left, aRect.top);
}
TextHelper.putText = function(graphics, cellText, x, y, textStroke, font, size) {
	graphics[textStroke ? 'strokeText' : 'fillText'](cellText, x, y);
	return;
	if (!font.fontItalic) {
		graphics[textStroke ? 'strokeText' : 'fillText'](cellText, x, y);
	} else {
		// var iamge = TextHelper.createItalicSVGImage(graphics, font ,
		// cellText, size,x ,y);
		// graphics.drawImage(image, x , y);
	}
}
TextHelper.createItalicSVGImage = function(graphics, font, s, size, x, y) {
	var color = font.fontColor || "#000";
	/*
	 * var data = "<svg xmlns='http://www.w3.org/2000/svg' width='500'
	 * height='200'>" + "<foreignObject width='100%' height='100%'>" + "<div
	 * xmlns='http://www.w3.org/1999/xhtml'>" + "<span
	 * style='font-style:italic;font-size:"+size+"px;color:"+color+"'>"+s+"</span>"+ "</div>" + "</foreignObject>" + "</svg>";
	 */
	var data = "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='200'>"
			+ "<foreignObject width='100%' height='100%'>"
			+ "<div xmlns='http://www.w3.org/1999/xhtml' style='font-size:40px'>"
			+ "<em>This is</em> <span style='font-style:italic;font-size:20px'>久其</span> 软 <span style='color:white; text-shadow:0 0 2px blue;'>件</span>"
			+ "</div>" + "</foreignObject>" + "</svg>";
	var DOMURL = self.URL || self.webkitURL || self;
	var img = new Image();
	var svg = new Blob([data], {
				type : "image/svg+xml;charset=utf-8"
			});
	var url = DOMURL.createObjectURL(svg);
	img.onload = function() {
		graphics.drawImage(img, x, y);
		DOMURL.revokeObjectURL(url);
	};

	img.src = url;
	// <span style='color:white; text-shadow:0 0 2px blue;'>件</span>"

}
TextHelper.textWidth = function(graphics, text) {
	var size = graphics.measureText(text);
	return size.width;
}
TextHelper.drawDecoration = function(graphics, left, right, y, height,
		decoration, decorationConstants) {
	var drawY = y;
	if (decoration & decorationConstants.UNDERLINE) {
		drawY = y + height;
		TextHelper.drawLine(graphics, left, right, drawY);
	}
	if (decoration & decorationConstants.STRIKEOUT) {
		drawY = y + height / 2;
		TextHelper.drawLine(graphics, left, right, drawY);
	}
}
TextHelper.drawLine = function(graphics, left, right, y) {
	graphics.beginPath();
	graphics.moveTo(left, (y << 0) + 0.5);
	graphics.lineTo(right, (y << 0) + 0.5);
	graphics.stroke();
}
TextHelper.calculateHeight = function(cell, width) {
	// TODO
	if (cell.showText == null || cell.showText == '') {
		return 0;
	}
	var showText = cell.showText;
	var fontName = cell.fontName;
	var fontSize = TextHelper.calculateFontSize(cell);
	var drawBuffer = [];
	var font = cell;
	var lineCount = TextHelper.wrapCellText(showText, fontSize, width,
			drawBuffer, (font.horzAlign == TextHelper.cellTextAlign.CENTER)
					|| (font.horzAlign == TextHelper.cellTextAlign.SPARSE)
					|| (font.horzAlign == TextHelper.cellTextAlign.EXTEND),
			font.multiLine, font.wrapLine);

	// 计算宽度
	return lineCount * fontSize + 2;

}
TextHelper.calculateWidth = function(cell, height) {
	// TODO
	if (cell.showText == null || cell.showText == '') {
		return 0;
	}
	var showText = cell.showText;
	var fontName = cell.fontName;
	var fontSize = TextHelper.calculateFontSize(cell);
	var font = fontName + " " + fontSize + "px";
	// 计算宽度
	var metrics = FigureUtilities.getFontMetrics(showText, font);
	var width = metrics.width + 2;
	return width;

}
TextHelper.calculateFontSize = function(font) {
	var fontSize = 20;
	if (font.fontSizeUnit === COM.widget.Grid.Cell.FONT_SIZE_UNIT_PT) {
		if (TextHelper.pxPerPt == null) {
			TextHelper.getPxPerPt();
		}
		fontSize = Math.floor(font.fontSize * TextHelper.pxPerPt / 72);
	} else {
		fontSize = font.fontSize;
	}
	return fontSize;
}
TextHelper.vertDrawLine = function(graphics, cellText, aRect, vAlign, fh) {
	var textWidth = function(text) {
		var size = graphics.measureText(text);
		return size.width;
	}
	var textLineSpace = 1;
	var outText;
	var I, sl, dsp, lh, dw;
	sl = cellText.length;

	if (vAlign == TextHelper.cellTextAlign.EXTEND) {
		if (sl == 1) {
			dsp = 0;
		} else {
			dsp = Math.floor((aRect.bottom - aRect.y - fh * sl) / (sl - 1));
		}
	} else {
		dsp = Math.floor((aRect.bottom - aRect.y - fh * sl) / (sl + 1));
	}
	if (dsp < 0) {
		dsp = 0;
	}

	if (dsp <= textLineSpace) {
		lh = dsp + fh;
	}
	if (vAlign == TextHelper.cellTextAlign.SPARSE
			|| vAlign == TextHelper.cellTextAlign.EXTEND) {
		vAlign = TextHelper.cellTextAlign.CENTER;
	} else if (vAlign != TextHelper.cellTextAlign.SPARSE
			&& vAlign != TextHelper.cellTextAlign.EXTEND) {
		lh = fh + textLineSpace;
		dsp = textLineSpace;
	} else {
		lh = fh + dsp;
	}

	dw = lh * sl - dsp;
	if (vAlign == TextHelper.cellTextAlign.FORE
			|| vAlign == TextHelper.cellTextAlign.EXTEND) {

	} else if (vAlign == TextHelper.cellTextAlign.MIGHT_BACK
			|| vAlign == TextHelper.cellTextAlign.BACK) {
		aRect.y = aRect.bottom - dw;
	} else {
		aRect.y = (aRect.bottom + aRect.y - dw) / 2;
	}

	for (var i = 0; i < sl + 1; i++) {
		outText = cellText[i];
		graphics.fillText(outText, aRect.x, aRect.y);
		aRect.y = aRect.y + lh;
	}
};
(function(domain) {
	/**
	 * 绘制背景样式的帮助工具
	 */
	var BackStyleHelper = {
		/**
		 * @arguments {画笔(Html5Graphics),
		 *            横坐标(Number)，纵坐标(Number)，宽度(Number)，高度(Number)，
		 *            样式类型(Number), 背景颜色(字符串)}
		 */
		drawBackStyle : function(graphics, x, y, width, height, style,
				backColor) {
			var pattern = this.oppositePatterns[style];
			backColor = backColor || '#000';
			// 填充颜色
			graphics.setFillStyle(backColor);
			graphics.fillRect(x, y, width, height);
			// 填充样式
			if (pattern) {
				graphics.setFillStyle(pattern);
				graphics.fillRect(x, y, width, height);
			}
		}
		/*
		 * , drawBackStyle3: function (context, x, y , width, height, style
		 * ,backColor) { var pattern = this.oppositePatterns[style]; backColor =
		 * backColor || '#000'; //填充颜色 context.fillStyle = backColor;
		 * context.fillRect(x, y , width, height); //填充样式 if (pattern) {
		 * context.fillStyle = pattern; context.fillRect(x, y , width, height); } },
		 * drawBackStyle2: function (graphics, x, y , width, height, style
		 * ,backColor) { var pattern = this.patterns[style]; backColor =
		 * backColor || '#000'; //填充样式 if (pattern) {
		 * graphics.setFillStyle(pattern); graphics.fillRect(x, y , width,
		 * height); } }
		 */
	};
	BackStyleHelper.patternCreater = (function() {
		var canvas = document.createElement('canvas');
		if (!canvas || !canvas.getContext) {
			this.createOpposite = function() {
			};
			this.create = function() {
			};
			return this;
		}
		var context = canvas.getContext('2d');
		/**
		 * 利用绘制好的背景样式创建填充模式
		 */
		function createStylePattern(data) {
			var height = data.length;
			var width = data[0].length;
			canvas.width = width;
			canvas.height = height;
			paintStyleOpposite(context, 0, 0, width, height, data, 0, 0.5);
			var pattern = context.createPattern(canvas, "repeat");
			return pattern;
		}
		/**
		 * 绘制背景样式
		 */
		function paintStyle(context, x, y, width, height, data, backColor,
				offsetX, offsetY) {
			var beginX = (x << 0) + offsetX;
			var beginY = (y << 0) + offsetY;
			var paintX = beginX;
			var paintY = beginY;
			for (var i = 0; i < height; i++) {
				paintX = beginX;
				for (var j = 0; j < width; j++) {
					context.strokeStyle = data[i % 8][j % 8]
							? backColor
							: "#fff";
					context.beginPath();
					context.moveTo(paintX, paintY);
					context.lineTo(paintX + 1, paintY);
					context.stroke();
					paintX++;
				}
				paintY++;
			}
		}
		/**
		 * 绘制反向背景样式
		 */
		function paintStyleOpposite(context, x, y, width, height, data,
				offsetX, offsetY) {
			var beginX = (x << 0) + offsetX;
			var beginY = (y << 0) + offsetY;
			var paintX = beginX;
			var paintY = beginY;
			for (var i = 0; i < height; i++) {
				paintX = beginX;
				for (var j = 0; j < width; j++) {
					if (data[i % 8][j % 8] == 0) {
						context.strokeStyle = "#fff";
						context.beginPath();
						context.moveTo(paintX, paintY);
						context.lineTo(paintX + 1, paintY);
						context.stroke();
					}
					paintX++;
				}
				paintY++;
			}
		}
		/**
		 * 
		 */
		this.createOpposite = createStylePattern;
		/**
		 * 
		 */
		this.create = createStylePattern;
		return this;
	}());

	// 为BackStyleHelper的patterns赋值
	(function(helper) {
		var styleDatas = [[// cbsDiagCrossLine

				[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 1, 0, 1, 0, 1, 0, 1]],

				[// cbsDiagCrossBlock

				[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsCruxBlock

				[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 0, 0, 0],

						[1, 1, 0, 1, 1, 0, 0, 0],

						[0, 0, 1, 0, 0, 0, 0, 0],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 1, 0],

						[1, 0, 0, 0, 1, 1, 0, 1],

						[0, 0, 0, 0, 0, 0, 1, 0]],

				[// cbsCrossDot

				[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsDiagCrossDot

				[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 1, 0, 0, 0, 1],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 1, 0, 0, 0, 1]],

				[// cbsHorzLine

				[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 1, 1, 1, 1, 1, 1, 1],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 1, 1, 1, 1, 1, 1, 1],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 1, 1, 1, 1, 1, 1, 1],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 1, 1, 1, 1, 1, 1, 1]],

				[// cbsVertLine

				[0, 1, 0, 1, 0, 1, 0, 1],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[0, 1, 0, 1, 0, 1, 0, 1]],

				[// cbsBDiagLine

				[0, 0, 0, 1, 0, 0, 0, 1],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[1, 0, 0, 0, 1, 0, 0, 0],

						[0, 0, 0, 1, 0, 0, 0, 1],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[1, 0, 0, 0, 1, 0, 0, 0]],

				[// cbsFDiagLine

				[1, 0, 0, 0, 1, 0, 0, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 0, 1, 0, 0, 0, 1],

						[1, 0, 0, 0, 1, 0, 0, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 0, 1, 0, 0, 0, 1]],

				[// cbsHorzLineSparse

				[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 1, 1, 1, 1, 1, 1, 1],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 1, 1, 1, 1, 1, 1, 1],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsVertLineSparse

				[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 0, 1, 0]],

				[// cbsHorzDashDot

				[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[1, 1, 1, 1, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsVertDashDot

				[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 1, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsWall

				[0, 0, 1, 0, 0, 0, 0, 0],

						[0, 0, 1, 0, 0, 0, 0, 0],

						[0, 0, 1, 0, 0, 0, 0, 0],

						[1, 1, 1, 1, 1, 1, 1, 1],

						[0, 0, 0, 0, 0, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 1, 0],

						[1, 1, 1, 1, 1, 1, 1, 1]],

				[// cbsTrees

				[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 1, 0, 0, 1, 0, 0, 1],

						[0, 0, 1, 0, 1, 0, 1, 0],

						[0, 0, 0, 1, 1, 1, 0, 0],

						[0, 0, 0, 1, 0, 1, 0, 0],

						[0, 0, 0, 1, 0, 1, 0, 0],

						[0, 1, 1, 1, 1, 1, 1, 1],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsGrass

				[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 1, 0, 1, 0, 0],

						[0, 0, 1, 0, 1, 0, 1, 0],

						[0, 0, 1, 0, 1, 0, 1, 0],

						[0, 0, 0, 0, 1, 0, 0, 0],

						[0, 0, 0, 0, 1, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsFlowers

				[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 1, 0, 1, 0, 0, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[0, 0, 0, 1, 0, 0, 0, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[0, 0, 1, 0, 1, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsRounds

				[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 1, 1, 1, 0, 0, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[0, 0, 1, 1, 1, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsLozenges

				[0, 0, 0, 1, 0, 0, 0, 0],

						[0, 0, 1, 0, 1, 0, 0, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[1, 0, 0, 0, 0, 0, 1, 0],

						[0, 1, 0, 0, 0, 1, 0, 0],

						[0, 0, 1, 0, 1, 0, 0, 0],

						[0, 0, 0, 1, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsDiagCrux

				[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 1, 0, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 1, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 1, 0, 0, 1, 0, 0],

						[0, 1, 0, 0, 0, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsHills

				[1, 0, 0, 0, 0, 0, 0, 1],

						[0, 1, 0, 0, 0, 0, 1, 0],

						[0, 0, 1, 0, 0, 1, 0, 0],

						[0, 0, 0, 0, 0, 0, 0, 0],

						[0, 0, 0, 1, 1, 0, 0, 0],

						[0, 0, 1, 0, 0, 1, 0, 0],

						[0, 1, 0, 0, 0, 0, 1, 0],

						[0, 0, 0, 0, 0, 0, 0, 0]],

				[// cbsGridLine

				[1, 1, 1, 1, 1, 1, 1, 1],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[1, 1, 1, 1, 1, 1, 1, 1],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[1, 1, 1, 1, 1, 1, 1, 1],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[1, 1, 1, 1, 1, 1, 1, 1],

						[1, 0, 1, 0, 1, 0, 1, 0]],

				[// cbsDiagBlock

				[1, 0, 0, 1, 1, 0, 0, 1],

						[0, 1, 1, 0, 0, 1, 1, 0],

						[0, 1, 1, 0, 0, 1, 1, 0],

						[1, 0, 0, 1, 1, 0, 0, 1],

						[1, 0, 0, 1, 1, 0, 0, 1],

						[0, 1, 1, 0, 0, 1, 1, 0],

						[0, 1, 1, 0, 0, 1, 1, 0],

						[1, 0, 0, 1, 1, 0, 0, 1]],

				[// cbsHorzDiagBlock

				[1, 1, 0, 0, 1, 1, 0, 0],

						[0, 0, 1, 1, 0, 0, 1, 1],

						[1, 1, 0, 0, 1, 1, 0, 0],

						[0, 0, 1, 1, 0, 0, 1, 1],

						[1, 1, 0, 0, 1, 1, 0, 0],

						[0, 0, 1, 1, 0, 0, 1, 1],

						[1, 1, 0, 0, 1, 1, 0, 0],

						[0, 0, 1, 1, 0, 0, 1, 1]],

				[// cbsVertDiagBlock

				[1, 0, 1, 0, 1, 0, 1, 0],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[1, 0, 1, 0, 1, 0, 1, 0],

						[0, 1, 0, 1, 0, 1, 0, 1],

						[0, 1, 0, 1, 0, 1, 0, 1]]

		];
		var oppositePatterns = [];
		for (var i = 0; i < styleDatas.length; i++) {
			oppositePatterns[i] = helper.patternCreater
					.createOpposite(styleDatas[i]);
		}

		helper.oppositePatterns = oppositePatterns;
	}(BackStyleHelper));

	domain.BackStyleHelper = BackStyleHelper;
}(COM));

/**
 * @author jiangqifan
 * @since 2013-4-24
 */
/**
 * 刀把图解决方案： 1.合并单元格在画右边框和下边框时，进行拆分。按照每个被合并单元格的边框来画 2.凸起样式的边框： 问题：需要画两条线
 */
COM.widget.Grid.CellFigure = function CellFigure() {
	COM.widget.Grid.CellFigure.superclass.constructor.call(this);
	// this.setBorder(new LineBorder(1));
	this.setOpaque(true);
	// f.setBackgroundColor(ColorConstants.green);
	// this.setLayoutManager(new XYLayout());

	this.cellMode = COM.widget.Grid.Cell.Cell_MODE_NORMAL;
	// this.backImageStyle = model.style.image.backImageStyle;
	// this.setToolTip(this.model.title);
	this.textLeft = 0;
};

COM.widget.Grid.CellFigure.extend(Figure, { // Figure
	containsPoint : function(arg1, arg2) {
		if (arg1 == null) {
			return;
		}
		var x;
		var y;
		if (Util.isInstanceOf(arg1, Point)) {
			x = arg1.x;
			y = arg1.y;
		} else if (arg2 != null) {
			x = arg1;
			y = arg2;
		}
		var bounds = this.getBounds().getCopy();
		if (this.gridOffset) {
			bounds.translate(this.gridOffset.x, this.gridOffset.y);
			bounds.width -= this.gridOffset.x;
			bounds.height -= this.gridOffset.y;
		}
		return bounds.contains(x, y);
	},
	setBorderHidden : function(hidden) {
		this.borderHidden = hidden;
	},
	getBorderHidden : function() {
		return this.borderHidden;
	},
	isMergeHead : function() {
		return this.rowSpan != 1 || this.colSpan != 1;
	},
	setRowSpan : function(rowSpan) {
		this.rowSpan = rowSpan;
	},
	setColSpan : function(colSpan) {
		this.colSpan = colSpan;
	},
	getRowSpan : function() {
		return this.rowSpan;
	},
	getColSpan : function() {
		return this.colSpan;
	},
	// back
	setGradientBackground : function(gradient) {
		this.gradientBackground = gradient;
	},
	setBackColor : function(backColor) {
		this.backColor = backColor;
	},
	setBackStyle : function(backStyle) {
		this.backStyle = backStyle;
	},
	getBackStyle : function() {
		return this.backStyle;
	},
	// backImage
	setBackImage : function(back) {
		if (this.backImage == back) {
			return;
		}
		if (this.backImage && this.backImage.removeLoadListener) {
			this.backImage.removeLoadListener(this);
		}
		this.backImage = back;
		back.addLoadListener(this);
	},
	setBackImageStyle : function(style) {
		this.backImageStyle = style;
	},
	setBackImageHorizion : function(h) {
		this.backImageHorizion = h;
	},
	setBackImageVertical : function(v) {
		this.backImageVertical = v;
	},
	setBackImageBounds : function(bounds) {
		this.backImageBounds = bounds;
	},
	setBorderStyle : function(borders) {
		this.borderStyle = borders;
	},
	setBorderColor : function(colors) {
		this.borderColor = colors;
	},
	setControl : function(control) {
		var controlParent = this.controlParent;
		if (controlParent && this.control
				&& this.control.parentNode == controlParent) {
			controlParent.removeChild(this.control);
		}
		this.control = control;
		var rect = this.getBounds();
		var copy = rect.getCopy();
		this.translateToAbsolute(copy);
		// 定位
		this.locateControl(copy.x, copy.y);
		// 改变大小
		var size = this.getControlSize(copy.width, copy.height);

		this.resizeControlParent(size.width, size.height);
		this.fireControlResize(size.width, size.height);
	},
	setHtml : function(html) {
		var controlParent = this.controlParent;
		if (controlParent && this.html) {
			controlParent.innerHtml = "";
		}
		this.html = html;
		var rect = this.getBounds();
		var copy = rect.getCopy();
		this.translateToAbsolute(copy);
		// 定位
		this.locateControlWithOutPadding(copy.x, copy.y);
		// 改变大小
		var size = this.getControlSize(copy.width, copy.height);

		this.resizeControlParent(size.width, size.height);
	},
	/**
	 * 计算控件大小（单元格大小减去右下边框的宽度）
	 * 
	 * @param {}
	 *            width
	 * @param {}
	 *            height
	 * @return {}
	 */
	getControlSize : function(width, height) {
		width = width - this.getRightBorderWidth();
		height = height - this.getBottomBorderWidth();

		var padding = this.getPadding();
		if (padding) {
			width -= padding.left;
			width -= padding.right;
			height -= padding.top;
			height -= padding.bottom;
		}

		return new Dimension(width, height);
	},
	getBackImage : function() {
		return this.backImage;
	},
	getGradientBackgound : function() {
		return this.gradientBackground;
	},
	getBackImageStyle : function() {
		return this.backImageStyle;
	},
	getBackImageHorizion : function() {
		return this.backImageHorizion;
	},
	getBackImageVertical : function() {
		return this.backImageVertical;
	},
	getBackImageBounds : function() {
		return this.backImageBounds;
	},
	getBorderStyle : function() {
		return this.borderStyle;
	},
	getBorderColor : function() {
		return this.borderColor;
	},
	getControl : function() {
		return this.control;
	},
	getHtml : function() {
		return this.html;
	},
	getBackMode : function() {
		return this.backMode;
	},
	getBackColor : function() {
		return this.backColor;
	},
	appendControl : function(zindex, parent) {
		if (this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_CONTROL) {
			if (this.getControl() != null) {
				var controlParent = this.getControlParent(zindex);
				if (this.td) {
					this.td.appendChild(this.getControl());
				} else {
					controlParent.appendChild(this.getControl());
				}
				parent.appendChild(controlParent);
				this.fireControlArrived();
			}
		} else if (this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_HTML) {
			if (this.getHtml() != null) {
				var controlParent = this.getControlParent(zindex);
				if (this.td) {
					this.td.innerHTML = this.getHtml();
				} else {
					controlParent.innerHTML = this.getHtml();
				}
				parent.appendChild(controlParent);
			}
		}
	},
	setCellMode : function(mode) {
		this.cellMode = mode;
		switch (mode) {
			case COM.widget.Grid.Cell.Cell_MODE_TREE :
				this.addTreeFigure(false, false, null, 0);
				break;
			case COM.widget.Grid.Cell.Cell_MODE_NORMAL :
				if (this.tree) {
					this.remove(this.tree);
				}
				var controlParent = this.controlParent;
				if (controlParent && controlParent.parentNode) {
					controlParent.parentNode.removeChild(controlParent);
				}
				break;
		}
	},
	/**
	 * 移除图形时使用
	 */
	dropControl : function() {
		if (this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_CONTROL
				|| this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_HTML) {

			var controlParent = this.getControlParent();
			if (controlParent && controlParent.parentNode) {
				controlParent.parentNode.removeChild(controlParent);
			}

		}
	},
	// 用于内存回收的dispose
	dispose : function() {
		COM.widget.Grid.CellFigure.superclass.dispose.call(this);
		if (this.backImage && this.backImage.removeLoadListener) {
			this.backImage.removeLoadListener(this);
		}
		this.backImage = null;
		delete this.controlParent;
		delete this.table;
		delete this.td;
	},
	hideControl : function() {
		if (this.isCustomize()) {
			if (this.getControlParent()) {
				this.getControlParent().style.visibility = 'hidden';
			}
		}
	},
	setVisible : function(value) {
		COM.widget.Grid.CellFigure.superclass.setVisible.call(this, value);
		if (!value) {
			this.hideControl();
		}
	},
	locateControl : function(x, y) {
		var padding = this.getPadding();
		if (padding) {
			x += padding.left || 0;
			y += padding.top || 0;
		}
		this.controlLocation = {
			'x' : x,
			'y' : y
		};
	},
	// 如果是html, 则不考虑padding.没有什么特别的原因，之前就是这么做的。如果html显示有问题的话再调。
	locateControlWithOutPadding : function(x, y) {
		this.controlLocation = {
			'x' : x,
			'y' : y
		};
	},
	getControlLocation : function() {
		return this.controlLocation;
	},
	realLocateControl : function(x, y) {
		this.getControlParent().style.left = x + 'px';
		this.getControlParent().style.top = y + 'px';
	},
	resizeControlParent : function(width, height) {

		// var padding = this.getPadding();
		// if (padding && padding.top) {
		// height -= padding.top;
		// }
		// if (padding && padding.left) {
		// width -= padding.left;
		// }
		// if (padding && padding.bottom) {
		// height -= padding.bottom;
		// }
		// if (padding && padding.right) {
		// width -= padding.right;
		// }

		// parent
		this.getControlParent().style.width = width + 'px';
		this.getControlParent().style.height = height + 'px';
		// if (this.td) {
		// -2是因为如果内容过多会有一些内容显示在边框上，效果不好看
		// this.td.style.width = width - 2 + 'px';
		// this.td.style.height = height - 2 + 'px';
		// }
		// control
		/*
		 * if (this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_CONTROL) {
		 * var control = this.getControl(); if (control == null) { return; }
		 * this.getControl().style.width = width + 'px';
		 * this.getControl().style.height = height + 'px'; }
		 */
	},
	getControlParent : function(zindex) {
		if (this.controlParent == null) {
			var potionProvider = this.getColorProvider();
			if (potionProvider && potionProvider.isTableCell()) {
				var table = document.createElement('table');
				table.style.zIndex = zindex;
				table.style.width = '0px';
				table.style.height = '0px';
				table.style.position = "absolute";
				table.style.visibility = 'hidden';
				table.style.overflow = 'hidden';
				table.style.whiteSpace = 'nowrap';
				table.style.tableLayout = 'fixed';
				table.style.borderCollapse = "collapse";

				var tr = document.createElement('tr');
				var td = document.createElement('td');
				td.style.overflow = 'hidden';
				tr.appendChild(td);
				table.appendChild(tr);
				this.table = table;
				this.td = td;

				this.controlParent = table;
				if (this.font) {
					this.td.style.verticalAlign = COM.widget.Grid.Cell.ALIGN
							.getCssStr(this.font.vertAlign, true);
					this.td.style.textAlign = COM.widget.Grid.Cell.ALIGN
							.getCssStr(this.font.horzAlign);
				}

			} else {

				this.controlParent = document.createElement('div');

				this.controlParent.style.zIndex = zindex;
				this.controlParent.style.width = '0px';
				this.controlParent.style.height = '0px';
				this.controlParent.style.position = "absolute";
				this.controlParent.style.visibility = 'hidden';
				this.controlParent.style.overflow = 'hidden';
				this.controlParent.style.whiteSpace = 'nowrap';

				var padding = this.getPadding();
				if (padding && this.isHtml()) {
					this.controlParent.style.paddingLeft = padding.left + 'px';
					this.controlParent.style.paddingRight = padding.right
							+ 'px';
					this.controlParent.style.paddingTop = padding.top + 'px';
					this.controlParent.style.paddingBottom = padding.bottom
							+ 'px';
				}
			}
			// 将属性同步到Html上.
			if (this.font) {
				if (this.font.decoration) {
					this.syncCss('decoration', this.font.decoration);
				}
				if (this.font.fontColor) {
					this.syncCss('color', this.font.fontColor);
				}

			}

		}
		if (zindex != null) {
			this.controlParent.style.zIndex = zindex;
		}
		return this.controlParent;
	},
	setBounds : function(rect) {
		var x = this.getBounds().x;
		var y = this.getBounds().y;

		var resize = (rect.width != this.getBounds().width)
				|| (rect.height != this.getBounds().height);
		var translate = (rect.x != x) || (rect.y != y);

		if ((resize || translate) && this.isVisible())
			// this.erase();
			if (translate) {
				var dx = rect.x - x;
				var dy = rect.y - y;

				this.primTranslate(dx, dy);
			}

		this.getBounds().width = rect.width;
		this.getBounds().height = rect.height;
		if (translate || resize) {
			if (resize) {
				this.invalidate();
				if (this.isCustomize()) {
					var temp_size = this
							.getControlSize(rect.width, rect.height);
					this.resizeControlParent(temp_size.width, temp_size.height);
					if (this.isControl()) {
						this.fireControlResize(temp_size.width,
								temp_size.height);
					}
				}
			}
			this.fireFigureMoved();
			// this.repaint();
			if (translate && this.isCustomize()) {
				var copy = rect.getCopy();
				this.translateToAbsolute(copy);
				// var padding = this.getPadding();
				// if (padding) {
				// this.locateControl(copy.x + padding.left, copy.y +
				// padding.top);
				// } else {
				// this.locateControl(copy.x,copy.y);
				// }
				if (this.isControl()) {
					this.locateControl(copy.x, copy.y);
				} else {
					this.locateControlWithOutPadding(copy.x, copy.y);
				}

			}
		}
	},
	/**
	 * 单元格内容为控件时，不受padding的影响 为Html时，要受padding的影响
	 * 
	 * @param {}
	 *            padding
	 */
	setPadding : function(padding) {
		if (padding == this.getPadding()
				|| (padding != null && padding.equals(this.getPadding()))) {
			return;
		}
		this.padding = padding;
		if (this.isCustomize()) {
			if (this.isControl()) {
				// 如果是控件，就设置控件的位置以及大小
				var copy = this.getBounds().getCopy();
				this.translateToAbsolute(copy);
				// copy.crop(padding);
				this.locateControl(copy.x, copy.y);
				var size = this.getControlSize(copy.width, copy.height);
				this.resizeControlParent(size.width, size.height);
				this.fireControlResize(size.width, size.height);
			} else {
				// 如果是html，就设置controlParent的padding值
				var top = 0, left = 0, bottom = 0, right = 0;
				if (padding) {
					top = padding.top;
					left = padding.left;
					bottom = padding.bottom;
					right = padding.right;
				}
				var controlParent = this.getControlParent();
				var target;
				if (this.td) {
					target = this.td;
				} else {
					target = controlParent;
				}
				// control的情况也可以考虑看可否用这样的方式设置padding，然后就只需要设置control的大小就行了。
				target.style.paddingLeft = left + 'px';
				target.style.paddingRight = right + 'px';
				target.style.paddingTop = top + 'px';
				target.style.paddingBottom = bottom + 'px';
				var copy = this.getBounds().getCopy();
				var size = this.getControlSize(copy.width, copy.height);
				this.resizeControlParent(size.width, size.height);
			}
		} else {
			this.invalidate();
		}
	},
	getPadding : function() {
		return this.padding;
	},
	fireControlResize : function(width, height) {
		if (!this.getControl()) {
			return;
		}
		var figureListeners = this.eventListeners
				.getListeners("ControlResizeListener");
		if (!figureListeners) {
			return;
		}
		while (figureListeners.hasNext()) {
			figureListeners.next().controlResized(this, width, height);
		}
	},

	fireControlArrived : function() {

		var figureListeners = this.eventListeners
				.getListeners("ControlArrivedListener");
		if (!figureListeners) {
			return;
		}
		while (figureListeners.hasNext()) {
			figureListeners.next().controlArrived(this);
		}
	},
	setControlSize : function(width, height) {
		var control = this.getControl();
		if (control != null) {
			control.style.width = width + 'px';
			control.style.height = height + 'px';
		}
	},
	isCustomize : function() {
		return this.isControl() || this.isHtml();
	},
	isControl : function() {
		return this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_CONTROL;
	},
	isHtml : function() {
		return this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_HTML;
	},
	getCellMode : function() {
		return this.cellMode;
	},
	getSpan : function() {
		return this.span;
	},
	setSpan : function(h, v) {
		this.span = {
			'h' : h,
			'v' : v
		};
	},
	addTreeFigure : function(expandable, checkable, treeImage, depth) {
		var tree = this.createTreeFigure(expandable, checkable, treeImage,
				depth);
		this.setTree(tree);
	},
	createTreeFigure : function(expandable, checkable, treeImage, depth) {
		var tree = new COM.widget.Grid.TreeFigure(this, expandable, checkable,
				treeImage, depth);
		return tree;
	},
	setTree : function(tree) {
		if (this.tree != null) {
			this.remove(tree);
		}
		this.tree = tree;
		this.add(tree, null, 0);
	},
	getTree : function() {
		return this.tree;
	},
	layout : function() {
		if (this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_CONTROL
				|| this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_HTML) {
			return;
		}
		var width = 0;
		var bounds = this.getBounds();
		if (this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_TREE) {
			var tree = this.getTree();
			if (tree != null) {
				var size = this.tree.getPreferredSize(-1, -1);
				tree.setBounds(new Rectangle(0, 0, size.width, bounds.height));
				width = size.width;
			}
		}
		this.textLeft = width;
	},
	useLocalCoordinates : function() {
		return this;
	},/*
		 * clearCache: function () { this.imageData = null; }, repaint: function
		 * (a,b,c,d) { this.clearCache();
		 * COM.widget.Grid.CellFigure.superclass.repaint.call(this,a,b,c,d); },
		 */
	paint : function(graphics) {
		/*
		 * 在绘制单元格时使用缓存 var bounds = this.getBounds(); if (this.imageData ==
		 * null) { if(bounds == null || bounds.isEmpty()) return; var
		 * figureCanvas = COM.widget.Grid.CellFigure.CANVAS_INSTANCE;
		 * figureCanvas.width = bounds.width; figureCanvas.height =
		 * bounds.height; var context = figureCanvas.getContext("2d"); var g =
		 * new Html5Graphics(context,new
		 * Rectangle(0,0,bounds.width,bounds.height));
		 * g.translate(-bounds.x,-bounds.y); g.pushState(); this.paintFigure(g);
		 * g.restoreState(); if (!this.getBorderHidden()) { g.pushState();
		 * this.paintBorder(g); g.restoreState(); } //170 if (this.getTree()) {
		 * g.pushState(); g.translate(this.getBounds().x +
		 * this.getInsets().left,this.getBounds().y + this.getInsets().top);
		 * this.getTree().paint(g); g.restoreState(); } this.imageData =
		 * g.getImageData(0,0,bounds.width,bounds.height); }
		 * graphics.putImageData(this.imageData,bounds.x,bounds.y);
		 */
		if (this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_CONTROL
				|| this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_HTML) {
			var controlLocation = this.getControlLocation();
			if (controlLocation) {
				this.realLocateControl(controlLocation.x, controlLocation.y);
			}
			this.getControlParent().style.visibility = 'visible';

			var bounds = this.getBounds();
			graphics.pushState();
			// paint back
			graphics.translate(bounds.x, bounds.y);
			this.paintBack(graphics);

			graphics.restoreState();

		} else {
			graphics.pushState();
			this.paintFigure(graphics);
			graphics.restoreState();

			if (this.getTree()) {
				graphics.pushState();
				graphics.translate(this.getBounds().x + this.getInsets().left,
						this.getBounds().y + this.getInsets().top);
				this.getTree().paint(graphics);
				graphics.restoreState();
			}
		}
		if (!this.getBorderHidden()) {
			graphics.pushState();
			this.paintBorder(graphics);
			graphics.restoreState();
		}
	},

	paintText : function(graphics) {
		var font = this.getFont();
		var text = this.getText();
		var cellBounds = this.getBounds();
		var bounds = new Rectangle(this.textLeft, 0, cellBounds.width
						- this.textLeft, cellBounds.height);
		bounds.width -= this.getRightBorderWidth();
		bounds.height -= this.getBottomBorderWidth();
		var padding = this.getPadding();
		bounds.crop(padding);
		graphics.clipRect(bounds);
		TextHelper.drawText(graphics, text, font, bounds);
	},
	paintFigure : function(graphics) {
		// if (this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_CONTROL ||
		// this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_HTML){
		// this.getControlParent().style.visibility = 'visible';
		// return;
		// }

		if (!this.isOpaque()) {
			return;
		}
		var bounds = this.getBounds();
		graphics.pushState();
		graphics.translate(bounds.x, bounds.y);

		// paint Back
		graphics.pushState();
		this.paintBack(graphics);
		graphics.restoreState();

		// paint backImage
		graphics.pushState();
		this.paintImage(graphics);
		graphics.restoreState();

		// paint text
		if (this.getText() && this.getText() != '') {
			graphics.pushState();
			this.paintText(graphics);
			graphics.restoreState();
		}

		if (this.selected > 0 && !this.isCurrent) {
			graphics.pushState();
			this.paintSelected(graphics);
			graphics.restoreState();
		}
		// TODO 当前单元格是否隐藏边框
		if (this.isCurrent) {
			graphics.pushState();
			this.paintCurrent(graphics);
			graphics.restoreState();
		}

		graphics.restoreState();
	},
	setSelected : function(value) {
		if (this.selected == null) {
			this.selected = 0;
		}
		if (value) {
			this.selected++;
		} else {
			this.selected--;
			this.selected = Math.max(0, this.selected);
		}
		return this;
	},
	clearSelected : function() {
		this.selected = 0;
	},
	setCurrent : function(value) {
		this.isCurrent = value;
		return this;
	},
	setColorProvider : function(provider) {
		this.colorProvider = provider;
	},
	/**
	 * optionProvider
	 * 
	 * @return {}
	 */
	getColorProvider : function() {
		return this.colorProvider;
	},
	paintSelected : function(graphics) {
		var bounds = this.getBounds();
		graphics.setFillStyle(this.getColorProvider().getSelectionColor());
		graphics.fillRect(0, 0, bounds.width, bounds.height);
	},
	paintCurrent : function(graphics) {
		var bounds = this.getBounds();
		graphics.setFillStyle(this.getColorProvider().getCurrentCellColor());
		graphics.fillRect(0, 0, bounds.width, bounds.height);
	},
	calculateBackColor : function() {
		var colorProvider = this.getColorProvider();
		var backColor = this.getBackColor();
		if (backColor == null || backColor == "") {
			backColor = colorProvider.getDefaultBackColor();
		}
		return backColor;
	},
	paintBack : function(graphics) {
		var bounds = this.getBounds();
		var style = this.getBackStyle() || COM.widget.Grid.Cell.BACK_STYLE.FILL;
		var backColor = this.calculateBackColor();
		var data = this.getGradientBackgound();
		var gradient;
		var fillStyle;
		// set color
		if (data) {
			if (data.direction === COM.widget.Grid.Cell.DIRECTION_VERTI) {
				gradient = graphics
						.createLinearGradient(0, 0, 0, bounds.height);
			} else {
				gradient = graphics.createLinearGradient(0, 0, bounds.width, 0);
			}
			gradient.addColorStop(0, data.begin);
			gradient.addColorStop(1, data.end);
			fillStyle = gradient
		} else if (backColor) {
			fillStyle = backColor;
		} else {
			fillStyle = '#fff';
		}

		// piant backStyle
		if (style == COM.widget.Grid.Cell.BACK_STYLE.FILL) {
			graphics.setFillStyle(fillStyle);
			graphics.fillRect(0, 0, bounds.width, bounds.height);
		} else {
			COM.BackStyleHelper.drawBackStyle(graphics, 0, 0, bounds.width,
					bounds.height, style - 2, fillStyle);
		}
	},
	setBackImage : function(backImage) {
		if (backImage == this.backImage) {
			return;
		}
		this.backImage = backImage;
		if (this.backImage && this.backImage.addLoadListener) {
			this.backImage.addLoadListener(this);
		}
	},
	paintImage : function(graphics) {
		var bounds = this.getBounds();
		var image = this.getBackImage();
		var align = COM.widget.Grid.Cell.ALIGN;
		if (image != null) {
			var style = this.getBackImageStyle();
			if (style === COM.widget.Grid.Cell.BACK_IMAGE_STYLE_REPEAT) {
				// 平铺
				var pattern = graphics.createPattern(image, 'repeat');
				graphics.setFillStyle(pattern);
				graphics.fillRect(0, 0, bounds.width, bounds.height);
				// graphics.drawImage(image,0,0);
			} else if (style === COM.widget.Grid.Cell.BACK_IMAGE_STYLE_REPEAT_X) {
				// 平铺
				var pattern = graphics.createPattern(image, 'repeat-x');
				graphics.setFillStyle(pattern);
				graphics.fillRect(0, 0, bounds.width, bounds.height);
			} else if (style === COM.widget.Grid.Cell.BACK_IMAGE_STYLE_REPEAT_Y) {
				// 平铺
				var pattern = graphics.createPattern(image, 'repeat-y');
				graphics.setFillStyle(pattern);
				graphics.fillRect(0, 0, bounds.width, bounds.height);
			} else if (style === COM.widget.Grid.Cell.BACK_IMAGE_STYLE_STRETCH) {
				// 拉伸
				graphics.drawImage(image, 0, 0, bounds.width, bounds.height);
			} else if (style === COM.widget.Grid.Cell.BACK_IMAGE_STYLE_POSITION) {
				// 位置
				var h = this.getBackImageHorizion();
				var v = this.getBackImageVertical();
				var width = image.width;
				var height = image.height;
				var x = 0;
				var y = 0;
				switch (h) {
					case align.FORE :
						x = 0;
						break;
					case align.CENTER :
						x = (bounds.width - width - this.getRightBorderWidth())
								/ 2;
						break;
					case align.BACK :
						x = bounds.width - width - this.getRightBorderWidth();
						break;
					default :
						x = 0;
				}
				switch (v) {
					case align.FORE :
						y = 0;
						break;
					case align.CENTER :
						y = (bounds.height - height - this
								.getBottomBorderWidth())
								/ 2;
						break;
					case align.BACK :
						y = bounds.height - height
								- this.getBottomBorderWidth();
						break;
					default :
						y = 0;
				}
				graphics.drawImage(image, (x >> 0), (y >> 0));
			} else if (style === COM.widget.Grid.Cell.BACK_IMAGE_STYLE_BOUNDS) {
				// 边界
				var imageBounds = this.getBackImageBounds();
				if (imageBounds.width < 0 || imageBounds.height < 0) {
					graphics.drawImage(image, imageBounds.x, imageBounds.y);
				} else {
					graphics.drawImage(image, imageBounds.x, imageBounds.y,
							imageBounds.width, imageBounds.height);
				}
			} else {
				graphics.drawImage(image, 0, 0);
			}
		}
	},
	getRightBorderWidth : function() {
		var border = this.getBorderStyle();
		if (border) {
			return this.getBorderWidth(border[0]);
		} else
			return 0;
	},
	getBottomBorderWidth : function() {
		var border = this.getBorderStyle();
		if (border) {
			return this.getBorderWidth(border[1]);
		} else
			return 0;
	},
	getBorderWidth : function(style) {
		if (style & COM.widget.Grid.Cell.BORDER_BOLD) {
			return 3;
		} else if (style == 0) {
			return 0;
		} else {
			return 1;
		}
		return 0;
	},
	paintBorder : function(graphics) {
		if (!(this.getBorderStyle() && this.getBorderColor())) {
			return;
		}
		var bounds = this.getBounds();
		graphics.translate(bounds.x, bounds.y);
		var borders = this.getBorderStyle();
		var colors = this.getBorderColor();
		var width;
		var colorProvider = this.getColorProvider();
		var x = 0;
		var y = 0;

		// 右、下、对角、逆对角
		// 左
		// 上

		// 右
		var border = borders[0];
		var color = colors[0];
		if (color == null || color == "") {
			color = colorProvider.getDefaultBorderColor();
		}
		if (border == COM.widget.Grid.Cell.BORDER_AUTO) {
			border = colorProvider.getDefaultBorderStyle();
		}

		if (colorProvider.isShowMergeChildBorder() && this.isMergeHead()) {
			this.paintRightMergedBorder(graphics);
		} else {
			this.paintRightBorder(graphics, border, color, x, y, bounds.width,
					bounds.height);
		}

		// 下
		border = borders[1];
		color = colors[1];
		if (color == null || color == "") {
			color = colorProvider.getDefaultBorderColor();
		}

		if (border == COM.widget.Grid.Cell.BORDER_AUTO) {
			border = colorProvider.getDefaultBorderStyle();
		}
		if (colorProvider.isShowMergeChildBorder() && this.isMergeHead()) {
			this.paintBottomMergedBorder(graphics);
		} else {
			this.paintBottomBorder(graphics, border, color, x, y, bounds.width,
					bounds.height);
		}

		border = borders[2];
		color = colors[2];
		if (color == null || color == "") {
			color = colorProvider.getDefaultBorderColor();
		}

		if (border == COM.widget.Grid.Cell.BORDER_AUTO) {
			border = colorProvider.getDefaultBorderStyle();
		}
		// 对角线
		if (border != null && border !== COM.widget.Grid.Cell.BORDER_NONE) {
			if (border === COM.widget.Grid.Cell.BORDER_SOLID) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x + bounds.width, y);
				graphics.lineTo(x, y + bounds.height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DASH) {
				graphics.pushState();
				graphics.beginPath();
				graphics.dashedLine(x + bounds.width, y, x, y + bounds.height,
						COM.widget.Grid.CellFigure.DASH_LEN,
						COM.widget.Grid.CellFigure.DASH_GAP_LEN,
						COM.widget.Grid.CellFigure.DASH_Array);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_BOLD) {
				graphics.pushState();
				graphics.beginPath();
				graphics.setLineWidth(2);
				graphics.moveTo(x + bounds.width, y);
				graphics.lineTo(x, y + bounds.height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DOUBLE) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x + bounds.width - 2, y);
				graphics.lineTo(x, y + bounds.height - 2);
				graphics.moveTo(x + bounds.width, y + 2);
				graphics.lineTo(x + 2, y + bounds.height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			}
		}

		border = borders[3];
		color = colors[3];
		if (color == null || color == "") {
			color = colorProvider.getDefaultBorderColor();
		}
		if (border == COM.widget.Grid.Cell.BORDER_AUTO) {
			border = colorProvider.getDefaultBorderStyle();
		}

		// 逆对角线
		if (border != null && border !== COM.widget.Grid.Cell.BORDER_NONE) {
			if (border === COM.widget.Grid.Cell.BORDER_SOLID) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x, y);
				graphics.lineTo(x + bounds.width, y + bounds.height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DASH) {
				graphics.pushState();
				graphics.beginPath();
				graphics.dashedLine(x, y, x + bounds.width, y + bounds.height,
						COM.widget.Grid.CellFigure.DASH_LEN,
						COM.widget.Grid.CellFigure.DASH_GAP_LEN,
						COM.widget.Grid.CellFigure.DASH_Array);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_BOLD) {
				graphics.pushState();
				graphics.beginPath();
				graphics.setLineWidth(2);
				graphics.moveTo(x, y);
				graphics.lineTo(x + bounds.width, y + bounds.height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DOUBLE) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x, y + 2);
				graphics.lineTo(x + bounds.width - 2, y + bounds.height);
				graphics.moveTo(x + 2, y);
				graphics.lineTo(x + bounds.width, y + bounds.height - 2);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			}
		}
		// if (this.getCol() == 5 && this.getRow() == 3) {
		// this.paintLeftBorder(graphics);
		// this.paintUpBorder(graphics);
		// }

	},
	paintRightMergedBorder : function(graphics) {
		var col = this.getCol();
		var row = this.getRow();
		var provider = this.mergeChildProvider;
		var bounds = this.getBounds();
		var rowSpan = this.getRowSpan();
		var x = 0;
		var y = 0;
		var i;
		var cell;
		var border, color;
		var colorProvider = this.getColorProvider();
		var rowData;

		for (i = 0; i < rowSpan; i++) {
			cell = provider.getCell(col, row + i);
			rowData = provider.getRow(row + i);
			if (null != rowData && !rowData.hidden) {
				if (cell && cell.border && cell.border[0]) {
					border = cell.border[0];
					if (border == COM.widget.Grid.Cell.BORDER_AUTO) {
						border = colorProvider.getDefaultBorderStyle();
					}
					color = null;
					if (cell.borderColor) {
						color = cell.borderColor[0];
					}
					if (color == null || color == "") {
						color = colorProvider.getDefaultBorderColor();
					}
					this.paintRightBorder(graphics, border, color, x, y,
							bounds.width, rowData.clientSize || rowData.size);
				}
				y += rowData.clientSize || rowData.size;
			}
		}

	},
	paintBottomMergedBorder : function(graphics) {
		var col = this.getCol();
		var row = this.getRow();
		var provider = this.mergeChildProvider;
		var bounds = this.getBounds();
		var colSpan = this.getColSpan();
		var x = 0;
		var y = 0;
		var i;
		var cell;
		var border, color;
		var colorProvider = this.getColorProvider();
		var colData;

		for (i = 0; i < colSpan; i++) {
			cell = provider.getCell(col + i, row);
			colData = provider.getCol(col + i);
			if (null != colData && !colData.hidden) {
				if (cell && cell.border && cell.border[1]) {
					border = cell.border[1];
					if (border == COM.widget.Grid.Cell.BORDER_AUTO) {
						border = colorProvider.getDefaultBorderStyle();
					}
					color = null;
					if (cell.borderColor) {
						color = cell.borderColor[1];
					}
					if (color == null || color == "") {
						color = colorProvider.getDefaultBorderColor();
					}
					this.paintBottomBorder(graphics, border, color, x, y,
							colData.clientSize || colData.size, bounds.height);
				}
				x += colData.clientSize || colData.size;
			}
		}

	},
	paintRightBorder : function(graphics, border, color, x, y, width, height) {
		if (border != null && border !== COM.widget.Grid.Cell.BORDER_NONE) {
			if (border === COM.widget.Grid.Cell.BORDER_SOLID) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x + width - 0.5, y);
				graphics.lineTo(x + width - 0.5, y + height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DASH) {
				graphics.pushState();
				graphics.beginPath();
				graphics.dashedLine(x + width - 0.5, y, x + width - 0.5, y
								+ height, COM.widget.Grid.CellFigure.DASH_LEN,
						COM.widget.Grid.CellFigure.DASH_GAP_LEN,
						COM.widget.Grid.CellFigure.DASH_Array);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_BOLD) {
				graphics.pushState();
				graphics.beginPath();
				graphics.setLineWidth(2);
				graphics.moveTo(x + width - 1, y);
				graphics.lineTo(x + width - 1, y + height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DOUBLE) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x + width - 2.5, y);
				graphics.lineTo(x + width - 2.5, y + height);
				graphics.moveTo(x + width - 0.5, y);
				graphics.lineTo(x + width - 0.5, y + height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			}
		}
	},
	paintBottomBorder : function(graphics, border, color, x, y, width, height) {
		if (border != null && border !== COM.widget.Grid.Cell.BORDER_NONE) {
			if (border === COM.widget.Grid.Cell.BORDER_SOLID) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x, y + height - 0.5);
				graphics.lineTo(x + width, y + height - 0.5);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DASH) {
				graphics.pushState();
				graphics.beginPath();
				graphics.dashedLine(x, y + height - 0.5, x + width, y + height
								- 0.5, COM.widget.Grid.CellFigure.DASH_LEN,
						COM.widget.Grid.CellFigure.DASH_GAP_LEN,
						COM.widget.Grid.CellFigure.DASH_Array);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_BOLD) {
				graphics.pushState();
				graphics.beginPath();
				graphics.setLineWidth(2);
				graphics.moveTo(x, y + height - 1);
				graphics.lineTo(x + width, y + height - 1);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DOUBLE) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x, y + height - 2.5);
				graphics.lineTo(x + width, y + height - 2.5);
				graphics.moveTo(x, y + height - 0.5);
				graphics.lineTo(x + width, y + height - 0.5);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			}
		}
	},
	// @unused
	paintLeftBorder : function(graphics) {
		var border = this.leftBorderStyle;
		border = 1;
		var color = this.leftBorderColor || "#000";
		color = "#aaa";
		var x = 0;
		var y = 0;
		var bounds = this.getBounds();
		if (border) {
			if (border === COM.widget.Grid.Cell.BORDER_SOLID) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x + 1, y);
				graphics.lineTo(x + 1, y + bounds.height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DASH) {
				graphics.pushState();
				graphics.beginPath();
				graphics.dashedLine(x, y, x, y + bounds.height,
						COM.widget.Grid.CellFigure.DASH_LEN,
						COM.widget.Grid.CellFigure.DASH_GAP_LEN,
						COM.widget.Grid.CellFigure.DASH_Array);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_BOLD) {
				graphics.pushState();
				graphics.beginPath();
				graphics.setLineWidth(2);
				graphics.moveTo(x, y);
				graphics.lineTo(x, y + bounds.height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DOUBLE) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x, y);
				graphics.lineTo(x, y + bounds.height);
				graphics.moveTo(x, y);
				graphics.lineTo(x, y + bounds.height);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			}
		}
	},
	// @unused
	paintUpBorder : function(graphics) {
		var border = this.upBorderStyle;
		var color = this.upBorderColor || "#000";
		border = 1;
		color = "#aaa";
		var x = 0;
		var y = 0;
		var bounds = this.getBounds();

		if (border) {
			if (border === COM.widget.Grid.Cell.BORDER_SOLID) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x, y + 1);
				graphics.lineTo(x + bounds.width, y + 1);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DASH) {
				graphics.pushState();
				graphics.beginPath();
				graphics.dashedLine(x, y + 0.5, x + bounds.width, y + 0.5,
						COM.widget.Grid.CellFigure.DASH_LEN,
						COM.widget.Grid.CellFigure.DASH_GAP_LEN,
						COM.widget.Grid.CellFigure.DASH_Array);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_BOLD) {
				graphics.pushState();
				graphics.beginPath();
				graphics.setLineWidth(2);
				graphics.moveTo(x, y + 1);
				graphics.lineTo(x + bounds.width, y + 1);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			} else if (border === COM.widget.Grid.Cell.BORDER_DOUBLE) {
				graphics.pushState();
				graphics.beginPath();
				graphics.moveTo(x, y + 2.5);
				graphics.lineTo(x + bounds.width, y + 2.5);
				graphics.moveTo(x, y + 0.5);
				graphics.lineTo(x + bounds.width, y + 0.5);
				graphics.setStrokeStyle(color);
				graphics.stroke();
				graphics.restoreState();
			}

		}
	},

	pictureLoaded : function() {
		this.repaint();
	},
	getRow : function(row) {
		if (this.model) {
			return this.model.rowIndex;
		}
	},
	getCol : function(col) {
		if (this.model) {
			return this.model.colIndex;
		}
	},
	getColRow : function() {
		return {
			row : this.getRow(),
			col : this.getCol()
		};
	},
	// --------------------------------------树形相关------------------------------
	onExpandClicked : function(me) {
		if (this.treeListener) {
			this.treeListener.onExpandClicked(this.getCol(), this.getRow(), me);
		}
	},
	isExpanded : function() {
		return this.expanded;
	},
	setExpanded : function(value) {
		this.expanded = value;
		this.tree.setExpanded(value);
	},
	setDepth : function(depth) {
		this.tree.setDepth(depth);
		return this;
	},
	setExpandable : function(expandable) {
		this.tree.setExpandable(expandable);
		return this;
	},
	setCheckable : function(checkable) {
		this.tree.setCheckable(checkable);
		return this;
	},
	setChecked : function(checked) {
		this.checked = checked;
		this.tree.setChecked(checked);
	},
	onCheckStateChanged : function(checked, e) {
		this.checked = checked;
		if (this.treeListener) {
			this.treeListener.onCheckStateChanged(this.getCol(), this.getRow(),
					checked, e);
		}
	},
	isChecked : function() {
		return this.checked;
	},
	setTreeImage : function(treeImage) {
		this.tree.setTreeImage(treeImage);
		return this;
	},
	// Text
	setText : function(text) {
		this.text = text;
	},
	getText : function() {
		return this.text;
	},
	setFontName : function(name) {
		if (!this.font) {
			this.font = {};
		}
		this.font.fontName = name;
		return this;
	},
	setFontSize : function(size) {
		if (!this.font) {
			this.font = {};
		}
		this.font.fontSize = size;
		return this;
	},
	setFontSizeUnit : function(unit) {
		if (!this.font) {
			this.font = {};
		}
		this.font.fontSizeUnit = unit;
		return this;
	},
	setFontBold : function(bold) {
		if (!this.font) {
			this.font = {};
		}
		this.font.fontBold = bold;
		return this;
	},
	setFontItalic : function(italic) {
		if (!this.font) {
			this.font = {};
		}
		this.font.fontItalic = italic;
		return this;
	},
	setFontColor : function(color) {
		if (!this.font) {
			this.font = {};
		}
		this.font.fontColor = color;
		this.syncCss('color', color);
		return this;
	},
	setMultiLine : function(multiLine) {
		if (!this.font) {
			this.font = {};
		}
		this.font.multiLine = multiLine;
		return this;
	},
	setWrapLine : function(wrapLine) {
		if (!this.font) {
			this.font = {};
		}
		this.font.wrapLine = wrapLine;
		return this;
	},
	setIndent : function(indent) {
		if (!this.font) {
			this.font = {};
		}
		this.font.indent = indent;
		return this;
	},
	setIndentPx : function(indentPx) {
		if (!this.font) {
			this.font = {};
		}
		this.font.indentPx = indentPx;
		return this;
	},
	setVertAlign : function(vertAlign) {
		if (!vertAlign) {
			// 默认值
			// CONFIG
			vertAlign = COM.widget.Grid.Cell.ALIGN.CENTER;
		}
		if (!this.font) {
			this.font = {};
		}
		if (this.td) {
			this.td.style.verticalAlign = COM.widget.Grid.Cell.ALIGN.getCssStr(
					vertAlign, true);
		}
		this.font.vertAlign = vertAlign;
		return this;
	},
	setHorzAlign : function(horzAlign) {
		if (!horzAlign) {
			// 默认值
			// CONFIG
			horzAlign = COM.widget.Grid.Cell.ALIGN.FORE;
		}
		if (!this.font) {
			this.font = {};
		}
		if (this.td) {
			this.td.style.textAlign = COM.widget.Grid.Cell.ALIGN
					.getCssStr(horzAlign);
		}
		this.font.horzAlign = horzAlign;
		return this;
	},
	setVertText : function(vertText) {
		if (!this.font) {
			this.font = {};
		}
		this.font.vertText = vertText;
		return this;
	},
	setFitFontSize : function(fitFontSize) {
		if (!this.font) {
			this.font = {};
		}
		this.font.fitFontSize = fitFontSize;
		return this;
	},
	setFontUnderLine : function(fontUnderLine) {
		if (!this.font) {
			this.font = {};
		}
		this.font.fontUnderLine = fontUnderLine;
		return this;
	},

	setTextShadow : function(shadow) {
		if (!this.font) {
			this.font = {};
		}
		this.font.textShadow = shadow;
		return this;
	},
	// getTextShadow: function () {
	// return this.font.textShadow;
	// },
	setTextStroke : function(stroke) {

		if (!this.font) {
			this.font = {};
		}
		this.font.textStroke = stroke;
		return this;
	},
	// getTextStroke: function () {
	// return this.textStroke;
	// },
	setDecoration : function(decoration) {
		if (!this.font) {
			this.font = {};
		}
		this.font.decoration = decoration;
		this.syncCss('decoration', decoration);
		return this;
	},
	syncCss : function(key, value) {
		if (this.controlParent) {
			switch (key) {
				case 'decoration' :
					this.controlParent.style.textDecoration = COM.widget.Grid.Cell.DECORATION
							.getCssStr(value);
					break;
				case 'color' :
					this.controlParent.style.color = value;
					break;
				default :
					// do nothing.
			}
		}
	},
	// getDecoration: function () {
	// return this.decoration;
	// },
	setFont : function(font) {
		this.font = font;
		return this;
	},
	getFont : function() {
		if (!this.font) {
			this.font = {};
		}
		return this.font;
	}
});
COM.widget.Grid.CellFigure.DASH_LEN = 4;
COM.widget.Grid.CellFigure.DASH_GAP_LEN = 2;
COM.widget.Grid.CellFigure.DASH_Array = null;
COM.widget.Grid.CellFigure.CANVAS_INSTANCE = document.createElement("canvas");

COM.widget.Grid.TreeFigure = function TreeFigure(host, expandable, checkable,
		treeImage, depth) {
	COM.widget.Grid.TreeFigure.superclass.constructor.call(this);
	// this.setLayoutManager(new XYLayout());
	this.host = host;
	if (expandable) {
		this.addExpandFigure();
	}
	if (checkable) {
		this.addCheckFigure();
	}
	if (treeImage) {
		this.setTreeImage(treeImage);
	}
	this.depth = depth || 0;

};

COM.widget.Grid.TreeFigure.extend(Figure, {
	dispose : function() {
		COM.widget.Grid.TreeFigure.superclass.dispose.call(this);
		this.host = null;
		this.expand = null;
		this.check = null;
		this.treeImage = null;
	},
	addExpandFigure : function() {
		if (this.expand) {
			return;
		}
		var figure = this.createExpandFigure();
		this.setExpandFigure(figure);

	},
	setExpandFigure : function(figure) {
		if (this.expand) {
			this.remove(this.expand);
		}
		this.expand = figure;
		this.add(this.expand, null, 0);
	},
	createExpandFigure : function() {
		var expand = new COM.widget.Grid.ExpandFigure(this.host);
		return expand;
	},
	addCheckFigure : function() {
		if (this.check) {
			return;
		}
		var figure = this.createCheckFigure();
		this.setCheckFigure(figure);
	},
	createCheckFigure : function() {
		// var figure = new CheckBox('checkbox');
		var figure = new COM.widget.Grid.CheckBox(this.host);
		figure.setSelected(this.host.isChecked());
		// figure.addChangeListener(this);
		return figure;
	},
	setCheckFigure : function(figure) {
		if (this.check) {
			this.remove(this.check);
		}
		this.check = figure;
		this.add(this.check);
	},
	setTreeImage : function(image) {
		if (!image && this.treeImage) {
			this.remove(this.treeImage);
			this.treeImage = null;
			return;
		}
		if (!this.treeImage) {
			this.treeImage = this.createTreeImage();
			this.treeImage.setIcon(image);
			this.add(this.treeImage);
		} else {
			this.treeImage.setIcon(image);
		}
	},
	repaint : function(a, b, c, d) {
		COM.widget.Grid.TreeFigure.superclass.repaint.call(this, a, b, c, d);
	},
	paint : function(g) {

		COM.widget.Grid.TreeFigure.superclass.paint.call(this, g);
	},
	createTreeImage : function() {
		var label = new Label('treeImage');
		return label;
	},
	// 处理checkbox的状态变化
	handleStateChanged : function(changeEvent) {
		if (changeEvent.getPropertyName() == ButtonModel.SELECTED_PROPERTY) {
			this.host.onCheckStateChanged(this.check.isSelected());
		}
	},
	getPreferredSize : function(wHint, hHint) {
		if (this.prefSize == null) {
			var indent = COM.widget.Grid.TreeFigure.INDENTPERDEPTH * this.depth;
			var w = COM.widget.Grid.TreeFigure.GAP + indent;
			var h = 0;
			var size;
			if (this.expand) {
				size = this.expand.getPreferredSize(-1, -1);
				h = Math.max(size.height, h);
			}
			// 无论有没有expand，都要留出这个宽度
			size = this.getDefaultExpandFigureSize();
			w += size.width;
			w += COM.widget.Grid.TreeFigure.GAP;

			if (this.check) {
				size = this.check.getPreferredSize(-1, -1);
				w += size.width;
				h = Math.max(size.height, h);
				w += COM.widget.Grid.TreeFigure.GAP;
			}
			if (this.treeImage) {
				size = this.treeImage.getPreferredSize(-1, -1);
				w += size.width;
				h = Math.max(size.height, h);
				w += COM.widget.Grid.TreeFigure.GAP;
			}
			this.prefSize = new Dimension(w, h);
		}
		return this.prefSize;
	},

	invalidate : function() {
		this.prefSize = null;
		COM.widget.Grid.TreeFigure.superclass.invalidate.call(this);
	},
	layout : function() {
		var indent = COM.widget.Grid.TreeFigure.INDENTPERDEPTH * this.depth;
		var x = COM.widget.Grid.TreeFigure.GAP + indent;
		var y = 0;
		var bounds = this.getBounds();
		var size;
		if (this.expand) {
			size = this.expand.getPreferredSize(-1, -1);
			y = (bounds.height - size.height) / 2;
			this.expand.setBounds(new Rectangle(x, y, size.width, size.height));

		}
		// 无论有没有expand，都要留出这个宽度
		size = this.getDefaultExpandFigureSize();
		x += size.width;
		x += COM.widget.Grid.TreeFigure.GAP;

		if (this.check) {
			size = this.check.getPreferredSize(-1, -1);
			y = (bounds.height - size.height) / 2;
			this.check.setBounds(new Rectangle(x, y, size.width, size.height));
			x += size.width;
			x += COM.widget.Grid.TreeFigure.GAP;
		}
		if (this.treeImage) {
			size = this.treeImage.getPreferredSize(-1, -1);
			y = (bounds.height - size.height) / 2;
			this.treeImage.setBounds(new Rectangle(x, y, size.width,
					size.height));
		}
	},
	getDefaultExpandFigureSize : function() {
		if (!this.defs) {
			this.defs = {};
			this.defs.width = COM.widget.Grid.ExpandFigure.EXPANDED.width;
			this.defs.height = COM.widget.Grid.ExpandFigure.EXPANDED.height;
		}
		return this.defs;
	},
	setExpanded : function(value) {
		this.expand.setExpanded(value);
	},
	setDepth : function(depth) {
		this.depth = depth;
		this.invalidate();
		this.repaint();
	},
	setExpandable : function(expandable) {
		if (expandable) {
			this.addExpandFigure();
		} else {
			if (this.expand) {
				this.remove(this.expand);
				this.expand = null;
			}
		}
	},
	setCheckable : function(checkable) {
		if (checkable) {
			this.addCheckFigure();
		} else {
			if (this.check) {
				this.remove(this.check);
				this.check = null;
			}
		}
	},
	setChecked : function(checked) {
		if (this.check) {
			this.check.setSelected(checked);
		}
	}
});
COM.widget.Grid.TreeFigure.INDENTPERDEPTH = 20;
COM.widget.Grid.TreeFigure.GAP = 5;

/**
 * @author jiangqifan
 * @since 2013-4-24
 */
COM.widget.Grid.ExpandFigure = function ExpandFigure(host) {
	COM.widget.Grid.ExpandFigure.superclass.constructor.call(this);
	this.host = host;
	this.setLayoutManager(new XYLayout());
	this.label = new Label('expand');
	this.add(this.label, new Rectangle(0, 0, -1, -1));
	if (this.host.isExpanded()) {
		this.label.setIcon(COM.widget.Grid.ExpandFigure.EXPANDED);
	} else {
		this.label.setIcon(COM.widget.Grid.ExpandFigure.UNEXPANDED);
	}
	var that = this;
	this.addMouseListener({
				/*
				 * mouseMoved: function (me) { that.host.onExpandClicked(me);
				 * me.consume(); },
				 */
				mousePressed : function(me) {
					that.host.onExpandClicked(me);

					// 这样会导致展开树后的下一次mousedown无法正常响应
					// me.consume();
				}/*
					 * , mouseReleased: function (me) {
					 * that.host.onExpandClicked(me); me.consume(); }
					 */
			});

	//
	// this.padding = new Insets(2,2,0,2);
};

COM.widget.Grid.ExpandFigure.extend(Figure, {
			dispose : function() {
				COM.widget.Grid.ExpandFigure.superclass.dispose.call(this);
				this.host = null;
				this.label = null;
			},
			setExpanded : function(value) {
				if (!this.label) {
					this.label = new Label('', '');
					this.add(this.label, new Rectangle(0, 0, -1, -1));
				}
				if (value) {
					this.label.setIcon(COM.widget.Grid.ExpandFigure.EXPANDED);
				} else {
					this.label.setIcon(COM.widget.Grid.ExpandFigure.UNEXPANDED);
				}
			}
		});

/**
 * 选择框（因为选择时需要原始浏览器事件，所有没用draw2d中的CheckBox，改用一个自定义的checkbox）
 * 
 * @author jiangqifan
 * @since 2013-6-28
 */
COM.widget.Grid.CheckBox = function CheckBox(host) {
	COM.widget.Grid.CheckBox.superclass.constructor.call(this);
	this.host = host;
	this.setLayoutManager(new XYLayout());
	this.label = new Label('chekbox');
	this.add(this.label, new Rectangle(0, 0, -1, -1));

	this.initImage();

	if (this.host.isChecked()) {
		this.label.setIcon(this.checkedImage);
	} else {
		this.label.setIcon(this.unCheckedImage);
	}
	var that = this;
	this.addMouseListener({
				mousePressed : function(me) {
					that.onClicked();
					that.host.onCheckStateChanged(that.isSelected(), me.e);
					me.consume();
				}
			});
};

COM.widget.Grid.CheckBox.extend(Figure, {
			dispose : function() {
				COM.widget.Grid.CheckBox.superclass.dispose.call(this);
				this.host = null;
				this.label = null;
			},
			initImage : function() {
				var image = COM.widget.Grid.CheckBox.CHECKED_IMAGE;
				if (COM.widget.Grid.ThemeProvider
						&& COM.widget.Grid.ThemeProvider.getCheckedImage) {
					image = COM.widget.Grid.ThemeProvider.getCheckedImage()
							|| COM.widget.Grid.CheckBox.CHECKED_IMAGE;
				}
				this.checkedImage = image;
				image = COM.widget.Grid.CheckBox.UNCHECKED_IMAGE;
				if (COM.widget.Grid.ThemeProvider
						&& COM.widget.Grid.ThemeProvider.getUnCheckedImage) {
					image = COM.widget.Grid.ThemeProvider.getUnCheckedImage()
							|| COM.widget.Grid.CheckBox.UNCHECKED_IMAGE;
				}
				this.unCheckedImage = image;
			},
			isSelected : function() {
				return this.selected;
			},
			onClicked : function() {
				this.setSelected(!(this.isSelected()));
			},
			setSelected : function(s) {
				this.selected = s;
				if (!this.label) {
					this.label = new Label('', '');
					this.add(this.label, new Rectangle(0, 0, -1, -1));
				}
				var image;
				if (s) {
					this.label.setIcon(this.checkedImage);
				} else {
					this.label.setIcon(this.unCheckedImage);
				}
			}
		});

COM.widget.Grid.CheckBox.UNCHECKED_IMAGE = ImageResourceManager
		.getImage("data:image/gif;base64,R0lGODlhDQANAPcAAEJCQrW1tc7OztbWzv///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ywAAAAADQANAAAIPQAFBBhIsGAAAgEAKFzIUABCAAQiSpToMOHEixUhXqT4cCNHix4JZAwpsmPIkSdNeqwooOUAlwJeDiB5MSAAOw==");
COM.widget.Grid.CheckBox.CHECKED_IMAGE = ImageResourceManager
		.getImage("data:image/gif;base64,R0lGODlhDQANAPcAAAAAAEJCQrW1tc7OztbWzv///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ywAAAAADQANAAAITwAHCBhIsKCAAgICKFzIcADCAAUiSpToMOFEiQAKVIR4EUBGAg8LZIzoMeNGkRlLRgRpsaRHiiFRjlwZU+TFkxdhChjAk8AAnz9/5hxaICAAOw==");
/*
 * COM.widget.Grid.ExpandFigure.EXPANDED_BLACK
 * =ImageResourceManager.getImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAQklEQVQYlWMUERFhwA1YGBgY1q9fj0+agYEhMDAQU279+vVMeExmYGAgIM0CZz158gRZQkZGBkUawifNcOLsxuV1ADKhCsgwQKTTAAAAAElFTkSuQmCC');
 * COM.widget.Grid.ExpandFigure.UNEXPANDED_BLACK
 * =ImageResourceManager.getImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAS0lEQVQYlWMUERFhwA1YGBgY1q9fj0+agYEhMDAQU279+vVMaEJPnjxB5qJLYzccWR+EISMjgyIN4T958gTCIMpwdGlkrQjDcXkdAADIE3QRB6jIAAAAAElFTkSuQmCC');
 */
// COM.widget.Grid.ExpandFigure.EXPANDED
// =ImageResourceManager.getImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAWJJREFUeNqkkzFOwzAUQH9ixy0lJVRVydaxOxtzkbgBKGLkAuUASFUlJDgFCwyFA4DEwAW65w4pBZW0SZrESbA/qkcTqV/61rfk9/xjx0ZVVbBLUDlc3c4dSulElJ5I9x8mEDnlnI8fbo5+UMB5PjkeWCPv7AB6h0RLfy4Ld/oejmZ+LqfXphyjKPIuTvehY1dCxrUp15wPW8ioT1itVm7XMXFBneg6BBklWK9DKMuytkAevGSUIIpiKIoCcxt5nss2IY4TrIviT04IBdu2kVGCzWaDHcg8ufzQ7v5yP4A0TZFRAs4rbCtJUuj3h/p7p3MwTYKMEhgGFXAm2srg+a6lFSwWTSEwkFECSvcgy0qwLAZhGGsFjDVgyygBY21xOGw7rRWSUYJGox0slqbb67BacPCVIyNr/BObzfb08TWG79AUrVnalGue3hJkVAeEWOOZDzDzl7Ufk2TwAnZ9zr8CDAAh1rhAOsCiXQAAAABJRU5ErkJggg==');
// COM.widget.Grid.ExpandFigure.UNEXPANDED
// =ImageResourceManager.getImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAapJREFUeNqkUztPAkEQ3rvbOx4eIiF4FRQUNFY2xBoSSzvMxdI/AJ2NCSEx0cr4C2y0QCtjoYmJ/gFqKSzOGkSDx/Pe7s7JchcSNGGSudmdme+72ZldzvM8tIpg+jk86SYxxg2yVIkqf2A6RJu2bdcvjze/gcC2rcZ2Qayqu+sosyEsRX/0HaX5pFdbbYtuazz9jkYjdb+8hlKyR8jspUpzKqU4YNgRBoOBkk7ykBCUvdor2PuLrZA/nRQAwwiGQx25rrtAQP3+EcN+2vhZDPtHGCPHcUBnYlkW+Klo2juJ+SSCgJEsyywGBNPpFCqgunPwstC4ytEbW9+eFZBhGIBhBLbtQVmTiYFyuRJL1rRnsPl8eT533EU8LwCGEXAcJmCTlGWim9M4Sy6qECa++Wh7vSgh4ADDCDCOIdN0kShKSNfHgb/FwAZ9khQJxbDvTJDmSLMtk2y2CFYUuYW+UAwjiEQSnV6fVzIpKZR0dy7+jtMK3+VPCzB0DTcxGk00rx7G6EvnSWkiU9poqkEfzbl+nACGVSAIYr3VRqjV7v/7MVEMDGDV5/wjwABZz8+TuF15TgAAAABJRU5ErkJggg==');
COM.widget.Grid.ExpandFigure.EXPANDED = ImageResourceManager
		.getImage('data:image/gif;base64,R0lGODlhEAASAPcAADFKY0L/QpSlvZylvZytxqW11qm92r3GxrnK5MbGxsbW69jh8efv9+vz/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAAEALAAAAAAQABIAAAhfAAMIHEiwoMGDCBMqXMjQ4AICEAcMECDgwEECDjJmbMAAwEWNDjgi8GgQ40YGCwyQLDjAAYCXL1UeFBAS5QIFBVYSFMBxwU0EOWcyUIDAQIGjOgcegMnUYsOnUKMiDAgAOw==');
COM.widget.Grid.ExpandFigure.UNEXPANDED = ImageResourceManager
		.getImage('data:image/gif;base64,R0lGODlhEAASAPcAADFKY0L/QpSlvZylvZytxqW11qm92r3GxrXI48bGxsbS59Te8efv9+vz/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAAEALAAAAAAQABIAAAhhAAMIHEiwoMGDCBMqXMjQ4AICEAcMECDgwEECDjJmbMAAwEWNADgq8GgQY0YADBYYIFlwgAMAMGGuPCjAAUcACxQUYElQAMcFABQg2EmTgVADBZLyHHggplOLDaNKnYowIAA7');
/**
 * @author jiangqifan
 * @since 2013-4-24
 */
COM.widget.Grid.GridFigure = function GridFigure(data) {
	COM.widget.Grid.GridFigure.superclass.constructor.call(this);
	// this.setBorder(new LineBorder(1,ColorConstants.blue));
	this.setOpaque(true);
	// f.setBackgroundColor(ColorConstants.green);
	// this.setLayoutManager(new XYLayout());
	this.figures;
	this.layoutListener;
	this.headNormalColor = '#f0f';
	this.headNormalGradientColor = {
		begin : '#F8FBFC',
		end : '#D2DBE8',
		direction : COM.widget.Grid.Cell.DIRECTION_VERTI
	};
	this.borderStyles = [1, 1];
	this.borderColors = ['#D0D7E5', '#D0D7E5'];
	this.data = data;
};

COM.widget.Grid.GridFigure.extend(Figure, { // Figure
	add : function(child, constraint, index) {
		// 利用show来判断单元格图形是否需要显示

		child.show = true; // ------------------12
		//
		// check for cycle in hierarchy
		var figure;
		for (figure = this; figure; figure = figure.getParent()) {
			if (figure == child) {
				Debugger.log(this.id + " => "
						+ "Figure-add-Figure being added introduces cycle");
			}
		}
		// ---------12

		// Detach the child from previous parent

		if (child.getParent()) {
			child.getParent().remove(child);
		} // 13

		index = (index == null) ? -1 : index;
		// 13

		if (index == -1) {
			this.children.push(child);
		} else {
			this.children.splice(index, 0, child);
		}
		// 13

		child.setParent(this); // 140

		if (this.layoutManager && constraint) {
			this.layoutManager.setConstraint(child, constraint);
		}
		// 150

		// this.revalidate();

		if (this.getFlag(FigureConstants.FLAG_REALIZED)) {
			child.addNotify();
		} // 150

		// child.repaint();

		if (child instanceof COM.widget.Grid.CellFigure
				&& (child.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_CONTROL || child
						.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_HTML)
				&& this.controlParent != null) {
			child.appendControl(this.getZindex(child), this.controlParent);
		}
		// 170

	},
	unshowAll : function() {
		var children = this.getChildren();
		for (var i = 0; i < children.length; i++) {
			children[i].show = false;
		}
	},
	removeUnShow : function() {
		var children = this.getChildren();
		for (var i = 0; i < children.length; i++) {
			if (!children[i].show) {
				this.remove(children[i]);
				i--;
			}
		}
	},
	setControlParent : function(parent) {
		this.controlParent = parent;
	},
	getZindex : function(cellFigure) {
		if (cellFigure) {
			var col = cellFigure.getCol();
			var row = cellFigure.getRow();
			var calculator = this.getZIndexCalculator();
			var zIndex;
			if (calculator) {
				zIndex = calculator.getZIndex(col, row);
				return zIndex;
			}
			return 9;
		}
	},
	getZIndexCalculator : function() {
		return this.zIndexCalculator;
	},
	setZIndexCalculator : function(calculator) {
		this.zIndexCalculator = calculator;
	},
	validate : function() {
		// debugger;
		COM.widget.Grid.GridFigure.superclass.validate.call(this);
	},
	/**
	 * 考虑在removeUnshow中调用child.dropControl();
	 * 
	 * @param {}
	 *            child
	 */
	remove : function(child) {
		child.dropControl();
		COM.widget.Grid.GridFigure.superclass.remove.call(this, child);
	},
	// paint: function (g) {
	// var begin = new Date();
	// COM.widget.Grid.GridFigure.superclass.paint.call(this,g);
	// var end = new Date();
	// var delta = end.getTime() - begin.getTime();
	// if (delta > 100) {
	// times.push(delta);
	// }
	// var total = 0;
	// for (var i = 0;i < times.length; i++) {
	// total += times[i];
	// }
	// total /= times.length;
	// Debugger.log('Grid - '+delta);
	// Debugger.log('Grid - AVERAGE:'+total);
	// },
	setAreaSizeProvider : function(provider) {
		this.areaSizeProvider = provider;
	},
	getlayoutData : function() {
		var contentSizeManager = this.getContent().getSizeManager();
		var cols = [];
		var rows = [];
		cols.push({
					size : contentSizeManager[0][0].width
							+ COM.widget.Grid.GridFigure.HEAD_WIDTH
				});
		cols.push({
					size : contentSizeManager[0][1].width
				});
		cols.push({
					size : contentSizeManager[0][2].width
				});

		rows.push({
					size : contentSizeManager[0][0].height
							+ COM.widget.Grid.GridFigure.HEAD_HEIGHT
				});
		rows.push({
					size : contentSizeManager[1][0].height
				});
		rows.push({
					size : contentSizeManager[2][0].height
				});

		if (this.layoutData == null) {
			this.layoutData = {};
		}
		this.layoutData.cols = cols;
		this.layoutData.rows = rows;
		return this.layoutData;
	},
	layout : function() {
		// do nothing.

	},

	addLayoutListener : function(listener) {
		this.layoutListener = listener;
	},
	fireLayout : function() {
		if (this.layoutListener) {
			this.layoutListener.onLayouted(this.getlayoutData());
		}
	},
	to26Str : function(num) {
		var t = new String(num.toString(26));
		var c;
		var result = "";
		var a = "A";
		var code = a.charCodeAt(0);
		for (var i = 0; i < t.length; i++) {
			c = t[i];
			var n = parseInt(c, 26);
			result += String.fromCharCode(n + code);
		}
		return result;
	},
	createHeaderCell : function(layoutData, index, isHoriz) {
		var col = -1;
		var row = -1;
		var colRowData;
		if (isHoriz) {
			col = index;
			if (index > -1) {
				colRowData = layoutData.cols[index];
			}

		} else {
			row = index;
			if (index > -1) {
				colRowData = layoutData.rows[index];
			}
		}
		if (col == -1 && row == -1) {
			var cellFigure = new COM.widget.Grid.CellFigure(col, row);
			// cellFigure.setGradientBackground({begin:'#F8FBFC',end:'#D2DBE8',direction:
			// COM.widget.Grid.Cell.DIRECTION_VERTI});
			cellFigure.paintFigure = function(graphics) {
				var bounds = this.getBounds();
				graphics.pushState();
				graphics.translate(bounds.x, bounds.y);
				graphics.setFillStyle("#A9C4E9");
				graphics.fillRect(bounds.x + 1, bounds.y + 1, bounds.width,
						bounds.height);

				graphics.beginPath();
				var myGradient = graphics.createLinearGradient(0, 0, 0,
						bounds.height - 10); // 创建一个线性渐变
				myGradient.addColorStop(0, "#F8FBFC");
				myGradient.addColorStop(1, "#D2DBE8");
				graphics.setFillStyle(myGradient);
				graphics.moveTo(bounds.right() - 5, bounds.bottom() - 5);
				graphics.lineTo(bounds.right() - 5, bounds.y + 5);
				graphics.lineTo(
						bounds.right() - bounds.bottom() + bounds.y + 5, bounds
								.bottom()
								- 5);
				graphics.fill();

				graphics.restoreState();
			}
		} else {
			var text = isHoriz ? this.to26Str(index) : index + '';
			// var text = index < 0?'0_0':'('+row+','+col+')' + '';
			var cellFigure = new COM.widget.Grid.CellFigure(col, row);
			cellFigure.setText(text);
			cellFigure.setFontSize(12);
			cellFigure.setFontName('宋体');
			if (this.headNormalGradientColor) {
				cellFigure.setGradientBackground(this.headNormalGradientColor);
			} else {
				cellFigure.setBackColor(this.headNormalColor);
			}

			colRowData.figure = cellFigure;
		}
		// cellFigure.setBackMode();
		cellFigure.setBorderStyle(this.borderStyles);
		cellFigure.setBorderColor(this.borderColors);
		// cellFigure.setBackgroundColor(ColorConstants.gray);
		cellFigure.setOpaque(true);
		return cellFigure;
	},
	createColFigure : function(index) {
		var text = this.to26Str(index);
		var cellFigure = new COM.widget.Grid.CellFigure(index, -1);
		cellFigure.setText(text);
		cellFigure.setFontSize(12);
		cellFigure.setFontName('宋体');
		if (this.headNormalGradientColor) {
			cellFigure.setGradientBackground(this.headNormalGradientColor);
		} else {
			cellFigure.setBackColor(this.headNormalColor);
		}
		return cellFigure;
	},
	createRowFigure : function(index) {
		var text = index + '';
		var cellFigure = new COM.widget.Grid.CellFigure(-1, index);
		cellFigure.setText(text);
		cellFigure.setFontSize(12);
		cellFigure.setFontName('宋体');
		if (this.headNormalGradientColor) {
			cellFigure.setGradientBackground(this.headNormalGradientColor);
		} else {
			cellFigure.setBackColor(this.headNormalColor);
		}
		return cellFigure;
	},
	paintChildren : function(graphics) {
		var child;
		var clip = Rectangle.SINGLETON;
		var max = this.children.length;
		var bounds;
		var offset;
		for (var i = 0; i < max; i++) {
			child = this.children[i];
			if (child.isVisible() && child.intersects(graphics.getClip(clip))) {
				bounds = child.getBounds();
				graphics.pushState();
				offset = child.gridOffset;
				if (offset) {
					graphics.clipRect(new Rectangle(bounds.x + offset.x,
							bounds.y + offset.y, bounds.width - offset.x,
							bounds.height - offset.y));
				} else {
					graphics.clipRect(child.getBounds());
				}
				child.paint(graphics);
				graphics.restoreState();
			}
		}
	},
	createHeadHeadFigure : function() {
		var cellFigure = new COM.widget.Grid.CellFigure(-1, -1);
		cellFigure.paintFigure = function(graphics) {
			var bounds = this.getBounds();
			graphics.pushState();
			graphics.translate(bounds.x, bounds.y);
			graphics.setFillStyle("#A9C4E9");
			graphics.fillRect(bounds.x + 1, bounds.y + 1, bounds.width,
					bounds.height);

			graphics.beginPath();
			var myGradient = graphics.createLinearGradient(0, 0, 0,
					bounds.height - 10); // 创建一个线性渐变
			myGradient.addColorStop(0, "#F8FBFC");
			myGradient.addColorStop(1, "#D2DBE8");
			graphics.setFillStyle(myGradient);
			graphics.moveTo(bounds.right() - 5, bounds.bottom() - 5);
			graphics.lineTo(bounds.right() - 5, bounds.y + 5);
			graphics.lineTo(bounds.right() - bounds.bottom() + bounds.y + 5,
					bounds.bottom() - 5);
			graphics.fill();

			graphics.restoreState();
		}
		return cellFigure;
	},
	getColRow : function(x, y) {
		var figure = this.getCellFigureByLocation(x, y);
		if (figure == null) {
			return null;
		}
		return figure.getColRow();
	},
	getCellFigureByLocation : function(x, y) {
		var figure = this.findFigureAt(x, y,
				COM.widget.Grid.GridFigure.FIND_CELL_SEARCH);
		return figure;
	},
	setHeadNormalColor : function(color) {
		this.headNormalColor = color;
	},
	setHeadNormalGradientColor : function(gradient) {
		this.headNormalGradientColor = gradient;
	}
		/*
		 * removeAll: function () { var i = 0; for (;i<this.children.length;i++) {
		 * this.remove(this.children[i]); } }
		 */

});

COM.gef.TypeTreeSearch = function TypeTreeSearch(type) {
	COM.gef.TypeTreeSearch.superclass.constructor.call(this);
	this.type = type;
}

COM.gef.TypeTreeSearch.extend(TreeSearch, { // TreeSearch
	accept : function(figure) {
		return figure instanceof this.type;
	}
});

COM.widget.Grid.GridFigure.HEAD_WIDTH = 30;
COM.widget.Grid.GridFigure.HEAD_HEIGHT = 20;
COM.widget.Grid.GridFigure.FIND_CELL_SEARCH = new COM.gef.TypeTreeSearch(COM.widget.Grid.CellFigure);
COM.widget.Grid.GridFigure.HEAD_NORMAL_COLOR = {
	begin : '#F8FBFC',
	end : '#D2DBE8',
	direction : COM.widget.Grid.Cell.DIRECTION_VERTI
};
COM.widget.Grid.GridFigure.HEAD_SELECTED_COLOR = {
	begin : '#F8FBFC',
	end : '#D2DBE8',
	direction : COM.widget.Grid.Cell.DIRECTION_VERTI
};
/**
 * @author jiangqifan
 * @since 2013-8-3
 */
COM.widget.Grid.SelectionFigure = function SelectionFigure() {
	COM.widget.Grid.SelectionFigure.superclass.constructor.call(this);
	this.selections = [];
}
COM.widget.Grid.SelectionFigure.extend(Figure, {
			paint : function(graphics) {
				var selections = this.selections;
				var rect;
				var bounds;
				var current;

				// 画当前单元格
				if (this.currentFigure) {

					/**
					 * BORDER = true; BACK = false;
					 */
					var type = this.colorProvider.getCurrentCellShowType();

					var color;
					bounds = this.currentFigure.getBounds();

					if (this.currentFigure.focus) {
						color = this.colorProvider.getCurrentCellColor()
					} else {
						color = this.colorProvider.getBlurCurrentCellColor();
					}

					if (type) {
						if (!this.colorProvider.isCurrenCellBorderHidden()) {
							// 边框
							graphics.beginPath();
							// graphics.rect((bounds.x>>0)-1.5,
							// (bounds.y>>0)-1.5, (bounds.width>>0)+3,
							// (bounds.height>>0)+3);
							graphics.rect(bounds.x, bounds.y, bounds.width,
									bounds.height);
							graphics.setStrokeStyle(color);
							graphics.stroke();
						}
					} else {
						graphics.beginPath();
						graphics.moveTo(bounds.x, bounds.y);
						graphics.lineTo(bounds.right(), bounds.y);
						graphics.lineTo(bounds.right(), bounds.bottom());
						graphics.lineTo(bounds.x, bounds.bottom());
						graphics.lineTo(bounds.x, bounds.y);
						graphics.setFillStyle(color);
						graphics.fill();

					}
				}
				// 画选择区域
				if (this.colorProvider.isHideSingleSelect()
						&& selections.length == 1 && selections[0].single) {
					// 当只有一个单元格时，就不画了选择区域了。
				} else {
					graphics.beginPath();
					for (var i = 0, max = selections.length; i < max; i++) {
						bounds = selections[i].getBounds();
						graphics.rect(bounds.x, bounds.y, bounds.width,
								bounds.height);
					}
					graphics.setFillStyle(this.colorProvider
							.getSelectionColor());
					graphics.fill();
				}

			},
			setSelectionCellColor : function() {

			},
			setCurrentCellColor : function() {

			},
			addSelection : function(figure) {
				this.add(figure);
				this.selections.push(figure);
			},
			removeSelection : function(figure) {
				this.remove(figure);
				COM.Util.Array.remove(this.selections, figure);
			},
			setCurrent : function() {

			}
		});
/**
 * @author jiangqifan
 * @since 2013-8-19
 */
COM.widget.Grid.HeadCellFigure = function HeadCellFigure() {
	COM.widget.Grid.HeadCellFigure.superclass.constructor.call(this);
	this.leftBorderStyle = 0;
	this.leftBorderColor = null;
	this.upBorderStyle = 0;
	this.upBorderColor = null;
	// 表头的默认背景颜色,因为背景颜色需要在清空的时候显示默认颜色，所以需要此设置
	this.defaultBackColor = null;
};

COM.widget.Grid.HeadCellFigure.extend(COM.widget.Grid.CellFigure, {
			calculateBackColor : function() {
				var backColor = this.getBackColor();
				if (backColor == null || backColor == "") {
					if (this.defaultBackColor) {
						backColor = this.defaultBackColor;
					} else {
						backColor = "#fff";
					}
				}
				return backColor;
			},
			setDefaultBackColor : function(defaultBackColor) {
				this.defaultBackColor = defaultBackColor;
			},
			setUpBorderStyle : function(style) {
				this.upBorderStyle = style;
			},
			getUpBorderStyle : function() {
				return this.leftBorderStyle;
			},
			setUpBorderColor : function(color) {
				this.upBorderColor = color;
			},
			getUpBorderColor : function() {
				return this.upBorderColor;
			},
			setLeftBorderStyle : function(style) {
				this.leftBorderStyle = style;
			},
			getLeftBorderStyle : function() {
				return this.leftBorderStyle;
			},
			setLeftBorderColor : function(color) {
				this.leftBorderColor = color;
			},
			getLeftBorderColor : function() {
				return this.leftBorderColor;
			},

			paintSelected : function(graphics) {
				var bounds = this.getBounds();
				graphics.setFillStyle(this.getColorProvider()
						.getSelectionHeadColor());
				graphics.fillRect(0, 0, bounds.width, bounds.height);
			},
			paint : function(graphics) {
				if (this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_CONTROL
						|| this.getCellMode() === COM.widget.Grid.Cell.Cell_MODE_HTML) {
					var controlLocation = this.getControlLocation();
					if (controlLocation) {
						this.realLocateControl(controlLocation.x,
								controlLocation.y);
					}
					this.getControlParent().style.visibility = 'visible';

					var bounds = this.getBounds();
					graphics.pushState();
					// paint back
					graphics.translate(bounds.x, bounds.y);
					this.paintBack(graphics);

					graphics.restoreState();

				} else {
					// 画图形
					graphics.pushState();
					this.paintFigure(graphics);
					graphics.restoreState();
				}
				// 画边框
				graphics.pushState();
				this.paintBorder(graphics);
				graphics.restoreState();

			},
			paintFigure : function(graphics) {
				var bounds = this.getBounds();
				graphics.pushState();
				graphics.translate(bounds.x, bounds.y);
				graphics.pushState();
				if (this.selected) {
					this.paintSelected(graphics);
				} else {
					// 画背景
					this.paintBack(graphics);
				}
				graphics.restoreState();
				// 画背景图片
				graphics.pushState();
				this.paintImage(graphics);
				graphics.restoreState();

				// 画文本
				if (this.getText() && this.getText() != '') {
					this.paintText(graphics);
				}
				graphics.restoreState();
			},
			paintBorder : function(graphics) {
				COM.widget.Grid.HeadCellFigure.superclass.paintBorder.call(
						this, graphics);

				if (this.getCol() == 0) {
					this.paintLeftBorder(graphics);
				}
				if (this.getRow() == 0) {
					this.paintUpBorder(graphics);

				}
			},
			paintLeftBorder : function(graphics) {
				var border = this.leftBorderStyle;
				var color = this.leftBorderColor || "#000";
				var x = 0;
				var y = 0;
				var bounds = this.getBounds();
				if (border) {
					if (border === COM.widget.Grid.Cell.BORDER_SOLID) {
						graphics.pushState();
						graphics.beginPath();
						graphics.moveTo(x + 0.5, y);
						graphics.lineTo(x + 0.5, y + bounds.height);
						graphics.setStrokeStyle(color);
						graphics.stroke();
						graphics.restoreState();
					} else if (border === COM.widget.Grid.Cell.BORDER_DASH) {
						graphics.pushState();
						graphics.beginPath();
						graphics.dashedLine(x + 0.5, y, x + 0.5, y
										+ bounds.height,
								COM.widget.Grid.CellFigure.DASH_LEN,
								COM.widget.Grid.CellFigure.DASH_GAP_LEN,
								COM.widget.Grid.CellFigure.DASH_Array);
						graphics.setStrokeStyle(color);
						graphics.stroke();
						graphics.restoreState();
					} else if (border === COM.widget.Grid.Cell.BORDER_BOLD) {
						graphics.pushState();
						graphics.beginPath();
						graphics.setLineWidth(2);
						graphics.moveTo(x + 1, y);
						graphics.lineTo(x + 1, y + bounds.height);
						graphics.setStrokeStyle(color);
						graphics.stroke();
						graphics.restoreState();
					} else if (border === COM.widget.Grid.Cell.BORDER_DOUBLE) {
						graphics.pushState();
						graphics.beginPath();
						graphics.moveTo(x + 2.5, y);
						graphics.lineTo(x + 2.5, y + bounds.height);
						graphics.moveTo(x + 0.5, y);
						graphics.lineTo(x + 0.5, y + bounds.height);
						graphics.setStrokeStyle(color);
						graphics.stroke();
						graphics.restoreState();
					}
				}
			},
			paintUpBorder : function(graphics) {
				var border = this.upBorderStyle;
				var color = this.upBorderColor || "#000";
				var x = 0;
				var y = 0;
				var bounds = this.getBounds();
				if (border) {
					if (border === COM.widget.Grid.Cell.BORDER_SOLID) {
						graphics.pushState();
						graphics.beginPath();
						graphics.moveTo(x, y + 0.5);
						graphics.lineTo(x + bounds.width, y + 0.5);
						graphics.setStrokeStyle(color);
						graphics.stroke();
						graphics.restoreState();
					} else if (border === COM.widget.Grid.Cell.BORDER_DASH) {
						graphics.pushState();
						graphics.beginPath();
						graphics.dashedLine(x, y + 0.5, x + bounds.width, y
										+ 0.5,
								COM.widget.Grid.CellFigure.DASH_LEN,
								COM.widget.Grid.CellFigure.DASH_GAP_LEN,
								COM.widget.Grid.CellFigure.DASH_Array);
						graphics.setStrokeStyle(color);
						graphics.stroke();
						graphics.restoreState();
					} else if (border === COM.widget.Grid.Cell.BORDER_BOLD) {
						graphics.pushState();
						graphics.beginPath();
						graphics.setLineWidth(2);
						graphics.moveTo(x, y + 1);
						graphics.lineTo(x + bounds.width, y + 1);
						graphics.setStrokeStyle(color);
						graphics.stroke();
						graphics.restoreState();
					} else if (border === COM.widget.Grid.Cell.BORDER_DOUBLE) {
						graphics.pushState();
						graphics.beginPath();
						graphics.moveTo(x, y + 2.5);
						graphics.lineTo(x + bounds.width, y + 2.5);
						graphics.moveTo(x, y + 0.5);
						graphics.lineTo(x + bounds.width, y + 0.5);
						graphics.setStrokeStyle(color);
						graphics.stroke();
						graphics.restoreState();
					}

				}
			},
			setVertAlign : function(vertAlign) {
				if (!this.font) {
					this.font = {};
				}
				if (vertAlign == COM.widget.Grid.Cell.ALIGN.AUTO) {
					vertAlign = COM.widget.Grid.Cell.ALIGN.CENTER;
				}
				this.font.vertAlign = vertAlign;
				return this;
			},
			setHorzAlign : function(horzAlign) {
				if (!this.font) {
					this.font = {};
				}
				if (horzAlign == COM.widget.Grid.Cell.ALIGN.AUTO) {
					horzAlign = COM.widget.Grid.Cell.ALIGN.CENTER;
				}
				this.font.horzAlign = horzAlign;
				return this;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-12-9
 */
COM.widget.Grid.AbstractCellFigureCreator = function AbstractCellFigureCreator(
		colorProvider, imageProvider) {
	COM.widget.Grid.AbstractCellFigureCreator.superclass.constructor.call(this);
	this.colorProvider = colorProvider;
	this.imageProvider = imageProvider;
}
COM.widget.Grid.AbstractCellFigureCreator.extend(Object, {
			create : function(model) {
				var figure = this.createFigure(model);
				var style = this.getStyle(model);
				this.putStyleIntoFigure(style, figure);
				return figure;
			},
			putStyleIntoFigure : function(style, figure) {

				figure.setColorProvider(this.colorProvider);

				if (null == style) {
					return;
				}
				figure.setRowSpan(style.rowSpan);
				figure.setColSpan(style.colSpan);
				// mode
				figure.setCellMode(style.cellMode);

				switch (style.cellMode) {
					case COM.widget.Grid.Cell.Cell_MODE_CONTROL :
						this.putControl(style, figure);
						break;
					case COM.widget.Grid.Cell.Cell_MODE_HTML :
						this.putHtml(style, figure);
						break;
					case COM.widget.Grid.Cell.Cell_MODE_TREE :
						this.putTree(style, figure); // tree的时候也需要putNormal
					default :
						this.putNormal(style, figure);
				}
				this.putAlways(style, figure);
			},
			putControl : function(style, figure) {
				if (style.control) {
					figure.setControl(style.control);
				}
			},
			putHtml : function(style, figure) {
				if (style.html) {
					figure.setHtml(style.html);
				}
			},
			putTree : function(style, figure) {
				figure.setExpandable(style.expandable)
						.setCheckable(style.checkable).setDepth(style.depth
								|| 0);
				if (style.expandable) {
					figure.setExpanded(style.expanded);
				}
				if (style.checkable) {
					figure.setChecked(style.checked);
				}
				if (style.treeImage) {
					var treeImage = ImageResourceManager
							.getImage(this.imageProvider
									.getImageUrlById(style.treeImage))
					figure.setTreeImage(treeImage);
				}
			},
			putNormal : function(style, figure) {
				// backImage
				figure.setBackImageStyle(style.backImageStyle);
				figure.setBackImageHorizion(style.backImageHorizion);
				figure.setBackImageVertical(style.backImageVertical);

				if (style.backImage) {
					var backimage = ImageResourceManager
							.getImage(this.imageProvider
									.getImageUrlById(style.backImage));
					figure.setBackImage(backimage);
					var bounds = style.backImageBounds;
					if (bounds) {
						figure.setBackImageBounds({
									x : bounds.x,
									y : bounds.y,
									width : bounds.width,
									height : bounds.height
								});
					}
				}

				// content
				figure.setText(style.showText);
			},
			putAlways : function(style, figure) {
				// align
				figure.setHorzAlign(style.horzAlign)
						.setVertAlign(style.vertAlign);
				// font
				figure.setFontName(style.fontName).setFontSize(style.fontSize)
						.setFontColor(style.fontColor)
						.setFontBold(style.fontBold)
						.setFontItalic(style.fontItalic)
						.setWrapLine(style.wrapLine).setIndent(style.indent)
						.setIndentPx(style.indentPx)
						.setVertText(style.vertText)
						.setFitFontSize(style.fitFontSize)
						.setMultiLine(style.multiLine)
						.setTextShadow(style.textShadow)
						.setTextStroke(style.textStroke)
						.setFontSizeUnit(style.fontSizeUnit)
						.setDecoration(style.decoration);
				// 背景颜色和边框，所有模式的单元格都需要显示

				// back
				this.putBack(style, figure);

				// border
				figure.setBorderStyle(style.border);
				figure.setBorderColor(style.borderColor);
				if (style.padding) {
					figure.setPadding(new Insets(style.padding[0],
							style.padding[1], style.padding[2],
							style.padding[3]));
				}

				if (style.title) {
					figure.setToolTip(style.title);
				}
			},
			putBack : function(style, figure) {
				// back
				if (style.backStyle) {
					figure.setBackStyle(style.backStyle);
				}
				if (style.backColor && style.backColor.length > 0) {
					figure.setBackColor(style.backColor);
				}
				if (style.gradientBackground) {
					figure.setGradientBackground(style.gradientBackground);
				}
			},
			createFigure : function(model) {
				throw "method need implements.";
			},
			getStyle : function(model) {
				return model;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-12-9
 */
COM.widget.Grid.NormalFigureCreator = function NormalFigureCreator(
		colorProvider, iamgeProvider, rowProvider) {
	COM.widget.Grid.NormalFigureCreator.superclass.constructor.call(this,
			colorProvider, iamgeProvider);
	this.rowProvider = rowProvider;
}
COM.widget.Grid.NormalFigureCreator.extend(
		COM.widget.Grid.AbstractCellFigureCreator, {
			createFigure : function(model) {
				return new COM.widget.Grid.CellFigure();
			},
			putBack : function(model, figure) {
				// back
				var rowData = this.rowProvider.getRow(model.rowIndex);
				// 行背景色不影响表头
				if (rowData.color) {
					figure.setBackColor(rowData.color);
					figure.setBackStyle(COM.widget.Grid.Cell.BACK_STYLE.FILL);
				}
				if (model.backStyle) {
					figure.setBackStyle(model.backStyle);
				}
				if (model.backColor && model.backColor.length > 0) {
					figure.setBackColor(model.backColor);
				}
				if (model.gradientBackground) {
					figure.setGradientBackground(model.gradientBackground);
				}
			}
		});
/**
 * @author jiangqifan
 * @since 2013-12-9
 */
COM.widget.Grid.HeadFigureCreator = function HeadFigureCreator(colorProvider,
		iamgeProvider, style) {
	COM.widget.Grid.HeadFigureCreator.superclass.constructor.call(this,
			colorProvider, iamgeProvider);
	this.headStyle = style;
}
COM.widget.Grid.HeadFigureCreator.extend(
		COM.widget.Grid.AbstractCellFigureCreator, {
			// 标题栏的文字，忽略行背景色.
			getStyle : function(model) {
				var clientStyle = {};
				if (this.headStyle) {
					for (var key in this.headStyle) {
						clientStyle[key] = this.headStyle[key];
					}

				}
				if (model) {
					for (var key in model) {
						if (model[key] != null) {
							clientStyle[key] = model[key];
						}
					}
				}
				if (null == clientStyle.showText) {
					if (model.colIndex == 0 && model.rowIndex != 0) {
						clientStyle.showText = (model.rowIndex + '');
					} else if (model.rowIndex == 0 && model.colIndex != 0) {
						clientStyle.showText = (COM.Util.Common
								.to26Str(model.colIndex));
					}
				}
				return clientStyle;
			},
			createFigure : function(model) {
				var figure = new COM.widget.Grid.HeadCellFigure();
				if (model.rowIndex == 0) {
					figure.setUpBorderStyle(model.upBorderStyle);
					figure.setUpBorderColor(model.upBorderColor);
				}
				if (model.colIndex == 0) {
					figure.setLeftBorderStyle(model.leftBorderStyle);
					figure.setLeftBorderColor(model.leftBorderColor);
				}
				if (this.headStyle) {
					figure.setDefaultBackColor(this.headStyle.backColor);
				}
				return figure;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-6-17
 */
COM.widget.Grid.ResizeHandle = function ResizeHandle(owner, cursor) {

	COM.widget.Grid.ResizeHandle.superclass.constructor.call(this, owner,
			new COM.gef.MoveHandleLocator(), null);
}

COM.widget.Grid.ResizeHandle.extend(COM.gef.AbstractHandle, {
			containsPoint : function(arg1, arg2) {
				var part = this.getOwner();
				var model = part.getModel();
				if (!(model.isRowResizeable() || model.isColResizeable())) {
					return false;
				}
				if (arg1 == null) {
					return;
				}
				var x;
				var y;
				if (Util.isInstanceOf(arg1, Point)) {
					x = arg1.x;
					y = arg1.y;
				} else if (arg2 != null) {
					x = arg1;
					y = arg2;
				}

				var parent = part.getFigure();
				// 此方法会改变Figure.PRIVATE_POINT;
				var temp_x = Figure.PRIVATE_POINT.x;
				var temp_y = Figure.PRIVATE_POINT.y;
				var figure = parent.getCellFigureByLocation(x, y);
				Figure.PRIVATE_POINT.x = temp_x;
				Figure.PRIVATE_POINT.y = temp_y;
				//
				if (!figure) {
					return false;
				}
				var col = figure.getCol();
				var row = figure.getRow();
				var cell = part.getCell(col, row);
				var bounds = figure.getBounds().getCopy();
				figure.translateToAbsolute(bounds);

				// var endCol = col;
				// var endRow = row;
				//	          
				// //处理点击在合并单元格的右侧或是下侧的情况（如果在标题上，则不需要处理）
				// if (col > 0 && row > 0) {
				// endCol = col + cell.colSpan - 1;
				// endRow = row + cell.rowSpan - 1;
				// }
				var changeSize = false;
				if (x - bounds.x < 5) {
					if (model.isColResizeable()
							&& (row < 1 || model.isColFreeResizeable())
							&& (col > 1 || model.isColHeaderResizeable())) {
						changeSize = true;
						this.setCursor(Cursor.E_RESIZE);
					}
				} else if (y - bounds.y < 5) {
					if (model.isRowResizeable()
							&& (col < 1 || model.isRowFreeResizeable())
							&& (row > 1 || model.isRowHeaderResizeable())) {
						changeSize = true;
						this.setCursor(Cursor.N_RESIZE);
					}
				} else if (bounds.right() - x < 5) {
					if (model.isColResizeable()
							&& (row < 1 || model.isColFreeResizeable())
							&& (col > 0 || model.isColHeaderResizeable())) {
						changeSize = true;
						this.setCursor(Cursor.E_RESIZE);
					}
				} else if (bounds.bottom() - y < 5) {
					if (model.isRowResizeable()
							&& (col < 1 || model.isRowFreeResizeable())
							&& (row > 0 || model.isRowHeaderResizeable())) {
						changeSize = true;
						this.setCursor(Cursor.N_RESIZE);
					}
				}

				return changeSize;
			},
			createDragTracker : function() {
				return new COM.widget.Grid.ResizeDragTracker(this.getOwner());
			}
		});
/**
 * @author jiangqifan
 * @since 2014-1-7
 */
COM.widget.Grid.AdvancedResizeHandle = function AdvancedResizeHandle(owner,
		cursor) {

	COM.widget.Grid.AdvancedResizeHandle.superclass.constructor.call(this,
			owner, new COM.gef.MoveHandleLocator(), null);
}

COM.widget.Grid.AdvancedResizeHandle.extend(COM.gef.AbstractHandle, {
			containsPoint : function(arg1, arg2) {
				var part = this.getOwner();
				var model = part.getModel();
				if (!(model.isRowResizeable() || model.isColResizeable())) {
					return false;
				}
				if (arg1 == null) {
					return;
				}
				var x;
				var y;
				if (Util.isInstanceOf(arg1, Point)) {
					x = arg1.x;
					y = arg1.y;
				} else if (arg2 != null) {
					x = arg1;
					y = arg2;
				}

				var parent = part.getFigure();
				// 此方法会改变Figure.PRIVATE_POINT;
				var temp_x = Figure.PRIVATE_POINT.x;
				var temp_y = Figure.PRIVATE_POINT.y;
				var figure = parent.getCellFigureByLocation(x, y);
				Figure.PRIVATE_POINT.x = temp_x;
				Figure.PRIVATE_POINT.y = temp_y;
				//
				if (!figure) {
					return false;
				}
				var col = figure.getCol();
				var row = figure.getRow();
				var cell = part.getCell(col, row);
				var bounds = figure.getBounds().getCopy();
				figure.translateToAbsolute(bounds);

				// var endCol = col;
				// var endRow = row;
				//	          
				// //处理点击在合并单元格的右侧或是下侧的情况（如果在标题上，则不需要处理）
				// if (col > 0 && row > 0) {
				// endCol = col + cell.colSpan - 1;
				// endRow = row + cell.rowSpan - 1;
				// }
				var reader = COM.widget.Grid.GridModel.ModelReader;
				var rowData = model.getRow(row);
				var colData = model.getCol(col);

				var changeSize = false;
				if (x - bounds.x < 5) {
					if (model.isColResizeable()
							&& reader.isColResizeable(rowData) && col > 1) {
						changeSize = true;
						this.setCursor(Cursor.E_RESIZE);
					}
				} else if (y - bounds.y < 5) {
					if (model.isRowResizeable()
							&& reader.isRowResizeable(colData) && row > 1) {
						changeSize = true;
						this.setCursor(Cursor.N_RESIZE);
					}
				} else if (bounds.right() - x < 5) {
					if (model.isColResizeable()
							&& reader.isColResizeable(rowData) && col > 0) {
						changeSize = true;
						this.setCursor(Cursor.E_RESIZE);
					}
				} else if (bounds.bottom() - y < 5) {
					if (model.isRowResizeable()
							&& reader.isRowResizeable(colData) && row > 0) {
						changeSize = true;
						this.setCursor(Cursor.N_RESIZE);
					}
				}

				return changeSize;
			},
			createDragTracker : function() {
				return new COM.widget.Grid.ResizeDragTracker(this.getOwner());
			}
		});
/**
 * @author jiangqifan
 * @since 2013-6-17
 */
COM.widget.Grid.SelectionHandle = function SelectionHandle(owner, locator,
		cursor) {
	// if (locator == null && owner != null) {
	// locator = new MoveHandleLocator(owner.getFigure());
	// }
	COM.widget.Grid.SelectionHandle.superclass.constructor.call(this, owner,
			locator, cursor);

	this.innerPad = 2;
	this.initialize();
}
/**
 * selectionHandle包含两个边界，外部边界是本图形显示范围的边界。内部边界用作边框的边界。
 */
COM.widget.Grid.SelectionHandle.extend(COM.gef.AbstractHandle, {
			invalidate : function() {
				COM.widget.Grid.SelectionHandle.superclass.invalidate
						.call(this);
			},
			createDragTracker : function() {
				return new COM.widget.Grid.SelectionBorderDragTracker(this
								.getOwner(), this);
			},
			containsPoint : function(x, y) {
				if (!COM.widget.Grid.SelectionHandle.superclass.containsPoint
						.call(this, x, y)) {
					return false;
				}
				return !Rectangle.SINGLETON.setBounds(this.getInnerBounds())
						.shrink(this.innerPad * 2, this.innerPad * 2).contains(
								x, y);
			},
			getInnerPad : function() {
				return this.innerPad;
			},
			setInnerPad : function(innerPad) {
				this.innerPad = innerPad;
			},
			/*
			 * paintBorder: function (graphics) { var bounds = this.innerBounds;
			 * graphics.setLineWidth(this.innerPad);
			 * graphics.setStrokeStyle(this.color); graphics.beginPath();
			 * graphics.rect(bounds.x +
			 * this.innerPad/2,bounds.y+this.innerPad/2,bounds.width -
			 * this.innerPad,bounds.height-this.innerPad); graphics.stroke(); },
			 */
			getInnerBounds : function() {
				return this.innerBounds;
			},
			setInnerBounds : function(innerBounds) {
				this.innerBounds = innerBounds;
			},
			getAccessibleLocation : function() {
				var p = this.getBounds().getTopRight().translate(-1,
						this.getBounds().height / 4);
				this.translateToAbsolute(p);
				return p;
			},
			initialize : function() {
				this.setOpaque(false);
				this
						.setBorder(new COM.widget.Grid.SelectionBorder(this.innerPad));
				this.setCursor(Cursor.MOVE);
			}
		});

/**
 * @author jiangqifan
 * @since 2013-6-17
 */
COM.widget.Grid.SelectionBorder = function SelectionBorder(width, color, dash) {
	COM.widget.Grid.SelectionBorder.superclass.constructor.call(this, width,
			color);
	this.dash = dash;
}

COM.widget.Grid.SelectionBorder.extend(LineBorder, {
			paint : function(figure, graphics, insets) {
				AbstractBorder.tempRect.setBounds(this.getPaintRectangle(
						figure, insets));
				if (this.getWidth() % 2 == 1) {
					AbstractBorder.tempRect.width--;
					AbstractBorder.tempRect.height--;
				}
				AbstractBorder.tempRect.shrink(this.getWidth() / 2, this
								.getWidth()
								/ 2);
				graphics.setLineWidth(this.getWidth());
				if (this.getColor() != null) {
					graphics.setStrokeStyle(this.getColor());
				}
				var temp = AbstractBorder.tempRect;
				graphics.beginPath();
				if (this.dash) {
					graphics.dashedPolyline(new PointList([temp.x, temp.y,
									temp.right(), temp.y, temp.right(),
									temp.bottom(), temp.x, temp.bottom(),
									temp.x, temp.y]), 8, 4);
					graphics.stroke();
				} else {
					graphics
							.strokeRect(temp.x, temp.y, temp.width, temp.height);
				}
			},
			getPaintRectangle : function(figure, insets) {
				var bounds = figure.getInnerBounds();
				AbstractBorder.tempRect.setBounds(bounds);
				return AbstractBorder.tempRect.crop(insets);
			}
		});
/**
 * @author jiangqifan
 * @since 2013-5-3
 */
COM.widget.Grid.GridSelectionHandleLocator = function GridSelectionHandleLocator(
		editPart) {
	COM.widget.Grid.GridSelectionHandleLocator.superclass.constructor
			.call(this);
	this.editPart = editPart;
}

COM.widget.Grid.GridSelectionHandleLocator.extend(Object, {
			getEditPart : function() {
				return this.editPart;
			},
			relocate : function(target) {
				var innerBounds = new Rectangle();
				var selection = this.getEditPart().getSelection();
				var bounds = this.getEditPart().getCellAreaBounds(selection,
						innerBounds);
				// innerBounds.x -= 1;
				// innerBounds.y -= 1;
				// bounds.x -= 1;
				// bounds.y -= 1;
				innerBounds.expand(1, 1);
				bounds.expand(1, 1);
				// var gridBounds = this.editPart.getFigure().getBounds();
				/*
				 * bounds.shrink(-target.innerPad,-target.innerPad);
				 * innerBounds.shrink(-target.innerPad,-target.innerPad);
				 */
				target.setBounds(bounds);
				// innerBounds.x = bounds.x;
				// innerBounds.y = bounds.y;
				// innerBounds.widht = 10;
				// innerBounds.height = 10;
				target.setInnerBounds(innerBounds);
			},
			setEditPart : function(editPart) {
				this.editPart = editPart;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-6-24
 */
COM.widget.Grid.SelectionChangeHandle = function SelectionChangeHandle(owner,
		locator, cursor) {
	if (locator == null && owner != null) {
		locator = new MoveHandleLocator(owner.getFigure());
	}
	COM.widget.Grid.SelectionChangeHandle.superclass.constructor.call(this,
			owner, locator, cursor);
	this.initialize();
}

COM.widget.Grid.SelectionChangeHandle.extend(COM.gef.AbstractHandle, {
			createDragTracker : function() {
				return new COM.widget.Grid.SelectionChangeDragTracker(this
								.getOwner(), this);
			},
			paint : function(graphics) {
				var bounds = this.getBounds();
				graphics.translate(bounds.x, bounds.y);
				var backgroundColo = this.getBackgroundColor();
				graphics.setFillStyle(backgroundColo);
				graphics.fillRect(1, 1, bounds.width - 2, bounds.height - 2);
				graphics.setStrokeStyle('#fff');
				graphics.setLineWidth(2);
				graphics.stroke(0, 0, bounds.width, bounds.height);
			},
			initialize : function() {
				this.setOpaque(true);
				// this.setBackgroundColor(ColorConstants.black);
				// this.setBorder(new
				// LineBorder(this.innerPad,ColorConstants.white));
				this.setCursor(Cursor.CROSS_HAIR);
			}
		});
/**
 * @author jiangqifan
 * @since 2013-6-24
 */
COM.widget.Grid.SelectionChangeHandleLocator = function SelectionChangeHandleLocator(
		reference) {
	COM.widget.Grid.SelectionChangeHandleLocator.superclass.constructor.call(
			this, reference);
}

COM.widget.Grid.SelectionChangeHandleLocator.extend(COM.gef.MoveHandleLocator,
		{
			relocate : function(target) {
				var reference = this.getReference();
				var width = reference.getInnerPad();
				var bounds = reference.getBounds().getCopy();
				bounds.x = bounds.right() - width * 2;
				bounds.y = bounds.bottom() - width * 2;
				bounds.width = width * 3;
				bounds.height = width * 3;
				target.setBounds(bounds);
			},
			getSize : function() {

			}
		});
/**
 * @author jiangqifan
 * @since 2013-4-24
 */
COM.widget.Grid.ResizeDragTracker = function ResizeDragTracker(editPart) {
	COM.widget.Grid.ResizeDragTracker.superclass.constructor.call(this);
	this.editPart = editPart;
};

COM.widget.Grid.ResizeDragTracker.extend(COM.gef.SimpleDragTracker, {
			setEditPart : function(editPart) {
				this.editPart = editPart;
			},
			createSourceRequest : function() {
				var request = new COM.gef.Request();
				return request;
			},
			handleButtonDown : function(button) {
				var part = this.getEditPart();
				// 如果在编辑状态下点击，则关闭编辑器
				if (part.isEditing()) {
					part.commitEdit(COM.widget.Grid.CAUSE_MOUSE);
				}
				var figure = part.getCellFigureByLocation(this.startX,
						this.startY);
				if (figure == null) {
					return;
				}
				var col = figure.getCol();
				var row = figure.getRow();

				if (col == null || row == null) {
					return;
				}

				var cell = part.getCell(col, row);
				// part.fireEvent('cellMouseDown',{'cell':part.getCellController(colRow.col,colRow.row),'x':this.startX,'y':this.startY});
				// 鼠标按下的单元格行列值
				this.startCol = col;
				this.startRow = row;

				var bounds = figure.getBounds().getCopy();
				var endCol = col;
				var endRow = row;
				var minus = false;
				var model = part.getModel();

				// 处理点击在合并单元格的右侧或是下侧的情况（如果在标题上，则不需要处理）
				if (col > 0 && row > 0) {
					endCol = col + cell.colSpan - 1;
					endRow = row + cell.rowSpan - 1;
				}

				// 计算是否为改变行高列宽，以及获取相应参数
				figure.translateToAbsolute(bounds);
				var changeSize = false;
				if (this.startX - bounds.x < 5) {
					this.changeColSize = true;
					this.index = col - 1;
					while (!part.isColVisible(this.index)) {
						this.index--;
					}
					changeSize = true;
					minus = true;

				} else if (this.startY - bounds.y < 5) {
					this.changeColSize = false;
					this.index = row - 1;
					while (!part.isRowVisible(this.index)) {
						this.index--;
					}
					changeSize = true;
					minus = true;

				} else if (bounds.right() - this.startX < 5) {
					this.changeColSize = true;
					this.index = endCol;
					changeSize = true;

				} else if (bounds.bottom() - this.startY < 5) {
					this.changeColSize = false;
					this.index = endRow;
					changeSize = true;
				}

				// TODO 如果 this.changeColRow进行了调整，那么end和begin也需要调整
				if (changeSize && this.index > -1) {
					// 改变行高列宽
					this.setFlag(
							COM.widget.Grid.GridDragTracker.FLAG_CHANGE_SIZE,
							true);
					if (this.changeColSize) {
						if (minus) {
							this.end = bounds.x;
						} else {
							this.end = bounds.right();
						}
						this.begin = this.end
								- part.getModel().data.cols[this.index].clientSize;
						// part.showColSizeChangeFeedback(this.getChangeChildrenSizeRequest(this.changeColRow,bounds.x,bounds.right()));
					} else {
						if (minus) {
							this.end = bounds.y;
						} else {
							this.end = bounds.bottom();
						}
						this.begin = this.end
								- part.getModel().data.rows[this.index].clientSize;
						// part.showRowSizeChangeFeedback(this.getChangeChildrenSizeRequest(this.changeColRow,bounds.y,bounds.bottom()));
					}

				}
				return COM.widget.Grid.GridDragTracker.superclass.handleButtonDown
						.call(this, button);
			},
			handleDragInProgress : function() {
				// var part = this.getEditPart();
				// var input = this.getCurrentInput();
				// var mouse = input.getMouseLocation();
				// var colRow = part.getColRow(mouse.x, mouse.y);
				//	        
				// var source =
				// part.getCellController(this.startCol,this.startRow);
				// var target = part.getCellController(colRow.col,colRow.row);

				// part.fireEvent('cellDrag',{'source':source,'target':target,'x':mouse.x,'y':mouse.y});
				return COM.widget.Grid.GridDragTracker.superclass.handleDragInProgress
						.call(this);
			},
			handleButtonUp : function(button) {
				// var part = this.getEditPart();
				// var input = this.getCurrentInput();
				// var mouse = input.getMouseLocation();
				// var colRow = part.getColRow(mouse.x, mouse.y);
				// if (colRow) {
				// part.fireEvent('cellMouseUp',{'cell':part.getCellController(colRow.col,colRow.row),'x':mouse.x,'y':
				// mouse.y});
				// }
				return COM.widget.Grid.GridDragTracker.superclass.handleButtonUp
						.call(this, button);
			},
			getCommand : function() {
				var command = new COM.gef.UnexecutableCommand();
				var request = this.getSourceRequest();
				var part = this.getEditPart();
				var command = part.getCommand(request);
				return command;
			},
			getOperationSet : function() {
				return [this.getEditPart()];
			},
			updateSourceRequest : function() {
				var request = this.getSourceRequest();
				var input = this.getCurrentInput();
				var mouse = input.getMouseLocation();
				var delta;
				var begin;
				var end;
				if (this.changeColSize) {
					request
							.setType(COM.widget.Grid.RequestConstants.CHANGE_COL_SIZE);
					delta = mouse.x - this.startX;
				} else {
					request
							.setType(COM.widget.Grid.RequestConstants.CHANGE_ROW_SIZE);
					delta = mouse.y - this.startY;
				}
				request.delta = delta;
				request.begin = this.begin;
				request.end = this.end;
				request.colRow = this.index;
			},
			getEditPart : function() {
				return this.editPart;
			},
			calculateCursor : function() {
				if (this
						.getFlag(COM.widget.Grid.GridDragTracker.FLAG_CHANGE_SIZE)) {
					if (this.changeColSize) {
						return Cursor.E_RESIZE;
					} else {
						return Cursor.N_RESIZE;
					}
				}
				return null;
			}
		});
/**
 * @author jiangqifan
 * @since 2013-4-24
 */
COM.widget.Grid.SelectionBorderDragTracker = function SelectionBorderDragTracker(
		editPart, handle) {
	COM.widget.Grid.SelectionBorderDragTracker.superclass.constructor
			.call(this);
	this.editPart = editPart;
	this.handle = handle;
};

COM.widget.Grid.SelectionBorderDragTracker.extend(COM.gef.SimpleDragTracker, {
	setEditPart : function(editPart) {
		this.editPart = editPart;
	},
	createSourceRequest : function() {
		var request = new COM.gef.Request();
		return request;
	},
	handleButtonDown : function(button) {
		var part = this.getEditPart();
		// 如果在编辑状态下点击，则关闭编辑器
		if (part.isEditing()) {
			part.commitEdit(COM.widget.Grid.CAUSE_MOUSE);
		}
		var colRow = part.getRealColRow(this.startX, this.startY);

		this.sourceCol = colRow.col;
		this.sourceRow = colRow.row;

		// 起始单元格矫正：如果起始时，鼠标在选择框下方，则其实单元格矫正为鼠标上方的单元格;其他方向同理
		var selection = part.getSelection()
		if (selection.x > colRow.col) {
			this.sourceCol++;
		} else if (selection.right() <= colRow.col) {
			this.sourceCol--;
		}
		if (selection.y > colRow.row) {
			this.sourceRow++;
		} else if (selection.bottom() <= colRow.row) {
			this.sourceRow--;
		}

		this.button = button;
		return COM.widget.Grid.GridDragTracker.superclass.handleButtonDown
				.call(this, button);
	},
	handleButtonUp : function(button) {
		this.button = null;
		return COM.widget.Grid.SelectionBorderDragTracker.superclass.handleButtonUp
				.call(this, button);
	},
	getCommand : function() {
		var command = new COM.gef.UnexecutableCommand();
		var request = this.getSourceRequest();
		var part = this.getEditPart();
		var command = part.getCommand(request);
		return command;
	},
	getOperationSet : function() {
		return [this.getEditPart()];
	},
	handleDragInProgress : function() {
		var part = this.getEditPart();
		var input = this.getCurrentInput();
		var mouse = input.getMouseLocation();
		var colRow = part.getRealColRow(mouse.x, mouse.y);

		this.targetCol = colRow.col;
		this.targetRow = colRow.row;

		return COM.widget.Grid.SelectionBorderDragTracker.superclass.handleDragInProgress
				.call(this);
	},
	updateSourceRequest : function() {
		var request = this.getSourceRequest();
		var part = this.getEditPart();
		request.setType(COM.widget.Grid.RequestConstants.SELECTION_MOVE);
		var selection = part.getSelection().getCopy();
		Debugger.log('move:' + (this.targetCol - this.sourceCol) + ','
				+ (this.targetRow - this.sourceRow));
		Debugger.log('before:' + selection.x + ',' + selection.y + ','
				+ selection.width + ',' + selection.height);
		selection.translate(this.targetCol - this.sourceCol, this.targetRow
						- this.sourceRow);
		Debugger.log('after:' + selection.x + ',' + selection.y + ','
				+ selection.width + ',' + selection.height);
		request.rect = selection;
		request.button = this.button;
	},
	getEditPart : function() {
		return this.editPart;
	}

});
/**
 * @author jiangqifan
 * @since 2013-4-24
 */
COM.widget.Grid.GridDragTracker = function GridDragTracker(editPart) {
	COM.widget.Grid.GridDragTracker.superclass.constructor.call(this);
	this.editPart = editPart;
};

COM.widget.Grid.GridDragTracker.extend(COM.gef.SimpleDragTracker, {
	setEditPart : function(editPart) {
		this.editPart = editPart;
	},
	handleDoubleClick : function(button) {

		var part = this.getEditPart();

		if (part.revalTimeout) {
			clearTimeout(part.revalTimeout);
			part.revalTimeout = null;
		}

		var input = this.getCurrentInput();
		var mouse = input.getMouseLocation();
		var colRow = part.getColRow(mouse.x, mouse.y);
		if (colRow && colRow.col != null && colRow.row != null) {
			// part.fireEvent('celldbClick',{
			// 'cell': part.getCellController(colRow.col,colRow.row),
			// 'x':mouse.x,
			// 'y': mouse.y,
			// 'origin':input.getBrowserEvent()
			// });
		}

		// var cell = this.getCell(colRow.col,colRow.row);
		// if (!cell || !part.canEdit(cell)) {
		// return;
		// }
		if (colRow && colRow.col && colRow.row) {
			// part.setCurrentCell(colRow.col, colRow.row,{
			// 'type' : COM.widget.Grid.CAUSE_MOUSE,
			// 'value' : button
			// },null,true);
			if (colRow.col == part.currentCellCol
					&& colRow.row == part.currentCellRow) {
				part.editCurrentCell({
							'type' : COM.widget.Grid.CAUSE_MOUSE,
							'value' : button
						});
			}
		}
	},
	handleButtonDown : function(button) {
		var part = this.getEditPart();

		this.button = button;

		var colRow = part.getColRow(this.startX, this.startY);
		// 定位用于获取焦点的input，以避免如果点击了一个不可选择的单元格，focus时会自动滚回到之前的当前单元格的地方去.
		// 这里所说的focus为外部调用focus方法，会在本方法之后调用.所以此方法可行.
		// 如果点解了一个可选择的单元格，设置了当前单元格之后，input就跟着当前单元格走.
		part.locateFocusReciver(this.startX, this.startY);

		if (colRow == null) {
			return;
		}
		var pressedInSelection;
		if (button == 2) {
			// 右键点击时计算是否点在已选中区域
			var selections = part.getSelections();
			for (var i = 0; i < selections.length; i++) {
				var theSelection = selections[i];
				if (colRow.col >= theSelection.x
						&& colRow.col < theSelection.right()
						&& colRow.row >= theSelection.y
						&& colRow.row < theSelection.bottom()) {
					pressedInSelection = true;
					break;
				}
			}
		}
		var cell = part.getCell(colRow.col, colRow.row);

		// print log info-----------------------------------start
		Debugger.log("cell:");
		Debugger.log(cell);
		var colData = part.getModel().getCol(colRow.col);
		var rowData = part.getModel().getRow(colRow.row);
		Debugger.log("col:");
		Debugger.log(colData);
		Debugger.log("row:");
		Debugger.log(rowData);
		// print log info-----------------------------------end

		var input = this.getCurrentInput();
		part.fireEvent(COM.widget.Grid.Event.CELL_MOUSE_DOWN, {
					'cell' : part.getCellController(colRow.col, colRow.row),
					'x' : this.startX,
					'y' : this.startY,
					'origin' : input.getBrowserEvent()
				});
		// 鼠标按下的单元格行列值
		this.startCol = colRow.col;
		this.startRow = colRow.row;
		var model = part.getModel();

		var notAdjust = false;

		// 如果右键点在已选中区域，直接返回
		if (pressedInSelection) {
			return COM.widget.Grid.GridDragTracker.superclass.handleButtonDown
					.call(this, button);
		}
		// 选择
		var newCurrent;
		var selection;
		if (colRow.col >= 1 && colRow.row >= 1) {
			// if (!((part.getSelectionMode() ==
			// COM.widget.Grid.SELECTION_MODE_ROW && !part
			// .getModel().isRowSelectable()) || (part.getSelectionMode() ==
			// COM.widget.Grid.SELECTION_MODE_COL && !part
			// .getModel().isColSelectable()))) {}

			if (cell.selectable) {
				if (input.isShiftKeyDown()
						&& part.getSelectionMode() != COM.widget.Grid.SELECTION_MODE_SINGLE) {
					var currentCell = part.getCurrentCellColRow();

					selection = new Rectangle(Math.min(currentCell.col,
									colRow.col), Math.min(currentCell.row,
									colRow.row), Math.abs(currentCell.col
									- colRow.col)
									+ 1, Math.abs(currentCell.row - colRow.row)
									+ 1);
				} else {
					newCurrent = {
						'col' : colRow.col,
						'row' : colRow.row
					};
					this.sourceCol = colRow.col;
					this.sourceRow = colRow.row;
					this.targetRow = colRow.row;
					this.targetCol = colRow.col;
					selection = this.createSelections(this.sourceCol,
							this.sourceRow, this.targetCol, this.targetRow);
				}
			}

		} else if (colRow.col == 0 && colRow.row == 0) {
			notAdjust = true;
			if (part.getSelectionMode() != COM.widget.Grid.SELECTION_MODE_SINGLE) {
				if (input.isShiftKeyDown()) {
					var currentCell = part.getCurrentCellColRow();
					var selection = new Rectangle(1, 1,
							part.getModel().data.colCount - 1,
							part.getModel().data.rowCount - 1);
				} else {
					// 设置当前单元格
					newCurrent = {
						'col' : part.getFirstCurrentCol(),
						'row' : part.getFirstCurrentRow()
					};
					// 选择全部
					this.sourceCol = 1;
					this.sourceRow = 1;
					var selection = new Rectangle(1, 1,
							part.getModel().data.colCount - 1,
							part.getModel().data.rowCount - 1);
				}

			}
		} else if (colRow.col == 0) {
			notAdjust = true;
			// 行选
			if ((part.getSelectionMode() == COM.widget.Grid.SELECTION_MODE_MULTI || part
					.getSelectionMode() == COM.widget.Grid.SELECTION_MODE_ROW)
					&& part.getModel().isRowSelectable()) {
				if (input.isShiftKeyDown()) {
					var currentCell = part.getCurrentCellColRow();
					var selection = new Rectangle(1, Math.min(colRow.row,
									currentCell.row),
							part.getModel().data.colCount - 1, Math
									.abs(colRow.row - currentCell.row)
									+ 1);
				} else {
					newCurrent = {
						'col' : part.getFirstCurrentCol(),
						'row' : colRow.row
					};

					this.sourceCol = 1;
					this.sourceRow = colRow.row;

					selection = new Rectangle(1, colRow.row,
							part.getModel().data.colCount - 1, 1);
				}

			}
		} else if (colRow.row == 0) {
			notAdjust = true;
			if (model.isColExchangeable()) {
				this.changeColSource = colRow.col;
				this.setFlag(COM.widget.Grid.GridDragTracker.FLAG_EXCHANGE_COL,
						true)
			} else {
				// 列选
				if ((part.getSelectionMode() == COM.widget.Grid.SELECTION_MODE_MULTI || part
						.getSelectionMode() == COM.widget.Grid.SELECTION_MODE_COL)
						&& part.getModel().isColSelectable()) {
					if (input.isShiftKeyDown()) {
						var currentCell = part.getCurrentCellColRow();
						var selection = new Rectangle(Math.min(colRow.col,
										currentCell.col), 1, Math
										.abs(colRow.col - currentCell.col)
										+ 1, part.getModel().data.rowCount - 1);
					} else {
						newCurrent = {
							'col' : colRow.col,
							'row' : part.getFirstCurrentRow()
						};

						this.sourceCol = colRow.col;
						this.sourceRow = 1;
						selection = new Rectangle(colRow.col, 1, 1, part
										.getModel().data.rowCount
										- 1);
					}
				}
			}
		}

		// 改变当前单元格
		if (newCurrent) {
			var result = part.setCurrentCell(newCurrent.col, newCurrent.row, {
						'type' : COM.widget.Grid.CAUSE_MOUSE,
						'value' : button
					}, null, true);

			if (result != null) {
				// 如果不允许改变当前单元格，则阻止事件默认操作
				var e = input.getBrowserEvent()
				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
			}

		}

		// 设置选择区域
		if (selection && selection.height > 0
				&& selection.bottom() <= part.getModel().data.rowCount
				&& selection.width > 0
				&& selection.right() <= part.getModel().data.colCount) {
			this.setFlag(COM.widget.Grid.GridDragTracker.FLAG_SELECT, true)
			if (input.isControlKeyDown()
					&& part.getSelectionMode() != COM.widget.Grid.SELECTION_MODE_SINGLE) {
				// 如果按下了ctrl
				part.addSelection(selection, notAdjust);
			} else if (input.isShiftKeyDown()
					&& part.getSelectionMode() != COM.widget.Grid.SELECTION_MODE_SINGLE) {
				part.setSelection(selection, notAdjust);
			} else {
				// 如果没有辅助键
				part.select(selection, notAdjust);
			}
		}
		return COM.widget.Grid.GridDragTracker.superclass.handleButtonDown
				.call(this, button);
	},
	createSelections : function(x1, y1, x2, y2) {
		var x, y, width, height;
		x = Math.min(x1, x2);
		y = Math.min(y1, y2);
		width = Math.abs(x1 - x2) + 1;
		height = Math.abs(y1 - y2) + 1;
		return new Rectangle(x, y, width, height);
	},
	handleButtonUp : function(button) {

		var part = this.getEditPart();
		var input = this.getCurrentInput();
		var mouse = input.getMouseLocation();
		var colRow = part.getColRow(mouse.x, mouse.y);
		if (colRow) {
			part.fireEvent(COM.widget.Grid.Event.CELL_MOUSE_UP, {
						'cell' : part.getCellController(colRow.col, colRow.row),
						'x' : mouse.x,
						'y' : mouse.y,
						'origin' : input.getBrowserEvent()
					});
		}
		if (this.getFlag(COM.widget.Grid.GridDragTracker.FLAG_SELECT)) {
			// 只提供时机
			part.fireEvent(COM.widget.Grid.Event.SELECTION);
			this.clearScrollTimer();
		}
		this.setFlag(COM.widget.Grid.GridDragTracker.FLAG_SELECT, false);
		this.setFlag(COM.widget.Grid.GridDragTracker.FLAG_EXCHANGE_COL, false);

		return COM.widget.Grid.GridDragTracker.superclass.handleButtonUp.call(
				this, button);
	},
	clearScrollTimer : function() {
		if (this.scrollTimer) {
			clearTimeout(this.scrollTimer);
			this.scrollTimer = null;
		}
	},
	beginToScrollDown : function() {
		if (this.scrollTimer == null) {
			var self = this;
			var part = this.getEditPart();
			this.scrollTimer = setInterval(function() {
						part.scrollVerti(true, 1);
						self._doDragSelect({
									'col' : self.targetCol,
									'row' : part.drawEndRow
								}, part);
						if (part.drawEndRow >= part.footerStartRow - 1) {
							self.clearScrollTimer();
						}
					}, 30);
		}
	},
	beginToScrollUp : function() {
		if (this.scrollTimer == null) {
			var self = this;
			var part = this.getEditPart();
			this.scrollTimer = setInterval(function() {
						part.scrollVerti(false, 1);
						self._doDragSelect({
									'col' : self.targetCol,
									'row' : part.drawStartRow
								}, part);
						if (part.drawStartRow <= part.getModel()
								.getRowHeaderCount()) {
							self.clearScrollTimer();
						}
					}, 30);
		}
	},
	beginToScrollRight : function() {
		if (this.scrollTimer == null) {
			var self = this;
			var part = this.getEditPart();
			this.scrollTimer = setInterval(function() {
						part.scrollHoriz(true, 1);
						self._doDragSelect({
									'col' : part.drawEndCol,
									'row' : self.targetRow
								}, part);
						if (part.drawEndCol >= part.footerStartCol - 1) {
							self.clearScrollTimer();
						}
					}, 30);
		}
	},
	beginToScrollLeft : function() {
		if (this.scrollTimer == null) {
			var self = this;
			var part = this.getEditPart();
			this.scrollTimer = setInterval(function() {
						part.scrollHoriz(false, 1);
						self._doDragSelect({
									'col' : part.drawStartCol,
									'row' : self.targetRow
								}, part);
						if (part.drawStartCol <= part.getModel()
								.getColHeaderCount()) {
							self.clearScrollTimer();
						}
					}, 30);
		}
	},
	scrollToRight : function() {
		var part = this.getEditPart();
		part.setScrollLeft(part.getScrollWidth());
	},
	scrollToLeft : function() {
		var part = this.getEditPart();
		part.setScrollLeft(0);
	},
	scrollToBottom : function() {
		var part = this.getEditPart();
		part.setScrollTop(part.getScrollHeight());
	},
	scrollToTop : function() {
		var part = this.getEditPart();
		part.setScrollTop(0);
	},
	handleDragInProgress : function() {

		var part = this.getEditPart();
		var input = this.getCurrentInput();
		var mouse = input.getMouseLocation();
		var colRow = part.getColRow(mouse.x, mouse.y);
		if (colRow == null) {
			return;
		}
		var source = part.getCellController(this.startCol, this.startRow);
		var target = part.getCellController(colRow.col, colRow.row);
		part.fireEvent(COM.widget.Grid.Event.CELL_DRAG, {
					'source' : source,
					'target' : target,
					'x' : mouse.x,
					'y' : mouse.y,
					'origin' : input.getBrowserEvent()
				});

		if (this.getFlag(COM.widget.Grid.GridDragTracker.FLAG_EXCHANGE_COL)) {
			this.changeColTarget = colRow.col;
			this.updateSourceRequest();
			this.showSourceFeedback();
		} else if (this.getFlag(COM.widget.Grid.GridDragTracker.FLAG_SELECT)) {
			if (this.targetRow != colRow.row || this.targetCol != colRow.col) {
				// 处理滚动

				if (this._selectBringScroll(colRow, part)) {
					colRow = part.getColRow(mouse.x, mouse.y);
					if (colRow == null) {
						return;
					}
					source = part.getCellController(this.startCol,
							this.startRow);
					target = part.getCellController(colRow.col, colRow.row);
					part.fireEvent(COM.widget.Grid.Event.CELL_DRAG, {
								'source' : source,
								'target' : target,
								'x' : mouse.x,
								'y' : mouse.y,
								'origin' : input.getBrowserEvent()
							});
					Debugger.log('again');
				}
				// 执行选择
				this._doDragSelect(colRow, part);
			}
		}

		return COM.widget.Grid.GridDragTracker.superclass.handleDragInProgress
				.call(this);

	},
	// 通过拖拽选择单元格时，可能触发表格滚动，一下为八种需要滚动的情况
	_selectBringScroll : function(colRow, part) {
		var refreshColRow = false;
		if (colRow.row >= part.drawEndRow && this.sourceRow <= part.drawEndRow
				&& colRow.row > this.sourceRow
				&& part.drawEndRow < part.footerStartRow - 1) {
			this.beginToScrollDown();
		} else if (colRow.row <= part.drawStartRow
				&& this.sourceRow >= part.drawStartRow
				&& colRow.row < this.sourceRow
				&& part.drawStartRow > part.getModel().getRowHeaderCount()) {
			this.beginToScrollUp();
		} else if (colRow.col >= part.drawEndCol
				&& this.sourceCol <= part.drawEndCol
				&& colRow.col > this.sourceCol
				&& part.drawEndCol < part.footerStartCol - 1) {
			this.beginToScrollRight();
		} else if (colRow.col <= part.drawStartCol
				&& this.sourceCol >= part.drawStartCol
				&& colRow.col < this.sourceCol
				&& part.drawStartCol > part.getModel().getColHeaderCount()) {
			this.beginToScrollLeft();
		} else if (colRow.col <= part.drawEndCol
				&& this.sourceCol >= part.footerStartCol
				&& !this._colInSelection(part.footerStartCol - 1, part) /*
																		 * &&
																		 * part.drawEndCol <
																		 * part.footerStartCol -
																		 * 1
																		 */) {
			this.scrollToRight();
			refreshColRow = true;
		} else if (colRow.col >= part.drawStartCol
				&& this.sourceCol < part.getModel().getColHeaderCount()
				&& !this._colInSelection(part.getModel().getColHeaderCount()
								+ 1, part)/* && part.getScrollLeft() > 0 */) {
			this.scrollToLeft();
			refreshColRow = true;
		} else if (colRow.row <= part.drawEndRow
				&& this.sourceRow >= part.footerStartRow
				&& !this._rowInSelection(part.footerStartRow - 1, part)/*
																		 * &&
																		 * part.drawEndRow <
																		 * part.footerStartRow -
																		 * 1
																		 */) {
			this.scrollToBottom();
			refreshColRow = true;
		} else if (colRow.row >= part.drawStartRow
				&& this.sourceRow < part.getModel().getRowHeaderCount()
				&& !this._rowInSelection(part.getModel().getRowHeaderCount()
								+ 1, part)/* && part.getScrollTop() > 0 */) {
			this.scrollToTop();
			refreshColRow = true;
		} else {
			this.clearScrollTimer();
		}
		return refreshColRow;
	},
	_rowInSelection : function(row, part) {
		var selection = part.getSelection();
		return selection.y <= row && selection.y + selection.height >= row;
	},
	_colInSelection : function(col, part) {
		var selection = part.getSelection();
		return selection.x <= col && selection.x + selection.width >= col;
	},
	_doDragSelect : function(colRow, part) {

		var notAdjust = false;
		if (this.targetRow != colRow.row || this.targetCol != colRow.col) {

			this.targetRow = colRow.row;
			this.targetCol = colRow.col;

			var selection;
			if (colRow.col >= 1 && colRow.row >= 1) {
				if (part.getSelectionMode() == COM.widget.Grid.SELECTION_MODE_SINGLE) {
					part.setCurrentCell(Math.max(colRow.col, 1), Math.max(
									colRow.row, 1), {
								'type' : COM.widget.Grid.CAUSE_MOUSE,
								'value' : this.button
							});
					selection = new Rectangle(colRow.col, colRow.row, 1, 1);
				} else {
					selection = this.createSelections(this.sourceCol,
							this.sourceRow, this.targetCol, this.targetRow);
				}
			} else if (colRow.col == 0 && colRow.row == 0) {

			} else if (colRow.col == 0) {
				notAdjust = true;
				if (this.startCol == 0
						&& (part.getSelectionMode() == COM.widget.Grid.SELECTION_MODE_MULTI || part
								.getSelectionMode() == COM.widget.Grid.SELECTION_MODE_ROW)
						&& part.getModel().isRowSelectable()) {
					// 行选
					selection = this.createSelections(this.sourceCol,
							this.sourceRow, part.getModel().data.colCount - 1,
							colRow.row);
					// selection = new Rectangle(this.sourceCol,this.sourceRow,
					// part.getModel().data.colCount-1, colRow.row -
					// this.sourceRow +1);
				}
			} else if (colRow.row == 0) {
				notAdjust = true;
				// 列选
				if (this.startRow == 0
						&& (part.getSelectionMode() == COM.widget.Grid.SELECTION_MODE_MULTI || part
								.getSelectionMode() == COM.widget.Grid.SELECTION_MODE_COL)
						&& part.getModel().isColSelectable()) {
					selection = this.createSelections(this.sourceCol,
							this.sourceRow, colRow.col,
							part.getModel().data.rowCount - 1);
					// selection = new Rectangle(this.sourceCol,this.sourceRow,
					// colRow.col - this.sourceCol + 1,
					// part.getModel().data.rowCount-1);
				}
			}

			if (selection) {
				part.setSelection(selection, notAdjust);
			}
		}
	},
	getCommand : function() {
		var command = new COM.gef.UnexecutableCommand();
		if (this.getFlag(COM.widget.Grid.GridDragTracker.FLAG_EXCHANGE_COL)) {
			var request = this.getSourceRequest();
			var part = this.getEditPart();
			var command = part.getCommand(request);
		}
		return command;

	},
	handleDragStarted : function() {
		var part = this.getEditPart();
		// Debugger.log('simpleDrag tracker: handleDragStarted');
		var input = this.getCurrentInput();
		part.fireEvent(COM.widget.Grid.Event.CELL_DRAG_START, {
					'cell' : part.getCellController(this.startCol,
							this.startRow),
					'x' : this.startX,
					'y' : this.startY,
					'origin' : input.getBrowserEvent()
				});

		return COM.widget.Grid.GridDragTracker.superclass.handleDragStarted
				.call(this);
		// return this.stateTransition(COM.gef.AbstractTool.STATE_DRAG,
		// COM.gef.AbstractTool.STATE_DRAG_IN_PROGRESS);
	},
	getOperationSet : function() {
		return [this.getEditPart()];
	},
	updateSourceRequest : function() {
		var request = this.getSourceRequest();
		var mouse = this.getCurrentInput().getMouseLocation();
		if (this.getFlag(COM.widget.Grid.GridDragTracker.FLAG_EXCHANGE_COL)) {
			request.setType(COM.widget.Grid.RequestConstants.COL_EXCHANGE);
			request.source = this.changeColSource;
			request.target = this.changeColTarget;
			request.deltaX = mouse.x - this.startX;
			request.deltaY = mouse.y - this.startY;
		}

	},
	getCommandName : function() {
		return 'Grid Tracker';
	},
	getEditPart : function() {
		return this.editPart;
	}
});

COM.widget.Grid.GridDragTracker.FLAG_SELECT = COM.gef.SimpleDragTracker.FLAG_SOURCE_FEEDBACK << 1;
COM.widget.Grid.GridDragTracker.FLAG_EXCHANGE_COL = COM.widget.Grid.GridDragTracker.FLAG_SELECT << 1;
COM.widget.Grid.GridDragTracker.MAX_FLAG = COM.widget.Grid.GridDragTracker.FLAG_EXCHANGE_COL;

/**
 * @author jiangqifan
 * @since 2013-4-24
 */
COM.widget.Grid.SelectionChangeDragTracker = function SelectionChangeDragTracker(
		editPart, handle) {
	COM.widget.Grid.SelectionChangeDragTracker.superclass.constructor
			.call(this);
	this.editPart = editPart;
	this.handle = handle;
};

COM.widget.Grid.SelectionChangeDragTracker.extend(COM.gef.SimpleDragTracker, {
	setEditPart : function(editPart) {
		this.editPart = editPart;
	},
	createSourceRequest : function() {
		var request = new COM.gef.Request();
		return request;
	},
	handleButtonDown : function(button) {
		var part = this.getEditPart();
		// 如果在编辑状态下点击，则关闭编辑器
		if (part.isEditing()) {
			part.commitEdit(COM.widget.Grid.CAUSE_MOUSE);
		}
		var colRow = part.getRealColRow(this.startX, this.startY);
		this.sourceCol = colRow.col;
		this.sourceRow = colRow.row;
		this.button = button;
		return COM.widget.Grid.SelectionChangeDragTracker.superclass.handleButtonDown
				.call(this, button);
	},
	handleButtonUp : function(button) {
		this.button = null;
		return COM.widget.Grid.SelectionChangeDragTracker.superclass.handleButtonUp
				.call(this, button);
	},
	getCommand : function() {
		var command = new COM.gef.UnexecutableCommand();
		var request = this.getSourceRequest();
		var part = this.getEditPart();
		var command = part.getCommand(request);
		return command;
	},
	getOperationSet : function() {
		return [this.getEditPart()];
	},
	handleDragInProgress : function() {
		var part = this.getEditPart();
		var input = this.getCurrentInput();
		var mouse = input.getMouseLocation();
		var colRow = part.getRealColRow(mouse.x, mouse.y);

		this.targetCol = colRow.col;
		this.targetRow = colRow.row;

		return COM.widget.Grid.SelectionChangeDragTracker.superclass.handleDragInProgress
				.call(this);
	},
	updateSourceRequest : function() {
		var request = this.getSourceRequest();
		var part = this.getEditPart();
		request.setType(COM.widget.Grid.RequestConstants.SELECTION_MOVE);
		var selection = part.getSelection().getCopy();

		var col = selection.x;
		var row = selection.y;
		var right = selection.right() - 1;
		var bottom = selection.bottom() - 1;
		var current = this.getCurrentInput().getMouseLocation();
		if (Math.abs(current.x - this.startX) > Math.abs(current.y
				- this.startY)) {
			if (this.targetCol > selection.x) {
				right = this.targetCol;
			} else {
				// right = col - 1;
				col = this.targetCol;
			}
		} else {
			if (this.targetRow > selection.y) {
				bottom = this.targetRow;
			} else {
				// bottom = row - 1;
				row = this.targetRow;
			}
		}
		request.rect = new Rectangle(col, row, right - col + 1, bottom - row
						+ 1);
		request.button = this.button;
	},
	getEditPart : function() {
		return this.editPart;
	}

});
(function() {
	function addEvent(el, type, fn) {
		(el.attachEvent) ? (el.attachEvent("on" + type, fn)) : (el
				.addEventListener(type, fn, false));
	}
	function locateFace(face, figure) {
		var bounds = figure.getBounds().getCopy();
		figure.translateToAbsolute(bounds);
		face.style.position = "absolute";
		var rightBorderWidth = figure.getRightBorderWidth ? figure
				.getRightBorderWidth() : 0;
		var bottomBordrWidth = figure.getBottomBorderWidth ? figure
				.getBottomBorderWidth() : 0;
		face.style.left = bounds.right()
				- COM.widget.Grid.Grid2Adapter.FACE_WIDTH - rightBorderWidth
				+ 'px';
		face.style.top = bounds.y + 'px';
		face.style.width = COM.widget.Grid.Grid2Adapter.FACE_WIDTH + 'px';
		face.style.height = bounds.height - bottomBordrWidth + 'px';
	}
	function FaceController() {
		this.faces = {};
		this.activeFace;
		this.activeCell = null;
		this.isShowing = false;
	}
	FaceController.extend(Object, {
		onCurrentCellChanged : function(e) {
			this.hideFace(this.activeCell, e.grid);
			this.activeCell = null;
			if (!e.grid.canCellEdit(e.col, e.row)) {
				return;
			}
			// 直接打开编辑器
			// if (this.showFace(e.col,e.row,e.grid)) {
			// this.activeCell = e.grid.getCell(e.col, e.row);
			// }
			e.grid.openEditor(e.col, e.row);
		},
		onEditorOpen : function(e) {
			this.hideFace(this.activeCell, e.grid);
			this.activeCell = null;
		},
		onEditModeChanged : function(e) {
			if (this.isShowing) {
				if (!e.grid.canCellEdit(e.col, e.row)) {
					this.hideFace(this.activeCell, e.grid);
				}
			} else {
				if (e.grid.canCellEdit(e.col, e.row)) {
					this.onCurrentCellChanged(e);
				}
			}
		},
		// 单元格只读和表格只读的时候需要关闭

		showFace : function(col, row, grid) {
			if (col == -1 || row == -1) {
				return;
			}
			var cell = grid.getCell(col, row);
			var type;
			if (cell) {
				type = this.faceGetter(cell);
				// cell.getClientData().face;
				var face = this.getFace(type);
				if (face) {
					addEvent(face, "click", function() {
								grid.editCurrentCell({
											'type' : COM.widget.Grid.CAUSE_CLICKFACE
										});
							});
					var cellFigure = cell.getFigure();
					if (cellFigure) {
						cellFigure.addFigureListener(this);
					}
					// grid.append(face,col,row);
					face.style.display = "";
					// GridFigure可以getIndex
					var index = this.getZindex(cellFigure);
					if (null == index) {
						index = 9;
					}
					face.style.zIndex = index;
					locateFace(face, cellFigure);
					this.activeFace = face;
					this.activeFigure = cellFigure;
					this.isShowing = true;
					this.visible = true;
					return true;
				}
			}
		},

		getZindex : function(cellFigure) {
			var parent = cellFigure.getParent();
			if (parent && parent.getZindex) {
				return parent.getZindex(cellFigure);
			}
		},

		figureMoved : function(figure) {
			if (!this.activeFace) {
				return;
			}
			locateFace(this.activeFace, figure);
		},
		hideFace : function(cell, grid) {
			if (this.activeFace) {
				// grid.remove(this.activeFace);
				this.activeFace.style.display = "none";
				this.activeFace = null;
			}
			if (cell) {
				var figure = cell.getFigure();
				if (figure) {
					figure.removeFigureListener(this);
				}
			}
			this.visible = false;
			this.isShowing = false;
			this.activeFigure = null;
		},
		checkVisible : function(e) {
			if (this.isShowing && this.activeFigure && this.activeFace) {
				if (this.activeFigure.getParent() != null && !this.visible) {
					this.activeFace.style.display = "";
					this.visible = true;
				} else if (this.activeFigure.getParent() == null
						&& this.visible) {
					this.activeFace.style.display = "none";
					this.visible = false;
				}
			}
		},
		setFace : function(type, obj) {
			this.faces[type] = obj;

		},
		getFace : function(type) {
			return this.faces[type];
		},
		getFaces : function() {
			return this.faces;
		}
	});

	COM.widget.Grid.Grid2Adapter = function Grid2Adapter() {
		this.faceController = new FaceController();
		this.configs = {};
	}
	COM.widget.Grid.Grid2Adapter.extend(Object, {
		init : function(grid) {
			grid.addListener('currentCellChanged',
					this.faceController.onCurrentCellChanged,
					this.faceController);
			grid.addListener('editorOpen', this.faceController.onEditorOpen,
					this.faceController);
			grid.addListener('editModeChanged',
					this.faceController.onEditModeChanged, this.faceController);
			grid.addListener('layout', this.faceController.checkVisible,
					this.faceController);
			grid.addListener('reload', this.reAppend, this);

			var faces = this.faceController.getFaces();
			var face = null;
			for (var key in faces) {
				face = faces[key];
				face.style.display = "none";
				grid.appendChild(face);
			}
		},
		reAppend : function(e) {
			var grid = e.grid;
			var faces = this.faceController.getFaces();
			var face = null;
			for (var key in faces) {
				face = faces[key];
				// face.style.display = "none";
				grid.appendChild(face);
			}
		},
		getFaceController : function() {
			return this.faceController;
		},
		setFace : function(type, obj) {
			this.faceController.setFace(type, obj);
		},
		getFace : function(type) {
			return this.faceController.getFace(type);
		},
		setGetFaceFun : function(fn) {
			this.faceController.faceGetter = fn;
		}
	});
	COM.widget.Grid.Grid2Adapter.FACE_TYPE_LIST = 1;
	COM.widget.Grid.Grid2Adapter.FACE_TYPE_POP = 2;
	COM.widget.Grid.Grid2Adapter.FACE_WIDTH = 20;
})();