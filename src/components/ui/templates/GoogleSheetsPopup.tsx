'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GoogleSheetsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleSheetsPopup: React.FC<GoogleSheetsPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleInstallClick = () => {
    window.open(
      'https://workspace.google.com/marketplace/app/finboard_for_quickbooks_connect_automate/239112301433',
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Popup content */}
      <Card className="relative w-full max-w-md mx-4 z-10">
        <CardContent className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 px-2">
              Install our Google Sheets plugin to create financial reports
            </h2>

            <div className="flex items-center justify-center space-x-2">
              <Button onClick={handleInstallClick} className="bg-primary hover:bg-primary/80 text-white" size="sm">
                Install Now
              </Button>
              <span className="text-gray-600">From</span>
              <div className="flex items-center ml-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleSheetsPopup;
