'use strict';

/**
 * 云函数：get-categories
 * 功能：获取全部分类列表，可按类型筛选
 * 请求参数：{ type?: 'income'|'expense' }
 * 返回：{ code: 0, data: [...分类列表], message: 'success' }
 */
exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { type } = event

  const where = {}
  if (type && ['income', 'expense'].includes(type)) {
    where.type = type
  }

  try {
    const res = await db.collection('categories')
      .where(where)
      .orderBy('sort', 'asc')
      .get()

    return {
      code: 0,
      data: res.data,
      message: 'success'
    }
  } catch (err) {
    console.error('get-categories error:', err)
    return { code: 500, message: '服务器错误：' + err.message }
  }
}
