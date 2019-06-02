const discordWebHookUrl = 'https://discordapp.com/api/webhooks/584252934443761677/bGosncVaIN78i7EYDko7L3lbsnH1mVX2Zz86pxYDETV6tR4TWsPGgLaXEPBgB6JWXUtT';

function send(content) {
    //verify and replace empty content
    content = content || "Hello World!";

    //create a json from the data
    var jsonData = JSON.stringify({
        "content": content,
        "ttl": false
    });

    //send request to discord webhook
    var xhr = new XMLHttpRequest();
    xhr.open("POST", discordWebHookUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.send(jsonData);

    //read and log the response
    var response = xhr.response;
    console.log("Discord Response: " + response);

}

/*
Called when the item has been created, or when creation failed due to an error.
We'll just log success/failure here.
*/
function onCreated() {
    if (browser.runtime.lastError) {
        console.log(`Error: ${browser.runtime.lastError}`);
    } else {
        console.log("Item created successfully");
    }
}

/*
Called when the url has been set in storage.
We'll just log success here.
*/
function onSuccess() {
    console.log("Url set successfully");
}

/*
Called when there was an error.
We'll just log the error here.
*/
function onError(error) {
    console.log(`Error: ${error}`);
}

/*
Create all the context menu items.
*/
browser.menus.create({
    id: "send_to_discord",
    title: browser.i18n.getMessage("menuItemSendToDiscord"),
    contexts: ["selection", "link"]
}, onCreated);

/*
The click event listener, where we perform the appropriate action given the
ID of the menu item that was clicked.
*/
browser.menus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "send_to_discord":
            var data = info.linkUrl != null ? info.linkUrl : info.selectionText;
            send(data);
            break;
    }
});
