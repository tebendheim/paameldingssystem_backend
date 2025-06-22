

// Sjekker om bruker er innlogget
import { Request, Response, NextFunction } from "express";


export const requireLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
    return;
  }

  res.status(401).json({ message: "Ikke logget inn" });
  // IKKE returner noe her — funksjonen har returtype void
};