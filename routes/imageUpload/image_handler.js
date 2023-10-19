//放置上传图片的处理函数
//导入处理文件上传的包
const formidable = require('formidable')
const multiparty = require('multiparty')
const path = require('path')
const fs = require('fs')
const db = require('../../mysql/db')
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
    if ((ext == 'png' || ext == 'jpg' || ext == 'jepg' || ext == 'mp4') && size < 2) {
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
  //上传大小小于1Mb的文件
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
    if (files.file.size > 1024 * 1024 * 100000) {
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

exports.upload_chunk = (req, res, next) => {
  // 二进制数据上传
  const form = new multiparty.Form()

  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err)
      return
    }
    if (parseInt(fields.index[0]) === 0) {
      //查看数据库中是否存在此hash
      const sql = 'SELECT * FROM hash WHERE hash = ?'
      db.query(sql, [fields['filename'][0]], (err, result) => {
        if (err) {
          next(err)
          return
        }
        if (result.length > 0) {
          //如果存在则直接返回
          res.send({
            code: 300,
            msg: '已经存在部分文件',
            index: result[0].dex + 1
          })
          return
        } else {
          //向数据库中插入一个hash
          console.log(11111)
          const sql = 'INSERT INTO hash (hash, dex) VALUES (?, ?)'
          db.query(sql, [fields['filename'][0], 0], (err, result) => {
            if (err) {
              next(err)
              return
            }
            console.log(result)
            res.send({
              code: 300,
              msg: '已经存在部分文件',
              index: 0
            })
            return
          })
        }
      })
    } else {
      //将每一次上传的数据进行统一的存储
      const oldName = files.chunk[0].path
      const newName = path.join(__dirname, '../../public/upload/chunk/' + fields['filename'][0] + '/' + fields['name'][0])

      //创建临时存储目录
      fs.mkdirSync('./public/upload/chunk/' + fields['filename'][0], {
        recursive: true
      })
      console.log(fields)
      console.log(files)
      // fs.rename(oldName, newName, (err) => {
      //   if (err) {
      //     console.log(err)
      //     return
      //   } else {
      //     console.log('重命名成功')
      //     res.send({
      //       code: 200,
      //       msg: '上传成功'
      //     })
      //   }
      // })
      // 这个错误是由于跨设备的文件移动操作引发的，而在大多数操作系统中，使用fs.rename函数进行跨设备的文件移动是不被允许的。这是因为rename是原子操作，而跨设备移动需要复制文件内容到目标设备，然后删除源文件，这不是一个原子操作。
      // 复制文件
      fs.copyFile(oldName, newName, (err) => {
        if (err) {
          console.error(err)
        } else {
          // 删除源文件
          fs.unlink(oldName, (err) => {
            if (err) {
              console.error(err)
            } else {
              console.log('文件复制和删除成功')
            }
          })
        }
      })
      //修改hash值的dex
      const sql = 'update hash set dex = ? where hash = ?'
      db.query(sql, [parseInt(fields.index[0]), fields.filename[0]], (err, result) => {
        if (err) {
          console.log(err)
        } else {
          console.log(result)
        }
      })
      res.send({
        code: 200,
        msg: '分片上传成功'
      })
    }
  })
}

exports.upload_chunk1 = (req, res, next) => {
  // 二进制数据上传
  const form = new multiparty.Form()
  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err)
      return
    }
    let pa = path.join(__dirname, '../../public/upload/chunk/' + fields['filename'][0])
    console.log(pa)
    //判断是否为断点续传
    if (fs.existsSync(pa) && parseInt(fields.index[0]) === 0) {
      //存在该目录
      //返回最大的索引
      let maxIndex = 0
      let arr = fs.readdirSync(pa)
      for (let i = 0; i < arr.length; i++) {
        let str = parseInt(arr[i].split('@')[1])
        console.log(str)
        if (str > maxIndex) {
          maxIndex = str
        }
      }
      res.send({
        code: 300,
        msg: '存在该目录，请继续上传',
        index: maxIndex
      })
    } else {
      //将每一次上传的数据进行统一的存储
      const oldName = files.chunk[0].path
      const newName = path.join(__dirname, '../../public/upload/chunk/' + fields['filename'][0] + '/' + fields['name'][0])

      //创建临时存储目录
      fs.mkdirSync('./public/upload/chunk/' + fields['filename'][0], {
        recursive: true
      })
      console.log(fields)
      console.log(files)
      fs.copyFile(oldName, newName, (err) => {
        if (err) {
          console.error(err)
        } else {
          // 删除源文件
          fs.unlink(oldName, (err) => {
            if (err) {
              console.error(err)
            } else {
              console.log('文件复制和删除成功')
            }
          })
        }
      })
      res.send({
        code: 200,
        msg: '分片上传成功'
      })
    }
  })
}

exports.merge_chunk = (req, res, next) => {
  const fields = req.body
  console.log(fields)
  thunkStreamMerge('../../public/upload/chunk/' + fields.filename, '../../public/upload/' + fields.filename + '.' + fields.extname)
  res.send({
    code: 200,
    data: '/public/upload/' + fields.filename + '.' + fields.extname
  })
}

// 文件合并
function thunkStreamMerge(sourceFiles, targetFile) {
  const chunkFilesDir = path.join(__dirname, sourceFiles)
  const chunkTargetDir = path.join(__dirname, targetFile)
  const list = fs.readdirSync(chunkFilesDir) //读取目录中的文件
  const fileList = list
    .sort((a, b) => a.split('@')[1] * 1 - b.split('@')[1] * 1)
    .map((name) => ({
      name,
      filePath: path.resolve(chunkFilesDir, name)
    }))
  const fileWriteStream = fs.createWriteStream(chunkTargetDir)
  thunkStreamMergeProgress(fileList, fileWriteStream, chunkFilesDir)
}

//合并每一个分片
function thunkStreamMergeProgress(fileList, fileWriteStream, sourceFiles) {
  if (!fileList.length) {
    // thunkStreamMergeProgress(fileList)
    fileWriteStream.end('完成了')
    // 删除临时目录
    if (sourceFiles) fs.rmdirSync(sourceFiles, { recursive: true, force: true })
    return
  }
  const data = fileList.shift() // 取第一个数据
  const { filePath: chunkFilePath } = data
  const currentReadStream = fs.createReadStream(chunkFilePath) // 读取文件
  // 把结果往最终的生成文件上进行拼接
  currentReadStream.pipe(fileWriteStream, { end: false })
  currentReadStream.on('end', () => {
    // console.log(chunkFilePath);
    // 拼接完之后进入下一次循环
    thunkStreamMergeProgress(fileList, fileWriteStream, sourceFiles)
  })
}
