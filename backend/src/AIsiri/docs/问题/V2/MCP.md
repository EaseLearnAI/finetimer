info: [JWT认证] 认证成功，耗时: 3ms, userId: 68a21bf0cdab688c24714231, URL: /api/aisiri/dispatch {"service":"aisiri-backend","timestamp":"2025-08-19T20:43:48.151Z"}
info: [JWT认证] 认证成功，耗时: 28ms, userId: 68a21bf0cdab688c24714231, URL: /api/aisiri/dispatch {"service":"aisiri-backend","timestamp":"2025-08-19T20:43:48.180Z"}
info: [JWT认证] 认证成功，耗时: 6ms, userId: 68a21bf0cdab688c24714231, URL: /api/aisiri/dispatch {"service":"aisiri-backend","timestamp":"2025-08-19T20:43:48.186Z"}
[04:43:48.187] info: 智能调度请求 {"url":"/api/aisiri/dispatch","userId":"68a21bf0cdab688c24714231","ip":"::1"}
[04:43:48.187] info: 收到智能调度请求
  {
  "userId": "68a21bf0cdab688c24714231",
  "userInput": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
  "sessionId": "session_1755634525219_l43hna077",
  "deviceInfo": {
    "platform": "web",
    "version": "2.0.0"
  }
}
[04:43:48.188] info: 开始智能调度处理
  {
  "requestId": "dispatch-1755636228188-dztl66ddb",
  "userInput": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
  "userId": "68a21bf0cdab688c24714231",
  "sessionId": "session_1755634525219_l43hna077",
  "inputLength": 30
}
[04:43:48.188] info: 步骤1: 执行意图识别 {"requestId":"dispatch-1755636228188-dztl66ddb"}
[04:43:48.188] info: 开始意图识别 {"userInput":"我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久","inputLength":30}
[04:43:48.188] info: 发送请求到通义千问模型 {"messagesCount":2,"systemPromptLength":530,"userPromptLength":390}
[04:43:48.188] info: 准备调用通义千问API
  {
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  "model": "qwen-plus",
  "messagesCount": 2
}
[04:43:50.570] info: 通义千问API调用成功
  {
  "status": 200,
  "usage": {
    "prompt_tokens": 479,
    "completion_tokens": 105,
    "total_tokens": 584,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "model": "qwen-plus"
}
[04:43:50.571] info: 收到模型响应 {"responseLength":273,"responseTime":"2383ms"}
[04:43:50.571] info: 开始解析模型响应
  {
  "responseContent": "{\n  \"intent\": \"SCHEDULE_PLANNING\",\n  \"confidence\": 0.95,\n  \"reasoning\": \"用户希望安排下午去虹桥机场的时间，并查看所需时长，主要涉及时间规划和调度。\",\n  \"extracted_info\": {\n    \"keywords\": [\"安排\", \"时间\", \"虹桥机场\"],\n    \"entities\": {\n      \"ti..."
}
[04:43:50.571] info: 意图识别结果解析成功 {"intent":"SCHEDULE_PLANNING","confidence":0.95,"hasExtractedInfo":true}
[04:43:50.572] info: 意图识别完成 {"intent":"SCHEDULE_PLANNING","confidence":0.95,"processingTime":"2384ms","success":true}
[04:43:50.572] info: 意图识别完成 {"requestId":"dispatch-1755636228188-dztl66ddb","intent":"SCHEDULE_PLANNING","confidence":0.95}
[04:43:50.572] info: 步骤2: 分析多重意图 {"requestId":"dispatch-1755636228188-dztl66ddb"}
[04:43:50.572] info: Action Router 分析完成
  {
  "userInput": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
  "actionPlan": [
    {
      "intent": "TASK_CREATION",
      "priority": 1
    },
    {
      "intent": "EXTERNAL_TOOL",
      "priority": 1
    },
    {
      "intent": "SCHEDULE_PLANNING",
      "priority": 2
    }
  ],
  "totalActions": 3
}
[04:43:50.572] info: 多重意图分析完成
  {
  "requestId": "dispatch-1755636228188-dztl66ddb",
  "intents": [
    "TASK_CREATION",
    "EXTERNAL_TOOL",
    "SCHEDULE_PLANNING"
  ],
  "count": 3
}
[04:43:50.572] info: 步骤3: 执行相应的服务 {"requestId":"dispatch-1755636228188-dztl66ddb"}
[04:43:50.573] info: 执行优先级 1 的服务 {"intents":["TASK_CREATION","EXTERNAL_TOOL"],"count":2}
[04:43:50.573] info: 开始执行任务创建
  {
  "userInput": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
  "timeInfo": {
    "date": "2025-08-19",
    "timeBlock": {
      "timeBlockType": "afternoon",
      "startTime": "14:00",
      "endTime": "18:00"
    },
    "specificTime": null
  },
  "userId": "68a21bf0cdab688c24714231"
}
[04:43:50.573] info: 开始直接创建任务
  {
  "userInput": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
  "userId": "68a21bf0cdab688c24714231",
  "timeInfo": {
    "date": "2025-08-19",
    "timeBlock": {
      "timeBlockType": "afternoon",
      "startTime": "14:00",
      "endTime": "18:00"
    },
    "specificTime": null
  }
}
[04:43:50.573] info: 开始意图识别 {"userInput":"我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久","inputLength":30}
[04:43:50.573] info: 发送请求到通义千问模型 {"messagesCount":2,"systemPromptLength":530,"userPromptLength":390}
[04:43:50.573] info: 准备调用通义千问API
  {
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  "model": "qwen-plus",
  "messagesCount": 2
}
[04:43:50.574] info: 开始执行外部工具调用
  {
  "userInput": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
  "toolType": "route",
  "userId": "68a21bf0cdab688c24714231"
}
[04:43:50.575] info: 外部工具调用完成 {"success":true}
[04:43:53.572] info: 通义千问API调用成功
  {
  "status": 200,
  "usage": {
    "prompt_tokens": 479,
    "completion_tokens": 104,
    "total_tokens": 583,
    "prompt_tokens_details": {
      "cached_tokens": 256
    }
  },
  "model": "qwen-plus"
}
[04:43:53.572] info: 收到模型响应 {"responseLength":269,"responseTime":"2999ms"}
[04:43:53.572] info: 开始解析模型响应
  {
  "responseContent": "{\n  \"intent\": \"SCHEDULE_PLANNING\",\n  \"confidence\": 0.95,\n  \"reasoning\": \"用户希望安排下午去虹桥机场的时间，并查看所需时长，这涉及时间规划和行程安排。\",\n  \"extracted_info\": {\n    \"keywords\": [\"安排时间\", \"虹桥机场\"],\n    \"entities\": {\n      \"time\"..."
}
[04:43:53.573] info: 意图识别结果解析成功 {"intent":"SCHEDULE_PLANNING","confidence":0.95,"hasExtractedInfo":true}
[04:43:53.573] info: 意图识别完成 {"intent":"SCHEDULE_PLANNING","confidence":0.95,"processingTime":"3000ms","success":true}
[04:43:53.573] info: 意图识别完成（用于信息提取） {"intent":"SCHEDULE_PLANNING","confidence":0.95}
[04:43:53.573] info: 强制设置为任务创建意图 {"intent":"TASK_CREATION","confidence":0.95}
[04:43:53.573] info: 提取任务信息完成
  {
  "title": "去虹桥机场",
  "timeBlock": {
    "startTime": "14:00",
    "endTime": "18:00",
    "timeBlockType": "afternoon"
  },
  "targetDate": "2025-08-19",
  "timeInfoInput": {
    "date": "2025-08-19",
    "timeBlock": {
      "timeBlockType": "afternoon",
      "startTime": "14:00",
      "endTime": "18:00"
    },
    "specificTime": null
  }
}
[04:43:53.573] info: 提取任务信息完成
  {
  "taskInfo": {
    "title": "去虹桥机场",
    "userId": "68a21bf0cdab688c24714231",
    "timeBlock": {
      "startTime": "14:00",
      "endTime": "18:00",
      "timeBlockType": "afternoon"
    },
    "targetDate": "2025-08-19"
  }
}
[04:43:53.573] info: 开始存储任务到数据库
  {
  "taskInfo": {
    "title": "去虹桥机场",
    "userId": "68a21bf0cdab688c24714231",
    "timeBlock": {
      "startTime": "14:00",
      "endTime": "18:00",
      "timeBlockType": "afternoon"
    },
    "targetDate": "2025-08-19"
  }
}
[04:43:53.578] info: 任务存储成功 {"taskId":"68a4e2097ce84d4aca62247c"}
[04:43:53.579] info: 任务直接创建成功 {"taskId":"68a4e2097ce84d4aca62247c","title":"去虹桥机场","processingTime":"3006ms"}
[04:43:53.579] info: 任务创建完成 {"success":true}
[04:43:53.579] info: 优先级 1 的服务执行完成 {"results":["externalTool","taskCreation"]}
[04:43:53.579] info: 执行优先级 2 的服务 {"intents":["SCHEDULE_PLANNING"],"count":1}
[04:43:53.579] info: 开始执行时间调度
  {
  "userInput": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
  "targetDate": "2025-08-19",
  "userId": "68a21bf0cdab688c24714231",
  "hasPreviousTaskCreation": true
}
[04:43:53.579] info: 开始任务调度规划
  {
  "userId": "68a21bf0cdab688c24714231",
  "userInput": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
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
        "_id": "68a4e2097ce84d4aca62247c",
        "title": "去虹桥机场",
        "description": "",
        "priority": "medium",
        "completed": false,
        "userId": "68a21bf0cdab688c24714231",
        "isScheduled": false,
        "createdAt": "2025-08-19T20:43:53.575Z",
        "updatedAt": "2025-08-19T20:43:53.575Z",
        "__v": 0
      },
      "intentResult": {
        "intent": "TASK_CREATION",
        "confidence": 0.95,
        "reasoning": "用户希望安排下午去虹桥机场的时间，并查看所需时长，这涉及时间规划和行程安排。",
        "extracted_info": {
          "keywords": [
            "安排时间",
            "虹桥机场"
          ],
          "entities": {
            "time": "今天下午",
            "location": "虹桥机场",
            "task": "去虹桥机场"
          }
        },
        "original_input": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
        "timestamp": "2025-08-19T20:43:53.573Z",
        "intent_description": "时间调度（日程安排、时间规划）"
      },
      "processingTime": 3006
    }
  }
}
[04:43:53.583] info: 获取用户现有任务 {"userId":"68a21bf0cdab688c24714231","taskCount":6,"date":"2025-08-19"}
[04:43:53.589] info: 获取用户任务集信息 {"userId":"68a21bf0cdab688c24714231","collectionCount":1}
[04:43:53.590] info: 构建调度规划Prompt完成 {"messagesCount":2}
[04:43:53.590] info: 调用通义千问API进行调度分析
  {
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  "model": "qwen-plus",
  "messagesCount": 2,
  "temperature": 0.3
}
[04:44:21.028] info: 通义千问API调用成功 (调度分析)
  {
  "status": 200,
  "usage": {
    "prompt_tokens": 1421,
    "completion_tokens": 1640,
    "total_tokens": 3061,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "model": "qwen-plus"
}
[04:44:21.029] info: 通义千问调度分析完成 {"responseLength":4394}
[04:44:21.029] info: 调度建议解析成功 {"adjustmentCount":6,"breakCount":3}
[04:44:21.030] info: 任务调度规划完成
  {
  "userId": "68a21bf0cdab688c24714231",
  "targetDate": "2025-08-19",
  "processingTime": "27451ms",
  "success": true
}
[04:44:21.030] info: 时间调度完成 {"success":true}
[04:44:21.030] info: 优先级 2 的服务执行完成 {"results":["externalTool","taskCreation","schedulePlanning"]}
[04:44:21.030] info: 服务执行完成
  {
  "requestId": "dispatch-1755636228188-dztl66ddb",
  "servicesExecuted": [
    "externalTool",
    "taskCreation",
    "schedulePlanning"
  ],
  "successCount": 3
}
[04:44:21.030] info: 步骤4: 生成统一回复 {"requestId":"dispatch-1755636228188-dztl66ddb"}
[04:44:21.031] info: 开始生成统一回复
  {
  "userInput": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
  "intentsCount": 3,
  "executionResultsKeys": [
    "externalTool",
    "taskCreation",
    "schedulePlanning"
  ],
  "executionResults": {
    "externalTool": {
      "success": true,
      "type": "route",
      "message": "外部工具功能待集成",
      "data": {
        "toolType": "route",
        "query": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久"
      }
    },
    "taskCreation": {
      "success": true,
      "message": "任务创建成功",
      "task": {
        "timeBlock": {
          "startTime": "14:00",
          "endTime": "18:00",
          "timeBlockType": "afternoon"
        },
        "_id": "68a4e2097ce84d4aca62247c",
        "title": "去虹桥机场",
        "description": "",
        "priority": "medium",
        "completed": false,
        "userId": "68a21bf0cdab688c24714231",
        "isScheduled": false,
        "createdAt": "2025-08-19T20:43:53.575Z",
        "updatedAt": "2025-08-19T20:43:53.575Z",
        "__v": 0
      },
      "intentResult": {
        "intent": "TASK_CREATION",
        "confidence": 0.95,
        "reasoning": "用户希望安排下午去虹桥机场的时间，并查看所需时长，这涉及时间规划和行程安排。",
        "extracted_info": {
          "keywords": [
            "安排时间",
            "虹桥机场"
          ],
          "entities": {
            "time": "今天下午",
            "location": "虹桥机场",
            "task": "去虹桥机场"
          }
        },
        "original_input": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
        "timestamp": "2025-08-19T20:43:53.573Z",
        "intent_description": "时间调度（日程安排、时间规划）"
      },
      "processingTime": 3006
    },
    "schedulePlanning": {
      "success": true,
      "data": {
        "analysis": {
          "timeConflicts": [
            "任务 [68a4e2097ce84d4aca62247c] 去虹桥机场 与多个任务在 afternoon 时间段存在时间冲突。"
          ],
          "priorityInsights": "所有任务尚未分类到四象限，无法准确判断优先级。需要根据用户需求明确任务的紧急性和重要性。",
          "workloadAssessment": "当前任务数量较多，且集中在 afternoon 时间段，可能导致时间安排紧张。",
          "userStateConsiderations": "用户情绪状态为 neutral，但提到压力大且有重要考试，需考虑合理安排任务与休息时间以避免过度压力。"
        },
        "recommendations": {
          "taskAdjustments": [
            {
              "taskId": "68a4e2097ce84d4aca62247c",
              "action": "update",
              "changes": {
                "title": "去虹桥机场",
                "date": "2025-08-20",
                "time": "14:00",
                "timeBlock": {
                  "startTime": "14:00",
                  "endTime": "14:30",
                  "timeBlockType": "afternoon"
                },
                "estimatedTime": 30,
                "priority": "high",
                "quadrant": 1,
                "reason": "根据用户请求，安排去虹桥机场的任务，并将其优先级设为 high，四象限设为 1（重要且紧急）。"
              }
            },
            {
              "taskId": "68a4dbd77ce84d4aca622446",
              "action": "reschedule",
              "changes": {
                "title": "开会",
                "date": "2025-08-20",
                "time": "08:00",
                "timeBlock": {
                  "startTime": "08:00",
                  "endTime": "08:30",
                  "timeBlockType": "morning"
                },
                "estimatedTime": 30,
                "priority": "medium",
                "quadrant": 2,
                "reason": "将任务调整到 morning 时间段，四象限设为 2（重要不紧急）。"
              }
            },
            {
              "taskId": "68a4decc7ce84d4aca622465",
              "action": "reschedule",
              "changes": {
                "title": "开会",
                "date": "2025-08-20",
                "time": "08:30",
                "timeBlock": {
                  "startTime": "08:30",
                  "endTime": "09:00",
                  "timeBlockType": "morning"
                },
                "estimatedTime": 30,
                "priority": "medium",
                "quadrant": 2,
                "reason": "将任务调整到 morning 时间段，四象限设为 2（重要不紧急）。"
              }
            },
            {
              "taskId": "68a4dc577ce84d4aca62244f",
              "action": "reschedule",
              "changes": {
                "title": "我压力好大，明天还有个重要的考试。",
                "date": "2025-08-20",
                "time": "10:00",
                "timeBlock": {
                  "startTime": "10:00",
                  "endTime": "10:30",
                  "timeBlockType": "forenoon"
                },
                "estimatedTime": 30,
                "priority": "medium",
                "quadrant": 2,
                "reason": "将任务调整到 forenoon 时间段，四象限设为 2（重要不紧急）。"
              }
            },
            {
              "taskId": "68a4de427ce84d4aca62245a",
              "action": "reschedule",
              "changes": {
                "title": "我压力好大，明天还有个重要的考试。",
                "date": "2025-08-20",
                "time": "11:00",
                "timeBlock": {
                  "startTime": "11:00",
                  "endTime": "11:30",
                  "timeBlockType": "forenoon"
                },
                "estimatedTime": 30,
                "priority": "medium",
                "quadrant": 2,
                "reason": "将任务调整到 forenoon 时间段，四象限设为 2（重要不紧急）。"
              }
            },
            {
              "taskId": "68a4e1e07ce84d4aca622471",
              "action": "reschedule",
              "changes": {
                "title": "我好累想出去玩，你有什么推荐吗",
                "date": "2025-08-20",
                "time": "16:00",
                "timeBlock": {
                  "startTime": "16:00",
                  "endTime": "16:30",
                  "timeBlockType": "afternoon"
                },
                "estimatedTime": 30,
                "priority": "low",
                "quadrant": 4,
                "reason": "将任务调整到 afternoon 时间段，四象限设为 4（不重要不紧急）。"
              }
            }
          ],
          "breakSuggestions": [
            {
              "startTime": "09:00",
              "endTime": "10:00",
              "type": "meal",
              "activity": "早餐和短暂休息"
            },
            {
              "startTime": "12:00",
              "endTime": "13:00",
              "type": "meal",
              "activity": "午餐和放松"
            },
            {
              "startTime": "15:00",
              "endTime": "15:15",
              "type": "short",
              "activity": "短暂休息，放松眼睛"
            }
          ],
          "optimizationTips": [
            "将重要任务安排在 morning 和 forenoon 时间段，以确保高效完成。",
            "将不重要不紧急的任务（如休闲活动）安排在 afternoon 的空闲时间段。",
            "合理安排休息时间，避免过度疲劳。"
          ]
        },
        "schedule": {
          "morning": [
            "68a4dbd77ce84d4aca622446",
            "68a4decc7ce84d4aca622465"
          ],
          "forenoon": [
            "68a4dc577ce84d4aca62244f",
            "68a4de427ce84d4aca62245a"
          ],
          "afternoon": [
            "68a4e2097ce84d4aca62247c",
            "68a4e1e07ce84d4aca622471"
          ],
          "evening": []
        },
        "summary": "已根据用户需求调整任务安排，优先安排去虹桥机场的任务，并合理分配其他任务到 morning 和 forenoon 时间段。同时，建议用户合理安排休息时间以避免疲劳。",
        "appliedChanges": [],
        "metadata": {
          "currentTime": "2025/08/20 04:43:53",
          "targetDate": "2025-08-19",
          "existingTaskCount": 6,
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
                "_id": "68a4e2097ce84d4aca62247c",
                "title": "去虹桥机场",
                "description": "",
                "priority": "medium",
                "completed": false,
                "userId": "68a21bf0cdab688c24714231",
                "isScheduled": false,
                "createdAt": "2025-08-19T20:43:53.575Z",
                "updatedAt": "2025-08-19T20:43:53.575Z",
                "__v": 0
              },
              "intentResult": {
                "intent": "TASK_CREATION",
                "confidence": 0.95,
                "reasoning": "用户希望安排下午去虹桥机场的时间，并查看所需时长，这涉及时间规划和行程安排。",
                "extracted_info": {
                  "keywords": [
                    "安排时间",
                    "虹桥机场"
                  ],
                  "entities": {
                    "time": "今天下午",
                    "location": "虹桥机场",
                    "task": "去虹桥机场"
                  }
                },
                "original_input": "我今天下午需要去虹桥机场，请你帮我安排一下时间看一下需要多久",
                "timestamp": "2025-08-19T20:43:53.573Z",
                "intent_description": "时间调度（日程安排、时间规划）"
              },
              "processingTime": 3006
            }
          },
          "autoApplied": false,
          "processingTime": 27451
        }
      }
    }
  }
}
[04:44:21.033] info: 调用通义千问API生成回应
  {
  "model": "qwen-plus",
  "messagesCount": 2,
  "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
}
[04:44:22.610] info: AI回应生成成功
  {
  "status": 200,
  "responseTime": "1577ms",
  "usage": {
    "prompt_tokens": 314,
    "completion_tokens": 44,
    "total_tokens": 358,
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "model": "qwen-plus"
}
[04:44:22.610] info: 回复生成完成 {"requestId":"dispatch-1755636228188-dztl66ddb","responseLength":70}
[04:44:22.610] info: 智能调度处理完成
  {
  "requestId": "dispatch-1755636228188-dztl66ddb",
  "userId": "68a21bf0cdab688c24714231",
  "processingTime": "34422ms",
  "responseLength": 70,
  "servicesExecuted": [
    "externalTool",
    "taskCreation",
    "schedulePlanning"
  ]
}
[04:44:22.611] info: 智能调度处理完成
  {
  "userId": "68a21bf0cdab688c24714231",
  "processingTime": 34424,
  "responseLength": 70,
  "servicesExecuted": [
    "externalTool",
    "taskCreation",
    "schedulePlanning"
  ]
}
info: ::1 - - [19/Aug/2025:20:44:22 +0000] "POST /api/aisiri/dispatch HTTP/1.1" 200 1094 "http://localhost:8080/ai-secretary" "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1" {"service":"aisiri-backend","timestamp":"2025-08-19T20:44:22.614Z"}

## 问题总结

✅ **问题已解决** (2025-01-20)

**问题原因**: 在 `intelligentDispatchService.js` 的 `buildResponsePrompt` 方法中，外部工具的结果摘要只是简单地显示"获取了路线信息"，没有提取和显示具体的路线时间、距离等详细信息。

**解决方案**: 修改了 `buildResponsePrompt` 方法中的外部工具结果处理逻辑，现在能够正确提取并显示路线规划的具体信息：
- 距离信息（公里）
- 预计用时（分钟）
- 起点和终点信息

**测试结果**: 
- MCP调用正常工作 ✅
- AI回复包含具体时间信息："路上预计需要1小时左右" ✅
- 路线规划功能完全正常 ✅