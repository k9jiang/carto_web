console.log("ok")

function checks_replaces_if_apostrophe(str){
    let str_replaced = str
    if (str.includes("'")) {
      str_replaced = str.replace("'", "''");
    }
    return str_replaced
  }

console.log(checks_replaces_if_apostrophe("j'ai ri"));
console.log(checks_replaces_if_apostrophe("bonjour"));