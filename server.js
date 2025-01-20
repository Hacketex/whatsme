// server.js
const moment = require('moment');
const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
let pendingNotifications = new Map(); 

const { Pool } = require('pg');
const bodyParser = require('body-parser');
const webPush = require('web-push');  // Add web-push for notifications


const app = express();
const server = http.createServer(app);
// const io = new Server(server);
const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3000; // Default to 3000 if not set in .env
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const io = require('socket.io')(server, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
    },
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

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432, // PostgreSQL default port
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL database.'))
    .catch((err) => console.error('Database connection failed:', err));

module.exports = pool;

function handleMessage(data) {
    const { sender_id, receiver_id, content, content_type = 'text', timestamp, user_id } = data;

    console.log("Received message data:", data);

    const userSocketId = onlineUsers.get(String(receiver_id));

    if (userSocketId) {
        io.to(userSocketId).emit('newMessage', { sender_id, content, timestamp });
        io.to(userSocketId).emit('notify', {
            senderId: sender_id,
            message: `New message from ${sender_id}`,
            timestamp
        });
    } else {
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

app.get('/get-username', async (req, res) => {
    const userId = req.query.id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const query = 'SELECT username FROM users WHERE id = $1';
        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ username: result.rows[0].username });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});


app.post('/send-notification', async (req, res) => {
    const { title, body, receiverId } = req.body;

    try {
        const result = await pool.query('SELECT subscription FROM users WHERE id = $1', [receiverId]);

        if (result.rows.length === 0) {
            return res.status(404).send('User not found');
        }

        const token = result.rows[0].subscription;
        const payload = {
            notification: {
                title,
                body,
                icon: '/icon.png'
            }
        };

        // Send push notification logic here
        console.log(`Notification sent to user ${receiverId}`);
    } catch (err) {
        console.error('Error sending notification:', err);
        res.status(500).send('Failed to send notification');
    }
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

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(400).send('User not found');
        }

        const user = result.rows[0];
        if (password === user.password) {
            const messagesResult = await pool.query(
                'SELECT content, timestamp FROM messages WHERE user_id = $1 ORDER BY timestamp DESC',
                [user.id]
            );            

            res.send({
                userId: user.id,
                username: user.username,
                profilePic: user.profile_pic,
                messages: messagesResult.rows
            });
        } else {
            res.status(401).send('Incorrect password');
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Internal server error');
    }
});

let onlineUsers = new Map(); 

io.on('connection', (socket) => {
    console.log(`[DEBUG] User connected: Socket ID - ${socket.id}`);
    console.log('A user connected:', socket.id);

    socket.on('userConnected', (userId) => {
        if (userId) {
            onlineUsers.set(userId, socket.id);
            if (pendingNotifications.has(userId)) {
                const notifications = pendingNotifications.get(userId);
                notifications.forEach(notification => {
                    io.to(socket.id).emit('notify', notification);
                });
                pendingNotifications.delete(userId);
            }
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
    
        pool.query('UPDATE users SET subscription = $1 WHERE id = $2', [token, userId], (err, result) => {
            if (err) {
                console.error('Error saving FCM token:', err);
                return res.status(500).send('Database error');
            }
            res.status(200).send('Token saved successfully');
        });
    });

    socket.on('sendMessage', (message) => {
        console.log('Message received:', message);
    
        const { sender_id, receiver_id, content, content_type = 'text', timestamp, user_id } = message;
    
        if (!sender_id || !receiver_id || !content || !timestamp) {
            console.error('Invalid message data:', message);
            socket.emit('errorMessage', { error: 'Invalid message data provided.' });
            return;
        }
    
        const formattedTimestamp = moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss');
    
        // Save the message to the database
        pool.query(
            'INSERT INTO messages (sender_id, receiver_id, content, content_type, timestamp, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [sender_id, receiver_id, content, content_type, formattedTimestamp, user_id],
            (err, results) => {
                if (err) {
                    console.error('Database error while saving message:', err);
                    socket.emit('errorMessage', { error: 'Failed to save message. Please try again.' });
                    return;
                }
    
                console.log('Message saved successfully.');
    
                // Create message object to broadcast
                const messageData = {
                    sender_id,
                    receiver_id,
                    content,
                    content_type,
                    timestamp: formattedTimestamp,
                    user_id,
                };
    
                // Emit message to sender
                io.emit('newMessage', message);
    
                // Check if receiver is online
                const receiverSocketId = onlineUsers.get(receiver_id);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('newMessage', messageData);
                    io.to(receiverSocketId).emit('notify', {
                        senderId: sender_id,
                        message: `New message from ${sender_id}`,
                        timestamp: formattedTimestamp,
                    });
                    console.log(`Message sent to user ${receiver_id} online.`);
                } else {
                    console.log(`User ${receiver_id} is not online. Storing pending notification.`);
    
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
        onlineUsers.delete(socket.id);
        console.log('Current online users:', [...onlineUsers.entries()]);
    });
});

app.get('/messages/:userId/:receiverId', async (req, res) => {
    const { userId, receiverId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 30;
    const offset = parseInt(req.query.offset, 10) || 0;

    try {
        const result = await pool.query(
            `SELECT * FROM messages
             WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY timestamp DESC
             LIMIT $3 OFFSET $4`,
            [userId, receiverId, limit, offset]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});



server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}/login`);
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
