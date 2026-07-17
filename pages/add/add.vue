<template>
	<view class="container">
		<!-- 类型切换 -->
		<view class="type-switch">
			<view class="switch-track" :class="{ 'track-income': formData.type === 'income' }">
				<view class="switch-thumb" :class="{ 'thumb-right': formData.type === 'income' }"></view>
			</view>
			<view class="switch-labels">
				<view class="switch-label" :class="{ active: formData.type === 'expense' }"
					@tap="switchType('expense')">
					<text class="label-emoji">💸</text>
					<text>支出</text>
				</view>
				<view class="switch-label" :class="{ active: formData.type === 'income' }"
					@tap="switchType('income')">
					<text class="label-emoji">💰</text>
					<text>收入</text>
				</view>
			</view>
		</view>

		<!-- 金额输入 -->
		<view class="amount-card">
			<text class="amount-emoji">{{ formData.type === 'income' ? '🤑' : '😌' }}</text>
			<view class="amount-row">
				<text class="currency">¥</text>
				<input class="amount-input" type="digit" v-model="amountStr" placeholder="0.00" focus
					:adjust-position="true" />
			</view>
			<view class="amount-divider"></view>
		</view>

		<!-- 分类选择 -->
		<view class="form-group">
			<view class="form-label-row">
				<text class="label-emoji-sm">🏷️</text>
				<text class="form-label">选择分类</text>
			</view>
			<scroll-view scroll-x class="category-scroll" :show-scrollbar="false">
				<view class="category-row">
					<view v-for="cat in currentCategories" :key="cat._id" class="category-tag"
						:class="{ selected: formData.category === cat.name }" @tap="selectCategory(cat)">
						<view class="tag-icon-wrap" :class="{ 'icon-picked': formData.category === cat.name }">
							<text class="cat-icon">{{ cat.icon }}</text>
						</view>
						<text class="cat-name">{{ cat.name }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 日期选择 -->
		<view class="form-group">
			<view class="form-label-row">
				<text class="label-emoji-sm">📆</text>
				<text class="form-label">日期</text>
			</view>
			<picker mode="date" :value="formData.date" :end="today" @change="onDateChange">
				<view class="field-card">
					<text class="field-value">{{ formData.date }}</text>
					<text class="field-icon">📅</text>
				</view>
			</picker>
		</view>

		<!-- 备注 -->
		<view class="form-group">
			<view class="form-label-row">
				<text class="label-emoji-sm">💬</text>
				<text class="form-label">备注（选填）</text>
			</view>
			<view class="field-card">
				<input class="remark-input" v-model="formData.remark" placeholder="今天吃了什么好吃的呀~" />
				<text class="field-icon">✏️</text>
			</view>
		</view>

		<!-- 保存按钮 -->
		<button class="save-btn" :class="{ 'save-disabled': !canSave || saving }"
			:disabled="!canSave || saving" @tap="saveBill">
			<text class="save-emoji">{{ saving ? '⏳' : '✨' }}</text>
			<text>{{ saving ? '保存中...' : '记录这笔' }}</text>
		</button>

		<!-- 快捷金额 -->
		<view class="quick-amounts">
			<text class="quick-title">快捷金额</text>
			<view class="quick-row">
				<view v-for="num in quickNumbers" :key="num" class="quick-chip"
					@tap="addQuickAmount(num)">
					<text>+{{ num }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			const now = new Date()
			const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
			return {
				formData: {
					type: 'expense',
					amount: 0,
					category: '',
					date: today,
					remark: ''
				},
				amountStr: '',
				today,
				categories: [],
				saving: false,
				quickNumbers: [10, 20, 50, 100, 200]
			}
		},
		computed: {
			currentCategories() {
				return this.categories.filter(c => c.type === this.formData.type)
			},
			canSave() {
				return Number(this.amountStr) > 0 && this.formData.category
			}
		},
		onShow() {
			this.loadCategories()
		},
		methods: {
			switchType(type) {
				this.formData.type = type
				this.formData.category = ''
			},
			selectCategory(cat) {
				this.formData.category = cat.name
			},
			onDateChange(e) {
				this.formData.date = e.detail.value
			},
			addQuickAmount(num) {
				const current = Number(this.amountStr) || 0
				this.amountStr = String(current + num)
			},
			async loadCategories() {
				try {
					const res = await uniCloud.callFunction({
						name: 'get-categories',
						data: {}
					})
					if (res.result && res.result.code === 0) {
						this.categories = res.result.data
					}
					if (!this.categories || this.categories.length === 0) {
						await this.initDefaultCategories()
					}
				} catch (e) {
					console.error('加载分类失败:', e)
					await this.initDefaultCategories()
				}
			},
			async initDefaultCategories() {
				const defaults = [
					{ name: '餐饮', type: 'expense', icon: '🍜', sort: 1 },
					{ name: '交通', type: 'expense', icon: '🚗', sort: 2 },
					{ name: '购物', type: 'expense', icon: '🛒', sort: 3 },
					{ name: '娱乐', type: 'expense', icon: '🎮', sort: 4 },
					{ name: '住房', type: 'expense', icon: '🏠', sort: 5 },
					{ name: '工资', type: 'income', icon: '💼', sort: 1 },
					{ name: '兼职', type: 'income', icon: '💻', sort: 2 },
					{ name: '投资', type: 'income', icon: '📈', sort: 3 },
					{ name: '红包', type: 'income', icon: '🧧', sort: 4 },
					{ name: '奖金', type: 'income', icon: '💰', sort: 5 }
				]
				for (const cat of defaults) {
					try {
						await uniCloud.callFunction({
							name: 'add-category',
							data: cat
						})
					} catch (e) {}
				}
				const res = await uniCloud.callFunction({
					name: 'get-categories',
					data: {}
				})
				if (res.result && res.result.code === 0) {
					this.categories = res.result.data
				}
			},
			async saveBill() {
				if (!this.canSave) return
				this.saving = true
				try {
					const res = await uniCloud.callFunction({
						name: 'add-bill',
						data: {
							type: this.formData.type,
							amount: Number(this.amountStr),
							category: this.formData.category,
							date: this.formData.date,
							remark: this.formData.remark
						}
					})
					if (res.result && res.result.code === 0) {
						uni.showToast({ title: '✨ 记录成功', icon: 'success' })
						this.resetForm()
					} else {
						uni.showToast({
							title: res.result?.message || '保存失败',
							icon: 'none'
						})
					}
				} catch (e) {
					console.error('保存失败:', e)
					uni.showToast({ title: '网络错误，请重试', icon: 'none' })
				}
				this.saving = false
			},
			resetForm() {
				this.amountStr = ''
				this.formData.category = ''
				this.formData.remark = ''
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 24rpx 30rpx 40rpx;
	}

	/* 类型切换 */
	.type-switch {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.switch-track {
		width: 200rpx;
		height: 64rpx;
		background: #FFE0E8;
		border-radius: 40rpx;
		position: relative;
		padding: 6rpx;
		transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.switch-track.track-income {
		background: #E0F5E0;
	}

	.switch-thumb {
		width: 52rpx;
		height: 52rpx;
		background: #fff;
		border-radius: 50%;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 157, 0.25);
		transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.thumb-right {
		transform: translateX(136rpx);
		box-shadow: 0 4rpx 12rpx rgba(126, 203, 118, 0.25);
	}

	.switch-labels {
		display: flex;
		justify-content: space-between;
		width: 320rpx;
		margin-top: 14rpx;
	}

	.switch-label {
		display: flex;
		align-items: center;
		gap: 6rpx;
		font-size: 26rpx;
		color: #D4C5D9;
		padding: 8rpx 20rpx;
		border-radius: 24rpx;
		transition: all 0.3s;
	}

	.switch-label.active {
		color: #FF6B9D;
		font-weight: 600;
		background: #FFF0F5;
	}

	.switch-label:last-child.active {
		color: #5CB85C;
		background: #F0FDF0;
	}

	.label-emoji {
		font-size: 28rpx;
	}

	/* 金额卡片 */
	.amount-card {
		background: #fff;
		border-radius: 32rpx;
		padding: 30rpx 30rpx 20rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(255, 107, 157, 0.06);
	}

	.amount-emoji {
		font-size: 40rpx;
		display: block;
		text-align: center;
		margin-bottom: 10rpx;
	}

	.amount-row {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.currency {
		font-size: 60rpx;
		color: #FF6B9D;
		font-weight: 700;
		margin-right: 8rpx;
	}

	.amount-input {
		font-size: 76rpx;
		font-weight: 700;
		color: #4A3640;
		width: 360rpx;
		text-align: left;
	}

	.amount-divider {
		height: 4rpx;
		background: linear-gradient(90deg, transparent, #FFD4E0, transparent);
		border-radius: 2rpx;
		margin-top: 20rpx;
	}

	/* 表单组 */
	.form-group {
		margin-bottom: 24rpx;
	}

	.form-label-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
		margin-bottom: 14rpx;
	}

	.label-emoji-sm {
		font-size: 24rpx;
	}

	.form-label {
		font-size: 24rpx;
		color: #C4B5C9;
		font-weight: 500;
	}

	/* 通用卡片字段 */
	.field-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #fff;
		border-radius: 24rpx;
		padding: 20rpx 24rpx;
		box-shadow: 0 2rpx 12rpx rgba(255, 107, 157, 0.04);
	}

	.field-value {
		font-size: 30rpx;
		color: #4A3640;
	}

	.field-icon {
		font-size: 28rpx;
	}

	/* 分类选择 */
	.category-scroll {
		white-space: nowrap;
	}

	.category-row {
		display: inline-flex;
		gap: 16rpx;
		padding: 4rpx 0;
	}

	.category-tag {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		padding: 16rpx 10rpx;
		min-width: 120rpx;
		border-radius: 24rpx;
		background: #fff;
		box-shadow: 0 2rpx 12rpx rgba(255, 107, 157, 0.04);
		transition: all 0.25s;
		box-sizing: border-box;
		border: 2rpx solid transparent;
	}

	.category-tag.selected {
		border-color: #FF6B9D;
		background: #FFF5FA;
		box-shadow: 0 6rpx 20rpx rgba(255, 107, 157, 0.12);
		transform: translateY(-4rpx);
	}

	.tag-icon-wrap {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		background: #FFF5F7;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.25s;
	}

	.icon-picked {
		background: #FFE0EC;
		transform: scale(1.08);
	}

	.cat-icon {
		font-size: 32rpx;
	}

	.cat-name {
		font-size: 22rpx;
		color: #B5A5B9;
	}

	.category-tag.selected .cat-name {
		color: #FF6B9D;
		font-weight: 600;
	}

	/* 备注 */
	.remark-input {
		font-size: 28rpx;
		color: #4A3640;
		flex: 1;
	}

	.remark-input::placeholder {
		color: #D9CCD9;
	}

	/* 保存按钮 */
	.save-btn {
		margin-top: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		background: linear-gradient(135deg, #FF6B9D, #FF8EAB);
		color: #fff;
		border-radius: 48rpx;
		font-size: 32rpx;
		font-weight: 700;
		padding: 26rpx 0;
		box-shadow: 0 10rpx 30rpx rgba(255, 107, 157, 0.3);
		transition: all 0.3s;
	}

	.save-btn:active {
		transform: scale(0.97);
	}

	.save-disabled {
		background: #E8DCE4;
		box-shadow: none;
		color: #C4B5C9;
	}

	.save-emoji {
		font-size: 30rpx;
	}

	/* 快捷金额 */
	.quick-amounts {
		margin-top: 30rpx;
		padding: 0 10rpx;
	}

	.quick-title {
		font-size: 22rpx;
		color: #D4C5D9;
		margin-bottom: 14rpx;
		display: block;
	}

	.quick-row {
		display: flex;
		gap: 14rpx;
		flex-wrap: wrap;
	}

	.quick-chip {
		padding: 10rpx 24rpx;
		background: #fff;
		border-radius: 24rpx;
		font-size: 24rpx;
		color: #FF6B9D;
		font-weight: 500;
		box-shadow: 0 2rpx 8rpx rgba(255, 107, 157, 0.06);
		transition: all 0.2s;
	}

	.quick-chip:active {
		background: #FFF0F5;
		transform: scale(0.95);
	}
</style>
