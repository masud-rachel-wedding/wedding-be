var express = require('express');
var router = express.Router();
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: 'marriagedb',
  password: process.env.PGPASSWORD,
  port: 5432,
})

/* See if person can login and see their specialised data */
router.get('/login', async function(req, res, next) {
  const dbRes = await pool.query('SELECT * FROM marriage.users')
  console.log(dbRes.rows)
  res.json(dbRes.rows)
  pool.end()
});

/* Count and tally votes between Crete and Korcula*/
router.post('/countVotes', async function(req, res, next) {

  res.json({})
});


/*Update party members who are coming to the wedding*/
router.post('/updateRSVP', async function(req, res, next) {
  
  res.json({})
});


/* Save schedule of person to respective row in database */
router.post('/storeSchedule', async function(req, res, next) {
  
  res.json({})
});

/* Save perferences of party to respective row in database */
router.post('/storePreferences', async function(req, res, next) {
  res.json({})
});

/* Save seriousness of party to respective row in database */
router.post('/storeSeriousness', async function(req, res, next) {
  res.json({})
});




module.exports = router;
