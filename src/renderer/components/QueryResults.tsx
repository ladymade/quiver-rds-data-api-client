import type React from "react";
import type { ExecuteQueryData, ExecuteQueryValue } from "../../shared/types/ipc";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type QueryResultsProps = {
  result: ExecuteQueryData | null;
  errorMessage: string | null;
  isRunningQuery: boolean;
  pageSize: number;
  currentPage: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

function formatValue(value: ExecuteQueryValue | undefined): string {
  if (value == null) {
    return "NULL";
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function formatColumnTypeLabel(column: { typeName?: string; type?: number }): string {
  if (column.typeName != null && column.typeName.trim().length > 0) {
    return column.typeName.toLowerCase();
  }

  if (typeof column.type === "number") {
    return `type:${column.type}`;
  }

  return "";
}

export function QueryResults({
  result,
  errorMessage,
  isRunningQuery,
  pageSize,
  currentPage,
  onPreviousPage,
  onNextPage,
}: QueryResultsProps): React.JSX.Element {
  const records = result?.records ?? [];
  const columns = result?.columns ?? [];
  const numberOfRecordsUpdated = result?.numberOfRecordsUpdated;

  const maxRowLength = records.reduce((max, row) => Math.max(max, row.length), 0);
  const columnCount = Math.max(columns.length, maxRowLength);

  const effectiveColumns = Array.from({ length: columnCount }, (_unused, index) => {
    const existing = columns[index];
    if (existing != null) {
      return existing;
    }

    return {
      name: `column_${index + 1}`,
      typeName: undefined,
      nullable: undefined,
    };
  });

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const pageStartIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = records.slice(pageStartIndex, pageStartIndex + pageSize);
  const hasQueryRows = result != null && records.length > 0;

  const hasTableData = effectiveColumns.length > 0 && records.length > 0;
  const hasDmlResult =
    !hasTableData && numberOfRecordsUpdated != null && Number.isFinite(numberOfRecordsUpdated);

  return (
    <section
      data-testid="query-results"
      className="flex h-full min-h-0 flex-col overflow-hidden border-t border-[#bac9cc] bg-white"
      aria-label="Query results"
    >
      <header className="sticky top-0 z-20 flex h-10 shrink-0 items-center justify-between border-b border-[#d7e3e6] bg-[#edf4f6] px-4">
        <div className="flex items-center gap-3">
          <h3 className="stitch-label-md text-[#4f5d60]">Results</h3>
        </div>
        {hasQueryRows ? (
          <span data-testid="row-count" className="stitch-body-sm text-[#607276]">
            {records.length} rows returned
          </span>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
        {isRunningQuery ? (
          <p className="stitch-body-sm text-muted-foreground">Running query...</p>
        ) : errorMessage != null ? (
          <p className="stitch-body-sm text-red-600">{errorMessage}</p>
        ) : result == null ? (
          <p className="stitch-body-sm text-muted-foreground">Run Query to see results.</p>
        ) : hasDmlResult ? (
          <p data-testid="dml-result-message" className="stitch-body-sm text-muted-foreground">
            Rows affected: {numberOfRecordsUpdated}
          </p>
        ) : hasTableData ? (
          <>
            <div className="min-h-0 flex-1 overflow-auto rounded border border-[#d7e3e6] bg-white">
              <Table className="stitch-body-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="stitch-label-md sticky top-0 z-[1] h-auto w-10 border-r border-[#d7e3e6] bg-[#edf4f6] px-2 py-2 text-center text-[#607276]">
                      #
                    </TableHead>
                    {effectiveColumns.map((column, index) => (
                      <TableHead
                        className="stitch-label-md sticky top-0 z-[1] h-auto border-r border-[#d7e3e6] bg-[#edf4f6] px-3 py-2 text-[#607276]"
                        key={`${column.name}-${index}`}
                      >
                        <span className="text-[#1d2527]">{column.name}</span>
                        {formatColumnTypeLabel(column).length > 0 ? (
                          <span className="ml-1 font-mono text-[10px] leading-4 text-[#607276]">
                            {formatColumnTypeLabel(column)}
                          </span>
                        ) : null}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((row, rowIndex) => (
                    <TableRow
                      key={`row-${pageStartIndex + rowIndex}`}
                      className="odd:bg-white even:bg-[#f8fbfd] hover:bg-[#edf4f6]"
                    >
                      <TableCell className="stitch-code-md border-r border-[#d7e3e6] px-2 py-1.5 text-center text-[#8ba0a5]">
                        {pageStartIndex + rowIndex + 1}
                      </TableCell>
                      {effectiveColumns.map((_column, columnIndex) => (
                        <TableCell
                          className="stitch-code-md border-r border-[#d7e3e6] px-3 py-1.5"
                          key={`cell-${pageStartIndex + rowIndex}-${columnIndex}`}
                        >
                          {formatValue(row[columnIndex])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#d7e3e6] px-1 pt-2">
              <Button
                disabled={currentPage <= 1}
                onClick={onPreviousPage}
                size="xs"
                type="button"
                variant="outline"
                className="h-7 rounded border border-[#bac9cc] bg-white px-2 text-[11px]"
              >
                Prev
              </Button>
              <span className="stitch-body-sm text-[#607276]">
                <span data-testid="page-info">
                  Page {currentPage} / {totalPages}
                </span>
              </span>
              <Button
                disabled={currentPage >= totalPages}
                onClick={onNextPage}
                size="xs"
                type="button"
                variant="outline"
                className="h-7 rounded border border-[#bac9cc] bg-white px-2 text-[11px]"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <p className="stitch-body-sm text-muted-foreground">No rows returned.</p>
        )}
      </div>
    </section>
  );
}
