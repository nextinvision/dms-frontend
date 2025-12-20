# DMS Frontend-Backend Integration Guide

> **Status**: Backend Complete ✅  
> **Next Step**: Connect Frontend to Live Backend  
> **Estimated Time**: 2-4 hours

---

## 🎯 INTEGRATION OVERVIEW

Your backend is complete! Now let's connect your Next.js frontend to the live backend API.

### Current State
- ✅ Backend running at: `http://localhost:3001/api`
- ✅ Frontend running at: `http://localhost:3000`
- ❌ Frontend still using mock data (`NEXT_PUBLIC_USE_MOCK_API !== "false"`)

### Target State
- ✅ Frontend connected to real backend
- ✅ Authentication working
- ✅ All API calls hitting backend
- ✅ Real-time data flow

---

## 📋 STEP-BY-STEP INTEGRATION

### Step 1: Create Environment File

Create `.env.local` in your frontend root:

```bash
# Navigate to frontend directory
cd d:\DMS\dms-frontend

# Create .env.local file
```

```env
# .env.local

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Disable mock API (CRITICAL!)
NEXT_PUBLIC_USE_MOCK_API=false

# API Timeout (optional)
NEXT_PUBLIC_API_TIMEOUT=30000

# Environment
NEXT_PUBLIC_ENV=development
```

**IMPORTANT**: The `NEXT_PUBLIC_USE_MOCK_API=false` is critical to disable mock mode!

---

### Step 2: Update API Configuration

Your `src/config/api.config.ts` is already set up correctly:

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  // ✅ Reads from .env.local
  USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK_API !== "false",
} as const;
```

**No changes needed! ✅**

---

### Step 3: Verify Backend Response Format

Your frontend expects this format (already correct in your backend):

```typescript
// Success Response
{
  "data": T,
  "success": true,
  "message": "Success" // optional
}

// Error Response
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "status": 400,
  "errors": { "field": ["error"] } // optional
}

// Paginated Response
{
  "data": T[],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "success": true
}
```

**No changes needed! ✅** (Your backend matches this format)

---

### Step 4: Update Authentication Flow

#### Frontend: `src/shared/hooks/useAuth.ts` (or auth context)

Your frontend stores tokens in localStorage. Ensure it matches backend JWT:

```typescript
// After login success
const handleLogin = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login', { email, password });
  
  if (response.success) {
    // Store tokens
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    // Update state
    setUser(response.data.user);
    setIsAuthenticated(true);
  }
};
```

#### Frontend: API Client Interceptor

Check `src/core/api/interceptors.ts` - should auto-add token:

```typescript
export function authRequestInterceptor(config: RequestInit, url: string): RequestInit {
  const token = localStorage.getItem('accessToken');
  
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  
  return config;
}
```

**Verify this exists! ✅**

---

### Step 5: Handle Token Refresh

Update your API client to handle token refresh on 401:

```typescript
// src/core/api/interceptors.ts

export async function unauthorizedResponseInterceptor(response: Response): Promise<Response> {
  if (response.status === 401) {
    // Try to refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      try {
        const refreshResponse = await fetch('http://localhost:3001/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('accessToken', data.data.accessToken);
          
          // Retry original request with new token
          const newResponse = await fetch(response.url, {
            ...response,
            headers: {
              ...response.headers,
              'Authorization': `Bearer ${data.data.accessToken}`
            }
          });
          
          return newResponse;
        }
      } catch (error) {
        // Refresh failed, logout
        localStorage.clear();
        window.location.href = '/login';
      }
    } else {
      // No refresh token, logout
      localStorage.clear();
      window.location.href = '/login';
    }
  }
  
  return response;
}
```

**Add this if not present!**

---

### Step 6: Update Query Parameters for Expand/Pagination

Your backend supports these query params:

```typescript
// Frontend should send:
?expand=vehicles,lastServiceCenter
?expand=vehicles.serviceHistory&vehicles.limit=5
?page=1&limit=20
?filter[status]=ACTIVE
?sort=-createdAt
?fields=id,name,phone
```

#### Update API Client to Support These

```typescript
// src/core/api/client.ts

