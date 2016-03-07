'use strict';

// plugAPI
/**
 * BufferObject class
 * @type {BufferObject|exports}
 * @private
 */
const BufferObject = require('./bufferObject');

/**
 * CookieHandler class
 * @type {CookieHandler|exports}
 * @private
 */
const CookieHandler = require('./cookie');

/**
 * Logger class
 * @type {Logger|exports}
 * @private
 */
const Logger = require('./logger');

/**
 * Event Object Types
 * @type {exports}
 * @private
 */
const eventObjectTypes = require('./eventObjectTypes');

/**
 * Room class
 * @type {Room|exports}
 * @private
 */
const Room = require('./room');

/**
 * Package.json of plugAPI
 * @type {exports}
 * @private
 */
const PlugAPIInfo = require('../package.json');

// Node.JS Core Modules
const http = require('http');
const util = require('util');

// Third-party modules
const EventEmitter3 = require('eventemitter3');
const got = require('got');
const WS = require('ws');
const chalk = require('chalk');

const utils = require('./utils');

/**
 * REST Endpoints
 * @type {{CHAT_DELETE: String, HISTORY: String, MODERATE_ADD_DJ: String, MODERATE_BAN: String, MODERATE_BOOTH: String, MODERATE_MOVE_DJ: String, MODERATE_MUTE: String, MODERATE_PERMISSIONS: String, MODERATE_REMOVE_DJ: String, MODERATE_SKIP: String, MODERATE_UNBAN: String, MODERATE_UNMUTE: String, PLAYLIST: String, ROOM_CYCLE_BOOTH: String, ROOM_INFO: String, ROOM_LOCK_BOOTH: String, USER_SET_AVATAR: String, USER_GET_AVATARS: String}}
 * @private
 */
const endpoints = {
    CHAT_DELETE: 'chat/',
    HISTORY: 'rooms/history',
    MODERATE_ADD_DJ: 'booth/add',
    MODERATE_BAN: 'bans/add',
    MODERATE_BOOTH: 'booth',
    MODERATE_MOVE_DJ: 'booth/move',
    MODERATE_MUTE: 'mutes',
    MODERATE_PERMISSIONS: 'staff/update',
    MODERATE_REMOVE_DJ: 'booth/remove/',
    MODERATE_SKIP: 'booth/skip',
    MODERATE_STAFF: 'staff/',
    MODERATE_UNBAN: 'bans/',
    MODERATE_UNMUTE: 'mutes/',
    PLAYLIST: 'playlists',
    ROOM_CYCLE_BOOTH: 'booth/cycle',
    ROOM_INFO: 'rooms/update',
    ROOM_LOCK_BOOTH: 'booth/lock',
    SKIP_ME: 'booth/skip/me',
    USER_INFO: 'users/me',
    USER_GET_AVATARS: 'store/inventory/avatars',
    USER_SET_AVATAR: 'users/avatar'
};

/**
 * That is this and this is that
 * @type {PlugAPI}
 * @private
 */
let that;

/**
 * WebSocket (connection to plug.DJ's socket server)
 * @type {null|WebSocket}
 * @private
 */
let ws = null;

/**
 * Instance of room
 * @type {Room}
 * @private
 */
let room = new Room();

/**
 * Is everything initialized?
 * @type {Boolean}
 * @private
 */
let initialized = false;

/**
 * Prefix that defines if a message is a command
 * @type {String}
 * @private
 */
let commandPrefix = '!';

/**
 * Auth code for plug.DJ
 * @type {null|String}
 * @private
 */
let _authCode = null;

/**
 * Cookie handler
 * @type {CookieHandler}
 * @private
 */
let _cookies = null;

/**
 * List over chat history
 * Contains up to 512 messages
 * @type {Array}
 * @private
 */
const chatHistory = [];

/**
 * Should user be able to delete all chat?
 * @type {Boolean}
 */
let deleteAllChat = false; // eslint-disable-line prefer-const

/**
 * Base URL for all requests
 */
let baseURL = 'https://plug.dj'; // eslint-disable-line prefer-const

/**
 * Contains informations about requests sent to server
 * @type {{queue: Array, sent: Number, limit: Number, running: Boolean}}
 * @private
 */
const serverRequests = {
    queue: [],
    sent: 0,
    limit: 10,
    running: false
};

/**
 * Slug of room, that the bot is currently connecting to
 * @type {null|String}
 * @private
 */
let connectingRoomSlug = null;

/**
 * The logger of plugAPI
 * @type {Logger}
 * @private
 */
let logger = new Logger('plugAPI');

/**
 * Current delay between chat messages
 * @type {Number}
 * @private
 */
let floodProtectionDelay = 200;

/**
 * Queue of outgoing chat messages
 * @type {Array}
 * @private
 */
const chatQueue = [];

/* eslint-disable valid-jsdoc */

/**
 * Playlist data for the user
 * @type {BufferObject}
 * @private
 */
const playlists = new BufferObject(null, (callback) => {
    queueREST('GET', endpoints.PLAYLIST, undefined, callback);
}, 6e5);

/* eslint-enable valid-jsdoc */

/**
 * Authentication information (e-mail and password)
 * THIS MUST NEVER BE ACCESSIBLE NOR PRINTING OUT TO CONSOLE
 * @type {Object}
 * @private
 */
let authenticationInfo;

function __bind(fn, me) {
    return function() {
        return fn.apply(me, arguments);
    };
}

function throwOrCall(error, callback) {
    if (typeof callback === 'function') return callback(error, null);
    throw new Error(error);
}

(function() {

    /**
     * Send the next chat message in queue
     */
    function sendNextMessage() {
        if (chatQueue.length > 0) {
            const nextMessage = chatQueue.shift();
            const msg = nextMessage.msg;
            const timeout = nextMessage.timeout;

            sendEvent('chat', msg);
            if (timeout !== undefined && isFinite(parseInt(timeout, 10)) && parseInt(timeout, 10) > 0) {
                const specificChatDeleter = function(data) { // eslint-disable-line newline-after-var

                    if (data.raw.uid === room.getSelf().id && data.message.trim() === msg.trim()) {
                        setTimeout(() => {
                            this.moderateDeleteChat(data.raw.cid);
                        }, parseInt(timeout, 10) * 1E3);
                        that.off('chat', specificChatDeleter);
                    }
                };
                that.on('chat', specificChatDeleter);
            }
        }
        setTimeout(() => {
            sendNextMessage();
        }, floodProtectionDelay);
    }

    sendNextMessage();
})();

/**
 * Check if an object contains a value
 * @param {Object} obj The object
 * @param {*} value The value
 * @param {Boolean} [strict] Whether to use strict mode check or not
 * @returns {Boolean} if object contains value
 */
function objectContainsValue(obj, value, strict) {
    for (const i of obj) {
        if (!strict && i == value || strict && i === value) return true; // eslint-disable-line eqeqeq
    }
    return false;
}

/**
 * Queue chat message
 * @param {String} msg Chat message
 * @param {Number} [timeout] Timeout before auto deleting message (in seconds)
 */
function queueChat(msg, timeout) {
    chatQueue.push({
        msg,
        timeout
    });
}

/**
 * DateUtilities
 * Copyright (C) 2014 by Plug DJ, Inc.
 * Modified by TAT (TAT@plugCubed.net)
 */
