'use strict';

// Node.JS Core Modules
const http = require('http');
const Https = require('https');
const util = require('util');

// Third-party Modules
const autoBind = require('auto-bind');
const constants = require('./constants.json');
const EventEmitter3 = require('eventemitter3');
const handleErrors = require('handle-errors')('PlugAPI', true);
const pRetry = require('p-retry');
const WebSocket = require('ws');
const chalk = require('chalk');
const got = require('got');
const tough = require('tough-cookie');
const utils = require('./utils');
const Socket = require('./socket.js');

/**
 * node.js HTTPS agent with keepAlive enabled
 * @const
 * @type {exports}
 * @private
 */
const agent = new Https.Agent({
    keepAlive: true
});

// plugAPI
/**
 * BufferObject class
 * @type {BufferObject|exports}
 * @private
 */
const BufferObject = require('./bufferObject');

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
 * @const
 * @type {exports}
 * @private
 */
const PlugAPIInfo = require('../package.json');

/**
 * Storage for private data that should never be publiclly accessable
 * @type {exports|WeakMap}
 * @private
 */
const store = require('./privateVars');

/**
 * REST Endpoints
 * @const
 * @type {{CHAT_DELETE: String, HISTORY: String, MODERATE_ADD_DJ: String, MODERATE_BAN: String, MODERATE_BOOTH: String, MODERATE_MOVE_DJ: String, MODERATE_MUTE: String, MODERATE_PERMISSIONS: String, MODERATE_REMOVE_DJ: String, MODERATE_SKIP: String, MODERATE_UNBAN: String, MODERATE_UNMUTE: String, PLAYLIST: String, ROOM_CYCLE_BOOTH: String, ROOM_INFO: String, ROOM_LOCK_BOOTH: String, USER_SET_AVATAR: String, USER_GET_AVATARS: String}}
 * @private
 */
const endpoints = require('./endpoints.json');

/**
 * DateUtilities written by plug.dj & Modified by TAT (TAT@plugcubed.net)
 * @copyright 2014 - 2017 by Plug DJ, Inc.
 * @private
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
        return !e || Object.is(e, '0') ? 0 : this.secondsSince(new Date(e.substr(0, e.indexOf('.'))));
    },
    convertUnixDateStringToDate(e) {
        return e ? new Date(e.substr(0, 4), Number(e.substr(5, 2)) - 1, e.substr(8, 2), e.substr(11, 2), e.substr(14, 2), e.substr(17, 2)) : null;
    }
};

/**
 * Create instance of PlugAPI.
 * @param {String} authenticationData.email The email to login with.
 * @param {String} authenticationData.password The password to login with.
 * @param {Boolean} [authenticationData.guest = null] True to login as guest.
 * @param {String} authenticationData.facebook.accessToken The access token for Facebook login.
 * @param {String} authenticationData.facebook.userID The user ID for facebook login.
 * @param {Function} [callback] An optional callback utilized in async mode
 * @extends {EventEmitter3}
 *
 * @example
 *
 * <caption>There are multiple ways to create a bot. Sync vs Async, FB vs guest or email. Please choose only one of the examples to use.</caption>
 * // Sync
 * // Password
 * const bot = new PlugAPI({email: 'something@something.com', password: 'hunter2'});
 *
 * // Facebook
 * // To login with fb will require logging in via plug and viewing the data sent in to /_/auth/facebook via the network tab of dev tools.
 *
 * const bot = new PlugAPI({
 *    facebook: {
 *       userID: 'xxxxxxxx',
 *       accessToken: 'xxxxxx'
 *     }
 * });
 *
 * // Guest
 * const bot = new PlugAPI();
 * // OR
 * const bot = new PlugAPI({ guest: true });
 *
 * // Async
 *
 * // Password
 * new PlugAPI({email: 'something@something.com', password: 'hunter2'}, (err, bot) => {
 *    if (err) throw new Error(err);
 *
 * });
 *
 * // Facebook
 * new PlugAPI({
 *    facebook: {
 *       userID: 'xxxxxxxx',
 *       accessToken: 'xxxxxx'
 *     }
 * }, (err, bot) => {
 *    if (err) throw new Error(err);
 * });
 *
 * // Guest
 * new PlugAPI({ guest: true }, (err, data) => {
 *     if (err) throw new Error(err);
 * ]});
 *
 * @constructor
 */
