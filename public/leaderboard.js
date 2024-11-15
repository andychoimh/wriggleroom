const mostHelpfulUsersList = document.getElementById('most-helpful-users');
const topUsersList = document.getElementById('top-users');

// Fetch leaderboard data from the backend
fetch('/api/leaderboard')
  .then(response => response.json())
  .then(data => {
    // Display Most Helpful Users
    mostHelpfulUsersList.innerHTML = ''; // Clear previous list

    data.mostHelpfulUsers.forEach(user => {
      const listItem = document.createElement('li');
      listItem.textContent = `${user.user_name} - ${user.appreciate_you_points} Appreciate You! points`;
      mostHelpfulUsersList.appendChild(listItem);
    });

    // Display Top Users
    topUsersList.innerHTML = ''; // Clear previous list

    data.topUsers.forEach(user => {
      const listItem = document.createElement('li');
      listItem.textContent = `${user.user_name} - ${user.activity_points} Activity Points`;
      topUsersList.appendChild(listItem);
    });
  })
  .catch(error => {
    console.error('Error fetching leaderboard data:', error);
    // TODO: Display an error message in the UI
  });