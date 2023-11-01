const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');

const sessionSecret = crypto.randomBytes(64).toString('hex');

const app = express();
const PORT = 3000;

const http = require('http').createServer(app);
const io = require('socket.io')(http);

io.on('connection', (socket) =>{
    console.log('User Connected: ', socket.io);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.io);
    });
});
http.listen(3000, () =>{
    console.log('Server is listening on port 3000');
});

app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
}));

// Database connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'leharttb'
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [rows] = await db.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (rows.length > 0) {
            const user = rows[0];
            req.session.userID = user.id;
            req.session.isAdmin = user.isAdmin;

            if (user.isAdmin) {
                return res.json({ status: 'success', redirect: 'admin.html' });
            } else {
                return res.json({ status: 'success', redirect: 'intercom.html' });
            }
        } else {
            return res.status(401).json({ status: 'error', message: 'Invalid login credentials' });
        }
    } catch (err) {
        return res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

app.get('/test', (req, res) => {
    res.send('Server is working');
});

// Endpoint to add users
app.post('/addUser', async (req, res) => {
    let user = req.body;
    let sql = 'INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)';

    try {
        const [result] = await db.execute(sql, [user.username, user.password, user.isAdmin]);
        if(result && result.affectedRows > 0){
            res.send('User Added');
        } else {
            res.status(400).send('Failed to add user');
        }
    } catch (err){
        console.error(err);
        res.status(500).send('Server error: ${err.message}');
    }
});

//Endpoint to delete users
app.delete('/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId; // Adjusted the reference here to match the endpoint parameter
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [userId]);
        if(result && result.affectedRows > 0) {
            return res.json({ message: 'User deleted successfully.'});
        } else {
            return res.status(400).json({ message: 'User not found' });
        }
    } catch (err){
        console.error(err);
        res.status(500).send(`Server error: ${err.message}`); // Adjusted the string template syntax here as well.
    }
});

//Endpoint to get users and channels
app.get('/getUsersWithChannels', async (req, res) => {
    try {
        //fetch all users
        const sqlUsers = 'SELECT id, username FROM users';
        const [users] = await db.execute(sqlUsers);

        // For each user, fetch their assigned channels
        const sqlChannels = 'SELECT channels.channelName From user_channels LEFT JOIN channels ON user_channels.channel_id = channels.channelID WHERE user_channels.user_id = ?';
        for (let user of users) {
            const [channels] = await db.execute(sqlChannels, [user.id]);
            user.channels = channels.map(channel => channel.channelName).join(', ');
        }
        //Send the combined data back to the client
        res.json(users);
    } catch (error) {
        console.error('Error fetching users with channels:', error);
    }
});


//Channels setup
app.get('/channels', async (req, res) => {
    try {
        const sql = `
            SELECT 
                channels.channelID, 
                channels.channelName,
                GROUP_CONCAT(users.username) AS assignedUsers
            FROM 
                channels 
            LEFT JOIN 
                user_channels ON channels.channelID = user_channels.channel_id
            LEFT JOIN 
                users ON user_channels.user_id = users.id
            GROUP BY 
                channels.channelID;
        `;

        const [channelsWithUsers] = await db.execute(sql);
        res.json(channelsWithUsers);

    } catch (error) {
        console.error('Error fetching channels with users:', error);
        res.status(500).json({ message: 'Server error fetching channels with users.' });

    }
});

// Endpoint to add channels
app.post('/addChannel', async (req, res) => {
    let channels = req.body;
    let sql = 'INSERT INTO channels (channelName) VALUES (?)';

    try {
        const [result] = await db.execute(sql, [channels.channelName]);
        if(result && result.affectedRows > 0){
            res.send('Channel Added');
        } else {
            res.status(400).send('Failed to add channel');
        }
    } catch (err){
        console.error(err);
        res.status(500).send('Server error: ${err.message}');
    }
});

// Endpoint to get channels for dropdown selection
app.get('/getChannels', async(req, res) => {
    let sql = 'SELECT * FROM channels';

    try {
        const [channels] = await db.query(sql);
        res.json(channels);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error: ${err.message}');
    }
});

// Endpoint to get users for dropdown selection
app.get('/getUsers', async (req, res) => {
    let sql = 'SELECT * FROM users';

    try {
        const [users] = await db.query(sql);
        res.json(users);
    } catch (err) {
    res.status(500).send('Server error: ${err.message}');
    }
});

// Endpoint to handle assigning users to channels
app.post('/assignUsersToChannels', async (req, res) => {
    const channelID = req.body.channelId;
    const userIds = req.body.userIds;

    console.log('Selection' + userIds +  ' ' + channelID);

    let sql = 'INSERT INTO user_channels (user_id, channel_id) VALUES (?, ?)';



    try {
        for (let userId of userIds){
          await db.execute(sql, [userId, channelID]);
        }
        res.send('Users assigned to channel successfully');
    } catch (err){
        console.error(err);
        res.status(500).send('Server error: ${err.message}');
    }
});

//Endpoint to delete channels
app.delete('/channels/:channelID', async (req, res) => {
    const channelId = req.params.channelID;

    try {
        // 1. Delete the references from the user_channels table
        await db.execute('DELETE FROM user_channels WHERE channel_id = ?', [channelId]);
        
        // 2. Delete the channel from the channels table
        await db.execute('DELETE FROM channels WHERE channelID = ?', [channelId]);
        
        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error: ' + err.message);
    }
});

// End point to handle logout
app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('Server error');
            }
            res.send('Logged out successfully');
        });
    } else {
        res.status(400).send('Not logged in');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
