import pandas as pd
import json
from datetime import datetime

def excel_to_json_for_rag(excel_file, output_json='case_log_rag.json'):
    """
    将Excel文件转换为适合RAG检索的JSON格式
    每一行是一个问题/案例,每一列是问题的不同组成部分
    
    参数:
        excel_file: Excel文件路径
        output_json: 输出JSON文件路径
    """
    
    # 读取Excel文件
    df = pd.read_excel(excel_file, sheet_name='Cases')
    
    # 处理数据
    cases = []
    for idx, row in df.iterrows():
        # 构建单个案例的字典
        case = {
            'id': f"case_{idx + 1}",  # 添加唯一ID便于检索
            'module': row.get('Module', ''),
            'mode': row.get('Mode', ''),
            'is_edi': row.get('EDI?', ''),
            'timestamp': row.get('TIMESTAMP', ''),
            'alert_email': row.get('Alert / Email', ''),
            'problem_statement': row.get('Problem Statements', ''),
            'solution': row.get('Solution', ''),
            'sop': row.get('SOP', '')  # SOP可能为空
        }
        
        # 处理时间戳格式(如果需要)
        if pd.notna(case['timestamp']):
            try:
                if isinstance(case['timestamp'], pd.Timestamp):
                    case['timestamp'] = case['timestamp'].isoformat()
                elif isinstance(case['timestamp'], datetime):
                    case['timestamp'] = case['timestamp'].isoformat()
            except:
                case['timestamp'] = str(case['timestamp'])
        
        # 处理空值,将NaN转换为空字符串
        for key, value in case.items():
            if pd.isna(value):
                case[key] = ''
            elif not isinstance(value, str):
                case[key] = str(value)
        
        # 添加组合文本字段,便于RAG全文检索
        case['full_text'] = f"""Module: {case['module']}
Mode: {case['mode']}
EDI: {case['is_edi']}
Timestamp: {case['timestamp']}
Alert: {case['alert_email']}
Problem: {case['problem_statement']}
Solution: {case['solution']}
SOP: {case['sop']}"""
        
        cases.append(case)
    
    # 保存为JSON文件
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(cases, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 成功转换 {len(cases)} 条案例")
    print(f"📁 输出文件: {output_json}")
    
    # 显示统计信息
    print(f"\n📊 数据统计:")
    print(f"   - 总案例数: {len(cases)}")
    df_stats = pd.DataFrame(cases)
    print(f"   - 模块分布: {df_stats['module'].value_counts().to_dict()}")
    print(f"   - EDI相关: {df_stats['is_edi'].value_counts().to_dict()}")
    
    return cases


# 使用示例
if __name__ == "__main__":
    import os
    
    # ========== 配置输入输出路径 ==========
    # 相对路径(从 modules/history_record_rag/ 出发)
    input_excel = 'data/Case Log.xlsx'      # 📥 输入: Excel文件路径
    output_json = 'data/case_log_rag.json'  # 📤 输出: JSON文件路径

    # ====================================
    
    # 检查输入文件是否存在
    if not os.path.exists(input_excel):
        print(f"❌ 错误: 找不到文件 {input_excel}")
        print(f"📍 当前工作目录: {os.getcwd()}")
        print(f"📍 脚本所在目录: {os.path.dirname(os.path.abspath(__file__))}")
        exit(1)
    
    # 转换Excel为JSON
    cases = excel_to_json_for_rag(input_excel, output_json)
    
    # 查看前2个案例示例
    print("\n📝 前2个案例示例:")
    for i, case in enumerate(cases[:2]):
        print(f"\n--- 案例 {i+1} ---")
        print(f"ID: {case['id']}")
        print(f"Module: {case['module']}")
        print(f"Problem: {case['problem_statement'][:100]}...")
        print(f"Solution: {case['solution'][:100]}...")