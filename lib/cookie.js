/**
 * Cookies
 * @type {Object}
 */
var cookies = {};

/**
 * Key, defining which user the cookie is for
 * @type {string}
 */
var cookieKey = '';

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
    return cookies[cookieKey][key] != null;
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
                var cookieString;
                var cookieKeyValue;
                var key;
                var value;

                cookieString = headers[i][j];
                cookieKeyValue = cookieString.split(';')[0].split('=');
                key = cookieKeyValue.shift();
                value = cookieKeyValue.join('=');

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
 * @returns {String}
 */
exports.toString = function() {
    var _cookies = [];
    for (var i in cookies[cookieKey]) {
        if (!cookies[cookieKey].hasOwnProperty(i)) continue;
        _cookies.push(i + '=' + cookies[cookieKey][i]);
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
