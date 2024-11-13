const meetingRequestForm = document.getElementById('meeting-request-form');

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

  } catch (error) {
    console.error('Error fetching rooms:', error);
    // TODO: Display an error message in the UI
  }
});