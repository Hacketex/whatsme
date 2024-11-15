// server.js
const moment = require('moment');
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

const publicVapidKey = 'BGgKCQ9Od_ZuexQND6TSsZqa9O52uo82aAh08-YXXbbtC_jzUlKgKcRBMqmBez_xg43tAIo1fL1mI4yRAgXmKrs';
const privateVapidKey = 'Xn8Z85i4UXAFiDltS1TUY4iqHJFZmtxcNfR-gt1ORFA';

webPush.setVapidDetails('mailto:pratikdhole786@gmail.com', publicVapidKey, privateVapidKey);

app.post('/subscribe', (req, res) => {
    const { subscription, userId } = req.body;

    db.query(
        'UPDATE users SET subscription = ? WHERE id = ?', 
        [JSON.stringify(subscription), userId], 
        (err) => {
            if (err) throw err;
            res.status(201).json({ message: 'Subscription saved.' });
        }
    );
});

// Route to get username by user ID
app.get('/get-username', (req, res) => {
    const userId = req.query.id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const query = 'SELECT username FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ username: results[0].username });
    });
});


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

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        console.log(req.body);
        return res.status(400).send('Username and password are required');
    }

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length === 0) return res.status(400).send('User not found');

        const user = results[0];

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

app.post('/send-message', (req, res) => {
    const { sender_id, receiver_id, content, content_type, timestamp } = req.body; 

    console.log('Received message data:', req.body);

    const formattedTimestamp = moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss');

    db.query(
        'INSERT INTO messages (sender_id, receiver_id, content, content_type, timestamp) VALUES (?, ?, ?, ?, ?)',
        [sender_id, receiver_id, content, content_type, formattedTimestamp],
        (err, results) => {
            if (err) {
                console.error('Error inserting message into the database:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            console.log('Message inserted with ID:', results.insertId);

            io.emit('message', { 
                sender_id, 
                receiver_id, 
                content, 
                content_type, 
                timestamp: formattedTimestamp
            });

            // Notify the receiver if they have a subscription for push notifications
            db.query('SELECT subscription FROM users WHERE id = ?', [receiver_id], (err, results) => {
                if (err) {
                    console.error('Error fetching subscription:', err);
                    return;
                }
            
                if (results.length > 0) {
                    const rawSubscription = results[0].subscription;
                    console.log('Raw subscription data:', rawSubscription);
                    console.log('Type of raw subscription:', typeof rawSubscription);
            
                    let subscription;
                    try {
                        // Check if the raw subscription is a string or an object
                        if (typeof rawSubscription === 'string') {
                            subscription = JSON.parse(rawSubscription);
                        } else {
                            subscription = rawSubscription; // Already an object
                        }
                        
                        if (!subscription || !subscription.endpoint) {
                            console.error('Invalid subscription object:', subscription);
                            return;
                        }
            
                        const payload = JSON.stringify({
                            title: 'New Message!',
                            body: `${sender_id}: ${content}`,
                            url: 'http://localhost:3000/index.html'
                        });
            
                        webPush.sendNotification(subscription, payload)
                        .then(() => console.log('Notification sent successfully'))
                        .catch(err => {
                            if (err.statusCode === 410) {
                                console.error('Subscription has expired. Removing from database.');
                    
                                // Remove the expired subscription from the database
                                db.query('UPDATE users SET subscription = NULL WHERE id = ?', [receiver_id], (err, result) => {
                                    if (err) {
                                        console.error('Failed to remove expired subscription:', err);
                                    } else {
                                        console.log('Expired subscription removed successfully.');
                                    }
                                });
                            } else {
                                console.error('Error sending notification:', err);
                            }
                        });
                    } catch (parseError) {
                        console.error('Failed to parse subscription JSON:', parseError);
                    }
                }
            });            

            res.json({ success: true });
        }
    );
});


io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('message', (msg) => {
        let messageData;
        if (typeof msg === 'string') {
            messageData = JSON.parse(msg);
        } else {
            messageData = msg;
        }

        const { senderId, receiverId, content } = messageData; // Use messageData instead of msg

        db.query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [senderId, receiverId, content],
            (err) => {
                if (err) throw err;
                io.emit('message', { senderId, receiverId, content });
            }
        );

        db.query('SELECT subscription FROM users WHERE id = ?', [receiverId], (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                const subscription = JSON.parse(results[0].subscription);
                const payload = JSON.stringify({
                    title: 'New Message!',
                    body: `${messageData.senderUsername}: ${messageData.content}`,
                    url: 'http://localhost:3000/index.html'
                });

                webPush.sendNotification(subscription, payload).catch(err => console.error(err));
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


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

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000/login');
});
