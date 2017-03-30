function Questionnaire(shell, data,cb) {
	this.callback = cb;
	this.questionnaireTemp = data;
	this.answer = {};
	this.subtables ={};
	this._scritptObj = [];
	this.errorInfos= {"array":[]};

	
	var questionFactoryStr = '	{{if type=="group" }}{{tmpl \'questionGroup\'}}	{{/if}}		{{if type=="single" }}{{tmpl \'singleQuestion\'}}	{{/if}}	{{if type=="multiple" }}		{{tmpl \'multipleQuestion\'}}	{{/if}}		{{if type=="fillblanks" }}		{{tmpl \'fillblankQuestion\'}}	{{/if}}		{{if type=="shortanswer" }}		{{tmpl \'shortanswerQuestion\'}}	{{/if}}		{{if type=="order" }}{{tmpl \'orderQuestion\'}}	{{/if}}     {{if type=="static" }}{{tmpl \'staticQuestion\'}}	{{/if}}	{{if type=="table" }}{{tmpl \'tableQuestion\'}}	{{/if}}';
	$.template('questionFactory', questionFactoryStr);
	
	var questionGroupStr = '<div name=${question}>	<fieldset>		<legend><span class="${level}">${levelNum}${title}</span></legend>		<blockquote>{{tmpl(questions) \'questionFactory\'}}	</blockquote></fieldset></div>';
	$.template('questionGroup', questionGroupStr);
	
	var singleOptionStr = '{{if optionlayout >0}} 		<table width="100%">{{/if}} {{each(i,option) options}}	{{if i%optionlayout ==0 }} 		  <tr>	{{/if}} 		<td align="left" >	<label><input type="radio" name=${question} value="${title}" {{if option.inputable }} 	data-zb=${zb}		{{/if}} 	/>	<span class="option">${optionNum}</span>${title}	</label>{{if option.inputable}} 		<input type="text" name=${question} data-zb=${zb} placeholder="ÇëÊäÈë"  class="fbstyle"	style="WIDTH: 80px;" />	{{/if}}		</td>		{{if i%optionlayout == optionlayout - 1 }} 		  </tr>	{{/if}}{{/each}}{{if optionlayout >0}} 		</table>{{/if}} <input style="display:none;"  type="radio" name=${question}  value="hide"/>';
	$.template('singleOption', singleOptionStr);
	
	var singleQuestionStr = '<div name=${question} data-zb=${zb}>	<span class="${level}">${levelNum}${title}</span>			{{if optionlayout !=0 }} 		{{if description  !== \'\' }} 			<br /> 			<span class="quesdesc">${description}</span>		{{/if}} 		<br /> 	{{/if}} 	{{tmpl \'singleOption\'}}	{{if optionlayout ==0 }} 		{{if description  !== \'\' }} 			<br /> 			<span class="quesdesc">${description}</span>		{{/if}} 	{{/if}} </div>';
	$.template('singleQuestion', singleQuestionStr);
	
	var multipleQuestionStr = '<div name=${question} data-zb=${zb}>	<span class="${level}">${levelNum}${title}</span>		{{if optionlayout !=0 }} 		{{if description  !== \'\' }} 			<br /> 			<span class="quesdesc">${description}</span>		{{/if}} 		<br /> 	{{/if}} 	{{tmpl \'multipleOption\'}}	{{if optionlayout ==0 }} 		{{if description  !== \'\' }} 			<br /> 			<span class="quesdesc">${description}</span>		{{/if}} 	{{/if}} </div>';
	$.template('multipleQuestion', multipleQuestionStr);
	
	var multipleOptionStr = '{{if optionlayout >0}} 		<table width="100%">{{/if}}{{each(i,option) options}}	{{if i%optionlayout ==0 }} 		  <tr>	{{/if}} 		<td align="left" >		<label><input type="checkbox" name=${question} value="${title}" 		{{if option.inputable}} 	data-zb=${zb}		{{/if}} 	/>	<span class="option">${optionNum}</span>${title}	<label>{{if option.inputable}} 		<input type="text" name=${question} data-zb=${zb} placeholder="ÇëÊäÈë"	 class="fbstyle"	style="WIDTH: 80px;" />	{{/if}}		</td>		{{if i%optionlayout == optionlayout - 1 }} 		  </tr>	{{/if}}{{/each}}{{if optionlayout >0}} 		</table>{{/if}}';
	$.template('multipleOption', multipleOptionStr);
	
	var fillblankQuestionStr = '<div name=${question}></div>';
	$.template('fillblankQuestion', fillblankQuestionStr);	
	
	var shortanswerQuestionStr = '<div name=${question} data-zb=${zb}> 	<span class="${level}">${levelNum}${title}</span>	{{if description  !== \'\' }} 		<br /> 		<span class="quesdesc">${description}</span>	{{/if}} 	ÇëÊäÈë´ð°¸£º	<br />	<textarea name=${zb}  maxlength=${maxnum}  style="width:${width}px;height:${hight}px;" ></textarea></div>';
	$.template('shortanswerQuestion', shortanswerQuestionStr);
	
	var orderOptionStr = '<table > {{each(i,option) options}}	<tr style="border-bottom:#a1a1a1 solid 1px;">		<td style="text-align:left;vertical-align:middle;width:30px" >	<div name=${zb} style=" width:15px; height:15px; text-align:center;line-height:15px; border:1px solid #a1a1a1;border-radius:15px"></div>  </td> 	<td style="text-align:left;vertical-align:middle;word-break:break-all"><label  name=${zb}> ${title} </label>  </td>	</tr>	{{/each}} </table> ';
	$.template('orderOption', orderOptionStr);
	
	var orderQuestionStr = '<div name=${question} >	<span class="${level}">${levelNum}${title}</span>			{{if optionlayout !=0 }} 		{{if description  !== \'\' }} 			<br /> 			<span class="quesdesc">${description}</span>		{{/if}} 		<br /> 	{{/if}} 	{{tmpl \'orderOption\'}}	{{if optionlayout ==0 }} 		{{if description  !== \'\' }} 			<br /> 			<span class="quesdesc">${description}</span>		{{/if}} 	{{/if}} </div>';
	$.template('orderQuestion', orderQuestionStr);
	
	var staticQuestionStr = '<div name=${question}></div>';
	$.template('staticQuestion', staticQuestionStr);
	
//	var tableQuestionStr = '<div name=${question + "button"}></div> <div name=${question}></div>';
	var tableQuestionStr = '<span class="${level}">${levelNum}${title}</span>{{if description  !== \'\' }}<br /><span class="quesdesc">${description}</span>{{/if}}<br /><div name=${question + "button"}></div><div name=${question}></div>';
	$.template('tableQuestion', tableQuestionStr);	

	var questionnaireStr = '<div class="text" style=" text-align:center;">	<br />	<h1><span>${title}</span></h1>	</div> <br />{{tmpl(questions) \'questionFactory\'}}';
	$.template('questionnaire', questionnaireStr);

	//³õÊ¼»¯ÎÊ¾í
	this.initquestionnaire = function() {
		//Ê¹ÓÃ
		this._addCSS(this.questionnaireTemp.css);

		$.tmpl('questionnaire', this.questionnaireTemp).appendTo(shell); 
		
		if (this.questionnaireTemp.answer) {
			this.answer = this.questionnaireTemp.answer;
			
		}
		//³õÊ¼»¯´ð°¸
		this._setAnswer(this.questionnaireTemp.questions);
		this._triggerScript();
	}
	
	this._triggerScript = function(){
		for(var i=0;i<this._scritptObj.length;i++){
			$('input[name="' + this._scritptObj[i] + '"]').trigger('input');
		}
	}
	
	this._triggerChoice = function(){		
		$("input:checked").trigger('change');
	}
	
	//ÉèÖÃÎÊ¾íµ÷²é´ð°¸
	this.setAnswer = function(questionnaireAnswer){
		this.answer = questionnaireAnswer;
		//³õÊ¼»¯´ð°¸
		this._setAnswer(this.questionnaireTemp.questions);
	}
	

	//Çå¿Õ´ð°¸
	this.clearAnswer = function() {
		this.answer = {};
		this._setAnswer(this.questionnaireTemp.questions);
	}

	//ÉèÖÃÂß¼­Ìø×ªÉèÖÃ
	this.setLogicJump = function(hidelist,showlist){
		for(var i = 0; i < hidelist.length ; i++ ){
			$('div[name="' + hidelist[i] + '"]').hide();
		}
		for(var i = 0; i < showlist.length ; i++ ){
			$('div[name="' + showlist[i] + '"]').show();
		}
	}

	this.findTopicByName = function(name){
		return $('div[name="'+name+'"]');
	}
	
	//ÉèÖÃÎÊ¾í´ð°¸
	this._setAnswer = function(questions) {
		//±éÀúÌâÄ¿
		var editor = this;
		$.each(questions, function (n, questiondata) {
			if (questiondata.type == "group") {
				editor._setAnswer(questiondata.questions);
			} else if (questiondata.type == "table") {
				editor._tableanswer(questiondata);
			}
		});
		
		$.each(questions, function (n, questiondata) {

			if (questiondata.type == "single") {
				editor._setsingleanswer(questiondata);
			} else if (questiondata.type == "multiple") {
				editor._initmultipleanswer(questiondata);
			} else if (questiondata.type == "fillblanks") {
				editor._fillblanksanswer(questiondata);
			} else if (questiondata.type == "shortanswer") {
				editor._shortansweranswer(questiondata);
			} else if (questiondata.type == "order") {
				editor._orderanswer(questiondata);
			} else if (questiondata.type == "static") {
				editor._staticanswer(questiondata);
			}
		});
	}

	//ÉèÖÃµ¥Ñ¡Ìâ´ð°¸
	this._setsingleanswer = function(questiondata) {
		var singleanswer = "";
		if (this.answer[questiondata.zb]) {
			singleanswer = this.answer[questiondata.zb];
		}
		var editor = this;
		//±éÀúÑ¡Ïî£¬ÕÒÄ¬ÈÏÖµ
		$.each(questiondata.options, function (n, option) {
			if (singleanswer == "" && option.selected) {
					singleanswer = option.title;
					editor.answer[questiondata.zb] = singleanswer;
				}

			if (singleanswer == option.title && option.inputable ) {
				$('input:text[name="' + questiondata.question + '"]').show();
				if (editor.answer[option.zb]) {
					$('input:text[name="' + questiondata.question + '"]').val(editor.answer[option.zb]);
				}
			} else if(option.inputable){
				$('input:text[name="' + questiondata.question + '"]').hide();
			}
		});

		//Ñ¡Ïîµã»÷ÊÂ¼þ
		$('input:radio[name="' + questiondata.question + '"]').change(function () {
			var showlist=[];
			var hidelist=[];
			if (typeof($(this).attr("data-zb")) != "undefined") {
				$('input:text[name="' + questiondata.question + '"]').show();
			} else {
				$('input:text[name="' + questiondata.question + '"]').hide();
			}
			
			editor.answer[questiondata.zb] = this.value;
			editor.callback(editor.answer);

			//Âß¼­Ìø×ª			
			$.each(questiondata.options, function (n, option) {
				if (editor.answer[questiondata.zb] == option.title) {
					$.each(option.relquestion, function (n, rel) {
						if(0>hidelist.indexOf(rel)){
							hidelist.push(rel);
						}
						if(0>showlist.indexOf(rel)){
							showlist.push(rel);
						}
					})
				}
				$.each(option.relquestion, function (n, rel) {
					if(0>hidelist.indexOf(rel)){
						hidelist.push(rel);
					}				
				});				
			});

			editor.setLogicJump(hidelist,showlist);
			
		});
		
		$('input:text[name="' + questiondata.question + '"]').change(function(){ 
			editor.answer[this.getAttribute("data-zb")] = this.value;
			editor.callback(editor.answer);
		}); 

		if (singleanswer != "") {
			var c = $('input:radio[name="' + questiondata.question + '"][value="' + singleanswer + '"]');
			c.attr("checked", true);
			c.trigger('change');
		} else {
			$('input:radio[name="' + questiondata.question + '"][value="hide"]').attr("checked", true);
		}

	}

	//ÉèÖÃ¶àÑ¡Ìâ´ð°¸
	this._initmultipleanswer = function(questiondata) {

		var multipleanswer = "";
		var isnull = true;
		var showlist = [];
		var hidelist = [];
		if (this.answer[questiondata.zb]) {
			multipleanswer = this.answer[questiondata.zb];
			isnull = false;
		}

		var editor = this;
		//Ñ¡Ïîµã»÷ÊÂ¼þ
		$('input:checkbox[name="' + questiondata.question + '"]').change(function () {
			var showlist=[];
			var hidelist=[];
			if (typeof($(this).attr("data-zb")) != "undefined") {
				if ($(this).is(':checked')) {
					$('input:text[name="' + questiondata.question + '"]').show();
				} else {
					$('input:text[name="' + questiondata.question + '"]').hide();
				}
			}
			editor.answer[questiondata.zb] = $('input:checkbox[name="' + questiondata.question + '"]:checked').map(function (index, elem) {
					return $(elem).val();
				}).get().join('#$^');
			editor.callback(editor.answer);
			
			//Âß¼­Ìø×ª
			$.each(questiondata.options, function (n, option) {
				if (editor.answer[questiondata.zb].indexOf(option.title) >= 0) {
					$.each(option.relquestion, function (n, rel) {
						showlist.push(rel);
					});
				} else {
					$.each(option.relquestion, function (n, rel) {
						hidelist.push(rel);
					});
				}
			});
			
			editor.setLogicJump(hidelist,showlist);
		});
		
		
		//±éÀúÑ¡Ïî£¬ÕÒÄ¬ÈÏÖµ
		$.each(questiondata.options, function (n, option) {
			if (isnull && option.selected) {
				multipleanswer = multipleanswer + '#$^' + option.title;
				editor.answer[questiondata.zb] = multipleanswer;
			}

			var splitAnswer = multipleanswer.split("#$^");
			var c = $('input:checkbox[name="' + questiondata.question + '"][value="' + option.title + '"]');
			if ($.inArray(option.title, splitAnswer) >= 0) {
				c.attr("checked", true);
				if (option.inputable) {
					$('input:text[name="' + questiondata.question + '"]').show();
					if (editor.answer[option.zb]) {
						$('input:text[name="' + questiondata.question + '"]').val(editor.answer[option.zb]);
					}
				} else {
					$('input:text[name="' + questiondata.question + '"]').hide();
				}
			} else {
				c.attr("checked", false);
				$('input:text[name="' + questiondata.question + '"]').hide();
			}
			c.trigger('change');
		});
		

		
		$('input:text[name="' + questiondata.question + '"]').change(function(){ 
			editor.answer[this.getAttribute("data-zb")] = "";
			editor.callback(editor.answer);
		}); 

	}
	
		//ÉèÖÃÌî¿ÕÌâ´ð°¸
	this._fillblanksanswer = function(questiondata) {
		var $jsontip = $('[name="' + questiondata.question + '"]');
		$jsontip.empty(); //Çå¿ÕÄÚÈÝ
		var title1 = questiondata.title;
		$.each(questiondata.blanks, function (n, blank) {

			var s = '<input name="' + blank.zb + '"  '
					+ 'data-zb='+ '"' + blank.zb + '" '
					+ 'class= "fbstyle" '
					+ 'placeholder=' + '"' + blank.placehodler + '" '	
					+ 'style="width: ' + blank.width + 'px;' + (blank.align ==2 ?'text-align:right;':'')+ '" '
					+ (blank.readonly?'readonly ':' ')
					+ blank.inputverify  +'/>' ;			
			
			title1 = title1.replace(/_{3,}/, s);
		});

		var strHtml = '<pre><span class="' + questiondata.level + '">'+ questiondata.levelNum  + title1 + '</span> ';
		if(questiondata.description  !== ''){
			strHtml += ' <br>  <span class="quesdesc">' + questiondata.description + '</span>';
		}
		strHtml += '</pre>';

		$jsontip.html(strHtml); //ÏÔÊ¾Ìî¿Õ
	
		var editor = this;
		$.each(questiondata.blanks, function (n, blank) {
			var $input = $('input[name="' + blank.zb + '"]');
			
			if (editor.answer[blank.zb]) {
				if(blank.type==3 && editor.answer[blank.zb] != ''){//Ìî¿ÕÊÇ°Ù·ÖÊý
					$input.val(editor.answer[blank.zb]*100);
				}else{
					$input.val(editor.answer[blank.zb]);
				}
			} else {
				$input.val(blank.defaultValue);
			}
			if(blank.script && 0 <blank.script.length){
				editor._scritptObj.push(blank.zb);
			}
			var old_value = $input.val();
			$input.bind('input propertychange', function() {
				if (this.value == old_value) {
					return;
				}
			    editor.answer[this.name] = this.value;
				editor.callback(editor.answer);
				old_value = this.value;
				if(blank.script && 0 <blank.script.length){
					var sf = "(function(Ques,Item){"+blank.script+"})(editor,{'value':this.value,'name':this.name,'topic':questiondata.question});";
					try{
						eval(sf.toString());	
					}catch(e){}
					
				/*	(function(Ques,Item){
						if(0==Item.value){
						var tobic = Ques.findTopicByName(Item.topic);
						for(var i=0;i<1;i++){
						tobic = tobic.next();
						tobic.hide();}
						}else{
						var tobic = Ques.findTopicByName(Item.topic);
						for(var i=0;i<1;i++){
						tobic = tobic.next();
						tobic.show();
						}}
					})(editor,{'value':this.value,'name':this.name,'topic':questiondata.question});*/
						
				}
			}); 
		});

	}

	//ÉèÖÃ¼ò´ðÌâ´ð°¸
	this._shortansweranswer = function (questiondata) {
		if (this.answer[questiondata.zb]) {
			$('textarea[name="' + questiondata.zb + '"]').val(this.answer[questiondata.zb]);
		} else {
			$('textarea[name="' + questiondata.zb + '"]').val("");
		}
		var editor = this;
		$('textarea[name="' + questiondata.zb + '"]').change(function(){ 
			editor.answer[this.name] = this.value;
			editor.callback(editor.answer);
		});
	}
	
	//ÉèÖÃÅÅÐòÌâ´ð°¸
	this._orderanswer = function (questiondata) {
		var editor = this;	
		var number = 1;
		
		//±éÀúÑ¡Ïî
		$.each(questiondata.options, function (n, option) {
			var optiondiv = $('div[name="' + option.zb + '"]');

			//Ñ¡Ïîµã»÷ÊÂ¼þ
			$('label[name="' + option.zb + '"]').click(function(){
				if(optiondiv[0].children.length){
					var deletenum = optiondiv[0].getAttribute("value");
					optiondiv[0].setAttribute("value",0);
					optiondiv.empty(); //Çå¿ÕÄÚÈÝ
					
					//ÖØÐÂÅÅÐò
					$.each(questiondata.options, function (s, orderoption) {
						var orderoptiondiv = $('div[name="' + orderoption.zb + '"]');
						
						if(orderoptiondiv[0].getAttribute("value") > deletenum){
							var ordernum = orderoptiondiv[0].getAttribute("value");
							ordernum -- ;
							orderoptiondiv.empty(); //Çå¿ÕÄÚÈÝ
							orderoptiondiv[0].setAttribute("value",ordernum);
							var strHtml = '<font size="3" color="red">' + ordernum + '</font>';
							orderoptiondiv.html(strHtml); //ÏÔÊ¾Ìî¿Õ
						}
					});
					
					number -- ;
				}else{
					optiondiv[0].setAttribute("value",number);
					var strHtml = '<font size="3" color="red">' + number + '</font>';
					optiondiv.html(strHtml); //ÏÔÊ¾Ìî¿Õ
					number ++ ;
				}
				
				editor.callback(editor.answer);
			});
			
			//´ð°¸»ØÂä
			if (editor.answer[option.zb]) {
				var optionanswer = editor.answer[option.zb];
				//²éÕÒ´ð°¸Î»ÖÃ
				$.each(questiondata.options, function (s, answeroption) {
					if(optionanswer == answeroption.title){
						var index = n+1;			
						var answeroptiondiv = $('div[name="' + answeroption.zb + '"]');			
						answeroptiondiv[0].setAttribute("value",index);
						var strHtml = '<font size="3" color="red">' + index + '</font>';
						answeroptiondiv.html(strHtml); //ÏÔÊ¾Ìî¿Õ
						number ++ ;
					}
				});
				
			}

		});

	}

	//ÉèÖÃ¾²Ì¬ÎÄ±¾Ìâ
	this._staticanswer = function (questiondata) {
		var $jsontip = $('[name="' + questiondata.question + '"]');
		$jsontip.empty(); //Çå¿ÕÄÚÈÝ
		$jsontip.html(questiondata.title); //ÏÔÊ¾¾²Ì¬ÎÄ±¾
	}
	
	//ÉèÖÃ±í¸ñÌâ
	this._tableanswer = function (questiondata) {
		var $jsontip =  $('[name="' + questiondata.question + '"]');
		var gb = new GridBuilder($jsontip.get(0),questiondata.tableDefine);
		gb.init();
		var editor = this;
		gb.addEventListener('dataChange',function(){
			editor.callback(editor.answer);
		});
		if (this.answer[questiondata.question]) {
			this._settableanswer(gb,this.answer[questiondata.question]);
		}
		this.subtables[questiondata.question]=gb;
		this._settableqequenceIndex(gb);
		if(gb.floatSet.allowAddDel){
			var $buttontip =  $('[name="' + questiondata.question + 'button"]');
			var strHtml = '<input id = "' + questiondata.question + 'add" value = "ÔöÐÐ" type="button">  <input id = "' + questiondata.question + 'del" value = "É¾ÐÐ" type="button">';
			$buttontip.html(strHtml); //ÏÔÊ¾Ìî¿Õ
			
			$("#" + questiondata.question + "add").click( function() {
				if(gb.floatSet.type == 0){
					gb.insertRows(gb.getRowCount() ,1);
				}else{//ÁÐ¸¡¶¯
					gb.insertColumns(gb.getColumnCount() ,1);
				}
				editor.callback(editor.answer);
				editor._settableqequenceIndex(gb);
			});
			$("#" + questiondata.question + "del").click( function() {
				var cell = gb.getCurrentCell();//»ñÈ¡µ±Ç°µ¥Ôª¸ñ
				if(cell.cell !== undefined){
					//¸¡¶¯¿ªÊ¼Î»ÖÃ
					var start = gb.floatSet.index;
					
					if(gb.floatSet.expandField != ""){
						//ÓÐÕ¹¿ªÖ¸±ê
						var expandIndex = editor.answer[questiondata.question][0].indexOf(gb.floatSet.expandField);
						var expandnumber = gb.floatSet.fieldIndexs[expandIndex];
						var candelete = true;
						if(gb.floatSet.type == 0){
							var fieldcell = gb.getCell(expandnumber,cell.getRow());//»ñÈ¡µ¥Ôª¸ñ
							candelete = fieldcell.isEditable();//±àÂë×Ö¶Îµ¥Ôª¸ñÊÇ·ñ¿É±à¼­
						}else{//ÁÐ¸¡¶¯
							var fieldcell = gb.getCell(cell.getCol(),expandnumber);//»ñÈ¡µ¥Ôª¸ñ
							candelete = fieldcell.isEditable();//±àÂë×Ö¶Îµ¥Ôª¸ñÊÇ·ñ¿É±à¼­
						}
						
						if(!candelete){//±àÂë×Ö¶Îµ¥Ôª¸ñ²»¿É±à¼­Ôò²»¿ÉÉ¾³ý
							alert("²»ÔÊÐíÉ¾³ý");
							return ;
						}
						//´ð°¸Êý
						var answercount = 1;
						if(gb.floatSet.type == 0){
							answercount = gb.getRowCount() - start;
						}else{
							answercount = gb.getColumnCount() - start;
						}
						var candeletecount = 0;
						for(var i = 0; i < answercount ; i++ ){ 
							if(gb.floatSet.type == 0){
								var fieldcell = gb.getCell(expandnumber, i+ start);
								if(fieldcell.isEditable()){
									candeletecount ++;
								}
							}else{//ÁÐ¸¡¶¯
								var fieldcell = gb.getCell( i+ start,expandnumber);
								if(fieldcell.isEditable()){
									candeletecount ++;
								}
							}
						}
						
						if(candeletecount  <= 1){//±àÂë×Ö¶Îµ¥Ôª¸ñ²»¿É±à¼­Ôò²»¿ÉÉ¾³ý
							alert("²»ÔÊÐíÉ¾³ý");
							return ;
						}
					}
					
					if(gb.floatSet.type == 0 && cell.getRow() >= start){
						gb.deleteRows(cell.getRow(),1);
					}else if( cell.getCol() >= start ){//ÁÐ¸¡¶¯
						gb.deleteColumns(cell.getCol(),1);
					}
					editor.callback(editor.answer);
					editor._settableqequenceIndex(gb);
				}
			});
		}
	}
	
	//ÉèÖÃ±í¸ñÌâÐòºÅ
	this._settableqequenceIndex = function (gb) {
		if(gb.floatSet.showQequenceIndex > 0){
			//ÐòºÅÁÐ
			var qequenceIndex = gb.floatSet.showQequenceIndex;
			//¸¡¶¯¿ªÊ¼Î»ÖÃ
			var start = gb.floatSet.index;
			
			//´ð°¸Êý
			var answercount = 1;
			if(gb.floatSet.type == 0){
				answercount = gb.getRowCount() - start;
			}else{
				answercount = gb.getColumnCount() - start;
			}
			
			for(var i = 0; i < answercount ; i++ ){ //±í¸ñÒ»¸ö¸¡¶¯ÇøÓò´ð°¸
				if(gb.floatSet.type == 0){
					gb.setCellValue(qequenceIndex,i + start,i + 1);
				}else{
					gb.setCellValue(i + start,qequenceIndex,i + 1);
				}
			}
		}	
	}
	
	//Ìî³ä±í¸ñÌâ´ð°¸
	this._settableanswer = function (gb,answer) {
		//¸¡¶¯¿ªÊ¼Î»ÖÃ
		var start = gb.floatSet.index;
		//´ð°¸Êý
		var answercount = answer.length-1;
		//Ö¸±êÊý
		var zbcount = answer[0].length;
		if(gb.floatSet.expandField == ""){
			//Î´Õ¹¿ª
			for(var i = 0; i < answercount ; i++ ){
				var answerline = answer[i+1];
				for(var j = 0; j < zbcount ; j++ ){
					var col,row;
					if(gb.floatSet.type == 0){
						col = j+1;
						row = i+start;
						if(row >= gb.getRowCount()){
							gb.insertRows(gb.getRowCount() ,1);
						}
					}else{						//ÁÐ¸¡¶¯
						col = i+start;
						row = j+1;
						if(col >= gb.getColumnCount()){
							gb.insertColumns(gb.getColumnCount() ,1);
						}
					}
					gb.setCellValue(col,row,answerline[j]);
				}
			}
		}else{
			//ÓÐÕ¹¿ªÖ¸±ê
			var expandIndex = answer[0].indexOf(gb.floatSet.expandField);
			var expandnumber = gb.floatSet.fieldIndexs[expandIndex];
			gb.floatSet.zbSet = answer[0];
			for(var i = 0; i < answercount ; i++ ){
				var currTableIndex = start;
				var answerline = answer[i+1];
				var mate = false;
				while(!mate){
					var col,row;
					if(gb.floatSet.type == 0){//ÐÐ¸¡¶¯
						col = expandnumber;
						row = currTableIndex;
						if(row >= gb.getRowCount()){
							gb.insertRows(gb.getRowCount() ,1);
							mate = true;
							gb.setCellValue(col,row,answerline[expandIndex]);	
						}
					}else{
						col = currTableIndex;
						row = expandnumber;
						if(col >= gb.getColumnCount()){
							gb.insertColumns(gb.getColumnCount() ,1);
							mate = true;
							gb.setCellValue(col,row,answerline[expandIndex]);	
						}
					}
					var cell = gb.getCell(col,row);//»ñÈ¡µ¥Ôª¸ñ
					if(cell.getEditText() == answerline[expandIndex]){//µ¥Ôª¸ñÖµºÍ±àÂë×Ö¶ÎÖµÏàµÈ
						mate = true;
					}else if(cell.getEditText()  == null || cell.getEditText() == undefined || cell.getEditText() == ''){//µ¥Ôª¸ñÖµÎª¿Õ
						mate = true;
						gb.setCellValue(col,row,answerline[expandIndex]);			
					}else{//Ñ°ÕÒÏÂÒ»ÐÐ
						currTableIndex ++;
					}
				}

				for(var j = 0; j < zbcount ; j++ ){
					if(j == expandIndex) continue;
					var col,row;
					if(gb.floatSet.type == 0){
						col = gb.floatSet.fieldIndexs[j];
						row = currTableIndex;
					}else{					
						col = currTableIndex;
						row = gb.floatSet.fieldIndexs[j];
					}
					gb.setCellValue(col,row,answerline[j]);										
				}
				currTableIndex ++;
			}		
		}
		
	}
	
	this._addCSS = function(cssText) {
		$('style[name=questionnaire]').remove();
		$('head').append('<style type="text/css" name="questionnaire">' + cssText +'</style>');
	}
	
	//»ñÈ¡ÎÊ¾íµ÷²é´ð°¸
	this.getAnswer = function(){
		//Çå¿Õ´íÎóÊý¾Ý
		this.errorInfos.array = [];
				
		//¸ù¾ÝÎÊ¾íµ÷²éÄ£°åµÝ¹é»ñÈ¡ÎÊ¾íµ÷²é´ð°¸
		this._getQuestionAnswer(this.questionnaireTemp.questions);
				
		//¶¨Î»±ØÌîÌâ
		//this.locates(this.errorInfos);
		return this.answer;
	}
	
	//¸ù¾ÝÎÊ¾íµ÷²éÄ£°åµÝ¹é»ñÈ¡ÎÊ¾íµ÷²é´ð°¸
	this._getQuestionAnswer = function(questions) {
		//±éÀúÌâÄ¿
		var editor = this;
		$.each(questions, function (n, questiondata) {
			if (questiondata.type == "group") {
				editor._getQuestionAnswer(questiondata.questions);
			} else if (questiondata.type == "single") {
				editor._getsingleanswer(questiondata);
			} else if (questiondata.type == "multiple") {
				editor._getmultipleanswer(questiondata);
			} else if (questiondata.type == "fillblanks") {
				editor._getfillblanksanswer(questiondata);
			} else if (questiondata.type == "shortanswer") {
				editor._getshortansweranswer(questiondata);
			} else if (questiondata.type == "order") {
				editor._getorderanswer(questiondata);
			} else if (questiondata.type == "table") {
				editor._gettableanswer(questiondata);
			}
		});
	}
	
	//»ñÈ¡µ¥Ñ¡Ìâ´ð°¸
	this._getsingleanswer = function(questiondata) {
		var singleques = $('input:radio[name="' + questiondata.question + '"]:checked');
		var ishidden = $("div[name='" + questiondata.question + "']").is(':hidden');
		var editor = this;
		var singleanswer = singleques.val();
		if(singleanswer !== null && singleanswer !== undefined && singleanswer !== '' && singleanswer !== 'hide'){
			this.answer[questiondata.zb] = singleanswer;
			if(ishidden){
				delete editor.answer[questiondata.zb];
			}
			//±éÀúÑ¡Ïî£¬ÕÒ¿ÉÊäÈëÑ¡ÏîµÄ´ð°¸
			$.each(questiondata.options, function (n, option) {
				if (editor.answer[questiondata.zb] == option.title && option.inputable ) {
					if(ishidden){
						delete editor.answer[option.zb];
					}else{
						editor.answer[option.zb] = $('input:text[name="' + questiondata.question + '"]').val();
					}
				} 
			});
		}else if(!questiondata.nullable){
			var error = new Object();
			error.zb = questiondata.zb;
			error.info = "±Ø´ðÌâ";
			
			editor.errorInfos.array.push(error);
		}


	}
	
	//»ñÈ¡¶àÑ¡Ìâ´ð°¸
	this._getmultipleanswer = function(questiondata) {	
		var multipleanswer = $('input:checkbox[name="' + questiondata.question + '"]:checked').map(function (index, elem) {
					return $(elem).val();
				}).get().join('#$^');
				
		var ishidden = $("div[name='" + questiondata.question + "']").is(':hidden');
				
		if(multipleanswer !== null && multipleanswer !== undefined && multipleanswer !== ''){
			if(ishidden){
				delete this.answer[questiondata.zb];
			}else{
				this.answer[questiondata.zb] = multipleanswer;
			}
			
			var editor = this;
			//±éÀúÑ¡Ïî£¬ÕÒ¿ÉÊäÈëÑ¡ÏîµÄ´ð°¸
			$.each(questiondata.options, function (n, option) {
				var ans = editor.answer[questiondata.zb];
				if (ans != undefined && ans.indexOf(option.title) >= 0 && option.inputable ) {
					if(ishidden){
						delete editor.answer[option.zb];
					}else{
						editor.answer[option.zb] = $('input:text[name="' + questiondata.question + '"]').val();
					}
				} 
			});
		}else if(!questiondata.nullable){
			var error = new Object();
			error.zb = questiondata.zb;
			error.info = "±Ø´ðÌâ";
			
			this.errorInfos.array.push(error);
		}	
	}
	
	//»ñÈ¡Ìî¿ÕÌâ´ð°¸
	this._getfillblanksanswer = function(questiondata) {
		//ÌâÄ¿Òþ²ØÉ¾³ý´ð°¸
		var ishidden = $("div[name='" + questiondata.question + "']").is(':hidden');
		var editor = this;
		$.each(questiondata.blanks, function (n, blank) {
			var blankanswer = $('input[name="' + blank.zb + '"]').val();
			if(blank.type!=0 && blank.type!=5){//·Ç×Ö·û²¢ÇÒ·ÇÓÊÏä
				blankanswer = blankanswer.replace(/_/g,'');
				//blankanswer = blankanswer.replace(/-/g,'');
			}
			if(blank.type==1 && blankanswer==''){//ÕûÊý
				blankanswer = null;
			}
			if(blank.type==3 && blankanswer != ''){//°Ù·ÖÊý
				blankanswer = (blankanswer+'') / 100;
			}		
			if(blankanswer !== null && blankanswer !== undefined && blankanswer !== ''){
				if(ishidden){
					delete editor.answer[blank.zb];
				}else{
					editor.answer[blank.zb] = blankanswer;
				}
			}else if(!questiondata.nullable){
				var error = new Object();
				error.zb = blank.zb;
				error.info = "±Ø´ðÌâ";
				
				editor.errorInfos.array.push(error);
			}
		});
	}
	
	//»ñÈ¡¼ò´ðÌâ´ð°¸
	this._getshortansweranswer = function(questiondata) {	
		var shortanswer = $('textarea[name="' + questiondata.zb + '"]').val();
		var ishidden = $("div[name='" + questiondata.question + "']").is(':hidden');
		if(shortanswer !== null && shortanswer !== undefined && shortanswer !== ''){
			if(ishidden){
				delete this.answer[questiondata.zb];
			}else{
				this.answer[questiondata.zb] = shortanswer;
			}
		}else if(!questiondata.nullable){
			var error = new Object();
			error.zb = questiondata.zb;
			error.info = "±Ø´ðÌâ";
			
			this.errorInfos.array.push(error);
		}
	}
	
	//»ñÈ¡ÅÅÐòÌâ´ð°¸
	this._getorderanswer = function(questiondata) {	
		var editor = this;
		
		//ÏÈÇé¿Õ´ð°¸
		$.each(questiondata.options, function (n, option) {
			delete editor.answer[option.zb];
		});
		
		//±éÀúÑ¡Ïî
		$.each(questiondata.options, function (n, option) {
			var optiondiv = $('div[name="' + option.zb + '"]');
			if(optiondiv[0].children.length){
				var selectnum = optiondiv[0].getAttribute("value");
				editor.answer[questiondata.options[selectnum - 1].zb] = option.title;
			}
			
		});

	}
	
	//»ñÈ¡±í¸ñ´ð°¸
	this._gettableanswer = function(questiondata) {
			var gb = this.subtables[questiondata.question];
			var tableanswer = [];
			if (!this.answer[questiondata.question]) {
				return;
			}
			//µÚ0ÐÐÖ¸±êÇøÓò´ÓÔ­´ð°¸ÖÐ»ñÈ¡
			tableanswer[0] = this.answer[questiondata.question][0];
			
			var ishidden = $("div[name='" + questiondata.question + "']").is(':hidden');
			if(ishidden){
				this.answer[questiondata.question] = tableanswer;
				return;
			}
			
			//¸¡¶¯¿ªÊ¼Î»ÖÃ
			var start = gb.floatSet.index;
			//´ð°¸Êý
			var answercount = 1;
			if(gb.floatSet.type == 0){
				answercount = gb.getRowCount() - start;
			}else{
				answercount = gb.getColumnCount() - start;
			}

			//Ö¸±êÊý
			var zbcount = tableanswer[0].length;
			for(var i = 0; i < answercount ; i++ ){ //±í¸ñÒ»¸ö¸¡¶¯ÇøÓò´ð°¸
				var answerline = [];
				for(var j = 0; j < zbcount ; j++ ){
					var cell;
					if(gb.floatSet.type == 0){
						cell = gb.getCell(gb.floatSet.fieldIndexs[j],i + start);
					}else{
						cell = gb.getCell(i + start,gb.floatSet.fieldIndexs[j]);
					}
					answerline[j] = cell.getEditText();
				}
				
				var empty = true;
				var expandIndex = -1;
				if(gb.floatSet.expandField != ""){ //ÓÐÕ¹¿ªÖ¸±ê
					expandIndex = tableanswer[0].indexOf(gb.floatSet.expandField);					
				}
				//ÅÐ¶ÏÒ»ÐÐÊý¾ÝÊÇ·ñÎª¿Õ
				for(var j = 0; j < zbcount ; j++ ){
					if(j!=expandIndex && answerline[j] != "" ){
						empty = false;
					}
				}
				if(!empty){
					tableanswer.push(answerline);					
				}
			}

			//»ñÈ¡¹«Ê½µ¥Ôª¸ñµÄ´ð°¸
//			this.calcFormulaCellValue(gb,tableanswer,start);
					
			gb.isDataChanged = false;

			this.answer[questiondata.question] = tableanswer;
	}
	

	//¼ÆËã¹«Ê½µ¥Ôª¸ñµÄ´ð°¸
	/*this.calcFormulaCellValue = function(gb,tableanswer,start){
		var formulas = gb._gridData.formulas;
		var zbcount = tableanswer[0].length;
		for(var formIndex = 0; formIndex < formulas.length; formIndex++){
			var f = formulas[formIndex].formula;
			var r = formulas[formIndex].targetRow;
			var c = formulas[formIndex].targetCol;
			var zb = formulas[formIndex].zbCode;
			var realrow = r-start+1;
			
			var sumCell = gb.getCell(c,r);
			var formulaStr = f.substring(4,f.length-1);
			var formulaArr = formulaStr.split(":");
			if(formulaArr.length == 2){
				var startCol = formulaArr[0].substring(0,1).charCodeAt()-65 + 1;
				var startRow = formulaArr[0].substring(1,formulaArr[0].length);
				var endCol = formulaArr[1].substring(0,1).charCodeAt()-65 + 1;
				var endRow = formulaArr[1].substring(1,formulaArr[0].length);
				var sum = 0;
				for(var rowindex = startRow; rowindex <=endRow; rowindex++){
					for(var colindex = startCol; colindex <=endCol; colindex++){
						var cell = gb.getCell(colindex,rowindex);
						var text = cell.getEditText();
						if(text && !isNaN(text)){
							sum += Number.parseInt(cell.getEditText());
						}
					}
				}
				if(tableanswer.length >= realrow && !tableanswer[realrow]){
					tableanswer[realrow] = [];
				}
				tableanswer[realrow][tableanswer[0].indexOf(zb)] = sum;
				sumCell.setEditText(sum);
				sumCell.setShowText(sum);
			}
		}
	};*/
	
	
	this.find = function(zbid,callback){
		//Ñ¡ÔñÌâÊÇ<div zb='zbid' />,Ìî¿ÕÌâÊÇ<input  zb='zbid'/>
		return $("[data-zb='" + zbid + "']");
	};

	this.color = function($node){
		var sty = '-webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 12px #ff0000;box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 12px #ff0000;';
		var w = $node.css('width');
		// sty = sty + 'width:' + w +';';	
		if($node.is('div')){//Ñ¡ÔñÌâ
			$node.addClass('div-control');	
			$node.attr('style',sty);
		}else if($node.is('input')){//Ìî¿ÕÌâ
			$node.addClass('form-control');	
			$node.attr('style',sty);
		}
	};

	this.errortip = function($node,errorinfo){
		if(errorinfo !== null && errorinfo !== undefined && errorinfo !== ''){
			$node.attr("title",errorinfo);			
		}
	};
	
	this.locateTable = function(item){
		var gb = this.subtables[item.questionID];
		
		var expandIndex = gb.floatSet.zbSet.indexOf(gb.floatSet.expandField);
		var expandnumber = gb.floatSet.fieldIndexs[expandIndex];

		var currTableIndex = gb.floatSet.index;
		var mate = false;
		while(!mate){
			var cell;
			if(gb.floatSet.type == 0){//ÐÐ¸¡¶¯
				cell = gb.getCell(expandnumber,currTableIndex);
			}else{
				cell = gb.getCell(currTableIndex,expandnumber);
			}
				
			if(cell.getEditText() == item.expandValue || item.expandValue == ""){
				mate = true;
			}else{
				currTableIndex ++;
			}
				
			if(gb.floatSet.type == 0 && currTableIndex > gb.getRowCount()){
				return;
			}else if(gb.floatSet.type == 1 && currTableIndex > gb.getColumnCount()){
				return;
			}
		}
		
		var locateIndex = gb.floatSet.zbSet.indexOf(item.zbCode);
		var locatenumber = gb.floatSet.fieldIndexs[locateIndex];
		
		var locatecell;
		if(gb.floatSet.type == 0){
			locatecell = gb.getCell(locatenumber,currTableIndex);
		}else{
			locatecell = gb.getCell(currTableIndex,locatenumber);
		}
		gb.locate(locatecell.getCol(),locatecell.getRow(),"#F76767");

	};

	/**
		{
			"array": [{
				"row": -1,
				"col": -1,
				"data-zb": "565421F6400000418CBA7ACD9497EEEB",
				"info": "Ìî¿Õ´íÁË1"
			},
			{
				"row": -1,
				"col": -1,
				"zb": "565421F64000002146C6D927F6C6C2BF",
				"info": "Ìî¿Õ´íÁËÊÖ»úºÅ"
			},
			{
				"row": -1,
				"col": -1,
				"data-zb": "5650BE10C00000215CFAAC087DAABA6C",
				"info": "Ñ¡Ôñ´íÁË"
			},
			{
				"row": 1,
				"col": 2,
				"data-zb": "5650BE10C00000215CFAAC087DAABA6C",
				"info": "±í¸ñ´íÁË"
			}]
		}
	 */
	this.locates = function(infos){
		//Çå¿ÕÉÏ´ÎµÄ×ÅÉ«
		$.each($('.div-control'), function (n, item) {
			var w = $(item).css('width');
			$(item).attr("style","width:" + w);
		});
		$.each($('.form-control'), function (n, item) {
			var w = $(item).css('width');
			$(item).attr("style","width:" + w);
		});

		var infoList = infos['array'];
		for(var j = 0; j < infoList.length ; j++ ){
			var item = infoList[j];
			if (item.zb) {
				var $node = this.find(item.zb);
				if($node.length > 0){
					$node[0].scrollIntoView(false);
					$node[0].focus();			
				}
				this.color($node);//×ÅÉ«
				this.errortip($node,item.info);//ÏÔÊ¾´íÎóÌáÊ¾
			} else {//±í¸ñÌâ
				var $jsontip =  $('[name="' + item.questionID + '"]');
				if($jsontip.length > 0){
					$jsontip[0].scrollIntoView(false);
					$jsontip[0].focus();			
				}
				this.locateTable(item);
			}
		}	
	}
	
	this.setEditable = function(isEditable){
		$(":input").attr('disabled',!isEditable);
		$.each(this.subtables,function(name,gb) { 
			gb.setEditMode(isEditable?2:1);
		});
	}

	this.initquestionnaire();
};
