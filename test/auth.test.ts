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

it('skal tillate skrivetilgang hvis bruker har EDIT-permission', async () => {
  const req = mockReq(2, 200);
  const res = mockRes();
  const next = mockNext();

  // Første query: ikke eier
  (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
  // Andre query: har EDIT
  (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ permission_level: 'EDIT' }] });

  const middleware = requireReadAccess("somePlace");
  await middleware(req as any, res, next);

  expect(next).toHaveBeenCalled();
});

afterEach(() => {
  jest.clearAllMocks();
});