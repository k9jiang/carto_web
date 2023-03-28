let athletes = [];
let formAthlete = document.getElementById("scroll");
let reqAthlete = "";

//Paramètre de l'url
const currentUrl = new URL(window.location.href);
//currentUrl.searchParams.get("name")

/*Titres */
let mapTitle = document.querySelector(".part-two h2")
let descriptionTitle = document.querySelector(".part-three h2")


function displayAthletes(text = "") {

    formAthlete.innerHTML = "";
    console.log(text);

    if (text === "") {
        for (let athlete of athletes) {
            let inputAthlete = `<div>
            <input type="radio" name="athlete" id="${athlete.name}" value="${athlete.name}">
            <label for="${athlete.name}">${athlete.name}</label>
            </div>`;

            formAthlete.innerHTML += inputAthlete;
        }
    }else {
        for (let athlete of athletes) {
            if (athlete.name.toLowerCase().includes(text.toLowerCase())) {
                let inputAthlete = `<div>
                <input type="radio" name="athlete" id="${athlete.name}" value="${athlete.name}">
                <label for="${athlete.name}">${athlete.name}</label>
            </div>`;

                formAthlete.innerHTML += inputAthlete;
            }
        }
    }
}

function updateTitles(){
    mapTitle.textContent = `Ville où ${reqAthlete} a participé`;
    descriptionTitle.textContent = reqAthlete;
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

    console.log(first_str)

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

$("#search-athlete").keyup(function () {
    const reqAwait = setTimeout(() => displayAthletes(this.value), 1000);
})

$("#chooseAnAthlete").change(function () {
    reqAthlete = reName(this.athlete.value);
    updateTitles();
    //updateMap();
    //updateDescription();
})
