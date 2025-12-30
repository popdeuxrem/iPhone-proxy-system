import { generate } from './generator.js';
import fs from 'fs-extra';

async function main() {
  await generate();
  console.log('✅ Full build complete: proxy.pac + mobileconfig');
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(console.error);
