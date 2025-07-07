export const queryMock = jest.fn();
export const releaseMock = jest.fn();

export const pool = {
  query: queryMock,
  connect: jest.fn().mockResolvedValue({
    query: queryMock,
    release: releaseMock,
  }),
};