class PlugAPI extends EventEmitter3 {
    constructor(authenticationData, callback) {
        super();
        autoBind(this);

        /**
        * Jethro Logger
        * @type {Logger|exports}
        * @private
        */
        this.logger = require('./logger');

        /**
         * Is User a guest?
         * @type {Boolean}
         * @private
         */
        this.guest = false;

        /**
         * Is User logging in via Facebook?
         * @type {Boolean}
         * @private
         */
        this.fbLogin = false;

        /**
         * Slug of room, that the bot is currently connecting to
         * @type {null|String}
         * @private
         */
        store(this)._connectingRoomSlug = null;

        /**
         * Authentication information (e-mail and password)
         * THIS MUST NEVER BE ACCESSIBLE NOR PRINTING OUT TO CONSOLE
         * @type {Object}
         * @private
         */
        store(this)._auththenticationInfo = null;

        /**
         * Queue of outgoing chat messages
         * @type {Object}
         * @private
         */
        store(this)._chatQueue = {
            queue: [],
            sent: 0,
            limit: 10,
            running: false
        };

        /**
         * plug.dj url to send https requests
         * @private
         * @type {String}
         */
        this.baseUrl = 'https://plug.dj';

        /**
         * Socket url to send socket events to.
         * @private
         * @type {String}
         */
        this.socketUrl = 'wss://godj.plug.dj:443/socket';

        /**
         * WebSocket (connection to plug.DJ's socket server)
         * @type {null|WebSocket}
         * @private
         */
        store(this)._ws = null;

        /**
         * Instance of Room
         * @type {Room}
         * @private
         */
        store(this)._room = new Room();

        /**
         * Is everything initialized?
         * @type {Boolean}
         * @private
         */
        store(this)._initialized = false;

        /**
         * Prefix that defines if a message is a command. Default is !
         * @type {String}
         */
        this.commandPrefix = '!';

        /**
         * Auth code for plug.DJ
         * @type {null|String}
         * @private
         */
        store(this)._authCode = null;

        /**
         * List over chat history
         * Contains up to 512 messages
         * @type {Array}
         * @private
         */
        store(this)._chatHistory = [];

        /**
         * Contains informations about requests sent to server
         * @type {{queue: Array, sent: Number, limit: Number, running: Boolean}}
         * @private
         */
        store(this)._serverRequests = {
            queue: [],
            sent: 0,
            limit: 10,
            running: false
        };

        /**
         * Queue that the bot should connect to the socket server
         * @param {String} roomSlug Slug of room to join after connection
         * @private
         */
        store(this)._queueConnectSocket = (roomSlug) => {
            store(this)._serverRequests.queue.push({
                type: 'connect',
                server: 'socket',
                room: roomSlug
            });
            if (!store(this)._serverRequests.running) {
                store(this)._queueTicker();
            }
        };

        /**
         * Connect to plug.DJ's socket server
         * @param {String} roomSlug Slug of room to join after connection
         * @private
         */
        store(this)._connectSocket = (roomSlug) => {
            if (Object.is(store(this)._authCode, null) || Object.is(store(this)._authCode, '')) {
                store(this)._getAuthCode(() => {
                    store(this)._connectSocket(roomSlug);
                }, roomSlug);

                return;
            }

            store(this)._ws = new Socket(this.socketUrl);
            store(this)._ws.on('open', () => {
                this.logger.success('plug.dj Socket Server', chalk`{green Connected as a ${this.guest ? 'guest' : 'user'}}`);
                store(this)._sendEvent('auth', store(this)._authCode);

                this.emit('connected');
                this.emit('server:socket:connected');
            });
            store(this)._ws.on('message', (data) => {
                if (!Object.is(data, 'h')) {
                    const payload = JSON.parse(data || '[]');

                    for (let i = 0; i < payload.length; i++) {
                        store(this)._ws.emit('data', payload[i]);
                    }
                }
            });
            store(this)._ws.on('data', store(this)._messageHandler.bind(this));
            store(this)._ws.on('data', (data) => this.emit('tcpMessage', data));
            store(this)._ws.on('error', (a) => {
                this.logger.error('plug.dj Socket Server', a);
            });
            store(this)._ws.on('reconnecting', () => {
                this.logger.info('Socket Server', 'Reconnecting');
            });
            store(this)._ws.on('close', (a) => {
                this.logger.warn('plug.dj Socket Server', `Closed with Code ${a}`);
            });
            store(this)._ws.connect();
        };

        /**
        * The ticker that runs through the server queue and executes them when it's time
        * @private
        */
        store(this)._queueTicker = () => {
            store(this)._serverRequests.running = true;

            const canSend = store(this)._serverRequests.sent < store(this)._serverRequests.limit;
            const obj = store(this)._serverRequests.queue.pop();

            if (canSend && obj) {
                store(this)._serverRequests.sent++;
                if (Object.is(obj.type, 'rest')) {
                    store(this)._sendREST(obj.opts, obj.callback);
                } else if (Object.is(obj.type, 'connect')) {
                    if (Object.is(obj.server, 'socket')) {
                        store(this)._connectSocket(obj.room);
                    }
                }

                setTimeout(() => {
                    store(this)._serverRequests.sent--;
                }, 6e4);
            }
            if (store(this)._serverRequests.queue.length > 0) {
                setImmediate(store(this)._queueTicker);
            } else {
                store(this)._serverRequests.running = false;
            }
        };

        /**
         * The ticker that runs through the chat queue and executes them when it's time
         * @private
         */
        store(this)._queueChatTicker = () => {
            const delay = (time) => {
                return new Promise((resolve) => setTimeout(resolve, time));
            };

            store(this)._chatQueue.running = true;
            if (store(this)._chatQueue.queue.length > 0) {
                if (store(this)._floodProtectionDelay < store(this)._floodProtectionDelayMax) {
                    store(this)._floodProtectionDelay += 75;
                }
                const obj = store(this)._chatQueue.queue.shift();

                if (obj) {

                    // console.log(`Delay: ${store(this)._floodProtectionDelay} Message: ${JSON.stringify(store(this)._chatQueue.queue)} Queue Length: ${store(this)._chatQueue.queue.length}`);

                    store(this)._sendEvent(PlugAPI.events.CHAT, obj.msg);
                    if (!Object.is(obj.timeout, undefined) && isFinite(~~obj.timeout) && ~~obj.timeout > 0) {
                        const specificChatDeleter = (data) => {
                            if (Object.is(data.raw.uid, store(this)._room.getSelf().id) && Object.is(data.message.trim(), obj.msg.trim())) {
                                setTimeout(() => {
                                    this.moderateDeleteChat(data.raw.cid);
                                }, ~~obj.timeout * 1E3);
                                this.off(PlugAPI.events.CHAT, specificChatDeleter);
                            }
                        };

                        this.on(PlugAPI.events.CHAT, specificChatDeleter);
                    }
                }
                delay(store(this)._floodProtectionDelay).then(() => store(this)._queueChatTicker());
            } else {
                store(this)._chatQueue.running = false;
                store(this)._floodProtectionDelay = 0;
            }
        };

        /**
         * Reconnect
         * @type {Function}
         * @param {*} roomSlug The room's slug
         * @private
         */
        store(this)._reconnect = (roomSlug) => {
            const slug = store(this)._room.getRoomMeta().slug ? store(this)._room.getRoomMeta().slug : roomSlug;

            this.close(true);
            this.logger.info('Socket Server', 'Reconnecting');
            setImmediate(() => {
                this.connect(slug);
            });
        };

        /**
         * Function to increment or decrement the playlist length count.
         * @type {Function}
         * @param {Array} playlist the playlist to modify
         * @param {Boolean} increment Whether to increment or decrement the playlist count.
         * @returns {Array} The playlist is returned with the modified count
         * @private
         */
        store(this)._editPlaylistLength = (playlist, increment) => {
            if (Object.is(typeof increment, 'undefined') || Object.is(increment, true)) {
                playlist.count++;
            } else {
                playlist.count--;
            }

            return playlist;
        };

        /**
         * Check if an object contains a value
         * @param {Object} obj The object
         * @param {*} value The value
         * @param {Boolean} [strict] Whether to use strict mode check or not
         * @private
         * @returns {Boolean} if object contains value
         */
        store(this)._objectContainsValue = (obj, value, strict) => {
            for (const i in obj) {
                if (!obj.hasOwnProperty(i)) continue;
                if ((!strict && obj[i] == value) || (strict && Object.is(obj[i], value))) return true; // eslint-disable-line eqeqeq
            }

            return false;
        };

        /**
         *  Common callback for all API calls
         *
         * @callback RESTCallback
         * @name RESTCallback
         *
         * @param {null|String} err Error message on error; otherwise null
         * @param {null|*} data Data on success; otherwise null
         */

        /**
         * Queue REST request
         * @param {String} method REST method
         * @param {String} endpoint Endpoint on server
         * @param {Object|Undefined} [data] Data
         * @param {RESTCallback|Undefined} [restCallback] Callback function
         * @param {Boolean} [skipQueue] Skip queue and send the request immediately
         * @private
         */
        store(this)._queueREST = (method, endpoint, data, restCallback, skipQueue) => {

            restCallback = Object.is(typeof restCallback, 'function') ? restCallback : () => { };

            const opts = {
                method,
                headers: Object.assign(store(this)._headers, {
                    cookie: this.jar.getCookieStringSync('https://plug.dj'),
                    Referer: `https://plug.dj/${store(this)._room.getRoomMeta().slug == null ? '' : store(this)._room.getRoomMeta().slug}`

                }),
                url: `${this.baseUrl}/_/${endpoint}`
            };

            if (data != null) {
                opts.body = data;
            }

            if (skipQueue && Object.is(skipQueue, true)) {
                store(this)._sendREST(opts, restCallback);
            } else {
                store(this)._serverRequests.queue.push({
                    type: 'rest',
                    opts,
                    callback: restCallback
                });
                if (!store(this)._serverRequests.running) {
                    store(this)._queueTicker();
                }
            }
        };

        /**
         * Send a REST request
         * @param {Object} opts An object of options to send in to the request module.
         * @param {RESTCallback} sendCallback Callback function
         * @private
         */
        store(this)._sendREST = (opts, sendCallback) => {
            const request = (attempts) => {
                if (attempts > 1) this.logger.warning('REST Warning', `Route: ${opts.url} sendREST attempt ${attempts}/10`);

                return got(opts.url, Object.assign(opts, {
                    headers: store(this)._headers,
                    agent,
                    json: true
                })).then((body) => {
                    body = body.body;

                    if (body && Object.is(body.status, 'ok')) {
                        return sendCallback(null, body.data);
                    }

                    return sendCallback(body && body.status ? body.status : new Error("Can't connect to plug.dj"), null);
                });
            };

            pRetry(request, {
                retries: 10,
                randomize: true
            })
                .catch((err) => {
                    this.logger.error('REST Error', `Route: ${opts.url} ${(err ? err : '')} Guest Mode: ${this.guest}`);

                    return sendCallback(`Route: ${opts.url} ${(err ? err : '')} Guest Mode: ${this.guest}`, null);
                });
        };

        /**
         * Get the room state.
         * @param {RESTCallback} roomstateCallback Callback function
         * @private
         */
        store(this)._getRoomState = (roomstateCallback) => {
            store(this)._queueREST('GET', 'rooms/state', undefined, (err, data) => {
                if (err) {
                    if (isFinite(err) && err >= 500) {
                        handleErrors.error('Internal Server Error from Plug.dj', roomstateCallback);
                    } else {
                        this.logger.error('PlugAPI', `'Error getting room state: ${err ? err : 'Unknown error'}`);
                        setTimeout(() => {
                            store(this)._getRoomState(roomstateCallback);
                        }, 1e3);

                        return;
                    }
                }
                store(this)._connectingRoomSlug = null;
                store(this)._initRoom(data[0], () => {
                    if (Object.is(typeof roomstateCallback, 'function')) {
                        return roomstateCallback(null, data);
                    }
                });
            });
        };

        /**
         * Queue that the bot should join a room.
         * @param {String} roomSlug Slug of room to join after connection
         * @param {RESTCallback} [joinCallback] Callback function
         * @private
         */
        store(this)._joinRoom = (roomSlug, joinCallback) => {
            store(this)._queueREST('POST', 'rooms/join', {
                slug: roomSlug
            }, (err) => {
                if (err) {
                    if (isFinite(err)) {
                        if (err >= 400 && err < 500) {
                            handleErrors.error(`Invalid room URL. Please Check If the roomSlug ${roomSlug} is correct`, joinCallback);
                        } else {
                            handleErrors.error('Internal Server Error from Plug.dj', joinCallback);
                        }
                    } else {
                        this.logger.error('PlugAPI', `Error while joining: ${err ? err : 'Unknown error'}`);
                        setTimeout(() => {
                            store(this)._joinRoom(roomSlug, joinCallback);
                        }, 1e3);

                        return;
                    }

                }
                store(this)._getRoomState(joinCallback);
            });
        };

        /**
         * Perform the login process using credentials.
         * @param {Function} loginCallback Callback
         * @private
         */
        store(this)._performLoginCredentials = (loginCallback) => {

            /**
            * Is the login process running.
            * Used for sync
            * @type {boolean}
            * @private
            */
            let loggingIn = true;

            const setCookie = (res) => {
                if (Array.isArray(res.headers['set-cookie'])) {
                    res.headers['set-cookie'].forEach((item) => {
                        this.jar.setCookieSync(item, 'https://plug.dj');
                    });
                } else if (Object.is(typeof res.headers['set-cookie'], 'string')) {
                    this.jar.setCookieSync(res.headers['set-cookie'], 'https://plug.dj');
                }
            };

            const handleLogin = (body) => {
                if (body && body.body && !Object.is(body.body.status, 'ok')) {
                    handleErrors.error(`Login Error: ${body && body.body && !Object.is(body.body.status, 'ok') ? `API Status: ${body.body.status}` : ''} ${body && !Object.is(body.statusCode, 200) ? `HTTP Status: ${body.body.statusCode} - ${http.STATUS_CODES[body.body.statusCode]}` : ''}`, loginCallback);
                } else {
                    loggingIn = false;
                    if (Object.is(typeof loginCallback, 'function')) {
                        return loginCallback(null, this);
                    }
                }
            };
            const handleError = (err) => {
                process.nextTick(() => {
                    handleErrors.error(`Login Error: \n${err || ''}`, loginCallback);
                });
            };

            if (this.guest) {
                const guestLogin = (attempts) => {
                    if (attempts > 1) this.logger.warning('PlugAPI', `Attempt #${attempts} to connect to plug.dj as guest`);

                    return got(`${this.baseUrl}/plugcubed`).then((data) => {
                        if (data.body) {
                            const serverTime = data.body.split('_st')[1].split('"')[1];

                            DateUtilities.setServerTime(serverTime);
                            loggingIn = false;
                            setCookie(data);
                            if (Object.is(typeof loginCallback, 'function')) {
                                return loginCallback(null, this);
                            }
                        } else if (Object.is(typeof loginCallback, 'function')) {
                            return loginCallback(new Error('unable to connect to plug.dj'), null);
                        }
                    });
                };

                pRetry(guestLogin, {
                    forever: true,
                    randomize: true,
                    maxTimeout: 300000
                })
                    .catch(handleError);
            } else {
                const login = (attempts) => {
                    if (attempts > 1) this.logger.warning('PlugAPI', `Attempt #${attempts} to obtain server data from plug.dj`);

                    return got(`${this.baseUrl}/_/mobile/init`, {
                        headers: store(this)._headers,
                        json: true
                    }).then((indexBody) => {
                        const info = indexBody.body;
                        const csrfToken = info.data[0].c;
                        const serverTime = info.data[0].t;

                        DateUtilities.setServerTime(serverTime);

                        setCookie(indexBody);

                        if (this.fbLogin) {
                            const fbLogin = (facebookAttempts) => {
                                if (facebookAttempts > 1) this.logger.warning('PlugAPI', `Attempt #${facebookAttempts} to login to plug.dj`);

                                return got(`${this.baseUrl}/_/auth/facebook`, {
                                    json: true,
                                    method: 'POST',
                                    headers: Object.assign(store(this)._headers, {
                                        cookie: this.jar.getCookieStringSync('https://plug.dj')
                                    }),
                                    body: {
                                        csrf: csrfToken,
                                        accessToken: store(this)._auththenticationInfo.facebook.accessToken,
                                        userID: store(this)._auththenticationInfo.facebook.userID
                                    }
                                })
                                    .then(handleLogin)
                                    .catch((fbError) => {
                                        process.nextTick(() => {
                                            handleErrors.error(fbError.stack || fbError, callback);
                                        });
                                    });
                            };

                            pRetry(fbLogin, {
                                forever: true,
                                randomize: true,
                                maxTimeout: 300000
                            })
                                .catch(handleError);

                        } else {
                            const authLogin = (loginAttempts) => {
                                if (loginAttempts > 1) this.logger.warning('PlugAPI', `Attempt #${loginAttempts} to login to plug.dj`);

                                return got(`${this.baseUrl}/_/auth/login`, {
                                    json: true,
                                    method: 'POST',
                                    headers: Object.assign(store(this)._headers, {
                                        cookie: this.jar.getCookieStringSync('https://plug.dj')
                                    }),
                                    body: {
                                        csrf: csrfToken,
                                        email: store(this)._auththenticationInfo.email,
                                        password: store(this)._auththenticationInfo.password
                                    }
                                })
                                    .then(handleLogin)
                                    .catch((err2) => {
                                        process.nextTick(() => {
                                            if (err2 && err2.statusCode) {
                                                if (err2.statusCode >= 400 && err2.statusCode < 500) {
                                                    if (Object.is(err2.statusCode, 400)) {
                                                        handleErrors.error(`Login Error: Missing email or password | HTTP Status: ${err2.message}`, loginCallback);
                                                    } else if (Object.is(err2.statusCode, 401)) {
                                                        handleErrors.error(`Login Error: Incorrect email or password | HTTP Status: ${err2.message}`, loginCallback);
                                                    } else if (Object.is(err2.statusCode, 403)) {
                                                        handleErrors.error(`Login Error: Incorrect CSRF Token. | HTTP Status: ${err2.message}`, loginCallback);
                                                    }
                                                } else {
                                                    handleErrors.error(err2.stack || err2, loginCallback);
                                                }
                                            }
                                        });
                                    });
                            };

                            pRetry(authLogin, {
                                forever: true,
                                randomize: true,
                                maxTimeout: 300000
                            })
                                .catch(handleError);
                        }
                    });
                };

                pRetry(login, {
                    forever: true,
                    randomize: true,
                    maxTimeout: 300000
                })
                    .catch(handleError);
            }

            if (!Object.is(typeof loginCallback, 'function')) {
                const deasync = require('deasync');

                // Wait until the session is set
                while (loggingIn) { // eslint-disable-line no-unmodified-loop-condition
                    deasync.sleep(100);
                }
            }
        };

        /**
         * Get the auth code for the user
         * @param {Function} authCallback Callback function
         * @param {String} [roomSlug] room slug to connect to. Used if plugAPI can't get current slug.
         * @private
         */
        store(this)._getAuthCode = (authCallback, roomSlug) => {
            const getAuthCode = () => {
                store(this)._headers.cookie = this.jar.getCookieStringSync('https://plug.dj');

                return got(`${this.baseUrl}/_/auth/token`, {
                    headers: store(this)._headers,
                    json: true
                }).then((body) => {
                    store(this)._authCode = body.body.data[0];

                    return authCallback();
                });
            };

            pRetry(getAuthCode, {
                randomize: true,
                forever: true,
                maxTimeout: 300000
            })
                .catch(console.error);
        };

        /**
         * Handling incoming messages.
         * Emitting the correct events depending on commands, mentions, etc.
         * @param {Object} messageData plug.DJ message event data
         * @private
         */
        store(this)._receivedChatMessage = (messageData) => {
            if (!store(this)._initialized || messageData.from == null) return;

            let i;
            const mutedUser = store(this)._room.isMuted(messageData.from.id);
            const prefixChatEventType = (mutedUser && !this.mutedTriggerNormalEvents ? 'muted:' : '');

            if (messageData.message.startsWith(this.commandPrefix) && (this.processOwnMessages || !Object.is(messageData.from.id, store(this)._room.getSelf().id))) {
                const cmd = messageData.message.substr(this.commandPrefix.length).split(' ')[0];

                messageData.command = cmd;
                messageData.args = messageData.message.substr(this.commandPrefix.length + cmd.length + 1);
                const random = Math.ceil(Math.random() * 1E10);

                // Arguments
                if (Object.is(messageData.args, '')) {
                    messageData.args = [];
                } else {

                    // Mentions => Mention placeholder
                    let lastIndex = -1;
                    const allUsers = store(this)._room.getUsers();

                    if (allUsers.length > 0) {
                        for (const user of allUsers) {
                            lastIndex = messageData.args.toLowerCase().indexOf(user.username.toLowerCase());

                            if (lastIndex > -1) {
                                messageData.args = `${messageData.args.substr(0, lastIndex).replace('@', '')}%MENTION-${random}-${messageData.mentions.length}% ${messageData.args.substr(lastIndex + user.username.length + 1)}`;
                                messageData.mentions.push(user);

                            }
                        }
                    }

                    messageData.args = messageData.args.split(' ');

                    for (i = 0; i < messageData.args.length; i++) {
                        if (isFinite(Number(messageData.args[i])) && !Object.is(messageData.args[i], '')) {
                            messageData.args[i] = Number(messageData.args[i]);
                        }
                    }
                }

                // Mention placeholder => User object
                if (messageData.mentions.length > 0) {
                    for (i = 0; i < messageData.mentions.length; i++) {
                        messageData.args[messageData.args.indexOf(`%MENTION-${random}-${i}%`)] = messageData.mentions[i];
                    }
                }

                // Pre command handler
                if (Object.is(typeof this.preCommandHandler, 'function') && Object.is(this.preCommandHandler(messageData), false)) return;

                // Functions
                messageData.respond = function() {
                    const message = Array.prototype.slice.call(arguments).join(' ');

                    return this.sendChat(`@${messageData.from.username} ${message}`);
                }.bind(this);
                messageData.respondTimeout = function() {
                    const args = Array.prototype.slice.call(arguments);
                    const timeout = parseInt(args.splice(args.length - 1, 1), 10);
                    const message = args.join(' ');

                    return this.sendChat(`@${messageData.from.username} ${message}`, timeout);
                }.bind(this);
                messageData.havePermission = (permission, permissionCallback) => {
                    if (permission == null) {
                        permission = PlugAPI.ROOM_ROLE.NONE;
                    }
                    if (this.havePermission(messageData.from.id, permission)) {
                        if (Object.is(typeof permissionCallback, 'function')) {
                            return permissionCallback(true);
                        }

                        return true;
                    }
                    if (Object.is(typeof permissionCallback, 'function')) {
                        return permissionCallback(false);
                    }

                    return false;
                };
                messageData.isFrom = (ids, success, failure) => {
                    if (Object.is(typeof ids, 'string') || Object.is(typeof ids, 'number')) {
                        ids = [ids];
                    }
                    if (ids == null || !Array.isArray(ids)) {
                        if (Object.is(typeof failure, 'function')) {
                            return failure();
                        }

                        return false;
                    }
                    const isFrom = ids.indexOf(messageData.from.id) > -1;

                    if (isFrom && Object.is(typeof success, 'function')) {
                        return success();
                    } else if (!isFrom && Object.is(typeof failure, 'function')) {
                        return failure();
                    }

                    return isFrom;
                };
                if (!mutedUser) {
                    this.emit(prefixChatEventType + PlugAPI.events.CHAT_COMMAND, messageData);
                    this.emit(`${prefixChatEventType}${PlugAPI.events.CHAT_COMMAND}:${cmd}`, messageData);
                    if (this.deleteCommands) {
                        if (!this.deleteMessageBlocks) {
                            if (!(Object.is(store(this)._lastMessageUID, messageData.raw.uid) || Object.is(store(this)._lastMessageType, messageData.type))) {
                                this.moderateDeleteChat(messageData.raw.cid);
                            }
                        } else {
                            this.moderateDeleteChat(messageData.raw.cid);
                        }
                    }
                }
            } else if (Object.is(messageData.type, 'emote')) {
                this.emit(`${prefixChatEventType}${PlugAPI.events.CHAT}:emote`, messageData);
            }

            store(this)._lastMessageUID = messageData.raw.uid;
            store(this)._lastMessageType = messageData.type;

            this.emit(prefixChatEventType + PlugAPI.events.CHAT, messageData);
            this.emit(`${prefixChatEventType}${PlugAPI.events.CHAT}:${messageData.raw.type}`, messageData);

            if (!Object.is(store(this)._room.getSelf(), null) && messageData.message.indexOf(`@${store(this)._room.getSelf().username}`) > -1) {
                this.emit(`${prefixChatEventType}${PlugAPI.events.CHAT}:mention`, messageData);
            }
        };

        /**
         * Sends in a websocket event to plug's servers
         * @param  {String} type The Event type to send in
         * @param  {String} data The data to send in.
         * @private
         */
        store(this)._sendEvent = (type, data) => {
            if (store(this)._ws != null && Object.is(store(this)._ws.connection.readyState, WebSocket.OPEN)) {
                store(this)._ws.send(JSON.stringify({
                    a: type,
                    p: data,
                    t: DateUtilities.getServerEpoch()
                }));
            }
        };

        /**
         * Initialize the room with the room state data
         * @param {Object} data the room state Data
         * @param {Function} roomCallback Callback function
         * @private
         */
        store(this)._initRoom = (data, roomCallback) => {
            store(this)._room.reset();
            store(this)._room.setRoomData(data);
            this.emit(PlugAPI.events.ADVANCE, {
                currentDJ: store(this)._room.getDJ(),
                djs: store(this)._room.getDJs(),
                lastPlay: {
                    dj: null,
                    media: null,
                    score: null
                },
                media: store(this)._room.getMedia(),
                startTime: store(this)._room.getStartTime(),
                historyID: store(this)._room.getHistoryID()
            });
            store(this)._queueREST('GET', endpoints.HISTORY, undefined, store(this)._room.setHistory.bind(store(this)._room));
            this.emit(PlugAPI.events.ROOM_JOIN, data.meta.name);
            store(this)._initialized = true;
            roomCallback();
        };

        /*
         * The handling of incoming messages from the Plug.DJ socket server.
         * If any cases are returned instead of breaking (stopping the emitting to the user code) it MUST be commented just before returning.
         * @param {Object} msg Socket events sent in from plug.dj
         * @private
         */
        store(this)._messageHandler = (msg) => {

            /**
             * Event type
             * @private
             * @type {PlugAPI.events}
             */
            const type = msg.a;

            /**
             * Data for the event
             * Will lookup in EventObjectTypes for possible converter function
             * @private
             * @type {*}
             */
            let data = EventObjectTypes[msg.a] != null ? EventObjectTypes[msg.a](msg.p, store(this)._room) : msg.p;

            let i, slug;
            const reconnect = (isAck) => {
                this.logger.warn('PlugAPI', `${isAck ? 'Reconnecting' : 'Reconnecting because of KILL_SESSION (logging in more than once on plug.dj)'}`);
                if (store(this)._room.getRoomMeta().slug) {
                    store(this)._authCode = null;
                    slug = store(this)._room.getRoomMeta().slug;
                    this.close(true);
                    if (isAck) {
                        store(this)._performLoginCredentials(null, true);
                    }
                    this.connect(slug);
                } else {
                    setImmediate(() => reconnect());
                }
            };

            switch (type) {
                case 'ack':
                    if (!Object.is(data, '1')) {
                        reconnect(true);

                        // This event should not be emitted to the user code.
                        return;
                    }

                    store(this)._queueREST('GET', endpoints.USER_INFO, null, (err, userData) => {
                        if (err) throw new Error(`Error Obtaining user info. ${err}`);
                        store(this)._room.setSelf(userData[0]);
                        store(this)._joinRoom(store(this)._connectingRoomSlug);
                    });

                    // This event should not be emitted to the user code.
                    return;
                case PlugAPI.events.ADVANCE:

                    // Add information about lastPlay to the data
                    data.lastPlay = {
                        dj: store(this)._room.getDJ(),
                        media: store(this)._room.getMedia(),
                        score: store(this)._room.getRoomScore()
                    };

                    store(this)._room.advance(data);
                    store(this)._queueREST('GET', endpoints.HISTORY, undefined, store(this)._room.setHistory.bind(store(this)._room));

                    // Override parts of the event data with actual User objects
                    data.currentDJ = store(this)._room.getDJ();
                    data.djs = store(this)._room.getDJs();
                    break;
                case PlugAPI.events.CHAT:

                    // If over limit, remove the first item
                    if (store(this)._chatHistory.push(data) > 512) store(this)._chatHistory.shift();

                    store(this)._receivedChatMessage(data);

                    // receivedChatMessage will emit the event with correct chat object and  correct event types
                    return;
                case PlugAPI.events.CHAT_DELETE:
                    for (i = 0; i < store(this)._chatHistory.length; i++) {
                        if (store(this)._chatHistory[i] && Object.is(store(this)._chatHistory[i].id, data.c)) {
                            store(this)._chatHistory.splice(i, 1);
                        }
                    }
                    break;
                case PlugAPI.events.ROOM_DESCRIPTION_UPDATE:
                    store(this)._room.setRoomDescription(data.description);
                    break;
                case PlugAPI.events.ROOM_NAME_UPDATE:
                    store(this)._room.setRoomName(data.name);
                    break;
                case PlugAPI.events.ROOM_WELCOME_UPDATE:
                    store(this)._room.setRoomWelcome(data.welcome);
                    break;
                case PlugAPI.events.USER_JOIN:
                    store(this)._room.addUser(data);
                    break;
                case PlugAPI.events.USER_LEAVE:
                    let userData = store(this)._room.getUser(data);

                    if (userData == null || Object.is(data, 0)) {
                        userData = {
                            id: data,
                            guest: Object.is(data, 0)
                        };
                    }
                    store(this)._room.removeUser(data);
                    this.emit(type, userData);

                    // This is getting emitted with the full user object instead of only the user ID
                    return;
                case PlugAPI.events.USER_UPDATE:
                    store(this)._room.updateUser(data);
                    this.emit(type, this.getUser(data.i));

                    // This is getting emitted with the full user object instead of only the user ID
                    return;
                case PlugAPI.events.VOTE:
                    store(this)._room.setVote(data.raw.i, data.raw.v);
                    break;
                case PlugAPI.events.GRAB:
                    store(this)._room.setGrab(data);
                    break;
                case PlugAPI.events.DJ_LIST_CYCLE:
                    store(this)._room.setBoothCycle(data.cycle);
                    break;
                case PlugAPI.events.DJ_LIST_LOCKED:
                    store(this)._room.setBoothLocked(data.locked);
                    break;
                case PlugAPI.events.DJ_LIST_UPDATE:
                    store(this)._room.setDJs(data);

                    // Override the data with full user objects
                    data = store(this)._room.getWaitList();
                    break;
                case PlugAPI.events.FORCE_NAME_CHANGE:
                    store(this)._room.updateUser({
                        i: data.i,
                        username: data.n
                    });
                    break;
                case PlugAPI.events.PDJ_MESSAGE:
                    this.logger.info('plug.dj', `Message from plug.dj: ${data}`);
                    break;
                case PlugAPI.events.PDJ_UPDATE:
                    this.logger.info('plug.dj', `Update Message from plug.dj: ${data}`);
                    break;
                case PlugAPI.events.MAINT_MODE_ALERT:
                    this.logger.warning('plugAPI', `plug.dj is going into maintenance in ${data} minutes`);
                    break;
                case PlugAPI.events.MODERATE_STAFF:
                    if (Array.isArray(data.raw) && data.raw.u.length > 0) {
                        for (i = 0; i < data.raw.u.length; i++) {
                            const user = data.raw.u[i];

                            if (user && user.i && user.p) {
                                store(this)._room.updateUser({
                                    i: user.i,
                                    role: user.p
                                });
                            }
                        }
                    }
                    break;
                case PlugAPI.events.MAINT_MODE:
                case PlugAPI.events.MODERATE_BAN:
                case PlugAPI.events.MODERATE_WLBAN:
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
                    store(this)._room.muteUser(data);
                    break;
                case PlugAPI.events.KILL_SESSION:
                    reconnect();
                    break;
                case PlugAPI.events.GIFTED_EARN:
                case PlugAPI.events.EARN:
                    store(this)._room.setEarn(data);
                    break;
                case PlugAPI.events.NOTIFY:
                    if (Object.is(data.action, 'levelUp')) {
                        this.logger.info('plug.dj', `Congratulations, you have leveled up to level ${data.value}`);
                    } else {
                        this.logger.info('plug.dj', `Notification: ${util.inspect(data)}`);
                    }
                    break;
                case PlugAPI.events.CHAT_LEVEL_UPDATE:
                    store(this)._room.setMinChatLevel(data.level);
                    this.logger.info('plug.dj', `Chat Level has changed to level: ${data.level} by ${data.user.username}`);
                    break;
                default:
                case undefined:
                    this.logger.warning('PlugAPI', `Unknown Message Format (unimplemented in plugAPI): ${JSON.stringify(msg, null, 4)}`);
            }
            if (type) {
                this.emit(type, data);
            }
        };

        /**
         * Current delay between chat messages
         * @type {Number}
         * @private
         */
        store(this)._floodProtectionDelay = 0;

        /**
         * Maximum delay between chat messages
         * @type {Number}
         * @private
         */
        store(this)._floodProtectionDelayMax = 700;

        /**
         * Playlist data for the user
         * @type {BufferObject}
         * @private
         */
        store(this)._playlists = new BufferObject(null, (cb) => {
            store(this)._queueREST('GET', endpoints.PLAYLIST, undefined, cb);
        }, 6e5);

        /**
        * default headers to send with https requests
        * @type {Object}
        * @private
        */
        store(this)._headers = {
            'accept-encoding': 'gzip,deflate',
            Accept: 'application/json, text/javascript, */*; q=0.01',
            Connection: 'keep-alive',
            'Content-Type': 'application/json',
            'User-Agent': `plugAPI_${PlugAPIInfo.version}`
        };

        this.jar = new tough.CookieJar(undefined, {
            looseMode: true
        });

        if (Object.is(typeof authenticationData, 'undefined')) {
            this.guest = true;
        } else if (!authenticationData.hasOwnProperty('email') && !authenticationData.hasOwnProperty('password') && !authenticationData.hasOwnProperty('facebook') && authenticationData.hasOwnProperty('guest')) {
            this.guest = true;
        } else if (authenticationData.hasOwnProperty('facebook')) {
            if (!Object.is(typeof authenticationData.facebook.accessToken, 'string')) {
                handleErrors.error('Missing Facebook Auth Token', callback);
            } else if (!Object.is(typeof authenticationData.facebook.userID, 'string')) {
                handleErrors.error('Missing Facebook UserID', callback);
            }
            this.fbLogin = true;
        } else {
            if (!Object.is(typeof authenticationData.email, 'string')) {
                handleErrors.error('Missing Login Email', callback);
            }
            if (!Object.is(typeof authenticationData.password, 'string')) {
                handleErrors.error('Missing Login Password', callback);
            }
        }

        store(this)._auththenticationInfo = authenticationData;
        store(this)._performLoginCredentials(callback);

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
        * Should the bot delete message blocks?
        * @type {boolean}
        */
        this.deleteMessageBlocks = false;

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

        /**
        * userID of the last message
        * @type {Number}
        * @private
        */
        store(this)._lastMessageUID = null;

        /**
        * message type ("message" or "emote") of the last message
        * @type {String}
        * @private
        */
        store(this)._lastMessageType = null;

        store(this)._room.registerUserExtensions(this);

        /**
         * Pre-command Handler
         * @param {Object} [obj] An object used to pre process commands
         * @returns {Boolean} If false, the command is not getting handled.
         *
         * @example
         *
         * // this prevents anyone without the user id of 1234567 from running a command. There are also other things a user can do such as cooldowns per command.
         * bot.preCommandHandler((data) => {
         *    if (data && data.from && !Object.is(data.from.id, 1234567)) return false;
         * })
         */
        this.preCommandHandler = (obj) => true;

        this.logger.info('PlugAPI', `Running plugAPI v${PlugAPIInfo.version}`);
    }

