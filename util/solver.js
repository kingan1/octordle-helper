let numWords = 0
// Util for set intersections
function intersection (setA, setB) {
  const _intersection = new Set()
  for (const elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem)
    }
  }
  return _intersection
}

// Return words that contain the present letters
function getWordsWithPresentLetters (presentLetters = new Map()) {
  return new Set(ANSWER_WORDS.filter(word => {
    for (const [letter, locations] of presentLetters) {
      // Remove words that don't have the present letter
      if (!(word.includes(letter))) {
        return false
      }
      // If they do have the present letter, remove words that have a present letter
      // in a location that has been guessed, e.g. if the word is AROMA, the guess is
      // TRAIN, do not include words that have A in the 3rd slot like GRASS
      for (const index of locations) {
        if (word[index] === letter) {
          return false
        }
      }
    }
    return true
  }))
}

// Return words that contain the correct letters in the right places
function getWordsWithCorrectLetters (guesses = []) {
  return new Set(ANSWER_WORDS.filter(word => {
    for (const [index, letter] of guesses.entries()) {
      if (letter !== ' ' && !(word[index] === letter)) {
        return false
      }
    }
    return true
  }))
}

// Return words that don't contain incorrectly guessed letters
function getWordsWithoutAbsentLetters (absentLetters = []) {
  return new Set(ANSWER_WORDS.filter(word => {
    for (const absent of absentLetters) {
      if (word.includes(absent)) {
        return false
      }
    }
    return true
  }))
}

// Get possible guess words given the current state
function getPossibleWords ({
  absentLetters = new Set(),
  presentLetters = new Map(),
  correctLetters = [' ', ' ', ' ', ' ', ' '] // default to empty
} = {}) {
  absent = getWordsWithoutAbsentLetters(absentLetters)
  present = getWordsWithPresentLetters(presentLetters)
  correct = getWordsWithCorrectLetters(correctLetters)
  return intersection(present, intersection(correct, absent))
}

// Get whether the user has dark mode and high contrast mode enabled
function getColorSettings () {
  // Settings for dark mode and high contrast are undefined until explicitly toggled
  return {
    DarkMode: [DarkModeSetting, RetroModeSetting].includes(window.localStorage[OctordleModeKey]) ?? false,
    HighContrast: window.localStorage[HighContrastSetting] === ColorblindSetting ?? false
  }
}

function transformGuesses (guesses, entries) {
  newGuesses = []
  for (let i = 0; i < entries; i++) {
    item = guesses[i]
    // if its numeric: map to "" or if it hasn't been guessed yet
    letter = parseInt(item.innerText) || !item.innerText ? '' : item.innerText.toLowerCase() + ' '
    // if it hasn't been guessed: map to ""
    state = !letter || item.className.includes('current-guess') ? '' : item.className.split(' ')[1]
    newGuesses.push(letter + state)
  }
  return newGuesses
}

function checkSolved (guesses, NumEntries) {
  // if the last 5 before '' all contain States.Correct: solved
  const lastRowIndex = guesses.indexOf('') === -1 ? NumEntries - 5 : guesses.indexOf('') - 5
  if (lastRowIndex < 0 || lastRowIndex % 5) {
    return false
  }
  let word = ''
  for (let i = lastRowIndex; i < lastRowIndex + 5; i++) {
    if (guesses[i].split(' ')[1] !== States.CORRECT) {
      return false
    }
    word += guesses[i].split(' ')[0]
  }
  return word
}

// Given the game state, compute the list of possible words
function solveSpecificBoard (boardNumber, type) {
  const entries = NumRows[type] * 5
  let guesses = Array.from(document.querySelectorAll('.letter')).slice((boardNumber - 1) * entries, boardNumber * entries)
  guesses = transformGuesses(guesses, entries)
  const word = checkSolved(guesses, entries)

  if (document.getElementsByClassName('post-game--title').length && word) {
    return [true, word, true]
  }
  // NYT no longer stores the game state in local stoarage, so we must determine
  // the game state based on the HTML classes

  if (word) {
    return [true, word, false]
  }

  // Change 65 array into 13x5 array
  const boardState = guesses.reduce((rows, key, index) => (index % 5 === 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows, [])

  const state = {
    absentLetters: new Set(),
    presentLetters: new Map(),
    correctLetters: [' ', ' ', ' ', ' ', ' ']
  }
  for (const row of boardState) {
    for (const [index, guess] of row.entries()) {
      if (guess === States.EMPTY) break // We can stop as soon as we see one empty box

      const [letter, evaluation] = guess.split(' ')
      switch (evaluation) {
        case States.CORRECT:
          state.correctLetters[index] = letter
          break
        case States.PRESENT:
          presentLocations = state.presentLetters.get(letter) ?? []
          presentLocations.push(index)
          state.presentLetters.set(letter, presentLocations)
          break
        case States.ABSENT:
          // edge case with multiple letters
          if (!state.presentLetters.has(letter) && !state.correctLetters.includes(letter)) {
            state.absentLetters.add(letter)
          }
          break
      }
    }
  }
  const possibleWords = Array.from(getPossibleWords(state))
  numWords += possibleWords.length
  if (document.getElementsByClassName('post-game--title').length && word) {
    return [true, possibleWords, true]
  }
  return possibleWords
}

const convert = {
  'https://octordle.com/free': 'free',
  'https://octordle.com/free-sequence': 'sequence',
  'https://octordle.com/free-rescue': 'free',
  'https://octordle.com/daily': 'free',
  'https://octordle.com/daily-sequence': 'sequence',
  'https://octordle.com/daily-rescue': 'free'
}

function solve (url) {
  numWords = 0
  ret = []

  type = convert[url]

  for (let i = 1; i < 9; i++) { ret.push(solveSpecificBoard(i, type)) }
  if (type === 'free') {
    return ret
  } else if (type === 'sequence') {
    // detect what board # we are on by seeing how many we have solved
    let i
    for (i = 0; i < 8; i++) {
      if (ret[i][0] !== true) {
        break
      }
    }
    for (let k = i + 1; k < 8; k++) {
      ret[k] = [false, ANSWER_WORDS]
    }
    numWords = i === 8 ? 0 : ret[i].length
    return ret
  }
}

// Listen to keyboard enters to update
document.addEventListener('keyup', async (e) => {
  if (e.key === 'Enter') {
    // Wait 2 seconds for the animation to finish before updating state
    await new Promise(resolve => setTimeout(resolve, 1800))

    chrome.runtime.sendMessage({
      possible: solve(document.URL),
      numWords,
      settings: getColorSettings()
    })
  }
})

// Listen to message from popup.js and respond
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('here')
  try {
    const possible = solve(request.url)
    const settings = getColorSettings()
    sendResponse({ possible, numWords, settings })
  } catch (e) {
    console.error('encountered JSON parse error', e)
  }
})

// Run when wordle page first opens
chrome.runtime.sendMessage({
  possible: solve(document.URL),
  numWords,
  settings: getColorSettings()
})
