import { D1Database } from "@cloudflare/workers-types";
import {
  createAdapterFactory,
  type CleanedWhere,
  type CustomAdapter,
  type DBAdapterDebugLogOption,
} from "better-auth/adapters";

interface CloesceD1AdapterConfig {
  debugLogs?: DBAdapterDebugLogOption;
}

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function applyWhere(where?: CleanedWhere[]): {
  sql: string;
  params: unknown[];
} {
  if (!where || where.length === 0) {
    return { sql: "", params: [] };
  }

  const parts: string[] = [];
  const params: unknown[] = [];

  where.forEach((clause, index) => {
    const connector = index === 0 ? "" : ` ${clause.connector} `;
    const field = quoteIdentifier(clause.field);

    switch (clause.operator) {
      case "eq": {
        if (clause.value === null) {
          parts.push(`${connector}${field} IS NULL`);
        } else {
          parts.push(`${connector}${field} = ?`);
          params.push(clause.value);
        }
        break;
      }
      case "ne": {
        if (clause.value === null) {
          parts.push(`${connector}${field} IS NOT NULL`);
        } else {
          parts.push(`${connector}${field} != ?`);
          params.push(clause.value);
        }
        break;
      }
      case "gt":
      case "gte":
      case "lt":
      case "lte": {
        const opMap = {
          gt: ">",
          gte: ">=",
          lt: "<",
          lte: "<=",
        } as const;
        parts.push(`${connector}${field} ${opMap[clause.operator]} ?`);
        params.push(clause.value);
        break;
      }
      case "in":
      case "not_in": {
        if (!Array.isArray(clause.value)) {
          throw new Error(`Operator ${clause.operator} requires an array value`);
        }
        if (clause.value.length === 0) {
          parts.push(clause.operator === "in" ? `${connector}1 = 0` : `${connector}1 = 1`);
          break;
        }
        const placeholders = clause.value.map(() => "?").join(", ");
        parts.push(
          `${connector}${field} ${clause.operator === "in" ? "IN" : "NOT IN"} (${placeholders})`,
        );
        params.push(...clause.value);
        break;
      }
      case "contains": {
        parts.push(`${connector}${field} LIKE '%' || ? || '%'`);
        params.push(clause.value);
        break;
      }
      case "starts_with": {
        parts.push(`${connector}${field} LIKE ? || '%'`);
        params.push(clause.value);
        break;
      }
      case "ends_with": {
        parts.push(`${connector}${field} LIKE '%' || ?`);
        params.push(clause.value);
        break;
      }
      default: {
        throw new Error(`Unsupported operator: ${clause.operator}`);
      }
    }
  });

  return {
    sql: ` WHERE ${parts.join("")}`,
    params,
  };
}

function bindParams<T extends { bind: (...values: unknown[]) => T }>(
  statement: T,
  params: unknown[],
): T {
  if (params.length === 0) {
    return statement;
  }
  return statement.bind(...params);
}

