import React, { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';
import { createCipheriv, createECDH, randomBytes } from 'crypto-browserify';

interface FileTransferComponentProps {}

interface FileTransferComponentState {
  selectedFile: File | null;
  files: string[];
  publicKey: string | null;
  privateKey: CryptoKey | null;
  sharedSecret: Buffer | null;
}

const FileTransferComponent: React.FC<FileTransferComponentProps> = () => {
  const [state, setState] = useState<FileTransferComponentState>({
    selectedFile: null,
    files: [],
    publicKey: null,
    privateKey: null,
    sharedSecret: null,
  });

  const { selectedFile, files } = state;
  const proxyUrl = 'http://localhost:3001';

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setState({ ...state, selectedFile: event.target.files[0] });
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        await axios.post(`${proxyUrl}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        alert('File uploaded successfully!');
        setState({ ...state, selectedFile: null });
        fetchFiles();
      } catch (error) {
        alert('Failed to upload the file.');
      }
    } else {
      alert('Please select a file to upload.');
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const response = await axios.get(`${proxyUrl}/api/download/${fileName}`, {
        responseType: 'blob',
      });

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
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
    try {
      const response = await axios.get(`${proxyUrl}/api/files`);
      setState({ ...state, files: response.data });
    } catch (error) {
      alert('Failed to fetch files.');
    }
  };

  const generateKeys = async () => {
    try {
        const ecdhCurve = await createECDH("secp521r1");
        ecdhCurve.generateKeys();
        const frontendPublicKeyBuffer = ecdhCurve.getPublicKey();
        const response = await axios.post(`${proxyUrl}/api/exchange-keys`, {
            publicKey: frontendPublicKeyBuffer.toString("base64"),
        });
        const backendPublicKey = Buffer.from(response.data.publicKey,'base64');
        const sharedSecret = ecdhCurve.computeSecret(backendPublicKey);
        setState({ ...state,
            sharedSecret: sharedSecret,
        });
    } catch (error) {
        alert('Failed to generate key pair.');
    }
  };

  useEffect(() => {
    generateKeys();
    fetchFiles();
    // eslint-disable-next-line
  }, []);

  const encryptData = (data: FormData) => {
    // const iv = randomBytes(16);
    // const cipher = createCipheriv('aes-256-cbc', state.sharedSecret, iv);
    // const encryptedContent = Buffer.concat([cipher.update(fileContent, 'utf8'), cipher.final()]);
    // return { encryptedContent: encryptedContent.toString('base64'), iv: iv.toString('hex') };

  }
  
  const decryptData = (data: FormData, key: string) => {
  
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      <h2>Available Files:</h2>
      <ul>
        {files.map((fileName) => (
          <li key={fileName}>
            {fileName}{' '}
            <button onClick={() => handleDownload(fileName)}>Download</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileTransferComponent;
