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
                if (data.message.indexOf('/me') === 0 || data.message.indexOf('/em') === 0) {
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
     * @param {{m: Number, u: Number}} data The raw socket data of the Chat Level Update event sent in from plug.dj
     * @param {Room} room PlugAPI's internal room.js functions
     * @returns {{raw: Object, id: Number, user: Object, level: Number}} A humanized form of the Chat Level Update event sent in from plug.dj
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
     */
    roomWelcomeUpdate(data, room) {
        return {
            raw: data,
            user: room.getUser(data.u),
            welcome: data.w
        };
    }
};
