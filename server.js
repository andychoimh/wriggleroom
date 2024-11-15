// Needed for dotenv
require("dotenv").config();

// Needed for Express
var express = require('express');
var app = express()

// Define port
const port = process.env.PORT || 8000;

// Needed for Prisma to connect to database
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

// Needed for Twilio
const twilio = require('twilio');

// Retrieve Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilioClient = twilio(accountSid, authToken);

app.use(express.json()); // To parse JSON request bodies
app.use(express.static('public')); // To serve static files (HTML, CSS, JS)

// Basic route to test the server and Prisma connection
app.get('/', async (req, res) => {
  try {
    // Example Prisma query (replace with your actual logic)
    const users = await prisma.users.findMany();
    res.send(`Hello from the meeting room booking app! Here are some users: ${JSON.stringify(users)}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data from the database.');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

app.post('/api/get-user-id', async (req, res) => {
  const { userName } = req.body;

  try {
    let user = await prisma.users.findUnique({
      where: { user_name: userName },
    });

    if (!user) {
      // User doesn't exist, create a new user
      user = await prisma.users.create({
        data: { user_name: userName },
      });
    }

    res.json({ userId: user.user_id });
  } catch (error) {
    console.error('Error fetching or creating user:', error);
    res.status(500).send('Error fetching or creating user.');
  }
});

app.post('/api/find-rooms', async (req, res) => {
  const { startDate, startTime, endTime, attendees } = req.body;

  try {
    // 1. Convert startDate and times to Date objects
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);

    // 2. Find rooms with sufficient capacity
    const availableRooms = await prisma.meeting_rooms.findMany({
      where: {
        capacity: { 
          gte: parseInt(attendees),
         },
      },
    });

    // 3. Check for overlapping bookings
    const roomsWithBookings = await prisma.bookings.findMany({
      where: {
        room_id: { in: availableRooms.map(room => room.room_id) }, // Check only rooms with enough capacity
        NOT: {
          OR: [
            { booking_start: { gte: endDateTime } },
            { booking_end: { lte: startDateTime } },
          ],
        },
      },
      include: { // Use only include
        meeting_room: {
          select: { // Select the required fields from meeting_room
            room_id: true,
            room_name: true,
            location: true,
          }
        }
      }
    });

    // 4. Filter out rooms with overlapping bookings
    const trulyAvailableRooms = availableRooms.filter(room => {
      return !roomsWithBookings.some(booking => booking.meeting_room.room_id === room.room_id);
    });

    // 5. Send the response
    res.json({
      availableRooms: trulyAvailableRooms,
      bookedRooms: roomsWithBookings.map(booking => ({
        ...booking,
        booking_start: new Date(booking.booking_start), // Convert to Date object
        booking_end: new Date(booking.booking_end) // Convert to Date object
      }))
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching rooms.');
  }
});

app.post('/api/broadcast-request', async (req, res) => {
  const { startDate, startTime, endTime, attendees } = req.body;

  try {
    // 1. Convert startDate and times to Date objects
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);

    // 2. Find potential Booking Owners
    const potentialOwners = await prisma.meeting_rooms.findMany({
      where: {
        NOT: {
          OR: [
            { booking_start: { gte: endDateTime } },
            { booking_end: { lte: startDateTime } },
          ],
        },
      },
      select: { booked_by: true, room_name: true }, // Only select the 'booked_by' field
    });

    // Store the broadcast request
    const createdRequest = await prisma.broadcast_requests.create({
      data: {
        requestor_id: requestorId,
        room_name: potentialOwners[0].room_name, // Assuming all potential owners have the same room name
        start_time: startDateTime,
        end_time: endDateTime,
        attendees: attendees,
      },
    });

    const requestId = createdRequest.request_id; // Get the generated request_id

    // 3. Send SMS notifications to Booking Owners
  // We'll fetch the phone number from the 'users' table
  for (const owner of potentialOwners) { // Use a for...of loop for async operations
    try {
      const user = await prisma.users.findUnique({ 
        where: { user_name: owner.booked_by },
        select: { phone_number: true } 
      });

      if (user && user.phone_number) {
        const requestsUrl = `https://wriggleroom.work/requests.html?userName=<span class="math-inline">\{user\.user\_name\}&requestId\=</span>{requestId}`; // Include requestId in the URL
        const message = await twilioClient.messages.create({
          body: `Someone is requesting request for ${owner.room_name} on ${startDate}, ${startTime} - ${endTime}. Do view request, click here ${requestsUrl}`,
          from: '+14146221997',
          to: user.phone_number,
        });
        console.log(message.sid);
      } else {
        console.warn(`Unable to send SMS to ${owner.booked_by}: Phone number not found.`);
      }

    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  }

    // 4. Store request details (simplified)


    res.send('Request broadcasted successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error broadcasting request.');
  }
});

