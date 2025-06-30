import { Router } from "express";
import { pool } from "../db";
import { requireLogin } from "../middleware/auth_middleware";
import TicketRoutes from "./tickets"

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

router.post("/", async (req, res) => {
  const { name, event_date, tickets } = req.body;

if (tickets && !Array.isArray(tickets)) {
  res.status(400).json({ error: "Tickets må være en liste hvis det oppgis" });
  return;
}

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const eventResult = await client.query(
      "INSERT INTO events (name, event_date) VALUES ($1, $2) RETURNING id",
      [name, event_date]
    );
    const eventId = eventResult.rows[0].id;

    for (const ticket of tickets) {
      await client.query(
        "INSERT INTO event_tickets (event_id, name, price) VALUES ($1, $2, $3)",
        [eventId, ticket.name, ticket.price]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({ message: "Event opprettet", eventId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Kunne ikke opprette event" });
  } finally {
    client.release();
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

router.use("/tickets",  TicketRoutes)



export default router;