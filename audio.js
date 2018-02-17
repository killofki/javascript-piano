// from https://mrcoles.com/piano/audio.js 

/*! Copyright (c) 2013 - Peter Coles (mrcoles.com) 
 *  Licensed under the MIT license: http://mrcoles.com/media/mit-license.txt 
 */ 
( q => { 
	
	var DataGenerator = $ .extend( 
		  ( 
				  styleFn = DataGenerator .style .default
				, volumeFn = DataGenerator .volume .default
				, cfg = {} 
				) => { 
			( cfg = { 
					  freq : 440
					, volume : 32767 
					, sampleRate : 11025 // Hz 
					, seconds : .5 
					, channels : 1 
					, ... cfg 
					} ) 
				; 
			
			var data = []; 
			var maxI = cfg .sampleRate * cfg .seconds; 
			for ( var i = 0; i < maxI; i++ ) { 
				for ( var j = 0; j < cfg .channels; j++) { 
					[ cfg ] .forEach( ( { freq, volume, sampleRate, seconds }, k, cfga 
							, fars = [ freq, volume, i, sampleRate, seconds, maxI ] 
							) => 
						data .push( asBytes( volumeFn( styleFn( ... fars ), ... fars ) * attack( i ), 2 ) ) 
						); 
					} 
				} 
			return data; 
			} // -- ( styleFn, volumeFn, cfg ) => {} // default value over $ 
		, { 
			  style : { 
				  wave : ( freq, volume, i, sampleRate, seconds ) => 
					Math .sin( ( 2 * Math .PI ) * ( i / sampleRate ) * freq ) 
					// wave 
					// i = 0 -> 0 
					// i = (sampleRate/freq)/4 -> 1 
					// i = (sampleRate/freq)/2 -> 0 
					// i = (sampleRate/freq)*3/4 -> -1 
					// i = (sampleRate/freq) -> 0 
				, squareWave : ( freq, volume, i, sampleRate, seconds, maxI 
						, coef = sampleRate / freq 
						) => 
					( i % coef ) / coef < .5 ? 1 : -1 
					// square 
					// i = 0 -> 1 
					// i = (sampleRate/freq)/4 -> 1 
					// i = (sampleRate/freq)/2 -> -1 
					// i = (sampleRate/freq)*3/4 -> -1 
					// i = (sampleRate/freq) -> 1 
				, triangleWave : ( freq, volume, i, sampleRate, seconds, maxI ) => 
					Math .asin( Math .sin( ( 2 * Math .PI ) * ( i / sampleRate ) * freq ) ) 
				, sawtoothWave : ( freq, volume, i, sampleRate, seconds, maxI 
						, coef = sampleRate / freq 
						) => 
					-1 + 2 * ( (i % coef) / coef ) 
					// sawtooth 
					// i = 0 -> -1 
					// i = (sampleRate/freq)/4 -> -.5 
					// i = (sampleRate/freq)/2 -> 0 
					// i = (sampleRate/freq)*3/4 -> .5 
					// i = (sampleRate/freq) - delta -> 1 
				} 
			, volume : { 
				  flat : ( data, freq, volume ) => volume * data 
				, linearFade : ( data, freq, volume, i, sampleRate, seconds, maxI ) => 
					volume * ( ( maxI - i ) / maxI ) * data 
				, quadraticFade : ( data, freq, volume, i, sampleRate, seconds, maxI ) => 
					volume * ( ( -1 / Math .pow( maxI, 2 ) ) * Math .pow( i, 2 ) + 1 ) * data 
					// y = -a(x - m)(x + m); and given point (m, 0) 
					// y = -(1/m^2)*x^2 + 1; 
				} 
			} // -- { style, squareWave, triangleWave, sawtoothWave, volume } 
		); // -- DataGenerator = $ .extend() 
	[ [ 'style', 'wave' ], [ 'volume', 'linearFade' ] ] 
	.forEach( ( [ p, q ], i, a, ele = DataGenerator[ p ] ) => ele .default = ele[ q ] ) 
		; 
	
	var 
		Notes = { 
			  sounds : {} 
			, getDataURI : ( n, cfg = {} ) => (
				  ( cfg .freq = noteToFreq( n ) ) 
				, toDataURI( cfg ) 
				) 
			, getCachedSound : function( n, data ) { 
				var key = n, cfg; 
				if ( data && typeof data == "object" ) { 
					cfg = data; // setter's caller 
					key += `-${ 
						[] .concat( ... Object .keys( data ) .map( attr => [ attr, data[ attr ] ] ) ) 
						.sort() 
						.join( '-' ) 
						}` 
						; 
					} 
				else if ( typeof data != 'undefined' ) { 
					key = `${ n }.${ key }`; 
					} 
				
				return (
					   ( this .sounds[ key ] ) 
					|| ( this .sounds[ key ] = new Audio( this .getDataURI( n, cfg ) ) ) 
					); 
				} 
			, noteToFreq 
			} 
		; 
	
	window .DataGenerator = DataGenerator; 
	window .Notes = Notes; 
	
	// functions.. 
	
	function noteToFreq( stepsFromMiddleC ) { 
		return 440 * Math .pow( 2, ( stepsFromMiddleC + 3 ) / 12 ); 
		} 
	
	function toDataURI( cfg ) { 
	
		cfg = $ .extend( 
			  { 
				  channels : 1 
				, sampleRate : 11025 // Hz 
				, bitDepth : 16 // bits/sample 
				, seconds : .5 
				, volume : 20000 //32767 
				, freq : 440 
				} 
			, cfg
			); 
		
		
		// 
		// Format Sub-Chunk 
		// 
		
		var 
			fmtChunk = 
				[ 
					  'fmt ' // sub-chunk identifier 
					, ... 
						[ 
							  [ 16, 4 ] // chunk-length 
							, [ 1, 2 ] // audio format (1 is linear quantization) 
							, [ cfg .channels, 2 ] 
							, [ cfg .sampleRate, 4 ] 
							, [ cfg .sampleRate * cfg .channels * cfg .bitDepth / 8, 4 ] // byte rate 
							, [ cfg .channels * cfg .bitDepth / 8, 2 ], 
							, [ cfg .bitDepth, 2 ] 
							] 
						.map( ( [ value, bytes ] ) => asBytes( value, bytes ) ) 
					] 
				.join( '' ) 
			; 
		
		// 
		// Data Sub-Chunk 
		// 
		
		var sampleData = DataGenerator( cfg .styleFn, cfg .volumeFn, cfg ); 
		var samples = sampleData .length; 
		
		var 
			dataChunk = 
				[ 
					  'data' // sub-chunk identifier 
					, asBytes( samples * cfg .channels * cfg .bitDepth / 8, 4 ) // chunk length 
					, sampleData .join( '' ) 
					] 
				.join( '' ) 
			; 
		
		// 
		// Header + Sub-Chunks 
		// 
		
		var 
			data = 
				[ 
					  'RIFF' 
					, asBytes( 4 + ( 8 + fmtChunk .length ) + ( 8 + dataChunk .length ), 4 ) 
					, 'WAVE' 
					, fmtChunk 
					, dataChunk 
					] 
				.join( '' ) 
			; 
		
		return getFormDataURI( 'audio/wav', data ); 
		} // -- toDataURI() 
	
	function getFormDataURI( form, data ) { // lazy.. 
		getFormDataURI = ( form, data ) => // default function : toURI 
			`data:${ form };base64,${ btoa( data ) }` 
			; 
		// test if we can use blobs 
		if ( window .webkitURL && window .Blob ) { 
			try { 
				new Blob(); 
				getFormDataURI = toBlob; 
				} catch( e ) {} 
			} 
		return getFormDataURI( form, data ); // execute about calling.. 
		
		// functions in getFormDataURI.. 
		function toBlob( form, data 
				, view = new Uint8Array( data .length ) 
				, blob 
				) { 
			view .forEach( ( v, i ) => view[ i ] = data .charCodeAt( i ) ); 
			blob = new Blob( [ view ], { type : form } ); 
			return window .webkitURL .createObjectURL( blob ); 
			} 
		} 
	
	function attack( i ) { 
		return i < 200 ? (i/200) : 1; 
		} 
	
	function asBytes( value, bytes ) { 
		// Convert value into little endian hex bytes 
		// value - the number as a decimal integer (representing bytes) 
		// bytes - the number of bytes that this value takes up in a string 
	
		// Example: 
		// asBytes(2835, 4) 
		// > '\x13\x0b\x00\x00' 
		var result = []; 
		for ( ; bytes > 0; bytes-- ) { 
			result .push( String .fromCharCode( value & 255 ) ); 
			value >>= 8; 
			} 
		return result .join(''); 
		} 
	
	} 
)();
