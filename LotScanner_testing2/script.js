
// TODO how to assign global variables
const LOT_TABLE_WEB_APP_BASE_URL = "https://script.google.com/macros/s/AKfycbxItr56E2Q-pgWhYB8yBig1REeoEPjXN3EPSDV6iSn6V09eCX-Q7CXgC5Qp0W3oeykI/exec"
const LOT_TABLE_WEB_APP_LOT_GET_PREFIX = "?lot="
const LOT_TABLE_WEB_APP_UPDATE_GET_COMMAND = "?command=update"

/**
 * @type {HTMLInputElement}
 */
var scan1Input = ""
var scan2Input = ""
var scan3Input = ""
var scanInputs = ""
var lotTableHandler = Object;


document.addEventListener("DOMContentLoaded", () => {
    scan1Input = document.getElementById("scan1");
    scan2Input = document.getElementById("scan2");
    scan3Input = document.getElementById("scan3");
    scanInputs = [scan1Input, scan2Input, scan3Input];
    scan1Input.addEventListener("keyup", scan1OnEnter);
    scan2Input.addEventListener("keyup", scan2OnEnter);
    scan3Input.addEventListener("keyup", scan3OnEnter);
    document.addEventListener("visibilitychange", onTabVisible)
    lotTableHandler = new LotTableHandler();
    onTabVisible();
});

function onTabVisible(event){
    if (document.visibilityState == "visible") {
        scanInputs.forEach((element) => {
            element.value = "";
            element.disabled = false;
            element.setAttribute("class", "")
        });
        setFocusFirstInput();
    };
};
function isAllEqual(event){
    if (event.key === "Enter") {
        console.log(scan1Input.value == scan2Input.value &&
            scan2Input.value == scan3Input.value);        
    };
};
/**
 * @param {string} value 
 */
function isValidLot(value){
    // only match 8 digit strings
    var regex = /^\d{8}$/;
    var result = regex.test(value);
    if(!result) {showAlertMessage("Invalid Lot Number, must be 8 digits");};
    return result;
};
/**
 * @param {Array<HTMLInputElement>} elements 
 */
function isAllSameValue(elements) {
    var output = true;
    for (const element of elements){
        output = (element.value == elements[0].value);
    };
    return output;
};
function runUnmatchedScanRoutine(){
    scanInputs.forEach(setClassRedClearAndEnable);
    setFocusFirstInput();
};
function runMatchedScanRoutine(){
    scanInputs.forEach(setClassGreenClearAndEnable);
    setFocusFirstInput();
};
/**
 * @param {HTMLInputElement} element 
 */
function setClassRedClearAndEnable(element){
    element.className = "red";
    element.disabled = false;
    element.value = "";
    return element;
};
/**
 * @param {HTMLInputElement} element 
 */
function setClassGreenClearAndEnable(element){
    element.className = "green";
    element.disabled = false;
    element.value = ""
    return element;
};
/**
 * @param {HTMLInputElement} element 
 */
function setClassYellowAndEnable(element){
    element.className = "yellow";
    element.disabled = false;
    return element;
};
function setFocusFirstInput(){
    scan1Input.focus()
    scan1Input.select()
};

function showAlertMessage(message){
    alert(message);
}
function setMascotImageSource(path){
    document.getElementById("scanmascot").setAttribute("src", path);
}

function scan1OnEnter(event){
    if (event.key === "Enter") {
        var scan1Value = scan1Input.value.trim();
        if (isValidLot(scan1Value)) {
            var lot = scan1Value;
            lotTableHandler.setLot(lot);
            lotTableHandler.getLotTableDataAndBuildTable();
            scanInputs.forEach(setClassYellowAndEnable);
            scan1Input.disabled = true;
            scan2Input.focus();
        } else {
            runUnmatchedScanRoutine();
            lotTableHandler.hideTable();
        };
    };
};
function scan2OnEnter(event){
    if (event.key === "Enter"){
        var currentScans = [scan1Input, scan2Input];
        if (isAllSameValue(currentScans)){
            scan2Input.disabled = true;
            scan3Input.focus();
        } else {
            runUnmatchedScanRoutine();
        };
    };
};
function scan3OnEnter(event){
    if (event.key === "Enter") {
        if (isAllSameValue(scanInputs)){
            runMatchedScanRoutine();
        } else {
            runUnmatchedScanRoutine();
        };
    };
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateSheetData(){
    lotTableHandler.updateLotTableDataSet();
}

class LotTableHandler{
    /**
     * 
     * @param {String} lotNumber 
     */
    setLot(lotNumber){
        this.lotNumber = lotNumber;
    };

    getLotTableDataAndBuildTable(){
        this.setTableAsLoading();
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
                lotTableHandler.buildLotTableHTML(lotTableArray);
            };
          };
        document.getElementById("lot_builds_table").classList.remove("loading");
    };
    /**
    * Build the lot table
    * @param {Array} lotTableArray 
    */
    buildLotTableHTML(lotTableArray){
        document.getElementById("lotNumberSpan").innerText = this.lotNumber;
        var columnHeaders = lotTableArray.shift();
        var quantityIndex = columnHeaders.indexOf("quantity"); 
        var sizeIndex = columnHeaders.indexOf("size");
        var strainIndex = columnHeaders.indexOf("strain");
        var litersProducedIndex = columnHeaders.indexOf("liters_produced")
        var table = document.getElementById("lot_builds_table");
        if (lotTableArray.length > 0) {
            // results for lot, build rows for each result
            var strain = lotTableArray[0][strainIndex];
            this.hideUpdateButton();
            document.getElementById("strainSpan").innerText = strain;
            for (var dataRow of lotTableArray){
                var sizeName = dataRow[sizeIndex];
                var quantity = dataRow[quantityIndex];
                var litersProduced = dataRow[litersProducedIndex];
                var tr = table.insertRow();
                tr.className = "dataRow"
                var td = tr.insertCell();
                td.appendChild(document.createTextNode(sizeName))
                td = tr.insertCell();
                if (sizeName == "Pro"){
                    if (litersProduced){
                        let numPro = this.calculateProPouches(lotTableArray, sizeIndex, quantityIndex, litersProduced);
                        td.appendChild(document.createTextNode(numPro));
                    } else {
                        td.appendChild(document.createTextNode("No liters produced data for this lot."));
                        this.showUpdateButton();                        
                    }
                } else {
                td.appendChild(document.createTextNode(quantity))
                };
            };
        }
        else if (lotTableArray.length == 0) {
            // no results for this lot
            var tr = table.insertRow();
            tr.className = "dataRow"
            var td = tr.insertCell();
            td.setAttribute("colspan", 2)
            td.appendChild(document.createTextNode("No results for this lot"))
            this.showUpdateButton();
        };
        this.showTableDiv();
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
        return numPro
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
