const {Timer} = require('process-stopwatch');

const readFile = require('./readOsmFile');
const Database = require('./database');
const writeToDb = require('./dbWriter');
const writeWays = require('./ways');
const {getTransformNodeStream} = require('./transform');
const {ms2Time} = require('./util');

async function parseFile(config) {
  const {
    filePath,
    batchSize,
    nodeTable,
    wayTable,
    relationsTable,
    waysStartBlock,
    relationsStartBlock,
    writeNodes,
    writeWays,
    writeRelations
  } = config;

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

  if (writeNodes) {
    console.log('write nodes');
    const nodeIterator = iterators.getNodeIterator();
    await writeToDb(nodeIterator, nodeTable, batchSize, db, getTransformNodeStream);
    console.log('nodes written, creating indicies');
    await db.createIndices(nodeTable);
    console.log('node indices created!');
  }

  if (writeWays) {
    console.log('write ways');
    const wayIterator = iterators.getWayIterator(waysStartBlock);
    await writeWays(wayIterator, wayTable, batchSize, db, nodeTable);
    console.log('ways written, creating indicies');
    await db.createIndices(wayTable);
    console.log('way indices created!');
  }
  if (writeRelations) {
    console.log('write relations');
  }

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

  const config = {
    filePath: args[0],
    batchSize: 10000,
    nodeTable: 'osm.nodes',
    wayTable: 'osm.ways',
    relationsTable: 'osm.relations',
    waysStartBlock: 17515,
    relationsStartBlock: 17515,
    writeNodes: false,
    writeWays: false,
    writeRelations: true
  };

  try {
    await parseFile(config);
    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
