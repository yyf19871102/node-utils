const util  = require('util');

/**
 * 所有自定义异常的父类
 * @param code  错误状态码
 * @param msg   错误信息
 * @param data  相关数据
 * @param constr    子类构造器
 * @constructor
 */
let AbstractError = function (code, msg, data, constr) {
	Error.captureStackTrace(this, constr || this);
	this.code = code;
	this.data = data || {};
	this.message = msg || 'Error'
};
util.inherits(AbstractError, Error);
AbstractError.prototype.name = 'Abstract Error';

/**
 * 系统相关异常，开发环境下返回到前端用于帮助定位错误；生产环境下不返回给前端；
 * 系统异常种类：
 * 1.自定义抛出异常：如插入以及修改数据时校验失败
 * 2.runtime时系统抛出的异常：数组越界、访问null的属性等
 */
let SystemError = function (code, msg, data) {
	SystemError.super_.call(this, code, msg, data, this.constructor)
};
util.inherits(SystemError, AbstractError);
SystemError.prototype.name = 'SystemError';

/**
 * 客户端请求异常，一般为用户或者客户端非法操作。错误结果返回到前端。
 * 比如：非法参数、权限错误等，
 * @param msg
 * @constructor
 */
let RequestError = function (code, msg, data) {
	RequestError.super_.call(this, code, msg, data, this.constructor)
};
util.inherits(RequestError, AbstractError);
RequestError.prototype.name = 'RequestError';

module.exports = {
	SystemError,
	RequestError,
};