    /**
     * Connect to a room
     * @param {String} roomSlug Slug of room (The part after https://plug.dj/)
     *
     * @example
     * bot.connect('plugcubed');
     */
    connect(roomSlug) {
        if (!roomSlug || !Object.is(typeof roomSlug, 'string') || Object.is(roomSlug.length, 0) || roomSlug.indexOf('/') > -1) {
            throw new Error('Invalid room name');
        }

        if (store(this)._connectingRoomSlug != null) {
            this.logger.error('PlugAPI', 'Already connecting to a room');

            return;
        }

        // Only connect if session cookie is set
        if (!this.jar.getCookieStringSync('https://plug.dj')) {
            setImmediate(() => this.connect(roomSlug));

            return;
        }

        store(this)._connectingRoomSlug = roomSlug;
        store(this)._queueConnectSocket(roomSlug);
    }

    /**
     * Join another room
     * @param {String} slug The room slug to change to
     *
     * @example
     * bot.changeRoom('my-other-room-is-better');
     */
    changeRoom(slug) {
        store(this)._joinRoom(slug);
    }

    /**
     * Close the connection
     *
     * @param {Boolean} reconnecting  Is the bot reconnecting?
     * @example
     * bot.close();
     */
    close(reconnecting) {
        store(this)._connectingRoomSlug = null;

        if (store(this)._ws != null && Object.is(store(this)._ws.connection.readyState, WebSocket.OPEN)) {
            store(this)._ws.removeAllListeners('close');
            store(this)._ws.close();
        }
        if (!(Object.is(typeof reconnecting, 'boolean') && reconnecting)) {
            this.removeAllListeners();
            store(this)._authCode = null;
        }
        store(this)._room = new Room();
    }

