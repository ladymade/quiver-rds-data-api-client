import Editor from "@monaco-editor/react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Database,
  Hash,
  KeyRound,
  RefreshCw,
  Table2,
  Tag,
} from "lucide-react";
import type { IDisposable, editor as MonacoEditor } from "monaco-editor";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  ConnectionProfileDto,
  ExecuteQueryData,
  TableColumnDto,
} from "../../shared/types/ipc";
import { useErrorDialog } from "../hooks/useErrorDialog";
import { useLoadingOverlay } from "../hooks/useLoadingOverlay";
import { useUnexpectedErrorHandler } from "../hooks/useUnexpectedErrorHandler";
import { QueryResults } from "./QueryResults";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type QueryEditorPageProps = {
  profiles: ConnectionProfileDto[];
  selectedProfile: ConnectionProfileDto | null;
  selectedProfileName: string;
  onSelectedProfileNameChange: (profileName: string) => void;
  onCreateProfile: () => void;
  onEditProfile: () => void;
};

type QueryEditorSqlEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onRunQuery: () => void;
  tableEntries: QueryEditorTableEntry[];
  ensureTableColumnsLoaded: (tableName: string) => Promise<TableColumnDto[]>;
};

type SqlCompletionContext =
  | {
      kind: "table";
      prefix: string;
    }
  | {
      kind: "column";
      qualifier: string;
      prefix: string;
    }
  | {
      kind: "none";
    };

type SqlKeywordKind = "Command" | "Clause" | "Join" | "Operator" | "Modifier";

type SqlKeywordDefinition = {
  keyword: string;
  kind: SqlKeywordKind;
};

const SQL_KEYWORDS: SqlKeywordDefinition[] = [
  { keyword: "SELECT", kind: "Command" },
  { keyword: "INSERT", kind: "Command" },
  { keyword: "UPDATE", kind: "Command" },
  { keyword: "DELETE", kind: "Command" },
  { keyword: "FROM", kind: "Clause" },
  { keyword: "WHERE", kind: "Clause" },
  { keyword: "GROUP BY", kind: "Clause" },
  { keyword: "ORDER BY", kind: "Clause" },
  { keyword: "HAVING", kind: "Clause" },
  { keyword: "LIMIT", kind: "Clause" },
  { keyword: "OFFSET", kind: "Clause" },
  { keyword: "JOIN", kind: "Join" },
  { keyword: "LEFT JOIN", kind: "Join" },
  { keyword: "RIGHT JOIN", kind: "Join" },
  { keyword: "INNER JOIN", kind: "Join" },
  { keyword: "ON", kind: "Join" },
  { keyword: "AS", kind: "Modifier" },
  { keyword: "DISTINCT", kind: "Modifier" },
  { keyword: "AND", kind: "Operator" },
  { keyword: "OR", kind: "Operator" },
  { keyword: "NOT", kind: "Operator" },
  { keyword: "IN", kind: "Operator" },
  { keyword: "LIKE", kind: "Operator" },
  { keyword: "BETWEEN", kind: "Operator" },
  { keyword: "IS NULL", kind: "Operator" },
  { keyword: "IS NOT NULL", kind: "Operator" },
];

const SQL_ALIAS_STOP_WORDS = new Set([
  "WHERE",
  "GROUP",
  "ORDER",
  "LIMIT",
  "LEFT",
  "RIGHT",
  "INNER",
  "FULL",
  "CROSS",
  "JOIN",
  "ON",
]);

function extractSqlCompletionContext(sqlUntilCursor: string): SqlCompletionContext {
  const columnMatch = /([a-zA-Z_][a-zA-Z0-9_$]*)\.\s*([a-zA-Z_][a-zA-Z0-9_$]*)?$/i.exec(
    sqlUntilCursor
  );
  if (columnMatch != null) {
    return {
      kind: "column",
      qualifier: columnMatch[1] ?? "",
      prefix: columnMatch[2] ?? "",
    };
  }

  const tableMatch = /\b(from|join|update|into)\s+([a-zA-Z_][a-zA-Z0-9_$]*)?$/i.exec(
    sqlUntilCursor
  );
  if (tableMatch != null) {
    return {
      kind: "table",
      prefix: tableMatch[2] ?? "",
    };
  }

  return { kind: "none" };
}

