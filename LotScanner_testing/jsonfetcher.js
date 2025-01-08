/**
 * Fetch JSON content from URL and return it.
 * @param {string} url URL serving JSON content
 * @returns {JSON}
 */

export default async function fetch_json(url) {
    
    let response = await fetch(url);
    let json = await response.json();
    return json;

}