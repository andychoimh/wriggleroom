const meetingRequestForm = document.getElementById('meeting-request-form');
const roomsContainer = document.getElementById('rooms-container'); // Get the rooms container element

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
  
  // Show the meeting request form after name submission
  meetingRequestForm.style.display = 'block'; 
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
  const availableRoomsHeading = document.querySelector('#rooms-container h2:first-of-type'); // Select the "Available Rooms" heading
  availableRoomsList.innerHTML = '';
  if (data.availableRooms.length > 0) {
    // Add header row
    const headerRow = document.createElement('li');
    headerRow.innerHTML = `
      <strong>Room Name</strong>
      <strong>Location</strong>
      <strong>Capacity</strong>
    `;
    availableRoomsList.appendChild(headerRow);

    data.availableRooms.forEach(room => {
      const listItem = document.createElement('li');
      listItem.classList.add('flex-container'); // Add flex-container class to each list item
      listItem.innerHTML = `
        <span>${room.room_name}</span> 
        <span>${room.location}</span> 
        <span>${room.capacity}</span> 
      `;
      availableRoomsList.appendChild(listItem);
    });
  } else {
    availableRoomsHeading.style.display = 'none'; // Hide the heading if no available rooms
  }

  // Display booked rooms
  const bookedRoomsList = document.getElementById('booked-rooms');
  const bookedRoomsHeading = document.querySelector('#rooms-container h2:last-of-type'); // Select the "Booked Rooms" heading
  bookedRoomsList.innerHTML = '';
  if (data.bookedRooms.length > 0) {
    // Add header row
    const headerRow = document.createElement('li');
    headerRow.innerHTML = `
      <strong>Room Name</strong>
      <strong>Location</strong>
      <strong>Booked By</strong>
      <strong>Booking Start</strong>
      <strong>Booking End</strong>
    `;
    bookedRoomsList.appendChild(headerRow);

    data.bookedRooms.forEach(booking => { // Iterate over data.bookedRooms, not data.meeting_rooms
      const listItem = document.createElement('li');
      listItem.classList.add('flex-container'); // Add flex-container class to each list item
      
      const bookingStart = new Date(booking.booking_start); // Create a new Date object for start time
      const bookingEnd = new Date(booking.booking_end); // Create a new Date object for end time

      listItem.innerHTML = `
        <span>${booking.meeting_room.room_name}</span> 
        <span>${booking.meeting_room.location}</span> 
        <span>${booking.booked_by || ''}</span> 
        <span>${new Date(booking.booking_start).toLocaleString('en-SG', { timeZone: 'UTC', hour12: false })}</span> 
        <span>${new Date(booking.booking_end).toLocaleString('en-SG', { timeZone: 'UTC', hour12: false })}</span> 
        `;
      bookedRoomsList.appendChild(listItem);
    });
  } else {
    bookedRoomsHeading.style.display = 'none'; // Hide the heading if no booked rooms
  }
    
  if (data.availableRooms.length === 0) {
    // No available rooms, show the broadcast request option
    const broadcastRequestOption = document.createElement('div');
    broadcastRequestOption.innerHTML = `
      <p>No rooms available for your request.</p>
      <button id="broadcast-request-button" class="btn btn-primary">Broadcast Request</button>
    `;
    roomsContainer.appendChild(broadcastRequestOption);
  
    // Add event listener to the broadcast request button
    const broadcastRequestButton = document.getElementById('broadcast-request-button');
    broadcastRequestButton.addEventListener('click', async () => {
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
    });
  }
      console.log('Broadcasting request...');
  }

   catch (error) {
    console.error('Error fetching rooms:', error);
    // TODO: Display an error message in the UI
  }
});