    /**
     * Get a history over chat messages. (Limit 512 messages)
     * @returns {Array} Chat history
     *
     * @example
     * bot.getChatHistory();
     */
    getChatHistory() {
        return store(this)._chatHistory;
    }

    /**
     * Get a history over songs played. (Limit 50 songs)
     * @param {Function} callback Callback to get the history. History will be sent as argument.
     * @returns {Array|Function} Either returns an array of objects of songs in history, or a callback with the array of objects.
     *
     * @example
     * bot.getHistory();
     */
    getHistory(callback) {
        if (this.guest) return;

        if (store(this)._initialized) {
            const history = store(this)._room.getHistory();

            if (history.length > 1) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(history);
                }

                return history;
            }
        } else {
            setImmediate(() => this.getHistory(callback));
        }
    }

    /**
     * Get information about the booth such as who's DJing, if booth is locked, cycle is enabled, DJs in waitList
     * @prop {User} currentDJ.user The current DJ that is playing.
     * @prop {Boolean} isLocked True if waitlist is locked. False if not.
     * @prop {Boolean} cycle True if dj cycle is enabled. False if not
     * @returns {Object} An object of booth metadata.
     *
     * @example
     * bot.getBoothMeta();
     */
    getBoothMeta() {
        return store(this)._room.getBoothMeta();
    }

    getHistoryID() {
        return store(this)._room.getHistoryID();
    }

    /**
     * Get the currently playing media. Null if there isnt
     *
     * @prop {String} author The song's author
     * @prop {String} cid The unique id of the song that is used for YouTube or SoundCloud playback.
     * @prop {Number} duration Time in seconds of how long the song is.
     * @prop {Number} format 1 if the song is YouTube. 2 if SoundCloud
     * @prop {String} image A url to a thumbnail image of the song on YouTube or SoundCloud
     * @prop {String} title The song's title.
     *
     * @returns {Object|null} Null if nothing is playing, or an object of the song info.
     *
     * @example
     * bot.getMedia();
     */
    getMedia() {
        return store(this)._room.getMedia();
    }

    /**
     * Get the room's metadata
     *
     * @prop {String} description The room's description.
     * @prop {boolean} favorite If the bot has favorited the room.
     * @prop {Number} guests The amount of guests in the room.
     * @prop {Number} hostID The room host's ID.
     * @prop {Number} hostname The room host's username.
     * @prop {Number} id The room's ID.
     * @prop {Number} minChatLevel The minimum chat level set in the room for users to chat.
     * @prop {String} name The room's name
     * @prop {Boolean} nsfw If the room is categorized as nsfw (18+, suggestive images, etc)
     * @prop {Number} population the amount of users in the room.
     * @prop {Number} slug The room's slug (what you put in the url after https://plug.dj/)
     * @prop {String} welcome The room's welcome message.
     *
     * @returns {Object} an object of the room's metadata.
     *
     * @example
     * bot.getRoomMeta();
     */
    getRoomMeta() {
        return store(this)._room.getRoomMeta();
    }

    /**
     * Get the current room score fot the song playing.
     *
     * @prop {Number} grabs Amount of grabs for song.
     * @prop {Number} listeners Amount of people listening to song.
     * @prop {Number} negative Amount of mehs for song.
     * @prop {Number} positive Amount of woots for song.
     *
     * @returns {Object} An object with the listeners, and the amount of votes / grabs on the song.
     *
     * @example
     * bot.getRoomScore();
     */
    getRoomScore() {
        return store(this)._room.getRoomScore();
    }

    /**
     * Adds bot to waitList.
     *
     * @param {RESTCallback} callback Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.joinBooth();
     */
    joinBooth(callback) {
        if (!store(this)._room.getRoomMeta().slug || store(this)._room.isDJ() || store(this)._room.isInWaitList() || (store(this)._room.getBoothMeta().isLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.RESIDENTDJ)) || this.getDJs().length >= 50 || this.guest) {
            return false;
        }
        store(this)._queueREST('POST', endpoints.MODERATE_BOOTH, undefined, callback);

        return true;
    }

    /**
     * Removes bot from waitList.
     *
     * @param {RESTCallback} callback Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.leaveBooth();
     */
    leaveBooth(callback) {
        if (!store(this)._room.getRoomMeta().slug || (!store(this)._room.isDJ() && !store(this)._room.isInWaitList()) || this.guest) {
            return false;
        }
        store(this)._queueREST('DELETE', endpoints.MODERATE_BOOTH, undefined, callback);

        return true;
    }

    /**
     * Send a chat message
     * @param {String} msg Message
     * @param {int} [timeout] If set, auto deletes the message after x seconds. (Needs to have modChat permission)
     * @example
     *
     * // without timeout
     * bot.sendChat('Hello world!');
     *
     * // with timeout. Will delete after 5 seconds.
     * bot.sendChat('Hello world!', 5)
     */
    sendChat(msg, timeout) {
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
                store(this)._chatQueue.queue.push({
                    msg,
                    timeout
                });
                if (i + 1 >= this.multiLineLimit) {
                    break;
                }
            }
        } else {
            store(this)._chatQueue.queue.push({
                msg,
                timeout
            });
        }
        if (store(this)._chatQueue.running) return;
        store(this)._queueChatTicker();
    }

    /**
     * Get the current avatar
     * @returns {User.avatarID|String} AvatarID of the current avatar
     *
     * @example
     * bot.getAvatar();
     */
    getAvatar() {
        return store(this)._room.getUser().avatarID;
    }

    /**
     * Get all available avatars
     * @param {RESTCallback} callback Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.getAvatars((err, data) => console.log(err, data));
     */
    getAvatars(callback) {
        if (!store(this)._room.getRoomMeta().slug || this.guest) return false;
        store(this)._queueREST('GET', endpoints.USER_GET_AVATARS, undefined, callback);

        return true;
    }

    /**
     * Set avatar
     * Be sure you only use avatars that are available {@link PlugAPI#getAvatars}
     * @param {String} id Avatar ID
     * @param {RESTCallback} callback Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.setAvatar('classic07');
     */
    setAvatar(id, callback) {
        if (!store(this)._room.getRoomMeta().slug || !id || this.guest) return false;
        store(this)._queueREST('PUT', endpoints.USER_SET_AVATAR, {
            id
        }, callback);

        return true;
    }

    /**
     * Get plug.dj admins currently in the community
     * @returns {Array} An array of all admins in the room
     *
     * @example
     * bot.getAdmins();
     */
    getAdmins() {
        return store(this)._room.getAdmins();
    }

    /**
     * Get all staff for the community, also offline.
     * @param {RESTCallback} callback Callback function
     *
     * @example
     * bot.getAllStaff((err, data) => console.log(err, data));
     */
    getAllStaff(callback) {
        if (!Object.is(typeof callback, 'function')) {
            this.logger.error('PlugAPI', 'Missing callback for getAllStaff');

            return;
        }
        store(this)._queueREST('GET', 'staff', undefined, callback);
    }

    /**
     * Get all ambassadors in the community
     * @returns {Array} An array of all ambassadors in the room
     *
     * @example
     * bot.getAmbassadors();
     */
    getAmbassadors() {
        return store(this)._room.getAmbassadors();
    }

    /**
     * Get users in the community that aren't DJing nor in the waitList
     * @returns {Array} An array of all users that aren't DJing nor in the waitList
     *
     * @example
     * bot.getAudience();
     */
    getAudience() {
        return store(this)._room.getAudience();
    }

    /**
     * Get the current DJ
     * @returns {User|null} Current DJ or {null} if no one is currently DJing
     *
     * @example
     * bot.getDJ();
     */
    getDJ() {
        return store(this)._room.getDJ();
    }

    /**
     * Get the DJ and users in the waitList
     * @returns {Array} An array of all DJs and users in the waitList
     *
     * @example
     * bot.getDJs();
     */
    getDJs() {
        return store(this)._room.getDJs();
    }

    /**
     * Host if in community, otherwise null
     * @returns {User|null} The Host as a user object if they are in the room, otherwise null
     *
     * @example
     * bot.getHost();
     */
    getHost() {
        return store(this)._room.getHost();
    }

    /**
     * Get the user object for yourself
     * @returns {User|null} The user object of yourself.
     *
     * @example
     * bot.getSelf();
     */
    getSelf() {
        return store(this)._room.getSelf();
    }

    /**
     * Get staff currently in the community
     * @returns {User[]} A User array of all staff in the room
     *
     * @example
     * bot.getStaff();
     */
    getStaff() {
        return store(this)._room.getStaff();
    }

    /**
     * Get specific user in the community
     * @param {Number} [uid] The User ID to lookup. Use's bot's ID if not sent in
     * @returns {User[]|null} A user object of the user,  or null if can't be found.
     *
     * @example
     * bot.getUser(123456);
     */
    getUser(uid) {
        return store(this)._room.getUser(uid);
    }

    /**
     * Get all users in the community
     * @returns {User[]} An array of all users in the room
     *
     * @example
     * bot.getUsers();
     */
    getUsers() {
        return store(this)._room.getUsers();
    }

    /**
     * Get all DJs in waitList
     * @returns {User[]} An array of all users in waitList
     *
     * @example
     * bot.getWaitList();
     */
    getWaitList() {
        return store(this)._room.getWaitList();
    }

    /**
     * Get a user's position in waitList
     * @param {Number} [uid] User ID. Defaults to bot's ID
     * @returns {Number} Position in waitList.
     * If current DJ, it returns 0.
     * If not in waitList, it returns -1
     *
     * @example
     * bot.getWaitListPosition(123456);
     */
    getWaitListPosition(uid) {
        return store(this)._room.getWaitListPosition(uid);
    }

    /**
     * Implementation of plug.dj haveRoomPermission method
     * @param {undefined|Number} uid The User's id to check for permissions
     * @param {Number} permission Permission number
     * @param {Boolean} [isGlobal] Only check global permission
     * @returns {Boolean} True if user has permission specified, false if not
     *
     * @example
     *
     * // is user bouncer or above?
     * bot.havePermission(123456, PlugAPI.ROOM_ROLE.BOUNCER);
     *
     * // is user a BA or admin?
     * bot.havePermission(123456, PlugAPI.ROOM_ROLE.BOUNCER, true);
     */
    havePermission(uid, permission, isGlobal) {
        if ([1, 2, 3, 4, 5].indexOf(permission) > -1) {
            this.logger.warning('PlugAPI', `Please update havePermission with the new role ID for ${permission} or use the constants (Recommended)`);

            return false;
        }
        if (!store(this)._objectContainsValue(PlugAPI.ROOM_ROLE, permission) || (isGlobal && !store(this)._objectContainsValue(PlugAPI.GLOBAL_ROLES, permission))) return false;
        if (isGlobal) return store(this)._room.haveGlobalPermission(uid, permission);

        return store(this)._room.haveRoomPermission(uid, permission) || store(this)._room.haveGlobalPermission(uid, permission);
    }

    /**
     * Get time elapsed of current song
     * @returns {Number} Seconds elapsed, -1 if no song is currently playing
     *
     * @example
     * bot.getTimeElapsed();
     */
    getTimeElapsed() {
        if (!store(this)._room.getRoomMeta().slug || store(this)._room.getMedia() == null) {
            return -1;
        }

        return Math.min(store(this)._room.getMedia().duration, DateUtilities.getSecondsElapsed(store(this)._room.getStartTime()));
    }

    /**
     * Get time remaining of current song
     * @returns {Number} Seconds remaining, -1 if no song is currently playing
     *
     * @example
     * bot.getTimeRemaining();
     */
    getTimeRemaining() {
        if (!store(this)._room.getRoomMeta().slug || store(this)._room.getMedia() == null) {
            return -1;
        }

        return store(this)._room.getMedia().duration - this.getTimeElapsed();
    }

    /**
     * Get the command prefix
     * @returns {String} The command prefix being used
     *
     * @example
     * bot.getCommandPrefix();
     */
    getCommandPrefix() {
        return this.commandPrefix;
    }

    /**
     * Set the command prefix
     * @param {String} prefix The command prefix to use
     * @returns {Boolean} True if set. False if not
     *
     * @example
     * bot.setCommandPrefix('.');
     */
    setCommandPrefix(prefix) {
        if (!prefix || !Object.is(typeof prefix, 'string') || prefix.length < 1) {
            return false;
        }
        this.commandPrefix = prefix;

        return true;
    }

    /**
     * Get the url that http requests are being sent to
     * @returns {String} The url requests are being sent to
     *
     * @example
     * bot.getBaseURL();
     */
    getBaseURL() {
        return this.baseUrl;
    }

    /**
     * Set the url that http requests are being sent to
     * @param {String} url the url to send https requests to
     * @returns {Boolean} True if set. False if not
     *
     * @example
     * bot.setBaseURL('https://plug.dj');
     */
    setBaseURL(url) {
        if (!url || !Object.is(typeof url, 'string') || !url.startsWith('https') || url.indexOf('plug.dj') < 0) {
            return false;
        }
        this.baseUrl = url;

        return true;
    }

    /**
     * Get the url that webSocket events are being sent to
     * @returns {String} The url that webSocket events are being sent to
     * @example
     * bot.getSocketURL();
     */
    getSocketURL() {
        return this.socketUrl;
    }

    /**
     * Set the url that webSocket events are being sent to
     * @param {String} url the url that webSocket events are being sent to
     * @returns {Boolean} True if set. False if not
     *
     * @example
     * bot.setSocketURL('wss://godj.plug.dj');
     */
    setSocketURL(url) {
        if (!url || !Object.is(typeof url, 'string') || !url.startsWith('wss') || url.indexOf('plug.dj') < 0) {
            return false;
        }
        this.socketUrl = url;

        return true;
    }

    /**
     * Get the Logger settings
     * @returns {{fileOutput: boolean, filePath: string, consoleOutput: boolean}} An object of the settings be used for the logger.
     *
     * @example
     * bot.getLoggerSettings();
     */
    getLoggerSettings() {
        return this.logger.settings;
    }

    /**
     * Set the Logger object, must contain a info, warn, warning and error function
     * @param {Logger|Object} newLogger sets the logger options
     * @returns {Boolean} True if set. False if not.
     */
    setLogger(newLogger) {
        const requiredMethods = ['info', 'warn', 'warning', 'error', 'success'];

        if (newLogger && Object.is(typeof newLogger, 'object') && !Array.isArray(newLogger)) {
            for (let i = 0; i < requiredMethods.length; i++) {
                if (!Object.is(typeof newLogger[requiredMethods[i]], 'function')) {
                    return false;
                }
            }
            this.logger = newLogger;

            return true;
        }

        return false;
    }

    /**
     * Woot current song
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.woot();
     */
    woot(callback) {
        if (this.getMedia() == null || this.guest) return false;
        store(this)._queueREST('POST', 'votes', {
            direction: 1,
            historyID: store(this)._room.getHistoryID()
        }, callback);

        return true;
    }

    /**
     * Meh current song
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.meh();
     */
    meh(callback) {
        if (this.getMedia() == null || this.guest) return false;
        store(this)._queueREST('POST', 'votes', {
            direction: -1,
            historyID: store(this)._room.getHistoryID()
        }, callback);

        return true;
    }

    /**
     * Grab current song
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.grab();
     */
    grab(callback) {
        if (this.guest) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error("Can't use this in guest mode"), null);
            }

            return;
        }
        if (!store(this)._initialized || this.getMedia() == null) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('No media playing'), null);
            }

            return;
        }

        this.getActivePlaylist((currentPlaylist) => {
            if (currentPlaylist == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Playlist not found'), null);
                }

                return;
            }

            const callbackWrapper = (requestError, data) => {
                if (!requestError) {
                    currentPlaylist = store(this)._editPlaylistLength(currentPlaylist, true);
                }
                if (Object.is(typeof callback, 'function')) {
                    return callback(requestError, data);
                }
            };

            store(this)._queueREST('POST', 'grabs', {
                playlistID: currentPlaylist.id,
                historyID: store(this)._room.getHistoryID()
            }, callbackWrapper);
        });
    }

    /**
     * Activate a playlist
     * @param {Number} pid Playlist ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.activatePlaylist(123456);
     */
    activatePlaylist(pid, callback) {
        if (this.guest) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error("Can't use this in guest mode"), null);
            }

            return;
        }

        if (!store(this)._room.getRoomMeta().slug) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('Not in a room'), null);
            }

            return;
        }

        if (!pid) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('Missing playlist ID'), null);
            }

            return;
        }

        this.getPlaylist(pid, (playlist) => {
            if (playlist == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Playlist not found'), null);
                }
            }

            const callbackWrapper = (err, data) => {
                if (!err) {
                    this.getActivePlaylist((activePlaylist) => {
                        if (activePlaylist != null) {
                            activePlaylist.active = false;
                        }
                    });
                    playlist.active = true;
                }
                if (Object.is(typeof callback, 'function')) {
                    return callback(err, data);
                }
            };

            store(this)._queueREST('PUT', `${endpoints.PLAYLIST}/${pid}/activate`, undefined, callbackWrapper);
        });
    }

    /**
     * Add a song to a playlist
     * @param {Number} pid Playlist ID
     * @param {Object|Object[]} sdata Songs data
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     *
     * bot.addSongToPlaylist(123456, [{cid: '789abc', format: 1, image: 'https://i.ytimg.com/blah', duration: 300, title: 'My song', author: 'My song author'}])
     */
    addSongToPlaylist(pid, sdata, callback) {
        if (this.guest) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error("Can't use this in guest mode"), null);
            }

            return;
        }

        if (!store(this)._room.getRoomMeta().slug) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('Not in a room'), null);
            }

            return;
        }

        if (!pid) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('Missing playlist ID'), null);
            }

            return;
        }

        if (!sdata || (Array.isArray(sdata) && Object.is(sdata.length, 0))) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('Missing song data'), null);
            }

            return;
        }

        if (!Array.isArray(sdata)) {
            sdata = [sdata];
        }

        for (let i = 0; i < sdata.length; i++) {
            if (sdata[i].id == null) {

                // On plug.dj, this ID is always 0, so it is not important apparently
                sdata[i].id = 0;
            }
            if (Object.is(typeof sdata[i].cid, 'number')) {

                // Known to cause "Error 400 - Bad Gateway" when adding SoundClound songs if the cid is a Number and not a String
                sdata[i].cid = String(sdata[i].cid);
            }

            if (sdata[i].format == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Missing song format'), null);
                }

                return;
            }
            if (sdata[i].cid == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Missing song ID'), null);
                }

                return;
            }
            if (sdata[i].author == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Missing song author'), null);
                }

                return;
            }
            if (sdata[i].title == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Missing song title'), null);
                }

                return;
            }
            if (sdata[i].image == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Missing song image'), null);
                }

                return;
            }
            if (sdata[i].duration == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Missing song duration'), null);
                }

                return;
            }
        }

        this.getPlaylist(pid, (playlist) => {
            if (playlist == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Playlist not found'), null);
                }

                return;
            }

            const callbackWrapper = (err, data) => {
                if (!err) {
                    playlist = store(this)._editPlaylistLength(playlist, true);
                }
                if (Object.is(typeof callback, 'function')) {
                    return callback(err, data);
                }
            };

            store(this)._queueREST('POST', `${endpoints.PLAYLIST}/${pid}/media/insert`, {
                media: sdata,
                append: true
            }, callbackWrapper);
        });
    }

    /**
     * Removes a media from a playlist
     * @param {Number} pid Playlist ID
     * @param {Number|Number[]} mid Media ID(s)
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.removeSongFromPlaylist(1233456, 789abc);
     */
    removeSongFromPlaylist(pid, mid, callback) {
        if (this.guest) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error("Can't use this in guest mode"), null);
            }

            return;
        }

        if (!store(this)._room.getRoomMeta().slug) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('Not in a room'), null);
            }

            return;
        }

        if (!pid) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('Missing playlist ID'), null);
            }

            return;
        }

        if (!mid || (Array.isArray(mid) && Object.is(mid.length, 0))) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('Missing song ID'), null);
            }

            return;
        }

        this.getPlaylist(pid, (playlist) => {
            if (playlist == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Playlist not found'), null);
                }

                return;
            }

            const callbackWrapper = (err, data) => {
                if (!err) {
                    playlist = store(this)._editPlaylistLength(playlist, false);
                }
                if (Object.is(typeof callback, 'function')) {
                    return callback(err, data);
                }
            };

            if (!Array.isArray(mid)) {
                mid = [mid];
            }

            store(this)._queueREST('POST', `${endpoints.PLAYLIST}/${pid}/media/delete`, {
                ids: mid
            }, callbackWrapper);
        });
    }

    /**
     * Create a new playlist
     * @param {String} name Name of new playlist
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queue
     *
     * @example
     * bot.createPlaylist('Swag');
     */
    createPlaylist(name, callback) {
        if (!store(this)._room.getRoomMeta().slug || !Object.is(typeof name, 'string') || Object.is(name.length, 0) || this.guest) return false;

        const callbackWrapper = (err, data) => {
            if (!err) {
                store(this)._playlists.push(data[0]);
            }
            if (Object.is(typeof callback, 'function')) {
                return callback(err, data);
            }
        };

        store(this)._queueREST('POST', endpoints.PLAYLIST, {
            name
        }, callbackWrapper);

        return true;
    }

    /**
     * Delete a playlist
     * @param {Number} pid Playlist ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.deletePlaylist(123456);
     */
    deletePlaylist(pid, callback) {
        if (this.guest) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error("Can't use this in guest mode"), null);
            }

            return;
        }

        if (!store(this)._room.getRoomMeta().slug) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('Not in a room'), null);
            }

            return;
        }

        if (!pid) {
            if (Object.is(typeof callback, 'function')) {
                return callback(new Error('Missing playlist ID'), null);
            }

            return;
        }

        this.getPlaylist(pid, (playlist) => {
            if (playlist == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Playlist not found'), null);
                }
            }

            const callbackWrapper = (err, data) => {
                if (!err) {
                    const playlistsData = store(this)._playlists.get();

                    for (let i = 0; i < playlistsData.length; i++) {
                        if (Object.is(playlistsData[i].id, pid)) {
                            store(this)._playlists.removeAt(i);
                            break;
                        }
                    }
                }
                if (Object.is(typeof callback, 'function')) {
                    return callback(err, data);
                }
            };

            store(this)._queueREST('DELETE', `${endpoints.PLAYLIST}/${pid}`, undefined, callbackWrapper);
        });
    }

    /**
     * Get active playlist
     * @param {Function} [callback] Callback function
     *
     * @example bot.getActivePlaylist();
     */
    getActivePlaylist(callback) {
        if (this.guest) return;

        this.getPlaylists((playlistsData) => {
            for (let i = 0; i < playlistsData.length; i++) {
                if (playlistsData[i].active) {
                    if (Object.is(typeof callback, 'function')) {
                        callback(playlistsData[i]);
                    }

                    return playlistsData[i];
                }
            }

            if (Object.is(typeof callback, 'function')) {
                callback(null);

                return;
            }
        });
    }

    /**
     * Get playlist by ID
     * @param {Number} pid Playlist ID
     * @param {Function} [callback] Callback function
     *
     * @example
     * bot.getPlaylist(123456);
     */
    getPlaylist(pid, callback) {
        if (this.guest) return;

        this.getPlaylists((playlistsData) => {
            for (let i = 0; i < playlistsData.length; i++) {
                if (Object.is(playlistsData[i].id, pid)) {
                    if (Object.is(typeof callback, 'function')) {
                        callback(playlistsData[i]);
                    }

                    return playlistsData[i];
                }
            }

            if (Object.is(typeof callback, 'function')) {
                return callback(null);
            }
        });
    }

    /**
     * Get playlists
     * @param {Function} callback Callback function
     * @returns {Object} An object array of all playlists the user has
     *
     * @example
     *
     * const playlists = bot.getPlaylists();
     */
    getPlaylists(callback) {
        if (this.guest) return;

        return store(this)._playlists.get(callback);
    }

    /**
     * Get all medias in playlist
     * @param {Number} pid Playlist ID
     * @param {RESTCallback} callback Callback function
     *
     * const playlistMedias = bot.getPlaylistMedias(123456);
     */
    getPlaylistMedias(pid, callback) {
        if (this.guest) return;
        this.getPlaylist(pid, (playlist) => {
            if (playlist == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error(`Playlist id of ${pid} doesn't exist`), null);
                }

                return;
            }

            store(this)._queueREST('GET', `${endpoints.PLAYLIST}/${pid}/media`, undefined, callback);
        });
    }

    /**
     * Move a media in a playlist
     * @param {Number} pid Playlist ID
     * @param {Number|Number[]} ids Media ID(s)
     * @param {Number} beforeID Move them before this media ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     */
    playlistMoveMedia(pid, ids, beforeID, callback) {
        if (!store(this)._room.getRoomMeta().slug || !pid || !ids || (Array.isArray(ids) && Object.is(ids.length, 0)) || !beforeID || this.guest) return false;

        this.getPlaylist(pid, (playlist) => {
            if (playlist == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Playlist not found'), null);
                }

                return;
            }

            if (!Array.isArray(ids)) {
                ids = [ids];
            }

            store(this)._queueREST('PUT', `${endpoints.PLAYLIST}/${pid}/media/move`, {
                ids,
                beforeID
            }, callback);
        });
    }

    /**
     * Shuffle playlist
     * @param {Number} pid Playlist ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.shufflePlaylist(123456);
     */
    shufflePlaylist(pid, callback) {
        if (!store(this)._room.getRoomMeta().slug || !pid || this.guest) return false;

        this.getPlaylist(pid, (playlist) => {
            if (playlist == null) {
                if (Object.is(typeof callback, 'function')) {
                    return callback(new Error('Playlist not found'), null);
                }

                return;
            }

            store(this)._queueREST('PUT', `${endpoints.PLAYLIST}/${pid}/shuffle`, undefined, callback);

            return true;
        });
    }

    /**
     * Add a DJ to Waitlist/Booth
     * @param {Number} uid User ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     *
     * bot.moderateAddDJ(123456);
     */
    moderateAddDJ(uid, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || store(this)._room.isDJ(uid) || store(this)._room.isInWaitList(uid) || (store(this)._room.getBoothMeta().isLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) || this.guest) {
            return false;
        }

        store(this)._queueREST('POST', endpoints.MODERATE_ADD_DJ, {
            id: uid
        }, callback);

        return true;
    }

    /**
     * Ban a user from the community
     * @param {Number} userID User ID
     * @param {Number} [reason] Reason ID
     * @param {String} [duration] Duration of the ban
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * // Note for the reason / time you can either use bot. or PlugAPI.
     * bot.moderateBanUser(123456, bot.BAN_REASON.SPAMMING_TROLLING, bot.BAN.PERMA);
     */
    moderateBanUser(userID, reason, duration, callback) {
        if (!store(this)._room.getRoomMeta().slug || this.guest) return false;

        if (duration != null) {
            if (!store(this)._objectContainsValue(PlugAPI.BAN, duration)) return false;
        } else {
            duration = PlugAPI.BAN.PERMA;
        }

        if (reason != null) {
            if (!store(this)._objectContainsValue(PlugAPI.BAN_REASON, reason)) return false;
        } else {
            reason = PlugAPI.BAN_REASON.SPAMMING_TROLLING;
        }

        const user = this.getUser(userID);

        if (!Object.is(user, null) ? store(this)._room.getPermissions(user).canModBan : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) {
            if (Object.is(duration, PlugAPI.BAN.PERMA) && this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
                duration = PlugAPI.BAN.DAY;
            }

            store(this)._queueREST('POST', endpoints.MODERATE_BAN, {
                userID,
                reason,
                duration
            }, callback);

            return true;
        }

        return false;
    }

    /**
     * Delete a chat message
     * @param {String} cid Chat ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.moderateDeleteChat('123456-78910');
     */
    moderateDeleteChat(cid, callback) {
        if (!store(this)._room.getRoomMeta().slug || !Object.is(typeof cid, 'string') || this.guest) {
            return false;
        }

        const user = this.getUser(cid.split('-')[0]);

        if ((this.deleteAllChat && this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) || (!Object.is(user, null) ? store(this)._room.getPermissions(user).canModChat : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER))) {
            store(this)._queueREST('DELETE', endpoints.CHAT_DELETE + cid, undefined, callback, true);

            return true;
        }

        return false;
    }

    /**
     * Skip current media
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.moderateForceSkip();
     */
    moderateForceSkip(callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || Object.is(store(this)._room.getDJ(), null) || this.guest) {
            return false;
        }
        if (!store(this)._room.isDJ()) {
            store(this)._queueREST('POST', endpoints.MODERATE_SKIP, {
                userID: store(this)._room.getDJ().id,
                historyID: store(this)._room.getHistoryID()
            }, callback);
        } else {
            store(this)._queueREST('POST', endpoints.SKIP_ME, undefined, callback);
        }

        return true;
    }

    /**
     * Skip self
     *
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.selfSkip();
     */
    selfSkip(callback) {
        if (!store(this)._room.getRoomMeta().slug || Object.is(store(this)._room.getDJ(), null) || !store(this)._room.isDJ() || this.guest) {
            return false;
        }

        store(this)._queueREST('POST', endpoints.SKIP_ME, undefined, callback);

        return true;
    }

    /**
     * Move a DJ in the waitList
     * @param {Number} userID User ID
     * @param {Number} position New position in the waitList
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.moderateMoveDJ(123456, 1);
     */
    moderateMoveDJ(userID, position, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || !store(this)._room.isInWaitList(userID) || !isFinite(position) || this.guest) {
            return false;
        }

        position = position > 50 ? 49 : position < 1 ? 1 : --position;

        store(this)._queueREST('POST', endpoints.MODERATE_MOVE_DJ, {
            userID,
            position
        }, callback);

        return true;
    }

    /**
     * Mute user
     * @param {Number} userID User ID
     * @param {Number} [reason] Reason ID
     * @param {String} [duration] Duration ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * // Note for the reason / time you can either use bot. or PlugAPI.
     * bot.moderateMuteUser(123456, bot.MUTE._REASON.VIOLATING_COMMUNITY_RULES, bot.MUTE.LONG);
     */
    moderateMuteUser(userID, reason, duration, callback) {
        if (!store(this)._room.getRoomMeta().slug || this.guest) return false;

        if (duration != null) {
            if (!store(this)._objectContainsValue(PlugAPI.MUTE, duration)) return false;
        } else {
            duration = PlugAPI.MUTE.LONG;
        }

        if (reason != null) {
            if (!store(this)._objectContainsValue(PlugAPI.MUTE_REASON, reason)) return false;
        } else {
            reason = PlugAPI.MUTE_REASON.VIOLATING_COMMUNITY_RULES;
        }

        const user = this.getUser(userID);

        if (!Object.is(user, null) ? store(this)._room.getPermissions(user).canModMute : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) {
            store(this)._queueREST('POST', endpoints.MODERATE_MUTE, {
                userID,
                reason,
                duration
            }, callback);
        }

        return true;
    }

    /**
     * Remove a DJ from Waitlist/Booth
     * @param {Number} uid User ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.moderateRemoveDJ(123456);
     */
    moderateRemoveDJ(uid, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) || (!store(this)._room.isDJ(uid) && !store(this)._room.isInWaitList(uid)) || (store(this)._room.getBoothMeta().isLocked && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) || this.guest) {
            return false;
        }

        store(this)._queueREST('DELETE', endpoints.MODERATE_REMOVE_DJ + uid, undefined, callback);

        return true;
    }

    /**
     * Set the role of a user
     * @param {Number} userID User ID
     * @param {Number} roleID The new role
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * // Note for the role you can either use bot. or PlugAPI.
     * bot.moderateSetRole(123456, bot.ROOM_ROLE.BOUNCER);
     */
    moderateSetRole(userID, roleID, callback) {
        if (!store(this)._room.getRoomMeta().slug || !isFinite(roleID) || roleID < PlugAPI.ROOM_ROLE.NONE || roleID > PlugAPI.ROOM_ROLE.HOST || this.guest) {
            return false;
        }

        const user = this.getUser(userID);

        if (Object.is(user, null) ? this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) : store(this)._room.getPermissions(user).canModStaff) {
            if (user && Object.is(user.role, roleID)) return false;
            if (Object.is(roleID, PlugAPI.ROOM_ROLE.NONE)) {
                store(this)._queueREST('DELETE', endpoints.MODERATE_STAFF + userID, undefined, callback);
            } else {
                store(this)._queueREST('POST', endpoints.MODERATE_PERMISSIONS, {
                    userID,
                    roleID
                }, callback);
            }
        }

        return true;
    }

    /**
     * Ban a user from the WaitList
     * @param {Number} userID User ID
     * @param {Number} [reason] Reason ID
     * @param {String} [duration] Duration of the ban
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * // Note for the reason / time you can either use bot. or PlugAPI.
     * bot.moderateWaitListBan(123456, bot.BAN_REASON.SPAMMING_TROLLING, bot.BAN.PERMA);
     */
    moderateWaitListBan(userID, reason, duration, callback) {
        if (!store(this)._room.getRoomMeta().slug || this.guest) return false;

        if (duration != null) {
            if (!store(this)._objectContainsValue(PlugAPI.WLBAN, duration)) return false;
        } else {
            duration = PlugAPI.WLBAN.PERMA;
        }

        if (reason != null) {
            if (!store(this)._objectContainsValue(PlugAPI.WLBAN_REASON, reason)) return false;
        } else {
            reason = PlugAPI.WLBAN_REASON.SPAMMING_TROLLING;
        }

        const user = this.getUser(userID);

        if (!Object.is(user, null) ? store(this)._room.getPermissions(user).canModBan : this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER)) {
            if (Object.is(duration, PlugAPI.BAN.PERMA) && this.havePermission(undefined, PlugAPI.ROOM_ROLE.BOUNCER) && !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER)) {
                duration = PlugAPI.WLBAN.DAY;
            }

            store(this)._queueREST('POST', endpoints.MODERATE_WLBAN, {
                userID,
                reason,
                duration
            }, callback);

            return true;
        }

        return false;
    }

    /**
     * Unban a user
     * @param {Number} uid User ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.moderateUnbanUser(123456);
     */
    moderateUnbanUser(uid, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || this.guest) {
            return false;
        }

        store(this)._queueREST('DELETE', endpoints.MODERATE_UNBAN + uid, undefined, callback);

        return true;
    }

    /**
     * Unban a user from the WaitList
     * @param {Number} uid User ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.moderateWaitListUnban(123456);
     */
    moderateWaitListUnbanUser(uid, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || this.guest) {
            return false;
        }

        store(this)._queueREST('DELETE', endpoints.MODERATE_WLBAN + uid, undefined, callback);

        return true;
    }

    /**
     * Unmute a user
     * @param {Number} uid User ID
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     * @example
     *
     * bot.moderateUnmuteUser(123456);
     */
    moderateUnmuteUser(uid, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || this.guest) {
            return false;
        }

        store(this)._queueREST('DELETE', endpoints.MODERATE_UNMUTE + uid, undefined, callback);

        return true;
    }

    /**
     * Change the name of the community
     * @param {String} name New community name
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.changeRoomName('Yolo Swag');
     */
    changeRoomName(name, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.COHOST) || Object.is(store(this)._room.getRoomMeta().name, name) || this.guest) {
            return false;
        }

        store(this)._queueREST('POST', endpoints.ROOM_INFO, {
            name,
            description: undefined,
            minChatLevel: undefined,
            welcome: undefined
        }, callback);

        return true;
    }

    /**
     * Change the chat level of the community
     * @param {Number} minChatLevel The chat level to set to
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.changeRoomChatLevel(3);
     */
    changeRoomChatLevel(minChatLevel, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || Object.is(store(this)._room.getRoomMeta().minChatLevel, minChatLevel) || (!isFinite(minChatLevel) || (isFinite(minChatLevel) && (minChatLevel < 1 || minChatLevel > 3))) || this.guest) return false;

        store(this)._queueREST('POST', endpoints.ROOM_INFO, {
            name: undefined,
            description: undefined,
            minChatLevel,
            welcome: undefined
        }, callback);

        return true;
    }

    /**
     * Change the description of the community
     * @param {String} description New community description
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.changeRoomDescription('My room is better than yours. #420');
     */
    changeRoomDescription(description, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.COHOST) || Object.is(store(this)._room.getRoomMeta().description, description) || this.guest) {
            return false;
        }

        store(this)._queueREST('POST', endpoints.ROOM_INFO, {
            name: undefined,
            description,
            minChatLevel: undefined,
            welcome: undefined
        }, callback);

        return true;
    }

    /**
     * Change the welcome message of the community
     * @param {String} welcome New community welcome
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * // Both %u and %r are automatically replaced by plug to the welcomed user's username and the room's name.
     * bot.changeRoomWelcome('Welcome %u to %r');
     */
    changeRoomWelcome(welcome, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.COHOST) || Object.is(store(this)._room.getRoomMeta().welcome, welcome) || this.guest) {
            return false;
        }

        store(this)._queueREST('POST', endpoints.ROOM_INFO, {
            name: undefined,
            description: undefined,
            minChatLevel: undefined,
            welcome
        }, callback);

        return true;
    }

    /**
     * Change the DJ cycle of the community
     * @param {Boolean} enabled True if DJ Cycle should be enabled, false if not.
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * bot.changeDJCycle(false);
     */
    changeDJCycle(enabled, callback) {
        if (!store(this)._room.getRoomMeta().slug || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || Object.is(store(this)._room.getBoothMeta().shouldCycle, enabled) || this.guest) {
            return false;
        }

        store(this)._queueREST('PUT', endpoints.ROOM_CYCLE_BOOTH, {
            shouldCycle: enabled
        }, callback);

        return true;
    }

    /**
     * Get the current cookie jar being used for API requests
     *
     * @param {Function} [callback] optional callback for async.
     * @returns {Function|CookieJar} Returns a callback function or the cookie jar being used for API Requests
     */
    getJar(callback) {
        if (this.jar) {
            if (Object.is(typeof callback, 'function')) {
                return callback(this.jar);
            }

            return this.jar;
        }
    }

    /**
     * Lock/Clear the waitList/booth
     * @param {Boolean} locked Lock the waitList/booth
     * @param {Boolean} clear Clear the waitList
     * @param {RESTCallback} [callback] Callback function
     * @returns {Boolean} If the REST request got queued
     *
     * @example
     * // PlugAPI has an alias function moderateLockWaitList. Both work the same
     * // To lock and not clear
     * bot.moderateLockBooth(true, false);
     *
     * // To lock and clear
     * bot.moderateLockBooth(true, true);
     *
     * // to unlock
     * bot.moderateLockBooth(false, false);
     */
    moderateLockBooth(locked, clear, callback) {
        if (!store(this)._room.getRoomMeta().slug || Object.is(this.getSelf(), null) || !this.havePermission(undefined, PlugAPI.ROOM_ROLE.MANAGER) || (Object.is(locked, store(this)._room.getBoothMeta().isLocked) && !clear) || this.guest) {
            return false;
        }
        store(this)._queueREST('PUT', endpoints.ROOM_LOCK_BOOTH, {
            isLocked: locked,
            removeAllDJs: clear
        }, callback);

        return true;
    }

    /**
     * @prop {Object} ROOM_ROLE Room ranks
     * @prop {Number} ROOM_ROLE.NONE Room role of 0. User has no role.
     * @prop {Number} ROOM_ROLE.RESIDENTDJ Room role of 1000. User is a resident DJ.
     * @prop {Number} ROOM_ROLE.BOUNCER Room role of 2000. User is a bouncer.
     * @prop {Number} ROOM_ROLE.MANAGER Room role of 3000. User is a manager.
     * @prop {Number} ROOM_ROLE.COHOST Room role of 4000. User is a cohost.
     * @prop {Number} ROOM_ROLE.HOST Room role of 5000. User is a host.
     * @static
     */
    static get ROOM_ROLE() {
        return constants.ROOM_ROLE;
    }

    /**
     * @prop {Object} GLOBAL_ROLES Global Ranks
     * @prop {Number} GLOBAL_ROLES.NONE Global role of 0. No global role set.
     * @prop {Number} GLOBAL_ROLES.PROMOTER. Global role of 500. Promoters. Upcoming addition from plug.
     * @prop {Number} GLOBAL_ROLES.PLOT Global role of 750. PLOT members. Upcoming addition from plug.
     * @prop {Number} GLOBAL_ROLES.VOLUNTEER Global role of 2000. Currently none are set as this.
     * @prop {Number} GLOBAL_ROLES.MODERATOR Global role of 25000. Site Moderators. Upcoming addition from plug.
     * @prop {Number} GLOBAL_ROLES.AMBASSADOR Global role of 3000. Brand Ambassador role.
     * @prop {Number} GLOBAL_ROLES.LEADER Global role of 4000. Currently none are set as this.
     * @prop {Number} GLOBAL_ROLES.ADMIN Global role of 5000. Admin global role.
     * @static
     */
    static get GLOBAL_ROLES() {
        return constants.GLOBAL_ROLES;
    }

    /**
     * @prop {Object} STATUS Statuses
     * @prop {Number} STATUS.OFFLINE Status of 0. User is offline.
     * @prop {Number} STATUS.ONLINE Status of 1. User is online.
     * @static
     */
    static get STATUS() {
        return constants.STATUS;
    }

    /**
     * @prop {Object} BAN Ban lengths
     * @prop {String} BAN.HOUR Bans user for an hour
     * @prop {String} BAN.DAY Bans user for a day
     * @prop {String} BAN.PERMA Bans user permanently
     * @static
     */
    static get BAN() {
        return constants.BAN;
    }

    /**
     * @prop {Object} BAN_REASON Ban Reasons
     * @prop {Number} BAN_REASON.SPAMMING_TROLLING Reason 1. Reason is "Spamming or Trolling".
     * @prop {Number} BAN_REASON.VERBAL_ABUSE Reason 2. Reason is "Verbal abuse or offensive language".
     * @prop {Number} BAN_REASON.OFFENSIVE_MEDIA Reason 3. Reason is "Playing offensive videos/songs".
     * @prop {Number} BAN_REASON.INAPPROPRIATE_GENRE Reason 4. Reason is "Repeatedly playing inappropriate genre(s)".
     * @prop {Number} BAN_REASON.NEGATAIVE_ATTITUDE Reason 5. Reason is "Negative Attitude".
     * @static
     */
    static get BAN_REASON() {
        return constants.BAN_REASON;
    }

    /**
     * @prop {Object} MUTE Mute Lengths
     * @prop {String} MUTE.SHORT Mutes user for 15 minutes
     * @prop {String} MUTE.MEDIUM Mutes user for 30 minutes
     * @prop {String} MUTE.LONG Mutes user for 45 minutes
     * @static
     */
    static get MUTE() {
        return constants.MUTE;
    }

    /**
     * @prop {Object} MUTE_REASON Mute Reasons
     * @prop {Number} MUTE_REASON.VIOLATING_COMMUNITY_RULES Reason 1. Reason is "Violating community rules".
     * @prop {Number} MUTE_REASON.VERBAL_ABUSE Reason 2. Reason is "Verbal abuse or harassment".
     * @prop {Number} MUTE_REASON.SPAMMING_TROLLING Reason 3. Reason is "Spamming or trolling".
     * @prop {Number} MUTE_REASON.OFFENSIVE_LANGUAGE Reason 4. Reason is "Offensive Language".
     * @prop {Number} MUTE_REASON.NEGATIVE_ATTITUDE Reason 5. Reason is "Negative attitude"
     * @static
     */
    static get MUTE_REASON() {
        return constants.MUTE_REASON;
    }

    /**
     * @prop {Object} WLBAN WaitList Ban Lengths
     * @prop {String} WLBAN.SHORT Bans user from WaitList for 15 minutes
     * @prop {String} WLBAN.MEDIUM Bans user from WaitList for 30 minutes
     * @prop {String} WLBAN.LONG Bans user from WaitList for 45 minutes
     * @prop {String} WLBAN.PERMA Bans user from WaitList permanently
     * @static
     */
    static get WLBAN() {
        return constants.WLBAN;
    }

    /**
     * @prop {Object} WLBAN_REASON WaitList Ban Reasons
     * @prop {Number} WLBAN_REASON.SPAMMING_TROLLING Reason 1. Reason is "Spamming or Trolling".
     * @prop {Number} WLBAN_REASON.VERBAL_ABUSE Reason 2. Reason is "Verbal abuse or offensive language".
     * @prop {Number} WLBAN_REASON.OFFENSIVE_MEDIA Reason 3. Reason is "Playing offensive videos/songs".
     * @prop {Number} WLBAN_REASON.INAPPROPRIATE_GENRE Reason 4. Reason is "Repeatedly playing inappropriate genre(s)".
     * @prop {Number} WLBAN_REASON.NEGATAIVE_ATTITUDE Reason 5. Reason is "Negative Attitude".
     * @static
     */
    static get WLBAN_REASON() {
        return constants.WLBAN_REASON;
    }

    static get events() {
        return require('./events.json');
    }
}

