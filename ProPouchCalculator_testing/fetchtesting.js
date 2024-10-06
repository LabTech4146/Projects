URL = "https://script.google.com/macros/s/AKfycbzVybkvVCKGFmzg3eXke0Hv92VhxeqMnHLkwo2Mb95alGtVx9p_vON4sBXO8jZET5ug/exec?command=getSavedSearchDataById&Id=9738"

function test(){
    fetch("https://script.google.com/macros/s/AKfycbzVybkvVCKGFmzg3eXke0Hv92VhxeqMnHLkwo2Mb95alGtVx9p_vON4sBXO8jZET5ug/exec?command=getSavedSearchDataById&Id=9738")
        .then(response => response.json())
        .then(lotTableJson => proccesLotTableArray(lotTableJson))
}

/**
 * @param {{columns: string[]; data: string[][]}} lotTableArray
 */
function proccesLotTableArray(lotTableArray){
    console.log(lotTableArray)
}