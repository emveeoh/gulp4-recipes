'use strict'

// Gulp v4
// Based on list from: https://gist.github.com/demisx/beef93591edc1521330a
var browserSync = require('browser-sync')
var cache = require('gulp-cached')
var cleanCSS = require('gulp-clean-css')
var concat = require('gulp-concat')
var del = require('del')
var depcheck = require('gulp-depcheck')
var error = require('./gulp/gulp-error-handler.js')
var gulp = require('gulp')
var gulpIgnore = require('gulp-ignore')
var gulpNSP = require('gulp-nsp')
var gulpPath = require('./gulp/gulp-paths.js')
var nodemon = require('gulp-nodemon')
var path = require('path')
var plumber = require('gulp-plumber')
var prefix = require('gulp-autoprefixer')
var rename = require('gulp-rename')
var sass = require('gulp-sass')
var uglifyJs = require('gulp-uglify')

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++ WATCH TASKS : +++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// [watch-views]
gulp.task('watch-views', function () {
  var watcher = gulp.watch(gulpPath.to.views.source, gulp.series('copy-views'))
  watcher.on('change', function (path, stats) {
    console.log('File changed: ' + path)
  })
})

// [watch-routes]
gulp.task('watch-routes', function () {
  var watcher = gulp.watch(gulpPath.to.routes.source, gulp.series('copy-routes'))
  watcher.on('change', function (path, stats) {
    console.log('File changed: ' + path)
  })
})

// [watch-sass]
gulp.task('watch-sass', function () {
  var watcher = gulp.watch(gulpPath.to.sass.source, gulp.series('sass'))
  watcher.on('change', function (path, stats) {
    console.log('File changed: ' + path)
  })
})

// [watch-js]
gulp.task('watch-js', function () {
  var watcher = gulp.watch(gulpPath.to.js.source, gulp.series('js'))
  watcher.on('change', function (path, stats) {
    console.log('File changed: ' + path)
  })
})

// [watch-assets]
gulp.task('watch-assets', function () {
  var watcher = gulp.watch(
    [
      gulpPath.to.img.source,
      gulpPath.to.fonts.source,
      gulpPath.to.cssvendor.source,
      gulpPath.to.jsvendor.source
    ], gulp.series(
      [
        'copy-img',
        'copy-fonts',
        'copy-css-vendor',
        'copy-js-vendor'
      ])
  )
  watcher.on('change', function (path, stats) {
    console.log('File changed: ' + path)
  })
})

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++ BROWSE TASKS : ++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// [browse]
// Automatic browser reload when any changes occur.
gulp.task('browser-sync', function (cb) {
  browserSync.init({
    files: [gulpPath.to.projectRoot + '/**/*.*'],
    proxy: 'http://localhost:3000',
    port: 5000,
    browser: ['google chrome canary'] // Default browser to open
  }, cb())
  // Set watch to automatically fresh browser when any of the sources changes
  gulp.watch(gulpPath.to.publicRoot + '/**/*.*').on('change', browserSync.reload) // public
  gulp.watch(gulpPath.to.routes.destination + '/**/*.*').on('change', browserSync.reload) // views
  gulp.watch(gulpPath.to.views.destination + '/**/*.*').on('change', browserSync.reload) // views
})

// [nodemon]
// Nodemon task for monitory for changes with live restarting
gulp.task('nodemon', function (cb) {
  var called = false
  return nodemon({
    script: './bin/www' // The entry point
  })
    .on('start', function onStart () {
      if (!called) {
        cb()
      } // To stop it constantly restarting
      called = true
    })
    .on('restart', function onRestart () {
      setTimeout(function reload () { // reload after short pause
        browserSync.reload({
          stream: false
        })
      }, 500)
    })
})

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++ JAVASCRIPT TASKS : ++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// [js]
// Compiles all custom javascript into main.js.
// Uglifies it (minify) and adds the .min suffix to the file
gulp.task('js', function () {
  return gulp.src(gulpPath.to.js.source)
    .pipe(concat('main.js'))
    .pipe(uglifyJs())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(gulpPath.to.js.destination))
})

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++ SASS TASKS : ++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// [sass]
// Gathers all custom sass and compiles it together into main.css
// Does auto-prefixing to support browser-specific css prefixes
gulp.task('sass', function () {
  return gulp.src(gulpPath.to.sass.main)
    .pipe(sass())
    .on('error', error.handler)
    .pipe(prefix(['last 2 versions', 'IE 9'], {
      cascade: true
    }))
    .on('error', error.handler)
    .pipe(gulp.dest(gulpPath.to.sass.destination))
    .pipe(gulpIgnore.exclude(gulpPath.to.css.alreadyMinified))
    .pipe(plumber())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(cleanCSS({
      debug: true,
      compatibility: 'ie9',
      keepSpecialComments: 1
    }, function (details) {
      console.log(details.name + ': ' + details.stats.originalSize)
      console.log(details.name + ': ' + details.stats.minifiedSize)
    }))
    .pipe(gulp.dest(gulpPath.to.css.destination))
// .pipe(browserSync.reload({stream: true}))
})

