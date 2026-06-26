package com.supergokou.aidataplc.service;

import com.supergokou.aidataplc.domain.BatchSnapshot;
import com.supergokou.aidataplc.domain.PointDefinition;
import com.supergokou.aidataplc.domain.ProcessStep;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SampleDataService {

  public List<PointDefinition> points() {
    return List.of(
        new PointDefinition(1, "batch_id", "批次ID", "文本", "B20260324001", "B20260324001", "ERP", "计划科-开卡", "主键，跨表唯一，用工单号", true),
        new PointDefinition(2, "fabric_weight_gsm", "坯布克重", "数值", "g/m2", "185", "ERP", "白坯车间-白坯入仓", "密度仪/电子天平", true),
        new PointDefinition(3, "width_cm", "门幅", "数值", "cm", "165", "ERP", "白坯车间-白坯入仓/前处理-视觉相机", "白坯门幅有，成品可能有", true),
        new PointDefinition(4, "fiber_type", "纤维种类", "枚举", "见枚举值", "PET", "ERP", "白坯车间-白坯入仓", "PET/Cotton/Nylon/PLA", true),
        new PointDefinition(8, "liquor_ratio", "浴比", "数值", "L/kg", "8", "PLC内部计算", "染色车间-染色", "体积计量，PLC计算", true),
        new PointDefinition(11, "machine_id", "缸号", "文本", "机台编号", "JET-03", "ERP", "染色车间-染色", "设备唯一标识", true),
        new PointDefinition(16, "time_min", "时间", "数值", "min", "0", "PLC", "染色车间-染色", "从染色开始计时", true),
        new PointDefinition(17, "temperature_c", "温度", "数值", "C", "30", "PLC", "染色车间-染色", "染缸温度传感器", true),
        new PointDefinition(19, "ph", "pH", "数值", "-", "5.2", "PLC", "染色车间-染色", "在线 pH 传感器", true),
        new PointDefinition(20, "conductivity_ms_cm", "电导率", "数值", "mS/cm", "3.8", "PLC", "染色车间-染色", "电导率仪", true),
        new PointDefinition(22, "dye_concentration_spectrum", "染料浓度光谱数据", "文本", "JSON", "{\"400\":0.12,\"420\":0.15}", "优普德设备", "染色车间-染色", "UV-Vis / 软测量", true),
        new PointDefinition(23, "dye_uptake_pct", "上染率/吸尽率", "数值", "%", "63.5", "优普德计算", "染色车间-染色", "由吸光度变化估计", true),
        new PointDefinition(34, "ks_value", "K/S", "数值", "-", "14.8", "彩普设备", "打样间-测配色机", "由反射谱计算", true),
        new PointDefinition(36, "delta_e_2000", "色差ΔE2000", "数值", "-", "0.68", "彩普设备", "打样间-测配色机", "色差仪/在线光谱仪", true),
        new PointDefinition(38, "rft_flag", "是否一次成功", "枚举", "见枚举值", "是", "人工填写", "人工填写", "Right First Time", true),
        new PointDefinition(39, "result_L", "L值", "数值", "-", "22", "彩普设备", "打样间-测配色机", "Lab 结果", true));
  }

  public List<ProcessStep> processSteps() {
    return List.of(
        new ProcessStep(1, "白坯车间", "白坯入仓", "坯布批次、供应商批号、数量", "待检/待入库", "生成坯布入库单，打印唯一追溯标签", ""),
        new ProcessStep(2, "计划科", "开卡", "生成生产流转卡", "已开卡/待生产", "MES 将订单拆解为若干缸次流转卡", ""),
        new ProcessStep(3, "计划科", "发卡", "流转卡与实物布捆绑定确认", "已发卡/待配桶", "扫描流转卡与布捆标签，记录发卡时间", ""),
        new ProcessStep(4, "白坯车间", "配桶", "将布捆/订单分配至具体染缸", "已配桶/待前处理", "绑定布捆标签与缸号", ""),
        new ProcessStep(7, "前处理", "冷堆", "浸轧后堆置时间合规", "冷堆中", "记录冷堆开始时间，超时或不足报警", ""),
        new ProcessStep(8, "前处理", "热堆", "堆置温度和时间控制", "热堆中", "记录温度曲线与持续时长", ""),
        new ProcessStep(9, "前处理", "BO（退浆）", "双氧水浓度、温度、时间", "氧漂中", "采集温度、液量、车速并与配方比对", "BO机/OS机"),
        new ProcessStep(20, "染色车间", "染色", "升温速率、保温温度/时间、加料顺序、浴比", "染色中", "实时采集温度曲线、加料信号、压力并比对", ""),
        new ProcessStep(21, "染色车间", "还原清洗", "还原剂种类、温度、时间", "还原清洗中", "记录清洗温度与持续时间", ""),
        new ProcessStep(23, "染色车间", "皂洗", "皂洗温度、道数、浮色去除效果", "皂洗中", "采集皂洗槽温度与道次", ""),
        new ProcessStep(28, "定型车间", "定型", "定型温度、车速、超喂、门幅、纬斜/扭度", "定型中", "采集各区温度和车速，超差提示调机", ""),
        new ProcessStep(31, "成品车间", "成品打卷", "成品卷长、卷重、定等、降等判定", "成品打卷中/待检验入库", "生成成品卷标签并分流", ""));
  }

  public List<BatchSnapshot> batches() {
    Instant now = Instant.now();
    return List.of(
        new BatchSnapshot("B20260324001", "JET-03", "PET", "染色", "染色中", 62.0, now.minusSeconds(18), false),
        new BatchSnapshot("B20260324002", "JET-05", "Cotton", "皂洗", "皂洗中", 78.0, now.minusSeconds(42), false),
        new BatchSnapshot("B20260324003", "ST-02", "PET/Cotton", "定型", "定型中", 91.0, now.minusSeconds(12), true));
  }
}
