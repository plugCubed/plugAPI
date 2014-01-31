var songHistory = [];

var Room = function() {
    var _this = this;

    function __bind(fn, me) {
        return function() {
            return fn.apply(me, arguments);
        };
    };

    this.User = function(data) {
        this.avatarID = data.avatarID ? data.avatarID : '';
        this.curated = _this.media.stats.curates[data.id] === true ? true : false;
        this.curatorPoints = data.curatorPoints ? data.curatorPoints : 0;
        this.dateJoined = data.dateJoined ? data.dateJoined : '';
        this.djPoints = data.djPoints ? data.djPoints : 0;
        this.fans = data.fans ? data.fans : 0;
        this.id = data.id ? data.id : '';
        this.language = data.language ? data.language : '';
        this.listenerPoints = data.listenerPoints ? data.listenerPoints : 0;
        this.permission = _this.adminIds[data.id] !== undefined ? 10 : _this.isAmbassador(data.id) ? _this.ambassadorIds[data.id] : _this.isStaff(data.id) ? _this.staffIds[data.id] : 0;
        this.status = data.status ? data.status : 0;
        this.username = data.username ? data.username : '';
        this.vote = _this.media.stats.votes[data.id] !== undefined ? _this.media.stats.votes[data.id] === 'woot' ? 1 : -1 : 0;
    };

    this.User.prototype.toString = function() {
        return this.username;
    }

    this.getRoomScore = __bind(this.getRoomScore, this);
    this.getMedia = __bind(this.getMedia, this);
    this.getMediaStartTime = __bind(this.getMediaStartTime, this);
    this.getWaitlist = __bind(this.getWaitlist, this);
    this.getHost = __bind(this.getHost, this);
    this.getAdmins = __bind(this.getAdmins, this);
    this.getStaff = __bind(this.getStaff, this);
    this.getAmbassadors = __bind(this.getAmbassadors, this);
    this.getAudience = __bind(this.getAudience, this);
    this.getDJ = __bind(this.getDJ, this);
    this.getDJs = __bind(this.getDJs, this);
    this.getSelf = __bind(this.getSelf, this);
    this.getUser = __bind(this.getUser, this);
    this.getUsers = __bind(this.getUsers, this);
    this.logVote = __bind(this.logVote, this);
    this.setPermissions = __bind(this.setPermissions, this);
    this.setMedia = __bind(this.setMedia, this);
    this.setDjs = __bind(this.setDjs, this);
    this.setSelf = __bind(this.setSelf, this);
    this.setOwner = __bind(this.setOwner, this);
    this.setAdmins = __bind(this.setAdmins, this);
    this.setStaff = __bind(this.setStaff, this);
    this.setUsers = __bind(this.setUsers, this);
    this.remUser = __bind(this.remUser, this);
    this.addUser = __bind(this.addUser, this);
    this.reset = __bind(this.reset, this);
    this.isStaff = __bind(this.isStaff, this);

    this.users = {};
    this.staffIds = {};
    this.ambassadorIds = {};
    this.adminIds = {};
    this.ownerId = '';
    this.self = {};
    this.djs = {};
    this.media = {
        info: {},
        stats: {
            votes: {},
            curates: {}
        }
    };
}


Room.prototype.usersToArray = function(usersObj) {
    var id, user, users;
    users = [];
    for (id in usersObj) {
        user = new this.User(usersObj[id]);
        users.push(user);
    }
    return users;
};

Room.prototype.isAmbassador = function(userid) {
    return this.ambassadorIds[userid] != null;
};

Room.prototype.isStaff = function(userid) {
    return this.staffIds[userid] != null;
};


Room.prototype.reset = function() {
    this.users = {};
    this.djs = {};
    this.media = {
        info: {},
        stats: {
            votes: {},
            curates: {}
        }
    };
    this.staffIds = {};
    return this.ownerId = '';
};

Room.prototype.addUser = function(user) {
    this.users[user.id] = user;
    if (this.isStaff(user.id))
        return this.users[user.id]['permission'] = this.staffIds[user.id];
    else
        return this.users[user.id]['permission'] = 0;
};

Room.prototype.remUser = function(user) {
    return delete this.users[user.id];
};

Room.prototype.updateUser = function(user) {
    this.users[user.id] = user;
}

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
    this.staffIds = ids;
    return this.setPermissions();
};

Room.prototype.setAmbassadors = function(ids) {
    this.ambassadorIds = ids;
    return this.setPermissions();
}

Room.prototype.setAdmins = function(ids) {
    return this.adminIds = ids;
};

Room.prototype.setOwner = function(ownerId) {
    return this.ownerId = ownerId;
};

Room.prototype.setSelf = function(user) {
    return this.self = user;
};

