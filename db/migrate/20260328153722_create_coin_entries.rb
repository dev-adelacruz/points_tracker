# frozen_string_literal: true

class CreateCoinEntries < ActiveRecord::Migration[8.1]
  def change
    create_table :coin_entries do |t|
      t.references :session, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :coins, null: false, default: 0

      t.timestamps
    end

    add_index :coin_entries, [ :session_id, :user_id ], unique: true
  end
end
