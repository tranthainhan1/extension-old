/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

let common = {
    getThemeID: () => {
      if (window.location.href.indexOf("?") > 0) {
        return window.location.href.split("?")[0].split("themes/")[1];
      } else if(window.location.href.indexOf("#") > 0 ){
        return window.location.href.split("#")[0].split("themes/")[1];
      } else{
        return window.location.href.split("themes/")[1];
      }
    },
    extractHostname: (url) => {
      var hostname;
      if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
      }
      else {
        hostname = url.split('/')[0];
      }
      hostname = hostname.split(':')[0];
      hostname = hostname.split('?')[0];
      return hostname;
    },
    asyncRequest(url,success,fail) {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(e) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            if (typeof success === 'function'){
              success(xhr.response);
            }
            
          } else {
            if (typeof fail === 'function') {
              fail(xhr.status, null);
            }
          }
        }
      }
      xhr.open('get', url, true);
      xhr.send();
    }
  
  
}

module.exports = common;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

/*jshint esversion: 6 */
module.exports = (controller) => {
  
  const EventEmitter = __webpack_require__(3);
  
  class FileFetcher extends EventEmitter {
    
    constructor(myshopify_domain, theme_id, callback) {
      super();
      if(window.location.href.indexOf("/admin/themes/") == -1){
        return undefined;
      }
      
      this.callback = callback;
      this.myshopify_domain = myshopify_domain;
      this.fetch_complete = false;
      this.assets_filled = false;
      this.completed_keys = {};
      this.completed_indices = {};
      this.paused = true;
      this.modal;
      this.theme_id = theme_id;
      this.assets = new Map();
      this.assets.set('in_progress', 0);
      this.assets.set('num_completed', 0);
      this.assets.set('num_started', 0);
      this.disallowed = [
        'ani', 'bmp', 'cal', 'fax', 'gif', 'img', 'jbg', 'jpe', 'jpeg',
        'jpg', 'mac', 'pbm', 'pcd', 'pcx', 'pct', 'pgm', 'png', 'ppm',
        'psd', 'ras', 'tga', 'tiff', 'wmf', 'ttf', 'ttc', 'pfb', 'pfm',
        'otf', 'ttf', 'tfill', 'ffil', 'lwfn', 'dfont', 'afm', 'pfa',
        'eot', 'imap'
      ];
      this.buildFileList();
      
      function onMessage (event) {
        if (event.data.intent && (event.data.intent == "ShopifyAssetSaved") && this.fetch_complete && this.theme_id == event.data.asset.theme_id) {
          let updatedAsset = event.data.asset;
          let asset = this.assets.get(this.completed_indices[event.data.asset.key]);
          if( asset !== undefined ) {
            let currentAsset = asset.content.asset;
            
            if (!this.disallowed.includes(currentAsset.content_type)) {
              currentAsset.value = updatedAsset.value;
            }
          } else {
            let numAssets = this.assets.get("num_assets");
            this.assets.set(numAssets, { content: {asset: updatedAsset}, key: updatedAsset.key, theme_id: updatedAsset.theme_id });
            this.completed_indices[updatedAsset.key] = numAssets;
            this.assets.set("num_assets", numAssets+1);
          }
        }
      }
      
      window.addEventListener('message', onMessage.bind(this));
    }
    
    
    buildFileList() {
      
      controller.helpers.common.asyncRequest(`https://${this.myshopify_domain}/admin/themes/${this.theme_id}/assets.json`,(data) =>{
        const assets = JSON.parse(data).assets;
        const keys = Object.keys(assets);
        for (let i = 0; i < keys.length; i++) {
          this.assets.set(keys.length - i - 1, assets[keys[i]]);
          this.completed_indices[assets[keys[i]].key] = keys.length - i - 1;
        }
        this.assets.set('num_assets', keys.length);
        this.assets_filled = true;
        this.emit('assets_filled', this.assets);
      });
    }
    
    getFiles(assets) {
      for(let i = 0; i < parseInt(this.assets.get('num_assets') / 4); i++){
        this.fetchAsset(this.assets.get('num_assets'));
      }
      return this;
    }
    
    fetchCompletedCallback() {
      if (typeof this.callback == 'function')
        this.callback(this.assets);
      this.fetch_complete = true;
      this.emit('fetch_complete');
    }

    isImage(asset) {
      return asset.content_type.split("/")[0] === 'image';
    }
    
    fetchAsset(num_assets) {
      
      const re = /(?:\.([^.]+))?$/;
      if (this.assets.get('num_completed') == num_assets) {
        this.fetchCompletedCallback();
      } else if (this.assets.get('in_progress') + this.assets.get('num_completed') < num_assets) {
        const asset_id = this.assets.get('num_started');
        const asset = this.assets.get(asset_id);
        this.assets.set('num_started', this.assets.get('num_started') + 1);
        this.assets.set('in_progress', this.assets.get('in_progress') + 1);
        if (this.isImage(asset)) {
          this.assets.set(asset_id, asset);
          this.assets.set('num_completed', this.assets.get('num_completed') + 1);
          this.assets.set('in_progress', this.assets.get('in_progress') - 1);
          this.completed_keys[asset.key] = '';
          this.emit('asset_complete', this.assets.get(asset_id));
          if(this.paused == false) {
              this.fetchAsset(num_assets);
          }
        } else {
          controller.helpers.common.asyncRequest(`https://${this.myshopify_domain}/admin/themes/${this.theme_id}/assets.json?asset[key]=${asset.key}&theme_id=${this.theme_id}`, (data) =>{
            asset['content'] = JSON.parse(data);
            this.assets.set(asset_id, asset);
            this.assets.set('num_completed', this.assets.get('num_completed') + 1);
            this.assets.set('in_progress', this.assets.get('in_progress') - 1);
            this.completed_keys[asset.key] = asset.content.asset.value;
            this.emit('asset_complete', this.assets.get(asset_id));
            if(this.paused == false || this.assets.get('in_progress') == num_assets) {
                this.fetchAsset(num_assets);
            }
          });
        }
      }
    }
  }
  
  class FileSearcher {
    
    /**
     * Search through assets and display matching files
     * @param  {Map} assets             A map of assets retrieved from the FileFetcher class
     * @param  {Object} asset_container The code mirror asset-list container
     */
    constructor(fetcher, asset_container) {
      this.fetcher = fetcher;
      this.asset_container = asset_container;
      this.matches = [];
    }
    
    search(text) {
      this.matches = [];

      //if the text is blank clear the search results
      if (text == '') {
        document.querySelector(".optimize__search-all-results-number").innerHTML = this.matches.length;

        this.resetFileList();

        document.querySelector('#asset-list').childNodes.forEach((child) => {
          if (typeof child.id !== typeof undefined && child.id.indexOf('bucket') >= 0) {
            child.classList.add('is-collapsed');
          }
        });
        return false;
      }

      //if we have not fetched all the assets yet
      if (!this.fetcher.fetch_complete) {
        if(!document.querySelector('.bold__search-all-modal')) {
          this.addModal();
        }else{
            this.modal.style.display = "block";
        }

        setTimeout(() => {
          this.modal.style.opacity = 1;
        },50);
        //on click of the modal stop the search
        this.modal.addEventListener('click', () => {
          this.fetcher.paused = true;
          this.modal.style.opacity = 0;
          setTimeout(() => {
              this.modal.style.display = "none";
          }, 400)
        });
        setTimeout(() => {
          //search the assets we already loaded
          this.searchUpTo(this.fetcher.assets.get('num_completed'), text, true, this.modal);
          //for every new asset loaded, search and update the display
          this.fetcher.on('asset_complete', (asset) => this.resolveAsset(asset, text, true, this.modal));
        }, 400);
        return false;
      }
      //otherwise
      this.resetFileList();
      //collapse all folders
      document.querySelector('#asset-list').childNodes.forEach((child) => {
        if (typeof child.id !== typeof undefined && child.id.indexOf('bucket') >= 0) {
          child.classList.add('is-collapsed');
        }
      });
      //do a quick (almost instant) search of the already loaded assets
      this.searchUpTo(this.fetcher.assets.get('num_assets'), text);
    }
    
    addModal(){
      //show loading modal
      this.modal = document.createElement('DIV');
      this.modal.setAttribute("class","bold__search-all-modal");
      this.modal.innerHTML = `
        <div class="bold__search-all-inner">
            <h1>Searching and saving files</h1>
            <p>Once complete, your searches will be instant.</p>
            <div class="bold__search-info_container">
                <div class="bold__search-match_holder">
                    <div class="bold__search-into_text">Found</div>
                    <div class="bold__search-match_target">0</div>
                 </div>
                <div class="bold__search-vertical_line"></div>
                <div class="bold__search-percent_holder">
                    <span class="bold__search-percent_target">0</span>
                    <span class="bold__search-into_text">%</span>
                </div>
            </div>
            <div class="bold__search-message_holder">
                <img id="bold__search-message_img_final">
            </div>
        </div>`;
      document.getElementsByTagName('body')[0].appendChild(this.modal);
      document.querySelector("#bold__search-message_img_final").src = document.querySelector("#bold__search-message_img_temp").src;
      document.querySelector("#bold__search-message_img_final").addEventListener("click", (e) => {
        e.stopPropagation();
        var win = window.open("https://boldcommerce.com/partners/?utm_campaign=free-tools&utm_medium=referral&utm_source=search_all_extension&utm_content=loading_banner", '_blank');
        win.focus();
      });

      //when the search is complete remove the modal from view
      this.fetcher.on('fetch_complete', () => {
        //remove modal
        this.modal.style.opacity = 0;
        setTimeout(() => {
          if(this.modal.parentNode !== null){
              this.modal.parentNode.removeChild(this.modal);
          }
        }, 400)
        this.fetcher.paused = false;
        this.fetcher.removeAllListeners('asset_complete');
        this.fetcher.removeAllListeners('fetch_complete');
      })
    }

    searchUpTo(index, text, visual = false, modal) {
      for (let i = 0; i < index; i++) {
        const asset = this.fetcher.assets.get(i);
        this.resolveAsset(asset, text, visual, modal);
      }
      this.fillPageSearch(text);
    }
    
    fillPageSearch(text){
      if(typeof(E) == "object"){
        var tempGetSelection = E.getSelection;
        E.getSelection = function(){ return text;}
        window.CodeMirror.commands.find(E);
        document.querySelector('.optimize__search-all-input').focus();
        E.getSelection = tempGetSelection;
      }
    }
    
    resolveAsset(asset, text, visual = false, modal) {
      let fileEl = document.querySelector(`a[href*='${encodeURIComponent(asset.key)}']`);
      if (visual && this.fetcher.paused == false) {
        fileEl.id = `file${encodeURIComponent(asset.key)}`;
        location.href = '#' + fileEl.id;
      }
      try {
        let json = asset.content;
        if (json.asset.value.includes(text)) {
          this.addToMatchCount(json.asset.key);
          if (this.fetcher.paused == false){
            this.addBackgroundColor(fileEl);
            if(fileEl.querySelector(".bold__search_dot_market") === null) {
              fileEl.innerHTML = "<span class='bold__search_dot_market'>&middot;</span> " + fileEl.innerText;
            }
            fileEl.removeEventListener('click', this.changeBackgroundColor);
            fileEl.addEventListener('click', this.changeBackgroundColor);

            fileEl.parentElement.parentElement.parentElement.classList.remove('is-collapsed');
          }
          if (visual) {
            const matchTarget = modal.querySelector('.bold__search-match_target');
            matchTarget.innerHTML = this.matches.length;
          }
          document.querySelector(".optimize__search-all-results-number").innerHTML = this.matches.length;
        }
        const percentTarget = modal.querySelector('.bold__search-percent_target');
        percentTarget.innerHTML = parseInt((this.fetcher.assets.get('num_completed') / this.fetcher.assets.get('num_assets')) * 100);
      }
      catch (e) {
      }
    }
    
    addToMatchCount(key) {
      var notIn = true;
      for (i = 0; i < this.matches.length; i++) {
        if( this.matches[i].indexOf(key) >= 0 || key.indexOf(this.matches[i]) >= 0 ){
          notIn = false;
        }
      }
      if(notIn) {
        this.matches.push(key);
      }
    }

    static escape(str) {
      return encodeURIComponent(str);
    }

    addBackgroundColor(el){
      if(el.classList.contains("bold__search_matching_file_opened")) {
        el.classList.remove("bold__search_matching_file_opened");
      }
      el.classList.add("bold__search_matching_file");
    }

    changeBackgroundColor(e) {
      e.target.classList.remove("bold__search_matching_file");
      e.target.classList.add("bold__search_matching_file_opened");
    }

    resetFileList(){
    document.querySelectorAll('.asset-listing-theme-file').forEach((el) => {
      el.classList.remove("bold__search_matching_file");
      el.classList.remove("bold__search_matching_file_opened");
      if(el.querySelector(".bold__search_dot_market")) {
        el.removeChild(el.querySelector(".bold__search_dot_market"));
      }
      el.removeEventListener('click', this.changeBackgroundColor);
    });
    }
  }

  return {
    FileSearcher: FileSearcher,
    FileFetcher: FileFetcher,
  }

}


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

