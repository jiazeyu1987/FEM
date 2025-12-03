"""
HEM Analyzer 波峰检测模块
移植自前端JavaScript版本的波峰检测算法

功能：检测曲线中的绿色（稳定）波峰区间
"""

from typing import List, Tuple
import statistics


def detect_white_peaks_by_threshold(
    curve: List[float],
    threshold: float = 105,
    marginFrames: int = 5,
    differenceThreshold: float = 2.1
) -> List[Tuple[int, int, float]]:
    """
    绝对阈值法检测波峰

    Args:
        curve: 输入曲线数据
        threshold: 绝对灰度阈值
        marginFrames: 边界扩展帧数
        differenceThreshold: 帧差值阈值（用于颜色分类）

    Returns:
        波峰列表：[(start, end, frameDifference), ...]
    """
    peaks = []
    n = len(curve)
    in_peak = False
    peak_start = -1

    # 第一阶段：识别核心超过阈值的区域
    for i in range(n):
        if curve[i] >= threshold:
            if not in_peak:
                peak_start = i
                in_peak = True
        else:
            if in_peak:
                # 结束一个波峰区域
                peaks.append((peak_start, i - 1))
                in_peak = False

    # 处理结尾的波峰
    if in_peak and peak_start >= 0:
        peaks.append((peak_start, n - 1))

    # 第二阶段：边界扩展（保守策略：只包含真正的高值区域）
    extended_peaks = []
    for start, end in peaks:
        # 保守的边界扩展：只扩展1-2帧到真正的边界
        extended_start = max(0, start - 1)
        extended_end = min(n - 1, end + 1)

        # 检查与前一个波峰的重叠
        if extended_peaks:
            prev_start, prev_end, _ = extended_peaks[-1]
            if extended_start <= prev_end:
                # 如果重叠，优先保留峰值更高的波峰
                prev_peak_value = max(curve[prev_start:prev_end + 1])
                current_peak_value = max(curve[start:end + 1])

                if current_peak_value > prev_peak_value:
                    # 当前波峰更高，替换前一个
                    frame_diff = calculate_frame_difference(curve, start, end)
                    extended_peaks[-1] = (extended_start, extended_end, frame_diff)
                # 否则保留前一个，忽略当前
                continue

        # 计算frameDifference用于颜色分类（基于核心区域）
        frame_diff = calculate_frame_difference(curve, start, end)
        extended_peaks.append((extended_start, extended_end, frame_diff))

    return extended_peaks


