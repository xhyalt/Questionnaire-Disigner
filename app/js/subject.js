/**
 * [Subject 定义题目对象]
 * @param {[type]} forced          [属性：必选]
 * @param {[type]} questionNo      [显示题目编号]
 * @param {[type]} showDescription [属性：显示描述]
 * @param {[type]} minSelectItem   [属性：最少选择项数]
 * @param {[type]} maxSelectItem   [属性：最多选择项数]
 * @param {[type]} sameLine        [属性：与题目同行]
 * @param {[type]} showEveryLine   [属性：每行显示]
 * @param {[type]} showLine        [属性：显示行数]
 * @param {[type]} minLength       [属性：最少字数]
 * @param {[type]} maxLength       [属性：最多字数]
 */
function Subject(num, forced, questionNo, showDescription, minSelectItem, maxSelectItem, sameLine, showEveryLine, showLine, minLength, maxLength) {

    /*属性：对应题目数字*/
    this.num = num;

    /*属性：必选*/
    this.forced = forced;
    /*显示题目编号*/
    this.questionNo = questionNo;
    /*属性：显示描述*/
    this.showDescription = showDescription;

    /*属性：最少选择项数*/
    this.minSelectItem = minSelectItem;
    /*属性：最多选择项数*/
    this.maxSelectItem = maxSelectItem;

    /*属性：与题目同行*/
    this.sameLine = sameLine;
    /*属性：每行显示*/
    this.showEveryLine = showEveryLine;

    /*属性：显示行数*/
    this.showLine = showLine;
    /*属性：最少字数*/
    this.minLength = minLength;
    /*属性：最多字数*/
    this.maxLength = maxLength;
}
