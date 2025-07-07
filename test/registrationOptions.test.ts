// /api/fields/opitons


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
  import router from "../src/routes/eventsettings/registrationoptions"; // denne må oppdateres med rett sted
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

    it("returnerer 404 hvis felt ikke finnes", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put("/api/fields/options/123/999/5")
        .send({ label: "Noe" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Field not found" });
    });

    it("returnerer 500 ved databasefeil", async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error("db error"));

      const res = await request(app)
        .put("/api/fields/options/123/1/5")
        .send({ label: "Noe" });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Database error" });
    });

  describe("GET /event/:eventId/", () => {
    let app: Express;
  beforeEach(() => {
    jest.clearAllMocks(); // nullstiller antall kall og return values
    (pool.query as jest.Mock).mockReset(); // ⚠️ nullstiller tidligere mockResolvedValueOnce-implementasjoner
    (pool.connect as jest.Mock).mockReset();
    app = createTestApp();
    
  });
    it("henter options gruppert per felt", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            field_id: 1,
            field_name: "Felt 1",
            option_id: 10,
            option: "Option A",
          },
          {
            field_id: 1,
            field_name: "Felt 1",
            option_id: 11,
            option: "Option B",
          },
          {
            field_id: 2,
            field_name: "Felt 2",
            option_id: null,
            option: null,
          },
        ],
      });

      const res = await request(app).get("/api/fields/options/event/123/");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          field_id: 1,
          field_name: "Felt 1",
          options: [
            { id: 10, value: "Option A" },
            { id: 11, value: "Option B" },
          ],
        },
        {
          field_id: 2,
          field_name: "Felt 2",
          options: [],
        },
      ]);
    });

    it("returnerer 500 ved databasefeil", async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error("db error"));

      const res = await request(app).get("/api/fields/options/event/123/");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Kunne ikke hente options" });
    });
  });

  describe("POST /:fieldId", () => {
    let app: Express;
  beforeEach(() => {
    jest.clearAllMocks(); // nullstiller antall kall og return values
    (pool.query as jest.Mock).mockReset(); // ⚠️ nullstiller tidligere mockResolvedValueOnce-implementasjoner
    (pool.connect as jest.Mock).mockReset();
    app = createTestApp();
    
  });
    it("legger til ny option og returnerer alle options for felt", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({}) // insert
        .mockResolvedValueOnce({
          rows: [
            { id: 1, field_id: 1, value: "Option 1" },
            { id: 2, field_id: 1, value: "Option 2" },
          ],
        }); // select etter insert

      const res = await request(app)
        .post("/api/fields/options/1")
        .send({ value: "Option 2" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual([
        { id: 1, field_id: 1, value: "Option 1" },
        { id: 2, field_id: 1, value: "Option 2" },
      ]);
    });

    it("returnerer 500 ved databasefeil", async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error("db error"));

      const res = await request(app)
        .post("/api/fields/options/1")
        .send({ value: "Option 2" });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Kunne ikke legge til option" });
    });
  });

  describe("DELETE /:fieldId/:optionId", () => {
    let app: Express;
  beforeEach(() => {
    jest.clearAllMocks(); // nullstiller antall kall og return values
    (pool.query as jest.Mock).mockReset(); // ⚠️ nullstiller tidligere mockResolvedValueOnce-implementasjoner
    (pool.connect as jest.Mock).mockReset();
    app = createTestApp();
    
  });
    it("sletter option og returnerer slettet rad", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 5, field_id: 1, value: "Option to delete" }],
      });

      const res = await request(app).delete("/api/fields/options/1/5");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 5, field_id: 1, value: "Option to delete" });
    });

    it("returnerer 404 hvis option ikke finnes", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 0,
        rows: [],
      });

      const res = await request(app).delete("/api/fields/options/1/999");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Felt ikke funnet" });
    });

    it("returnerer 500 ved databasefeil", async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error("db error"));

      const res = await request(app).delete("/api/fields/options/1/5");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Kunne ikke slette option" });
    });
  });
});