const meetingRequestForm = document.getElementById('meeting-request-form');

const userNameInput = document.getElementById('user-name');
const submitNameButton = document.getElementById('submit-name');

submitNameButton.addEventListener('click', async () => {
  const userName = userNameInput.value;

  try {
    const response = await fetch('/api/get-user-id', { // New API endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userName }),
    });

    const data = await response.json();
    const requestorId = data.userId;

    // Store requestorId for later use (e.g., in sessionStorage)
    sessionStorage.setItem('requestorId', requestorId);

    // Optionally hide the name input and show the meeting request form
    //userNameInput.style.display = 'none';
    //submitNameButton.style.display = 'none';
    //meetingRequestForm.style.display = 'block'; // Assuming it was hidden initially

  } catch (error) {
    console.error('Error fetching user ID:', error);
    // Handle error (e.g., display an error message)
  }
});

meetingRequestForm.addEventListener('submit', async (event) => {
  event.preventDefault(); // Prevent default form submission

  const formData = new FormData(meetingRequestForm);
  const requestData = {};
  formData.forEach((value, key) => {
    requestData[key] = value;
  });

  try {
    const response = await fetch('/api/find-rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();
    const roomsContainer = document.getElementById('rooms-container');
    roomsContainer.style.display = 'block'; // Or 'flex', or whatever display you prefer
    console.log(data);   
 // Log the response from the API


    // Display available rooms
  const availableRoomsList = document.getElementById('available-rooms');
  availableRoomsList.innerHTML = ''; // Clear previous results
  data.availableRooms.forEach(room => {
    const listItem = document.createElement('li');
    listItem.textContent = room.room_name;
    availableRoomsList.appendChild(listItem);
  });

  // Display booked rooms
  const bookedRoomsList = document.getElementById('booked-rooms');
  bookedRoomsList.innerHTML = ''; // Clear previous results
  data.bookedRooms.forEach(room => {
    const listItem = document.createElement('li');
    listItem.textContent = room.room_name;
    bookedRoomsList.appendChild(listItem);
  });

  if (data.availableRooms.length === 0) {
    const broadcast = confirm('None of the suitable rooms are available. Would you like to broadcast a request?');
    if (broadcast) {
      try {
        // Gather request data (including requestorId from sessionStorage)
        const requestorId = sessionStorage.getItem('requestorId');
        const requestData = {
          startDate: document.getElementById('start-date').value,
          startTime: document.getElementById('start-time').value,
          endTime: document.getElementById('end-time').value,
          attendees: document.getElementById('attendees').value,
          requestorId: requestorId, // Include requestorId
        };

        const response = await fetch('/api/broadcast-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (response.ok) {
          // Request broadcasted successfully
          alert('Your request has been broadcasted!');
        } else {
          // Handle error
          console.error('Error broadcasting request:', response.status);
          alert('There was an error broadcasting your request.');
        }
      } catch (error) {
        console.error('Error broadcasting request:', error);
        alert('There was an error broadcasting your request.');
      }
    }}
  
      console.log('Broadcasting request...');
    }
  

   catch (error) {
    console.error('Error fetching rooms:', error);
    // TODO: Display an error message in the UI
  }
});