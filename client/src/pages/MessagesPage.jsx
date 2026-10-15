import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Hash,
  MessageSquare,
  Search,
  Send,
  Plus,
  MoreVertical,
  Circle,
  Users,
  Building,
  Trash2,
  Edit2,
  Check,
  X,
  Folder,
  ArrowLeft,
  Calendar,
  Info,
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import {
  Input,
  Button,
  Avatar,
  Badge,
  Card,
  Dropdown,
  DropdownItem,
  useToast
} from '../components/ui';
import CreateChannelModal from '../components/modals/CreateChannelModal';
import CreateOrganizationModal from '../components/modals/CreateOrganizationModal';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import {
  getChannels,
  getChannelMessages,
  sendChannelMessage,
  updateMessage,
  deleteMessage,
  deleteChannel
} from '../services/channelService';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';

export default function MessagesPage() {
  const { currentOrganization, members, currentRole, can, loading: orgLoading } = useOrganization();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Mobile sidebar toggle
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);

  // New message notification indicator while scrolled up
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const isNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    const threshold = 150;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setHasUnreadBelow(false);
  };

  const handleScroll = () => {
    if (isNearBottom()) {
      setHasUnreadBelow(false);
    }
  };

  // 1. Realtime Subscriptions Handlers
  const handleRealtimeInsert = useCallback((newMsg) => {
    setMessages((prev) => {
      // Deduplicate: check if message ID already exists
      if (prev.some((m) => m.id === newMsg.id)) {
        return prev;
      }

      // Append and keep chronologically sorted by createdAt
      const updated = [...prev, newMsg].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return updated;
    });

    if (isNearBottom()) {
      setTimeout(() => scrollToBottom(true), 50);
    } else {
      setHasUnreadBelow(true);
    }
  }, []);

  const handleRealtimeUpdate = useCallback((updatedPayload) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === updatedPayload.id
          ? {
              ...m,
              content: updatedPayload.content,
              updatedAt: updatedPayload.updatedAt || updatedPayload.updated_at || new Date().toISOString(),
            }
          : m
      )
    );
  }, []);

  const handleRealtimeDelete = useCallback((deletedId) => {
    setMessages((prev) => prev.filter((m) => m.id !== deletedId));
  }, []);

  // Hook up Supabase Realtime for the active channel
  const { status: connectionStatus, isConnected, isConnecting, reconnect } = useRealtimeMessages(
    activeChannelId,
    {
      onInsert: handleRealtimeInsert,
      onUpdate: handleRealtimeUpdate,
      onDelete: handleRealtimeDelete,
    }
  );

  // 2. Load Channels for Active Organization
  const loadChannels = async (selectChannelId = null) => {
    if (!currentOrganization?.id) {
      setChannels([]);
      setActiveChannelId(null);
      setLoadingChannels(false);
      return;
    }

    setLoadingChannels(true);
    const channelList = await getChannels(currentOrganization.id);
    setChannels(channelList);
    setLoadingChannels(false);

    if (channelList.length > 0) {
      if (selectChannelId && channelList.some((c) => c.id === selectChannelId)) {
        setActiveChannelId(selectChannelId);
      } else if (!activeChannelId || !channelList.some((c) => c.id === activeChannelId)) {
        // Default to #general or first channel
        const general = channelList.find((c) => c.name === 'general' || c.type === 'general');
        setActiveChannelId(general ? general.id : channelList[0].id);
      }
    } else {
      setActiveChannelId(null);
    }
  };

  useEffect(() => {
    loadChannels();
  }, [currentOrganization?.id]);

  // 3. Load Messages for Active Channel
  const loadMessages = async (channelId) => {
    if (!channelId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const msgList = await getChannelMessages(channelId);
    setMessages(msgList);
    setLoadingMessages(false);
    setTimeout(() => scrollToBottom(false), 50);
  };

  useEffect(() => {
    if (activeChannelId) {
      loadMessages(activeChannelId);
    } else {
      setMessages([]);
    }
  }, [activeChannelId]);

  // Handle Send Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const content = messageText.trim();
    if (!content || !activeChannelId || sending) return;

    setSending(true);
    const res = await sendChannelMessage(activeChannelId, content, user?.id);
    setSending(false);

    if (res.success && res.message) {
      // Reconcile and add optimistically if not already added by Realtime
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });
      setMessageText('');
      setTimeout(() => scrollToBottom(true), 50);
    } else {
      addToast(res.error || 'Failed to post message', 'error');
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle Edit Message
  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (msgId) => {
    if (!editContent.trim()) return;

    const res = await updateMessage(msgId, editContent.trim());
    if (res.success && res.message) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, content: res.message.content, updatedAt: res.message.updatedAt }
            : m
        )
      );
      setEditingMessageId(null);
      setEditContent('');
      addToast('Message updated', 'success');
    } else {
      addToast(res.error || 'Failed to update message', 'error');
    }
  };

  // Handle Delete Message
  const handleDeleteMessage = async (msgId) => {
    const res = await deleteMessage(msgId);
    if (res.success) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      addToast('Message deleted', 'success');
    } else {
      addToast(res.error || 'Failed to delete message', 'error');
    }
  };

  // Handle Delete Channel
  const handleDeleteChannel = async (channel) => {
    if (channel.type === 'general' || channel.name === 'general') {
      addToast('The default #general channel cannot be deleted', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the channel #${channel.name}?`)) {
      return;
    }

    const res = await deleteChannel(channel.id);
    if (res.success) {
      addToast(`Channel #${channel.name} deleted`, 'success');
      loadChannels();
    } else {
      addToast(res.error || 'Failed to delete channel', 'error');
    }
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // Filter channels & members for search
  const filteredChannels = channels.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const generalChannels = filteredChannels.filter((c) => c.type === 'general' || c.name === 'general');
  const projectChannels = filteredChannels.filter((c) => c.type === 'project' || !!c.projectId);
  const customChannels = filteredChannels.filter((c) => c.type === 'custom' && !c.projectId && c.name !== 'general');

  // Direct Message team members
  const directTeamMembers = members.filter(
    (m) =>
      m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentOrganization && !orgLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4">
          <Building className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">No Organization Selected</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please select or create an organization to access real-time communication channels and team discussions.
        </p>
        <div className="pt-4">
          <Button onClick={() => setIsCreateOrgOpen(true)} leftIcon={Building}>
            Create Organization
          </Button>
        </div>
        <CreateOrganizationModal isOpen={isCreateOrgOpen} onClose={() => setIsCreateOrgOpen(false)} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row bg-[#111114] border border-[#292930] rounded-xl overflow-hidden shadow-sm max-w-7xl mx-auto">
      {/* Channels Sidebar (Left) */}
      <div
        className={`${
          mobileShowSidebar ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-[#0B0B0E] border-r border-[#1F1F24] shrink-0 h-full`}
      >
        {/* Search Header */}
        <div className="p-3 border-b border-[#1F1F24]">
          <Input
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={Search}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
          {/* General Channels */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[10px] font-medium text-[#71717A] uppercase tracking-wider">
                Channels
              </span>
              <button
                onClick={() => setIsCreateChannelOpen(true)}
                className="text-[#71717A] hover:text-[#F5F5F7] p-1 rounded transition-colors"
                title="Create New Channel"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {generalChannels.map((ch) => {
                const isSelected = activeChannelId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannelId(ch.id);
                      setMobileShowSidebar(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                        : 'text-[#71717A] hover:text-[#F5F5F7] hover:bg-[#17171C]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-[#71717A]'}`} />
                      <span className="truncate">{ch.name}</span>
                    </div>
                  </button>
                );
              })}

              {customChannels.map((ch) => {
                const isSelected = activeChannelId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannelId(ch.id);
                      setMobileShowSidebar(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                        : 'text-[#71717A] hover:text-[#F5F5F7] hover:bg-[#17171C]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-[#71717A]'}`} />
                      <span className="truncate">{ch.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Channels */}
          {projectChannels.length > 0 && (
            <div>
              <div className="px-2 mb-1.5">
                <span className="text-[10px] font-medium text-[#71717A] uppercase tracking-wider">
                  Projects
                </span>
              </div>

              <div className="space-y-0.5">
                {projectChannels.map((ch) => {
                  const isSelected = activeChannelId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setActiveChannelId(ch.id);
                        setMobileShowSidebar(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                          : 'text-[#71717A] hover:text-[#F5F5F7] hover:bg-[#17171C]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-[#71717A]'}`} />
                        <span className="truncate">{ch.name}</span>
                      </div>
                      {ch.projectName && (
                        <span className="text-[10px] text-[#71717A] truncate max-w-[70px]">
                          {ch.projectName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Workspace Team Directory */}
          <div>
            <div className="px-2 mb-1.5">
              <span className="text-[10px] font-medium text-[#71717A] uppercase tracking-wider">
                Team ({directTeamMembers.length})
              </span>
            </div>

            <div className="space-y-0.5">
              {directTeamMembers.map((m) => {
                const isCurrent = m.user_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-[#71717A] hover:bg-[#17171C]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Avatar name={m.full_name} size="xs" status="online" />
                      <span className="truncate font-normal text-[#A1A1AA]">
                        {m.full_name} {isCurrent && '(You)'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#71717A] font-normal">
                      {m.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversation Area (Right) */}
      <div
        className={`${
          !mobileShowSidebar ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col bg-[#111114] h-full overflow-hidden relative`}
      >
        {/* Channel Header */}
        {activeChannel ? (
          <div className="h-14 px-4 sm:px-6 border-b border-[#1F1F24] flex items-center justify-between bg-[#0B0B0E] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button for mobile */}
              <button
                onClick={() => setMobileShowSidebar(true)}
                className="md:hidden p-1.5 rounded-md text-[#71717A] hover:text-[#F5F5F7] bg-[#17171C]"
                title="Back to channels"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="w-7 h-7 rounded-md bg-[#17171C] flex items-center justify-center text-indigo-400 shrink-0">
                {activeChannel.type === 'project' ? (
                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Hash className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#F5F5F7] flex items-center gap-2 truncate">
                  <span>#{activeChannel.name}</span>
                  <Badge variant={activeChannel.type === 'project' ? 'brand' : 'neutral'} size="xs">
                    {activeChannel.type}
                  </Badge>

                  {/* Supabase Realtime Live Indicator */}
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  ) : isConnecting ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    <button
                      onClick={reconnect}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#17171C] text-[#71717A] hover:text-[#F5F5F7] border border-[#1F1F24] transition-colors"
                      title="Click to reconnect Realtime stream"
                    >
                      <WifiOff className="w-2.5 h-2.5 text-[#71717A]" />
                      Reconnect
                    </button>
                  )}
                </h3>
                <p className="text-[11px] text-[#71717A] truncate max-w-md">
                  {activeChannel.description || 'Workspace communication channel'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#71717A] shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1 text-[#71717A]">
                <Users className="w-3.5 h-3.5 text-[#71717A]" />
                <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
              </span>

              {/* Delete Channel Option (for creator/admin, non-general) */}
              {activeChannel.type !== 'general' && activeChannel.name !== 'general' && (
                <button
                  onClick={() => handleDeleteChannel(activeChannel)}
                  className="p-1.5 rounded-md text-[#71717A] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete Channel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-14 px-6 border-b border-[#1F1F24] flex items-center justify-between bg-[#0B0B0E]">
            <span className="text-sm text-[#71717A]">Select a channel</span>
          </div>
        )}

        {/* Message Stream */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative"
        >
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full text-xs text-[#71717A]">
              Loading messages...
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => {
              const isAuthor = msg.userId === user?.id || msg.isAuthor;
              const isEditing = editingMessageId === msg.id;

              return (
                <div key={msg.id} className="flex items-start gap-3 group">
                  <Avatar name={msg.senderName} size="sm" status="online" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#F5F5F7]">
                        {msg.senderName}
                      </span>
                      {isAuthor && (
                        <span className="text-[10px] text-indigo-400 font-medium">(You)</span>
                      )}
                      <span className="text-[10px] text-[#71717A]">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                      {msg.updatedAt && msg.updatedAt !== msg.createdAt && (
                        <span className="text-[9px] text-[#71717A] italic">(edited)</span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-1.5 space-y-2 max-w-2xl">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-[#0B0B0E] border border-indigo-500/50 rounded-md p-2.5 text-xs text-[#F5F5F7] focus:outline-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="xs"
                            leftIcon={Check}
                            onClick={() => handleSaveEdit(msg.id)}
                            disabled={!editContent.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            leftIcon={X}
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative inline-block max-w-2xl mt-1">
                        <div className="text-xs sm:text-sm text-[#F5F5F7] leading-relaxed bg-[#0B0B0E] p-3 rounded-lg border border-[#1F1F24]">
                          {msg.content}
                        </div>

                        {/* Action buttons on hover */}
                        {(isAuthor || currentRole === 'admin') && (
                          <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-[#17171C] rounded p-0.5 border border-[#292930] shadow-sm">
                            {isAuthor && (
                              <button
                                onClick={() => handleStartEdit(msg)}
                                className="p-1 text-[#71717A] hover:text-[#F5F5F7] hover:bg-[#202027] rounded transition-colors"
                                title="Edit message"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 text-[#71717A] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-10 h-10 rounded-md bg-[#17171C] flex items-center justify-center text-[#71717A] mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-[#F5F5F7] mb-1">Welcome to #{activeChannel?.name}!</h4>
              <p className="text-xs text-[#71717A] max-w-sm">
                This is the start of the #{activeChannel?.name} channel in {currentOrganization?.name}. Send a message to start collaborating with live real-time sync.
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating "New Messages" notification when user is scrolled up */}
        {hasUnreadBelow && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => scrollToBottom(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg transition-all animate-bounce"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>New messages below</span>
            </button>
          </div>
        )}

        {/* Message Composer Footer */}
        <div className="p-3 sm:p-4 border-t border-[#1F1F24] bg-[#0B0B0E] shrink-0">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={activeChannel ? `Message #${activeChannel.name}... (Press Enter to send)` : 'Select a channel first'}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!activeChannel || sending}
                className="flex-1 bg-[#111114] border border-[#1F1F24] rounded-md px-3.5 py-2 text-xs text-[#F5F5F7] placeholder-[#71717A] focus:outline-none focus:border-indigo-500/80 disabled:opacity-50"
              />

              <Button
                type="submit"
                size="sm"
                rightIcon={Send}
                loading={sending}
                disabled={!messageText.trim() || !activeChannel || sending}
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>


      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onChannelCreated={(newCh) => {
          loadChannels(newCh.id);
        }}
      />
      <CreateOrganizationModal
        isOpen={isCreateOrgOpen}
        onClose={() => setIsCreateOrgOpen(false)}
      />
    </div>
  );
}
