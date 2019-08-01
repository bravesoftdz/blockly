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
 * @fileoverview Blockly built-in Blocks.
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([
      './core-browser',
      './blocks_compressed'
    ], factory);
  } else if (typeof exports === 'object') {
    // CommonJS. Node or Webpack.
    module.exports = factory(
        require('./core-browser'),
        require('./blocks_compressed')
    );
  } else {
    root.Blockly.Blocks = factory(root.Blockly, root.Blockly.Blocks);
    // Browser globals (root is window).
  }
})(this, function(Blockly, BlocklyBlocks) {
  'use strict';
  
  // Make sure we are not override Blockly.Blocks with the built in blocks
  // but instead, extending it.
  Blockly.Blocks = Object.assign(Blockly.Blocks, BlocklyBlocks);
  
  return Blockly.Blocks;
});
