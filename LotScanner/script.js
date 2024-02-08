
// TODO how to assign global variables
var scan1Input = ""
var scan2Input = ""
var scan3Input = ""
var scanInputs = ""

document.addEventListener("DOMContentLoaded", () => {
    scan1Input = document.getElementById("scan1");
    scan2Input = document.getElementById("scan2");
    scan3Input = document.getElementById("scan3");
    scanInputs = [scan1Input, scan2Input, scan3Input];
    scan1Input.addEventListener("keyup", scan1OnEnter);
    scan2Input.addEventListener("keyup", scan2OnEnter);
    scan3Input.addEventListener("keyup", scan3OnEnter);
    document.addEventListener("visibilitychange", onTabVisible)
});

function onTabVisible(event){
    if (document.visibilityState == "visible") {
        setFocusFirstInput();
        scanInputs.forEach((element) =>element.value = "");
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
    var alertElement = document.getElementById("alerts");
    alertElement.className = "show"
    alertElement.innerText = message
    setTimeout(function (){alertElement.className = ""}, 2900)
}


function scan1OnEnter(event){
    if (event.key === "Enter") {
        var scan1Value = scan1Input.value;
        if (isValidLot(scan1Value)) {
            scanInputs.forEach(setClassYellowAndEnable)
            scan1Input.disabled = true;
            scan2Input.focus();
        } else {
            runUnmatchedScanRoutine();
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

