# frozen_string_literal: true

class CreateCoinEntryAudits < ActiveRecord::Migration[8.1]
  def change
    create_table :coin_entry_audits do |t|
      t.references :coin_entry, null: false, foreign_key: true
      t.integer :previous_coins, null: false
      t.references :edited_by, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
