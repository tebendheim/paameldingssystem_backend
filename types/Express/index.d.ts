import { User } from "../../models/User"; // Tilpass path etter din struktur

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      username: string;
      created_at:date
      // legg til flere felt hvis nødvendig
    }
  }
}