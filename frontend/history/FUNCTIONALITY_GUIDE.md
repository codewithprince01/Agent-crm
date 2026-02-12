# Frontend Functionality Guide

**Project:** Agent CRM - Frontend  
**Document Type:** Functionality & Code Management Guide  
**Created:** 2026-02-12

---

## Table of Contents
1. [Components Functionality](#components-functionality)
2. [Pages Functionality](#pages-functionality)
3. [Services Layer](#services-layer)
4. [State Management](#state-management)
5. [Utilities](#utilities)
6. [How Code is Managed](#how-code-is-managed)

---

## Components Functionality

### 1. **Layout Components** (`src/components/layout/`)

#### Purpose
Provide consistent application structure and navigation across all pages.

#### Key Components

**Sidebar.jsx**
```javascript
// Functionality:
- Renders navigation menu based on user role
- Highlights active route
- Provides logout functionality
- Collapses on mobile devices

// How it works:
1. Reads user role from Redux store
2. Filters menu items based on permissions
3. Uses React Router's useLocation to track active route
4. Dispatches logout action on user signout
```

**TopNavigation.jsx**
```javascript
// Functionality:
- Displays page title and breadcrumbs
- Shows user profile dropdown
- Notification center
- Quick actions menu

// How it works:
1. Receives current page context via props
2. Fetches user info from Redux
3. Listens for notification updates
4. Renders dynamic breadcrumb based on route
```

---

### 2. **Common Components** (`src/components/common/`)

#### Loader.jsx
```javascript
// Purpose: Global loading indicator
// Usage:
const Loader = ({ size = 'medium', text = 'Loading...' }) => {
  return <div className="spinner">{text}</div>;
};

// When to use:
- API calls in progress
- Page transitions
- Data fetching states
```

#### Modal.jsx
```javascript
// Purpose: Reusable modal dialog
// Features:
- Backdrop click to close
- ESC key support
- Customizable header/body/footer
- Animation on open/close

// Usage:
<Modal isOpen={isOpen} onClose={handleClose}>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>Actions</Modal.Footer>
</Modal>
```

#### DataTable.jsx
```javascript
// Purpose: Paginated data table with sorting/filtering
// Features:
- Column sorting
- Search/filter
- Pagination controls
- Row selection
- Custom cell renderers

// How it works:
1. Accepts data array and column configuration
2. Manages internal state for sorting/filtering
3. Emits events for row actions (edit, delete, view)
4. Handles pagination calculations
```

---

### 3. **UI Components** (`src/components/ui/`)

#### Button.jsx
```javascript
// Variants: primary, secondary, danger, success
// Sizes: sm, md, lg
// States: normal, loading, disabled

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  children,
  onClick 
}) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      disabled={loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};
```

#### Input.jsx
```javascript
// Purpose: Controlled input with validation
// Features:
- Field validation
- Error message display
- Label and helper text
- Various input types

// Integration:
- Works with React Hook Form
- Supports custom validators
- Accessible (ARIA labels)
```

---

### 4. **Guard Components** (`src/components/guards/`)

#### ProtectedRoute.jsx
```javascript
// Purpose: Route protection based on authentication
// How it works:
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Check role permission
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, user]);
  
  return isAuthenticated ? children : null;
};

// Usage in App.jsx:
<Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
  <Route path="/superadmin/*" element={<SuperAdminPages />} />
</Route>
```

---

## Pages Functionality

### 1. **Authentication Pages** (`src/pages/auth/`)

#### Login.jsx
```javascript
// Functionality:
- Email/password authentication
- Form validation
- Remember me option
- Redirect after login based on role

// Flow:
1. User enters credentials
2. Form validates input
3. Calls authService.login(credentials)
4. On success:
   - Save token to localStorage
   - Dispatch login action to Redux
   - Redirect to role-specific dashboard
5. On error:
   - Display error message
   - Clear password field
```

#### Register.jsx
```javascript
// For agent self-registration
// Fields:
- Personal information
- Business details
- Email verification
- Password creation

// Process:
1. Multi-step form (3-4 steps)
2. Client-side validation per step
3. Submit complete data to API
4. Create agent with 'inactive' status
5. Send verification email
6. Redirect to pending approval page
```

---

### 2. **Dashboard Pages** (`src/pages/*/dashboard/`)

#### SuperAdmin Dashboard
```javascript
// Components:
- Statistics cards (agents, students, applications, revenue)
- Charts (monthly registrations, application trends)
- Recent activities table
- Quick actions panel

// Data Flow:
1. useEffect on mount → fetch dashboard data
2. Call dashboardService.getSuperAdminStats()
3. Update Redux store with data
4. Components render from store
5. Auto-refresh every 5 minutes
```

#### Agent Dashboard
```javascript
// Shows:
- Personal commission summary
- Student count
- Active applications
- Recent notifications
- Action items

// How it works:
1. Fetch data filtered by agentId
2. Display personalized metrics
3. Show only agent's own data
4. Action buttons for common tasks
```

---

### 3. **Agent Management** (`src/pages/superadmin/agents/`)

#### AgentList.jsx
```javascript
// Features:
- Searchable/filterable agent list
- Status filter (active/inactive/suspended)
- Sortable columns
- Bulk actions
- Export to CSV

// Implementation:
const AgentList = () => {
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    page: 1,
    limit: 20
  });
  
  useEffect(() => {
    fetchAgents();
  }, [filters]);
  
  const fetchAgents = async () => {
    const data = await agentService.getAllAgents(filters);
    setAgents(data.agents);
  };
  
  const handleStatusChange = async (agentId, newStatus) => {
    await agentService.updateStatus(agentId, newStatus);
    fetchAgents(); // Refresh list
  };
  
  return (
    <div>
      <FilterBar onChange={setFilters} />
      <DataTable 
        data={agents} 
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
      <Pagination {...paginationProps} />
    </div>
  );
};
```

#### AgentDetail.jsx
```javascript
// Displays comprehensive agent information
// Sections:
- Personal information
- Business details
- Bank information
- Documents
- Referral tree
- Student list
- Commission history
- Activity log

// Features:
- Edit mode toggle
- Document upload
- Status management
- Activity timeline
```

#### CreateAgent.jsx / EditAgent.jsx
```javascript
// Multi-step form for agent creation/editing
// Steps:
1. Personal Information
2. Business Details
3. Bank Information
4. Document Upload
5. Review & Submit

// State management:
const [formData, setFormData] = useState({
  personalInfo: {},
  businessInfo: {},
  bankDetails: {},
  documents: []
});
const [currentStep, setCurrentStep] = useState(1);

// Validation per step
const validateStep = (step) => {
  switch(step) {
    case 1: return validatePersonalInfo(formData.personalInfo);
    case 2: return validateBusinessInfo(formData.businessInfo);
    // ...
  }
};

// Submit handler
const handleSubmit = async () => {
  const result = await agentService.createAgent(formData);
  navigate(`/superadmin/agents/${result.id}`);
};
```

---

### 4. **Student Management** (`src/pages/*/students/`)

#### StudentList.jsx
```javascript
// Similar to AgentList
// Additional features:
- Filter by agent (for super admin)
- Application status filter
- Export student data
- Import from CSV

// Role-based filtering:
// Super Admin: See all students
// Admin: See all students
// Agent: See only own students
```

#### StudentProfile.jsx
```javascript
// Comprehensive student view
// Tabs:
- Personal Information
- Academic History
- Test Scores
- Documents
- Applications
- Timeline

// Functionality:
const StudentProfile = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  
  useEffect(() => {
    loadStudent();
  }, [id]);
  
  const loadStudent = async () => {
    const data = await studentService.getById(id);
    setStudent(data);
  };
  
  const handleUpdate = async (section, data) => {
    await studentService.updateSection(id, section, data);
    loadStudent();
  };
  
  const handleDocumentUpload = async (file) => {
    await studentService.uploadDocument(id, file);
    loadStudent();
  };
  
  return (
    <div>
      <ProfileHeader student={student} />
      <TabNavigation active={activeTab} onChange={setActiveTab} />
      <TabContent 
        tab={activeTab} 
        student={student}
        onUpdate={handleUpdate}
        onUploadDocument={handleDocumentUpload}
      />
    </div>
  );
};
```

---

## Services Layer

### Purpose
Centralize all API communication and abstract HTTP logic from components.

### Pattern
```javascript
// services/baseService.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service Examples

#### agentService.js
```javascript
import api from './baseService';

export const agentService = {
  // Get all agents with filters
  getAllAgents: async (params) => {
    return await api.get('/agents', { params });
  },
  
  // Get single agent
  getById: async (id) => {
    return await api.get(`/agents/${id}`);
  },
  
  // Create agent
  create: async (data) => {
    return await api.post('/agents', data);
  },
  
  // Update agent
  update: async (id, data) => {
    return await api.put(`/agents/${id}`, data);
  },
  
  // Delete agent
  delete: async (id) => {
    return await api.delete(`/agents/${id}`);
  },
  
  // Update status
  updateStatus: async (id, status) => {
    return await api.patch(`/agents/${id}/status`, { status });
  },
  
  // Get agent's students
  getStudents: async (id) => {
    return await api.get(`/agents/${id}/students`);
  },
  
  // Get agent's commissions
  getCommissions: async (id) => {
    return await api.get(`/agents/${id}/commissions`);
  }
};
```

#### studentService.js
```javascript
import api from './baseService';

export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  
  getById: (id) => api.get(`/students/${id}`),
  
  create: (data) => api.post('/students', data),
  
  update: (id, data) => api.put(`/students/${id}`, data),
  
  delete: (id) => api.delete(`/students/${id}`),
  
  // Update specific section
  updateSection: (id, section, data) => 
    api.patch(`/students/${id}/${section}`, data),
  
  // Document management
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post(`/students/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  deleteDocument: (id, documentId) => 
    api.delete(`/students/${id}/documents/${documentId}`),
  
  // Get student's applications
  getApplications: (id) => api.get(`/students/${id}/applications`)
};
```

---

## State Management

### Redux Store Structure

```javascript
// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import agentReducer from './slices/agentSlice';
import studentReducer from './slices/studentSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    agents: agentReducer,
    students: studentReducer,
    ui: uiReducer
  }
});
```

### Slice Examples

#### authSlice.js
```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

#### Usage in Components
```javascript
import { useSelector, useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  
  const handleSubmit = (credentials) => {
    dispatch(login(credentials));
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {loading && <Loader />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </form>
  );
};
```

---

## Utilities

### dateUtils.js
```javascript
// Format dates consistently across the app
export const formatDate = (date, format = 'dd/MM/yyyy') => {
  // Implementation
};

export const getRelativeTime = (date) => {
  // Returns "2 hours ago", "3 days ago", etc.
};

export const isDateInPast = (date) => {
  return new Date(date) < new Date();
};
```

### validators.js
```javascript
// Common validation functions
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isValidPhone = (phone) => {
  const regex = /^\+?[\d\s-()]+$/;
  return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const isValidPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /\d/.test(password);
};
```

### constants.js
```javascript
// Application-wide constants
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  AGENT: 'AGENT'
};

export const AGENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

export const APPLICATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};
```

---

## How Code is Managed

### 1. **Component Creation**
```
1. Determine component type (page, common, ui)
2. Create file in appropriate directory
3. Follow naming convention: PascalCase
4. Structure:
   - Imports
   - Component definition
   - PropTypes (if needed)
   - Export
5. Add to index.js if creating multiple related components
```

### 2. **Adding New Features**
```
Checklist:
□ Create/update service methods in services/
□ Add Redux slice if complex state needed
□ Create page component in pages/
□ Add route in App.jsx
□ Update navigation menu if needed
□ Add role-based access control
□ Test across all user roles
```

### 3. **State Management Strategy**
```
Use Redux when:
- Data needed across multiple components
- Complex state updates
- Global app state (auth, user, settings)

Use Local State when:
- UI state (modal open/close, form inputs)
- Component-specific data
- Temporary data
```

### 4. **Code Review Checklist**
```
□ Follows naming conventions
□ No console.logs in production code
□ Error handling implemented
□ Loading states managed
□ Responsive design verified
□ Accessibility considered
□ No hardcoded values (use constants)
□ Component is reusable where appropriate
□ Comments added for complex logic
```

### 5. **File Modification Workflow**
```
1. Identify the file to modify
2. Check if file is used elsewhere (search references)
3. Make changes
4. Test affected components
5. Check console for errors
6. Verify responsive behavior
7. Test with different user roles
```

---

## Common Patterns

### Fetch Data Pattern
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData();
}, [/* dependencies */]);

const fetchData = async () => {
  try {
    setLoading(true);
    const result = await service.getData();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// Render
if (loading) return <Loader />;
if (error) return <Error message={error} />;
return <DataDisplay data={data} />;
```

### Form Handling Pattern
```javascript
const [formData, setFormData] = useState(initialState);
const [errors, setErrors] = useState({});
const [submitting, setSubmitting] = useState(false);

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};

const validate = () => {
  const newErrors = {};
  // Validation logic
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;
  
  try {
    setSubmitting(true);
    await service.submit(formData);
    navigate('/success');
  } catch (error) {
    setErrors({ submit: error.message });
  } finally {
    setSubmitting(false);
  }
};
```

---

*Keep this guide updated as new features are added or patterns change.*
