//# sourceMappingURL=./logger.js.map
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
var fs,chalk,months,levels;fs=require("fs");chalk=require("chalk");months="Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");levels={success:["green"],info:["white"],warning:["yellow","underline"],error:["bgRed","white","bold"]};function pad(b){return 10>b?"0"+b.toString(10):b.toString(10)}function timestamp(){var b=new Date,a=[pad(b.getHours()),pad(b.getMinutes()),pad(b.getSeconds())].join(":");return[pad(b.getDate()),months[b.getMonth()],a].join(" ")}
function chalkPaint(b,a){var c=chalk,d;for(d in b)b.hasOwnProperty(d)&&(c=c[b[d]]);return c(a)}
function Logger(b){function a(b){return function(){var a=Array.prototype.slice.call(arguments);a.unshift(b);c.apply(this,a)}}function c(){var a=Array.prototype.slice.call(arguments),c="info";void 0!==levels[a[0]]&&(c=a.shift());a.unshift(Array(10-b.length-2).join(" "));a.unshift("["+b+"]");a.unshift(Array(10-c.length-2).join(" "));a.unshift(chalkPaint(levels[c],"["+c.toUpperCase()+"]"));a.unshift(timestamp());d.consoleOutput&&console.log.apply(console,a);d.fileOutput&&fs.appendFileSync(d.filePath,
chalk.stripColor(a.join(" "))+"\n")}var d={fileOutput:!1,filePath:"",consoleOutput:!0};return{settings:d,success:a("success"),info:a("info"),warn:a("warning"),warning:a("warning"),error:a("error")}}module.exports=Logger;
