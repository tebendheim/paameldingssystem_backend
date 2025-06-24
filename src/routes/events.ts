import { Router } from "express";
import { pool } from "../db";
import { requireLogin } from "../middleware/auth_middleware";

const router = Router();

router.get("/my-events", requireLogin, async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await pool.query(
      "SELECT * FROM event WHERE owner_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Feil ved henting av eventer:", err);
    res.status(500).json({ message: "Noe gikk galt" });
  }
});

router.get("/events", async (req,res) => {
    try{
    const result = await pool.query("SELECT * FROM event WHERE event_date > NOW() ORDER BY event_date ASC")
    res.json(result.rows)
    }catch (err) {
        res.status(500).json({message: "noe gikk galt"});
    }
});

router.get("/event/:id", async (req, res) => {
    const {id} = req.params;
    try{
        const result = await pool.query("SELECT * FROM event WHERE id = $1", [id]);
        if (result.rows.length === 0){
            res.status(404).json({message: "Event ikke funnet"})
            return;
        }
        res.json(result.rows[0]);
    }catch (err){
         console.error("Feil:", err);
         res.status(500).json({ message: "Noe gikk galt" });
    }
});

router.get("/event/:id/fields", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM event_field WHERE event_id = $1",
      [id]
    );

    // Hvis ingen felter finnes, send tom liste
    res.status(200).json(result.rows); // result.rows vil være [] hvis ingen felter finnes
  } catch (err) {
    console.error("Feil ved henting av felt:", err);
    res.status(500).json({ message: "Noe gikk galt" });
  }
});



router.get("/event/:id/registrations", requireLogin, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    // Sjekk at brukeren eier arrangementet
    const eventResult = await pool.query("SELECT * FROM event WHERE id = $1", [id]);
    if (eventResult.rows.length === 0) {
      res.status(404).json({ message: "Event ikke funnet" });
      return
    }

    const event = eventResult.rows[0];
    if (event.owner_id !== userId) {
      res.status(403).json({ message: "Ingen tilgang til dette eventet" });
      return
    }

    // Hent alle registreringer og deres feltverdier
    const registrations = await pool.query(
      `
      SELECT 
        r.id AS registration_id,
        r.email,
        r.registration_date,
        r.payment_date,
        ef.id AS field_id,
        ef.label,
        ef.field_type,
        ef.is_required,
        efv.value
      FROM registered r
      LEFT JOIN event_field_value efv ON r.id = efv.registration_id
      LEFT JOIN event_field ef ON efv.event_field_id = ef.id
      WHERE r.event_id = $1
      ORDER BY r.registration_date DESC
      `,
      [id]
    );

    const structured = registrations.rows.reduce((acc, row) => {
      const regId = row.registration_id;
      if (!acc[regId]) {
        acc[regId] = {
          email: row.email,
          registration_date: row.registration_date,
          payment_date: row.payment_date,
          fields: [],
        };
      }

      if (row.field_id) {
        acc[regId].fields.push({
          label: row.label,
          value: row.value,
        });
      }

      return acc;
    }, {} as Record<number, any>);

    res.json({
      event,
      totalRegistrations: Object.keys(structured).length,
      registrations: Object.values(structured),
    });

  } catch (err) {
    console.error("Feil ved henting av registreringer:", err);
    res.status(500).json({ message: "Noe gikk galt" });
  }
});



export default router;