/*jshint eversion: 6*/
this.helpers = {
  ShopifyThemeHelper: __webpack_require__(1)(this),
  common: __webpack_require__(0)
};

this.E = null;

let preInit = () => {
  if(document.querySelector('.CodeMirror') !== null){
    observer.disconnect();
    init();
  }
}

let init = () => {

  registerToKeyboardEvent();

  const fileFetcher = new this.helpers.ShopifyThemeHelper.FileFetcher(
    this.helpers.common.extractHostname(window.location.href),
    this.helpers.common.getThemeID()
  );
    
  const fileSearcher = new this.helpers.ShopifyThemeHelper.FileSearcher(
    fileFetcher,
    document.getElementById('asset-list')
  );
  
  let style = document.createElement('style');
  style.innerHTML = `
.optimize__search-all{
  margin-top:5px;
  margin-bottom:5px;
  text-align: right;
  position:relative;
}
.optimize__search-all-input-holder{
  background-color:white;
  width: 290px;
  margin-left: auto;
  border-radius: 4px;
  border: 1px solid #d3dbe2;
}
.optimize__search-all-results-number{
  width:30px;
  height:28px;
  display:inline-block;
  line-height:28px;
  color: #007ace;
  border-right:1px solid #d3dbe2;
  text-align:center;
}
.optimize__search-all input{
  width: 250px;
  text-align: left;
  border:none;
}
.bold__search-all-modal {
  position: fixed;
  top: 0;
  left: 0;
  background-color: rgba(107, 117, 132, 0.85);
  width: 100%;
  height: 100vh;
  z-index: 999999999;
  color: white;
  opacity:0;
  transition: opacity 0.4s linear;
}
.bold__search-all-inner {
  text-align: center;
  position: absolute;
  top: 50%;
  width: 100vw;
  transform: translateY(-50%);
}
.bold__search-all-inner h1 {
  margin: 0 20px 0 20px;
  font-size: 4em;
  text-shadow: 1px 1px 20px rgba(0,0,0,0.3);
}
.bold__search-all-inner p {
  margin-top:10px;
  font-size: 1em;
  text-shadow: 1px 1px 20px rgba(0,0,0,0.3);
}
.bold__search-info_container{
  width:50%;
  display:flex;
  margin-left:auto;
  margin-right:auto;
  margin-top:40px;
  margin-bottom:40px;
}
.bold__search-into_text{
  vertical-align: top;
  display: inline-block;
}
.bold__search-percent_holder{
  width:47%;
  font-size: 1em;
  align-self: flex-end;
  text-align:left;
  line-height: 75px;
}
.bold__search-percent_target{
  font-size: 3em;
  display: inline-block;
}
.bold__search-vertical_line{
  width: 0px;
  height:75px;
  border-left:solid white 2px;
  margin: 0 2% 0 2%;
}
.bold__search-match_holder{
  width:47%;
  font-size: 1em;
  align-self: flex-end;
  text-align:right;
  line-height: 75px;
}
.bold__search-match_target{
  font-size: 3em;
  display: inline-block;
}
.bold__search-message_holder{
  height:60vh;
  width:90%;
  margin-left:auto;
  margin-right:auto;
  text-align:center;
}
#bold__search-message_img_final{
  max-width:100%;
  max-height:100%;
  display: block;
  margin: 2px auto 0 auto;
  cursor:pointer;
  border-radius:2px;
  border: solid transparent 2px;
}
#bold__search-message_img_final:hover{
  border: solid white 2px;
}
.bold__search_dot_market{
  float: left;
  width: 0px;
  height:20px;
  position: relative;
  left: -9px;
  top: -2px;
  font-size: 40px;
}
.bold__search_matching_file .bold__search_dot_market{
  color:rgba(255,255,0,0.4);
}
.bold__search_matching_file_opened .bold__search_dot_market{
  color:rgba(255, 255, 0, 0.1);
}
.bold__search_matching_file{
  background-color:rgba(255,255,0,0.4);
}
.bold__search_matching_file_opened{
  background-color:rgba(255, 255, 0, 0.1)
}
.asset-listing-theme-file{
  outline:none;
}
`;
  

  
  let search_all = document.createElement('div');
  //search all input
  search_all.className = 'optimize__search-all';
  search_all.innerHTML = `
          <div class="optimize__search-all-input-holder">
            <div class="optimize__search-all-results-number">0</div>
            <input type="search" placeholder="search all" class="optimize__search-all-input" />
          </div>
        `;

  if(document.querySelector('main header') === null){
    const referenceNode = document.querySelector(".template-editor-titlebar");

    referenceNode.parentNode.insertBefore(style, referenceNode.nextSibling);
    referenceNode.parentNode.insertBefore(search_all, referenceNode.nextSibling);

    let moreStyle = document.createElement('style');
    moreStyle.innerHTML = `
      .template-editor-layout{
          height: calc(100vh - 10.8rem - 40px);
      }`;

    referenceNode.parentNode.insertBefore(moreStyle, referenceNode.nextSibling);

  } else {
    document.querySelector('main header').appendChild(search_all);
    document.querySelector('main header').appendChild(style);
  }




  let input = search_all.querySelector('.optimize__search-all-input');

  //start pulling assets
  fileFetcher.on('fetch_complete', () => {
    input.removeEventListener('keypress', enterKeyPress);
    input.addEventListener('keyup', (e) => {
      fileSearcher.search(e.currentTarget.value);
    });
    input.addEventListener('change', (e) => {
      fileSearcher.search(e.currentTarget.value);
    });
  })

  document.querySelector('.optimize__search-all-input').addEventListener ("search", function(e){
    if(e.target.value == ''){
      fileSearcher.resetFileList();
      fileSearcher.fillPageSearch("");
    }
    document.querySelector('#asset-list').childNodes.forEach((child) => {
      if (typeof child.id !== typeof undefined && child.id.indexOf('bucket') >= 0) {
        child.classList.add('is-collapsed');
      }
    });
  });

  const enterKeyPress = (e) => {
    if(e.keyCode == 13){
      fileFetcher.paused = false;
      fileFetcher.getFiles();
      fileSearcher.search(e.currentTarget.value);
    }
  }
  //search on enter key press
  input.addEventListener('keypress', enterKeyPress);

  rebindSaveAsset();
}

