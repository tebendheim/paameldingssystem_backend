import request from "supertest";
import express from "express";
import router from "../src/routes/events";
import { pool } from "../src/db";

jest.mock("../src/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const app = express();
app.use(express.json());

// Mock av req.user FØR router
app.use((req, res, next) => {
  req.user = {
    id: 1,
    email: "test@example.com",
    username: "testuser",
    created_at: "2025-01-01T00:00:00Z",
  };
  next();
});

app.use("/api/events", router);

describe("GET /event/:eventId/registrations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returnerer 200 og registreringer hvis bruker eier eventet", async () => {
    // Mock eier-sjekk: 1 rad, bruker er eier
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 123, owner_id: 1 }],
      })
      // Mock event-henting (i router)
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 123, owner_id: 1 }],
      })
      // Mock registreringer
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            email: "test@example.com",
            registration_date: "2025-01-01",
            payment_date: "2025-01-02",
            fields: [
                {name: "ola norman"}
            ],
          },
        ],
      });

    const res = await request(app).get("/api/events/event/123/registrations");

    if (res.status !== 200) {
      console.log("Feil respons:", res.status, res.body);
    }

    expect(res.status).toBe(200);
    expect(res.body.event).toEqual({ id: 123, owner_id: 1 });
    expect(res.body.totalRegistrations).toBe(1);
    expect(res.body.registrations).toEqual([
      {
        email: "test@example.com",
        registration_date: "2025-01-01",
        payment_date: "2025-01-02",
        fields: [
            {name: "ola norman"}
        ],
      },
    ]);
  });
});
