import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  const result = await conn.execute(
    'UPDATE projects SET problem_id = ? WHERE id = ?',
    ['001', 60001]
  );
  console.log('✅ BAC project updated: problem_id changed to 001');
  console.log('Rows affected:', result[0].affectedRows);
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await conn.end();
  process.exit(0);
}
