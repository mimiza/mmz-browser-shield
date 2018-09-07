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
})()

let id = browser.runtime.id

let manifest = browser.runtime.getManifest()

document.querySelector('#version').innerText = manifest.version

let render = (running) => {
    let circle = document.querySelector('main .circle')
    let symbol = document.querySelector('main .symbol')
    let status = document.querySelector('main .status')
    let button = document.querySelector('#toggle')

    if(running == 'blocked') {
        circle.classList.add('activated', 'blocked')
        symbol.src = '/img/symbol-blocked.png'
        status.innerText = 'Blocked'
        status.classList.add('activated', 'blocked')
        button.innerText = 'Deactivate Shield'
        button.classList.remove('btn-success')
        button.classList.add('btn-primary')
    } else if (running == true) {
        circle.classList.remove('blocked')
        circle.classList.add('activated')
        symbol.src = '/img/symbol-activated.png'
        status.innerText = 'Activated'
        status.classList.remove('blocked')
        status.classList.add('activated')
        button.innerText = 'Deactivate Shield'
        button.classList.remove('btn-success')
        button.classList.add('btn-primary')
    } else {
        circle.classList.remove('activated')
        symbol.src = '/img/symbol-deactivated.png'
        status.innerText = 'Deactivated'
        status.classList.remove('activated')
        button.innerText = 'Activate Shield'
        button.classList.remove('btn-primary')
        button.classList.add('btn-success')
    }
}

browser.storage.local.get('running', (result) => {
    if(result.running) {
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            let tab = tabs[0];
            let hostname = new URL(tab.url).hostname;
            if(hostname == id) {
                render('blocked');
            } else render(result.running);
        });
    } else render(result.running);
})

browser.runtime.onMessage.addListener((message) => {
    switch (message.command) {
        case 'render':
            if(message.value == true) {
                browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    let tab = tabs[0];
                    let hostname = new URL(tab.url).hostname;

                    if(hostname == id) render('blocked')
                    else if(message.blacklist && message.blacklist.indexOf(hostname) > -1) render('blocked')
                    else render(message.value);
                });
            } else render(message.value);
            break;
    }
})

document.querySelector('#toggle').addEventListener('click', () => {
    browser.runtime.sendMessage(
        id,
        {command: 'toggle'}
    )
})
