/**
 * Created by alicia.sykes on 17/07/2015.
 * To run script run "gulp" in the command line
 * To just watch files run "gulp watch"
 * To just clean the public directory run "gulp clean"
 */

/* Include the necessary modules */
var gulp = require('gulp');
var gutil = require('gulp-util'); // For logging stats and warnings
var gsize = require('gulp-filesize'); // It's nice to know file size after minifing
var jshint = require('gulp-jshint'); // For checking JavaScript for warnings
var concat = require('gulp-concat'); // For joining together multiple files
var uglify = require('gulp-uglify'); // For minimising files
var coffee = require('gulp-coffee'); // For compiling coffee script into js
var cofLint = require('gulp-coffeelint'); // For checking coffee script for errors
var less = require('gulp-less'); // For compiling Less into CSS
var cssLint = require('gulp-csslint'); // For checking the awesomeness of css
var minCss = require('gulp-minify-css'); // For minifying css
var uncss = require('gulp-uncss'); // For deleting unused CSS rules
var changed = require('gulp-changed'); // For only updating changed files
var footer = require('gulp-footer'); // For adding footer text into files
var nodemon = require('gulp-nodemon'); // For the super cool instant refreshing server
var bSync = require('browser-sync'); // Syncs the place between multiple browsers for dev
var es = require('event-stream'); // For working with streams rather than temp dirs
var del = require('del'); // For removing everything from last builds

/* Define constants */
var CONFIG = {
    SOURCE_ROOT: "sources", // Folder name for all js and css source
    DEST_ROOT: "public", // Folder name for the results root
    JS_DIR_NAME: "scripts", // Name of JavaScript directory
    CSS_DIR_NAME: "styles", // Name of CSS directory
    JS_FILE_NAME: "all.min.js", // Name of output JavaScript file
    CSS_FILE_NAME: "all.min.css", // Name of output CSS file
    FOOTER_TEXT: "" // Optional footer text for output files

};


/* Clean the work space */
gulp.task('clean', function(cb) {
    del([
        CONFIG.DEST_ROOT + '/scripts/**/*',
        CONFIG.DEST_ROOT + '/styles/**/*'
    ], cb);
});

/* JavaScript Tasks */
gulp.task('scripts', function() {
    var jsSrcPath = CONFIG.SOURCE_ROOT + '/' + CONFIG.JS_DIR_NAME + '/**/*';
    var jsResPath = CONFIG.DEST_ROOT + '/' + CONFIG.JS_DIR_NAME;

    var jsFromCs = gulp.src(jsSrcPath + '.coffee') // Get all coffee script
        .pipe(cofLint()) // Check CS for errors or warnings
        .pipe(cofLint.reporter()) // Output the error results
        .pipe(coffee()); // Convert coffee to vanilla js

    var jsFromPlain = gulp.src(jsSrcPath + '.js'); // get all vanilla JavaScript

    return es.merge(jsFromCs, jsFromPlain) // Both js from cs and vanilla js
        .pipe(changed(jsResPath)) // Only work with changed files
        .pipe(jshint()) // Check js errors or warnings
        .pipe(jshint.reporter('jshint-stylish')) // Print js errors or warnings
        .pipe(concat(CONFIG.JS_FILE_NAME, {
            newLine: ';'
        })) // Concatenate all files together
        .pipe(uglify()) // Minify JavaScript
        .pipe(footer(CONFIG.FOOTER_TEXT)) // Add footer to script
        .pipe(gsize()) // Print the file size, just cos it's cool
        .pipe(gulp.dest(jsResPath)) // Save to destination
        .on('error', gutil.log); // If error, log to console

});

/* CSS Tasks */
gulp.task('styles', function() {
    var cssSrcPath = CONFIG.SOURCE_ROOT + '/' + CONFIG.CSS_DIR_NAME + '/**/*';
    var cssResPath = CONFIG.DEST_ROOT + '/' + CONFIG.CSS_DIR_NAME;

    var cssFromLess = gulp.src(cssSrcPath + '.less') // Get all Less code
        .pipe(less()); // Convert Less to CSS

    var cssFromVanilla = gulp.src(cssSrcPath + '.css'); // Get all CSS

    return es.merge(cssFromLess, cssFromVanilla) // Combine both CSS
        .pipe(changed(cssResPath)) // Only work with changed files
        .pipe(cssLint()) // Check CSS for errors or warnings
        .pipe(cssLint.reporter()) // And output the results
        .pipe(concat(CONFIG.CSS_FILE_NAME)) // Concatenate all files together
        .pipe(minCss({
            compatibility: 'ie8'
        })) // Minify the CSS
        .pipe(gsize()) // Print the file size, just cos it's cool
        .pipe(gulp.dest(cssResPath)) // Save to destination
        .on('error', gutil.log); // If error, log to console

});


/* Configure files to watch for changes */
gulp.task('watch', function() {
    gulp.watch(CONFIG.SOURCE_ROOT + '/**/*.{js,coffee}', ['scripts']);
    gulp.watch(CONFIG.SOURCE_ROOT + '/**/*.{css,less}', ['styles']);
});

/* Start Nodemon */
gulp.task('demon', function() {
    gulp.start('scripts', 'styles'); // Initially run all tasks
    nodemon({
            script: './bin/www', // The starting point is app.js
            ext: 'js coffee css less html', // File types to watch
            ignore: ['public/**/*'], // Ignore the public folder
            env: {
                'NODE_ENV': 'development'
            } // Start the server in dev mode
        })
        .on('start', function() { // When the server starts
            gulp.start('scripts', 'styles'); // Call script and style tasks
        })
        .on('change', ['watch']) // On file change call watch method
        .on('restart', function() { // When restarted
            console.log('restarted!');
        });
});



/* Nodemon task for monitory for changes with live restarting */
gulp.task('nodemon', function(cb) {
    var called = false;
    return nodemon({
            script: './bin/www', // The entry point
            watch: ['source/**/*'] // The files to watch for changes in
        })
        .on('start', function onStart() {
            if (!called) {
                cb();
            } // To stop it constantly restarting
            called = true;
        })
        .on('restart', function onRestart() {
            setTimeout(function reload() { // reload after short pause
                bSync.reload({
                    stream: false
                });
            }, 500);
        });
});

gulp.task('browser-sync', ['nodemon', 'scripts', 'styles'], function() {
    bSync.init({
        files: [CONFIG.SOURCE_ROOT + '/**/*.*'],
        proxy: 'http://localhost:3000',
        port: 4000,
        browser: ['google chrome'] // Default browser to open
    });
    gulp.watch(CONFIG.SOURCE_ROOT + '/**/*.{js,coffee}', ['scripts']); // Watch and update scripts
    gulp.watch(CONFIG.SOURCE_ROOT + '/**/*.{css,less}', ['styles']); // Watch and update styles
    gulp.watch(CONFIG.SOURCE_ROOT + "/**/*").on('change', bSync.reload); // Refresh the browser when any of the sources changes
    gulp.watch("views/**/*.jade").on('change', bSync.reload); // Refresh browser when jade views change
});



/* Default Task */
gulp.task('default', ['clean', 'browser-sync']);
