# 商城后端API接口文档

## 📋 基础信息

### 服务器地址
- **开发环境**: `http://localhost:3001`
- **生产环境**: 需要配置实际域名

### 认证方式
- **类型**: JWT Bearer Token
- **请求头**: `Authorization: Bearer {token}`
- **获取方式**: 登录成功后返回

### 数据格式
- **请求格式**: JSON
- **响应格式**: JSON
- **字符编码**: UTF-8

### 通用响应结构
```json
{
  "data": {}, 
  "error": "错误信息"
}
```

### 错误码说明
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权（token无效或过期）
- `403` - 禁止访问（权限不足）
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 🔐 认证模块

### 1. 用户注册
**接口**: `POST /api/auth/register`

**请求参数**:
```json
{
  "username": "string",      // 必填，用户名，唯一
  "password": "string",      // 必填，密码，至少6位
  "nickname": "string",     // 可选，昵称
  "phone": "string",        // 可选，手机号
  "email": "string"         // 可选，邮箱
}
```

**响应示例**:
```json
{
  "user": {
    "id": 3,
    "username": "newuser",
    "nickname": "新用户",
    "phone": "13800138000",
    "email": "new@example.com",
    "roleId": 2,
    "points": 0,
    "avatar": ""
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**错误示例**:
```json
{
  "error": "Username already exists"
}
```

---

### 2. 用户登录
**接口**: `POST /api/auth/login`

**请求参数**:
```json
{
  "username": "string",  // 必填，用户名
  "password": "string"   // 必填，密码
}
```

**响应示例**:
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

**默认测试账号**:
- 普通用户: `user` / `user123`
- 管理员: `admin` / `admin123`

---

## 📦 商品模块

### 1. 获取商品列表
**接口**: `GET /api/goods`

**查询参数**:
- `page` - 页码，默认1
- `limit` - 每页数量，默认20
- `keyword` - 搜索关键词
- `categoryId` - 分类ID
- `minPrice` - 最低价格
- `maxPrice` - 最高价格
- `sort` - 排序字段（created_at/price/sales/name）
- `order` - 排序方向（ASC/DESC）
- `isHot` - 是否热门（true/false）
- `isNew` - 是否新品（true/false）
- `isRecommend` - 是否推荐（true/false）

**请求示例**:
```
GET /api/goods?page=1&limit=20&keyword=iPhone&minPrice=5000&maxPrice=10000&sort=price&order=ASC
```

**响应示例**:
```json
{
  "goods": [
    {
      "id": 1,
      "categoryId": 4,
      "name": "iPhone 15 Pro",
      "price": 7999,
      "originalPrice": 8999,
      "image": "https://picsum.photos/400/400?random=1",
      "images": ["https://picsum.photos/400/400?random=1", "..."],
      "sales": 5200,
      "stock": 100,
      "specs": {
        "brand": "Apple",
        "model": "A3104",
        "storage": "256GB",
        "color": "钛金属",
        "warranty": "1年"
      },
      "description": "采用航空级钛金属设计...",
      "tags": ["热销", "旗舰"],
      "status": "active",
      "isHot": true,
      "isNew": true,
      "isRecommend": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 20
}
```

---

### 2. 获取商品详情
**接口**: `GET /api/goods/:id`

**请求示例**:
```
GET /api/goods/1
```

**响应示例**:
```json
{
  "id": 1,
  "categoryId": 4,
  "name": "iPhone 15 Pro",
  "price": 7999,
  "originalPrice": 8999,
  "image": "https://picsum.photos/400/400?random=1",
  "images": ["https://picsum.photos/400/400?random=1"],
  "sales": 5200,
  "stock": 100,
  "specs": {...},
  "description": "...",
  "tags": ["热销", "旗舰"],
  "status": "active",
  "isHot": true,
  "isNew": true,
  "isRecommend": true
}
```

---

### 3. 获取热门商品
**接口**: `GET /api/goods/hot`

**查询参数**:
- `limit` - 返回数量，默认10

**请求示例**:
```
GET /api/goods/hot?limit=10
```

---

### 4. 获取新品
**接口**: `GET /api/goods/new`

**查询参数**:
- `limit` - 返回数量，默认10

---

### 5. 获取推荐商品
**接口**: `GET /api/goods/recommend`

**查询参数**:
- `limit` - 返回数量，默认10

---

### 6. 批量获取商品
**接口**: `GET /api/goods/batch/:ids`

**请求示例**:
```
GET /api/goods/batch/1,2,3,4,5
```

---

### 7. 创建商品（管理员）
**接口**: `POST /api/goods`

**需要认证**: ✅ 需要管理员权限

**请求参数**:
```json
{
  "categoryId": 4,
  "name": "新商品",
  "price": 999,
  "originalPrice": 1299,
  "image": "https://...",
  "images": ["https://...", "https://..."],
  "stock": 100,
  "specs": {
    "brand": "Apple",
    "model": "..."
  },
  "description": "商品描述",
  "tags": ["热销", "新品"],
  "status": "active",
  "isHot": true,
  "isNew": true,
  "isRecommend": true
}
```

**请求头**:
```
Authorization: Bearer {admin_token}
```

---

### 8. 更新商品（管理员）
**接口**: `PUT /api/goods/:id`

**需要认证**: ✅ 需要管理员权限

---

### 9. 删除商品（管理员）
**接口**: `DELETE /api/goods/:id`

**需要认证**: ✅ 需要管理员权限

---

### 10. 更新库存（管理员）
**接口**: `PUT /api/goods/:id/stock`

**需要认证**: ✅ 需要管理员权限

**请求参数**:
```json
{
  "stock": 50,        // 库存数量
  "operation": "set"   // 操作类型：set/add/subtract
}
```

---

## 📁 分类模块

### 1. 获取分类树
**接口**: `GET /api/categories`

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "手机数码",
    "parentId": 0,
    "sortOrder": 1,
    "icon": "phone",
    "status": "active",
    "children": [
      {
        "id": 4,
        "name": "平板电脑",
        "parentId": 1,
        "sortOrder": 1,
        "icon": "tablet",
        "status": "active",
        "children": []
      },
      {
        "id": 5,
        "name": "耳机音响",
        "parentId": 1,
        "sortOrder": 2,
        "icon": "headphone",
        "status": "active",
        "children": []
      }
    ]
  }
]
```

---

### 2. 获取分类列表（扁平）
**接口**: `GET /api/categories/flat`

---

### 3. 获取分类详情
**接口**: `GET /api/categories/:id`

---

### 4. 获取分类下的商品
**接口**: `GET /api/categories/:id/goods`

**查询参数**:
- `page` - 页码
- `limit` - 每页数量
- `sort` - 排序字段
- `order` - 排序方向

**响应示例**:
```json
{
  "goods": [...],
  "total": 8,
  "page": 1,
  "limit": 20
}
```

---

### 5. 创建分类（管理员）
**接口**: `POST /api/categories`

**需要认证**: ✅ 需要管理员权限

**请求参数**:
```json
{
  "name": "新分类",
  "parentId": 0,
  "sortOrder": 1,
  "icon": "icon_name",
  "status": "active"
}
```

---

### 6. 更新分类（管理员）
**接口**: `PUT /api/categories/:id`

**需要认证**: ✅ 需要管理员权限

---

### 7. 删除分类（管理员）
**接口**: `DELETE /api/categories/:id`

**需要认证**: ✅ 需要管理员权限

---

## 🛒 购物车模块

### 1. 获取购物车
**接口**: `GET /api/cart/user/:userId`

**需要认证**: ✅

**请求示例**:
```
GET /api/cart/user/2
Authorization: Bearer {token}
```

**响应示例**:
```json
[
  {
    "id": 1,
    "userId": 2,
    "goodsId": 1,
    "name": "iPhone 15 Pro",
    "price": 7999,
    "image": "https://...",
    "quantity": 2,
    "selected": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. 添加到购物车
**接口**: `POST /api/cart`

**需要认证**: ✅

**请求参数**:
```json
{
  "userId": 2,
  "goodsId": 1,
  "name": "iPhone 15 Pro",
  "price": 7999,
  "image": "https://...",
  "quantity": 1,
  "selected": true
}
```

**响应示例**:
```json
{
  "id": 1,
  "userId": 2,
  "goodsId": 1,
  "name": "iPhone 15 Pro",
  "price": 7999,
  "image": "https://...",
  "quantity": 1,
  "selected": true
}
```

**注意**: 如果商品已在购物车中，会自动增加数量

---

### 3. 更新购物车项
**接口**: `PUT /api/cart/:id`

**需要认证**: ✅

**请求参数**:
```json
{
  "quantity": 3,
  "selected": true
}
```

---

### 4. 删除购物车项
**接口**: `DELETE /api/cart/:id`

**需要认证**: ✅

---

### 5. 清空购物车
**接口**: `DELETE /api/cart/clear/:userId`

**需要认证**: ✅

---

### 6. 全选/取消全选
**接口**: `PUT /api/cart/select-all/:userId`

**需要认证**: ✅

**请求参数**:
```json
{
  "selected": true
}
```

---

## 📋 订单模块

### 1. 获取用户订单列表
**接口**: `GET /api/orders/user/:userId`

**需要认证**: ✅

**响应示例**:
```json
[
  {
    "id": 1,
    "userId": 2,
    "orderNo": "ORDER1704067200000123",
    "addressId": 1,
    "totalAmount": 15998,
    "discountAmount": 0,
    "pointsUsed": 0,
    "pointsDiscount": 0,
    "finalAmount": 15998,
    "status": "pending",
    "statusLabel": "待支付",
    "paymentStatus": "unpaid",
    "paymentStatusLabel": "未支付",
    "paymentMethod": "",
    "paymentTime": null,
    "shippingTime": null,
    "receivedTime": null,
    "cancelReason": "",
    "remark": "",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "items": [
      {
        "id": 1,
        "orderId": 1,
        "goodsId": 1,
        "name": "iPhone 15 Pro",
        "price": 7999,
        "image": "https://...",
        "quantity": 2
      }
    ]
  }
]
```

---

### 2. 获取订单详情
**接口**: `GET /api/orders/detail/:id`

**需要认证**: ✅

**响应示例**:
```json
{
  "id": 1,
  "userId": 2,
  "orderNo": "ORDER1704067200000123",
  "totalAmount": 15998,
  "finalAmount": 15998,
  "status": "paid",
  "statusLabel": "已支付",
  "paymentStatus": "paid",
  "paymentStatusLabel": "已支付",
  "items": [...],
  "history": [
    {
      "id": 1,
      "orderId": 1,
      "status": "pending",
      "remark": "订单创建",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "orderId": 1,
      "status": "paid",
      "remark": "支付成功",
      "createdAt": "2024-01-01T00:05:00.000Z"
    }
  ]
}
```

---

### 3. 创建订单
**接口**: `POST /api/orders`

**需要认证**: ✅

**请求参数**:
```json
{
  "userId": 2,
  "items": [
    {
      "goodsId": 1,
      "name": "iPhone 15 Pro",
      "price": 7999,
      "image": "https://...",
      "quantity": 2
    }
  ],
  "addressId": 1,
  "totalAmount": 15998,
  "pointsUsed": 100,
  "remark": "备注信息"
}
```

**响应示例**:
```json
{
  "id": 1,
  "userId": 2,
  "orderNo": "ORDER1704067200000123",
  "totalAmount": 15998,
  "pointsUsed": 100,
  "pointsDiscount": 1,
  "finalAmount": 15997,
  "status": "pending",
  "statusLabel": "待支付",
  "paymentStatus": "unpaid",
  "paymentStatusLabel": "未支付",
  "items": [...]
}
```

**订单状态流转**:
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

---

### 4. 更新订单状态
**接口**: `PUT /api/orders/:id/status`

**需要认证**: ✅

**请求参数**:
```json
{
  "status": "shipped",
  "remark": "已发货"
}
```

**注意**: 状态转换必须符合流转规则

---

### 5. 更新支付状态
**接口**: `PUT /api/orders/:id/payment-status`

**需要认证**: ✅

**请求参数**:
```json
{
  "paymentStatus": "paid",
  "paymentMethod": "alipay",
  "transactionId": "2024010100000000123"
}
```

---

### 6. 取消订单
**接口**: `DELETE /api/orders/:id`

**需要认证**: ✅

**请求参数**:
```json
{
  "cancelReason": "不想要了"
}
```

**注意**: 只有pending和paid状态的订单可以取消

---

## 💳 支付模块

### 1. 获取支付方式列表
**接口**: `GET /api/payments/methods`

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "支付宝",
    "code": "alipay",
    "icon": "https://example.com/alipay.png",
    "status": "active",
    "sortOrder": 1
  },
  {
    "id": 2,
    "name": "微信支付",
    "code": "wechat",
    "icon": "https://example.com/wechat.png",
    "status": "active",
    "sortOrder": 2
  },
  {
    "id": 3,
    "name": "余额支付",
    "code": "balance",
    "icon": "https://example.com/balance.png",
    "status": "active",
    "sortOrder": 3
  }
]
```

---

### 2. 创建支付
**接口**: `POST /api/payments/create`

**需要认证**: ✅

**请求参数**:
```json
{
  "orderId": 1,
  "paymentMethodId": 1
}
```

**响应示例**:
```json
{
  "paymentId": 1,
  "paymentUrl": "https://openapi.alipay.com/gateway.do",
  "paymentParams": {
    "out_trade_no": "1",
    "total_amount": 15997,
    "subject": "订单ORDER1704067200000123",
    "notify_url": "http://localhost:3001/api/payments/callback/alipay"
  },
  "status": "pending"
}
```

---

### 3. 支付宝回调
**接口**: `POST /api/payments/callback/alipay`

**不需要认证**: ❌ 第三方回调

---

### 4. 微信支付回调
**接口**: `POST /api/payments/callback/wechat`

**不需要认证**: ❌ 第三方回调

---

### 5. 查询支付状态
**接口**: `GET /api/payments/status/:paymentId`

**需要认证**: ✅

---

## ⭐ 评价模块

### 1. 获取商品评价
**接口**: `GET /api/reviews/goods/:goodsId`

**查询参数**:
- `page` - 页码
- `limit` - 每页数量
- `rating` - 评分（1-5）

**响应示例**:
```json
{
  "reviews": [
    {
      "id": 1,
      "userId": 2,
      "goodsId": 1,
      "orderId": 1,
      "rating": 5,
      "content": "非常好用！",
      "images": ["https://...", "https://..."],
      "reply": "",
      "replyAt": null,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "nickname": "科技极客",
      "avatar": "https://..."
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "stats": {
    "total": 10,
    "averageRating": 4.5,
    "fiveStar": 6,
    "fourStar": 2,
    "threeStar": 1,
    "twoStar": 1,
    "oneStar": 0
  }
}
```

---

### 2. 获取用户评价
**接口**: `GET /api/reviews/user/:userId`

**需要认证**: ✅

---

### 3. 创建评价
**接口**: `POST /api/reviews`

**需要认证**: ✅

**请求参数**:
```json
{
  "userId": 2,
  "goodsId": 1,
  "orderId": 1,
  "rating": 5,
  "content": "非常好用！",
  "images": ["https://...", "https://..."]
}
```

**注意**: 
- 评分必须在1-5之间
- 同一用户对同一商品只能评价一次
- 只能评价已完成的订单

---

### 4. 更新评价
**接口**: `PUT /api/reviews/:id`

**需要认证**: ✅

**请求参数**:
```json
{
  "rating": 4,
  "content": "修改后的评价",
  "images": ["https://..."]
}
```

---

### 5. 删除评价
**接口**: `DELETE /api/reviews/:id`

**需要认证**: ✅

---

### 6. 回复评价（管理员）
**接口**: `PUT /api/reviews/:id/reply`

**需要认证**: ✅ 需要管理员权限

**请求参数**:
```json
{
  "reply": "感谢您的评价！"
}
```

---

### 7. 更新评价状态（管理员）
**接口**: `PUT /api/reviews/:id/status`

**需要认证**: ✅ 需要管理员权限

**请求参数**:
```json
{
  "status": "active"
}
```

---

## ❤️ 收藏模块

### 1. 获取用户收藏
**接口**: `GET /api/favorites/user/:userId`

**需要认证**: ✅

**响应示例**:
```json
[
  {
    "id": 1,
    "userId": 2,
    "goodsId": 1,
    "name": "iPhone 15 Pro",
    "price": 7999,
    "image": "https://...",
    "sales": 5200,
    "stock": 100,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. 检查是否收藏
**接口**: `GET /api/favorites/check/:userId/:goodsId`

**需要认证**: ✅

**响应示例**:
```json
{
  "isFavorite": true
}
```

---

### 3. 添加收藏
**接口**: `POST /api/favorites`

**需要认证**: ✅

**请求参数**:
```json
{
  "userId": 2,
  "goodsId": 1
}
```

**注意**: 同一商品不能重复收藏

---

### 4. 删除收藏
**接口**: `DELETE /api/favorites/:id`

**需要认证**: ✅

---

### 5. 取消收藏
**接口**: `DELETE /api/favorites/user/:userId/goods/:goodsId`

**需要认证**: ✅

---

## 📍 地址模块

### 1. 获取用户地址
**接口**: `GET /api/addresses/user/:userId`

**需要认证**: ✅

**响应示例**:
```json
[
  {
    "id": 1,
    "userId": 2,
    "receiverName": "张三",
    "receiverPhone": "13800138000",
    "province": "北京市",
    "city": "北京市",
    "district": "朝阳区",
    "detailAddress": "某某街道123号",
    "postalCode": "100000",
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. 获取地址详情
**接口**: `GET /api/addresses/:id`

**需要认证**: ✅

---

### 3. 添加地址
**接口**: `POST /api/addresses`

**需要认证**: ✅

**请求参数**:
```json
{
  "userId": 2,
  "receiverName": "张三",
  "receiverPhone": "13800138000",
  "province": "北京市",
  "city": "北京市",
  "district": "朝阳区",
  "detailAddress": "某某街道123号",
  "postalCode": "100000",
  "isDefault": true
}
```

**注意**: 设置为默认地址时，会自动取消其他默认地址

---

### 4. 更新地址
**接口**: `PUT /api/addresses/:id`

**需要认证**: ✅

**请求参数**:
```json
{
  "receiverName": "李四",
  "receiverPhone": "13900139000",
  "province": "上海市",
  "city": "上海市",
  "district": "浦东新区",
  "detailAddress": "某某路456号",
  "postalCode": "200000",
  "isDefault": false
}
```

---

### 5. 删除地址
**接口**: `DELETE /api/addresses/:id`

**需要认证**: ✅

---

### 6. 设置默认地址
**接口**: `PUT /api/addresses/:id/default`

**需要认证**: ✅

---

## 💰 积分模块

### 1. 获取积分记录
**接口**: `GET /api/points/user/:userId`

**需要认证**: ✅

**响应示例**:
```json
[
  {
    "id": 1,
    "userId": 2,
    "type": "earn",
    "amount": 100,
    "balance": 100,
    "description": "订单完成获得积分",
    "relatedType": "order",
    "relatedId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. 获取积分余额
**接口**: `GET /api/points/balance/:userId`

**需要认证**: ✅

**响应示例**:
```json
{
  "balance": 500,
  "stats": {
    "earnCount": 10,
    "spendCount": 5,
    "totalEarned": 1000,
    "totalSpent": 500
  }
}
```

---

### 3. 获得积分
**接口**: `POST /api/points/earn`

**需要认证**: ✅

**请求参数**:
```json
{
  "userId": 2,
  "amount": 100,
  "description": "订单完成获得积分",
  "relatedType": "order",
  "relatedId": 1
}
```

**响应示例**:
```json
{
  "record": {
    "id": 1,
    "userId": 2,
    "type": "earn",
    "amount": 100,
    "balance": 600,
    "description": "订单完成获得积分",
    "relatedType": "order",
    "relatedId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "balance": 600
}
```

---

### 4. 消费积分
**接口**: `POST /api/points/spend`

**需要认证**: ✅

**请求参数**:
```json
{
  "userId": 2,
  "amount": 50,
  "description": "积分抵扣",
  "relatedType": "order",
  "relatedId": 1
}
```

**注意**: 积分余额必须足够

---

### 5. 积分返还
**接口**: `POST /api/points/refund`

**需要认证**: ✅

**请求参数**:
```json
{
  "userId": 2,
  "amount": 50,
  "description": "订单取消返还积分",
  "relatedType": "order",
  "relatedId": 1
}
```

---

## 🔔 通知模块

### 1. 获取用户通知
**接口**: `GET /api/notifications/user/:userId`

**需要认证**: ✅

**查询参数**:
- `page` - 页码
- `limit` - 每页数量
- `isRead` - 是否已读（true/false）

**响应示例**:
```json
{
  "notifications": [
    {
      "id": 1,
      "userId": 2,
      "type": "order",
      "title": "订单支付成功",
      "content": "您的订单ORDER1704067200000123已支付成功",
      "data": {
        "orderId": 1,
        "orderNo": "ORDER1704067200000123"
      },
      "isRead": false,
      "readAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "unreadCount": 5
}
```

---

### 2. 获取未读数量
**接口**: `GET /api/notifications/unread-count/:userId`

**需要认证**: ✅

**响应示例**:
```json
{
  "count": 5
}
```

---

### 3. 获取通知详情
**接口**: `GET /api/notifications/:id`

**需要认证**: ✅

---

### 4. 创建通知
**接口**: `POST /api/notifications`

**需要认证**: ✅

**请求参数**:
```json
{
  "userId": 2,
  "type": "order",
  "title": "订单支付成功",
  "content": "您的订单已支付成功",
  "data": {
    "orderId": 1,
    "orderNo": "ORDER1704067200000123"
  }
}
```

---

### 5. 标记为已读
**接口**: `PUT /api/notifications/:id/read`

**需要认证**: ✅

---

### 6. 全部标记为已读
**接口**: `PUT /api/notifications/read-all/:userId`

**需要认证**: ✅

---

### 7. 删除通知
**接口**: `DELETE /api/notifications/:id`

**需要认证**: ✅

---

## 📊 统计模块

### 1. 获取概览统计（管理员）
**接口**: `GET /api/statistics/overview`

**需要认证**: ✅ 需要管理员权限

**响应示例**:
```json
{
  "today": {
    "orders": 10,
    "revenue": 50000
  },
  "yesterday": {
    "orders": 8,
    "revenue": 40000
  },
  "thisMonth": {
    "orders": 200,
    "revenue": 1000000
  },
  "lastMonth": {
    "orders": 180,
    "revenue": 900000
  },
  "totals": {
    "users": 1000,
    "goods": 500,
    "orders": 5000
  },
  "recentOrders": [...],
  "topGoods": [...]
}
```

---

### 2. 获取销售统计（管理员）
**接口**: `GET /api/statistics/sales`

**需要认证**: ✅ 需要管理员权限

**查询参数**:
- `days` - 统计天数，默认30

**响应示例**:
```json
[
  {
    "date": "2024-01-01",
    "orders": 10,
    "revenue": 50000
  },
  {
    "date": "2024-01-02",
    "orders": 12,
    "revenue": 60000
  }
]
```

---

### 3. 获取订单统计（管理员）
**接口**: `GET /api/statistics/orders`

**需要认证**: ✅ 需要管理员权限

**响应示例**:
```json
[
  {
    "status": "pending",
    "count": 10,
    "totalAmount": 50000
  },
  {
    "status": "paid",
    "count": 8,
    "totalAmount": 40000
  }
]
```

---

### 4. 获取商品统计（管理员）
**接口**: `GET /api/statistics/goods`

**需要认证**: ✅ 需要管理员权限

**响应示例**:
```json
{
  "total": 500,
  "active": 450,
  "lowStock": 20,
  "byCategory": [
    {
      "categoryName": "手机数码",
      "goodsCount": 200,
      "totalSales": 10000
    }
  ]
}
```

---

### 5. 获取用户统计（管理员）
**接口**: `GET /api/statistics/users`

**需要认证**: ✅ 需要管理员权限

**响应示例**:
```json
{
  "total": 1000,
  "active": 950,
  "newUsers": [
    {
      "date": "2024-01-01",
      "count": 10
    }
  ],
  "topUsers": [
    {
      "id": 1,
      "nickname": "用户1",
      "avatar": "https://...",
      "orderCount": 50,
      "totalSpent": 100000
    }
  ]
}
```

---

## 📝 日志模块

### 1. 获取日志列表（管理员）
**接口**: `GET /api/logs`

**需要认证**: ✅ 需要管理员权限

**查询参数**:
- `page` - 页码
- `limit` - 每页数量
- `action` - 操作类型
- `module` - 模块名称
- `status` - 状态（success/error）
- `userId` - 用户ID

**响应示例**:
```json
{
  "logs": [
    {
      "id": 1,
      "userId": 2,
      "action": "login",
      "module": "auth",
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "requestData": {...},
      "responseData": {...},
      "status": "success",
      "errorMessage": "",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "username": "user",
      "nickname": "科技极客"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

### 2. 获取日志详情（管理员）
**接口**: `GET /api/logs/:id`

**需要认证**: ✅ 需要管理员权限

---

### 3. 获取日志统计（管理员）
**接口**: `GET /api/logs/stats/summary`

**需要认证**: ✅ 需要管理员权限

**查询参数**:
- `days` - 统计天数，默认7

**响应示例**:
```json
{
  "total": 1000,
  "success": 950,
  "error": 50,
  "byModule": [
    {
      "module": "auth",
      "count": 200,
      "errorCount": 5
    }
  ],
  "topActions": [
    {
      "action": "login",
      "count": 500
    }
  ]
}
```

---

### 4. 清理旧日志（管理员）
**接口**: `DELETE /api/logs/cleanup`

**需要认证**: ✅ 需要管理员权限

**请求参数**:
```json
{
  "days": 30
}
```

---

## 📖 使用示例

### JavaScript/Fetch示例

```javascript
// 1. 登录
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'user',
    password: 'user123'
  })
});

const { user, token } = await loginResponse.json();

// 2. 获取商品列表
const goodsResponse = await fetch('http://localhost:3001/api/goods', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { goods } = await goodsResponse.json();

// 3. 添加到购物车
const cartResponse = await fetch('http://localhost:3001/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    userId: user.id,
    goodsId: 1,
    name: 'iPhone 15 Pro',
    price: 7999,
    image: 'https://...',
    quantity: 1
  })
});
```

---

### Axios示例

```javascript
import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000
});

// 请求拦截器（自动添加token）
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 1. 登录
const { data } = await api.post('/api/auth/login', {
  username: 'user',
  password: 'user123'
});

const { user, token } = data;
localStorage.setItem('token', token);

// 2. 获取商品列表
const { data: goodsData } = await api.get('/api/goods', {
  params: {
    page: 1,
    limit: 20,
    keyword: 'iPhone'
  }
});

// 3. 创建订单
const { data: orderData } = await api.post('/api/orders', {
  userId: user.id,
  items: [...],
  addressId: 1,
  totalAmount: 15998
});
```

---

### Vue.js示例

```javascript
// api.js
import axios from 'axios';

const request = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3001',
  timeout: 10000
});

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;

// goods.js
import request from './api';

export function getGoodsList(params) {
  return request.get('/api/goods', { params });
}

export function getGoodsDetail(id) {
  return request.get(`/api/goods/${id}`);
}

export function getHotGoods(limit = 10) {
  return request.get('/api/goods/hot', { params: { limit } });
}

// 在组件中使用
import { getGoodsList } from '@/api/goods';

export default {
  data() {
    return {
      goods: [],
      loading: false
    };
  },
  async created() {
    this.loading = true;
    const { data } = await getGoodsList({
      page: 1,
      limit: 20
    });
    this.goods = data.goods;
    this.loading = false;
  }
};
```

---

## ⚠️ 注意事项

### 1. 认证
- 大部分接口需要JWT token认证
- Token有效期为7天
- Token过期后需要重新登录
- 请求头格式：`Authorization: Bearer {token}`

### 2. 权限
- 管理员接口需要管理员权限
- 普通用户只能访问自己的数据
- 跨用户访问会返回403错误

### 3. 错误处理
- 所有接口都有统一的错误处理
- 建议前端统一处理错误响应
- 401错误应跳转到登录页

### 4. 分页
- 列表接口都支持分页
- 默认每页20条
- 使用page和limit参数控制

### 5. 数据验证
- 前端应进行基本的数据验证
- 必填字段不能为空
- 数值字段应在合理范围内

### 6. 性能优化
- 建议使用防抖处理搜索输入
- 列表数据建议使用虚拟滚动
- 图片建议使用懒加载

---

## 🎯 快速开始

### 步骤1：登录获取token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user123"}'
```

### 步骤2：使用token访问其他接口
```bash
curl http://localhost:3001/api/goods \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 步骤3：测试完整流程
1. 登录 → 获取token
2. 获取商品列表 → 浏览商品
3. 添加到购物车 → 选择商品
4. 创建订单 → 提交订单
5. 查询订单状态 → 跟踪订单

---

## 📞 技术支持

如有问题，请检查：
1. 服务器日志
2. 数据库连接状态
3. 网络连接
4. API响应错误信息

---

**文档版本**: 1.0.0  
**最后更新**: 2024-01-01  
**API版本**: v1