function buildAliasMap(sqlUntilCursor: string): Map<string, string> {
  const aliasMap = new Map<string, string>();
  const tableAliasRegex =
    /\b(?:from|join)\s+([a-zA-Z_][a-zA-Z0-9_$]*)(?:\s+(?:as\s+)?([a-zA-Z_][a-zA-Z0-9_$]*))?/gi;

  for (const match of sqlUntilCursor.matchAll(tableAliasRegex)) {
    const tableName = (match[1] ?? "").trim();
    const alias = (match[2] ?? "").trim();
    if (tableName.length === 0) {
      continue;
    }

    aliasMap.set(tableName.toLowerCase(), tableName);
    if (alias.length > 0 && !SQL_ALIAS_STOP_WORDS.has(alias.toUpperCase())) {
      aliasMap.set(alias.toLowerCase(), tableName);
    }
  }

  return aliasMap;
}

function buildSqlKeywordSuggestions(
  monaco: typeof import("monaco-editor"),
  range: {
    startLineNumber: number;
    endLineNumber: number;
    startColumn: number;
    endColumn: number;
  },
  prefix: string,
  priority: string
): Array<{
  label: string;
  kind: number;
  insertText: string;
  detail: string;
  range: {
    startLineNumber: number;
    endLineNumber: number;
    startColumn: number;
    endColumn: number;
  };
  sortText: string;
}> {
  const normalizedPrefix = prefix.toLowerCase();

  return SQL_KEYWORDS.filter(({ keyword }) =>
    keyword.toLowerCase().startsWith(normalizedPrefix)
  ).map(({ keyword, kind }) => ({
    label: keyword,
    kind: monaco.languages.CompletionItemKind.Keyword,
    insertText: keyword,
    detail: `SQL ${kind}`,
    range,
    sortText: `${priority}_${keyword.toLowerCase()}`,
  }));
}

