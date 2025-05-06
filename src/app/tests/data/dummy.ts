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
  <caption>
    Superheros and sidekicks
  </caption>
  <colgroup>
    <col />
    <col span="2" class="batman" />
    <col span="2" class="flash" />
  </colgroup>
  <tr>
    <td></td>
    <th scope="col">Batman</th>
    <th scope="col">Robin</th>
    <th scope="col">The Flash</th>
    <th scope="col">Kid Flash</th>
  </tr>
  <tr>
    <th scope="row">Skill</th>
    <td>Smarts, strong</td>
    <td>Dex, acrobat</td>
    <td>Super speed</td>
    <td>Super speed</td>
  </tr>
</table>
`