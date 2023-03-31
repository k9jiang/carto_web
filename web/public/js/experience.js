/* Les variables */
let athletes = [];
let scrollAthlete = document.getElementById("scroll");
let formAthlete = document.getElementById("chooseAnAthlete");
let reqAthlete = null;

let map = L.map('map-view').setView([20, 20], 2);

//Paramètre de l'url
const currentUrl = new URL(window.location.href);
reqAthlete = currentUrl.searchParams.get("athlete")

//Titres
let mapTitle = document.querySelector(".part-two h2")
let descriptionTitle = document.querySelector(".part-three h2")

//Style de la géométrie des pays
let geom_style = {
    weight: 1,
    fillColor: "#a59af5",
    fillOpacity: 1,
    color: "#000"
}

//Groupes leaflet
let cities_group = L.featureGroup();
let lines_group = L.featureGroup();
let popups_group = L.featureGroup();

/* Les fonctions */

//Changer l'affichage des athlètes selon les caractères entrés
function displayAthletes() { 

    scrollAthlete.innerHTML = "";

    if(athletes.length <= 0){ //Si le champ texte est vide
        scrollAthlete.innerHTML = "<p>Pas d'athlètes</p>";
    }else{
        for (let athlete of athletes) {
            let reNameAthlete = reName(athlete.name);
            let inputAthlete = `<div>
            <input type="radio" name="athlete" id="${athlete.name}" value="${reNameAthlete}">
            <label for="${athlete.name}">${reNameAthlete}</label>
            </div>`;
    
            scrollAthlete.innerHTML += inputAthlete;
        }
    }
}

function updateTitles(title){//Changement des titres selon l'athlète
    mapTitle.textContent = `Ville(s) où ${title} a participé`;
    descriptionTitle.textContent = title;
}

function reName(str){ //Transformation des noms des athlètes
    let str_split = str.split(', ');
    let first_str = str_split[0].toLowerCase();
    let first_letter = first_str.charAt(0).toUpperCase();
    first_str = first_letter + first_str.slice(1)

    return [first_str, str_split[1]].join(" ")
}

function updateDescription(result){//Mise à jour de l'encadré description

    if(result.length >= 1){
        $("#description").css("opacity", 1);//encadré visible

        first_res = result[0];
        gold_medals = 0;
        silver_medals = 0;
        bronze_medals = 0;

        if(first_res.gender == "Women"){//Homme ou Femme
            $("#genre span").text("♀ Femme");
        }else{
            $("#genre span").text("♂ Homme");
        }

        $("#country span").text(first_res.name);//Pays
        $("#discipline span").text(first_res.discipline);//Discipline
        
        for (let res of result){//Dénombrement des catégories de médailles...
            if(res.medal == "Gold"){
                gold_medals += parseInt(res.medalcount)
            }else if(res.medal == "Silver"){
                silver_medals += parseInt(res.medalcount)
            }else{
                bronze_medals += parseInt(res.medalcount) 
            }
        }
        //...Puis mise en place des nombre de médailles
        $("#medals_gain div.gold span").text(gold_medals);
        $("#medals_gain div.silver span").text(silver_medals);
        $("#medals_gain div.bronze span").text(bronze_medals);
        $("#medals_gain p span").text(bronze_medals + silver_medals + gold_medals);//total des médailles
    }
    
}

function updateMap(result){

    let url = "http://localhost:8080/geoserver/Carthageo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=olympics%3Aolympic_cities&outputFormat=application%2Fjson";

    fetch(url)//Demande des points de ville
        .then(rep => rep.json())
        .then(res => { 
            cities_group.clearLayers();
            lines_group.clearLayers();
            popups_group.clearLayers();

            let latlngs = [];
            let latlng = [];

            let features = res.features;

            for (elmt of result) {//Parcours dans l'ordre des années de compétition du joueur
                for (city of features) {//Vérifier la correspondance avec les villes
                    if (elmt.city_id == city.id.replace("olympic_cities.", "")) {
                        let coords = city.geometry.coordinates;
                        latlngs.push([coords[1], coords[0]]);//Consititution de la liste des coordonnées dans l'ordre de passage

                        L.marker([coords[1], coords[0]])//Placement des markers
                            .bindTooltip(city.properties.city + " en " + elmt.year)   
                            .addTo(cities_group);
                        
                    }
                }
            }

            for(let coord of latlngs){
                //Constitution d'un ligne ne dépassant pas deux coordonnées
                latlng.push(coord);
                if(latlng.length >= 2){
                    //Création d'une ligne avec une flèche
                    L.polyline(latlng, {color: 'red'}).arrowheads({yawn:40, size:"8%", fill:'true', fillColor:'red', fillOpacity:'1'}).addTo(lines_group);
                    latlng.shift();//retrait de la première coordonnée
                }
            }

            popups_group.addTo(map);
            lines_group.addTo(map);
            cities_group.addTo(map);
            
        })
}

function fetchAthlete(id, name){//demande des données d'un athlète
    reqAthlete = id;
    updateTitles(name);//Mise à jour des données

    fetch("http://localhost:3000/experience/" + reqAthlete)
        .then(rep => rep.json())
        .then(res => { 
            updateDescription(res); //Mise à jour de la description
            updateMap(res); //Mise à jour de la carte
        })
}

/* Le script */
if(reqAthlete == null){//S'il n'y a pas d'athlète en url...
    fetch("http://localhost:3000/names")
        .then(rep => rep.json())
        .then(res => { 
            for (let i in res) {
                athletes.push(res[i]);
    
                if(i >= 50){//...Sélection des 5 premiers athlètes;
                    break;
                }
            }
            displayAthletes();
    
    })
}else{
    //Si un athlète figure en paramètre, ces données sont demandées dès le chargement de la page.
    fetchAthlete(reqAthlete, reName(reqAthlete)); 
}

formAthlete.addEventListener("submit", function(e) {//Recherche des athlètes
    e.preventDefault();
    if(this.character.value.length >= 4){
        fetch(`search/?search=${this.character.value}`)
            .then(res => res.json())
            .then(res2 =>{
                athletes =[];
                for (let ath of res2){
                    athletes.push(ath); //liste de tous les athlètes correspondant à la chaine de caractère en paramètre
                }
            displayAthletes(); //Affichage des athlètes
        });
    }
})

$("#chooseAnAthlete").change(function (e) {
    if(e.target.id != "search-athlete"){//Demande d'un athlète seulement lorsqu'on clique sur un athlète
        fetchAthlete(e.target.id, this.athlete.value);
    }
})

//Affichage du fond de carte carte
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.{ext}', {
    subdomains: 'abcd',
    minZoom: 2,
    maxZoom: 20,
    ext: 'png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);