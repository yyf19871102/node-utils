const mongoose      = require('mongoose');
const uuid          = require('uuid');

const SysError      = require('./Errors').SystemError;
const ERROR_CODE    = require('./common').ERROR_CODE;
const common        = require('./common');
const timeHelper    = require('./timeHelper');

let counterSchema, IdentityCounter;

/**
 * 根据options判断schema是否需要添加_id字段
 * @param schema
 * @param options
 * @returns {boolean}
 */
function shoudAddId(schema, options){
	return typeof options === 'object' && options.hasOwnProperty('_id');
}

/**
 * 如果id的位数小于length，前面填充0
 * @param id
 * @param length
 * @returns {*}
 */
function fillZero(id, length) {
	let tmp = (id + '');
	for (let i = 0; i < length - (id + '').length; i++) {
		tmp = '0' + tmp;
	}
	return tmp;
}

// Initialize plugin by creating counter collection in database.
// 直接使用connection建立自增长使用数据表
exports.initialize = function (connection) {
	try {
		IdentityCounter = connection.model('IdentityCounter');
	} catch (ex) {
		if (ex.name === 'MissingSchemaError') {
			// Create new counter schema.
			counterSchema = new mongoose.Schema({
				colName : { type: String, require: true, index: true},  // 集合名字
				count   : { type: Number, default: 0 }                  // 自增长ID
			});

			// Create a unique index using the "field" and "model" fields.
			// 建立复合索引时会报错，这个原因暂时不明，暂时注释掉
			// counterSchema.index({ field: 1, model: 1 }, { unique: true, required: true, index: -1 });

			// Create model using new schema.
			IdentityCounter = connection.model('IdentityCounter', counterSchema);
		}
		else
			throw ex;
	}
};

// The function to use when invoking the plugin on a custom schema.
exports.plugin = function (schema, options) {

	// If we don't have reference to the counterSchema or the IdentityCounter model then the plugin was most likely not
	// initialized properly so throw an error.
	if (!counterSchema || !IdentityCounter) throw new Error("mongoose-auto-increment has not been initialized");
	let ready = false;

	!schema.path('createdAt') && (schema.add({createdAt: {type: String, index: true}}));
	!schema.path('updatedAt') && (schema.add({updatedAt: {type: String}}));

	// 向schema中添加_id字段
	if (shoudAddId(schema, options)) {
		let field = {_id: {}};

		// 如果_id存在，则colName配置项必选
		if (!options.colName || typeof options.colName !== 'string') {
			throw new SysError(ERROR_CODE.WRONG_PARAMS, 'mongoose初始化plugin时，错误的colName配置：' + options);
		}

		// 如果_id为gameAutoId，则len选项配置必选
		if (options._id === 'gameAutoId' && (!options.len || typeof options.len !== 'number' || parseInt(options.len) < 1)) {
			throw new SysError(ERROR_CODE.WRONG_PARAMS, 'mongoose初始化plugin时，错误的len配置：' + options);
		}

		switch (options._id) {
			case 'uuid':
			case 'gameAutoId': field._id.type = String; break;
			case 'autoId': field._id.type = Number; break;
			default: throw new SysError(ERROR_CODE.WRONG_PARAMS, 'mongoose初始化plugin时，错误的_id配置：' + options);
		}
		schema.add(field);
	}

	// 初始化counter数据
	IdentityCounter.findOne({colName: options.colName}, function (err, counter) {
		if (!counter) {
			// 默认从0开始
			counter = new IdentityCounter({colName: options.colName, count: 0});
			counter.save(function () {
				ready = true;
			});
		} else {
			ready = true;
		}
	} );

	// save钩子
	schema.pre('save', function(next){
		let doc = this;
		// 确认是否是新建数据
		if (doc.isNew) {
			// 自动将passwd转换为hash格式
			if (schema.path('passwd')) {
				let factor = (options && options.factor && options.factor === 'number') ? parseInt(options.factor) : 10;
				doc.passwd = common.hashStr(doc.passwd, factor);
			}

			// 自动添加时间相关字段
			doc.createdAt = timeHelper.getFullDateTime();
			doc.updatedAt = timeHelper.getFullDateTime();

			if (shoudAddId(schema, options)) {
				if (options._id === 'uuid') {
					doc._id = uuid.v4();
					next();
				}

				if (doc.hasOwnProperty('_id')) {
					next();
				} else {
					(function save() {
						if (ready) {
							// 从counter中取出自增长id
							IdentityCounter.findOneAndUpdate({ colName: options.colName}, { $inc: { count: 1 } }, { new: true }, function (err, updatedIdentityCounter) {
								if (err) return next(err);
								if (options._id === 'autoId') {
									doc._id = updatedIdentityCounter.count;
								} else {
									doc._id = fillZero(updatedIdentityCounter.count, options.len);
								}
								next();
							});
						}
						// If not ready then set a 5 millisecond timer and try to save again. It will keep doing this until
						// the counter collection is ready.
						else
							setTimeout(save, 5);
					})();
				}
			} else {
				next();
			}
		} else {
			next();
		}
	});

	// update钩子
	schema.pre('update', function () {
		this.update({}, {$set: {updatedAt: timeHelper.getFullDateTime()}});
	});

	// findOneAndUpdate钩子
	schema.pre('findOneAndUpdate', function () {
		this.findOneAndUpdate({}, {$set: {updatedAt: timeHelper.getFullDateTime()}});
	})
};
