/* eslint-disable */
import {
  GenericId,
  GenericDocument,
  GenericTableInfo,
  GenericDataModel,
} from "convex/values";
import schema from "../schema";

export type Id<TableName extends string> = GenericId<TableName>;
export type Doc<TableName extends string> = GenericDocument<TableName>;
export type TableNames = keyof typeof schema.tables;
export type DataModel = GenericDataModel;
