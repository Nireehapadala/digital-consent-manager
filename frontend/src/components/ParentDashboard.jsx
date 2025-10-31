// src/components/ParentDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './ParentDashboard.css';

function ParentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('unsigned');
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [signature, setSignature] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const response = await axios.get('${import.meta.env.VITE_BACKEND_URL}/api/submissions/parent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignForm = (submission) => {
    setSelectedSubmission(submission);
    setSignature('');
    setShowSignModal(true);
  };

  const handleViewForm = (submission) => {
    setSelectedSubmission(submission);
    setShowViewModal(true);
  };

  const handleSubmitSignature = async () => {
    if (!signature) {
      alert('Please enter your signature');
      return;
    }

    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/submissions/${selectedSubmission._id}`,
        {
          parentSignature: signature,
          status: 'sent_to_admin'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Form signed and sent to admin successfully!');
      setShowSignModal(false);
      loadSubmissions();
    } catch (err) {
      alert('Failed to sign form');
    }
  };

  const filterSubmissions = () => {
    if (activeTab === 'unsigned') {
      return submissions.filter(sub => sub.status === 'sent_to_parent');
    } else {
      return submissions.filter(sub => sub.status !== 'sent_to_parent');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'sent_to_parent': return '#FFA500';
      case 'sent_to_admin': return '#1E90FF';
      case 'approved': return '#32CD32';
      case 'rejected': return '#DC143C';
      default: return '#000';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Parent Dashboard</h2>
        <div className="user-info">
          <span>{user.name}</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-nav">
        <button 
          className={activeTab === 'unsigned' ? 'active' : ''} 
          onClick={() => setActiveTab('unsigned')}
        >
          Unsigned Forms
        </button>
        <button 
          className={activeTab === 'signed' ? 'active' : ''} 
          onClick={() => setActiveTab('signed')}
        >
          Signed Forms
        </button>
      </div>

      <div className="dashboard-content">
        <div className="submissions-list">
          {filterSubmissions().map(sub => (
            <div key={sub._id} className="submission-card">
              <h3>{sub.formTitle}</h3>
              <p><strong>Student:</strong> {sub.studentName}</p>
              <p><strong>Section:</strong> {sub.studentSection}</p>
              <p><strong>Roll Number:</strong> {sub.studentRollNumber}</p>
              <p><strong>Date:</strong> {new Date(sub.createdAt).toLocaleDateString()}</p>
              <p style={{ color: getStatusColor(sub.status), fontWeight: 'bold' }}>
                Status: {sub.status.replace(/_/g, ' ').toUpperCase()}
              </p>
              
              <div className="card-actions">
                <button onClick={() => handleViewForm(sub)} className="btn-view">
                  View Details
                </button>
                {sub.status === 'sent_to_parent' && (
                  <button onClick={() => handleSignForm(sub)} className="btn-sign">
                    Sign & Send to Admin
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSignModal && selectedSubmission && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Sign Form - {selectedSubmission.formTitle}</h2>
            
            <div className="view-details">
              <p><strong>Student:</strong> {selectedSubmission.studentName}</p>
              <p><strong>Section:</strong> {selectedSubmission.studentSection}</p>
              <p><strong>Roll Number:</strong> {selectedSubmission.studentRollNumber}</p>
              
              <h3>Form Data:</h3>
              {Object.entries(selectedSubmission.formData).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {value}</p>
              ))}
            </div>

            <div className="form-group">
              <label>Your Signature</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name as signature"
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleSubmitSignature} className="btn-submit">
                Sign & Send to Admin
              </button>
              <button onClick={() => setShowSignModal(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedSubmission && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{selectedSubmission.formTitle}</h2>
            
            <div className="view-details">
              <p><strong>Student:</strong> {selectedSubmission.studentName}</p>
              <p><strong>Section:</strong> {selectedSubmission.studentSection}</p>
              <p><strong>Roll Number:</strong> {selectedSubmission.studentRollNumber}</p>
              <p><strong>Date:</strong> {new Date(selectedSubmission.createdAt).toLocaleString()}</p>
              <p><strong>Status:</strong> <span style={{ color: getStatusColor(selectedSubmission.status) }}>
                {selectedSubmission.status.replace(/_/g, ' ').toUpperCase()}
              </span></p>
              
              <h3>Form Data:</h3>
              {Object.entries(selectedSubmission.formData).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {value}</p>
              ))}

              {selectedSubmission.parentSignature && (
                <p><strong>Parent Signature:</strong> {selectedSubmission.parentSignature}</p>
              )}

              {selectedSubmission.adminComments && (
                <p><strong>Admin Comments:</strong> {selectedSubmission.adminComments}</p>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowViewModal(false)} className="btn-cancel">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;