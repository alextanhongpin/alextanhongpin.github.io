const args = process.argv.slice(2)
const pathToFile = './' + args[0]

console.log(pathToFile)
const data = require(pathToFile)
const fs = require('fs')

const newdata = data.map((img) => {
  return {
    name: img.image.baseName,
    dof: toNumber(img.image.properties['exif:ApertureValue'], 1),
    shutterSpeed: img.image.properties['exif:ShutterSpeedValue'],
    iso: parseInt(img.image.properties['exif:ISOSpeedRatings'], 10),
    width: img.image.pageGeometry.width,
    height: img.image.pageGeometry.height,
  }
})

function toNumber(str, decimal) {
  let [num, den] = str.split('/').map(Number)
  return (num / den).toFixed(decimal)
}

console.log(newdata.slice(0, 5))

fs.writeFileSync(
  pathToFile.replace('data.json', 'out.json'),
  JSON.stringify(newdata)
)
