const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password:'',
    database: 'leharttb'
});

db.connect((err) => {
    if (err) {
        console.error('An error occured while connecting to the DB:', err);
        return;
    }
    console.log('Connected to the database.');
});