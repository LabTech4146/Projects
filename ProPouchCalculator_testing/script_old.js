
/**
TODO how to assign global variables
show error/success of liter load - no liters produced, lot not found, success
if lot not matched on work ordrs, show error instead of calculating as 0 for hb and nano
*/


const LOT_TABLE_WEB_APP_BASE_URL = "https://script.google.com/macros/s/AKfycbzVybkvVCKGFmzg3eXke0Hv92VhxeqMnHLkwo2Mb95alGtVx9p_vON4sBXO8jZET5ug/exec"
const LOT_DATA_WEB_APP_GET_LITERS_PRODUCED_DATA_URL =LOT_TABLE_WEB_APP_BASE_URL + "?command=getSavedSearchDataById&Id=9756"
const LOT_DATA_WEB_APP_GET_PACK_SIZE_DATA_URL = LOT_TABLE_WEB_APP_BASE_URL + "?command=getSavedSearchDataById&Id=9738"

var litersProducedData = {"columns":["Work Order","Strain","Harvest Date (Mfg Date)","Cell Number","Lot","Liters Produced","Yeast Pack Height (cm)","Trial or Deviation Notes"],"data":[["Work Order #267942","WLP001","09/20/2024","2602","22679420","23.2","4",""],["Work Order #267942","WLP001","09/20/2024","2604","22679421","26.1","4",""],["Work Order #267943","WLP007","09/20/2024","2606","22679430","29.2","6",""],["Work Order #267944","WLP008","09/20/2024","2608","22679440","23.7","10.5",""],["Work Order #267945","WLP029","09/20/2024","2610","22679450","29.5","4.6",""],["Work Order #267945","WLP029","09/20/2024","2612","22679451","27.5","5.3",""],["Work Order #267946","WLP066","09/20/2024","2614","22679460","17.9","6.2",""],["Work Order #267946","WLP066","09/20/2024","2616","22679461","19.5","8",""],["Work Order #267947","WLP077","09/20/2024","2002","22679470","22","5.9",""],["Work Order #267948","WLP090","09/20/2024","2004","22679480","18.9","4",""],["Work Order #267948","WLP090","09/20/2024","2006","22679481","18.8","3.5",""],["Work Order #267949","WLP300","09/20/2024","2008","22679490","18.7","5.5",""],["Work Order #267950","WLP400","09/20/2024","2010","22679500","9.4","2.4",""],["Work Order #267950","WLP400","09/20/2024","2012","22679501","9.5","3",""],["Work Order #267951","WLP500","09/20/2024","2014","22679510","19.5","2.3",""],["Work Order #267952","WLP740","09/20/2024","2016","22679520","22.6","5.3",""],["Work Order #267953","WLP800","09/20/2024","2018","22679530","20","4.7",""],["Work Order #267954","WLP830","09/20/2024","2020","22679540","16.5","3.5",""],["Work Order #267955","WLP840","09/20/2024","2022","22679550","26.5","4.2",""]]}

var litersOrLotInput = document.getElementById("liters_or_lot");
var numberHBInput = document.getElementById("numberHB");
var numberNanoInput = document.getElementById("numberNano");
var numberOfProOutput = document.getElementById("numberPro");
var notificationOutput = document.getElementById("notification")
var calcInputs = [litersOrLotInput, numberHBInput, numberNanoInput];
var harvestDataHandler = Object;
var lastUpdateDateime = new Date(1995, 0, 1)

