// import Router from "express"
// import { pool } from "../db";
// import { requireLogin } from "../middleware/auth_middleware";

// const router = Router();

// router.get("/:eventId", async (req, res) => {
//   const { eventId } = req.params;
//   try {
//     const result = await pool.query(
//       "SELECT * FROM event_tickets WHERE event_id = $1",
//       [eventId]
//     );
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Kunne ikke hente billettyper" });
//   }
// });


// router.post("/:eventId/tickets", async (req, res) => {
//   const { eventId } = req.params;
//   const { name, price } = req.body;

//   try {
//     const result = await pool.query(
//       "INSERT INTO event_tickets (event_id, name, price) VALUES ($1, $2, $3) RETURNING *",
//       [eventId, name, price]
//     );
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Kunne ikke legge til billettype" });
//   }
// });


// export default router;




import Router from "express";
import { pool } from "../../db";
import { requireLogin } from "../../middleware/auth_middleware";

const router = Router();

router.get("/:eventId", requireLogin, async (req, res) => {
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

// @Todo: Husk å legg inn requireLogin
router.put("/:eventId", requireLogin, async (req, res) => {
  const { eventId } = req.params;
  const { tickets } = req.body;

  if (!Array.isArray(tickets)) {
    res.status(400).json({ error: "Tickets må være en liste" });
    return 
  }

  try {
    // Hent eksisterende billetter for eventet
    const existingRes = await pool.query(
      "SELECT id FROM event_tickets WHERE event_id = $1",
      [eventId]
    );
    const existingTicketIds = existingRes.rows.map((row) => row.id);

    // Billetter i frontend som har id => eksisterende, uten id => nye
    const incomingIds = tickets.filter(t => t.id).map(t => t.id);

    // Slett de som finnes i DB, men ikke i frontend
    const ticketsToDelete = existingTicketIds.filter(id => !incomingIds.includes(id));
    if (ticketsToDelete.length > 0) {
      await pool.query(
        "DELETE FROM event_tickets WHERE id = ANY($1::int[])",
        [ticketsToDelete]
      );
    }

    const updatedTickets = [];

    for (const ticket of tickets) {
      const name = typeof ticket.name === "string" ? ticket.name.trim() : "";
      const price = parseFloat(ticket.price);
      if (!name || isNaN(price) || price < 0) {
        res.status(400).json({ error: "Ugyldig billett" });
        return 
      }

      if (ticket.id) {
        // Oppdater eksisterende billett
        const result = await pool.query(
          "UPDATE event_tickets SET name = $1, price = $2 WHERE id = $3 RETURNING *",
          [name, price, ticket.id]
        );
        updatedTickets.push(result.rows[0]);
      } else {
        // Sett inn ny billett
        const result = await pool.query(
          "INSERT INTO event_tickets (event_id, name, price) VALUES ($1, $2, $3) RETURNING *",
          [eventId, name, price]
        );
        updatedTickets.push(result.rows[0]);
      }
    }

    res.status(200).json({ success: true, tickets: updatedTickets });
  } catch (err) {
    console.error("Feil under oppdatering av billetter:", err);
    res.status(500).json({ error: "Kunne ikke oppdatere billetter" });
  }
});

export default router;
