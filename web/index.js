const express = require("express");

const path = require("path");

const { Pool } = require("pg") //Se connecter à la base de données

const app = express();

const pool = new Pool({ //Identifiants de connexion, ne jamais l'afficher en dure
    user: "postgres",
    host: "localhost",
    database: "Cartha",
    password: "postgres",
    port: 5432
})

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
    res.render("index");
})
