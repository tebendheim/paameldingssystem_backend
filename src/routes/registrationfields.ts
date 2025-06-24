import { Router } from "express";
import { pool } from "../db";
import { requireLogin } from "../middleware/auth_middleware";

const router = Router();

router.get("/event/:id/fields", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM event_field WHERE event_id = $1 ORDER BY prioritet ASC",
      [id]
    );

    // Hvis ingen felter finnes, send tom liste
    res.status(200).json(result.rows); // result.rows vil være [] hvis ingen felter finnes
  } catch (err) {
    console.error("Feil ved henting av felt:", err);
    res.status(500).json({ message: "Noe gikk galt" });
  }
});

router.delete("/event/:id/fields/:fieldId", async (req, res) => {
  const { id, fieldId } = req.params;

  try {
    // Slett raden der både event_id og id (fieldId) matcher
    const result = await pool.query(
      "DELETE FROM event_field WHERE event_id = $1 AND id = $2 RETURNING *;",
      [id, fieldId]
    );

    if (result.rowCount === 0) {
      // Ingen rad ble slettet - feltet finnes ikke eller event_id/fieldId matcher ikke
      res.status(404).json({ message: "Felt ikke funnet" });
      return
    }

    // Returner det slettede feltet (kan fjernes om du ikke trenger det)
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Feil ved sletting av felt:", err);
    res.status(500).json({ message: "Noe gikk galt" });
  }
});

router.post("/event/:eventId/fields/", async (req, res) => {
  const { eventId } = req.params;
  const {label, field_type, is_required } = req.body;
  console.log(label)
  try {
    const maxPriorityResult = await pool.query(
  "SELECT COALESCE(MAX(prioritet), 0) as max_priority FROM event_field WHERE event_id = $1",
  [eventId]
);

const newPriority = maxPriorityResult.rows[0].max_priority + 1;

    const result = await pool.query(
        "INSERT INTO event_field (event_id, label, field_type, is_required, prioritet) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
      [eventId, label, field_type, is_required, newPriority]
    );

    // Hvis ingen felter finnes, send tom liste
    res.status(200).json(result.rows[0]); // result.rows vil være [] hvis ingen felter finnes
  } catch (err) {
    console.error("Feil ved henting av felt:", err);
    res.status(500).json({ message: "Noe gikk galt" });
  }
});


router.put("/event/:eventId/fields/:fieldId", async (req, res) => {
  const { eventId, fieldId } = req.params;
  const { label, field_type, is_required } = req.body;

  try {
    await pool.query(
      `UPDATE event_field 
       SET label = $1, field_type = $2, is_required = $3 
       WHERE event_id = $4 AND id = $5`,
      [label, field_type, is_required, eventId, fieldId]
    );

    // Valgfritt: hent og returner det oppdaterte feltet
    const result = await pool.query(
      "SELECT * FROM event_field WHERE event_id = $1 AND id = $2",
      [eventId, fieldId]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Feil ved oppdatering av felt:", err);
    res.status(500).json({ message: "Noe gikk galt ved oppdatering av felt" });
  }
});

router.put("/event/:eventId/fields/:fieldId/prioritet", async (req, res) => {
  const { fieldId } = req.params;
  const { prioritet } = req.body;

  try {
    await pool.query(
      "UPDATE event_field SET prioritet = $1 WHERE id = $2",
      [prioritet, fieldId]
    );
    res.status(200).json({ message: "Prioritet oppdatert" });
  } catch (err) {
    console.error("Feil ved oppdatering av prioritet", err);
    res.status(500).json({ message: "Noe gikk galt" });
  }
});

export default router;