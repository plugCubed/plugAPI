// Node.JS Core Modules
var net, http, util, zlib;
net = require('net');
http = require('http');
util = require('util');
zlib = require('zlib');

// Third-party modules
var EventEmitter, SockJS, request, WebSocket, encoder;
EventEmitter = require('eventemitter2').EventEmitter2;
SockJS = require('sockjs-client-node');
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
require('../colors.js');

// plugAPI
var Room, PlugAPIInfo;
Room = require('./room');
PlugAPIInfo = require('../package.json');
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
    USER_SET_STATUS: 'users/status'
};

var eventTypes = {
    ADVANCE: 'advance',
    BAN: 'ban',
    BOOTH_CYCLE: 'boothCycle',
    BOOTH_LOCKED: 'boothLocked',
    CHAT: 'chat',
    CHAT_COMMAND: 'command',
    CHAT_DELETE: 'chatDelete',
    CHAT_EMOTE: 'emote',
    COMMAND: 'command',
    DJ_LIST_UPDATE: 'djListUpdate',
    EMOTE: 'emote',
    FOLLOW_JOIN: 'followJoin',
    GRAB: 'grab',
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
 * That is this and this is that
 * @type {PlugAPI}
 */
var that = null;

var ws, p3Socket, initialized, commandPrefix, apiId, _authCode, _cookies, chatHistory, historyID, serverRequests, room, connectingRoomSlug, rpcHandlers, logger;
ws = null;
p3Socket = null;
initialized = false;
commandPrefix = '!';
apiId = 0;
chatHistory = [];
connectingRoomSlug = null;
_authCode = '';
_cookies = {
    cookies: {},
    fromHeaders: function(headers) {
        for (var i in headers) {
            if (!headers.hasOwnProperty(i)) continue;
            if (i == 'set-cookie') {
                for (var j in headers[i]) {
                    if (!headers[i].hasOwnProperty(j)) continue;
                    var cookieString, cookieKeyValue, key, value;

                    cookieString = headers[i][j];
                    cookieKeyValue = cookieString.split(';')[0].split('=');
                    key = cookieKeyValue.shift();
                    value = cookieKeyValue.join('=');

                    this.cookies[key] = value;
                }
            }
        }
    },
    toString: function() {
        var cookies = [];
        for (var i in this.cookies) {
            if (!this.cookies.hasOwnProperty(i)) continue;
            cookies.push(i + '=' + this.cookies[i]);
        }
        return cookies.join('; ');
    }
};
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
        var time = [this.pad(d.getHours()), this.pad(d.getMinutes()), this.pad(d.getSeconds())].join(':');
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
    this.setHeader('Cookie', _cookies.toString());
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
    ws.sendEvent('chat', msg);
    if (timeout !== undefined && !isNaN(timeout) && ~~timeout > 0) {
        var specificChatDeleter = function(data) {
            if (data.uid == room.getSelf().id && data.message.trim() == msg.trim()) {
                setTimeout(function() {
                    that.moderateDeleteChat(data.cid);
                }, ~~timeout * 1E3);
                that.off('chat', specificChatDeleter);
            }
        };
        that.on('chat', specificChatDeleter);
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
        var t = this.ServerDate(),
            n = t.getTime(),
            r = e.getTime(),
            i = 864e5,
            s = (n - r) / i,
            o = (n - r) % i / i;
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

function queueTicker() {
    serverRequests.running = true;
    var canSend = serverRequests.sent < serverRequests.limit,
        obj = serverRequests.queue.pop();
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

function queueREST(method, endpoint, data, successCallback, failureCallback, skipQueue) {
    if (['POST', 'PUT', 'GET', 'DELETE'].indexOf(method) < 0) {
        console.error(method, 'needs update'.red);
        return;
    }

    successCallback = typeof successCallback === 'function' ? __bind(successCallback, that) : function() {};
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

function sendREST(opts, successCallback, failureCallback) {
    request(opts, function(err, res, body) {
        if (err) {
            logger.log('[REST Error]'.red, err);
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
            logger.log('[REST Error]'.red, e);
            failureCallback(e);
        }
    });
}

function joinRoom(roomSlug, callback) {
    queueREST('POST', 'rooms/join', {
        slug: roomSlug
    }, function() {
        queueREST('GET', 'rooms/state', undefined, function(data) {
            // TODO: Remove debugging
            require('fs').writeFileSync('roomState.json', JSON.stringify(data[0], null, 4));

            connectingRoomSlug = null;
            initRoom(data[0], function() {
                if (typeof callback === 'function') {
                    callback(data);
                }
            });
        });
    }, function(status) {
        logger.log('Error while joining:'.red, status ? status : 'Unknown error');
        setTimeout(function() {
            joinRoom(roomSlug, callback);
        }, 1e3);
    });
}

function send(data) {
    return client.send(data);
}

function receivedChatMessage(m) {
    var i, isPM, cmd, obj, lastIndex, allUsers, random;
    if (!initialized) return;

    m.message = encoder.htmlDecode(m.message);

    if ((m.type == 'message' || m.type == 'pm') && m.message.indexOf(commandPrefix) === 0 && (that.processOwnMessages || m.uid !== room.getSelf().id)) {
        if (typeof that.preCommandHandler === 'function' && that.preCommandHandler(m) === false) return;

        isPM = m.type == 'pm';
        cmd = m.message.substr(commandPrefix.length).split(' ')[0];
        obj = {
            raw: m,
            cid: m.cid,
            from: room.getUser(m.uid),
            command: cmd,
            args: m.message.substr(commandPrefix.length + cmd.length + 1),
            mentions: [],
            respond: function() {
                var message = Array.prototype.slice.call(arguments).join(' ');
                if (isPM) {
                    return intPM(this.from, message);
                }
                return that.sendChat('@' + m.un + ' ' + message);
            },
            respondTimeout: function() {
                var args = Array.prototype.slice.call(arguments),
                    timeout = args.splice(args.length - 1, 1),
                    message = args.join(' ');
                if (isPM) {
                    return intPM(this.from, message);
                }
                return that.sendChat('@' + m.un + ' ' + message, timeout);
            },
            haveRoomPermission: function(permission, success, failure) {
                if (permission === undefined) permission = 0;
                if (this.from.role >= permission) {
                    if (typeof success === 'function') {
                        success();
                    }
                    return true;
                }
                if (typeof failure === 'function') {
                    failure();
                }
                return false;
            },
            isFrom: function(ids, success, failure) {
                if (typeof ids === 'string') ids = [ids];
                if (ids === undefined || !util.isArray(ids)) {
                    if (typeof failure === 'function') {
                        failure();
                    }
                    return false;
                }
                var isFrom = ids.indexOf(m.uid) > -1;
                if (isFrom && typeof success === 'function') {
                    success();
                } else if (!isFrom && typeof failure === 'function') {
                    failure();
                }
                return isFrom;
            }
        };
        lastIndex = obj.args.indexOf('@');
        allUsers = room.getUsers();
        random = Math.ceil(Math.random() * 1E10);
        while (lastIndex > -1) {
            var test = obj.args.substr(lastIndex),
                found = null;
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
        for (i in obj.args) {
            if (!obj.args.hasOwnProperty(i)) continue;
            if (!isNaN(obj.args[i])) obj.args[i] = ~~obj.args[i];
        }
        for (i in obj.mentions) {
            if (obj.mentions.hasOwnProperty(i)) {
                obj.args[obj.args.indexOf('%MENTION-' + random + '-' + i + '%')] = obj.mentions[i];
            }
        }
        that.emit(eventTypes.CHAT_COMMAND, obj);
        that.emit(eventTypes.CHAT_COMMAND + ':' + cmd, obj);
        if (that.deleteCommands) {
            that.moderateDeleteChat(m.cid);
        }
    } else if (m.type == 'emote') {
        that.emit(eventTypes.CHAT_EMOTE, m);
    }
    if (m.type == 'pm') {
        that.emit('pm', m);
    } else {
        that.emit(eventTypes.CHAT, m);
        that.emit(eventTypes.CHAT + ':' + m.type, m);
        if (room.getUser() !== null && m.message.indexOf('@' + room.getUser().username) > -1) {
            that.emit(eventTypes.CHAT + ':mention', m);
            that.emit('mention', m);
        }
    }
}

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

function getAuthCode(callback) {
    request({
        url: 'https://plug.dj/',
        headers: {
            'User-Agent': 'plugAPI_' + PlugAPIInfo.version,
            Cookie: _cookies.toString()
        }
    }, function(err, res, body) {
        if (err) {
            console.log('[ERROR] Error getting auth code:'.red, err);
        } else {
            _authCode = body.split('_jm')[1].split('"')[1];
            var _st = body.split('_st')[1].split('"')[1];
            DateUtilities.setServerTime(_st);
            callback();
        }
    });
}

function connectSocket(roomSlug) {
    if (_authCode === null) {
        getAuthCode(function() {
            connectSocket(roomSlug);
        });
        return;
    }
    apiId = 0;
    rpcHandlers = {};

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
        logger.log('[Socket Server] Connected'.green);
        ws.sendEvent('auth', _authCode);

        that.emit('connected');
        that.emit('server:socket:connected');
    });
    ws.on('message', function(data) {
        var type = data.slice(0, 1),
            payload;
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
        logger.log('[Socket Server] Error:'.red, a);
        process.nextTick(function() {
            logger.log('[Socket Server] Reconnecting');
            queueConnectSocket(room.meta.slug ? room.meta.slug : roomSlug);
        });
    });
    ws.on('close', function(a) {
        logger.log('[Socket Server] Closed with code'.red, a);
        process.nextTick(function() {
            logger.log('[Socket Server] Reconnecting');
            queueConnectSocket(room.meta.slug ? room.meta.slug : roomSlug);
        });
    });
}

function initRoom(data, callback) {
    room.reset();
    room.setRoomData(data);
    that.emit(eventTypes.ADVANCE, {
        currentDJ: room.getDJ(),
        djs: room.getDJs(),
        lastPlay: {
            dj: null,
            media: null,
            score: null
        },
        media: data.playback.media,
        startTime: data.playback.startTime,
        historyID: data.playback.historyID
    });
    queueREST('GET', 'rooms/history', undefined, __bind(room.setHistory, room));
    that.emit(eventTypes.ROOM_JOIN, data.meta.name);
    initialized = true;
    return callback();
}

function messageHandler(msg) {
    switch (msg.a) {
        case 'ack':
            queueREST('GET', 'users/me', null, function(a) {
                room.setSelf(a[0]);
                joinRoom(connectingRoomSlug);
            });
            break;
        case eventTypes.CHAT:
            chatHistory.push(msg.p);

            // If over limit, remove the first item
            if (chatHistory.length > 512) chatHistory.shift();

            receivedChatMessage(msg.p);
            return;
        case eventTypes.CHAT_DELETE:
            for (var i in chatHistory) {
                if (!chatHistory.hasOwnProperty(i)) continue;
                if (chatHistory[i].cid == msg.p.c) chatHistory.splice(i, 1);
            }
            break;
        case eventTypes.USER_JOIN:
            room.addUser(msg.p);
            break;
        case eventTypes.USER_LEAVE:
            var userData = room.getUser(msg.p);
            if (userData == null) {
                userData = {
                    id: msg.p
                };
            }
            room.removeUser(msg.p);
            that.emit(msg.a, userData);
            return;
        case eventTypes.USER_UPDATE:
            room.updateUser(msg.p);
            that.emit(msg.a, that.getUser(msg.p.i));
            return;
        case eventTypes.VOTE:
            room.setVote(msg.p.i, msg.p.v);
            break;
        case eventTypes.GRAB:
            room.setGrab(msg.p);
            break;
        case eventTypes.ADVANCE:
            var advanceEvent = {
                currentDJ: msg.p.c,
                djs: msg.p.d,
                lastPlay: {
                    dj: that.getDJ(),
                    media: that.getMedia(),
                    score: that.getRoomScore()
                },
                media: msg.p.m,
                startTime: msg.p.t,
                historyID: msg.p.h
            };
            room.advance(msg.p);
            historyID = msg.p.h;
            that.emit(msg.type, advanceEvent);
            return;
        case eventTypes.DJ_LIST_UPDATE:
            room.setDJs(msg.p);
            break;
        case 'earn':
            room.setEarn(msg.p);
            break;
        default:
        case void 0:
            logger.log('UNKNOWN MESSAGE FORMAT'.blue, msg);
    }
    if (msg.a) {
        that.emit(msg.a, msg.p);
    }
}

var PlugAPI = function(authenticationData) {
    if (!authenticationData || !authenticationData.type) {
        throw new Error('You must pass the authentication data into the PlugAPI object to connect correctly'.red);
    } else {
        switch (authenticationData.type) {
            case 'email':
                if (!authenticationData.login.email) {
                    throw new Error('Missing login e-mail'.red);
                }
                if (!authenticationData.login.password) {
                    throw new Error('Missing login password'.red);
                }
                var deasync;
                try {
                    deasync = require('deasync');
                } catch (e) {
                    throw new Error('Error loading module deasync. Try running `npm install deasync`.');
                }
                var loggingIn = true;
                request.get('https://plug.dj/', {
                    headers: {
                        'User-Agent': 'plugAPI_' + PlugAPIInfo.version
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
                            email: authenticationData.login.email,
                            password: authenticationData.login.password
                        }
                    }, function(err, res, data) {
                        if (data.status !== 'ok') {
                            console.log('LOGIN ERROR: '.red + data.status);
                            process.exit(1);
                        } else {
                            _cookies.fromHeaders(res.headers);
                            loggingIn = false;
                        }
                    });
                });
                // Wait until the session is set
                while (loggingIn) {
                    deasync.sleep(100);
                }
                break;
            case 'cookie':
                if (authenticationData.cookies.session) {
                    _cookies.cookies['session'] = authenticationData.cookies.session;
                } else {
                    throw new Error('Missing session cookie value'.red);
                }
                break;
            default:
                throw new Error('Unknown authentication type'.red);
        }
    }

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
    this.enablePlugCubedSocket = false;
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

    /**
     * Add the user to the waitlist
     */
    room.User.prototype.addToWaitList = function() {
        that.moderateAddDJ(this.id);
    };
    /**
     * Remove the user from the waitlist
     */
    room.User.prototype.removeFromWaitList = function() {
        that.moderateRemoveDJ(this.id);
    };
    /**
     * Move the user to a new position in the waitlist
     * @param {int} pos New position
     */
    room.User.prototype.moveInWaitList = function(pos) {
        that.moderateMoveDJ(this.id, pos);
    };

    this.ROOM_ROLE = {
        NONE: 0,
        RESIDENTDJ: 1,
        BOUNCER: 2,
        MANAGER: 3,
        COHOST: 4,
        HOST: 5
    };

    this.GLOBAL_ROLES = {
        NONE: 0,
        AMBASSADOR: 3,
        ADMIN: 5
    };

    this.STATUS = {
        AVAILABLE: 0,
        AFK: 1,
        WORKING: 2,
        GAMING: 3
    };

    this.BAN = {
        HOUR: 'h',
        DAY: 'd',
        PERMA: 'f'
    };

    this.MUTE = {
        SHORT: 's',
        MEDIUM: 'm',
        LONG: 'l'
    };

    this.events = eventTypes;

    this.preCommandHandler = function() {
        return true;
    };

    /**
     * Logger
     */
    this.log = __bind(logger.log, logger);

    logger.log('Running plugAPI v.' + PlugAPIInfo.version + '-dev');
    logger.log('THIS IS A UNSTABLE VERSION! DO NOT USE FOR PRODUCTION!'.red);
};

util.inherits(PlugAPI, EventEmitter);

/**
 * Close the connection
 */
PlugAPI.prototype.close = function() {
    ws.removeAllListeners('close');
    ws.close();
    if (this.enablePlugCubedSocket) {
        p3Socket.removeAllListeners('close');
        p3Socket.close();
    }
};

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
 * Set the logger object, must contain a log function
 * @param {Object} logger
 * @returns {boolean} True if set
 */
PlugAPI.prototype.setLogger = function(logger) {
    if (logger && typeof logger === 'object' && !util.isArray(logger) && typeof logger.log === 'function') {
        this.logger = logger;
        return true;
    }
    return false;
};

/**
 * Connect to a room
 * @param {String} roomSlug Slug of room (The part after https://plug.dj/)
 */
PlugAPI.prototype.connect = function(roomSlug) {
    if (!roomSlug || typeof roomSlug !== 'string' || roomSlug.length === 0 || roomSlug.indexOf('/') > -1) {
        throw new Error('Invalid room name'.red);
    }

    if (connectingRoomSlug != null) {
        console.error('Already connecting to a room'.red);
        return;
    }

    // Only connect if session cookie is set
    if (_cookies.cookies['session'] == undefined) {
        setImmediate(function() {
            that.connect(roomSlug);
        });
        return;
    }

    connectingRoomSlug = roomSlug;
    getAuthCode(function(auth) {
        queueConnectSocket(roomSlug, auth);
    });
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
            intChat(msg, timeout);
            if (i + 1 >= this.multiLineLimit) {
                break;
            }
        }
    } else {
        intChat(msg, timeout);
    }
};

