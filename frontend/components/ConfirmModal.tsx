"use client";

import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode; 
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmLabel, 
  onConfirm, 
  onCancel 
}: ConfirmModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-[#121212] p-8 rounded-3xl border border-zinc-800 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Ikon és cím */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
        </div>

        {/* Üzenet */}
        <div className="text-zinc-400 text-sm mb-8 text-center leading-relaxed">
          {message}
        </div>

        {/* Gombok */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm} 
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
          >
            {confirmLabel}
          </button>
          <button 
            onClick={onCancel} 
            className="w-full py-3 text-zinc-500 font-bold rounded-xl hover:bg-zinc-900 transition-colors"
          >
            Mégse
          </button>
        </div>
      </div>
    </div>
  );
}
