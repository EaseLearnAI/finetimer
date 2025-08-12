const axios = require('axios');

// 测试计划生成修复
async function testPlanGenerationFix() {
  console.log('🧪 测试计划生成修复...');
  
  const baseURL = 'http://localhost:3001/api/ai';
  const userId = '68974d3a68e7adf1e74f68ab';
  
  try {
    // 步骤1: 测试输入分类
    console.log('\n📝 步骤1: 测试输入分类');
    const classifyResponse = await axios.post(`${baseURL}/process-input`, {
      userInput: '我明天打算开始健身',
      userId: userId
    });
    
    console.log('分类结果:', {
      type: classifyResponse.data.type,
      category: classifyResponse.data.result?.classification?.category,
      questions_count: classifyResponse.data.result?.questions?.questions?.length || 0
    });
    
    // 步骤2: 直接测试计划生成
    console.log('\n📋 步骤2: 测试计划生成');
    const planResponse = await axios.post(`${baseURL}/generate-plan`, {
      goal: '我明天打算开始健身',
      goalType: 'goal_planning',
      userAnswers: [
        '增肌，锻炼背部，之前从来没有过健身',
        '明天我打算锻炼背部',
        '从来没有过健身经验'
      ],
      userId: userId
    });
    
    console.log('\n✅ 计划生成成功!');
    console.log('响应类型:', planResponse.data.type);
    console.log('计划概述:', planResponse.data.result?.plan?.plan_overview);
    console.log('任务集数量:', planResponse.data.result?.plan?.collections?.length || 0);
    
    // 统计任务数量
    let totalTasks = 0;
    if (planResponse.data.result?.plan?.collections) {
      planResponse.data.result.plan.collections.forEach((collection, index) => {
        const taskCount = collection.tasks?.length || 0;
        totalTasks += taskCount;
        console.log(`任务集${index + 1}: ${collection.name} (${taskCount}个任务)`);
        
        // 显示前3个任务的标题
        if (collection.tasks && collection.tasks.length > 0) {
          collection.tasks.slice(0, 3).forEach((task, taskIndex) => {
            console.log(`  - ${task.title}`);
          });
          if (collection.tasks.length > 3) {
            console.log(`  - ... 还有${collection.tasks.length - 3}个任务`);
          }
        }
      });
    }
    
    console.log(`\n📊 总计: ${totalTasks}个任务`);
    console.log('数据库结果:', {
      collections_count: planResponse.data.result?.database_result?.collections?.length || 0,
      total_tasks: planResponse.data.result?.database_result?.total_tasks || 0
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testPlanGenerationFix();
