import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const BikeRequestForm = () => {
  const [formData, setFormData] = useState({
    bike_name: '',
    customer_name: '',
    contact: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bike_name.trim() || !formData.customer_name.trim() || !formData.contact.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const reqId = 'REQ-' + Date.now();
      const { error: dbError } = await supabase.from('requests').insert([{
        bike_name: formData.bike_name.trim(),
        customer_name: formData.customer_name.trim(),
        contact: formData.contact.trim(),
        source: 'web',
        status: 'pending',
        seen: false,
        session_id: reqId,
        message: `Bike: ${formData.bike_name.trim()} | Name: ${formData.customer_name.trim()} | Contact: ${formData.contact.trim()}`
      }]);

      if (dbError) throw dbError;

      setRequestId(reqId);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container page-wrapper">
        <div className="request-confirm-card">
          <CheckCircle size={48} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
          <h2>Request Confirmed!</h2>
          <p className="confirm-id">Your Request ID: <strong style={{ color: 'var(--text-main)' }}>{requestId}</strong></p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Save this ID — we'll use it to connect with you when the bike is available.
          </p>
          <table className="request-confirm-table">
            <tbody>
              <tr>
                <td>Bike Name</td>
                <td>{formData.bike_name}</td>
              </tr>
              <tr>
                <td>Your Name</td>
                <td>{formData.customer_name}</td>
              </tr>
              <tr>
                <td>Contact</td>
                <td>{formData.contact}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.5' }}>
            We've received your request! We'll notify you as soon as the bike becomes available.
          </p>
          <Link to="/" className="glass-btn" style={{ marginTop: '20px', display: 'inline-flex' }}>
            <ArrowLeft size={16} /> Back to Inventory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      <Link to="/" className="glass-btn" style={{ marginBottom: '32px' }}>
        <ArrowLeft size={16} /> Back to Inventory
      </Link>

      <div className="add-bike-card glass-panel" style={{ maxWidth: '540px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '8px' }}>Request a Bike</h2>
        <p className="subtitle" style={{ marginBottom: '32px', color: 'var(--text-muted)' }}>
          Can't find what you're looking for? Tell us and we'll find it for you.
        </p>

        <form onSubmit={handleSubmit} className="add-form">
          <div className="form-group">
            <label>Bike Name</label>
            <input
              type="text"
              name="bike_name"
              value={formData.bike_name}
              onChange={handleChange}
              required
              placeholder="e.g. Yamaha R15 V3, Honda CB750..."
            />
          </div>

          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              placeholder="Your full name"
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
              placeholder="e.g. 9876543210"
            />
          </div>

          {error && (
            <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>
          )}

          <button type="submit" className="primary-btn submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BikeRequestForm;
