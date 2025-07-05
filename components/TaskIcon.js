'use client';

import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Tooltip, Box, CircularProgress } from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import useFileProcessingStatus from '@/hooks/useFileProcessingStatus';
import axios from 'axios';

// 任務圖示組件
export default function TaskIcon({ projectId, theme }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [polling, setPolling] = useState(false);
  const { setTaskFileProcessing, setTask } = useFileProcessingStatus();

  // 獲取項目的未完成任務列表
  const fetchPendingTasks = async () => {
    if (!projectId) return;

    try {
      const response = await axios.get(`/api/projects/${projectId}/tasks/list?status=0`);
      if (response.data?.code === 0) {
        const tasks = response.data.data || [];
        setTasks(tasks);
        // 檢查是否有文件處理任務正在進行
        const hasActiveFileTask = tasks.some(
          task => task.projectId === projectId && task.taskType === 'file-processing'
        );
        setTaskFileProcessing(hasActiveFileTask);
        //存在文件處理任務，將任務資訊傳遞給共享狀態
        if (hasActiveFileTask) {
          const activeTask = tasks.find(task => task.projectId === projectId && task.taskType === 'file-processing');
          // 解析任務詳情資訊
          const detailInfo = JSON.parse(activeTask.detail);
          setTask(detailInfo);
        }
      }
    } catch (error) {
      console.error('獲取任務列表失敗:', error);
    }
  };

  // 初始化時獲取任務列表
  useEffect(() => {
    if (projectId) {
      fetchPendingTasks();

      // 啟動輪詢
      const intervalId = setInterval(() => {
        fetchPendingTasks();
      }, 10000); // 每10秒輪詢一次

      setPolling(true);

      return () => {
        clearInterval(intervalId);
        setPolling(false);
      };
    }
  }, [projectId]);

  // 打開任務列表頁面
  const handleOpenTaskList = () => {
    router.push(`/projects/${projectId}/tasks`);
  };

  // 圖示渲染邏輯
  const renderTaskIcon = () => {
    const pendingTasks = tasks.filter(task => task.status === 0);

    if (pendingTasks.length > 0) {
      // 當有任務處理中時，顯示 loading 狀態同時保留徽標
      return (
        <Badge badgeContent={pendingTasks.length} color="error">
          <CircularProgress size={20} color="inherit" />
        </Badge>
      );
    }

    // 沒有處理中的任務時，顯示完成圖示
    return <TaskAltIcon fontSize="small" />;
  };

  // 懸停提示文本
  const getTooltipText = () => {
    const pendingTasks = tasks.filter(task => task.status === 0);

    if (pendingTasks.length > 0) {
      return t('tasks.pending', { count: pendingTasks.length });
    }

    return t('tasks.completed');
  };

  if (!projectId) return null;

  return (
    <Tooltip title={getTooltipText()}>
      <IconButton
        onClick={handleOpenTaskList}
        size="small"
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
          color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
          p: 1,
          borderRadius: 1.5,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'
          },
          ml: 2
        }}
      >
        {renderTaskIcon()}
      </IconButton>
    </Tooltip>
  );
}
