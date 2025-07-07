// src/middleware/aut_middleware

import { Request, Response, NextFunction } from "express";
import { pool } from "../db"; // Juster om nødvendig

// Funksjon som returnerer en middleware som sjekker tilgang
const checkPermission = (place: string, level: "READ" | "EDIT") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const eventId = parseInt(
  req.params.eventId || req.body.eventId || req.query.eventId
);

    if (!userId || isNaN(eventId)) {
      res.status(400).json({ message: "Mangler bruker-ID eller event-ID" });
      return;
    }

    try {
      // Eier har alltid full tilgang
      const ownerCheck = await pool.query(
        "SELECT * FROM event WHERE id = $1 AND owner_id = $2",
        [eventId, userId]
      );
      if ((ownerCheck.rowCount ?? 0) > 0) {
        next();
        return;
      }

      // Ikke eier, sjekk permissions
      const result = await pool.query(
        `SELECT permission_level FROM permissions
         WHERE event_id = $1 AND user_id = $2 AND permission = $3`,
        [eventId, userId, place]
      );

      const permission = result.rows[0]?.permission_level;

      if (!permission) {
        res.status(403).json({ message: "Ingen tilgang" });
        return;
      }

      if (level === "READ") {
        // Tillat hvis permission er READ eller EDIT
        if (permission === "READ" || permission === "EDIT") {
          next();
          return;
        } else {
          res.status(403).json({ message: "Ingen lesetilgang" });
          return;
        }
      }

      if (level === "EDIT" && permission === "EDIT") {
        next();
        return;
      }

      res.status(403).json({ message: "Manglende skrivetilgang" });
      return;
    } catch (err) {
      //console.error("Feil ved tilgangssjekk:", err); //SKAL AVKOMMENTERES I PROD
      res.status(500).json({ message: "Intern serverfeil middleware" });
      return;
    }
  };
};

// Eksporter ferdige middleware-funksjoner for lesetilgang og skrivetilgang
export const requireReadAccess = (place: string) => checkPermission(place, "READ");
export const requireEditAccess = (place: string) => checkPermission(place, "EDIT");

// Enkel middleware for pålogging (kan også importeres fra auth)
export const requireLogin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
    return;
  }
  res.status(401).json({ message: "Ikke logget inn" });
};