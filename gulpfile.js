var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var notify = require('gulp-notify');
var minifycss = require('gulp-clean-css');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var neat = require('node-neat');

gulp.task('default', function () {
//var sassSources = [];
  var task = function () {
    var inizio = new Date();
    gulp.src("scripts/assets/*/*").pipe(gulp.dest("scripts/css/scripts/sass/assets"));
    gulp.src('./scripts/sass/*.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(minifycss())
            .pipe(gulp.dest('./scripts/css/')).on('end', function () {
      console.info("compilazione e compressione dei SASS in CSS completata con successo")
    });
    browserify({entries: './scripts/start.js', extensions: ['.js'], debug: false})
            .transform(babelify)
            .bundle()
            .pipe(source('./scripts/compiled.js'))
            .pipe(gulp.dest('./')).on('end', function () {
      console.info("compilazione e compressione dei componenti React completata con successo");
      var tempoTotale = (new Date) - inizio;
      console.log("tempo totale impiegato " + (tempoTotale / 1000) + "s");
    });
  };
  return task();
});
gulp.task('watch', function () {
  watch('./scripts/!(compiled.js)', batch(function (events, done) {
    gulp.start('default', done);
  }));
  watch(['./scripts/*/*.js', './scripts/*/*.sass', './scripts/*/*.scss'], batch(function (events, done) {
    gulp.start('default', done);
  }));
});
