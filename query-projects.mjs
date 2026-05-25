import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

const [rows] = await conn.execute('SELECT id, name, passkey, client_slug, problem_id FROM projects ORDER BY id');
console.log(JSON.stringify(rows, null, 2));
await conn.end();
