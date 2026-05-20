import type { Document } from "../core/document";

export const erSpecPreset: Document = {
  id: "preset-er-spec",
  key: "er-spec-template",
  title: "ER Specification",
  required: true,
  kind: "er-spec",
  version: "1.0.0",
  sections: [
    {
      id: "section-er-overview",
      key: "overview",
      title: "Overview",
      required: true,
      description: "ER図の概要・目的を記載します",
      fields: [
        {
          id: "field-er-purpose",
          key: "purpose",
          label: "目的",
          required: true,
          valueType: "textarea",
          description: "このER設計書が定義するデータモデルの概要と目的を記載します",
          placeholder: "例: ECサイトの商品・注文管理に必要なデータモデルを定義します。"
        },
        {
          id: "field-er-scope",
          key: "scope",
          label: "対象範囲",
          required: false,
          valueType: "textarea",
          description: "このER設計書がカバーする機能領域・業務範囲を記載します",
          placeholder: "例: 商品管理、在庫管理、注文処理、顧客管理"
        }
      ]
    },
    {
      id: "section-entities",
      key: "entities",
      title: "Entities",
      required: true,
      description: "エンティティ（テーブル）の一覧を定義します",
      fields: [
        {
          id: "field-entities-table",
          key: "entities",
          label: "エンティティ一覧",
          required: true,
          valueType: "table",
          description: "データモデルを構成するエンティティを定義します",
          table: {
            id: "table-entities",
            key: "entities",
            title: "エンティティ一覧",
            required: true,
            columns: [
              {
                id: "col-ent-name",
                key: "entityName",
                label: "エンティティ名",
                required: true,
                valueType: "text",
                description: "エンティティの論理名"
              },
              {
                id: "col-ent-physical",
                key: "physicalName",
                label: "物理名",
                required: true,
                valueType: "text",
                description: "テーブルの物理名（英字）"
              },
              {
                id: "col-ent-description",
                key: "description",
                label: "説明",
                required: true,
                valueType: "text",
                description: "エンティティの役割・概要"
              },
              {
                id: "col-ent-type",
                key: "entityType",
                label: "種別",
                required: true,
                valueType: "enum",
                description: "エンティティの分類",
                options: [
                  { id: "opt-ent-master", value: "master", label: "マスタ" },
                  { id: "opt-ent-transaction", value: "transaction", label: "トランザクション" },
                  { id: "opt-ent-history", value: "history", label: "履歴" },
                  { id: "opt-ent-relation", value: "relation", label: "関連" }
                ]
              },
              {
                id: "col-ent-note",
                key: "note",
                label: "備考",
                required: false,
                valueType: "text"
              }
            ]
          }
        }
      ]
    },
    {
      id: "section-attributes",
      key: "attributes",
      title: "Attributes",
      required: true,
      description: "エンティティの属性（カラム）を定義します",
      fields: [
        {
          id: "field-attributes-table",
          key: "attributes",
          label: "属性一覧",
          required: true,
          valueType: "table",
          description: "各エンティティが持つ属性を定義します",
          table: {
            id: "table-attributes",
            key: "attributes",
            title: "属性一覧",
            required: true,
            columns: [
              {
                id: "col-attr-entity",
                key: "entityName",
                label: "エンティティ名",
                required: true,
                valueType: "text",
                description: "属性が所属するエンティティ"
              },
              {
                id: "col-attr-name",
                key: "attributeName",
                label: "属性名",
                required: true,
                valueType: "text",
                description: "属性の論理名"
              },
              {
                id: "col-attr-physical",
                key: "physicalName",
                label: "物理名",
                required: true,
                valueType: "text",
                description: "カラムの物理名（英字）"
              },
              {
                id: "col-attr-type",
                key: "dataType",
                label: "データ型",
                required: true,
                valueType: "enum",
                description: "属性のデータ型",
                options: [
                  { id: "opt-dt-varchar", value: "VARCHAR", label: "VARCHAR" },
                  { id: "opt-dt-text", value: "TEXT", label: "TEXT" },
                  { id: "opt-dt-int", value: "INTEGER", label: "INTEGER" },
                  { id: "opt-dt-bigint", value: "BIGINT", label: "BIGINT" },
                  { id: "opt-dt-decimal", value: "DECIMAL", label: "DECIMAL" },
                  { id: "opt-dt-boolean", value: "BOOLEAN", label: "BOOLEAN" },
                  { id: "opt-dt-date", value: "DATE", label: "DATE" },
                  { id: "opt-dt-timestamp", value: "TIMESTAMP", label: "TIMESTAMP" },
                  { id: "opt-dt-json", value: "JSON", label: "JSON" }
                ]
              },
              {
                id: "col-attr-length",
                key: "length",
                label: "桁数",
                required: false,
                valueType: "text",
                description: "桁数/精度（例: 255, 10,2）"
              },
              {
                id: "col-attr-pk",
                key: "isPrimaryKey",
                label: "PK",
                required: true,
                valueType: "boolean",
                description: "主キーかどうか"
              },
              {
                id: "col-attr-nullable",
                key: "nullable",
                label: "NULL許可",
                required: true,
                valueType: "boolean",
                description: "NULL値を許可するかどうか"
              },
              {
                id: "col-attr-default",
                key: "defaultValue",
                label: "デフォルト値",
                required: false,
                valueType: "text",
                description: "デフォルト値"
              },
              {
                id: "col-attr-description",
                key: "description",
                label: "説明",
                required: false,
                valueType: "text",
                description: "属性の説明"
              }
            ]
          }
        }
      ]
    },
    {
      id: "section-relationships",
      key: "relationships",
      title: "Relationships",
      required: true,
      description: "エンティティ間の関連を定義します",
      fields: [
        {
          id: "field-relationships-table",
          key: "relationships",
          label: "リレーション一覧",
          required: true,
          valueType: "table",
          description: "エンティティ間の関連を定義します",
          table: {
            id: "table-relationships",
            key: "relationships",
            title: "リレーション一覧",
            required: true,
            columns: [
              {
                id: "col-rel-name",
                key: "relationName",
                label: "リレーション名",
                required: true,
                valueType: "text",
                description: "関連の名称"
              },
              {
                id: "col-rel-parent",
                key: "parentEntity",
                label: "親エンティティ",
                required: true,
                valueType: "text",
                description: "参照される側のエンティティ"
              },
              {
                id: "col-rel-child",
                key: "childEntity",
                label: "子エンティティ",
                required: true,
                valueType: "text",
                description: "参照する側のエンティティ"
              },
              {
                id: "col-rel-cardinality",
                key: "cardinality",
                label: "カーディナリティ",
                required: true,
                valueType: "enum",
                description: "関連の多重度",
                options: [
                  { id: "opt-card-1-1", value: "1:1", label: "1:1" },
                  { id: "opt-card-1-n", value: "1:N", label: "1:N" },
                  { id: "opt-card-n-1", value: "N:1", label: "N:1" },
                  { id: "opt-card-n-m", value: "N:M", label: "N:M" }
                ]
              },
              {
                id: "col-rel-fk",
                key: "foreignKey",
                label: "外部キー",
                required: true,
                valueType: "text",
                description: "子エンティティの外部キーカラム"
              },
              {
                id: "col-rel-constraint",
                key: "constraintType",
                label: "制約",
                required: false,
                valueType: "enum",
                description: "外部キー制約の種類",
                options: [
                  { id: "opt-const-cascade", value: "CASCADE", label: "CASCADE" },
                  { id: "opt-const-restrict", value: "RESTRICT", label: "RESTRICT" },
                  { id: "opt-const-setnull", value: "SET NULL", label: "SET NULL" },
                  { id: "opt-const-noaction", value: "NO ACTION", label: "NO ACTION" }
                ]
              },
              {
                id: "col-rel-note",
                key: "note",
                label: "備考",
                required: false,
                valueType: "text"
              }
            ]
          }
        }
      ]
    },
    {
      id: "section-indexes",
      key: "indexes",
      title: "Indexes",
      required: false,
      description: "インデックスの定義",
      fields: [
        {
          id: "field-indexes-table",
          key: "indexes",
          label: "インデックス一覧",
          required: false,
          valueType: "table",
          description: "パフォーマンス向上のためのインデックスを定義します",
          table: {
            id: "table-indexes",
            key: "indexes",
            title: "インデックス一覧",
            required: false,
            columns: [
              {
                id: "col-idx-name",
                key: "indexName",
                label: "インデックス名",
                required: true,
                valueType: "text",
                description: "インデックスの名称"
              },
              {
                id: "col-idx-entity",
                key: "entityName",
                label: "エンティティ名",
                required: true,
                valueType: "text",
                description: "インデックスを設定するエンティティ"
              },
              {
                id: "col-idx-columns",
                key: "columns",
                label: "対象カラム",
                required: true,
                valueType: "text",
                description: "インデックス対象のカラム（複合キーはカンマ区切り）"
              },
              {
                id: "col-idx-unique",
                key: "isUnique",
                label: "UNIQUE",
                required: true,
                valueType: "boolean",
                description: "ユニークインデックスかどうか"
              },
              {
                id: "col-idx-purpose",
                key: "purpose",
                label: "目的",
                required: false,
                valueType: "text",
                description: "インデックスの目的・用途"
              }
            ]
          }
        }
      ]
    }
  ]
};
