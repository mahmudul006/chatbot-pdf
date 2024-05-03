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
  >([
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
  const { isSidebarOpen, isLoading, toggleSidebar } = useSidebar() || {};
  console.log('is ', isSidebarOpen);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // sendMessage(input)
    console.log('submit', e.target);
    const res = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: input }),
    });
    console.log(res);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <main className='flex flex-col w-full h-screen max-h-dvh bg-background bg-muted/50'>
      <header className='p-4 w-full sticky border-b flex flex-row align-middle justify-center bg-background'>
        <button onClick={toggleSidebar}>toggle</button>
        <Box>side: {isSidebarOpen}</Box>
        <h1 className='text-2xl font-bold'>ChatPdf</h1>
      </header>

      <section className='container px-0  flex flex-col flex-grow gap-4 mx-auto max-w-3xl'>
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

      <section className='p-4'>
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
  );
}