/**
 * Woot
 * @param {Function} callback
 */
PlugAPI.prototype.woot = function(callback) {
    queueREST('POST', 'votes', {
        direction: 1,
        historyID: historyID
    }, callback);
};

/**
 * Meh
 * @param {Function} callback
 */
PlugAPI.prototype.meh = function(callback) {
    queueREST('POST', 'votes', {
        direction: -1,
        historyID: historyID
    }, callback);
};

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
    if (typeof callback !== 'function') throw new Error('You must specify callback!'.red);
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

PlugAPI.prototype.changeRoomName = function(name, callback) {
    if (!room.meta.slug || !this.haveRoomPermission(undefined, this.ROOM_ROLE.COHOST)) {
        return false;
    }
    queueREST('POST', endpoints.ROOM_INFO, {
        name: name,
        description: undefined,
        welcome: undefined
    }, callback);
    return true;
};

PlugAPI.prototype.changeRoomDescription = function(description, callback) {
    if (!room.meta.slug || !this.haveRoomPermission(undefined, this.ROOM_ROLE.COHOST)) {
        return false;
    }
    queueREST('POST', endpoints.ROOM_INFO, {
        name: undefined,
        description: description,
        welcome: undefined
    }, callback);
    return true;
};
PlugAPI.prototype.changeRoomWelcome = function(welcome, callback) {
    if (!room.meta.slug || !this.haveRoomPermission(undefined, this.ROOM_ROLE.COHOST)) {
        return false;
    }
    queueREST('POST', endpoints.ROOM_INFO, {
        name: undefined,
        description: undefined,
        welcome: welcome
    }, callback);
    return true;
};
PlugAPI.prototype.changeDJCycle = function(enabled, callback) {
    if (!room.meta.slug || !this.haveRoomPermission(undefined, this.ROOM_ROLE.MANAGER)) {
        return false;
    }
    queueREST('POST', endpoints.ROOM_CYCLE_BOOTH, {
        shouldCycle: enabled
    }, callback);
    return true;
};

