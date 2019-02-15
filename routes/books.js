const router = require('koa-router')()
const BookModel = require('../model/Book')
const ChapterModel = require('../model/Chapter')
const UserModel = require('../model/User')

router.prefix('/book')

router.get('/all', async function (ctx, next) {
    let page = ctx.request.query.page || 1
    let sex = ctx.request.query.sex || 2;
    let title = new RegExp(ctx.request.query.title);
    let param = {sex:sex}
    if (title) {
        param.title = {$regex: title}
    }
    let book = await BookModel.find(param).skip((page - 1) * 10).limit(10).sort({zhishu:-1})
    console.log(book,'------------book')
    ctx.body = book
})

router.get('/', async function (ctx, next) {
    let id = ctx.request.query.id;
    let book = await BookModel.find({id: id})
    ctx.body = book
})

router.get('/shelf', async function (ctx, next) {
    let unionid = ctx.request.query.unionid
    let id = ctx.request.query.id;
    let user = await UserModel.findOneAndUpdate({unionid: unionid},{
        $addToSet: {shelf: id}
    })
    ctx.body = "添加至书架成功"
})

router.get('/unshelf', async function (ctx, next) {
    let unionid = ctx.request.query.unionid
    let id = ctx.request.query.id;
    let user = await UserModel.findOneAndUpdate({unionid: unionid},{
        $pull: {shelf: id}
    })
    ctx.body = "从书架移除成功"
})

router.get('/userbooks', async function (ctx, next) {
    let unionid = ctx.request.query.unionid
    let user = await UserModel.findOne({unionid: unionid})
    let book = await BookModel.find({id: {$in: user.shelf}})
    ctx.body = book
})

router.post('/update', async(ctx, next) => {
    let id = ctx.request.body.id
    let pay_num = ctx.request.body.pay_num
    let data = {
        title: ctx.request.body.title,
        zuozhe: ctx.request.body.zuozhe,
        desc: ctx.request.body.desc,
        zishu: ctx.request.body.zishu,
        zhishu: ctx.request.body.zhishu,
        xstype: ctx.request.body.xstype,
        status: ctx.request.body.status,
        qiyong: ctx.request.body.qiyong,
        sex: ctx.request.body.sex,
        type: ctx.request.body.type,
        pay_num: pay_num,
        xianmian_start: ctx.request.body.xianmian_start,
        xianmian_end: ctx.request.body.xianmian_end
    }
    let book = await BookModel.findOneAndUpdate({id: id}, data, {new: true})
    let chapter = await ChapterModel.findOne({bid: id})
    let chapter_id = chapter.id
    await ChapterModel.updateMany({bid: id, id: {$lt: (pay_num + chapter_id - 1)}}, {isvip: 0})
    await ChapterModel.updateMany({bid: id, id: {$gte: (pay_num + chapter_id - 1)}}, {isvip: 1})
    if (book) {
        ctx.body = {success: '修改成功', data: book}
    } else {
        ctx.body = {err: '修改失败'}
    }
})

router.get('/reset', async(ctx, next) => {
    var book = new BookModel()
    book.nextCount(function (err, count) {
        book.resetCount(function (err, nextCount) {
        });
    });
    ctx.body = {success: '重置成功'}
})

module.exports = router
