'use strict';

// Node.JS Core Modules
const http = require('http');
const util = require('util');

// Third-party modules
const EventEmitter3 = require('eventemitter3');
const handleErrors = require('handle-errors')('PlugAPI', true);
const WebSocket = require('ws');
const chalk = require('chalk');
const utils = require('./utils');

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
 * Jethro Logger
 * @type {Logger|exports}
 * @private
 */
let logger = require('./logger');

/**
 * Event Object Types
 * @type {exports}
 * @private
 */
const EventObjectTypes = require('./eventObjectTypes');

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
const oldRequest = require('request');
const jar = oldRequest.jar();
const request = oldRequest.defaults({
    baseUrl: 'https://plug.dj',
    forever: true,
    gzip: true,
    headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/json',
        'User-Agent': `plugAPI_${PlugAPIInfo.version}`
    },
    jar
});

/**
 * REST Endpoints
 * @type {{CHAT_DELETE: String, HISTORY: String, MODERATE_ADD_DJ: String, MODERATE_BAN: String, MODERATE_BOOTH: String, MODERATE_MOVE_DJ: String, MODERATE_MUTE: String, MODERATE_PERMISSIONS: String, MODERATE_REMOVE_DJ: String, MODERATE_SKIP: String, MODERATE_UNBAN: String, MODERATE_UNMUTE: String, PLAYLIST: String, ROOM_CYCLE_BOOTH: String, ROOM_INFO: String, ROOM_LOCK_BOOTH: String, USER_SET_AVATAR: String, USER_GET_AVATARS: String}}
 * @private
 */
const endpoints = require('./endpoints.json');

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
const playlists = new BufferObject(null, function(callback) {
    queueREST('GET', endpoints.PLAYLIST, undefined, callback);
}, 6e5);

/* eslint-enable valid-jsdoc */

/**
* Reconnect
* @type {Function}
* @param {*} roomSlug The room's slug
* @private
*/
function reconnect(roomSlug) {
    const slug = room.getRoomMeta().slug ? room.getRoomMeta().slug : roomSlug;

    that.close();
    logger.info('Socket Server', 'Reconnecting');
    setImmediate(function() {
        that.connect(slug);
    });
}

