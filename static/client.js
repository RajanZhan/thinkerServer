class Client {
	
	/***内部属性***/
	//_uploadFiles:[];
	
	constructor(){
		var _this = this;
		if((typeof(io) == "undefined") ||(typeof($) == "undefined")){
			throw "please include socket.io.js and jquery.js";
		}
		
		if((typeof(sessionStorage) == "undefined")){
			throw "your browser is not support sessionStorage,mybe you should  change one. ";
		}
	};
	
	/***内部方法 start**/
	
	// 获取当前客户端的id
	_getClientId(){
		return sessionStorage.getItem("client_id");
	};
	
	// 设置当前客户端的id
	_setClientId(client_id){
		sessionStorage.setItem("client_id",client_id);
	};
	
	// 更新当前的状态
	_setStatus(data){
		this.status = {
			network:data.network,
			oauth:data.oauth,// 授权状态
		}
	}
	
	// 构建发送请求的消息
	_constructMsgForSending(namespace,data){
		return {
			namespace:namespace,
			data:data,
			client_id:this._getClientId(),
		}
	};
	
	/***内部方法 end**/
	
	// 初始化方法，初始化网络连接，返回的是promise对象
	init(host){
		
		var _this = this;
		
		return new Promise((resolve,reject)=>{
			host = host?host:'/';
			var socket = io.connect(host);
			var client_id = this. _getClientId();
			var _this = this;
			socket.on('connected',function(data){
				
				// 初始化客户端的连接
				socket.emit("clientInit",{client_id:client_id},(data)=>{
					_this._setClientId(data.client_id);
					_this._setStatus(data);
					_this.socket = socket;
					resolve(_this);
				});
			});
			socket.on('message',function(data){
				//console.log("get msg");
				_this.onSocketMessage(data.namespace,data.data);
			});
			socket.on('heart',function(data,fn){
				fn();
				_this.onHeart(data);
			});
		});
	};
	
	
	// 进行授权
	oauth(key,secret){
		
	};
	
	// 获取当前客户端的状态，例如是否已经授权，当前的网络状态等等，
	getStatus(){
		return this.status;
	};
	
	// 发送get请求
	sendGet(namespace,data){
		
	};
	
	// 发送post请求
	sendPost(namespace,data){
		
	};
	
	// 发送put请求
	sendPut(namespace,data){
		
	};
	
	// 发送delete请求
	sendDelete(namespace,data){
		
	};
	
	// 发送 socket请求
	sendSocket(namespace,data){
		var _this = this;
		return new Promise((resolve)=>{
			this.socket.emit("clientToServerMessage",_this._constructMsgForSending(namespace,data),(data)=>{
				resolve(data);
			});
		})
	};
	
	// 添加上传的文件
	addUploadFile(){
		
		var _this = this;
		
		// 缓存待上传的文件以及上传的状态
		if(typeof(this.uploadStatus) == "undefined"){
			this.uploadStatus = false;//表示可以上传
		}
		
		
		return new Promise((resolve)=>{
			
			if(_this.uploadStatus)
			{
				resolve(false);
				console.log("文件正在上传，请稍后再试......");
				return ;
			}
			
			let form = $("#_uploadForm");
			//console.log(form.length);
			if(form.length <= 0){
				form = $(`<form style="display:none" id="_uploadForm" enctype="multipart/form-data"></form>`);
				$('body').append(form);
				form = $("#_uploadForm");
			}
			
			// 生成随机的id
			function randomStr(len){
				len = len || 1;
				var $chars = 'abcdefgAB_CD_EFGHIJKLMNOPQRSTUVWXYZ';
				var maxPos = $chars.length;
				var pwd = '';
				for (let i = 0; i < len; i++) {
					pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
				}
				return pwd;
			}
			
			let inputId = randomStr(10);
			form.append(`<input class="upload_input" id="`+inputId+`" type="file" name="file">`);
			let inputDom = $("#_uploadForm #"+inputId)
			inputDom.click();
			inputDom.change(function(){
				resolve($(this).val());
			})
		});
		
	};
	
	
	// 开始文件上传处理
	 upload(url,options){
		var _this = this;
		return new Promise((resolve)=>{
			(async ()=>{
				
				if(_this.uploadStatus)
				{
					console.log("文件正在上传，请稍后再试......");
					resolve(true);
					return ;
				}
				
				if(url){
			
				var currentFile = null;
				
				// 处理进度
				var progressHandlingFunction = (e)=>{
					if (e.lengthComputable) {
						var percent = e.loaded/e.total*100;
						//console.log(percent);
						if(options.progress != "undefined"){
							options.progress({file:currentFile,percent:percent.toFixed(0)});
						}
					}
				}
				
				var _upload = (file_index)=>{
					return new Promise((resolve)=>{
						$.ajax({
							//url:"/upload"+url,
							url:"/upload?module=Home&model=Index&action=upload",
							type: 'POST',
							cache: false,
							data: new FormData($('#_uploadForm')[file_index]),
							//data: new FormData(file),
							processData: false,
							contentType: false,
							dataType:"json",
							beforeSend: function(){
								//uploading = true;
							},
							success: function(data) {
							//console.log("上传成功");
								//console.log(data);
							  resolve(data);
							},
							xhr: function(){
								var myXhr = $.ajaxSettings.xhr();
								if(myXhr.upload){ //检查upload属性是否存在
								//绑定progress事件的回调函数
								myXhr.upload.addEventListener('progress',progressHandlingFunction, false);
								}
								return myXhr; //xhr对象返回给jQuery使用
								//console.log(xhr);
							 }
						});
					});
					
				}
				
				let files = $(".upload_input");
				//console.log(files.length);
				//console.log(files);
				//return;
				//resolve();;
				//console.log(files);return ;
				for(let index in files){
					 let file = files[index];
					//console.log($('#_uploadForm')[0]);
					if(file.className == "upload_input"){
						
						currentFile = file.value;
						_this.uploadStatus = true;// 正在上传
						let res = await _upload(index);
						if(options.completeOne !="undefined"){
							if(typeof(_this.uploadedFiles) == "undefined")
							{
								console.log('unddd');
								_this.uploadedFiles = [];
							}
							_this.uploadedFiles.push({file:currentFile,data:res});
							options.completeOne({file:currentFile,data:res});
							file.remove();
						}
						if(index == (files.length - 1)){
							_this.uploadStatus = false;
							resolve(_this.uploadedFiles);
							_this.uploadedFiles = [];
						}
					}
				}
		     }
				
			})()
			
		});
		
	};
	
	// 获取等待上传的文件
	getUploadFiles(){
		
	};
	
	// 删除某个待上传的文件
	deleteUploadFiles(){
		
	};
	
	
	// 监听到服务器端的socket 数据推送，
	onSocketMessage(namespace,data){
		
	}
	
	// 心跳回调
	onHeart(data){
		//console.log("on heart check "+data);
	};
}