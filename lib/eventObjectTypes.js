/*
* This file contains functions for converting plug.dj socket objects to plugAPI objects (easier to read and extend).
* When adding new functions, be sure to call it the event type name and then change the messageHandler to use the new object.
*/

'use strict';

const he = require('he');

module.exports = {

    /**
     * @param {Object} data The raw socket data of the advance event.
     * @param {Object} data.m The media data
     * @param {String} data.t The time the media started
     * @param {Array<Object>} data.d The current djs in waitList
     * @param {Number} data.c The current user DJing
     * @param {Number} data.p Playlist ID that is currently active
     * @returns {{media: Object, startTime: String, historyID: Number, djs: Array, currentDJ: Number, playlistID: Number}} A humanized form of the advance event sent in from plug.dj.
     * @private
     */
    advance(data) {
        return {
            media: data.m,
            startTime: data.t,
            historyID: data.h,
            djs: data.d,
            currentDJ: data.c,
            playlistID: data.p
        };
    },

    /**
     * @param {Object} data The raw socket data of the chat event sent in from plug.dj
     * @param {String} data.message  The chat message
     * @param {String} data.un The user's username that sent the message
     * @param {Number} data.uid The user's ID that that sent the message
     * @param {String} data.cid The message's unique ID.
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, id: (playback.media.cid|*), from: (User|null), message: String, mentions: User[], muted: Boolean}} A humanized form of the chat object sent in from plug.dj
     * @private
     */
    chat(data, room) {
        return {
            raw: data,
            id: data.cid,
            from: room.getUser(data.uid),
            message: he.decode(data.message),
            mentions: [],
            muted: room.isMuted(data.uid),
            type: (function() {
                if (data.message.startsWith('/me') || data.message.startsWith('/em')) {
                    return 'emote';
                }
                if (data.message.indexOf(`@${room.getSelf().username}`) > -1) {
                    return 'mention';
                }

                return 'message';
            })()
        };
    },

    /**
     * @param {{m: String, mi: Number, f: Boolean}} data The raw socket data of the DJ Cycle event sent in from plug.dj
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, user: Object, cycle: Boolean}} A humanized form of the DJ Cycle event sent in from plug.dj
     * @private
     */
    djListCycle(data, room) {
        return {
            raw: data,
            user: room.getUser(data.mi),
            cycle: data.f
        };
    },

    /**
     * @param {{m: String, mi: Number, c: Boolean, f: Boolean}} data The raw socket data of the DJ List Locked event sent in from plug.dj
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, user: Object, clear: Boolean, locked: Boolean}} A humanized form of the DJ List Locked event sent in from plug.dj
     * @private
     */
    djListLocked(data, room) {
        return {
            raw: data,
            user: room.getUser(data.mi),
            clear: data.c,
            locked: data.f
        };
    },

    /**
     * @param {Number} data the id of the user that grabbed the song
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, user: Object}} A humanized form of the grab event sent infrom plug.dj
     * @private
     */
    grab(data, room) {
        return {
            raw: data,
            user: room.getUser(data)
        };
    },

    /**
     * @param {{m: String, mi: Number, t: Number, d: String}} data The raw socket data of the modBan event
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, duration: String, moderator: Object, user: Object}} A humanized form of the modBan event sent in from plug.dj
     * @private
     */
    modBan(data, room) {
        return {
            raw: data,
            duration: Object.is(data.d, 'f') ? 'Forever' : Object.is(data.d, 'd') ? 'Day' : Object.is(data.d, 'h') ? 'Hour' : null,
            moderator: room.getUser(data.mi),
            user: data.t
        };
    },

    /**
     * @param {{m: String, mi: Number, i: Number, d: String, r: Number}} data The raw socket data of the modMute event
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, duration: String, reason: Number, moderator: Object, user: Object}} A humanized form of the modMute event sent in from plug.dj
     * @private
     */
    modMute(data, room) {
        return {
            raw: data,
            duration: Object.is(data.d, 's') ? 'Short' : Object.is(data.d, 'm') ? 'Medium' : Object.is(data.d, 'l') ? 'Long' : Object.is(data.d, 'o') ? 'Unmuted' : null,
            moderator: room.getUser(data.mi),
            reason: data.r,
            user: room.getUser(data.i)
        };
    },

    /**
     * @param {{mi: Number, m: String}} data The raw socket data of the modSkip event.
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, user: Object}} A humanized form of the modSkip event sent in from plug.dj
     * @private
     */
    modSkip(data, room) {
        return {
            raw: data,
            user: room.getUser(data.mi)
        };
    },

    /**
     * @param {{mi: Number, m: String, u: Array<Object>}} data The raw socket data of the modStaff event.
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, moderator: Object, users: Array<Object>}} A humanized form of the modStaff event sent in from plug.dj
     * @private
     */
    modStaff(data, room) {
        return {
            raw: data,
            moderator: room.getUser(data.mi),
            users: data.u.map((user) => {
                return {
                    role: user.p,
                    user: room.getUser(user.i)
                };
            })
        };
    },

    /**
     * @param {{m: String, mi: Number, i: Number, d: String, t: String, ti: Number}} data The raw socket data of the modMute event
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, duration: String, reason: Number, moderator: Object, user: Object}} A humanized form of the modWaitListBanevent sent in from plug.dj
     * @private
     */
    modWaitlistBan(data, room) {
        return {
            raw: data,
            duration: Object.is(data.d, 's') ? 'Short' : Object.is(data.d, 'm') ? 'Medium' : Object.is(data.d, 'l') ? 'Long' : Object.is(data.d, 'f') ? 'Forever' : Object.is(data.d, 'o') ? 'Unbanned' : null,
            moderator: room.getUser(data.mi),
            user: room.getUser(data.ti)
        };
    },

    /**
     * @param {{i: Number, v: Number}} data the raw socket data of the Vote event.
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, user: Object, vote: Number}} A humanized form of the vote event sent in from plug.dj
     * @private
     */
    vote(data, room) {
        return {
            raw: data,
            user: room.getUser(data.i),
            vote: data.v
        };
    },

    /**
     * @param {{m: Number, u: Number}} data The raw socket data of the Chat Level Update event sent in from plug.dj
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, id: Number, user: Object, level: Number}} A humanized form of the Chat Level Update event sent in from plug.dj
     * @private
     */
    roomMinChatLevelUpdate(data, room) {
        return {
            raw: data,
            id: data.u,
            user: room.getUser(data.u),
            level: data.m
        };
    },

    /**
     * @param {{u: Number, d: String}} data The raw socket data of the Room Description Update event sent in from plug.dj
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, user: Object, description: String}} A humanized form of the Room Description Update event sent in from plug.dj
     * @private
     */
    roomDescriptionUpdate(data, room) {
        return {
            raw: data,
            user: room.getUser(data.u),
            description: data.d
        };
    },

    /**
     * @param {{u: Number, n: String}} data The raw socket data of the Room Name Update event sent in from plug.dj
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, user: Object, name: String}} A humanized form of the Room Name Update event sent in from plug.dj
     * @private
     */
    roomNameUpdate(data, room) {
        return {
            raw: data,
            user: room.getUser(data.u),
            name: data.n
        };
    },

    /**
     * @param {{u: Number, w: String}} data The raw socket data of the Room Welcome Update event sent in from plug.dj
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, user: Object, name: String}} A humanized form of the Room Welcome Update event sent in from plug.dj
     * @private
     */
    roomWelcomeUpdate(data, room) {
        return {
            raw: data,
            user: room.getUser(data.u),
            welcome: data.w
        };
    }
};
