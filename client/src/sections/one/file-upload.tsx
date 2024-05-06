import React, { useState, ChangeEvent } from 'react';

import { Box, Stack, Container, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import { UploadBox } from 'src/components/upload';

import FileManagerNewFolderDialog from './file-manager-new-folder-dialog';

export default function MultiplePdfUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const upload = useBoolean();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Filter out files that are already selected
      const newFiles = files.filter(
        (file) =>
          !selectedFiles.some(
            (selectedFile) => selectedFile.name === file.name && selectedFile.size === file.size
          )
      );
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    console.log(selectedFiles);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    const fileUpload = await fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (fileUpload.ok) {
      console.log('Files uploaded successfully');
      // console.log(await fileUpload.json());
      const res = await fileUpload.json();
      console.log(res);
      localStorage.setItem('collectionName', JSON.stringify(res.collection_name));
      // setSelectedFiles([]);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        // variant="contained"
        // startIcon={<Iconify icon="eva:cloud-upload-fill" />}
        onClick={upload.onTrue}
      >
        <UploadBox
          // onDrop={handleDrop}
          placeholder={
            <Stack spacing={0.5} alignItems="center" sx={{ color: 'text.disabled' }}>
              <Iconify icon="eva:cloud-upload-fill" width={40} />
              <Typography variant="body2">Upload file</Typography>
            </Stack>
          }
          sx={{
            mb: 3,
            py: 2.5,
            width: 'auto',
            height: 'auto',
            borderRadius: 1.5,
          }}
        />
      </Box>
      <FileManagerNewFolderDialog open={upload.value} onClose={upload.onFalse} />
      {/* <Box
        mt={4}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <label htmlFor="pdf-upload">
          <Card
            component="label" // Use component='label' to make the Card behave like a label
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              px: 4,
              py: 2,
              cursor: 'pointer', // Add cursor pointer to indicate clickable
            }}
            className="bg-muted/50"
          >
            <input
              accept="application/pdf"
              id="pdf-upload"
              multiple
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <CloudUploadIcon sx={{ color: 'grey', fontSize: 32 }} />
          </Card>
        </label>
        <Box mt={2}>
          <ul>
            {selectedFiles.map((file, index) => (
              <li
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    overflow: 'hidden',
                    border: '1px solid grey',
                    borderRadius: '10px',
                    maxWidth: '220px',
                  }}
                >
                  <Typography
                    variant="body1"
                    noWrap
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '220px',
                    }}
                  >
                    {file.name}
                  </Typography>
                </Box>
                <IconButton onClick={() => handleRemoveFile(index)} size="small">
                  <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
              </li>
            ))}
          </ul>
        </Box>
        <Button
          variant="contained"
          color="inherit"
          disabled={selectedFiles.length === 0}
          onClick={handleUpload}
          sx={{ mt: 2 }}
        >
          Upload
        </Button>
      </Box> */}
    </Container>
  );
}
