var {Pool} = require('pg');
var copyFrom = require('pg-copy-streams').from;
const {Readable} = require('stream');

const pipe = (fileStream, stream) =>
  new Promise((resolve, reject) => {
    fileStream.on('error', err => {
      reject(err);
    });
    stream.on('error', err => {
      reject(err);
    });
    stream.on('end', () => {
      resolve();
    });
    fileStream.pipe(stream);
  });

const toStdOut = s =>
  new Promise(resolve => {
    s.on('end', resolve);
    s.pipe(process.stdout);
  });

async function write(pool, fileStream, tableName) {
  const client = await pool.connect();
  try {
    const stream = client.query(copyFrom(`COPY ${tableName} FROM STDIN`)); //(DELIMITER ',', FORMAT 'csv', QUOTE '"')
    await pipe(fileStream, stream);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

const getStream = pageGenerator =>
  new Readable({
    objectMode: true,
    async read() {
      const e = await pageGenerator.next();
      if (!e.done) {
        this.push(e.value, 'utf8');
      } else {
        this.push(null);
      }
    }
  });

const getSchema = tableName => (tableName.split('.').length > 1 ? tableName.split('.')[0] : undefined);

class Database {
  constructor(connectionString) {
    if (!connectionString) {
      throw new Error('No connection string');
    }
    this.pool = new Pool({connectionString});
  }

  async createIndices(tableName) {
    const client = await this.pool.connect();
    try {
      await client.query(`CREATE INDEX ON ${tableName} (id);`);
      await client.query(`CREATE INDEX ON ${tableName} (version);`);
      await client.query(`CREATE INDEX ON ${tableName} (geom) USING gist;`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async ensureTable(tableName) {
    const client = await this.pool.connect();
    try {
      const schema = getSchema(tableName);
      if (schema) {
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      }

      const query = `CREATE TABLE IF NOT EXISTS ${tableName} (
        id bigint,
        version int,
        ts timestamp,
        tags jsonb,
        geom geometry(Geometry, 4326)
      )`;

      await client.query(query);

      await client.query(`TRUNCATE TABLE ${tableName}`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async writePage(tableName, pageGenerator, transformStream) {
    const stream = getStream(pageGenerator).pipe(transformStream);
    await write(this.pool, stream, tableName);
    //await toStdOut(stream);
    stream.destroy();
  }
}

module.exports = Database;
