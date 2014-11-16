// Node.JS Core Modules
var net, http, util, zlib, path, fs;
net = require('net');
http = require('http');
util = require('util');
zlib = require('zlib');
path = require('path');
fs = require('fs');

// Third-party modules
var EventEmitter2, EventEmitter, request, WebSocket, encoder, chalk;
EventEmitter2 = require('eventemitter2').EventEmitter2;
EventEmitter = new EventEmitter2({
    wildcard: true,
    delimiter: ':'
});
request = require('request');
WebSocket = require('ws');
WebSocket.prototype._send = WebSocket.prototype.send;
WebSocket.prototype.send = function(data, options, cb) {
    data = '"' + (typeof data === 'string' ? data : JSON.stringify(data)).split('"').join('\\"') + '"';
    this._send(data, options, cb);
};
WebSocket.prototype.sendEvent = function(type, data) {
    this.send({
        a: type,
        p: data,
        t: DateUtilities.getServerEpoch()
    });
};
encoder = require('node-html-encoder').Encoder('entity');
chalk = require('chalk');

// plugAPI
/**
 * Room class
 * @type {Room|exports}
 */
var Room = require('./room');

/**
 * CookieHandler class
 * @type {CookieHandler|exports}
 */
var CookieHandler = require('./cookie');

/**
 * Logger class
 * @type {Logger|exports}
 */
var Logger = require('./logger');

/**
 * Package.json of plugAPI
 * @type {exports}
 */
var PlugAPIInfo = require('../package.json');

/**
 * REST Endpoints
 * @type {{CHAT_DELETE: string, MODERATE_ADD_DJ: string, MODERATE_BAN: string, MODERATE_BOOTH: string, MODERATE_MOVE_DJ: string, MODERATE_MUTE: string, MODERATE_PERMISSIONS: string, MODERATE_REMOVE_DJ: string, MODERATE_SKIP: string, MODERATE_UNBAN: string, MODERATE_UNMUTE: string, PLAYLIST: string, ROOM_CYCLE_BOOTH: string, ROOM_INFO: string, ROOM_LOCK_BOOTH: string, USER_SET_AVATAR: string, USER_SET_STATUS: string, USER_GET_AVATARS: string}}
 */
var endpoints = {
    CHAT_DELETE: 'chat/',
    MODERATE_ADD_DJ: 'booth/add',
    MODERATE_BAN: 'bans/add',
    MODERATE_BOOTH: 'booth',
    MODERATE_MOVE_DJ: 'booth/move',
    MODERATE_MUTE: 'mutes',
    MODERATE_PERMISSIONS: 'staff/update',
    MODERATE_REMOVE_DJ: 'booth/remove/',
    MODERATE_SKIP: 'booth/skip',
    MODERATE_UNBAN: 'bans/',
    MODERATE_UNMUTE: 'mutes/',
    PLAYLIST: 'playlists',
    ROOM_CYCLE_BOOTH: 'booth/cycle',
    ROOM_INFO: 'rooms/update',
    ROOM_LOCK_BOOTH: 'booth/lock',
    USER_SET_AVATAR: 'users/avatar',
    USER_SET_STATUS: 'users/status',
    USER_GET_AVATARS: "store/inventory/avatars"
};

/**
 * That is this and this is that
 * @type {PlugAPI}
 */
var that = null;

/**
 * @type {null|WebSocket}
 */
var ws = null;
/**
 * Instance of room
 * @type {Room}
 */
var room = new Room();

/**
 * Is everything initialized?
 * @type {Boolean}
 */
var initialized = false;

/**
 * Prefix that defines if a message is a command
 * @type {String}
 */
var commandPrefix = '!';

/**
 * Auth code for plug.DJ
 * @type {null|String}
 * @private
 */
var _authCode = null;

/**
 * Cookie handler
 * @type {CookieHandler}
 * @private
 */
var _cookies = new CookieHandler();

/**
 * List over chat history
 * Contains up to 512 messages
 * @type {Array}
 */
var chatHistory = [];

/**
 * Contains informations about requests sent to server
 * @type {{queue: Array, sent: Number, limit: Number, running: Boolean}}
 */
var serverRequests = {
    queue: [],
    sent: 0,
    limit: 10,
    running: false
};

/**
 * Slug of room, that the bot is currently connecting to
 * @type {null|String}
 */
var connectingRoomSlug = null;

/**
 * The logger of plugAPI
 * @type {Logger}
 */
var logger = new Logger('plugAPI');

/**
 * Current delay between chat messages
 * @type {number}
 */
var floodProtectionDelay = 200;

/**
 * Queue of outgoing chat messages
 * @type {Array}
 */
var chatQueue = [];

/**
 * Authentication information (e-mail and password)
 * THIS MUST NEVER BE ACCESSIBLE NOR PRINTING OUT TO CONSOLE
 * @type {Object}
 */
var authenticationInfo;

function __bind(fn, me) {
    return function() {
        return fn.apply(me, arguments);
    };
}

(function() {
    /**
     * Send the next chat message in queue
     */
    function sendNextMessage() {
        if (chatQueue.length > 0) {
            var nextMessage = chatQueue.shift(), msg = nextMessage.msg, timeout = nextMessage.timeout;
            ws.sendEvent('chat', msg);
            if (timeout !== undefined && !isNaN(timeout) && ~~timeout > 0) {
                var specificChatDeleter = function(data) {
                    if (data.raw.uid == room.getSelf().id && data.message.trim() == msg.trim()) {
                        setTimeout(function() {
                            that.moderateDeleteChat(data.raw.cid);
                        }, ~~timeout * 1E3);
                        that.off('chat', specificChatDeleter);
                    }
                };
                that.on('chat', specificChatDeleter);
            }
        }
        setTimeout(function() {
            sendNextMessage();
        }, floodProtectionDelay);
    }

    sendNextMessage();
})();

/**
 * Queue chat message
 * @param {String} msg Chat message
 * @param {Number} [timeout] Timeout before auto deleting message (in seconds)
 */
function queueChat(msg, timeout) {
    chatQueue.push({
        msg: msg,
        timeout: timeout
    });
}

//noinspection JSUnusedGlobalSymbols
/**
 * DateUtilities
 * Copyright (C) 2014 by Plug DJ, Inc.
 * Modified by TAT (TAT@plugCubed.net)
 */
