# Pixel Port Public Website

Pixel Port 是 X星球实验室中“孩子创造的数字世界”的公开展示空间。它是静态网站，不连接 Pixel Port Runtime，也不包含上传、登录、评论或学生个人资料。

## 本地运行

```sh
npm install
npm run build
python3 -m http.server 8080 -d dist
```

打开 `http://localhost:8080`。

## 新增作品

1. 新建 `content/worlds/<slug>.md`，复制 `future-store.md` 的 Front Matter。
2. 将已获公开授权的图片放入 `public/assets/worlds/<slug>/`。
3. `cover` 必须为 `/assets/` 下的相对站内路径；`play_url` 必须为 HTTPS 公开地址，不能指向局域网或管理端。
4. 执行 `npm run build && npm test`。

`creator` 只能使用创作者代号；不要写入真实姓名、年龄、学校、家庭信息、联系方式或未经授权的照片。

## Cloudflare Pages

创建独立 Pages 项目并连接本仓库：

```text
Build command: npm ci && npm run build
Build output directory: dist
Production branch: main
Node.js: 22
```

先使用 Preview URL 审核内容。审核通过后，在该 Pages 项目的 **Custom domains** 中绑定 `play.talk1.top`。
