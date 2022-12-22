
const regex = {
  free: [/^https:\/\/octordle.com\/free$/,
    /^https:\/\/octordle.com\/free-rescue$/,
    /^https:\/\/octordle.com\/daily$/,
    /^https:\/\/octordle.com\/daily\/.*$/,
    /^https:\/\/octordle.com\/daily-rescue$/,
    /^https:\/\/octordle.com\/daily-rescue\/.*$/],
  sequence: [
    /^https:\/\/octordle.com\/free-sequence$/,
    /^https:\/\/octordle.com\/daily-sequence$/,
    /^https:\/\/octordle.com\/daily-sequence\/.*$/
  ]

}

function getUrls () {
  return Object.values(regex).flat().map(item => String(item).replaceAll('\\', '').replace('/^', '').replace('$/', ''))
}

function getKeyword (url) {
  for (const type of Object.keys(regex)) {
    for (const expr of regex[type]) {
      if (url.match(expr)) {
        return type
      }
    }
  }
}
