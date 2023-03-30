/* Les variables */

const select_year = document.getElementById("listOfYear");

//Partie choix des années
const span_title_map = document.querySelector(".map h2 span");

//Partie choix des disciplines
let disciplines = [];
const fieldset_disciplines = document.querySelector("#chooseADiscipline fieldset");

//Valeurs par défaut
const first_discipline = document.querySelector("input[name='discipline']");
const first_year = document.querySelector("option[value='2014']");

//Requêtes de départ
let reqDiscipline = "disciplines";
let reqYear = "allYears";
let reqCountry = "allCountries";

//Groupes leaflet
let countries_group;
let circles_group = L.featureGroup(); //initializing circles countries_group
let legend = undefined;

//Carte leaflet
let map = L.map('map-view').setView([20, 20], 2);

//Graphiques
let noDataCountries = document.querySelector('.statistics-country .nodata');
let noDataAthlete = document.querySelector('.statistics-athlete .nodata');
let graphCountries = document.querySelector('.statistics-country .graph');
let graphAthlete = document.querySelector('.statistics-athlete .graph');

let countriesChart = undefined;
let athletesChart = undefined;

let spanTitleGraph = document.querySelector('.statistics-country .title h2 span');
let spanTitleGraph2 = document.querySelectorAll('.statistics-athlete .title h2 span');

//Nombre des meilleurs
let x_first_athletes = document.querySelector('.statistics-athlete .title .key-figure p');
let x_first_countries = document.querySelector('.statistics-country .title .key-figure p');

//Style de la géométrie des pays
let geom_style = {
    weight: 1,
    fillColor: "#a59af5",
    fillOpacity: 1,
    color: "#000"
}

/* Les fonctions */
function breaking_gap(array){
    gaps = []
    for (let i = 0 ; i < array.length -1 ; i++){
        gaps.push(array[i]-array[i+1]); //Liste des écarts entre les entités
    }
    let avg_gap = (gaps.reduce((accum, b) => accum + b) / gaps.length).toFixed(20); //Moyenne
    
    //Rupture de la boucle si un écart dépasse le double de la moyenne
    for (i in gaps) { 
        if (gaps[i] > 2*avg_gap) { 
            return i;
        }
    }
    return gaps.length;
}

function updateTitleMap(){
    //Formulation du titre selon l'année et la discipline sélectionnée
    if(reqYear == "allYears"){ //Année
        span_title_map.textContent = "de 1886 à 2014";
    } else {
        span_title_map.textContent = ` en ${reqYear}`;
    }

    if (reqDiscipline == "disciplines") { //Discipline
        span_title_map.textContent += " dans toutes les disciplines"
    } else {
        span_title_map.textContent += ` en ${reqDiscipline}`
    }
}


function getRadius(value) { //Retourne le rayon des cercles proportionnels selon le nombre de médailles entrée
    let v_min = 1;
    let r_min;
    if (reqYear !='allYears' || reqDiscipline !='disciplines') {
        r_min = 3;
    }
    else {
        r_min = 0.75; //Le rapport de proportion est plus petite si toutes les années et disciplines sont sélectionnées
    }
    return r_min * Math.sqrt(value / v_min);
}

function updateLegend(){

    if(legend){
        map.removeControl(legend);
    }
    //Création de la légende
    legend = L.control({position: 'bottomleft'});

    legend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'legend');
        let legend_grade;

        //Définiton des cercles de la légende selon les paramètres de filtrage
        if ((reqDiscipline == 'disciplines' && reqYear =='allYears')) {
            legend_grade = [5238, 4000, 2000 ,500, 10];
        }
        else {
            legend_grade = [250, 200, 120 ,40, 5];
        }
        
        //La légende se contruit en SVG.
        let svgContent = "<svg>";
        svgContent += `<text class="title_prop" y="11">Nombre de médailles</text>`;
        for(let grade of legend_grade){//Mise en place des cercle et leur ligne
            let radius = getRadius(grade);
            svgContent += `<circle class="circle_prop" cx="60" cy="${140 - radius}" r="${radius}"/>`;
            svgContent += `<line class="line_prop" x1="60" y1="${140 - radius*2}" x2="120" y2="${140 - radius*2}" />`;
            svgContent += `<text class="text_prop" x="120" y="${140 - radius*2}">${grade}</text>`;
        }
        
        //Carré des pays ayant participé
        svgContent += `<rect width="30" height="15" y="155" style="fill:${geom_style.fillColor};
        stroke-width:${geom_style.weight};
        stroke:${geom_style.color}" />`;
        
        svgContent += `<text class="text_prop" y="165" x="40">Pays participants</text>`;

        svgContent += "</svg>";
        div.innerHTML = svgContent;

        return div;
    };

    map.addControl(legend);
}

