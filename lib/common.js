const bcrypt    = require('bcryptjs');
const CryptoJS  = require('crypto-js');

/**
 * 1.hash混淆使用统一加密库
 * 只能加密string类型
 * factor为int类型
 * @returns {string|string}
 */
exports.hashStr = (str, factor = 10) => {
	return bcrypt.hashSync(str, factor);
};

/**
 * 2.将str和混淆过的str进行比较（常用于输入密码和加密过的密码进行比较）
 * @param str
 * @param hashStr
 * @returns {boolean}
 */
exports.compareHash = (str, hashStr) => {
	return bcrypt.compareSync(str, hashStr);
};

/**
 * 3.对称加密（使用AES加密）
 * @param str
 * @param salt
 * @returns {string}
 */
exports.encrypt = (str, salt) => {
	return CryptoJS.AES.encrypt(str, salt).toString();
};

/**
 * 4.AES解密和encrypt配合使用
 * 注意：两者应该使用同一个salt才能正确解密
 * 解密失败会返回''空字符串
 * @param str
 * @param salt
 * @returns {string}
 */
exports.decrypt = (str, salt) => {
	return CryptoJS.AES.decrypt(str, salt).toString(CryptoJS.enc.Utf8);
};

/**
 * 5.错误处理
 * @param logPath
 */
exports.errorHandler = function (logPath) {
	let logger = require('./logger')(logPath);
	return {
		// 处理http端错误
		httpErrorHandler : (error, req, res) => {
			let {code = 1000, msg = '系统内部错误', data = {}, stack, name: errorName} = error;
			// 输出错误数据时自动添加path和request请求的相关参数
			data.path = req.path;
			data.params = req.query || req.params || req.body || {};
			let dataStr = data ? JSON.stringify(data): '';

			/**
			 * 根据errorName分别处理不同的错误
			 */
			switch(errorName) {
				case 'RequestError' :
					logger.warn('错误代码：%d；错误信息：%s；错误数据：%s；', code, msg, dataStr);
				default :
					logger.error('错误代码：%d；错误信息：%s；错误数据：%s；\n%s', code, msg, dataStr, stack);
			}
			return res.json(code, msg, data);
		},
	}
};

/**
 * 6.获取访问的ip地址
 * @param req
 * @returns {*}
 */
exports.getClientIp = function(req){
	return req.headers['x-forwarded-for'] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		req.connection.socket.remoteAddress;
};

/**
 * 7.内置错误状态码
 * @type {{SUCCESS: number, WRONG_PARAMS: number, WRONG_DATETIME: number}}
 */
exports.ERROR_CODE = {
	SUCCESS         : 0,    // 成功

	WRONG_PARAMS    : 101,  // 参数校验错误
	WRONG_DATETIME  : 102,  // 时间相关错误
};

/**
 * 8.将key和截止日期（expire）使用salt加密；可用于制作token；
 * - key中不允许出现分号':'
 * - 如果expire小于等于0，表示这个token没有过时日期
 * @param key
 * @param salt
 * @param expire
 * @returns {string}
 */
exports.makeAuthCode = (key, salt, expire = 0) => {
	if (key === null || key === undefined || typeof key !== 'string' || key === '' || key.indexOf(':') > -1) {
		throw new Error(`非法的key值：${key}`);
	}

	return exports.encrypt(key + ':' + expire, salt);
};

/**
 * 9.使用salt解密authCode，并获取key
 * @param authCode
 * @param salt
 * @returns {Array.key}
 */
exports.checkAuthCode = (authCode, salt) => {
	let keyAndExpire = exports.decrypt(authCode, salt);

	if (!keyAndExpire || keyAndExpire.indexOf(':') < 0) {
		throw new Error(`authCode解密失败或者不符合规范：${authCode}`);
	}

	let [key, expire] = keyAndExpire.split(':');
	// expire大于0，需要校验是否超过该token的有效期
	if (expire > 0 && new Date().getTime() > expire) {
		throw new Error(`authCode已经过期，截止日期：${expire}`)
	}

	return key;
};


