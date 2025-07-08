/**
 * 任務恢復服務
 * 用於在服務啟動時檢查並恢復未完成的任務
 */
import { PrismaClient } from '@prisma/client';
import { processAnswerGenerationTask } from './answer-generation';
import { processQuestionGenerationTask } from './question-generation';

const prisma = new PrismaClient();

// 服務初始化標誌，確保只執行一次
let initialized = false;

/**
 * 恢復未完成的任務
 * 在應用啟動時自動執行一次
 */
export async function recoverPendingTasks() {
  // 如果已經初始化過，直接返回
  if (process.env.INITED) {
    return;
  }

  process.env.INITED = true;

  try {
    console.log('開始檢查未完成任務...');

    // 尋找所有處理中的任務
    const pendingTasks = await prisma.task.findMany({
      where: {
        status: 0 // 處理中的任務
      }
    });

    if (pendingTasks.length === 0) {
      console.log('沒有需要恢復的任務');
      initialized = true;
      return;
    }

    console.log(`找到 ${pendingTasks.length} 個未完成任務，開始恢復...`);

    // 遍歷處理每個任務
    for (const task of pendingTasks) {
      try {
        // 根據任務類型調用對應的處理函數
        switch (task.taskType) {
          case 'question-generation':
            // 非同步處理，不等待完成
            processQuestionGenerationTask(task).catch(error => {
              console.error(`恢復問題生成任務 ${task.id} 失敗:`, error);
            });
            break;
          case 'answer-generation':
            // 非同步處理，不等待完成
            processAnswerGenerationTask(task).catch(error => {
              console.error(`恢復答案生成任務 ${task.id} 失敗:`, error);
            });
            break;
          default:
            console.warn(`Other Task: ${task.taskType}`);
            await prisma.task.update({
              where: { id: task.id },
              data: {
                status: 2,
                detail: `${task.taskType} Error`,
                note: `${task.taskType} Error`,
                endTime: new Date()
              }
            });
        }
      } catch (error) {
        console.error(`恢復任務 ${task.id} 失敗:`, error);
      }
    }

    console.log('任務恢復服務已啟動，未完成任務將在後台繼續處理');
    initialized = true;
  } catch (error) {
    console.error('任務恢復服務出錯:', error);
    // 即使出錯也標記為已初始化，避免反覆嘗試
    initialized = true;
  }
}

// 在模組載入時自動執行恢復
recoverPendingTasks().catch(error => {
  console.error('執行任務恢復失敗:', error);
});
