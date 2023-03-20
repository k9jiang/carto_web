const selectYear = document.getElementById("listOfYear");
const spanTitleMap = document.querySelector(".map h2 span");

const firstDiscipline = document.querySelector("input[name='discipline']");
const firstYear = document.querySelector("option[value='2014']");

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


//Valeurs sélectionnées de départ
let reqDiscipline = "disciplines";
let reqYear = "allYears";

firstDiscipline.setAttribute("checked", true)
firstYear.setAttribute("selected", true)

console.log(reqYear + " " + reqDiscipline)

//Titre de la carte
updateTitle();

//Interaction avec les disciplines
$("#chooseADiscipline").change(function(){
    reqDiscipline = this.discipline.value;
    console.log(reqYear + " " + reqDiscipline)

    updateTitle();
})

//Interaction avec les années
$("#chooseAYear").change(function(){
    selectYear.setAttribute("disabled", true);

    if(this.year.value == 'year'){
        selectYear.removeAttribute("disabled");
        reqYear = this.listOfYear.value;

    }else{
        reqYear = this.year.value;
    }
    console.log(reqYear + " " + reqDiscipline)

    updateTitle();
})

