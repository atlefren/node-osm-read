const {Transform} = require('stream');
const {createPoint, toEWkb} = require('./util');

const getDate = timestamp => (timestamp === undefined ? '\\N' : new Date(Number(timestamp)).toISOString());

const getTags = tags => (tags === undefined ? '\\N' : JSON.stringify(tags).replace(/\\/g, '\\\\'));

const createLine = columns => `${columns.map(c => `${c}`).join('\t')}\n`;

const createLineBuffer = (id, version, timestamp, tags, geom) => {
  const line = createLine([id, version, getDate(timestamp), getTags(tags), !!geom ? geom : '\\N']);
  return Buffer.from(line, 'utf8');
};

const createTransformStreamFactory = transform => {
  const getTransformStream = () =>
    new Transform({
      readableObjectMode: true,
      writableObjectMode: true,
      transform(data, encoding, callback) {
        if (data === 'NEW PAGE') {
          this.push(null);
        }
        this.push(transform(data));
        callback();
      }
    });

  return getTransformStream;
};

const getTransformNodeStream = createTransformStreamFactory(node =>
  createLineBuffer(node.id, node.version, node.timestamp, node.tags, toEWkb(createPoint(node)))
);

const getTransformWayStream = createTransformStreamFactory(way =>
  createLineBuffer(way.id, way.version, way.timestamp, way.tags, way.geom)
);

module.exports = {getTransformNodeStream, getTransformWayStream};
