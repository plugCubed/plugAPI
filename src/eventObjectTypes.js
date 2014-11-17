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