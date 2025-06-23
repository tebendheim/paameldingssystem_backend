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


export default router;