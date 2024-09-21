
// TODO how to assign global variables
// TODO set up with lot number loading

const LOT_TABLE_WEB_APP_BASE_URL = "https://script.google.com/macros/u/1/s/AKfycbxItr56E2Q-pgWhYB8yBig1REeoEPjXN3EPSDV6iSn6V09eCX-Q7CXgC5Qp0W3oeykI/exec"
const LOT_TABLE_WEB_APP_LOT_GET_PREFIX = "?lot="
const LOT_DATA_WEB_APP_GET_COMMAND = "?command=getSavedSearchDataById&Id=10090"
const LOT_DATA_WEB_APP_GET_HARVEST_DATA_COMMAND = LOT_TABLE_WEB_APP_BASE_URL + LOT_DATA_WEB_APP_GET_COMMAND


var testData = {"columns":["Work Order","Strain","Harvest Date (Mfg Date)","Cell Number","Lot","Liters Produced","Yeast Pack Height (cm)","Trial or Deviation Notes"],"data":[["Work Order #267942","WLP001","09/20/2024","2602","22679420","23.2","4",""],["Work Order #267942","WLP001","09/20/2024","2604","22679421","26.1","4",""],["Work Order #267943","WLP007","09/20/2024","2606","22679430","29.2","6",""],["Work Order #267944","WLP008","09/20/2024","2608","22679440","23.7","10.5",""],["Work Order #267945","WLP029","09/20/2024","2610","22679450","29.5","4.6",""],["Work Order #267945","WLP029","09/20/2024","2612","22679451","27.5","5.3",""],["Work Order #267946","WLP066","09/20/2024","2614","22679460","17.9","6.2",""],["Work Order #267946","WLP066","09/20/2024","2616","22679461","19.5","8",""],["Work Order #267947","WLP077","09/20/2024","2002","22679470","22","5.9",""],["Work Order #267948","WLP090","09/20/2024","2004","22679480","18.9","4",""],["Work Order #267948","WLP090","09/20/2024","2006","22679481","18.8","3.5",""],["Work Order #267949","WLP300","09/20/2024","2008","22679490","18.7","5.5",""],["Work Order #267950","WLP400","09/20/2024","2010","22679500","9.4","2.4",""],["Work Order #267950","WLP400","09/20/2024","2012","22679501","9.5","3",""],["Work Order #267951","WLP500","09/20/2024","2014","22679510","19.5","2.3",""],["Work Order #267952","WLP740","09/20/2024","2016","22679520","22.6","5.3",""],["Work Order #267953","WLP800","09/20/2024","2018","22679530","20","4.7",""],["Work Order #267954","WLP830","09/20/2024","2020","22679540","16.5","3.5",""],["Work Order #267955","WLP840","09/20/2024","2022","22679550","26.5","4.2",""]]}

var litersOrLotInput = "";
var numberHBInput = "";
var numberNanoInput = "";
var calcInputs = "";
var numberOfProOutput = "";
var harvestDataHandler = Object;

document.addEventListener("DOMContentLoaded", () => {
    litersOrLotInput = document.getElementById("liters_or_lot");
    numberHBInput = document.getElementById("numberHB");
    numberNanoInput = document.getElementById("numberNano");
    numberOfProOutput = document.getElementById("numberPro");
    calcInputs = [litersOrLotInput, numberHBInput, numberNanoInput];
    litersOrLotInput.addEventListener("keyup", processLitersOrLotInput);
    numberHBInput.addEventListener("keyup", calculateProPouches);
    numberNanoInput.addEventListener("keyup", calculateProPouches);
    document.addEventListener("visibilitychange", onTabVisible);
    harvestDataHandler = new HarvestDataHandler();
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
    litersOrLotInput.focus()
    litersOrLotInput.select()
};
function showAlertMessage(message){
    alert(message);
}
function calculateProPouches(event){
    //floor("liters produced"-("number of HB"x0.07)-("number of Nano"x0.35))/1.75)
    var litersProduced = parseFloat(litersOrLotInput.value);
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
function processLitersOrLotInput(event){
    var literOrLotInputValue = litersOrLotInput.value;
    if (isValidLot(literOrLotInputValue)){
        harvestDataHandler.refreshAndSetLot(literOrLotInputValue);
    }
}
/**
 * @param {string} value 
 */
function isValidLot(value){
    // only match 8 digit strings
    var regex = /^\d{8}$/;
    var result = regex.test(value);
    return result;
};
class HarvestDataHandler{
    /**
     * 
     * @param {String} lotNumber 
     */
    refreshAndSetLot(lotNumber){
        this.lotNumber = lotNumber;
        this.getSavedSearchData();
    };

    async getSavedSearchData(){
        //TODO test me
        var req = new XMLHttpRequest();
        var reqURL = LOT_DATA_WEB_APP_GET_HARVEST_DATA_COMMAND
        req.open("GET", reqURL);
        req.send();
        await sleep(3000) // this may need to increase to allow load to occur
        req.onload = this.onLotTableLoad(event);
    }

    onLotTableLoad(event){
        console.log(event)
        let xhr = event.currentTarget
        if (xhr.readyState === xhr.DONE) {
            if (xhr.status === 200) {
                var lotTableArray = JSON.parse(xhr.responseText);
                harvestDataHandler.updateProPouchInputValues(lotTableArray);
            };
          };
    };
    /**
    * Build the lot table
    * @param {Array} lotTableArray 
    */
    updateProPouchInputValues(lotTableArray){
        var columnHeaders = lotTableArray.columns;
        var quantityIndex = columnHeaders.indexOf("quantity"); 
        var sizeIndex = columnHeaders.indexOf("size");
        var litersProducedIndex = columnHeaders.indexOf("liters_produced")
        var litersProduced = parseFloat(lotTableArray[0][litersProducedIndex])
        this.calculateProPouches(lotTableArray, sizeIndex, quantityIndex, litersProduced)
    };
    /** 
     * @param {Array[]} lotTableArray
     * @param {Number} litersProduced 
     * @param {Number} quantityIndex 
     * @param {Number} sizeIndex 
     * @return {Number}
      */
    calculateProPouches(lotTableArray, sizeIndex, quantityIndex, litersProduced){
        let hbData = lotTableArray.find((x) => x[sizeIndex] == "Homebrew");
        let nanoData = lotTableArray.find((x) => x[sizeIndex] == "Nano");
        var numNano = 0;
        var numHB = 0;
        if (hbData) {numHB = hbData[quantityIndex]};
        if (nanoData) {numNano = nanoData[quantityIndex]};
        let numPro = Math.floor((litersProduced - (numHB * 0.07) - (numNano * 0.35))/1.75)
        numberHBInput.value = numHB
        numberNanoInput.value = numNano
        numberOfProOutput.value = numPro
    }
};
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
