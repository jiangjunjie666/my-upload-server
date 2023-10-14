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
    console.log(files)
    //切割出上传的文件的后缀名
    let ext = files.file.mimetype.split('/')[1]
    //计算出图片文件大小
    let size = (files.file.size / 1024 / 1024).toFixed(2)
    if ((ext == 'png' || ext == 'jpg' || ext == 'jpeg' || ext == 'mp4') && size < 2) {
      let url = 'http://127.0.0.1:3000/images/' + files.file.newFilename
      res.send({
        code: 200,
        msg: '上传成功',
        imgUrl: url
      })
    } else {
      res.send({
        code: 400,
        msg: '只能上传png、jpg、jpeg格式的图片或图片过大'
      })
      return
    }
  })
}

exports.fileUp = (req, res, next) => {
  //上传大小小于5Mb的文件
  //接收数据
  const form = formidable({
    multiples: true,
    uploadDir: path.join(__dirname, '../../public/file'),
    keepExtensions: true
  })
  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err)
      return
    }
    //限制上传文件的大小
    if (files.file.size > 1024 * 1024 * 5) {
      //删除对应的文件
      const folderPath = path.join(__dirname, '../../public/file/' + files.file.newFilename) // 文件路径
      fs.unlinkSync(folderPath)
      res.send({
        code: 400,
        msg: '上传文件过大'
      })
      return
    }
    //修改保存文件的默认name
    const folderPath = path.join(__dirname, '../../public/file/' + files.file.newFilename) // 文件路径
    let newName = path.join(__dirname, '../../public/file/' + files.file.originalFilename)

    //对读取的文件进行重命名
    console.log(newName)
    fs.rename(folderPath, newName, (err) => {
      if (err) {
        console.log(err)
        return
      } else {
        console.log('重命名成功')
        res.send({
          code: 200,
          msg: '上传成功'
        })
      }
    })
  })
}
