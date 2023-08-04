import React from 'react';

interface EncryptionStatusProps {
	status: string;
}

const EncryptionStatus: React.FC<EncryptionStatusProps> = ({ status }) => {
	return (
		<div className="encryption-status">
			{status && <div className="loading-effect">{status}</div>}
		</div>
	);
};

export default EncryptionStatus;
