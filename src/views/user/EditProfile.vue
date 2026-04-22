<template>
  <div class="profile-container">
    <div class="page-header">
      <h2 class="page-title">个人信息</h2>
      <p class="page-desc">修改用户名、手机号、邮箱以及头像。填写时需格式正确，且不与其它账号重复。</p>
    </div>

    <el-card class="form-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="top"
      >
        <el-form-item label="头像">
          <div class="avatar-uploader">
            <el-avatar :size="72" :src="form.avatarUrl || undefined" class="avatar">
              {{ form.username?.charAt(0)?.toUpperCase() || 'A' }}
            </el-avatar>
            <el-upload
              :show-file-list="false"
              accept="image/*"
              :before-upload="handleAvatarUpload"
            >
              <el-button :loading="uploading" :icon="Upload">
                {{ form.avatarUrl ? '更换头像' : '上传头像' }}
              </el-button>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" maxlength="20" show-word-limit placeholder="3-20 位" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="11" placeholder="11 位中国大陆手机号" />
        </el-form-item>
        <el-form-item label="邮箱（选填）" prop="email">
          <el-input v-model="form.email" placeholder="可不填" clearable />
        </el-form-item>
        <el-form-item style="margin-top: 24px">
          <el-button type="primary" :loading="loading" @click="handleSubmit">保存</el-button>
          <el-button @click="loadFromStore">恢复</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 验证码弹窗 -->
    <el-dialog
      v-model="codeDialogVisible"
      title="验证手机号"
      width="400px"
    >
      <el-form
        ref="codeFormRef"
        :model="codeForm"
        :rules="codeRules"
        label-position="top"
      >
        <el-form-item label="验证码" prop="code">
          <div class="code-input-wrapper">
            <el-input
              v-model="codeForm.code"
              placeholder="请输入验证码"
              maxlength="6"
              :prefix-icon="Message"
            />
            <el-button
              type="primary"
              :disabled="countdown > 0"
              :loading="sendingCode"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="codeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleVerifyCode">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Message } from '@element-plus/icons-vue'
import { updateProfile } from '@/api/admin-account'
import { uploadApi } from '@/api/upload'
import { authApi } from '@/api/auth'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()
const loading = ref(false)
const uploading = ref(false)
const formRef = ref()
const codeFormRef = ref()
const codeDialogVisible = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const originalPhone = ref('')
const codeForm = ref({
  code: ''
})

const form = ref({
  username: '',
  phone: '',
  email: '',
  avatarUrl: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的 11 位手机号', trigger: 'blur' }
  ],
  email: [
    {
      validator: (_rule, value, callback) => {
        if (!value || !String(value).trim()) {
          callback()
          return
        }
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
        callback(ok ? undefined : new Error('邮箱格式不正确'))
      },
      trigger: 'blur'
    }
  ]
}

const codeRules = {
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码为6位数字', trigger: 'blur' }
  ]
}

function loadFromStore() {
  const u = adminStore.userInfo
  if (!u) return
  form.value = {
    username: u.username || '',
    phone: u.phone || '',
    email: u.email || '',
    avatarUrl: u.avatarUrl || ''
  }
  originalPhone.value = u.phone || ''
}

onMounted(() => {
  loadFromStore()
})

const handleAvatarUpload = async (file) => {
  uploading.value = true
  try {
    const res = await uploadApi.image(file)
    form.value.avatarUrl = res.data
    ElMessage.success('头像上传成功')
  } finally {
    uploading.value = false
  }
  return false
}

const handleSendCode = async () => {
  if (!form.value.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(form.value.phone)) {
    ElMessage.warning('手机号格式不正确')
    return
  }
  
  sendingCode.value = true
  try {
    await authApi.sendChangePhoneCode(originalPhone.value, form.value.phone)
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

const handleVerifyCode = async () => {
  if (!codeFormRef.value) return
  await codeFormRef.value.validate()
  
  loading.value = true
  try {
    // 先通过验证码修改手机号
    await authApi.changePhone({
      originPhoneNumber: originalPhone.value,
      newPhoneNumber: form.value.phone.trim(),
      code: codeForm.value.code
    })
    
    // 再更新其他个人信息
    const res = await updateProfile({
      username: form.value.username.trim(),
      phone: form.value.phone.trim(),
      email: form.value.email?.trim() ?? '',
      avatarUrl: form.value.avatarUrl
    })
    const data = res.data
    if (data?.token) adminStore.setToken(data.token)
    if (data?.userInfo) adminStore.setUserInfo(data.userInfo)
    ElMessage.success('保存成功')
    codeDialogVisible.value = false
    originalPhone.value = form.value.phone
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  
  // 检查手机号是否变更
  if (form.value.phone.trim() !== originalPhone.value) {
    // 重置验证码相关状态
    codeForm.value.code = ''
    countdown.value = 0
    // 显示验证码弹窗
    codeDialogVisible.value = true
  } else {
    // 直接保存
    loading.value = true
    try {
      const res = await updateProfile({
        username: form.value.username.trim(),
        phone: form.value.phone.trim(),
        email: form.value.email?.trim() ?? '',
        avatarUrl: form.value.avatarUrl
      })
      const data = res.data
      if (data?.token) adminStore.setToken(data.token)
      if (data?.userInfo) adminStore.setUserInfo(data.userInfo)
      ElMessage.success('保存成功')
    } finally {
      loading.value = false
    }
  }
}
</script>

<style scoped>
.profile-container { max-width: 560px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 22px; color: #303133; margin: 0 0 8px; }
.page-desc { margin: 0; font-size: 14px; color: #909399; }
.form-card { padding: 20px; border-radius: 8px; }
.avatar-uploader { display: flex; align-items: center; gap: 16px; }
.avatar { background-color: #409eff !important; color: #fff !important; }
.code-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}
.code-input-wrapper .el-input {
  flex: 1;
}
.code-input-wrapper .el-button {
  width: 120px;
  flex-shrink: 0;
}
</style>
