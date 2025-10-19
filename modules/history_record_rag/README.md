# 历史案例匹配模块

这个模块实现了智能的历史案例匹配功能，可以根据当前事件信息查找相似的历史案例，为问题解决提供参考。

## 功能特性

- **多层级匹配算法**: 模块过滤 → 向量相似度 → 综合重排 → GPT验证
- **智能相似度计算**: 结合文本相似度、实体重合、模块匹配的综合评分
- **GPT验证**: 使用Azure OpenAI GPT-4.1-mini进行最终验证
- **高性能向量搜索**: 基于ChromaDB的向量存储和检索

## 工作流程

```
新事件输入
    ↓
[第1层] Module过滤 - 根据affected_module进行初步筛选
    ↓
[第2层] 向量相似度计算 - problem_summary vs problem_statement的余弦相似度
    ↓
[第3层] 综合重排 - 相似度70% + 实体重合20% + 模块匹配10%
    ↓
[第4层] GPT验证 - 对Top 3候选案例进行GPT验证
    ↓
返回真正相似的案例
```

## 安装依赖

```bash
cd modules/history_record_rag
pip install -r requirements.txt
```

## 环境配置

设置以下环境变量：

```bash
export AZURE_OPENAI_API_KEY="your-api-key"
export AZURE_OPENAI_ENDPOINT="your-endpoint"
export AZURE_OPENAI_DEPLOYMENT="gpt-4.1-mini"
```

## 使用方法

### 1. 基本使用

```python
from src.history_matcher import HistoryMatcherService
from src.models import HistoryMatchRequest

# 初始化服务
service = HistoryMatcherService()

# 创建匹配请求
request = HistoryMatchRequest(
    incident_id="ALR-861600",
    source_type="Email",
    problem_summary="Customer experiencing duplicate container records",
    affected_module="Container",
    entities=[{"type": "container_number", "value": "CMAU0000020"}],
    urgency="High",
    raw_text="原始事件文本..."
)

# 执行匹配
response = service.find_similar_cases(request)

# 查看结果
for matched_case in response.matched_cases:
    print(f"案例ID: {matched_case.case.id}")
    print(f"相似度: {matched_case.similarity_score.final_score}")
    print(f"GPT验证: {matched_case.gpt_validation}")
```

### 2. API使用

```bash
# 查找相似案例
curl -X POST "http://localhost:8000/api/v1/history/match" \
  -H "Content-Type: application/json" \
  -d '{
    "incident_id": "ALR-861600",
    "source_type": "Email",
    "problem_summary": "Customer experiencing duplicate container records",
    "affected_module": "Container",
    "entities": [{"type": "container_number", "value": "CMAU0000020"}],
    "urgency": "High",
    "raw_text": "原始事件文本..."
  }'

# 获取服务统计信息
curl "http://localhost:8000/api/v1/history/stats"

# 健康检查
curl "http://localhost:8000/api/v1/history/health"
```

## 测试

运行测试脚本：

```bash
python test_history_match.py
```

## 数据结构

### 输入数据格式

```json
{
    "incident_id": "ALR-861600",
    "source_type": "Email",
    "problem_summary": "问题摘要",
    "affected_module": "Container",
    "entities": [
        {"type": "container_number", "value": "CMAU0000020"}
    ],
    "error_code": null,
    "urgency": "High",
    "raw_text": "原始文本"
}
```

### 输出数据格式

```json
{
    "incident_id": "ALR-861600",
    "matched_cases": [
        {
            "case": {
                "id": "case_1",
                "module": "Container",
                "problem_statement": "历史案例问题描述",
                "solution": "解决方案"
            },
            "similarity_score": {
                "similarity_score": 0.85,
                "entity_overlap_score": 0.70,
                "module_match_score": 1.0,
                "final_score": 0.82
            },
            "gpt_validation": true,
            "gpt_reasoning": "GPT验证推理"
        }
    ],
    "total_candidates": 100,
    "module_filtered_count": 25,
    "similarity_filtered_count": 10,
    "gpt_validated_count": 1,
    "processing_time_ms": 1250.5
}
```

## 配置参数

### 相似度权重配置

```python
weights = {
    "similarity": 0.7,      # 相似度权重70%
    "entity_overlap": 0.2,   # 实体重合权重20%
    "module_match": 0.1      # 模块匹配权重10%
}
```

### 过滤阈值

- 相似度阈值: 0.3
- GPT验证案例数: 3
- 向量搜索候选数: 50

## 性能优化

1. **向量索引**: 使用ChromaDB的HNSW索引进行快速向量搜索
2. **批量处理**: 支持批量向量化和批量搜索
3. **缓存机制**: 向量嵌入结果会被缓存
4. **异步处理**: 支持异步API调用

## 故障排除

### 常见问题

1. **向量存储初始化失败**
   - 检查数据文件路径是否正确
   - 确保有足够的磁盘空间

2. **GPT验证失败**
   - 检查Azure OpenAI API配置
   - 确认API密钥和端点正确

3. **相似度计算异常**
   - 检查sentence-transformers模型是否正确下载
   - 确认输入数据格式正确

### 日志调试

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 扩展功能

### 自定义相似度算法

```python
class CustomSimilarityCalculator(SimilarityCalculator):
    def calculate_custom_score(self, query, case):
        # 实现自定义相似度算法
        pass
```

### 自定义GPT提示

```python
class CustomGPTValidator(GPTValidator):
    def _build_validation_prompt(self, request, case):
        # 实现自定义GPT验证提示
        pass
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

MIT License