function updateMedals(json_query){
    fetch('http://localhost:8080/geoserver/Carthageo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=olympics%3Acentroids&outputFormat=application%2Fjson')
    .then(result => result.json())//Requête des centroïdes
    .then(function(centroids) {
        circles_group.clearLayers()
        for (centroid of centroids.features) {//Pour tous les centroïdes...
            let lnglat = centroid.geometry.coordinates;
            let latlng = [lnglat[1], lnglat[0]];
            let medals;
            for (country of json_query) {//...ajouter seulement ceux des pays ayant rapportées des médailles.
                if (country.name == centroid.properties.name) {
                    medals = country.medalcount
                    let circle_prop;
                    circle_prop = L.circleMarker(latlng, {radius : getRadius(medals), color : '#22be85', fillColor : '#61ffb3', fillOpacity : 0.5, weight: 1.5, country: country.name})
                        .bindTooltip(`${country.name} : ${medals} médaille(s)`)
                        .addTo(circles_group)//Ajout de cercles de tailles proportionnelles au nombre de médailles.
                }
            }
        }
        circles_group
            .on("click", (e) => { //Graphique des athlètes s'adapte au pays cliquées sur la carte
                //Limiter la porter du clique à la géométrie du pays, éviter de propager l'événement au clique sur la carte.
                L.DomEvent.stopPropagation(e);
                updateCountry(e.layer.options.country); 
            })
            .addTo(map); //Les cercles s'affichent sur la carte        
    })
}

function updateCountry(countryName = "allCountries") {
    reqCountry = countryName; //Pays demandé au serveur
    if(countryName == "allCountries"){ //Formulation du titre du graphique des athlètes selon le pays sélectionné
        spanTitleGraph2[1].textContent = "";
    }else{
        spanTitleGraph2[1].textContent = "de " + reqCountry;
    }
    //Requête envoyée au serveur demandant les athlètes selon différents paramètres
    updateAthletesData(reqCountry, reqDiscipline, reqYear);

}

function updateGeom(replace = false) {
    let filter;

    //Filtre sur la géométries des pays selon le filtre des années
    if (reqYear == 'allYears') {
        filter = "";
    } else {
        filter = `&CQL_FILTER=first_participation<=${reqYear}%20AND%20last_participation>=${reqYear}`;
    }
    const url = "http://localhost:8080/geoserver/olympics/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=olympics%3Acountry&outputFormat=application%2Fjson"
              + filter;
    //Affichage des pays demandée
    fetch(url)
        .then(result => result.json())
        .then(result => {
            if (replace) {//Effacement des pays précédement affichées sur la carte
                countries_group.clearLayers();
            }
            countries_group = L.geoJSON(result, {//Afichage des pays avec leur style défini
                style : () => {
                    return geom_style;
                }
            }).bindPopup(function (layer) {
                //Mise à jour des éléments titres et graphiques selon le pays sélectionné
                updateCountry(layer.feature.properties.name); 
                return reqCountry; //Apparition d'un popup lors d'un clique sur un pays
            }).addTo(map);
            updateCountryData(); //Mise à jour du nombre de médailles des pays
        })
        .catch(function (error) {
            console.error(error);
        });
}

