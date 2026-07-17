<template>
	<view class="container">
		<!-- 头部卡片 -->
		<view class="header-card">
			<view class="header-emoji-row">
				<text class="header-deco">🌸</text>
				<view class="avatar-ring">
					<text class="avatar-emoji">🐣</text>
				</view>
				<text class="header-deco">🌸</text>
			</view>
			<text class="greeting">记账小助手</text>
			<text class="subtitle">✨ 让每一笔都有迹可循 ✨</text>
			<view class="header-stats">
				<view class="stat-item">
					<text class="stat-num">{{ billCount }}</text>
					<text class="stat-label">总笔数</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-num">{{ categoryCount }}</text>
					<text class="stat-label">分类数</text>
				</view>
			</view>
		</view>

		<!-- 分类管理 -->
		<view class="section">
			<view class="section-header">
				<view class="section-title-row">
					<text class="title-emoji">🏷️</text>
					<text class="section-title">分类管理</text>
				</view>
				<view class="add-btn" @tap="showAddCategory">
					<text>＋ 添加</text>
				</view>
			</view>

			<!-- 支出分类 -->
			<view class="group-header">
				<text class="group-dot expense-dot"></text>
				<text class="group-label">支出分类</text>
			</view>
			<view class="category-grid">
				<view v-for="cat in expenseCategories" :key="cat._id" class="category-cell">
					<view class="cell-icon-wrap expense-icon-bg">
						<text class="cell-icon">{{ cat.icon }}</text>
					</view>
					<text class="cell-name">{{ cat.name }}</text>
				</view>
				<view v-if="expenseCategories.length === 0" class="empty-mini">
					<text class="empty-mini-text">暂无支出分类</text>
				</view>
			</view>

			<!-- 收入分类 -->
			<view class="group-header">
				<text class="group-dot income-dot"></text>
				<text class="group-label">收入分类</text>
			</view>
			<view class="category-grid">
				<view v-for="cat in incomeCategories" :key="cat._id" class="category-cell">
					<view class="cell-icon-wrap income-icon-bg">
						<text class="cell-icon">{{ cat.icon }}</text>
					</view>
					<text class="cell-name">{{ cat.name }}</text>
				</view>
				<view v-if="incomeCategories.length === 0" class="empty-mini">
					<text class="empty-mini-text">暂无收入分类</text>
				</view>
			</view>
		</view>

		<!-- 关于 -->
		<view class="section">
			<view class="section-title-row">
				<text class="title-emoji">ℹ️</text>
				<text class="section-title">关于</text>
			</view>
			<view class="about-list">
				<view class="about-item">
					<text class="about-emoji">📦</text>
					<text class="about-label">版本</text>
					<text class="about-value">v1.0.0</text>
				</view>
				<view class="about-item">
					<text class="about-emoji">🛠️</text>
					<text class="about-label">技术栈</text>
					<text class="about-value">uni-app + uniCloud</text>
				</view>
				<view class="about-item">
					<text class="about-emoji">🗄️</text>
					<text class="about-label">数据库</text>
					<text class="about-value">阿里云 MongoDB</text>
				</view>
				<view class="about-item">
					<text class="about-emoji">☁️</text>
					<text class="about-label">云服务</text>
					<text class="about-value">uniCloud 阿里云</text>
				</view>
			</view>
		</view>

		<!-- 添加分类弹窗 -->
		<view v-if="showDialog" class="dialog-mask" @tap="hideDialog">
			<view class="dialog" @tap.stop>
				<text class="dialog-deco">🎀</text>
				<text class="dialog-title">添加新分类</text>

				<view class="dialog-type">
					<view class="type-option" :class="{ active: newCategory.type === 'expense' }"
						@tap="newCategory.type = 'expense'">
						<text>💸 支出</text>
					</view>
					<view class="type-option" :class="{ active: newCategory.type === 'income' }"
						@tap="newCategory.type = 'income'">
						<text>💰 收入</text>
					</view>
				</view>

				<view class="dialog-field">
					<text class="field-emoji">🏷️</text>
					<input class="dialog-input" v-model="newCategory.name" placeholder="分类名称（如 零食）" />
				</view>

				<view class="dialog-field">
					<text class="field-emoji">😊</text>
					<input class="dialog-input" v-model="newCategory.icon" placeholder="图标 Emoji（如 🍬）"
						maxlength="2" />
				</view>

				<view class="dialog-actions">
					<button class="dialog-btn cancel-btn" @tap="hideDialog">取消</button>
					<button class="dialog-btn confirm-btn" @tap="addCategory"
						:disabled="!newCategory.name">
						确定添加 ✨
					</button>
				</view>
			</view>
		</view>

		<view class="safe-bottom"></view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				categories: [],
				showDialog: false,
				newCategory: {
					name: '',
					type: 'expense',
					icon: '📌'
				},
				billCount: 0
			}
		},
		computed: {
			expenseCategories() {
				return this.categories.filter(c => c.type === 'expense')
			},
			incomeCategories() {
				return this.categories.filter(c => c.type === 'income')
			},
			categoryCount() {
				return this.categories.length
			}
		},
		onShow() {
			this.loadCategories()
			this.loadBillCount()
		},
		methods: {
			async loadCategories() {
				try {
					const res = await uniCloud.callFunction({
						name: 'get-categories',
						data: {}
					})
					if (res.result && res.result.code === 0) {
						this.categories = res.result.data
					}
				} catch (e) {
					console.error('加载分类失败:', e)
				}
			},
			async loadBillCount() {
				try {
					const res = await uniCloud.callFunction({
						name: 'get-bills',
						data: { page: 1, pageSize: 1 }
					})
					if (res.result && res.result.code === 0) {
						this.billCount = res.result.data.total || 0
					}
				} catch (e) {
					console.error('加载账单数失败:', e)
				}
			},
			showAddCategory() {
				this.newCategory = { name: '', type: 'expense', icon: '📌' }
				this.showDialog = true
			},
			hideDialog() {
				this.showDialog = false
			},
			async addCategory() {
				if (!this.newCategory.name) return
				try {
					const res = await uniCloud.callFunction({
						name: 'add-category',
						data: {
							name: this.newCategory.name,
							type: this.newCategory.type,
							icon: this.newCategory.icon || '📌'
						}
					})
					if (res.result && res.result.code === 0) {
						uni.showToast({ title: '✨ 添加成功', icon: 'success' })
						this.hideDialog()
						this.loadCategories()
					} else {
						uni.showToast({
							title: res.result?.message || '添加失败',
							icon: 'none'
						})
					}
				} catch (e) {
					console.error('添加分类失败:', e)
					uni.showToast({ title: '添加失败', icon: 'none' })
				}
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 20rpx 30rpx;
	}

	/* 头部卡片 */
	.header-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40rpx 30rpx 30rpx;
		background: linear-gradient(160deg, #FF6B9D 0%, #C44DFF 60%, #A78BFA 100%);
		border-radius: 40rpx;
		margin-bottom: 28rpx;
		box-shadow: 0 16rpx 40rpx rgba(196, 77, 255, 0.22);
		position: relative;
		overflow: hidden;
	}

	.header-emoji-row {
		display: flex;
		align-items: center;
		gap: 24rpx;
		margin-bottom: 14rpx;
	}

	.header-deco {
		font-size: 36rpx;
		opacity: 0.7;
	}

	.avatar-ring {
		width: 90rpx;
		height: 90rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(10rpx);
	}

	.avatar-emoji {
		font-size: 44rpx;
	}

	.greeting {
		font-size: 36rpx;
		color: #fff;
		font-weight: 700;
		letter-spacing: 2rpx;
	}

	.subtitle {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 6rpx;
	}

	.header-stats {
		display: flex;
		align-items: center;
		gap: 40rpx;
		margin-top: 24rpx;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 24rpx;
		padding: 16rpx 40rpx;
		backdrop-filter: blur(10rpx);
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rpx;
	}

	.stat-num {
		font-size: 32rpx;
		color: #fff;
		font-weight: 700;
	}

	.stat-label {
		font-size: 20rpx;
		color: rgba(255, 255, 255, 0.7);
	}

	.stat-divider {
		width: 2rpx;
		height: 40rpx;
		background: rgba(255, 255, 255, 0.25);
		border-radius: 1rpx;
	}

	/* 区域卡片 */
	.section {
		background: #fff;
		border-radius: 32rpx;
		padding: 28rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(255, 107, 157, 0.06);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.section-title-row {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 6rpx;
	}

	.title-emoji {
		font-size: 30rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #4A3640;
	}

	.add-btn {
		font-size: 24rpx;
		color: #FF6B9D;
		padding: 8rpx 20rpx;
		background: #FFF0F5;
		border-radius: 20rpx;
		font-weight: 500;
	}

	/* 分类分组 */
	.group-header {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin: 16rpx 0 12rpx;
	}

	.group-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
	}

	.expense-dot {
		background: #FF7B7B;
	}

	.income-dot {
		background: #7ECB76;
	}

	.group-label {
		font-size: 24rpx;
		color: #B5A5B9;
		font-weight: 500;
	}

	.category-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 14rpx;
		margin-bottom: 6rpx;
	}

	.category-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		padding: 14rpx 18rpx;
		background: #FFFAFD;
		border-radius: 20rpx;
		min-width: 110rpx;
		transition: all 0.2s;
	}

	.category-cell:active {
		transform: scale(0.95);
	}

	.cell-icon-wrap {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.expense-icon-bg {
		background: #FFF5F5;
	}

	.income-icon-bg {
		background: #F0FDF0;
	}

	.cell-icon {
		font-size: 30rpx;
	}

	.cell-name {
		font-size: 22rpx;
		color: #8A7080;
	}

	/* 关于 */
	.about-list {
		margin-top: 16rpx;
	}

	.about-item {
		display: flex;
		align-items: center;
		gap: 14rpx;
		padding: 18rpx 0;
		border-bottom: 1rpx solid #FFF5F7;
	}

	.about-item:last-child {
		border-bottom: none;
	}

	.about-emoji {
		font-size: 28rpx;
		width: 40rpx;
		text-align: center;
	}

	.about-label {
		font-size: 28rpx;
		color: #4A3640;
		flex: 1;
	}

	.about-value {
		font-size: 26rpx;
		color: #C4B5C9;
	}

	.empty-mini {
		width: 100%;
		text-align: center;
		padding: 16rpx;
	}

	.empty-mini-text {
		font-size: 22rpx;
		color: #D4C5D9;
	}

	/* 弹窗 */
	.dialog-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(74, 54, 64, 0.4);
		backdrop-filter: blur(4rpx);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
	}

	.dialog {
		width: 580rpx;
		background: #fff;
		border-radius: 36rpx;
		padding: 44rpx 36rpx 32rpx;
		box-shadow: 0 20rpx 60rpx rgba(196, 77, 255, 0.2);
	}

	.dialog-deco {
		font-size: 44rpx;
		display: block;
		text-align: center;
		margin-bottom: 6rpx;
	}

	.dialog-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #4A3640;
		text-align: center;
		display: block;
		margin-bottom: 28rpx;
	}

	.dialog-type {
		display: flex;
		gap: 16rpx;
		margin-bottom: 24rpx;
	}

	.type-option {
		flex: 1;
		text-align: center;
		padding: 16rpx 0;
		border-radius: 16rpx;
		font-size: 26rpx;
		color: #B5A5B9;
		background: #F8F0F5;
		transition: all 0.25s;
		font-weight: 500;
	}

	.type-option.active {
		background: #FFF0F5;
		color: #FF6B9D;
		font-weight: 700;
	}

	.type-option:last-child.active {
		background: #F0FDF0;
		color: #5CB85C;
	}

	.dialog-field {
		display: flex;
		align-items: center;
		gap: 14rpx;
		background: #FFFAFD;
		border-radius: 16rpx;
		padding: 16rpx 20rpx;
		margin-bottom: 18rpx;
	}

	.field-emoji {
		font-size: 26rpx;
		flex-shrink: 0;
	}

	.dialog-input {
		font-size: 28rpx;
		color: #4A3640;
		flex: 1;
	}

	.dialog-input::placeholder {
		color: #D9CCD9;
	}

	.dialog-actions {
		display: flex;
		gap: 18rpx;
		margin-top: 28rpx;
	}

	.dialog-btn {
		flex: 1;
		border-radius: 48rpx;
		font-size: 28rpx;
		padding: 20rpx 0;
		text-align: center;
		font-weight: 600;
		transition: all 0.2s;
	}

	.cancel-btn {
		background: #F8F0F5;
		color: #B5A5B9;
	}

	.confirm-btn {
		background: linear-gradient(135deg, #FF6B9D, #FF8EAB);
		color: #fff;
		box-shadow: 0 6rpx 20rpx rgba(255, 107, 157, 0.25);
	}

	.confirm-btn[disabled] {
		background: #E8DCE4;
		color: #C4B5C9;
		box-shadow: none;
	}

	.safe-bottom {
		height: 30rpx;
	}
</style>
