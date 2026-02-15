#!/bin/bash
# Quick Diagnostic Script for Admin Dashboard Issue

echo "=== UnityAid Admin Dashboard Diagnostic ==="
echo ""

# Check if backend is running
echo "1. Checking backend connection..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ Backend is running on http://localhost:5000"
else
    echo "✗ Backend is NOT running on http://localhost:5000"
    echo "  Start with: cd backend && npm start"
fi

echo ""
echo "2. Checking frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✓ Frontend is running on http://localhost:5173"
else
    echo "✗ Frontend is NOT running on http://localhost:5173"
    echo "  Start with: cd frontend && npm run dev"
fi

echo ""
echo "3. Testing MongoDB connection..."
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✓ MongoDB is running"
else
    echo "✗ MongoDB is NOT running"
    echo "  Start with: mongod"
fi

echo ""
echo "4. Files to verify:"
echo "   - backend/routes/adminRoutes.js: $([ -f backend/routes/adminRoutes.js ] && echo "✓ exists" || echo "✗ missing")"
echo "   - frontend/src/utils/api.js: $([ -f frontend/src/utils/api.js ] && echo "✓ exists" || echo "✗ missing")"
echo "   - frontend/.env.local: $([ -f frontend/.env.local ] && echo "✓ exists" || echo "✗ missing")"

echo ""
echo "5. To test API endpoints:"
echo "   - Get token from browser: localStorage.getItem('authToken')"
echo "   - Then run:"
echo ""
echo "   TOKEN='your_token_here'"
echo "   curl -X GET http://localhost:5000/api/admin/metrics \\"
echo "     -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     -H \"Content-Type: application/json\""
echo ""

echo "=== Next Steps ==="
echo "1. Ensure backend is running: cd backend && npm start"
echo "2. Ensure frontend is running: cd frontend && npm run dev"
echo "3. Open http://localhost:5173 and login as admin"
echo "4. Check browser DevTools Console for detailed error messages"
echo "5. See DEBUGGING.md for detailed troubleshooting steps"
