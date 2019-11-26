async function* splitIterator(parentIterator, numElements) {
  async function* createIterator(element) {
    yield element.value;
    for (var i = 1; i < numElements; i++) {
      let e = await parentIterator.next();
      if (!e.done) {
        yield e.value;
      }
    }
  }
  let e = await parentIterator.next();
  while (!e.done) {
    yield createIterator(e);
    e = await parentIterator.next();
  }
}

module.exports = splitIterator;
