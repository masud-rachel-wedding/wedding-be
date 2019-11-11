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
    let dbRes = await pool.query(
      `SELECT code FROM wedding."RSVP" WHERE code = '${req.body.code}'`
    );
    if (dbRes.rows.length && dbRes.rows[0]) {
      res.write(JSON.stringify({
        result: false,
        message: 'ALREADY_SUBMITTED'
      }));
    }
    else {
      let partydbRes = await pool.query(
        `SELECT party FROM wedding."Parties" WHERE code = '${req.body.code}'`
      );
      if (partydbRes.rows.length && partydbRes.rows[0].party){
        res.write(JSON.stringify({
          result: true,
          partyMembers: partydbRes.rows[0].party
        }));
      }
      else {
        res.write(JSON.stringify({
          result: false,
          message: "INVALID_CODE"
        }));
      }
    }
  } catch(error) {
    res.write(JSON.stringify({
      result: false,
      message: "ERROR",
      error: error
    }));
  } finally {
    res.end();
  }
});

/* Save seriousness of party to respective row in database */
router.post("/submitRSVP", async function(req, res, next) {
  const data = req.body;

  /* Save to RSVP Table */
  try {
    const yesList = [];
    const maybeList = [];
    const noList = [];
    const sanElab = data.party.elaboration === null || data.party.elaboration === '' ? 'null' : data.party.elaboration.replace(/'/g, "");
    for (const member of data.party.members) {
      member.status === "coming" ? yesList.push(member.name) : "";
      member.status === "maybe" ? maybeList.push(member.name) : "";
      member.status === "probablyNot" ? noList.push(member.name) : "";
    }

    await pool.query(
      `INSERT INTO wedding."RSVP" (code, coming, maybe, probablyNot, elaboration) VALUES ('${data.code}','{${yesList}}','{${maybeList}}','{${noList}}', '${sanElab}')`
    );
    await pool.query("COMMIT");
  } catch (error) {
    console.log(error, "RSVP");
    res.write(JSON.stringify({ result: false }));
  }
  /* Save Vote */
  try {
    let greeceBool = false;
    let croatiaeBool = false;
    if (data.countryVote === "greece") {
      greeceBool = true;
    } else {
      croatiaeBool = true;
    }

    await pool.query(
      `INSERT INTO wedding."CountryVote" (code, greece, croatia) VALUES ('${data.code}', ${greeceBool}, ${croatiaeBool})`
    );
    await pool.query("COMMIT");
  } catch (error) {
    console.log(error, "save vote");
    res.write(JSON.stringify({ result: false }));
  }
  /* Conflict Opt Out*/
  try {
    const conflictOptOut = data.conflicts.conflictsOptOut;
    let partyMembers = conflictOptOut.partyMembers.length === 0 ? 'null' : conflictOptOut.partyMembers;
    let elaboration = conflictOptOut.elaboration === null || conflictOptOut.elaboration === '' ? 'null' : conflictOptOut.elaboration.replace(/'/g, "");
    let knowByDate = conflictOptOut.knowByDate.length === 0 ? null : conflictOptOut.knowByDate;
    if(knowByDate !== null) {
      await pool.query(
        `INSERT INTO wedding."ConflictsOptOut" (code, partymembers, elaboration, knowbydate) VALUES ('${
          data.code
        }', '{${
          partyMembers
        }}', '${elaboration}', '${
          knowByDate[2]
        }-${knowByDate[0]}-${knowByDate[1]}')`
      );
    } else {
      await pool.query(
        `INSERT INTO wedding."ConflictsOptOut" (code, partymembers, elaboration, knowbydate) VALUES ('${data.code}', '{${partyMembers}}', '${elaboration}', '1900-01-01')`
      );
    }
    await pool.query("COMMIT");
  } catch (error) {
    console.log(error, "conflict output");
    res.write(JSON.stringify({ result: false }));
  }

    /* ConflictsElab!!!*/
    try {
      const conflictsElab = data.conflicts.elaboration === null || data.conflicts.elaboration === '' ? 'null' : data.conflicts.elaboration.replace(/'/g, "");
      await pool.query(
        `INSERT INTO wedding."ConflictsElab"(
          code, elaboration)
          VALUES ('${data.code}', '${conflictsElab}');`
      );
      await pool.query("COMMIT");
    } catch (error) {
      console.log(error, "ConflictsElab");
      res.write(JSON.stringify({ result: false }));
    }

  /* Questionaire!!!*/
  try {
    const questionnaire = data.questionnaire;
    let generalComment = questionnaire.generalComment === null || questionnaire.generalComment === '' ? 'null' : questionnaire.generalComment.replace(/'/g, "");
    await pool.query(
      `INSERT INTO wedding."Questionnaire"(
        code, staywith, needquiet, wholetime, rentalcar, changedlocation, generalcomment)
        VALUES ('${data.code}', '${questionnaire.stayWith}','${questionnaire.needQuiet}', '${questionnaire.wholeTime}','${questionnaire.rentalCar}', '${questionnaire.changedLocation}','${generalComment}');`
    );
    await pool.query("COMMIT");
  } catch (error) {
    console.log(error, "questionaire");
    res.write(JSON.stringify({ result: false }));
  }

  /* Conflicts*/
  try {
    const conflicts = data.conflicts.conflictsArray;
    for (const conflict of conflicts) {
      let description = conflict.description === null || conflict.description === '' ? 'null' : conflict.description.replace(/'/g, "");
      await pool.query(
        `INSERT INTO wedding."Conflicts"(
        code, partymembers, description, startsondate, endsondate)
        VALUES ('${data.code}', '{${conflict.partyMembers}}', '${
          description
        }', '${conflict.startsOnDate[2]}-${conflict.startsOnDate[0]}-${
          conflict.startsOnDate[1]
        }', '${conflict.endsOnDate[2]}-${conflict.endsOnDate[0]}-${
          conflict.endsOnDate[1]
        }');`
      );
    }
    await pool.query("COMMIT");
  } catch (error) {
    console.log(error, "conflicts");
    res.write(JSON.stringify({ result: false }));
  }

  res.write(JSON.stringify({ result: true }));
  res.end();
});

module.exports = router;
