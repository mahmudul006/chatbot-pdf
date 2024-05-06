import { useState, useCallback } from 'react';
import MenuItem from '@mui/material/MenuItem';
import ButtonBase from '@mui/material/ButtonBase';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export default function FileDataActivity() {
  const popover = usePopover();

  const [currentModel, setCurrentModel] = useState('mixtral-8x7b-32768');
  const models = ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'];

  const handleChangeSeries = useCallback(
    async (newValue: string) => {
      popover.onClose();

      const res = await fetch('http://localhost:8000/api/changemodel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: newValue }),
      });
      const response = await res.json();
      setCurrentModel(newValue);
    },
    [popover]
  );

  return (
    <>
      <ButtonBase
        onClick={popover.onOpen}
        sx={{
          pl: 2,
          py: 1,
          pr: 1,
          borderRadius: 1,
          typography: 'subtitle2',
          backgroundColor: (theme) => theme.palette.grey[400],
        }}
      >
        {currentModel}

        <Iconify
          width={16}
          icon={popover.open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
          sx={{ ml: 0.5 }}
        />
      </ButtonBase>

      <CustomPopover open={popover.open} onClose={popover.onClose} sx={{ width: 190 }}>
        {models.map((option) => (
          <MenuItem
            key={option}
            selected={option === currentModel}
            onClick={() => handleChangeSeries(option)}
          >
            {option}
          </MenuItem>
        ))}
      </CustomPopover>
    </>
  );
}
