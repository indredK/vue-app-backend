# 商城后端功能验证指南

## 🚀 快速验证步骤

### 1. 服务器状态 ✅
服务器已成功启动在 `http://localhost:3001`

### 2. 数据库初始化 ⚠️
当前API返回"Not found"错误是因为数据库还没有初始化。请执行以下步骤：

#### 方法一：使用PostgreSQL命令行
```bash
# 1. 连接到PostgreSQL
psql -U postgres

# 2. 创建数据库
CREATE DATABASE shop_mini_app;

# 3. 连接到数据库
\c shop_mini_app

# 4. 执行schema.sql
\i /Users/apple/Documents/trae_projects/vue-app-backend/schema.sql

# 5. 退出
\q
```

#### 方法二：使用psql命令直接执行
```bash
psql -U postgres -d shop_mini_app -f /Users/apple/Documents/trae_projects/vue-app-backend/schema.sql
```

### 3. 重新测试API
数据库初始化完成后，重新运行测试脚本：

```bash
node test-api.js
```

## 📋 功能验证清单

### 核心功能
- [ ] 用户注册 (`POST /api/auth/register`)
- [ ] 用户登录 (`POST /api/auth/login`)
- [ ] JWT Token认证
- [ ] 权限验证
- [ ] 订单状态流转
- [ ] 支付方式管理
- [ ] 支付回调处理

### 商品管理
- [ ] 商品分类列表 (`GET /api/categories`)
- [ ] 商品列表 (`GET /api/goods`)
- [ ] 商品搜索（关键词）
- [ ] 商品筛选（价格、分类）
- [ ] 商品排序（销量、价格）
- [ ] 热门商品 (`GET /api/goods/hot`)
- [ ] 新品 (`GET /api/goods/new`)
- [ ] 推荐商品 (`GET /api/goods/recommend`)
- [ ] 商品详情 (`GET /api/goods/:id`)
- [ ] 商品评价 (`GET /api/reviews/goods/:goodsId`)
- [ ] 商品收藏 (`GET /api/favorites/user/:userId`)
- [ ] 库存管理

### 用户功能
- [ ] 购物车管理 (`GET /api/cart/user/:userId`)
- [ ] 添加到购物车 (`POST /api/cart`)
- [ ] 更新购物车 (`PUT /api/cart/:id`)
- [ ] 删除购物车项 (`DELETE /api/cart/:id`)
- [ ] 收货地址管理 (`GET /api/addresses/user/:userId`)
- [ ] 添加地址 (`POST /api/addresses`)
- [ ] 设置默认地址 (`PUT /api/addresses/:id/default`)
- [ ] 积分余额查询 (`GET /api/points/balance/:userId`)
- [ ] 积分记录 (`GET /api/points/user/:userId`)

### 订单与支付
- [ ] 创建订单 (`POST /api/orders`)
- [ ] 订单列表 (`GET /api/orders/user/:userId`)
- [ ] 订单详情 (`GET /api/orders/detail/:id`)
- [ ] 更新订单状态 (`PUT /api/orders/:id/status`)
- [ ] 取消订单 (`DELETE /api/orders/:id`)
- [ ] 支付方式列表 (`GET /api/payments/methods`)
- [ ] 创建支付 (`POST /api/payments/create`)

### 系统功能
- [ ] 通知列表 (`GET /api/notifications/user/:userId`)
- [ ] 未读通知数 (`GET /api/notifications/unread-count/:userId`)
- [ ] 标记已读 (`PUT /api/notifications/:id/read`)
- [ ] 统计概览 (`GET /api/statistics/overview`)
- [ ] 销售统计 (`GET /api/statistics/sales`)
- [ ] 订单统计 (`GET /api/statistics/orders`)
- [ ] 商品统计 (`GET /api/statistics/goods`)
- [ ] 用户统计 (`GET /api/statistics/users`)
- [ ] 日志查询 (`GET /api/logs`)

## 🔍 手动验证API

### 使用curl测试

#### 1. 测试服务器信息
```bash
curl http://localhost:3001/
```

