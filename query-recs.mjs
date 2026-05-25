import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.query(
  'SELECT r.id, r.startupId, r.decision, r.narrative, s.name FROM recommendations r LEFT JOIN startups s ON s.id = r.startupId WHERE r.projectId = 5 ORDER BY r.id'
);
rows.forEach(r => console.log(`--- ID:${r.id} startup:${r.name} decision:${r.decision}\n${r.narrative}\n`));
await conn.end();
process.exit(0);