var DateUtilities = {
    MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    SERVER_TIME: null,
    OFFSET: 0,
    setServerTime: function(e) {
        this.SERVER_TIME = this.convertUnixDateStringToDate(e);
        this.OFFSET = this.SERVER_TIME.getTime() - (new Date).getTime();
    },
    yearsSince: function(e) {
        return this.ServerDate().getFullYear() - e.getFullYear();
    },
    monthsSince: function(e) {
        var t = this.ServerDate();
        return (t.getFullYear() - e.getFullYear()) * 12 + (t.getMonth() - e.getMonth());
    },
    daysSince: function(e) {
        var t = this.ServerDate(), n = t.getTime(), r = e.getTime(), i = 864e5, s = (n - r) / i, o = (n - r) % i / i;
        if (o > 0 && o * i > this.secondsSinceMidnight(t) * 1e3) {
            s++;
        }
        return ~~s;
    },
    hoursSince: function(e) {
        return ~~((this.ServerDate().getTime() - e.getTime()) / 36e5);
    },
    minutesSince: function(e) {
        return ~~((this.ServerDate().getTime() - e.getTime()) / 6e4);
    },
    secondsSince: function(e) {
        return ~~((this.ServerDate().getTime() - e.getTime()) / 1e3);
    },
    monthName: function(e, t) {
        var n = this.MONTHS[e.getMonth()];
        return t ? n : n.substr(0, 3);
    },
    secondsSinceMidnight: function(e) {
        var t = new Date(e.getTime());
        this.midnight(t);
        return ~~((e.getTime() - t.getTime()) / 1e3);
    },
    midnight: function(e) {
        e.setHours(0);
        e.setMinutes(0);
        e.setSeconds(0);
        e.setMilliseconds(0);
    },
    minutesUntil: function(e) {
        return ~~((e.getTime() - this.ServerDate().getTime()) / 6e4);
    },
    millisecondsUntil: function(e) {
        return e.getTime() - this.ServerDate().getTime();
    },
    ServerDate: function() {
        return new Date((new Date).getTime() + this.OFFSET);
    },
    getServerEpoch: function() {
        return Date.now() + this.OFFSET;
    },
    getSecondsElapsed: function(e) {
        return !e || e == '0' ? 0 : this.secondsSince(new Date(e.substr(0, e.indexOf('.'))));
    },
    convertUnixDateStringToDate: function(e) {
        return e ? new Date(e.substr(0, 4), Number(e.substr(5, 2)) - 1, e.substr(8, 2), e.substr(11, 2), e.substr(14, 2), e.substr(17, 2)) : null;
    }
};

/**
 * The ticker that runs through the queue and executes them when it's time
 * @private
 */
function queueTicker() {
    serverRequests.running = true;
    var canSend = serverRequests.sent < serverRequests.limit, obj = serverRequests.queue.pop();
    if (canSend && obj) {
        serverRequests.sent++;
        if (obj.type == 'rest') {
            sendREST(obj.opts, obj.callbacks.success, obj.callbacks.failure);
        } else if (obj.type == 'connect') {
            if (obj.server == 'socket') {
                connectSocket(obj.room);
            }
        }

        setTimeout(function() {
            serverRequests.sent--;
        }, 6e4);
    }
    if (serverRequests.queue.length > 0) {
        setImmediate(queueTicker);
    } else {
        serverRequests.running = false;
    }
}

/**
 * Queue REST request
 * @param {"POST"|"PUT"|"GET"|"DELETE"} method REST method
 * @param {String} endpoint Endpoint on server
 * @param {Object|Undefined} [data] Data
 * @param {Function|Undefined} [successCallback] Callback function on success
 * @param {Function|Undefined} [failureCallback] Callback function on failure
 * @param {Boolean} [skipQueue] Skip queue and send the request immediately
 * @private
 */
function queueREST(method, endpoint, data, successCallback, failureCallback, skipQueue) {
    if (['POST', 'PUT', 'GET', 'DELETE'].indexOf(method) < 0) {
        logger.error(method, 'needs update');
        return;
    }

    successCallback = typeof successCallback === 'function' ? __bind(successCallback, that) : function() {
    };
    failureCallback = typeof failureCallback === 'function' ? __bind(failureCallback, that) : function() {
        // Retry
        queueREST(method, endpoint, data, successCallback, failureCallback, skipQueue);
    };

    var opts = {
        method: method,
        url: 'https://plug.dj/_/' + endpoint,
        headers: {
            Accept: 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/json',
            'User-Agent': 'plugAPI_' + PlugAPIInfo.version,
            Cookie: _cookies.toString()
        }
    };

    if (data !== undefined) {
        opts.body = JSON.stringify(data);
    }

    if (skipQueue && skipQueue === true) {
        sendREST(opts, successCallback, failureCallback);
    } else {
        serverRequests.queue.push({
            type: 'rest',
            opts: opts,
            callbacks: {
                success: successCallback,
                failure: failureCallback
            }
        });
        if (!serverRequests.running) {
            queueTicker();
        }
    }
}

/**
 * Send a REST request
 * @param {Object} opts
 * @param {Function} successCallback Callback function on success
 * @param {Function} failureCallback Callback function on failure
 * @private
 */
function sendREST(opts, successCallback, failureCallback) {
    request(opts, function(err, res, body) {
        if (err) {
            logger.error('[REST Error]', err);
            failureCallback(err);
            return;
        }
        try {
            body = JSON.parse(body);
            if (body.status === 'ok') {
                successCallback(body.data);
            } else {
                failureCallback(body.status, body.data);
            }
        } catch (e) {
            logger.error('[REST Error]', e);
            failureCallback(e);
        }
    });
}

/**
 * Queue that the bot should join a room.
 * @param {String} roomSlug Slug of room to join after connection
 * @param {Function} [callback] Callback function
 * @private
 */
function joinRoom(roomSlug, callback) {
    queueREST('POST', 'rooms/join', {
        slug: roomSlug
    }, function() {
        queueREST('GET', 'rooms/state', undefined, function(data) {
            connectingRoomSlug = null;
            initRoom(data[0], function() {
                if (typeof callback === 'function') {
                    callback(data);
                }
            });
        });
    }, function(status) {
        logger.error('Error while joining:', status ? status : 'Unknown error');
        setTimeout(function() {
            joinRoom(roomSlug, callback);
        }, 1e3);
    });
}

/**
 * Handling incoming messages.
 * Emitting the correct events depending on commands, mentions, etc.
 * @param {Object} messageData plug.DJ message event data
 * @private
 */