PlugAPI.CreateLogger = util.deprecate(() => { }, 'PlugAPI.CreateLogger is now a noop function and will be removed in V6. Use PlugAPI.logger instead and refer to https://github.com/JethroLogger/Jethro/tree/v2/docs/v2/ for documentation.');
PlugAPI.Utils = PlugAPI.prototype.Utils = utils;
PlugAPI.prototype.ROOM_ROLE = PlugAPI.ROOM_ROLE;
PlugAPI.prototype.GLOBAL_ROLES = PlugAPI.GLOBAL_ROLES;
PlugAPI.prototype.STATUS = PlugAPI.STATUS;
PlugAPI.prototype.BAN = PlugAPI.BAN;
PlugAPI.prototype.BAN_REASON = PlugAPI.BAN_REASON;
PlugAPI.prototype.MUTE = PlugAPI.MUTE;
PlugAPI.prototype.MUTE_REASON = PlugAPI.MUTE_REASON;
PlugAPI.prototype.WLBAN = PlugAPI.WLBAN;
PlugAPI.prototype.WLBAN_REASON = PlugAPI.WLBAN_REASON;
PlugAPI.prototype.events = PlugAPI.events;
PlugAPI.prototype.moderateLockWaitList = PlugAPI.prototype.moderateLockBooth;

