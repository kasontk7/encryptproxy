import { createCipheriv, createDecipheriv, createECDH, createHmac } from 'crypto-browserify';
import axios from 'axios';

export const encryptData = async (file: File, sharedSecret: Buffer, iv: Buffer): Promise<{ authTag: Buffer; encryptedData: Buffer }> => {
	const formDataBuffer = await readFileAsBuffer(file);
	const cipher = createCipheriv('aes-256-gcm', sharedSecret, iv);
	const encryptedData = Buffer.concat([cipher.update(formDataBuffer), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return { authTag, encryptedData };
};

export const decryptData = (data: Buffer, sharedSecret: Buffer, iv: Buffer, authTag: Buffer): Buffer => {
	const decipher = createDecipheriv('aes-256-gcm', sharedSecret, iv);
	decipher.setAuthTag(authTag);
	const decryptedFile = Buffer.concat([decipher.update(data), decipher.final()]);
	return decryptedFile;
};

export const generateKeys = async (proxyUrl: string): Promise<Buffer> => {
	let encryptionKey = Buffer.from('');
	try {
		const ecdhCurve = createECDH('secp521r1');
		ecdhCurve.generateKeys();
		const frontendPublicKeyBuffer = ecdhCurve.getPublicKey();
		const response = await axios.post(`${proxyUrl}/api/exchange-keys`, {
			publicKey: frontendPublicKeyBuffer.toString('base64'),
		});
		const backendPublicKey = Buffer.from(response.data.publicKey, 'base64');
		const sharedSecretKey = ecdhCurve.computeSecret(backendPublicKey);
		encryptionKey = createHmac('sha256', sharedSecretKey).update('encryption key').digest();
	} catch (error) {
		console.error('Failed to generate key pair:', error);
		throw new Error('Failed to generate key pair.');
	}
	return encryptionKey;
};

const readFileAsBuffer = async (file: File): Promise<Buffer> => {
	return new Promise<Buffer>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const arrayBuffer = reader.result as ArrayBuffer;
			const fileBuffer = Buffer.from(arrayBuffer);
			resolve(fileBuffer);
		};
		reader.onerror = (error) => reject(error);
		reader.readAsArrayBuffer(file);
	});
};
