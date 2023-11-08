document.addEventListener('DOMContentLoaded', function() {
    // Handle Menu Items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', handleMenuItemClick);
    });

    if (sessionStorage.getItem('username')) {
        let username = sessionStorage.getItem('username');
        document.getElementById('usernameDisplay').textContent = 'Hello, ' + username;
    }

     // Event Listener for create user button
     document.getElementById('create-user-btn').addEventListener('click', () => {
        document.getElementById('users-section').style.display = 'none';
        document.getElementById('create-user-section').style.display = 'block';
    });

    //Event Listener for save channel button
    document.getElementById("saveNewChannelBtn").addEventListener("click", handleSaveChannel);


     // Event Listener for save user button
     document.getElementById("saveUserBtn").addEventListener("click", handleSaveUser);

     //Event Listener for delete user button
     document.getElementById('delete-selection-btn').addEventListener('click', handleDeleteSelectedUsers);

     //Event listener for create channels button
     document.getElementById("new-channel-btn").addEventListener("click", function() {
        document.getElementById("channels-section").style.display = "none";
        document.getElementById("create-channel-section").style.display = "block";
        populateChannelDropdown();
        populateUsersDropdown();
     });

     //Event Listener for assigning users to channels
     document.getElementById('assignUsers').addEventListener("click", assignUsersToChannels);




     // Populate the users table
     populateUsersTable();
    });

 function resetAllContentDisplays(){
    document.querySelectorAll(".content-selection").forEach(el => el.style.display = "none");
 }

 function handleMenuItemClick(event) {
    const option = this.textContent.trim().toLowerCase();

    //Hide all sections first
    resetAllContentDisplays();

    if(option === 'users') {
        document.getElementById('status-section').style.display = 'none';
        document.getElementById('create-channel-section').style.display = "none";
        document.getElementById('users-section').style.display = 'block';
    } else if (option === 'channels') {
        document.getElementById('status-section').style.display = 'none';
        document.getElementById('create-channel-section').style.display = "none";
        document.getElementById('channels-section').style.display = 'block';
        fetchChannels();
    } else if (option === 'intercom'){
        window.location.href = "intercom.html";
    } else if (option === 'logout') {
        logout();
        resetAllContentDisplays();
    }
    
    else {
        alert('You have selected ${option}');
    }
}

function handleSaveUser() {
    let username = document.getElementById("usernameField").value;
    let password = document.getElementById("passwordField").value;
    let isAdmin = document.getElementById("isAdminCheckbox").checked; 

    fetch('http://localhost:3000/addUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, isAdmin })
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
    })
    .then(data => { 
        showFeedback(data);
        resetAllContentDisplays();
        document.getElementById('create-user-section').style.display = 'none';
        document.getElementById('users-section').style.display = 'block';
        populateUsersTable();
    })
    .catch(error => { showFeedback("User has not been added, please contact your admin"); });
}

function handleChannelMenuClick() {
    document.querySelectorAll(".content-selection").forEach(el => el.style.display = "none");
    document.getElementById("channels-section").style.display = "block";
    fetchChannels();
}

function showFeedback(message) {
    const feedbackModal = document.getElementById("feedbackModal");
    const feedbackMessage = document.getElementById("feedbackMessage");
    feedbackMessage.innerText = message;
    feedbackModal.style.display = "block";
    feedbackModal.addEventListener("click", function () {
        feedbackModal.style.display = "none";
    });
}

function populateUsersTable() {
    fetch('http://localhost:3000/getUsersWithChannels')
    .then(response => response.json())
    .then(users => {
        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = '';
        users.forEach(user => {
            let row = `
                <tr data-user-id="${user.id}">
                    <td>${user.username}</td>
                    <td>${user.channels || 'None'}</td>
                    <td><input type="checkbox" data-user-id="${user.id}"></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    })
    .catch(error => { console.error('Error fetching users:', error); });
}

function fetchChannels() {
    fetch('http://localhost:3000/channels')
        .then(response => response.json())
        .then(data => {
            let tbody = document.getElementById("channels-table-body");
            tbody.innerHTML = ""; // Clear the table body first

            data.forEach(channel => {
                let row = `
                    <tr data-channel-id="${channel.channelID}">
                        <td><a href="#" class="channel-link">${channel.channelName}</a></td>
                        <td>${channel.assignedUsers || 'None'}</td>
                        <td><button onclick="deleteChannel(${channel.channelID})">Delete</button></td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });

            // You can add further interactivity here, for instance, event listeners for the channel links
        })
        .catch(error => {
            console.error("Error fetching channels:", error);
        });
}

//Functions to handle channels

//function to save channel
function handleSaveChannel() {
    let channelName = document.getElementById("newChannelNameField").value;


    fetch('http://localhost:3000/addChannel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({channelName})
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
    })
    .then(data => { 
        showFeedback(data);
        resetAllContentDisplays();
        document.getElementById('create-channel-section').style.display = 'none';
        document.getElementById('channels-section').style.display = 'block';
        showFeedback('Channel added successfully');
        fetchChannels();
        populateChannelDropdown();
        populateUsersDropdown();
    })
    .catch(error => { showFeedback("Channel has not been added, please contact your admin"); });
}

