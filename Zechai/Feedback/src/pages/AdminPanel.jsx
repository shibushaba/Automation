import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logoutAdmin } from '../components/AdminGuard';
import StarRating from '../components/StarRating';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const TABS = ['Customers', 'Staff', 'Daily Report'];

export default function AdminPanel() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  const handleLogout = () => { logoutAdmin(); navigate('/admin-login'); };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-center" />

      {/* Top bar */}
      <header className="border-b border-ink bg-white flex items-center justify-between px-6 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink flex items-center justify-center">
            <span className="text-white font-black text-xs">Z</span>
          </div>
          <div>
            <p className="font-black text-xs tracking-[0.3em] uppercase">ZECHAI</p>
            <p className="font-mono text-[9px] tracking-widest text-gray-400 uppercase">Admin Panel</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-sm border-ink text-ink hover:bg-ink hover:text-white">
          Logout
        </button>
      </header>

      {/* Tab bar */}
      <div className="border-b border-ink bg-white flex overflow-x-auto whitespace-nowrap">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`font-mono text-[11px] tracking-widest uppercase px-6 py-3 border-r border-ink transition-colors flex-shrink-0
              ${tab === i ? 'bg-ink text-white' : 'bg-white text-gray-500 hover:bg-paper'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 sm:px-8 py-8">
        {tab === 0 && <CustomerTab />}
        {tab === 1 && <StaffTab />}
        {tab === 2 && <DailyReportTab />}
      </main>
    </div>
  );
}

/* ─── Customer Tab ─────────────────────────────────────────── */
function CustomerTab() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [starFilter, setStarFilter] = useState(0);
  const [search, setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('customer_feedback').select('*').order('created_at', { ascending: false });
    if (starFilter > 0) q = q.eq('stars', starFilter);
    const { data } = await q;
    setLoading(false);
    if (data) setRows(data);
  }, [starFilter]);

  useEffect(() => { load(); }, [load]);

  // Find returning customers (same phone, multiple entries)
  const phoneCount = {};
  rows.forEach((r) => { if (r.phone) phoneCount[r.phone] = (phoneCount[r.phone] || 0) + 1; });

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.name || '').toLowerCase().includes(s) || (r.phone || '').includes(s) || (r.item_ordered || '').toLowerCase().includes(s);
  });

  const deleteCustomer = async (id) => {
    if (!window.confirm('Delete this feedback entry permanently?')) return;
    toast.loading('Deleting...', { id: 'del-cust' });
    const { error } = await supabase.from('customer_feedback').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete', { id: 'del-cust' });
    } else {
      toast.success('Deleted successfully', { id: 'del-cust' });
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const totalReturning = Object.values(phoneCount).filter((v) => v > 1).length;
  const avgStars = rows.length ? (rows.reduce((a, r) => a + r.stars, 0) / rows.length).toFixed(1) : '—';

  return (
    <div>
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border border-ink bg-white mb-6">
        <Stat label="Total Feedback" value={rows.length} />
        <Stat label="Avg Rating" value={`${avgStars} ★`} />
        <Stat label="Returning Customers" value={totalReturning} accent />
        <Stat label="Today" value={rows.filter((r) => r.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input className="form-input max-w-xs text-xs" placeholder="Search name, phone, item..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setStarFilter(s)}
              className={`btn btn-sm ${starFilter === s ? 'bg-ink text-white border-ink' : 'border-ink'}`}>
              {s === 0 ? 'All' : `${s}★`}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn btn-sm border-accent text-accent hover:bg-accent hover:text-white">↻ Refresh</button>
      </div>

      {/* Table */}
      {loading ? <LoadingRow /> : (
        <div className="overflow-x-auto border border-ink bg-white">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Date</th><th>Name</th><th>Phone</th><th>Item(s)</th><th>Rating</th><th>Feedback</th><th>Suggestion</th><th>Type</th><th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No records found.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="font-semibold">{r.name || '—'}</td>
                  <td className="whitespace-nowrap">{r.phone || '—'}</td>
                  <td>{r.item_ordered || '—'}</td>
                  <td className="whitespace-nowrap"><StarRating value={r.stars} readonly /></td>
                  <td className="max-w-[200px] truncate" title={r.feedback_msg}>{r.feedback_msg || '—'}</td>
                  <td className="max-w-[150px] truncate" title={r.suggestion}>{r.suggestion || '—'}</td>
                  <td>
                    {r.phone && phoneCount[r.phone] > 1
                      ? <span className="badge badge-primary">Returning</span>
                      : <span className="badge badge-accent">New</span>}
                  </td>
                  <td className="text-right">
                    <button onClick={() => deleteCustomer(r.id)} className="text-gray-400 hover:text-primary text-lg" title="Delete">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Staff Tab ─────────────────────────────────────────────── */
function StaffTab() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [markInput, setMarkInput] = useState(10);
  const [markNote, setMarkNote]   = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [marks, setMarks]         = useState([]);
  const [todayMark, setTodayMark] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('staff_reports').select('*').order('created_at', { ascending: false });
    if (dateFilter) q = q.gte('created_at', dateFilter + 'T00:00:00').lte('created_at', dateFilter + 'T23:59:59');
    const { data } = await q;
    setLoading(false);
    if (data) setRows(data);
  }, [dateFilter]);

  const loadLeaderboardAndAwards = useCallback(async () => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonthStr = String(now.getMonth() + 1).padStart(2, '0');
    // Load current month's leaderboard
    const { data: mData } = await supabase.from('staff_marks').select('*').gte('date', `${currYear}-${currMonthStr}-01`);
    if (mData) {
      const bMap = {};
      mData.forEach(m => {
        const k = m.staff_phone || m.staff_name;
        if (!bMap[k]) bMap[k] = { name: m.staff_name, phone: m.staff_phone, total: 0 };
        bMap[k].total += m.mark;
      });
      setLeaderboard(Object.values(bMap).sort((a, b) => b.total - a.total));
    }

    // Auto-award Best Staff on the LAST DAY of the current month
    const currMonth = now.getMonth() + 1; // 1-12
    const lastDayOfMonth = new Date(currYear, currMonth, 0).getDate();
    
    if (now.getDate() === lastDayOfMonth) {
      const { data: existing } = await supabase.from('staff_achievements').select('id').eq('month', currMonth).eq('year', currYear).eq('title', 'Best Staff of the Month');
      if (!existing || existing.length === 0) {
        if (mData && mData.length > 0) {
          const top = Object.values(bMap).sort((a, b) => b.total - a.total)[0];
          if (top) {
            await supabase.from('staff_achievements').insert([{ staff_name: top.name, staff_phone: top.phone, month: currMonth, year: currYear, title: 'Best Staff of the Month' }]);
            toast.success(`🏆 Auto-awarded Best Staff of the month to ${top.name}!`);
          }
        }
      }
    }
  }, []);

  useEffect(() => { load(); loadLeaderboardAndAwards(); }, [load, loadLeaderboardAndAwards]);

  // Build unique staff list
  const staffMap = {};
  rows.forEach((r) => {
    const key = r.phone || r.name;
    if (!staffMap[key]) staffMap[key] = { name: r.name, phone: r.phone, reports: [] };
    staffMap[key].reports.push(r);
  });
  const staffList = Object.values(staffMap);

  const loadAchievements = async (phone) => {
    const { data } = await supabase.from('staff_achievements').select('*').eq('staff_phone', phone || '').order('awarded_at', { ascending: false });
    setAchievements(data || []);
  };

  const deleteAchievement = async (id, staff) => {
    if (!window.confirm('Remove this achievement?')) return;
    toast.loading('Deleting...', { id: 'del-ach' });
    const { error } = await supabase.from('staff_achievements').delete().eq('id', id);
    if (!error) {
      toast.success('Achievement removed', { id: 'del-ach' });
      loadAchievements(staff.phone);
    } else toast.error('Failed to delete', { id: 'del-ach' });
  };

  const openProfile = async (staff) => {
    setSelected(staff);
    setMarkInput(10);
    setMarkNote('');
    loadAchievements(staff.phone);
    
    // Fetch their marks
    const { data: mData } = await supabase.from('staff_marks')
        .select('*')
        .or(`staff_phone.eq.${staff.phone},staff_name.eq.${staff.name}`)
        .order('date', { ascending: false });
    
    const localDateStr = new Date().toISOString().slice(0, 10);
    const tm = mData?.find(m => m.date === localDateStr);
    
    setMarks(mData || []);
    setTodayMark(tm || null);
  };

  const assignMark = async (staff, m) => {
    toast.loading('Saving mark...', { id: 'mark' });
    const { data, error } = await supabase.from('staff_marks').insert([{
      staff_name: staff.name, staff_phone: staff.phone, mark: m, admin_note: markNote,
    }]).select();
    if (!error) {
      toast.success('Mark assigned!', { id: 'mark' });
      setMarkInput(10);
      setMarkNote('');
      if (data && data[0]) {
        setMarks([data[0], ...marks]);
        setTodayMark(data[0]);
        loadLeaderboardAndAwards(); // Refresh live leaderboard
      }
    } else toast.error('Failed to assign mark', { id: 'mark' });
  };

  const avgStars = (reports) => {
    if (!reports.length) return 0;
    return (reports.reduce((a, r) => a + r.day_stars, 0) / reports.length).toFixed(1);
  };

  const deleteStaffReport = async (id) => {
    if (!window.confirm('Delete this specific daily report?')) return;
    toast.loading('Deleting report...', { id: 'del-rep' });
    const { error } = await supabase.from('staff_reports').delete().eq('id', id);
    if (!error) {
      toast.success('Report deleted', { id: 'del-rep' });
      setSelected(prev => ({ ...prev, reports: prev.reports.filter(r => r.id !== id) }));
      load();
    } else toast.error('Failed to delete', { id: 'del-rep' });
  };

  const wipeStaff = async (staff) => {
    const code = prompt(`Type "DELETE" to permanently wipe all data for ${staff.name}`);
    if (code !== 'DELETE') return toast.error('Wipe cancelled.');
    toast.loading('Wiping staff history...', { id: 'wipe' });
    await Promise.all([
      supabase.from('staff_reports').delete().or(`phone.eq.${staff.phone},name.eq.${staff.name}`),
      supabase.from('staff_marks').delete().or(`staff_phone.eq.${staff.phone},staff_name.eq.${staff.name}`),
      supabase.from('staff_achievements').delete().or(`staff_phone.eq.${staff.phone},staff_name.eq.${staff.name}`)
    ]);
    toast.success('Staff wiped completely.', { id: 'wipe' });
    setSelected(null);
    load();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Staff list */}
      <div className="flex-1">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <input type="date" className="form-input max-w-xs text-xs" value={dateFilter} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDateFilter(e.target.value)} />
          <button onClick={() => setDateFilter('')} className="btn btn-sm border-ink">Clear</button>
          <button onClick={load} className="btn btn-sm border-accent text-accent hover:bg-accent hover:text-white">↻ Refresh</button>
        </div>

        {/* Live Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="border border-ink bg-white p-4 mb-4 flex items-center justify-between shadow-[4px_4px_0_0_#16a34a]">
            <div>
              <p className="font-mono text-[9px] text-green-700 font-bold tracking-widest uppercase">Live Sub-Month Leaderboard</p>
              <p className="font-black text-xl uppercase mt-1">1st Place: {leaderboard[0].name}</p>
            </div>
            <div className="text-right">
              <span className="font-black text-3xl text-green-700">{leaderboard[0].total}</span>
              <span className="font-mono text-xs text-gray-500 block">Marks</span>
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-ink bg-white mb-4">
          <Stat label="Total Staff" value={staffList.length} />
          <Stat label="Reports Today" value={rows.filter((r) => r.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length} />
          <Stat label="Total Reports" value={rows.length} />
        </div>

        {loading ? <LoadingRow /> : (
          <div className="overflow-x-auto border border-ink bg-white">
            <table className="w-full data-table">
              <thead><tr><th>Name</th><th>Phone</th><th>Reports</th><th>Avg Day ★</th><th>Latest</th><th>Action</th></tr></thead>
              <tbody>
                {staffList.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No staff reports yet.</td></tr>
                ) : staffList.map((s, i) => (
                  <tr key={i}>
                    <td className="font-semibold">{s.name}</td>
                    <td>{s.phone || '—'}</td>
                    <td>{s.reports.length}</td>
                    <td>{avgStars(s.reports)} ★</td>
                    <td>{fmtDate(s.reports[0]?.created_at)}</td>
                    <td>
                      <button onClick={() => openProfile(s)} className="btn btn-sm border-accent text-accent hover:bg-accent hover:text-white">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff profile side panel */}
      {selected && (
        <div className="w-full lg:w-80 flex-shrink-0 border border-ink bg-white p-5 space-y-5 sticky top-24 self-start max-h-[80vh] overflow-y-auto shadow-[4px_4px_0_0_#0a0a0a]">
          <div className="flex items-center justify-between">
            <p className="font-black text-sm uppercase">{selected.name}</p>
            <button onClick={() => setSelected(null)} className="font-mono text-[10px] text-gray-400 hover:text-ink">✕ Close</button>
          </div>
          <p className="font-mono text-[10px] text-gray-400">{selected.phone} · {selected.reports.length} reports</p>
          
          <div className="p-3 bg-gray-50 border border-ink text-center flex flex-col items-center">
            <span className="font-black text-3xl text-ink">{achievements.length}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-gray-500">Lifetime Awards</span>
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div>
              <p className="form-label mb-2">Achievements</p>
              <div className="flex flex-wrap gap-1">
                {achievements.map((a, i) => (
                  <span key={i} className="badge badge-ink text-[9px] relative pr-6 group">
                    🏆 {a.title} {a.month}/{a.year}
                    <button onClick={() => deleteAchievement(a.id, selected)} title="Delete Award" className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assign mark */}
          <div className="border-t border-ink pt-4">
            <p className="form-label mb-2">Assign Today's Mark (0-10)</p>
            {todayMark ? (
              <div className="border border-green-600 bg-green-50 p-4 mb-4">
                <p className="font-mono text-[11px] text-green-700 font-bold uppercase">✓ Mark Saved Today</p>
                <p className="font-black text-2xl text-green-800">{todayMark.mark}<span className="text-sm opacity-50">/10</span></p>
                {todayMark.admin_note && <p className="font-mono text-[10px] text-green-700 mt-2 px-2 py-1 bg-white border border-green-200">Note: {todayMark.admin_note}</p>}
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                <div className="flex gap-2">
                  <input type="number" min="0" max="10" className="form-input flex-1 text-center font-black text-xl" value={markInput} onChange={(e) => setMarkInput(Number(e.target.value))} />
                  <button onClick={() => assignMark(selected, markInput)} className="btn bg-white">Save</button>
                </div>
                <input type="text" placeholder="Admin note (optional)" className="form-input text-xs" value={markNote} onChange={(e) => setMarkNote(e.target.value)} />
              </div>
            )}
          </div>

          {/* Recent reports */}
          <div className="border-t border-ink pt-4">
            <p className="form-label mb-2">Recent Reports</p>
            <div className="space-y-3">
              {selected.reports.map((r, i) => (
                <div key={i} className="border border-muted p-3 relative group">
                  <button onClick={() => deleteStaffReport(r.id)} className="absolute top-2 right-2 text-gray-300 hover:text-primary transition-opacity" title="Delete Report">🗑️</button>
                  <div className="flex justify-between items-center mb-1 pr-6">
                    <p className="font-mono text-[9px] text-gray-400">{fmtDate(r.created_at)}</p>
                    <StarRating value={r.day_stars} readonly />
                  </div>
                  {r.feedback && <p className="font-mono text-[10px] text-gray-600 truncate">"{r.feedback}"</p>}
                  {r.complaints && <p className="font-mono text-[10px] text-primary truncate">⚠ {r.complaints}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Past Marks */}
          {marks.length > 0 && (
            <div className="border-t border-ink pt-4 mt-6">
              <p className="form-label mb-2">Recent Marks</p>
              <div className="space-y-2">
                {marks.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 border border-ink px-3 py-2">
                    <div>
                      <p className="font-mono text-[10px] text-ink">{m.date}</p>
                      {m.admin_note && <p className="font-mono text-[9px] text-gray-500 truncate max-w-[150px]">Note: {m.admin_note}</p>}
                    </div>
                    <span className="font-black text-sm">{m.mark}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-ink pt-4 mt-6">
            <button onClick={() => wipeStaff(selected)} className="w-full font-mono text-[10px] uppercase text-primary border border-primary border-dashed p-3 hover:bg-primary hover:text-white transition-colors">
              🗑 Wipe All Staff Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Daily Report Tab ──────────────────────────────────────── */
function DailyReportTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeReport, setActiveReport] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  
  const todayDateStr = new Date().toISOString().slice(0, 10);
  
  const loadHistory = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('saved_daily_reports').select('*').order('report_date', { ascending: false });
    if (data) setHistory(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const deleteAIReport = async (dateStr) => {
    if (!window.confirm(`Permanently delete AI Report for ${dateStr}?`)) return;
    toast.loading('Deleting AI Report...', { id: 'del-ai' });
    const { error } = await supabase.from('saved_daily_reports').delete().eq('report_date', dateStr);
    if (error) { toast.error('Failed to delete report', { id: 'del-ai' }); }
    else { toast.success(`Report for ${dateStr} deleted!`, { id: 'del-ai' }); loadHistory(); }
  };

  const fetchFullReport = async (dateStr, autoOpen = true) => {
    if (autoOpen) setLoadingModal(true);
    try {
      const start = `${dateStr}T00:00:00`;
      const end   = `${dateStr}T23:59:59`;

      const [{ data: cData }, { data: sData }, { data: savedReport }] = await Promise.all([
        supabase.from('customer_feedback').select('*').gte('created_at', start).lte('created_at', end),
        supabase.from('staff_reports').select('*').gte('created_at', start).lte('created_at', end),
        supabase.from('saved_daily_reports').select('*').eq('report_date', dateStr).maybeSingle(),
      ]);

      const customers = cData || [];
      const staff     = sData || [];

      // Find best selling item
      const itemCounts = {};
      let bestItemCount = 0;
      let bestItem = 'None';
      customers.forEach(c => {
        if (!c.item_ordered) return;
        const i = c.item_ordered.toLowerCase().trim();
        itemCounts[i] = (itemCounts[i] || 0) + 1;
        if (itemCounts[i] > bestItemCount) {
          bestItemCount = itemCounts[i];
          bestItem = c.item_ordered;
        }
      });

      // Find completely historically returning customers
      const todaysPhones = customers.map(c => c.phone).filter(Boolean);
      let pastReturningPhones = new Set();

      if (todaysPhones.length > 0) {
        const { data: pastData } = await supabase.from('customer_feedback')
          .select('phone')
          .in('phone', todaysPhones)
          .lt('created_at', start);
        if (pastData) pastData.forEach(p => pastReturningPhones.add(p.phone));
      }

      const phoneFreq = {};
      customers.forEach((c) => { if (c.phone) phoneFreq[c.phone] = (phoneFreq[c.phone] || 0) + 1; });
      
      const totalUniqueCustomers = Object.keys(phoneFreq).length || customers.length; // fallback if no phones
      const uniqueReturning = Object.keys(phoneFreq).filter(p => phoneFreq[p] > 1 || pastReturningPhones.has(p)).length;
      
      const returningCount = uniqueReturning;
      const returnRate = totalUniqueCustomers ? Math.round((returningCount / totalUniqueCustomers) * 100) : 0;

      const custAvgStars  = customers.length ? (customers.reduce((a, r) => a + r.stars, 0) / customers.length) : 0;
      const staffAvgStars = staff.length ? (staff.reduce((a, r) => a + r.day_stars, 0) / staff.length) : 0;
      const bestCust      = customers.reduce((best, r) => r.stars > (best?.stars || 0) ? r : best, null);
      const complaints    = staff.filter((r) => r.complaints && r.complaints.trim().length > 3).map((r) => r.complaints);

      const payload = {
        date: dateStr, customers, staff, custAvgStars, staffAvgStars, 
        returningCount, returnRate, bestItem, bestItemCount,
        bestCust, complaints, aiParagraph: savedReport?.ai_content || null, 
        generated_at: savedReport?.generated_at
      };
      
      if (autoOpen) setActiveReport(payload);
      return payload;
    } catch (err) {
      toast.error('Failed to load full report stats.');
      console.error(err);
    }
    if (autoOpen) setLoadingModal(false);
  };

  const generateToday = async (forceDate) => {
    const targetDate = forceDate || todayDateStr;
    setLoadingModal(true);
    toast.loading(`Gathering data for ${targetDate}...`, { id: 'ai' });
    
    // Fetch raw stats first
    const payload = await fetchFullReport(targetDate, false);
    if (!payload || (payload.customers.length === 0 && payload.staff.length === 0)) { 
      toast.error(`Cannot generate: No customer or staff entries found for ${targetDate}.`, { id: 'ai' }); 
      setLoadingModal(false); 
      return; 
    }

    toast.loading('Running Deep Analysis via Groq...', { id: 'ai' });
    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqKey) throw new Error("No VITE_GROQ_API_KEY found in .env.");

      const prompt = `You are a manager at ZECHAI cafe.
