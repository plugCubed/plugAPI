//# sourceMappingURL=./eventObjectTypes.js.map
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
function AdvanceEventObject(a){return{media:a.m,startTime:a.t,historyID:a.h,djs:a.d,currentDJ:a.c,playlistID:a.p}}exports.advance=AdvanceEventObject;var encoder=require("node-html-encoder").Encoder("entity");function ChatEventObject(a,b){return{raw:a,id:a.cid,from:b.getUser(a.uid),message:encoder.htmlDecode(a.message),mentions:[],muted:b.isMuted(a.uid),type:0===a.message.indexOf("/me")?"emote":-1<a.message.indexOf("@"+b.getSelf().username)?"mention":"message"}}exports.chat=ChatEventObject;
function ChatLevelUpdateObject(a,b){return{raw:a,id:a.u,user:b.getUser(a.u),level:a.m}}exports.roomMinChatLevelUpdate=ChatLevelUpdateObject;
