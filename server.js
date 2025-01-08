const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');


const app = express();
const port = 3006;

app.use(express.static(__dirname));

app.use(cors({
    origin: '*', // Allow all origins, or replace '*' with your ngrok URL for security
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set up file storage using multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage });

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'user name',
    password: 'sql password',
    database: 'db name',
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to the database');
});

// Root Route
app.get('/', (req, res) => {
    res.send('Welcome to the Insurance API!');
});

// API Endpoint to Handle Contact Form Submission
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const sql = 'INSERT INTO contact_form (name, email, message) VALUES (?, ?, ?)';
    const values = [name, email, message];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting data into database:', err);
            return res.status(500).json({ error: 'Failed to submit the contact form. Please try again later.' });
        }

        res.status(200).json({ message: 'Contact form submitted successfully.' });
    });
});

// Endpoint to save feedback
app.post('/submit-feedback', (req, res) => {
    const { feedback, rating } = req.body;

    if (!feedback || !rating) {
        return res.status(400).json({ message: 'Feedback and rating are required.' });
    }

    const sql = 'INSERT INTO feedback (feedback, rating) VALUES (?, ?)';
    db.query(sql, [feedback, rating], (err, result) => {
        if (err) {
            console.error('Error inserting feedback:', err);
            return res.status(500).json({ message: 'Failed to save feedback.' });
        }

        res.status(200).json({ message: 'Feedback submitted successfully!', feedbackId: result.insertId });
    });
});

// Signup Route
app.post('/signup', async(req, res) => {
    const { name, email, password } = req.body;

    const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkUserQuery, [email], async(err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(insertUserQuery, [name, email, hashedPassword], (err) => {
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

    const getUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(getUserQuery, [email], async(err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

        res.json({ message: 'Login successful', token });
    });
});

// Fetch Policy Details with Payments and Claims
app.get('/policy/:id', (req, res) => {
    const policyId = req.params.id;

    const policyQuery = 'SELECT * FROM policies WHERE policy_id = ?';
    db.query(policyQuery, [policyId], (err, policyResults) => {
        if (err) return res.status(500).json({ error: 'Internal Server Error' });

        if (policyResults.length === 0) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        const policy = policyResults[0];

        const paymentQuery = 'SELECT * FROM payments WHERE policy_id = ? ORDER BY payment_date DESC';
        db.query(paymentQuery, [policyId], (err, paymentResults) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch payments' });

            const claimsQuery = 'SELECT * FROM claims WHERE policy_id = ?';
            db.query(claimsQuery, [policyId], (err, claimsResults) => {
                if (err) return res.status(500).json({ error: 'Failed to fetch claims' });

                res.json({ policy, payments: paymentResults, claims: claimsResults });
            });
        });
    });
});

// Generate QR Code
app.get('/generate-qr/:id', async(req, res) => {
    const policyId = req.params.id;

    try {
        const ngrokUrl = process.env.NGROK_URL || 'https://2e03-182-71-109-122.ngrok-free.app'; //ngrok url
        const qrCodeUrl = `${ngrokUrl}/policy-details.html?id=${policyId}`;
        const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);
        res.json({ qrCodeImage, qrCodeUrl });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});


// Simulate Payment
app.post('/make-payment', (req, res) => {
    const { policy_id, amount, payment_method } = req.body;

    const paymentQuery = `INSERT INTO payments (policy_id, amount, payment_date, payment_method) VALUES (?, ?, NOW(), ?)`
    db.query(paymentQuery, [policy_id, amount, payment_method], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to process payment' });

        res.json({ message: 'Payment successful!', policy_id, amount });
    });
});

// Endpoint to handle claim submission
app.post('/api/claims', upload.single('claim-proof'), (req, res) => {
    console.log('Request Body:', req.body); // Log the incoming form data
    console.log('Uploaded File:', req.file); // Log the uploaded file

    const { policy_id, claim_type, claim_description, claim_date, claim_amount } = req.body;
    const proof_document = req.file ? req.file.filename : null;

    // Check if all required fields are provided
    if (!policy_id || !claim_type || !claim_description || !claim_date || !claim_amount) {
        return res.status(400).json({ error: 'All fields except proof_document are required.' });
    }

    const query = `
      INSERT INTO request (policy_id, claim_type, claim_description, claim_date, claim_amount, proof_document)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [policy_id, claim_type, claim_description, claim_date, claim_amount, proof_document];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting claim into database:', err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        res.status(200).json({
            message: 'Claim submitted successfully',
            claimId: result.insertId,
            filePath: proof_document ? `/uploads/${proof_document}` : null,
        });
    });
});


// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});