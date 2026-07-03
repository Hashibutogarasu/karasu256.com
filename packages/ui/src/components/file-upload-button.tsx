'use client';

import * as React from 'react';
import { Upload } from 'lucide-react';

import { Button } from './button';
import { Spinner } from './ui/spinner';

export interface FileUploadButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick' | 'onChange' | 'children'> {
  label: string;
  loadingLabel: string;
  loading?: boolean;
  accept?: string;
  onFileSelected: (file: File) => void;
}

/**
 * Button that opens a hidden file picker and reports the chosen file via
 * `onFileSelected`. Mirrors the icon-to-spinner loading convention of
 * `DeleteIconButton`, replacing the upload icon and `label` with a spinner
 * and `loadingLabel` while `loading` is true. Text is passed in as props so
 * this component stays i18n-agnostic.
 */
function FileUploadButton({
  label,
  loadingLabel,
  loading,
  accept,
  onFileSelected,
  disabled,
  type = 'button',
  variant = 'outline',
  size = 'sm',
  ...props
}: FileUploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onFileSelected(file);
  }

  return (
    <>
      <Button type={type} variant={variant} size={size} disabled={loading || disabled} onClick={() => fileInputRef.current?.click()} {...props}>
        {loading ? <Spinner /> : <Upload />}
        {loading ? loadingLabel : label}
      </Button>
      <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </>
  );
}

export { FileUploadButton };