Analyze today's data and write a highly scannable, easy-to-read End-of-Day Markdown report.
You MUST use incredibly simple, everyday language. Avoid complex business jargon or large vocabulary.
The report must be concise and easily readable in under 5 minutes.
Highlight specific achievements or failures, completely breakdown staff vs customer experiences, and provide a strict management action plan.

Structure the response meticulously with Markdown:
# EXECUTIVE SUMMARY
*Write a short, punchy paragraph summarizing the entire day using simple words.*
*Immediately after the paragraph, provide a bolded bulleted list containing EXACTLY and ONLY these two metrics:*
*- Return Rate: ${payload.returnRate}% (${payload.returningCount} returning customers)*
*- Best Selling Item: ${payload.bestItem}*
*CRITICAL: Do NOT invent, hallucinate, or assume any monetary metrics like Revenue, Sales, or Profit. ONLY use the data provided.*

# CUSTOMER SENTIMENT & HIGHLIGHTS
*Identify specific feedback praising our staff or food.*

# STAFF PERFORMANCE & COMPLAINTS
*Identify any operational friction, staff grievances, and things the team needs.*

# MANAGEMENT ACTION PLAN
*Give 3-5 bulleted, highly specific actionable steps based on today's exact problems.*

Do NOT use generic fillers. Be extremely specific using the exact names and feedback provided below.

