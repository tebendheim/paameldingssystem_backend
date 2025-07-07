import { Router } from "express";
import { pool } from "../../db";
import { requireLogin, requireEditAccess, requireReadAccess } from "../../middleware/auth_middleware";

const router = Router();

router.get("/:eventId", requireReadAccess("useradmin") ,async (req, res) => {
    const {eventId} = req.params;
    try{
        const result = await pool.query("SELECT u.firstName, u.lastName, p.permission_level, p.permission_place FROM user AS u JOIN permissions AS p ON p.user_id=u.id WHERE p.event_id =  $1", [eventId]);
        res.json({fields:result.rows});
    }catch (err){
        res.status(400).json({message:"server error in getting permissions"});
        return;
    }
});

export default router;