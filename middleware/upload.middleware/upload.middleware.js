/*拦截处理静态资源请求的中间件*/
const path = require('path');
const fs = require("fs");
const multer = require('multer')
//const  {errorReturn} = require('../util');
const util = commonObj.get('util');
var apiConfig = commonObj.get('apiConfig'); 

// URL parser 路径解析
function urlParser(reqPath){
	
	/* let path = reqPath.replace(apiConfig.url,'.');//去除 /api方便解析url
	let arr = path.split('/');
	let res = {}
	if(!arr[1]){
		res.module = apiConfig.default_module;
	}
	else 
	{
		res.module = arr[1];
	}
	
	if(!arr[2]){
		res.model = apiConfig.default_model;
	}
	else 
	{
		res.model = arr[2];
	}
	
	if(!arr[3]){
		res.action = apiConfig.default_action;
	}
	else 
	{
		res.action = arr[3];
	} */
	
	let res = {};
	res.module = reqPath.module;
	res.model = reqPath.model;
	res.action = reqPath.action;
	
	//console.log(arr);r
	return res;
}


// 根据token获取 权限
function getAuth(req){
	if(req.method == 'GET'){
		if(req.query.token){
			return 12
		}
		else
		{
			return 1;
		}
	}
	return null;
}

// 构建请求消息体，将请求而发送到 消息队列中
function createReqMessage(req){
	if(req.method == 'GET'){
		return {
			method:req.method,
			data:req.query,
		}
	}
	else if(req.method == 'POST')
	{
		return {
			method:req.method,
			data:[],
		}
	}
	return null;
}

// header 处理 ，主要用于跨域
function setHeader(req,res){
	if(req.headers.origin){
		res.header('Access-Control-Allow-Origin', req.headers.origin);
	}
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials','true');
	return res;
}


var reqList = new Map();
var  reqResolveMap = new Map();

let client = commonObj.get('mqClient');

client.subscribe('_dispatcherCallback');
client.on("message",(topic,message)=>{
		if(topic == '_dispatcherCallback'){
			let msg = JSON.parse(message.toString());
			console.log("dispatcherCallback_ ");
			// let res = reqList.get(msg.req_id);
			// if(res){
				// res.json(msg.data);
				// reqList.delete(msg.req_id);
			// }
			let resolve = reqResolveMap.get(msg.req_id+"_callback");
			
			if(resolve){
				resolve(msg.result);return;
			}
			console.log("can not find resolve");
		}
})


/* client.publishSync_ = (topic,message)=>{
	client.publish(topic,JSON.stringify(message));

	return new Promise((resolve,reject)=>{
		console.log("set ....");
		reqResolveMap.set(message.req_id+"_callback",resolve);
	});
} */

function publishSync(topic,message){
	client.publish(topic,JSON.stringify(message));

	return new Promise((resolve,reject)=>{
		console.log("set ....");
		reqResolveMap.set(message.req_id+"_callback",resolve);
	});
}


module.exports = async (req,res,next)=>{
	res = setHeader(req,res);
	//console.log(req.headers.origin);
	//console.log(req.protocol);
	//console.log(req);
	
	//console.log(req.path);
	//console.log(req.query);
	//return;
	let req_info = urlParser(req.query);
	if(!req_info.module || !req_info.model || !req_info.action ){
		res.json({code:-1,msg:'请求的参数不完整'});
		return;
	}
	
	
	//let req_info = urlParser(req.path);
	//console.log(req_info);
	// if(!handler[req_info.module+"."+req_info.model+"."+req_info.action]){
		// res.json(util.errorReturn({code:404,msg:'the action is not found'}))
		// return;
	// }
	
	// if(handler[req_info.module+"."+req_info.model+"."+req_info.action].access > access){
		// res.json(util.errorReturn({code:401,msg:'permission denied'}))
		// return;
	// }
	
	
	let message = createReqMessage(req);
	
	if(!message){
		res.json(util.errorReturn({code:500,msg:'parser message error'}))
		return;
	}
	
	message.req_id = util.getRandomString(10);
	message.module = req_info.module;
	message.model = req_info.model;
	message.action = req_info.action;
	message.result = {};
	message.isinner = true;
	//next();return;
	//reqList.set(message.req_id+"_callback",res);
	//console.log(message.req_id+"_callback");
	//client.publish("dispatcher",JSON.stringify(message))
	console.log('请求处理中间件。。。');
	let result = await publishSync("dispatcher",message);
	
	req.uploadInfo = result;
	console.log('请求处理中间件');
	next();return;
	if(result){
		console.log("文件上传中间件处理结果...");
		console.log(result);
		if(result.status == -1 ){
			res.json({status:result.status,msg:result.msg});
		}
		else
		{
			res.json(result.data);
		}
		
	}
	//next("ok");
	
	
	return;
}