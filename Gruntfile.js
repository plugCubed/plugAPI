var fs = require('fs');

module.exports = function(grunt) {
    grunt.initConfig({
        closurecompiler: {
            minify: {
                files: {
                    './bin/client.js': ['./src/client.js'],
                    './bin/room.js': ['./src/room.js']
                },
                options: {
                    'compilation_level': 'SIMPLE_OPTIMIZATIONS',
                    banner: '/*' + fs.readFileSync('LICENSE.md') + '*/'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-closurecompiler');

    grunt.registerTask('default', 'closurecompiler:minify');
}