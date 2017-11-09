"use strict"
/*拦截处理静态资源请求的中间件*/
const path = require('path');
const fs = require("fs");
//const  {errorReturn} = require('../util');
const util = commonObj.get('util');
var apiConfig = commonObj.get('apiConfig'); 

// URL parser 路径解析
function urlParser(reqPath){
	
	let path = reqPath.replace(apiConfig.url,'.');//去除 /api方便解析url
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
	}
	
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
client.subscribe('dispatcherCallback');
client.on("message",(topic,message)=>{
		if(topic == 'dispatcherCallback'){
			let msg = JSON.parse(message.toString());
			console.log("dispatcherCallback ");
			// let res = reqList.get(msg.req_id);
			// if(res){
				// res.json(msg.data);
				// reqList.delete(msg.req_id);
			// }
			let resolve = reqResolveMap.get(msg.req_id+"_callback");
			
			if(resolve){
				resolve(msg.result);return;
			}
			console.log("can not find resolve api");
			//console.log(msg);
			//console.log(reqResolveMap);
		}
		
})


/* client.publishSync_ =  (topic,message)=>{
	//console.log("set >>>>");
	client.publish(topic,JSON.stringify(message));
	//console.log("set >>>>");
	return new Promise((resolve,reject)=>{
		//console.log("set ......");
		//reqResolveMap.set(message.req_id+"_callback",resolve);
		reqResolveMap.set(message.req_id+"_callback",resolve);
		//resolve({status:-1,msg:'jsjsjsj'});
	});
	
} */
function publishSync (topic,message){
	client.publish(topic,JSON.stringify(message));
	return new Promise((resolve)=>{
		reqResolveMap.set(message.req_id+"_callback",resolve);
		//console.log("set ......");
	})
}


module.exports = async (req,res,next)=>{
	res = setHeader(req,res);
	//console.log(req.headers.origin);
	//console.log(req.protocol);
	//console.log(req);
	let access = getAuth(req);
	if(!access){
		res.json(util.errorReturn({code:500,msg:'unknown request method'}))
		return;
	}
	
	let handler = {
		"User.name.index":{
			access:12,
		}
	}
	let req_info = urlParser(req.path);
	//console.log(req_info);
	//console.log("hshshsh");
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
	message.isinner = false;
	//reqList.set(message.req_id+"_callback",res);
	//console.log(message.req_id+"_callback");
	//client.publish("dispatcher",JSON.stringify(message))
	
	//console.log(client.publishSync);
	//let t = await test();
	//console.log(t);
	console.log('api req');
	let result = await publishSync("dispatcher",message);
	//console.log("set");
	if(result){
		console.log("同步接收到处理的结果");
		console.log(result);
		if(result.status == -1 ){
			res.json({status:result.status,msg:result.msg});
		}
		else
		{
			res.json(result.data);
		}
		
	}/* */
	//next("ok");
	
	
	return;
}