# Prompt 日志 (prompt_log.md)

本文档记录了项目开发过程中使用 AI 辅助编程的完整对话记录，每条 Prompt 标注了对应的功能和文件。

---

## 1. 项目初始化与架构设计

**Prompt:**
```
我需要在 HBuilder X 中创建一个基于 uni-app (Vue3) + uniCloud 阿里云的个人记账助手项目。
需要包含以下功能：
1. 月度收支概览（首页）
2. 添加记账记录
3. 账单列表与筛选
4. 分类管理
请帮我规划项目结构和数据库设计。
```

**对应功能/文件:**
- 项目整体架构设计
- 数据库 Schema 设计 → `bills.schema.json`, `categories.schema.json`
- 页面路由规划 → `pages.json`

**AI 输出摘要:**
建议使用 4 个 tabBar 页面（首页/记账/账单/我的），2 个数据库集合（bills/categories），6 个云函数覆盖 CRUD 操作。

---

## 2. 云函数 add-bill 开发

**Prompt:**
```
请帮我写一个 uniCloud 云函数 add-bill，接收 type、amount、category、date、remark 参数，
校验参数合法性后写入 bills 集合，返回标准 JSON 结果 { code, data, message }。
需要处理异常情况，返回对应的错误码。
```

**对应功能/文件:**
- 添加账单记录 → `uniCloud-alipay/cloudfunctions/add-bill/index.js`

**AI 输出摘要:**
```javascript
exports.main = async (event, context) => {
  // 参数校验：type 必须为 income/expense，amount > 0
  // 写入数据库并返回结果
  // try-catch 包裹异常处理
}
```

---

## 3. 云函数 get-bills 开发

**Prompt:**
```
编写一个 uniCloud 云函数 get-bills，支持分页查询账单列表。
支持按 type（收入/支出）和 month（月份 YYYY-MM）筛选，
按日期降序排列，返回 { code, data: { list, total, page, pageSize }, message }。
```

**对应功能/文件:**
- 账单列表查询 → `uniCloud-alipay/cloudfunctions/get-bills/index.js`

**AI 输出摘要:**
使用 `db.collection('bills').where(where).orderBy('date', 'desc').skip().limit().get()` 实现分页查询，月份筛选使用 `db.command.gte/lte` 匹配日期范围。

---

## 4. 云函数 get-statistics 开发

**Prompt:**
```
写一个云函数 get-statistics，接收 month 参数，统计指定月份的总收入、总支出、结余，
以及按分类的收支明细汇总。返回格式 { code, data: { totalIncome, totalExpense, balance, categoryBreakdown } }。
```

**对应功能/文件:**
- 月度统计 → `uniCloud-alipay/cloudfunctions/get-statistics/index.js`

**AI 输出摘要:**
遍历当月账单数据，累加收入/支出金额，按 category 分组统计。categoryBreakdown 按总金额降序排列。

---

## 5. 云函数 delete-bill 开发

**Prompt:**
```
编写一个云函数 delete-bill，根据传入的 id 删除 bills 集合中的记录。
需要校验 id 是否为空，删除不存在的记录返回 404。
```

**对应功能/文件:**
- 删除账单 → `uniCloud-alipay/cloudfunctions/delete-bill/index.js`

**AI 输出摘要:**
使用 `db.collection('bills').doc(id).remove()`，判断 `deleted === 0` 时返回 404 错误。

---

## 6. 云函数 get-categories 开发

**Prompt:**
```
写一个云函数 get-categories，支持按 type 筛选分类列表。
按 sort 字段升序排列。
```

**对应功能/文件:**
- 获取分类列表 → `uniCloud-alipay/cloudfunctions/get-categories/index.js`

**AI 输出摘要:**
根据可选 type 参数构建 where 条件，使用 `orderBy('sort', 'asc')` 排序。

---

## 7. 云函数 add-category 开发

**Prompt:**
```
编写 add-category 云函数，接收 name、type、icon 参数。
需要检查分类是否重名（同 type 下不能重名），重名返回 409。
```

**对应功能/文件:**
- 添加分类 → `uniCloud-alipay/cloudfunctions/add-category/index.js`

**AI 输出摘要:**
先 `count()` 查询是否存在同名同类型记录，存在返回 409，不存在则 `add()`。

---

## 8. 首页（Dashboard）开发

**Prompt:**
```
请帮我写一个 uni-app Vue3 的首页页面（pages/index/index.vue），包含以下功能：
1. 顶部月度概览卡片，显示选中月份的收入/支出/结余，支持月份左右切换（不能超过当前月）
2. 分类排行列表，按金额降序展示
3. 最近 5 条账单记录
4. 调用 get-statistics 和 get-bills 云函数获取数据
5. 使用现代简洁的 UI 风格，蓝色主题
```