function receivedChatMessage(messageData) {
    var i, cmd, obj, lastIndex, allUsers, random;
    if (!initialized) return;

    messageData.message = encoder.htmlDecode(messageData.message);

    obj = {
        raw: messageData,
        id: messageData.cid,
        from: room.getUser(messageData.uid),
        message: messageData.message,
        mentions: []
    };

    if ((messageData.type == 'message' || messageData.type == 'pm') && messageData.message.indexOf(commandPrefix) === 0 && (that.processOwnMessages || messageData.uid !== room.getSelf().id)) {
        cmd = messageData.message.substr(commandPrefix.length).split(' ')[0];

        obj.command = cmd;
        obj.args = messageData.message.substr(commandPrefix.length + cmd.length + 1);

        // Mentions => Mention placeholder
        lastIndex = obj.args.indexOf('@');
        allUsers = room.getUsers();
        random = Math.ceil(Math.random() * 1E10);
        while (lastIndex > -1) {
            var test = obj.args.substr(lastIndex), found = null;
            for (i in allUsers) {
                if (allUsers.hasOwnProperty(i) && test.indexOf(allUsers[i].username) === 1) {
                    if (found === null || allUsers[i].username.length > found.username.length) {
                        found = allUsers[i];
                    }
                }
            }
            if (found !== null) {
                obj.args = obj.args.substr(0, lastIndex) + '%MENTION-' + random + '-' + obj.mentions.length + '%' + obj.args.substr(lastIndex + found.username.length + 1);
                obj.mentions.push(found);
            }
            lastIndex = obj.args.indexOf('@', lastIndex + 1);
        }

        // Arguments
        obj.args = obj.args.split(' ');
        for (i in obj.args) {
            if (!obj.args.hasOwnProperty(i)) continue;
            if (!isNaN(obj.args[i])) obj.args[i] = ~~obj.args[i];
        }

        // Mention placeholder => User object
        for (i in obj.mentions) {
            if (obj.mentions.hasOwnProperty(i)) {
                obj.args[obj.args.indexOf('%MENTION-' + random + '-' + i + '%')] = obj.mentions[i];
            }
        }

        // Pre command handler
        if (typeof that.preCommandHandler === 'function' && that.preCommandHandler(obj) === false) return;

        // Functions
        obj.respond = function() {
            var message = Array.prototype.slice.call(arguments).join(' ');

            return that.sendChat('@' + this.from.username + ' ' + message);
        };
        obj.respondTimeout = function() {
            var args, timeout, message;

            args = Array.prototype.slice.call(arguments);
            timeout = parseInt(args.splice(args.length - 1, 1), 10);
            message = args.join(' ');

            return that.sendChat('@' + this.from.username + ' ' + message, timeout);
        };
        obj.havePermission = function(permission, successCallback, failureCallback) {
            if (permission === undefined) permission = 0;
            if (that.havePermission(this.from.id, permission)) {
                if (typeof successCallback === 'function') {
                    successCallback();
                }
                return true;
            }
            if (typeof failureCallback === 'function') {
                failureCallback();
            }
            return false;
        };
        obj.isFrom = function(ids, success, failure) {
            if (typeof ids === 'string') ids = [ids];
            if (ids === undefined || !util.isArray(ids)) {
                if (typeof failure === 'function') {
                    failure();
                }
                return false;
            }
            var isFrom = ids.indexOf(messageData.uid) > -1;
            if (isFrom && typeof success === 'function') {
                success();
            } else if (!isFrom && typeof failure === 'function') {
                failure();
            }
            return isFrom;
        };
        that.emit(PlugAPI.events.CHAT_COMMAND, obj);
        that.emit(PlugAPI.events.CHAT_COMMAND + ':' + cmd, obj);
        if (that.deleteCommands) {
            that.moderateDeleteChat(messageData.cid);
        }
    } else if (messageData.type == 'emote') {
        that.emit(PlugAPI.events.CHAT_EMOTE, obj);
    }
    if (messageData.type == 'pm') {
        that.emit('pm', obj);
    } else {
        that.emit(PlugAPI.events.CHAT, obj);
        that.emit(PlugAPI.events.CHAT + ':' + obj.raw.type, obj);
        if (room.getUser() !== null && messageData.message.indexOf('@' + room.getUser().username) > -1) {
            that.emit(PlugAPI.events.CHAT + ':mention', obj);
            that.emit('mention', obj);
        }
    }
}

/**
 * Queue that the bot should connect to the socket server
 * @param {String} roomSlug Slug of room to join after connection
 * @private
 */
function queueConnectSocket(roomSlug) {
    serverRequests.queue.push({
        type: 'connect',
        server: 'socket',
        room: roomSlug
    });
    if (!serverRequests.running) {
        queueTicker();
    }
}

/**
 * Get the auth code for the user
 * @param {Function} callback Callback function
 * @private
 */
function getAuthCode(callback) {
    request({
        url: 'https://plug.dj/',
        headers: {
            'User-Agent': 'plugAPI_' + PlugAPIInfo.version,
            Cookie: _cookies.toString()
        }
    }, function(err, res, body) {
        if (err) {
            logger.error('Error getting auth code:', err);
        } else if (res.statusCode === 200) {
            _authCode = body.split('_jm')[1].split('"')[1];
            var _st = body.split('_st')[1].split('"')[1];
            DateUtilities.setServerTime(_st);
            callback();
        } else {
            logger.error('Error getting auth code: HTTP ' + res.statusCode);
            _cookies.clear();
            var slug = room.getRoomMeta().slug;
            that.close();
            that.connect(slug);
        }
    });
}

/**
 * Connect to plug.DJ's socket server
 * @param {String} roomSlug Slug of room to join after connection
 * @private
 */
