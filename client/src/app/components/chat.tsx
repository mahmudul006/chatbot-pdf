'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useChat } from "ai/react"
import { useRef, useEffect, useState } from 'react';

import { Bot, User } from 'lucide-react';
import { Box, Tooltip, Typography } from '@mui/material';
import { IconArrowElbow } from '@/components/ui/icons';
import Textarea from 'react-textarea-autosize';
import { useSidebar } from '@/lib/hooks/use-sidebar';
import React from 'react';
import useMediaQuery from '@mui/system/useMediaQuery';

import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import MenuIcon from '@mui/icons-material/Menu';
import FileUpload from '@/components/file-upload';

const drawerWidth = 200;
export function Chat() {
  // const { messages, input, handleInputChange, handleSubmit } = useChat({
  //     api: 'http://localhost:5000/chat',
  //     onError: (e) => {
  //         console.log(e)
  //     }
  // })
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<
    { id: string; role: string; content: string }[]
  >([]);
  // const { isSidebarOpen, isLoading, toggleSidebar } = useSidebar() || {};
  // console.log('is ', isSidebarOpen);
  const isMdUp = useMediaQuery('(min-width:900px)');
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // sendMessage(input)
    setMessages((prev) => [
      ...prev,
      { id: `${prev.length + 1}`, role: 'user', content: input },
    ]);
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
    setMessages((prev) => [
      ...prev,
      { id: `${prev.length + 1}`, role: 'bot', content: response },
    ]);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  const chatParent = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      domNode.scrollTop = domNode.scrollHeight;
    }
  });
  const UserChat = ({
    id,
    role,
    content,
  }: {
    id: string;
    role: string;
    content: string;
  }) => (
    <li key={id} className='flex flex-col space-y-1'>
      <div className='flex items-end space-x-2'>
        {role === 'user' ? <User size={30} /> : <Bot size={30} />}
        <p className='font-bold'>{role === 'user' ? 'You' : 'ChatPdf'}</p>
      </div>
      <div className='pl-10'>
        <p className='text-primary'>{content}</p>
      </div>
    </li>
  );

  return (
    <div className='flex'>
      <CssBaseline />

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
          },
          border: 'none',
        }}
        variant={isMdUp ? 'permanent' : 'temporary'}
        anchor='left'
        open={open}
        onClose={toggleDrawer}
      >
        {/* <Toolbar /> */}
        <FileUpload />
        {/* <Divider /> */}
        {/* <List>
          {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
        
        <List>
          {['All mail', 'Trash', 'Spam'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List> */}
      </Drawer>
      {/* <header className='p-4 w-full sticky border-b flex flex-row align-middle justify-center bg-background'>
        <button onClick={toggleSidebar}>toggle</button>
        <h1 className='text-2xl font-bold'>ChatPdf</h1>
      </header> */}
      <main
        className={`flex flex-col w-full h-screen max-h-dvh bg-background bg-muted/50 `}
      >
        <AppBar
          position='fixed'
          sx={{
            // zIndex: (theme) => theme.zIndex.drawer + 1,
            // boxShadow: '0 0 10px rgba(44, 62, 80, 0.5)',
            display: 'flex',
            justifyContent: 'start',
            alignItems: 'start',
            boxShadow: 'none',
            backgroundColor: 'unset',
            width: { md: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          <Toolbar>
            <IconButton
              color='default'
              aria-label='open drawer'
              edge='start'
              onClick={toggleDrawer}
              sx={{
                mr: 2,
                ...(isMdUp && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant='h6'
              noWrap
              sx={{
                fontFamily: 'cursive',
                fontWeight: 'bold',
                color: 'black',
                fontSize: '28px',
              }}
            >
              ChatPdf
            </Typography>
          </Toolbar>
        </AppBar>
        <section className='container px-4 pt-14  flex flex-col flex-grow gap-4 mx-auto max-w-3xl'>
          <ul
            ref={chatParent}
            className='h-1 flex-grow rounded-lg overflow-y-auto flex flex-col gap-8 pt-1'
            style={{ scrollbarWidth: 'none' }}
          >
            {messages.map((m, index) => (
              <div key={index}>
                <UserChat id={m.id} role={m.role} content={m.content} />
              </div>
            ))}
          </ul>
        </section>

        <section className='p-4 px-4'>
          <form
            onSubmit={handleSubmit}
            className='flex w-full max-w-3xl mx-auto items-center'
          >
            <div className='relative flex-1'>
              <Textarea
                className='border rounded min-h-[60px] w-full resize-none bg-transparent px-4 pr-16 py-[1.3rem] focus-within:outline-none sm:text-sm'
                placeholder='Type your question here...'
                value={input}
                onChange={handleInputChange}
              />
              <Tooltip title='Send' placement='top'>
                <Button
                  size='icon'
                  className='absolute bottom-[18px] right-4'
                  type='submit'
                >
                  <IconArrowElbow />
                </Button>
              </Tooltip>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
