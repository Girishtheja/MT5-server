const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

const dbURL = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
const metaApiToken = process.env.METAAPI_TOKEN;

mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const accountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mt5Id: String,
  login: String,
  server: String,
  name: String,
  state: String,
  region: String,
  createdAt: { type: Date, default: Date.now }
});
const Account = mongoose.model('Account', accountSchema);

const tradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accountId: String,
  symbol: String,
  volume: Number,
  orderId: String,
  positionId: String,
  tradeStartTime: Date,
  tradeExecutionTime: Date,
  message: String,
  stringCode: String,
  numericCode: Number,
  createdAt: { type: Date, default: Date.now }
});
const Trade = mongoose.model('Trade', tradeSchema);

//authetication middle ware
const authenticateJwt = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashed });
    await newUser.save();

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Create MT5 Account
app.post('/api/mt5/accounts', authenticateJwt, async (req, res) => {
  try {
    const payload = {
      login: req.body.login,
      password: req.body.password,
      name: req.body.name,
      server: req.body.server,
      platform: 'mt5',
      magic: req.body.magic || 123456,
      type: 'cloud-g2'
    };

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'auth-token': metaApiToken,
      'transaction-id': crypto.randomBytes(16).toString('hex')
    };

    const result = await axios.post(
      'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts',
      payload,
      { headers }
    );

    const { id, state, region } = result.data;
    const account = new Account({
      userId: req.user.userId,
      mt5Id: id,
      login: req.body.login,
      server: req.body.server,
      name: req.body.name,
      state,
      region
    });

    await account.save();
    res.json({ message: 'MT5 account created', accountId: id });
  } catch (err) {
    const msg = 'Account creation failed';
    console.error('Account creation error:', msg);
    res.status(err.response?.status || 500).json({ error: msg });
  }
});

// Get all MT5 Accounts
app.get('/api/mt5/accounts', authenticateJwt, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.userId });
    res.json(accounts);
  } catch (err) {
    console.error('Fetch accounts error:', err.message);
    res.status(500).json({ error: 'Could not retrieve accounts' });
  }
});

// Execute a Trade
app.post('/api/mt5/accounts/:accountId/trade', authenticateJwt, async (req, res) => {
  try {
    const { symbol, volume, actionType } = req.body;
    const account = await Account.findOne({ mt5Id: req.params.accountId });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const tradePayload = {
    symbol,
    volume,
    actionType,
    magic: 123456,
    comment: "Trade via API"
    };

    const result = await axios.post(
      `https://mt-client-api-v1.london.agiliumtrade.ai/users/current/accounts/${req.params.accountId}/trade`,
      tradePayload,
      { headers: { 'auth-token': metaApiToken } }
    );

    if (result.data?.stringCode?.startsWith('ERR_')) {
      return res.status(400).json({ message: 'Trade failed', error: result.data });
    }

    const trade = new Trade({
      userId: req.user.userId,
      accountId: req.params.accountId,
      ...result.data
    });

    await trade.save();
    res.json({ message: 'Trade executed', result: result.data });
  } catch (err) {
    const msg ='Trade execution failed';
    console.error('Trade error:', msg);
    res.status(500).json({ error: msg });
  }
});

// Get Positions
app.get('/api/mt5/accounts/:accountId/positions', authenticateJwt, async (req, res) => {
  try {
    const account = await Account.findOne({ mt5Id: req.params.accountId });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const result = await axios.get(
      `https://mt-client-api-v1.london.agiliumtrade.ai/users/current/accounts/${req.params.accountId}/positions`,
      { headers: { 'auth-token': metaApiToken } }
    );

    res.json({ positions: result.data });
  } catch (err) {
    const msg ='Failed to fetch positions';
    console.error('Position fetch error:', msg);
    res.status(500).json({ error: msg });
  }
});

// Get all Trades
app.get('/api/trades', authenticateJwt, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.userId });
    res.json(trades);
  } catch (err) {
    console.error('Fetch trades error:', err.message);
    res.status(500).json({ error: 'Could not retrieve trades' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
