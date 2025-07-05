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
//     (pool.query as jest.Mock)
//       .mockResolvedValueOnce({
//         rowCount: 1,
//         rows: [{ id: 123, owner_id: 1 }],
//       })
//       // Mock event-henting (i router)
//       .mockResolvedValueOnce({
//         rowCount: 1,
//         rows: [{ id: 123, owner_id: 1 }],
//       })
//       // Mock registreringer
//   .mockResolvedValueOnce({
//   rowCount: 2,
//   rows: [
//     {
//       registration_id: 1,
//       email: "123@213.no",
//       registration_date: "2025-07-05T16:39:33.436Z",
//       payment_date: null,
//       field_id: 1,
//       label: "test",
//       field_type: "text",
//       is_required: true,
//       value: "1",
//     },
//     {
//       registration_id: 1,
//       email: "123@213.no",
//       registration_date: "2025-07-05T16:39:33.436Z",
//       payment_date: null,
//       field_id: 2,
//       label: "a",
//       field_type: "text",
//       is_required: false,
//       value: "asdf",
//     }
//   ]
// });

(pool.query as jest.Mock)
  // 1. Sjekk at bruker eier eventet
  .mockResolvedValueOnce({
    rowCount: 1,
    rows: [{ id: 1, name: "slingshot", owner_id: 1, event_date: "2025-12-01T17:00:00.000Z", created_at: "2025-07-01T17:18:51.136Z", is_payed: true }]
  })
  // 2. Hent event fra router
  .mockResolvedValueOnce({
    rowCount: 1,
    rows: [{ id: 1, name: "slingshot", owner_id: 1, event_date: "2025-12-01T17:00:00.000Z", created_at: "2025-07-01T17:18:51.136Z", is_payed: true }]
  })
  // 3. Hent registreringer + felt (joinet resultat)
  .mockResolvedValueOnce({
    rowCount: 3,
    rows: [
      {
        registration_id: 2,
        email: "123@213.no",
        registration_date: "2025-07-05T16:39:33.436Z",
        payment_date: null,
        field_id: 1,
        label: "test",
        field_type: "select",
        is_required: true,
        value: "1"
      },
      {
        registration_id: 2,
        email: "123@213.no",
        registration_date: "2025-07-05T16:39:33.436Z",
        payment_date: null,
        field_id: 2,
        label: "a",
        field_type: "text",
        is_required: true,
        value: "asdf"
      },
      {
        registration_id: 1,
        email: "tomel@gmail.com",
        registration_date: "2025-07-01T17:18:51.137Z",
        payment_date: null,
        field_id: null,
        label: null,
        field_type: null,
        is_required: null,
        value: null
      }
    ]
  });

    const res = await request(app).get("/api/events/event/123/registrations");

    if (res.status !== 200) {
      console.log("Feil respons:", res.status, res.body);
    }

    expect(res.status).toBe(200);
    expect(res.body.event).toEqual({
    id: 1,
    name: "slingshot",
    owner_id: 1,
    event_date: "2025-12-01T17:00:00.000Z",
    created_at: "2025-07-01T17:18:51.136Z",
    is_payed: true
    });
    expect(res.body.totalRegistrations).toBe(2);
    expect(res.body.registrations).toEqual([
    {
        email: "tomel@gmail.com",
        registration_date: "2025-07-01T17:18:51.137Z",
        payment_date: null,
        fields: []
    },
    {
        email: "123@213.no",
        registration_date: "2025-07-05T16:39:33.436Z",
        payment_date: null,
        fields: [
        { label: "test", value: "1" },
        { label: "a", value: "asdf" }
        ]
    }
    ]);
  });
});
