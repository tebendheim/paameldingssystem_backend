// /api/fields


jest.mock("../src/middleware/auth_middleware", () => ({
    requireLogin: (_req: any, _res: any, next: () => void) => next(),
    requireReadAccess: (_place: string) => (_req: any, _res: any, next: () => void) => next(),
    requireEditAccess: (_place: string) => (_req: any, _res: any, next: () => void) => next(),
  }));
  

jest.mock("../src/db", () => require("./mockDB")); 
  
  import request from "supertest";
  import express from "express";
//   import { pool } from "../src/db";
    import { pool, queryMock } from "./mockDB"; 
  import router from "../src/routes/eventsettings/registrationfields"; // denne må oppdateres med rett sted
  import type { Express } from "express";
  import type { Application } from "express";
  const listEndpoints: (app: Application) => any = require("express-list-endpoints");




  const createTestApp = () => {
    const app = express();
    app.use(express.json());

    app.use((req, _res, next) => {
        console.log(`Mottok request: ${req.method} ${req.originalUrl}`);
        next();
      });
  
    // Denne delen mocker en bruker, sånn at jeg kommer forbi requirelogin metoden
    app.use((req, res, next) => {
      req.user = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        created_at: "2025-01-01T00:00:00Z",
      };
      next();
    });
  
    app.use("/api/fields/options", router);
    console.log("Registrerte ruter:", listEndpoints(app));
    return app;
  };

  
  describe("PUT /:eventId/:fieldId/", () => {
    let app: Express;
  beforeEach(() => {
    jest.clearAllMocks(); // nullstiller antall kall og return values
    (pool.query as jest.Mock).mockReset(); // ⚠️ nullstiller tidligere mockResolvedValueOnce-implementasjoner
    (pool.connect as jest.Mock).mockReset();
    app = createTestApp();
    
  });
  it("oppdaterer felt og returnerer oppdatert rad", async () => {
    (pool.query as jest.Mock)
  // 1. SELECT for å finne feltet
  .mockResolvedValueOnce({
    rows: [{ id: 1, event_id: 123, label: "Felt A" }],
  })
  // 2. UPDATE + RETURNING
  .mockResolvedValueOnce({
    rows: [{ id: 1, event_id: 123, label: "Oppdatert felt" }],
    rowCount: 1,
  })
  // 3. SELECT for å hente alle feltene etter oppdatering
  .mockResolvedValueOnce({
    rows: [
      { id: 1, event_id: 123, label: "Oppdatert felt" },
      { id: 2, event_id: 123, label: "Annet felt" },
    ],
      });
    const res = await request(app)
      .put("/api/fields/options/123/1")
      .send({ label: "Oppdatert felt" });
  
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      updated: true,
      fields: [
        { id: 1, event_id: 123, label: "Oppdatert felt" },
        { id: 2, event_id: 123, label: "Annet felt" },
      ],
    });
  
    expect(pool.query).toHaveBeenCalledTimes(3);
  });