// Function to fetch and display policy details
async function fetchPolicyDetails() {
  const policyId = document.getElementById('policy-id').value.trim();

  if (!policyId) {
    document.getElementById('policy-details').innerText = 'Please enter a valid Policy ID.';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3006/policy/${policyId}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    const { policy } = data;

    document.getElementById('policy-details').innerHTML = `
      <h3>Policy Details</h3>
      <p><strong>Policy ID:</strong> ${policy.id}</p>
      <p><strong>Holder Name:</strong> ${policy.holder_name}</p>
      <p><strong>Details:</strong> ${policy.details}</p>
    `;
  } catch (error) {
    console.error('Error fetching policy details:', error);
    document.getElementById('policy-details').innerText =
      'An error occurred while fetching policy details. Please try again.';
  }
}

// Function to fetch and display transaction and claim history
async function fetchTransactionHistory() {
  const policyId = document.getElementById('policy-id').value.trim();

  if (!policyId) {
    document.getElementById('transaction-details').innerText = 'Please enter a valid Policy ID to view history.';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3006/policy/${policyId}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    const { transactions, claims } = data;

    // Format Date Helper
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Handle Transactions
    let transactionsHTML = '<p>No transactions found.</p>';
    if (transactions.length > 0) {
      transactionsHTML = `
        <h4>Transaction History:</h4>
        <ul>
          ${transactions.map(
            (transaction) =>
              `<li>
                <strong>Date:</strong> ${transaction.transaction_date}<br>
                <strong>Details:</strong> ${transaction.details}
              </li>`
          ).join('')}
        </ul>`;
    }

    // Handle Claims
    let claimsHTML = '<p>No claims found.</p>';
    if (claims.length > 0) {
      claimsHTML = `
        <h4>Claim History:</h4>
        <ul>
          ${claims.map(
            (claim) =>
              `<li>
                <strong>Amount:</strong> ${claim.amount}<br>
                <strong>Date:</strong> ${formatDate(claim.date)}<br>
                <strong>Status:</strong> ${claim.status}
              </li>`
          ).join('')}
        </ul>`;
    }

    document.getElementById('transaction-details').innerHTML = `
      ${transactionsHTML}
      ${claimsHTML}
    `;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    document.getElementById('transaction-details').innerText =
      'An error occurred while fetching transaction and claim history. Please try again.';
  }
}

// Function to generate and display QR code for a policy
async function generateQRCode() {
  const policyId = document.getElementById('policy-qr-id').value.trim();

  if (!policyId) {
    document.getElementById('qr-code').innerText = 'Please enter a valid Policy ID.';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3006/generate-qr/${policyId}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.qrCodeImage) {
      throw new Error('QR Code image not returned from server.');
    }

    document.getElementById('qr-code').innerHTML = `
      <h3>QR Code for Policy</h3>
      <img src="${data.qrCodeImage}" alt="QR Code" style="border: 1px solid #ddd; padding: 10px;">
      <p><strong>URL:</strong> <a href="${data.qrCodeUrl}" target="_blank">${data.qrCodeUrl}</a></p>
    `;
  } catch (error) {
    console.error('Error generating QR code:', error);
    document.getElementById('qr-code').innerText =
      'An error occurred while generating the QR code. Please try again.';
  }
}
