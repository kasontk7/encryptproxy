import React from 'react';

interface FileListProps {
	files: string[];
	handleDownload: (fileName: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, handleDownload }) => {
	return (
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
	);
};

export default FileList;
