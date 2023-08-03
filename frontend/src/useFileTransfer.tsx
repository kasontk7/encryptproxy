import { useState, useEffect, ChangeEvent } from 'react';
import axios, { AxiosError, isAxiosError } from 'axios';
import { randomBytes } from 'crypto-browserify';
import { encryptData, decryptData, generateKeys } from './encryptionUtils';

interface FileTransferComponentState {
    selectedFile: File | null;
    files: string[];
    sharedSecret: Buffer;
}

export const useFileTransfer = () => {
    const [state, setState] = useState<FileTransferComponentState>({
        selectedFile: null,
        files: [],
        sharedSecret: Buffer.from(''),
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
            const { authTag, encryptedData } = await encryptData(selectedFile, sharedSecret, iv);
            try {
                await axios.post(`${proxyUrl}/api/upload`, {
                    data: encryptedData.toString('base64'),
                    iv: iv.toString('base64'),
                    authTag: authTag.toString('base64'),
                    filename: selectedFile.name,
                });
                alert('File uploaded successfully!');
                const newFiles = await fetchFiles();
                setState({ ...state, selectedFile: null, files: newFiles });
            } catch (error) {
                if (isAxiosError(error)) {
                    const axiosError = error as AxiosError;
                    if (axiosError.response && axiosError.response.status === 409) {
                        alert('File already exists. Please try a different file.');
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

    const handleDownload = async (fileName: string) => {
        try {
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
            document.body.removeChild(link);
        } catch (error) {
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

    useEffect(() => {
        const startup = async () => {
            const encryptionKey = await generateKeys(proxyUrl);
            const newFiles = await fetchFiles();
            setState({ ...state, sharedSecret: encryptionKey, files: newFiles });
        }
        startup();
    }, []);

    return {
        selectedFile,
        files,
        handleFileChange,
        handleUpload,
        handleDownload,
    };
};