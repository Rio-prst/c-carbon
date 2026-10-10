import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  console.log('Connected to DB');

  await client.query(`
    UPDATE farms 
    SET name = 'Kebun Karet Rakyat Mandiri', commodity = 'Karet' 
    WHERE name = 'Lahan Padi Sawah'
  `);

  await client.query(`
    UPDATE farms 
    SET name = 'Kebun Karet Agroforestri', commodity = 'Karet' 
    WHERE name = 'Lahan Kopi'
  `);

  await client.query(`
    UPDATE farms 
    SET name = 'Kebun Karet Hutan Lestari', commodity = 'Karet' 
    WHERE name = 'Lahan Jagung'
  `);

  await client.query(`
    UPDATE farms 
    SET commodity = 'Karet'
  `);

  const res = await client.query('SELECT id, name, commodity, land_area_ha FROM farms ORDER BY name');
  console.log('ALL FARMS NOW:');
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
