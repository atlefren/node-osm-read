const splitIterator = require('./splitIterator');
const {printProgress} = require('./util');
const {Timer} = require('process-stopwatch');

async function skipIterator(iterator) {
  for await (const element of iterator) {
    await element;
  }
}

async function writeToDb(iterator, table, perPage, db, getTransformStream, skip = 0) {
  console.log(`Write to ${table}`);
  await db.ensureTable(table);
  const timer = new Timer();
  timer.start();

  let c = 0;
  for await (const pageIterator of splitIterator(iterator, perPage)) {
    const numWritten = (c + 1) * perPage;
    if (numWritten < skip) {
      await skipIterator(pageIterator);
    } else {
      await db.writePage(table, pageIterator, getTransformStream());
    }
    printProgress(numWritten, timer.read().millis);
    c++;
  }
  timer.stop();
}

module.exports = writeToDb;
