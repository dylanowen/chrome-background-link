'use strict'

var gulp = require('gulp');
var ts = require('gulp-typescript');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');
var del = require('del');

var config = {
    main: {
        src: 'src/',
        buildDest: './build/',
        prefix: 'cbl-'
    },
    test: {
        src: 'test/src/',
        buildDest: './test/build/',
        prefix: 'js/'
    },
    ts: {
        noImplicitAny: true,
        target: 'es6'
    }
};

gulp.task('clean', function(cb) {
    return del([config.main.buildDest + '*', config.test.buildDest + '*']);
});

function typescript(configFolders, outputName) {
    var tsConfig = config.ts;
    tsConfig.out = configFolders.prefix + outputName + '.js';

    return gulp.src(configFolders.src + outputName + '/**/*.ts')
        .pipe(ts(tsConfig))
        .pipe(gulp.dest(configFolders.buildDest));
}
const mainTypescript = typescript.bind(null, config.main)
const testTypescript = typescript.bind(null, config.test)

//main build
gulp.task('build:compile:background', mainTypescript.bind(null, 'background'));
gulp.task('build:compile:client', mainTypescript.bind(null, 'client'));
gulp.task('build:compile', function(cb) {
    runSequence(['build:compile:background', 'build:compile:client'], cb);
});

gulp.task('build', function(cb) {
    runSequence('clean', ['build:compile'], cb);
});

//test build
gulp.task('test:copyBuild', function() {
    return gulp.src(config.main.buildDest + '*.*')
        .pipe(gulp.dest(config.test.buildDest + 'lib/'));
});

gulp.task('test:compile:main', testTypescript.bind(null, 'main'))
gulp.task('test:compile:background', testTypescript.bind(null, 'background'))
gulp.task('test:compile', function(cb) {
    runSequence(['test:compile:main', 'test:compile:background'], cb);
});

gulp.task('test:static', function() {
    return gulp.src([config.test.src + '*.*'])
        .pipe(gulp.dest(config.test.buildDest));
});

gulp.task('test:build', function() {
    runSequence('build', ['test:compile', 'test:static', 'test:copyBuild'])
});

gulp.task('default', ['test:build']);