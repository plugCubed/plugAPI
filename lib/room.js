'use strict';

const plugMessageSplit = require('plug-message-split');
const constants = require('./constants.json');

/**
 * Represents a User. Note that some properties are only shown for the bot only and not other users.
 *
 * @param {Object} data Represents a user.
 * @param {String|null} [data.avatarID=null] The user's avatar ID.
 * @param {String|null} [data.badge=null] The user's badge ID.
 * @param {String|null} [data.blurb=undefined] The user's blurb from their profile page.
 * @param {Number} [data.gRole=0] The user's global role (0 if not a BA / Admin)
 * @param {Boolean} [data.grab=false] If the user has grabbed a song
 * @param {Number} [data.id=-1] The user's ID.
 * @param {Array} [data.ignores=[]] An array of users that are ignored. Only shown for the bot user.
 * @param {String} [data.joined=''] The time a user joined plug.dj as as string. Empty if not provided.
 * @param {String} [data.language=null] The user's language.
 * @param {Number} [data.level=1] The user's level. Only shown for the bot user.
 * @param {Array} [data.notifications=[]] The user's notifications. Only shown for the bot user.
 * @param {Number|null} [data.pp=undefined] The user's Plug Points. Only shown for the bot user.
 * @param {Boolean|null} [data.pw=undefined] Whether the bot user is signed in via password or not.
 * @param {String} [data.rawun=''] The user's username.
 * @param {Number} [data.role=0] The user's Role. See {@link PlugAPI.ROOM_ROLE} for more info.
 * @param {Boolean} [data.silver=false] Whether the user is a silver subscriber or not.
 * @param {String|null} [data.slug=null] The user's slug to be used in a profile. https://plug.dj/@/slug (only exists for level > 5)
 * @param {Number} [data.status=1] The user's status.
 * @param {Number} [data.sub=0] Whether the user is a gold subscriber or not.
 * @param {String} [data.username=''] The user's username with HTML entities decoded.
 * @param {Number} [data.vote=0] The user's current vote.
 * @param {Number|null} [data.xp=undefined] The user's XP. Only shown for the bot user.
 * @param {Room} instance The specific instance of the Room Class.
 *
 * @constructor
 */
class User {
    constructor(data, instance) {
        this.avatarID = data.avatarID ? data.avatarID : null;
        this.badge = data.badge ? data.badge : null;
        this.blurb = data.blurb ? data.blurb : undefined;
        this.gRole = data.gRole != null ? data.gRole : constants.GLOBAL_ROLES.NONE;
        this.grab = Object.is(instance.grabs[data.id], 1);
        this.id = data.id ? data.id : -1;
        this.ignores = data.ignores ? data.ignores : undefined;
        this.joined = data.joined ? data.joined : '';
        this.language = data.language ? data.language : null;
        this.level = data.level ? data.level : 1;
        this.notifications = data.notifications ? data.notifications : undefined;
        this.pp = data.pp != null ? data.pp : undefined;
        this.pw = data.pw != null ? data.pw : undefined;
        this.rawun = data.username ? data.username : '';
        this.role = data.role ? data.role : constants.ROOM_ROLE.NONE;
        this.silver = data.silver ? data.silver : false;
        this.slug = data.slug ? data.slug : null;
        this.status = data.status != null ? data.status : 1;
        this.sub = data.sub ? data.sub : 0;
        this.username = plugMessageSplit.unescape(data.username ? data.username : '');
        this.vote = instance.votes[data.id] != null ? Object.is(instance.votes[data.id], -1) ? -1 : 1 : 0;
        this.xp = data.xp != null ? data.xp : undefined;

    }
    mention() {
        return `@${this.username}`;
    }
    toString() {
        return this.username;
    }
}

/**
 * Room data container
 * SHOULD NOT BE USED/ACCESSED DIRECTLY
 * @constructor
 * @private
 */
