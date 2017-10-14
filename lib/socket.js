'use strict';

const WebSocket = require('ws');
const autoBind = require('auto-bind');
const EventEmitter3 = require('eventemitter3');

const timerDuration = 15 * 1000; // Average Heartbeat is approximately 15 seconds

/**
* Socket Class with auto reconnect.
* @param {String} socketUrl The URL for WebSocket to connect to.
* @extends {EventEmitter3}
* @author Henchman
* @constructor
* @private
*/
class Socket extends EventEmitter3 {
    constructor(socketUrl) {
        super();
        autoBind(this);
        this.url = socketUrl;
        this.alive = false;
        this.manualExit = false;
        this.downTimeout = undefined;
        this.connectionAttempts = 0;
        this.reconnectTimeout = undefined;
    }
    connect() {
        clearTimeout(this.downTimeout);
        clearTimeout(this.reconnectTimeout);
        if (this.connection && Object.is(this.connection.readyState, WebSocket.OPEN)) {
            this.connection.close();
        }
        this.connection = new WebSocket(this.url, {
            origin: 'https://plug.dj'
        });

        this.connection.on('open', (data) => {
            this.resetDownTimer();
            this.emit('open', data);
        });
        this.connection.on('close', (data) => {
            if (this.manualExit) {
                clearTimeout(this.downTimeout);
                clearTimeout(this.reconnectTimeout);
            } else {
                this.reconnect();
            }
            this.manualExit = false;
            this.emit('close', data);
        });
        this.connection.on('error', (data) => {
            this.reconnect();
            this.emit('error', data);
        });
        this.connection.on('message', (data) => {
            this.heartbeat();
            this.emit('message', data);
        });
    }
    reconnect() {
        if (Object.is(this.reconnectTimeout, undefined)) {
            clearTimeout(this.downTimeout);
            this.reconnectTimeout = setTimeout(() => {
                this.connect();
            }, 5000);
        }
    }
    heartbeat() {
        this.resetDownTimer();
    }
    resetDownTimer() {
        clearTimeout(this.downTimeout);
        if (Object.is(this.reconnectTimeout, undefined)) {
            this.downTimeout = setTimeout(() => {
                this.reconnect();
            }, timerDuration);
        }
    }
    send(data) {
        this.connection.send(data);
    }
    close(isManualExit) {
        if (isManualExit) {
            this.manualExit = true;
        }

        return this.connection.close();
    }

}

module.exports = Socket;