def detect_white_curve_peaks(
    curve: List[float],
    sensitivity: float = 20,
    minPeakWidth: int = 3,
    maxPeakWidth: int = 15,
    minDistance: int = 5
) -> List[Tuple[int, int, float]]:
    """
    形态检测法检测波峰

    Args:
        curve: 输入曲线数据
        sensitivity: 相对基线的最小高度要求
        minPeakWidth: 最小波峰宽度（帧数）
        maxPeakWidth: 最大波峰宽度（帧数）
        minDistance: 波峰间最小距离（帧数）

    Returns:
        波峰列表：[(start, end, frameDifference), ...]
    """
    n = len(curve)
    if n < minPeakWidth * 2:
        return []

    # 计算基线（使用全局中位数）
    baseline = statistics.median(curve)
    peaks = []

    # 寻找局部极大值
    for i in range(minPeakWidth, n - minPeakWidth):
        # 检查是否为局部极大值
        is_local_max = True
        for j in range(i - minPeakWidth, i + minPeakWidth + 1):
            if j != i and curve[j] >= curve[i]:
                is_local_max = False
                break

        if not is_local_max:
            continue

        # 检查相对高度
        peak_height = curve[i] - baseline
        if peak_height < sensitivity:
            continue

        # 向左搜索真正的起始点（严格上升）
        left_boundary = i
        for j in range(i - 1, max(0, i - maxPeakWidth), -1):
            if curve[j] >= curve[j + 1]:  # 不再严格上升
                left_boundary = j + 1
                break
            left_boundary = j
            if j == 0:
                break

        # 向右搜索真正的结束点（严格下降）
        right_boundary = i
        for j in range(i + 1, min(n, i + maxPeakWidth + 1)):
            if curve[j] >= curve[j - 1]:  # 不再严格下降
                right_boundary = j - 1
                break
            right_boundary = j
            if j == n - 1:
                break

        # 优化：确保波峰不包含明显的低值区域
        # 向左收缩，直到找到第一个显著上升点
        while left_boundary < i and curve[left_boundary] < baseline + sensitivity * 0.3:
            left_boundary += 1

        # 向右收缩，直到找到第一个显著下降点
        while right_boundary > i and curve[right_boundary] < baseline + sensitivity * 0.3:
            right_boundary -= 1

        # 检查波峰宽度
        peak_width = right_boundary - left_boundary + 1
        if peak_width < minPeakWidth or peak_width > maxPeakWidth:
            continue

        # 计算frameDifference
        frame_diff = calculate_frame_difference(curve, left_boundary, right_boundary)
        peaks.append((left_boundary, right_boundary, frame_diff))

    # 距离去重：如果两个波峰距离太近，保留较高的那个
    if len(peaks) <= 1:
        return peaks

    filtered_peaks = [peaks[0]]
    for current in peaks[1:]:
        prev_start, prev_end, _ = filtered_peaks[-1]
        current_start, current_end, _ = current

        if current_start - prev_end < minDistance:
            # 距离太近，比较峰值
            prev_peak_value = max(curve[prev_start:prev_end + 1])
            current_peak_value = max(curve[current_start:current_end + 1])

            if current_peak_value > prev_peak_value:
                filtered_peaks[-1] = current
            # 否则保留前一个，丢弃当前
        else:
            filtered_peaks.append(current)

    return filtered_peaks


def calculate_frame_difference(
    curve: List[float],
    peak_start: int,
    peak_end: int
) -> float:
    """
    计算波峰前后的帧差值

    Args:
        curve: 输入曲线数据
        peak_start: 波峰起始位置
        peak_end: 波峰结束位置

    Returns:
        帧差值（后N帧平均值 - 前N帧平均值）
    """
    n = len(curve)
    frame_count = 5  # 前5帧和后5帧

    # 计算前5帧的平均值
    before_start = max(0, peak_start - frame_count)
    before_end = max(0, peak_start - 1)

    if before_start <= before_end:
        before_avg = sum(curve[before_start:before_end + 1]) / (before_end - before_start + 1)
    else:
        before_avg = curve[peak_start]  # 如果没有前5帧，使用波峰起始值

    # 计算后5帧的平均值
    after_start = min(n - 1, peak_end + 1)
    after_end = min(n - 1, peak_end + frame_count)

    if after_start <= after_end:
        after_avg = sum(curve[after_start:after_end + 1]) / (after_end - after_start + 1)
    else:
        after_avg = curve[peak_end]  # 如果没有后5帧，使用波峰结束值

    return after_avg - before_avg


def classify_peak_color(frameDifference: float, differenceThreshold: float = 0.5) -> str:
    """
    波峰颜色分类

    Args:
        frameDifference: 帧差值
        differenceThreshold: 差值阈值（调整为更宽松的0.5）

    Returns:
        颜色分类：'green', 'red', 'white'
    """
    if frameDifference > differenceThreshold:
        return 'green'  # 稳定波峰
    elif frameDifference <= differenceThreshold:
        return 'red'    # 不稳定波峰
    else:
        return 'white'  # 边界情况


