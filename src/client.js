var SockJS = require('sockjs-client'),
    net = require('net'),
    http = require('http');
EventEmitter = require('events').EventEmitter,
Encoder = require('node-html-encoder').Encoder,
Room = require('./room'),
request = require('request'),
WebSocket = require('ws'),
encoder = new Encoder('entity'),
util = require('util'),

rpcNames = {
    BOOTH_JOIN: 'booth.join',
    BOOTH_LEAVE: 'booth.leave',
    BOOTH_SKIP: 'booth.skip',
    DURATION_MISMATCH: 'duration.mismatch',
    DURATION_UPDATE: 'duration.update',
    HISTORY_SELECT: 'history.select',
    MEDIA_RECOVER: 'media.recover',
    MEDIA_SELECT: 'media.select',
    MEDIA_UPDATE: 'media.update',
    MODERATE_ADD_DJ: 'moderate.add_dj',
    MODERATE_BAN: 'moderate.ban',
    MODERATE_BANS: 'moderate.bans',
    MODERATE_CHAT_DELETE: 'moderate.chat_delete',
    MODERATE_MOVE_DJ: 'moderate.move_dj',
    MODERATE_PERMISSIONS: 'moderate.permissions',
    MODERATE_REMOVE_DJ: 'moderate.remove_dj',
    MODERATE_SKIP: 'moderate.skip',
    MODERATE_UNBAN: 'moderate.unban',
    MODERATE_UPDATE_DESCRIPTION: 'moderate.update_description',
    MODERATE_UPDATE_NAME: 'moderate.update_name',
    MODERATE_UPDATE_WELCOME: 'moderate.update_welcome',
    PLAYLIST_ACTIVATE: 'playlist.activate',
    PLAYLIST_CREATE: 'playlist.create',
    PLAYLIST_DELETE: 'playlist.delete',
    PLAYLIST_MEDIA_DELETE: 'playlist.media.delete',
    PLAYLIST_MEDIA_INSERT: 'playlist.media.insert',
    PLAYLIST_MEDIA_MOVE: 'playlist.media.move',
    PLAYLIST_MEDIA_SHUFFLE: 'playlist.media.shuffle',
    PLAYLIST_RENAME: 'playlist.rename',
    PLAYLIST_SELECT: 'playlist.select',
    REPORT_DISCONNECT: 'report.disconnect',
    REPORT_RECONNECT: 'report.reconnect',
    ROOM_CAST: 'room.cast',
    ROOM_CREATE: 'room.create',
    ROOM_CURATE: 'room.curate',
    ROOM_CYCLE_BOOTH: 'room.cycle_booth',
    ROOM_DETAILS: 'room.details',
    ROOM_JOIN: 'room.join',
    ROOM_LOCK_BOOTH: 'room.lock_booth',
    ROOM_SEARCH: 'room.search',
    ROOM_STAFF: 'room.staff',
    ROOM_STATE: 'room.state',
    USER_CHANGE_NAME: 'user.change_name',
    USER_GET_BY_IDS: 'user.get_by_ids',
    USER_IGNORING: 'user.ignoring',
    USER_NAME_AVAILABLE: 'user.name_available',
    USER_PONG: 'user.pong',
    USER_SET_AVATAR: 'user.set_avatar',
    USER_SET_LANGUAGE: 'user.set_language',
    USER_SET_STATUS: 'user.set_status'
},

client = null,
ws = null,
apiId = 0,
_this = null,
_key = null,
_updateCode = null,
lastRpcMessage = Date.now(),
room = new Room(),
rpcHandlers = {},
logger = {
    pad: function(n) {
        return n < 10 ? '0' + n.toString(10) : n.toString(10);
    },
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    timestamp: function() {
        var d = new Date();
        var time = [this.pad(d.getHours()),
            this.pad(d.getMinutes()),
            this.pad(d.getSeconds())
        ].join(':');
        return [d.getDate(), this.months[d.getMonth()], time].join(' ');
    },
    log: function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this.timestamp());
        return console.log.apply(console, args);
    }
};

