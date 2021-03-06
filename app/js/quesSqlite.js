/**
 * 数据库系统
 * 使用文件类型的数据库Sqlite
 */
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbFile = "./quesSqlite.db";
const db = new sqlite3.Database(dbFile);

/**
 * 初始化数据库函数，登录成功后调用
 * @public
 * @param  GlobalData
 * @param  cb callback
 * @return
 */
function initDB(GlobalData, cb) {
    __checkTable(function(res1) {
        // console.log("检查表是否存在" + res1.success);
        if (res1.success == false) {
            /*不存在数据库，调用建表函数*/
            __createTable(function(res2) {
                if (res2.success == true) {
                    /*建表成功*/
                    // console.log("建表成功");
                    __insertUser(GlobalData, function(res3) {
                        if (res3.success == false) {
                            /*插入数据失败*/
                            // console.log("插入数据失败");
                            if (cb) {
                                cb({
                                    success: false,
                                    data: "插入数据失败"
                                });
                            }
                        } else {
                            // console.log("插入数据成功");
                            if (cb) {
                                cb({
                                    success: true
                                });
                            }
                        }
                    });
                } else {
                    /*建表不成功*/
                    // console.log("建表失败");
                    if (cb) {
                        cb({
                            success: false,
                            data: "建表失败"
                        });
                    }
                }
            });
        } else {
            /*已存在数据库，调用查找函数*/
            // console.log("表已存在");
            /*判断表中是否存在该用户数据*/
            __checkUser(GlobalData, function(res2) {
                if (res2.success == true) {
                    /*查询用户成功*/
                    if (res2.data["count(1)"] == 0) {
                        /*该用户不存在，插入用户数据*/
                        // console.log("该用户不存在于数据库中");
                        __insertUser(GlobalData, function(res3) {
                            if (res3.success == false) {
                                /*插入数据失败*/
                                // console.log("插入数据失败");
                                if (cb) {
                                    cb({
                                        success: false,
                                        data: "插入数据失败"
                                    });
                                }
                            } else {
                                // console.log("插入数据成功");
                                if (cb) {
                                    cb({
                                        success: true
                                    });
                                }
                            }
                        });
                    } else {
                        /*该用户存在，更新用户数据*/
                        // console.log("该用户已经存在于数据库");
                        __updateUser(GlobalData, function(res3) {
                            if (res3.success == true) {
                                // console.log("更新用户数据成功");
                                if (cb) {
                                    cb({
                                        success: true
                                    });
                                }
                            } else {
                                // console.log("更新用户数据失败");
                                if (cb) {
                                    cb({
                                        success: false,
                                        data: "更新用户数据失败"
                                    });
                                }
                            }
                        });
                    }
                } else {
                    // console.log("查询用户失败");
                    cb({
                        success: false,
                        data: "查询用户失败"
                    });
                }
            });
        }
    });
}

/**
 * 某条业务方案在数据库中的处理逻辑
 * @public
 * @param  GlobalData      [用户基础数据]
 * @param  solutionInfo    [某一业务方案]
 * @param  {Function} cb   [回调函数]
 * @return
 */
function initSolutions(GlobalData, solutionInfo, cb) {
    __checkSolution(GlobalData, solutionInfo, function(res) {
        if (res.success == true) {
            if (res.data["count(1)"] == 0) {
                // console.log("不存在该业务方案 添加业务方案");
                __insertSolution(GlobalData, solutionInfo, function(res2) {
                    if (res2.success == true) {
                        cb({
                            success: true
                        });
                    } else {
                        // console.log("添加业务方案失败");
                        cb({
                            success: false,
                            data: "添加业务方案失败"
                        });
                    }
                });
            } else {
                // console.log("已存在该业务方案 更新业务方案");
                __updateSolution(GlobalData, solutionInfo, function(res2) {
                    if (res2.success == true) {
                        // console.log("更新业务方案成功");
                        cb({
                            success: true
                        });
                    } else {
                        // console.log("更新业务方案失败");
                        cb({
                            success: true,
                            data: "更新业务方案失败"
                        });
                    }
                });
            }

        } else {
            /*查询出错*/
            // console.log("查询业务方案出错");
            cb({
                success: false,
                data: "查询业务方案出错"
            });
        }
    });
}