function updateGraph(result, graphic) {
    let name = [];
    let medalcount = [];
    let total_medals = 0;
    let medals=[]

    //Contruction d'une liste de noms de pays et une liste du nombre de médaille par pays dans le même ordre
    for (let i in result) {
        name.push(result[i].name);
        medalcount.push(result[i].medalcount);

        if (i >= 9) {//Une liste ne dépassant pas 10 éléments
            break;
        }
    }

    //Somme des médailles
    for (entity of result) {
        total_medals += parseInt(entity.medalcount);
        if (entity.medalcount != 0) {
            medals.push(entity.medalcount);
        }
    }

    //Définition de l'indice jusqu'à laquelle est défini la somme des médailles
    if(medals.length == 1){
        break_index = 0;
    }else{
        break_index = parseInt(breaking_gap(medals)); //Indice du plus grand écart observée dans la liste totale des médailles
    }
    //Calcul de la somme des médailles
    let gathered_medals = 0;
    for (i in medals) { 
        gathered_medals += parseInt(medals[i]);
        if (i == break_index) {
            break;
        }
    }
    let ratio = (gathered_medals*100/total_medals).toFixed(2) //Pourcentage que possède les plus médaillées
    
    //Affichage du nombre d'entités et de leur part de médailles obtenues
    if (graphic == graphAthlete) {
        $('.statistics-athlete .percentage').text(ratio+"%");
        if (break_index == 0) {
            x_first_athletes.textContent = "1 athlète a obtenu";
        }
        else {
            x_first_athletes.textContent = `${break_index+1} athlètes ont obtenu`;
        }
    }
    else {
        $('.statistics-country .percentage').text(ratio+"%");
        if (break_index == 0) {
            x_first_countries.textContent = "1 pays détient";
        }
        else {
            x_first_countries.textContent = `${break_index+1} pays détiennent`;
        }
        
    }

    //contruction du graphique
    const chart = new Chart(graphic, {
        type: 'bar',
        data: {
            labels: name, //Les noms
            datasets: [{
                name: name,
                label: 'Nombre de médaille(s) remportée(s)',
                data: medalcount, //Les nombres de médailles
                barThickness: 8
            }]
        },
        options: {//Éléments du graphique à afficher
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        lineWidth: 0
                    },
                    ticks: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        lineWidth: 0
                    },
                    ticks: {
                        maxRotation: 70,
                        minRotation: 70,
                        font: {
                            size: 9
                        }
                    },
                
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            onClick: (e) => {//Au clique sur une barre du graphique
                const canvasPosition = Chart.helpers.getRelativePosition(e, chart); //position du clique
    
                // Substitute the appropriate scale IDs
                const dataX = chart.scales.x.getValueForPixel(canvasPosition.x); //Indice de l'abscisse grâce à la position
                let value = name[dataX]; //récupération de la valeur grâce à l'indice

                if (graphic == graphAthlete) {//Si graphique des athlètes
                    //Transfère de l'utilisateur dans la page des parcours d'athlète avec en paramètre l'identifiant de l'athlète sélectionnée
                    window.location.assign("http://localhost:3000/experience?athlete=" + value) 
                }
                else {//Si graphique des pays
                    updateCountry(value); //Mise à jour du site selon l'id du pays récupéré
                }
            }
        }

    });
    return chart;
}

function updateAthletesData(country, discipline, year) {
    fetch(`http://localhost:3000/athletes/?country=${country}&discipline=${discipline}&year=${year}`)
        .then(rep => rep.json())
        .then(res => {
            if (athletesChart) {//Retrait du précédent graphique s'il existe
                athletesChart.destroy();
            }

            //Composition du titre des graphiques n'ayant pas de données
            if (res.length == 0) {
                noDataAthlete.style.display = "block"; //Appartion de la div no data
                if (reqCountry == "allCountries") {
                    $('.statistics-athlete .nodata h2 span').text("monde");
                } else {
                    $('.statistics-athlete .nodata h2 span').text(reqCountry);
                }
            }else{//Composition du titre des graphiques lorsque les données existent
                if(res.length < 10){
                    spanTitleGraph2[0].textContent = `${res.length} meilleurs`;
                }else{
                    spanTitleGraph2[0].textContent = "10 meilleurs";
                }
                noDataAthlete.style.display = "none"; //effacement de la div no data
                athletesChart = updateGraph(res, graphAthlete); //Mise à jour des données du graphique des athlètes
            }
        })
}

