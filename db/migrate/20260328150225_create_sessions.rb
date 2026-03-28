# frozen_string_literal: true

class CreateSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :sessions do |t|
      t.date :date, null: false
      t.integer :session_slot, null: false
      t.references :team, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end

    # Prevent duplicate session for same date + slot + primary team
    add_index :sessions, [ :date, :session_slot, :team_id ], unique: true,
      name: "index_sessions_on_date_slot_team"
  end
end
