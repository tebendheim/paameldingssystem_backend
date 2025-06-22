import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "db",
  password: "mittpassord",
  port: 5432,
});
