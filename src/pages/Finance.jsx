import { useEffect, useState, useMemo } from "react";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "../services/financeService";
import { getTrips, createTrip, updateTrip, deleteTrip, joinTripByInviteCode } from "../services/tripService";
import { useApi } from "../hooks/useApi";
import { ApiError, ApiLoading } from "../components/ApiFeedback";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit3, ArrowRight, Tag, Calendar, CreditCard, Filter, MapPin, Users, Shield, SplitSquareHorizontal, UserPlus, Check, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TripMembersModal from "../components/TripMembersModal";
import SharedExpensesModal from "../components/SharedExpensesModal";
import "./Finance.css";

const INCOME_CATEGORIES = ["Pocket Money", "Salary", "Freelance", "Gift", "Other"];
const EXPENSE_CATEGORIES = ["Food", "Travel", "Shopping", "Education", "Entertainment", "Health", "Bills", "Other"];
const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Other"];
const ALL_CATEGORIES = Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])).sort();

function formatCurrency(amount, curr = "INR") {
  const val = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr || 'INR'
    }).format(val);
  } catch (e) {
    return `${curr} ${val.toFixed(2)}`;
  }
}

function StatCard({ label, value, type, delay = 0 }) {
  return (
    <motion.div
      className={`finance-stat-card ${type}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.04, ease: "easeOut" }}
    >
      <div className="finance-stat-title">{label}</div>
      <div className="finance-stat-value">{value}</div>
    </motion.div>
  );
}

function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [trips, setTrips] = useState([]);
  const { loading, error, withApi, withApiLoading } = useApi(true);
  const { user } = useAuth();
  const [selectedTripForMembers, setSelectedTripForMembers] = useState(null);
  const [selectedTripForExpenses, setSelectedTripForExpenses] = useState(null);

  // Transaction Form State
  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingId, setEditingId] = useState(null);
  const [tripId, setTripId] = useState("");

  // Trip Form State
  const [tripEditingId, setTripEditingId] = useState(null);
  const [tripName, setTripName] = useState("");
  const [tripDestination, setTripDestination] = useState("");
  const [tripCurrency, setTripCurrency] = useState("INR");
  const [tripBudget, setTripBudget] = useState("");
  const [tripStartDate, setTripStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [tripEndDate, setTripEndDate] = useState(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState(null);

  // Filter State
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));
  const [filterType, setFilterType] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [tData, tripData] = await withApiLoading(() => Promise.all([
        getTransactions(),
        getTrips()
      ]), "Failed to load data.");
      setTransactions(Array.isArray(tData) ? tData : []);
      setTrips(Array.isArray(tripData) ? tripData : []);
    } catch (err) {
      setTransactions([]);
      setTrips([]);
    }
  }

  async function fetchTripsOnly() {
    try {
      const tripData = await withApi(() => getTrips(), "Failed to refresh trips.");
      setTrips(Array.isArray(tripData) ? tripData : []);
    } catch (err) {}
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // Derived state calculations
  const {
    globalIncome,
    globalExpense,
    todaySpending,
    monthlyIncome,
    monthlyExpense,
    categorySpending,
    filteredTransactions,
    availableMonths
  } = useMemo(() => {
    let gInc = 0, gExp = 0, tSpend = 0;
    let mInc = 0, mExp = 0;
    const catSpend = {};
    const monthsSet = new Set();
    const filtered = [];

    // Ensure current month is always available
    const currentMonthPrefix = new Date().toISOString().substring(0, 7);
    monthsSet.add(currentMonthPrefix);

    (transactions || []).forEach(t => {
      const val = Number(t.amount) || 0;
      const tMonth = (t.date || "").substring(0, 7);

      if (tMonth) monthsSet.add(tMonth);

      // Global Totals
      if (t.type === "INCOME") {
        gInc += val;
      } else if (t.type === "EXPENSE") {
        gExp += val;
        if (t.date === todayStr) {
          tSpend += val;
        }
      }

      // Monthly Totals (for the selected month)
      const isMonthMatch = tMonth === filterMonth;
      if (isMonthMatch) {
        if (t.type === "INCOME") {
          mInc += val;
        } else if (t.type === "EXPENSE") {
          mExp += val;
          catSpend[t.category] = (catSpend[t.category] || 0) + val;
        }
      }

      // Filter Logic for the List
      let include = true;
      if (!isMonthMatch) include = false;
      if (filterType !== "ALL" && t.type !== filterType) include = false;
      if (filterCategory !== "ALL" && t.category !== filterCategory) include = false;

      if (include) {
        filtered.push(t);
      }
    });

    return {
      globalIncome: gInc,
      globalExpense: gExp,
      todaySpending: tSpend,
      monthlyIncome: mInc,
      monthlyExpense: mExp,
      categorySpending: catSpend,
      filteredTransactions: filtered.sort((a, b) => {
        const dateA = a.date || "";
        const dateB = b.date || "";
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return (b.id || 0) - (a.id || 0);
      }),
      availableMonths: Array.from(monthsSet).sort().reverse()
    };
  }, [transactions, filterMonth, filterType, filterCategory, todayStr]);

  const availableBalance = globalIncome - globalExpense;
  const netSavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? ((netSavings / monthlyIncome) * 100).toFixed(2) : 0;

  const breakdownArr = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => ({ category: cat, amount: amt }));

  const maxCategorySpend = breakdownArr.length > 0 ? breakdownArr[0].amount : 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!amount || Number(amount) <= 0 || !description.trim() || !date) return;

    const payload = {
      type,
      amount: Number(amount),
      category,
      description,
      paymentMethod,
      date,
      tripId: tripId ? Number(tripId) : null
    };

    try {
      if (editingId) {
        const updated = await withApi(() => updateTransaction(editingId, payload), "Failed to update transaction.");
        setTransactions(transactions.map(t => t.id === editingId ? updated : t));
      } else {
        const created = await withApi(() => createTransaction(payload), "Failed to add transaction.");
        setTransactions([created, ...transactions]);
      }
      resetForm();
      if (payload.tripId || (editingId && transactions.find(t => t.id === editingId)?.tripId)) {
        await fetchTripsOnly();
      }
    } catch (err) {}
  }

  async function handleDelete(id) {
    try {
      const transaction = transactions.find(t => t.id === id);
      await withApi(() => deleteTransaction(id), "Failed to delete transaction.");
      setTransactions(transactions.filter(t => t.id !== id));
      if (editingId === id) resetForm();
      if (transaction?.tripId) {
        await fetchTripsOnly();
      }
    } catch (err) {}
  }

  function handleEdit(t) {
    setEditingId(t.id);
    setType(t.type);
    setAmount(t.amount);
    setCategory(t.category);
    setDescription(t.description);
    setPaymentMethod(t.paymentMethod);
    setDate(t.date);
    setTripId(t.tripId ? t.tripId.toString() : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setType("EXPENSE");
    setAmount("");
    setCategory("Food");
    setDescription("");
    setPaymentMethod("UPI");
    setDate(new Date().toISOString().split("T")[0]);
    setTripId("");
  }

  async function handleTripSubmit(event) {
    event.preventDefault();
    if (!tripName.trim() || !tripBudget || Number(tripBudget) <= 0 || !tripStartDate || !tripEndDate) return;
    if (new Date(tripStartDate) > new Date(tripEndDate)) {
      alert("Start date cannot be after end date.");
      return;
    }

    const payload = {
      name: tripName.trim(),
      destination: tripDestination.trim() || undefined,
      currency: tripCurrency || "INR",
      budget: Number(tripBudget),
      startDate: tripStartDate,
      endDate: tripEndDate
    };

    try {
      if (tripEditingId) {
        const updated = await withApi(() => updateTrip(tripEditingId, payload), "Failed to update trip.");
        setTrips(trips.map(t => t.id === tripEditingId ? updated : t));
      } else {
        const created = await withApi(() => createTrip(payload), "Failed to create trip.");
        setTrips([created, ...trips]);
      }
      resetTripForm();
    } catch (err) {}
  }

  async function handleJoinByCode(e) {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setJoinLoading(true);
    setJoinFeedback(null);
    try {
      const joinedTrip = await withApi(() => joinTripByInviteCode(joinCodeInput.trim()), "Failed to join trip");
      setJoinFeedback({ type: 'success', message: `Joined ${joinedTrip.name} successfully!` });
      setJoinCodeInput("");
      await fetchData();
      setTimeout(() => setJoinFeedback(null), 4000);
    } catch (err) {
      setJoinFeedback({ type: 'error', message: err.message || "Invalid invitation code" });
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleTripDelete(id) {
    if (window.confirm("Delete this trip? Transactions assigned to this trip will remain in Finance but will no longer belong to the trip.")) {
      try {
        await withApi(() => deleteTrip(id), "Failed to delete trip.");
        await fetchData(); // Refresh both to clear out tripId from local transactions state
        if (tripEditingId === id) resetTripForm();
      } catch (err) {}
    }
  }

  function handleTripEdit(t) {
    setTripEditingId(t.id);
    setTripName(t.name);
    setTripDestination(t.destination || "");
    setTripCurrency(t.currency || "INR");
    setTripBudget(t.budget);
    setTripStartDate(t.startDate);
    setTripEndDate(t.endDate);
  }

  function resetTripForm() {
    setTripEditingId(null);
    setTripName("");
    setTripDestination("");
    setTripCurrency("INR");
    setTripBudget("");
    setTripStartDate(new Date().toISOString().split("T")[0]);
    setTripEndDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  }

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === "INCOME" ? "Pocket Money" : "Food");
  };

  const formCategories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const formatMonth = (yyyyMM) => {
    if (!yyyyMM) return "";
    const [year, month] = yyyyMM.split('-');
    const d = new Date(year, month - 1);
    return isNaN(d) ? yyyyMM : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <main className="finance-page">
      <div className="finance-header">
        <h2>FINANCE</h2>
        <p>Manage your money and track your spending.</p>
      </div>

      <ApiError error={error} onRetry={fetchData} />

      {loading && (!transactions || transactions.length === 0) ? (
        <ApiLoading message="Loading finances..." />
      ) : (
        <>
          <div className="finance-stats-grid">
            <StatCard label="Available Balance" value={formatCurrency(availableBalance)} type="neutral" delay={0} />
            <StatCard label="Today's Spending" value={formatCurrency(todaySpending)} type="neutral" delay={1} />
          </div>

          <div className="finance-filters-container">
            <div className="finance-filters">
              <div className="filter-group">
                <Calendar size={16} className="filter-icon" />
                <select className="finance-select filter" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{formatMonth(m)}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <Filter size={16} className="filter-icon" />
                <select className="finance-select filter" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="ALL">All Types</option>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div className="filter-group">
                <Tag size={16} className="filter-icon" />
                <select className="finance-select filter" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="ALL">All Categories</option>
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="finance-stats-grid month-summary">
            <StatCard label={`${formatMonth(filterMonth)} Income`} value={formatCurrency(monthlyIncome)} type="income" delay={0} />
            <StatCard label={`${formatMonth(filterMonth)} Expenses`} value={formatCurrency(monthlyExpense)} type="expense" delay={1} />
            <StatCard label="Net Savings" value={formatCurrency(netSavings)} type={netSavings >= 0 ? "income" : "expense"} delay={2} />
            <StatCard label="Savings Rate" value={`${savingsRate}%`} type="neutral" delay={3} />
          </div>

          <div className="finance-layout">
            <div className="finance-sidebar-left">
              <form className="finance-form-card" onSubmit={handleSubmit}>
                <span className="finance-form-title">{editingId ? "Edit Transaction" : "Add Transaction"}</span>
                <div className="finance-form-inputs">

                  <select className="finance-select" value={type} onChange={(e) => handleTypeChange(e.target.value)}>
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>

                  <input type="number" step="0.01" min="0.01" className="finance-input" placeholder="Amount (e.g. 150.00)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                  <input type="text" className="finance-input" placeholder="Description (e.g. Lunch)" value={description} onChange={(e) => setDescription(e.target.value)} required />
                  <select className="finance-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {formCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="finance-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input type="date" className="finance-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                  <select className="finance-select" value={tripId} onChange={(e) => setTripId(e.target.value)}>
                    <option value="">No Trip</option>
                    {trips.map(trip => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
                  </select>

                  <button type="submit" className="finance-btn-submit">
                    {editingId ? "Update" : "Add"} <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                  </button>
                  {editingId && (
                    <button type="button" className="finance-btn-submit" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '4px' }} onClick={resetForm}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {breakdownArr.length > 0 && (
                <div className="finance-breakdown">
                  <h3 className="finance-breakdown-title">Spending Breakdown</h3>
                  {breakdownArr.map(item => (
                    <div key={item.category} className="finance-bar-row">
                      <div className="finance-bar-labels">
                        <span>{item.category}</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="finance-bar-track">
                        <div
                          className="finance-bar-fill"
                          style={{ width: `${(item.amount / maxCategorySpend) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="finance-list-container">
              <h3 className="finance-list-title">Transactions</h3>

              {(transactions || []).filter(t => (t.date || "").startsWith(filterMonth)).length === 0 ? (
                <div className="finance-empty-state">
                  No transactions for this month.
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="finance-empty-state">
                  No matching transactions.
                </div>
              ) : (
                <div className="finance-list">
                  <AnimatePresence>
                    {filteredTransactions.map((t, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="finance-transaction-card"
                        key={t.id}
                      >
                        <div className="transaction-left">
                          <div className="transaction-title">{t.description}</div>
                          <div className="transaction-meta">
                            <span><Calendar size={12} style={{marginRight: '4px'}}/>{formatDate(t.date)}</span>
                            <span><Tag size={12} style={{marginRight: '4px'}}/>{t.category}</span>
                            <span><CreditCard size={12} style={{marginRight: '4px'}}/>{t.paymentMethod}</span>
                          </div>
                        </div>

                        <div className="transaction-right">
                          <span className={`transaction-amount ${t.type.toLowerCase()}`}>
                            {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                          </span>
                          {t.tripId && (
                            <span className="trip-tag"><MapPin size={10} style={{marginRight: '2px', display: 'inline'}} />{trips.find(trip => trip.id === t.tripId)?.name || 'Trip'}</span>
                          )}
                          <div className="transaction-actions">
                            <button type="button" className="icon-btn" onClick={() => handleEdit(t)} title="Edit">
                              <Edit3 size={16} />
                            </button>
                            <button type="button" className="icon-btn danger" onClick={() => handleDelete(t.id)} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          <div className="trips-section">
            <h3 className="finance-list-title" style={{ marginTop: 'var(--space-md)' }}>Trips & Shared Travel Hub</h3>

            <div className="finance-layout">
              <div className="finance-sidebar-left">
                {/* Trip Create / Edit Form */}
                <form className="finance-form-card" onSubmit={handleTripSubmit}>
                  <span className="finance-form-title">{tripEditingId ? "Edit Trip" : "Create Trip"}</span>
                  <div className="finance-form-inputs">
                    <input type="text" className="finance-input" placeholder="Trip Name (e.g. Goa Vacation)" value={tripName} onChange={(e) => setTripName(e.target.value)} required />
                    <input type="text" className="finance-input" placeholder="Destination (e.g. Goa, India)" value={tripDestination} onChange={(e) => setTripDestination(e.target.value)} />

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="number" step="0.01" min="0.01" style={{ flex: 2 }} className="finance-input" placeholder="Budget (e.g. 50000)" value={tripBudget} onChange={(e) => setTripBudget(e.target.value)} required />
                      <select style={{ flex: 1 }} className="finance-select" value={tripCurrency} onChange={(e) => setTripCurrency(e.target.value)}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AED">AED (د.إ)</option>
                        <option value="CAD">CAD ($)</option>
                      </select>
                    </div>

                    <input type="date" className="finance-input" title="Start Date" value={tripStartDate} onChange={(e) => setTripStartDate(e.target.value)} required />
                    <input type="date" className="finance-input" title="End Date" value={tripEndDate} onChange={(e) => setTripEndDate(e.target.value)} required />

                    <button type="submit" className="finance-btn-submit">
                      {tripEditingId ? "Update Trip" : "Create Trip"} <MapPin size={16} style={{ marginLeft: '6px' }} />
                    </button>
                    {tripEditingId && (
                      <button type="button" className="finance-btn-submit" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '4px' }} onClick={resetTripForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {/* Quick Join via Invitation Code Form */}
                <form className="finance-form-card" style={{ marginTop: '16px' }} onSubmit={handleJoinByCode}>
                  <span className="finance-form-title" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserPlus size={14} color="#ff4a22" /> Join Shared Trip
                  </span>
                  <div className="finance-form-inputs" style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      className="finance-input"
                      placeholder="Enter Invite Code (e.g. TRIP-ABCD1234)"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      required
                    />
                    <button type="submit" disabled={joinLoading || !joinCodeInput.trim()} className="finance-btn-submit" style={{ padding: '8px 12px', fontSize: '13px' }}>
                      {joinLoading ? 'Joining...' : 'Accept Invitation'}
                    </button>
                  </div>
                  {joinFeedback && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: joinFeedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: joinFeedback.type === 'success' ? '#4ade80' : '#f87171'
                    }}>
                      {joinFeedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                      <span>{joinFeedback.message}</span>
                    </div>
                  )}
                </form>
              </div>

              <div className="finance-list-container">
                {trips.length === 0 ? (
                  <div className="finance-empty-state">
                    No trips yet.<br/><br/>Create a trip or join a friend's trip with an invite code to track pooled funds and shared expenses.
                  </div>
                ) : (
                  <div className="trips-list">
                    <AnimatePresence>
                      {(trips || []).map((trip, index) => {
                        const budget = Number(trip.budget) || 0;
                        const spent = Number(trip.spent) || 0;
                        const progress = budget > 0 ? Math.min(Math.max((spent / budget) * 100, 0), 100) : 0;
                        const overspent = spent > budget;
                        const tripCurr = trip.currency || "INR";

                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="trip-card"
                            key={trip.id}
                          >
                            <div className="trip-actions">
                              {trip.userId === user?.id && (
                                <>
                                  <button type="button" className="icon-btn" onClick={() => handleTripEdit(trip)} title="Edit Trip">
                                    <Edit3 size={16} />
                                  </button>
                                  <button type="button" className="icon-btn danger" onClick={() => handleTripDelete(trip.id)} title="Delete Trip">
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                              <button type="button" className="icon-btn" onClick={() => setSelectedTripForExpenses(trip)} title="Group Expenses & Splits">
                                <SplitSquareHorizontal size={16} />
                              </button>
                              <button type="button" className="icon-btn" onClick={() => setSelectedTripForMembers(trip)} title={trip.userId === user?.id ? "Manage Members & Invite" : "Trip Members & Invite"}>
                                <Users size={16} />
                              </button>
                            </div>

                            <div className="trip-header">
                              <div>
                                <div className="trip-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div className="trip-title">{trip.name}</div>
                                  <div className={`trip-role-badge ${trip.userId === user?.id ? 'owner' : 'member'}`}>
                                    {trip.userId === user?.id ? <><Shield size={10} style={{marginRight:'2px'}}/> Owner</> : 'Member'}
                                  </div>
                                  <span style={{ fontSize: '11px', backgroundColor: 'rgba(255, 74, 34, 0.15)', color: '#ff4a22', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                    {tripCurr}
                                  </span>
                                </div>
                                {trip.destination && (
                                  <div style={{ fontSize: '12px', color: '#ff4a22', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <MapPin size={12} /> {trip.destination}
                                  </div>
                                )}
                                <div className="trip-date" style={{ marginTop: '4px' }}>
                                  <Calendar size={12} /> {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                </div>
                              </div>
                            </div>

                            <div className="trip-stats">
                              <div className="trip-stat-row">
                                <span className="trip-stat-label">Planned Budget</span>
                                <span className="trip-stat-val">{formatCurrency(trip.budget, tripCurr)}</span>
                              </div>
                              <div className="trip-stat-row">
                                <span className="trip-stat-label">Pooled Funds</span>
                                <span className="trip-stat-val" style={{ color: '#38bdf8' }}>{formatCurrency(trip.totalContributed || 0, tripCurr)}</span>
                              </div>
                              <div className="trip-stat-row">
                                <span className="trip-stat-label">Spent</span>
                                <span className="trip-stat-val">{formatCurrency(trip.spent, tripCurr)}</span>
                              </div>
                              <div className="trip-stat-row">
                                <span className="trip-stat-label">Remaining</span>
                                <span className={`trip-stat-val ${overspent ? 'overspent' : ''}`}>
                                  {overspent ? '-' : ''}{formatCurrency(Math.abs(trip.remaining), tripCurr)}
                                </span>
                              </div>
                            </div>

                            <div className="trip-progress-container">
                              <div className="trip-progress-header">
                                <span>Budget Utilization</span>
                                <span>{progress.toFixed(1)}%</span>
                              </div>
                              <div className="finance-bar-track">
                                <div
                                  className="finance-bar-fill"
                                  style={{ width: `${progress}%`, backgroundColor: overspent ? 'var(--status-danger)' : 'var(--accent-primary)' }}
                                ></div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {selectedTripForMembers && (
        <TripMembersModal
          trip={selectedTripForMembers}
          currentUser={user}
          onClose={() => setSelectedTripForMembers(null)}
          onTripUpdated={fetchData}
        />
      )}

      {selectedTripForExpenses && (
        <SharedExpensesModal
          trip={selectedTripForExpenses}
          currentUser={user}
          onClose={() => setSelectedTripForExpenses(null)}
          onTripUpdated={fetchData}
        />
      )}
    </main>
  );
}

export default Finance;
