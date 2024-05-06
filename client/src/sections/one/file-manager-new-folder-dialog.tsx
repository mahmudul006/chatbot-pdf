import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Dialog, { DialogProps } from '@mui/material/Dialog';

import Iconify from 'src/components/iconify';
import { Upload } from 'src/components/upload';

// ----------------------------------------------------------------------

interface Props extends DialogProps {
  title?: string;
  //
  onCreate?: VoidFunction;
  onUpdate?: VoidFunction;
  //
  folderName?: string;
  onChangeFolderName?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  //
  open: boolean;
  onClose: VoidFunction;
}

export default function FileManagerNewFolderDialog({
  title = 'Upload Files',
  open,
  onClose,
  //
  onCreate,
  onUpdate,
  //
  folderName,
  onChangeFolderName,
  ...other
}: Props) {
  const [files, setFiles] = useState<(File | string)[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      setFiles([]);
    }
  }, [open]);

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setFiles([...files, ...newFiles]);
    },
    [files]
  );

  const handleUpload = async () => {
    // onClose();
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    setIsUploading(true);

    const fileUpload = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        access_control_allow_origin: '*',
      },
    });
    if (fileUpload.ok) {
      setIsUploading(false);
      onClose();
      console.log('Files uploaded successfully');
      // console.log(await fileUpload.json());
      const res = await fileUpload.json();
      console.log(res);
      localStorage.setItem('collectionName', JSON.stringify(res.collection_name));
      // setSelectedFiles([]);
    }
    console.info('ON UPLOAD');
  };

  const handleRemoveFile = (inputFile: File | string) => {
    const filtered = files.filter((file) => file !== inputFile);
    setFiles(filtered);
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose} {...other}>
      <DialogTitle sx={{ p: (theme) => theme.spacing(3, 3, 2, 3) }}> {title} </DialogTitle>

      <DialogContent
        dividers
        sx={{
          pt: 1,
          pb: 0,
          border: 'none',
          position: 'relative',
          pointerEvents: isUploading ? 'none' : 'auto',
        }}
        // aria-disabled={isUploading}
      >
        <Upload multiple files={files} onDrop={handleDrop} onRemove={handleRemoveFile} />
        {isUploading && (
          <CircularProgress
            variant="indeterminate"
            value={100}
            size={100}
            thickness={5}
            sx={{
              color: 'grey.900',
              opacity: 0.48,
              position: 'absolute',
              top: 'calc(50% - 50px)',
              left: 'calc(50% - 50px)',
              zIndex: 9,
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:cloud-upload-fill" />}
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
        >
          Upload
        </Button>

        {!!files.length && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleRemoveAllFiles}
            disabled={isUploading}
          >
            Remove all
          </Button>
        )}

        {(onCreate || onUpdate) && (
          <Stack direction="row" justifyContent="flex-end" flexGrow={1}>
            <Button variant="soft" onClick={onCreate || onUpdate}>
              {onUpdate ? 'Save' : 'Create'}
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
}
