"""
历史案例向量存储

负责历史案例数据的向量化存储和检索。
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

from .models import HistoricalCase

logger = logging.getLogger(__name__)


class HistoryVectorStore:
    """历史案例向量存储"""
    
    def __init__(self, 
                 persist_directory: str = "history_vector_db",
                 model_name: str = "all-MiniLM-L6-v2",
                 collection_name: str = "historical_cases"):
        """
        初始化历史案例向量存储
        
        Args:
            persist_directory: 向量数据库持久化目录
            model_name: 句子嵌入模型名称
            collection_name: ChromaDB集合名称
        """
        self.persist_directory = persist_directory
        self.model_name = model_name
        self.collection_name = collection_name
        
        # 初始化句子嵌入模型
        self.encoder = SentenceTransformer(model_name)
        
        # 初始化ChromaDB
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # 获取或创建集合
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        
        logger.info(f"HistoryVectorStore initialized with {self.model_name}")
    
    def load_historical_cases(self, json_file_path: str) -> List[HistoricalCase]:
        """
        从JSON文件加载历史案例数据
        
        Args:
            json_file_path: JSON文件路径
            
        Returns:
            历史案例列表
        """
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            cases = []
            for item in data:
                case = HistoricalCase(**item)
                cases.append(case)
            
            logger.info(f"Loaded {len(cases)} historical cases from {json_file_path}")
            return cases
            
        except Exception as e:
            logger.error(f"Failed to load historical cases: {e}")
            raise
    
    def vectorize_cases(self, cases: List[HistoricalCase]) -> None:
        """
        将历史案例向量化并存储到ChromaDB
        
        Args:
            cases: 历史案例列表
        """
        try:
            # 准备数据
            documents = []
            metadatas = []
            ids = []
            
            for case in cases:
                # 使用problem_statement作为主要文本进行向量化
                text = case.problem_statement
                documents.append(text)
                
                # 创建元数据
                metadata = {
                    "case_id": case.id,
                    "module": case.module,
                    "mode": case.mode,
                    "is_edi": case.is_edi,
                    "timestamp": case.timestamp,
                    "alert_email": case.alert_email[:500],  # 限制长度
                    "solution": case.solution[:500],  # 限制长度
                    "sop": case.sop,
                    "full_text": case.full_text[:1000]  # 限制长度
                }
                metadatas.append(metadata)
                ids.append(case.id)
            
            # 批量添加到ChromaDB
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
            logger.info(f"Vectorized and stored {len(cases)} historical cases")
            
        except Exception as e:
            logger.error(f"Failed to vectorize cases: {e}")
            raise
    
    def search_similar_cases(self, 
                            query_text: str, 
                            module_filter: Optional[str] = None,
                            top_k: int = 10) -> List[Tuple[str, float, Dict[str, Any]]]:
        """
        搜索相似的历史案例
        
        Args:
            query_text: 查询文本
            module_filter: 模块过滤器
            top_k: 返回结果数量
            
        Returns:
            相似案例列表，每个元素包含(case_id, score, metadata)
        """
        try:
            # 构建查询条件
            where_clause = {}
            if module_filter:
                where_clause["module"] = module_filter
            
            # 执行搜索
            results = self.collection.query(
                query_texts=[query_text],
                n_results=top_k,
                where=where_clause if where_clause else None
            )
            
            # 处理结果
            similar_cases = []
            if results['ids'] and results['ids'][0]:
                for i, case_id in enumerate(results['ids'][0]):
                    score = 1 - results['distances'][0][i]  # 转换为相似度分数
                    metadata = results['metadatas'][0][i]
                    similar_cases.append((case_id, score, metadata))
            
            logger.info(f"Found {len(similar_cases)} similar cases for query")
            return similar_cases
            
        except Exception as e:
            logger.error(f"Failed to search similar cases: {e}")
            raise
    
    def get_case_by_id(self, case_id: str) -> Optional[Dict[str, Any]]:
        """
        根据ID获取历史案例
        
        Args:
            case_id: 案例ID
            
        Returns:
            案例数据或None
        """
        try:
            results = self.collection.get(ids=[case_id])
            if results['ids']:
                return {
                    'id': results['ids'][0],
                    'document': results['documents'][0],
                    'metadata': results['metadatas'][0]
                }
            return None
            
        except Exception as e:
            logger.error(f"Failed to get case by ID: {e}")
            return None
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """
        获取集合统计信息
        
        Returns:
            统计信息字典
        """
        try:
            count = self.collection.count()
            return {
                "count": count,
                "collection_name": self.collection_name,
                "persist_directory": self.persist_directory
            }
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {"count": 0, "error": str(e)}
    
    def rebuild_index(self, json_file_path: str) -> None:
        """
        重建向量索引
        
        Args:
            json_file_path: 历史案例JSON文件路径
        """
        try:
            # 清空现有集合
            self.client.delete_collection(self.collection_name)
            
            # 重新创建集合
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            
            # 重新加载和向量化数据
            cases = self.load_historical_cases(json_file_path)
            self.vectorize_cases(cases)
            
            logger.info("Successfully rebuilt vector index")
            
        except Exception as e:
            logger.error(f"Failed to rebuild index: {e}")
            raise


class HistoryVectorStoreManager:
    """历史案例向量存储管理器"""
    
    def __init__(self, 
                 data_file_path: str,
                 persist_directory: str = "history_vector_db"):
        """
        初始化管理器
        
        Args:
            data_file_path: 历史案例数据文件路径
            persist_directory: 向量数据库持久化目录
        """
        self.data_file_path = data_file_path
        self.persist_directory = persist_directory
        self.vector_store = None
        self._initialize()
    
    def _initialize(self):
        """初始化向量存储"""
        try:
            self.vector_store = HistoryVectorStore(
                persist_directory=self.persist_directory
            )
            
            # 检查是否需要重建索引
            stats = self.vector_store.get_collection_stats()
            if stats.get("count", 0) == 0:
                logger.info("Vector store is empty, rebuilding index...")
                self.vector_store.rebuild_index(self.data_file_path)
            else:
                logger.info(f"Vector store loaded with {stats['count']} cases")
                
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            raise
    
    def search_similar_cases(self, 
                           query_text: str, 
                           module_filter: Optional[str] = None,
                           top_k: int = 10) -> List[Tuple[str, float, Dict[str, Any]]]:
        """搜索相似案例"""
        if not self.vector_store:
            raise RuntimeError("Vector store not initialized")
        
        return self.vector_store.search_similar_cases(
            query_text=query_text,
            module_filter=module_filter,
            top_k=top_k
        )
    
    def get_case_by_id(self, case_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取案例"""
        if not self.vector_store:
            raise RuntimeError("Vector store not initialized")
        
        return self.vector_store.get_case_by_id(case_id)
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        if not self.vector_store:
            return {"error": "Vector store not initialized"}
        
        return self.vector_store.get_collection_stats()
    
    def rebuild_index(self):
        """重建索引"""
        if not self.vector_store:
            raise RuntimeError("Vector store not initialized")
        
        self.vector_store.rebuild_index(self.data_file_path)