http.OutgoingMessage.prototype.__renderHeaders = http.OutgoingMessage.prototype._renderHeaders;
http.OutgoingMessage.prototype._renderHeaders = function() {
    if (this._header)
        throw new Error('Can\'t render headers after they are sent to the client.');
    this.setHeader('Cookie', 'usr=\"' + _key + '\"');
    return this.__renderHeaders();
};

function __bind(fn, me) {
    return function() {
        return fn.apply(me, arguments);
    };
}

/**
DateUtilities
Copyright (C) 2013 by Plug DJ, Inc.
*/
var DateUtilities = {
    MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    SERVER_TIME: null,
    OFFSET: 0,
    setServerTime: function(e) {
        this.SERVER_TIME = this.convertUnixDateStringToDate(e), this.OFFSET = this.SERVER_TIME.getTime() - (new Date).getTime()
    },
    yearsSince: function(e) {
        return this.ServerDate().getFullYear() - e.getFullYear()
    },
    monthsSince: function(e) {
        var t = this.ServerDate();
        return (t.getFullYear() - e.getFullYear()) * 12 + (t.getMonth() - e.getMonth())
    },
    daysSince: function(e) {
        var t = this.ServerDate(),
            n = t.getTime(),
            r = e.getTime(),
            i = 864e5,
            s = (n - r) / i,
            o = (n - r) % i / i;
        return o > 0 && o * i > this.secondsSinceMidnight(t) * 1e3 && s++, ~~s
    },
    hoursSince: function(e) {
        return~~ ((this.ServerDate().getTime() - e.getTime()) / 36e5)
    },
    minutesSince: function(e) {
        return~~ ((this.ServerDate().getTime() - e.getTime()) / 6e4)
    },
    secondsSince: function(e) {
        return~~ ((this.ServerDate().getTime() - e.getTime()) / 1e3)
    },
    monthName: function(e, t) {
        var n = this.MONTHS[e.getMonth()];
        return t ? n : n.substr(0, 3)
    },
    secondsSinceMidnight: function(e) {
        var t = new Date(e.getTime());
        return this.midnight(t), ~~ ((e.getTime() - t.getTime()) / 1e3)
    },
    midnight: function(e) {
        e.setHours(0), e.setMinutes(0), e.setSeconds(0), e.setMilliseconds(0)
    },
    minutesUntil: function(e) {
        return~~ ((e.getTime() - this.ServerDate().getTime()) / 6e4)
    },
    millisecondsUntil: function(e) {
        return e.getTime() - this.ServerDate().getTime()
    },
    ServerDate: function() {
        return new Date((new Date).getTime() + this.OFFSET)
    },
    getSecondsElapsed: function(e) {
        return !e || e == '0' ? 0 : this.secondsSince(new Date(e.substr(0, e.indexOf('.'))))
    },
    convertUnixDateStringToDate: function(e) {
        return e ? new Date(e.substr(0, 4), Number(e.substr(5, 2)) - 1, e.substr(8, 2), e.substr(11, 2), e.substr(14, 2), e.substr(17, 2)) : null
    }
};