function connectSocket(roomSlug) {
    if (_authCode === null || _authCode === '') {
        getAuthCode(function() {
            connectSocket(roomSlug);
        });
        return;
    }

    var server_id = Math.floor(Math.random() * 1000);
    var conn_id = (function() {
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
        var i, ret = [];
        for (i = 0; i < 8; i++) {
            ret.push(chars.substr(Math.floor(Math.random() * chars.length), 1));
        }
        return ret.join('');
    })();

    ws = new WebSocket('wss://shalamar.plug.dj/socket/' + server_id + '/' + conn_id + '/websocket');
    ws.on('open', function() {
        //noinspection JSUnresolvedFunction
        logger.success(chalk.green('[Socket Server] Connected'));
        ws.sendEvent('auth', _authCode);

        that.emit('connected');
        that.emit('server:socket:connected');
    });
    ws.on('message', function(data) {
        var type = data.slice(0, 1), payload;
        switch (type) {
            case 'a':
                payload = JSON.parse(data.slice(1) || '[]');
                for (var i = 0; i < payload.length; i++) {
                    ws.emit('data', payload[i][0]);
                }
                break;
            case 'm':
                payload = JSON.parse(data.slice(1) || 'null');
                ws.emit('data', payload);
                break;
            default:
                break;
        }
    });
    ws.on('data', messageHandler);
    ws.on('data', function(data) {
        return that.emit('tcpMessage', data);
    });
    ws.on('error', function(a) {
        logger.error('[Socket Server] Error:', a);
        process.nextTick(function() {
            var slug = room.getRoomMeta().slug ? room.getRoomMeta().slug : roomSlug;
            that.close();
            logger.info('[Socket Server] Reconnecting');
            setImmediate(function() {
                that.connect(slug);
            });

        });
    });
    ws.on('close', function(a) {
        logger.warn('[Socket Server] Closed with code', a);
        process.nextTick(function() {
            var slug = room.getRoomMeta().slug ? room.getRoomMeta().slug : roomSlug;
            that.close();
            logger.info('[Socket Server] Reconnecting');
            setImmediate(function() {
                that.connect(slug);
            });
        });
    });
}

/**
 * Initialize the room with roomstate data
 * @param {Object} data Roomstate Data
 * @param {Function} callback Callback function
 * @private
 */
function initRoom(data, callback) {
    room.reset();
    room.setRoomData(data);
    that.emit(PlugAPI.events.ADVANCE, {
        currentDJ: room.getDJ(),
        djs: room.getDJs(),
        lastPlay: {
            dj: null,
            media: null,
            score: null
        },
        media: room.getMedia(),
        startTime: room.getStartTime(),
        historyID: room.getHistoryID()
    });
    queueREST('GET', 'rooms/history', undefined, __bind(room.setHistory, room));
    that.emit(PlugAPI.events.ROOM_JOIN, data.meta.name);
    initialized = true;
    callback();
}

/**
 * The handling of incoming messages from the Plug.DJ socket server.
 * If any cases are returned instead of breaking (stopping the emitting to the user code) it MUST be commented just before returning.
 * @param {Object} msg
 * @private
 */
function messageHandler(msg) {
    /**
     * Event type
     * @type {PlugAPI.events}
     */
    var type = msg.a;
    /**
     * @type {Object|Number}
     */
    var data = msg.p;
    var i, slug;
    switch (type) {
        case 'ack':
            if (data !== 1) {
                slug = room.getRoomMeta().slug;
                _cookies.clear();
                that.close();
                _authCode = null;
                PerformLogin(true);
                that.connect(slug);
                // This event should not be emitted to the user code.
                return;
            }
            queueREST('GET', 'users/me', null, function(a) {
                room.setSelf(a[0]);
                joinRoom(connectingRoomSlug);
            });
            // This event should not be emitted to the user code.
            return;
        case PlugAPI.events.CHAT:
            chatHistory.push(data);

            // If over limit, remove the first item
            if (chatHistory.length > 512) chatHistory.shift();

            receivedChatMessage(data);

            // receivedChatMessage will emit the event with correct chat object and over correct event types
            return;
        case PlugAPI.events.CHAT_DELETE:
            for (i in chatHistory) {
                if (!chatHistory.hasOwnProperty(i)) continue;
                //noinspection JSUnresolvedVariable
                if (chatHistory[i].cid == data.c) chatHistory.splice(i, 1);
            }
            break;
        case PlugAPI.events.USER_JOIN:
            room.addUser(data);
            break;
        case PlugAPI.events.USER_LEAVE:
            var userData = room.getUser(data);
            if (userData == null) {
                userData = {
                    id: data
                };
            }
            room.removeUser(data);
            that.emit(type, userData);
            // This is getting emitted with the full user object instead of only the user ID
            return;
        case PlugAPI.events.USER_UPDATE:
            room.updateUser(data);
            //noinspection JSUnresolvedVariable
            that.emit(type, that.getUser(data.i));
            // This is getting emitted with the full user object instead of only the user ID
            return;
        case PlugAPI.events.VOTE:
            //noinspection JSUnresolvedVariable
            room.setVote(data.i, data.v);
            break;
        case PlugAPI.events.GRAB:
            room.setGrab(data);
            break;
        case PlugAPI.events.ADVANCE:
            //noinspection JSUnresolvedVariable
            var advanceEvent = {
                lastPlay: {
                    dj: room.getDJ(),
                    media: room.getMedia(),
                    score: room.getRoomScore()
                },
                media: data.m,
                startTime: data.t,
                historyID: data.h
            };
            room.advance(data);
            advanceEvent.currentDJ = room.getDJ();
            advanceEvent.djs = room.getDJs();
            that.emit(type, advanceEvent);
            // This is getting emitted with an advance object containing more information than the incoming data
            return;
        case PlugAPI.events.DJ_LIST_UPDATE:
            room.setDJs(data);
            break;
        case PlugAPI.events.FLOOD_CHAT:
            floodProtectionDelay += 500;
            setTimeout(function() {
                floodProtectionDelay -= 500;
            }, floodProtectionDelay * 5);
            logger.warning('Flood protection: Slowing down the sending of chat messages temporary');
            break;
        case PlugAPI.events.MODERATE_STAFF:
            //noinspection JSUnresolvedVariable
            for (i in data.u) {
                //noinspection JSUnresolvedVariable
                if (!data.u.hasOwnProperty(i)) continue;
                //noinspection JSUnresolvedVariable
                room.updateUser({
                    i: data.u[i].i,
                    role: data.u[i].p
                });
            }
            break;
        case PlugAPI.events.MODERATE_ADD_DJ:
        case PlugAPI.events.MODERATE_REMOVE_DJ:
        case PlugAPI.events.MODERATE_MOVE_DJ:
            /*
             These will be ignored by PlugAPI.
             The server will send updates to current song and waitlist.
             The events are still being sent to the code, so the bot can still react to the events.
             */
            break;
        case PlugAPI.events.MODERATE_MUTE:
            room.muteUser(data);
            break;
        case PlugAPI.events.DJ_LIST_CYCLE:
            //noinspection JSUnresolvedVariable
            room.setCycle(data.f);
            break;
        case PlugAPI.events.KILL_SESSION:
            slug = room.getRoomMeta().slug;
            _cookies.clear();
            that.close();
            _authCode = null;
            that.connect(slug);
            break;
        case PlugAPI.events.EARN:
            room.setEarn(data);
            break;
        case PlugAPI.events.NOTIFY:
            //noinspection JSUnresolvedVariable
            if (data.action === 'levelUp') {
                //noinspection JSUnresolvedVariable
                logger.info('Congratulations, you have leveled up to level', data.value);
            } else {
                logger.info('Notify', data);
            }
            break;
        default:
        case void 0:
            logger.warning('UNKNOWN MESSAGE FORMAT\n', JSON.stringify(msg, null, 4));
    }
    if (type) {
        that.emit(type, data);
    }
}

