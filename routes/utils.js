var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var async = require('async');
var utils = module.exports;


var TEMPLATE_FILE = path.resolve(__dirname, 'template.html');
var API_PATH = path.resolve(__dirname, '../api');

// 取API文件名
function resolveAPIPath (name) {
  return path.resolve(API_PATH, name + '.markdown');
}

// 读取文件内容
function readAPIFile (name, callback) {
  if (name === 'index') name = '_toc';
  if (name === 'all') {
    var filename = resolveAPIPath(name);
    fs.readFile(filename, 'utf8', function (err, content) {
      if (err) return callback(err);
      processIncludes(content, function (err, content) {
        callback(err, content, filename);
      });
    });
  } else {
    var filename = resolveAPIPath(name);
    fs.readFile(filename, 'utf8', function (err, content) {
      callback(err, content, filename);
    });
  }
}

// 处理包含文件
function processIncludes (content, callback) {
  var includeExpr = /^@include\s+([A-Za-z0-9-_]+)(?:\.)?([a-zA-Z]*)$/gmi;
  var includes = content.match(includeExpr);
  if (includes === null) return cb(null, content);

  includes = includes.map(function(include) {
    var fname = include.replace(/^@include\s+/, '');
    if (fname.match(/\.markdown$/)) fname = fname.slice(0, -9);
    return fname;
  });

  var allContent = [];
  async.eachSeries(includes, function (name, next) {
    readAPIFile(name, function (err, content, filename) {
      if (!err) {
        allContent.push(content);
      }
      next();
    });
  }, function (err) {
    if (err) return callback(err);
    callback(null, allContent.join('\n'));
  });
}


exports.resolveAPIPath = resolveAPIPath;
exports.readAPIFile = readAPIFile;
exports.processIncludes = processIncludes;
exports.TEMPLATE_FILE = TEMPLATE_FILE;
exports.API_PATH = API_PATH;


/**
 * 32位MD5加密
 *
 * @param {string} text 文本
 * @return {string}
 */
exports.md5 = function (text) {
  return crypto.createHash('md5').update(text).digest('hex');
};

/**
 * 加密密码
 *
 * @param {string} password
 * @return {string}
 */
exports.encryptPassword = function (password) {
  var random = utils.md5(Math.random() + '' + Math.random()).toUpperCase();
  var left = random.substr(0, 2);
  var right = random.substr(-2);
  var newpassword = utils.md5(left + password + right).toUpperCase();
  return [left, newpassword, right].join(':');
};

/**
 * 验证密码
 *
 * @param {string} password 待验证的密码
 * @param {string} encrypted 密码加密字符串
 * @return {bool}
 */
exports.validatePassword = function (password, encrypted) {
  var random = encrypted.toUpperCase().split(':');
  if (random.length < 3) return false;
  var left = random[0];
  var right = random[2];
  var main = random[1];
  var newpassword = utils.md5(left + password + right).toUpperCase();
  return newpassword === main;
};

/**
 * 加密信息
 *
 * @param {Mixed} data
 * @param {String} secret
 * @return {String}
 */
exports.encryptData = function (data, secret) {
  var str = JSON.stringify(data);
  var cipher = crypto.createCipher('aes192', secret);
  var enc = cipher.update(str, 'utf8', 'hex');
  enc += cipher.final('hex');
  return enc;
};

/**
 * 解密信息
 *
 * @param {String} str
 * @param {String} secret
 * @return {Mixed}
 */
exports.decryptData = function (str, secret) {
  var decipher = crypto.createDecipher('aes192', secret);
  var dec = decipher.update(str, 'hex', 'utf8');
  dec += decipher.final('utf8');
  var data = JSON.parse(dec);
  return data;
};

/**
 * 产生随机字符串
 *
 * @param {Integer} size
 * @return {String}
 */
exports.randomString = function (size) {
  size = size || 6;
  var code_string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var max_num = code_string.length + 1;
  var new_pass = '';
  while (size > 0) {
    new_pass += code_string.charAt(Math.floor(Math.random() * max_num));
    size--;
  }
  return new_pass;
};