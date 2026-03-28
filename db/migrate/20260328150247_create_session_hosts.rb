# frozen_string_literal: true

class CreateSessionHosts < ActiveRecord::Migration[8.1]
  def change
    create_table :session_hosts do |t|
      t.references :session, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    add_index :session_hosts, [ :session_id, :user_id ], unique: true
  end
end
