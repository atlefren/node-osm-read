const fs = require('fs').promises;

async function writeInt(fd, position, n) {
  const buf = Buffer.allocUnsafe(4);
  buf.writeUInt32BE(n);
  await fd.write(buf, 0, buf.length, position);
}

async function readInt(fd, position) {
  const buf = Buffer.allocUnsafe(4);
  await fd.read(buf, 0, buf.length, position);
  return buf.readUInt32BE();
}

const toArrayBuffer = buffer => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

async function write(fileName, arrs) {
  const fd = await fs.open(fileName, 'w');
  let pos = 0;
  for (let arr of arrs) {
    const dataView = new DataView(arr.buffer);
    const buffer = Buffer.from(new Uint8Array(dataView.buffer));
    const bufferLength = buffer.length;
    await writeInt(fd, pos, bufferLength);
    pos += 2;
    await fd.write(buffer, 0, bufferLength, pos);
    pos += bufferLength;
  }

  await fd.close();
}

async function read(fileName) {
  try {
    const fd = await fs.open(fileName, 'r');
    let pos = 0;
    const res = [];
    for (let i = 0; i < 5; i++) {
      const length = await readInt(fd, pos);
      const buffer = Buffer.allocUnsafe(length);
      pos += 2;
      await fd.read(buffer, 0, length, pos);
      res.push(toArrayBuffer(buffer));
      pos += length;
    }
    return res;
  } catch (e) {
    return undefined;
  }
}

async function writeCacheFile(fileName, arrays) {
  await write(fileName, [arrays.ids, arrays.versions, arrays.timestamps, arrays.lats, arrays.lons]);
}

async function readCacheFile(fileName) {
  const res = await read(fileName);
  if (!res) {
    return undefined;
  }
  const ids = new BigInt64Array(res[0]);
  const versions = new Uint32Array(res[1]);
  const timestamps = new BigInt64Array(res[2]);
  const lats = new Float64Array(res[3]);
  const lons = new Float64Array(res[4]);
  return {ids, versions, timestamps, lats, lons};
}

module.exports = {writeCacheFile, readCacheFile};
