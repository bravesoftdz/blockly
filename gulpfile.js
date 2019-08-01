/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2018 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Gulp script to build Blockly for Node & NPM.
 * Run this script by calling "npm install" in this directory.
 */

var gulp = require('gulp');
gulp.shell = require('gulp-shell');
gulp.concat = require('gulp-concat');
gulp.replace = require('gulp-replace');
gulp.rename = require('gulp-rename');
gulp.insert = require('gulp-insert');
gulp.umd = require('gulp-umd');

var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var execSync = require('child_process').execSync;

// Rebuilds Blockly, including the following:
//  - blockly_compressed.js
//  - blocks_compressed.js
//  - Localization string tables in msg/js/*.js
//  - Generators in generators/*.js
// These files are already up-to-date in the master branch.
gulp.task('build', gulp.shell.task([
  'python build.py'
]));

// Concatenates the necessary files to load Blockly in a Node.js VM.  Blockly's
// individual libraries target use in a browser, where globals (via the window
// objects) are used to share state and APIs.  By concatenating all the
// necessary components into a single file, Blockly can be loaded as a Node.js
// module.
//
// This task builds Node with the assumption that the app needs English blocks
// and JavaScript code generation.  If you need another localization or
// generator language, just copy and edit the srcs. Only one localization
// language can be included.
gulp.task('blockly_node_javascript_en', function () {
  var srcs = [
    'blockly_compressed.js',
    'blocks_compressed.js',
    'javascript_compressed.js',
    'msg/js/en.js'
  ];
  // Concatenate the sources, appending the module export at the bottom.
  // Override textToDomDocument, providing Node alternative to DOMParser.
  return gulp.src(srcs)
    .pipe(gulp.concat('blockly_node_javascript_en.js'))
    .pipe(gulp.insert.append(`
if (typeof DOMParser !== 'function') {
  var JSDOM = require('jsdom').JSDOM;
  var window = (new JSDOM()).window;
  var document = window.document;
  var Element = window.Element;
  Blockly.utils.xml.textToDomDocument = function(text) {
    var jsdom = new JSDOM(text, { contentType: 'text/xml' });
    return jsdom.window.document;
  };
}
if (typeof module === 'object') { module.exports = Blockly; }
if (typeof window === 'object') { window.Blockly = Blockly; }\n`))
    .pipe(gulp.dest('.'));
});

/**
 * Task-builder for the watch function. Currently any change invokes the whole
 * build script. Invoke with "gulp watch".
 *
 * @param {?string=} concatTask Name of the concatenating task for node usage.
 */
// TODO: Only run the necessary phases of the build script for a given change.
function buildWatchTaskFn(concatTask) {
  return function () {
    // Tasks to trigger.
    var tasks = ['build'];
    if (concatTask) {
      tasks.push(concatTask);
    }

    // Currently any changes invokes the whole build script. (To fix.)
    var srcs = [
      'core/**/*.js',                      // Blockly core code
      'blocks/*.js',                       // Block definitions
      'generators/**/*.js',                // Code generation
      'msg/messages.js', 'msg/json/*.json' // Localization data
    ];
    var options = {
      debounceDelay: 2000  // Milliseconds to delay rebuild.
    };
    gulp.watch(srcs, options, gulp.parallel(tasks));
  };
}

// Watch Blockly files for changes and trigger automatic rebuilds, including
// the Node-ready blockly_node_javascript_en.js file.
gulp.task('watch', buildWatchTaskFn('blockly_node_javascript_en'));

// Generates the TypeScript definition file (d.ts) for Blockly.
// As well as generating the typings of each of the files under core/ and msg/,
// the script also pulls in a number of part files from typings/parts.
// This includes the header (incl License), additional useful interfaces
// including Blockly Options and Google Closure typings
gulp.task('typings', () => {
  const tmpDir = './typings/tmp';
  const blocklySrcs = [
    "core/",
    "core/keyboard_nav",
    "core/theme",
    "core/utils",
    "msg/"
  ];
  // Clean directory if exists
  if (fs.existsSync(tmpDir)) {
    rimraf.sync(tmpDir);
  }
  fs.mkdirSync(tmpDir);

  // Find all files that will be included in the typings file
  let files = [];
  blocklySrcs.forEach((src) => {
    files = files.concat(fs.readdirSync(src)
      .filter(fn => fn.endsWith('.js'))
      .map(fn => path.join(src, fn)));
  });

  // Generate typings file for each file
  files.forEach((file) => {
    const typescriptFileName = `${path.join(tmpDir, file)}.d.ts`;
    const cmd = `node ./node_modules/typescript-closure-tools/definition-generator/src/main.js ${file} ${typescriptFileName}`;
    console.log(`Generating typings for ${file}`);
    execSync(cmd, { stdio: 'inherit' });
  });

  const srcs = [
    'typings/parts/blockly-header.d.ts',
    'typings/parts/blockly-interfaces.d.ts',
    'typings/parts/goog-closure.d.ts',
    `${tmpDir}/core/**`,
    `${tmpDir}/core/utils/**`,
    `${tmpDir}/core/theme/**`,
    `${tmpDir}/core/keyboard_nav/**`,
    `${tmpDir}/msg/**`
  ];
  return gulp.src(srcs)
    .pipe(gulp.concat('blockly.d.ts'))
    .pipe(gulp.dest('typings'))
    .on('end', function () {
      // Clean up tmp directory
      if (fs.existsSync(tmpDir)) {
        rimraf.sync(tmpDir);
      }
    });
});