document.addEventListener("DOMContentLoaded", () => {
  //  litersOrLotInput = document.getElementById("liters_or_lot");
    
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
    notificationOutput.value = "";
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
    notificationOutput.value = "";
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
        this.setPageToLoadingState();
        this.getLitersProducedData();
    };

    async getLitersProducedData(){
        var req = new XMLHttpRequest();
        var reqURL = LOT_DATA_WEB_APP_GET_LITERS_PRODUCED_DATA_URL
        req.open("GET", reqURL);
        req.send();
        //await sleep(3000) // this may need to increase to allow load to occur 
        req.onload = this.onLitersProducedLoad;
    }

    onLitersProducedLoad(event){
        let xhr = event.currentTarget
        if (xhr.readyState === xhr.DONE) {
            if (xhr.status === 200) {
                var lotTableArray = JSON.parse(xhr.responseText);
                harvestDataHandler.getLitersProducedFromTable(lotTableArray);
            };
          };
    };

    /**
    * Build the lot table
    * @param {{columns: string[]; data: string[][]}} lotTableArray 
    */
    getLitersProducedFromTable(lotTableArray){
        console.log(lotTableArray)
        var columnHeaders = lotTableArray.columns;
        var data = lotTableArray.data;
        var lotIndex = columnHeaders.indexOf("lot"); 
        var litersProducedIndex = columnHeaders.indexOf("liters_produced");
        var lotRows = data.filter((x)=> x[lotIndex] == this.lotNumber);
        if (lotRows.length > 0)
            {var lotRow = lotRows[0];
            } else {
                //TODO create error reporting and clear inputs
                this.setPageToLoadedState();
                return;
            };
        var litersProduced = parseFloat(lotRow[litersProducedIndex]);
        this.litersProduced = litersProduced;
        var hoursSinceLastUpdate = (Date.now() - lastUpdateDateime)/1000/60/60
        if( hoursSinceLastUpdate > 1){
            console.log(hoursSinceLastUpdate)
            this.getWorkOrdersData();
        } else{
            this.getPackSizesFromTableData();
        }
        
        
    };
    
    async getWorkOrdersData(){
        var req = new XMLHttpRequest();
        var reqURL = LOT_DATA_WEB_APP_GET_PACK_SIZE_DATA_URL
        req.open("GET", reqURL);
        req.send();
        //await sleep(3000) // this may need to increase to allow load to occur 
        req.onload = this.onWorkOrdersLoad;
    }

    onWorkOrdersLoad(event){
        let xhr = event.currentTarget
        if (xhr.readyState === xhr.DONE) {
            if (xhr.status === 200) {
                lastUpdateDateime = Date.now();
                var lotTableArray = JSON.parse(xhr.responseText);
                harvestDataHandler.packSizeTableData = lotTableArray;
                harvestDataHandler.getPackSizesFromTableData();
            };
          };
    };
    
    getPackSizesFromTableData(){
        /**
    * Build the lot table
    * @type {{columns: string[]; data: string[][]}} lotTableArray 
    */
        var lotTableArray = this.packSizeTableData;
        var columnHeaders = lotTableArray.columns;
        var data = lotTableArray.data;
        var lotIndex = columnHeaders.indexOf("lot"); 
        var quantityIndex = columnHeaders.indexOf("quantity");
        var itemNameIndex = columnHeaders.indexOf("item_name");
        var lotRows = data.filter((x)=> x[lotIndex] == this.lotNumber);
        this.numHB = 0;
        this.numNano = 0;
        for (var lotRow of lotRows){
            var itemName = lotRow[itemNameIndex];
            if (itemName.endsWith("Nano")){this.numNano = parseInt(lotRow[quantityIndex])}
            else if (itemName.endsWith("HB")){this.numHB = parseInt(lotRow[quantityIndex])}
        };
        this.calculateProPouches();
        this.setPageToLoadedState();
    };

    calculateProPouches(){
        this.numPro = Math.floor((this.litersProduced - (this.numHB * 0.07) - (this.numNano * 0.35))/1.75)
        litersOrLotInput.value = this.litersProduced
        numberHBInput.value = this.numHB
        numberNanoInput.value = this.numNano
        numberOfProOutput.value = this.numPro
        notificationOUtput.value = `Lot#${this.lotNumber}`
    };

    setPageToLoadingState(){
        for(var input of calcInputs){
            input.setAttribute("class", "loading");
            input.value = "loading...";
        };
    };
    setPageToLoadedState(){
        for(var input of calcInputs){
            input.setAttribute("class", "pending");
        }
        numberOfProOutput.setAttribute("class", "green")
    }


};
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
