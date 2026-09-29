import React, { useState } from 'react';
import {
  Hash,
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Smile,
  Plus,
  MoreVertical,
  Circle,
  AtSign,
  Bold,
  Italic,
  Code,
  Users
} from 'lucide-react';
import { Input, Button, Avatar, Badge, useToast } from '../components/ui';

export default function MessagesPage() {
  const [activeChannel, setActiveChannel] = useState('general');
  const [messageText, setMessageText] = useState('');
  const { addToast } = useToast();

  // Section 15 Channels: #general, #frontend, #backend, #bugs, #product-design
  const channels = [
    { id: 'general', name: 'general', desc: 'Workspace-wide announcements and team updates', unread: 0 },
    { id: 'frontend', name: 'frontend', desc: 'React, Vite, Tailwind UI, and client state discussions', unread: 2 },
    { id: 'backend', name: 'backend', desc: 'Express APIs, PostgreSQL queries, and caching architecture', unread: 0 },
    { id: 'bugs', name: 'bugs', desc: 'Active issue triage and regression reports', unread: 1 },
    { id: 'product-design', name: 'product-design', desc: 'Figma mockups and UX feedback discussions', unread: 0 },
  ];

  const directMessages = [
    { id: 'rahul', name: 'Rahul Sharma', status: 'online', role: 'Backend' },
    { id: 'priya', name: 'Priya Patel', status: 'away', role: 'Frontend' },
    { id: 'dhruv', name: 'Dhruv Mehta', status: 'online', role: 'Full Stack' },
    { id: 'sarah', name: 'Sarah Jenkins', status: 'offline', role: 'UI/UX' },
  ];

  const initialMessages = [
    {
      id: 1,
      sender: 'Rahul Sharma',
      time: '10:15 AM',
      text: 'Good morning team! The Stripe checkout webhooks and payment confirmation endpoints are live in staging.',
      reactions: ['🚀 3', '👍 2'],
    },
    {
      id: 2,
      sender: 'Priya Patel',
      time: '10:18 AM',
      text: 'Awesome! I updated the design tokens and completed the dark theme contrast verification on all buttons and modals.',
      reactions: ['✨ 4'],
    },
    {
      id: 3,
      sender: 'Aashish Lead',
      time: '10:22 AM',
      text: 'Great work team. Let\'s make sure we review the Kanban cards during our 2:00 PM sprint sync today.',
      reactions: ['🙌 5'],
    },
  ];

  const [messages, setMessages] = useState(initialMessages);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'Aashish (You)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: messageText,
      reactions: [],
    };

    setMessages([...messages, newMsg]);
    setMessageText('');
    addToast('Message posted (UI Simulation)', 'success');
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row bg-surface-900 border border-surface-800 rounded-3xl overflow-hidden shadow-card max-w-7xl mx-auto">
      {/* Channels & DM Sidebar (Left) */}
      <div className="w-full md:w-72 bg-surface-950 border-r border-surface-800 flex flex-col">
        {/* Search Header */}
        <div className="p-3.5 border-b border-surface-800">
          <Input
            placeholder="Search channels & DMs..."
            leftIcon={Search}
            className="text-xs"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Channels List */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Channels
              </span>
              <button
                onClick={() => addToast('Create channel modal is simulated for Phase 2', 'info')}
                className="text-slate-500 hover:text-white"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {channels.map((ch) => {
                const isSelected = activeChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-surface-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{ch.name}</span>
                    </div>

                    {ch.unread > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-500 text-white font-bold">
                        {ch.unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <div className="px-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Direct Messages
              </span>
            </div>

            <div className="space-y-1">
              {directMessages.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => addToast(`Opened direct chat with ${dm.name}`, 'info')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-surface-850 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Avatar name={dm.name} size="xs" status={dm.status} />
                    <span className="truncate">{dm.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{dm.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversation Area (Right) */}
      <div className="flex-1 flex flex-col bg-surface-900">
        {/* Channel Header */}
        <div className="h-16 px-6 border-b border-surface-800 flex items-center justify-between bg-surface-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-brand-400">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                #{activeChannel}
                <Badge variant="brand" size="xs">Channel</Badge>
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {channels.find((c) => c.id === activeChannel)?.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> 16 members
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3.5 group">
              <Avatar name={msg.sender} size="md" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-white">{msg.sender}</span>
                  <span className="text-[10px] text-slate-500">{msg.time}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed bg-surface-950/40 p-3 rounded-2xl border border-surface-800/80 inline-block max-w-2xl">
                  {msg.text}
                </p>

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {msg.reactions.map((r, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-surface-800/80 border border-surface-700 text-slate-300 select-none cursor-pointer hover:border-brand-500"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Composer Footer */}
        <div className="p-4 border-t border-surface-800 bg-surface-950/60">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 border border-surface-800 rounded-t-xl text-slate-400 text-xs">
              <button type="button" className="p-1 hover:text-white rounded" title="Bold">
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1 hover:text-white rounded" title="Italic">
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1 hover:text-white rounded" title="Code snippet">
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Message #${activeChannel}...`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-surface-900 border border-surface-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />

              <Button
                type="submit"
                size="sm"
                rightIcon={Send}
                disabled={!messageText.trim()}
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
