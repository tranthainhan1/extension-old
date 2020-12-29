"use strict";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // var extensionID = 'ojllloinednhdhphmfhpabolnclnfmoh'; // Check credentials

  var extensionID = chrome.runtime.id;

  var from = request.from,
      action = request.action,
      client_url = request.client_url,
      menu_string = request.menu_string,
      mapBlogs = request.mapBlogs,
      mapArticles = request.mapArticles,
      mapCollections = request.mapCollections,
      mapProducts = request.mapProducts,
      mapPages = request.mapPages;
  var id = sender.id;
  if (from === 'install-app' && action === 'import-menu' && id == extensionID) {
    // Embed script
  
    if (document.getElementById("arena-import-script")) {
      document.getElementById("arena-import-script").remove();
    }

    if (document.getElementById("arena-import-info")) {
      document.getElementById("arena-import-info").remove();
    }
    var dataScript = document.createElement("script");
    dataScript.type = "text/javascript";
    dataScript.id = "arena-import-info";
    var menu_string_handled = menu_string.replace(/\'/gm, "\\'");
    var code = "\n        var theme_import_info = {\n          menu_string: '".concat(menu_string_handled, "',\n          mapBlogs: '").concat(JSON.stringify(mapBlogs), "',\n          mapCollections: '").concat(JSON.stringify(mapCollections), "',\n          mapProducts: '").concat(JSON.stringify(mapProducts), "',\n          mapPages: '").concat(JSON.stringify(mapPages), "',\n          mapArticles: '").concat(JSON.stringify(mapArticles), "',\n        }\n      ");
    dataScript.appendChild(document.createTextNode(code));
    document.getElementsByTagName("body")[0].appendChild(dataScript);
    var importScript = document.createElement("script");
    importScript.type = "text/javascript";
    importScript.src = chrome.runtime.getURL('scripts/import_script.js');
    importScript.id = "arena-import-script";
    document.getElementsByTagName("body")[0].appendChild(importScript);
    sendResponse({
      status: 'success',
      msg: 'We attached the script'
    });
  } else {
    sendResponse({
      status: 'error',
      msg: 'Invalid message'
    });
  }
});
