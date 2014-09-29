// Node.JS Core Modules
var net, http, util, zlib, path, fs;
net = require('net');
http = require('http');
util = require('util');
zlib = require('zlib');
path = require('path');
fs = require('fs');

// Third-party modules
var EventEmitter, SockJS, request, WebSocket, encoder, chalk;
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
chalk = require('chalk');

// plugAPI
var Room, Logger, PlugAPIInfo, endpoints;
Room = require('./room');
Logger = require('./logger');
PlugAPIInfo = require('../package.json');
endpoints = {
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

/**
 * That is this and this is that
 * @type {PlugAPI}
 */
var that = null;

var ws, p3Socket, initialized, commandPrefix, apiId, _authCode, _cookies, chatHistory, serverRequests, room, connectingRoomSlug, rpcHandlers, logger, floodProtectionDelay, chatQueue;
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
    path: path.resolve(__dirname, '..', 'cookies.tmp'),
    load: function() {
        this.cookies = JSON.parse(fs.readFileSync(this.path));
    },
    save: function() {
        fs.writeFileSync(this.path, JSON.stringify(this.cookies));
    },
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
logger = new Logger('PlugAPI');
floodProtectionDelay = 200;
chatQueue = [];

/*
 http.OutgoingMessage.prototype.__renderHeaders = http.OutgoingMessage.prototype._renderHeaders;
 http.OutgoingMessage.prototype._renderHeaders = function() {
 if (this._header) {
 throw new Error('Can\'t render headers after they are sent to the client.');
 }
 this.setHeader('Cookie', _cookies.toString());
 return this.__renderHeaders();
 };
 */

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

(function() {
    function sendNextMessage() {
        if (chatQueue.length > 0) {
            var nextMessage = chatQueue.shift(), msg = nextMessage.msg, timeout = nextMessage.timeout;
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
        setTimeout(function() {
            sendNextMessage();
        }, floodProtectionDelay);
    }

    sendNextMessage();
})();

function queueChat(msg, timeout) {
    chatQueue.push({
        msg: msg,
        timeout: timeout
    });
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

function joinRoom(roomSlug, callback) {
    queueREST('POST', 'rooms/join', {
        slug: roomSlug
    }, function() {
        queueREST('GET', 'rooms/state', undefined, function(data) {
            fs.writeFileSync('roomState.json', JSON.stringify(data, null, 4));
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

function receivedChatMessage(m) {
    var i, isPM, cmd, obj, lastIndex, allUsers, random;
    if (!initialized) return;

    m.message = encoder.htmlDecode(m.message);

    obj = {
        raw: m,
        id: m.cid,
        from: room.getUser(m.uid),
        message: m.message,
        mentions: []
    };

    if ((m.type == 'message' || m.type == 'pm') && m.message.indexOf(commandPrefix) === 0 && (that.processOwnMessages || m.uid !== room.getSelf().id)) {
        isPM = m.type == 'pm';
        cmd = m.message.substr(commandPrefix.length).split(' ')[0];

        obj.command = cmd;
        obj.args = m.message.substr(commandPrefix.length + cmd.length + 1);

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
            if (isPM) {
                return intPM(this.from, message);
            }
            return that.sendChat('@' + this.from.username + ' ' + message);
        };
        obj.respondTimeout = function() {
            var args = Array.prototype.slice.call(arguments), timeout = args.splice(args.length - 1, 1), message = args.join(' ');
            if (isPM) {
                return intPM(this.from, message);
            }
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
            var isFrom = ids.indexOf(m.uid) > -1;
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
            that.moderateDeleteChat(m.cid);
        }
    } else if (m.type == 'emote') {
        that.emit(PlugAPI.events.CHAT_EMOTE, obj);
    }
    if (m.type == 'pm') {
        that.emit('pm', obj);
    } else {
        that.emit(PlugAPI.events.CHAT, obj);
        that.emit(PlugAPI.events.CHAT + ':' + obj.raw.type, obj);
        if (room.getUser() !== null && m.message.indexOf('@' + room.getUser().username) > -1) {
            that.emit(PlugAPI.events.CHAT + ':mention', obj);
            that.emit('mention', obj);
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
            logger.error('[ERROR] Error getting auth code:', err);
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
            setTimeout(function() {
                that.connect(slug);
            }, 10 * 1000);

        });
    });
    ws.on('close', function(a) {
        logger.warn('[Socket Server] Closed with code', a);
        process.nextTick(function() {
            var slug = room.getRoomMeta().slug ? room.getRoomMeta().slug : roomSlug;
            that.close();
            logger.info('[Socket Server] Reconnecting');
            setTimeout(function() {
                that.connect(slug);
            }, 10 * 1000);

        });
    });
}

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
    return callback();
}

function messageHandler(msg) {
    var type = msg.a, data = msg.p;
    switch (type) {
        case 'ack':
            queueREST('GET', 'users/me', null, function(a) {
                room.setSelf(a[0]);
                joinRoom(connectingRoomSlug);
            });
            break;
        case PlugAPI.events.CHAT:
            chatHistory.push(data);

            // If over limit, remove the first item
            if (chatHistory.length > 512) chatHistory.shift();

            receivedChatMessage(data);
            return;
        case PlugAPI.events.CHAT_DELETE:
            for (var i in chatHistory) {
                if (!chatHistory.hasOwnProperty(i)) continue;
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
            return;
        case PlugAPI.events.USER_UPDATE:
            room.updateUser(data);
            that.emit(type, that.getUser(data.i));
            return;
        case PlugAPI.events.VOTE:
            room.setVote(data.i, data.v);
            break;
        case PlugAPI.events.GRAB:
            room.setGrab(data);
            break;
        case PlugAPI.events.ADVANCE:
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
            return;
        case PlugAPI.events.DJ_LIST_UPDATE:
            room.setDJs(data);
            break;
        case PlugAPI.events.FLOOD_CHAT:
            floodProtectionDelay += 500;
            setTimeout(function() {
                floodProtectionDelay -= 500;
            }, floodProtectionDelay * 5);
            break;
        case 'earn':
            room.setEarn(data);
            break;
        case 'notify':
            if (data.action === 'levelUp') {
                logger.info('Congratulations, you have leveled up to level', data.value);
            } else {
                logger.info('Notify', data);
            }
            break;
        default:
        case void 0:
            logger.warning('UNKNOWN MESSAGE FORMAT', msg);
    }
    if (type) {
        that.emit(type, data);
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
        var deasync = require('deasync');
        var loggingIn = true, loggedIn = false;
        if (fs.existsSync(_cookies.path)) {
            _cookies.load();
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
                        email: authenticationData.email,
                        password: authenticationData.password
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

    room.registerUserExtensions(this);

    /**
     * Pre-command Handler
     * @return {boolean} If false, the command is not getting handled.
     */
    this.preCommandHandler = function() {
        return true;
    };

    logger.info('Running plugAPI v.' + PlugAPIInfo.version + '-dev');
    logger.warn(chalk.yellow('THIS IS A UNSTABLE VERSION! DO NOT USE FOR PRODUCTION!'));
};

util.inherits(PlugAPI, EventEmitter);

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
 * @type {{ADVANCE: string, BAN: string, BOOTH_CYCLE: string, BOOTH_LOCKED: string, CHAT: string, CHAT_COMMAND: string, CHAT_DELETE: string, CHAT_EMOTE: string, COMMAND: string, DJ_LIST_UPDATE: string, EMOTE: string, FOLLOW_JOIN: string, GRAB: string, MODERATE_ADD_DJ: string, MODERATE_ADD_WAITLIST: string, MODERATE_AMBASSADOR: string, MODERATE_BAN: string, MODERATE_MOVE_DJ: string, MODERATE_MUTE: string, MODERATE_REMOVE_DJ: string, MODERATE_REMOVE_WAITLIST: string, MODERATE_SKIP: string, MODERATE_STAFF: string, PDJ_MESSAGE: string, PDJ_UPDATE: string, PING: string, PLAYLIST_CYCLE: string, REQUEST_DURATION: string, REQUEST_DURATION_RETRY: string, ROOM_CHANGE: string, ROOM_DESCRIPTION_UPDATE: string, ROOM_JOIN: string, ROOM_NAME_UPDATE: string, ROOM_VOTE_SKIP: string, ROOM_WELCOME_UPDATE: string, SESSION_CLOSE: string, SKIP: string, STROBE_TOGGLE: string, USER_COUNTER_UPDATE: string, USER_FOLLOW: string, USER_JOIN: string, USER_LEAVE: string, USER_UPDATE: string, VOTE: string}}
 * @const
 */
PlugAPI.events = {
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
    FLOOD_CHAT: 'floodChat',
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
 * Create a new logger for your own scripts.
 * @param channel
 * @return {Logger}
 */
PlugAPI.getLogger = function(channel) {
    if (!channel) channel = 'Unknown';
    return new Logger(channel);
};

/**
 * Set the Logger object, must contain a log, info, warn, warning and error function
 * @param {Object} newLogger
 * @returns {boolean} True if set
 */
PlugAPI.prototype.setLogger = function(newLogger) {
    var requiredMethods = ['log', 'info', 'warn', 'warning', 'error'];

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
PlugAPI.prototype.changeDJCycle = function(enabled, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
        return false;
    }
    queueREST('POST', endpoints.ROOM_CYCLE_BOOTH, {
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

PlugAPI.prototype.getTimeRemaining = function() {
    if (!room.getRoomMeta().slug || room.getMedia() == null) {
        return -1;
    }
    return room.getMedia().duration - this.getTimeElapsed();
};

PlugAPI.prototype.joinBooth = function(callback) {
    if (!room.getRoomMeta().slug || room.isDJ() || room.isInWaitList() || (room.boothLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.RESIDENTDJ)) || this.getDJs().length >= 50) {
        return false;
    }
    queueREST('POST', endpoints.MODERATE_BOOTH, undefined, callback);
    return true;
};

PlugAPI.prototype.leaveBooth = function(callback) {
    if (!room.getRoomMeta().slug || (!room.isDJ() && !room.isInWaitList())) {
        return false;
    }
    queueREST('DELETE', endpoints.MODERATE_BOOTH, undefined, callback);
    return true;
};

PlugAPI.prototype.moderateAddDJ = function(uid, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || room.isDJ(uid) || room.isInWaitList(uid) || (room.boothLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER))) {
        return false;
    }
    queueREST('POST', endpoints.MODERATE_ADD_DJ, {
        id: uid
    }, callback);
    return true;
};

PlugAPI.prototype.moderateRemoveDJ = function(uid, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || (!room.isDJ(uid) && !room.isInWaitList(uid)) || (room.boothLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER))) {
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
    if (user ? room.getPermissions(user).canModBan : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) {
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

PlugAPI.prototype.moderateUnbanUser = function(uid, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) return false;
    queueREST('DELETE', endpoints.MODERATE_UNBAN + uid, undefined, callback);
    return true;
};
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
    if (user ? room.getPermissions(user).canModChat : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) {
        queueREST('DELETE', endpoints.CHAT_DELETE + cid, undefined, callback, undefined, true);
    }
    return true;
};

PlugAPI.prototype.moderateLockWaitList = function(locked, clear, callback) {
    return this.moderateLockBooth(locked, clear, callback);
};

PlugAPI.prototype.moderateSetRole = function(uid, role, callback) {
    if (!room.getRoomMeta().slug || isNaN(role)) return false;
    var user = this.getUser(uid);
    if (user ? room.getPermissions(user).canModStaff : this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
        queueREST('POST', endpoints.MODERATE_PERMISSIONS, {
            userID: uid,
            roleID: role
        }, callback);
    }
    return true;
};

PlugAPI.prototype.moderateLockBooth = function(locked, clear, callback) {
    if (!room.getRoomMeta().slug || this.getUser() === null || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || (locked === room.boothLocked && !clear)) return false;
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

PlugAPI.prototype.getAudience = function() {
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
    if (!room.getRoomMeta().slug || !status || status < 0 || status > 3) return false;
    queueREST('PUT', endpoints.USER_SET_STATUS, {
        status: status
    }, callback);
    return true;
};
/*
 PlugAPI.prototype.createPlaylist = function(name, callback) {
 if (!room.getRoomMeta().slug || !name) return false;
 queueREST(rpcNames.PLAYLIST_CREATE, name, callback);
 return true;
 };
 */
PlugAPI.prototype.addSongToPlaylist = function(playlistId, songId, callback) {
    if (!room.getRoomMeta().slug || !playlistId || !songId) return false;
    queueREST('GET', endpoints.PLAYLIST + '/' + playlistId + '/media/insert', {
        media: songId,
        append: true
    }, callback);
    return true;
};

PlugAPI.prototype.getPlaylists = function(callback) {
    if (!room.getRoomMeta().slug) return false;
    queueREST('GET', endpoints.PLAYLIST, undefined, callback);
    return true;
};

PlugAPI.prototype.activatePlaylist = function(playlist_id, callback) {
    if (!room.getRoomMeta().slug || !playlist_id) return false;
    queueREST('PUT', endpoints.PLAYLIST + '/' + playlist_id + '/activate', undefined, callback);
    return true;
};
PlugAPI.prototype.deletePlaylist = function(playlist_id, callback) {
    if (!room.getRoomMeta().slug || !playlist_id) return false;
    queueREST('DELETE', endpoints.PLAYLIST + '/' + playlist_id, undefined, callback);
    return true;
};
PlugAPI.prototype.shufflePlaylist = function(playlist_id, callback) {
    if (!room.getRoomMeta().slug || !playlist_id) return false;
    queueREST('PUT', endpoints.PLAYLIST + '/' + playlist_id + '/shuffle', undefined, callback);
    return true;
};
/*PlugAPI.prototype.playlistMoveSong = function(playlist_id, song_id, position, callback) {
 if (!room.getRoomMeta().slug || !playlist_id || !song_id || !position) return false;
 queueREST(endpoints.PLAYLIST +'/' +playlist_id + '/media/move', {
 ids: song_id
 }, callback);
 return true;
 };*/

PlugAPI.prototype.setAvatar = function(avatar, callback) {
    if (!room.getRoomMeta().slug || !avatar) return false;
    queueREST('PUT', endpoints.USER_SET_AVATAR, {
        id: avatar
    }, callback);
    return true;
};

/**
 * Implementation of plug.dj havePermission method
 * @param {Number} [uid]
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
