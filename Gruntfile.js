var fs = require('fs');

module.exports = function(grunt) {
    grunt.initConfig({
        closurecompiler: {
            minifyClient: {
                files: {
                    './bin/client.js': ['./src/client.js']
                },
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    banner: '/*' + fs.readFileSync('LICENSE.md') + '*/',
                    create_source_map: './bin/client.js.map',
                    source_map_format: 'V3'
                }
            },
            minifyRoom: {
                files: {
                    './bin/room.js': ['./src/room.js']
                },
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    banner: '/*' + fs.readFileSync('LICENSE.md') + '*/',
                    create_source_map: './bin/room.js.map',
                    source_map_format: 'V3'
                }
            }
        },
        execute: {
            sourcemap: {
                src: ['./source-map-fix.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-closurecompiler');
    grunt.loadNpmTasks('grunt-execute');

    grunt.registerTask('minify', ['closurecompiler:minifyClient', 'closurecompiler:minifyRoom']);
    grunt.registerTask('default', ['minify', 'execute:sourcemap']);
};