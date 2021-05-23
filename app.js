const Koa = require('koa');
const cors = require('koa2-cors');
const router = require('koa-router')();
const fs = require('fs');
const staticServer = require('koa-static');

const app = new Koa();
app.use(cors());
app.use(staticServer(__dirname , 'js'));

app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
    await next();
});

router.get('/', async (ctx, next) => {
    ctx.type='html'
    ctx.body=fs.createReadStream('./index.html')
});

// add router middleware:
app.use(router.routes());
app.listen(3000);
console.log('app started at port 3000...');