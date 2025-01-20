import fetch_json from "./jsonfetcher.js"
import calculateProPouchesImport from "./propouchcalculator.js"

/**
 * Module for fetching and handling data relating to pack sizes
 * 
 */

const LOT_TABLE_WEB_APP_BASE_URL = "https://script.google.com/macros/s/AKfycbzVybkvVCKGFmzg3eXke0Hv92VhxeqMnHLkwo2Mb95alGtVx9p_vON4sBXO8jZET5ug/exec"
const LOT_DATA_WEB_APP_GET_LITERS_PRODUCED_DATA_URL =LOT_TABLE_WEB_APP_BASE_URL + "?command=getSavedSearchDataById&Id=11352"
const LOT_DATA_WEB_APP_GET_PACK_SIZE_DATA_URL = LOT_TABLE_WEB_APP_BASE_URL + "?command=getSavedSearchDataById&Id=11955"


class _NoLitersProducedError extends Error {}

class _PackSizeDataHandler{
    
    constructor(){

        /**@type {Date} tracks last time pack size data was fetched  */
        this._time_of_last_update = new Date(0) // 1969... ie never
        /**@type {{columns: string[]; data: string[][]}} */
        this._pack_size_data;
        this._fetch_and_init_table();
           
    }

    async _fetch_and_init_table() {

        this._pack_size_data = await this._fetch_pack_size_data();
        this._build_table_parse_properties();
        this._time_of_last_update = new Date();
    }

    async _fetch_pack_size_data(){

        return fetch_json(LOT_DATA_WEB_APP_GET_PACK_SIZE_DATA_URL);

    }

    /**
     * assign properties used when parsing table for pack size data
     */
    _build_table_parse_properties(){
                
        let table = this._pack_size_data;
        this.column_headers = table.columns;
        this.data = table.data;
        this.lot_index = this.column_headers.indexOf("lot"); 
        this.qty_index = this.column_headers.indexOf("quantity");
        this.item_name_index = this.column_headers.indexOf("item_name");

    }

    _get_hours_since_update(){

        let ms_since_last_update = (
            new Date() - this._time_of_last_update
        )
        return ms_since_last_update / 1000 / 60 / 60 // ms->s->mins->hours
    }

    
    /**
     * Return the packs sizes of HB and Nano, if any, for a given lot.
     * @param {Number | string} lot The lot number to find pack sizes for
     * @returns {Promise<{num_hb: Number; num_nano: Number}>} 
     */
    async get_pack_sizes_for_lot(lot){

        await this._update_data_if_expired(4);

        lot = lot.toString();
        let lot_rows = this.data.filter(x=> x[this.lot_index] == lot);
        let num_hb = 0;
        let num_nano = 0;

        if(lot_rows.length < 1){

            throw new Error(`No PPNG work orders found for lot# ${lot}`); 

        };

        for (let row of lot_rows){

            let item_name = row[this.item_name_index];

            if (item_name.endsWith("Nano")){
                
                num_nano = parseInt(row[this.qty_index]);

            } else if (item_name.endsWith("HB")) {

                num_hb = parseInt(row[this.qty_index]);

            };
        };

        return {num_hb: num_hb, num_nano: num_nano}
    };
    /**
     * Return the strain, if any, for a given lot.
     * @param {Number | string} lot The lot number to find pack sizes for
     * @returns {Promise<{strain: string}>} 
     */
    async get_strain_name_from_lot(lot){

        await this._update_data_if_expired(4);

        lot = lot.toString();
        let lot_rows = this.data.filter(x=> x[this.lot_index] == lot);

        if(lot_rows.length < 1){

            throw new Error(`No strain info found for lot# ${lot}`); 

        };

        let item_name = lot_rows[0][this.item_name_index];
        let strain = /WLP\d+/.exec(item_name)[0];

        return {strain: strain};

    };


    /**
     * Fetch pack size data again if last update date >`time_limit_hrs` ago.
     * @param {Number} time_limit_hrs Permitted hours since last update
     */
    async _update_data_if_expired(time_limit_hrs) {

        let hrs_since_last_update = this._get_hours_since_update();
        
        if (hrs_since_last_update > time_limit_hrs){

            await this._fetch_and_init_table();

        };
    }
};

class _LitersProducedDataHandler{
    constructor(){

        /**@type {{columns: string[]; data: string[][]}} */
        this._pack_size_data;
        this._retry_counter = 0
          
    }

    async _fetch_and_init_table() {

        this._pack_size_data = await this._fetch_liters_produced_data();
        this._build_table_parse_properties();     
        this._time_of_last_pack_size_update = new Date(); // now

    }