app.post('/api/respond-to-request', async (req, res) => {
  const { requestId, decision, userName } = req.body;

  try {
    if (decision === 'accept') {
      // 1. Update meeting room booking
      // (This is a simplified example, assuming you have the booking details)
      await prisma.meeting_rooms.update({
        where: { room_id: requestId }, // Assuming requestId corresponds to room_id
        data: { booked_by: requestorId },
      });

      // 2. Update user points
      await prisma.users.update({
        where: { user_id: bookingOwnerId },
        data: { appreciate_you_points: { increment: 1 } },
      });
      await prisma.users.update({
        where: { user_id: requestorId },
        data: { activity_points: { increment: 1 } },
      });

      // 3. Send confirmation SMS to requestor
      const requestor = await prisma.users.findUnique({
        where: { user_id: requestorId },
        select: { phone_number: true },
      });

      if (requestor && requestor.phone_number) {
        const message = await twilioClient.messages.create({
          body: `Your meeting request for ${startDateTime} - ${endDateTime} has been accepted!`,
          from: '+14146221997',
          to: requestor.phone_number,
        });
        console.log(message.sid);
      } else {
        console.warn(`Unable to send SMS to ${requestorId}: Phone number not found.`);
      }
    } else {
      // ... (send rejection notification logic)
    }

    res.send('Response processed successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error responding to request.');
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    //const now = new Date();
    //const threeMonthsAgo = new Date();
    //threeMonthsAgo.setMonth(now.getMonth() - 3);

    // 1. Fetch Most Helpful Users (Appreciate You! points)
    const mostHelpfulUsers = await prisma.users.findMany({
      orderBy: { appreciate_you_points: 'desc' },
      where: {
        // Add any necessary filtering based on time range (last 3 months)
      },
      take: 10, // Take only the top 10 users
    });

    // 2. Fetch Top Users (Activity Points)
    const topUsers = await prisma.users.findMany({
      orderBy: { activity_points: 'desc' },
      where: {
        // Add any necessary filtering based on time range (last 3 months)
      },
      take: 10, // Take only the top 10 users
    });

    res.json({ mostHelpfulUsers, topUsers });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching leaderboard data.');
  }
});

app.get('/api/get-requests', async (req, res) => {
  const userName = req.query.userName;

  try {
    // Fetch the Booking Owner's bookings
    const bookings = await prisma.meeting_rooms.findMany({
      where: { booked_by: userName },
    });

    const requests = [];
    for (const booking of bookings) {
      // Fetch broadcast requests matching the booking
      const matchingRequests = await prisma.broadcast_requests.findMany({
        where: {
          room_name: booking.room_name,
          start_time: { lte: booking.booking_end },
          end_time: { gte: booking.booking_start },
        },
      });
      requests.push(...matchingRequests);
    }

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).send('Error fetching requests.');
  }
});

app.post('/api/respond-to-request', async (req, res) => {
  const { requestId, decision, userName } = req.body; // Include userName

  try {
    // 1. Fetch the request and related data
    const request = await prisma.broadcast_requests.findUnique({
      where: { request_id: parseInt(requestId) }, // Assuming requestId is an integer
      include: {
        requestor: { select: { user_name: true } }, // Include requestor's user_name
      },
    });

    if (!request) {
      return res.status(404).send('Request not found.');
    }

    // 2. Update the meeting room booking
    if (decision === 'accept') {
      // Update the meeting room booking in meeting_rooms table
      // You'll need to implement the logic to find the corresponding booking and update it
      // ...

      // Update points for the Booking Owner and Requestor
      await prisma.users.update({
        where: { user_name: userName },
        data: { appreciate_you_points: { increment: 1 } },
      });
      await prisma.users.update({
        where: { user_name: request.requestor.user_name },
        data: { activity_points: { increment: 1 } },
      });

      // Send confirmation SMS to the Requestor
      // ...
    }

    // 3. Delete the broadcast request
    await prisma.broadcast_requests.delete({
      where: { request_id: parseInt(requestId) },
    });

    res.send('Response processed successfully.');
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).send('Error responding to request.');
  }
});