/**
 * 某条调查问卷基本信息在数据库中的处理逻辑
 * @public
 * @param  GlobalData        [用户基本信息]
 * @param  solutionName     [业务方案标识]
 * @param  questionnaireJson [调查问卷基本信息]
 * @param  {Function} cb                [回调函数]
 * @return
 */
function initQuestionnairesList(GlobalData, solutionName, questionnaireJson, cb) {
    __checkQuestionnaire(GlobalData, solutionName, questionnaireJson, function(res) {
        if (res.success == true) {
            if (res.data["count(1)"] == 0) {
                // console.log("不存在该调查问卷 添加调查问卷");
                __insertQuestionnaire(GlobalData, solutionName, questionnaireJson, function(res2) {
                    if (res2.success == true) {
                        // console.log("添加调查问卷成功");
                        /*将调查问卷的isRemote字段置1*/
                        __updateQuestionnaireIsRemote(GlobalData, questionnaireJson.name, "1", function(res3) {
                            if (res3.success == true) {
                                // console.log("更新isRemote字段成功");
                                cb({
                                    success: true
                                });
                            } else {
                                cb({
                                    success: false,
                                    data: "更新isRemote字段失败"
                                });
                            }

                        });
                    } else {
                        // console.log("添加调查问卷失败");
                        cb({
                            success: false,
                            data: "添加调查问卷失败"
                        });
                    }
                });
            } else {
                // console.log("存在该调查问卷 更新调查问卷");
                __updateQuestionnaire(GlobalData, solutionName, questionnaireJson, function(res2) {
                    if (res2.success == true) {
                        // console.log("更新调查问卷成功");
                        __updateQuestionnaireIsRemote(GlobalData, questionnaireJson.name, "1", function(res3) {
                            if (res3.success == true) {
                                // console.log("更新isRemote字段成功");
                                cb({
                                    success: true
                                });
                            } else {
                                cb({
                                    success: false,
                                    data: "更新isRemote字段失败"
                                });
                            }

                        });
                    } else {
                        // console.log("更新调查问卷失败");
                        cb({
                            success: false,
                            data: "更新调差问卷失败"
                        });
                    }
                });
            }
        } else {
            // console.log("查询调查问卷出错");
            cb({
                success: false,
                data: "查询调查问卷出错"
            });
        }
    });
}

/**
 * 获取所有自定义题型
 * @public
 * @param  {Function} cb 回调函数
 * @return
 */
function selectCustoms(cb) {
    __selectCustoms(function(res) {
        if (res.success == true) {
            cb({
                success: true,
                data: res.data
            });
        } else {
            cb({
                success: true,
                data: res.data
            });
        }
    });
}

/**
 * 获取所有自定义题型
 * @private
 * @param  {Function} cb 回调函数
 * @return
 */
