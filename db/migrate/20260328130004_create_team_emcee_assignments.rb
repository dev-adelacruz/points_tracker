# frozen_string_literal: true

class CreateTeamEmceeAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :team_emcee_assignments do |t|
      t.references :team, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.boolean :active, default: true, null: false

      t.timestamps
    end

    # Only one active emcee assignment per team at a time
    add_index :team_emcee_assignments, :team_id,
      unique: true,
      where: "active = TRUE",
      name: "index_team_emcee_assignments_on_team_id_active"
  end
end
