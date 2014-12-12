var util = require('util');

function BufferObject(data, getUpdate, maxAge) {
    if (typeof getUpdate != 'function') {
        throw new Error('BufferObject requires a update function');
    }

    maxAge = maxAge || 6e4;

    //noinspection JSUnusedGlobalSymbols
    return {
        lastUpdate: data ? Date.now() : 0,
        data: data || null,
        set: function(data) {
            this.data = data;
            this.lastUpdate = Date.now();
        },
        get: function(callback) {
            if (this.data != null) {
                if (maxAge < 0 || this.lastUpdate >= Date.now() - maxAge) {
                    callback(this.data);
                    return;
                }
            }

            var that = this;
            getUpdate(function(err, data) {
                if (err) {
                    that.get();
                    return;
                }
                that.set(data);
                callback(data);
            });
        },
        push: function(data) {
            // Be sure the data is loaded
            this.get();

            if (util.isArray(this.data)) {
                this.data.push(data);
            }
        },
        remove: function(data) {
            this.get();

            for (var i in this.data) {
                if (!this.data.hasOwnProperty(i)) continue;
                if (this.data[i] == data) {
                    this.data.splice(i, 1);
                    return;
                }
            }
        },
        removeAt: function(index) {
            // Be sure the data is loaded
            this.get();

            if (util.isArray(this.data) && index < this.data.length) {
                this.data.splice(index, 1);
            }
        }
    };
}

module.exports = BufferObject;