function __selectCustoms(cb) {
    // console.log("正在获取所有库中存在的自定义题型");
    db.all("select * from CUSTOMS", function(err, row) {
        if (err) {
            cb({
                success: false,
                data: err
            });
        }
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 查询自定义题型
 * @public
 * @param  name 自定义题型的名称
 * @param  {Function} cb   回调函数
 * @return
 */
function checkCustom(name, cb) {
    __checkCustom(name, function(res) {
        if (res.success == true) {
            cb({
                success: true,
                data: res.data
            });
        } else {
            cb({
                success: false
            })
        }
    });
}

/**
 * 查询自定义题型
 * @private
 * @param  name 自定义题型的名称
 * @param  {Function} cb   回调函数
 * @return
 */
function __checkCustom(name, cb) {
    // console.log("正在检查该自定义题型是否存在 __checkCustom");
    db.get("select count(1) from CUSTOMS where name = ?", [name], function(err, row) {
        if (err) {
            // console.log("查询自定义题型失败");
            cb({
                success: false,
                data: err
            });
        }
        // console.log("查询自定义题型成功");
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 添加自定义题型
 * @public
 * @param  name 题型名称
 * @param  data 题型内容
 * @param  {Function} cb   回调函数
 * @return
 */
function insertCustom(name, type, data, cb) {
    __insertCustom(name, type, data, function(res) {
        if (res.success == true) {
            cb({
                success: true
            });
        } else {
            cb({
                success: false,
                data: res.data
            });
        }
    })
}

/**
 * 添加自定义题型
 * @private
 * @param  name 题型名称
 * @param  data 题型内容
 * @param  {Function} cb   回调函数
 * @return
 */
function __insertCustom(name, type, data, cb) {
    db.run("insert into CUSTOMS(name, type, data) values(?, ?, ?)", [name, type, data], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 将所有业务方案和调查问卷的isNew字段设置为0
 * 回调函数传回更新是否成功
 * @public
 * @param  GlobalData   [用户基础数据]
 * @param  {Function} cb [回调函数]
 * @return
 */
function updateIsNew(GlobalData, cb) {
    __updateSolutionIsNew(GlobalData, function(res) {
        if (res.success == true) {
            __updateQustionnaireIsNew(GlobalData, function(res2) {
                if (res.success == true) {
                    cb({
                        success: true
                    });
                } else {
                    cb({
                        success: false,
                        data: "更新调查问卷isNew字段失败"
                    });
                }
            });
        } else {
            cb({
                success: false,
                data: "更新业务方案isNew字段失败"
            });
        }
    });
}

/**
 * 选出所有业务方案
 * @public
 * @param  GlobalData [用户基础数据]
 * @param  {Function} cb         [回调函数]
 * @return
 */
function getSolutions(GlobalData, cb) {
    /*选出所有业务方案*/
    __selectSolutions(GlobalData, function(res) {
        if (res.success == true) {
            /*选出业务方案成功*/
            cb({
                success: true,
                data: res.data
            });
        } else {
            /*选出业务方案失败*/
            cb({
                success: false,
                data: "选出业务方案失败"
            });
        }
    });
}

/**
 * 选出所有调查问卷
 * @public
 * @param  GlobalData 用户基础数据
 * @param  {Function} cb         回调函数
 * @return
 */
function getQuestionnaires(GlobalData, cb) {
    /*选出所有调查问卷*/
    __selectQuestionnaires(GlobalData, function(res) {
        if (res.success == true) {
            /*选出调查问卷成功*/
            cb({
                success: true,
                data: res.data
            });
        } else {
            cb({
                success: false,
                data: "选出调查问卷失败"
            });
        }
    });
}

/**
 * 根据标识获取某问卷的信息
 * @param  {json}     GlobalData 用户基础数据
 * @param  {string}   name       标识
 * @param  {Function} cb         回调函数
 * @return
 */
function getQuestionnaireByName(GlobalData, name, cb) {
    __selectQuestionnaireByName(GlobalData, name, function(res) {
        if (res.success == true) {
            /*选出调查问卷成功*/
            cb({
                success: true,
                data: res.data
            });
        } else {
            cb({
                success: false,
                data: "获取远程字段失败"
            });
        }
    });
}

/**
 * 根据标识获取某问卷是否存在
 * @param  {json}     GlobalData 用户基础数据
 * @param  {string}   name       标识
 * @param  {Function} cb         回调函数
 * @return
 */
function checkQuestionnaireByName(GlobalData, name, cb) {
    __checkQuestionnaireByName(GlobalData, name, function(res) {
        if (res.success == true) {
            cb({
                success: true,
                data: res.data
            });
        } else {
            cb({
                success: false
            })
        }
    });
}

function __checkQuestionnaireByName(GlobalData, name, cb) {
    db.get("select count(1) from QUESTIONNAIRES where user = ? and URL = ? and name = ?", [GlobalData.user, GlobalData.urlRoot, name], function(err, row) {
        if (err) {
            // console.log("查询问卷失败");
            cb({
                success: false,
                data: err
            });
        }
        // console.log("查询问卷成功");
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 根据标识获取某问卷
 * @param  {json}   GlobalData 用户基础数据
 * @param  {string}   name       标识
 * @param  {Function} cb         回调函数
 * @return
 */
function __selectQuestionnaireByName(GlobalData, name, cb) {
    // console.log("正在根据标识获取某问卷");
    db.all("select * from QUESTIONNAIRES where user = ? and URL = ? and name = ?", [GlobalData.user, GlobalData.urlRoot, name], function(err, row) {
        if (err) {
            cb({
                success: false,
                data: err
            });
        }
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 将所有调查问卷的isNew字段设置为0
 * 回调函数传回更新是否成功
 * @private
 * @param  GlobalData   [用户基础数据]
 * @param  {Function} cb [回调函数]
 * @return
 */
function __updateQustionnaireIsNew(GlobalData, cb) {
    // console.log("正在更新调查问卷中的isNew字段为0");
    db.get("update QUESTIONNAIRES set isNew = ? where URL = ? and user = ?", ["0", GlobalData.urlRoot, GlobalData.user], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 删除调查问卷isNew字段为0的数据
 * 回调函数传回删除是否成功
 * @public
 * @param  GlobalData   [用户基础数据]
 * @param  solutionJson [某一具体业务方案]
 * @param  {Function} cb [回调函数]
 * @return
 */
function deleteQuestionnaireIsNew(GlobalData, solutionName, cb) {
    // console.log("正在删除所有isNew字段为0的业务方案");
    db.get("delete from QUESTIONNAIRES where URL = ? and user = ? and solutionName = ? and isNew = ?", [GlobalData.urlRoot, GlobalData.user, solutionName, "0"], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true,
        });
    });
}

/**
 * 创建临时调查问卷
 * @public
 * @param  GlobalData        用户基础数据
 * @param  solutionName      业务方案的标识
 * @param  questionnaireJson 调查问卷基本信息
 * @param  {Function} cb                回调函数
 */
function createTempQuestionnaire(GlobalData, solutionName, questionnaireJson, cb) {
    // console.log("正在创建临时调查问卷 createQuestionnaire");
    questionnaireJson.isRemote = "0";
    __insertQuestionnaire(GlobalData, solutionName, questionnaireJson, function(res) {
        if (res.success == true) {
            cb({
                "success": true
            });
        }
    });
}

function deleteTempQuestionnaire(GlobalData, tempRecid, cb) {
    // console.log("正在删除临时调查问卷 deleteTempQuestionnaire");
    db.run("delete from QUESTIONNAIRES where URL = ? and user = ? and recid = ?", [GlobalData.urlRoot, GlobalData.user, tempRecid], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 更新调查问卷基本信息
 * @private
 * @param  GlobalData        用户基本数据
 * @param  solutionName      业务方案ID
 * @param  questionnaireJson 调查问卷基本信息
 * @param  {Function} cb                回调函数
 * @return
 */
function __updateQuestionnaire(GlobalData, solutionName, questionnaireJson, cb) {
    // console.log("正在更新调查问卷 __updateQuestionnaire");
    db.get("update QUESTIONNAIRES set title = ?, name = ?, isNew = ? where URL = ? and user = ? and name = ? and solutionName = ?", [questionnaireJson.title, questionnaireJson.name, "1", GlobalData.urlRoot, GlobalData.user, questionnaireJson.name, solutionName], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 更新问卷的主标题和副标题
 * @public
 * @param  GlobalData        用户基础数据
 * @param  questionnaireJson 问卷信息
 * @return
 */
function updateQuestionnaireTitle(GlobalData, questionnaireJson, cb) {
    __updateQuestionnaireTitle(GlobalData, questionnaireJson, function(res) {
        if (res.success == true) {
            cb({
                success: true
            });
        } else {
            cb({
                success: false,
                data: res.data
            });
        }
    });
}

/**
 * 更新问卷的主标题和副标题
 * @private
 * @param  GlobalData        用户基础数据
 * @param  questionnaireJson 问卷信息
 * @return
 */
function __updateQuestionnaireTitle(GlobalData, questionnaireJson, cb) {
    db.get("update QUESTIONNAIRES set title = ?, subtitle = ? where URL = ? and user = ? and name = ?", [questionnaireJson.title, questionnaireJson.subtitle, GlobalData.urlRoot, GlobalData.user, questionnaireJson.name], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

function deleteQuestionnaireByName(GlobalData, name, cb) {
    // console.log("正在删除调查问卷");
    __deleteQuestionnaireByName(GlobalData, name, function(res) {
        if (res.success == true) {
            cb({
                success: true
            });
        } else {
            cb({
                success: false
            });
        }
    });
}

function __deleteQuestionnaireByName(GlobalData, name, cb) {
    db.run("delete from QUESTIONNAIRES where URL = ? and user = ? and name = ?", [GlobalData.urlRoot, GlobalData.user, name], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 添加某调查问卷
 * 回调函数传回添加是否成功
 * @private
 * @param  GlobalData        用户基础数据
 * @param  solutionName      业务方案的ID
 * @param  questionnaireJson 调查问卷基本信息
 * @param  {Function} cb                回调函数
 * @return
 */
function __insertQuestionnaire(GlobalData, solutionName, questionnaireJson, cb) {
    // console.log("正在添加调查问卷 __insertQuestionnaire");
    // console.log(questionnaireJson);
    db.run("insert into QUESTIONNAIRES(URL, user, solutionName, name, no, reportGroupCode, title, subtitle, recid, isNew, isRemote, editTime, data) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [GlobalData.urlRoot, GlobalData.user, solutionName, questionnaireJson.name, questionnaireJson.no, questionnaireJson.reportGroupCode, questionnaireJson.title, questionnaireJson.subtitle, questionnaireJson.recid, "1", questionnaireJson.isRemote, "9999999999", questionnaireJson.data], function(err) {
        if (err) {
            // console.log(err.message);
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 选出该用户的所有调查问卷
 * @private
 * @param  GlobalData [用户基础数据]
 * @param  {Function} cb         [回调函数]
 * @return
 */
function __selectQuestionnaires(GlobalData, cb) {
    // console.log("正在获取该用户的所有问卷");
    // db.all("select * from QUESTIONNAIRES where user = ? and URL = ? and isNew = ?", [GlobalData.user, GlobalData.urlRoot, "1"], function(err, row) {
    db.all("select * from QUESTIONNAIRES where user = ? and URL = ?", [GlobalData.user, GlobalData.urlRoot], function(err, row) {
        if (err) {
            cb({
                success: false,
                data: err
            });
        }
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 更新某调查问卷的表样
 * @public
 * @param  GlobalData 用户基础数据
 * @param  name       标识
 * @param  data       表样
 * @param  {Function} cb         回调函数
 * @return
 */
function updateQuestionnaireData(GlobalData, name, data, isChanged, editTime, cb) {
    __updateQuestionnaireData(GlobalData, name, data, editTime, function(res) {
        if (res.success == true) {
            __updateQuestionnaireIsChanged(GlobalData, name, isChanged, function(res2) {
                if (res2.success == true) {
                    cb({
                        success: true,
                        data: res2.data
                    });
                }
            });
        } else {
            cb({
                success: false,
                data: res.data
            });
        }
    });
}

/**
 * 更新某调查问卷的表样
 * @private
 * @param  GlobalData 用户基础数据
 * @param  name       标识
 * @param  data       表样
 * @param  {Function} cb         回调函数
 * @return
 */
function __updateQuestionnaireData(GlobalData, name, data, editTime, cb) {
    // console.log("正在更新某个调查问卷的表样");
    db.get("update QUESTIONNAIRES set data = ?, editTime = ? where URL = ? and user = ? and name = ?", [data, editTime, GlobalData.urlRoot, GlobalData.user, name], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 更新某调查问卷是否被修改的字段
 * @private
 * @param  GlobalData        用户基础数据
 * @param  name       标识
 * @param  {Boolean}  isChanged  是否修改的字段
 * @param  {Function} cb         回调函数
 * @return
 */
function __updateQuestionnaireIsChanged(GlobalData, name, isChanged, cb) {
    // console.log("正在更新某个调查问卷的是否修改字段");
    db.get("update QUESTIONNAIRES set isChanged = ? where URL = ? and user = ? and name = ?", [isChanged, GlobalData.urlRoot, GlobalData.user, name], function(err, row) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 更新问卷的isChanged属性
 * @public
 * @param  GlobalData        用户基础数据
 * @param  name       标识
 * @param  {Boolean}  isChanged  是否修改的字段
 * @param  {Function} cb         回调函数
 * @return
 */
function updateQuestionnaireIsChanged(GlobalData, name, isChanged, cb) {
    // console.log("正在更新问卷的isChanged属性");
    __updateQuestionnaireIsChanged(GlobalData, name, isChanged, function(res) {
        if (res.success == true) {
            cb({
                success: true
            });
        } else {
            cb({
                success: false,
                data: res.data
            });
        }
    });
}

/**
 * 更新某调查问卷是否在远程服务器上
 * @private
 * @param  GlobalData 用户基础数据
 * @param  name       标识
 * @param  isRemote       是否存在于远程服务器上
 * @param  {Function} cb         回调函数
 * @return
 */
function updateQuestionnaireIsRemote(GlobalData, name, isRemote, cb) {
    if (res.success == true) {
        __updateQuestionnaireIsRemote(GlobalData, name, isRemote, function(res) {
            if (res.success == true) {
                cb({
                    success: true
                });
            }
        });

    } else {
        cb({
            success: false,
            data: res.data
        });
    }
}

/**
 * 更新某调查问卷是否存在于服务器上的字段
 * @private
 * @param  GlobalData        用户基础数据
 * @param  name       标识
 * @param  {Boolean}  isRemote  是否存在于服务器
 * @param  {Function} cb         回调函数
 * @return
 */
function __updateQuestionnaireIsRemote(GlobalData, name, isRemote, cb) {
    // console.log("正在更新某个调查问卷的是否存在于服务端");
    db.get("update QUESTIONNAIRES set isRemote = ? where URL = ? and user = ? and name = ?", [isRemote, GlobalData.urlRoot, GlobalData.user, name], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 检查是否存在该调查问卷
 * 回调函数传回select出的行数
 * @private
 * @param  GlobalData        用户基础数据
 * @param  solutionName     业务方案的标识
 * @param  questionnaireJson 调查问卷基础数据
 * @param  {Function} cb     回调函数
 * @return
 */
function __checkQuestionnaire(GlobalData, solutionName, questionnaireJson, cb) {
    // console.log("正在检查是否存在该问卷 __checkQuestionnaire");
    db.get("select count(1) from QUESTIONNAIRES where user = ? and URL = ? and name = ? and solutionName = ?", [GlobalData.user, GlobalData.urlRoot, questionnaireJson.name, solutionName], function(err, row) {
        if (err) {
            cb({
                success: false,
                data: err
            });
        }
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 删除业务方案isNew字段为0的数据
 * 回调函数传回删除是否成功
 * @public
 * @param  GlobalData   [用户基础数据]
 * @param  solutionJson [某一具体业务方案]
 * @param  {Function} cb [回调函数]
 * @return
 */
function deleteSolutionIsNew(GlobalData, cb) {
    // console.log("正在删除所有isNew字段为0的业务方案");
    db.get("delete from SOLUTIONS where URL = ? and user = ? and isNew = ?", [GlobalData.urlRoot, GlobalData.user, "0"], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 将所有业务方案的isNew字段设置为0
 * 回调函数传回更新是否成功
 * @private
 * @param  GlobalData   [用户基础数据]
 * @param  solutionJson [某一具体业务方案]
 * @param  {Function} cb [回调函数]
 * @return
 */
function __updateSolutionIsNew(GlobalData, cb) {
    // console.log("正在更新业务方案中的isNew字段为0");
    db.get("update SOLUTIONS set isNew = ? where URL = ? and user = ?", ["0", GlobalData.urlRoot, GlobalData.user], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 添加某业务方案
 * 回调函数传回添加是否成功
 * @private
 * @param  GlobalData   [用户基础数据]
 * @param  solutionJson [某一具体业务方案]
 * @param  {Function} cb [回调函数]
 * @return
 */
function __insertSolution(GlobalData, solutionJson, cb) {
    // console.log("正在添加业务方案 __insertSolution");
    db.run("insert into SOLUTIONS(URL, user, periodType, name, minPeriod, maxPeriod, title, recid, isNew) values(?, ?, ?, ?, ?, ?, ?, ?, ?)", [GlobalData.urlRoot, GlobalData.user, solutionJson.periodType, solutionJson.name, solutionJson.minPeriod, solutionJson.maxPeriod, solutionJson.title, solutionJson.recid, "1"], function(err) {
        if (err) {
            // console.log(err.message);
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });

    });
}

/**
 * 更新某业务方案
 * 回调函数传回更新是否成功
 * @private
 * @param  GlobalData   [用户基础数据]
 * @param  solutionJson [某一具体业务方案]
 * @param  {Function} cb           [回调函数]
 * @return
 */
function __updateSolution(GlobalData, solutionJson, cb) {
    // console.log("正在更新该业务方案 __updateSolution");
    db.get("update SOLUTIONS set periodType = ?, minPeriod = ?, maxPeriod = ?, title = ?, name = ?, isNew = ? where URL = ? and user = ? and recid = ?", [solutionJson.periodType, solutionJson.periodRange.minPeriod, solutionJson.periodRange.maxPeriod, solutionJson.title, solutionJson.name, "1", GlobalData.urlRoot, GlobalData.user, solutionJson.recid], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

/**
 * 选出该用户的所有业务方案
 * @private
 * @param  GlobalData [用户基础数据]
 * @param  {Function} cb         [回调函数]
 * @return
 */
function __selectSolutions(GlobalData, cb) {
    // console.log("正在获取该用户的所有业务方案 __selectSolution");
    db.all("select * from SOLUTIONS where user = ? and URL = ? and isNew = ?", [GlobalData.user, GlobalData.urlRoot, "1"], function(err, row) {
        if (err) {
            cb({
                success: false,
                data: err
            });
        }
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 检查是否存在该业务方案
 * 回调函数传回select出的行数
 * @private
 * @param  GlobalData   [用户基础数据]
 * @param  solutionJson [某一具体业务方案]
 * @param  {Function} cb           [回调函数]
 * @return
 */
function __checkSolution(GlobalData, solutionJson, cb) {
    // console.log("正在检查是否存在该业务方案 __checkSolution");
    db.get("select count(1) from SOLUTIONS where user = ? and URL = ? and name = ?", [GlobalData.user, GlobalData.urlRoot, solutionJson.name], function(err, row) {
        if (err) {
            cb({
                success: false,
                data: err
            });
        }
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 检查表是否存在
 * @public
 * @param  {Function} cb 回调函数
 * @return
 */
function checkTable(cb) {
    __checkTable(function(res) {
        if (res.success == true) {
            cb({
                success: true
            });
        } else {
            cb({
                success: false
            });
        }
    });
}

/**
 * 检查表是否存在
 * 若不存在建表
 * @private
 * @param  cb callback
 * @return
 */
function __checkTable(cb) {
    // console.log("正在检查是否存在表 __checkTable");
    if (db) {
        db.get("select 1 from USERS", function(err, row) {
            if (err) {
                cb({
                    success: false,
                    data: err.message
                });
            } else {
                cb({
                    success: true
                });
            }
        });
    }
}

/**
 * 创建表的函数
 * @private
 * @param cb callback
 * @return
 */
function __createTable(cb) {
    // console.log("正在创建表 __createTable");
    /*创建用户信息表*/
    db.serialize(function() {
        try {
            db.run("create table USERS(URL TEXT, user TEXT, userName TEXT, pwd TEXT, token TEXT)");

            db.run("create table SOLUTIONS(URL TEXT, user TEXT, periodType TEXT, name TEXT, minPeriod TEXT, maxPeriod TEXT, title TEXT, recid TEXT, isNew TEXT)");

            db.run("create table QUESTIONNAIRES(URL TEXT, user TEXT, solutionName TEXT, name TEXT, no TEXT, reportGroupCode, title TEXT, subtitle TEXT, recid TEXT, isNew TEXT, data TEXT, isChanged TEXT, isRemote TEXT, editTime TEXT)");

            db.run("create table CUSTOMS(name TEXT, type TEXT, data TEXT)");
            /*表单创建成功*/
            if (cb) {
                cb({
                    success: true
                });
            }
        } catch (err) {
            /*表单创建失败*/
            if (cb) {
                cb({
                    success: false
                });
            }
        }
    });
}

/**
 * 检查当前用户表中是否存在该用户
 * @public
 * @param  GlobalData 用户基础数据
 * @param  {Function} cb   回调函数
 * @return
 */
function checkUser(GlobalData, cb) {
    __checkUser(GlobalData, function(res) {
        if (res.success == true) {
            cb({
                success: true,
                data: res.data
            });
        } else {
            cb({
                success: false
            })
        }
    });
}

/**
 * 检查当前用户表中是否存在该用户
 * @private
 * @param  GlobalData 用户基础数据
 * @param  cb 回调函数
 * @return
 */
function __checkUser(GlobalData, cb) {
    // console.log("正在检查该用户是否存在 __checkUser");
    db.get("select count(1) from USERS where user = ? and URL = ?", [GlobalData.user, GlobalData.urlRoot], function(err, row) {
        if (err) {
            // console.log("查询用户失败");
            cb({
                success: false,
                data: err
            });
        }
        // console.log("查询用户成功");
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 获取所有用户
 * @public
 * @param  {Function} cb 回调函数
 * @return
 */
function selectUsers(cb) {
    __selectUsers(function(res) {
        if (res.success == true) {
            cb({
                success: true,
                data: res.data
            });
        } else {
            cb({
                success: false,
                data: res.data
            });
        }
    });
}

/**
 * 获取所有用户
 * @param  {Function} cb 回调函数
 * @return
 */
function __selectUsers(cb) {
    // console.log("正在获取所有库中存在的用户");
    db.all("select * from USERS", function(err, row) {
        if (err) {
            cb({
                success: false,
                data: err
            });
        }
        cb({
            success: true,
            data: row
        });
    });
}

/**
 * 在用户表中插入该用户数据
 * @private
 * @param  GlobalData 用户基础数据
 * @param  cb callback
 * @return
 */
function __insertUser(GlobalData, cb) {
    // console.log("正在插入该用户数据 __insertUser");
    db.run("insert into USERS(URL, user, userName, pwd, token) values(?, ?, ?, ?, ?)", [GlobalData.urlRoot, GlobalData.user, GlobalData.userName, GlobalData.pwd, GlobalData.token], function(err) {
        if (err) {
            // console.log(err.message);
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });

    });
}

/**
 * 更新该用户数据
 * @private
 * @param GlobalData 用户基础数据
 * @param cb callback
 * @return
 */
function __updateUser(GlobalData, cb) {
    // console.log("正在更新该用户数据 __updateUser");
    db.get("update USERS set token = ?, userName = ?, pwd = ? where URL = ? and user = ?", [GlobalData.token, GlobalData.userName, GlobalData.pwd, GlobalData.urlRoot, GlobalData.user], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

function deleteUser(GlobalData, cb) {
    __deleteQuestionnaires(GlobalData, function(res) {
        if (res.success == true) {
            __deleteSolutions(GlobalData, function(res2) {
                if (res2.success == true) {
                    __deleteUsers(GlobalData, function(res3) {
                        if (res3.success == true) {
                            cb({
                                success: true
                            });
                        }
                    });
                }
            });
        }
    });
}

function __deleteUsers(GlobalData, cb) {
    // console.log("正在删除用户");
    db.run("delete from USERS where URL = ? and user = ?", [GlobalData.urlRoot, GlobalData.user], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

function __deleteQuestionnaires(GlobalData, cb) {
    // console.log("正在删除调查问卷");
    db.run("delete from QUESTIONNAIRES where URL = ? and user = ?", [GlobalData.urlRoot, GlobalData.user], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

function __deleteSolutions(GlobalData, cb) {
    // console.log("正在删除业务方案");
    db.run("delete from SOLUTIONS where URL = ? and user = ?", [GlobalData.urlRoot, GlobalData.user], function(err) {
        if (err) {
            cb({
                success: false,
                data: err.message
            });
        }
        cb({
            success: true
        });
    });
}

exports.initDB = initDB;
exports.selectUsers = selectUsers;
exports.initSolutions = initSolutions;
exports.initQuestionnairesList = initQuestionnairesList;
exports.getSolutions = getSolutions;
exports.getQuestionnaires = getQuestionnaires;
exports.updateIsNew = updateIsNew;
exports.deleteSolutionIsNew = deleteSolutionIsNew;
exports.deleteQuestionnaireIsNew = deleteQuestionnaireIsNew;
exports.createTempQuestionnaire = createTempQuestionnaire;
exports.deleteTempQuestionnaire = deleteTempQuestionnaire;
exports.updateQuestionnaireData = updateQuestionnaireData;
exports.updateQuestionnaireIsRemote = updateQuestionnaireIsRemote;
exports.getQuestionnaireByName = getQuestionnaireByName;
exports.deleteQuestionnaireByName = deleteQuestionnaireByName;
exports.checkUser = checkUser;
exports.updateQuestionnaireTitle = updateQuestionnaireTitle;
exports.checkQuestionnaireByName = checkQuestionnaireByName;
exports.updateQuestionnaireIsChanged = updateQuestionnaireIsChanged;
exports.deleteUser = deleteUser;
exports.checkTable = checkTable;
exports.insertCustom = insertCustom;
exports.checkCustom = checkCustom;
exports.selectCustoms = selectCustoms;
