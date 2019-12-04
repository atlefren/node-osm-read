const {Timer} = require('process-stopwatch');

const readFile = require('./readOsmFile');
//const readFile = require('./readOsmFileFake');
const Database = require('./database');
const writeToDb = require('./dbWriter');
const writeWays = require('./ways');
const {NodeCache, fromFile} = require('./nodeCache');
const {getTransformNodeStream} = require('./transform');
const {ms2Time} = require('./util');

async function createCache(iterators, filename) {
  let cache = await fromFile(filename);
  if (cache) {
    console.log(`Using node cache ${filename}`);
  } else {
    const numNodes = await iterators.countNodes();
    console.log('counted nodes', numNodes);
    const nodeIterator = iterators.getNodeIterator();

    cache = new NodeCache(numNodes);
    await cache.fill(nodeIterator);
    await cache.write(filename);
    console.log(`Created node cache ${filename}`);
  }

  return cache;
}

async function parseFile(filePath, perPage) {
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
  /*
  console.log('write nodes');
  await writeToDb(iterators.getNodeIterator(), 'osm.nodes', perPage, db, getTransformNodeStream, 0);
*/
  /*
  timer.start();
  const nodeCache = await createCache(iterators, 'nodecache.cache');
  timer.stop();
  console.log(`Filled cache in ${ms2Time(timer.read().millis)}`);

  timer.reset();
  */
  console.log('write ways');
  await writeWays(iterators.getWayIterator(17515), 'osm.ways', perPage, db);

  console.log('Done');

  await iterators.close();

  totalTtimer.stop();
  console.log(`Completed in ${ms2Time(totalTtimer.read().millis)}`);
  return;
}

const main = () => {
  const args = process.argv.slice(2);
  if (!args.length === 1) {
    throw new Error('provide filename');
  }

  //parseFile(args[0], 500000)
  parseFile(args[0], 1000)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      console.error(err.stack);
      process.exit(1);
    });
};

main();