/**
 * Perform the login process.
 * @param ignoreCache Ignore cached cookie
 * @private
 */
function PerformLogin(ignoreCache) {
    var deasync = require('deasync');
    var loggingIn = true, loggedIn = false;
    if (!ignoreCache && _cookies.load()) {
        request.get('https://plug.dj/_/users/me', {
            headers: {
                'User-Agent': 'plugAPI_' + PlugAPIInfo.version,
                Cookie: _cookies.toString()
            }
        }, function(err, res) {
            if (res.statusCode === 200) {
                loggedIn = true;
            }
            loggingIn = false;
        });
        // Wait until the session is set
        while (loggingIn) {
            deasync.sleep(100);
        }
    }
    if (!loggedIn) {
        loggingIn = true;

        request.get('https://plug.dj/', {
            headers: {
                'User-Agent': 'plugAPI_' + PlugAPIInfo.version,
                Cookie: _cookies.toString()
            }
        }, function(err, res, body) {
            var csrfToken;

            _cookies.fromHeaders(res.headers);

            csrfToken = body.split('_csrf')[1].split('"')[1];

            request({
                method: 'POST',
                uri: 'https://plug.dj/_/auth/login',
                headers: {
                    'User-Agent': 'plugAPI_' + PlugAPIInfo.version,
                    Cookie: _cookies.toString()
                },
                json: {
                    csrf: csrfToken,
                    email: authenticationInfo.email,
                    password: authenticationInfo.password
                }
            }, function(err, res, data) {
                if (data.status !== 'ok') {
                    logger.error('LOGIN ERROR: ' + data.status);
                    process.exit(1);
                } else {
                    _cookies.fromHeaders(res.headers);
                    _cookies.save();
                    loggedIn = true;
                    loggingIn = false;
                }
            });
        });

        // Wait until the session is set
        while (loggingIn) {
            deasync.sleep(100);
        }
    }
}

var PlugAPI = function(authenticationData) {
    if (!authenticationData) {
        logger.error('You must pass the authentication data into the PlugAPI object to connect correctly');
        process.exit(1);
    } else {
        if (!authenticationData.email) {
            logger.error('Missing login e-mail');
            process.exit(1);
        }
        if (!authenticationData.password) {
            logger.error('Missing login password');
            process.exit(1);
        }
    }

    authenticationInfo = authenticationData;
    PerformLogin();

    that = this;

    /**
     * Should the bot split messages up if hitting message length limit?
     * @type {boolean}
     */
    this.multiLine = false;
    /**
     * Max splits
     * @type {number}
     */
    this.multiLineLimit = 5;
    /**
     * Should the bot process commands the bot itself is sending?
     * @type {boolean}
     */
    this.processOwnMessages = false;
    /**
     * Should the bot delete incomming commands?
     * @type {boolean}
     */
    this.deleteCommands = true;

    room.registerUserExtensions(this);

    //noinspection JSUnusedLocalSymbols
    /**
     * Pre-command Handler
     * @param {Object} [obj]
     * @return {boolean} If false, the command is not getting handled.
     */
    this.preCommandHandler = function(obj) {
        return true;
    };

    logger.info('Running plugAPI v.' + PlugAPIInfo.version + '-dev');
    //noinspection JSUnresolvedFunction
    logger.warn(chalk.yellow('THIS IS A UNSTABLE VERSION! DO NOT USE FOR PRODUCTION!'));
};

/**
 * Room ranks
 * @type {{NONE: number, RESIDENTDJ: number, BOUNCER: number, MANAGER: number, COHOST: number, HOST: number}}
 * @const
 */
PlugAPI.ROOM_ROLE = {
    NONE: 0,
    RESIDENTDJ: 1,
    BOUNCER: 2,
    MANAGER: 3,
    COHOST: 4,
    HOST: 5
};

/**
 * Global Ranks
 * @type {{NONE: number, VOLUNTEER: number, AMBASSADOR: number, LEADER: number, ADMIN: number}}
 * @const
 */
PlugAPI.GLOBAL_ROLES = {
    NONE: 0,
    VOLUNTEER: 2,
    AMBASSADOR: 3,
    LEADER: 4,
    ADMIN: 5
};

/**
 * Statuses
 * @type {{AVAILABLE: number, AFK: number, WORKING: number, GAMING: number}}
 * @const
 */
PlugAPI.STATUS = {
    AVAILABLE: 0,
    AFK: 1,
    WORKING: 2,
    GAMING: 3
};

/**
 * Ban Lengths
 * @type {{HOUR: string, DAY: string, PERMA: string}}
 * @const
 */
PlugAPI.BAN = {
    HOUR: 'h',
    DAY: 'd',
    PERMA: 'f'
};

/**
 * Mute Lengths
 * Short: 15 minutes
 * Medium: 30 minutes
 * Long: 45 minutes
 * @type {{SHORT: string, MEDIUM: string, LONG: string}}
 * @const
 */
PlugAPI.MUTE = {
    SHORT: 's',
    MEDIUM: 'm',
    LONG: 'l'
};

/**
 * Event Types
 * @const {{ADVANCE: string, BAN: string, BOOTH_LOCKED: string, CHAT: string, CHAT_COMMAND: string, CHAT_DELETE: string, CHAT_EMOTE: string, COMMAND: string, DJ_LIST_CYCLE: string, DJ_LIST_UPDATE: string, EARN: string, EMOTE: string, FOLLOW_JOIN: string, FLOOD_CHAT: string, GRAB: string, KILL_SESSION: string, MODERATE_ADD_DJ: string, MODERATE_ADD_WAITLIST: string, MODERATE_AMBASSADOR: string, MODERATE_BAN: string, MODERATE_MOVE_DJ: string, MODERATE_MUTE: string, MODERATE_REMOVE_DJ: string, MODERATE_REMOVE_WAITLIST: string, MODERATE_SKIP: string, MODERATE_STAFF: string, NOTIFY: string, PDJ_MESSAGE: string, PDJ_UPDATE: string, PING: string, PLAYLIST_CYCLE: string, REQUEST_DURATION: string, REQUEST_DURATION_RETRY: string, ROOM_CHANGE: string, ROOM_DESCRIPTION_UPDATE: string, ROOM_JOIN: string, ROOM_NAME_UPDATE: string, ROOM_VOTE_SKIP: string, ROOM_WELCOME_UPDATE: string, SESSION_CLOSE: string, SKIP: string, STROBE_TOGGLE: string, USER_COUNTER_UPDATE: string, USER_FOLLOW: string, USER_JOIN: string, USER_LEAVE: string, USER_UPDATE: string, VOTE: string}}
 */
