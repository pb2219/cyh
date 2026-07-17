'use strict';

/**
 * 云函数：get-bills
 * 功能：分页获取账单列表，支持按类型、月份筛选
 * 请求参数：{ type?: 'income'|'expense', month?: 'YYYY-MM', page?: 1, pageSize?: 20 }
 * 返回：{ code: 0, data: { list: [...], total: 数字, page: 数字, pageSize: 数字 }, message: 'success' }
 */
exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { type, month, page = 1, pageSize = 20 } = event

  const where = {}

  if (type && ['income', 'expense'].includes(type)) {
    where.type = type
  }

  if (month) {
    // 月份筛选：匹配 YYYY-MM 开头的日期
    where.date = db.command.gte(month + '-01').and(db.command.lte(month + '-31'))
  }

  try {
    const countRes = await db.collection('bills').where(where).count()
    const total = countRes.total

    const res = await db.collection('bills')
      .where(where)
      .orderBy('date', 'desc')
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: res.data,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      },
      message: 'success'
    }
  } catch (err) {
    console.error('get-bills error:', err)
    return { code: 500, message: '服务器错误：' + err.message }
  }
}
