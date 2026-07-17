<template>
	<view class="container">
		<!-- 筛选栏 -->
		<view class="filter-bar">
			<picker mode="date" fields="month" :value="filterMonth" :end="today" @change="onMonthChange">
				<view class="filter-item">
					<text>{{ filterMonth || '全部月份' }}</text>
					<text class="filter-arrow">▼</text>
				</view>
			</picker>
			<view class="filter-item" :class="{ active: filterType === 'all' }" @tap="setFilter('all')">
				全部
			</view>
			<view class="filter-item" :class="{ active: filterType === 'expense' }" @tap="setFilter('expense')">
				支出
			</view>
			<view class="filter-item" :class="{ active: filterType === 'income' }" @tap="setFilter('income')">
				收入
			</view>
		</view>

		<!-- 账单列表 -->
		<view v-if="billList.length > 0" class="bill-list">
			<view v-for="bill in billList" :key="bill._id" class="bill-card">
				<view class="bill-main" @tap="showDetail(bill)">
					<view class="bill-info">
						<text class="bill-category">{{ bill.category }}</text>
						<text class="bill-date">{{ bill.date }}</text>
					</view>
					<text class="bill-amount" :class="bill.type">
						{{ bill.type === 'income' ? '+' : '-' }}¥{{ formatMoney(bill.amount) }}
					</text>
				</view>
				<view v-if="bill.remark" class="bill-remark">{{ bill.remark }}</view>
				<view class="bill-actions">
					<text class="action-btn delete" @tap="confirmDelete(bill)">删除</text>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view v-else-if="!loading" class="empty-state">
			<text class="empty-icon">📋</text>
			<text class="empty-text">暂无账单记录</text>
			<text class="empty-hint">去记一笔吧</text>
		</view>

		<!-- 加载更多 -->
		<view v-if="hasMore && billList.length > 0" class="load-more" @tap="loadMore">
			<text>{{ loadingMore ? '加载中...' : '点击加载更多' }}</text>
		</view>

		<!-- 加载提示 -->
		<uni-load-more v-if="loading" status="loading"></uni-load-more>
	</view>
</template>

