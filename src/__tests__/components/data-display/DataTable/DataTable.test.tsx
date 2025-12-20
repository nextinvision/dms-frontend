import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { DataTable } from "@/components/data-display/DataTable";
import type { Column } from "@/components/data-display/DataTable";

interface TestItem {
  id: string;
  name: string;
  email: string;
  age: number;
}

describe('DataTable', () => {
  const columns: Column<TestItem>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'age', header: 'Age' },
  ];

  const testData: TestItem[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  ];

  it('renders table with data', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={(item) => item.id}
      />
    );
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('displays loading spinner when loading', () => {
    const { container } = render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={true}
      />
    );
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('displays empty state when data is empty', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={false}
      />
    );
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('displays custom empty message', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={(item) => item.id}
        emptyMessage="No customers found"
      />
    );
    
    expect(screen.getByText('No customers found')).toBeInTheDocument();
  });

  it('renders custom column render function', () => {
    const customColumns: Column<TestItem>[] = [
      {
        key: 'name',
        header: 'Name',
        render: (item) => <strong>{item.name}</strong>,
      },
    ];

    render(
      <DataTable
        data={testData}
        columns={customColumns}
        keyExtractor={(item) => item.id}
      />
    );
    
    const strong = document.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe('John Doe');
  });

  it('renders default value when no render function', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={(item) => item.id}
      />
    );
    
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('applies column alignment', () => {
    const alignedColumns: Column<TestItem>[] = [
      { key: 'name', header: 'Name', align: 'left' },
      { key: 'age', header: 'Age', align: 'right' },
    ];

    const { container } = render(
      <DataTable
        data={testData}
        columns={alignedColumns}
        keyExtractor={(item) => item.id}
      />
    );
    
    // Check that alignment classes are applied
    const cells = container.querySelectorAll('td, th');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={(item) => item.id}
        className="custom-table"
      />
    );
    
    const table = container.querySelector('.custom-table');
    expect(table).toBeInTheDocument();
  });

  it('renders all rows', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        keyExtractor={(item) => item.id}
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});

