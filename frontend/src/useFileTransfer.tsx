import { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
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
            const decryptedFile = decryptData(encryptedFile, sharedSecret, iv, authTag);
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