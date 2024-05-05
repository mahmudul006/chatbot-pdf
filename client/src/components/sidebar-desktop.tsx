'use client';
import { Sidebar } from '@/components/sidebar';

// import { auth } from '@/auth'
import { ChatHistory } from '@/components/chat-history';
import { SidebarProvider, useSidebar } from '@/lib/hooks/use-sidebar';

export function SidebarDesktop() {
  const { isSidebarOpen, isLoading, toggleSidebar } = useSidebar() || {};
  // const session = await auth();

  // if (!session?.user?.id) {
  //   return null;
  // }

  return (
    <Sidebar
      className={`peer hidden -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0  lg:${
        isSidebarOpen ? 'flex' : ''
      } min-w-fit`}
    >
      {/* @ts-ignore */}
      {/* <ChatHistory userId={session.user.id} /> */}
      <div>hello world , world world world</div>
    </Sidebar>
  );
}
