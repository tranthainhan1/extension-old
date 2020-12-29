"use strict";
if(!location.href.includes('firstShow=1')){
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/**
 * CREATE MENU
 */
function CreateMenuItem(menuItem, idx, applyData, mapObjects) {
  var root = false; // Root Item

  if (!Object.keys(applyData).length) {
    root = true;
    applyData = {
      changes: [],
      root: {
        title: menuItem.title
      }
    };
  } // Update apply Data


  if (menuItem.items.length) {
    for (var i = 0; i < menuItem.items.length; i++) {
      var subItem = menuItem.items[i];
      var subItemId = root ? i + 1 : parseInt(idx.toString() + (i + 1).toString());
      var subject_id = "";
      var subject_type = subItem.type;
      var subject = subItem.subject; // Handle map objects

      if (subItem.type === 'collection' || subItem.type === 'product' || subItem.type === 'blog' || subItem.type === 'article' || subItem.type === 'page') {
        if (subItem.type === 'collection') {
          if (typeof mapObjects.mapCollections[subItem.subject_id] != 'undefined') {
            subject_id = mapObjects.mapCollections[subItem.subject_id];
          } else {
            subject_type = 'http';
            subject = "/collections/".concat(subject);
          }
        } else if (subItem.type === 'product') {
          if (typeof mapObjects.mapProducts[subItem.subject_id] != 'undefined') {
            subject_id = mapObjects.mapProducts[subItem.subject_id];
          } else {
            subject_type = 'http';
            subject = "/products/".concat(subject);
          }
        } else if (subItem.type === 'blog') {
          if (typeof mapObjects.mapBlogs[subItem.subject_id] != 'undefined') {
            subject_id = mapObjects.mapBlogs[subItem.subject_id];
          } else {
            subject_type = 'http';
            subject = "/blogs/".concat(subject);
          }
        } else if (subItem.type === 'article') {
          if (typeof mapObjects.mapArticles[subItem.subject_id] != 'undefined') {
            subject_id = mapObjects.mapArticles[subItem.subject_id];
          } else {
            subject_type = 'http';
            subject = "/blogs/your-blog-handle/".concat(subject);
          }
        } else if (subItem.type === 'page') {
          if (typeof mapObjects.mapPages[subItem.subject_id] != 'undefined') {
            subject_id = mapObjects.mapPages[subItem.subject_id];
          } else {
            subject_type = 'http';
            subject = "/pages/".concat(subject);
          }
        }
      }

      var updateObj = {
        action: "create",
        id: -1 * subItemId,
        title: subItem.title,
        menu_item_type: subject_type,
        subject: subject,
        subject_id: subject_id,
        subject_params: subItem.subject_params ? subItem.subject_params : ""
      };

      if (!root) {
        updateObj.parent_menu_item_id = -1 * idx;
      }

      applyData.changes.push(updateObj);
      CreateMenuItem(subItem, subItemId, applyData, mapObjects);
    }
  }

  return applyData;
}

_asyncToGenerator(
/*#__PURE__*/
regeneratorRuntime.mark(function _callee2() {
  var importBtn;
  return regeneratorRuntime.wrap(function _callee2$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          // Check import button
          if (!$(".arn-nav-import-btn").length) {
            let text = location.href.includes('firstShow=1') ? 'Back to Arena Dashboard' : 'Arena Menu Import';
            
            importBtn = $("<a href=\"javascript:;\" class=\"arn-nav-import-btn ui-button ui-button--default ui-title-bar__action\">"+text+"</a>");
            $('.ui-title-bar__actions').append(importBtn);
          } else {
            importBtn = $(".arn-nav-import-btn ");
          }


            importBtn.off("click").on("click",
            /*#__PURE__*/
            _asyncToGenerator(
            /*#__PURE__*/


            regeneratorRuntime.mark(function _callee() {
              
              var menuList, mapBlogs, mapProducts, mapPages, mapCollections, mapArticles, mapObjects, _loop, i;

              return regeneratorRuntime.wrap(function _callee$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      menuList = JSON.parse(theme_import_info.menu_string);
                      mapBlogs = JSON.parse(theme_import_info.mapBlogs);
                      mapProducts = JSON.parse(theme_import_info.mapProducts);
                      mapPages = JSON.parse(theme_import_info.mapPages);
                      mapCollections = JSON.parse(theme_import_info.mapCollections);
                      mapArticles = JSON.parse(theme_import_info.mapArticles);
                      mapObjects = {
                        mapBlogs: mapBlogs,
                        mapProducts: mapProducts,
                        mapCollections: mapCollections,
                        mapPages: mapPages,
                        mapArticles: mapArticles
                      };

                      if (!menuList.length) {
                        _context2.next = 18;
                        break;
                      }

                      importBtn.addClass('is-loading has-loading');
                      _loop =
                      /*#__PURE__*/
                      regeneratorRuntime.mark(function _loop(i) {
                        var create_menu;
                        return regeneratorRuntime.wrap(function _loop$(_context) {
                          while (1) {
                            switch (_context.prev = _context.next) {
                              case 0:
                                create_menu = CreateMenuItem(menuList[i], i, {}, mapObjects);
                                _context.next = 3;
                                return new Promise(function (resolve, reject) {
                                  $.ajax({
                                    type: "POST",
                                    url: '/admin/menus/apply_changes.json',
                                    contentType: "application/json;charset=utf-8",
                                    dataType: 'json',
                                    data: JSON.stringify(create_menu),
                                    success: function success(response) {
                                      console.log("Menu item ".concat(menuList[i].title, " created"));
                                    },
                                    error: function error(err) {
                                      Shopify.Flash.error("Menu item ".concat(menuList[i].title, " cannot create"));
                                      console.log("Menu item ".concat(menuList[i].title, " cannot create"));
                                    },
                                    complete: function complete() {
                                      resolve(1);
                                    }
                                  });
                                });

                              case 3:
                              case "end":
                                return _context.stop();
                            }
                          }
                        }, _loop);
                      });
                      i = 0;

                    case 11:
                      if (!(i < menuList.length)) {
                        _context2.next = 16;
                        break;
                      }

                      return _context2.delegateYield(_loop(i), "t0", 13);

                    case 13:
                      i++;
                      _context2.next = 11;
                      break;

                    case 16:
                      importBtn.removeClass('is-loading has-loading');
                      Shopify.Flash.notice("Menus importing complete");

                    case 18:
                    case "end":
                      setTimeout(function(){
                        let newHref = location.href.replace('firstShow=0', 'firstShow=1');
                        window.location.href = newHref;
                      }, 1200);
                      return _context2.stop();
                  }
                }
              }, _callee);
            })));

        case 2:
        case "end":
          return _context3.stop();
      }
    }
  }, _callee2);
}))();
//# sourceMappingURL=import_script.js.map

}