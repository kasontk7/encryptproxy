import React from 'react';

interface FileUploadProps {
	selectedFile: File | null;
	handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleUpload: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ handleFileChange, handleUpload }) => {
	return (
		<div className="file-upload">
			<input type="file" onChange={handleFileChange} />
			<button onClick={handleUpload}>Upload</button>
		</div>
	);
};

export default FileUpload;
