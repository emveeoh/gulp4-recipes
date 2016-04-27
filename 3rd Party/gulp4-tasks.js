// Gulp 4 from https://gist.github.com/demisx/beef93591edc1521330a
var gulp = require('gulp')
var using = require('gulp-using')
var grep = require('gulp-grep')
var changed = require('gulp-changed')
var del = require('del')
var coffee = require('gulp-coffee')
var less = require('gulp-less')
var coffeelint = require('gulp-coffeelint')
var sourcemaps = require('gulp-sourcemaps')
var replaceHtml = require('gulp-html-replace')
var ngAnnotate = require('gulp-ng-annotate')
var minifyJson = require('gulp-jsonminify')
var minifyImg = require('gulp-imagemin')
var uglifyJs = require('gulp-uglify')
var minifyCss = require('gulp-minify-css')
var concat = require('gulp-concat')
var sass = require('gulp-sass')
var browserSync = require('browser-sync')
var karma = require('karma').server
var webdriver_standalone = require('gulp-protractor').webdriver_standalone
var webdriver_update = require('gulp-protractor').webdriver_update
var protractor = require('gulp-protractor').protractor
var exit = require('gulp-exit')
var merge = require('merge-stream')
var order = require('gulp-order')

var paths = {
  dirs: {
    build: '.build'
  },
  html: 'app/**/*.html',
  coffee: [
    'app/**/*.coffee',
    '!app/**/*_test.coffee'
  ],
  images: 'app/**/*.{JPG,jpg,png,gif}',
  json: 'app/**/*.json',
  sass: 'app/**/*.scss',
  less: 'app/**/*.less',
  vendor: {
    components: {
      all: 'app/**/vendor/**/*.*',
      js: 'app/**/vendor/**/*.js',
      flash: 'app/components/angularjs-jwplayer/vendor/jwplayer/*.swf',
      xml: 'app/**/vendor/**/*.xml',
      nonJs: [
        'app/**/vendor/**/*',
        '!app/**/vendor/**/*.js'
      ]
    },
    bower: {
      js: [
        'bower_components/*/*.js',
        'bower_components/*/dist/**/*.js',
        'bower_components/*/release/**/*.js',
        '!bower_components/angular-bootstrap/ui-bootstrap.js',
        '!bower_components/lodash/dist/lodash.*.js',
        '!bower_components/**/*/*min.*',
        '!bower_components/*/Gruntfile.js'
      ],
      css: [
        'bower_components/**/font-awesome/css/font-awesome.css',
        '!bower_components/**/src/**/*'
      ],
      fonts: [
        'bower_components/bootstrap/dist/fonts/*',
        'bower_components/font-awesome/fonts/*'
      ]
    }
  },
  e2e: [
    'bower_components/lodash/dist/lodash.js',
    'tests-e2e/*.coffee'
  ]
}

// Shared tasks
gulp.task('glob', function () {
  var pattern = '.build/**/*.css'

  gulp.src(pattern, { read: false })
    .pipe(using())
})

gulp.task('clean', function (cb) {
  del(paths.dirs.build, cb)
})

