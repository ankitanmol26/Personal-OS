import React, { useState, useEffect, useRef } from 'react';
import {
  getSharedExpenses,
  createSharedExpense,
  deleteSharedExpense,
  getMemberBalances,
  getTripMembers,
  getTripContributions,
  addTripContribution,
  deleteTripContribution
} from '../services/tripService';
import { TripSocketManager } from '../services/tripSocket';
import {
  X, Plus, Trash2, Wifi, WifiOff, AlertCircle, RefreshCw,
  CheckCircle2, PiggyBank, Receipt, Scale, ArrowRight, ShieldCheck,
  Tag, FileText, UserCheck, Check
} from 'lucide-react';
import { queueExpenseCreation, getPendingExpenses, cancelPendingExpense, retryPendingExpense, triggerSync, cacheTripData, getCachedTripData } from '../services/syncService';
import './SharedExpensesModal.css';

export default function SharedExpensesModal({ trip, currentUser, onClose, onTripUpdated }) {
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'contributions' | 'settlements'
  const [expenses, setExpenses] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [balances, setBalances] = useState([]);
  const [members, setMembers] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketStatus, setSocketStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected' | 'error'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expense form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [payerId, setPayerId] = useState(currentUser?.id?.toString() || '');
  const [participantIds, setParticipantIds] = useState([]);
  const [splitMethod, setSplitMethod] = useState('EQUAL'); // 'EQUAL' | 'CUSTOM'
  const [customSplits, setCustomSplits] = useState({}); // { [userId]: amount }

  // Contribution form state
  const [contribAmount, setContribAmount] = useState('');
  const [contribDate, setContribDate] = useState(new Date().toISOString().split('T')[0]);
  const [contribNote, setContribNote] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const socketManagerRef = useRef(null);
  const isOwner = trip.userId === currentUser?.id;
  const currency = trip.currency || 'INR';

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency }).format(num);
    } catch (e) {
      return `${currency} ${num.toFixed(2)}`;
    }
  };

  const fetchData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    setError(null);
    try {
      const pendingData = await getPendingExpenses(trip.id);
      setPendingExpenses(pendingData);

      if (navigator.onLine) {
        const [expData, balData, memData, contribData] = await Promise.all([
          getSharedExpenses(trip.id),
          getMemberBalances(trip.id),
          getTripMembers(trip.id),
          getTripContributions(trip.id)
        ]);
        setExpenses(expData);
        setBalances(balData);
        setMembers(memData);
        setContributions(contribData);
        await cacheTripData(trip.id, { expenses: expData, balances: balData, members: memData, contributions: contribData });

        if (memData.length > 0 && participantIds.length === 0) {
          setParticipantIds(memData.map(m => m.userId.toString()));
          setPayerId(currentUser?.id?.toString() || memData[0].userId.toString());
        }
      } else {
        const cached = await getCachedTripData(trip.id);
        if (cached) {
          setExpenses(cached.expenses || []);
          setBalances(cached.balances || []);
          setMembers(cached.members || []);
          setContributions(cached.contributions || []);
          if (cached.members && cached.members.length > 0 && participantIds.length === 0) {
            setParticipantIds(cached.members.map(m => m.userId.toString()));
            setPayerId(currentUser?.id?.toString() || cached.members[0].userId.toString());
          }
        } else {
          setError("You are offline and haven't loaded this trip's data yet.");
        }
      }
    } catch (err) {
      if (expenses.length === 0) {
        setError(err.message || 'Failed to load shared expenses');
      }
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup STOMP WebSocket Live Updates
    socketManagerRef.current = new TripSocketManager(
      trip.id,
      (event) => {
        // When any update occurs (expense created/deleted, contribution, member joined), reload authoritative data
        fetchData(false);
        onTripUpdated?.();
      },
      (status) => {
        setSocketStatus(status);
      }
    );
    socketManagerRef.current.connect();

    const handleOnline = () => { setIsOnline(true); triggerSync(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleSyncUpdate = () => fetchData(false);
    window.addEventListener('sync:completed', handleSyncUpdate);
    window.addEventListener('sync:progress', handleSyncUpdate);

    return () => {
      socketManagerRef.current?.disconnect();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync:completed', handleSyncUpdate);
      window.removeEventListener('sync:progress', handleSyncUpdate);
    };
  }, [trip.id]);

  const handleToggleParticipant = (userId) => {
    const idStr = userId.toString();
    if (participantIds.includes(idStr)) {
      setParticipantIds(participantIds.filter(id => id !== idStr));
    } else {
      setParticipantIds([...participantIds, idStr]);
    }
  };

  const handleCustomSplitChange = (userId, val) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: val
    }));
  };

  const customSplitsSum = participantIds.reduce((sum, id) => {
    return sum + (Number(customSplits[id]) || 0);
  }, 0);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0 || !payerId || participantIds.length === 0) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    const expenseAmount = Number(amount);

    let splitList = undefined;
    if (splitMethod === 'CUSTOM') {
      if (Math.abs(customSplitsSum - expenseAmount) > 0.01) {
        setActionError(`Custom splits must sum exactly to the expense amount (${formatCurrency(expenseAmount)}). Current sum is ${formatCurrency(customSplitsSum)}.`);
        setActionLoading(false);
        return;
      }
      splitList = participantIds.map(id => ({
        userId: Number(id),
        amountOwed: Number(customSplits[id]) || 0
      }));
    }

    const payload = {
      description: description.trim(),
      amount: expenseAmount,
      date,
      category,
      note: note.trim() || undefined,
      payerId: Number(payerId),
      splitMethod,
      equalSplit: splitMethod === 'EQUAL',
      participantIds: participantIds.map(Number),
      customSplits: splitList
    };

    try {
      await queueExpenseCreation(trip.id, payload);
      setDescription('');
      setAmount('');
      setNote('');
      setCustomSplits({});
      setActionSuccess('Expense recorded!');
      await fetchData(false);
      onTripUpdated?.();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to record shared expense');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this shared expense?")) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await deleteSharedExpense(trip.id, expenseId);
      await fetchData(false);
      onTripUpdated?.();
    } catch (err) {
      setActionError(err.message || 'Failed to delete shared expense');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    if (!contribAmount || Number(contribAmount) <= 0) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await addTripContribution(trip.id, {
        amount: Number(contribAmount),
        currency: currency,
        date: contribDate,
        contributionDate: contribDate,
        note: contribNote.trim() || undefined
      });
      setContribAmount('');
      setContribNote('');
      setActionSuccess('Contribution added to pool!');
      await fetchData(false);
      onTripUpdated?.();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to add contribution');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteContribution = async (contributionId) => {
    if (!window.confirm("Are you sure you want to remove this contribution?")) return;

    setActionLoading(true);
    setActionError(null);
    try {
      await deleteTripContribution(trip.id, contributionId);
      await fetchData(false);
      onTripUpdated?.();
    } catch (err) {
      setActionError(err.message || 'Failed to remove contribution');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculations for budget overview
  const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalPooled = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const plannedBudget = Number(trip.budget) || 0;
  const remainingBudget = plannedBudget - totalSpent;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-title-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
            <div>
              <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span>{trip.name}</span>
                {trip.destination && <span style={{fontSize: '13px', color: '#ff4a22', fontWeight: '400'}}>({trip.destination})</span>}
              </h3>
              <div style={{fontSize: '12px', color: '#a3a3a3', marginTop: '2px'}}>Shared Multi-User Hub</div>
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              {/* WebSocket Live Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: socketStatus === 'connected' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: socketStatus === 'connected' ? '#4ade80' : '#fbbf24',
                border: `1px solid ${socketStatus === 'connected' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: socketStatus === 'connected' ? '#4ade80' : '#fbbf24',
                  display: 'inline-block'
                }} />
                <span>{socketStatus === 'connected' ? 'Live Sync' : isOnline ? 'Connecting...' : 'Offline'}</span>
              </div>

              <button className="icon-btn close-btn" onClick={onClose} style={{margin: 0}}>
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Financial KPI Summary Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          padding: '16px 24px',
          backgroundColor: '#121212',
          borderBottom: '1px solid #262626'
        }}>
          <div>
            <div style={{fontSize: '11px', textTransform: 'uppercase', color: '#888', fontWeight: '600'}}>Planned Budget</div>
            <div style={{fontSize: '16px', fontWeight: '700', color: '#fff'}}>{formatCurrency(plannedBudget)}</div>
          </div>
          <div>
            <div style={{fontSize: '11px', textTransform: 'uppercase', color: '#888', fontWeight: '600'}}>Pooled Contributions</div>
            <div style={{fontSize: '16px', fontWeight: '700', color: '#38bdf8'}}>{formatCurrency(totalPooled)}</div>
          </div>
          <div>
            <div style={{fontSize: '11px', textTransform: 'uppercase', color: '#888', fontWeight: '600'}}>Expenses Paid</div>
            <div style={{fontSize: '16px', fontWeight: '700', color: '#f87171'}}>{formatCurrency(totalSpent)}</div>
          </div>
          <div>
            <div style={{fontSize: '11px', textTransform: 'uppercase', color: '#888', fontWeight: '600'}}>Remaining Budget</div>
            <div style={{fontSize: '16px', fontWeight: '700', color: remainingBudget >= 0 ? '#4ade80' : '#f87171'}}>
              {formatCurrency(remainingBudget)}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #262626',
          backgroundColor: '#171717',
          padding: '0 24px'
        }}>
          <button
            onClick={() => setActiveTab('expenses')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'expenses' ? '2px solid #ff4a22' : '2px solid transparent',
              color: activeTab === 'expenses' ? '#fff' : '#888',
              fontWeight: activeTab === 'expenses' ? '600' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <Receipt size={16} /> Shared Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'contributions' ? '2px solid #ff4a22' : '2px solid transparent',
              color: activeTab === 'contributions' ? '#fff' : '#888',
              fontWeight: activeTab === 'contributions' ? '600' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <PiggyBank size={16} /> Contributions ({contributions.length})
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'settlements' ? '2px solid #ff4a22' : '2px solid transparent',
              color: activeTab === 'settlements' ? '#fff' : '#888',
              fontWeight: activeTab === 'settlements' ? '600' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <Scale size={16} /> Balances & Settlements ({balances.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body expenses-modal-body" style={{ maxHeight: 'calc(80vh - 180px)', overflowY: 'auto' }}>
          {actionError && (
            <div style={{
              margin: '16px 24px 0 24px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} /> {actionError}
            </div>
          )}

          {actionSuccess && (
            <div style={{
              margin: '16px 24px 0 24px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#4ade80',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} /> {actionSuccess}
            </div>
          )}

          {/* TAB 1: SHARED EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="expenses-layout">
              <div className="expenses-main">
                <form className="add-expense-form" onSubmit={handleAddExpense}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h4>Add Shared Expense</h4>
                    <span style={{fontSize: '12px', color: '#ff4a22'}}>{currency}</span>
                  </div>

                  <div className="form-row">
                    <input
                      type="text"
                      className="finance-input"
                      placeholder="Description (e.g. Scuba Diving)"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="finance-input"
                      placeholder={`Amount (${currency})`}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <input type="date" className="finance-input" value={date} onChange={e => setDate(e.target.value)} required />
                    <select className="finance-select" value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="Food">🍔 Food & Dining</option>
                      <option value="Transport">🚕 Transport / Flights</option>
                      <option value="Lodging">🏨 Accommodation</option>
                      <option value="Activities">🎟️ Activities & Tours</option>
                      <option value="Shopping">🛍️ Shopping</option>
                      <option value="Other">📦 Other</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <select className="finance-select" value={payerId} onChange={e => setPayerId(e.target.value)} required>
                      <option value="" disabled>Paid By...</option>
                      {members.map(m => (
                        <option key={m.userId} value={m.userId}>{m.name} {m.userId === currentUser?.id ? "(You)" : ""}</option>
                      ))}
                    </select>

                    <select className="finance-select" value={splitMethod} onChange={e => setSplitMethod(e.target.value)}>
                      <option value="EQUAL">Equal Split</option>
                      <option value="CUSTOM">Custom Exact Shares</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    className="finance-input"
                    placeholder="Optional note or reference..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />

                  <div className="participants-selector">
                    <label style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span>Participants sharing cost:</span>
                      {splitMethod === 'CUSTOM' && (
                        <span style={{color: Math.abs(customSplitsSum - (Number(amount) || 0)) < 0.01 ? '#4ade80' : '#f87171'}}>
                          Total: {formatCurrency(customSplitsSum)} / {formatCurrency(Number(amount) || 0)}
                        </span>
                      )}
                    </label>

                    <div className="participant-chips">
                      {members.map(m => {
                        const idStr = m.userId.toString();
                        const isSelected = participantIds.includes(idStr);
                        return (
                          <div
                            key={m.userId}
                            className={`participant-chip ${isSelected ? 'active' : ''}`}
                            onClick={() => handleToggleParticipant(m.userId)}
                          >
                            {m.name} {m.userId === currentUser?.id ? "(You)" : ""}
                          </div>
                        );
                      })}
                    </div>

                    {splitMethod === 'CUSTOM' && participantIds.length > 0 && (
                      <div style={{marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid #292929'}}>
                        <div style={{fontSize: '12px', fontWeight: '600', color: '#a3a3a3'}}>Specify Share per Member:</div>
                        {participantIds.map(id => {
                          const m = members.find(mem => mem.userId.toString() === id);
                          return (
                            <div key={id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'}}>
                              <span style={{fontSize: '13px', color: '#ededed'}}>{m ? m.name : `User ${id}`}:</span>
                              <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                <span style={{fontSize: '12px', color: '#737373'}}>{currency}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={customSplits[id] || ''}
                                  onChange={e => handleCustomSplitChange(id, e.target.value)}
                                  placeholder="0.00"
                                  style={{
                                    width: '100px',
                                    backgroundColor: '#0f0f0f',
                                    border: '1px solid #333',
                                    borderRadius: '6px',
                                    padding: '6px 8px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    textAlign: 'right'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={actionLoading || participantIds.length === 0} className="finance-btn-submit">
                    <Plus size={16} style={{marginRight: '6px'}}/> {actionLoading ? 'Recording...' : 'Record Shared Expense'}
                  </button>
                </form>

                <div className="expenses-list">
                  <h4>Expense History</h4>

                  {pendingExpenses.map(op => (
                    <div key={op.idempotencyKey} className="expense-card pending" style={{borderLeft: '4px solid #f59e0b'}}>
                      <div className="expense-left">
                        <div className="expense-desc">
                          {op.payload.description}
                          <span className="sync-badge" style={{fontSize: '11px', marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                            {op.status === 'syncing' ? <RefreshCw size={10} className="spin" /> :
                             op.status === 'conflict' ? <AlertCircle size={10} /> : <WifiOff size={10} />}
                            {op.status}
                          </span>
                        </div>
                        <div className="expense-meta">
                          <span>{new Date(op.payload.date).toLocaleDateString()}</span>
                          {op.lastErrorMessage && <span className="error-text" style={{color: '#f87171', marginLeft: '8px'}}>{op.lastErrorMessage}</span>}
                        </div>
                      </div>
                      <div className="expense-right">
                        <div className="expense-amount">{formatCurrency(op.payload.amount)}</div>
                        <div className="action-buttons" style={{display: 'flex', gap: '4px', marginTop: '8px'}}>
                            {(op.status === 'conflict' || op.status === 'failed') && (
                                <button type="button" className="icon-btn" onClick={() => retryPendingExpense(op.idempotencyKey)} title="Retry"><RefreshCw size={14} /></button>
                            )}
                            <button type="button" className="icon-btn danger" onClick={() => cancelPendingExpense(op.idempotencyKey)} title="Cancel"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {expenses.length === 0 && pendingExpenses.length === 0 ? (
                    <div className="members-empty">No shared expenses yet.</div>
                  ) : (
                    expenses.map(exp => (
                      <div key={exp.id} className="expense-card">
                        <div className="expense-left">
                          <div className="expense-desc" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <span>{exp.description}</span>
                            <span style={{
                              fontSize: '11px',
                              backgroundColor: 'rgba(255, 74, 34, 0.1)',
                              color: '#ff4a22',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {exp.category || 'Expense'}
                            </span>
                          </div>
                          <div className="expense-meta">
                            <span>{new Date(exp.date).toLocaleDateString()}</span>
                            <span>Paid by <strong style={{color: '#ededed'}}>{exp.payerName}</strong></span>
                            <span>Split ({exp.splitMethod === 'CUSTOM' ? 'Custom' : 'Equal'} · {exp.splits?.length || 0} members)</span>
                          </div>
                          {exp.note && (
                            <div style={{fontSize: '12px', color: '#737373', fontStyle: 'italic', marginTop: '2px'}}>
                              "{exp.note}"
                            </div>
                          )}
                        </div>
                        <div className="expense-right">
                          <div className="expense-amount">{formatCurrency(exp.amount)}</div>
                          {(isOwner || exp.creatorId === currentUser?.id || exp.payerId === currentUser?.id) && (
                            <button className="icon-btn danger" onClick={() => handleDeleteExpense(exp.id)} title="Delete Expense">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Sidebar of Net Balances */}
              <div className="expenses-sidebar">
                <h4>Net Summary</h4>
                <p className="balance-subtext">Positive (+) means paid more and gets reimbursed. Negative (-) means owes the group.</p>
                <div className="balances-list">
                  {balances.map(b => (
                    <div key={b.userId} className="balance-card">
                      <div className="balance-name">{b.name} {b.userId === currentUser?.id ? "(You)" : ""}</div>
                      <div className="balance-stats">
                        <div className="stat-row">
                          <span>Paid:</span> <span>{formatCurrency(b.totalPaid)}</span>
                        </div>
                        <div className="stat-row">
                          <span>Share:</span> <span>{formatCurrency(b.totalShareOwed)}</span>
                        </div>
                        <div className="stat-row net">
                          <span>Net:</span>
                          <span className={b.netBalance > 0 ? 'positive' : b.netBalance < 0 ? 'negative' : ''}>
                            {b.netBalance > 0 ? '+' : ''}{formatCurrency(b.netBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBER CONTRIBUTIONS */}
          {activeTab === 'contributions' && (
            <div style={{padding: '24px'}}>
              <div style={{maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px'}}>
                <form className="add-expense-form" onSubmit={handleAddContribution}>
                  <h4>Record Member Budget Contribution</h4>
                  <p style={{fontSize: '12px', color: '#a3a3a3', margin: 0}}>
                    Record upfront funds pooled into the shared trip purse. Money contributed is stored separately from actual expenses.
                  </p>

                  <div className="form-row">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="finance-input"
                      placeholder={`Contribution Amount (${currency})`}
                      value={contribAmount}
                      onChange={e => setContribAmount(e.target.value)}
                      required
                    />
                    <input
                      type="date"
                      className="finance-input"
                      value={contribDate}
                      onChange={e => setContribDate(e.target.value)}
                      required
                    />
                  </div>

                  <input
                    type="text"
                    className="finance-input"
                    placeholder="Optional note (e.g. UPI transfer to organizer, bank deposit)..."
                    value={contribNote}
                    onChange={e => setContribNote(e.target.value)}
                  />

                  <button type="submit" disabled={actionLoading || !contribAmount} className="finance-btn-submit">
                    <Plus size={16} style={{marginRight: '6px'}}/> {actionLoading ? 'Recording...' : 'Add Contribution'}
                  </button>
                </form>

                <div>
                  <h4 style={{marginBottom: '12px'}}>Contributions Pool ({contributions.length})</h4>
                  {contributions.length === 0 ? (
                    <div className="members-empty">No contributions recorded yet.</div>
                  ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                      {contributions.map(c => (
                        <div key={c.id} className="expense-card">
                          <div className="expense-left">
                            <div className="expense-desc">{c.userName} {c.userId === currentUser?.id ? "(You)" : ""}</div>
                            <div className="expense-meta">
                              <span>{new Date(c.contributionDate).toLocaleDateString()}</span>
                              {c.note && <span>Note: "{c.note}"</span>}
                            </div>
                          </div>
                          <div className="expense-right">
                            <div className="expense-amount" style={{color: '#38bdf8'}}>{formatCurrency(c.amount)}</div>
                            {(isOwner || c.userId === currentUser?.id) && (
                              <button className="icon-btn danger" onClick={() => handleDeleteContribution(c.id)} title="Delete Contribution">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BALANCES & SETTLEMENTS */}
          {activeTab === 'settlements' && (
            <div style={{padding: '24px'}}>
              <div style={{maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div style={{
                  backgroundColor: '#171717',
                  border: '1px solid #2b2b2b',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <h4 style={{margin: '0 0 8px 0'}}>Settlement Explanation</h4>
                  <p style={{margin: 0, fontSize: '13px', color: '#a3a3a3', lineHeight: 1.5}}>
                    Balances are calculated server-side with decimal precision. Each member's net balance is: <br/>
                    <strong style={{color: '#ededed'}}>(Total Expenses Directly Paid) - (Total Share of Cost Incurred)</strong>.
                    Positive balances receive reimbursement; negative balances pay into the group settlement.
                  </p>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px'}}>
                  {balances.map(b => (
                    <div key={b.userId} style={{
                      backgroundColor: '#141414',
                      border: '1px solid #282828',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{fontWeight: '700', fontSize: '15px', color: '#fff'}}>
                          {b.name} {b.userId === currentUser?.id ? "(You)" : ""}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: b.netBalance >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: b.netBalance >= 0 ? '#4ade80' : '#f87171',
                          fontWeight: '600'
                        }}>
                          {b.netBalance >= 0 ? 'Gets Back' : 'Owes Group'}
                        </span>
                      </div>

                      <div style={{display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#a3a3a3'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span>Directly Paid:</span>
                          <span style={{color: '#ededed'}}>{formatCurrency(b.totalPaid)}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span>Share of Expenses:</span>
                          <span style={{color: '#ededed'}}>{formatCurrency(b.totalShareOwed)}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span>Pooled Contribution:</span>
                          <span style={{color: '#38bdf8'}}>{formatCurrency(b.totalContributed || 0)}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderTop: '1px dashed #333',
                          paddingTop: '8px',
                          fontWeight: '700',
                          fontSize: '14px'
                        }}>
                          <span>Net Balance:</span>
                          <span style={{color: b.netBalance > 0 ? '#4ade80' : b.netBalance < 0 ? '#f87171' : '#fff'}}>
                            {b.netBalance > 0 ? '+' : ''}{formatCurrency(b.netBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
