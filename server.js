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

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
        // Listen for a custom event to register user on connection
        socket.on('userConnected', (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`User ${userId} is now online with socket ID: ${socket.id}`);
        });
    

    // Existing logic (preserving whatever you had here)
    socket.on('joinRoom', ({ userId, roomId }) => {
        console.log(`User ${userId} joined room ${roomId}`);
        socket.join(roomId);

        // Notify other users in the room
        socket.to(roomId).emit('userJoined', { userId, roomId });
    });

    socket.on('sendMessage', (data) => {
        console.log('Message received:', data);

        // Emit message to the specific room
        io.to(data.roomId).emit('newMessage', data);

        // Notify sender confirmation
        socket.emit('messageSent', { success: true, message: 'Message sent!' });
    });

    // Added feature: Notify active users about new messages
    socket.on('notify', ({ receiverId, notification }) => {
        console.log(`Notifying user ${receiverId}:`, notification);

        // Notify specific user if they are connected
        const room = io.sockets.adapter.rooms.get(receiverId);
        if (room && room.size > 0) {
            io.to(receiverId).emit('notify', notification);
        } else {
            console.log(`User ${receiverId} is not connected. Notification skipped.`);
        }
    });

    // Existing disconnect logic
    socket.on('disconnect', () => {
        const userId = [...onlineUsers.entries()].find(([key, value]) => value === socket.id)?.[0];
        if (userId) {
            onlineUsers.delete(userId);
            console.log(`User ${userId} disconnected and removed from onlineUsers.`);
        }
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

            const receiverSocketId = onlineUsers.get(receiver_id);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('notify', notification);
                console.log(`Notification sent to user ${receiver_id} (socket ID: ${receiverSocketId})`);
            } else {
                console.log(`User ${receiver_id} is not online. Notification skipped.`);
            }
            
            res.json({ success: true });
        }
    );
});
