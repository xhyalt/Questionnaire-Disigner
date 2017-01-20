const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
//新增数据文件库
const dbFile = "./quesSqlite.db";
const db = new sqlite3.Database(dbFile);

/**
 * 检查用户表是否存在
 * 若不存在建表
 */
function checkTable(cb) {
    if (db) {
        db.get("select * from USER", function(err, row) {
            if (err) {
                // 表单不存在 重新创建表单
                createUserTable(cb);
            } else {
                return cb({
                    success: true
                });
            }
        })
    }
}

/**
 * 创建用户表的函数
 */
function createUserTable() {
    try {
        console.log("sqlite3 " + sqlite3);
        console.log("miaomiao");
        db.serialize(function() {

            /*创建用户信息表*/
            db.run("create table if not exists USER (URL TEXT, user TEXT, userName TEXT, pwd TEXT, token TEXT)");
        });
        console.log("hehemiaomiao");
        /*表单创建成功*/
        return {
            success: true
        };
    } catch (err) {
        console.log(err.message);
        // alert(err.description);
        // alert(err.number);
        // alert(err.name);
        /*表单创建失败*/
        return {
            success: false,
            data: err.description
        };
    }

}

/**
 * 检查当前用户表中是否存在该用户
 */
function checkUser(GlobalData) {
    db.get("select count(1) from USER where user = ? and URL = ?", [GlobalData.user, GlobalData.URL], function(err, row) {
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

function insertUser(GlobalData) {
    db.get("insert into USER values(?, ?, ?, ?, ?)", [GlobalData.urlRoot, GlobalData.user, GlobalData.userName, GlobalData.pwd, GlobalData.token], function(err, row) {
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

exports.createUserTable = createUserTable;
