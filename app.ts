import db from './src/lib/db';
async function run() {
  const doc = await db.document.findFirst({ where: { extractedText: { not: null } } });
  console.log('Doc ID:', doc?.id);
  process.exit(0);
}
run();
