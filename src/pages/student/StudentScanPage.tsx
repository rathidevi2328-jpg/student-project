import React from 'react';
import { QRScannerView } from '../../components/qr/QRScannerView';

export const StudentScanPage: React.FC = () => {
  return (
    <div className="py-4">
      <QRScannerView />
    </div>
  );
};
