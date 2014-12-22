var fs = require('fs');

module.exports = function(grunt) {
    grunt.initConfig({
        closurecompiler: {
            minifyBufferObject: {
                files: {
                    './bin/bufferObject.js': ['./src/bufferObject.js']
                },
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    banner: '/*' + fs.readFileSync('LICENSE.md') + '*/',
                    create_source_map: './bin/bufferObject.js.map',
                    source_map_format: 'V3'
                }
            },
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
            minifyCookie: {
                files: {
                    './bin/cookie.js': ['./src/cookie.js']
                },
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    banner: '/*' + fs.readFileSync('LICENSE.md') + '*/',
                    create_source_map: './bin/cookie.js.map',
                    source_map_format: 'V3'
                }
            },
            minifyEventObjectTypes: {
                files: {
                    './bin/eventObjectTypes.js': ['./src/eventObjectTypes.js']
                },
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    banner: '/*' + fs.readFileSync('LICENSE.md') + '*/',
                    create_source_map: './bin/eventObjectTypes.js.map',
                    source_map_format: 'V3'
                }
            },
            minifyLogger: {
                files: {
                    './bin/logger.js': ['./src/logger.js']
                },
                options: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    banner: '/*' + fs.readFileSync('LICENSE.md') + '*/',
                    create_source_map: './bin/logger.js.map',
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

    grunt.registerTask('minify', ['closurecompiler']);
    grunt.registerTask('default', ['minify', 'execute:sourcemap']);
};