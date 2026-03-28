# frozen_string_literal: true

class AddDescriptionAndActiveToTeams < ActiveRecord::Migration[8.1]
  def change
    add_column :teams, :description, :text
    add_column :teams, :active, :boolean, default: true, null: false
    add_index :teams, :active
  end
end
