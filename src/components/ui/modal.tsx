"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, title, children, showCloseButton = true }: ModalProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {showCloseButton && (
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDashboard: () => void;
}

export function ProfileCompletionModal({ isOpen, onClose, onNavigateToDashboard }: ProfileCompletionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome to HireNestly!" showCloseButton={false}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-[#8C12AA]/10 rounded-full flex items-center justify-center mx-auto">
          <div className="w-8 h-8 bg-[#8C12AA] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">✓</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Account Created Successfully!</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your Google account has been linked successfully. To get the most out of HireNestly, 
            please complete your profile in the dashboard.
          </p>
        </div>
        
        <div className="pt-4">
          <Button 
            onClick={onNavigateToDashboard}
            className="w-full bg-[#8C12AA] hover:bg-[#8C12AA]/90 text-white font-medium py-2.5"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </Modal>
  );
}