/**
 * 智能时间解析服务
 * 解析用户输入中的时间信息，支持多种时间表达方式
 */
class TimeParsingService {
  constructor() {
    this.timePatterns = {
      // 具体时间: 15:30, 3:00, 下午3点
      specificTime: [
        /(\d{1,2}):(\d{2})/g,                    // 15:30, 3:00
        /(\d{1,2})点(\d{1,2})?分?/g,             // 3点, 3点30分
        /(上午|下午|中午|晚上)(\d{1,2})点(\d{1,2})?分?/g, // 下午3点30分
      ],
      
      // 相对时间: 明天, 后天, 下周
      relativeDate: [
        /(今天|明天|后天)/g,
        /(下周|下个月)/g,
        /(\d+)天后/g,
      ],
      
      // 时间段: 上午, 下午, 晚上
      timePeriod: [
        /(早上|上午|中午|下午|晚上|夜里)/g,
      ]
    };
    
    this.timePeriodMap = {
      '早上': { start: '07:00', end: '09:00', type: 'morning' },
      '上午': { start: '09:00', end: '12:00', type: 'forenoon' },
      '中午': { start: '12:00', end: '13:00', type: 'afternoon' },
      '下午': { start: '13:00', end: '18:00', type: 'afternoon' },
      '晚上': { start: '18:00', end: '22:00', type: 'evening' },
      '夜里': { start: '22:00', end: '24:00', type: 'evening' }
    };
  }

  /**
   * 解析用户输入中的时间信息
   */
  parseTimeFromInput(userInput) {
    console.log(`🕐 开始解析时间: "${userInput}"`);
    
    const result = {
      hasTime: false,
      isSpecific: false,        // 是否有具体时间
      date: null,              // 解析出的日期
      time: null,              // 解析出的时间
      timeBlock: null,         // 时间块信息
      timePeriod: null,        // 时间段
      originalText: userInput,
      confidence: 0            // 解析置信度
    };

    // 1. 解析日期
    result.date = this.parseDate(userInput);
    
    // 2. 解析具体时间
    const specificTime = this.parseSpecificTime(userInput);
    if (specificTime) {
      result.hasTime = true;
      result.isSpecific = true;
      result.time = specificTime.time;
      result.timeBlock = {
        startTime: specificTime.time,
        endTime: this.addMinutes(specificTime.time, 60), // 默认1小时
        timeBlockType: this.getTimeBlockType(specificTime.time)
      };
      result.confidence = 0.9;
      console.log(`✅ 解析到具体时间: ${result.time}`);
    } else {
      // 3. 解析时间段
      const timePeriod = this.parseTimePeriod(userInput);
      if (timePeriod) {
        result.hasTime = true;
        result.isSpecific = false;
        result.timePeriod = timePeriod.period;
        result.timeBlock = {
          timeBlockType: timePeriod.type
        };
        result.confidence = 0.6;
        console.log(`📍 解析到时间段: ${result.timePeriod}`);
      }
    }

    console.log(`🎯 时间解析结果:`, result);
    return result;
  }

  /**
   * 解析日期
   */
  parseDate(input) {
    const today = new Date();
    
    if (input.includes('今天')) {
      return this.formatDate(today);
    } else if (input.includes('明天')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return this.formatDate(tomorrow);
    } else if (input.includes('后天')) {
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(today.getDate() + 2);
      return this.formatDate(dayAfterTomorrow);
    }
    
    // 匹配 X天后
    const daysMatch = input.match(/(\d+)天后/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);
      return this.formatDate(targetDate);
    }
    
