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
var util=require("util"),songHistory=[],that,Room=function(){that=this;this.User=function(a){this.avatarID=a.avatarID?a.avatarID:"";this.badge=a.badge?a.badge:0;this.blurb=a.blurb?a.blurb:"";this.curated=!0===that.grabs[a.id];this.ep=a.ep?a.ep:0;this.gRole=a.gRole?a.gRole:0;this.id=a.id?a.id:-1;this.ignores=a.ignores?a.ignores:void 0;this.joined=a.joined?a.joined:"";this.language=a.language?a.language:"";this.level=a.level?a.level:0;this.notifications=a.notifications?a.notifications:void 0;this.pVibes=
a.pVibes?a.pVibes:void 0;this.pw=a.pw?a.pw:!1;this.slug=a.slug?a.slug:"";this.status=a.status?a.status:0;this.username=a.username?a.username:"";this.vote=void 0!==that.votes[a.id]?"woot"===that.votes[a.id]?1:-1:0;this.xp=a.xp?a.xp:0};this.User.prototype.toString=function(){return this.username};this.booth={currentDJ:-1,isLocked:!1,shouldCycle:!0,waitingDJs:[]};this.fx=[];this.grabs={};this.meta={description:"",favorite:!1,hostID:-1,hostName:"",id:-1,name:"",population:0,slug:"",welcome:""};this.mutes=
{};this.playback={historyID:"",media:{author:"",cid:"",duration:-1,format:-1,id:-1,image:"",title:""},playlistID:-1,startTime:""};this.self={};this.role=0;this.users=[];this.votes={}};Room.prototype.usersToArray=function(a){var b,c;c=[];for(var d in a)a.hasOwnProperty(d)&&(b=this.getUser(a[d]),null!=b&&c.push(b));return c};
Room.prototype.reset=function(){this.booth={currentDJ:-1,isLocked:!1,shouldCycle:!0,waitingDJs:[]};this.fx=[];this.grabs={};this.meta={description:"",favorite:!1,hostID:-1,hostName:"",id:-1,name:"",population:0,slug:"",welcome:""};this.mutes={};this.playback={historyID:"",media:{author:"",cid:"",duration:-1,format:-1,id:-1,image:"",title:""},playlistID:-1,startTime:""};this.role=0;this.users=[];this.votes={}};Room.prototype.addUser=function(a){a.id!==this.self.id&&this.users.push(a)};
Room.prototype.removeUser=function(a){for(var b in this.users)if(this.users.hasOwnProperty(b)&&this.users[b].id==a){delete this.users[b];break}};Room.prototype.updateUser=function(a){for(var b in this.users)if(this.users.hasOwnProperty(b)&&this.users[b].id===a.i){for(var c in a)a.hasOwnProperty(c)&&"i"!=c&&(this.users[b][c]=a[c]);break}};Room.prototype.setSelf=function(a){this.self=a};
Room.prototype.setRoomData=function(a){this.booth=a.booth;this.fx=a.fx;this.grabs=a.grabs;this.meta=a.meta;this.mutes=a.mutes;this.playback=a.playback;this.self.role=a.role;this.users=a.users;this.votes=a.votes};Room.prototype.setDJs=function(a){this.booth.waitingDJs=a};Room.prototype.setMedia=function(a,b){this.votes={};this.grabs={};this.playback.media=a;this.playback.startTime=b};
Room.prototype.advance=function(a){1>songHistory.length?setImmediate(this.advance,a):(songHistory[0].room=this.getRoomScore(),this.setMedia(a.m,a.t),this.setDJs(a.d),this.booth.currentDJ=a.c,this.playback.historyID=a.h,this.playback.playlistID=a.p,a={id:a.h,media:a.m,room:{name:this.meta.name,slug:this.meta.slug},score:{positive:0,listeners:null,grabs:0,negative:0,skipped:0},timestamp:a.t,user:{id:a.c,username:null===this.getUser(a.c)?"":this.getUser(a.c).username}},50<songHistory.unshift(a)&&songHistory.splice(50,
songHistory.length-50))};Room.prototype.setGrab=function(a){this.grabs[a]=1};Room.prototype.setVote=function(a,b){this.votes[a]=b};Room.prototype.setEarn=function(a){this.self.xp=a.xp;this.self.ep=a.ep;this.self.level=a.level};Room.prototype.getUsers=function(){return this.usersToArray([this.getSelf().id].concat(function(){var a=[],b;for(b in that.users)that.users.hasOwnProperty(b)&&a.push(that.users[b].id);return a}()))};
Room.prototype.getUser=function(a){if(!a||a===this.getSelf().id)return this.getSelf();for(var b in this.users)if(this.users.hasOwnProperty(b)&&this.users[b].id===a)return new this.User(this.users[b]);return null};Room.prototype.getSelf=function(){return null!=this.self?new this.User(this.self):null};Room.prototype.getDJ=function(){return 0<this.booth.currentDJ?this.getUser(this.booth.currentDJ):null};Room.prototype.getDJs=function(){return this.usersToArray([this.booth.currentDJ].concat(this.booth.waitingDJs))};
Room.prototype.getWaitList=function(){return this.usersToArray(this.booth.waitingDJs)};Room.prototype.getWaitListPosition=function(a){var b=this.getDJs(),c=0,d;for(d in b)if(b.hasOwnProperty(d)){if(b[d].id===a)return c;c++}return-1};Room.prototype.getAudience=function(){var a=[],b;b=[this.self].concat(this.users);for(var c in b)if(b.hasOwnProperty(c)){var d=b[c].id;this.booth.currentDJ!=d&&0>this.booth.waitingDJs.indexOf(d)&&a.push(d)}return this.usersToArray(a)};
Room.prototype.getStaff=function(){var a=[],b;b=[this.self].concat(this.users);for(var c in b)if(b.hasOwnProperty(c)){var d=b[c];0<d.role&&a.push(d.id)}return this.usersToArray(a)};Room.prototype.getHost=function(){return this.getUser(this.meta.hostID)};Room.prototype.getMedia=function(){return this.playback.media};Room.prototype.getStartTime=function(){return this.playback.startTime};Room.prototype.getHistory=function(){return songHistory};Room.prototype.setHistory=function(a){songHistory=a};
Room.prototype.getRoomScore=function(){var a={positive:0,listeners:Math.max(this.getUsers().length-1,0),grabs:0,negative:0,skipped:0},b,c=this.votes;for(b in c)if(c.hasOwnProperty(b)){var d=c[b];0<d?a.positive++:0>d&&a.negative++}c=this.grabs;for(b in c)c.hasOwnProperty(b)&&0<c[b]&&a.grabs++;return a};module.exports=Room;
