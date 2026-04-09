# frozen_string_literal: true

class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.bigint :actor_id, null: false
      t.string :action, null: false
      t.string :auditable_type, null: false
      t.bigint :auditable_id, null: false
      t.string :auditable_label
      t.jsonb :changes_data, default: {}
      t.timestamps
    end

    add_index :audit_logs, :actor_id
    add_index :audit_logs, [ :auditable_type, :auditable_id ]
    add_index :audit_logs, :created_at
    add_index :audit_logs, :action
    add_foreign_key :audit_logs, :users, column: :actor_id
  end
end
