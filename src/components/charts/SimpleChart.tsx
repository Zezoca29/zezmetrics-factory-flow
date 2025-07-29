import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface SimpleBarChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  height?: number;
  color?: string;
}

export function SimpleBarChart({ data, height = 300, color = "#3B82F6" }: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface SimpleLineChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  height?: number;
  color?: string;
}

export function SimpleLineChart({ data, height = 300, color = "#3B82F6" }: SimpleLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}