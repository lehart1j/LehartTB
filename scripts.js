document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.status === "success") {
        sessionStorage.setItem('username', username);
        window.location.href = data.redirect;
    } else {
        alert(data.message);
    }
});
document.getElementById('delete-selected-btn').addEventListener('click', function() {
    // Functionality to delete selected user rows
});

document.getElementById('save-changes-btn').addEventListener('click', function() {
    // Functionality to save changes made
});