/**
 * Function to increment or decrement the playlist length count.
 * @type {Function}
 * @param {Array} playlist the playlist to modify
 * @param {Boolean} increment Whether to increment or decrement the playlist count.
 * @returns {Array} The playlist is returned with the modified count
 * @private
*/
function editPlaylistLength(playlist, increment) {
    if (typeof increment === 'undefined' || increment === true) {
        playlist.count++;
    } else {
        playlist.count--;
    }

    return playlist;
}

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
            if (timeout !== undefined && isFinite(~~timeout) && ~~timeout > 0) {
                const specificChatDeleter = function(data) {
                    if (data.raw.uid === room.getSelf().id && data.message.trim() === msg.trim()) {
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
 * Check if an object contains a value
 * @param {Object} obj The object
 * @param {*} value The value
 * @param {Boolean} [strict] Whether to use strict mode check or not
 * @returns {Boolean} if object contains value
 */
function objectContainsValue(obj, value, strict) {
    for (const i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if ((!strict && obj[i] == value) || (strict && obj[i] === value)) return true; // eslint-disable-line eqeqeq
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
 * Copyright (C) 2014 - 2016 by Plug DJ, Inc.
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

        return ((t.getFullYear() - e.getFullYear()) * 12) + (t.getMonth() - e.getMonth());
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
    callback = typeof callback === 'function' ? __bind(callback, that) : function() {};

    const opts = {
        method,
        url: `/_/${endpoint}`
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

function safeParseJSON(data, callback) {
    try {
        return JSON.parse(data);
    } catch (e) {
        logger.error('REST Error', e.stack);

        return callback(e.stack, null);
    }
}

/**
 * Send a REST request
 * @param {Object} opts An object of options to send in to the request module.
 * @param {RESTCallback} callback Callback function
 * @private
 */
function sendREST(opts, callback) {
    request(opts, function(err, res, body) {
        if (err || (res && res.statusCode !== 200) || !res) {
            logger.error('REST Error', (err ? err : ''), (res && res.statusCode ? `HTTP Status: ${res.statusCode} - ${http.STATUS_CODES[res.statusCode]}` : ''));

            return callback(`${err ? err : ' '} ${res && res.statusCode ? `HTTP Status: ${res.statusCode} - ${http.STATUS_CODES[res.statusCode]}` : ''}`, null);
        }
        body = safeParseJSON(body, callback);

        if (body && body.status === 'ok') {
            return callback(null, body.data);
        }

        return callback(body && body.status ? body.status : new Error("Can't connect to plug.dj"), null);
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
    }, function(err) {
        if (err) {
            if (isFinite(err)) {
                if (err >= 400 && err < 500) {
                    handleErrors.error(`Invalid Room URL. Please Check If the RoomSlug ${roomSlug} is correct`, callback);
                } else {
                    handleErrors.error('Internal Server Error from Plug.dj', callback);
                }
            } else {
                logger.error('PlugAPI', 'Error while joining:', err ? err : 'Unknown error');
                setTimeout(function() {
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
    queueREST('GET', 'rooms/state', undefined, function(err, data) {
        if (err) {
            if (isFinite(err) && err >= 500) {
                handleErrors.error('Internal Server Error from Plug.dj', callback);
            } else {
                logger.error('PlugAPI', 'Error getting room state:', err ? err : 'Unknown error');
                setTimeout(function() {
                    getRoomState(callback);
                }, 1e3);

                return;
            }
        }
        connectingRoomSlug = null;
        initRoom(data[0], function() {
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
 * @constructor
 */
function PlugAPI(authenticationData, callback) {
    EventEmitter3.call(this);

    if (typeof authenticationData !== 'object' || authenticationData === null) {
        this.guest = true;

        // handleErrors.error('You must pass the authentication data into the PlugAPI object to connect correctly', callback);
    } else if (!authenticationData.hasOwnProperty('email') && !authenticationData.hasOwnProperty('email') && authenticationData.hasOwnProperty('guest')) {
        this.guest = true;
    } else {
        if (typeof authenticationData.email !== 'string') {
            handleErrors.error('Missing Login Email', callback);
        }
        if (typeof authenticationData.password !== 'string') {
            handleErrors.error('Missing Login Password', callback);
        }
    }

    that = this;

    let cookieHash = '';

    if (!this.guest) {
        (function(crypto) {
            const hashPriority = ['md5', 'sha1', 'sha128', 'sha256', 'sha512'];
            let foundHash = '';

            (function(hashes) {
                for (const i in hashes) {
                    if (!hashes.hasOwnProperty(i)) continue;
                    const hash = hashes[i];

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
    }
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
     * Should the bot delete incoming commands?
     * @type {Boolean}
     */
    this.deleteCommands = true;

    /**
    * Should user be able to delete all chat?
    * @type {Boolean}
    */
    this.deleteAllChat = false;

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

    logger.info('PlugAPI', `Running plugAPI v${PlugAPIInfo.version}`);
}

PlugAPI.prototype = Object.create(EventEmitter3.prototype, {
    constructor: {
        value: PlugAPI
    }
});

/**
 * Handling incoming messages.
 * Emitting the correct events depending on commands, mentions, etc.
 * @param {Object} messageData plug.DJ message event data
 * @private
 */
function receivedChatMessage(messageData) {
    let i;

    if (!initialized) return;

    const disconnectedUser = messageData.from == null;
    const mutedUser = !disconnectedUser && room.isMuted(messageData.from.id);
    const prefixChatEventType = (mutedUser && !that.mutedTriggerNormalEvents ? 'muted:' : '');

    if (!disconnectedUser && messageData.message.indexOf(commandPrefix) === 0 && (that.processOwnMessages || messageData.from.id !== room.getSelf().id)) {
        const cmd = messageData.message.substr(commandPrefix.length).split(' ')[0];

        messageData.command = cmd;
        messageData.args = messageData.message.substr(commandPrefix.length + cmd.length + 1);

        // Mentions => Mention placeholder
        let lastIndex = -1;
        const allUsers = room.getUsers();
        const random = Math.ceil(Math.random() * 1E10);

        for (i = 0; i < allUsers.length; i++) {
            lastIndex = messageData.args.toLowerCase().indexOf(allUsers[i].username.toLowerCase());

            if (lastIndex > -1) {
                messageData.args = `${messageData.args.substr(0, lastIndex).replace('@', '')}%MENTION-${random}-${messageData.mentions.length}%${messageData.args.substr(lastIndex + allUsers[i].username.length + 1)}`;
                messageData.mentions.push(allUsers[i]);

            }
        }

        // Arguments
        if (messageData.args === '') {
            messageData.args = [];
        } else {
            messageData.args = messageData.args.split(' ');

            for (i = 0; i < messageData.args.length; i++) {
                if (isFinite(Number(messageData.args[i]))) {
                    messageData.args[i] = Number(messageData.args[i]);
                }
            }
        }

        // Mention placeholder => User object
        for (i in messageData.mentions) {
            if (messageData.mentions.hasOwnProperty(i)) {
                messageData.args[messageData.args.indexOf(`%MENTION-${random}-${i}%`)] = messageData.mentions[i];
            }
        }

        // Pre command handler
        if (typeof that.preCommandHandler === 'function' && that.preCommandHandler(messageData) === false) return;

        // Functions
        messageData.respond = function() {
            const message = Array.prototype.slice.call(arguments).join(' ');

            return that.sendChat(`@${this.from.username} ${message}`);
        };
        messageData.respondTimeout = function() {
            const args = Array.prototype.slice.call(arguments);
            const timeout = parseInt(args.splice(args.length - 1, 1), 10);
            const message = args.join(' ');

            return that.sendChat(`@${this.from.username} ${message}`, timeout);
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
            if (typeof ids === 'string' || typeof ids === 'number') {
                ids = [ids];
            }
            if (ids == null || !Array.isArray(ids)) {
                if (typeof failure === 'function') {
                    failure();
                }

                return false;
            }
            const isFrom = ids.indexOf(this.from.id) > -1;

            if (isFrom && typeof success === 'function') {
                success();
            } else if (!isFrom && typeof failure === 'function') {
                failure();
            }

            return isFrom;
        };
        if (!mutedUser) {
            that.emit(prefixChatEventType + PlugAPI.events.CHAT_COMMAND, messageData);
            that.emit(`${prefixChatEventType}${PlugAPI.events.CHAT_COMMAND}:${cmd}`, messageData);
            if (that.deleteCommands) {
                that.moderateDeleteChat(messageData.raw.cid);
            }
        }
    } else if (messageData.type === 'emote') {
        that.emit(`${prefixChatEventType}${PlugAPI.events.CHAT}:emote`, messageData);
    }

    that.emit(prefixChatEventType + PlugAPI.events.CHAT, messageData);
    that.emit(`${prefixChatEventType}${PlugAPI.events.CHAT}:${messageData.raw.type}`, messageData);
    if (room.getUser() !== null && messageData.message.indexOf(`@${room.getUser().username}`) > -1) {
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
 * @param {string} roomSlug room for guests to get auth code from
 * @param {Function} callback Callback function
 * @private
 */
function getAuthCode(roomSlug, callback) {
    const url = roomSlug !== null ? roomSlug : '/';

    request(url, function(err, res, body) {
        if (err) {
            logger.error('PlugAPI', 'Error getting auth code:', err);
        } else if (res && res.statusCode === 200) {
            _authCode = body.split('_jm')[1].split('"')[1];
            const _st = body.split('_st')[1].split('"')[1];

            DateUtilities.setServerTime(_st);

            return callback();
        } else {
            logger.error('PlugAPI', res ? `Error getting auth code: HTTP ${res.statusCode} - ${http.STATUS_CODES[res.statusCode]}` : 'Unknown Error');
            const slug = room.getRoomMeta().slug;

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
        if (that.guest) {
            getAuthCode(roomSlug, function() {
                connectSocket(roomSlug);
            });
        } else {
            getAuthCode(null, function() {
                connectSocket(roomSlug);
            });
        }

        return;
    }

    ws = new WebSocket('wss://godj.plug.dj:443/socket', {
        origin: 'https://plug.dj'
    });
    ws.on('open', function() {
        logger.success('plug.dj Socket Server', chalk.green('Connected'));
        sendEvent('auth', _authCode);

        that.emit('connected');
        that.emit('server:socket:connected');
    });
    ws.on('message', function(data) {
        if (data !== 'h') {
            const payload = JSON.parse(data || '[]');

            for (let i = 0; i < payload.length; i++) {
                ws.emit('data', payload[i]);
            }
        }
    });
    ws.on('data', messageHandler);
    ws.on('data', function(data) {
        return that.emit('tcpMessage', data);
    });
    ws.on('error', function(a) {
        logger.error('plug.dj Socket Server', a);
        process.nextTick(function() {
            reconnect(roomSlug);
        });
    });
    ws.on('close', function(a) {
        logger.warn('plug.dj Socket Server', `Closed with Code ${a}`);
        process.nextTick(function() {
            reconnect(roomSlug);
        });
    });
}

/**
 * Sends in a websocket event to plug's servers
 * @param  {String} type The Event type to send in
 * @param  {String} data The data to send in.
 * @private
 */
function sendEvent(type, data) {
    ws.send(JSON.stringify({
        a: type,
        p: data,
        t: DateUtilities.getServerEpoch()
    }));
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
     * Will lookup in EventObjectTypes for possible converter function
     * @type {*}
     */
    let data = EventObjectTypes[msg.a] != null ? EventObjectTypes[msg.a](msg.p, room) : msg.p;

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
            queueREST('GET', endpoints.USER_INFO, null, function(err, userData) {
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
            queueREST('GET', endpoints.HISTORY, undefined, __bind(room.setHistory, room));

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
            for (i in chatHistory) {
                if (!chatHistory.hasOwnProperty(i)) continue;
                if (chatHistory[i].id === data.c) chatHistory.splice(i, 1);
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

            if (userData == null || data === 0) {
                userData = {
                    id: data,
                    guest: data === 0
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
            setTimeout(function() {
                floodProtectionDelay -= 500;
            }, floodProtectionDelay * 5);
            logger.warning('PlugAPI', 'Flood protection: Slowing down the sending of chat messages temporary');
            break;
        case PlugAPI.events.MAINT_MODE_ALERT:
            logger.warning('plugAPI', `plug.dj is going into maintenance in ${data} minutes`);
            break;
        case PlugAPI.events.MODERATE_STAFF:

            for (i in data.u) {

                if (!data.u.hasOwnProperty(i)) continue;

                room.updateUser({
                    i: data.u[i].i,
                    role: data.u[i].p
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
                logger.info('plug.dj', `Congratulations, you have leveled up to level ${data.value}`);
            } else {
                logger.info('plug.dj', `Notification: ${util.inspect(data)}`);
            }
            break;
        case PlugAPI.events.CHAT_LEVEL_UPDATE:
            room.setMinChatLevel(data.level);
            logger.info('plug.dj', `Chat Level has changed to level: ${data.level} by ${data.user.username}`);
            break;
        default:
        case undefined:
            logger.warning('PlugAPI', `Unknown Message Format (unimplemented in plugAPI): ${JSON.stringify(msg, null, 4)}`);
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

    if (that.guest) {
        request.get({
            uri: '/plugcubed'
        }, function(error, response, data) {
            if (!error) {
                _cookies.fromHeaders(response.headers);
                loggingIn = false;
                if (typeof callback === 'function') {
                    return callback(error, that);
                }
            } else if (typeof callback === 'function') {
                return callback(error, null);
            }
        });
    } else {
        request.get({
            uri: '/'
        }, function(err, res, body) {
            let csrfToken;

            if ((res && res.statusCode !== 200) || err) {
                handleErrors.error(`Login Error: ${res && res.statusCode !== 200 ? ` HTTP Status: ${res.statusCode} - ${http.STATUS_CODES[res.statusCode]}` : ''} ${err ? err : ''}`, callback);
            }
            try {
                _cookies.fromHeaders(res.headers);
                csrfToken = body.split('_csrf')[1].split('"')[1];
            } catch (e) {
                handleErrors.error(`Login Error: Can't Obtain CSRF Token. ${e.message}`, callback);
            }
            request({
                method: 'POST',
                uri: '/_/auth/login',
                json: {
                    csrf: csrfToken,
                    email: authenticationInfo.email,
                    password: authenticationInfo.password
                }
            }, function(error, response, data) {
                if (!error) {
                    if ((data && data.status !== 'ok') || (response && response.statusCode !== 200) || error) {
                        handleErrors.error(`Login Error: ${data && data.status !== 'ok' ? `API Status: ${data.status}` : ''} ${response && response.statusCode !== 200 ? `HTTP Status: ${response.statusCode} - ${http.STATUS_CODES[response.statusCode]}` : ''} ${error ? error : ''}`, callback);
                    } else {
                        _cookies.fromHeaders(response.headers);
                        loggingIn = false;
                        if (typeof callback === 'function') {
                            return callback(err, that);
                        }
                    }
                } else if (typeof callback === 'function') {
                    return callback(err, null);
                }
            });
        });
    }

    if (typeof callback !== 'function') {
        const deasync = require('deasync');

        // Wait until the session is set
        while (loggingIn) { // eslint-disable-line no-unmodified-loop-condition
            deasync.sleep(100);
        }
    }
}
PlugAPI.logger = logger;
PlugAPI.CreateLogger = util.deprecate(() => {}, 'PlugAPI.CreateLogger is now a noop function and will be removed in V6. Use PlugAPI.logger instead and refer to https://github.com/JethroLogger/Jethro/tree/v2/docs/v2/ for documentation.');
PlugAPI.Utils = utils;

/**
 * Room ranks
 * @type {{NONE: number, RESIDENTDJ: number, BOUNCER: number, MANAGER: number, COHOST: number, HOST: number}}
 * @const
 */
PlugAPI.ROOM_ROLE = PlugAPI.prototype.ROOM_ROLE = {
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
PlugAPI.GLOBAL_ROLES = PlugAPI.prototype.GLOBAL_ROLES = {
    NONE: 0,
    VOLUNTEER: 2,
    AMBASSADOR: 3,
    LEADER: 4,
    ADMIN: 5
};

/**
 * Statuses
 * @type {{OFFLINE: number, ONLINE: number}}
 * @const
 */
PlugAPI.STATUS = PlugAPI.prototype.STATUS = {
    OFFLINE: 0,
    ONLINE: 1
};

/**
 * Ban Lengths
 * @type {{HOUR: string, DAY: string, PERMA: string}}
 * @const
 */
PlugAPI.BAN = PlugAPI.prototype.BAN = {
    HOUR: 'h',
    DAY: 'd',
    PERMA: 'f'
};

/**
 * Ban Reasons
 * @type {{SPAMMING_TROLLING: number, VERBAL_ABUSE: number, OFFENSIVE_MEDIA: number, INAPPROPRIATE_GENRE: number, NEGATIVE_ATTITUDE: number}}
 * @const
 */
PlugAPI.BAN_REASON = PlugAPI.prototype.BAN_REASON = {
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
 * @const
 */
PlugAPI.MUTE = PlugAPI.prototype.MUTE = {
    SHORT: 's',
    MEDIUM: 'm',
    LONG: 'l'
};

/**
 * Mute Reasons
 * @type {{VIOLATING_COMMUNITY_RULES: number, VERBAL_ABUSE: number, SPAMMING_TROLLING: number, OFFENSIVE_LANGUAGE: number, NEGATIVE_ATTITUDE: number}}
 * @const
 */
PlugAPI.MUTE_REASON = PlugAPI.prototype.MUTE_REASON = {
    VIOLATING_COMMUNITY_RULES: 1,
    VERBAL_ABUSE: 2,
    SPAMMING_TROLLING: 3,
    OFFENSIVE_LANGUAGE: 4,
    NEGATIVE_ATTITUDE: 5
};

/**
 * Event Types
 * @const {{ADVANCE: string, BAN: string, BOOTH_LOCKED: string, CHAT: string, CHAT_COMMAND: string, CHAT_DELETE: string, CHAT_EMOTE: string, CHAT_LEVEL_UPDATE: string, COMMAND: string, DJ_LIST_CYCLE: string, DJ_LIST_UPDATE: string, EARN: string, EMOTE: string, FOLLOW_JOIN: string, FLOOD_CHAT: string, GRAB: string, KILL_SESSION: string, MODERATE_ADD_DJ: string, MODERATE_ADD_WAITLIST: string, MODERATE_AMBASSADOR: string, MODERATE_BAN: string, MODERATE_MOVE_DJ: string, MODERATE_MUTE: string, MODERATE_REMOVE_DJ: string, MODERATE_REMOVE_WAITLIST: string, MODERATE_SKIP: string, MODERATE_STAFF: string, NOTIFY: string, PDJ_MESSAGE: string, PDJ_UPDATE: string, PING: string, PLAYLIST_CYCLE: string, REQUEST_DURATION: string, REQUEST_DURATION_RETRY: string, ROOM_CHANGE: string, ROOM_DESCRIPTION_UPDATE: string, ROOM_JOIN: string, ROOM_NAME_UPDATE: string, ROOM_VOTE_SKIP: string, ROOM_WELCOME_UPDATE: string, SESSION_CLOSE: string, SKIP: string, STROBE_TOGGLE: string, USER_COUNTER_UPDATE: string, USER_FOLLOW: string, USER_JOIN: string, USER_LEAVE: string, USER_UPDATE: string, VOTE: string}}
 */
PlugAPI.events = PlugAPI.prototype.events = require('./events.json');

/**
 * Connect to a room
 * @param {String} roomSlug Slug of room (The part after https://plug.dj/)
 */
PlugAPI.prototype.connect = function(roomSlug) {
    if (!roomSlug || typeof roomSlug !== 'string' || roomSlug.length === 0 || roomSlug.indexOf('/') > -1) {
        throw new Error('Invalid room name');
    }

    if (connectingRoomSlug != null) {
        logger.error('PlugAPI', 'Already connecting to a room');

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
 * @returns {Array|Function} Either returns an array of objects of songs in history, or a callback with that array of objects.
 */
PlugAPI.prototype.getHistory = function(callback) {
    if (initialized) {
        const history = room.getHistory();

        if (history.length > 1) {
            if (typeof callback === 'function') {
                return callback(history);
            }

            return history;
        }
    } else {
        setImmediate(function() {
            that.getHistory(callback);
        });
    }
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

        for (let i = 0; i < lines.length; i++) {
            msg = lines[i];
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
        logger.error('PlugAPI', 'Missing callback for getAllStaff');

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
    const requiredMethods = ['info', 'warn', 'warning', 'error', 'success'];

    if (newLogger && typeof newLogger === 'object' && !Array.isArray(newLogger)) {
        for (const i in requiredMethods) {
            if (!requiredMethods.hasOwnProperty(i)) continue;
            if (typeof newLogger[requiredMethods[i]] !== 'function') {
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

    that.getActivePlaylist(function(currentPlaylist) {
        if (currentPlaylist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }

            return;
        }

        const callbackWrapper = function(requestError, data) {
            if (!requestError) {
                currentPlaylist = editPlaylistLength(currentPlaylist, true);
            }
            if (typeof callback === 'function') {
                return callback(requestError, data);
            }
        };

        queueREST('POST', 'grabs', {
            playlistID: currentPlaylist.id,
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

    this.getPlaylist(pid, function(playlist) {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }
        }

        const callbackWrapper = function(err, data) {
            if (!err) {
                that.getActivePlaylist(function(activePlaylist) {
                    if (activePlaylist != null) {
                        activePlaylist.active = false;
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
 * @param {Object|Object[]} sdata Songs data
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.addSongToPlaylist = function(pid, sdata, callback) {
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

    if (!sdata || (Array.isArray(sdata) && sdata.length === 0)) {
        if (typeof callback === 'function') {
            return callback(new Error('Missing song data'), null);
        }

        return;
    }

    if (!Array.isArray(sdata)) {
        sdata = [sdata];
    }

    for (const i in sdata) {
        if (!sdata.hasOwnProperty(i)) continue;
        if (sdata[i].id == null) {

            // On plug.dj, this ID is always 0, so it is not important apparently
            sdata[i].id = 0;
        }
        if (typeof sdata[i].cid === 'number') {

            // Known to cause "Error 400 - Bad Gateway" when adding SoundClound songs if the cid is a Number and not a String
            sdata[i].cid = String(sdata[i].cid);
        }

        if (sdata[i].format == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Missing song format'), null);
            }

            return;
        }
        if (sdata[i].cid == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Missing song ID'), null);
            }

            return;
        }
        if (sdata[i].author == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Missing song author'), null);
            }

            return;
        }
        if (sdata[i].title == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Missing song title'), null);
            }

            return;
        }
        if (sdata[i].image == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Missing song image'), null);
            }

            return;
        }
        if (sdata[i].duration == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Missing song duration'), null);
            }

            return;
        }
    }

    that.getPlaylist(pid, function(playlist) {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }

            return;
        }

        const callbackWrapper = function(err, data) {
            if (!err) {
                playlist = editPlaylistLength(playlist, true);
            }
            if (typeof callback === 'function') {
                return callback(err, data);
            }
        };

        queueREST('POST', `${endpoints.PLAYLIST}/${pid}/media/insert`, {
            media: sdata,
            append: true
        }, callbackWrapper);
    });
};

/**
 * Removes a media from a playlist
 * @param {Number} pid Playlist ID
 * @param {Number|Number[]} mid Media ID(s)
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.removeSongFromPlaylist = function(pid, mid, callback) {
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

    if (!mid || (Array.isArray(mid) && mid.length === 0)) {
        if (typeof callback === 'function') {
            return callback(new Error('Missing song ID'), null);
        }

        return;
    }

    that.getPlaylist(pid, function(playlist) {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }

            return;
        }

        const callbackWrapper = function(err, data) {
            if (!err) {
                playlist = editPlaylistLength(playlist, false);
            }
            if (typeof callback === 'function') {
                return callback(err, data);
            }
        };

        if (!Array.isArray(mid)) {
            mid = [mid];
        }

        queueREST('POST', `${endpoints.PLAYLIST}/${pid}/media/delete`, {
            ids: mid
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

    this.getPlaylist(pid, function(playlist) {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }
        }

        const callbackWrapper = function(err, data) {
            if (!err) {
                const playlistsData = playlists.get();

                for (const i in playlistsData) {
                    if (!playlistsData.hasOwnProperty(i)) continue;
                    if (playlistsData[i].id === pid) {
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
    this.getPlaylists(function(playlistsData) {
        for (const i in playlistsData) {
            if (!playlistsData.hasOwnProperty(i)) continue;
            if (playlistsData[i].active) {
                if (typeof callback === 'function') {
                    callback(playlistsData[i]);

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
    this.getPlaylists(function(playlistsData) {
        for (const i in playlistsData) {
            if (!playlistsData.hasOwnProperty(i)) continue;
            if (playlistsData[i].id === pid) {
                if (typeof callback === 'function') {
                    callback(playlistsData[i]);

                    return;
                }

                return;
            }
        }

        if (typeof callback === 'function') {
            return callback(null);
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
    this.getPlaylist(pid, function(playlist) {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error(`Playlist id of ${pid} doesn't exist`), null);
            }

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
    if (!room.getRoomMeta().slug || !pid || !mid || (Array.isArray(mid) && mid.length === 0) || !beforeMid) return false;

    this.getPlaylist(pid, function(playlist) {
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

    this.getPlaylist(pid, function(playlist) {
        if (playlist == null) {
            if (typeof callback === 'function') {
                return callback(new Error('Playlist not found'), null);
            }

            return;
        }

        queueREST('PUT', `${endpoints.PLAYLIST}/${pid}/shuffle`, undefined, callback);

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
 * @param {Number} uid User ID
 * @param {Number} reason Reason ID
 * @param {String} duration Duration of the ban
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateBanUser = function(uid, reason, duration, callback) {
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

    const user = this.getUser(uid);

    if (user !== null ? room.getPermissions(user).canModBan : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) {
        if (duration === PlugAPI.BAN.PERMA && this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
            duration = PlugAPI.BAN.DAY;
        }

        queueREST('POST', endpoints.MODERATE_BAN, {
            userID: uid,
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

    if ((this.deleteAllChat && this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) || (user !== null ? room.getPermissions(user).canModChat : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER))) {
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
 * @param {Number} uid User ID
 * @param {Number} role The new role
 * @param {RESTCallback} [callback] Callback function
 * @returns {Boolean} If the REST request got queued
 */
PlugAPI.prototype.moderateSetRole = function(uid, role, callback) {
    if (!room.getRoomMeta().slug || !isFinite(role) || role < 0 || role > 5) {
        return false;
    }

    const user = this.getUser(uid);

    if (user !== null ? room.getPermissions(user).canModStaff : this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
        if (role === 0) {
            queueREST('DELETE', endpoints.MODERATE_STAFF + uid, undefined, callback);
        } else {
            queueREST('POST', endpoints.MODERATE_PERMISSIONS, {
                userID: uid,
                roleID: role
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

PlugAPI.prototype.getJar = function(callback) {
    if (jar) {
        if (typeof callback === 'function') {
            return callback(jar);
        }

        return jar;
    }
};

module.exports = PlugAPI;
