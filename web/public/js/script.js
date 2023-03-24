const selectYear = document.getElementById("listOfYear");
const spanTitleMap = document.querySelector(".map h2 span");

const inputEnterDiscipline = document.getElementById("search-discipline");
const formDiscipline = document.querySelector("#chooseADiscipline fieldset");

const firstDiscipline = document.querySelector("input[name='discipline']");
const firstYear = document.querySelector("option[value='2014']");

let disciplines = [];

let reqDiscipline = "disciplines";
let reqYear = "allYears";
let reqCountry = "allCountries";

let group;
let circles_group = L.featureGroup(); //initializing circles group

let filter;
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
let spanTitleNoGraph2 = document.querySelector('.statistics-athlete .nodata h2 span');
let pct_best_athlete = document.querySelector('.statistics-athlete .percentage');
let pct_best_country = document.querySelector('.statistics-country .percentage');
let x_first_athletes = document.querySelector('.statistics-athlete .title .key-figure p span');
let x_first_countries = document.querySelector('.statistics-country .title .key-figure p span');

//Fonctions
function breaking_gap(array){
    gaps = []
    for (let i = 0 ; i < array.length -1 ; i++){
        gaps.push(array[i]-array[i+1]);
    }
    console.log(gaps);
    let avg_gap = (gaps.reduce((accum, b) => accum + b) / gaps.length).toFixed(20);
    console.log(avg_gap);
    for (i in gaps) {
        if (gaps[i] > 2*avg_gap) { //setting a breaking gap if a gap is higher than twice the average gap
            console.log(i);
            return i;
        }
    }
    return gaps.length;
}
function updateTitleMap(){
    if(reqYear == "allYears"){
        spanTitleMap.textContent = "de 1886 à 2014"
    } else {
        spanTitleMap.textContent = ` en ${reqYear}`
    }

    if (reqDiscipline == "disciplines") {
        spanTitleMap.textContent += " dans toutes les disciplines"
    } else {
        spanTitleMap.textContent += ` en ${reqDiscipline}`
    }
}


function getRadius(value) { //returns real proportionnal circles according to the represented value
    let v_min = 1;
    let r_min;
    if ((reqDiscipline != 'discipline' && reqYear !='allYears')) {
        r_min = 5;
    }
    else {
        r_min = 0.75; //setting a tinier min radius if we get all of both disciplines and editions of olympics.
    }
    return r_min * Math.sqrt(value / v_min);
}


function updateMedals(json_query){
    fetch('http://localhost:8080/geoserver/Carthageo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=olympics%3Acentroids&outputFormat=application%2Fjson')
    .then(result => result.json())
    .then(function(centroids) {
        //console.log(centroids.features[0].geometry.coordinates);
        circles_group.clearLayers() //clears circles features at the beginning of each change
        for (centroid of centroids.features) {
            let lnglat = centroid.geometry.coordinates;
            let latlng = [lnglat[1], lnglat[0]];
            let medals;
            for (country of json_query) {
                if (country.name == centroid.properties.name) {
                    medals = country.medalcount
                    //console.log(medals, country.name, centroid.properties.name);
                    let circle_prop;
                    circle_prop = L.circleMarker(latlng, {radius : getRadius(medals), color : '#8C731F', fillColor : '#FFFD00',fillOpacity : 1, country: country.name})
                        .addTo(circles_group)//adding each circle of each country to the group
                }
            }
            //console.log(circles_group);
            circles_group
                .on("click", (e) => { updateCountry(e.layer.options.country) })
                .addTo(map); //displaying features group in the map
        }
    })
}

function updateCountry(countryName) {
    reqCountry = countryName;
    spanTitleGraph2[1].textContent = "de " + reqCountry;
    updateAthletesData(reqCountry, reqDiscipline, reqYear);

}

function updateGeom(replace = false) {
    if (reqYear == 'allYears') {
        filter = "";
    } else {
        filter = `&CQL_FILTER=first_participation<=${reqYear}%20AND%20last_participation>=${reqYear}`;
    }
    const url = "http://localhost:8080/geoserver/Carthageo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=olympics%3Acountry&outputFormat=application%2Fjson"
              + filter;
    //Affichage des pays
    fetch(url)
        .then(result => result.json())
        .then(result => {
            console.log(result);
            if (replace) {
                group.clearLayers();
            }
            group = L.geoJSON(result).bindPopup(function (layer) {
                updateCountry(layer.feature.properties.name);
                return reqCountry;
            }).addTo(map);
            updateCountryData();
        })
        .catch(function (error) {
            console.error(error);
        });
}

