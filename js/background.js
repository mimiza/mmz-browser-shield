"use strict"

//Google Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-123894722-2']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
//Google Analytics

window.browser = (function() {
    return window.msBrowser || window.browser || window.chrome
})();

let id = browser.runtime.id;
let running = false;
let blacklist = null;
let whitelist = null;

const loadBlacklist = () => fetch(browser.runtime.getURL('/blacklist.txt'))
    .then(response => response.text())
    .then(response => response.split('\n'));

const checkTabs = () => {
    let blockedPage = browser.extension.getURL('html/blocked.html');
    browser.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            let hostname = new URL(tab.url).hostname;
            if(hostname.slice(0, 4) == 'www.') hostname = hostname.slice(4, hostname.length);
            if(blacklist.indexOf(`"${hostname}"`) > -1) {
                browser.tabs.update(tab.id, { url: `${blockedPage}?site=${tab.url}` });
            } else if(hostname == id) {
                let site = new URL(tab.url).search.slice(6);
                browser.tabs.update(tab.id, { url: site });
            }
        });
    });
}

browser.runtime.onInstalled.addListener(() => {
    running = true;
    loadBlacklist()
        .then(response => {
            blacklist = JSON.stringify(response);
            browser.storage.local.set({
                running: running,
                blacklist: JSON.stringify(response)
            });
        });
});

browser.runtime.onStartup.addListener(() => {
    browser.storage.local.get('running', (result) => {
        running = (result.running == undefined) ? true : result.running;
        loadBlacklist()
            .then(response => {
                blacklist = JSON.stringify(response);
                browser.storage.local.set({
                    running: running,
                    blacklist: JSON.stringify(response)
                });
            });
    });
});

browser.runtime.onMessage.addListener((message) => {
    switch (message.command) {
        case 'toggle':
            running = !running;
            browser.storage.local.set({
                running: running
            }, () => {
                browser.runtime.sendMessage(
                    id, {
                        command: 'render',
                        value: running,
                        blacklist: blacklist || null
                    }
                );
                if(blacklist) {
                    checkTabs();
                }
            });
            break;
        case 'whitelist':
            try {
                whitelist = JSON.parse(message.data);
            } catch (error) {
                console.log(error);
            }
            break;
    }
});

browser.storage.local.get(['blacklist', 'whitelist', 'running'], (result) => {
    if(result.blacklist) blacklist = result.blacklist;
    if(result.whitelist) whitelist = result.whitelist;
    if(result.running) running = result.running;
});

browser.webRequest.onBeforeRequest.addListener(
    (request) => {
        let frameId = request.frameId;
        let tabId = request.tabId;
        let hostname = new URL(request.url).hostname;
        let blockedPage = browser.extension.getURL('html/blocked.html');
        if(running && frameId == 0 && blacklist && blacklist.indexOf(`"${hostname}"`) > -1) {
            let now = new Date().valueOf();
            if(!whitelist || !whitelist[hostname] || whitelist[hostname] < now) {
                return { redirectUrl: `${blockedPage}?site=${request.url}` };
            }
        } else if(!running && hostname == id) {
            let site = new URL(request.url).search.slice(6);
            browser.tabs.update(tabId, { url: site });
        }
    }, {
        urls: ["<all_urls>"]
    }, ['blocking']
);
