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
  const data = req.body;

  /* Save to RSVP Table */
  try {
    const yesList = [];
    const maybeList = [];
    const noList = [];
    for (const member of data.party.members) {
      member.status === "coming" ? yesList.push(member.name) : "";
      member.status === "maybe" ? maybeList.push(member.name) : "";
      member.status === "probablyNot" ? noList.push(member.name) : "";
    }

    await pool.query(
      `INSERT INTO wedding."RSVP" (code, coming, maybe, probablyNot) VALUES ('${data.code}','{${yesList}}','{${maybeList}}','{${noList}}')`
    );
    await pool.query("COMMIT");
  } catch (error) {
    console.log(error);
    res.json({ result: false });
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
    console.log(error);
    res.json({ result: false });
  }
  /* Conflict Opt Out*/
  try {
    const conflictOptOut = data.conflicts.conflictsOptOut;
    console.log(conflictOptOut, "conflictOptOut!!!");
    if (conflictOptOut.knowByDate) {
      await pool.query(
        `INSERT INTO wedding."ConflictsOptOut" (code, partymembers, elaboration, knowbydate) VALUES ('${
          data.code
        }', '{${
          conflictOptOut.partyMembers
        }}', '${conflictOptOut.elaboration.replace(/'/g, "")}', '${
          conflictOptOut.knowByDate[2]
        }-${conflictOptOut.knowByDate[0]}-${conflictOptOut.knowByDate[1]}')`
      );
    } else {
      await pool.query(
        `INSERT INTO wedding."ConflictsOptOut" (code, partymembers, elaboration, knowbydate) VALUES ('${data.code}', 'null', 'null', 'null')`
      );
    }
    await pool.query("COMMIT");
  } catch (error) {
    console.log(error);
    res.json({ result: false });
  }

  /* Questionaire!!!*/
  try {
    const questionaire = data.questionnaire;
    await pool.query(
      `INSERT INTO wedding."Questionnaire"(
        code, staywith, needquiet, wholetime, rentalcar, changedlocation, generalcomment)
        VALUES ('${data.code}', '${questionaire.stayWith}','${questionaire.needQuiet}', '${questionaire.wholeTime}','${questionaire.rentalCar}', '${questionaire.changedLocation}','${questionaire.generalComment}');`
    );
    await pool.query("COMMIT");
  } catch (error) {
    console.log(error);
    res.json({ result: false });
  }

  /* Conflicts*/
  try {
    const conflicts = data.conflicts.conflictsArray;
    for (const conflict of conflicts) {
      console.log(conflict);
      await pool.query(
        `INSERT INTO wedding."Conflicts"(
        code, partymembers, description, startsondate, endsondate)
        VALUES ('${data.code}', '{${conflict.partyMembers}}', '${
          conflict.description
        }', '${conflict.startsOnDate[2]}-${conflict.startsOnDate[0]}-${
          conflict.startsOnDate[1]
        }', '${conflict.endsOnDate[2]}-${conflict.endsOnDate[0]}-${
          conflict.endsOnDate[1]
        }');`
      );
    }
    await pool.query("COMMIT");
  } catch (error) {
    console.log(error);
    res.json({ result: false });
  }

  res.json({ result: true });
});

module.exports = router;
