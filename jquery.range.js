/*jshint multistr:true, curly: false */
/*global jQuery:false, define: false */
/**
 * jRange - Awesome range control
 *
 * Written by
 * ----------
 * Nitin Hayaran (nitinhayaran@gmail.com)
 *
 * Licensed under the MIT (MIT-LICENSE.txt).
 *
 * @author Nitin Hayaran
 * @version 0.1-RELEASE
 *
 * Dependencies
 * ------------
 * jQuery (http://jquery.com)
 *
 **/
;
(function($, window, document, undefined) {
	'use strict';

	var jRange = function() {
		return this.init.apply(this, arguments);
	};
	jRange.prototype = {
		defaults: {
			onstatechange: function() {},
      ondragend: function() {},
      onbarclicked: function() {},
			isRange: false,
			showLabels: true,
			showScale: true,
			step: 1,
			format: '%s',
			theme: 'theme-green',
			width: 300,
			disable: false,
			snap: false,
			lowLabelPrefix: '',
			middleLabelPrefix: '',
			highLabelPrexfix: ''
		},
		template: '<div class="slider-container">\
			<div class="back-bar">\
                <div class="selected-bar"></div>\
                <div class="pointer low"></div><div class="pointer-label low">123456</div>\
                <div class="pointer middle"></div><div class="pointer-label middle">123456</div>\
                <div class="pointer high"></div><div class="pointer-label high">456789</div>\
                <div class="clickable-dummy"></div>\
            </div>\
            <div class="scale"></div>\
		</div>',
		init: function(node, options) {
			this.options       = $.extend({}, this.defaults, options);
			this.inputNode     = $(node);
			this.options.value = this.inputNode.val() || (this.options.isRange ? this.options.from + ',' + this.options.from : '' + this.options.from);
			this.domNode       = $(this.template);
			this.domNode.addClass(this.options.theme);
			this.inputNode.after(this.domNode);
			this.domNode.on('change', this.onChange);
			this.pointers      = $('.pointer', this.domNode);
			this.lowPointer    = this.pointers.first();
			this.middlePointer    = $(this.pointers.get(1));
			this.highPointer   = this.pointers.last();
			this.labels        = $('.pointer-label', this.domNode);
			this.lowLabel      = this.labels.first();
			this.middleLabel   = $(this.labels.get(1));
			this.highLabel     = this.labels.last();
			this.scale         = $('.scale', this.domNode);
			this.bar           = $('.selected-bar', this.domNode);
			this.clickableBar  = this.domNode.find('.clickable-dummy');
			this.interval      = this.options.to - this.options.from;
			this.render();
		},
		render: function() {
			// Check if inputNode is visible, and have some width, so that we can set slider width accordingly.
			if (this.inputNode.width() === 0 && !this.options.width) {
				console.log('jRange : no width found, returning');
				return;
			} else {
				this.options.width = this.options.width || this.inputNode.width();
				this.domNode.width(this.options.width);
				this.inputNode.hide();
			}

			if (this.isSingle()) {
				this.lowPointer.hide();
				this.lowLabel.hide();
				this.middlePointer.hide();
				this.middleLabel.hide();
			} else if (this.isDouble()){
				this.lowPointer.hide();
				this.lowLabel.hide();
			}
			
			
			if (!this.options.showLabels) {
				this.labels.hide();
			}
			this.attachEvents();
			if (this.options.showScale) {
				this.renderScale();
			}
			this.setValue(this.options.value);
		},
		isSingle: function() {
			if (typeof(this.options.value) === 'number' || !(this.options.value.indexOf(',') !== -1 || this.options.isRange)) {
				return true;
			}
			
			return false;
		},
		isDouble: function() {
			if (this.isSingle()) {
				return false;
			}
			
			var _values = this.options.value.split(',');
			
			if (_values.length == 2){
				return true;
			}
			
			return false;
		},
		isTriple: function() {
			if (this.isSingle()) {
				return false;
			}
			
			var _values = this.options.value.split(',');
			
			if (_values.length == 3){
				return true;
			}
			
			return false;
		},
		attachEvents: function() {
			this.clickableBar.click($.proxy(this.barClicked, this));
			this.pointers.on('mousedown touchstart', $.proxy(this.onDragStart, this));
			this.pointers.bind('dragstart', function(event) {
				event.preventDefault();
			});
		},
		onDragStart: function(e) {
			if ( this.options.disable || (e.type === 'mousedown' && e.which !== 1)) {
				return;
			}
			e.stopPropagation();
			e.preventDefault();
			var pointer = $(e.target);
			this.pointers.removeClass('last-active');
			pointer.addClass('focused last-active');
			this[(pointer.hasClass('low') ? 'low' : pointer.hasClass('middle') ? 'middle' : 'high') + 'Label'].addClass('focused');
			$(document).on('mousemove.slider touchmove.slider', $.proxy(this.onDrag, this, pointer));
			$(document).on('mouseup.slider touchend.slider touchcancel.slider', $.proxy(this.onDragEnd, this));
		},
		onDrag: function(pointer, e) {
			e.stopPropagation();
			e.preventDefault();

			if (e.originalEvent.touches && e.originalEvent.touches.length) {
				e = e.originalEvent.touches[0];
			} else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
				e = e.originalEvent.changedTouches[0];
			}

			var position = e.clientX - this.domNode.offset().left;
			this.domNode.trigger('change', [this, pointer, position]);
		},
		onDragEnd: function(e) {
			this.pointers.removeClass('focused')
				.trigger('rangeslideend');
			this.labels.removeClass('focused');
			$(document).off('.slider');
		  this.options.ondragend.call(this, this.options.value);
		},
		barClicked: function(e) {
			if(this.options.disable) return;
			var x = e.pageX - this.clickableBar.offset().left;
			if (this.isSingle()){
				this.setPosition(this.pointers.last(), x, true, true);
			} else if (this.isDouble()){
				var firstLeft      	= Math.abs(parseFloat(this.middlePointer.css('left'), 10)),
					firstHalfWidth 	= this.middlePointer.width() / 2,
					
					lastLeft 		= Math.abs(parseFloat(this.pointers.last().css('left'), 10)),
					lastHalfWidth  	= this.middlePointer.width() / 2,
					leftSide        = Math.abs(firstLeft - x + firstHalfWidth),
					rightSide       = Math.abs(lastLeft - x + lastHalfWidth),
					pointer;

				if(leftSide == rightSide) {
					pointer = x < firstLeft ? this.middlePointer : this.pointers.last();
				} else {
					pointer = leftSide < rightSide ? this.middlePointer : this.pointers.last();
				}
				this.setPosition(pointer, x, true, true);
			} else {
				var firstLeft      	= Math.abs(parseFloat(this.pointers.first().css('left'), 10)),
					firstHalfWidth 	= this.pointers.first().width() / 2,
					secondLeft      = Math.abs(parseFloat(this.middlePointer.css('left'), 10)),
					secondHalfWidth = this.pointers.first().width() / 2,
					lastLeft 		= Math.abs(parseFloat(this.pointers.last().css('left'), 10)),
					lastHalfWidth  	= this.pointers.first().width() / 2,
					leftSide        = Math.abs(firstLeft - x + firstHalfWidth),
					centerSide      = Math.abs(secondLeft - x + firstHalfWidth),
					rightSide       = Math.abs(lastLeft - x + lastHalfWidth),
					pointer;

				if (x <= firstLeft){
					pointer = this.pointers.first();
				} else if (x <= secondLeft){
					pointer = leftSide < centerSide ? this.pointers.first() : this.middlePointer;
				} else if (x < lastLeft){
					pointer = centerSide < rightSide ? this.middlePointer : this.pointers.last();
				} else {
					pointer = this.pointers.last();
				}
				
				this.setPosition(pointer, x, true, true);
			}
			this.options.onbarclicked.call(this, this.options.value);
		},
		onChange: function(e, self, pointer, position) {
			var min, max;

			if (self.isSingle()){
				min = 0;
				max = self.domNode.width();
			} else if (self.isDouble()) {
				min = pointer.hasClass('high') ? parseFloat(self.middlePointer.css("left")) + (self.middlePointer.width() / 2) : 0;
				max = pointer.hasClass('middle') ? parseFloat(self.highPointer.css("left")) + (self.highPointer.width() / 2) : self.domNode.width();
			} else{
				min = pointer.hasClass('high') ? parseFloat(self.middlePointer.css("left")) + (self.middlePointer.width() / 2) : pointer.hasClass('middle') ? parseFloat(self.lowPointer.css("left")) + (self.lowPointer.width() / 2) : 0;
				max = pointer.hasClass('low') ? parseFloat(self.middlePointer.css("left")) + (self.middlePointer.width() / 2) : pointer.hasClass('middle') ? parseFloat(self.highPointer.css("left")) + (self.highPointer.width() / 2) : self.domNode.width();
			}

			var value = Math.min(Math.max(position, min), max);
			self.setPosition(pointer, value, true);
		},
		setPosition: function(pointer, position, isPx, animate) {
			var leftPos, centerPos, rightPos,
				lowPos = parseFloat(this.lowPointer.css("left")),
				middlePos = parseFloat(this.middlePointer.css("left")),
				highPos = parseFloat(this.highPointer.css("left")) || 0,
				circleWidth = this.highPointer.width() / 2;
			if (!isPx) {
				position = this.prcToPx(position);
			}
			if(this.options.snap){
				var expPos = this.correctPositionForSnap(position);
				if(expPos === -1){
					return;
				}else{
					position = expPos;
				}
			}
			if (pointer[0] === this.highPointer[0]) {
				highPos = Math.round(position - circleWidth);
			} else if (pointer[0] === this.middlePointer[0]){
				middlePos = Math.round(position - circleWidth);
			} else {
				lowPos = Math.round(position - circleWidth);
			}
			
			pointer[animate ? 'animate' : 'css']({
				'left': Math.round(position - circleWidth)
			});
			if (this.isSingle()) {
				leftPos = 0;
			} else if (this.isDouble()){
				leftPos = 0;
				centerPos = middlePos + circleWidth;
				rightPos = highPos + circleWidth;
			} else {
				leftPos = lowPos + circleWidth;
				centerPos = middlePos + circleWidth;
				rightPos = highPos + circleWidth;
			}
			var w;
			
			if (this.isDouble()){
				w = Math.round(highPos + circleWidth - centerPos);
				this.bar[animate ? 'animate' : 'css']({
					'width': Math.abs(w),
					'left': (w>0) ? centerPos : centerPos + w
				});
			} else {
				w = Math.round(highPos + circleWidth - leftPos);
				this.bar[animate ? 'animate' : 'css']({
					'width': Math.abs(w),
					'left': (w>0) ? leftPos : leftPos + w
				});
			}
			
			this.showPointerValue(pointer, position, animate);
			this.isReadonly();
		},
		correctPositionForSnap: function(position){
			var currentValue = this.positionToValue(position) - this.options.from;
			var diff = this.options.width / (this.interval / this.options.step),
				expectedPosition = (currentValue / this.options.step) * diff;
			if( position <= expectedPosition + diff / 2 && position >= expectedPosition - diff / 2){
				return expectedPosition;
			}else{
				return -1;
			}
		},
		// will be called from outside
		setValue: function(value) {
			this.options.value = value;
			var values = value.toString().split(','),
				prc;
			
			if (this.isSingle()){
				values[0] = Math.min(Math.max(values[0], this.options.from), this.options.to) + '';
				prc       = this.valuesToPrc([0, values[0]]);
				this.setPosition(this.highPointer, prc[1]);
			} else if (this.isDouble()){
				values[0] = Math.min(Math.max(values[0], this.options.from), this.options.to) + '';
				values[1] = Math.min(Math.max(values[1], this.options.from), this.options.to) + '';
				prc       = this.valuesToPrc(values);
				this.setPosition(this.middlePointer, prc[0]);
				this.setPosition(this.highPointer, prc[1]);
			} else {
				values[0] = Math.min(Math.max(values[0], this.options.from), this.options.to) + '';
				values[1] = Math.min(Math.max(values[1], this.options.from), this.options.to) + '';
				values[2] = Math.min(Math.max(values[2], this.options.from), this.options.to) + '';
				prc       = this.valuesToPrc(values);
				this.setPosition(this.lowPointer, prc[0]);
				this.setPosition(this.middlePointer, prc[1]);
				this.setPosition(this.highPointer, prc[2]);
			}
		},
		renderScale: function() {
			var s = this.options.scale || [this.options.from, this.options.to];
			var prc = Math.round((100 / (s.length - 1)) * 10) / 10;
			var str = '';
			for (var i = 0; i < s.length; i++) {
				str += '<span style="left: ' + i * prc + '%">' + (s[i] != '|' ? '<ins>' + s[i] + '</ins>' : '') + '</span>';
			}
			this.scale.html(str);

			$('ins', this.scale).each(function() {
				$(this).css({
					marginLeft: -$(this).outerWidth() / 2
				});
			});
		},
		getBarWidth: function() {
			var values = this.options.value.split(',');
			if (values.length > 1) {
				return parseFloat(values[1]) - parseFloat(values[0]);
			} else {
				return parseFloat(values[0]);
			}
		},
		showPointerValue: function(pointer, position, animate) {
			var label = pointer.hasClass('low') ? $(this.labels.get(0)) : pointer.hasClass('middle') ? $(this.labels.get(1)) : $(this.labels.get(2));
			var text;
			var value = this.positionToValue(position);
			// Is it higer or lower than it should be?

			if ($.isFunction(this.options.format)) {
				var type = this.isSingle() ? undefined : (pointer.hasClass('low') ? 'low' : 'high');
				text = this.options.format(value, type);
			} else {
				text = this.options.format.replace('%s', value);
			}
			
			text = pointer.hasClass('low') ? this.options.lowLabelPrefix + text : pointer.hasClass('middle') ? this.options.middleLabelPrefix + text : this.options.highLabelPrefix + text;
			var width = label.html(text).width(),
				left = position - width / 2;
			left = Math.min(Math.max(left, 0), this.options.width - width);
			label[animate ? 'animate' : 'css']({
				left: left
			});
			this.setInputValue(pointer, value);
			
			this.adjustLabels();
		},
		/**
		 * 滑竿的提示label高度的自适应，防止内容挤在一起
		 */
		adjustLabels: function(pointer){
			if (this.isDouble()){
				this.isOverlap(this.middleLabel, this.highLabel) ? this.highLabel.addClass('secondHighLabel') : this.highLabel.removeClass('secondHighLabel');
				
			} else if (this.isTriple()){
				var lowMiddleOverlap   = this.isOverlap(this.lowLabel, this.middleLabel),
				    middleHightOverlap = this.isOverlap(this.middleLabel, this.highLabel);
				if (lowMiddleOverlap){
					if (middleHightOverlap){
						this.middleLabel.addClass('secondHighLabel');
						this.highLabel.addClass('thirdHighLabel');
						this.highLabel.removeClass('secondHighLabel');
					} else {
						this.middleLabel.addClass('secondHighLabel');
						this.highLabel.removeClass('thirdHighLabel');
						this.highLabel.removeClass('secondHighLabel');
					}
				} else if (middleHightOverlap){
					this.middleLabel.removeClass('secondHighLabel');
					this.highLabel.addClass('secondHighLabel');
					this.highLabel.removeClass('thirdHighLabel');
				} else {
					this.middleLabel.removeClass('secondHighLabel');
					this.highLabel.removeClass('thirdHighLabel');
					this.highLabel.removeClass('secondHighLabel');
				}
			}
		},
		/**
		 * 判断两个标签是否叠在一起
		 */
		isOverlap: function(leftLabel, rightLabel){
			var leftLabelOffset  = leftLabel.offset(),
			    leftLabelWidth   = leftLabel.width(),
				rightLabelOffset = rightLabel.offset();
				
			return leftLabelOffset.left + leftLabelWidth <= rightLabelOffset.left ? false : true;
		},
		valuesToPrc: function(values) {
			var lowPrc = ((parseFloat(values[0]) - parseFloat(this.options.from)) * 100 / this.interval),
				middlePrc = ((parseFloat(values[1]) - parseFloat(this.options.from)) * 100 / this.interval),
				highPrc = ((parseFloat(values[2]) - parseFloat(this.options.from)) * 100 / this.interval);
			return [lowPrc, middlePrc, highPrc];
		},
		prcToPx: function(prc) {
			return (this.domNode.width() * prc) / 100;
		},
		isDecimal: function() {
			return ((this.options.value + this.options.from + this.options.to).indexOf(".")===-1) ? false : true;
		},
		positionToValue: function(pos) {
			var value = (pos / this.domNode.width()) * this.interval;
			value = parseFloat(value, 10) + parseFloat(this.options.from, 10);
			if (this.isDecimal()) {
				var final = Math.round(Math.round(value / this.options.step) * this.options.step *100)/100;
				if (final!==0.0) {
					final = '' + final;
					if (final.indexOf(".")===-1) {
						final = final + ".";
					}
					while (final.length - final.indexOf('.')<3) {
						final = final + "0";
					}
				} else {
					final = "0.00";
				}
				return final;
			} else {
				return Math.round(value / this.options.step) * this.options.step;
			}
		},
		setInputValue: function(pointer, v) {
			// if(!isChanged) return;
			if (this.isSingle()) {
				this.options.value = v.toString();
			} else if (this.isDouble()){
				var values = this.options.value.split(',');
				if (pointer.hasClass('middle')) {
					this.options.value = v + ',' + values[1];
				} else {
					this.options.value = values[0] + ',' + v;
				}
			} else {
				var values = this.options.value.split(',');
				if (pointer.hasClass('low')) {
					this.options.value = v + ',' + values[1] + ',' + values[2];
				} else if (pointer.hasClass('middle')){
					this.options.value = values[0] + ',' + v + ',' + values[2];
				} else {
					this.options.value = values[0] + ',' + values[1] + ',' + v;
				}
			}
			if (this.inputNode.val() !== this.options.value) {
				this.inputNode.val(this.options.value)
					.trigger('change');
				this.options.onstatechange.call(this, this.options.value);
			}
		},
		getValue: function() {
			return this.options.value;
		},
		getOptions: function() {
			return this.options;
		},
		getRange: function() {
			return this.options.from + "," + this.options.to;
		},
		isReadonly: function(){
			this.domNode.toggleClass('slider-readonly', this.options.disable);
		},
		disable: function(){
			this.options.disable = true;
			this.isReadonly();
		},
		enable: function(){
			this.options.disable = false;
			this.isReadonly();
		},
		toggleDisable: function(){
			this.options.disable = !this.options.disable;
			this.isReadonly();
		},
		updateRange: function(range, value) {
			var values = range.toString().split(',');
			this.interval = parseInt(values[1]) - parseInt(values[0]);
			if(value){
				this.setValue(value);
			}else{
				this.setValue(this.getValue());
			}
		}
	};

	var pluginName = 'jRange';
	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function(option) {
		var args = arguments,
			result;

		this.each(function() {
			var $this = $(this),
				data = $.data(this, 'plugin_' + pluginName),
				options = typeof option === 'object' && option;
			if (!data) {
				$this.data('plugin_' + pluginName, (data = new jRange(this, options)));
				$(window).resize(function() {
					data.setValue(data.getValue());
				}); // Update slider position when window is resized to keep it in sync with scale
			}
			// if first argument is a string, call silimarly named function
			// this gives flexibility to call functions of the plugin e.g.
			//   - $('.dial').plugin('destroy');
			//   - $('.dial').plugin('render', $('.new-child'));
			if (typeof option === 'string') {
				result = data[option].apply(data, Array.prototype.slice.call(args, 1));
			}
		});

		// To enable plugin returns values
		return result || this;
	};

})(jQuery, window, document);
