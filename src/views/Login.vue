<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand-section">
          <div class="logo-wrapper">
            <span class="logo-icon">N</span>
          </div>
          <h1 class="brand-title">NexMart</h1>
          <p class="brand-subtitle">智能电商管理平台</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon class="feature-icon"><DataAnalysis /></el-icon>
            <span>数据分析</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><Goods /></el-icon>
            <span>商品管理</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><Document /></el-icon>
            <span>订单管理</span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="login-header">
            <h2>{{ isResetMode ? '重置密码' : '欢迎登录' }}</h2>
            <p>{{ isResetMode ? '请输入手机号和验证码重置密码' : '请输入您的账号信息' }}</p>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <template v-if="!isResetMode">
              <el-form-item label="用户名 / 手机号" prop="username">
                <el-input
                  v-model="form.username"
                  placeholder="请输入用户名或 11 位手机号"
                  size="large"
                  :prefix-icon="User"
                />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="请输入密码"
                  size="large"
                  show-password
                  :prefix-icon="Lock"
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
              <el-form-item label="图形验证码" prop="captcha">
                <div class="captcha-wrapper">
                  <el-input
                    v-model="form.captcha"
                    placeholder="请输入验证码"
                    size="large"
                    maxlength="4"
                    class="captcha-input"
                    @keyup.enter="handleLogin"
                  />
                  <div class="captcha-image" @click="refreshCaptcha" title="点击刷新验证码">
                    <canvas ref="captchaCanvas" width="120" height="40"></canvas>
                  </div>
                </div>
              </el-form-item>
              <div class="form-actions">
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  @click="handleLogin"
                >
                  登 录
                </el-button>
              </div>
              <div class="forgot-password">
                <el-button type="text" @click="switchToReset">
                  忘记密码？
                </el-button>
              </div>
            </template>

            <template v-else>
              <el-form-item label="手机号" prop="phone">
                <el-input
                  v-model="form.phone"
                  placeholder="请输入注册手机号"
                  size="large"
                  :prefix-icon="Phone"
                />
              </el-form-item>
              <el-form-item label="验证码" prop="code">
                <div class="code-input-wrapper">
                  <el-input
                    v-model="form.code"
                    placeholder="请输入验证码"
                    size="large"
                    :prefix-icon="Message"
                    maxlength="6"
                  />
                  <el-button
                    type="primary"
                    size="large"
                    :disabled="countdown > 0"
                    :loading="sendingCode"
                    @click="handleSendCode"
                  >
                    {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                  </el-button>
                </div>
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="form.newPassword"
                  type="password"
                  placeholder="请输入新密码（6-20位字母或数字）"
                  size="large"
                  show-password
                  :prefix-icon="Lock"
                />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  size="large"
                  show-password
                  :prefix-icon="Lock"
                  @keyup.enter="handleResetPassword"
                />
              </el-form-item>
              <div class="form-actions">
                <el-button
                  type="primary"
                  size="large"
                  :loading="resetLoading"
                  @click="handleResetPassword"
                >
                  重置密码
                </el-button>
              </div>
              <div class="forgot-password">
                <el-button type="text" @click="switchToLogin">
                  返回登录
                </el-button>
              </div>
            </template>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Phone, Message, DataAnalysis, Goods, Document } from '@element-plus/icons-vue'
import { authApi } from '@/api/auth'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()
const formRef = ref()
const captchaCanvas = ref()
const loading = ref(false)
const resetLoading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const isResetMode = ref(false)
let captchaCode = ''

const form = reactive({
  username: '',
  password: '',
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
  captcha: ''
})

const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('手机号格式不正确'))
  } else {
    callback()
  }
}

const validateCode = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入验证码'))
  } else if (!/^\d{6}$/.test(value)) {
    callback(new Error('验证码为6位数字'))
  } else {
    callback()
  }
}

const validateNewPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入新密码'))
  } else if (!/^[a-zA-Z0-9]{6,20}$/.test(value)) {
    callback(new Error('密码必须为6-20位字母或数字'))
  } else {
    if (form.confirmPassword) {
      formRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
  } else if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const loginRules = {
  username: [{ required: true, message: '请输入用户名或手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入图形验证码', trigger: 'blur' }]
}

const resetRules = {
  phone: [{ required: true, validator: validatePhone, trigger: 'blur' }],
  code: [{ required: true, validator: validateCode, trigger: 'blur' }],
  newPassword: [{ required: true, validator: validateNewPassword, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }]
}

const rules = ref(loginRules)

const switchToReset = () => {
  isResetMode.value = true
  rules.value = resetRules
  formRef.value?.resetFields()
}

const switchToLogin = () => {
  isResetMode.value = false
  rules.value = loginRules
  formRef.value?.resetFields()
  countdown.value = 0
}

const generateCaptcha = () => {
  const canvas = captchaCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, width, height)
  
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  captchaCode = ''
  for (let i = 0; i < 4; i++) {
    captchaCode += chars[Math.floor(Math.random() * chars.length)]
  }
  
  for (let i = 0; i < captchaCode.length; i++) {
    ctx.font = `${20 + Math.random() * 8}px Arial`
    ctx.fillStyle = `rgb(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100})`
    ctx.textBaseline = 'middle'
    const x = 15 + i * 26
    const y = height / 2 + (Math.random() - 0.5) * 10
    const deg = (Math.random() - 0.5) * 0.4
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(deg)
    ctx.fillText(captchaCode[i], 0, 0)
    ctx.restore()
  }
  
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`
    ctx.beginPath()
    ctx.moveTo(Math.random() * width, Math.random() * height)
    ctx.lineTo(Math.random() * width, Math.random() * height)
    ctx.stroke()
  }
  
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`
    ctx.beginPath()
    ctx.arc(Math.random() * width, Math.random() * height, 1, 0, 2 * Math.PI)
    ctx.fill()
  }
}

const refreshCaptcha = () => {
  generateCaptcha()
}

const handleLogin = async () => {
  await formRef.value.validate()
  
  if (form.captcha.toUpperCase() !== captchaCode) {
    ElMessage.error('图形验证码错误')
    refreshCaptcha()
    form.captcha = ''
    return
  }
  
  loading.value = true
  try {
    const res = await authApi.login({
      username: form.username,
      password: form.password
    })
    const role = res.data.userInfo.role
    if (role !== 1 && role !== 2) {
      ElMessage.error('权限不足，无法登录管理后台')
      return
    }
    adminStore.setToken(res.data.token)
    adminStore.setUserInfo(res.data.userInfo)
    ElMessage.success('登录成功')
    router.push('/')
  } finally {
    loading.value = false
  }
}

const handleSendCode = async () => {
  if (!form.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('手机号格式不正确')
    return
  }
  
  sendingCode.value = true
  try {
    await authApi.sendResetCode(form.phone)
    ElMessage.success('验证码已发送，请查看服务器控制台')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } finally {
    sendingCode.value = false
  }
}

const handleResetPassword = async () => {
  await formRef.value.validate()
  resetLoading.value = true
  try {
    await authApi.resetPassword({
      phone: form.phone,
      code: form.code,
      newPassword: form.newPassword
    })
    ElMessage.success('密码重置成功，请使用新密码登录')
    switchToLogin()
  } finally {
    resetLoading.value = false
  }
}

onMounted(() => {
  generateCaptcha()
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  display: flex;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 900px;
  width: 100%;
  min-height: 580px;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  animation: pulse 15s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(25%, 25%); }
}

.brand-section {
  text-align: center;
  position: relative;
  z-index: 1;
}

.logo-wrapper {
  display: inline-flex;
  margin-bottom: 20px;
}

.logo-icon {
  display: inline-flex;
  width: 70px;
  height: 70px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 36px;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.brand-title {
  font-size: 32px;
  color: #fff;
  margin: 0 0 10px;
  font-weight: 700;
  letter-spacing: 2px;
}

.brand-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin: 0;
}

.features {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 50px;
  position: relative;
  z-index: 1;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.feature-icon {
  font-size: 28px;
  color: #667eea;
}

.login-right {
  flex: 1;
  padding: 50px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 360px;
}

.login-header {
  text-align: center;
  margin-bottom: 35px;
}

.login-header h2 {
  font-size: 26px;
  color: #1a1a2e;
  margin: 0 0 10px;
  font-weight: 600;
}

.login-header p {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.form-actions {
  margin-top: 20px;
}

.form-actions .el-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.form-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.code-input-wrapper {
  display: flex;
  gap: 12px;
}

.code-input-wrapper .el-input {
  flex: 1;
}

.code-input-wrapper .el-button {
  width: 120px;
  flex-shrink: 0;
}

.captcha-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-wrapper .captcha-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.captcha-image:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.captcha-image canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.forgot-password {
  text-align: center;
  margin-top: 20px;
}

.forgot-password .el-button {
  color: #667eea;
  font-size: 14px;
}

.forgot-password .el-button:hover {
  color: #764ba2;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 0 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #667eea;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

:deep(.el-input--large .el-input__inner) {
  height: 48px;
  line-height: 48px;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  
  .login-left {
    padding: 40px 30px;
  }
  
  .login-right {
    padding: 40px 30px;
  }
  
  .features {
    margin-top: 30px;
    gap: 20px;
  }
  
  .brand-title {
    font-size: 26px;
  }
}
</style>
