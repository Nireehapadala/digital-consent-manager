// src/components/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentDashboard.css';

function StudentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('available');
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [parentEmail, setParentEmail] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadAvailableForms();
    loadSubmissions();
  }, []);

  const loadAvailableForms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/forms/available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForms(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubmissions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/submissions/student', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartForm = (form) => {
    setSelectedForm(form);
    setFormData({});
    setParentEmail('');
    setShowFormModal(true);
  };

  const handleFormDataChange = (fieldName, value) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });
  };

  const handleSaveDraft = async () => {
    try {
      await axios.post('http://localhost:5000/api/submissions', {
        formId: selectedForm._id,
        formTitle: selectedForm.title,
        formData,
        status: 'draft'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Draft saved successfully!');
      setShowFormModal(false);
      loadSubmissions();
    } catch (err) {
      alert('Failed to save draft');
    }
  };

  const handleSendToParent = async () => {
    if (!parentEmail) {
      alert('Please enter parent email');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/submissions', {
        formId: selectedForm._id,
        formTitle: selectedForm.title,
        formData,
        parentEmail,
        status: 'sent_to_parent'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Form sent to parent successfully!');
      setShowFormModal(false);
      loadSubmissions();
    } catch (err) {
      alert('Failed to send to parent');
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowViewModal(true);
  };

  const filterSubmissions = (status) => {
    if (status === 'all') return submissions;
    return submissions.filter(sub => sub.status === status);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'draft': return '#808080';
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
        <h2>Student Dashboard</h2>
        <div className="user-info">
          <span>{user.name} - Section {user.section} - Roll No: {user.rollNumber}</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-nav">
        <button 
          className={activeTab === 'available' ? 'active' : ''} 
          onClick={() => setActiveTab('available')}
        >
          Available Forms
        </button>
        <button 
          className={activeTab === 'draft' ? 'active' : ''} 
          onClick={() => setActiveTab('draft')}
        >
          Draft
        </button>
        <button 
          className={activeTab === 'sent_to_parent' ? 'active' : ''} 
          onClick={() => setActiveTab('sent_to_parent')}
        >
          Sent to Parent
        </button>
        <button 
          className={activeTab === 'approved' ? 'active' : ''} 
          onClick={() => setActiveTab('approved')}
        >
          Approved
        </button>
        <button 
          className={activeTab === 'rejected' ? 'active' : ''} 
          onClick={() => setActiveTab('rejected')}
        >
          Rejected
        </button>
        <button 
          className={activeTab === 'submissions' ? 'active' : ''} 
          onClick={() => setActiveTab('submissions')}
        >
          All Submissions
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'available' && (
          <div className="forms-grid">
            {forms.map(form => (
              <div key={form._id} className="form-card">
                <h3>{form.title}</h3>
                <p>Fields: {form.fields.length}</p>
                <button onClick={() => handleStartForm(form)} className="btn-start">
                  Start Form
                </button>
              </div>
            ))}
          </div>
        )}

        {(activeTab === 'draft' || activeTab === 'sent_to_parent' || 
          activeTab === 'approved' || activeTab === 'rejected' || 
          activeTab === 'submissions') && (
          <div className="submissions-list">
            {filterSubmissions(activeTab === 'submissions' ? 'all' : activeTab).map(sub => (
              <div key={sub._id} className="submission-card">
                <h3>{sub.formTitle}</h3>
                <p>Date: {new Date(sub.createdAt).toLocaleDateString()}</p>
                <p style={{ color: getStatusColor(sub.status), fontWeight: 'bold' }}>
                  Status: {sub.status.replace(/_/g, ' ').toUpperCase()}
                </p>
                <button onClick={() => handleViewSubmission(sub)} className="btn-view">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{selectedForm.title}</h2>
            
            <div className="form-fields">
              {selectedForm.fields.map((field, index) => (
                <div key={index} className="form-group">
                  <label>{field.fieldName}</label>
                  <input
                    type={field.fieldType}
                    value={formData[field.fieldName] || ''}
                    onChange={(e) => handleFormDataChange(field.fieldName, e.target.value)}
                  />
                </div>
              ))}

              <div className="form-group">
                <label>Parent Email (for sending to parent)</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={handleSaveDraft} className="btn-draft">Save as Draft</button>
              <button onClick={handleSendToParent} className="btn-send">Send to Parent</button>
              <button onClick={() => setShowFormModal(false)} className="btn-cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedSubmission && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{selectedSubmission.formTitle}</h2>
            
            <div className="view-details">
              <p><strong>Status:</strong> <span style={{ color: getStatusColor(selectedSubmission.status) }}>
                {selectedSubmission.status.replace(/_/g, ' ').toUpperCase()}
              </span></p>
              <p><strong>Date:</strong> {new Date(selectedSubmission.createdAt).toLocaleString()}</p>
              
              <h3>Form Data:</h3>
              {Object.entries(selectedSubmission.formData).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {value}</p>
              ))}

              {selectedSubmission.parentEmail && (
                <p><strong>Parent Email:</strong> {selectedSubmission.parentEmail}</p>
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

export default StudentDashboard;