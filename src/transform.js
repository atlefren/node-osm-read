const {Transform} = require('stream');
const wkx = require('wkx');

const toEWkb = (lat, lon) => new wkx.Point(lon, lat, undefined, undefined, 4326).toEwkb().toString('hex');

const getDate = data => (data.timestamp === undefined ? '\\N' : new Date(data.timestamp).toISOString());

const getTags = data => (data.tags === undefined ? '\\N' : JSON.stringify(data.tags).replace(/\\/g, '\\\\'));

const createLine = columns => `${columns.map(c => `${c}`).join('\t')}\n`;

const getTransformNodeStream = () =>
  new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(data, encoding, callback) {
      if (data === 'NEW PAGE') {
        this.push(null);
      }

      const line = createLine([data.id, data.version, getDate(data), getTags(tags), toEWkb(data.lat, data.lon)]);
      this.push(Buffer.from(line, 'utf8'));
      callback();
    }
  });

module.exports = {getTransformNodeStream};
