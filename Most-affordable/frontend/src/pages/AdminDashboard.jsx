import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = ({ isAdmin }) => {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unseenCount, setUnseenCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    fetchBikes();
    fetchUnseenCount();
  }, [isAdmin, navigate]);

  const fetchBikes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('bikes').select('*').order('id', { ascending: false });
      if (error) throw error;
      setBikes(data);
    } catch (error) {
      console.error('Error fetching bikes:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnseenCount = async () => {
    try {
      const { count, error } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('seen', false);
      if (!error) setUnseenCount(count || 0);
    } catch (e) {
      // table may not exist yet
    }
  };

  const deleteBike = async (id) => {
    if (!window.confirm(`Are you sure you want to delete bike ${id}?`)) return;
    try {
      const { error } = await supabase.from('bikes').delete().eq('id', id);
      if (error) throw error;
      setBikes(bikes.filter(bike => bike.id !== id));
      alert(`Bike ${id} deleted successfully.`);
    } catch (error) {
      console.error('Error deleting bike:', error.message);
      alert('Failed to delete bike.');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';
    try {
      const { error } = await supabase.from('bikes').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setBikes(bikes.map(bike => bike.id === id ? { ...bike, status: newStatus } : bike));
    } catch (error) {
      console.error('Error updating status:', error.message);
      alert('Failed to update status.');
    }
  };

  const filteredBikes = bikes.filter(bike => {
    const query = searchQuery.toLowerCase();
    return (
      bike.id.toLowerCase().includes(query) ||
      bike.make.toLowerCase().includes(query) ||
      bike.model.toLowerCase().includes(query)
    );
  });

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="admin-dashboard fade-in">
      <div className="admin-header-stacked">
        <h1>Dashboard Operations</h1>
        <p className="admin-subtitle">Manage your inventory, update pricing, and track availability.</p>
      </div>

      <div className="admin-controls glass-panel">
        <input
          type="text"
          placeholder="Search by ID, Make, or Model..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="glass-btn" style={{ position: 'relative' }} onClick={() => navigate('/admin/requests')}>
            📬 Requests Inbox
            {unseenCount > 0 && (
              <span className="badge-count">{unseenCount > 99 ? '99+' : unseenCount}</span>
            )}
          </button>
          <button className="primary-btn" onClick={() => navigate('/admin/add')}>+ Add New Vehicle</button>
        </div>
      </div>

      <div className="admin-card-grid">
        {filteredBikes.map(bike => (
          <div key={bike.id} className={`admin-bike-card ${bike.status === 'sold' ? 'row-sold' : ''}`}>
            <span className={`status-badge ${bike.status === 'available' ? 'status-available' : 'status-sold'}`}>
              {bike.status}
            </span>
            <img
              className="admin-card-img"
              src={(bike.image_urls && bike.image_urls[0]) || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop'}
              alt={`${bike.make} ${bike.model}`}
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop'; }}
            />
            <div className="admin-card-body">
              <div className="admin-card-id">{bike.id}</div>
              <div className="admin-card-title">{bike.year} {bike.make} {bike.model}</div>
              <div className="admin-card-price">₹{(bike.price || 0).toLocaleString('en-IN')}</div>
              <div className="admin-card-actions">
                <button onClick={() => navigate(`/admin/edit/${bike.id}`)} className="action-btn toggle-btn">
                  Edit
                </button>
                <button onClick={() => toggleStatus(bike.id, bike.status)} className="action-btn toggle-btn">
                  {bike.status === 'available' ? 'Mark Sold' : 'Mark Avail'}
                </button>
                <button onClick={() => deleteBike(bike.id)} className="action-btn delete-btn">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredBikes.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No bikes found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
