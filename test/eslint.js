'use strict';

var lint = require('mocha-eslint');

var paths = [
    'lib/**/*.js',
    'test/*.js'
];

var options = {};

lint(paths, options);
