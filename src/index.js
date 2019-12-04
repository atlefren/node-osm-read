const {Timer} = require('process-stopwatch');

const readFile = require('./readOsmFile');
const Database = require('./database');
const writeToDb = require('./dbWriter');
const writeWays = require('./ways');
const {getTransformNodeStream} = require('./transform');
const {ms2Time} = require('./util');

async function parseFile(filePath, perPage, nodeTable, wayTable, waysStartBlock) {
  const totalTtimer = new Timer();
  totalTtimer.start();
  const timer = new Timer();
  const connStr = process.env['CONN_STR'];
  const db = new Database(connStr);

  timer.start();
  console.log('get iterators');
  const iterators = await readFile(filePath);
  timer.stop();
  console.log(`got iterators in ${ms2Time(timer.read().millis)}`);
  timer.reset();

  console.log('write nodes');
  const nodeIterator = iterators.getNodeIterator();
  await writeToDb(nodeIterator, nodeTable, perPage, db, getTransformNodeStream, 0);

  timer.reset();

  console.log('write ways');
  const wayIterator = iterators.getWayIterator(waysStartBlock);
  await writeWays(wayIterator, wayTable, perPage, db, nodeTable);

  console.log('Done');

  await iterators.close();

  totalTtimer.stop();
  console.log(`Completed in ${ms2Time(totalTtimer.read().millis)}`);
  return;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length === 1) {
    throw new Error('provide filename');
  }

  const filePath = args[0];
  const batchSize = 10000;
  const nodeTable = 'osm.nodes';
  const wayTable = 'osm.ways';
  const waysStartBlock = 17515;

  try {
    await parseFile(filePath, batchSize, nodeTable, wayTable, waysStartBlock);
    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
