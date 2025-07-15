# MT5 Trading API Server

This project is a RESTful API server that allows users to manage MT5 trading accounts, execute trades, and retrieve trade history using the MetaApi cloud service. It includes user authentication, account management, trade execution, and data retrieval functionalities.

---

##  Features

-  User authentication (register and login)
-  Create and manage MT5 trading accounts
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














