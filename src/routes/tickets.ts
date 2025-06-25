import Router from "express"
import { pool } from "../db";
import { requireLogin } from "../middleware/auth_middleware";

const router = Router();

router.get("/:eventId", async (req, res) => {
  const { eventId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM event_tickets WHERE event_id = $1",
      [eventId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunne ikke hente billettyper" });
  }
});


router.post("/:eventId/tickets", async (req, res) => {
  const { eventId } = req.params;
  const { name, price } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO event_tickets (event_id, name, price) VALUES ($1, $2, $3) RETURNING *",
      [eventId, name, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunne ikke legge til billettype" });
  }
});


export default router;
