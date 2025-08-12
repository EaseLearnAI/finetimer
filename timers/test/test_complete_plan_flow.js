const axios = require('axios');

// 测试完整的计划生成流程
async function testCompletePlanFlow() {
    try {
        console.log('=== 测试完整计划生成流程 ===');
        
        const testInput = '我想在一个月内学会基础的前端开发技能，包括HTML、CSS和JavaScript';
        
        // 1. 测试输入处理和分类
        console.log('\n1. 测试输入处理...');
        const processResponse = await axios.post('http://localhost:3001/api/ai/process-input', {
            userInput: testInput
        });
        
        console.log('输入分类结果:', {
            success: processResponse.data.success,
            type: processResponse.data.type,
            message: processResponse.data.message
        });
        
        if (processResponse.data.type !== 'goal_planning') {
            console.log('❌ 输入分类错误，期望 goal_planning，实际:', processResponse.data.type);
            return;
        }
        
        // 2. 测试问题生成
        console.log('\n2. 测试问题生成...');
        const questionsResponse = await axios.post('http://localhost:3001/api/ai/generate-questions', {
            goal: testInput,
            goalType: 'goal_planning'
        });
        
        console.log('问题生成结果:', {
            success: questionsResponse.data.success,
            questionsCount: questionsResponse.data.questions?.length || 0
        });
        
        if (!questionsResponse.data.success || !questionsResponse.data.questions) {
            console.log('❌ 问题生成失败');
            return;
        }
        
        // 3. 模拟用户回答
        const mockAnswers = {
            '您目前的前端开发基础如何？': '完全零基础，之前没有接触过编程',
            '您每天可以投入多少时间学习？': '每天可以投入2-3小时学习',
            '您希望通过什么方式学习？': '希望通过在线教程和实践项目来学习',
            '您的学习目标是什么？': '希望能够独立制作一个简单的个人网站'
        };
        
        console.log('\n3. 使用模拟回答生成计划...');
        
        // 4. 测试计划生成
        const planResponse = await axios.post('http://localhost:3001/api/ai/generate-plan', {
            goal: testInput,
            goalType: 'goal_planning',
            userAnswers: mockAnswers
        });
        
        console.log('计划生成结果:', {
            success: planResponse.data.success,
            type: planResponse.data.type,
            hasOverview: !!planResponse.data.plan?.plan_overview,
            collectionsCount: planResponse.data.database_result?.collections?.length || 0,
            totalTasks: planResponse.data.database_result?.total_tasks || 0
        });
        
        // 打印完整响应数据以调试
        console.log('\n完整响应数据结构:');
        console.log('- 顶层字段:', Object.keys(planResponse.data));
        console.log('- plan字段存在:', 'plan' in planResponse.data);
        console.log('- database_result字段存在:', 'database_result' in planResponse.data);
        console.log('- summary字段存在:', 'summary' in planResponse.data);
        
        if (planResponse.data.plan) {
            console.log('- plan字段内容:', Object.keys(planResponse.data.plan));
        }
        if (planResponse.data.database_result) {
            console.log('- database_result字段内容:', Object.keys(planResponse.data.database_result));
        }
        if (planResponse.data.summary) {
            console.log('- summary字段内容:', planResponse.data.summary);
        }
        
        if (!planResponse.data.success) {
            console.log('❌ 计划生成失败:', planResponse.data.error);
            return;
        }
        
        // 5. 验证数据结构
        console.log('\n4. 验证数据结构...');
        const responseData = planResponse.data.result || planResponse.data;
        const plan = responseData.plan;
        const dbResult = responseData.database_result;
        const summary = responseData.summary;
        
        console.log('计划概述:', plan?.plan_overview?.substring(0, 100) + '...');
        console.log('任务集数量:', dbResult?.collections?.length);
        console.log('总任务数:', dbResult?.total_tasks);
        console.log('摘要信息:', {
            collections_count: summary?.collections_count,
            tasks_count: summary?.tasks_count
        });
        
        // 验证前端需要的数据结构
        console.log('\n前端数据验证:');
        console.log('- plan.plan_overview存在:', !!plan?.plan_overview);
        console.log('- database_result.collections存在:', !!dbResult?.collections);
        console.log('- summary.collections_count:', summary?.collections_count);
        console.log('- summary.tasks_count:', summary?.tasks_count);
        
        // 6. 验证任务详情
        if (dbResult?.collections && dbResult.collections.length > 0) {
            console.log('\n5. 验证任务详情...');
            dbResult.collections.forEach((collection, index) => {
                console.log(`任务集 ${index + 1}: ${collection.name}`);
                console.log(`  - 描述: ${collection.description}`);
                console.log(`  - 任务数量: ${collection.tasks?.length || 0}`);
                
                if (collection.tasks && collection.tasks.length > 0) {
                    collection.tasks.slice(0, 2).forEach((task, taskIndex) => {
                        console.log(`    任务 ${taskIndex + 1}: ${task.title}`);
                        console.log(`      优先级: ${task.priority}, 象限: ${task.quadrant}`);
                    });
                }
            });
        }
        
        console.log('\n✅ 完整计划生成流程测试成功！');
        console.log('前端应该能够正确显示包含以下信息的计划:');
        console.log('- 计划概述');
        console.log(`- ${dbResult?.collections?.length || 0} 个任务集`);
        console.log(`- 总共 ${dbResult?.total_tasks || 0} 个具体任务`);
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
    }
}

testCompletePlanFlow();