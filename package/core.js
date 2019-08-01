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
 * @fileoverview Blockly core module for Node.
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([
      './blockly_compressed-node'
    ], factory);
  } else if (typeof exports === 'object') {
    // CommonJS. Node or CommonJS like environments.
    module.exports = factory(process.browser ?
      require('./blockly_compressed') :
      require('./blockly_compressed-node'));
  } else {
    // Browser globals (root is window).
    root.Blockly = factory(root.Blockly);
  }
})(this, function(Blockly) {
  'use strict';
  
  // Add a helper method to set the Blockly locale.
  Blockly.setLocale = function(locale) {
    Blockly.Msg = Object.assign(Blockly.Msg || {}, locale);
  };

  return Blockly;
});
