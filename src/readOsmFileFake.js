function* getIterator(elements) {
  for (let e of elements) {
    yield makeAsync(e);
  }
}

const makeAsync = ret =>
  new Promise(res => {
    res(ret);
  });

async function* iterator(elements) {
  for (let e of elements) {
    yield makeAsync(e);
  }
}

const ways = [
  {
    id: '3236404',
    tags: {
      ref: 'RV4',
      layer: '1',
      bridge: 'yes',
      oneway: 'yes',
      highway: 'trunk',
      created_by: 'Potlatch alpha'
    },
    nodeRefs: ['662816', '25418059', '26819210', '29756298', '29756291', '662800', '662798'],
    version: 1,
    timestamp: 1188996908000,
    changeset: 340696,
    uid: '4948'
  }
];

const nodes = [
  {
    id: 1,
    version: 1,
    timestamp: 1000000000001,
    lon: 9.728393554687498,
    lat: 61.82990315000976
  },
  {
    id: 2,
    version: 1,
    timestamp: 1000000000001,
    lon: 9.80804443359375,
    lat: 61.797794623727334
  },
  {
    id: 3,
    version: 1,
    timestamp: 1000000000001,
    lon: 9.775772094726562,
    lat: 61.74713119356279
  },
  {
    id: 4,
    version: 1,
    timestamp: 1000000000000,
    lon: 10.89044189453125,
    lat: 61.73737865615361
  },
  {
    id: 4,
    version: 2,
    timestamp: 1000000000001,
    lon: 9.89044189453125,
    lat: 61.75737865615361
  },
  {
    id: 5,
    version: 1,
    timestamp: 1000000000001,
    lon: 9.92134094238281,
    lat: 61.75038135308852
  },
  {
    id: 6,
    version: 1,
    timestamp: 1000000000001,
    lon: 9.903488159179688,
    lat: 61.81758263569754
  },
  {
    id: 7,
    version: 1,
    timestamp: 1000000000001,
    lon: 9.833450317382812,
    lat: 61.83833012620531
  },
  {
    id: 8,
    version: 1,
    timestamp: 1000000000001,
    lon: 9.902114868164062,
    lat: 61.84254274629853
  },
  {
    id: 80,
    version: 1,
    timestamp: 1000000000001,
    lon: 9.643936157226562,
    lat: 61.73380195189383
  },
  {
    id: 81,
    version: 1,
    timestamp: 1000000000001,
    lon: 9.718093872070312,
    lat: 61.677169728686735
  },
  {
    id: 82,
    version: 1,
    timestamp: 1000000000001,
    lon: 9.792251586914062,
    lat: 61.68205591328494
  }
].map(e => ({...e, id: BigInt(e.id)}));

async function readFile(filePath) {
  return {
    getNodeIterator: () => iterator(nodes),
    getWayIterator: () => iterator(ways),
    //getRelationIterator: () => parseBlocks(fileBlocks, parser, 'relation'),
    countNodes: () => makeAsync(nodes.length),
    //countWays: () => count(fileBlocks, parser, 'way'),
    //countRelations: () => count(fileBlocks, parser, 'relation'),
    close: () =>
      new Promise((resolve, reject) => {
        resolve();
      })
  };
}

module.exports = readFile;
