const wkx = require('wkx');

const DbNodeCache = require('./dbNodeCache');
const {toEWkb} = require('./util');
const writeToDb = require('./dbWriter');
const {getTransformWayStream} = require('./transform');

const getNode = (nodes, timestamp) => {
  let match = nodes[0];
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i].timestamp <= timestamp) {
      match = nodes[i];
    } else {
      break;
    }
  }
  if (match && match.geom) {
    return wkx.Geometry.parse(match.geom);
  }
  return null;
};

async function buildLine(way, cache) {
  const allNodes = await cache.getNodes(way.nodeRefs, way.timestamp);

  if (way.nodeRefs.length === 0) {
    return null;
  }

  const points = way.nodeRefs
    .map(nodeRef => {
      const nodes = allNodes.filter(n => n.id === nodeRef);
      return getNode(
        nodes.sort((a, b) => parseInt(a.timestamp - b.timestamp, 10)),
        way.timestamp
      );
    })
    .filter(n => n !== null);

  if (points.length === 0) {
    return null;
  }

  const first = points[0];
  const last = points[points.length - 1];
  try {
    if (first.x === last.x && first.y === last.y) {
      return toEWkb(new wkx.Polygon(points, undefined, 4326));
    }

    return toEWkb(new wkx.LineString(points, 4326));
  } catch (e) {
    console.log(way.nodeRefs);
    console.log(points);
    throw e;
  }
}

async function* buildWays(wayIterator, nodeCache) {
  let isRunning = false;
  for await (const way of wayIterator) {
    if (!isRunning) {
      console.log('start loop');
      isRunning = true;
    }
    const geom = await buildLine(way, nodeCache);
    const d = {...way, geom};
    yield d;
  }
}

async function writeWays(iterator, table, perPage, db) {
  const cache = new DbNodeCache(db.pool);
  const it = await buildWays(iterator, cache);
  await writeToDb(it, table, perPage, db, getTransformWayStream);
}

module.exports = writeWays;
