var Service = Class.extend({
    init: function () {
        this.transactionCallback = this.errorCallback = this.successCallback = void 0;
        this._id = TransactionManager.add(this)
    },
    execute: function () {},
    parse: function () {},
    onResult: function (a) {
        this.parse(a);
        this.cleanup()
    },
    onFault: function (a) {
        this.onStatusError(15);
        var b = "",
            c;
        for (c in a) b += c + " = " + a[c] + "\n";
        console.log(b);
        console.log("Server Error ==> ", a);
        this.cleanup()
    },
    onStatusError: function (a) {
        console.error("onStatusError ==> ", a);
        void 0 != this.errorCallback && this.errorCallback(a)
    },
    onServerError: function (a) {
        void 0 != this.errorCallback && this.errorCallback(a.status);
        this.cleanup()
    },
    cleanup: function () {
        this.successCallback = this.errorCallback = void 0;
        void 0 != this.transactionCallback && this.transactionCallback();
        this.transactionCallback = void 0
    }
}),
    DurationMismatchService = Service.extend({
        init: function () {
            this._super()
        },
        execute: function () {
            rpcGW.execute("duration.mismatch", this)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    DurationUpdateService = Service.extend({
        init: function (a,
        b, c) {
            this._super();
            this.auth = a;
            this.cid = b;
            this.duration = c
        },
        execute: function () {
            rpcGW.execute("duration.update", this, this.auth, this.cid, this.duration)
        },
        parse: function (a) {
            this.duration = this.cid = this.auth = null;
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    HistorySelectService = Service.extend({
        init: function () {
            this._super()
        },
        execute: function () {
            rpcGW.execute("history.select", this)
        },
        parse: function (a) {
            if (0 == a.status) {
                for (var b = a.data.length; b--;) Utils.deserializeHistoryItem(a.data[b]);
                this.successCallback(a.data)
            } else this.onStatusError(a.status)
        }
    }),
    APIDispatcher = EventDispatcher.extend({
        init: function () {
            this._super();
            this.CHAT = "chat";
            this.USER_SKIP = "userSkip";
            this.USER_JOIN = "userJoin";
            this.USER_LEAVE = "userLeave";
            this.USER_FAN = "userFan";
            this.FRIEND_JOIN = "friendJoin";
            this.FAN_JOIN = "fanJoin";
            this.VOTE_UPDATE = "voteUpdate";
            this.CURATE_UPDATE = "curateUpdate";
            this.ROOM_SCORE_UPDATE = "roomScoreUpdate";
            this.DJ_ADVANCE = "djAdvance";
            this.DJ_UPDATE = "djUpdate";
            this.VOTE_SKIP = "voteSkip";
            this.MOD_SKIP = "modSkip";
            this.WAIT_LIST_UPDATE = "waitListUpdate"
        },
        getUsers: function () {
            if (this.isReady) try {
                return Models.room.getUsers()
            } catch (a) {
                console.error(a)
            }
            return []
        },
        getUser: function (a) {
            if (this.isReady) try {
                return Models.room.getUserByID(a)
            } catch (b) {
                console.error(b)
            }
            return {}
        },
        getSelf: function () {
            if (this.isReady) try {
                return Models.room.getUserByID(Models.user.data.id)
            } catch (a) {
                console.error(a)
            }
            return {}
        },
        getAudience: function () {
            if (this.isReady) try {
                return Models.room.getAudience()
            } catch (a) {
                console.error(a)
            }
            return []
        },
        getDJs: function () {
            if (this.isReady) try {
                return Models.room.getDJs()
            } catch (a) {
                console.error(a)
            }
            return []
        },
        getStaff: function () {
            if (this.isReady) try {
                return Models.room.getStaff()
            } catch (a) {
                console.error(a)
            }
            return []
        },
        getAdmins: function () {
            if (this.isReady) try {
                return Models.room.getSuperUsers()
            } catch (a) {
                console.error(a)
            }
            return []
        },
        getAmbassadors: function () {
            if (this.isReady) try {
                return Models.room.getAmbassadors()
            } catch (a) {
                console.error(a)
            }
            return []
        },
        getHost: function () {
            if (this.isReady) try {
                return Models.room.getHost(id)
            } catch (a) {
                console.error(a)
            }
            return {}
        },
        getMedia: function () {
            return this.isReady ? Models.room.data.media : null
        },
        getWaitList: function () {
            if (this.isReady) try {
                return Models.room.getWaitList()
            } catch (a) {
                console.error(a)
            }
            return []
        },
        getRoomScore: function () {
            return this.isReady ? Models.room.roomScore : {}
        },
        sendChat: function (a) {
            if (this.isReady) try {
                Models.chat.sendChat(a)
            } catch (b) {
                console.error(b)
            }
        },
        waitListJoin: function () {
            if (this.isReady) try {
                if (5 == Models.room.data.djs.length && Models.room.data.waitListEnabled && (!Models.room.data.boothLocked || Models.user.hasPermission(Models.user.MANAGER)) && null == Models.room.getWaitListPosition()) Room.onWaitListJoinClick()
            } catch (a) {
                console.error(a)
            }
        },
        waitListLeave: function () {
            if (this.isReady) try {
                if (!Models.room.userInBooth && Models.room.data.waitListEnabled && null != Models.room.getWaitListPosition()) Room.onWaitListLeaveConfirm()
            } catch (a) {
                console.error(a)
            }
        },
        moderateForceSkip: function () {
            if (this.isReady) try {
                Models.user.hasPermission(Models.user.BOUNCER) && new ModerationForceSkipService(Models.room.data.historyID)
            } catch (a) {
                console.error(a)
            }
        },
        moderateAddDJ: function (a) {
            if (this.isReady) try {
                Models.user.hasPermission(Models.user.BOUNCER) && a != Models.user.data.id && !Models.room.djHash[a] && new ModerationAddDJService(a)
            } catch (b) {
                console.error(b)
            }
        },
        moderateRemoveDJ: function (a) {
            if (this.isReady) try {
                Models.user.hasPermission(Models.user.BOUNCER) && a != Models.user.data.id && Models.room.djHash[a] && new ModerationRemoveDJService(a)
            } catch (b) {
                console.error(b)
            }
        },
        moderateKickUser: function (a, b) {
            if (this.isReady) try {
                var c = this.getUser(a);
                Models.user.hasPermission(Models.user.BOUNCER) && a != Models.user.data.id && !c.owner && !c.admin && !c.ambassador && (b ? new ModerationKickUserService(a, b, 60) : Dialog.moderateUser(c, !1))
            } catch (d) {
                console.error(d)
            }
        },
        moderateBanUser: function (a,
        b) {
            if (this.isReady) try {
                var c = this.getUser(a);
                Models.user.hasPermission(Models.user.BOUNCER) && a != Models.user.data.id && !c.owner && !c.admin && !c.ambassador && (b ? new ModerationKickUserService(a, b, -1) : Dialog.moderateUser(c, !0))
            } catch (d) {
                console.error(d)
            }
        },
        moderateDeleteChat: function (a) {
            if (this.isReady) try {
                a && Models.user.hasPermission(Models.user.BOUNCER) && new ModerationChatDeleteService(a)
            } catch (b) {
                console.error(b)
            }
        },
        moderateSetRole: function (a, b) {
            if (this.isReady) try {
                a && !isNaN(b) && -1 < b && 5 > b && (Models.room.admins[Models.user.data.id] || Models.room.ambassadors[Models.user.data.id] && !Models.room.data.staff[a] || Models.user.hasPermission(Models.user.MANAGER) && (!Models.room.data.staff[a] || Models.room.data.staff[a] < Models.room.data.staff[Models.user.data.id])) && new ModerationPermissionsService(a, b)
            } catch (c) {
                console.error(c)
            }
        },
        delayDispatch: function (a, b) {
            this.isReady && this.__events[a] && setTimeout(function () {
                API.dispatchEvent(a, b);
                a = b = null
            }, 1E3)
        }
    }),
    GAETransactionManager = Class.extend({
        init: function () {
            this.queue = [];
            this.startTime = this.timeoutID = this.count = 0
        },
        reset: function () {
            for (var a = this.queue.length; a--;) this.queue[a].transactionCallback = null;
            this.queue = [];
            clearTimeout(this.timeoutID)
        },
        add: function (a) {
            this.addToQueue(a);
            return ++this.count
        },
        addToQueue: function (a) {
            0 == this.queue.length && (this.timeoutID = setTimeout($.proxy(this.onTimeoutComplete, this), 10));
            this.queue.push(a)
        },
        onTimeoutComplete: function () {
            clearTimeout(this.timeoutID);
            $("body").addClass("server-busy");
            var a = this.queue[0];
            a.transactionCallback = $.proxy(this.onTransactionComplete,
            this);
            a.execute()
        },
        onTransactionComplete: function () {
            $("body").removeClass("server-busy");
            this.queue.shift();
            0 < this.queue.length && (this.timeoutID = setTimeout($.proxy(this.onTimeoutComplete, this), 10))
        }
    }),
    WindowMessageListener = Class.extend({
        init: function () {
            this.ytOrigin = "http://pdj-youtube.appspot.com";
            this.ytSource = null;
            this.ytDuration = 0;
            window.addEventListener("message", $.proxy(this.rx, this), !1)
        },
        rx: function (a) {
            if (a.origin === this.ytOrigin) if ("playbackReady" == a.data) this.ytSource = a.source, this.ytOrigin = a.origin, Playback.player = !0;
            else if (0 == a.data.indexOf("onPlayerError")) Playback.onYTPlayerError(a.data.split("=").pop());
            else "playbackComplete" == a.data ? Playback.playbackComplete() : 0 == a.data.indexOf("durationCheck") && Playback.durationCheck(parseInt(a.data.split("=").pop()))
        },
        ytx: function (a) {
            this.ytSource && this.ytSource.postMessage(a, this.ytOrigin)
        }
    }),
    socket, Socket = Class.extend({
        init: function (a) {
            this.url = a;
            this.sockjs = new SockJS(this.url);
            this.sockjs.onopen = $.proxy(this.open, this);
            this.sockjs.onclose = $.proxy(this.close, this);
            this.sockjs.onmessage = $.proxy(this.message, this);
            this.rpcs = {};
            this._rpc_id = 1
        },
        send: function (a) {
            this.sockjs.send(JSON.stringify(a))
        },
        open: function () {
            this.backoff = 0;
            var a = null,
                a = Slug;
            Models.room.data.id && (a = Models.room.data.id);
            console.log("open!", a);
            a = new RoomJoinService(a);
            a.successCallback = function () {};
            a.errorCallback = function () {
                console.log("boom time")
            }
        },
        close: function (a) {
            a && a.wasClean ? alert("This session has now ended. Goodbye.") : (console.info("closing", a), a = this.backoff,
            5 >= a && (a += 1), socketInit(a))
        },
        execute: function (a, b) {
            var c = Array.prototype.slice.call(arguments).slice(2),
                d = this._rpc_id++;
            this.rpcs[d] = b;
            this.send({
                type: "rpc",
                id: d,
                name: a,
                args: c
            })
        },
        chat: function (a) {
            this.send({
                type: "chat",
                msg: a,
                chatID: Math.floor(4294967295 * Math.random()).toString(16)
            })
        },
        message: function (a) {
            a = JSON.parse(a.data);
            if (a.type && "rpc" === a.type) {
                var b = a.id;
                if (b) {
                    var c = this.rpcs[b];
                    if (c) if (delete this.rpcs[b], 999 === a.status) this.socketLog(a), c.onFault(a.result);
                    else c.onResult({
                        status: a.status,
                        data: a.result
                    });
                    else this.socketLog(a, "no responder")
                } else this.socketLog(a, "no rpc id")
            } else if (Models.room.joined) try {
                if (a.room && a.room != Models.room.data.id) this.socketLog(a, "room mismatch");
                else if (b = a.messages) {
                    c = b.length;
                    for (a = 0; a < c; ++a) {
                        var d = b[a].type,
                            e = b[a].data,
                            f = SocketListener[d];
                        this.socketLog(b[a]);
                        if (f) try {
                            f(e)
                        } catch (g) {
                            console.log("SocketListener." + d), console.error(g)
                        } else console.error("UNKNOWN MESSAGE! ", b[a])
                    }
                } else this.socketLog(a, "no messages")
            } catch (h) {
                console.error(h)
            }
        },
        socketLog: function (a,
        b) {
            Models.room.admins[Models.user.data.id] && (b && console.log(b), a && console.log(a))
        }
    });

function socketConnect(a) {
    socket = new Socket("https://sjs.plug.dj/plug");
    socket.backoff = a
}
function socketInit(a) {
    a ? setTimeout(function () {
        socketConnect(a)
    }, 1E3 * Math.pow(2, a)) : socketConnect(a)
}
var SocketMessageListener = Class.extend({
    init: function () {},
    chat: function (a) {
        Models.chat.receive(a);
        API.delayDispatch(API.CHAT, a)
    },
    skip: function (a) {
        Models.chat.receive({
            type: "skip",
            message: Lang.messages.djSkip.split("%NAME%").join($("<span/>").text(a.username).html())
        });
        API.delayDispatch(API.USER_SKIP, a.username)
    },
    userJoin: function (a) {
        Models.room.userJoin(a);
        API.delayDispatch(API.USER_JOIN, a)
    },
    userLeave: function (a) {
        var b;
        Models.user.data.id == a.id ? new RoomJoinService(Models.room.data.id) : (Models.room.userHash[a.id] && (b = Utils.clone(Models.room.userHash[a.id])), Models.room.userLeave(a.id), b && API.delayDispatch(API.USER_LEAVE, b))
    },
    userUpdate: function (a) {
        Models.room.userUpdate(a)
    },
    userCounterUpdate: function (a) {
        Models.room.userCounterUpdate(a)
    },
    userFollow: function (a) {
        Models.chat.receive({
            type: "update",
            message: Lang.messages.follow.split("%NAME%").join($("<span/>").text(a.un).html()),
            language: Models.user.data.language
        });
        Models.user.addFollower(a.id);
        API.delayDispatch(API.USER_FAN, Models.room.userHash[a.id])
    },
    followJoin: function (a) {
        1 < a.r ? (Models.chat.receive({
            type: "update",
            message: Lang.messages.friendEnter.split("%NAME%").join($("<span/>").text(a.un).html()),
            language: Models.user.data.language
        }), 3 == a.r ? Models.user.addFriend(a.id) : Models.user.addFollowing(a.id), API.delayDispatch(API.FRIEND_JOIN, Models.room.userHash[a.id])) : (Models.chat.receive({
            type: "update",
            message: Lang.messages.fanEnter.split("%NAME%").join($("<span/>").text(a.un).html()),
            language: Models.user.data.language
        }), Models.user.addFollower(a.id), API.delayDispatch(API.FAN_JOIN,
        Models.room.userHash[a.id]))
    },
    voteUpdate: function (a) {
        Models.room.voteUpdate(a);
        var b = Models.room.userHash[a.id];
        b && API.delayDispatch(API.VOTE_UPDATE, {
            user: b,
            vote: a.vote
        })
    },
    voteUpdateMulti: function (a) {
        for (var b in a.votes) {
            Models.room.voteUpdate({
                id: b,
                vote: a.votes[b]
            });
            var c = Models.room.userHash[b];
            c && API.delayDispatch(API.VOTE_UPDATE, {
                user: c,
                vote: a.votes[b]
            })
        }
    },
    curateUpdate: function (a) {
        Models.room.curateUpdate(a);
        (a = Models.room.userHash[a.id]) && API.delayDispatch(API.CURATE_UPDATE, {
            user: a
        })
    },
    djAdvance: function (a) {
        if (a.djs) try {
            Models.room.djUpdate(a.djs)
        } catch (b) {
            console.log("Models.room.djUpdate (from djAdvance) error"),
            console.log(b)
        }
        try {
            Models.room.djAdvance(a)
        } catch (c) {
            console.log("Models.room.djAdvance error"), console.log(c)
        }
        try {
            RoomUser.audience.strobeMode(!1)
        } catch (d) {
            console.log("RoomUser.audience.strobeMode error"), console.log(d)
        }
    },
    djUpdate: function (a) {
        Models.room.djUpdate(a)
    },
    waitListUpdate: function (a) {
        Models.room.waitListUpdate(a)
    },
    roomPropsUpdate: function (a) {
        Models.room.roomPropsUpdate(a)
    },
    roomMetaUpdate: function (a) {
        Models.room.roomMetaUpdate(a)
    },
    roomVoteSkip: function () {
        Models.chat.receive({
            type: "skip",
            message: Lang.messages.roomSkip
        });
        API.delayDispatch(API.VOTE_SKIP, null)
    },
    modSkip: function (a) {
        Models.chat.receive({
            type: "moderation",
            from: a.moderator,
            message: Lang.messages.modSkip,
            language: Models.user.data.language
        });
        API.delayDispatch(API.MOD_SKIP, a.moderator)
    },
    modKick: function (a) {
        Models.chat.receive({
            type: "moderation",
            from: a.moderator,
            message: Lang.messages.modKick.split("%NAME%").join($("<span/>").text(a.username).html()),
            language: Models.user.data.language
        })
    },
    modBan: function (a) {
        Models.chat.receive({
            type: "moderation",
            from: a.moderator,
            message: Lang.messages.modBan.split("%NAME%").join($("<span/>").text(a.username).html()),
            language: Models.user.data.language
        })
    },
    modAddDJ: function (a) {
        Models.chat.receive({
            type: "moderation",
            from: a.moderator,
            message: Lang.messages.modAddDJ.split("%NAME%").join($("<span/>").text(a.username).html()),
            language: Models.user.data.language
        })
    },
    modRemoveDJ: function (a) {
        Models.chat.receive({
            type: "moderation",
            from: a.moderator,
            message: Lang.messages.modRemoveDJ.split("%NAME%").join($("<span/>").text(a.username).html()),
            language: Models.user.data.language
        })
    },
    modAddWaitList: function (a) {
        Models.chat.receive({
            type: "moderation",
            from: a.moderator,
            message: Lang.messages.modAddWaitList.split("%NAME%").join($("<span/>").text(a.username).html()),
            language: Models.user.data.language
        })
    },
    modRemoveWaitList: function (a) {
        Models.chat.receive({
            type: "moderation",
            from: a.moderator,
            message: Lang.messages.modRemoveWaitList.split("%NAME%").join($("<span/>").text(a.username).html()),
            language: Models.user.data.language
        })
    },
    modStaff: function (a) {
        for (var b,
        c = a.users.length, d = 0; d < c; ++d) if (Models.room.userHash[a.users[d].user.id] || Models.room.userJoin(a.users[d].user), 0 == a.users[d].permission ? b = Lang.messages.staffNone : 1 == a.users[d].permission ? b = Lang.messages.staffFeaturedDJ : 2 == a.users[d].permission ? b = Lang.messages.staffBouncer : 3 == a.users[d].permission ? b = Lang.messages.staffManager : 4 == a.users[d].permission ? b = Lang.messages.staffCohost : 5 == a.users[d].permission && (b = Lang.messages.staffHost), b) Models.chat.receive({
            type: "moderation",
            from: a.moderator,
            message: b.split("%NAME%").join($("<span/>").text(Models.room.userHash[a.users[d].user.id].username).html()),
            language: Models.user.data.language
        }), Models.room.editStaff(a.users[d].user.id, a.users[d].permission)
    },
    playlistCycle: function (a) {
        Utils.deserializeModified(a);
        LS.playlist.write([a]);
        Models.playlistMedia(a.id).read();
        MediaOverlay.updateQueueMeta()
    },
    djTrigger: function (a) {
        if (Playback.media) {
            var b = $("<span/>").text(Models.room.getUsername(Models.room.data.currentDJ)).html();
            1 == a && RoomUser.audience.lightsOut(!0) ? log(Lang.messages.lights.split("%NAME%").join(b)) : 2 == a && RoomUser.audience.strobeMode(!0) ? log(Lang.messages.strobe.split("%NAME%").join(b)) : 0 == a && RoomUser.audience.strobeMode(!1)
        }
    },
    requestDuration: function (a) {
        Playback.media && Playback.media.cid == a.cid.split(":").pop() ? 0 < ytDuration ? new DurationUpdateService(a.auth, a.cid, ytDuration) : (this.durationAuth = a.auth, this.durationCID = a.cid, this.durationTimeoutID = setTimeout($.proxy(this.requestDurationRetry, this), 1E3)) : new DurationUpdateService(a.auth, a.cid, 0)
    },
    requestDurationRetry: function () {
        new DurationUpdateService(this.durationAuth, this.durationCID, ytDuration);
        this.durationCID = this.durationAuth = null;
        clearTimeout(this.durationTimeoutID)
    },
    durationUpdate: function (a) {
        Playback.durationUpdate(a.cid, a.duration);
        LS.media.updateDuration(a.cid, a.duration)
    },
    ping: function () {
        Models.room.admins[Models.user.data.id] && DB.settings && DB.settings.showPings && Models.chat.receive({
            type: "system",
            message: "Server: Ping Received " + Utils.getSimpleTimestamp(),
            language: Models.user.data.language
        });
        socket.execute("user.pong", null)
    },
    pdjUpdate: function () {
        Playback.play();
        Playback.streamDisabled = !0;
        Dialog.alert(Lang.alerts.updateMessage,
        $.proxy(Utils.forceRefresh, Utils), Lang.alerts.update, !0)
    },
    pdjMessage: function (a) {
        Models.chat.receive({
            type: "system",
            message: a,
            language: Models.user.data.language
        })
    },
    lotteryWinner: function (a) {
        for (var b = a.length, c = 0; c < b; ++c) {
            var d = Models.room.userHash[a[c]];
            d && Models.chat.receive({
                type: "update",
                message: Lang.messages.lotteryWinner.split("%USER%").join($("<span/>").text(d.username).html()),
                language: Models.user.data.language
            })
        }
    },
    kick: function (a) {
        window.location.href = "/?ref=" + a.ref + "&reason=" + encodeURIComponent(a.reason) +
            "&who=" + encodeURIComponent(a.moderator)
    },
    chatDelete: function (a) {
        a.username = a.moderator;
        Models.chat.onChatDelete(a)
    }
}),
    LSDatabase = Class.extend({
        init: function () {
            localStorage.getItem("settings") ? (this.media = JSON.parse(localStorage.getItem("media")), this.playlist = JSON.parse(localStorage.getItem("playlist")), this.lastModTime = JSON.parse(localStorage.getItem("lastModTime")), this.settings = JSON.parse(localStorage.getItem("settings"))) : this.reset()
        },
        reset: function () {
            var a = $.browser.mozilla || $.browser.msie ? 200 : 150,
                a = localStorage.getItem("settings") ? JSON.parse(localStorage.getItem("settings")) : {
                    volume: 50,
                    chatSound: "mentions",
                    chatTranslation: !0,
                    showPings: !0,
                    avatarcap: a,
                    streamDisabled: !1,
                    chatTS: 12
                };
            localStorage.clear();
            localStorage.setItem("media", JSON.stringify({}));
            localStorage.setItem("playlist", JSON.stringify({}));
            localStorage.setItem("lastModTime", JSON.stringify({}));
            localStorage.setItem("settings", JSON.stringify(a));
            this.media = {};
            this.playlist = {};
            this.lastModTime = {};
            this.init()
        },
        ready: function (a) {
            localStorage.getItem("lsv") != a && (this.reset(), localStorage.setItem("lsv", a))
        },
        saveSettings: function () {
            localStorage.setItem("settings", JSON.stringify(this.settings))
        }
    }),
    LSLocalStore = Class.extend({
        init: function () {
            this.media = new LSMediaStore;
            this.lastMod = new LSLastModStore;
            this.playlist = new LSPlaylistStore;
            this.read = {};
            this.read.playlist = new LSPlaylistStoreRead;
            this.read.search = new LSMediaSearchStoreRead;
            this.read.playlistMedia = function (a) {
                return new LSPlaylistMediaStoreRead(a)
            }
        },
        getMediaPlaylists: function (a) {
            var b = [],
                c;
            for (c in DB.playlist) for (var d in DB.playlist[c].items) {
                var e = DB.media[DB.playlist[c].items[d]];
                e && e.cid == a && b.push({
                    id: DB.playlist[c].id,
                    name: DB.playlist[c].name
                })
            }
            return b
        }
    }),
    LSMediaStore = Class.extend({
        init: function () {
            this.updateCallback = null
        },
        modified: function () {
            return LS.lastMod.read("media").modified
        },
        write: function (a) {
            if (a && 0 < a.length) {
                for (var b = a.length; b--;) {
                    var c = a[b];
                    c.active ? DB.media[c.id] = DB.media[c.cid] = c : this.remove(c.id)
                }
                localStorage.setItem("media", JSON.stringify(DB.media));
                LS.lastMod.write({
                    name: "media",
                    modified: a[a.length - 1].modified
                });
                localStorage.setItem("lastModTime",
                JSON.stringify(DB.lastModTime))
            }
            this.updateCallback && this.updateCallback()
        },
        remove: function (a) {
            var b = DB.media[a];
            b && (delete DB.media[b.cid], delete DB.media[a])
        },
        lookup: function (a) {
            return DB.media[a]
        },
        select: function (a) {
            for (var b = [], c = a.length; c--;) {
                var d = DB.media[a[c]];
                d && b.push(d)
            }
            return 0 < b.length ? b : null
        },
        exists: function (a) {
            return void 0 != DB.media[a]
        },
        updateDuration: function (a, b) {
            DB.media[a] && (DB.media[a].duration = b, localStorage.setItem("media", JSON.stringify(DB.media)))
        }
    }),
    LSLastModStore = Class.extend({
        init: function () {},
        write: function (a) {
            DB.lastModTime[a.name] = a
        },
        read: function (a) {
            return (a = DB.lastModTime[a]) ? a : {
                name: null,
                modified: "0,0000000000"
            }
        },
        remove: function (a) {
            delete DB.lastModTime[a]
        }
    }),
    LSPlaylistStore = Class.extend({
        init: function () {
            this.updateCallback = this.deleteCallback = null;
            this.mediaLookup = {};
            for (var a in DB.playlist) {
                this.mediaLookup[a] = {};
                for (var b in DB.playlist[a].items) this.mediaLookup[a][DB.playlist[a].items[b]] = !0
            }
        },
        modified: function () {
            return LS.lastMod.read("playlists").modified
        },
        write: function (a) {
            var b;
            if (a && 0 < a.length) {
                for (var c = a.length; c--;) {
                    var d = a[c];
                    if (d.active) {
                        DB.playlist[d.id] = d;
                        this.mediaLookup[d.id] = {};
                        for (var e in d.items) this.mediaLookup[d.id][d.items[e]] = !0
                    } else b = !0, LS.lastMod.remove("playlist_" + d.id), this.deleteAllPlaylistMedia(d.id), delete DB.playlist[d.id]
                }
                LS.lastMod.write({
                    name: "playlists",
                    modified: a[a.length - 1].modified
                });
                b && null != this.deleteCallback && this.deleteCallback(a[0].id);
                localStorage.setItem("playlist", JSON.stringify(DB.playlist));
                localStorage.setItem("lastModTime",
                JSON.stringify(DB.lastModTime))
            }
            this.updateCallback && this.updateCallback()
        },
        update: function (a) {
            if (a) {
                DB.playlist[a.id].items = [].concat(a.items);
                DB.playlist[a.id].modified = a.modified;
                localStorage.setItem("playlist", JSON.stringify(DB.playlist));
                var b;
                $("#media-menu-playlist-container li").each(function () {
                    $(this).data("playlist").id == a.id && (b = this)
                });
                if (b) {
                    var c;
                    c = 1 == a.items.length ? Lang.media.item : Lang.media.items.split("%COUNT%").join("" + a.items.length);
                    $(b).find(".menu-playlist-item-count").text(c)
                }
            }
        },
        exists: function (a) {
            return void 0 != DB.playlist[a]
        },
        selected: function () {
            for (var a in DB.playlist) if (a.selected) return a.id;
            return 0
        },
        firstMedia: function (a) {
            var b = [];
            (a = DB.playlist[a]) && 0 < a.items.length && (b = 1 < a.items.length ? [a.items[0], a.items[1]] : [a.items[0]]);
            return b
        },
        deletePlaylistMedia: function (a, b) {
            for (var c = b.length; c--;) this.mediaLookup[a] && delete this.mediaLookup[a][b[c]];
            for (var d = !1, c = b.length; c--;) this.checkPermaDelete(b[c]) && (d = !0);
            d && localStorage.setItem("media", JSON.stringify(DB.media))
        },
        deleteAllPlaylistMedia: function (a) {
            delete this.mediaLookup[a];
            if (DB.playlist[a]) {
                for (var a = DB.playlist[a].items, b = !1, c = a.length; c--;) this.checkPermaDelete(a[c]) && (b = !0);
                b && localStorage.setItem("media", JSON.stringify(DB.media))
            }
        },
        checkPermaDelete: function (a) {
            var b = !1,
                c;
            for (c in this.mediaLookup) if (this.mediaLookup[c][a]) {
                b = !0;
                break
            }
            b || LS.media.remove(a);
            return !b
        }
    }),
    LSPlaylistMediaStoreRead = Class.extend({
        init: function (a) {
            this.id = a;
            this.lookupCallback = this.readCallback = null
        },
        load: function () {
            for (var a = DB.playlist[this.id].items, b = a.length, c = [], d = 0; d < b; ++d) c.push(Utils.clone(DB.media[a[d]]));
            this.readCallback && this.readCallback(c)
        },
        filter: function (a) {
            if (0 < a.length) {
                for (var b = DB.playlist[this.id].items, c = b.length, d = [], e = 0; e < c; ++e) {
                    var f = DB.media[b[e]];
                    f && f.author && f.title && (-1 < f.author.toLowerCase().indexOf(a) || -1 < f.title.toLowerCase().indexOf(a)) && d.push(Utils.clone(f))
                }
                this.readCallback && this.readCallback(d)
            } else return this.load()
        },
        lookup: function (a) {
            for (var b = DB.playlist[this.id].items, c = b.length,
            d = 0, e = 0; e < c; ++e) {
                var f = DB.media[b[e]];
                if (0 == f.title.indexOf(a)) {
                    d = f.id;
                    break
                }
            }
            this.lookupCallback && this.lookupCallback(d)
        }
    }),
    LSPlaylistStoreRead = Class.extend({
        init: function () {
            this.readCallback = null
        },
        load: function () {
            var a = [],
                b;
            for (b in DB.playlist) a.push(DB.playlist[b]);
            a.sort(this.nameSort);
            this.readCallback && this.readCallback(a)
        },
        nameSort: function (a, b) {
            var c = a.name.toLowerCase(),
                d = b.name.toLowerCase();
            return c > d ? 1 : c < d ? -1 : 0
        }
    }),
    LSMediaSearchStoreRead = Class.extend({
        load: function (a) {
            var b = [],
                c;
            for (c in DB.playlist) for (var d = DB.playlist[c].items, e = d.length, f = 0; f < e; ++f) {
                var g = DB.media[d[f]];
                if (g && g.author && g.title && (-1 < g.author.toLowerCase().indexOf(a) || -1 < g.title.toLowerCase().indexOf(a))) g = Utils.clone(g), g.playlist = {
                    id: c,
                    name: DB.playlist[c].name
                }, b.push(g)
            }
            100 < b.length && (b.length = 100);
            b.sort(this.playlistSort);
            return b
        },
        playlistSort: function (a, b) {
            var c = a.playlist.name.toLowerCase(),
                d = b.playlist.name.toLowerCase();
            return c > d ? 1 : c < d ? -1 : 0
        }
    }),
    WaitListJoinService = Service.extend({
        init: function () {
            this._super()
        },
        execute: function () {
            50 > Models.room.data.waitList.length ? rpcGW.execute("booth.join", this) : this.parse({
                status: 4
            })
        },
        parse: function (a) {
            0 == a.status ? (UserListOverlay.waitListServiceComplete(!0), Room.updateUserPlaying()) : (1 == a.status ? Dialog.alert(Lang.alerts.maxDJs) : 2 == a.status ? Dialog.alert(Lang.alerts.lockedBooth) : 3 == a.status ? Dialog.alert(Lang.alerts.cannotPlay) : 4 == a.status && Dialog.alert(Lang.alerts.maxWaitList), this.errorCallback && this.errorCallback(), Room.updateUserPlaying(), UserListOverlay.waitListServiceComplete(!1))
        }
    }),
    WaitListLeaveService = Service.extend({
        init: function () {
            this._super()
        },
        execute: function () {
            rpcGW.execute("booth.leave", this)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status);
            Room.updateUserPlaying();
            UserListOverlay.waitListServiceComplete(!1)
        }
    }),
    SoundCloudSearchService = Class.extend({
        init: function () {
            this.callback = null
        },
        load: function (a, b, c, d) {
            this.callback = d;
            a = "https://api.soundcloud.com/tracks.json?client_id=" + Playback.SCClientID + "&q=" + encodeURIComponent(a) + "&offset=" + b * c + "&limit=" + c + "&callback=?";
            $.jsonp({
                url: a,
                success: $.proxy(this.onComplete, this),
                error: $.proxy(this.onError, this)
            })
        },
        onComplete: function (a) {
            for (var b = a.length, c = [], d = 0; d < b; ++d) {
                var e = a[d],
                    f = {};
                if (e.streamable) f.cid = e.stream_url.split("/")[4];
                else if (e.downloadable) f.cid = e.download_url.split("/")[4];
                else continue;
                f.image = e.artwork_url || e.avatar_url || "http://plug.dj/_/static/images/soundcloud_thumbnail.da976c8b.png";
                f.duration = e.duration / 1E3;
                e.user ? f.author = e.user.username : (e = Utils.authorTitle(e.title), f.author = e.author || f.author);
                f.title = e.title;
                f.format = 2;
                f.id = 0;
                c.push(f)
            }
            this.callback(c)
        },
        onError: function () {
            console.log("SoundCloud Search Error");
            this.callback([])
        }
    }),
    SoundCloudFavoritesService = Class.extend({
        init: function () {
            this.callback = null;
            this.hasConnected = !1
        },
        load: function (a, b, c) {
            this.callback = c;
            var d = this;
            this.hasConnected ? SC.get("/me/favorites?offset=" + a * b + "&limit=" + b, {
                client_id: Playback.SCClientID,
                redirect_uri: Playback.SCRedirect
            }, function (a, b) {
                if (b) d.hasConnected = !1, Dialog.alert(b.message + "<br/>" + Lang.alerts.pleaseTryAgain,
                null, Lang.alerts.soundcloudError);
                else d.onComplete(a)
            }) : this.auth(a, b)
        },
        auth: function (a, b) {
            var c = this;
            SC.connect(function () {
                SC.get("/me/favorites?offset=" + a * b + "&limit=" + b, {
                    client_id: Playback.SCClientID,
                    redirect_uri: Playback.SCRedirect
                }, function (a, b) {
                    b ? (c.hasConnected = !0, Dialog.alert(b.message + "<br/>" + Lang.alerts.pleaseTryAgain, null, Lang.alerts.soundcloudError)) : (c.hasConnected = !0, c.onComplete(a))
                })
            })
        },
        onComplete: function (a) {
            for (var b = a.length, c = [], d = [], e = 0; e < b; ++e) {
                var f = a[e],
                    g = {};
                if (f.streamable) g.cid = f.stream_url.split("/")[4];
                else if (f.downloadable) g.cid = f.download_url.split("/")[4];
                else continue;
                var h = LS.media.lookup(g.cid);
                h ? c.push(h) : (g.image = f.artwork_url || f.avatar_url || "http://plug.dj/_/static/images/soundcloud_thumbnail.da976c8b.png", g.duration = f.duration / 1E3, f.user ? g.author = f.user.username : (f = Utils.authorTitle(f.title), g.author = f.author || g.author), g.title = f.title, g.format = 2, g.id = 0, d.push(g))
            }
            this.callback(c.concat(d))
        },
        onError: function () {
            console.log("SoundCloud Favorites Error");
            this.callback([])
        }
    }),
    SoundCloudTracksService = Class.extend({
        init: function () {
            this.callback = null;
            this.hasConnected = !1
        },
        load: function (a, b, c) {
            this.callback = c;
            var d = this;
            this.hasConnected ? SC.get("/me/tracks?offset=" + a * b + "&limit=" + b, {
                client_id: Playback.SCClientID,
                redirect_uri: Playback.SCRedirect
            }, function (a, b) {
                if (b) d.hasConnected = !1, Dialog.alert(b.message + "<br/>" + Lang.alerts.pleaseTryAgain, null, Lang.alerts.soundcloudError);
                else d.onComplete(a)
            }) : this.auth(a, b)
        },
        auth: function (a, b) {
            var c = this;
            SC.connect(function () {
                SC.get("/me/tracks?offset=" + a * b + "&limit=" + b, {
                    client_id: Playback.SCClientID,
                    redirect_uri: Playback.SCRedirect
                }, function (a, b) {
                    b ? (c.hasConnected = !0, Dialog.alert(b.message + "<br/>" + Lang.alerts.pleaseTryAgain, null, Lang.alerts.soundcloudError)) : (c.hasConnected = !0, c.onComplete(a))
                })
            })
        },
        onComplete: function (a) {
            for (var b = a.length, c = [], d = [], e = 0; e < b; ++e) {
                var f = a[e],
                    g = {};
                if (f.streamable) g.cid = f.stream_url.split("/")[4];
                else if (f.downloadable) g.cid = f.download_url.split("/")[4];
                else continue;
                var h = LS.media.lookup(g.cid);
                h ? c.push(h) : (g.image = f.artwork_url || f.avatar_url || "http://plug.dj/_/static/images/soundcloud_thumbnail.da976c8b.png", g.duration = f.duration / 1E3, f.user ? g.author = f.user.username : (f = Utils.authorTitle(f.title), g.author = f.author || g.author), g.title = f.title, g.format = 2, g.id = 0, d.push(g))
            }
            this.callback(c.concat(d))
        },
        onError: function () {
            console.log("SoundCloud Tracks Error");
            this.callback([])
        }
    }),
    SoundCloudSetsService = Class.extend({
        init: function () {
            this.callback = null;
            this.hasConnected = !1
        },
        load: function (a, b, c) {
            this.callback = c;
            var d = this;
            this.hasConnected ? SC.get("/me/playlists?offset=" + a * b + "&limit=" + b, {
                client_id: Playback.SCClientID,
                redirect_uri: Playback.SCRedirect
            }, function (a, b) {
                if (b) d.hasConnected = !1, Dialog.alert(b.message + "<br/>" + Lang.alerts.pleaseTryAgain, null, Lang.alerts.soundcloudError);
                else d.onComplete(a)
            }) : this.auth(a, b)
        },
        auth: function (a, b) {
            var c = this;
            SC.connect(function () {
                SC.get("/me/playlists?offset=" + a * b + "&limit=" + b, {
                    client_id: Playback.SCClientID,
                    redirect_uri: Playback.SCRedirect
                }, function (a, b) {
                    b ? (c.hasConnected = !0,
                    Dialog.alert(b.message + "<br/>" + Lang.alerts.pleaseTryAgain, null, Lang.alerts.soundcloudError)) : (c.hasConnected = !0, c.onComplete(a))
                })
            })
        },
        onComplete: function (a) {
            for (var b = a.length, c = [], d = 0; d < b; ++d) {
                var e = {};
                e.title = a[d].title;
                for (var f = a[d].tracks.length, g = [], h = [], j = 0; j < f; ++j) {
                    var k = a[d].tracks[j],
                        l = {};
                    if (k.streamable) l.cid = k.stream_url.split("/")[4];
                    else if (k.downloadable) l.cid = k.download_url.split("/")[4];
                    else continue;
                    var m = LS.media.lookup(l.cid);
                    m ? g.push(m) : (l.image = k.artwork_url || k.avatar_url || "http://plug.dj/_/static/images/soundcloud_thumbnail.da976c8b.png",
                    l.duration = k.duration / 1E3, k.user ? l.author = k.user.username : (k = Utils.authorTitle(k.title), l.author = k.author || l.author), l.title = k.title, l.format = 2, l.id = 0, h.push(l))
                }
                e.tracks = g.concat(h);
                0 < e.tracks.length && c.push(e)
            }
            this.callback(c)
        },
        onError: function () {
            console.log("SoundCloud Sets Error");
            this.callback([])
        }
    }),
    PlaylistServiceFacade = Class.extend({
        init: function () {
            this.store = LS.playlist;
            this.store.deleteCallback = $.proxy(this.onDelete, this);
            this.deleteCallback = this.syncCompleteCallback = null;
            this.curateAfter = this.synced = !1;
            this.importCallback = null
        },
        sync: function () {
            if (this.synced) null != this.syncCompleteCallback && this.syncCompleteCallback();
            else {
                var a = new PlaylistSelectService(this.store.modified() || "0");
                a.successCallback = $.proxy(this.onSelectResponse, this);
                a.errorCallback = $.proxy(this.onSyncError, this)
            }
        },
        onSyncError: function () {
            console.log("playlist sync failed - retrying");
            this.synced = !1;
            this.sync()
        },
        create: function (a, b, c, d) {
            MediaOverlay.showPlaylistCreateProgress();
            !b || 0 == b.length ? (a = new PlaylistInsertService(a),
            a.successCallback = $.proxy(this.onItemResponse, this), a.errorCallback = $.proxy(this.onServiceError, this), this.curateAfter = c) : (a = new PlaylistMediaInsertService(0, a, b, 0), a.successCallback = $.proxy(this.onCreateInsertResponse, this), a.errorCallback = $.proxy(this.onServiceError, this), this.importCallback = d)
        },
        remove: function (a) {
            a = new PlaylistDeleteService(a);
            a.successCallback = $.proxy(this.onArrayResponse, this);
            a.errorCallback = $.proxy(this.onServiceError, this)
        },
        rename: function (a, b) {
            MediaOverlay.showPlaylistProgress(a);
            var c = new PlaylistRenameService(a, b);
            c.successCallback = $.proxy(this.onItemResponse, this);
            c.errorCallback = $.proxy(this.onServiceError, this)
        },
        activate: function (a) {
            MediaOverlay.showPlaylistProgress(a);
            a = new PlaylistActivateService(a);
            a.successCallback = $.proxy(this.onArrayResponse, this);
            a.errorCallback = $.proxy(this.onServiceError, this)
        },
        onSelectResponse: function (a) {
            this.store.write(a);
            0 < a.length ? (this.synced = !1, this.sync()) : (this.synced = !0, null != this.syncCompleteCallback && this.syncCompleteCallback())
        },
        onArrayResponse: function (a) {
            this.store.write(a);
            this.synced = !0;
            null != this.syncCompleteCallback && this.syncCompleteCallback();
            MediaOverlay.hidePlaylistProgress()
        },
        onItemResponse: function (a) {
            this.store.write([a]);
            this.synced = !0;
            null != this.syncCompleteCallback && this.syncCompleteCallback();
            this.curateAfter && new DJCurateService(a.id);
            this.importCallback && this.importCallback();
            this.importCallback = null;
            this.curateAfter = !1;
            MediaOverlay.hidePlaylistProgress();
            MediaOverlay.hidePlaylistCreateProgress()
        },
        onCreateInsertResponse: function (a) {
            this.store.write([a.data[0]]);
            0 < a.data[1].length && LS.media.write(a.data[1]);
            this.synced = !0;
            null != this.syncCompleteCallback && this.syncCompleteCallback();
            this.curateAfter && new DJCurateService(a.data[0].id);
            this.importCallback && this.importCallback();
            this.importCallback = null;
            this.curateAfter = !1;
            MediaOverlay.hidePlaylistProgress();
            MediaOverlay.hidePlaylistCreateProgress()
        },
        onDelete: function (a) {
            this.deleteCallback && this.deleteCallback(a)
        },
        onServiceError: function () {
            MediaOverlay.hidePlaylistCreateProgress();
            MediaOverlay.hidePlaylistProgress()
        }
    }),
    MediaServiceFacade = Class.extend({
        init: function () {
            this.syncCompleteCallback = void 0
        },
        sync: function () {
            var a = new MediaSelectService(LS.media.modified() || "0");
            a.successCallback = $.proxy(this.onSelectResponse, this);
            a.errorCallback = $.proxy(this.onServiceError, this)
        },
        onSelectResponse: function (a) {
            LS.media.write(a);
            0 < a.length ? this.sync() : this.syncCompleteCallback && this.syncCompleteCallback()
        },
        onServiceError: function () {
            console.log("media sync failed - retrying");
            this.sync()
        }
    }),
    PlaylistMediaServiceFacade = Class.extend({
        init: function (a) {
            this.id = a;
            this.confirmCount = this.updateCallback = null
        },
        mediaInsert: function (a, b, c) {
            0 < a.length && (MediaOverlay.showPlaylistProgress(this.id), this.confirmCount = c, 50 > a.length ? (c = new PlaylistMediaInsertService(this.id, null, a, b), c.successCallback = $.proxy(this.onInsertResponse, this), c.errorCallback = $.proxy(this.onServiceError, this)) : (c = a.slice(0, 50), c = new PlaylistMediaInsertService(this.id, null, c, b), c.successCallback = $.proxy(this.onInsertResponse, this), c.errorCallback = $.proxy(this.onServiceError, this), a.splice(0,
            50), this.mediaInsert(a, b)))
        },
        mediaDelete: function (a) {
            if (0 < a.length) {
                var b;
                MediaOverlay.showPlaylistProgress(this.id);
                50 > a.length ? (b = new PlaylistMediaDeleteService(this.id, a), b.successCallback = $.proxy(this.onDeleteResponse, this), b.errorCallback = $.proxy(this.onServiceError, this)) : (b = a.slice(0, 50), b = new PlaylistMediaDeleteService(this.id, b), b.successCallback = $.proxy(this.onDeleteResponse, this), b.errorCallback = $.proxy(this.onServiceError, this), a.splice(0, 50), this.mediaDelete(a))
            }
        },
        mediaUpdate: function (a) {
            MediaOverlay.showPlaylistProgress(this.id);
            a = new MediaUpdateService(a);
            a.successCallback = $.proxy(this.onUpdateResponse, this);
            a.errorCallback = $.proxy(this.onServiceError, this)
        },
        mediaMove: function (a, b) {
            MediaOverlay.showPlaylistProgress(this.id);
            var c = new PlaylistMediaMoveService(this.id, a, b);
            c.successCallback = $.proxy(this.onMoveResponse, this);
            c.errorCallback = $.proxy(this.onServiceError, this)
        },
        onInsertResponse: function (a) {
            LS.playlist.update(a.data[0]);
            0 < a.data[1].length && LS.media.write(a.data[1]);
            this.updateCallback && this.updateCallback();
            this.confirmCount && (1 == this.confirmCount ? Dialog.alert(Lang.alerts.addedToPlaylist1.split("%PLAYLIST%").join(DB.playlist[this.id].name), null, "Success") : Dialog.alert(Lang.alerts.addedToPlaylist.split("%COUNT%").join(this.confirmCount).split("%PLAYLIST%").join(DB.playlist[this.id].name), null, "Success"));
            this.confirmCount = null
        },
        onDeleteResponse: function (a) {
            LS.playlist.update(a.data);
            0 < a.media.length && LS.playlist.deletePlaylistMedia(a.data.id, a.media);
            this.updateCallback && this.updateCallback()
        },
        onMoveResponse: function (a) {
            LS.playlist.update(a.data);
            this.updateCallback && this.updateCallback()
        },
        onUpdateResponse: function (a) {
            LS.media.write(a.data);
            this.updateCallback && this.updateCallback()
        },
        onServiceError: function () {
            this.confirmCount = null;
            MediaOverlay.hidePlaylistCreateProgress();
            MediaOverlay.hidePlaylistProgress()
        }
    }),
    DJJoinService = Service.extend({
        init: function () {
            this._super()
        },
        execute: function () {
            socket.execute("booth.join", this)
        },
        parse: function (a) {
            0 != a.status && (1 == a.status ? Dialog.alert(Lang.alerts.maxDJs) : 2 == a.status ? Dialog.alert(Lang.alerts.lockedBooth) : 3 == a.status ? Dialog.alert(Lang.alerts.cannotPlay) : 4 == a.status && Dialog.alert(Lang.alerts.maxWaitList), this.errorCallback && this.errorCallback(), Room.updateUserPlaying())
        }
    }),
    DJLeaveService = Service.extend({
        init: function () {
            this._super()
        },
        execute: function () {
            socket.execute("booth.leave", this)
        },
        parse: function (a) {
            0 != a.status && (this.onStatusError(a.status), Room.updateUserPlaying())
        }
    }),
    DJSkipService = Service.extend({
        init: function () {
            this._super()
        },
        execute: function () {
            Room.setSkipping();
            socket.execute("booth.skip",
            this)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    DJCurateService = Service.extend({
        init: function (a) {
            this._super();
            this.playlistID = a
        },
        execute: function () {
            socket.execute("room.curate", this, this.playlistID, Models.room.data.historyID)
        },
        parse: function (a) {
            if (0 == a.status) {
                Utils.deserializeModified(a.data[0]);
                if (0 < a.data[1].length) {
                    for (var b = a.data[1].length; b--;) Utils.deserializeModified(a.data[1][b]);
                    LS.media.write(a.data[1])
                }
                Models.playlist.facade.onArrayResponse([a.data[0]]);
                Models.playlistMedia(this.playlistID).load();
                Playback.media && Dialog.alert(Lang.alerts.mediaAddedToPlaylist.split("%MEDIA%").join(Playback.media.author + " - " + Playback.media.title).split("%PLAYLIST%").join(DB.playlist[this.playlistID].name), null, Lang.alerts.success)
            } else if (5 == a.status) Dialog.alert(Lang.alerts.tooManyItems);
            else this.onStatusError(a.status)
        }
    }),
    DJReplaceRestrictedMediaService = Service.extend({
        init: function (a, b) {
            this._super();
            this.item = a;
            this.replacement = b
        },
        execute: function () {
            console.log("DJReplaceRestrictedMediaService", this.item,
                " :: ", this.replacement);
            this.onResult({
                status: 0
            })
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    SearchServiceFacade = Class.extend({
        init: function () {},
        ytSearch: function (a, b, c, d) {
            a = "http://gdata.youtube.com/feeds/api/videos?v=2&alt=json&q=" + encodeURIComponent(a);
            this.ytSearchService || (this.ytSearchService = new YouTubeSearchService);
            this.ytSearchService.load(a, b, c, d)
        },
        ytRelated: function (a, b) {
            var c = "http://gdata.youtube.com/feeds/api/videos/" + encodeURIComponent(a) + "/related?v=2&alt=json";
            this.ytSearchService || (this.ytSearchService = new YouTubeSearchService);
            this.ytSearchService.load(c, 0, 50, b)
        },
        ytPlaylist: function (a, b) {
            this.ytPlaylistService || (this.ytPlaylistService = new YouTubePlaylistService);
            this.ytPlaylistService.load(a, b)
        },
        ytPlaylistVideos: function (a, b) {
            this.ytImportService || (this.ytImportService = new YouTubeImportService);
            this.ytImportService.load(a, !1, b)
        },
        ytFavoriteVideos: function (a, b) {
            this.ytImportService || (this.ytImportService = new YouTubeImportService);
            this.ytImportService.load(a, !0, b)
        },
        scSearch: function (a, b, c, d) {
            this.scSearchService || (this.scSearchService = new SoundCloudSearchService);
            this.scSearchService.load(a, b, c, d)
        },
        scFavorites: function (a, b, c) {
            this.scFavoritesService || (this.scFavoritesService = new SoundCloudFavoritesService);
            this.scFavoritesService.load(a, b, c)
        },
        scTracks: function (a, b, c) {
            this.scTracksService || (this.scTracksService = new SoundCloudTracksService);
            this.scTracksService.load(a, b, c)
        },
        scSets: function (a, b, c) {
            this.scSetsService || (this.scSetsService = new SoundCloudSetsService);
            this.scSetsService.load(a, b, c)
        },
        cidSearch: function (a, b) {
            this.cidSearchService || (this.cidSearchService = new CIDSearchService);
            this.cidSearchService.load(a, b)
        }
    }),
    CIDSearchService = Class.extend({
        init: function () {
            this.callback = null
        },
        load: function (a, b) {
            this.callback = b;
            var c = new SearchMediaCIDService(a);
            c.successCallback = $.proxy(this.onComplete, this);
            c.errorCallback = $.proxy(this.onServiceError, this)
        },
        onComplete: function (a) {
            this.callback(a)
        },
        onError: function () {
            this.callback([])
        }
    }),
    RoomSelectService = Service.extend({
        init: function (a,
        b) {
            this._super();
            this.query = a || "";
            this.cursor = b
        },
        execute: function () {
            rpcGW.execute("room.search", this, this.query, this.cursor)
        },
        parse: function (a) {
            if (0 == a.status) this.successCallback(a.data);
            else this.onStatusError(a.status)
        }
    }),
    RoomCreateService = Service.extend({
        init: function (a, b) {
            this._super();
            this.name = a;
            this.isPublic = b
        },
        execute: function () {
            rpcGW.execute("room.create", this, this.name, this.isPublic)
        },
        parse: function (a) {
            0 == a.status ? (window.history.pushState(null, this.name, "/" + a.data + "/"), new RoomJoinService(a.data)) : Dialog.alert(Lang.alerts.createRoom + a.status)
        }
    }),
    RoomUpdateService = Service.extend({
        init: function (a, b, c) {
            this._super();
            this.id = a;
            this.name = b;
            this.description = c
        },
        execute: function () {
            rpcGW.execute("moderate.update", this, {
                name: this.name,
                description: this.description
            })
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    RoomPropsService = Service.extend({
        init: function (a, b, c, d) {
            this._super();
            this.id = a;
            this.options = {
                boothLocked: b,
                waitListEnabled: c,
                maxPlays: d,
                maxDJs: 5
            }
        },
        execute: function () {
            rpcGW.execute("room.update_options",
            this, this.id, this.options)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    RoomVoteService = Service.extend({
        init: function (a, b) {
            this._super();
            this.positive = a;
            this.bc = !1;
            try {
                this.bc = b && "click" == b.type && void 0 != b.which ? !0 : !1
            } catch (c) {}
        },
        execute: function () {
            socket.execute("room.cast", this, this.positive, Models.room.data.historyID, this.bc)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    RoomJoinService = Service.extend({
        init: function (a) {
            this._super();
            this.slug = a
        },
        execute: function () {
            Playback.reset();
            MediaOverlay.showRoomProgress();
            API.isReady = !1;
            EXT && EXT.ready ? EXT.ready() : Models.room.data.custom || RoomUser.audience.defaultRoomElements();
            RoomUser.clear();
            Room.setRoomMeta("");
            Room.onMediaUpdate({});
            Lobby.timestamp = 0;
            Models.room.joined && Models.room.data.id != this.slug && Models.chat.clear();
            Models.room.joined = !1;
            Models.history.reset();
            socket.execute("room.join", this, this.slug)
        },
        parse: function (a) {
            if (0 == a.status) {
                Utils.DateUtils.setServerTime(Utils.convertUnixDateStringToDate(a.data.serverTime));
                DB.ready("03:" + a.data.user.profile.id);
                MediaOverlay.firstTime && MediaOverlay.ready();
                Models.user.setData(a.data.user);
                Models.room.setData(a.data.room);
                document.title = "plug.dj - " + a.data.room.name;
                MediaOverlay.hideRoomProgress();
                Main.drawSocialButtons();
                if (EXT && EXT.onRoomJoined) EXT.onRoomJoined();
                API.isReady = !0
            } else if (404 == a.status) alert("Room " + this.slug + " does not exist");
            else if (2 == a.status || 3 == a.status) {
                var b = 2 == a.status ? "banned" : "kicked";
                Utils.DateUtils.setServerTime(Utils.convertUnixDateStringToDate(a.data.serverTime));
                b = "/?ref=" + b;
                3 == a.status && (a = Utils.convertUnixDateStringToDate(a.data.expires), a = Utils.DateUtils.minutesUntil(a), b += "&reason=" + encodeURIComponent(Lang.alerts.kickedTimeRemaining.split("%COUNT%").join(a)));
                window.location.href = b
            } else if (4 == a.status) window.location.href = "/" + encodeURIComponent(this.slug);
            else this.onStatusError(a.status)
        }
    }),
    RoomStateService = Service.extend({
        init: function () {
            this._super()
        },
        execute: function () {
            API.isReady = !1;
            rpcGW.execute("room.state", this)
        },
        parse: function (a) {
            if (0 == a.status) Models.room.setState(a.data),
            API.isReady = !0;
            else if (1 == a.status) new RoomJoinService(Models.room.data.id);
            else if (4 == a.status) window.location.href = "/" + encodeURIComponent(Models.room.data.id);
            else this.onStatusError(a.status)
        }
    }),
    YouTubeSearchService = Class.extend({
        init: function () {
            this.callback = null;
            this.importing = this.related = !1
        },
        load: function (a, b, c, d) {
            this.callback = d;
            this.related = -1 < a.indexOf("/related?");
            this.importing = 1 == b && 1 == c;
            $.jsonp({
                url: a + ("&start-index=" + (b * c + 1)) + ("&max-results=" + c) + "&format=5&paid-content=false&callback=?",
                success: $.proxy(this.onComplete, this),
                error: $.proxy(this.onError, this)
            })
        },
        onComplete: function (a) {
            var b = a.feed.entry,
                c = [];
            if (b) try {
                for (var d = parseInt(a.feed.openSearch$startIndex.$t), e = b.length, a = 0; a < e; ++a) {
                    var f = this.deserialize(b[a], d++);
                    f.image && 0 < f.format ? c.push(f) : --d
                }
            } catch (g) {
                !this.related && !this.importing && Dialog.alert(Lang.alerts.pleaseTryAgain, null, Lang.alerts.youtubeError)
            }
            this.callback(c)
        },
        deserialize: function (a, b) {
            var c = {
                format: 1
            };
            c.cid = a.media$group.yt$videoid.$t;
            a.media$group.media$credit && a.media$group.media$credit.length && a.media$group.media$credit[0].$t ? c.author = a.media$group.media$credit[0].$t : a.author && a.author.length && a.author[0].name && (c.author = a.author[0].name.$t);
            c.title = a.media$group.media$title.$t;
            c.duration = a.media$group.yt$duration.seconds || 60;
            c.image = a.media$group.media$thumbnail[0].url;
            var d;
            if (a.yt$accessControl) for (d = a.yt$accessControl.length; d--;) if ("embed" == a.yt$accessControl[d].action && "denied" == a.yt$accessControl[d].permission) {
                c.format = 0;
                break
            }
            c.index = b;
            d = Utils.authorTitle(c.title);
            c.author = d.author || c.author;
            c.title = d.title;
            c.id = 0;
            return c
        },
        onError: function (a, b) {
            console.log(a, b);
            !this.related && !this.importing && Dialog.alert(Lang.alerts.pleaseTryAgain, null, Lang.alerts.youtubeError);
            this.callback([])
        }
    }),
    YouTubeImportService = Class.extend({
        init: function () {
            this.timeoutID = 0
        },
        load: function (a, b, c) {
            this.query = a;
            this.favorites = b;
            this.callback = c;
            this.start = 1;
            this.index = 0;
            this.data = [];
            this.next()
        },
        next: function () {
            this.timeoutID && clearTimeout(this.timeoutID);
            this.resultCount = 0;
            var a = this.getURL() +
                "?v=2&alt=json&start-index=" + this.start + "&max-results=50&format=5&paid-content=false&callback=?";
            $.jsonp({
                url: a,
                success: $.proxy(this.onComplete, this),
                error: $.proxy(this.onError, this)
            })
        },
        getURL: function () {
            return this.favorites ? "http://gdata.youtube.com/feeds/api/users/" + encodeURIComponent(this.query) + "/favorites" : "http://gdata.youtube.com/feeds/api/playlists/" + encodeURIComponent(this.query)
        },
        onComplete: function (a) {
            var b = !0;
            try {
                this.deserialize(a)
            } catch (c) {
                b = !1
            }
            b ? 0 < this.resultCount ? (this.start += 50,
            this.timeoutID = setTimeout($.proxy(this.next, this), 20)) : (this.eliminateDuplicates(), this.callback(this.data)) : (Dialog.alert(Lang.alerts.pleaseTryAgain, null, Lang.alerts.youtubeError), this.callback([]))
        },
        deserialize: function (a) {
            if (a = a.feed.entry) {
                this.resultCount = a.length;
                for (var b = 0; b < this.resultCount; ++b) try {
                    var c = a[b],
                        d, e;
                    if (c.yt$accessControl) {
                        d = !1;
                        for (e = c.yt$accessControl.length; e--;) if ("embed" == c.yt$accessControl[e].action && "denied" == c.yt$accessControl[e].permission) {
                            d = !0;
                            break
                        }
                        if (d) continue
                    }
                    if (c.media$group.media$thumbnail[0].url) {
                        var f = {
                            format: 1
                        };
                        f.cid = c.media$group.yt$videoid.$t;
                        c.media$group.media$credit && c.media$group.media$credit.length && c.media$group.media$credit[0].$t ? f.author = c.media$group.media$credit[0].$t : c.author && c.author.length && c.author[0].name && (f.author = c.author[0].name.$t);
                        f.title = c.media$group.media$title.$t;
                        var g = Utils.authorTitle(f.title);
                        f.author = g.author || f.author;
                        f.title = g.title;
                        f.duration = c.media$group.yt$duration.seconds || 60;
                        f.image = c.media$group.media$thumbnail[0].url;
                        f.index = this.index++;
                        f.id = 0;
                        this.data.push(f)
                    }
                } catch (h) {}
            } else this.resultCount = 0
        },
        eliminateDuplicates: function () {
            this.hash = {};
            for (var a = [], b = this.data.length, c = 0; c < b; ++c) {
                var d = this.data[c];
                this.hash[d.cid] || (this.hash[d.cid] = !0, a.push(d))
            }
            this.data = a
        },
        onError: function (a, b) {
            console.log(a, b);
            Dialog.alert(Lang.alerts.pleaseTryAgain, null, Lang.alerts.youtubeError);
            this.callback([])
        }
    }),
    YouTubePlaylistService = Class.extend({
        init: function () {},
        load: function (a, b) {
            this.username = a;
            this.callback = b;
            this.start = 1;
            this.data = [];
            this.next()
        },
        next: function () {
            this.timeoutID && clearTimeout(this.timeoutID);
            this.resultCount = 0;
            $.jsonp({
                url: "http://gdata.youtube.com/feeds/api/users/" + this.username + "/playlists?v=2&alt=json&start-index=" + this.start + "&max-results=50&callback=?",
                success: $.proxy(this.onComplete, this),
                error: $.proxy(this.onError, this)
            })
        },
        onComplete: function (a) {
            var b = !0;
            try {
                this.deserialize(a)
            } catch (c) {
                b = !1
            }
            b ? 0 < this.resultCount ? (this.start += 50, this.timeoutID = setTimeout($.proxy(this.next, this), 20)) : (this.data.sort(this.sortByName), this.data.unshift({
                name: "Favorites",
                username: this.username
            }), this.callback(this.data)) : (Dialog.alert(Lang.alerts.pleaseTryAgain, null, Lang.alerts.youtubeError), this.callback([]))
        },
        sortByName: function (a, b) {
            return a.name > b.name ? 1 : a.name < b.name ? -1 : 0
        },
        deserialize: function (a) {
            if (a = a.feed.entry) {
                this.resultCount = a.length;
                for (var b = 0; b < this.resultCount; ++b) this.data.push({
                    playlistID: a[b].yt$playlistId.$t,
                    name: a[b].title.$t,
                    count: a[b].yt$countHint.$t
                })
            } else this.resultCount = 0
        },
        onError: function (a, b) {
            console.log(a, b);
            Dialog.alert(Lang.alerts.usernameNotFound, null, Lang.alerts.youtubeError);
            this.callback([])
        }
    }),
    YouTubeSuggestService = Class.extend({
        init: function () {
            this.callback = null
        },
        load: function (a) {
            a = "http://clients1.google.com/complete/search?client=youtube&hl=" + Models.user.data.language + "&ds=yt&cp=3&gs_id=d&q=" + encodeURIComponent(a) + "&callback=?";
            $.jsonp({
                url: a,
                success: $.proxy(this.onComplete, this),
                error: $.proxy(this.onError, this)
            })
        },
        onComplete: function (a) {
            for (var b = a[1].length, c = [], d = 0; d < b; ++d) c.push(a[1][d][0]);
            this.callback(c)
        },
        onError: function (a, b) {
            console.log("YouTube Suggest Error");
            console.log(a,
            b);
            this.callback([])
        }
    }),
    MediaSelectService = Service.extend({
        init: function (a) {
            this._super();
            this.after = Utils.convertNumberStringToUnixDateString(a)
        },
        execute: function () {
            rpcGW.execute("media.select", this, this.after)
        },
        parse: function (a) {
            this.after = null;
            if (0 != a.status) this.onStatusError(a.status);
            else {
                for (var b = a.data.length; b--;) Utils.deserializeModified(a.data[b]);
                this.successCallback(a.data)
            }
        }
    }),
    MediaUpdateService = Service.extend({
        init: function (a) {
            this._super();
            this.item = {
                id: a.id,
                author: a.author,
                title: a.title
            }
        },
        execute: function () {
            rpcGW.execute("media.update", this, [this.item])
        },
        parse: function (a) {
            if (0 == a.status) Utils.deserializeModified(a.data[0]), a.data[0].author = this.item.author, a.data[0].title = this.item.title, this.item = null, this.successCallback(a);
            else this.onStatusError(a.status)
        }
    }),
    PlaylistMediaInsertService = Service.extend({
        init: function (a, b, c, d) {
            this._super();
            this.id = a;
            this.name = b;
            this.items = Utils.serializeMediaItems(c);
            this.beforeMediaID = d
        },
        execute: function () {
            rpcGW.execute("playlist.media.insert", this,
            this.id, this.name, this.beforeMediaID, this.items)
        },
        parse: function (a) {
            this.beforeMediaID = this.items = null;
            if (0 == a.status) {
                Utils.deserializeModified(a.data[0]);
                if (0 < a.data[1].length) for (var b = a.data[1].length; b--;) Utils.deserializeModified(a.data[1][b]);
                this.successCallback(a)
            } else if (2 == a.status) Dialog.alert(Lang.alerts.playlistLimit);
            else this.onStatusError(a.status);
            this.id = this.name = null
        }
    }),
    PlaylistMediaDeleteService = Service.extend({
        init: function (a, b) {
            this._super();
            this.id = a;
            this.items = Utils.serializeMediaItems(b)
        },
        execute: function () {
            rpcGW.execute("playlist.media.delete", this, this.id, this.items)
        },
        parse: function (a) {
            this.id = null;
            if (0 == a.status) {
                Utils.deserializeModified(a.data);
                a.media = [];
                for (var b = this.items.length, c = 0; c < b; ++c) a.media.push(this.items[c]);
                this.successCallback(a);
                this.items = null
            } else if (2 == a.status) Dialog.alert(Lang.alerts.deleteLastItem);
            else this.onStatusError(a.status)
        }
    }),
    PlaylistMediaMoveService = Service.extend({
        init: function (a, b, c) {
            this._super();
            this.id = a;
            this.beforeMediaID = c;
            this.items = Utils.serializeMediaItems(b)
        },
        execute: function () {
            rpcGW.execute("playlist.media.move", this, this.id, this.beforeMediaID, this.items)
        },
        parse: function (a) {
            this.beforeMediaID = this.items = this.id = null;
            if (0 == a.status) Utils.deserializeModified(a.data), this.successCallback(a);
            else this.onStatusError(a.status)
        }
    }),
    SearchMediaCIDService = Service.extend({
        init: function (a) {
            this._super();
            this.cids = a
        },
        execute: function () {
            rpcGW.execute("media.lookup", this, this.cids)
        },
        parse: function (a) {
            this.cids = null;
            if (0 == a.status) {
                for (var b = a.data.length; b--;) Utils.deserializeModified(a.data[b]);
                this.successCallback(a.data)
            } else this.onStatusError(a.status)
        }
    }),
    PlaylistSelectService = Service.extend({
        init: function (a) {
            this._super();
            this.after = Utils.convertNumberStringToUnixDateString(a)
        },
        execute: function () {
            rpcGW.execute("playlist.select", this, this.after, null, 100, null)
        },
        parse: function (a) {
            this.after = null;
            if (0 == a.status) {
                for (var b = a.data.length; b--;) Utils.deserializeModified(a.data[b]);
                this.successCallback(a.data)
            } else this.onStatusError(a.status)
        }
    }),
    PlaylistInsertService = Service.extend({
        init: function (a) {
            this._super();
            this.name = a
        },
        execute: function () {
            rpcGW.execute("playlist.create", this, this.name)
        },
        parse: function (a) {
            this.name = null;
            if (0 == a.status) Utils.deserializeModified(a.data), this.successCallback(a.data);
            else this.onStatusError(a.status)
        }
    }),
    PlaylistDeleteService = Service.extend({
        init: function (a) {
            this._super();
            this.id = a
        },
        execute: function () {
            rpcGW.execute("playlist.delete", this, [this.id])
        },
        parse: function (a) {
            if (0 == a.status) {
                for (var b = a.data.length; b--;) Utils.deserializeModified(a.data[b]);
                this.successCallback(a.data)
            } else if (2 == a.status) Dialog.alert(Lang.alerts.deleteActive);
            else this.onStatusError(a.status)
        }
    }),
    PlaylistRenameService = Service.extend({
        init: function (a, b) {
            this._super();
            this.id = a;
            this.name = b
        },
        execute: function () {
            rpcGW.execute("playlist.rename", this, this.id, this.name)
        },
        parse: function (a) {
            this.name = null;
            if (0 == a.status) Utils.deserializeModified(a.data), this.successCallback(a.data);
            else this.onStatusError(a.status)
        }
    }),
    PlaylistActivateService = Service.extend({
        init: function (a) {
            this._super();
            this.id = a
        },
        execute: function () {
            rpcGW.execute("playlist.activate",
            this, this.id)
        },
        parse: function (a) {
            if (0 == a.status) {
                for (var b = a.data.length; b--;) Utils.deserializeModified(a.data[b]);
                this.successCallback(a.data)
            } else if (2 == a.status) Dialog.alert(Lang.alerts.emptyPlaylist);
            else this.onStatusError(a.status)
        }
    }),
    ModerationForceSkipService = Service.extend({
        init: function (a) {
            this._super();
            this.historyID = a
        },
        execute: function () {
            rpcGW.execute("moderate.skip", this, this.historyID)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    ModerationKickUserService = Service.extend({
        init: function (a,
        b, c) {
            this._super();
            this.userID = a;
            this.reason = b;
            this.duration = c
        },
        execute: function () {
            !Models.room.admins[Models.user.data.id] && !Models.room.ambassadors[Models.user.data.id] && !Models.room.userHash[Models.user.data.id].owner && (this.duration = 60);
            rpcGW.execute("moderate.kick", this, this.userID, this.reason, this.duration)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    ModerationAddDJService = Service.extend({
        init: function (a) {
            this._super();
            this.userID = a
        },
        execute: function () {
            rpcGW.execute("moderate.add_dj",
            this, this.userID)
        },
        parse: function (a) {
            if (0 != a.status) if (3 == a.status) Dialog.alert(Lang.alerts.modAddDJ);
            else if (4 == a.status) Dialog.alert(Lang.alerts.maxWaitList);
            else this.onStatusError(a.status)
        }
    }),
    ModerationRemoveDJService = Service.extend({
        init: function (a) {
            this._super();
            this.userID = a
        },
        execute: function () {
            rpcGW.execute("moderate.remove_dj", this, this.userID)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    ModerationWaitListRemoveService = Service.extend({
        init: function (a) {
            this._super();
            this.userID = a
        },
        execute: function () {
            rpcGW.execute("moderate.remove_dj", this, this.userID)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    ModerationPermissionsService = Service.extend({
        init: function (a, b) {
            this._super();
            this.userID = a;
            this.permission = b
        },
        execute: function () {
            rpcGW.execute("moderate.permissions", this, this.userID, this.permission)
        },
        parse: function (a) {
            if (0 != a.status) if (1 == a.status) 4 == this.permission ? Dialog.alert(Lang.alerts.cohostLimitError) : 3 == this.permission ? Dialog.alert(Lang.alerts.managerLimitError) : 2 == this.permission ? Dialog.alert(Lang.alerts.bouncerLimitError) : 1 == this.permission && Dialog.alert(Lang.alerts.featuredDJLimitError);
            else if (2 == a.status) Dialog.alert(Lang.alerts.permissionError);
            else this.onStatusError(a.status)
        }
    }),
    ModerationBoothCleanupService = Service.extend({
        init: function () {
            this._super()
        },
        execute: function () {
            rpcGW.execute("booth.cleanup", this, Models.room.data.id)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    ModerationChatDeleteService = Service.extend({
        init: function (a) {
            this._super();
            this.chatID = a
        },
        execute: function () {
            rpcGW.execute("moderate.chat_delete", this, this.chatID)
        },
        parse: function (a) {
            if (0 != a.status) this.onStatusError(a.status)
        }
    }),
    UserChangeDisplayNameService = Service.extend({
        init: function (a) {
            this._super();
            this.displayName = a
        },
        execute: function () {
            2 < this.displayName.length && -1 == this.displayName.indexOf("http://") ? socket.execute("user.change_name", this, this.displayName) : this.parse({
                status: 5
            })
        },
        parse: function (a) {
            if (0 == a.status) null != this.successCallback && this.successCallback(this.displayName);
            else this.onStatusError(a.status)
        }
    }),
    UserChangeAvatarService = Service.extend({
        init: function (a) {
            this._super();
            this.avatarID = a
        },
        execute: function () {
            rpcGW.execute("user.set_avatar", this, this.avatarID)
        },
        parse: function (a) {
            if (0 == a.status) null != this.successCallback && this.successCallback(this.avatarID);
            else if (2 == a.status) AvatarOverlay.setSelectedAvatar(Models.user.data.avatarID), Dialog.alert(Lang.alerts.notEnoughPoints);
            else this.onStatusError(a.status)
        }
    }),
    UserLanguageUpdateService = Service.extend({
        init: function (a) {
            this._super();
            this.language = a
        },
        execute: function () {
            rpcGW.execute("user.set_language", this, this.language)
        },
        parse: function (a) {
            0 == a.status ? (("en" == this.language && Models.chat.uiLanguageMap[Models.user.data.language] || "en" != this.language && Models.chat.uiLanguageMap[this.language]) && Dialog.alert(Lang.alerts.languageChangedMessage, $.proxy(Utils.forceRefresh, Utils), Lang.alerts.update, !0), this.successCallback(this.language), _gaq.push(["_trackEvent", "Language", this.language, Models.user.data.id])) : Dialog.alert(Lang.alerts.language + a.status)
        }
    }),
    UserFanService = Service.extend({
        init: function (a, b) {
            this._super();
            this.value = a;
            this.userID = b
        },
        execute: function () {
            var a = "user.follow";
            this.value || (a = "user.unfollow");
            rpcGW.execute(a, this, this.userID)
        },
        parse: function (a) {
            0 == a.status ? this.value ? (Models.chat.receive({
                type: "update",
                message: Lang.messages.fanOf.split("%NAME%").join($("<span/>").text(a.data).html()),
                language: Models.user.data.language
            }), Models.user.addFollowing(this.userID)) : (Models.chat.receive({
                type: "update",
                message: Lang.messages.unFanOf.split("%NAME%").join($("<span/>").text(a.data).html()),
                language: Models.user.data.language
            }), Models.user.removeFollowing(this.userID)) : value ? Dialog.alert(Lang.alerts.fan + a.status) : Dialog.alert(Lang.alerts.unfan + a.status)
        }
    }),
    UserDisplayNameAvailableService = Service.extend({
        init: function (a) {
            this._super();
            this.displayName = a
        },
        execute: function () {
            1 < this.displayName.length ? rpcGW.execute("user.name_available", this, this.displayName) : this.parse({
                status: 5
            })
        },
        parse: function (a) {
            null != this.successCallback && this.successCallback(0 == a.status)
        }
    }),
    UserStatusUpdateService = Service.extend({
        init: function (a) {
            this._super();
            this.userStatus = a
        },
        execute: function () {
            rpcGW.execute("user.set_status", this, this.userStatus)
        },
        parse: function (a) {
            if (0 == a.status) null != this.successCallback && this.successCallback(this.displayName);
            else this.onStatusError(a.status)
        }
    }),
    UserGetByIdsService = Service.extend({
        init: function (a, b) {
            this._super();
            this.ids = a;
            this.pos = b
        },
        execute: function () {
            rpcGW.execute("user.get_by_ids", this, this.ids)
        },
        parse: function (a) {
            if (0 == a.status) {
                a.data.constructor != Array && (a.data = [a.data]);
                for (var b = a.data.length, c = 0; c < b; ++c) a.data[c].owner = a.data[c].id == Models.room.data.owner, a.data[c].permission = Models.room.data.staff[a.data[c].id] ? Models.room.data.staff[a.data[c].id] : 0, Models.room.admins[a.data[c].id] ? a.data[c].admin = !0 : Models.room.ambassadors[a.data[c].id] && (a.data[c].ambassador = !0);
                null != this.successCallback && (this.pos ? this.successCallback(a.data[0], this.pos) : this.successCallback(a.data))
            } else this.onStatusError(a.status)
        }
    }),
    ChatModel = EventDispatcher.extend({
        init: function () {
            this._super();
            this.initChatLanguages();
            this.lastChat = this.rateLimit = 0
        },
        ready: function () {
            this.onChatSoundUpdate()
        },
        clear: function () {
            this.dispatchEvent("chatClear")
        },
        toggleChatSound: function () {
            DB.settings.chatSound = "all" == DB.settings.chatSound ? "mentions" : "mentions" == DB.settings.chatSound ? "off" : "all";
            DB.saveSettings();
            this.onChatSoundUpdate()
        },
        onChatSoundUpdate: function () {
            var a, b;
            "off" != DB.settings.chatSound ? (a = "url(http://plug.dj/_/static/images/ButtonSoundOn.25ddac79.png)", b = "all" == DB.settings.chatSound ? Lang.chat.all : Lang.chat.mentions) : (a = "url(http://plug.dj/_/static/images/ButtonSoundOff.c40cf284.png)", b = Lang.chat.off);
            this.dispatchEvent("chatSoundUpdate", {
                image: a,
                text: b
            })
        },
        sendChat: function (a) {
            if (!this.chatCommand(a)) {
                var b = Date.now(),
                    c = {}, d = !0;
                b - this.lastChat > 1E3 * this.rateLimit ? (this.lastChat = b, c.from = Models.user.data.username, c.fromID = Models.user.data.id, 0 == a.indexOf("/em") || 0 == a.indexOf("/me") ? (c.type = "emote", c.message = Utils.cleanTypedString(a.substr(3))) : (c.type = "message", c.message = Utils.cleanTypedString(a)), (-1 == c.message.indexOf("http://") && -1 == c.message.indexOf("https://") || Models.user.hasPermission(Models.user.FEATUREDDJ) || 6E5 < Date.now() - Models.room.joinTime) && socket.chat(a)) : (a = this.rateLimit - ~~ ((b - this.lastChat) / 1E3), 0 == a && (a = 1), c.message = 1 == a ? Lang.chat.limit1 : Lang.chat.limit.split("%SECS%").join("" + a), c.type = "update", d = !1);
                c.language = Models.user.data.language;
                this.onChatReceived(c);
                return d
            }
            return !0
        },
        receive: function (a) {
            a.language || (a.language = Models.user.data.language);
            if (!a.fromID || a.fromID != Models.user.data.id) this.onChatReceived(a)
        },
        onChatReceived: function (a) {
            var b = -1 < $("<span/>").html(a.message).text().indexOf("@" + Models.user.data.username) + " ";
            b && "emote" != a.type && (a.type = "mention");
            "log" == a.type && (a.type = "moderation");
            var c = {
                type: a.type
            }, d = a.from && ("message" == a.type || "mention" == a.type) ? ": " : "";
            if (a.from && (c.from = {
                value: a.from,
                "class": "chat-from"
            }, a.fromID)) {
                "emote" != a.type ? Models.room.admins[a.fromID] ? c.from.class = "chat-from-admin" : Models.room.ambassadors[a.fromID] ? c.from.class = "chat-from-ambassador" : Models.room.data.owner == a.fromID ? c.from.class = "chat-from-host" : Models.room.data.staff[a.fromID] && 5 > Models.room.data.staff[a.fromID] ? 4 == Models.room.data.staff[a.fromID] ? c.from.class = "chat-from-cohost" : 3 == Models.room.data.staff[a.fromID] ? c.from.class = "chat-from-manager" : 2 == Models.room.data.staff[a.fromID] ? c.from.class = "chat-from-bouncer" : 1 == Models.room.data.staff[a.fromID] && (c.from.class = "chat-from-featureddj") : c.from.class = a.fromID == Models.user.data.id ? "chat-from-you" : "chat-from" : c.from.class = "chat-from";
                Models.room.admins[a.fromID] ? c.from.admin = !0 : Models.room.ambassadors[a.fromID] ? c.from.ambassador = !0 : Models.room.data.owner == a.fromID ? c.from.owner = !0 : Models.room.data.staff[a.fromID] && 5 > Models.room.data.staff[a.fromID] && (c.from.staff = Models.room.data.staff[a.fromID]);
                c.from.id = a.fromID;
                if (a.fromID != Models.user.data.id && (c.from.clickable = !0, c.deletable = !1, !Models.room.admins[a.fromID] && !Models.room.ambassadors[a.fromID])) if (Models.room.admins[Models.user.data.id] || Models.room.ambassadors[Models.user.data.id]) c.deletable = !0;
                else if (Models.user.hasPermission(Models.user.BOUNCER) && (!Models.room.data.staff[a.fromID] || Models.room.data.staff[Models.user.data.id] > Models.room.data.staff[a.fromID])) c.deletable = !0;
                c.chatID = a.chatID
            }
            c.timestamp = Utils.getChatTimestamp(24 == DB.settings.chatTS);
            !DB.settings.chatTranslation || !a.translated ? c.text = d + this.parse(a.message) : 1 != a.translated ? (c.text = d + this.parse(a.translated), c.lang = {
                html: "<br/><em>[" + this.languageMap[a.language] + "]</em>",
                title: $(this.parse(a.message, !0)).text()
            }) : (c.text = d + this.parse(a.message), c.lang = {
                html: "<br/><em>[" + this.languageMap[a.language] + "]</em>",
                title: Lang.tooltips.couldNotTranslate
            });
            c.showTimestamp = DB.settings.chatTS;
            a.fromID && "off" != DB.settings.chatSound && (b ? c.sound = "mention" : "mentions" != DB.settings.chatSound && (c.sound = "chat"));
            this.dispatchEvent("chatReceived", {
                message: c
            })
        },
        parse: function (a, b) {
            if (-1 == a.indexOf("http")) return a;
            var c = a.indexOf("http"),
                d = a.indexOf(" ", c),
                e = a.indexOf("\n", c); - 1 < d && -1 < e ? d = Math.min(d, e) : -1 == d && (d = a.length);
            var e = a.substr(0,
            c),
                f = a.substr(d);
            return !b ? (c = a.substring(c, d), d = -1 < c.indexOf("plug.dj/") && -1 == c.indexOf("/about") && -1 == c.indexOf("blog.") && -1 == c.indexOf("support.") ? "_self" : "_blank", e + '<a href="' + c + '" target="' + d + '">' + c + "</a>" + this.parse(f)) : e + "[link]" + this.parse(f, b)
        },
        deleteChat: function (a) {
            a && Models.user.hasPermission(Models.user.BOUNCER) && new ModerationChatDeleteService(a)
        },
        onChatDelete: function (a) {
            this.dispatchEvent("chatDelete", a)
        },
        chatCommand: function (a) {
            var b;
            if ("/help" == a) return a = {
                type: "update"
            }, a.message = Lang.chat.help, this.receive(a), !0;
            if ("/users" == a) return UserListOverlay.show(), !0;
            if ("/hd on" == a) return Playback.setHD(!0), !0;
            if ("/hd off" == a) return Playback.setHD(!1), !0;
            if ("/chat big" == a) return this.expand(), !0;
            if ("/chat small" == a) return this.collapse(), !0;
            if ("/afk" == a) return Models.user.changeStatus(1), !0;
            if ("/back" == a) return Models.user.changeStatus(0), !0;
            if (0 == a.indexOf("/ts ")) return b = a.split(" ").pop(), DB.settings.chatTS = "12" == b ? 12 : "24" == b ? 24 : !1, this.dispatchEvent("timestampUpdate", {
                value: DB.settings.chatTS
            }),
            DB.saveSettings(), !0;
            if (0 == a.indexOf("/cap ")) {
                if (a = parseInt(a.split(" ").pop()), 0 < a && 201 > a) return RoomUser.audience.gridData.avatarCap = a, RoomUser.redraw(), DB.settings.avatarcap = a, DB.saveSettings(), log(Lang.messages.cap.split("%COUNT%").join("" + a)), !0
            } else {
                if ("/cleanup" == a) return DB.reset(), Dialog.alert(Lang.alerts.updateMessage, $.proxy(Utils.forceRefresh, Utils), Lang.alerts.update, !0), !0;
                if ("/stream on" == a) DB.settings.streamDisabled = !1, DB.saveSettings(), Playback.media && Playback.play(Playback.media,
                Playback.mediaStartTime), b = "Video/audio streaming enabled.";
                else if ("/stream off" == a) DB.settings.streamDisabled = !0, DB.saveSettings(), Playback.stop(), b = "<strong>Video/audio streaming has been stopped.</strong> Type <em>/stream on</em> to enable again.";
                else {
                    if ("/clear" == a) return this.dispatchEvent("chatClear"), _gaq.push(["_trackEvent", "Chat", "Clear", Models.room.data.id]), !0;
                    Models.room.ambassadors[Models.user.data.id] ? "/fixbooth" == a && (new ModerationBoothCleanupService, b = "Fixing Booth") : Models.room.admins[Models.user.data.id] && ("/fixbooth" == a ? (new ModerationBoothCleanupService, b = "Fixing Booth") : 0 == a.indexOf("/audience ") ? (a = parseInt(a.split(" ").pop()), 0 < a ? (RoomUser.testAddAvatar(a), b = "Adding " + a + " fake avatars to audience") : (RoomUser.clear(), RoomUser.setAudience(Models.room.getAudience()), RoomUser.setDJs(Models.room.getDJs()), b = "Cleared fake avatars from audience")) : 0 == a.indexOf("/ping ") ? (DB.settings.showPings = "/ping on" == a ? !0 : !1, DB.saveSettings(), b = "Ping messages are " + (DB.settings.showPings ? "on" : "off")) : 0 == a.indexOf("/speed ") && (b = parseInt(a.split(" ").pop()), animSpeed = 0 < b ? b : 83, b = "Setting animation speed to " + animSpeed))
                }
            }
            return b ? (a = {
                type: "system"
            }, a.message = b, this.receive(a), !0) : !1
        },
        initChatLanguages: function () {
            this.uiLanguages = [];
            this.chatLanguages = [];
            this.uiLanguages.push({
                label: "Chinese (æ¼¢èªž)",
                value: "zh"
            });
            this.uiLanguages.push({
                label: "Deutsch",
                value: "de"
            });
            this.uiLanguages.push({
                label: "English",
                value: "en"
            });
            this.uiLanguages.push({
                label: "EspaÃ±ol",
                value: "es"
            });
            this.uiLanguages.push({
                label: "FranÃ§ais",
                value: "fr"
            });
            this.uiLanguages.push({
                label: "Japanese (æ—¥æœ¬èªž)",
                value: "ja"
            });
            this.uiLanguages.push({
                label: "Korean (í•œêµ­ì¸)",
                value: "ko"
            });
            this.uiLanguages.push({
                label: "PortuguÃªs",
                value: "pt"
            });
            this.chatLanguages.push({
                label: "Afrikaans",
                value: "af"
            });
            this.chatLanguages.push({
                label: "Shqiptar",
                value: "sq"
            });
            this.chatLanguages.push({
                label: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©",
                value: "ar"
            });
            this.chatLanguages.push({
                label: "Ð±ÐµÐ»Ð°Ñ€ÑƒÑÐºÐ°Ð¹",
                value: "be"
            });
            this.chatLanguages.push({
                label: "Ð±ÑŠÐ»Ð³Ð°Ñ€ÑÐºÐ¸",
                value: "bg"
            });
            this.chatLanguages.push({
                label: "CatalÃ ",
                value: "ca"
            });
            this.chatLanguages.push({
                label: "Hrvatski",
                value: "hr"
            });
            this.chatLanguages.push({
                label: "ÄŒeskÃ½",
                value: "cs"
            });
            this.chatLanguages.push({
                label: "Dansk",
                value: "da"
            });
            this.chatLanguages.push({
                label: "Nederlands",
                value: "nl"
            });
            this.chatLanguages.push({
                label: "Eesti",
                value: "et"
            });
            this.chatLanguages.push({
                label: "Tagalog",
                value: "tl"
            });
            this.chatLanguages.push({
                label: "Suomi",
                value: "fi"
            });
            this.chatLanguages.push({
                label: "Galacian",
                value: "gl"
            });
            this.chatLanguages.push({
                label: "ÎµÎ»Î»Î·Î½Î¹ÎºÎ¬",
                value: "el"
            });
            this.chatLanguages.push({
                label: "×¢×‘×¨×™×ª",
                value: "iw"
            });
            this.chatLanguages.push({
                label: "à¤¹à¤¿à¤‚à¤¦à¥€",
                value: "hi"
            });
            this.chatLanguages.push({
                label: "Magyar",
                value: "hu"
            });
            this.chatLanguages.push({
                label: "Ãslenska",
                value: "is"
            });
            this.chatLanguages.push({
                label: "Indonesian",
                value: "id"
            });
            this.chatLanguages.push({
                label: "Gaeilge",
                value: "ga"
            });
            this.chatLanguages.push({
                label: "Italiano",
                value: "it"
            });
            this.chatLanguages.push({
                label: "Latvijas",
                value: "lv"
            });
            this.chatLanguages.push({
                label: "Lietuvos",
                value: "lt"
            });
            this.chatLanguages.push({
                label: "Ð¼Ð°ÐºÐµÐ´Ð¾Ð½ÑÐºÐ¸",
                value: "mk"
            });
            this.chatLanguages.push({
                label: "Melayu",
                value: "ms"
            });
            this.chatLanguages.push({
                label: "Maltija",
                value: "mt"
            });
            this.chatLanguages.push({
                label: "Norweigian",
                value: "no"
            });
            this.chatLanguages.push({
                label: "ÙØ§Ø±Ø³ÛŒ",
                value: "fa"
            });
            this.chatLanguages.push({
                label: "Polski",
                value: "pl"
            });
            this.chatLanguages.push({
                label: "RomÃ¢n",
                value: "ro"
            });
            this.chatLanguages.push({
                label: "Ð ÑƒÑÑÐºÐ¸Ð¹",
                value: "ru"
            });
            this.chatLanguages.push({
                label: "Ð¡Ñ€Ð¿ÑÐºÐ¸",
                value: "sr"
            });
            this.chatLanguages.push({
                label: "SlovenskÃ½ch",
                value: "sk"
            });
            this.chatLanguages.push({
                label: "Slovenski",
                value: "sl"
            });
            this.chatLanguages.push({
                label: "Kiswahili",
                value: "sw"
            });
            this.chatLanguages.push({
                label: "Svenskt",
                value: "sv"
            });
            this.chatLanguages.push({
                label: "Thai (à¸ à¸²à¸©à¸²à¹„à¸—à¸¢)",
                value: "th"
            });
            this.chatLanguages.push({
                label: "TÃ¼rk",
                value: "tr"
            });
            this.chatLanguages.push({
                label: "Ð£ÐºÑ€Ð°Ñ—Ð½ÑÑŒÐºÐ°",
                value: "uk"
            });
            this.chatLanguages.push({
                label: "Viá»‡t",
                value: "vi"
            });
            this.chatLanguages.push({
                label: "Cymraeg",
                value: "cy"
            });
            this.chatLanguages.push({
                label: "×™×™Ö´×“×™×©",
                value: "yi"
            });
            this.languageMap = {};
            this.uiLanguageMap = {};
            for (var a = this.uiLanguages.length; a--;) this.languageMap[this.uiLanguages[a].value] = this.uiLanguages[a].label, this.uiLanguageMap[this.uiLanguages[a].value] = this.uiLanguages[a].label;
            for (a = this.chatLanguages.length; a--;) this.languageMap[this.chatLanguages[a].value] = this.chatLanguages[a].label;
            this.uiLanguages.sort(this.sortLanguages);
            this.chatLanguages.sort(this.sortLanguages)
        },
        sortLanguages: function (a, b) {
            return a.label > b.label ? 1 : a.label < b.label ? -1 : 0
        }
    }),
    PlaylistModel = Class.extend({
        init: function () {
            this.data = [];
            this.facade = new PlaylistServiceFacade;
            this.facade.syncCompleteCallback = $.proxy(this.onSyncComplete, this);
            this.storeRead = LS.read.playlist;
            this.storeRead.readCallback = $.proxy(this.onStoreRead, this);
            this.selectedPlaylistID = 0
        },
        sync: function () {
            this.facade.sync()
        },
        read: function () {
            this.storeRead.load()
        },
        onSyncComplete: function () {
            this.read()
        },
        onStoreRead: function (a) {
            this.data = a;
            this.selectedPlaylistID = (a = this.getSelected()) ? a.id : 0;
            null != this.updateCallback && this.updateCallback(this.data)
        },
        getByID: function (a) {
            return DB.playlist[a]
        },
        getSelected: function () {
            if (this.data) for (var a = this.data.length; a--;) if (this.data[a].selected) return this.data[a]
        }
    }),
    SoundCloudPlaylistModel = Class.extend({
        init: function () {
            this.updateCallback = null;
            this.data = [];
            this.selectedIndex = 0
        },
        load: function () {
            this.data = [];
            this.selectedIndex = 0;
            Models.search.facade.scSets(0, 200, $.proxy(this.onComplete, this))
        },
        onComplete: function (a) {
            this.data = a;
            this.updateCallback(a)
        },
        importSelected: function () {
            this.createPlaylist(this.data[this.selectedIndex].title, this.data[this.selectedIndex].tracks, 1);
            setTimeout($.proxy(this.importSelectedAlert,
            this), 100)
        },
        "import": function () {
            if (0 < this.data.length) {
                for (var a = this.data.length, b = 0; b < a; ++b) this.createPlaylist(this.data[b].title, this.data[b].tracks, 1);
                setTimeout($.proxy(this.importAllAlert, this), 100)
            }
        },
        createPlaylist: function (a, b, c) {
            if (0 < b.length) {
                var d = a;
                1 < c && (d += " " + c);
                if (200 >= b.length) Models.playlist.facade.create(d, b);
                else {
                    var e = b.slice(0, 200);
                    Models.playlist.facade.create(d, e);
                    b.splice(0, 200);
                    this.createPlaylist(a, b, ++c)
                }
            }
        },
        importSelectedAlert: function () {
            Dialog.alert(Lang.alerts.playlistImporting.split("%PLAYLIST%").join(this.data[this.selectedIndex].title),
            null, Lang.alerts.import)
        },
        importAllAlert: function () {
            Dialog.alert(Lang.alerts.scSetsImporting, null, Lang.alerts.import)
        }
    }),
    PlaylistMediaModel = Class.extend({
        init: function (a) {
            this.id = a;
            this.data = [];
            this.currentFilter = this.currentLookup = "";
            this.lookupCallback = this.updateCallback = null;
            this.facade = new PlaylistMediaServiceFacade(this.id);
            this.facade.updateCallback = $.proxy(this.onActionComplete, this);
            this.storeRead = LS.read.playlistMedia(this.id);
            this.storeRead.readCallback = $.proxy(this.onStoreRead, this);
            this.storeRead.lookupCallback = $.proxy(this.onStoreLookup, this)
        },
        mediaUpdate: function (a, b, c) {
            this.facade.mediaUpdate({
                id: a,
                author: b,
                title: c
            })
        },
        mediaMove: function (a, b) {
            this.facade.mediaMove(a, b)
        },
        mediaMoveToTop: function (a, b) {
            var c = Models.playlist.facade.store.firstMedia(this.id);
            0 < c.length && (c = b && 2 == c.length ? c[1] : c[0], 0 != c && (c != a[0] ? this.facade.mediaMove(a, c) : 1 < a.length && this.facade.mediaMove(a, a[1].id)))
        },
        load: function (a) {
            this.currentFilter = a;
            this.read()
        },
        read: function () {
            this.currentFilter ? this.storeRead.filter(this.currentFilter) : this.storeRead.load()
        },
        mediaDelete: function (a) {
            this.facade.mediaDelete(a)
        },
        mediaInsert: function (a, b, c) {
            this.facade.mediaInsert(a, b, c)
        },
        lookup: function (a) {
            (this.currentLookup = a) && this.storeRead.lookup(this.currentLookup)
        },
        onStoreRead: function (a) {
            this.data = a;
            null != this.updateCallback && this.updateCallback(this.data, this.id)
        },
        onStoreLookup: function () {
            null != this.lookupCallback && this.lookupCallback(this.data)
        },
        onActionComplete: function () {
            MediaOverlay.hidePlaylistProgress();
            this.read()
        },
        destroy: function () {
            this.storeRead && (this.currentFilter = this.currentLookup = this.facade = this.data = null, this.storeRead.readCallback = null, this.lookupCallback = this.updateCallback = this.storeRead = this.storeRead.lookupCallback = null)
        }
    }),
    YouTubePlaylistModel = Class.extend({
        init: function () {
            this.updateCallback = null;
            this.data = []
        },
        load: function (a) {
            this.data = [];
            Models.search.facade.ytPlaylist(a, $.proxy(this.onComplete, this))
        },
        onComplete: function (a) {
            this.data = a;
            this.updateCallback(a)
        },
        "import": function () {
            0 < this.data.length && (this.importMediaModel || (this.importMediaModel = new YouTubePlaylistMediaModel, this.importMediaModel.updateCallback = $.proxy(this.onImportMediaComplete, this)), this.importIndex = 0, this.importNextPlaylist(), setTimeout($.proxy(this.importAlert, this), 100))
        },
        importNextPlaylist: function () {
            this.timeoutID && clearTimeout(this.timeoutID);
            this.importMediaModel.load(this.data[this.importIndex])
        },
        onImportMediaComplete: function (a) {
            this.createPlaylist(a, 1);
            ++this.importIndex < this.data.length && (this.timeoutID = setTimeout($.proxy(this.importNextPlaylist,
            this), 10))
        },
        createPlaylist: function (a, b) {
            if (0 < a.length) {
                var c = this.data[this.importIndex].username ? "YouTube Favorites" : this.data[this.importIndex].name;
                1 < b && (c += " " + b);
                if (200 >= a.length) Models.playlist.facade.create(c, a);
                else {
                    var d = a.slice(0, 200);
                    Models.playlist.facade.create(c, d);
                    a.splice(0, 200);
                    this.createPlaylist(a, ++b)
                }
            }
        },
        importAlert: function () {
            Dialog.alert(Lang.alerts.youtubeImporting, null, Lang.alerts.import)
        }
    }),
    YouTubePlaylistMediaModel = Class.extend({
        init: function () {
            this.updateCallback = null;
            this.data = []
        },
        load: function (a) {
            this.data = [];
            this.ytp = a;
            a.playlistID ? Models.search.facade.ytPlaylistVideos(a.playlistID, $.proxy(this.onComplete, this)) : Models.search.facade.ytFavoriteVideos(a.username, $.proxy(this.onComplete, this))
        },
        onComplete: function (a) {
            this.ytResults = a;
            if (0 < a.length) {
                this.hash = {};
                for (var b = a.length, c = 0; c < b; ++c) LS.media.lookup(a[c].cid) && (this.hash[a[c].cid] = !0, this.data.push(a[c]));
                this.appendUnknown()
            } else this.updateCallback([])
        },
        appendUnknown: function () {
            for (var a = this.ytResults.length,
            b = 0; b < a; ++b) this.hash[this.ytResults[b].cid] || this.data.push(this.ytResults[b]);
            this.updateCallback(this.data)
        },
        "import": function () {
            0 < this.data.length && this.createPlaylist([].concat(this.data), 1)
        },
        createPlaylist: function (a, b) {
            if (0 < a.length) {
                var c = this.ytp.username ? "YouTube Favorites" : this.ytp.name;
                1 < b && (c += " " + b);
                if (200 >= a.length) Models.playlist.facade.create(c, a);
                else {
                    var d = a.slice(0, 200);
                    Models.playlist.facade.create(c, d);
                    a.splice(0, 200);
                    this.createPlaylist(a, ++b)
                }
            }
        },
        onCIDResult: function (a) {
            if (a) for (var b = a.length, c = 0; c < b; ++c) this.hash[a[c].cid] = !0, this.data.push(a[c]);
            this.appendUnknown()
        }
    }),
    ModelRef = Class.extend({
        init: function () {
            this.media = new MediaServiceFacade;
            this.playlist = new PlaylistModel;
            this.search = new SearchModel;
            this.restrictedSearch = new RestrictedSearchModel;
            this.youtubePlaylist = new YouTubePlaylistModel;
            this.youtubePlaylistMedia = new YouTubePlaylistMediaModel;
            this.soundcloudPlaylist = new SoundCloudPlaylistModel;
            this.itunes = new iTunesModel;
            this.user = new UserModel;
            this.room = new RoomModel;
            this.history = new HistoryModel;
            this.chat = new ChatModel;
            this._pm = {}
        },
        playlistMedia: function (a) {
            this._pm[a] || (this._pm[a] = new PlaylistMediaModel(a));
            return this._pm[a]
        }
    }),
    HistoryModel = Class.extend({
        init: function () {
            this.data = [];
            this.hasLoaded = !1;
            this.currentID = this.updateCallback = null;
            this.timeoutID = 0
        },
        reset: function () {
            this.data = [];
            this.hasLoaded = !1;
            this.currentFilter = this.currentID = null
        },
        load: function () {
            this.timeoutID && clearTimeout(this.timeoutID);
            if (this.hasLoaded) this.updateCallback(this.data);
            else {
                this.currentFilter = null;
                Search.clearInputs();
                var a = new HistorySelectService;
                a.successCallback = $.proxy(this.onSuccess, this);
                a.errorCallback = $.proxy(this.onError, this)
            }
        },
        filter: function (a) {
            this.currentFilter = a;
            if (0 < this.data.length) if (this.currentFilter) {
                var b = [],
                    c = this.data.length;
                try {
                    for (var d = 0; d < c; ++d) {
                        var e = this.data[d];
                        e.media.author && e.media.title && (-1 < e.media.author.toLowerCase().indexOf(a) || -1 < e.media.title.toLowerCase().indexOf(a)) && b.push(e)
                    }
                } catch (f) {
                    console.error(f)
                }
                this.updateCallback(b)
            } else this.onSuccess(this.data)
        },
        djAdvance: function (a) {
            this.currentID = a;
            this.hasLoaded = !1;
            MediaOverlay.selection == MediaOverlay.historyListView && $("#media-overlay").is(":visible") && (this.timeoutID && clearTimeout(this.timeoutID), this.timeoutID = setTimeout($.proxy(this.load, this), 2E3))
        },
        roomScore: function (a) {
            0 < this.data.length && this.data[0].id == this.currentID && (this.data[0].room.score = a)
        },
        onSuccess: function (a) {
            this.data = a;
            this.hasLoaded = !0;
            this.roomScore(Models.room.roomScore.score);
            this.updateCallback(this.data)
        },
        onError: function () {
            this.data = [];
            this.hasLoaded = !1;
            this.updateCallback(this.data)
        }
    }),
    SearchModel = Class.extend({
        init: function () {
            this.facade = new SearchServiceFacade;
            this.data = [];
            this.ytData = [];
            this.ytRequired = this.ytLoaded = !1;
            this.scData = [];
            this.scRequired = this.scLoaded = !1;
            this.hash = {};
            this.start = "0";
            this.end = "";
            this.page = 0;
            this.pageCounts = [];
            this.updateCallback = void 0;
            this.scTracksLookup = this.scFavoritesLookup = this.relatedSearch = !1;
            this.lastFormats = this.lastQuery = void 0;
            $("#media-panel-pagination-left-button").click($.proxy(this.onPrevPage,
            this));
            $("#media-panel-pagination-right-button").click($.proxy(this.onNextPage, this))
        },
        reset: function () {
            this.hash = {};
            this.data.length = 0;
            this.ytData.length = 0;
            this.scData.length = 0;
            this.scTracksLookup = this.scFavoritesLookup = this.relatedSearch = this.scRequired = this.ytRequired = !1;
            this.lastFormats = this.lastQuery = void 0
        },
        load: function (a, b, c) {
            this.reset();
            this.lastQuery = a;
            this.lastFormats = b;
            this.initCounts(c);
            "1" == b ? (this.ytRequired = !0, this.facade.ytSearch(a, c, 30, $.proxy(this.onYTResult, this))) : "2" == b && (this.scRequired = !0, this.facade.scSearch(a, c, 30, $.proxy(this.onSCResult, this)))
        },
        loadYTRelated: function (a) {
            this.reset();
            this.lastFormats = "1";
            this.pageCounts = [];
            this.initCounts(0);
            this.ytRequired = !0;
            this.relatedSearch = a;
            this.facade.ytRelated(a.cid, $.proxy(this.onYTResult, this))
        },
        loadSCFavorites: function (a) {
            this.reset();
            this.lastFormats = "2";
            this.initCounts(a);
            this.scFavoritesLookup = this.scRequired = !0;
            this.facade.scFavorites(a, 30, $.proxy(this.onSCResult, this))
        },
        loadSCTracks: function (a) {
            this.reset();
            this.lastFormats =
                "2";
            this.initCounts(a);
            this.scTracksLookup = this.scRequired = !0;
            this.facade.scTracks(a, 30, $.proxy(this.onSCResult, this))
        },
        initCounts: function (a) {
            var b;
            this.page = a;
            0 == this.page && (this.pageCounts = []);
            if (0 < a && 0 == this.pageCounts.length) for (b = a; b--;) this.pageCounts.push(30);
            a > this.pageCounts.length - 1 ? this.pageCounts.push(0) : (this.pageCounts.length -= 1, this.pageCounts[this.pageCounts.length - 1] = 0);
            var a = 0,
                c = this.pageCounts.length;
            for (b = 0; b < c; ++b) a += this.pageCounts[b];
            this.start = "" + (a || 1);
            this.end = "";
            this.setPagination(!1)
        },
        updateCounts: function () {
            var a = this.pageCounts.length;
            this.pageCounts[a - 1] = this.data.length;
            for (var b = 0, c = 0; c < a; ++c) b += this.pageCounts[c];
            1 == a ? 0 == b ? (this.start = "0", this.end = "") : (this.start = "1", this.end = "" + b) : (this.start = "" + (b - this.pageCounts[a - 1]), this.end = "" + b);
            this.setPagination(!0)
        },
        setPagination: function (a) {
            a ? $("#media-panel-pagination-value").text(this.start + " - " + this.end) : $("#media-panel-pagination-value").text(this.start + " - ...");
            0 == this.page ? ($("#media-panel-pagination-left-button").css("opacity",
            0.2), $("#media-panel-pagination-left-button").css("cursor", "default")) : ($("#media-panel-pagination-left-button").css("opacity", 1), $("#media-panel-pagination-left-button").css("cursor", "pointer"));
            "" == this.end || this.relatedSearch ? ($("#media-panel-pagination-right-button").css("opacity", 0.2), $("#media-panel-pagination-right-button").css("cursor", "default")) : ($("#media-panel-pagination-right-button").css("opacity", 1), $("#media-panel-pagination-right-button").css("cursor", "pointer"))
        },
        onNextPage: function () {
            !this.relatedSearch &&
                "" != this.end && (!this.scFavoritesLookup && !this.scTracksLookup ? this.load(this.lastQuery, this.lastFormats, this.page + 1) : this.scFavoritesLookup ? this.loadSCFavorites(this.page + 1) : this.scTracksLookup && this.loadSCTracks(this.page + 1))
        },
        onPrevPage: function () {
            !this.relatedSearch && 0 < this.page && (!this.scFavoritesLookup && !this.scTracksLookup ? this.load(this.lastQuery, this.lastFormats, this.page - 1) : this.scFavoritesLookup ? this.loadSCFavorites(this.page - 1) : this.scTracksLookup && this.loadSCTracks(this.page - 1))
        },
        onYTResult: function (a) {
            this.relatedSearch && 0 == a.length ? this.load(this.relatedSearch.author + " " + this.relatedSearch.title, 0) : (this.ytData = a, this.ytLoaded = !0, this.eliminateDuplicates())
        },
        onSCResult: function (a) {
            this.scData = a;
            this.scLoaded = !0;
            this.eliminateDuplicates()
        },
        eliminateDuplicates: function () {
            if ((!this.ytRequired || this.ytLoaded) && (!this.scRequired || this.scLoaded)) this.ignoreDuplicatesAndLocal(this.ytData), this.ignoreDuplicatesAndLocal(this.scData), this.collate()
        },
        onCIDResult: function (a) {
            if (a) for (var b = a.length, c = 0; c < b; ++c) this.hash[a[c].cid] = !0, this.data.push(a[c]);
            this.collate()
        },
        ignoreDuplicatesAndLocal: function (a) {
            if (a) for (var b = a.length, c = 0; c < b; ++c) if (!this.hash[a[c].cid]) {
                var d = a[c].cid,
                    e = LS.media.lookup(d);
                e && (this.hash[d] = !0, this.data.push(e))
            }
        },
        collate: function () {
            this.appendUnknown(this.ytData);
            this.appendUnknown(this.scData);
            this.updateCounts();
            this.updateCallback && this.updateCallback(this.data)
        },
        appendUnknown: function (a) {
            if (a) for (var b = a.length, c = 0; c < b; ++c) this.hash[a[c].cid] || this.data.push(a[c])
        }
    }),
    RestrictedSearchModel = SearchModel.extend({
        initCounts: function () {},
        updateCounts: function () {},
        setPagination: function () {},
        appendUnknown: function (a) {
            if (a) for (var b = a.length, c = 0; c < b; ++c)!this.hash[a[c].cid] && a[c].cid != Playback.media.cid && this.data.push(a[c])
        }
    }),
    iTunesModel = Class.extend({
        load: function (a) {
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                if (a = a.target.files, 0 < a.length) {
                    var b = new FileReader,
                        c = $.proxy(this.parse, this);
                    b.onloadstart = function () {
                        Dialog.itunesReading()
                    };
                    b.onload = function (a) {
                        $("#dialog-import-itunes-progress-bar").width(268);
                        $("#dialog-import-itunes-progress-perc").text("100%");
                        setTimeout(function () {
                            c(a.target.result)
                        }, 1)
                    };
                    b.onprogress = function (a) {
                        a = a.loaded / a.total;
                        $("#dialog-import-itunes-progress-bar").width(268 * a);
                        $("#dialog-import-itunes-progress-perc").text(~~ (100 * a) + "%")
                    };
                    b.readAsText(a[0])
                }
            } else alert("This browser does not support the feature required to import from itunes.")
        },
        parse: function (a) {
            var b;
            window.DOMParser ? b = (new DOMParser).parseFromString(a, "text/xml") : (b = new ActiveXObject("Microsoft.XMLDOM"), b.async = !1, b.loadXML(a));
            Dialog.itunesImport(this.parsePlaylists(b))
        },
        parsePlaylists: function (a) {
            for (var b = this.parseLibrary(a.childNodes[1].childNodes[1].childNodes), a = a.childNodes[1].childNodes[1].getElementsByTagName("array")[0].childNodes, c = a.length, d = [], e = 0; e < c; ++e) if ("dict" === a[e].nodeName) {
                for (var f = a[e].childNodes.length, g = null, h = null, j = 0; j < f; ++j) if ("key" === a[e].childNodes[j].nodeName) if ("Name" === a[e].childNodes[j].firstChild.nodeValue) g = a[e].childNodes[j].nextSibling.firstChild.nodeValue;
                else {
                    if ("Master" === a[e].childNodes[j].firstChild.nodeValue || "Distinguished Kind" === a[e].childNodes[j].firstChild.nodeValue) {
                        h = g = null;
                        break
                    }
                } else "array" === a[e].childNodes[j].nodeName && (h = a[e].childNodes[j].getElementsByTagName("integer"));
                if (g && h) {
                    f = {
                        name: g,
                        items: []
                    };
                    g = h.length;
                    for (j = 0; j < g; ++j) f.items.push(b[h[j].firstChild.nodeValue]);
                    d.push(f)
                }
            }
            return d
        },
        parseLibrary: function (a) {
            var b, c, d = {}, e = a.length;
            for (b = 0; b < e; ++b) if ("dict" === a[b].nodeName) {
                c = a[b].getElementsByTagName("dict");
                break
            }
            e = c.length;
            for (b = 0; b < e; ++b) d[c[b].childNodes[2].firstChild.nodeValue] = {
                artist: c[b].childNodes[8].firstChild.nodeValue,
                name: c[b].childNodes[5].firstChild.nodeValue
            };
            return d
        }
    }),
    UserModel = Class.extend({
        init: function () {
            this.data = {};
            this.followers = {};
            this.following = {};
            this.updateCallback = null;
            this.COHOST = 4;
            this.MANAGER = 3;
            this.BOUNCER = 2;
            this.FEATUREDDJ = 1
        },
        setData: function (a) {
            this.data = a.profile;
            this.followers = {};
            for (var b = a.followers.length; b--;) this.followers[a.followers[b]] = !0;
            b = a.following.length;
            for (this.following = {}; b--;) this.following[a.following[b]] = !0;
            this.statuses = [{
                label: Lang.userStatus.available,
                value: 0
            }, {
                label: Lang.userStatus.away,
                value: 1
            }, {
                label: Lang.userStatus.working,
                value: 2
            }, {
                label: Lang.userStatus.sleeping,
                value: 3
            }];
            Room.setUserMeta(this.data.username, this.data.djPoints + this.data.listenerPoints + this.data.curatorPoints, this.data.fans);
            Room.setUserName(this.data.username);
            Room.setUserAvatar(this.data.avatarID);
            this.data.language || (this.data.language = "en")
        },
        addFollower: function (a) {
            this.followers[a] = !0;
            Models.room.updateRelationships()
        },
        addFollowing: function (a) {
            this.following[a] = !0;
            Models.room.updateRelationships()
        },
        removeFollowing: function (a) {
            delete this.following[a];
            Models.room.updateRelationships()
        },
        addFriend: function (a) {
            this.followers[a] = !0;
            this.following[a] = !0;
            Models.room.updateRelationships()
        },
        changeDisplayName: function (a) {
            this.data.username != a && 1 < a.length && (a = new UserChangeDisplayNameService(a), a.successCallback = $.proxy(this.onChangeDisplayNameSuccess, this), a.errorCallback = $.proxy(this.onChangeDisplayNameError, this))
        },
        changeLanguage: function (a) {
            this.data.language != a && ((new UserLanguageUpdateService(a)).successCallback = $.proxy(this.onLanguageUpdateSuccess,
            this))
        },
        changeAvatar: function (a) {
            a != this.data.avatarID && ((new UserChangeAvatarService(a)).successCallback = $.proxy(this.onChangeAvatarSuccess, this))
        },
        changeStatus: function (a) {
            a != this.data.status && new UserStatusUpdateService(a)
        },
        onLanguageUpdateSuccess: function (a) {
            this.data.language = a;
            log(Lang.dialog.language + ": " + Models.chat.languageMap[a])
        },
        getPermission: function () {
            var a = 0;
            if (Models.room.admins[this.data.id]) a = 10;
            else if (Models.room.ambassadors[this.data.id]) a = 9;
            else for (var b in Models.room.data.staff) if (this.data.id == b) {
                a = Models.room.data.staff[b];
                break
            }
            return a
        },
        hasPermission: function (a) {
            return this.getPermission() >= a
        },
        getUILanguage: function () {
            return Models.chat.uiLanguageMap[this.data.language] ? this.data.language : "en"
        },
        onChangeDisplayNameSuccess: function (a) {
            this.data.username = a;
            Room.setUserMeta(this.data.username, this.data.djPoints + this.data.listenerPoints + this.data.curatorPoints, this.data.fans);
            Room.setUserName(this.data.username);
            if (Models.room.data && Models.room.userIsPlaying == this.data.id && Models.room.data.media) Room.onMediaUpdate({
                djName: this.data.username,
                media: Models.room.data.media
            })
        },
        onChangeDisplayNameError: function (a) {
            5 == a && Dialog.alert(Lang.alerts.userNameError + a);
            Dialog.alert(Lang.alerts.userNameError + Lang.dialog.displayNameNotAvailable)
        },
        onChangeAvatarSuccess: function (a) {
            this.data.avatarID = a;
            Room.setUserAvatar(a)
        }
    }),
    RoomModel = EventDispatcher.extend({
        init: function () {
            this._super();
            this.clear()
        },
        clear: function () {
            this.data = {};
            this.djHash = {};
            this.userHash = {};
            this.nirUserHash = {};
            this.admins = {};
            this.ambassadors = {};
            this.joined = this.userIsPlaying = this.userInBooth = !1;
            this.joinTime = null;
            this.roomScore = {
                positive: 0,
                negative: 0,
                curates: 0,
                score: 0.5
            };
            this.usernameLookup = {}
        },
        setData: function (a) {
            this.clear();
            this.joined = !0;
            this.joinTime = Date.now();
            this.data = a;
            this.data.mediaStartTime = Utils.convertUnixDateStringToNumberString(this.data.mediaStartTime);
            this.buildDJHash();
            for (var a = this.data.users.length, b = !1; a--;) this.data.users[a].owner = this.data.users[a].id == this.data.owner, this.data.users[a].permission = this.data.staff[this.data.users[a].id] ? this.data.staff[this.data.users[a].id] : 0, this.userHash[this.data.users[a].id] = this.data.users[a], this.addUsernameLookup(this.data.users[a]), this.data.users[a].id == Models.user.data.id && (b = !0);
            b || (Models.user.data.owner = Models.user.data.id == this.data.owner, Models.user.data.permission = this.data.staff[Models.user.data.id] ? this.data.staff[Models.user.data.id] : 0, this.data.users.push(Models.user.data), this.addUsernameLookup(Models.user.data), this.userHash[Models.user.data.id] = Models.user.data);
            this.updateProps();
            this.updateChatRateLimit();
            this.checkStaffAvatars();
            RoomUser.setAudience(this.getAudience());
            RoomUser.setDJs(this.getDJs());
            this.checkStaffAvatars();
            this.dispatchEvent("voteUpdate", {
                noRefresh: !0,
                boothRefresh: !0
            });
            this.playMedia()
        },
        updateChatRateLimit: function () {
            var a = this.data.users.length;
            Models.chat.rateLimit = Models.user.hasPermission(Models.user.FEATUREDDJ) ? 0 : 999 < a ? 60 : 499 < a ? 45 : 199 < a ? 30 : 149 < a ? 20 : 99 < a ? 10 : 0
        },
        setState: function (a) {
            var b = !0;
            if (this.data.media && !a.media) b = !1;
            else if (!this.data.media && a.media) b = !1;
            else if (this.data.media && a.media && (this.data.media.cid != a.media.cid || this.data.historyID != a.historyID)) b = !1;
            this.updateState(a);
            b || this.playMedia()
        },
        addAudience: function () {},
        updateState: function (a) {
            var b, c;
            for (c in a) "users" != c && "mediaStartTime" != c && "djs" != c && (this.data[c] = a[c]);
            this.data.mediaStartTime = Utils.convertUnixDateStringToNumberString(a.mediaStartTime);
            b = a.users.length;
            for (var d = {}; b--;) d[a.users[b].id] = a.users[b], this.userJoin(a.users[b]);
            for (c in this.userHash) if (d[c]) for (var e in d[c]) this.userHash[c][e] = d[c][e];
            else this.userLeave(c);
            this.data.staff = a.staff;
            this.djUpdate(a.djs);
            this.updateProps();
            this.dispatchEvent("voteUpdate", {
                noRefresh: !0,
                boothRefresh: !1
            });
            UserListOverlay.updateUsers();
            5 > this.data.djs.length && UserListOverlay.hide()
        },
        setBoothState: function (a) {
            var b, c;
            this.data.votes = {};
            this.data.curates = {};
            try {
                for (b = this.data.users.length; b--;) this.data.users[b] && (this.data.users[b].vote = 0, this.data.users[b].curated = !1, this.userHash[this.data.users[b].id] && (this.userHash[this.data.users[b].id].vote = 0))
            } catch (d) {
                console.error("ClearVotes", d)
            }
            b = !0;
            if (this.data.media && !a.media) b = !1;
            else if (!this.data.media && a.media) b = !1;
            else if (this.data.media && a.media && (this.data.media.cid != a.media.cid || this.data.historyID != a.historyID)) b = !1;
            for (c in a) "users" != c && "mediaStartTime" != c && "djs" != c && (this.data[c] = a[c]);
            if (this.data.votes) for (c in this.data.votes) this.userHash[c] && (this.userHash[c].vote = this.data.votes[c]);
            if (this.data.curates) for (c in this.data.curates) this.userHash[c] && (this.userHash[c].curated = this.data.curates[c]);
            this.data.mediaStartTime = Utils.convertUnixDateStringToNumberString(a.mediaStartTime);
            this.djUpdate(a.djs);
            Models.history.currentID = this.data.historyID;
            this.checkCurrentDJ();
            this.updateRoomScore();
            Room.setRoomMeta(this.data.name);
            Room.updateDJButton();
            this.dispatchEvent("voteUpdate", {
                noRefresh: !1,
                boothRefresh: !1
            });
            UserListOverlay.updateWaitList();
            5 > this.data.djs.length && UserListOverlay.hide();
            b || this.playMedia();
            this.updateEarnedPoints()
        },
        updateProps: function () {
            var a;
            if (this.data.votes) for (a in this.data.votes) this.userHash[a] && (this.userHash[a].vote = this.data.votes[a]);
            if (this.data.curates) for (a in this.data.curates) this.userHash[a] && (this.userHash[a].curated = this.data.curates[a]);
            for (i = this.data.admins.length; i--;) this.admins[this.data.admins[i]] = !0;
            for (i = this.data.ambassadors.length; i--;) this.ambassadors[this.data.ambassadors[i]] = !0;
            Models.history.currentID = this.data.historyID;
            this.updatePermissions();
            this.checkCurrentDJ();
            this.updateRelationships();
            this.updateRoomScore();
            this.updateChatRateLimit();
            this.updateEarnedPoints();
            this.checkStaffAvatars();
            Room.setRoomMeta(this.data.name);
            Room.updateDJButton()
        },
        updateRelationships: function () {
            for (var a in this.userHash) {
                var b = this.userHash[a].relationship;
                this.userHash[a].relationship = Models.user.following[a] && Models.user.followers[a] ? 3 : Models.user.following[a] ? 2 : Models.user.followers[a] ? 1 : 0;
                if (!this.djHash[a] && (3 == this.userHash[a].relationship && 3 != b || 0 == b && 0 < this.userHash[a].relationship || 0 < b && 0 == this.userHash[a].relationship)) RoomUser.userLeave(a), RoomUser.userJoin(this.userHash[a])
            }
            this.updatePriorities()
        },
        updatePriorities: function () {
            var a, b, c = [],
                d = [],
                e = [],
                f = [],
                g;
            for (g in this.userHash) g == Models.user.data.id ? b = this.userHash[g] : g == this.data.owner && !this.data.admins[g] ? a = this.userHash[g] : this.admins[g] ? d.push(this.userHash[g]) : this.ambassadors[g] ? e.push(this.userHash[g]) : this.data.staff[g] ? f.push(this.userHash[g]) : c.push(this.userHash[g]);
            d.sort(this.sortAudienceRelationship);
            e.sort(this.sortAudienceRelationship);
            f.sort(this.sortAudienceRelationship);
            c.sort(this.sortAudienceRelationship);
            a && d.push(a);
            a = d.concat(e).concat(f).concat(c);
            a.unshift(b);
            b = a.length;
            for (g = 0; g < b; ++g) this.userHash[a[g].id].priority = g
        },
        updatePermissions: function () {
            for (var a in this.userHash) this.userHash[a].owner = this.data.owner == a ? !0 : !1, this.userHash[a].ambassador = this.ambassadors[a] ? !0 : !1, this.userHash[a].admin = this.admins[a] ? !0 : !1
        },
        editStaff: function (a, b) {
            0 == b ? delete this.data.staff[a] : this.data.staff[a] = b;
            this.userHash[a] && (this.userHash[a].permission = b);
            for (var c = this.data.users.length; c--;) if (this.data.users[c].id == a) {
                this.data.users[c].permission = b;
                5 == b && (this.data.owner = a, this.userHash[a] && (this.userHash[a].owner = !0), this.data.users[c].owner = !0);
                break
            }
            this.checkStaffAvatars()
        },
        checkStaffAvatars: function () {},
        getAudience: function (a) {
            var b = [],
                c = null,
                d = [],
                e;
            for (e in this.userHash) this.userHash[e].id == Models.user.data.id ? c = this.userHash[e] : this.djHash[this.userHash[e].id] || (this.admins[e] || this.ambassadors[e] || this.data.staff[e] ? d.push(this.userHash[e]) : b.push(this.userHash[e]));
            a ? b.sort(this.sortAudienceAlpha) : b.sort(this.sortAudienceRelationship);
            b = d.concat(b);
            c && !this.djHash[c.id] && b.unshift(c);
            return b
        },
        sortAudienceRelationship: function (a, b) {
            if (a.relationship > b.relationship) return 1;
            if (a.relationship < b.relationship) return -1;
            var c = a.listenerPoints + a.djPoints + a.curatorPoints,
                d = b.listenerPoints + b.djPoints + b.curatorPoints;
            return c > d ? 1 : c < d ? -1 : 0
        },
        sortAudienceAlpha: function (a, b) {
            return a.username.toLowerCase() > b.username.toLowerCase() ? 1 : a.username.toLowerCase() < b.username.toLowerCase() ? -1 : 0
        },
        sortStaff: function (a,
        b) {
            return a.permission < b.permission ? 1 : a.permission > b.permission ? -1 : a.username.toLowerCase() > b.username.toLowerCase() ? 1 : a.username.toLowerCase() < b.username.toLowerCase() ? -1 : 0
        },
        getDJs: function () {
            var a = [];
            if (this.data.djs) for (var b = this.data.djs.length, c = 0; c < b; ++c) this.userHash[this.data.djs[c].user.id] || this.userJoin(this.data.djs[c].user), a.push(this.userHash[this.data.djs[c].user.id]);
            return a
        },
        getUsers: function () {
            var a = this.getDJs().concat(this.getAudience(!0));
            a.sort(this.sortAudienceAlpha);
            return a
        },
        getRoomUsersSorted: function () {
            var a, b = [],
                c = [],
                d = [],
                e = [],
                f;
            for (f in this.userHash) f == this.data.owner && !this.data.admins[f] ? a = this.userHash[f] : this.admins[f] ? c.push(this.userHash[f]) : this.ambassadors[f] ? d.push(this.userHash[f]) : this.data.staff[f] && 5 > this.data.staff[f] ? e.push(this.userHash[f]) : b.push(this.userHash[f]);
            c.sort(this.sortAudienceAlpha);
            d.sort(this.sortAudienceAlpha);
            e.sort(this.sortStaff);
            b.sort(this.sortAudienceAlpha);
            a && c.push(a);
            return c.concat(d).concat(e).concat(b)
        },
        getStaff: function () {
            var a = [],
                b;
            for (b in this.data.staff) this.userHash[b] && a.push(this.userHash[b]);
            a.sort(this.sortStaff);
            return a
        },
        getAmbassadors: function () {
            for (var a = [], b = this.data.ambassadors.length, c = 0; c < b; ++c) this.userHash[this.data.ambassadors[c]] && a.push(this.userHash[this.data.ambassadors[c]]);
            return a
        },
        getSuperUsers: function () {
            for (var a = [], b = this.data.admins.length, c = 0; c < b; ++c) this.userHash[this.data.admins[c]] && a.push(this.userHash[this.data.admins[c]]);
            return a
        },
        getHost: function () {
            return this.userHash[this.data.owner] ? this.userHash[this.data.owner] : null
        },
        getUserByID: function (a) {
            return this.userHash[a]
        },
        getWaitList: function () {
            var a = [];
            if (this.data.waitList) for (var b = this.data.waitList.length, c = 0; c < b; ++c) this.userHash[this.data.waitList[c].id] || this.userJoin(this.data.waitList[c]), a.push(this.userHash[this.data.waitList[c].id]);
            return a
        },
        getWaitListPosition: function (a) {
            a || (a = Models.user.data.id);
            for (var b = this.data.waitList.length; b--;) if (this.data.waitList[b].id == a) return b + 1;
            return null
        },
        getDJPlays: function (a) {
            return !this.data.boothLocked && 0 < this.data.maxPlays && 0 < this.data.waitList.length && this.djHash[a] ? Math.max(1, this.data.maxPlays - this.djHash[a].plays) : null
        },
        buildDJHash: function () {
            this.djHash = {};
            for (var a = this.data.djs.length; a--;) this.djHash[this.data.djs[a].user.id] = this.data.djs[a]
        },
        checkCurrentDJ: function () {
            this.data.djs && (this.userInBooth = this.djHash.hasOwnProperty(Models.user.data.id), this.userIsPlaying = 0 < this.data.djs.length ? this.userInBooth && this.data.currentDJ == Models.user.data.id : !1, MediaOverlay.updateUserPlaying(), Room.updateUserPlaying())
        },
        getUsername: function (a) {
            return this.userHash[a] ? this.userHash[a].username : null
        },
        userJoin: function (a) {
            this.data.users && !this.userHash[a.id] && (a.owner = a.id == this.data.owner, a.permission = this.data.staff[a.id] ? this.data.staff[a.id] : 0, this.admins[a.id] ? a.admin = !0 : this.ambassadors[a.id] && (a.ambassador = !0), this.data.users.push(a), this.userHash[a.id] = a, this.updateRelationships(), RoomUser.userJoin(a), this.checkStaffAvatars(), this.checkCurrentDJ(), this.updateRoomScore(), this.updateChatRateLimit(), UserListOverlay.updateUsers(),
            this.addUsernameLookup(a));
            this.nirUserHash[a.id] && delete this.nirUserHash[a.id]
        },
        userLeave: function (a) {
            if (this.userHash[a]) {
                this.removeUsernameLookup(this.userHash[a].username);
                delete this.userHash[a];
                1 == this.data.votes[a] && this.earnedPoints[this.data.currentDJ] && --this.earnedPoints[this.data.currentDJ].dj;
                delete this.data.votes[a];
                try {
                    for (var b = this.data.users.length; b--;) if (this.data.users[b].id == a) {
                        this.data.users.splice(b, 1);
                        RoomUser.userLeave(a);
                        break
                    }
                } catch (c) {
                    console.error(c)
                }
                this.checkCurrentDJ();
                this.updateRoomScore();
                this.updateChatRateLimit();
                this.updateEarnedUserMeta();
                UserListOverlay.updateUsers()
            }
        },
        userUpdate: function (a) {
            if (this.data.users) {
                var b = this.userHash[a.id];
                if (b) {
                    b.fans = a.fans;
                    b.facebook = a.facebook;
                    b.twitter = a.twitter;
                    b.djPoints = a.djPoints;
                    b.listenerPoints = a.listenerPoints;
                    b.curatorPoints = a.curatorPoints;
                    b.username != a.username && (this.removeUsernameLookup(b.username), this.addUsernameLookup(a), Models.chat.receive({
                        type: "update",
                        from: b.username,
                        message: Lang.messages.changeName.split("%NAME%").join($("<span/>").text(a.username).html()),
                        language: Models.user.data.language
                    }));
                    b.username = a.username;
                    if (b.status != a.status && (b.id == Models.user.data.id || 1 < b.relationship)) {
                        var c = " &lt;";
                        0 == a.status ? c += Lang.userStatus.available : 1 == a.status ? c += Lang.userStatus.away : 2 == a.status ? c += Lang.userStatus.working : 3 == a.status ? c += Lang.userStatus.sleeping : -1 == a.status && (c += Lang.userStatus.idle);
                        Models.chat.receive({
                            type: "update",
                            from: b.username,
                            message: c + "&gt;",
                            language: Models.user.data.language
                        })
                    }
                    b.status = a.status;
                    this.checkCurrentDJ();
                    b.id == this.data.currentDJ && this.dispatchEvent("mediaUpdate", {
                        djName: b.username,
                        media: this.data.media
                    });
                    b.avatarID != a.avatarID && (b.oldAvatarID ? b.oldAvatarID = a.avatarID : b.avatarID = a.avatarID, RoomUser.userUpdate(b));
                    b.id == Models.user.data.id && (Models.user.data.username = b.username, Models.user.data.fans = b.fans, Models.user.data.djPoints = b.djPoints, Models.user.data.listenerPoints = b.listenerPoints, Models.user.data.curatorPoints = b.curatorPoints, Models.user.data.facebook = b.facebook, Models.user.data.twitter = b.twitter, Models.user.data.status = b.status, this.updateEarnedUserMeta(), Room.setUserName(b.username));
                    UserListOverlay.updateUsers();
                    this.checkStaffAvatars()
                }
            }
        },
        userCounterUpdate: function (a) {
            if (this.data.users) {
                var b = this.userHash[a.id];
                b && (b.fans = a.fans, b.id == Models.user.data.id && (Models.user.data.fans = b.fans, this.updateEarnedUserMeta()))
            }
        },
        updateEarnedUserMeta: function () {
            var a = this.userHash[Models.user.data.id],
                b = a.djPoints + a.listenerPoints + a.curatorPoints,
                b = a.id != this.data.currentDJ ? b + this.earnedPoints[a.id] : b + (this.earnedPoints[a.id].dj + this.earnedPoints[a.id].c);
            Room.setUserMeta(a.username, b, a.fans)
        },
        voteUpdate: function (a) {
            this.userHash[a.id] ? (this.userHash[a.id].vote = a.vote, this.data.votes[a.id] = a.vote, this.earnedPoints[a.id] = 1, this.earnedPoints[this.data.currentDJ] && this.earnedPoints[this.data.currentDJ].v && (1 == a.vote && 1 != this.earnedPoints[this.data.currentDJ].v[a.id] ? (++this.earnedPoints[this.data.currentDJ].dj, this.earnedPoints[this.data.currentDJ].v[a.id] = 1) : -1 == a.vote && 1 == this.earnedPoints[this.data.currentDJ].v[a.id] && (--this.earnedPoints[this.data.currentDJ].dj,
            this.earnedPoints[this.data.currentDJ].v[a.id] = -1)), a.id != Models.user.data.id && this.dispatchEvent("voteUpdate", {
                noRefresh: !1,
                boothRefresh: this.djHash[a.id]
            }), this.updateRoomScore(), this.updateEarnedUserMeta()) : console.log("VoteUpdateError :: user " + a.id + " does not exist in room")
        },
        curateUpdate: function (a) {
            this.userHash[a.id] ? (this.userHash[a.id].curated = a.curated, this.data.curates[a.id] = a.curated, this.earnedPoints[this.data.currentDJ] && ++this.earnedPoints[this.data.currentDJ].c, this.updateRoomScore(),
            this.updateEarnedUserMeta()) : console.log("CurateUpdateError :: user " + a.id + " does not exist in room")
        },
        roomPropsUpdate: function (a) {
            this.data.boothLocked != a.boothLocked && (Models.chat.receive({
                type: "moderation",
                from: a.moderator,
                message: a.boothLocked ? Lang.messages.boothLocked : Lang.messages.boothUnlocked,
                language: Models.user.data.language
            }), this.data.boothLocked = a.boothLocked);
            this.data.maxPlays != a.maxPlays && (Models.chat.receive({
                type: "moderation",
                from: a.moderator,
                message: Lang.messages.maxPlays.split("%COUNT%").join("" + a.maxPlays),
                language: Models.user.data.language
            }), this.data.maxPlays = a.maxPlays);
            this.data.maxDJs != a.maxDJs && (Models.chat.receive({
                type: "moderation",
                from: a.moderator,
                message: Lang.messages.maxDJs.split("%COUNT%").join("" + a.maxDJs),
                language: Models.user.data.language
            }), this.data.maxDJs = a.maxDJs);
            this.data.waitListEnabled != a.waitListEnabled && (Models.chat.receive({
                type: "moderation",
                from: a.moderator,
                message: a.waitListEnabled ? Lang.messages.waitListEnabled : Lang.messages.waitListDisabled,
                language: Models.user.data.language
            }),
            this.data.waitListEnabled = a.waitListEnabled);
            this.data.waitListMode != a.waitListMode && (this.data.waitListMode = a.waitListMode);
            Room.updateDJButton();
            Dialog.isRoomInfo && Dialog.roomInfo()
        },
        roomMetaUpdate: function (a) {
            this.data.description = a.description;
            this.data.name = a.name;
            Room.setRoomMeta(this.data.name);
            Dialog.isRoomInfo && Dialog.roomInfo()
        },
        djAdvance: function (a) {
            var b;
            this.data.media && (b = {
                dj: this.userHash[this.data.currentDJ],
                media: Utils.clone(this.data.media),
                score: Utils.clone(this.roomScore)
            }, this.applyEarnedPoints(a.earn));
            this.data.votes = {};
            this.data.curates = {};
            try {
                for (var c = this.data.users.length; c--;) this.data.users[c] && (this.data.users[c].vote = 0, this.data.users[c].curated = !1)
            } catch (d) {
                console.error("ClearVotes", d)
            }
            this.data.media = a.media;
            try {
                this.data.mediaStartTime = Utils.convertUnixDateStringToNumberString(a.mediaStartTime)
            } catch (e) {
                console.error("MediaStartTime", e)
            }
            this.data.currentDJ = a.currentDJ;
            this.data.playlistID = a.playlistID;
            this.data.historyID = a.historyID;
            try {
                Models.history.djAdvance(a.historyID)
            } catch (f) {
                console.error("History.djAdvance",
                f)
            }
            this.roomScore = {
                positive: 0,
                negative: 0,
                curates: 0,
                score: 0.5
            };
            try {
                this.dispatchEvent("scoreUpdate", this.roomScore)
            } catch (g) {
                console.error("Room.scoreUpdate", g)
            }
            try {
                this.checkCurrentDJ()
            } catch (h) {
                console.error("CheckCurrentDJ", h)
            }
            try {
                this.playMedia()
            } catch (j) {
                console.error("PlayMedia", j)
            }
            try {
                this.dispatchEvent("voteUpdate", {
                    noRefresh: !1,
                    boothRefresh: !1
                })
            } catch (k) {
                console.error("VoteUpdate", k)
            }
            try {
                Room.updateDJButton()
            } catch (l) {
                console.error("UpdateDJButton", l)
            }
            try {
                this.data.media && this.data.currentDJ ? API.delayDispatch(API.DJ_ADVANCE, {
                    dj: this.userHash[this.data.currentDJ],
                    media: this.data.media,
                    lastPlay: b
                }) : API.delayDispatch(API.DJ_ADVANCE, {
                    lastPlay: b
                })
            } catch (m) {
                console.error("API", m)
            }
            this.updateEarnedPoints()
        },
        djUpdate: function (a) {
            for (var b = !1, c = {}, d = a.length; d--;) c[a[d].user.id] = !0;
            for (var d = this.data.djs.length, e = Array(d); d--;)!c[this.data.djs[d].user.id] && this.userHash[this.data.djs[d].user.id] && (b = !0, RoomUser.userJoin(this.userHash[this.data.djs[d].user.id])), e[d] = this.data.djs[d].user.id;
            this.data.djs = a;
            if (e.length == this.data.djs.length) for (d = this.data.djs.length; d--;) {
                if (e[d] != this.data.djs[d].user.id) {
                    b = !0;
                    break
                }
            } else b = !0;
            this.buildDJHash();
            b && (this.checkCurrentDJ(), this.checkStaffAvatars(), RoomUser.setDJs(this.getDJs()), RoomUser.audience.refresh(), 5 > this.data.djs.length ? UserListOverlay.hide() : UserListOverlay.updateWaitList(), API.delayDispatch(API.DJ_UPDATE, this.getDJs()))
        },
        updateRoomScore: function () {
            if (this.data.media) {
                var a, b = 0,
                    c = 0,
                    d = 0;
                for (a in this.data.votes) 1 == this.data.votes[a] ? ++b : -1 == this.data.votes[a] && ++c;
                for (a in this.data.curates)++d;
                a = this.data.users.length - 1;
                var e = 0;
                0 < a && (e = (b - c) / (2 * a));
                this.roomScore = {
                    positive: b,
                    negative: c,
                    curates: d,
                    score: 0.5 + e
                };
                this.dispatchEvent("scoreUpdate", this.roomScore);
                Models.history.roomScore(this.roomScore.score)
            } else this.roomScore = {
                positive: 0,
                negative: 0,
                curates: 0,
                score: 0.5
            }, this.dispatchEvent("scoreUpdate", this.roomScore);
            API.delayDispatch(API.ROOM_SCORE_UPDATE, this.roomScore)
        },
        updateEarnedPoints: function () {
            try {
                var a;
                this.earnedPoints = {};
                if (this.data.currentDJ) {
                    this.earnedPoints[this.data.currentDJ] = {
                        dj: 0,
                        c: 0,
                        v: {}
                    };
                    for (a in this.data.curated) this.earnedPoints[this.data.currentDJ].c += 1;
                    for (a in this.userHash) - 1 == this.userHash[a].vote ? this.earnedPoints[a] = 1 : 1 == this.userHash[a].vote ? (this.earnedPoints[a] = 1, this.earnedPoints[this.data.currentDJ].dj += 1, this.earnedPoints[this.data.currentDJ].v[a] = 1) : -1 == this.userHash[a].vote ? this.earnedPoints[this.data.currentDJ].v[a] = -1 : a != this.data.currentDJ && (this.earnedPoints[a] = 0)
                } else for (a in this.userHash) this.earnedPoints[a] = 0
            } catch (b) {
                for (a in this.userHash) this.earnedPoints[a] = 0
            }
            this.updateEarnedUserMeta()
        },
        applyEarnedPoints: function (a) {
            try {
                if (a) for (var b in this.earnedPoints) {
                    if (this.userHash[b] && (b == this.data.currentDJ ? (this.userHash[this.data.currentDJ].djPoints += this.earnedPoints[this.data.currentDJ].dj || 0, this.userHash[this.data.currentDJ].curatorPoints += this.earnedPoints[this.data.currentDJ].c || 0) : 1 == this.earnedPoints[b] && ++this.userHash[b].listenerPoints, b == Models.user.data.id)) Models.user.data.djPoints = this.userHash[b].djPoints,
                    Models.user.data.listenerPoints = this.userHash[b].listenerPoints, Models.user.data.curatorPoints = this.userHash[b].curatorPoints
                } else if (this.userHash[this.data.currentDJ] && (this.userHash[this.data.currentDJ].curatorPoints += this.earnedPoints[this.data.currentDJ].c || 0), Models.user.data.id == this.data.currentDJ) Models.user.data.curatorPoints = this.userHash[Models.user.data.id].curatorPoints;
                Room.setUserMeta(Models.user.data.username, Models.user.data.djPoints + Models.user.data.listenerPoints + Models.user.data.curatorPoints,
                Models.user.data.fans)
            } catch (c) {
                console.log("applyEarnedPoints error"), console.log(c)
            }
        },
        waitListUpdate: function (a) {
            this.data.waitList = a;
            Room.updateDJButton();
            UserListOverlay.updateWaitList();
            API.delayDispatch(API.WAIT_LIST_UPDATE, this.getWaitList())
        },
        playMedia: function () {
            this.data.media && this.data.currentDJ ? (Playback.play(this.data.media, this.data.mediaStartTime), this.dispatchEvent("mediaUpdate", {
                djName: this.getUsername(this.data.currentDJ),
                media: this.data.media
            })) : (Playback.play(), this.dispatchEvent("mediaUpdate", {}))
        },
        addUsernameLookup: function (a) {
            this.removeUsernameLookup(a.username);
            var b = a.username.charAt(0).toLowerCase();
            this.usernameLookup[b] || (this.usernameLookup[b] = [], this.usernameLookup[b].longest = 0);
            this.usernameLookup[b].push({
                avatarID: a.avatarID,
                username: a.username
            });
            a.username.length > this.usernameLookup[b].longest && (this.usernameLookup[b].longest = a.username.length)
        },
        removeUsernameLookup: function (a) {
            var b = a.charAt(0).toLowerCase();
            if (this.usernameLookup[b]) {
                for (var c = this.usernameLookup[b].length; c--;) this.usernameLookup[b][c].username == a && (this.usernameLookup[b].splice(c, 1), 0 == this.usernameLookup[b].length && delete this.usernameLookup[b]);
                if (this.usernameLookup[b]) {
                    this.usernameLookup[b].longest = 0;
                    for (c = this.usernameLookup[b].length; c--;) this.usernameLookup[b][c].username.length > this.usernameLookup[b].longest && (this.usernameLookup[b].longest = this.usernameLookup[b][c].username.length)
                }
            }
        },
        mentionLookup: function (a) {
            var b = [],
                c = a.length;
            if (0 < c && 24 > c) {
                var d = a.charAt(0).toLowerCase();
                if (this.usernameLookup[d] && 0 < this.usernameLookup[d].length && c < this.usernameLookup[d].longest) for (c = this.usernameLookup[d].length; c--;) this.usernameLookup[d][c].username.toLowerCase() != a.toLowerCase() && 0 == this.usernameLookup[d][c].username.toLowerCase().indexOf(a.toLowerCase()) && b.push(this.usernameLookup[d][c])
            }
            b.length = Math.min(b.length, 10);
            b.sort(this.sortAudienceAlpha);
            return b
        }
    }),
    LobbyOverlayView = Class.extend({
        init: function () {
            $("#create-room-button").click($.proxy(this.onCreateRoomClick, this));
            this.lobbyPanelList = $("#lobby-panel-list");
            this.lobbyPanelList.scroll($.proxy(this.onScroll,
            this));
            this.searchInput = $("#lobby-search").find(".search-input input")[0];
            this.data = [];
            this.lastQuery = "";
            this.roomList = this.lastCursor = null;
            this.endOfList = this.pendingLoad = !1;
            this.timestamp = (new Date).getTime()
        },
        ready: function () {
            Modernizr.history && $(window).bind("popstate", function () {
                var a = "" + window.location,
                    a = a.split("/");
                a.pop();
                (a = a.pop()) && Models.room.data.id && a != Models.room.data.id && new RoomJoinService(a)
            })
        },
        show: function () {
            UserListOverlay.hide();
            $("#avatar-overlay").hide();
            $("#media-overlay").hide();
            $("#lobby-overlay").show();
            $("#overlay-container").show();
            this.lobbyPanelList.scrollTop(0);
            (0 == this.data.length || 15 < ~~ (((new Date).getTime() - this.timestamp) / 1E3)) && this.load("", null)
        },
        onKeyUp: function (a, b) {
            var c;
            if (window.event) c = window.event.keyCode;
            else if (b) c = b.which;
            else return !0;
            return 13 == c && ("" != this.searchInput.value || "" != this.lastQuery) ? (b.preventDefault(), this.onSubmitSearch(b), !1) : !0
        },
        onSubmitSearch: function () {
            if (("" != this.searchInput.value || "" != this.lastQuery) && this.searchInput.value != this.lastQuery) this.load(this.searchInput.value, null), _gaq.push(["_trackEvent", "Lobby Overlay", "Search", this.searchInput.value])
        },
        load: function (a, b) {
            if (!this.pendingLoad) {
                if (a != this.lastQuery || !b) this.lobbyPanelList.html(""), this.roomList = null, this.endOfList = !1, this.data = [], this.spin(!0);
                this.timestamp = (new Date).getTime();
                this.pendingLoad = !0;
                this.lastQuery = a;
                this.lastCursor = b;
                var c = new RoomSelectService(a, b);
                c.successCallback = $.proxy(this.onRoomSelectResponse, this);
                c.errorCallback = $.proxy(this.onRoomSelectError,
                this)
            }
        },
        spin: function (a) {
            a ? this.lobbyPanelList.spin({
                lines: 12,
                length: 0,
                width: 6,
                radius: 20,
                color: "#000"
            }) : this.lobbyPanelList.spin(!1)
        },
        onRoomSelectResponse: function (a) {
            this.spin(!1);
            this.pendingLoad = !1;
            var b = this.data.length;
            this.lastCursor = a.cursor;
            if (0 == a.results.length) this.endOfList = !0;
            else if ((this.data = this.data.concat(a.results)) && 0 < this.data.length) {
                this.roomList || (this.roomList = $("<ul/>").addClass("room-list"));
                for (var a = this.data.length, c = b; c < a; ++c) {
                    var d = this.data[c],
                        e = $("<div/>").addClass("room-population").append($("<span/>").addClass("room-population-value").text(d.userCount)).append($("<span/>").addClass("room-population-label").html(Lang.lobby.population)),
                        f = $("<div/>").addClass("meta").append($("<span/>").addClass("room-name").text(d.name)).append($("<span/>").addClass("room-hosted-by").text(Lang.lobby.hostedBy)).append($("<span/>").addClass("room-host-name").text(d.host));
                    d.media && f.append($("<span/>").addClass("room-now-playing").text(Lang.lobby.nowPlaying)).append($("<span/>").addClass("room-media").text(d.media));
                    var g = $("<div/>").addClass("room-djs");
                    if (5 > d.djCount) {
                        var h;
                        h = 4 == d.djCount ? Lang.lobby.slotAvailable : Lang.lobby.slotsAvailable.split("%COUNT%").join("" + (5 - d.djCount));
                        g.append($("<span/>").addClass("room-djs-label").text(h))
                    } else g.append($("<span/>").addClass("room-djs-label").text(Lang.lobby.noSlots));
                    f.append(g);
                    d.friends && 0 < d.friends.length && d.userCount && (g = 1 == d.friends.length ? Lang.lobby.friendInHere : Lang.lobby.friendsInHere.split("%COUNT%").join("" + d.friends.length), f.append($("<div/>").addClass("room-friends").append($("<span/>").addClass("room-friends-label").text(g)).attr("title", d.friends.toString())));
                    d = $("<li/>").addClass("room-list-item").data("index",
                    c).data("room", d).mouseenter($.proxy(this.onRoomOver, this)).mouseleave($.proxy(this.onRoomOut, this)).click($.proxy(this.onRoomClick, this)).append(e).append(f);
                    1 == c % 2 ? d.addClass("alternate-cell") : d.removeClass("alternate-cell");
                    this.roomList.append(d)
                }
                0 == b && this.lobbyPanelList.append(this.roomList);
                this.posLobbyLabels()
            } else Dialog.alert(Lang.alerts.roomNotFound)
        },
        posLobbyLabels: function () {
            $.browser.mozilla && ($(".room-media").css("left", 81), $(".room-djs").css("bottom", 1), $(".room-djs-label").css("top",
            1), $(".room-friends").css("bottom", 1), $(".room-friends-label").css("top", 1));
            Main.isMac && ($.browser.mozilla ? ($(".room-djs-label").css("top", 2), $(".room-friends-label").css("top", 2)) : $(".room-population-value").css("top", 11))
        },
        onScroll: function () {
            !this.endOfList && this.lobbyPanelList.scrollTop() > this.lobbyPanelList[0].scrollHeight - this.lobbyPanelList.height() - 100 && this.load(this.lastQuery, this.lastCursor)
        },
        onRoomSelectError: function () {
            this.pendingLoad = !1
        },
        onRoomOver: function () {},
        onRoomOut: function () {},
        onRoomClick: function (a) {
            a = $(a.currentTarget).data("room");
            MediaOverlay.onOverlayCloseClick(null);
            a && a.id != Models.room.data.id && (!Modernizr.history || a.custom || Models.room.data.custom ? window.location.href = "/" + a.id + "/" : (window.history.pushState(null, a.name, "/" + a.id + "/"), new RoomJoinService(a.id), _gaq.push(["_trackEvent", "Lobby Overlay", "Join Room", a.id])))
        },
        onCreateRoomClick: function () {
            Dialog.createRoom();
            _gaq.push(["_trackEvent", "Lobby Overlay", "Create Room"])
        }
    }),
    AvatarOverlayView = Class.extend({
        init: function () {
            this.initAvatars();
            this.selectedAvatar = null;
            this.avatarAnimationID = 0;
            this.overAvatar = null;
            this.selectedSet = this.avatarFrame = 0;
            this.extended = "su01,su02,luclin01,luclin02,luclin03,lazyrich,revolvr,anniemac,halloween01,halloween02,halloween03,halloween04,halloween05,halloween06,halloween07,halloween08,halloween09,halloween10,halloween11,halloween12,halloween13".split(",");
            $(".avatar-overlay-set-button").click($.proxy(this.onAvatarSetClick, this))
        },
        onAvatarSetClick: function (a) {
            var b = 0;
            "avatar-overlay-set-festival" == $(a.currentTarget).attr("id") && (b = 1);
            this.selectedSet != b && (this.selectedSet = b, this.draw())
        },
        show: function () {
            UserListOverlay.hide();
            $("#lobby-overlay").hide();
            $("#media-overlay").hide();
            $("#avatar-overlay").show();
            $("#overlay-container").show();
            this.draw()
        },
        draw: function () {
            $("#avatar-panel").html("");
            $("#avatar-panel").scrollTop(0);
            for (var a = this.avatarSets[this.selectedSet], b = a.length, c = 10, d = 0; d < b; ++d) {
                $("<div/>").addClass("avatar-buttons");
                var e = a[d].avatars,
                    f = e.length,
                    g = Models.user.data.listenerPoints + Models.user.data.djPoints + Models.user.data.curatorPoints,
                    h = Models.room.admins[Models.user.data.id] || Models.room.ambassadors[Models.user.data.id] ? !0 : !(a[d].required > g),
                    j = $.browser.mozilla ? 155 : 157;
                5 < f && (j += 150);
                j = $("<div/>").addClass("avatar-group").css("top", c).append($("<div/>").addClass("avatar-group-points").css("top", j).append($("<span/>").addClass("avatar-group-points-value").text(a[d].title)).append($("<span/>").addClass("avatar-group-points-label").text(Lang.avatar.points)));
                5 < f ? 6 != f ? (j.append(this.drawRow(e.slice(0,
                5), h, a[d].required - g)), j.append(this.drawRow(e.slice(5, f), h, a[d].required - g).css("top", 150))) : (j.append(this.drawRow(e.slice(0, 4), h, a[d].required - g)), j.append(this.drawRow(e.slice(4, f), h, a[d].required - g).css("top", 150))) : j.append(this.drawRow(e, h, a[d].required - g));
                e = 5 < f ? 400 : 250;
                j.height(e);
                c += e;
                $("#avatar-panel").append(j)
            }
            $(".avatar-button").click($.proxy(this.onAvatarClick, this));
            $(".avatar-button").mouseenter($.proxy(this.onAvatarOver, this));
            $(".avatar-button").mouseleave($.proxy(this.onAvatarOut,
            this));
            this.setSelectedAvatar(Models.user.data.avatarID);
            $(".avatar-overlay-set-button").removeClass("avatar-overlay-set-button-selected");
            0 == this.selectedSet ? $("#avatar-overlay-set-spacerave").addClass("avatar-overlay-set-button-selected") : 1 == this.selectedSet ? $("#avatar-overlay-set-halloween").addClass("avatar-overlay-set-button-selected") : 2 == this.selectedSet && $("#avatar-overlay-set-festival").addClass("avatar-overlay-set-button-selected")
        },
        drawRow: function (a, b, c) {
            for (var d = $("<div/>").addClass("avatar-row"),
            e = a.length, f = 5 == e ? 0 : 4 == e ? 75 : 3 == e ? 150 : 2 == e ? 225 : 300, g = 0; g < e; ++g) {
                var h = $("<div/>").addClass("avatar-button").css("left", f).data("avatarID", a[g]).data("available", b).css("cursor", b ? "pointer" : "default").append($("<img/>").attr("src", AvatarManifest.getAvatarUrl("default", a[g], "")));
                b || (1 != c ? h.append($("<div/>").addClass("avatar-button-lock")).attr("title", Lang.avatar.youNeed.split("%REQUIRED%").join(c)) : h.append($("<div/>").addClass("avatar-button-lock")).attr("title", Lang.avatar.youNeed1));
                d.append(h);
                f += 150
            }
            return d
        },
        onAvatarClick: function (a) {
            a = $(a.currentTarget);
            a.data("available") && (a = a.data("avatarID"), this.setSelectedAvatar(a), _gaq.push(["_trackEvent", "Avatar", "Select", a]))
        },
        onAvatarOver: function (a) {
            $(a.currentTarget).data("available") && (this.avatarAnimationID && clearInterval(this.avatarAnimationID), this.overAvatar && this.overAvatar.css("left", 0), this.avatarFrame = 0, this.avatarAnimationID = setInterval($.proxy(this.animateAvatar, this), 83), this.overAvatar = $(a.currentTarget).find("img"))
        },
        onAvatarOut: function (a) {
            $(a.currentTarget).data("available") && (clearInterval(this.avatarAnimationID), this.overAvatar.css("left", 0), this.overAvatar = null, this.avatarFrame = 0)
        },
        animateAvatar: function () {
            11 == ++this.avatarFrame && (this.avatarFrame = 0);
            this.overAvatar.css("left", -150 * this.avatarFrame)
        },
        setSelectedAvatar: function (a) {
            this.selectedAvatar = a;
            $(".avatar-button").each(function () {
                var b = $(this);
                b.data("avatarID") == a ? b.addClass("avatar-button-selected") : b.removeClass("avatar-button-selected")
            });
            Models.user.changeAvatar(this.selectedAvatar)
        },
        initAvatars: function () {
            Avatars = {
                audience: {
                    w: 150,
                    h: 150,
                    sw: 1650
                },
                booth: {
                    w: 150,
                    h: 205,
                    sw: 1650
                },
                dj: {
                    w: 170,
                    h: 220,
                    sw: 1870
                }
            };
            this.avatarSets = [];
            this.avatarSets.push(this.getOriginalSet());
            this.avatarSets.push(this.getFestivalSet())
        },
        getOriginalSet: function () {
            var a = {
                title: "0-99",
                required: 0
            }, b = {
                title: "100-299",
                required: 100
            }, c = {
                title: "300-699",
                required: 300
            }, d = {
                title: "700-1499",
                required: 700
            }, e = {
                title: "1500-2999",
                required: 1500
            }, f = {
                title: "3000-6999",
                required: 3E3
            }, g = {
                title: "7000-14999",
                required: 7E3
            }, h = {
                title: "15000+",
                required: 15E3
            };
            a.avatars = ["animal08", "animal05", "animal06", "animal02", "animal09"];
            b.avatars = ["animal01", "animal10", "animal11", "animal14", "animal13"];
            c.avatars = ["monster01", "monster04", "monster02", "monster05", "monster03"];
            d.avatars = ["animal12", "animal03", "animal04", "animal07"];
            e.avatars = "lucha01,lucha02,lucha04,lucha07,lucha08,lucha05,lucha03,lucha06".split(",");
            f.avatars = ["space01", "space02", "space03", "space06"];
            g.avatars = ["space04", "space05"];
            h.avatars = ["warrior01", "warrior02", "warrior03", "warrior04"];
            return [a, b, c, d, e, f,
            g, h]
        },
        getFestivalSet: function () {
            return [{
                title: "0-99",
                required: 0,
                avatars: "bud02,bud08,bud01,bud09,bud03,bud10,bud06,bud11".split(",")
            }, {
                title: "100+",
                required: 100,
                avatars: ["bud05", "bud07", "bud04"]
            }]
        }
    }),
    AvatarRollover = Class.extend({
        init: function () {
            $("#avatar-info-modal-background").mousedown($.proxy(this.onButtonClick, this));
            this.container = $("#avatar-rollover-container");
            this.div = $("#avatar-rollover");
            this.div.mouseenter($.proxy(this.hide, this));
            this.audience = $("#audience");
            this.audience.click($.proxy(this.onAvatarClick,
            this));
            $("#dj-booth").click($.proxy(this.onAvatarClick, this));
            this.audience.mouseleave($.proxy(this.hide, this));
            this.avatarImage = $("#avatar-rollover-image");
            this.username = $("#avatar-rollover-username");
            this.usertype = $("#avatar-rollover-usertype");
            this.points = $("#avatar-rollover-points");
            this.fans = $("#avatar-rollover-fans");
            this.plays = $("#avatar-rollover-plays");
            this.buttons = $("#avatar-rollover-buttons");
            this.isSimple = !1;
            this.hidden = !0;
            this.user = null;
            this.notInRoom = !1;
            this.targetX;
            this.targetY;
            this.requiredHeight = 74
        },
        showSimple: function (a, b, c) {
            this.isSimple || (this.isSimple = !0, this.requiredHeight = 74, this.buttons.html(""));
            if (!this.user || this.user.id != a.id) {
                this.notInRoom = !1;
                this.user = Models.room.userHash[a.id];
                if (!this.user) {
                    this.user = Models.room.nirUserHash[a.id];
                    if (!this.user) return;
                    this.notInRoom = !0
                }
                this.username.text(a.username);
                this.avatarImage.html("").append('<img src="' + AvatarManifest.getThumbUrl(this.user.avatarID) + '" width="28" height="28"/>');
                var d = "";
                1 == this.user.status ? d = "<" + Lang.userStatus.away +
                    ">" : 2 == this.user.status ? d = "<" + Lang.userStatus.working + ">" : 3 == this.user.status ? d = "<" + Lang.userStatus.sleeping + ">" : -1 == this.user.status && (d = "<" + Lang.userStatus.idle + ">");
                this.user.admin ? this.usertype.text(Lang.rollover.admin + " " + d).css("color", "#42a5dc") : Models.room.ambassadors[a.id] ? this.usertype.text(Lang.rollover.ambassador + " " + d).css("color", "#9a50ff") : a.id == Models.room.data.owner ? this.usertype.text(Lang.rollover.host + " " + d).css("color", "#e90e82") : Models.room.data.staff[a.id] ? Models.room.data.staff[a.id] == Models.user.COHOST ? this.usertype.text(Lang.rollover.cohost + " " + d).css("color", "#e90e82") : Models.room.data.staff[a.id] == Models.user.MANAGER ? this.usertype.text(Lang.rollover.manager + " " + d).css("color", "#e90e82") : Models.room.data.staff[a.id] == Models.user.BOUNCER ? this.usertype.text(Lang.rollover.bouncer + " " + d).css("color", "#e90e82") : Models.room.data.staff[a.id] == Models.user.FEATUREDDJ && this.usertype.text(Lang.rollover.featuredDJ + " " + d).css("color", "#e90e82") : (this.usertype.text(d ? d.split("<").join("").split(">").join("") : Lang.userStatus.available), this.user.id == Models.user.data.id ? this.usertype.css("color", "#ffdd6f") : this.usertype.css("color", "#B0B0B0"));
                a = this.user.listenerPoints + this.user.djPoints + this.user.curatorPoints;
                this.user.id == Models.room.data.currentDJ ? isNaN(Models.room.earnedPoints[Models.room.data.currentDJ].dj + Models.room.earnedPoints[Models.room.data.currentDJ].c) || (a += Models.room.earnedPoints[Models.room.data.currentDJ].dj + Models.room.earnedPoints[Models.room.data.currentDJ].c) : isNaN(Models.room.earnedPoints[this.user.id]) || (a += Models.room.earnedPoints[this.user.id]);
                this.points.text(a + " " + Lang.rollover.points);
                this.fans.text(this.user.fans + " " + Lang.rollover.fans);
                a = Models.room.getDJPlays(this.user.id);
                null != a ? (1 == a ? this.user.id == Models.room.data.currentDJ ? this.plays.text(Lang.rollover.lastPlay) : this.plays.text(Lang.rollover.playsRemaining1) : this.plays.text(Lang.rollover.playsRemaining.split("%COUNT%").join(a)), this.plays.show(), this.buttons.css("top", 90), this.requiredHeight = 90) : (this.plays.text(""), this.plays.hide(),
                this.buttons.css("top", 74), this.requiredHeight = 74);
                this.username.show();
                this.points.show();
                this.fans.show();
                this.div.height(this.requiredHeight);
                this.audience.css("cursor", "pointer")
            }
            this.targetX = b;
            this.targetY = c;
            a = Math.max(RoomUser.minimumRolloverWidth, this.username.position().left + this.username.width(), this.usertype.position().left + this.usertype.width() - 6);
            this.div.width(a + 10);
            this.div.css("left", b - a / 2).css("top", c - this.requiredHeight - 5);
            this.hidden && (this.container.show(), this.div.show(), this.hidden = !1);
            return !0
        },
        showChat: function (a, b, c) {
            this.showSimple(a, b, c) ? this.showInfo(c) : Dialog.alert(Lang.alerts.notInRoom)
        },
        showInfo: function (a) {
            this.buttons.html("");
            this.requiredHeight = null == Models.room.getDJPlays(this.user.id) ? 74 : 90;
            this.isSimple = !1;
            var b = [];
            if (this.notInRoom) {
                if ((Models.room.admins[Models.user.data.id] || Models.room.ambassadors[Models.user.data.id] || Models.user.hasPermission(Models.user.MANAGER) && (!Models.room.data.staff[this.user.id] || Models.room.data.staff[this.user.id] < Models.room.data.staff[Models.user.data.id])) && b.push(this.getButton(Lang.rollover.modPermissions, "modPerm")), Models.room.admins[Models.user.data.id] || Models.room.ambassadors[Models.user.data.id] || !Models.room.data.staff[this.user.id] || Models.room.data.staff[this.user.id] < Models.room.data.staff[Models.user.data.id]) b.push(this.getButton(Lang.rollover.modKick, "modkick")), Models.user.hasPermission(Models.user.MANAGER) && b.push(this.getButton(Lang.rollover.modBan, "modban"))
            } else {
                this.user.id != Models.user.data.id && (1 < this.user.relationship ? b.push(this.getButton(Lang.rollover.unfan,
                    "unfan")) : b.push(this.getButton(Lang.rollover.becomeFan, "fan")), b.push(this.getButton(Lang.rollover.mention, "mention")));
                Models.room.djHash[this.user.id] && this.user.id == Models.user.data.id && Models.room.userIsPlaying && b.push(this.getButton(Lang.rollover.skip, "skip"));
                if (this.user.id != Models.user.data.id && Models.user.hasPermission(Models.user.BOUNCER) && (Models.room.djHash[this.user.id] ? (Models.room.data.currentDJ == this.user.id && b.push(this.getButton(Lang.rollover.modSkip, "modskip")), b.push(this.getButton(Lang.rollover.modRemove,
                    "modremovedj"))) : Models.room.data.djs.length < Models.room.data.maxDJs ? b.push(this.getButton(Lang.rollover.modAdd, "modadddj")) : Models.room.data.waitListEnabled && (null == Models.room.getWaitListPosition(this.user.id) ? b.push(this.getButton(Lang.rollover.modAddWait, "modadddjwait")) : b.push(this.getButton(Lang.rollover.modRemoveWait, "modremovedjwait"))), !this.user.owner && !this.user.admin && !this.user.ambassador)) if ((Models.room.admins[Models.user.data.id] || Models.room.ambassadors[Models.user.data.id] || Models.user.hasPermission(Models.user.MANAGER) && (!Models.room.data.staff[this.user.id] || Models.room.data.staff[this.user.id] < Models.room.data.staff[Models.user.data.id])) && b.push(this.getButton(Lang.rollover.modPermissions, "modPerm")), Models.room.admins[Models.user.data.id] || Models.room.ambassadors[Models.user.data.id] || !Models.room.data.staff[this.user.id] || Models.room.data.staff[this.user.id] < Models.room.data.staff[Models.user.data.id]) b.push(this.getButton(Lang.rollover.modKick, "modkick")), Models.user.hasPermission(Models.user.MANAGER) && b.push(this.getButton(Lang.rollover.modBan,
                    "modban"));
                this.user.id == Models.user.data.id && (b.push(this.getButton(Lang.rollover.changeAvatar, "avatar")), b.push(this.getButton(Lang.dialog.userProfile, "userprofile")))
            }
            for (var c = Math.max(RoomUser.minimumRolloverWidth, this.username.position().left + this.username.width(), this.usertype.position().left + this.usertype.width() - 6), d = b.length, e = 0; e < d; ++e) this.buttons.append(b[e]), b[e].css("top", 25 * e), b[e].width(c - 2), this.requiredHeight += 25;
            Main.isMac && RoomUser.posRolloverLabel();
            this.requiredHeight -= 5;
            this.div.width(c + 10);
            this.div.height(this.requiredHeight + 5);
            a ? this.div.css("left", this.targetX - c).css("top", a) : this.div.css("left", this.targetX - c / 2);
            $("#avatar-info-modal-background").show()
        },
        getButton: function (a, b) {
            return $("<div/>").addClass("avatar-rollover-button").append($("<span/>").text(a)).data("action", b).click($.proxy(this.onButtonClick, this))
        },
        onButtonClick: function (a) {
            this.onAction($(a.currentTarget).data("action"));
            this.hide(!0);
            $("#avatar-info-modal-background").hide()
        },
        onAction: function (a) {
            "avatar" == a ? (AvatarOverlay.show(), _gaq.push(["_trackEvent", "User Rollover", "Change Avatar", Models.room.data.id])) : "userprofile" == a ? (Dialog.userProfile(), _gaq.push(["_trackEvent", "User Rollover", "User Profile", Models.room.data.id])) : "unfan" == a || "fan" == a ? (new UserFanService("fan" == a, this.user.id), _gaq.push(["_trackEvent", "User Rollover", "fan" == a ? "Fan" : "Unfan", Models.room.data.id])) : "mention" == a ? (Popout ? Popout.Chat.inputMention(this.user.username) : ((a = $(".chat-input input").attr("value")) || (a = ""), $(".chat-input input").attr("value",
            a + "@" + this.user.username + " ").focus()), _gaq.push(["_trackEvent", "User Rollover", "@ Mention", Models.room.data.id])) : "skip" == a ? (new DJSkipService, _gaq.push(["_trackEvent", "User Rollover", "Skip", Models.room.data.id, Playback.elapsed])) : "modskip" == a ? (new ModerationForceSkipService(Models.room.data.historyID), _gaq.push(["_trackEvent", "Moderation", "Force Skip", Models.user.data.id, Playback.elapsed])) : "modremovedj" == a ? (new ModerationRemoveDJService(this.user.id), _gaq.push(["_trackEvent", "Moderation", "Remove DJ",
            Models.user.data.id])) : "modadddj" == a ? (new ModerationAddDJService(this.user.id), _gaq.push(["_trackEvent", "Moderation", "Add DJ", Models.user.data.id])) : "modadddjwait" == a ? (new ModerationAddDJService(this.user.id), _gaq.push(["_trackEvent", "Moderation", "Add Wait List", Models.user.data.id])) : "modremovedjwait" == a ? (new ModerationWaitListRemoveService(this.user.id), _gaq.push(["_trackEvent", "Moderation", "Remove Wait List", Models.user.data.id])) : "modkick" == a ? (Dialog.moderateUser(this.user, !1), _gaq.push(["_trackEvent",
                "Moderation", "Kick User", Models.user.data.id])) : "modban" == a ? (Dialog.moderateUser(this.user, !0), _gaq.push(["_trackEvent", "Moderation", "Ban User", Models.user.data.id])) : "modPerm" == a && (Dialog.userPermissions(this.user), _gaq.push(["_trackEvent", "Moderation", "User Permissions", Models.user.data.id]))
        },
        hide: function (a) {
            if (this.isSimple || !0 == a) this.div.hide(), this.container.hide(), this.user = null, this.buttons.html(""), this.audience.css("cursor", "default"), this.hidden = !0, $("#avatar-info-modal-background").css("z-index",
            64)
        },
        onAvatarClick: function () {
            this.user && this.showInfo()
        }
    }),
    UserListOverlayView = Class.extend({
        init: function () {
            this.userList = new UserListView;
            $("#button-wait-list-join").click($.proxy(this.onWaitListJoinClick, this));
            $("#button-wait-list-leave").click($.proxy(this.onWaitListLeaveClick, this));
            this.isShowing = !1
        },
        show: function (a) {
            UserListOverlay.hide();
            this.isShowing = !0;
            $("#avatar-overlay").hide();
            $("#lobby-overlay").hide();
            $("#media-overlay").hide();
            $("#user-list-overlay").show();
            $("#overlay-container").show();
            var b;
            a ? (a = Models.room.getWaitList(), 1 != a.length && Lang.userList.waitTitle.split("%COUNT%").join("" + a.length), b = 1 != Models.room.data.waitListMode ? Models.room.getWaitListPosition() : null, b = null == b ? 1 != a.length ? Lang.userList.waitTitle.split("%COUNT%").join("" + a.length) : Lang.userList.waitTitle1 : Lang.userList.waitTitlePos.split("%POS%").join("" + b).split("%COUNT%").join("" + a.length), this.userList.setData(a, !0), this.userList.panel.scrollTop(0), $("#user-list-overlay").width(470), this.updateWaitListButton()) : (a = Models.room.getRoomUsersSorted(), b = 1 != a.length ? Lang.userList.roomTitle.split("%COUNT%").join("" + a.length) : Lang.userList.roomTitle1, this.userList.setData(a), this.userList.panel.scrollTop(0), $("#user-list-overlay").width(410), $("#wait-list-footer").hide());
            Main.onWindowResize(null);
            $("#user-list-overlay-title").text($("<span/>").html(b).text())
        },
        hide: function () {
            this.isShowing && (this.userList.panel.scrollTop(0), this.userList.panel.html(""), $("#user-list-overlay").hide(), $("#overlay-container").hide());
            this.isShowing = !1
        },
        updateUsers: function () {
            if ($("#user-list-overlay").is(":visible") && !this.userList.isWaitList) {
                var a = Models.room.getRoomUsersSorted(),
                    b;
                b = 1 != a.length ? Lang.userList.roomTitle.split("%COUNT%").join("" + a.length) : Lang.userList.roomTitle1;
                $("#user-list-overlay-title").text($("<span/>").html(b).text());
                this.userList.setData(a)
            }
        },
        updateWaitList: function () {
            if ($("#user-list-overlay").is(":visible") && this.userList.isWaitList) {
                var a = Models.room.getWaitList(),
                    b = 1 != Models.room.data.waitListMode ? Models.room.getWaitListPosition() : null,
                    b = null == b ? 1 != a.length ? Lang.userList.waitTitle.split("%COUNT%").join("" + a.length) : Lang.userList.waitTitle1 : Lang.userList.waitTitlePos.split("%POS%").join("" + b).split("%COUNT%").join("" + a.length);
                $("#user-list-overlay-title").text(b);
                this.updateWaitListButton();
                this.userList.setData(a, !0)
            }
        },
        updateWaitListButton: function () {
            null == Models.room.getWaitListPosition() ? ($("#button-wait-list-join").show(), $("#button-wait-list-leave").hide()) : ($("#button-wait-list-join").hide(),
            $("#button-wait-list-leave").show());
            Models.room.userInBooth ? $("#wait-list-footer").hide() : $("#wait-list-footer").show()
        },
        waitListServiceComplete: function (a) {
            $("#wait-list-footer").spin(!1);
            a ? ($("#button-wait-list-join").hide(), $("#button-wait-list-leave").show()) : ($("#button-wait-list-join").show(), $("#button-wait-list-leave").hide())
        },
        onWaitListJoinClick: function (a) {
            this.showWaitListSpinner();
            Room.onWaitListJoinClick();
            a && _gaq.push(["_trackEvent", "Actions", "Wait List Join Overlay", Models.user.data.id])
        },
        onWaitListLeaveClick: function () {
            Room.onWaitListLeaveClick()
        },
        showWaitListSpinner: function () {
            $("#user-list-overlay").is(":visible") && ($("#button-wait-list-join").hide(), $("#button-wait-list-leave").hide(), $("#wait-list-footer").spin({
                lines: 12,
                length: 0,
                width: 5,
                radius: 14
            }, "white"))
        },
        posRemoveSpan: function () {
            Main.isMac && ($.browser.mozilla ? $(".wait-list-remove-button span").css("top", 3) : $(".wait-list-remove-button span").css("top", 2))
        }
    });
UserListView = Class.extend({
    init: function () {
        this.panel = $("#user-list-panel")
    },
    setData: function (a, b) {
        this.isWaitList = b;
        this.panel.html("");
        !this.isWaitList || Models.room.userInBooth ? this.panel.height(480) : this.panel.height(422);
        for (var c = $("<ul/>"), d = Math.min(400, a.length), e = 0; e < d; ++e) {
            var f = a[e].username;
            1 == a[e].status ? f += " <" + Lang.userStatus.away + ">" : 2 == a[e].status ? f += " <" + Lang.userStatus.working + ">" : 3 == a[e].status ? f += " <" + Lang.userStatus.sleeping + ">" : -1 == a[e].status && (f += " <" + Lang.userStatus.idle +
                ">");
            a[e].admin ? f += " (" + Lang.rollover.admin + ")" : a[e].ambassador ? f += " (" + Lang.rollover.ambassador + ")" : a[e].id == Models.room.data.owner ? f += " (" + Lang.rollover.host + ")" : Models.room.data.staff[a[e].id] && (Models.room.data.staff[a[e].id] == Models.user.COHOST ? f += " (" + Lang.rollover.cohost + ")" : Models.room.data.staff[a[e].id] == Models.user.MANAGER ? f += " (" + Lang.rollover.manager + ")" : Models.room.data.staff[a[e].id] == Models.user.BOUNCER ? f += " (" + Lang.rollover.bouncer + ")" : Models.room.data.staff[a[e].id] == Models.user.FEATUREDDJ && (f += " (" + Lang.rollover.featuredDJ + ")"));
            f = $("<li/>").append($("<div/>").addClass("user-list-avatar").css("background", "url(" + AvatarManifest.getThumbUrl(a[e].avatarID) + ") no-repeat").data("user", a[e]).click($.proxy(this.onUserClick, this))).append($("<div/>").addClass("user-list-meta").append($("<span/>").addClass("user-list-meta-username").text(f)).append($("<span/>").addClass("user-list-meta-points").text(a[e].djPoints + a[e].listenerPoints + a[e].curatorPoints + " " + Lang.rollover.points)).append($("<span/>").addClass("user-list-meta-fans").text(a[e].fans +
                " " + Lang.rollover.fans)));
            b && a[e].id != Models.user.data.id && Models.user.hasPermission(Models.user.BOUNCER) && f.append($("<div/>").addClass("wait-list-remove-button").data("user", a[e]).click($.proxy(this.onWaitListRemoveClick, this)).append($("<span/>").text(Lang.userList.removeButton)));
            0 == e % 2 ? f.addClass("alternate-cell") : f.addClass("cell");
            c.append(f)
        }
        this.panel.append(c);
        UserListOverlay.posRemoveSpan()
    },
    onUserClick: function (a) {
        var b = $(a.currentTarget).data("user");
        Models.room.userHash[b.id] ? (RoomUser.rollover.showChat(Models.room.userHash[b.id],
        $("#user-list-panel").offset().left - 5, $(a.currentTarget).offset().top + 1), $("#avatar-info-modal-background").css("z-index", 110), _gaq.push(["_trackEvent", "Actions", "User List : Avatar Click", Models.room.data.id])) : Dialog.alert(Lang.alerts.notInRoom)
    },
    onWaitListRemoveClick: function (a) {
        var b = $(a.currentTarget).data("user");
        _gaq.push(["_trackEvent", "Actions", "Wait List : Remove User", Models.room.data.id]);
        Dialog.confirm(Lang.userList.removeUser, Lang.userList.removeUserMessage.split("%NAME%").join(b.username),

        function () {
            new ModerationWaitListRemoveService(b.id);
            b = null
        })
    }
});
var RoomView = Class.extend({
    init: function () {
        $("#button-lobby").click($.proxy(this.onLobbyClick, this));
        $("#button-my-playlists").click($.proxy(this.onMediaClick, this));
        $("#button-dj-play").click($.proxy(this.onPlayClick, this));
        $("#button-dj-quit").click($.proxy(this.onQuitClick, this));
        $("#button-dj-waitlist-join").click($.proxy(this.onWaitListJoinClick, this));
        $("#button-dj-waitlist-leave").click($.proxy(this.onWaitListLeaveClick, this));
        $("#button-dj-waitlist-view").click($.proxy(this.onWaitListViewClick,
        this));
        $("#button-dj-locked").click($.proxy(this.onPlayClick, this));
        $("#button-user-avatar").click($.proxy(this.onUserAvatarClick, this));
        $("#button-add-this").click($.proxy(this.onAddThisClick, this)).data("curate", !0);
        $("#button-share-twitter").click($.proxy(this.onTwitterClick, this));
        $("#button-share-facebook").click($.proxy(this.onFacebookClick, this));
        $("#button-skip-this").click($.proxy(this.onSkipClick, this));
        $("#meta-queue").click($.proxy(this.onQueueClick, this));
        $("#current-room-info").click($.proxy(this.onRoomInfoClick,
        this));
        $("#current-room-users").click($.proxy(this.onRoomUsersClick, this));
        $("#current-room-history").click($.proxy(this.onRoomHistoryClick, this));
        $("#user-name").mouseenter($.proxy(this.onUsernameEnter, this)).mouseleave($.proxy(this.onUsernameLeave, this)).click($.proxy(this.onUsernameEditClick, this));
        this.skipPending = !1
    },
    ready: function () {
        this.onMediaUpdate({
            djName: null,
            media: null
        });
        Models.room.addEventListener("mediaUpdate", $.proxy(this.onMediaUpdate, this));
        Models.room.addEventListener("scoreUpdate",
        $.proxy(this.onScoreUpdate, this))
    },
    setRoomMeta: function (a) {
        $("#current-room-value").text(a)
    },
    onMediaUpdate: function (a) {
        this.skipPending = !1;
        a.djName && a.media ? (this.setDJName(a.djName), $("#now-playing-value").text(a.media.author + " - " + a.media.title), Playback.media ? (Models.user.data.language && $("#button-add-this").css("background-image", "url(" + Lang.ui.buttonAddThis + ")").css("cursor", "pointer"), Models.room.userIsPlaying ? ($("#button-add-this").hide(), $("#button-skip-this").css("background-image", "url(" + Lang.ui.buttonSkipThis + ")").css("cursor", "pointer"), $("#button-skip-this").show()) : ($("#button-add-this").show(), $("#button-skip-this").hide())) : Models.user.data.language && $("#button-add-this").css("background-image", "url(" + Lang.ui.buttonAddThisDisabled + ")").css("cursor", "default"), $("#now-playing-header").show(), $("#time-remaining-header").show(), $("#room-score-header").show(), $("#room-score-value").show()) : (this.setDJName(Lang.room.nobodyPlaying), $("#now-playing-value").text(""), $("#now-playing-header").hide(),
        $("#time-remaining-header").hide(), $("#room-score-header").hide(), $("#room-score-value").hide(), Models.user.data.language && $("#button-add-this").css("background-image", "url(" + Lang.ui.buttonAddThisDisabled + ")").css("cursor", "default").show(), $("#button-skip-this").hide());
        if (Popout) Popout.Meta.onMediaUpdate(a)
    },
    setUserMeta: function (a, b, c) {
        this.setUserName("");
        this.setUserName(a);
        $("#user-points-value").text(Utils.commafy(b));
        $("#user-fans-value").text(Utils.commafy(c))
    },
    setQueueMeta: function (a) {
        a ? (Models.room.userInBooth ? Models.room.userIsPlaying ? $("#your-next-play").text(Lang.room.yourNextTurn) : $("#your-next-play").text(Lang.room.onYourTurn) : $("#your-next-play").text(Lang.room.whenYouDJ), $("#up-next").text(a)) : ($("#your-next-play").text(Lang.room.nothingQueued), $("#up-next").text(Lang.room.nothingQueuedSuggestion))
    },
    onScoreUpdate: function (a) {
        $("#room-score-positive-value").text(a.positive);
        $("#room-score-negative-value").text(a.negative);
        $("#room-score-curate-value").text(a.curates);
        var b = 0;
        999 < a.positive ? b = 27 : 99 < a.positive ? b = 18 : 9 < a.positive && (b = 9);
        $("#room-score-negative").css("left", 46 + b);
        999 < a.negative ? b += 27 : 99 < a.negative ? b += 18 : 9 < a.negative && (b += 9);
        $("#room-score-curate").css("left", 92 + b)
    },
    setUserAvatar: function (a) {
        $("#button-user-avatar").html("").append('<img src="' + AvatarManifest.getThumbUrl(a) + '" width="30" height="30"/>')
    },
    onAddThisClick: function () {
        Playback.media && !Models.room.userIsPlaying && (0 < Models.playlist.data.length ? (0 < Models.playlist.data.length && PopMenu.show($("#button-add-this"), [Playback.media]), _gaq.push(["_trackEvent", "Actions", "Curate : Active : " + (Models.room.userInBooth ? "Booth" : "Audience"), Models.room.data.id])) : (Dialog.createPlaylist(null, !0), _gaq.push(["_trackEvent", "Actions", "Curate : Create : " + (Models.room.userInBooth ? "Booth" : "Audience"), Models.room.data.id])))
    },
    onSkipClick: function () {
        Playback.media && Models.room.userIsPlaying && !this.skipPending && (new DJSkipService, _gaq.push(["_trackEvent", "Actions", "Skip", Models.room.data.id, Playback.elapsed]))
    },
    setSkipping: function () {
        this.skipPending = !0;
        $("#button-skip-this").css("background-image", "url(" + Lang.ui.buttonSkipThisDisabled + ")").css("cursor", "default")
    },
    onLobbyClick: function () {
        Lobby.show();
        _gaq.push(["_trackEvent", "Actions", "Lobby", Models.room.data.id])
    },
    onMediaClick: function () {
        MediaOverlay.show();
        _gaq.push(["_trackEvent", "Actions", "My Playlists", Models.room.data.id])
    },
    onPlayClick: function () {
        !Models.room.data.boothLocked || Models.user.hasPermission(Models.user.FEATUREDDJ) ? 5 > Models.room.data.djs.length && 0 < Models.playlist.data.length && 0 < Models.playlist.getSelected().items.length ? ($("#button-dj-play").hide(), $("#button-dj-quit").hide(), $("#join-container").spin({
            lines: 12,
            length: 0,
            width: 5,
            radius: 14
        }, "white"), new DJJoinService, _gaq.push(["_trackEvent", "Actions", "DJ Join", Models.room.data.id])) : 5 == Models.room.data.djs.length ? Dialog.alert(Lang.alerts.maxDJs) : 0 == Models.playlist.data.length ? (Dialog.alert(Lang.alerts.createFirstPlaylist, $.proxy(MediaOverlay.showHelp, MediaOverlay)), _gaq.push(["_trackEvent", "Actions", "DJ Join - No Playlists",
        Models.room.data.id])) : (Dialog.alert(Lang.alerts.playlistWithoutMedia, $.proxy(this.onQueueClick, this)), _gaq.push(["_trackEvent", "Actions", "DJ Join - No Items In Playlist", Models.room.data.id])) : Dialog.alert(Lang.alerts.lockedBooth)
    },
    onWaitListViewClick: function () {
        UserListOverlay.show(!0)
    },
    onWaitListJoinClick: function (a) {
        $("#button-dj-waitlist-join").hide();
        $("#button-dj-waitlist-view").hide();
        $("#join-container").spin({
            lines: 12,
            length: 0,
            width: 5,
            radius: 14
        }, "white");
        new WaitListJoinService;
        a && _gaq.push(["_trackEvent",
            "Actions", "Wait List Join", Models.user.data.id])
    },
    onWaitListLeaveClick: function (a) {
        Dialog.confirm(Lang.userList.leaveList, Lang.userList.leaveListMessage, $.proxy(this.onWaitListLeaveConfirm, this));
        a && _gaq.push(["_trackEvent", "Actions", "Wait List Leave", Models.user.data.id])
    },
    onWaitListLeaveConfirm: function () {
        $("#button-dj-waitlist-leave").hide();
        $("#button-dj-waitlist-view").hide();
        $("#join-container").spin({
            lines: 12,
            length: 0,
            width: 5,
            radius: 14
        }, "white");
        UserListOverlay.showWaitListSpinner();
        new WaitListLeaveService
    },
    onQuitClick: function () {
        Dialog.confirm(Lang.graphics.quitDJing, Lang.userList.quitDJingMessage, $.proxy(this.onQuitConfirm, this));
        _gaq.push(["_trackEvent", "Actions", "DJ Quit", Models.room.data.id])
    },
    onQuitConfirm: function () {
        $("#button-dj-play").hide();
        $("#button-dj-quit").hide();
        $("#button-dj-waitlist-view").hide();
        $("#join-container").spin({
            lines: 12,
            length: 0,
            width: 5,
            radius: 14
        }, "white");
        new DJLeaveService
    },
    onUsernameEnter: function () {
        $("#user-name-edit-button").show()
    },
    onUsernameLeave: function () {
        $("#user-name-edit-button").hide()
    },
    onUsernameEditClick: function () {
        Dialog.userProfile();
        _gaq.push(["_trackEvent", "Actions", "User Profile", Models.room.data.id])
    },
    onUserAvatarClick: function () {
        AvatarOverlay.show();
        _gaq.push(["_trackEvent", "Actions", "Change Avatar"])
    },
    setUserName: function (a) {
        1 == Models.user.data.status ? a += " <" + Lang.userStatus.away + ">" : 2 == Models.user.data.status ? a += " <" + Lang.userStatus.working + ">" : 3 == Models.user.data.status ? a += " <" + Lang.userStatus.sleeping + ">" : -1 == Models.user.data.status && (a += " <" + Lang.userStatus.idle + ">");
        var b = $("#user-name span");
        b.text(a);
        var a = 26,
            c = $("#user-name").width() - 6,
            d = 0,
            e = 0;
        do b.css("font-size", a), d = b.width(), e = b.height(), a -= 1;
        while (d > c && 12 < a);
        this.posUserName(b, d, e)
    },
    posUserName: function (a, b, c) {
        var d = Main.isMac ? 4 : 1;
        a.css("top", ~~ (($("#user-name").height() - c) / 2) + d);
        $("#user-name-edit-button").css("left", Math.min(203, 55 + b))
    },
    setDJName: function (a) {
        var b = $("#current-dj-value span");
        b.text(a);
        var a = 16,
            c = 0;
        do b.css("font-size", a), c = b.width(), b.height(), a -= 1;
        while (195 < c && 12 < a)
    },
    updateUserPlaying: function () {
        $("#join-container").spin(!1);
        this.updateDJButton()
    },
    updateDJButton: function () {
        var a = Models.room.data.djs.length == Models.room.data.maxDJs,
            b = Models.room.data.waitListEnabled;
        Models.room.data.boothLocked ? Models.room.userInBooth ? this.showDJQuitButton(b) : Models.user.hasPermission(Models.user.FEATUREDDJ) ? a ? b && null != Models.room.getWaitListPosition() ? this.showWaitListLeaveButton() : b ? this.showWaitListJoinButton() : this.showLockButton() : this.showDJPlayButton(b) : b && null != Models.room.getWaitListPosition() ? this.showWaitListLeaveButton() : b ? this.showWaitListJoinButton() : this.showLockButton() : (b = b && a, Models.room.userInBooth ? this.showDJQuitButton(b) : b && null != Models.room.getWaitListPosition() ? this.showWaitListLeaveButton() : b ? this.showWaitListJoinButton() : this.showDJPlayButton(b));
        b ? this.showWaitListViewButton() : this.hideWaitListViewButton()
    },
    showDJPlayButton: function (a) {
        this.hideDJButtons();
        a ? $("#button-dj-play").css("background-image", "url(" + Lang.ui.buttonDJPlayShort + ")").height(56).show() : $("#button-dj-play").css("background-image", "url(" + Lang.ui.buttonDJPlay + ")").height(81).show()
    },
    showDJQuitButton: function (a) {
        this.hideDJButtons();
        a ? $("#button-dj-quit").css("background-image", "url(" + Lang.ui.buttonDJQuitShort + ")").height(56).show() : $("#button-dj-quit").css("background-image", "url(" + Lang.ui.buttonDJQuit + ")").height(81).show()
    },
    showWaitListJoinButton: function () {
        this.hideDJButtons();
        !Models.room.data.boothLocked || Models.user.hasPermission(Models.user.FEATUREDDJ) ? $("#button-dj-waitlist-join").css("background-image", "url(" + Lang.ui.buttonDJWaitlistJoin +
            ")").show() : $("#button-dj-waitlist-join").css("background-image", "url(" + Lang.ui.buttonDJWaitlistJoinLocked + ")").show()
    },
    showWaitListLeaveButton: function () {
        this.hideDJButtons();
        $("#button-dj-waitlist-leave").show()
    },
    showWaitListViewButton: function () {
        var a = "",
            a = 1 != Models.room.data.waitListMode ? Models.room.getWaitListPosition() : null,
            a = null == a ? 1 == Models.room.data.waitList.length ? Lang.userList.waitTitle1 : Lang.userList.waitTitle.split("%COUNT%").join("" + Models.room.data.waitList.length) : Lang.userList.waitTitlePos.split("%POS%").join("" + a).split("%COUNT%").join("" + Models.room.data.waitList.length);
        $("#button-dj-waitlist-view").attr("title", $("<span/>").html(a).text());
        $("#button-dj-waitlist-view").show()
    },
    showLockButton: function () {
        this.hideDJButtons();
        $("#button-dj-locked").show()
    },
    hideDJButtons: function () {
        $("#button-dj-play").hide();
        $("#button-dj-quit").hide();
        $("#button-dj-locked").hide();
        $("#button-dj-waitlist-join").hide();
        $("#button-dj-waitlist-leave").hide()
    },
    hideWaitListViewButton: function () {
        $("#button-dj-waitlist-view").hide();
        $("#button-dj-waitlist-view").attr("title", null)
    },
    onQueueClick: function () {
        MediaOverlay.showPlaylist(Models.playlist.selectedPlaylistID);
        _gaq.push(["_trackEvent", "Actions", "Queue : " + (Models.room.userInBooth ? Models.room.userIsPlaying ? "DJ" : "Booth" : "Audience"), Models.playlist.selectedPlaylistID ? "Active" : "None"])
    },
    onRoomInfoClick: function () {
        Dialog.roomInfo()
    },
    onRoomUsersClick: function () {
        UserListOverlay.show(!1)
    },
    onRoomHistoryClick: function () {
        MediaOverlay.showHistory();
        _gaq.push(["_trackEvent", "Actions",
            "Room History", Models.room.data.id])
    },
    onTwitterClick: function () {
        var a;
        a = Models.room.userInBooth ? Lang.share.twitterDJ.split("%ROOM%").join(Models.room.data.name) : Lang.share.twitter.split("%ROOM%").join(Models.room.data.name);
        Playback.media && (a += " " + Lang.share.nowPlaying.split("%MEDIA%").join(Playback.media.author + " - " + Playback.media.title));
        var b = "http://plug.dj/" + encodeURIComponent(Models.room.data.id);
        this.openPopup(575, 420, "https://twitter.com/intent/tweet?text=" + encodeURIComponent(a + " " + b), "twitter");
        _gaq.push(["_trackEvent", "Actions", "Twitter", Models.room.data.id]);
        return !1
    },
    onFacebookClick: function () {
        var a = "http://plug.dj/" + Models.room.data.id,
            b;
        b = Models.room.userInBooth ? Lang.share.facebookNameDJ.split("%ROOM%").join(Models.room.data.name) : Lang.share.facebookName.split("%ROOM%").join(Models.room.data.name);
        var c = "";
        Playback.media && (c = Lang.share.nowPlaying.split("%MEDIA%").join(Playback.media.author + " - " + Playback.media.title));
        this.openPopup(1015, 495, "https://www.facebook.com/dialog/feed?app_id=216041638480603&redirect_uri=http%3A%2F%2Fplug.dj%2Ffbcallback&link=" + encodeURIComponent(a) + "&picture=" + encodeURIComponent("http://plug.dj/images/facebook01.png") + "&caption=" + encodeURIComponent(Lang.share.facebookCaption) + "&description=" + encodeURIComponent(c) + "&name=" + encodeURIComponent(b), "facebook");
        _gaq.push(["_trackEvent", "Actions", "Facebook", Models.room.data.id]);
        return !1
    },
    openPopup: function (a, b, c, d) {
        window.open(c, d, "status=1,width=" + a + ",height=" + b + ",left=" + (screen.width - a) / 2 + ",top=" + (screen.height - b) / 2)
    }
}),
    RoomUserView = Class.extend({
        init: function () {
            $("#button-vote-negative").css("cursor",
                "default").click($.proxy(this.onButtonVoteNegativeClick, this));
            $("#button-vote-positive").css("cursor", "default").click($.proxy(this.onButtonVotePositiveClick, this));
            this.avatarFrameIndex = 0;
            this.audienceArray = [];
            this.testID = this.audienceIntervalID = 0;
            this.minimumRolloverWidth = 140;
            this.negativeVoteLeft = 355;
            this.voteButtonsEnabled = !0
        },
        ready: function () {
            this.random = new Rndm;
            this.audience = new Audience;
            this.djBooth = new DJBooth;
            this.rollover = this.audience.rollover = this.djBooth.rollover = new AvatarRollover;
            var a = Main.isSafari || Main.isMac && Main.isChrome;
            this.audience.setRenderMode(a);
            this.djBooth.setRenderMode(a);
            Models.room.addEventListener("voteUpdate", $.proxy(this.onVoteUpdate, this));
            startAnimation()
        },
        posRolloverLabel: function () {
            $.browser.mozilla && $(".avatar-rollover-button span").css("top", 3)
        },
        testAddAvatar: function (a) {
            var b = [];
            a || (a = 1);
            for (var c = "animal01,animal02,animal03,animal04,animal05,animal06,animal07,animal08,animal09,animal10,animal11,animal12,animal13,animal14,lucha01,lucha02,lucha03,lucha04,lucha05,lucha06,lucha07,lucha08,monster01,monster02,monster03,monster04,monster05,space01,space02,space03,space04,space05,halloween01,halloween02,halloween03,halloween04,halloween05,halloween06,halloween07,halloween08,halloween09,halloween10,halloween11".split(","),
            d = 0; d < a; ++d) {
                var e = this.random.integer(0, c.length - 1),
                    e = {
                        id: "$_" + ++this.testID,
                        username: "" + this.testID + "_" + c[e],
                        avatarID: c[e],
                        vote: this.random.integer(0, 1),
                        listenerPoints: this.random.integer(0, 1E3),
                        djPoints: this.random.integer(0, 2500),
                        curatorPoints: this.random.integer(0, 100)
                    }, f = Math.random();
                e.relationship = 0.05 > f ? 3 : 0.2 > f ? 2 : 0.3 > f ? 1 : 0;
                e.vote = 1;
                b.push(e)
            }
            this.setAudience(b)
        },
        clear: function () {
            this.audience.clear();
            this.djBooth.clear();
            this.rollover.hide(!1)
        },
        setAudience: function (a) {
            this.audienceArray = a;
            this.audienceIntervalID && clearInterval(this.audienceIntervalID);
            0 < a.length && (this.audienceIntervalID = setInterval($.proxy(this.setAudienceNext, this), 100))
        },
        setAudienceNext: function () {
            0 < this.audienceArray.length ? this.audience.addUser(this.audienceArray.shift()) : (clearInterval(this.audienceIntervalID), Models.room.admins[Models.user.data.id] && console.log("Audience Render Complete :: " + this.audience.gridData.userCount + " avatars"), Models.room.checkStaffAvatars())
        },
        setDJs: function (a) {
            for (var b = a.length,
            c = 5; c--;) c < b && a[c] && this.audience.removeUser(a[c].id);
            this.djBooth.setData(a);
            this.rollover.hide(!1)
        },
        redraw: function () {
            this.clear();
            this.setAudience(Models.room.getAudience());
            this.setDJs(Models.room.getDJs())
        },
        animateAvatars: function () {
            11 == ++this.avatarFrameIndex && (this.avatarFrameIndex = 0);
            this.audience.frame = this.djBooth.frame = this.avatarFrameIndex;
            this.audience.draw();
            this.djBooth.draw()
        },
        userJoin: function (a) {
            this.audience.addUser(a);
            this.rollover.hide()
        },
        userUpdate: function (a) {
            this.audience.updateUser(a);
            this.djBooth.updateUser(a)
        },
        userLeave: function (a) {
            this.audience.removeUser(a);
            this.rollover.hide()
        },
        onVoteUpdate: function (a) {
            Models.room.userIsPlaying || !Models.room.data.media ? ($("#button-vote-negative").css("cursor", "default").css("background-image", "url(" + Lang.ui.buttonVoteNegativeDisabled + ")").css("left", 410), $("#button-vote-positive").css("cursor", "default").css("background-image", "url(" + Lang.ui.buttonVotePositiveDisabled + ")").css("left", 681), this.voteButtonsEnabled = !1) : this.enableVoteButtons();
            a.noRefresh || (a.boothRefresh ? this.djBooth.refresh() : this.audience.refresh())
        },
        enableVoteButtons: function () {
            1 == Models.room.userHash[Models.user.data.id].vote ? (0 < Playback.duration ? $("#button-vote-negative").css("cursor", "pointer").css("background-image", "url(" + Lang.ui.buttonVoteNegative + ")").css("left", this.negativeVoteLeft) : $("#button-vote-negative").css("cursor", "default").css("background-image", "url(" + Lang.ui.buttonVoteNegativeDisabled + ")").css("left", this.negativeVoteLeft), $("#button-vote-positive").css("cursor",
                "default").css("background-image", "url(" + Lang.ui.buttonVotePositiveSelected + ")").css("left", 741)) : (-1 == Models.room.userHash[Models.user.data.id].vote ? $("#button-vote-negative").css("cursor", "default").css("background-image", "url(" + Lang.ui.buttonVoteNegativeSelected + ")").css("left", this.negativeVoteLeft) : 0 < Playback.duration ? $("#button-vote-negative").css("cursor", "pointer").css("background-image", "url(" + Lang.ui.buttonVoteNegative + ")").css("left", this.negativeVoteLeft) : $("#button-vote-negative").css("cursor",
                "default").css("background-image", "url(" + Lang.ui.buttonVoteNegativeDisabled + ")").css("left", this.negativeVoteLeft), $("#button-vote-positive").css("cursor", "pointer").css("background-image", "url(" + Lang.ui.buttonVotePositive + ")").css("left", 741));
            this.voteButtonsEnabled = !0
        },
        updateVoteButtons: function () {
            !Models.room.userIsPlaying && Models.room.data.media && (0 == Playback.duration || 5 < Playback.duration - Playback.elapsed ? this.enableVoteButtons() : this.voteButtonsEnabled && (-1 != Models.room.userHash[Models.user.data.id].vote && $("#button-vote-negative").css("cursor", "default").css("background-image", "url(" + Lang.ui.buttonVoteNegativeDisabled + ")").css("left", this.negativeVoteLeft), 1 != Models.room.userHash[Models.user.data.id].vote && $("#button-vote-positive").css("cursor", "default").css("background-image", "url(" + Lang.ui.buttonVotePositiveDisabled + ")").css("left", 741), this.voteButtonsEnabled = !1))
        },
        onButtonVoteNegativeClick: function (a) {
            Playback.media && !Models.room.userIsPlaying && -1 != Models.room.userHash[Models.user.data.id].vote && 5 < Playback.duration - Playback.elapsed && (new RoomVoteService(!1, a), Models.room.userHash[Models.user.data.id].vote = Models.room.data.votes[Models.user.data.id] = -1, Models.room.updateRoomScore(), Models.room.userInBooth ? this.djBooth.refresh() : this.audience.refresh(), $("#button-vote-negative").css("cursor", "default").css("background-image", "url(" + Lang.ui.buttonVoteNegativeSelected + ")"), $("#button-vote-positive").css("cursor", "pointer").css("background-image", "url(" + Lang.ui.buttonVotePositive + ")"), _gaq.push(["_trackEvent",
                "Voting", "Negative : " + (Models.room.userInBooth ? "Booth" : "Audience"), Models.room.data.id]))
        },
        onButtonVotePositiveClick: function (a) {
            if (Playback.media && !Models.room.userIsPlaying && 1 != Models.room.userHash[Models.user.data.id].vote && (0 == Playback.duration || 5 < Playback.duration - Playback.elapsed)) new RoomVoteService(!0, a), Models.room.userHash[Models.user.data.id].vote = Models.room.data.votes[Models.user.data.id] = 1, Models.room.updateRoomScore(), Models.room.userInBooth ? this.djBooth.refresh() : this.audience.refresh(),
            $("#button-vote-positive").css("cursor", "default").css("background-image", "url(" + Lang.ui.buttonVotePositiveSelected + ")"), $("#button-vote-negative").css("cursor", "pointer").css("background-image", "url(" + Lang.ui.buttonVoteNegative + ")"), _gaq.push(["_trackEvent", "Voting", "Positive : " + (Models.room.userInBooth ? "Booth" : "Audience"), Models.room.data.id])
        }
    }),
    reqAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame,
    tickStart = Date.now(),
    animIntervalID, animSpeed = 83;

function avatarTick(a) {
    a - tickStart > animSpeed && (tickStart = Date.now(), RoomUser.animateAvatars());
    reqAnimFrame(avatarTick)
}
function startAnimation() {
    reqAnimFrame ? (reqAnimFrame(avatarTick), animIntervalID = "raf") : animIntervalID = setInterval($.proxy(RoomUser.animateAvatars, RoomUser), animSpeed + 1)
}
var MediaOverlayView = Class.extend({
    init: function () {
        $(".overlay-close-button").click($.proxy(this.onOverlayCloseClick, this));
        $("#media-menu-playlists").mouseup($.proxy(this.onPlaylistCreateClick, this));
        $("#playlist-activate-button").mouseup($.proxy(this.onPlaylistActionsActivateClick, this));
        $("#playlist-edit-button").mouseup($.proxy(this.onPlaylistActionsEditClick, this));
        $("#playlist-delete-button").mouseup($.proxy(this.onPlaylistActionsDeleteClick, this));
        $("#related-back-button").mouseup($.proxy(this.onRelatedBackButtonClick,
        this));
        $("#playlist-import-button").mouseup($.proxy(this.onPlaylistImportButtonClick, this));
        Models.search.updateCallback = $.proxy(this.onSearchUpdate, this);
        Models.youtubePlaylist.updateCallback = $.proxy(this.onYouTubePlaylistsUpdate, this);
        Models.soundcloudPlaylist.updateCallback = $.proxy(this.onSoundCloudPlaylistsUpdate, this);
        Models.youtubePlaylistMedia.updateCallback = $.proxy(this.onImportPlaylistMediaUpdate, this);
        Models.history.updateCallback = $.proxy(this.onHistoryUpdate, this);
        this.documentKeyDownProxy = $.proxy(this.onDocumentKeyDown, this);
        this.documentKeyUpProxy = $.proxy(this.onDocumentKeyUp, this);
        this.deleteMediaCallbackProxy = $.proxy(this.onMediaDelete, this);
        this.deletePlaylistCallbackProxy = $.proxy(this.onPlaylistDelete, this);
        this.playlistMediaView = new PlaylistMediaListView;
        this.searchView = new SearchMediaListView;
        this.searchPlaylistsView = new SearchPlaylistsMediaListView;
        this.historyListView = new HistoryListView;
        this.ytImportPlaylistsView = new YouTubeImportPlaylistsView;
        this.scImportPlaylistsView = new SoundCloudImportPlaylistsView;
        this.importMediaView = new SearchMediaListView;
        this.currentListView = this.roomProgress = this.loadProgress = this.createPlaylistProgress = this.playlistProgress = null;
        this.ctrlDown = !1;
        this.importView = this.helpView = this.baseList = null;
        this.firstTime = !0;
        this.history = [];
        this.panelTitleOffset = 65
    },
    ready: function () {
        Models.media.syncCompleteCallback = $.proxy(this.onMediaSynced, this);
        Models.media.sync()
    },
    onMediaSynced: function () {
        Models.playlist.updateCallback = $.proxy(this.onFirstPlaylistUpdate,
        this);
        Models.playlist.sync()
    },
    onFirstPlaylistUpdate: function (a) {
        this.onPlaylistUpdate(a);
        Models.playlist.selectedPlaylistID && (a = Models.playlistMedia(Models.playlist.selectedPlaylistID), a.updateCallback = $.proxy(this.onPlaylistMediaUpdate, this), a.load());
        Models.playlist.updateCallback = $.proxy(this.onPlaylistUpdate, this)
    },
    show: function () {
        this.display();
        this.firstTime ? (this.firstTime = !1, DB.settings.ph ? this.showPlaylist(Models.playlist.selectedPlaylistID) : (DB.settings.ph = !0, DB.saveSettings(), this.showHelp())) : (this.playlistMediaView.lockFirstItem = Models.room.userIsPlaying && this.selection == Models.room.data.playlistID, this.selection == Models.room.data.playlistID && (this.playlistMediaView.playlistID = this.selection, this.playlistMediaView.update()))
    },
    showHelp: function () {
        this.display();
        this.firstTime && (this.firstTime = !1);
        $("#media-panel .media-list").html("");
        this.helpView || (this.helpView = $("<div/>").addClass("playlist-overlay-help").append($("<span/>").append("<h1>" + Lang.help.header + "</h1><br/>").append("<h2>" + Lang.help.playing + "</h2>").append("<p>" + Lang.help.playing1 + "<br/>" + Lang.help.playing2 + '<br/><img src="http://plug.dj/_/static/images/ButtonActivatePlaylistSelected.4ecdc9fb.png"> ' + Lang.help.playing3 + '<br/><img src="http://plug.dj/_/static/images/ButtonActivatePlaylistReverse.5fb5278b.png"> ' + Lang.help.playing4 + "</p>").append("<h2>" + Lang.help.selecting + "</h2>").append("<p>" + Lang.help.selecting1 + "<br/>" + Lang.help.selecting2 + "<br/>" + Lang.help.selecting3 + "<br/>" + Lang.help.selecting4 + "<br/>" + Lang.help.selecting5 +
            "<br/>" + Lang.help.selecting6 + "</p>").append("<h2>" + Lang.help.filtering + "</h2>").append("<p>" + Lang.help.filtering1 + "<br/>" + Lang.help.filtering2 + "</p>")));
        this.hideLoadProgress();
        this.currentListView = this.selection = this.helpView;
        this.history = [];
        this.menuSelect(null);
        this.setPanelTitle(Lang.help.title, null, 0);
        $("#media-panel .media-list").append(this.helpView)
    },
    showImport: function () {
        this.display();
        $("#media-panel .media-list").html("");
        this.importView || (this.importView = $("<div/>").addClass("playlist-overlay-help").append($("<span/>").append("<p>" + Lang.import.message + "</p>").append('<div id="media-import-youtube-button"><span>' + Lang.dialog.youtubeImport + '</span></div><div id="media-import-soundcloud-button"><span>' + Lang.dialog.soundcloudImport + '</span></div><div id="tt-import-button"><span>' + Lang.import.turntableImport + '</span><input id="tt-import" type="file" value="TT Import" name="ttfile"/></div>').append("<p><br/><br/>" + Lang.import.tttools.split("%URL%").join('<a href="http://egeste.net/blog/2012/09/08/migrating-your-turntable-fm-playlist-to-plug-dj/" target="_blank">ttTools</a>') +
            "</p>").append('<div id="itunes-import-button"><span>' + Lang.dialog.itunesImport + '</span><input id="itunes-import" type="file" value="iTunes Import" name="itunesfile"/></div>').append("<p><br/><br/><br/>" + Lang.import.itunes + "</p>")));
        this.hideLoadProgress();
        this.currentListView = this.selection = this.importView;
        this.history = [];
        this.menuSelect(null);
        this.setPanelTitle(Lang.import.title, null, 0);
        $("#media-panel .media-list").append(this.importView);
        $("#media-import-soundcloud-button").click($.proxy(Search.onSoundCloudImportClick,
        Search));
        SC || $("#media-import-soundcloud-button").hide();
        $("#media-import-youtube-button").click($.proxy(Search.onYouTubeImportClick, Search));
        $("#tt-import").change($.proxy(Search.onTTImportClick, Search));
        $("#itunes-import").change($.proxy(Models.itunes.load, Models.itunes));
        this.posImportLabels()
    },
    posImportLabels: function () {
        var a = 0;
        if (Main.isMac) $.browser.mozilla ? (a = -5, $("#media-import-youtube-button span").css("top", 8), $("#media-import-soundcloud-button span").css("top", 8), $("#tt-import-button span").css("top",
        8).css("left", 8), $("#itunes-import-button span").css("top", 8).css("left", 8)) : a = -2;
        else if (Main.isChrome) a = -2;
        else if ($.browser.msie || Main.isSafari) a = -7;
        $("#media-import-soundcloud-button").css("top", 41 + a);
        $("#media-import-youtube-button").css("top", 41 + a);
        $("#tt-import-button").css("top", 41 + a);
        $("#itunes-import-button").css("top", 125 + a)
    },
    showHistory: function () {
        this.display();
        this.onRoomHistoryClick(null);
        $("#media-panel .media-list").scrollTop(0)
    },
    display: function () {
        UserListOverlay.hide();
        $("#avatar-overlay").hide();
        $("#lobby-overlay").hide();
        $("#media-overlay").show();
        $("#overlay-container").show();
        $(document).keydown(this.documentKeyDownProxy);
        $(document).keyup(this.documentKeyUpProxy);
        this.selection == this.historyListView && !Models.history.hasLoaded && (this.showLoadProgress(), Models.history.load())
    },
    onRoomHistoryClick: function () {
        if (this.selection != this.historyListView || !this.historyListView.isRoom) this.historyListView.isRoom = !0, this.selection = this.historyListView, this.menuSelect(null), Models.history.hasLoaded || this.showLoadProgress(), this.setPanelTitle(Lang.html.roomHistory, null), Models.history.load()
    },
    onPlaylistCreateClick: function () {
        var a;
        this.currentListView && this.currentListView.isDragging ? (a = this.currentListView.getSelectedCells(), _gaq.push(["_trackEvent", "Actions", "Create Playlist From Selection", "", a.length])) : _gaq.push(["_trackEvent", "Actions", "Create Playlist"]);
        Dialog.createPlaylist(a)
    },
    onPlaylistRelease: function (a) {
        var b = $(a.currentTarget).data("playlist");
        $("#playlist-actions").data("playlist",
        b);
        var c = b.id;
        this.selection != c && (!this.currentListView || !this.currentListView.isDragging ? (this.selection = c, this.playlistMediaView.playlistID = c, this.playlistMediaView.selectedCells = {}, this.playlistMediaView.lockFirstItem = c == Models.room.data.playlistID, Models.room.userInBooth && Models.playlist.selectedPlaylistID == c ? $("#playlist-delete-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonPlaylistDeleteDisabled.d3c9c101.png)").css("cursor", "default") : $("#playlist-delete-button").css("background-image",
            "url(http://plug.dj/_/static/images/ButtonPlaylistDelete.f1f35121.png)").css("cursor", "pointer"), this.menuSelect(a.currentTarget), this.onPlaylistOver(a), this.setPanelTitle(b.name, "playlist-icon-white"), c = Models.playlistMedia(c), c.updateCallback = $.proxy(this.onPlaylistMediaUpdate, this), c.load()) : (a = 0, 1 < Models.playlistMedia(c).data.length && (a = Models.room.userIsPlaying && c == Models.room.data.playlistID ? Models.playlistMedia(c).data[1].id : Models.playlistMedia(c).data[0].id), Models.playlistMedia(c).mediaInsert(this.currentListView.getSelectedCells(),
        a)))
    },
    onPlaylistMediaUpdate: function (a, b) {
        var c = Models.playlist.facade.store.firstMedia(b);
        if (this.selection == b && ($("#media-overlay").is(":visible") || b == Models.playlist.selectedPlaylistID)) this.playlistMediaView.firstMedia = c, this.playlistMediaView.playlistID != b && $("#media-panel .media-list").scrollTop(0), this.playlistMediaView.playlistID = b, this.playlistMediaView.setData(a, this.pendingSelection), this.pendingSelection = null, this.currentListView = this.playlistMediaView, this.baseList = this.selection, this.history = [];
        Models.playlist.selectedPlaylistID == b && this.updateQueueMeta()
    },
    onSearchUpdate: function (a) {
        $("#media-panel .media-list").scrollTop(0);
        this.searchView.setData(a);
        this.currentListView = this.searchView
    },
    onHistoryUpdate: function (a) {
        $("#media-panel .media-list").scrollTop(0);
        this.historyListView.setData(a);
        this.baseList = this.currentListView = this.historyListView;
        this.history = []
    },
    onUpdateTimeRemaining: function (a) {
        $("#media-overlay").is(":visible") && (this.currentListView == this.playlistMediaView ? this.playlistMediaView.updateTimeRemaining(a) : this.selection == this.historyListView && this.historyListView.refreshData())
    },
    onYouTubePlaylistsUpdate: function (a) {
        $("#media-panel .media-list").scrollTop(0);
        this.ytImportPlaylistsView.setData(a);
        this.baseList = this.currentListView = this.ytImportPlaylistsView;
        this.history = []
    },
    onImportPlaylistMediaUpdate: function (a) {
        $("#media-panel .media-list").scrollTop(0);
        this.importMediaView.setData(a);
        this.currentListView = this.importMediaView;
        this.history = []
    },
    onSoundCloudPlaylistsUpdate: function (a) {
        $("#media-panel .media-list").scrollTop(0);
        this.scImportPlaylistsView.setData(a);
        this.baseList = this.currentListView = this.scImportPlaylistsView;
        this.history = []
    },
    onPlaylistUpdate: function (a) {
        for (var b = $("<ul/>"), c = a.length, d = $("#playlist-actions").data("playlist"), e = 0; e < c; ++e) {
            var f = $("<div/>").addClass("menu-playlist-item-activate-button").data("playlist", a[e]).mouseup($.proxy(this.onPlaylistActivateClick, this)).attr("title", Lang.tooltips.playlistActivate);
            a[e].selected && f.css("background-image", "url(http://plug.dj/_/static/images/ButtonActivatePlaylistSelected.4ecdc9fb.png)").css("cursor",
                "default").css("display", "block").attr("title", Lang.tooltips.playlistActive);
            var g;
            g = 1 == a[e].items.length ? Lang.media.item : Lang.media.items.split("%COUNT%").join("" + a[e].items.length);
            f = $("<li/>").attr("id", a[e].id).data("playlist", a[e]).mouseup($.proxy(this.onPlaylistRelease, this)).mouseenter($.proxy(this.onPlaylistOver, this)).mouseleave($.proxy(this.onPlaylistOut, this)).append(f).append($("<span/>").addClass("menu-playlist-item-label").text(a[e].name)).append($("<span/>").addClass("menu-playlist-item-label menu-playlist-item-count").text(g));
            this.selection == a[e].id ? f.addClass("menu-playlist-item-selected") : f.removeClass("menu-playlist-item-selected");
            b.append(f);
            this.currentListView == this.playlistMediaView && d && d.id == a[e].id && ($("#playlist-actions").data("playlist", a[e]), this.updateTitle(a[e].name))
        }
        this.currentListView == this.playlistMediaView && (this.selection == Models.playlist.selectedPlaylistID ? ($("#playlist-activate-button").css("background-image", "url(" + Lang.ui.buttonPlaylistActivated + ")").css("cursor", "default").attr("title", Lang.tooltips.playlistActive),
        $("#playlist-actions").data("playlist", Models.playlist.getByID(Models.playlist.selectedPlaylistID))) : ($("#playlist-activate-button").css("background-image", "url(" + Lang.ui.buttonPlaylistActivate + ")").css("cursor", "pointer").attr("title", Lang.tooltips.playlistActivate), $("#playlist-actions").data("playlist", Models.playlist.getByID(this.selection))));
        $("#media-menu-playlist-container").html(b);
        Models.playlist.selectedPlaylistID && Models.playlistMedia(Models.playlist.selectedPlaylistID).read();
        Main.isMac && $.browser.mozilla && ($(".menu-playlist-item-name").css("top", 9), $(".menu-playlist-item-count").css("top", 24));
        this.updateQueueMeta()
    },
    onPlaylistDelete: function (a) {
        if (a != Models.playlist.selectedPlaylistID) this.showPlaylist(Models.playlist.selectedPlaylistID);
        else {
            for (var b = Models.playlist.data.length, c, d = 0; d < b; ++d) if (Models.playlist.data[d].id != a) {
                c = Models.playlist.data[d].id;
                break
            }
            this.showPlaylist(c)
        }
        Models.playlist.facade.deleteCallback = null
    },
    onPlaylistOver: function (a) {
        a = $(a.currentTarget).find(".menu-playlist-item-activate-button");
        a.data("playlist").id == this.selection && (this.playlistProgress ? this.playlistOver = this.selection : a.show())
    },
    onPlaylistOut: function (a) {
        this.playlistProgress || (a = $(a.currentTarget).find(".menu-playlist-item-activate-button"), a.data("playlist").id == this.selection && a.data("playlist").id != Models.playlist.selectedPlaylistID && a.hide());
        this.playlistOver = null
    },
    onPlaylistActivateClick: function (a) {
        a.preventDefault();
        a.stopImmediatePropagation();
        if ((a = $(a.currentTarget).data("playlist")) && !a.selected) Models.room.userInBooth && 0 == Models.playlistMedia(a.id).data.length ? Dialog.alert(Lang.alerts.emptyPlaylist) : (Models.playlist.facade.activate(a.id), _gaq.push(["_trackEvent", "Actions", "Activate Playlist : Check"]))
    },
    onPlaylistActionsActivateClick: function () {
        this.selection != Models.playlist.selectedPlaylistID && (Models.room.userInBooth && 0 == Models.playlistMedia(this.selection).data.length ? Dialog.alert(Lang.alerts.emptyPlaylist) : (Models.playlist.facade.activate(this.selection), _gaq.push(["_trackEvent", "Actions", "Activate Playlist : Button"])))
    },
    onPlaylistActionsEditClick: function () {
        var a = $("#playlist-actions").data("playlist");
        a && (Dialog.renamePlaylist(a), _gaq.push(["_trackEvent", "Actions", "Edit Playlist"]))
    },
    onPlaylistActionsDeleteClick: function () {
        var a = $("#playlist-actions").data("playlist");
        a && (Models.room.userInBooth && Models.playlist.selectedPlaylistID == a.id ? Dialog.alert(Lang.alerts.deleteActive) : (Dialog.deletePlaylist(a), _gaq.push(["_trackEvent", "Actions", "Delete Playlist"])))
    },
    updateUserPlaying: function () {
        this.playlistMediaView.lockFirstItem = !1;
        this.selection == Models.room.data.playlistID && (this.playlistMediaView.lockFirstItem = Models.room.userIsPlaying, this.playlistMediaView.playlistID = this.selection, this.playlistMediaView.update(), Models.room.userInBooth ? $("#playlist-delete-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonPlaylistDeleteDisabled.d3c9c101.png)").css("cursor", "default") : $("#playlist-delete-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonPlaylistDelete.f1f35121.png)").css("cursor",
            "pointer"));
        this.updateQueueMeta()
    },
    updateQueueMeta: function (a) {
        if (Models.playlist.selectedPlaylistID) {
            a || (a = Models.playlist.facade.store.firstMedia(Models.playlist.selectedPlaylistID));
            var b;
            Models.room.userIsPlaying && Models.room.data.playlistID == Models.playlist.selectedPlaylistID && 2 == a.length ? b = DB.media[a[1]] : 0 < a.length && (b = DB.media[a[0]]);
            b ? Room.setQueueMeta(b.author + " - " + b.title) : Room.setQueueMeta()
        } else Room.setQueueMeta()
    },
    onOverlayCloseClick: function () {
        Search.hideSuggestions();
        $("#overlay-container").hide();
        $("#media-overlay").hide();
        $("#avatar-overlay").hide();
        $("#wait-list-overlay").hide();
        $("#lobby-overlay").hide();
        $(document).unbind("keydown", this.documentKeyDownProxy);
        $(document).unbind("keyup", this.documentKeyUpProxy)
    },
    menuSelect: function (a) {
        $("#media-menu-playlist-container li").removeClass("menu-playlist-item-selected");
        a && (a = $(a), a.addClass("menu-playlist-item-selected"));
        this.selection != this.searchView ? (Search.clearInputs(), $("#media-panel-pagination").hide(), this.currentListView != this.playlistMediaView && this.currentListView != this.helpView ? $("#media-panel-count").show() : $("#media-panel-count").hide()) : ($("#media-panel-count").hide(), $("#media-panel-pagination").show());
        $("#media-panel .media-list").html("");
        $("#media-panel .media-list").scrollTop(0);
        $("#media-panel-count").text(0);
        this.playlistMediaView.selectNone();
        this.searchView.selectNone();
        this.historyListView.selectNone()
    },
    onRelatedBackButtonClick: function () {
        if (0 < this.history.length) {
            var a = this.history.pop();
            this.setPanelTitle(a.title, null,
            a.data.length, 0 < this.history.length || this.baseList != this.searchView);
            this.onSearchUpdate(a.data)
        } else if (this.baseList == this.historyListView) this.onRoomHistoryClick(null), this.menuSelect($("#media-menu-room-history"));
        else if (this.baseList == this.ytImportPlaylistsView && this.selection == this.importMediaView) this.onYouTubeImport(this.ytImportPlaylistsView.username), $("#media-panel .media-list").scrollTop(0), this.ytImportPlaylistsView.setData(Models.youtubePlaylist.data);
        else if (this.baseList == this.ytImportPlaylistsView && this.selection == this.searchView) this.onYouTubeImportMedia(this.importMediaView.ytp), $("#media-panel .media-list").scrollTop(0), this.importMediaView.setData(Models.youtubePlaylistMedia.data);
        else if (this.baseList == this.scImportPlaylistsView && this.selection == this.importMediaView) this.onSoundCloudSetsImport(), $("#media-panel .media-list").scrollTop(0), this.scImportPlaylistsView.setData(Models.soundcloudPlaylist.data);
        else if (this.baseList == this.scImportPlaylistsView && this.selection == this.searchView) $("#media-panel .media-list").scrollTop(0),
        this.onSoundCloudSetSelect(this.importMediaView.ytp);
        else {
            this.selection = this.baseList;
            var b;
            $("#media-menu-playlist-container li").each(function () {
                $(this).data("playlist").id == this.selection && (b = this)
            });
            this.menuSelect(b);
            this.setPanelTitle(Models.playlist.getByID(this.selection).name, "playlist-icon-white");
            a = Models.playlistMedia(this.selection);
            a.updateCallback = $.proxy(this.onPlaylistMediaUpdate, this);
            a.load()
        }
        _gaq.push(["_trackEvent", "Actions", "Related Back"])
    },
    showPlaylist: function (a, b, c) {
        if (a) {
            this.selection = a;
            this.currentListView = this.playlistMediaView;
            this.playlistMediaView.playlistID = this.selection;
            this.playlistMediaView.lockFirstItem = Models.room.userIsPlaying && a == Models.room.data.playlistID;
            this.playlistMediaView.selectedCells = {};
            this.pendingSelection = {
                id: b,
                jump: c
            };
            $("#playlist-actions").data("playlist", Models.playlist.getByID(a));
            var d;
            $("#media-menu-playlist-container li").each(function () {
                $(this).data("playlist").id == a && (d = this)
            });
            Models.room.userInBooth && Models.playlist.selectedPlaylistID == a ? $("#playlist-delete-button").css("background-image",
                "url(http://plug.dj/_/static/images/ButtonPlaylistDeleteDisabled.d3c9c101.png)").css("cursor", "default") : $("#playlist-delete-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonPlaylistDelete.f1f35121.png)").css("cursor", "pointer");
            this.menuSelect(d);
            this.setPanelTitle(Models.playlist.getByID(this.selection).name, "playlist-icon-white");
            b = Models.playlistMedia(this.selection);
            b.updateCallback = $.proxy(this.onPlaylistMediaUpdate, this);
            this.show();
            b.load()
        } else this.playlistMediaView.setData([]),
        this.playlistMediaView.firstMedia = [], this.menuSelect(null), this.setPanelTitle("", null), this.show(), this.hideLoadProgress();
        $("#media-panel .media-list").scrollTop(0)
    },
    showNowPlayingRelated: function () {
        this.show();
        this.baseList = null;
        this.history = [];
        !Playback.media.format || 1 == Playback.media.format ? (this.onSearch(Playback.media.author + " - " + Playback.media.title, !0), Models.search.loadYTRelated(Playback.media.cid)) : 2 == Playback.media.format && (this.onSearch(Playback.media.author, !0), Models.search.load(Playback.media.author,
            "2", 0))
    },
    onMediaDelete: function () {
        this.playlistMediaView.selectedCells = {}
    },
    onSearch: function (a, b) {
        if (b) {
            if (this.currentListView == this.searchView) {
                for (var c = [], d = this.searchView.data.length, e = 0; e < d; ++e) c.push(Utils.clone(this.searchView.data[e]));
                this.history.push({
                    title: $("#media-panel-title").text(),
                    data: c
                })
            }
        } else this.baseList = this.searchView, this.history = [];
        this.selection = this.currentListView = this.searchView;
        this.menuSelect(null);
        this.showLoadProgress();
        this.setPanelTitle(a, "search-icon-white",
        0, b);
        null == this.baseList && (this.baseList = this.searchView)
    },
    onYouTubeImport: function (a) {
        this.baseList = this.selection = this.currentListView = this.ytImportPlaylistsView;
        this.ytImportPlaylistsView.username = a;
        this.history = [];
        this.menuSelect(null);
        this.showLoadProgress();
        this.setPanelTitle(a, "youtube-icon-white", 0, !1);
        $("#playlist-import-button-label").text("Import All");
        $("#playlist-import-button").width(64).show()
    },
    onYouTubeImportMedia: function (a) {
        this.selection = this.currentListView = this.importMediaView;
        this.importMediaView.ytp = a;
        this.history = [];
        this.menuSelect(null);
        this.showLoadProgress();
        this.setPanelTitle(a.name, "youtube-icon-white", 0, !0);
        $("#playlist-import-button-label").text(Lang.alerts.import);
        $("#playlist-import-button").width(74).show()
    },
    onPlaylistImportButtonClick: function () {
        this.selection == this.ytImportPlaylistsView ? (Dialog.confirm(Lang.dialog.importPlaylists, Lang.dialog.importPlaylistsMessage, $.proxy(Models.youtubePlaylist.import, Models.youtubePlaylist)), _gaq.push(["_trackEvent", "Actions",
            "Import", "YouTube : All Playlists", Models.user.data.id])) : this.selection == this.importMediaView ? this.importMediaView.ytp.name ? (Dialog.confirm(Lang.dialog.importPlaylist, Lang.dialog.importPlaylistMessage.split("%PLAYLIST%").join(this.importMediaView.ytp.name), $.proxy(Models.youtubePlaylistMedia.import, Models.youtubePlaylistMedia)), _gaq.push(["_trackEvent", "Actions", "Import", "YouTube : Single Playlist", Models.user.data.id])) : this.importMediaView.ytp.title && (Dialog.confirm(Lang.dialog.importSet, Lang.dialog.importPlaylistMessage.split("%PLAYLIST%").join(this.importMediaView.ytp.title),
        $.proxy(Models.soundcloudPlaylist.importSelected, Models.soundcloudPlaylist)), _gaq.push(["_trackEvent", "Actions", "Import", "SoundCloud : Single Set", Models.user.data.id])) : this.selection == this.scImportPlaylistsView && (Dialog.confirm(Lang.dialog.importSets, Lang.dialog.importSetsMessage, $.proxy(Models.soundcloudPlaylist.import, Models.soundcloudPlaylist)), _gaq.push(["_trackEvent", "Actions", "Import", "SoundCloud : All Sets", Models.user.data.id]))
    },
    onSoundCloudImport: function (a) {
        this.baseList = this.selection = this.currentListView = this.searchView;
        this.history = [];
        this.menuSelect(null);
        this.showLoadProgress();
        "favorites" == a ? this.setPanelTitle("SoundCloud Favorites", "soundcloud-icon-white", 0, !1) : "tracks" == a && this.setPanelTitle("SoundCloud Tracks", "soundcloud-icon-white", 0, !1);
        null == this.baseList && (this.baseList = this.searchView)
    },
    onSoundCloudSetsImport: function () {
        this.baseList = this.selection = this.currentListView = this.scImportPlaylistsView;
        this.history = [];
        this.menuSelect(null);
        $("#media-panel-count").show();
        $("#media-panel-pagination").hide();
        this.showLoadProgress();
        this.setPanelTitle("SoundCloud Sets", "soundcloud-icon-white", 0, !1);
        $("#playlist-import-button-label").text(Lang.dialog.importSets);
        $("#playlist-import-button").width(75).show()
    },
    onSoundCloudSetSelect: function (a) {
        this.selection = this.currentListView = this.importMediaView;
        this.importMediaView.ytp = a;
        this.history = [];
        this.menuSelect(null);
        this.setPanelTitle(a.title, "soundcloud-icon-white", 0, !0);
        $("#playlist-import-button-label").text(Lang.alerts.import);
        $("#playlist-import-button").width(74).show();
        this.importMediaView.setData(a.tracks)
    },
    onFilter: function (a) {
        this.currentListView == this.playlistMediaView ? Models.playlistMedia(this.selection).load(a) : this.currentListView == this.historyListView && Models.history.filter(a)
    },
    onSearchLocal: function (a) {
        this.currentListView != this.searchPlaylistsView && (this.baseList = this.selection = this.currentListView = this.searchPlaylistsView, this.history = [], this.menuSelect(null), Search.searchInput.value = a, 0 == a.length ? $("#button-clear-search").hide() : $("#button-clear-search").show());
        var b = [];
        0 < a.length && (b = LS.read.search.load(a));
        this.setPanelTitle(a, "search-icon-white", b.length);
        this.searchPlaylistsView.selectedCells = {};
        this.searchPlaylistsView.setData(b)
    },
    onLocalPlayNext: function (a) {
        var b = Models.room.userIsPlaying && a.playlist.id == Models.room.data.playlistID;
        Models.playlist.selectedPlaylistID != a.playlist.id && Models.playlist.facade.activate(a.playlist.id);
        Models.playlistMedia(a.playlist.id).mediaMoveToTop([a], b);
        setTimeout(function () {
            MediaOverlay.showPlaylist(a.playlist.id,
            a.id)
        }, 100);
        this.searchPlaylistsView.selectedCells = {};
        this.searchPlaylistsView.setData([]);
        _gaq.push(["_trackEvent", "Actions", "Search Playlists", "Play Next"])
    },
    setPanelTitle: function (a, b, c, d) {
        var e = 0;
        $("#playlist-import-button").hide();
        d && null != this.baseList ? (e = this.panelTitleOffset, $("#related-back-button").show()) : $("#related-back-button").hide();
        $("#media-panel-icon").html("");
        var f = 600;
        b ? d && null != this.baseList ? ($("#media-panel-title").css("left", 10 + e), $("#media-panel-icon").css("left", 5 + e), f -= 55) : ($("#media-panel-icon").html('<div class="' + b + '"></div>'), $("#media-panel-icon").css("left", 5), $("#media-panel-title").css("left", 35), f -= 15) : $("#media-panel-title").css("left", 10 + e);
        void 0 != c ? $("#media-panel-count").text(c) : $("#media-panel-count").text("");
        $("#playlist-actions").hide();
        $("#playlist-filter").hide();
        $("#media-panel-title").width(f);
        $("#media-panel-count").css("right", 20);
        this.updateTitle(a)
    },
    updateTitle: function (a) {
        var b = $("#media-panel-title span");
        if (a) {
            b.text(a);
            var a = 19,
                c = $("#media-panel-title").width() - 3,
                d = $("#media-panel-title").height(),
                e = 0,
                f = 0;
            do b.css("font-size", a), e = b.width(), f = b.height(), a -= 1;
            while ((f > d || e > c) && 10 < a);
            b = Math.floor((47 - a) / 2) - 1;
            Main.isMac && $.browser.mozilla && (b += 2);
            $("#media-panel-title").css("top", b)
        } else b.text("")
    },
    showLoadProgress: function () {
        this.hideLoadProgress();
        this.loadProgress = (new Spinner({
            lines: 12,
            length: 0,
            width: 6,
            radius: 20,
            color: "#fff"
        })).spin();
        $("#media-panel")[0].appendChild(this.loadProgress.el);
        $(this.loadProgress.el).css("position", "absolute").css("left", 388).css("top",
        300).css("z-index", 9999)
    },
    hideLoadProgress: function () {
        this.loadProgress && (this.loadProgress.stop(), this.loadProgress = null)
    },
    showPlaylistCreateProgress: function () {
        this.hidePlaylistCreateProgress();
        this.createPlaylistProgress = (new Spinner({
            lines: 8,
            length: 0,
            width: 3,
            radius: 4,
            color: "#fff"
        })).spin();
        $("#media-menu-playlists")[0].appendChild(this.createPlaylistProgress.el);
        $(this.createPlaylistProgress.el).css("position", "absolute").css("right", 96).css("top", 24)
    },
    hidePlaylistCreateProgress: function () {
        this.createPlaylistProgress && (this.createPlaylistProgress.stop(), this.createPlaylistProgress = null)
    },
    showPlaylistProgress: function (a) {
        var b;
        $("#media-menu-playlist-container li").each(function () {
            $(this).data("playlist").id == a && (b = this)
        });
        b && (this.hidePlaylistProgress(), this.playlistProgress = {
            target: b,
            spinner: (new Spinner({
                lines: 8,
                length: 0,
                width: 3,
                radius: 4,
                color: "#fff"
            })).spin()
        }, b.appendChild(this.playlistProgress.spinner.el), $(this.playlistProgress.spinner.el).css("left", 21).css("top", 20), $(b).find(".menu-playlist-item-activate-button").hide())
    },
    hidePlaylistProgress: function () {
        if (this.playlistProgress) {
            this.playlistProgress.spinner.stop();
            var a = $(this.playlistProgress.target).data("playlist");
            a && (a.id == Models.playlist.selectedPlaylistID || a.id == this.playlistOver) && $(this.playlistProgress.target).find(".menu-playlist-item-activate-button").show()
        }
        this.playlistProgress = null
    },
    showRoomProgress: function () {
        this.hideRoomProgress();
        $("#nobody-playing").hide();
        $("#media-overlay").hide();
        $("#avatar-overlay").hide();
        $("#lobby-overlay").hide();
        UserListOverlay.hide();
        $("#overlay-container").show();
        this.roomProgress = (new Spinner({
            lines: 16,
            length: 0,
            width: 5,
            radius: 40,
            color: "#fff"
        })).spin();
        $("#overlay-container")[0].appendChild(this.roomProgress.el);
        $(this.roomProgress.el).css("position", "absolute").css("left", Main.LEFT + 600).css("top", 146);
        this.roomProgressMessage || (this.roomProgressMessage = $("<span/>").addClass("room-progress-message").html(Lang.room.joiningRoom));
        this.positionRoomProgress()
    },
    positionRoomProgress: function () {
        var a = Main.isMac && $.browser.mozilla ? 132 : 130;
        $("#overlay-container").append(this.roomProgressMessage.css("left", Main.LEFT + 571).css("top", a))
    },
    hideRoomProgress: function () {
        this.roomProgress && (this.roomProgress.stop(), this.roomProgress = null, this.roomProgressMessage.remove(), this.roomProgressMessage = null);
        $("#overlay-container").hide()
    },
    onDocumentKeyDown: function (a) {
        if (!Dialog.isOpen && "BODY" == $(document.activeElement)[0].nodeName) if (17 == a.keyCode || Main.isMac && (91 == a.keyCode || 93 == a.keyCode || 224 == a.keyCode)) this.ctrlDown = !0;
        else {
            if (this.ctrlDown && 65 == a.keyCode) return a.preventDefault(), this.currentListView.selectAll(), _gaq.push(["_trackEvent", "Actions", "Key", "Select All"]), !1;
            if (!this.ctrlDown && (8 == a.keyCode || 46 == a.keyCode)) {
                if (this.currentListView == this.playlistMediaView) {
                    var b = this.currentListView.getSelectedCells();
                    0 < b.length && (Models.room.userInBooth && Models.playlist.selectedPlaylistID == this.selection && Models.playlist.getSelected().items.length == b.length ? Dialog.alert(Lang.alerts.deleteLastItem) : (Dialog.deleteMedia(b, this.selection), _gaq.push(["_trackEvent",
                        "Actions", "Key", "Delete"])))
                }
                a.preventDefault();
                return !1
            }
        }
        return !0
    },
    onDocumentKeyUp: function (a) {
        if (17 == a.keyCode || Main.isMac && (91 == a.keyCode || 93 == a.keyCode || 224 == a.keyCode)) this.ctrlDown = !1;
        else if (!this.ctrlDown && (8 == a.keyCode || 46 == a.keyCode)) return a.preventDefault(), !1;
        return !0
    }
}),
    PlaybackView = Class.extend({
        init: function () {
            this.player = null;
            this.lastVolume = this.volume = 50;
            this.elapsed = this.duration = 0;
            this.buffering = this.isMuted = !1;
            this.fadeVolumeIntervalID = this.timeUpdateIntervalID = this.bufferPerc = 0;
            this.ignoreComplete = this.durationChecked = !1;
            this.yto = null;
            this.scTries = 0;
            this.refreshButton = $("#button-refresh");
            this.hdOnButton = $("#button-hd-on");
            this.hdOffButton = $("#button-hd-off");
            this.syncSwf = "http://plug.dj/_/static/swf/syncing.1c67b8fd.swf";
            $("#button-sound").click($.proxy(this.onSoundButtonClick, this));
            this.refreshButton.click($.proxy(this.onRefreshClick, this));
            this.hdOnButton.click($.proxy(this.onHDOnClick, this));
            this.hdOffButton.click($.proxy(this.onHDOffClick, this));
            $("#playback").mouseenter($.proxy(this.onPlaybackEnter,
            this)).mouseleave($.proxy(this.onPlaybackLeave, this))
        },
        ready: function () {
            this.lastVolume = this.volume = DB.settings.volume;
            $(function () {
                $("#slider").slider({
                    orientation: "horizontal",
                    value: Playback.volume,
                    range: "min",
                    animate: !1,
                    start: function () {
                        Playback.onVolumeSliderStart()
                    },
                    slide: function (a, b) {
                        Playback.onVolumeSliderUpdate(b.value)
                    },
                    stop: function () {
                        Playback.onVolumeSliderStop()
                    }
                })
            });
            setTimeout(function () {
                $("#slider").slider("value", Playback.volume)
            }, 1);
            this.setVolume(this.volume)
        },
        initSC: function () {
            this.SCClientID =
                "bd7fb07288b526f6f190bfd02b31b25e";
            this.SCRedirect = "http://plug.dj/sccallback.html";
            if (SC) try {
                SC.initialize({
                    client_id: this.SCClientID,
                    redirect_uri: this.SCRedirect
                })
            } catch (a) {} else 10 > this.scTries++ && setTimeout($.proxy(Playback.initSC, this), 250)
        },
        onVolumeSliderStart: function () {
            $("#playback-block").show()
        },
        onVolumeSliderUpdate: function (a) {
            Playback.setVolume(a);
            DB.settings.volume = a
        },
        onVolumeSliderStop: function () {
            DB.saveSettings();
            $("#playback-block").hide()
        },
        onPopupVolumeUpdate: function (a) {
            Playback.onVolumeSliderUpdate(a);
            $("#slider").slider("value", Playback.volume)
        },
        play: function (a, b, c) {
            this.reset();
            this.media = a;
            this.mediaStartTime = b;
            if (this.media) {
                $("#nobody-playing").hide();
                c || (this.duration = this.media.duration);
                if (!DB.settings.streamDisabled) {
                    this.ignoreComplete = !0;
                    setTimeout($.proxy(this.resetIgnoreComplete, this), 1E3);
                    this.elapsed = Utils.getSecondsElapsed(b);
                    var d = 4 > this.elapsed ? 0 : this.elapsed,
                        a = {
                            quality: "high",
                            wmode: "opaque",
                            allowScriptAccess: "always",
                            allowFullScreen: "false",
                            bgcolor: "#000000"
                        };
                    if (1 == this.media.format) this.buffering = !1, this.yto = {
                        id: this.media.cid,
                        volume: this.volume,
                        seek: d,
                        quality: DB.settings.hdVideo ? "hd720" : ""
                    }, a = isiOS ? "pdjytiOS2" : DB.settings.yt5 || isAndroid ? "pdjyt5" : "pdjytf", -1 < window.location.href.indexOf("pepper.plug.dj") ? a += "pepper" : -1 < window.location.href.indexOf("http://localhost") && (a += "local"), a = $('<iframe id="yt-frame" frameborder="0" src="http://pdj-youtube.appspot.com/' + a + '.html"></iframe>'), a.load($.proxy(this.onYTFrameLoaded, this)), $("#playback-container").append(a);
                    else if (2 == this.media.format) if (this.durationChecked = !0, SC) {
                        $("#playback-container").append($("<div/>").attr("id", "scplayer"));
                        swfobject.embedSWF("http://plug.dj/_/static/swf/line.f8a8c437.swf", "scplayer", "484", "271", "10", null, null, a, {
                            id: "scplayer"
                        });
                        var e = this;
                        SC.whenStreamingReady(function () {
                            if (e.media) {
                                var a = SC.stream(e.media.cid, {
                                    autoPlay: true,
                                    volume: e.volume,
                                    position: d * 1E3,
                                    whileloading: $.proxy(e.onSCLoading, e),
                                    onfinish: $.proxy(e.playbackComplete, e),
                                    ontimeout: $.proxy(e.onSCTimeout, e)
                                });
                                e.player = a
                            }
                        })
                    } else $("#playback-container").append($('<img src="http://soundcloud-support.s3.amazonaws.com/images/downtime.png" height="271"/>').css("position",
                        "absolute").css("left", 46))
                }
                this.timeUpdateIntervalID = setInterval($.proxy(this.updateTimeRemaining, this), 500)
            } else this.duration = 0, $("#nobody-playing").show()
        },
        durationUpdate: function (a, b) {
            this.media && (this.media.cid == a && (this.media.duration = b), this.duration = b)
        },
        reset: function () {
            this.stop();
            clearInterval(this.timeUpdateIntervalID);
            $("#time-remaining-value").text("");
            if (Popout && Popout.Meta) Popout.Meta.onTimeUpdate("");
            this.player = this.media = null;
            this.durationChecked = !1;
            WML.ytDuration = 0;
            this.yto = WML.ytSource = null;
            this.refreshButton.hide();
            this.hdOffButton.hide();
            this.hdOnButton.hide();
            Dialog.restrictedOpen && Dialog.closeDialog()
        },
        resetIgnoreComplete: function () {
            this.ignoreComplete = !1
        },
        stop: function () {
            if (this.media && 2 == this.media.format && this.player) try {
                this.player.destruct()
            } catch (a) {}
            this.buffering = !1;
            $("#playback-container").html("")
        },
        onPlaybackEnter: function () {
            this.media && (this.refreshButton.show(), 1 == this.media.format && (DB.settings.hdVideo ? this.hdOnButton.show() : this.hdOffButton.show()))
        },
        onPlaybackLeave: function () {
            this.media && (this.refreshButton.hide(), this.hdOffButton.hide(), this.hdOnButton.hide())
        },
        onRefreshClick: function () {
            this.media && (this.play(this.media, this.mediaStartTime), _gaq.push(["_trackEvent", "Actions", "Playback Refresh", Playback.media.cid]))
        },
        onHDOnClick: function () {
            this.setHD(!1);
            this.hdOnButton.hide();
            this.hdOffButton.show()
        },
        onHDOffClick: function () {
            this.setHD(!0);
            this.hdOnButton.show();
            this.hdOffButton.hide()
        },
        setHD: function (a) {
            a ? (DB.settings.hdVideo = !0, this.media && "1" == this.media.format && WML.ytx("setPlaybackQuality=hd720"),
            DB.saveSettings(), Models.chat.receive({
                type: "update",
                message: Lang.messages.hdOn
            })) : (DB.settings.hdVideo = !1, this.media && "1" == this.media.format && WML.ytx("setPlaybackQuality=medium"), DB.saveSettings(), Models.chat.receive({
                type: "update",
                message: Lang.messages.hdOff
            }))
        },
        onSCLoading: function () {
            var a = ~~ (this.player.duration / 1E3);
            a >= this.elapsed ? (this.buffering = !1, this.bufferPerc = 0) : (this.buffering = !0, this.bufferPerc = ~~ (100 * (a / this.elapsed)));
            this.updateTimeRemaining()
        },
        onSCTimeout: function (a) {
            console.log("SCTimeout :: " + a.success + ", error type = " + a.error.type)
        },
        playbackComplete: function () {
            this.ignoreComplete || (this.stop(), $("#playback-container").append($("<div/>").attr("id", "syncing")), swfobject.embedSWF(this.syncSwf, "syncing", "484", "271", "10", null, null, {
                quality: "high",
                wmode: "opaque",
                allowScriptAccess: "always",
                allowFullScreen: "false",
                bgcolor: "#000000"
            }, {
                id: "syncing"
            }))
        },
        setPlayer: function (a) {
            this.player = a;
            this.setVolume(this.volume)
        },
        updateTimeRemaining: function () {
            this.elapsed = Utils.getSecondsElapsed(this.mediaStartTime);
            var a = this.duration - this.elapsed,
                b;
            0 > a ? (a = 0, $("#time-remaining-value").text("").css("color", "#FFF"), $("#playback-buffering").text("").hide(), clearInterval(this.timeUpdateIntervalID)) : (b = Utils.formatTime(a, !0), $("#time-remaining-value").text(b).css("color", 5 < a ? "#FFF" : "#C00"), this.buffering ? (b = Lang.room.buffering + this.bufferPerc + "%", $("#playback-buffering").text(b).show()) : $("#playback-buffering").text("").hide());
            RoomUser.updateVoteButtons();
            Popout && Popout.Meta && (Popout.Meta.onTimeUpdate(b), Popout.Meta.updateVoteButtons());
            MediaOverlay.onUpdateTimeRemaining(a);
            Models.room.userIsPlaying && !this.durationChecked && this.media && this.media.cid == Models.room.data.media.cid && "1" == this.media.format && this.player && WML.ytx("durationCheck")
        },
        durationCheck: function (a) {
            var b = 0;
            try {
                b = a, 0 < b && (WML.ytDuration = b, this.durationChecked = !0)
            } catch (c) {
                this.durationChecked = !1
            }
            this.durationChecked && b != this.duration && new DurationMismatchService
        },
        setVolume: function (a) {
            this.volume = a;
            try {
                "2" == this.media.format && this.player ? this.player.setVolume(a) : WML.ytx("setVolume=" + a)
            } catch (b) {}
            0 == this.volume && !this.isMuted && (this.isMuted = !0, $("#button-sound").css("background-image", "url(http://plug.dj/_/static/images/ButtonSoundOff.c40cf284.png)"));
            0 < this.volume && this.isMuted && (this.isMuted = !1, $("#button-sound").css("background-image", "url(http://plug.dj/_/static/images/ButtonSoundOn.25ddac79.png)"));
            $("#volume-bar-value").width(83 * (this.volume / 100));
            Popout && Popout.Meta && Popout.Meta.setVolume(this.volume, this.isMuted)
        },
        onSoundButtonClick: function () {
            this.isMuted ? (this.setVolume(this.lastVolume),
            $("#slider").slider("value", this.lastVolume), _gaq.push(["_trackEvent", "Actions", "Video Unmuted", this.lastVolume])) : (this.lastVolume = this.volume, this.setVolume(0), $("#slider").slider("value", 0), _gaq.push(["_trackEvent", "Actions", "Video Muted"]))
        },
        onYTPlayerError: function (a) {
            if ("100" == a || "101" == a || "150" == a || "2" == a) Dialog.restrictedMedia(this.media), _gaq.push(["_trackEvent", "Playback", "YouTube Error : " + a, Playback.media.cid])
        },
        previewMute: function (a) {
            clearInterval(this.fadeVolumeIntervalID);
            a && !this.isMuted ? (this.lastVolume = this.volume, a = 1E3 * (0.15 / this.volume), this.fadeVolumeIntervalID = setInterval($.proxy(this.fadeToMute, this), a)) : !a && this.isMuted && (a = 1E3 * (0.15 / this.lastVolume), this.fadeVolumeIntervalID = setInterval($.proxy(this.fadeFromMute, this), a))
        },
        fadeToMute: function () {
            0 == this.volume ? clearInterval(this.fadeVolumeIntervalID) : this.setVolume(Math.max(0, this.volume - 1));
            $("#slider").slider("value", this.volume)
        },
        fadeFromMute: function () {
            this.volume == this.lastVolume ? clearInterval(this.fadeVolumeIntervalID) : this.setVolume(Math.min(this.lastVolume, this.volume + 1));
            $("#slider").slider("value", this.volume)
        },
        onYTFrameLoaded: function () {
            this.yto && document.getElementById("yt-frame").contentWindow.postMessage(JSON.stringify(this.yto), "http://pdj-youtube.appspot.com")
        }
    }),
    MediaListView = Class.extend({
        init: function () {
            this.baseSelectedCellIndex = 1;
            this.selectedCells = {};
            this.selectedCellIndex = 0;
            this.noModifier = this.lockFirstItem = !1;
            this.lastClickedIndex = 0;
            this.lastClickedCell = null;
            this.doubleClickTime = 0;
            this.doubleClickThreshold = 500;
            this.doubleClickCellData = null;
            this.pressMouseY = this.pressMouseX = 0;
            this.withinBounds = this.isDragging = !1;
            this.targetDropIndex = 0;
            this.currentDragCell = null;
            this.playlistID = this.mouseY = this.mouseX = this.dragIntervalID = 0;
            this.DRAG_THRESHOLD = 5;
            this.documentReleaseProxy = $.proxy(this.onDocumentRelease, this);
            this.thresholdProxy = $.proxy(this.onCheckThreshold, this);
            this.mousePositionProxy = $.proxy(this.onMousePosition, this);
            this.dragRowLine = $("<div/>").addClass("drag-row-line");
            this.dragRowLine.hide();
            this.dragIcon = $("<div/>").addClass("drag-media-icon").append($("<span/>").addClass("drag-media-label"));
            this.dragIcon.hide();
            this.data = []
        },
        setData: function (a) {
            this.data = a;
            for (var a = this.data.length, b = 0; b < a; ++b) this.data[b].idx = b;
            MediaOverlay.hideLoadProgress();
            this.draw()
        },
        draw: function () {
            var a = this.getList(),
                b, c = this.data.length;
            for (b = 0; b < c; ++b) this.data[b] && a.append(this.getRow(this.data[b], b));
            for (b = 0; b < c; ++b) if (this.data[b] && this.selectedCells[this.data[b].cid]) {
                this.baseSelectedCellIndex = b;
                break
            }
            $("#media-panel .media-list");
            $("#media-panel .media-list").html(a);
            $("#media-panel-count").text(c);
            Main.isMac && $.browser.mozilla && $("#media-panel .media-list .meta").css("top", 9);
            this.update()
        },
        update: function () {
            var a = this;
            $("#media-panel .media-list li").each(function () {
                var b = $(this),
                    c = b.data("index");
                a.selectedCells[a.data[c].cid] ? (b.data("selected", !0), 0 == c % 2 ? (b.addClass("selected-alternate-cell"), b.removeClass("alternate-cell")) : b.addClass("selected-cell")) : (b.removeClass("selected-cell"), b.data("selected", !1), 0 == c % 2 ? (b.addClass("alternate-cell"),
                b.removeClass("selected-alternate-cell")) : b.removeClass("alternate-cell"));
                if (a.playlistID && a.data && 0 < a.data.length) {
                    var d = !1;
                    a.lockFirstItem ? 2 == a.firstMedia.length && a.data[c].id != a.firstMedia[0] && a.data[c].id != a.firstMedia[1] && (d = !0) : a.data[c].id != a.firstMedia[0] && (d = !0);
                    if (!d && (d = b.find(".move-to-top"))) d.hide(), b.removeClass("playlist-media-item").addClass("playlist-media-first-item");
                    0 == c && a.lockFirstItem && Models.room.data.media && a.data[c].cid == Models.room.data.media.cid ? (b.addClass("now-playing").css("cursor",
                        "default"), (c = b.find(".delete")) && c.hide(), a.nowPlayingCell = b.find(".duration")) : b.removeClass("now-playing").css("cursor", "move")
                }
            })
        },
        getList: function () {},
        getRow: function () {},
        onCellPress: function (a) {
            $("*:focus")[0] && "INPUT" == $("*:focus")[0].nodeName && $("*:focus")[0].blur();
            Search.hideSuggestions();
            a.preventDefault();
            a.stopImmediatePropagation();
            Main.isMac && (a.ctrlKey = a.metaKey);
            var b = !1,
                c = $(a.currentTarget),
                d = c.data("index"),
                e = this.data[d],
                f = c.data("selected");
            if (!this.lockFirstItem || 0 < d || this.data[0].cid != Models.room.data.media.cid) {
                this.noModifier = !1;
                this.lastClickedIndex = d;
                if (!a.shiftKey && !a.ctrlKey) - 1 == this.baseSelectedCellIndex || !f ? this.selectSingleCell(c) : this.noModifier = !0, (new Date).getTime() - this.doubleClickTime < this.doubleClickThreshold && e == this.doubleClickCellData && (b = !0, this.doubleClickCell(c)), this.doubleClickTime = (new Date).getTime(), this.doubleClickCellData = e;
                else if (a.ctrlKey && !a.shiftKey) this.baseSelectedCellIndex = d, this.toggleCell(c);
                else if (a.shiftKey && !a.ctrlKey) - 1 == this.baseSelectedCellIndex ? (this.baseSelectedCellIndex = d, this.toggleCell(c)) : this.baseSelectedCellIndex > d ? this.selectMultipleCells(this.baseSelectedCellIndex, d) : this.baseSelectedCellIndex < d && this.selectMultipleCells(d, this.baseSelectedCellIndex);
                else if (a.ctrlKey && a.shiftKey) {
                    var g;
                    if (-1 == this.baseSelectedCellIndex) this.selectSingleCell(c);
                    else if (d > this.baseSelectedCellIndex) if (this.selectedCells[this.data[this.baseSelectedCellIndex].cid]) this.selectMultipleCells(d, this.baseSelectedCellIndex);
                    else {
                        e = this.data.length;
                        for (c = 0; c < e; ++c) if (this.selectedCells[this.data[c].cid]) {
                            g = c;
                            break
                        }
                        this.selectMultipleCells(d, g)
                    } else if (d < this.baseSelectedCellIndex) if (this.selectedCells[this.data[this.baseSelectedCellIndex].cid]) this.selectMultipleCells(this.baseSelectedCellIndex, d);
                    else {
                        for (c = this.data.length; c--;) if (this.selectedCells[this.data[c].cid]) {
                            g = c;
                            break
                        }
                        this.selectMultipleCells(g, d)
                    }
                    this.baseSelectedCellIndex = d
                }!b && -1 < this.baseSelectedCellIndex && (this.pressMouseX = a.pageX, this.pressMouseY = a.pageY, $(document).mousemove(this.thresholdProxy),
                $(document).mouseup(this.documentReleaseProxy))
            }
        },
        onCellRelease: function (a) {
            if (!this.isDragging) {
                if (-1 < this.baseSelectedCellIndex && this.noModifier) {
                    var a = $(a.currentTarget),
                        b = a.data("index");
                    (!this.lockFirstItem || 0 < b) && this.selectSingleCell(a)
                }
                $(document).unbind("mousemove", this.thresholdProxy)
            }
            this.resetDrag()
        },
        onDocumentRelease: function () {
            this.resetDrag()
        },
        doubleClickCell: function (a) {
            $(document).unbind("mousemove", this.thresholdProxy);
            this.resetDrag();
            this.lastClickedCell = a;
            Playback.previewMute(!0);
            setTimeout($.proxy(this.onPreviewItem, this), 200)
        },
        onPreviewItem: function () {
            Dialog.preview(this.doubleClickCellData)
        },
        onCheckThreshold: function (a) {
            if (a.pageX > this.pressMouseX + this.DRAG_THRESHOLD || a.pageX < this.pressMouseX - this.DRAG_THRESHOLD || a.pageY > this.pressMouseY + this.DRAG_THRESHOLD || a.pageY < this.pressMouseY - this.DRAG_THRESHOLD) this.isDragging = !0, $(document).unbind("mousemove", this.thresholdProxy), this.dragIcon.find(".drag-media-label").text(this.getSelectedCells().length), $("#overlay-container").append(this.dragIcon),
            $(document).mousemove(this.mousePositionProxy), clearInterval(this.dragIntervalID), this.dragIntervalID = setInterval($.proxy(this.onDragUpdate, this), 20), this.onMousePosition(a), this.onDragUpdate(null), this.dragIcon.show(), this.startDrag()
        },
        selectSingleCell: function (a) {
            this.selectedCells = {};
            this.update();
            this.toggleCell(a);
            this.lastClickedCell = a;
            var b = a.data("selected"),
                a = a.data("index");
            this.baseSelectedCellIndex = b ? a : -1;
            this.selectedCellIndex = -1 == this.baseSelectedCellIndex ? 0 : this.baseSelectedCellIndex
        },
        selectMultipleCells: function (a, b) {
            for (var c = a; c >= b; c--) this.selectedCells[this.data[c].cid] = this.data[c];
            this.update()
        },
        selectAll: function () {
            this.selectMultipleCells(this.data.length - 1, 0)
        },
        selectNone: function () {
            this.selectedCells = {};
            this.selectedCellIndex = 0
        },
        toggleCell: function (a) {
            var b = a.data("selected"),
                c = a.data("index");
            b ? (a.data("selected", !1), a.removeClass("selected-cell"), 0 == c % 2 ? (a.addClass("alternate-cell"), a.removeClass("selected-alternate-cell")) : a.removeClass("alternate-cell"), delete this.selectedCells[this.data[c].cid]) : (a.data("selected", !0), 0 == c % 2 ? (a.addClass("selected-alternate-cell"), a.removeClass("alternate-cell")) : a.addClass("selected-cell"), this.selectedCells[this.data[c].cid] = this.data[c])
        },
        getSelectedCells: function () {
            var a = [],
                b;
            for (b in this.selectedCells) a.push(this.selectedCells[b]);
            a.sort(this.sortSelectedCells);
            return a
        },
        sortSelectedCells: function (a, b) {
            return a.idx < b.idx ? -1 : a.idx > b.idx ? 1 : 0
        },
        resetDrag: function () {
            this.isDragging = !1;
            $(document).unbind("mouseup", this.documentReleaseProxy);
            $(document).unbind("mousemove",
            this.mousePositionProxy);
            clearInterval(this.dragIntervalID);
            this.dragRowLine.remove();
            this.dragIcon.remove()
        },
        onCellOver: function (a) {
            PopMenu.hide();
            $("body").find(".actions").hide();
            this.isDragging || $("body").find(a.currentTarget).find(".actions").show();
            this.currentDragCell = $("body").find(a.currentTarget)
        },
        startDrag: function () {},
        jumpToIndex: function (a) {
            $("#media-panel .media-list").scrollTop(47 * a)
        },
        onMousePosition: function (a) {
            this.mouseX = a.pageX;
            this.mouseY = a.pageY
        },
        onDragUpdate: function () {
            this.dragIcon.css("left",
            this.mouseX + 1);
            this.dragIcon.css("top", this.mouseY + 1);
            this.onCheckListScroll($("#media-panel .media-list"));
            if (!this.withinBounds) {
                var a = $("#media-menu-playlist-container"),
                    b = a.scrollTop(),
                    c = a.offset().top - 48,
                    d = a.offset().left,
                    e = d + a.width(),
                    f = a.height();
                this.mouseX >= d && this.mouseX <= e && (this.mouseY < c ? (c = (c - this.mouseY) / 2, b = Math.max(0, b - c), a.scrollTop(b)) : this.mouseY > c + f && (c = (this.mouseY - (c + f)) / 2, b = Math.min(b + c, a[0].scrollHeight - f), a.scrollTop(b)))
            }
        },
        onCheckListScroll: function (a) {
            var b = a.offset().top,
                c = a.offset().left,
                d = c + a.width(),
                e = a.scrollTop(),
                f = a.height();
            if (this.mouseX >= c && this.mouseX <= d) {
                this.withinBounds = !0;
                if (this.mouseY < b) return b = (b - this.mouseY) / 1.25, e = Math.max(0, e - b), a.scrollTop(e), e;
                if (this.mouseY > b + f) return b = (this.mouseY - (b + f)) / 1.25, e = Math.min(e + b, a[0].scrollHeight - f), a.scrollTop(e), e + a.height() - 2
            } else this.withinBounds = !1;
            return -10
        },
        onCellOut: function (a) {
            $("body").find(a.currentTarget).find(".actions").hide()
        },
        onEditClick: function (a) {
            a.stopImmediatePropagation();
            Search.hideSuggestions();
            a = this.data[$("body").find(a.target).data("index")];
            Dialog.editMedia(a, this.playlistID)
        },
        onMoveToTopClick: function (a) {
            a.stopImmediatePropagation();
            Search.hideSuggestions();
            if (this.playlistID) {
                var a = this.data[$("body").find(a.target).data("index")],
                    b = this.getSelectedCells();
                if (0 < b.length) {
                    for (var c = b.length, d = !1; c--;) if (b[c].id == a.id) {
                        d = !0;
                        break
                    }
                    d ? (Models.playlistMedia(this.playlistID).mediaMoveToTop(b, this.lockFirstItem), _gaq.push(["_trackEvent", "Playlist", "Move To Top : Multiple", "Within Selection",
                    b.length])) : (Models.playlistMedia(this.playlistID).mediaMoveToTop([a], this.lockFirstItem), _gaq.push(["_trackEvent", "Playlist", "Move To Top : Multiple", "Outside Selection", b.length]))
                } else Models.playlistMedia(this.playlistID).mediaMoveToTop([a], this.lockFirstItem), _gaq.push(["_trackEvent", "Playlist", "Move To Top : Single"])
            }
        },
        onDeleteClick: function (a) {
            a.stopImmediatePropagation();
            Search.hideSuggestions();
            var b = $("body").find(a.target).data("index"),
                a = this.data[b],
                c = this.getSelectedCells();
            if (Models.room.userIsPlaying && Models.room.data.playlistID == this.playlistID && 0 == b && a.id == Models.room.data.media.id) Dialog.alert(Lang.alerts.deleteCurrentPlaylist);
            else if (Models.room.userInBooth && Models.playlist.selectedPlaylistID == this.playlistID && Models.playlist.getSelected().items.length == c.length) Dialog.alert(Lang.alerts.deleteLastItem);
            else if (0 < c.length) {
                for (var b = c.length, d = !1; b--;) if (c[b].id == a.id) {
                    d = !0;
                    break
                }
                d ? (Dialog.deleteMedia(c, this.playlistID), _gaq.push(["_trackEvent", "Playlist", "Delete Media : Multiple", "Within Selection",
                c.length])) : (Dialog.deleteMedia([a], this.playlistID), _gaq.push(["_trackEvent", "Playlist", "Delete Media : Multiple", "Outside Selection", c.length]))
            } else Dialog.deleteMedia([a], this.playlistID), _gaq.push(["_trackEvent", "Playlist", "Delete Media : Single"])
        },
        onAddClick: function (a) {
            a.stopImmediatePropagation();
            Search.hideSuggestions();
            var b = this.data[$("body").find(a.target).data("index")];
            if (Models.playlist.selectedPlaylistID) {
                var c = this.getSelectedCells();
                if (0 < c.length) {
                    for (var d = c.length, e = !1; d--;) if (c[d].id == b.id) {
                        e = !0;
                        break
                    }
                    e ? (PopMenu.show($("body").find(a.target), c), _gaq.push(["_trackEvent", this.isRoom ? "Room History" : "Search", "Add Media : Multiple", "Within Selection", c.length])) : (PopMenu.show($("body").find(a.target), [b]), _gaq.push(["_trackEvent", this.isRoom ? "Room History" : "Search", "Add Media : Multiple", "Outside Selection", c.length]))
                } else PopMenu.show($("body").find(a.target), [b]), _gaq.push(["_trackEvent", this.isRoom ? "Room History" : "Search", "Add Media - Single"])
            } else Dialog.createPlaylist([b]), _gaq.push(["_trackEvent",
            this.isRoom ? "Room History" : "Search", "Add Media - New Playlist"])
        },
        onRelatedClick: function (a) {
            a.stopImmediatePropagation();
            Search.hideSuggestions();
            var a = this.data[$("body").find(a.target).data("index")],
                b = $("#media-panel .media-list");
            b.html("");
            b.scrollTop(0);
            !a.format || 1 == a.format ? (MediaOverlay.onSearch(a.author + " - " + a.title, !0), Models.search.loadYTRelated(a), _gaq.push(["_trackEvent", this.playlistID ? "Playlist" : this.isRoom ? "Room History" : "Search", "Related : YouTube"])) : 2 == a.format && (MediaOverlay.onSearch(a.author, !0), Models.search.load(a.author, "2", 0), _gaq.push(["_trackEvent", this.playlistID ? "Playlist" : this.isRoom ? "Room History" : "Search", "Related : SoundCloud"]));
            PopMenu.hide()
        }
    }),
    PlaylistMediaListView = MediaListView.extend({
        setData: function (a, b) {
            this.nowPlayingCell = null;
            var c = -1;
            if (b) for (var d = a.length; d--;) if (a[d].id == b.id) {
                this.selectedCells[a[d].cid] = a[d];
                c = b.jump ? d : 0;
                break
            }
            this._super(a);
            var e = this; - 1 < c && setTimeout(function () {
                e.jumpToIndex(c)
            }, 250)
        },
        updateTimeRemaining: function (a) {
            this.nowPlayingCell && this.nowPlayingCell.text(Utils.formatTime(a, !1))
        },
        getList: function () {
            return $("<ul/>").addClass("playlist-media")
        },
        getRow: function (a, b) {
            var c = $("<div/>").addClass("thumbnail").append($("<img/>").attr("src", a.image)),
                d = $("<div/>").addClass("meta").append($("<span/>").addClass("author").text(a.author)).append($("<span/>").addClass("title").text(" - " + a.title)).append($("<span/>").addClass("duration").text(Utils.formatTime(a.duration, !1))),
                e = $("<div/>").addClass("actions").append($("<div/>").addClass("edit").attr("title",
                Lang.tooltips.editMedia).data("index", b).mousedown($.proxy(this.onEditClick, this))).append($("<div/>").addClass("related").attr("title", Lang.tooltips.similar).data("index", b).mousedown($.proxy(this.onRelatedClick, this))).append($("<div/>").addClass("move-to-top").attr("title", Lang.tooltips.moveToTop).data("index", b).mousedown($.proxy(this.onMoveToTopClick, this))).append($("<div/>").addClass("delete").attr("title", Lang.tooltips.deleteItem).data("index", b).mousedown($.proxy(this.onDeleteClick, this))),
                c = $("<li/>").addClass("playlist-media-item").attr("id", a.id).attr("title", Lang.tooltips.preview).data("index", b).data("selected", !1).mouseenter($.proxy(this.onCellOver, this)).mouseleave($.proxy(this.onCellOut, this)).mousedown($.proxy(this.onCellPress, this)).mouseup($.proxy(this.onCellRelease, this)).append(c).append(d).append(e);
            0 == b % 2 ? (c.addClass("alternate-cell"), c.removeClass("cell")) : (c.addClass("cell"), c.removeClass("alternate-cell"));
            return c
        },
        draw: function () {
            this._super();
            MediaOverlay.selection == Models.playlist.selectedPlaylistID ? $("#playlist-activate-button").css("background-image", "url(" + Lang.ui.buttonPlaylistActivated + ")").css("cursor", "default").attr("title", Lang.tooltips.playlistActive) : $("#playlist-activate-button").css("background-image", "url(" + Lang.ui.buttonPlaylistActivate + ")").css("cursor", "pointer").attr("title", Lang.tooltips.playlistActivate);
            $("#media-panel-count").css("right", 100);
            $("#playlist-actions").show();
            $("#playlist-filter").show()
        },
        startDrag: function (a) {
            this._super(a);
            $("#media-panel .media-list").append(this.dragRowLine);
            this.dragRowLine.show()
        },
        onDragUpdate: function (a) {
            this._super(a);
            var a = $("#media-panel .media-list"),
                b = a.offset().top,
                c = a.scrollTop();
            if (this.currentDragCell) {
                var d = 0,
                    e = this.currentDragCell.data("index");
                !this.lockFirstItem || 0 < e ? (this.targetDropIndex = e, d = this.currentDragCell.offset().top, this.mouseY >= d + this.currentDragCell.height() / 2 ? (d = d - b + c + this.currentDragCell.height(), this.targetDropIndex = e == this.lastClickedIndex - 1 ? this.lastClickedIndex : e + 1) : (d = d - b + c, this.targetDropIndex = e == this.lastClickedIndex + 1 ? this.lastClickedIndex : e), this.dragRowLine.css("top", d)) : 0 == e && (d = this.currentDragCell.offset().top - b + c + this.currentDragCell.height(), this.targetDropIndex = 1, this.dragRowLine.css("top", d))
            }
            a = this.onCheckListScroll(a);
            this.withinBounds ? (-10 < a && (!this.lockFirstItem || 0 < e) && this.dragRowLine.css("top", a), this.dragRowLine.show()) : this.dragRowLine.hide()
        },
        onCellRelease: function (a) {
            this.isDragging || this._super(a)
        },
        onDocumentRelease: function () {
            if (this.withinBounds) {
                var a = this.getSelectedCells();
                if (a && 0 < a.length) {
                    var b = this.getCellsAreSequential(a);
                    if (!b || b && this.targetOutsideRange(this.targetDropIndex, a[0].idx, a[a.length - 1].idx)) {
                        var c = this.beforeMediaID();
                        (!b || a[0].id != c) && Models.playlistMedia(this.playlistID).mediaMove(a, c)
                    }
                }
            }
            this.resetDrag()
        },
        beforeMediaID: function () {
            return this.targetDropIndex > this.data.length - 1 ? 0 : this.data[Math.max(!this.lockFirstItem ? 0 : 1, this.targetDropIndex)].id
        },
        getCellsAreSequential: function (a) {
            if (1 < a.length) for (var b = a.length, c = a[0].idx,
            d = 1; d < b; ++d) if (++c != a[d].idx) return !1;
            return !0
        },
        targetOutsideRange: function (a, b, c) {
            return a == c + 1 ? !1 : a < b || a > c
        }
    }),
    SearchMediaListView = MediaListView.extend({
        getList: function () {
            return $("<ul/>").addClass("search")
        },
        getRow: function (a, b) {
            var c = $("<div/>").addClass("thumbnail").append($("<img/>").attr("src", a.image)),
                d = $("<div/>").addClass("meta").append($("<span/>").addClass("author").text(a.author)).append($("<span/>").addClass("title").text(" - " + a.title)).append($("<span/>").addClass("duration").text(Utils.formatTime(a.duration, !1)));
            if (0 != a.id && LS.media.exists(a.id)) {
                for (var e = LS.getMediaPlaylists(a.cid), f = e.length, g = "", h = 0; h < f; ++h) g += '<a href="javascript:void(0)" onclick="' + ("MediaOverlay.showPlaylist('" + e[h].id + "', '" + a.id + "', '1')") + '">' + $("<span/>").text(e[h].name).html() + "</a>, ";
                d.append($("<span/>").addClass("playlists").html(g.substr(0, g.length - 2)))
            }
            e = $("<div/>").addClass("actions").append($("<div/>").addClass("add").attr("title", Lang.tooltips.addItem).data("index", b).mousedown($.proxy(this.onAddClick, this))).append($("<div/>").addClass("related").attr("title",
            Lang.tooltips.similar).data("index", b).mousedown($.proxy(this.onRelatedClick, this)));
            c = $("<li/>").addClass("playlist-media-item").data("index", b).data("selected", !1).attr("title", Lang.tooltips.preview).mouseenter($.proxy(this.onCellOver, this)).mouseleave($.proxy(this.onCellOut, this)).mousedown($.proxy(this.onCellPress, this)).mouseup($.proxy(this.onCellRelease, this)).append(c).append(d).append(e);
            0 == b % 2 ? (c.addClass("alternate-cell"), c.removeClass("cell")) : (c.addClass("cell"), c.removeClass("alternate-cell"));
            return c
        },
        onCellOut: function (a) {
            PopMenu.showing || $("body").find(a.currentTarget).find(".actions").hide()
        },
        draw: function () {
            this._super();
            $.browser.mozilla && (Main.isMac ? $(".media-list .playlists").css("background-position", "0 1px") : $(".media-list .playlists").css("background-position", "0 2px"))
        }
    }),
    SearchPlaylistsMediaListView = MediaListView.extend({
        getList: function () {
            return $("<ul/>").addClass("search-playlists")
        },
        getRow: function (a, b) {
            var c = $("<div/>").addClass("thumbnail").append($("<img/>").attr("src",
            a.image)),
                d = $("<div/>").addClass("meta").append($("<span/>").addClass("author").text(a.author)).append($("<span/>").addClass("title").text(" - " + a.title)).append($("<span/>").addClass("duration").text(Utils.formatTime(a.duration, !1))),
                e = "MediaOverlay.showPlaylist('" + a.playlist.id + "', '" + a.id + "', '1')";
            d.append($("<span/>").addClass("playlists").html('<a href="javascript:void(0)" onclick="' + e + '">' + $("<span/>").text(a.playlist.name).html() + "</a>"));
            e = $("<div/>").addClass("actions").append($("<div/>").addClass("play-next").attr("title",
            Lang.tooltips.playNext).data("index", b).mousedown($.proxy(this.onPlayNextClick, this)));
            c = $("<li/>").addClass("playlist-media-item").data("index", b).data("selected", !1).attr("title", Lang.tooltips.preview).mouseenter($.proxy(this.onCellOver, this)).mouseleave($.proxy(this.onCellOut, this)).mousedown($.proxy(this.onCellPress, this)).mouseup($.proxy(this.onCellRelease, this)).append(c).append(d).append(e);
            0 == b % 2 ? (c.addClass("alternate-cell"), c.removeClass("cell")) : (c.addClass("cell"), c.removeClass("alternate-cell"));
            return c
        },
        onPlayNextClick: function (a) {
            MediaOverlay.onLocalPlayNext(this.data[$("body").find(a.target).data("index")])
        },
        onCellOut: function (a) {
            PopMenu.showing || $("body").find(a.currentTarget).find(".actions").hide()
        },
        draw: function () {
            this._super();
            $.browser.mozilla && (Main.isMac ? $(".media-list .playlists").css("background-position", "0 1px") : $(".media-list .playlists").css("background-position", "0 2px"))
        }
    }),
    RestrictedSearchListView = MediaListView.extend({
        setData: function (a) {
            this.data = a;
            for (var a = this.data.length,
            b = 0; b < a; ++b) this.data[b].idx = b;
            this.draw()
        },
        draw: function () {
            var a = this.getList(),
                b, c = this.data.length;
            for (b = 0; b < c; ++b) this.data[b] && a.append(this.getRow(this.data[b], b));
            $("#dialog-restricted-media .media-list").html(a);
            $("#dialog-restricted-media .media-list").scrollTop(0);
            Main.isMac && $.browser.mozilla && $("#dialog-restricted-media .media-list .meta").css("top", 9)
        },
        getList: function () {
            return $('<ul class="restricted-search"/>')
        },
        getRow: function (a, b) {
            var c = "";
            0 != a.id && (c = LS.media.exists(a.id) ? "(O) " :
                "(P) ");
            var d = $("<div/>").addClass("thumbnail").append($("<img/>").attr("src", a.image)),
                c = $("<div/>").addClass("meta").append($("<span/>").addClass("author").text(c + a.author)).append($("<span/>").addClass("title").text(" - " + a.title)).append($("<span/>").addClass("duration").text(Utils.formatTime(a.duration, !1))),
                d = $("<li/>").addClass("restricted-search-media-item").data("index", b).mouseenter($.proxy(this.onCellOver, this)).mouseleave($.proxy(this.onCellOut, this)).mousedown($.proxy(this.onCellPress,
                this)).mouseup($.proxy(this.onCellRelease, this)).append(d).append(c);
            0 == b % 2 ? (d.addClass("alternate-cell"), d.removeClass("cell")) : (d.addClass("cell"), d.removeClass("alternate-cell"));
            return d
        },
        onCellPress: function (a) {
            a.preventDefault();
            a.stopImmediatePropagation()
        },
        onCellRelease: function (a) {
            a.preventDefault();
            a.stopImmediatePropagation();
            a = $(a.currentTarget).data("index");
            Dialog.closeDialog();
            Playback.play(this.data[a], Playback.mediaStartTime, !0)
        },
        onCellOver: function (a) {
            a = $(a.currentTarget);
            0 == a.data("index") % 2 ? (a.addClass("selected-alternate-cell"), a.removeClass("alternate-cell")) : (a.removeClass("cell"), a.addClass("selected-cell"))
        },
        onCellOut: function (a) {
            var a = $(a.currentTarget),
                b = a.data("index");
            a.removeClass("selected-cell");
            0 == b % 2 ? (a.addClass("alternate-cell"), a.removeClass("selected-alternate-cell")) : (a.removeClass("alternate-cell"), a.addClass("cell"))
        }
    }),
    HistoryListView = MediaListView.extend({
        setData: function (a) {
            this.data = a;
            for (var a = this.data.length, b = 0; b < a; ++b) this.data[b].idx = b, this.data[b].media.idx = b;
            this.timestampCell = this.scoreCell = null;
            MediaOverlay.hideLoadProgress();
            this.draw()
        },
        refreshData: function () {
            this.data && 0 < this.data.length && (this.scoreCell && this.scoreCell.text(Lang.history.score.split("%VALUE%").join(~~ (100 * this.data[0].room.score) + "%")), this.timestampCell && this.timestampCell.text(Utils.convertTimestampToReadableDate(this.data[0].timestamp, !0)))
        },
        getList: function () {
            return $('<ul class="history"/>')
        },
        getRow: function (a, b) {
            var c = $("<div/>").addClass("thumbnail").append($("<img/>").attr("src",
            a.media.image)),
                d = $("<div/>").addClass("meta").append($("<span/>").addClass("author").text(a.media.author)).append($("<span/>").addClass("title").text(" - " + a.media.title)).append($("<span/>").addClass("username").text(a.user.un)),
                e = $("<span/>").addClass("timestamp").text(Utils.convertTimestampToReadableDate(a.timestamp, !0)),
                f = $("<span/>").addClass("score").text(Lang.history.score.split("%VALUE%").join(~~ (100 * a.room.score) + "%"));
            a.cid == Models.room.data.historyID && (this.timestampCell = e, this.scoreCell = f);
            d.append(f).append(e);
            e = $("<div/>").addClass("actions").append($("<div/>").addClass("add").attr("title", Lang.tooltips.addItem).data("index", b).mousedown($.proxy(this.onAddClick, this))).append($("<div/>").addClass("related").attr("title", Lang.tooltips.similar).data("index", b).mousedown($.proxy(this.onRelatedClick, this)));
            c = $("<li/>").addClass("search-media-item").data("index", b).data("selected", !1).attr("title", Lang.tooltips.preview).mouseenter($.proxy(this.onCellOver, this)).mouseleave($.proxy(this.onCellOut,
            this)).mousedown($.proxy(this.onCellPress, this)).mouseup($.proxy(this.onCellRelease, this)).append(c).append(d).append(e);
            0 == b % 2 ? (c.addClass("alternate-cell"), c.removeClass("cell")) : (c.addClass("cell"), c.removeClass("alternate-cell"));
            return c
        },
        onCellOut: function (a) {
            PopMenu.showing || $("body").find(a.currentTarget).find(".actions").hide()
        },
        onPreviewItem: function () {
            Dialog.preview(this.doubleClickCellData.media)
        },
        onAddClick: function (a) {
            a.stopImmediatePropagation();
            Search.hideSuggestions();
            var b = $("body").find(a.target).data("index"),
                c = this.data[b].media;
            if (Models.playlist.selectedPlaylistID) {
                var d = this.getSelectedHistoryCells();
                if (0 < d.length) {
                    for (var e = d.length, f = !1; e--;) if (d[e].id == this.data[b].id) {
                        f = !0;
                        break
                    }
                    f ? PopMenu.show($("body").find(a.target), this.getSelectedCells()) : PopMenu.show($("body").find(a.target), [c])
                } else Models.playlistMedia(Models.playlist.selectedPlaylistID).mediaInsert([c], -1)
            } else Dialog.createPlaylist([c])
        },
        onRelatedClick: function (a) {
            a.stopImmediatePropagation();
            Search.hideSuggestions();
            var a = this.data[$("body").find(a.target).data("index")].media,
                b = $("#media-panel .media-list");
            b.html("");
            b.scrollTop(0);
            !a.format || 1 == a.format ? (MediaOverlay.onSearch(a.author + " - " + a.title), Models.search.loadYTRelated(a.cid)) : 2 == a.format && (MediaOverlay.onSearch(a.author), Models.search.load(a.author, "2", 0));
            PopMenu.hide()
        },
        getSelectedCells: function () {
            var a = [],
                b;
            for (b in this.selectedCells) a.push(this.selectedCells[b].media);
            a.sort(this.sortSelectedCells);
            return a
        },
        getSelectedHistoryCells: function () {
            var a = [],
                b;
            for (b in this.selectedCells) a.push(this.selectedCells[b]);
            a.sort(this.sortSelectedCells);
            return a
        },
        draw: function () {
            this._super();
            $("#playlist-filter").show()
        }
    }),
    YouTubeImportPlaylistsView = Class.extend({
        init: function () {
            this.data = []
        },
        setData: function (a) {
            this.data = a;
            for (var a = this.data.length, b = 0; b < a; ++b) this.data[b].idx = b;
            MediaOverlay.hideLoadProgress();
            this.draw()
        },
        draw: function () {
            for (var a = $("<ul class=youtube-playlists/>"), b = this.data.length, c = 0; c < b; ++c) this.data[c] && a.append(this.getRow(this.data[c], c));
            $("#media-panel .media-list");
            $("#media-panel .media-list").html(a);
            $("#media-panel .media-list").scrollTop(0);
            $("#media-panel-count").text(b);
            Main.isMac && $.browser.mozilla && $("#media-panel .media-list .meta").css("top", 9)
        },
        getRow: function (a, b) {
            var c = $("<li/>").addClass("youtube-playlist-item").data("index", b).append($("<span/>").text(a.name || a.title)).mouseenter($.proxy(this.onCellOver, this)).mouseleave($.proxy(this.onCellOut, this)).mouseup($.proxy(this.onCellRelease, this));
            0 == b % 2 ? (c.addClass("alternate-cell"), c.removeClass("cell")) : (c.addClass("cell"), c.removeClass("alternate-cell"));
            return c
        },
        onCellOver: function (a) {
            a = $(a.currentTarget);
            0 == a.data("index") % 2 ? (a.addClass("selected-alternate-cell"), a.removeClass("alternate-cell")) : (a.addClass("selected-cell"), a.removeClass("cell"))
        },
        onCellOut: function (a) {
            a = $(a.currentTarget);
            0 == a.data("index") % 2 ? (a.removeClass("selected-alternate-cell"), a.addClass("alternate-cell")) : (a.removeClass("selected-cell"), a.addClass("cell"))
        },
        onCellRelease: function (a) {
            a = $(a.currentTarget).data("index");
            MediaOverlay.onYouTubeImportMedia(this.data[a]);
            Models.youtubePlaylistMedia.load(this.data[a])
        }
    }),
    SoundCloudImportPlaylistsView = YouTubeImportPlaylistsView.extend({
        onCellRelease: function (a) {
            a = $(a.currentTarget).data("index");
            Models.soundcloudPlaylist.selectedIndex = a;
            MediaOverlay.onSoundCloudSetSelect(this.data[a])
        }
    }),
    GridData = Class.extend({
        init: function () {
            this.rows = 26;
            this.columns = 232;
            this.cellSize = 10;
            this.backScale = 0.5;
            this.leftSide = 50;
            this.rightSide = -50;
            this.random = new Rndm;
            this.clear()
        },
        clear: function () {
            this.zones = [];
            this.priorityGrid = [];
            var a, b, c, d;
            for (a = 0; a < this.rows; ++a) {
                c = [];
                for (b = 0; b < this.columns; ++b) c.push(100);
                this.priorityGrid.push(c)
            }
            this.userCount = 0;
            this.userMap = {};
            this.addZone(1, {
                x: 0,
                y: 0,
                w: this.columns,
                h: this.rows - 12
            });
            this.addZone(2, {
                x: 0,
                y: this.rows - 12,
                w: this.columns,
                h: 6
            });
            this.addZone(3, {
                x: 0,
                y: this.rows - 5,
                w: this.columns,
                h: 5
            });
            this.addZone(4, {
                x: 0.375 * this.columns,
                y: this.rows - 4,
                w: this.columns / 4,
                h: 2
            });
            this.addZone(5, {
                x: 110,
                y: this.rows - 1,
                w: 12,
                h: 1
            });
            for (a = 0; a < this.rows; ++a) {
                c = Utils.quadEaseOut(a, 0, 1 - this.backScale, this.rows);
                d = ~~ (c * this.columns / 2);
                var e = this.columns - 2 * d - 4;
                for (b = 0; b < e; ++b) c = b < e / 2 ? Utils.quadEaseOut(b,
                50, 50, e / 2) : Utils.quadEaseIn(b - e / 2, 100, -50, e / 2), this.setCellPriority(a, b + d + 2, c);
                this.invalidateCellsInBounds({
                    x: 0,
                    y: a,
                    w: d + 2,
                    h: 1
                });
                this.invalidateCellsInBounds({
                    x: this.columns - d - 2,
                    y: a,
                    w: d + 2,
                    h: 1
                })
            }
            this.invalidateRoomElements()
        },
        invalidateRoomElements: function () {
            this.invalidateCellsInBounds({
                x: 27,
                y: 4,
                w: 16,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 29,
                y: 5,
                w: 17,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 31,
                y: 6,
                w: 17,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 33,
                y: 7,
                w: 17,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 35,
                y: 8,
                w: 17,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 36,
                y: 9,
                w: 18,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 39,
                y: 10,
                w: 18,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 41,
                y: 11,
                w: 18,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 41,
                y: 12,
                w: 19,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 0,
                y: 13,
                w: 63,
                h: 2
            });
            this.invalidateCellsInBounds({
                x: 3,
                y: 15,
                w: 50,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 198,
                y: 0,
                w: 1,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 194,
                y: 1,
                w: 2,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 192,
                y: 2,
                w: 4,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 186,
                y: 3,
                w: 9,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 180,
                y: 4,
                w: 14,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 177,
                y: 5,
                w: 18,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 174,
                y: 6,
                w: 20,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 172,
                y: 7,
                w: 21,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 169,
                y: 8,
                w: 23,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 167,
                y: 9,
                w: 30,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 165,
                y: 10,
                w: 50,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 163,
                y: 11,
                w: 50,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 160,
                y: 12,
                w: 50,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 158,
                y: 13,
                w: 50,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 155,
                y: 14,
                w: 60,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 150,
                y: 15,
                w: 60,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 147,
                y: 16,
                w: 60,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 165,
                y: 17,
                w: 100,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 165,
                y: 18,
                w: 5,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 164,
                y: 19,
                w: 5,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 163,
                y: 20,
                w: 5,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 158,
                y: 21,
                w: 9,
                h: 1
            });
            this.invalidateCellsInBounds({
                x: 156,
                y: 22,
                w: 10,
                h: 2
            })
        },
        addZone: function (a,
        b) {
            this.zones.push({
                id: a,
                bounds: b
            })
        },
        addUser: function (a) {
            if (!this.userMap[a.id]) {
                if (this.userCount < (DB.settings.avatarcap || 150)) {
                    var b = [],
                        c = this.getZone(a);
                    do b = this.getCellsInZone(c--);
                    while (0 == b.length && 0 < c);
                    if (0 == b.length) {
                        c = 4;
                        do b = this.getCellsInZone(c--);
                        while (0 == b.length && 0 < c);
                        if (0 == b.length) return !1
                    }
                    b = this.getPosition(b);
                    a._position = b;
                    this.userMap[a.id] = a;
                    ++this.userCount;
                    this.invalidateCellAt(b.r, b.c);
                    for (a = 1; 4 >= a; ++a) this.decrementCellsInBounds({
                        x: b.c - a,
                        y: b.r - 2 * a,
                        w: 2 * a + 1,
                        h: 3 * a
                    });
                    return !0
                }
                return !1
            }
            return -1
        },
        getHighestPriority: function () {
            var a = -1,
                b, c;
            for (c in this.userMap) Models.room.userHash[c] && Models.room.userHash[c].priority > a && (a = Models.room.userHash[c].priority, b = c);
            return {
                id: b,
                priority: a
            }
        },
        getPosition: function (a) {
            for (var b = [], c = [], d = [], e = a.length; e--;) {
                var f = this.getPriorityLevelForCellAt(a[e].r, a[e].c);
                69 < f ? b.push(a[e]) : 49 < f ? c.push(a[e]) : 24 < f && d.push(a[e])
            }
            return 0 < b.length ? b[this.random.integer(0, b.length - 1)] : 0 < c.length ? c[this.random.integer(0, c.length - 1)] : 0 < d.length ? d[this.random.integer(0,
            d.length - 1)] : a[this.random.integer(0, a.length - 1)]
        },
        removeUser: function (a) {
            if (this.userMap[a]) {
                var b = this.userMap[a]._position;
                if (b) {
                    this.validateCellAt(b.r, b.c);
                    var c;
                    for (c = 1; 4 >= c; ++c) this.incrementCellsInBounds({
                        x: b.c - c,
                        y: b.r - 2 * c,
                        w: 2 * c + 1,
                        h: 3 * c
                    })
                }
                delete this.userMap[a];
                --this.userCount;
                return !0
            }
            return !1
        },
        getZone: function (a) {
            if (a.id == Models.user.data.id) return 5;
            if (3 == a.relationship || Models.room.admins[a.id] || Models.room.ambassadors[a.id]) return 4;
            if (2 == a.relationship || 1 == a.relationship) return 3;
            var b = this.random.float(0, 1),
                a = a.djPoints + a.listenerPoints + a.curatorPoints;
            return 100 > a ? 0.75 < b ? 2 : 1 : 300 > a ? 0.95 < b ? 3 : 0.65 < b ? 2 : 1 : 700 > a ? 0.7 < b ? 3 : 0.5 < b ? 2 : 1 : 1500 > a ? 0.55 < b ? 3 : 0.35 < b ? 2 : 1 : 3E3 > a ? 0.4 < b ? 3 : 0.2 < b ? 2 : 1 : 0.3 < b ? 3 : 2
        },
        getZoneIDsForCellAt: function (a, b) {
            for (var c = [], d = this.zones.length, e = 0; e < d; ++e) {
                var f = this.zones[e];
                b >= f.bounds.x && b <= f.bounds.x + f.bounds.w && a >= f.bounds.y && a <= f.bounds.y + f.bounds.h && c.push(f.id)
            }
            return c
        },
        getCellsInZone: function (a, b) {
            for (var c = [], d = this.zones.length, e = 0; e < d; ++e) {
                var f = this.zones[e];
                if (f.id == a) {
                    for (d = f.bounds.y; d < f.bounds.y + f.bounds.h; ++d) for (e = f.bounds.x; e < f.bounds.x + f.bounds.w; ++e)(0 < this.getPriorityLevelForCellAt(d, e) || b) && c.push({
                        c: e,
                        r: d
                    });
                    break
                }
            }
            return 5 == a && !b && 0 == c.length ? this.getCellsInZone(a, !0) : c
        },
        getPriorityLevelForCellAt: function (a, b) {
            return Math.max(0, this.priorityGrid[a][b])
        },
        invalidateCellAt: function (a, b) {
            this.priorityGrid[a][b] -= 100
        },
        validateCellAt: function (a, b) {
            this.priorityGrid[a][b] += 100
        },
        invalidateCellsInBounds: function (a) {
            for (var b = a.y; b < a.y + a.h; ++b) if (!(0 > b || b >= this.rows)) for (var c = a.x; c < a.x + a.w; ++c) 0 > c || c >= this.columns || this.invalidateCellAt(b, c)
        },
        decrementCellsInBounds: function (a) {
            for (var b = a.y; b < a.y + a.h; ++b) if (!(0 > b || b >= this.rows)) for (var c = a.x; c < a.x + a.w; ++c) 0 > c || c >= this.columns || this.decrementCellAt(b, c)
        },
        incrementCellsInBounds: function (a) {
            for (var b = a.y; b < a.y + a.h; ++b) if (!(0 > b || b >= this.rows)) for (var c = a.x; c < a.x + a.w; ++c) 0 > c || c >= this.columns || this.incrementCellAt(b, c)
        },
        decrementCellAt: function (a, b) {
            var c = this.getZoneIDsForCellAt(a, b).sort();
            this.priorityGrid[a][b] -= this.getAdjustment(c[c.length - 1])
        },
        incrementCellAt: function (a, b) {
            var c = this.getZoneIDsForCellAt(a, b).sort();
            this.priorityGrid[a][b] += this.getAdjustment(c[c.length - 1])
        },
        setCellPriority: function (a, b, c) {
            this.priorityGrid[a][b] = c
        },
        getAdjustment: function (a) {
            return 5 == a || 4 == a ? 45 : 3 == a ? 30 : 2 == a ? 25 : 15
        }
    }),
    DialogView = Class.extend({
        init: function () {
            this.submitFunc = this.context = null;
            this.restrictedList = new RestrictedSearchListView;
            Models.restrictedSearch.updateCallback = $.proxy(this.onRestrictedSearchUpdate, this);
            this.isRoomInfo = this.ignoreEnter = this.importing = this.restrictedOpen = this.isOpen = this.isPreview = !1;
            this.availableTimeoutID = null;
            this.nameAvailable = !1
        },
        createPlaylist: function (a, b) {
            this.closeDialog();
            this.context = a;
            this.submitFunc = b ? $.proxy(this.submitCreatePlaylistCurate, this) : $.proxy(this.submitCreatePlaylist, this);
            var c;
            c = this.context && 0 < this.context.length ? 1 < this.context.length ? Lang.dialog.createPlaylistFrom.split("%COUNT%").join(this.context.length) : Lang.dialog.createPlaylistFrom1 : Lang.dialog.createPlaylist;
            this.showDialog($("<div/>").attr("id", "dialog-create-playlist").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 320) / 2).css("top", 272).append(this.getHeader(c)).append($("<div/>").addClass("dialog-body").append($("<form/>").submit("return false").append(this.getInputField("name", Lang.dialog.name, Lang.dialog.playlistName, "", 24)))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.createPlaylist)))
        },
        submitCreatePlaylist: function () {
            var a = $("#dialog-create-playlist").find("input").attr("value");
            0 < a.length && (Models.playlist.facade.create(a, this.context), Dialog.closeDialog(), _gaq.push(["_trackEvent", "Dialog", "Create Playlist"]))
        },
        submitCreatePlaylistCurate: function () {
            var a = $("#dialog-create-playlist").find("input").attr("value");
            0 < a.length && (Models.playlist.facade.create(a, this.context, !0), Dialog.closeDialog(), _gaq.push(["_trackEvent", "Dialog", "Curate Create Playlist"]))
        },
        deletePlaylist: function (a) {
            this.closeDialog();
            this.context = a;
            this.submitFunc = $.proxy(this.submitDeletePlaylist, this);
            this.showDialog($("<div/>").attr("id",
                "dialog-delete").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 272).append(this.getHeader(Lang.dialog.deletePlaylist)).append($("<div/>").addClass("dialog-body").append(this.getMessage(Lang.dialog.deletePlaylistPrompt.split("%NAME%").join(a.name)))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.deleteButton)))
        },
        submitDeletePlaylist: function () {
            Models.playlist.facade.deleteCallback = MediaOverlay.deletePlaylistCallbackProxy;
            Models.playlist.facade.remove(Dialog.context.id);
            Dialog.closeDialog();
            _gaq.push(["_trackEvent", "Dialog", "Delete Playlist"])
        },
        renamePlaylist: function (a) {
            this.closeDialog();
            this.context = a;
            this.submitFunc = $.proxy(this.submitRenamePlaylist, this);
            this.showDialog($("<div/>").attr("id", "dialog-rename-playlist").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 272).append(this.getHeader(Lang.dialog.renamePlaylist)).append($("<div/>").addClass("dialog-body").append($("<form/>").submit("return false").append(this.getInputField("name",
            Lang.dialog.name, Lang.dialog.playlistName, a.name, 24)))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.save)))
        },
        submitRenamePlaylist: function () {
            var a = $("#dialog-rename-playlist").find("input").attr("value");
            0 < a.length && (Models.playlist.facade.rename(Dialog.context.id, a), Dialog.closeDialog(), _gaq.push(["_trackEvent", "Dialog", "Rename Playlist"]))
        },
        deleteMedia: function (a, b) {
            this.closeDialog();
            this.context = {
                items: a,
                playlistID: b
            };
            this.submitFunc = $.proxy(this.submitDeleteMedia, this);
            var c;
            c = 1 == a.length ? Lang.dialog.deleteSinglePrompt.split("%MEDIA%").join(a[0].author + " - " + a[0].title) : Lang.dialog.deleteMultiplePrompt.split("%COUNT%").join(a.length);
            var d = $("<div/>").attr("id", "dialog-delete").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 267).append(this.getHeader(Lang.dialog.deleteMedia));
            d.append($("<div/>").addClass("dialog-body").append(this.getMessage(c))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.deleteButton));
            this.showDialog(d)
        },
        submitDeleteMedia: function () {
            var a = Models.playlistMedia(Dialog.context.playlistID).facade;
            a.deleteCallback = MediaOverlay.deleteMediaCallbackProxy;
            a.mediaDelete(Dialog.context.items);
            Dialog.closeDialog();
            _gaq.push(["_trackEvent", "Dialog", "Delete Media"])
        },
        editMedia: function (a, b) {
            this.closeDialog();
            this.context = {
                item: a,
                playlistID: b
            };
            this.submitFunc = $.proxy(this.submitEditMedia, this);
            this.showDialog($("<div/>").attr("id", "dialog-edit-media").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 400) / 2).css("top",
            257).append(this.getHeader(Lang.dialog.editMedia)).append($("<div/>").addClass("dialog-body").append($("<form/>").submit("return false").append(this.getInputField("author", Lang.dialog.artist, Lang.dialog.artist, a.author, 128)).append(this.getInputField("title", Lang.dialog.title, Lang.dialog.title, a.title, 128).css("top", 53))).append($("<div/>").addClass("icon-swap").click($.proxy(this.swapAuthorTitle, this)))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.save)))
        },
        swapAuthorTitle: function () {
            var a = $("#dialog-edit-media").find("input"),
                b = a[0].value;
            a[0].value = a[1].value;
            a[1].value = b;
            _gaq.push(["_trackEvent", "Dialog", "Swap Author/Title"])
        },
        submitEditMedia: function () {
            var a = $("#dialog-edit-media").find("input");
            Models.playlistMedia(this.context.playlistID).mediaUpdate(this.context.item.id, a[0].value, a[1].value);
            Dialog.closeDialog();
            _gaq.push(["_trackEvent", "Dialog", "Edit Media"])
        },
        preview: function (a) {
            this.closeDialog();
            if (a.cid) {
                this.context = a;
                this.submitFunc = null;
                this.isPreview = !0;
                var b, c, d = "dialog-preview-";
                1 == a.format ? (d += "yt", b = 484, c = 302) : (d += "sc", b = 480, c = 81);
                var e = Main.LEFT + (Main.WIDTH - b) / 2;
                b = $("<div/>").attr("id", d).addClass("dialog").css("left", e).css("top", (687 - (c + 38)) / 2).width(b).height(c + 38).append(this.getHeader(Lang.dialog.preview));
                1 == a.format ? (this.previewFrame = $('<iframe id="ytprv" frameborder="0"/>').css("position", "absolute"), this.previewFrame.load($.proxy(this.onYTPreviewLoaded, this)), b.append($("<div/>").addClass("dialog-body").height(c + 38).append(this.previewFrame)), c = isiOS ? "pdjytpiOS" : DB.settings.yt5 || isAndroid ? "pdjytp5" : "pdjytpf", -1 < window.location.href.indexOf("pepper.plug.dj") ? c += "pepper" : -1 < window.location.href.indexOf("localhost") && (c += "local"), this.previewFrame.attr("src", "http://pdj-youtube.appspot.com/" + c + ".html"), this.showDialog(b)) : 2 == a.format && (a = '<object height="100%" width="100%"><param name="movie" value="https://player.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F' + a.cid + '&amp;show_comments=false&amp;auto_play=true&amp;color=55B9FF"></param><param name="allowscriptaccess" value="always"></param><embed allowscriptaccess="always" width="100%" height="100%" src="https://player.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F' + a.cid + '&amp;show_comments=false&amp;auto_play=true&amp;color=55B9FF" type="application/x-shockwave-flash"></embed></object>', b.append($("<div/>").addClass("dialog-body").height(c).html(a)), this.showDialog(b))
            }
        },
        onYTPreviewLoaded: function () {
            this.context && document.getElementById("ytprv").contentWindow.postMessage(JSON.stringify({
                id: this.context.cid,
                volume: Playback.lastVolume
            }), "http://pdj-youtube.appspot.com")
        },
        restrictedMedia: function (a) {
            this.closeDialog();
            this.context = a;
            this.submitFunc = $.proxy(this.submitRestrictedMedia,
            this);
            this.showDialog($("<div/>").attr("id", "dialog-restricted-media").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 600) / 2).css("top", 103.5).append(this.getHeader(Lang.dialog.restricted)).append($("<div/>").addClass("dialog-body").append(this.getMessage("")).append($("<span/>").addClass("media-name").text(a.author + " - " + a.title)).append($("<div/>").attr("class", "media-list")).append(this.getSubmitButton(Lang.dialog.waitForNextDJ))));
            $("#dialog-restricted-media .media-list").spin("large", "white");
            Models.restrictedSearch.load(a.author + " " + a.title, "" + a.format, 0, 20);
            this.restrictedOpen = !0
        },
        onRestrictedSearchUpdate: function (a) {
            $("#dialog-restricted-media .media-list").spin(!1);
            var b = "",
                b = a && 0 < a.length ? Lang.dialog.chooseAlternative : Lang.dialog.noAlternative;
            $("#dialog-restricted-media .dialog-message").text(b);
            this.restrictedList.setData(a)
        },
        submitRestrictedMedia: function () {
            this.closeDialog();
            _gaq.push(["_trackEvent", "Dialog", "Restricted Media : " + (Models.room.userInBooth ? Models.room.userIsPlaying ?
                "DJ" : "Booth" : "Audience"), "Wait For Next DJ"])
        },
        createRoom: function () {
            this.closeDialog();
            this.context = null;
            this.submitFunc = $.proxy(this.submitCreateRoom, this);
            var a = Lang.dialog.createRoom;
            this.showDialog($("<div/>").attr("id", "dialog-create-room").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 193.5).append(this.getHeader(a)).append($("<div/>").addClass("dialog-body").append($("<form/>").submit("return false").append(this.getInputField("name", Lang.dialog.roomName, Lang.dialog.roomName,
                "", 32)).append($("<span/>").addClass("dialog-create-room-type").text(Lang.dialog.roomType)).append($("<div/>").addClass("dialog-create-room-public").addClass("dialog-create-room-type-choice").mouseenter($.proxy(this.onRoomChoiceOver, this)).mouseleave($.proxy(this.onRoomChoiceOut, this)).click($.proxy(this.onRoomChoiceClick, this)).append($("<input type='radio' name='roomType' value='public' checked='checked'/>")).append($("<span/>").addClass("dialog-create-room-type-choice-label").text(Lang.dialog.roomPublic)).append($("<span/>").addClass("dialog-create-room-type-choice-detail").text(Lang.dialog.roomPublicDetail))).append($("<div/>").addClass("dialog-create-room-private").addClass("dialog-create-room-type-choice").mouseenter($.proxy(this.onRoomChoiceOver,
            this)).mouseleave($.proxy(this.onRoomChoiceOut, this)).click($.proxy(this.onRoomChoiceClick, this)).append($("<input type='radio' name='roomType' value='private'/>")).append($("<span/>").addClass("dialog-create-room-type-choice-label").text(Lang.dialog.roomPrivate + " (Currently Disabled)")).append($("<span/>").addClass("dialog-create-room-type-choice-detail").text(Lang.dialog.roomPrivateDetail))))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.createRoom)))
        },
        onRoomChoiceOver: function (a) {
            $(a.currentTarget).find("input").attr("checked") || $(a.currentTarget).css("background-color", "#2A2A2A").css("border", "1px solid #888")
        },
        onRoomChoiceOut: function (a) {
            $(a.currentTarget).find("input").attr("checked") || $(a.currentTarget).css("background-color", "#000").css("border", "1px solid #444")
        },
        onRoomChoiceClick: function (a) {
            "private" == $(a.currentTarget).find("input").attr("value") ? alert("Private rooms are currently disabled.") : ($(".dialog-create-room-private").css("background-color", "#000").css("border", "1px solid #444").css("cursor", "pointer").find("input").attr("checked",
            null), $(".dialog-create-room-public").css("background-color", "#044761").css("border", "1px solid #FFF").css("cursor", "default").find("input").attr("checked", "checked"))
        },
        submitCreateRoom: function () {
            var a = $("#dialog-create-room").find("input").attr("value");
            if (0 < a.length) {
                var b = null != $(".dialog-create-room-public").find("input").attr("checked"),
                    b = !0;
                new RoomCreateService(a, b);
                Dialog.closeDialog();
                _gaq.push(["_trackEvent", "Dialog", "Create Room", b ? "Public" : "Private"])
            } else $("#dialog-create-room .dialog-input-label").text(Lang.dialog.roomNameRequired).css("color",
                "#C00")
        },
        roomInfo: function () {
            this.closeDialog();
            this.isRoomInfo = !0;
            var a = $("<div/>").addClass("dialog").attr("id", "dialog-room-info").append(this.getHeader(Lang.dialog.roomInfo)).css("left", Main.LEFT + (Main.WIDTH - 400) / 2).css("top", 156);
            this.submitFunc = $.proxy(this.submitRoomInfo, this);
            Models.user.hasPermission(Models.user.COHOST) || Models.room.admins[Models.user.data.id] ? (this.context = Models.room.data, this.ignoreEnter = !0, a.append($("<div/>").addClass("dialog-body").append($("<form/>").submit("return false").append(this.getInputField("name",
            Lang.dialog.roomName, Lang.dialog.roomName, Models.room.data.name, 32)).append(this.getCheckBox(Lang.dialog.boothLocked, "boothLocked", Models.room.data.boothLocked)).append(this.getCheckBox(Lang.dialog.waitListEnabled, "waitListEnabled", Models.room.data.waitListEnabled)).append(this.getMenu(Lang.dialog.maxPlays, "maxPlays", [0, 1, 2, 3, 4, 5], Models.room.data.maxPlays)).append(this.getTextArea("description", Lang.dialog.roomDescription, Models.room.data.description || "", 80, 4, 512)))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.save))) : Models.user.hasPermission(Models.user.MANAGER) ? (this.context = Models.room.data, a.append($("<div/>").addClass("dialog-body").append($("<form/>").submit("return false").append(this.getInputField("name", Lang.dialog.roomName, Lang.dialog.roomName, Models.room.data.name, 32, !0)).append(this.getCheckBox(Lang.dialog.boothLocked, "boothLocked", Models.room.data.boothLocked)).append(this.getCheckBox(Lang.dialog.waitListEnabled, "waitListEnabled", Models.room.data.waitListEnabled)).append(this.getMenu(Lang.dialog.maxPlays,
                "maxPlays", [0, 1, 2, 3, 4, 5], Models.room.data.maxPlays)).append($("<span/>").addClass("room-info-description-label").text(Lang.dialog.roomDescription)).append($("<div/>").addClass("room-info-description-container").append($("<div/>").addClass("frame-background")).append($("<div/>").addClass("room-info-description-scroll").append($("<span/>").addClass("room-info-description").html(Models.chat.parse(Models.room.data.description || "").split("\n").join("<br/>"))))))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.save))) : (this.context = null, a.append($("<div/>").addClass("dialog-body").append($("<div/>").append(this.getInputField("name", Lang.dialog.roomName, Lang.dialog.roomName, Models.room.data.name, 32, !0)).append($("<span/>").attr("id", "room-info-boothlocked-label").addClass("room-info-cbsub-label").text(Models.room.data.boothLocked ? Lang.dialog.boothIsLocked : Lang.dialog.boothIsUnlocked)).append($("<span/>").attr("id", "room-info-waitlist-label").addClass("room-info-cbsub-label").text(Models.room.data.waitListEnabled ? Lang.dialog.waitListIsEnabled : Lang.dialog.waitListIsDisabled)).append($("<span/>").attr("id", "room-info-maxplays-label").addClass("room-info-cbsub-label").text(Lang.dialog.maxPlaysCount.split("%COUNT%").join(Models.room.data.maxPlays))).append($("<span/>").addClass("room-info-description-label").text(Lang.dialog.roomDescription)).append($("<div/>").addClass("room-info-description-container").append($("<div/>").addClass("frame-background")).append($("<div/>").addClass("room-info-description-scroll").append($("<span/>").addClass("room-info-description").html(Models.chat.parse(Models.room.data.description ||
                "").split("\n").join("<br/>"))))))).append(this.getSubmitButton(Lang.dialog.ok)));
            this.showDialog(a)
        },
        submitRoomInfo: function () {
            if (this.context) {
                var a = $("#dialog-checkbox-boothLocked").is(":checked"),
                    b = $("#dialog-checkbox-waitListEnabled").is(":checked"),
                    c = parseInt($("#dialog-menu-maxPlays").val());
                if (Models.user.hasPermission(Models.user.COHOST)) {
                    var d = $("#dialog-room-info").find("input").attr("value"),
                        e = $("#dialog-room-info").find("textarea").val();
                    if (0 == d.length) return;
                    (d != this.context.name || e != this.context.description) && new RoomUpdateService(this.context.id, d, e)
                }
                Models.user.hasPermission(Models.user.MANAGER) && (a != this.context.boothLocked || b != this.context.waitListEnabled || c != this.context.maxPlays) && new RoomPropsService(this.context.id, a, b, c, 5)
            }
            Dialog.closeDialog()
        },
        userProfile: function () {
            this.closeDialog();
            this.context = "isUserProfile";
            this.submitFunc = $.proxy(this.submitUserProfile, this);
            this.showDialog($("<div/>").attr("id", "dialog-user-profile").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 208.5).append(this.getHeader(Lang.dialog.userProfile)).append($("<div/>").addClass("dialog-body").append($("<form/>").submit("return false").append(this.getInputField("name", Lang.dialog.name, Lang.dialog.displayName, Models.user.data.username, 24)).append($("<span/>").attr("id", "username-availability").text(Lang.dialog.displayNameAvailable)).append(this.getMenu(Lang.dialog.userStatus, "userstatus", Models.user.statuses, Math.max(Models.user.data.status, 0))).append($("<div/>").attr("id",
                "dialog-user-profile-language-line").addClass("dotted-line")).append(this.getLanguageMenu()).append(this.getCheckBox("HTML5 YouTube Player", "html5player", DB.settings.yt5)))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.save)))
        },
        submitUserProfile: function () {
            var a = $("#dialog-menu-language").val(),
                b = $("#dialog-user-profile").find("input").attr("value"),
                c = $("#dialog-menu-userstatus").val(),
                d = $("#dialog-checkbox-html5player").is(":checked");
            Models.user.data.language != a && Models.user.changeLanguage(a);
            b != Models.user.data.username && 1 < b.length && this.nameAvailable && Models.user.changeDisplayName(b);
            c != Models.user.data.status && Models.user.changeStatus(c);
            d != DB.settings.yt5 && (DB.settings.yt5 = d, DB.saveSettings());
            Dialog.closeDialog()
        },
        alert: function (a, b, c, d) {
            this.closeDialog();
            this.context = b;
            this.forceCallback = d;
            this.submitFunc = $.proxy(this.submitAlert, this);
            this.showDialog($("<div/>").attr("id", "dialog-alert").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 267).append(this.getHeader(c || Lang.dialog.alert)).append($("<div/>").addClass("dialog-body").append(this.getMessage(a))).append(this.getSubmitButton(Lang.dialog.ok)))
        },
        submitAlert: function () {
            this.context && this.context();
            Dialog.closeDialog()
        },
        confirm: function (a, b, c) {
            this.closeDialog();
            this.context = c;
            this.submitFunc = $.proxy(this.submitConfirm, this);
            this.showDialog($("<div/>").attr("id", "dialog-confirm").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 267).append(this.getHeader(a)).append($("<div/>").addClass("dialog-body").append(this.getMessage(b))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.ok)))
        },
        submitConfirm: function () {
            this.context && this.context();
            Dialog.closeDialog()
        },
        moderateUser: function (a, b) {
            this.closeDialog();
            this.context = {
                user: a,
                ban: b
            };
            this.submitFunc = $.proxy(this.submitModerateUser, this);
            var c = b ? Lang.dialog.banUser : Lang.dialog.kickUser,
                d = b ? Lang.dialog.banUserPrompt.split("%NAME%").join(a.username) : Lang.dialog.kickUserPrompt.split("%NAME%").join(a.username);
            this.showDialog($("<div/>").attr("id", "dialog-moderate-user").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top",
            252).append(this.getHeader(c)).append($("<div/>").addClass("dialog-body").append(this.getMessage(d)).append($("<form/>").submit("return false").append(this.getInputField("reason", Lang.dialog.reason, Lang.dialog.reason, "", 64)))).append(this.getCancelButton()).append(this.getSubmitButton(c)))
        },
        submitModerateUser: function () {
            var a = $("#dialog-moderate-user").find("input").attr("value");
            this.context.ban ? (new ModerationKickUserService(this.context.user.id, a, -1), _gaq.push(["_trackEvent", "Dialog", "Ban User",
            Models.user.data.id + " -> " + this.context.user.id])) : (new ModerationKickUserService(this.context.user.id, a, 60), _gaq.push(["_trackEvent", "Dialog", "Kick User", Models.user.data.id + " -> " + this.context.user.id]));
            Dialog.closeDialog()
        },
        userPermissions: function (a) {
            this.closeDialog();
            this.context = {
                user: a,
                permission: a.permission
            };
            this.submitFunc = $.proxy(this.submitUserPermissions, this);
            var b = "",
                c = "#FFF";
            0 < a.permission && (c = "#e90e82", b = 4 == a.permission ? Lang.rollover.cohost : 3 == a.permission ? Lang.rollover.manager : 2 == a.permission ? Lang.rollover.bouncer : 1 == a.permission ? Lang.rollover.featuredDJ : Lang.rollover.none);
            var d = $("<div/>").attr("id", "dialog-user-permissions-choices");
            d.append(this.getPermissionMenuItem("cohost", Lang.rollover.cohost, Lang.dialog.cohostDescription, 4));
            d.append(this.getPermissionMenuItem("manager", Lang.rollover.manager, Lang.dialog.managerDescription, 3));
            d.append(this.getPermissionMenuItem("bouncer", Lang.rollover.bouncer, Lang.dialog.bouncerDescription, 2));
            d.append(this.getPermissionMenuItem("featured-dj",
            Lang.rollover.featuredDJ, Lang.dialog.featuredDJDescription, 1));
            d.append(this.getPermissionMenuItem("none", Lang.rollover.none, Lang.dialog.noneDescription, 0));
            this.showDialog($("<div/>").attr("id", "dialog-user-permissions").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 460) / 2).css("top", 183.5).append(this.getHeader(Lang.dialog.userPermissions)).append($("<div/>").addClass("dialog-body").append($("<div/>").attr("id", "dialog-user-permissions-meta").append($("<div/>").attr("id", "dialog-user-permissions-user-image").append('<img src="' + AvatarManifest.getThumbUrl(a.avatarID) + '" width="28" height="28"/>')).append($("<div/>").attr("id", "dialog-user-permissions-username").text(a.username)).append($("<div/>").attr("id", "dialog-user-permissions-usertype").text(b).css("color", c))).append($("<div/>").attr("id", "dialog-user-permissions-menu").append(d).append($("<div/>").attr("id", "dialog-user-permissions-description").html("<span>" + (4 == a.permission ? Lang.dialog.cohostDescription : 3 == a.permission ? Lang.dialog.managerDescription : 2 == a.permission ? Lang.dialog.bouncerDescription : 1 == a.permission ? Lang.dialog.featuredDJDescription : Lang.dialog.noneDescription) + "</span>")))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.ok)))
        },
        getPermissionMenuItem: function (a, b, c, d) {
            a = $("<div/>").attr("id", "dialog-user-permissions-" + a).addClass("dialog-user-permissions-choice").html("<span>" + b + "</span>").data("type", d).mouseenter(function () {
                $("#dialog-user-permissions-description").html("<span>" + c + "</span>")
            }).mouseleave(function () {
                $("#dialog-user-permissions-description").html("<span>" + (4 == Dialog.context.permission ? Lang.dialog.cohostDescription : 3 == Dialog.context.permission ? Lang.dialog.managerDescription : 2 == Dialog.context.permission ? Lang.dialog.bouncerDescription : 1 == Dialog.context.permission ? Lang.dialog.featuredDJDescription : Lang.dialog.noneDescription) + "</span>")
            });
            Models.user.getPermission() > d ? a.click($.proxy(this.onUserPermissionClick, this)) : a.addClass("dialog-user-permissions-choice-disabled");
            this.context.permission == d && a.addClass("dialog-user-permissions-choice-selected");
            return a
        },
        onUserPermissionClick: function (a) {
            var b = $(a.currentTarget).data("type");
            $(".dialog-user-permissions-choice").each(function () {
                var a = $(this);
                a.data("type") == b ? (a.addClass("dialog-user-permissions-choice-selected"), Dialog.context.permission = b) : a.removeClass("dialog-user-permissions-choice-selected")
            })
        },
        submitUserPermissions: function () {
            new ModerationPermissionsService(this.context.user.id, this.context.permission);
            _gaq.push(["_trackEvent", "Dialog", "User Permissions", Models.user.data.id + " -> " + this.context.user.id, this.context.permission]);
            this.closeDialog()
        },
        importTT: function (a) {
            try {
                var b = JSON.parse(a),
                    a = [],
                    c;
                for (c in b) "Unknown" != b[c].metadata.artist && "Untitled" != b[c].metadata.song && a.push(b[c].metadata);
                if (0 < a.length) this.context = a, this.submitFunc = $.proxy(this.submitImportTT, this), this.showDialog($("<div/>").attr("id", "dialog-import-tt").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 272).append(this.getHeader("Turntable Import")).append($("<div/>").addClass("dialog-body").append(this.getMessage("Import " + a.length + " songs?"))).append(this.getCancelButton()).append(this.getSubmitButton("Import")));
                else throw "No Items";
            } catch (d) {
                this.alert("Invalid Playlist File")
            }
        },
        submitImportTT: function () {
            this.importing = !0;
            $(".dialog-button").hide();
            this.importIndex = -1;
            this.importItems = [];
            this.importHash = {};
            this.ttImportNext();
            _gaq.push(["_trackEvent", "Dialog", "Import Turntable", this.context.length])
        },
        ttImportNext: function () {
            this.importTimeoutID && clearTimeout(this.importTimeoutID);
            if (++this.importIndex < this.context.length) {
                var a = this.context[this.importIndex];
                $(".dialog-message").text(this.importIndex + 1 + "/" + this.context.length + ": " + a.artist + " - " + a.song);
                Models.search.facade.ytSearch(a.artist + " " + a.song, 1, 1, $.proxy(this.onTTLookup, this))
            } else this.ttCreatePlaylist(this.importItems, 1)
        },
        onTTLookup: function (a) {
            0 < a.length && 0 != a[0].format && (this.importHash[a[0].cid] || this.importItems.push(a[0]), this.importHash[a[0].cid] = !0);
            this.importTimeoutID = setTimeout($.proxy(this.ttImportNext, this), 50)
        },
        ttCreatePlaylist: function (a, b) {
            if (0 < a.length) {
                var c = "TT Import";
                1 < b && (c += " " + b);
                if (200 >= a.length) Models.playlist.facade.create(c, a), this.closeDialog();
                else {
                    var d = a.slice(0, 200);
                    Models.playlist.facade.create(c, d);
                    a.splice(0, 200);
                    this.ttCreatePlaylist(a, ++b)
                }
            } else this.closeDialog()
        },
        youtubeImport: function () {
            this.closeDialog();
            this.context = null;
            this.submitFunc = $.proxy(this.submitYouTubeImport, this);
            this.showDialog($("<div/>").attr("id", "dialog-youtube-import").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 266).append(this.getHeader(Lang.dialog.youtubeImport)).append($("<div/>").addClass("dialog-body").append($("<form/>").submit("return false").append(this.getInputField("name",
                "", Lang.dialog.youtubeUsername, "", 32)))).append(this.getCancelButton()).append(this.getSubmitButton(Lang.dialog.lookup)))
        },
        submitYouTubeImport: function () {
            var a = $("#dialog-youtube-import").find("input").attr("value");
            0 < a.length && (MediaOverlay.onYouTubeImport(a), Models.youtubePlaylist.load(a), this.closeDialog(), _gaq.push(["_trackEvent", "Dialog", "Import YouTube"]))
        },
        soundCloudImport: function () {
            this.closeDialog();
            this.context = null;
            this.submitFunc = $.proxy(this.submitSoundCloudImport, this);
            var a = $("<div/>").attr("id",
                "dialog-soundcloud-import").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 226).append(this.getHeader(Lang.dialog.soundcloudImport)).append($("<div/>").addClass("dialog-body").append(this.getMessage(Lang.dialog.soundcloudWhat)).append($("<div/>").attr("id", "dialog-soundcloud-favorites-button").click($.proxy(this.submitSoundCloudImport, this)).addClass("dialog-soundcloud-button").append($("<span/>").text(Lang.dialog.scFavorites))).append($("<div/>").attr("id", "dialog-soundcloud-tracks-button").click($.proxy(this.submitSoundCloudImport,
            this)).addClass("dialog-soundcloud-button").append($("<span/>").text(Lang.dialog.scTracks))).append($("<div/>").attr("id", "dialog-soundcloud-sets-button").click($.proxy(this.submitSoundCloudImport, this)).addClass("dialog-soundcloud-button").append($("<span/>").text(Lang.dialog.scSets))).append(this.getSubmitButton(Lang.dialog.cancel)));
            this.posDialogFields();
            this.showDialog(a)
        },
        submitSoundCloudImport: function (a) {
            this.closeDialog();
            a = $(a.currentTarget).attr("id");
            "dialog-soundcloud-favorites-button" == a ? (MediaOverlay.onSoundCloudImport("favorites"), Models.search.loadSCFavorites(0)) : "dialog-soundcloud-tracks-button" == a ? (MediaOverlay.onSoundCloudImport("tracks"), Models.search.loadSCTracks(0)) : "dialog-soundcloud-sets-button" == a && (MediaOverlay.onSoundCloudSetsImport(), Models.soundcloudPlaylist.load())
        },
        itunesReading: function () {
            this.closeDialog();
            this.submitFunc = this.context = null;
            this.importing = !0;
            this.showDialog($("<div/>").attr("id", "dialog-import-itunes").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 217).append(this.getHeader(Lang.dialog.itunesImport)).append($("<div/>").addClass("dialog-body").append(this.getMessage(Lang.dialog.itunesReading)).append($("<div/>").attr("id", "dialog-import-itunes-progress").append($("<div/>").attr("id", "dialog-import-itunes-progress-bar")).append($("<div/>").attr("id", "dialog-import-itunes-progress-perc")))));
            $(".dialog-close-button").hide()
        },
        itunesImport: function (a) {
            this.closeDialog();
            try {
                if (0 < a.length) {
                    this.importing = !1;
                    this.context = a;
                    this.submitFunc = $.proxy(this.submitImportiTunes, this);
                    for (var b = $("<div/>").attr("id", "dialog-itunes-container"), c = $("<ul/>"), d = a.length, e = 0; e < d; ++e) c.append($("<li/>").append(this.getCheckBox(a[e].name + " (" + a[e].items.length + ")", "itp" + e)));
                    b.append(c);
                    this.showDialog($("<div/>").attr("id", "dialog-import-itunes").addClass("dialog").css("left", Main.LEFT + (Main.WIDTH - 300) / 2).css("top", 217).append(this.getHeader(Lang.dialog.itunesImport)).append($("<div/>").addClass("dialog-body").append(this.getMessage(Lang.dialog.itunesPlaylists)).append(b)).append(this.getCancelButton()).append(this.getSubmitButton("Import")))
                } else throw "No Items";
            } catch (f) {
                this.alert("No valid playlists found")
            }
        },
        submitImportiTunes: function () {
            var a = [],
                b = this.context.length;
            console.log("len = " + b);
            for (var c = 0; c < b; ++c) console.log($("#dialog-checkbox-itp" + c).attr("checked")), $("#dialog-checkbox-itp" + c).attr("checked") && (console.log(this.context[c] + "is checked"), a.push(this.context[c]));
            this.context = a;
            this.importing = !0;
            $(".dialog-button").hide();
            $("#dialog-itunes-container").hide();
            $("#dialog-import-itunes").css("height", 170);
            this.importIndex = {
                p: -1,
                s: -1
            };
            this.iTunesImportNextPlaylist()
        },
        iTunesImportNextPlaylist: function () {
            this.importTimeoutID && clearTimeout(this.importTimeoutID);
            console.log(this.importIndex.p + 1 + " < " + this.context.length);
            ++this.importIndex.p < this.context.length ? (this.importIndex.s = -1, this.importItems = [], this.importHash = {}, this.itunesImportNext()) : this.closeDialog()
        },
        itunesImportNext: function () {
            this.importTimeoutID && clearTimeout(this.importTimeoutID);
            var a = this.context[this.importIndex.p];
            if (++this.importIndex.s < a.items.length) {
                var b = a.items[this.importIndex.s];
                $(".dialog-message").html(a.name +
                    " " + (this.importIndex.s + 1) + "/" + a.items.length + "<br/><br/>" + b.artist + " - " + b.name);
                Models.search.facade.ytSearch(b.artist + " " + b.name, 1, 1, $.proxy(this.oniTunesLookup, this))
            } else this.itunesCreatePlaylist(a.name, this.importItems, 1)
        },
        oniTunesLookup: function (a) {
            0 < a.length && 0 != a[0].format && (this.importHash[a[0].cid] || this.importItems.push(a[0]), this.importHash[a[0].cid] = !0);
            this.importTimeoutID = setTimeout($.proxy(this.itunesImportNext, this), 50)
        },
        itunesCreatePlaylist: function (a, b, c) {
            if (0 < b.length) {
                var d = a;
                1 < c && (d += " " + c);
                if (200 >= b.length) Models.playlist.facade.create(d, b), this.iTunesImportNextPlaylist();
                else {
                    var e = b.slice(0, 200);
                    Models.playlist.facade.create(d, e);
                    b.splice(0, 200);
                    this.itunesCreatePlaylist(a, b, ++c)
                }
            } else this.iTunesImportNextPlaylist()
        },
        showDialog: function (a) {
            $("#dialog-box").html(a);
            Main.isMac && this.posDialogFields();
            $("#dialog-container").show();
            $(document).keydown(Dialog.onKeyPressHandler);
            this.isOpen = !0
        },
        posDialogFields: function () {
            $(".dialog-header span").css("top", 9);
            if ($.browser.mozilla) $(".dialog-message").css("top",
            $(".dialog-message").css("top") + 2), $(".dialog-button span").css("top", 9), this.isRoomInfo ? $(".dialog-menu-container label").css("left", 48) : $(".dialog-input-label").css("top", 9), $(".dialog-checkbox-container label").css("top", 4), $(".room-info-description-label").css("top", 155), $("#dialog-room-info .dialog-input-label").css("top", 2), $(".dialog-soundcloud-button span").css("top", 8), $(".dialog-user-permissions-choice span").css("top", 12), $(".dialog-user-permissions-username").css("top", 1), $(".dialog-user-permissions-usertype").css("top",
            19);
            else if (Main.isChrome || Main.isSafari) $(".dialog-checkbox-container label").css("top", 1).css("left", 21), this.isRoomInfo && $(".dialog-menu-container label").css("left", 47).css("top", 4);
            Main.isSafari && ($(".room-info-description-label").css("top", 154), $("#dialog-room-info .dialog-input-label").css("top", 2));
            this.isRoomInfo || $(".dialog-menu-container label").css("left", 0)
        },
        closeDialog: function () {
            this.isPreview && (this.previewFrame && (this.previewFrame.attr("src", 'javascript:"<html></html>"').remove(),
            this.previewFrame = null), this.isPreview = !1, Playback.previewMute(!1));
            $("#dialog-box").html("");
            $("#dialog-container").hide();
            $(document).unbind("keydown", Dialog.onKeyPressHandler);
            this.submitFunc = this.context = null;
            this.importing = this.restrictedOpen = this.isOpen = !1;
            this.importItems = null;
            this.importIndex = -1;
            this.importTimeoutID && clearTimeout(this.importTimeoutID);
            this.importHash = this.importTimeoutID = null;
            this.isRoomInfo = this.ignoreEnter = this.forceCallback = !1;
            this.availableTimeoutID && clearTimeout(this.availableTimeoutID);
            this.hideAvailabilityProgress();
            this.lastUsername = null
        },
        getHeader: function (a) {
            return $("<div/>").addClass("dialog-header").append($("<span/>").html(a)).append($("<div/>").click($.proxy(this.closeDialog, this)).addClass("dialog-close-button")).append($("<div/>").addClass("dialog-header-line"))
        },
        getCancelButton: function () {
            return $("<div/>").addClass("dialog-button dialog-cancel-button").click($.proxy(this.closeDialog, this)).append($("<span/>").text(Lang.dialog.cancel))
        },
        getSubmitButton: function (a) {
            return $("<div/>").addClass("dialog-button dialog-submit-button").click(this.submitFunc).append($("<span/>").text(a))
        },
        getInputField: function (a, b, c, d, e, f) {
            a = $('<input type="text" name="' + a + '" placeholder="' + c + '" maxlength="' + e + '" onKeyPress="return Dialog.onKeyPressHandler(event)"/>').attr("value", d).data("ph", c).focus($.proxy(this.onInputFocus, this)).blur($.proxy(this.onInputBlur, this));
            f && a.attr("disabled", "disabled");
            return $("<div/>").addClass("dialog-input-container").append($("<span/>").addClass("dialog-input-label").text(b)).append($("<div/>").addClass("dialog-input-background").addClass("dialog-input").append(a))
        },
        getTextArea: function (a, b, c, d, e, f) {
            return $("<div/>").addClass("dialog-text-area-container").append($("<span/>").addClass("dialog-text-area-label").text(b)).append($("<textarea/>").attr("rows", d).attr("cols", e).attr("maxlength", f).attr("value", c).keyup(function () {
                var a = parseInt($(this).attr("maxlength"));
                $(this).val().length > a && $(this).val($(this).val().substr(0, $(this).attr("maxlength")))
            }))
        },
        getCheckBox: function (a, b, c, d) {
            var e = $("<input/>").attr("id", "dialog-checkbox-" + b).attr("type", "checkbox").attr("name",
            b).addClass("checkbox");
            c && e.attr("checked", "yes");
            d && e.attr("disabled", "disabled");
            return $("<div/>").addClass("dialog-checkbox-container-" + b).addClass("dialog-checkbox-container").append($("<label/>").attr("for", "dialog-checkbox-" + b).text(a)).append(e)
        },
        getMenu: function (a, b, c, d, e) {
            var f = $("<select/>").attr("id", "dialog-menu-" + b);
            e && f.attr("disabled", "disabled");
            for (var e = c.length, g = 0; g < e; ++g) c[g].hasOwnProperty("label") ? d == c[g].value ? f.append($('<option selected="selected" value="' + c[g].value + '">' + c[g].label + "</option>")) : f.append($('<option value="' + c[g].value + '">' + c[g].label + "</option>")) : d == c[g] ? f.append($('<option selected="selected">' + c[g] + "</option>")) : f.append($("<option>" + c[g] + "</option>"));
            return $("<div/>").addClass("dialog-menu-container-" + b).addClass("dialog-menu-container").append($("<label/>").attr("for", "dialog-menu-" + b).text(a)).append(f)
        },
        getLanguageMenu: function () {
            var a = Models.user.data.language || "en",
                b = $("<select/>").attr("id", "dialog-menu-language"),
                c = $("<optgroup/>").attr("label",
                Lang.dialog.userInterface),
                d = Models.chat.uiLanguages.length,
                e;
            for (e = 0; e < d; ++e) a == Models.chat.uiLanguages[e].value ? c.append($('<option selected="selected" value="' + Models.chat.uiLanguages[e].value + '">' + Models.chat.uiLanguages[e].label + "</option>")) : c.append($('<option value="' + Models.chat.uiLanguages[e].value + '">' + Models.chat.uiLanguages[e].label + "</option>"));
            b.append(c);
            c = $("<optgroup/>").attr("label", Lang.dialog.chatOnly);
            d = Models.chat.chatLanguages.length;
            for (e = 0; e < d; ++e) a == Models.chat.chatLanguages[e].value ? c.append($('<option selected="selected" value="' + Models.chat.chatLanguages[e].value + '">' + Models.chat.chatLanguages[e].label + "</option>")) : c.append($('<option value="' + Models.chat.chatLanguages[e].value + '">' + Models.chat.chatLanguages[e].label + "</option>"));
            b.append(c);
            return $("<div/>").addClass("dialog-menu-container-language").addClass("dialog-menu-container").append($("<label/>").attr("for", "dialog-menu-language").text(Lang.dialog.language)).append(b)
        },
        getMessage: function (a) {
            return $("<span/>").addClass("dialog-message").html(a)
        },
        onKeyPressHandler: function (a) {
            var b;
            if (window.event) b = window.event.keyCode;
            else if (a) b = a.which;
            else return !0;
            if (Dialog.importing) return !0;
            if (13 == b) {
                if (null != Dialog.submitFunc && (!Dialog.isRoomInfo || null == Dialog.context)) return a.preventDefault(), Dialog.submitFunc(), !1
            } else {
                if (27 == b) return a.stopPropagation(), a.preventDefault(), Dialog.forceCallback && null != Dialog.context && Dialog.context(), Dialog.closeDialog(), !1;
                "isUserProfile" == this.context && (this.availableTimeoutID && clearTimeout(this.availableTimeoutID),
                this.availableTimeoutID = setTimeout($.proxy(this.checkAvailability, this), 500))
            }
            return !0
        },
        onInputFocus: function (a) {
            $(a.target)[0].placeholder = ""
        },
        onInputBlur: function (a) {
            a = $(a.target);
            a[0].placeholder = a.data("ph")
        },
        checkAvailability: function () {
            clearTimeout(this.availableTimeoutID);
            var a = $("#dialog-user-profile").find("input").attr("value");
            if (a != this.lastUsername) if (this.lastUsername = a, a == Models.user.data.username) $("#username-availability").text(Lang.dialog.displayNameAvailable).css("color", "#42a5dc"),
            this.nameAvailable = !0;
            else if (1 < a.length) if (-1 == a.indexOf("http://")) $("#username-availability").text(""), this.showAvailabilityProgress(), (new UserDisplayNameAvailableService(a)).successCallback = $.proxy(this.onAvailabilityResponse, this);
            else this.onAvailabilityResponse(!1)
        },
        onAvailabilityResponse: function (a) {
            this.hideAvailabilityProgress();
            a ? $("#username-availability").text(Lang.dialog.displayNameAvailable).css("color", "#42a5dc") : $("#username-availability").text(Lang.dialog.displayNameNotAvailable).css("color",
                "#ff6f5b");
            this.nameAvailable = a
        },
        showAvailabilityProgress: function () {
            this.hideAvailabilityProgress();
            this.availabilityProgress = (new Spinner({
                lines: 8,
                length: 0,
                width: 3,
                radius: 4,
                color: "#fff"
            })).spin();
            $("#dialog-user-profile")[0].appendChild(this.availabilityProgress.el);
            $(this.availabilityProgress.el).css("position", "absolute").css("right", 22).css("top", 94)
        },
        hideAvailabilityProgress: function () {
            this.availabilityProgress && (this.availabilityProgress.stop(), this.availabilityProgress = null)
        }
    }),
    PopMenuView = Class.extend({
        init: function () {
            this.target = this.context = null;
            this.showing = !1
        },
        show: function (a, b) {
            this.context = b;
            this.target = a;
            this.showing = !0;
            for (var c = Models.playlist.data, d = $("<div/>").addClass("pop-menu").mouseleave($.proxy(this.onMenuOut, this)).append($("<ul/>")), e = c.length, f = 0; f < e; ++f) {
                var g = $("<span/>").text(c[f].name).addClass("pop-menu-row-label"),
                    h = $("<li/>").data("item", c[f]).mousedown($.proxy(this.onMenuClick, this)).append(g);
                c[f].id == Models.playlist.selectedPlaylistID && (h.addClass("pop-menu-active-playlist"),
                g.addClass("pop-menu-active-playlist-label"));
                d.append(h)
            }
            d.append($("<li/>").data("item", 0).mousedown($.proxy(this.onMenuClick, this)).append($("<span/>").addClass("pop-menu-row-label").text(Lang.media.addToNewPlaylist)));
            $("#pop-menu-container").html(d);
            c = Math.min(300, 27 * ++e);
            d = a.offset();
            e = d.left;
            f = d.top + a.height();
            f + c > $(window).height() && (f = d.top - c);
            $(".pop-menu").css("height", c);
            $(".pop-menu").css("left", e);
            $(".pop-menu").css("top", f);
            Main.isMac && $.browser.mozilla && $(".pop-menu li span").css("top",
            8);
            $("#pop-menu-container").show();
            $(document).mousedown($.proxy(this.onNonMenuClick, this))
        },
        hide: function () {
            this.showing = !1;
            $("#pop-menu-container").html("");
            $("#pop-menu-container").hide();
            $(document).unbind("mousedown", $.proxy(this.onNonMenuClick, this))
        },
        onMenuClick: function (a) {
            this.context && (a = $("body").find(a.currentTarget).data("item"), this.target.data("curate") ? a ? this.curateItem(a) : Dialog.createPlaylist(null, !0) : a ? Models.playlistMedia(a.id).mediaInsert(this.context, -1, this.context.length) : Dialog.createPlaylist(this.context));
            this.hide()
        },
        curateItem: function (a) {
            new DJCurateService(a.id)
        },
        onNonMenuClick: function (a) {
            $("body").find(a.target).hasClass("pop-menu") || this.hide()
        },
        onMenuOut: function () {
            this.hide()
        }
    }),
    Audience = Class.extend({
        init: function () {
            this.canvas = document.getElementById("audience-canvas");
            this.context = this.canvas.getContext("2d");
            this.context.fillStyle = "rgba(0,0,0,0)";
            this.imageMap = document.getElementById("map-canvas");
            this.imageMapContext = this.imageMap.getContext("2d");
            this.imageMapContext.fillStyle = "rgba(0,0,0,0)";
            this.gridData = new GridData;
            this.zoneColors = ["#33007F", "#80007F", "#990000", "#FF0000", "#FFFF00"];
            this.initRoomElements();
            this.frame = 0;
            this.avatarImages = {};
            this.images = [];
            this.full = !1;
            this.renderMap = !0;
            this.strobeOnSpeed = 50;
            this.strobeOffSpeed = 160;
            this.createColorLookup();
            this.renderedFrames = [];
            this.avatarTheme = "default";
            this.clear(!0);
            $(this.imageMap).hide();
            $("#audience").mousemove($.proxy(this.onMouseMove, this))
        },
        createColorLookup: function () {
            this.avatarColors = {};
            this.colorLookup = {};
            this.colorMap = {};
            var a, b;
            for (b = 0; 200 > b; ++b) a = 37 + b, 0 == a % 170 && (a += 121), this.colorLookup[a] = b + 1;
            var c = [].concat(AvatarOverlay.extended);
            b = AvatarOverlay.avatarSets.length;
            for (a = 0; a < b; ++a) for (var d = AvatarOverlay.avatarSets[a].length, e = 0; e < d; ++e) c = c.concat(AvatarOverlay.avatarSets[a][e].avatars);
            c = Utils.randomizeArray(c);
            b = c.length;
            for (a = 0; a < b; ++a) this.avatarColors[c[a]] = 1 + 2 * a
        },
        initRoomElements: function () {
            this.arch = new Image;
            this.arch.onload = function () {
                RoomUser.audience.onImageLoaded(this)
            };
            this.mountain = new Image;
            this.mountain.onload = function () {
                RoomUser.audience.onImageLoaded(this)
            };
            this.cactus = new Image;
            this.cactus.onload = function () {
                RoomUser.audience.onImageLoaded(this)
            };
            this.cloud = new Image;
            this.cloud.onload = function () {
                RoomUser.audience.onImageLoaded(this)
            };
            this.arch.src = "http://plug.dj/_/static/images/room_arch.1e738d58.png";
            this.mountain.src = "http://plug.dj/_/static/images/room_mountain.25436b97.png";
            this.cactus.src = "http://plug.dj/_/static/images/room_cactus.7017c2b7.png";
            this.cloud.src =
                "http://plug.dj/_/static/images/room_cloud.44227d4a.png";
            this.archHit = new Image;
            this.mountainHit = new Image;
            this.cactusHit = new Image;
            this.cloudHit = new Image;
            this.archHit.src = "http://plug.dj/_/static/images/room_arch_hit.ebd302a6.png";
            this.mountainHit.src = "http://plug.dj/_/static/images/room_mountain_hit.54d3fa90.png";
            this.cactusHit.src = "http://plug.dj/_/static/images/room_cactus_hit.b45f0bb2.png";
            this.cloudHit.src = "http://plug.dj/_/static/images/room_cloud_hit.59ec035a.png";
            this.defaultRoomElements()
        },
        defaultRoomElements: function () {
            this.roomElements = [{
                image: this.arch,
                hitArea: this.archHit,
                props: {
                    x: 46,
                    y: 102,
                    w: 177,
                    h: 110
                }
            }, {
                image: this.mountain,
                hitArea: this.mountainHit,
                props: {
                    x: 871,
                    y: 73,
                    w: 345,
                    h: 163
                }
            }, {
                image: this.cactus,
                hitArea: this.cactusHit,
                props: {
                    x: 988,
                    y: 160,
                    w: 113,
                    h: 125
                }
            }, {
                image: this.cloud,
                hitArea: this.cloudHit,
                props: {
                    x: 870,
                    y: 4,
                    w: 121,
                    h: 171
                }
            }]
        },
        onMouseMove: function (a) {
            var b = a.pageX - this.offset.left,
                a = a.pageY - this.offset.top,
                c = this.imageMapContext.getImageData(b, a, 1, 1);
            if (255 == c.data[3]) {
                var d;
                if (c = this.colorMap[this.colorLookup[255 * c.data[1] + c.data[2]]]) for (var e = c.length, f = 0; f < e; ++f) {
                    var g = c[f];
                    if (b > g.props.rect.l && b < g.props.rect.r && a > g.props.rect.t && a < g.props.rect.b) {
                        d = g.user;
                        break
                    }
                }
                d ? this.rollover.showSimple(d, b + this.offset.left, a + this.offset.top) : this.rollover.hide(!1)
            } else this.rollover.hide(!1)
        },
        setRenderMode: function (a) {
            this.render = a ? this.renderClip : this.renderNoClip
        },
        onImageLoaded: function () {
            ++this.loadCount;
            this.loadCount == this.images.length && (this.sortZIndex(), this.refresh(), this.draw())
        },
        clear: function (a) {
            this.gridData.clear();
            this.userImageMap = {};
            this.images = [];
            this.images = this.images.concat(this.roomElements);
            this.loadCount = a ? 0 : this.roomElements.length;
            this.context.clearRect(0, 0, 1230, 306);
            this.imageMapContext.clearRect(0, 0, 1230, 306);
            this.full = !1;
            this.colorMap = {};
            this.invisibleUsers = [];
            this.refresh()
        },
        refresh: function () {
            this.isRendered = !1;
            this.renderPass = 0;
            this.renderedFrames = Array(11)
        },
        draw: function () {
            var a;
            this.isRendered ? this.update() : (a = this.render()) ? 12 > ++this.renderPass ? this.renderedFrames[this.frame] = this.renderMap ? {
                audience: this.context.getImageData(0, 0, 1230, 306),
                map: this.imageMapContext.getImageData(0, 0, 1230, 306)
            } : {
                audience: this.context.getImageData(0, 0, 1230, 306)
            } : this.isRendered = !0 : this.refresh()
        },
        update: function () {
            this.renderedFrames[this.frame] && (this.context.putImageData(this.renderedFrames[this.frame].audience, 0, 0), this.renderMap && this.imageMapContext.putImageData(this.renderedFrames[this.frame].map, 0, 0))
        },
        renderClip: function () {
            this.context.clearRect(0, 0, 1230, 306);
            this.imageMapContext.clearRect(0,
            0, 1230, 306);
            for (var a = this.images.length, b = !0, c = 0; c < a; ++c) {
                var d = this.images[c];
                if (d.image && d.image.complete) if (d.user) {
                    var e = 1 == d.user.vote ? this.frame : 0;
                    this.context.save();
                    this.context.beginPath();
                    this.context.moveTo(d.props.x, d.props.y);
                    this.context.lineTo(d.props.x + d.props.w, d.props.y);
                    this.context.lineTo(d.props.x + d.props.w, d.props.y + d.props.h);
                    this.context.lineTo(d.props.x, d.props.y + d.props.h);
                    this.context.lineTo(d.props.x, d.props.y);
                    this.context.closePath();
                    this.context.fill();
                    this.context.clip();
                    this.context.drawImage(d.image, d.props.x - d.props.w * e, d.props.y, d.props.sw, d.props.h);
                    this.context.restore();
                    this.renderMap && (d.hitArea && d.hitArea.complete ? (this.imageMapContext.save(), this.imageMapContext.beginPath(), this.imageMapContext.moveTo(d.props.x, d.props.y), this.imageMapContext.lineTo(d.props.x + d.props.w, d.props.y), this.imageMapContext.lineTo(d.props.x + d.props.w, d.props.y + d.props.h), this.imageMapContext.lineTo(d.props.x, d.props.y + d.props.h), this.imageMapContext.lineTo(d.props.x, d.props.y),
                    this.imageMapContext.closePath(), this.imageMapContext.fill(), this.imageMapContext.clip(), this.imageMapContext.drawImage(d.hitArea, d.props.x - d.props.w * e, d.props.y, d.props.sw, d.props.h), this.imageMapContext.restore()) : b = !1)
                } else this.context.drawImage(d.image, d.props.x, d.props.y, d.props.w, d.props.h), this.imageMapContext.drawImage(d.hitArea, d.props.x, d.props.y, d.props.w, d.props.h);
                else b = !1
            }
            return b
        },
        renderNoClip: function () {
            this.context.clearRect(0, 0, 1230, 306);
            this.imageMapContext.clearRect(0, 0, 1230,
            306);
            for (var a = this.images.length, b = !0, c = 0; c < a; ++c) {
                var d = this.images[c];
                if (d.image && d.image.complete) if (d.user) {
                    var e = 1 == d.user.vote ? this.frame : 0;
                    this.context.save();
                    this.context.translate(d.props.x, d.props.y);
                    this.context.scale(d.props.scale, d.props.scale);
                    this.context.drawImage(d.image, d.props.ow * e, 0, d.props.ow, d.props.oh, 0, 0, d.props.ow, d.props.oh);
                    this.context.restore();
                    this.renderMap && (d.hitArea && d.hitArea.complete ? (this.imageMapContext.save(), this.imageMapContext.translate(d.props.x, d.props.y),
                    this.imageMapContext.scale(d.props.scale, d.props.scale), this.imageMapContext.drawImage(d.hitArea, d.props.ow * e, 0, d.props.ow, d.props.oh, 0, 0, d.props.ow, d.props.oh), this.imageMapContext.restore()) : b = !1)
                } else this.context.drawImage(d.image, d.props.x, d.props.y, d.props.w, d.props.h), this.imageMapContext.drawImage(d.hitArea, d.props.x, d.props.y, d.props.w, d.props.h);
                else b = !1
            }
            return b
        },
        addUser: function (a) {
            if (!this.full) {
                var b = this.gridData.addUser(a);
                !0 == b ? (this.createUser(a), this.sortZIndex(), this.refresh(),
                this.draw()) : !1 == b && (this.full = !0)
            }
            this.full && (b = this.gridData.getHighestPriority(), a.priority < b.priority && (this.removeUser(b.id, !0), this.addUser(a), a = Models.room.userHash[b.id]), this.invisibleUsers.push(a), this.invisibleUsers.sort(this.prioritySort))
        },
        prioritySort: function (a, b) {
            return a.priority < b.priority ? 1 : -1
        },
        removeUser: function (a, b) {
            this.gridData.removeUser(a) && (this.full = !1);
            var c;
            if (this.userImageMap[a]) {
                for (c = this.images.length; c--;) if (this.images[c] == this.userImageMap[a]) {
                    this.images.splice(c,
                    1);
                    --this.loadCount;
                    break
                }
                for (c = this.colorMap[this.userImageMap[a].color].length; c--;) if (this.colorMap[this.userImageMap[a].color][c].user.id == a) {
                    this.colorMap[this.userImageMap[a].color].splice(c, 1);
                    break
                }
                delete this.userImageMap[a];
                b || (this.refresh(), this.draw())
            } else for (c = this.invisibleUsers.length; c--;) if (this.invisibleUsers[c].id == a) {
                this.invisibleUsers.splice(c, 1);
                break
            }!this.full && !b && 0 < this.invisibleUsers.length && this.addUser(this.invisibleUsers.shift())
        },
        createUser: function (a) {
            for (var b = a._position.r, c = a._position.c, d = (1 - this.gridData.backScale) / this.gridData.rows, e = a.id != Models.user.data.id ? 114 : 117, f = 0.5, g = this.gridData.cellSize * f, h = 0; h < b; ++h) f = d * h + this.gridData.backScale, g = this.gridData.cellSize * f, h < b && (e += g);
            d = 15 + (1200 - this.gridData.cellSize * this.gridData.columns * f) / 2;
            b = this.avatarColors[a.avatarID] || 1;
            c = this.userImageMap[a.id] = {
                user: a,
                avatarID: a.avatarID,
                color: b,
                props: {
                    x: ~~ (d + c * g + g / 2 - Avatars.audience.w / 2 * f),
                    y: ~~ (e + g / 2 - Avatars.audience.h * f),
                    w: Avatars.audience.w * f,
                    h: Avatars.audience.h * f,
                    sw: Avatars.audience.sw * f,
                    scale: f,
                    ox: d + c * g + g / 2 - Avatars.audience.w / 2,
                    oy: e + g / 2 - Avatars.audience.h,
                    ow: Avatars.audience.w,
                    oh: Avatars.audience.h
                }
            };
            c.props.rect = {
                l: Math.round(c.props.x + 35 * c.props.scale),
                t: Math.round(c.props.y + 50 * c.props.scale),
                r: Math.round(c.props.x + c.props.w - 35 * c.props.scale),
                b: Math.round(c.props.y + c.props.h - 5 * c.props.scale)
            };
            this.colorMap["" + b] || (this.colorMap["" + b] = []);
            this.colorMap["" + b].push(c);
            this.avatarImages[a.avatarID] ? (c.image = this.avatarImages[a.avatarID], this.loadHitArea(c)) : this.loadAvatar(c);
            this.images.push(this.userImageMap[a.id])
        },
        updateUser: function (a) {
            if (this.userImageMap[a.id]) {
                var b = this.gridData.userMap[a.id];
                b.avatarID = a.avatarID;
                for (var c = b._position.r, d = b._position.c, e = (1 - this.gridData.backScale) / this.gridData.rows, f = a.id != Models.user.data.id ? 114 : 117, g = 0.5, h = this.gridData.cellSize * g, j = 0; j < c; ++j) g = e * j + this.gridData.backScale, h = this.gridData.cellSize * g, j < c && (f += h);
                c = 15 + (1200 - this.gridData.cellSize * this.gridData.columns * g) / 2;
                a = this.userImageMap[a.id];
                a.avatarID = b.avatarID;
                a.props = {
                    x: ~~ (c + d * h + h / 2 - Avatars.audience.w / 2 * g),
                    y: ~~ (f + h / 2 - Avatars.audience.h * g),
                    w: Avatars.audience.w * g,
                    h: Avatars.audience.h * g,
                    sw: Avatars.audience.sw * g,
                    scale: g,
                    ox: c + d * h + h / 2 - Avatars.audience.w / 2,
                    oy: f + h / 2 - Avatars.audience.h,
                    ow: Avatars.audience.w,
                    oh: Avatars.audience.h
                };
                a.props.rect = {
                    l: Math.round(a.props.x + 35 * a.props.scale),
                    t: Math.round(a.props.y + 35 * a.props.scale),
                    r: Math.round(a.props.x + a.props.w - 35 * a.props.scale),
                    b: Math.round(a.props.y + a.props.h - 5 * a.props.scale)
                };
                this.avatarImages[b.avatarID] ? (a.image = this.avatarImages[b.avatarID], this.loadHitArea(a, !0)) : this.loadAvatar(a, !0)
            }
        },
        sortZIndex: function () {
            var a = this.mountain,
                b = this.arch;
            this.images.sort(function (c, d) {
                var e = ~~ (c.props.y + c.props.h),
                    f = ~~ (d.props.y + d.props.h);
                if (c.user && d.user) {
                    if (c.user.id == Models.user.data.id) return 1;
                    if (d.user.id == Models.user.data.id) return -1;
                    c.user.priority < d.user.priority ? e += 0.5 : c.user.priority > d.user.priority && (e -= 0.5)
                } else if (c.image == a || c.image == b) e -= 15;
                else if (d.image == a || d.image == b) f -= 15;
                return e > f ? 1 : e < f + f ? -1 : 0
            });
            for (var c, d, e = null, f = this.images.length; f--;) this.images[f].image == this.cloud ? c = f : this.images[f].image == this.mountain ? d = f : this.images[f].user && this.images[f].user.id == Models.user.data.id && (e = f);
            var g;
            c && (g = this.images.splice(c, 1)[0]);
            null != e && (e = this.images.splice(e, 1)[0]) && this.images.push(e);
            g && this.images.splice(d + (c < d ? 0 : 1), 0, g);
            for (f = this.images.length; f--;) this.images[f].props.zindex = f;
            for (var h in this.colorMap) this.colorMap[h].sort(function (a, b) {
                return a.props.zindex > b.props.zindex ? 1 : a.props.zindex < b.props.zindex ? -1 : 0
            })
        },
        loadAvatar: function (a, b) {
            var c = new Image;
            c.onload = function () {
                RoomUser.audience.onAvatarLoaded(this, a, b)
            };
            c.src = AvatarManifest.getAvatarUrl(this.avatarTheme, a.user.avatarID, "")
        },
        onAvatarLoaded: function (a, b, c) {
            b.image = a;
            this.loadHitArea(b, c)
        },
        loadHitArea: function (a, b) {
            var c = new Image,
                d = "" + a.color;
            c.onload = function () {
                RoomUser.audience.onHitAreaLoaded(this, a, b)
            };
            c.src = AvatarManifest.getHitUrl(a.user.avatarID, d)
        },
        onHitAreaLoaded: function (a, b, c) {
            b.hitArea = a;
            if (c) this.refresh(),
            this.draw();
            else this.onImageLoaded()
        },
        lightsOut: function (a) {
            return 0 < this.gridData.userCount || !a ? (a ? ($(this.canvas).hide(), $(this.imageMap).show(), this.strobeState = !1) : ($(this.canvas).show(), $(this.imageMap).hide(), this.strobeState = !0), !0) : !1
        },
        strobeMode: function (a) {
            return 0 < this.gridData.userCount && (this.lightsOut(!1), this.strobeTimeoutID && clearTimeout(this.strobeTimeoutID), a) ? (this.strobeTimeoutID = setTimeout($.proxy(this.strobeSwap, this), this.strobeOffSpeed), !0) : !1
        },
        strobeSwap: function () {
            this.lightsOut(this.strobeState);
            clearTimeout(this.strobeTimeoutID);
            this.strobeTimeoutID = this.strobeState ? setTimeout($.proxy(this.strobeSwap, this), this.strobeOnSpeed) : setTimeout($.proxy(this.strobeSwap, this), this.strobeOffSpeed)
        },
        drawGrid: function () {
            for (var a = (1 - this.gridData.backScale) / this.gridData.rows, b = 114, c = 0; c < this.gridData.rows; ++c) {
                for (var d = a * c + this.gridData.backScale, e = this.gridData.cellSize * d, d = 15 + (1200 - this.gridData.cellSize * this.gridData.columns * d) / 2, f = 0; f < this.gridData.columns; ++f) {
                    var g = Utils.hexToRGB(this.getCellColor(c,
                    f)),
                        h = this.getCellAlpha(c, f);
                    this.context.fillStyle = "rgba(" + g.red + ", " + g.green + ", " + g.blue + ", " + h + ")";
                    this.context.fillRect(d + f * e, b, e - 1, e - 1)
                }
                b += e
            }
        },
        getCellAlpha: function (a, b) {
            return this.gridData.getPriorityLevelForCellAt(a, b) / 100
        },
        getCellColor: function (a, b) {
            var c = this.gridData.getZoneIDsForCellAt(a, b);
            c.sort();
            return 0 < c.length ? this.zoneColors[c[c.length - 1] - 1] : "#333333"
        }
    }),
    DJBooth = Class.extend({
        init: function () {
            this.bCanvas = document.getElementById("booth-canvas");
            this.bContext = this.bCanvas.getContext("2d");
            this.bContext.fillStyle = "rgba(0,0,0,0)";
            this.djCanvas = document.getElementById("dj-canvas");
            this.djContext = this.djCanvas.getContext("2d");
            this.djContext.fillStyle = "rgba(0,0,0,0)";
            this.avatarImages = {};
            this.images = [];
            this.frame = 0;
            this.avatarTheme = "default";
            $("#dj-booth").mousemove($.proxy(this.onMouseMove, this));
            $("#dj-booth").mouseleave($.proxy(this.onMouseLeave, this));
            this.clear()
        },
        onMouseMove: function (a) {
            var b = a.pageX - this.offset.left,
                a = a.pageY - this.offset.top,
                c = this.images.length;
            4 < c && 40 < b && 94 > b ? this.rollover.showSimple(this.images[4].user, this.offset.left + 62, this.offset.top + Math.min(25, a)) : 3 < c && 117 < b && 171 > b ? this.rollover.showSimple(this.images[3].user, this.offset.left + 139, this.offset.top + Math.min(25, a)) : 2 < c && 204 < b && 248 > b ? this.rollover.showSimple(this.images[2].user, this.offset.left + 216, this.offset.top + Math.min(25, a)) : 1 < c && 271 < b && 325 > b ? this.rollover.showSimple(this.images[1].user, this.offset.left + 293, this.offset.top + Math.min(25, a)) : 0 < c && 515 < b && 675 > b ? this.rollover.showSimple(this.images[0].user,
            this.offset.left + 596, this.offset.top + Math.min(25, a)) : this.rollover.hide()
        },
        onMouseLeave: function () {
            this.rollover.hide()
        },
        clear: function () {
            this.bContext.clearRect(0, 0, 375, 205);
            this.djContext.clearRect(0, 0, 170, 220);
            this.userImageMap = {};
            this.loadCount = this.images.length = 0;
            this.refresh()
        },
        setData: function (a) {
            this.userImageMap = {};
            this.loadCount = this.images.length = 0;
            this.refresh();
            for (var b = a.length, c = 0; c < b; ++c) this.createUser(a[c], c)
        },
        createUser: function (a, b) {
            var c, d = 0;
            0 < b ? (c = Avatars.booth, d = 77 * (5 - b - 1)) : c = Avatars.dj;
            c = this.userImageMap[a.id] = {
                user: a,
                avatarID: a.avatarID,
                slot: b,
                props: {
                    x: d,
                    y: 0,
                    w: c.w,
                    h: c.h,
                    scale: 1,
                    sw: c.sw,
                    ox: d,
                    oy: 0,
                    ow: c.w,
                    oh: c.h
                }
            };
            this.avatarImages[a.avatarID] ? (c.image = 0 < b ? this.avatarImages[a.avatarID + "b"] : this.avatarImages[a.avatarID + "dj"], ++this.loadCount) : this.loadAvatar(c);
            this.images.push(this.userImageMap[a.id])
        },
        updateUser: function (a) {
            if (this.userImageMap[a.id]) {
                var b, c = 0,
                    d = this.userImageMap[a.id];
                0 < d.slot ? (b = Avatars.booth, c = 77 * (5 - d.slot - 1)) : b = Avatars.dj;
                d.avatarID = a.avatarID;
                d.props = {
                    x: c,
                    y: 0,
                    w: b.w,
                    h: b.h,
                    scale: 1,
                    sw: b.sw,
                    ox: c,
                    oy: 0,
                    ow: b.w,
                    oh: b.h
                };
                this.avatarImages[a.avatarID] ? (d.image = this.avatarImages[a.avatarID], this.refresh()) : this.loadAvatar(d, !0)
            }
        },
        loadAvatar: function (a, b) {
            var c = new Image;
            c.onload = function () {
                RoomUser.djBooth.onAvatarLoaded(this, a, b)
            };
            c.src = AvatarManifest.getAvatarUrl(this.avatarTheme, a.user.avatarID, 0 < a.slot ? "b" : "dj")
        },
        onAvatarLoaded: function (a, b, c) {
            b.image = a;
            if (c || ++this.loadCount == this.images.length) this.refresh(), this.draw()
        },
        refresh: function () {
            this.isRendered = !1;
            this.renderPass = 0;
            this.renderedFrames = Array(11)
        },
        draw: function () {
            if (this.isRendered) this.update();
            else if (this.render()) {
                if (!Main.isMac || !Main.isSafari) 12 > ++this.renderPass ? this.renderedFrames[this.frame] = {
                    booth: this.bContext.getImageData(0, 0, 375, 205),
                    dj: this.djContext.getImageData(0, 0, 170, 220)
                } : this.isRendered = !0
            } else this.refresh()
        },
        update: function () {
            this.renderedFrames[this.frame].dj && this.djContext.putImageData(this.renderedFrames[this.frame].dj, 0, 0);
            this.renderedFrames[this.frame].booth && this.bContext.putImageData(this.renderedFrames[this.frame].booth, 0, 0)
        },
        setRenderMode: function (a) {
            this.render = a ? this.renderClip : this.renderNoClip
        },
        renderClip: function () {
            this.bContext.clearRect(0, 0, 375, 205);
            this.djContext.clearRect(0, 0, 170, 220);
            for (var a = !0, b = this.images.length; b--;) {
                var c = this.images[b];
                if (c.image && c.image.complete) {
                    var d = 1 == c.user.vote || 0 == b ? this.frame : 0,
                        e = 0 < b ? this.bContext : this.djContext;
                    e.save();
                    e.beginPath();
                    e.moveTo(c.props.x, c.props.y);
                    e.lineTo(c.props.x + c.props.w, c.props.y);
                    e.lineTo(c.props.x + c.props.w, c.props.y + c.props.h);
                    e.lineTo(c.props.x, c.props.y + c.props.h);
                    e.lineTo(c.props.x, c.props.y);
                    e.closePath();
                    e.fill();
                    e.clip();
                    e.drawImage(c.image, c.props.x - c.props.w * d, c.props.y, c.props.sw, c.props.h);
                    e.restore()
                } else a = !1
            }
            return a
        },
        renderNoClip: function () {
            this.bContext.clearRect(0, 0, 375, 205);
            this.djContext.clearRect(0, 0, 170, 220);
            for (var a = !0, b = this.images.length; b--;) {
                var c = this.images[b];
                if (c.image && c.image.complete) {
                    var d = 1 == c.user.vote || 0 == b ? this.frame : 0,
                        e = 0 < b ? this.bContext : this.djContext;
                    e.save();
                    e.translate(c.props.x, c.props.y);
                    e.scale(c.props.scale, c.props.scale);
                    e.drawImage(c.image, c.props.ow * d, 0, c.props.ow, c.props.oh, 0, 0, c.props.ow, c.props.oh);
                    e.restore()
                } else a = !1
            }
            return a
        }
    }),
    SearchView = Class.extend({
        init: function () {
            this.data = [];
            this.format = "1";
            this.ytSuggestService = new YouTubeSuggestService;
            this.ytSuggestService.callback = $.proxy(this.onSuggestUpdate, this);
            this.suggestTimeoutID = -1;
            this.query = "";
            this.suggestIndex = -1;
            this.suggestions = [];
            this.suggestSelecting = this.submitPending = !1;
            this.suggestHideTimeoutID = -1;
            this.searchInput = $("#search-form input").focus($.proxy(this.onSearchFocus, this)).blur($.proxy(this.onSearchBlur, this))[0];
            this.filterInput = $("#filter-form input").focus($.proxy(this.onFilterFocus, this)).blur($.proxy(this.onFilterBlur, this))[0];
            this.documentClickProxy = $.proxy(this.onDocumentClick, this);
            $("#media-search-youtube-button").click($.proxy(this.onYouTubeClick, this));
            $("#media-search-soundcloud-button").click($.proxy(this.onSoundCloudClick, this));
            $("#media-search-playlists-button").click($.proxy(this.onSearchPlaylistsClick,
            this));
            $("#button-playlist-help").click($.proxy(this.onPlaylistHelpClick, this));
            $("#button-playlist-import").click($.proxy(this.onPlaylistImportClick, this));
            $("#button-clear-search").click($.proxy(this.onClearSearchClick, this));
            $("#button-clear-filter").click($.proxy(this.onClearFilterClick, this))
        },
        onKeyUp: function (a, b) {
            var c;
            if (window.event) c = window.event.keyCode;
            else if (b) c = b.which;
            else return !0;
            if ("0" != this.format) {
                this.suggestSelecting = this.submitPending = !1;
                if (40 == c || 38 == c) {
                    this.suggestSelecting = !0;
                    40 == c ? ++this.suggestIndex : --this.suggestIndex; - 2 == this.suggestIndex ? this.suggestIndex = this.suggestions.length - 1 : this.suggestIndex == this.suggestions.length && (this.suggestIndex = -1);
                    var d = this.suggestIndex;
                    $(".search-suggestion-item").each(function (a) {
                        if (a == d) {
                            $(this).css("background-color", "#45a8dc").css("color", "#FFF");
                            $(".search-input input")[0].value = $(this).data("value")
                        } else $(this).css("background-color", "#FFF").css("color", "#000")
                    }); - 1 == this.suggestIndex && (this.searchInput.value = this.query);
                    a.setSelectionRange(a.value.length, a.value.length);
                    0 == a.value.length ? $("#button-clear-search").hide() : $("#button-clear-search").show();
                    return !1
                }
                if (27 == c) this.query = a.value = "", this.onSuggestUpdate(null), clearTimeout(this.suggestTimeoutID), $("#button-clear-search").hide();
                else {
                    if (13 == c && "" != a.value) b.preventDefault(), this.onSubmitSearch(b);
                    else {
                        this.query = a.value; - 1 < this.suggestTimeoutID && clearTimeout(this.suggestTimeoutID);
                        if ("" != a.value) this.suggestTimeoutID = setTimeout($.proxy(this.onSuggestTimeout,
                        this), 100);
                        else this.onSuggestUpdate([]);
                        0 == a.value.length ? $("#button-clear-search").hide() : $("#button-clear-search").show()
                    }
                    return !1
                }
            } else {
                if (27 == c) this.query = a.value = "", clearTimeout(this.suggestTimeoutID), $("#button-clear-search").hide();
                else return 13 == c && "" != a.value ? (b.preventDefault(), this.format = "1", this.updateSearchPlaceholder(), this.onSubmitSearch(b)) : (this.query = a.value, 0 == a.value.length ? $("#button-clear-search").hide() : $("#button-clear-search").show(), MediaOverlay.onSearchLocal(this.query.toLowerCase())), !1;
                this.onSuggestUpdate(null)
            }
            0 == a.value.length ? $("#button-clear-search").hide() : $("#button-clear-search").show();
            return !0
        },
        onFilterKeyUp: function (a, b) {
            var c;
            if (window.event) c = window.event.keyCode;
            else if (b) c = b.which;
            else return !0;
            27 == c && (a.value = "");
            MediaOverlay.onFilter(a.value.toLowerCase());
            0 < a.value.length ? ($("#button-clear-filter").show(), $("#filter-search-icon").hide()) : ($("#button-clear-filter").hide(), $("#filter-search-icon").show());
            return !0
        },
        clearInputs: function () {
            this.searchInput.value =
                "";
            this.filterInput.value = "";
            $("#button-clear-search").hide();
            $("#button-clear-filter").hide();
            $("#filter-search-icon").show()
        },
        onClearSearchClick: function () {
            this.query = this.searchInput.value = "";
            this.onSuggestUpdate(null);
            clearTimeout(this.suggestTimeoutID);
            $("#button-clear-search").hide();
            if ("0" == this.format) MediaOverlay.onSearchLocal(this.query);
            _gaq.push(["_trackEvent", "Actions", "Clear Search"])
        },
        onClearFilterClick: function () {
            this.filterInput.value = "";
            MediaOverlay.onFilter("");
            $("#button-clear-filter").hide();
            $("#filter-search-icon").show();
            _gaq.push(["_trackEvent", "Actions", "Clear Filter"])
        },
        onSubmitSearch: function (a, b) {
            var c = this.searchInput.value;
            if (0 == c.indexOf("http")) {
                var d = Utils.validateIncomingURL(c);
                d && (c = d)
            }
            this.submitPending = !0;
            this.onSuggestUpdate(null);
            MediaOverlay.onSearch(c);
            "0" == this.format && (this.format = "1", this.updateSearchPlaceholder());
            Models.search.load(c, this.format, 0);
            b ? _gaq.push(["_trackEvent", "Actions", "Search : Suggestion : " + ("1" == this.format ? "YouTube" : "SoundCloud"), c]) : _gaq.push(["_trackEvent",
                "Actions", "Search : " + ("1" == this.format ? "YouTube" : "SoundCloud"), c])
        },
        onYouTubeClick: function () {
            this.format = "1" == this.format && SC ? "2" : "1";
            this.updateSearchPlaceholder()
        },
        onSoundCloudClick: function () {
            SC ? (this.format = "2" == this.format ? "1" : "2", this.updateSearchPlaceholder()) : Dialog.alert('SoundCloud is currently unavailable. Please check their <a href="http://status.soundcloud.com/" target="_blank">status page</a> for more information.')
        },
        onSearchPlaylistsClick: function () {
            if ("0" == this.format) this.format =
                "1";
            else if (this.format = "0", 0 < this.query.length) MediaOverlay.onSearchLocal(this.query);
            this.updateSearchPlaceholder()
        },
        onPlaylistImportClick: function () {
            MediaOverlay.showImport();
            _gaq.push(["_trackEvent", "Actions", "Playlist Import"])
        },
        onPlaylistHelpClick: function () {
            MediaOverlay.showHelp();
            _gaq.push(["_trackEvent", "Actions", "Playlist Help"])
        },
        onSoundCloudImportClick: function () {
            this.format = "2";
            this.updateSearchPlaceholder();
            this.searchInput.value = "";
            $("#button-clear-search").hide();
            this.submitPending = !0;
            this.onSuggestUpdate(null);
            Dialog.soundCloudImport();
            _gaq.push(["_trackEvent", "Actions", "Import", "SoundCloud"])
        },
        onYouTubeImportClick: function () {
            Dialog.youtubeImport();
            _gaq.push(["_trackEvent", "Actions", "Import", "YouTube"])
        },
        updateSearchPlaceholder: function () {
            "1" == this.format ? ($("#media-search-youtube-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonYouTubeSelected.bc32da34.png)"), $("#media-search-soundcloud-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonSoundCloud.d926e88c.png)"),
            $("#media-search-playlists-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonSearchPlaylists.91ec7277.png)"), this.searchInput.placeholder = Lang.media.searchYouTube) : "2" == this.format ? ($("#media-search-youtube-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonYouTube.b2658cd8.png)"), $("#media-search-soundcloud-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonSoundCloudSelected.21e7d25d.png)"), $("#media-search-playlists-button").css("background-image",
                "url(http://plug.dj/_/static/images/ButtonSearchPlaylists.91ec7277.png)"), this.searchInput.placeholder = Lang.media.searchSoundCloud) : "0" == this.format && ($("#media-search-youtube-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonYouTube.b2658cd8.png)"), $("#media-search-soundcloud-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonSoundCloud.d926e88c.png)"), $("#media-search-playlists-button").css("background-image", "url(http://plug.dj/_/static/images/ButtonSearchPlaylistsSelected.7d9ae995.png)"),
            this.searchInput.placeholder = Lang.media.searchPlaylists)
        },
        onSuggestTimeout: function () {
            clearTimeout(this.suggestTimeoutID);
            if (0 < this.query.length) this.ytSuggestService.load(this.query);
            else this.onSuggestUpdate([])
        },
        onSuggestUpdate: function (a) {
            this.suggestIndex = -1;
            if (a && 0 < a.length && !this.submitPending) {
                this.suggestions = a;
                for (var b = $("<ul/>").addClass("search-suggestion-list"), c = a.length, d = 0; d < c; ++d) {
                    var e = $("<li/>").addClass("search-suggestion-item").click($.proxy(this.onSuggestionClick, this)).mouseenter($.proxy(this.onSuggestionOver,
                    this)).mouseleave($.proxy(this.onSuggestionOut, this)).data("value", a[d]).data("index", d).append($("<span/>").html(this.query + "<strong>" + a[d].substr(this.query.length) + "</strong>"));
                    b.append(e)
                }
                $("#media-search-suggestion").html(b);
                $("#media-search-suggestion").show();
                $(document).mousedown(this.documentClickProxy)
            } else this.hideSuggestions()
        },
        onSuggestionClick: function (a) {
            this.searchInput.value = $(a.currentTarget).data("value");
            this.onSubmitSearch(a, !0)
        },
        onSuggestionOver: function (a) {
            var b = this.suggestIndex = $(a.currentTarget).data("index");
            $(".search-suggestion-item").each(function (a) {
                a == b ? $(this).css("background-color", "#45a8dc").css("color", "#FFF") : $(this).css("background-color", "#FFF").css("color", "#000")
            })
        },
        onSuggestionOut: function (a) {
            $(a.currentTarget).css("background-color", "#FFF").css("color", "#000")
        },
        onDocumentClick: function () {
            $("#media-search-suggestion").is(":visible") && (clearTimeout(this.suggestHideTimeoutID), this.suggestHideTimeoutID = setTimeout($.proxy(this.hideSuggestions, this), 150))
        },
        hideSuggestions: function () {
            this.suggestIndex = -1;
            this.suggestions = [];
            clearTimeout(this.suggestHideTimeoutID);
            $("#media-search-suggestion").is(":visible") && ($("#media-search-suggestion").html(""), $("#media-search-suggestion").hide());
            $(document).unbind("mousedown", this.documentClickProxy)
        },
        onSearchFocus: function () {
            this.searchInput.placeholder = ""
        },
        onFilterFocus: function () {
            this.filterInput.placeholder = ""
        },
        onSearchBlur: function () {
            this.updateSearchPlaceholder()
        },
        onFilterBlur: function () {
            this.filterInput.placeholder = Lang.html.filterPlaylist
        },
        onTTImportClick: function (a) {
            if (window.File && window.FileReader && window.FileList && window.Blob) if (a = a.target.files, 0 < a.length) {
                var b = new FileReader;
                b.onload = function (a) {
                    Dialog.importTT(a.target.result)
                };
                b.readAsText(a[0]);
                _gaq.push(["_trackEvent", "Actions", "Import", "Turntable"])
            } else _gaq.push(["_trackEvent", "Actions", "Import", "Turntable : Cancel"]);
            else alert("This browser does not support the feature required to import from tt.")
        }
    }),
    ChatView = Class.extend({
        init: function () {
            $("#button-chat-sound").click($.proxy(this.onChatSoundClick, this));
            $("#button-chat-expand").click($.proxy(this.onChatExpandClick,
            this));
            $("#button-chat-collapse").click($.proxy(this.onChatCollapseClick, this));
            $("#button-chat-popout").click($.proxy(this.onChatPopoutClick, this));
            this.chatInput = $("#chat-input-field").focus($.proxy(this.onChatFocus, this)).blur($.proxy(this.onChatBlur, this))[0];
            this.chatMessages = $("#chat-messages");
            this.chatOverProxy = $.proxy(this.onChatOver, this);
            this.chatOutProxy = $.proxy(this.onChatOut, this);
            this.chatDeleteClickProxy = $.proxy(this.onDeleteChatClick, this);
            this.documentClickProxy = $.proxy(this.onDocumentClick,
            this);
            this.fromClickProxy = $.proxy(this.onFromClick, this);
            this.suggestionContainer = $("#chat-mention-suggestion");
            this.suggestionItemContainer = $("#chat-mention-suggestion-items");
            this.suggestions = [];
            this.suggestIndex = -1
        },
        ready: function () {
            Models.chat.addEventListener("chatSoundUpdate", $.proxy(this.onChatSoundUpdate, this));
            Models.chat.addEventListener("chatDelete", $.proxy(this.onChatDelete, this));
            Models.chat.addEventListener("chatReceived", $.proxy(this.onChatReceived, this));
            Models.chat.addEventListener("chatClear",
            $.proxy(this.onChatClear, this));
            Models.chat.addEventListener("timestampUpdate", $.proxy(this.onTimestampUpdate, this));
            Models.chat.ready()
        },
        onChatSoundUpdate: function (a) {
            $("#button-chat-sound").css("background-image", a.image);
            $("#button-chat-sound span").text(a.text)
        },
        onChatClear: function () {
            this.chatMessages.html("").scrollTop(0)
        },
        onChatFocus: function () {
            this.chatInput.placeholder = ""
        },
        onChatBlur: function () {
            this.chatInput.placeholder = Lang.html.chatPlaceholder
        },
        onKeyPress: function (a, b) {
            var c;
            if (window.event) c = window.event.keyCode;
            else if (b) c = b.which;
            else return !0;
            return (13 == c || 9 == c) && 0 < this.suggestions.length ? (b.preventDefault(), b.stopImmediatePropagation(), this.submitSuggestion(), !1) : 13 == c && "" != a.value ? (Models.chat.sendChat(a.value) && (this.chatInput.value = "", b.preventDefault()), this.chatMessages.scrollTop(this.chatMessages[0].scrollHeight), !1) : !0
        },
        onKeyUp: function (a, b) {
            var c;
            if (window.event) c = window.event.keyCode;
            else if (b) c = b.which;
            else return !0;
            this.suggestions = [];
            var d = this.getCaratPosition();
            if (0 < d) {
                var e = this.chatInput.value.substr(0, d),
                    f = e.lastIndexOf(" @"); - 1 == f && (f = e.indexOf("@")); - 1 < f && (0 == f ? this.suggestions = Models.room.mentionLookup(e.substr(f + 1, d)) : 0 < f && d > f + 2 && (this.suggestions = Models.room.mentionLookup(e.substr(f + 2, d))))
            }
            if (9 == c && 0 < this.suggestions.length) return b.preventDefault(), b.stopImmediatePropagation(), !1;
            40 == c || 38 == c ? (40 == c ? ++this.suggestIndex : --this.suggestIndex, -1 == this.suggestIndex ? this.suggestIndex = this.suggestions.length - 1 : this.suggestIndex == this.suggestions.length && (this.suggestIndex = 0), this.updateSelectedSuggestion()) : this.updateSuggestions();
            return !0
        },
        onChatReceived: function (a) {
            var a = a.message,
                b = $("<div/>").addClass("chat-" + a.type);
            if (a.from) {
                var c = $("<span/>").addClass(a.from.class).text(a.from.value);
                a.from.clickable && c.addClass("chat-from-clickable").data("fromID", a.from.id).click(this.fromClickProxy);
                a.from.admin ? b.addClass("chat-admin") : a.from.ambassador ? b.addClass("chat-ambassador") : a.from.owner ? b.addClass("chat-host") : a.from.staff && (4 == a.from.staff ? b.addClass("chat-cohost") : 3 == a.from.staff ? b.addClass("chat-manager") : 2 == a.from.staff && b.addClass("chat-bouncer"));
                a.from.id && (a.chatID && (b.addClass("chat-id-" + a.chatID), a.deletable && b.addClass("chat-deletable").mouseenter(this.chatOverProxy).mouseleave(this.chatOutProxy).append($("<div/>").addClass("chat-delete-button").data("chatID", a.chatID).click(this.chatDeleteClickProxy))), b.append($("<div/>").addClass("chat-timestamp").text(a.timestamp)));
                b.append(c)
            }
            b.append($("<span/>").addClass("chat-text").html(a.text));
            a.lang && b.append($("<span/>").addClass("chat-language").html(a.lang.html).attr("title", a.lang.title));
            c = this.chatMessages.scrollTop() > this.chatMessages[0].scrollHeight - this.chatMessages.height() - 20;
            this.chatMessages.append(b);
            a.showTimestamp && $(".chat-timestamp").show();
            Main.isMac && $.browser.mozilla && ($(".chat-message, .chat-whisper, .chat-emote, .chat-play, .chat-skip, .chat-moderation, .chat-system, .chat-update").css("padding-top", 7), $(".chat-timestamp").css("padding-top", 2));
            c && this.chatMessages.scrollTop(this.chatMessages[0].scrollHeight);
            !Popout && a.sound && (b = $("*:focus")[0], (!b || !("INPUT" == b.nodeName && "chat-input-field" == b.id)) && this.playSound(a.sound))
        },
        playSound: function (a) {
            if ("chat" == a) try {
                document.getElementById("chat-sound").playChatSound()
            } catch (b) {} else try {
                document.getElementById("chat-sound").playMentionSound()
            } catch (c) {}
        },
        onTimestampUpdate: function (a) {
            $(".chat-timestamp").each(function () {
                var b = $(this),
                    c = b.text(),
                    d = -1 < c.indexOf("am") || -1 < c.indexOf("pm");
                if ("24" == a.value && d) d = c.split(":")[0], -1 < c.indexOf("pm") && (d = parseInt(d) + 12), b.text(d + ":" + c.substr(0, c.length - 2).split(":")[1]);
                else if ("12" == a.value && !d) {
                    var d = parseInt(c.split(":")[0]),
                        e = "am";
                    12 < d && (e = "pm", d -= 12);
                    b.text(d + ":" + c.split(":")[1] + e)
                }
            });
            a.value ? $(".chat-timestamp").show() : $(".chat-timestamp").hide()
        },
        onChatDelete: function (a) {
            $(".chat-id-" + a.chatID).each(function () {
                $(this).removeClass("chat-deletable chat-id-" + a.chatID + " chat-emote chat-message chat-admin chat-ambassador  chat-host chat-moderator chat-mention").attr("title", "").html("").unbind("mouseenter",
                this.chatOverProxy).unbind("mouseleave", this.chatOutProxy).addClass("chat-moderation").append($("<span/>").addClass("chat-text").text(a.username + " deleted this message"))
            })
        },
        onFromClick: function (a) {
            var b = $(a.currentTarget).data("fromID");
            if (b) if (Popout) Popout.Chat.onFromClick(a, b);
            else {
                var c = Models.room.userHash[b] || Models.room.nirUserHash[b];
                if (c) this.onShowChatUser(c, {
                    x: $("#chat").offset().left,
                    y: $(a.currentTarget).offset().top
                });
                else this.getExternalUser(b, {
                    x: $("#chat").offset().left,
                    y: $(a.currentTarget).offset().top
                },
                $.proxy(this.onShowChatUser, this));
                _gaq.push(["_trackEvent", "Actions", "Chat : Username Click", Models.room.data.id])
            }
        },
        onShowChatUser: function (a, b) {
            a && !Models.room.userHash[a.id] && (Models.room.nirUserHash[a.id] = a);
            RoomUser.rollover.showChat(a, b.x, b.y)
        },
        getExternalUser: function (a, b, c) {
            (new UserGetByIdsService([a], b)).successCallback = c
        },
        onChatOver: function (a) {
            $(a.currentTarget).find(".chat-delete-button").show()
        },
        onChatOut: function (a) {
            $(a.currentTarget).find(".chat-delete-button").hide()
        },
        onDeleteChatClick: function (a) {
            Models.chat.deleteChat($(a.currentTarget).hide().data("chatID"))
        },
        onChatSoundClick: function () {
            Models.chat.toggleChatSound()
        },
        onChatExpandClick: function () {
            this.expand();
            _gaq.push(["_trackEvent", "Actions", "Chat : Expand"])
        },
        onChatCollapseClick: function () {
            this.collapse();
            $("#button-chat-expand").show();
            $("#button-chat-collapse").hide();
            _gaq.push(["_trackEvent", "Actions", "Chat : Collapse"])
        },
        expand: function () {
            $("#chat").height(580);
            this.chatMessages.height(504);
            $("#bottom-chat-line").css("top", 549);
            $(".chat-input").css("top", 554);
            $("#button-chat-expand").hide();
            $("#button-chat-collapse").css("top",
            550).show();
            this.chatMessages.scrollTop(this.chatMessages[0].scrollHeight)
        },
        collapse: function () {
            $("#chat").height(281);
            this.chatMessages.height(205);
            $("#bottom-chat-line").css("top", 250);
            $(".chat-input").css("top", 255);
            $("#button-chat-collapse").css("top", 251).hide();
            $("#button-chat-expand").show();
            this.chatMessages.scrollTop(this.chatMessages[0].scrollHeight)
        },
        onChatPopoutClick: function () {
            Popout = window.open("/_/popout/", "chatpopout", "width=348,height=424,location=no,menubar=no,titlebar=no,status=no,toolbar=no,resizable=yes,left=" + (screen.width - 348) / 2 + ",top=" + (screen.height - 424) / 2);
            $("#chat").hide();
            _gaq.push(["_trackEvent", "Actions", "Chat : Popout"])
        },
        hide: function () {
            $("#chat").hide()
        },
        closePopout: function () {
            Popout = null;
            $("#chat").show();
            setTimeout(function () {
                Chat.chatMessages.scrollTop(Chat.chatMessages[0].scrollHeight)
            }, 50)
        },
        getMentionRange: function () {
            var a = this.getCaratPosition();
            if (0 < a) {
                var b = this.chatInput.value.substr(0, a),
                    c = b.lastIndexOf(" @"); - 1 == c ? c = b.indexOf("@") : ++c;
                return [c + 1, a]
            }
        },
        getCaratPosition: function () {
            if (this.chatInput.createTextRange) {
                var a = document.selection.createRange().duplicate();
                a.moveEnd("character", this.chatInput.value.length);
                return "" == a.text ? this.chatInput.value.length : this.chatInput.value.lastIndexOf(a.text)
            }
            return this.chatInput.selectionStart
        },
        updateSuggestions: function () {
            var a = this.suggestions.length;
            this.suggestionItemContainer.html("");
            if (0 == a) this.suggestionContainer.hide(), this.suggestIndex = -1;
            else {
                for (var b = 0; b < a; ++b) {
                    var c = $("<span/>").text(this.suggestions[b].username);
                    this.suggestionItemContainer.append($("<div/>").addClass("chat-mention-suggestion-item").data("index",
                    b).append($('<img src="' + AvatarManifest.getThumbUrl(this.suggestions[b].avatarID) + '"/>')).append(c).append($("<div/>").addClass("chat-mention-suggestion-item-line")).mousedown($.proxy(this.onSuggestionPress, this)).mouseenter($.proxy(this.onSuggestionOver, this)))
                }
                if (-1 == this.suggestIndex || this.suggestIndex >= a) this.suggestIndex = 0;
                this.updateSelectedSuggestion();
                this.suggestionContainer.height(21 * a);
                this.suggestionContainer.css("top", $("#bottom-chat-line").offset().top - 21 * a);
                setTimeout($.proxy(this.showChatMentions,
                this), 10);
                setTimeout($.proxy(this.showChatMentions, this), 15);
                $(document).mousedown(this.documentClickProxy)
            }
        },
        onSuggestionPress: function (a) {
            this.suggestIndex = $(a.currentTarget).data("index");
            this.submitSuggestion();
            setTimeout($.proxy(this.onRefocusInput, this), 100)
        },
        onRefocusInput: function () {
            this.chatInput.focus()
        },
        onSuggestionOver: function (a) {
            var b = this.suggestIndex = $(a.currentTarget).data("index");
            $(".chat-mention-suggestion-item").each(function (a) {
                a == b ? $(this).css("background", "#45a8dc") : $(this).css("background",
                    "transparent")
            })
        },
        submitSuggestion: function () {
            var a = this.getMentionRange(),
                b = this.chatInput.value.substr(0, a[0]),
                c = this.chatInput.value.substr(a[1]);
            this.chatInput.value = b + this.suggestions[this.suggestIndex].username + " " + c;
            this.chatInput.setSelectionRange(a[0] + this.suggestions[this.suggestIndex].username.length + 1, a[0] + this.suggestions[this.suggestIndex].username.length + 1);
            this.suggestions = [];
            this.suggestIndex = -1;
            this.updateSuggestions()
        },
        updateSelectedSuggestion: function () {
            var a = this.suggestIndex;
            $(".chat-mention-suggestion-item").each(function (b) {
                b == a ? $(this).css("background", "#45a8dc") : $(this).css("background", "transparent")
            })
        },
        showChatMentions: function () {
            var a = 0;
            $(".chat-mention-suggestion-item span").each(function () {
                var b = $(this).width();
                b > a && (a = b)
            });
            this.suggestionContainer.width(a + 32);
            this.suggestionContainer.show()
        },
        onDocumentClick: function () {
            this.suggestionContainer.is(":visible") && (clearTimeout(this.suggestHideTimeoutID), this.suggestHideTimeoutID = setTimeout($.proxy(this.hideSuggestions,
            this), 150))
        },
        hideSuggestions: function () {
            this.suggestIndex = -1;
            this.suggestions = [];
            clearTimeout(this.suggestHideTimeoutID);
            this.suggestionContainer.is(":visible") && (this.suggestionItemContainer.html(""), this.suggestionContainer.hide());
            $(document).unbind("mousedown", this.documentClickProxy)
        }
    });
swfobject.embedSWF("http://plug.dj/_/static/swf/sfx.dea53bdb.swf", "chat-sound", "1", "1", "10", null, null, {
    quality: "high",
    wmode: "opaque",
    allowScriptAccess: "always",
    allowFullScreen: "false",
    bgcolor: "#000000"
}, {
    id: "chat-sound"
});
var Main, Slug, Playback, Chat, Room, RoomUser, TransactionManager, Utils, Models, MediaOverlay, UserListOverlay, AvatarOverlay, Avatars, Dialog, PopMenu, Search, rpcGW, DB, LS, Lobby, API, SocketListener, SC, WML, Popout, isiOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/i) ? !0 : !1,
    isAndroid = -1 < navigator.userAgent.indexOf("android"),
    EXT = EXT || {}, MainView = Class.extend({
        init: function () {
            this.WIDTH = 1200;
            this.LEFT = 0;
            DB = new LSDatabase;
            LS = new LSLocalStore;
            Utils = new Utilities;
            TransactionManager = new GAETransactionManager;
            Models = new ModelRef;
            Playback = new PlaybackView;
            Chat = new ChatView;
            Room = new RoomView;
            RoomUser = new RoomUserView;
            Dialog = new DialogView;
            MediaOverlay = new MediaOverlayView;
            AvatarOverlay = new AvatarOverlayView;
            UserListOverlay = new UserListOverlayView;
            Search = new SearchView;
            Lobby = new LobbyOverlayView;
            PopMenu = new PopMenuView;
            WML = new WindowMessageListener;
            rpcGW = new RPCGateway("/_/gateway/");
            this.isMac = -1 < navigator.platform.toLowerCase().indexOf("mac");
            this.isSafari = -1 < navigator.userAgent.indexOf("Safari") && -1 == navigator.userAgent.indexOf("Chrome");
            this.isChrome = -1 < navigator.userAgent.indexOf("Chrome");
            var a = $.browser;
            this.isMac ? ($(".chat-title").css("top", 7), $("#chat-bubble").css("margin-top", -5), $(".overlay-title").css("top", 18), $("#avatar-rollover-username").css("top", 4), $("#avatar-rollover-usertype").css("top", 22), $("#avatar-rollover-points").css("top", 40), $("#avatar-rollover-fans").css("top", 56), $("#avatar-rollover-plays").css("top", 72), $(".room-score-item").css("background-position", "0 6px"), a.mozilla ? ($("#current-room-info span").css("top",
            1), $("#current-room-users span").css("top", 1), $("#current-room-history span").css("top", 1), $("#current-room-value").css("top", 9), $("#current-dj-value").css("top", 24), $("#now-playing-value").css("top", 66), $("#time-remaining-value").css("top", 119), $("#playback-buffering").css("top", 130), $(".room-score-item").css("top", 2), $(".room-score-item span").css("top", 2), $(".meta-header span").css("top", 5), $("#your-next-play").css("top", 6), $("#up-next").css("top", 22), $("#button-chat-sound span").css("top", 3),
            $("#user-points-value").css("top", 2), $("#user-fans-value").css("top", 2), $(".chat-input").css("top", 256), $(".user-score-count").css("top", -1), $(".user-score-title").css("top", 14), $("#media-menu-your-playlists").css("top", 16), $("#media-menu-your-playlists span").css("top", 2), $("#media-panel-title").css("top", 12), $("#media-panel-count").css("top", 13), $(".menu-item-label").css("top", 8), $("#related-back-button span").css("top", 2), $("#footer-links").css("top", 11), $(".avatar-overlay-set-button span").css("top",
            8)) : ($("#meta-queue").css("top", 243), this.isChrome && ($("#time-remaining-value").css("top", 119), $("#room-score-value").css("top", 119)))) : a.mozilla && ($("#current-room-info span").css("top", -1), $("#current-room-users span").css("top", -1), $("#current-room-history span").css("top", -1), $(".room-score-item").css("background-position", "0 8px"));
            this.isChrome && ($("#button-chat-sound span").css("top", 0), this.isMac || $(".meta-header span").css("top", 3));
            $(window).resize($.proxy(this.onWindowResize, this))
        },
        ready: function () {
            $("#meta-frame").show();
            $("#room-wheel").show();
            $("#playback").show();
            $("#chat").show();
            $("#user-container").show();
            $("#pending-djs").show();
            $("#dj-booth").show();
            $("#footer-container").show();
            $("#audience").show();
            Lang.ready();
            Chat.ready();
            Lobby.ready();
            Playback.ready();
            RoomUser.ready();
            Room.ready();
            EXT && EXT.ready && EXT.ready();
            this.onWindowResize(null);
            MediaOverlay.showRoomProgress();
            150 != DB.settings.avatarcap && 200 != DB.settings.avatarcap && log("Avatar Cap override at " + DB.settings.avatarcap)
        },
        onWindowResize: function (a) {
            this.LEFT = Math.max(0, ($(window).width() - this.WIDTH) / 2);
            $("body").css("background-position", ($(window).width() - 1920) / 2 + "px 0");
            var b = $("#meta-frame");
            b.css("left", this.LEFT);
            b = $("#playback");
            b.css("left", this.LEFT + 353);
            b = $("#footer-container");
            b.css("left", this.LEFT + this.WIDTH - b.width());
            var b = $("#chat"),
                c = this.LEFT + this.WIDTH - b.width();
            b.css("left", c);
            b = $("#chat-mention-suggestion");
            b.css("left", c);
            b = $("#room-wheel");
            b.css("left", this.LEFT - 46);
            b = $("#audience");
            b.css("left", this.LEFT);
            b = b.offset();
            b.left -= 15;
            RoomUser.audience.offset = b;
            if (b = $("#dj-booth")) b.css("left", this.LEFT), RoomUser.djBooth.offset = b.offset();
            b = $("#user-container");
            b.css("left", this.LEFT + this.WIDTH - b.width());
            b = $("#media-overlay");
            b.css("left", this.LEFT + (this.WIDTH - b.width()) / 2);
            b.css("top", (687 - b.height()) / 2);
            b = $("#avatar-overlay");
            b.css("left", this.LEFT + (this.WIDTH - b.width()) / 2);
            b.css("top", (687 - b.height()) / 2);
            b = $("#lobby-overlay");
            b.css("left", this.LEFT + (this.WIDTH - b.width()) / 2);
            b.css("top", (687 - b.height()) / 2);
            b = $("#user-list-overlay");
            b.css("left", this.LEFT + (this.WIDTH - b.width()) / 2);
            b = $(".modal-background");
            b.css("width", Math.max(1200, $(window).width()));
            b.css("height", Math.max(746, $(window).height()));
            b = $(".dialog");
            b.css("left", this.LEFT + (this.WIDTH - b.width()) / 2);
            b.css("top", (687 - b.height()) / 2);
            if (EXT && EXT.onWindowResize) EXT.onWindowResize(a)
        },
        drawSocialButtons: function () {
            this.sd || (this.sd = !0, $("head").append('<script type="text/javascript" src="https://apis.google.com/js/plusone.js"><\/script>').append('<script>(function(d, s, id) {var js, fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) return;js = d.createElement(s); js.id = id;js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=216041638480603";fjs.parentNode.insertBefore(js, fjs);}(document, "script", "facebook-jssdk"));(function(d,s,id) {var js,fjs=d.getElementsByTagName(s)[0];if (d.getElementById(id)) return;js = d.createElement(s);js.id = id;js.src = "//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}(document,"script","twitter-wjs"));<\/script>'),
            $("#footer-social").show())
        }
    });

function log(a) {
    Models.chat.receive({
        type: "update",
        message: a
    })
}
function onDocumentReady() {
    API = new APIDispatcher;
    SocketListener = new SocketMessageListener;
    Main = new MainView;
    Main.ready();
    socketInit(0);
    log(Lang.messages.welcome.split("%VERSION%").join(VERSION));
    log(Lang.chat.commands);
    DB.settings.streamDisabled && log("<strong>Video/audio streaming disabled")
}

function uiLockout() {
    $("body").html("");
    $("body").append($("<div/>").html("<h1>You have logged in from another location.</h1>").css("position", "absolute").css("left", 17))
}
$(document).ready(onDocumentReady);