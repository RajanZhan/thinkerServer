(async ()=>{

const express = require('express')
const path = require('path')
const app = express()
const http = require("http")
const multer = require('multer')
const bodyParser = require('body-parser');
const fs = require('fs');
const dispather = require("./middleware/dispatch.middleware/dispatch.middle.js");
const {staticConfig,mqConfig,apiConfig,socketConfig,systemConfig} = require("./config.js");// 载入配置文件
const port = 81;

var socketClientMap = new Map();//缓存长连接客户端的map

global.commonObj = new Map();// 全局缓存对象

// 缓存静态中间件的配置文件
commonObj.set("staticConfig",staticConfig);
commonObj.set("apiConfig",apiConfig);
commonObj.set("socketConfig",socketConfig);
commonObj.set("systemConfig",systemConfig);

// 缓存公共方法
const util =  require('./util');
const {mkdirsSync} =  require('./util');
commonObj.set("util",util);


// 连接消息队列中间件
/* let client = await (()=>{
	return new Promise((resolve)=>{
		var mqtt  = require('mqtt');
		var client  = mqtt.connect(mqConfig.host);
		client.on('connect', function () {
			console.log('mq server  is connected.....');
			resolve(client);
		});
	});
})()
commonObj.set("mqClient",client);
 */

// 分发器启动
dispather.init();

 

app.use(bodyParser.json());

// 测试中间件
app.use((req,res,next)=>{
	//console.log(req);
	next();
})




// 拦截静态文件的请求
var staticMiddleware = require(staticConfig.middleware);
app.use(staticConfig.url,(req,res,next)=>{
	staticMiddleware(req,res,next);
})
app.use(staticConfig.url,express.static(path.join(__dirname, staticConfig.path)))


// 拦截http API 请求
/* var apiMiddleware = require(apiConfig.middleware);
app.use(apiConfig.url,(req,res,next)=>{
	apiMiddleware(req,res,next)
}) */


 var storage = multer.diskStorage({
  destination: function (req, file, cb) {
	req.tmpPath = 'runtime/fileUploadTmp/';
    cb(null,req.tmpPath)
	
  },
  filename: function (req, file, cb) { 
	req.tmpFileName = file.fieldname+Math.random() + '.cc';
    cb(null,req.tmpFileName );
  }
})

function fileFilter (req, file, cb) {
	// 文件上传过滤 mime类型，文件大小，等等
	// 需要调用回调函数 `cb`，
	// 并在第二个参数中传入一个布尔值，用于指示文件是否可接受
	// 如果要拒绝文件，上传则传入 `false`。如:
	//cb(null, false)
	//console.log(req);
	// 如果接受上传文件，则传入 `true`。如:
	//console.log(req.uploadInfo);
	//console.log(req.headers);
	//console.log(file);
	//cb(null, true);

	// 文件类型检测
	if(req.uploadInfo.data.mimeType != "*")
	{
		if(req.uploadInfo.data.mimeType.indexOf(file.mimetype) == -1)
		{
			//console.log(req.uploadInfo.data.mimeType);
			//console.log(file.mimetype);
			console.log("文件类型不支持");
			req.uploadErrror = "文件类型不支持";
			cb(null, false);
			return;
		}
	}
	
	// 文件大小的检测
	if(req.uploadInfo.data.maxSize != "0")
	{
		if(Number(req.uploadInfo.data.maxSize) < Number(req.headers['content-length']))
		{
			console.log("文件太大无法上传");
			req.uploadErrror = "文件太大无法上传";
			cb(null, false);
			return;
		}
	}
	cb(null, true);
	
	
	// 出错后，可以在第一个参数中传入一个错误：
	//cb(new Error('I don\'t have a clue!'))
}

var upload = multer({ storage,fileFilter });

// 文件上传模块
/* var uploadMiddleware = require("./middleware/upload.middleware/upload.middleware");
app.use("/upload",(req,res,next)=>{
	uploadMiddleware(req,res,next);
},upload.array('file', 12),
function (req, res, next) {
// req.files 是 `photos` 文件数组
// req.body 对象中是表单中提交的文本字段(如果有)
console.log("post upload");
//console.log(req);
if(req.files.length == 0)
{
	res.json({code:0,msg:req.uploadErrror});
}
else
{
	let data = req.files[0];
	delete data.destination;
	data.path = req.uploadInfo.data.path+"/"+req.tmpFileName;
	//移动文件
	if(!fs.existsSync('./'+req.uploadInfo.data.path))
	{
		mkdirsSync('./'+req.uploadInfo.data.path);
	}
	fs.renameSync('./'+req.tmpPath+req.tmpFileName,"./"+data.path);
	//console.log(req.files);
	res.json({code:1,msg:'upload ok',data:data});
	
}
});  */


// 404
app.use("/denied",(req,res,next)=>{
	res.json({code:401,msg:"access denied"});
});
app.use("*",(req,res,next)=>{
	res.json({code:404,msg:"NOT FOUND"});
});


var server  = http.createServer(app);
server.listen(port, () => {
  console.log(`App listening at port ${port}`)
})

// socket请求的模块
/* let socketModule = require(socketConfig.middleware);
	socketModule(server,socketClientMap); */
})()