PlugAPI.events = {
    ADVANCE: 'advance',
    BAN: 'ban',
    BOOTH_LOCKED: 'boothLocked',
    CHAT: 'chat',
    CHAT_COMMAND: 'command',
    CHAT_DELETE: 'chatDelete',
    CHAT_EMOTE: 'emote',
    COMMAND: 'command',
    DJ_LIST_CYCLE: 'djListCycle',
    DJ_LIST_UPDATE: 'djListUpdate',
    EARN: 'earn',
    EMOTE: 'emote',
    FOLLOW_JOIN: 'followJoin',
    FLOOD_CHAT: 'floodChat',
    GRAB: 'grab',
    KILL_SESSION: 'killSession',
    MODERATE_ADD_DJ: 'modAddDJ',
    MODERATE_ADD_WAITLIST: 'modAddWaitList',
    MODERATE_AMBASSADOR: 'modAmbassador',
    MODERATE_BAN: 'modBan',
    MODERATE_MOVE_DJ: 'modMoveDJ',
    MODERATE_MUTE: 'modMute',
    MODERATE_REMOVE_DJ: 'modRemoveDJ',
    MODERATE_REMOVE_WAITLIST: 'modRemoveWaitList',
    MODERATE_SKIP: 'modSkip',
    MODERATE_STAFF: 'modStaff',
    NOTIFY: 'notify',
    PDJ_MESSAGE: 'pdjMessage',
    PDJ_UPDATE: 'pdjUpdate',
    PING: 'ping',
    PLAYLIST_CYCLE: 'playlistCycle',
    REQUEST_DURATION: 'requestDuration',
    REQUEST_DURATION_RETRY: 'requestDurationRetry',
    ROOM_CHANGE: 'roomChanged',
    ROOM_DESCRIPTION_UPDATE: 'roomDescriptionUpdate',
    ROOM_JOIN: 'roomJoin',
    ROOM_NAME_UPDATE: 'roomNameUpdate',
    ROOM_VOTE_SKIP: 'roomVoteSkip',
    ROOM_WELCOME_UPDATE: 'roomWelcomeUpdate',
    SESSION_CLOSE: 'sessionClose',
    SKIP: 'skip',
    STROBE_TOGGLE: 'strobeToggle',
    USER_COUNTER_UPDATE: 'userCounterUpdate',
    USER_FOLLOW: 'userFollow',
    USER_JOIN: 'userJoin',
    USER_LEAVE: 'userLeave',
    USER_UPDATE: 'userUpdate',
    VOTE: 'vote'
};

/**
 * Create a new logger for your own scripts.
 * @param channel
 * @return {Logger}
 */
PlugAPI.getLogger = function(channel) {
    if (!channel) channel = 'Unknown';
    return new Logger(channel);
};

