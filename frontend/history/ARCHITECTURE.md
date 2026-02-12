# Frontend Architecture Documentation

**Project:** Agent CRM - Frontend  
**Created:** 2026-02-12  
**Last Updated:** 2026-02-12

---

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Patterns](#architecture-patterns)
5. [State Management](#state-management)
6. [Routing System](#routing-system)
7. [Component Hierarchy](#component-hierarchy)
8. [Service Layer](#service-layer)
9. [Authentication Flow](#authentication-flow)
10. [Data Flow](#data-flow)
11. [Code Organization](#code-organization)

---

## Overview

The Agent CRM frontend is a modern React-based Single Page Application (SPA) designed to manage educational agents, students, applications, and administrative tasks. The application follows a role-based access control system supporting multiple user types: Super Admin, Admin, and Agent.

### Key Features
- **Multi-role Management**: Super Admin, Admin, and Agent roles with different permissions
- **Student Management**: Comprehensive student profiles with academic history and documents
- **Application Tracking**: Monitor student applications and their statuses
- **Commission System**: Track agent commissions and payouts
- **Dashboard Analytics**: Real-time statistics and data visualization
- **Responsive Design**: Mobile-first design using TailwindCSS

---

## Technology Stack

```
Framework:        React 18.x
Build Tool:       Vite
State Management: Redux Toolkit
Routing:          React Router v6
Styling:          TailwindCSS
HTTP Client:      Axios
Form Handling:    React Hook Form (inferred)
UI Components:    Custom components
Icons:            Lucide React / Font Awesome
```

---

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx                 # Main application component
│   ├── main.jsx                # Application entry point
│   ├── components/             # Reusable components
│   │   ├── common/             # Shared UI components
│   │   ├── guards/             # Route guards (auth, role)
│   │   ├── layout/             # Layout components
│   │   ├── route/              # Route configuration
│   │   ├── students/           # Student-specific components
│   │   └── ui/                 # Base UI components
│   ├── pages/                  # Page components
│   │   ├── admin/              # Admin pages
│   │   ├── agent/              # Agent pages
│   │   ├── auth/               # Authentication pages
│   │   ├── student/            # Student pages
│   │   └── superadmin/         # Super admin pages
│   ├── services/               # API service layer
│   │   ├── authService.js      # Authentication API
│   │   ├── agentService.js     # Agent management API
│   │   ├── studentService.js   # Student management API
│   │   └── ...                 # Other service modules
│   ├── store/                  # Redux store configuration
│   │   ├── store.js            # Store setup
│   │   ├── slices/             # Redux slices
│   │   └── ...
│   ├── utils/                  # Utility functions
│   └── assets/                 # Static assets
├── public/                     # Public assets
└── history/                    # Architecture & history docs
```

---

## Architecture Patterns

### 1. **Component-Based Architecture**
The application follows a modular component-based architecture:

```
📦 Atomic Design Pattern
├── 🔹 Pages (Templates)
│   └── Complete views for specific routes
├── 🔸 Components (Organisms)
│   └── Complex UI sections combining molecules
├── 🔹 Common Components (Molecules)
│   └── Reusable component groups
└── 🔸 UI Components (Atoms)
    └── Basic building blocks
```

### 2. **Service Layer Pattern**
All API interactions are abstracted into service modules:

```javascript
// Example: agentService.js
export const agentService = {
  getAllAgents: () => axios.get('/api/agents'),
  getAgentById: (id) => axios.get(`/api/agents/${id}`),
  createAgent: (data) => axios.post('/api/agents', data),
  updateAgent: (id, data) => axios.put(`/api/agents/${id}`, data),
  deleteAgent: (id) => axios.delete(`/api/agents/${id}`)
};
```

### 3. **Container/Presenter Pattern**
Smart containers handle business logic, presentational components handle UI:

```
Container (Page) → Business Logic → API Calls → State Management
Presenter (Component) → UI Rendering → Props → Event Handlers
```

---

## State Management

### Redux Toolkit Structure

```
store/
├── store.js                    # Configure store
├── slices/
│   ├── authSlice.js           # Authentication state
│   ├── agentSlice.js          # Agent data state
│   ├── studentSlice.js        # Student data state
│   ├── applicationSlice.js    # Application state
│   └── uiSlice.js             # UI state (modals, loading)
```

### State Flow

```
Component → Dispatch Action → Reducer → Update State → Re-render
     ↑                                                      ↓
     └──────────── useSelector (Read State) ───────────────┘
```

### Example: Authentication State

```javascript
// authSlice.js
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    }
  }
});
```

---

## Routing System

### Route Protection Strategy

```
App.jsx
├── Public Routes (No Auth Required)
│   ├── /login
│   ├── /register
│   ├── /forgot-password
│   └── /student-test
│
├── Protected Routes (Auth Required)
│   ├── Super Admin Routes (/superadmin/*)
│   │   ├── /superadmin/dashboard
│   │   ├── /superadmin/agents
│   │   ├── /superadmin/students
│   │   └── /superadmin/settings
│   │
│   ├── Admin Routes (/admin/*)
│   │   ├── /admin/dashboard
│   │   ├── /admin/agents
│   │   └── /admin/students
│   │
│   └── Agent Routes (/agent/*)
│       ├── /agent/dashboard
│       ├── /agent/students
│       ├── /agent/applications
│       └── /agent/profile
```

### Route Guard Implementation

```javascript
// Route protection pattern
<Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
  <Route path="/superadmin/*" element={<SuperAdminLayout />}>
    {/* Super admin routes */}
  </Route>
</Route>
```

---

## Component Hierarchy

### Layout Components

```
App
└── Router
    ├── PublicLayout
    │   ├── Header (Guest)
    │   ├── Main Content
    │   └── Footer
    │
    └── AuthenticatedLayout
        ├── Sidebar
        ├── TopNavigation
        ├── Main Content Area
        │   └── Page Components
        └── Footer
```

### Component Communication

```
Parent Component
    ↓ (Props)
Child Component
    ↑ (Callbacks)
Parent Component
```

---

## Service Layer

### API Service Architecture

Each functional domain has its own service module:

```javascript
// services/studentService.js
import api from './api'; // Axios instance with interceptors

export const studentService = {
  // CRUD Operations
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  
  // Specialized Operations
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post(`/students/${id}/documents`, formData);
  },
  
  getAcademicHistory: (id) => api.get(`/students/${id}/academic`),
};
```

### HTTP Interceptors

```javascript
// Request Interceptor: Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);
```

---

## Authentication Flow

### Login Process

```
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  Login   │──────>│  Submit  │──────>│   API    │──────>│  Redux   │
│   Page   │       │   Form   │       │  Call    │       │  Store   │
└──────────┘       └──────────┘       └──────────┘       └──────────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │ Save Token to │
                                    │ localStorage  │
                                    └───────────────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │ Redirect to   │
                                    │ Dashboard     │
                                    └───────────────┘
```

### Token Management

```javascript
// Store token after login
localStorage.setItem('token', response.data.token);
localStorage.setItem('user', JSON.stringify(response.data.user));

// Retrieve token for API calls
const token = localStorage.getItem('token');

// Clear on logout
localStorage.removeItem('token');
localStorage.removeItem('user');
```

---

## Data Flow

### Complete Data Flow Diagram

```
┌─────────────┐
│   User      │
│  Action     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Component   │ ──────> Dispatch Action
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │ ──────> HTTP Request
│   Layer     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend    │
│    API      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Response   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Redux     │ ──────> Update State
│   Reducer   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Component   │ ──────> Re-render with new data
│  Re-render  │
└─────────────┘
```

---

## Code Organization

### Naming Conventions

```javascript
// Files
ComponentName.jsx          // React components
serviceName.js             // Service modules
sliceName.js               // Redux slices
utilityName.js             // Utility functions

// Components
PascalCase                 // Component names
camelCase                  // Function names
UPPER_SNAKE_CASE          // Constants

// Folders
lowercase                  // All folder names
kebab-case                 // Multi-word folders (if needed)
```

### Import Organization

```javascript
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// 2. Internal services
import { studentService } from '../services/studentService';

// 3. Redux slices
import { setStudents } from '../store/slices/studentSlice';

// 4. Components
import StudentCard from '../components/students/StudentCard';
import Loader from '../components/common/Loader';

// 5. Utils and constants
import { formatDate } from '../utils/dateUtils';
import { ROLES } from '../utils/constants';

// 6. Styles
import './StudentList.css';
```

### File Organization Best Practices

1. **One component per file**
2. **Group related components in folders**
3. **Co-locate component-specific utilities**
4. **Keep services separate from components**
5. **Centralize constants and configurations**

---

## Best Practices

### 1. Component Design
- Keep components small and focused
- Use functional components with hooks
- Implement proper prop validation
- Extract reusable logic into custom hooks

### 2. State Management
- Keep Redux for global state only
- Use local state for component-specific data
- Normalize complex nested data
- Use selectors for derived state

### 3. Performance
- Use React.memo for expensive renders
- Implement lazy loading for routes
- Optimize re-renders with useCallback/useMemo
- Code-split large components

### 4. Error Handling
- Implement error boundaries
- Show user-friendly error messages
- Log errors for debugging
- Handle network failures gracefully

### 5. Code Quality
- Follow ESLint rules
- Write meaningful comments
- Use TypeScript (future enhancement)
- Keep functions pure when possible

---

## Future Enhancements

- [ ] TypeScript migration
- [ ] Unit testing with Jest/Vitest
- [ ] E2E testing with Playwright
- [ ] PWA capabilities
- [ ] Internationalization (i18n)
- [ ] Theme customization
- [ ] Advanced caching strategies
- [ ] WebSocket for real-time updates

---

*This document should be updated whenever significant architectural changes are made.*
