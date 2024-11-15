const requestsList = document.getElementById('requests-list');

// Get userName from URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const userName = urlParams.get('userName');

// Fetch requests from the backend
fetch(`/api/get-requests?userName=${userName}`)
  .then(response => response.json())
  .then(data => {
    // Display the requests
    requestsList.innerHTML = ''; // Clear previous requests

    data.forEach(request => {
      const requestItem = document.createElement('div');
      requestItem.innerHTML = `
        <h3>Request for ${request.room_name}</h3>
        <p>Date: ${new Date(request.start_time).toDateString()}</p>
        <p>Time: ${new Date(request.start_time).toLocaleTimeString()} - ${new Date(request.end_time).toLocaleTimeString()}</p>
        <button class="accept-request btn btn-success" data-request-id="${request.request_id}">Accept</button>
        <button class="reject-request btn btn-danger" data-request-id="${request.request_id}">Reject</button>
      `;
      requestsList.appendChild(requestItem);
    });

    // Add event listeners for Accept/Reject buttons
    const acceptButtons = document.querySelectorAll('.accept-request');
    const rejectButtons = document.querySelectorAll('.reject-request');

    acceptButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const requestId = button.dataset.requestId;

        try {
          const response = await fetch('/api/respond-to-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requestId, decision: 'accept', userName }),
          });

          if (response.ok) {
            // Request accepted successfully
            alert('Request accepted!');
            // TODO: Update the UI to reflect the accepted request
          } else {
            // Handle error
            console.error('Error accepting request:', response.status);
            alert('There was an error accepting the request.');
          }
        } catch (error) {
          console.error('Error accepting request:', error);
          alert('There was an error accepting the request.');
        }
      });
    });

    rejectButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const requestId = button.dataset.requestId;

        try {
          const response = await fetch('/api/respond-to-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requestId, decision: 'reject', userName }),
          });

          if (response.ok) {
            // Request rejected successfully
            alert('Request rejected!');
            // TODO: Update the UI to reflect the rejected request
          } else {
            // Handle error
            console.error('Error rejecting request:', response.status);
            alert('There was an error rejecting the request.');
          }
        } catch (error) {
          console.error('Error rejecting request:', error);
          alert('There was an error rejecting the request.');
        }
      });
    });
  })
  .catch(error => {
    console.error('Error fetching requests:', error);
    // TODO: Display an error message in the UI
  });