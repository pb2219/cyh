'use strict';

/**
 * 云函数：delete-bill
 * 功能：删除指定账单记录
 * 请求参数：{ id: '记录_id' }
 * 返回：{ code: 0, data: 删除结果, message: 'success' }
 */
exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { id } = event

  if (!id) {
    return { code: 400, message: '参数错误：id 不能为空' }
  }

  try {
    const res = await db.collection('bills').doc(id).remove()
    if (res.deleted === 0) {
      return { code: 404, message: '记录不存在' }
    }
    return { code: 0, data: res, message: '删除成功' }
  } catch (err) {
    console.error('delete-bill error:', err)
    return { code: 500, message: '服务器错误：' + err.message }
  }
}
