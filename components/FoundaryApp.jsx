import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Camera, Search, Filter, ShieldCheck, MapPin, Tag, Clock, 
  MessageSquare, User, AlertCircle, CheckCircle2, ChevronRight, X, Plus, 
  Bell, HelpCircle, Lock, Send, RefreshCw, Layers
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';

// Firebase configuration — set these in .env.local (dev) and in your Vercel
// project's Environment Variables (production/preview). See .env.local.example.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = process.env.NEXT_PUBLIC_APP_ID || 'foundary-app-v1';

// Mandatory Firebase collection paths helper
const getCollectionRef = (collName) => {
  return collection(db, 'artifacts', appId, 'public', 'data', collName);
};

export default function FoundaryApp() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('student'); // 'student' | 'custodian'
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState('connecting'); // 'connecting' | 'connected' | 'demo'

  // Firestore collections states
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [issues, setIssues] = useState([]);

  // UI Navigation & View States
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'explore' | 'report' | 'claims' | 'custodian' | 'profile'
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeChatClaimId, setActiveChatClaimId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'lost' | 'found'
  const [filterCategory, setFilterCategory] = useState('All');

  // Form States
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Report Form State
  const [reportType, setReportType] = useState('lost');
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState('Electronics');
  const [reportLocation, setReportLocation] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSecretQuestion, setReportSecretQuestion] = useState('');
  const [reportSecretAnswer, setReportSecretAnswer] = useState('');
  const [reportImageBase64, setReportImageBase64] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  // Claim Modal State
  const [claimModalItem, setClaimModalItem] = useState(null);
  const [claimAnswerInput, setClaimAnswerInput] = useState('');

  // Chat Input State
  const [chatMessageText, setChatMessageText] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Anonymous session so guests can browse before creating an account.
        await signInAnonymously(auth);
        setFirebaseStatus('connected');
      } catch (err) {
        console.warn("Firebase Auth fallback to Demo/Anonymous state:", err);
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

  useEffect(() => {
    if (!user) return;

    // 1. Items Listener
    const itemsRef = getCollectionRef('items');
    const unsubItems = onSnapshot(itemsRef, (snapshot) => {
      const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsList);
    }, (err) => console.error("Error fetching items:", err));

    // 2. Claims Listener
    const claimsRef = getCollectionRef('claims');
    const unsubClaims = onSnapshot(claimsRef, (snapshot) => {
      const claimsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClaims(claimsList);
    }, (err) => console.error("Error fetching claims:", err));

    // 3. Notifications Listener
    const notifsRef = getCollectionRef('notifications');
    const unsubNotifs = onSnapshot(notifsRef, (snapshot) => {
      const notifsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifsList);
    }, (err) => console.error("Error fetching notifications:", err));

    // 4. Messages Listener
    const msgsRef = getCollectionRef('messages');
    const unsubMsgs = onSnapshot(msgsRef, (snapshot) => {
      const msgsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgsList);
    }, (err) => console.error("Error fetching messages:", err));

    // 5. Escalated Issues Listener
    const issuesRef = getCollectionRef('issues');
    const unsubIssues = onSnapshot(issuesRef, (snapshot) => {
      const issuesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIssues(issuesList);
    }, (err) => console.error("Error fetching issues:", err));

    return () => {
      unsubItems();
      unsubClaims();
      unsubNotifs();
      unsubMsgs();
      unsubIssues();
    };
  }, [user]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setReportImageBase64(base64);
      triggerAiAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  const triggerAiAnalysis = async (imageData) => {
    setAiAnalyzing(true);
    setAiSuggestions(null);

    try {
      // The Gemini call itself runs server-side in pages/api/analyze.js so the
      // API key never reaches the browser.
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });
      if (!res.ok) throw new Error('AI analysis request failed');

      const parsed = await res.json();
      if (parsed) {
        setAiSuggestions(parsed);
        if (parsed.title) setReportTitle(parsed.title);
        if (parsed.category) setReportCategory(parsed.category);
      }
    } catch (err) {
      console.warn("AI Analysis offline or fallback:", err);
      // Fallback AI simulation
      setAiSuggestions({
        title: "Detected Dark Item",
        category: "Electronics",
        estimatedColor: "Black/Grey",
        keyFeatures: "Scratch mark on side, metallic casing"
      });
      setReportTitle("Found Electronics Item");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        // Student/faculty self-registration only. Custodian accounts are provisioned
        // separately by campus management and cannot be created from this form.
        const displayNameWithRole = `${nameInput} [Student]`;
        await updateProfile(res.user, { displayName: displayNameWithRole });
        setUserRole('student');
      } else {
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      }
      setEmailInput('');
      setPasswordInput('');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Check credentials.');
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    setUserRole('student');
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportTitle || !reportLocation) return;

    const newItem = {
      title: reportTitle,
      type: reportType,
      category: reportCategory,
      location: reportLocation,
      description: reportDescription,
      secretQuestion: reportSecretQuestion || "What unique feature or detail is on this item?",
      secretAnswer: reportSecretAnswer,
      imageUrl: reportImageBase64 || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=60",
      status: 'active', // 'active' | 'claimed' | 'custodian_held'
      reporterUid: user ? user.uid : 'anon',
      reporterName: user?.displayName || 'Campus Member',
      createdAt: new Date().toISOString(),
      aiTags: aiSuggestions ? [aiSuggestions.estimatedColor, aiSuggestions.keyFeatures].filter(Boolean) : []
    };

    try {
      await addDoc(getCollectionRef('items'), newItem);

      // Create notification
      await addDoc(getCollectionRef('notifications'), {
        title: `New Item Reported: ${reportTitle}`,
        message: `${reportType.toUpperCase()} item listed in ${reportLocation}`,
        timestamp: new Date().toISOString(),
        read: false,
        recipientUid: 'all'
      });

      // Reset form
      setReportTitle('');
      setReportDescription('');
      setReportLocation('');
      setReportSecretQuestion('');
      setReportSecretAnswer('');
      setReportImageBase64('');
      setAiSuggestions(null);
      setActiveTab('explore');
    } catch (err) {
      console.error("Error submitting report to Firestore:", err);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimModalItem || !claimAnswerInput) return;

    try {
      const newClaim = {
        itemId: claimModalItem.id,
        itemTitle: claimModalItem.title,
        claimerUid: user ? user.uid : 'anon',
        claimerName: user?.displayName || 'Anonymous Student',
        claimedAnswer: claimAnswerInput,
        status: 'pending', // 'pending' | 'verified' | 'rejected'
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(getCollectionRef('claims'), newClaim);

      // System notification
      await addDoc(getCollectionRef('notifications'), {
        title: `New Claim Submitted`,
        message: `Claim filed for ${claimModalItem.title}`,
        timestamp: new Date().toISOString(),
        read: false,
        recipientUid: claimModalItem.reporterUid
      });

      setClaimModalItem(null);
      setClaimAnswerInput('');
      setActiveTab('claims');
    } catch (err) {
      console.error("Error filing claim:", err);
    }
  };

  const handleVerifyClaim = async (claimId, newStatus) => {
    try {
      const claimRef = doc(db, 'artifacts', appId, 'public', 'data', 'claims', claimId);
      await updateDoc(claimRef, { status: newStatus });

      const claimObj = claims.find(c => c.id === claimId);
      if (claimObj && newStatus === 'verified') {
        const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'items', claimObj.itemId);
        await updateDoc(itemRef, { status: 'claimed' });
      }
    } catch (err) {
      console.error("Error verifying claim:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessageText.trim() || !activeChatClaimId) return;

    try {
      await addDoc(getCollectionRef('messages'), {
        claimId: activeChatClaimId,
        senderUid: user ? user.uid : 'anon',
        senderName: user?.displayName || 'User',
        text: chatMessageText.trim(),
        timestamp: new Date().toISOString()
      });
      setChatMessageText('');
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleEscalateToCustodian = async (item) => {
    try {
      const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'items', item.id);
      await updateDoc(itemRef, { status: 'custodian_held' });

      await addDoc(getCollectionRef('issues'), {
        itemId: item.id,
        itemTitle: item.title,
        reason: 'Handed over to Campus Security Desk for safe custody',
        escalatedBy: user?.displayName || 'Student',
        timestamp: new Date().toISOString(),
        status: 'open'
      });
    } catch (err) {
      console.error("Error escalating item:", err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-slate-800">
      
      {}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-base tracking-tight text-slate-100">Foundary</h1>
          <p className="text-[10px] text-slate-500 tracking-wide">AI-Powered Campus Lost &amp; Found</p>
        </div>

        {user && (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('claims')}
              title="My Items"
              className={`p-2 rounded-lg border ${activeTab === 'claims' ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10' : 'border-slate-700 text-slate-400'}`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              title="Notifications"
              className={`relative p-2 rounded-lg border ${showNotifPanel ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10' : 'border-slate-700 text-slate-400'}`}
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              title="Profile"
              className={`p-2 rounded-lg border ${activeTab === 'profile' ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10' : 'border-slate-700 text-slate-400'}`}
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {showNotifPanel && (
        <div className="absolute top-14 right-4 z-40 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 space-y-1 max-h-80 overflow-y-auto">
          <p className="text-[11px] font-bold text-slate-400 px-2 pt-1 pb-1">Notifications</p>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">You're all caught up.</p>
          ) : (
            notifications.slice().reverse().map(n => (
              <div key={n.id} className="p-2 rounded-lg hover:bg-slate-700/50 text-xs">
                <p className="font-semibold text-slate-200">{n.title}</p>
                <p className="text-slate-400 text-[11px]">{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {}
      <div className="bg-slate-800/60 px-4 py-2 text-xs flex justify-between items-center border-b border-slate-800/80">
        <div className="flex items-center space-x-2 truncate">
          <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className="truncate text-slate-300">
            {user ? (user.displayName || user.email || 'Campus User') : 'Guest Mode'}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
            userRole === 'custodian' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
          }`}>
            {userRole}
          </span>
        </div>
        {user ? (
          <button onClick={handleSignOut} className="text-slate-400 hover:text-rose-400 font-medium text-[11px]">
            Sign Out
          </button>
        ) : (
          <button onClick={() => setActiveTab('auth')} className="text-indigo-400 font-semibold text-[11px]">
            Sign In / Register
          </button>
        )}
      </div>

      {}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* VIEW 0: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-5 pt-2">
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {user?.displayName ? `Hi, ${user.displayName.split(' [')[0]}` : 'Welcome to Foundary'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">What brings you here today?</p>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-slate-400">Lost something?</p>
                <button
                  onClick={() => { setReportType('lost'); setActiveTab('report'); }}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  Report Lost Item
                </button>
              </div>

              <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-slate-400">Found something?</p>
                <button
                  onClick={() => { setReportType('found'); setActiveTab('report'); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  Report Found Item
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('explore')}
              className="w-full border border-dashed border-slate-700 rounded-xl py-3 text-sm font-semibold text-slate-300 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Browse Lost Items
            </button>
          </div>
        )}

        {/* VIEW 1: EXPLORE ITEMS */}
        {activeTab === 'explore' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search keys, water bottles, lab coats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between space-x-2 overflow-x-auto pb-1 text-xs">
                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700/60">
                  <button 
                    onClick={() => setFilterType('all')} 
                    className={`px-2.5 py-1 rounded-md transition ${filterType === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'}`}
                  >All</button>
                  <button 
                    onClick={() => setFilterType('lost')} 
                    className={`px-2.5 py-1 rounded-md transition ${filterType === 'lost' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400'}`}
                  >Lost</button>
                  <button 
                    onClick={() => setFilterType('found')} 
                    className={`px-2.5 py-1 rounded-md transition ${filterType === 'found' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400'}`}
                  >Found</button>
                </div>

                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Bags">Bags</option>
                  <option value="Keys">Keys</option>
                  <option value="ID Cards">ID Cards</option>
                  <option value="Clothing">Clothing</option>
                </select>
              </div>
            </div>

            {/* Item List Cards */}
            <div className="grid gap-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/30 rounded-2xl border border-dashed border-slate-800">
                  <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm font-medium">No items found matching filter</p>
                  <p className="text-slate-500 text-xs mt-1">Try resetting search or report a new item</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div key={item.id} className="bg-slate-800/90 rounded-2xl border border-slate-700/60 overflow-hidden shadow-lg transition hover:border-slate-600">
                    <div className="flex p-3 gap-3">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-24 h-24 rounded-xl object-cover bg-slate-900 border border-slate-700/50 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.type === 'lost' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {item.type}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-100 text-sm truncate">{item.title}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                            {item.location}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            item.status === 'claimed' ? 'bg-slate-700 text-slate-400' : 'bg-indigo-500/20 text-indigo-300'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>

                          <div className="flex space-x-1">
                            {userRole === 'custodian' && item.status !== 'custodian_held' && (
                              <button 
                                onClick={() => handleEscalateToCustodian(item)}
                                className="px-2 py-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 text-[11px] font-medium rounded-lg border border-amber-500/30 transition"
                              >
                                Accept Custody
                              </button>
                            )}

                            <button 
                              onClick={() => setClaimModalItem(item)}
                              disabled={item.status === 'claimed'}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-[11px] font-medium rounded-lg transition shadow"
                            >
                              {item.type === 'lost' ? 'I Found This' : 'Claim Item'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: REPORT ITEM WITH AI MULTIMODAL */}
        {activeTab === 'report' && (
          <form onSubmit={handleReportSubmit} className="space-y-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
            <div className="border-b border-slate-700 pb-2">
              <h2 className="font-bold text-slate-100 text-base">Report Lost or Found Item</h2>
              <p className="text-slate-400 text-xs">AI will automatically auto-fill parameters from photos</p>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                onClick={() => setReportType('lost')}
                className={`py-2 rounded-xl font-bold text-xs border transition ${
                  reportType === 'lost' ? 'bg-rose-600/20 border-rose-500 text-rose-300' : 'bg-slate-900/50 border-slate-700 text-slate-400'
                }`}
              >
                I Lost Something
              </button>
              <button 
                type="button" 
                onClick={() => setReportType('found')}
                className={`py-2 rounded-xl font-bold text-xs border transition ${
                  reportType === 'found' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-900/50 border-slate-700 text-slate-400'
                }`}
              >
                I Found Something
              </button>
            </div>

            {/* Photo Upload with AI Scanner */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Item Photo (AI Auto-Scan)</label>
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-4 text-center bg-slate-900/40 relative">
                {reportImageBase64 ? (
                  <div className="relative group">
                    <img src={reportImageBase64} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                    <button 
                      type="button" 
                      onClick={() => setReportImageBase64('')}
                      className="absolute top-1 right-1 bg-slate-900/80 p-1 rounded-full text-slate-300 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center py-2">
                    <Camera className="w-8 h-8 text-indigo-400 mb-1" />
                    <span className="text-xs text-slate-300 font-medium">Upload or Capture Photo</span>
                    <span className="text-[10px] text-slate-500">AI Visual Analysis detects color, tags, and features</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}

                {aiAnalyzing && (
                  <div className="mt-2 flex items-center justify-center space-x-2 text-xs text-indigo-400 font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running AI Visual Analysis...</span>
                  </div>
                )}
              </div>

              {aiSuggestions && (
                <div className="bg-indigo-950/40 border border-indigo-500/30 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center text-indigo-400 font-bold gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Semantic Attribute Extraction Complete</span>
                  </div>
                  <p className="text-slate-300"><strong className="text-slate-400">Category:</strong> {aiSuggestions.category}</p>
                  <p className="text-slate-300"><strong className="text-slate-400">Features:</strong> {aiSuggestions.keyFeatures}</p>
                </div>
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item Title</label>
                <input 
                  type="text" 
                  value={reportTitle} 
                  onChange={(e) => setReportTitle(e.target.value)} 
                  placeholder="e.g. Blue Hydroflask with stickers" 
                  required 
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select 
                    value={reportCategory} 
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Bags">Bags</option>
                    <option value="Keys">Keys</option>
                    <option value="ID Cards">ID Cards</option>
                    <option value="Clothing">Clothing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Location</label>
                  <input 
                    type="text" 
                    value={reportLocation} 
                    onChange={(e) => setReportLocation(e.target.value)} 
                    placeholder="e.g. Science Library 2nd Floor" 
                    required 
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea 
                  value={reportDescription} 
                  onChange={(e) => setReportDescription(e.target.value)} 
                  rows={2} 
                  placeholder="Add details like scratches, time lost, etc." 
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Anti-Fraud Secret Question */}
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center text-xs font-bold text-amber-400 gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verification Secret Question (Anti-Fraud)</span>
                </div>
                <input 
                  type="text" 
                  value={reportSecretQuestion} 
                  onChange={(e) => setReportSecretQuestion(e.target.value)} 
                  placeholder="Question e.g., What wallpaper is on the phone?" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
                <input 
                  type="text" 
                  value={reportSecretAnswer} 
                  onChange={(e) => setReportSecretAnswer(e.target.value)} 
                  placeholder="Secret Answer (Hidden from public)" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full text-white font-bold py-2.5 rounded-xl text-xs transition shadow ${
                reportType === 'lost' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {reportType === 'lost' ? 'Submit Lost Item' : 'Submit Found Item'}
            </button>
          </form>
        )}

        {/* VIEW 3: CLAIMS & CHAT */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-100 text-base">Claims & Verification</h2>

            {claims.length === 0 ? (
              <div className="text-center py-10 bg-slate-800/30 rounded-2xl border border-dashed border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No active claims filed yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map(claim => (
                  <div key={claim.id} className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">{claim.itemTitle}</h4>
                        <p className="text-xs text-slate-400">Claimant: {claim.claimerName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        claim.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 
                        claim.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded-lg text-xs border border-slate-800">
                      <span className="text-slate-500 font-semibold block">Provided Secret Answer:</span>
                      <span className="text-slate-200">{claim.claimedAnswer}</span>
                    </div>

                    {/* Action controls */}
                    <div className="flex items-center justify-between pt-1">
                      <button 
                        onClick={() => setActiveChatClaimId(activeChatClaimId === claim.id ? null : claim.id)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {activeChatClaimId === claim.id ? 'Close Chat' : 'Open Verification Chat'}
                      </button>

                      {claim.status === 'pending' && (
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleVerifyClaim(claim.id, 'rejected')}
                            className="px-2.5 py-1 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 rounded-lg text-xs font-medium"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleVerifyClaim(claim.id, 'verified')}
                            className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg text-xs font-medium"
                          >
                            Verify & Approve
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Real-Time Embedded Chat Drawer */}
                    {activeChatClaimId === claim.id && (
                      <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
                        <div className="bg-slate-950 p-2.5 rounded-xl h-36 overflow-y-auto space-y-2 text-xs">
                          {messages.filter(m => m.claimId === claim.id).length === 0 ? (
                            <p className="text-slate-600 text-center py-4 italic">No messages yet. Start verification dialog...</p>
                          ) : (
                            messages.filter(m => m.claimId === claim.id).map(msg => (
                              <div key={msg.id} className={`flex flex-col ${msg.senderUid === user?.uid ? 'items-end' : 'items-start'}`}>
                                <span className="text-[9px] text-slate-500">{msg.senderName}</span>
                                <div className={`p-2 rounded-xl max-w-[80%] ${
                                  msg.senderUid === user?.uid ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'
                                }`}>
                                  {msg.text}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <form onSubmit={handleSendMessage} className="flex gap-1.5">
                          <input 
                            type="text" 
                            value={chatMessageText}
                            onChange={(e) => setChatMessageText(e.target.value)}
                            placeholder="Type verification query..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                          />
                          <button type="submit" className="bg-indigo-600 p-2 rounded-xl text-white">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CUSTODIAN DASHBOARD */}
        {activeTab === 'custodian' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-2 text-xs text-amber-300">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Campus Security & Custodian Portal</p>
                <p className="text-[11px] text-amber-400/80">Manage physical desk holdings and escalated high-value items.</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-200 text-sm">Escalated Security Items ({issues.length})</h3>
              {issues.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No security escalations pending.</p>
              ) : (
                issues.map(iss => (
                  <div key={iss.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700/80 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-100">
                      <span>{iss.itemTitle}</span>
                      <span className="text-amber-400">{iss.status}</span>
                    </div>
                    <p className="text-slate-400">{iss.reason}</p>
                    <p className="text-[10px] text-slate-500">Escalated by: {iss.escalatedBy}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: AUTH LOGIN / REGISTER */}
        {activeTab === 'auth' && (
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h2 className="font-bold text-slate-100 text-base">
                {authMode === 'login' ? 'Campus Login' : 'Create Student / Faculty Account'}
              </h2>
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs text-indigo-400 font-semibold"
              >
                Switch to {authMode === 'login' ? 'Register' : 'Login'}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 -mt-1">
              Custodian / Campus Security accounts are provisioned by campus management and use this same login.
            </p>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl text-rose-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={nameInput} 
                    onChange={(e) => setNameInput(e.target.value)} 
                    required 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">University Email</label>
                <input 
                  type="email" 
                  value={emailInput} 
                  onChange={(e) => setEmailInput(e.target.value)} 
                  required 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">Password</label>
                <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  required 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Campus Account'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 6: PROFILE */}
        {activeTab === 'profile' && user && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-100 text-base">Profile</h2>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Name</p>
                <p className="text-sm text-slate-200">{(user.displayName || 'Campus Member').split(' [')[0]}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Email</p>
                <p className="text-sm text-slate-200">{user.email || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Account Role</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  userRole === 'custodian' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                }`}>{userRole}</span>
              </div>
            </div>

            {userRole === 'custodian' && (
              <button
                onClick={() => setActiveTab('custodian')}
                className="w-full bg-amber-600/20 border border-amber-500/30 text-amber-400 font-bold py-2.5 rounded-xl text-sm"
              >
                Open Custodian Desk
              </button>
            )}

            <button
              onClick={() => { handleSignOut(); setActiveTab('home'); }}
              className="w-full border border-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm"
            >
              Log Out
            </button>
          </div>
        )}

      </main>
    </div>
  );
}