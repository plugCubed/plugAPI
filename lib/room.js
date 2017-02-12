'use strict';

const he = require('he');
let songHistory = [];

let cacheUsers = {};

/**
 * @private
 * @type {{currentDJ: number, isLocked: boolean, shouldCycle: boolean, waitingDJs: Array}}
 */
let booth = {
    currentDJ: -1,
    isLocked: false,
    shouldCycle: true,
    waitingDJs: []
};

/**
 * @private
 * @type {Array}
 */
let fx = []; // eslint-disable-line no-unused-vars

/**
 * @private
 * @type {{}}
 */
let grabs = {};

/**
 * @private
 * @type {{description: string, favorite: boolean, guests: number, hostID: number, hostName: string, id: number, minChatLevel: number, name: string, population: number, slug: string, welcome: string}}
 */
let meta = {
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
 * @private
 * @type {{}}
 */
let mutes = {};

/**
 * @private
 * @type {{historyID: string, media: {author: string, cid: string, duration: number, format: number, id: number, image: string, title: string}, playlistID: number, startTime: string}}
 */
let playback = {
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
 * @private
 * @type {{}}
 */
let mySelf = {};

/**
 * @private
 * @type {number}
 */
let role = 0; // eslint-disable-line no-unused-vars

/**
 * @private
 * @type {Array}
 */
let users = [];

/**
 * @private
 * @type {{}}
 */
let votes = {};

class User {
    constructor(data) {
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
        this.rawun = data.username ? data.username : '';
        this.role = data.role ? data.role : 0;
        this.silver = data.silver ? data.silver : false;
        this.slug = data.slug ? data.slug : null;
        this.status = data.status != null ? data.status : 1;
        this.sub = data.sub ? data.sub : 0;
        this.username = he.decode(data.username ? data.username : '');
        this.vote = votes[data.id] != null ? votes[data.id] === -1 ? -1 : 1 : 0;
        this.xp = data.xp != null ? data.xp : undefined;

    }

    toString() {
        return this.username;
    }
}

setInterval(() => {
    for (const i in mutes) {
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
class Room {

    /**
     * Make an array of userIDs to an array of user objects
     * @param {Number[]} ids User IDs to convert to array.
     * @returns {User[]} An array of user objects
     */
    usersToArray(ids) {
        let user;
        const usersArray = [];

        for (const i in ids) {
            if (!ids.hasOwnProperty(i)) continue;
            user = this.getUser(ids[i]);
            if (user != null) usersArray.push(user);
        }

        return usersArray;
    }

    /**
     * Implementation of plug.dj methods
     * Gets the permissions over another user by user object
     * @param {User} other The Other user to compare to
     * @returns {{canModChat: boolean, canModMute: boolean, canModBan: boolean, canModStaff: boolean}} an object of booleans for permissions
     */
    getPermissions(other) {
        const me = this.getSelf();

        const permissions = {
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
    }

    /**
     * Extend the User object
     * @param {PlugAPI} instance Instance of PlugAPI client
     */
    registerUserExtensions(instance) {}

    /**
     * Implementation of plug.dj methods
     * Gets the permissions over another user by userID
     * @param {Number} [uid] Other User's ID.
     * @returns {{canModChat: boolean, canModMute: boolean, canModBan: boolean, canModStaff: boolean}} Object of booleans of permissions
     */
    getPermissionsID(uid) {
        return this.getPermissions(this.getUser(uid));
    }

    /**
     * Check if a user have a certain permission in the room staff
     * @param {Number|undefined} uid The User's ID. If not specified, use's bot's ID.
     * @param {Number} permission The Room Permission to check.
     * @returns {boolean} Returns true if user has permission specified. False if not.
     */
    haveRoomPermission(uid, permission) {
        const user = this.getUser(uid);

        return !(user == null || user.role < permission);
    }

    /**
     * Check if a user have a certain permission in the global staff (admins, ambassadors)
     * @param {Number|undefined} uid The User's ID. If not specified, use's bot's ID.
     * @param {Number} permission The Global Permission to check.
     * @returns {boolean} Returns true if user has global permission specified. False if not.
     */
    haveGlobalPermission(uid, permission) {
        const user = this.getUser(uid);

        return !(user == null || user.gRole < permission);
    }

    /**
     * Is user an ambassador?
     * Can only check users in the room
     * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
     * @returns {Boolean} returns true if user is an ambassador. False if not.
     */
    isAmbassador(uid) {
        if (!uid) {
            uid = mySelf.id;
        }

        return this.haveGlobalPermission(uid, 2) && !this.isAdmin(uid);
    }

    /**
     * Is user an admin?
     * Can only check users in the room
     * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
     * @returns {Boolean} Returns true if user is an admin. False if not.
     */
    isAdmin(uid) {
        if (!uid) {
            uid = mySelf.id;
        }

        return this.haveGlobalPermission(uid, 5);
    }

    /**
     * Is user staff?
     * Does not include global staff
     * Can only check users in the room
     * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
     * @returns {Boolean} Returns true if user is staff. False if not.
     */
    isStaff(uid) {
        if (!uid) {
            uid = mySelf.id;
        }

        return this.haveRoomPermission(uid, 1);
    }

    /**
     * Is user current DJ?
     * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
     * @returns {boolean} Returns true if user is DJing. False if not.
     */
    isDJ(uid) {
        if (!uid) {
            uid = mySelf.id;
        }

        return booth.currentDJ === uid;
    }

    /**
     * Is user in waitlist?
     * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
     * @returns {boolean} Returns true if the user is in waitlist. False if not.
     */
    isInWaitList(uid) {
        if (!uid) {
            uid = mySelf.id;
        }

        return this.getWaitListPosition(uid) > 0;
    }

    /**
     * Reset all room variables
     */
    reset() {
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
    }

    /**
     * Add a new user
     * @param {Object} user User data
     */
    addUser(user) {

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
    }

    /**
     * Remove an user
     * @param {Number} uid UserID
     */
    removeUser(uid) {

        // Remove guests
        if (uid === 0) {
            meta.guests = Math.max(0, meta.guests - 1);

            return;
        }

        for (const i in users) {
            if (!users.hasOwnProperty(i)) continue;
            if (users[i].id === uid) {

                // User found
                cacheUsers[uid] = users.splice(i, 1);
                meta.population = users.length + 1;

                return;
            }
        }
    }

    /**
     * Update an user
     * @param {Object} data User data changes
     */
    updateUser(data) {
        for (const i in users) {
            if (!users.hasOwnProperty(i)) continue;
            if (users[i].id === data.i) {
                for (const j in data) {
                    if (!data.hasOwnProperty(j)) continue;
                    if (j !== 'i') {
                        users[i][j] = data[j];
                    }
                }

                return;
            }
        }
    }

    isMuted(uid) {
        return mutes[uid] != null && mutes[uid] > 0;
    }

    /**
     * Set mySelf object
     * @param {Object} data Self data
     */
    setSelf(data) {
        mySelf = data;
    }

    /**
     * Set room data
     * @param {Object} data Room data
     */
    setRoomData(data) {
        booth = data.booth;
        fx = data.fx;
        grabs = data.grabs;
        meta = data.meta;
        mutes = data.mutes;
        playback = data.playback;
        mySelf.role = data.role;
        users = data.users;
        votes = data.votes;
    }

    setBoothLocked(data) {
        booth.isLocked = data;
    }

    setBoothCycle(cycle) {
        booth.shouldCycle = cycle;
    }

    setDJs(djs) {
        booth.waitingDJs = djs;
    }

    setMinChatLevel(level) {
        meta.minChatLevel = level;
    }

    setRoomDescription(desc) {
        meta.description = desc;
    }

    setRoomName(name) {
        meta.name = name;
    }

    setRoomWelcome(welcome) {
        meta.welcome = welcome;
    }

    /**
     * Set the media object.
     * @param {Object} mediaInfo The Media Info
     * @param {String} mediaStartTime The Media starting time.
     */
    setMedia(mediaInfo, mediaStartTime) {
        votes = {};
        grabs = {};

        playback.media = mediaInfo;
        playback.startTime = mediaStartTime;
    }

    /**
     * @param {AdvanceEventObject} data Advance Event Object data
     */
    advance(data) {
        if (songHistory.length < 1) {
            setImmediate(this.advance.bind(this), data);

            return;
        }

        songHistory[0].room = this.getRoomScore();

        this.setMedia(data.media, data.startTime);
        this.setDJs(data.djs);

        booth.currentDJ = data.currentDJ;
        playback.historyID = data.historyID;
        playback.playlistID = data.playlistID;

        // Clear cache of users
        cacheUsers = {};
    }

    muteUser(data) {
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
    }

    setGrab(uid) {
        grabs[uid] = 1;
    }

    setVote(uid, vote) {
        votes[uid] = vote;
    }

    setEarn(data) {
        mySelf.xp = data.xp;
        mySelf.ep = data.ep;
        mySelf.level = data.level;
    }

    /**
     * Get the user object for yourself
     * @returns {User} A User Object
     */
    getSelf() {
        return mySelf != null ? new User(mySelf) : null;
    }

    /**
     * Get specific user in the community
     * @param {Number} [uid] The User ID to lookup
     * @returns {User|null} A User Object or Null if can't be found
     */
    getUser(uid) {
        if (!uid || uid === mySelf.id) return this.getSelf();
        if (typeof uid === 'string') {
            uid = parseInt(uid, 10);
        }
        for (const i in users) {
            if (!users.hasOwnProperty(i)) continue;
            if (users[i].id === uid) return new User(users[i]);
        }

        return null;
    }

    /**
     * Get all users in the community
     * @returns {User[]} An array of users in room
     */
    getUsers() {
        return this.usersToArray([mySelf.id].concat(((() => {
            const ids = [];

            for (const i in users) {
                if (!users.hasOwnProperty(i)) continue;
                ids.push(users[i].id);
            }

            return ids;
        }))()));
    }

    /**
     * Get the current DJ
     * @returns {User|null} Current DJ or {null} if no one is currently DJing
     */
    getDJ() {
        if (booth.currentDJ > 0) {
            const user = this.getUser(booth.currentDJ);

            if (user !== null) {
                return user;
            }

            if (cacheUsers[booth.currentDJ] != null) {
                return new User(cacheUsers[booth.currentDJ]);
            }
        }

        return null;
    }

    /**
     * Get all DJs (including current DJ)
     * @returns {User[]} An Array of all DJs in the room and the current DJ.
     */
    getDJs() {
        return this.usersToArray([booth.currentDJ].concat(booth.waitingDJs));
    }

    /**
     * Get all DJs in waitlist
     * @returns {User[]}  An Array of all DJs in the room that are in waitlist
     */
    getWaitList() {
        return this.usersToArray(booth.waitingDJs);
    }

    /**
     * Get a user's position in waitlist
     * @param {Number} uid User ID
     * @returns {Number}
     * Position in waitlist.
     * If current DJ, it returns 0.
     * If not in waitlist, it returns -1
     */
    getWaitListPosition(uid) {
        if (booth.currentDJ === uid) {
            return 0;
        }
        const pos = booth.waitingDJs == null ? -1 : booth.waitingDJs.indexOf(uid);

        return pos < 0 ? -1 : pos + 1;
    }

    /**
     * Get admins in the room
     * @returns {Array} An Array of all admins in the room
     */
    getAdmins() {
        const admins = [];
        const reference = [mySelf].concat(users);

        for (const i in reference) {
            if (!reference.hasOwnProperty(i)) continue;
            const user = reference[i];

            if (user.gRole === 5) {
                admins.push(user.id);
            }
        }

        return this.usersToArray(admins);
    }

    /**
     * Get all ambassadors in the community
     * @returns {Array} An Array of all ambassadors in the room
     */
    getAmbassadors() {
        const ambassadors = [];
        const reference = [mySelf].concat(users);

        for (const i in reference) {
            if (!reference.hasOwnProperty(i)) continue;
            const user = reference[i];

            if (user.gRole < 5 && user.gRole > 1) {
                ambassadors.push(user.id);
            }
        }

        return this.usersToArray(ambassadors);
    }

    /**
     * Get users in the community that aren't DJing nor in the waitlist
     * @returns {Array} An array of all the users in room that are not DJing and not in the waitlist.
     */
    getAudience() {
        const audience = [];
        const reference = [mySelf].concat(users);

        for (const i in reference) {
            if (!reference.hasOwnProperty(i)) continue;
            const uid = reference[i].id;

            if (this.getWaitListPosition(uid) < 0) {
                audience.push(uid);
            }
        }

        return this.usersToArray(audience);
    }

    getStaff() {
        const staff = [];
        const reference = [mySelf].concat(users);

        for (const i in reference) {
            if (!reference.hasOwnProperty(i)) continue;
            const user = reference[i];

            if (user.role > 0) {
                staff.push(user.id);
            }
        }

        return this.usersToArray(staff);
    }

    /**
     * Host if in community, otherwise null
     * @returns {User|null} Returns the host user object if they are in room, or null if there is none.
     */
    getHost() {
        return this.getUser(meta.hostID);
    }

    getMedia() {
        return playback.media;
    }

    getStartTime() {
        return playback.startTime;
    }

    getHistoryID() {
        return playback.historyID;
    }

    getHistory() {
        return songHistory;
    }

    setHistory(err, data) {
        if (!err) {
            songHistory = data;
        }
    }

    /**
     * Get the booth meta
     * @returns {booth} The booth meta in an object
     */
    getBoothMeta() {
        const result = Object.assign({}, booth);

        // Override ids with full user objects
        result.currentDJ = this.getDJ();
        result.waitingDJs = this.getWaitList();

        return result;
    }

    /**
     * Get the room meta
     * @returns {meta} The room meta in an object
     */
    getRoomMeta() {
        return Object.assign({}, meta);
    }

    /**
     * Get the room score
     * @returns {{positive: number, listeners: number, grabs: number, negative: number, skipped: number}} An object representing the room score.
     */
    getRoomScore() {
        const result = {
            positive: 0,
            listeners: Math.max(this.getUsers().length - 1, 0),
            grabs: 0,
            negative: 0,
            skipped: 0
        };
        let i;
        const reference = votes;

        for (i in reference) {
            if (!reference.hasOwnProperty(i)) continue;
            const vote = reference[i];

            if (vote > 0) {
                result.positive++;
            } else if (vote < 0) {
                result.negative++;
            }
        }
        const reference1 = grabs;

        for (i in reference1) {
            if (!reference1.hasOwnProperty(i)) continue;
            if (reference1[i] > 0) {
                result.grabs++;
            }
        }

        return result;
    }
}

/**
 * Extend the User object
 * @param {PlugAPI} instance Instance of PlugAPI client
 */
Room.prototype.registerUserExtensions = function(instance) {

    /**
     * Add the user to the waitlist
     * @memberof User
     */
    User.prototype.addToWaitList = function() {
        instance.moderateAddDJ(this.id);
    };

    /**
     * Remove the user from the waitlist
     * @memberof User
     */
    User.prototype.removeFromWaitList = function() {
        instance.moderateRemoveDJ(this.id);
    };

    /**
     * Move the user to a new position in the waitlist
     * @memberof User
     * @param {Number} pos New position
     */
    User.prototype.moveInWaitList = function(pos) {
        instance.moderateMoveDJ(this.id, pos);
    };
};

module.exports = Room;
