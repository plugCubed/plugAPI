//# sourceMappingURL=./bufferObject.js.map
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
var util=require("util");
function BufferObject(c,d,b){if("function"!=typeof d)throw Error("BufferObject requires a update function");b=b||6E4;return{lastUpdate:c?Date.now():0,data:c||null,set:function(a){this.data=a;this.lastUpdate=Date.now()},get:function(a){if(null!=this.data&&(0>b||this.lastUpdate>=Date.now()-b))"function"==typeof a&&a(this.data);else{var e=this;d(function(b,c){b?e.get():(e.set(c),"function"==typeof a&&a(c))})}},push:function(a){this.get();util.isArray(this.data)&&this.data.push(a)},remove:function(a){this.get();
for(var b in this.data)if(this.data.hasOwnProperty(b)&&this.data[b]==a){this.data.splice(b,1);break}},removeAt:function(a){this.get();util.isArray(this.data)&&a<this.data.length&&this.data.splice(a,1)}}}module.exports=BufferObject;
