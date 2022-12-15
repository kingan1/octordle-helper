// Shuffle the suggestions given
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

// Update the icon image and badge based on settings
function updateIcon(settings, numWords, tabId) {
  const hc = settings.HighContrast;
  chrome.action.setIcon({
    path:  {
      "16": `/images/icon-16${hc ? '-hc' : ''}.png`,
      "32": `/images/icon-32${hc ? '-hc' : ''}.png`,
      "48": `/images/icon-48${hc ? '-hc' : ''}.png`,
      "128": `/images/icon-128${hc ? '-hc' : ''}.png`
    },
    tabId
  });
  chrome.action.setBadgeText({ text: `${numWords || 1}`, tabId });
  chrome.action.setBadgeBackgroundColor({ color: hc ? '#f5793a' : '#538d4e' });
}

// Update the popup colors based on dark mode and contrast settings
function updateColors(settings) {
  const bodyClasses = document.body.classList;
  if (settings.DarkMode) {
    bodyClasses.remove('lightmode');
    bodyClasses.add('darkmode');
  } else {
    bodyClasses.remove('darkmode');
    bodyClasses.add('lightmode');
  }

  if (settings.HighContrast) {
    bodyClasses.remove('nocontrast');
    bodyClasses.add('highcontrast');
  } else {
    bodyClasses.remove('highcontrast');
    bodyClasses.add('nocontrast');
  }
}

// Run when the popup is clicked and elements are loaded
document.addEventListener('DOMContentLoaded', async () => {
  const numWords = document.getElementById('numWords');
  const tableRows = document.getElementsByTagName('td');
  

  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: "https://octordle.com/free"
  });

  // Try to get results only if on NYT page
  if (tab) {
    // Send empty message to solver.js to get state and update
    await chrome.tabs.sendMessage(tab.id, {}, ({ possible={}, settings={} }) => {
      let s = 0;
      document.getElementById('possible').innerText = "Boards:";
      numWords.innerHTML = "";
      for (let i = 0; i < 8; i++) {
        let curr_possible = possible[i];
        shuffleArray(curr_possible);
        tableRows[i].innerHTML = `${curr_possible.length} possible word${curr_possible.length > 1 ? 's' : ''}`;
        s += curr_possible.length;
      }
      updateIcon(settings, s, tab.id);
      updateColors(settings);

      // on button click: 
        // const suggestions = possible.map(word => `${word.toUpperCase()}`).join(', ');
        // possibleHTML.innerHTML = suggestions;
      
    });
  }
})