<script>
	export default {
		data() {
			const now = new Date()
			return {
				filterMonth: '',
				filterType: 'all',
				today: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
				billList: [],
				page: 1,
				pageSize: 20,
				total: 0,
				loading: false,
				loadingMore: false
			}
		},
		computed: {
			hasMore() {
				return this.billList.length < this.total
			}
		},
		onShow() {
			this.page = 1
			this.billList = []
			this.loadBills()
		},
		methods: {
			onMonthChange(e) {
				this.filterMonth = e.detail.value
				this.page = 1
				this.billList = []
				this.loadBills()
			},
			setFilter(type) {
				this.filterType = type
				this.page = 1
				this.billList = []
				this.loadBills()
			},
			async loadBills() {
				this.loading = true
				try {
					const params = {
						page: this.page,
						pageSize: this.pageSize
					}
					if (this.filterType !== 'all') {
						params.type = this.filterType
					}
					if (this.filterMonth) {
						params.month = this.filterMonth
					}
					const res = await uniCloud.callFunction({
						name: 'get-bills',
						data: params
					})
					if (res.result && res.result.code === 0) {
						this.billList = res.result.data.list
						this.total = res.result.data.total
					}
				} catch (e) {
					console.error('加载账单失败:', e)
					uni.showToast({ title: '加载失败', icon: 'none' })
				}
				this.loading = false
			},
			async loadMore() {
				if (this.loadingMore) return
				this.loadingMore = true
				this.page++
				try {
					const params = { page: this.page, pageSize: this.pageSize }
					if (this.filterType !== 'all') params.type = this.filterType
					if (this.filterMonth) params.month = this.filterMonth
					const res = await uniCloud.callFunction({
						name: 'get-bills',
						data: params
					})
					if (res.result && res.result.code === 0) {
						this.billList = [...this.billList, ...res.result.data.list]
						this.total = res.result.data.total
					}
				} catch (e) {
					console.error('加载更多失败:', e)
					this.page--
				}
				this.loadingMore = false
			},
			confirmDelete(bill) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除这笔${bill.type === 'income' ? '收入' : '支出'}记录吗？`,
					success: (res) => {
						if (res.confirm) {
							this.deleteBill(bill._id)
						}
					}
				})
			},
			async deleteBill(id) {
				try {
					const res = await uniCloud.callFunction({
						name: 'delete-bill',
						data: { id }
					})
					if (res.result && res.result.code === 0) {
						uni.showToast({ title: '删除成功', icon: 'success' })
						this.billList = this.billList.filter(b => b._id !== id)
						this.total--
					} else {
						uni.showToast({
							title: res.result?.message || '删除失败',
							icon: 'none'
						})
					}
				} catch (e) {
					console.error('删除失败:', e)
					uni.showToast({ title: '删除失败', icon: 'none' })
				}
			},
			showDetail(bill) {
				// 点击查看详情（展示备注等）
				const typeText = bill.type === 'income' ? '收入' : '支出'
				const detail = [
					`类型：${typeText}`,
					`分类：${bill.category}`,
					`金额：¥${this.formatMoney(bill.amount)}`,
					`日期：${bill.date}`,
					bill.remark ? `备注：${bill.remark}` : ''
				].filter(Boolean).join('\n')
				uni.showModal({
					title: '账单详情',
					content: detail,
					showCancel: false,
					confirmText: '知道了'
				})
			},
			formatMoney(val) {
				return Number(val || 0).toFixed(2)
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 20rpx 30rpx;
	}

	.filter-bar {
		display: flex;
		align-items: center;
		background: #fff;
		border-radius: 16rpx;
		padding: 16rpx 20rpx;
		margin-bottom: 20rpx;
		gap: 20rpx;
	}

	.filter-item {
		font-size: 26rpx;
		color: #666;
		padding: 8rpx 20rpx;
		border-radius: 20rpx;
		background: #f5f5f5;
	}

	.filter-item.active {
		background: #E6F4FF;
		color: #1677FF;
		font-weight: bold;
	}

	.filter-arrow {
		font-size: 20rpx;
		margin-left: 6rpx;
	}

	.bill-card {
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 16rpx;
	}

	.bill-main {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.bill-info {
		display: flex;
		flex-direction: column;
	}

	.bill-category {
		font-size: 30rpx;
		color: #333;
		font-weight: 500;
	}

	.bill-date {
		font-size: 22rpx;
		color: #999;
		margin-top: 6rpx;
	}

	.bill-amount {
		font-size: 34rpx;
		font-weight: bold;
	}

	.bill-amount.income {
		color: #52C41A;
	}

	.bill-amount.expense {
		color: #FF4D4F;
	}

	.bill-remark {
		font-size: 24rpx;
		color: #bbb;
		margin-top: 10rpx;
		padding-left: 4rpx;
	}

	.bill-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 12rpx;
		padding-top: 12rpx;
		border-top: 1rpx solid #f5f5f5;
	}

	.action-btn {
		font-size: 24rpx;
		padding: 6rpx 20rpx;
		border-radius: 20rpx;
	}

	.action-btn.delete {
		color: #FF4D4F;
		background: #FFF1F0;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 120rpx 0;
	}

	.empty-icon {
		font-size: 80rpx;
		margin-bottom: 20rpx;
	}

	.empty-text {
		font-size: 30rpx;
		color: #999;
		margin-bottom: 10rpx;
	}

	.empty-hint {
		font-size: 26rpx;
		color: #ccc;
	}

	.load-more {
		text-align: center;
		padding: 30rpx;
		color: #1677FF;
		font-size: 28rpx;
	}
</style>