**对应功能/文件:**
- 首页 → `pages/index/index.vue`

**AI 输出摘要:**
使用渐变蓝色卡片展示月度概览，自定义 month-selector 组件实现月份切换（prevMonth/nextMonth），onShow 时调用云函数加载数据。分类排行带序号，第 1 名高亮。

---

## 9. 记账页（Add）开发

**Prompt:**
```
写一个记账页面 pages/add/add.vue，要求：
1. 顶部支出/收入切换器（类似 iOS 分段控件）
2. 大号金额输入框
3. 横向滚动分类选择器（从 get-categories 云函数加载，首次自动初始化默认分类）
4. 日期选择器（picker mode="date"）
5. 备注输入框（选填）
6. 保存按钮调用 add-bill 云函数
```

**对应功能/文件:**
- 记账页 → `pages/add/add.vue`

**AI 输出摘要:**
type-switch 使用 flex 布局的切换按钮，支出高亮红色、收入高亮绿色。category-scroll 横向滚动展示分类标签。首次加载时若无分类，自动调用 add-category 初始化 9 个默认分类（5 支出 + 4 收入）。

---

## 10. 账单列表页（List）开发

**Prompt:**
```
写一个账单列表页 pages/list/list.vue，功能包括：
1. 顶部筛选栏：月份选择 + 全部/支出/收入 类型切换
2. 账单卡片列表，每项显示分类、日期、金额（收入绿色/支出红色）、备注
3. 支持分页加载更多
4. 点击显示详情弹窗（uni.showModal）
5. 左滑或按钮删除（带确认弹窗）
6. 空状态提示
```

**对应功能/文件:**
- 账单列表页 → `pages/list/list.vue`

**AI 输出摘要:**
筛选栏使用 picker mode="date" fields="month" 选择月份，类型筛选用三个按钮切换。列表数据通过 get-bills 云函数分页获取，loadMore 追加数据。删除使用 uni.showModal 确认后调用 delete-bill。

---

## 11. 我的页面（Mine）开发

**Prompt:**
```
编写 pages/mine/mine.vue，包含：
1. 顶部用户信息卡片（展示 app 名称和标语）
2. 分类管理：展示支出分类和收入分类的网格，支持添加新分类
3. 添加分类弹窗：选择类型（支出/收入）、输入名称和图标 emoji
4. 关于信息：版本号、技术栈
```

**对应功能/文件:**
- 我的页 → `pages/mine/mine.vue`

**AI 输出摘要:**
分类管理使用 grid 布局展示分类卡片。弹窗使用自定义 dialog-mask 遮罩层实现。添加分类调用 add-category 云函数，成功后刷新列表。

---

## 12. 页面路由与 TabBar 配置

**Prompt:**
```
请帮我配置 uni-app 的 pages.json，设置 4 个 tabBar 页面（首页/记账/账单/我的），
统一蓝色导航栏主题 #1677FF，文字白色。
```

**对应功能/文件:**
- 路由配置 → `pages.json`

**AI 输出摘要:**
配置 4 个页面路径，统一 navigationBarBackgroundColor 为 #1677FF，tabBar 使用纯文字导航，选中色 #1677FF。

---

## 13. 全局样式与错误处理

**Prompt:**
```
更新 App.vue 添加全局样式重置（button 边框清除、input 轮廓清除等），
以及安全区适配样式。
```

**对应功能/文件:**
- 全局样式 → `App.vue`

**AI 输出摘要:**
添加 button::after border 清除、input outline 清除、page 背景色、安全区 padding 适配。

---

## 14. 文档生成

**Prompt:**
```
请帮我生成完整的 README.md 文件，包含项目介绍、技术栈、项目结构、安装指南、API 文档等。
```

**对应功能/文件:**
- 项目文档 → `README.md`

**AI 输出摘要:**
生成了包含项目介绍、技术栈表格、目录结构树、安装步骤、6 个 API 详细文档、数据库设计表、错误码说明的完整文档。

---

## 总结

本项目全程使用 AI 辅助编程，共进行了 **14 轮主要对话**，覆盖了：
- 架构设计 ×1
- 云函数开发 ×6（6 个 API）
- 前端页面开发 ×4（4 个独立页面）
- 路由配置 ×1
- 全局样式 ×1
- 文档生成 ×1

AI 生成的代码经过人工审查和调试，确保可用性和一致性。
