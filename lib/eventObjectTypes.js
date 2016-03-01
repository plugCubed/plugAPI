'use strict';

/*
 This file contains functions for converting plug.dj socket objects to plugAPI objects (easier to read and extend).
 When adding new function, be sure to call it the event type name and then change the messageHandler to use the new object.
 */

/**
 * @param {{m: Object, t: String, h: Number, d: Array, c: Number, p: Number}} data The raw socket data of the advance event sent in from plug.dj
 * @returns {{media: Object, startTime: String, historyID: Number, djs: Array, currentDJ: Number, playlistID: Number}} A humanized form of the advance event sent in from plug.dj.
 * @constructor
 */
function AdvanceEventObject(data) {
    return {
        media: data.m,
        startTime: data.t,
        historyID: data.h,
        djs: data.d,
        currentDJ: data.c,
        playlistID: data.p
    };
}

exports.advance = AdvanceEventObject;

var he = require('he');

/**
 * @param {{message: String, un: String, type: String, uid: Number, cid: String}} data The raw socket data of the chat event sent in from plug.dj
 * @param {Room} room PlugAPI's internal room.js functions
 * @returns {{raw: Object, id: (playback.media.cid|*), from: (User|null), message: String, mentions: User[], muted: Boolean}} A humanized form of the chat object sent in from plug.dj
 * @constructor
 */
function ChatEventObject(data, room) {
    return {
        raw: data,
        id: data.cid,
        from: room.getUser(data.uid),
        message: he.decode(data.message),
        mentions: [],
        muted: room.isMuted(data.uid),
        type: (function() {
            if (data.message.indexOf('/me') === 0) {
                return 'emote';
            }
            if (data.message.indexOf('@' + room.getSelf().username) > -1) {
                return 'mention';
            }
            return 'message';
        })()
    };
}

exports.chat = ChatEventObject;

/**
 * @param {{m: String, mi: Number, f: Boolean}} data The raw socket data of the DJ Cycle event sent in from plug.dj
 * @param {Room} room PlugAPI's internal room.js functions
 * @returns {{raw: Object, user: Object, cycle: Boolean}} A humanized form of the DJ Cycle event sent in from plug.dj
 * @constructor
 */
function djListCycleObject(data, room) {
    return {
        raw: data,
        user: room.getUser(data.mi),
        cycle: data.f
    };
}

exports.djListCycle = djListCycleObject;

/**
 * @param {{m: String, mi: Number, c: Boolean, f: Boolean}} data The raw socket data of the DJ List Locked event sent in from plug.dj
 * @param {Room} room PlugAPI's internal room.js functions
 * @returns {{raw: Object, user: Object, clear: Boolean, locked: Boolean}} A humanized form of the DJ List Locked event sent in from plug.dj
 * @constructor
 */
function djListLockedObject(data, room) {
    return {
        raw: data,
        user: room.getUser(data.mi),
        clear: data.c,
        locked: data.f
    };
}

exports.djListLocked = djListLockedObject;

/**
 * @param {{m: Number, u: Number}} data The raw socket data of the Chat Level Update event sent in from plug.dj
 * @param {Room} room PlugAPI's internal room.js functions
 * @returns {{raw: Object, id: Number, user: Object, level: Number}} A humanized form of the Chat Level Update event sent in from plug.dj
 * @constructor
 */
function ChatLevelUpdateObject(data, room) {
    return {
        raw: data,
        id: data.u,
        user: room.getUser(data.u),
        level: data.m
    };
}

exports.roomMinChatLevelUpdate = ChatLevelUpdateObject;

/**
 * @param {{u: Number, d: String}} data The raw socket data of the Room Description Update event sent in from plug.dj
 * @param {Room} room PlugAPI's internal room.js functions
 * @returns {{raw: Object, user: Object, description: String}} A humanized form of the Room Description Update event sent in from plug.dj
 * @constructor
 */
function RoomDescriptionUpdateObject(data, room) {
    return {
        raw: data,
        user: room.getUser(data.u),
        description: data.d
    };
}

exports.roomDescriptionUpdate = RoomDescriptionUpdateObject;

/**
 * @param {{u: Number, n: String}} data The raw socket data of the Room Name Update event sent in from plug.dj
 * @param {Room} room PlugAPI's internal room.js functions
 * @returns {{raw: Object, user: Object, name: String}} A humanized form of the Room Name Update event sent in from plug.dj
 * @constructor
 */
function RoomNameUpdateObject(data, room) {
    return {
        raw: data,
        user: room.getUser(data.u),
        name: data.n
    };
}

exports.roomNameUpdate = RoomNameUpdateObject;

/**
 * @param {{u: Number, w: String}} data The raw socket data of the Room Welcome Update event sent in from plug.dj
 * @param {Room} room PlugAPI's internal room.js functions
 * @returns {{raw: Object, user: Object, name: String}} A humanized form of the Room Welcome Update event sent in from plug.dj
 * @constructor
 */
function RoomWelcomeUpdateObject(data, room) {
    return {
        raw: data,
        user: room.getUser(data.u),
        welcome: data.w
    };
}

exports.roomWelcomeUpdate = RoomWelcomeUpdateObject;
