import { getDb } from '../server/db.js';
import { projects } from '../drizzle/schema.js';

const db = await getDb();
if (!db) {
  console.error('❌ DB unavailable');
  process.exit(1);
}

const allProjects = await db.select().from(projects);
console.log('All projects:');
allProjects.forEach(p => {
  console.log(`  ID: ${p.id}, slug: ${p.clientSlug}, problemId: ${p.problemId}, name: ${p.name}`);
});
