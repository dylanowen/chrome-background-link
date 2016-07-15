'use strict'

var gulp = require('gulp');
var ts = require('gulp-typescript');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');
var del = require('del');
var fs = require('fs');
var merge = require('merge2');

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
    ts: JSON.parse(fs.readFileSync('./tsconfig.json')).compilerOptions
};

gulp.task('clean', function(cb) {
    return del([config.main.buildDest + '*', config.test.buildDest + '*']);
});

function typescript(configFolders, declaration, outputName) {
    var tsConfig = config.ts;
    tsConfig.declaration = declaration;
    tsConfig.outFile = configFolders.prefix + outputName + '.js';

    var tsResult = gulp.src(configFolders.src + outputName + '/**/*.ts')
        .pipe(ts(tsConfig));

    return merge([
        tsResult.js.pipe(gulp.dest(configFolders.buildDest)),
        tsResult.dts.pipe(gulp.dest(configFolders.buildDest))
    ]);
}
const mainTypescript = typescript.bind(null, config.main, true);
const testTypescript = typescript.bind(null, config.test, false);

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
gulp.task('test:copyBuild:type', function() {
    return gulp.src(config.main.buildDest + '*.d.ts')
        .pipe(gulp.dest(config.test.src + 'lib/'));
});

gulp.task('test:copyBuild:src', function() {
    return gulp.src(config.main.buildDest + '*.js')
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
    runSequence('build', ['test:copyBuild:type', 'test:copyBuild:src'], ['test:compile', 'test:static'])
});

gulp.task('default', ['test:build']);