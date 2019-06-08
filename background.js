//this is prefix string for menu item title
const menuTitlePrefix = browser.i18n.getMessage("menuTitlePrefix");

//this is the storage for urls
var urlMap;

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
    print('discord url: ' + url);

    //check the content, if it is selected text or a link
    var data = info.linkUrl != null ? info.linkUrl : info.selectionText;
    //check if the user has not clicked any link or selected any text
    data = data || tab.url;

    //create a json from the data
    var jsonData = JSON.stringify({
        "content": data,
        "ttl": false
    });

    //send request to discord webhook
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.send(jsonData);

    //read and log the response
    var response = xhr.response;
    print("Discord Response: " + response);
}

/** 
 * Called when the item has been created, or when creation failed due to an error.
 * 
 * We'll just log success/failure here.
 * 
*/
function onCreated() {
    if (browser.runtime.lastError) {
        print(`Error: ${browser.runtime.lastError}`);
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
            browser.menus.create({
                id: name,
                title: menuTitlePrefix + " " + name,
                //this will allow the options pop up to be visible 
                //When user has cursor on a link, a tab or anywhere in the page.
                //Also When a text selection has been made.
                contexts: ["link", "selection", "tab", "page"]
            }, onCreated);
        }
    }
    browser.menus.create({
        id: "options",
        title: browser.i18n.getMessage("menuTitleOptions"),
        //this will allow the options pop up to be visible everywhere on the browser. 
        contexts: ["all", "tab"]
    }, onCreated);
}

/*
The click event listener, where we perform the appropriate action given the
ID of the menu item that was clicked.
*/
browser.menus.onClicked.addListener((info, tab) => {
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
 * Print the message provided in the browser console
 * @param {String} message
 */
function print(message) {
    console.log(message);
}

/**
 * This method will open the options page of the addon
 */
function openOptionsPage() {
    browser.runtime.openOptionsPage();
}

/**
 * This method will be called when the extension has been loaded for the first time
 *  in current browser session.
 */
function initValues() {
    browser.storage.local.get()
        .then((settings) => {
            urlMap = settings.url_map;
            generateMenuItems();
        });
}

//listen for the event to start the initial process of the page
document.addEventListener("DOMContentLoaded", initValues);
//redirect user to options page on click of the extension icon.
browser.browserAction.onClicked.addListener(openOptionsPage);