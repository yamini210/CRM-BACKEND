const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors'); // Add this line

const app = express();
app.use(bodyParser.json());

// Enable CORS
app.use(cors()); // Add this line

const db = mysql.createConnection({
    host: 'localhost',
    user: 'sqluser',
    password: 'gungun',
    database: 'mini_crm'
});

// Database connection
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

// Create customer
app.post('/api/customers', (req, res) => {
    const { name, email, total_spends, visits, last_visit } = req.body;
    db.query(
        'INSERT INTO customers (name, email, total_spends, visits, last_visit) VALUES (?, ?, ?, ?, ?)',
        [name, email, total_spends, visits, last_visit],
        (error, results) => {
            if (error) return res.status(500).json({ error });
            res.status(201).json({ id: results.insertId });
        }
    );
});

// Create order
app.post('/api/orders', (req, res) => {
    const { customer_id, amount, date } = req.body;
    db.query(
        'INSERT INTO orders (customer_id, amount, date) VALUES (?, ?, ?)',
        [customer_id, amount, date],
        (error, results) => {
            if (error) return res.status(500).json({ error });
            res.status(201).json({ id: results.insertId });
        }
    );
});

// Authenticate user (simplified for example)
const users = [{ id: 1, username: 'user', password: 'password' }];
app.post('/api/auth', (req, res) => {
    const { username, password } = req.body;
    console.log('Received auth request', { username, password });
    const user = users.find(u => u.username === username);
    if (user) {
        console.log('User found:', user);
        if (user.password === password) {
            const token = jwt.sign({ id: user.id }, 'your_jwt_secret');
            res.json({ token });
        } else {
            console.log('Invalid password');
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } else {
        console.log('User not found');
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Middleware to protect routes
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (token) {
        jwt.verify(token, 'your_jwt_secret', (err, user) => {
            if (err) return res.status(403).json({ message: 'Forbidden' });
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

// Audience creation
app.post('/api/audience', authenticateJWT, (req, res) => {
    const rules = req.body.rules; // Assume rules is an array of rule objects
    let query = 'SELECT * FROM customers WHERE ';
    let conditions = [];
    rules.forEach(rule => {
        if (rule.field === 'total_spends' && rule.operator === '>') {
            conditions.push(`total_spends > ${rule.value}`);
        }
        if (rule.field === 'visits' && rule.operator === '=') {
            conditions.push(`visits = ${rule.value}`);
        }
        if (rule.field === 'last_visit' && rule.operator === '<') {
            conditions.push(`last_visit < DATE_SUB(NOW(), INTERVAL ${rule.value} MONTH)`);
        }
    });
    query += conditions.join(' AND ');
    db.query(query, (error, results) => {
        if (error) return res.status(500).json({ error });
        res.json({ audience: results, size: results.length });
    });
});

// Send campaign
app.post('/api/campaign', authenticateJWT, (req, res) => {
    const { message, audience } = req.body; // Assume audience is an array of customer IDs
    audience.forEach(customer_id => {
        db.query(
            'INSERT INTO communications_log (customer_id, message, status) VALUES (?, ?, ?)',
            [customer_id, message, 'PENDING'],
            (error, results) => {
                if (error) return res.status(500).json({ error });
                const logId = results.insertId;
                // Simulate vendor API call
                setTimeout(() => {
                    const status = Math.random() < 0.9 ? 'SENT' : 'FAILED';
                    db.query(
                        'UPDATE communications_log SET status = ? WHERE id = ?',
                        [status, logId],
                        err => {
                            if (err) console.error(err);
                        }
                    );
                }, 1000);
            }
        );
    });
    res.status(200).json({ message: 'Campaign sent' });
});

// Get campaigns
app.get('/api/campaigns', authenticateJWT, (req, res) => {
    db.query('SELECT * FROM communications_log ORDER BY id DESC', (error, results) => {
        if (error) return res.status(500).json({ error });
        res.json({ campaigns: results });
    });
});

const port = 3001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
