// Innlogging
import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import {pool} from "../db"
import {requireLogin} from "../middleware/auth_middleware"

const app = Router();

app.get("/", (req:Request, res:Response)=>{
    res.json("dette er loginhoved.må legge til /login")
})

app.post("/login", (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body)
  passport.authenticate("local", (err: unknown, user: any, info: any) => {
    
    if (err) {
      console.error("🛑 Login error:", err);
      return res.status(500).json({ message: "Serverfeil", error: err });
    }
    if (!user) {
      console.warn("⚠️ Login mislyktes:", info?.message);
      return res.status(401).json({ message: info?.message || "Innlogging feilet" });
    }

    req.logIn(user, (err: unknown) => {
      if (err) {
        console.error("⚠️ Login feilet under req.logIn:", err);
        return res.status(500).json({ message: "Innlogging feilet" });
      }
      return res.json({ message: "Innlogging vellykket", user });
    });
  })(req, res, next);
});
// Sjekk om innlogget
app.get("/profile", (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: "Ikke logget inn" });
  }
});

// Logout
app.post("/logout", (req: Request, res: Response) => {
  req.logout(() => {
    res.json({ message: "Logget ut" });
  });
});

app.post("/signup", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, hashedPassword]
    );
    res.json({ message: "Bruker registrert" });
  } catch (err) {
    res.status(500).json({ message: "Feil under registrering", error: err });
  }
});

app.delete("/profile", async(req:Request, res:Response) => {
    if (req.isAuthenticated()) {
        try{   
            await pool.query(
                "DELETE FROM users WHERE id = $1 RETURNING *", [req.user.id]
            )
            res.json({ user: req.user });
        }catch (err){

        }
        
  } else {
    res.status(401).json({ message: "Ikke logget inn" });
  }
})


app.delete("/profile", requireLogin, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [req.user?.id]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Bruker ikke funnet" });
      return;  // bare stopp funksjonen her, ikke returner Response-objektet
    }

    res.json({ message: "Bruker slettet", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Feil ved sletting", error: err });
  }
});

export default app