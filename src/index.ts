/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import parseValue from 'postcss-value-parser';
import type {PluginCreator} from 'postcss';

// A namespace declaration is necessary to export the `Options` type while also
// using the `export =` syntax that PostCSS requires. See postcss/postcss#1771.
//
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace plugin {
  /** Options for `postcss-src`. */
  export interface Options {
    /**
     * By default, if `postcss-src` encounters a `src()` that it can't safely
     * convert to a `url()` (such as `src(var(--foo))`), it will throw an error.
     *
     * If this is `true`, it will emit the `src()` unchanged instead.
     */
    allowNativeSrc?: boolean;
  }
}

const plugin: PluginCreator<plugin.Options> = (opts = {}) => {
  return {
    postcssPlugin: 'postcss-src',

    // TODO(nweiz): Define `Declaration` rather than a `Once` processor once we
    // no longer need to polyfill PostCSS 8 support into PostCSS 7 within
    // Google.
    Once(root) {
      root.walkDecls(decl => {
        const value = parseValue(decl.value);
        value.walk(node => {
          if (node.type !== 'function' || node.value !== 'src') return;

          // If a `src()` contains something other than a quoted string (such as
          // a `var()`) it's not something we can convert to a valid `url()`.
          const first = node.nodes[0];
          if (first?.type !== 'string') {
            if (opts.allowNativeSrc) return;
            throw decl.error(
              "A src() function's first argument must be a quoted string.",
              {word: node.toString()}
            );
          }

          // `src(<string> <url-modifier>)` is valid, but we can't strip the
          // quotes—we have to convert it to `url(<string> <url-modifier>)`.
          if (
            node.nodes.length !== 1 ||
            // In principle, if there's only one of these characters it's still
            // more efficient to avoid quotes in the `url()`, but that would
            // require re-encoding the string which is very difficult due to
            // TrySound/postcss-value-parser#64.
            //
            // eslint-disable-next-line no-control-regex
            first.value.match(/[\\"'()\s\x00-\x08\x0B\x0E-\x1F\x7F]/)
          ) {
            node.value = 'url';
          } else {
            node.value = 'url';
            // Remove quotes by changing the type to `word`.
            node.nodes = [{...first, type: 'word'}];
          }
        });
        decl.value = value.toString();
      });
    },
  };
};
plugin.postcss = true;

export = plugin;
