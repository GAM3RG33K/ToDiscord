const DEBUG = false; // Toggle this to enable/disable all logging

/**
 * Centralized logging function
 * @param {string} category - Category of the log (e.g., 'Storage', 'Menu', 'Network')
 * @param {string} type - Type of log ('info', 'warn', 'error')
 * @param {string} message - Main log message
 * @param {any} data - Optional data to log
 */
function logInfo(category, type = 'info', message, data = null) {
    if (!DEBUG) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${category}]`;

    switch (type.toLowerCase()) {
        case 'error':
            if (data) {
                console.error(prefix, message, data);
            } else {
                console.error(prefix, message);
            }
            break;
        case 'warn':
            if (data) {
                console.warn(prefix, message, data);
            } else {
                console.warn(prefix, message);
            }
            break;
        default:
            if (data) {
                console.log(prefix, message, data);
            } else {
                console.log(prefix, message);
            }
    }
}

logInfo('Background script loaded');

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
const action = browserAPI.action;
const i18n = browserAPI.i18n;
const contextList = isChrome ? ["link", "selection", "page", "image", "video", "audio",]
    : ["link", "selection", "page", "tab", "image", "video", "audio",];

const URL_SEPARATOR = ";";
const urlMapKey = 'url_map';

//this is prefix string for menu item title
const menuTitlePrefix = getMessage("menuTitlePrefix");

//this is the storage for urls
let globalUrlMap = null; // Define at top level

/**
 * 
 * Methods for accessing browser APIs
 * 
*/

//get data from the storage
function getDataFromStorage(key, callBack) {
    logInfo('Storage', 'info', `Getting data for key: ${key}`);
    if (isChrome) {
        storage.sync.get(null,
            function (storagePrefs) {
                try {
                    var value = storagePrefs[key];
                    logInfo('Storage', 'info', 'Raw storage value:', value);
                    if (typeof (value) == 'undefined') {
                        value = '{}';
                    }
                    const map = jsonToMap(value);
                    logInfo('Storage', 'info', 'Parsed map:', map);
                    callBack(map);
                } catch (error) {
                    logInfo('Storage', 'error', 'Error parsing storage data:', error);
                    callBack(new Map());
                }
            });
    } else {
        storage.sync.get()
            .then((storagePrefs) => {
                try {
                    var value = storagePrefs[key];
                    logInfo('Storage', 'info', 'Raw storage value:', value);
                    if (typeof (value) == 'undefined') {
                        value = '{}';
                    }
                    const map = jsonToMap(value);
                    logInfo('Storage', 'info', 'Parsed map:', map);
                    callBack(map);
                } catch (error) {
                    logInfo('Storage', 'error', 'Error parsing storage data:', error);
                    callBack(new Map());
                }
            });
    }
}

//set data to storage
function setDataInStorage(key, value, callBack) {
    logInfo('Storage', 'info', 'mapKey/value: ' + key + "/" + value);
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
    logInfo('Menu', 'info', 'Creating menu item', itemProperties);
    menus.create(itemProperties, callBack);
}

//add click listener for context menu items
function addMenuItemClickListener(callBack) {
    menus.onClicked.addListener(callBack);
}

// add click listener for extension icon on tool bar
function addIconClickListener(callBack) {
    action.onClicked.addListener(callBack);
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
        logInfo('System', 'error', 'Error:', runtime.lastError);
    } else {
        logInfo('System', 'info', 'Item created successfully');
    }
}

/**
 * Called when the url has been set in storage.
 * 
 * We'll just log success here.
*/
function onSuccess() {
    logInfo('System', 'info', 'Url set successfully');
}

/**
 * Called when there was an error.
 * 
 * We'll just log the error here.
*/
function onError(error) {
    logInfo('System', 'error', 'Error:', error);
}

/**
 * Print the message provided in the browser console
 * @param {String} message
 */
function print(message) {
    logInfo('System', 'info', message);
}

/**
 * Add this function to create menu items
 */
function addMenuItem(name, url) {
    createMenuItem({
        id: name,
        title: menuTitlePrefix + " " + name,
        contexts: contextList,
    }, onCreated);
}

/**
 * Add this function to create the options menu item
 */
function addOptionsMenuItem() {
    createMenuItem({
        id: "options",
        title: getMessage("menuTitleOptions"),
        contexts: ["all"]
    }, onCreated);
}

/**
 * Modify initContextMenu to initialize urlMap
 */
function initContextMenu() {
    logInfo('System', 'info', 'Initializing context menu');
    getDataFromStorage(urlMapKey, function (map) {
        logInfo('Storage', 'info', 'Retrieved map from storage:', map);
        
        // Ensure map is valid
        if (!map || !(map instanceof Map)) {
            logInfo('System', 'info', 'Creating new Map as retrieved map was invalid');
            map = new Map();
        }
        
        // Set the global urlMap
        globalUrlMap = map; // Use global variable instead of window
        
        // Clear existing menus first
        menus.removeAll(() => {
            logInfo('Menu', 'info', 'Creating menu items for map:', Array.from(map.entries()));
            if (map.size > 0) {
                for (const [name, url] of map) {
                    addMenuItem(name, url);
                }
            }
            addOptionsMenuItem();
        });
    });
}

// Remove the DOMContentLoaded event listener and replace with direct initialization
function initializeExtension() {
    logInfo('System', 'info', 'Extension initialized');
    // Clear existing menus first
    menus.removeAll(() => {
        // Then initialize context menus
        initContextMenu();
    });
}

// For Chrome's service worker
if (isChrome) {
    // Service workers use the 'install' event
    globalThis.addEventListener('install', (event) => {
        logInfo('System', 'info', 'Service worker installed');
        globalThis.skipWaiting(); // Use globalThis instead of self
    });

    globalThis.addEventListener('activate', (event) => {
        logInfo('System', 'info', 'Service worker activated');
        initializeExtension();
    });
} else {
    // Firefox can use direct initialization
    initializeExtension();
}

//redirect user to options page on click of the extension icon.
addIconClickListener(openOptionsPage);

// Add to storage initialization
browserAPI.storage.sync.get(null, function(items) {
    logInfo('Storage', 'info', 'Initial storage state:', items);
    logInfo('Storage', 'info', 'urlMapKey value:', items[urlMapKey]);
});

// Add back the click handler and send functions with image support
addMenuItemClickListener((info, tab) => {
    logInfo('System', 'info', 'Menu item clicked:', info.menuItemId);
    logInfo('Storage', 'info', 'Current urlMap:', globalUrlMap);
    logInfo('System', 'info', 'Click info:', info);
    
    ensureUrlMap((urlMap) => {
        var menuItemId = "" + info.menuItemId;
        if (urlMap && urlMap.size > 0) {
            var url = urlMap.get(menuItemId);
            logInfo('Storage', 'info', 'Found URL for menuId:', url);
            
            if (url != null && typeof url != 'undefined') {
                logInfo('System', 'info', 'Sending to URL:', url);
                logInfo('System', 'info', 'Info object:', info);
                logInfo('System', 'info', 'Tab object:', tab);
                send(url, info, tab);
            } else {
                logInfo('System', 'warn', 'No URL found for menuId:', menuItemId);
            }
        } else {
            logInfo('System', 'warn', 'urlMap is empty or null:', urlMap);
        }

        if (menuItemId === "options") {
            openOptionsPage();
        }
    });
});

/**
 * This method sends given content(tab url, link or selected text) 
 * to given url.
 * 
 * Note: The url must be of the discord webhook only.
 * @param {String} url 
 * @param {TabInfo} info 
 * @param {Tab} tab 
 */
function send(url, info, tab) {
    logInfo('Network', 'info', 'Send function called', { url, info, tab });

    let content = '';
    let embeds = [];

    if (info.mediaType === "image" || (info.srcUrl && info.srcUrl.match(/\.(jpeg|jpg|gif|png)$/i))) {
        logInfo('Network', 'info', 'Processing image content');
        embeds.push({
            image: {
                url: info.srcUrl
            }
        });
        content = info.linkUrl || info.srcUrl;
    } else {
        logInfo('Network', 'info', 'Processing regular content');
        content = info.linkUrl || info.selectionText || tab.url;
    }

    const payload = {
        content: content,
        embeds: embeds,
        ttl: false
    };

    logInfo('Network', 'info', 'Formatted payload:', payload);
    const jsonData = JSON.stringify(payload);
    
    if (url.includes(URL_SEPARATOR)) {
        logInfo('Network', 'info', 'Broadcasting to multiple channels');
        const channels = url.split(URL_SEPARATOR);
        logInfo('Network', 'info', 'Target channels:', channels);
        for (const channel of channels) {
            executeRequest(channel, jsonData);
        }
    } else {
        logInfo('Network', 'info', 'Sending to single channel:', url);
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
async function executeRequest(url, jsonData) {
    logInfo('Network', 'info', 'Executing request', { url, jsonData });
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: jsonData
        });
        const data = await response.text();
        logInfo('Network', 'info', 'Discord Response:', data);
        return data;
    } catch (error) {
        logInfo('Network', 'error', 'Request failed', {
            message: error.message,
            stack: error.stack,
            url: url,
            data: jsonData
        });
    }
}

// Add a function to ensure urlMap is initialized
function ensureUrlMap(callback) {
    if (!globalUrlMap) {
        getDataFromStorage(urlMapKey, (map) => {
            globalUrlMap = map;
            callback(map);
        });
    } else {
        callback(globalUrlMap);
    }
}

// Add storage change listener near the top of the file with other listeners
browserAPI.storage.onChanged.addListener((changes, areaName) => {
    logInfo('Storage', 'info', 'Storage changed:', { changes, areaName });
    
    // Check if our urlMap has changed
    if (changes[urlMapKey]) {
        logInfo('Storage', 'info', 'urlMap changed, reinitializing menus');
        
        // Get the new value
        const newValue = changes[urlMapKey].newValue;
        try {
            // Parse and update global map
            const newMap = jsonToMap(newValue);
            globalUrlMap = newMap;
            
            // Reinitialize context menus
            menus.removeAll(() => {
                if (newMap.size > 0) {
                    for (const [name, url] of newMap) {
                        addMenuItem(name, url);
                    }
                }
                addOptionsMenuItem();
            });
        } catch (error) {
            logInfo('Storage', 'error', 'Error handling storage change:', error);
        }
    }
});