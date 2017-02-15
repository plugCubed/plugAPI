'use strict';

/**
 * PlugAPI Util Functions
 * @memberof PlugAPI
 */
const Utils = {

    /**
     * Calculates the levenshtein distance between two strings.
     * Code obtained from http://rosettacode.org/wiki/Levenshtein_distance#JavaScript
     * @param {String} a String A
     * @param {String} b String B
     * @memberof PlugAPI.Utils
     * @returns {Number} Levenshtein distance between string A and B
     */
    levenshtein(a, b) {
        const aLen = a.length;
        const bLen = b.length;
        const d = [];
        let i;
        let j;

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
    },

    /**
     * Calculates the percentage of uppercase letters in a string
     * @param {String} str The string to calculate
     * @memberof PlugAPI.Utils
     *
     * @example
     *
     * PlugAPI.Utils.uppercase('HAI') // returns 100
     * @returns {Number} Percentage of uppercase letters
     */
    uppercase(str) {
        const chars = str.length;
        const uLet = str.match(/[A-Z]/g);

        if (uLet != null) {
            return (uLet.length / chars) * 100;
        }

        return 0;
    }
};

module.exports = Utils;