/**
* This is emitted when the bot is banned.
* @event BAN
* @memberof PlugAPI
*/
/**
 * This is emitted when a bouncer or above skips a song
 *
 * @event MODERATE_SKIP
 * @memberof PlugAPI
 *
 * @prop {Object} data.raw The raw data object from plug.dj.
 * @prop {User} data.user The user that skipped the song.
 *
 * @example
 *
 * bot.on(PlugAPI.events.MODERATE_SKIP, (data) => {
 *    console.log(`${data.user.username} Skipped the song`);
 * })
 */
/**
* This is emitted when a chat message has been received.
*
* @event CHAT
* @memberof PlugAPI
*
* @prop {Object} data The chat data Object
* @prop {String} data.id The chat id of the message.
* @prop {String} data.message The chat message.
* @prop {User} data.from The user object of the message sender
* @prop {Object} data.raw The raw data object from plug.dj. Not changed by PlugAPI
* @prop {Array<Object>} data.mentions An array of mentioned users.
* @prop {Boolean} data.muted If the user is muted.
* @prop {String} data.type The message type (mention, emote, messaage)
*
* @example
* bot.on(PlugAPI.events.CHAT, function(data) {
*   console.log(`[${data.id}] [${data.from.username}] ${data.message}`);
*  });
*/
/**
* This is emitted when a chat message starting with the {@link PlugAPI#commandPrefix} is received.
*
* @event CHAT_COMMAND
* @memberof PlugAPI
*/
/**
* This is emitted when a chat message has been deleted.
*
* @event CHAT_DELETE
* @memberof PlugAPI
*
* @prop {String} data.c The chat ID of the message that got deleted.
* @prop {Number} data.mi The user ID of the moderator that deleted the message.
*
* @example
* bot.on(PlugAPI.events.CHAT_DELETE, (data) => {
*   const user = bot.getUser(mi);
*
*    console.log(`${user.username} deleted message: ${data.c}`);
* });
*/
/**
* This is emitted when a chat message starting with /em or /me has been received.
*
* @event CHAT_EMOTE
* @memberof PlugAPI
*/
/**
* This is emitted when the chat level has been updated.
*
* @event CHAT_LEVEL_UPDATE
* @memberof PlugAPI
*
* @prop {Object} data.raw The raw data object from plug.dj.
* @prop {User} data.user The user that changed the chat level.
* @prop {Number} data.level The updated chat level.
*
* @example
* bot.on(PlugAPI.events.CHAT_LEVEL_UPDATE, (data) => {
*    console.log(`${data.user.username} updated the chat level to ${data.level}`);
* });
*/
/**
* This is emitted when a chat message starting with the {@link PlugAPI#commandPrefix} is received
*
* @event COMMAND
* @memberof PlugAPI
* @prop {Object} data The chat data Object
* @prop {String} data.id The chat id of the message.
* @prop {String} data.command The command message.
* @prop {String} data.message The chat message.
* @prop {Array<Object>|Array<String>} data.args An array of strings / user objects after the command.
* @prop {User} data.from The user object of the message sender
* @prop {Object} data.raw The raw data object from plug.dj. Not changed by PlugAPI
* @prop {Array<Object>} data.mentions An array of mentioned users.
* @prop {Boolean} data.muted If the user is muted.
* @prop {String} data.type The message type (mention, emote, messaage)
* @prop {Function} data.isFrom Checks if the message sender is from the inputted array of IDs or ID
* @prop {Function} data.respond Sends a message specified and mentions the command user.
* @prop {Function} data.respondTime Same as data.respond, except it has an additional parameter to delete the message after specified amount of time in seconds.
* @prop {Function} data.havePermission Checks if command user has specified permission or above.
*
* @example
*
* bot.on('command:ping', (data) => {
*    data.respond('Pong!');
* });
*
* bot.on('command:add', (data) => {
*    // check for bouncer or above permissions.
*    if (data.havePermission(PlugAPI.ROOM_ROLE.BOUNCER)) {
*       // check if a user was mentioned and is not in waitList
*       if (data.args[0] && data.args[0].id && (Object.is(bot.getWaitListPosition(data.args[0].id, -1)) || (bot.getDJ() && bot.getDJ().id && !Object.is(bot.getDJ().id, data.args[0].id)))) {
*       bot.moderateAddDJ(data.args[0].id, () => {
*          data.respond(`Added ${data.args[0].username} to waitList`);
*       });
*       }
*    }
* });
*
* bot.on('command:skip', (data) => {
*    if (data.havePermission(PlugAPI.ROOM_ROLE.BOUNCER)) {
*       bot.moderateForceSkip(()=> {
*          data.respond('Song Skipped.');
*       });
*    }
* });
*/
/**
* This is emitted when the dj cycle is enabled or disabled
*
* @event DJ_LIST_CYCLE
* @memberof PlugAPI
*
* @prop {Object} data.raw The raw data object from plug.dj.
* @prop {User} data.user The user that enabled or disabled dj cycle.
* @prop {Boolean} data.cycle True if cycle enabled, false otherwise.
*
* @example
* bot.on(PlugAPI.events.DJ_LIST_CYCLE, (data) => {
*    console.log(`${data.user.username} ${data.cycle? 'Enabled' : 'Disabled'} the DJ Cycle `);
* });
*/
/**
 * This is emitted when the dj waitList has been locked, cleared, or unlocked.
 *
 * @event DJ_LIST_LOCKED
 * @memberof PlugAPI
 *
 * @prop {Object} data.raw The raw data object from plug.dj
 * @prop {User} data.user The user that locked, unlocked, or cleared the waitList.
 * @prop {Boolean} data.clear True if waitList was cleared. False if not.
 * @prop {Boolean} data.locked True if waitList was locked. False if not.
 *
 * @example
 * bot.on(PlugAPI.events.DJ_LIST_LOCKED, (data) => {
 *   console.log(`${data.user.username} ${data.locked ? 'Locked' : 'Unlocked'} the waitList and ${data.clear ? 'Did' : "didn't"} clear the waitList`);
 * });
 */