def evaluate_peak_score(
    curve: List[float],
    start: int,
    end: int,
    frame_diff: float,
    differenceThreshold: float = 2.1
) -> float:
    """
    评估波峰质量得分

    Args:
        curve: 输入曲线数据
        start: 波峰起始位置
        end: 波峰结束位置
        frame_diff: 帧差值
        differenceThreshold: 差值阈值

    Returns:
        波峰质量得分（越高越好）
    """
    # 基本检查
    if start >= end or start < 0 or end >= len(curve):
        return 0.0

    peak_values = curve[start:end + 1]
    peak_max = max(peak_values)
    peak_avg = sum(peak_values) / len(peak_values)
    peak_width = end - start + 1

    # 评分因子
    score = 0.0

    # 1. 峰值高度（越高越好）
    score += peak_max * 0.4

    # 2. 颜色分类（绿色加分，红色减分）
    color = classify_peak_color(frame_diff, differenceThreshold)
    if color == 'green':
        score += 50  # 绿色波峰大幅加分
    else:
        score -= 30  # 红色波峰减分

    # 3. 波峰紧凑度（宽度越小得分越高）
    compactness_score = max(0, 20 - peak_width)
    score += compactness_score

    # 4. 均值与峰值差异（峰值显著高于平均值加分）
    if peak_avg > 0:
        prominence_score = (peak_max - peak_avg) / peak_avg * 10
        score += prominence_score

    return score


def detect_green_peaks(
    curve: List[float],
    threshold: float = 105,
    marginFrames: int = 5,
    differenceThreshold: float = 0.5
) -> List[Tuple[int, int]]:
    """
    主函数：使用绝对阈值检测曲线中的绿色（稳定）波峰区间

    Args:
        curve: 输入曲线数据（数组）
        threshold: 绝对灰度阈值 (0-255)
        marginFrames: 边界扩展帧数
        differenceThreshold: 帧差值阈值（用于颜色分类）

    Returns:
        绿色区间集合：[(start_frame, end_frame), ...]
    """
    if not curve:
        return []

    # 只使用绝对阈值检测
    threshold_peaks = detect_white_peaks_by_threshold(
        curve, threshold, marginFrames, differenceThreshold
    )

    print(f"调试信息:")
    print(f"  绝对阈值法检测到 {len(threshold_peaks)} 个波峰:")
    for i, (start, end, frame_diff) in enumerate(threshold_peaks):
        peak_val = max(curve[start:end+1])
        print(f"    {i+1}: [{start}, {end}], 峰值: {peak_val:.1f}, frameDiff: {frame_diff:.2f}")

    # 只返回绿色的波峰区间
    green_peaks = []
    print(f"  绿色波峰筛选结果:")
    for i, (start, end, frame_diff) in enumerate(threshold_peaks):
        color = classify_peak_color(frame_diff, differenceThreshold)
        print(f"    波峰{i+1}: [{start}, {end}], frameDiff: {frame_diff:.2f}, 颜色: {color}")
        if color == 'green':
            green_peaks.append((start, end))
            print(f"      ✅ 添加到绿色波峰列表")
        else:
            print(f"      ❌ 跳过（非绿色）")

    return green_peaks


# 示例使用
if __name__ == "__main__":
    # 测试数据
    test_curve = [40, 42, 45, 48, 52, 108, 110, 112, 109, 107, 45, 43, 41,
                  42, 44, 46, 49, 53, 55, 58, 60, 62, 61, 59, 45, 43, 41,
                  42, 45, 110, 115, 118, 116, 113, 48, 46, 44, 42, 41]

    print("测试数据（索引: 值）:")
    for i, val in enumerate(test_curve):
        print(f"{i:2d}: {val:3d}", end="  ")
        if (i + 1) % 10 == 0:
            print()
    print("\n")

    # 检测绿色波峰
    green_intervals = detect_green_peaks(test_curve)

    print("检测到的绿色波峰区间：",green_intervals)
    for i, (start, end) in enumerate(green_intervals, 1):
        peak_values = test_curve[start:end+1]
        peak_max = max(peak_values)
        peak_avg = sum(peak_values) / len(peak_values)
        print(f"波峰 {i}: [{start}, {end}]")
        print(f"  - 区间长度: {end-start+1} 帧")
        print(f"  - 平均值: {peak_avg:.1f}")
        print(f"  - 峰值: {peak_max:.1f}")
        print(f"  - 区间值: {peak_values}")

    print(f"\n共检测到 {len(green_intervals)} 个绿色波峰")