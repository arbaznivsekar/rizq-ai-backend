import request from "supertest";
import app from "../src/app";
describe("jobs listing", () => {
    it("GET /api/v1/jobs unauthorized", async () => {
        const res = await request(app).get("/api/v1/jobs");
        expect(res.status).toBe(401);
    });
});
