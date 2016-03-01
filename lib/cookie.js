'use strict';

/**
 * Cookies
 * @type {Object}
 */
let cookies = {};

/**
 * Key, defining which user the cookie is for
 * @type {string}
 */
let cookieKey = '';

/**
 * Clear cookies
 */
exports.clear = function() {
    cookies = {};
};

/**
 * Does cookie handler contain cookie with key?
 * @param {String} key The key to check
 * @returns {boolean} True if it does contain. False if not
 */
exports.contain = function(key) {
    return cookies[cookieKey][key] != null;
};

/**
 * Extract cookies from response headers
 * @param {Object} headers Response headers
 */
exports.fromHeaders = function(headers) {
    const headerKeys = Object.keys(headers);

    for (const i of headerKeys) {
        if (i === 'set-cookie') {
            for (let j = 0; j < headers[i].length; j++) {
                const cookieString = headers[i][j];
                const cookieKeyValue = cookieString.split(';')[0].split('=');
                const key = cookieKeyValue.shift();
                const value = cookieKeyValue.join('=');

                if (typeof cookies[cookieKey] === 'undefined') {
                    cookies[cookieKey] = {};
                }
                cookies[cookieKey][key] = value;
            }
        }
    }
};

/**
 * Return the cookie as a request header string
 * @returns {String} A request header string of the cookie.
 */
exports.toString = function() {
    const _cookies = [];

    for (const i in cookies[cookieKey]) {
        if (!cookies[cookieKey].hasOwnProperty(i)) continue;

        _cookies.push(`${i}=${cookies[cookieKey][i]}`);
    }
    return _cookies.join('; ');
};

/**
 * Cookie Handler
 * @param {String} key A key used to figure out, which user the key is for
 * @constructor
 */
function CookieHandler(key) {
    cookieKey = key;

    this.clear = exports.clear;
    this.contain = exports.contain;
    this.fromHeaders = exports.fromHeaders;
    this.toString = exports.toString;
}

module.exports = CookieHandler;
