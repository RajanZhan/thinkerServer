const middlePath = './middleware';

exports.systemConfig = {
	debug:true,
}

// 公共配置文件
exports.commonConfig = {
	utilPat:''
}

// 静态文件的配置
exports.staticConfig = {
	url:'/static',// 请求的url
	path:'/static',// 静态文件的根目录
	middleware:middlePath+'/static.middleware/static.middleware',// 中间件的位置
	accessExpire:10000,// 静态文件权限脚本的缓存时间
	mime:new Set(['css','js','png','html','svg']),
	systemFileName:new Set(['.access.js']),
}

// 消息队列中间件的配置文件
exports.mqConfig = {
	host:'mqtt://localhost:1884'
}

// api中间件配置文件
exports.apiConfig = {
	url:'/api',
	middleware:middlePath+'/api.middleware/api.middleware',// 中间件的位置
	default_module:'Home',
	default_model:' Index',
	default_action:'index',
}

// socket 消息中间件
exports.socketConfig = {
	middleware:middlePath+'/socket.middleware/socket.middleware',// 中间件的位置
	default_module:'Home',
	default_model:'Index',
	default_action:'index',
}
