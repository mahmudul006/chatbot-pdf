'use client';

// import FileUpload from '@/components/file-upload';
import React, { useRef, useState, useEffect } from 'react';

import InputBase from '@mui/material/InputBase';
// import { Button } from '@/components/ui/button';
import Container from '@mui/material/Container';
import useMediaQuery from '@mui/material/useMediaQuery';
// import { useSidebar } from '@/lib/hooks/use-sidebar';
import { Box, alpha, Avatar, IconButton, Typography, InputAdornment } from '@mui/material';

import { useMockedUser } from 'src/hooks/use-mocked-user';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

export function Chat() {
  const { user } = useMockedUser();
  const settings = useSettingsContext();
  // const { messages, input, handleInputChange, handleSubmit } = useChat({
  //     api: 'http://localhost:5000/chat',
  //     onError: (e) => {
  //         console.log(e)
  //     }
  // })
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([
    { id: '1', role: 'user', content: 'Hello' },
    { id: '2', role: 'bot', content: 'Hi! How can I help you?' },
    { id: '3', role: 'user', content: 'I need help' },
    { id: '4', role: 'bot', content: 'Sure! What do you need help with?' },
    { id: '5', role: 'user', content: 'I need help' },
    { id: '6', role: 'bot', content: 'Sure! What do you need help with?' },
    {
      id: '7',
      role: 'user',
      content:
        'I need help I need help I need help I need help I need help I need help I need help I need help I need help I need help',
    },
    { id: '8', role: 'bot', content: 'Sure! What do you need help with?' },
    { id: '9', role: 'user', content: 'I need help' },
    {
      id: '10',
      role: 'bot',
      content:
        'Sure! What do you need help with adawda?, sure Sure! What do you need help with adawda?, Sure! What do you need help with adawda?, Sure! What do you need help with adawda?, ',
    },
    { id: '11', role: 'user', content: 'I need no help' },
    { id: '12', role: 'bot', content: 'Sure! What do you need help with?' },
  ]);
  // const { isSidebarOpen, isLoading, toggleSidebar } = useSidebar() || {};
  // console.log('is ', isSidebarOpen);
  const isMdUp = useMediaQuery('(min-width:900px)');

  const [open, setOpen] = React.useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };
  const handleSubmit = async (
    e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    // if (messagesContainerRef.current) {
    //   messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    // }
    setMessages((prev) => [...prev, { id: String(prev.length + 1), role: 'user', content: input }]);
    setInput('');
    console.log('submit', e.target);
    const res = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: input }),
    });
    const response = await res.json();
    setMessages((prev) => [...prev, { id: `${prev.length + 1}`, role: 'bot', content: response }]);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const chatParent = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      window.scrollBy(0, screen.height);
    }
  }, [messages]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Box
        ref={chatParent}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          mb: 4,
        }}
      >
        {messages.map((m, index) => (
          <Box key={m.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {m.role === 'user' ? (
                <Avatar src={user?.photoURL} />
              ) : (
                <Avatar src="/assets/icons/bot.jpg">{/* <SmartToyOutlined /> */}</Avatar>
              )}
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {m.role === 'user' ? 'You' : 'ChatBot'}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ ml: 6 }}>
              {m.content}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box>
        <InputBase
          multiline
          fullWidth
          // rows={1}
          maxRows={4}
          placeholder="Message ChatBot"
          value={input}
          onChange={handleInputChange}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 1,
            border: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.2)}`,
            position: 'fixed',
            bottom: 0,
            width: { xs: '95%', lg: '70%', xl: '60%' },
            backgroundColor: (theme) => theme.palette.grey[200],
            zIndex: 10,
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          endAdornment={
            <InputAdornment position="end" sx={{ mr: 1 }}>
              <IconButton size="small" onClick={handleSubmit} disabled={input === ''}>
                <Iconify icon="iconamoon:send-fill" />
              </IconButton>
            </InputAdornment>
          }
        />
      </Box>
    </Container>
  );
}
