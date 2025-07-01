import { Request, Response, NextFunction } from "express";
import { pool } from "../db"; // tilpass om nødvendig

export const requireLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Ikke logget inn" });
};

const checkPermission = async (
  req: Request,
  res: Response,
  next: NextFunction,
  place: string,
  level: "READ" | "EDIT"
) => {
  const userId = req.user?.id;
  const eventId = parseInt(
    req.params.eventId || req.body.eventId || req.query.eventId
  );

  if (!userId || isNaN(eventId)) {
    return res.status(400).json({ message: "Mangler bruker-ID eller event-ID" });
  }

  try {
    // Eier har alltid full tilgang
    const ownerCheck = await pool.query(
      "SELECT 1 FROM event WHERE id = $1 AND owner_id = $2",
      [eventId, userId]
    );
    if ((ownerCheck.rowCount ?? 0) > 0) {
      return next(); // Eier = full tilgang
    }

    // Ikke eier, sjekk permissions
    const result = await pool.query(
      `
      SELECT permission_level FROM permissions
      WHERE event_id = $1 AND user_id = $2 AND permission = $3
      `,
      [eventId, userId, place]
    );

    const permission = result.rows[0]?.permission_level;

    if (!permission) {
      return res.status(403).json({ message: "Ingen tilgang" });
    }

    if (level === "READ") {
      return next();
    }

    if (level === "EDIT" && permission === "EDIT") {
      return next();
    }

    return res.status(403).json({ message: "Manglende skrivetilgang" });
  } catch (err) {
    console.error("Feil ved tilgangssjekk:", err);
    return res.status(500).json({ message: "Intern serverfeil" });
  }
};

// Middleware for lesetilgang
export const requireReadAccess = (place: string) => {
  return (req: Request, res: Response, next: NextFunction) =>
    checkPermission(req, res, next, place, "READ");
};

// Middleware for skrivetilgang
export const requireEditAccess = (place: string) => {
  return (req: Request, res: Response, next: NextFunction) =>
    checkPermission(req, res, next, place, "EDIT");
};