private buildUrl(path: string, params?: Record<string, any>): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, this.baseURL);

  if (params) {
    Object.keys(params).forEach(key => {
      const value = params[key];
      
      // Handle arrays (e.g., expand=['vehicles', 'customer'])
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, String(v)));
      }
      // Handle nested objects (e.g., filter[status]=ACTIVE)
      else if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(subKey => {
          url.searchParams.append(`${key}[${subKey}]`, String(value[subKey]));
        });
      }
      // Handle primitives
      else if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}
```

**Update `buildUrl` method!**

---

### Step 7: Update Service/Repository Calls

#### Example: Customer Service

```typescript
// src/features/customers/services/customer.service.ts

export class CustomerService {
  async getById(id: string, options?: { expand?: string[] }) {
    const params: Record<string, any> = {};
    
    if (options?.expand) {
      params.expand = options.expand.join(',');
    }
    
    return this.repository.getById(id, params);
  }
  
  async search(query: string, options?: { expand?: string[] }) {
    const params: Record<string, any> = { query };
    
    if (options?.expand) {
      params.expand = options.expand.join(',');
    }
    
    return apiClient.get('/customers/search', params);
  }
}
```

**Update service calls to use expand!**

---

### Step 8: Test Critical Endpoints

Create a test file to verify integration:

```typescript
// src/tests/api-integration.test.ts

