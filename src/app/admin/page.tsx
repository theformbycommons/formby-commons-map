'use client';

import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  getAllLocationsForAdmin,
  updateLocationStatus,
  updateIssueStatus,
  updateLocationDetails,
  deleteLocation,
} from '@/lib/admin-actions';
import type { SuggestedLocation } from '@/lib/types';
import { CATEGORIES, getCategoryConfig } from '@/lib/categories';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Trash2, Edit2, Save, X, RefreshCw, AlertTriangle, LogOut, Lock } from 'lucide-react';

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state
  const [locations, setLocations] = useState<SuggestedLocation[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isLoading, setIsLoading] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
      if (user && user.uid === 'SGHMLAXGWeTj1OdGlnNg6coAs0h2') {
        fetchLocations();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    const data = await getAllLocationsForAdmin();
    setLocations(data);
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setLocations([]);
  };

  // Status Handlers with Error Checks
  const handleStatusChange = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      await updateLocationStatus(id, status);
      setLocations((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch (err: any) {
      alert('Firestore write rejected: ' + err.message);
    }
  };

  const handleIssueStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'resolved' ? 'reported' : 'resolved';
    try {
      await updateIssueStatus(id, nextStatus);
      setLocations((prev) => prev.map((item) => (item.id === id ? { ...item, issueStatus: nextStatus } : item)));
    } catch (err: any) {
      alert('Firestore write rejected: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this report?')) return;
    try {
      await deleteLocation(id);
      setLocations((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert('Firestore delete rejected: ' + err.message);
    }
  };

  const startEditing = (item: SuggestedLocation) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDescription(item.description || '');
    setEditCategory(item.category);
  };

  const saveEditing = async (id: string) => {
    try {
      await updateLocationDetails(id, {
        name: editName,
        description: editDescription,
        category: editCategory,
      });
      setLocations((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, name: editName, description: editDescription, category: editCategory }
            : item
        )
      );
      setEditingId(null);
    } catch (err: any) {
      alert('Firestore update rejected: ' + err.message);
    }
  };

  if (authChecking) {
    return <div className="text-center py-20 text-xs text-slate-400">Verifying security session...</div>;
  }

  // Render Login Form if Unauthenticated or Wrong UID
  if (!currentUser || currentUser.uid !== 'SGHMLAXGWeTj1OdGlnNg6coAs0h2') {
    return (
      <div className="max-w-md mx-auto my-12 p-6 border rounded-xl shadow-sm bg-white space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
          <Lock className="w-5 h-5 text-emerald-600" />
          Admin Authentication
        </div>
        <p className="text-xs text-slate-500">Sign in to manage community suggestions.</p>

        <form onSubmit={handleLogin} className="space-y-3">
          <Input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-xs"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="text-xs"
          />
          {loginError && <p className="text-xs text-red-500 font-medium">{loginError}</p>}
          <Button type="submit" disabled={isLoggingIn} className="w-full text-xs bg-slate-900">
            {isLoggingIn ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    );
  }

  // Render Admin Control Panel
  const filteredLocations = locations.filter((loc) => loc.status === activeTab);
  const pendingCount = locations.filter((l) => l.status === 'pending').length;
  const approvedCount = locations.filter((l) => l.status === 'approved').length;
  const rejectedCount = locations.filter((l) => l.status === 'rejected').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Control Panel</h1>
          <p className="text-xs text-slate-500">Review, approve, and curate Formby community actions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchLocations} className="text-xs flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLogout} className="text-xs text-red-600 flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" />
            Exit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl text-center text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'pending' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'approved' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'rejected' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading submissions...</div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-xs">
          No items currently in {activeTab}.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLocations.map((item) => {
            const isEditing = editingId === item.id;
            const catConfig = getCategoryConfig(item.category);
            const isResolved = item.issueStatus === 'resolved';

            return (
              <Card key={item.id} className="border border-slate-200 shadow-sm">
                {isEditing ? (
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Title</label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-xs" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white"
                      >
                        {Object.values(CATEGORIES).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Description</label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="text-xs h-20"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => saveEditing(item.id)} className="bg-slate-900 text-xs gap-1">
                        <Save className="w-3.5 h-3.5" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="text-xs gap-1">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: catConfig.color }}
                          />
                          <CardTitle className="text-sm font-bold text-slate-900">{item.name}</CardTitle>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{catConfig.label}</span>
                          <span>•</span>
                          <span>Reporter: {item.suggesterName}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(item)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </CardHeader>

                    <CardContent className="px-4 pb-3 text-xs text-slate-600 leading-relaxed">
                      {item.description || <span className="italic text-slate-400">No description provided.</span>}
                    </CardContent>

                    <CardFooter className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      {item.status === 'approved' && (
                        <button
                          onClick={() => handleIssueStatusToggle(item.id, item.issueStatus)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1 transition-colors ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isResolved ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Status: Resolved
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" /> Status: Reported
                            </>
                          )}
                        </button>
                      )}

                      <div className="flex items-center gap-1.5 ml-auto">
                        {item.status !== 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(item.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-2.5 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </Button>
                        )}

                        {item.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(item.id, 'rejected')}
                            className="text-amber-700 border-amber-200 hover:bg-amber-50 text-xs h-8 px-2.5 flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardFooter>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
