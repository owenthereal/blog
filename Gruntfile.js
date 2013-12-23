module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      dist: {
        src: [
          "js/jquery-1.8.3.min.js",
          "js/jquery-ui-1.10.3.custom.min.js",
          "js/jquery.ui.touch-punch.min.js",
          "js/bootstrap.min.js",
          "js/bootstrap-select.js",
          "js/bootstrap-switch.js",
          "js/flatui-checkbox.js",
          "js/flatui-radio.js",
          "js/jquery.tagsinput.js",
          "js/jquery.placeholder.js",
          "js/jquery.stacktable.js",
          "js/application.js"
        ],
        dest: 'js/build/application.js',
      }
    },

    uglify: {
      build: {
        src: 'js/build/application.js',
        dest: 'js/build/application.min.js'
      }
    },

    imagemin: {
      dynamic: {
        files: [{
          expand: true,
          cwd: 'images/',
          src: ['**/*.{png,jpg,gif}'],
          dest: 'images/build/'
        }]
      }
    },

    less: {
      dist: {
        options: {
          cleancss: true
        },
        files: {
          "css/application.css": "less/styles.less"
        }
      }
    },

    watch: {
      scripts: {
        files: ['js/*.js'],
        tasks: ['concat', 'uglify'],
        options: {
          spawn: false,
        },
      },

      css: {
        files: ['less/*.less'],
        tasks: ['less'],
        options: {
          spawn: false,
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['concat', 'uglify', /*'imagemin',*/ 'less']);
};
