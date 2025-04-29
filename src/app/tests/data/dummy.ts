// pages/dummy-table-demo.tsx
import { RowData } from '@tanstack/react-table';
import type { NextPage } from 'next';
import { useState } from 'react';

// Dummy JSON data
export const dummyJsonData: RowData[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    status: 'Active',
    department: 'Engineering',
    joinDate: '2023-05-15',
    salary: 85000,
    isManager: true
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'Active',
    department: 'Marketing',
    joinDate: '2023-07-22',
    salary: 75000,
    isManager: false
  },
  {
    id: 3,
    name: 'Robert Johnson',
    email: 'robert@example.com',
    status: 'On Leave',
    department: 'Finance',
    joinDate: '2022-11-08',
    salary: 92000,
    isManager: true
  },
  {
    id: 4,
    name: 'Lisa Brown',
    email: 'lisa@example.com',
    status: 'Active',
    department: 'Human Resources',
    joinDate: '2023-02-14',
    salary: 78000,
    isManager: false
  },
  {
    id: 5,
    name: 'Michael Wilson',
    email: 'michael@example.com',
    status: 'Inactive',
    department: 'Product',
    joinDate: '2022-09-30',
    salary: 88000,
    isManager: false
  },
  {
    id: 6,
    name: 'Sarah Davis',
    email: 'sarah@example.com',
    status: 'Active',
    department: 'Engineering',
    joinDate: '2023-01-05',
    salary: 86000,
    isManager: false
  },
  {
    id: 7,
    name: 'Thomas Miller',
    email: 'thomas@example.com',
    status: 'Active',
    department: 'Sales',
    joinDate: '2022-08-17',
    salary: 95000,
    isManager: true
  }
];

// Dummy HTML table data
export const dummyHtmlData = `
<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Product Name</th>
      <th>Category</th>
      <th>Price</th>
      <th>Stock</th>
      <th>Last Updated</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>101</td>
      <td>Laptop Pro X</td>
      <td>Electronics</td>
      <td>$1299.99</td>
      <td>45</td>
      <td>2025-04-10</td>
    </tr>
    <tr>
      <td>102</td>
      <td>Wireless Headphones</td>
      <td>Audio</td>
      <td>$199.99</td>
      <td>128</td>
      <td>2025-04-15</td>
    </tr>
    <tr>
      <td>103</td>
      <td>Ergonomic Mouse</td>
      <td>Accessories</td>
      <td>$59.99</td>
      <td>87</td>
      <td>2025-04-18</td>
    </tr>
    <tr>
      <td>104</td>
      <td>Gaming Monitor 27"</td>
      <td>Electronics</td>
      <td>$349.99</td>
      <td>23</td>
      <td>2025-04-22</td>
    </tr>
    <tr>
      <td>105</td>
      <td>Mechanical Keyboard</td>
      <td>Accessories</td>
      <td>$129.99</td>
      <td>65</td>
      <td>2025-04-25</td>
    </tr>
  </tbody>
</table>`
