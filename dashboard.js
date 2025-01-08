const API_BASE_URL = 'http://localhost:3006';

// Utility: Format date to a readable string
function formatDate(dateString) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ?
        'Invalid Date' :
        date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
}

// Utility: Fetch data with error handling
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

function toggleMenu() {
    const menuOptions = document.getElementById('menu-options');
    menuOptions.classList.toggle('show');
}


// Fetch and display policy details
async function fetchPolicyDetails() {
    const policyId = document.getElementById('policy-id').value.trim();

    if (!policyId) {
        alert('Please enter a valid Policy ID.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/policy/${policyId}`);

        if (!response.ok) {
            // If response status is 404, display a custom message
            if (response.status === 404) {
                throw new Error('Policy ID not found');
            }
            // Handle other status codes
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const { policy } = data;

        document.getElementById('policy-details').innerHTML = `
      <h3>Policy Details</h3>
      <p><strong>Policy ID:</strong> ${policy.policy_id}</p>
      <p><strong>Policy Type:</strong> ${policy.policy_type}</p>
      <p><strong>Start Date:</strong> ${formatDate(policy.start_date)}</p>
      <p><strong>End Date:</strong> ${formatDate(policy.end_date)}</p>
      <p><strong>Premium Amount:</strong> ${policy.premium_amount}</p>
      <p><strong>Coverage Details:</strong> ${policy.coverage_details}</p>
      <p><strong>Status:</strong> ${policy.policy_status}</p>
      <p><strong>Company Name:</strong> ${policy.agent_name}</p>
    `;
    } catch (error) {
        document.getElementById('policy-details').innerText = `Error: ${error.message}`;
    }
}


// Fetch and display transaction and claim history
async function fetchTransactionHistory() {
    const policyId = document.getElementById('policy-id').value.trim();

    if (!policyId) {
        alert('Please enter a valid Policy ID.');
        return;
    }

    try {
        const data = await fetchData(`${API_BASE_URL}/policy/${policyId}`);
        const transactionsHTML = data.payments
            .map(
                (tx) => `
          <li>
            <strong>Transaction ID:</strong> ${tx.id}<br>
            <strong>Date:</strong> ${(formatDate(tx.payment_date))}<br>
            <strong>Amount:</strong> ${tx.amount}<br>
            <strong>Payment Method:</strong> ${tx.payment_method }
          </li>`
            )
            .join('');

        const claimsHTML = data.claims
            .map(
                (claim) => `
          <li>
            <strong>Claim ID:</strong> ${claim.claim_id}<br>
            <strong>Date:</strong> ${(formatDate(claim.claim_date))}<br>
            <strong>Type:</strong> ${claim.claim_type}<br>
            <strong>Description:</strong> ${claim.claim_description}<br>
            <strong>Processed Date:</strong> ${(formatDate(claim.date_processed))}<br>
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
      <ul>${transactionsHTML || '<li>No transactions available</li>'}</ul>
      <h3>Claims</h3>
      <ul>${claimsHTML || '<li>No claims available</li>'}</ul>
    `;
    } catch (error) {
        document.getElementById('transaction-details').innerText = `Error: ${error.message}`;
    }
}

// Generate and display QR code for a policy
async function generateQRCode() {
    const policyId = document.getElementById('policy-qr-id').value.trim();

    if (!policyId) {
        document.getElementById('qr-code').innerText = 'Please enter a valid Policy ID.';
        return;
    }

    try {
        const data = await fetchData(`${API_BASE_URL}/generate-qr/${policyId}`);
        document.getElementById('qr-code').innerHTML = `
      <h3>QR Code for Policy</h3>
      <img src="${data.qrCodeImage}" alt="QR Code" style="border: 1px solid #ddd; padding: 10px;">
      <p><strong>URL:</strong> <a href="${data.qrCodeUrl}" target="_blank">${data.qrCodeUrl}</a></p>
    `;
    } catch (error) {
        document.getElementById('qr-code').innerText =
            'An error occurred while generating the QR code. Please try again.';
    }
}

// Toggle Text-to-Speech
let isSpeaking = false;
let currentSpeech = null;

function toggleSpeech(text) {
    if (!('speechSynthesis' in window)) {
        alert("Sorry, your browser does not support text-to-speech.");
        return;
    }

    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        currentSpeech = null;
    } else {
        currentSpeech = new SpeechSynthesisUtterance(text);
        currentSpeech.lang = 'en-US';
        currentSpeech.pitch = 1;
        currentSpeech.rate = 1;
        currentSpeech.volume = 1;

        window.speechSynthesis.speak(currentSpeech);

        isSpeaking = true;
        currentSpeech.onend = () => {
            isSpeaking = false;
        };
    }
}

// Attach Event Listeners
document.getElementById('tts-policy-button').addEventListener('click', () => {
    const policyDetails = document.getElementById('policy-details').innerText;
    if (policyDetails.trim()) toggleSpeech(policyDetails);
    else alert('No policy details found to read!');
});

document.getElementById('tts-transaction-button').addEventListener('click', () => {
    const transactionDetails = document.getElementById('transaction-details').innerText;
    if (transactionDetails.trim()) toggleSpeech(transactionDetails);
    else alert('No transaction details found to read!');
});