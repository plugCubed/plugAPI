'use strict';

const logger = require('jethro');
const logInvalidMessage = (channel, message) => {
    logger('warning', 'PlugAPI', `An invalid channel (${typeof channel}) or message (${typeof message}) was specified`);
};

logger.debug = (channel, message) => {
    if (typeof channel === 'string' && message != null) {
        logger('debug', channel, `${typeof message === 'string' ? message : JSON.stringify(message)}`);
    } else {
        logInvalidMessage(channel, message);
    }
};
logger.error = (channel, message) => {
    if (typeof channel === 'string' && message != null) {
        logger('error', channel, `${typeof message === 'string' ? message : JSON.stringify(message)}`);
    } else {
        logInvalidMessage(channel, message);
    }
};
logger.info = (channel, message) => {
    if (typeof channel === 'string' && message != null) {
        logger('info', channel, `${typeof message === 'string' ? message : JSON.stringify(message)}`);
    } else {
        logInvalidMessage(channel, message);
    }
};
logger.success = (channel, message) => {
    if (typeof channel === 'string' && message != null) {
        logger('success', channel, `${typeof message === 'string' ? message : JSON.stringify(message)}`);
    } else {
        logInvalidMessage(channel, message);
    }
};
logger.warn = logger.warning = (channel, message) => {
    if (typeof channel === 'string' && message != null) {
        logger('warning', channel, `${typeof message === 'string' ? message : JSON.stringify(message)}`);
    } else {
        logInvalidMessage(channel, message);
    }
};

module.exports = logger;
