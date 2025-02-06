# ToDiscord
A browser extension for sending content to Discord Channels via WebHooks. Compatible with Manifest V3.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Download Extension:
[![](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png)](https://addons.mozilla.org/en-US/firefox/addon/to-discord/)
[![](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png)](https://chrome.google.com/webstore/detail/to-discord/epcihifbffodmnbbnjgancnlodhbkhcl)
    
## Features:

### Content Sharing
* **Firefox Support**: 
    * Selected Text
    * Hyperlinks (Images, videos, search results, etc.)
    * Current Tab URL
* **Chrome Support**: 
    * Selected Text
    * Hyperlinks (Images, videos, search results, etc.)
    * Current Tab URL

### Channel Management
* Modern, easy-to-use interface for managing Discord webhooks
* Cross-device channel synchronization (requires browser login)
* Multiple channel support with right-click context menu
* Broadcast support - send to multiple channels simultaneously using ';' separator
* Import/Export your channels via json (Check Options page)

### Technical Features
* Manifest V3 compatible
* Secure storage using browser.storage.sync API
* Modern async/await implementation for API calls
* Cross-browser compatibility (Chrome & Firefox)

## Usage
1. Add your Discord webhook URL(s) in the extension settings
2. Right-click on any content you want to share
3. Select your target Discord channel from the context menu
4. Content will be instantly shared to your Discord channel

## Screenshots:
*Firefox*
![](/images/to_discord_firefox_settings.PNG?raw=true)
![](/images/to_discord_firefox_share_demo.PNG?raw=true)
![](/images/to_discord_firefox_shared_content.PNG?raw=true)
![](/images/to_discord_firefox_share_demo2.PNG?raw=true)
![](/images/to_discord_firefox_shared_content2.PNG?raw=true)

*Chrome*
![](/images/to_discord_chrome_settings.jpg?raw=true)
![](/images/to_discord_chrome_share_demo.jpg?raw=true)
![](/images/to_discord_chrome_shared_content.jpg?raw=true)

## Privacy & Security
* No data collection
* All webhook URLs are stored locally in your browser
* Synchronization only occurs through your browser's built-in sync feature

**Special Note**: Discord icon used here is from [Discord Branding](https://discordapp.com/branding).
Thanks to the Discord team for allowing its use.
