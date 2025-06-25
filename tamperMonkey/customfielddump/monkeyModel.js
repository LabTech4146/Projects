// ==UserScript==
// @name         RFSmart Custom Field Dump Magic
// @namespace    http://tampermonkey.net/
// @version      2025-05-28b
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
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

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
        grid-template: 200px 200px / 300px 300px ;
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
        <input name="today_vessel_btn" type="button" value="Print Today's Vessel Labels (Trialing)" onclick="monkeyModel.printTodayVesselLabels()">
        <span id="attention">⬆️New! We are trying out printing these on day of use during morning computer person routine instead of day before.</span>
    </div>
    <div id="label_selection" >
        <input name="harvest_barcode_btn" type="button" value="Print Today Exp Date Barcode Labels" onclick="monkeyModel.printHarvestExpDateBarcodeLabels()">
    </div>
    <div id="label_selection" >
        <input name="tomorrow_vessel_btn" type="button" value="Print Next Work Day Vessel Labels (Deprecated)" onclick="monkeyModel.printTomorrowVesselLabels()">
    </div>
    <div >
    </div>
</form>




            `
    };

    /**
     * Insert the monkey form after a provided element.
     * @param {String} jQuerySelector element to insert after.
     */
    _insertInterfaceAfter(jQuerySelector) {
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
    setHarvestBarcodeBtnAsPrinted() {
        $("[name='harvest_barcode_btn']").prop(
            {'disabled': true, 'value': 'Harvest barcode labels printed.'});
    };
    setAttentionText(value) {
        $('#attention').text(value)
    };
    insertInterface() {
        this._insertInterfaceAfter("#viewFilterView");
    };
    /**
     * Builds in html elements based on condition of RFSmart page.
     * Becuase RFSmart clears html elements on many input changes
     * we need to check after changes and add back in interface if it has
     * been destroyed.
     */
    runHtmlBuildLogic() {
        if (viewModel.CurrentView() === 'viewFilterView') {
            if (!$('#monkey_form').length) {
                this.insertInterface();
            };
        };
    };
    handleHtmlChange() {
        this.runHtmlBuildLogic();
        console.log('change')
    }
    intializeObserver() {
        let target = document.querySelector('#application');
        this.observer = new MutationObserver((mutations) => {
            monkeyModel.htmlManger.handleHtmlChange();
        });
        this.observer.observe(target, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        });
    }
    initialize() {
        this.runHtmlBuildLogic();
        this.intializeObserver();
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
    async getNextWorkDay20LiterRecordIDs() {
        return await this._getInternalIDsFromSavedSearch(
            "!WMz Next Work Day Seed Vessel Starts EXPORT"
        );
    };
    async getNextWorkDay400LiterRecordIDs() {
        return await this._getInternalIDsFromSavedSearch(
            "!WMz Next Work Day Final Vessel Starts EXPORT"
        );
    };
    async getToday20LiterRecordIDs() {
        return await this._getInternalIDsFromSavedSearch("!WMz Today Seed EXPORT");
    };
    async getToday400LiterRecordIDs() {
        return await this._getInternalIDsFromSavedSearch("!WMz Today Final Vessel EXPORT");
    };
    async getHarvestRecordIDs() {
        return await this._getInternalIDsFromSavedSearch(
            "!WMz Today Harvest EXPORT"
        );
    };


   
}

class MonkeyModel {

    DEFAULT_PRINTER = /123 DO NOT DELETE/
    
    constructor() {
        this.htmlManger = new HTMLManager();
        this.printManager = new PrintManager();
        this.dataManager = new DataManager();
    };
      

    async intializeAsync() {
        await this.dataManager.intializeDatasets();
        this.htmlManger.initialize();
    }

    async printRecordSet(internalIds, printerName, labelName, numCopies){
        await this.printManager.printRecords(
            internalIds,
            this.dataManager.getPrinterID(printerName),
            this.dataManager.getLabelID(labelName),
            numCopies
        );
    };
        
    async print20LiterSet(printerName, is_for_today) {
        if (is_for_today) {
            var recordIDs = await this.dataManager.getToday20LiterRecordIDs();
        } else {
            var recordIDs = await this.dataManager.getNextWorkDay20LiterRecordIDs();
        }
        await this.printRecordSet(recordIDs, printerName, 
            "00 - Seed and Final Vessel Label", 1
        );
        if (recordIDs.length) {
            await this.printRecordSet([recordIDs[0]], printerName,
                "00 - Control Label", 1
            );
        };
    };

    async printHarvestExpDateBarcodeLabels(){
        this.htmlManger.setHarvestBarcodeBtnAsPrinted();
        let recordIDs = await this.dataManager.getHarvestRecordIDs();
        await this.printRecordSet([recordIDs[0]], this.DEFAULT_PRINTER,
            "00 - Expiration Date Barcode Labels", 1
        );
    };

    async print400LiterSet(printerName, is_for_today) {
        if (is_for_today) {
            var recordIDs = await this.dataManager.getToday400LiterRecordIDs();    
        } else {
            var recordIDs = await this.dataManager.getNextWorkDay400LiterRecordIDs();;
        };
        
        await this.printRecordSet(recordIDs, printerName,
            "00 - Seed and Final Vessel Label", 1
        );
    };
    async printTomorrowVesselLabels(){
        let confirmText = `
        We are moving to printing vessel labels on
        the day of use, instead of day before.
        are you sure you want to print next day labels?

        Press 'OK' to confirm. Otherwise press 'Cancel'."`
        if(window.confirm(confirmText)){
            this.htmlManger.setFormDisable(true);
            await this.print20LiterSet(this.DEFAULT_PRINTER, false);
            await this.print400LiterSet(this.DEFAULT_PRINTER, false);
            this.htmlManger.setAllButtonText('Labels Printed. Refresh Page to Enable Printing Again.')
        };
        
    };
    async printTodayVesselLabels(){
        this.htmlManger.setFormDisable(true);
        await this.print20LiterSet(this.DEFAULT_PRINTER, true);
        await this.print400LiterSet(this.DEFAULT_PRINTER, true);
        this.htmlManger.setAllButtonText('Labels Printed. Refresh Page to Enable Printing Again.')
    };
    
};

const utilities = new Utilities();
const monkeyModel = new MonkeyModel();
await monkeyModel.intializeAsync();

async function goTest() {
    let confirmText = `
        We are moving to printing vessel labels on
        the day of use, instead of day before.
        are you sure you want to print next day labels?
        Press 'OK' to confirm. Otherwise press 'Cancel'."`
    window.confirm(confirmText);
};

window.goTest = goTest

window.monkeyModel = monkeyModel;

