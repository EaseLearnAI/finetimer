
--- 测试用例 4: 压力+任务输入 ---
输入: "我压力好大，明天还有个重要的考试"
[02:53:17.478] info: 开始智能调度处理
  {
  "requestId": "dispatch-1755629597478-rox8je8ye",
  "userInput": "我压力好大，明天还有个重要的考试",
  "userId": "68a21bf0cdab688c24714231",
  "sessionId": "test_session_1755629556678_1755629597478",
  "inputLength": 16
}
[02:53:17.478] info: 步骤1: 执行意图识别 {"requestId":"dispatch-1755629597478-rox8je8ye"}
[02:53:17.478] info: 开始意图识别 {"userInput":"我压力好大，明天还有个重要的考试","inputLength":16}
[02:53:17.478] info: 发送请求到通义千问模型 {"messagesCount":2,"systemPromptLength":530,"userPromptLength":376}
[02:53:17.479] info: 准备调用通义千问API
  {
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  "model": "qwen-plus",
  "messagesCount": 2
}
[02:53:19.694] info: 通义千问API调用成功
  {
  "status": 200,
  "usage": {
    "prompt_tokens": 473,
    "completion_tokens": 105,
    "total_tokens": 578,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "model": "qwen-plus"
}
[02:53:19.694] info: 收到模型响应 {"responseLength":272,"responseTime":"2216ms"}
[02:53:19.695] info: 开始解析模型响应
  {
  "responseContent": "{\n  \"intent\": \"CONVERSATION\",\n  \"confidence\": 0.95,\n  \"reasoning\": \"用户表达了情绪压力，并提到了明天的重要考试，主要目的是情感倾诉和交流，没有明确的任务创建、时间调度或外部工具调用意图。\",\n  \"extracted_info\": {\n    \"keywords\": [\"压力\", \"考试\"],\n    \"entities\": {\n..."
}
[02:53:19.695] info: 意图识别结果解析成功 {"intent":"CONVERSATION","confidence":0.95,"hasExtractedInfo":true}
[02:53:19.695] info: 意图识别完成 {"intent":"CONVERSATION","confidence":0.95,"processingTime":"2217ms","success":true}
[02:53:19.695] info: 意图识别完成 {"requestId":"dispatch-1755629597478-rox8je8ye","intent":"CONVERSATION","confidence":0.95}
[02:53:19.695] info: 步骤2: 分析多重意图 {"requestId":"dispatch-1755629597478-rox8je8ye"}
[02:53:19.696] info: Action Router 分析完成
  {
  "userInput": "我压力好大，明天还有个重要的考试",
  "actionPlan": [
    {
      "intent": "TASK_CREATION",
      "priority": 1
    },
    {
      "intent": "CONVERSATION",
      "priority": 3
    }
  ],
  "totalActions": 2
}
[02:53:19.696] info: 多重意图分析完成
  {
  "requestId": "dispatch-1755629597478-rox8je8ye",
  "intents": [
    "TASK_CREATION",
    "CONVERSATION"
  ],
  "count": 2
}
[02:53:19.696] info: 步骤3: 执行相应的服务 {"requestId":"dispatch-1755629597478-rox8je8ye"}
[02:53:19.696] info: 执行优先级 1 的服务 {"intents":["TASK_CREATION"],"count":1}
[02:53:19.696] info: 开始执行任务创建
  {
  "userInput": "我压力好大，明天还有个重要的考试",
  "timeInfo": {
    "date": "2025-08-20",
    "timeBlock": null,
    "specificTime": null
  },
  "userId": "68a21bf0cdab688c24714231"
}
[02:53:19.697] info: 开始直接创建任务
  {
  "userInput": "我压力好大，明天还有个重要的考试",
  "userId": "68a21bf0cdab688c24714231",
  "timeInfo": {
    "date": "2025-08-20",
    "timeBlock": null,
    "specificTime": null
  }
}
[02:53:19.697] info: 开始意图识别 {"userInput":"我压力好大，明天还有个重要的考试","inputLength":16}
[02:53:19.697] info: 发送请求到通义千问模型 {"messagesCount":2,"systemPromptLength":530,"userPromptLength":376}
[02:53:19.697] info: 准备调用通义千问API
  {
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  "model": "qwen-plus",
  "messagesCount": 2
}
[02:53:21.469] info: 通义千问API调用成功
  {
  "status": 200,
  "usage": {
    "prompt_tokens": 473,
    "completion_tokens": 94,
    "total_tokens": 567,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "model": "qwen-plus"
}
[02:53:21.470] info: 收到模型响应 {"responseLength":254,"responseTime":"1773ms"}
[02:53:21.470] info: 开始解析模型响应
  {
  "responseContent": "{\n  \"intent\": \"CONVERSATION\",\n  \"confidence\": 0.95,\n  \"reasoning\": \"用户表达了情绪压力，并提到了明天的重要考试，主要目的是倾诉情绪，属于正常对话范畴。\",\n  \"extracted_info\": {\n    \"keywords\": [\"压力\", \"考试\"],\n    \"entities\": {\n      \"time\": \"明天\"..."
}
[02:53:21.470] info: 意图识别结果解析成功 {"intent":"CONVERSATION","confidence":0.95,"hasExtractedInfo":true}
[02:53:21.470] info: 意图识别完成 {"intent":"CONVERSATION","confidence":0.95,"processingTime":"1773ms","success":true}
[02:53:21.470] info: 意图识别完成（用于信息提取） {"intent":"CONVERSATION","confidence":0.95}
[02:53:21.471] info: 强制设置为任务创建意图 {"intent":"TASK_CREATION","confidence":0.95}
[02:53:21.471] info: 提取任务信息完成
  {
  "title": "考试",
  "timeBlock": {
    "startTime": "14:00",
    "endTime": "18:00",
    "timeBlockType": "afternoon"
  },
  "targetDate": "2025-08-20",
  "timeInfoInput": {
    "date": "2025-08-20",
    "timeBlock": null,
    "specificTime": null
  }
}
[02:53:21.471] info: 提取任务信息完成
  {
  "taskInfo": {
    "title": "考试",
    "userId": "68a21bf0cdab688c24714231",
    "timeBlock": {
      "startTime": "14:00",
      "endTime": "18:00",
      "timeBlockType": "afternoon"
    },
    "targetDate": "2025-08-20"
  }
}
[02:53:21.471] info: 开始存储任务到数据库
  {
  "taskInfo": {
    "title": "考试",
    "userId": "68a21bf0cdab688c24714231",
    "timeBlock": {
      "startTime": "14:00",
      "endTime": "18:00",
      "timeBlockType": "afternoon"
    },
    "targetDate": "2025-08-20"
  }
}
[02:53:21.475] info: 任务存储成功 {"taskId":"68a4c8213b6cf1088226a3d2"}
[02:53:21.475] info: 任务直接创建成功 {"taskId":"68a4c8213b6cf1088226a3d2","title":"考试","processingTime":"1779ms"}
[02:53:21.475] info: 任务创建完成 {"success":true}
[02:53:21.476] info: 优先级 1 的服务执行完成 {"results":["taskCreation"]}
[02:53:21.476] info: 执行优先级 3 的服务 {"intents":["CONVERSATION"],"count":1}
[02:53:21.476] info: 开始执行对话处理
  {
  "userInput": "我压力好大，明天还有个重要的考试",
  "userId": "68a21bf0cdab688c24714231",
  "sessionId": "test_session_1755629556678_1755629597478",
  "hasPreviousResults": true
}
[02:53:21.476] info: 开始处理对话
  {
  "userId": "68a21bf0cdab688c24714231",
  "sessionId": "test_session_1755629556678_1755629597478",
  "messageLength": 16
}
[02:53:21.477] info: 开始意图识别 我压力好大，明天还有个重要的考试... {"userId":"68a21bf0cdab688c24714231"}
[02:53:21.477] info: 开始意图识别 {"userInput":"我压力好大，明天还有个重要的考试","inputLength":16}
[02:53:21.477] info: 发送请求到通义千问模型 {"messagesCount":2,"systemPromptLength":530,"userPromptLength":376}
[02:53:21.477] info: 准备调用通义千问API
  {
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  "model": "qwen-plus",
  "messagesCount": 2
}
[02:53:23.668] info: 通义千问API调用成功
  {
  "status": 200,
  "usage": {
    "prompt_tokens": 473,
    "completion_tokens": 106,
    "total_tokens": 579,
    "prompt_tokens_details": {
      "cached_tokens": 256
    }
  },
  "model": "qwen-plus"
}
[02:53:23.669] info: 收到模型响应 {"responseLength":274,"responseTime":"2192ms"}
[02:53:23.669] info: 开始解析模型响应
  {
  "responseContent": "{\n  \"intent\": \"CONVERSATION\",\n  \"confidence\": 0.95,\n  \"reasoning\": \"用户表达了情绪压力，并提到了明天的重要考试，主要目的是情感倾诉和交流，没有明确的任务创建、时间调度或外部工具调用意图。\",\n  \"extracted_info\": {\n    \"keywords\": [\"压力\", \"考试\"],\n    \"entities\": {\n..."
}
[02:53:23.669] info: 意图识别结果解析成功 {"intent":"CONVERSATION","confidence":0.95,"hasExtractedInfo":true}
[02:53:23.669] info: 意图识别完成 {"intent":"CONVERSATION","confidence":0.95,"processingTime":"2192ms","success":true}
[02:53:23.675] info: 用户消息已保存 {"messageId":"68a4c8233b6cf1088226a3d5","intent":"CONVERSATION","confidence":0.95}
[02:53:23.679] info: 检测到用户情绪 {"userId":"68a21bf0cdab688c24714231","emotion":"stressed","keywords":["压力","考试"]}
[02:53:23.679] info: 开始生成AI回应 {"userId":"68a21bf0cdab688c24714231","historyCount":1}
[02:53:23.679] info: 调用通义千问API生成回应
  {
  "model": "qwen-plus",
  "messagesCount": 2,
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
}
[02:53:26.701] info: AI回应生成成功
  {
  "status": 200,
  "responseTime": "3021ms",
  "usage": {
    "prompt_tokens": 567,
    "completion_tokens": 75,
    "total_tokens": 642,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "model": "qwen-plus"
}
[02:53:26.705] info: 对话处理完成
  {
  "userId": "68a21bf0cdab688c24714231",
  "sessionId": "test_session_1755629556678_1755629597478",
  "userMessageId": "68a4c8233b6cf1088226a3d5",
  "assistantMessageId": "68a4c8263b6cf1088226a3d8",
  "totalTime": "5228ms",
  "emotion": "stressed",
  "intent": "CONVERSATION"
}
[02:53:26.705] info: 对话处理完成 {"success":true}
[02:53:26.705] info: 优先级 3 的服务执行完成 {"results":["taskCreation","conversation"]}
[02:53:26.705] info: 服务执行完成
  {
  "requestId": "dispatch-1755629597478-rox8je8ye",
  "servicesExecuted": [
    "taskCreation",
    "conversation"
  ],
  "successCount": 2
}
[02:53:26.705] info: 步骤4: 生成统一回复 {"requestId":"dispatch-1755629597478-rox8je8ye"}
[02:53:26.706] info: 开始生成统一回复
  {
  "userInput": "我压力好大，明天还有个重要的考试",
  "intentsCount": 2,
  "executionResultsKeys": [
    "taskCreation",
    "conversation"
  ],
  "executionResults": {
    "taskCreation": {
      "success": true,
      "message": "任务创建成功",
      "task": {
        "timeBlock": {
          "startTime": "14:00",
          "endTime": "18:00",
          "timeBlockType": "afternoon"
        },
        "_id": "68a4c8213b6cf1088226a3d2",
        "title": "考试",
        "description": "",
        "priority": "medium",
        "completed": false,
        "userId": "68a21bf0cdab688c24714231",
        "isScheduled": false,
        "createdAt": "2025-08-19T18:53:21.472Z",
        "updatedAt": "2025-08-19T18:53:21.472Z",
        "__v": 0
      },
      "intentResult": {
        "intent": "TASK_CREATION",
        "confidence": 0.95,
        "reasoning": "用户表达了情绪压力，并提到了明天的重要考试，主要目的是倾诉情绪，属于正常对话范畴。",
        "extracted_info": {
          "keywords": [
            "压力",
            "考试"
          ],
          "entities": {
            "time": "明天",
            "location": "",
            "task": "考试"
          }
        },
        "original_input": "我压力好大，明天还有个重要的考试",
        "timestamp": "2025-08-19T18:53:21.470Z",
        "intent_description": "正常对话（情绪安慰、聊天）"
      },
      "processingTime": 1779
    },
    "conversation": {
      "success": true,
      "data": {
        "sessionId": "test_session_1755629556678_1755629597478",
        "userMessage": {
          "id": "68a4c8233b6cf1088226a3d5",
          "content": "我压力好大，明天还有个重要的考试",
          "timestamp": "2025-08-19T18:53:23.672Z",
          "intent": "CONVERSATION",
          "confidence": 0.95
        },
        "assistantMessage": {
          "id": "68a4c8263b6cf1088226a3d8",
          "content": "别担心呀，我懂那种考试前紧张的感觉😔 今晚可以先深呼吸几次，让自己放松一下。如果睡不着的话，试试看听些轻音乐或者冥想，我之前考试前都会这样做呢🎵 你已经很努力了，相信自己一定可以的！要记得，无论结果如何，你都是最棒的！💪",
          "timestamp": "2025-08-19T18:53:26.703Z",
          "emotion": "stressed"
        },
        "metadata": {
          "processingTime": 5228,
          "intentInfo": {
            "intent": "CONVERSATION",
            "confidence": 0.95,
            "reasoning": "用户表达了情绪压力，并提到了明天的重要考试，主要目的是情感倾诉和交流，没有明确的任务创建、时间调度或外部工具调用意图。"
          },
          "conversationStats": {
            "historyCount": 1,
            "emotion": "stressed"
          }
        }
      }
    }
  }
}
[02:53:26.707] info: 调用通义千问API生成回应
  {
  "model": "qwen-plus",
  "messagesCount": 2,
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
}
[02:53:28.349] info: AI回应生成成功
  {
  "status": 200,
  "responseTime": "1642ms",
  "usage": {
    "prompt_tokens": 281,
    "completion_tokens": 54,
    "total_tokens": 335,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "model": "qwen-plus"
}
[02:53:28.350] info: 回复生成完成 {"requestId":"dispatch-1755629597478-rox8je8ye","responseLength":81}
[02:53:28.350] info: 智能调度处理完成
  {
  "requestId": "dispatch-1755629597478-rox8je8ye",
  "userId": "68a21bf0cdab688c24714231",
  "processingTime": "10872ms",
  "responseLength": 81,
  "servicesExecuted": [
    "taskCreation",
    "conversation"
  ]
}
调度结果: {
  success: true,
  intents: [ 'TASK_CREATION', 'CONVERSATION' ],
  servicesExecuted: [ 'taskCreation', 'conversation' ],
  responseLength: 81
}
期望意图: [ 'TASK_CREATION', 'CONVERSATION' ]
实际意图: [ 'TASK_CREATION', 'CONVERSATION' ]
⚠️  任务标题可能不准确:
  期望包含: 重要的考试
  实际标题: 考试
任务创建详情: {
  taskId: new ObjectId('68a4c8213b6cf1088226a3d2'),
  title: '考试',
  timeBlock: { startTime: '14:00', endTime: '18:00', timeBlockType: 'afternoon' }
}
✅ 测试通过

--- 测试用例 5: 多任务输入 ---
输入: "我下午三点要开会，四点要拿快递，五点还要去健身"
[02:53:28.351] info: 开始智能调度处理
  {
  "requestId": "dispatch-1755629608350-60f73y72b",
  "userInput": "我下午三点要开会，四点要拿快递，五点还要去健身",
  "userId": "68a21bf0cdab688c24714231",
  "sessionId": "test_session_1755629556678_1755629608350",
  "inputLength": 23
}
[02:53:28.351] info: 步骤1: 执行意图识别 {"requestId":"dispatch-1755629608350-60f73y72b"}
[02:53:28.351] info: 开始意图识别 {"userInput":"我下午三点要开会，四点要拿快递，五点还要去健身","inputLength":23}
[02:53:28.351] info: 发送请求到通义千问模型 {"messagesCount":2,"systemPromptLength":530,"userPromptLength":383}
[02:53:28.351] info: 准备调用通义千问API
  {
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  "model": "qwen-plus",
  "messagesCount": 2
}
[02:53:30.129] info: 通义千问API调用成功
  {
  "status": 200,
  "usage": {
    "prompt_tokens": 480,
    "completion_tokens": 110,
    "total_tokens": 590,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "model": "qwen-plus"
}
[02:53:30.130] info: 收到模型响应 {"responseLength":285,"responseTime":"1779ms"}
[02:53:30.130] info: 开始解析模型响应
  {
  "responseContent": "{\n  \"intent\": \"SCHEDULE_PLANNING\",\n  \"confidence\": 0.95,\n  \"reasoning\": \"用户明确描述了多个时间点对应的任务安排，主要目的是时间调度。\",\n  \"extracted_info\": {\n    \"keywords\": [\"开会\", \"拿快递\", \"健身\"],\n    \"entities\": {\n      \"time\": [\"三..."
}
[02:53:30.130] info: 意图识别结果解析成功 {"intent":"SCHEDULE_PLANNING","confidence":0.95,"hasExtractedInfo":true}
[02:53:30.131] info: 意图识别完成 {"intent":"SCHEDULE_PLANNING","confidence":0.95,"processingTime":"1779ms","success":true}
[02:53:30.131] info: 意图识别完成 {"requestId":"dispatch-1755629608350-60f73y72b","intent":"SCHEDULE_PLANNING","confidence":0.95}
[02:53:30.131] info: 步骤2: 分析多重意图 {"requestId":"dispatch-1755629608350-60f73y72b"}
[02:53:30.131] info: Action Router 分析完成
  {
  "userInput": "我下午三点要开会，四点要拿快递，五点还要去健身",
  "actionPlan": [
    {
      "intent": "TASK_CREATION",
      "priority": 1
    },
    {
      "intent": "SCHEDULE_PLANNING",
      "priority": 2
    }
  ],
  "totalActions": 2
}
[02:53:30.131] info: 多重意图分析完成
  {
  "requestId": "dispatch-1755629608350-60f73y72b",
  "intents": [
    "TASK_CREATION",
    "SCHEDULE_PLANNING"
  ],
  "count": 2
}
[02:53:30.131] info: 步骤3: 执行相应的服务 {"requestId":"dispatch-1755629608350-60f73y72b"}
[02:53:30.132] info: 执行优先级 1 的服务 {"intents":["TASK_CREATION"],"count":1}
[02:53:30.132] info: 开始执行任务创建
  {
  "userInput": "我下午三点要开会，四点要拿快递，五点还要去健身",
  "timeInfo": {
    "date": null,
    "timeBlock": {
      "timeBlockType": "afternoon",
      "startTime": "14:00",
      "endTime": "18:00"
    },
    "specificTime": null
  },
  "userId": "68a21bf0cdab688c24714231"
}
[02:53:30.132] info: 开始直接创建任务
  {
  "userInput": "我下午三点要开会，四点要拿快递，五点还要去健身",
  "userId": "68a21bf0cdab688c24714231",
  "timeInfo": {
    "date": null,
    "timeBlock": {
      "timeBlockType": "afternoon",
      "startTime": "14:00",
      "endTime": "18:00"
    },
    "specificTime": null
  }
}
[02:53:30.132] info: 开始意图识别 {"userInput":"我下午三点要开会，四点要拿快递，五点还要去健身","inputLength":23}
[02:53:30.132] info: 发送请求到通义千问模型 {"messagesCount":2,"systemPromptLength":530,"userPromptLength":383}
[02:53:30.132] info: 准备调用通义千问API
  {
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  "model": "qwen-plus",
  "messagesCount": 2
}
[02:53:32.006] info: 通义千问API调用成功
  {
  "status": 200,
  "usage": {
    "prompt_tokens": 480,
    "completion_tokens": 112,
    "total_tokens": 592,
    "prompt_tokens_details": {
      "cached_tokens": 256
    }
  },
  "model": "qwen-plus"
}
[02:53:32.007] info: 收到模型响应 {"responseLength":288,"responseTime":"1875ms"}
[02:53:32.007] info: 开始解析模型响应
  {
  "responseContent": "{\n  \"intent\": \"SCHEDULE_PLANNING\",\n  \"confidence\": 0.95,\n  \"reasoning\": \"用户明确提到了多个时间点及对应的任务安排，表现出对时间调度的需求。\",\n  \"extracted_info\": {\n    \"keywords\": [\"开会\", \"拿快递\", \"健身\"],\n    \"entities\": {\n      \"time\": ..."
}
[02:53:32.007] info: 意图识别结果解析成功 {"intent":"SCHEDULE_PLANNING","confidence":0.95,"hasExtractedInfo":true}
[02:53:32.007] info: 意图识别完成 {"intent":"SCHEDULE_PLANNING","confidence":0.95,"processingTime":"1875ms","success":true}
[02:53:32.007] info: 意图识别完成（用于信息提取） {"intent":"SCHEDULE_PLANNING","confidence":0.95}
[02:53:32.007] info: 强制设置为任务创建意图 {"intent":"TASK_CREATION","confidence":0.95}
[02:53:32.008] info: 提取任务信息完成
  {
  "title": "开会",
  "timeBlock": {
    "startTime": "14:00",
    "endTime": "18:00",
    "timeBlockType": "afternoon"
  },
  "timeInfoInput": {
    "date": null,
    "timeBlock": {
      "timeBlockType": "afternoon",
      "startTime": "14:00",
      "endTime": "18:00"
    },
    "specificTime": null
  }
}
[02:53:32.008] info: 提取任务信息完成
  {
  "taskInfo": {
    "title": "开会",
    "userId": "68a21bf0cdab688c24714231",
    "timeBlock": {
      "startTime": "14:00",
      "endTime": "18:00",
      "timeBlockType": "afternoon"
    }
  }
}
[02:53:32.008] info: 开始存储任务到数据库
  {
  "taskInfo": {
    "title": "开会",
    "userId": "68a21bf0cdab688c24714231",
    "timeBlock": {
      "startTime": "14:00",
      "endTime": "18:00",
      "timeBlockType": "afternoon"
    }
  }
}
[02:53:32.012] info: 任务存储成功 {"taskId":"68a4c82c3b6cf1088226a3da"}
[02:53:32.012] info: 任务直接创建成功 {"taskId":"68a4c82c3b6cf1088226a3da","title":"开会","processingTime":"1880ms"}
[02:53:32.012] info: 任务创建完成 {"success":true}
[02:53:32.012] info: 优先级 1 的服务执行完成 {"results":["taskCreation"]}
[02:53:32.012] info: 执行优先级 2 的服务 {"intents":["SCHEDULE_PLANNING"],"count":1}
[02:53:32.013] info: 开始执行时间调度
  {
  "userInput": "我下午三点要开会，四点要拿快递，五点还要去健身",
  "targetDate": "2025-08-19",
  "userId": "68a21bf0cdab688c24714231",
  "hasPreviousTaskCreation": true
}
[02:53:32.013] info: 开始任务调度规划
  {
  "userId": "68a21bf0cdab688c24714231",
  "userInput": "我下午三点要开会，四点要拿快递，五点还要去健身",
  "targetDate": "2025-08-19",
  "userContext": {
    "emotionalState": "neutral",
    "previousTaskCreation": {
      "success": true,
      "message": "任务创建成功",
      "task": {
        "timeBlock": {
          "startTime": "14:00",
          "endTime": "18:00",
          "timeBlockType": "afternoon"
        },
        "_id": "68a4c82c3b6cf1088226a3da",
        "title": "开会",
        "description": "",
        "priority": "medium",
        "completed": false,
        "userId": "68a21bf0cdab688c24714231",
        "isScheduled": false,
        "createdAt": "2025-08-19T18:53:32.009Z",
        "updatedAt": "2025-08-19T18:53:32.009Z",
        "__v": 0
      },
      "intentResult": {
        "intent": "TASK_CREATION",
        "confidence": 0.95,
        "reasoning": "用户明确提到了多个时间点及对应的任务安排，表现出对时间调度的需求。",
        "extracted_info": {
          "keywords": [
            "开会",
            "拿快递",
            "健身"
          ],
          "entities": {
            "time": [
              "三点",
              "四点",
              "五点"
            ],
            "location": [],
            "task": [
              "开会",
              "拿快递",
              "去健身"
            ]
          }
        },
        "original_input": "我下午三点要开会，四点要拿快递，五点还要去健身",
        "timestamp": "2025-08-19T18:53:32.007Z",
        "intent_description": "时间调度（日程安排、时间规划）"
      },
      "processingTime": 1880
    }
  }
}
[02:53:32.016] info: 获取用户现有任务 {"userId":"68a21bf0cdab688c24714231","taskCount":12,"date":"2025-08-19"}
[02:53:32.019] info: 获取用户任务集信息 {"userId":"68a21bf0cdab688c24714231","collectionCount":1}
[02:53:32.019] info: 构建调度规划Prompt完成 {"messagesCount":2}
[02:53:32.019] info: 调用通义千问API进行调度分析
  {
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  "model": "qwen-plus",
  "messagesCount": 2,
  "temperature": 0.3
}
[02:53:55.705] info: 通义千问API调用成功 (调度分析)
  {
  "status": 200,
  "usage": {
    "prompt_tokens": 2144,
    "completion_tokens": 1317,
    "total_tokens": 3461,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "model": "qwen-plus"
}
[02:53:55.705] info: 通义千问调度分析完成 {"responseLength":3283}
[02:53:55.706] info: 调度建议解析成功 {"adjustmentCount":6,"breakCount":2}
[02:53:55.706] info: 任务调度规划完成
  {
  "userId": "68a21bf0cdab688c24714231",
  "targetDate": "2025-08-19",
  "processingTime": "23693ms",
  "success": true
}
[02:53:55.706] info: 时间调度完成 {"success":true}
[02:53:55.706] info: 优先级 2 的服务执行完成 {"results":["taskCreation","schedulePlanning"]}
[02:53:55.707] info: 服务执行完成
  {
  "requestId": "dispatch-1755629608350-60f73y72b",
  "servicesExecuted": [
    "taskCreation",
    "schedulePlanning"
  ],
  "successCount": 2
}
[02:53:55.707] info: 步骤4: 生成统一回复 {"requestId":"dispatch-1755629608350-60f73y72b"}
[02:53:55.707] info: 开始生成统一回复
  {
  "userInput": "我下午三点要开会，四点要拿快递，五点还要去健身",
  "intentsCount": 2,
  "executionResultsKeys": [
    "taskCreation",
    "schedulePlanning"
  ],
  "executionResults": {
    "taskCreation": {
      "success": true,
      "message": "任务创建成功",
      "task": {
        "timeBlock": {
          "startTime": "14:00",
          "endTime": "18:00",
          "timeBlockType": "afternoon"
        },
        "_id": "68a4c82c3b6cf1088226a3da",
        "title": "开会",
        "description": "",
        "priority": "medium",
        "completed": false,
        "userId": "68a21bf0cdab688c24714231",
        "isScheduled": false,
        "createdAt": "2025-08-19T18:53:32.009Z",
        "updatedAt": "2025-08-19T18:53:32.009Z",
        "__v": 0
      },
      "intentResult": {
        "intent": "TASK_CREATION",
        "confidence": 0.95,
        "reasoning": "用户明确提到了多个时间点及对应的任务安排，表现出对时间调度的需求。",
        "extracted_info": {
          "keywords": [
            "开会",
            "拿快递",
            "健身"
          ],
          "entities": {
            "time": [
              "三点",
              "四点",
              "五点"
            ],
            "location": [],
            "task": [
              "开会",
              "拿快递",
              "去健身"
            ]
          }
        },
        "original_input": "我下午三点要开会，四点要拿快递，五点还要去健身",
        "timestamp": "2025-08-19T18:53:32.007Z",
        "intent_description": "时间调度（日程安排、时间规划）"
      },
      "processingTime": 1880
    },
    "schedulePlanning": {
      "success": true,
      "data": {
        "analysis": {
          "timeConflicts": [
            "用户提到下午三点开会、四点拿快递、五点健身，但这些任务在当前任务安排中未明确分配具体时间，存在潜在时间冲突风险。",
            "当前任务列表中存在多个重复任务（如健身和打电话给我妈），且未明确分配到具体时间段，可能导致时间资源浪费。"
          ],
          "priorityInsights": "所有任务目前优先级均为 medium，但根据四象限原则，健身任务被标记为重要不紧急（象限2），应优先安排。会议和拿快递任务可能属于紧急任务，需进一步分类以优化优先级。",
          "workloadAssessment": "用户总共有12个任务，其中90分钟的任务未安排时间，而下午时间块已满负荷（多个任务分配到14:00-18:00）。需要重新分配任务以避免超负荷。",
          "userStateConsiderations": "用户情绪状态为中性，适合安排常规任务，但需注意合理分配休息时间以避免疲劳。"
        },
        "recommendations": {
          "taskAdjustments": [
            {
              "taskId": "68a4c81c3b6cf1088226a3cf",
              "action": "update",
              "changes": {
                "title": "和同事开会",
                "date": "2025-08-19",
                "time": "15:00",
                "timeBlock": {
                  "startTime": "15:00",
                  "endTime": "15:30",
                  "timeBlockType": "afternoon"
                },
                "estimatedTime": 30,
                "priority": "high",
                "quadrant": 1,
                "reason": "用户明确提到下午三点需要开会，因此调整时间并标记为重要紧急任务。"
              }
            },
            {
              "taskId": "68a4c8013b6cf1088226a3c8",
              "action": "update",
              "changes": {
                "title": "拿快递",
                "date": "2025-08-19",
                "time": "16:00",
                "timeBlock": {
                  "startTime": "16:00",
                  "endTime": "16:30",
                  "timeBlockType": "afternoon"
                },
                "estimatedTime": 30,
                "priority": "medium",
                "quadrant": 3,
                "reason": "用户明确提到下午四点需要拿快递，因此调整时间并标记为紧急但不重要任务。"
              }
            },
            {
              "taskId": "68a4a8c57561b1a886bce69e",
              "action": "update",
              "changes": {
                "title": "健身",
                "date": "2025-08-19",
                "time": "17:00",
                "timeBlock": {
                  "startTime": "17:00",
                  "endTime": "17:30",
                  "timeBlockType": "afternoon"
                },
                "estimatedTime": 30,
                "priority": "medium",
                "quadrant": 2,
                "reason": "用户明确提到下午五点需要健身，因此调整时间并保持重要不紧急任务优先级。"
              }
            },
            {
              "taskId": "68a494860f1ec9ef62e6ff8b",
              "action": "delete",
              "changes": {
                "reason": "避免任务重复，删除未安排时间的健身任务。"
              }
            },
            {
              "taskId": "68a495a20f1ec9ef62e6ffc1",
              "action": "delete",
              "changes": {
                "reason": "避免任务重复，删除未安排时间的健身任务。"
              }
            },
            {
              "taskId": "68a495e10f1ec9ef62e6ffee",
              "action": "delete",
              "changes": {
                "reason": "避免任务重复，删除未安排时间的健身任务。"
              }
            }
          ],
          "breakSuggestions": [
            {
              "startTime": "15:30",
              "endTime": "16:00",
              "type": "short",
              "activity": "短暂休息，喝杯水或伸展身体。"
            },
            {
              "startTime": "16:30",
              "endTime": "17:00",
              "type": "short",
              "activity": "短暂休息，放松眼睛或进行简单冥想。"
            }
          ],
          "optimizationTips": [
            "将任务按优先级分类，确保重要紧急任务优先安排。",
            "减少重复任务数量，避免时间浪费。",
            "合理安排休息时间，提高工作效率。"
          ]
        },
        "schedule": {
          "morning": [],
          "forenoon": [],
          "afternoon": [
            "68a4c81c3b6cf1088226a3cf",
            "68a4c8013b6cf1088226a3c8",
            "68a4a8c57561b1a886bce69e"
          ],
          "evening": []
        },
        "summary": "根据用户需求，将下午三点的会议、四点的拿快递和五点的健身任务分别安排到15:00-15:30、16:00-16:30和17:00-17:30，并调整优先级。同时删除重复的健身任务以优化时间分配。建议在任务之间安排短暂休息以提高效率。",
        "appliedChanges": [],
        "metadata": {
          "currentTime": "2025/08/20 02:53:32",
          "targetDate": "2025-08-19",
          "existingTaskCount": 12,
          "collectionCount": 1,
          "userContext": {
            "emotionalState": "neutral",
            "previousTaskCreation": {
              "success": true,
              "message": "任务创建成功",
              "task": {
                "timeBlock": {
                  "startTime": "14:00",
                  "endTime": "18:00",
                  "timeBlockType": "afternoon"
                },
                "_id": "68a4c82c3b6cf1088226a3da",
                "title": "开会",
                "description": "",
                "priority": "medium",
                "completed": false,
                "userId": "68a21bf0cdab688c24714231",
                "isScheduled": false,
                "createdAt": "2025-08-19T18:53:32.009Z",
                "updatedAt": "2025-08-19T18:53:32.009Z",
                "__v": 0
              },
              "intentResult": {
                "intent": "TASK_CREATION",
                "confidence": 0.95,
                "reasoning": "用户明确提到了多个时间点及对应的任务安排，表现出对时间调度的需求。",
                "extracted_info": {
                  "keywords": [
                    "开会",
                    "拿快递",
                    "健身"
                  ],
                  "entities": {
                    "time": [
                      "三点",
                      "四点",
                      "五点"
                    ],
                    "location": [],
                    "task": [
                      "开会",
                      "拿快递",
                      "去健身"
                    ]
                  }
                },
                "original_input": "我下午三点要开会，四点要拿快递，五点还要去健身",
                "timestamp": "2025-08-19T18:53:32.007Z",
                "intent_description": "时间调度（日程安排、时间规划）"
              },
              "processingTime": 1880
            }
          },
          "autoApplied": false,
          "processingTime": 23693
        }
      }
    }
  }
}
[02:53:55.710] info: 调用通义千问API生成回应
  {
  "model": "qwen-plus",
  "messagesCount": 2,
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
}
[02:53:57.143] info: AI回应生成成功
  {
  "status": 200,
  "responseTime": "1433ms",
  "usage": {
    "prompt_tokens": 291,
    "completion_tokens": 55,
    "total_tokens": 346,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "model": "qwen-plus"
}
[02:53:57.143] info: 回复生成完成 {"requestId":"dispatch-1755629608350-60f73y72b","responseLength":82}
[02:53:57.144] info: 智能调度处理完成
  {
  "requestId": "dispatch-1755629608350-60f73y72b",
  "userId": "68a21bf0cdab688c24714231",
  "processingTime": "28794ms",
  "responseLength": 82,
  "servicesExecuted": [
    "taskCreation",
    "schedulePlanning"
  ]
}
调度结果: {
  success: true,
  intents: [ 'TASK_CREATION', 'SCHEDULE_PLANNING' ],
  servicesExecuted: [ 'taskCreation', 'schedulePlanning' ],
  responseLength: 82
}
期望意图: [ 'TASK_CREATION', 'SCHEDULE_PLANNING' ]
实际意图: [ 'TASK_CREATION', 'SCHEDULE_PLANNING' ]
任务创建详情: {
  taskId: new ObjectId('68a4c82c3b6cf1088226a3da'),
  title: '开会',
  timeBlock: { startTime: '14:00', endTime: '18:00', timeBlockType: 'afternoon' }
}
✅ 测试通过

=== 测试结果汇总 ===
通过: 5/5
成功率: 100.0%
🎉 所有测试用例都通过了！
数据库连接已关闭
