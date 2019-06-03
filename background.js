const channelWebhookUrl = browser.i18n.getMessage("channelWebHookUrl");
const myWebhookUrl = browser.i18n.getMessage("discordMyUrl");
function send(url, info, tab) {
    //verify and replace empty content
    //content = content || "Hello World!";
    var data = info.linkUrl != null ? info.linkUrl : info.selectionText;
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
    id: "send_to_discord_channel",
    title: browser.i18n.getMessage("menuItemSendToDiscordChannel"),
    //contexts: ["selection", "link"]
    contexts: ["all"]
}, onCreated);

browser.menus.create({
    id: "send_to_discord_me",
    title: browser.i18n.getMessage("menuItemSendToMe"),
    //contexts: ["selection", "link"]
    contexts: ["all"]
}, onCreated);

/*
The click event listener, where we perform the appropriate action given the
ID of the menu item that was clicked.
*/
browser.menus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "send_to_discord_channel":

            send(channelWebhookUrl, info, tab);
            break;
        case "send_to_discord_me":
            send(myWebhookUrl, info, tab);
            break;
    }
});
