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

let id = browser.runtime.id
let site = getParameterByName('site');
let hostname = new URL(site).hostname;

$(document).ready(() => {
  $("#siteUrl").text(site);
  $("#siteUrl").attr('href', site);

  $('#btn-add-whitelist-5').on('click', () => {
    setWhiteList(5);
  });

  $('#btn-add-whitelist-30').on('click', () => {
    setWhiteList(30);
  });

  $('#btn-add-whitelist').on('click', () => {
    setWhiteList();
  });

  $('#btn-back').on('click', () => {
    window.history.back();
  });
});

function setWhiteList(minutes) {
  browser.storage.local.get('whitelist', (result) => {
    let whitelist = result.whitelist;

    let outDate = new Date();
    if(minutes) outDate = new Date(outDate.getTime() + minutes*60000)
    else outDate = outDate = new Date(outDate.getTime() + 100*365*24*60*60000);

    if(whitelist) {
      whitelist[hostname] = new Date(outDate).valueOf();
    } else {
      whitelist = {
        [hostname]: new Date(outDate).valueOf()
      };
    }

    browser.storage.local.set({ whitelist }, () => {
      browser.runtime.sendMessage(
        id,
        { command: "whitelist", data: JSON.stringify(whitelist) }
      );
      window.location.href = site;
    });
  });
}

function getParameterByName(name) {
  let match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.href);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}
