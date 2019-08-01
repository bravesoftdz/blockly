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
 * @fileoverview Blockly module for Node. It includes Blockly core,
 *               built-in blocks, all the generators and English locale.
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([
      './core',
      './msg/en',
      './blocks',
      './js',
      './python',
      './lua',
      './dart',
      './php',
    ], factory);
  } else if (typeof exports === 'object') {
    // CommonJS. Node or CommonJS like environments.
    const isBrowser = process.browser;
    const BlocklyCore = isBrowser ?
      require('./core-browser') : require('./core');
    const BlocklyBlocks = isBrowser ?
      require('./blocks-browser') : require('./blocks');
    module.exports = factory(
        BlocklyCore,
        require('./msg/en'),
        BlocklyBlocks,
        require('./js'),
        require('./python'),
        require('./lua'),
        require('./dart'),
        require('./php')
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
