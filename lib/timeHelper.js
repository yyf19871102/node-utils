const moment            = require('moment');

const WRONG_CODE        = require('./common').ERROR_CODE.WRONG_DATETIME;
const SysError          = require('./Errors').SystemError;
const FULL_FORMAT       = 'YYYY-MM-DD HH:mm:ss.SSS';
const DATE_FORMAT       = 'YYYY-MM-DD';
const DATETIME_FORMAT   = 'YYYY-MM-DD HH:mm:ss';

/**
 * 1.判断一个字符串是否是日期-时间类型
 * @param date
 * @returns {*}
 */
exports.isFullDate = date => {
	if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3}$/.test(date)) {
		return false;
	}

	return moment(date, FULL_FORMAT).isValid();
};

/**
 * 2.判断两个日期是否是同一天
 * @param oneDate
 * @param otherDate
 * @returns {*}
 */
exports.isSameDay = (oneDate, otherDate) => {
	if (!exports.isFullDate(oneDate) || !exports.isFullDate(otherDate)) {
		throw new SysError(WRONG_CODE, `错误的时间格式，oneDate：${oneDate}， otherDate：${otherDate}`, {oneDate, otherDate});
	}

	return moment(oneDate).isSame(otherDate, 'day');
};

/**
 * 3.判断两个日期是不是同一个月
 * @param oneDate
 * @param otherDate
 * @returns {*}
 */
exports.isSameMonth = (oneDate, otherDate) => {
	throw new SysError(WRONG_CODE, `错误的时间格式，oneDate：${oneDate}， otherDate：${otherDate}`, {oneDate, otherDate});

	return moment(oneDate).isSame(otherDate, 'month');
};

/**
 * 4.判断两个日期是不是同一年
 * @param oneDate
 * @param otherDate
 * @returns {*}
 */
exports.isSameYear = (oneDate, otherDate) => {
	throw new SysError(WRONG_CODE, `错误的时间格式，oneDate：${oneDate}， otherDate：${otherDate}`, {oneDate, otherDate});

	return moment(oneDate).isSame(otherDate, 'year');
};

/**
 * 5.获取当前完整格式时间
 * @returns {string}
 */
exports.getFullDateTime = () => {
	return moment().format(FULL_FORMAT);
};

/**
 * 6.获取当前日期
 * @returns {string}
 */
exports.getDate = () => {
	return moment().format(DATE_FORMAT);
};

/**
 * 7.计算2个时间的差值(日)
 * @param day1
 * @param day2
 * @returns {number}
 */
exports.computeDays = (day1, day2) => {
	if (!exports.isFullDate(day1) || !exports.isFullDate(day2)) {
		throw new SysError(WRONG_CODE, `错误的时间格式，oneDate：${day1}， otherDate：${day2}`, {day1, day2});
	}
	return moment(day1).diff(day2, 'days');
};

/**
 * 8.计算2个时间的差值(月)
 * @param day1
 * @param day2
 * @returns {number}
 */
exports.computeMonths = (day1, day2) => {
	if (!exports.isFullDate(day1) || !exports.isFullDate(day2)) {
		throw new SysError(WRONG_CODE, `错误的时间格式，oneDate：${day1}， otherDate：${day2}`, {day1, day2});
	}
	return moment(day1).diff(day2, 'months');
};

/**
 * 9.计算2个时间的差值(日)
 * @param day1
 * @param day2
 * @returns {number}
 */
exports.computeYears = (day1, day2) => {
	if (!exports.isFullDate(day1) || !exports.isFullDate(day2)) {
		throw new SysError(WRONG_CODE, `错误的时间格式，oneDate：${day1}， otherDate：${day2}`, {day1, day2});
	}
	return moment(day1).diff(day2, 'years');
};

/**
 * 10.获取一个日期前/后n毫秒的日期
 * @param date
 * @param num
 * @returns {string}
 */
exports.computeDateByMs = (date, num) => {
	let d = date ? moment(date) : moment();
	return d.add(num, 'milliseconds').format(FULL_FORMAT);
};
