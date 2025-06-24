import { Pool } from "pg";

export const pool = new Pool({
  user: "tomel",
  host: "localhost",
  database: "db",
  password: "mittpassord",
  port: 5432,
});
