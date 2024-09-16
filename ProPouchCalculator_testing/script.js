
// TODO how to assign global variables
// TODO set up with lot number loading

const LOT_TABLE_WEB_APP_BASE_URL = "https://script.google.com/macros/s/AKfycbxItr56E2Q-pgWhYB8yBig1REeoEPjXN3EPSDV6iSn6V09eCX-Q7CXgC5Qp0W3oeykI/exec"
const LOT_TABLE_WEB_APP_LOT_GET_PREFIX = "?lot="
const LOT_TABLE_WEB_APP_UPDATE_GET_COMMAND = "?command=update"

var litersProducedInput = "";
var numberHBInput = "";
var numberNanoInput = "";
var calcInputs = "";
var numberOfProOutput = "";

document.addEventListener("DOMContentLoaded", () => {
    litersProducedInput = document.getElementById("litersProduced");
    numberHBInput = document.getElementById("numberHB");
    numberNanoInput = document.getElementById("numberNano");
    numberOfProOutput = document.getElementById("numberPro");
    calcInputs = [litersProducedInput, numberHBInput, numberNanoInput];
    litersProducedInput.addEventListener("keyup", calculateProPouches);
    numberHBInput.addEventListener("keyup", calculateProPouches);
    numberNanoInput.addEventListener("keyup", calculateProPouches);
    document.addEventListener("visibilitychange", onTabVisible)
});

function onTabVisible(event){
    if (document.visibilityState == "visible") {
        calcInputs.forEach((element) => {
            element.value = "";
            element.disabled = false;
            element.setAttribute("class", "")
        });
        setFocusFirstInput();
    };
};
function setFocusFirstInput(){
    litersProducedInput.focus()
    litersProducedInput.select()
};
function showAlertMessage(message){
    alert(message);
}
function calculateProPouches(event){
    //floor("liters produced"-("number of HB"x0.07)-("number of Nano"x0.35))/1.75)
    var litersProduced = parseFloat(litersProducedInput.value);
    var numberOfHomebrew = parseInt(numberHBInput.value);
    var numberOfNano = parseInt(numberNanoInput.value);
    var numberOfPro = Math.floor((litersProduced - (numberOfHomebrew * .07)-(numberOfNano * .35))/1.75);
    numberOfProOutput.value = numberOfPro;
    if(isNaN(numberOfPro)){
        numberOfProOutput.setAttribute("class", "red");        
    } else if(numberOfPro < 0){
        numberOfProOutput.setAttribute("class", "red small");        
        numberOfProOutput.value = "Not enough liters to make nano and hb"
    }
    else{numberOfProOutput.setAttribute("class", "green")}
};
