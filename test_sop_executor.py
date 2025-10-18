#!/usr/bin/env python3
"""
SOP Executor 测试脚本

这个脚本用于测试 SOP Executor 模块的各个组件，特别是 orchestrator.py 中的 SOPPlanner 功能。
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any, List

# Add SOP executor module to path
sop_executor_path = Path(__file__).parent / "modules" / "sop_executor" / "src"
sys.path.insert(0, str(sop_executor_path))

try:
    from orchestrator import SOPPlanner, create_execution_plan
    print("✅ 成功导入 SOP Executor 模块")
except ImportError as e:
    print(f"❌ 导入失败: {e}")
    sys.exit(1)


class SOPExecutorTester:
    """SOP Executor 测试器"""
    
    def __init__(self):
        """初始化测试器"""
        self.planner = None
        self.test_results = []
    
    def setup_planner(self):
        """设置 SOP Planner"""
        try:
            self.planner = SOPPlanner()
            print("✅ SOP Planner 初始化成功")
            return True
        except Exception as e:
            print(f"❌ SOP Planner 初始化失败: {e}")
            return False
    
    def run_test_case(self, test_name: str, incident_data: Dict[str, Any], 
                     vague_resolution: str, expected_min_steps: int = 3) -> bool:
        """
        运行单个测试用例
        
        Args:
            test_name: 测试用例名称
            incident_data: 事件数据
            vague_resolution: 模糊的解决方案文本
            expected_min_steps: 期望的最小步骤数
            
        Returns:
            bool: 测试是否通过
        """
        print(f"\n📋 测试用例: {test_name}")
        print("-" * 50)
        
        try:
            print(f"📝 事件ID: {incident_data.get('incident_id', 'N/A')}")
            print(f"📝 问题摘要: {incident_data.get('problem_summary', 'N/A')}")
            print(f"📝 受影响模块: {incident_data.get('affected_module', 'N/A')}")
            print(f"📝 错误代码: {incident_data.get('error_code', 'N/A')}")
            print(f"📝 紧急程度: {incident_data.get('urgency', 'N/A')}")
            
            print(f"\n📝 模糊解决方案:")
            print(f"   {vague_resolution}")
            
            # 创建执行计划
            execution_plan = self.planner.create_execution_plan(
                incident_data=incident_data,
                vague_resolution_text=vague_resolution
            )
            
            # 验证结果
            if not execution_plan:
                print("❌ 执行计划为空")
                return False
            
            if len(execution_plan) < expected_min_steps:
                print(f"❌ 执行计划步骤数不足: 期望至少 {expected_min_steps} 步，实际 {len(execution_plan)} 步")
                return False
            
            print(f"\n✅ 生成的执行计划 ({len(execution_plan)} 步骤):")
            for i, step in enumerate(execution_plan, 1):
                print(f"  {i:2d}. {step}")
            
            # 验证每个步骤的质量
            quality_issues = []
            for i, step in enumerate(execution_plan):
                if len(step.strip()) < 10:
                    quality_issues.append(f"步骤 {i+1} 太短: '{step}'")
                if not any(keyword in step.lower() for keyword in ['query', 'check', 'verify', 'update', 'notify', 'apply', 'fix']):
                    quality_issues.append(f"步骤 {i+1} 缺少动作关键词: '{step}'")
            
            if quality_issues:
                print(f"\n⚠️  质量警告:")
                for issue in quality_issues:
                    print(f"  - {issue}")
            
            # 记录测试结果
            self.test_results.append({
                "test_name": test_name,
                "passed": True,
                "steps_count": len(execution_plan),
                "quality_issues": quality_issues
            })
            
            return True
            
        except Exception as e:
            print(f"❌ 测试失败: {e}")
            self.test_results.append({
                "test_name": test_name,
                "passed": False,
                "error": str(e)
            })
            return False
    
    def run_convenience_function_test(self) -> bool:
        """测试便利函数"""
        print(f"\n📋 测试用例: 便利函数测试")
        print("-" * 50)
        
        incident_data = {
            "incident_id": "TEST-001",
            "problem_summary": "Test incident for convenience function",
            "affected_module": "Test",
            "error_code": "TEST_ERR_1",
            "urgency": "Low"
        }
        
        vague_resolution = "Test resolution that should be converted to steps."
        
        try:
            execution_plan = create_execution_plan(
                incident_data=incident_data,
                vague_resolution_text=vague_resolution
            )
            
            if not execution_plan:
                print("❌ 便利函数返回空计划")
                return False
            
            print(f"✅ 便利函数测试成功，生成了 {len(execution_plan)} 个步骤")
            for i, step in enumerate(execution_plan, 1):
                print(f"  {i}. {step}")
            
            return True
            
        except Exception as e:
            print(f"❌ 便利函数测试失败: {e}")
            return False
    
    def run_sop_based_test(self) -> bool:
        """测试基于 SOP 的规划功能"""
        print(f"\n📋 测试用例: 基于 SOP 的规划")
        print("-" * 50)
        
        incident_data = {
            "incident_id": "SOP-TEST-001",
            "problem_summary": "SOP-based test incident",
            "affected_module": "Container",
            "error_code": None,
            "urgency": "Medium"
        }
        
        sop_title = "CNTR: Duplicate Container information received"
        sop_resolution = "Check for container range overlap and apply compliant fix after confirming scope on test entity."
        
        try:
            execution_plan = self.planner.create_execution_plan_from_sop(
                incident_data=incident_data,
                sop_resolution=sop_resolution,
                sop_title=sop_title
            )
            
            if not execution_plan:
                print("❌ SOP 规划返回空计划")
                return False
            
            print(f"✅ SOP 规划测试成功，生成了 {len(execution_plan)} 个步骤")
            for i, step in enumerate(execution_plan, 1):
                print(f"  {i}. {step}")
            
            return True
            
        except Exception as e:
            print(f"❌ SOP 规划测试失败: {e}")
            return False
    
    def run_error_handling_tests(self) -> bool:
        """测试错误处理"""
        print(f"\n📋 测试用例: 错误处理测试")
        print("-" * 50)
        
        tests_passed = 0
        total_tests = 3
        
        # 测试空事件数据
        try:
            self.planner.create_execution_plan({}, "test resolution")
            print("❌ 应该抛出异常但没有")
        except ValueError:
            print("✅ 空事件数据正确抛出异常")
            tests_passed += 1
        except Exception as e:
            print(f"❌ 空事件数据抛出错误异常: {e}")
        
        # 测试空解决方案文本
        try:
            self.planner.create_execution_plan({"test": "data"}, "")
            print("❌ 应该抛出异常但没有")
        except ValueError:
            print("✅ 空解决方案文本正确抛出异常")
            tests_passed += 1
        except Exception as e:
            print(f"❌ 空解决方案文本抛出错误异常: {e}")
        
        # 测试无效的事件数据
        try:
            self.planner.create_execution_plan(None, "test resolution")
            print("❌ 应该抛出异常但没有")
        except ValueError:
            print("✅ 无效事件数据正确抛出异常")
            tests_passed += 1
        except Exception as e:
            print(f"❌ 无效事件数据抛出错误异常: {e}")
        
        return tests_passed == total_tests
    
    def print_test_summary(self):
        """打印测试摘要"""
        print(f"\n{'='*60}")
        print("📊 测试摘要")
        print(f"{'='*60}")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["passed"])
        
        print(f"总测试数: {total_tests}")
        print(f"通过测试: {passed_tests}")
        print(f"失败测试: {total_tests - passed_tests}")
        print(f"成功率: {(passed_tests/total_tests*100):.1f}%")
        
        if passed_tests < total_tests:
            print(f"\n❌ 失败的测试:")
            for result in self.test_results:
                if not result["passed"]:
                    print(f"  - {result['test_name']}: {result.get('error', '未知错误')}")
        
        print(f"\n✅ 通过的测试:")
        for result in self.test_results:
            if result["passed"]:
                issues = result.get('quality_issues', [])
                status = "✅" if not issues else "⚠️"
                print(f"  {status} {result['test_name']} ({result['steps_count']} 步骤)")


def main():
    """主测试函数"""
    print("🧪 SOP Executor 测试脚本")
    print("=" * 60)
    
    tester = SOPExecutorTester()
    
    # 设置 Planner
    if not tester.setup_planner():
        print("❌ 无法初始化 Planner，退出测试")
        return
    
    # 定义测试用例
    test_cases = [
        {
            "name": "Container 重复信息问题",
            "incident_data": {
                "incident_id": "ALR-861600",
                "problem_summary": "Customer on PORTNET is seeing duplicate information for container CMAU0000020",
                "affected_module": "Container",
                "error_code": None,
                "urgency": "Medium",
                "entities": {
                    "container_number": "CMAU0000020",
                    "user_id": "customer@example.com"
                }
            },
            "vague_resolution": "The issue was resolved by checking the container range overlap and finding that there was a conflicting serial number. We documented the issue and applied a compliant fix after confirming the scope on a safe test entity.",
            "expected_min_steps": 5
        },
        {
            "name": "Vessel 错误代码问题",
            "incident_data": {
                "incident_id": "ALR-861631",
                "problem_summary": "Vessel name used by other vessel advice",
                "affected_module": "Vessel",
                "error_code": "VESSEL_ERR_4",
                "urgency": "High",
                "entities": {
                    "vessel_name": "LIONCITY07",
                    "error_code": "VESSEL_ERR_4"
                }
            },
            "vague_resolution": "Resolved the duplicate key error by checking the vessel advice table and removing the conflicting entry. Updated the vessel registry and notified the operations team.",
            "expected_min_steps": 4
        },
        {
            "name": "EDI 消息处理错误",
            "incident_data": {
                "incident_id": "ALR-861700",
                "problem_summary": "EDI message processing error",
                "affected_module": "EDI/API",
                "error_code": "EDI_ERR_1",
                "urgency": "High",
                "entities": {
                    "message_type": "COPARN",
                    "error_code": "EDI_ERR_1"
                }
            },
            "vague_resolution": "Fixed the EDI message processing by updating the message validation rules and reprocessing the failed messages.",
            "expected_min_steps": 5
        },
        {
            "name": "API 集成问题",
            "incident_data": {
                "incident_id": "ALR-861800",
                "problem_summary": "API integration timeout issues",
                "affected_module": "API",
                "error_code": "API_TIMEOUT",
                "urgency": "Medium",
                "entities": {
                    "system_name": "TOS",
                    "error_code": "API_TIMEOUT"
                }
            },
            "vague_resolution": "Increased timeout values and added retry logic to handle intermittent API failures. Updated monitoring to alert on timeout patterns.",
            "expected_min_steps": 4
        }
    ]
    
    # 运行主要测试用例
    for test_case in test_cases:
        tester.run_test_case(
            test_case["name"],
            test_case["incident_data"],
            test_case["vague_resolution"],
            test_case["expected_min_steps"]
        )
    
    # 运行额外测试
    tester.run_convenience_function_test()
    tester.run_sop_based_test()
    tester.run_error_handling_tests()
    
    # 打印测试摘要
    tester.print_test_summary()
    
    print(f"\n{'='*60}")
    print("🎉 测试完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
