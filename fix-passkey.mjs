import bcrypt from "bcryptjs";
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

// Hash "wts2026v2" with bcrypt (same as the server uses)
const hash = await bcrypt.hash("wts2026v2", 10);
console.log("New bcrypt hash:", hash);

await db.execute("UPDATE projects SET passkeyHash = ? WHERE id = 5", [hash]);
console.log("Updated project 5 passkey hash to bcrypt hash of 'wts2026v2'");

// Also fix project 4 if needed
const [rows] = await db.execute("SELECT id, passkeyHash FROM projects WHERE id IN (4, 5)");
console.log("Current hashes:", rows);

await db.end();
