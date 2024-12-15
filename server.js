// server.js
const moment = require('moment');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const onlineUsers = new Map(); // Tracks userId -> socket.id mappings
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
    if (!subscription || !userId) {
        return res.status(400).json({ error: 'Subscription and userId are required.' });
    }

    db.query(
        'UPDATE users SET subscription = ? WHERE id = ?', 
        [JSON.stringify(subscription), userId], 
        (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to save subscription.' });
            }
            res.status(201).json({ message: 'Subscription saved.' });
        }
    );
});


function handleMessage(data) {
    const { sender_id, receiver_id, content, content_type, timestamp } = data;

    // Log message data for verification
    console.log("Received message data:", data);

    const userSocketId = onlineUsers.get(String(receiver_id));
    if (userSocketId) {
        console.log(`User ${receiver_id} is online with socket ID: ${userSocketId}`);
        // Send real-time message to the receiver
        io.to(userSocketId).emit('newMessage', { sender_id, content, timestamp });
        console.log(`Message delivered to User ${receiver_id}.`);
    } else {
        console.log(`User ${receiver_id} is not online. Notification skipped.`);
        // Handle push notifications for offline users here
    }
    

    // Log the current state of online users
    console.log("Current online users array:", JSON.stringify(onlineUsers, null, 2));
}

function sendNotification(userId, payload) {
    const subscription = onlineUsers.get(userId);
    if (subscription) {
        webPush.sendNotification(subscription, JSON.stringify(payload))
            .then(() => console.log(`Notification sent to User ${userId}`))
            .catch(err => console.error('Push Notification Error:', err));
    } else {
        console.log(`User ${userId} is not subscribed.`);
    }
}

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

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Fallback mechanism to detect idle connections
    const idleTimeout = setTimeout(() => {
        if (![...onlineUsers.values()].includes(socket.id)) {
            console.log(`Socket ${socket.id} disconnected due to idle timeout.`);
            socket.disconnect();
        }
    }, 10000); // 10 seconds timeout for user registration

    // Listen for a custom event to register user on connection
    socket.on('userConnected', (userId) => {
        clearTimeout(idleTimeout); // Cancel timeout when a valid user connects
        if (userId) {
            onlineUsers.set(userId, socket.id);
            console.log(`User ${userId} is now online with socket ID: ${socket.id}`);
            console.log('Current online users:', [...onlineUsers.entries()]);
        }
    });
    
    

    // Join room logic
    socket.on('joinRoom', ({ userId, roomId }) => {
        console.log(`User ${userId} joined room ${roomId}`);
        socket.join(roomId);
        socket.to(roomId).emit('userJoined', { userId, roomId });
    });

    socket.on('sendMessage', (data) => {
        console.log('Message received:', data);

        // Emit the message to the room
        io.to(data.roomId).emit('newMessage', data);
        socket.emit('messageSent', { success: true, message: 'Message sent!' });

        // Notify the receiver if online
        const receiverSocketId = onlineUsers.get(data.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('notify', {
                senderId: data.senderId,
                message: `New message from ${data.senderId}`,
                roomId: data.roomId,
            });
            console.log(`Notification sent to user ${data.receiverId} (socket ID: ${receiverSocketId})`);
        } else {
            console.log(`User ${data.receiverId} is not online. Notification skipped.`);
        }
    });

    socket.on('disconnect', () => {
        const userId = [...onlineUsers.entries()].find(([key, value]) => value === socket.id)?.[0];
        if (userId) {
            onlineUsers.delete(userId);
            console.log(`User ${userId} disconnected.`);
        } else {
            console.log(`Unknown user disconnected. Socket ID: ${socket.id}`);
        }
        console.log('Current online users:', [...onlineUsers.entries()]);
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

app.post('/send-message', (req, res) => {
    const { sender_id, receiver_id, content, content_type, timestamp } = req.body;
    const formattedTimestamp = moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss');
    console.log('Received message data:', req.body);

    db.query(
        'INSERT INTO messages (sender_id, receiver_id, content, content_type, timestamp) VALUES (?, ?, ?, ?, ?)',
        [sender_id, receiver_id, content, content_type, formattedTimestamp],
        (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            console.log('Message inserted with ID:', results.insertId);

            io.emit('message', {
                sender_id,
                receiver_id,
                content,
                content_type,
                timestamp: formattedTimestamp,
            });

            const receiverSocketId = onlineUsers.get(receiver_id);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('notify', {
                    senderId: sender_id,
                    message: `New message from ${sender_id}`,
                });
                console.log(`Notification sent to user ${receiver_id} (socket ID: ${receiverSocketId})`);
            } else {
                console.log(`User ${receiver_id} is not online. Notification skipped.`);
            }
            res.json({ success: true });
        }
    );
});
