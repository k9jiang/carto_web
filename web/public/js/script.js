const selectYear = document.getElementById("listOfYear");
const spanTitleMap = document.querySelector(".map h2 span");

const inputEnterDiscipline = document.getElementById("search-discipline");
const formDiscipline = document.querySelector("#chooseADiscipline fieldset");

const firstDiscipline = document.querySelector("input[name='discipline']");
const firstYear = document.querySelector("option[value='2014']");

let disciplines = [];

let reqDiscipline = "disciplines";
let reqYear = "allYears";
let reqCountry;

let group;
let circles_group = L.featureGroup(); //initializing circles group

let filter;
let map = L.map('map-view').setView([0, 0], 3);

//Graphiques
let graphCountries = document.querySelector('.statistics-country .graph');
let graphAthlete = document.querySelector('.statistics-athlete .graph');

let spanTitleGraph = document.querySelector('.statistics-athlete h2 span');


//Fonctions
function updateTitleMap(){
    if(reqYear == "allYears"){
        spanTitleMap.textContent = "de 1886 à 2014"
    }else{
        spanTitleMap.textContent = ` en ${reqYear}`
    }

    if(reqDiscipline == "disciplines"){
        spanTitleMap.textContent += " dans toutes les disciplines"
    }else{
        spanTitleMap.textContent += ` en ${reqDiscipline}`
    }
}

function getRadius(value) {
    let v_min = 1
    let r_min = 5
    return r_min * Math.sqrt(value / v_min)
}

function updateMedals(json_query){
    fetch('http://localhost:8080/geoserver/Carthageo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=olympics%3Acentroids&outputFormat=application%2Fjson')
    .then(result => result.json())
    .then(function(centroids) {
        console.log(centroids.features[0].geometry.coordinates);
        circles_group.clearLayers() //clears circles features at the beginning of each change
        for (centroid of centroids.features) {
            let lnglat = centroid.geometry.coordinates;
            let latlng = [lnglat[1], lnglat[0]];
            let medals;
            for (country of json_query) {
                if (country.name == centroid.properties.name) {
                    medals = country.medalcount
                    console.log(medals, country.name, centroid.properties.name);
                    L.circleMarker(latlng, {radius : getRadius(medals), color : '#8C731F', fillColor : '#FFFD00',fillOpacity : 1}).addTo(circles_group); //adding each circle of each country to the group
                }
            }
        }
        console.log(circles_group);
        circles_group.addTo(map); //displaying features group in the map
    })}

function updateCountry(countryName){
    reqCountry = countryName;
    spanTitleGraph.textContent = reqCountry;
    updateGraphAthletes(reqCountry);

}

function updateGeom(replace = false){
    if(reqYear == 'allYears'){
        filter = "";
    }else{
        filter = `&CQL_FILTER=first_participation<=${reqYear}%20AND%20last_participation>=${reqYear}`;
    }
    const url = "http://localhost:8080/geoserver/Carthageo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=olympics%3Acountry&outputFormat=application%2Fjson"
              + filter;
    //Affichage des pays
    fetch(url)
        .then(result => result.json())
        .then(result => {
            if(replace){
                group.clearLayers();
            }
            group = L.geoJSON(result).bindPopup(function (layer) {
                updateCountry(layer.feature.properties.name);
                return reqCountry;
            }).addTo(map);
        })
        .catch(function(error) {
            console.error(error);
        });
}


//Affichage des graphiques
function updateGraphCountries(result){
    new Chart(graphCountries, {
        type: 'bar',
        data: {
            labels: result.name,
            datasets: [{
                label: 'Nombre de médaille remporté',
                data: result.medalcount,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            onClick: (e) => {
                console.log(this);
                updateCountry(this); //insertion du nom du pays
            }
        }
    });
}

function updateGraphAthletes(country){
    fetch("http://localhost:3000/athletes/"+country)
        .then(rep => rep.json())
        .then(res => {
            console.log(res)
        })
}


function updateData(){
    fetch("http://localhost:3000/data",{
        method : "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"discipline": reqDiscipline, "year": reqYear})
    })
        .then(result => result.json())
        .then(result => {
            console.log(result);
            updateMedals(result);
            //Mise à jour de la visualistion
            //updateGraphCountries(result);
        })
}

function displayDisciplines(text = ""){

    formDiscipline.innerHTML = "";

    if(text === "" ){
        for(let discipline of disciplines){
            let inputDiscipline = `<div>
            <input type="radio" name="discipline" value="${discipline}">
            <label for="discipline">${discipline}</label>
            </div>`;
            
            formDiscipline.innerHTML += inputDiscipline;
        }
    }else{
        for(let discipline of disciplines){
            if(discipline.toLowerCase().includes(text.toLowerCase())){
                let inputDiscipline = `<div>
                <input type="radio" name="discipline" value="${discipline}">
                <label for="discipline">${discipline}</label>
            </div>`;
            
            formDiscipline.innerHTML += inputDiscipline;
            }       
        }
    }
}

//Valeurs sélectionnées de départ
firstDiscipline.setAttribute("checked", true)
firstYear.setAttribute("selected", true)

//Mise à jour de la carte
updateTitleMap();
updateGeom();
//updateData();


//Interaction avec les disciplines
fetch("http://localhost:3000/disciplines")
    .then(rep => rep.json())
    .then(res => {
        for(let discipline of res){
            disciplines.push(discipline.discipline);
        }
        displayDisciplines();
    })

$("#search-discipline").keyup(function(){
    console.log(this.value);
    displayDisciplines(this.value);
})

$("#chooseADiscipline").change(function(){
    reqDiscipline = this.discipline.value;
    updateTitleMap();
    updateData();
})

//Interaction avec les années
$("#chooseAYear").change(function(){
    selectYear.setAttribute("disabled", true);

    //Si une année est sélectionnée
    if(this.year.value == 'year'){
        selectYear.removeAttribute("disabled");
        reqYear = this.listOfYear.value;
    }else{
        reqYear = this.year.value;
    }

    updateTitleMap();
    updateGeom(true);
    updateData(true);
})

//Affichage du fond de carte carte
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.{ext}', {
    subdomains: 'abcd',
    minZoom: 3,
    maxZoom: 20,
    ext: 'png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//Intéraction avec la carte