/*
 This file contains functions for converting plug.dj socket objects to plugAPI objects (easier to read and extend).
 When adding new function, be sure to call it the event type name and then change the messageHandler to use the new object.
 */

/**
 * @param {{m: Object, t: String, h: Number, d: Array, c: Number, p: Number}} data
 * @returns {{media: Object, startTime: String, historyID: Number, djs: Array, currentDJ: Number, playlistID: Number}}
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

var encoder = require('node-html-encoder').Encoder('entity');
/**
 * @param {{message: String, un: String, type: String, uid: Number, cid: String}} data
 * @param {Room} room
 * @return {{raw: Object, id: (playback.media.cid|*), from: (User|null), message: String, mentions: User[], muted: Boolean}}
 * @constructor
 */
function ChatEventObject(data, room) {
    return {
        raw: data,
        id: data.cid,
        from: room.getUser(data.uid),
        message: encoder.htmlDecode(data.message),
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
 * @param {{m: Number, u: Number}} data
 * @returns {{raw: Object, id: Number, user: Object, level: Number}}
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
