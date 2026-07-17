# API 接口文档 — 个人记账助手

> 后端基于 **uniCloud 阿里云 Serverless**，所有接口通过 `uniCloud.callFunction()` 调用。

---

## 通用说明

| 项目 | 说明 |
|------|------|
| 调用方式 | `uniCloud.callFunction({ name: '云函数名', data: {...} })` |
| 响应格式 | `{ code: 0, data: {}, message: "xxx" }` |
| 成功码 | `code === 0` |
| 数据库 | MongoDB (阿里云) |
| 认证 | 暂未启用 uni-id，基于设备标识 |

### 统一错误码

| code | 含义 |
|------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 404 | 目标记录不存在 |
| 409 | 资源冲突（如分类名重复） |
| 500 | 服务器内部错误 |

---

## 接口列表（共 6 个）

### 1. add-bill — 添加账单

**云函数名**: `add-bill`

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|:--:|------|------|
| type | String | ✅ | 账单类型 | `"income"` / `"expense"` |
| amount | Number | ✅ | 金额（必须 > 0） | `35.5` |
| category | String | ✅ | 分类名称 | `"餐饮"` |
| date | String | ✅ | 日期 | `"2026-07-15"` |
| remark | String | ❌ | 备注（默认空） | `"午餐外卖"` |

**请求示例**:
```js
uniCloud.callFunction({
  name: 'add-bill',
  data: {
    type: 'expense',
    amount: 35.5,
    category: '餐饮',
    date: '2026-07-15',
    remark: '午餐外卖'
  }
})
```

**成功响应**:
```json
{
  "code": 0,
  "data": { "id": "64b3f2a1e4b0a1c2d3e4f5a6" },
  "message": "添加成功"
}
```

**异常响应**:
```json
{ "code": 400, "message": "金额必须大于0" }
{ "code": 400, "message": "账单类型无效，必须为 income 或 expense" }
```

---

### 2. get-bills — 获取账单列表

**云函数名**: `get-bills`

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|:--:|------|:--:|
| type | String | ❌ | 筛选类型 | 返回全部 |
| month | String | ❌ | 月份筛选 YYYY-MM | - |
| page | Number | ❌ | 页码 | `1` |
| pageSize | Number | ❌ | 每页条数 | `20` |

**请求示例**:
```js
uniCloud.callFunction({
  name: 'get-bills',
  data: {
    type: 'expense',
    month: '2026-07',
    page: 1,
    pageSize: 20
  }
})
```

**成功响应**:
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "_id": "64b3f2a1...",
        "type": "expense",
        "amount": 35.5,
        "category": "餐饮",
        "date": "2026-07-15",
        "remark": "午餐外卖",
        "createTime": "2026-07-15T04:30:00.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "pageSize": 20
  },
  "message": "success"
}
```

---

### 3. get-statistics — 获取月度统计

**云函数名**: `get-statistics`

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|:--:|------|:--:|
| month | String | ❌ | 统计月份 YYYY-MM | 当前月份 |

**请求示例**:
```js
uniCloud.callFunction({
  name: 'get-statistics',
  data: { month: '2026-07' }
})
```

**成功响应**:
```json
{
  "code": 0,
  "data": {
    "month": "2026-07",
    "totalIncome": 15000,
    "totalExpense": 8500.5,
    "balance": 6499.5,
    "billCount": 28,
    "categoryBreakdown": [
      { "category": "工资",  "income": 15000, "expense": 0 },
      { "category": "餐饮",  "income": 0,     "expense": 3200 },
      { "category": "购物",  "income": 0,     "expense": 1800 },
      { "category": "交通",  "income": 0,     "expense": 500.5 }
    ]
  },
  "message": "success"
}
```

**字段说明**:
| 字段 | 说明 |
|------|------|
| totalIncome | 当月总收入合计 |
| totalExpense | 当月总支出合计 |
| balance | 结余 = 收入 - 支出 |
| billCount | 当月账单总笔数 |
| categoryBreakdown | 按分类分组的明细数组 |

---

### 4. delete-bill — 删除账单

**云函数名**: `delete-bill`

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| id | String | ✅ | 账单记录的 `_id` |

**请求示例**:
```js
uniCloud.callFunction({
  name: 'delete-bill',
  data: { id: '64b3f2a1e4b0a1c2d3e4f5a6' }
})
```

**成功响应**:
```json
{ "code": 0, "data": { "deleted": 1 }, "message": "删除成功" }
```

**异常响应**:
```json
{ "code": 400, "message": "缺少账单ID" }
{ "code": 404, "message": "账单不存在" }
```

---

### 5. get-categories — 获取分类列表

**云函数名**: `get-categories`

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|:--:|------|:--:|
| type | String | ❌ | 筛选类型 | 返回全部 |

**请求示例**:
```js
uniCloud.callFunction({
  name: 'get-categories',
  data: { type: 'expense' }
})
```

**成功响应**:
```json
{
  "code": 0,
  "data": [
    { "_id": "abc001", "name": "餐饮", "type": "expense", "icon": "🍜", "sort": 1 },
    { "_id": "abc002", "name": "交通", "type": "expense", "icon": "🚗", "sort": 2 },
    { "_id": "abc003", "name": "购物", "type": "expense", "icon": "🛍️", "sort": 3 }
  ],
  "message": "success"
}
```

---

### 6. add-category — 添加分类

**云函数名**: `add-category`

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|:--:|------|:--:|
| name | String | ✅ | 分类名称 | - |
| type | String | ✅ | `"income"` / `"expense"` | - |
| icon | String | ❌ | emoji 图标 | `"📌"` |

**请求示例**:
```js
uniCloud.callFunction({
  name: 'add-category',
  data: { name: '宠物', type: 'expense', icon: '🐱' }
})
```

**成功响应**:
```json
{ "code": 0, "data": { "id": "def001" }, "message": "添加成功" }
```

**异常响应**:
```json
{ "code": 400, "message": "分类名称和类型不能为空" }
{ "code": 409, "message": "该分类已存在" }
```

---

## 接口调用流程图

```
[前端 Vue 页面]
     │  uniCloud.callFunction()
     ▼
[uniCloud 网关]
     │  路由到对应云函数
     ▼
[云函数 (Node.js)]
     │  db.collection().add() / .find() / .remove()
     ▼
[MongoDB 数据库]
```

---

## 数据库集合结构

### bills（账单）

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `_id` | ObjectId | 自动 | 主键 |
| `type` | String | ✅ | `income` / `expense` |
| `amount` | Number | ✅ | 金额 |
| `category` | String | ✅ | 分类名称 |
| `date` | String | ✅ | YYYY-MM-DD |
| `remark` | String | ❌ | 备注 |
| `createTime` | Date | 自动 | 创建时间 |

### categories（分类）

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `_id` | ObjectId | 自动 | 主键 |
| `name` | String | ✅ | 分类名称 |
| `type` | String | ✅ | `income` / `expense` |
| `icon` | String | ❌ | emoji 图标 |
| `sort` | Number | ❌ | 排序权重 |