class Room {
    constructor() {
        this.songHistory = [];
        this.cacheUsers = {};

        /**
        * @private
        * @type {{currentDJ: number, isLocked: boolean, shouldCycle: boolean, waitingDJs: Array}}
        */
        this.booth = {
            currentDJ: -1,
            isLocked: false,
            shouldCycle: true,
            waitingDJs: []
        };

        /**
        * @private
        * @type {Array}
        */
        this.fx = []; // eslint-disable-line no-unused-vars

        /**
         * @private
         * @type {{}}
         */
        this.grabs = {};

        /**
         * @private
         * @type {{description: string, favorite: boolean, guests: number, hostID: number, hostName: string, id: number, minChatLevel: number, name: string, population: number, slug: string, welcome: string}}
         */
        this.meta = {
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
        this.mutes = {};

        if (this.clearMuteInterval != null) clearInterval(this.clearMuteInterval);

        this.clearMuteInterval = setInterval(() => {
            const mutes = Object.keys(this.mutes);

            if (mutes.length > 0) {
                for (let i = 0; i < mutes.length; i++) {
                    if (this.mutes[i] > 0) {
                        this.mutes[i]--;
                    }
                }
            }
        }, 1e3);

        /**
         * @private
         * @type {{historyID: string, media: {author: string, cid: string, duration: number, format: number, id: number, image: string, title: string}, playlistID: number, startTime: string}}
         */
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

        /**
         * @private
         * @type {User}
         */
        this.mySelf = {};

        /**
         * @private
         * @type {number}
         */
        this.role = constants.ROOM_ROLE.NONE; // eslint-disable-line no-unused-vars

        /**
         * @private
         * @type {Object[]}
         */
        this.users = [];

        /**
         * @private
         * @type {{}}
         */
        this.votes = {};
    }

    /**
     * Make an array of userIDs to an array of user objects
     * @param {Number[]} ids User IDs to convert to array.
     * @returns {User[]} An array of user objects
     */
    usersToArray(ids) {
        let user;
        const usersArray = [];

        if (ids) {
            for (let i = 0; i < ids.length; i++) {
                user = this.getUser(ids[i]);
                if (user != null) usersArray.push(user);
            }
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

        if (Object.is(other, null) || Object.is(me, null)) return permissions;
        const isAdmin = Object.is(me.gRole, constants.GLOBAL_ROLES.ADMIN);
        const isGreaterRole = Math.max(me.role, me.gRole) > Math.max(other.role, other.gRole);

        if ((other.gRole < constants.GLOBAL_ROLES.MODERATOR && isGreaterRole) || isAdmin) {
            permissions.canModChat = true;
            permissions.canModBan = true;
            permissions.canModMute = true;
        }
        permissions.canModStaff = other.gRole < constants.GLOBAL_ROLES.ADMIN && (isGreaterRole || isAdmin);

        return permissions;
    }

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
            uid = this.mySelf.id;
        }

        return this.haveGlobalPermission(uid, constants.GLOBAL_ROLES.AMBASSADOR) && !this.isAdmin(uid);
    }

    /**
     * Is user an admin?
     * Can only check users in the room
     * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
     * @returns {Boolean} Returns true if user is an admin. False if not.
     */
    isAdmin(uid) {
        if (!uid) {
            uid = this.mySelf.id;
        }

        return this.haveGlobalPermission(uid, constants.GLOBAL_ROLES.ADMIN);
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
            uid = this.mySelf.id;
        }

