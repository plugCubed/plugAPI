var fs = require('fs');
var path = require('path');

/**
 * Cookies
 * @type {Object}
 */
var cookies = {};

/**
 * Path to the cookie file
 * @type {String}
 */
var cookiePath = path.resolve(__dirname, '..', 'cookies.tmp');

/**
 * Clear cookies
 */
exports.clear = function() {
    cookies = {};
};

/**
 * Does cookie handler contain cookie with key?
 * @param {String} key
 * @returns {boolean}
 */
exports.contain = function(key) {
    return cookies[key] != null;
};

/**
 * Load from the cookie file, if it exists
 */
exports.load = function() {
    if (fs.existsSync(cookiePath)) {
        cookies = JSON.parse(fs.readFileSync(cookiePath));
        return true;
    }
    return false;
};

/**
 * Save to the cookie file
 */
exports.save = function() {
    fs.writeFileSync(cookiePath, JSON.stringify(cookies));
};

/**
 * Extract cookies from response headers
 * @param {Object} headers Response headers
 */
exports.fromHeaders = function(headers) {
    for (var i in headers) {
        if (!headers.hasOwnProperty(i)) continue;
        if (i == 'set-cookie') {
            for (var j in headers[i]) {
                if (!headers[i].hasOwnProperty(j)) continue;
                var cookieString, cookieKeyValue, key, value;

                cookieString = headers[i][j];
                cookieKeyValue = cookieString.split(';')[0].split('=');
                key = cookieKeyValue.shift();
                value = cookieKeyValue.join('=');

                cookies[key] = value;
            }
        }
    }
};

/**
 * Return the cookie as a request header string
 * @returns {String}
 */
exports.toString = function() {
    var _cookies = [];
    for (var i in cookies) {
        if (!cookies.hasOwnProperty(i)) continue;
        _cookies.push(i + '=' + cookies[i]);
    }
    return _cookies.join('; ');
};

/**
 * Cookie Handler
 * @constructor
 */
function CookieHandler() {
    this.clear = exports.clear;
    this.contain = exports.contain;
    this.load = exports.load;
    this.save = exports.save;
    this.fromHeaders = exports.fromHeaders;
    this.toString = exports.toString;
}

module.exports = CookieHandler;