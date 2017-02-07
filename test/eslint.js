'use strict';

const lint = require('mocha-eslint');
const paths = [
    'lib/**/*.js',
    'test/*.js'
];
const options = {};

lint(paths, options);
