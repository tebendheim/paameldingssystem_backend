import request from "supertest";
import appfull from "../src/index"; // eller hvor du eksporterer Express `app`
import { requireLogin } from "../src/middleware/auth_middleware";

describe("Autentisering", () => {
  it("skal returnere 401 hvis ikke logget inn", async () => {
    const res = await request(appfull).get("/api/events/my-events");
    expect(res.status).toBe(401);
  });
});



describe("requireLogin middleware", () => {
  it("skal kalle next() hvis bruker er logget inn", () => {
    const req: any = {
      isAuthenticated: () => true,
    };
    const res: any = {};
    const next = jest.fn();

    requireLogin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("skal returnere 401 hvis bruker ikke er logget inn", () => {
    const req: any = {
      isAuthenticated: () => false,
    };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res: any = {
      status,
    };
    const next = jest.fn();

    requireLogin(req, res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: "Ikke logget inn" });
    expect(next).not.toHaveBeenCalled();
  });
});

// import express from "express";
// import {request} from "supertest";
// import * as authMiddleware from "../src/middleware/auth_middleware";
// import { pool } from "../src/db";

// jest.mock("../src/db"); // Mock database-kallet

// const app = express();
// app.use(express.json());

// // Legger til eventId i query for å unngå NaN-sjekkfeil i middleware
// app.get(
//   "/test-read-access",
//   (req, res, next) => {
//     req.user = {
//       id: 1,
//       username: "testuser",
//       email: "test@example.com",
//       created_at: new Date().toISOString(),
//     }; // Simuler innlogget bruker

//     // For å unngå NaN på eventId i middleware, må vi sette eventId i query
//     req.query.eventId = "123";

//     next();
//   },
//   authMiddleware.requireReadAccess("event_settings"),
//   (req, res) => res.json({ message: "Access granted" })
// );

// describe("requireReadAccess middleware", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it("skal gi tilgang til eier", async () => {
//     (pool.query as jest.Mock)
//       // Første kall: sjekk eier
//       .mockResolvedValueOnce({ rowCount: 1 })
//       // Andre kall: permissions (skal ikke sjekkes hvis eier)
//       .mockResolvedValueOnce({ rows: [] });

//     const res = await request(app).get("/test-read-access");
//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe("Access granted");
//   });

//   it("skal gi tilgang ved READ permission", async () => {
//     (pool.query as jest.Mock)
//       .mockResolvedValueOnce({ rowCount: 0 }) // ikke eier
//       .mockResolvedValueOnce({ rows: [{ permission_level: "READ" }] });

//     const res = await request(app).get("/test-read-access");
//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe("Access granted");
//   });

//   it("skal nekte tilgang hvis ikke READ eller eier", async () => {
//     (pool.query as jest.Mock)
//       .mockResolvedValueOnce({ rowCount: 0 }) // ikke eier
//       .mockResolvedValueOnce({ rows: [] }); // ingen permissions

//     const res = await request(app).get("/test-read-access");
//     expect(res.status).toBe(403);
//     expect(res.body.message).toBe("Ingen tilgang");
//   });

//   it("skal returnere 400 hvis manglende userId eller eventId", async () => {
//     // Mock req.user uten id og uten eventId i query
//     const customApp = express();
//     customApp.use(express.json());
//     customApp.get(
//       "/test-read-access",
//       (req, res, next) => {
//         req.user = {}; // user uten id
//         next();
//       },
//       authMiddleware.requireReadAccess("event_settings"),
//       (req, res) => res.json({ message: "Access granted" })
//     );

//     const res = await request(customApp).get("/test-read-access");
//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe("Mangler bruker-ID eller event-ID");
//   });

//   it("skal returnere 500 ved databasefeil", async () => {
//     (pool.query as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

//     const res = await request(app).get("/test-read-access");
//     expect(res.status).toBe(500);
//     expect(res.body.message).toBe("Intern serverfeil");
//   });
// });