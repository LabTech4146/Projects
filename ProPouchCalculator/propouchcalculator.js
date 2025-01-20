/**
 * Calculate pro pouches given liters, homebrew, and nano requirements.
 * @param {Number} litersProduced number of liters produced for this lot.
 * @param {Number} numHB number of homebrew for this lot.
 * @param {Number} numNano number of nano for this lot.
 * @returns {Number} the number of pro pouches.
 */
function calculateProPouchesImport(litersProduced, numHB, numNano) {
    var numPro = Math.floor(
    (litersProduced
        - (numHB * 0.07)
        - (numNano * 0.35)
    )
    /1.865
    + 1)
    
    return numPro
}

export default calculateProPouchesImport