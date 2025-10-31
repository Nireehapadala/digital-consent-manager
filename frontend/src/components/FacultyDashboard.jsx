// src/components/FacultyDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './FacultyDashboard.css';

function FacultyDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('available');
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [adminComments, setAdminComments] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newForm, setNewForm] = useState({
    title: '',
    fields: [{ fieldName: '', fieldType: 'text' }],
    sections: []
  });
  const [sectionInput, setSectionInput] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadForms();
    loadSubmissions();
  }, []);

  const loadForms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/forms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForms(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubmissions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/submissions/faculty', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setAdminComments('');
    setShowViewModal(true);
  };

  const handleApprove = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/submissions/${selectedSubmission._id}`,
        {
          status: 'approved',
          adminComments
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Form approved successfully!');
      setShowViewModal(false);
      loadSubmissions();
    } catch (err) {
      alert('Failed to approve form');
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/submissions/${selectedSubmission._id}`,
        {
          status: 'rejected',
          adminComments
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Form rejected successfully!');
      setShowViewModal(false);
      loadSubmissions();
    } catch (err) {
      alert('Failed to reject form');
    }
  };

  const handleCreateForm = async () => {
    if (!newForm.title || newForm.fields.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/forms', newForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Form created successfully!');
      setShowCreateModal(false);
      setNewForm({
        title: '',
        fields: [{ fieldName: '', fieldType: 'text' }],
        sections: []
      });
      setSectionInput('');
      loadForms();
    } catch (err) {
      alert('Failed to create form');
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!confirm('Are you sure you want to delete this form?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Form deleted successfully!');
      loadForms();
    } catch (err) {
      alert('Failed to delete form');
    }
  };

  const addField = () => {
    setNewForm({
      ...newForm,
      fields: [...newForm.fields, { fieldName: '', fieldType: 'text' }]
    });
  };

  const updateField = (index, key, value) => {
    const updatedFields = [...newForm.fields];
    updatedFields[index][key] = value;
    setNewForm({ ...newForm, fields: updatedFields });
  };

  const removeField = (index) => {
    const updatedFields = newForm.fields.filter((_, i) => i !== index);
    setNewForm({ ...newForm, fields: updatedFields });
  };

  const addSection = () => {
    if (sectionInput && !newForm.sections.includes(sectionInput)) {
      setNewForm({
        ...newForm,
        sections: [...newForm.sections, sectionInput]
      });
      setSectionInput('');
    }
  };

  const removeSection = (section) => {
    setNewForm({
      ...newForm,
      sections: newForm.sections.filter(s => s !== section)
    });
  };

  const filterSubmissions = (status) => {
    if (status === 'pending') {
      return submissions.filter(sub => sub.status === 'sent_to_admin');
    } else if (status === 'all') {
      return submissions;
    }
    return submissions.filter(sub => sub.status === status);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'sent_to_admin': return '#1E90FF';
      case 'approved': return '#32CD32';
      case 'rejected': return '#DC143C';
      default: return '#000';
    }
  };

  const getSubmissionsBySection = (status) => {
    const filtered = filterSubmissions(status);
    const grouped = {};
    
    filtered.forEach(sub => {
      if (!grouped[sub.studentSection]) {
        grouped[sub.studentSection] = [];
      }
      grouped[sub.studentSection].push(sub);
    });
    
    return grouped;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Faculty Dashboard</h2>
        <div className="user-info">
          <span>{user.name}</span>
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
          className={activeTab === 'created' ? 'active' : ''} 
          onClick={() => setActiveTab('created')}
        >
          Created Forms
        </button>
        <button 
          className={activeTab === 'pending' ? 'active' : ''} 
          onClick={() => setActiveTab('pending')}
        >
          Pending
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
          className={activeTab === 'section_approved' ? 'active' : ''} 
          onClick={() => setActiveTab('section_approved')}
        >
          Section-wise Approved
        </button>
        <button 
          className={activeTab === 'section_rejected' ? 'active' : ''} 
          onClick={() => setActiveTab('section_rejected')}
        >
          Section-wise Rejected
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'available' && (
          <div className="forms-section">
            <div className="section-header">
              <h3>All Available Forms</h3>
            </div>
            <div className="forms-grid">
              {forms.map(form => (
                <div key={form._id} className="form-card">
                  <h3>{form.title}</h3>
                  <p>Fields: {form.fields.length}</p>
                  <p>Sections: {form.sections.join(', ')}</p>
                  <p>Created: {new Date(form.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'created' && (
          <div className="forms-section">
            <div className="section-header">
              <h3>Created Forms</h3>
              <button onClick={() => setShowCreateModal(true)} className="btn-create">
                Create New Form
              </button>
            </div>
            <div className="forms-grid">
              {forms.map(form => (
                <div key={form._id} className="form-card">
                  <h3>{form.title}</h3>
                  <p>Fields: {form.fields.length}</p>
                  <p>Sections: {form.sections.join(', ')}</p>
                  <p>Created: {new Date(form.createdAt).toLocaleDateString()}</p>
                  <button 
                    onClick={() => handleDeleteForm(form._id)} 
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'rejected') && (
          <div className="submissions-list">
            {filterSubmissions(activeTab).map(sub => (
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
                  <button onClick={() => handleViewSubmission(sub)} className="btn-view">
                    View & Action
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(activeTab === 'section_approved' || activeTab === 'section_rejected') && (
          <div className="section-wise-view">
            {Object.entries(getSubmissionsBySection(
              activeTab === 'section_approved' ? 'approved' : 'rejected'
            )).map(([section, subs]) => (
              <div key={section} className="section-group">
                <h3>Section {section}</h3>
                <div className="submissions-list">
                  {subs.map(sub => (
                    <div key={sub._id} className="submission-card">
                      <h4>{sub.formTitle}</h4>
                      <p><strong>Student:</strong> {sub.studentName}</p>
                      <p><strong>Roll Number:</strong> {sub.studentRollNumber}</p>
                      <p><strong>Date:</strong> {new Date(sub.createdAt).toLocaleDateString()}</p>
                      <button onClick={() => handleViewSubmission(sub)} className="btn-view">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showViewModal && selectedSubmission && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{selectedSubmission.formTitle}</h2>
            
            <div className="view-details">
              <p><strong>Student:</strong> {selectedSubmission.studentName}</p>
              <p><strong>Email:</strong> {selectedSubmission.studentEmail}</p>
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

              <p><strong>Parent Email:</strong> {selectedSubmission.parentEmail}</p>
              
              {selectedSubmission.parentSignature && (
                <p><strong>Parent Signature:</strong> {selectedSubmission.parentSignature}</p>
              )}
            </div>

            {selectedSubmission.status === 'sent_to_admin' && (
              <>
                <div className="form-group">
                  <label>Admin Comments (Optional)</label>
                  <textarea
                    value={adminComments}
                    onChange={(e) => setAdminComments(e.target.value)}
                    placeholder="Add comments..."
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button onClick={handleApprove} className="btn-approve">Approve</button>
                  <button onClick={handleReject} className="btn-reject">Reject</button>
                  <button onClick={() => setShowViewModal(false)} className="btn-cancel">Close</button>
                </div>
              </>
            )}

            {selectedSubmission.status === 'rejected' && (
              <div className="modal-actions">
                <button onClick={handleApprove} className="btn-approve">Accept Now</button>
                <button onClick={() => setShowViewModal(false)} className="btn-cancel">Close</button>
              </div>
            )}

            {selectedSubmission.status === 'approved' && (
              <div className="modal-actions">
                <button onClick={() => setShowViewModal(false)} className="btn-cancel">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Create New Form</h2>
            
            <div className="form-group">
              <label>Form Title</label>
              <input
                type="text"
                value={newForm.title}
                onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                placeholder="e.g., Leave Letter, Fee Payment"
              />
            </div>

            <div className="form-group">
              <label>Sections (Who can access this form)</label>
              <div className="section-input">
                <input
                  type="text"
                  value={sectionInput}
                  onChange={(e) => setSectionInput(e.target.value)}
                  placeholder="e.g., A, B, C"
                />
                <button onClick={addSection} className="btn-add">Add Section</button>
              </div>
              <div className="sections-list">
                {newForm.sections.map(section => (
                  <span key={section} className="section-tag">
                    {section}
                    <button onClick={() => removeSection(section)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Form Fields</label>
              {newForm.fields.map((field, index) => (
                <div key={index} className="field-row">
                  <input
                    type="text"
                    value={field.fieldName}
                    onChange={(e) => updateField(index, 'fieldName', e.target.value)}
                    placeholder="Field Name (e.g., Reason, Date)"
                  />
                  <select
                    value={field.fieldType}
                    onChange={(e) => updateField(index, 'fieldType', e.target.value)}
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                    <option value="tel">Phone</option>
                  </select>
                  {newForm.fields.length > 1 && (
                    <button onClick={() => removeField(index)} className="btn-remove">Remove</button>
                  )}
                </div>
              ))}
              <button onClick={addField} className="btn-add">Add Field</button>
            </div>

            <div className="modal-actions">
              <button onClick={handleCreateForm} className="btn-submit">Create Form</button>
              <button onClick={() => setShowCreateModal(false)} className="btn-cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;