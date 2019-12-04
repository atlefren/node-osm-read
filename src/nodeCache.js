const {writeCacheFile, readCacheFile} = require('./fileCache');

/*
An attempt to create a cache file, but ended up requiring too much memory
*/

class NodeCache {
  constructor(numElements) {
    if (numElements) {
      this.ids = new BigInt64Array(numElements);
      this.versions = new Uint32Array(numElements);
      this.timestamps = new BigInt64Array(numElements);
      this.lats = new Float64Array(numElements);
      this.lons = new Float64Array(numElements);
    }
  }

  async fill(iterator) {
    let i = 0;
    for await (let node of iterator) {
      this.ids[i] = node.id;
      this.versions[i] = node.version;
      this.timestamps[i] = BigInt(node.timestamp);
      this.lats[i] = node.lat;
      this.lons[i] = node.lon;
      i++;
    }
  }

  findById(id) {
    let i = 0;
    var res = [];
    for (i; i < this.ids.length; i++) {
      if (this.ids[i] == id) {
        res.push(i);
      }
    }
    return res;
  }

  getByIndex(index) {
    return {
      id: this.ids[index],
      version: this.versions[index],
      timestamp: this.timestamps[index],
      lat: this.lats[index],
      lon: this.lons[index]
    };
  }

  getNodes(id) {
    const nodes = this.findById(id).map(i => this.getByIndex(i));
    return nodes.sort((a, b) => parseInt(a.timestamp - b.timestamp, 10));
  }

  async write(fileName) {
    await writeCacheFile(fileName, {
      ids: this.ids,
      versions: this.versions,
      timestamps: this.timestamps,
      lats: this.lats,
      lons: this.lons
    });
  }
}

async function fromFile(fileName) {
  const res = await readCacheFile(fileName);
  if (!res) {
    return false;
  }
  const nodeCache = new NodeCache();
  nodeCache.ids = res.ids;
  nodeCache.versions = res.versions;
  nodeCache.timestamps = res.timestamps;
  nodeCache.lats = res.lats;
  nodeCache.lons = res.lons;
  return nodeCache;
}

module.exports = {NodeCache, fromFile};