/**
* This is emitted when the waitList has changed.
*
* @event DJ_LIST_UPDATE
* @memberof PlugAPI
*/
/**
* This is emitted when the bot earns XP or Plug Points
*
* @event EARN
* @memberof PlugAPI
*
* @prop {Number} data.pp The updated amount of Plug Points.
* @prop {Number} data.xp the updated amount of XP.
* @prop {Number} data.level Bot's current level.
*
* @example
* bot.on(PlugAPI.events.EARN, (data) => {
*    console.log(`You are currently level ${data.level} with: ${data.pp} PP and ${data.xp} XP `);
* });
*/
/**
* This is emitted when someone gifts the bot Plug Points.
*
* @event GIFTED
* @memberof PlugAPI
*/
/**
* This is emitted when someone grabs a song.
*
* @event GRAB
* @memberof PlugAPI
*
* @prop {Object} data.raw The raw data object from plug.dj
* @prop {User} data.user The user that grabbed the song.
*
* @example
* bot.on(PlugAPI.events.GRAB, (data) => {*
*   console.log(`${data.user.username} grabbed the currently playing song`)
* });
*/
/**
* This is emitted when the bot connects to plug more than once.
*
* @event KILL_SESSION
* @memberof PlugAPI
*/
/**
 * This is emitted when a user votes on the song (Undecided, Meh, Woot)
 *
 * @event VOTE
 * @memberof PlugAPI
 *
 * @prop {Object} data.raw The raw data object from plug.dj
 * @prop {Number} data.vote 1 for Woot, -1 for meh, 0 for undecided
 * @prop {User} data.user the user that voted.
 *
 * @example
 * bot.on(PlugAPI.events.VOTE, (data) => { *
 *    if (Object.is(data.vote, 1)) {
 *         console.log(`${data.user.username} Wooted`);
 *    } else if (Object.is(data.vote, -1)) {
 *         console.log(`${data.user.username} Mehed`);
 *    } else if (Object.is(data.vote, 0)) {
 *         console.log(`${data.user.username} hasn't voted`);
 *    }
 * })
 */
