// ==UserScript==
// @name         RFSmart Custom Field Dump Magic
// @namespace    http://tampermonkey.net/
// @version      2025-05-13b
// @description  Provide label printing enhancements.
// @author       You
// @match        https://4099054.app.netsuite.com/app/site/hosting/scriptlet.nl?script=customscript_rfs_controller&deploy=customdeploy_rfs_controller&file=1459763*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// @require https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==


/**
 * Manager of HTML elements injected into page.
 * Can be used to read form values and insert the form. 
 */
class HTMLManager {
    constructor () {
        this.formHTML = `
            <style>

    .loading {
        opacity: 1;
        animation: fade 2s infinite linear;
        position: absolute;
        background: blue;
        padding: 100px 500px;
        border-radius: 5px;
    }

    #monkey_form {
        grid-template: 200px / 200px 300px 200px;
        display: grid;
        position: relative;
    }

    input[type=button] {
        width: max-content;
        padding: 5px;
        margin: 5px;
    }


    @keyframes fade {
    0%,100% { opacity: 0 }
    50% { opacity: 1 }
    }
</style>


<form id="monkey_form">
    <div id="label_selection" >
        <input name="go_button" type="button" value="Print Next Work Day Vessel Labels" onclick="monkeyModel.printTomorrowVesselLabels()">
        <span id="attention">⬆️New! Click this to print 20L and 400L vessel stickers for the next work day</span>
        
    </div>
    <div >
    </div>
    <div>
    </div>
</form>

            `
    };

    /**
     * Insert the monkey form after a provided element.
     * @param {String} jQuerySelector element to insert after.
     */
    insertInterfaceAfter(jQuerySelector) {
        let e = $(jQuerySelector)[0];
        let insert = document.createElement('div');
        insert.innerHTML = this.formHTML;
        e.append(insert);
    };

    /**
     * Get the data from the monkey form. Elements may be iterated over
     * via for (var e of FormData).
     * @returns {FormData}
     */
    getFormData() {
        let f = new FormData($('#monkey_form')[0])
        return f
    };
    /**
     * Disable/enable form interactions.
     * @param {boolean} value True disables form, false enables
     */
    setFormDisable(value) {
        $(':input').prop('disabled', value)
        if (value){
            this.setAllButtonText('Working...');
            this.setAttentionText(`Thank you for trying the feature.
                If labels print incorrectly please tell Wyatt.`)
        };
    };
    setAllButtonText(value) {
        $(':button').prop('value', value);
    };
    setAttentionText(value) {
        $('#attention').text(value)
    }
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

/**
 * Manages requests to the ViewModel for printing.
 */
class PrintManager {
    /**
     * Print a record, delay is included to ensure queue is in order.
     * @param {Number} recordID internal id of strain tracker record
     * @param {Number} printerID intern id of printer
     * @param {Number} numberOfLabels number of labels to print
     * @param {Number} labelID internal id of label record
     */
    async _printRecord(recordID, printerID, numberOfLabels, labelID) {
        let data = {
                command: 'PrintRequest_EnqueueModded',
                record: {
                    recordid: parseInt(recordID),
                    printerid: parseInt(printerID),
                    numberoflabels: parseInt(numberOfLabels),
                    labelid: parseInt(labelID),
                }
            };
            if (recordID && printerID && numberOfLabels && labelID) {
                window.viewModel.LoadViaAjax(data, (result) => {});
                console.log(`printing ${data}`);
                await utilities.sleep(1000);
            };
    };
    /**
     * Print a number of records based on internal id.
     * @param {Number[]} recordIDs strain tracker internal ids
     * @param {Number} printerID internal id of printer
     * @param {Number} numberOfLabels number of labels to print
     * @param {Number} labelID internal id of label record
     */
    async printRecords(recordIDs, printerID, labelID, numberOfLabels) {
        for (let recordID of recordIDs) {
            await this._printRecord(
                recordID, printerID, numberOfLabels, labelID
            );
        };
    };
};

class DataManager {
    constructor() {
        this.WEB_APP_BASE_URL = "https://script.google.com/macros/s/AKfycbzVybkvVCKGFmzg3eXke0Hv92VhxeqMnHLkwo2Mb95alGtVx9p_vON4sBXO8jZET5ug/exec?command=getSavedSearchDataById&Id=";
        this.EXPORT_SAVED_SEARCH_INTERNAL_ID = 17436;
    };
    /**
     * Get an array of results from NetSuite saved search.
     * @param {Number} savedSearchSelector the internal id of saved search
     * or the name of the search
     */
    async getSavedSearchData(savedSearchSelector) {
        if (typeof savedSearchSelector === "string") {
            var searchID = this._getSavedSearchID(savedSearchSelector);
        } else {
            var searchID = savedSearchSelector
        }
        let url = this.WEB_APP_BASE_URL + `${searchID}`;
        return await this.fetchJSONasSplit(url);
    };
    /**
     * Fetch JSON content from URL and return it.
     * @param {string} url URL serving JSON content
     * @returns {JSON}
     */
    async fetchJSONasSplit(url) { 
        //TODO https://stackoverflow.com/questions/53433938/how-do-i-allow-a-cors-requests-in-my-google-script
        // CORS headache as usual... try the above. You'll need to create a doPOST method.
        let response = await fetch(url, {
        redirect: "follow",
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        }
        });
        let json = await response.json();
        let splitData = this.formatDataAsSplit(json)
        return splitData;
    };
    /**
     * NetSuite provides saved searches in the 'split' format. So
     * the headers are in the 'column' property, and the rows 
     * are in the 'data' property. This function converts any 
     * non-split type results to split, so the data can be 
     * handled uniformly afterward.
     * @param {Object} json The json object to convert to split.
     */
    formatDataAsSplit(json){
        if ('columns' in json) {
            var output = json;
        } else {
            let columns = json.shift();
            let rows = json;
            var output = {columns: columns, data: rows};
        };
        
        return output;
    };

