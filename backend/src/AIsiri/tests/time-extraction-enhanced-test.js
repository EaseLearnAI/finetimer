const IntentRecognitionService = require('../services/intentRecognitionService');
const TaskRecognitionService = require('../services/taskRecognitionService');

// 初始化服务
const intentService = new IntentRecognitionService();
const taskService = new TaskRecognitionService();

// 测试用例：增强的时间提取
const timeTestCases = [
    {
        input: "明天上午10点开会",
        expectedTitle: "开会",
        expectedTime: {
            startTime: "10:00",
            endTime: "11:00",
            timeBlockType: "morning"
        }
    },
    {
        input: "下午3点半去医院",
        expectedTitle: "去医院",
        expectedTime: {
            startTime: "15:30",
            endTime: "16:30",
            timeBlockType: "afternoon"
        }
    },
    {
        input: "晚上8点看电影",
        expectedTitle: "看电影",
        expectedTime: {
            startTime: "20:00",
            endTime: "21:00",
            timeBlockType: "evening"
        }
    },
    {
        input: "周五早上9:30面试",
        expectedTitle: "面试",
        expectedTime: {
            startTime: "09:30",
            endTime: "10:30",
            timeBlockType: "morning"
        }
    },
    {
        input: "下周二下午2点开会",
        expectedTitle: "开会",
        expectedTime: {
            startTime: "14:00",
            endTime: "15:00",
            timeBlockType: "afternoon"
        }
    }
];

async function runTimeExtractionTests() {
    console.log('=== 增强的时间提取测试 ===\n');
    
    for (let i = 0; i < timeTestCases.length; i++) {
        const testCase = timeTestCases[i];
        console.log(`测试案例 ${i + 1}: "${testCase.input}"`);
        console.log('---');
        
        try {
            // 意图识别
            const intentResult = await intentService.recognizeIntent(testCase.input);
            console.log('意图识别结果:', {
                intent: intentResult.intent,
                confidence: intentResult.confidence,
                entities: intentResult.extracted_info?.entities
            });
            
            // 任务信息提取
            const taskInfo = taskService.extractTaskInfo(intentResult);
            console.log('任务信息提取结果:', {
                title: taskInfo.title,
                timeBlock: taskInfo.timeBlock,
                scheduledDate: taskInfo.scheduledDate
            });
            
            // 验证结果
            console.log('\n验证结果:');
            
            // 验证任务标题
            const titleMatch = taskInfo.title === testCase.expectedTitle;
            console.log(`✓ 任务标题: ${taskInfo.title} ${titleMatch ? '✅' : '❌ (期望: ' + testCase.expectedTitle + ')'}`);
            
            // 验证时间信息
            if (testCase.expectedTime && taskInfo.timeBlock) {
                const timeMatch = 
                    taskInfo.timeBlock.startTime === testCase.expectedTime.startTime &&
                    taskInfo.timeBlock.endTime === testCase.expectedTime.endTime &&
                    taskInfo.timeBlock.timeBlockType === testCase.expectedTime.timeBlockType;
                
                console.log(`✓ 开始时间: ${taskInfo.timeBlock.startTime} ${taskInfo.timeBlock.startTime === testCase.expectedTime.startTime ? '✅' : '❌ (期望: ' + testCase.expectedTime.startTime + ')'}`);
                console.log(`✓ 结束时间: ${taskInfo.timeBlock.endTime} ${taskInfo.timeBlock.endTime === testCase.expectedTime.endTime ? '✅' : '❌ (期望: ' + testCase.expectedTime.endTime + ')'}`);
                console.log(`✓ 时间段类型: ${taskInfo.timeBlock.timeBlockType} ${taskInfo.timeBlock.timeBlockType === testCase.expectedTime.timeBlockType ? '✅' : '❌ (期望: ' + testCase.expectedTime.timeBlockType + ')'}`);
            } else {
                console.log('❌ 时间信息提取失败');
            }
            
        } catch (error) {
            console.error('测试失败:', error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
    }
}

// 运行测试
runTimeExtractionTests().catch(console.error);