const selectYear = document.getElementById("listOfYear");
const spanTitleMap = document.querySelector(".map h2 span");

const firstDiscipline = document.querySelector("input[name='discipline']");
const firstYear = document.querySelector("option[value='2014']");

let reqDiscipline = "disciplines";
let reqYear = "allYears";

let filter;

//Fonctions
function updateTitle(){
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

function updateGeom(){
    if(reqYear == 'allYears'){
        filter = "";
    }else{
        filter = `&CQL_FILTER=first_participation<=${reqYear}%20AND%20last_participation>=${reqYear}`
    }

    //Affichage des pays
    fetch(`http://localhost:8080/geoserver/Carthageo/ows?service=WFS&version=1.0.0&request=GetFeature
    &typeName=Carthageo%3Acountry
    &outputFormat=application%2Fjson
    ${filter}`)
        .then(result => result.json())
        .then(result => {
            L.geoJSON(result).addTo(map);
        })
        .catch(function(error) {
            console.error(error.message);
        });
}


//Valeurs sélectionnées de départ

firstDiscipline.setAttribute("checked", true)
firstYear.setAttribute("selected", true)

//Mise à jour de la carte
updateTitle();
updateGeom();

//Interaction avec les disciplines
$("#chooseADiscipline").change(function(){
    reqDiscipline = this.discipline.value;

    updateTitle();
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

    updateTitle();
    updateGeom();
})

//Affichage du fond de carte carte
var map = L.map('map-view').setView([48.85, 2.09], 3);
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.{ext}', {
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);



