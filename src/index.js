const readFile = require('./readOsmFile');
const Database = require('./database');
const writeNodes = require('./nodes');

async function parseFile(filePath, perPage) {
  const connStr = process.env['CONN_STR'];

  console.log('get iterators');
  const iterators = await readFile(filePath);

  console.log('write nodes');
  const db = new Database(connStr);
  await writeNodes(iterators.nodes, 'osm.nodes', perPage, db, 0);

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