describe('Backend Integration Tests', () => {
  test('Login should work', async () => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.accessToken).toBeDefined();
  });
  
  test('Get customers should work', async () => {
    const token = 'your-test-token';
    
    const response = await fetch('http://localhost:3001/api/customers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

---

### Step 9: Handle CORS Issues

If you get CORS errors, add to your backend `main.ts`:

```typescript
// Backend: src/main.ts

app.enableCors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Verify CORS is enabled on backend!**

---

### Step 10: Update Mock Data Flag

Ensure all components check the flag:

```typescript
// In components that might use mock data
import { API_CONFIG } from '@/config/api.config';

if (API_CONFIG.USE_MOCK) {
  // Use mock data
  return mockData;
} else {
  // Use real API
  return await apiClient.get('/customers');
}
```

**Search for mock data usage:**

```bash
# Find files using mock data
grep -r "mockData\|mock-" src/
grep -r "localStorage.getItem.*mock" src/
```

---

## 🔍 VERIFICATION CHECKLIST

### Pre-Integration Checklist

- [ ] Backend is running at `http://localhost:3001`
- [ ] Backend health check works: `GET http://localhost:3001/api/health`
- [ ] Backend has admin user seeded
- [ ] Frontend is running at `http://localhost:3000`

### Integration Checklist

- [ ] Created `.env.local` with correct values
- [ ] Set `NEXT_PUBLIC_USE_MOCK_API=false`
- [ ] Restarted frontend dev server (`npm run dev`)
- [ ] Updated `buildUrl` to handle nested params
- [ ] Verified token storage in localStorage
- [ ] Tested login flow
- [ ] Verified token is sent in requests
- [ ] Tested token refresh on 401

### Post-Integration Testing

- [ ] Login works and stores tokens
- [ ] GET requests include `Authorization` header
- [ ] Customer search returns real data
- [ ] Vehicle creation works
- [ ] Job card creation works
- [ ] File upload works
- [ ] Pagination works
- [ ] Expand parameter works
- [ ] Error handling works (try invalid login)
- [ ] Token refresh works (manually expire token)

---

## 🐛 TROUBLESHOOTING

### Issue 1: CORS Error

**Error**: `Access to fetch blocked by CORS policy`

**Solution**:
```typescript
// Backend main.ts
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true
});
```

### Issue 2: 401 Unauthorized

**Error**: All requests return 401

**Check**:
- Token is stored: `localStorage.getItem('accessToken')`
- Token is sent: Check Network tab → Headers → `Authorization: Bearer ...`
- Token is valid: Decode JWT at jwt.io
- Backend expects `Bearer {token}` not just `{token}`

### Issue 3: Still Using Mock Data

**Error**: Getting mock data instead of real data

**Check**:
- `.env.local` exists in root directory
- `NEXT_PUBLIC_USE_MOCK_API=false` is set
- Restarted dev server after creating `.env.local`
- Check in browser console: `console.log(process.env.NEXT_PUBLIC_USE_MOCK_API)`

### Issue 4: Network Error / Timeout

**Error**: Request timeout or network error

**Check**:
- Backend is running: `curl http://localhost:3001/api/health`
- Correct base URL: `http://localhost:3001/api` (not `3000`)
- Firewall/antivirus blocking localhost

### Issue 5: Data Format Mismatch

**Error**: Frontend crashes or shows undefined data

**Check**:
- Backend response format matches frontend expectations
- Use `expand` parameter to include related data
- Check if pagination wrapper is needed

---

## 🚀 QUICK START SCRIPT

Save this as `integrate-backend.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Backend Integration..."

# 1. Create .env.local
echo "📝 Creating .env.local..."
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENV=development
EOF

# 2. Verify backend is running
echo "🔍 Checking backend..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend is NOT running. Please start backend first."
    exit 1
fi

# 3. Restart frontend
echo "🔄 Restarting frontend..."
npm run dev

echo "✅ Integration complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:3001/api"
```

**Run it:**
```bash
chmod +x integrate-backend.sh
./integrate-backend.sh
```

---

## 📊 MIGRATION STRATEGY

If you have existing data in localStorage, migrate it:

```typescript
// src/utils/migrate-data.ts

export async function migrateLocalDataToBackend() {
  const token = localStorage.getItem('accessToken');
  if (!token) return;
  
  // 1. Migrate customers
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  for (const customer of customers) {
    try {
      await fetch('http://localhost:3001/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customer)
      });
    } catch (error) {
      console.error('Failed to migrate customer:', customer.id, error);
    }
  }
  
  // 2. Clear localStorage after migration
  localStorage.removeItem('customers');
  
  console.log('✅ Data migration complete!');
}

// Call once on app startup
if (typeof window !== 'undefined') {
  migrateLocalDataToBackend();
}
```

---

## 📝 NEXT STEPS

### Immediate (Today)
1. Create `.env.local` file
2. Set `NEXT_PUBLIC_USE_MOCK_API=false`
3. Restart frontend dev server
4. Test login

### Short Term (This Week)
1. Test all major workflows
2. Fix any data format mismatches
3. Add error handling for failed requests
4. Test pagination and filtering

### Medium Term (Next Week)
1. Add loading states
2. Add retry logic for failed requests
3. Implement optimistic UI updates
4. Add offline support (optional)

---

## 🎯 SUCCESS CRITERIA

Your integration is successful when:

✅ Users can login and see real data  
✅ Creating customers/vehicles works  
✅ Job cards can be created and updated  
✅ Inventory shows real stock levels  
✅ Search returns backend results  
✅ Pagination works correctly  
✅ File uploads work  
✅ Errors are handled gracefully  
✅ Token refresh works automatically  
✅ No console errors  

---

## 📞 SUPPORT

If you encounter issues:

1. **Check Network Tab**: See actual request/response
2. **Check Console**: Look for errors
3. **Check Backend Logs**: See what backend received
4. **Use Postman**: Test endpoints directly
5. **Verify .env.local**: Ensure it's loaded

**Common Commands:**
```bash
# Check if .env.local is loaded
echo $NEXT_PUBLIC_API_URL  # Should show nothing (client-side only)

# In browser console:
console.log(process.env.NEXT_PUBLIC_API_URL)

# Test backend directly
curl http://localhost:3001/api/health

# Check frontend runs on 3000
netstat -ano | findstr :3000

# Check backend runs on 3001
netstat -ano | findstr :3001
```

---

**Status**: Ready to integrate! Follow steps 1-10 above. 🚀

**Estimated Time**: 2-4 hours for complete integration

**Let's connect your frontend to the backend!** 🎉
