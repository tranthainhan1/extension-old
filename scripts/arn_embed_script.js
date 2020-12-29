var _requestAjax = findSections = null;

_requestAjax = (url, method = 'get', type = 'json', data={})=>{
	return  $.ajax({
		url: url,
		method: method,
		dataType: type,
		data: data
	})
}
findSections = ()=>{
	$('#arnExtension_bubble_quicklink').length && $('#arnExtension_bubble_quicklink').attr('data-theme-id',Shopify.theme.id);
	console.log(Shopify);
	$('body').append(`<div style="position: fixed;left:0; top: 220px;z-index: 999999;background: #222;color: #fff;font-size: 30px;">
			<span>${Shopify.shop}</span></div>`);
	return
	if (typeof Shopify == 'undefined' || Shopify.shop === undefined || Shopify.theme === undefined) {return;}
	let quickEditor =`https://${Shopify.shop}/admin/themes/${Shopify.theme.id}/?key=config/settings_data.json`
	,_shop = JSON.parse($('script[id="shopify-features"]').html() || {})
	,ajaxData = {themeId: Shopify.theme.id,domain: _shop.domain};

	let t_href = `https://${Shopify.shop}/admin/themes/${Shopify.theme.id}/assets.json?asset[key]=config/settings_data.json&theme_id=${Shopify.theme.id}`;	


	if (location.host.includes('.myshopify.')) {
		_requestAjax(t_href,'get', 'json',{})
		.done(resObj=>{			
		})
		return;
	}

	_requestAjax(`//install.arenacommerce.com/apps/get-settings?shop=${Shopify.shop}`,'post', 'json',ajaxData,)
	.done(resObj=>{
		if (typeof resObj.msg == 'undefined' || !resObj.msg.length) {return}

		let value;
		try {
			value = JSON.parse(window.atob(resObj.msg));
		} catch(e) {
			console.log(e);
			return
		}

		if(value.current.content_for_index.length){
			// console.log(value)
			let array_seciton = [];

			// /*console.log(quickEditor)*/
			for(let item of value.current.content_for_index){
				let section_find = $(`#shopify-section-${item}`);
				let _type = {
					"id":item
					,"type":value.current.sections[item].type
					,"active": section_find.length
					,"offsetTop": (section_find.length && section_find.offset().top || null)
					,"height": (section_find.length && section_find.outerHeight() || null)
					,"content": {item:value.current.sections[item]}
				};
				array_seciton.push(_type)
			}
			if (array_seciton.length) {
				$('#arn-section-sticky').length && $('#arn-section-sticky').remove();

				$('body').append(`<div id="arn-section-sticky"></div>`);

				$('#arn-section-sticky').append(`<style>#arn-section-sticky{position: fixed;top:15vh;left: 0;z-index: 9999;background: rgba(255, 255, 255, 0.75);font-family: Helvetica, Arial, sans-serif;}
					#arn-section-sticky .arn-section-label{font-size: 14px;font-weight: 700;text-transform: capitalize;border: 1px solid #858585;border-bottom: none;padding: 10px 35px 10px 15px;}
					#arn-section-sticky .arn-section-label:last-child{border-bottom: 1px solid #858585;}
					@keyframes fadeFocus {30% {background-color: #ff000057;}100% {background-color: unset;}}
					#arn-section-sticky a{display:block;color: #222;user-select:none;}
					#arn-section-sticky a:hover,#arn-section-sticky a:focus{color: #888;}
					#arn-section-sticky a:after{content: '+';position: absolute;right: 7px;font-size: 20px;line-height: 18px;}
					.arena-section--is-focus{position:relative;}
					.arena-section--is-focus:before{content: '';position:absolute;width: 100%; height:100%;border: 2px solid red;z-index: 999;animation: fadeFocus 1s linear;}
					</style>`);

				for(let item of array_seciton){
					if (item.active) {
						// console.log(+item.id,item.type);
						/*console.log(`{"${item.id}":${JSON.stringify(item.content)}}`);*/
						let _innerHtml = `<div class="arn-section-label" style="top: ${item.offsetTop}px;"><a href="#shopify-section-${item.id}">${item.type.toLowerCase().replace(/[-]/g,' ')}</a></div>`;
						$('#arn-section-sticky').append(_innerHtml);
					}
				}
				$('#arn-section-sticky').on('click', 'a', e =>{
					e.preventDefault();
					let _this = $(e.currentTarget);

					if($(_this.attr('href')).length ){
						let _offset = ($(_this.attr('href')).offset().top - ($(window).innerHeight()/5)) || 0;
						_offset < 0 && (_offset = 0)
						jQuery('html').animate({scrollTop:_offset},1000,'swing',e=>$(_this.attr('href')).addClass('arena-section--is-focus'));
					}
				})
				.on('blur', 'a', e =>$('.arena-section--is-focus').removeClass('arena-section--is-focus'))
			}
		}
	})	
}
findSections();