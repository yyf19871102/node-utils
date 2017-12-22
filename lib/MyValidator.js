const validator = require('validator');
const _         = require('lodash');
const Promise   = require('bluebird');
const moment    = require('moment');

const WRONG_CODE= require('./common').ERROR_CODE.WRONG_PARAMS;
const SysError  = require('./Errors').SystemError;

/**
 * 1.构造器
 * @param paramObj 需要校验的对象
 * @constructor
 */
function MyValidator (paramObj) {
	// 不能验证null、undefined、数组和基本型变量
	this._paramObj = _.cloneDeep(paramObj);
	if (paramObj === null || paramObj === undefined || Array.isArray(paramObj) || typeof paramObj !== 'object') {
		this.paramObj = paramObj;
		this.success = false;
		this.msg = '不能校验变量、null或者undefined';
	} else {
		this.paramObj = paramObj;
		// 深拷贝，所有参数格式化操作不影响原来的参数对象
		this.success = true;
		this.msg = '';
	}
}

/**
 * 2.校验指定的属性是否存在，并取值
 * @param propName
 * @param opt
 * @returns {*}
 */
MyValidator.prototype.checkAndGetValue = function(propName, opt) {
	let value = _.cloneDeep(this.paramObj);
	// 嵌套属性
	let keys = propName.indexOf('.') > -1 ? propName.split('.') : [propName];

	for (let i = 0; i < keys.length; i++) {
		let keyPropName = keys[i];
		value = value[keyPropName];
		if (i === keys.length - 1) {
			// 如果是校验对象的最后一个子属性，需要判断opt里面是否设置optional为true
			if ((value === null || value === undefined || value === '') && (!opt || opt && !opt.optional)) {
				this.msg = `校验参数为空，propName：${keyPropName}`;
				this.success = false;
				return null;
			}
		} else {
			// 非最后一个子属性，只要value为null就校验失败
			if (value === null || value === undefined || value === '') {
				this.msg = `校验参数为空，propName：${keyPropName}`;
				this.success = false;
				return null;
			}
		}
	}
	return value;
};

/**
 * 3.格式化指定的校验属性
 * @param propName
 * @param val
 */
MyValidator.prototype.format = function(propName, val){
	let keys = propName.indexOf('.') > -1 ? propName.split('.') : [propName];
	let value = this._paramObj;
	for (let i = 0 ; i < keys.length; i++) {
		if (i === keys.length - 1) {
			value[keys[i]] = val;
		} else {
			value = value[keys[i]];
		}
	}
};

/**
 * 4.校验指定参数不允许为空字符串
 * @param propName 字段名
 * @returns {MyValidator}
 */
MyValidator.prototype.notEmpty = function (propName) {
	this.checkAndGetValue(propName);
	return this;
};

/**
 * 5.校验指定参数是否为整数类型
 * @param propName
 * @param opt 校验参数
 * @returns {MyValidator}
 */
MyValidator.prototype.isInt = function (propName, opt) {
	let val = this.checkAndGetValue(propName, opt);
	if (val === null ||val === undefined) {
		return this;
	}

	if (typeof val === 'string') {
		// 使用validator根据opt约束条件判断int
		if (!validator.isInt(val, opt)){
			this.success = false;
			this.msg = '字段非int类型或者不符合约束：' + propName;
		} else {
			// 符合条件就进行格式化
			this.format(propName, parseInt(val));
		}
	} else if (typeof val === 'number') {
		if (Number(val) % 1 !== 0) {
			this.success = false;
			this.msg = '字段是float，非Int：' + propName;
		}

		if (opt && !validator.isInt(val + '', opt) || !opt && !validator.isInt(val + '')){
			this.success = false;
			this.msg = '字段非int类型或者不符合约束：' + propName;
		}
	} else {
		this.success = false;
		this.msg = '字段非整数：' + propName;
	}
	return this;
};

/**
 * 6.校验指定参数是否为float类型
 * @param propName
 * @param opt 校验参数
 * @returns {MyValidator}
 */