PlugAPI.prototype.addListener = function() {
    EventEmitter.addListener.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.on = function() {
    EventEmitter.on.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.onAny = function() {
    EventEmitter.onAny.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.offAny = function() {
    EventEmitter.offAny.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.once = function() {
    EventEmitter.once.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.many = function() {
    EventEmitter.many.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.removeListener = function() {
    EventEmitter.removeListener.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.off = function() {
    EventEmitter.off.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.removeAllListeners = function() {
    EventEmitter.removeAllListeners.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.setMaxListeners = function() {
    EventEmitter.setMaxListeners.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.listeners = function() {
    EventEmitter.listeners.apply(EventEmitter, arguments);
    return this;
};

PlugAPI.prototype.emit = function() {
    EventEmitter.emit.apply(EventEmitter, arguments);
    return this;
};

//noinspection JSUnusedGlobalSymbols
/**
 * Set the Logger object, must contain a info, warn, warning and error function
 * @param {Logger} newLogger
 * @returns {boolean} True if set
 */
PlugAPI.prototype.setLogger = function(newLogger) {
    var requiredMethods = ['info', 'warn', 'warning', 'error'];

    if (newLogger && typeof newLogger === 'object' && !util.isArray(newLogger)) {
        for (var i in requiredMethods) {
            if (!requiredMethods.hasOwnProperty(i)) continue;
            if (typeof newLogger[requiredMethods[i]] !== 'function')
                return false;
        }
        logger = newLogger;
        return true;
    }
    return false;
};

//noinspection JSUnusedGlobalSymbols
/**
 * Join another room
 * @param {String} slug
 */
PlugAPI.prototype.changeRoom = function(slug) {
    joinRoom(slug);
};

/**
 * Close the connection
 */
PlugAPI.prototype.close = function() {
    connectingRoomSlug = null;
    //noinspection JSUnresolvedFunction
    ws.removeAllListeners('close');
    ws.close();
    _authCode = null;
    room = new Room();
};

//noinspection JSUnusedGlobalSymbols
/**
 * Set the command prefix
 * @param prefix
 * @returns {boolean} True if set
 */
PlugAPI.prototype.setCommandPrefix = function(prefix) {
    if (!prefix || typeof prefix !== 'string' || prefix.length < 1) {
        return false;
    }
    commandPrefix = prefix;
    return true;
};

/**
 * Connect to a room
 * @param {String} roomSlug Slug of room (The part after https://plug.dj/)
 */
PlugAPI.prototype.connect = function(roomSlug) {
    if (!roomSlug || typeof roomSlug !== 'string' || roomSlug.length === 0 || roomSlug.indexOf('/') > -1) {
        logger.error('Invalid room name');
        process.exit(1);
    }

    if (connectingRoomSlug != null) {
        logger.error('Already connecting to a room');
        return;
    }

    // Only connect if session cookie is set
    if (!_cookies.contain('session')) {
        setImmediate(function() {
            that.connect(roomSlug);
        });
        return;
    }

    connectingRoomSlug = roomSlug;
    queueConnectSocket(roomSlug);
};

/**
 * Send a chat message
 * @param {String} msg Message
 * @param {int} [timeout] If set, auto deletes the message after x seconds. (Needs to have modChat permission)
 */
PlugAPI.prototype.sendChat = function(msg, timeout) {
    if (msg.length > 235 && this.multiLine) {
        var lines = msg.replace(/.{235}\S*\s+/g, '$&¤').split(/\s+¤/);
        for (var i = 0; i < lines.length; i++) {
            msg = lines[i];
            if (i > 0) {
                msg = '(continued) ' + msg;
            }
            queueChat(msg, timeout);
            if (i + 1 >= this.multiLineLimit) {
                break;
            }
        }
    } else {
        queueChat(msg, timeout);
    }
};

/**
 * Woot
 * @param {Function} [callback]
 */
PlugAPI.prototype.woot = function(callback) {
    queueREST('POST', 'votes', {
        direction: 1,
        historyID: room.getHistoryID()
    }, callback);
};

/**
 * Meh
 * @param {Function} [callback]
 */
PlugAPI.prototype.meh = function(callback) {
    queueREST('POST', 'votes', {
        direction: -1,
        historyID: room.getHistoryID()
    }, callback);
};

//noinspection JSUnusedGlobalSymbols
/**
 * Get a history over chat messages. (Limit 512 messages)
 * @returns {Array} Chat history
 */
PlugAPI.prototype.getChatHistory = function() {
    return chatHistory;
};

/**
 * Get a history over songs played. (Limit 50 songs)
 * @param {Function} callback Callback to get the history. History will be sent as argument.
 */
PlugAPI.prototype.getHistory = function(callback) {
    if (typeof callback !== 'function') {
        logger.error('You must specify callback to get history!');
    }
    if (initialized) {
        var history = room.getHistory();
        if (history.length > 1) {
            callback(history);
            return;
        }
    }
    setImmediate(function() {
        that.getHistory(callback);
    });
};

//noinspection JSUnusedGlobalSymbols
/**
 * Change the name of the community
 * @param {String} name
 * @param {Function} [callback]
 * @return {boolean}
 */
PlugAPI.prototype.changeRoomName = function(name, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.COHOST)) {
        return false;
    }
    queueREST('POST', endpoints.ROOM_INFO, {
        name: name,
        description: undefined,
        welcome: undefined
    }, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.changeRoomDescription = function(description, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.COHOST)) {
        return false;
    }
    queueREST('POST', endpoints.ROOM_INFO, {
        name: undefined,
        description: description,
        welcome: undefined
    }, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.changeRoomWelcome = function(welcome, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.COHOST)) {
        return false;
    }
    queueREST('POST', endpoints.ROOM_INFO, {
        name: undefined,
        description: undefined,
        welcome: welcome
    }, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.changeDJCycle = function(enabled, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
        return false;
    }
    queueREST('PUT', endpoints.ROOM_CYCLE_BOOTH, {
        shouldCycle: enabled
    }, callback);
    return true;
};

PlugAPI.prototype.getTimeElapsed = function() {
    if (!room.getRoomMeta().slug || room.getMedia() == null) {
        return -1;
    }
    return Math.min(room.getMedia().duration, DateUtilities.getSecondsElapsed(room.getStartTime()));
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.getTimeRemaining = function() {
    if (!room.getRoomMeta().slug || room.getMedia() == null) {
        return -1;
    }
    return room.getMedia().duration - this.getTimeElapsed();
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.joinBooth = function(callback) {
    if (!room.getRoomMeta().slug || room.isDJ() || room.isInWaitList() || (room.getBoothMeta().isLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.RESIDENTDJ)) || this.getDJs().length >= 50) {
        return false;
    }
    queueREST('POST', endpoints.MODERATE_BOOTH, undefined, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.leaveBooth = function(callback) {
    if (!room.getRoomMeta().slug || (!room.isDJ() && !room.isInWaitList())) {
        return false;
    }
    queueREST('DELETE', endpoints.MODERATE_BOOTH, undefined, callback);
    return true;
};

PlugAPI.prototype.moderateAddDJ = function(uid, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || room.isDJ(uid) || room.isInWaitList(uid) || (room.getBoothMeta().isLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER))) {
        return false;
    }
    queueREST('POST', endpoints.MODERATE_ADD_DJ, {
        id: uid
    }, callback);
    return true;
};

PlugAPI.prototype.moderateRemoveDJ = function(uid, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || (!room.isDJ(uid) && !room.isInWaitList(uid)) || (room.getBoothMeta().isLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER))) {
        return false;
    }
    queueREST('DELETE', endpoints.MODERATE_REMOVE_DJ + uid, undefined, callback);
    return true;
};

PlugAPI.prototype.moderateMoveDJ = function(uid, index, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || !room.isInWaitList(uid) || isNaN(index)) {
        return false;
    }
    queueREST('POST', endpoints.MODERATE_MOVE_DJ, {
        userID: uid,
        position: index > 50 ? 49 : index < 1 ? 1 : --index
    }, callback);
    return true;
};

PlugAPI.prototype.moderateBanUser = function(uid, reason, duration, callback) {
    if (!room.getRoomMeta().slug) return false;
    var user = this.getUser(uid);
    if (user !== null ? room.getPermissions(user).canModBan : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) {
        reason = Number(reason || 1);
        if (!duration) duration = this.BAN.PERMA;
        if (duration === this.BAN.PERMA && this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) duration = this.BAN.DAY;
        queueREST('POST', endpoints.MODERATE_BAN, {
            userID: uid,
            reason: reason,
            duration: duration
        }, callback);
    }
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.moderateUnbanUser = function(uid, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) return false;
    queueREST('DELETE', endpoints.MODERATE_UNBAN + uid, undefined, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.moderateForceSkip = function(callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || room.getDJ() === null) return false;
    queueREST('POST', endpoints.MODERATE_SKIP, {
        userID: room.getDJ().id,
        historyID: room.getHistoryID()
    }, callback);
    return true;
};

PlugAPI.prototype.moderateDeleteChat = function(cid, callback) {
    if (!room.getRoomMeta().slug) return false;
    var user = this.getUser(cid.split('-')[0]);
    if (user !== null ? room.getPermissions(user).canModChat : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) {
        queueREST('DELETE', endpoints.CHAT_DELETE + cid, undefined, callback, undefined, true);
    }
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.moderateLockWaitList = function(locked, clear, callback) {
    return this.moderateLockBooth(locked, clear, callback);
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.moderateSetRole = function(uid, role, callback) {
    if (!room.getRoomMeta().slug || isNaN(role)) return false;
    var user = this.getUser(uid);
    if (user !== null ? room.getPermissions(user).canModStaff : this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
        queueREST('POST', endpoints.MODERATE_PERMISSIONS, {
            userID: uid,
            roleID: role
        }, callback);
    }
    return true;
};

PlugAPI.prototype.moderateLockBooth = function(locked, clear, callback) {
    if (!room.getRoomMeta().slug || this.getUser() === null || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || (locked === room.getBoothMeta().isLocked && !clear)) return false;
    queueREST('PUT', endpoints.ROOM_LOCK_BOOTH, {
        isLocked: locked,
        removeAllDJs: clear
    }, callback);
    return true;
};

PlugAPI.prototype.getUsers = function() {
    return room.getUsers();
};

/**
 * Get specific user in the community
 * @param {Number} [uid]
 * @return {*}
 */
PlugAPI.prototype.getUser = function(uid) {
    return room.getUser(uid);
};

/**
 * Get users in the community that aren't DJing nor in the waitlist
 * @return {Array}
 */
PlugAPI.prototype.getAudience = function() {
    return room.getAudience();
};

/**
 * Get the DJ
 * @return {*}
 */
PlugAPI.prototype.getDJ = function() {
    return room.getDJ();
};

/**
 * Get the DJ and users in the waitlist
 * @return {Array}
 */
PlugAPI.prototype.getDJs = function() {
    return room.getDJs();
};

/**
 * Get staff currently in the community
 * @return {Array}
 */
PlugAPI.prototype.getStaff = function() {
    return room.getStaff();
};

//noinspection JSUnusedGlobalSymbols
/**
 * Get all staff for the community, also offline.
 * @param {Function} callback
 */
PlugAPI.prototype.getAllStaff = function(callback) {
    if (!callback || typeof callback !== 'function') {
        logger.error('Missing callback for getAllStaff');
        return;
    }
    queueREST('GET', 'staff', undefined, callback);
};

/**
 * Get plug.dj admins currently in the community
 * @return {*}
 */
PlugAPI.prototype.getAdmins = function() {
    return room.getAdmins();
};

/**
 * Get the user object for the host
 * @returns {*}
 */
PlugAPI.prototype.getHost = function() {
    return room.getHost();
};

/**
 * Get the user object for yourself
 * @returns {*}
 */
PlugAPI.prototype.getSelf = function() {
    return room.getSelf();
};

/**
 * Get all DJs in waitlist
 * @returns {*}
 */
PlugAPI.prototype.getWaitList = function() {
    return room.getWaitList();
};

/**
 * Get a user's position in waitlist
 * @param {int} uid User ID
 * @returns {number} Position in waitlist.
 * If current DJ, it returns 0.
 * If not in waitlist, it returns -1
 */
PlugAPI.prototype.getWaitListPosition = function(uid) {
    return room.getWaitListPosition(uid);
};

PlugAPI.prototype.getAmbassadors = function() {
    return room.getAmbassadors();
};

PlugAPI.prototype.getMedia = function() {
    return room.getMedia();
};

PlugAPI.prototype.getRoomScore = function() {
    return room.getRoomScore();
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.setStatus = function(status, callback) {
    if (!room.getRoomMeta().slug || !status || status < 0 || status > 3) return false;
    queueREST('PUT', endpoints.USER_SET_STATUS, {
        status: status
    }, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.addSongToPlaylist = function(playlistId, songId, callback) {
    if (!room.getRoomMeta().slug || !playlistId || !songId) return false;
    queueREST('GET', endpoints.PLAYLIST + '/' + playlistId + '/media/insert', {
        media: songId,
        append: true
    }, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.getPlaylists = function(callback) {
    if (!room.getRoomMeta().slug) return false;
    queueREST('GET', endpoints.PLAYLIST, undefined, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.activatePlaylist = function(playlist_id, callback) {
    if (!room.getRoomMeta().slug || !playlist_id) return false;
    queueREST('PUT', endpoints.PLAYLIST + '/' + playlist_id + '/activate', undefined, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.deletePlaylist = function(playlist_id, callback) {
    if (!room.getRoomMeta().slug || !playlist_id) return false;
    queueREST('DELETE', endpoints.PLAYLIST + '/' + playlist_id, undefined, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.shufflePlaylist = function(playlist_id, callback) {
    if (!room.getRoomMeta().slug || !playlist_id) return false;
    queueREST('PUT', endpoints.PLAYLIST + '/' + playlist_id + '/shuffle', undefined, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.setAvatar = function(avatar, callback) {
    if (!room.getRoomMeta().slug || !avatar) return false;
    queueREST('PUT', endpoints.USER_SET_AVATAR, {
        id: avatar
    }, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.getAvatars = function(callback) {
    if (!room.getRoomMeta().slug) return false;
    queueREST('GET', endpoints.USER_GET_AVATARS, undefined, callback);
    return true;
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.getAvatar = function() {
    return room.getUser().avatarID;
};

/**
 * Implementation of plug.dj havePermission method
 * @param {undefined|Number} [uid]
 * @param {Number} permission
 * @param {Boolean} [global]
 */
PlugAPI.prototype.havePermission = function(uid, permission, global) {
    if (global) return room.haveGlobalPermission(uid, permission);
    return room.haveRoomPermission(uid, permission) || room.haveGlobalPermission(uid, permission);
};

PlugAPI.prototype.listen = function(port, address) {
    var _this = this;
    http.createServer(function(req, res) {
        var dataStr = '';
        req.on('data', function(chunk) {
            dataStr += chunk.toString();
        });
        req.on('end', function() {
            req._POST = querystring.parse(dataStr);
            _this.emit('httpRequest', req, res);
        });
    }).listen(port, address);
};

//noinspection JSUnusedGlobalSymbols
PlugAPI.prototype.tcpListen = function(port, address) {
    var _this = this;
    net.createServer(function(socket) {
        socket.on('connect', function() {
            _this.emit('tcpConnect', socket);
        });
        socket.on('data', function(data) {
            var msg = data.toString();
            if (msg[msg.length - 1] == '\n') {
                _this.emit('tcpMessage', socket, msg.substr(0, msg.length - 1));
            }
        });
        socket.on('end', function() {
            _this.emit('tcpEnd', socket);
        });
    }).listen(port, address);
};
module.exports = PlugAPI;
