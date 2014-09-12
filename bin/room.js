//# sourceMappingURL=./room.js.map
require('source-map-support').install();
/*The MIT License
===============

Copyright (c) 2014 Chris Vickery, Thomas "TAT" Andresen and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.*/
var util=require("util"),songHistory=[],Room=function(){var b=this;this.User=function(a){this.avatarID=a.avatarID?a.avatarID:"";this.badge=a.badge?a.badge:0;this.blurb=a.blurb?a.blurb:"";this.curated=!0===b.grabs[a.id];this.ep=a.ep?a.ep:0;this.gRole=a.gRole?a.gRole:0;this.id=a.id?a.id:-1;this.ignores=a.ignores?a.ignores:void 0;this.joined=a.joined?a.joined:"";this.language=a.language?a.language:"";this.level=a.level?a.level:0;this.notifications=a.notifications?a.notifications:void 0;this.pVibes=a.pVibes?
a.pVibes:void 0;this.pw=a.pw?a.pw:!1;this.slug=a.slug?a.slug:"";this.status=a.status?a.status:0;this.username=a.username?a.username:"";this.vote=void 0!==b.votes[a.id]?"woot"===b.votes[a.id]?1:-1:0;this.xp=a.xp?a.xp:0};this.User.prototype.toString=function(){return this.username};this.booth={currentDJ:-1,isLocked:!1,shouldCycle:!0,waitingDJs:[]};this.fx=[];this.grabs={};this.meta={description:"",favorite:!1,hostID:-1,hostName:"",id:-1,name:"",population:0,slug:"",welcome:""};this.mutes={};this.playback=
{historyID:"",media:{author:"",cid:"",duration:-1,format:-1,id:-1,image:"",title:""},playlistID:-1,startTime:""};this.self={};this.role=0;this.users=[];this.votes={}};Room.prototype.usersToArray=function(b){var a,c;c=[];for(var d in b)b.hasOwnProperty(d)&&(a=this.getUser(b[d]),null!=a&&c.push(a));return c};
Room.prototype.reset=function(){this.booth={currentDJ:-1,isLocked:!1,shouldCycle:!0,waitingDJs:[]};this.fx=[];this.grabs={};this.meta={description:"",favorite:!1,hostID:-1,hostName:"",id:-1,name:"",population:0,slug:"",welcome:""};this.mutes={};this.playback={historyID:"",media:{author:"",cid:"",duration:-1,format:-1,id:-1,image:"",title:""},playlistID:-1,startTime:""};this.role=0;this.users=[];this.votes={}};Room.prototype.addUser=function(b){b.id!==this.self.id&&this.users.push(b)};
Room.prototype.removeUser=function(b){for(var a in this.users)if(this.users.hasOwnProperty(a)&&this.users[a].id==b){delete this.users[a];break}};Room.prototype.updateUser=function(b){for(var a in this.users)if(this.users.hasOwnProperty(a)&&this.users[a].id===b.i){for(var c in b)b.hasOwnProperty(c)&&"i"!=c&&(this.users[a][c]=b[c]);break}};Room.prototype.setSelf=function(b){this.self=b};
Room.prototype.setRoomData=function(b){this.booth=b.booth;this.fx=b.fx;this.grabs=b.grabs;this.meta=b.meta;this.mutes=b.mutes;this.playback=b.playback;this.self.role=b.role;this.users=b.users;this.votes=b.votes};Room.prototype.setDjs=function(b){this.booth.waitingDJs=b};
Room.prototype.setMedia=function(b,a,c,d){var e;null==c&&(c={});null==d&&(d={});this.media={info:b,startTime:a,stats:{votes:{},curates:{}}};for(e in c)c.hasOwnProperty(e)&&(b=c[e],this.media.stats.votes[e]=1===b?"woot":"meh");b=[];for(e in d)d.hasOwnProperty(e)&&(c=d[e],b.push(this.media.stats.curates[e]=c));return b};
Room.prototype.advance=function(b){1>songHistory.length?setImmediate(this.advance,b):(songHistory[0].room=this.getRoomScore(),this.setMedia(b.media,b.mediaStartTime),b={id:b.historyID,media:b.media,room:{name:this.meta.name,slug:this.meta.slug},score:{positive:0,listeners:null,grabs:0,negative:0,skipped:0},timestamp:b.mediaStartTime,user:{id:b.currentDJ,username:null===this.getUser(b.currentDJ)?"":this.getUser(b.currentDJ).username}},50<songHistory.unshift(b)&&songHistory.splice(50,songHistory.length-
50))};Room.prototype.setGrab=function(b){this.grabs[b]=1};Room.prototype.setVote=function(b,a){this.votes[b]=a};Room.prototype.setEarn=function(b){var a=this.getDJ();if(null!=a)for(var c in this.users)if(this.users.hasOwnProperty(c)&&this.users[c].id===a.id){this.users[c].xp=b.xp;this.users[c].ep=b.ep;this.users[c].level=b.level;break}};Room.prototype.getUsers=function(){return this.usersToArray([this.getSelf()].concat(this.users))};
Room.prototype.getUser=function(b){if(!b)return this.getSelf();for(var a in this.users)if(this.users.hasOwnProperty(a)&&this.users[a].id===b)return new this.User(this.users[a]);return null};Room.prototype.getSelf=function(){return null!=this.self?new this.User(this.self):null};Room.prototype.getDJ=function(){return 0<this.booth.currentDJ?this.getUser(this.booth.currentDJ):null};Room.prototype.getDJs=function(){return this.usersToArray([this.booth.currentDJ].concat(this.booth.waitingDJs))};
Room.prototype.getAudience=function(){var b=[],a;a=[this.self].concat(this.users);for(var c in a)if(a.hasOwnProperty(c)){var d=a[c].id;this.booth.currentDJ!=d&&0>this.booth.waitingDJs.indexOf(d)&&b.push(d)}return this.usersToArray(b)};Room.prototype.getStaff=function(){var b=[],a;a=[this.self].concat(this.users);for(var c in a)if(a.hasOwnProperty(c)){var d=a[c];0<d.role&&b.push(d.id)}return this.usersToArray(b)};Room.prototype.getHost=function(){return this.getUser(this.meta.hostID)};
Room.prototype.getMedia=function(){return this.playback.media};Room.prototype.getStartTime=function(){return this.playback.startTime};Room.prototype.getHistory=function(){return songHistory};Room.prototype.setHistory=function(b){songHistory=b};
Room.prototype.getRoomScore=function(){var b={positive:0,listeners:Math.max(this.getUsers().length-1,0),grabs:0,negative:0,skipped:0},a,c=this.votes;for(a in c)if(c.hasOwnProperty(a)){var d=c[a];0<d?b.positive++:0>d&&b.negative++}c=this.grabs;for(a in c)c.hasOwnProperty(a)&&0<c[a]&&b.grabs++;return b};module.exports=Room;
