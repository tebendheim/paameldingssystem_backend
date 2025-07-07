jest.mock("../src/middleware/auth_middleware", () => ({
    requireLogin: (_req: any, _res: any, next: () => void) => next(),
    requireReadAccess: (_place: string) => (_req: any, _res: any, next: () => void) => next(),
  }));
  

jest.mock("../src/db", () => require("./mockDB")); 
  
  import request from "supertest";
  import express from "express";
//   import { pool } from "../src/db";
    import { pool, queryMock } from "./mockDB"; 
  import router from "../src/routes/eventsettings/tickets";
  import type { Express } from "express";


  const createTestApp = () => {
    const app = express();
    app.use(express.json());
  
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
  
    app.use("/api/events/tickets", router);
    return app;
  };
  

  describe("GET /api/events/tickets/", () => {
    let app: Express;
    beforeEach(() => {
      jest.clearAllMocks(); // nullstiller antall kall og return values
      (pool.query as jest.Mock).mockReset(); // ⚠️ nullstiller tidligere mockResolvedValueOnce-implementasjoner
      (pool.connect as jest.Mock).mockReset();
      app = createTestApp();
      
    });
    it("GET /api/events/tickets", async () => {
        queryMock
        .mockResolvedValueOnce({
            rows: [
                { id: 1, event_id: 123, name: "Standard", price: "199.00" },
                { id: 2, event_id: 123, name: "VIP", price: "499.00" },
                { id: 3, event_id: 123, name: "Student", price: "99.00" },
              ]
        })

        const res = await request(app).get("/api/events/tickets/123")
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(3);
        expect(pool.query).toHaveBeenCalledWith(
            "SELECT * FROM event_tickets WHERE event_id = $1",
            ["123"] // merk at req.params alltid er string!
          );

    });
    
  });