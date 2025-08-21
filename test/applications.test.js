import request from "supertest";
import app from "../src/app";
describe("apps listing", () => {
    it("GET /api/v1/applications unauthorized", async () => {
        const res = await request(app).get("/api/v1/applications");
        expect(res.status).toBe(401);
    });
});
