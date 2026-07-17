<template>
	<view class="container">
		<!-- 筛选栏 -->
		<view class="filter-bar">
			<picker mode="date" fields="month" :value="filterMonth" :end="today" @change="onMonthChange">
				<view class="filter-chip">
					<text class="chip-emoji">📅</text>
					<text>{{ filterMonth || '全部月份' }}</text>
					<text class="chip-arrow">▾</text>
				</view>
			</picker>
			<view class="filter-divider"></view>
			<view class="filter-chip" :class="{ active: filterType === 'all' }" @tap="setFilter('all')">
				<text class="chip-emoji">📋</text>
				<text>全部</text>
			</view>
			<view class="filter-chip" :class="{ active: filterType === 'expense' }" @tap="setFilter('expense')">
				<text class="chip-emoji">💸</text>
				<text>支出</text>
			</view>
			<view class="filter-chip" :class="{ active: filterType === 'income' }" @tap="setFilter('income')">
				<text class="chip-emoji">💰</text>
				<text>收入</text>
			</view>
		</view>

		<!-- 统计摘要条 -->
		<view v-if="billList.length > 0" class="summary-strip">
			<text class="strip-text">
				共 <text class="strip-highlight">{{ total }}</text> 条记录
			</text>
			<text v-if="filterType === 'expense'" class="strip-amount expense-text">
				支出 ¥{{ formatMoney(totalAmount) }}
			</text>
			<text v-else-if="filterType === 'income'" class="strip-amount income-text">
				收入 ¥{{ formatMoney(totalAmount) }}
			</text>
		</view>

		<!-- 账单列表 -->
		<view v-if="billList.length > 0" class="bill-list">
			<view v-for="(bill, idx) in billList" :key="bill._id" class="bill-card" @tap="showDetail(bill)">
				<view class="bill-accent" :class="bill.type"></view>
				<view class="bill-body">
					<view class="bill-left">
						<view class="bill-avatar" :class="bill.type">
							<text>{{ getCategoryEmoji(bill.category) }}</text>
						</view>
						<view class="bill-text">
							<text class="bill-category">{{ bill.category }}</text>
							<view class="bill-meta">
								<text class="bill-date">{{ bill.date }}</text>
								<text v-if="bill.remark" class="bill-remark">· {{ bill.remark }}</text>
							</view>
						</view>
					</view>
					<view class="bill-right">
						<text class="bill-amount" :class="bill.type">
							{{ bill.type === 'income' ? '+' : '-' }}¥{{ formatMoney(bill.amount) }}
						</text>
						<text class="bill-delete" @tap.stop="confirmDelete(bill)">
							🗑️
						</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view v-else-if="!loading" class="empty-state">
			<text class="empty-big">🧸</text>
			<text class="empty-title">还没有账单哦</text>
			<text class="empty-sub">去记一笔，开启你的记账之旅吧~</text>
			<view class="empty-btn" @tap="goToAdd">
				<text>✏️ 去记账</text>
			</view>
		</view>

		<!-- 加载更多 -->
		<view v-if="hasMore && billList.length > 0" class="load-more" @tap="loadMore">
			<view class="load-more-btn">
				<text>{{ loadingMore ? '⏳ 加载中...' : '🔽 查看更多' }}</text>
			</view>
		</view>

		<uni-load-more v-if="loading" status="loading"></uni-load-more>

		<!-- 底部安全区 -->
		<view class="safe-bottom"></view>
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
			},
			totalAmount() {
				return this.billList.reduce((sum, b) => sum + Number(b.amount || 0), 0).toFixed(2)
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
					const params = { page: this.page, pageSize: this.pageSize }
					if (this.filterType !== 'all') params.type = this.filterType
					if (this.filterMonth) params.month = this.filterMonth
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
					confirmColor: '#FF6B9D',
					success: (res) => {
						if (res.confirm) this.deleteBill(bill._id)
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
						uni.showToast({ title: '🗑️ 已删除', icon: 'success' })
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
				const typeText = bill.type === 'income' ? '💰 收入' : '💸 支出'
				const detail = [
					typeText,
					`🏷️ 分类：${bill.category}`,
					`💵 金额：¥${this.formatMoney(bill.amount)}`,
					`📅 日期：${bill.date}`,
					bill.remark ? `💬 备注：${bill.remark}` : ''
				].filter(Boolean).join('\n')
				uni.showModal({
					title: '✨ 账单详情',
					content: detail,
					showCancel: false,
					confirmText: '知道啦',
					confirmColor: '#FF6B9D'
				})
			},
			getCategoryEmoji(category) {
				const map = {
					'餐饮': '🍜', '交通': '🚗', '购物': '🛒', '娱乐': '🎮',
					'住房': '🏠', '工资': '💼', '兼职': '💻', '投资': '📈',
					'红包': '🧧', '其他': '📌'
				}
				return map[category] || '📌'
			},
			formatMoney(val) {
				return Number(val || 0).toFixed(2)
			},
			goToAdd() {
				uni.switchTab({ url: '/pages/add/add' })
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 20rpx 30rpx;
	}

	/* 筛选栏 */
	.filter-bar {
		display: flex;
		align-items: center;
		gap: 14rpx;
		padding: 10rpx 0 16rpx;
		overflow-x: auto;
		white-space: nowrap;
	}

	.filter-chip {
		display: inline-flex;
		align-items: center;
		gap: 6rpx;
		font-size: 24rpx;
		color: #B5A5B9;
		padding: 10rpx 20rpx;
		border-radius: 24rpx;
		background: #fff;
		box-shadow: 0 2rpx 8rpx rgba(255, 107, 157, 0.05);
		transition: all 0.25s;
		flex-shrink: 0;
	}

	.filter-chip.active {
		background: #FFF0F5;
		color: #FF6B9D;
		font-weight: 600;
		box-shadow: 0 4rpx 14rpx rgba(255, 107, 157, 0.15);
	}

	.chip-emoji {
		font-size: 22rpx;
	}

	.chip-arrow {
		font-size: 18rpx;
		margin-left: 2rpx;
	}

	.filter-divider {
		width: 2rpx;
		height: 24rpx;
		background: #F0E5F0;
		border-radius: 1rpx;
		flex-shrink: 0;
	}

	/* 统计摘要 */
	.summary-strip {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 20rpx;
		background: #fff;
		border-radius: 20rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 2rpx 8rpx rgba(255, 107, 157, 0.04);
	}

	.strip-text {
		font-size: 24rpx;
		color: #B5A5B9;
	}

	.strip-highlight {
		color: #FF6B9D;
		font-weight: 600;
	}

	.strip-amount {
		font-size: 26rpx;
		font-weight: 700;
	}

	/* 账单卡片 */
	.bill-list {
		display: flex;
		flex-direction: column;
		gap: 14rpx;
	}

	.bill-card {
		position: relative;
		background: #fff;
		border-radius: 24rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 14rpx rgba(255, 107, 157, 0.05);
		transition: all 0.2s;
	}

	.bill-card:active {
		transform: scale(0.985);
		box-shadow: 0 4rpx 20rpx rgba(255, 107, 157, 0.1);
	}

	.bill-accent {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6rpx;
	}

	.bill-accent.income {
		background: linear-gradient(180deg, #7ECB76, #A8E6A0);
	}

	.bill-accent.expense {
		background: linear-gradient(180deg, #FF7B7B, #FFB8B8);
	}

	.bill-body {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 20rpx 20rpx 28rpx;
	}

	.bill-left {
		display: flex;
		align-items: center;
		gap: 16rpx;
		flex: 1;
		overflow: hidden;
	}

	.bill-avatar {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		flex-shrink: 0;
	}

	.bill-avatar.income {
		background: #F0FDF0;
	}

	.bill-avatar.expense {
		background: #FFF5F5;
	}

	.bill-text {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
		overflow: hidden;
	}

	.bill-category {
		font-size: 28rpx;
		color: #4A3640;
		font-weight: 500;
	}

	.bill-meta {
		display: flex;
		align-items: center;
		overflow: hidden;
	}

	.bill-date {
		font-size: 22rpx;
		color: #C4B5C9;
		flex-shrink: 0;
	}

	.bill-remark {
		font-size: 22rpx;
		color: #D4C5D9;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bill-right {
		display: flex;
		align-items: center;
		gap: 12rpx;
		flex-shrink: 0;
	}

	.bill-amount {
		font-size: 30rpx;
		font-weight: 700;
	}

	.bill-amount.income {
		color: #7ECB76;
	}

	.bill-amount.expense {
		color: #FF7B7B;
	}

	.bill-delete {
		font-size: 28rpx;
		opacity: 0.5;
		padding: 4rpx;
	}

	.bill-delete:active {
		opacity: 1;
	}

	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 100rpx 0;
		gap: 12rpx;
	}

	.empty-big {
		font-size: 100rpx;
		margin-bottom: 10rpx;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-16rpx);
		}
	}

	.empty-title {
		font-size: 30rpx;
		color: #4A3640;
		font-weight: 600;
	}

	.empty-sub {
		font-size: 24rpx;
		color: #D4C5D9;
		margin-bottom: 20rpx;
	}

	.empty-btn {
		padding: 14rpx 40rpx;
		background: linear-gradient(135deg, #FF6B9D, #FF8EAB);
		border-radius: 48rpx;
		color: #fff;
		font-size: 28rpx;
		font-weight: 600;
		box-shadow: 0 8rpx 24rpx rgba(255, 107, 157, 0.25);
	}

	/* 加载更多 */
	.load-more {
		text-align: center;
		padding: 20rpx 0;
	}

	.load-more-btn {
		display: inline-block;
		padding: 12rpx 40rpx;
		border-radius: 24rpx;
		background: #fff;
		color: #FF6B9D;
		font-size: 26rpx;
		box-shadow: 0 2rpx 8rpx rgba(255, 107, 157, 0.06);
	}

	.safe-bottom {
		height: 20rpx;
	}
</style>
