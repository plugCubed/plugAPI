var util = require('util');
var songHistory = [];

/**
 * That is this and this is that
 * @type {Room}
 */
var that = null;

var User = function(data) {
    this.avatarID = data.avatarID ? data.avatarID : '';
    this.badge = data.badge ? data.badge : 0;
    this.blurb = data.blurb ? data.blurb : undefined;
    this.ep = data.ep ? data.ep : undefined;
    this.gRole = data.gRole ? data.gRole : 0;
    this.grab = grabs[data.id] === true;
    this.id = data.id ? data.id : -1;
    this.ignores = data.ignores ? data.ignores : undefined;
    this.joined = data.joined ? data.joined : '';
    this.language = data.language ? data.language : '';
    this.level = data.level ? data.level : 0;
    this.notifications = data.notifications ? data.notifications : undefined;
    this.pVibes = data.pVibes ? data.pVibes : undefined;
    this.pw = data.pw ? data.pw : undefined;
    this.role = data.role ? data.role : 0;
    this.slug = data.slug ? data.slug : undefined;
    this.status = data.status ? data.status : 0;
    this.username = data.username ? data.username : '';
    this.vote = votes[data.id] !== undefined ? votes[data.id] === -1 ? -1 : 1 : 0;
    this.xp = data.xp ? data.xp : 0;
};

User.prototype.toString = function() {
    return this.username;
};

