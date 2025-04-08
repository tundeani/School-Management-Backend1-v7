import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL connected");
    client.release();
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export { pool, connectDB };
