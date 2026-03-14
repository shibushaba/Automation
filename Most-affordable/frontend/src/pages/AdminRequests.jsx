import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const AdminRequests = ({ isAdmin }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    fetchRequests();
  }, [isAdmin, navigate]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching requests:', error.message);
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error('Exception fetching requests:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const markSeen = async (id) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ seen: true })
        .eq('id', id);
      if (error) throw error;
      setRequests(requests.map(req => req.id === id ? { ...req, seen: true } : req));
    } catch (error) {
      console.error('Failed to mark as seen:', error);
    }
  };

  const markResolved = async (id) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'resolved', seen: true })
        .eq('id', id);
      if (error) throw error;
      setRequests(requests.map(req => req.id === id ? { ...req, status: 'resolved', seen: true } : req));
    } catch (error) {
      alert('Failed to update request status.');
      console.error(error);
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm('Delete this request entirely?')) return;
    try {
      const { error } = await supabase.from('requests').delete().eq('id', id);
      if (error) throw error;
      setRequests(requests.filter(req => req.id !== id));
    } catch (error) {
      alert('Failed to delete request.');
      console.error(error);
    }
  };

  if (loading) return <div className="loading" style={{ textAlign: 'center', marginTop: '40px' }}>Loading Inbox...</div>;

  const unseenCount = requests.filter(r => !r.seen).length;

  return (
    <div className="admin-dashboard fade-in">
      <div className="admin-header-stacked">
        <h1>
          Requests Inbox
          {unseenCount > 0 && (
            <span className="badge-count" style={{ marginLeft: '12px', fontSize: '1rem', width: '28px', height: '28px' }}>
              {unseenCount}
            </span>
          )}
        </h1>
        <p className="admin-subtitle">Bike requests from Instagram DMs and website form.</p>
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')} style={{ marginTop: '20px' }}>
          &larr; Back to Dashboard
        </button>
      </div>

      <div className="admin-table-container glass-panel" style={{ marginTop: '40px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Bike Name</th>
              <th>Customer</th>
              <th>Contact</th>
              <th>Source</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className={req.status === 'resolved' ? 'row-sold' : ''}>
                <td data-label="Date" style={{ whiteSpace: 'nowrap' }}>
                  {!req.seen && <span className="unseen-dot" title="New / unseen"></span>}
                  {new Date(req.created_at).toLocaleDateString()}
                </td>
                <td data-label="Bike Name">
                  <strong>{req.bike_name || req.message || '—'}</strong>
                </td>
                <td data-label="Customer">
                  {req.customer_name || req.instagram_id || '—'}
                </td>
                <td data-label="Contact">
                  {req.contact || '—'}
                </td>
                <td data-label="Source">
                  {req.source === 'web'
                    ? <span className="source-label source-web">WEB</span>
                    : <span className="source-label source-insta">INSTA</span>
                  }
                </td>
                <td data-label="Status">
                  <span className={`status-badge ${req.status === 'resolved' ? 'status-sold' : 'status-available'}`}>
                    {(req.status || 'pending').toUpperCase()}
                  </span>
                </td>
                <td data-label="Actions" className="actions-cell">
                  {!req.seen && (
                    <button onClick={() => markSeen(req.id)} className="action-btn toggle-btn">
                      Mark Seen
                    </button>
                  )}
                  {req.status !== 'resolved' && (
                    <button onClick={() => markResolved(req.id)} className="action-btn toggle-btn">
                      Resolve
                    </button>
                  )}
                  <button onClick={() => deleteRequest(req.id)} className="action-btn delete-btn">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No requests yet. They'll appear here when customers submit them via Instagram or the website.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRequests;
