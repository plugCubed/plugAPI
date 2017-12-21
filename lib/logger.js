'use strict';

const Jethro = require('jethro');
const logger = new Jethro();
const handleLogMessage = (channel, source, message) => {
    if (typeof source === 'string' && message != null && Object.is(typeof logger[channel], 'function')) {
        logger[channel](source, message);
    } else {
        logger.warning('PlugAPI', `An invalid channel (${typeof source}) , invalid channel (${typeof logger[channel]}) or message (${typeof message}) was specified`);
    }
};

module.exports = {
    debug(source, message) {
        handleLogMessage('debug', source, message);
    },
    error(source, message) {
        handleLogMessage('error', source, message);
    },
    info(source, message) {
        handleLogMessage('info', source, message);
    },
    success(source, message) {
        handleLogMessage('success', source, message);
    },
    warn(source, message) {
        handleLogMessage('warn', source, message);
    },
    warning(source, message) {
        handleLogMessage('warning', source, message);
    },
    logger
};
