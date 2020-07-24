# Amazon to Bookshop links

Script to convert Amazon to [Bookshop.org](https://bookshop.org/) affiliate links.

Takes a file with text like:

```
href="https://www.amazon.com/gp/product/[ISBN]/..."
```

And replaces it with:

```
href="https://bookshop.org/a/[YOUR AFFILIATE ID]/[UPC]"
```

## Install

```bash
yarn global add convert-affiliate-links
npm install -g convert-affiliate-links
```

## Example usage

```bash
convert-links -r ~/word_press_export.xml -w word_press_import.xml
```

## Help

```bash
% convert-affiliate-links --help
yarn run v1.22.4
$ tsc && node ./build/src/index.js --help
Usage: convert-affiliate-links [options]

Options:
  -V, --version                  output the version number
  -r, --read-path <read-path>
  -w, --write-path <write-path>
  -h, --help                     display help for command
✨  Done in 1.58s.
```

## How?

Uses https://www.isbn.org for ISBN to UPC conversion.
