/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
_.defaults = require('merge-defaults');

var fs = require('fs');
var replace = require("replace");

/**
 * sails-generate-handlebars-boilerplate
 *
 * Usage:
 * `sails generate handlebars-boilerplate`
 *
 * @description Generates a handlebars-boilerplate
 * @help See http://links.sailsjs.org/docs/generators
 */

module.exports = {

  /**
   * `before()` is run before executing any of the `targets`
   * defined below.
   *
   * This is where we can validate user input, configure default
   * scope variables, get extra dependencies, and so on.
   *
   * @param  {Object} scope
   * @param  {Function} cb    [callback]
   */

  before: function (scope, cb) {

    function deleteFiles(files, callback) {
      var i = files.length;
      files.forEach(function (filepath) {
        fs.unlink(filepath, function (err) {
          i--;
          if (err) {
            callback(err);
            return;
          } else if (i <= 0) {
            callback(null);
          }
        });
      });
    }

    // scope.args are the raw command line arguments.
    //
    // e.g. if someone runs:
    // $ sails generate handlebars-boilerplate user find create update
    // then `scope.args` would be `['user', 'find', 'create', 'update']`
    if (!scope.args[0]) {
      //return cb( new Error('Please provide a name for this handlebars-boilerplate.') );
    }

    // scope.rootPath is the base path for this generator
    //
    // e.g. if this generator specified the target:
    // './Foobar.md': { copy: 'Foobar.md' }
    //
    // And someone ran this generator from `/Users/dbowie/sailsStuff`,
    // then `/Users/dbowie/sailsStuff/Foobar.md` would be created.
    if (!scope.rootPath) {
      return cb(INVALID_SCOPE_VARIABLE('rootPath'));
    }


    // Attach defaults
    _.defaults(scope, {
      createdAt: new Date()
    });

    // Decide the output filename for use in targets below:
    scope.appname = scope.args[0] || 'myapp';

    // Add other stuff to the scope for use in our templates:
    scope.whatIsThis = 'an example file created at ' + scope.createdAt;

    replace({
      regex: "// database: 'your_mongo_db_name_here'",
      replacement: "database: '" + scope.appname + "'",
      paths: ['./config/connections.js'],
      recursive: false,
      silent: true
    });

    var files = [
      './views/403.ejs',
      './views/404.ejs',
      './views/500.ejs',
      './views/homepage.ejs',
      './views/layout.ejs'
    ];

    deleteFiles(files, function (err) {
      if (err) {
        //console.log(err);
      } else {
        //console.log('all files removed');
      }
    });


    // When finished, we trigger a callback with no error
    // to begin generating files/folders as specified by
    // the `targets` below.

    cb();

  },


  /**
   * The files/folders to generate.
   * @type {Object}
   */

  targets: {

    // Usage:
    // './path/to/destination.foo': { someHelper: opts }

    // Creates a dynamically-named file relative to `scope.rootPath`
    // (defined by the `filename` scope variable).
    //
    // The `template` helper reads the specified template, making the
    // entire scope available to it (uses underscore/JST/ejs syntax).
    // Then the file is copied into the specified destination (on the left).
    //'./:filename': { template: 'example.template.js' },

    './api/controllers/SiteController.js': {template: 'api/controllers/SiteController.js'},

    './config/env/development.js': {template: 'config/env/development.js'},
    './config/env/production.js': {template: 'config/env/production.js'},

    './views/layouts/layout.handlebars': {copy: 'views/layouts/layout.handlebars'},
    './views/partials/errors.handlebars': {copy: 'views/partials/errors.handlebars'},
    './views/partials/nav.handlebars': {copy: 'views/partials/nav.handlebars'},
    './views/site/index.handlebars': {copy: 'views/site/index.handlebars'},
    './views/403.handlebars': {copy: 'views/403.handlebars'},
    './views/404.handlebars': {copy: 'views/404.handlebars'},
    './views/500.handlebars': {copy: 'views/500.handlebars'},

    './assets/js/custom.js': {copy: 'assets/js/custom.js'},
    './assets/js/dependencies/ajax-handlebars.js': {copy: 'assets/js/dependencies/ajax-handlebars.js'},
    './assets/styles/importer.less': {copy: 'assets/styles/importer.less'},

    './bower.json': {copy: 'bower.json'},

    './config/views.js': {copy: 'config/views.js'},
    './config/models.js': {copy: 'config/models.js'},
    './config/routes.js': {copy: 'config/routes.js'},

    './tasks/pipeline.js': {copy: 'tasks/pipeline.js'},
    './tasks/config/bower.js': {copy: 'tasks/config/bower.js'},
    './tasks/config/handlebars.js': {copy: 'tasks/config/handlebars.js'},
    './tasks/config/sails-linker.js': {copy: 'tasks/config/sails-linker.js'},
    './tasks/register/compileAssets.js': {copy: 'tasks/register/compileAssets.js'}

    // Creates a folder at a static path
    //'./hey_look_a_folder': { folder: {} }

  },


  /**
   * The absolute path to the `templates` for this generator
   * (for use with the `template` helper)
   *
   * @type {String}
   */
  templatesDirectory: require('path').resolve(__dirname, './templates')
};


/**
 * INVALID_SCOPE_VARIABLE()
 *
 * Helper method to put together a nice error about a missing or invalid
 * scope variable. We should always validate any required scope variables
 * to avoid inadvertently smashing someone's filesystem.
 *
 * @param {String} varname [the name of the missing/invalid scope variable]
 * @param {String} details [optional - additional details to display on the console]
 * @param {String} message [optional - override for the default message]
 * @return {Error}
 * @api private
 */

function INVALID_SCOPE_VARIABLE(varname, details, message) {
  var DEFAULT_MESSAGE =
    'Issue encountered in generator "handlebars-boilerplate":\n' +
    'Missing required scope variable: `%s`"\n' +
    'If you are the author of `sails-generate-handlebars-boilerplate`, please resolve this ' +
    'issue and publish a new patch release.';

  message = (message || DEFAULT_MESSAGE) + (details ? '\n' + details : '');
  message = util.inspect(message, varname);

  return new Error(message);
}
