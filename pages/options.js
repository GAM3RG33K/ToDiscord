// Remove initial console log

function isChromeBrowser() {
    var objAgent = navigator.userAgent
    if(objAgent.indexOf("Chrome") !=-1){
        return true;
    } else {
        return false;
    }
}

// Keep these as module-level variables
const isChrome = isChromeBrowser();
const browserAPI = isChrome ? chrome : browser;
const runtime = browserAPI.runtime;
const storage = browserAPI.storage;

// Move these variables inside DOMContentLoaded
let listView, addUrlButton, clearAllButton, saveButton;
let count = 0;
const urlMapKey = 'url_map';
let urlMap;

/**
 * 
 * Methods for accessing browser APIs
 * 
*/

//get data from the storage
function getDataFromStorage(key, callBack) {
    if (isChrome) {
        storage.sync.get(null, 
            function (storagePrefs) {								 
            var value = storagePrefs[key];
            if (typeof (value) == 'undefined') {
                value = '{}';
            }
            callBack(jsonToMap(value));
        });
    } else {
        storage.sync.get()
            .then((storagePrefs) => {
                var value = storagePrefs[key];
                if (typeof (value) == 'undefined') {
                    value = '{}';
                }
                callBack(jsonToMap(value));
            });
    }
}

//set data to storage
function setDataInStorage(key, value, callBack) {
    var storagePrefs = {};
    storagePrefs[key] = mapToJson(value);

    if (isChrome) {
        storage.sync.set(storagePrefs, callBack);
    } else {
        storage.sync.set(storagePrefs)
            .then(function(item){
                callBack();
            });
    }
}

/**
 * Utility methods with pure javascript code
 */
function strMapToObj(strMap) {
    let obj = Object.create(null);
    for (let [k, v] of strMap) {
        obj[k] = v;
    }
    return obj;
}
function objToStrMap(obj) {
    let strMap = new Map();
    for (let k of Object.keys(obj)) {
        strMap.set(k, obj[k]);
    }
    return strMap;
}

function mapToJson(strMap) {
    return JSON.stringify(strMapToObj(strMap));
}
function jsonToMap(jsonStr) {
    return objToStrMap(JSON.parse(jsonStr));
}

/**
 * This method will check if the given string is empty or not
 * @param {String} string 
 */
function isEmpty(string) {
    return (string.length === 0 || !string.trim());
}

/**
 * Call back methods for logging	
 */

/**
 * Called when there was an error.
 * 
 * We'll just log the error here.
*/
function onError(error) {
    console.error(`Error: ${error}`);
}

/**
 * Print the message provided in the browser console
 * @param {String} message
 */
function print(message) {
    console.log(message);
}

/**
 * This method is called initially when the addon options page is loaded
 * 
 * it fetches the urls from the storage
 */
function initPreference() {
    getDataFromStorage(urlMapKey, function (map) {
        {
            urlMap = map;
            if (urlMap == null || urlMap.size == 0) {
                urlMap = new Map();
            }
            updateUI(urlMap);
        }
    });
}

/**
 * Store the provided map in the storage
 * @param {Map} map 
 */
function storeMap(map) {
    //store the urls in storage
    setDataInStorage(urlMapKey, map, function () {
        console.log('values updated!! ' + map);

        //reload the extension to apply the changes made by user.
        runtime.reload();
    });
}

/**
 * This method generates and returns an Input field with
 * url set as value of the element
 * With element id set as "url_" + $count
 * 
 * @param {Integer} count 
 * @param {String} url 
 */
function generateURLInputElement(count, url) {
    var urlInput = document.createElement("input");
    urlInput.id = "url_" + count;
    urlInput.placeholder = "URL";
    urlInput.className = "field-style";
    urlInput.setAttribute('value', "" + url);
    return urlInput;
}

/**
 * This method generates and returns an Input field with
 * name set as value of the element
 * With element id set as "name_" + $count
 * 
 * @param {Integer} count 
 * @param {String} name 
 */
function generateNameInputElement(count, name) {
    var nameInput = document.createElement("input");
    nameInput.id = "name_" + count;
    nameInput.placeholder = "Name";
    nameInput.className = "field-style";
    nameInput.setAttribute('value', "" + name);
    return nameInput;
}

/**
 *
 * This method generates and returns a Span Element with
 * teo input fields for name and url.
 * 
 * With element id set as "span_" + $count
 * 
 * @param {Integer} count 
 * @param {String} name 
 * @param {String} url 
 */
function generateSpanElement(count, name, url) {
    var span = document.createElement("span");
    span.id = "span_" + count;
    var nameInput = generateNameInputElement(count, name);
    var urlInput = generateURLInputElement(count, url);
    span.appendChild(nameInput);
    span.appendChild(urlInput);
    span.innerHTML += "<br />";
    return span;
}

/**
 * This method will add the List item with two input fields set in span element.
 * 
 * the values of those fields will be set to name and url respectively.
 * 
 * @param {String} name 
 * @param {String} url 
 */
function addUrlSpan(name, url) {
    const tr = document.createElement('tr');
    tr.id = "tr_" + count;

    const tdName = document.createElement('td');
    const nameInput = generateNameInputElement(count, name);
    tdName.appendChild(nameInput);

    const tdUrl = document.createElement('td');
    const urlInput = generateURLInputElement(count, url);
    tdUrl.appendChild(urlInput);

    tr.appendChild(tdName);
    tr.appendChild(tdUrl);

    document.getElementById('div_url_list').appendChild(tr);
    count++;
}

/**
 * This method will only add blank list item with empty fields for user to add new urls.
 * 
 * this will be called only when user clicks to add url button
 */
function addEmptySpan() {
    addUrlSpan('', '');
}

/**
 * This method will update the UI of the options page based on the data avaialble in
 * the map
 * 
 * @param {Map} urlMap 
 */
function updateUI(urlMap) {
    const tbody = document.getElementById('div_url_list');

    if (urlMap.size > 0) {
        for (var [name, url] of urlMap) {
            addUrlSpan(name, url);
        }
    }
    // Always add an empty span for new input
    if (tbody.children.length === 0) {
        addEmptySpan();
    }
}

/**
 * This method will clear all the stored url from the UI as well as the storage
 */
function clearUrls() {
    if (urlMap == null) {
        return;
    }
    urlMap.clear();
    updateUI(urlMap);
    storeMap(urlMap);
}

/**
 * This method will save the urls by extracting it from the UI list view and store it 
 * in the storage
 */
function saveUrls() {
    var rows = listView.getElementsByTagName('tr'); // Get table rows

    var urlMap = new Map();

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var nameInput = row.cells[0].querySelector('input'); // Access input in first cell
        var urlInput = row.cells[1].querySelector('input');   // Access input in second cell

        var name = nameInput.value;
        var url = urlInput.value;

        if (!isEmpty(name) && !isEmpty(url)) {
            urlMap.set(name, url);
        }
    }
    storeMap(urlMap);
}

// Move initialization into DOMContentLoaded
document.addEventListener("DOMContentLoaded", function() {
    // Initialize DOM element references
    listView = document.querySelector('#div_url_list');
    addUrlButton = document.querySelector('#btn_add');
    clearAllButton = document.querySelector('#btn_clean_all');
    saveButton = document.querySelector('#btn_save');

    // Only add event listeners if elements exist
    if (addUrlButton) {
        addUrlButton.addEventListener("click", addEmptySpan);
    }
    
    if (clearAllButton) {
        clearAllButton.addEventListener("click", clearUrls);
    }
    
    if (saveButton) {
        saveButton.addEventListener("click", saveUrls);
    }

    // Start the initial process
    initPreference();
});