MyValidator.prototype.isFloat = function (propName, opt) {
	let val = this.checkAndGetValue(propName, opt);
	if (val === null ||val === undefined) {
		return this;
	}

	if (typeof val === 'string') {
		// 使用validator根据opt约束条件判断int
		if (!validator.isFloat(val, opt)){
			this.success = false;
			this.msg = '字段非float类型或者不符合约束：' + propName;
		} else {
			// 符合条件就进行格式化
			this.format(propName, Number(val));
		}
	} else if (typeof val === 'number') {
	} else {
		this.success = false;
		this.msg = '字段非Float：' + propName;
	}
	return this;
};

/**
 * 7.校验boolean类型
 * @param propName
 * @param opt
 * @returns {MyValidator}
 */
MyValidator.prototype.isBoolean = function (propName, opt) {
	let val = this.checkAndGetValue(propName, opt);
	if (val === null ||val === undefined) {
		return this;
	}

	if (val === 'true' || val === 'false') {
		this.format(propName, Boolean(val));
	} else if (typeof val === 'boolean') {
	} else {
		this.success = false;
		this.msg = '非法的boolean：' + propName;
	}

	return this;
};

/**
 * 8.校验时间型字符串
 * [1].YYYY-MM-DD HH:mm:ss.SSS
 * [2].YYYY-MM-DD HH:mm:ss
 * [3].YYYY-MM-DD
 * @param propName
 * @param opt
 * @returns {MyValidator}
 */
MyValidator.prototype.isDateTime = function (propName, opt) {
	let val = this.checkAndGetValue(propName, opt);
	if (val === null ||val === undefined) {
		return this;
	}

	if (!/\d{2}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3}/.test(val) &&
		!/\d{2}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(val) &&
		!/\d{2}-\d{2}-\d{2}/.test(val) ||
		!moment(val).isValid()) {
		this.success = false;
		this.msg = '错误的时间格式：' + propName;
	}

	return this;
};

/**
 * 9.校验数组
 * opt.type来指定数组元素是什么类型；
 * @param propName
 * @param opt
 * @returns {MyValidator}
 */
MyValidator.prototype.isArr = function ( propName, opt ) {
	let val = this.checkAndGetValue(propName, opt);
	if (val === null ||val === undefined) {
		return this;
	}

	// 判断数组类型
	if (!Array.isArray(val)) {
		this.success = false;
		this.msg = '字段非数组类型：' + propName;
		return this;
	}

	// opt.type必选
	if (!opt || !opt.type) {
		this.success = false;
		this.msg = '校验数组opt.type不允许为空：' + propName;
		return this;
	}

	let use = [];
	val.forEach(item => {
		switch (opt.type) {
			case 'string':
				if (typeof item !== 'string') {
					this.success = false;
					this.msg = '数组中某个元素非string类型';
				} else {
					use.push(item);
				}
				break;
			case 'number':
				if (typeof item !== 'number') {
					this.success = false;
					this.msg = '数组中某个元素非number类型';
				} else {
					use.push(Number(item));
				}
				break;
			case 'boolean':
				if (typeof item !== 'boolean') {
					this.success = false;
					this.msg = '数组中某个元素非boolean类型';
				} else {
					use.push(Boolean(item));
				}
				break;
			case 'int':
				if (typeof item !== 'number' || Number(item) % 1 !== 0) {
					this.success = false;
					this.msg = '数组中某个元素非int类型';
				} else {
					use.push(parseInt(item));
				}
				break;
			case 'object': break;
			default: this.success = false; this.msg = 'opt.type错误！'
		}
	});
	this.success && (this._paramObj[propName] = use);
	return this;
};




/**
 * 最终校验，返回promis类型
 * @returns {*}
 */
MyValidator.prototype.validate = function () {
	if (this.success) {
		return Promise.resolve(this._paramObj);
	} else {
		return Promise.reject(new SysError(WRONG_CODE, this.msg, this.paramObj));
	}
};

module.exports = MyValidator;


