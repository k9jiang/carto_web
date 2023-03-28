let athletes = [];
let scrollAthlete = document.getElementById("scroll");
let formAthlete = document.getElementById("chooseAnAthlete");
let reqAthlete = "";

let map = L.map('map-view').setView([20, 20], 2);

//Paramètre de l'url
const currentUrl = new URL(window.location.href);
//currentUrl.searchParams.get("name")

/*Titres */
let mapTitle = document.querySelector(".part-two h2")
let descriptionTitle = document.querySelector(".part-three h2")


function displayAthletes(text = "") {

    console.log(text);

    scrollAthlete.innerHTML = "";

    if (text === "") {
        for (let athlete of athletes) {
            let reNameAthlete = reName(athlete.name);
            let inputAthlete = `<div>
            <input type="radio" name="athlete" id="${athlete.name}" value="${reNameAthlete}">
            <label for="${athlete.name}">${reNameAthlete}</label>
            </div>`;

            scrollAthlete.innerHTML += inputAthlete;
        }
    }else {
        for (let athlete of athletes) {
            let reNameAthlete = reName(athlete.name);
            if (athlete.name.toLowerCase().includes(text.toLowerCase())) {
                let inputAthlete = `<div>
                <input type="radio" name="athlete" id="${athlete.name}" value="${reNameAthlete}">
                <label for="${athlete.name}">${reNameAthlete}</label>
            </div>`;

                scrollAthlete.innerHTML += inputAthlete;
            }
        }
    }
}

function updateTitles(title){
    mapTitle.textContent = `Ville où ${title} a participé`;
    descriptionTitle.textContent = title;
}

function checks_replaces_if_apostrophe(str){
    let str_replaced = str
    if (str.includes("'")) {
      str_replaced = str.replace("'", "''");
    }
    return str_replaced
}

function reName(str){
    let str_split = str.split(', ');
    let first_str = str_split[0].toLowerCase();
    let first_letter = first_str.charAt(0).toUpperCase();
    first_str = first_letter + first_str.slice(1)

    return [first_str, str_split[1]].join(" ")
}

function updateDescription(result){
    first_res = result[0];
    gold_medals = 0;
    silver_medals = 0;
    bronze_medals = 0;

    if(first_res.gender == "Women"){
        $("#genre span").text("♀ Femme");
    }else{
        $("#genre span").text("♂ Homme");
    }

    $("#country span").text(first_res.name);
    $("#discipline span").text(first_res.discipline);
    
    for (let res of result){
        if(res.medal == "Gold"){
            gold_medals += parseInt(res.medalcount)
        }else if(res.medal == "Silver"){
            silver_medals += parseInt(res.medalcount)
        }else{
            bronze_medals += parseInt(res.medalcount) 
        }
    }
    $("#medals_gain div.gold span").text(gold_medals);
    $("#medals_gain div.silver span").text(silver_medals);
    $("#medals_gain div.bronze span").text(bronze_medals);
    $("#medals_gain p span").text(bronze_medals + silver_medals + gold_medals);
}

fetch("http://localhost:3000/names")
    .then(rep => rep.json())
    .then(res => { 
        for (let i in res) {
            athletes.push(res[i]);

            if(i >= 50){
                break;
            }
        }
        displayAthletes();

})

formAthlete.addEventListener("submit", function(e) {
    e.preventDefault();
    displayAthletes(this.character.value);
})

$("#chooseAnAthlete").change(function (e) {
    reqAthlete = e.target.id;
    updateTitles(this.athlete.value);

    fetch("http://localhost:3000/experience/" + reqAthlete)
    .then(rep => rep.json())
    .then(res => { 
        console.log(res);
        updateDescription(res);
    })
    
    //updateMap();
})

//Affichage du fond de carte carte
L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}{r}.{ext}', {
    subdomains: 'abcd',
    minZoom: 2,
    maxZoom: 20,
    ext: 'png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);