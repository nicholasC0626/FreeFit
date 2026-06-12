import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { useTheme } from "../../constants/theme";

export type ChartPoint = {
  /** Short x-axis label (e.g. "6/11"). */
  label: string;
  value: number;
};

type Props = {
  points: ChartPoint[];
  height?: number;
  /** Appended to y-axis labels (e.g. " lb"). */
  valueSuffix?: string;
};

const PADDING_TOP = 14;
const PADDING_BOTTOM = 24;
const PADDING_LEFT = 44;
const PADDING_RIGHT = 14;

/** Line chart for per-session values over time. Scales to its container width. */
export default function SessionLineChart({ points, height = 180, valueSuffix = "" }: Props) {
  const t = useTheme();
  const [width, setWidth] = useState(0);

  const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;

  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const x = (index: number): number =>
    points.length === 1
      ? PADDING_LEFT + plotWidth / 2
      : PADDING_LEFT + (index / (points.length - 1)) * plotWidth;
  const y = (value: number): number =>
    PADDING_TOP + (1 - (value - min) / range) * plotHeight;

  const polylinePoints = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const formatValue = (value: number): string =>
    `${Math.round(value * 10) / 10}${valueSuffix}`;

  return (
    <View style={styles.container} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && points.length > 0 ? (
        <Svg width={width} height={height}>
          {[0, 0.5, 1].map((fraction) => {
            const gridY = PADDING_TOP + fraction * plotHeight;
            return (
              <Line
                key={fraction}
                x1={PADDING_LEFT}
                y1={gridY}
                x2={width - PADDING_RIGHT}
                y2={gridY}
                stroke={t.border}
                strokeWidth={StyleSheet.hairlineWidth}
              />
            );
          })}

          <SvgText x={PADDING_LEFT - 6} y={PADDING_TOP + 4} fill={t.textMuted} fontSize={10} textAnchor="end">
            {formatValue(max)}
          </SvgText>
          <SvgText
            x={PADDING_LEFT - 6}
            y={PADDING_TOP + plotHeight + 4}
            fill={t.textMuted}
            fontSize={10}
            textAnchor="end"
          >
            {formatValue(min)}
          </SvgText>

          {points.length > 1 ? (
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke={t.primary}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {points.map((p, i) => (
            <Circle key={i} cx={x(i)} cy={y(p.value)} r={4} fill={t.primary} />
          ))}

          <SvgText
            x={PADDING_LEFT}
            y={height - 6}
            fill={t.textMuted}
            fontSize={10}
            textAnchor="start"
          >
            {points[0].label}
          </SvgText>
          {points.length > 1 ? (
            <SvgText
              x={width - PADDING_RIGHT}
              y={height - 6}
              fill={t.textMuted}
              fontSize={10}
              textAnchor="end"
            >
              {points[points.length - 1].label}
            </SvgText>
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
