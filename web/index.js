const express = require("express");

const path = require("path");

const { Pool } = require("pg") //Se connecter à la base de données

const app = express();

const dotenv = require('dotenv').config();

const pool = new Pool({ //Identifiants de connexion, ne jamais l'afficher en dur
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
})// mes identifiants à moi, changer dans votre version si vous voulez tester

console.log("Connexion réussie à la base de donnée")

//Où trouver les fichiers statiques si le chemin n'existe pas

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true })); //Autoriser les req.body
app.use(express.json());

//Système de vues à préciser. Set pour configurer
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); //Où trouver les vues

//Listen pour Écouter le port 3000
app.listen(3000, () => {
    console.log("Serveur démarré (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
    const query_discipline = "SELECT DISTINCT discipline FROM event";
    const query_year = "SELECT DISTINCT year from olympiad ORDER BY year ASC";
    pool.query(query_discipline, [], (err, result) => {
      let years;
      if (err) {
        return console.error(err.message);
      }
      disciplines = result.rows;
      //console.log(result.rows);
      pool.query(query_year, [], (err, result2) => {
        if (err) {
          return console.error(err.message);
        }
        years = result2.rows;
        //console.log(years);
        res.render("index", {disciplines: disciplines, years : years})})
    })
})

app.post("/data", (req, res) => {
  console.log(req.body);
  let query_parameters;

  let query_medals;
  if (req.body.discipline == 'disciplines' && req.body.year == 'allYears') {
    query_medals = "SELECT country.name, count(medal.medal) AS medalcount FROM athlete JOIN medal ON athlete.id = medal.athlete_id JOIN event ON medal.event_id = event.id JOIN country ON athlete.country_id = country.id GROUP BY country.name ORDER BY medalcount desc";
  }
  else if (req.body.discipline == 'disciplines' && req.body.year != 'allYears') {
    query_parameters = [req.body.year]
    query_medals = "SELECT country.name, count(medal.medal) AS medalcount, olympiad.year FROM athlete JOIN medal ON athlete.id = medal.athlete_id JOIN event ON medal.event_id = event.id JOIN country ON athlete.country_id = country.id JOIN olympiad ON medal.olympiad_id = olympiad.id  WHERE olympiad.year = $1 GROUP BY country.name, olympiad.year ORDER BY medalcount desc";
  }
  else if (req.body.discipline != 'disciplines' && req.body.year == 'allYears') {
    query_parameters = [req.body.discipline]
    query_medals = "SELECT country.name, count(medal.medal) AS medalcount, event.discipline FROM athlete JOIN medal ON athlete.id = medal.athlete_id JOIN event ON medal.event_id = event.id JOIN country ON athlete.country_id = country.id WHERE event.discipline = $1 GROUP BY country.name, event.discipline ORDER BY medalcount desc";
  }
  else {
    query_parameters = [req.body.discipline, req.body.year]
    query_medals = "SELECT country.name, count(medal.medal) AS medalcount, olympiad.year, event.discipline FROM athlete JOIN medal ON athlete.id = medal.athlete_id JOIN event ON medal.event_id = event.id JOIN country ON athlete.country_id = country.id JOIN olympiad ON medal.olympiad_id = olympiad.id  WHERE event.discipline = $1 AND olympiad.year = $2 GROUP BY country.name, olympiad.year, event.discipline ORDER BY medalcount desc";
  }
  console.log(query_medals);
  pool.query(query_medals, query_parameters, (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    medals_by_country = result.rows;
    console.log(medals_by_country);
    res.json(medals_by_country);
  })
})

app.get("/athletes/:country", (req, res) => {
  console.log(req.params.country);
  res.json(req.params.country);
})
