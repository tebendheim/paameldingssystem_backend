jest.mock("../src/db", () => {
  const queryMock = jest.fn();
  const releaseMock = jest.fn();
  return {
    pool: {
      query: queryMock,
      connect: jest.fn().mockResolvedValue({
        query: queryMock,
        release: releaseMock,
      }),
    },
  };
});

import request from "supertest";
import express from "express";
import { pool } from "../src/db";
import router from "../src/routes/events/events";
import type { Express } from "express";




const createTestApp = () => {
  const app = express();
  app.use(express.json());

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
  return app;
};


describe.each([
  {
    description: "bruker eier eventet",
    mockQueries: () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: 1, owner_id: 1 }],
        }) // sjekk eierskap
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id: 1,
            name: "slingshot",
            owner_id: 1,
            event_date: "2025-12-01T17:00:00.000Z",
            created_at: "2025-07-01T17:18:51.136Z",
            is_payed: true,
          }],
        }) // hent event
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
              value: "1",
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
              value: "asdf",
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
              value: null,
            },
          ],
        }); // hent registreringer
    },
  },
  {
    description: "bruker har skrivetilgang til eventet",
    mockQueries: () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({
          rowCount: 0,
          rows: [],
        }) // ikke eier
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            permission_level: "EDIT",
          }],
        }) // har permissions
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id: 1,
            name: "slingshot",
            owner_id: 1,
            event_date: "2025-12-01T17:00:00.000Z",
            created_at: "2025-07-01T17:18:51.136Z",
            is_payed: true,
          }],
        }) // hent event
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
              value: "1",
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
              value: "asdf",
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
              value: null,
            },
          ],
        }); // hent registreringer
    },
  },
])("GET /event/:eventId/registrations når $description", ({ mockQueries }) => {
  let app : Express

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks(); // nullstiller antall kall og return values
    (pool.query as jest.Mock).mockReset(); // ⚠️ nullstiller tidligere mockResolvedValueOnce-implementasjoner
    (pool.connect as jest.Mock).mockReset();
    mockQueries();
  });

  it("returnerer 200 og registreringer", async () => {

    const res = await request(app).get("/api/events/event/123/registrations");

    if (res.status !== 200) {
     // console.log("Feil respons:", res.status, res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body.event).toEqual({
      id: 1,
      name: "slingshot",
      owner_id: 1,
      event_date: "2025-12-01T17:00:00.000Z",
      created_at: "2025-07-01T17:18:51.136Z",
      is_payed: true,
    });
    expect(res.body.totalRegistrations).toBe(2);
    expect(res.body.registrations).toEqual([
      {
        email: "tomel@gmail.com",
        registration_date: "2025-07-01T17:18:51.137Z",
        payment_date: null,
        fields: [],
      },
      {
        email: "123@213.no",
        registration_date: "2025-07-05T16:39:33.436Z",
        payment_date: null,
        fields: [
          { label: "test", value: "1" },
          { label: "a", value: "asdf" },
        ],
      },
    ]);
  });
});



describe("POST /api/events/", () => {

    // en sånn MoclCient må benyttes når man har begin osv i 
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  let app: Express;
  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks(); // nullstiller antall kall og return values
    (pool.query as jest.Mock).mockReset(); // ⚠️ nullstiller tidligere mockResolvedValueOnce-implementasjoner
    (pool.connect as jest.Mock).mockReset();
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });
  

  it("should return 400 if tickets is not an array", async () => {
    
    const res = await request(app)
      .post("/api/events/")
      .send({
        name: "Test Event",
        event_date: "2025-07-01",
        tickets: "not-an-array",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Tickets må være en liste hvis det oppgis" });
  });




  it("should insert event and tickets, then commit transaction", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 123 }] }) // INSERT INTO events
      .mockResolvedValueOnce(undefined) // INSERT ticket 1
      .mockResolvedValueOnce(undefined) // INSERT ticket 2
      .mockResolvedValueOnce(undefined); // COMMIT

    const res = await request(app)
      .post("/api/events/")
      .send({
        name: "Konsert",
        event_date: "2025-07-01",
        tickets: [
          { name: "Standard", price: 200 },
          { name: "VIP", price: 500 },
        ],
      });

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith(
      "INSERT INTO events (name, event_date) VALUES ($1, $2) RETURNING id",
      ["Konsert", "2025-07-01"]
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      "INSERT INTO event_tickets (event_id, name, price) VALUES ($1, $2, $3)",
      [123, "Standard", 200]
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      "INSERT INTO event_tickets (event_id, name, price) VALUES ($1, $2, $3)",
      [123, "VIP", 500]
    );
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: "Event opprettet", eventId: 123 });
  });

  it("should rollback and return 500 if something fails", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error("DB error")); // INSERT INTO events fails

    const res = await request(app)
      .post("/api/events/")
      .send({
        name: "FeilEvent",
        event_date: "2025-07-01",
        tickets: [],
      });

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Kunne ikke opprette event" });
  });

});




describe("GET /", () => {
  let app: Express;
  beforeEach(() => {
    jest.clearAllMocks(); // nullstiller antall kall og return values
    (pool.query as jest.Mock).mockReset(); // ⚠️ nullstiller tidligere mockResolvedValueOnce-implementasjoner
    (pool.connect as jest.Mock).mockReset();
    app = createTestApp();
    
  });
  
  it("henter rett data fra /event/:id", async () => {
    (pool.query as jest.Mock)
        .mockResolvedValueOnce({
            rowCount: 1,
            rows: [
                {
                id: 123,
                name: "Testevent",
                event_date: "2025-07-01T12:00:00.000Z",
                owner_id: 1,
                created_at: "2025-06-01T12:00:00.000Z",
                is_payed: false,
                },
            ],
        })
    const res = await request(app).get("/api/events/event/123")
    expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM event WHERE id = $1",
        ["123"]
    );
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
            id: 123,
            name: "Testevent",
            event_date: "2025-07-01T12:00:00.000Z",
            owner_id: 1,
            created_at: "2025-06-01T12:00:00.000Z",
            is_payed: false,
    })
    });
});