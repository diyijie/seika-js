import WebSocket from 'isomorphic-ws'; 
import { logger } from './Logger';
import { signMessage, uuid } from './Kit'; 

export class Ticket { //message matching ticket
    constructor(msg, resolve) {
        this.id = uuid();
        if(!msg.headers) msg.headers = {};
        msg.headers.id = this.id;
        this.request = msg;
        this.response = null;

        this.resolve = resolve;
    }
}


export default class WebsocketClient {
    constructor(address) {
        if (!address.startsWith("ws://") && !address.startsWith("wss://")) {
            address = "ws://" + address;
        }
        this.address = address;
        this.socket = null;
        this.heartbeatInterval = 30000;
        this.ticketTable = {};
        this.connectPromise = null;
        this.autoReconnect = true;
        this.reconnectInterval = 3000;

        this.authEnabled = false;
        this.apiKey = "";
        this.secretKey = "";
        this.signFields = "url,method,body,h.*";

        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;

        this.beforeSend = null; 

        this.heartbeator = null;
        this.heartbeatMessage = null;
        this.heartbeatInterval = 30 * 1000; //30 seconds
    }

    enableAuth(apiKey, secretKey, authEnabled=true){
        this.authEnabled = authEnabled;
        this.apiKey = apiKey;
        this.secretKey = secretKey;
    } 

    connect() {
        if (this.socket != null && this.connectPromise != null) {
            return this.connectPromise;
        }

        logger.debug("Trying to connect to " + this.address);

        var connectSuccess;
        var connectFailure;
        this.connectPromise = new Promise((resolve, reject) => {
            connectSuccess = resolve;
            connectFailure = reject;
        });

        try {
            this.socket = new WebSocket(this.address);
        } catch (e) {
            connectFailure(e);
            return this.connectPromise;
        }

        var client = this;
        this.socket.onopen = function (event) {
            logger.debug("Connected to " + client.address);
            if (connectSuccess) {
                connectSuccess();
            }
            if (client.onopen) {
                client.onopen(client);
            }
            if (client.heartbeatMessage != null) {
                client.heartbeator = setInterval(function () {
                    try { client.send(client.heartbeatMessage); } catch (e) { logger.warn(e); }
                }, client.heartbeatInterval);
            }
        };

        this.socket.onclose = function (event) {
            client.connectPromise = null;
            clearInterval(client.heartbeat);
            if (client.onclose) {
                client.onclose();
            }
            if (client.autoReconnect) {
                client.connectTrying = setTimeout(function () {
                    try { client.connect(); } catch (e) { }//ignore
                }, client.reconnectInterval);
            }
        };

        this.socket.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            var msgid = null;
            if(msg.headers) {
                msgid = msg.headers.id;
            } 
            var ticket = client.ticketTable[msgid];
            if (ticket) {
                ticket.response = msg;
                if (ticket.resolve) {
                    ticket.resolve(msg);
                    delete client.ticketTable[msgid];
                }
            } else if (client.onmessage) {
                client.onmessage(msg);
            }
        }

        this.socket.onerror = function (data) {
            logger.error("Error: " + data);
        }
        return this.connectPromise;
    }

    close () {
        this.connectPromise = null;
        clearInterval(this.heartbeat);
        if (this.connectTrying) {
            clearTimeout(this.connectTrying);
        }
        this.socket.onclose = function () { }
        this.autoReconnect = false;
        this.socket.close();
        this.socket = null;
    }

    active() {
        return this.socket && this.socket.readyState == WebSocket.OPEN;
    }

    send (msg, beforeSend) { 
        if(!beforeSend) {
            beforeSend = this.beforeSend;
        }
        if (beforeSend != null) {
            beforeSend(msg);
        }
        if(this.authEnabled){
            msg.headers.signFields = this.signFields;
            signMessage(this.apiKey, this.secretKey, msg);
        }
        var data = JSON.stringify(msg);
        this.socket.send(data);
    }

    invoke (msg, beforeSend) {
        var client = this;
        var ticket = new Ticket(msg);
        this.ticketTable[ticket.id] = ticket;

        var promise = new Promise((resolve, reject) => {
            if (!client.active()) {
                reject(new Error("socket is not open, invalid"));
                return;
            }
            ticket.resolve = resolve;
            if (ticket.response) {
                ticket.resolve(ticket.reponse);
                delete this.ticketTable[ticket.id];
            }
        });

        this.send(msg, beforeSend);
        return promise;
    }
}