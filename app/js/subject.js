var isChanged = false;

/*题号数组*/
var quesNoArr = new Array(5);
for (var i = 0; i < 5; i++) {
    quesNoArr[i] = i;
}
var quesNoTemp = new Array(5);

/*题号种类*/
var quesNoPattern = new Array(5);
quesNoPattern[0] = "一、 二、 三、";
quesNoPattern[1] = "(一) (二) (三)";
quesNoPattern[2] = "1. 2. 3.";
quesNoPattern[3] = "1) 2) 3)";
quesNoPattern[4] = "Q1. Q2. Q3.";

/*第一个题号*/
var quesNoFirst = new Array(5);
quesNoFirst[0] = "一、";
quesNoFirst[1] = "(一)";
quesNoFirst[2] = "1.";
quesNoFirst[3] = "1)";
quesNoFirst[4] = "Q1.";

/*当前编辑的级别*/
var quesActiveNo = 0;

/*所有字体数组*/
var fontArr = new Array(
    "宋体",
    "楷体_GB2312",
    "黑体",
    "仿宋",
    "仿宋_GB2312",
    "新宋体",
    "隶书",
    "华文中宋",
    "华文仿宋",
    "华文宋体",
    "华文彩云",
    "华文新魏",
    "华文楷体",
    "华文琥珀",
    "华文细黑",
    "华文行楷",
    "华文隶书",
    "幼圆",
    "微软雅黑",
    "方正姚体",
    "方正舒体"
);

/*题目数量*/
var subjectTotal = 0;
/*题目对象的数组*/
var subject = {};

var subjectDiv = {};
var descriptionDiv = {};
var itemLabelDiv = {};
var menuPopDiv = {};

const emptyBox = `
<div id="emptyBox">
    可单击或拖拽左侧题型，以添加题目到此处区域
</div>`;

subjectDiv["radio"] = `
<div class="radioDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="radioMain subjectMain">
        <div class="radioStemText textBox stemText" id="radioStemTextID" placeholder="单选题"></div>
        <div class="radioDescriptionText textBox descriptionText" placeholder="单选题描述"></div>
        <ul class="radioItem itemBox">
            <li>
                <input type="radio" name="radio1"/>
                <div class="initials">A.</div>
                <div class="textBox radioItemText ItemText" placeholder="选项1"></div>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
            <li>
                <input type="radio" name="radio1" />
                <div class="initials">B.</div>
                <div class="textBox radioItemText ItemText" placeholder="选项2"></div>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

descriptionDiv["radio"] = `
<div class="radioDescriptionText textBox descriptionText" placeholder="单选题描述"></div>`;

itemLabelDiv["radio"] = `
<li>
    <input type="radio" name="radio1"/>
    <div class="initials">A.</div>
    <div class="textBox radioItemText ItemText" placeholder="选项"></div>
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="clear"></div>
</li>`;

subjectDiv["multiple"] = `
<div class="multipleDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="multipleMain subjectMain">
        <div class="multipleStemText textBox stemText" id="multipleStemTextID" placeholder="多选题"></div>
        <div class="multipleDescriptionText textBox descriptionText" placeholder="多选题描述"></div>
        <ul class="multipleItem itemBox">
            <li>
                <input type="checkbox" name="checkbox1" />
                <div class="initials">A.</div>
                <div class="textBox multipleItemText ItemText" placeholder="选项1"></div>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
            <li>
                <input type="checkbox" name="checkbox1"/>
                <div class="initials">B.</div>
                <div class="textBox multipleItemText ItemText" placeholder="选项2"></div>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

descriptionDiv["multiple"] = `
<div class="multipleDescriptionText textBox descriptionText" placeholder="多选题描述"></div>`;

itemLabelDiv["multiple"] = `
<li>
    <input type="checkbox" name="checkbox1"/>
    <div class="initials">B.</div>
    <div class="textBox multipleItemText ItemText" placeholder="选项"></div>
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="clear"></div>
</li>`;

subjectDiv["completion"] = `
<div class="completionDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="completionMain subjectMain">
        <div class="completionStemText textBox stemText" id="completionStemTextID" placeholder="填空题"></div>
        <div class="completionDescriptionText textBox descriptionText" placeholder="填空题描述"></div>
        <ul class="completionItem itemBox">
            <li>
                <input type="text" />
            </li>
        </ul>
    </div>
</div>`;

