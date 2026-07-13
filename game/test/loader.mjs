// test/loader.mjs — Node ESM resolver hook mapping the bare 'three' specifier to
// the vendored module (the browser uses the <script type=importmap> instead).
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const THREE_URL = pathToFileURL(path.resolve('js/vendor/three.module.js')).href;

export function resolve(specifier, context, next) {
  if (specifier === 'three') return { url: THREE_URL, shortCircuit: true };
  return next(specifier, context);
}
