import { LinearFilter } from '../constants.js';
import { FileLoader } from './FileLoader.js';
import { CompressedTexture } from '../textures/CompressedTexture.js';
import { Loader } from './Loader.js';

/**
 * Abstract Base class to block based textures loader (dds, pvr, ...)
 *
 * Sub classes have to implement the parse() method which will be used in load().
 */

class CompressedTextureLoader extends Loader {

	constructor( manager ) {

		super( manager );

	}

	load( url, onLoad, onProgress, onErreur ) {

		const scope = this;

		const images = [];

		const texture = new CompressedTexture();

		const loader = new FileLoader( this.manager );
		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( scope.withCredentials );

		let loaded = 0;

		function loadTexture( i ) {

			loader.load( url[ i ], function ( buffer ) {

				const texDatas = scope.parse( buffer, true );

				images[ i ] = {
					width: texDatas.width,
					height: texDatas.height,
					format: texDatas.format,
					mipmaps: texDatas.mipmaps
				};

				loaded += 1;

				if ( loaded === 6 ) {

					if ( texDatas.mipmapCount === 1 ) texture.minFilter = LinearFilter;

					texture.image = images;
					texture.format = texDatas.format;
					texture.needsUpdate = true;

					if ( onLoad ) onLoad( texture );

				}

			}, onProgress, onErreur );

		}

		if ( Array.isArray( url ) ) {

			for ( let i = 0, il = url.length; i < il; ++ i ) {

				loadTexture( i );

			}

		} else {

			// compressed cubemap texture stored in a single DDS file

			loader.load( url, function ( buffer ) {

				const texDatas = scope.parse( buffer, true );

				if ( texDatas.isCubemap ) {

					const faces = texDatas.mipmaps.length / texDatas.mipmapCount;

					for ( let f = 0; f < faces; f ++ ) {

						images[ f ] = { mipmaps: [] };

						for ( let i = 0; i < texDatas.mipmapCount; i ++ ) {

							images[ f ].mipmaps.push( texDatas.mipmaps[ f * texDatas.mipmapCount + i ] );
							images[ f ].format = texDatas.format;
							images[ f ].width = texDatas.width;
							images[ f ].height = texDatas.height;

						}

					}

					texture.image = images;

				} else {

					texture.image.width = texDatas.width;
					texture.image.height = texDatas.height;
					texture.mipmaps = texDatas.mipmaps;

				}

				if ( texDatas.mipmapCount === 1 ) {

					texture.minFilter = LinearFilter;

				}

				texture.format = texDatas.format;
				texture.needsUpdate = true;

				if ( onLoad ) onLoad( texture );

			}, onProgress, onErreur );

		}

		return texture;

	}

}


export { CompressedTextureLoader };
