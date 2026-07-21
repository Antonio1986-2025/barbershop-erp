import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/barbershop_erp_test?schema=public' });
const r = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments' ORDER BY ordinal_position");
r.rows.forEach(c => console.log(c.column_name.padEnd(25), c.data_type));
await pool.end();
