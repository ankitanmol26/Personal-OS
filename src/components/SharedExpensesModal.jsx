import React, { useState, useEffect } from 'react';
import { getSharedExpenses, createSharedExpense, deleteSharedExpense, getMemberBalances, getTripMembers } from '../services/tripService';
import { X, Plus, Trash2, SplitSquareHorizontal, Wifi, WifiOff, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { queueExpenseCreation, getPendingExpenses, cancelPendingExpense, retryPendingExpense, triggerSync, cacheTripData, getCachedTripData } from '../services/syncService';
import './SharedExpensesModal.css';

export default function SharedExpensesModal({ trip, currentUser, onClose }) {
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [members, setMembers] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState(currentUser?.id?.toString() || '');
  const [participantIds, setParticipantIds] = useState([]);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const isOwner = trip.userId === currentUser?.id;

  useEffect(() => {
    fetchData();
    const handleOnline = () => { setIsOnline(true); triggerSync(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const handleSyncUpdate = () => fetchData();
    window.addEventListener('sync:completed', handleSyncUpdate);
    window.addEventListener('sync:progress', handleSyncUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync:completed', handleSyncUpdate);
      window.removeEventListener('sync:progress', handleSyncUpdate);
    };
  }, [trip.id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const pendingData = await getPendingExpenses(trip.id);
      setPendingExpenses(pendingData);

      if (navigator.onLine) {
          const [expData, balData, memData] = await Promise.all([
            getSharedExpenses(trip.id),
            getMemberBalances(trip.id),
            getTripMembers(trip.id)
          ]);
          setExpenses(expData);
          setBalances(balData);
          setMembers(memData);
          await cacheTripData(trip.id, { expenses: expData, balances: balData, members: memData });
          
          if (memData.length > 0 && participantIds.length === 0) {
            setParticipantIds(memData.map(m => m.userId.toString()));
          }
      } else {
          const cached = await getCachedTripData(trip.id);
          if (cached) {
              setExpenses(cached.expenses || []);
              setBalances(cached.balances || []);
              setMembers(cached.members || []);
              if (cached.members && cached.members.length > 0 && participantIds.length === 0) {
                  setParticipantIds(cached.members.map(m => m.userId.toString()));
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
      setLoading(false);
    }
  };

  const handleToggleParticipant = (userId) => {
    const idStr = userId.toString();
    if (participantIds.includes(idStr)) {
      setParticipantIds(participantIds.filter(id => id !== idStr));
    } else {
      setParticipantIds([...participantIds, idStr]);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0 || !payerId || participantIds.length === 0) return;

    setActionLoading(true);
    setActionError(null);

    const payload = {
      description: description.trim(),
      amount: Number(amount),
      date,
      payerId: Number(payerId),
      equalSplit: true,
      participantIds: participantIds.map(Number)
    };

    try {
      await queueExpenseCreation(trip.id, payload);
      setDescription('');
      setAmount('');
      await fetchData();
    } catch (err) {
      setActionError(err.message || 'Failed to queue shared expense');
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
      const [expData, balData] = await Promise.all([
        getSharedExpenses(trip.id),
        getMemberBalances(trip.id)
      ]);
      setExpenses(expData);
      setBalances(balData);
    } catch (err) {
      setActionError(err.message || 'Failed to delete shared expense');
    } finally {
      setActionLoading(false);
    }
  };
  
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
            <h3 style={{margin: 0}}>Group Expenses - {trip.name}</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <span className={`online-status ${isOnline ? 'online' : 'offline'}`} style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: isOnline ? '#4ade80' : '#f87171'}}>
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <button className="icon-btn close-btn" onClick={onClose} style={{margin: 0}}>
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="modal-body expenses-modal-body">
          {loading ? (
            <div className="members-loading">Loading shared expenses...</div>
          ) : error ? (
            <div className="members-error">{error}</div>
          ) : (
            <div className="expenses-layout">
              <div className="expenses-main">
                <form className="add-expense-form" onSubmit={handleAddExpense}>
                  <h4>Add Shared Expense</h4>
                  
                  <div className="form-row">
                    <input type="text" className="finance-input" placeholder="Description (e.g. Dinner)" value={description} onChange={e => setDescription(e.target.value)} required />
                    <input type="number" step="0.01" min="0.01" className="finance-input" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required />
                  </div>
                  
                  <div className="form-row">
                    <input type="date" className="finance-input" value={date} onChange={e => setDate(e.target.value)} required />
                    <select className="finance-select" value={payerId} onChange={e => setPayerId(e.target.value)} required>
                      <option value="" disabled>Paid By...</option>
                      {members.map(m => (
                        <option key={m.userId} value={m.userId}>{m.name} {m.userId === currentUser?.id ? "(You)" : ""}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="participants-selector">
                    <label>Split equally between:</label>
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
                            {m.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {actionError && <div className="action-feedback error">{actionError}</div>}
                  
                  <button type="submit" disabled={actionLoading || participantIds.length === 0} className="finance-btn-submit">
                    <Plus size={16} style={{marginRight: '6px'}}/> Add Group Expense
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
                          <div className="expense-desc">{exp.description}</div>
                          <div className="expense-meta">
                            <span>{new Date(exp.date).toLocaleDateString()}</span>
                            <span>Paid by {exp.payerName}</span>
                            <span>Split {exp.splits.length} ways</span>
                          </div>
                        </div>
                        <div className="expense-right">
                          <div className="expense-amount">{formatCurrency(exp.amount)}</div>
                          {(isOwner || exp.creatorId === currentUser?.id) && (
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
              
              <div className="expenses-sidebar">
                <h4>Settlement Balances</h4>
                <p className="balance-subtext">Positive means they get paid back. Negative means they owe money.</p>
                <div className="balances-list">
                  {balances.map(b => (
                    <div key={b.userId} className="balance-card">
                      <div className="balance-name">{b.name} {b.userId === currentUser?.id ? "(You)" : ""}</div>
                      <div className="balance-stats">
                        <div className="stat-row">
                          <span>Paid:</span> <span>{formatCurrency(b.totalPaid)}</span>
                        </div>
                        <div className="stat-row">
                          <span>Owe:</span> <span>{formatCurrency(b.totalShareOwed)}</span>
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
        </div>
      </div>
    </div>
  );
}