//Function to handle dropdown selection (channels)
function populateChannelDropdown(){
    //Fetch channels from server
    fetch('http://localhost:3000/getChannels')
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then (channels => {
        const dropdown = document.getElementById('selectChannel'); //Dropdown ID

        // clear existing options
        dropdown.innerHTML = '';

        //populate the dropdown
        channels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.channelID;
            option.textContent = channel.channelName;
            dropdown.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error Fetching channels:', error);
    });
}

//Function to populate the users dropdown for channels
function populateUsersDropdown(){
    fetch('http://localhost:3000/getUsers')
    .then(response => {
        if(!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then (users => {
        const dropdown = document.getElementById('usersDropdown');
        //clear existing options
        dropdown.innerHTML = '';

        //populate the dropdown with users
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username;
            dropdown.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error fetching users:', error);
    });
}

//Function to assign users to channels
function assignUsersToChannels(){
    const channelId = document.getElementById('selectChannel').value;
    const usersDropdown = document.getElementById('usersDropdown');
    const selectedUserIds = Array.from(usersDropdown.selectedOptions).map(option => option.value);

    if (!channelId || selectedUserIds.length === 0) {
        showFeedback('Please select a channel and at least one user');
        return;
    }
    fetch ('http://localhost:3000/assignUsersToChannels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            channelId: channelId,
            userIds: selectedUserIds
        })
       
    })
    //console.log('Selected Channel ' + channelId + ' Selected User ' + userIds)
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
    })
    .then(data => { 
        showFeedback(data);
        resetAllContentDisplays();
        document.getElementById('create-channel-section').style.display = 'none';
        document.getElementById('channels-section').style.display = 'block';
        showFeedback('Channel added successfully');
        fetchChannels();
        populateChannelDropdown();
        populateUsersDropdown();
    })
    .catch(error => {
        console.error('Error assigning users to channel:', error);
        showFeedback('Failed to assign users. Please contact your admin');
    });
}


//Function to delete channels
function deleteChannel(channelID) {
    // Add a confirmation prompt before deleting
    if (!window.confirm('Are you sure you want to delete this channel and its associations?')) {
        return; // Exit the function if the user cancels the deletion
    }

    fetch(`http://localhost:3000/channels/${channelID}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete channel with ID ' + channelID);
        }
        return response.json();
    })
    .then(data => {
        console.log('Channel deleted successfully:', data);
        showFeedback(channelID + 'Deleted Successfully');
        fetchChannels();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

//Functions to delete users

function handleDeleteSelectedUsers(){
    //Gather all the checked checkboxes
    const selectedCheckboxes = document.querySelectorAll('#users-table-body input[type="checkbox"]:checked');
    if (selectedCheckboxes.length === 0){
        showFeedback('No users selected for deletion.');
        return;
    }

    let userIdsToDelete = Array.from(selectedCheckboxes).map(checkbox => checkbox.getAttribute('data-user-id'));

    //Send DELETE request for each selected user
    Promise.all(userIdsToDelete.map(userId => deletedUser(userId)))
    .then(() => {
        showFeedback('Selected users deleted successfully.');
        populateUsersTable();
    })
    .catch(error => {
        showFeedback('An error occured while deleting users. Please contact your admin.');
        console.error(error);
    });
}

//Function to send the DELETE request for a user
function deletedUser(userId){
    return fetch(`http://localhost:3000/users/${userId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete user with ID ' + userId);
        }
        return response.json();
    });
}

//Handle logging out users
function logout() {
    fetch('http://localhost:3000/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to log out');
        }
        window.location.href = "index.html"; // Redirect to main page after logging out
    })
    .catch(error => {
        console.error("Error during logout:", error);
    });
}

function updateTalkbackStatus() {
    let activeUsersCount = 0;
    let activeChannelsCount = 0;
    const channelsContainer = document.getElementById('channelsContainer');
    channelsContainer.innerHTML = ''; // Clear previous content

    channels.forEach(channel => {
        if (channel.users.length > 0) {
            activeChannelsCount++;
            activeUsersCount += channel.users.length;
            
            const channelDiv = document.createElement('div');
            channelDiv.innerHTML = `
                <strong>${channel.name}</strong> | Active users: ${channel.users.length}
            `;

            channel.users.forEach(user => {
                const userBadge = document.createElement('span');
                userBadge.className = 'user-badge green'; // Placeholder green for now
                userBadge.innerText = user;
                channelDiv.appendChild(userBadge);
            });

            channelsContainer.appendChild(channelDiv);
        }
    });

    document.getElementById('activeUsersCount').innerText = activeUsersCount;
    document.getElementById('activeChannelsCount').innerText = activeChannelsCount;
}