const DateUtilities = {
    MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    SERVER_TIME: null,
    OFFSET: 0,
    setServerTime(e) {
        this.SERVER_TIME = this.convertUnixDateStringToDate(e);
        this.OFFSET = this.SERVER_TIME.getTime() - (new Date()).getTime();
    },
    yearsSince(e) {
        return this.serverDate().getFullYear() - e.getFullYear();
    },
    monthsSince(e) {
        const t = this.serverDate();

        return (t.getFullYear() - e.getFullYear()) * 12 + (t.getMonth() - e.getMonth());
    },
    daysSince(e) {
        const t = this.serverDate();
        const n = t.getTime();
        const r = e.getTime();
        const i = 864e5;
        let s = (n - r) / i;
        const o = (n - r) % i / i;

        if (o > 0 && o * i > this.secondsSinceMidnight(t) * 1e3) {
            s++;
        }
        return ~~s;
    },
    hoursSince(e) {
        return ~~((this.serverDate().getTime() - e.getTime()) / 36e5);
    },
    minutesSince(e) {
        return ~~((this.serverDate().getTime() - e.getTime()) / 6e4);
    },
    secondsSince(e) {
        return ~~((this.serverDate().getTime() - e.getTime()) / 1e3);
    },
    monthName(e, t) {
        const n = this.MONTHS[e.getMonth()];

        return t ? n : n.substr(0, 3);
    },
    secondsSinceMidnight(e) {
        const t = new Date(e.getTime());

        this.midnight(t);
        return ~~((e.getTime() - t.getTime()) / 1e3);
    },
    midnight(e) {
        e.setHours(0);
        e.setMinutes(0);
        e.setSeconds(0);
        e.setMilliseconds(0);
    },
    minutesUntil(e) {
        return ~~((e.getTime() - this.serverDate().getTime()) / 6e4);
    },
    millisecondsUntil(e) {
        return e.getTime() - this.serverDate().getTime();
    },
    serverDate() {
        return new Date((new Date()).getTime() + this.OFFSET);
    },
    getServerEpoch() {
        return Date.now() + this.OFFSET;
    },
    getSecondsElapsed(e) {
        return !e || e === '0' ? 0 : this.secondsSince(new Date(e.substr(0, e.indexOf('.'))));
    },
    convertUnixDateStringToDate(e) {
        return e ? new Date(e.substr(0, 4), Number(e.substr(5, 2)) - 1, e.substr(8, 2), e.substr(11, 2), e.substr(14, 2), e.substr(17, 2)) : null;
    }
};

/**
 * The ticker that runs through the queue and executes them when it's time
 * @private
 */
