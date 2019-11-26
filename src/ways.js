const splitIterator = require('./splitIterator');
const wkx = require('wkx');
const {createPoint} = require('./util');

const buildLine = (nodeRefs, nodeCache) => {
  const points = nodeRefs.map(nodeRef => {
    const node = nodeCache.getNodes(nodeRef)[0]; //TODO: figure out what version to use
    const p = createPoint(node);
    return p;
  });
  return new wkx.LineString(points, 4326).toEwkt();
};

async function* buildWays(pageIterator, nodeCache) {
  for await (const way of pageIterator) {
    way.geom = buildLine(way.nodeRefs, nodeCache);
    yield way;
  }
}

async function writeWays(iterator, nodeCache, table, perPage, db) {
  const wayIterator = splitIterator(iterator, perPage);

  for await (const pageIterator of wayIterator) {
    console.log('!!');
    const it = await buildWays(pageIterator, nodeCache);
    for await (way of it) {
      console.log(way);
    }
  }
}

module.exports = writeWays;
