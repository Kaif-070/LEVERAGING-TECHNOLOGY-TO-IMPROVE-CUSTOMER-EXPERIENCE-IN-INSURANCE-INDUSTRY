document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const policyId = urlParams.get('id');

  if (!policyId) {
    document.getElementById('policy-content').innerText = 'Policy ID is missing.';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3006/policy/${policyId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch policy details');
    }

    const policy = await response.json();

    // Format policy details
    const policyHTML = `
      <h2>Policy Overview</h2>
      <p><strong>ID:</strong> ${policy.id}</p>
      <p><strong>Holder Name:</strong> ${policy.holder_name}</p>
      <p><strong>Details:</strong> ${policy.details}</p>
      <p><strong>Created At:</strong> ${new Date(policy.created_at).toLocaleString()}</p>

      <h2>Transaction History</h2>
      ${policy.transaction_history.map(transaction => `
        <p>
          <strong>ID:</strong> ${transaction.transaction_id}<br>
          <strong>Amount:</strong> ${transaction.amount}<br>
          <strong>Date:</strong> ${new Date(transaction.date).toLocaleString()}<br>
          <strong>Type:</strong> ${transaction.type}
        </p>
      `).join('') || '<p>No transactions found.</p>'}

      <h2>Claims</h2>
      ${policy.claims.map(claim => `
        <p>
          <strong>ID:</strong> ${claim.claim_id}<br>
          <strong>Amount:</strong> ${claim.amount}<br>
          <strong>Status:</strong> ${claim.status}<br>
          <strong>Date:</strong> ${new Date(claim.date).toLocaleString()}
        </p>
      `).join('') || '<p>No claims found.</p>'}
    `;

    document.getElementById('policy-content').innerHTML = policyHTML;
  } catch (error) {
    console.error('Error fetching policy details:', error);
    document.getElementById('policy-content').innerText =
      'An error occurred while fetching policy details.';
  }
});
