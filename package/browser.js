/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2019 Google Inc.
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
 * @fileoverview Blockly module for the browser. It includes Blockly core,
 *               built-in blocks, JavaScript generator and English locale.
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([
      './core-browser',
      './msg/en',
      './blocks-browser',
      './js',
    ], factory);
  } else if (typeof exports === 'object') {
    // CommonJS. Node or Webpack.
    module.exports = factory(
        require('./core-browser'),
        require('./msg/en'),
        require('./blocks-browser'),
        require('./js')
    );
  } else {
    // Browser globals (root is window).
    root.Blockly = factory(root.Blockly, root.Blockly.Msg);
  }
})(this, function(Blockly, En) {
  'use strict';

  Blockly.setLocale(En);

  return Blockly;
});
