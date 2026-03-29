# frozen_string_literal: true

class CreateCompaniesAndAddCompanyId < ActiveRecord::Migration[8.0]
  def change
    create_table :companies do |t|
      t.string :name, null: false

      t.timestamps
    end

    add_column :teams, :company_id, :bigint
    add_column :users, :company_id, :bigint
    add_column :sessions, :company_id, :bigint
    add_column :coin_entries, :company_id, :bigint

    add_index :teams, :company_id
    add_index :users, :company_id
    add_index :sessions, :company_id
    add_index :coin_entries, :company_id

    add_foreign_key :teams, :companies
    add_foreign_key :users, :companies
    add_foreign_key :sessions, :companies
    add_foreign_key :coin_entries, :companies
  end
end
