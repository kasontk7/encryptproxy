import React, { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';
import { createCipheriv, createECDH, randomBytes, createHmac } from 'crypto-browserify';

interface FileTransferComponentProps {}

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
        await axios.post(`${proxyUrl}/api/upload`, {
          data: encryptedData.toString('base64'),
          iv: iv.toString('base64'),
          authTag: authTag.toString('base64'),
          filename: selectedFile.name,
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
        const ecdhCurve = await createECDH('secp521r1'); // await or no?
        ecdhCurve.generateKeys();
        const frontendPublicKeyBuffer = ecdhCurve.getPublicKey();
        const response = await axios.post(`${proxyUrl}/api/exchange-keys`, {
            publicKey: frontendPublicKeyBuffer.toString('base64'),
        });
        const backendPublicKey = Buffer.from(response.data.publicKey,'base64');
        const sharedSecretKey = ecdhCurve.computeSecret(backendPublicKey);
        const encryptionKey = createHmac('sha256', sharedSecretKey).update('encryption key').digest();
        setState({ ...state,
            sharedSecret: encryptionKey,
        });
    } catch (error) {
        alert('Failed to generate key pair.');
    }
  };

  useEffect(() => {
    generateKeys();
  }, []);

  const encryptData = async (file: File, iv: Buffer) => {
    const formDataBuffer = await readFileAsBuffer(file);
    const cipher = createCipheriv('aes-256-gcm', sharedSecret, iv); 
    let encryptedData = Buffer.concat([
        cipher.update(formDataBuffer),
        cipher.final(),
        ]);
    const authTag = cipher.getAuthTag();
    return { authTag, encryptedData } ;
  }
  
  const decryptData = (data: FormData, key: string) => {
  
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
