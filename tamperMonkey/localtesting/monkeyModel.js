// ==UserScript==
// @name         Local Testing
// @namespace    http://tampermonkey.net/
// @version      2025-05-28b
// @description  Provide label printing enhancements.
// @author       You
// @match        https://4099054.app.netsuite.com/app/common/search/searchresults.nl*searchid=17452*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js
// ==/UserScript==


/**
 * Manager of HTML elements injected into page.
 * Can be used to read form values and insert the form. 
 */
class HTMLManager {
    constructor () {
        this.inputHTML = `
                <input onkeydown="monkeyModel.lotTest(this.value)" onkeyup="" onchange="" maxlength="100" onkeypress="" type="text" onfocus="this.checkvalid=true;" onblur="if (this.checkvalid == true) {this.isvalid=validate_field(this,'text',false,false,null,null,false, null ,8);} if (this.isvalid == false) { selectAndFocusField(this); if (arguments[0]){ arguments[0].stopPropagation();} return this.isvalid;} " size="25" aria-labelledby="monkeyInput" name="monkeyInput" style="" id="monkeyInput" class="input uir-field--auto-size uir-input-text hidden" value="Monkey"></span>
        `
        
    };

    /**
    * @param {string} value 
    */
    isValidLot(value){
    // only match 8 digit strings
    var regex = /^\d{8}$/;
    var result = regex.test(value);
    if(!result) {console.log(value);};
    return result;
    };
    /**
     * Insert the monkey form after a provided element.
     * @param {String} elementID element to insert after.
     */
    _insertInterfaceWithin(elementID) {
        let e = document.getElementById(elementID);
        let insert = document.createElement('div');
        insert.innerHTML = this.inputHTML;
        e.appendChild(insert);
    };
    insertInterface() {
        this._insertInterfaceWithin("Transaction_FORMULATEXT_fs");
    };
    _hideLotNumberInput() {
        document.getElementById('Transaction_FORMULATEXT').style = 'display:none'
    };
    initialize() {
        this._hideLotNumberInput();
        this.insertInterface();

    };
    
};

class Utilities {
    /**
     * Usage: await sleep(500).
     * @param {Number} time_ms time to sleep for.
     * @returns {Promise}
     */
    sleep(time_ms) {
        return new Promise(resolve => setTimeout(resolve, time_ms));
    };
};

class MonkeyModel {
    
    constructor() {
        this.htmlManger = new HTMLManager();
    };
      
    lotTest(value) {
        if (this.htmlManger.isValidLot(value)) {
            document.getElementById('Transaction_FORMULATEXT').value = value;
            document.location.replace(appendFormDataToURL('/app/common/search/searchresults.nl?searchtype=Transaction','segment'))
        }
    }

    initialize() {
        this.htmlManger.initialize();
    }   
};

const utilities = new Utilities();
const monkeyModel = new MonkeyModel();
monkeyModel.initialize()

async function goTest() {
    await monkeyModel.htmlManger.setHarvestBarcodeBtnAsPrinted();
};

window.goTest = goTest

window.monkeyModel = monkeyModel;

