const API_BASE_URL = 'http://localhost:3006';

// Function to fetch and display policy details
async function fetchPolicyDetails() {
  const policyId = document.getElementById('policy-id').value.trim();

  if (!policyId) {
    alert('Please enter a valid Policy ID.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/policy/${policyId}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    const { policy } = data;

    // Map to database schema fields
    document.getElementById('policy-details').innerHTML = `
      <h3>Policy Details</h3>
      <p><strong>Policy ID:</strong> ${policy.policy_id}</p>
      <p><strong>Policy Type:</strong> ${policy.policy_type}</p>
      <p><strong>Premium Amount:</strong> ${policy.premium_amount}</p>
      <p><strong>Coverage Details:</strong> ${policy.coverage_details}</p>
      <p><strong>Status:</strong> ${policy.policy_status}</p>
      <p><strong>Agent Name:</strong> ${policy.agent_name}</p>
      <p><strong>Contact Email:</strong> ${policy.contact_email}</p>
      <p><strong>Contact Phone:</strong> ${policy.contact_phone}</p>
    `;
  } catch (error) {
    document.getElementById('policy-details').innerText = `Error: ${error.message}`;
  }
}

// Function to fetch transaction and claim history
async function fetchTransactionHistory() {
  const policyId = document.getElementById('policy-id').value.trim();

  if (!policyId) {
    alert('Please enter a valid Policy ID.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/policy/${policyId}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    // Map transactions to database schema
    const transactionsHTML = data.transactions
      .map(
        (tx) => `
          <li>
            <strong>Date:</strong> ${tx.transaction_date}<br>
            <strong>Amount:</strong> ${tx.amount}<br>
            <strong>Payment Method:</strong> ${tx.payment_method}<br>
            <strong>Reference:</strong> ${tx.reference_number}<br>
            <strong>Type:</strong> ${tx.transaction_type}<br>
            <strong>Remarks:</strong> ${tx.remarks}
          </li>`
      )
      .join('');

    // Map claims to database schema
    const claimsHTML = data.claims
      .map(
        (claim) => `
          <li>
            <strong>Claim Date:</strong> ${claim.claim_date}<br>
            <strong>Type:</strong> ${claim.claim_type}<br>
            <strong>Description:</strong> ${claim.claim_description}<br>
            <strong>Processed Date:</strong> ${claim.date_processed}<br>
            <strong>Handler:</strong> ${claim.handler_name}<br>
            <strong>Reimbursement:</strong> ${claim.reimbursement_amount}<br>
            <strong>Status:</strong> ${claim.status}<br>
            <strong>Reason:</strong> ${claim.reason_for_status}<br>
            <strong>Remarks:</strong> ${claim.remarks}
          </li>`
      )
      .join('');

    document.getElementById('transaction-details').innerHTML = `
      <h3>Transactions</h3>
      <ul>${transactionsHTML}</ul>
      <h3>Claims</h3>
      <ul>${claimsHTML}</ul>
    `;
  } catch (error) {
    document.getElementById('transaction-details').innerText = `Error: ${error.message}`;
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