CUSTOMER DATA:
${payload.customers.map((c) => `[${c.name} | ${c.stars}★ | Item: ${c.item_ordered}] Feedback: "${c.feedback_msg}". Suggestion: "${c.suggestion}"`).join('\n') || 'No feedback.'}

STAFF DATA:
${payload.staff.map((s) => `[Staff: ${s.name} | Day: ${s.day_stars}★] Complaints: "${s.complaints}". Feedback: "${s.feedback}". Suggestions: "${s.suggestions}"`).join('\n') || 'No staff reports.'}`;

      const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey.trim()}` },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || `API Error: ${res.status}`);
      
      const text = json?.choices?.[0]?.message?.content;
      if (text) {
        const { error } = await supabase.from('saved_daily_reports').upsert({
          report_date: targetDate,
          ai_content: text,
          generated_at: new Date().toISOString()
        });
        if (error) throw error;
        toast.success('Report successfully Generated & Saved!', { id: 'ai' });
        loadHistory();
      }
    } catch (err) {
      console.error(err);
      toast.error('AI Generation Failed: ' + err.message, { id: 'ai' });
    }
    setLoadingModal(false);
  };

  const [customGenDate, setCustomGenDate] = useState(todayDateStr);
  const hasSelectedDate = history.some(h => h.report_date === customGenDate);

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 items-start sm:flex-row sm:justify-between sm:items-end">
        <div>
          <p className="section-label mb-2">[ Artificial Intelligence ]</p>
          <h2 className="text-3xl font-black uppercase tracking-tight">AI Report<br/>Archive</h2>
          <div className="mt-3 h-1 w-10 bg-ink" />
        </div>
        
        <div className="flex flex-col gap-2 p-4 bg-paper border border-ink shadow-[4px_4px_0_0_#0a0a0a]">
          <p className="font-mono text-[9px] uppercase tracking-widest text-gray-500 font-bold">Generate Specific Date</p>
          <div className="flex gap-2">
             <input type="date" value={customGenDate} max={todayDateStr} onChange={e => setCustomGenDate(e.target.value)} className="form-input text-xs flex-1 min-w-[130px]" />
             {hasSelectedDate ? (
               <div className="border border-green-600 bg-green-50 px-3 py-2 flex items-center justify-center">
                 <p className="font-mono text-[10px] text-green-700 font-bold uppercase tracking-widest text-center">✓ Locked</p>
               </div>
             ) : (
               <button onClick={() => generateToday(customGenDate)} disabled={loadingModal} className="btn-accent px-4 py-2 text-xs">
                 {loadingModal ? '⟳...' : '★ Generate'}
               </button>
             )}
          </div>
        </div>
      </div>

      {!import.meta.env.VITE_GROQ_API_KEY && (
        <div className="border border-primary text-primary px-3 py-2 bg-white mb-6 font-mono text-[9px] uppercase tracking-widest">
          ⚠ No VITE_GROQ_API_KEY set — AI logic is disabled.
        </div>
      )}

      {loading ? <LoadingRow /> : history.length === 0 ? (
        <div className="border border-ink bg-white p-12 text-center text-gray-500 font-mono text-xs uppercase tracking-widest">
          No historical reports saved yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((h, i) => (
            <div key={i} className="relative group flex flex-col text-left border border-ink bg-white p-5 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#e1492c] hover:border-accent transition-all duration-200">
              <button onClick={() => deleteAIReport(h.report_date)} className="absolute top-4 right-4 text-gray-300 hover:text-primary transition-opacity z-10" title="Delete Archive">🗑️</button>
              
              <button className="flex flex-col items-start gap-4 flex-1 text-left" onClick={() => fetchFullReport(h.report_date)}>
                <div className="w-full border-b border-ink border-dashed pb-3 pr-6">
                  <p className="font-black text-xl uppercase text-ink group-hover:text-accent transition-colors">
                    {new Date(h.report_date + 'T12:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="font-mono text-[9px] text-gray-400 mt-1 uppercase tracking-widest">{fmtDate(h.generated_at)}</p>
                </div>
                <p className="font-mono text-[11px] text-gray-600 line-clamp-3 leading-relaxed w-full">
                  {h.ai_content.replace(/[#*]/g, '')}
                </p>
                <span className="font-mono text-[9px] text-accent uppercase tracking-widest mt-auto border border-accent px-2 py-1">View Full →</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Popup Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/90 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border-2 border-ink w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_0_0_#e1492c] relative flex flex-col">
            <button 
              onClick={() => setActiveReport(null)} 
              className="sticky top-0 float-right self-end m-4 bg-ink text-white hover:bg-accent font-mono text-[11px] px-4 py-2 uppercase tracking-widest z-10"
            >
              ✕ Close
            </button>
            <div className="-mt-10"> {/* offset for absolute close btn */}
              <ReportView report={activeReport} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportView({ report }) {
  const { date, customers, staff, custAvgStars, staffAvgStars, returningCount, returnRate, bestItem, bestItemCount, bestCust, complaints, aiParagraph, generated_at } = report;
  return (
    <div className="bg-white">
      {/* Report header */}
      <div className="border-b-2 border-ink p-8 flex justify-between items-end bg-paper">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-accent font-bold uppercase">[ OFFICIAL DAILY LOG ]</p>
          <h3 className="font-black text-4xl uppercase mt-2 tracking-tight">
            {new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <p className="font-mono text-[9px] text-gray-500 text-right uppercase tracking-widest">
          Generated<br/>
          {fmtDate(generated_at)}
        </p>
      </div>

      {/* AI Paragraph (Now placed highly aggressively at top) */}
      <div className="p-8 border-b-2 border-ink bg-white">
        <p className="section-label mb-6 border-l-4 border-accent pl-3">[ Executive AI Insights ]</p>
        <div className="prose prose-sm font-mono max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-h1:text-xl prose-h2:text-lg prose-h3:text-md prose-p:text-[12px] prose-p:leading-relaxed prose-li:text-[11px] prose-strong:text-accent prose-strong:font-bold">
          {aiParagraph ? (
             <ReactMarkdown>{aiParagraph}</ReactMarkdown>
          ) : (
             <p className="text-gray-400">AI Data Missing or Errored during generation.</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-ink">
        {/* Customer section */}
        <div className="p-8 bg-gray-50">
          <p className="section-label mb-6 text-ink">[ Raw Customer Flow ]</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Stat label="Total Feedback" value={customers.length} small />
            <Stat label="Avg Rating" value={`${custAvgStars.toFixed(1)} ★`} small />
            <Stat label="Returning Rate" value={`${returnRate}%`} small accent />
            <Stat label="Best Selling" value={bestItem} small />
          </div>
          {customers.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scroll">
              {customers.map((c, i) => (
                <div key={i} className="border border-ink bg-white p-3 shadow-[2px_2px_0_0_#0a0a0a]">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-[11px] uppercase">{c.name || 'Anonymous'}</p>
                    <StarRating value={c.stars} readonly />
                  </div>
                  <p className="font-mono text-[10px] text-ink font-bold opacity-80 mb-1">{c.item_ordered}</p>
                  {c.feedback_msg && <p className="font-mono text-[10px] text-gray-600 mb-1 leading-relaxed">"{c.feedback_msg}"</p>}
                  {c.suggestion && <p className="font-mono text-[10px] text-accent font-bold mt-2 pt-2 border-t border-dashed border-gray-200">💡 {c.suggestion}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff section */}
        <div className="p-8 bg-paper">
          <p className="section-label mb-6 text-ink">[ Raw Staff Pulse ]</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Stat label="Reports" value={staff.length} small />
            <Stat label="Avg Day ★" value={`${staffAvgStars.toFixed(1)} ★`} small />
            <Stat label="Complaints Level" value={complaints.length} small accent />
          </div>
          {staff.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scroll">
              {staff.map((s, i) => (
                <div key={i} className="border border-ink bg-white p-3 shadow-[2px_2px_0_0_#e1492c]">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-[11px] uppercase">{s.name}</p>
                    <div className="flex bg-gray-100 px-1 py-0.5 rounded-sm"><StarRating value={s.day_stars} readonly /></div>
                  </div>
                  {s.feedback && <p className="font-mono text-[10px] text-gray-600 mb-1 leading-relaxed">"{s.feedback}"</p>}
                  {s.complaints && <p className="font-mono text-[10px] text-primary font-bold mt-2 pt-2 border-t border-dashed border-gray-200">⚠ {s.complaints}</p>}
                  {s.suggestions && <p className="font-mono text-[10px] text-accent mt-2">💡 {s.suggestions}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────── */
function Stat({ label, value, accent, small }) {
  return (
    <div className={`border-r border-ink last:border-r-0 p-4 ${small ? 'p-3' : 'p-4'} bg-white`}>
      <p className={`font-mono text-[9px] tracking-widest uppercase text-gray-400 mb-1`}>{label}</p>
      <p className={`font-black ${small ? 'text-xl' : 'text-2xl'} ${accent ? 'text-accent' : 'text-ink'}`}>{value}</p>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="border border-ink bg-white p-12 text-center">
      <p className="font-mono text-[11px] text-gray-400 tracking-widest animate-pulse">Loading data...</p>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
