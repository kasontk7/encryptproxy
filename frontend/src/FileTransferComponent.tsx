import React, { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';
import { createCipheriv, createDecipheriv, createECDH, randomBytes, createHmac } from 'crypto-browserify';
import './FileTransferComponent.css';

interface FileTransferComponentProps { }

interface FileTransferComponentState {
	selectedFile: File | null;
	files: string[];
	sharedSecret: Buffer;
}

const FileTransferComponent: React.FC<FileTransferComponentProps> = () => {
	const [state, setState] = useState<FileTransferComponentState>({
		selectedFile: null,
		files: [],
		sharedSecret: Buffer.from(""),
	});

	const { selectedFile, files, sharedSecret } = state;
	const proxyUrl = 'http://localhost:3001';

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			setState({ ...state, selectedFile: event.target.files[0] });
		}
	};

	const handleUpload = async () => {
		if (selectedFile) {
			const iv = randomBytes(16);
			const { authTag, encryptedData } = await encryptData(selectedFile, iv);
			try {
				const response = await axios.post(`${proxyUrl}/api/upload`, {
					data: encryptedData.toString('base64'),
					iv: iv.toString('base64'),
					authTag: authTag.toString('base64'),
					filename: selectedFile.name,
				});
				alert('File uploaded successfully!');
				const newFiles = await fetchFiles();
				setState({ ...state, selectedFile: null, files: newFiles });
			} catch (error) {
				alert('Failed to upload the file. Please make sure file does not already exist.');
			}
		} else {
			alert('Please select a file to upload.');
		}
	};

	const handleDownload = async (fileName: string) => {
		try {
			const response = await axios.get(`${proxyUrl}/api/download/${fileName}`);
			const encryptedFile = Buffer.from(response.data.data, 'base64');
			const iv = Buffer.from(response.data.iv, 'base64');
			const authTag = Buffer.from(response.data.authTag, 'base64');
			const decryptedFile = decryptData(encryptedFile, iv, authTag);
			// Create a download link and trigger the download
			const url = window.URL.createObjectURL(new Blob([decryptedFile]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', fileName);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			alert(error);
			alert('Failed to download the file.');
		}
	};

	const fetchFiles = async () => {
		let newFiles = []
		try {
			const response = await axios.get(`${proxyUrl}/api/files`);
			newFiles = response.data;
		} catch (error) {
			alert('Failed to fetch files.');
		}
		return newFiles;
	};

	const generateKeys = async () => {
		let encryptionKey = Buffer.from('');
		try {
			const ecdhCurve = await createECDH('secp521r1'); // await or no?
			ecdhCurve.generateKeys();
			const frontendPublicKeyBuffer = ecdhCurve.getPublicKey();
			const response = await axios.post(`${proxyUrl}/api/exchange-keys`, {
				publicKey: frontendPublicKeyBuffer.toString('base64'),
			});
			const backendPublicKey = Buffer.from(response.data.publicKey, 'base64');
			const sharedSecretKey = ecdhCurve.computeSecret(backendPublicKey);
			encryptionKey = createHmac('sha256', sharedSecretKey).update('encryption key').digest();
		} catch (error) {
			alert('Failed to generate key pair.');
		}
		return encryptionKey;
	};

	useEffect(() => {
		const startup = async () => {
			const encryptionKey = await generateKeys();
			const newFiles = await fetchFiles();
			setState({ ...state, sharedSecret: encryptionKey, files: newFiles });
		}
		startup();
	}, []);

	const encryptData = async (file: File, iv: Buffer) => {
		const formDataBuffer = await readFileAsBuffer(file);
		const cipher = createCipheriv('aes-256-gcm', sharedSecret, iv);
		let encryptedData = Buffer.concat([
			cipher.update(formDataBuffer),
			cipher.final(),
		]);
		const authTag = cipher.getAuthTag();
		return { authTag, encryptedData };
	}

	const decryptData = (data: Buffer, iv: Buffer, authTag: Buffer) => {
		const decipher = createDecipheriv('aes-256-gcm', sharedSecret, iv);
		decipher.setAuthTag(authTag);
		let decryptedFile = Buffer.concat([
			decipher.update(data),
			decipher.final(),
		]);
		return decryptedFile;
	}

	const readFileAsBuffer = (file: File): Promise<Buffer> => {
		return new Promise((resolve, reject) => {
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

	return (
		<div className="container">
			<div className="file-upload">
				<input type="file" onChange={handleFileChange} />
				<button onClick={handleUpload}>Upload</button>
			</div>

			<div className="file-list">
				<h2>Available Files:</h2>
				<ul>
					{files.map((fileName) => (
						<li key={fileName}>
							<span>{fileName}</span>
							<button onClick={() => handleDownload(fileName)}>Download</button>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default FileTransferComponent;
