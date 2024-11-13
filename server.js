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

app.post('/api/find-rooms', async (req, res) => {
  const { startDate, startTime, endTime, attendees } = req.body;

  try {
    // 1. Convert startDate and times to Date objects
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);

    // 2. Fetch available rooms
    const availableRooms = await prisma.meeting_rooms.findMany({
      where: {
        OR: [
          { booking_start: { gte: endDateTime } }, // Booking starts after requested time
          { booking_end: { lte: startDateTime } },   // Booking ends before requested time
        ],
      },
    });

    // 3. Fetch potentially overlapping booked rooms
    const bookedRooms = await prisma.meeting_rooms.findMany({
      where: {
        NOT: {
          OR: [
            { booking_start: { gte: endDateTime } },
            { booking_end: { lte: startDateTime } },
          ],
        },
      },
    });

    // 4. Send the response
    res.json({ availableRooms, bookedRooms });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching rooms.');
  }
});

app.post('/api/broadcast-request', async (req, res) => {
  const { startDate, startTime, endTime, attendees, requestor } = req.body;

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
      select: { booked_by: true }, // Only select the 'booked_by' field
    });

    // 3. Send SMS notifications to Booking Owners
  // We'll fetch the phone number from the 'users' table
  for (const owner of potentialOwners) { // Use a for...of loop for async operations
    try {
      const user = await prisma.users.findUnique({ 
        where: { user_name: owner.booked_by },
        select: { phone_number: true } 
      });

      if (user && user.phone_number) {
        const message = await twilioClient.messages.create({
          body: `Meeting request for ${startDate}, ${startTime} - ${endTime}`,
          from: 'YOUR_TWILIO_PHONE_NUMBER',
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
    // In a real-world app, you'd store this in a separate table
    console.log(
      `Storing request details: ${requestor} requests ${startDate}, ${startTime} - ${endTime}`
    );

    res.send('Request broadcasted successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error broadcasting request.');
  }
});

app.post('/api/respond-to-request', async (req, res) => {
  const { requestId, decision, bookingOwnerId, requestorId, startDateTime, endDateTime } = req.body;

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
          from: 'YOUR_TWILIO_PHONE_NUMBER',
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

console.log("Account SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("Auth Token:", process.env.TWILIO_AUTH_TOKEN);