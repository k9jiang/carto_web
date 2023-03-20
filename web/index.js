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

app.use(express.urlencoded({ extended: false }));

//Système de vues à préciser. Set pour configurer
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); //Où trouver les vues

//Listen pour Écouter le port 3000
app.listen(3000, () => {
    console.log("Serveur démarré (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
    const query = "SELECT DISTINCT discipline FROM event";
    pool.query(query, [], (err, result) => {
        if (err) {
          return console.error(err.message);
        }
        console.log(result.rows);
        res.render("index", { disciplines: result.rows});
      });
})
