const readFile = require('./readOsmFile');
const splitIterator = require('./splitIterator');
const Database = require('./database');
const {getTransformNodeStream} = require('./transform');

async function writeNodes(iterator, table, perPage, db) {
  const nodeIterator = splitIterator(iterator, perPage);
  let c = 0;
  await db.ensureTable(table);
  for await (const pageIterator of nodeIterator) {
    if (c === 2) {
      break;
    }

    console.log('Write', c);
    await db.writePage(table, pageIterator, getTransformNodeStream());

    /*
    for await (const element of pageIterator) {
    }
    console.log('read', c);
    c += perPage;
    */
    c++;
  }
}

async function parseFile(filePath, perPage) {
  const connStr = process.env['CONN_STR'];

  console.log('get iterators');
  const iterators = await readFile(filePath);

  console.log('write nodes');
  const db = new Database(connStr);
  await writeNodes(iterators.nodes, 'osm.nodes', perPage, db);

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
      console.log(err.stack);
      process.exit(1);
    });
};

main();
