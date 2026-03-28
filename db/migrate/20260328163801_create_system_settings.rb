# frozen_string_literal: true

class CreateSystemSettings < ActiveRecord::Migration[8.1]
  def change
    create_table :system_settings do |t|
      t.string :key, null: false
      t.string :value, null: false

      t.timestamps
    end

    add_index :system_settings, :key, unique: true

    reversible do |dir|
      dir.up do
        execute <<~SQL
          INSERT INTO system_settings (key, value, created_at, updated_at)
          VALUES ('company_coin_target', '300000', NOW(), NOW())
        SQL
      end
    end
  end
end
