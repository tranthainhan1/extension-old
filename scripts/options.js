var O_E = {
	calculator_noneLi : function(){
		let liHeight = 0;
		$('ul.list-option li:not(.li-none)').each((i,v)=>{
			liHeight += $(v).outerHeight();
		})
		$('li.li-none').css('min-height', 'calc(100% - '+liHeight+'px)');
	}
	,eventHandle : ()=>{

		chrome.storage && chrome.storage.sync.get(['ArenaData_checkbox', 'ArenaData_domains'],(result)=>{
			let _checkboxArray 	= result['ArenaData_checkbox']
				,_domainsRule 	= result['ArenaData_domains']

			if (_domainsRule !== undefined) {
				$('#arn_whitelist').val(_domainsRule[0].value)
				$('#arn_blacklist').val(_domainsRule[1].value)
			}

			if (_checkboxArray !== undefined) {
				for (var i = 0; i < _checkboxArray.length; i++) {
					let _element = '#'+_checkboxArray[i].id
					,_checked = _checkboxArray[i].value;
					$(_element).prop('checked',_checked);
				}
				O_E.setData();
			}else{O_E.setData();}
		})

		$(document)
		.on('click','#saveOptions', (e)=>{
			O_E.setData();
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs){chrome.tabs.sendMessage(tabs[0].id, "arnExt_changed");});
			$(e.currentTarget).html('Saving...').delay(700).promise().done(()=>$(e.currentTarget).delay(1500).html('Save'));

		})
		.on('click','ul.list-option li:not(.li-none)', (e)=>{
			$('ul.list-option li').removeClass('active');
			$(e.currentTarget).addClass('active');
			$('.option-tab').removeClass('active').removeAttr('style');
			$('#'+$(e.currentTarget).attr('data-target')).fadeIn().addClass('active');
			O_E.calculator_noneLi();
		})

	}
	,setData : ()=>{
		let _array = [];
		$('input.areExtension-checkbox').each((i,v)=>{
			let _value 	= $(v).prop('checked'),
			_key 	= $(v).attr('id');

			_array.push({id:_key,value:_value});
		});
		chrome.storage && chrome.storage.sync.set({'ArenaData_checkbox': _array});

		let _whiteList  = $('#arn_whitelist').val().toString()
			,_blackList = $('#arn_blacklist').val().toString();

		chrome.storage && chrome.storage.sync.set({'ArenaData_domains': [{id:'whitelist',value:_whiteList},{id:'blacklist',value:_blackList}]});
	}
	,init : function(){
		chrome.runtime && $('#optionsLayout .option-header-inner #extVersion').html(chrome.runtime.getManifest().version);
		
		this.tempIndex = 0;
		this.tempArr = [];
		this.calculator_noneLi();
		this.eventHandle();
		this.createSpacing();		
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
	,createSpacing : ()=>{
		

		$(document)
		.on('click','input[type="text"][id*="padding"],input[type="text"][id*="margin"],input[type="text"][id*="spacing"]',function(e) {
			if ($(this).parents('#arnExtension_spacing').length) {return;}

			if ($('#arnExtension_spacing').attr('data-enable') == 'true') {
				let _this = $(this), _id = _this.attr('id'), _value = _this.val().length == 0 ? '': _this.val();

				$('#arnExtension_spacing .arnExt-body').attr('data-type', _id.includes('margin') ? 'margin' : 'padding');

				
				O_E.debounceTime(()=>{
					$('#arnExtension_spacing').addClass('arnExtension-popup-layout--visible').attr('data-target-id', _id);
					$('#arnSpacing_inout').val(_value);
					
					$('#arnExtension_spacing .arnExtension-sub-body[data-child="0"] .arnExtension-svg[data-index="0"]').trigger('click');
					O_E.spacingLayout_handle(_value,_this[0].selectionStart);
				},100)()
			}
		})
		.on('click','#arnExtension_spacing .arnExtension-sub-body[data-child="0"] .arnExtension-svg', (e)=>{
			let _this = $(e.currentTarget), _i = Number(_this.attr('data-index'));
			$('#arnExtension_spacing .arnExtension-sub-body[data-child="0"] .arnExtension-svg').attr('data-enabled',false);
			_this.attr('data-enabled',true);

			O_E.tempIndex = _i;
			O_E.spacingLayout_handle($('#arnSpacing_inout').val(), null);
		})
		.on('click','#arnSpacing_btn', (e)=>{
			let p = $('#arnExtension_spacing'),
			_t = '#' + p.attr('data-target-id')
			_value = $('#arnSpacing_inout').val();

			$(_t).val(_value).select();

			O_E.debounceTime(() => {
				p.removeAttr('data-target-id').removeClass('arnextension-popup-layout--visible');
				$(_t).trigger('blur');
			}, 300)()
		})
		.on('change','#arnExt_spacing_layout',function() {			
			O_E.spacingDisabled_input($(this).val());
		})

		.on('keyup mouseup','#arn_all', function(e){
			let _value = $(this).val();
			$('#arn_top,#arn_left,#arn_right,#arn_bottom').val(_value);
			_value != '' && (_value +=$('#arnExtension_Unit').val());
			O_E.tempArr[O_E.tempIndex] = _value;
			O_E.spacingDisabled_input(3);
			$('#arnSpacing_inout').val(O_E.tempArr.toString().trim())
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
			
			O_E.tempArr[O_E.tempIndex] = _tempArr;
			
			$('#arnSpacing_inout').val(O_E.tempArr.toString().trim());
			$('#arn_all').val('');
		})
	}
	,spacingLayout_handle : function(v,index = null){
		let _value = v.split(','), arn_1, arn_t, arn_l, arn_r, arn_b = '', _total_length=0, _selectedValue, _layout;
		
		O_E.tempArr = _value;
		if (index == null) {
			_selectedValue = _value[O_E.tempIndex];

		}else{
			for (let i = 0; i < _value.length; i++) {
				_total_length += _value[i].length;
				i > 0 && (_total_length++);
				if (index <= _total_length) {
					_selectedValue = _value[i];
					
					O_E.tempIndex = i;
					break;
				}
			}
		}

		if (v.length > 0 && !(_selectedValue === undefined)) {
			_value = _selectedValue.replace(/[a-z]/g,'').replace(/[A-Z]/g,'').trim().split(' ');

			switch (_value.length) {
				case 1:
					_layout = 1;
					arn_1 = arn_t = arn_l = arn_r = arn_b = _value;
					break;
				case 2:
					_layout = 2;
					arn_t = arn_b = _value[0];
					arn_l = arn_r = _value[1];

					break;
				default:
					_layout = 3;
					if (_value.length == 3) {
						arn_t = _value[0];
						arn_b = _value[2];
						arn_r = _value[1];
						arn_l = _value[1];
					}
					else{
						arn_t = _value[0];
						arn_r = _value[1];
						arn_b = _value[2];
						arn_l = _value[3];
					}
				break;
			}
		}else{
			_layout = 3;
		}
		
		O_E.spacingDisabled_input(_layout);
		$('#arn_top').val(arn_t);
		$('#arn_left').val(arn_l);
		$('#arn_right').val(arn_r);
		$('#arn_bottom').val(arn_b);
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
		$('#arnExtension_spacing .arnExtension-sub-body[data-child="0"] .arnExtension-svg[data-index="'+O_E.tempIndex+'"]').attr('data-enabled',true);
	}
}
$(()=>{O_E.init();})
