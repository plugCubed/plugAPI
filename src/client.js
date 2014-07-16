var SockJS, net, http, EventEmitter, Room, PlugAPIInfo, request, WebSocket, encoder, util, zlib, rpcNames, messageTypes, client, ws, p3Socket, initialized, commandPrefix, apiId, _this, _key, _updateCode, lastRpcMessage, historyID, lastHistoryID, serverRequests, room, rpcHandlers, logger;

// Node.JS Core Modules
net = require('net');
http = require('http');
EventEmitter = require('events').EventEmitter;
util = require('util');
zlib = require('zlib');

// Third-party modules
SockJS = require('sockjs-client-node');
request = require('request');
WebSocket = require('ws');
encoder = new require('node-html-encoder').Encoder('entity');

// plugAPI
Room = require('./room');
PlugAPIInfo = require('../package.json');

rpcNames = {
    BOOTH_JOIN: 'booth.join_1',
    BOOTH_LEAVE: 'booth.leave_1',
    BOOTH_SKIP: 'booth.skip_1',
    DURATION_MISMATCH: 'duration.mismatch',
    DURATION_UPDATE: 'duration.update',
    HISTORY_SELECT: 'history.select_1',
    MEDIA_RECOVER: 'media.recover_1',
    MEDIA_SELECT: 'media.select_1',
    MEDIA_UPDATE: 'media.update_1',
    MODERATE_ADD_DJ: 'moderate.add_dj_1',
    MODERATE_BAN: 'moderate.ban_1',
    MODERATE_BANS: 'moderate.bans_1',
    MODERATE_CHAT_DELETE: 'moderate.chat_delete_1',
    MODERATE_MOVE_DJ: 'moderate.move_dj_1',
    MODERATE_PERMISSIONS: 'moderate.permissions_1',
    MODERATE_REMOVE_DJ: 'moderate.remove_dj_1',
    MODERATE_SKIP: 'moderate.skip_1',
    MODERATE_UNBAN: 'moderate.unban_1',
    MODERATE_UPDATE_DESCRIPTION: 'moderate.update_description_1',
    MODERATE_UPDATE_NAME: 'moderate.update_name_1',
    MODERATE_UPDATE_WELCOME: 'moderate.update_welcome_1',
    PLAYLIST_ACTIVATE: 'playlist.activate_1',
    PLAYLIST_CREATE: 'playlist.create_1',
    PLAYLIST_DELETE: 'playlist.delete_1',
    PLAYLIST_MEDIA_DELETE: 'playlist.media.delete_1',
    PLAYLIST_MEDIA_INSERT: 'playlist.media.insert_1',
    PLAYLIST_MEDIA_MOVE: 'playlist.media.move_1',
    PLAYLIST_MEDIA_SHUFFLE: 'playlist.media.shuffle_1',
    PLAYLIST_RENAME: 'playlist.rename_1',
    PLAYLIST_SELECT: 'playlist.select_1',
    REPORT_DISCONNECT: 'report.disconnect_1',
    REPORT_RECONNECT: 'report.reconnect_1',
    ROOM_CAST: 'room.cast_1',
    ROOM_CREATE: 'room.create_1',
    ROOM_CURATE: 'room.curate_1',
    ROOM_CYCLE_BOOTH: 'room.cycle_booth_1',
    ROOM_DETAILS: 'room.details_1',
    ROOM_JOIN: 'room.join_1',
    ROOM_LOCK_BOOTH: 'room.lock_booth_1',
    ROOM_SEARCH: 'room.search_1',
    ROOM_STAFF: 'room.staff_1',
    ROOM_STATE: 'room.state_1',
    USER_CHANGE_NAME: 'user.change_name_1',
    USER_GET_BY_IDS: 'user.get_by_ids_1',
    USER_IGNORING: 'user.ignoring_1',
    USER_NAME_AVAILABLE: 'user.name_available_1',
    USER_PONG: 'user.pong_1',
    USER_SET_AVATAR: 'user.set_avatar_1',
    USER_SET_LANGUAGE: 'user.set_language_1',
    USER_SET_STATUS: 'user.set_status_1'
};
messageTypes = {
    BAN: 'ban',
    BOOTH_CYCLE: 'boothCycle',
    BOOTH_LOCKED: 'boothLocked',
    CHAT: 'chat',
    CHAT_COMMAND: 'command',
    CHAT_DELETE: 'chatDelete',
    CHAT_EMOTE: 'emote',
    COMMAND: 'command',
    CURATE_UPDATE: 'curateUpdate',
    DJ_ADVANCE: 'djAdvance',
    DJ_UPDATE: 'djUpdate',
    EMOTE: 'emote',
    FOLLOW_JOIN: 'followJoin',
    MODERATE_ADD_DJ: 'modAddDJ',
    MODERATE_ADD_WAITLIST: 'modAddWaitList',
    MODERATE_AMBASSADOR: 'modAmbassador',
    MODERATE_BAN: 'modBan',
    MODERATE_MOVE_DJ: 'modMoveDJ',
    MODERATE_REMOVE_DJ: 'modRemoveDJ',
    MODERATE_REMOVE_WAITLIST: 'modRemoveWaitList',
    MODERATE_SKIP: 'modSkip',
    MODERATE_STAFF: 'modStaff',
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
    VOTE_UPDATE: 'voteUpdate',
    VOTE_UPDATE_MULTI: 'voteUpdateMulti'
};
client = null;
ws = null;
p3Socket = null;
initialized = false;
commandPrefix = '!';
apiId = 0;
_this = null;
_key = null;
_updateCode = null;
lastRpcMessage = Date.now();
lastHistoryID = '';
serverRequests = {
    queue: [],
    sent: 0,
    limit: 10,
    running: false
};
room = new Room();
rpcHandlers = {};
logger = {
    pad: function(n) {
        return n < 10 ? '0' + n.toString(10) : n.toString(10);
    },
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    timestamp: function() {
        var d = new Date();
        var time = [this.pad(d.getHours()), this.pad(d.getMinutes()), this.pad(d.getSeconds())
        ].join(':');
        return [d.getDate(), this.months[d.getMonth()], time].join(' ');
    },
    log: function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this.timestamp());
        console.log.apply(console, args);
    }
};

