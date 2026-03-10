# 商城后端系统

一个功能完整的电商商城后端API系统，基于Node.js + Express + TypeScript + PostgreSQL构建。

## 功能特性

### 核心功能
- ✅ 用户认证与授权系统（注册、登录、JWT token、密码加密）
- ✅ 权限管理系统（角色、权限、中间件）
- ✅ 订单状态流转系统（完整的状态机）
- ✅ 支付系统（支付方式管理、第三方支付集成、回调处理）

### 商品管理
- ✅ 商品分类系统（多级分类、CRUD）
- ✅ 商品搜索与筛选（关键词搜索、价格筛选、销量排序）
- ✅ 商品评价系统（评价CRUD、评分、评论管理）
- ✅ 商品收藏/心愿单功能
- ✅ 库存管理系统（库存增减、库存预警、商品上下架）

### 用户功能
- ✅ 收货地址管理（CRUD、默认地址、地址验证）
- ✅ 会员积分系统（积分获取、消费、积分商城）
- ✅ 购物车管理（添加、更新、删除、清空）

### 订单与支付
- ✅ 订单管理（创建、查询、状态更新、取消）
- ✅ 订单状态历史记录
- ✅ 支付方式管理
- ✅ 支付回调处理（支付宝、微信支付）
- ✅ 余额支付

### 系统功能
- ✅ 消息通知系统（订单通知、促销通知）
- ✅ 数据统计分析（销售统计、用户统计、商品统计）
- ✅ 日志与监控系统（日志记录、系统监控）

## 技术栈

- **后端框架**: Express.js
- **编程语言**: TypeScript
- **数据库**: PostgreSQL
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs
- **跨域**: cors

## 项目结构

```
src/
├── config/
│   └── db.ts                 # 数据库配置
├── middleware/
│   ├── auth.ts               # 认证中间件
│   └── permission.ts         # 权限中间件
├── routes/
│   ├── auth.ts               # 认证路由
│   ├── users.ts              # 用户路由
│   ├── goods.ts              # 商品路由
│   ├── categories.ts          # 分类路由
│   ├── cart.ts               # 购物车路由
│   ├── orders.ts             # 订单路由
│   ├── payments.ts           # 支付路由
│   ├── reviews.ts            # 评价路由
│   ├── favorites.ts          # 收藏路由
│   ├── addresses.ts          # 地址路由
│   ├── points.ts            # 积分路由
│   ├── notifications.ts      # 通知路由
│   ├── statistics.ts        # 统计路由
│   └── logs.ts             # 日志路由
├── utils/
│   ├── auth.ts              # 认证工具
│   └── orderStatus.ts       # 订单状态工具
├── db.ts                   # 数据库连接
└── index.ts                # 应用入口
```

## 数据库设计

系统包含17个数据表：

1. **users** - 用户表
2. **roles** - 角色表
3. **categories** - 商品分类表
4. **goods** - 商品表
5. **reviews** - 商品评价表
6. **favorites** - 商品收藏表
7. **cart_items** - 购物车表
8. **addresses** - 收货地址表
9. **orders** - 订单表
10. **order_items** - 订单明细表
11. **order_status_history** - 订单状态历史表
12. **payment_methods** - 支付方式表
13. **payments** - 支付记录表
14. **points_records** - 积分记录表
15. **notifications** - 通知表
16. **system_logs** - 系统日志表
17. **statistics** - 统计数据表

## API接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 商品相关
- `GET /api/goods` - 获取商品列表（支持搜索、筛选、排序）
- `GET /api/goods/hot` - 获取热门商品
- `GET /api/goods/new` - 获取新品
- `GET /api/goods/recommend` - 获取推荐商品
- `GET /api/goods/:id` - 获取商品详情
- `GET /api/goods/batch/:ids` - 批量获取商品
- `POST /api/goods` - 创建商品（管理员）
- `PUT /api/goods/:id` - 更新商品（管理员）
- `DELETE /api/goods/:id` - 删除商品（管理员）
- `PUT /api/goods/:id/stock` - 更新库存（管理员）

### 分类相关
- `GET /api/categories` - 获取分类树
- `GET /api/categories/flat` - 获取分类列表
- `GET /api/categories/:id` - 获取分类详情
- `GET /api/categories/:id/goods` - 获取分类下的商品
- `POST /api/categories` - 创建分类（管理员）
- `PUT /api/categories/:id` - 更新分类（管理员）
- `DELETE /api/categories/:id` - 删除分类（管理员）

### 购物车相关
- `GET /api/cart/user/:userId` - 获取购物车
- `POST /api/cart` - 添加商品到购物车
- `PUT /api/cart/:id` - 更新购物车项
- `DELETE /api/cart/:id` - 删除购物车项
- `DELETE /api/cart/clear/:userId` - 清空购物车
- `PUT /api/cart/select-all/:userId` - 全选/取消全选

### 订单相关
- `GET /api/orders/user/:userId` - 获取用户订单
- `GET /api/orders/detail/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id/status` - 更新订单状态
- `PUT /api/orders/:id/payment-status` - 更新支付状态
- `DELETE /api/orders/:id` - 取消订单