Room.prototype.setDjs = function(djs) {
    var dj, _i, _len, _results;
    this.djs = {};
    _results = [];
    for (_i = 0, _len = djs.length; _i < _len; _i++) {
        dj = djs[_i];
        _results.push(this.djs[dj.user.id] = dj.user);
    }
    return _results;
};

Room.prototype.setMedia = function(mediaInfo, mediaStartTime, votes, curates) {
    var id, val, vote, _results;
    if (votes == null)
        votes = {};
    if (curates == null)
        curates = {};
    this.media = {
        info: mediaInfo,
        startTime: mediaStartTime,
        stats: {
            votes: {},
            curates: {}
        }
    };
    for (id in votes) {
        vote = votes[id];
        this.media.stats.votes[id] = vote === 1 ? 'woot' : 'meh';
    }
    _results = [];
    for (id in curates) {
        val = curates[id];
        _results.push(this.media.stats.curates[id] = val);
    }
    if (songHistory.unshift(this.media) > 50)
        songHistory.splice(50, songHistory.length - 50);
    return _results;
};

Room.prototype.setPermissions = function() {
    var id, user, _ref, _results;
    _ref = this.users;
    _results = [];
    for (id in _ref) {
        user = _ref[id];
        if (this.isAmbassador(id))
            _results.push(this.users[id]['permission'] = this.ambassadorIds[id]);
        else if (this.isStaff(id))
            _results.push(this.users[id]['permission'] = this.staffIds[id]);
        else
            _results.push(this.users[id]['permission'] = 0);
    }
    return _results;
};

Room.prototype.logVote = function(voterId, vote) {
    if (vote === 'woot' || vote === 'meh')
        return this.media.stats.votes[voterId] = vote;
    else if (vote === 'curate')
        return this.media.stats.curates[voterId] = vote;
};

Room.prototype.getUsers = function() {
    return this.usersToArray(this.users);
};

Room.prototype.getUser = function(userId) {
    if (!userId) userId = this.self.id;
    if (this.users[userId] != null)
        return new this.User(this.users[userId]);
};

Room.prototype.getSelf = function() {
    if (this.self != null)
        return this.getUser();
};

Room.prototype.getDJ = function() {
    if (this.getDJs().length > 0)
        return new this.User(this.getDJs()[0]);
    return null;
};


Room.prototype.getDJs = function() {
    return this.usersToArray(this.djs);
};

Room.prototype.getAudience = function() {
    var audience, id, user, _ref;
    audience = [];
    _ref = this.users;
    for (id in _ref) {
        user = _ref[id];
        if (__indexOf.call(Object.keys(this.djs), id) < 0)
            audience.push(new this.User(user));
    }
    return audience;
};

Room.prototype.getAmbassadors = function() {
    var ambassadors, id, user, _ref;
    ambassadors = [];
    _ref = this.users;
    for (id in _ref) {
        user = _ref[id];
        if (user.ambassador)
            ambassdors.push(new this.User(user));
    }
    return ambassadors;
};

Room.prototype.getStaff = function() {
    var id, staff, user, _ref;
    staff = [];
    _ref = this.users;
    for (id in _ref) {
        user = _ref[id];
        if (id in this.staffIds)
            staff.push(new this.User(user));
    }
    return staff;
};

Room.prototype.getAdmins = function() {
    var admins, id, user, _ref;
    admins = [];
    _ref = this.users;
    for (id in _ref) {
        user = _ref[id];
        if (id in this.adminIds)
            admins.push(new this.User(user));
    }
    return admins;
};

Room.prototype.getHost = function() {
    var id, user, _ref;
    _ref = this.users;
    for (id in _ref) {
        user = _ref[id];
        if (id === this.ownerId)
            return new this.User(user);
    }
    return null;
};

Room.prototype.getWaitlist = function() {
    return this.usersToArray(this.djs).splice(1);
};

Room.prototype.getWaitListPosition = function(userid) {
    var waitlist = this.getWaitlist(),
        spot = 0;
    for (var i in waitlist) {
        if (waitlist[i].id === userid)
            return spot;
        spot++;
    }
    return -1;
};

Room.prototype.getMedia = function() {
    return this.media.info;
};

Room.prototype.getMediaStartTime = function() {
    return this.media.startTime;
};

Room.prototype.getHistory = function() {
    return songHistory;
};

Room.prototype.setHistory = function(data) {
    songHistory = data;
};

Room.prototype.getRoomScore = function() {
    var curates, id, mehs, val, vote, woots, _ref, _ref1;
    woots = mehs = curates = 0;
    _ref = this.media.stats.votes;
    for (id in _ref) {
        vote = _ref[id];
        if (vote === 'woot')
            woots++;
        if (vote === 'meh')
            mehs++;
    }
    _ref1 = this.media.stats.curates;
    for (id in _ref1) {
        val = _ref1[id];
        curates++;
    }
    return {
        'curates': curates,
        'negative': mehs,
        'positive': woots
    };
};

module.exports = Room;