    async _getSavedSearchNameLookup() {
        return await this.getSavedSearchData(this.EXPORT_SAVED_SEARCH_INTERNAL_ID);
    };
    async intializeDatasets() {
        this.savedSearchLookup = await this._getSavedSearchNameLookup();
        let lookups = await Promise.all([
            this.getSavedSearchData("!WMz Printer Lookup EXPORT"),
            this.getSavedSearchData("!WMz Label Lookup EXPORT")
        ]);
        this.printerLookup = lookups[0];
        this.labelLookup = lookups[1];
        this.dataLoaded = true;
    };
    getPrinterID(name) {
        return this._getInternalIDByValue(name, this.printerLookup, 'Name');
    };
    getLabelID(name) {
        return this._getInternalIDByValue(name, this.labelLookup, 'Name');
    };
     /**
     * Find a 
     * @param {String} value The value to search for.
     * @param {Array} lookup The array to filter on.
     * @param {String} columnName the column text to match.
     * @returns {Number} the internal ID of the matched item
     */ 
    _getInternalIDByValue(value, lookup, columnName) {
        let targetIndex = lookup.columns.indexOf(columnName);
        let internalIDIndex = lookup.columns.indexOf('Internal ID');
        let targetRow = lookup.data.filter(
            row => row[targetIndex].match(value)
        );
        let internalID = parseInt(targetRow[internalIDIndex])

        return internalID;
    };
    /**
     * Give
     * @param {String} searchName The name of the saved search.
     * @returns {Number} The internal id of the search or null.
     */
    _getSavedSearchID(searchName) {
        let lookup = this.savedSearchLookup;
        let internalID = this._getInternalIDByValue(searchName, lookup, 'Title');
        
        return internalID;
    };
    async _getInternalIDsFromSavedSearch(searchName) {
        let searchID = this._getSavedSearchID(searchName);
        let searchResult = await this.getSavedSearchData(searchID);
        let internalIDIndex = searchResult.columns.indexOf('Internal ID');
        
        return searchResult.data.map(row => row[internalIDIndex]);
    };
    async get20LiterRecordIDs() {
        return await this._getInternalIDsFromSavedSearch(
            "!WMz Next Work Day Seed Vessel Starts EXPORT"
        );
    };
    async get400LiterRecordIDs() {
        return await this._getInternalIDsFromSavedSearch(
            "!WMz Next Work Day Final Vessel Starts EXPORT"
        );
    };


   
}

class MonkeyModel {

    DEFAULT_PRINTER = /AVL HARVEST 3x2/
    
    constructor() {
        this.htmlManger = new HTMLManager();
        this.printManager = new PrintManager();
        this.dataManger = new DataManager();
    };

    async intializeAsync() {
        await this.dataManger.intializeDatasets();
        this.htmlManger.insertInterfaceAfter("#viewFilterView");
    }
    
    async printTomorrow20Liter(printerName) {
        let recordIDs = await this.dataManger.get20LiterRecordIDs();
        let printerID = this.dataManger.getPrinterID(printerName);
        let labelID = this.dataManger.getLabelID("00 - Seed and Final Vessel Label");
        let  numLabels = 1;
        await this.printManager.printRecords(
            recordIDs, printerID, labelID, numLabels
        );
    };

    async printTomorrow400Liter(printerName) {
        let recordIDs = await this.dataManger.get400LiterRecordIDs();
        let printerID = this.dataManger.getPrinterID(printerName);
        let labelID = this.dataManger.getLabelID("00 - Seed and Final Vessel Label");
        let  numLabels = 1;
        await this.printManager.printRecords(
            recordIDs, printerID, labelID, numLabels
        );
    };

    async printTomorrowVesselLabels(){
        this.htmlManger.setFormDisable(true);
        await this.printTomorrow20Liter(this.DEFAULT_PRINTER);
        await this.printTomorrow400Liter(this.DEFAULT_PRINTER);
        this.htmlManger.setAllButtonText('Labels Printed. Refresh Page to Enable Printing Again.')
    };
};

const utilities = new Utilities();
const monkeyModel = new MonkeyModel();
await monkeyModel.intializeAsync();

async function goTest() {
    await monkeyModel.printTomorrowVesselLabels();
};


window.monkeyModel = monkeyModel;

