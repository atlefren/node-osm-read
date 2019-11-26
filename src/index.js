//const readFile = require('./readOsmFile');
const readFile = require('./readOsmFileFake');
const Database = require('./database');
const writeNodes = require('./nodes');
const writeWays = require('./ways');
const NodeCache = require('./nodeCache');

async function createCache(iterators) {
  const numNodes = await iterators.countNodes();
  console.log('counted nodes', numNodes);
  const nodeIterator = iterators.getNodeIterator();
  console.log(nodeIterator);
  const cache = new NodeCache(numNodes);
  await cache.fill(nodeIterator);
  console.log('filled cache');
  return cache;
}

async function parseFile(filePath, perPage) {
  const connStr = process.env['CONN_STR'];

  console.log('get iterators');
  const iterators = await readFile(filePath);
  console.log('got iterators');

  const db = new Database(connStr);

  /*
  console.log('write nodes');
  await writeNodes(iterators.getNodeIterator(), 'osm.nodes', perPage, db, 0);
  */

  const nodeCache = await createCache(iterators);

  console.log('write ways');
  await writeWays(iterators.getWayIterator(), nodeCache, 'osm.nodes', 1, db);

  console.log('Done');
  return await iterators.close();
}

const main = () => {
  const args = process.argv.slice(2);
  if (!args.length === 1) {
    throw new Error('provide filename');
  }

  parseFile(args[0], 100000)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      console.error(err.stack);
      process.exit(1);
    });
};

main();