// [postcss]
gulp.task('postcss', function () {
  var postcss = require('gulp-postcss')
  var sourcemaps = require('gulp-sourcemaps')

  return gulp.src('src/**/*.css')
    .pipe(sourcemaps.init())
    .pipe(postcss([ require('autoprefixer'), require('precss') ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build/'))
})

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++ COPY TASKS : ++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// copy dev/views files into ./views
gulp.task('copy-views', function () {
  return gulp.src(gulpPath.to.views.source)
    .pipe(gulp.dest(gulpPath.to.views.destination))
})

// copy dev/routes files into ./routes
gulp.task('copy-routes', function () {
  return gulp.src(gulpPath.to.routes.source)
    .pipe(gulp.dest(gulpPath.to.routes.destination))
})

// copy images
gulp.task('copy-img', function () {
  return gulp.src(gulpPath.to.img.source)
    .pipe(gulp.dest(gulpPath.to.img.destination))
})

// copy favicon
gulp.task('copy-favicon', function () {
  return gulp.src(gulpPath.to.favicon.source)
    .pipe(gulp.dest(gulpPath.to.favicon.destination))
})

// copy fonts
gulp.task('copy-fonts', function () {
  return gulp.src(gulpPath.to.fonts.source)
    .pipe(gulp.dest(gulpPath.to.fonts.destination))
})

// copy css vendor files
gulp.task('copy-css-vendor', function () {
  return gulp.src(gulpPath.to.cssvendor.source)
    .pipe(gulp.dest(gulpPath.to.cssvendor.destination))
})

// copy javscript vendor files
gulp.task('copy-js-vendor', function () {
  return gulp.src(gulpPath.to.jsvendor.source)
    .pipe(gulp.dest(gulpPath.to.jsvendor.destination))
})

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++ TRASH TASKS : +++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// [flush-cache]
gulp.task('flush-cache', function (cb) {
  cache.caches = {} // clear Node cache
  cb()
})

// [trash-public]
// Remove all contents of the ./public folder
gulp.task('trash-public', function () {
  return del([
    path.join(gulpPath.to.publicRoot + '/**'),
    path.join('!' + gulpPath.to.publicRoot) // don't delete root folder
  ])
})

// [trash-views]
// Remove all contents of the ./views folder
gulp.task('trash-views', function () {
  return del([
    path.join(gulpPath.to.views.destination + '/**'),
    path.join('!' + gulpPath.to.views.destination) // don't delete root folder
  ])
})

// [trash-routes]
// Remove all contents of the ./routes folder
gulp.task('trash-routes', function () {
  return del([
    path.join(gulpPath.to.routes.destination + '/**'),
    path.join('!' + gulpPath.to.routes.destination) // don't delete root folder
  ])
})

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++ MISC TASKS : ++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// [paths]
// View gulp path obj data in console
gulp.task('paths', function (cb) {
  var obj = JSON.stringify(gulpPath, null, 4) // (Optional) beautiful indented output.
  console.log(obj) // Logs output to dev tools console.
  cb()
})

// [security]
// Use gulp-nsp to check for security vulnerabilites
gulp.task('security', function (cb) {
  gulpNSP({
    package: __dirname + '/package.json',
    output: 'summary'
  }, cb)
})

// [security-msg]
// Reminder message to run gulp security to check for bad modules
gulp.task('security-msg', function (cb) {
  console.log('====================================================================\n SECURITY REMINDER: Run [ gulp security ] before deployment.\n====================================================================')
  cb()
})

// [unused]
// Task that determines which package dependencies are unused and unnecessary.
gulp.task('unused', function (cb) {
  var root = path.resolve('./')
  var options = {
    ignoreDirs: ['node_modules', 'gulp', 'tasks-not-used'],
    ignoreMatches: ['gulp-depcheck'],
    withoutDev: false
  }

  depcheck(root, options, function (unused) {
    if (unused.dependencies.length > 0 || unused.devDependencies.length > 0) {
      console.log('\n\n===========================================================================')
      console.log('| ---------------------------------')
      console.log('| UNUSED PACKAGES (package.json):')
      console.log('| ---------------------------------')
      console.log('| These packages do not seem to have any programatic dependencies.')
      console.log('| However, it is possible that files are bing copied or linked to them.')
      console.log('| So... First, do a search for any Gulp tasks that may copy assets, etc...')
      console.log('| Root path: ' + root)
      console.log('|')

      if (unused.dependencies.length > 0) {
        console.log('| [dependencies:]\n|  • ' + unused.dependencies.join('\n|  • '))
      }
      if (unused.devDependencies.length > 0) {
        console.log('|  \n| [devDependencies:]\n|  • ' + unused.devDependencies.join('\n|  • '))
      }

      console.log('===========================================================================')
    }
  }, cb())
})

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++ MAIN TASKS : ++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// [watch]
// Sets gulp watches on files and will launch tasks when they are changed
gulp.task('watch', gulp.parallel(
  'watch-views',
  'watch-routes',
  'watch-sass',
  'watch-js',
  'watch-assets'
))

// [browse]
// Sets gulp watches on files and will launch tasks when they are changed
gulp.task('browse', gulp.series(
  'nodemon',
  'browser-sync'
))

// [copy]
// Copies files from ./dev to ./public
gulp.task('copy', gulp.parallel(
  'copy-routes',
  'copy-views',
  'copy-img',
  'copy-favicon',
  'copy-fonts',
  'copy-css-vendor',
  'copy-js-vendor'
))

// [trash]
// Removes content from specified directories and clears cache
gulp.task('trash', gulp.parallel(
  'flush-cache',
  'trash-public',
  'trash-views',
  'trash-routes'
))

// [build]
// builds ./public site
gulp.task('build', gulp.series(
  'trash',
  'copy',
  'sass',
  'js',
  'security-msg'
))

// [default]
// Default gulp task when you only type 'gulp'
gulp.task('default', gulp.series(
  // 'build',
  'browse',
  'watch'
))
