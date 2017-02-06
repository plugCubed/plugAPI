'use strict';

function BufferObject(data, getUpdate, maxAge) {
    if (typeof getUpdate !== 'function') {
        throw new Error('BufferObject requires an update function');
    }

    maxAge = maxAge || 6e4;

    return {
        lastUpdate: data ? Date.now() : 0,
        data: data || null,
        set: function(setData) {
            this.data = setData;
            this.lastUpdate = Date.now();
        },
        get: function(callback) {
            if (this.data != null) {
                if (maxAge < 0 || this.lastUpdate >= Date.now() - maxAge) {
                    if (typeof callback == 'function') {
                        return callback(this.data);
                    }

                    return;
                }
            }

            var that = this;

            getUpdate(function(err, updateData) {
                if (err) {
                    that.get();

                    return;
                }
                that.set(updateData);
                if (typeof callback == 'function') {
                    return callback(updateData);
                }
            });
        },
        push: function(pushData) {

            // Be sure the data is loaded
            this.get();

            if (Array.isArray(this.data)) {
                this.data.push(pushData);
            }
        },
        remove: function(removeData) {
            this.get();

            for (var i in this.data) {
                if (!this.data.hasOwnProperty(i)) continue;
                if (this.data[i] === removeData) {
                    this.data.splice(i, 1);

                    return;
                }
            }
        },
        removeAt: function(index) {

            // Be sure the data is loaded
            this.get();

            if (Array.isArray(this.data) && index < this.data.length) {
                this.data.splice(index, 1);
            }
        }
    };
}

module.exports = BufferObject;