#### 2. 测试用户登录
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user123"}'
```

#### 3. 测试商品列表
```bash
curl http://localhost:3001/api/goods
```

#### 4. 测试商品分类
```bash
curl http://localhost:3001/api/categories
```

#### 5. 测试热门商品
```bash
curl http://localhost:3001/api/goods/hot
```

### 使用Postman/Insomnia测试

1. 导入API端点
2. 设置Base URL: `http://localhost:3001`
3. 测试各个接口

### 使用浏览器测试

直接访问以下URL查看响应：
- http://localhost:3001/
- http://localhost:3001/api/goods
- http://localhost:3001/api/categories
- http://localhost:3001/api/goods/hot

## 📊 预期结果

### 成功响应示例

#### 服务器信息
```json
{
  "message": "Shop Mini App API Server",
  "version": "1.0.0",
  "endpoints": {
    "goods": "/api/goods",
    "users": "/api/users",
    "cart": "/api/cart",
    "orders": "/api/orders",
    "auth": "/api/auth",
    "payments": "/api/payments",
    "categories": "/api/categories",
    "reviews": "/api/reviews",
    "favorites": "/api/favorites",
    "addresses": "/api/addresses",
    "points": "/api/points",
    "notifications": "/api/notifications",
    "statistics": "/api/statistics",
    "logs": "/api/logs"
  }
}
```

#### 用户登录
```json
{
  "user": {
    "id": 2,
    "username": "user",
    "nickname": "科技极客",
    "phone": "138****9999",
    "email": "user@example.com",
    "roleId": 2,
    "points": 0,
    "avatar": "https://picsum.photos/200/200?random=11"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 商品列表
```json
{
  "goods": [...],
  "total": 8,
  "page": 1,
  "limit": 20
}
```

## ⚠️ 常见问题

### 1. 连接数据库失败
**错误**: `password authentication failed for user "postgres"`

**解决**: 检查 `.env` 文件中的数据库密码是否正确

### 2. 端口被占用
**错误**: `EADDRINUSE: address already in use :::3001`

**解决**: 
- 修改 `.env` 文件中的PORT
- 或者停止占用3001端口的进程

### 3. API返回"Not found"
**原因**: 数据库未初始化

**解决**: 执行 `schema.sql` 文件初始化数据库

### 4. TypeScript编译错误
**错误**: `TSError: ⨯ Unable to compile TypeScript`

**解决**: 检查TypeScript语法错误，确保所有导入正确

## 🎯 验证完成标准

当以下条件满足时，说明功能验证完成：

1. ✅ 服务器成功启动，无错误日志
2. ✅ 所有API端点返回正确的响应
3. ✅ 用户可以成功注册和登录
4. ✅ 商品数据可以正常查询
5. ✅ 购物车、订单、支付等功能正常工作
6. ✅ 权限验证正常工作
7. ✅ 数据库操作无错误

## 📝 测试报告模板

```
测试日期: ___________
测试人员: ___________
服务器地址: http://localhost:3001

功能模块测试结果:
[✅/❌] 用户认证系统
[✅/❌] 商品管理系统
[✅/❌] 购物车功能
[✅/❌] 订单管理系统
[✅/❌] 支付系统
[✅/❌] 评价系统
[✅/❌] 收藏功能
[✅/❌] 地址管理
[✅/❌] 积分系统
[✅/❌] 通知系统
[✅/❌] 统计分析
[✅/❌] 日志监控

发现问题:
1. ___________
2. ___________
3. ___________

建议改进:
1. ___________
2. ___________
3. ___________
```

## 🚀 下一步

验证完成后，你可以：

1. **集成前端**: 将API集成到Vue前端应用
2. **部署上线**: 部署到生产环境
3. **性能优化**: 添加缓存、CDN等
4. **安全加固**: 添加HTTPS、限流等
5. **监控告警**: 集成监控系统

## 📞 获取帮助

如果遇到问题，请检查：
1. 服务器日志 (终端输出)
2. 数据库连接状态
3. 环境变量配置
4. API响应错误信息
