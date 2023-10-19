const fs = require('fs')
const path = require('path')

let str = path.join(__dirname, './uploads')
console.log(str)
//查看是否存在某个目录
function isExist(path) {
  return fs.existsSync(path)
}
console.log(fs.existsSync(str))

//查询目录中的所有文件
function getFiles(path) {
  let files = fs.readdirSync(path)
  return files
}

let arr = getFiles(str)
//得到所有文件的后缀
let max = 0
for (let i = 0; i < arr.length; i++) {
  let str = parseInt(arr[i].split('@')[1])
  console.log(str)
  if (str > max) {
    max = str
  }
}
console.log(max)

// let isOn = fs.existsSync(selectName)
// let index = 0
// if (isOn) {
//   let arr = fs.readdirSync(selectName)
//   for (let i = 0; i < arr.length; i++) {
//     let num = arr[i].split('@')[1]
//     if (num > index) {
//       index = num
//     }
//   }
//   res.send({
//     code: '200',
//     msg: '文件已经部分存在',
//     index: index
//   })
//   return
// }
