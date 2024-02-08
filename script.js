
let scan1Input = document.getElementById("scan1");
let scan2Input = document.getElementById("scan2");
let scan3Input = document.getElementById("scan3");
let scanInputs = [scan1Input, scan2Input, scan3Input]


scan1Input.addEventListener("keyup", scan1OnEnter)
scan3Input.addEventListener("keyup", isAllEqual)


function scan1OnEnter(event){
    if (event.key === "Enter") {
        scan1Value = scan1Input.value;
        if (isValidLot(scan1Value)) {
            scan1Input.disabled = true;
            scan2Input.focus()
            
         // TODO
        }
    }
}

function isAllEqual(event){
    if (event.key === "Enter") {
        console.log(scan1Input.value == scan2Input.value &&
            scan2Input.value == scan3Input.value);        
    }
}

/**
 * @param {string} value 
 */
function isValidLot(value){
    // only match 8 digit strings
    let regex = /^\d{8}$/
    return regex.test(value)
}
/**
 * @param {Array<HTMLInputElement>} elements 
 */
function isAllSameValue(elements) {
    var output = true
    for (const element of elements){
        output = (element.value == elements[0].value)
    }
    return output
}
function runUnmatchedScanRoutine(){
    scanInputs.map(setRedAndEnable(element))
}
/**
 * @param {HTMLInputElement} element 
 */
function setRedAndEnable(element){
    element.className = "red";
    element.disabled = false;
    return element
}
