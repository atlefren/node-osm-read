class Cache {
  constructor(numElements) {
    this.ids = new BigInt64Array(numElements);
    this.versions = new Int16Array(numElements);
    this.lats = new Float64Array(numElements);
    this.lons = new Float64Array(numElements);
  }

  fill(iterator) {
    let i = 0;
    for (let node of iterator) {
      this.ids[i] = node.id;
      this.versions[i] = node.version;
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
      lat: this.lats[index],
      lon: this.lons[index]
    };
  }
}
/*
const findById = (id, cache) => {
  let i = 0;
  var res = [];
  for (i; i < cache.ids.length; i++) {
    if (cache.ids[i] == id) {
      res.push(i);
    }
  }
  return res;
};

const getByIndex = (index, cache) => ({
  id: cache.ids[index],
  version: cache.versions[index],
  lat: cache.lats[index],
  lon: cache.lons[index]
});
const createCache = (iterator, length) => {
  const lats = new Float64Array(length);
  const lons = new Float64Array(length);
  const versions = new Int16Array(length);
  const ids = new BigInt64Array(length);

  let i = 0;
  for (let node of iterator) {
    ids[i] = node.id;
    versions[i] = node.version;
    lats[i] = node.lat;
    lons[i] = node.lon;

    //console.log(i, ': ', node.id, node.version, node.lat, node.lon);
    i++;
  }

  return {
    lats,
    lons,
    versions,
    ids
  };
};
*/
const rand = (min, max) => Math.random() * (max - min) + min;

function* iterator(numIds, numVersions) {
  for (let id = 1; id <= numIds; id++) {
    for (let v = 1; v <= numVersions; v++) {
      yield {
        id: BigInt(id),
        version: v,
        lat: rand(-90, 90),
        lon: rand(-180, 180)
      };
    }
  }
}

const numIds = 150000000;
const numVersions = 3;

const cache = new Cache(numIds * numVersions);
cache.fill(iterator(numIds, numVersions));
console.log('cache filled');

const indices = cache.findById(BigInt(430010n));

for (let index of indices) {
  console.log(cache.getByIndex(index));
}
