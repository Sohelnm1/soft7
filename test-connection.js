import pg from "pg";
import fs from "fs";
 
const { Client } = pg;
 
const client = new Client({
  host: "aws-1-ap-south-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.kmyahwoqdtigpgvhsrhq",
  password: "Soft7Tech459", // replace with your actual Supabase DB password
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("prod-ca-2021.crt").toString(),
  },
});
 
async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Connected successfully!");
    await client.end();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
}
 
testConnection();