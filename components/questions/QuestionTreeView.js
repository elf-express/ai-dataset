'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Collapse,
  Chip,
  Tooltip,
  Divider,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { useGenerateDataset } from '@/hooks/useGenerateDataset';
import axios from 'axios';

/**
 * 問題樹視圖組件
 * @param {Object} props
 * @param {Array} props.tags - 標籤樹
 * @param {Array} props.selectedQuestions - 已選擇的問題ID列表
 * @param {Function} props.onSelectQuestion - 選擇問題的回調函數
 * @param {Function} props.onDeleteQuestion - 刪除問題的回調函數
 */
export default function QuestionTreeView({
  tags = [],
  selectedQuestions = [],
  onSelectQuestion,
  onDeleteQuestion,
  onEditQuestion,
  projectId,
  searchTerm
}) {
  const { t } = useTranslation();
  const [expandedTags, setExpandedTags] = useState({});
  const [questionsByTag, setQuestionsByTag] = useState({});
  const [processingQuestions, setProcessingQuestions] = useState({});
  const { generateSingleDataset } = useGenerateDataset();
  const [questions, setQuestions] = useState([]);
  const [loadedTags, setLoadedTags] = useState({});
  // 初始化時，將所有標籤設置為收起狀態（而不是展開狀態）
  useEffect(() => {
    async function fetchTagsInfo() {
      try {
        // 獲取標籤資訊，僅用於標籤統計
        const response = await axios.get(`/api/projects/${projectId}/questions/tree?tagsOnly=true&input=${searchTerm}`);
        setQuestions(response.data); // 設置數據僅用於標籤統計

        // 當搜索條件變化時，重新載入已展開標籤的問題數據
        const expandedTagLabels = Object.entries(expandedTags)
          .filter(([_, isExpanded]) => isExpanded)
          .map(([label]) => label);

        // 重新載入已展開標籤的數據
        for (const label of expandedTagLabels) {
          fetchTagQuestions(label);
        }
      } catch (error) {
        console.error('獲取標籤資訊失敗:', error);
      }
    }

    if (projectId) {
      fetchTagsInfo();
    }

    const initialExpandedState = {};
    const processTag = tag => {
      // 將默認狀態改為 false（收起）而不是 true（展開）
      initialExpandedState[tag.label] = false;
      if (tag.child && tag.child.length > 0) {
        tag.child.forEach(processTag);
      }
    };

    tags.forEach(processTag);
    // 未分類問題也默認收起
    initialExpandedState['uncategorized'] = false;
    setExpandedTags(initialExpandedState);
  }, [tags]);

  // 根據標籤對問題進行分類
  useEffect(() => {
    const taggedQuestions = {};

    // 初始化標籤映射
    const initTagMap = tag => {
      taggedQuestions[tag.label] = [];
      if (tag.child && tag.child.length > 0) {
        tag.child.forEach(initTagMap);
      }
    };

    tags.forEach(initTagMap);

    // 將問題分配到對應的標籤下
    questions.forEach(question => {
      // 如果問題沒有標籤，添加到"未分類"
      if (!question.label) {
        if (!taggedQuestions['uncategorized']) {
          taggedQuestions['uncategorized'] = [];
        }
        taggedQuestions['uncategorized'].push(question);
        return;
      }

      // 將問題添加到匹配的標籤下
      const questionLabel = question.label;

      // 尋找最精確匹配的標籤
      // 使用一個數組來儲存所有匹配的標籤路徑，以便找到最精確的匹配
      const findAllMatchingTags = (tag, path = []) => {
        const currentPath = [...path, tag.label];

        // 儲存所有匹配結果
        const matches = [];

        // 精確匹配當前標籤
        if (tag.label === questionLabel) {
          matches.push({ label: tag.label, depth: currentPath.length });
        }

        // 檢查子標籤
        if (tag.child && tag.child.length > 0) {
          for (const childTag of tag.child) {
            const childMatches = findAllMatchingTags(childTag, currentPath);
            matches.push(...childMatches);
          }
        }

        return matches;
      };

      // 在所有根標籤中尋找所有匹配
      let allMatches = [];
      for (const rootTag of tags) {
        const matches = findAllMatchingTags(rootTag);
        allMatches.push(...matches);
      }

      // 找到深度最大的匹配（最精確的匹配）
      let matchedTagLabel = null;
      if (allMatches.length > 0) {
        // 按深度排序，深度最大的是最精確的匹配
        allMatches.sort((a, b) => b.depth - a.depth);
        matchedTagLabel = allMatches[0].label;
      }

      if (matchedTagLabel) {
        // 如果找到匹配的標籤，將問題添加到該標籤下
        if (!taggedQuestions[matchedTagLabel]) {
          taggedQuestions[matchedTagLabel] = [];
        }
        taggedQuestions[matchedTagLabel].push(question);
      } else {
        // 如果找不到匹配的標籤，添加到"未分類"
        if (!taggedQuestions['uncategorized']) {
          taggedQuestions['uncategorized'] = [];
        }
        taggedQuestions['uncategorized'].push(question);
      }
    });

    setQuestionsByTag(taggedQuestions);
  }, [questions, tags]);

  // 處理展開/摺疊標籤 - 使用 useCallback 最佳化
  const handleToggleExpand = useCallback(
    tagLabel => {
      // 檢查是否需要載入此標籤的問題數據
      const shouldExpand = !expandedTags[tagLabel];

      if (shouldExpand && !loadedTags[tagLabel]) {
        // 如果要展開且尚未載入數據，則載入數據
        fetchTagQuestions(tagLabel);
      }

      setExpandedTags(prev => ({
        ...prev,
        [tagLabel]: shouldExpand
      }));
    },
    [expandedTags, loadedTags, projectId]
  );

  // 獲取特定標籤的問題數據
  const fetchTagQuestions = useCallback(
    async tagLabel => {
      try {
        const response = await axios.get(
          `/api/projects/${projectId}/questions/tree?tag=${encodeURIComponent(tagLabel)}${searchTerm ? `&input=${searchTerm}` : ''}`
        );

        // 更新問題數據，合併新獲取的數據
        setQuestions(prev => {
          // 創建一個新數組，包含現有數據
          const updatedQuestions = [...prev];

          // 添加新獲取的問題數據
          response.data.forEach(newQuestion => {
            // 檢查是否已存在相同 ID 的問題
            const existingIndex = updatedQuestions.findIndex(q => q.id === newQuestion.id);
            if (existingIndex === -1) {
              // 如果不存在，添加到數組
              updatedQuestions.push(newQuestion);
            } else {
              // 如果已存在，更新數據
              updatedQuestions[existingIndex] = newQuestion;
            }
          });

          return updatedQuestions;
        });

        // 標記該標籤已載入數據
        setLoadedTags(prev => ({
          ...prev,
          [tagLabel]: true
        }));
      } catch (error) {
        console.error(`獲取標籤 "${tagLabel}" 的問題失敗:`, error);
      }
    },
    [projectId, searchTerm, expandedTags]
  );

  // 檢查問題是否被選中 - 使用 useCallback 最佳化
  const isQuestionSelected = useCallback(
    questionKey => {
      return selectedQuestions.includes(questionKey);
    },
    [selectedQuestions]
  );

  // 處理生成數據集 - 使用 useCallback 最佳化
  const handleGenerateDataset = async (questionId, questionInfo) => {
    // 設置處理狀態
    setProcessingQuestions(prev => ({
      ...prev,
      [questionId]: true
    }));
    await generateSingleDataset({ projectId, questionId, questionInfo });
    // 重設處理狀態
    setProcessingQuestions(prev => ({
      ...prev,
      [questionId]: false
    }));
  };

  // 渲染單個問題項 - 使用 useCallback 最佳化
  const renderQuestionItem = useCallback(
    (question, index, total) => {
      const questionKey = question.id;
      return (
        <QuestionItem
          key={questionKey}
          question={question}
          index={index}
          total={total}
          isSelected={isQuestionSelected(questionKey)}
          onSelect={onSelectQuestion}
          onDelete={onDeleteQuestion}
          onGenerate={handleGenerateDataset}
          onEdit={onEditQuestion}
          isProcessing={processingQuestions[questionKey]}
          t={t}
        />
      );
    },
    [isQuestionSelected, onSelectQuestion, onDeleteQuestion, handleGenerateDataset, processingQuestions, t]
  );

  // 計算標籤及其子標籤下的所有問題數量 - 使用 useMemo 快取計算結果
  const tagQuestionCounts = useMemo(() => {
    const counts = {};

    const countQuestions = tag => {
      const directQuestions = questionsByTag[tag.label] || [];
      let total = directQuestions.length;

      if (tag.child && tag.child.length > 0) {
        for (const childTag of tag.child) {
          total += countQuestions(childTag);
        }
      }

      counts[tag.label] = total;
      return total;
    };

    tags.forEach(countQuestions);
    return counts;
  }, [questionsByTag, tags]);

  // 遞迴渲染標籤樹 - 使用 useCallback 最佳化
  const renderTagTree = useCallback(
    (tag, level = 0) => {
      const questions = questionsByTag[tag.label] || [];
      const hasQuestions = questions.length > 0;
      const hasChildren = tag.child && tag.child.length > 0;
      const isExpanded = expandedTags[tag.label];
      const totalQuestions = tagQuestionCounts[tag.label] || 0;

      return (
        <Box key={tag.label}>
          <TagItem
            tag={tag}
            level={level}
            isExpanded={isExpanded}
            totalQuestions={totalQuestions}
            onToggle={handleToggleExpand}
            t={t}
          />

          {/* 只有當標籤展開時才渲染子內容，減少不必要的渲染 */}
          {isExpanded && (
            <Collapse in={true}>
              {hasChildren && (
                <List disablePadding>{tag.child.map(childTag => renderTagTree(childTag, level + 1))}</List>
              )}

              {hasQuestions && (
                <List disablePadding sx={{ mt: hasChildren ? 1 : 0 }}>
                  {questions.map((question, index) => renderQuestionItem(question, index, questions.length))}
                </List>
              )}
            </Collapse>
          )}
        </Box>
      );
    },
    [questionsByTag, expandedTags, tagQuestionCounts, handleToggleExpand, renderQuestionItem, t]
  );

  // 渲染未分類問題
  const renderUncategorizedQuestions = () => {
    const uncategorizedQuestions = questionsByTag['uncategorized'] || [];
    if (uncategorizedQuestions.length === 0) return null;

    return (
      <Box>
        <ListItem
          button
          onClick={() => handleToggleExpand('uncategorized')}
          sx={{
            py: 1,
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.main'
            },
            borderRadius: '4px',
            mb: 0.5,
            pr: 1
          }}
        >
          <FolderIcon fontSize="small" sx={{ mr: 1, color: 'inherit' }} />
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {t('datasets.uncategorized')}
                </Typography>
                <Chip
                  label={t('datasets.questionCount', { count: uncategorizedQuestions.length })}
                  size="small"
                  sx={{ ml: 1, height: 20, fontSize: '0.7rem', color: '#fff', backgroundColor: '#333' }}
                />
              </Box>
            }
          />
          <IconButton size="small" edge="end" sx={{ color: 'inherit' }}>
            {expandedTags['uncategorized'] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </ListItem>

        <Collapse in={expandedTags['uncategorized']}>
          <List disablePadding>
            {uncategorizedQuestions.map((question, index) =>
              renderQuestionItem(question, index, uncategorizedQuestions.length)
            )}
          </List>
        </Collapse>
      </Box>
    );
  };

  // 如果沒有標籤和問題，顯示空狀態
  if (tags.length === 0 && Object.keys(questionsByTag).length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t('datasets.noTagsAndQuestions')}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'auto',
        p: 2,
        maxHeight: '75vh'
      }}
    >
      <List disablePadding>
        {renderUncategorizedQuestions()}
        {tags.map(tag => renderTagTree(tag))}
      </List>
    </Paper>
  );
}