// Development build specific tasks
gulp.task('html', function () {
  return gulp.src(paths.html)
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('json', function () {
  return gulp.src(paths.json)
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('coffee', function () {
  return gulp.src(paths.coffee)
    .pipe(coffeelint())
    .pipe(coffeelint.reporter())
    .pipe(sourcemaps.init())
    .pipe(coffee({ bare: true }))
    .pipe(ngAnnotate({
      remove: true,
      add: true,
      single_quotes: true
    }))
    .pipe(sourcemaps.write('.', { sourceRoot: '/' }))
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('images', function () {
  return gulp.src(paths.images)
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('sass', function () {
  return gulp.src(paths.sass)
    .pipe(using({ prefix: 'After changed:' }))
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(changed(paths.dirs.build))
    .pipe(sourcemaps.write('.', { sourceRoot: '/' }))
    .pipe(gulp.dest(paths.dirs.build))
    .pipe(grep('**/*.css', { read: false, dot: true }))
    .pipe(browserSync.reload({stream: true}))
})

gulp.task('less', function () {
  return gulp.src(paths.less)
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(changed(paths.dirs.build))
    .pipe(sourcemaps.write('.', { sourceRoot: '/' }))
    .pipe(gulp.dest(paths.dirs.build))
    .pipe(grep('**/*.css', { read: false, dot: true }))
    .pipe(browserSync.reload({stream: true}))
})

gulp.task('app', gulp.parallel('html', 'coffee', 'json', 'images', 'sass', 'less'))

gulp.task('vendor:components:js', function () {
  return gulp.src(paths.vendor.components.js)
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('vendor:components:other', function () {
  return gulp.src(paths.vendor.components.nonJs)
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('vendor:components', gulp.parallel(
  'vendor:components:js', 'vendor:components:other'
))

gulp.task('vendor:js', function () {
  return gulp.src(paths.vendor.bower.js)
    .pipe(gulp.dest(paths.dirs.build + '/vendor'))
})

gulp.task('vendor:css', function () {
  return gulp.src(paths.vendor.bower.css)
    .pipe(gulp.dest(paths.dirs.build + '/vendor'))
})

gulp.task('vendor:fonts', function () {
  return gulp.src(paths.vendor.bower.fonts, { base: 'bower_components' })
    .pipe(gulp.dest(paths.dirs.build + '/vendor'))
})

gulp.task('vendor', gulp.parallel(
  'vendor:components', 'vendor:js', 'vendor:css', 'vendor:fonts'
))

gulp.task('all', gulp.parallel('app', 'vendor'))
gulp.task('build', gulp.series('clean', 'all'))

gulp.task('unit', function () {
  karma.start({
    configFile: __dirname + '/config/karma.js',
    singleRun: true
  })
})

gulp.task('webdriver-update', webdriver_update)
gulp.task('selenium', gulp.series('webdriver-update', webdriver_standalone))
gulp.task('e2e', function () {
  gulp.src(paths.e2e)
    .pipe((protractor({
      configFile: 'config/protractor.js'
    })).on('error', function (e) {
      throw e
    }))
    .pipe(exit())
})

gulp.task('ws', function (cb) {
  browserSync({
    server: {
      baseDir: paths.dirs.build
    },
    port: 4000,
    notify: false,
    open: false
  }, cb)
})

gulp.task('watch:styles', function () {
  gulp.watch(paths.sass, 'sass')
  gulp.watch(paths.less, 'less')
})

gulp.task('watch:code', function () {
  gulp.watch([
    paths.html,
    paths.coffee,
    paths.images,
    paths.json,
    paths.vendor.components.all,
    paths.vendor.bower.js
  ], gulp.series('build', browserSync.reload))
})

gulp.task('watch:unit', function () {
  karma.start({
    configFile: __dirname + '/config/karma.js',
    autoWatch: true
  })
})

gulp.task('watch', gulp.parallel('watch:code', 'watch:styles', 'watch:unit'))

// Production build specific tasks
gulp.task('html:prod', function () {
  return gulp.src(paths.html)
    .pipe(replaceHtml({
      'css': 'all.min.css',
      'js': 'all.min.js'
    }))
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('json:prod', function () {
  return gulp.src(paths.json)
    .pipe(minifyJson())
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('images:prod', function () {
  return gulp.src(paths.images)
    .pipe(minifyImg())
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('fonts:prod', function () {
  return gulp.src(paths.vendor.bower.fonts)
    .pipe(gulp.dest(paths.dirs.build + '/fonts'))
})

gulp.task('flash:prod', function () {
  return gulp.src(paths.vendor.components.flash)
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('xml:prod', function () {
  return gulp.src(paths.vendor.components.xml)
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('scripts:prod', function () {
  var vendorJsStream = gulp.src(paths.vendor.bower.js)
  var vendorComponentsJsStream = gulp.src(paths.vendor.components.js)
  var coffeeStream = gulp.src(paths.coffee)
    .pipe(coffee({ bare: true }))
    .pipe(ngAnnotate({
      remove: true,
      add: true,
      single_quotes: true
    }))

  return merge(coffeeStream, vendorComponentsJsStream, vendorJsStream)
    .pipe(order(
      [
        'bower_components/jquery/dist/jquery.js',
        'bower_components/lodash/dist/lodash.js',
        'bower_components/angular/angular.js',
        'bower_components/**/*.js',
        'app/components/angularjs-jwplayer/vendor/jwplayer/jwplayer.js',
        'app/components/**/vendor/**/*.js',
        'app/**/app.js'
      ], {base: '.'}))
    .pipe(concat('all.min.js'))
    .pipe(uglifyJs())
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('styles:prod', function () {
  var cssStream = gulp.src(paths.vendor.bower.css)

  var sassStream = gulp.src(paths.sass)
    .pipe(sass())

  var lessStream = gulp.src(paths.less)
    .pipe(less())

  return merge(cssStream, lessStream, sassStream)
    .pipe(concat('all.min.css'))
    .pipe(minifyCss({ keepSpecialComments: 0 }))
    .pipe(gulp.dest(paths.dirs.build))
})

gulp.task('all:prod', gulp.parallel(
  'html:prod', 'images:prod', 'json:prod',
  'scripts:prod', 'styles:prod', 'fonts:prod', 'flash:prod', 'xml:prod'
))

gulp.task('build:prod', gulp.series('clean', 'all:prod'))

// Default task
gulp.task('default', gulp.series('build', 'ws', 'watch'))
