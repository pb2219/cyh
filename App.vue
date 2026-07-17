<script>
	export default {
		onLaunch: function() {
			console.log('🌸 记账助手 App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/* 全局可爱风格 */
	page {
		background-color: #FFF5F7;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
	}

	/* 按钮重置 */
	button {
		margin: 0;
		padding: 0;
		border: none;
		background: none;
		line-height: inherit;
		font-size: inherit;
	}

	button::after {
		border: none;
	}

	/* 输入框重置 */
	input {
		outline: none;
	}

	/* 统一安全区 */
	.safe-area-bottom {
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