http.OutgoingMessage.prototype.__renderHeaders = http.OutgoingMessage.prototype._renderHeaders;
http.OutgoingMessage.prototype._renderHeaders = function() {
    if (this._header) {
        throw new Error('Can\'t render headers after they are sent to the client.');
    }
    this.setHeader('Cookie', 'usr=\"' + _key + '\"');
    return this.__renderHeaders();
};

function __bind(fn, me) {
    return function() {
        return fn.apply(me, arguments);
    };
}

function intPM(receiver, msg) {
    p3Socket.send({
        type: 'PM',
        value: {
            id: typeof receiver === 'object' ? receiver.id : receiver,
            message: msg
        }
    });
}

function intChat(msg, timeout) {
    var cID = room.self.id.substr(0, 6) + Math.floor(Math.random() * 4294967295).toString(16);
    ws.send('5::/room:' + JSON.stringify({
        name: 'chat',
        args: [
            {
                msg: msg,
                chatID: cID
            }
        ]
    }));
    if (timeout !== undefined && !isNaN(~~timeout) && ~~timeout > 0) {
        setTimeout(function() {
            _this.moderateDeleteChat(cID);
        }, ~~timeout * 1E3);
    }
}

/**
 DateUtilities
 Copyright (C) 2014 by Plug DJ, Inc.
 Modified by TAT (TAT@plugCubed.net)
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
    getSecondsElapsed: function(e) {
        return !e || e == '0' ? 0 : this.secondsSince(new Date(e.substr(0, e.indexOf('.'))));
    },
    convertUnixDateStringToDate: function(e) {
        return e ? new Date(e.substr(0, 4), Number(e.substr(5, 2)) - 1, e.substr(8, 2), e.substr(11, 2), e.substr(14, 2), e.substr(17, 2)) : null;
    }
};

function queueTicker() {
    serverRequests.running = true;
    var canSend = serverRequests.sent < serverRequests.limit, obj = serverRequests.queue.pop();
    if (canSend && obj) {
        serverRequests.sent++;
        if (obj.type == 'rpc') {
            sendRPC(obj);
        } else if (obj.type == 'gateway') {
            sendGateway(obj.opts, obj.callbacks.success, obj.callbacks.failure);
        } else if (obj.type == 'connect') {
            if (obj.server == 'socket') {
                connectSocket(obj.room);
            } else if (obj.server == 'chat') {
                connectChat(obj.room);
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

function queueRPC(name, args, callback, skipQueue) {
    args = args === undefined ? [] : args;
    if (!util.isArray(args)) {
        args = [args];
    }
    var rpcId = ++apiId, sendArgs = {
        type: 'rpc',
        id: rpcId,
        name: name,
        args: args
    };
    rpcHandlers[rpcId] = {
        callback: callback,
        type: name,
        args: args
    };
    if (skipQueue && skipQueue === true) {
        sendRPC(sendArgs);
    } else {
        serverRequests.queue.push(sendArgs);
        if (!serverRequests.running) {
            queueTicker();
        }
    }
}

function sendRPC(args) {
    client.send(args);
}

function queueGateway(name, args, successCallback, failureCallback, skipQueue) {
    args = args === undefined ? [] : args;

    if (!util.isArray(args)) {
        args = [args];
    }

    successCallback = typeof successCallback === 'function' ? __bind(successCallback, _this) : function() {
    };
    failureCallback = typeof failureCallback === 'function' ? __bind(failureCallback, _this) : function() {
        // Retry
        queueGateway(name, args, successCallback);
    };

    var bodyString, opts;

    bodyString = JSON.stringify({
        service: name,
        body: args
    });

    opts = {
        method: 'POST',
        url: 'http://plug.dj/_/gateway/' + name,
        headers: {
            'User-Agent': 'plugAPI_' + PlugAPIInfo.version,
            Accept: 'application/json, text/javascript, */*; q=0.01',
            Cookie: 'usr=' + _key,
            'Content-Type': 'application/json'
        },
        body: bodyString
    };

    if (skipQueue && skipQueue === true) {
        sendGateway(opts, successCallback, failureCallback);
    } else {
        serverRequests.queue.push({
            type: 'gateway',
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

function sendGateway(opts, successCallback, failureCallback) {
    request(opts, function(err, res, body) {
        if (err) {
            if (typeof failureCallback === 'function') {
                failureCallback(err);
            }
            logger.log('[Gateway Error]', err);
            return;
        }
        try {
            body = JSON.parse(body);
            if (body.status === 0) {
                successCallback(body.body);
            } else {
                failureCallback(body.body);
            }
        } catch (e) {
            failureCallback(e);
            logger.log('[Gateway Error]', e);
        }
    });
}

function getUpdateCode(callback) {
    request({
        url: 'https://d1rfegul30378.cloudfront.net/updatecode.txt',
        headers: {
            'Accept-Encoding': 'gzip'
        },
        encoding: null
    }, function(err, res, body) {
        zlib.unzip(body, function(err, data) {
            _updateCode = data.toString();
            if (typeof callback === 'function') {
                callback();
            }
        });
    });
}

function joinRoom(name, callback) {
    var execute = function() {
        queueRPC(rpcNames.ROOM_JOIN, [name, _updateCode], function(data) {
            if (data.status) {
                if (data.status === 999) {
                    logger.log('Error while joining:', data.result ? data.result : 'Unknown error');
                    setTimeout(function() {
                        joinRoom(name, callback);
                    }, 1e3);
                    return;
                } else {
                    throw new Error('Wrong updateCode');
                }
            }
            DateUtilities.setServerTime(data.serverTime);
            queueGateway(rpcNames.ROOM_DETAILS, [name], function(data) {
                initRoom(data, function() {
                    if (typeof callback !== 'undefined') {
                        callback(data);
                    }
                });
            });
        });
    };
    if (_updateCode === null) {
        getUpdateCode(execute);
    } else {
        execute();
    }
}

function send(data) {
    return client.send(data);
}

function receivedChatMessage(m) {
    if (!initialized) return;
    m.message = encoder.htmlDecode(m.message);

    if ((m.type == 'message' || m.type == 'pm') && m.message.indexOf(commandPrefix) === 0 && (_this.processOwnMessages || m.from.id != room.self.id)) {
        if (typeof _this.preCommandHandler === 'function' && _this.preCommandHandler(m) === false) return;
        var i, isPM = m.type == 'pm', cmd = m.message.substr(1).split(' ')[0], obj = {
            message: m,
            chatID: m.chatID,
            from: room.getUser(m.fromID),
            command: cmd,
            args: m.message.substr(2 + cmd.length),
            mentions: [],
            respond: function() {
                var message = Array.prototype.slice.call(arguments).join(' ');
                if (isPM) {
                    return intPM(this.from, message);
                }
                return _this.sendChat('@' + m.from + ' ' + message);
            },
            respondTimeout: function() {
                var args = Array.prototype.slice.call(arguments), timeout = args.splice(args.length - 1, 1), message = args.join(' ');
                if (isPM) {
                    return intPM(this.from, message);
                }
                return _this.sendChat('@' + m.from + ' ' + message, timeout);
            },
            havePermission: function(permission, success, failure) {
                if (permission === undefined) permission = 0;
                var havePermission = room.getUser(m.fromID) !== undefined && room.getUser(m.fromID).permission >= permission;
                if (havePermission && typeof success === 'function') {
                    success();
                } else if (!havePermission && typeof failure === 'function') {
                    failure();
                }
                return havePermission;
            },
            isFrom: function(ids, success, failure) {
                if (typeof ids === 'string') ids = [ids];
                if (ids === undefined || !util.isArray(ids)) {
                    if (typeof failure === 'function') {
                        failure();
                    }
                    return false;
                }
                var isFrom = ids.indexOf(m.fromID) > -1;
                if (isFrom && typeof success === 'function') {
                    success();
                } else if (!isFrom && typeof failure === 'function') {
                    failure();
                }
                return isFrom;
            }
        }, lastIndex = obj.args.indexOf('@'), allUsers = room.getUsers(), random = Math.ceil(Math.random() * 1E10);
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
        obj.args = obj.args.split(' ');
        for (i in obj.mentions) {
            if (obj.mentions.hasOwnProperty(i)) {
                obj.args[obj.args.indexOf('%MENTION-' + random + '-' + i + '%')] = obj.mentions[i];
            }
        }
        _this.emit(messageTypes.CHAT_COMMAND, obj);
        _this.emit(messageTypes.CHAT_COMMAND + ':' + cmd, obj);
        _this.moderateDeleteChat(m.chatID);
    } else if (m.type == 'emote') {
        _this.emit(messageTypes.CHAT_EMOTE, m);
    }
    if (m.type == 'pm') {
        _this.emit('pm', m);
    } else {
        _this.emit(messageTypes.CHAT, m);
        _this.emit(messageTypes.CHAT + ':' + m.type, m);
        if (room.getUser() !== null && m.message.indexOf('@' + room.getUser().username) > -1) {
            _this.emit(messageTypes.CHAT + ':mention', m);
            _this.emit('mention', m);
        }
    }
}

function queueConnectChat(roomId) {
    serverRequests.queue.push({
        type: 'connect',
        server: 'chat',
        room: roomId
    });
    if (!serverRequests.running) {
        queueTicker();
    }
}

function connectChat(roomId) {
    var opts = {
        url: 'https://sio2.plug.dj/socket.io/1/?t=' + Date.now(),
        headers: {
            'User-Agent': 'plugAPI_' + PlugAPIInfo.version,
            Cookie: 'usr=' + _key
        }
    };
    request(opts, function(err, res, body) {
        if (err) {
            logger.log('[Chat Server] Error while connecting:', err);
            process.nextTick(function() {
                logger.log('[Chat Server] Reconnecting');
                queueConnectChat(roomId);
            });
            return;
        }
        var sockId = body.split(':')[0], sockUrl = 'wss://sio2.plug.dj/socket.io/1/websocket/' + sockId;
        ws = new WebSocket(sockUrl);
        ws.on('open', function() {
            logger.log('[Chat Server] Connected');
            this.send('1::/room');
            var roomOpts = {
                name: 'join',
                args: [roomId]
            };
            this.send('5::/room:' + JSON.stringify(roomOpts));
        });
        ws.on('message', function(data) {
            // Heartbeat
            if (data == '2::') this.send('2::');
            // Messages (including chat)
            if (data.match(/^5::\/room:/)) {
                var mStr = data.split('5::/room:')[1];
                var m = JSON.parse(mStr).args[0];

                receivedChatMessage(m);
            }
        });
        ws.on('error', function(a) {
            logger.log('[Chat Server] Error:', a);
            process.nextTick(function() {
                logger.log('[Chat Server] Reconnecting');
                queueConnectChat(_this.roomId ? _this.roomId : roomId);
            });
        });
        ws.on('close', function(a) {
            logger.log('[Chat Server] Closed with code', a);
            process.nextTick(function() {
                logger.log('[Chat Server] Reconnecting');
                queueConnectChat(_this.roomId ? _this.roomId : roomId);
            });
        });
    });
}

function queueConnectSocket(roomId) {
    serverRequests.queue.push({
        type: 'connect',
        server: 'socket',
        room: roomId
    });
    if (!serverRequests.running) {
        queueTicker();
    }
}

function connectSocket(roomId) {
    apiId = 0;
    rpcHandlers = {};
    client = SockJS.create('https://sjs.plug.dj/plug');
    client.send = function(data) {
        return this.write(JSON.stringify(data));
    };
    client.on('error', function(e) {
        logger.log('[Socket Server] Error:', e);
        process.nextTick(function() {
            logger.log('[Socket Server] Reconnecting');
            queueConnectSocket(_this.roomId ? _this.roomId : roomId);
        });
    });
    client.on('data', dataHandler);
    client.on('data', function(data) {
        return _this.emit('tcpMessage', data);
    });
    client.on('close', function() {
        logger.log('[Socket Server] Closed');
        process.nextTick(function() {
            logger.log('[Socket Server] Reconnecting');
            queueConnectSocket(_this.roomId ? _this.roomId : roomId);
        });
    });
    return client.on('connection', function() {
        logger.log('[Socket Server] Connected');
        if (roomId) {
            joinRoom(roomId);
        }
        _this.emit('connected');
        _this.emit('server:socket:connected');
        return _this.emit('tcpConnect', client);
    });
}

function connectPlugCubedSocket() {
    var validated = false;
    p3Socket = SockJS.create('https://socket.plugcubed.net/gateway');
    p3Socket.send = function(data) {
        var msg = JSON.stringify(data);
        return this.write(msg);
    };
    p3Socket.on('error', function(e) {
        logger.log('[p3Socket Server] Error:', e);
        process.nextTick(function() {
            logger.log('[p3Socket Server] Reconnecting');
            connectPlugCubedSocket();
        });
    });
    p3Socket.on('data', function(msg) {
        var obj = JSON.parse(msg), type = obj.type, data = obj.data;
        if (!validated) {
            if (type === 'validate' && data.status === 1) {
                validated = true;
            }
            return;
        }
        if (type === 'pm') {
            if (!data.chatID) return;
            receivedChatMessage(data);
        }
    });
    p3Socket.on('close', function() {
        logger.log('[p3Socket Server] Closed');
        process.nextTick(function() {
            logger.log('[p3Socket Server] Reconnecting');
            connectPlugCubedSocket();
        });
    });
    return p3Socket.on('connection', function() {
        logger.log('[p3Socket Server] Connected');
        _this.emit('server:p3socket:connected');
        var userData = _this.getUser();
        p3Socket.send({
            type: 'userdata',
            id: userData.id,
            username: userData.username,
            room: _this.roomId,
            version: 'plugAPIv' + PlugAPIInfo.version
        });
        return _this.emit('tcpConnect', p3Socket);
    });
}

function initRoom(data, callback) {
    room.reset();
    lastRpcMessage = Date.now();
    if (data.room === undefined || data.user === undefined) {
        return client.close();
    }
    room.setUsers(data.room.users);
    room.setStaff(data.room.staff);
    room.setAmbassadors(data.room.ambassadors);
    room.setAdmins(data.room.admins);
    room.setOwner(data.room.owner);
    room.setSelf(data.user.profile);
    room.setDjs(data.room.djs);
    room.setMedia(data.room.media, data.room.mediaStartTime, data.room.votes, data.room.curates);
    room.boothLocked = data.boothLocked;
    if (historyID !== data.room.historyID) {
        _this.roomId = data.room.id;
        historyID = data.room.historyID;
        _this.emit(messageTypes.DJ_ADVANCE, {
            currentDJ: data.room.currentDJ,
            djs: data.room.djs.splice(1),
            media: room.media.info,
            mediaStartTime: data.room.mediaStartTime,
            historyID: historyID
        });
        queueGateway(rpcNames.HISTORY_SELECT, [data.room.id], __bind(room.setHistory, room));
        if (_this.enablePlugCubedSocket) {
            connectPlugCubedSocket();
        }
        _this.emit(messageTypes.ROOM_JOIN, data.room.name, data);
    }
    initialized = true;
    return callback();
}

function parseRPCReply(name, data) {
    if (name === rpcNames.ROOM_JOIN) {
        _this.emit(messageTypes.ROOM_CHANGE, data);
        if (typeof data.room !== 'undefined' && typeof data.room.historyID !== 'undefined') {
            historyID = data.room.historyID;
            _this.roomId = data.room.id;
            _this.userId = data.user.profile.id;
        }
    }
}

function dataHandler(data) {
    if (typeof data === 'string') {
        data = JSON.parse(data);
    }
    if (data.messages) {
        for (var i = 0; i < data.messages.length; i++)
            messageHandler(data.messages[i]);
        return;
    }
    if (data.type === 'rpc') {
        reply = data.result;
        if (reply) {
            if (data.status !== 0) {
                reply = data;
            }
            if (rpcHandlers[data.id] != null && typeof rpcHandlers[data.id].callback === 'function') {
                rpcHandlers[data.id].callback(reply);
            }
            parseRPCReply(rpcHandlers[data.id] != null ? rpcHandlers[data.id].type : undefined, reply);
            delete rpcHandlers[data.id];
        }
    }
}

function messageHandler(msg) {
    switch (msg.type) {
        case messageTypes.PING:
            queueRPC(rpcNames.USER_PONG);
            break;
        case messageTypes.MODERATE_STAFF:
            for (var i in msg.data.users) {
                // Be sure the user exists
                if (msg.data.users[i].user && msg.data.users[i].user.id)
                    room.staff[msg.data.users[i].user.id] = msg.data.users[i].permission;
            }
            room.setPermissions();
            break;
        case messageTypes.USER_JOIN:
            room.addUser(msg.data);
            lastRpcMessage = Date.now();
            break;
        case messageTypes.USER_LEAVE:
            room.remUser(msg.data.id);
            lastRpcMessage = Date.now();
            break;
        case messageTypes.VOTE_UPDATE:
            room.logVote(msg.data.id, msg.data.vote === 1 ? 'woot' : 'meh');
            lastRpcMessage = Date.now();
            break;
        case messageTypes.DJ_UPDATE:
            room.setDjs(msg.data.djs);
            lastRpcMessage = Date.now();
            break;
        case messageTypes.DJ_ADVANCE:
            var djAdvanceEvent = {
                dj: msg.data.djs[0],
                lastPlay: {
                    dj: _this.getDJ(),
                    media: _this.getMedia(),
                    score: _this.getRoomScore()
                },
                media: msg.data.media,
                mediaStartTime: msg.data.mediaStartTime,
                earn: msg.data.earn
            };
            var lastPlay = room.getMedia();
            room.setDjs(msg.data.djs);
            room.djAdvance(msg.data);
            historyID = msg.data.historyID;
            lastRpcMessage = Date.now();
            _this.emit(msg.type, djAdvanceEvent);
            return;
        case messageTypes.CURATE_UPDATE:
            room.logVote(msg.data.id, 'curate');
            lastRpcMessage = Date.now();
            break;
        case messageTypes.USER_UPDATE:
            room.updateUser(msg.data);
            break;
        case void 0:
            logger.log('UNKNOWN MESSAGE FORMAT', msg);
    }
    if (msg.type) {
        _this.emit(msg.type, msg.data);
    }
}

var PlugAPI = function(key) {
    if (!key) {
        throw new Error('You must pass the authentication cookie into the PlugAPI object to connect correctly');
    }
    _this = this;
    _key = key;

    this.multiLine = false;
    this.multiLineLimit = 5;
    this.roomId = null;
    this.enablePlugCubedSocket = false;
    this.processOwnMessages = false;

    room.User.prototype.addToWaitlist = function() {
        console.error('Using deprecated addToWaitlist - change to addToWaitList');
        _this.moderateAddDJ(this.id);
    };
    room.User.prototype.addToWaitList = function() {
        _this.moderateAddDJ(this.id);
    };
    room.User.prototype.removeFromWaitlist = function() {
        console.error('Using deprecated removeFromWaitlist - change to removeFromWaitList');
        _this.moderateAddDJ(this.id);
    };
    room.User.prototype.removeFromWaitList = function() {
        _this.moderateRemoveDJ(this.id);
    };
    room.User.prototype.moveInWaitList = function(pos) {
        _this.moderateMoveDJ(this.id, pos);
    };

    this.ROLE = {
        NONE: 0,
        RESIDENTDJ: 1,
        BOUNCER: 2,
        MANAGER: 3,
        COHOST: 4,
        HOST: 5,
        AMBASSADOR: 8,
        ADMIN: 10
    };

    this.STATUS = {
        AVAILABLE: 0,
        AFK: 1,
        WORKING: 2,
        GAMING: 3
    };

    this.BAN = {
        HOUR: 60,
        DAY: 1440,
        PERMA: -1
    };

    this.messageTypes = messageTypes;

    this.preCommandHandler = function() {
        return true;
    };

    // Logger
    this.log = __bind(logger.log, logger);

    logger.log('Running plugAPI v.' + PlugAPIInfo.version);
};

util.inherits(PlugAPI, EventEmitter);

PlugAPI.prototype.getTwitterAuth = function(username, password, callback) {
    if (!username || !password) throw new Error('Missing arguments');
    var creds, module;
    if (typeof password === 'string') {
        // 2.1.0 and later
        creds = {
            username: username,
            password: password
        };
        if (!callback || typeof callback !== 'function') {
            throw new Error('Missing callback');
        }
    } else {
        console.error('Using deprecated parameters for getTwitterAuth - please update.');
        // Pre-2.1.0
        creds = username;
        callback = password;

        if (!callback || typeof callback !== 'function') {
            throw new Error('Missing callback');
        }
    }
    try {
        module = require('plug-dj-login');
    } catch (e) {
        throw new Error('Error loading module plug-dj-login. Try running `npm install plug-dj-login`.');
    }
    module(creds, function(err, cookie) {
        if (err) {
            callback(err, null);
            return;
        }

        var cookieVal = cookie.value;
        cookieVal = cookieVal.replace(/^"/, '').replace(/"$/, '');
        callback(null, cookieVal);
    });
};

PlugAPI.prototype.close = function() {
    client.removeAllListeners('close');
    client.close();
    ws.removeAllListeners('close');
    ws.close();
    if (this.enablePlugCubedSocket) {
        p3Socket.removeAllListeners('close');
        p3Socket.close();
    }
};

PlugAPI.prototype.setCommandPrefix = function(a) {
    if (!a || typeof a !== 'string' || a.length < 1) {
        return false;
    }
    commandPrefix = a;
    return true;
};

PlugAPI.prototype.setLogObject = function(a) {
    console.error('Using deprecated setLogObject - change to setLogger');
    return this.setLogger(a);
};

PlugAPI.prototype.setLogger = function(a) {
    if (a && typeof a === 'object' && !util.isArray(a) && typeof a.log === 'function') {
        this.logger = a;
        return true;
    }
    return false;
};

PlugAPI.prototype.connect = function(a) {
    if (!a || typeof a !== 'string' || a.length === 0 || a.indexOf('/') > -1) {
        throw new Error('Invalid room name');
    }
    queueConnectChat(a);
    queueConnectSocket(a);
};

PlugAPI.prototype.sendChat = function(msg, timeout) {
    if (msg.length > 235 && this.multiLine) {
        var lines = msg.replace(/.{235}\S*\s+/g, '$&¤').split(/\s+¤/);
        for (var i = 0; i < lines.length; i++) {
            msg = lines[i];
            if (i > 0) {
                msg = '(continued) ' + msg;
            }
            intChat(msg, timeout);
            if (i + 1 >= this.multiLineLimit) {
                break;
            }
        }
    } else {
        intChat(msg, timeout);
    }
};

PlugAPI.prototype.sendPM = function(receiver, msg) {
    return intPM(receiver, msg);
};

PlugAPI.prototype.woot = function(callback) {
    queueGateway(rpcNames.ROOM_CAST, [true, historyID, lastHistoryID === historyID], callback);
    return lastHistoryID = historyID;
};

PlugAPI.prototype.meh = function(callback) {
    queueGateway(rpcNames.ROOM_CAST, [false, historyID, lastHistoryID === historyID], callback);
    return lastHistoryID = historyID;
};

PlugAPI.prototype.getHistory = function(callback) {
    if (typeof callback !== 'function') throw new Error('You must specify callback!');
    if (initialized) {
        var history = room.getHistory();
        if (history.length > 1) {
            callback(history);
            return;
        }
    }
    setImmediate(function() {
        _this.getHistory(callback);
    });
};

PlugAPI.prototype.isUsernameAvailable = function(name, callback) {
    return queueGateway(rpcNames.USER_NAME_AVAILABLE, [name], callback);
};

PlugAPI.prototype.changeUsername = function(name, callback) {
    return queueGateway(rpcNames.USER_CHANGE_NAME, [name], callback);
};

PlugAPI.prototype.changeRoomName = function(name, callback) {
    if (!this.roomId || !this.havePermission(undefined, this.ROLE.COHOST)) {
        return false;
    }
    queueGateway(rpcNames.MODERATE_UPDATE_NAME, [name], callback);
    return true;
};

PlugAPI.prototype.changeRoomDescription = function(description, callback) {
    if (!this.roomId || !this.havePermission(undefined, this.ROLE.COHOST)) {
        return false;
    }
    queueGateway(rpcNames.MODERATE_UPDATE_DESCRIPTION, [description], callback);
    return true;
};

PlugAPI.prototype.changeDJCycle = function(enabled, callback) {
    if (!this.roomId || !this.havePermission(undefined, this.ROLE.MANAGER)) {
        return false;
    }
    queueGateway(rpcNames.ROOM_CYCLE_BOOTH, [this.roomId, enabled], callback);
    return true;
};

PlugAPI.prototype.getTimeElapsed = function() {
    if (!this.roomId || room.getMedia() == null) {
        return -1;
    }
    return Math.min(room.getMedia().duration, DateUtilities.getSecondsElapsed(room.getMediaStartTime()));
};

PlugAPI.prototype.getTimeRemaining = function() {
    if (!this.roomId || room.getMedia() == null) {
        return -1;
    }
    return room.getMedia().duration - this.getTimeElapsed();
};

PlugAPI.prototype.joinBooth = function(callback) {
    if (!this.roomId || room.isDJ() || room.isInWaitList() || (room.boothLocked && !this.havePermission(undefined, this.ROLE.RESIDENTDJ)) || this.getDJs().length >= 50) {
        return false;
    }
    queueGateway(rpcNames.BOOTH_JOIN, [], callback);
    return true;
};

PlugAPI.prototype.leaveBooth = function(callback) {
    if (!this.roomId || (!room.isDJ() && !room.isInWaitList())) {
        return false;
    }
    queueGateway(rpcNames.BOOTH_LEAVE, [], callback);
    return true;
};

PlugAPI.prototype.moderateAddDJ = function(userId, callback) {
    if (!this.roomId || !this.havePermission(undefined, this.ROLE.BOUNCER) || room.isDJ(userId) || room.isInWaitList(userId) || (room.boothLocked && !this.havePermission(undefined, this.ROLE.MANAGER))) {
        return false;
    }
    queueGateway(rpcNames.MODERATE_ADD_DJ, userId, callback);
    return true;
};

PlugAPI.prototype.moderateRemoveDJ = function(userId, callback) {
    if (!this.roomId || !this.havePermission(undefined, this.ROLE.BOUNCER) || (!room.isDJ(userId) && !room.isInWaitList(userId)) || (room.boothLocked && !this.havePermission(undefined, this.ROLE.MANAGER))) {
        return false;
    }
    queueGateway(rpcNames.MODERATE_REMOVE_DJ, userId, callback);
    return true;
};

PlugAPI.prototype.moderateMoveDJ = function(userId, index, callback) {
    if (!this.roomId || !this.havePermission(undefined, this.ROLE.MANAGER) || !room.isInWaitList(userId) || isNaN(index)) {
        return false;
    }
    queueGateway(rpcNames.MODERATE_MOVE_DJ, [userId, index > 50 ? 50 : index < 1 ? 1 : index], callback);
    return true;
};

PlugAPI.prototype.moderateBanUser = function(userId, reason, duration, callback) {
    if (!this.roomId || !this.havePermission(undefined, this.ROLE.BOUNCER))
        return false;
    reason = String(reason || 1);
    if (!duration)
        duration = this.BAN.PERMA;
    if (duration === this.BAN.PERMA && this.havePermission(undefined, this.ROLE.BOUNCER) && !this.havePermission(undefined, this.ROLE.MANAGER))
        duration = this.BAN.DAY;
    queueGateway(rpcNames.MODERATE_BAN, [userId, reason, duration], callback);
    return true;
};

PlugAPI.prototype.moderateUnBanUser = function(userId, callback) {
    console.error('Using deprecated moderateUnBanUser - change to moderateUnbanUser');
    return this.moderateUnbanUser(userId, callback);
};

PlugAPI.prototype.moderateUnbanUser = function(userId, callback) {
    if (!this.roomId || !this.havePermission(undefined, this.ROLE.MANAGER))
        return false;
    queueGateway(rpcNames.MODERATE_UNBAN, [userId], callback);
    return true;
};

PlugAPI.prototype.moderateForceSkip = function(callback) {
    if (!this.roomId || !this.havePermission(undefined, this.ROLE.BOUNCER) || room.getDJ() === null)
        return false;
    queueGateway(rpcNames.MODERATE_SKIP, [room.getDJ().id, historyID], callback);
    return true;
};

PlugAPI.prototype.moderateDeleteChat = function(chatID, callback) {
    if (!this.roomId || !this.havePermission(undefined, this.ROLE.BOUNCER))
        return false;
    queueGateway(rpcNames.MODERATE_CHAT_DELETE, [chatID], callback, undefined, true);
    return true;
};

PlugAPI.prototype.moderateLockWaitList = function(locked, clear, callback) {
    return this.moderateLockBooth(locked, clear, callback);
};

PlugAPI.prototype.moderateSetRole = function(userId, role, callback) {
    if (!this.roomId || this.getUser(userId) === null || isNaN(role))
        return false;
    queueGateway(rpcNames.MODERATE_PERMISSIONS, [userId, role], callback);
    return true;
};

PlugAPI.prototype.moderateLockBooth = function(locked, clear, callback) {
    if (!this.roomId || this.getUser() === null || !this.havePermission(undefined, this.ROLE.MANAGER) || (locked === room.boothLocked && !clear))
        return false;
    queueGateway(rpcNames.ROOM_LOCK_BOOTH, [this.roomId, locked, clear], callback);
    return true;
};

PlugAPI.prototype.getUsers = function() {
    return room.getUsers();
};

PlugAPI.prototype.getUser = function(userId) {
    return room.getUser(userId);
};

PlugAPI.prototype.getAudience = function(name) {
    return room.getAudience();
};

PlugAPI.prototype.getDJ = function() {
    return room.getDJ();
};

PlugAPI.prototype.getDJs = function() {
    return room.getDJs();
};

PlugAPI.prototype.getStaff = function() {
    return room.getStaff();
};

PlugAPI.prototype.getAdmins = function() {
    return room.getAdmins();
};

PlugAPI.prototype.getHost = function() {
    return room.getHost();
};

PlugAPI.prototype.getSelf = function() {
    return room.getSelf();
};

PlugAPI.prototype.getWaitList = function() {
    return room.getWaitList();
};

PlugAPI.prototype.getWaitListPosition = function(userId) {
    return room.getWaitListPosition(userId);
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

PlugAPI.prototype.createPlaylist = function(name, callback) {
    if (!this.roomId || !name)
        return false;
    queueGateway(rpcNames.PLAYLIST_CREATE, name, callback);
    return true;
};

PlugAPI.prototype.addSongToPlaylist = function(playlistId, songId, callback) {
    if (!this.roomId || !playlistId || !songId)
        return false;
    queueGateway(rpcNames.PLAYLIST_MEDIA_INSERT, [playlistId, null, -1, [songId]], callback);
    return true;
};

PlugAPI.prototype.getPlaylists = function(callback) {
    if (!this.roomId)
        return false;
    queueGateway(rpcNames.PLAYLIST_SELECT, [new Date(0).toISOString().replace('T', ' '), null, 100, null], callback);
    return true;
};

PlugAPI.prototype.activatePlaylist = function(playlist_id, callback) {
    if (!this.roomId || !playlist_id)
        return false;
    queueGateway(rpcNames.PLAYLIST_ACTIVATE, [playlist_id], callback);
    return true;
};

PlugAPI.prototype.playlistMoveSong = function(playlist, song_id, position, callback) {
    if (!this.roomId)
        return false;
    queueGateway(rpcNames.PLAYLIST_MEDIA_MOVE, [
        playlist.id, playlist.items[position], [song_id]
    ], callback);
    return true;
};

PlugAPI.prototype.setAvatar = function(avatar, callback) {
    queueGateway(rpcNames.USER_SET_AVATAR, [avatar], callback);
    return true;
};

PlugAPI.prototype.havePermission = function(userid, permission) {
    var user = this.getUser(userid);
    return !(user == null || user.permission < permission);
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