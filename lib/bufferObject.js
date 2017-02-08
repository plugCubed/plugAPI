'use strict';

function BufferObject(data, getUpdate, maxAge) {
    if (typeof getUpdate !== 'function') {
        throw new Error('BufferObject requires an update function');
    }

    maxAge = maxAge || 6e4;

    return {
        lastUpdate: data ? Date.now() : 0,
        data: data || null,
        set(setData) {
            this.data = setData;
            this.lastUpdate = Date.now();
        },
        get(callback) {
            if (this.data != null) {
                if (maxAge < 0 || this.lastUpdate >= Date.now() - maxAge) {
                    if (typeof callback == 'function') {
                        return callback(this.data);
                    }

                    return this.data;
                }
            }

            const that = this;

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
        push(pushData) {

            // Be sure the data is loaded
            this.get();

            if (Array.isArray(this.data)) {
                this.data.push(pushData);
            }
        },
        remove(removeData) {
            this.get();

            for (const i in this.data) {
                if (!this.data.hasOwnProperty(i)) continue;
                if (this.data[i] === removeData) {
                    this.data.splice(i, 1);

                    return;
                }
            }
        },
        removeAt(index) {

            // Be sure the data is loaded
            this.get();

            if (Array.isArray(this.data) && index < this.data.length) {
                this.data.splice(index, 1);
            }
        }
    };
}

module.exports = BufferObject;