### 支付相关
- `GET /api/payments/methods` - 获取支付方式
- `GET /api/payments/methods/:id` - 获取支付方式详情
- `POST /api/payments/methods` - 创建支付方式（管理员）
- `PUT /api/payments/methods/:id` - 更新支付方式（管理员）
- `DELETE /api/payments/methods/:id` - 删除支付方式（管理员）
- `POST /api/payments/create` - 创建支付
- `POST /api/payments/callback/alipay` - 支付宝回调
- `POST /api/payments/callback/wechat` - 微信支付回调
- `GET /api/payments/status/:paymentId` - 查询支付状态

### 评价相关
- `GET /api/reviews/goods/:goodsId` - 获取商品评价
- `GET /api/reviews/user/:userId` - 获取用户评价
- `GET /api/reviews/:id` - 获取评价详情
- `POST /api/reviews` - 创建评价
- `PUT /api/reviews/:id` - 更新评价
- `DELETE /api/reviews/:id` - 删除评价
- `PUT /api/reviews/:id/reply` - 回复评价（管理员）
- `PUT /api/reviews/:id/status` - 更新评价状态（管理员）

### 收藏相关
- `GET /api/favorites/user/:userId` - 获取用户收藏
- `GET /api/favorites/check/:userId/:goodsId` - 检查是否收藏
- `POST /api/favorites` - 添加收藏
- `DELETE /api/favorites/:id` - 删除收藏
- `DELETE /api/favorites/user/:userId/goods/:goodsId` - 取消收藏

### 地址相关
- `GET /api/addresses/user/:userId` - 获取用户地址
- `GET /api/addresses/:id` - 获取地址详情
- `POST /api/addresses` - 添加地址
- `PUT /api/addresses/:id` - 更新地址
- `DELETE /api/addresses/:id` - 删除地址
- `PUT /api/addresses/:id/default` - 设置默认地址

### 积分相关
- `GET /api/points/user/:userId` - 获取积分记录
- `GET /api/points/balance/:userId` - 获取积分余额
- `POST /api/points/earn` - 获得积分
- `POST /api/points/spend` - 消费积分
- `POST /api/points/refund` - 积分返还

### 通知相关
- `GET /api/notifications/user/:userId` - 获取用户通知
- `GET /api/notifications/unread-count/:userId` - 获取未读数量
- `GET /api/notifications/:id` - 获取通知详情
- `POST /api/notifications` - 创建通知
- `PUT /api/notifications/:id/read` - 标记为已读
- `PUT /api/notifications/read-all/:userId` - 全部标记为已读
- `DELETE /api/notifications/:id` - 删除通知

### 统计相关
- `GET /api/statistics/overview` - 获取概览统计（管理员）
- `GET /api/statistics/sales` - 获取销售统计（管理员）
- `GET /api/statistics/orders` - 获取订单统计（管理员）
- `GET /api/statistics/goods` - 获取商品统计（管理员）
- `GET /api/statistics/users` - 获取用户统计（管理员）

### 日志相关
- `GET /api/logs` - 获取日志列表（管理员）
- `GET /api/logs/:id` - 获取日志详情（管理员）
- `GET /api/logs/stats/summary` - 获取日志统计（管理员）
- `DELETE /api/logs/cleanup` - 清理旧日志（管理员）

## 安装与运行

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env` 文件并配置数据库连接信息：
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
JWT_EXPIRES_IN=7d
```

### 3. 配置数据库
编辑 `src/config/db.ts` 文件，设置数据库连接信息：
```typescript
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shop_mini_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};
```

### 4. 初始化数据库
执行 `schema.sql` 文件创建数据库表：
```bash
psql -U postgres -d shop_mini_app -f schema.sql
```

### 5. 启动开发服务器
```bash
npm run dev
```

### 6. 构建生产版本
```bash
npm run build
npm start
```

## 默认账号

### 管理员账号
- 用户名: `admin`
- 密码: `admin123`

### 普通用户账号
- 用户名: `user`
- 密码: `user123`

## 订单状态流转

订单状态流转如下：
```
pending (待支付)
  ↓
paid (已支付)
  ↓
processing (处理中)
  ↓
shipped (已发货)
  ↓
delivered (已送达)
  ↓
completed (已完成)
```

订单可以随时取消（pending和paid状态）。

## 支付状态

- `unpaid` - 未支付
- `paid` - 已支付
- `refunded` - 已退款
- `partial_refunded` - 部分退款

## 权限系统

系统支持基于角色的权限控制：

### 管理员角色 (roleId: 1)
- 拥有所有权限 (`["*"]`)

### 普通用户角色 (roleId: 2)
- 商品读取权限
- 购物车读写权限
- 订单读写权限
- 地址读写权限
- 评价读写权限
- 收藏读写权限
- 通知读取权限

## 注意事项

1. **安全性**: 生产环境请务必修改JWT_SECRET
2. **数据库**: 建议使用连接池管理数据库连接
3. **错误处理**: 所有API都有统一的错误处理
4. **日志**: 系统会自动记录操作日志
5. **验证**: 所有输入都进行了基本的验证

## 许可证

MIT
