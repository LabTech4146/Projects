async function printLabel(){
    let e = document.getElementById("print-status");
    let printButton = document.getElementById("print-button");
    e.textContent = "Queued";
    printButton.disabled = true;
    await sleep(2000);
    e.textContent = "Processing";
    await sleep(1000);
    e.textContent = "Complete";
    printButton.disabled = false;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}