function QueryEditorSqlEditor({
  value,
  onChange,
  onRunQuery,
  tableEntries,
  ensureTableColumnsLoaded,
}: QueryEditorSqlEditorProps): React.JSX.Element {
  const completionProviderRef = useRef<IDisposable | null>(null);
  const onRunQueryRef = useRef(onRunQuery);
  const tableEntriesRef = useRef(tableEntries);
  const ensureTableColumnsLoadedRef = useRef(ensureTableColumnsLoaded);

  useEffect(() => {
    onRunQueryRef.current = onRunQuery;
  }, [onRunQuery]);

  useEffect(() => {
    tableEntriesRef.current = tableEntries;
  }, [tableEntries]);

  useEffect(() => {
    ensureTableColumnsLoadedRef.current = ensureTableColumnsLoaded;
  }, [ensureTableColumnsLoaded]);

  useEffect(() => {
    return () => {
      completionProviderRef.current?.dispose();
      completionProviderRef.current = null;
    };
  }, []);

  return (
    <section className="flex h-full min-h-[10rem] flex-col border-b border-[#bac9cc] bg-white">
      <div className="min-h-[16rem] flex-1 bg-white">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={value}
          onChange={(nextValue) => onChange(nextValue ?? "")}
          onMount={(
            editor: MonacoEditor.IStandaloneCodeEditor,
            monaco: typeof import("monaco-editor")
          ) => {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
              onRunQueryRef.current();
            });

            completionProviderRef.current?.dispose();
            completionProviderRef.current = monaco.languages.registerCompletionItemProvider("sql", {
              triggerCharacters: [".", " "],
              provideCompletionItems: async (model, position) => {
                const sqlUntilCursor = model.getValueInRange({
                  startLineNumber: 1,
                  startColumn: 1,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                });
                const completionContext = extractSqlCompletionContext(sqlUntilCursor);

                const word = model.getWordUntilPosition(position);
                const range = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: word.startColumn,
                  endColumn: word.endColumn,
                };
                const currentEntries = tableEntriesRef.current;
                const basePrefix =
                  completionContext.kind === "none" ? word.word : completionContext.prefix;
                const normalizedPrefix = basePrefix.toLowerCase();

                if (completionContext.kind === "none") {
                  const suggestions = buildSqlKeywordSuggestions(
                    monaco,
                    range,
                    normalizedPrefix,
                    "2"
                  );
                  return { suggestions };
                }

                if (completionContext.kind === "table") {
                  const tableSuggestions = currentEntries
                    .filter((entry) => entry.name.toLowerCase().startsWith(normalizedPrefix))
                    .map((entry) => ({
                      label: entry.name,
                      kind: monaco.languages.CompletionItemKind.Class,
                      insertText: entry.name,
                      range,
                      sortText: `0_${entry.name.toLowerCase()}`,
                    }));
                  const keywordSuggestions = buildSqlKeywordSuggestions(
                    monaco,
                    range,
                    normalizedPrefix,
                    "2"
                  );
                  const suggestions = [...tableSuggestions, ...keywordSuggestions];
                  return { suggestions };
                }

                const aliasMap = buildAliasMap(sqlUntilCursor);
                const resolvedTableName =
                  aliasMap.get(completionContext.qualifier.toLowerCase()) ??
                  completionContext.qualifier;
                const tableEntry = currentEntries.find(
                  (entry) => entry.name.toLowerCase() === resolvedTableName.toLowerCase()
                );
                if (tableEntry == null) {
                  const suggestions = buildSqlKeywordSuggestions(
                    monaco,
                    range,
                    normalizedPrefix,
                    "2"
                  );
                  return { suggestions };
                }

                let columns = tableEntry.columns;
                if (columns.length === 0) {
                  columns = await ensureTableColumnsLoadedRef.current(tableEntry.name);
                }

                const columnSuggestions = columns
                  .filter((column) => column.name.toLowerCase().startsWith(normalizedPrefix))
                  .map((column) => ({
                    label: column.name,
                    kind: monaco.languages.CompletionItemKind.Field,
                    insertText: column.name,
                    detail: column.typeName,
                    range,
                    sortText: `1_${column.name.toLowerCase()}`,
                  }));
                const keywordSuggestions = buildSqlKeywordSuggestions(
                  monaco,
                  range,
                  normalizedPrefix,
                  "2"
                );
                const suggestions = [...columnSuggestions, ...keywordSuggestions];
                return { suggestions };
              },
            });
          }}
          theme="vs"
          options={{
            minimap: { enabled: false },
            fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
            lineHeight: 20,
            padding: { top: 14, bottom: 14 },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </section>
  );
}

type QueryEditorTableEntry = {
  name: string;
  columns: TableColumnDto[];
  isOpen: boolean;
  isLoadingColumns: boolean;
  errorMessage?: string;
};

type QueryEditorTableListProps = {
  databaseName: string;
  tableEntries: QueryEditorTableEntry[];
  isLoadingTables: boolean;
  onRefreshSchema: () => void;
  onToggleTable: (tableName: string) => void;
};

function ColumnTypeIcon({ typeName }: { typeName?: string }): React.JSX.Element {
  const normalized = typeName?.toLowerCase() ?? "";

  if (normalized.includes("time") || normalized.includes("date")) {
    return <CalendarDays aria-hidden="true" size={12} strokeWidth={2} className="text-slate-400" />;
  }

  if (
    normalized.includes("int") ||
    normalized.includes("decimal") ||
    normalized.includes("numeric") ||
    normalized.includes("double") ||
    normalized.includes("float")
  ) {
    return <Hash aria-hidden="true" size={12} strokeWidth={2} className="text-slate-400" />;
  }

  if (normalized.includes("id") || normalized.includes("uuid")) {
    return <KeyRound aria-hidden="true" size={12} strokeWidth={2} className="text-slate-400" />;
  }

  return <Tag aria-hidden="true" size={12} strokeWidth={2} className="text-slate-400" />;
}

