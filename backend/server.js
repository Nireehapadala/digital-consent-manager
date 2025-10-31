// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your_jwt_secret_key_change_in_production';

// MongoDB Connection
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'parent', 'faculty'], required: true },
  name: { type: String, required: true },
  section: { type: String }, // Only for students
  rollNumber: { type: String }, // Only for students
  createdAt: { type: Date, default: Date.now }
});

// Form Schema
const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fields: [{ 
    fieldName: String, 
    fieldType: String 
  }],
  sections: [String], // Which sections can access this form
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Submission Schema
const submissionSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  formTitle: String,
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: String,
  studentEmail: String,
  studentSection: String,
  studentRollNumber: String,
  formData: Object,
  parentEmail: String,
  status: { 
    type: String, 
    enum: ['draft', 'sent_to_parent', 'sent_to_admin', 'approved', 'rejected'],
    default: 'draft'
  },
  parentSignature: String,
  adminComments: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Form = mongoose.model('Form', formSchema);
const Submission = mongoose.model('Submission', submissionSchema);

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Register Route
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role, name, section, rollNumber } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData = {
      email,
      password: hashedPassword,
      role,
      name
    };

    if (role === 'student') {
      userData.section = section;
      userData.rollNumber = rollNumber;
    }

    const user = new User(userData);
    await user.save();

    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name,
        section: user.section,
        rollNumber: user.rollNumber
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id,
        email: user.email, 
        role: user.role,
        name: user.name,
        section: user.section,
        rollNumber: user.rollNumber
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Form (Faculty only)
app.post('/api/forms', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Only faculty can create forms' });
    }

    const { title, fields, sections } = req.body;
    
    const form = new Form({
      title,
      fields,
      sections,
      createdBy: req.user.id
    });

    await form.save();
    res.json({ message: 'Form created successfully', form });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Available Forms for Student
app.get('/api/forms/available', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'student' 
      ? { sections: req.user.section }
      : {};
    
    const forms = await Form.find(query);
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Forms (Faculty)
app.get('/api/forms', authenticateToken, async (req, res) => {
  try {
    const forms = await Form.find();
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Form (Faculty)
app.delete('/api/forms/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Only faculty can delete forms' });
    }
    await Form.findByIdAndDelete(req.params.id);
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Submission
app.post('/api/submissions', authenticateToken, async (req, res) => {
  try {
    const { formId, formTitle, formData, parentEmail, status } = req.body;
    
    const submission = new Submission({
      formId,
      formTitle,
      studentId: req.user.id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentSection: req.user.section,
      studentRollNumber: req.user.rollNumber,
      formData,
      parentEmail,
      status: status || 'draft'
    });

    await submission.save();
    res.json({ message: 'Submission created successfully', submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Student Submissions
app.get('/api/submissions/student', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { studentId: req.user.id };
    
    if (status) {
      query.status = status;
    }

    const submissions = await Submission.find(query).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Parent Submissions
app.get('/api/submissions/parent', authenticateToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ 
      parentEmail: req.user.email,
      status: { $in: ['sent_to_parent', 'sent_to_admin', 'approved', 'rejected'] }
    }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Faculty Submissions
app.get('/api/submissions/faculty', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { status: { $in: ['sent_to_admin', 'approved', 'rejected'] } };
    
    if (status) {
      query.status = status;
    }

    const submissions = await Submission.find(query).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Submission (Student, Parent, Faculty)
app.put('/api/submissions/:id', authenticateToken, async (req, res) => {
  try {
    const { status, parentSignature, adminComments, formData, parentEmail } = req.body;
    
    const updateData = { updatedAt: Date.now() };
    
    if (status) updateData.status = status;
    if (parentSignature) updateData.parentSignature = parentSignature;
    if (adminComments) updateData.adminComments = adminComments;
    if (formData) updateData.formData = formData;
    if (parentEmail) updateData.parentEmail = parentEmail;

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ message: 'Submission updated successfully', submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Submission by ID
app.get('/api/submissions/:id', authenticateToken, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});