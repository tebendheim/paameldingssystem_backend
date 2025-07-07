import { Router } from "express";
import { pool } from "../../db";
import { requireLogin, requireEditAccess, requireReadAccess } from "../../middleware/auth_middleware";

const router = Router();

router.get("/", requireReadAccess("useradmin") ,async (req, res) => {

});

export default router;