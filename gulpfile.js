var fs = require('fs');
var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var babel = require("gulp-babel");

gulp.task("build-src", function () {
  return gulp.src("./src/*.js")// ES6  
    .pipe(babel())  
    .pipe(gulp.dest("./lib")); // ES5 
});

gulp.task('build-min', function () {
    return browserify({entries: './index.js', debug: false})
        .transform(babelify, {presets:["es2015"]})
        .bundle()
        .pipe(source("index.js"))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(rename("zbus.min.js"))
        .pipe(gulp.dest('./'));
});

gulp.task('build-raw', function () {
    return browserify({entries: './index.js', debug: false})
        .transform(babelify, {presets:["es2015"]})
        .bundle()
        .pipe(source("index.js"))
        .pipe(buffer()) 
        .pipe(rename("zbus.js"))
        .pipe(gulp.dest('./'));
});

// FIXME 目前build-src和build-min的顺序无法保证，需要修复
gulp.task('default', ['build-src', 'build-min', "build-raw", 'watch']);

gulp.task('watch', ['build-src', 'build-min'], function () {
    gulp.watch('./src/*', ['build-src', 'build-min']);
});