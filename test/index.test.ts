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

import plugin = require('../build');
import postcss, {Result} from 'postcss';

async function run(input: string, options?: plugin.Options): Promise<Result> {
  return await postcss([plugin(options)]).process(input, {from: undefined});
}

function assertCompiles(result: Result, output: string): void {
  expect(result.css).toEqual(output);
  expect(result.warnings()).toHaveLength(0);
}

async function assertCompileError(
  input: string,
  options?: plugin.Options
): Promise<void> {
  await expect(async () => (await run(input, options)).css).rejects.toThrow(
    'postcss-src:'
  );
}

describe('converts a src() to a URL', () => {
  it('and removes its quotes', async () => {
    assertCompiles(
      await run('a {b: src("https://google.com/")}'),
      'a {b: url(https://google.com/)}'
    );
  });

  describe('preserves its quotes if', () => {
    it('contains an ident url modifier', async () => {
      assertCompiles(
        await run('a {b: src("https://google.com/" foo)}'),
        'a {b: url("https://google.com/" foo)}'
      );
    });

    it('contains a function url modifier', async () => {
      assertCompiles(
        await run('a {b: src("https://google.com/" foo(bar))}'),
        'a {b: url("https://google.com/" foo(bar))}'
      );
    });

    it('contains a backslash', async () => {
      assertCompiles(
        await run('a {b: src("https://google.com/\\a")}'),
        'a {b: url("https://google.com/\\a")}'
      );
    });

    it('contains a single quote', async () => {
      assertCompiles(
        await run('a {b: src("https://google.com/\'")}'),
        'a {b: url("https://google.com/\'")}'
      );
    });

    it('contains a double quote', async () => {
      assertCompiles(
        await run("a {b: src('https://google.com/\"')}"),
        "a {b: url('https://google.com/\"')}"
      );
    });

    it('contains a open paren', async () => {
      assertCompiles(
        await run('a {b: src("https://google.com/(")}'),
        'a {b: url("https://google.com/(")}'
      );
    });

    it('contains a close paren', async () => {
      assertCompiles(
        await run('a {b: src("https://google.com/)")}'),
        'a {b: url("https://google.com/)")}'
      );
    });

    it('contains a space', async () => {
      assertCompiles(
        await run('a {b: src("https://google.com/ ")}'),
        'a {b: url("https://google.com/ ")}'
      );
    });

    it('contains a tab', async () => {
      assertCompiles(
        await run('a {b: src("https://google.com/\t")}'),
        'a {b: url("https://google.com/\t")}'
      );
    });

    it('contains a non-printable character', async () => {
      assertCompiles(
        await run('a {b: src("https://google.com/\x1A")}'),
        'a {b: url("https://google.com/\x1A")}'
      );
    });
  });
});

describe('with a variable', () => {
  it('throws an error with allowNativeSrc: false', async () => {
    await assertCompileError('a {b: src(var(--foo))}');
  });

  it('compiles to src with allowNativeSrc: true', async () => {
    assertCompiles(
      await run('a {b: src(var(--foo))}', {allowNativeSrc: true}),
      'a {b: src(var(--foo))}'
    );
  });
});