PlugAPI.prototype.getTimeElapsed = function() {
    if (!room.meta.slug || room.getMedia() == null) {
        return -1;
    }
    return Math.min(room.getMedia().duration, DateUtilities.getSecondsElapsed(room.getStartTime()));
};

PlugAPI.prototype.getTimeRemaining = function() {
    if (!room.meta.slug || room.getMedia() == null) {
        return -1;
    }
    return room.getMedia().duration - this.getTimeElapsed();
};

PlugAPI.prototype.joinBooth = function(callback) {
    if (!room.meta.slug || room.isDJ() || room.isInWaitList() || (room.boothLocked && !this.haveRoomPermission(undefined, this.ROOM_ROLE.RESIDENTDJ)) || this.getDJs().length >= 50) {
        return false;
    }
    queueREST('POST', endpoints.MODERATE_BOOTH, undefined, callback);
    return true;
};

PlugAPI.prototype.leaveBooth = function(callback) {
    if (!room.meta.slug || (!room.isDJ() && !room.isInWaitList())) {
        return false;
    }
    queueREST('DELETE', endpoints.MODERATE_BOOTH, undefined, callback);
    return true;
};

PlugAPI.prototype.moderateAddDJ = function(uid, callback) {
    if (!room.meta.slug || !this.haveRoomPermission(undefined, this.ROOM_ROLE.BOUNCER) || room.isDJ(uid) || room.isInWaitList(uid) || (room.boothLocked && !this.haveRoomPermission(undefined, this.ROOM_ROLE.MANAGER))) {
        return false;
    }
    queueREST('POST', endpoints.MODERATE_ADD_DJ, {
        id: uid
    }, callback);
    return true;
};

