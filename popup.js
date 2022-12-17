let descriptionHTML = document.getElementById('description');
let wordList = document.getElementById('wordList');
let tableRows = document.getElementsByClassName('board');
let arrows = document.getElementsByClassName("arrow");
let board = document.getElementsByClassName('board');
let boardButtons = document.getElementsByClassName("btn-group");
let curr_board;

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
  chrome.action.setBadgeText({ text: `${numWords}`, tabId });
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
    let ary = Array.prototype.slice.call(board);
    ary.forEach(function(el) {
      el.className += " " + bodyClasses;
    })
}

// when solved, update with the word and remove the onClick
function handleBoardSolved(board, word) {
  board.innerHTML = "SOLVED";
  board.removeAttribute("onClick")
}

function showBoard(el, words) {
  // we want to remove all other buttons and display this buttons words
  descriptionHTML.innerText = "Board # "+(parseInt(el.id)+1) + ":";
  const suggestions = words[parseInt(el.id)].map(word => `${word.toUpperCase()}`).join(', ');
  wordList.innerHTML = suggestions;
  // show the top bar
  wordList.hidden = false

  // hide all buttons
  for (let i = 0; i < 8; i++) {
    tableRows[i].hidden = true;
  }

  // show the back and forward buttons
  if (parseInt(el.id) > 0) {
    arrows[0].style.removeProperty("visibility");
  } else {
    arrows[0].style.visibility = "hidden";
  }
  if (parseInt(el.id) < 7) {
    arrows[1].style.removeProperty("visibility");
  } else {
    arrows[1].style.visibility = "hidden";
  }

  curr_board = parseInt(el.id);

}

// Run when the popup is clicked and elements are loaded
document.addEventListener('DOMContentLoaded', async () => {
  let words = [];

  let ary = Array.prototype.slice.call(tableRows);
  ary.forEach(function(el) {
    el.addEventListener('click', function() {
        showBoard(el, words)
        
    });
  })

  

  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: "https://octordle.com/free"
  });

  // Try to get results only if on NYT page
  if (tab) {
    // Send empty message to solver.js to get state and update
    await chrome.tabs.sendMessage(tab.id, {}, ({ possible={}, numWords = {}, settings={} }) => {
      let s = 0;
      // add onclick for the back and forward buttons
      Array.from(arrows).forEach((el) => {
        el.addEventListener('click', function() {
          let num = curr_board + (el.className === "next arrow" ? 1 : -1);
          showBoard(document.getElementById(String(num)), words);
        });
      });
      // unhide "board" buttons
      Array.from(boardButtons).forEach((el) => {
        el.hidden = false;
      });

      descriptionHTML.innerHTML="Boards:";
      for (let i = 0; i < 8; i++) {
        let curr_possible = possible[i];
        if (curr_possible[0] === true) {
            handleBoardSolved(tableRows[i], curr_possible[1])
            if (curr_possible[1] != false || words.length < 8)
              words.push([curr_possible[1]])
        } else {
          shuffleArray(curr_possible);
          words.push(curr_possible);
          tableRows[i].innerHTML = `${curr_possible.length} possible word${curr_possible.length > 1 ? 's' : ''}`;
        }
      }
      updateIcon(settings, numWords, tab.id);
      updateColors(settings);
      
    });
  }
})