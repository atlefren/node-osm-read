class DbNodeCache {
  constructor(pool, nodeTable) {
    this.pool = pool;
    this.nodeTable = nodeTable;
  }

  async getNodes(ids, maxTs) {
    const client = await this.pool.connect();
    try {
      const nodes = await client.query({
        text: `
          SELECT
            id,
            version,
            extract(epoch from ts) * 1000 as timestamp,
            st_asewkb(geom) as geom
          FROM
            ${this.nodeTable}
          WHERE
            id = ANY($1::bigint[])
          AND
            extract(epoch from ts) * 1000 <= $2
          ;
        `,
        values: [ids, maxTs]
      });
      return nodes.rows;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = DbNodeCache;
