# 01 栗子谷出租率系统

## 项目目标

商业地产合同审计与出租率统计。扫描合同文件 → 提取结构化数据 → 评分并生成审计索引 → 构建 HTML 看板。

## 核心业务规则

- 挂靠收入 (virtual_address): 收入计入经营收入，出租率面积固定为 0
- 孵化协议 (incubation_service): 管理费/科技服务费视为收入，不计出租面积
- 动态面积: 可出租面积按月调整，记录在 `historical_occupancy_reference.json` 的 `areaRules`
- 合同评分: PDF +25, 文件含 KS 编号 +25, 含"已签/已盖章"等关键词 +30, 含"未盖章/废弃"等关键词 -70

## 技术架构

- Python 3.11+ 脚本: 合同扫描 + 看板生成
- HTML/CSS/JS 看板: 完全自包含，无网络依赖
- 数据源: 本地 JSON (合同审计索引 + 台账 + 历史出租率)

## 关键文件

| 文件 | 路径 | 用途 |
|------|------|------|
| lzg_scan_contracts.py | C:\Users\admin\lzg_scan_contracts.py | 合同扫描器 |
| build_lzg_integrated_dashboard.py | C:\Users\admin\build_lzg_integrated_dashboard.py | 旧版看板生成(已废弃) |
| generate_dashboard.py | C:\Users\admin\generate_dashboard.py | 新版看板生成 |
| lzg_system_complete.html | F:\老紫转移\Codex.88\栗子谷出租率统计\ | 当前看板产物 |

## 数据源路径

- 租赁合同: `D:/黄泽鹏/30323736/合同类/立白中心租赁合同/`
- 挂靠合同: `D:/黄泽鹏/30323736/合同类/挂靠合同/`
- 输出目录: `F:/老紫转移/Codex.88/栗子谷出租率统计/`
- 台帐: `F:/老紫转移/Codex.88/栗子谷出租率统计/2026年栗子谷出租率.xlsx`

## 当前状态 (2026-06-02)

- [x] 合同扫描 → contract_audit_index.json
- [x] 看板生成 → lzg_system_complete.html
- [ ] 人工确认入库功能
- [ ] 租赁合同/孵化协议自动配对
- [ ] 押金拆分为应收/已收/退还/未退
- [ ] 合同到期预警
