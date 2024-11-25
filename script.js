// Function to handle opening and closing of modals
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
  }
  
  function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }
  
  // Handle contact form submission
  document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting normally
  
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
  
    // Validate the form data
    if (!name || !email || !message) {
      alert('Please fill in all fields.');
      return;
    }
  
    // Create a JSON object with the form data
    const formData = {
      name: name,
      email: email,
      message: message
    };
  
    // Send the data to the backend
    fetch('http://localhost:3006/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message || 'Message sent successfully');
      closeModal('contact-us-modal');
    })
    .catch(error => {
      alert('An error occurred. Please try again later.');
      console.error('Error:', error);
    });
  });
  
  // Handle feedback form submission
  document.getElementById('feedback-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting normally
  
    const feedback = document.getElementById('feedback').value;
    const rating = document.querySelector('input[name="rating"]:checked') ? document.querySelector('input[name="rating"]:checked').value : null;
  
    // Validate the form data
    if (!feedback || !rating) {
      alert('Please provide feedback and a rating.');
      return;
    }
  
    // Create a JSON object with the form data
    const formData = {
      feedback: feedback,
      rating: rating
    };
  
    // Send the data to the backend
    fetch('http://localhost:3006/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message || 'Feedback submitted successfully');
      closeModal('feedback-modal');
    })
    .catch(error => {
      alert('An error occurred. Please try again later.');
      console.error('Error:', error);
    });
  });
  
  // Function to fetch policy details
  function fetchPolicyDetails(policyId) {
    fetch(`http://localhost:3006/policy/${policyId}`)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
  
        const policy = data.policy;
        const transactions = data.transactions;
        const claims = data.claims;
  
        // Display Policy Details
        const policyDetails = `
          <h3>Policy Details</h3>
          <p><strong>Policy ID:</strong> ${policy.id}</p>
          <p><strong>Customer Name:</strong> ${policy.customer_name}</p>
          <p><strong>Policy Type:</strong> ${policy.policy_type}</p>
          <p><strong>Start Date:</strong> ${policy.start_date}</p>
          <p><strong>End Date:</strong> ${policy.end_date}</p>
          <p><strong>Status:</strong> ${policy.status}</p>
        `;
        document.getElementById('policy-details').innerHTML = policyDetails;
  
        // Display Transactions
        const transactionDetails = transactions.map(transaction => `
          <p><strong>Transaction Date:</strong> ${transaction.transaction_date}</p>
          <p><strong>Amount:</strong> ${transaction.amount}</p>
          <p><strong>Transaction Type:</strong> ${transaction.transaction_type}</p>
          <hr>
        `).join('');
        document.getElementById('transaction-history').innerHTML = transactionDetails;
  
        // Display Claims
        const claimDetails = claims.map(claim => `
          <p><strong>Claim Date:</strong> ${claim.claim_date}</p>
          <p><strong>Claim Amount:</strong> ${claim.claim_amount}</p>
          <p><strong>Claim Status:</strong> ${claim.claim_status}</p>
          <hr>
        `).join('');
        document.getElementById('claim-history').innerHTML = claimDetails;
      })
      .catch(error => {
        alert('An error occurred while fetching policy details.');
        console.error('Error:', error);
      });
  }
  
  // Function to generate and display QR Code for Policy
  function generateQRCode(policyId) {
    fetch(`http://localhost:3006/generate-qr/${policyId}`)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
  
        // Display the QR Code Image
        const qrCodeImage = `<img src="${data.qrCodeImage}" alt="QR Code">`;
        document.getElementById('qr-code').innerHTML = qrCodeImage;
      })
      .catch(error => {
        alert('An error occurred while generating the QR code.');
        console.error('Error:', error);
      });
  }
  