// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const webPush = require('web-push');  // Add web-push for notifications

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
const path = require('path');
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));


// MySQL Database Configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'h4ck3r',
    database: 'chat_app'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database.');
});

// VAPID keys for Push Notifications
const publicVapidKey = 'BGgKCQ9Od_ZuexQND6TSsZqa9O52uo82aAh08-YXXbbtC_jzUlKgKcRBMqmBez_xg43tAIo1fL1mI4yRAgXmKrs';
const privateVapidKey = 'Xn8Z85i4UXAFiDltS1TUY4iqHJFZmtxcNfR-gt1ORFA';

webPush.setVapidDetails('mailto:pratikdhole786@gmail.com', publicVapidKey, privateVapidKey);

// Subscribe endpoint to save the user's push subscription
app.post('/subscribe', (req, res) => {
    const { subscription, userId } = req.body;

    // Store the subscription object in the database
    db.query(
        'UPDATE users SET subscription = ? WHERE id = ?', 
        [JSON.stringify(subscription), userId], 
        (err) => {
            if (err) throw err;
            res.status(201).json({ message: 'Subscription saved.' });
        }
    );
});

// Retrieve subscription from database and send notification
app.post('/send-notification', (req, res) => {
    const payload = JSON.stringify({
        title: 'New Message!',
        body: 'You have a new message!',
        url: 'http://localhost:3000/index.html'
    });

    db.query('SELECT * FROM users WHERE subscription IS NOT NULL', (err, users) => {
        if (err) return console.error(err);

        users.forEach(user => {
            const subscription = JSON.parse(user.subscription);
            webPush.sendNotification(subscription, payload).catch(error => console.error(error));
        });
    });

    res.sendStatus(200);
});

// Login Endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Validate request
    if (!username || !password) {
        console.log(req.body);
        return res.status(400).send('Username and password are required');
    }

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length === 0) return res.status(400).send('User not found');

        const user = results[0];

        // Compare password (in production, ensure proper password hashing)
        if (password === user.password) {
            db.query(
                'SELECT content, timestamp FROM messages WHERE user_id = ? ORDER BY timestamp',
                [user.id], 
                (err, messages) => {
                    if (err) throw err;

                    res.send({
                        userId: user.id,
                        username: user.username,
                        profilePic: user.profile_pic,
                        messages
                    });
                }
            );
        } else {
            res.status(401).send('Incorrect password');
        }
    });
});



// // Store Message in Database & Emit Notifications
// io.on('connection', (socket) => {
//     console.log('A user connected:', socket.id);

//     socket.on('message', (msg) => {
//         const { userId, username, content } = msg;

//         // Insert message into database
//         db.query(
//             'INSERT INTO messages (user_id, content) VALUES (?, ?)',
//             [userId, content],
//             (err) => {
//                 if (err) throw err;

//                 // Broadcast message to all clients
//                 io.emit('message', { username, content });
//             }
//         );

//         // Get the recipient's push subscription and send notification
//         db.query('SELECT subscription FROM users WHERE id = ?', [userId], (err, results) => {
//             if (err) throw err;
//             if (results.length > 0) {
//                 const subscription = JSON.parse(results[0].subscription);
//                 const payload = JSON.stringify({
//                     title: 'New Message!',
//                     body: `${username}: ${content}`,
//                     url: 'http://localhost:3000/index.html'
//                 });

//                 webPush.sendNotification(subscription, payload).catch(err => console.error(err));
//             }
//         });
//     });

//     socket.on('disconnect', () => {
//         console.log('User disconnected:', socket.id);
//     });
// });

// Store Message in Database & Emit Notifications
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Message received from client
    socket.on('message', (msg) => {
        const { senderId, receiverId, content } = msg;

        // Insert message into database
        db.query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [senderId, receiverId, content],
            (err) => {
                if (err) throw err;

                // Broadcast message to the receiver only
                io.emit('message', { senderId, receiverId, content });
            }
        );

        // Get the recipient's push subscription and send notification (if receiver has a subscription)
        db.query('SELECT subscription FROM users WHERE id = ?', [receiverId], (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                const subscription = JSON.parse(results[0].subscription);
                const payload = JSON.stringify({
                    title: 'New Message!',
                    body: `${msg.senderUsername}: ${msg.content}`,
                    url: 'http://localhost:3000/index.html'
                });

                webPush.sendNotification(subscription, payload).catch(err => console.error(err));
            }
        });
    });

    // User disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Fetch Messages between two users (e.g., in login)
app.get('/messages/:userId/:receiverId', (req, res) => {
    const { userId, receiverId } = req.params;

    db.query(
        'SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp',
        [userId, receiverId, receiverId, userId], 
        (err, results) => {
            if (err) throw err;

            res.json(results);
        }
    );
});


// Listen on Port 3000
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000/login');
});
