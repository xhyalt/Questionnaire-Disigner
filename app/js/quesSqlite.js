/**
 * 数据库系统
 * 使用文件类型的数据库Sqlite
 */
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
// const dbFile = "./app/quesSqlite/quesSqlite.db";
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

    console.log("正在初始化数据库 initDB");
    __checkTable(function(res1) {
        console.log("检查表是否存在" + res1.success);
        if (res1.success == false) {
            /*不存在数据库，调用建表函数*/
            console.log("表不存在，建表");
            __createTable(function(res2) {
                if (res2.success == true) {
                    /*建表成功*/
                    console.log("建表成功");
                    /*插入该条数据*/
                    __insertUser(GlobalData, function(res3) {
                        if (res3.success == false) {
                            /*插入数据失败*/
                            console.log("插入数据失败");
                            if (cb) {
                                cb({
                                    success: false,
                                    data: "插入数据失败"
                                });
                            }
                        } else {
                            console.log("插入数据成功");
                            if (cb) {
                                cb({
                                    success: true
                                });
                            }
                        }
                    });
                } else {
                    /*建表不成功*/
                    console.log("建表失败");
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
            console.log("表已存在");
            /*判断表中是否存在该用户数据*/
            __checkUser(GlobalData, function(res2) {
                if (res2.success == true) {
                    /*该用户存在，更新用户数据*/
                    console.log("该用户已经存在于数据库");
                    __updateUser(GlobalData, function(res3) {
                        if (res3.success == true) {
                            console.log("更新用户数据成功");
                            if (cb) {
                                cb({
                                    success: true
                                });
                            }
                        } else {
                            console.log("更新用户数据失败");
                            if (cb) {
                                cb({
                                    success: false,
                                    data: "更新用户数据失败"
                                });
                            }
                        }
                    });

                } else {
                    /*该用户不存在，插入用户数据*/
                    console.log("该用户不存在于数据库中");
                    __insertUser(GlobalData, function(res3) {
                        if (res3.success == false) {
                            /*插入数据失败*/
                            console.log("插入数据失败");
                            if (cb) {
                                cb({
                                    success: false,
                                    data: "插入数据失败"
                                });
                            }
                        } else {
                            console.log("插入数据成功");
                            if (cb) {
                                cb({
                                    success: true
                                });
                            }
                        }
                    });
                }
            });
        }
    });
}

/**
 * 获取业务方案后数据库的处理逻辑，更新业务方案时调用
 * @public
 * @param  GlobalData   [用户基础数据]
 * @param  solutionInfo [所有业务方案的JSON对象]
 * @param  {Function} cb           [回调函数]
 * @return
 */
function initSolutions(GlobalData, solutionInfo, cb) {
    console.log("正在处理更新业务方案的逻辑");
    /*获取业务方案的数量*/
    var solutionsLength = __getJsonLength(solutionInfo);
    __updateSolutions(GlobalData, solutionInfo, solutionsLength, 0, function(res) {
        /*处理业务方案*/
        console.log("业务方案逻辑完成，进入最后一层回调函数");
    });
}

/**
 * 处理每一条业务方案在数据库中的逻辑 递归函数
 * @private
 * @param  GlobalData      [用户基础数据]
 * @param  solutionInfo    [某一业务方案]
 * @param  solutionsLength [所有业务方案的个数]
 * @param  i               [回调递增参数]
 * @param  {Function} cb   [回调函数]
 * @return __updateSolutions    [递归函数]
 */
function __updateSolutions(GlobalData, solutionInfo, solutionsLength, i, cb) {
    console.log(JSON.stringify(solutionInfo));
    __checkSolution(GlobalData, solutionInfo[i], function(res) {
        if (res.success == true) {
            // console.log(res.data["count(1)"]);
            if (res.data["count(1)"] == 0) {
                console.log("不存在该业务方案，添加业务方案");

                __insertSolution(GlobalData, solutionInfo[i], function(res2) {
                    if (res2.success == true) {
                        console.log("添加业务方案成功");
                    } else {
                        console.log("添加业务方案失败");
                    }
                });

            } else {
                console.log("已存在该业务方案，更新业务方案");
                __updateSolution(GlobalData, solutionInfo[i], function(res2) {
                    if (res2.success == true) {
                        console.log("更新业务方案成功");
                    } else {
                        console.log("更新业务方案失败");
                    }
                });
            }

        } else {
            /*查询出错*/
            console.log("查询出错");
        }
        if (++i < solutionsLength) {
            return updateSolutions(GlobalData, solutionInfo, solutionsLength, i, cb);
        } else {
            return;
        }
    });
    // }

}

/**
 * 添加某业务方案
 * @private
 * @param  GlobalData   [用户基础数据]
 * @param  solutionJson [某一具体业务方案]
 * @param  {Function} cb [回调函数]
 * @return
 */
function __insertSolution(GlobalData, solutionJson, cb) {
    console.log("正在添加业务方案 __insertSolution");
    db.run("insert into SOLUTIONS(URL, user, periodType, name, minPeriod, maxPeriod, title, recid) values(?, ?, ?, ?, ?, ?, ?, ?)", [GlobalData.urlRoot, GlobalData.user, solutionJson.periodType, solutionJson.name, solutionJson.minPeriod, solutionJson.maxPeriod, solutionJson.title, solutionJson.recid], function(err) {
        if (err) {
            console.log(err.message);
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
 * 更新某业务方案
 * 回调函数传回更新是否成功
 * @private
 * @param  GlobalData   [用户基础数据]
 * @param  solutionJson [某一具体业务方案]
 * @param  {Function} cb           [回调函数]
 * @return
 */
function __updateSolution(GlobalData, solutionJson, cb) {
    console.log("正在更新该业务方案 __updateSolution");
    db.get("update SOLUTIONS set periodType = ?, minPeriod = ?, maxPeriod = ?, title = ?, recid = ? where URL = ? and user = ? and name = ?", [solutionJson.periodType, solutionJson.periodRange.minPeriod, solutionJson.periodRange.maxPeriod, solutionJson.title, solutionJson.recid, GlobalData.urlRoot, GlobalData.user, solutionJson.name], function(err) {
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
 * 检查是否存在该业务方案
 * 回调函数传回select出的函数
 * @private
 * @param  GlobalData   [用户基础数据]
 * @param  solutionJson [某一具体业务方案]
 * @param  {Function} cb           [回调函数]
 * @return
 */
function __checkSolution(GlobalData, solutionJson, cb) {
    console.log("正在检查是否存在该业务方案 __checkSolution");
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
 * 获取JSON某元素的长度
 * @private
 * @param  jsonData 某JSON
 * @return 返回该JSON的长度
 */
function __getJsonLength(jsonData) {
    var jsonLength = 0;
    for (var item in jsonData) {
        jsonLength++;
    }
    return jsonLength;
}

/**
 * 检查表是否存在
 * 若不存在建表
 * @private
 * @param  cb callback
 * @return
 */
function __checkTable(cb) {
    console.log("正在检查是否存在表 __checkTable");
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
    console.log("正在创建表 __createTable");
    /*创建用户信息表*/
    db.serialize(function() {
        try {
            db.run("create table USERS(URL TEXT, user TEXT, userName TEXT, pwd TEXT, token TEXT)");

            db.run("create table SOLUTIONS(URL TEXT, user TEXT, periodType TEXT, name TEXT, minPeriod TEXT, maxPeriod TEXT, title TEXT, recid TEXT)");
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
 * @private
 * @param  GlobalData 用户基础数据
 * @param  cb 回调函数
 * @return
 */
function __checkUser(GlobalData, cb) {
    console.log("正在检查该用户是否存在 __checkUser");
    db.each("select 1 from USERS where user = ? and URL = ?", [GlobalData.user, GlobalData.urlRoot], function(err, row) {
        if (err) {
            console.log("不存在该用户");
            cb({
                success: false,
                data: err
            });
        }
        console.log("存在该用户");
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
    console.log("正在插入该用户数据 __insertUser");
    db.run("insert into USERS(URL, user, userName, pwd, token) values(?, ?, ?, ?, ?)", [GlobalData.urlRoot, GlobalData.user, GlobalData.userName, GlobalData.pwd, GlobalData.token], function(err) {
        if (err) {
            console.log(err.message);
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
 * 更新该用户数据
 * @private
 * @param GlobalData 用户基础数据
 * @param cb callback
 * @return
 */
function __updateUser(GlobalData, cb) {
    console.log("正在更新该用户数据 __updateUser");
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

exports.initDB = initDB;
exports.initSolutions = initSolutions;
