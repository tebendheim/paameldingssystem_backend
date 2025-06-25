import { Router } from "express";
import { pool } from "../db";
import { requireLogin } from "../middleware/auth_middleware";
import OptionRoutes from "./registrationoptions"

const router = Router();



// "/event/:id/fields"
// GET

router.get("/event/:id/fields", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
    SELECT ef.*, json_agg(fo.*) FILTER (WHERE fo.id IS NOT NULL) AS options
    FROM event_field ef
    LEFT JOIN field_options fo ON fo.field_id = ef.id
    WHERE ef.event_id = $1
    GROUP BY ef.id
    ORDER BY ef.rekkefoelge ASC;
  `,
      [id]
    );

    // Hvis ingen felter finnes, send tom liste
    res.status(200).json(result.rows); // result.rows vil være [] hvis ingen felter finnes
  } catch (err) {
    console.error("Feil ved henting av felt:", err);
    res.status(500).json({ message: "Noe gikk galt" });
  }
});


// POST
router.post("/event/:eventId/fields/", async (req, res) => {
  const { eventId } = req.params;
  const {label, field_type, is_required } = req.body;
  try {
    const {rows} = await pool.query(
  "SELECT COALESCE(MAX(rekkefoelge), 0) as next_order FROM event_field WHERE event_id = $1",
  [eventId]
);

const nextOrder = rows[0].next_order + 1;

    const result = await pool.query(
        "INSERT INTO event_field (event_id, label, field_type, is_required, rekkefoelge) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
      [eventId, label, field_type, is_required, nextOrder]
    );

    // Hvis ingen felter finnes, send tom liste
    res.status(200).json(result.rows[0]); // result.rows vil være [] hvis ingen felter finnes
  } catch (err) {
    console.error("Feil ved henting av felt:", err);
    res.status(500).json({ message: "Noe gikk galt" });
  }
});




// "/event/:eventId/fields/:fieldId"
// DELETE
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



// PUT
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






// "/event/:eventId/reorder"
router.put("/event/:eventId/reorder", async (req, res) => {
  const { eventId } = req.params;
  const { orderedIds } = req.body; // Ex: [3, 2, 5, 1]
  console.log("er i riktig rute.");

  if (!Array.isArray(orderedIds)) {
    res.status(400).send("orderedIds må være en liste av id-er");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Step 1: sett midlertidig høy verdi for rekkefoelge for alle involverte rader
    await client.query(
      `UPDATE event_field 
       SET rekkefoelge = rekkefoelge + 1000 
       WHERE event_id = $1 AND id = ANY($2)`,
      [eventId, orderedIds]
    );

    // Step 2: bygg CASE-uttrykket med faste verdier (ikke parametre for id i CASE)
    // Postgres kan ikke bruke parametre i CASE's WHEN id = $n, derfor setter vi direkte.
    const cases = orderedIds
      .map((id, i) => `WHEN id = ${id} THEN ${i + 1}`)
      .join(" ");

    const query = `
      UPDATE event_field
      SET rekkefoelge = CASE ${cases} END
      WHERE event_id = $1 AND id = ANY($2)
    `;

    await client.query(query, [eventId, orderedIds]);

    await client.query("COMMIT");
    res.sendStatus(200);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating order:", err);
    res.status(500).send("Internal server error");
  } finally {
    client.release();
  }
});

router.use("/options", OptionRoutes )

export default router;