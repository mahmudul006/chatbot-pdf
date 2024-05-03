import { SidebarProvider } from '@/lib/hooks/use-sidebar';
import { Chat } from './components/chat';

export const runtime = 'edge';

export default function Page() {
  return (
    <SidebarProvider>
      <Chat />
    </SidebarProvider>
  );
}
