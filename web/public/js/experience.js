let athletes = [];
let formAthlete = document.getElementById("scroll");


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

fetch("http://localhost:3000/athletes/?country=allCountries&discipline=disciplines&year=allYears")
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
    const reqAwait = setTimeout(() => displayAthletes(this.value), 1500);
})

function checks_replaces_if_apostrophe(str){
    let str_replaced = str
    if (str.includes("'")) {
      str_replaced = str.replace("'", "''");
    }
    return str_replaced
  }

console.log(checks_replaces_if_apostrophe("j'ai ri"));
console.log(checks_replaces_if_apostrophe("bonjour"));
