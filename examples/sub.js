const{ MqClient } = require('../index.js')

const client = new MqClient("zbus.io");  

var mq = "MyMQ", channel = "MyChannel"; 
function create(mq, channel){ 
    var msg = {};
    msg.headers = {
        cmd: 'create',
        mq: mq,
        channel: channel, 
    }; 

    client.invoke(msg).then(res=>{
        console.log(res);
    }); 
}

function sub(mq, channel){
    var msg = {};
    msg.headers = {
        cmd: 'sub',
        mq: mq,
        channel: channel, 
        window: 1,
    }; 
    client.invoke(msg).then(res=>{ 
        console.log(res); 
    }); 
}  
 
client.addMqHandler(mq, channel, msg=>{ 
    console.log(msg); 
    sub(mq, channel);
});

client.onopen = ()=>{
    create(mq, channel);
    sub(mq, channel);
};

client.connect();