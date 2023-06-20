# Open source PostCSS polyfill for the new `src()` function

CSS Values and Units Level 4 defines [a `src()` function]. This function works
just like the old-school `url()` function, but without `url()`'s legacy parsing
behavior that prevents the use of additional CSS functions like `var()` inside
it.

[a `src()` function]: https://www.w3.org/TR/css-values-4/#funcdef-src

This plugin polyfills the `src()` function by compiling it to an equivalent
`url()`, getting rid of the quotes around the string if possible. For example:

```css
body {
  background: src("http://www.example.com/pinkish.gif");
}
```

is transformed into:

```css
body {
  background: url(http://www.example.com/pinkish.gif);
}
```

Although this plugin doesn't natively polyfill CSS variables, it can be used
with other polyfills like [`postcss-custom-properties`] to make it possible to
include build-time variable values in `url()`s. But make sure you run
`postcss-src` last in your plugin chain!

[`postcss-custom-properties`]: https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-custom-properties

For example:

```css
/* With both postcss-custom-properties and postcss-src: */

:root {
  --pinkish: "http://www.example.com/pinkish.gif";
}

body {
  background: src(var(--pinkish));
}
```

is transformed into:

```css
body {
  background: url(http://www.example.com/pinkish.gif);
}
```

## Usage

Add `postcss-src` to your project:

```sh
npm install postcss-src --save-dev
```

Use `postcss-src` as a PostCSS plugin:

```js
const postcss = require('postcss');
const postcssSrc = require('postcss-src);

postcss([
  postcssSrc(/* plugin options */)
]).process(css /*, PostCSS options */);
```

### Options

#### `allowNativeSrc`

By default, if `postcss-src` encounters a `src()` that it can't safely convert
to a `url()` (such as `src(var(--foo))`), it will throw an error.

If this is `true`, it will emit the `src()` unchanged instead.

```js
postcssSrc({
  allowNativeSrc: true,
});
```

For example, this throws an error by default but with `allowNativeSrc: true` it
will be left unchanged.

```css
/* Without postcss-custom-properties */

body {
  background: src(var(--foo));
}
```
