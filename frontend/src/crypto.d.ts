/* tslint:disable completed-docs */

/**
 * The crypto-browserify module is missing typing information
 */
declare module 'crypto-browserify' {
	import {
		CipherGCM,
		CipherGCMOptions,
		CipherGCMTypes,
		CipherKey,
		DecipherGCM,
		ECDH,
		Hmac
	} from '@apollo/react-hooks';
	import { TransformOptions } from 'stream';

	type BinaryLike = string | Buffer | NodeJS.TypedArray | DataView;

	/**
	 * Create a decipher using AES GCM with an initialization vector
	 */
	export function createDecipheriv(
		algorithm: CipherGCMTypes,
		key: BinaryLike,
		iv: BinaryLike,
		options?: CipherGCMOptions
	): DecipherGCM;

	/**
	 * Create a cipher using AES GCM with an initialization vector
	 */
	function createCipheriv(
		algorithm: CipherGCMTypes,
		key: CipherKey,
		iv: BinaryLike | null,
		options?: CipherGCMOptions
	): CipherGCM;

	/**
	 * Create an ECDH curve
	 */
	export function createECDH(curve_name: string): ECDH;

	/**
	 * Create an HMAC
	 */
	export function createHmac(
		algorithm: string,
		key: BinaryLike,
		options?: TransformOptions
	): Hmac;

	/**
	 * Generate random bytes
	 */
	export function randomBytes(size: number): Buffer;
}

/* tslint:disable completed-docs */

/** Webpack worker-loader type setup */
declare module 'worker-loader!*' {
	/** Worker */
	class WebpackWorker extends Worker {
		/** Webpack's Worker constructor */
		public constructor();
	}

	export default WebpackWorker;
}

/**
 * copies crypto definitions
 */
declare module 'crypto-browserify' {
	import {
		CipherGCM,
		CipherGCMOptions,
		CipherGCMTypes,
		DecipherGCM
	} from 'crypto';

	/**
	 * Create cipher iv
	 */
	export function createCipheriv(
		algorithm: CipherGCMTypes,
		key: string | Buffer | NodeJS.TypedArray | DataView,
		iv: string | Buffer | NodeJS.TypedArray | DataView,
		options?: CipherGCMOptions
	): CipherGCM;

	/**
	 * Create decipher iv
	 */
	export function createDecipheriv(
		algorithm: CipherGCMTypes,
		key: string | Buffer | NodeJS.TypedArray | DataView,
		iv: string | Buffer | NodeJS.TypedArray | DataView,
		options?: CipherGCMOptions
	): DecipherGCM;
}

/**
 * Saving streams
 */
declare module 'streamsaver' {
	/**
	 * Create a write stream
	 */
	export function createWriteStream(
		filename: string,
		size?: number
	): WritableStream;
}

declare module 'typedarray-to-buffer' {
	type TypedArray =
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Int32Array
		| Uint32Array
		| Uint8ClampedArray
		| Float32Array
		| Float64Array;
	function toBuffer(arr: TypedArray): Buffer;

	namespace toBuffer { }

	export = toBuffer;
}
