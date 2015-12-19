'use strict';

const fs = require('fs');
const chalk = require('chalk');
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const levels = {
    success: ['green'],
    info: ['white'],
    warning: ['yellow', 'underline'],
    error: ['bgRed', 'white', 'bold']
};

function pad(n) {
    return n < 10 ? `0'${n.toString(10)}` : n.toString(10);
}

function timestamp() {
    const d = new Date();
    const time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');

    return [pad(d.getDate()), months[d.getMonth()], time].join(' ');
}

function chalkPaint(sidewalkChalks, text) {
    let combinedChalk = chalk;

    for (const i in sidewalkChalks) {
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
    const settings = {
        fileOutput: false,
        filePath: '',
        consoleOutput: true
    };

    function Log() {

        const args = Array.prototype.slice.call(arguments);
        let level = 'info';

        if (levels[args[0]] !== undefined) {
            level = args.shift();
        }

        args.unshift(new Array(10 - channel.length - 2).join(' '));
        args.unshift(`[${channel}]`);
        args.unshift(new Array(10 - level.length - 2).join(' '));
        args.unshift(chalkPaint(levels[level], `[${level.toUpperCase()}]`));
        args.unshift(timestamp());

        if (settings.consoleOutput) {
            console.log.apply(console, args);
        }

        if (settings.fileOutput) {
            fs.appendFileSync(settings.filePath, chalk.stripColor(`${args.join(' ')} \n`));
        }
    }

    /**
     * Creates a new logger function
     * @param  {String} level Logging level
     * @returns {Log} A new logger function
     */
    function createLogFunc(level) {
        return function() {
            const args = Array.prototype.slice.call(arguments);

            args.unshift(level);
            Log.apply(this, args);
        };
    }

    return {
        settings,
        success: createLogFunc('success'),
        info: createLogFunc('info'),
        warn: createLogFunc('warning'),
        warning: createLogFunc('warning'),
        error: createLogFunc('error')
    };
}

module.exports = Logger;
