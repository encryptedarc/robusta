import { readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function flatten(value, path = '', result = []) {
  if (value !== null && typeof value === 'object' && Object.keys(value).length) {
    for (const [key, child] of Object.entries(value)) {
      const part = Array.isArray(value) ? `[${key}]` : /^[A-Za-z_$][\w$]*$/.test(key)
        ? `${path ? '.' : ''}${key}` : `[${JSON.stringify(key)}]`;
      flatten(child, path + part, result);
    }
  } else result.push({ path: path || '$', value });
  return result;
}

const kinds = new Set(['direct', 'transformed', 'inferred']);
function validateEvidence(field, paths) {
  if (!paths.has(field.path)) throw new Error(`Unknown JSON path: ${field.path}`);
  if (!kinds.has(field.kind)) throw new Error(`Invalid evidence kind: ${field.path}`);
  if (field.kind !== 'direct' && !field.note?.trim()) throw new Error(`Explain inference/transform: ${field.path}`);
}

export function validateDocument(doc) {
  if (!doc.id || !doc.title || !doc.annotationMethod) throw new Error('Document needs id, title and annotationMethod');
  if (doc.ocr === undefined) throw new Error(`Missing OCR JSON: ${doc.id}`);
  if (!(doc.imageWidth > 0 && doc.imageHeight > 0)) throw new Error(`Invalid dimensions: ${doc.id}`);
  const leaves = flatten(doc.ocr);
  const paths = new Map(leaves.map(field => [field.path, field.value]));
  const crop = doc.crop || [0, 0, doc.imageWidth, doc.imageHeight];
  const [cx, cy, cw, ch] = crop;
  if (crop.length !== 4 || !crop.every(Number.isFinite) || cx < 0 || cy < 0 || cw <= 0 || ch <= 0 || cx + cw > doc.imageWidth || cy + ch > doc.imageHeight)
    throw new Error(`Invalid crop: ${doc.id}`);
  for (const region of doc.regions || []) {
    const [x, y, w, h] = region.box || [];
    if (region.box?.length !== 4 || !region.box.every(Number.isFinite) || x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > 1.00000001 || y + h > 1.00000001)
      throw new Error(`Invalid box: ${doc.id}`);
    if (x * doc.imageWidth < cx - .01 || y * doc.imageHeight < cy - .01 || (x + w) * doc.imageWidth > cx + cw + .01 || (y + h) * doc.imageHeight > cy + ch + .01)
      throw new Error(`Box outside crop: ${doc.id}`);
    if (!region.fields?.length) throw new Error(`Region needs fields: ${doc.id}`);
    for (const field of region.fields) {
      validateEvidence(field, paths);
      if (paths.get(field.path) === null || field.path === 'Raw') throw new Error(`No local box for null/Raw: ${field.path}`);
    }
  }
  for (const [path, meta] of Object.entries(doc.fieldNotes || {})) validateEvidence({ ...meta, path }, paths);
  return { ...doc, crop, leaves };
}

export async function build(manifestFile, outputFile) {
  const manifest = JSON.parse((await readFile(manifestFile, 'utf8')).replace(/^\uFEFF/, ''));
  if (!Array.isArray(manifest.documents) || !manifest.documents.length) throw new Error('At least one image/JSON pair is required');
  const seen = new Set();
  const documents = [];
  const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
  for (const source of manifest.documents) {
    if (seen.has(source.id)) throw new Error(`Duplicate document id: ${source.id}`);
    seen.add(source.id);
    const ocr = typeof source.ocr === 'string' ? JSON.parse((await readFile(resolve(dirname(manifestFile), source.ocr), 'utf8')).replace(/^\uFEFF/, '')) : source.ocr;
    const doc = validateDocument({ ...source, ocr });
    const type = mime[extname(source.image).toLowerCase()];
    if (!type) throw new Error(`Unsupported image: ${source.image}`);
    const bytes = await readFile(resolve(dirname(manifestFile), source.image));
    documents.push({ ...doc, image: `data:${type};base64,${bytes.toString('base64')}` });
  }
  const payload = JSON.stringify({ title: manifest.title || 'OCR → JSON', documents }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const template = await readFile(new URL('../assets/presentation.html', import.meta.url), 'utf8');
  const html = template.replace('/*__OCR_PAYLOAD__*/null', () => payload);
  await writeFile(outputFile, html, 'utf8');
  return { outputFile, documents: documents.length, bytes: Buffer.byteLength(html) };
}

if (process.argv[1] && process.argv[1] !== '-' && await realpath(fileURLToPath(import.meta.url)) === await realpath(resolve(process.argv[1]))) {
  const [, , manifest, output] = process.argv;
  if (!manifest || !output) { console.error('Usage: node build.mjs manifest.json presentation.html'); process.exitCode = 1; }
  else console.log(JSON.stringify(await build(resolve(manifest), resolve(output))));
}