function registerToKeyboardEvent(){
  let tempNewlineAndIndent= window.CodeMirror.commands.newlineAndIndent;
  window.CodeMirror.commands.newlineAndIndent = function(e){ if(typeof(this.E) != "object"){this.E=e;} tempNewlineAndIndent(e);}
  let tempDefaultTab = window.CodeMirror.commands.defaultTab;
  window.CodeMirror.commands.defaultTab = function(e){ if(typeof(this.E) != "object"){this.E=e;} tempDefaultTab(e);}
  let tempGoLineDown = window.CodeMirror.commands.goLineDown;
  window.CodeMirror.commands.goLineDown = function(e){ if(typeof(this.E) != "object"){this.E=e;} tempGoLineDown(e);}
  let tempGoLineUp = window.CodeMirror.commands.goLineUp;
  window.CodeMirror.commands.goLineUp = function(e){ if(typeof(this.E) != "object"){this.E=e;} tempGoLineUp(e);}
  let tempGoCharLeft = window.CodeMirror.commands.goCharLeft;
  window.CodeMirror.commands.goCharLeft = function(e){ if(typeof(this.E) != "object"){this.E=e;} tempGoCharLeft(e);}
  let tempGoCharRight = window.CodeMirror.commands.goCharRight;
  window.CodeMirror.commands.goCharRight = function(e){ if(typeof(this.E) != "object"){this.E=e;} tempGoCharRight(e);}
}

function newSaveAsset(oldSaveAsset){
  return function() {
    oldSaveAsset();
    let asset = {
      theme_id: Shopify.templateEditor.currentTab.theme_id,
      key: Shopify.templateEditor.currentTab.key,
      value: Shopify.templateEditor.currentTab.doc.getValue()
    }
    window.postMessage({
      intent: 'ShopifyAssetSaved',
      asset: asset
    }, "*");
  };
}

function rebindSaveAsset(){
  let oldSaveAsset = Shopify.templateEditor.saveAsset.bind(Shopify.templateEditor);

  Shopify.templateEditor.saveAsset = newSaveAsset(oldSaveAsset).bind(Shopify.templateEditor);
  Shopify.templateEditor.bindKeys({
    "Cmd-S": Shopify.templateEditor.saveAsset,
    "Ctrl-S": Shopify.templateEditor.saveAsset
  });
}

// Create an observer instance linked to the callback function
var observer = new MutationObserver(preInit);

// Start observing the target node for configured mutations
var config = { attributes: true, childList: true, subtree: true };
observer.observe(document.body, config);


/***/ }),
/* 3 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ })
/******/ ]);