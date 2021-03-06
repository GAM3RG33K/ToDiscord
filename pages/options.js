function isChromeBrowser() {
    var objAgent = navigator.userAgent
    if(objAgent.indexOf("Chrome") !=-1){
        return true;
    } else {
        return false;
    }
}
const isChrome = isChromeBrowser();
const browserAPI = isChrome ? chrome : browser;
const runtime = browserAPI.runtime;
const storage = browserAPI.storage;

//the list view element in the page
const listView = document.querySelector('#div_url_list');
//the button to add a url field
const addUrlButton = document.querySelector('#btn_add');
//the button which clears all the saved url
const clearAllButton = document.querySelector('#btn_clean_all');
//the button which saves the urls in the list in the storage
const saveButton = document.querySelector('#btn_save');

//this count helps access and maintain order of the visible elements which contains urls
var count = 0;


const urlMapKey = 'url_map';
var urlMap;
/**
 * 
 * Methods for accessing browser APIs
 * 
*/

//get data from the storage
function getDataFromStorage(key, callBack) {
    print('get key: ' + key);
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
    print('mapKey/value: ' + key + "/" + value);
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
    print(`Error: ${error}`);
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
            if (urlMap == null
                || urlMap.size == 0) {
                print('nothing in storage, adding current map!');
                urlMap = new Map();
                // storeMap(urlMap);
            } else {
                print('storage.urlMap => ');
                for (var [key, value] of urlMap) {
                    print('\n' + key + ' : ' + value);
                }
            }

            //update UI based on the urlMap that was fetched from the storage
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
    var span = generateSpanElement(count, name, url);
    var listItem = document.createElement('li');
    listItem.appendChild(span);
    listView.appendChild(listItem);
    count++
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
    var list = listView.children;

    for (var i = 0; i < list.length; i++) {
        listView.removeChild(list[i]);
    }

    if (urlMap.size > 0) {
        for (var [name, url] of urlMap) {
            addUrlSpan(name, url);
        }

        // } else {
        //     addUrlSpan('', '');
    }
    addUrlSpan('', '');
}

/**
 * This method will clear all the stored url from the UI as well as the storage
 */
function clearUrls() {
    if (urlMap == null) {
        return;
    } else {
        print('clearing storage.urlMap => ');
        for (var [key, value] of urlMap) {
            print('\n' + key + ' : ' + value);
        }
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
    var spans = listView.children;

    var urlMap = new Map();

    for (var i = 0; i < spans.length; i++) {
        var span = spans[i].children[0];
        var name = span.children[0].value;
        var url = span.children[1].value;
        if (!isEmpty(name) && !isEmpty(url)) {
            urlMap.set(name, url);
        }
    }
    storeMap(urlMap);
}


//listen for the event to start the initial process of the page
document.addEventListener("DOMContentLoaded", initPreference);

//add url button reference from the UI
addUrlButton.addEventListener("click", addEmptySpan);
//clear all the url button reference from the UI
clearAllButton.addEventListener("click", clearUrls);
//save all the url button reference from the UI
saveButton.addEventListener("click", saveUrls);