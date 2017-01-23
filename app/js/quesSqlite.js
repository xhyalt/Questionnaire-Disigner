/**
 * 数据库系统
 * 使用文件类型的数据库Sqlite
 */
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbFile = "./app/quesSqlite/quesSqlite.db";
const db = new sqlite3.Database(dbFile);

/**
 * 登录时初始化数据库
 * @public
 * @param  GlobalData
 * @param  cb
 * @return
 */
function initDB(GlobalData, cb) {

    checkTable(function(res1) {
        alert("res1" + res1.data);
        if (res1.success == false) {
            /*不存在数据库，调用建表函数*/
            createTable(function(res2) {
                alert("res2" + res2.success);
                /*插入该条数据*/
                if (res2.success == true) {
                    insertUser(GlobalData, function(res3) {
                        if (res3.success == false)
                            alert("res3" + res3.data);
                        else alert("res3" + res3.success);
                    });
                }
            });
        } else {
            /*已存在建表函数，调用查找函数*/
            alert("已存在表表");
        }
    });
}

/**
 * 检查表是否存在
 * 若不存在建表
 * @private
 * @param  cb
 * @return
 */
function checkTable(cb) {
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
 */
function createTable(cb) {
    alert("sqlite3 " + sqlite3);
    /*创建用户信息表*/
    db.get("create table USER(URL TEXT, user TEXT, userName TEXT, pwd TEXT, token TEXT)", function(err, row) {
        console.log("hehehehe");
        if (err) {
            console.log("There is something wrong");
        } else {
            console.log("I get it");
        }
    });
    // db.run("create table USER(URL TEXT, user TEXT, userName TEXT, pwd TEXT, token TEXT)", function(err) {
    //     if (err) {
    //         alert(err.message);
    //         cb({
    //             success: false,
    //             data: err.message
    //         });
    //     } else {
    //         cb({
    //             success: true,
    //             // data: row
    //         });
    //     }
    // });
}

/**
 * 检查当前用户表中是否存在该用户
 */
function checkUser(GlobalData, GlobalData) {
    db.get("select count(1) from USER where user = ? and URL = ?", [GlobalData.user, GlobalData.URL], function(err, row) {
        if (err) {
            cb({
                success: false,
                data: err
            });
        } else {
            cb({
                success: true,
                data: row
            });
        }
    });
}

function insertUser(GlobalData, cb) {
    alert("GlobalData.token = " + GlobalData.token);
    db.run("insert into USER(URL, user, userName, pwd, token) values(?, ?, ?, ?, ?)", [GlobalData.urlRoot, GlobalData.user, GlobalData.userName, GlobalData.pwd, GlobalData.token], function(err) {
        if (err) {
            alert(err.message);
            cb({
                success: false,
                data: err.message
            });
        } else {
            cb({
                success: true,
                data: row
            });
        }
    });
}

function updateUser(GlobalData) {
    db.get("update USER set token = ?, userName = ?, pwd = ? where URL = ? and user = ?", [GlobalData.token, GlobalData.userName, GlobalData.pwd, GlobalData.urlRoot, GlobalData.user], function(err, row) {
        if (err) {
            return cb({
                success: false,
                data: err
            });
        }
        return cb({
            success: true,
            data: row
        });
    });
}

exports.initDB = initDB;
exports.checkUser = checkUser;