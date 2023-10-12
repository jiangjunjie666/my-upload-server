//放置上传图片的处理函数
//导入处理文件上传的包
const formidable = require('formidable')
const path = require('path')
const fs = require('fs')

exports.imageUp = (req, res, next) => {
  const form = formidable({
    multiples: true,
    uploadDir: path.join(__dirname, '../../public/images'),
    keepExtensions: true
  })
  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err)
      return
    }
    console.log(files.file)
    let url = 'http://127.0.0.1:3000/images/' + files.file.newFilename
    res.send({
      code: 200,
      msg: '上传成功',
      imgUrl: url
    })
  })
}
