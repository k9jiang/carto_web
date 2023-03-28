let athletes = [];
let scrollAthlete = document.getElementById("scroll");
let formAthlete = document.getElementById("chooseAnAthlete");
let reqAthlete = "";

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

function updateDescription(){
    fetch("http://localhost:3000/names/:name")
    .then(rep => rep.json())
    .then(res => { 
        
    })
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

$("#chooseAnAthlete").change(function () {
    reqAthlete = this.athlete.id;
    updateTitles(this.athlete.value);
    //updateMap();
    //updateDescription();
})
