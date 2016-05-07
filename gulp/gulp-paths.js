// File globs.
var thisPath = require('path')
var projectRoot = thisPath.join(__dirname, '../') // go up one
var devRoot = projectRoot + 'dev'
var publicRoot = projectRoot + 'public'
var destination = projectRoot

module.exports = {
  to: {
    projectRoot: projectRoot,
    devRoot: devRoot,
    publicRoot: publicRoot,
    destination: destination,
    html: {
      source: devRoot + '/html/**/*.html',
      destination: publicRoot + '/html'
    },
    pug: {
      source: projectRoot + 'dev-views/**/*.pug',
      destination: projectRoot + 'views'
    },
    views: {
      source: projectRoot + 'dev-views',
      destination: projectRoot + 'views'
    },
    css: {
      source: publicRoot + '/css/**/*.css',
      main: publicRoot + '/css/main.css',
      alreadyMinified: '/*.min.css',
      destination: publicRoot + '/css'
    },
    cssvendor: {
      source: devRoot + '/css-vendor/**/*.*',
      destination: publicRoot + '/css-vendor'
    },
    sass: {
      source: devRoot + '/sass/**/*.+(scss|sass)',
      main: devRoot + '/sass/main.+(scss|sass)',
      destination: publicRoot + '/css'
    },
    js: {
      source: devRoot + '/js/**/*.js',
      main: devRoot + '/js/main.js',
      destination: publicRoot + '/js'
    },
    jsvendor: {
      source: devRoot + '/js-vendor/**/*.*',
      destination: publicRoot + '/js-vendor'
    },
    scripts: {
      source: devRoot + '/js/**/*.js',
      destination: publicRoot + '/scripts'
    },
    fonts: {
      source: devRoot + '/fonts/**/*.*',
      destination: publicRoot + '/fonts'
    },
    img: {
      source: devRoot + '/img/**/*.*',
      destination: publicRoot + '/img'
    },
    favicon: {
      source: devRoot + '/favicon/favicon.ico',
      destination: publicRoot
    }
  }
}

// DEBUG:
// var pathToThisFile = __dirname
// console.log('== DEBUG =======================================')
// console.log('var pathToThisFile: ' + pathToThisFile)
// console.log('var projectRoot: ' + projectRoot)
// console.log('var devRoot: ' + devRoot)
// console.log('var publicRoot: ' + publicRoot)
// console.log('var destination: ' + destination)
// console.log('scripts source: ' + devRoot + '/js/**/*.js')
// console.log('=================================================')
// PRINT MODULE OBJECT (JSON) TO CONSOLE:
// str = JSON.stringify(module, null, 4); // (Optional) beautiful indented output.
// console.log(str); // Logs output to dev tools console.
