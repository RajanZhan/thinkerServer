const io = require("socket.io");
const socketConfig = commonObj.get("socketConfig");
module.exports = (server,socketClientMap)=>{

var socket = io.listen(server); 

var util =  commonObj.get("util");

var reqResolveMap = new Map();

let mq = commonObj.get('mqClient');
mq.subscribe('dispatcherSocketCallback');
mq.subscribe('sendMessageToSocketClientFromWorker');// 监听来自worker的异步消息
mq.on("message",(topic,message)=>{
		var  msg = JSON.parse(message.toString());
		if(topic == 'dispatcherSocketCallback'){
			
			console.log("dispatcherSocketCallback ");
			// let res = reqList.get(msg.req_id);
			// if(res){
				// res.json(msg.data);
				// reqList.delete(msg.req_id);
			// }
			let resolve = reqResolveMap.get(msg.req_id+"_callback");
			
			if(resolve){
				resolve(msg.result);return;
			}
			console.log("can not find socket  resolve");
			//console.log(msg.req_id);
			//console.log(reqResolveMap);
		}
		else if(topic == "sendMessageToSocketClientFromWorker"){
			//console.log("sendMessageToSocketClientFromWorker");
			//console.log(msg);
			if(!msg.client_id){
				return;
			}
			// 获取客户端，
			let client = socketClientMap.get(msg.client_id);
			if(!client){
				return;
			}
			client.emit("message",msg.msg);
			//console.log("send msg");
		}
		
})

mq.publishSync = (topic,message)=>{
	mq.publish(topic,JSON.stringify(message));
	return new Promise((resolve,reject)=>{
		reqResolveMap.set(message.req_id+"_callback",resolve);
	});
}


// 构建请求消息体，将请求而发送到 消息队列中
function createReqMessage(data){
	
	if(!data.namespace ){
		return null;
	}
	//console.log(data);
	let parserNameSpace = data.namespace.split("/");
	//console.log(parserNameSpace);
	return {
			method:"socket",
			data:data,
			req_id :util.getRandomString(10),
		    module : parserNameSpace[0]?parserNameSpace[0]:socketConfig.module,
	        model :  parserNameSpace[1]?parserNameSpace[1]:socketConfig.model,
	        action : parserNameSpace[2]?parserNameSpace[2]:socketConfig.action,
	        result : {},
			client_id:data.client_id,
	}
}



socket.on("connection",function(client){
	
	console.log("client is connected");
	
	client.emit("connected");
	
	// 客户端的初始化
	client.on("clientInit",function(data,fn){
		
		let client_id = null;
		let need_update_client_in_map = false;
		// 检测客户端的id
		if(!data.client_id){
			need_update_client_in_map = true;
		}
		else
		{
			if(!socketClientMap.get(data.client_id)){
				
				need_update_client_in_map = true;
			}
			client_id = data.client_id;
		}
		
		//初始化客户端的授权信息
		let oauth = false;
		client.oauth = oauth;
		
		if(need_update_client_in_map){
			console.log("update client");
			client_id = util.getRandomString(32);
		}
		
		client.client_id = client_id;
		socketClientMap.set(client_id,client);
		fn({client_id:client_id,network:true,oauth:oauth});
		console.log('client init');
	});
	
	
	
	
	// 监听客户端的业务请求
	client.on("clientToServerMessage",async (data,fn)=>{
		if(data.namespace == "test"){
			fn({data:'test msg from server'});
			return;
		}
		let msg = createReqMessage(data);
		if(!msg){
			fn({status:-1,msg:'construct req message failed'});
			return;
		};
		//console.log(msg.req_id);
		let result  = await mq.publishSync("dispatcher",msg);
		if(result.status == -1){
			fn(result);
		}
		else{
			fn(result.data);
		}
		
	})
	

	client.on("error",()=>{
		console.log();
	});
	
	// 客户端的连接断开处理
	client.on("disconnect",()=>{
		console.log('disconnect');
		delete client;
		//socketClientMap.delete(client.client_id);
		//console.log(socketClientMap);
	});
	
	
});

// 心跳统一处理
setInterval(()=>{
	//console.log("check heart");
	for(let client_id of socketClientMap.keys()){
		let client = socketClientMap.get(client_id);
		if(client){
			client.emit("heart",{str:util.getRandomString(5)},()=>{
				//console.log("heart");
				client.update_time =  new Date().getTime();
				socketClientMap.set(client_id,client);
			});
			//console.log("send heart");
		}
		else {
			console.log("heart client is not found");
		}
	}		
},5000)

// 清除已经挂断的客户端
setInterval(()=>{
	let current_time = new Date().getTime();
	let timeout = 1000 * 30;// 十秒
	for(let client_id of socketClientMap.keys()){
		let client = socketClientMap.get(client_id);
		if(client){
			if(typeof(client.update_time) == "undefined"){
				continue;
			}
			if((current_time - client.update_time) > timeout){
				//console.log("timeout "+client_id);
				socketClientMap.delete(client_id)
			}
		}
	}		
},10000)
}