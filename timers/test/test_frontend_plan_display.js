/**
 * 测试前端计划显示修复
 * 验证前端是否能正确处理和显示计划生成响应
 */

const axios = require('axios')

const API_BASE_URL = 'http://localhost:3001'
const TEST_USER_ID = 'test_user_frontend_plan'

async function testFrontendPlanDisplay() {
  console.log('🧪 === 测试前端计划显示修复 ===')
  
  try {
    // 1. 测试输入分类
    console.log('\n1️⃣ 测试输入分类...')
    const classifyResponse = await axios.post(`${API_BASE_URL}/api/ai/process-input`, {
      userInput: '我想制定一个学习计划，每天学习2小时编程',
      userId: TEST_USER_ID
    })
    
    console.log('分类结果:', {
      type: classifyResponse.data.type,
      success: classifyResponse.data.success
    })
    
    if (classifyResponse.data.type === 'goal_planning') {
      console.log('✅ 输入正确分类为 goal_planning')
      
      // 2. 直接生成计划（模拟用户已回答问题）
      console.log('\n2️⃣ 直接生成计划...')
      const planResponse = await axios.post(`${API_BASE_URL}/api/ai/generate-plan`, {
        goal: '我想制定一个学习计划，每天学习2小时编程',
        goalType: 'goal_planning',
        userAnswers: [
          '我是编程初学者',
          '我想学习JavaScript和React',
          '我每天晚上7-9点有空',
          '我希望3个月内能做出一个小项目',
          '我有一台电脑和网络'
        ],
        userId: TEST_USER_ID
      })
      
      console.log('\n📊 计划生成响应结构:')
      console.log('- success:', planResponse.data.success)
      console.log('- type:', planResponse.data.type)
      console.log('- result.type:', planResponse.data.result?.type)
      console.log('- result.message:', planResponse.data.result?.message)
      
      if (planResponse.data.result?.plan) {
        console.log('- plan_overview:', planResponse.data.result.plan.plan_overview)
        console.log('- collections数量:', planResponse.data.result.plan.collections?.length || 0)
        
        // 统计总任务数
        let totalTasks = 0
        if (planResponse.data.result.plan.collections) {
          planResponse.data.result.plan.collections.forEach(collection => {
            totalTasks += collection.tasks?.length || 0
          })
        }
        console.log('- 总任务数:', totalTasks)
      }
      
      if (planResponse.data.result?.database_result) {
        console.log('- database_result.collections_count:', planResponse.data.result.database_result.collections_count)
        console.log('- database_result.total_tasks:', planResponse.data.result.database_result.total_tasks)
      }
      
      // 3. 验证前端期望的数据结构
      console.log('\n3️⃣ 验证前端数据结构兼容性...')
      const result = planResponse.data.result
      
      // 模拟前端 messageService.js 的处理逻辑
      const frontendMetadata = {
        plan: result.plan,
        summary: {
          collections_count: result.database_result?.collections_count || 0,
          tasks_count: result.database_result?.total_tasks || 0
        },
        databaseResult: result.database_result
      }
      
      console.log('前端 metadata 结构:')
      console.log('- metadata.plan 存在:', !!frontendMetadata.plan)
      console.log('- metadata.summary.collections_count:', frontendMetadata.summary.collections_count)
      console.log('- metadata.summary.tasks_count:', frontendMetadata.summary.tasks_count)
      
      // 验证 MessageCard.vue 需要的字段
      const hasRequiredFields = (
        frontendMetadata.plan &&
        frontendMetadata.plan.plan_overview &&
        typeof frontendMetadata.summary.collections_count === 'number' &&
        typeof frontendMetadata.summary.tasks_count === 'number'
      )
      
      if (hasRequiredFields) {
        console.log('✅ 前端数据结构完整，MessageCard.vue 应该能正确显示')
      } else {
        console.log('❌ 前端数据结构不完整')
      }
      
    } else {
      console.log('❌ 输入分类错误，期望 goal_planning，实际:', classifyResponse.data.type)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
  }
}

// 运行测试
testFrontendPlanDisplay()