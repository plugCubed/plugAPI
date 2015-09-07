'use strict';

var objectAssign = require('object-assign');
var songHistory = [];

var cacheUsers = {};

/**
 * @type {{currentDJ: number, isLocked: boolean, shouldCycle: boolean, waitingDJs: Array}}
 */
var booth = {
    currentDJ: -1,
    isLocked: false,
    shouldCycle: true,
    waitingDJs: []
};
/**
 * @type {Array}
 */
var fx = []; //eslint-disable-line
/**
 * @type {{}}
 */
var grabs = {};
/**
 * @type {{description: string, favorite: boolean, guests: number, hostID: number, hostName: string, id: number, minChatLevel: number, name: string, population: number, slug: string, welcome: string}}
 */
var meta = {
    description: '',
    favorite: false,
    guests: 0,
    hostID: -1,
    hostName: '',
    id: -1,
    minChatLevel: 1,
    name: '',
    population: 0,
    slug: '',
    welcome: ''
};
/**
 * @type {{}}
 */
var mutes = {};
/**
 * @type {{historyID: string, media: {author: string, cid: string, duration: number, format: number, id: number, image: string, title: string}, playlistID: number, startTime: string}}
 */
var playback = {
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
/**
 * @type {{}}
 */
var mySelf = {};
/**
 * @type {number}
 */
var role = 0; //eslint-disable-line
/**
 * @type {Array}
 */
var users = [];
/**
 * @type {{}}
 */
var votes = {};

function User(data) {
    this.avatarID = data.avatarID ? data.avatarID : null;
    this.badge = data.badge ? data.badge : null;
    this.blurb = data.blurb ? data.blurb : undefined;
    this.gRole = data.gRole != null ? data.gRole : 0;
    this.grab = grabs[data.id] === 1;
    this.id = data.id ? data.id : -1;
    this.ignores = data.ignores ? data.ignores : undefined;
    this.joined = data.joined ? data.joined : '';
    this.language = data.language ? data.language : null;
    this.level = data.level ? data.level : 1;
    this.notifications = data.notifications ? data.notifications : undefined;
    this.pp = data.pp != null ? data.pp : undefined;
    this.pw = data.pw != null ? data.pw : undefined;
    this.role = data.role ? data.role : 0;
    this.slug = data.slug ? data.slug : null;
    this.status = data.status != null ? data.status : 1;
    this.sub = data.sub ? data.sub : 0;
    this.username = data.username ? data.username : '';
    this.vote = votes[data.id] != null ? votes[data.id] === -1 ? -1 : 1 : 0;
    this.xp = data.xp != null ? data.xp : undefined;
}

User.prototype.toString = function() {
    return this.username;
};

setInterval(function() {
    for (var i in mutes) {
        if (!mutes.hasOwnProperty(i)) continue;
        if (mutes[i] > 0) {
            mutes[i]--;
        }
    }
}, 1e3);

/**
 * Room data container
 * SHOULD NOT BE USED/ACCESSED DIRECTLY
 * @constructor
 */
var Room = function() {};

/**
 * Make an array of userIDs to an array of user objects
 * @param {Number[]} ids User IDs to convert to array.
 * @returns {User[]} An array of user objects
 */
Room.prototype.usersToArray = function(ids) {
    var user;
    var usersArray;
    usersArray = [];
    for (var i in ids) {
        if (!ids.hasOwnProperty(i)) continue;
        user = this.getUser(ids[i]);
        if (user != null) usersArray.push(user);
    }
    return usersArray;
};

/**
 * Implementation of plug.dj methods
 * Gets the permissions over another user by user object
 * @param {User} other The Other user to compare to
 * @returns {{canModChat: boolean, canModMute: boolean, canModBan: boolean, canModStaff: boolean}} an object of booleans for permissions
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

/**
 * Extend the User object
 * @param {PlugAPI} instance Instance of PlugAPI client
 */
Room.prototype.registerUserExtensions = function(instance) {
    //noinspection JSUnusedGlobalSymbols
    /**
     * Add the user to the waitlist
     */
    User.prototype.addToWaitList = function() {
        instance.moderateAddDJ(this.id);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Remove the user from the waitlist
     */
    User.prototype.removeFromWaitList = function() {
        instance.moderateRemoveDJ(this.id);
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Move the user to a new position in the waitlist
     * @param {Number} pos New position
     */
    User.prototype.moveInWaitList = function(pos) {
        instance.moderateMoveDJ(this.id, pos);
    };
};

//noinspection JSUnusedGlobalSymbols
/**
 * Implementation of plug.dj methods
 * Gets the permissions over another user by userID
 * @param {Number} [uid] Other User's ID.
 * @returns {{canModChat: boolean, canModMute: boolean, canModBan: boolean, canModStaff: boolean}} Object of booleans of permissions
 */
Room.prototype.getPermissionsID = function(uid) {
    return this.getPermissions(this.getUser(uid));
};

/**
 * Check if a user have a certain permission in the room staff
 * @param {Number|undefined} uid The User's ID. If not specified, use's bot's ID.
 * @param {Number} permission The Room Permission to check.
 * @returns {boolean} Returns true if user has permission specified. False if not.
 */
Room.prototype.haveRoomPermission = function(uid, permission) {
    var user = this.getUser(uid);
    return !(user == null || user.role < permission);
};

/**
 * Check if a user have a certain permission in the global staff (admins, ambassadors)
 * @param {Number|undefined} uid The User's ID. If not specified, use's bot's ID.
 * @param {Number} permission The Global Permission to check.
 * @returns {boolean} Returns true if user has global permission specified. False if not.
 */
Room.prototype.haveGlobalPermission = function(uid, permission) {
    var user = this.getUser(uid);
    return !(user == null || user.gRole < permission);
};

//noinspection JSUnusedGlobalSymbols
/**
 * Is user an ambassador?
 * Can only check users in the room
 * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
 * @returns {Boolean} returns true if user is an ambassador. False if not.
 */
Room.prototype.isAmbassador = function(uid) {
    if (!uid) {
        uid = mySelf.id;
    }
    return this.haveGlobalPermission(uid, 2) && !this.isAdmin(uid);
};

/**
 * Is user an admin?
 * Can only check users in the room
 * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
 * @returns {Boolean} Returns true if user is an admin. False if not.
 */
Room.prototype.isAdmin = function(uid) {
    if (!uid) {
        uid = mySelf.id;
    }
    return this.haveGlobalPermission(uid, 5);
};

//noinspection JSUnusedGlobalSymbols
/**
 * Is user staff?
 * Does not include global staff
 * Can only check users in the room
 * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
 * @returns {Boolean} Returns true if user is staff. False if not.
 */
Room.prototype.isStaff = function(uid) {
    if (!uid) {
        uid = mySelf.id;
    }
    return this.haveRoomPermission(uid, 1);
};

/**
 * Is user current DJ?
 * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
 * @returns {boolean} Returns true if user is DJing. False if not.
 */
Room.prototype.isDJ = function(uid) {
    if (!uid) {
        uid = mySelf.id;
    }
    return booth.currentDJ === uid;
};

/**
 * Is user in waitlist?
 * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
 * @returns {boolean} Returns true if the user is in waitlist. False if not.
 */
Room.prototype.isInWaitList = function(uid) {
    if (!uid) {
        uid = mySelf.id;
    }
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
        guests: 0,
        hostID: -1,
        hostName: '',
        id: -1,
        minChatLevel: 1,
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
    if (user.id === mySelf.id) return;

    // Don't add guests
    if (user.guest) {
        meta.guests += 1;
        return;
    }

    // Only add if the user doesn't exist
    if (this.getUser(user.id) === null) {
        users.push(user);
        meta.population = users.length + 1;
    }

    // Remove user from cache
    delete cacheUsers[booth.currentDJ];
};

/**
 * Remove an user
 * @param {Number} uid UserID
 */
Room.prototype.removeUser = function(uid) {
    // Remove guests
    if (uid === 0) {
        meta.guests = Math.max(0, meta.guests - 1);
        return;
    }

    for (var i in users) {
        if (!users.hasOwnProperty(i)) continue;
        if (users[i].id === uid) {
            // User found
            cacheUsers[uid] = users.splice(i, 1);
            meta.population = users.length + 1;
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
                if (j !== 'i') {
                    users[i][j] = data[j];
                }
            }
            return;
        }
    }
};

Room.prototype.isMuted = function(uid) {
    return mutes[uid] != null && mutes[uid] > 0;
};

/**
 * Set mySelf object
 * @param {Object} data Self data
 */
Room.prototype.setSelf = function(data) {
    mySelf = data;
};

/**
 * Set room data
 * @param {Object} data Room data
 */
Room.prototype.setRoomData = function(data) {
    //noinspection JSUnresolvedVariable
    booth = data.booth;
    //noinspection JSUnresolvedVariable
    fx = data.fx;
    grabs = data.grabs;
    meta = data.meta;
    //noinspection JSUnresolvedVariable
    mutes = data.mutes;
    //noinspection JSUnresolvedVariable
    playback = data.playback;
    mySelf.role = data.role;
    //noinspection JSUnresolvedVariable
    users = data.users;
    //noinspection JSUnresolvedVariable
    votes = data.votes;
};

Room.prototype.setBoothLocked = function(data) {
    booth.isLocked = data;
};

Room.prototype.setBoothCycle = function(cycle) {
    booth.shouldCycle = cycle;
};

Room.prototype.setDJs = function(djs) {
    booth.waitingDJs = djs;
};

Room.prototype.setMinChatLevel = function(level) {
    meta.minChatLevel = level;
};

Room.prototype.setRoomDescription = function(desc) {
    meta.description = desc;
};

Room.prototype.setRoomName = function(name) {
    meta.name = name;
};

Room.prototype.setRoomWelcome = function(welcome) {
    meta.welcome = welcome;
};

/**
 * Set the media object.
 * @param {Object} mediaInfo The Media Info
 * @param {String} mediaStartTime The Media starting time.
 */
Room.prototype.setMedia = function(mediaInfo, mediaStartTime) {
    votes = {};
    grabs = {};

    playback.media = mediaInfo;
    playback.startTime = mediaStartTime;
};

/**
 * @param {AdvanceEventObject} data Advance Event Object data
 */
Room.prototype.advance = function(data) {
    if (songHistory.length < 1) {
        setImmediate(this.advance, data);
        return;
    }

    songHistory[0].room = this.getRoomScore();

    this.setMedia(data.media, data.startTime);
    this.setDJs(data.djs);

    booth.currentDJ = data.currentDJ;
    playback.historyID = data.historyID;
    playback.playlistID = data.playlistID;

    var historyObj = {
        id: data.historyID,
        media: data.media,
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
        timestamp: data.startTime,
        user: {
            id: data.currentDJ,
            username: this.getUser(data.currentDJ) === null ? '' : this.getUser(data.currentDJ).username
        }
    };

    if (songHistory.unshift(historyObj) > 50) {
        songHistory.splice(50, songHistory.length - 50);
    }

    // Clear cache of users
    cacheUsers = {};
};

Room.prototype.muteUser = function(data) {
    //noinspection JSUnresolvedVariable
    switch (data.d) {
        // Unmute
        case 'o':
            mutes[data.i] = 0;
            break;
            // Short (15 minutes)
        case 's':
            mutes[data.i] = 900;
            break;
            // Medium (30 minutes)
        case 'm':
            mutes[data.i] = 1800;
            break;
            // Long (45 minutes)
        case 'l':
            mutes[data.i] = 2700;
            break;
        default:
            mutes[data.i] = null;
            break;
    }
};

Room.prototype.setGrab = function(uid) {
    grabs[uid] = 1;
};

Room.prototype.setVote = function(uid, vote) {
    votes[uid] = vote;
};

Room.prototype.setEarn = function(data) {
    mySelf.xp = data.xp;
    mySelf.ep = data.ep;
    mySelf.level = data.level;
};

/**
 * Get the user object for yourself
 * @returns {User} A User Object
 */
Room.prototype.getSelf = function() {
    return mySelf != null ? new User(mySelf) : null;
};

/**
 * Get specific user in the community
 * @param {Number} [uid] The User ID to lookup
 * @returns {User|null} A User Object or Null if can't be found
 */
Room.prototype.getUser = function(uid) {
    if (!uid || uid === mySelf.id) return this.getSelf();
    if (typeof uid === 'string') {
        uid = parseInt(uid, 10);
    }
    for (var i in users) {
        if (!users.hasOwnProperty(i)) continue;
        if (users[i].id === uid) return new User(users[i]);
    }
    return null;
};

/**
 * Get all users in the community
 * @returns {User[]} An array of users in room
 */
Room.prototype.getUsers = function() {
    return this.usersToArray([mySelf.id].concat((function() {
        var ids = [];
        for (var i in users) {
            if (!users.hasOwnProperty(i)) continue;
            ids.push(users[i].id);
        }
        return ids;
    })()));
};

/**
 * Get the current DJ
 * @returns {User|null} Current DJ or {null} if no one is currently DJing
 */
Room.prototype.getDJ = function() {
    if (booth.currentDJ > 0) {
        var user = this.getUser(booth.currentDJ);
        if (user !== null) {
            return user;
        }

        if (cacheUsers[booth.currentDJ] != null) {
            return new User(cacheUsers[booth.currentDJ]);
        }
    }
    return null;
};

/**
 * Get all DJs (including current DJ)
 * @returns {User[]} An Array of all DJs in the room and the current DJ.
 */
Room.prototype.getDJs = function() {
    return this.usersToArray([booth.currentDJ].concat(booth.waitingDJs));
};

/**
 * Get all DJs in waitlist
 * @returns {User[]}  An Array of all DJs in the room that are in waitlist
 */
Room.prototype.getWaitList = function() {
    return this.usersToArray(booth.waitingDJs);
};

/**
 * Get a user's position in waitlist
 * @param {Number} uid User ID
 * @returns {Number}
 * Position in waitlist.
 * If current DJ, it returns 0.
 * If not in waitlist, it returns -1
 */
Room.prototype.getWaitListPosition = function(uid) {
    if (booth.currentDJ === uid) {
        return 0;
    }
    var pos = booth.waitingDJs == null ? -1 : booth.waitingDJs.indexOf(uid);
    return pos < 0 ? -1 : pos + 1;
};

/**
 * Get admins in the room
 * @returns {Array} An Array of all admins in the room
 */
Room.prototype.getAdmins = function() {
    var admins = [];
    var reference = [mySelf].concat(users);
    for (var i in reference) {
        if (!reference.hasOwnProperty(i)) continue;
        var user = reference[i];
        if (user.gRole === 5) {
            admins.push(user.id);
        }
    }
    return this.usersToArray(admins);
};

/**
 * Get all ambassadors in the community
 * @returns {Array} An Array of all ambassadors in the room
 */
Room.prototype.getAmbassadors = function() {
    var ambassadors = [];
    var reference = [mySelf].concat(users);
    for (var i in reference) {
        if (!reference.hasOwnProperty(i)) continue;
        var user = reference[i];
        if (user.gRole < 5 && user.gRole > 1) {
            ambassadors.push(user.id);
        }
    }
    return this.usersToArray(ambassadors);
};

/**
 * Get users in the community that aren't DJing nor in the waitlist
 * @returns {Array} An array of all the users in room that are not DJing and not in the waitlist.
 */
Room.prototype.getAudience = function() {
    var audience = [];
    var reference = [mySelf].concat(users);
    for (var i in reference) {
        if (!reference.hasOwnProperty(i)) continue;
        var uid = reference[i].id;
        if (this.getWaitListPosition(uid) < 0) {
            audience.push(uid);
        }
    }
    return this.usersToArray(audience);
};

Room.prototype.getStaff = function() {
    var staff = [];
    var reference = [mySelf].concat(users);
    for (var i in reference) {
        if (!reference.hasOwnProperty(i)) continue;
        var user = reference[i];
        if (user.role > 0) {
            staff.push(user.id);
        }
    }
    return this.usersToArray(staff);
};

/**
 * Host if in community, otherwise null
 * @returns {User|null} Returns the host user object if they are in room, or null if there is none.
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

Room.prototype.setHistory = function(err, data) {
    if (!err) {
        songHistory = data;
    }
};

/**
 * Get the booth meta
 * @returns {booth} The booth meta in an object
 */
Room.prototype.getBoothMeta = function() {
    var result = objectAssign({}, booth);

    // Override ids with full user objects
    result.currentDJ = this.getDJ();
    result.waitingDJs = this.getWaitList();

    return result;
};

/**
 * Get the room meta
 * @returns {meta} The room meta in an object
 */
Room.prototype.getRoomMeta = function() {
    return objectAssign({}, meta);
};

/**
 * Get the room score
 * @returns {{positive: number, listeners: number, grabs: number, negative: number, skipped: number}} An object representing the room score.
 */
Room.prototype.getRoomScore = function() {
    var result = {
        positive: 0,
        listeners: Math.max(this.getUsers().length - 1, 0),
        grabs: 0,
        negative: 0,
        skipped: 0
    };
    var i;
    var reference = votes;
    for (i in reference) {
        if (!reference.hasOwnProperty(i)) continue;
        var vote = reference[i];
        if (vote > 0) {
            result.positive++;
        } else if (vote < 0) {
            result.negative++;
        }
    }
    var reference1 = grabs;
    for (i in reference1) {
        if (!reference1.hasOwnProperty(i)) continue;
        if (reference1[i] > 0) {
            result.grabs++;
        }
    }
    return result;
};

module.exports = Room;
