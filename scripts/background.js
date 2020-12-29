chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  request.method == "arnExt_init" && sendResponse();

  if (request.method == 'switchTab') {
    let tabID = +request.value;

    chrome.tabs.query({currentWindow: true, active: false}, function(tabsArray) {
      if (!tabsArray.filter(t=>t.id == tabID).length) {return;}
      chrome.tabs.update(tabID, {active: true})
    });
    sendResponse();
  }
});


chrome.tabs.onActiveChanged.addListener(function (tabId, info){
  chrome.tabs.sendMessage(tabId, "arnExt_changed");
})

chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
  console.log('onMessageExternal'); // Check credentials
  var from = request.from,
      action = request.action,
      client_url = request.client_url,
      menu_string = request.menu_string,
      mapBlogs = request.mapBlogs,
      mapCollections = request.mapCollections,
      mapProducts = request.mapProducts;
  var url = sender.url,
      tab = sender.tab;

  if(from === 'install-app' && action === 'import-menu' && (url.indexOf('install.arenacommerce.com') !== -1)) {
    if (client_url) {
      // Open tab with demo url admin
      chrome.tabs.create({
        url: "https://".concat(client_url, "/admin/menus?firstShow=0&tabID="+tab.id)
      }, function (newTab) {
        // Listener tab url changed
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
          if ('status' in tab && tab['status'] === 'complete') {
            // Matched tab appear send a message to this tab
            if (tab['url'].indexOf("".concat(client_url, "/admin/menus")) !== -1 && tab['title'].indexOf("~") !== -1) {
              chrome.tabs.sendMessage(tab.id, request, function (response) {
                sendResponse(response);
              });
            }
          }
        });
      });
    } else {
      sendResponse({
        status: "error",
        msg: "Cannot open blank demo site url"
      });
    }
  } else {
    sendResponse({
      status: "error",
      msg: "Invalid message"
    });
  }
});

/**
 * CONTENTTEXTMENU
 */
chrome.contextMenus.removeAll(function() {
  chrome.contextMenus.create({
    id:'ska8v0aakbmms',
    title: "Search in Partner stores",
    contexts:["selection","link"]
  });

  chrome.contextMenus.create({
    id:'ska8v0a252mms',
    title: "Go without twitter",
    contexts:["selection","link"]
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId == "ska8v0aakbmms") {
    let _selectionText = info.selectionText || info.linkUrl;
    if (_selectionText != 'undefined') {
      if (_selectionText.includes('.myshopify') && _selectionText.includes('https://twitter.com/')
        || _selectionText.includes('.myshopify') && _selectionText.includes('tel:')) {
        _selectionText = _selectionText.replace('https://twitter.com/', '').replace('tel:', '');
      }
      let _url = `https://partners.shopify.com/565271/stores?search_value=${_selectionText}&sort_order=created_at_desc&store_type=managed&archived=false`;
      chrome.tabs.create({url: _url});
    }
  }
  if (info.menuItemId == "ska8v0a252mms") {
    let _selectionText = info.selectionText || info.linkUrl;
    if (_selectionText != 'undefined') {
      if (_selectionText.includes('.myshopify') && _selectionText.includes('https://twitter.com/')
        || _selectionText.includes('.myshopify') && _selectionText.includes('tel:')) {
        _selectionText = _selectionText.replace('https://twitter.com/', '').replace('tel:', '');
      }
      let _url = `https://${_selectionText}`;
      chrome.tabs.create({url: _url});
    }
  }
});
