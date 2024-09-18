
// TODO how to assign global variables
// TODO set up with lot number loading

const LOT_TABLE_WEB_APP_BASE_URL = "https://script.google.com/macros/s/AKfycbxItr56E2Q-pgWhYB8yBig1REeoEPjXN3EPSDV6iSn6V09eCX-Q7CXgC5Qp0W3oeykI/exec"
const LOT_TABLE_WEB_APP_LOT_GET_PREFIX = "?lot="
const LOT_TABLE_WEB_APP_UPDATE_GET_COMMAND = "?command=update"

var litersOrLotInput = "";
var numberHBInput = "";
var numberNanoInput = "";
var calcInputs = "";
var numberOfProOutput = "";
var lotTableHandler = Object;

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
    lotTableHandler = new LotTableHandler();
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
        lotTableHandler.refreshAndSetLot(literOrLotInputValue);
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
class LotTableHandler{
    /**
     * 
     * @param {String} lotNumber 
     */
    refreshAndSetLot(lotNumber){
        this.lotNumber = lotNumber;
        this.updateLotTableDataSet();
    };

    getLotTableDataAndBuildTable(){
        var req = new XMLHttpRequest();
        var reqURL = LOT_TABLE_WEB_APP_BASE_URL
         + LOT_TABLE_WEB_APP_LOT_GET_PREFIX
         + this.lotNumber;
        req.open("GET", reqURL);
        req.send();
        req.onload = this.onLotTableLoad;
    }

    async updateLotTableDataSet(){
        //TODO test me
        var req = new XMLHttpRequest();
        var reqURL = LOT_TABLE_WEB_APP_BASE_URL
            + LOT_TABLE_WEB_APP_UPDATE_GET_COMMAND
        req.open("GET", reqURL);
        req.send();
        await sleep(3000) // this may need to increase to allow load to occur
        req.onload = this.getLotTableDataAndBuildTable();
    }

    onLotTableLoad(event){
        console.log(event)
        let xhr = event.currentTarget
        if (xhr.readyState === xhr.DONE) {
            if (xhr.status === 200) {
                var lotTableArray = JSON.parse(xhr.responseText);
                lotTableHandler.updateProPouchInputValues(lotTableArray);
            };
          };
    };
    /**
    * Build the lot table
    * @param {Array} lotTableArray 
    */
    updateProPouchInputValues(lotTableArray){
        var columnHeaders = lotTableArray.shift();
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
    setTableAsLoading(){
        document.getElementById("lotNumberSpan").innerText = "⏳loading⏳";
        document.getElementById("lot_builds_table").classList.add("loading")
        document.getElementById("strainSpan").innerText = "...";
        var rowsToClear = document.getElementsByClassName("dataRow");
        while (rowsToClear[0]){
            rowsToClear[0].remove();
        };
    };
    hideTableDiv(){
        document.getElementById("tableDiv").className = "hidden";
    };
    showTableDiv(){
        document.getElementById("tableDiv").className = "";
    };
    showUpdateButton(){
        document.getElementById("noLotTip").className = "";
    };
    hideUpdateButton(){
        document.getElementById("noLotTip").className = "hidden";
    };
};
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
