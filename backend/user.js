async function sendData(...urls) {
    // 1. Get the elements
    const emailInput = document.getElementById("username"); // or "email"
    const passwordInput = document.getElementById("password");

    // 2. STOPS the user if fields are empty
    if (!emailInput.value.trim() || !passwordInput.value.trim()) {
        alert("Please enter both email and password.");
        return; // This stops the function from going to the home page
    }

    const payload = {
        email: emailInput.value,
        password: passwordInput.value,
    };

    console.log("Attempting login...");

    try {
        // 3. Send data to your backend
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Login successful!");
            // 4. ONLY NOW we move to the next page
            if (urls.length > 0) {
                window.location.href = urls[0];
            }
        } else {
            // 5. If server says No, stay on the login page and show error
            alert("Error: " + (result.message || "Invalid credentials"));
        }
    } catch (error) {
        console.error("Connection error:", error);
        alert("Server is down. Please try again later.");
    }
}