// src/auth/passport.ts

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { pool } from "../db";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) {
          console.log("❌ Bruker ikke funnet:", email);
          return done(null, false, { message: "Feil epost eller passord" });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          console.log("❌ Feil passord for:", email);
          return done(null, false, { message: "Feil epost eller passord" });
        }

        console.log("✅ Bruker godkjent:", email);
        return done(null, user)
      } catch (err:unknown) {
            console.error("⚠️ Feil under innlogging:", err);
        return done(err);
      }
    }
  )
);

// Serialisering
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return done(null, false);
    }
    done(null, result.rows[0]);
  } catch (err:unknown) {
    done(err);
  }
});

export default passport;
