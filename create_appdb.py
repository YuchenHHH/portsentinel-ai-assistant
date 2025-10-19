#!/usr/bin/env python3
"""
创建 appdb 数据库和示例数据
"""

import pymysql
import sys

def create_database_and_tables():
    """创建数据库和表"""
    print("🗄️ 创建 appdb 数据库和示例数据")
    print("=" * 50)
    
    # 尝试不同的连接配置
    configs = [
        {'host': 'localhost', 'user': 'root', 'password': '', 'port': 3306},
        {'host': 'localhost', 'user': 'root', 'password': 'root', 'port': 3306},
        {'host': 'localhost', 'user': 'root', 'password': 'password', 'port': 3306},
        {'host': 'localhost', 'user': 'root', 'password': '123456', 'port': 3306},
    ]
    
    connection = None
    working_config = None
    
    # 尝试连接
    for config in configs:
        try:
            print(f"尝试连接: {config['user']}@{config['host']} (密码: {'***' if config['password'] else '无'})")
            connection = pymysql.connect(**config)
            working_config = config
            print(f"✅ 连接成功!")
            break
        except pymysql.MySQLError as e:
            print(f"❌ 连接失败: {e}")
            continue
    
    if not connection:
        print("\n❌ 无法连接到 MySQL 服务器")
        print("\n🔧 可能的解决方案:")
        print("1. 确保 MySQL 服务正在运行")
        print("2. 检查 MySQL 用户权限")
        print("3. 尝试以下命令重置 root 密码:")
        print("   sudo mysql -u root")
        print("   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';")
        print("   FLUSH PRIVILEGES;")
        return False
    
    try:
        with connection.cursor() as cursor:
            # 创建数据库
            print("\n📦 创建 appdb 数据库...")
            cursor.execute("CREATE DATABASE IF NOT EXISTS appdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print("✅ appdb 数据库创建成功")
            
            # 选择数据库
            cursor.execute("USE appdb")
            
            # 创建 container 表
            print("📋 创建 container 表...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS container (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    cntr_no VARCHAR(50) NOT NULL,
                    vessel_id VARCHAR(50),
                    eta_ts DATETIME,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_cntr_no (cntr_no),
                    INDEX idx_vessel_eta (vessel_id, eta_ts)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            print("✅ container 表创建成功")
            
            # 插入示例数据
            print("📊 插入示例数据...")
            cursor.execute("""
                INSERT IGNORE INTO container (cntr_no, vessel_id, eta_ts) VALUES
                ('CMAU0000020', 'VESSEL001', '2024-01-15 10:00:00'),
                ('CMAU0000020', 'VESSEL001', '2024-01-15 10:00:00'),
                ('CMAU0000020', 'VESSEL002', '2024-01-16 14:30:00'),
                ('CMAU0000021', 'VESSEL003', '2024-01-17 09:15:00'),
                ('CMAU0000022', 'VESSEL004', '2024-01-18 16:45:00')
            """)
            print("✅ 示例数据插入成功")
            
            # 验证数据
            cursor.execute("SELECT COUNT(*) as count FROM container")
            count = cursor.fetchone()
            print(f"📈 数据库中共有 {count['count']} 条容器记录")
            
            # 显示示例数据
            cursor.execute("SELECT * FROM container LIMIT 3")
            samples = cursor.fetchall()
            print("📋 示例数据:")
            for sample in samples:
                print(f"   - {sample['cntr_no']} ({sample['vessel_id']}) - {sample['eta_ts']}")
        
        connection.close()
        
        print(f"\n🎉 数据库创建完成!")
        print(f"✅ 工作配置: {working_config['user']}@{working_config['host']}")
        print(f"   密码: {'***' if working_config['password'] else '无'}")
        print(f"   数据库: appdb")
        
        return working_config
        
    except Exception as e:
        print(f"❌ 创建数据库失败: {e}")
        if connection:
            connection.close()
        return False

def main():
    """主函数"""
    print("🚀 PortSentinel 数据库初始化")
    print("=" * 60)
    
    result = create_database_and_tables()
    
    if result:
        print("\n" + "=" * 60)
        print("🎉 数据库初始化成功！")
        print("\n📝 现在你可以:")
        print("1. 在前端界面使用以下配置连接数据库:")
        print(f"   主机: localhost")
        print(f"   端口: 3306")
        print(f"   用户名: {result['user']}")
        print(f"   密码: {result['password'] if result['password'] else '(留空)'}")
        print(f"   数据库: appdb")
        print("2. 测试完整的 SOP 执行流程")
        print("3. 执行数据库查询和操作")
    else:
        print("\n❌ 数据库初始化失败")
        print("请检查 MySQL 服务状态和用户权限")

if __name__ == "__main__":
    main()



