function isChromeBrowser() {
    var objAgent = navigator.userAgent
    if (objAgent.indexOf("Chrome") != -1) {
        return true;
    } else {
        return false;
    }
}
const isChrome = isChromeBrowser();
const browserAPI = isChrome ? chrome : browser;
const menus = isChrome ? browserAPI.contextMenus : browserAPI.menus;
const runtime = browserAPI.runtime;
const storage = browserAPI.storage;
const browserAction = browserAPI.browserAction;
const i18n = browserAPI.i18n;
const contextList = isChrome ? ["link", "selection", "page", "image", "video", "audio",]
    : ["link", "selection", "page", "tab", "image", "video", "audio",];

const URL_SEPARATOR = ";";
const urlMapKey = 'url_map';

//this is prefix string for menu item title
const menuTitlePrefix = getMessage("menuTitlePrefix");

//this is the storage for urls
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
            .then(function (item) {
                callBack();
            });
    }
}

// get message string from the message json
function getMessage(messageKey) {
    return i18n.getMessage(messageKey);
}

//add a context menu item
function createMenuItem(itemProperties, callBack) {
    menus.create(itemProperties, callBack);
}

//add click listener for context menu items
function addMenuItemClickListener(callBack) {
    menus.onClicked.addListener(callBack);
}

// add click listener for extension icon on tool bar
function addIconClickListener(callBack) {
    browserAction.onClicked.addListener(callBack);
}


/**
 * This method will open the options page of the addon
 */
function openOptionsPage() {
    runtime.openOptionsPage();
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
 * Call back methods for logging	
 */

/** 
 * Called when the item has been created, or when creation failed due to an error.
 * 
 * We'll just log success/failure here.
 * 
*/
function onCreated() {
    if (runtime.lastError) {
        print(`Error: ${runtime.lastError}`);
    } else {
        print("Item created successfully");
    }
}

/**
 * Called when the url has been set in storage.
 * 
 * We'll just log success here.
*/
function onSuccess() {
    print("Url set successfully");
}

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
 * This method will be called when the extension has been loaded for the first time
 *  in current browser session.
 */
function initValues() {
    getDataFromStorage('url_map', function (map) {
        urlMap = map;
        console.log('urls from the storage: ' + map);
        generateMenuItems();
    });
}


/**
 * Create all the context menu items.
 * 
*/
function generateMenuItems() {

    //check if the in memory urlmap
    if (urlMap != null
        && typeof urlMap != 'undefined'
        && urlMap.size > 0) {
        print('urlMap:');
        for (var [key, value] of urlMap) {
            print(key + ' : ' + value);
        }

        //iterate over the map and create menu items accordingly
        for (var [name, url] of urlMap) {
            createMenuItem({
                id: name,
                title: menuTitlePrefix + " " + name,
                //this will allow the options pop up to be visible 
                //When user has cursor on a link, a tab or anywhere in the page.
                //Also When a text selection has been made.
                contexts: contextList,
            }, onCreated);
        }
    }
    createMenuItem({
        id: "options",
        title: getMessage("menuTitleOptions"),
        //this will allow the options pop up to be visible everywhere on the browser. 
        contexts: ["all"]
    }, onCreated);
}

/*
The click event listener, where we perform the appropriate action given the
ID of the menu item that was clicked.
*/
addMenuItemClickListener((info, tab) => {
    var menuItemId = "" + info.menuItemId;
    if (urlMap != null && urlMap.size > 0) {
        var url = urlMap.get(menuItemId);
        if (url != null && typeof url != 'undefined') {
            send(url, info, tab);
        }
    }

    if (menuItemId === "options") {
        openOptionsPage();
    }
});



/**
 * This method sends given content(tab url, link or selected text) 
 * to given url.
 * 
 * Note: The url must be of the dicord webhook only.
 * @param {String} url 
 * @param {TabInfo} info 
 * @param {Tab} tab 
 */
function send(url, info, tab) {

    //check the content, if it is selected text or a link
    var data = info.linkUrl != null ? info.linkUrl : info.selectionText;
    //check if the user has not clicked any link or selected any text
    data = data || tab.url;

    //create a json from the data
    var jsonData = JSON.stringify({
        "content": data,
        "ttl": false
    });

    
    //check if the url is for a broadcast
    if (url.includes(URL_SEPARATOR)) {
        //Get the list of channel for broadcast
        var channels = url.split(URL_SEPARATOR);
        var channel;
        for (channel of channels) {
            //send the data to channels one by one
            executeRequest(channel, jsonData);
        }
    } else {
        //send the data to url
        executeRequest(url, jsonData);
    }
}


/**
 * This method sends given platform formatted json data 
 * to given url.
 * 
 * @param {String} url 
 * @param {String} jsonData 
 */
function executeRequest(url, jsonData) {
    print('discord url: ' + url);
    //send request to discord webhook
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.send(jsonData);

    //read and log the response
    var response = xhr.response;
    print("Discord Response: " + response);
    return response;
}


//listen for the event to start the initial process of the page
document.addEventListener("DOMContentLoaded", initValues);
//redirect user to options page on click of the extension icon.
addIconClickListener(openOptionsPage);