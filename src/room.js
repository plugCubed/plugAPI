var util = require('util');
var songHistory = [], that;

var Room = function() {
    that = this;

    this.User = function(data) {
        this.avatarID = data.avatarID ? data.avatarID : '';
        this.badge = data.badge ? data.badge : 0;
        this.blurb = data.blurb ? data.blurb : '';
        this.curated = that.grabs[data.id] === true;
        this.ep = data.ep ? data.ep : 0;
        this.gRole = data.gRole ? data.gRole : 0;
        this.id = data.id ? data.id : -1;
        this.ignores = data.ignores ? data.ignores : undefined;
        this.joined = data.joined ? data.joined : '';
        this.language = data.language ? data.language : '';
        this.level = data.level ? data.level : 0;
        this.notifications = data.notifications ? data.notifications : undefined;
        this.pVibes = data.pVibes ? data.pVibes : undefined;
        this.pw = data.pw ? data.pw : false;
        this.slug = data.slug ? data.slug : '';
        this.status = data.status ? data.status : 0;
        this.username = data.username ? data.username : '';
        this.vote = that.votes[data.id] !== undefined ? that.votes[data.id] === 'woot' ? 1 : -1 : 0;
        this.xp = data.xp ? data.xp : 0;
    };

    this.User.prototype.toString = function() {
        return this.username;
    };

    this.booth = {
        currentDJ: -1,
        isLocked: false,
        shouldCycle: true,
        waitingDJs: []
    };
    this.fx = [];
    this.grabs = {};
    this.meta = {
        description: '',
        favorite: false,
        hostID: -1,
        hostName: '',
        id: -1,
        name: '',
        population: 0,
        slug: '',
        welcome: ''
    };
    this.mutes = {};
    this.playback = {
        historyID: '',
        media: {
            author: '',
            cid: '',
            duration: -1,
            format: -1,
            id: -1,
            image: '',
            title: ''
        },
        playlistID: -1,
        startTime: ''
    };
    this.self = {};
    this.role = 0;
    this.users = [];
    this.votes = {};
};

Room.prototype.usersToArray = function(ids) {
    var user, users;
    users = [];
    for (var i in ids) {
        if (!ids.hasOwnProperty(i)) continue;
        user = this.getUser(ids[i]);
        if (user != null)
            users.push(user);
    }
    return users;
};

/*Room.prototype.isAmbassador = function(userid) {
 if (!userid) userid = this.self.id;
 return this.ambassadors[userid] != null;
 };

 Room.prototype.isStaff = function(userid) {
 if (!userid) userid = this.self.id;
 return this.staff[userid] != null;
 };

 Room.prototype.isDJ = function(userid) {
 if (!userid) userid = this.self.id;
 if (this.djs.length > 0) {
 return this.djs[0].id === userid;
 }
 return false;
 };

 Room.prototype.isInWaitList = function(userid) {
 if (!userid) userid = this.self.id;
 return this.getWaitListPosition(userid) > -1;
 };*/

Room.prototype.reset = function() {
    this.booth = {
        currentDJ: -1,
        isLocked: false,
        shouldCycle: true,
        waitingDJs: []
    };
    this.fx = [];
    this.grabs = {};
    this.meta = {
        description: '',
        favorite: false,
        hostID: -1,
        hostName: '',
        id: -1,
        name: '',
        population: 0,
        slug: '',
        welcome: ''
    };
    this.mutes = {};
    this.playback = {
        historyID: '',
        media: {
            author: '',
            cid: '',
            duration: -1,
            format: -1,
            id: -1,
            image: '',
            title: ''
        },
        playlistID: -1,
        startTime: ''
    };
    this.role = 0;
    this.users = [];
    this.votes = {};
};

Room.prototype.addUser = function(user) {
    // Don't add yourself
    if (user.id === this.self.id) return;

    this.users.push(user);
};

Room.prototype.removeUser = function(uid) {
    for (var i in this.users) {
        if (!this.users.hasOwnProperty(i)) continue;
        if (this.users[i].id == uid) {
            // User found
            delete this.users[i];
            return;
        }
    }
};

