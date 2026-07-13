# FastAPI Integration Guide

This guide shows how to connect your React frontend to the FastAPI backend.

## 1. Update AuthContext for API Calls

Edit `src/context/AuthContext.tsx` and replace the mock login/signup functions with actual API calls:

### Login Endpoint

```typescript
const login = async (email: string, password: string) => {
  try {
    const response = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // For cookies if using session auth
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    const data = await response.json();

    // Assuming your API returns user object and token
    const userData: User = {
      email: data.user.email,
      name: data.user.name,
      id: data.user.id,
    };

    // Store token if using JWT
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
    }

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  } catch (error) {
    throw error;
  }
};
```

### Signup Endpoint

```typescript
const signup = async (email: string, password: string, name: string) => {
  try {
    const response = await fetch("http://localhost:8000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Signup failed");
    }

    const data = await response.json();

    const userData: User = {
      email: data.user.email,
      name: data.user.name,
      id: data.user.id,
    };

    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
    }

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  } catch (error) {
    throw error;
  }
};
```

## 2. Expected FastAPI Endpoints

Your FastAPI backend should have these endpoints:

### POST /api/auth/login

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /api/auth/signup

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /api/auth/logout

**Response:**

```json
{
  "message": "Successfully logged out"
}
```

## 3. Add Token Management

Create `src/utils/api.ts` for API calls with automatic token handling:

```typescript
const API_BASE_URL = "http://localhost:8000/api";

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("access_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    // Token expired, logout user
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  return response;
};

// Usage in other components:
// const response = await apiCall('/employees', { method: 'GET' });
// const employees = await response.json();
```

## 4. Add CORS Support to FastAPI

In your FastAPI app:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 5. Environment Variables

Create `.env` file in root:

```
VITE_API_URL=http://localhost:8000/api
```

Update `src/context/AuthContext.tsx` to use:

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
```

## 6. Error Handling

Add error handling in AuthContext:

```typescript
const [error, setError] = useState<string | null>(null);

// In login/signup functions:
catch (error: any) {
  const message = error?.response?.data?.detail || error.message || 'An error occurred';
  setError(message);
  throw error;
}
```

## 7. Testing the Integration

1. Start your FastAPI server:

   ```bash
   uvicorn main:app --reload
   ```

2. Start React dev server:

   ```bash
   npm run dev
   ```

3. Test signup at `http://localhost:5173/signup`
4. Test login at `http://localhost:5173`
5. Verify dashboard redirects after successful login

## Notes

- Replace `http://localhost:8000` with your actual API URL
- For production, use environment variables
- Consider using React Query or SWR for better state management
- Implement refresh token rotation for better security
- Add request/response interceptors for consistent error handling
