window.requestAnimFrame = (function () {return (window.requestAnimationFrame || window.webkitRequestAnimationFrame ||window.mozRequestAnimationFrame ||window.oRequestAnimationFrame ||window.msRequestAnimationFrame ||function (callback) {window.setTimeout(callback, 1000 / 60)})}())
window.cancelAnimFrame = (function () {	return (window.cancelAnimationFrame ||window.webkitCancelAnimationFrame ||window.mozCancelAnimationFrame ||window.oCancelAnimationFrame ||window.msCancelAnimationFrame ||function (id) {window.clearTimeout(id)})}())
window.addEventListener('load', ()=>{
	arnExt.init();
	/*arnExt.removeMenu()*/
})

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
	request == 'arnExt_changed' && arnExt.handleData() && sendResponse();
});

var arnExt = {
	init : function(){
		this.icon_picker_data 	= [{key: 'theme',value: undefined},{key: 'view',value: 5},{key: 'search_data', value: []}];
		this.data_icon_theme = {};
		this.domainsRule 		= null;
		this.iconPicker  		= true;
		this.datepicker  		= true;
		this.head_collapsed  	= true;
		this.tempIndex 			= 0;
		this.tempArr 			= [];
		arnExt.handleData('init');
		arnExt.alwayExist();
	}

	,debounceTime : function(func, time){
		let timeout;
		return function(){
			let context = this, args = arguments;
			let excuteFn = function(){func.apply(context, args);}
			clearTimeout(timeout);
			timeout = setTimeout(excuteFn,time);
		};
	}

	,_requestAjax : (url, method = 'get', type = 'json', data={})=>{
		return  jQuery.ajax({
			url: url,
			method: method,
			dataType: type,
			data: data
		})
	}

	,notify : (c=null ,type=null)=>{
		if (c != null) {
			let e = $('#arnExtension-notify');1
			e.attr('class', 'arnExtension-notify');

			if (type == 'info') {
				e.addClass('arnExtension-notify--info');
			}else{
				e.addClass('arnExtension-notify--error');
			}
			e.find('.arnExtension-notify--content').html(c);
			e.addClass('arnExtension-notify--showing');
			arnExt.debounceTime(()=>{e.removeClass('arnExtension-notify--showing')}, 3000)();
		}
	}

	,check_whitelist : function(){

		if (!$('script[src*="\/\/cdn.shopify.com"]').length) {return false;}

		let domainsRule = arnExt.domainsRule, _local = location.href;

		if (domainsRule == null || ( $.isEmptyObject(domainsRule[0].value) && $.isEmptyObject(domainsRule[1].value))) {
			return true;
		}
		else{
			let _whiteListed = domainsRule[0].value.replace(/\s/g, "").split(','), _whiteBool = false;
			let _blackListed = domainsRule[1].value.replace(/\s/g, "").split(','), _blackBool = true;

			if (!$.isEmptyObject(domainsRule[0].value)) {
				for (let i = 0; i < _whiteListed.length; i++) {
					if (_local.includes(_whiteListed[i].toString().trim())) {
						_whiteBool = true;
					}
				}
			}else{
				_whiteBool = true;
			}

			if (!$.isEmptyObject(domainsRule[1].value)) {
				for (let i = 0; i < _blackListed.length; i++) {
					if (_local.includes(_blackListed[i].toString().trim())) {
						_blackBool = false;
					}
				}
			}

			if (_whiteBool && _blackBool) {
				return true;
			}else{
				return false;
			}

		}
	}

	,handleData : function(type=null){

		if (typeof chrome.storage == 'undefined') {alert('An error from Arena Shopify Admin Extension\r\nPlease reload the page.');}

		chrome.storage.sync.get(['ArenaData_checkbox', 'ArenaData_domains'],function(result){

			arnExt.domainsRule = result['ArenaData_domains'] === undefined ? null : result['ArenaData_domains'];

			if (!arnExt.check_whitelist()) {$('#arnExt').remove();return;}
			let _checkboxData = result['ArenaData_checkbox'];

			if (_checkboxData === undefined) {
				_checkboxData = [
				{id: "quick_______Bar",value: true},
				{id: "font_____Picker",value: true},
				{id: "date_____Picker",value: true},
				{id: "headerCollapsed",value: true},
				{id: "spacing____Resp",value: true},
				{id: "column_____Resp",value: true},
				{id: "rich_____Editor",value: true},
				{id: "content__Editor",value: true}]
			}

			!$('#arnExt').length && $('body').append(`<div id="arnExt"></div>`);
			if (type == 'init') {arnExt.createPopup();}

			if (_checkboxData && _checkboxData.length) {
				for (var i = 0; i < _checkboxData.length; i++) {
					let _checkbox = _checkboxData[i];
					switch (_checkbox.id) {
						case 'font_____Picker':
						arnExt.iconPicker = _checkbox.value;
						$(`div[data-eid="${_checkbox.id}"]`).attr('data-enable', _checkbox.value);
						break;
						case 'date_____Picker':
						arnExt.datepicker = _checkbox.value;
						break;
						case 'headerCollapsed':
						_checkbox.value ? arnExt.createHeaderCollapsed() : arnExt.removeHeaderCollapsed();
						arnExt.head_collapsed = _checkbox.value;
						break;
						default:
						$(`div[data-eid="${_checkbox.id}"]`).attr('data-enable', _checkbox.value);
						break;
					}
				}
			}
		})
	}

	,alwayExist : ()=>{

		var loopSeconds, everySeconds = ()=>{
			loopSeconds = window.requestAnimFrame(everySeconds);
			let _new_section = $('.te-sidebar__content[component="UI.PanelContainer"]').find('.te-panel.te-panel--is-active');
			if (_new_section.length) {
				arnExt.createHeaderCollapsed(_new_section);
				window.cancelAnimFrame(loopSeconds);
			}
		}

		$(document)
		.on('click','.arnCollapse',function(e){
			if (!arnExt.head_collapsed) {return}

				let _this = $(this);
			if (e.ctrlKey || e.metaKey) {
				let _parent = _this.parents('.ui-accordion__panel, .te-panel__body').first();
				if (_parent.find('.ui-accordion__panel').length) {
					let __parent = _parent.find('section.theme-editor__card');
					_parent = __parent;
				}
				if (_parent.find('.arnCollapse.arnCollapse--active').length) {
					_parent.find('.arnCollapse.arnCollapse--active').trigger('click');
				}else{
					_parent.find('.arnCollapse').trigger('click');
				}
			}else{
				_this.toggleClass('arnCollapse--active').find('.ui-subheading .arnSVG').toggleClass('next-icon--rotate-270');
				_this.nextUntil('header.arnCollapse,footer').slideToggle();
			}

		})
		.on('click', '#SidebarIndex div[component="UI.SectionList"] > *' , (e)=>{
			if (!arnExt.head_collapsed) {return}
				let _section_id = $(e.currentTarget).closest('ul[data-fixed-section-id]').attr('data-fixed-section-id')
			,_section = $('.te-panel[data-panel-id="'+_section_id+'"]');

			if (_section.length && !_section.find('.arnCollapse').length) {
				arnExt.createHeaderCollapsed(_section);
			}
		})

		.on('click', '.theme-editor__add-section',(e)=>{
			if ($(e.target).attr('class').includes('theme-editor__add-section-btn') && arnExt.head_collapsed) {
				loopSeconds = window.requestAnimFrame(everySeconds);
			}
		})

		.on('click', 'li[component="UI.BlockPicker"]',(e)=>{
			if (!arnExt.head_collapsed) {return}
				let _this = $(e.currentTarget), loopBlock;
			if (_this.children()[0].tagName.toLowerCase() == 'button' || $(e.target).parents('ul').first().attr('class').includes('theme-editor-action-list--compact')) {
				window.cancelAnimFrame(loopBlock);
				let everySecondsBlock = ()=>{
					loopBlock = window.requestAnimFrame(everySecondsBlock);
					let _new_section = _this.prev().find('.ui-accordion.ui-accordion--is-expanded');
					if (_new_section.length) {
						arnExt.createHeaderCollapsed_block(_new_section.find('.ui-accordion__panel'));
						window.cancelAnimFrame(loopBlock);
					}
				}

				loopBlock = window.requestAnimFrame(everySecondsBlock);
			}
		})

		if(location.href.includes('/admin/menus') && location.href.includes('firstShow=1')){
			var importBtn;

			if (!$(".arn-nav-import-btn").length) {
				let text = location.href.includes('firstShow=1') ? 'Back to Arena Dashboard' : 'Arena Menu Import';

				importBtn = $("<a href=\"javascript:;\" class=\"arn-nav-import-btn ui-button ui-button--default ui-title-bar__action\">"+text+"</a>");
				$('.ui-title-bar__actions').append(importBtn);
			} else {
				importBtn = $(".arn-nav-import-btn ");
			}

			importBtn.off("click").on("click",e=>{
				let tabID = location.href.split('tabID=')[1] || '';
				try {
					tabID != '' && chrome.runtime.sendMessage('gohkmbgkecjbdaifhnjejocobijidfei',{method: "switchTab", value: tabID});
				} catch(e) {
					console.log(e);
				}
			})

		}

	}

	,createPopup : ()=>{
		arnExt.createInnerHTML('notify');
		if (location.pathname.includes('/admin')) {
			if (location.pathname.includes('/editor')) {
				arnExt.createDatepicker();
				arnExt.createIconPicker();
				arnExt.createEditor();
				arnExt.createResponsiveColumn();
				arnExt.createSpacing();
			}
			else{
				arnExt.createInnerHTML('bubble_add');
				arnExt.createInnerHTML('popup_layout_grid');
			}
		}
		else{
			arnExt.createInnerHTML('bubble_quick');
			arnExt.createInnerHTML('popup_layout_quick');
		}
		arnExt.popupEvent();
	}

	,createInnerHTML : (type)=>{
		let html = '', id='';
		switch (type) {
			case 'bubble_quick':
			id 	 ='arnExtension_bubble_quicklink';
			html = `
			<div id="arnExtension_bubble_quicklink" class="arnExtension-bubble-popup arnExtension-fixed ui-drag-element" data-target="#arnExtension_quicklink" data-eid="quick_______Bar"><div class="arnExtension-popup-inner"><div class="arnExtension-popup-inner--top ui-drag--enabled"><div class="arnExtension-popup-icon"><svg width="22" height="6" viewBox="0 0 22 6" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M19 1C20.103 1 21 1.897 21 3C21 4.103 20.103 5 19 5C17.897 5 17 4.103 17 3C17 1.897 17.897 1 19 1Z" stroke="#212B36"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M11 1C12.103 1 13 1.897 13 3C13 4.103 12.103 5 11 5C9.897 5 9 4.103 9 3C9 1.897 9.897 1 11 1Z" stroke="#212B36"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M3 1C4.103 1 5 1.897 5 3C5 4.103 4.103 5 3 5C1.897 5 1 4.103 1 3C1 1.897 1.897 1 3 1Z" stroke="#212B36"/> </svg></div></div><div class="arnExtension-popup-inner--bottom ui-drag--disabled arnExtension-popup--clicked"><div class="arnExtension-popup-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 15.6C10.0116 15.6 8.40001 13.9884 8.40001 12C8.40001 10.0116 10.0116 8.39995 12 8.39995C13.9884 8.39995 15.6 10.0116 15.6 12C15.6 13.9884 13.9884 15.6 12 15.6ZM20.4 12C20.4 11.364 20.3232 10.7472 20.1888 10.1508L22.8 8.67835L20.3436 4.52155L17.8164 5.94715C16.8636 5.03155 15.6996 4.33915 14.4 3.95275V1.19995H9.60001V3.95275C8.30041 4.33915 7.13641 5.03155 6.18361 5.94715L3.65641 4.52155L1.20001 8.67835L3.81121 10.1508C3.67681 10.7472 3.60001 11.364 3.60001 12C3.60001 12.636 3.67681 13.2528 3.81121 13.8492L1.20001 15.3216L3.65641 19.4783L6.18361 18.0527C7.13641 18.9671 8.30041 19.6608 9.60001 20.0471V22.7999H14.4V20.0471C15.6996 19.6608 16.8636 18.9683 17.8164 18.0527L20.3436 19.4783L22.8 15.3216L20.1888 13.8492C20.3232 13.2528 20.4 12.636 20.4 12Z" fill="white"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M23.3899 14.2766L21.5191 13.2206C21.5731 12.8102 21.5995 12.4022 21.5995 12.0002C21.5995 11.5982 21.5731 11.1902 21.5191 10.7786L23.3899 9.72384C23.6707 9.56424 23.8759 9.30024 23.9587 8.98944C24.0427 8.67744 23.9971 8.34504 23.8339 8.06784L21.3775 3.91104C21.0451 3.34944 20.3275 3.15624 19.7539 3.47664L17.9647 4.48584C17.2447 3.91464 16.4455 3.44784 15.5995 3.10344V1.20024C15.5995 0.537844 15.0631 0.000244141 14.3995 0.000244141H9.59951C8.93711 0.000244141 8.39951 0.537844 8.39951 1.20024V3.10344C7.55351 3.44784 6.75431 3.91464 6.03551 4.48584L4.24511 3.47664C3.67511 3.15624 2.95511 3.34944 2.62271 3.91104L0.166314 8.06784C0.00191377 8.34504 -0.0424862 8.67744 0.0415138 8.98944C0.124314 9.30024 0.329514 9.56424 0.610314 9.72384L2.48111 10.7786C2.42711 11.1902 2.39951 11.5982 2.39951 12.0002C2.39951 12.4022 2.42711 12.8102 2.48111 13.2206L0.610314 14.2766C0.329514 14.435 0.124314 14.7002 0.0415138 15.011C-0.0424862 15.323 0.00191377 15.6542 0.166314 15.9326L2.62271 20.0894C2.95511 20.651 3.67511 20.8466 4.24511 20.5238L6.03551 19.5134C6.75431 20.0858 7.55351 20.5526 8.39951 20.8958V22.8002C8.39951 23.4626 8.93711 24.0002 9.59951 24.0002H14.3995C15.0631 24.0002 15.5995 23.4626 15.5995 22.8002V20.8958C16.4455 20.5526 17.2447 20.0858 17.9647 19.5134L19.7539 20.5238C20.3275 20.8466 21.0451 20.651 21.3775 20.0894L23.8339 15.9326C23.9971 15.6542 24.0427 15.323 23.9587 15.011C23.8759 14.7002 23.6707 14.435 23.3899 14.2766ZM19.0183 10.4139C19.1395 10.9515 19.1995 11.4855 19.1995 12.0003C19.1995 12.5139 19.1395 13.0479 19.0183 13.5867C18.9019 14.1027 19.1383 14.6343 19.5991 14.8935L21.1435 15.7647L19.9087 17.8551L18.4051 17.0067C17.9455 16.7475 17.3659 16.8195 16.9855 17.1867C16.1563 17.9823 15.1435 18.5739 14.0575 18.8967C13.5487 19.0479 13.1995 19.5159 13.1995 20.0475V21.6003H10.7995V20.0475C10.7995 19.5159 10.4503 19.0479 9.94271 18.8967C8.85551 18.5739 7.84271 17.9823 7.01471 17.1867C6.63431 16.8195 6.05351 16.7475 5.59391 17.0067L4.09151 17.8551L2.85551 15.7647L4.39991 14.8935C4.86191 14.6343 5.09711 14.1027 4.98191 13.5867C4.86071 13.0479 4.79951 12.5139 4.79951 12.0003C4.79951 11.4855 4.86071 10.9515 4.98191 10.4139C5.09711 9.89789 4.86191 9.36629 4.39991 9.10589L2.85551 8.23469L4.09151 6.14429L5.59391 6.99269C6.05471 7.25309 6.63431 7.18109 7.01471 6.81389C7.84271 6.01709 8.85551 5.42669 9.94271 5.10269C10.4503 4.95149 10.7995 4.48349 10.7995 3.95309V2.40029H13.1995V3.95309C13.1995 4.48349 13.5487 4.95149 14.0575 5.10269C15.1435 5.42669 16.1563 6.01709 16.9855 6.81389C17.3659 7.18109 17.9443 7.25189 18.4051 6.99269L19.9087 6.14429L21.1435 8.23469L19.5991 9.10589C19.1383 9.36629 18.9019 9.89789 19.0183 10.4139ZM11.9999 7.20004C9.35267 7.20004 7.19987 9.35284 7.19987 12C7.19987 14.6472 9.35267 16.8 11.9999 16.8C14.6471 16.8 16.7999 14.6472 16.7999 12C16.7999 9.35284 14.6471 7.20004 11.9999 7.20004ZM11.9999 14.4C10.6763 14.4 9.59987 13.3236 9.59987 12C9.59987 10.6764 10.6763 9.60004 11.9999 9.60004C13.3235 9.60004 14.3999 10.6764 14.3999 12C14.3999 13.3236 13.3235 14.4 11.9999 14.4Z" fill="#212B36"/></svg></div><div class="arnExtension-popup-text"><span>Shortcut</span></div></div></div></div>
			`;
			break;

			case 'popup_layout_quick':
			id='arnExtension_quicklink';
			html = `
			<div id="arnExtension_quicklink" class="arnExtension-popup-layout ui-drag-element arnExtension-fixed ui-drag--enabled" data-eid="quick_______Bar"> <div class="arnExt-header"> <div class="arnExt-header-inner"> <div class="arnExt-header--title"><span>Quick Links</span></div><div class="arnExt-header--close"> <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_close_btn"></use></svg> </div></div></div><div class="arnExtension-popup-body ui-drag--disabled"> <div class="arnExt-body"> <div class="arnExt-body-inner"> <div class="arnExt-body--text"><span>Customize Theme & Content Editing</span></div><div class="arnExt-body--group-buttons arnExt-grid-3"> <div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="editor_customize"/> <div class="arnExt-ui-button--svg"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_editor_customize"></use></svg> </div><div class="arnExt-ui-button--label"><span>Section Content</span></div></div></div><div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="edit_content"/> <div class="arnExt-ui-button--svg"> <svg width="23" height="30" viewBox="0 0 23 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_edit_content"></use></svg> </div><div class="arnExt-ui-button--label"><span>Edit Content</span></div></div></div><div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="customfields"/> <div class="arnExt-ui-button--svg"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_customfields"></use></svg> </div><div class="arnExt-ui-button--label"><span>Edit Custom Field</span></div></div></div></div><div class="arnExt-body--text"><span>Store Settings</span></div><div class="arnExt-body--group-buttons arnExt-grid-3"> <div class="arnExt-ui-button"> <input type="hidden" name="arnExt-ui-button-data" value="settings/general"/> <div class="arnExt-ui-button-inner"> <div class="arnExt-ui-button--svg"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_settings_general"></use></svg> </div><div class="arnExt-ui-button--label"><span>General</span></div></div></div><div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="customers"/> <div class="arnExt-ui-button--svg"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_customers"></use></svg> </div><div class="arnExt-ui-button--label"><span>Customers</span></div></div></div><div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="discounts"/> <div class="arnExt-ui-button--svg"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_discounts"></use></svg> </div><div class="arnExt-ui-button--label"><span>Discount</span></div></div></div><div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="apps"/> <div class="arnExt-ui-button--svg"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_apps"></use></svg> </div><div class="arnExt-ui-button--label"><span>Installed Apps</span></div></div></div><div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="menus"/> <div class="arnExt-ui-button--svg"> <svg width="30" height="8" viewBox="0 0 30 8" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_menus"></use></svg> </div><div class="arnExt-ui-button--label"><span>Menu</span></div></div></div><div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="products"/> <div class="arnExt-ui-button--svg"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_products"></use></svg> </div><div class="arnExt-ui-button--label"><span>Products</span></div></div></div><div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="code_editor"/> <div class="arnExt-ui-button--svg"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_code_editor"></use></svg> </div><div class="arnExt-ui-button--label"><span>Code Editor</span></div></div></div><div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="sections_editor"/> <div class="arnExt-ui-button--svg"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_sections_editor"></use></svg> </div><div class="arnExt-ui-button--label"><span>Sections</span></div></div></div><div class="arnExt-ui-button"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="extra_products"/> <div class="arnExt-ui-button--svg"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_extra_products"></use></svg> </div><div class="arnExt-ui-button--label"><span>Extra Products</span></div></div></div></div></div></div></div><div class="arnExt-footer"> <div class="arnExt-footer-inner"> <div class="logo-company"> <span class="logo"> <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_arnLogo"></use></svg> </span> <a href="https://www.arenacommerce.com/" class="logo-name" target="_blank">ArenaCommerce</a> </div></div></div><svg xmlnsxlink="http://www.w3.org/2000/svg" style="display: none;"> <symbol id="extSVG_close_btn"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="#212B36"/> <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="1" y="1" width="18" height="17"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="white"/> </mask> <g mask="url(#mask0)"></g> </symbol> <symbol id="extSVG_editor_customize"> <path fill-rule="evenodd" clip-rule="evenodd" d="M24 12C22.3455 12 21 10.6545 21 9H27C27 10.6545 25.6545 12 24 12V12ZM24 21H6V15C7.7895 15 9.4005 14.2125 10.5 12.9645C11.5995 14.2125 13.2105 15 15 15C16.7895 15 18.4005 14.2125 19.5 12.9645C20.5995 14.2125 22.2105 15 24 15V21ZM19.0785 27H10.9215C11.457 25.947 11.7255 24.849 11.862 24H18.138C18.2745 24.849 18.543 25.947 19.0785 27V27ZM18 9C18 10.6545 16.6545 12 15 12C13.3455 12 12 10.6545 12 9H18ZM3 9H9C9 10.6545 7.6545 12 6 12C4.3455 12 3 10.6545 3 9V9ZM5.42702 3H24.573L26.073 6H3.92702L5.42702 3ZM29.8425 6.8295L26.8425 0.8295C26.5875 0.321 26.0685 0 25.5 0H4.5C3.9315 0 3.4125 0.321 3.1575 0.8295L0.1575 6.8295C0.054 7.0365 0 7.2675 0 7.5V9C0 11.211 1.2165 13.125 3 14.166V22.5C3 23.328 3.6705 24 4.5 24H8.8065C8.571 25.1205 8.0445 26.55 6.8295 27.1575C6.207 27.4695 5.88 28.167 6.039 28.845C6.201 29.5215 6.804 30 7.5 30H22.5C23.196 30 23.799 29.5215 23.961 28.845C24.12 28.167 23.793 27.4695 23.1705 27.1575C21.969 26.5575 21.441 25.1235 21.201 24H25.5C26.3295 24 27 23.328 27 22.5V14.166C28.7835 13.125 30 11.211 30 9V7.5C30 7.2675 29.946 7.0365 29.8425 6.8295V6.8295Z" fill="#7084CB"/> </symbol> <symbol id="extSVG_edit_content"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3.75 16.875H18.75V13.125H3.75V16.875ZM3.75 24.375H18.75V20.625H3.75V24.375ZM3.75 9.375H11.25V5.625H3.75V9.375ZM21.9506 6.17437L16.3256 0.549375C15.975 0.196875 15.4988 0 15 0H1.875C0.838125 0 0 0.84 0 1.875V28.125C0 29.16 0.838125 30 1.875 30H20.625C21.6619 30 22.5 29.16 22.5 28.125V7.5C22.5 7.00313 22.3031 6.525 21.9506 6.17437V6.17437Z" fill="#7084CB"/> </symbol> <symbol id="extSVG_customfields"> <path d="M11.299 25.8534H5.44025L4.13247 30.0002H0L6.51255 12.0823H10.305L16.7653 30.0002H12.6328L11.299 25.8534ZM10.305 22.8074L8.42188 17.0225H8.26494L6.43408 22.8074H10.305Z" fill="#5C6AC4"/> <path d="M14.2283 18.5064C12.4672 18.5064 10.9502 18.0883 9.67729 17.2521C8.42188 16.3989 7.46283 15.2641 6.80027 13.8478C6.1551 12.4314 5.83252 10.8957 5.83252 9.24035C5.83252 7.58512 6.1551 6.05787 6.80027 4.65858C7.46283 3.24222 8.42188 2.11597 9.67729 1.27981C10.9502 0.426583 12.4672 0 14.2283 0C16.373 0 18.1254 0.614293 19.4855 1.84294C20.8455 3.07159 21.7261 4.65858 22.1272 6.60392H18.1777C17.9685 5.7166 17.5151 4.97427 16.8177 4.37705C16.1376 3.77977 15.2919 3.48116 14.2806 3.48116C12.8857 3.48116 11.8307 4.01864 11.1159 5.09374C10.4184 6.15169 10.0696 7.53396 10.0696 9.24035C10.0696 10.981 10.4184 12.3802 11.1159 13.4382C11.8307 14.4962 12.8857 15.0252 14.2806 15.0252C15.2745 15.0252 16.1027 14.7351 16.7653 14.155C17.4454 13.5747 17.8987 12.8836 18.1254 12.0816H22.0225C21.639 13.9587 20.7671 15.503 19.407 16.7146C18.0644 17.9091 16.3381 18.5064 14.2283 18.5064Z" fill="#5C6AC4"/> <path d="M22.2319 15.5635V19.3518H29.0845V22.449H22.2319V30.0002H18.1255V12.0823H29.9999V15.5635H22.2319Z" fill="#5C6AC4"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 9.2C14.3343 9.2 14.2 9.33434 14.2 9.5C14.2 9.66572 14.3343 9.8 14.5 9.8C14.6657 9.8 14.8 9.66572 14.8 9.5C14.8 9.33434 14.6657 9.2 14.5 9.2ZM14.5 11C15.3284 11 16 10.3285 16 9.5C16 8.67158 15.3284 8 14.5 8C13.6716 8 13 8.67158 13 9.5C13 10.3285 13.6716 11 14.5 11Z" fill="#5C6AC4"/> </symbol> <symbol id="extSVG_settings_general"> <path fill-rule="evenodd" clip-rule="evenodd" d="M29.2374 17.8457L26.8989 16.5257C26.9664 16.0127 26.9994 15.5027 26.9994 15.0002C26.9994 14.4977 26.9664 13.9877 26.8989 13.4732L29.2374 12.1547C29.5884 11.9552 29.8449 11.6252 29.9484 11.2367C30.0534 10.8467 29.9964 10.4312 29.7924 10.0847L26.7219 4.88874C26.3064 4.18674 25.4094 3.94524 24.6924 4.34574L22.4559 5.60724C21.5559 4.89324 20.5569 4.30974 19.4994 3.87924V1.50024C19.4994 0.672244 18.8289 0.000244141 17.9994 0.000244141H11.9994C11.1714 0.000244141 10.4994 0.672244 10.4994 1.50024V3.87924C9.44189 4.30974 8.44289 4.89324 7.54439 5.60724L5.30639 4.34574C4.59389 3.94524 3.69389 4.18674 3.27839 4.88874L0.207892 10.0847C0.00239222 10.4312 -0.0531078 10.8467 0.0518922 11.2367C0.155392 11.6252 0.411892 11.9552 0.762892 12.1547L3.10139 13.4732C3.03389 13.9877 2.99939 14.4977 2.99939 15.0002C2.99939 15.5027 3.03389 16.0127 3.10139 16.5257L0.762892 17.8457C0.411892 18.0437 0.155392 18.3752 0.0518922 18.7637C-0.0531078 19.1537 0.00239222 19.5677 0.207892 19.9157L3.27839 25.1117C3.69389 25.8137 4.59389 26.0582 5.30639 25.6547L7.54439 24.3917C8.44289 25.1072 9.44189 25.6907 10.4994 26.1197V28.5002C10.4994 29.3282 11.1714 30.0002 11.9994 30.0002H17.9994C18.8289 30.0002 19.4994 29.3282 19.4994 28.5002V26.1197C20.5569 25.6907 21.5559 25.1072 22.4559 24.3917L24.6924 25.6547C25.4094 26.0582 26.3064 25.8137 26.7219 25.1117L29.7924 19.9157C29.9964 19.5677 30.0534 19.1537 29.9484 18.7637C29.8449 18.3752 29.5884 18.0437 29.2374 17.8457ZM23.7729 13.0172C23.9244 13.6892 23.9994 14.3567 23.9994 15.0002C23.9994 15.6422 23.9244 16.3097 23.7729 16.9832C23.6274 17.6282 23.9229 18.2927 24.4989 18.6167L26.4294 19.7057L24.8859 22.3187L23.0064 21.2582C22.4319 20.9342 21.7074 21.0242 21.2319 21.4832C20.1954 22.4777 18.9294 23.2172 17.5719 23.6207C16.9359 23.8097 16.4994 24.3947 16.4994 25.0592V27.0002H13.4994V25.0592C13.4994 24.3947 13.0629 23.8097 12.4284 23.6207C11.0694 23.2172 9.80338 22.4777 8.76838 21.4832C8.29288 21.0242 7.56688 20.9342 6.99238 21.2582L5.11438 22.3187L3.56938 19.7057L5.49988 18.6167C6.07738 18.2927 6.37138 17.6282 6.22738 16.9832C6.07588 16.3097 5.99938 15.6422 5.99938 15.0002C5.99938 14.3567 6.07588 13.6892 6.22738 13.0172C6.37138 12.3722 6.07738 11.7077 5.49988 11.3822L3.56938 10.2932L5.11438 7.68024L6.99238 8.74074C7.56838 9.06624 8.29288 8.97624 8.76838 8.51724C9.80338 7.52124 11.0694 6.78324 12.4284 6.37824C13.0629 6.18924 13.4994 5.60424 13.4994 4.94124V3.00024H16.4994V4.94124C16.4994 5.60424 16.9359 6.18924 17.5719 6.37824C18.9294 6.78324 20.1954 7.52124 21.2319 8.51724C21.7074 8.97624 22.4304 9.06474 23.0064 8.74074L24.8859 7.68024L26.4294 10.2932L24.4989 11.3822C23.9229 11.7077 23.6274 12.3722 23.7729 13.0172ZM14.9998 8.99994C11.6908 8.99994 8.99983 11.6909 8.99983 14.9999C8.99983 18.3089 11.6908 20.9999 14.9998 20.9999C18.3088 20.9999 20.9998 18.3089 20.9998 14.9999C20.9998 11.6909 18.3088 8.99994 14.9998 8.99994ZM14.9998 17.9999C13.3453 17.9999 11.9998 16.6544 11.9998 14.9999C11.9998 13.3454 13.3453 11.9999 14.9998 11.9999C16.6543 11.9999 17.9998 13.3454 17.9998 14.9999C17.9998 16.6544 16.6543 17.9999 14.9998 17.9999Z" fill="#7084CB"/> </symbol> <symbol id="extSVG_customers"> <path fill-rule="evenodd" clip-rule="evenodd" d="M26.561 22.9395C26.963 23.3415 27.1025 23.9355 26.9225 24.474L25.4225 28.974C25.2185 29.5875 24.6455 30 24.0005 30H6.00046C5.35396 30 4.78096 29.5875 4.57696 28.974L3.07696 24.474C2.89696 23.9355 3.03796 23.3415 3.43996 22.9395C3.64096 22.737 8.45296 18 15.0005 18C21.5465 18 26.3585 22.737 26.561 22.9395ZM22.919 27L23.762 24.4695C22.382 23.3415 19.0295 21 15.0005 21C10.946 21 7.60997 23.337 6.23597 24.465L7.08047 27H22.919ZM15 3C12.519 3 10.5 5.019 10.5 7.5C10.5 9.981 12.519 12 15 12C17.481 12 19.5 9.981 19.5 7.5C19.5 5.019 17.481 3 15 3ZM15 15C10.8645 15 7.49999 11.6355 7.49999 7.5C7.49999 3.3645 10.8645 0 15 0C19.1355 0 22.5 3.3645 22.5 7.5C22.5 11.6355 19.1355 15 15 15Z" fill="#5C6AC4"/> </symbol> <symbol id="extSVG_discounts"> <path fill-rule="evenodd" clip-rule="evenodd" d="M28.5955 11.6031L27.5438 10.5529C27.2093 10.2168 27.0157 9.7502 27.0157 9.2761V7.78928C27.0157 5.13972 24.8598 2.98526 22.2103 2.98526H20.725C20.2434 2.98526 19.7903 2.79772 19.4483 2.45565L18.3981 1.40542C16.5242 -0.469975 13.4756 -0.466974 11.6017 1.40542L10.5515 2.45565C10.2095 2.79772 9.75639 2.98526 9.2748 2.98526H7.78951C5.14 2.98526 2.98408 5.13972 2.98408 7.78928V9.2761C2.98408 9.7502 2.79054 10.2168 2.45598 10.5529L1.40427 11.6031C-0.468091 13.477 -0.468091 16.5241 1.40427 18.398L2.45598 19.4483C2.79054 19.7843 2.98408 20.2494 2.98408 20.725V22.2118C2.98408 24.8614 5.14 27.0159 7.78951 27.0159H9.2748C9.75639 27.0159 10.2095 27.2034 10.5515 27.5455L11.6017 28.5957C12.5394 29.5334 13.7697 30 14.9999 30C16.2301 30 17.4604 29.5319 18.3981 28.5957L19.4483 27.5455C19.7903 27.2034 20.2434 27.0159 20.725 27.0159H22.2103C24.8598 27.0159 27.0157 24.8614 27.0157 22.2118V20.725C27.0157 20.2494 27.2093 19.7843 27.5438 19.4483L28.597 18.398C30.4679 16.5241 30.4679 13.477 28.5955 11.6031ZM18.4371 9.43585L9.43532 18.4378C8.84871 19.0244 8.84871 19.9726 9.43532 20.5592C9.72788 20.8518 10.112 20.9988 10.496 20.9988C10.8801 20.9988 11.2642 20.8518 11.5567 20.5592L20.5585 11.5573C21.1451 10.9707 21.1451 10.0225 20.5585 9.43585C19.9719 8.84922 19.0237 8.84922 18.4371 9.43585ZM11.2463 13.4972C12.4885 13.4972 13.4967 12.489 13.4967 11.2467C13.4967 10.0045 12.4885 8.99625 11.2463 8.99625C10.004 8.99625 8.99585 10.0045 8.99585 11.2467C8.99585 12.489 10.004 13.4972 11.2463 13.4972ZM18.7478 16.4979C17.5055 16.4979 16.4973 17.5061 16.4973 18.7484C16.4973 19.9906 17.5055 20.9989 18.7478 20.9989C19.99 20.9989 20.9982 19.9906 20.9982 18.7484C20.9982 17.5061 19.99 16.4979 18.7478 16.4979ZM26.4742 16.2766L25.4225 17.3268C24.5148 18.2345 24.0152 19.4408 24.0152 20.7251V22.2119C24.0152 23.2066 23.2065 24.0153 22.2103 24.0153H20.725C19.4423 24.0153 18.2346 24.5149 17.3269 25.4241L16.2767 26.4743C15.573 27.1779 14.4268 27.1779 13.7232 26.4743L12.673 25.4241C11.7653 24.5149 10.5591 24.0153 9.27482 24.0153H7.78953C6.79334 24.0153 5.98469 23.2066 5.98469 22.2119V20.7251C5.98469 19.4408 5.48509 18.2345 4.57741 17.3268L3.52721 16.2766C2.82207 15.573 2.82207 14.4282 3.52571 13.7246L4.57741 12.6744C5.48509 11.7667 5.98469 10.5589 5.98469 9.27613V7.78932C5.98469 6.79461 6.79334 5.98594 7.78953 5.98594H9.27482C10.5591 5.98594 11.7653 5.48633 12.673 4.57714L13.7232 3.52691C14.4268 2.82326 15.573 2.82326 16.2767 3.52691L17.3269 4.57714C18.2346 5.48633 19.4423 5.98594 20.725 5.98594H22.2103C23.2065 5.98594 24.0152 6.79461 24.0152 7.78932V9.27613C24.0152 10.5589 24.5148 11.7667 25.4225 12.6744L26.4742 13.7246C27.1778 14.4282 27.1778 15.573 26.4742 16.2766Z" fill="#7084CB"/> </symbol> <symbol id="extSVG_apps"> <path fill-rule="evenodd" clip-rule="evenodd" d="M28.5 16.5C29.3295 16.5 30 17.1705 30 18V28.5C30 29.3295 29.3295 30 28.5 30H18C17.1705 30 16.5 29.3295 16.5 28.5V18C16.5 17.1705 17.1705 16.5 18 16.5H28.5ZM12 16.5C12.8295 16.5 13.5 17.1705 13.5 18V28.5C13.5 29.3295 12.8295 30 12 30H1.5C0.6705 30 0 29.3295 0 28.5V18C0 17.1705 0.6705 16.5 1.5 16.5H12ZM12 0C12.8295 0 13.5 0.6705 13.5 1.5V12C13.5 12.8295 12.8295 13.5 12 13.5H1.5C0.6705 13.5 0 12.8295 0 12V1.5C0 0.6705 0.6705 0 1.5 0H12ZM3 27H10.5V19.5H3V27ZM3 10.5H10.5V3H3V10.5ZM19.5 27H27V19.5H19.5V27ZM18 9C17.1705 9 16.5 8.3295 16.5 7.5C16.5 6.6705 17.1705 6 18 6H21V3C21 2.1705 21.6705 1.5 22.5 1.5C23.3295 1.5 24 2.1705 24 3V6H27C27.8295 6 28.5 6.6705 28.5 7.5C28.5 8.3295 27.8295 9 27 9H24V12C24 12.8295 23.3295 13.5 22.5 13.5C21.6705 13.5 21 12.8295 21 12V9H18Z" fill="#5C6AC4"/> </symbol> <symbol id="extSVG_menus"> <path fill-rule="evenodd" clip-rule="evenodd" d="M26.25 0C28.3181 0 30 1.68187 30 3.75C30 5.81813 28.3181 7.5 26.25 7.5C24.1819 7.5 22.5 5.81813 22.5 3.75C22.5 1.68187 24.1819 0 26.25 0ZM15 0C17.0681 0 18.75 1.68187 18.75 3.75C18.75 5.81813 17.0681 7.5 15 7.5C12.9319 7.5 11.25 5.81813 11.25 3.75C11.25 1.68187 12.9319 0 15 0ZM3.75 0C5.81813 0 7.5 1.68187 7.5 3.75C7.5 5.81813 5.81813 7.5 3.75 7.5C1.68187 7.5 0 5.81813 0 3.75C0 1.68187 1.68187 0 3.75 0Z" fill="#7084CB"/> </symbol> <symbol id="extSVG_products"> <path fill-rule="evenodd" clip-rule="evenodd" d="M28.5 -0.00012207C29.328 -0.00012207 30 0.671878 30 1.49988V14.9999C30 15.3974 29.8425 15.7799 29.5605 16.0604L16.0605 29.5604C15.768 29.8529 15.384 29.9999 15 29.9999C14.616 29.9999 14.232 29.8529 13.9395 29.5604L0.439509 16.0604C-0.146991 15.4739 -0.146991 14.5259 0.439509 13.9394L13.9395 0.439378C14.22 0.158878 14.6025 -0.00012207 15 -0.00012207H28.5ZM15 26.3789L17.379 23.9999L6.00001 12.6209L3.62101 14.9999L15 26.3789ZM27 14.3789V2.99988H15.621L8.12101 10.4999L19.5 21.8789L27 14.3789ZM22.5 9.00002C21.672 9.00002 21 8.32802 21 7.50002C21 6.67202 21.672 6.00002 22.5 6.00002C23.328 6.00002 24 6.67202 24 7.50002C24 8.32802 23.328 9.00002 22.5 9.00002Z" fill="#7084CB"/> </symbol> <symbol id="extSVG_code_editor"> <g clip-path="url(#clip0)"> <path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 13.5C4.5 13.899 4.3425 14.28 4.0605 14.5605L3.621 15L4.0605 15.4395C4.3425 15.72 4.5 16.101 4.5 16.5V22.5C4.5 23.328 5.172 24 6 24C6.8295 24 7.5 24.6705 7.5 25.5C7.5 26.3295 6.8295 27 6 27C3.519 27 1.5 24.981 1.5 22.5V17.121L0.439497 16.0605C-0.147003 15.474 -0.147003 14.526 0.439497 13.9395L1.5 12.879V7.5C1.5 5.019 3.519 3 6 3C6.8295 3 7.5 3.6705 7.5 4.5C7.5 5.3295 6.8295 6 6 6C5.172 6 4.5 6.672 4.5 7.5V13.5ZM29.5605 13.9395C30.147 14.526 30.147 15.474 29.5605 16.0605L28.5 17.121V22.5C28.5 24.981 26.481 27 24 27C23.1705 27 22.5 26.3295 22.5 25.5C22.5 24.6705 23.1705 24 24 24C24.828 24 25.5 23.328 25.5 22.5V16.5C25.5 16.101 25.6575 15.72 25.9395 15.4395L26.379 15L25.9395 14.5605C25.6575 14.28 25.5 13.899 25.5 13.5V7.5C25.5 6.672 24.828 6 24 6C23.1705 6 22.5 5.3295 22.5 4.5C22.5 3.6705 23.1705 3 24 3C26.481 3 28.5 5.019 28.5 7.5V12.879L29.5605 13.9395ZM18.5567 6.10695C19.3262 6.41445 19.7012 7.28745 19.3937 8.05695L13.3937 23.0569C13.1582 23.6434 12.5942 24.0004 12.0002 24.0004C11.8142 24.0004 11.6252 23.9659 11.4437 23.8924C10.6742 23.5849 10.2992 22.712 10.6067 21.944L16.6067 6.94395C16.9142 6.17145 17.7917 5.79795 18.5567 6.10695Z" fill="#7084CB"/> </g> <defs> <clipPath id="clip0"><rect width="30" height="30" fill="white"/></clipPath> </defs> </symbol> <symbol id="extSVG_sections_editor"> <path fill-rule="evenodd" clip-rule="evenodd" d="M28.5 7.5H1.5C0.6705 7.5 0 8.172 0 9V21C0 21.8295 0.6705 22.5 1.5 22.5H28.5C29.3295 22.5 30 21.8295 30 21V9C30 8.172 29.3295 7.5 28.5 7.5ZM9 3C8.1705 3 7.5 2.328 7.5 1.5C7.5 0.672 8.1705 0 9 0H12C12.8295 0 13.5 0.672 13.5 1.5C13.5 2.328 12.8295 3 12 3H9ZM18 3H21C21.8295 3 22.5 2.328 22.5 1.5C22.5 0.672 21.8295 0 21 0H18C17.1705 0 16.5 0.672 16.5 1.5C16.5 2.328 17.1705 3 18 3ZM28.5 0H27C26.1705 0 25.5 0.672 25.5 1.5C25.5 2.328 26.1705 3 27 3C27 3.828 27.6705 4.5 28.5 4.5C29.3295 4.5 30 3.828 30 3V1.5C30 0.672 29.3295 0 28.5 0ZM1.5 4.5C2.3295 4.5 3 3.828 3 3C3.8295 3 4.5 2.328 4.5 1.5C4.5 0.672 3.8295 0 3 0H1.5C0.6705 0 0 0.672 0 1.5V3C0 3.828 0.6705 4.5 1.5 4.5ZM21 27H18C17.1705 27 16.5 27.6705 16.5 28.5C16.5 29.3295 17.1705 30 18 30H21C21.8295 30 22.5 29.3295 22.5 28.5C22.5 27.6705 21.8295 27 21 27ZM12 27H9C8.1705 27 7.5 27.6705 7.5 28.5C7.5 29.3295 8.1705 30 9 30H12C12.8295 30 13.5 29.3295 13.5 28.5C13.5 27.6705 12.8295 27 12 27ZM3 27C3 26.1705 2.3295 25.5 1.5 25.5C0.6705 25.5 0 26.1705 0 27V28.5C0 29.3295 0.6705 30 1.5 30H3C3.8295 30 4.5 29.3295 4.5 28.5C4.5 27.6705 3.8295 27 3 27ZM28.5 25.5C27.6705 25.5 27 26.1705 27 27C26.1705 27 25.5 27.6705 25.5 28.5C25.5 29.3295 26.1705 30 27 30H28.5C29.3295 30 30 29.3295 30 28.5V27C30 26.1705 29.3295 25.5 28.5 25.5ZM3 19.5H27V10.5H3V19.5Z" fill="#7084CB"/> <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30"> <path fill-rule="evenodd" clip-rule="evenodd" d="M28.5 7.5H1.5C0.6705 7.5 0 8.172 0 9V21C0 21.8295 0.6705 22.5 1.5 22.5H28.5C29.3295 22.5 30 21.8295 30 21V9C30 8.172 29.3295 7.5 28.5 7.5ZM9 3C8.1705 3 7.5 2.328 7.5 1.5C7.5 0.672 8.1705 0 9 0H12C12.8295 0 13.5 0.672 13.5 1.5C13.5 2.328 12.8295 3 12 3H9ZM18 3H21C21.8295 3 22.5 2.328 22.5 1.5C22.5 0.672 21.8295 0 21 0H18C17.1705 0 16.5 0.672 16.5 1.5C16.5 2.328 17.1705 3 18 3ZM28.5 0H27C26.1705 0 25.5 0.672 25.5 1.5C25.5 2.328 26.1705 3 27 3C27 3.828 27.6705 4.5 28.5 4.5C29.3295 4.5 30 3.828 30 3V1.5C30 0.672 29.3295 0 28.5 0ZM1.5 4.5C2.3295 4.5 3 3.828 3 3C3.8295 3 4.5 2.328 4.5 1.5C4.5 0.672 3.8295 0 3 0H1.5C0.6705 0 0 0.672 0 1.5V3C0 3.828 0.6705 4.5 1.5 4.5ZM21 27H18C17.1705 27 16.5 27.6705 16.5 28.5C16.5 29.3295 17.1705 30 18 30H21C21.8295 30 22.5 29.3295 22.5 28.5C22.5 27.6705 21.8295 27 21 27ZM12 27H9C8.1705 27 7.5 27.6705 7.5 28.5C7.5 29.3295 8.1705 30 9 30H12C12.8295 30 13.5 29.3295 13.5 28.5C13.5 27.6705 12.8295 27 12 27ZM3 27C3 26.1705 2.3295 25.5 1.5 25.5C0.6705 25.5 0 26.1705 0 27V28.5C0 29.3295 0.6705 30 1.5 30H3C3.8295 30 4.5 29.3295 4.5 28.5C4.5 27.6705 3.8295 27 3 27ZM28.5 25.5C27.6705 25.5 27 26.1705 27 27C26.1705 27 25.5 27.6705 25.5 28.5C25.5 29.3295 26.1705 30 27 30H28.5C29.3295 30 30 29.3295 30 28.5V27C30 26.1705 29.3295 25.5 28.5 25.5ZM3 19.5H27V10.5H3V19.5Z" fill="white"/> </mask> <g mask="url(#mask0)"></g> </symbol> <symbol id="extSVG_extra_products"> <path fill-rule="evenodd" clip-rule="evenodd" d="M28.5 -0.00012207C29.328 -0.00012207 30 0.671878 30 1.49988V14.9999C30 15.3974 29.8425 15.7799 29.5605 16.0604L16.0605 29.5604C15.768 29.8529 15.384 29.9999 15 29.9999C14.616 29.9999 14.232 29.8529 13.9395 29.5604L0.439509 16.0604C-0.146991 15.4739 -0.146991 14.5259 0.439509 13.9394L13.9395 0.439378C14.22 0.158878 14.6025 -0.00012207 15 -0.00012207H28.5ZM15 26.3789L17.379 23.9999L6.00001 12.6209L3.62101 14.9999L15 26.3789ZM27 14.3789V2.99988H15.621L8.12101 10.4999L19.5 21.8789L27 14.3789ZM22.5 9.00002C21.672 9.00002 21 8.32802 21 7.50002C21 6.67202 21.672 6.00002 22.5 6.00002C23.328 6.00002 24 6.67202 24 7.50002C24 8.32802 23.328 9.00002 22.5 9.00002Z" fill="#7084CB"/> </symbol> <symbol id="extSVG_arnLogo"> <circle cx="10.5" cy="10.5" r="10.5" fill="#3F4EAE"/> <circle cx="10.5002" cy="10.5" r="9.67742" fill="white"/> <circle cx="10.5" cy="10.5" r="8.46774" fill="#3F4EAE"/> <path d="M8.23058 14.7617C8.16726 14.7617 8.10395 14.7245 8.07788 14.6612C8.04064 14.5755 8.07788 14.4787 8.16354 14.4414L9.29946 13.9461C9.38512 13.9089 9.48195 13.9461 9.51919 14.0318C9.55643 14.1174 9.51919 14.2143 9.43353 14.2515L8.29761 14.7468C8.27527 14.758 8.25292 14.7617 8.23058 14.7617Z" fill="white"/> <path d="M10.711 14.8251C10.6812 14.8251 10.6514 14.8177 10.6216 14.799L9.81712 14.2963C9.73891 14.2478 9.71656 14.1436 9.76498 14.0691C9.81339 13.9909 9.91768 13.9685 9.99216 14.0169L10.7966 14.5197C10.8748 14.5681 10.8972 14.6724 10.8488 14.7469C10.8227 14.799 10.7668 14.8251 10.711 14.8251Z" fill="white"/> <path d="M16.0704 9.24232L16.9828 8.84382C17.1728 8.76189 17.1802 8.49374 16.994 8.40063L12.752 6.28521C12.6887 6.25542 12.6179 6.25169 12.5509 6.27777L11.3032 6.7731L10.1487 6.17348C10.0854 6.13997 10.0146 6.13624 9.94757 6.16231L4.37599 8.29262C4.18605 8.36338 4.15998 8.62409 4.33502 8.72837L5.13947 9.23488L3.91789 9.72276C3.73168 9.79725 3.70933 10.0505 3.87693 10.1585L7.83588 12.7171C7.90664 12.7618 7.9923 12.7693 8.06679 12.7357L9.631 12.0542L10.9755 12.8959C11.0462 12.9406 11.1319 12.9443 11.2064 12.9108L17.1094 10.233C17.2957 10.1473 17.3031 9.88663 17.1206 9.7898L16.0704 9.24232ZM9.6608 11.0449L6.86011 9.34288L11.2548 7.56638L14.1672 9.11197L9.6608 11.0449Z" fill="white"/> <path d="M7.53425 13.6445C7.50445 13.6445 7.47093 13.637 7.44486 13.6184L3.80248 11.2721C3.72427 11.2237 3.70192 11.1194 3.75406 11.0412C3.8062 10.963 3.90676 10.9406 3.98497 10.9928L7.63108 13.3428C7.70929 13.3912 7.73163 13.4955 7.67949 13.5737C7.64225 13.6184 7.59011 13.6445 7.53425 13.6445Z" fill="white"/> <path d="M7.53425 14.6128C7.50445 14.6128 7.47093 14.6054 7.44486 14.5867L3.80248 12.2292C3.72427 12.1808 3.70192 12.0765 3.75406 11.9983C3.80248 11.9201 3.90676 11.8978 3.98497 11.9499L7.62735 14.3037C7.70556 14.3521 7.72791 14.4564 7.67577 14.5346C7.64225 14.5867 7.59011 14.6128 7.53425 14.6128Z" fill="white"/> <path d="M8.24181 13.7897C8.17849 13.7897 8.11518 13.7525 8.08911 13.6892C8.05187 13.6035 8.08911 13.5067 8.17477 13.4695L9.29951 12.9778C9.38517 12.9406 9.48201 12.9778 9.51925 13.0635C9.55649 13.1492 9.51925 13.246 9.43359 13.2832L8.30884 13.7748C8.2865 13.786 8.26415 13.7897 8.24181 13.7897Z" fill="white"/> <path d="M10.711 13.8567C10.6812 13.8567 10.6514 13.8493 10.6216 13.8307L9.81712 13.3279C9.73891 13.2795 9.71656 13.1752 9.76498 13.1007C9.81339 13.0225 9.91768 13.0001 9.99216 13.0485L10.7966 13.5513C10.8748 13.5997 10.8972 13.704 10.8488 13.7785C10.8227 13.8307 10.7668 13.8567 10.711 13.8567Z" fill="white"/> <path d="M11.4448 13.935C11.3814 13.935 11.3219 13.8978 11.2921 13.8382C11.2548 13.7562 11.2921 13.6557 11.374 13.6184L17.0536 11.0412C17.1355 11.004 17.2361 11.0412 17.2733 11.1231C17.3106 11.2051 17.2733 11.3056 17.1914 11.3429L11.5118 13.9201C11.4932 13.9313 11.4708 13.935 11.4448 13.935Z" fill="white"/> <path d="M11.4448 14.9033C11.3814 14.9033 11.3219 14.866 11.2921 14.8064C11.2548 14.7245 11.2921 14.6239 11.374 14.5867L17.0536 12.0095C17.1355 11.9722 17.2361 12.0095 17.2733 12.0914C17.3106 12.1733 17.2733 12.2739 17.1914 12.3111L11.5118 14.8884C11.4932 14.8995 11.4708 14.9033 11.4448 14.9033Z" fill="white"/> <defs> <linearGradient id="paint0_linear" x1="0" y1="10.5" x2="21" y2="10.5" gradientUnits="userSpaceOnUse"> <stop stop-color="#0575E6"/> <stop offset="1" stop-color="#021B79"/> </linearGradient> <linearGradient id="paint1_linear" x1="11.1825" y1="18.3225" x2="14.2625" y2="4.865" gradientUnits="userSpaceOnUse"> <stop stop-color="#1C2260"/> <stop offset="1" stop-color="#3F4EAE"/> </linearGradient> </defs> </symbol> </svg></div>
			`;

			break;

			case 'bubble_add':
			id='arnExtension_bubble_add';
			html = `
			<div id="arnExtension_bubble_add" class="arnExtension-bubble-popup arnExtension-fixed ui-drag-element" data-target="#arnExtension_grid" data-eid="content__Editor"><div class="arnExtension-popup-inner"><div class="arnExtension-popup-inner--top ui-drag--enabled"><div class="arnExtension-popup-icon"><svg width="22" height="6" viewBox="0 0 22 6" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M19 1C20.103 1 21 1.897 21 3C21 4.103 20.103 5 19 5C17.897 5 17 4.103 17 3C17 1.897 17.897 1 19 1Z" stroke="#212B36"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M11 1C12.103 1 13 1.897 13 3C13 4.103 12.103 5 11 5C9.897 5 9 4.103 9 3C9 1.897 9.897 1 11 1Z" stroke="#212B36"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M3 1C4.103 1 5 1.897 5 3C5 4.103 4.103 5 3 5C1.897 5 1 4.103 1 3C1 1.897 1.897 1 3 1Z" stroke="#212B36"/> </svg></div></div><div class="arnExtension-popup-inner--bottom ui-drag--disabled arnExtension-popup--clicked"><div class="arnExtension-popup-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.9999 2.40002C6.7067 2.40002 2.3999 6.70682 2.3999 12C2.3999 17.2932 6.7067 21.6 11.9999 21.6C17.2931 21.6 21.5999 17.2932 21.5999 12C21.5999 6.70682 17.2931 2.40002 11.9999 2.40002ZM11.9999 19.2C8.0291 19.2 4.7999 15.9708 4.7999 12C4.7999 8.02922 8.0291 4.80002 11.9999 4.80002C15.9707 4.80002 19.1999 8.02922 19.1999 12C19.1999 15.9708 15.9707 19.2 11.9999 19.2ZM15.5999 10.8H13.1999V8.40002C13.1999 7.73762 12.6635 7.20002 11.9999 7.20002C11.3363 7.20002 10.7999 7.73762 10.7999 8.40002V10.8H8.3999C7.7363 10.8 7.1999 11.3376 7.1999 12C7.1999 12.6624 7.7363 13.2 8.3999 13.2H10.7999V15.6C10.7999 16.2624 11.3363 16.8 11.9999 16.8C12.6635 16.8 13.1999 16.2624 13.1999 15.6V13.2H15.5999C16.2635 13.2 16.7999 12.6624 16.7999 12C16.7999 11.3376 16.2635 10.8 15.5999 10.8Z" fill="#212B36"/><mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="2" y="2" width="20" height="20"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.9999 2.40002C6.7067 2.40002 2.3999 6.70682 2.3999 12C2.3999 17.2932 6.7067 21.6 11.9999 21.6C17.2931 21.6 21.5999 17.2932 21.5999 12C21.5999 6.70682 17.2931 2.40002 11.9999 2.40002ZM11.9999 19.2C8.0291 19.2 4.7999 15.9708 4.7999 12C4.7999 8.02922 8.0291 4.80002 11.9999 4.80002C15.9707 4.80002 19.1999 8.02922 19.1999 12C19.1999 15.9708 15.9707 19.2 11.9999 19.2ZM15.5999 10.8H13.1999V8.40002C13.1999 7.73762 12.6635 7.20002 11.9999 7.20002C11.3363 7.20002 10.7999 7.73762 10.7999 8.40002V10.8H8.3999C7.7363 10.8 7.1999 11.3376 7.1999 12C7.1999 12.6624 7.7363 13.2 8.3999 13.2H10.7999V15.6C10.7999 16.2624 11.3363 16.8 11.9999 16.8C12.6635 16.8 13.1999 16.2624 13.1999 15.6V13.2H15.5999C16.2635 13.2 16.7999 12.6624 16.7999 12C16.7999 11.3376 16.2635 10.8 15.5999 10.8Z" fill="white"/></mask><g mask="url(#mask0)"></g></svg></div><div class="arnExtension-popup-text"><span>Add</span></div></div></div></div>
			`;
			break;

			case 'popup_layout_grid':
			id='arnExtension_grid';
			html = `
			<div id="arnExtension_grid" class="arnExtension-popup-layout ui-drag-element arnExtension-fixed ui-drag--enabled" data-eid="content__Editor"> <svg xmlnsxlink="http://www.w3.org/2000/svg" style="display: none;"> <symbol id="extSVG_arnLogo"> <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="10.5" cy="10.5" r="10.5" fill="#3F4EAE"/> <circle cx="10.5002" cy="10.5" r="9.67742" fill="white"/> <circle cx="10.5" cy="10.5" r="8.46774" fill="#3F4EAE"/> <path d="M8.23058 14.7617C8.16726 14.7617 8.10395 14.7245 8.07788 14.6612C8.04064 14.5755 8.07788 14.4787 8.16354 14.4414L9.29946 13.9461C9.38512 13.9089 9.48195 13.9461 9.51919 14.0318C9.55643 14.1174 9.51919 14.2143 9.43353 14.2515L8.29761 14.7468C8.27527 14.758 8.25292 14.7617 8.23058 14.7617Z" fill="white"/> <path d="M10.711 14.8251C10.6812 14.8251 10.6514 14.8177 10.6216 14.799L9.81712 14.2963C9.73891 14.2478 9.71656 14.1436 9.76498 14.0691C9.81339 13.9909 9.91768 13.9685 9.99216 14.0169L10.7966 14.5197C10.8748 14.5681 10.8972 14.6724 10.8488 14.7469C10.8227 14.799 10.7668 14.8251 10.711 14.8251Z" fill="white"/> <path d="M16.0704 9.24232L16.9828 8.84382C17.1728 8.76189 17.1802 8.49374 16.994 8.40063L12.752 6.28521C12.6887 6.25542 12.6179 6.25169 12.5509 6.27777L11.3032 6.7731L10.1487 6.17348C10.0854 6.13997 10.0146 6.13624 9.94757 6.16231L4.37599 8.29262C4.18605 8.36338 4.15998 8.62409 4.33502 8.72837L5.13947 9.23488L3.91789 9.72276C3.73168 9.79725 3.70933 10.0505 3.87693 10.1585L7.83588 12.7171C7.90664 12.7618 7.9923 12.7693 8.06679 12.7357L9.631 12.0542L10.9755 12.8959C11.0462 12.9406 11.1319 12.9443 11.2064 12.9108L17.1094 10.233C17.2957 10.1473 17.3031 9.88663 17.1206 9.7898L16.0704 9.24232ZM9.6608 11.0449L6.86011 9.34288L11.2548 7.56638L14.1672 9.11197L9.6608 11.0449Z" fill="white"/> <path d="M7.53425 13.6445C7.50445 13.6445 7.47093 13.637 7.44486 13.6184L3.80248 11.2721C3.72427 11.2237 3.70192 11.1194 3.75406 11.0412C3.8062 10.963 3.90676 10.9406 3.98497 10.9928L7.63108 13.3428C7.70929 13.3912 7.73163 13.4955 7.67949 13.5737C7.64225 13.6184 7.59011 13.6445 7.53425 13.6445Z" fill="white"/> <path d="M7.53425 14.6128C7.50445 14.6128 7.47093 14.6054 7.44486 14.5867L3.80248 12.2292C3.72427 12.1808 3.70192 12.0765 3.75406 11.9983C3.80248 11.9201 3.90676 11.8978 3.98497 11.9499L7.62735 14.3037C7.70556 14.3521 7.72791 14.4564 7.67577 14.5346C7.64225 14.5867 7.59011 14.6128 7.53425 14.6128Z" fill="white"/> <path d="M8.24181 13.7897C8.17849 13.7897 8.11518 13.7525 8.08911 13.6892C8.05187 13.6035 8.08911 13.5067 8.17477 13.4695L9.29951 12.9778C9.38517 12.9406 9.48201 12.9778 9.51925 13.0635C9.55649 13.1492 9.51925 13.246 9.43359 13.2832L8.30884 13.7748C8.2865 13.786 8.26415 13.7897 8.24181 13.7897Z" fill="white"/> <path d="M10.711 13.8567C10.6812 13.8567 10.6514 13.8493 10.6216 13.8307L9.81712 13.3279C9.73891 13.2795 9.71656 13.1752 9.76498 13.1007C9.81339 13.0225 9.91768 13.0001 9.99216 13.0485L10.7966 13.5513C10.8748 13.5997 10.8972 13.704 10.8488 13.7785C10.8227 13.8307 10.7668 13.8567 10.711 13.8567Z" fill="white"/> <path d="M11.4448 13.935C11.3814 13.935 11.3219 13.8978 11.2921 13.8382C11.2548 13.7562 11.2921 13.6557 11.374 13.6184L17.0536 11.0412C17.1355 11.004 17.2361 11.0412 17.2733 11.1231C17.3106 11.2051 17.2733 11.3056 17.1914 11.3429L11.5118 13.9201C11.4932 13.9313 11.4708 13.935 11.4448 13.935Z" fill="white"/> <path d="M11.4448 14.9033C11.3814 14.9033 11.3219 14.866 11.2921 14.8064C11.2548 14.7245 11.2921 14.6239 11.374 14.5867L17.0536 12.0095C17.1355 11.9722 17.2361 12.0095 17.2733 12.0914C17.3106 12.1733 17.2733 12.2739 17.1914 12.3111L11.5118 14.8884C11.4932 14.8995 11.4708 14.9033 11.4448 14.9033Z" fill="white"/> <defs> <linearGradient id="paint0_linear" x1="0" y1="10.5" x2="21" y2="10.5" gradientUnits="userSpaceOnUse"> <stop stop-color="#0575E6"/> <stop offset="1" stop-color="#021B79"/> </linearGradient> <linearGradient id="paint1_linear" x1="11.1825" y1="18.3225" x2="14.2625" y2="4.865" gradientUnits="userSpaceOnUse"> <stop stop-color="#1C2260"/> <stop offset="1" stop-color="#3F4EAE"/> </linearGradient> </defs> </svg> </symbol> <symbol id="extSVG_close"> <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="#212B36"/> <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="1" y="1" width="18" height="17"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="white"/> </mask> <g mask="url(#mask0)"></g> </svg> </symbol> <symbol id="extSVG_grid_1"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M23.25 23.5H0.75C0.613641 23.5 0.5 23.3879 0.5 23.2485V18.75C0.5 18.6136 0.613642 18.5 0.75 18.5H23.25C23.3864 18.5 23.5 18.6136 23.5 18.75V23.2485C23.5 23.3879 23.3864 23.5 23.25 23.5ZM23.25 14.5H0.75C0.612992 14.5 0.5 14.3872 0.5 14.25V9.75C0.5 9.61364 0.613642 9.5 0.75 9.5H23.25C23.3864 9.5 23.5 9.61364 23.5 9.75V14.25C23.5 14.3872 23.387 14.5 23.25 14.5ZM23.25 5.5H0.75C0.612991 5.5 0.5 5.38721 0.5 5.25V0.75C0.5 0.613642 0.613642 0.5 0.75 0.5H23.25C23.3864 0.5 23.5 0.613642 23.5 0.75V5.25C23.5 5.38721 23.387 5.5 23.25 5.5Z" fill="#919EAB" stroke="white"/> </svg> </symbol> <symbol id="extSVG_grid_2"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 4C3.22386 4 3 4.22386 3 4.5V13.5C3 13.7761 3.22386 14 3.5 14H12.5C12.7761 14 13 13.7761 13 13.5V4.5C13 4.22386 12.7761 4 12.5 4H3.5ZM3.5 16C3.22386 16 3 16.2239 3 16.5V25.5C3 25.7761 3.22386 26 3.5 26H12.5C12.7761 26 13 25.7761 13 25.5V16.5C13 16.2239 12.7761 16 12.5 16H3.5ZM17 4.5C17 4.22386 17.2239 4 17.5 4H26.5C26.7761 4 27 4.22386 27 4.5V13.5C27 13.7761 26.7761 14 26.5 14H17.5C17.2239 14 17 13.7761 17 13.5V4.5ZM17.5 16C17.2239 16 17 16.2239 17 16.5V25.5C17 25.7761 17.2239 26 17.5 26H26.5C26.7761 26 27 25.7761 27 25.5V16.5C27 16.2239 26.7761 16 26.5 16H17.5Z" fill="#919EAB"/> </svg> </symbol> <symbol id="extSVG_grid_3"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3 4.5C3 4.22386 3.22386 4 3.5 4H8.5C8.77614 4 9 4.22386 9 4.5V9.5C9 9.77614 8.77614 10 8.5 10H3.5C3.22386 10 3 9.77614 3 9.5V4.5ZM12 4.5C12 4.22386 12.2239 4 12.5 4H17.5C17.7761 4 18 4.22386 18 4.5V9.5C18 9.77614 17.7761 10 17.5 10H12.5C12.2239 10 12 9.77614 12 9.5V4.5ZM12 12.5C12 12.2239 12.2239 12 12.5 12H17.5C17.7761 12 18 12.2239 18 12.5V17.5C18 17.7761 17.7761 18 17.5 18H12.5C12.2239 18 12 17.7761 12 17.5V12.5ZM12.5 20C12.2239 20 12 20.2239 12 20.5V25.5C12 25.7761 12.2239 26 12.5 26H17.5C17.7761 26 18 25.7761 18 25.5V20.5C18 20.2239 17.7761 20 17.5 20H12.5ZM3.5 12C3.22386 12 3 12.2239 3 12.5V17.5C3 17.7761 3.22386 18 3.5 18H8.5C8.77614 18 9 17.7761 9 17.5V12.5C9 12.2239 8.77614 12 8.5 12H3.5ZM3 20.5C3 20.2239 3.22386 20 3.5 20H8.5C8.77614 20 9 20.2239 9 20.5V25.5C9 25.7761 8.77614 26 8.5 26H3.5C3.22386 26 3 25.7761 3 25.5V20.5ZM21.5 4C21.2239 4 21 4.22386 21 4.5V9.5C21 9.77614 21.2239 10 21.5 10H26.5C26.7761 10 27 9.77614 27 9.5V4.5C27 4.22386 26.7761 4 26.5 4H21.5ZM21 12.5C21 12.2239 21.2239 12 21.5 12H26.5C26.7761 12 27 12.2239 27 12.5V17.5C27 17.7761 26.7761 18 26.5 18H21.5C21.2239 18 21 17.7761 21 17.5V12.5ZM21.5 20C21.2239 20 21 20.2239 21 20.5V25.5C21 25.7761 21.2239 26 21.5 26H26.5C26.7761 26 27 25.7761 27 25.5V20.5C27 20.2239 26.7761 20 26.5 20H21.5Z" fill="#919EAB"/> </svg> </symbol> <symbol id="extSVG_grid_4"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M2.5 3C2.22386 3 2 3.22386 2 3.5V13.5C2 13.7761 2.22386 14 2.5 14H6.5C6.77614 14 7 13.7761 7 13.5V3.5C7 3.22386 6.77614 3 6.5 3H2.5ZM9.5 3C9.22386 3 9 3.22386 9 3.5V13.5C9 13.7761 9.22386 14 9.5 14H13.5C13.7761 14 14 13.7761 14 13.5V3.5C14 3.22386 13.7761 3 13.5 3H9.5ZM16 3.5C16 3.22386 16.2239 3 16.5 3H20.5C20.7761 3 21 3.22386 21 3.5V13.5C21 13.7761 20.7761 14 20.5 14H16.5C16.2239 14 16 13.7761 16 13.5V3.5ZM23.5 3C23.2239 3 23 3.22386 23 3.5V13.5C23 13.7761 23.2239 14 23.5 14H27.5C27.7761 14 28 13.7761 28 13.5V3.5C28 3.22386 27.7761 3 27.5 3H23.5ZM2 17.5C2 17.2239 2.22386 17 2.5 17H6.5C6.77614 17 7 17.2239 7 17.5V26.5C7 26.7761 6.77614 27 6.5 27H2.5C2.22386 27 2 26.7761 2 26.5V17.5ZM9.5 17C9.22386 17 9 17.2239 9 17.5V26.5C9 26.7761 9.22386 27 9.5 27H13.5C13.7761 27 14 26.7761 14 26.5V17.5C14 17.2239 13.7761 17 13.5 17H9.5ZM16 17.5C16 17.2239 16.2239 17 16.5 17H20.5C20.7761 17 21 17.2239 21 17.5V26.5C21 26.7761 20.7761 27 20.5 27H16.5C16.2239 27 16 26.7761 16 26.5V17.5ZM23.5 17C23.2239 17 23 17.2239 23 17.5V26.5C23 26.7761 23.2239 27 23.5 27H27.5C27.7761 27 28 26.7761 28 26.5V17.5C28 17.2239 27.7761 17 27.5 17H23.5Z" fill="#919EAB"/> </svg> </symbol> <symbol id="extSVG_grid_other"> <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3 4.5C3 4.22386 3.22386 4 3.5 4H8.5C8.77614 4 9 4.22386 9 4.5V9.5C9 9.77614 8.77614 10 8.5 10H3.5C3.22386 10 3 9.77614 3 9.5V4.5ZM12 4.5C12 4.22386 12.2239 4 12.5 4H17.5C17.7761 4 18 4.22386 18 4.5V9.5C18 9.77614 17.7761 10 17.5 10H12.5C12.2239 10 12 9.77614 12 9.5V4.5ZM12 12.5C12 12.2239 12.2239 12 12.5 12H17.5C17.7761 12 18 12.2239 18 12.5V17.5C18 17.7761 17.7761 18 17.5 18H12.5C12.2239 18 12 17.7761 12 17.5V12.5ZM12.5 20C12.2239 20 12 20.2239 12 20.5V25.5C12 25.7761 12.2239 26 12.5 26H17.5C17.7761 26 18 25.7761 18 25.5V20.5C18 20.2239 17.7761 20 17.5 20H12.5ZM3.5 12C3.22386 12 3 12.2239 3 12.5V17.5C3 17.7761 3.22386 18 3.5 18H8.5C8.77614 18 9 17.7761 9 17.5V12.5C9 12.2239 8.77614 12 8.5 12H3.5ZM3 20.5C3 20.2239 3.22386 20 3.5 20H8.5C8.77614 20 9 20.2239 9 20.5V25.5C9 25.7761 8.77614 26 8.5 26H3.5C3.22386 26 3 25.7761 3 25.5V20.5ZM21.5 4C21.2239 4 21 4.22386 21 4.5V9.5C21 9.77614 21.2239 10 21.5 10H26.5C26.7761 10 27 9.77614 27 9.5V4.5C27 4.22386 26.7761 4 26.5 4H21.5ZM21 12.5C21 12.2239 21.2239 12 21.5 12H26.5C26.7761 12 27 12.2239 27 12.5V17.5C27 17.7761 26.7761 18 26.5 18H21.5C21.2239 18 21 17.7761 21 17.5V12.5ZM21.5 20C21.2239 20 21 20.2239 21 20.5V25.5C21 25.7761 21.2239 26 21.5 26H26.5C26.7761 26 27 25.7761 27 25.5V20.5C27 20.2239 26.7761 20 26.5 20H21.5Z" fill="#919EAB"/> </svg> </symbol> </svg> <div class="arnExt-header"> <div class="arnExt-header-inner"> <div class="arnExt-header--title"><span>Elements</span></div><div class="arnExt-header--close"> <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_close"></svg> </div></div></div><div class="arnExtension-popup-body ui-drag--disabled"> <div class="arnExt-body"> <div class="arnExt-body-inner"> <input type="text" id="arnExt-grid-columns-value" value=""/> <div class="arnExt-body--text"><span>Grid Columns</span></div><div class="arnExt-body--group-buttons arnExt-grid-2"> <div class="arnExt-ui-button"> <input type="hidden" name="arnExt-ui-button-data" value="grid_columns" data-columns="1"/> <div class="arnExt-ui-button-inner"> <div class="arnExt-ui-button--svg"><svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_grid_1"></use></svg></div><div class="arnExt-ui-button--label"><span>1 Column</span></div></div></div><div class="arnExt-ui-button"> <input type="hidden" name="arnExt-ui-button-data" value="grid_columns" data-columns="2"/> <div class="arnExt-ui-button-inner"> <div class="arnExt-ui-button--svg"><svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_grid_2"></use></svg></div><div class="arnExt-ui-button--label"><span>2 Columns</span></div></div></div><div class="arnExt-ui-button"> <input type="hidden" name="arnExt-ui-button-data" value="grid_columns" data-columns="3"/> <div class="arnExt-ui-button-inner"> <div class="arnExt-ui-button--svg"><svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_grid_3"></use></svg></div><div class="arnExt-ui-button--label"><span>3 Columns</span></div></div></div><div class="arnExt-ui-button"> <input type="hidden" name="arnExt-ui-button-data" value="grid_columns" data-columns="4"/> <div class="arnExt-ui-button-inner"> <div class="arnExt-ui-button--svg"><svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_grid_4"></use></svg></div><div class="arnExt-ui-button--label"><span>4 Columns</span></div></div></div><div class="arnExt-ui-button ui-button-w-100"> <div class="arnExt-ui-button-inner"> <input type="hidden" name="arnExt-ui-button-data" value="grid_columns" data-columns="offset"/> <div class="arnExt-ui-button--svg"><svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#extSVG_grid_other"></use></svg></div><div class="arnExt-ui-button--label"><span>Offset Column</span></div></div></div></div></div></div><div class="arnExtension-notify_layer"> <div class="arnExtension-notify--copied"> <div class="arnExtension-notify--button"><span>Copied</span></div></div></div></div><div class="arnExt-footer"> <div class="arnExt-footer-inner"> <div class="logo-company"> <span class="logo"> <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21"><use xlink:href="#extSVG_arnLogo"></use></svg> </span> <a href="https://www.arenacommerce.com/" class="logo-name" target="_blank">ArenaCommerce</a> </div></div></div></div>
			`;
			break;

			case 'notify':
			id 		= "arnExtension-notify";
			html 	= `<div id="arnExtension-notify" class="arnExtension-notify"><span class="arnExtension-notify--content">Error ~!</span></div>`;

			break;

			case 'font_____Picker':
			id 		= `arnExtension_icon_picker`;
			html 	= `
			<div id="arnExtension_icon_picker" class="arnExtension-layout-editor arnExtension-popup-layout ui-drag-element arnExtension-fixed ui-drag--enabled" data-eid="font_____Picker"><div class="arnExt-header"><div class="arnExt-header-inner"><div class="arnExt-header--title"><span>Font Icon Picker</span></div><div class="arnExt-header--close"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="#212B36"/><mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="1" y="1" width="18" height="17"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="white"/></mask><g mask="url(#mask0)"></g></svg></div></div></div><div class="arnExtension-sub-body ui-drag--disabled" data-stt="0"><div class="arnExtension-ui-focused arnExtension-input-ui"><div class="arnExtension-ui-focused-inner"><input type="text" name="query" id="arnExt_icon_search" autocomplete="off" placeholder="Search" class="arnExtension-ui-focused--element"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20"><path d="M8 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm9.707 4.293l-4.82-4.82C13.585 10.493 14 9.296 14 8c0-3.313-2.687-6-6-6S2 4.687 2 8s2.687 6 6 6c1.296 0 2.492-.415 3.473-1.113l4.82 4.82c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414z"></path></svg></div></div><div class="arnExtension-ui-focused arnExtension-select-ui"><div class="arnExtension-ui-focused-inner"><select name="arnExt_pick_icon_theme" id="arnExt_pick_icon_theme" class="arnExtension-ui-focused--element"><option value="none">Select Theme</option></select><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20"><path d="M10 16l-4-4h8l-4 4zm0-12L6 8h8l-4-4z"></path></svg></div></div></div><div class="arnExtension-popup-body ui-drag--disabled"><style></style><div class="arnExt-body"><div class="arnExt-body-inner"></div></div><div class="arnExtension-notify_layer"><div class="arnExtension-notify--copied"><div class="arnExtension-notify--button"><span>Copied</span></div></div></div></div><div class="arnExtension-sub-body ui-drag--disabled" data-stt="1"><div id="arnIcon-pagination"><span class="arnIcon-page">1</span>/<span class="arnIcon-total-page">1</span></div><div class="arnExtension-pagination"><div class="arnExtension-first" data-unvailable="true"><svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill="#212B36" d="M6 4a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1zm7.219.376a1 1 0 1 1 1.562 1.249L11.28 10l3.5 4.375a1 1 0 1 1-1.562 1.249l-4-5a1 1 0 0 1 0-1.25l4-5z"/></svg></div><div class="arnExtension-prev" data-unvailable="true"><svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M12 16a.997.997 0 0 1-.707-.293l-5-5a.999.999 0 0 1 0-1.414l5-5a.999.999 0 1 1 1.414 1.414L8.414 10l4.293 4.293A.999.999 0 0 1 12 16" fill="#212B36" fill-rule="evenodd"/></svg></div><div class="arnExtension-next"><svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M8 16a.999.999 0 0 1-.707-1.707L11.586 10 7.293 5.707a.999.999 0 1 1 1.414-1.414l5 5a.999.999 0 0 1 0 1.414l-5 5A.997.997 0 0 1 8 16" fill="#212B36" fill-rule="evenodd"/></svg></div><div class="arnExtension-last"><svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill="#212B36" d="M14 4a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1zm-7.219.376l4 5a1 1 0 0 1 0 1.249l-4 5a1 1 0 1 1-1.562-1.25l3.5-4.374-3.5-4.376a1 1 0 1 1 1.562-1.25z"/></svg></div></div></div><div class="arnExt-footer"><div class="arnExt-footer-inner"><div class="logo-company"><span class="logo"><svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10.5" cy="10.5" r="10.5" fill="url(#paint0_linear2)"/><circle cx="10.5001" cy="10.5" r="9.67742" fill="white"/><circle cx="10.5" cy="10.5" r="8.46774" fill="url(#paint1_linear2)"/><path d="M8.23066 14.7617C8.16735 14.7617 8.10403 14.7245 8.07796 14.6611C8.04072 14.5755 8.07796 14.4787 8.16362 14.4414L9.29954 13.9461C9.3852 13.9088 9.48203 13.9461 9.51928 14.0317C9.55652 14.1174 9.51928 14.2142 9.43362 14.2515L8.2977 14.7468C8.27535 14.758 8.25301 14.7617 8.23066 14.7617Z" fill="white"/><path d="M10.711 14.8251C10.6812 14.8251 10.6514 14.8177 10.6216 14.799L9.81719 14.2963C9.73898 14.2478 9.71663 14.1436 9.76505 14.0691C9.81346 13.9909 9.91774 13.9685 9.99223 14.0169L10.7967 14.5197C10.8749 14.5681 10.8972 14.6724 10.8488 14.7469C10.8228 14.799 10.7669 14.8251 10.711 14.8251Z" fill="white"/><path d="M16.0703 9.24232L16.9828 8.84382C17.1727 8.76189 17.1802 8.49374 16.9939 8.40063L12.7519 6.28521C12.6886 6.25542 12.6179 6.25169 12.5508 6.27777L11.3032 6.7731L10.1486 6.17348C10.0853 6.13997 10.0146 6.13624 9.94753 6.16231L4.37595 8.29262C4.18601 8.36338 4.15994 8.62409 4.33498 8.72837L5.13943 9.23488L3.91786 9.72276C3.73164 9.79725 3.70929 10.0505 3.87689 10.1585L7.83584 12.7171C7.9066 12.7618 7.99226 12.7693 8.06675 12.7357L9.63096 12.0542L10.9754 12.8959C11.0462 12.9406 11.1319 12.9443 11.2064 12.9108L17.1094 10.233C17.2956 10.1473 17.3031 9.88663 17.1206 9.7898L16.0703 9.24232ZM9.66076 11.0449L6.86007 9.34288L11.2548 7.56638L14.1672 9.11197L9.66076 11.0449Z" fill="white"/><path d="M7.5342 13.6445C7.5044 13.6445 7.47089 13.637 7.44482 13.6184L3.80243 11.2721C3.72422 11.2237 3.70187 11.1194 3.75401 11.0412C3.80615 10.963 3.90671 10.9406 3.98492 10.9928L7.63103 13.3428C7.70924 13.3912 7.73159 13.4955 7.67945 13.5737C7.6422 13.6184 7.59006 13.6445 7.5342 13.6445Z" fill="white"/><path d="M7.5342 14.6128C7.50441 14.6128 7.47089 14.6054 7.44482 14.5867L3.80243 12.2292C3.72422 12.1808 3.70187 12.0765 3.75401 11.9983C3.80243 11.9201 3.90671 11.8978 3.98492 11.9499L7.62731 14.3037C7.70552 14.3521 7.72786 14.4564 7.67572 14.5346C7.64221 14.5867 7.59006 14.6128 7.5342 14.6128Z" fill="white"/><path d="M8.24179 13.7897C8.17848 13.7897 8.11516 13.7525 8.08909 13.6892C8.05185 13.6035 8.08909 13.5067 8.17475 13.4695L9.2995 12.9778C9.38516 12.9406 9.48199 12.9778 9.51923 13.0635C9.55648 13.1492 9.51923 13.246 9.43357 13.2832L8.30883 13.7748C8.28648 13.786 8.26414 13.7897 8.24179 13.7897Z" fill="white"/><path d="M10.711 13.8568C10.6812 13.8568 10.6514 13.8493 10.6216 13.8307L9.81719 13.3279C9.73898 13.2795 9.71663 13.1752 9.76505 13.1007C9.81346 13.0225 9.91774 13.0002 9.99223 13.0486L10.7967 13.5514C10.8749 13.5998 10.8972 13.7041 10.8488 13.7785C10.8228 13.8307 10.7669 13.8568 10.711 13.8568Z" fill="white"/><path d="M11.4447 13.935C11.3814 13.935 11.3218 13.8978 11.292 13.8382C11.2548 13.7562 11.292 13.6557 11.374 13.6184L17.0536 11.0412C17.1355 11.004 17.236 11.0412 17.2733 11.1231C17.3105 11.2051 17.2733 11.3056 17.1914 11.3429L11.5118 13.9201C11.4931 13.9313 11.4708 13.935 11.4447 13.935Z" fill="white"/><path d="M11.4447 14.9032C11.3814 14.9032 11.3218 14.866 11.292 14.8064C11.2548 14.7245 11.292 14.6239 11.374 14.5867L17.0536 12.0094C17.1355 11.9722 17.236 12.0094 17.2733 12.0914C17.3105 12.1733 17.2733 12.2739 17.1914 12.3111L11.5118 14.8883C11.4931 14.8995 11.4708 14.9032 11.4447 14.9032Z" fill="white"/><defs><linearGradient id="paint0_linear2" x1="0" y1="10.5" x2="21" y2="10.5" gradientUnits="userSpaceOnUse"><stop stop-color="#0575E6"/><stop offset="1" stop-color="#021B79"/></linearGradient><linearGradient id="paint1_linear2" x1="11.1825" y1="18.3225" x2="14.2625" y2="4.865" gradientUnits="userSpaceOnUse"><stop stop-color="#1C2260"/><stop offset="1" stop-color="#3F4EAE"/></linearGradient></defs></svg></span><a href="https://www.arenacommerce.com/" class="logo-name" target="_blank">ArenaCommerce</a></div></div></div></div>
			`;
			break;

			case 'spacing____Resp':
			id 		= `arnExtension_spacing`;
			html 	= `
			<div id="arnExtension_spacing" class="arnExtension-layout-editor arnExtension-popup-layout arnExtension-fixed ui-drag-element ui-drag--enabled" data-eid="spacing____Resp" data-enable="true"> <div class="arnExt-header"> <div class="arnExt-header-inner"> <div class="arnExt-header--title"><span>Spacing</span></div><div class="arnExt-header--close"> <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="#212B36"/> <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="1" y="1" width="18" height="17"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="white"/> </mask> <g mask="url(#mask0)"></g> </svg> </div></div></div><div class="arnExtension-sub-body ui-drag--disabled" data-child="0"> <div class="arnExtension-svg" data-enabled="false" data-index="2"> <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M15 0C15.552 0 16 0.447 16 1V19C16 19.553 15.552 20 15 20H1C0.448 20 0 19.553 0 19V1C0 0.447 0.448 0 1 0H15ZM2 18H14V2H2V18ZM7 6H9C9.552 6 10 5.553 10 5C10 4.447 9.552 4 9 4H7C6.448 4 6 4.447 6 5C6 5.553 6.448 6 7 6ZM8 14C7.448 14 7 14.447 7 15C7 15.553 7.448 16 8 16C8.552 16 9 15.553 9 15C9 14.447 8.552 14 8 14Z" fill="black"/> </svg> </div><div class="arnExtension-svg" data-enabled="false" data-index="1"> <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M13 14H2V12H18V14H13ZM12.394 18H7.606C7.766 17.478 7.901 16.818 7.963 16H12.037C12.099 16.818 12.233 17.478 12.394 18V18ZM2 10V2H18V10H2ZM19 0H1C0.448 0 0 0.447 0 1V15C0 15.553 0.448 16 1 16H5.95C5.794 17.657 5.29 18.293 5.292 18.293C5.007 18.579 4.922 19.009 5.076 19.383C5.23 19.757 5.596 20 6 20H14C14.39 20 14.734 19.758 14.897 19.402C15.06 19.046 14.987 18.614 14.731 18.318C14.727 18.311 14.211 17.678 14.051 16H19C19.552 16 20 15.553 20 15V1C20 0.447 19.552 0 19 0Z" fill="black"/> </svg> </div><div class="arnExtension-svg" data-enabled="true" data-index="0"> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"> <path d="M16.707 6.293l3 3c.39.39.39 1.023 0 1.414l-3 3c-.195.195-.45.293-.707.293s-.512-.098-.707-.293c-.39-.39-.39-1.023 0-1.414L16.586 11H12c-.552 0-1-.447-1-1s.448-1 1-1h4.586l-1.293-1.293c-.39-.39-.39-1.023 0-1.414s1.023-.39 1.414 0zm-12 0c.39.39.39 1.023 0 1.414L3.414 9H8c.552 0 1 .447 1 1s-.448 1-1 1H3.414l1.293 1.293c.39.39.39 1.023 0 1.414-.195.195-.45.293-.707.293s-.512-.098-.707-.293l-3-3c-.39-.39-.39-1.023 0-1.414l3-3c.39-.39 1.023-.39 1.414 0zM19 0c.552 0 1 .447 1 1v2c0 .553-.448 1-1 1s-1-.447-1-1V2H2v2c0 .553-.448 1-1 1s-1-.447-1-1V1c0-.553.448-1 1-1h18zm0 15c.552 0 1 .447 1 1v3c0 .553-.448 1-1 1H1c-.552 0-1-.447-1-1v-3c0-.553.448-1 1-1s1 .447 1 1v2h16v-2c0-.553.448-1 1-1z"></path> </svg> </div></div><div class="arnExtension-popup-body ui-drag--disabled"> <div class="arnExt-body" data-layout="3" data-type="margin"> <div class="arnExt-body-inner"> <div class="arnExtension-spacing-input"> <div class="arnExt-body-inner--top"> <div class="arnExtension-ui-focused arnExtension-input-ui" data-for="arn_top"> <label for="arn_top"><span>Top</span><span class="hidden-label-2">/Right</span><span class="hidden-label">/Bottom</span><span class="hidden-label-2">/Left</span></label> <div class="arnExtension-ui-focused-inner"> <input type="number" name="arnExtension_spacing_number" id="arn_top" autocomplete="off" placeholder="" class="arnExtension-ui-focused--element" value="0" tabindex="1"> </div></div></div><div class="arnExt-body-inner--middle"> <div class="arnExtension-ui-focused arnExtension-input-ui" data-for="arn_left"> <label for="arn_left"><span>Left</span><span class="hidden-label">/Right</span></label> <div class="arnExtension-ui-focused-inner"> <input type="number" name="arnExtension_spacing_number" id="arn_left" autocomplete="off" placeholder="" class="arnExtension-ui-focused--element" value="0" tabindex="4"> </div></div><div class="arnExtension-center-content"> <div class="arnExtension-ui-focused arnExtension-input-ui"> <div class="arnExtension-ui-focused-inner"> <input type="number" name="arnExtension_spacing_number" id="arn_all" autocomplete="off" placeholder="" class="arnExtension-ui-focused--element" value="0" tabindex="4"> </div></div></div><div class="arnExtension-ui-focused arnExtension-input-ui" data-for="arn_right"> <label for="arn_right">Right</label> <div class="arnExtension-ui-focused-inner"> <input type="number" name="arnExtension_spacing_number" id="arn_right" autocomplete="off" placeholder="" class="arnExtension-ui-focused--element" value="0" tabindex="2"> </div></div></div><div class="arnExt-body-inner--bottom"> <div class="arnExtension-ui-focused arnExtension-input-ui" data-for="arn_bottom"> <label for="arn_bottom">Bottom</label> <div class="arnExtension-ui-focused-inner"> <input type="number" name="arnExtension_spacing_number" id="arn_bottom" autocomplete="off" placeholder="" class="arnExtension-ui-focused--element" value="0" tabindex="3"> </div></div></div></div><div class="arnExt-body-inner--bottom-2"> <div class="arnExtension-ui-focused arnExtension-input-ui"> <label for=""><span class="arnExt-spacing-margin">Margin</span><span class="arnExt-spacing-padding">Padding</span> in/output:</label> <div class="arnExtension-ui-focused-inner"> <input type="text" name="arnExtension_spacing_total" id="arnSpacing_inout" autocomplete="off" placeholder="" class="arnExtension-ui-focused--element" value="" readonly> </div></div></div></div></div><div class="arnExtension-notify_layer"></div></div><div class="arnExtension-sub-body ui-drag--disabled" data-child="1"> <div class="arnExtension-ui-focused arnExtension-select-ui"> <div class="arnExtension-ui-focused-inner"> <select name="arnExt_pick_icon_theme" id="arnExtension_Unit" class="arnExtension-ui-focused--element"> <option value="px" selected="selected">px</option> <option value="rem">rem</option> <option value="%">%</option> <option value="vw">vw</option> <option value="vh">vh</option> </select> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20"> <path d="M10 16l-4-4h8l-4 4zm0-12L6 8h8l-4-4z"></path> </svg> </div></div><div class="arnExtension-ui-focused arnExtension-select-ui"> <div class="arnExtension-ui-focused-inner"> <select name="arnExt_pick_icon_theme" id="arnExt_spacing_layout" class="arnExtension-ui-focused--element"> <option value="2">Simple</option> <option value="3" selected="selected">Full</option> </select> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20"> <path d="M10 16l-4-4h8l-4 4zm0-12L6 8h8l-4-4z"></path> </svg> </div></div></div><div class="arnExt-footer"> <div class="arnExt-footer-inner"> <div class="logo-company"><span class="logo"><svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10.5" cy="10.5" r="10.5" fill="url(#paint0_linear3)"/><circle cx="10.5001" cy="10.5" r="9.67742" fill="white"/><circle cx="10.5" cy="10.5" r="8.46774" fill="url(#paint1_linear3)"/><path d="M8.23066 14.7617C8.16735 14.7617 8.10403 14.7245 8.07796 14.6611C8.04072 14.5755 8.07796 14.4787 8.16362 14.4414L9.29954 13.9461C9.3852 13.9088 9.48203 13.9461 9.51928 14.0317C9.55652 14.1174 9.51928 14.2142 9.43362 14.2515L8.2977 14.7468C8.27535 14.758 8.25301 14.7617 8.23066 14.7617Z" fill="white"/><path d="M10.711 14.8251C10.6812 14.8251 10.6514 14.8177 10.6216 14.799L9.81719 14.2963C9.73898 14.2478 9.71663 14.1436 9.76505 14.0691C9.81346 13.9909 9.91774 13.9685 9.99223 14.0169L10.7967 14.5197C10.8749 14.5681 10.8972 14.6724 10.8488 14.7469C10.8228 14.799 10.7669 14.8251 10.711 14.8251Z" fill="white"/><path d="M16.0703 9.24232L16.9828 8.84382C17.1727 8.76189 17.1802 8.49374 16.9939 8.40063L12.7519 6.28521C12.6886 6.25542 12.6179 6.25169 12.5508 6.27777L11.3032 6.7731L10.1486 6.17348C10.0853 6.13997 10.0146 6.13624 9.94753 6.16231L4.37595 8.29262C4.18601 8.36338 4.15994 8.62409 4.33498 8.72837L5.13943 9.23488L3.91786 9.72276C3.73164 9.79725 3.70929 10.0505 3.87689 10.1585L7.83584 12.7171C7.9066 12.7618 7.99226 12.7693 8.06675 12.7357L9.63096 12.0542L10.9754 12.8959C11.0462 12.9406 11.1319 12.9443 11.2064 12.9108L17.1094 10.233C17.2956 10.1473 17.3031 9.88663 17.1206 9.7898L16.0703 9.24232ZM9.66076 11.0449L6.86007 9.34288L11.2548 7.56638L14.1672 9.11197L9.66076 11.0449Z" fill="white"/><path d="M7.5342 13.6445C7.5044 13.6445 7.47089 13.637 7.44482 13.6184L3.80243 11.2721C3.72422 11.2237 3.70187 11.1194 3.75401 11.0412C3.80615 10.963 3.90671 10.9406 3.98492 10.9928L7.63103 13.3428C7.70924 13.3912 7.73159 13.4955 7.67945 13.5737C7.6422 13.6184 7.59006 13.6445 7.5342 13.6445Z" fill="white"/><path d="M7.5342 14.6128C7.50441 14.6128 7.47089 14.6054 7.44482 14.5867L3.80243 12.2292C3.72422 12.1808 3.70187 12.0765 3.75401 11.9983C3.80243 11.9201 3.90671 11.8978 3.98492 11.9499L7.62731 14.3037C7.70552 14.3521 7.72786 14.4564 7.67572 14.5346C7.64221 14.5867 7.59006 14.6128 7.5342 14.6128Z" fill="white"/><path d="M8.24179 13.7897C8.17848 13.7897 8.11516 13.7525 8.08909 13.6892C8.05185 13.6035 8.08909 13.5067 8.17475 13.4695L9.2995 12.9778C9.38516 12.9406 9.48199 12.9778 9.51923 13.0635C9.55648 13.1492 9.51923 13.246 9.43357 13.2832L8.30883 13.7748C8.28648 13.786 8.26414 13.7897 8.24179 13.7897Z" fill="white"/><path d="M10.711 13.8568C10.6812 13.8568 10.6514 13.8493 10.6216 13.8307L9.81719 13.3279C9.73898 13.2795 9.71663 13.1752 9.76505 13.1007C9.81346 13.0225 9.91774 13.0002 9.99223 13.0486L10.7967 13.5514C10.8749 13.5998 10.8972 13.7041 10.8488 13.7785C10.8228 13.8307 10.7669 13.8568 10.711 13.8568Z" fill="white"/><path d="M11.4447 13.935C11.3814 13.935 11.3218 13.8978 11.292 13.8382C11.2548 13.7562 11.292 13.6557 11.374 13.6184L17.0536 11.0412C17.1355 11.004 17.236 11.0412 17.2733 11.1231C17.3105 11.2051 17.2733 11.3056 17.1914 11.3429L11.5118 13.9201C11.4931 13.9313 11.4708 13.935 11.4447 13.935Z" fill="white"/><path d="M11.4447 14.9032C11.3814 14.9032 11.3218 14.866 11.292 14.8064C11.2548 14.7245 11.292 14.6239 11.374 14.5867L17.0536 12.0094C17.1355 11.9722 17.236 12.0094 17.2733 12.0914C17.3105 12.1733 17.2733 12.2739 17.1914 12.3111L11.5118 14.8883C11.4931 14.8995 11.4708 14.9032 11.4447 14.9032Z" fill="white"/><defs><linearGradient id="paint0_linear3" x1="0" y1="10.5" x2="21" y2="10.5" gradientUnits="userSpaceOnUse"><stop stop-color="#0575E6"/><stop offset="1" stop-color="#021B79"/></linearGradient><linearGradient id="paint1_linear3" x1="11.1825" y1="18.3225" x2="14.2625" y2="4.865" gradientUnits="userSpaceOnUse"><stop stop-color="#1C2260"/><stop offset="1" stop-color="#3F4EAE"/></linearGradient></defs></svg></span><a href="https://www.arenacommerce.com/" class="logo-name" target="_blank">ArenaCommerce</a></div><div class="arnExtension-btn-group"> <button id="arnSpacing_btn" type="button" class="arnExtension-button-ui ui-drag--disabled">Insert</button> </div></div></div></div>
			`;
			break;


			case 'column_____Resp':
			id 		= `arnExtension_responsive`;
			html 	= `
			<div id="arnExtension_responsive" class="arnExtension-layout-editor arnExtension-popup-layout arnExtension-fixed ui-drag-element ui-drag--enabled" data-eid="column_____Resp" data-enable="true"><div class="arnExt-header"><div class="arnExt-header-inner"><div class="arnExt-header--title"><span>Responsive Carousel column settings</span></div><div class="arnExt-header--close"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="#212B36"/><mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="1" y="1" width="18" height="17"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="white"/></mask><g mask="url(#mask0)"></g></svg></div></div></div><div class="arnExtension-popup-body ui-drag--disabled"><div class="arnExt-body" data-layout="5"><div class="arnExt-body-inner"><div class="arnExtension-ui-focused arnExtension-input-ui"><label for="arn__xl"><span>Number of Column on Large Desktop</span><span>Set number of column for a screen larger than 1200px</span></label><div class="arnExtension-ui-focused-inner"><input id="arn__xl" type="number" name="arnExtension_reponsive" autocomplete="off" class="arnExtension-ui-focused--element" value="0" tabindex="0" min="0" max="12"></div></div><div class="arnExtension-ui-focused arnExtension-input-ui"><label for="arn__lg"><span>Number of Column on Desktop</span><span>Set number of column for a screen larger than 991px</span></label><div class="arnExtension-ui-focused-inner"><input id="arn__lg" type="number" name="arnExtension_reponsive" autocomplete="off" class="arnExtension-ui-focused--element" value="0" tabindex="1" min="0" max="12"></div></div><div class="arnExtension-ui-focused arnExtension-input-ui"><label for="arn__md"><span>Number of Column on Tablet</span><span>Set number of column for a screen larger or equal to 768px</span></label><div class="arnExtension-ui-focused-inner"><input id="arn__md" type="number" name="arnExtension_reponsive" autocomplete="off" class="arnExtension-ui-focused--element" value="0" tabindex="2" min="0" max="12"></div></div><div class="arnExtension-ui-focused arnExtension-input-ui"><label for="arn__sm"><span>Number of Column on Landscape mobile</span><span>Set number of column for a screen smaller or equal to 767px</span></label><div class="arnExtension-ui-focused-inner"><input id="arn__sm" type="number" name="arnExtension_reponsive" autocomplete="off" class="arnExtension-ui-focused--element" value="0" tabindex="3" min="0" max="12"></div></div><div class="arnExtension-ui-focused arnExtension-input-ui"><label for="arn__xs"><span>Number of Column on Mobile</span><span>Set number of column for a screen smaller than 576px</span></label><div class="arnExtension-ui-focused-inner"><input id="arn__xs" type="number" name="arnExtension_reponsive" autocomplete="off" class="arnExtension-ui-focused--element" value="0" tabindex="4" min="0" max="12"></div></div><div class="arnExtension-ui-focused arnExtension-input-ui"><label for="arn_xxs"><span>Number of Column on Small Mobile</span><span>Set number of column for a screen smaller than 375px</span></label><div class="arnExtension-ui-focused-inner"><input id="arn_xxs" type="number" name="arnExtension_reponsive" autocomplete="off" class="arnExtension-ui-focused--element" value="0" tabindex="5" min="0" max="12"></div></div></div></div><div class="arnExtension-notify_layer"></div></div><div class="arnExtension-sub-body ui-drag--disabled"><div class="arnExtension-btn-group"><button type="button" class="arnExtension-button-ui" data-option="1">Option 1</button><button type="button" class="arnExtension-button-ui" data-option="2">Option 2</button><button type="button" class="arnExtension-button-ui" data-option="3">Option 3</button><button type="button" class="arnExtension-button-ui" data-option="4">Option 4</button><button type="button" class="arnExtension-button-ui" data-option="5">Full</button></div></div><div class="arnExt-footer"><div class="arnExt-footer-inner"><div class="logo-company"><span class="logo"><svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10.5" cy="10.5" r="10.5" fill="url(#paint0_linear4)"/><circle cx="10.5001" cy="10.5" r="9.67742" fill="white"/><circle cx="10.5" cy="10.5" r="8.46774" fill="url(#paint1_linear4)"/><path d="M8.23066 14.7617C8.16735 14.7617 8.10403 14.7245 8.07796 14.6611C8.04072 14.5755 8.07796 14.4787 8.16362 14.4414L9.29954 13.9461C9.3852 13.9088 9.48203 13.9461 9.51928 14.0317C9.55652 14.1174 9.51928 14.2142 9.43362 14.2515L8.2977 14.7468C8.27535 14.758 8.25301 14.7617 8.23066 14.7617Z" fill="white"/><path d="M10.711 14.8251C10.6812 14.8251 10.6514 14.8177 10.6216 14.799L9.81719 14.2963C9.73898 14.2478 9.71663 14.1436 9.76505 14.0691C9.81346 13.9909 9.91774 13.9685 9.99223 14.0169L10.7967 14.5197C10.8749 14.5681 10.8972 14.6724 10.8488 14.7469C10.8228 14.799 10.7669 14.8251 10.711 14.8251Z" fill="white"/><path d="M16.0703 9.24232L16.9828 8.84382C17.1727 8.76189 17.1802 8.49374 16.9939 8.40063L12.7519 6.28521C12.6886 6.25542 12.6179 6.25169 12.5508 6.27777L11.3032 6.7731L10.1486 6.17348C10.0853 6.13997 10.0146 6.13624 9.94753 6.16231L4.37595 8.29262C4.18601 8.36338 4.15994 8.62409 4.33498 8.72837L5.13943 9.23488L3.91786 9.72276C3.73164 9.79725 3.70929 10.0505 3.87689 10.1585L7.83584 12.7171C7.9066 12.7618 7.99226 12.7693 8.06675 12.7357L9.63096 12.0542L10.9754 12.8959C11.0462 12.9406 11.1319 12.9443 11.2064 12.9108L17.1094 10.233C17.2956 10.1473 17.3031 9.88663 17.1206 9.7898L16.0703 9.24232ZM9.66076 11.0449L6.86007 9.34288L11.2548 7.56638L14.1672 9.11197L9.66076 11.0449Z" fill="white"/><path d="M7.5342 13.6445C7.5044 13.6445 7.47089 13.637 7.44482 13.6184L3.80243 11.2721C3.72422 11.2237 3.70187 11.1194 3.75401 11.0412C3.80615 10.963 3.90671 10.9406 3.98492 10.9928L7.63103 13.3428C7.70924 13.3912 7.73159 13.4955 7.67945 13.5737C7.6422 13.6184 7.59006 13.6445 7.5342 13.6445Z" fill="white"/><path d="M7.5342 14.6128C7.50441 14.6128 7.47089 14.6054 7.44482 14.5867L3.80243 12.2292C3.72422 12.1808 3.70187 12.0765 3.75401 11.9983C3.80243 11.9201 3.90671 11.8978 3.98492 11.9499L7.62731 14.3037C7.70552 14.3521 7.72786 14.4564 7.67572 14.5346C7.64221 14.5867 7.59006 14.6128 7.5342 14.6128Z" fill="white"/><path d="M8.24179 13.7897C8.17848 13.7897 8.11516 13.7525 8.08909 13.6892C8.05185 13.6035 8.08909 13.5067 8.17475 13.4695L9.2995 12.9778C9.38516 12.9406 9.48199 12.9778 9.51923 13.0635C9.55648 13.1492 9.51923 13.246 9.43357 13.2832L8.30883 13.7748C8.28648 13.786 8.26414 13.7897 8.24179 13.7897Z" fill="white"/><path d="M10.711 13.8568C10.6812 13.8568 10.6514 13.8493 10.6216 13.8307L9.81719 13.3279C9.73898 13.2795 9.71663 13.1752 9.76505 13.1007C9.81346 13.0225 9.91774 13.0002 9.99223 13.0486L10.7967 13.5514C10.8749 13.5998 10.8972 13.7041 10.8488 13.7785C10.8228 13.8307 10.7669 13.8568 10.711 13.8568Z" fill="white"/><path d="M11.4447 13.935C11.3814 13.935 11.3218 13.8978 11.292 13.8382C11.2548 13.7562 11.292 13.6557 11.374 13.6184L17.0536 11.0412C17.1355 11.004 17.236 11.0412 17.2733 11.1231C17.3105 11.2051 17.2733 11.3056 17.1914 11.3429L11.5118 13.9201C11.4931 13.9313 11.4708 13.935 11.4447 13.935Z" fill="white"/><path d="M11.4447 14.9032C11.3814 14.9032 11.3218 14.866 11.292 14.8064C11.2548 14.7245 11.292 14.6239 11.374 14.5867L17.0536 12.0094C17.1355 11.9722 17.236 12.0094 17.2733 12.0914C17.3105 12.1733 17.2733 12.2739 17.1914 12.3111L11.5118 14.8883C11.4931 14.8995 11.4708 14.9032 11.4447 14.9032Z" fill="white"/><defs><linearGradient id="paint0_linear4" x1="0" y1="10.5" x2="21" y2="10.5" gradientUnits="userSpaceOnUse"><stop stop-color="#0575E6"/><stop offset="1" stop-color="#021B79"/></linearGradient><linearGradient id="paint1_linear4" x1="11.1825" y1="18.3225" x2="14.2625" y2="4.865" gradientUnits="userSpaceOnUse"><stop stop-color="#1C2260"/><stop offset="1" stop-color="#3F4EAE"/></linearGradient></defs></svg></span><a href="https://www.arenacommerce.com/" class="logo-name" target="_blank">ArenaCommerce</a></div><div class="arnExtension-btn-group"><button type="button" id="arnExtension_respInsert" class="arnExtension-button-ui ui-drag--disabled">Insert</button></div></div></div></div>
			`;
			break;

			case 'rich_____Editor':
			id 		= `arnExtension_richText`;
			html 	= `
			<div id="arnExtension_richText" class="arnExtension-layout-editor arnExtension-popup-layout arnExtension-fixed ui-drag-element ui-drag--enabled" data-eid="rich_____Editor" data-enable="true"><div class="arnExt-header"><div class="arnExt-header-inner"><div class="arnExt-header--title"><span>Advanced Text Editor</span></div><div class="arnExt-header--close"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="#212B36"/><mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="1" y="1" width="18" height="17"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.4141 10L17.7071 3.70701C18.0981 3.31601 18.0981 2.68401 17.7071 2.29301C17.3161 1.90201 16.6841 1.90201 16.2931 2.29301L10.0001 8.58601L3.70713 2.29301C3.31613 1.90201 2.68413 1.90201 2.29313 2.29301C1.90213 2.68401 1.90213 3.31601 2.29313 3.70701L8.58613 10L2.29313 16.293C1.90213 16.684 1.90213 17.316 2.29313 17.707C2.48813 17.902 2.74413 18 3.00013 18C3.25613 18 3.51213 17.902 3.70713 17.707L10.0001 11.414L16.2931 17.707C16.4881 17.902 16.7441 18 17.0001 18C17.2561 18 17.5121 17.902 17.7071 17.707C18.0981 17.316 18.0981 16.684 17.7071 16.293L11.4141 10Z" fill="white"/></mask><g mask="url(#mask0)"></g></svg></div></div></div><div class="arnExtension-popup-body ui-drag--disabled"><div class="arnExt-body"><div class="arnExt-body-inner"><span>The dead simple medium inline editor. Adding your content and click Insert when finish</span></div></div><div class="arnExtension-notify_layer"></div></div><div class="arnExt-footer"><div class="arnExt-footer-inner"><div class="logo-company"><span class="logo"><svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10.5" cy="10.5" r="10.5" fill="url(#paint0_linear5)"/><circle cx="10.5001" cy="10.5" r="9.67742" fill="white"/><circle cx="10.5" cy="10.5" r="8.46774" fill="url(#paint1_linear5)"/><path d="M8.23066 14.7617C8.16735 14.7617 8.10403 14.7245 8.07796 14.6611C8.04072 14.5755 8.07796 14.4787 8.16362 14.4414L9.29954 13.9461C9.3852 13.9088 9.48203 13.9461 9.51928 14.0317C9.55652 14.1174 9.51928 14.2142 9.43362 14.2515L8.2977 14.7468C8.27535 14.758 8.25301 14.7617 8.23066 14.7617Z" fill="white"/><path d="M10.711 14.8251C10.6812 14.8251 10.6514 14.8177 10.6216 14.799L9.81719 14.2963C9.73898 14.2478 9.71663 14.1436 9.76505 14.0691C9.81346 13.9909 9.91774 13.9685 9.99223 14.0169L10.7967 14.5197C10.8749 14.5681 10.8972 14.6724 10.8488 14.7469C10.8228 14.799 10.7669 14.8251 10.711 14.8251Z" fill="white"/><path d="M16.0703 9.24232L16.9828 8.84382C17.1727 8.76189 17.1802 8.49374 16.9939 8.40063L12.7519 6.28521C12.6886 6.25542 12.6179 6.25169 12.5508 6.27777L11.3032 6.7731L10.1486 6.17348C10.0853 6.13997 10.0146 6.13624 9.94753 6.16231L4.37595 8.29262C4.18601 8.36338 4.15994 8.62409 4.33498 8.72837L5.13943 9.23488L3.91786 9.72276C3.73164 9.79725 3.70929 10.0505 3.87689 10.1585L7.83584 12.7171C7.9066 12.7618 7.99226 12.7693 8.06675 12.7357L9.63096 12.0542L10.9754 12.8959C11.0462 12.9406 11.1319 12.9443 11.2064 12.9108L17.1094 10.233C17.2956 10.1473 17.3031 9.88663 17.1206 9.7898L16.0703 9.24232ZM9.66076 11.0449L6.86007 9.34288L11.2548 7.56638L14.1672 9.11197L9.66076 11.0449Z" fill="white"/><path d="M7.5342 13.6445C7.5044 13.6445 7.47089 13.637 7.44482 13.6184L3.80243 11.2721C3.72422 11.2237 3.70187 11.1194 3.75401 11.0412C3.80615 10.963 3.90671 10.9406 3.98492 10.9928L7.63103 13.3428C7.70924 13.3912 7.73159 13.4955 7.67945 13.5737C7.6422 13.6184 7.59006 13.6445 7.5342 13.6445Z" fill="white"/><path d="M7.5342 14.6128C7.50441 14.6128 7.47089 14.6054 7.44482 14.5867L3.80243 12.2292C3.72422 12.1808 3.70187 12.0765 3.75401 11.9983C3.80243 11.9201 3.90671 11.8978 3.98492 11.9499L7.62731 14.3037C7.70552 14.3521 7.72786 14.4564 7.67572 14.5346C7.64221 14.5867 7.59006 14.6128 7.5342 14.6128Z" fill="white"/><path d="M8.24179 13.7897C8.17848 13.7897 8.11516 13.7525 8.08909 13.6892C8.05185 13.6035 8.08909 13.5067 8.17475 13.4695L9.2995 12.9778C9.38516 12.9406 9.48199 12.9778 9.51923 13.0635C9.55648 13.1492 9.51923 13.246 9.43357 13.2832L8.30883 13.7748C8.28648 13.786 8.26414 13.7897 8.24179 13.7897Z" fill="white"/><path d="M10.711 13.8568C10.6812 13.8568 10.6514 13.8493 10.6216 13.8307L9.81719 13.3279C9.73898 13.2795 9.71663 13.1752 9.76505 13.1007C9.81346 13.0225 9.91774 13.0002 9.99223 13.0486L10.7967 13.5514C10.8749 13.5998 10.8972 13.7041 10.8488 13.7785C10.8228 13.8307 10.7669 13.8568 10.711 13.8568Z" fill="white"/><path d="M11.4447 13.935C11.3814 13.935 11.3218 13.8978 11.292 13.8382C11.2548 13.7562 11.292 13.6557 11.374 13.6184L17.0536 11.0412C17.1355 11.004 17.236 11.0412 17.2733 11.1231C17.3105 11.2051 17.2733 11.3056 17.1914 11.3429L11.5118 13.9201C11.4931 13.9313 11.4708 13.935 11.4447 13.935Z" fill="white"/><path d="M11.4447 14.9032C11.3814 14.9032 11.3218 14.866 11.292 14.8064C11.2548 14.7245 11.292 14.6239 11.374 14.5867L17.0536 12.0094C17.1355 11.9722 17.236 12.0094 17.2733 12.0914C17.3105 12.1733 17.2733 12.2739 17.1914 12.3111L11.5118 14.8883C11.4931 14.8995 11.4708 14.9032 11.4447 14.9032Z" fill="white"/><defs><linearGradient id="paint0_linear5" x1="0" y1="10.5" x2="21" y2="10.5" gradientUnits="userSpaceOnUse"><stop stop-color="#0575E6"/><stop offset="1" stop-color="#021B79"/></linearGradient><linearGradient id="paint1_linear5" x1="11.1825" y1="18.3225" x2="14.2625" y2="4.865" gradientUnits="userSpaceOnUse"><stop stop-color="#1C2260"/><stop offset="1" stop-color="#3F4EAE"/></linearGradient></defs></svg></span><a href="https://www.arenacommerce.com/" class="logo-name" target="_blank">ArenaCommerce</a></div><div class="arnExtension-btn-group"><button type="button" id="arnRichText_insert" class="arnExtension-button-ui">Insert</button></div></div></div></div>
			`;
			break;

			default:
			break;
		}
		id != '' && !$('#arnExt').find('#'+id).length && $('#arnExt').append(html.trim());
	}
	,dragElem_inViewport : ()=>{
		var isInViewport = elem=>{
			let bounding = elem[0].getBoundingClientRect();
			return (
				bounding.top >= 0 &&
				bounding.left >= 0 &&
				bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
				bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
				);
		};

		$('.ui-drag-element').each((i,v)=>{
			let _this = $(v);
			if (_this.is(':visible')) {
				!isInViewport(_this) && _this.attr('style', 'right: 0;top: 5%;');
			}
		})
	}

	,popupEvent : ()=>{

		let sPositions 	= localStorage.positions || "{}"
		,positions 		= JSON.parse(sPositions)

		$.each(positions, function (id, pos) {$("#" + id).css(pos);})

		$('.ui-drag-element').each((i,v)=>{
			!$(v).hasClass('.ui-draggable') && $(v).draggable({
				cancel:'.ui-drag--disabled'
				,snap: "body"
				,snapMode: "inner"
				,containment: "window"
				,scroll: false
				,stop: function(event, ui){
					let _t = ui.position.top,
					_l = ui.position.left,
					_this = $(this);

					positions[this.id] = ui.position;
					localStorage.positions = JSON.stringify(positions);
				}
			})
		});

		$(document)
		.on('mouseenter','.ui-drag-element',function(e) {
			if (!$(this).hasClass('.ui-draggable')) {
				$(this).draggable({
					cancel:'.ui-drag--disabled'
					,snap: "body"
					,snapMode: "inner"
					,containment: "window"
					,scroll: false
					,stop: function(event, ui){
						let _t = ui.position.top,
						_l = ui.position.left,
						_this = $(this);

						positions[this.id] = ui.position
						localStorage.positions = JSON.stringify(positions)
					}
				});
			}
		})
		.on('focus','.arnExtension-ui-focused--element',(e)=>{
			$(e.currentTarget).parents('.arnExtension-ui-focused').first().addClass('arnExtension-ui--is-focused');
		})
		.on('focusout','.arnExtension-ui-focused--element',(e)=>{
			$(e.currentTarget).parents('.arnExtension-ui-focused').first().removeClass('arnExtension-ui--is-focused');
		})

		arnExt.dragElem_inViewport();
		arnExt.poupEvent_Interaction();
	}

	,find_theme_id : ()=>{
		let _idHTML = $('script[id="shopify-features"]').next('script').html()
		,id = $('#arnExtension_bubble_quicklink').attr('data-theme-id');

		if (typeof _idHTML != 'undefined' && typeof id == 'undefined') {
			let _themeID = _idHTML.slice(_idHTML.indexOf("Shopify.theme = ")+16, _idHTML.indexOf("Shopify.theme.handle")-2);
			let _themeURL = _idHTML.slice(_idHTML.indexOf("Shopify.shop = ")+15, _idHTML.indexOf("Shopify.locale")-2).replace(/\"/g,'').trim();

			if (_themeURL.length > 3) {$('#arnExtension_bubble_quicklink').attr('data-theme-url',_themeURL);}

			try {
				let _id = JSON.parse(_themeID).id;
				$('#arnExtension_bubble_quicklink').attr('data-theme-id',_id);
			} catch(e) {
				console.log(e);
			}
		}
	}

	,poupEvent_Interaction : ()=>{
		let getJsonPath = ()=>{return [location.protocol, '//', location.host,location.pathname,'.json'].join('')}

		$(document)
		.on('click', '.arnExtension-bubble-popup .arnExtension-popup--clicked', function(e){
			let _parent = $(this).parents('.arnExtension-bubble-popup');

			$(_parent.attr('data-target')).toggleClass('arnExtension-popup-layout--visible');
			$(_parent.attr('data-target')).hasClass('arnExtension-popup-layout--visible') && _parent.hide();
			arnExt.dragElem_inViewport();
		})
		.on('click','body', function(e){
			if(!$(e.target).parents('div[data-eid]').length && !$(e.target)[0].hasAttribute('data-eid')){
				$('div[data-eid]:not([data-eid="quick_______Bar"]):not([data-eid="content__Editor"]).arnExtension-popup-layout--visible').removeClass('arnExtension-popup-layout--visible').attr('data-target-id', '');
			}
		})
		.on('click','.arnExt-header--close',function(e) {
			let _parent = $(this).parents('.arnExtension-popup-layout');
			_parent.removeClass('arnExtension-popup-layout--visible');
			$('.arnExtension-bubble-popup[data-target="#'+_parent.attr('id')+'"]').show();
		})

		.on('click','.arnExtension-popup-layout .arnExt-ui-button',function(e){
			e.stopPropagation();
			if ($(this).parents('#arnExtension_icon_picker').length) {return;}
			let _input  = $(this).find('input[name="arnExt-ui-button-data"]')
			,eventCase 	= _input.val()
			,hr 		= null
			,_url;

			if (typeof eventCase == 'undefined') {arnExt.notify('Error~!');return;}

			arnExt.find_theme_id();

			let _id = +$('#arnExtension_bubble_quicklink').attr('data-theme-id')
			,_storeDomain = $('#arnExtension_bubble_quicklink').attr('data-theme-url');

			switch (eventCase) {

				case 'editor_customize':

				if (location.pathname === '/') {
					hr = [location.protocol, '//', location.host, '/admin/themes/' + _id + '/editor'].join('');
				} else {
					hr = [location.protocol, '//', location.host, '/admin/themes/' + _id + '/editor#' + location.pathname].join('');
				}
				window.open(hr, '_blank');
				break;

				case 'edit_content':
				if (location.pathname === '/' || location.pathname == '/collections/all') {
					arnExt.notify('Not support for this page :)');
					break;
				}

				if (location.pathname === '/collections') {
					hr = [location.protocol, '//', location.host, '/admin', location.pathname].join('');
					window.open(hr, '_blank');

				} else {
					let _str = $('script[id="__st"]').html();

					_id = JSON.parse(_str.slice(_str.indexOf('{'), _str.lastIndexOf('}') + 1));
					hr = [location.protocol, '//', location.host, '/admin/', _id.rtyp + 's/', _id.rid].join('');
					window.open(hr, '_blank');

				}
				break;

				case 'customfields':
				if (location.pathname === '/' || location.pathname == '/collections/all') {
					arnExt.notify('Not support for this page!');
					break;
				}

				if (location.pathname === '/collections') {

					hr = [location.protocol, '//', location.host, '/admin/apps/arena-custom-fields', location.pathname, '_editor'].join('');
					window.open(hr, '_blank');
				}
				else if (location.pathname.includes('/blogs')) {
					if (!$('script[id="__st"]').length) {
						arnExt.notify('Error! :)');
						break;
					}

					let _str = $('script[id="__st"]').html()

					_id = JSON.parse(_str.slice(_str.indexOf('{'), _str.lastIndexOf('}') + 1));

					if (_id.rtyp == "article") {
						hr = [location.protocol, '//', location.host, '/admin/apps/arena-custom-fields/posts_editor?id=', _id.rid, '&shop=', location.host].join('');
					} else {
						hr = [location.protocol, '//', location.host, '/admin/apps/arena-custom-fields/', _id.rtyp + 's_editor/', _id.rid].join('');
					}
					window.open(hr, '_blank');

				}
				else {
					arnExt._requestAjax(getJsonPath())
					.success(response=>{
						try{
							let _type = Object.keys(response)[0];
							hr = [location.protocol, '//', location.host, '/admin/apps/arena-custom-fields/', _type + 's_editor/', response[_type].id].join('');
							window.open(hr, '_blank');
						}catch(e){
							console.log('Error~!',e);
						}
					})
					.error(e=>{
						arnExt.notify('Error~!');
						console.log(e);
					})
				}
				break;

				case 'grid_columns':
				let _parent = $(this).parents('.arnExtension-popup-layout'),
				_value = _input.attr('data-columns') == 'offset' ? 'offset' : Number(_input.attr('data-columns')),
				html;

				if (!_parent.hasClass('arnExtension-notify_layer--showing')) {

					if (_value == 'offset') {
						html = `<div class="row align-items-center"><div class="offset-md-3 col-md-9 col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div></div>`;

					}else if (_value == 1) {
						html = `<div class="row align-items-center"><div class="col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div></div>`;
					} else {
						let _t,_n;

						switch (_value) {
							case 3:
							_n = 4;
							_t = `
							<div class="col-md-${_n} col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div>
							<div class="col-md-${_n} col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div>
							<div class="col-md-${_n} col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div>
							`;
							break;
							case 4:
							_n = 3;
							_t = `
							<div class="col-md-${_n} col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div>
							<div class="col-md-${_n} col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div>
							<div class="col-md-${_n} col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div>
							<div class="col-md-${_n} col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div>
							`;
							break;
							default:
							_n = 6;
							_t = `
							<div class="col-md-${_n} col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div>
							<div class="col-md-${_n} col-12">Etiam sollicitudin, ipsum eu pulvinar rutrum, tellus ipsum laoreet sapien</div>
							`;
							break;
						}
						html = `<div class="row align-items-center">${_t}</div>`;
					}

					$('#arnExt-grid-columns-value').attr('value',html).select();
					document.execCommand('copy');

					_parent.addClass('arnExtension-notify_layer--showing');
					arnExt.debounceTime(() => {
						_parent.removeClass('arnExtension-notify_layer--showing');
					}, 1500)()
				}
				break;

				case 'code_editor':
				hr = [location.protocol, '//', location.host, '/admin/themes/' + _id ].join('');
				window.open(hr, '_blank');
				break;

				case 'sections_editor':
				if($('script[id="arn_embed_script"]').length){
					$('script[id="arn_embed_script"]').remove();
					$('#arn-section-sticky').length && $('#arn-section-sticky').remove();
				}
				else{
					arnExt.injectScript('arn_embed_script', chrome.extension.getURL('scripts/arn_embed_script.js'), 'body');
				}
				break;
				case 'extra_products':
				hr = [location.protocol, '//', location.host, '/admin/', 'products?limit=250'].join('');
				window.open(hr, '_blank');
				break;

				default:
				hr = [location.protocol, '//', location.host, '/admin/', eventCase].join('');
				window.open(hr, '_blank');
				break;
			}
		});
	}

	,createDatepicker : function(){
		if (location.pathname.includes('/admin') && location.pathname.includes('/editor')) {
			$(document).on('click','input[placeholder*="YYYY"]', function(){
				$(this).datepicker({
					showButtonPanel: true,
					onClose:function(){$(this).focus();},
					beforeShow: function(input, inst) {
						$(inst.dpDiv)
						.addClass('ui-drag-element arn-datepicker ui-drag--enabled')
						.attr('data-eid', 'date_____Picker')
						.attr('data-enable', arnExt.datepicker);

						$('#arnExt').append($(inst.dpDiv));
					}
				}).unbind('focus').click(function(){
					arnExt.datepicker ? $(this).datepicker('show') : $(this).datepicker('hide');
				});
			});
		}
	}

	,createEditor : ()=>{
		arnExt.createInnerHTML('rich_____Editor');

		let btnArr = ['bold', 'italic', 'underline', 'strikethrough', 'quote', 'anchor', 'superscript', 'subscript', 'orderedlist', 'unorderedlist', 'h2', 'h3','hightlight'];
		let editor = new MediumEditor('#arnExtension_richText .arnExt-body-inner', {
			placeholder: false,
			toolbar: {
				buttons: btnArr,
			}
			,anchor: {
				targetCheckbox: true
			}
			,extensions: {
				"hightlight": new MediumButton({
					label: "Hightlight"
					,start: '<span class="hl_primary">'
					,end: "</span>"
				})
			}
		});

		$(document)
		.on('dblclick','textarea[name*="settings"], input[type="text"][name*="settings"]:not(.sp-input)',function(){
			let _this = $(this) ,_name = _this.attr('name') ,_placeholder = _this.attr('placeholder');

			if (_name.includes('icon') || _name.includes('padding') || _name.includes('margin') || _name.includes('width') || _name.includes('resp') || (_placeholder && _placeholder.includes('YYYY'))) {
				return;
			}

			if ($('#arnExtension_richText').attr('data-enable') == 'true') {
				let _id = _this.attr('id');
				arnExt.debounceTime(()=>{
					$('#arnExtension_richText').addClass('arnExtension-popup-layout--visible').attr('data-target-id', _id).find('.arnExt-body-inner').html(_this.val());
				},100)()
			}
		})
		.on('click','#arnRichText_insert',function(){
			let _e = $('#arnExtension_richText');
			$('#'+_e.attr('data-target-id')).val($(_e).find('.arnExt-body-inner').html()).select();
			$('#arnExtension_richText').removeClass('arnExtension-popup-layout--visible').removeAttr('data-target-id').find('.arnExt-body-inner').html();
		});
	}

	,createIconPicker : async ()=>{
		if (!(location.pathname.includes('/admin') && location.pathname.includes('/editor'))) {return;}
		arnExt.createInnerHTML('font_____Picker');

		$(document)
		.on('change','#arnExt_pick_icon_theme', function(){
			let _v = $(this).val();
			arnExt.createIconTheme(_v);
			arnExt.icon_picker_data[0].value = _v;
			let newData = arnExt.icon_picker_data;

			chrome.storage.sync.set({'arnIconTheme': newData});
			$('#arnExtension_icon_picker .arnIcon-page').html(1);
			$('#arnExtension_icon_picker .arnExtension-prev').attr('data-unvailable', 'true');
			$('#arnExtension_icon_picker .arnExtension-next').attr('data-unvailable', 'false');
			$('#arnExt_icon_search').val('');
		})
		.on('change','#arnExt_icon_view', function(){
			let _v = $(this).val();
			arnExt.icon_picker_data[1].value = _v;
			let newData = arnExt.icon_picker_data;
			chrome.storage.sync.set({'arnIconTheme': newData});
			$('#arnExtension_icon_picker .arnExtension-icon-container').attr('class', 'arnExtension-icon-container arnExt-body--group-buttons arnExt-grid-'+_v);
		})
		.on('click', '#arnExtension_icon_picker .arnExtension-pagination > div', (e)=>{
			let _this 		= $(e.currentTarget);
			if(_this.attr('data-unvailable') == 'true'){return;}

			let _elem 		= _this[0].className
			,_page 			= Number($('#arnExtension_icon_picker .arnIcon-page').html().trim())
			,_total_page 	= Number($('#arnExtension_icon_picker .arnIcon-total-page').html().trim());

			if (_elem.includes('next')) {_page < _total_page && _page++}
				if (_elem.includes('prev')) {_page > 1 && _page--}
					if (_elem.includes('first')){_page = 1;}
				if (_elem.includes('last')) {_page = _total_page;}

				arnExt.createIcon_pagination(_total_page, _page);
				if ($('#arnExtension_icon_picker.arnExt--is-filter').length) {
					arnExt.loopIconTheme(arnExt.icon_picker_data[2].value, _page);
				}else{
					arnExt.createIconTheme(arnExt.icon_picker_data[0].value, _page);
				}
			})
		.on('keyup','#arnExt_icon_search', arnExt.debounceTime(()=>{
			let _key = $('#arnExt_icon_search').val(), _iconContainer = $('#arnExtension_icon_picker');

			$('#arnExtension_icon_picker .arnExt-ui-button').removeClass('arnExt-filter-active');
			_iconContainer.removeClass('arnExt-icon-is-filter');

			if (_key.length > 1) {
				let _el = _iconContainer.find('.arnExt-ui-button input[name="arnExt-ui-button-data-icon"][value*="'+_key+'"]');

				if (_el.length) {
					_el.parents('.arnExt-ui-button').addClass('arnExt-filter-active');
					_iconContainer.addClass('arnExt-icon-is-filter');
				}
				let newAr = [...arnExt.data_icon_theme[arnExt.icon_picker_data[0].value]].filter((i)=>{return i.name.includes(_key);});
				arnExt.icon_picker_data[2].value.length = 0;
				arnExt.icon_picker_data[2].value = newAr;
				$('#arnExtension_icon_picker .arnIcon-page').html(1);
				arnExt.loopIconTheme(newAr);
				if (!newAr.length) {
					arnExt.notify('Not found !','info');
					$('#arnExtension_icon_picker.arnExt--is-filter').length && arnExt.createIconTheme(arnExt.icon_picker_data[0].value);
				}
			}else if(_key.length == 1) {
				arnExt.notify('Please enter at least 2 characters !','info');
			}else{
				$('#arnExtension_icon_picker.arnExt--is-filter').length && arnExt.createIconTheme(arnExt.icon_picker_data[0].value);
			}
			return;
		}, 1000))
		.on('click', '#arnExtension_icon_picker .arnExt-ui-button', (e)=>{
			let _this 	= $(e.currentTarget)
			,_parent 	= _this.parents("#arnExtension_icon_picker")
			,_value 	= _this.find('input[name="arnExt-ui-button-data-icon"]').val();
			$('#'+_parent.attr('data-target-id')).val(_value).select();

			_parent.addClass('arnExtension-notify_layer--showing');
			arnExt.debounceTime(() => {
				_parent.removeClass('arnExtension-notify_layer--showing');
				$('#'+_parent.attr('data-target-id')).trigger('blur');
			}, 700)()
		})
		.on('click','input[type="text"][id*="icon"].next-input',function(e) {

			if ($('#arnExtension_icon_picker').attr('data-enable') == 'true') {
				let _id = $(this).attr('id');
				arnExt.debounceTime(()=>{
					$('#arnExtension_icon_picker').addClass('arnExtension-popup-layout--visible').attr('data-target-id', _id);
				},100)()
			}
		})

		let arnExt_icon_data = await arnExt._requestAjax(`https://xadmin.arenacommerce.com/api/get-fonts`,'get','text')
		.success(data=>{return data;})
		.error(e=>{return false;});

		let response = false;
		try{
			response = !arnExt_icon_data ? false : JSON.parse(arnExt_icon_data);
		}catch(e){
			return false;
		}

		if (response) {
			let _key = Object.keys(response)
			,_type = _key[0]
			,_selectFontPick = '';

			arnExt.data_icon_theme = response;
			chrome.storage.sync.get(['arnIconTheme'],function(result){
				$('div[data-eid="font_____Picker"]').attr('data-enable', arnExt.iconPicker);

				let oldTheme = result['arnIconTheme'] === undefined ? arnExt.icon_picker_data : result['arnIconTheme'];

				for (var i = 0; i < _key.length; i++) {
					let n = _key[i];
					if (oldTheme[0].value === n.toLowerCase()) {
						_selectFontPick += `<option value="${n.toLowerCase()}" selected>${n}</option>`;
					}else{
						_selectFontPick += `<option value="${n.toLowerCase()}">${n}</option>`;
					}
				}
				$('#arnExt_pick_icon_theme').empty().html(_selectFontPick);

				$('#arnExt_icon_view option[value='+oldTheme[1].value+']').prop('selected',true);
				arnExt.icon_picker_data[1].value = oldTheme[1].value;

				arnExt.createIconTheme(oldTheme[0].value === undefined ? _type : oldTheme[0].value);
			});
		}
		else{
			arnExt.notify("Failed to load icon!");
			$('#arnExtension_icon_picker').remove();
		}
	}
	,createIcon_pagination : (t, p = null)=>{
		$('#arnExtension_icon_picker .arnExtension-pagination > div').attr('data-unvailable', 'false');
		let _page = p == null ? Number($('#arnExtension_icon_picker .arnIcon-page').html()) : p;
		if (_page == 1) {
			$('#arnExtension_icon_picker .arnExtension-prev, #arnExtension_icon_picker .arnExtension-first').attr('data-unvailable', 'true');
		}

		if ( _page == t) {
			$('#arnExtension_icon_picker .arnExtension-next, #arnExtension_icon_picker .arnExtension-last').attr('data-unvailable', 'true');
		}

		$('#arnExtension_icon_picker .arnIcon-page').html(_page);
		$('#arnExtension_icon_picker .arnIcon-total-page').html(t);
	}
	,createIconTheme : (theme, start=1)=>{
		let iconTheme_data = arnExt.data_icon_theme
		,icon_per_page = 30
		,count_icon = 0
		,startIndex = 1+(start*icon_per_page-icon_per_page);

		arnExt.icon_picker_data[0].value = theme;

		if (iconTheme_data && iconTheme_data[theme].length) {
			let _element = $('#arnExtension_icon_picker')
			,_style = ''
			,_icon_layout = ''
			,_total = Math.ceil((iconTheme_data[theme].length-1)/icon_per_page);

			for (let i = startIndex; i < iconTheme_data[theme].length; i++) {
				count_icon++;
				if (count_icon>icon_per_page) {break;}
				let o = iconTheme_data[theme][i];
				_style += `#arnExtension_icon_picker .${o.name}:before{content:"\\${o.value}";}`;
				_icon_layout +=`
				<div class="arnExt-ui-button">
				<div class="arnExt-ui-button-inner">
				<input type="hidden" name="arnExt-ui-button-data-icon" value="${o.name}">
				<div class="arnExt-ui-button--icon"><span class="arnExt-ui-button--icon-name ${o.name}"></span></div>
				</div>
				</div>`;
			}
			_element.removeClass('arnExt--is-filter').find('style').empty().html(`@font-face {font-family: "arenafontExtension";font-weight: normal;font-style: normal;src: url('${iconTheme_data[theme][0].value}');}${_style}`);
			_element.find('.arnExtension-icon-container').remove();
			_element.find('.arnExt-body-inner').append('<div class="arnExtension-icon-container arnExt-body--group-buttons arnExt-grid-'+arnExt.icon_picker_data[1].value+'">'+_icon_layout+'</div>');

			startIndex == 1 && arnExt.createIcon_pagination(_total);
		}
	}
	,loopIconTheme : (array, start=1)=>{
		if (array.length) {
			let icon_per_page = 30
			,count_icon = 0
			,startIndex = 0+(start*icon_per_page-icon_per_page);

			let _element = $('#arnExtension_icon_picker')
			,_icon_layout = ''
			,_style = ''
			,_total = Math.ceil(array.length/icon_per_page);

			for (let i = startIndex; i < array.length; i++) {
				count_icon++;
				if (count_icon>icon_per_page) {break;}
				let o = array[i];
				_style += `#arnExtension_icon_picker .${o.name}:before{content:"\\${o.value}";}`;
				_icon_layout +=`
				<div class="arnExt-ui-button">
				<div class="arnExt-ui-button-inner">
				<input type="hidden" name="arnExt-ui-button-data-icon" value="${o.name}">
				<div class="arnExt-ui-button--icon"><span class="arnExt-ui-button--icon-name ${o.name}"></span></div>
				</div>
				</div>`;
			}
			_element.find('style').empty().html(`@font-face {font-family: "arenafontExtension";font-weight: normal;font-style: normal;src: url('${arnExt.data_icon_theme[arnExt.icon_picker_data[0].value][0].value}');}${_style}`);
			_element.find('.arnExtension-icon-container').remove();
			_element.find('.arnExt-body-inner').append('<div class="arnExtension-icon-container arnExt-body--group-buttons arnExt-grid-'+arnExt.icon_picker_data[1].value+'">'+_icon_layout+'</div>');
			_element.addClass('arnExt--is-filter');
			arnExt.createIcon_pagination(_total);
		}
	}

	,createHeaderCollapsed : function(element){
		if (!(location.pathname.includes('/admin') && location.pathname.includes('/editor'))) {return;}

		let _element = element || $('.te-sidebar__content[component="UI.PanelContainer"] > .te-panel')
		,_svg = `<svg class="arnSVG next-icon next-icon--color-slate-lighter next-icon--size-20 next-icon--rotate-270" aria-hidden="true" focusable="false"><use xlink:href="#next-disclosure"></use></svg>`
		,_p = _element.find('section.theme-editor__card');

		if (!_p.find('.arnCollapse').length) {
			_p.find('h3.ui-subheading').parent().addClass('arnCollapse');
			_p.find('.arnCollapse').each((index, el)=>{
				let _this = $(el);
				if (_this.nextAll('*:not(.next-card__section--half-spacing)').length) {
					let _h3 = _this.find('h3.ui-subheading')
					!_h3.find('svg.arnSVG').length && _h3.prepend(_svg);
					_this.nextAll('*:not(.next-card__section--half-spacing)').hide();
				}else{
					_this.removeClass('arnCollapse');
				}
			});
			arnExt.createHeaderCollapsed_block();
		}
	}
	,createHeaderCollapsed_block : (element)=>{
		let _b = element || $('ul.theme-editor-action-list .ui-accordion__panel')
		,_svg = `<svg class="arnSVG next-icon next-icon--color-slate-lighter next-icon--size-20 next-icon--rotate-270" aria-hidden="true" focusable="false"><use xlink:href="#next-disclosure"></use></svg>`;
		_b.find('footer').css('margin-top', '1rem');
		_b.children('header').each(function(){
			let _this = $(this), _nextContent = _this.nextUntil('header,.theme-setting--hidden,footer');
			if (_nextContent.length > 0) {
				let _h3 = _this.addClass('arnCollapse').find('h3.ui-subheading');
				!_h3.find('svg.arnSVG').length && _h3.prepend(_svg);
				_nextContent.hide();
			}
		})
	}
	,removeHeaderCollapsed : function(){
		let e = $('.arnCollapse');
		e.nextAll().attr('style') == 'display: none;' && e.nextAll().removeAttr('style');
		e.find('svg.arnSVG').remove();
		e.removeClass('arnCollapse');
	}

	,createResponsiveColumn : ()=>{
		arnExt.createInnerHTML('column_____Resp');

		$(document)
		.on('click','input[type="text"][id*="resp"],input[type="text"][id*="width"]',function(e) {
			e.stopPropagation();
			if ($('#arnExtension_responsive').attr('data-enable') == 'true') {
				let _this = $(this), _id = _this.attr('id');
				arnExt.debounceTime(()=>{
					arnExt.responsiveGrid_handle(_this.val());
					$('#arnExtension_responsive').addClass('arnExtension-popup-layout--visible').attr('data-target-id', _id);
				},100)()
			}
		})
		.on('click','#arnExtension_respInsert',function() {
			let e 	  	= $('#arnExtension_responsive')
			,_t 	= '#' + e.attr('data-target-id')
			,_option = Number(e.find('.arnExt-body').attr('data-layout'))
			,_vTemp = []
			,_xl = _lg = _md = _sm = _xs = _xxs = '';
			switch (_option) {
				case 1:
				_md  = $('#arn__md').val();
				_sm  = $('#arn__sm').val();
				break;
				case 2:
				_lg  = $('#arn__lg').val();
				_md  = $('#arn__md').val();
				_sm  = $('#arn__sm').val();
				break;
				case 3:
				_lg  = $('#arn__lg').val();
				_md  = $('#arn__md').val();
				_sm  = $('#arn__sm').val();
				_xs  = $('#arn__xs').val();
				break;
				case 4:
				_xl  = $('#arn__xl').val();
				_lg  = $('#arn__lg').val();
				_md  = $('#arn__md').val();
				_sm  = $('#arn__sm').val();
				_xs  = $('#arn__xs').val();
				break;
				default:
				_xl  = $('#arn__xl').val();
				_lg  = $('#arn__lg').val();
				_md  = $('#arn__md').val();
				_sm  = $('#arn__sm').val();
				_xs  = $('#arn__xs').val();
				_xxs = $('#arn_xxs').val();
				break;
			}

			(_xl  > 0 && _xl  != '') && _vTemp.push(_xl);
			(_lg  > 0 && _lg  != '') && _vTemp.push(_lg);
			(_md  > 0 && _md  != '') && _vTemp.push(_md);
			(_sm  > 0 && _sm  != '') && _vTemp.push(_sm);
			(_xs  > 0 && _xs  != '') && _vTemp.push(_xs);
			(_xxs > 0 && _xxs != '') && _vTemp.push(_xxs);

			let _value = _vTemp.join();
			$(_t).val(_value).select().delay(500).promise().done(()=>$(_t).trigger('blur'));
			e.removeAttr('data-target-id').removeClass('arnExtension-popup-layout--visible');

		})
		.on('click', '#arnExtension_responsive .arnExtension-button-ui', (e)=>{
			let _this = $(e.currentTarget);
			$('#arnExtension_responsive .arnExt-body').attr('data-layout', _this.attr('data-option'));
		})
	}
	,responsiveGrid_handle : function(_v){
		let _value = _v.split(',') ,_value_xl ,_value_lg ,_value_md ,_value_sm ,_value_xs ,_value_xxs;

		switch (_value.length) {
			case 1:
			_value_xl	= _value[0].trim();
			_value_lg	= _value[0].trim();
			_value_md 	= _value[0].trim();
			_value_sm 	= _value[0].trim();
			_value_xs	= _value[0].trim();
			_value_xxs	= _value[0].trim();
			$('#arnExtension_responsive .arnExtension-button-ui[data-option="1"]').trigger('click');
			break;
			case 2:
			_value_xl	= _value[0].trim();
			_value_lg	= _value[0].trim();
			_value_md 	= _value[0].trim();
			_value_sm 	= _value[1].trim();
			_value_xs	= _value[1].trim();
			_value_xxs	= _value[1].trim();
			$('#arnExtension_responsive .arnExtension-button-ui[data-option="1"]').trigger('click');
			break;
			case 3:
			_value_xl	= _value[0].trim();
			_value_lg 	= _value[0].trim();
			_value_md 	= _value[1].trim();
			_value_sm 	= _value[2].trim();
			_value_xs	= _value[2].trim();
			_value_xxs	= _value[2].trim();
			$('#arnExtension_responsive .arnExtension-button-ui[data-option="2"]').trigger('click');
			break;
			case 4:
			_value_xl	= _value[0].trim();
			_value_lg 	= _value[0].trim();
			_value_md 	= _value[1].trim();
			_value_sm 	= _value[2].trim();
			_value_xs 	= _value[3].trim();
			_value_xxs	= _value[3].trim();
			$('#arnExtension_responsive .arnExtension-button-ui[data-option="3"]').trigger('click');
			break;
			case 5:
			_value_xl 	= _value[0].trim();
			_value_lg 	= _value[1].trim();
			_value_md 	= _value[2].trim();
			_value_sm 	= _value[3].trim();
			_value_xs 	= _value[4].trim();
			_value_xxs	= _value[4].trim();
			$('#arnExtension_responsive .arnExtension-button-ui[data-option="4"]').trigger('click');
			break;
			default:
			_value_xl 	= _value[0].trim();
			_value_lg 	= _value[1].trim();
			_value_md 	= _value[2].trim();
			_value_sm 	= _value[3].trim();
			_value_xs 	= _value[4].trim();
			_value_xxs 	= _value[5].trim();
			$('#arnExtension_responsive .arnExtension-button-ui[data-option="5"]').trigger('click');
			break;
		}
		$('#arn__xl').val(_value_xl);
		$('#arn__lg').val(_value_lg);
		$('#arn__md').val(_value_md);
		$('#arn__sm').val(_value_sm);
		$('#arn__xs').val(_value_xs);
		$('#arn_xxs').val(_value_xxs);
	}

	,createSpacing : ()=>{
		arnExt.createInnerHTML('spacing____Resp');

		$(document)
		.on('click','input[type="text"][id*="padding"],input[type="text"][id*="margin"]',function(e) {
			if ($(this).parents('#arnExtension_spacing').length) {return;}

			if ($('#arnExtension_spacing').attr('data-enable') == 'true') {
				let _this 	= $(this)
				,_id 		= _this.attr('id')
				,_value 	= _this.val().length == 0 ? '': _this.val();

				$('#arnExtension_spacing .arnExt-body').attr('data-type', _id.includes('margin') ? 'margin' : 'padding');

				arnExt.debounceTime(()=>{
					$('#arnExtension_spacing').addClass('arnExtension-popup-layout--visible').attr('data-target-id', _id);
					$('#arnSpacing_inout').val(_value);
					$('#arnExtension_spacing .arnExtension-sub-body[data-child="0"] .arnExtension-svg[data-index="0"]').trigger('click');
					arnExt.spacingLayout_handle(_value,_this[0].selectionStart);
				},100)()
			}
		})
		.on('click','#arnExtension_spacing .arnExtension-sub-body[data-child="0"] .arnExtension-svg', (e)=>{
			let _this = $(e.currentTarget), _i = Number(_this.attr('data-index'));
			$('#arnExtension_spacing .arnExtension-sub-body[data-child="0"] .arnExtension-svg').attr('data-enabled',false);
			_this.attr('data-enabled',true);

			arnExt.tempIndex = _i;
			arnExt.spacingLayout_handle($('#arnSpacing_inout').val(), null);
		})
		.on('click','#arnSpacing_btn', (e)=>{
			let _p = $('#arnExtension_spacing'),
			_t = '#' + _p.attr('data-target-id')
			_value = $('#arnSpacing_inout').val();

			$(_t).val(_value).select();

			arnExt.debounceTime(() => {
				_p.removeAttr('data-target-id').removeClass('arnExtension-popup-layout--visible');
				$(_t).trigger('blur');
			}, 300)()
		})
		.on('change','#arnExtension_Unit',function() {
			let _v = $('#arnSpacing_inout').val()
			,_unit = $(this).val();

			$('#arnSpacing_inout').val(_v.replace(/px/g, _unit).replace(/%/g, _unit).replace(/vw/g, _unit).replace(/vh/g, _unit).replace(/rem/g, _unit));
		})
		.on('change','#arnExt_spacing_layout',function() {
			arnExt.spacingDisabled_input($(this).val());
		})

		.on('keyup mouseup','#arn_all', function(e){
			let _value = $(this).val();
			$('#arn_top,#arn_left,#arn_right,#arn_bottom').val(_value);
			_value != '' && (_value +=$('#arnExtension_Unit').val());
			arnExt.tempArr[arnExt.tempIndex] = _value;
			arnExt.spacingDisabled_input(3);

			arnExt.tempArr = arnExt.tempArr.toString().trim().split(',');
			arnExt.tempArr.forEach((v,i)=>{!v.length && (arnExt.tempArr[i] = 'null');})
			$('#arnSpacing_inout').val(arnExt.tempArr.toString());
		})

		.on('keyup mouseup','#arn_top,#arn_left,#arn_right,#arn_bottom', function(e){
			let str = [];
			for (let i = 1; i < 5; i++){
				let _this = $('input[name="arnExtension_spacing_number"][tabindex="'+i+'"]');
				if (!_this[0].hasAttribute('disabled')) {
					let _v = _this.val().length == 0 ? '0': _this.val();
					_v != '' && (_v +=$('#arnExtension_Unit').val());
					str.push(_v);
				}
			}

			let _tempArr = ' ' + str.join(' ');
			arnExt.tempArr[arnExt.tempIndex] = _tempArr;

			arnExt.tempArr = arnExt.tempArr.toString().trim().split(',');
			arnExt.tempArr.forEach((v,i)=>{!v.length && (arnExt.tempArr[i] = 'null');})
			$('#arnSpacing_inout').val(arnExt.tempArr.toString());
			$('#arn_all').val('');
		})
	}
	,spacingLayout_handle : function(v,index = null){
		let _value = v.split(','), arn_1, arn_t, arn_l, arn_r, arn_b, arn_all = '', _total_length = 0, _selectedValue, _layout = 3;

		arnExt.tempArr = _value;
		if (index == null) {
			_selectedValue = _value[arnExt.tempIndex];

		}else{
			for (let i = 0; i < _value.length; i++) {
				_total_length += _value[i].length;
				i > 0 && (_total_length++);
				if (index <= _total_length) {
					_selectedValue = _value[i];

					arnExt.tempIndex = i;
					break;
				}
			}
		}

		if (v.length > 0 && !(_selectedValue === undefined)) {
			_value = _selectedValue.replace(/[a-z]/g,'').replace(/[A-Z]/g,'').replace(/%/g,'').trim().split(' ');
			switch (_value.length) {
				case 1:
				arn_all = arn_t = arn_r = arn_b = arn_l = _value[0];
				break;
				case 2:
				_layout = 2;
				arn_t = arn_b = _value[0];
				arn_l = arn_r = _value[1];
				break;
				case 3:
				arn_t = _value[0];
				arn_b = _value[2];
				arn_r = _value[1];
				arn_l = arn_r;
				break;
				default:
				arn_t = _value[0];
				arn_r = _value[1];
				arn_b = _value[2];
				arn_l = _value[3];
				break;
			}
		}
		arnExt.spacingDisabled_input(_layout);
		$('#arn_top').val(arn_t);
		$('#arn_left').val(arn_l);
		$('#arn_right').val(arn_r);
		$('#arn_bottom').val(arn_b);
		$('#arn_all').val(arn_all);
	}
	,spacingDisabled_input : (layout)=>{
		let _layout = Number(layout);
		$('#arnExtension_spacing input[name="arnExtension_spacing_number"]').removeAttr('disabled');
		switch (_layout) {
			case 1:
			$('#arn_left,#arn_right,#arn_bottom').attr('disabled', 'disabled');
			break;
			case 2:
			$('#arn_right,#arn_bottom').attr('disabled', 'disabled');
			break;
			default:
			break;
		}
		$('#arnExt_spacing_layout option[value="'+ _layout +'"]').prop('selected',true);
		$('#arnExtension_spacing .arnExt-body').attr('data-layout', _layout);

		$('#arnExtension_spacing .arnExtension-sub-body[data-child="0"] .arnExtension-svg').attr('data-enabled',false);
		$('#arnExtension_spacing .arnExtension-sub-body[data-child="0"] .arnExtension-svg[data-index="'+arnExt.tempIndex+'"]').attr('data-enabled',true);
	}

	,injectScript : (id, file, node)=>{
		var th = document.getElementsByTagName(node)[0];
		var s = document.createElement('script');
		s.setAttribute('type', 'text/javascript');
		s.setAttribute('id', id);
		s.setAttribute('src', file);
		th.appendChild(s);
	}

	,removeMenu : ()=>{
		if(!$('.ui-button.btn-destroy').length ){return;}
		console.log('Auto Delete');
		$('.ui-button.btn-destroy').trigger('click');
		setTimeout(()=>{
			let e = $('.ui-button.ui-button--destructive');
			e.length && e.trigger('click');
		},800)
	}
}