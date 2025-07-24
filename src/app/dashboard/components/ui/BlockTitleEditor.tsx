'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockTitleEditorProps {
  title: string;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
  isEditing: boolean;
  className?: string;
}

export function BlockTitleEditor({ title, onSave, onCancel, isEditing, className }: BlockTitleEditorProps) {
  const [editTitle, setEditTitle] = useState(title);
  const [isLocalEditing, setIsLocalEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  useEffect(() => {
    if (isLocalEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isLocalEditing]);

  const handleStartEdit = () => {
    setIsLocalEditing(true);
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== title) {
      onSave(editTitle.trim());
    }
    setIsLocalEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(title);
    setIsLocalEditing(false);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return <div className={cn('text-sm font-medium text-gray-900 truncate', className)}>{title}</div>;
  }

  if (isLocalEditing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm px-2 py-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Enter title..."
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700 bg-green-50"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 bg-red-50"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 group', className)}>
      <div className="text-sm font-medium text-gray-900 truncate flex-1">{title}</div>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleStartEdit}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
      >
        <Edit3 className="w-3 h-3" />
      </Button>
    </div>
  );
}
