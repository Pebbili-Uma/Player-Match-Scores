const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let database = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjToResponseObj = (DbObj) => {
  return {
    playerId: DbObj.player_id,
    playerName: DbObj.player_name,
  };
};

const convertDbObjToMatchObj = (DBObj) => {
  return {
    matchId: DBObj.match_id,
    match: DBObj.match,
    year: DBObj.year,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachObj) => convertDbObjToResponseObj(eachObj))
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId}`;
  const player = await database.get(getPlayerQuery);
  response.send(convertDbObjToResponseObj(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details SET 
  player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertDbObjToMatchObj(match));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `SELECT * FROM match_details LEFT JOIN player_match_score
  ON match_details.match_id = player_match_score.match_id WHERE
  player_match_score.player_id = ${playerId};`;
  const matchArray = await database.all(getPlayerMatchQuery);
  response.send(matchArray.map((DBObj) => convertDbObjToMatchObj(DBObj)));
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchQuery = `SELECT * FROM player_details LEFT JOIN player_match_score
  ON player_details.player_id = player_match_score.player_id WHERE
  player_match_score.match_id = ${matchId};`;
  const playerArray = await database.all(getPlayerMatchQuery);
  response.send(playerArray.map((DBObj) => convertDbObjToResponseObj(DBObj)));
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playerArray = await database.get(getPlayerMatchQuery);
  response.send(playerArray);
});
module.exports = app;
