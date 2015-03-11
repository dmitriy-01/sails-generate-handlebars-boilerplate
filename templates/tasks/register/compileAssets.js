module.exports = function (grunt) {
  grunt.registerTask('compileAssets', [
    'bower',
    'clean:dev',
    'handlebars:dev',
    'less:dev',
    'copy:dev',
    'coffee:dev'
  ]);
};