PlugAPI.prototype.moderateRemoveDJ = function(uid, callback) {
    if (!room.meta.slug || !this.haveRoomPermission(undefined, this.ROOM_ROLE.BOUNCER) || (!room.isDJ(uid) && !room.isInWaitList(uid)) || (room.boothLocked && !this.haveRoomPermission(undefined, this.ROOM_ROLE.MANAGER))) {
        return false;
    }
    queueREST('DELETE', endpoints.MODERATE_REMOVE_DJ + uid, undefined, callback);
    return true;
};

PlugAPI.prototype.moderateMoveDJ = function(uid, index, callback) {
    if (!room.meta.slug || !this.haveRoomPermission(undefined, this.ROOM_ROLE.MANAGER) || !room.isInWaitList(uid) || isNaN(index)) {
        return false;
    }
    queueREST('POST', endpoints.MODERATE_MOVE_DJ, {
        userID: uid,
        position: index > 50 ? 49 : index < 1 ? 1 : --index
    }, callback);
    return true;
};

PlugAPI.prototype.moderateBanUser = function(uid, reason, duration, callback) {
    if (!room.meta.slug) return false;
    var user = this.getUser(uid);
    if (user ? room.getPermissions(user).canModBan : this.haveRoomPermission(undefined, this.ROOM_ROLE.BOUNCER)) {
        reason = Number(reason || 1);
        if (!duration) duration = this.BAN.PERMA;
        if (duration === this.BAN.PERMA && this.haveRoomPermission(undefined, this.ROOM_ROLE.BOUNCER) && !this.haveRoomPermission(undefined, this.ROOM_ROLE.MANAGER)) duration = this.BAN.DAY;
        queueREST('POST', endpoints.MODERATE_BAN, {
            userID: uid,
            reason: reason,
            duration: duration
        }, callback);
    }
    return true;
};

