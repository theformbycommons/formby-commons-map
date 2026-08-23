'use client';

import React, { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Trash2, Edit2, Save, X, RefreshCw, AlertTriangle } from 'lucide-react';

export default function AdminDashboardPage() {
  const [locations, setLocations] = useState<SuggestedLocation[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  // Edit Mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const fetchLocations = async () => {
    setIsLoading(true);
    const data = await getAllLocationsForAdmin();
    setLocations(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Quick Action Handlers
  const handleStatusChange = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    setLocations((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    await updateLocationStatus(id, status);
  };

  const handleIssueStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'resolved' ? 'reported' : 'resolved';
    setLocations((prev) => prev.map((item) => (item.id === id ? { ...item, issueStatus: nextStatus } : item)));
    await updateIssueStatus(id, nextStatus);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this report?')) return;
    setLocations((prev) => prev.filter((item) => item.id !== id));
    await deleteLocation(id);
  };

  // Inline Edit Handlers
  const startEditing = (item: SuggestedLocation) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDescription(item.description || '');
    setEditCategory(item.category);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async (id: string) => {
    setLocations((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, name: editName, description: editDescription, category: editCategory }
          : item
      )
    );
    setEditingId(null);
    await updateLocationDetails(id, {
      name: editName,
      description: editDescription,
      category: editCategory,
    });
  };

  const filteredLocations = locations.filter((loc) => loc.status === activeTab);

  const pendingCount = locations.filter((l) => l.status === 'pending').length;
  const approvedCount = locations.filter((l) => l.status === 'approved').length;
  const rejectedCount = locations.filter((l) => l.status === 'rejected').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Control Panel</h1>
          <p className="text-xs text-slate-500">Review, approve, and curate Formby community actions</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchLocations} className="text-xs flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl text-center text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'pending'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'approved'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'rejected'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* Content List */}
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
                  /* Edit Form */
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Title</label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-xs"
                      />
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
                      <Button size="sm" variant="outline" onClick={cancelEditing} className="text-xs gap-1">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  /* Display View */
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
                      {/* Resolution Toggle for Approved Items */}
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

                      {/* Approval Controls */}
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
