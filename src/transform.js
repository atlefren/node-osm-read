const {Transform} = require('stream');
const {createPoint, toEWkb} = require('./util');

const getDate = data => (data.timestamp === undefined ? '\\N' : new Date(data.timestamp).toISOString());

const getTags = data => (data.tags === undefined ? '\\N' : JSON.stringify(data.tags).replace(/\\/g, '\\\\'));

const createLine = columns => `${columns.map(c => `${c}`).join('\t')}\n`;

const getTransformNodeStream = () =>
  new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(node, encoding, callback) {
      if (node === 'NEW PAGE') {
        this.push(null);
      }

      const line = createLine([node.id, node.version, getDate(node), getTags(node), toEWkb(createPoint(node))]);
      this.push(Buffer.from(line, 'utf8'));
      callback();
    }
  });

module.exports = {getTransformNodeStream};
