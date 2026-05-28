import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  await conn.execute(
    'UPDATE projects SET problem_id = ? WHERE id = ?',
    ['001', 60001]
  );
  console.log('✅ BAC project updated: problem_id changed to 001');
} catch (err) {
  console.error('❌ Error:', (err as Error).message);
} finally {
  await conn.end();
  process.exit(0);
}
