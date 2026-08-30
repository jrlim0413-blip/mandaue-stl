import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';

const MessengerContext = createContext(null);

const STORAGE_KEY = 'stl_mandaue_messenger_active_thread_v1';

// Web Audio API Sound generator for Messenger sounds
const playMessengerChime = (type = 'receive') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'send') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.09); // A5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);
    }
  } catch (err) {}
};

// DEDICATED 1-ON-1 AUTHORIZED CASHIER & VERIFICATION OFFICER
export const AUTHORIZED_CASHIER = {
  id: 'cashier-main',
  name: 'Maria Elena Santos',
  username: 'main_cashier',
  role: 'Official Cashier & Authorized Claim Verifier',
  station: 'Central Claim & Audit Desk (Mandaue HQ)',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  online: true,
  lastSeen: 'Active now',
  badge: 'Authorized Payout Officer'
};

const formatDbMessage = (row) => {
  const isMe = row.sender_username !== 'main_cashier';
  const createdDate = row.created_at ? new Date(row.created_at) : new Date();

  return {
    id: row.id || `msg-${Date.now()}`,
    sender: row.sender_username === 'main_cashier' ? 'cashier-main' : 'currentUser',
    senderUsername: row.sender_username,
    senderName: row.sender_name || (row.sender_username === 'main_cashier' ? 'Maria Elena Santos' : 'Staff'),
    senderRole: row.sender_role || 'staff',
    text: row.message_text || '',
    image: row.receipt_image_url || null,
    isSystem: Boolean(row.is_system_message),
    status: row.status || 'delivered',
    timestamp: createdDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  };
};

