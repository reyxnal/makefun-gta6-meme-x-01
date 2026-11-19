// gta6-meme-x-01 entrypoint (Node 22, standard library only, no network, no clock).
//
// The entry is the X post itself: this program only hands the gate the post's
// address. It reads POST.json from the repository root, checks that it is a
// JSON object whose `url` names an X post (https://x.com/<handle>/status/<id>,
// or the same on twitter.com), and copies it byte-for-byte to /output.
// A placeholder or malformed POST.json fails loudly instead of silently
// shipping a bad file, so a broken entry is caught here, not at the gate.
//
// Local run (mirrors the grader's layout):
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// An X post address: optional www./mobile. subdomain, x.com or twitter.com,
// /<handle>/status/<digits> or /i/web/status/<digits>; a query or fragment
// after the id is read past by the house, so it is accepted here too.
const POST_URL =
  /^https:\/\/(?:www\.|mobile\.)?(?:x\.com|twitter\.com)\/(?:[^/\s]+\/status\/\d+|(?:i\/web\/)?status\/\d+)(?:[?#]\S*)?$/;

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

const sourcePath = join(BOT_DIR, 'POST.json');
let raw: string;
try {
  raw = readFileSync(sourcePath, 'utf8');
} catch (err) {
  fail(`cannot read POST.json from ${sourcePath}: ${(err as Error).message}`);
}

let post: unknown;
try {
  post = JSON.parse(raw!);
} catch (err) {
  fail(`POST.json is not valid JSON: ${(err as Error).message}`);
}

if (typeof post !== 'object' || post === null || Array.isArray(post)) {
  fail('POST.json must be a JSON object like {"url": "https://x.com/<handle>/status/<id>"}');
}
const url = (post as { url?: unknown }).url;
if (typeof url !== 'string' || !POST_URL.test(url)) {
  fail(
    `POST.json "url" must be an X post address (https://x.com/<handle>/status/<id>); got: ${JSON.stringify(url)}`,
  );
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(sourcePath, join(OUTPUT_DIR, 'POST.json'));
} catch (err) {
  fail(`cannot copy POST.json to ${OUTPUT_DIR}: ${(err as Error).message}`);
}