Room.prototype.updateUser = function(data) {
    for (var i in this.users) {
        if (!this.users.hasOwnProperty(i)) continue;
        if (this.users[i].id === data.i) {
            for (var j in data) {
                if (!data.hasOwnProperty(j)) continue;
                if (j != 'i') {
                    this.users[i][j] = data[j];
                }
            }
            return;
        }
    }
};

/*
 Room.prototype.setUsers = function(users) {
 var user, _i, _len, _results;
 this.users = {};
 _results = [];
 for (_i = 0, _len = users.length; _i < _len; _i++) {
 user = users[_i];
 _results.push(this.users[user.id] = user);
 }
 return _results;
 };

 Room.prototype.setStaff = function(ids) {
 this.staff = ids;
 return this.setPermissions();
 };

 Room.prototype.setAmbassadors = function(ids) {
 this.ambassadors = ids;
 return this.setPermissions();
 };

 Room.prototype.setAdmins = function(ids) {
 return this.admins = ids;
 };

 Room.prototype.setOwner = function(ownerId) {
 return this.owner = ownerId;
 };*/

Room.prototype.setSelf = function(data) {
    this.self = data;
};

Room.prototype.setRoomData = function(data) {
    this.booth = data.booth;
    this.fx = data.fx;
    this.grabs = data.grabs;
    this.meta = data.meta;
    this.mutes = data.mutes;
    this.playback = data.playback;
    this.self.role = data.role;
    this.users = data.users;
    this.votes = data.votes;
};

Room.prototype.setDJs = function(djs) {
    this.booth.waitingDJs = djs;
};

/**
 * Set the media object.
 * @param mediaInfo
 * @param mediaStartTime
 */
Room.prototype.setMedia = function(mediaInfo, mediaStartTime) {
    this.votes = {};
    this.grabs = {};

    this.playback.media = mediaInfo;
    this.playback.startTime = mediaStartTime;
};

Room.prototype.advance = function(data) {
    if (songHistory.length < 1) {
        setImmediate(this.advance, data);
        return;
    }

    songHistory[0].room = this.getRoomScore();

    this.setMedia(data.m, data.t);
    this.setDJs(data.d);
    this.booth.currentDJ = data.c;
    this.playback.historyID = data.h;
    this.playback.playlistID = data.p;

    var historyObj = {
        id: data.h,
        media: data.m,
        room: {
            name: this.meta.name,
            slug: this.meta.slug
        },
        score: {
            positive: 0,
            listeners: null,
            grabs: 0,
            negative: 0,
            skipped: 0
        },
        timestamp: data.t,
        user: {
            id: data.c,
            username: this.getUser(data.c) === null ? '' : this.getUser(data.c).username
        }
    };

    if (songHistory.unshift(historyObj) > 50) {
        songHistory.splice(50, songHistory.length - 50);
    }
};
/*
 Room.prototype.setPermissions = function() {
 var id, user, _ref, _results;
 _ref = this.users;
 _results = [];
 for (id in _ref) {
 if (_ref.hasOwnProperty(id)) {
 user = _ref[id];
 if (this.isAmbassador(id)) {
 _results.push(this.users[id]['permission'] = this.ambassadors[id]);
 } else if (this.isStaff(id)) {
 _results.push(this.users[id]['permission'] = this.staff[id]);
 } else {
 _results.push(this.users[id]['permission'] = 0);
 }
 }
 }
 return _results;
 };
 */
Room.prototype.setGrab = function(uid) {
    this.grabs[uid] = 1;
};

Room.prototype.setVote = function(uid, vote) {
    this.votes[uid] = vote;
};

Room.prototype.setEarn = function(data) {
    this.self.xp = data.xp;
    this.self.ep = data.ep;
    this.self.level = data.level;
};

/**
 * Get all users in the community
 * @returns {*}
 */
Room.prototype.getUsers = function() {
    return this.usersToArray([this.getSelf().id].concat((function() {
        var ids = [];
        for (var i in that.users) {
            if (!that.users.hasOwnProperty(i)) continue;
            ids.push(that.users[i].id);
        }
        return ids;
    })()));
};

/**
 * Get specific user in the community
 * @param {Number} userid
 * @returns {*}
 */
