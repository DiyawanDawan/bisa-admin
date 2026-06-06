import React, { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children?: ReactNode;
  isHeader?: boolean;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <table className={twMerge("min-w-full", className)}>{children}</table>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead
      className={twMerge(
        "bg-gray-50 dark:bg-white/[0.02]",
        className,
      )}
    >
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody
      className={twMerge("divide-y divide-gray-100 dark:divide-gray-800", className)}
    >
      {children}
    </tbody>
  );
};

const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return (
    <tr
      className={twMerge(
        "transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.02]",
        className,
      )}
    >
      {children}
    </tr>
  );
};

const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
}) => {
  const CellTag = isHeader ? "th" : "td";
  const defaultClass = isHeader
    ? "px-4 py-3 text-left text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
    : "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";
  return (
    <CellTag className={twMerge(defaultClass, className)}>{children}</CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
