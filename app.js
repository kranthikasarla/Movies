const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "moviesData.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertMovieDbObjectToRespondObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorDbObjectToRespondObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

app.get("/movies/", async (request, response) => {
  const getMovieQuery = `SELECT movie_name FROM movie;`;
  const moviesArray = await database.all(getMovieQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id = ${movieId};`;
  const movie = await database.get(getMovieQuery);
  response.send(convertMovieDbObjectToRespondObject(movie));
});

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postMovieQuery = `
    INSERT INTO
     movie(director_id, movie_name, lead_actor) 
    VALUES
      (${directorId}, '${movieName}', '${leadActor}');`;
  await database.run(postMovieQuery);
  response.send("Movie Successfully Added");
});

app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updateMovieQuery = `
    UPDATE
     movie 
    SET 
    director_id = ${directorId}, 
    movie_name = '${movieName}', 
    lead_actor = '${leadActor}' 
    WHERE 
    movie_id = ${movieId};`;
  await database.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM 
    movie
     WHERE
      movie_id = ${movieId};`;
  await database.run(deleteMovieQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorQuery = `
    SELECT
     * 
    FROM 
    director;`;
  const directorArray = await database.all(getDirectorQuery);
  response.send(
    directorArray.map((eachDirector) =>
      convertDirectorDbObjectToRespondObject(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorsMovieQuery = `
    SELECT
     movie_name 
    FROM 
    movie
    WHERE 
    director_id = '${directorId}';`;
  const movieArray = await database.all(getDirectorsMovieQuery);
  response.send(
    movieArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});
module.exports = app;
