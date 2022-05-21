process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testComp;

beforeEach(async () => {
    let result = await db.query(
        `INSERT INTO companies (code, name, description) 
        VALUES ('test', 'test company', 'Just a test')
        RETURNING code, name, description`);
    testComp = result.rows[0];
});

afterEach(async () => {
    //delete any data created by the test
    await db.query("DELETE FROM companies");
})

afterAll(async () => {
    //close db connection
    await db.end();
})

/*GET /companies - return list of companies */
describe("GET /companies", () => {
    test("Get a list of companies", async () => {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: [testComp]
        });
    });
});

/*GET /companies/[code] return company  */
describe("GET /companies/:code", () => {
    test("Get a single company", async () => {
        const response = await request(app).get(`/companies/${testComp.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: testComp
        });
    });
});

/*POST /companies - creates a new company */
describe("POST /companies", () => {
    test("Creates a new company", async () => {
        const response = await request(app).post('/companies').send({
            code: 'apple',
            name: 'Apple',
            description: 'iPhone maker'
        });
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({
            company: {
                code: 'apple',
                name: 'Apple',
                description: 'iPhone maker'
            }
        });
    });
});

/*PUT /companies/[code] - Edit existing company  */
describe("PUT /companies/:code", () => {
    test("Edit an existing company", async () => {
        const response = await request(app).put(`/companies/${testComp.code}`).send({
            name: 'IBM',
            description: 'Use to only make PCs'
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            company: {
                code: testComp.code,
                name: 'IBM',
                description: 'Use to only make PCs'
            }
        });
    });
    test("Respond with 404 if company can't be found", async () => {
        const res = await request(app).put(`/companies/blah`).send({
            name: 'IBM',
            description: 'Use to only make PCs'
        });
        expect(res.statusCode).toBe(404);
    });
});

/*DELETE /companies/[code] - Delete company */
describe("DELETE /companies/:code", () => {
    test("Delete an existing company", async () => {
        const response = await request(app).delete(`/companies/${testComp.code}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            "status": "deleted"
        });
    });
});

/*GET /companies/code/:code - Get the company info along with the company invoice */
describe("GET /companies/code/:code", () => {
    test("Get company info along with the invoice", async () => {
        const response = await request(app).get(`/companies/code/${testComp.code}`);
        const invResp = await request(app).get(`/invoices`)
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            company: {
                code: testComp.code,
                name: testComp.name,
                description: testComp.description,
                invoices: [invResp.id]
            }
        });
    });
    test("Respond with 404 if company can't be found", async () => {
        const resp = await request(app).get(`/companies/code/blah`);
        expect(resp.statusCode).toBe(404);
    })
});