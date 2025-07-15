# MT5 Trading API Server

This project is a RESTful API server that allows users to manage MT5 trading accounts, execute trades, and retrieve trade history using the MetaApi cloud service. It includes user authentication, account management, trade execution, and data retrieval functionalities.

---

##  Features

-  User authentication (register and login)
-  Create and manage MT5 trading accounts
-  Retrive all accounts created by the user
-  Execute trades on MT5 accounts
-  Retrieve trade history
-  Retrieve account positions

---

##  Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- MetaApi account and API token

---

##  Installation

1. Clone the repository:
```bash
git clone https://github.com/Girishtheja/MT5-server.git
cd MT5-server
```

2. Installation

```bash
npm install
```
3. Create .env file in the root directory 
```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
METAAPI_TOKEN=your_metaapi_token

```
4. Start the server
```bash
node index.js
```

---

## Testing Endpoints

**Note:** Import as curl in Postman to test the end points.

Register a new user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"username": "testuser", "password": "testpass"}'

```
Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"username": "testuser", "password": "testpass"}'

```
**Note:** Use the token received in the login response as your Bearer Authorization header for all protected endpoints below.

Create an MT5 account:
```bash
curl -X POST http://localhost:3000/api/mt5/accounts \
-H "Authorization: Bearer your_jwt_token" \
-H "Content-Type: application/json" \
-d '{
    "login": "login",
    "password": "password",
    "name": "MT5",
    "server": "Exness-MT5Real18",
    "magic": 1234567
}'

```
Execute a trade:
```bash
curl -X POST http://localhost:3000/api/mt5/accounts/your_account_id/trade \
-H "Authorization: Bearer your_jwt_token" \
-H "Content-Type: application/json" \
-d '{
    "symbol": "EURUSDm",
    "actionType": "ORDER_TYPE_BUY",
    "volume": 0.01,
    "comment": "Buy via curl",
    "magic": 123456
}'

```
Get all accounts
```bash
curl -X POST http://localhost:3000/api/mt5/accounts \
-H "Authorization: Bearer your_jwt_token" \
```
Get position of the trade:
```bash
curl -X GET http://localhost:3000/api/mt5/accounts/your_account_id/positions \
-H "Authorization: Bearer your_jwt_token"

```
Get all trades:
```bash
curl -X GET http://localhost:3000/api/trades \
-H "Authorization: Bearer your_jwt_token"

```
