//# sourceMappingURL=./utils.js.map
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
exports.levenshtein=function(c,g){var e=c.length,f=g.length,d=[],a,b;if(!e)return f;if(!f)return e;for(a=0;a<=e;a++)d[a]=[a];for(b=0;b<=f;b++)d[0][b]=b;for(b=1;b<=f;b++)for(a=1;a<=e;a++)d[a][b]=c[a-1]==g[b-1]?d[a-1][b-1]:Math.min(d[a-1][b],d[a][b-1],d[a-1][b-1])+1;return d[e][f]};exports.uppercase=function(c){var g=c.length;c=c.match(/[A-Z]/g);return null!=c?c.length/g:0};
