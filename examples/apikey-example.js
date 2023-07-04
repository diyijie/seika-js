const {RpcClient} = require("../index.js");  

async function test(){
	const api = new RpcClient("localhost:15555");     
	api.apiKey = "2ba912a8-4a8d-49d2-1a22-198fd285cb06";
	api.secretKey = "461277322-943d-4b2f-b9b6-3f860d746ffd";
	api.signFields = "url,method,body";
	api.authEnabled = true;

	api.example.plus(1,2).then(res=>{
		console.log(res); 
	});
}

test();