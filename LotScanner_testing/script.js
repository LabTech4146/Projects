import packSizeHandler from "./packsizehandler.js"

/**
 * @type {HTMLInputElement}
 */
var scan1Input = "";
var scan2Input = "";
var scan3Input = "";
var scanInputs = "";
var successAudio = new Audio("success.mp3");
var failAudio = new Audio("fail.mp3");
var lotTableHandler = Object
window.packSizeHandler = packSizeHandler;


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
    setInterval(androidScanFocusFix, 500)
});

function androidScanFocusFix(){
    if (!scan1Input.disabled){
        scan1Input.blur();
        scan1Input.focus();
    }
}

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
    failAudio.play();
    setFocusFirstInput();
};
function runMatchedScanRoutine(){
    scanInputs.forEach(setClassGreenClearAndEnable);
    setFocusFirstInput();
    successAudio.play();
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
    scan1Input.blur()
    scan1Input.focus()
};

function showAlertMessage(message){
    alert(message);
}
function setMascotImageSource(path){
    document.getElementById("scanmascot").setAttribute("src", path);
}

function scan1OnEnter(event){
    if (event.key === "Enter") {
        var scan1Value = scan1Input.value;
        if (isValidLot(scan1Value)) {
            var lot = scan1Value;
            lotTableHandler.setLot(lot);
            lotTableHandler.getLotTableDataAndBuildTable();
            scanInputs.forEach(setClassYellowAndEnable);
            scan1Input.disabled = true;
            scan2Input.focus();
        } else {
            runUnmatchedScanRoutine();
            lotTableHandler.hideTableDiv();
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

class LotTableHandler{
    /**
     * 
     * @param {String} lotNumber 
     */
    setLot(lotNumber){
        this.lotNumber = lotNumber;
    };

    async getLotTableDataAndBuildTable(){
        try {
            this.setTableAsLoading();
            this.showTableDiv();
            this.lot_table_data = await packSizeHandler.get_table_variables_from_lot(this.lotNumber);    
            this.onLotTableDataReceived();

        } catch (error) {
            // error with lot
            this.setTableError(error);
            this.setTableAsLoaded();
        };
    };

    onLotTableDataReceived(){
        lotTableHandler.buildLotTableHTML(this.lot_table_data);
        this.setTableAsLoaded();
    };
    /**
    * Build the lot table
    */
    buildLotTableHTML(){
        document.getElementById("lotNumberSpan").innerText = this.lotNumber;
        var table = document.getElementById("lot_builds_table");
        var lotTableData = this.lot_table_data
        if (typeof lotTableData.strain  !== "undefined") {
            // results for lot, build rows for each pack size
            var strain = lotTableData.strain;
            this.hideUpdateButton();
            document.getElementById("strainSpan").innerText = strain;
            var keyNameLookup = {num_hb: "HB", num_nano: "Nano", num_pro: "Pro"}
            for (var key in lotTableData){
                if (Object.keys(keyNameLookup).includes(key)){
                    
                    var sizeName = keyNameLookup[key];
                    var quantity = lotTableData[key];    
                    if (quantity > 0) {

                        var tr = table.insertRow();
                        tr.className = "dataRow";
                        var td = tr.insertCell();
                        td.appendChild(document.createTextNode(sizeName));
                        td = tr.insertCell();
                        td.appendChild(document.createTextNode(quantity));
    
                    };
    
                };
            };
        } else {
            // no results for this lot
            this.setTableError("No results for this lot.")
        };
        this.showTableDiv();
    };
    setTableError(errorText){
        var table = document.getElementById("lot_builds_table");
        var tr = table.insertRow();
        tr.className = "dataRow"
        var td = tr.insertCell();
        td.setAttribute("colspan", 2)
        td.appendChild(document.createTextNode(errorText))
        this.showUpdateButton();
    }

    setTableAsLoading(){
        document.getElementById("lotNumberSpan").innerText = this.lotNumber;
        document.getElementById("lot_builds_table").classList.add("loading")
        document.getElementById("strainSpan").innerText = "⏳loading⏳";
        var rowsToClear = document.getElementsByClassName("dataRow");
        while (rowsToClear[0]){
            rowsToClear[0].remove();
        };
        this.showTableDiv();
    };
    setTableAsLoaded(){
        document.getElementById("lot_builds_table").classList.remove("loading");
        let strainText = document.getElementById("strainSpan").innerText
        if (strainText === "⏳loading⏳"){
            document.getElementById("strainSpan").innerText = "..."
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