PlugAPI.prototype.moderateUnbanUser = function(uid, callback) {
    if (!room.meta.slug || !this.haveRoomPermission(undefined, this.ROOM_ROLE.MANAGER)) return false;
    queueREST('DELETE', endpoints.MODERATE_UNBAN + uid, undefined, callback);
    return true;
};
PlugAPI.prototype.moderateForceSkip = function(callback) {
    if (!room.meta.slug || !this.haveRoomPermission(undefined, this.ROOM_ROLE.BOUNCER) || room.getDJ() === null) return false;
    queueREST('POST', endpoints.MODERATE_SKIP, {
        userID: room.getDJ().id,
        historyID: historyID
    }, callback);
    return true;
};

PlugAPI.prototype.moderateDeleteChat = function(cid, callback) {
    if (!room.meta.slug) return false;
    var user = this.getUser(cid.split('-')[0]);
    if (user ? room.getPermissions(user).canModChat : this.haveRoomPermission(undefined, this.ROOM_ROLE.BOUNCER)) {
        queueREST('DELETE', endpoints.CHAT_DELETE + cid, undefined, callback, undefined, true);
    }
    return true;
};

PlugAPI.prototype.moderateLockWaitList = function(locked, clear, callback) {
    return this.moderateLockBooth(locked, clear, callback);
};

