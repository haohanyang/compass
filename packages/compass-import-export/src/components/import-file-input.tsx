import React, { useCallback } from 'react';
import { FileInput2 } from '@mongodb-js/compass-components';

type ImportFileInputProps = {
  autoOpen?: boolean;
  onCancel?: () => void;
  selectImportFile: (file: File) => void;
  file: File | null;
};

function ImportFileInput({
  autoOpen,
  onCancel,
  selectImportFile,
  file,
}: ImportFileInputProps) {
  const handleChooseFile = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        void selectImportFile(files[0]);
      } else if (typeof onCancel === 'function') {
        onCancel();
      }
    },
    [onCancel, selectImportFile]
  );

  const values = file ? [file] : undefined;

  return (
    <FileInput2
      autoOpen={autoOpen}
      label="Import file:"
      id="import-file"
      onChange={handleChooseFile}
      values={values}
      variant="small"
      mode="open"
      title="Select JSON or CSV to import"
      buttonLabel="Select"
    />
  );
}

export { ImportFileInput };