        return this.haveRoomPermission(uid, constants.ROOM_ROLE.RESIDENTDJ);
    }

    /**
     * Is user current DJ?
     * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
     * @returns {boolean} Returns true if user is DJing. False if not.
     */
    isDJ(uid) {
        if (!uid) {
            uid = this.mySelf.id;
        }

        return Object.is(this.booth.currentDJ, uid);
    }

    /**
     * Is user in waitlist?
     * @param {Number} [uid] The User's ID. If not specified, use's bot's ID.
     * @returns {boolean} Returns true if the user is in waitlist. False if not.
     */
    isInWaitList(uid) {
        if (!uid) {
            uid = this.mySelf.id;
        }

        return this.getWaitListPosition(uid) > 0;
    }

    /**
     * Reset all room variables
     */
    reset() {
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
    }

    /**
     * Add a new user
     * @param {Object} user User data
     */
    addUser(user) {

        // Don't add yourself
        if (Object.is(user.id, this.mySelf.id)) return;

        // Don't add guests
        if (user.guest) {
            this.meta.guests += 1;

            return;
        }

        // Only add if the user doesn't exist
        if (Object.is(this.getUser(user.id), null)) {
            this.users.push(user);
            this.meta.population = this.users.length + 1;
        }

        // Remove user from cache
        delete this.cacheUsers[this.booth.currentDJ];
    }

    /**
     * Remove an user
     * @param {Number} uid UserID
     */
    removeUser(uid) {

        // Remove guests
        if (Object.is(uid, 0)) {
            this.meta.guests = Math.max(0, this.meta.guests - 1);

            return;
        }

        const users = Object.keys(this.users);

        for (let i = 0; i < users.length; i++) {
            if (Object.is(this.users[i].id, uid)) {

                // User found
                this.cacheUsers[uid] = this.users.splice(i, 1);
                this.meta.population = this.users.length + 1;

                if (this.votes[uid]) delete this.votes[uid];
                if (this.grabs[uid]) delete this.grabs[uid];

                return;
            }
        }
    }

    /**
     * Update an user
     * @param {Object} data User data changes
     */
    updateUser(data) {
        const users = Object.keys(this.users);
        const dataLoop = (i, userData, isSelf) => {
            for (const j in userData) {
                if (!userData.hasOwnProperty(j)) continue;
                if (!Object.is(j, 'i')) {
                    if (isSelf) {
                        this.mySelf[j] = userData[j];
                    } else {
                        this.users[i][j] = userData[j];
                    }
                }
            }
        };

        for (let i = 0; i < users.length; i++) {
            if (Object.is(this.users[i].id, data.i)) {
                dataLoop(i, data);

                return;
            } else if (Object.is(this.mySelf.id, data.i)) {
                dataLoop(i, data, true);

                return;
            }
        }
    }

    /**
    * Is user muted?
    * @param {Number} uid The user's id to check if they are muted
    * @returns {Boolean} True if muted, false if not.
    */

    isMuted(uid) {
        return this.mutes[uid] != null && this.mutes[uid] > 0;
    }

    /**
     * Set mySelf object
     * @param {Object} data Self data
     */
    setSelf(data) {
        this.mySelf = data;
    }

    /**
     * Set room data
     * @param {Object} data Room data
     */
    setRoomData(data) {
        this.booth = data.booth;
        this.fx = data.fx;
        this.grabs = data.grabs;
        this.meta = data.meta;
        this.mutes = data.mutes;
        this.playback = data.playback;
        this.mySelf.role = data.role;
        this.users = data.users;
        this.votes = data.votes;
    }

    setBoothLocked(data) {
        this.booth.isLocked = data;
    }

    setBoothCycle(cycle) {
        this.booth.shouldCycle = cycle;
    }

    setDJs(djs) {
        this.booth.waitingDJs = djs;
    }

    setMinChatLevel(level) {
        this.meta.minChatLevel = level;
    }

    setRoomDescription(desc) {
        this.meta.description = desc;
    }

    setRoomName(name) {
        this.meta.name = name;
    }

    setRoomWelcome(welcome) {
        this.meta.welcome = welcome;
    }

    /**
     * Set the media object.
     * @param {Object} mediaInfo The Media Info
     * @param {String} mediaStartTime The Media starting time.
     */
    setMedia(mediaInfo, mediaStartTime) {
        this.votes = {};
        this.grabs = {};

        this.playback.media = mediaInfo;
        this.playback.startTime = mediaStartTime;
    }

    /**
     * @param {AdvanceEventObject} data Advance Event Object data
     */
    advance(data) {
        if (this.songHistory.length < 1) {
            setImmediate(this.advance.bind(this), data);

            return;
        }

        this.songHistory[0].room = this.getRoomScore();

        this.setMedia(data.media, data.startTime);
        this.setDJs(data.djs);

        this.booth.currentDJ = data.currentDJ;
        this.playback.historyID = data.historyID;
        this.playback.playlistID = data.playlistID;

        // Clear cache of users
        this.cacheUsers = {};
    }

    muteUser(data) {
        switch (data.d) {

            // Unmute
            case 'o':
                this.mutes[data.i] = 0;
                break;

                // Short (15 minutes)
            case 's':
                this.mutes[data.i] = 900;
                break;

                // Medium (30 minutes)
            case 'm':
                this.mutes[data.i] = 1800;
                break;

                // Long (45 minutes)
            case 'l':
                this.mutes[data.i] = 2700;
                break;
            default:
                this.mutes[data.i] = null;
                break;
        }
    }

    setGrab(uid) {
        this.grabs[uid] = 1;
    }

    setVote(uid, vote) {
        this.votes[uid] = vote;
    }

    setEarn(data) {
        if (isFinite(data.xp) && data.xp > 0) {
            this.mySelf.xp = data.xp;
        }
        if ((isFinite(data.pp) && data.pp > 0) || (isFinite(data) && data > 0)) {
            this.mySelf.pp = data.pp || data;
        }
        if (isFinite(data.level) && data.level > 0) {
            this.mySelf.level = data.level;
        }
    }

    /**
     * Get the user object for yourself
     * @returns {User} A User Object
     */
    getSelf() {
        return this.mySelf != null ? new User(this.mySelf, this) : null;
    }

    /**
     * Get specific user in the community
     * @param {Number} [uid] The User ID to lookup
     * @returns {User|null} A User Object or Null if can't be found
     */
    getUser(uid) {
        if (!uid || Object.is(uid, this.mySelf.id)) return this.getSelf();
        if (Object.is(typeof uid, 'string')) {
            uid = parseInt(uid, 10);
        }
        const users = Object.keys(this.users);

        for (let i = 0; i < users.length; i++) {
            if (Object.is(this.users[i].id, uid)) return new User(this.users[i], this);
        }

        return null;
    }

    /**
     * Get all users in the community
     * @returns {User[]} An array of users in room
     */
    getUsers() {
        return this.usersToArray([this.mySelf.id].concat(((() => {
            const ids = [];
            const users = Object.keys(this.users);

            for (let i = 0; i < users.length; i++) {
                ids.push(this.users[i].id);
            }

            return ids;
        }))()));
    }

    /**
     * Get the current DJ
     * @returns {User|null} Current DJ or {null} if no one is currently DJing
     */
    getDJ() {
        if (this.booth.currentDJ > 0) {
            const user = this.getUser(this.booth.currentDJ);

            if (!Object.is(user, null)) {
                return user;
            }

            if (this.cacheUsers[this.booth.currentDJ] != null) {
                return new User(this.cacheUsers[this.booth.currentDJ], this);
            }
        }

        return null;
    }

    /**
     * Get all DJs (including current DJ)
     * @returns {User[]} An Array of all DJs in the room and the current DJ.
     */
    getDJs() {
        if (this.booth.currentDJ == null || this.booth.waitingDJs == null) {
            return [];
        }

        return this.usersToArray([this.booth.currentDJ].concat(this.booth.waitingDJs));
    }

    /**
     * Get all DJs in waitlist
     * @returns {User[]}  An Array of all DJs in the room that are in waitlist
     */
    getWaitList() {
        if (this.booth.waitingDJs == null) {
            return [];
        }

        return this.usersToArray(this.booth.waitingDJs);
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
        if (Object.is(this.booth.currentDJ, uid)) {
            return 0;
        }
        const pos = this.booth.waitingDJs == null ? -1 : this.booth.waitingDJs.indexOf(uid);

        return pos < 0 ? -1 : pos + 1;
    }

    /**
     * Get admins in the room
     * @returns {Array} An Array of all admins in the room
     */
    getAdmins() {
        const admins = [];
        const reference = [this.mySelf].concat(this.users);
        const references = Object.keys(reference);

        for (let i = 0; i < references.Length; i++) {
            if (Object.is(reference[i].gRole, constants.GLOBAL_ROLES.ADMIN)) {
                admins.push(reference[i].id);
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
        const reference = [this.mySelf].concat(this.users);
        const references = Object.keys(reference);

        for (let i = 0; i < references.Length; i++) {
            if (Object.is(reference[i].gRole, constants.GLOBAL_ROLES.AMBASSADOR)) {
                ambassadors.push(reference[i].id);
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
        const reference = [this.mySelf].concat(this.users);
        const references = Object.keys(reference);

        for (let i = 0; i < references.length; i++) {
            const uid = reference[i].id;

            if (this.getWaitListPosition(uid) < 0) {
                audience.push(uid);
            }
        }

        return this.usersToArray(audience);
    }

    getStaff() {
        const staff = [];
        const reference = [this.mySelf].concat(this.users);
        const references = Object.keys(reference);

        for (let i = 0; i < references.length; i++) {
            const user = reference[i];

            if (user.role > constants.ROOM_ROLE.NONE) {
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
        return this.getUser(this.meta.hostID);
    }

    getMedia() {
        return this.playback.media;
    }

    getStartTime() {
        return this.playback.startTime;
    }

    getHistoryID() {
        return this.playback.historyID;
    }

    getHistory() {
        return this.songHistory;
    }

    setHistory(err, data) {
        if (!err) {
            this.songHistory = data;
        }
    }

    /**
     * Get the booth meta
     * @returns {booth} The booth meta in an object
     */
    getBoothMeta() {
        const result = Object.assign({}, this.booth);

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
        return Object.assign({}, this.meta);
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
        const votesData = Object.keys(this.votes);
        const grabsData = Object.keys(this.grabs);

        for (i = 0; i < votesData.length; i++) {
            if (this.votes[votesData[i]] > 0) {
                result.positive++;
            } else if (this.votes[votesData[i]] < 0) {
                result.negative++;
            }
        }

        for (i = 0; i < grabsData.length; i++) {
            if (this.grabs[grabsData[i]] > 0) {
                result.grabs++;
            }
        }

        return result;
    }
    registerUserExtensions(instance) {

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
    }
}
module.exports = Room;