function sendRPC(name, args, callback) {
    args = args === undefined ? [] : args;
    if (!util.isArray(args))
        args = [args];
    var rpcId = ++apiId,
        sendArgs = {
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
    return client.send(sendArgs);
}

function joinRoom(name, callback) {
    return sendRPC(rpcNames.ROOM_JOIN, [name, _updateCode], function(data) {
        if (data.status && data.status !== 0) throw new Error('Wrong updateCode');
        DateUtilities.setServerTime(data.serverTime);
        return sendRPC(rpcNames.ROOM_DETAILS, [name], function(data) {
            return _this.initRoom(data, function() {
                if (callback != null)
                    return callback(data);
            });
        });
    });
}

function send(data) {
    return client.send(data);
}

function connectChat(roomID) {
    var opts = {
        url: 'https://sio2.plug.dj/socket.io/1/?t=' + Date.now(),
        headers: {
            Cookie: 'usr=' + _key
        }
    };
    request(opts, function(err, res, body) {
        if (err) console.error(err);
        var sockId = body.split(':')[0],
            sockUrl = 'wss://sio2.plug.dj/socket.io/1/websocket/' + sockId;
        ws = new WebSocket(sockUrl);
        ws.on('open', function() {
            logger.log('[Chat Server] Connected');
            this.send('1::/room');
            var roomOpts = {
                name: 'join',
                args: [roomID]
            };
            this.send('5::/room:' + JSON.stringify(roomOpts));
        });
        ws.on('message', function(data, flags) {
            // heartbeat
            if (data == '2::') this.send('2::');
            // other messages (including chat)
            if (data.match(/^5::\/room:/)) {
                var mStr = data.split('5::/room:')[1];
                var m = JSON.parse(mStr).args[0];

                m.message = encoder.htmlDecode(m.message);

                if (m.type == 'message' && m.message.indexOf('!') === 0 && m.from.id != room.self.id) {
                    var cmd = m.message.substr(1).split(' ')[0],
                        obj = {
                            message: m,
                            chatID: m.chatID,
                            from: room.getUser(m.fromID),
                            command: cmd,
                            args: m.message.substr(2 + cmd.length),
                            mentions: [],
                            respond: function() {
                                var message = Array.prototype.slice.call(arguments).join(' ');
                                return _this.sendChat('@' + m.from + ' ' + message);
                            },
                            havePermission: function(permission, success, failure) {
                                if (permission === undefined) permission = 0;
                                if (typeof success !== 'function')
                                    return room.getUser(m.fromID).permission >= permission;
                                else
                                    return room.getUser(m.fromID).permission >= permission ? success() : typeof failure === 'function' ? failure() : null;
                            },
                            isFrom: function(ids, success, failure) {
                                if (typeof ids === 'string') ids = [ids];
                                if (ids === undefined || !util.isArray(ids)) {
                                    if (typeof failure === 'function')
                                        failure();
                                    return;
                                }
                                if (typeof success !== 'function')
                                    return ids.indexOf(m.fromID) > -1;
                                else
                                    return ids.indexOf(m.fromID) > -1 ? success() : typeof failure === 'function' ? failure() : null;
                            }
                        },
                        lastIndex = obj.args.indexOf('@'),
                        allUsers = room.getUsers(),
                        random = Math.ceil(Math.random() * 1E10);
                    while (lastIndex > -1) {
                        var test = obj.args.substr(lastIndex),
                            found = null;
                        for (var i in allUsers) {
                            if (test.indexOf(allUsers[i].username) === 1) {
                                if (found === null || allUsers[i].username.length > found.username.length)
                                    found = allUsers[i];
                            }
                        }
                        if (found !== null) {
                            obj.args = obj.args.substr(0, lastIndex) + '%MENTION-' + random + '-' + obj.mentions.length + '%' + obj.args.substr(lastIndex + found.username.length + 1);
                            obj.mentions.push(found);
                        }
                        lastIndex = obj.args.indexOf('@', lastIndex + 1);
                    }
                    obj.args = obj.args.split(' ');
                    for (var i in obj.mentions)
                        obj.args[obj.args.indexOf('%MENTION-' + random + '-' + i + '%')] = obj.mentions[i];
                    _this.emit(_this.messageTypes.CHAT_COMMAND, obj);
                    _this.emit(_this.messageTypes.CHAT_COMMAND + ':' + cmd, obj);
                    _this.moderateDeleteChat(m.chatID);
                } else if (m.type == 'emote') {
                    _this.emit(_this.messageTypes.CHAT_EMOTE, m);
                }
                _this.emit(_this.messageTypes.CHAT, m);
                _this.emit(_this.messageTypes.CHAT + ':' + m.type, m);
                if (room.getUser() !== undefined && m.message.indexOf('@' + room.getUser().username) > -1) {
                    _this.emit(_this.messageTypes.CHAT + ':mention', m);
                    _this.emit('mention', m);
                }
            }
        });
        ws.on('error', function(a) {
            logger.log('[Chat Server] Error:', a);
            process.nextTick(function() {
                logger.log('[Chat Server] Reconnecting');
                connectChat(_this.roomId);
            });
        });
        ws.on('close', function(a) {
            logger.log('[Chat Server] Closed with code', a);
            process.nextTick(function() {
                logger.log('[Chat Server] Reconnecting');
                connectChat(_this.roomId);
            });
        });
    });
}

function connectSocket(roomID) {
    apiId = 0;
    rpcHandlers = {};
    client = SockJS.create('https://sjs.plug.dj:443/plug');
    client.send = function(data) {
        return this.write(JSON.stringify(data));
    };
    client.on('error', function(e) {
        logger.log('[Socket Server] Error:', e);
        process.nextTick(function() {
            logger.log('[Socket Server] Reconnecting');
            connectSocket(_this.roomId);
        });
    });
    client.on('data', _this.dataHandler);
    client.on('data', function(data) {
        return _this.emit('tcpMessage', data);
    });
    client.on('close', function() {
        logger.log('[Socket Server] Closed');
        process.nextTick(function() {
            logger.log('[Socket Server] Reconnecting');
            connectSocket(_this.roomId);
        });
    });
    return client.on('connection', function() {
        logger.log('[Socket Server] Connected');
        if (roomID)
            joinRoom(roomID);
        _this.emit('connected');
        _this.emit('server:socket:connected');
        return _this.emit('tcpConnect', client);
    });
}

function reconnectChat() {
    if (ws.readyState === 1)
        ws.close();
    if (ws.readyState !== 3)
        return setTimeout(function() {
            reconnectChat();
        }, 100);
    logger.log('[Chat Server] Reconnecting');
    connectChat(_this.roomId);
}

var PlugAPI = function(key, updateCode) {
    if (!key)
        throw new Error('You must pass the authentication cookie into the PlugAPI object to connect correctly');
    _this = this;
    _key = key;
    _updateCode = updateCode != undefined ? updateCode : 'p9R*';

    this.multiLine = false;
    this.multiLineLimit = 5;
    this.roomId = null;

    room.User.prototype.addToWaitlist = function() {
        _this.moderateAddDJ(this.id);
    }
    room.User.prototype.removeFromWaitlist = function() {
        _this.moderateRemoveDJ(this.id);
    }

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

    this.messageTypes = {
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

    this.getRoomScore = __bind(this.getRoomScore, this);
    this.getMedia = __bind(this.getMedia, this);
    this.getAmbassadors = __bind(this.getAmbassadors, this);
    this.getWaitList = __bind(this.getWaitList, this);
    this.getWaitListPosition = __bind(this.getWaitListPosition, this);
    this.getSelf = __bind(this.getSelf, this);
    this.getHost = __bind(this.getHost, this);
    this.getAdmins = __bind(this.getAdmins, this);
    this.getStaff = __bind(this.getStaff, this);
    this.getDJ = __bind(this.getDJ, this);
    this.getDJs = __bind(this.getDJs, this);
    this.getAudience = __bind(this.getAudience, this);
    this.getUser = __bind(this.getUser, this);
    this.getUsers = __bind(this.getUsers, this);
    this.moderateBanUser = __bind(this.moderateBanUser, this);
    this.moderateUnBanUser = __bind(this.moderateUnBanUser, this);
    this.moderateForceSkip = __bind(this.moderateForceSkip, this);
    this.moderateAddDJ = __bind(this.moderateAddDJ, this);
    this.moderateRemoveDJ = __bind(this.moderateRemoveDJ, this);
    this.moderateDeleteChat = __bind(this.moderateDeleteChat, this);
    this.moderateLockWaitList = __bind(this.moderateLockWaitList, this);
    this.getTimeElapsed = __bind(this.getTimeElapsed, this);
    this.getTimeRemaining = __bind(this.getTimeRemaining, this);
    this.initRoom = __bind(this.initRoom, this);
    this.joinRoom = __bind(this.joinRoom, this);
    this.createPlaylist = __bind(this.createPlaylist, this);
    this.addSongToPlaylist = __bind(this.addSongToPlaylist, this);
    this.getPlaylists = __bind(this.getPlaylists, this);
    this.activatePlaylist = __bind(this.activatePlaylist, this);
    this.playlistMoveSong = __bind(this.playlistMoveSong, this);
    this.dataHandler = __bind(this.dataHandler, this);
};

util.inherits(PlugAPI, EventEmitter);

PlugAPI.prototype.getAuth = function(creds, callback) {
    require('plug-dj-login')(creds, function(err, cookie) {
        if (err) {
            if (typeof callback == 'function')
                callback(err, null);
            return;
        }

        var cookieVal = cookie.value;
        cookieVal = cookieVal.replace(/^\"/, '').replace(/\"$/, '');
        if (typeof callback == 'function')
            callback(err, cookieVal);
    });
}
PlugAPI.prototype.setLogObject = function(c) {
    return this.logger = c;
}
PlugAPI.prototype.connect = function(a) {
    connectChat(a);
    connectSocket(a);
}
PlugAPI.prototype.dataHandler = function(data) {
    if (typeof data === 'string')
        data = JSON.parse(data);
    if (data.messages) {
        for (var i = 0; i < data.messages.length; i++)
            this.messageHandler(data.messages[i]);
        return;
    }
    if (data.type === 'rpc') {
        reply = data.result;
        if (reply) {
            if (data.status !== 0)
                reply = data;
            if (rpcHandlers[data.id] != null && typeof rpcHandlers[data.id].callback === 'function')
                rpcHandlers[data.id].callback(reply);
            this.parseRPCReply(rpcHandlers[data.id] != null ? rpcHandlers[data.id].type : undefined, reply);
            return delete rpcHandlers[data.id];
        }
    }
}
PlugAPI.prototype.parseRPCReply = function(name, data) {
    switch (name) {
        case rpcNames.ROOM_JOIN:
            this.emit(this.messageTypes.ROOM_CHANGE, data);
            if (typeof data.room !== 'undefined' && typeof data.room.historyID !== 'undefined') {
                this.historyID = data.room.historyID;
                this.roomId = data.room.id;
                this.userId = data.user.profile.id;
            }
    }
}
PlugAPI.prototype.messageHandler = function(msg) {
    try {
        require('fs').writeFile('./messages/' + msg.type + '.txt', JSON.stringify(msg.data, null, 4));
    } catch (e) {}
    switch (msg.type) {
        case this.messageTypes.PING:
            sendRPC(rpcNames.USER_PONG);
            break;
        case this.messageTypes.MODERATE_STAFF:
            for (var i in msg.data.users)
                room.staffIds[msg.data.users[i].user.id] = msg.data.users[i].permission;
            room.setPermissions();
            break;
        case this.messageTypes.MODERATE_ADD_DJ:
            if (msg.data.moderator === this.getUser().username) {
                (function() {
                    for (var i in rpcHandlers) {
                        if (rpcHandlers[i].type === rpcNames.MODERATE_ADD_DJ && room.getUser(rpcHandlers[i].args[0]).username === msg.data.username && typeof rpcHandlers[i].callback === 'function') {
                            rpcHandlers[i].callback();
                            return delete rpcHandlers[i];
                        }
                    }
                })();
            }
            break;
        case this.messageTypes.MODERATE_REMOVE_DJ:
            if (msg.data.moderator === this.getUser().username) {
                (function() {
                    for (var i in rpcHandlers) {
                        if (rpcHandlers[i].type === rpcNames.MODERATE_REMOVE_DJ && room.getUser(rpcHandlers[i].args[0]).username === msg.data.username && typeof rpcHandlers[i].callback === 'function') {
                            rpcHandlers[i].callback();
                            return delete rpcHandlers[i];
                        }
                    }
                })();
            }
            break;
        case this.messageTypes.USER_JOIN:
            room.addUser(msg.data);
            lastRpcMessage = Date.now();
            break;
        case this.messageTypes.USER_LEAVE:
            room.remUser(msg.data.id);
            lastRpcMessage = Date.now();
            break;
        case this.messageTypes.VOTE_UPDATE:
            room.logVote(msg.data.id, msg.data.vote === 1 ? 'woot' : 'meh');
            lastRpcMessage = Date.now();
            break;
        case this.messageTypes.DJ_UPDATE:
            room.setDjs(msg.data.djs);
            lastRpcMessage = Date.now();
            break;
        case this.messageTypes.DJ_ADVANCE:
            room.setDjs(msg.data.djs);
            room.setMedia(msg.data.media, msg.data.mediaStartTime);
            this.historyID = msg.data.historyID;
            lastRpcMessage = Date.now();
            break;
        case this.messageTypes.CURATE_UPDATE:
            room.logVote(msg.data.id, 'curate');
            lastRpcMessage = Date.now();
            break;
        case this.messageTypes.USER_UPDATE:
            room.updateUser(msg.data);
            break;
        case void 0:
            logger.log('UNKNOWN MESSAGE FORMAT', msg);
    }
    if (msg.type)
        return this.emit(msg.type, msg.data);
}
PlugAPI.prototype.initRoom = function(data, callback) {
    room.reset();
    lastRpcMessage = Date.now();
    if (data.room === undefined || data.user === undefined)
        return client.close();
    room.setUsers(data.room.users);
    room.setStaff(data.room.staff);
    room.setAdmins(data.room.admins);
    room.setOwner(data.room.owner);
    room.setSelf(data.user.profile);
    room.setDjs(data.room.djs);
    room.setMedia(data.room.media, data.room.mediaStartTime, data.room.votes, data.room.curates);
    if (this.historyID !== data.room.historyID) {
        this.roomId = data.room.id;
        this.historyID = data.room.historyID;
        this.emit(this.messageTypes.ROOM_JOIN, data.room.name, data);
        this.emit(this.messageTypes.DJ_ADVANCE, {
            currentDJ: data.room.currentDJ,
            djs: data.room.djs.splice(1),
            media: room.media.info,
            mediaStartTime: data.room.mediaStartTime,
            historyID: this.historyID
        });
        sendRPC(rpcNames.HISTORY_SELECT, [_this.roomId], __bind(room.setHistory, room));
    }
    return callback();
}
PlugAPI.prototype.roomRegister = function(name, callback) {
    return joinRoom(name, callback);
}
PlugAPI.prototype.intChat = function(msg) {
    return ws.send('5::/room:' + JSON.stringify({
        name: 'chat',
        args: [{
            msg: msg,
            chatID: room.self.id.substr(0, 6) + Math.floor(Math.random() * 4294967295).toString(16)
        }]
    }));
}
PlugAPI.prototype.chat = function(msg) {
    if (msg.length > 235 && this.multiLine) {
        var lines = msg.replace(/.{235}\S*\s+/g, '$&¤').split(/\s+¤/);
        for (var i = 0; i < lines.length; i++) {
            var msg = lines[i];
            if (i > 0)
                msg = '(continued) ' + msg;
            this.intChat(msg);
            if (i + 1 >= this.multiLineLimit)
                break;
        }
    } else
        this.intChat(msg);
}
PlugAPI.prototype.sendChat = function(msg) {
    return this.chat(msg);
}
PlugAPI.prototype.woot = function(callback) {
    sendRPC(rpcNames.ROOM_CAST, [true, this.historyID, this.lastHistoryID === this.historyID], callback);
    return this.lastHistoryID = this.historyID;
}
PlugAPI.prototype.meh = function(callback) {
    sendRPC(rpcNames.ROOM_CAST, [false, this.historyID, this.lastHistoryID === this.historyID], callback);
    return this.lastHistoryID = this.historyID;
}
PlugAPI.prototype.getHistory = function(callback) {
    var history = room.getHistory();
    if (history.length < 1)
        sendRPC(rpcNames.HISTORY_SELECT, [_this.roomId], function(data) {
            room.setHistory(data);
            callback(data);
        });
    else callback(history);
}
PlugAPI.prototype.isUsernameAvailable = function(name, callback) {
    return sendRPC(rpcNames.USER_NAME_AVAILABLE, [name], callback);
}
PlugAPI.prototype.changeUsername = function(name, callback) {
    return sendRPC(rpcNames.USER_CHANGE_NAME, [name], callback);
}
PlugAPI.prototype.changeRoomName = function(name, callback) {
    if (!this.roomId)
        throw new Error('You must be in a room to change its name');
    if (this.getSelf().permission < this.ROLE.COHOST)
        throw new Error('You must be co-host or higher to change room name');
    return sendRPC(rpcNames.MODERATE_UPDATE_NAME, [name], callback);
}
PlugAPI.prototype.changeRoomDescription = function(description, callback) {
    if (this.getSelf().permission < this.ROLE.COHOST)
        throw new Error('You must be co-host or higher to change room description');
    return sendRPC(rpcNames.MODERATE_UPDATE_DESCRIPTION, [description], callback);
}
PlugAPI.prototype.changeDJCycle = function(enabled, callback) {
    if (this.getSelf().permission < this.ROLE.MANAGER)
        throw new Error('You must be manager or higher to change DJ cycle');
    return sendRPC(rpcNames.ROOM_CYCLE_BOOTH, [this.roomId, enabled], callback);
}
PlugAPI.prototype.getTimeElapsed = function() {
    return Math.min(room.getMedia().duration, DateUtilities.getSecondsElapsed(room.getMediaStartTime()));
}
PlugAPI.prototype.getTimeRemaining = function() {
    return room.getMedia().duration - this.getTimeElapsed();
}

PlugAPI.prototype.joinBooth = function(callback) {
    return sendRPC(rpcNames.BOOTH_JOIN, [], callback);
}
PlugAPI.prototype.leaveBooth = function(callback) {
    return sendRPC(rpcNames.BOOTH_LEAVE, [], callback);
}
PlugAPI.prototype.moderateAddDJ = function(userid, callback) {
    return sendRPC(rpcNames.MODERATE_ADD_DJ, userid, callback);
}
PlugAPI.prototype.moderateRemoveDJ = function(userid, callback) {
    return sendRPC(rpcNames.MODERATE_REMOVE_DJ, userid, callback);
}
PlugAPI.prototype.moderateMoveDJ = function(userid, index, callback) {
    return sendRPC(rpcNames.MODERATE_MOVE_DJ, [userid, index > 50 ? 50 : index < 1 ? 1 : index], callback);
}
PlugAPI.prototype.moderateBanUser = function(userid, reason, duration, callback) {
    return sendRPC(rpcNames.MODERATE_BAN, [userid, String(reason || 0), duration || -1], callback);
}
PlugAPI.prototype.moderateUnBanUser = function(userid, callback) {
    return sendRPC(rpcNames.MODERATE_UNBAN, [userid], callback);
}
PlugAPI.prototype.moderateForceSkip = function(callback) {
    return room.getDJ() === null ? false : sendRPC(rpcNames.MODERATE_SKIP, [room.getDJ().id, this.historyID], callback);
}
PlugAPI.prototype.moderateDeleteChat = function(chatID, callback) {
    return sendRPC(rpcNames.MODERATE_CHAT_DELETE, [chatID], callback);
}
PlugAPI.prototype.moderateLockWaitList = function(locked, clear, callback) {
    return this.moderateLockBooth(locked, clear, callback);
}
PlugAPI.prototype.moderateLockBooth = function(locked, clear, callback) {
    return sendRPC(rpcNames.ROOM_LOCK_BOOTH, [locked, clear], callback);
}
PlugAPI.prototype.getUsers = function() {
    return room.getUsers();
}
PlugAPI.prototype.getUser = function(userid) {
    return room.getUser(userid);
}
PlugAPI.prototype.getAudience = function(name) {
    return room.getAudience();
}
PlugAPI.prototype.getDJ = function() {
    return room.getDJ();
}
PlugAPI.prototype.getDJs = function() {
    return room.getDJs();
}
PlugAPI.prototype.getStaff = function() {
    return room.getStaff();
}
PlugAPI.prototype.getAdmins = function() {
    return room.getAdmins();
}
PlugAPI.prototype.getHost = function() {
    return room.getHost();
}
PlugAPI.prototype.getSelf = function() {
    return room.getSelf();
}
PlugAPI.prototype.getWaitList = function() {
    return room.getWaitlist();
}
PlugAPI.prototype.getWaitListPosition = function(userid) {
    return room.getWaitListPosition(userid);
}
PlugAPI.prototype.getAmbassadors = function() {
    return room.getAmbassadors();
}
PlugAPI.prototype.getMedia = function() {
    return room.getMedia();
}
PlugAPI.prototype.getRoomScore = function() {
    return room.getRoomScore();
}
PlugAPI.prototype.createPlaylist = function(name, callback) {
    return sendRPC(rpcNames.PLAYLIST_CREATE, name, callback);
}
PlugAPI.prototype.addSongToPlaylist = function(playlistId, songid, callback) {
    return sendRPC(rpcNames.PLAYLIST_MEDIA_INSERT, [playlistId, null, -1, [songid]], callback);
}
PlugAPI.prototype.getPlaylists = function(callback) {
    return sendRPC(rpcNames.PLAYLIST_SELECT, [new Date(0).toISOString().replace('T', ' '), null, 100, null], callback);
}
PlugAPI.prototype.activatePlaylist = function(playlist_id, callback) {
    return sendRPC(rpcNames.PLAYLIST_ACTIVATE, [playlist_id], callback);
}
PlugAPI.prototype.playlistMoveSong = function(playlist, song_id, position, callback) {
    return sendRPC(rpcNames.PLAYLIST_MEDIA_MOVE, [playlist.id, playlist.items[position],
        [song_id]
    ], callback);
}

PlugAPI.prototype.listen = function(port, address) {
    var _this = this;
    http.createServer(function(req, res) {
        var dataStr = '';
        req.on('data', function(chunk) {
            dataStr += chunk.toString();
        });
        req.on('end', function() {
            var data = querystring.parse(dataStr);
            req._POST = data;
            _this.emit('httpRequest', req, res);
        });
    }).listen(port, address);
}

PlugAPI.prototype.tcpListen = function(port, address) {
    var _this = this;
    net.createServer(function(socket) {
        socket.on('connect', function() {
            _this.emit('tcpConnect', socket);
        });
        socket.on('data', function(data) {
            var msg = data.toString();
            if (msg[msg.length - 1] == '\n')
                _this.emit('tcpMessage', socket, msg.substr(0, msg.length - 1));
        });
        socket.on('end', function() {
            _this.emit('tcpEnd', socket);
        });
    }).listen(port, address);
}
module.exports = PlugAPI;