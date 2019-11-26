const splitIterator = require('./splitIterator');
const {getTransformNodeStream} = require('./transform');
const {printProgress} = require('./util');
const {Timer} = require('process-stopwatch');

async function skipIterator(iterator) {
  for await (const element of iterator) {
    await element;
  }
}

async function writeNodes(iterator, table, perPage, db, skip = 0) {
  const nodeIterator = splitIterator(iterator, perPage);
  let c = 0;

  await db.ensureTable(table);
  const timer = new Timer();
  timer.start();

  for await (const pageIterator of nodeIterator) {
    const numWritten = (c + 1) * perPage;
    if (numWritten < skip) {
      await skipIterator(pageIterator);
    } else {
      await db.writePage(table, pageIterator, getTransformNodeStream());
    }
    printProgress(numWritten, timer.read().millis);
    c++;
  }
  timer.stop();
  console.log('');
}

module.exports = writeNodes;
