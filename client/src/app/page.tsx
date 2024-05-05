import { SidebarProvider } from '@/lib/hooks/use-sidebar';
import { Chat } from './components/chat';
import App from './components/app';

export const runtime = 'edge';

export default function Page() {
  return <Chat />;
}
