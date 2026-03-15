import { D1Database } from "@cloudflare/workers-types";
import {
  type CleanedWhere,
  type CustomAdapter,
  type DBAdapterDebugLogOption,
  createAdapterFactory,
} from "better-auth/adapters";

interface CloesceD1AdapterConfig {
  debugLogs?: DBAdapterDebugLogOption;
}

const quoteIdentifier = (identifier: string): string => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
};

interface WhereResult {
  params: unknown[];
  sql: string;
}

const ZERO_LENGTH = 0;
const FIRST_INDEX = 0;

const getConnector = (index: number, connector: string): string => {
  if (FIRST_INDEX === index) {
    return "";
  }
  return ` ${connector} `;
};

const applyWhere = (
  where: CleanedWhere[] | undefined,
  getFieldName: (opts: { field: string; model: string }) => string,
  model: string,
): WhereResult => {
  if (!where || ZERO_LENGTH === where.length) {
    return { params: [], sql: "" };
  }

  const parts: string[] = [];
  const params: unknown[] = [];

  where.forEach((clause, index) => {
    const connector = getConnector(index, clause.connector);
    const field = quoteIdentifier(getFieldName({ field: clause.field, model }));

    switch (clause.operator) {
      case "eq": {
        if (null === clause.value) {
          parts.push(`${connector}${field} IS NULL`);
        } else {
          parts.push(`${connector}${field} = ?`);
          params.push(clause.value);
        }
        break;
      }
      case "ne": {
        if (null === clause.value) {
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
        if (ZERO_LENGTH === clause.value.length) {
          if ("in" === clause.operator) {
            parts.push(`${connector}1 = 0`);
          } else {
            parts.push(`${connector}1 = 1`);
          }
          break;
        }
        const placeholders = clause.value.map(() => "?").join(", ");
        let operator = "NOT IN";
        if ("in" === clause.operator) {
          operator = "IN";
        }
        parts.push(`${connector}${field} ${operator} (${placeholders})`);
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
    params,
    sql: ` WHERE ${parts.join("")}`,
  };
};

const normalizeValue = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
};

const bindParams = <T extends { bind: (...values: unknown[]) => T }>(
  statement: T,
  params: unknown[],
): T => {
  if (ZERO_LENGTH === params.length) {
    return statement;
  }
  const normalizedParams = params.map(normalizeValue);
  return statement.bind(...normalizedParams);
};

export const cloesceBetterAuthAdapter = (db: D1Database, config: CloesceD1AdapterConfig = {}) =>
  createAdapterFactory({
    adapter: ({ getFieldName }) => {
      return {
        count: async ({ model, where }: { model: string; where?: CleanedWhere[] }) => {
          const table = quoteIdentifier(model);
          const { sql: whereSql, params } = applyWhere(where, getFieldName, model);
          const query = `SELECT COUNT(*) as total FROM ${table}${whereSql}`;
          const result = await bindParams(db.prepare(query), params).first<{
            total: number | string;
          }>();
          return Number(result?.total ?? ZERO_LENGTH);
        },

        create: async <T extends { [key: string]: unknown }>({
          model,
          data,
        }: {
          model: string;
          data: T;
          select?: string[];
        }) => {
          const table = quoteIdentifier(model);
          const record = data as { [key: string]: unknown };
          const keys = Object.keys(record);

          let sql = `INSERT INTO ${table} DEFAULT VALUES RETURNING *`;
          if (ZERO_LENGTH < keys.length) {
            sql = `INSERT INTO ${table} (${keys.map((key) => quoteIdentifier(getFieldName({ field: key, model }))).join(", ")}) VALUES (${keys
              .map(() => "?")
              .join(", ")}) RETURNING *`;
          }

          const params = keys.map((key) => record[key]);
          const result = await bindParams(db.prepare(sql), params).first<T>();
          if (!result) {
            throw new Error(`Insert failed for model ${model}`);
          }
          return result;
        },

        delete: async ({ model, where }: { model: string; where: CleanedWhere[] }) => {
          const table = quoteIdentifier(model);
          const { sql: whereSql, params } = applyWhere(where, getFieldName, model);
          await bindParams(db.prepare(`DELETE FROM ${table}${whereSql}`), params).run();
        },

        deleteMany: async ({ model, where }: { model: string; where: CleanedWhere[] }) => {
          const table = quoteIdentifier(model);
          const { sql: whereSql, params } = applyWhere(where, getFieldName, model);
          const result = await bindParams(
            db.prepare(`DELETE FROM ${table}${whereSql}`),
            params,
          ).run();
          return result.meta.changes ?? ZERO_LENGTH;
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
          sortBy?: { direction: "asc" | "desc"; field: string };
          offset?: number;
        }) => {
          const table = quoteIdentifier(model);
          const { sql: whereSql, params } = applyWhere(where, getFieldName, model);
          let columns = "*";
          if (select && ZERO_LENGTH < select.length) {
            columns = select.map(quoteIdentifier).join(", ");
          }

          let sortSql = "";
          if (sortBy) {
            sortSql = ` ORDER BY ${quoteIdentifier(getFieldName({ field: sortBy.field, model }))} ${sortBy.direction.toUpperCase()}`;
          }
          let limitSql = "";
          if ("number" === typeof limit) {
            limitSql = " LIMIT ?";
          }
          let offsetSql = "";
          if ("number" === typeof offset) {
            offsetSql = " OFFSET ?";
          }

          const query = `SELECT ${columns} FROM ${table}${whereSql}${sortSql}${limitSql}${offsetSql}`;

          const queryParams = [...params];
          if ("number" === typeof limit) {
            queryParams.push(limit);
          }
          if ("number" === typeof offset) {
            queryParams.push(offset);
          }

          const result = await bindParams(db.prepare(query), queryParams).all<T>();
          return result.results ?? [];
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
          const { sql: whereSql, params } = applyWhere(where, getFieldName, model);
          let columns = "*";
          if (select && ZERO_LENGTH < select.length) {
            columns = select.map(quoteIdentifier).join(", ");
          }

          const query = `SELECT ${columns} FROM ${table}${whereSql} LIMIT 1`;
          return await bindParams(db.prepare(query), params).first<T>();
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
          const updateRecord = update as { [key: string]: unknown };
          const keys = Object.keys(updateRecord);
          if (ZERO_LENGTH === keys.length) {
            return null;
          }

          const setSql = keys
            .map((key) => `${quoteIdentifier(getFieldName({ field: key, model }))} = ?`)
            .join(", ");
          const { sql: whereSql, params: whereParams } = applyWhere(where, getFieldName, model);
          const params = [...keys.map((key) => updateRecord[key]), ...whereParams];

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
          update: { [key: string]: unknown };
        }) => {
          const table = quoteIdentifier(model);
          const updateRecord = update as { [key: string]: unknown };
          const keys = Object.keys(updateRecord);
          if (ZERO_LENGTH === keys.length) {
            return ZERO_LENGTH;
          }

          const setSql = keys
            .map((key) => `${quoteIdentifier(getFieldName({ field: key, model }))} = ?`)
            .join(", ");
          const { sql: whereSql, params: whereParams } = applyWhere(where, getFieldName, model);
          const params = [...keys.map((key) => updateRecord[key]), ...whereParams];

          const query = `UPDATE ${table} SET ${setSql}${whereSql}`;
          const result = await bindParams(db.prepare(query), params).run();
          return result.meta.changes ?? ZERO_LENGTH;
        },
      } satisfies CustomAdapter;
    },
    config: {
      adapterId: "cloesce-d1",
      adapterName: "Cloesce D1 Adapter",
      debugLogs: config.debugLogs ?? false,
      supportsArrays: false,
      supportsBooleans: false,
      supportsDates: false,
      supportsJSON: false,
      transaction: false,
      usePlural: false,
    },
  });
