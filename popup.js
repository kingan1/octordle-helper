const descriptionHTML = document.getElementById('description')
const wordList = document.getElementById('wordList')
const tableRows = document.getElementsByClassName('board')
const arrows = document.getElementsByClassName('arrow')
const board = document.getElementsByClassName('board')
const boardButtons = document.getElementsByClassName('btn-group')
let currBoard

const chromeUrls = [
  'https://octordle.com/free*',
  'https://octordle.com/free-rescue',
  'https://octordle.com/free-sequence',
  'https://octordle.com/daily*',
  'https://octordle.com/daily-rescue*',
  'https://octordle.com/daily-sequence*'

]

// Update the icon image and badge based on settings
function updateIcon (settings, numWords, tabId) {
  const hc = settings.HighContrast
  chrome.action.setIcon({
    path: {
      16: `/images/icon-16${hc ? '-hc' : ''}.png`,
      32: `/images/icon-32${hc ? '-hc' : ''}.png`,
      48: `/images/icon-48${hc ? '-hc' : ''}.png`,
      128: `/images/icon-128${hc ? '-hc' : ''}.png`
    },
    tabId
  })
  chrome.action.setBadgeText({ text: `${numWords}`, tabId })
  chrome.action.setBadgeBackgroundColor({ color: hc ? '#f5793a' : '#538d4e' })
}

// Update the popup colors based on dark mode and contrast settings
function updateColors (settings) {
  const bodyClasses = document.body.classList
  if (settings.DarkMode) {
    bodyClasses.remove('lightmode')
    bodyClasses.add('darkmode')
  } else {
    bodyClasses.remove('darkmode')
    bodyClasses.add('lightmode')
  }

  if (settings.HighContrast) {
    bodyClasses.remove('nocontrast')
    bodyClasses.add('highcontrast')
  } else {
    bodyClasses.remove('highcontrast')
    bodyClasses.add('nocontrast')
  }
  const ary = Array.prototype.slice.call(board)
  ary.forEach(function (el) {
    el.className += ' ' + bodyClasses
  })
}

// when solved, update with the word and remove the onClick
function handleBoardSolved (board, word) {
  board.innerHTML = 'SOLVED'
  board.removeAttribute('onClick')
}

function showBoard (el, words) {
  // we want to remove all other buttons and display this buttons words
  descriptionHTML.innerText = 'Board # ' + (parseInt(el.id) + 1) + ':'
  const suggestions = words[parseInt(el.id)].map(word => `${word.toUpperCase()}`).join(', ')
  wordList.innerHTML = suggestions
  // show the top bar
  wordList.hidden = false

  // hide all buttons
  for (let i = 0; i < 8; i++) {
    tableRows[i].hidden = true
  }

  // show the back and forward buttons
  if (parseInt(el.id) > 0) {
    arrows[0].style.removeProperty('visibility')
  } else {
    arrows[0].style.visibility = 'hidden'
  }
  if (parseInt(el.id) < 7) {
    arrows[1].style.removeProperty('visibility')
  } else {
    arrows[1].style.visibility = 'hidden'
  }

  currBoard = parseInt(el.id)
}

// Run when the popup is clicked and elements are loaded
document.addEventListener('DOMContentLoaded', async () => {
  const words = []

  const ary = Array.prototype.slice.call(tableRows)
  ary.forEach(function (el) {
    el.addEventListener('click', function () {
      showBoard(el, words)
    })
  })

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: chromeUrls
  })

  if (tab) {
    // Send empty message to solver.js to get state and update
    await chrome.tabs.sendMessage(tab.id, { url: tab.url }, ({ possible = {}, numWords = {}, settings = {} }) => {
      // add onclick for the back and forward buttons
      Array.from(arrows).forEach((el) => {
        el.addEventListener('click', function () {
          const num = currBoard + (el.className === 'next arrow' ? 1 : -1)
          showBoard(document.getElementById(String(num)), words)
        })
      })
      // unhide 'board' buttons
      Array.from(boardButtons).forEach((el) => {
        el.hidden = false
      })

      descriptionHTML.innerHTML = 'Boards:'
      for (let i = 0; i < 8; i++) {
        const currPossible = possible[i]
        // if currPossible[0] is true, either we guessed right or game is over
        if (currPossible[0] === true) {
          if (currPossible[1] !== false || words.length < 8) { words.push([currPossible[1]]) }
          handleBoardSolved(tableRows[i], currPossible[1])
        } else if (getKeyword(tab.url) === 'sequence' && !currPossible[0]) {
          words.push(currPossible[1])
          tableRows[i].innerHTML = ' ------ '
        } else {
          words.push(currPossible)
          tableRows[i].innerHTML = `${currPossible.length} possible word${currPossible.length > 1 ? 's' : ''}`
        }
      }
      updateIcon(settings, numWords, tab.id)
      updateColors(settings)
    })
  }
})
