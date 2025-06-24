import { Router } from "express";
import { pool } from "../db";
import { requireLogin } from "../middleware/auth_middleware";


const router = Router();

router.post("/:eventId", async (req, res) => {
  const { eventId } = req.params;
  const { email, fieldValues } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lagre registrering
    const registrationResult = await client.query(
      "INSERT INTO registered (email, event_id) VALUES ($1, $2) RETURNING id",
      [email, eventId]
    );
    const registrationId = registrationResult.rows[0].id;

    // Lagre feltverdier
    for (const field of fieldValues) {
      await client.query(
        "INSERT INTO event_field_value (registration_id, event_field_id, value) VALUES ($1, $2, $3)",
        [registrationId, field.event_field_id, field.value]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Registrert!" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Feil ved registrering:", err);
    res.status(500).json({ message: "Noe gikk galt under registrering" });
  } finally {
    client.release();
  }
});


export default router;