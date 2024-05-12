'use client';
import React, { useRef, useState, useEffect } from 'react';
import InputBase from '@mui/material/InputBase';
import Container from '@mui/material/Container';
import {
  Box,
  alpha,
  Avatar,
  IconButton,
  Typography,
  InputAdornment,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { useMockedUser } from 'src/hooks/use-mocked-user';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

export function Chat() {
  const { user } = useMockedUser();
  const settings = useSettingsContext();
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const chatParent = useRef<HTMLUListElement>(null);

  const handleSubmit = async (
    e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setLoading(true);
    setMessages((prev) => [...prev, { id: String(prev.length + 1), role: 'user', content: input }]);
    setInput('');
    const res = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: input }),
    });
    const response = await res.json();
    if (res.ok) {
      setMessages((prev) => [
        ...prev,
        { id: `${prev.length + 1}`, role: 'bot', content: response },
      ]);
    }
    setLoading(false); // Set loading to false after receiving the response
  };

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      window.scrollBy(0, screen.height);
    }
  }, [messages]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {messages.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '70vh',
            textAlign: 'center',
          }}
        >
          <Avatar src="/assets/icons/walle.jpg" sx={{ width: 100, height: 100 }} />
          <Typography variant="h3">How can I help you today?</Typography>
        </Box>
      )}
      <Box
        ref={chatParent}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          mb: 4,
        }}
      >
        {messages.map((m, index) => (
          <Box
            key={m.id}
            sx={{ display: 'flex', flexDirection: 'column', mb: m.role === 'bot' ? 2 : 0 }}
          >
            {m.role === 'user' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src="/assets/icons/panda.png" />
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    You
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ ml: 6 }}>
                  {m.content}
                </Typography>
              </>
            )}
            {/* Show bot icon and text only if the message role is user */}
            {m.role === 'bot' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src="/assets/icons/walle.jpg" />
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    ChatBot
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ ml: 6 }}>
                  {m.content}
                </Typography>
              </>
            )}
          </Box>
        ))}
        {/* Display loader only when loading */}
        {loading && (
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2, ml: 4 }}
          >
            <CircularProgress size={20} color="primary" />
            {/* <LinearProgress color="primary" /> */}
          </Box>
        )}
      </Box>

      <Box>
        <InputBase
          multiline
          fullWidth
          maxRows={4}
          placeholder="Message ChatBot"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
