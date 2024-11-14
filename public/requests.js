const requestsList = document.getElementById('requests-list');

// Get userName from URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const userName = urlParams.get('userName');

// Fetch requests from the backend (replace with your actual API endpoint)
fetch(`/api/get-requests?userName=${userName}`)
  .then(response => response.json())
  .then(data => {
    // Display the requests
    requestsList.innerHTML = '';

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

    // ... (add event listeners for Accept/Reject buttons)
  })
  // ... (error handling)

  