function QueryEditorTableList({
  databaseName,
  tableEntries,
  isLoadingTables,
  onRefreshSchema,
  onToggleTable,
}: QueryEditorTableListProps): React.JSX.Element {
  const { t } = useTranslation();
  const hasTables = tableEntries.length > 0;

  return (
    <section className="flex h-full flex-col bg-[#f9fbff]" aria-label={t("query.databaseTables")}>
      <div className="flex items-center justify-between border-b border-[#d7e3e6] bg-[#edf4f6] px-2 py-1.5">
        <p className="stitch-label-md text-[#4f5d60] uppercase">{t("query.schemaExplorer")}</p>
        <button
          className="rounded p-1 text-[#607276] transition-colors hover:bg-white hover:text-[#006875]"
          type="button"
          aria-label={t("query.refreshSchemaExplorer")}
          disabled={isLoadingTables}
          onClick={onRefreshSchema}
        >
          <RefreshCw aria-hidden="true" size={14} strokeWidth={2} />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <div className="stitch-body-sm rounded px-1 py-0.5 text-[#344043]">
          <div className="flex items-center gap-1.5 rounded px-1 py-1 hover:bg-[#eaf1f4]">
            <ChevronDown aria-hidden="true" size={14} className="text-slate-400" />
            <Database aria-hidden="true" size={14} className="text-slate-500" />
            <span className="font-medium">{databaseName}</span>
          </div>

          <div className="ml-3 border-l border-[#d7e3e6] pl-2">
            <div className="mt-1 flex items-center gap-1.5 rounded px-1 py-1 text-[#344043] hover:bg-[#eaf1f4]">
              <ChevronDown aria-hidden="true" size={14} className="text-slate-400" />
              <Table2 aria-hidden="true" size={14} className="text-[#006875]" />
              <span>{t("query.tables")}</span>
            </div>

            {isLoadingTables ? (
              <p className="stitch-body-sm ml-5 mt-1 text-muted-foreground">
                {t("query.loadingTables")}
              </p>
            ) : !hasTables ? (
              <p className="stitch-body-sm ml-5 mt-1 text-muted-foreground">
                {t("query.noTables")}
              </p>
            ) : (
              <ul className="ml-3 border-l border-[#d7e3e6] pl-2">
                {tableEntries.map((table) => (
                  <li key={table.name} className="mt-0.5">
                    <button
                      type="button"
                      className={`stitch-body-sm flex h-7 w-full items-center gap-1.5 rounded px-1 text-left transition-colors ${
                        table.isOpen
                          ? "bg-[#00e5ff]/15 text-[#006875]"
                          : "text-[#344043] hover:bg-[#eaf1f4]"
                      }`}
                      onClick={() => onToggleTable(table.name)}
                      aria-expanded={table.isOpen}
                    >
                      {table.isOpen ? (
                        <ChevronDown aria-hidden="true" size={14} className="text-slate-400" />
                      ) : (
                        <ChevronRight aria-hidden="true" size={14} className="text-slate-400" />
                      )}
                      <Table2 aria-hidden="true" size={13} className="text-[#607276]" />
                      <span>{table.name}</span>
                    </button>

                    {table.isOpen ? (
                      <ul className="ml-5 py-1">
                        {table.isLoadingColumns ? (
                          <li className="stitch-body-sm text-muted-foreground">
                            {t("query.loadingColumns")}
                          </li>
                        ) : table.errorMessage ? (
                          <li className="stitch-body-sm text-red-600">{table.errorMessage}</li>
                        ) : table.columns.length === 0 ? (
                          <li className="stitch-body-sm text-muted-foreground">
                            {t("query.noColumns")}
                          </li>
                        ) : (
                          table.columns.map((column) => (
                            <li
                              key={`${table.name}.${column.name}`}
                              className="stitch-body-sm flex items-center justify-between gap-2 rounded px-1 py-0.5 text-[#556568] hover:bg-[#eaf1f4]"
                            >
                              <span className="flex items-center gap-1.5">
                                <ColumnTypeIcon typeName={column.typeName} />
                                <span>{column.name}</span>
                              </span>
                              {column.typeName ? (
                                <span className="stitch-code-md text-[10px] text-slate-400">
                                  {column.typeName.toLowerCase()}
                                </span>
                              ) : null}
                            </li>
                          ))
                        )}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function QueryEditorPage({
  profiles,
  selectedProfile,
  selectedProfileName,
  onCreateProfile,
  onEditProfile,
  onSelectedProfileNameChange,
}: QueryEditorPageProps): React.JSX.Element {
  const { t } = useTranslation();
  const { showErrorDialog } = useErrorDialog();
  const { beginLoading } = useLoadingOverlay();
  const { showUnexpectedError } = useUnexpectedErrorHandler();
  const [tableEntries, setTableEntries] = useState<QueryEditorTableEntry[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [sql, setSql] = useState("");
  const [isRunningQuery, setIsRunningQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<ExecuteQueryData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editorPaneHeight, setEditorPaneHeight] = useState<number | null>(null);
  const [isDraggingPaneSplit, setIsDraggingPaneSplit] = useState(false);
  const [tablePaneWidth, setTablePaneWidth] = useState(288);
  const [isDraggingTablePane, setIsDraggingTablePane] = useState(false);
  const [hasUserResizedPane, setHasUserResizedPane] = useState(false);
  const editorResultsPaneRef = useRef<HTMLDivElement | null>(null);
  const queryLayoutRef = useRef<HTMLDivElement | null>(null);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const tableDragStartXRef = useRef(0);
  const tableDragStartWidthRef = useRef(288);
  const tableColumnRequestMapRef = useRef(new Map<string, Promise<TableColumnDto[]>>());
  const pageSize = 50;

  const ensureTableColumnsLoaded = useCallback(
    async (tableName: string): Promise<TableColumnDto[]> => {
      if (!window.quiverApi || selectedProfile == null) {
        return [];
      }

      const normalizedTableName = tableName.toLowerCase();
      const cached = tableEntries.find((entry) => entry.name.toLowerCase() === normalizedTableName);
      if (cached != null && cached.columns.length > 0) {
        return cached.columns;
      }

      const inFlight = tableColumnRequestMapRef.current.get(normalizedTableName);
      if (inFlight != null) {
        return inFlight;
      }

      setTableEntries((previousEntries) =>
        previousEntries.map((entry) =>
          entry.name.toLowerCase() === normalizedTableName
            ? { ...entry, isLoadingColumns: true, errorMessage: undefined }
            : entry
        )
      );

      const request = window.quiverApi
        .listTableColumns({
          profileName: selectedProfile.credentialProfileName,
          region: selectedProfile.region,
          credentialsDirectory: selectedProfile.credentialsDirectory ?? undefined,
          resourceArn: selectedProfile.clusterArn,
          secretArn: selectedProfile.secretArn,
          database: selectedProfile.database,
          tableName,
          engine: selectedProfile.engine,
        })
        .then((result) => {
          if (result.error != null) {
            return [];
          }

          setTableEntries((previousEntries) =>
            previousEntries.map((entry) =>
              entry.name.toLowerCase() === normalizedTableName
                ? {
                    ...entry,
                    columns: result.columns,
                    errorMessage: undefined,
                  }
                : entry
            )
          );

          return result.columns;
        })
        .catch(() => {
          return [];
        })
        .finally(() => {
          tableColumnRequestMapRef.current.delete(normalizedTableName);
          setTableEntries((previousEntries) =>
            previousEntries.map((entry) =>
              entry.name.toLowerCase() === normalizedTableName
                ? {
                    ...entry,
                    isLoadingColumns: false,
                  }
                : entry
            )
          );
        });

      tableColumnRequestMapRef.current.set(normalizedTableName, request);
      return request;
    },
    [selectedProfile, tableEntries]
  );

  const autoExpandResultsPane = (): void => {
    const container = editorResultsPaneRef.current;
    if (container == null) {
      return;
    }

    const minEditorHeight = 160;
    const minResultsHeight = 220;
    const splitterHeight = 8;
    const containerHeight = container.clientHeight;

    const targetResultsHeight = Math.min(380, Math.max(240, Math.round(containerHeight * 0.42)));
    const maxResultsHeight = Math.max(
      minResultsHeight,
      containerHeight - minEditorHeight - splitterHeight
    );
    const nextResultsHeight = Math.min(maxResultsHeight, targetResultsHeight);
    const nextEditorHeight = Math.max(
      minEditorHeight,
      containerHeight - splitterHeight - nextResultsHeight
    );

    setEditorPaneHeight(nextEditorHeight);
  };

  const canRunQuery = selectedProfile != null && sql.trim().length > 0;

  const handleRunQuery = async (): Promise<void> => {
    if (!window.quiverApi || selectedProfile == null || !canRunQuery || isRunningQuery) {
      return;
    }

    setIsRunningQuery(true);
    const stopLoading = beginLoading(t("query.runningOverlay"));

    try {
      const result = await window.quiverApi.executeQuery({
        profileName: selectedProfile.credentialProfileName,
        region: selectedProfile.region,
        credentialsDirectory: selectedProfile.credentialsDirectory ?? undefined,
        resourceArn: selectedProfile.clusterArn,
        secretArn: selectedProfile.secretArn,
        database: selectedProfile.database,
        sql,
      });

      if (!result.success) {
        setQueryResult(null);
        showErrorDialog(
          t("common.executionError"),
          result.error?.message ?? t("query.failedToExecute"),
          result.error?.details
        );
        return;
      }

      setQueryResult(result.data ?? { columns: [], records: [] });
      setCurrentPage(1);
      if (!hasUserResizedPane) {
        window.requestAnimationFrame(() => {
          autoExpandResultsPane();
        });
      }
    } catch (error) {
      setQueryResult(null);
      showUnexpectedError(error, "renderer:execute-query");
    } finally {
      stopLoading();
      setIsRunningQuery(false);
    }
  };

  const refreshSchemaExplorer = useCallback(async (): Promise<void> => {
    if (!window.quiverApi || selectedProfile == null) {
      setTableEntries([]);
      setIsLoadingTables(false);
      return;
    }

    setIsLoadingTables(true);
    setTableEntries([]);
    tableColumnRequestMapRef.current.clear();
    const stopLoading = beginLoading(t("query.loadingTables"));

    try {
      const result = await window.quiverApi.listTables({
        profileName: selectedProfile.credentialProfileName,
        region: selectedProfile.region,
        credentialsDirectory: selectedProfile.credentialsDirectory ?? undefined,
        resourceArn: selectedProfile.clusterArn,
        secretArn: selectedProfile.secretArn,
        database: selectedProfile.database,
        engine: selectedProfile.engine,
      });

      if (result.error != null) {
        showErrorDialog(t("common.executionError"), result.error.message, result.error.details);
        return;
      }

      setTableEntries(
        result.tables.map((tableName) => ({
          name: tableName,
          columns: [],
          isOpen: false,
          isLoadingColumns: false,
        }))
      );
    } catch (error) {
      showUnexpectedError(error, "renderer:list-tables");
    } finally {
      stopLoading();
      setIsLoadingTables(false);
    }
  }, [beginLoading, selectedProfile, showErrorDialog, showUnexpectedError, t]);

  const handleToggleTable = async (tableName: string): Promise<void> => {
    if (!window.quiverApi || selectedProfile == null) {
      return;
    }

    const table = tableEntries.find((entry) => entry.name === tableName);
    if (table == null) {
      return;
    }

    const nextOpenState = !table.isOpen;

    setTableEntries((previousEntries) =>
      previousEntries.map((entry) =>
        entry.name === tableName
          ? { ...entry, isOpen: nextOpenState, errorMessage: undefined }
          : entry
      )
    );

    if (table.isOpen || table.isLoadingColumns || table.columns.length > 0) {
      return;
    }

    setTableEntries((previousEntries) =>
      previousEntries.map((entry) =>
        entry.name === tableName
          ? { ...entry, isLoadingColumns: true, errorMessage: undefined }
          : entry
      )
    );

    const stopLoading = beginLoading(t("query.loadingTableColumns"));

    try {
      const result = await window.quiverApi.listTableColumns({
        profileName: selectedProfile.credentialProfileName,
        region: selectedProfile.region,
        credentialsDirectory: selectedProfile.credentialsDirectory ?? undefined,
        resourceArn: selectedProfile.clusterArn,
        secretArn: selectedProfile.secretArn,
        database: selectedProfile.database,
        tableName,
        engine: selectedProfile.engine,
      });

      if (result.error != null) {
        showErrorDialog(
          t("common.executionError"),
          result.error?.message ?? t("query.failedToLoadColumns"),
          result.error?.details
        );
        setTableEntries((previousEntries) =>
          previousEntries.map((entry) =>
            entry.name === tableName
              ? {
                  ...entry,
                  isLoadingColumns: false,
                  errorMessage: result.error?.message ?? t("query.failedToLoadColumns"),
                }
              : entry
          )
        );
        return;
      }

      setTableEntries((previousEntries) =>
        previousEntries.map((entry) =>
          entry.name === tableName
            ? {
                ...entry,
                columns: result.columns,
                isLoadingColumns: false,
                isOpen: true,
                errorMessage: undefined,
              }
            : entry
        )
      );
    } catch (error) {
      showUnexpectedError(error, `renderer:list-table-columns:${tableName}`);
      setTableEntries((previousEntries) =>
        previousEntries.map((entry) =>
          entry.name === tableName
            ? {
                ...entry,
                isLoadingColumns: false,
                errorMessage: t("common.unexpectedError"),
              }
            : entry
        )
      );
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    void refreshSchemaExplorer();
  }, [refreshSchemaExplorer]);

  useEffect(() => {
    if (selectedProfileName.trim().length === 0) {
      setEditorPaneHeight(null);
      setHasUserResizedPane(false);
      return;
    }

    setEditorPaneHeight(null);
    setHasUserResizedPane(false);
  }, [selectedProfileName]);

  useEffect(() => {
    if (!isDraggingPaneSplit) {
      return;
    }

    const handleMouseMove = (event: MouseEvent): void => {
      const container = editorResultsPaneRef.current;
      if (container == null) {
        return;
      }

      const deltaY = event.clientY - dragStartYRef.current;
      const nextHeight = dragStartHeightRef.current + deltaY;
      const minEditorHeight = 160;
      const minResultsHeight = 220;
      const splitterHeight = 8;
      const maxEditorHeight = Math.max(
        minEditorHeight,
        container.clientHeight - minResultsHeight - splitterHeight
      );

      setEditorPaneHeight(Math.min(maxEditorHeight, Math.max(minEditorHeight, nextHeight)));
    };

    const handleMouseUp = (): void => {
      setIsDraggingPaneSplit(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDraggingPaneSplit]);

  useEffect(() => {
    if (!isDraggingTablePane) {
      return;
    }

    const handleMouseMove = (event: MouseEvent): void => {
      const layout = queryLayoutRef.current;
      if (layout == null) {
        return;
      }

      const deltaX = event.clientX - tableDragStartXRef.current;
      const nextWidth = tableDragStartWidthRef.current + deltaX;
      const minWidth = 220;
      const splitterWidth = 8;
      const minMainWidth = 640;
      const maxWidth = Math.max(minWidth, layout.clientWidth - minMainWidth - splitterWidth);

      setTablePaneWidth(Math.min(maxWidth, Math.max(minWidth, nextWidth)));
    };

    const handleMouseUp = (): void => {
      setIsDraggingTablePane(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDraggingTablePane]);

  if (profiles.length === 0) {
    return (
      <section
        className="flex h-screen min-h-[36rem] items-center justify-center"
        aria-label={t("query.emptyState")}
      >
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-white/80 p-8 text-center">
          <h2 className="text-sm font-semibold">{t("query.noProfiles")}</h2>
          <p className="text-xs text-muted-foreground">{t("query.noProfilesDescription")}</p>
          <Button onClick={onCreateProfile} size="sm" type="button">
            {t("profile.create")}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="flex h-screen min-h-[36rem] w-full bg-[#f3fbfc]"
      aria-label={t("query.layout")}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-[#f3fbfc] px-8">
          <div className="flex items-center gap-2 rounded border border-[#bac9cc] bg-white px-2 py-1.5">
            <Database aria-hidden="true" size={16} className="text-[#607276]" />
            <Select
              onValueChange={(nextProfileName) => {
                onSelectedProfileNameChange(nextProfileName ?? "");
              }}
              value={selectedProfileName}
            >
              <SelectTrigger
                data-testid="query-profile-select"
                className="h-7 w-[220px] border-none bg-transparent px-1 text-[13px] shadow-none focus:ring-0"
                id="query-editor-profile-select"
              >
                <SelectValue placeholder={t("query.selectProfile")} />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.name} value={profile.name}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              data-testid="edit-profile-button"
              onClick={onEditProfile}
              size="sm"
              type="button"
              variant="outline"
              className="h-9 rounded border border-[#bac9cc] bg-white px-4 text-[12px] font-semibold text-[#151d1e] hover:bg-[#e8eff1]"
            >
              {t("profile.edit")}
            </Button>
            <Button
              data-testid="run-query-button"
              disabled={!canRunQuery || isRunningQuery}
              onClick={() => {
                void handleRunQuery();
              }}
              size="sm"
              type="button"
              className="h-9 rounded bg-[#006875] px-6 text-[12px] font-semibold text-white hover:bg-[#004f58]"
            >
              {isRunningQuery ? t("query.running") : t("query.run")}
            </Button>
          </div>
        </header>

        <div ref={queryLayoutRef} className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className="shrink-0 border-r border-[#d7e3e6] bg-[#f9fbff]"
            style={{ width: `${tablePaneWidth}px` }}
          >
            <QueryEditorTableList
              databaseName={selectedProfile?.database ?? t("query.noDatabase")}
              isLoadingTables={isLoadingTables}
              onRefreshSchema={() => {
                void refreshSchemaExplorer();
              }}
              onToggleTable={(tableName) => {
                void handleToggleTable(tableName);
              }}
              tableEntries={tableEntries}
            />
          </aside>

          <button
            aria-label={t("query.resizeTables")}
            type="button"
            onMouseDown={(event) => {
              tableDragStartXRef.current = event.clientX;
              tableDragStartWidthRef.current = tablePaneWidth;
              setIsDraggingTablePane(true);
            }}
            className="relative w-2 shrink-0 cursor-col-resize border-x border-[#d7e3e6] bg-[#edf4f6] hover:bg-[#e4edf0]"
          >
            <span className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9fb0b4]" />
          </button>

          <div ref={editorResultsPaneRef} className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div
              className="min-h-[160px]"
              style={
                editorPaneHeight == null
                  ? { flex: "1 1 58%" }
                  : { height: `${editorPaneHeight}px`, flex: "0 0 auto" }
              }
            >
              <QueryEditorSqlEditor
                value={sql}
                onChange={setSql}
                onRunQuery={() => {
                  void handleRunQuery();
                }}
                tableEntries={tableEntries}
                ensureTableColumnsLoaded={ensureTableColumnsLoaded}
              />
            </div>

            <button
              aria-label={t("query.resizeResults")}
              type="button"
              onMouseDown={(event) => {
                const currentEditorPane = event.currentTarget
                  .previousElementSibling as HTMLElement | null;
                if (currentEditorPane == null) {
                  return;
                }

                dragStartYRef.current = event.clientY;
                dragStartHeightRef.current = currentEditorPane.getBoundingClientRect().height;
                setHasUserResizedPane(true);
                setIsDraggingPaneSplit(true);
              }}
              className="relative h-2 shrink-0 cursor-row-resize border-y border-[#d7e3e6] bg-[#edf4f6] hover:bg-[#e4edf0]"
            >
              <span className="absolute left-1/2 top-1/2 h-1 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9fb0b4]" />
            </button>

            <div className="min-h-[220px] flex-1 overflow-hidden">
              <QueryResults
                currentPage={currentPage}
                errorMessage={null}
                isRunningQuery={isRunningQuery}
                onNextPage={() => {
                  const totalRecords = queryResult?.records.length ?? 0;
                  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
                  setCurrentPage((previousPage) => Math.min(totalPages, previousPage + 1));
                }}
                onPreviousPage={() => {
                  setCurrentPage((previousPage) => Math.max(1, previousPage - 1));
                }}
                pageSize={pageSize}
                result={queryResult}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
