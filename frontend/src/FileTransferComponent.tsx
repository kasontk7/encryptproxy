import React from 'react';
import FileUpload from './FileUpload'; // Custom component for file upload
import FileList from './FileList'; // Custom component for displaying the file list
import { useFileTransfer } from './useFileTransfer'; // Custom hook for file transfer logic
import './FileTransferComponent.css';
import EncryptionStatus from './EncryptionStatus';

interface FileTransferComponentProps { }

const FileTransferComponent: React.FC<FileTransferComponentProps> = () => {
	const { selectedFile, files, handleFileChange, handleUpload, handleDownload, encryptionStatus } = useFileTransfer();

	return (
		<div className="container">
			<FileUpload selectedFile={selectedFile} handleFileChange={handleFileChange} handleUpload={handleUpload} />
			<EncryptionStatus status={encryptionStatus} />
			<FileList files={files} handleDownload={handleDownload} />
		</div>
	);
};

export default FileTransferComponent;
