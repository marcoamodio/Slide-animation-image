/**
 * layoutBox.js 
 * MA - 2015
 *
 * http://www.opensource.org/licenses/mit-license.php
 * 
 */
;( function( window ) {
	
	'use strict';

	// based on http://responsejs.com/labs/dimensions/
	function getViewport(axis) {
		var client, inner;
		if( axis === 'x' ) {
			client = docElem['clientWidth'];
			inner = window['innerWidth'];
		}
		else if( axis === 'y' ) {
			client = docElem['clientHeight'];
			inner = window['innerHeight'];
		}
		
		return client < inner ? inner : client;
	}

	var docElem = window.document.documentElement,
		transEndEventNames = {
			'WebkitTransition': 'webkitTransitionEnd',
			'MozTransition': 'transitionend',
			'OTransition': 'oTransitionEnd',
			'msTransition': 'MSTransitionEnd',
			'transition': 'transitionend'
		},
		transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
		support = { transitions : Modernizr.csstransitions },
		win = { width : getViewport('x'), height : getViewport('y') };
	
	function extend( a, b ) {
		for( var key in b ) { 
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	function LayoutBox( el, options ) {	
		this.el = el;
		this.options = extend( {}, this.options );
		extend( this.options, options );
		this._init();
	}

	LayoutBox.prototype.options = {}

	LayoutBox.prototype._init = function() {
		// set configuration transforms
		this._setTransforms();
		// which effect
		this.effect = this.el.getAttribute( 'data-effect' ) || 'effect';
		//  animating
		this.isAnimating = false;
		// the panels
		this.panels = [].slice.call( this.el.querySelectorAll( '.panel' ) );
		// the number of panel is four
		this.panelsCount = 4;
		// current panel´s
		this.current = 0;
		classie.add( this.panels[0], 'current' );
		// ########################################################################
		// la divisione dei pannelli a 4 su cui facevo riferimento nel css component
		// ########################################################################
		var self = this;
		this.panels.forEach( function( panel ) {
			var img = panel.querySelector( 'img' ), imgReplacement = '';
			for( var i = 0; i < self.panelsCount; ++i ) {
				imgReplacement += '<div class="bg-tile"><div class="bg-img"><img src="' + img.src + '" /></div></div>'
			}
			panel.removeChild( img );
			panel.innerHTML = imgReplacement + panel.innerHTML;
		} );
		// add navigation element
		this.nav = document.createElement( 'nav' );
		this.nav.innerHTML = '<span class="prev"><i></i></span><span class="next"><i></i></span>';
		this.el.appendChild( this.nav );
		// initialize events
		this._initEvents();
	}

	LayoutBox.prototype._setTransforms = function() {
		this.transforms = {
			'effect' : {
				'next' : [
					'translate3d(0,' + (win.height/2+10) + 'px, 0)',
					'translate3d(0,' + (win.height/2+10) + 'px, 0)',
					'translate3d(0,' + (win.height/2+10) + 'px, 0)',
					'translate3d(0,' + (win.height/2+10) + 'px, 0)'
				],
				'prev' : [
					'translate3d(0,-' + (win.height/2+10) + 'px, 0)',
					'translate3d(0,-' + (win.height/2+10) + 'px, 0)',
					'translate3d(0,-' + (win.height/2+10) + 'px, 0)',
					'translate3d(0,-' + (win.height/2+10) + 'px, 0)'
				]
			}
		};	
	}

	LayoutBox.prototype._initEvents = function() {
		var self = this, navctrls = this.nav.children;
		// previous action
		navctrls[0].addEventListener( 'click', function() { self._navigate('prev') } );
		// next action
		navctrls[1].addEventListener( 'click', function() { self._navigate('next') } );
		// window resize
		window.addEventListener( 'resize', function() { self._resizeHandler(); } );
	}

	// goto next or previous slide
	LayoutBox.prototype._navigate = function( dir ) {
		if( this.isAnimating ) return false;
		this.isAnimating = true;

		var self = this, currentPanel = this.panels[ this.current ];

		if( dir === 'next' ) {
			this.current = this.current < this.panelsCount - 1 ? this.current + 1 : 0;			
		}
		else {
			this.current = this.current > 0 ? this.current - 1 : this.panelsCount - 1;
		}

		// next panel to be shown
		var nextPanel = this.panels[ this.current ];
		// add class active to the next panel to trigger its animation
		classie.add( nextPanel, 'active' );
		// apply the transforms to the current panel
		this._applyTransforms( currentPanel, dir );

		// let´s track the number of transitions ended per panel
		var cntTransTotal = 0,
			
			// transition end event function
			onEndTransitionFn = function( ev ) {
				if( ev && !classie.has( ev.target, 'bg-img' ) ) return false;

				// return if not all panel transitions ended
				++cntTransTotal;
				if( cntTransTotal < self.panelsCount ) return false;

				if( support.transitions ) {
					this.removeEventListener( transEndEventName, onEndTransitionFn );
				}

				// remove current class from current panel and add it to the next one
				classie.remove( currentPanel, 'current' );
				classie.add( nextPanel, 'current' );
				// reset transforms for the currentPanel
				self._resetTransforms( currentPanel );
				// remove class active
				classie.remove( nextPanel, 'active' );
				self.isAnimating = false;
			};

		if( support.transitions ) {
			currentPanel.addEventListener( transEndEventName, onEndTransitionFn );
		}
		else {
			onEndTransitionFn();
		}
	}

	LayoutBox.prototype._applyTransforms = function( panel, dir ) {
		var self = this;
		[].slice.call( panel.querySelectorAll( 'div.bg-img' ) ).forEach( function( tile, pos ) {
			tile.style.WebkitTransform = self.transforms[self.effect][dir][pos];
			tile.style.transform = self.transforms[self.effect][dir][pos];
		} );
	}

	LayoutBox.prototype._resetTransforms = function( panel ) {
		[].slice.call( panel.querySelectorAll( 'div.bg-img' ) ).forEach( function( tile ) {
			tile.style.WebkitTransform = 'none';
			tile.style.transform = 'none';
		} );
	}

	LayoutBox.prototype._resizeHandler = function() {
		var self = this;
		function delayed() {
			self._resize();
			self._resizeTimeout = null;
		}
		if ( this._resizeTimeout ) {
			clearTimeout( this._resizeTimeout );
		}
		this._resizeTimeout = setTimeout( delayed, 50 );
	}

	LayoutBox.prototype._resize = function() {
		win.width = getViewport('x');
		win.height = getViewport('y');
		this._setTransforms();
	}

	// add to global namespace
	window.LayoutBox = LayoutBox;

} )( window );

/*thanks codrops for instructions - always my ispirations !!*/