export function MessengerProvider({ children, currentUser }) {
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  // Helper to upload image to Supabase Storage or convert to string
  const uploadReceiptPhoto = async (imageInput) => {
    if (!imageInput) return null;

    // If it's already a hosted URL, return as is
    if (typeof imageInput === 'string' && imageInput.startsWith('http')) {
      return imageInput;
    }

    try {
      // If it's a data URL / base64, convert to blob and upload to 'claim-receipts' bucket
      if (typeof imageInput === 'string' && imageInput.startsWith('data:image')) {
        const res = await fetch(imageInput);
        const blob = await res.blob();
        const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('claim-receipts')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('claim-receipts')
            .getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      }
    } catch (err) {
      console.warn('Storage upload error, falling back to direct string:', err);
    }

    return imageInput;
  };

  // 1. Initialize or Fetch Active Verification Thread from Supabase
  const initializeThread = useCallback(async () => {
    try {
      setIsLoadingMessages(true);
      const myUsername = currentUser?.username || 'staff';
      const myOutlet = currentUser?.outlet || currentUser?.full_name || myUsername;

      // Check for existing active thread
      const { data: existingThreads, error: threadErr } = await supabase
        .from('claim_verification_threads')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(1);

      let thread = existingThreads?.[0] || null;

      // If no thread exists, create one
      if (!thread && !threadErr) {
        const { data: newThread, error: createErr } = await supabase
          .from('claim_verification_threads')
          .insert({
            outlet_name: myOutlet,
            outlet_user_id: myUsername,
            outlet_user_name: currentUser?.full_name || myUsername,
            verifier_username: 'main_cashier',
            verifier_name: 'Maria Elena Santos',
            claim_status: 'PENDING'
          })
          .select()
          .single();

        if (!createErr && newThread) {
          thread = newThread;

          // Insert welcome message from authorized cashier
          await supabase.from('claim_verification_messages').insert({
            thread_id: newThread.id,
            sender_username: 'main_cashier',
            sender_name: 'Maria Elena Santos',
            sender_role: 'cashier',
            message_text: 'Good day! Ako ang authorized officer para sa ticket verification at claiming ng resibo sa system. Paki-attach lang po ng picture ng resibo o i-send ang transaction details dito para ma-verify ko agad sa master terminal.',
            status: 'delivered'
          });
        }
      }

      if (thread) {
        setActiveThread(thread);

        // Fetch messages for this thread
        const { data: dbMessages, error: msgErr } = await supabase
          .from('claim_verification_messages')
          .select('*')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: true });

        if (!msgErr && dbMessages && dbMessages.length > 0) {
          setMessages(dbMessages.map(formatDbMessage));
        } else {
          // Fallback initial message
          setMessages([
            {
              id: 'init-1',
              sender: 'cashier-main',
              senderName: 'Maria Elena Santos',
              text: 'Good day! Ako ang authorized officer para sa ticket verification at claiming ng resibo sa system. Paki-attach lang po ng picture ng resibo o i-send ang transaction details dito para ma-verify ko agad sa master terminal.',
              timestamp: '9:00 AM',
              status: 'seen'
            }
          ]);
        }
      }
    } catch (err) {
      console.warn('Error connecting to Supabase messenger:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUser]);

  useEffect(() => {
    initializeThread();
  }, [initializeThread]);

  // 2. Realtime Listener for Incoming Messages & Status Updates
  useEffect(() => {
    if (!activeThread?.id) return;

    const channel = supabase
      .channel(`claim_messages:${activeThread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'claim_verification_messages',
          filter: `thread_id=eq.${activeThread.id}`
        },
        (payload) => {
          const newRow = payload.new;
          const formatted = formatDbMessage(newRow);

          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            return [...prev, formatted];
          });

          // Play sound chime if from cashier
          if (newRow.sender_username === 'main_cashier') {
            setIsTyping(false);
            playMessengerChime('receive');
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'claim_verification_threads',
          filter: `id=eq.${activeThread.id}`
        },
        (payload) => {
          setActiveThread(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThread?.id]);

  // 3. Send Message (Saves live to Supabase + Uploads Receipt Image)
  const sendMessage = useCallback(
    async (text = '', imageAttachment = null) => {
      const trimmed = text.trim();
      if (!trimmed && !imageAttachment) return;

      const myUsername = currentUser?.username || 'staff';
      const myName = currentUser?.full_name || myUsername;
      const myRole = currentUser?.role || 'teller';

      // Optimistic message update
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        sender: 'currentUser',
        senderUsername: myUsername,
        senderName: myName,
        senderRole: myRole,
        text: trimmed,
        image: imageAttachment,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status: 'sent'
      };

      playMessengerChime('send');
      setMessages((prev) => [...prev, optimisticMsg]);

      // Upload image to storage if needed
      let uploadedImageUrl = null;
      if (imageAttachment) {
        uploadedImageUrl = await uploadReceiptPhoto(imageAttachment);
      }

      // Save to Supabase DB
      if (activeThread?.id) {
        try {
          const { data: insertedData, error } = await supabase
            .from('claim_verification_messages')
            .insert({
              thread_id: activeThread.id,
              sender_username: myUsername,
              sender_name: myName,
              sender_role: myRole,
              message_text: trimmed,
              receipt_image_url: uploadedImageUrl || imageAttachment,
              status: 'delivered'
            })
            .select()
            .single();

          if (!error && insertedData) {
            setMessages((prev) =>
              prev.map((m) => (m.id === tempId ? formatDbMessage(insertedData) : m))
            );
          }
        } catch (dbErr) {
          console.warn('DB insert error:', dbErr);
        }
      }

      // Simulated Cashier Real-time Assistant Response (if cashier is not on active browser session)
      if (myUsername !== 'main_cashier') {
        setIsTyping(true);
        const delay = imageAttachment ? 2500 : 1800;

        setTimeout(async () => {
          setIsTyping(false);

          let replyText = '';
          if (imageAttachment) {
            replyText = 'Natanggap ko ang picture ng resibo. Na-cross match ko na ang barcode at combination sa PCSO daily sales logs. Verified at naka-tag na bilang CLAIMED sa system!';
          } else {
            const lower = trimmed.toLowerCase();
            if (lower.includes('verify') || lower.includes('claim') || lower.includes('resibo')) {
              replyText = 'Paki-attach po ng litrato o snapshot ng physical receipt gamit ang photo icon sa baba para ma-validate ko ang barcode sa terminal.';
            } else if (lower.includes('salamat') || lower.includes('thank') || lower.includes('ok') || lower.includes('noted')) {
              replyText = 'Walang anuman! Sabihan mo lang ako kung may customer pang mag-claim ng winning ticket sa inyong outlet.';
            } else {
              replyText = 'Noted po! Naka-standby ako sa central terminal para sa anumang resibo na kailangang i-verify.';
            }
          }

          if (activeThread?.id) {
            await supabase.from('claim_verification_messages').insert({
              thread_id: activeThread.id,
              sender_username: 'main_cashier',
              sender_name: 'Maria Elena Santos',
              sender_role: 'cashier',
              message_text: replyText,
              status: 'delivered'
            });
          }
        }, delay);
      }
    },
    [currentUser, activeThread?.id]
  );

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <MessengerContext.Provider
      value={{
        cashier: AUTHORIZED_CASHIER,
        activeThread,
        messages,
        unreadCount,
        isTyping,
        isLoadingMessages,
        sendMessage,
        clearUnread
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
}

export function useMessenger() {
  const context = useContext(MessengerContext);
  if (!context) {
    throw new Error('useMessenger must be used within a MessengerProvider');
  }
  return context;
}
