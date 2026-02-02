# 🔌 Connecting Frontend to Backend

## 1. Backend Configuration
Ensure your backend is running:
- **URL:** `http://localhost:5000`
- **CORS:** Configured to accept requests from `http://localhost:5173` (Default Vite port)

## 2. API Base URL
In your frontend application (e.g., in `.env` or constant file), set the base URL:

```javascript
export const API_BASE_URL = "http://localhost:5000/api";
```

## 3. Authentication Integration

### Login
```javascript
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (data.success) {
    // Store token
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
  return data;
};
```

### Axios Interceptor (Recommended)
Add the JWT token to every request automatically:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## 4. Key API Endpoints

### 🟢 Public Endpoints
- `POST /auth/login` - Login
- `POST /auth/register-agent` - Agent Sign Up
- `POST /auth/register-student` - Student Sign Up

### 🔒 Protected Endpoints (Requires Token)
**Agents**
- `GET /agents/pending` - Admin only (Approval Queue)
- `PUT /agents/:id/approve` - Admin only
- `POST /applications` - Create Application
- `GET /dashboard/agent` - Agent Stats

**Dashboard**
- `GET /dashboard/admin` - Admin Stats
- `GET /dashboard/agent` - Agent Stats
- `GET /dashboard/student` - Student Stats

## 5. Handling Responses
All API responses follow this standard format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Validation errors if any
}
```

## 6. Common Connection Issues

1. **CORS Error**: 
   - Check `backend/.env` -> `FRONTEND_URL` matches your frontend URL.
2. **401 Unauthorized**:
   - Ensure `Authorization: Bearer <token>` header is sent.
   - Check if token is expired (7 days).
3. **500 Server Error**:
   - Check backend terminal logs.
   - Verify database connection.

## 🚀 Ready to Connect!
Your backend is fully equipped to handle all frontend requests.
