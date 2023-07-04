class Message { //type of HTTP message, indication
    constructor(){
        this.headers = {};
    }  

    replace(msg){
        for(var m in this) delete this[m];
        for(var m in msg) this[m] = msg[m]; 
    }
} 

export default Message;