function queueTicker() {
    serverRequests.running = true;
    const canSend = serverRequests.sent < serverRequests.limit;
    const obj = serverRequests.queue.pop();

    if (canSend && obj) {
        serverRequests.sent++;
        if (obj.type === 'rest') {
            sendREST(obj.opts, obj.callback);
        } else if (obj.type === 'connect') {
            if (obj.server === 'socket') {
                connectSocket(obj.room);
            }
        }

        setTimeout(() => {
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
 * @callback RESTCallback
 * @param {null|String} err Error message on error; otherwise null
 * @param {null|*} data Data on success; otherwise null
 */

/**
 * Queue REST request
 * @param {String} method REST method
 * @param {String} endpoint Endpoint on server
 * @param {Object | Undefined} [data] Data
 * @param {RESTCallback|  Undefined} [callback] Callback function
 * @param {Boolean} [skipQueue] Skip queue and send the request immediately
 * @private
 */
function queueREST(method, endpoint, data, callback, skipQueue) {
    if (['POST', 'PUT', 'GET', 'DELETE'].indexOf(method) < 0) {
        logger.error(method, 'needs update');
        return;
    }

    callback = typeof callback === 'function' ? __bind(callback, that) : function() {};

    const opts = {
        method,
        url: `${baseURL}/_/${endpoint}`,
        headers: {
            Accept: 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/json',
            cookie: _cookies.toString()
        }
    };

    if (data != null) {
        opts.body = JSON.stringify(data);
    }

    if (skipQueue && skipQueue === true) {
        sendREST(opts, callback);
    } else {
        serverRequests.queue.push({
            type: 'rest',
            opts,
            callback
        });
        if (!serverRequests.running) {
            queueTicker();
        }
    }
}

/**
 * Send a REST request
 * @param {Object} opts An object of options to send in to the request module.
 * @param {RESTCallback} callback Callback function
 * @private
 */
function sendREST(opts, callback) {
    got(opts.url, Object.assign(opts, {
        json: true
    }))
    .then((res) => {
        if (res.body && res.body.status === 'ok') {
            return callback(null, res.body.data);
        }
        return callback(res.body.status && res.body.status || new Error("Can't connect to plug.dj"), null);
    })
    .catch((error) => {
        logger.error('[REST Error]', error.stack);
        return callback(error.stack, null);
    });
}

/**
 * Queue that the bot should join a room.
 * @param {String} roomSlug Slug of room to join after connection
 * @param {RESTCallback} [callback] Callback function
 * @private
 */
function joinRoom(roomSlug, callback) {
    queueREST('POST', 'rooms/join', {
        slug: roomSlug
    }, (err) => {
        if (err) {
            if (isFinite(err)) {
                if (err >= 400 && err < 500) {
                    throwOrCall(`Invalid Room URL. Please Check If the RoomSlug ${roomSlug} is correct`, callback);
                } else {
                    throwOrCall('Internal Server Error from Plug.dj', callback);
                }
            } else {
                logger.error('Error while joining:', err ? err : 'Unknown error');
                setTimeout(() => {
                    joinRoom(roomSlug, callback);
                }, 1e3);
                return;
            }

        }
        getRoomState(callback);
    });
}

/**
 * Get room state.
 * @param {RESTCallback} callback Callback function
 */
function getRoomState(callback) {
    queueREST('GET', 'rooms/state', undefined, (err, data) => {
        if (err) {
            if (isFinite(err) && err >= 500) {
                throwOrCall('Internal Server Error from Plug.dj', callback);
            } else {
                logger.error('Error getting room state:', err ? err : 'Unknown error');
                setTimeout(() => {
                    getRoomState(callback);
                }, 1e3);
                return;
            }
        }
        connectingRoomSlug = null;
        initRoom(data[0], () => {
            if (typeof callback === 'function') {
                return callback(null, data);
            }
        });
    });
}

/**
 * Create instance of PlugAPI
 * @param {{email: String, password: String}} authenticationData An object representing the login info of the user
 * @param {Function} [callback] An optional callback utilized in async mode
 * @letructor
 */
function PlugAPI(authenticationData, callback) {

    if (typeof authenticationData !== 'object') {
        throwOrCall('You must pass the authentication data into the PlugAPI object to connect correctly', callback);
    } else {
        if (typeof authenticationData.email !== 'string') {
            throwOrCall('Missing Login Email', callback);
        }
        if (typeof authenticationData.password !== 'string') {
            throwOrCall('Missing Login Password', callback);
        }
    }

    that = this;

    let cookieHash = '';

    (function(crypto) {
        const hashPriority = ['sha256', 'sha512'];
        let foundHash = '';

        (function(hashes) {
            for (const i of hashes) {
                const hash = i;

                if (hashPriority.indexOf(hash) > -1) {
                    if (hashPriority.indexOf(hash) > hashPriority.indexOf(foundHash)) {
                        foundHash = hash;
                    }
                }
            }
        })(crypto.getHashes());
        if (foundHash !== '') {
            const hash = crypto.createHash(foundHash);

            hash.update(authenticationData.email);
            hash.update(authenticationData.password);
            cookieHash = hash.digest('hex');
        }
    })(require('crypto'));
    _cookies = new CookieHandler(cookieHash);
    authenticationInfo = authenticationData;
    performLoginCredentials(callback);

    /**
     * Should the bot split messages up if hitting message length limit?
     * @type {Boolean}
     */
    this.multiLine = false;

    /**
     * Max splits
     * @type {Number}
     */
    this.multiLineLimit = 5;

    /**
     * Should the bot process commands the bot itself is sending?
     * @type {Boolean}
     */
    this.processOwnMessages = false;

    /**
     * Should the bot delete incomming commands?
     * @type {Boolean}
     */
    this.deleteCommands = true;

    /**
     * Should muted users trigger normal events?
     * @type {Boolean}
     */
    this.mutedTriggerNormalEvents = false;

    room.registerUserExtensions(this);

    /**
     * Pre-command Handler
     * @param {Object} [obj] An object used to pre process commands
     * @returns {Boolean} If false, the command is not getting handled.
     */
    this.preCommandHandler = function(obj) {
        return true;
    };

    logger.info(`Running plugAPI v${PlugAPIInfo.version}`);
}

/**
 * Handling incoming messages.
 * Emitting the correct events depending on commands, mentions, etc.
 * @param {Object} messageData plug.DJ message event data
 * @private
 */
function receivedChatMessage(messageData) {
    if (!initialized) return;

    const disconnectedUser = messageData.from == null;
    const mutedUser = !disconnectedUser && room.isMuted(messageData.from.id);
    const prefixChatEventType = (mutedUser && !that.mutedTriggerNormalEvents ? 'muted:' : '');
    const message = messageData.message;

    if (!disconnectedUser && message.startsWith(commandPrefix) && (that.processOwnMessages || messageData.from.id !== room.getSelf().id)) {
        const cmd = message.substr(commandPrefix.length).split(' ')[0];

        messageData.command = cmd;
        messageData.args = message.substr(commandPrefix.length + cmd.length + 1);

        // Mentions => Mention placeholder
        let lastIndex = messageData.args.indexOf('@');
        const allUsers = room.getUsers();
        const random = Math.ceil(Math.random() * 1E10);

        while (lastIndex > -1) {
            const test = messageData.args.substr(lastIndex);
            let found = null;

            for (const i of allUsers) {
                if (test.indexOf(i.username) === 1) {
                    if (found === null || i.username.length > found.username.length) {
                        found = i;
                    }
                }
            }
            if (found !== null) {
                messageData.args = `${messageData.args.substr(0, lastIndex)}%MENTION-${random}-${messageData.mentions.length}%${messageData.args.substr(lastIndex + found.username.length + 1)}`;
                messageData.mentions.push(found);
            }
            lastIndex = messageData.args.indexOf('@', lastIndex + 1);
        }

        // Arguments
        messageData.args = messageData.args.split(' ');
        if (messageData.args === '') {
            messageData.args = [];
        } else if (messageData.args.length > 0) {
            for (let i of messageData.args) {
                if (isFinite(parseInt(i, 10))) {
                    i = parseInt(i, 10);
                }
            }
        }

        // Mention placeholder => User object
        const mentions = Object.keys(messageData.mentions);
        const length = mentions.length;

        for (let i = 0; i < length; i++) {
            messageData.args[messageData.args.indexOf(`%MENTION-${random}-${i}%`)] = messageData.mentions[i];
        }

        // Pre command handler
        if (typeof that.preCommandHandler === 'function' && that.preCommandHandler(messageData) === false) return;

        // Functions
        messageData.respond = function() {
            const chatMessage = [];

            for (const arg of arguments) {
                chatMessage.push(arg);
            }

            return that.sendChat(`@${this.from.username} ${chatMessage.join(' ')}`);
        };
        messageData.respondTimeout = function() {
            const chatMessage = [];

            for (const arg of arguments) {
                chatMessage.push(arg);
            }

            const timeout = parseInt(chatMessage.splice(chatMessage.length - 1, 1), 10);

            return that.sendChat(`@${this.from.username} ${chatMessage.join(' ')}`, timeout);
        };
        messageData.havePermission = function(permission, callback) {
            if (permission == null) {
                permission = 0;
            }
            if (that.havePermission(this.from.id, permission)) {
                if (typeof callback === 'function') {
                    return callback(true);
                }
                return true;
            }
            if (typeof callback === 'function') {
                return callback(false);
            }
            return false;
        };
        messageData.isFrom = function(ids, success, failure) {
            if (typeof ids === 'string') {
                ids = [ids];
            }
            if (ids == null || !Array.isArray(ids)) {
                if (typeof failure === 'function') {
                    failure();
                }
                return false;
            }
            const isFrom = ids.indexOf(messageData.uid) > -1;

            if (isFrom && typeof success === 'function') {
                success();
            } else if (!isFrom && typeof failure === 'function') {
                failure();
            }
            return isFrom;
        };
        if (!mutedUser) {
            that.emit(`${prefixChatEventType}${PlugAPI.events.CHAT_COMMAND}`, messageData);
            that.emit(`${prefixChatEventType}${PlugAPI.events.CHAT_COMMAND}:${cmd}`, messageData);
            if (that.deleteCommands) {
                that.moderateDeleteChat(messageData.raw.cid);
            }
        }
    } else if (messageData.type === 'emote') {
        that.emit(`${prefixChatEventType}${PlugAPI.events.CHAT}:emote`, messageData);
    }

    that.emit(`${prefixChatEventType}${PlugAPI.events.CHAT}`, messageData);
    that.emit(`${prefixChatEventType}${PlugAPI.events.CHAT}:'${messageData.raw.type}`, messageData);
    if (room.getUser() !== null && message.includes(`@${room.getUser().username}`)) {
        that.emit(`${prefixChatEventType}${PlugAPI.events.CHAT}:mention`, messageData);
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
    got(`${baseURL}/`, {
        headers: {
            Cookie: _cookies.toString()
        }
    })
    .then((res) => {
        _authCode = res.body.split('_jm')[1].split('"')[1];
        const _st = res.body.split('_st')[1].split('"')[1];

        DateUtilities.setServerTime(_st);
        return callback();
    })
    .catch((err) => {
        logger.error('Error getting auth code:', err);
    });
}

/**
 * Connect to plug.DJ's socket server
 * @param {String} roomSlug Slug of room to join after connection
 * @private
 */
function connectSocket(roomSlug) {
    if (_authCode === null || _authCode === '') {
        getAuthCode(() => {
            connectSocket(roomSlug);
        });
        return;
    }

    ws = new WS('wss://godj.plug.dj:443/socket', {
        origin: baseURL
    });
    ws.on('open', () => {
        logger.success(chalk.green('[Socket Server] Connected'));
        sendEvent('auth', _authCode);

        that.emit('connected');
        that.emit('server:socket:connected');
    });
    ws.on('message', (data) => {
        if (data !== 'h') {
            const payload = JSON.parse(data || '[]');

            for (const i of payload) {
                ws.emit('data', i);
            }
        }
    });
    ws.on('data', messageHandler);
    ws.on('data', (data) => {
        return that.emit('tcpMessage', data);
    });
    ws.on('error', (a) => {
        logger.error('[Socket Server] Error:', a);
        process.nextTick(() => {
            const slug = room.getRoomMeta().slug ? room.getRoomMeta().slug : roomSlug;

            that.close();
            logger.info('[Socket Server] Reconnecting');
            setImmediate(() => {
                that.connect(slug);
            });

        });
    });
    ws.on('close', (a) => {
        logger.warn('[Socket Server] Closed with code', a);
        process.nextTick(() => {
            const slug = room.getRoomMeta().slug ? room.getRoomMeta().slug : roomSlug;

            that.close();
            logger.info('[Socket Server] Reconnecting');
            setImmediate(() => {
                that.connect(slug);
            });
        });
    });
}

/**
 * Sends serialized data to websocket
 * @param  {[type]}   data    The data to send in
 * @param  {[type]}   [options] Optional options for ws
 * @param  {Function} [cb]      Optional callback for ws
 * @private
 */
function sendWebsocket(data, options, cb) {
    data = typeof data === 'string' ? data : JSON.stringify(data);
    if (ws != null && ws.readyState === WS.OPEN) {
        ws.send(data, options, cb);
    }
}

/**
 * Sends in a websocket event to plug's servers
 * @param  {[type]} type The Event type to send in
 * @param  {[type]} data The data to send in.
 * @private
 */
function sendEvent(type, data) {
    sendWebsocket({
        a: type,
        p: data,
        t: DateUtilities.getServerEpoch()
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
    queueREST('GET', endpoints.HISTORY, undefined, __bind(room.setHistory, room));
    that.emit(PlugAPI.events.ROOM_JOIN, data.meta.name);
    initialized = true;
    callback();
}

/**
 * The handling of incoming messages from the Plug.DJ socket server.
 * If any cases are returned instead of breaking (stopping the emitting to the user code) it MUST be commented just before returning.
 * @param {Object} msg Socket events sent in from plug.dj
 * @private
 */
function messageHandler(msg) {

    /**
     * Event type
     * @type {PlugAPI.events}
     */
    const type = msg.a;

    /**
     * Data for the event
     * Will lookup in eventObjectTypes for possible converter function
     * @type {*}
     */
    let data = eventObjectTypes[msg.a] != null ? eventObjectTypes[msg.a](msg.p, room) : msg.p;

    let i;
    let slug;

    switch (type) {
        case 'ack':
            if (data !== '1') {
                slug = room.getRoomMeta().slug;
                that.close();
                _authCode = null;
                performLoginCredentials(null, true);
                that.connect(slug);

                // This event should not be emitted to the user code.
                return;
            }
            queueREST('GET', endpoints.USER_INFO, null, (err, userData) => {
                if (err) throw new Error(`Error Obtaining user info. ${err}`);
                room.setSelf(userData[0]);
                joinRoom(connectingRoomSlug);
            });

            // This event should not be emitted to the user code.
            return;
        case PlugAPI.events.ADVANCE:

            // Add information about lastPlay to the data
            data.lastPlay = {
                dj: room.getDJ(),
                media: room.getMedia(),
                score: room.getRoomScore()
            };

            room.advance(data);

            // Override parts of the event data with actual User objects
            data.currentDJ = room.getDJ();
            data.djs = room.getDJs();
            break;
        case PlugAPI.events.CHAT:
            chatHistory.push(data);

            // If over limit, remove the first item
            if (chatHistory.length > 512) chatHistory.shift();

            receivedChatMessage(data);

            // receivedChatMessage will emit the event with correct chat object and over correct event types
            return;
        case PlugAPI.events.CHAT_DELETE:
            for (i of chatHistory) {
                if (i.id === data.c) chatHistory.splice(i, 1);
            }
            break;
        case PlugAPI.events.ROOM_DESCRIPTION_UPDATE:
            room.setRoomDescription(data.description);
            break;
        case PlugAPI.events.ROOM_NAME_UPDATE:
            room.setRoomName(data.name);
            break;
        case PlugAPI.events.ROOM_WELCOME_UPDATE:
            room.setRoomWelcome(data.welcome);
            break;
        case PlugAPI.events.USER_JOIN:
            room.addUser(data);
            break;
        case PlugAPI.events.USER_LEAVE:

            /**
             * @type {User|null|{id: *}}
             */
            let userData = room.getUser(data);

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
            that.emit(type, that.getUser(data.i));

            // This is getting emitted with the full user object instead of only the user ID
            return;
        case PlugAPI.events.VOTE:
            room.setVote(data.i, data.v);
            break;
        case PlugAPI.events.GRAB:
            room.setGrab(data);
            break;
        case PlugAPI.events.DJ_LIST_CYCLE:
            room.setBoothCycle(data.cycle);
            break;
        case PlugAPI.events.DJ_LIST_LOCKED:
            room.setBoothLocked(data.locked);
            break;
        case PlugAPI.events.DJ_LIST_UPDATE:
            room.setDJs(data);

            // Override the data with full user objects
            data = room.getWaitList();
            break;
        case PlugAPI.events.FLOOD_CHAT:
            floodProtectionDelay += 500;
            setTimeout(() => {
                floodProtectionDelay -= 500;
            }, floodProtectionDelay * 5);
            logger.warning('Flood protection: Slowing down the sending of chat messages temporary');
            break;
        case PlugAPI.events.MAINT_MODE_ALERT:
            logger.warning(`Plug is going into maintenance in  ${data.p}  minutes.`);
            break;
        case PlugAPI.events.MODERATE_STAFF:
            for (i of data.u) {
                room.updateUser({
                    i: i.i,
                    role: i.p
                });
            }
            break;
        case PlugAPI.events.MAINT_MODE:
        case PlugAPI.events.MODERATE_BAN:
        case PlugAPI.events.MODERATE_ADD_DJ:
        case PlugAPI.events.MODERATE_REMOVE_DJ:
        case PlugAPI.events.MODERATE_MOVE_DJ:
        case PlugAPI.events.PLAYLIST_CYCLE:
        case PlugAPI.events.SKIP:
        case PlugAPI.events.MODERATE_SKIP:
        case PlugAPI.events.ROOM_VOTE_SKIP:
        case PlugAPI.events.FRIEND_REQUEST:
        case PlugAPI.events.GIFTED:

            /*
             These will be ignored by plugAPI.
             The server will send updates for each event.
             The events are still being sent to the code, so the bot can still react to the events.
             */
            break;
        case PlugAPI.events.MODERATE_MUTE:

            // Takes care of both mutes and unmutes
            room.muteUser(data);
            break;
        case PlugAPI.events.KILL_SESSION:
            slug = room.getRoomMeta().slug;
            that.close();
            _authCode = null;
            that.connect(slug);
            break;
        case PlugAPI.events.EARN:
            room.setEarn(data);
            break;
        case PlugAPI.events.NOTIFY:
            if (data.action === 'levelUp') {
                logger.info('Congratulations, you have leveled up to level', data.value);
            } else {
                logger.info('Notify', data);
            }
            break;
        case PlugAPI.events.CHAT_LEVEL_UPDATE:
            room.setMinChatLevel(data.level);
            logger.info(`Chat Level has changed to level: ${data.level} By: ${data.user.username}`);
            break;
        default:
        case undefined:
            logger.warning('UNKNOWN MESSAGE FORMAT\n', JSON.stringify(msg, null, 4));
    }
    if (type) {
        that.emit(type, data);
    }
}

/**
 * Perform the login process using credentials.
 * @param {Function} callback Callback
 * @private
 */
function performLoginCredentials(callback) {

    /**
     * Is the login process running.
     * Used for sync
     * @type {boolean}
     */
    let loggingIn = true;

    got(baseURL, {
        headers: {
            cookie: _cookies.toString()
        }
    })
    .then((res) => {
        let csrfToken;

        try {
            _cookies.fromHeaders(res.headers);
            csrfToken = res.body.split('_csrf')[1].split('"')[1];
        } catch (e) {
            throwOrCall(`Login Error: Can't Obtain CSRF Token. ${e.message}`, callback);
        }
        got.post(`${baseURL}/_/auth/login`, {
            body: JSON.stringify({
                csrf: csrfToken,
                email: authenticationInfo.email,
                password: authenticationInfo.password
            }),
            headers: {
                'Content-Type': 'application/json',
                cookie: _cookies.toString()
            },
            json: true
        })
        .then((authRes) => {
            if (authRes.body.status === 'ok' && authRes.statusCode === 200) {
                _cookies.fromHeaders(authRes.headers);
                loggingIn = false;

                if (typeof callback === 'function') {
                    return callback(null, that);
                }
            } else {
                throwOrCall(`Login Error: API Status: ${authRes.body.status} HTTP Status: ${authRes.statusCode}- ${http.STATUS_CODES[authRes.statusCode]}`, callback);
            }
        })
        .catch((err) => {
            setImmediate(() => {
                throwOrCall(`Login Error: ${err}`, callback);
            });
        });
    })
    .catch((err) => {
        setImmediate(() => {
            throwOrCall(`Login Error: ${err}`, callback);
        });
    });

    if (typeof callback !== 'function') {
        const deasync = require('deasync');

        // Wait until the session is set
        while (loggingIn) { //eslint-disable-line
            deasync.sleep(100);
        }
    }
}

/**
 * Create a new logger for your own scripts.
 * @param {String} channel The channel name to add.
 * @returns {Logger} PlugAPI Logger
 */
PlugAPI.CreateLogger = function(channel) {
    if (typeof channel !== 'string') {
        channel = 'Unknown';
    }
    return new Logger(channel);
};

PlugAPI.Utils = utils;

/**
 * Room ranks
 * @type {{NONE: number, RESIDENTDJ: number, BOUNCER: number, MANAGER: number, COHOST: number, HOST: number}}
 * @let
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
 * @let
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
 * @type {{OFFLINE: number, ONLINE: number}}
 * @let
 */
PlugAPI.STATUS = {
    OFFLINE: 0,
    ONLINE: 1
};

/**
 * Ban Lengths
 * @type {{HOUR: string, DAY: string, PERMA: string}}
 * @let
 */
PlugAPI.BAN = {
    HOUR: 'h',
    DAY: 'd',
    PERMA: 'f'
};

/**
 * Ban Reasons
 * @type {{SPAMMING_TROLLING: number, VERBAL_ABUSE: number, OFFENSIVE_MEDIA: number, INAPPROPRIATE_GENRE: number, NEGATIVE_ATTITUDE: number}}
 * @let
 */
PlugAPI.BAN_REASON = {
    SPAMMING_TROLLING: 1,
    VERBAL_ABUSE: 2,
    OFFENSIVE_MEDIA: 3,
    INAPPROPRIATE_GENRE: 4,
    NEGATIVE_ATTITUDE: 5
};

/**
 * Mute Lengths
 * Short: 15 minutes
 * Medium: 30 minutes
 * Long: 45 minutes
 * @type {{SHORT: string, MEDIUM: string, LONG: string}}
 * @let
 */
PlugAPI.MUTE = {
    SHORT: 's',
    MEDIUM: 'm',
    LONG: 'l'
};

/**
 * Mute Reasons
 * @type {{VIOLATING_COMMUNITY_RULES: number, VERBAL_ABUSE: number, SPAMMING_TROLLING: number, OFFENSIVE_LANGUAGE: number, NEGATIVE_ATTITUDE: number}}
 * @let
 */
PlugAPI.MUTE_REASON = {
    VIOLATING_COMMUNITY_RULES: 1,
    VERBAL_ABUSE: 2,
    SPAMMING_TROLLING: 3,
    OFFENSIVE_LANGUAGE: 4,
    NEGATIVE_ATTITUDE: 5
};

/**
 * Event Types
 * @let {{ADVANCE: string, BAN: string, BOOTH_LOCKED: string, CHAT: string, CHAT_COMMAND: string, CHAT_DELETE: string, CHAT_EMOTE: string, CHAT_LEVEL_UPDATE: string, COMMAND: string, DJ_LIST_CYCLE: string, DJ_LIST_UPDATE: string, EARN: string, EMOTE: string, FOLLOW_JOIN: string, FLOOD_CHAT: string, GRAB: string, KILL_SESSION: string, MODERATE_ADD_DJ: string, MODERATE_ADD_WAITLIST: string, MODERATE_AMBASSADOR: string, MODERATE_BAN: string, MODERATE_MOVE_DJ: string, MODERATE_MUTE: string, MODERATE_REMOVE_DJ: string, MODERATE_REMOVE_WAITLIST: string, MODERATE_SKIP: string, MODERATE_STAFF: string, NOTIFY: string, PDJ_MESSAGE: string, PDJ_UPDATE: string, PING: string, PLAYLIST_CYCLE: string, REQUEST_DURATION: string, REQUEST_DURATION_RETRY: string, ROOM_CHANGE: string, ROOM_DESCRIPTION_UPDATE: string, ROOM_JOIN: string, ROOM_NAME_UPDATE: string, ROOM_VOTE_SKIP: string, ROOM_WELCOME_UPDATE: string, SESSION_CLOSE: string, SKIP: string, STROBE_TOGGLE: string, USER_COUNTER_UPDATE: string, USER_FOLLOW: string, USER_JOIN: string, USER_LEAVE: string, USER_UPDATE: string, VOTE: string}}
 */
PlugAPI.events = {
    ADVANCE: 'advance',
    BAN: 'ban',
    BOOTH_LOCKED: 'boothLocked',
    CHAT: 'chat',
    CHAT_COMMAND: 'command',
    CHAT_DELETE: 'chatDelete',
    CHAT_LEVEL_UPDATE: 'roomMinChatLevelUpdate',
    COMMAND: 'command',
    DJ_LIST_CYCLE: 'djListCycle',
    DJ_LIST_UPDATE: 'djListUpdate',
    DJ_LIST_LOCKED: 'djListLocked',
    EARN: 'earn',
    FOLLOW_JOIN: 'followJoin',
    FLOOD_CHAT: 'floodChat',
    FRIEND_REQUEST: 'friendRequest',
    GIFTED: 'gifted',
    GRAB: 'grab',
    KILL_SESSION: 'killSession',
    MAINT_MODE: 'plugMaintenance',
    MAINT_MODE_ALERT: 'plugMaintenanceAlert',
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
util.inherits(PlugAPI, EventEmitter3);

/**
 * Connect to a room
 * @param {String} roomSlug Slug of room (The part after https://plug.dj/)
 */
PlugAPI.prototype.connect = function(roomSlug) {
    if (!roomSlug || typeof roomSlug !== 'string' || roomSlug.length === 0 || roomSlug.startsWith('/')) {
        throw new Error(`Invalid room name: ${roomSlug}`);
    }

    if (connectingRoomSlug != null) {
        logger.error('Already connecting to a room');
        return;
    }

    // Only connect if session cookie is set
    if (!_cookies.contain('session')) {
        setImmediate(() => {
            that.connect(roomSlug);
        });
        return;
    }

    connectingRoomSlug = roomSlug;
    queueConnectSocket(roomSlug);
};

/**
 * Join another room
 * @param {String} slug The room slug to change to
 */
PlugAPI.prototype.changeRoom = function(slug) {
    joinRoom(slug);
};

/**
 * Close the connection
 */
PlugAPI.prototype.close = function() {
    connectingRoomSlug = null;
    ws.removeAllListeners('close');
    ws.close();
    _authCode = null;
    room = new Room();
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
        const history = room.getHistory();

        if (history.length > 1) {
            callback(history);
            return;
        }
    }
    setImmediate(() => {
        that.getHistory(callback);
    });
};

PlugAPI.prototype.getBoothMeta = function() {
    return room.getBoothMeta();
};

PlugAPI.prototype.getHistoryID = function() {
    return room.getHistoryID();
};

PlugAPI.prototype.getMedia = function() {
    return room.getMedia();
};

PlugAPI.prototype.getRoomMeta = function() {
    return room.getRoomMeta();
};

PlugAPI.prototype.getRoomScore = function() {
    return room.getRoomScore();
};

PlugAPI.prototype.joinBooth = function(callback) {
    if (!room.getRoomMeta().slug || room.isDJ() || room.isInWaitList() || (room.getBoothMeta().isLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.RESIDENTDJ)) || this.getDJs().length >= 50) {
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

/**
 * Send a chat message
 * @param {String} msg Message
 * @param {int} [timeout] If set, auto deletes the message after x seconds. (Needs to have modChat permission)
 */
PlugAPI.prototype.sendChat = function(msg, timeout) {
    if (msg == null) {
        return;
    }
    if (msg.length > 235 && this.multiLine) {
        const lines = msg.replace(/.{235}\S*\s+/g, '$&¤').split(/\s+¤/);

        for (const i of lines) {
            msg = i;
            if (i > 0) {
                msg = `(continued) ${msg}`;
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
 * Get the current avatar
 * @returns {User.avatarID|String} AvatarID of the current avatar
 */
PlugAPI.prototype.getAvatar = function() {
    return room.getUser().avatarID;
};

/**
 * Get all available avatars
 * @param {RESTCallback} callback Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.getAvatars = function(callback) {
    if (!room.getRoomMeta().slug) return false;
    queueREST('GET', endpoints.USER_GET_AVATARS, undefined, callback);
    return true;
};

/**
 * Set avatar
 * Be sure you only use avatars that are available {@link PlugAPI.prototype.getAvatars}
 * @param {String} avatar Avatar ID
 * @param {RESTCallback} callback Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.setAvatar = function(avatar, callback) {
    if (!room.getRoomMeta().slug || !avatar) return false;
    queueREST('PUT', endpoints.USER_SET_AVATAR, {
        id: avatar
    }, callback);
    return true;
};

/**
 * Get plug.dj admins currently in the community
 * @returns {Array} An array of all admins in room
 */
PlugAPI.prototype.getAdmins = function() {
    return room.getAdmins();
};

/**
 * Get all staff for the community, also offline.
 * @param {RESTCallback} callback Callback function
 */
PlugAPI.prototype.getAllStaff = function(callback) {
    if (typeof callback !== 'function') {
        logger.error('Missing callback for getAllStaff');
        return;
    }
    queueREST('GET', 'staff', undefined, callback);
};

/**
 * Get all ambassadors in the community
 * @returns {Array} An array of all ambassadors in room
 */
PlugAPI.prototype.getAmbassadors = function() {
    return room.getAmbassadors();
};

/**
 * Get users in the community that aren't DJing nor in the waitlist
 * @returns {Array} An array of all users that aren't DJing nor in the waitlist
 */
PlugAPI.prototype.getAudience = function() {
    return room.getAudience();
};

/**
 * Get the current DJ
 * @returns {User|null} Current DJ or {null} if no one is currently DJing
 */
PlugAPI.prototype.getDJ = function() {
    return room.getDJ();
};

/**
 * Get the DJ and users in the waitlist
 * @returns {Array} An array of all DJs and users in the waitlist
 */
PlugAPI.prototype.getDJs = function() {
    return room.getDJs();
};

/**
 * Host if in community, otherwise null
 * @returns {User|null} The Host as a user object if they are in room, otherwise null
 */
PlugAPI.prototype.getHost = function() {
    return room.getHost();
};

/**
 * Get the user object for yourself
 * @returns {User|null} The user object of yourself.
 */
PlugAPI.prototype.getSelf = function() {
    return room.getSelf();
};

/**
 * Get staff currently in the community
 * @returns {User[]} A User array of all staff in room
 */
PlugAPI.prototype.getStaff = function() {
    return room.getStaff();
};

/**
 * Get specific user in the community
 * @param {Number} [uid] The User ID to lookup. Use's bot's ID if not sent in
 * @returns {User[]|null} A user object of the user,  or null if can't be found.
 */
PlugAPI.prototype.getUser = function(uid) {
    return room.getUser(uid);
};

/**
 * Get all users in the community
 * @returns {User[]} An array of all users in room
 */
PlugAPI.prototype.getUsers = function() {
    return room.getUsers();
};

/**
 * Get all DJs in waitlist
 * @returns {User[]} An array of all users in waitlist
 */
PlugAPI.prototype.getWaitList = function() {
    return room.getWaitList();
};

/**
 * Get a user's position in waitlist
 * @param {Number} [uid] User ID
 * @returns {Number} Position in waitlist.
 * If current DJ, it returns 0.
 * If not in waitlist, it returns -1
 */
PlugAPI.prototype.getWaitListPosition = function(uid) {
    return room.getWaitListPosition(uid);
};

/**
 * Implementation of plug.dj haveRoomPermission method
 * @param {undefined|Number} uid The User's id to check for permissions
 * @param {Number} permission Permission number
 * @param {Boolean} [global] Only check global permission
 * @returns {Boolean} True if user has permission specified, false if not
 */
PlugAPI.prototype.havePermission = function(uid, permission, global) {
    if (global) return room.haveGlobalPermission(uid, permission);
    return room.haveRoomPermission(uid, permission) || room.haveGlobalPermission(uid, permission);
};

/**
 * Get time elapsed of current song
 * @returns {Number} Seconds elapsed, -1 if no song is currently playing
 */
PlugAPI.prototype.getTimeElapsed = function() {
    if (!room.getRoomMeta().slug || room.getMedia() == null) {
        return -1;
    }
    return Math.min(room.getMedia().duration, DateUtilities.getSecondsElapsed(room.getStartTime()));
};

/**
 * Get time remaining of current song
 * @returns {number} Seconds remaining, -1 if no song is currently playing
 */
PlugAPI.prototype.getTimeRemaining = function() {
    if (!room.getRoomMeta().slug || room.getMedia() == null) {
        return -1;
    }
    return room.getMedia().duration - this.getTimeElapsed();
};

/**
 * Get the command prefix
 * @returns {String} The command prefix being used
 */
PlugAPI.prototype.getCommandPrefix = function() {
    return commandPrefix;
};

/**
 * Set the command prefix
 * @param {String} prefix The command prefix to use
 * @returns {Boolean} True if set. False if not
 */
PlugAPI.prototype.setCommandPrefix = function(prefix) {
    if (!prefix || typeof prefix !== 'string' || prefix.length < 1) {
        return false;
    }
    commandPrefix = prefix;
    return true;
};

/**
 * Get the Logger settings
 * @returns {{fileOutput: boolean, filePath: string, consoleOutput: boolean}} An object of the settings be used for the logger.
 */
PlugAPI.prototype.getLoggerSettings = function() {
    return logger.settings;
};

/**
 * Set the Logger object, must contain a info, warn, warning and error function
 * @param {Logger|Object} newLogger sets the logger options
 * @returns {Boolean} True if set. False if not.
 */
PlugAPI.prototype.setLogger = function(newLogger) {
    const requiredMethods = ['info', 'warn', 'warning', 'error'];

    if (newLogger && typeof newLogger === 'object' && !Array.isArray(newLogger)) {
        for (const i of requiredMethods) {
            if (typeof newLogger[i] !== 'function') {
                return false;
            }
        }
        logger = newLogger;
        return true;
    }
    return false;
};

/**
 * Woot current song
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.woot = function(callback) {
    if (this.getMedia() == null) return false;
    queueREST('POST', 'votes', {
        direction: 1,
        historyID: room.getHistoryID()
    }, callback);
    return true;
};

/**
 * Meh current song
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.meh = function(callback) {
    if (this.getMedia() == null) return false;
    queueREST('POST', 'votes', {
        direction: -1,
        historyID: room.getHistoryID()
    }, callback);
    return true;
};

/**
 * Grab current song
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.grab = function(callback) {
    if (!initialized || this.getMedia() == null) {
        if (typeof callback === 'function') {
            return callback(new Error('No media playing'), null);
        }
        return;
    }

    that.getActivePlaylist((playlist) => {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }
            return;
        }

        const callbackWrapper = function(err, data) {
            if (!err) {
                playlist.count++;
            }
            if (typeof callback === 'function') {
                return callback(err, data);
            }
        };

        queueREST('POST', 'grabs', {
            playlistID: playlist.id,
            historyID: room.getHistoryID()
        }, callbackWrapper);
    });
};

/**
 * Activate a playlist
 * @param {Number} pid Playlist ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.activatePlaylist = function(pid, callback) {
    if (!room.getRoomMeta().slug) {
        if (typeof callback === 'function') {
            return callback(new Error('Not in a room'), null);
        }
        return;
    }

    if (!pid) {
        if (typeof callback === 'function') {
            return callback(new Error('Missing playlist ID'), null);
        }
        return;
    }

    this.getPlaylist(pid, (playlist) => {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }
        }

        const callbackWrapper = function(err, data) {
            if (!err) {
                that.getActivePlaylist((playlistData) => {
                    if (playlistData != null) {
                        playlistData.active = false;
                    }
                });
                playlist.active = true;
            }
            if (typeof callback === 'function') {
                return callback(err, data);
            }
        };

        queueREST('PUT', `${endpoints.PLAYLIST}/${pid}/activate`, undefined, callbackWrapper);
    });
};

/**
 * Add a song to a playlist
 * @param {Number} pid Playlist ID
 * @param {Number} sid Song ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.addSongToPlaylist = function(pid, sid, callback) {
    if (!room.getRoomMeta().slug) {
        if (typeof callback === 'function') {
            return callback(new Error('Not in a room'), null);
        }
        return;
    }

    if (!pid) {
        if (typeof callback === 'function') {
            return callback(new Error('Missing playlist ID'), null);
        }
        return;
    }

    if (!sid) {
        if (typeof callback === 'function') {
            return callback(new Error('Missing song ID'), null);
        }
        return;
    }

    that.getPlaylist(pid, (playlist) => {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }
            return;
        }

        const callbackWrapper = function(err, data) {
            if (!err) {
                playlist.count++;
            }
            if (typeof callback === 'function') {
                return callback(err, data);
            }
        };

        queueREST('GET', `${endpoints.PLAYLIST}/${pid}/media/insert`, {
            media: sid,
            append: true
        }, callbackWrapper);
    });
};

/**
 * Create a new playlist
 * @param {String} name Name of new playlist
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.createPlaylist = function(name, callback) {
    if (!room.getRoomMeta().slug || typeof name !== 'string' || name.length === 0) return false;

    const callbackWrapper = function(err, data) {
        if (!err) {
            playlists.push(data[0]);
        }
        if (typeof callback === 'function') {
            return callback(err, data);
        }
    };

    queueREST('POST', endpoints.PLAYLIST, {
        name
    }, callbackWrapper);
    return true;
};

/**
 * Delete a playlist
 * @param {Number} pid Playlist ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.deletePlaylist = function(pid, callback) {
    if (!room.getRoomMeta().slug) {
        if (typeof callback === 'function') {
            return callback(new Error('Not in a room'), null);
        }
    }

    if (!pid) {
        if (typeof callback === 'function') {
            return callback(new Error('Missing playlist ID'), null);
        }
    }

    this.getPlaylist(pid, (playlist) => {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }
        }

        const callbackWrapper = function(err, data) { // eslint-disable-line newline-after-var
            if (!err) {
                const playlistsData = playlists.get();

                for (const i of playlistsData) {
                    if (i.id === pid) {
                        playlists.removeAt(i);
                        break;
                    }
                }
            }
            if (typeof callback === 'function') {
                return callback(err, data);
            }
        };

        queueREST('DELETE', `${endpoints.PLAYLIST}/${pid}`, undefined, callbackWrapper);
    });
};

/**
 * Get active playlist
 * @param {Function} callback Callback function
 */
PlugAPI.prototype.getActivePlaylist = function(callback) {
    this.getPlaylists((playlistsData) => {
        for (const i of playlistsData) {
            if (i.active) {
                if (typeof callback === 'function') {
                    callback(i);
                    return;
                }
                return;
            }
        }

        if (typeof callback === 'function') {
            callback(null);
            return;
        }
    });
};

/**
 * Get playlist by ID
 * @param {Number} pid Playlist ID
 * @param {Function} callback Callback function
 */
PlugAPI.prototype.getPlaylist = function(pid, callback) {
    this.getPlaylists((playlistsData) => {
        for (const i of playlistsData) {
            if (i.id === pid) {
                if (typeof callback === 'function') {
                    callback(i);
                    return;
                }
                return;
            }

            if (typeof callback === 'function') {
                return callback(null);
            }
        }
    });
};

/**
 * Get playlists
 * @param {Function} callback Callback function
 * @returns {Object} An object array of all playlists the user has
 */
PlugAPI.prototype.getPlaylists = function(callback) {
    return playlists.get(callback);
};

/**
 * Get all medias in playlist
 * @param {Number} pid Playlist ID
 * @param {RESTCallback} callback Callback function
 */
PlugAPI.prototype.getPlaylistMedias = function(pid, callback) {
    this.getPlaylist(pid, (playlist) => {
        if (playlist == null) {
            return;
        }

        queueREST('GET', `${endpoints.PLAYLIST}/${pid}/media`, undefined, callback);
    });
};

/**
 * Move a media in a playlist
 * @param {Number} pid Playlist ID
 * @param {Number|Number[]} mid Media ID(s)
 * @param {Number} beforeMid Move them before this media ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.playlistMoveMedia = function(pid, mid, beforeMid, callback) {
    if (!room.getRoomMeta().slug || !pid || !mid || (!Array.isArray(mid) || (Array.isArray(mid) && mid.length > 0)) || !beforeMid) return false;

    this.getPlaylist(pid, (playlist) => {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }
            return;
        }

        if (!Array.isArray(mid)) {
            mid = [mid];
        }

        queueREST('PUT', `${endpoints.PLAYLIST}/${pid}/media/move`, {
            ids: mid,
            beforeID: beforeMid
        }, callback);
    });
};

/**
 * Shuffle playlist
 * @param {Number} pid Playlist ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.shufflePlaylist = function(pid, callback) {
    if (!room.getRoomMeta().slug || !pid) return false;

    this.getPlaylist(pid, (playlist) => {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }
            return;
        }

        queueREST('PUT', `${endpoints.PLAYLIST}/'${pid}/shuffle`, undefined, callback);
        return true;
    });
};

/**
 * Add a DJ to Waitlist/Booth
 * @param {Number} uid User ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateAddDJ = function(uid, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || room.isDJ(uid) || room.isInWaitList(uid) || (room.getBoothMeta().isLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER))) {
        return false;
    }

    queueREST('POST', endpoints.MODERATE_ADD_DJ, {
        id: uid
    }, callback);
    return true;
};

/**
 * Ban a user from the community
 * @param {Number} userID User ID
 * @param {Number} reason Reason ID
 * @param {String} duration Duration of the ban
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateBanUser = function(userID, reason, duration, callback) {
    if (!room.getRoomMeta().slug) return false;

    if (duration != null) {
        if (!objectContainsValue(PlugAPI.BAN, duration)) return false;
    } else {
        duration = PlugAPI.BAN.LONG;
    }

    if (reason != null) {
        if (!objectContainsValue(PlugAPI.BAN_REASON, reason)) return false;
    } else {
        reason = PlugAPI.BAN_REASON.SPAMMING_TROLLING;
    }

    const user = this.getUser(userID);

    if (user !== null ? room.getPermissions(user).canModBan : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) {
        if (duration === PlugAPI.BAN.PERMA && this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
            duration = PlugAPI.BAN.DAY;
        }

        queueREST('POST', endpoints.MODERATE_BAN, {
            userID,
            reason,
            duration
        }, callback);

        return true;
    }
    return false;
};

/**
 * Delete a chat message
 * @param {String} cid Chat ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateDeleteChat = function(cid, callback) {
    if (!room.getRoomMeta().slug || typeof cid !== 'string') {
        return false;
    }
    const user = this.getUser(cid.split('-')[0]);

    if ((deleteAllChat && this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) || (user !== null ? room.getPermissions(user).canModChat : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER))) {
        queueREST('DELETE', endpoints.CHAT_DELETE + cid, undefined, callback, true);
        return true;
    }
    return false;
};

/**
 * Skip current media
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateForceSkip = function(callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || room.getDJ() === null) {
        return false;
    }
    if (!room.isDJ()) {
        queueREST('POST', endpoints.MODERATE_SKIP, {
            userID: room.getDJ().id,
            historyID: room.getHistoryID()
        }, callback);
    } else {
        queueREST('POST', endpoints.SKIP_ME, undefined, callback);
    }

    return true;
};

PlugAPI.prototype.selfSkip = function(callback) {
    if (!room.getRoomMeta().slug || room.getDJ() === null || !room.isDJ()) {
        return false;
    }

    queueREST('POST', endpoints.SKIP_ME, undefined, callback);
    return true;
};

/**
 * Lock/Clear the waitlist/booth
 * Alias for {@link PlugAPI.prototype.moderateLockBooth}
 * @param {Boolean} locked Lock the waitlist/booth
 * @param {Boolean} clear Clear the waitlist
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateLockWaitList = function(locked, clear, callback) {
    return this.moderateLockBooth(locked, clear, callback);
};

/**
 * Lock/Clear the waitlist/booth
 * @param {Boolean} locked Lock the waitlist/booth
 * @param {Boolean} clear Clear the waitlist
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateLockBooth = function(locked, clear, callback) {
    if (!room.getRoomMeta().slug || this.getUser() === null || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || (locked === room.getBoothMeta().isLocked && !clear)) {
        return false;
    }

    queueREST('PUT', endpoints.ROOM_LOCK_BOOTH, {
        isLocked: locked,
        removeAllDJs: clear
    }, callback);
    return true;
};

/**
 * Move a DJ in the waitlist
 * @param {Number} uid User ID
 * @param {Number} index New position in the waitlist
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateMoveDJ = function(uid, index, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || !room.isInWaitList(uid) || !isFinite(index)) {
        return false;
    }

    queueREST('POST', endpoints.MODERATE_MOVE_DJ, {
        userID: uid,
        position: index > 50 ? 49 : index < 1 ? 1 : --index
    }, callback);
    return true;
};

/**
 * Mute user
 * @param {Number} uid User ID
 * @param {Number} [reason] Reason ID
 * @param {String} [duration] Duration ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateMuteUser = function(uid, reason, duration, callback) {
    if (!room.getRoomMeta().slug) return false;

    if (duration != null) {
        if (!objectContainsValue(PlugAPI.MUTE, duration)) return false;
    } else {
        duration = PlugAPI.MUTE.LONG;
    }

    if (reason != null) {
        if (!objectContainsValue(PlugAPI.MUTE_REASON, reason)) return false;
    } else {
        reason = PlugAPI.MUTE_REASON.VIOLATING_COMMUNITY_RULES;
    }

    const user = this.getUser(uid);

    if (user !== null ? room.getPermissions(user).canModMute : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) {
        queueREST('POST', endpoints.MODERATE_MUTE, {
            userID: uid,
            reason,
            duration
        }, callback);
    }
    return true;
};

/**
 * Remove a DJ from Waitlist/Booth
 * @param {Number} uid User ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateRemoveDJ = function(uid, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || (!room.isDJ(uid) && !room.isInWaitList(uid)) || (room.getBoothMeta().isLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER))) {
        return false;
    }

    queueREST('DELETE', endpoints.MODERATE_REMOVE_DJ + uid, undefined, callback);
    return true;
};

/**
 * Set the role of a user
 * @param {Number} userID User ID
 * @param {Number} role The new role
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateSetRole = function(userID, role, callback) {
    const roleID = parseInt(role, 10);

    if (!room.getRoomMeta().slug || !isFinite(roleID) || roleID < 0 || roleID > 5) {
        return false;
    }

    const user = this.getUser(userID);

    if (user !== null ? room.getPermissions(user).canModStaff : this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
        if (roleID === 0) {
            queueREST('DELETE', endpoints.MODERATE_STAFF + userID, undefined, callback);
        } else {
            queueREST('POST', endpoints.MODERATE_PERMISSIONS, {
                userID,
                roleID
            }, callback);
        }
    }
    return true;
};

/**
 * Unban a user
 * @param {Number} uid User ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateUnbanUser = function(uid, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
        return false;
    }

    queueREST('DELETE', endpoints.MODERATE_UNBAN + uid, undefined, callback);
    return true;
};

/**
 * Unmute a user
 * @param {Number} uid User ID
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateUnmuteUser = function(uid, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
        return false;
    }

    queueREST('DELETE', endpoints.MODERATE_UNMUTE + uid, undefined, callback);
    return true;
};

/**
 * Change the name of the community
 * @param {String} name New community name
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.changeRoomName = function(name, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.COHOST) || room.getRoomMeta().name === name) {
        return false;
    }

    queueREST('POST', endpoints.ROOM_INFO, {
        name,
        description: undefined,
        welcome: undefined
    }, callback);
    return true;
};

/**
 * Change the description of the community
 * @param {String} description New community description
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.changeRoomDescription = function(description, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.COHOST) || room.getRoomMeta().description === description) {
        return false;
    }

    queueREST('POST', endpoints.ROOM_INFO, {
        name: undefined,
        description,
        welcome: undefined
    }, callback);
    return true;
};

/**
 * Change the welcome message of the community
 * @param {String} welcome New community welcome
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.changeRoomWelcome = function(welcome, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.COHOST) || room.getRoomMeta().welcome === welcome) {
        return false;
    }

    queueREST('POST', endpoints.ROOM_INFO, {
        name: undefined,
        description: undefined,
        welcome
    }, callback);
    return true;
};

/**
 * Change the DJ cycle of the community
 * @param {Boolean} enabled True if DJ Cycle should be enabled, false if not.
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.changeDJCycle = function(enabled, callback) {
    if (!room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || room.getBoothMeta().shouldCycle === enabled) {
        return false;
    }

    queueREST('PUT', endpoints.ROOM_CYCLE_BOOTH, {
        shouldCycle: enabled
    }, callback);
    return true;
};

module.exports = PlugAPI;