var booth, fx, grabs, meta, mutes, playback, self, role, users, votes;
booth = {
    currentDJ: -1,
    isLocked: false,
    shouldCycle: true,
    waitingDJs: []
};
fx = [];
grabs = {};
meta = {
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
mutes = {};
playback = {
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
self = {};
role = 0;
users = [];
votes = {};

/**
 * Room data container
 * SHOULD NOT BE USED/ACCESSED DIRECTLY
 * @constructor
 */
var Room = function() {
    that = this;
};

/**
 * Make an array of userIDs to an array of user objects
 * @param {Array} ids
 * @return {Array}
 */
Room.prototype.usersToArray = function(ids) {
    var user, users;
    users = [];
    for (var i in ids) {
        if (!ids.hasOwnProperty(i)) continue;
        user = this.getUser(ids[i]);
        if (user != null) users.push(user);
    }
    return users;
};

/**
 * Implementation of plug.dj methods
 * Gets the permissions over another user by user object
 * @param {User} other
 * @return {{canModChat: boolean, canModMute: boolean, canModBan: boolean, canModStaff: boolean}}
 */
Room.prototype.getPermissions = function(other) {
    var me = this.getSelf();

    var permissions = {
        canModChat: false,
        canModMute: false,
        canModBan: false,
        canModStaff: false
    };

    if (other.gRole === 0) {
        if (me.gRole === 5) {
            permissions.canModChat = true;
            permissions.canModBan = true;
        } else {
            permissions.canModChat = me.role > 1 && Math.max(me.role, me.gRole) > other.role;
            permissions.canModBan = me.role > other.role;
        }
    }

    if (me.gRole === 5) {
        permissions.canModStaff = true;
    } else if (other.gRole !== 5) {
        permissions.canModStaff = Math.max(me.role, me.gRole) > Math.max(other.role, other.gRole);
    }

    permissions.canModMute = !(other.role > 0 || other.gRole > 0);

    return permissions;
};

Room.prototype.registerUserExtensions = function(instance) {
    /**
     * Add the user to the waitlist
     */
    User.prototype.addToWaitList = function() {
        instance.moderateAddDJ(this.id);
    };
    /**
     * Remove the user from the waitlist
     */
    User.prototype.removeFromWaitList = function() {
        instance.moderateRemoveDJ(this.id);
    };
    /**
     * Move the user to a new position in the waitlist
     * @param {int} pos New position
     */
    User.prototype.moveInWaitList = function(pos) {
        instance.moderateMoveDJ(this.id, pos);
    };
}

/**
 * Implementation of plug.dj methods
 * Gets the permissions over another user by userID
 * @param {Number} uid Other userID
 * @return {{canModChat: boolean, canModMute: boolean, canModBan: boolean, canModStaff: boolean}}
 */
Room.prototype.getPermissionsID = function(uid) {
    return this.getPermissions(this.getUser(uid));
};

Room.prototype.haveRoomPermission = function(uid, permission) {
    var user = this.getUser(uid);
    return !(user == null || user.role < permission);
};

Room.prototype.haveGlobalPermission = function(uid, permission) {
    var user = this.getUser(uid);
    return !(user == null || user.gRole < permission);
};

Room.prototype.isAmbassador = function(uid) {
    if (!uid) uid = self.id;
    return this.haveGlobalPermission(uid, 2);
};

Room.prototype.isStaff = function(userid) {
    if (!userid) userid = self.id;
    return this.staff[userid] != null;
};

/**
 * Is user current DJ?
 * @param {Number} [uid]
 * @return {boolean}
 */
Room.prototype.isDJ = function(uid) {
    if (!uid) uid = self.id;
    return booth.currentDJ === uid;
};

/**
 * Is user in waitlist?
 * @param {Number} [uid]
 * @return {boolean}
 */
Room.prototype.isInWaitList = function(uid) {
    if (!uid) uid = self.id;
    return this.getWaitListPosition(uid) > 0;
};

/**
 * Reset all room variables
 */
Room.prototype.reset = function() {
    booth = {
        currentDJ: -1,
        isLocked: false,
        shouldCycle: true,
        waitingDJs: []
    };
    fx = [];
    grabs = {};
    meta = {
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
    mutes = {};
    playback = {
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
    role = 0;
    users = [];
    votes = {};
};

/**
 * Add a new user
 * @param {Object} user User data
 */
Room.prototype.addUser = function(user) {
    // Don't add yourself
    if (user.id === self.id) return;

    // Only add if the user doesn't exist
    if (this.getUser(user.id) === null) users.push(user);
};

/**
 * Remove an user
 * @param {Number} uid UserID
 */
Room.prototype.removeUser = function(uid) {
    for (var i in users) {
        if (!users.hasOwnProperty(i)) continue;
        if (users[i].id == uid) {
            // User found
            delete users[i];
            return;
        }
    }
};

/**
 * Update an user
 * @param {Object} data User data changes
 */
Room.prototype.updateUser = function(data) {
    for (var i in users) {
        if (!users.hasOwnProperty(i)) continue;
        if (users[i].id === data.i) {
            for (var j in data) {
                if (!data.hasOwnProperty(j)) continue;
                if (j != 'i') {
                    users[i][j] = data[j];
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

/**
 * Set self object
 * @param {Object} data Self data
 */
Room.prototype.setSelf = function(data) {
    self = data;
};

/**
 * Set room data
 * @param {Object} data Room data
 */
Room.prototype.setRoomData = function(data) {
    booth = data.booth;
    fx = data.fx;
    grabs = data.grabs;
    meta = data.meta;
    mutes = data.mutes;
    playback = data.playback;
    self.role = data.role;
    users = data.users;
    votes = data.votes;
};

Room.prototype.setDJs = function(djs) {
    booth.waitingDJs = djs;
};

/**
 * Set the media object.
 * @param mediaInfo
 * @param mediaStartTime
 */
Room.prototype.setMedia = function(mediaInfo, mediaStartTime) {
    votes = {};
    grabs = {};

    playback.media = mediaInfo;
    playback.startTime = mediaStartTime;
};

Room.prototype.advance = function(data) {
    if (songHistory.length < 1) {
        setImmediate(this.advance, data);
        return;
    }

    songHistory[0].room = this.getRoomScore();

    this.setMedia(data.m, data.t);
    this.setDJs(data.d);

    booth.currentDJ = data.c;
    playback.historyID = data.h;
    playback.playlistID = data.p;

    var historyObj = {
        id: data.h,
        media: data.m,
        room: {
            name: meta.name,
            slug: meta.slug
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
    grabs[uid] = 1;
};

Room.prototype.setVote = function(uid, vote) {
    votes[uid] = vote;
};

Room.prototype.setEarn = function(data) {
    self.xp = data.xp;
    self.ep = data.ep;
    self.level = data.level;
};

/**
 * Get all users in the community
 * @returns {*}
 */
Room.prototype.getUsers = function() {
    return this.usersToArray([self.id].concat((function() {
        var ids = [];
        for (var i in users) {
            if (!users.hasOwnProperty(i)) continue;
            ids.push(users[i].id);
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
    if (!userid || userid === self.id) return this.getSelf();
    for (var i in users) {
        if (!users.hasOwnProperty(i)) continue;
        if (users[i].id === userid) return new User(users[i]);
    }
    return null;
};

Room.prototype.getSelf = function() {
    return self != null ? new User(self) : null;
};

/**
 * Get the current DJ
 * @returns {*}
 */
Room.prototype.getDJ = function() {
    if (booth.currentDJ > 0) {
        return this.getUser(booth.currentDJ);
    }
    return null;
};

/**
 * Get all DJs (including current DJ)
 * @returns {Array}
 */
Room.prototype.getDJs = function() {
    return this.usersToArray([booth.currentDJ].concat(booth.waitingDJs));
};

/**
 * Get all DJs in waitlist
 * @returns {*}
 */
Room.prototype.getWaitList = function() {
    return this.usersToArray(booth.waitingDJs);
};

/**
 * Get a user's position in waitlist
 * @param {number} uid User ID
 * @returns {number}
 * Position in waitlist.
 * If current DJ, it returns 0.
 * If not in waitlist, it returns -1
 */
Room.prototype.getWaitListPosition = function(uid) {
    if (booth.currentDJ === uid) {
        return 0;
    }
    var pos = booth.waitingDJs.indexOf(uid);
    return pos < 0 ? -1 : pos + 1;
};

/**
 * Get the audience (not current DJ nor waiting)
 * @return {Array}
 */
Room.prototype.getAudience = function() {
    var audience = [], _ref;
    _ref = [self].concat(users);
    for (var i in _ref) {
        if (!_ref.hasOwnProperty(i)) continue;
        var userID = _ref[i].id;
        if (this.getWaitListPosition(userID) < 0) {
            audience.push(userID);
        }
    }
    return this.usersToArray(audience);
};

Room.prototype.getStaff = function() {
    var staff = [], _ref;
    _ref = [self].concat(users);
    for (var i in _ref) {
        if (!_ref.hasOwnProperty(i)) continue;
        var user = _ref[i];
        if (user.role > 0) {
            staff.push(user.id);
        }
    }
    return this.usersToArray(staff);
};

/**
 * Get the host of the community.
 * @returns {*} Host if in community, otherwise null
 */
Room.prototype.getHost = function() {
    return this.getUser(meta.hostID);
};

Room.prototype.getMedia = function() {
    return playback.media;
};

Room.prototype.getStartTime = function() {
    return playback.startTime;
};

Room.prototype.getHistoryID = function() {
    return playback.historyID;
};

Room.prototype.getHistory = function() {
    return songHistory;
};

Room.prototype.setHistory = function(data) {
    songHistory = data;
};

Room.prototype.getRoomMeta = function() {
    return util._extend({}, meta);
};

Room.prototype.getRoomScore = function() {
    var result = {
        positive: 0,
        listeners: Math.max(this.getUsers().length - 1, 0),
        grabs: 0,
        negative: 0,
        skipped: 0
    }, i;
    var _ref = votes;
    for (i in _ref) {
        if (!_ref.hasOwnProperty(i)) continue;
        var vote = _ref[i];
        if (vote > 0) {
            result.positive++;
        } else if (vote < 0) {
            result.negative++;
        }
    }
    var _ref1 = grabs;
    for (i in _ref1) {
        if (!_ref1.hasOwnProperty(i)) continue;
        if (_ref1[i] > 0) {
            result.grabs++;
        }
    }
    return result;
};

module.exports = Room;
