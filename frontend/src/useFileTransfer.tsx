import { useState, useEffect, ChangeEvent } from 'react';
import axios, { AxiosError, isAxiosError } from 'axios';
import { randomBytes } from 'crypto-browserify';
import { encryptData, decryptData, generateKeys } from './encryptionUtils';

interface FileTransferComponentState {
	selectedFile: File | null;  // The selected file for upload
	files: string[];            // The list of available files for download
	sharedSecret: Buffer;       // The shared secret key for encryption/decryption
	encryptionStatus: string;   // The status of the current encryption/decryption process
}

export const useFileTransfer = () => {
	const [state, setState] = useState<FileTransferComponentState>({
		selectedFile: null,
		files: [],
		sharedSecret: Buffer.from(''),
		encryptionStatus: '',
	});

	// Destructuring the state object for easier access
	const { selectedFile, files, sharedSecret, encryptionStatus } = state;

	const proxyUrl = 'http://localhost:3001';

	// Event handler for file input change
	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			setState({ ...state, selectedFile: event.target.files[0] });
		}
	};

	// Function to handle file upload
	const handleUpload = async () => {
		if (selectedFile) {
			try {
				setState({ ...state, encryptionStatus: 'Encrypting' });

				// Encrypt the file before sending it
				const iv = randomBytes(16);
				const { authTag, encryptedData } = await encryptData(selectedFile, sharedSecret, iv);
				
				setState({ ...state, encryptionStatus: 'Uploading' });
				await axios.post(`${proxyUrl}/api/upload`, {
					data: encryptedData.toString('base64'),
					iv: iv.toString('base64'),
					authTag: authTag.toString('base64'),
					filename: selectedFile.name,
				});
				alert('File uploaded successfully!');
				const newFiles = await fetchFiles();
				// Reset the selected file and update the list of files
				setState({ ...state, selectedFile: null, encryptionStatus: '', files: newFiles });
			} catch (error) {
				setState({ ...state, encryptionStatus: '' });

				// Potential Breakage:
				// Handles the two most common error types that I encountered, but other errors are not properly handled
				if (isAxiosError(error)) {
					const axiosError = error as AxiosError;
					if (axiosError.response && axiosError.response.status === 409) {
						alert('File already exists. Please try a different file.');
					}
					else if (axiosError.response && axiosError.response.status === 413) {
						alert('File is too large. The limit is 50MB. Please try a different file.');
					}
					else {
						alert('Failed to upload the file.');
					}
				}
			}
		} else {
			alert('Please select a file to upload.');
		}
	};

	// Function to handle file download
	const handleDownload = async (fileName: string) => {
		try {
			setState({ ...state, encryptionStatus: 'Decrypting' });

			// Download and decrypt the file
			const response = await axios.get(`${proxyUrl}/api/download/${fileName}`);
			const { data, iv, authTag } = response.data;
			const decryptedFile = decryptData(
				Buffer.from(data, 'base64'),
				sharedSecret,
				Buffer.from(iv, 'base64'),
				Buffer.from(authTag, 'base64'));

			// Create a download link and trigger the download
			const url = window.URL.createObjectURL(new Blob([decryptedFile]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', fileName);
			document.body.appendChild(link);
			link.click();

			// Remove the link from the DOM after triggering the download
			document.body.removeChild(link);
			setState({ ...state, encryptionStatus: '' });
		} catch (error) {
			setState({ ...state, encryptionStatus: '' });
			alert('Failed to download the file.');
		}
	};

	// Fetch the list of available files from the server
	const fetchFiles = async () => {
		let newFiles = [];
		try {
			const response = await axios.get(`${proxyUrl}/api/files`);
			newFiles = response.data;
		} catch (error) {
			alert('Failed to fetch files.');
		}
		return newFiles;
	};

	// Run at startup
	useEffect(() => {
		const startup = async () => {
			// Generate a shared secret key before any APIs are called
			const encryptionKey = await generateKeys(proxyUrl);
			// Fetch the initial list of files (I preloaded some)
			const newFiles = await fetchFiles();  
			setState({ ...state, sharedSecret: encryptionKey, files: newFiles });
		};
		startup();
		// eslint-disable-next-line
	}, []);

	return {
		selectedFile,
		files,
		handleFileChange,
		handleUpload,
		handleDownload,
		encryptionStatus,
	};
};
