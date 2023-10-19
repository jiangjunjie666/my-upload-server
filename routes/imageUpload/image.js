var express = require('express')
var router = express.Router()

const handler = require('./image_handler')
//挂载路由
router.post('/imageUpload', handler.imageUp)
//上传文件
router.post('/fileUpload', handler.fileUp)
//接收分片
router.post('/upload_chunk', handler.upload_chunk)
router.post('/upload_chunk1', handler.upload_chunk1)
//合并分片
router.post('/merge_chunk', handler.merge_chunk)
module.exports = router
