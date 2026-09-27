import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  Send,
  Users,
  UserCheck,
  MessageSquare,
  Search,
  Sparkles,
  Smile,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  Megaphone,
  X,
  Pin,
  Clock,
  GraduationCap,
  ShieldCheck,
  Plus,
  FileText,
  Image as ImageIcon,
  Camera,
  ChevronLeft,
} from 'lucide-react';

const EMOJIS = ['👍', '❤️', '🎉', '👏', '📢', '⏰', '📝', '✅'];

export default function Messages() {
  const { role, user, currentStudent } = useAuth();
  const { teachers, students, messages, addMessage, deleteMessage, reactToMessage, markMessagesAsRead, addToast } = useApp();

  const [activeTab, setActiveTab] = useState('broadcast');
  const [selectedRecipientId, setSelectedRecipientId] = useState('all');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [messageText, setMessageText] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [now, setNow] = useState(Date.now());

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Timer to auto-hide messages exactly at 48h
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedRecipientId, activeTab]);

  const filteredTeachers = useMemo(() => {
    return (teachers || [])
      .filter((t) => {
        // Exclude self if logged in as teacher
        if (role === 'teacher') {
          if (user?.id && t.id === user.id) return false;
          if (user?.email && t.email && t.email.toLowerCase().trim() === user.email.toLowerCase().trim()) return false;
          if (user?.name && t.name && t.name.toLowerCase().trim() === user.name.toLowerCase().trim()) return false;
        }
        return true;
      })
      .filter(
        (t) =>
          (t.name || '').toLowerCase().includes((teacherSearch || '').toLowerCase()) ||
          (t.subject && t.subject.toLowerCase().includes((teacherSearch || '').toLowerCase()))
      );
  }, [teachers, teacherSearch, role, user]);

  const filteredStudents = useMemo(() => {
    return (students || [])
      .filter((s) => {
        // Exclude self if logged in as student
        if (role === 'student') {
          if (currentStudent?.id && s.id === currentStudent.id) return false;
          if (
            currentStudent?.rollNumber &&
            s.rollNumber === currentStudent.rollNumber &&
            s.class === currentStudent.class &&
            s.section === currentStudent.section
          ) return false;
        }
        return true;
      })
      .filter(
        (s) =>
          (s.name || '').toLowerCase().includes((studentSearch || '').toLowerCase()) ||
          (s.rollNumber && String(s.rollNumber).includes(studentSearch || '')) ||
          (`${s.class}-${s.section}`).toLowerCase().includes((studentSearch || '').toLowerCase())
      );
  }, [students, studentSearch, role, currentStudent]);

  // Ensure valid recipient selection when switching tabs or when filtered list changes
  useEffect(() => {
    if (activeTab === 'broadcast') {
      if (!['all', 'teachers', 'students', 'admin'].includes(selectedRecipientId)) {
        setSelectedRecipientId('all');
      }
    } else if (activeTab === 'teachers') {
      const exists = filteredTeachers.some((t) => t.id === selectedRecipientId);
      if (!exists && filteredTeachers.length > 0) {
        setSelectedRecipientId(filteredTeachers[0].id);
      }
    } else if (activeTab === 'students') {
      const exists = filteredStudents.some((s) => s.id === selectedRecipientId);
      if (!exists && filteredStudents.length > 0) {
        setSelectedRecipientId(filteredStudents[0].id);
      }
    }
  }, [activeTab, selectedRecipientId, filteredTeachers, filteredStudents]);

  const handleAttachmentClick = (type) => {
    if (!fileInputRef.current) return;
    if (type === 'image') {
      fileInputRef.current.accept = 'image/*,video/*';
      fileInputRef.current.removeAttribute('capture');
    } else if (type === 'camera') {
      fileInputRef.current.accept = 'image/*,video/*';
      fileInputRef.current.setAttribute('capture', 'environment');
    } else {
      fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.xls,.csv';
      fileInputRef.current.removeAttribute('capture');
    }
    fileInputRef.current.click();
    setShowAttachmentMenu(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target.result;
      
      // Send message with attachment
      handleSend('', {
        type: isImage ? 'image' : 'document',
        name: file.name,
        url: base64Url,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = (textToSend, attachment = null) => {
    const text = (typeof textToSend === 'string' ? textToSend : messageText).trim();
    if (!text && !attachment) return;

    let targetRole = '';
    let targetId = 'all';

    if (activeTab === 'broadcast') {
      if (selectedRecipientId === 'admin') {
        targetRole = 'admin';
        targetId = 'admin';
      } else {
        targetRole = selectedRecipientId === 'students' ? 'student' : selectedRecipientId === 'teachers' ? 'teacher' : 'all';
        targetId = 'all';
      }
    } else if (activeTab === 'teachers') {
      targetRole = 'teacher';
      targetId = selectedRecipientId;
      if (!targetId) return;
    } else if (activeTab === 'students') {
      targetRole = 'student';
      targetId = selectedRecipientId;
      if (!targetId) return;
    }

    const senderId = role === 'student' ? currentStudent?.id : user?.id || 'admin';
    const senderName = role === 'student' ? currentStudent?.name : user?.name || 'Admin';

    addMessage({
      senderId,
      senderName,
      senderRole: role || 'admin',
      targetRole,
      targetId,
      text,
      attachment,
    });

    setMessageText('');
    setShowEmojiBar(false);
    setShowAttachmentMenu(false);
  };

  // Filter messages for current conversation
  const conversationMessages = useMemo(() => {
    const myId = role === 'student' ? currentStudent?.id : (user?.id || 'admin');

    return messages.filter((msg) => {
      if (activeTab === 'broadcast') {
        if (selectedRecipientId === 'admin') {
          return (
            (msg.senderRole === role && msg.senderId === myId && msg.targetRole === 'admin') ||
            (msg.senderRole === 'admin' && msg.targetId === myId)
          );
        } else if (msg.targetId === 'all') {
          if (selectedRecipientId === 'all') return true;
          if (selectedRecipientId === 'teachers' && (msg.targetRole === 'teacher' || msg.targetRole === 'all')) return true;
          if (selectedRecipientId === 'students' && (msg.targetRole === 'student' || msg.targetRole === 'all')) return true;
        }
      } else if (activeTab === 'teachers' || activeTab === 'students') {
        return (
          (msg.senderId === myId && msg.targetId === selectedRecipientId) ||
          (msg.senderId === selectedRecipientId && msg.targetId === myId)
        );
      }
      return false;
    });
  }, [messages, activeTab, selectedRecipientId, role, currentStudent, user]);

  useEffect(() => {
    const myId = role === 'student' ? currentStudent?.id : (user?.id || 'admin');
    const unread = conversationMessages.filter(m => m.senderId !== myId && (!Array.isArray(m.readBy) || !m.readBy.includes(myId)));
    if (unread.length > 0) {
      markMessagesAsRead(unread.map(m => m.id), myId);
    }
  }, [conversationMessages, role, currentStudent, user, markMessagesAsRead]);

  // Apply chat search if active
  const filteredMessages = useMemo(() => {
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
    const validMessages = conversationMessages.filter(msg => (now - new Date(msg.timestamp).getTime()) < FORTY_EIGHT_HOURS);

    if (!chatSearch.trim()) return validMessages;
    return validMessages.filter((msg) =>
      (msg.text || '').toLowerCase().includes(chatSearch.toLowerCase())
    );
  }, [conversationMessages, chatSearch, now]);


  // Recipient Meta Info
  const recipientMeta = useMemo(() => {
    if (activeTab === 'broadcast') {
      if (selectedRecipientId === 'admin') {
        return {
          title: 'School Administrator',
          subtitle: 'Direct message channel with the principal/admin',
          badge: 'Admin',
          icon: ShieldCheck,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        };
      }
      if (selectedRecipientId === 'all') {
        return {
          title: 'Broadcast: Everyone',
          subtitle: 'Public School Announcement • Reaches all students, teachers & admins',
          badge: 'All School',
          icon: Megaphone,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        };
      }
      if (selectedRecipientId === 'students') {
        return {
          title: 'Broadcast: All Students',
          subtitle: 'Student Notice Board • Reaches all registered student accounts',
          badge: 'Students',
          icon: Users,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        };
      }
      return {
        title: 'Broadcast: All Teachers',
        subtitle: 'Faculty Channel • Staff and department announcements only',
        badge: 'Teachers',
        icon: UserCheck,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      };
    }

    if (activeTab === 'students') {
      const currentStu = students.find((s) => s.id === selectedRecipientId);
      return {
        title: currentStu ? currentStu.name : 'Student Chat',
        subtitle: currentStu ? `Class ${currentStu.class}-${currentStu.section} • Roll No. ${currentStu.rollNumber} • Direct Message` : 'Student message channel',
        badge: currentStu ? `Class ${currentStu.class}-${currentStu.section}` : 'Student',
        icon: GraduationCap,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      };
    }

    const currentTeacher = teachers.find((t) => t.id === selectedRecipientId);
    return {
      title: currentTeacher ? currentTeacher.name : 'Teacher Chat',
      subtitle: currentTeacher ? `Class ${currentTeacher.class}-${currentTeacher.section} Teacher • Direct Message` : 'Teacher message channel',
      badge: currentTeacher ? `Class ${currentTeacher.class}-${currentTeacher.section}` : 'Faculty',
      icon: UserCheck,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };
  }, [activeTab, selectedRecipientId, teachers, students]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast?.('Message copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getUnreadCount = useCallback((tab, recId) => {
    const myId = role === 'student' ? currentStudent?.id : (user?.id || 'admin');
    
    // First, filter by 48 hour rule
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
    const validMessages = messages.filter(msg => (now - new Date(msg.timestamp).getTime()) < FORTY_EIGHT_HOURS);
    
    return validMessages.filter(msg => {
      // Must not be my own message, and must not be read by me
      if (msg.senderId === myId || (Array.isArray(msg.readBy) && msg.readBy.includes(myId))) return false;

      if (tab === 'broadcast') {
        if (recId === 'admin') {
          return msg.senderRole === 'admin' && msg.targetId === myId;
        } else if (msg.targetId === 'all') {
          if (recId === 'all') return true;
          if (recId === 'teachers' && (msg.targetRole === 'teacher' || msg.targetRole === 'all')) return true;
          if (recId === 'students' && (msg.targetRole === 'student' || msg.targetRole === 'all')) return true;
        }
      } else if (tab === 'teachers' || tab === 'students') {
        return msg.senderId === recId && msg.targetId === myId;
      }
      return false;
    }).length;
  }, [messages, role, currentStudent, user, now]);

  const getTabUnreadCount = useCallback((tab) => {
    const myId = role === 'student' ? currentStudent?.id : (user?.id || 'admin');
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
    const validMessages = messages.filter(msg => (now - new Date(msg.timestamp).getTime()) < FORTY_EIGHT_HOURS);
    
    return validMessages.filter(msg => {
      if (msg.senderId === myId || (Array.isArray(msg.readBy) && msg.readBy.includes(myId))) return false;

      if (tab === 'broadcast') {
        if (msg.targetId === 'all') {
          if (role === 'admin') return true;
          if (role === 'teacher' && (msg.targetRole === 'teacher' || msg.targetRole === 'all')) return true;
          if (role === 'student' && (msg.targetRole === 'student' || msg.targetRole === 'all')) return true;
        }
        if (msg.senderRole === 'admin' && msg.targetId === myId) return true;
      } else if (tab === 'teachers') {
        return msg.senderRole === 'teacher' && msg.targetId === myId;
      } else if (tab === 'students') {
        return msg.senderRole === 'student' && msg.targetId === myId;
      }
      return false;
    }).length;
  }, [messages, role, currentStudent, user, now]);

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0 overflow-hidden bg-transparent w-full max-w-full">
      {/* ── LEFT RECIPIENT PANEL ── */}
      {/* On mobile: full screen when mobileView==='list', hidden when 'chat'.
          On desktop (md+): always shown as a fixed-width sidebar. */}
      <div className={`w-full md:w-[280px] lg:w-[320px] flex-shrink-0 flex-col relative z-10 border-b md:border-b-0 md:border-r border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl
        ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
        h-full min-h-0`}>
        
        {/* Top Navigation */}
        <div className="flex-shrink-0 flex flex-col gap-1.5 p-3 border-b border-white/10 bg-black/20">
          <button
            onClick={() => {
              setActiveTab('broadcast');
              setSelectedRecipientId('all');
            }}
            className={`w-full p-2.5 rounded-xl text-sm font-semibold flex items-center justify-start gap-3 transition-all duration-200 cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_4px_15px_rgba(59,130,246,0.15)]'
                : 'bg-[#111726]/60 hover:bg-[#151D30] border border-white/[0.06] text-slate-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'broadcast' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.04] text-slate-400'}`}>
              <Megaphone size={14} />
            </div>
            <div className="flex-1 flex justify-between items-center pr-1">
              <span>Broadcasts</span>
              {(() => {
                const unread = getTabUnreadCount('broadcast');
                if (unread > 0) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]">{unread}</span>;
                return null;
              })()}
            </div>
          </button>
          
          {role !== 'student' && (
            <button
              onClick={() => {
                setActiveTab('students');
                setSelectedRecipientId(filteredStudents[0]?.id || null);
                setStudentSearch('');
              }}
              className={`w-full p-2.5 rounded-xl text-sm font-semibold flex items-center justify-start gap-3 transition-all duration-200 cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-[0_4px_15px_rgba(16,185,129,0.15)]'
                  : 'bg-[#111726]/60 hover:bg-[#151D30] border border-white/[0.06] text-slate-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'students' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-slate-400'}`}>
                <GraduationCap size={14} />
              </div>
              <div className="flex-1 flex justify-between items-center pr-1">
                <span>Students</span>
                {(() => {
                  const unread = getTabUnreadCount('students');
                  if (unread > 0) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]">{unread}</span>;
                  return null;
                })()}
              </div>
            </button>
          )}
          
          <button
            onClick={() => {
              setActiveTab('teachers');
              setSelectedRecipientId(filteredTeachers[0]?.id || null);
            }}
            className={`w-full p-2.5 rounded-xl text-sm font-semibold flex items-center justify-start gap-3 transition-all duration-200 cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_4px_15px_rgba(59,130,246,0.15)]'
                : 'bg-[#111726]/60 hover:bg-[#151D30] border border-white/[0.06] text-slate-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'teachers' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.04] text-slate-400'}`}>
              <Users size={14} />
            </div>
            <div className="flex-1 flex justify-between items-center pr-1">
              <span>Teachers</span>
              {(() => {
                const unread = getTabUnreadCount('teachers');
                if (unread > 0) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]">{unread}</span>;
                return null;
              })()}
            </div>
          </button>
        </div>

        {/* Recipient List Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search for Teachers */}
        {activeTab === 'teachers' && (
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Search teacher or subject..."
                className="w-full bg-[#111726] border border-white/[0.08] text-xs text-white placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* Search for Students */}
        {activeTab === 'students' && (
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name, roll no, class..."
                className="w-full bg-[#111726] border border-white/[0.08] text-xs text-white placeholder-slate-500 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* Recipient List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {activeTab === 'broadcast' && (
            <>
              {[
                { id: 'all', title: 'Everyone', desc: 'School-wide announcements', icon: Megaphone, count: 'All' },
                { id: 'students', title: 'All Students', desc: 'Student notices & alerts', icon: Users, count: 'Students' },
                { id: 'teachers', title: 'All Teachers', desc: 'Staff & department memos', icon: UserCheck, count: 'Faculty' },
                ...(role !== 'admin' ? [{ id: 'admin', title: 'School Admin', desc: 'Direct message to principal', icon: ShieldCheck, count: 'Admin' }] : [])
              ].map((b) => {
                const Icon = b.icon;
                const isSelected = selectedRecipientId === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedRecipientId(b.id);
                      setMobileView('chat');
                    }}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-500/40 shadow-[0_4px_20px_rgba(59,130,246,0.15)]'
                        : 'bg-[#111726]/60 hover:bg-[#151D30] border border-white/[0.06] text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-500/30 text-blue-400 border border-blue-400/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                          : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {b.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const unread = getUnreadCount('broadcast', b.id);
                            if (unread > 0) return (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                                {unread}
                              </span>
                            );
                            return null;
                          })()}
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
                            {b.count}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{b.desc}</p>
                    </div>
                  </button>
                );
              })}

              {/* Announcement Info Card */}
              <div className="mt-4 p-3.5 rounded-xl bg-blue-500/[0.06] border border-blue-500/15">
                <p className="text-[11px] font-medium text-blue-300 flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} className="text-blue-400" /> Real-time Delivery
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Announcements sent here update instantly for connected students and teachers.
                </p>
              </div>
            </>
          )}

          {/* ── STUDENTS LIST ── */}
          {activeTab === 'students' && (
            <div className="space-y-1.5">
              {filteredStudents.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  {studentSearch ? 'No students found.' : 'No students registered yet.'}
                </div>
              )}
              {filteredStudents.map((student) => {
                const isSelected = selectedRecipientId === student.id;
                const initials = student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedRecipientId(student.id);
                      setMobileView('chat');
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600/20 border border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.15)]'
                        : 'bg-[#111726]/60 hover:bg-[#151D30] border border-white/[0.06] text-slate-300'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-xs">
                        {initials}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0B0F19]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {student.name}
                        </p>
                        {(() => {
                          const unread = getUnreadCount('students', student.id);
                          if (unread > 0) return (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                              {unread}
                            </span>
                          );
                          return null;
                        })()}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        Class {student.class}-{student.section} • Roll #{student.rollNumber}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="space-y-1.5">
              {filteredTeachers.map((teacher) => {
                const isSelected = selectedRecipientId === teacher.id;
                return (
                  <button
                    key={teacher.id}
                    onClick={() => {
                      setSelectedRecipientId(teacher.id);
                      setMobileView('chat');
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-500/40 shadow-[0_4px_20px_rgba(59,130,246,0.15)]'
                        : 'bg-[#111726]/60 hover:bg-[#151D30] border border-white/[0.06] text-slate-300'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold text-xs">
                        {teacher.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0B0F19]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {teacher.name}
                        </p>
                        {(() => {
                          const unread = getUnreadCount('teachers', teacher.id);
                          if (unread > 0) return (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                              {unread}
                            </span>
                          );
                          return null;
                        })()}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        Class {teacher.class}-{teacher.section} • {teacher.subject || 'Teacher'}
                      </p>
                    </div>
                  </button>
                );
              })}
              {filteredTeachers.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  {teacherSearch ? 'No teachers found matching search.' : 'No other teachers registered yet.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    {/* end left panel */}

      {/* ── RIGHT CHAT PANEL ── */}
      {/* On mobile: full screen when mobileView==='chat', hidden when 'list'.
          On desktop (md+): flex-1 takes remaining space beside the left panel. */}
      <div className={`flex-1 min-w-0 min-h-0 h-full flex flex-col overflow-hidden bg-[#070A12] relative ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {/* Chat Header */}
        <div className="flex-shrink-0 h-[60px] sm:h-[64px] px-3.5 sm:px-5 flex items-center justify-between bg-[#0B0F19]/80 backdrop-blur-xl z-10 border-b border-white/5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer active:scale-95 flex-shrink-0"
              title="Back to conversations"
            >
              <ChevronLeft size={18} />
            </button>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${recipientMeta?.color || 'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
              {(() => {
                const IconComponent = recipientMeta?.icon || UserCheck;
                return <IconComponent size={18} />;
              })()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-200 dark:text-white truncate tracking-tight">
                  {recipientMeta.title}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0">
                  {recipientMeta.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{recipientMeta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search messages in conversation */}
            {showSearchInput ? (
              <div className="flex items-center gap-1.5 bg-[#111726] border border-white/15 rounded-xl px-2.5 py-1 text-xs">
                <Search size={13} className="text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Search in chat..."
                  className="bg-transparent text-white text-xs placeholder-slate-500 focus:outline-none w-28 sm:w-40"
                />
                <button onClick={() => { setShowSearchInput(false); setChatSearch(''); }} className="text-slate-400 hover:text-white">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Search conversation"
              >
                <Search size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center py-10 px-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-[0_0_25px_rgba(59,130,246,0.15)]">
                {(() => {
                  const IconComponent = recipientMeta?.icon || UserCheck;
                  return <IconComponent size={26} />;
                })()}
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {chatSearch ? 'No matching messages found' : `Welcome to ${recipientMeta.title}`}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                {chatSearch
                  ? 'Try searching for a different keyword or clear the search.'
                  : activeTab === 'students'
                    ? 'Send a direct message to this student. They will see it in their portal.'
                    : 'Send announcements, event reminders, or class updates to everyone in this channel.'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const myId = role === 'student' ? currentStudent?.id : (user?.id || 'admin');
              const isMe = msg.senderRole === role && msg.senderId === myId;

              const roleColors = {
                admin: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
                teacher: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                student: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
              };

              return (
                <div
                  key={msg.id}
                  className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  {/* Sender & Timestamp Header */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-semibold text-slate-300">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                        roleColors[msg.senderRole] || 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                      }`}
                    >
                      {msg.senderRole?.toUpperCase() || 'USER'}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap shadow-lg transition-all ${
                      isMe
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-blue-500/10 border border-blue-400/20'
                        : 'bg-[#111726]/95 border border-white/[0.1] text-slate-100 rounded-tl-xs shadow-black/40'
                    }`}
                  >
                    {msg.text && <div>{msg.text}</div>}
                    
                    {msg.attachment && (
                      <div className={`mt-2 ${!msg.text ? '-mt-1' : ''}`}>
                        {msg.attachment.type === 'image' ? (
                          <img src={msg.attachment.url} alt="attachment" className="max-w-[200px] max-h-[250px] object-cover rounded-lg border border-white/20 shadow-md cursor-pointer hover:opacity-90 transition-opacity" />
                        ) : (
                          <div className={`flex items-center gap-2 p-2.5 rounded-lg border shadow-sm ${isMe ? 'bg-black/20 border-white/20' : 'bg-[#151D30] border-white/10'}`}>
                            <FileText size={18} className={isMe ? 'text-white' : 'text-slate-400'} />
                            <a href={msg.attachment.url} download={msg.attachment.name} className={`text-sm truncate max-w-[150px] font-medium hover:underline ${isMe ? 'text-white' : 'text-blue-400'}`}>
                              {msg.attachment.name}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Status Ticks */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75">
                      {isMe && <CheckCheck size={13} className="text-cyan-200" />}
                    </div>

                    {/* Hover Message Actions (Reactions, Copy, Delete) */}
                    <div
                      className={`absolute top-0 -translate-y-1/2 ${
                        isMe ? 'left-2 -translate-x-full' : 'right-2 translate-x-full'
                      } hidden group-hover:flex items-center gap-1 bg-[#0E1422] border border-white/15 px-1.5 py-1 rounded-xl shadow-xl z-20`}
                    >
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08]"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                      <button
                        onClick={() => reactToMessage(msg.id, '👍')}
                        className="p-1 text-xs hover:scale-125 transition-transform"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => reactToMessage(msg.id, '❤️')}
                        className="p-1 text-xs hover:scale-125 transition-transform"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => reactToMessage(msg.id, '🎉')}
                        className="p-1 text-xs hover:scale-125 transition-transform"
                      >
                        🎉
                      </button>
                      {(isMe || role === 'admin') && (
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reaction Badges */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex items-center gap-1 mt-1 px-1">
                      {Object.entries(msg.reactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => reactToMessage(msg.id, emoji)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs hover:bg-white/[0.12] transition-colors"
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Emoji Bar Popup */}
        {showEmojiBar && role !== 'student' && (
          <div className="flex-shrink-0 px-5 py-2 bg-[#0E1422] border-t border-white/10 flex items-center gap-2 overflow-x-auto custom-scrollbar animate-in slide-in-from-bottom-2 duration-150">
            <span className="text-xs text-slate-400 font-medium mr-1">Quick Emojis:</span>
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setMessageText((prev) => prev + emoji)}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.08] text-base flex items-center justify-center transition-transform hover:scale-125 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Area — flex-shrink-0 keeps it always visible.
            pb-safe adds healthy bottom cushion (at least 14px on mobile) plus env(safe-area-inset-bottom) on iOS. */}
        {role !== 'student' && (
          <div className="flex-shrink-0 px-3 pt-2.5 sm:px-4 sm:pt-3.5 pb-safe bg-[#0B0F19]/90 border-t border-white/10 backdrop-blur-xl relative z-20">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
              {/* Attachment toggle */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu((b) => !b)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                    showAttachmentMenu
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                      : 'bg-[#111726] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                  title="Attach"
                >
                  <Plus size={20} />
                </button>
                
                {/* Attachment Menu Popup */}
                {showAttachmentMenu && (
                  <div className="absolute bottom-[calc(100%+12px)] left-0 w-56 bg-[#181c25] border border-white/10 rounded-2xl shadow-2xl flex flex-col py-2 animate-in slide-in-from-bottom-2 duration-150 z-50">
                    <button type="button" onClick={() => handleAttachmentClick('document')} className="w-full px-4 py-2.5 flex items-center gap-3.5 text-[15px] text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer text-left">
                      <div className="text-[#845ec2] flex items-center justify-center">
                        <FileText size={22} strokeWidth={2.5} />
                      </div>
                      <span className="font-semibold tracking-wide">Document</span>
                    </button>
                    <button type="button" onClick={() => handleAttachmentClick('image')} className="w-full px-4 py-2.5 flex items-center gap-3.5 text-[15px] text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer text-left">
                      <div className="text-[#0081cf] flex items-center justify-center">
                        <ImageIcon size={22} strokeWidth={2.5} />
                      </div>
                      <span className="font-semibold tracking-wide">Photos & videos</span>
                    </button>
                    <button type="button" onClick={() => handleAttachmentClick('camera')} className="w-full px-4 py-2.5 flex items-center gap-3.5 text-[15px] text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer text-left">
                      <div className="text-[#ff4b82] flex items-center justify-center">
                        <Camera size={22} strokeWidth={2.5} />
                      </div>
                      <span className="font-semibold tracking-wide">Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

              {/* Emoji bar toggle */}
              <button
                type="button"
                onClick={() => setShowEmojiBar((b) => !b)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                  showEmojiBar
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                    : 'bg-[#111726] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
                title="Add Emoji"
              >
                <Smile size={18} />
              </button>

              {/* Input box */}
              <div className="flex-1 min-w-0 relative">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    activeTab === 'broadcast'
                      ? 'Post an announcement...'
                      : `Message ${recipientMeta.title || ''}...`
                  }
                  className="w-full bg-[#111726] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="h-10 sm:h-11 px-3.5 sm:px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 flex-shrink-0"
              >
                <Send size={15} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
