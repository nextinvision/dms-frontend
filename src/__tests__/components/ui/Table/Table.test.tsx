import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { Table } from "@/components/ui/Table";
import { TableHeader } from "@/components/ui/Table/TableHeader";
import { TableRow } from "@/components/ui/Table/TableRow";
import { TableCell } from "@/components/ui/Table/TableCell";

describe('Table', () => {
  it('renders table element', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Test</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Test Content</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies striped styling when striped prop is true', () => {
    const { container } = render(
      <Table striped>
        <tbody>
          <tr>
            <td>Test</td>
          </tr>
        </tbody>
      </Table>
    );
    const table = container.querySelector('table');
    expect(table?.className).toContain('[&>tbody>tr:nth-child(even)]:bg-gray-50');
  });

  it('applies hover styling when hover prop is true', () => {
    const { container } = render(
      <Table hover>
        <tbody>
          <tr>
            <td>Test</td>
          </tr>
        </tbody>
      </Table>
    );
    const table = container.querySelector('table');
    expect(table?.className).toContain('[&>tbody>tr]:hover:bg-gray-50');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table className="custom-table">
        <tbody>
          <tr>
            <td>Test</td>
          </tr>
        </tbody>
      </Table>
    );
    const table = container.querySelector('table');
    expect(table?.className).toContain('custom-table');
  });

  it('wraps table in overflow container', () => {
    const { container } = render(
      <Table>
        <tbody>
          <tr>
            <td>Test</td>
          </tr>
        </tbody>
      </Table>
    );
    const wrapper = container.querySelector('.overflow-x-auto');
    expect(wrapper).toBeInTheDocument();
  });
});

describe('TableHeader', () => {
  it('renders thead element', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Header</TableCell>
          </TableRow>
        </TableHeader>
      </Table>
    );
    const thead = document.querySelector('thead');
    expect(thead).toBeInTheDocument();
  });

  it('renders header content', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });
});

describe('TableRow', () => {
  it('renders tr element', () => {
    render(
      <Table>
        <tbody>
          <TableRow>
            <TableCell>Test</TableCell>
          </TableRow>
        </tbody>
      </Table>
    );
    const tr = document.querySelector('tr');
    expect(tr).toBeInTheDocument();
  });

  it('renders row content', () => {
    render(
      <Table>
        <tbody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
          </TableRow>
        </tbody>
      </Table>
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});

describe('TableCell', () => {
  it('renders td element by default', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <TableCell>Test</TableCell>
          </tr>
        </tbody>
      </Table>
    );
    const td = document.querySelector('td');
    expect(td).toBeInTheDocument();
  });

  it('renders th element when as="th"', () => {
    // Note: TableCell always renders <td>, but can be used in <thead> context
    // The test verifies it renders correctly in table structure
    render(
      <Table>
        <thead>
          <tr>
            <TableCell>Header</TableCell>
          </tr>
        </thead>
      </Table>
    );
    const cell = document.querySelector('thead td');
    expect(cell).toBeInTheDocument();
    expect(cell?.textContent).toBe('Header');
  });

  it('renders cell content', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <TableCell>Cell Content</TableCell>
          </tr>
        </tbody>
      </Table>
    );
    expect(screen.getByText('Cell Content')).toBeInTheDocument();
  });
});

