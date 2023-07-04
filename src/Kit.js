
import jsSHA from 'jssha';
import stringify from 'json-stable-stringify'; 

String.prototype.format = function (...args) {
    args = args || [];
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
}

export const uuid = () => {
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}; 

/**
 * 
 * @param {*} apiKey 
 * @param {*} secretKey 
 * @param { json format{url: xx, method: 'POST|GET', headers:{}, body:xxx} } msg 
 * @param {*} signFields 
 */
export const calcSignature = (apiKey, secretKey, msg, signFields) => {   
    if(!signFields) signFields = "url,method,body,h.*";
    let json = {headers: {}}
    json.headers.apiKey = apiKey; 
    if(signFields)
        json.headers.signFields = signFields;   

    for(var f of signFields.split(',')){
        if(f.startsWith('h.') && msg.headers){
            var key = f.substr(2);
            if(key == '*'){
                for(var hkey in msg.headers){
                    json.headers[hkey] = msg.headers[hkey];
                }
            } else {
                json.headers[key] = msg.headers[key];
            }
        } else {
            if(f in msg){
                json[f] = msg[f];
            }
        }
    }   

    const data = stringify(json); 
    var shaObj = new jsSHA("SHA-256", "TEXT");
    shaObj.setHMACKey(secretKey, "TEXT");
    shaObj.update(data);
    var hash = shaObj.getHMAC("HEX");  
    return hash;
};

export const signHttpRequest = (method, url, headers, body, apiKey, secretKey, signFields) => { 
    var msg = {url: url, headers: {}, body: body};
    if(method) msg.method = method; 

    for(var key in headers) msg.headers[key] = headers[key];

    const sign = calcSignature(apiKey, secretKey, msg, signFields);

    headers.apiKey = apiKey;
    if(signFields) headers.signFields = signFields;
    headers.signature = sign;
};

export const signMessage = (apiKey, secretKey, msg) => {  
    signHttpRequest(msg.method, msg.url, msg.headers, msg.body, apiKey, secretKey, msg.headers.signFields); 
}; 

export const joinPath = (...args) => {
    args = args || [];
    let path = args.join("/")
    path = path.replace(/[//]+/g, "/");
    if(path.length > 1 && path.endsWith("/")){
        path = path.substr(0, path.length-1);
    }
    return path;
};

export const reply = (res, status, message) => {
    res.status = status;
    res.headers['Content-Type'] = "text/plain; charset=utf8";
    res.body = message;
};
    
export const RpcInfoTemplate = `
<html><head>
<meta http-equiv="Content-type" content="text/html; charset=utf-8">
<title>{0} JS</title>
{1}

<script>  
var rpc; 
function init(){
	rpc = new RpcClient(null,"{0}"); 
} 
<\/script> 
<script async src="https://unpkg.com/zbus/zbus.min.js" onload="init()"><\/script>

</head>

<div> 
<table class="table">
<thead>
<tr class="table-info"> 
    <th class="urlPath">URL Path</th>
    <th class="returnType">Return Type</th>
    <th class="methodParams">Method and Params</th> 
</tr>
<thead>
<tbody>
{2}
</tbody>
</table> </div> </body></html>
`;

export const RpcStyleTemplate = `
<style type="text/css">
body {
    font-family: -apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #292b2c;
    background-color: #fff;
    margin: 0px;
    padding: 0px;
}
table {  background-color: transparent;  display: table; border-collapse: separate;  border-color: grey; }
.table { width: 100%; max-width: 100%;  margin-bottom: 1rem; }
.table th {  height: 30px; }
.table td, .table th {    border-bottom: 1px solid #eceeef;   text-align: left; padding-left: 16px;} 
th.urlPath {  width: 10%; }
th.returnType {  width: 10%; }
th.methodParams {   width: 80%; } 
td.returnType { text-align: right; }
thead { display: table-header-group; vertical-align: middle; border-color: inherit;}
tbody { display: table-row-group; vertical-align: middle; border-color: inherit;}
tr { display: table-row;  vertical-align: inherit; border-color: inherit; }
.table-info, .table-info>td, .table-info>th { background-color: #dff0d8; }
.url { margin: 4px 0; padding-left: 16px;}
</style>
`;

export const RpcMethodTemplate = `
<tr> 
    <td class="urlPath"><a href="{0}">{0}</a></td>
    <td class="returnType"></td>
    <td class="methodParams">
        <code><strong><a href="{0}">{1}</a></strong>({2})</code>
    </td> 
</tr>
`;