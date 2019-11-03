var express = require("express");
var router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: "marriagedb",
  password: process.env.PGPASSWORD,
  port: 5432
});

/* See if person can login and see their specialised data */
router.post("/login", async function(req, res, next) {
  try {
    const dbRes = await pool.query(
      `SELECT party FROM wedding."Parties" WHERE code = '${req.body.code}'`
    );
    res.json({
      result: true,
      partyMembers: dbRes.rows[0].party
    });
  } catch {
    res.json({
      result: false
    });
  }
});

/* Save seriousness of party to respective row in database */
router.post("/submitRSVP", async function(req, res, next) {
  console.log(JSON.stringify(req.body));
  try {
    res.json({result: true});
  } catch {
    res.json({result: false});
  }
});

module.exports = router;