descriptionDiv["completion"] = `
<div class="completionDescriptionText textBox descriptionText" placeholder="填空题描述"></div>`;

subjectDiv["multitermCompletion"] = `
<div class="multitermCompletionDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="multitermCompletionMain subjectMain">
        <div class="multitermCompletionStemText textBox stemText" id="multitermCompletionStemTextID" placeholder="多项填空题"></div>
        <div class="multitermCompletionDescriptionText textBox descriptionText" placeholder="多项填空题描述"></div>
        <ul class="multitermCompletionItem itemBox">
            <li>
                <div class="textBox multitermCompletionItemText ItemText" placeholder="选项1"></div>
                <input type="text" id="Num1" />
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
            <li>
                <div class="textBox multitermCompletionItemText ItemText" placeholder="选项2"></div>
                <input type="text" id="Num2" />
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

descriptionDiv["multitermCompletion"] = `
<div class="multitermCompletionDescriptionText textBox descriptionText" placeholder="多项填空题描述"></div>`;

itemLabelDiv["multitermCompletion"] = `
<li>
    <div class="textBox multitermCompletionItemText ItemText" placeholder="选项"></div>
    <input type="text" id="Num2" />
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="clear"></div>
</li>`;

subjectDiv["shortAnswer"] = `
<div class="shortAnswerDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="shortAnswerMain subjectMain">
        <div class="shortAnswerStemText textBox stemText" id="shortAnswerStemTextID" placeholder="简答题"></div>
        <div class="shortAnswerDescriptionText textBox descriptionText" placeholder="简答题描述"></div>
        <ul class="shortAnswerItem itemBox">
            <li>
                <textarea rows="5"></textarea>
            </li>
        </ul>
    </div>
</div>`;

descriptionDiv["shortAnswer"] = `
<div class="shortAnswerDescriptionText textBox descriptionText" placeholder="简答题描述"></div>`;

subjectDiv["sort"] = `
<div class="sortDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="sortMain subjectMain">
        <div class="sortStemText textBox stemText" id="sortStemTextID" placeholder="排序题"></div>
        <div class="sortDescriptionText textBox descriptionText" placeholder="排序题描述"></div>
        <ul class="sortItem itemBox">
            <li>
                <div class="initials">A.</div>
                <div class="textBox sortItemText ItemText" placeholder="选项1"></div>
                <input type="text"/>
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
            <li>
                <div class="initials">B.</div>
                <div class="textBox sortItemText ItemText" placeholder="选项2"></div>
                <input type="text" />
                <div class="itemMenu">
                    <img class="up" src="./images/main_01_up_off.png" alt="">
                    <img class="down" src="./images/main_02_down_off.png" alt="">
                    <img class="delete" src="./images/main_03_delete_off.png" alt="">
                </div>
                <div class="clear"></div>
            </li>
        </ul>
        <img class="addItem" src="./images/main_04_add_off.png" alt="">
    </div>
</div>`;

descriptionDiv["sort"] = `
<div class="sortDescriptionText textBox descriptionText" placeholder="排序题描述"></div>`;

itemLabelDiv["sort"] = `
<li>
    <div class="initials"></div>
    <div class="textBox sortItemText ItemText" placeholder="选项"></div>
    <input type="text" />
    <div class="itemMenu">
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="clear"></div>
</li>`;

subjectDiv["description"] = `
<div class="descriptionDiv unSubject" level="1" father="0" num="">
    <div class="leftSetup">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="descriptionMain subjectMain">
        <div class="descriptionStemText textBox stemText" id="descriptionStemTextID" placeholder="描述说明"></div>
    </div>
</div>`;

subjectDiv["dividingLine"] = `
<div class="dividingLineDiv unSubject" level="1" father="0" num="">
    <div class="leftSetup">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
    </div>
    <div class="dividingLineMain subjectMain">
        <hr width="650" color="#f3f3f3" noshade="noshade" align="left" border="none"/>
    </div>
</div>`;

subjectDiv["merge"] = `
<div class="mergeDiv subject" level="1" father="0" num="">
    <div class="leftSetup">
        <h4>Q</h4>
        <img class="up" src="./images/main_01_up_off.png" alt="">
        <img class="down" src="./images/main_02_down_off.png" alt="">
        <img class="copy" src="./images/main_06_copy_off.png" alt="">
        <img class="delete" src="./images/main_03_delete_off.png" alt="">
        <img class="merge" src="./images/main_07_merge_off.png" alt="">
        <img class="unmerge" src="./images/main_08_unmerge_off.png" alt="">
    </div>
    <div class="mergeMain">
        <div class="mergeStemText textBox stemText" id="sortStemTextID" placeholder="合并题"></div>
        <ul class="mergeItem itemBox">
        </ul>
    </div>