// 使用 memo 最佳化問題項渲染
const QuestionItem = memo(
  ({ question, index, total, isSelected, onSelect, onDelete, onGenerate, onEdit, isProcessing, t }) => {
    const questionKey = question.id;
    return (
      <Box key={question.id}>
        <ListItem
          sx={{
            pl: 4,
            py: 1,
            borderRadius: '4px',
            ml: 2,
            mr: 1,
            mb: 0.5,
            bgcolor: isSelected ? 'action.selected' : 'transparent',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <Checkbox checked={isSelected} onChange={() => onSelect(questionKey)} size="small" />
          <QuestionMarkIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
          <ListItemText
            primary={
              <Typography variant="body2" sx={{ fontWeight: 400 }}>
                {question.question}
                {question.dataSites && question.dataSites.length > 0 && (
                  <Chip
                    label={t('datasets.answerCount', { count: question.dataSites.length })}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 1, fontSize: '0.75rem', maxWidth: 150 }}
                  />
                )}
              </Typography>
            }
            secondary={
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {t('datasets.source')}: {question.chunk?.name || question.chunkId || t('common.unknown')}
              </Typography>
            }
          />
          <Box>
            <Tooltip title={t('common.edit')}>
              <IconButton
                size="small"
                sx={{ mr: 1 }}
                onClick={() =>
                  onEdit({
                    question: question.question,
                    chunkId: question.chunkId,
                    label: question.label || 'other'
                  })
                }
                disabled={isProcessing}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('datasets.generateDataset')}>
              <IconButton
                size="small"
                sx={{ mr: 1 }}
                onClick={() => onGenerate(question.id, question.question)}
                disabled={isProcessing}
              >
                {isProcessing ? <CircularProgress size={16} /> : <AutoFixHighIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.delete')}>
              <IconButton size="small" onClick={() => onDelete(question.question, question.chunkId)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </ListItem>
        {index < total - 1 && <Divider component="li" variant="inset" sx={{ ml: 6 }} />}
      </Box>
    );
  }
);

// 使用 memo 最佳化標籤項渲染
const TagItem = memo(({ tag, level, isExpanded, totalQuestions, onToggle, t }) => {
  return (
    <ListItem
      button
      onClick={() => onToggle(tag.label)}
      sx={{
        pl: level * 2 + 1,
        py: 1,
        bgcolor: level === 0 ? 'primary.light' : 'background.paper',
        color: level === 0 ? 'primary.contrastText' : 'inherit',
        '&:hover': {
          bgcolor: level === 0 ? 'primary.main' : 'action.hover'
        },
        borderRadius: '4px',
        mb: 0.5,
        pr: 1
      }}
    >
      {/* 內部內容保持不變 */}
      <FolderIcon fontSize="small" sx={{ mr: 1, color: level === 0 ? 'inherit' : 'primary.main' }} />
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: level === 0 ? 600 : 400,
                fontSize: level === 0 ? '1rem' : '0.9rem'
              }}
            >
              {tag.label}
            </Typography>
            {totalQuestions > 0 && (
              <Chip
                label={t('datasets.questionCount', { count: totalQuestions })}
                size="small"
                color={level === 0 ? 'default' : 'primary'}
                variant={level === 0 ? 'default' : 'outlined'}
                sx={{ ml: 1, height: 20, fontSize: '0.7rem', color: '#fff', backgroundColor: '#333' }}
              />
            )}
          </Box>
        }
      />
      <IconButton size="small" edge="end" sx={{ color: level === 0 ? 'inherit' : 'action.active' }}>
        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </ListItem>
  );
});
