'use strict';

var logger = require('jethro');
var logInvalidMessage = (channel ,message) => {
    logger('warning', 'PlugAPI', `An invalid channel (${typeof channel}) or message (${typeof message}) was specified`);
};

logger.debug = (channel, message) => {
    if (typeof channel === 'string' && typeof message === 'string') {
        logger('debug', channel, message);
    } else {
        logInvalidMessage(channel, message);
    }
};
logger.error = (channel, message) => {
    if (typeof channel === 'string' && typeof message === 'string') {
        logger('error', channel, message);
    } else {
        logInvalidMessage(channel, message);
    }
};
logger.info = (channel, message) => {
    if (typeof channel === 'string' && typeof message === 'string') {
        logger('info', channel, message);
    } else {
        logInvalidMessage(channel, message);
    }
};
logger.success = (channel, message) => {
    if (typeof channel === 'string' && typeof message === 'string') {
        logger('success', channel, message);
    } else {
        logInvalidMessage(channel, message);
    }
};
logger.warn = logger.warning = (channel, message) => {
    if (typeof channel === 'string' && typeof message === 'string') {
        logger('warning', channel, message);
    } else {
        logInvalidMessage(channel, message);
    }
};

module.exports = logger;
