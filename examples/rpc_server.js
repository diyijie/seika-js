const { RpcProcessor, RpcServer, Message, Protocol } = require("../index.js"); 

class MyService{
	plus(a, b) {
		return parseInt(a) + parseInt(b);
	} 
	echo(value) {
		return value;
	}  
	testEncoding() {
		return "中文";
	} 
	stringArray() {
		return ["hong", "leiming"];
	} 
	getBin() {
		return new Uint8Array(10);
	}  

	getOrder(){
		return {name: 'orderName', age: 28};
	} 

	html(){
		var res = new Message();
		res.status= 200;
		res.headers['content-type'] = 'text/html; charset=utf8';
		res.body = "<h1>hello html body</h1>"
		return res;
	} 
}      

function home(){
	var res = new Message();
	res.status= 200;
	res.headers['content-type'] = 'text/html; charset=utf8';
	res.body = "<h1>JS home page</h1>"
	return res;
}

var p = new RpcProcessor(); 
p.mount("/example", new MyService());
p.mount("/", home);

//RPC via MQ
var server = new RpcServer(p);
server.mqServerAddress = "zbus.io"; 
server.mq = "/";  
server.mqMask = Protocol.MASK_DELETE_ON_EXIT;
//server.enableAuth("2ba912a8-4a8d-49d2-1a22-198fd285cb06", "461277322-943d-4b2f-b9b6-3f860d746ffd"); //apiKey + secretKey 
server.start();

