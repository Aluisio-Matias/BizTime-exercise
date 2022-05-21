process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testInv;

beforeEach(async () => {
    let result = await db.query(
        `INSERT INTO invoices (comp_code, amt) 
        VALUES ('test', 100)
        RETURNING id, comp_code, amt`);
    testInv = result.rows[0];
});

afterEach(async () => {
    //delete any data created by the test
    await db.query("DELETE FROM invoices");
})

afterAll(async () => {
    //close db connection
    await db.end();
})

/*Return list of invoices */
describe('GET /invoices', () => {
    test('Get a list of invoices', async () => {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoices: [testInv]
        });
    });
});


/*GET /invoices/[id] - Get a single invoice based on the invoice id */
describe("GET /invoices/:id", () => {
    test("Get an invoice by the id", async () => {
        const invResp = await request(app).get(`/invoices/${testInv.id}`);
        expect(invResp.statusCode).toBe(200);
    });
});


/*POST /invoices - Creates a new invoice */
describe("POST /invoices", () => {
    test("Creates a new invoice", async () => {
        const response = await request(app).post('/invoices').send({
            comp_code: testInv.comp_code,
            amt: 100
        });
        expect(response.statusCode).toBe(200);
    });
});


/*PUT/ invoices[id] - Updates  and invoice based on the id passed in */
describe("PUT /invoices/:id", () => {
    test("Update an invoice", async () => {
        const response = await request(app).put(`/invoices/${testInv.id}`).send({
            amt: 1000,
            paid: false
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            invoice: {
                id: testInv.id,
                comp_code: testInv.comp_code,
                amt: testInv.amt,
                paid: testInv.paid,
                add_date: testInv.add_date,
                paid_date: testInv.paid_date
            }
        });
    });
});


/*DELETE /invoices/[id] - Delete un invoice */
describe("DELETE /invoices/:id", () => {
    test("Delete an invoice", async () => {
        const response = await request(app).delete(`/invoices/${testInv.id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            "status": "deleted"
        });
    });
    test("Respond with 404 if invoice cant't be found", async () => {
        const resp = await request(app).get(`/invoices/1234`);
        expect(resp.statusCode).toBe(404);
    });
});