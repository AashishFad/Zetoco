import React, { useState } from 'react';
import {
  Hash,
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Smile,
  Users,
  MoreVertical,
  Circle
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export default function MessagesPage() {
  const [activeChannel, setActiveChannel] = useState('frontend');
  const [messageInput, setMessageInput] = useState('');
  const { addToast } = useToast();

  const channels = [
    { id: 'general', name: 'general', description: 'Company-wide announcements and team updates', unread: 0 },
    { id: 'frontend', name: 'frontend', description: 'React, Tailwind, UI/UX discussion and design reviews', unread: 2 },
    { id: 'backend', name: 'backend', description: 'Express API architecture, PostgreSQL queries, and schemas', unread: 0 },
    { id: 'bugs', name: 'bugs', description: 'Issue reporting and defect tracking triage', unread: 1 },
    { id: 'product-launches', name: 'product-launches', description: 'Sprint release coordination', unread: 0 },
  ];

  const directMessages = [
    { name: 'Rahul Sharma', status: 'online', role: 'Backend Lead' },
    { name: 'Priya Kapoor', status: 'away', role: 'UI Engineer' },
    { name: 'Dhruv Mehta', status: 'busy', role: 'DevOps' },
  ];

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Rahul Sharma',
      avatarStatus: 'online',
      time: '10:42 AM',
      text: 'Phase 1 Express backend & PostgreSQL pool are set up and passing health tests!',
    },
    {
      id: 2,
      sender: 'Priya Kapoor',
      avatarStatus: 'away',
      time: '10:45 AM',
      text: 'Awesome! I have verified the Tailwind design tokens, typography, and reusable UI components.',
    },
    {
      id: 3,
      sender: 'Aashish Fad',
      avatarStatus: 'online',
      time: '10:48 AM',
      text: 'Great work team. The recruiter portfolio demo shell is coming together smoothly.',
    },
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'Aashish Fad',
      avatarStatus: 'online',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: messageInput,
    };

    setMessages([...messages, newMsg]);
    setMessageInput('');
    addToast({
      title: 'Message Posted (Demo)',
      message: 'Message added to local conversation stream.',
      type: 'success',
    });
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] rounded-2xl bg-dark-900 border border-slate-800 flex overflow-hidden shadow-card-subtle">
      {/* Channels Sidebar (Left) */}
      <div className="w-64 border-r border-slate-800 bg-slate-950/60 flex flex-col hidden sm:flex">
        {/* Search */}
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 p-3 space-y-4 overflow-y-auto">
          <div>
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Channels
            </p>
            <div className="space-y-1">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    activeChannel === ch.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" />
                    <span>{ch.name}</span>
                  </div>
                  {ch.unread > 0 && (
                    <span className="w-4 h-4 rounded-full bg-brand-500 text-[10px] text-white flex items-center justify-center font-bold">
                      {ch.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Messages List */}
          <div>
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Direct Messages
            </p>
            <div className="space-y-1">
              {directMessages.map((dm) => (
                <button
                  key={dm.name}
                  onClick={() =>
                    addToast({
                      title: `Direct Chat with ${dm.name}`,
                      message: 'Direct chat shell is active.',
                      type: 'info',
                    })
                  }
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Avatar name={dm.name} status={dm.status} size="xs" />
                  <span className="truncate">{dm.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 flex flex-col bg-dark-900">
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">{activeChannel}</h2>
            <span className="text-xs text-slate-500 hidden md:inline">•</span>
            <span className="text-xs text-slate-400 hidden md:inline truncate max-w-sm">
              {channels.find((c) => c.id === activeChannel)?.description}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users className="w-4 h-4 text-slate-400" />
            <span>6 members</span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 text-xs group">
              <Avatar name={msg.sender} status={msg.avatarStatus} size="sm" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{msg.sender}</span>
                  <span className="text-[10px] text-slate-500">{msg.time}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800/80 text-slate-200 max-w-2xl leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Composer */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
            <input
              type="text"
              placeholder={`Message #${activeChannel}...`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />

            <button
              type="submit"
              className="p-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
