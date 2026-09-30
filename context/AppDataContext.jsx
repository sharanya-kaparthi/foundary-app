import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebase, getCollectionRef, appId } from '../lib/firebase';
import { humanizeFirebaseError } from '../lib/constants';
import { aiTagsFrom } from '../lib/aiResult';

const AppDataContext = createContext(null);

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}

export function AppDataProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('student'); // 'student' | 'custodian'
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState('connecting'); // 'connecting' | 'connected' | 'demo'

  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [issues, setIssues] = useState([]);

  const [isOnline, setIsOnline] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message });
  }, []);

  // ---- Network status banner (real, needs no backend) ----
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // ---- Auth bootstrap — identical logic to the original single-file app ----
  useEffect(() => {
    const { auth } = getFirebase();
    if (!auth) return;

    const initAuth = async () => {
      try {
        // Anonymous session so guests can browse before creating an account.
        await signInAnonymously(auth);
        setFirebaseStatus('connected');
      } catch (err) {
        console.warn('Firebase Auth fallback to Demo/Anonymous state:', err);
        setFirebaseStatus('demo');
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName && currentUser.displayName.includes('[Custodian]')) {
        setUserRole('custodian');
      } else {
        setUserRole('student');
      }
    });

    return () => unsubscribe();
  }, []);

  // ---- Firestore listeners — same five collections, same paths ----
  useEffect(() => {
    if (!user) return;

    const unsubItems = onSnapshot(getCollectionRef('items'), (snapshot) => {
      setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('Error fetching items:', err));

    const unsubClaims = onSnapshot(getCollectionRef('claims'), (snapshot) => {
      setClaims(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('Error fetching claims:', err));

    const unsubNotifs = onSnapshot(getCollectionRef('notifications'), (snapshot) => {
      setNotifications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('Error fetching notifications:', err));

    const unsubMsgs = onSnapshot(getCollectionRef('messages'), (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('Error fetching messages:', err));

    const unsubIssues = onSnapshot(getCollectionRef('issues'), (snapshot) => {
      setIssues(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('Error fetching issues:', err));

    return () => {
      unsubItems();
      unsubClaims();
      unsubNotifs();
      unsubMsgs();
      unsubIssues();
    };
  }, [user]);

  // ---- Auth actions ----
  const loginWithEmail = useCallback(async (email, password) => {
    const { auth } = getFirebase();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: humanizeFirebaseError(err.code || err.message) };
    }
  }, []);

  const registerWithEmail = useCallback(async (name, email, password) => {
    const { auth } = getFirebase();
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      // Student/faculty self-registration only. Custodian accounts are
      // provisioned separately by campus management.
      await updateProfile(res.user, { displayName: `${name} [Student]` });
      setUserRole('student');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: humanizeFirebaseError(err.code || err.message) };
    }
  }, []);

  const sendResetEmail = useCallback(async (email) => {
    const { auth } = getFirebase();
    try {
      await sendPasswordResetEmail(auth, email);
      return { ok: true };
    } catch (err) {
      // Never reveal whether an account exists for this email.
      return { ok: true };
    }
  }, []);

  const handleSignOut = useCallback(() => {
    const { auth } = getFirebase();
    signOut(auth);
    setUserRole('student');
  }, []);

  const deleteAccount = useCallback(async () => {
    const { auth } = getFirebase();
    try {
      await deleteUser(auth.currentUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: humanizeFirebaseError(err.code || err.message) };
    }
  }, []);

  // ---- AI photo analysis — same server route, same fallback behavior ----
  const triggerAiAnalysis = useCallback(async (imageData) => {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });
      if (!res.ok) throw new Error('AI analysis request failed');
      const parsed = await res.json();
      return parsed;
    } catch (err) {
      console.warn('AI Analysis offline or fallback:', err);
      return {
        title: 'Detected Dark Item',
        category: 'Electronics',
        estimatedColor: 'Black/Grey',
        keyFeatures: 'Scratch mark on side, metallic casing'
      };
    }
  }, []);

  // ---- Item reporting — same Firestore shape as before ----
  const submitReport = useCallback(async (report) => {
    const newItem = {
      title: report.title,
      type: report.type,
      category: report.category,
      location: report.location,
      description: report.description,
      brand: report.brand || '',
      color: report.color || '',
      distinguishingFeatures: report.distinguishingFeatures || '',
      eventDate: report.eventDate || '',
      secretQuestion: report.type === 'found' ? (report.secretQuestion || 'What unique feature or detail is on this item?') : '',
      secretAnswer: report.type === 'found' ? (report.secretAnswer || '') : '',
      imageUrl: report.imageBase64 || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=60',
      status: 'active',
      reporterUid: user ? user.uid : 'anon',
      reporterName: user?.displayName || 'Campus Member',
      createdAt: new Date().toISOString(),
      // Always a flat array of strings — Firestore rejects nested arrays.
      aiTags: aiTagsFrom(report.aiSuggestions)
    };

    const docRef = await addDoc(getCollectionRef('items'), newItem);

    await addDoc(getCollectionRef('notifications'), {
      title: `New Item Reported: ${report.title}`,
      message: `${report.type.toUpperCase()} item listed in ${report.location}`,
      timestamp: new Date().toISOString(),
      read: false,
      recipientUid: 'all',
      itemId: docRef.id
    });

    return docRef.id;
  }, [user]);

  const deleteItem = useCallback(async (itemId) => {
    await deleteDoc(doc(getFirebase().db, 'artifacts', appId, 'public', 'data', 'items', itemId));
  }, []);

  // ---- Claims / verification ----
  const submitClaim = useCallback(async (item, claimedAnswer) => {
    const newClaim = {
      itemId: item.id,
      itemTitle: item.title,
      claimerUid: user ? user.uid : 'anon',
      claimerName: user?.displayName || 'Anonymous Student',
      claimedAnswer,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(getCollectionRef('claims'), newClaim);

    await addDoc(getCollectionRef('notifications'), {
      title: 'New Claim Submitted',
      message: `Claim filed for ${item.title}`,
      timestamp: new Date().toISOString(),
      read: false,
      recipientUid: item.reporterUid,
      itemId: item.id
    });

    // A correct answer verifies the CLAIM only (which opens the chat). It must
    // not change item.status — the claimant's explicit "I Received the Item"
    // action in the chat (confirmItemClaimed) is the only thing that does.
    // If another claim on this item is already verified, leave this one pending.
    const alreadyHasVerifiedClaim = claims.some((c) => c.itemId === item.id && c.status === 'verified');
    const isCorrect = Boolean(
      item.secretAnswer &&
      item.status !== 'claimed' &&
      !alreadyHasVerifiedClaim &&
      claimedAnswer.trim().toLowerCase() === item.secretAnswer.trim().toLowerCase()
    );

    if (isCorrect) {
      await updateDoc(doc(getFirebase().db, 'artifacts', appId, 'public', 'data', 'claims', docRef.id), { status: 'verified' });
    }

    return { id: docRef.id, verified: isCorrect };
  }, [user, claims]);

  // Approves or rejects a CLAIM. This never changes item.status: a verified
  // claim only opens the handover chat. See confirmItemClaimed below.
  const handleVerifyClaim = useCallback(async (claimId, newStatus) => {
    const claimObj = claims.find((c) => c.id === claimId);
    if (
      newStatus === 'verified' && claimObj &&
      claims.some((c) => c.itemId === claimObj.itemId && c.id !== claimId && c.status === 'verified')
    ) {
      throw new Error('Another claim on this item is already verified.');
    }
    const claimRef = doc(getFirebase().db, 'artifacts', appId, 'public', 'data', 'claims', claimId);
    await updateDoc(claimRef, { status: newStatus });
  }, [claims]);

  // The ONLY place an item becomes 'claimed'. Called when the claimant
  // explicitly confirms receipt (chat button, or the item page for items held
  // at a trusted place). Reads fresh docs so it doesn't trust stale UI state.
  const confirmItemClaimed = useCallback(async (claimId) => {
    if (!user) throw new Error('You need to be signed in.');
    const { db } = getFirebase();
    const claimSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'claims', claimId));
    if (!claimSnap.exists()) throw new Error('Claim not found.');
    const claim = claimSnap.data();
    if (claim.claimerUid !== user.uid) throw new Error('Only the claimant can confirm receipt.');
    if (claim.status !== 'verified') throw new Error('This claim has not been verified yet.');

    const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'items', claim.itemId);
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) throw new Error('Item not found.');
    const current = itemSnap.data().status;
    if (current === 'claimed') return { alreadyClaimed: true };
    if (current !== 'active' && current !== 'custodian_held') throw new Error('This item cannot be marked as claimed.');

    await updateDoc(itemRef, {
      status: 'claimed',
      claimedAt: new Date().toISOString(),
      claimedByUid: user.uid,
      claimedViaClaimId: claimId
    });
    return { alreadyClaimed: false };
  }, [user]);

  // ---- Messaging ----
  const sendMessage = useCallback(async (claimId, text) => {
    if (!text.trim()) return;
    await addDoc(getCollectionRef('messages'), {
      claimId,
      senderUid: user ? user.uid : 'anon',
      senderName: user?.displayName || 'User',
      text: text.trim(),
      timestamp: new Date().toISOString()
    });
  }, [user]);

  // ---- Custodian: escalate an item to campus security custody ----
  const handleEscalateToCustodian = useCallback(async (item) => {
    const itemRef = doc(getFirebase().db, 'artifacts', appId, 'public', 'data', 'items', item.id);
    await updateDoc(itemRef, { status: 'custodian_held', heldAt: new Date().toISOString() });

    await addDoc(getCollectionRef('issues'), {
      itemId: item.id,
      itemTitle: item.title,
      reason: 'Handed over to Campus Security Desk for safe custody',
      escalatedBy: user?.displayName || 'Student',
      timestamp: new Date().toISOString(),
      status: 'open',
      kind: 'escalation'
    });
  }, [user]);

  const handleMarkUnclaimed = useCallback(async (item) => {
    const itemRef = doc(getFirebase().db, 'artifacts', appId, 'public', 'data', 'items', item.id);
    await updateDoc(itemRef, { status: 'unclaimed' });

    await addDoc(getCollectionRef('issues'), {
      itemId: item.id,
      itemTitle: item.title,
      reason: 'Item held for over 3 days without a successful recovery — escalated to management.',
      escalatedBy: user?.displayName || 'Trusted Place',
      timestamp: new Date().toISOString(),
      status: 'open',
      kind: 'unclaimed_escalation'
    });
  }, [user]);

  // ---- User-facing issue reports — same collection/pattern as escalation above ----
  const reportIssue = useCallback(async ({ item, issueType, description }) => {
    await addDoc(getCollectionRef('issues'), {
      itemId: item?.id || null,
      itemTitle: item?.title || 'General issue',
      reason: description,
      issueType,
      escalatedBy: user?.displayName || 'Student',
      reportedByUid: user ? user.uid : 'anon',
      timestamp: new Date().toISOString(),
      status: 'open',
      kind: 'user_report'
    });
  }, [user]);

  const markNotificationsRead = useCallback(() => {
    // Notifications are shared/broadcast documents in this schema (no per-user
    // read receipts field). Marking-as-read is tracked locally per browser.
    if (typeof window === 'undefined') return;
    const ids = notifications.map((n) => n.id);
    window.localStorage.setItem('foundary:read-notifications', JSON.stringify(ids));
  }, [notifications]);

  const readNotificationIds = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.localStorage.getItem('foundary:read-notifications') || '[]');
    } catch {
      return [];
    }
  }, [notifications]);

  const value = {
    user, userRole, authLoading, firebaseStatus, isOnline,
    items, claims, notifications, messages, issues,
    toast, showToast, dismissToast: () => setToast(null),
    loginWithEmail, registerWithEmail, sendResetEmail, handleSignOut, deleteAccount,
    triggerAiAnalysis, submitReport, deleteItem,
    submitClaim, handleVerifyClaim, confirmItemClaimed, sendMessage,
    handleEscalateToCustodian, handleMarkUnclaimed, reportIssue,
    markNotificationsRead, readNotificationIds
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
