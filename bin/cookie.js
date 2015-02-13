//# sourceMappingURL=./cookie.js.map
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
var fs=require("fs"),path=require("path"),cookies={},cookiePath=path.resolve(__dirname,"..","cookies.tmp"),cookieKey="";exports.clear=function(){cookies={}};exports.contain=function(a){return null!=cookies[cookieKey][a]};exports.load=function(){return fs.existsSync(cookiePath)?(cookies=JSON.parse(fs.readFileSync(cookiePath)),!0):!1};exports.save=function(){fs.writeFileSync(cookiePath,JSON.stringify(cookies))};
exports.fromHeaders=function(a){for(var b in a)if(a.hasOwnProperty(b)&&"set-cookie"==b)for(var d in a[b])if(a[b].hasOwnProperty(d)){var c,e;c=a[b][d].split(";")[0].split("=");e=c.shift();c=c.join("=");void 0==cookies[cookieKey]&&(cookies[cookieKey]={});cookies[cookieKey][e]=c}};exports.toString=function(){var a=[],b;for(b in cookies[cookieKey])cookies[cookieKey].hasOwnProperty(b)&&a.push(b+"="+cookies[cookieKey][b]);return a.join("; ")};
function CookieHandler(a){cookieKey=a;this.clear=exports.clear;this.contain=exports.contain;this.load=exports.load;this.save=exports.save;this.fromHeaders=exports.fromHeaders;this.toString=exports.toString}module.exports=CookieHandler;