/**
* This is emitted when the song has changed to another one.
*
* @event ADVANCE
* @memberof PlugAPI
*
* @prop {Object} data The advance event object
* @prop {User} data.currentDJ The current DJ that is playing.
* @prop {String} data.media.title The title of the last played song.
* @prop {String} data.media.author The author of the last played song.
* @prop {string} data.media.format 1 if the last played song was Youtube, 2 if SoundCloud.
* @prop {String} data.media.image A thumbnail image of the song.
* @prop {String} data.media.cid The media ID of the last played song.
* @prop {Number} data.media.duration  How long the last played song was.
* @prop {User} data.lastPlay.dj The last DJ that played a song.
* @prop {String} data.lastPlay.media.title The title of the last played song.
* @prop {String} data.lastPlay.media.author The author of the last played song.
* @prop {string} data.lastPlay.media.format 1 if the last played song was Youtube, 2 if SoundCloud.
* @prop {String} data.lastPlay.media.image A thumbnail image of the song.
* @prop {String} data.lastPlay.media.cid The media ID of the last played song.
* @prop {Number} data.lastPlay.media.duration  How long the last played song was.
* @prop {Number} data.lastPlay.score.grabs The number of grabs the last played song received.
* @prop {Number} data.lastPlay.score.listeners The number of users listening to the last played song.
* @prop {Number} data.lastPlay.score.negative The number of mehs the last played song received.
* @prop {Number} data.lastPlay.score.positive The number of woots the last played song received.
* @prop {Number} data.playlistID The bot's current active playlist as an ID
* @prop {String} data.startTime When the song started playing.
* @prop {String} data.historyID the song's ID in history
*
* @example
* bot.on(PlugAPI.events.ADVANCE, (data) => {
* });
*/
/**
 * This is emitted when the room welcome message has changed.
 *
 * @event ROOM_WELCOME_UPDATE
 * @memberof PlugAPI
 *
 * @prop {Object} data.raw The raw data object from plug.dj
 * @prop {User} data.user The user that updated the welcome message.
 * @prop {String} data.welcome The new welcome message.
 *
 * @example
 * bot.on(PlugAPI.events.ROOM_WELCOME_UPDATE, (data) => {
 *    console.log(`${data.user.username} changed the room welcome message to ${data.welcome}`);
 * });
 */
/**
 * This is emitted when a user is muted
 *
 * @event MODERATE_MUTE
 * @memberof PlugAPI
 *
 * @prop {Object} data.raw The raw data object from plug.dj.
 * @prop {String} data.user The username of the user that was muted.
 * @prop {User} data.moderator The moderator that muted the user.
 * @prop {String} data.duration How long the user was muted for (Short, Medium, Long)
 *
 * @example
 * bot.on(PlugAPI.events.MODERATE_MUTE, (data) => {
 *    console.log(`${data.moderator.username} has ${!Object.is(data.duration, 'Unmuted') ? `muted ${data.user} - ${data.duration}` : `unmuted ${data.user}`}`);
 * });
 */
/**
 * This is emitted when a user is banned
 *
 * @event MODERATE_BAN
 * @memberof PlugAPI
 *
 * @prop {Object} data.raw The raw data object from plug.dj.
 * @prop {String} data.user The username of the user that was banned.
 * @prop {User} data.moderator The moderator that banned the user.
 * @prop {String} data.duration How long the user was banned for (Hour, Day, Forever)
 *
 * @example
 * bot.on(PlugAPI.events.MODERATE_BAN, (data) => {
 *    console.log(`${data.moderator.username} banned ${data.user} ${data.duration}`);
 * });
 */
/**
 * This event is emitted when staff roles are changed.
 *
 * @event MODERATE_STAFF
 * @memberof PlugAPI
 *
 * @prop {Object} data.raw The raw object data from plug.dj
 * @prop {User} data.moderator The moderator that changed staff roles.
 * @prop {Array<User>} data.users an array of users that have had their roles changed. Object is in the format of {role: newRole, user: User Object}
 *
 * @example
 *
 * bot.on(PlugAPI.events.MODERATE_STAFF, (data) => {
 *    if (data.users.length > 0) {
 *      console.log(`${data.moderator.username} has changed ${data.users.map((item) => {
 *          if (item.user != null) {
 *              return `${item.user.username} to ${item.role}`;
 *          }
 *      })}`);
 *    }
 * });
 */
/**
 * This is emitted when the room name has changed.
 *
 * @event ROOM_NAME_UPDATE
 * @memberof PlugAPI
 *
 * @prop {Object} data.raw The raw data object from plug.dj
 * @prop {User} data.user The user that updated the room name.
 * @prop {String} data.name The new room name.
 *
 * @example
 * bot.on(PlugAPI.events.ROOM_NAME_UPDATE, (data) => {
 *    console.log(`${data.user.username} changed the room name to ${data.name}`);
 * });
 */
/**
 * This is emitted when a user is banned from waitList.
 *
 * @event MODERATE_WLBAN
 * @memberof PlugAPI
 *
 * @prop {Object} data.raw The raw data object from plug.dj.
 * @prop {String} data.user The username of the user that was banned from waitList.
 * @prop {User} data.moderator The moderator that banned the user from waitList.
 * @prop {String} data.duration How long the user was banned from waitList for (Short, Medium, Long, Forever)
 *
 * @example
 * bot.on(PlugAPI.events.MODERATE_WLBAN, (data) => {
 *    console.log(`${data.moderator.username} banned ${data.user} from the waitList ${data.duration}`);
 * });
 */

module.exports = PlugAPI;
