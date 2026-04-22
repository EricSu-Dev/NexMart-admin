<template>
  <div class="profile-container">
    <div class="page-header">
      <h2 class="page-title">修改密码</h2>
    </div>

    <el-card class="form-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="top"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="form.oldPassword"
            type="password"
            show-password
            placeholder="请输入当前登录密码"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            show-password
            placeholder="请输入 6-20 位新密码"
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            show-password
            placeholder="请再次通过输入新密码"
          />
        </el-form-item>

        <el-form-item style="margin-top: 30px">
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            确认修改
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
      
      <div class="password-tip">
        <el-alert
          title="提示"
          type="info"
          description="密码修改成功后，系统将自动跳转至登录页面，请使用新密码重新登录。"
          show-icon
          :closable="false"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { updatePassword } from '@/api/admin-account'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()
const loading = ref(false)
const formRef = ref()

const form = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== form.value.newPassword) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirm, trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  loading.value = true
  try {
    await updatePassword({
      oldPassword: form.value.oldPassword,
      newPassword: form.value.newPassword
    })
    
    ElMessage.success('密码修改成功，请重新登录')
    
    // 退出登录并跳转
    adminStore.logout()
    router.push('/login')
  } catch (error) {
    // 错误处理通常在 request.js 中统一处理，这里不需要额外操作
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
}
</script>

<style scoped>
.profile-container { max-width: 600px; margin: 0 auto; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 22px; color: #303133; margin: 0; }
.form-card { padding: 20px; border-radius: 8px; }
.password-tip { margin-top: 24px; }
</style>
