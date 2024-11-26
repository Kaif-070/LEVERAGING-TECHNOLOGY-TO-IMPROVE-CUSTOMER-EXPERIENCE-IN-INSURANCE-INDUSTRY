const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const app = express();
const port = 3006;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'insurance',
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to the database');
});

// Helper Function: Format Date and Time
const formatDateTime = (dateTime) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateTime).toLocaleDateString('en-US', options);
};

// Root Route
app.get('/', (req, res) => {
  res.send('Welcome to the Insurance API!');
});

// Signup Route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkUserQuery, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(insertUserQuery, [name, email, hashedPassword], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to register user' });
      }

      res.status(200).json({ message: 'User registered successfully' });
    });
  });
});

// Login Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const getUserQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(getUserQuery, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = results[0];

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      token,
    });
  });
});

// Fetch Policy Details with Transactions and Claims
app.get('/policy/:id', (req, res) => {
  const policyId = req.params.id;

  if (!policyId) {
    return res.status(400).json({ error: 'Policy ID is required' });
  }

  // Fetch Policy Details
  const policyQuery = 'SELECT * FROM policies WHERE policy_id = ?';
  db.query(policyQuery, [policyId], (err, policyResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (policyResults.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const policy = policyResults[0];

    // Fetch Transaction History
    const transactionQuery = 'SELECT * FROM transactions WHERE policy_id = ? ORDER BY transaction_date DESC';
    db.query(transactionQuery, [policyId], (err, transactionResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      // Fetch Claims
      const claimsQuery = 'SELECT * FROM claims WHERE policy_id = ?';
      db.query(claimsQuery, [policyId], (err, claimsResults) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to fetch claims' });
        }

        // Format Transactions and Claims
        const formattedTransactions = transactionResults.map((transaction) => ({
          ...transaction,
          transaction_date: formatDateTime(transaction.transaction_date),
        }));

        const formattedClaims = claimsResults.map((claim) => ({
          ...claim,
          claim_date: formatDateTime(claim.claim_date),
        }));

        // Send Response
        res.json({
          policy: {
            policy_id: policy.policy_id,
            customer_id: policy.customer_id,
            policy_type: policy.policy_type,
            start_date: formatDateTime(policy.start_date),
            end_date: formatDateTime(policy.end_date),
            premium_amount: policy.premium_amount,
            coverage_details: policy.coverage_details,
            policy_status: policy.policy_status,
            agent_name: policy.agent_name,
            contact_email: policy.contact_email,
            contact_phone: policy.contact_phone,
          },
          transactions: formattedTransactions,
          claims: formattedClaims,
        });
      });
    });
  });
});

// Generate QR Code
app.get('/generate-qr/:id', async (req, res) => {
  const policyId = req.params.id;

  if (!policyId) {
    return res.status(400).json({ error: 'Policy ID is required' });
  }

  try {
    const ngrokUrl = 'https://780e-203-192-253-157.ngrok-free.app'; //ngrok URL
    const qrCodeUrl = `${ngrokUrl}/policy/${policyId}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);
    res.json({ qrCodeImage, qrCodeUrl });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
