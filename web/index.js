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
})

console.log("Connexion réussie à la base de donnée")

//functions
function checks_replaces_if_apostrophe(str){
  let str_replaced = str
  if (str.includes("'")) {
    str_replaced = str.replace("'", "''");
  }
  return str_replaced
}

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

app.get("/disciplines", (req, res) => {
  const query_discipline = "SELECT DISTINCT discipline from event";
  pool.query(query_discipline, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.json(result.rows);
  })
})

app.get("/", (req, res) => {
  const query_year = "SELECT DISTINCT year from olympiad ORDER BY year ASC";
  pool.query(query_year, [], (err, result2) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("index", {years : result2.rows});
  })
})

app.get("/experience", (req, res) => {
    res.render("experience");
})
app.get("/about", (req, res) => {
    res.render("about");
})

app.get("/names", (req, res) => {
  const query_names = "SELECT DISTINCT name from athlete ORDER BY name ASC";
  pool.query(query_names, [], (err, result2) => {
    if (err) {
      return console.error(err.message);
    }
    //console.log(result2.rows);
    res.json(result2.rows);
  })
})

app.post("/data", (req, res) => {
  //console.log(req.body);
  let query_parameters;
  let query_medals;

  if (req.body.discipline == 'disciplines' && req.body.year == 'allYears') {
    query_medals = "SELECT country.name, count(medal.medal) AS medalcount FROM athlete JOIN medal ON athlete.id = medal.athlete_id JOIN event ON medal.event_id = event.id JOIN country ON athlete.country_id = country.id GROUP BY country.name ORDER BY medalcount desc";
  }
  else if (req.body.discipline == 'disciplines' && req.body.year != 'allYears') {
    query_parameters = [req.body.year];
    query_medals = "SELECT country.name, count(medal.medal) AS medalcount, olympiad.year FROM athlete JOIN medal ON athlete.id = medal.athlete_id JOIN event ON medal.event_id = event.id JOIN country ON athlete.country_id = country.id JOIN olympiad ON medal.olympiad_id = olympiad.id  WHERE olympiad.year = $1 GROUP BY country.name, olympiad.year ORDER BY medalcount desc";
  }
  else if (req.body.discipline != 'disciplines' && req.body.year == 'allYears') {
    query_parameters = [req.body.discipline];
    query_medals = "SELECT country.name, count(medal.medal) AS medalcount, event.discipline FROM athlete JOIN medal ON athlete.id = medal.athlete_id JOIN event ON medal.event_id = event.id JOIN country ON athlete.country_id = country.id WHERE event.discipline = $1 GROUP BY country.name, event.discipline ORDER BY medalcount desc";
  }
  else {
    query_parameters = [req.body.discipline, req.body.year];
    query_medals = "SELECT country.name, count(medal.medal) AS medalcount, olympiad.year, event.discipline FROM athlete JOIN medal ON athlete.id = medal.athlete_id JOIN event ON medal.event_id = event.id JOIN country ON athlete.country_id = country.id JOIN olympiad ON medal.olympiad_id = olympiad.id  WHERE event.discipline = $1 AND olympiad.year = $2 GROUP BY country.name, olympiad.year, event.discipline ORDER BY medalcount desc";
  }
  //console.log(query_medals);
  pool.query(query_medals, query_parameters, (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    medals_by_country = result.rows;
    //console.log(medals_by_country);
    res.json(medals_by_country);
  })
})


app.get("/athletes", (req, res) => {
  console.log(req.query.country, req.query.discipline, req.query.year); //we use req.query instead of req.parameters because the route is not explicit
  let query_parameters = [req.query.country, req.query.discipline, req.query.year];
  let default_parameters = ['allCountries', 'disciplines', 'allYears'];
  let is_default_query = [];
  for (let i = 0; i < query_parameters.length; i++) {
    if (query_parameters[i] != default_parameters[i]) {
      is_default_query.push(false);
    }
    else {
      is_default_query.push(true);
    }}
  console.log(is_default_query);
  let select_clause = "";
  let where_clause = "";
  let join_clause = "";
  let groupby_clause = "";

  //building query according to sent parameters
  for (let i = 0; i < is_default_query.length; i++) {
    let param = query_parameters[i]
    if (!is_default_query[i]) {
      if (i==0){
        param = checks_replaces_if_apostrophe(param) //handling "Cote d'Ivoire" exception that generate issue because of the "'" in the sql query
        select_clause += ", country.name AS nationality";
        groupby_clause += ", nationality";
        join_clause +=" JOIN country ON athlete.country_id = country.id";
        where_clause += " WHERE country.name = '"+param+"'";
      }
      else if (i==1){
        select_clause += ", event.discipline";
        groupby_clause += ", event.discipline";
        join_clause += " JOIN event ON medal.event_id = event.id";
        if (where_clause == "") {
          where_clause += " WHERE event.discipline ='"+param+"'";
        }
        else {
          where_clause += " AND event.discipline = '"+param+"'"};
      }
      else {
        select_clause += ", olympiad.year";
        groupby_clause += ", olympiad.year";
        join_clause += " JOIN olympiad ON medal.olympiad_id = olympiad.id"
        if (where_clause == "") {
          where_clause += " WHERE olympiad.year ="+param;
        }
        else {
        where_clause += " AND olympiad.year = "+param;}
      }
    }
  }
  sql_query = `SELECT athlete.name, count(medal.medal) AS medalcount${select_clause}
  FROM athlete JOIN medal on athlete.id = medal.athlete_id${join_clause} 
  ${where_clause} 
  GROUP BY athlete.name${groupby_clause} 
  ORDER BY medalcount DESC`;

  //console.log(sql_query);
  pool.query(sql_query,[], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.json(result.rows)
  })
})

app.get("/experience/:name", (req, res) => {
  let name = req.params.name;
  name = checks_replaces_if_apostrophe(name);
  const sql = `SELECT athlete.name, olympic_cities.id as city_id, olympiad.year, athlete.gender, medal.medal, count(medal.medal) as medalcount, country.name  
  FROM athlete JOIN medal ON athlete.id = medal.athlete_id
  JOIN country on athlete.country_id = country.id
  JOIN olympiad on medal.olympiad_id = olympiad.id
  JOIN olympic_cities on olympiad.city_id = olympic_cities.id
  WHERE athlete.name ilike '${name}'
  GROUP BY athlete.name, country.name, athlete.gender, medal.medal, olympiad.year, olympic_cities.id
  ORDER BY olympiad.year`;
  pool.query(sql, [], (err, result) => {
     if (err) {
      return console.error(err.message);
    }
    res.json(result.rows);
  });
});

app.get("/search", (req,res) => {
  let param = req.query.search;
  param = checks_replaces_if_apostrophe(param);
  const sql = `SELECT DISTINCT name FROM athlete WHERE name ilike '%${param}%'`;
  pool.query(sql, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.json(result.rows);
  })
})