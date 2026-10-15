@echo off
echo ============================================================
echo  LOGIN CONNECTIVITY TEST - http://127.0.0.1:5001
echo ============================================================

echo.
echo [1] Testing: admin@gotek.com / admin123 (super-admin)
curl -s -X POST http://127.0.0.1:5001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@gotek.com\",\"password\":\"admin123\"}"
echo.

echo.
echo [2] Testing: admin1@gmail.com / admin123 (super-admin)
curl -s -X POST http://127.0.0.1:5001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin1@gmail.com\",\"password\":\"admin123\"}"
echo.

echo.
echo [3] Testing: sub1@gmail.com / sub11234 (admin)
curl -s -X POST http://127.0.0.1:5001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"sub1@gmail.com\",\"password\":\"sub11234\"}"
echo.

echo.
echo [4] Testing: user1@gmail.com / user123 (user)
curl -s -X POST http://127.0.0.1:5001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"user1@gmail.com\",\"password\":\"user123\"}"
echo.

echo.
echo [5] Testing WRONG password (should fail)
curl -s -X POST http://127.0.0.1:5001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@gotek.com\",\"password\":\"wrongpass\"}"
echo.

echo.
echo ============================================================
echo  TEST COMPLETE
echo ============================================================
