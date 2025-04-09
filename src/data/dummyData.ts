export const mockChartCode = `
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
      <Line type="monotone" dataKey="extraValue" stroke="#82ca9d" />
    </LineChart>
  </ResponsiveContainer>
`;

export const chartData = [
  { name: 'Jan', value: 400, extraValue: 300 },
  { name: 'Feb', value: 300, extraValue: 400 },
  { name: 'Mar', value: 600, extraValue: 500 },
  { name: 'Apr', value: 800, extraValue: 700 },
  { name: 'May', value: 500, extraValue: 900 }
];
