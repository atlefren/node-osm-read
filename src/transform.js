const {Transform} = require('stream');
const wkx = require('wkx');

const toEWkb = (lat, lon) => new wkx.Point(lon, lat, undefined, undefined, 4326).toEwkb().toString('hex');

const getDate = data => (data.timestamp === undefined ? 'N' : new Date(data.timestamp).toISOString());

const getTransformNodeStream = () =>
  new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(data, encoding, callback) {
      if (data === 'NEW PAGE') {
        this.push(null);
      }
      this.push(
        Buffer.from(
          `${data.id}\t${data.version}\t${getDate(data)}\t${JSON.stringify(data.tags)}\t${toEWkb(data.lat, data.lon)}\n`
        )
      );
      callback();
    }
  });

module.exports = {getTransformNodeStream};
