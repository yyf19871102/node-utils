const log4js	= require('log4js');

// log4js配置
let config	= {
	appenders   : {
		console : { type: 'console' },  //控制台输出
		file    :{
			type    : 'dateFile',       //文件输出
			filename: 'logs/app.log',   //默认在
			pattern : '.yyyy-MM-dd'
		},
	},
	categories: {
		default     : {appenders: ['console', 'file'], level: 'info'}
	}
};

/**
 * 如果conf是string类型，代表文件输出路径；
 * 如果conf非string类型，代表的是log4js的自定义配置项；
 * @param conf
 * @returns {Logger}
 */
module.exports = function (conf) {
	if (conf) {
		if (typeof conf === 'string') {
			config.appenders.file.filename = conf;
		} else {
			config = conf;
		}
	}

	log4js.configure(config);
	return log4js.getLogger();
};