function updateCountryData() {
    fetch("http://localhost:3000/data", { //envoie des paramètres faisant varier les données des pays
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "discipline": reqDiscipline, "year": reqYear })
    })
        .then(result => result.json())
        .then(result => {
            updateMedals(result); //Mise à jour des cercles proportionnelles
            //Mise à jour de la visualistion
            if (countriesChart) { //Retrait du précédent graphique des pays
                countriesChart.destroy();
            }
            if (result.length == 0) { //apparition de la div no data si pas de pays
                noDataCountries.style.display = "block";
            } else { //Mise à jour du titre selon le nombre de pays
                if (result.length < 10) {
                    spanTitleGraph.textContent = "";
                } else {
                    spanTitleGraph.textContent = "10";
                }
                noDataCountries.style.display = "none"; //effacement de la div no data si pas de pays
                countriesChart = updateGraph(result, graphCountries) //Mise à jour du graphique des pays
            }
        })
}

function displayDisciplines(text = "") { //Affichage des disciplines

    fieldset_disciplines.innerHTML = "";

    if (text === "") {//Afficher toutes les disciplines si le champs texte est vide
        first_discipline.setAttribute("checked", true)

        for (let discipline of disciplines) {
            let inputDiscipline = `<div>
            <input type="radio" name="discipline" id="${discipline}" value="${discipline}">
            <label for="${discipline}">${discipline}</label>
            </div>`;

            fieldset_disciplines.innerHTML += inputDiscipline;
        }
    } else {//Changer l'affichage des disciplines selon les caractères entrés
        for (let discipline of disciplines) {
            if (discipline.toLowerCase().includes(text.toLowerCase())) {
                let inputDiscipline = `<div>
                <input type="radio" name="discipline" id="${discipline}" value="${discipline}">
                <label for="${discipline}">${discipline}</label>
            </div>`;

                fieldset_disciplines.innerHTML += inputDiscipline;
            }
        }
    }
}

/* Script */

//Valeurs sélectionnées de départ
first_discipline.setAttribute("checked", true)
first_year.setAttribute("selected", true)

//Mise à jour de la carte
updateTitleMap();
updateGeom();
updateCountry();
updateLegend()

//Affichage de toutes les disciplines dès le chargement de la page
fetch("http://localhost:3000/disciplines")
    .then(rep => rep.json())
    .then(res => {
        for (let discipline of res) {
            disciplines.push(discipline.discipline); //stockage puis...
        }
        displayDisciplines();//...affichage
    })

$("#search-discipline").keyup(function () {//Mise à jour de l'auto-complétion à chaque touche du clavier appuyée
    displayDisciplines(this.value);
})

$("#chooseADiscipline").change(function () {//Mise à jour de la page à chaque fois qu'une discipline est sélectionnée
    reqDiscipline = this.discipline.value;
    updateTitleMap();
    updateCountryData();
    updateAthletesData(reqCountry, reqDiscipline, reqYear);
    updateLegend();
})

//Mise à jour de la page à chaque fois qu'une année est sélectionnée
$("#chooseAYear").change(function () {
    select_year.setAttribute("disabled", true);

    //Si une année est sélectionnée
    if (this.year.value == 'year') {
        select_year.removeAttribute("disabled"); //Possibilité de sélectionner une année précise
        reqYear = this.listOfYear.value;
    } else {//Toutes les années
        reqYear = this.year.value;
    }

    updateTitleMap();
    updateGeom(true);
    updateAthletesData(reqCountry, reqDiscipline, reqYear);
    updateLegend();
})

//Affichage du fond de carte carte
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.{ext}', {
    subdomains: 'abcd',
    minZoom: 2,
    maxZoom: 20,
    ext: 'png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//Afficher les athlètes pour tous les pays lors d'un clique à l'éxterieur des pays
map.on("click", () => {
    updateCountry();
})
