/**
 * MJ Programming Language - Abstract Syntax Tree (AST)
 * Creator: Mohamed Khamis
 * Tagline: "Think Beyond Syntax"
 */

import { SourceLocation, Token } from './tokens';

export type NodeType =
  // Expressions
  | 'LiteralExpr'
  | 'IdentifierExpr'
  | 'BinaryExpr'
  | 'UnaryExpr'
  | 'CallExpr'
  | 'MemberExpr'
  | 'IndexExpr'
  | 'AssignExpr'
  | 'ListLiteralExpr'
  | 'MapLiteralExpr'
  | 'FunctionExpr'
  | 'MatchExpr'

  // Statements
  | 'ExprStmt'
  | 'VarDeclStmt'
  | 'FunctionDeclStmt'
  | 'BlockStmt'
  | 'WhenStmt'
  | 'WhileStmt'
  | 'ForInStmt'
  | 'RepeatStmt'
  | 'ReturnStmt'
  | 'BreakStmt'
  | 'ContinueStmt'
  | 'ImportStmt'
  | 'Program';

export interface BaseNode {
  type: NodeType;
  loc: SourceLocation;
}

// ---------------------------------------------------------------------------
// Expressions
// ---------------------------------------------------------------------------

export interface LiteralExpr extends BaseNode {
  type: 'LiteralExpr';
  value: any;
  raw: string;
}

export interface IdentifierExpr extends BaseNode {
  type: 'IdentifierExpr';
  name: string;
}

export interface BinaryExpr extends BaseNode {
  type: 'BinaryExpr';
  left: Expr;
  operator: Token;
  right: Expr;
}

export interface UnaryExpr extends BaseNode {
  type: 'UnaryExpr';
  operator: Token;
  right: Expr;
}

export interface CallExpr extends BaseNode {
  type: 'CallExpr';
  callee: Expr;
  args: Expr[];
}

export interface MemberExpr extends BaseNode {
  type: 'MemberExpr';
  object: Expr;
  property: string;
}

export interface IndexExpr extends BaseNode {
  type: 'IndexExpr';
  object: Expr;
  index: Expr;
}

export interface AssignExpr extends BaseNode {
  type: 'AssignExpr';
  target: IdentifierExpr | MemberExpr | IndexExpr;
  value: Expr;
}

export interface ListLiteralExpr extends BaseNode {
  type: 'ListLiteralExpr';
  elements: Expr[];
}

export interface MapLiteralExpr extends BaseNode {
  type: 'MapLiteralExpr';
  entries: { key: Expr; value: Expr }[];
}

export interface FunctionExpr extends BaseNode {
  type: 'FunctionExpr';
  params: { name: string; type?: string }[];
  returnType?: string;
  body: BlockStmt;
}

export interface MatchArm {
  pattern: Expr | null; // null represents default/wildcard '_'
  isDefault: boolean;
  body: Stmt[] | Expr;
}

export interface MatchExpr extends BaseNode {
  type: 'MatchExpr';
  subject: Expr;
  arms: MatchArm[];
}

export type Expr =
  | LiteralExpr
  | IdentifierExpr
  | BinaryExpr
  | UnaryExpr
  | CallExpr
  | MemberExpr
  | IndexExpr
  | AssignExpr
  | ListLiteralExpr
  | MapLiteralExpr
  | FunctionExpr
  | MatchExpr;

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

export interface ExprStmt extends BaseNode {
  type: 'ExprStmt';
  expression: Expr;
}

export interface VarDeclStmt extends BaseNode {
  type: 'VarDeclStmt';
  isMutable: boolean; // false = val, true = var
  name: string;
  typeAnnotation?: string;
  initializer: Expr;
}

export interface FunctionDeclStmt extends BaseNode {
  type: 'FunctionDeclStmt';
  name: string;
  params: { name: string; type?: string }[];
  returnType?: string;
  body: BlockStmt;
}

export interface BlockStmt extends BaseNode {
  type: 'BlockStmt';
  statements: Stmt[];
}

export interface WhenStmt extends BaseNode {
  type: 'WhenStmt';
  condition: Expr;
  thenBranch: Stmt;
  elseBranch?: Stmt;
}

export interface WhileStmt extends BaseNode {
  type: 'WhileStmt';
  condition: Expr;
  body: Stmt;
}

export interface ForInStmt extends BaseNode {
  type: 'ForInStmt';
  variable: string;
  iterable: Expr;
  body: Stmt;
}

export interface RepeatStmt extends BaseNode {
  type: 'RepeatStmt';
  count: Expr;
  body: Stmt;
}

export interface ReturnStmt extends BaseNode {
  type: 'ReturnStmt';
  value?: Expr;
}

export interface BreakStmt extends BaseNode {
  type: 'BreakStmt';
}

export interface ContinueStmt extends BaseNode {
  type: 'ContinueStmt';
}

export interface ImportStmt extends BaseNode {
  type: 'ImportStmt';
  path: string;
  alias?: string;
}

export interface Program extends BaseNode {
  type: 'Program';
  statements: Stmt[];
  filename: string;
}

export type Stmt =
  | ExprStmt
  | VarDeclStmt
  | FunctionDeclStmt
  | BlockStmt
  | WhenStmt
  | WhileStmt
  | ForInStmt
  | RepeatStmt
  | ReturnStmt
  | BreakStmt
  | ContinueStmt
  | ImportStmt;