export const cloesceBetterAuthAdapter = (
  db: D1Database,
  config: CloesceD1AdapterConfig = {},
) =>
  createAdapterFactory({
    config: {
      adapterId: "cloesce-d1",
      adapterName: "Cloesce D1 Adapter",
      usePlural: false,
      debugLogs: config.debugLogs ?? false,
      supportsJSON: false,
      supportsDates: true,
      supportsBooleans: false,
      supportsArrays: false,
      transaction: false,
    },
    adapter: ({ getFieldName }) => {
      return {
        create: async <T extends Record<string, any>>({
          model,
          data,
        }: {
          model: string;
          data: T;
          select?: string[];
        }) => {
          const table = quoteIdentifier(model);
          const record = data as Record<string, unknown>;
          const keys = Object.keys(record);

          const sql =
            keys.length > 0
              ? `INSERT INTO ${table} (${keys.map(quoteIdentifier).join(", ")}) VALUES (${keys
                  .map(() => "?")
                  .join(", ")}) RETURNING *`
              : `INSERT INTO ${table} DEFAULT VALUES RETURNING *`;

          const params = keys.map((key) => record[key]);
          const result = await bindParams(db.prepare(sql), params).first<T>();
          if (!result) {
            throw new Error(`Insert failed for model ${model}`);
          }
          return result;
        },

        findOne: async <T>({
          model,
          where,
          select,
        }: {
          model: string;
          where: CleanedWhere[];
          select?: string[];
        }) => {
          const table = quoteIdentifier(model);
          const { sql: whereSql, params } = applyWhere(where);
          const columns =
            select && select.length > 0 ? select.map(quoteIdentifier).join(", ") : "*";

          const query = `SELECT ${columns} FROM ${table}${whereSql} LIMIT 1`;
          return await bindParams(db.prepare(query), params).first<T>();
        },

        findMany: async <T>({
          model,
          where,
          limit,
          select,
          sortBy,
          offset,
        }: {
          model: string;
          where?: CleanedWhere[];
          limit: number;
          select?: string[];
          sortBy?: { field: string; direction: "asc" | "desc" };
          offset?: number;
        }) => {
          const table = quoteIdentifier(model);
          const { sql: whereSql, params } = applyWhere(where);
          const columns =
            select && select.length > 0 ? select.map(quoteIdentifier).join(", ") : "*";

          const sortSql = sortBy
            ? ` ORDER BY ${quoteIdentifier(getFieldName({ model, field: sortBy.field }))} ${sortBy.direction.toUpperCase()}`
            : "";
          const limitSql = typeof limit === "number" ? " LIMIT ?" : "";
          const offsetSql = typeof offset === "number" ? " OFFSET ?" : "";

          const query = `SELECT ${columns} FROM ${table}${whereSql}${sortSql}${limitSql}${offsetSql}`;

          const queryParams = [...params];
          if (typeof limit === "number") {
            queryParams.push(limit);
          }
          if (typeof offset === "number") {
            queryParams.push(offset);
          }

          const result = await bindParams(db.prepare(query), queryParams).all<T>();
          return result.results ?? [];
        },

        update: async <T>({
          model,
          where,
          update,
        }: {
          model: string;
          where: CleanedWhere[];
          update: T;
        }) => {
          const table = quoteIdentifier(model);
          const updateRecord = update as Record<string, unknown>;
          const keys = Object.keys(updateRecord);
          if (keys.length === 0) {
            return null;
          }

          const setSql = keys.map((key) => `${quoteIdentifier(key)} = ?`).join(", ");
          const { sql: whereSql, params: whereParams } = applyWhere(where);
          const params = [
            ...keys.map((key) => updateRecord[key]),
            ...whereParams,
          ];

          const query = `UPDATE ${table} SET ${setSql}${whereSql} RETURNING *`;
          return await bindParams(db.prepare(query), params).first<T>();
        },

        updateMany: async ({
          model,
          where,
          update,
        }: {
          model: string;
          where: CleanedWhere[];
          update: Record<string, unknown>;
        }) => {
          const table = quoteIdentifier(model);
          const updateRecord = update as Record<string, unknown>;
          const keys = Object.keys(updateRecord);
          if (keys.length === 0) {
            return 0;
          }

          const setSql = keys.map((key) => `${quoteIdentifier(key)} = ?`).join(", ");
          const { sql: whereSql, params: whereParams } = applyWhere(where);
          const params = [
            ...keys.map((key) => updateRecord[key]),
            ...whereParams,
          ];

          const query = `UPDATE ${table} SET ${setSql}${whereSql}`;
          const result = await bindParams(db.prepare(query), params).run();
          return result.meta.changes ?? 0;
        },

        delete: async ({
          model,
          where,
        }: {
          model: string;
          where: CleanedWhere[];
        }) => {
          const table = quoteIdentifier(model);
          const { sql: whereSql, params } = applyWhere(where);
          await bindParams(db.prepare(`DELETE FROM ${table}${whereSql}`), params).run();
        },

        deleteMany: async ({
          model,
          where,
        }: {
          model: string;
          where: CleanedWhere[];
        }) => {
          const table = quoteIdentifier(model);
          const { sql: whereSql, params } = applyWhere(where);
          const result = await bindParams(db.prepare(`DELETE FROM ${table}${whereSql}`), params).run();
          return result.meta.changes ?? 0;
        },

        count: async ({
          model,
          where,
        }: {
          model: string;
          where?: CleanedWhere[];
        }) => {
          const table = quoteIdentifier(model);
          const { sql: whereSql, params } = applyWhere(where);
          const query = `SELECT COUNT(*) as total FROM ${table}${whereSql}`;
          const result = await bindParams(db.prepare(query), params).first<{ total: number | string }>();
          return Number(result?.total ?? 0);
        },
      } satisfies CustomAdapter;
    },
  });
