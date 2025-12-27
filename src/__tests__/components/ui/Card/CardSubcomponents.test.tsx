import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { CardHeader } from "@/components/ui/Card/CardHeader";
import { CardBody } from "@/components/ui/Card/CardBody";
import { CardFooter } from "@/components/ui/Card/CardFooter";

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('applies border styling by default', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const header = container.querySelector('.pb-4');
    expect(header).toBeInTheDocument();
  });

  it('does not apply border when border is false', () => {
    const { container } = render(<CardHeader border={false}>Header</CardHeader>);
    const header = container.querySelector('.pb-4');
    expect(header).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardHeader className="custom-header">Header</CardHeader>);
    const header = container.querySelector('.custom-header');
    expect(header).toBeInTheDocument();
  });

  it('has correct margin bottom', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const header = container.querySelector('.mb-4');
    expect(header).toBeInTheDocument();
  });
});

describe('CardBody', () => {
  it('renders children', () => {
    render(<CardBody>Body Content</CardBody>);
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardBody className="custom-body">Body</CardBody>);
    const body = container.querySelector('.custom-body');
    expect(body).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer Content</CardFooter>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('applies border styling by default', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    const footer = container.querySelector('.pt-4');
    expect(footer).toBeInTheDocument();
  });

  it('does not apply border when border is false', () => {
    const { container } = render(<CardFooter border={false}>Footer</CardFooter>);
    const footer = container.querySelector('.pt-4');
    expect(footer).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardFooter className="custom-footer">Footer</CardFooter>);
    const footer = container.querySelector('.custom-footer');
    expect(footer).toBeInTheDocument();
  });

  it('has correct margin top', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    const footer = container.querySelector('.mt-4');
    expect(footer).toBeInTheDocument();
  });
});

