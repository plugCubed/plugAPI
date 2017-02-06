'use strict';

var fs = require('fs');
var chalk = require('chalk');
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var levels = {
    success: ['green'],
    info: ['white'],
    warning: ['yellow', 'underline'],
    error: ['bgRed', 'white', 'bold']
};

function pad(n) {
    return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

function timestamp() {
    var d = new Date();
    var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');

    return [pad(d.getDate()), months[d.getMonth()], time].join(' ');
}

function chalkPaint(sidewalkChalks, text) {
    var combinedChalk = chalk;

    for (var i in sidewalkChalks) {
        if (!sidewalkChalks.hasOwnProperty(i)) continue;
        combinedChalk = combinedChalk[sidewalkChalks[i]];
    }

    return combinedChalk(text);
}

function Logger(channel) {

    /**
     * Settings for Logger
     * @type {{fileOutput: boolean, filePath: string, consoleOutput: boolean}}
     */
    var settings = {
        fileOutput: false,
        filePath: '',
        consoleOutput: true
    };

    function Log() {
        var args = Array.prototype.slice.call(arguments);
        var level = 'info';

        if (levels[args[0]] !== undefined) {
            level = args.shift();
        }

        args.unshift(new Array(10 - channel.length - 2).join(' '));
        args.unshift('[' + channel + ']');
        args.unshift(new Array(10 - level.length - 2).join(' '));
        args.unshift(chalkPaint(levels[level], '[' + level.toUpperCase() + ']'));
        args.unshift(timestamp());

        if (settings.consoleOutput) {
            console.log.apply(console, args);
        }

        if (settings.fileOutput) {
            fs.appendFileSync(settings.filePath, chalk.stripColor(args.join(' ')) + '\n');
        }
    }

    /**
     * Creates a new logger function
     * @param  {String} level Logging level
     * @returns {Log} A new logger function
     */
    function createLogFunc(level) {
        return function() {
            var args = Array.prototype.slice.call(arguments);

            args.unshift(level);
            Log.apply(this, args);
        };
    }

    return {
        settings: settings,
        success: createLogFunc('success'),
        info: createLogFunc('info'),
        warn: createLogFunc('warning'),
        warning: createLogFunc('warning'),
        error: createLogFunc('error')
    };
}

module.exports = Logger;