</div>`;

descriptionDiv["merge"] = `
<div class="mergeDescriptionText textBox descriptionText" placeholder="合并题描述"></div>`;

const itemMenuDiv = `
<div class="itemMenu">
    <img class="up" src="./images/main_01_up_off.png" alt="">
    <img class="down" src="./images/main_02_down_off.png" alt="">
    <img class="delete" src="./images/main_03_delete_off.png" alt="">
</div>`;

const trianglePop = `
<div class="trianglePop"></div>`;

menuPopDiv["radio"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="showForced(checked)"/>
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)"/>
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
            </ul>
        </div>
        <div class="detail">
            <div class="title">选项显示模式</div>
            <ul>
                <li>
                    <input class="sameLine" type="radio" name="radio1"
                    onchange="sameLine(checked)"/>
                    <label>与题目同行</label>
                </li>
                <li>
                    <input class="sameLine2" type="radio" name="radio1" checked="true" onchange="sameLine2(checked)" />
                    <label>每行显示</label>
                    <input class="showEveryLine" type="number" value="1" defaultValue="1" placeholder="1" min="1" onchange="setShowEveryLine(value)"/>
                    <label>个</label>
                </li>
            </ul>
        </div>
    </div>
</div>`;

menuPopDiv["multiple"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="showForced(checked)"/>
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)" />
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
                <li>
                    <label>最少选择项数</label>
                    <input class="minSelectItem" type="number" value="0" defaultValue="0" placeholder="0" min="0" />
                    <label>个</label>
                </li>
                <li>
                    <label>最多选择项数</label>
                    <input class="maxSelectItem" type="number" value="0" defaultValue="0" placeholder="0" min="0" />
                    <label>个</label>
                </li>
            </ul>
        </div>
        <div class="detail">
            <div class="title">选项显示模式</div>
            <ul>
                <li>
                    <input class="sameLine" type="radio" />
                    <label>与题目同行</label>
                </li>
                <li>
                    <input class="sameLine2" type="radio" checked="true" />
                    <label>每行显示</label>
                    <input class="showEveryLine" type="number" value="1" defaultValue="1" placeholder="1" min="1" />
                    <label>个</label>
                </li>
            </ul>
        </div>
    </div>
</div>`;

menuPopDiv["completion"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="showForced(checked)"/>
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)"/>
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
            </ul>
        </div>
    </div>
</div>`;

menuPopDiv["multitermCompletion"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="showForced(checked)" />
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)" />
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
            </ul>
        </div>
    </div>
</div>`;

menuPopDiv["shortAnswer"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="show" />
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)" />
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
            </ul>
        </div>
        <div class="detail">
            <div class="title">答题区</div>
            <ul>
                <li>
                    <label>显示行数</label>
                    <input class="showLine" type="number" value="5" defaultValue="5" placeholder="5" min="1" onchange="setLine(value)"/>
                </li>
                <li>
                    <label>最少字数</label>
                    <input class="minLength" type="number" value="0" placeholder="0" min="0" onchange="setMinLength(value)"/>
                </li>
                <li>
                    <label>最多字数</label>
                    <input class="maxLength" type="number" value="1000" placeholder="1000" min="0" onchange="setMaxLength(value)"/>
                </li>
            </ul>
        </div>
    </div>
</div>`;

menuPopDiv["sort"] = `
<div class="popMenu">
    <h4>题目设置</h4>
    <a class="popMenuClose" href="javascript: ;"></a>
    <div class="popMenuDetail">
        <div class="detail">
            <div class="title">题目控制</div>
            <ul>
                <li>
                    <input class="forced" type="checkbox" onchange="showForced(checked)"/>
                    <label>必答</label>
                </li>
                <li>
                    <input class="questionNo" type="checkbox" checked="true" onchange="showQuestionNo(checked)" />
                    <label>显示题目编号</label>
                </li>
                <li>
                    <input class="showDescription" type="checkbox" checked="true" onchange="showDesc(checked)"/>
                    <label>显示描述</label>
                </li>
            </ul>
        </div>
    </div>
</div>`;
