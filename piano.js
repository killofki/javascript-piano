/*! Copyright (c) 2013 - Peter Coles (mrcoles.com) 
 *  Licensed under the MIT license: http://mrcoles.com/media/mit-license.txt 
 */ 

( q => { 
	
	// 
	// Setup keys! 
	// 
	
	var 
		  notesOffset = 0 
		, blackKeys = { 
			  1 : 1 
			, 3 : 3 
			, 6 : 1 
			, 8 : 2 
			, 10 : 3 
			} // -- blackKeys 
		; 
	$ .each( blackKeys, ( k, v ) => blackKeys[ k ] = ` black black${ v }` ); 
	
	var 
		  $keys = $( '<div>', { 'class' : 'keys' } ) .appendTo( '#piano' ) 
		, buildingPiano = false 
		, isIos = navigator .userAgent .match( /(iPhone|iPad)/i ) 
		; 
	
	buildPiano(); 
	
	// 
	// Setup synth controls 
	// 
	
	[ 'volume', 'style' ] .forEach( setting => { 
		var 
			$opts = 
				$( '<div>', { 'class' : 'opts', html : `<p><strong>${ camelToText( setting ) }:</strong></p>` } ) 
				.appendTo( '#synth-settings' ) 
			; 
		
		$ .each( DataGenerator[ setting ], ( name, fn ) => { 
			name != 'default' 
			&& $( '<p>' ) 
				.append( $( '<a>', { 
					  text : camelToText( name ) 
					, href : '#' 
					, 'class' : fn === DataGenerator[ setting ] .default ? 'selected' : '' 
					, click : function ( evt ) { 
						evt .preventDefault(); 
						DataGenerator[ setting ] .default = fn; 
						buildPiano(); 
						var $this = $( this ); 
						$this .closest( '.opts' ) .find( '.selected' ) .removeClass( 'selected' ); 
						$this .addClass( 'selected' ); 
						} 
					} ) ) // -- .append( '<a>', {} ) 
				.appendTo( $opts ) 
				; // -- ( name != 'default' ) 
			} ) // -- $ .each( DataGenerator[ setting ], ... ) 
			; 
		} ) // -- [ 'volume', 'style' ] .forEach( ... ) 
		; 
	
	
	// 
	// Setup keyboard interaction 
	// 
	
	var 
		  keyNotes = 
			[ 
				  {} 
				, {  
					  ta : [ 
						  ... 'we tyu op ]' 
						, ... 'asdfghjkl;\'\r' // ... enter 
						, ... '\xba' // ... gotta figure out why it's sometimes 186 and sometimes 59 
						] 
					, pa : [ 
						  ... [ 1, 3, -1, 6, 8, 10, -1, 13, 15, -1, 18 ] 
						, ... [ 0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19 ] 
						, ... [ 16 ] 
						] 
						// c# d#    f# g# a#    c# d#    f# 
						// c  d  e  f  g  a  b  c  d  e  f  g 
						// e 
					, spc : [ ... '];\'' ] // special key code.. 
					, spv : [ ... [ 221, 186, 222 ] ] 
					} 
				] 
			.reduce( ( o, { ta, pa, spc, spv } ) => ( 
				  ta .forEach( ( c, p ) => 
					   c !== ' ' // skip about blank zone 
					&& [ spv[ spc .indexOf( c ) ] || c .toUpperCase() .charCodeAt() ] 
						.forEach( cv => o[ cv ] = pa[ p ] ) 
					) 
				, o 
				) ) 
			// -- keyNotes 
		, notesShift = -12 
		, downKeys = {} 
		; 
	
	$( window ) 
	.keydown( evt => { 
		var { keyCode } = evt; 
		// prevent repeating keys 
		if ( ! downKeys[ keyCode ] && ! isModifierKey( evt ) ) { 
			downKeys[ keyCode ] = 1; 
			var key = keyNotes[ keyCode ]; 
			switch( true ) { 
				case typeof key != 'undefined' : 
					$keys 
					.trigger( `note-${ 
						[ key, notesShift, notesOffset ] .reduce( ( a, b ) => a + b ) 
						}.play` ) 
						; 
					evt .preventDefault(); 
					break; 
				case keyCode == 188 : 
					notesShift = -12; 
					break; 
				case keyCode == 190 : 
					notesShift = 0; 
					break; 
				case keyCode == 37 || keyCode == 39 : 
					notesOffset += ( keyCode == 37 ? -1 : 1 ) * 12; 
					buildPiano(); 
					break; 
				} // -- switch() 
			} // -- ( ! downKeys[ keyCode ] && ... ) 
		} ) // -- .keydown() 
	.keyup( ({ keyCode }) => { delete downKeys[ keyCode ]; } ) 
		; 
	
	
	// 
	// Piano colors 
	// 
	
	var 
		  colors = 'f33 33f 3f3 ff3 f3f 3ff' .split( ' ' ) 
		, curColor = 0 
		; 
	
	$( window ) .keyup( colorHandler ); 
	$( '.toggle-color' ) .click( colorHandler ); 
	
	// 
	// Help controls 
	// 
	
	var 
		  $help = $( '.help' ) 
		, qTimeout 
		, qCanToggle = true 
		; 
	
	window .setTimeout( q => $help .removeClass( 'show' ), 700 ); 
	
	[ 
		  $( window ) 
		, { click : ({ target }) => { 
			var $closestHelp = $( target ) .closest( '.help' ); 
			
				! ( ( target .nodeName == 'A' || ~ target .className .search( 'hold' ) ) && $closestHelp .length ) 
			&& ( $closestHelp .length || $help .hasClass( 'show' ) ) 
			&& $help .toggleClass( 'show' ) 
				; 
			} } 
		, { keypress : ({ which }) => { 
			// trigger help when ? is pressed, but make sure it doesn't repeat crazy 
			if ( which == 63 || which == 48 ) { 
				window .clearTimeout( qTimeout ); 
				qTimeout = window .setTimeout( q => qCanToggle = true, 1000 ); 
				if ( qCanToggle ) { 
					qCanToggle = false; 
					$help .toggleClass( 'show' ); 
					} 
				} 
			} } 
		, { keydown : evt => ( 
			// prevent quick find... 
				evt .target .nodeName != 'INPUT' 
			&& evt .target .nodeName != 'TEXTAREA' 
			&& evt .keyCode == 222 ? ( 
				  evt .preventDefault() 
				, false 
				) 
			: true 
			) } 
		] 
	.reduce( ( o, objF ) => ( 
		  Object .keys( objF ) .forEach( p => o[ p ]( objF[ p ] ) ) // objF's function value to o's property argument 
		, o // with flow 
		) ) 
		; 
	
	// 
	// Scroll nav 
	// 
	[ [ '#info', '#below' ], [ '#top', '#content' ] ] 
	.forEach( ([ x0, x1 ]) => $( x0 ) .click( q => 
		$( 'html,body' ) .animate( { scrollTop : $( x1 ) .offset() .top }, 1000 ) 
		) ) // -- [] .forEach( .click( ... ) ) 
		; 
	
	// cooked functions.. 
	
	// 
	// Demo 
	// 
	( undefined => { 
		var chopsticks = ( ( 
				  main, main2 
				
				, alphaPo = [ {}, [ 'cdefgabCDE', [ -12, -10, -8, -7, -5, -3, -1, 0, 2, 4 ] ] ] 
					.reduce( ( o, [ [ ... alphas ], Pos ] ) => ( alphas .forEach( ( c, p ) => o[ c ] = Pos[ p ] ), o ) ) 
				, regAlphas = /[^\d]+\d+/g // splitor 
				, regAlpha = /(?<alpha>[^\d]+)(?<alphalen>\d+)/ // catcher 
				, alphaCatcher = ({ alpha, alphalen }) => 
					[ 
						  alphalen | 0 
						, ... 
							[ ... alpha ] 
							.filter( c => alphaPo .propertyIsEnumerable( c ) ) 
							.map( c => alphaPo[ c ] ) 
						] 
					// -- alphaCatcher 
				, getHarmony = t => t .match( regAlphas ) .map( et => 
					alphaCatcher( et .match( regAlpha ) .groups ) 
					) 
				) => 
			[ 
				  { 
					  'style' : 'wave' 
					, 'volume' : 'linearFade' 
					, 'notesOffset' : 0 
					} 
				, ... [] .concat( ... 
					[ 
						  main = `
							fg6 fg6 fg6 fg6 fg6 fg6 
							eg6 eg6 eg6 eg6 eg6 eg6 
							db6 db6 db6 db6 db6 db6 
							cC6 cC6 cC6 
							` // -- main 
						, ` cC6 db6 ea6 `  
						
						, main 
						, ` cC6 g6 e6 c6 r12 ` 
						
						, main2 = ` 
							CE6 
							
							bD6 r6 aC6 gb6 r6 fa6 
							eg6 r6 CE6 CE6 r6 eg6 
							
							df6 r6 bD6 bD6 r6 
							` // -- main2 
						, ` df6 ce6 r6 eC6 eC6 r6 ` 
						
						, main2 
						, ` gb6 eC6 g6 e6 c6 r6 ` 
						] 
					.map( t => getHarmony( t ) ) 
					) // -- .concat() 
					// -- [] .concat() 
				] 
			)() // -- chopsticks 
			; 
		
		var demoing = false, demoingTimeout; 
		
		$( window ) .keyup( demoHandler ); 
		$( '.toggle-demo' ) .click( demoHandler ); 
		
		// functions in undefined => {} .. 
		
		function demo( data ) { 
			var cfg = data[ 0 ]; 
			if ( ! buildingPiano && ! demoing ) { 
				demoing = true; 
				
				[ 'style', 'volume' ] 
				.forEach( p => [ cfg[ p ] ] .forEach( cp => 
					cp && ( DataGenerator[ p ] .default = DataGenerator[ p ][ cp ] ) 
					) ) 
					; 
				[ cfg .notesOffset ] .forEach( cn => 
					cn !== undefined && ( notesOffset = cn ) 
					) 
					; 
				
				$keys 
				.one( 'build-done.piano', q => { 
					//NOTE - jQuery.map flattens arrays 
					var i = 0, song = $ .map( data, ( x, i ) => i == 0 ? null : [ x ] ); 
					
					// cooked functions in .one( 'build-done.piano', ... ) .. 
					
					( function play() { 
						if ( ! demoing ) { return; } 
						if ( i >= song .length ) { i = 0; } 
						var part = song[ i++ ]; 
						if ( part ) { 
							var delay = part[ 0 ]; 
							demoingTimeout = window .setTimeout( 
								  q => { 
									demoing && play(); 
									for ( var j = 1, len = part .length; j < len; j++ ) { 
										$keys .trigger( `note-${ part[ j ] + notesOffset }.play` ); 
										} 
									} 
								, delay * 50 
								); // -- demoingTimeout 
							} 
						} )() // -- play() 
						; 
					} ) // -- .one() 
					; 
				buildPiano(); 
				} 
			} // -- demo() 
		
		function demoHandler( evt ) { 
			if ( 
					   evt .type === 'click' 
					|| ( evt .keyCode == 77 && ! isModifierKey( evt ) ) 
					) { 
				if ( demoing ) { 
					demoing = false; 
					window .clearTimeout( demoingTimeout ); 
					$keys .unbind( 'build-done.piano' ); 
					} 
				else { 
					demo( chopsticks ); 
					} 
				} 
			} // -- demoHandler() 
		
		} )() // -- undefined => {} 
		; 
	
	
	// 
	// Looper 
	// 
	( q => { 
		var 
			  $looper = $( '.loop' ) 
			, recording = false 
			, startTime 
			, totalTime 
			, data 
			, stopTimeout 
			, loopInterval 
			, loopTimeouts = [] 
			; 
		
		$keys .on( 
			  'played-note.piano'
			, ( evt, key ) => recording && data .push( { 'key' : key, 'time' : new Date() .getTime() } ) 
			); 
		
		$looper .mousedown( recordStart ) .mouseup( recordStop ); 
		
		$( window ) .on( 'keydown keyup', evt => { 
			   evt .which == 57 
			&& ! isModifierKey( evt ) 
			&& ( evt .type == 'keydown' ? recordStart() : recordStop() )
				; 
			} ); 
		
		// functions in q => {} // Looper .. 
		
		function recordStart() { 
			if ( ! recording ) { 
				data = []; 
				startTime = new Date() .getTime(); 
				recording = true; 
				window .clearTimeout( stopTimeout ); 
				stopTimeout = window .setTimeout( recordStop, 60 * 1000 ); // 1 minute max? 
				$looper .addClass( 'active' ); 
				
				// stop old loop 
				window .clearInterval( loopInterval ); 
				loopTimeouts .forEach( x => window .clearTimeout( x ) ); 
				} 
			} // -- recordStart() 
		
		function recordStop() { 
			if ( recording ) { 
				recording = false; 
				totalTime = new Date() .getTime() - startTime; 
				window .clearTimeout( stopTimeout ); 
				for ( var i = 0, len = data .length; i < len; i++ ) { 
					data[ i ] .time = data[ i ] .time - startTime; 
					} 
				if ( data .length ) { 
					playLoop( data, totalTime ); 
					} 
				$looper .removeClass( 'active' ); 
				} 
			} // -- recordStop() 
		
		function playLoop( data, totalTime ) { 
			loopInterval = window .setInterval( 
				  q => { 
					loopTimeouts = []; 
					data .forEach( x => 
						loopTimeouts .push( window .setTimeout( 
							  q => $keys .trigger( `note-${ x .key }.play` )
							, x .time 
							) ) 
						); 
					} 
				, totalTime
				) 
				; 
			} // -- playLoop() 
		
		} )() // -- q => {} // Looper 
		; 
	
	
	// 
	// Silly colors 
	// 
	( q => { 
		var 
			  shouldAnimate = true 
			, $piano = $( '#piano' ) 
			, W = $piano .width() 
			, H = 500 
			, $canvas = 
				$( '<canvas>', { 
					css : { 
						  position : 'absolute' 
						, top : `${ $piano .offset() .top + $piano .outerHeight() - 1 }px` 
						, left : '50%' 
						, marginLeft : `${ Math .floor( -W / 2 ) }px` // need to figure this out... 
						, width : W 
						, height: H 
						} 
					} ) // -- $( '<canvas>', ... ) 
				.attr( 'width', W ) 
				.attr( 'height', H ) 
				.prependTo( 'body' ) 
				// --- $canvas 
			, canvas = $canvas .get( 0 ) 
			, ctx = canvas .getContext( '2d' ) 
			
			, keyToData = {} 
			, keyAnimCounts = {} 
			; 
		
		$keys 
		.on( 'build-done.piano', q =>  
			$keys .find( '.key' ) 
			.each( function() { [ $( this ) .data( 'key' ) ] .forEach( key =>  
				keyToData[ key ] = getData( key ) 
				) } ) 
			) // -- .on( 'build-done.piano', ... ) 
			; 
		
		$keys 
		.on( 'played-note.piano', ( evt, key, $elt ) => { 
			if ( ! shouldAnimate ) { return; } 
			
			var 
				  [ eOffset, eWidth ] = [ $elt, [ 'offset', 'width' ] ] .reduce( ( o, a ) => a .map( p => 
					o[ p ]() 
					) ) 
				, cOffset = $canvas .offset() 
				, startX = ( eOffset .left + eWidth / 2 ) - cOffset .left 
				, startY = 0 
				, endY = 200 
				, amplitude = 8 
				, data = keyToData[ key ] 
				, animCount = keyAnimCounts[ key ] = ( keyAnimCounts[ key ] || 0 ) + 1 
				; 
			
			if ( ! data ) { return; } 
			
			var 
				  len = data .length 
				, maxTime = 500 
				, stepRate = 80 
				, cleanupStepDelay = 8 
				, steps = Math .floor( maxTime / stepRate ) 
				, iPerStep = len / steps 
				, yPerStep = ( endY - startY ) / steps 
				, yIncrement = yPerStep / iPerStep 
				, step = 0 
				, i = 0 
				, color = `#${ choice( 'f33 33f 3f3 ff3 f3f 3ff' .split( ' ' ) ) }` 
				; 
			
			// startY -> endY in steps 
			// each step is yPerStep = (endY - startY) / steps long 
			// each step covers iPerStep = len / steps data points 
			//     at an increment of yIncrement = yPerStep / iPerStep 
			
			// cooked functions in .on( 'played-note.piano', ... ) .. 
			
			( function draw() { 
				
				if ( step < steps ) { 
					ctx .strokeStyle = color; 
					ctx .lineWidth = 1; 
					ctx .beginPath(); 
					ctx .moveTo( startX, startY ); 
					var newMax = i + iPerStep, first = true; 
					for ( ; i <= newMax; i++ ) { 
						startY += yIncrement; 
						ctx[ first ? 'moveTo' : 'lineTo' ]( startX + data[ i ] * amplitude, startY ); 
						first = false; 
						if ( startY > H ) { return; } 
						} 
					i--; // keep an overlap between draws 
					startY -= yIncrement; 
					ctx .stroke(); 
					} // -- ( step < steps ) 
				
				if ( 
						   keyAnimCounts[ key ] == animCount 
						&& step >= cleanupStepDelay 
						) { 
					var cleanupStep = step - cleanupStepDelay; 
					ctx .clearRect( 
						  startX - amplitude - 5, yPerStep * cleanupStep 
						, ( amplitude + 5 ) * 2, yPerStep * ( cleanupStep + 1 ) 
						); 
					} // -- ( keyAnimCounts[ key ] ... ) 
				
				if ( ++ step < steps + cleanupStepDelay ) { 
					window .setTimeout( draw, stepRate ); 
					} 
				} )() // -- draw() 
				; 
			
			} ) // -- .on( 'played-note.piano', ... ) 
			; 
		
		// button 
		var 
			  bW = 20 
			, bH = 20 
			, $loop = $( '.loop' ) 
			, $button = 
				$( 
					  '<canvas>' 
					, { css: { 
						  position : 'absolute' 
						, top : `${ parseInt( $loop .css( 'top' ) ) + 1 }px` 
						, right : `${ parseInt( $loop .css( 'right' ) ) + 34 }px` 
						, width : bW 
						, height : bH 
						, cursor : 'pointer' 
						} } 
					) 
				.attr( 'width', bW ) 
				.attr( 'height', bH ) 
				.appendTo( '#piano' ) 
			, button = $button .get( 0 ) 
			, bctx = button .getContext( '2d' ) 
			, coords = [ 
				  [ 15, 1 ] 
				, [ 5, 9 ] 
				, [ 9, 11 ] 
				, [ 5, 19 ] 
				, [ 15, 11 ] 
				, [ 11, 9 ] 
				] 
			, { length : coordsLen } = coords 
			; 
		
		bctx .strokeStyle = 'rgba(0,0,0,.5)'; 
		bctx .lineWidth = .5; 
		
		draw(); 
		
		$( window ) .keyup( toggleAnimate ); 
		$( '.toggle-animate' ) .click( toggleAnimate ); 
		$button .click( toggleAnimate ); 
		
		// functions in q => {} // Silly Colors .. 
		
		function choice( x ) { return x[ Math .floor( Math .random() * x .length ) ]; } 
		
		function getData( note ) { 
			var 
				  data = [] 
				, freq = Notes .noteToFreq( note ) 
				, vol = 1, sampleRate = 2024, secs = .1 
				, volumeFn = DataGenerator .volume .default 
				, styleFn = DataGenerator .style .default 
				, maxI = sampleRate * secs 
				; 
			for ( var i = 0; i < maxI; i++ ) { 
				var sf = styleFn( freq, vol, i, sampleRate, secs, maxI ); 
				data .push( volumeFn( 
					  styleFn( freq, vol, i, sampleRate, secs, maxI )
					, freq, vol, i, sampleRate, secs, maxI 
					) ); 
				} // -- for( var i ... ) 
			return data; 
			} // -- getData() 
		
		function draw() { 
			bctx .fillStyle = shouldAnimate ? 'rgba(255,255,0,.75)' : 'rgba(0,0,0,.25)'; 
			bctx .clearRect( 0, 0, bW, bH ); 
			bctx .beginPath(); 
			for ( var i = 0; i < coordsLen; i++ ) { 
				bctx[ i == 0 ? 'moveTo' : 'lineTo' ]( ... [ 0, 1 ] .map( p => coords[ i ][ p ] ) ); 
				} 
			bctx .closePath(); 
			if ( shouldAnimate ) { 
				bctx .stroke(); 
				} 
			bctx .fill(); 
			} // -- draw() 
		
		// handlers 
		function toggleAnimate( evt ) { 
			if ( 
					   evt .type === 'click' 
					|| ( evt .keyCode == 56 && ! isModifierKey( evt ) ) 
					) { 
				shouldAnimate = ! shouldAnimate; 
				draw(); 
				} 
			} // -- toggleAnimate() 
		
		} )() // -- q => {} // Silly Colors 
		; 
	
	// flow codes.. 
	
	if ( isIos ) { 
		$( q => { 
			var 
				$note = 
					$( '<div>', { 
						  'class' : 'note' 
						, 'text' : 'Note: sound does not work on iOS, but you can still enjoy pretty wave forms!' 
						} ) 
					.appendTo( 'body' ) 
				; 
			
			window .setTimeout( q => $note .fadeOut(), 6000 ); 
			} )
			; 
		} // -- ( isIos ) 
	
	// functions.. 
	
	function blackKeyClass( i ) { return blackKeys[ ( i % 12 ) + ( i < 0 ? 12 : 0 ) ] || ''; } 
	
	function buildPiano() { 
		if ( buildingPiano ) { return; } 
		buildingPiano = true; 
		
		$keys .trigger( 'build-start.piano' ); 
		$keys .empty() .off( '.play' ); 
		
		// delayed for-loop to stop browser from crashing :'( 
		// go slower on Chrome... 
		var i = -12, max = 14, addDelay = /Chrome/i .test( navigator .userAgent ) ? 80 : 0; 
		
		// cooked functions in buildPiano() .. 
		
		( function go() { // calling by setTimeout self 
			addKey( i + notesOffset ); 
			if ( ++i < max ) { 
				window .setTimeout( go, addDelay ); 
				} 
			else { 
				buildingPiano = false; 
				$keys .trigger( 'build-done.piano' ); 
				} 
			} )(); // -- go() 
		
		// functions in buildPiano() .. 
		
		function addKey( i ) { 
			var 
				  dataURI = isIos ? '' : Notes .getDataURI( i ) 
				
				// trick to deal with note getting hit multiple times before finishing... 
				, sounds = [ 0, 1, 2 ] .map( q => new Audio( dataURI ) ) 
				, curSound = 0 
				, pressedTimeout 
				; 
			dataURI = null; 
			$keys .on( `note-${ i }.play`, play ); 
			var $key = 
				$( 
					  '<div>' 
					, { 
						  'class' : `key${ blackKeyClass( i ) }` 
						, 'data-key' : i 
						, mousedown : evt => $keys .trigger( `note-${ i }.play` ) 
						} 
					) 
				.appendTo( $keys )
				; 
			
			// functions in addKey() .. 
			
			function play( evt ) { 
				// sound 
				sounds[ curSound ] .pause(); 
				try { 
					sounds[ curSound ] .currentTime = 0.001; //HACK - was for mobile safari, but sort of doesn't matter... 
					} 
				catch ( x ) { 
					console .log( x ); 
					} 
				sounds[ curSound ] .play(); 
				curSound = ++ curSound % sounds .length; 
				
				var $k = $keys .find( `[data-key=${ i }]` ) .addClass( 'pressed' ); 
				
				//TODO - it'd be nice to have a single event for triggering and reading 
				$keys .trigger( 'played-note.piano', [ i, $k ] ); 
				
				// visual feedback 
				window .clearTimeout( pressedTimeout ); 
				pressedTimeout = window .setTimeout( q => $k .removeClass( 'pressed' ), 200); 
				} // -- play() 
			
			} // -- addKey() 
		
		} // -- buildPiano() 
	
	function camelToText( x ) { 
		x = x .replace( /([A-Z])/g, ' $1' ); 
		return x .charAt( 0 ) .toUpperCase() + x .substring( 1 ); 
		} 
	
	function isModifierKey( evt ) { return evt .metaKey || evt .shiftKey || evt .altKey; } 
	
	function colorHandler( evt ) { 
		if ( evt .type === 'click' || ( evt .keyCode == 67 && ! isModifierKey( evt ) ) ) { 
			if ( ++ curColor >= colors .length ) { 
				curColor = 0; 
				} 
			document .getElementById( 'piano' ) .style .backgroundColor = '#' + colors[ curColor ]; 
			} 
		} // -- colorHandler() 
	
	
	
	
	// the below code was a failed experiment to support iOS... 
	
	// // 
	// // Generate files for dl... 
	// // 
	
	//	function generateFilesForDL() { 
	//		// backup solution for iOS... since they won't play my files :'( 
	//		// add audio elts to page and then download them all! 
	//		// https://addons.mozilla.org/en-US/firefox/addon/downthemall/?src=search 
	
	//		for ( var i = 0; i < 5; i++ ) { 
	//			var dataURI = Notes .getDataURI( i ); 
	//			$( 'body' ) .prepend( "<br><br>" ); 
	//			$( '<audio>', { controls : 'controls' } ) 
	//			.append( 'Note ' + i ) 
	//			.append( $( '<source>', { 
	//				  src : dataURI 
	//				, type : 'audio/wav' 
	//				} ) ) 
	//			.prependTo( 'body' ) 
	//				; 
	//			$( 'body' ) .prepend( i + ": " ); 
	//			} 
	
	//		$( 'body' ) .prepend( "<br><br>" ); 
	//		$( '<audio>', { controls : 'controls', src : 'note.caf', type : 'audio/wav' } ) .prependTo( 'body' ); 
	//		$( 'body' ) .prepend( "note: " ); 
	
	//	} 
	//	generateFilesForDL(); 
	
	} )() 
	; 

// original https://github.com/mrcoles/javascript-piano 
// modify killofki 
