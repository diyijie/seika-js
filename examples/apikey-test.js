const {RpcClient} = require("../index.js");  

async function test(){
	//const rpc = new RpcClient("localhost:15555");  
	const rpc = new RpcClient("localhost:8080");  
	rpc.enableAuth("2ba912a8-4a8d-49d2-1a22-198fd285cb06", "461277322-943d-4b2f-b9b6-3f860d746ffd"); //apiKey + secretKey  

	rpc.admin.tables('mysql').then(res=>{
		console.log(res); 
	});
}

test();