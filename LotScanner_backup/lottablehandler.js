import packSizeHandler from "./packsizehandler.js";

/**
 * Collects information for lot table and builds lot table.
 */
class LotTableHandler{
    /**
     * @param {String} lotNumber the lot number to set for other operations.
     */
    setLot(lotNumber){
        this.lotNumber = lotNumber;
    };
    /**
     * Load data from saved arrays, if no data for lot fetch data again.
     * Then build HTML for lot table.
     */
    async getLotTableDataAndBuildTable(){
        try {
            this._setTableAsLoading();
            this._showTableDiv();
            this.lot_table_data = await packSizeHandler.get_table_variables_from_lot(this.lotNumber);    
            this._onLotTableDataReceived();

        } catch (error) {
            // error with lot
            this.setTableError(error);
            this._setTableAsLoaded();
        };
    };

    _onLotTableDataReceived(){
        lotTableHandler._buildLotTableHTML(this.lot_table_data);
        this._setTableAsLoaded();
    };
    /**
    * Build the lot table
    */
    _buildLotTableHTML(){
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
        this._showTableDiv();
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

    _setTableAsLoading(){
        document.getElementById("lotNumberSpan").innerText = this.lotNumber;
        document.getElementById("lot_builds_table").classList.add("loading")
        document.getElementById("strainSpan").innerText = "⏳loading⏳";
        var rowsToClear = document.getElementsByClassName("dataRow");
        while (rowsToClear[0]){
            rowsToClear[0].remove();
        };
        this._showTableDiv();
    };
    _setTableAsLoaded(){
        document.getElementById("lot_builds_table").classList.remove("loading");
        let strainText = document.getElementById("strainSpan").innerText
        if (strainText === "⏳loading⏳"){
            document.getElementById("strainSpan").innerText = "..."
        };
    };
    hideTableDiv(){
        document.getElementById("tableDiv").className = "hidden";
    };
    _showTableDiv(){
        document.getElementById("tableDiv").className = "";
    };
    showUpdateButton(){
        document.getElementById("noLotTip").className = "";
    };
    hideUpdateButton(){
        document.getElementById("noLotTip").className = "hidden";
    };
};

const lotTableHandler = new LotTableHandler();
export default lotTableHandler