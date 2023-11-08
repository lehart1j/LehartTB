#!/bin/bash

#Exit on any error
set -e

# Update system package index
sudo apt update

#Install node.js and npm
sudo apt install -y nodejs npm

#install apache
sudo apt install -y apache2

# Install MySQL
sudo apt install -y mysql-server

#Start and enable Apache and SQL
sudo systemctl enable apache2
sudo systemctl restart apache2
sudo systemctl start mysql
sudo systemctl enable mysql


sudo cp -r ./public_html/* /var/www/html/

#Ensure ownership and permissions are correct
sudo chown -R www-data:www-data /var/www/html/
sudo find /var/www/html/ -type d -exec chmod 755 {} \;
sudo find /var/www/html -type f - exect chmod 755 {} \;



#Setup the database and users
DB_ROOT_PASS=''
DB_NAME='leharttb'
DB_USER='lehart'
DB_PASS='admin'

#DB TABLES AND USERS
mysql -u root -p"$DB_ROOT_PASS" -e "CREATE DATABASE $DB_NAME;"
mysql -u root -p"$DB_ROOT_PASS" -e "CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -u root -p"$DB_ROOT_PASS" -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -u root -"$DB_ROOT_PASS" -e "FLUSH PRIVILEGES;"

#Add table creation commands and admin user creation
mysql -u "$DB_USER" -p "$DB_PASS" -e "USE $DB_NAME;
CREATE TABLE channels (
    channelID INT AUTO_INCREMENT PRIMARY KEY,
    channelName VARCHAR(255) NOT NULL
) ENGINE=InnoDB;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    isAdmin BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE-InnoDB;
CREATE TABLE user_channels(
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    channel_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (channel_id) REFERENCES channels(channelID)
)ENGINE=InnoDB;

--Insert the admin user
INSERT INTO users (username, password, isAdmin) VALUES ('admin', PASSWORD('admin'), TRUE);"

#Setup Apache to server html and js files

sudo systemctl reload apache2

echo "Installation has completed successfully!"