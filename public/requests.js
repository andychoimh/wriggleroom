const requestsList = document.getElementById('requests-list');

// Get userName from URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const userName = urlParams.get('userName');
const requestId = urlParams.get('requestId'); 
console.log(userName, requestId)

// Fetch requests from the backend
fetch(`/api/get-requests?userName=${userName}&requestId=${requestId}`) // Include requestId in the URL
  .then(response => response.json())
  .then(data => {
    // Display the requests
    requestsList.innerHTML = ''; // Clear previous requests

    data.forEach(booking => {
      const requestItem = document.createElement('div');
      requestItem.innerHTML = `
        <h3>Request for ${booking.meeting_room.room_name}</h3> 
        <p>Date: ${new Date(booking.booking_start).toDateString()}</p> 
        <p>Time: ${new Date(booking.booking_start).toLocaleTimeString('en-SG', { timeZone: 'UTC', hour12: false })} - ${new Date(booking.booking_end).toLocaleTimeString('en-SG', { timeZone: 'UTC', hour12: false })}</p> 
        <button class="accept-request btn btn-success" data-request-id="${requestId}">Accept</button> 
        <button class="reject-request btn btn-danger" data-request-id="${requestId}">Reject</button> 
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
          // Fetch the requestorId from the backend
          const requestorResponse = await fetch(`/api/get-requestor-id?requestId=${requestId}`); // Renamed response to requestorResponse
          const data = await requestorResponse.json();
          const requestorId = data.requestorId;

          const response = await fetch('/api/respond-to-request', {
            method: 'POST', 
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requestId, decision: 'accept', userName, requestorId }),
          });

          if (response.ok) {
            // Request accepted successfully
            alert('You have accepted this request! You have been awarded an Appreciate You point! Visit wriggleroom.work/leaderboard.html');
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
          // Fetch the requestorId from the backend
            const requestorResponse = await fetch(`/api/get-requestor-id?requestId=${requestId}`); // Renamed response to requestorResponse
            const data = await requestorResponse.json();
            const requestorId = data.requestorId;
         
          const response = await fetch('/api/respond-to-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requestId, decision: 'accept', userName, requestorId }),
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