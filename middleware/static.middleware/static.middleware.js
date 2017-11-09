/*拦截处理静态资源请求的中间件*/
const path = require('path');
const fs = require("fs");
//const    {errorReturn} = require('../util');
const   util= commonObj.get('util');
var staticConfig = commonObj.get('staticConfig'); 

const systemConfig = commonObj.get("systemConfig");

// 获取文件的路径
function getFilePath(reqPath){
	let index = reqPath.lastIndexOf('/');
	return reqPath.slice(0,index+1);
}

// 获取文件名
function getFileName(reqPath)
{
	let index = reqPath.lastIndexOf('/');
	return reqPath.slice(index+1);
}

// 获取文件扩展名
function getFileExtendName(reqPath)
{
	let index = reqPath.lastIndexOf('/');
	let fileName = reqPath.slice(index+1);
	return fileName.slice(fileName.lastIndexOf('.')+1);
}

//检测请问的文件夹下面是否存在.access.js 文件



module.exports = async (req,res,next)=>{
	if(systemConfig.debug){
		console.log("staticConfig  request");
	}
	let fileName = getFileName(req.path);
	if(!fileName){
		res.json(util.errorReturn({code:404,msg:"File not found"}));
		return;
	}
	if(staticConfig.systemFileName.has(fileName)){
		res.json(util.errorReturn({code:401,msg:"The file name is Illega"}));
		return;
	}
	//mime类型检测
	if(!staticConfig.mime.has(getFileExtendName(req.path)))
	{
		res.json(util.errorReturn({code:401,msg:"file type denied"}));
		return;
	}
	// 生成完整的路径，并且检测该路径下是否存在 .access.js
	// 如果存在，加载，调用access方法
	let filePath = path.join(__dirname,'../../',staticConfig.path,getFilePath(req.path)).replace(/\\/g,'/');
	let accessPath = filePath+".access.js";
	//console.log(accessPath);
	if(fs.existsSync(accessPath)){
		
		let access = require(accessPath);
		if(systemConfig.debug){
			
			delete require.cache[require.resolve(accessPath)];// 缓存的管理
		}
		let acessRes = await access(req);
		if(!acessRes){
			res.json(util.errorReturn({code:401,msg:"access denied"}));
			return;
		} 
	}
	
	
	next();
}