    // 如果没有明确日期，默认今天
    return this.formatDate(today);
  }

  /**
   * 解析具体时间
   */
  parseSpecificTime(input) {
    // 匹配 HH:MM 格式
    const timeMatch = input.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return {
          time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        };
      }
    }

    // 匹配 X点 或 X点Y分 格式
    const hourMatch = input.match(/(上午|下午|中午|晚上)?(\d{1,2})点(\d{1,2})?分?/);
    if (hourMatch) {
      const period = hourMatch[1];
      let hours = parseInt(hourMatch[2]);
      const minutes = hourMatch[3] ? parseInt(hourMatch[3]) : 0;
      
      // 根据时间段调整小时
      if (period === '下午' || period === '晚上') {
        if (hours < 12) hours += 12;
      } else if (period === '上午' && hours === 12) {
        hours = 0;
      }
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return {
          time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        };
      }
    }

    return null;
  }

  /**
   * 解析时间段
   */
  parseTimePeriod(input) {
    for (const [period, info] of Object.entries(this.timePeriodMap)) {
      if (input.includes(period)) {
        return {
          period: period,
          type: info.type,
          startTime: info.start,
          endTime: info.end
        };
      }
    }
    return null;
  }

  /**
   * 根据现有任务智能安排时间
   */
  async findOptimalTime(existingTasks, timePeriod, preferredDate, duration = 60) {
    console.log(`🎯 智能安排时间: ${timePeriod} ${preferredDate}`);
    
    // 获取该日期已占用的时间段
    const occupiedSlots = existingTasks.occupiedTimeSlots.filter(slot => 
      slot.date === preferredDate
    );
    
    // 根据时间段确定候选时间
    let candidateTimes = [];
    
    if (timePeriod) {
      const periodInfo = this.timePeriodMap[timePeriod];
      if (periodInfo) {
        candidateTimes = this.generateTimeSlots(periodInfo.start, periodInfo.end, duration);
      }
    } else {
      // 如果没有指定时间段，使用全天候选时间
      candidateTimes = this.generateTimeSlots('07:00', '22:00', duration);
    }

    // 找到第一个可用的时间段
    for (const time of candidateTimes) {
      if (!this.isTimeSlotOccupied(occupiedSlots, time, duration)) {
        console.log(`✅ 找到可用时间: ${time}`);
        return {
          time: time,
          timeBlock: {
            startTime: time,
            endTime: this.addMinutes(time, duration),
            timeBlockType: this.getTimeBlockType(time)
          }
        };
      }
    }

    // 如果没有找到完全空闲的时间，返回默认时间
    const defaultTime = timePeriod ? this.timePeriodMap[timePeriod].start : '14:00';
    console.log(`⚠️ 未找到完全空闲时间，使用默认时间: ${defaultTime}`);
    
    return {
      time: defaultTime,
      timeBlock: {
        startTime: defaultTime,
        endTime: this.addMinutes(defaultTime, duration),
        timeBlockType: this.getTimeBlockType(defaultTime)
      },
      warning: '该时间段可能与其他任务有冲突'
    };
  }

  /**
   * 生成时间段内的候选时间
   */
  generateTimeSlots(startTime, endTime, duration) {
    const slots = [];
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    for (let minutes = start; minutes + duration <= end; minutes += 30) {
      slots.push(this.minutesToTime(minutes));
    }
    
    return slots;
  }

  /**
   * 检查时间段是否被占用
   */
  isTimeSlotOccupied(occupiedSlots, time, duration) {
    const startMinutes = this.timeToMinutes(time);
    const endMinutes = startMinutes + duration;
    
    return occupiedSlots.some(slot => {
      const slotStart = this.timeToMinutes(slot.time);
      const slotEnd = slotStart + (slot.duration || 60);
      
      // 检查是否有重叠
      return (startMinutes < slotEnd && endMinutes > slotStart);
    });
  }

  /**
   * 时间转分钟数
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 分钟数转时间
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * 给时间添加分钟数
   */
  addMinutes(time, minutes) {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    return this.minutesToTime(totalMinutes);
  }

  /**
   * 根据时间确定时间块类型
   */
  getTimeBlockType(time) {
    const hour = parseInt(time.split(':')[0]);
    
    if (hour >= 7 && hour < 9) return 'morning';
    if (hour >= 9 && hour < 12) return 'forenoon';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    
    return 'unscheduled';
  }

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * 提取任务的估算时长
   */
  extractDuration(input) {
    // 匹配时长表达：1小时，30分钟，1.5小时等
    const durationMatch = input.match(/(\d+(?:\.\d+)?)(?:个)?(小时|分钟|h|min)/);
    if (durationMatch) {
      const value = parseFloat(durationMatch[1]);
      const unit = durationMatch[2];
      
      if (unit === '小时' || unit === 'h') {
        return Math.round(value * 60);
      } else if (unit === '分钟' || unit === 'min') {
        return Math.round(value);
      }
    }
    
    // 默认返回60分钟
    return 60;
  }
}

module.exports = TimeParsingService;

