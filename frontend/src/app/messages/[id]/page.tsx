"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, MoreVertical, Image as ImageIcon, MapPin, User, Flag, Trash2, Eye, EyeOff } from "lucide-react";
import { chatService } from "@/lib/chatService";
import { getEcho } from "@/lib/echo";
import { useAuth } from "@/lib/authContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useNotifications } from "@/lib/notificationContext";
import { usePathname } from "next/navigation";

// ─── Son de notification simple (beep) ────────────────────
const playNotificationSound = () => {
  try {
    // Créer un son de notification simple (beep court)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Fréquence du beep
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch {
    // Ignorer si l'audio n'est pas disponible
  }
};
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import type { Message, MessageBroadcast, Conversation } from "@/types/chat";

/**
 * Page /messages/[id] — Fenêtre de chat temps réel améliorée.
 * Design inspiré Airbnb avec la DA Roomshare.
 */
function ChatPageContent() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuth();
  const { refresh: refreshNotifications, increment: incrementNotifications } = useNotifications();
  const pathname = usePathname();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ─── Scroll to bottom ─────────────────────────────────
  const scrollToBottom = useCallback((instant = false) => {
    if (instant) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // ─── Load conversation + messages ─────────────────────
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const response = await chatService.getConversation(conversationId);
        setConversation(response.data.conversation);
        setMessages(response.data.messages);
        refreshNotifications();
        // Auto-scroll immédiat au chargement
        setTimeout(() => scrollToBottom(true), 100);
        // Afficher les suggestions si c'est la première conversation pour un locataire
        if (response.data.messages.length === 0 && user?.role === "tenant") {
          setShowSuggestions(true);
        }
      } catch {
        toast.error("Impossible de charger la conversation");
        router.push("/messages");
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [conversationId, router, refreshNotifications, scrollToBottom, user?.role]);

  // ─── Scroll on new messages ───────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      // Petit délai pour s'assurer que le DOM est mis à jour
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, scrollToBottom]);

  // ─── Fermer le menu en cliquant en dehors ──────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // ─── WebSocket : écouter les nouveaux messages ────────
  useEffect(() => {
    if (!conversationId) return;

    let channel: ReturnType<ReturnType<typeof getEcho>["private"]> | null = null;

    try {
      const echo = getEcho();
      channel = echo.private(`conversation.${conversationId}`);

      channel.listen(".message.sent", (event: MessageBroadcast) => {
        if (event.sender_id === user?.id) return;

        const newMsg: Message = {
          _id: event.id,
          conversation_id: event.conversation_id,
          sender_id: event.sender_id,
          body: event.body,
          read_at: null,
          created_at: event.created_at,
        };

        setMessages((prev) => [...prev, newMsg]);
        
        // Son de notification si l'utilisateur n'est pas sur cette page
        if (pathname !== `/messages/${conversationId}`) {
          playNotificationSound();
          incrementNotifications();
        }
      });
    } catch {
      console.warn("[Chat] WebSocket non disponible");
    }

    return () => {
      try {
        if (channel) {
          const echo = getEcho();
          echo.leave(`conversation.${conversationId}`);
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [conversationId, user?.id, pathname, incrementNotifications]);

  // ─── Polling de secours : récupérer les nouveaux messages (si WebSocket indisponible) ───────
  useEffect(() => {
    if (!conversationId || loading) return;

    const pollInterval = 3000;
    const timer = setInterval(async () => {
      try {
        const response = await chatService.getConversation(conversationId);
        const serverMessages = response.data.messages ?? [];
        setMessages((prev) => {
          if (serverMessages.length < prev.length) return prev;
          const prevLastId = prev.length > 0 ? prev[prev.length - 1]._id ?? prev[prev.length - 1].id : null;
          const serverLastId = serverMessages.length > 0 ? serverMessages[serverMessages.length - 1]._id ?? (serverMessages[serverMessages.length - 1] as Message).id : null;
          if (prevLastId === serverLastId && serverMessages.length === prev.length) return prev;
          return serverMessages as Message[];
        });
        if (response.data.conversation) {
          setConversation(response.data.conversation);
        }
      } catch {
        // ignore
      }
    }, pollInterval);

    return () => clearInterval(timer);
  }, [conversationId, loading]);

  // ─── Envoyer un message ───────────────────────────────
  const handleSend = async () => {
    const body = newMessage.trim();
    if (!body || sending) return;

    // Optimistic UI
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user?.id || "",
      body,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    inputRef.current?.focus();

    try {
      setSending(true);
      await chatService.sendMessage(conversationId, body);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setNewMessage(body);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Formater l'heure du message
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) {
      return date.toLocaleDateString("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  // Grouper les messages par jour
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toLocaleDateString("fr-FR");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: currentDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const otherUser = conversation?.other_participant_name ?? conversation?.participants.find((p) => p !== user?.id) ?? "...";
  const avatarColor = "var(--color-accent)"; // Couleur accent Roomshare depuis globals.css
  const messageGroups = groupMessagesByDate(messages);
  
  // Suggestions de messages pour les locataires lors de la première conversation
  const isFirstMessage = messages.length === 0;
  const isTenant = user?.role === "tenant";
  const messageSuggestions = isFirstMessage && isTenant ? [
    "Bonjour ! Je suis intéressé(e) par votre annonce. Est-elle encore disponible ?",
    "Salut ! Je cherche une colocation à Reims. Pourriez-vous me donner plus d'informations ?",
    "Bonjour, je suis étudiant(e) et je cherche un logement. Cette chambre m'intéresse beaucoup !",
    "Hello ! Je voudrais visiter le logement. Quand seriez-vous disponible ?",
  ] : [];

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col bg-background">
      {/* ─── Header amélioré ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur-lg px-4 py-3 shadow-sm">
        <button
          onClick={() => router.push("/messages")}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground shadow-md">
          {otherUser.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <span className="truncate text-sm font-semibold text-foreground">{otherUser}</span>
          <div className="flex items-center gap-1.5">
            <Badge variant="muted" className="text-[10px] px-1.5 py-0.5">
              {conversation?.room_title || "Chargement..."}
            </Badge>
            {conversation?.room_id && (
              <Link
                href={`/rooms/${conversation.room_id}`}
                className="text-[10px] text-accent hover:underline"
              >
                Voir l&apos;annonce
              </Link>
            )}
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
            aria-label="Menu de conversation"
          >
            <MoreVertical size={18} />
          </button>

          {/* Menu dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-background shadow-lg z-50">
              <div className="py-1">
                {conversation?.room_id && (
                  <Link
                    href={`/rooms/${conversation.room_id}`}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <MapPin size={16} className="text-accent" />
                    <span>Voir l&apos;annonce</span>
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    // TODO: Implémenter la fonctionnalité "Voir le profil"
                    toast.info("Fonctionnalité à venir");
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <User size={16} className="text-accent" />
                  <span>Voir le profil</span>
                </button>

                <div className="my-1 h-px bg-border" />

                <button
                  onClick={() => {
                    // TODO: Implémenter la fonctionnalité "Marquer comme lu/non lu"
                    toast.info("Fonctionnalité à venir");
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Eye size={16} className="text-accent" />
                  <span>Marquer comme lu</span>
                </button>

                <button
                  onClick={() => {
                    // TODO: Implémenter la fonctionnalité "Signaler"
                    toast.info("Fonctionnalité à venir");
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Flag size={16} className="text-error" />
                  <span className="text-error">Signaler</span>
                </button>

                <div className="my-1 h-px bg-border" />

                <button
                  onClick={() => {
                    if (confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
                      // TODO: Implémenter la suppression de conversation
                      toast.info("Fonctionnalité à venir");
                      setShowMenu(false);
                    }
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error transition-colors hover:bg-muted"
                >
                  <Trash2 size={16} />
                  <span>Supprimer la conversation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ─── Messages ────────────────────────────────────── */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <Skeleton className={`h-12 ${i % 2 === 0 ? "w-48" : "w-36"} rounded-2xl`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Send size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Aucun message</p>
            <p className="text-xs text-muted-foreground">
              Envoyez le premier message pour démarrer la conversation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messageGroups.map((group, groupIndex) => (
              <div key={group.date}>
                {/* Séparateur de date */}
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.date === new Date().toLocaleDateString("fr-FR")
                      ? "Aujourd'hui"
                      : group.date ===
                        new Date(Date.now() - 86400000).toLocaleDateString("fr-FR")
                      ? "Hier"
                      : group.date}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Messages du groupe */}
                {group.messages.map((msg, msgIndex) => {
                  const isMine = msg.sender_id === user?.id;
                  const msgId = msg.id || msg._id || `${msg.created_at}-${msg.sender_id}`;
                  const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                  const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                  const timeDiff =
                    prevMsg
                      ? new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()
                      : Infinity;
                  const showTime = timeDiff > 300000; // 5 minutes

                  return (
                    <div
                      key={msgId}
                      className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"} ${
                        showTime ? "mt-4" : "mt-1"
                      }`}
                    >
                      {!isMine && (
                        <div className="shrink-0">
                          {showAvatar ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                              {otherUser.substring(0, 2).toUpperCase()}
                            </div>
                          ) : (
                            <div className="h-8 w-8" />
                          )}
                        </div>
                      )}
                      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%]`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                            isMine
                              ? "rounded-br-md bg-accent text-accent-foreground"
                              : "rounded-bl-md bg-[#f3f4f6] text-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        </div>
                        {showTime && (
                          <p
                            className={`mt-1 text-[10px] ${
                              isMine ? "text-muted-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {formatMessageTime(msg.created_at)}
                          </p>
                        )}
                      </div>
                      {isMine && <div className="shrink-0 w-8" />}
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ─── Suggestions de messages (première conversation) ────────── */}
      {messageSuggestions.length > 0 && showSuggestions && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <div className="mx-auto max-w-4xl">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Suggestions de messages :</p>
            <div className="flex flex-wrap gap-2">
              {messageSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setNewMessage(suggestion);
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-all hover:border-accent hover:bg-accent/5 hover:text-accent"
                >
                  {suggestion.length > 60 ? `${suggestion.substring(0, 60)}...` : suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Input bar améliorée (fixe en bas) ─────────────────────── */}
      <div className="border-t border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-end gap-2">
          <div className="flex flex-1 items-end gap-2 rounded-full border border-border bg-muted px-4 py-2 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (showSuggestions) setShowSuggestions(false);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (messageSuggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder={messageSuggestions.length > 0 ? "Tapez votre message ou choisissez une suggestion..." : "Tapez votre message..."}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              style={{
                maxHeight: "120px",
                height: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
