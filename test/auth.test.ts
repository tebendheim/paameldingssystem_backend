import request from "supertest";
import appfull from "../src/index"; // eller hvor du eksporterer Express `app`
import { requireLogin, requireEditAccess, requireReadAccess } from "../src/middleware/auth_middleware";
import { pool } from "../src/db";

jest.mock("../src/db.ts", () => ({
  pool: {
    query: jest.fn()
  }
}));

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



const mockReq = (userId: number, eventId: number) => ({
  user: { id: userId },
  params: { eventId: eventId.toString() },
  body: {},
  query: {}
});

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

it('skal tillate tilgang hvis bruker er eier', async () => {
  const req = mockReq(1, 100);
  const res = mockRes();
  const next = mockNext();

  (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

  const middleware = requireReadAccess("somePlace");
  await middleware(req as any, res, next);

  expect(next).toHaveBeenCalled();
  expect(res.status).not.toHaveBeenCalled();
});


it('skal tillate skrivetilgang hvis bruker har EDIT-permission', async () => {
  const req = mockReq(2, 200);
  const res = mockRes();
  const next = mockNext();

  // Første query: ikke eier
  (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
  // Andre query: har EDIT
  (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ permission_level: 'EDIT' }] });

  const middleware = requireEditAccess("somePlace");
  await middleware(req as any, res, next);

  expect(next).toHaveBeenCalled();
});


it('skal returnere 403 hvis bruker ikke har tilgang', async () => {
  const req = mockReq(3, 300);
  const res = mockRes();
  const next = mockNext();

  // Ikke eier
  (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
  // Ingen permission
  (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

  const middleware = requireReadAccess("somePlace");
  await middleware(req as any, res, next);

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith({ message: "Ingen tilgang" });
  expect(next).not.toHaveBeenCalled();
});


it('skal returnere 403 hvis bruker bare har READ men trenger EDIT', async () => {
  const req = mockReq(4, 400);
  const res = mockRes();
  const next = mockNext();

  (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
  (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ permission_level: 'READ' }] });

  const middleware = requireEditAccess("somePlace");
  await middleware(req as any, res, next);

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith({ message: "Manglende skrivetilgang" });
  expect(next).not.toHaveBeenCalled();
});

it('skal returnere 400 hvis userId mangler', async () => {
  const req = { user: undefined, params: { eventId: "1" } };
  const res = mockRes();
  const next = mockNext();

  const middleware = requireReadAccess("somePlace");
  await middleware(req as any, res, next);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: "Mangler bruker-ID eller event-ID" });
});

afterEach(() => {
  jest.clearAllMocks();
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