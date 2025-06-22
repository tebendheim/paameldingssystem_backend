// src/routes/users.ts
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("All users");
});

router.get("/:id", (req: Request, res: Response) => {
  res.send(`User with ID ${req.params.id}`);
});

export default router;