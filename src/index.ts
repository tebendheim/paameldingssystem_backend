// src/index.ts
import express from "express";
import session from "express-session";
import passport from "passport";
import routes from "./routes";
import cors from 'cors';

// Dette importerer konfigurasjonen som registrerer strategien:
import "./middleware/passport";  

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials:true,
}));

app.use(express.json());

app.use(session({
  secret: "some-secret",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", routes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

export default app;