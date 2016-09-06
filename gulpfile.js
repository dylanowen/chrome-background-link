'use strict'

var gulp = require('gulp');
var ts = require('gulp-typescript');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');
var del = require('del');
var fs = require('fs');
var dtsGenerator = require('dts-generator');
var replace = require('gulp-regex-replace');

var config = {
    main: {
        src: 'src/',
        buildDest: './build/',
        prefix: 'bl-'
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

function typescript(configFolders, outputName, cb) {
    var tsConfig = config.ts;
    tsConfig.outFile = configFolders.prefix + outputName + '.js';

    gulp.src(configFolders.src + outputName + '/**/*.ts')
        .pipe(ts(tsConfig))
        .pipe(gulp.dest(configFolders.buildDest))
        .on('end', cb);
}
function declaration(configFolders, outputName, cb) {
    var name = configFolders.prefix + outputName;
    var outputFile = configFolders.buildDest + name + '.d.ts'

    dtsGenerator.default({
        name: name,
        //verbose: true,
        //sendMessage: console.log,
        baseDir: configFolders.src,
        files: [outputName + '/**/*.ts', '**/*.d.ts'],
        exclude: ['external_types/**/*.*'],
        out: outputFile
    }).then(function() {
        gulp.src(outputFile)
            .pipe(replace({regex: '/// <reference path.*\n', replace: ''}))
            .pipe(gulp.dest(configFolders.buildDest))
            .on('end', cb);
    }).catch(function(e) {
        throw new Error('Error: ' + e);
        cb('error: ' + e);
    });
}
const mainTypescript = function(outputName, cb) {
    //TODO this kind of sucks
    let resolveCount = 2;
    function resolve() {
        resolveCount--;

        if (resolveCount == 0) {
            cb();
        }
    }

    typescript(config.main, outputName, resolve);
    declaration(config.main, outputName, resolve);
}

//main build
gulp.task('build:compile:background', mainTypescript.bind(null, 'background'));
gulp.task('build:compile:client', mainTypescript.bind(null, 'client'));
gulp.task('build:compile', ['build:compile:background', 'build:compile:client']);

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
gulp.task('test:copyBuild', ['test:copyBuild:type', 'test:copyBuild:src']);

const testTypescript = typescript.bind(null, config.test);
gulp.task('test:compile:main', testTypescript.bind(null, 'main'))
gulp.task('test:compile:background', testTypescript.bind(null, 'background'))
gulp.task('test:compile', ['test:compile:main', 'test:compile:background']);

gulp.task('test:static', function() {
    return gulp.src([config.test.src + '*.*'])
        .pipe(gulp.dest(config.test.buildDest));
});

gulp.task('test:build', function(cb) {
    runSequence('build', 'test:copyBuild', ['test:compile', 'test:static'], cb);
});

gulp.task('default', ['test:build']);