PlugAPI.prototype.moderateSetRole = function(uid, role, callback) {
    if (!room.meta.slug || isNaN(role)) return false;
    var user = this.getUser(uid);
    if (user ? room.getPermissions(user).canModStaff : this.haveRoomPermission(undefined, this.ROOM_ROLE.MANAGER)) {
        queueREST('POST', endpoints.MODERATE_PERMISSIONS, {
                userID: uid,
                roleID: role
            },
            callback);
    }
    return true;
};

PlugAPI.prototype.moderateLockBooth = function(locked, clear, callback) {
    if (!room.meta.slug || this.getUser() === null || !this.haveRoomPermission(undefined, this.ROOM_ROLE.MANAGER) || (locked === room.boothLocked && !clear)) return false;
    queueREST('PUT', endpoints.ROOM_LOCK_BOOTH, {
        isLocked: locked,
        removeAllDJs: clear
    }, callback);
    return true;
};

PlugAPI.prototype.getUsers = function() {
    return room.getUsers();
};

PlugAPI.prototype.getUser = function(uid) {
    return room.getUser(uid);
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

PlugAPI.prototype.setStatus = function(status, callback) {
    if (!room.meta.slug || !status || status < 0 || status > 3) return false;
    queueREST('PUT', endpoints.USER_SET_STATUS, {
        status: status
    }, callback);
    return true;
};
/*
PlugAPI.prototype.createPlaylist = function(name, callback) {
    if (!room.meta.slug || !name) return false;
    queueREST(rpcNames.PLAYLIST_CREATE, name, callback);
    return true;
};
*/
PlugAPI.prototype.addSongToPlaylist = function(playlistId, songId, callback) {
    if (!room.meta.slug || !playlistId || !songId) return false;
    queueREST('GET', endpoints.PLAYLIST + '/' + playlistId + '/media/insert', {
        media: songId,
        append: true
    }, callback);
    return true;
};

PlugAPI.prototype.getPlaylists = function(callback) {
    if (!room.meta.slug) return false;
    queueREST('GET', endpoints.PLAYLIST, undefined, callback);
    return true;
};

PlugAPI.prototype.activatePlaylist = function(playlist_id, callback) {
    if (!room.meta.slug || !playlist_id) return false;
    queueREST('PUT', endpoints.PLAYLIST + '/' + playlist_id + '/activate', undefined, callback);
    return true;
};
PlugAPI.prototype.deletePlaylist = function(playlist_id, callback) {
    if (!room.meta.slug || !playlist_id) return false;
    queueREST('DELETE', endpoints.PLAYLIST + '/' + playlist_id, undefined, callback);
    return true;
};
PlugAPI.prototype.shufflePlaylist = function(playlist_id, callback) {
    if (!room.meta.slug || !playlist_id) return false;
    queueREST('PUT', endpoints.PLAYLIST + '/' + playlist_id + '/shuffle', undefined, callback);
    return true;
};
/*PlugAPI.prototype.playlistMoveSong = function(playlist_id, song_id, position, callback) {
    if (!room.meta.slug || !playlist_id || !song_id || !position) return false;
    queueREST(endpoints.PLAYLIST +'/' +playlist_id + '/media/move', {
        ids: song_id
    }, callback);
    return true;
};*/

PlugAPI.prototype.setAvatar = function(avatar, callback) {
    if (!room.meta.slug || !avatar) return false;
    queueREST('PUT', endpoints.USER_SET_AVATAR, {
        id: avatar
    }, callback);
    return true;
};

PlugAPI.prototype.haveRoomPermission = function(uid, permission) {
    var user = this.getUser(uid);
    return !(user == null || user.role < permission);
};

PlugAPI.prototype.haveGlobalPermission = function(uid, permission) {
    var user = this.getUser(uid);
    return !(user == null || user.gRole < permission);
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
