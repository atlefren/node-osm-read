const {createPbfParser} = require('osm-read');

const getParser = filePath =>
  new Promise((resolve, reject) => {
    createPbfParser({
      filePath,
      callback: (err, parser) => {
        if (err) {
          reject(err);
        } else {
          resolve(parser);
        }
      }
    });
  });

const readBlock = (parser, fileBlock) => {
  return new Promise((resolve, reject) => {
    parser.readBlock(fileBlock, (err, block) => {
      if (err) {
        reject(err);
      } else {
        resolve(block);
      }
    });
  });
};

function* getElements(pg, elementType) {
  const view = pg[`${elementType}sView`];
  for (let i = 0; i < view.length; ++i) {
    const element = view.get(i);
    yield element; //{...element, id: BigInt(element.id), timestamp: BigInt(element.timestamp)};
  }
}

function* readGroup(group, elementType) {
  for (var i = 0; i < group.length; ++i) {
    const pg = group[i];
    yield* getElements(pg, elementType);
  }
}

async function* parseBlocks(fileBlocks, parser, elementType, startBlock = 0) {
  for (var i = startBlock; i < fileBlocks.length; ++i) {
    const block = await readBlock(parser, fileBlocks[i]);
    yield* readGroup(block.primitivegroup, elementType);
  }
}

const countView = (pg, elementType) => pg[`${elementType}sView`].length;

const countGroup = (group, elementType) => group.reduce((acc, pg) => acc + countView(pg, elementType), 0);

async function count(fileBlocks, parser, elementType) {
  let count = 0;
  for (var i = 0; i < fileBlocks.length; ++i) {
    const block = await readBlock(parser, fileBlocks[i]);
    count += countGroup(block.primitivegroup, elementType);
  }
  return count;
}

async function readFile(filePath) {
  const parser = await getParser(filePath);
  const fileBlocks = parser.findFileBlocksByBlobType('OSMData');
  return {
    getNodeIterator: block => parseBlocks(fileBlocks, parser, 'node', block),
    getWayIterator: block => parseBlocks(fileBlocks, parser, 'way', block),
    getRelationIterator: () => parseBlocks(fileBlocks, parser, 'relation', block),
    countNodes: () => count(fileBlocks, parser, 'node'),
    countWays: () => count(fileBlocks, parser, 'way'),
    countRelations: () => count(fileBlocks, parser, 'relation'),
    close: () =>
      new Promise((resolve, reject) => {
        parser.close(err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      })
  };
}

module.exports = readFile;
