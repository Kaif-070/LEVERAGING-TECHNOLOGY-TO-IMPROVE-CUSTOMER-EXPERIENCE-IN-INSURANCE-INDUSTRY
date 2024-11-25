document.addEventListener('DOMContentLoaded', () => {
    // Get the login form
    const loginForm = document.getElementById('loginForm');
  
    // Ensure the form exists before adding event listeners
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the default form submission
  
        // Get user input values
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
  
        try {
          // Send login request to the server
          const response = await fetch('http://localhost:3006/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
  
          const data = await response.json();
  
          if (response.ok && data.token) {
            // Login successful
            alert(data.message);
  
            // Save token to local storage
            localStorage.setItem('token', data.token);
  
            // Redirect to the dashboard page
            location.replace('dashboard.html');
          } else {
            // Display error message from the server
            alert(data.error || 'Login failed. Please try again.');
          }
        } catch (error) {
          // Handle any network or unexpected errors
          console.error('Error during login:', error);
          alert('An error occurred while logging in. Please try again later.');
        }
      });
    } else {
      console.error('Login form not found on the page.');
    }
  });
  