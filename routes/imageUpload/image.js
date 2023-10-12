var express = require('express')
var router = express.Router()

const handler = require('./image_handler')
//挂载路由
router.post('/imageUpload', handler.imageUp)

module.exports = router
