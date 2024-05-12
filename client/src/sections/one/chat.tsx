'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
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
import { promises } from 'dns';

export function Chat() {
  const speechToTextSocket = useRef(new WebSocket('ws://localhost:8000/speechtotext'));

  const { user } = useMockedUser();
  const settings = useSettingsContext();
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const chatParent = useRef<HTMLUListElement>(null);


  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const mrRef = useRef(mediaRecorder);
  // State to track whether recording is currently in progress
  const [micOn, setMicOn] = useState<boolean>(false);
  const micOnRef = useRef(micOn);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);
  const audioLoadRef = useRef(audioLoading);
  const currentMessageIdRef = useRef('0');

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

  const handleMic = async () => {
    console.log(micOn);
    mrRef.current = mediaRecorder;
    if (micOn) {
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
    } else if (mediaRecorder) {
      setWebSocketEvent();


      currentMessageIdRef.current = String(messages.length + 1);
      mediaRecorder.start();
      const id1 = setInterval(() => {
        console.log(mediaRecorder);
        if (mediaRecorder && !audioLoadRef?.current && micOnRef?.current) {
          mediaRecorder.requestData();
        }
        if (!micOnRef?.current) {
          clearInterval(id1);
        }
      }, 2000)
    }
    micOnRef.current = !micOn;
    setMicOn(!micOn);
  };

  const setWebSocketEvent = () => {
    speechToTextSocket.current = new WebSocket('ws://localhost:8000/speechtotext');

    speechToTextSocket.current.onmessage = (event) => {
      const data = event.data;
      console.log('Received data:');
      audioLoadRef.current = false;
      setAudioLoading(false);
      setMessages((prev) => prev.find(m => m.id === currentMessageIdRef.current) ?
        prev.map(msg => msg.id === currentMessageIdRef.current ? {...msg, content: data} : msg) :
        [
          ...prev,
          { id: currentMessageIdRef.current, role: 'user', content: data },
        ]
      );
    };
  }

  const getText = (audioBlob: Blob) => {
    audioLoadRef.current = true;
    setAudioLoading(true);
    const reader = new FileReader();
    reader.onload = function () {
      const base64data = reader?.result?.split(",")[1];
      fetch('http://localhost:8000/api/speechtotext', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blob: base64data }),
      }).then(
        res => {
          audioLoadRef.current = false;
          setAudioLoading(false);
          console.log(res);
          if (res && res.ok) {
            const response = res.json();
            response.then(jsonResult => {
              setMessages((prev) => prev.find(m => m.id === currentMessageIdRef.current) ?
                prev.map(msg => msg.id === currentMessageIdRef.current ? {...msg, content: jsonResult} : msg) :
                [
                  ...prev,
                  { id: currentMessageIdRef.current, role: 'user', content: jsonResult },
                ]
              );
            });
          }
        }
      );
    };
    reader.readAsDataURL(audioBlob);

  };

  const blobToBase64 = (audioBlob: Blob): Promise<string> => new Promise((resolve) => {
    audioLoadRef.current = true;
    setAudioLoading(true);
    const reader = new FileReader();
    reader.onload = function () {
      const base64data = reader?.result?.split(",")[1];
      resolve(base64data);
    };
    reader.readAsDataURL(audioBlob);
  });

  // Ref to store audio chunks during recording
  const chunks = useRef([]);

  const initMediaRecorder = useCallback(() => {
    if (navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const recorder = new MediaRecorder(stream);
          setMediaRecorder(recorder);
          recorder.onstart = () => {
            chunks.current = []; // Resetting chunks array
          };
          recorder.ondataavailable = (ev) => {
            chunks.current.push(ev.data);// Handle data available during recording
            console.log(chunks);
            if (!audioLoadRef?.current) {
              const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
              console.log("AudioBlob -> text");
              getText(audioBlob);
            }
          };
          recorder.onstop = () => {
            // Handle recording stopped
              if (!audioLoadRef?.current) {
                const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
                console.log("AudioBlob -> stop");
                getText(audioBlob);
                chunks.current = [];
              }
              else {
                const id2 = setInterval(() => {
                  if (!audioLoadRef?.current && chunks.current.length > 0) {
                    const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
                    console.log("AudioBlob stop");
                    getText(audioBlob);
                    chunks.current = [];
                    clearInterval(id2);
                  }
                }, 2000)
              }
          };
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
        });
    } else {
      console.error('getUserMedia not supported');
    }
  }, []);

  const initMediaRecorderWithSocket = useCallback(() => {
    if (navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // if (micOn) {
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const recorder = new MediaRecorder(stream);
          setMediaRecorder(recorder);

          recorder.onstart = () => {
            chunks.current = []; // Resetting chunks array
          };
          recorder.ondataavailable = (ev) => {
            chunks.current.push(ev.data);// Handle data available during recording
            console.log(chunks);
            if (!audioLoadRef?.current && micOnRef?.current) {
              const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
              console.log("AudioBlob -> text");
              blobToBase64(audioBlob).then(base64 => {
                setWebSocketEvent();
                speechToTextSocket.current.onopen = () => {
                  speechToTextSocket.current.send(base64);
                };
              });
            }
          };
          recorder.onstop = () => {
            // Handle recording stopped
              if (!audioLoadRef?.current) {
                const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
                console.log("AudioBlob -> stop");
                blobToBase64(audioBlob).then(base64 => {
                  setWebSocketEvent();
                  speechToTextSocket.current.onopen = () => {
                    speechToTextSocket.current.send(base64);
                  };
                });
                chunks.current = [];
              }
              else {
                const id2 = setInterval(() => {
                  if (!audioLoadRef?.current && chunks.current.length > 0) {
                    const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
                    console.log("AudioBlob stop");
                    blobToBase64(audioBlob).then(base64 => {
                      setWebSocketEvent();
                      speechToTextSocket.current.onopen = () => {
                        speechToTextSocket.current.send(base64);
                      };
                    });
                    chunks.current = [];
                    clearInterval(id2);
                  }
                }, 2000)
              }
          };
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
        });
      // }
    } else {
      console.error('getUserMedia not supported');
    }
  }, []);

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      window.scrollBy(0, screen.height);
    }
    initMediaRecorderWithSocket();
  }, [messages, initMediaRecorderWithSocket]);

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
          <Avatar src="/assets/icons/bot.jpg" sx={{ width: 100, height: 100 }} />
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
                  <Avatar src={user?.photoURL} />
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
                  <Avatar src="/assets/icons/bot.jpg" />
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
          placeholder="Message ChatBot hrs"
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
              <IconButton size="small" onClick={handleMic} disabled={!micOn && audioLoading}>
                <Iconify icon="material-symbols:mic-outline" color={micOn ? 'red' : 'blue'}/>
              </IconButton>
            </InputAdornment>
          }
        />
      </Box>
    </Container>
  );
}
