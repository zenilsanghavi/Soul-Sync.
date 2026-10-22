import { MessageCircle, History, User, Settings, Smile, NotebookPen } from 'lucide-react';

// Navigation for signed-in pages, shared by the chat sidebar and AccountLayout
export const accountNav = [
  { to: '/dashboard', label: 'Chat', icon: MessageCircle },
  { to: '/mood', label: 'Mood', icon: Smile },
  { to: '/journal', label: 'Journal', icon: NotebookPen },
  { to: '/session-history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];
