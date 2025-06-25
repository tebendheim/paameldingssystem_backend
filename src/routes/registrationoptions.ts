import { Router } from "express";
import { pool } from "../db";
import { requireLogin } from "../middleware/auth_middleware";

const router = Router();

// Oppdater felt
router.put("/:eventId/:fieldId/:optionId",requireLogin, async (req, res) => {
  const { eventId, fieldId, optionId } = req.params;
  const updates = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM fields WHERE id = $1 AND event_id = $2",
      [fieldId, eventId]
    );
    const field = result.rows[0];
    if (!field) {
         res.status(404).json({ error: "Field not found" })
         return
    };

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setters = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

    const updateQuery = `
      UPDATE fields
      SET ${setters}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;
    const updated = await pool.query(updateQuery, [...values, fieldId]);

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Hent alle options for et event
router.get("/event/:eventId/", requireLogin, async (req, res) => {
  const { eventId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT f.id as field_id, f.label as field_label, o.id as option_id, o.value as option
      FROM event_field f
      LEFT JOIN field_options o ON f.id = o.field_id
      WHERE f.event_id = $1
      ORDER BY f.id, o.id
      `,
      [eventId]
    );

    const grouped = result.rows.reduce((acc, row) => {
      if (!acc[row.field_id]) {
        acc[row.field_id] = {
          field_id: row.field_id,
          field_name: row.field_name,
          options: [],
        };
      }
      if (row.option !== null) {
        acc[row.field_id].options.push({ id: row.option_id, value: row.option });
      }
      return acc;
    }, {} as Record<number, { field_id: number; field_name: string; options: { id: number; value: string }[] }>);

    res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunne ikke hente options" });
  }
});

router.post("/:fieldId", requireLogin,async (req, res) => {
  const { fieldId } = req.params;
  const { value } = req.body;
  console.log("har kommet til post option.");

  try {
    // Legg til ny option
    await pool.query(
      "INSERT INTO field_options (field_id, value) VALUES ($1, $2)",
      [fieldId, value]
    );

    // Hent alle options for dette fieldId etter innlegging
    const result = await pool.query(
      "SELECT * FROM field_options WHERE field_id = $1 ORDER BY id",
      [fieldId]
    );

    // Returner alle options som array
    res.status(201).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunne ikke legge til option" });
  }
});

// Slett option
router.delete("/:fieldId/:optionId", requireLogin, async (req, res) => {
  const { fieldId, optionId } = req.params;
console.log("kommet til slett option")
  try {
   const result =  await pool.query(
      "DELETE FROM field_options WHERE id = $1 AND field_id = $2 RETURNING *",
      [optionId, fieldId]
    );
    if (result.rowCount === 0) {
      // Ingen rad ble slettet - feltet finnes ikke eller event_id/fieldId matcher ikke
      res.status(404).json({ message: "Felt ikke funnet" });
      return
    }

    // Returner det slettede feltet (kan fjernes om du ikke trenger det)
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunne ikke slette option" });
  }
});

export default router;
