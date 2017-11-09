var fs = require("fs");  
var path = require("path"); 

exports.errorReturn = (options)=>{
	return {
		code:options.code,
		msg:options.msg,
	}
}
// 获取随机字符串  len 为字符串的长度
exports.getRandomString = (n)=>{
  //'0','1','2','3','4','5','6','7','8','9',
  var chars = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','v','u','w','z','x','y','_',
  'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  var res = "";
  for(var i = 0; i < n ; i ++) {
      var id = Math.ceil(Math.random()*35);
      res += chars[id];
  }
  //res+="_"+(Math.random().toFixed(5) * 100000);
  res ="str_"+ res;
  return res;
}

//递归创建目录 同步方法  
var mkdirsSync = (dirname)=>{  
    //console.log(dirname);  
    if (fs.existsSync(dirname)) {  
        return true;  
    } else {  
        if (mkdirsSync(path.dirname(dirname))) {  
            fs.mkdirSync(dirname);  
            return true;  
        }  
    }  
}  
exports.mkdirsSync = (dirname)=>{  
    //console.log(dirname);  
    if (fs.existsSync(dirname)) {  
        return true;  
    } else {  
        if (mkdirsSync(path.dirname(dirname))) {  
            fs.mkdirSync(dirname);  
            return true;  
        }  
    }  
}  