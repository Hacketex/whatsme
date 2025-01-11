// server.js
const moment = require('moment');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
let pendingNotifications = new Map(); 

const mysql = require('mysql2');
const bodyParser = require('body-parser');
const webPush = require('web-push');  // Add web-push for notifications


const app = express();
const server = http.createServer(app);
// const io = new Server(server);
const cors = require('cors');
app.use(cors());

const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});


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
    host: '127.0.0.1',
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

function handleMessage(data) {
    const { sender_id, receiver_id, content, content_type = 'text', timestamp } = data;

    console.log("Received message data:", data);

    const userSocketId = onlineUsers.get(String(receiver_id));

    if (userSocketId) {
        console.log(`User ${receiver_id} is online with socket ID: ${userSocketId}`);
        io.to(userSocketId).emit('newMessage', { sender_id, content, timestamp });
        console.log(`Message delivered to User ${receiver_id}.`);

        io.to(userSocketId).emit('notify', {
            senderId: sender_id,
            message: `New message from ${sender_id}`,
            timestamp
        });
    } else {
        console.log(`User ${receiver_id} is not online. Storing pending notification.`);

        if (!pendingNotifications.has(receiver_id)) {
            pendingNotifications.set(receiver_id, []);
        }
        pendingNotifications.get(receiver_id).push({
            sender_id,
            message: `New message from ${sender_id}`,
            timestamp
        });
    }

    console.log("Current online users array:", JSON.stringify(onlineUsers, null, 2));
}


function sendNotification(userId, payload) {
    const socketId = onlineUsers.get(userId);  // Get socketId from onlineUsers map
    console.log(`Checking if user ${userId} is online: ${socketId ? 'Yes' : 'No'}`);
    if (socketId) {
        io.to(socketId).emit('pushNotification', payload);
        console.log(`Notification sent to User ${userId}`);
    } else {
        console.log(`User ${userId} is not online. Notification skipped.`);
    }
}

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
    const { title, body, receiverId } = req.body;

    db.query('SELECT subscription FROM users WHERE id = ?', [receiverId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error fetching FCM token:', err);
            return res.status(500).send('Failed to send notification');
        }

        const token = results[0].subscription;
        const payload = {
            notification: {
                title,
                body,
                icon: '/icon.png'
            }
        };

        const admin = require("firebase-admin");
        admin.messaging().send({
            token,
            notification: {
                title,
                body,
            },
        });
        
    });
});

// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/firebase-messaging-sw.js')
//         .then((registration) => {
//             console.log('Service Worker registered with scope:', registration.scope);
//         })
//         .catch((error) => {
//             console.error('Service Worker registration failed:', error);
//         });
// }

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
                'SELECT content, timestamp FROM messages WHERE user_id = ? ORDER BY timestamp DESC',
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
let onlineUsers = new Map(); 

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('userConnected', (userId) => {
        if (userId) {
            onlineUsers.set(userId, socket.id);
            console.log(`User ${userId} is now online with socket ID: ${socket.id}`);

            if (pendingNotifications.has(userId)) {
                const notifications = pendingNotifications.get(userId);
                notifications.forEach(notification => {
                    io.to(socket.id).emit('notify', notification);
                    console.log(`Pending notification sent to User ${userId}`);
                });
                pendingNotifications.delete(userId);
            }

            console.log('Current online users:', [...onlineUsers.entries()]);
        }
    });

    // Join room logic
    // socket.on('joinRoom', ({ userId, roomId }) => {
    //     console.log(`User ${userId} joined room ${roomId}`);
    //     socket.join(roomId);
    //     socket.to(roomId).emit('userJoined', { userId, roomId });
    // });

    app.post('/save-fcm-token', (req, res) => {
        const { token, userId } = req.body;
        if (!token || !userId) return res.status(400).send('Token and User ID are required');
    
        db.query('UPDATE users SET subscription = ? WHERE id = ?', [token, userId], (err, result) => {
            if (err) {
                console.error('Error saving FCM token:', err);
                return res.status(500).send('Database error');
            }
            res.status(200).send('Token saved successfully');
        });
    });    

    socket.on('sendMessage', (message) => {
        console.log('Message received:', message);
    
        const { sender_id, receiver_id, content, content_type = 'text', timestamp } = message;
    
        if (!sender_id || !receiver_id || !content || !timestamp) {
            console.error('Invalid message data:', message);
            socket.emit('errorMessage', { error: 'Invalid message data provided.' });
            return;
        }
    
        const formattedTimestamp = moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss');
    
        // Save the message to the database
        db.query(
            'INSERT INTO messages (sender_id, receiver_id, content, content_type, timestamp) VALUES (?, ?, ?, ?, ?)',
            [sender_id, receiver_id, content, content_type, formattedTimestamp],
            (err, results) => {
                if (err) {
                    console.error('Database error while saving message:', err);
                    socket.emit('errorMessage', { error: 'Failed to save message. Please try again.' });
                    return;
                }
    
                console.log('Message saved with ID:', results.insertId);
    
                // Create message object to broadcast
                const messageData = {
                    id: results.insertId,
                    sender_id,
                    receiver_id,
                    content,
                    content_type,
                    timestamp: formattedTimestamp,
                };
    
                // Emit message to sender
                io.emit('newMessage', message);
    
                // Check if receiver is online
                const receiverSocketId = onlineUsers.get(receiver_id);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('newMessage', messageData);
    
                    // Send push notification to receiver
                    io.to(receiverSocketId).emit('notify', {
                        senderId: sender_id,
                        message: `New message from ${sender_id}`,
                        timestamp: formattedTimestamp,
                    });
                    console.log(`Message sent to user ${receiver_id} online.`);
                } else {
                    console.log(`User ${receiver_id} is not online. Storing pending notification.`);
    
                    // Store notification for offline users
                    if (!pendingNotifications.has(receiver_id)) {
                        pendingNotifications.set(receiver_id, []);
                    }
                    pendingNotifications.get(receiver_id).push({
                        sender_id,
                        message: `New message from ${sender_id}`,
                        timestamp: formattedTimestamp,
                    });
                }
            }
        );
    });    
    

    socket.on('disconnect', () => {
        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`User ${userId} disconnected.`);
                break;
            }
        }
        console.log('Current online users:', [...onlineUsers.entries()]);
    });
});

app.get('/messages/:userId/:receiverId', (req, res) => {
    const { userId, receiverId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 30; // Default 40 messages
    const offset = parseInt(req.query.offset, 10) || 0; // Default start at 0

    db.query(
        `SELECT * FROM messages 
         WHERE (sender_id = ? AND receiver_id = ?) 
            OR (sender_id = ? AND receiver_id = ?) 
         ORDER BY timestamp DESC  -- Get messages in descending order
         LIMIT ? OFFSET ?`,
        [userId, receiverId, receiverId, userId, limit, offset],
        (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ error: "Internal server error" });
            }
    
            res.json(results);
        }
    );    
});



server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000/login');
});

// app.post('/send-message', (req, res) => {
//     const { sender_id, receiver_id, content, content_type, timestamp } = req.body;
//     const formattedTimestamp = moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss');
//     console.log('Received message data:', req.body);

//     db.query(
//         'INSERT INTO messages (sender_id, receiver_id, content, content_type, timestamp) VALUES (?, ?, ?, ?, ?)',
//         [sender_id, receiver_id, content, content_type, formattedTimestamp],
//         (err, results) => {
//             if (err) {
//                 console.error('Database error:', err);
//                 return res.status(500).json({ success: false, error: 'Database error' });
//             }
//             console.log('Message inserted with ID:', results.insertId);

//             io.emit('message', {
//                 sender_id,
//                 receiver_id,
//                 content,
//                 content_type,
//                 timestamp: formattedTimestamp,
//             });

//             const receiverSocketId = onlineUsers.get(receiver_id);
//             if (receiverSocketId) {
//                 io.to(receiverSocketId).emit('notify', {
//                     senderId: sender_id,
//                     message: `New message from ${sender_id}`,
//                 });
//                 console.log(`Notification sent to user ${receiver_id} (socket ID: ${receiverSocketId})`);
//             } else {
//                 console.log(`User ${receiver_id} is not online. Notification skipped.`);
//             }
//             res.json({ success: true });
//         }
//     );
// });
