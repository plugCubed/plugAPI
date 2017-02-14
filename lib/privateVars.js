'use strict';

const store = new WeakMap();

module.exports = function(obj) {
    if (!store.has(obj)) {
        store.set(obj, {});
    }

    return store.get(obj);
};