//Affichage des graphiques
function updateGraph(result, graphic) {
    let name = [];
    let medalcount = [];
    let total_medals = 0;
    let medals=[]

    for (let i in result) {
        name.push(result[i].name);
        medalcount.push(result[i].medalcount);

        if (i >= 9) {
            break;
        }
    }

    for (entity of result) {
        total_medals += parseInt(entity.medalcount);
        if (entity.medalcount != 0) {
            medals.push(entity.medalcount);
        }
    }
    break_index = breaking_gap(medals);
    let gathered_medals = 0;
    for (i in medals) {
        gathered_medals += parseInt(medals[i]);
        if (i == break_index) {
            break;
        }
    }
    console.log(gathered_medals);
    console.log(total_medals);
    let ratio = (gathered_medals*100/total_medals).toFixed(2)


    //let ratio = parseFloat(parseInt(medalcount[0])*100/total_medals).toFixed(2);
    //console.log(ratio);

    if (graphic == graphAthlete) {
        pct_best_athlete.textContent = ratio+"%";
        x_first_athletes.textContent = `${break_index+1}`;
    }
    else {
        pct_best_country.textContent = ratio+"%";
        x_first_countries.textContent = `${break_index+1}`;
    }

    const chart = new Chart(graphic, {
        type: 'bar',
        data: {
            labels: name,
            datasets: [{
                name: name,
                label: 'Nombre de médaille(s) remportée(s)',
                data: medalcount,
                barThickness: 8
            }]
        },
        options: {
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
            onClick: (e) => {
                const canvasPosition = Chart.helpers.getRelativePosition(e, chart);
    
                // Substitute the appropriate scale IDs
                const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
                const dataY = chart.scales.y.getValueForPixel(canvasPosition.y);
                let value = name[dataX];

                if (graphic == graphAthlete) {
                }
                else {
                    updateCountry(value)
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
            if (athletesChart) {
                athletesChart.destroy();
            }

            if (res.length == 0) {
                noDataAthlete.style.display = "block";
                if (reqCountry == "allCountries") {
                    spanTitleNoGraph2.textContent = "monde";
                } else {
                    spanTitleNoGraph2.textContent = reqCountry;
                }
            }else{
                if(res.length < 20){
                    spanTitleGraph2[0].textContent = `${res.length} meilleurs`;
                }else{
                    spanTitleGraph2[0].textContent = "20 meilleurs";
                }
                noDataAthlete.style.display = "none";
                athletesChart = updateGraph(res, graphAthlete);
            }
            //updateGraph(res, graphAthlete)
        })
}


function updateCountryData() {
    fetch("http://localhost:3000/data", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "discipline": reqDiscipline, "year": reqYear })
    })
        .then(result => result.json())
        .then(result => {
            //console.log(result);
            updateMedals(result);
            //Mise à jour de la visualistion
            if (countriesChart) {
                countriesChart.destroy();
            }
            if (result.length == 0) {
                noDataCountries.style.display = "block";
            } else {
                if (result.length < 10) {
                    spanTitleGraph.textContent = "premiers";
                } else {
                    spanTitleGraph.textContent = "10 premiers";
                }
                noDataCountries.style.display = "none";
                countriesChart = updateGraph(result, graphCountries)
            }
            //updateGraph(result, graphCountries);
        })
}

function displayDisciplines(text = "") {

    formDiscipline.innerHTML = "";

    if (text === "") {
        firstDiscipline.setAttribute("checked", true)

        for (let discipline of disciplines) {
            let inputDiscipline = `<div>
            <input type="radio" name="discipline" id="${discipline}" value="${discipline}">
            <label for="${discipline}">${discipline}</label>
            </div>`;

            formDiscipline.innerHTML += inputDiscipline;
        }
    } else {
        for (let discipline of disciplines) {
            if (discipline.toLowerCase().includes(text.toLowerCase())) {
                let inputDiscipline = `<div>
                <input type="radio" name="discipline" id="${discipline}" value="${discipline}">
                <label for="${discipline}">${discipline}</label>
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
updateAthletesData(reqCountry, reqDiscipline, reqYear);
//updateCountryData();

//Interaction avec les disciplines
fetch("http://localhost:3000/disciplines")
    .then(rep => rep.json())
    .then(res => {
        for (let discipline of res) {
            disciplines.push(discipline.discipline);
        }
        displayDisciplines();
    })

$("#search-discipline").keyup(function () {
    console.log(this.value);
    displayDisciplines(this.value);
})

$("#chooseADiscipline").change(function () {
    reqDiscipline = this.discipline.value;
    updateTitleMap();
    updateCountryData();
    updateAthletesData(reqCountry, reqDiscipline, reqYear);
})

//Interaction avec les années
$("#chooseAYear").change(function () {
    selectYear.setAttribute("disabled", true);

    //Si une année est sélectionnée
    if (this.year.value == 'year') {
        selectYear.removeAttribute("disabled");
        reqYear = this.listOfYear.value;
    } else {
        reqYear = this.year.value;
    }

    updateTitleMap();
    updateGeom(true);
    updateAthletesData(reqCountry, reqDiscipline, reqYear);
})

//Affichage du fond de carte carte
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.{ext}', {
    subdomains: 'abcd',
    minZoom: 2,
    maxZoom: 20,
    ext: 'png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//Intéraction avec la carte