const packageDestination = './dist';

function packageBlockly() {
  return gulp.src('blockly_compressed.js')
    .pipe(gulp.umd({
      namespace: function () { return 'Blockly'; },
      exports: function () { return 'Blockly'; }
    }))
    .pipe(gulp.dest(packageDestination));
};

function packageBlocks() {
  return gulp.src('blocks_compressed.js')
    .pipe(gulp.insert.prepend(`
    Blockly.Blocks={};`))
    .pipe(gulp.umd({
      dependencies: function () {
        return [{
          name: 'Blockly',
          amd: './core-browser',
          cjs: './core',
        }];
      },
      namespace: function () { return 'Blockly.Blocks'; },
      exports: function () { return 'Blockly.Blocks'; }
    }))
    .pipe(gulp.dest(packageDestination));
};

function packageBlocklyNode() {
  // Concatenate the sources, appending the module export at the bottom.
  // Override textToDomDocument, providing Node alternative to DOMParser.
  return gulp.src('blockly_compressed.js')
    .pipe(gulp.insert.wrap(`
    var self = global;`,
      `if (typeof DOMParser !== 'function') {
        var JSDOM = require('jsdom').JSDOM;
        var window = (new JSDOM()).window;
        var document = window.document;
        var Element = window.Element;
        Blockly.utils.xml.textToDomDocument = function(text) {
          var jsdom = new JSDOM(text, { contentType: 'text/xml' });
          return jsdom.window.document;
        };
      }`))
    .pipe(gulp.umd({
      namespace: function () { return 'Blockly'; },
      exports: function () { return 'Blockly'; }
    }))
    .pipe(gulp.rename('blockly_compressed-node.js'))
    .pipe(gulp.dest(packageDestination));
};

function packageGenerator(file, rename, generator) {
  return gulp.src(file)
    .pipe(gulp.umd({
      dependencies: function () {
        return [{
          name: 'Blockly',
          amd: './core-browser',
          cjs: './core',
        }];
      },
      namespace: function () { return `Blockly.${generator}`; },
      exports: function () { return `Blockly.${generator}`; }
    }))
    .pipe(gulp.rename(rename))
    .pipe(gulp.dest(packageDestination));
};

function packageLocales() {
  return gulp.src('msg/js/*.js')
    .pipe(gulp.replace(/goog\.[^\n]+/g, ''))
    .pipe(gulp.insert.prepend(`
    var Blockly = {};Blockly.Msg={};`))
    .pipe(gulp.umd({
      dependencies: function () {
        return [{
          name: 'Blockly',
          amd: '../core-browser',
          cjs: '../core',
        }];
      },
      namespace: function () { return 'Blockly.Msg'; },
      exports: function () { return 'Blockly.Msg'; }
    }))
    .pipe(gulp.dest(`${packageDestination}/msg`));
};

function packageMedia() {
  return gulp.src('./media/*')
    .pipe(gulp.dest(`${packageDestination}/media`));
};

function packageUMD() {
  var srcs = [
    'blockly_compressed.js',
    'msg/js/en.js',
    'blocks_compressed.js',
    'javascript_compressed.js'
  ];
  return gulp.src(srcs)
    .pipe(gulp.concat('blockly.min.js'))
    .pipe(gulp.umd({
      namespace: function () { return 'Blockly'; },
      exports: function () { return 'Blockly'; }
    }))
    .pipe(gulp.dest(`${packageDestination}`))
};

function packageJSON() {
  return gulp.src('./package.json')
    .pipe(gulp.dest(`${packageDestination}`))
}

function packageDTS() {
  return gulp.src('./typings/blockly.d.ts')
    .pipe(gulp.dest(`${packageDestination}`))
}

gulp.task('package-blockly', packageBlockly);
gulp.task('package-blocks', packageBlocks);
gulp.task('package-blockly-node', packageBlocklyNode);

gulp.task('package-javascript', () => packageGenerator('javascript_compressed.js', 'js.js', 'JavaScript'));
gulp.task('package-python', () => packageGenerator('python_compressed.js', 'python.js', 'Python'));
gulp.task('package-lua', () => packageGenerator('lua_compressed.js', 'lua.js', 'Lua'));
gulp.task('package-dart', () => packageGenerator('dart_compressed.js', 'dart.js', 'Dart'));
gulp.task('package-php', () => packageGenerator('php_compressed.js', 'php.js', 'PHP'));

gulp.task('package-locale', packageLocales);
gulp.task('package-media', packageMedia);

gulp.task('package-umd', packageUMD);

gulp.task('package-json', packageJSON);
gulp.task('package-dts', packageDTS);

gulp.task('package', gulp.parallel(
  'package-blockly',
  'package-blocks',
  'package-blockly-node',
  'package-javascript',
  'package-python',
  'package-lua',
  'package-dart',
  'package-php',
  'package-locale',
  'package-media',
  'package-umd',
  'package-json',
  'package-dts',
  () => {
    return gulp.src('./package/*')
      .pipe(gulp.dest(packageDestination));
  }));

// The release task prepares Blockly for release
// It rebuilts the Blockly compressed files and updates the TypeScript
// typings, and then packages all the release files into the /dist directory
gulp.task('release', gulp.series(['build', 'typings', 'package']));

// The default task concatenates files for Node.js, using English language
// blocks and the JavaScript generator.
gulp.task('default', gulp.series(['build', 'blockly_node_javascript_en']));