Room.prototype.getUser = function(userid) {
    if (!userid || userid === this.getSelf().id) return this.getSelf();
    for (var i in this.users) {
        if (!this.users.hasOwnProperty(i)) continue;
        if (this.users[i].id === userid)
            return new this.User(this.users[i]);
    }
    return null;
};

Room.prototype.getSelf = function() {
    return this.self != null ? new this.User(this.self) : null;
};

/**
 * Get the current DJ
 * @returns {*}
 */
Room.prototype.getDJ = function() {
    if (this.booth.currentDJ > 0) {
        return this.getUser(this.booth.currentDJ);
    }
    return null;
};

/**
 * Get all DJs (including current DJ)
 * @returns {Array}
 */
Room.prototype.getDJs = function() {
    return this.usersToArray([this.booth.currentDJ].concat(this.booth.waitingDJs));
};

/**
 * Get all DJs in waitlist
 * @returns {*}
 */
Room.prototype.getWaitList = function() {
    return this.usersToArray(this.booth.waitingDJs);
};

/**
 * Get a user's position in waitlist
 * @param {number} uid User ID
 * @returns {number} Position in waitlist.
 * If current DJ, it returns 0.
 * If not in waitlist, it returns -1
 */
Room.prototype.getWaitListPosition = function(uid) {
    var djs = this.getDJs(), spot = 0;
    for (var i in djs) {
        if (djs.hasOwnProperty(i)) {
            if (djs[i].id === uid) {
                return spot;
            }
            spot++;
        }
    }
    return -1;
};

Room.prototype.getAudience = function() {
    var audience = [], _ref;
    _ref = [this.self].concat(this.users);
    for (var i in _ref) {
        if (!_ref.hasOwnProperty(i)) continue;
        var userID = _ref[i].id;
        if (this.booth.currentDJ != userID && this.booth.waitingDJs.indexOf(userID) < 0) {
            audience.push(userID);
        }
    }
    return this.usersToArray(audience);
};
/*
 Room.prototype.getAmbassadors = function() {
 var ambassadors, id, user, _ref;
 ambassadors = [];
 _ref = this.users;
 for (id in _ref) {
 if (_ref.hasOwnProperty(id)) {
 user = _ref[id];
 if (user.ambassadors) {
 ambassadors.push(new this.User(user));
 }
 }
 }
 return ambassadors;
 };
 */
Room.prototype.getStaff = function() {
    var staff = [], _ref;
    _ref = [this.self].concat(this.users);
    for (var i in _ref) {
        if (!_ref.hasOwnProperty(i)) continue;
        var user = _ref[i];
        if (user.role > 0) {
            staff.push(user.id);
        }
    }
    return this.usersToArray(staff);
};
/*
 Room.prototype.getAdmins = function() {
 var admins, id, user, _ref;
 admins = [];
 _ref = this.users;
 for (id in _ref) {
 if (_ref.hasOwnProperty(id)) {
 user = _ref[id];
 if (id in this.admins) {
 admins.push(new this.User(user));
 }
 }
 }
 return admins;
 };
 */

/**
 * Get the host of the community.
 * @returns {*} Host if in community, otherwise null
 */
Room.prototype.getHost = function() {
    return this.getUser(this.meta.hostID);
};

Room.prototype.getMedia = function() {
    return this.playback.media;
};

Room.prototype.getStartTime = function() {
    return this.playback.startTime;
};

Room.prototype.getHistory = function() {
    return songHistory;
};

Room.prototype.setHistory = function(data) {
    songHistory = data;
};

Room.prototype.getRoomScore = function() {
    var result = {
        positive: 0,
        listeners: Math.max(this.getUsers().length - 1, 0),
        grabs: 0,
        negative: 0,
        skipped: 0
    }, i;
    var _ref = this.votes;
    for (i in _ref) {
        if (!_ref.hasOwnProperty(i)) continue;
        var vote = _ref[i];
        if (vote > 0) {
            result.positive++;
        } else if (vote < 0) {
            result.negative++;
        }
    }
    var _ref1 = this.grabs;
    for (i in _ref1) {
        if (!_ref1.hasOwnProperty(i)) continue;
        if (_ref1[i] > 0) {
            result.grabs++;
        }
    }
    return result;
};

module.exports = Room;