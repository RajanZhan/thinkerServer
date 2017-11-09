const cluster = require("cluster");
const os = require("os");
var workers = new Map();
//console.log(os.cpus());

function start(fn){

	if (cluster.isMaster) {
		//console.log("master ");
		let cpus = os.cpus();
		for(let i = 0; i < cpus.length; i++){
			let worker = cluster.fork();
			workers.set(worker.id,worker);
		}
		
		let worker = cluster.fork();
		cluster.on('online', function(worker) {
			//fn(opcda_obj,worker.process.pid);
			//console.log('Worker ' + worker.process.pid + ' is online');
		});
		worker.on("message",(msg)=>{
			//console.log(msg);
			// if(msg.type == 'opcda init finished'){
			// 	console.log(opcda_obj);
			// }
		})
	
		cluster.on('exit', function(worker, code, signal) {
			console.log("子进程退出" + worker.id);
		});
	} 
	else
	{
		//opcda_obj = opcda.init();
		// fn(opcda_obj);
		// opcda_obj.on("systemError",()=>{
			// console.log("监听到系统错误,本次系统强制重启");
			// process.exit(0);
		// })
		console.log("fork 进程");
		setTimeout(()=>{
			 process.exit(0);
		},10*1000)
	}
}


module.exports = {
	init(fn){
		start(fn);
	},
}