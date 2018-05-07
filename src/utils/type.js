import pause from './pause'

async function type (max, counter = 0, callback) {
  if (counter < max) {
    callback && callback(counter)
    await pause()
    return type(max, counter + 1, callback)
  }
}

export default type
