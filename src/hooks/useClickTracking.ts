"use client";

import { useEffect } from 'react';
import useSelectedCompany from './useSelectedCompanyId';
import { useSelectedUserId } from './useSelectedUserId';

interface ClickEventPayload {
  type: string;
  userId: string;
  companyId: string;
  name: string;
  innerHTML: string;
  details: {
    buttonId: string;
    buttonType: string;
    path: string;
    timestamp: string;
    userAgent: string;
    screenSize: string;
    dataAttributes: Record<string, any>;
  };
}

export const useClickEventTracking = () => {
  const userId = useSelectedUserId();
  const selectedCompany = useSelectedCompany();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      const isButton = 
        target.tagName === 'BUTTON' || 
        target.closest('button') ||
        target.getAttribute('role') === 'button' ||
        target.closest('[role="button"]');
      
      if (isButton) {
        const buttonElement = target.tagName === 'BUTTON' 
          ? target 
          : (target.closest('button') || target.closest('[role="button"]')) as HTMLElement;
        
        if (!buttonElement) return;

        const buttonInnerHTML = buttonElement.innerHTML;
        const buttonText = buttonElement.textContent?.trim() || '';
        
        const additionalInfo = {
          buttonId: buttonElement.id || 'unknown',
          buttonType: (buttonElement as HTMLButtonElement).type || 'unknown',
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          dataAttributes: extractDataAttributes(buttonElement)
        };
        
        const payload: ClickEventPayload = {
          type: 'click_event',
          userId: userId || 'unknown',
          companyId: selectedCompany?.toString() || 'unknown',
          name: buttonText,
          innerHTML: buttonInnerHTML,
          details: additionalInfo
        };

        void sendClickEventToBackend(payload);
      }
    };
    
    const extractDataAttributes = (element: HTMLElement): Record<string, any> => {
      const dataAttrs: Record<string, any> = {};
      
      if (element.dataset) {
        Object.entries(element.dataset).forEach(([key, value]) => {
          dataAttrs[key] = value;
        });
      }
      
      return dataAttrs;
    };
    
    const sendClickEventToBackend = async (payload: ClickEventPayload): Promise<void> => {
      try {
        const response = await fetch('/api/track-events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          console.error('Failed to send click event data:', response.status);
        }
      } catch (error) {
        console.error('Error sending click event data:', error);
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [userId, selectedCompany]);
};