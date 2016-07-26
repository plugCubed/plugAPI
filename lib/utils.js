'use strict';

/**
 * Calculates the levenshtein distance between two strings.
 * Code obtained from http://rosettacode.org/wiki/Levenshtein_distance#JavaScript
 * @param {String} a String A
 * @param {String} b String B
 * @returns {Number} Levenshtein distance between string A and B
 */
exports.levenshtein = function(a, b) {
    var aLen = a.length;
    var bLen = b.length;
    var d = [];
    var i;
    var j;

    if (!aLen) return bLen;
    if (!bLen) return aLen;

    for (i = 0; i <= aLen; i++) {
        d[i] = [i];
    }
    for (j = 0; j <= bLen; j++) {
        d[0][j] = j;
    }

    for (j = 1; j <= bLen; j++) {
        for (i = 1; i <= aLen; i++) {
            if (a[i - 1] === b[j - 1]) {
                d[i][j] = d[i - 1][j - 1];
            } else {
                d[i][j] = Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]) + 1;
            }
        }
    }

    return d[aLen][bLen];
};

/**
 * Calculates the percentage of uppercase letters in a string
 * @param {String} a The string
 * @returns {Number} Percentage of uppercase letters
 */
exports.uppercase = function(a) {
    var chars = a.length;
    var uLet = a.match(/[A-Z]/g);

    if (uLet !== null) {
        return uLet.length / chars;
    }
    return 0;
};