    async _fetch_liters_produced_data(){

        return fetch_json(LOT_DATA_WEB_APP_GET_LITERS_PRODUCED_DATA_URL);
    }

    /**
     * assign properties used when parsing table for liters produced
     */
    _build_table_parse_properties(){
                
        let table = this._pack_size_data;
        this.column_headers = table.columns;
        this.data = table.data;
        this.lot_index = this.column_headers.indexOf("lot"); 
        this.ltrs_index = this.column_headers.indexOf("liters_produced");

    }
    
    /**
     * Return the liters produced for agive lot.
     * @param {Number | string} lot The lot number to find pack sizes for
     * @returns {Promise<Number | "">} the liters produced for the lot, will be "" if blank
     */
    async get_liters_for_lot(lot){
        
        lot = lot.toString();
        this.lot = lot;

        if (typeof this.data == 'undefined'){
            
            await this._fetch_and_init_table();

        }
        
        let lot_rows = this.data.filter((x)=> x[this.lot_index] == lot);

        if(lot_rows.length < 1){

            throw new Error(`No liters produced record found for lot# ${lot}`);

        } else if(lot_rows.length === 1) {

            return this._get_liters_from_lot_row(lot_rows[0]);

        } else {

            throw new Error(`Unexpected lot rows for lot# ${lot}`);

        }
    };

    /**
     * Return the liters produced for lot, "" if empty.
     * @param {string[]} lot_row data row matching lot
     * @returns {Number | ""} the number of liters produced
     */
    async _get_liters_from_lot_row(lot_row) {

        let liters_produced = lot_row[this.ltrs_index];

        if(liters_produced === ""){
            
            await this._fetch_and_init_table()
            this._retry_counter += 1
            if (this._retry_counter == 1){
                return await this.get_liters_for_lot(this.lot)
            } else {
                this._retry_counter = 0
                return ""
            }
            
        };

        return liters_produced;

    }

}

class PackSizeHandler{
    /**
     * Given a lot, determine the number of pro pouches.
     * @param {string | Number} lot_number The lot number to calculate for.
     * @returns {Number | "No liters produced entered for this lot."} Number of pouches or "No liters produced entered for this lot." if value is blank.
     */
    async calculate_pro_pouches_from_lot(lot_number){
        
        this.lot_number = lot_number

        let liters_produced = 
            await _litersProducedDataHandler.get_liters_for_lot(this.lot_number);
        
        if (liters_produced !== "") {

            let {num_hb, num_nano} = 
            await _packSizeDataHandler.get_pack_sizes_for_lot(this.lot_number);

            var num_pro = calculateProPouchesImport(liters_produced, num_hb, num_nano)

        } else {

            var num_pro = "No liters produced entered for this lot."

        }

        return num_pro
    };
    /**
     * Return the pack sizes for a given lot.
     * @param {string} lot_number the lot number to find pack sizes for
     * @returns {Promise<{num_hb: Number; num_nano: Number, num_pro: Number | "No liters produced entered for this lot."}>}
     */
    async get_pack_sizes_from_lot(lot_number){

        var {num_hb, num_nano} = await _packSizeDataHandler.get_pack_sizes_for_lot(lot_number);
        var num_pro = await this.calculate_pro_pouches_from_lot(lot_number);

        return {num_hb: num_hb, num_nano: num_nano, num_pro: num_pro}

    }
    /**
     * Return the strain name for a given lot.
     * @param {string} lot_number the lot number to find pack sizes for
     * @returns {Promise<{strain: string}>}
     */
    async get_strain_name_from_lot(lot_number){

        return _packSizeDataHandler.get_strain_name_from_lot(lot_number)

    }
    /**
     * Return all data needed for table building
     * @param {string} lot_number the lot number to get the table data for
     * @returns {Promise<{num_hb: Number; num_nano: Number, num_pro: Number | "No liters produced entered for this lot.", strain: String}>}
     */

    async get_table_variables_from_lot(lot_number){
        
        let {num_hb, num_nano, num_pro} = await this.get_pack_sizes_from_lot(lot_number);
        let {strain} = await this.get_strain_name_from_lot(lot_number);

        return {num_hb: num_hb, num_nano: num_nano, num_pro: num_pro, strain: strain};

    }



}

const _litersProducedDataHandler = new _LitersProducedDataHandler();
const _packSizeDataHandler = new _PackSizeDataHandler();
const packSizeHandler = new PackSizeHandler();
export default packSizeHandler
