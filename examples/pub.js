const {MqClient} = require("../index.js");  

var mq = "MyMQ"
const client = new MqClient("zbus.io");  

function create(mq){
	var msg = { 
		headers:{
			cmd: 'create',
			mq: mq, 
		}
	};
	
    client.invoke(msg).then(res=>{
        console.log(res);
    }); 
}  

function pub(mq) {
    var msg = { 
		headers:{
			cmd: 'pub',
			mq: mq, 
		},
		body: 'hello from js'
	}
    client.invoke(msg).then(res=>{
        console.log(res);
    });
}

client.connect().then(()=>{
    //create(mq); //optional, if created no need to create again
    pub(mq);
});  
 