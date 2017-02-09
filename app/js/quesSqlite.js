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
 * 初始化数据库函数
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
 * 检查表是否存在
 * 若不存在建表
 * @private
 * @param  cb callback
 * @return
 */
function __checkTable(cb) {
    console.log("正在检查是否存在表 __checkTable");
    if (db) {
        db.get("select 1 from USER", function(err, row) {
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
            db.run("create table USER(URL TEXT, user TEXT, userName TEXT, pwd TEXT, token TEXT)");

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
    db.each("select 1 from USER where user = ? and URL = ?", [GlobalData.user, GlobalData.urlRoot], function(err, row) {
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
    console.log("正在插入该用户数据 __insertUser");
    db.run("insert into USER(URL, user, userName, pwd, token) values(?, ?, ?, ?, ?)", [GlobalData.urlRoot, GlobalData.user, GlobalData.userName, GlobalData.pwd, GlobalData.token], function(err) {
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
    db.get("update USER set token = ?, userName = ?, pwd = ? where URL = ? and user = ?", [GlobalData.token, GlobalData.userName, GlobalData.pwd, GlobalData.urlRoot, GlobalData.user], function(err) {
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
