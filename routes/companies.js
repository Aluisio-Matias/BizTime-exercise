const express = require("express");
const ExpressError = require("../expressError");
const slugify = require("slugify");
const router = express.Router();
const db = require("../db");

// GET /companies - Returns list of companies

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT code, name, description FROM companies`);
        return res.json({
            "companies": results.rows
        });
    } catch (err) {
        return next(err);
    }
});


// GET /companies/[code] - Return obj of company: {company: {code, name, description}}
// If company code can't be found return 404 error.

router.get('/:code', async (req, res, next) => {

    try{

        const code = req.params.code;

        const result = await db.query(`SELECT code, name, description 
                                        FROM companies WHERE code=$1`, [code]);
        
        const company = result.rows[0];

        if (result.rows.length === 0){
            throw new ExpressError(`Can't find the company with the code: ${code}`, 404);
        } else {
            return res.json({ "company": company });
        }
        
    } catch (err) {
        return next(err);
    }
});


// POST /companies Adds a company. Needs to be given JSON like: {code, name, description}
// Returns obj of new company: {company: {code, name, description}}

router.post('/', async (req, res, next) => {
    try{
        let { name, description } = req.body;
        let code = slugify(name, {lower: true});

        const results = await db.query(`INSERT INTO companies (code, name, description)
                                        VALUES ($1, $2, $3)
                                        RETURNING code, name, description`, [code, name, description]);

        return res.status(201).json({"company": results.rows[0]});

    } catch (err) {
        return next(err);
    }
});


//PUT /companies/[code] Edit existing company.
//Should return 404 if company cannot be found.
//Needs to be given JSON like: {name, description}
//Returns update company object: {company: {code, name, description}}

router.put('/:code', async (req, res, next) => {
    try{
        let { name, description } = req.body;
        let code = req.params.code;

        const result = await db.query(`UPDATE companies SET name=$1, description=$2
                                        WHERE code=$3
                                        RETURNING code, name, description`, [name, description, code]);
        
        if (result.rows.length === 0){
            throw new ExpressError(`Can't find company with the code: ${code}`, 404)
        } else {
            return res.json({"company": result.rows[0]});
        }
    }catch (err) {
        return next(err);
    }
});


// DELETE /companies/[code] - Deletes company.
// Should return 404 if company cannot be found. Returns {status: "deleted"}

router.delete('/:code', async (req, res, next) => {
    try {
        let code = req.params.code;

        let result = await db.query(`DELETE FROM companies WHERE code = $1
                                    RETURNING code`, [code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find company with the code: ${code}`, 404)
        }else {
            return res.json({"status": "deleted"});
        }
    } catch (err) {
        return next(err);
    }
});


// GET /companies/code/[code]
// Return obj of company: {company: {code, name, description, invoices: [id, ...]}}
// If the company given cannot be found, this should return a 404 status response.

router.get("/code/:code", async (req, res, next) => {
    try{
        let code = req.params.code;

        const compResult = await db.query(
            `SELECT code, name, description FROM companies
            WHERE code = $1`, [code]);

        const invResult = await db.query(
            `SELECT id, comp_code, amt FROM invoices
            WHERE comp_code = $1`, [code]);

        if (compResult.rows.length === 0) {
            throw new ExpressError(`Company with code: ${code} was not found!`, 404);
        }

        const company = compResult.rows[0];
        const invoices = invResult.rows;

        company.invoices = invoices.map(inv => inv.id);

        return res.json({"company": company});

    } catch (err) {
        next(err);
    }
});



module.exports = router;